import { BoardModel, bounds, bounded, center, clone, createShape, expandGroups, hit, inside, moveObjects, point, readSettings, tools, without, worldPoint, zoomAt } from './model.js';
import type { Board, Point, Settings, Shape, Tool } from './model.js';

export type CanvasCommand = 'undo'|'redo'|'delete'|'copy'|'paste'|'group'|'ungroup'|'front'|'back'|'rotate'|'grow'|'shrink'|'zoomIn'|'zoomOut'|'reset';
export interface CanvasOptions {
  host: HTMLElement;
  documentId: string;
  initial?: unknown;
  settings?: unknown;
  theme?: 'light'|'dark';
  onCommand?: (command:CanvasCommand)=>void;
  onChange?: (board:Board)=>void;
  onSettings?: (settings:Settings)=>void;
  onError?: (error:unknown)=>void;
}
type View={x:number;y:number;zoom:number};
type Gesture={id:number;tool:Tool;start:Point;screen:Point;points:Point[];original:Shape[];view:View;preview:Shape[];selected:Set<string>;draftId:string};
const uid=()=>globalThis.crypto?.randomUUID?.()??'a2-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const labels:Record<Tool,string>={select:'Auswahl',lasso:'Lasso',hand:'Hand',pen:'Stift',marker:'Marker',eraser:'Radierer',line:'Linie',arrow:'Pfeil',rectangle:'Rechteck',ellipse:'Ellipse',circle:'Kreis',freeform:'Freihandform',text:'Text',note:'Haftnotiz',connector:'Verbinder',mindmap:'Mindmap-Knoten',image:'Bild'};
const icons:Record<Tool,string>={select:'↖',lasso:'⌁',hand:'✋',pen:'✎',marker:'▰',eraser:'◇',line:'╱',arrow:'→',rectangle:'□',ellipse:'⬭',circle:'○',freeform:'♧',text:'T',note:'▤',connector:'↔',mindmap:'⑂',image:'▧'};
export class CanvasAdapter {
  readonly surface:HTMLCanvasElement;
  readonly dock:DrawingDock;
  readonly root:HTMLDivElement;
  private ctx:CanvasRenderingContext2D;
  private model:BoardModel;
  private abort=new AbortController();
  private observer:ResizeObserver|null=null;
  private settings:Settings;
  private theme:'light'|'dark';
  private view:View={x:0,y:0,zoom:1};
  private selection=new Set<string>();
  private gesture:Gesture|null=null;
  private clipboard:Shape[]=[];
  private images=new Map<string,HTMLImageElement>();
  private cssWidth=1;
  private cssHeight=1;
  private dpr=1;
  private dead=false;
  private frame=0;
  private options:CanvasOptions;
  constructor(options:CanvasOptions){
    this.options=options;
    this.model=new BoardModel(options.documentId,options.initial);
    this.settings=readSettings(options.settings);this.theme=options.theme??'light';
    const d=options.host.ownerDocument;
    this.root=d.createElement('div');this.root.className='a2-canvas';
    Object.assign(this.root.style,{position:'relative',width:'100%',height:'100%',minHeight:'240px',overflow:'hidden',isolation:'isolate'});
    this.surface=d.createElement('canvas');this.surface.tabIndex=0;
    this.surface.setAttribute('aria-label','Zeichenfläche. Werkzeuge über das Dock oder Tastatur auswählen.');
    Object.assign(this.surface.style,{display:'block',width:'100%',height:'100%',touchAction:'none',outlineOffset:'-3px'});
    const ctx=this.surface.getContext('2d');if(!ctx)throw Error('Canvas nicht verfügbar');this.ctx=ctx;
    this.root.append(this.surface);options.host.append(this.root);
    this.dock=new DrawingDock(this);
    this.setTheme(this.theme);
    const signal=this.abort.signal;
    this.surface.addEventListener('pointerdown',e=>this.start(e),{signal});
    this.surface.addEventListener('pointermove',e=>this.move(e),{signal});
    this.surface.addEventListener('pointerup',e=>this.end(e),{signal});
    this.surface.addEventListener('pointercancel',e=>this.cancelPointer(e),{signal});
    this.surface.addEventListener('lostpointercapture',e=>this.cancelPointer(e),{signal});
    this.surface.addEventListener('wheel',e=>{
      e.preventDefault();if(this.gesture)return;
      if(e.ctrlKey||e.metaKey){this.view=zoomAt(this.screen(e),this.view,Math.exp(-e.deltaY*.005));}
      else{this.view.x-=e.deltaX;this.view.y-=e.deltaY;}
      this.redraw();
    },{signal,passive:false});
    this.surface.addEventListener('keydown',e=>this.key(e),{signal});
    if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(this.root);}
    this.resize();
  }
  getSettings():Settings{return clone(this.settings);}
  getView():View{return {...this.view};}
  setTheme(theme:'light'|'dark'):void{this.theme=theme;this.root.style.colorScheme=theme;this.root.dataset.theme=theme;this.dock.refresh();this.redraw();}
  updateSettings(patch:Partial<Settings>):void{
    if(this.dead)return;if(patch.tool&&patch.tool!==this.settings.tool)this.cancel();
    this.settings=readSettings({...this.settings,...patch});this.dock.refresh();this.redraw();
    this.options.onSettings?.(this.getSettings());
  }
  serialize():Board{return this.model.serialize();}
  import(value:unknown):void{if(this.dead)return;this.cancel();this.selection.clear();this.commit(()=>this.model.import(value));}
  exportJSON():string{return JSON.stringify(this.serialize());}
  exportPNG():string{if(this.dead)throw Error('Zeichenfläche geschlossen');this.draw();return this.surface.toDataURL('image/png');}
  private resize():void{
    if(this.dead)return;
    this.cssWidth=Math.max(1,this.root.clientWidth);this.cssHeight=Math.max(1,this.root.clientHeight);
    this.dpr=Math.min(2,this.root.ownerDocument.defaultView?.devicePixelRatio??1,4096/Math.max(this.cssWidth,this.cssHeight));
    this.surface.width=Math.max(1,Math.round(this.cssWidth*this.dpr));this.surface.height=Math.max(1,Math.round(this.cssHeight*this.dpr));
    this.dock.refresh();this.redraw();
  }
  private screen(e:{clientX:number;clientY:number;pressure?:number;pointerType?:string}):Point{
    const r=this.surface.getBoundingClientRect();return point(e.clientX-r.left,e.clientY-r.top,e.pointerType==='pen'?bounded(e.pressure??.5,0,1):.5);
  }
  private world(e:PointerEvent):Point{
    const p=worldPoint(this.screen(e),this.view);
    return this.settings.snap&& !['pen','marker','freeform','lasso','eraser','hand','select'].includes(this.settings.tool)?point(Math.round(p.x/20)*20,Math.round(p.y/20)*20,p.pressure):p;
  }
  private objects():Shape[]{return this.model.serialize().objects;}
  private pick(objects:Shape[],p:Point):Shape|undefined{
    return [...objects].reverse().find(o=>hit(this.resolve(o,objects),p,6/this.view.zoom));
  }
  private resolve(o:Shape,objects:Shape[]):Shape{
    if(o.kind!=='connector')return o;
    const a=objects.find(v=>v.id===o.from&&v.kind!=='connector'),b=objects.find(v=>v.id===o.to&&v.kind!=='connector');
    return {...o,points:[a?center(a):o.points[0]??point(0,0),b?center(b):o.points[o.points.length-1]??point(0,0)]};
  }
  private start(e:PointerEvent):void{
    if(this.dead||this.gesture||e.button!==0||this.settings.tool==='image')return;
    e.preventDefault();this.surface.focus({preventScroll:true});
    try{this.surface.setPointerCapture(e.pointerId);}catch{/* synthetische Ereignisse */}
    const p=this.world(e),original=this.objects(),tool=this.settings.tool;
    if(tool==='select'){
      const picked=this.pick(original,p);
      if(picked){if(!e.shiftKey&&!this.selection.has(picked.id))this.selection.clear();if(e.shiftKey&&this.selection.has(picked.id))this.selection.delete(picked.id);else this.selection.add(picked.id);this.selection=expandGroups(original,this.selection);}
      else if(!e.shiftKey)this.selection.clear();
    }
    this.gesture={id:e.pointerId,tool,start:p,screen:this.screen(e),points:[p],original,view:{...this.view},preview:original,selected:new Set(this.selection),draftId:uid()};
    this.move(e);
  }
  private move(e:PointerEvent):void{
    const g=this.gesture;if(!g||g.id!==e.pointerId)return;
    const p=this.world(e);
    if(g.tool==='hand'){const s=this.screen(e);this.view={...g.view,x:g.view.x+s.x-g.screen.x,y:g.view.y+s.y-g.screen.y};}
    else if(g.tool==='select'){g.preview=moveObjects(g.original,g.selected,p.x-g.start.x,p.y-g.start.y);}
    else if(g.tool==='eraser'){
      const picked=this.pick(g.preview,p);if(picked)g.preview=without(g.preview,new Set([picked.id]));
    }else if(g.tool==='lasso'||g.tool==='pen'||g.tool==='marker'||g.tool==='freeform'){
      if(g.points.length<10000)g.points.push(p);
      if(g.tool!=='lasso')g.preview=[...g.original,createShape(g.draftId,g.tool,g.points,this.settings)];
    }else{
      let end=p;
      if(g.tool==='circle'){const size=Math.max(Math.abs(p.x-g.start.x),Math.abs(p.y-g.start.y));end=point(g.start.x+size*(p.x<g.start.x?-1:1),g.start.y+size*(p.y<g.start.y?-1:1));}
      if(['text','note','mindmap'].includes(g.tool)&&Math.hypot(p.x-g.start.x,p.y-g.start.y)<5)end=point(g.start.x+160,g.start.y+72);
      const o=createShape(g.draftId,g.tool,[g.start,end],this.settings);
      if(g.tool==='connector'){
        const a=this.pick(g.original,g.start),b=this.pick(g.original,p);
        if(a&&a.kind!=='connector')o.from=a.id;if(b&&b.kind!=='connector'&&b.id!==o.from)o.to=b.id;
      }
      if(g.tool==='note')o.text='Haftnotiz';if(g.tool==='mindmap')o.text='Knoten';if(g.tool==='text')o.text='Text';
      g.preview=[...g.original,o];
    }
    this.redraw();
  }
  private end(e:PointerEvent):void{
    const g=this.gesture;if(!g||g.id!==e.pointerId)return;this.move(e);this.gesture=null;
    if(g.tool==='lasso'){this.selection=expandGroups(g.original,new Set(g.original.filter(o=>inside(center(o),g.points)).map(o=>o.id)));}
    else if(g.tool!=='hand'){
      if(!['select','eraser'].includes(g.tool))this.selection=new Set([g.draftId]);
      this.commit(()=>this.model.replace(g.preview));
    }
    this.release(g.id);this.redraw();
  }
  private release(id:number):void{try{if(this.surface.hasPointerCapture(id))this.surface.releasePointerCapture(id);}catch{/* bereits beendet */}}
  private cancelPointer(e:PointerEvent):void{if(this.gesture?.id===e.pointerId)this.cancel();}
  cancel():void{const g=this.gesture;if(!g)return;this.gesture=null;this.view=g.view;this.selection=g.selected;this.release(g.id);this.redraw();}
  private commit(action:()=>boolean):void{
    let changed=false;
    try{changed=action();}catch(e){this.options.onError?.(e);this.redraw();return;}
    if(changed){const board=this.serialize();this.selection=new Set(board.objects.filter(o=>this.selection.has(o.id)).map(o=>o.id));this.redraw();this.options.onChange?.(board);}
    else this.redraw();
  }
  editText(text:string):void{
    const selected=this.selection;this.commit(()=>this.model.replace(this.objects().map(o=>selected.has(o.id)&&['text','note','mindmap'].includes(o.kind)?{...o,text:text.slice(0,10000)}:o)));
  }
  async addImage(file:File):Promise<void>{
    if(this.dead)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>1_400_000)throw Error('Nur PNG, JPEG oder WebP bis 1,4 MB');
    const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});
    if(this.dead)return;
    const p=worldPoint(point(this.cssWidth/2,this.cssHeight/2),this.view);
    const o=createShape(uid(),'image',[p,point(p.x+240,p.y+180)],this.settings);o.image=data;
    this.selection=new Set([o.id]);this.commit(()=>this.model.replace([...this.objects(),o]));
  }
  command(cmd:CanvasCommand):void{
    if(this.dead)return;this.cancel();const objects=this.objects(),ids=this.selection;
    switch(cmd){
      case 'undo':this.commit(()=>this.model.undo());break;
      case 'redo':this.commit(()=>this.model.redo());break;
      case 'delete':this.commit(()=>this.model.replace(without(objects,ids)));break;
      case 'copy':this.clipboard=clone(objects.filter(o=>ids.has(o.id)));break;
      case 'paste':{
        const mapping=new Map(this.clipboard.map(o=>[o.id,uid()]));
        const groups=new Map(this.clipboard.filter(o=>o.group).map(o=>[o.group,uid()]));
        const pasted=moveObjects(this.clipboard,new Set(this.clipboard.map(o=>o.id)),20,20).map(o=>({...o,id:mapping.get(o.id)??uid(),group:groups.get(o.group)??'',from:mapping.get(o.from)??'',to:mapping.get(o.to)??''}));
        this.selection=new Set(pasted.map(o=>o.id));this.commit(()=>this.model.replace([...objects,...pasted]));break;
      }
      case 'group':case 'ungroup':{
        const group=cmd==='group'?uid():'';
        this.commit(()=>this.model.replace(objects.map(o=>ids.has(o.id)?{...o,group}:o)));break;
      }
      case 'front':case 'back':{
        const chosen=objects.filter(o=>ids.has(o.id)),other=objects.filter(o=>!ids.has(o.id));
        this.commit(()=>this.model.replace(cmd==='front'?[...other,...chosen]:[...chosen,...other]));break;
      }
      case 'rotate':this.commit(()=>this.model.replace(objects.map(o=>ids.has(o.id)?{...o,rotation:(o.rotation+15)%360}:o)));break;
      case 'grow':case 'shrink':{
        const factor=cmd==='grow'?1.1:1/1.1;
        this.commit(()=>this.model.replace(objects.map(o=>{if(!ids.has(o.id))return o;const c=center(o);return {...o,points:o.points.map(p=>({...p,x:c.x+(p.x-c.x)*factor,y:c.y+(p.y-c.y)*factor}))};})));break;
      }
      case 'zoomIn':case 'zoomOut':this.view=zoomAt(point(this.cssWidth/2,this.cssHeight/2),this.view,cmd==='zoomIn'?1.2:1/1.2);break;
      case 'reset':this.view={x:0,y:0,zoom:1};break;
    }
    this.redraw();this.options.onCommand?.(cmd);
  }
  onError(error:unknown):void{this.options.onError?.(error);}
  private key(e:KeyboardEvent):void{
    const key=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
    const shortcuts:Record<string,Tool>={v:'select',l:'lasso',h:'hand',p:'pen',m:'marker',e:'eraser',r:'rectangle',o:'ellipse',t:'text',a:'arrow'};
    if(key==='escape'){this.cancel();this.selection.clear();this.redraw();}
    else if(mod&&key==='z')this.command(e.shiftKey?'redo':'undo');
    else if(mod&&key==='y')this.command('redo');
    else if(mod&&key==='c')this.command('copy');
    else if(mod&&key==='v')this.command('paste');
    else if(mod&&key==='g')this.command(e.shiftKey?'ungroup':'group');
    else if(key==='delete'||key==='backspace')this.command('delete');
    else if(!mod&&!e.altKey&&shortcuts[key])this.updateSettings({tool:shortcuts[key]!});
    else if(key==='+'||key==='=')this.command('zoomIn');
    else if(key==='-')this.command('zoomOut');
    else return;
    e.preventDefault();e.stopPropagation();
  }
  private redraw():void{
    if(this.dead||this.frame)return;
    const w=this.root.ownerDocument.defaultView;
    if(w)this.frame=w.requestAnimationFrame(()=>{this.frame=0;this.draw();});else this.draw();
  }
  private draw():void{
    if(this.dead)return;
    const c=this.ctx,{x,y,zoom}=this.view;
    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle=this.theme==='dark'?'#17191e':'#f8fafc';c.fillRect(0,0,this.cssWidth,this.cssHeight);
    if(this.settings.grid&&zoom>=.25){
      const step=20*zoom;c.fillStyle=this.theme==='dark'?'#454954':'#cbd5e1';
      for(let gx=((x%step)+step)%step;gx<this.cssWidth;gx+=step)for(let gy=((y%step)+step)%step;gy<this.cssHeight;gy+=step)c.fillRect(gx,gy,1,1);
    }
    c.translate(x,y);c.scale(zoom,zoom);
    const objects=this.gesture?.preview??this.objects();
    const used=new Set(objects.filter(o=>o.image).map(o=>o.image));
    for(const [key,img] of this.images)if(!used.has(key)){img.onload=null;this.images.delete(key);}
    for(const raw of objects){
      const o=this.resolve(raw,objects),b=bounds(o),mid=center(o);
      c.save();c.globalAlpha=o.opacity;c.strokeStyle=o.color;c.fillStyle=o.color;c.lineWidth=o.width;c.lineCap='round';c.lineJoin='round';
      c.translate(mid.x,mid.y);c.rotate(o.rotation*Math.PI/180);c.translate(-mid.x,-mid.y);
      const first=o.points[0],last=o.points[o.points.length-1];
      if(!first||!last){c.restore();continue;}
      if(['pen','marker','freeform','line','arrow','connector'].includes(o.kind)){
        if(o.kind==='pen'){
          for(let i=0;i<o.points.length;i++){const p=o.points[i];if(!p)continue;const prev=o.points[i-1]??p;c.lineWidth=o.width*(.3+.7*p.pressure);c.beginPath();c.moveTo(prev.x,prev.y);c.lineTo(p.x+.001,p.y);c.stroke();}
        }else{
          c.beginPath();c.moveTo(first.x,first.y);for(const p of o.points)c.lineTo(p.x,p.y);if(o.kind==='freeform')c.closePath();c.stroke();
        }
        if(o.kind==='arrow'||o.kind==='connector'){
          const a=Math.atan2(last.y-first.y,last.x-first.x),size=Math.max(12,o.width*3);c.beginPath();c.moveTo(last.x-size*Math.cos(a-.5),last.y-size*Math.sin(a-.5));c.lineTo(last.x,last.y);c.lineTo(last.x-size*Math.cos(a+.5),last.y-size*Math.sin(a+.5));c.stroke();
        }
      }else if(o.kind==='circle'||o.kind==='ellipse'){c.beginPath();c.ellipse(mid.x,mid.y,b.w/2,b.h/2,0,0,Math.PI*2);c.stroke();}
      else if(o.kind==='rectangle'){c.strokeRect(b.x,b.y,b.w,b.h);}
      else if(o.kind==='image'){
        let img=this.images.get(o.image);
        if(!img&&o.image){img=this.root.ownerDocument.createElement('img');img.onload=()=>this.redraw();img.src=o.image;this.images.set(o.image,img);}
        if(img?.complete&&img.naturalWidth)c.drawImage(img,b.x,b.y,b.w,b.h);else c.strokeRect(b.x,b.y,b.w,b.h);
      }else{
        if(o.kind==='note'){c.fillStyle='#fde68a';c.fillRect(b.x,b.y,b.w,b.h);c.fillStyle='#1f2937';}
        if(o.kind==='mindmap')c.strokeRect(b.x,b.y,b.w,b.h);
        c.font='16px system-ui';c.textBaseline='top';c.beginPath();c.rect(b.x,b.y,b.w,b.h);c.clip();
        o.text.split('\n').forEach((line,i)=>c.fillText(line,b.x+6,b.y+6+i*20,Math.max(1,b.w-12)));
      }
      c.restore();
      if(this.selection.has(o.id)){c.save();c.strokeStyle='#2563eb';c.lineWidth=1/zoom;c.setLineDash([5/zoom,3/zoom]);c.strokeRect(b.x-4/zoom,b.y-4/zoom,b.w+8/zoom,b.h+8/zoom);c.restore();}
    }
    if(this.gesture?.tool==='lasso'){c.beginPath();c.strokeStyle='#2563eb';c.lineWidth=1/zoom;c.setLineDash([5/zoom,3/zoom]);const pts=this.gesture.points;const p=pts[0];if(p){c.moveTo(p.x,p.y);for(const v of pts)c.lineTo(v.x,v.y);c.stroke();}c.setLineDash([]);}
  }
  dispose():void{
    if(this.dead)return;this.cancel();this.dead=true;this.abort.abort();this.observer?.disconnect();this.dock.dispose();
    this.root.ownerDocument.defaultView?.cancelAnimationFrame(this.frame);for(const img of this.images.values())img.onload=null;this.images.clear();this.root.remove();
  }
}

// Ein bestehender PDF-/Elektro-Host kann die Leiste ohne neues Zeichenmodell nutzen.
export interface DrawingDockHost {
  root: HTMLElement;
  getSettings(): Settings;
  updateSettings(patch: Partial<Settings>): void;
  command(command: CanvasCommand): void;
  editText?(text: string): void;
  addImage?(file: File): Promise<void>;
  supportedTools?: readonly Tool[];
  supportedCommands?: readonly CanvasCommand[];
  supportedSettings?: readonly (keyof Settings)[];
  onError?(error:unknown): void;
}
export class DrawingDock {
  readonly element:HTMLDivElement;
  private body:HTMLDivElement;
  private handle:HTMLButtonElement;
  private buttons=new Map<Tool,HTMLButtonElement>();
  private abort=new AbortController();
  private color:HTMLInputElement;
  private width:HTMLInputElement;
  private opacity:HTMLInputElement;
  private grid:HTMLInputElement;
  private snap:HTMLInputElement;
  private toggle:HTMLButtonElement;
  private orientation:HTMLButtonElement;
  private drag:{id:number;x:number;y:number;left:number;top:number}|null=null;
  private adapter:DrawingDockHost;
  constructor(adapter:DrawingDockHost){
    this.adapter=adapter;
    const d=adapter.root.ownerDocument,signal=this.abort.signal;
    this.element=d.createElement('div');this.element.setAttribute('role','group');this.element.setAttribute('aria-label','Zeichnen-Dock');
    Object.assign(this.element.style,{position:'absolute',zIndex:'2',display:'flex',flexDirection:'column',gap:'4px',padding:'6px',border:'1px solid',borderRadius:'16px',boxShadow:'0 8px 24px #0003',maxWidth:'calc(100% - 16px)',maxHeight:'min(45%, calc(100% - 16px))',boxSizing:'border-box',overflow:'auto',font:'13px system-ui'});
    const header=d.createElement('div');header.style.display='flex';header.style.gap='4px';
    this.handle=this.button('⋮⋮','Dock verschieben',()=>{});this.handle.style.touchAction='none';
    this.handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;const s=adapter.getSettings();this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:s.x,top:s.y};try{this.handle.setPointerCapture(e.pointerId);}catch{/* synthetisch */}},{signal});
    this.handle.addEventListener('pointermove',e=>{const g=this.drag;if(g?.id===e.pointerId)adapter.updateSettings({x:bounded(g.left+e.clientX-g.x,0,Math.max(0,adapter.root.clientWidth-this.element.offsetWidth)),y:bounded(g.top+e.clientY-g.y,0,Math.max(0,adapter.root.clientHeight-this.element.offsetHeight))});},{signal});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])this.handle.addEventListener(name,()=>{this.drag=null;},{signal});
    this.handle.addEventListener('keydown',e=>{const s=adapter.getSettings(),delta:Record<string,number[]>={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]};const v=delta[e.key];if(v){e.preventDefault();adapter.updateSettings({x:bounded(s.x+(v[0]??0),0,Math.max(0,adapter.root.clientWidth-this.element.offsetWidth)),y:bounded(s.y+(v[1]??0),0,Math.max(0,adapter.root.clientHeight-this.element.offsetHeight))});}},{signal});
    this.orientation=this.button('↕','Ausrichtung wechseln',()=>adapter.updateSettings({vertical:!adapter.getSettings().vertical}));
    this.toggle=this.button('−','Dock minimieren',()=>adapter.updateSettings({minimized:!adapter.getSettings().minimized}));
    header.append(this.handle,this.orientation,this.toggle);
    this.body=d.createElement('div');Object.assign(this.body.style,{display:'flex',gap:'4px',flexWrap:'wrap',alignItems:'center'});
    const file=d.createElement('input');file.type='file';file.accept='image/png,image/jpeg,image/webp';file.hidden=true;
    file.addEventListener('change',()=>{const f=file.files?.[0];if(f&&adapter.addImage)void adapter.addImage(f).catch(e=>adapter.onError?.(e));file.value='';},{signal});
    for(const tool of tools){if(adapter.supportedTools&&!adapter.supportedTools.includes(tool)||tool==='image'&&!adapter.addImage)continue;const b=this.button(icons[tool],labels[tool],()=>{if(tool==='image'){file.setCustomValidity('');file.click();}else adapter.updateSettings({tool});});this.buttons.set(tool,b);this.body.append(b);}
    this.color=this.input('color','Farbe',v=>adapter.updateSettings({color:v}));
    this.width=this.input('range','Strichstärke',v=>adapter.updateSettings({width:Number(v)}));this.width.min='1';this.width.max='80';this.width.style.width='76px';
    this.opacity=this.input('range','Deckkraft',v=>adapter.updateSettings({opacity:Number(v)}));this.opacity.min='.05';this.opacity.max='1';this.opacity.step='.05';this.opacity.style.width='76px';
    this.grid=this.input('checkbox','Raster',()=>adapter.updateSettings({grid:this.grid.checked}));
    this.snap=this.input('checkbox','Rasterfang',()=>adapter.updateSettings({snap:this.snap.checked}));
    const settingsControls:[keyof Settings,string,HTMLInputElement][]=[['color','Farbe',this.color],['width','Breite',this.width],['opacity','Deckkraft',this.opacity],['grid','Raster',this.grid],['snap','Fang',this.snap]];
    for(const [key,label,control] of settingsControls)if(!adapter.supportedSettings||adapter.supportedSettings.includes(key))this.body.append(this.labeled(label,control));
    const commands:[CanvasCommand,string,string][]=[['undo','↶','Rückgängig'],['redo','↷','Wiederholen'],['delete','×','Löschen'],['copy','⎘','Kopieren'],['paste','▣','Einfügen'],['group','⊞','Gruppieren'],['ungroup','⊟','Gruppe lösen'],['front','⇧','Nach vorne'],['back','⇩','Nach hinten'],['rotate','⟳','Drehen'],['grow','↗','Vergrössern'],['shrink','↙','Verkleinern'],['zoomIn','+','Zoom hinein'],['zoomOut','−','Zoom hinaus'],['reset','1:1','Zoom zurücksetzen']];
    for(const [cmd,icon,label] of commands)if(!adapter.supportedCommands||adapter.supportedCommands.includes(cmd))this.body.append(this.button(icon,label,()=>adapter.command(cmd)));
    const text=d.createElement('input');text.type='text';text.placeholder='Text bearbeiten';text.setAttribute('aria-label','Text bearbeiten');text.maxLength=10000;text.style.maxWidth='140px';
    if(adapter.editText)this.body.append(text,this.button('OK','Text übernehmen',()=>adapter.editText?.(text.value)));this.body.append(file);
    this.element.append(header,this.body);adapter.root.append(this.element);this.refresh();
  }
  private button(icon:string,label:string,run:()=>void):HTMLButtonElement{
    const b=this.adapter.root.ownerDocument.createElement('button');b.type='button';b.textContent=icon;b.title=label;b.setAttribute('aria-label',label);
    Object.assign(b.style,{minWidth:'44px',minHeight:'44px',flexShrink:'0',border:'1px solid currentColor',borderRadius:'10px',background:'transparent',color:'inherit',font:'inherit',fontSize:'18px',cursor:'pointer'});
    b.addEventListener('click',run,{signal:this.abort.signal});return b;
  }
  private input(type:string,label:string,run:(value:string)=>void):HTMLInputElement{
    const i=this.adapter.root.ownerDocument.createElement('input');i.type=type;i.setAttribute('aria-label',label);i.style.minHeight='44px';i.addEventListener('input',()=>run(i.value),{signal:this.abort.signal});return i;
  }
  private labeled(label:string,control:HTMLInputElement):HTMLLabelElement{
    const l=this.adapter.root.ownerDocument.createElement('label');l.textContent=label;l.style.display='inline-flex';l.style.alignItems='center';l.style.gap='4px';l.append(control);return l;
  }
  refresh():void{
    const s=this.adapter.getSettings(),dark=this.adapter.root.dataset.theme==='dark';
    this.element.style.background=dark?'#24272f':'#fff';this.element.style.color=dark?'#f8fafc':'#18202f';this.element.style.borderColor=dark?'#858b9a':'#94a3b8';
    this.element.style.width=s.vertical?'min(220px, calc(100% - 16px))':'max-content';
    this.body.style.maxWidth=s.vertical?'200px':'min(760px, calc(100vw - 32px))';this.body.style.display=s.minimized?'none':'flex';
    this.toggle.textContent=s.minimized?'+':'−';this.toggle.setAttribute('aria-expanded',String(!s.minimized));this.toggle.setAttribute('aria-label',s.minimized?'Dock ausklappen':'Dock minimieren');
    this.orientation.setAttribute('aria-pressed',String(s.vertical));
    for(const [tool,b] of this.buttons){b.setAttribute('aria-pressed',String(tool===s.tool));b.style.background=tool===s.tool?(dark?'#405c9c':'#dbeafe'):'transparent';}
    this.color.value=s.color;this.width.value=String(s.width);this.opacity.value=String(s.opacity);this.grid.checked=s.grid;this.snap.checked=s.snap;
    this.element.style.left=bounded(s.x,0,Math.max(0,this.adapter.root.clientWidth-this.element.offsetWidth))+'px';this.element.style.top=bounded(s.y,0,Math.max(0,this.adapter.root.clientHeight-this.element.offsetHeight))+'px';
  }
  dispose():void{this.abort.abort();this.element.remove();}
}
