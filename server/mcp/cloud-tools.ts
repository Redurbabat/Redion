/* Cloud-MCP actions on the existing Redion sync store.
 * No second document database. Every call checks token workspace selection,
 * current page role and encryption status. Writes are version-conditional.
 */
import type {Ablage} from '../typen.ts';
import type {McpPrincipal} from './oauth.ts';
import {rolleAuf,darf,notieren} from '../kern.ts';

type Db={prepare(sql:string):{bind(...values:(string|number)[]):{first<T>():Promise<T|null>}}};
type Args=Record<string,unknown>;
type ToolDef={name:string;description:string;inputSchema:{type:'object';properties:Record<string,unknown>;required?:string[];additionalProperties:boolean}};
export class CloudMcpToolError extends Error {
  readonly reason:string;
  constructor(reason:string, message:string){super(message);this.reason=reason;}
}
const err=(reason:string,message:string):never=>{throw new CloudMcpToolError(reason,message);};
const text=(value:unknown,max:number):string=>typeof value==='string'&&value.length<=max?value:'';
const required=(value:unknown,max:number):string=>{
  const s=text(value,max).trim();if(!s)return err('invalid_arguments','Ein erforderlicher Text fehlt oder ist zu lang.');return s;
};
const limit=(value:unknown,fallback:number,max:number):number=>value===undefined?fallback:
  Number.isSafeInteger(value)&&Number(value)>0&&Number(value)<=max?Number(value):
  err('invalid_arguments','Ungültige Anzahl.');
const nameField={type:'string',maxLength:160};
const idField={type:'string',maxLength:128};
const workspace={workspaceId:idField};
const documentId={documentId:idField};
export const CLOUD_TOOLS:ToolDef[]=[
  {name:'redion_list_workspaces',description:'Zeigt nur die für diese KI-Verbindung freigegebenen Bereiche.',
    inputSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'redion_search',description:'Sucht nach freigegebenen, nicht verschlüsselten Seiten.',
    inputSchema:{type:'object',properties:{...workspace,query:{type:'string',maxLength:200},limit:{type:'integer',minimum:1,maximum:30}},required:['workspaceId'],additionalProperties:false}},
  {name:'redion_read_page',description:'Liest eine freigegebene Klartext-Seite mit Versionsnummer.',
    inputSchema:{type:'object',properties:{...workspace,...documentId},required:['workspaceId','documentId'],additionalProperties:false}},
  {name:'redion_create_page',description:'Legt eine Seite an. requestId verhindert doppelte Erstellung bei Wiederholung.',
    inputSchema:{type:'object',properties:{...workspace,title:nameField,content:{type:'string',maxLength:12000},parentId:idField,requestId:{type:'string',minLength:8,maxLength:100}},
      required:['workspaceId','title','requestId'],additionalProperties:false}},
  {name:'redion_update_page',description:'Ändert den Seitentitel nur bei passender expectedVersion.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,title:nameField,expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId','title','expectedVersion'],additionalProperties:false}},
  {name:'redion_list_child_pages',description:'Listet lesbare, unverschlüsselte Unterseiten einer Seite auf.',
    inputSchema:{type:'object',properties:{...workspace,parentId:idField,limit:{type:'integer',minimum:1,maximum:100}},required:['workspaceId','parentId'],additionalProperties:false}},
  {name:'redion_append_content',description:'Hängt Markdown an eine Klartext-Seite an; benötigt Schreibrecht und passende Version.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,content:{type:'string',minLength:1,maxLength:4000},expectedVersion:{type:'integer',minimum:1}},required:['workspaceId','documentId','content','expectedVersion'],additionalProperties:false}},
  {name:'redion_move_page',description:'Verschiebt eine Klartext-Seite unter eine andere Seite oder auf die oberste Ebene. Prüft Schreibrechte, Zyklen und Version.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,newParentId:idField,expectedVersion:{type:'integer',minimum:1}},required:['workspaceId','documentId','expectedVersion'],additionalProperties:false}},
  {name:'redion_replace_text',description:'Ersetzt Text im Seiteninhalt mit Versionskontrolle; nicht in verschlüsselten Seiten.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,find:{type:'string',minLength:1,maxLength:2000},
      replacement:{type:'string',maxLength:4000},expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId','find','replacement','expectedVersion'],additionalProperties:false}}
];
const writeNames=new Set(['redion_create_page','redion_update_page','redion_replace_text','redion_append_content','redion_move_page']);
export const visibleCloudTools=(p:McpPrincipal)=>CLOUD_TOOLS.filter(t=>!writeNames.has(t.name)||p.scopes.includes('redion:write'));

export const createCloudActions=(ablage:Ablage,db:Db,principal:McpPrincipal)=>{
  const userId=principal.userId;
  const inScope=async(workspaceId:unknown)=>{
    const id=required(workspaceId,128);
    if(!principal.workspaceIds.includes(id))return err('forbidden','Dieser Arbeitsbereich wurde nicht freigegeben.');
    const b=await ablage.hole('bereiche',{id});
    if(!b)return err('not_found','Arbeitsbereich nicht gefunden.');
    return b;
  };
  const role=async(w:string,page:string,permission:'lesen'|'bearbeiten')=>{
    const r=await rolleAuf(ablage,w,page,userId);
    if(!darf(r,permission))err('forbidden','Keine Berechtigung für diese Aktion.');
  };
  const page=async(w:string,id:string,permission:'lesen'|'bearbeiten')=>{
    const s=await ablage.hole('saetze',{bereich:w,id});
    if(!s||s.geloescht||s.tabelle!=='blocks')return err('not_found','Seite nicht gefunden.');
    await role(w,String(s.seite||id),permission);
    if(s.verschluesselt)return err('encrypted','Verschlüsselte Inhalte sind für die Cloud nicht lesbar.');
    let data:Record<string,unknown>;
    try{data=JSON.parse(String(s.daten||'{}'));}catch{return err('invalid_data','Unlesbares Seitenformat.');}
    if(!data||data.type!=='page')return err('not_found','Kein Seiteneintrag.');
    return {s,data};
  };
  const expected=(v:unknown):number=>{
    if(!Number.isSafeInteger(v)||Number(v)<1)return err('invalid_arguments','expectedVersion muss eine positive ganze Zahl sein.');
    return Number(v);
  };
  const update=async(w:string,id:string,old:number,updated:Record<string,unknown>)=>{
    const payload=JSON.stringify(updated);
    if(payload.length>64000)return err('invalid_arguments','Seite ist für diese Änderung zu gross.');
    const changed=await db.prepare(
      "UPDATE saetze SET daten=?1,version=version+1,geaendert=?2,vonGeraet='Cloud-MCP' "+
      "WHERE bereich=?3 AND id=?4 AND version=?5 AND geloescht=0 AND verschluesselt=0 AND tabelle='blocks' RETURNING version"
    ).bind(payload,new Date().toISOString(),w,id,old).first<{version:number}>();
    if(!changed)return err('conflict','Seite wurde zwischenzeitlich geändert. Bitte erneut lesen.');
    await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Seite über Cloud-MCP bearbeitet',objekt:id});
    return {documentId:id,version:changed.version};
  };
  return async(name:string,args:Args):Promise<unknown>=>{
    if(!visibleCloudTools(principal).some(t=>t.name===name))
      return err('forbidden','Dieses Werkzeug ist nicht freigegeben.');
    if(name==='redion_list_workspaces'){
      const visible=[];
      for(const id of principal.workspaceIds.slice(0,20)){
        const b=await ablage.hole('bereiche',{id});
        if(!b)continue;
        const r=await rolleAuf(ablage,id,'*',userId);
        if(darf(r,'lesen'))visible.push({id,name:String(b.name||''),canWrite:darf(r,'bearbeiten')});
      }
      return {workspaces:visible};
    }
    const w=required(args.workspaceId,128);
    await inScope(w);
    if(name==='redion_search'){
      await role(w,'*','lesen');
      const query=text(args.query,200).toLocaleLowerCase();
      const max=limit(args.limit,20,30);
      const rows=await ablage.finde('saetze',{bereich:w},{sortiere:'geaendert',absteigend:true,grenze:300});
      const found=[];
      for(const s of rows){
        if(s.tabelle!=='blocks'||s.geloescht||s.verschluesselt||found.length>=max)continue;
        let data:Record<string,unknown>;
        try{data=JSON.parse(String(s.daten||'{}'));}catch{continue;}
        if(data.type!=='page'||query&&!String(data.text||'').toLocaleLowerCase().includes(query))continue;
        const r=await rolleAuf(ablage,w,String(s.seite||s.id),userId);
        if(darf(r,'lesen'))found.push({documentId:s.id,title:String(data.text||'').slice(0,160),version:Number(s.version)||1});
      }
      return {documents:found};
    }
    if(name==='redion_read_page'){
      const id=required(args.documentId,128);
      const result=await page(w,id,'lesen');
      return {documentId:id,workspaceId:w,title:String(result.data.text||''),
        content:String(result.data.inhalt||''),version:Number(result.s.version)||1};
    }
    if(name==='redion_list_child_pages'){
      const parentId=required(args.parentId,128);
      await page(w,parentId,'lesen');
      const max=limit(args.limit,50,100);
      const rows=await ablage.finde('saetze',{bereich:w},{sortiere:'geaendert',absteigend:true,grenze:1000});
      const children=[];
      for(const s of rows){
        if(s.tabelle!=='blocks'||s.geloescht||s.verschluesselt||children.length>=max)continue;
        let data:Record<string,unknown>;
        try{data=JSON.parse(String(s.daten||'{}'));}catch{continue;}
        if(data.type!=='page'||data.parentId!==parentId)continue;
        const r=await rolleAuf(ablage,w,String(s.seite||s.id),userId);
        if(darf(r,'lesen'))children.push({documentId:s.id,title:String(data.text||'').slice(0,160),version:Number(s.version)||1});
      }
      return {parentId,documents:children};
    }
    if(!principal.scopes.includes('redion:write'))
      return err('forbidden','Schreibrechte sind nicht freigegeben.');
    if(name==='redion_create_page'){
      const title=required(args.title,160);
      const content=text(args.content??'',12000);
      if(args.content!==undefined&&typeof args.content!=='string')err('invalid_arguments','Ungültiger Seiteninhalt.');
      const parentId=args.parentId===undefined?'':text(args.parentId,128);
      if(args.parentId!==undefined&&!parentId)err('invalid_arguments','Ungültige Elternseite.');
      if(parentId)await page(w,parentId,'bearbeiten');else await role(w,'*','bearbeiten');
      const key=required(args.requestId,100);
      if(key.length<8||!/^[A-Za-z0-9_-]+$/.test(key))err('invalid_arguments','requestId ist ungültig.');
      const bytes=new TextEncoder().encode('cloud-mcp-page\0'+principal.grantId+'\0'+w+'\0'+key);
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      const documentId=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('').slice(0,32);
      const data={type:'page',text:title,inhalt:content,parentId:parentId||null};
      const row=await db.prepare(
        'INSERT OR IGNORE INTO saetze (id,bereich,tabelle,daten,verschluesselt,seite,version,geaendert,geloescht,vonGeraet) '+
        "VALUES (?1,?2,'blocks',?3,0,?4,1,?5,0,'Cloud-MCP') RETURNING version"
      ).bind(documentId,w,JSON.stringify(data),documentId,new Date().toISOString()).first<{version:number}>();
      if(!row){
        const existing=await page(w,documentId,'lesen');
        if(existing.data.text!==title||existing.data.inhalt!==content||existing.data.parentId!==(parentId||null))
          err('conflict','requestId wurde bereits für eine andere Seite verwendet.');
        return {documentId,version:Number(existing.s.version)||1,alreadyExists:true};
      }
      await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Neue Seite über Cloud-MCP',objekt:documentId});
      return {documentId,version:1,alreadyExists:false};
    }
    const id=required(args.documentId,128);
    const current=await page(w,id,'bearbeiten');
    const ver=expected(args.expectedVersion);
    if(ver!==Number(current.s.version||1))err('conflict','Seite wurde zwischenzeitlich geändert. Bitte erneut lesen.');
    if(name==='redion_append_content'){
      const addition=required(args.content,4000);
      const old=current.data.inhalt;
      if(typeof old!=='string')return err('not_found','Seite hat keinen Textinhalt.');
      const next=old?old+'\\n'+addition:addition;
      if(next.length>12000)return err('invalid_arguments','Seiteninhalt ist zu gross.');
      return update(w,id,ver,{...current.data,inhalt:next});
    }
    if(name==='redion_move_page'){
      const target=args.newParentId===undefined?'':text(args.newParentId,128);
      if(args.newParentId!==undefined&&typeof args.newParentId!=='string')
        return err('invalid_arguments','Ungültige Elternseite.');
      if(target===id)return err('invalid_arguments','Eine Seite kann nicht ihr eigener Elternknoten sein.');
      if(target){
        await page(w,target,'bearbeiten');
        const visited=new Set<string>([id]);
        let cursor=target;
        for(let depth=0;cursor&&depth<40;depth++){
          if(visited.has(cursor))return err('invalid_arguments','Zyklische Seitenhierarchie ist nicht erlaubt.');
          visited.add(cursor);
          const ancestor=await page(w,cursor,'lesen');
          cursor=typeof ancestor.data.parentId==='string'?ancestor.data.parentId:'';
          if(!cursor)break;
          if(depth===39)return err('invalid_arguments','Seitenhierarchie ist zu tief.');
        }
      }else await role(w,'*','bearbeiten');
      return update(w,id,ver,{...current.data,parentId:target||null});
    }
    if(name==='redion_update_page'){
      return update(w,id,ver,{...current.data,text:required(args.title,160)});
    }
    if(name==='redion_replace_text'){
      const find=required(args.find,2000),replacement=text(args.replacement,4000);
      if(typeof args.replacement!=='string'||args.replacement.length>4000)err('invalid_arguments','Ungültiger Ersatztext.');
      const old=current.data.inhalt;
      if(typeof old!=='string')return err('not_found','Seite hat keinen Textinhalt.');
      if(!old.includes(find))return err('not_found','Text nicht im Seiteninhalt gefunden.');
      return update(w,id,ver,{...current.data,inhalt:old.replaceAll(find,replacement)});
    }
    return err('not_found','Unbekanntes Werkzeug.');
  };
};
