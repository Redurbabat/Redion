import { BrowserWindow, nativeImage } from 'electron';
import { fault } from './automation-contract.cjs';
import { MAX_IMAGE_BYTES, type ImageMetadata } from './visual-artifacts.cjs';
type Rect={x:number;y:number;width:number;height:number};
const rect=(value:unknown):Rect=>{
  const r=value as Rect;
  if(!r||![r.x,r.y,r.width,r.height].every(Number.isFinite)||r.x<0||r.y<0||r.width<1||r.height<1||
    r.x+r.width>16384||r.y+r.height>16384)throw fault('INVALID_REGION','Der Bildausschnitt liegt nicht in der Redion-Fläche.');
  return {x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width),height:Math.ceil(r.height)};
};
/** Nur webContents des eigenen Hauptfensters; kein desktopCapturer und keine freien Pfade. */
export class VisualCapture {
  private previews=new Set<BrowserWindow>();
  constructor(private readonly getWindow:()=>BrowserWindow|null,
    private readonly geometry:(input:Record<string,unknown>)=>Promise<Record<string,unknown>>) {}
  preview(id:unknown):BrowserWindow|null {return [...this.previews].find(window=>window.id===id&&!window.isDestroyed())||null;}
  cancel():void {for(const preview of this.previews)if(!preview.isDestroyed())preview.destroy();this.previews.clear();}
  async capture(input:Record<string,unknown>,check:()=>void,confirm:(title:string,detail:string,previewId?:number)=>Promise<boolean>,confirmImage:boolean):
    Promise<{bytes:Buffer;info:Omit<ImageMetadata,'artifactId'|'bytes'|'sha256'|'expires'>}> {
    try{return await this.capturePrepared(input,check,confirm,confirmImage);}
    finally{await this.geometry({phase:'release'}).catch(()=>{});}
  }
  private async capturePrepared(input:Record<string,unknown>,check:()=>void,confirm:(title:string,detail:string,previewId?:number)=>Promise<boolean>,confirmImage:boolean):
    Promise<{bytes:Buffer;info:Omit<ImageMetadata,'artifactId'|'bytes'|'sha256'|'expires'>}> {
    const window=this.getWindow();if(!window||window.isDestroyed()||window.webContents.isDestroyed())throw fault('APP_NOT_READY','Das Redion-Fenster ist nicht verfügbar.');
    check();
    let geometry:Record<string,unknown>={};
    let region:Rect={x:0,y:0,width:1,height:1};
    let masks:Rect[]=[];
    let captured=nativeImage.createEmpty();
    /* Layout und Electron-capturePage können im gleichen Frame die Fläche
       um wenige Pixel verschieben. Statt die Bildfreigabe ohne Prüfung zu
       umgehen, eine frische Aufnahme mit frisch gemessenen Masken versuchen.
       Seitenwechsel bleiben immer hart gesperrt; maximal drei Versuche. */
    for(let attempt=0;attempt<3;attempt++){
      geometry=await this.geometry(input);check();
      const source=rect(geometry.rect),viewport=rect(geometry.viewport);
      if(source.x+source.width>viewport.width||source.y+source.height>viewport.height||
        !Array.isArray(geometry.masks)||geometry.masks.length>500)
        throw fault('INVALID_REGION','Die Redion-Fläche hat sich geändert.');
      masks=geometry.masks.map(rect);
      const crop=input.crop===undefined?{x:0,y:0,width:source.width,height:source.height}:rect(input.crop);
      if(crop.x+crop.width>source.width||crop.y+crop.height>source.height)
        throw fault('INVALID_REGION','Der Ausschnitt liegt ausserhalb des gewählten Bereichs.');
      region={x:source.x+crop.x,y:source.y+crop.y,width:crop.width,height:crop.height};
      captured=await window.webContents.capturePage(region,{stayHidden:true});check();
      const after=await this.geometry(input);check();
      if(geometry.documentId!==after.documentId||geometry.blockId!==after.blockId)
        throw fault('STALE_DOCUMENT','Die sichtbare Seite wurde während der Aufnahme gewechselt.');
      const beforeLayout=JSON.stringify([geometry.rect,geometry.viewport,geometry.masks]);
      const afterLayout=JSON.stringify([after.rect,after.viewport,after.masks]);
      if(beforeLayout===afterLayout)break;
      if(attempt===2)throw fault('STALE_DOCUMENT','Die sichtbare Fläche hat sich während der Aufnahme geändert.');
    }
    if(captured.isEmpty())throw fault('IMAGE_UNAVAILABLE','Redion konnte kein Bild dieser Fläche aufnehmen.');
    const size=captured.getSize(),bitmap=captured.toBitmap();
    if(size.width<1||size.height<1||size.width*size.height>32*1024*1024||bitmap.length!==size.width*size.height*4)
      throw fault('IMAGE_TOO_LARGE','Das Fensterbild überschreitet die erlaubte Grösse.');
    // Vor Skalierung/Kompression überschreiben; Rand schützt gegen Antialiasing.
    const sx=size.width/region.width,sy=size.height/region.height;
    for(const mask of masks) {
      const left=Math.max(0,Math.floor((mask.x-region.x-3)*sx)),top=Math.max(0,Math.floor((mask.y-region.y-3)*sy));
      const right=Math.min(size.width,Math.ceil((mask.x+mask.width-region.x+3)*sx)),bottom=Math.min(size.height,Math.ceil((mask.y+mask.height-region.y+3)*sy));
      if(right<=left||bottom<=top)continue;
      for(let y=top;y<bottom;y++)bitmap.fill(255,(y*size.width+left)*4,(y*size.width+right)*4);
    }
    let image=nativeImage.createFromBitmap(bitmap,{width:size.width,height:size.height});bitmap.fill(0);
    const maxEdge=Number(input.maxEdge||1600),factor=Math.min(1,maxEdge/Math.max(size.width,size.height));
    image=image.resize({width:Math.max(1,Math.round(size.width*factor)),height:Math.max(1,Math.round(size.height*factor)),quality:'best'});
    let bytes=image.toPNG(),mimeType:'image/png'|'image/jpeg'='image/png';
    if(bytes.length>MAX_IMAGE_BYTES){bytes.fill(0);bytes=image.toJPEG(85);mimeType='image/jpeg';}
    if(bytes.length>MAX_IMAGE_BYTES){bytes.fill(0);throw fault('IMAGE_TOO_LARGE','Bitte einen kleineren Bildausschnitt wählen.');}
    const dimensions=image.getSize();
    this.cancel();
    const preview=new BrowserWindow({title:'RED Ion · Bildfreigabe',width:900,height:680,parent:window,show:false,autoHideMenuBar:true,
      webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true,devTools:false}});
    this.previews.add(preview);preview.on('closed',()=>this.previews.delete(preview));preview.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    const html='<!doctype html><html lang="de"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'"><title>RED Ion · Bildfreigabe</title><style>body{margin:0;padding:20px;background:#202124;color:#fff;font:16px system-ui}p{margin:0 0 16px}img{display:block;max-width:100%;max-height:calc(100vh - 110px);margin:auto;background:white}</style><p>Dieses maskierte Bild wird an deinen freigegebenen KI-Client übertragen. Fensterinhalt: RED Ion.</p><img alt="Vorschau der freigegebenen Redion-Aufnahme" src="data:'+mimeType+';base64,'+bytes.toString('base64')+'">';
    let keep=false;
    try {
      await preview.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent(html));check();
      preview.webContents.on('will-navigate',event=>event.preventDefault());preview.show();
      if(confirmImage&&!await confirm('Dieses Redion-Bild übertragen?','Prüfe die separate Bildvorschau. Maskierte Formularfelder werden nicht übertragen. Einzelbestätigungen kannst du in Einstellungen → MCP ändern.',preview.id))
        throw fault('CONSENT_DENIED','Das Bild wurde nicht freigegeben.');
      check();if(preview.isDestroyed())throw fault('CONSENT_DENIED','Die Bildvorschau wurde geschlossen.');
      if(!confirmImage){keep=true;const timer=setTimeout(()=>{if(!preview.isDestroyed())preview.destroy();},7000);timer.unref();}
      return {bytes,info:{mimeType,width:dimensions.width,height:dimensions.height,target:String(input.target),
        ...(typeof geometry.documentId==='string'?{documentId:geometry.documentId}:{}),
        ...(typeof geometry.blockId==='string'?{blockId:geometry.blockId}:{})}};
    }catch(error){bytes.fill(0);throw error;}
    finally{if(!keep&&!preview.isDestroyed())preview.destroy();}
  }
}
