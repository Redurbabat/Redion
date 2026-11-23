/* Cloud-MCP actions on the existing Redion sync store.
 * No second document database. Every call checks token workspace selection,
 * current page role and encryption status. Writes are version-conditional.
 */
import type {Ablage} from '../typen.ts';
import type {McpPrincipal} from './oauth.ts';
import type {McpDatabase} from './state.ts';
import {rolleAuf,darf,notieren,feldRechte} from '../kern.ts';
import {BUILTIN_BLOCK_TYPES} from './block-catalog.ts';

type Db=McpDatabase;
type Args=Record<string,unknown>;
type ToolDef={name:string;description:string;inputSchema:{type:'object';properties:Record<string,unknown>;required?:string[];additionalProperties:boolean};annotations?:{title:string;readOnlyHint:boolean;destructiveHint:boolean;idempotentHint:boolean;openWorldHint:boolean}};
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
    inputSchema:{type:'object',properties:{...workspace,query:{type:'string',maxLength:200},limit:{type:'integer',minimum:1,maximum:30},offset:{type:'integer',minimum:0,maximum:1000}},required:['workspaceId'],additionalProperties:false}},
  {name:'redion_read_page',description:'Liest eine Klartext-Seite abschnittsweise. Der Seiteninhalt kommt standardmässig in markdown (nicht im MCP-Transportfeld content). Für alte Clients kann responseFormat=legacy die bisherige content-Antwort zurückgeben. expectedVersion schützt gegen gemischte Versionen.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,offset:{type:'integer',minimum:0},limit:{type:'integer',minimum:1,maximum:12000},expectedVersion:{type:'integer',minimum:1},responseFormat:{type:'string',enum:['portable','legacy']}},required:['workspaceId','documentId'],additionalProperties:false}},
  {name:'redion_get_page_path',description:'Zeigt den Pfad einer lesbaren Seite von der Hauptseite bis zum Dokument. Wenn ein Vorfahr nicht lesbar ist, werden keine Pfadteile offengelegt.',
    inputSchema:{type:'object',properties:{...workspace,...documentId},required:['workspaceId','documentId'],additionalProperties:false}},
  {name:'redion_read_pages',description:'Liest bis zu 10 Seiten auf einmal, maximal 2.000 Zeichen pro Seite. Unzugängliche IDs werden einheitlich als nicht verfügbar markiert.',
    inputSchema:{type:'object',properties:{...workspace,documentIds:{type:'array',items:{type:'string',minLength:1,maxLength:128},minItems:1,maxItems:10},maxChars:{type:'integer',minimum:1,maximum:2000}},
      required:['workspaceId','documentIds'],additionalProperties:false}},
  {name:'redion_add_block',description:'Erstellt einen sicheren Text- oder Todo-Block auf einer freigegebenen Seite; neue Blockzeile und Elternliste werden in einer D1-Transaktion gespeichert. requestId optional, Wiederholung mit derselben Seitenversion idempotent. Verschachtelte Blöcke noch nicht unterstützt.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,expectedVersion:{type:'integer',minimum:1},
      typ:{type:'string',maxLength:40},text:{type:'string',maxLength:12000},
      daten:{type:'object',additionalProperties:true},inBlockId:idField,
      requestId:{type:'string',minLength:8,maxLength:100}},
      required:['workspaceId','documentId','expectedVersion','typ'],additionalProperties:false}},
  {name:'redion_create_page',description:'Legt eine Seite an. requestId verhindert doppelte Erstellung bei Wiederholung.',
    inputSchema:{type:'object',properties:{...workspace,title:nameField,content:{type:'string',maxLength:12000},parentId:idField,requestId:{type:'string',minLength:8,maxLength:100}},
      required:['workspaceId','title','requestId'],additionalProperties:false}},
  {name:'redion_update_page',description:'Ändert den Seitentitel nur bei passender expectedVersion.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,title:nameField,expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId','title','expectedVersion'],additionalProperties:false}},
  {name:'redion_read_block',description:'Liest einen unverschlüsselten RED-ION-Block mit Seitenberechtigungen und sichtbaren Kindblöcken. Datenbankzeilen nur über redion_read_database lesen.',
    inputSchema:{type:'object',properties:{...workspace,blockId:idField},required:['workspaceId','blockId'],additionalProperties:false}},
  {name:'redion_read_schematic',description:'Liest einen vorhandenen Schaltplan-Block mit geprüften Seitenrechten. Bauteile, Leitungen, Beschriftungen und Planversion sind enthalten.',
    inputSchema:{type:'object',properties:{...workspace,blockId:idField},required:['workspaceId','blockId'],additionalProperties:false}},
  {name:'redion_list_block_types',description:'Listet eingebaute benannte Blockarten der RED-ION-App, inklusive intern gespeicherter Arten. Gerätebezogene Plugins sind nicht enthalten.',
    inputSchema:{type:'object',properties:{},additionalProperties:false}},
  {name:'redion_list_tasks',description:'Listet lesbare Aufgaben aus Todo-Blöcken und aus Datenbankzeilen mit sichtbaren Status- oder Checkbox-Spalten. Nur sichtbare Treffer zählen bei der Paginierung.',
    inputSchema:{type:'object',properties:{...workspace,nurOffen:{type:'boolean'},
      limit:{type:'integer',minimum:1,maximum:40},offset:{type:'integer',minimum:0,maximum:1000}},required:['workspaceId'],additionalProperties:false}},
  {name:'redion_read_database',description:'Liest freigegebene Datenbankspalten und paginierte Zeilen. Spaltenrechte werden auf Schema und Werte angewendet.',
    inputSchema:{type:'object',properties:{...workspace,databaseId:idField,limit:{type:'integer',minimum:1,maximum:10},
      offset:{type:'integer',minimum:0,maximum:1000}},required:['workspaceId','databaseId'],additionalProperties:false}},
  {name:'redion_list_databases',description:'Listet lesbare Klartext-Datenbanken auf Seiten, die der Benutzer lesen darf. Keine versteckten Seiten oder Spaltenwerte.',
    inputSchema:{type:'object',properties:{...workspace,limit:{type:'integer',minimum:1,maximum:30},offset:{type:'integer',minimum:0,maximum:1000}},required:['workspaceId'],additionalProperties:false}},
  {name:'redion_list_root_pages',description:'Listet freigegebene Hauptseiten eines Arbeitsbereichs; nur sichtbare Seiten zählen bei limit und offset.',
    inputSchema:{type:'object',properties:{...workspace,limit:{type:'integer',minimum:1,maximum:100},offset:{type:'integer',minimum:0,maximum:100000}},required:['workspaceId'],additionalProperties:false}},
  {name:'redion_list_child_pages',description:'Listet lesbare, unverschlüsselte Unterseiten einer Seite auf.',
    inputSchema:{type:'object',properties:{...workspace,parentId:idField,limit:{type:'integer',minimum:1,maximum:100},offset:{type:'integer',minimum:0,maximum:100000}},required:['workspaceId','parentId'],additionalProperties:false}},
  {name:'redion_append_content',description:'Hängt Markdown an eine Klartext-Seite an; benötigt Schreibrecht und passende Version.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,content:{type:'string',minLength:1,maxLength:4000},expectedVersion:{type:'integer',minimum:1}},required:['workspaceId','documentId','content','expectedVersion'],additionalProperties:false}},
  {name:'redion_move_page',description:'Verschiebt eine Klartext-Seite unter eine andere Seite oder auf die oberste Ebene. Prüft Schreibrechte, Zyklen und Version.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,newParentId:idField,expectedVersion:{type:'integer',minimum:1}},required:['workspaceId','documentId','expectedVersion'],additionalProperties:false}},
  {name:'redion_replace_text',description:'Ersetzt Text im Seiteninhalt mit Versionskontrolle; nicht in verschlüsselten Seiten.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,find:{type:'string',minLength:1,maxLength:2000},
      replacement:{type:'string',maxLength:4000},expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId','find','replacement','expectedVersion'],additionalProperties:false}}
];
const writeNames=new Set(['redion_create_page','redion_update_page','redion_replace_text','redion_append_content','redion_move_page','redion_add_block']);
// MCP annotations tell AI clients which tools are read-only, additive or
// modifying. They are advisory; server-side OAuth and ACL checks still govern.
const toolTitles:Record<string,string>={
  redion_list_workspaces:'Bereiche auflisten',
  redion_search:'Seiten und Inhalte suchen',
  redion_read_page:'Seite lesen',
  redion_get_page_path:'Seitenpfad anzeigen',
  redion_read_pages:'Mehrere Seiten lesen',
  redion_create_page:'Seite erstellen',
  redion_add_block:'Block oder Aufgabe erstellen',
  redion_update_page:'Seitentitel ändern',
  redion_list_databases:'Datenbanken auflisten',
  redion_read_database:'Datenbank lesen',
  redion_list_tasks:'Aufgaben auflisten',
  redion_list_block_types:'Blockarten auflisten',
  redion_read_block:'Block lesen',
  redion_read_schematic:'Schaltplan lesen',
  redion_list_root_pages:'Hauptseiten auflisten',
  redion_list_child_pages:'Unterseiten auflisten',
  redion_append_content:'Inhalt anhängen',
  redion_move_page:'Seite verschieben',
  redion_replace_text:'Text ersetzen'
};
const destructiveNames=new Set(['redion_update_page','redion_move_page','redion_replace_text']);
export const visibleCloudTools=(p:McpPrincipal):ToolDef[]=>
  CLOUD_TOOLS.filter(t=>!writeNames.has(t.name)||p.scopes.includes('redion:write'))
    .map(t=>{
      const readOnly=!writeNames.has(t.name);
      return {...t,annotations:{
        title:toolTitles[t.name]||t.name,readOnlyHint:readOnly,
        destructiveHint:destructiveNames.has(t.name),
        idempotentHint:t.name==='redion_create_page'||t.name==='redion_add_block',
        openWorldHint:false
      }};
    });

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
  const update=async(w:string,id:string,old:number,updated:Record<string,unknown>,guardParent?:string)=>{
    const payload=JSON.stringify(updated);
    if(payload.length>64000)return err('invalid_arguments','Seite ist für diese Änderung zu gross.');
    // The ancestry check runs in the same SQLite UPDATE as the write.
    // Concurrent moves cannot both validate an old tree and create a cycle.
    const guard=guardParent?
      " AND NOT EXISTS (WITH RECURSIVE ancestors(id,depth) AS ("+
      "SELECT ?6,0 UNION ALL "+
      "SELECT CASE WHEN json_valid(s.daten) THEN json_extract(s.daten,'$.parentId') ELSE NULL END,a.depth+1 "+
      "FROM ancestors a JOIN saetze s ON s.bereich=?3 AND s.id=a.id "+
      "WHERE a.id IS NOT NULL AND a.depth<40"+
      ") SELECT 1 FROM ancestors WHERE id=?4 OR depth>=40)":"";
    const sql="UPDATE saetze SET daten=?1,version=version+1,geaendert=?2,vonGeraet='Cloud-MCP' "+
      "WHERE bereich=?3 AND id=?4 AND version=?5 AND geloescht=0 AND verschluesselt=0 AND tabelle='blocks'"+
      guard+" RETURNING version";
    const values:(string|number)[]=[payload,new Date().toISOString(),w,id,old];
    if(guardParent)values.push(guardParent);
    const changed=await db.prepare(sql).bind(...values).first<{version:number}>();
    if(!changed)return err('conflict','Seite wurde zwischenzeitlich geändert oder der Zielordner wurde verschoben. Bitte erneut lesen.');
    await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Seite über Cloud-MCP bearbeitet',objekt:id});
    return {documentId:id,version:changed.version};
  };
  return async(name:string,args:Args):Promise<unknown>=>{
    // Nicht vorhandene Werkzeugnamen sind keine verweigerte OAuth-Freigabe.
    // Ein App-Connector kann eine ältere Tool-Liste zwischenspeichern.
    if(!CLOUD_TOOLS.some(t=>t.name===name))
      return err('unknown_tool','Dieses Werkzeug ist im Cloud-MCP nicht implementiert. Bitte die aktuelle Werkzeugliste neu laden.');
    if(!visibleCloudTools(principal).some(t=>t.name===name))
      return err('forbidden','Für dieses Werkzeug fehlen die erforderlichen OAuth-Rechte.');
    if(name==='redion_list_block_types'){
      return {blockTypes:BUILTIN_BLOCK_TYPES,total:BUILTIN_BLOCK_TYPES.length,
        externalExtensionsIncluded:false};
    }
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
    const area=await inScope(w);
    if(name==='redion_read_block'||name==='redion_read_schematic'){
      const id=required(args.blockId,128);
      const s=await ablage.hole('saetze',{bereich:w,id});
      if(!s||s.tabelle!=='blocks'||s.geloescht||s.verschluesselt)
        return err('not_found','Block nicht verfügbar.');
      let data:Record<string,unknown>;
      try{data=JSON.parse(String(s.daten||'')) as Record<string,unknown>;}
      catch{return err('not_found','Block nicht verfügbar.');}
      if(!data||typeof data!=='object'||Array.isArray(data)||typeof data.type!=='string'||
         data.alive===false)
        return err('not_found','Block nicht verfügbar.');
      // A collection row is stored as a 'page' with s.seite=its own ID.
      // Never let it bypass database embedding/field permissions; those
      // rows must be accessed through redion_read_database.
      if(data.parentTable==='collection')
        return err('not_found','Datenbankzeilen bitte über redion_read_database lesen.');
      const pageId=String(s.seite||'');
      if(!pageId)return err('not_found','Block nicht verfügbar.');
      await page(w,pageId,'lesen');
      // Only direct, readable children may appear, never a raw list of
      // encrypted, removed or unrelated child IDs. Limit work and response.
      const childIds=Array.isArray(data.content)?data.content:[];
      if(childIds.length>40)return err('too_large','Block hat zu viele Kinder für einen Aufruf.');
      const visibleChildren:string[]=[];
      for(const childId of childIds){
        if(typeof childId!=='string'||!childId||childId.length>128)continue;
        if(visibleChildren.includes(childId))continue;
        const child=await ablage.hole('saetze',{bereich:w,id:childId});
        if(!child||child.tabelle!=='blocks'||child.geloescht||child.verschluesselt||
           child.seite!==pageId)continue;
        try{
          const nested=JSON.parse(String(child.daten||'')) as Record<string,unknown>;
          if(nested&&nested.alive!==false&&nested.parentId===id&&nested.parentTable!=='collection')
            visibleChildren.push(childId);
        }catch{/* Beschädigte oder unlesbare Kinder nicht preisgeben. */}
      }
      // No unfiltered nested IDs, including non-standard "children" arrays.
      const sanitized={...data,content:visibleChildren};
      if('children' in sanitized)delete sanitized.children;
      if(name==='redion_read_schematic'){
        if(data.type!=='schaltplan'||!data.plan||typeof data.plan!=='object'||Array.isArray(data.plan))
          return err('not_found','Schaltplan nicht verfügbar.');
        const plan=data.plan as Record<string,unknown>;
        const payload=JSON.stringify(plan);
        if(payload.length>32000)return err('too_large','Schaltplan ist für einen Aufruf zu gross.');
        return {workspaceId:w,blockId:id,documentId:pageId,
          version:Number(s.version)||1,plan,
          teile:Array.isArray(plan.teile)?plan.teile:[],
          leitungen:Array.isArray(plan.leitungen)?plan.leitungen:[],
          texte:Array.isArray(plan.texte)?plan.texte:[]};
      }
      const payload=JSON.stringify(sanitized);
      if(payload.length>12000)return err('too_large','Blockdaten sind zu gross.');
      return {workspaceId:w,blockId:id,documentId:pageId,
        version:Number(s.version)||1,type:data.type,text:String(data.text||'').slice(0,12000),
        data:sanitized,children:visibleChildren};
    }
    if(name==='redion_list_tasks'){
      if(args.nurOffen!==undefined&&typeof args.nurOffen!=='boolean')
        return err('invalid_arguments','nurOffen muss true oder false sein.');
      const max=limit(args.limit,30,40);
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0||Number(offset)>1000)
        return err('invalid_arguments','Ungültiger Aufgabenversatz.');
      type Task={taskId:string;title:string;fertig:boolean;art:'block'|'zeile';
        pageId?:string;databaseId?:string;databaseName?:string;status?:string;
        faellig?:string;version:number;sort:string};
      const tasks:Task[]=[];
      const isDone=(value:string)=>/erledigt|fertig|done|abgeschlossen|completed/i.test(value);
      const asValue=(value:unknown):unknown=>{
        if(value&&typeof value==='object'&&!Array.isArray(value)){
          const v=value as Record<string,unknown>;
          return v.name??v.value??v.status??value;
        }
        return value;
      };
      const isChecked=(value:unknown)=>value===true||value===1||value==='true';
      // The sync adapter stores the actual containing page in s.seite for
      // todo blocks. Check the page itself, never infer permission from the
      // mere existence of a raw block in D1.
      const todos=await db.prepare(
        "SELECT id,seite,daten,version,geaendert FROM saetze "+
        "WHERE bereich=?1 AND tabelle='blocks' AND geloescht=0 AND verschluesselt=0 "+
        "AND CASE WHEN json_valid(daten) THEN json_extract(daten,'$.type')='todo' ELSE 0 END "+
        "ORDER BY geaendert DESC,id DESC LIMIT 1500"
      ).bind(w).all<{id:string;seite:string|null;daten:string;version:number;geaendert:string}>();
      for(const entry of todos.results){
        if(!entry.seite)continue;
        try{await page(w,String(entry.seite),'lesen');}
        catch(error){if(error instanceof CloudMcpToolError)continue;throw error;}
        const data=JSON.parse(entry.daten) as Record<string,unknown>;
        if(data.archiviert===true||data.alive===false||typeof data.text!=='string'||!data.text.trim())continue;
        const fertig=isChecked(data.checked);
        if(args.nurOffen===true&&fertig)continue;
        tasks.push({taskId:entry.id,title:data.text.slice(0,250),fertig,art:'block',
          pageId:String(entry.seite),version:Number(entry.version)||1,sort:String(entry.geaendert||'')});
      }
      // Collection rows are only tasks when the collection has a readable
      // checkbox/status field and a readable embedding page. The collection's
      // sync "seite" is its own ID, not an authorization to read its rows.
      type Collection={id:string;name:string;statusKey?:string|undefined;checkboxKey?:string|undefined;
        dateKey?:string|undefined;titleVisible:boolean};
      const collections=new Map<string,Collection>();
      const collectionRows=await db.prepare(
        "SELECT id,daten FROM saetze WHERE bereich=?1 AND tabelle='collections' "+
        "AND geloescht=0 AND verschluesselt=0 AND json_valid(daten) "+
        "ORDER BY geaendert DESC,id DESC LIMIT 120"
      ).bind(w).all<{id:string;daten:string}>();
      for(const entry of collectionRows.results){
        let info:Record<string,unknown>;
        try{info=JSON.parse(entry.daten) as Record<string,unknown>;}catch{continue;}
        if(!info.schema||typeof info.schema!=='object'||Array.isArray(info.schema))continue;
        const schema=info.schema as Record<string,unknown>;
        const rights=await feldRechte(ablage,w,entry.id,userId);
        const columns=Object.entries(schema).map(([key,def])=>{
          const d=def&&typeof def==='object'&&!Array.isArray(def)?def as Record<string,unknown>:{};
          return {key,type:String(d.type||''),name:String(d.name||key),options:d.options};
        });
        const valid=(key:string)=>rights[key]!=='kein';
        const status=columns.find(c=>valid(c.key)&&c.type==='status')||
          columns.find(c=>valid(c.key)&&c.type==='select'&&Array.isArray(c.options)&&
            c.options.some((o:unknown)=>o&&typeof o==='object'&&
              isDone(String((o as Record<string,unknown>).name||''))));
        const checked=columns.find(c=>valid(c.key)&&c.type==='checkbox');
        if(!status&&!checked)continue;
        const links=await db.prepare(
          "SELECT seite FROM saetze WHERE bereich=?1 AND tabelle='blocks' "+
          "AND geloescht=0 AND verschluesselt=0 AND CASE WHEN json_valid(daten) THEN "+
          "(json_extract(daten,'$.type')='database' AND "+
          "json_extract(daten,'$.collectionId')=?2) ELSE 0 END LIMIT 64"
        ).bind(w,entry.id).all<{seite:string|null}>();
        let accessible=false;
        for(const link of links.results){
          if(!link.seite)continue;
          try{await page(w,String(link.seite),'lesen');accessible=true;break;}
          catch(error){if(!(error instanceof CloudMcpToolError))throw error;}
        }
        if(!accessible)continue;
        const titleKey=columns.find(c=>c.type==='title')?.key||'title';
        collections.set(entry.id,{id:entry.id,name:String(info.name||'Datenbank').slice(0,160),
          statusKey:status?.key,checkboxKey:checked?.key,
          dateKey:columns.find(c=>valid(c.key)&&c.type==='date')?.key,
          titleVisible:rights[titleKey]!=='kein'});
      }
      if(collections.size>0){
        const rows=await db.prepare(
          "SELECT id,seite,daten,version,geaendert FROM saetze "+
          "WHERE bereich=?1 AND tabelle='blocks' AND geloescht=0 AND verschluesselt=0 "+
          "AND CASE WHEN json_valid(daten) THEN "+
          "(json_extract(daten,'$.type')='page' AND "+
          "json_extract(daten,'$.parentTable')='collection') ELSE 0 END "+
          "ORDER BY geaendert DESC,id DESC LIMIT 2000"
        ).bind(w).all<{id:string;seite:string|null;daten:string;version:number;geaendert:string}>();
        for(const entry of rows.results){
          const info=JSON.parse(entry.daten) as Record<string,unknown>;
          const c=collections.get(String(info.parentId||''));
          if(!c||info.archiviert===true||info.alive===false)continue;
          try{await page(w,entry.id,'lesen');}
          catch(error){if(error instanceof CloudMcpToolError)continue;throw error;}
          const props=info.props&&typeof info.props==='object'&&!Array.isArray(info.props)?
            info.props as Record<string,unknown>:{};
          const statusValue=c.statusKey?asValue(props[c.statusKey]):'';
          const status=statusValue==null?'':typeof statusValue==='string'||typeof statusValue==='number'?
            String(statusValue):'';
          const fertig=c.checkboxKey?isChecked(asValue(props[c.checkboxKey])):isDone(status);
          if(args.nurOffen===true&&fertig)continue;
          const due=c.dateKey?asValue(props[c.dateKey]):null;
          tasks.push({taskId:entry.id,title:c.titleVisible?String(info.text||'').slice(0,250):'',
            fertig,art:'zeile',databaseId:c.id,databaseName:c.name,
            ...(c.statusKey?{status:status.slice(0,100)}:{}),
            ...(typeof due==='string'&&due.length<=40?{faellig:due}:{}),
            version:Number(entry.version)||1,sort:String(entry.geaendert||'')});
        }
      }
      tasks.sort((a,b)=>b.sort.localeCompare(a.sort)||b.taskId.localeCompare(a.taskId));
      return {workspaceId:w,tasks:tasks.slice(Number(offset),Number(offset)+max)
        .map(({sort,...rest})=>rest),
        nextOffset:tasks.length>Number(offset)+max?Number(offset)+max:null};
    }
    if(name==='redion_search'){
      await role(w,'*','lesen');
      if(args.query!==undefined&&(typeof args.query!=='string'||args.query.length>200))
        return err('invalid_arguments','Suchtext muss ein Text mit höchstens 200 Zeichen sein.');
      const query=typeof args.query==='string'?args.query.trim():'';
      // SQLite lower() handles ASCII but not general Unicode case folding.
      // For non-ASCII terms, scan a bounded set and compare in JavaScript.
      const unicodeTerm=/[^\x00-\x7f]/.test(query);
      const sqlNeedle=unicodeTerm?'':query;
      const foldedQuery=unicodeTerm?query.toLocaleLowerCase():'';
      const max=limit(args.limit,20,30);
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0||Number(offset)>1000)
        return err('invalid_arguments','Ungültiger Suchversatz.');
      // Search title AND content in the full D1 page index, not merely the
      // 300 newest records. instr() treats %, _ and \ as literal characters.
      // CASE protects against malformed or encrypted JSON in the store.
      const sql="SELECT id,seite,daten,version FROM saetze "+
        "WHERE bereich=?1 AND tabelle='blocks' AND geloescht=0 AND verschluesselt=0 "+
        "AND CASE WHEN json_valid(daten) THEN "+
        "(json_extract(daten,'$.type')='page' AND ("+
        "?2='' OR instr(lower(COALESCE(json_extract(daten,'$.text'),'')),lower(?2))>0 "+
        "OR instr(lower(COALESCE(json_extract(daten,'$.inhalt'),'')),lower(?2))>0)) "+
        "ELSE 0 END ORDER BY geaendert DESC,id DESC LIMIT ?3 OFFSET ?4";
      const found:{documentId:string;title:string;version:number}[]=[];
      const batch=100,maxScanned=2000;
      let scanned=0,visible=0;
      while(scanned<maxScanned&&found.length<=max){
        const result=await db.prepare(sql).bind(w,sqlNeedle,batch,scanned)
          .all<{id:string;seite:string|null;daten:string;version:number}>();
        for(const s of result.results){
          const r=await rolleAuf(ablage,w,String(s.seite||s.id),userId);
          if(!darf(r,'lesen'))continue;
          // Unicode-aware comparison occurs ONLY after the ACL check.
          const data=JSON.parse(s.daten) as Record<string,unknown>;
          if(unicodeTerm&&!String(data.text||'').toLocaleLowerCase().includes(foldedQuery)&&
             !String(data.inhalt||'').toLocaleLowerCase().includes(foldedQuery))continue;
          if(visible++<Number(offset))continue;
          found.push({documentId:s.id,title:String(data.text||'').slice(0,160),version:Number(s.version)||1});
          if(found.length>max)break;
        }
        scanned+=result.results.length;
        if(result.results.length<batch)break;
      }
      // No raw-row truncation marker: that could disclose the existence of
      // content that the caller is explicitly forbidden to read.
      return {documents:found.slice(0,max),nextOffset:found.length>max?Number(offset)+max:null};
    }
    if(name==='redion_read_database'){
      const databaseId=required(args.databaseId,128);
      const max=limit(args.limit,10,10);
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0||Number(offset)>1000)
        return err('invalid_arguments','Ungültiger Datenbankversatz.');
      const database=await ablage.hole('saetze',{bereich:w,id:databaseId});
      if(!database||database.tabelle!=='collections'||database.geloescht||database.verschluesselt)
        return err('not_found','Datenbank nicht verfügbar.');
      let data:Record<string,unknown>;
      try{data=JSON.parse(String(database.daten||''));}
      catch{return err('not_found','Datenbank nicht verfügbar.');}
      if(!data||!data.schema||typeof data.schema!=='object'||Array.isArray(data.schema))
        return err('not_found','Datenbank nicht verfügbar.');
      // A collection's synced "seite" is its own ID, not its owning page.
      // Only an actual, cleartext database block on a READABLE page permits
      // access. A direct collection ID is not an authorization token.
      const links=await db.prepare(
        "SELECT seite FROM saetze WHERE bereich=?1 AND tabelle='blocks' "+
        "AND geloescht=0 AND verschluesselt=0 AND CASE WHEN json_valid(daten) THEN "+
        "(json_extract(daten,'$.type')='database' AND "+
        "json_extract(daten,'$.collectionId')=?2) ELSE 0 END LIMIT 64"
      ).bind(w,databaseId).all<{seite:string|null}>();
      let readable=false;
      for(const link of links.results){
        if(!link.seite)continue;
        try{await page(w,String(link.seite),'lesen');readable=true;break;}
        catch(e){if(!(e instanceof CloudMcpToolError))throw e;}
      }
      if(!readable)return err('not_found','Datenbank nicht verfügbar.');
      const rights=await feldRechte(ablage,w,databaseId,userId);
      const cols=Object.entries(data.schema as Record<string,unknown>)
        .filter(([key])=>rights[key]!=='kein'&&!['__proto__','prototype','constructor'].includes(key))
        .map(([key,def])=>{
          const x=def&&typeof def==='object'&&!Array.isArray(def)?def as Record<string,unknown>:{};
          return {key,name:String(x.name||key).slice(0,120),type:String(x.type||'text').slice(0,40)};
        });
      if(cols.length>40)return err('too_large','Diese Datenbank hat mehr als 40 sichtbare Spalten.');
      const columns=new Set(cols.map(x=>x.key));
      // Iterate raw candidates but only count rows after ACL checks. Never
      // expose hidden rows through raw SQL LIMIT/OFFSET.
      const sql="SELECT id,seite,daten,version FROM saetze "+
        "WHERE bereich=?1 AND tabelle='blocks' AND geloescht=0 AND verschluesselt=0 "+
        "AND CASE WHEN json_valid(daten) THEN "+
        "(json_extract(daten,'$.type')='page' AND "+
        "json_extract(daten,'$.parentTable')='collection' AND "+
        "json_extract(daten,'$.parentId')=?2) ELSE 0 END "+
        "ORDER BY geaendert DESC,id DESC LIMIT ?3 OFFSET ?4";
      const rows:{rowId:string;title:string;values:Record<string,unknown>;version:number}[]=[];
      let scanned=0,visible=0;
      const batch=50,maxScanned=2000;
      while(scanned<maxScanned&&rows.length<=max){
        const result=await db.prepare(sql).bind(w,databaseId,batch,scanned)
          .all<{id:string;seite:string|null;daten:string;version:number}>();
        for(const s of result.results){
          const r=await rolleAuf(ablage,w,String(s.seite||s.id),userId);
          if(!darf(r,'lesen'))continue;
          if(visible++<Number(offset))continue;
          const item=JSON.parse(s.daten) as Record<string,unknown>;
          const raw=item.props&&typeof item.props==='object'&&!Array.isArray(item.props)?
            item.props as Record<string,unknown>:{};
          const values=Object.fromEntries(Object.entries(raw).filter(([key])=>columns.has(key))
            .map(([key,value])=>{
              const rawValue=JSON.stringify(value);
              return [key,rawValue&&rawValue.length<=500?value:{truncated:true}];
            }));
          rows.push({rowId:s.id,title:rights['title']==='kein'?'':String(item.text||'').slice(0,160),
            values,version:Number(s.version)||1});
          if(rows.length>max)break;
        }
        scanned+=result.results.length;
        if(result.results.length<batch)break;
      }
      return {workspaceId:w,databaseId,name:String(data.name||'').slice(0,160),
        version:Number(database.version)||1,columns:cols,rows:rows.slice(0,max),
        nextOffset:rows.length>max?Number(offset)+max:null};
    }
    if(name==='redion_list_databases'){
      const max=limit(args.limit,20,30);
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0||Number(offset)>1000)
        return err('invalid_arguments','Ungültiger Datenbankversatz.');
      // "collections" rows do NOT carry their actual owning page:
      // the sync adapter stores seite=collectionId. Only a valid database
      // block points to an actual page, and that page must be readable.
      // Distinct visible collections count for pagination, never raw rows.
      const sql="SELECT c.id,c.daten,c.version,b.seite AS pageId "+
        "FROM saetze c JOIN saetze b ON b.bereich=c.bereich "+
        "AND b.tabelle='blocks' AND b.geloescht=0 AND b.verschluesselt=0 "+
        "AND CASE WHEN json_valid(b.daten) THEN "+
        "(json_extract(b.daten,'$.type')='database' AND "+
        "json_extract(b.daten,'$.collectionId')=c.id) ELSE 0 END "+
        "WHERE c.bereich=?1 AND c.tabelle='collections' "+
        "AND c.geloescht=0 AND c.verschluesselt=0 AND json_valid(c.daten) "+
        "ORDER BY c.geaendert DESC,c.id DESC,b.id DESC LIMIT ?2 OFFSET ?3";
      const found:{databaseId:string;name:string;pageId:string;version:number}[]=[];
      const seen=new Set<string>(),batch=60,maxScanned=2000;
      let scanned=0,visible=0;
      while(scanned<maxScanned&&found.length<=max){
        const result=await db.prepare(sql).bind(w,batch,scanned)
          .all<{id:string;daten:string;version:number;pageId:string|null}>();
        for(const s of result.results){
          if(seen.has(s.id))continue;
          const pageId=typeof s.pageId==='string'?s.pageId:'';
          if(!pageId)continue;
          try{await page(w,pageId,'lesen');}
          catch(error){
            if(error instanceof CloudMcpToolError)continue;
            throw error;
          }
          seen.add(s.id);
          if(visible++<Number(offset))continue;
          const data=JSON.parse(s.daten) as Record<string,unknown>;
          found.push({databaseId:s.id,name:String(data.name||'').slice(0,160),
            pageId,version:Number(s.version)||1});
          if(found.length>max)break;
        }
        scanned+=result.results.length;
        if(result.results.length<batch)break;
      }
      return {workspaceId:w,databases:found.slice(0,max),
        nextOffset:found.length>max?Number(offset)+max:null};
    }
    if(name==='redion_read_pages'){
      const raw=args.documentIds;
      if(!Array.isArray(raw)||raw.length<1||raw.length>10)
        return err('invalid_arguments','Es sind 1 bis 10 Seitenkennungen erforderlich.');
      const ids=raw.map(id=>required(id,128));
      if(new Set(ids).size!==ids.length)
        return err('invalid_arguments','Seitenkennungen dürfen nicht doppelt vorkommen.');
      const max=limit(args.maxChars,2000,2000);
      const documents=[];
      for(const id of ids){
        try{
          const result=await page(w,id,'lesen');
          const content=String(result.data.inhalt||'');
          let end=Math.min(max,content.length);
          const last=content.charCodeAt(end-1),next=content.charCodeAt(end);
          if(end<content.length&&last>=0xD800&&last<=0xDBFF&&next>=0xDC00&&next<=0xDFFF)end++;
          documents.push({documentId:id,title:String(result.data.text||'').slice(0,160),
            content:content.slice(0,end),version:Number(result.s.version)||1,
            totalLength:content.length,nextOffset:end<content.length?end:null});
        }catch(error){
          // Missing, forbidden, encrypted and invalid page records must look
          // identical; otherwise the batch would disclose hidden page IDs.
          if(!(error instanceof CloudMcpToolError))throw error;
          documents.push({documentId:id,unavailable:true});
        }
      }
      return {workspaceId:w,documents};
    }
    if(name==='redion_get_page_path'){
      const id=required(args.documentId,128);
      const path:{documentId:string;title:string;version:number}[]=[];
      const visited=new Set<string>();
      let cursor=id,complete=false;
      for(let depth=0;depth<40;depth++){
        if(visited.has(cursor))return err('invalid_data','Zyklischer Seitenpfad.');
        visited.add(cursor);
        let item:Awaited<ReturnType<typeof page>>;
        try{item=await page(w,cursor,'lesen');}
        catch(error){
          // Never expose any ancestor ID, title, depth or denial reason
          // if a directly shared child has an unreadable parent.
          if(error instanceof CloudMcpToolError&&cursor!==id)
            return {workspaceId:w,documentId:id,unavailable:true};
          throw error;
        }
        path.push({documentId:cursor,title:String(item.data.text||'').slice(0,160),
          version:Number(item.s.version)||1});
        const parent=item.data.parentId;
        if(parent===null||parent===undefined||parent===''){complete=true;break;}
        if(typeof parent!=='string'||parent.length>128||!parent.trim())
          return err('invalid_data','Ungültiger Seitenpfad.');
        cursor=parent;
      }
      if(!complete)return err('invalid_data','Seitenpfad ist zu tief.');
      return {workspaceId:w,documentId:id,path:path.reverse()};
    }
    if(name==='redion_read_page'){
      const id=required(args.documentId,128);
      const result=await page(w,id,'lesen');
      if(args.expectedVersion!==undefined&&expected(args.expectedVersion)!==Number(result.s.version||1))
        return err('conflict','Seite hat sich seit dem letzten Leseabschnitt geändert. Bitte neu beginnen.');
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0)
        return err('invalid_arguments','Ungültiger Leseversatz.');
      const max=limit(args.limit,12000,12000);
      const full=String(result.data.inhalt||'');
      const start=Number(offset);
      if(start>full.length)return err('invalid_arguments','Leseversatz liegt hinter dem Seitenende.');
      // Avoid splitting a surrogate pair, which would corrupt emoji and other
      // non-BMP Unicode characters when a large document is read in chunks.
      const previous=full.charCodeAt(start-1),atStart=full.charCodeAt(start);
      if(start>0&&previous>=0xD800&&previous<=0xDBFF&&atStart>=0xDC00&&atStart<=0xDFFF)
        return err('invalid_arguments','Leseversatz liegt mitten in einem Unicode-Zeichen.');
      let end=Math.min(full.length,start+max);
      const last=full.charCodeAt(end-1),next=full.charCodeAt(end);
      if(end<full.length&&last>=0xD800&&last<=0xDBFF&&next>=0xDC00&&next<=0xDFFF)end++;
      const base={documentId:id,workspaceId:w,title:String(result.data.text||''),
        version:Number(result.s.version)||1,offset:start,totalLength:full.length,
        nextOffset:end<full.length?end:null};
      const part=full.slice(start,end);
      // Some ChatGPT app adapters interpret a top-level "content" property
      // as the MCP transport envelope and silently drop the tool result.
      // Use an unambiguous field name by default; keep an explicit legacy
      // response for existing consumers that expect .content.
      if(args.responseFormat!==undefined&&args.responseFormat!=='portable'&&args.responseFormat!=='legacy')
        return err('invalid_arguments','Unbekanntes Seiten-Antwortformat.');
      return args.responseFormat==='legacy'?{...base,content:part}:{...base,markdown:part};
    }
    if(name==='redion_list_child_pages'||name==='redion_list_root_pages'){
      const root=name==='redion_list_root_pages';
      const parentId=root?'':required(args.parentId,128);
      if(!root)await page(w,parentId,'lesen');
      const max=limit(args.limit,50,100);
      const offset=args.offset===undefined?0:args.offset;
      if(!Number.isSafeInteger(offset)||Number(offset)<0||Number(offset)>100000)
        return err('invalid_arguments','Ungültiger Seitenversatz.');
      // Every returned page is permission-filtered BEFORE SQL pagination.
      // The root view has no inherited parent grant: fall back to the
      // workspace grant. Child pages inherit the verified parent's grant.
      const parentWhere=root?
        "COALESCE(json_extract(s.daten,'$.parentId'),'')=?2":
        "json_extract(s.daten,'$.parentId')=?2";
      const pageRole=(account:string)=>
        "(SELECT CASE WHEN f.rolle IN ('voll','edit','komm','lesen') THEN 1 ELSE 0 END "+
        "FROM freigaben AS f WHERE f.bereich=s.bereich "+
        "AND f.seite=COALESCE(NULLIF(s.seite,''),s.id) AND f.kontoId="+account+")";
      const workspaceRole=(account:string)=>
        "(SELECT CASE WHEN f.rolle IN ('voll','edit','komm','lesen') THEN 1 ELSE 0 END "+
        "FROM freigaben AS f WHERE f.bereich=s.bereich AND f.seite='*' AND f.kontoId="+account+")";
      const fallback=root?
        workspaceRole('?6')+","+workspaceRole("'*'")+",0":"1";
      const rows=await db.prepare(
        "SELECT s.id,s.seite,s.daten,s.version FROM saetze AS s "+
        "WHERE s.bereich=?1 AND s.tabelle='blocks' AND s.geloescht=0 AND s.verschluesselt=0 "+
        "AND CASE WHEN json_valid(s.daten) THEN "+
        "(json_extract(s.daten,'$.type')='page' AND "+parentWhere+") "+
        "ELSE 0 END AND (?5=1 OR COALESCE("+
        pageRole('?6')+","+pageRole("'*'")+","+fallback+
        ")=1) ORDER BY s.geaendert DESC,s.id DESC LIMIT ?3 OFFSET ?4"
      ).bind(w,parentId,max+1,Number(offset),area.besitzer===userId?1:0,userId)
        .all<{id:string;seite:string|null;daten:string;version:number}>();
      const documents=[];
      for(const s of rows.results.slice(0,max)){
        const r=await rolleAuf(ablage,w,String(s.seite||s.id),userId);
        if(!darf(r,'lesen'))continue;
        const data=JSON.parse(s.daten) as Record<string,unknown>;
        documents.push({documentId:s.id,title:String(data.text||'').slice(0,160),version:Number(s.version)||1});
      }
      // If the definitive ACL check rejects a row, do not reveal where
      // additional hidden pages may exist through nextOffset.
      const allVisible=documents.length===Math.min(rows.results.length,max);
      const nextOffset=allVisible&&rows.results.length>max?Number(offset)+max:null;
      return root?{workspaceId:w,documents,nextOffset}:{parentId,documents,nextOffset};
    }
    if(!principal.scopes.includes('redion:write'))
      return err('forbidden','Schreibrechte sind nicht freigegeben.');
    if(name==='redion_add_block'){
      const id=required(args.documentId,128);
      const ver=expected(args.expectedVersion);
      const current=await page(w,id,'bearbeiten');
      const typ=required(args.typ,40);
      const allowedTypes=new Set(['text','h1','h2','h3','todo','bullet','numbered','quote','code','divider']);
      if(!allowedTypes.has(typ))
        return err('invalid_arguments','Diese Blockart erfordert eine eigene geprüfte Schreibfunktion.');
      if(args.inBlockId!==undefined)
        return err('invalid_arguments','Verschachtelte Blockerstellung ist noch nicht freigegeben.');
      const content=args.text===undefined?'':text(args.text,12000);
      if(args.text!==undefined&&(typeof args.text!=='string'||args.text.length>12000))
        return err('invalid_arguments','Blocktext muss ein Text mit höchstens 12.000 Zeichen sein.');
      if(typ==='todo'&&!content.trim())return err('invalid_arguments','Eine Aufgabe benötigt einen Titel.');
      if(args.daten!==undefined&&(!args.daten||typeof args.daten!=='object'||Array.isArray(args.daten)))
        return err('invalid_arguments','Blockdaten müssen ein Objekt sein.');
      const input=args.daten as Record<string,unknown>|undefined;
      const meta:Record<string,unknown>={};
      if(input){
        if(typ!=='todo'||Object.keys(input).some(k=>!['faellig','notiz'].includes(k)))
          return err('invalid_arguments','Nur geprüfte Aufgabenfelder faellig und notiz sind erlaubt.');
        if(input.faellig!==undefined){
          if(typeof input.faellig!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.faellig)||
             !Number.isFinite(Date.parse(input.faellig+'T00:00:00Z'))||
             new Date(input.faellig+'T00:00:00Z').toISOString().slice(0,10)!==input.faellig)
            return err('invalid_arguments','faellig muss ein gültiges Datum JJJJ-MM-TT sein.');
          meta.faellig=input.faellig;
        }
        if(input.notiz!==undefined){
          if(typeof input.notiz!=='string'||input.notiz.length>2000)
            return err('invalid_arguments','Notiz darf maximal 2.000 Zeichen haben.');
          meta.notiz=input.notiz;
        }
      }
      // Keep stale expectedVersion for SQL's conditional INSERT. A genuine
      // retry must still find the existing block after page version advanced.
      if(current.data.content!==undefined&&(!Array.isArray(current.data.content)||
        current.data.content.some(k=>typeof k!=='string'||!k||k.length>128)))
        return err('invalid_data','Die Elternseite enthält eine ungültige Blockliste.');
      if(JSON.stringify(current.data).length>63000)
        return err('too_large','Die Elternseite hat nicht genug Platz für einen weiteren Block.');
      if(!db.batch)
        return err('unavailable','Die D1-Transaktion für Blockerstellung steht nicht zur Verfügung.');
      let requestId='';
      if(args.requestId!==undefined){
        requestId=required(args.requestId,100);
        if(requestId.length<8||!/^[A-Za-z0-9_-]+$/.test(requestId))
          return err('invalid_arguments','requestId muss aus 8–100 Buchstaben, Zahlen, _ oder - bestehen.');
      }
      const canonical=JSON.stringify({w,id,typ,content,meta});
      const hash=async(value:string)=>Array.from(new Uint8Array(
        await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),
        b=>b.toString(16).padStart(2,'0')).join('');
      const fingerprint=await hash(canonical);
      const key=requestId||'version-'+ver+'-'+fingerprint;
      const blockId=(await hash('cloud-mcp-block\0'+principal.grantId+'\0'+w+'\0'+id+'\0'+key)).slice(0,32);
      const now=new Date().toISOString();
      const data={id:blockId,type:typ,text:content,content:[],parentId:id,
        parentTable:'block',alive:true,created:now,edited:now,
        herkunft:'ki',...(typ==='todo'?{checked:false}:{}),...meta,
        mcpRequestHash:fingerprint};
      const payload=JSON.stringify(data);
      if(payload.length>28000)return err('too_large','Blockdaten sind zu gross.');
      // Both statements execute in one D1 transaction. The INSERT is
      // conditional on the same parent version and shape as the UPDATE;
      // neither can leave a detached child on stale-version conflicts.
      const insert=db.prepare(
        "INSERT OR IGNORE INTO saetze (id,bereich,tabelle,daten,verschluesselt,seite,version,geaendert,geloescht,vonGeraet) "+
        "SELECT ?1,?2,'blocks',?3,0,?4,1,?5,0,'Cloud-MCP' FROM saetze p "+
        "WHERE p.bereich=?2 AND p.id=?4 AND p.tabelle='blocks' AND p.version=?6 "+
        "AND p.verschluesselt=0 AND p.geloescht=0 AND p.seite=?4 "+
        "AND json_valid(p.daten) AND json_extract(p.daten,'$.type')='page' "+
        "AND (json_type(p.daten,'$.content') IS NULL OR json_type(p.daten,'$.content')='array') "+
        "AND COALESCE(json_array_length(p.daten,'$.content'),0)<200 "+
        "AND NOT EXISTS (SELECT 1 FROM json_each(CASE "+
        "WHEN json_type(p.daten,'$.content')='array' "+
        "THEN json_extract(p.daten,'$.content') ELSE '[]' END) WHERE value=?1) "+
        "RETURNING id"
      ).bind(blockId,w,payload,id,now,ver);
      const updateParent=db.prepare(
        "UPDATE saetze SET daten=json_set("+
        "CASE WHEN json_type(daten,'$.content')='array' "+
        "THEN json_insert(daten,'$.content[#]',?1) "+
        "ELSE json_set(daten,'$.content',json_array(?1)) END,"+
        "'$.edited',?2),version=version+1,geaendert=?2,vonGeraet='Cloud-MCP' "+
        "WHERE bereich=?3 AND id=?4 AND tabelle='blocks' AND version=?5 "+
        "AND verschluesselt=0 AND geloescht=0 AND json_valid(daten) "+
        "AND json_extract(daten,'$.type')='page' "+
        "AND (json_type(daten,'$.content') IS NULL OR json_type(daten,'$.content')='array') "+
        "AND COALESCE(json_array_length(daten,'$.content'),0)<200 "+
        "AND EXISTS (SELECT 1 FROM saetze child WHERE child.bereich=?3 AND child.id=?1 "+
        "AND child.tabelle='blocks' AND child.verschluesselt=0 AND child.geloescht=0 "+
        "AND json_valid(child.daten) AND json_extract(child.daten,'$.mcpRequestHash')=?6 "+
        "AND json_extract(child.daten,'$.parentId')=?4) "+
        "AND NOT EXISTS (SELECT 1 FROM json_each(CASE WHEN json_type(daten,'$.content')='array' "+
        "THEN json_extract(daten,'$.content') ELSE '[]' END) WHERE value=?1) "+
        "RETURNING version"
      ).bind(blockId,now,w,id,ver,fingerprint);
      const outcome=await db.batch([insert,updateParent]);
      const inserted=Array.isArray(outcome[0]?.results)&&outcome[0].results.length>0;
      const attached=Array.isArray(outcome[1]?.results)&&outcome[1].results.length>0;
      if(inserted&&attached){
        const version=(outcome[1]!.results![0] as {version:number}).version;
        await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',
          text:'Block über Cloud-MCP erstellt',objekt:blockId});
        return {workspaceId:w,documentId:id,blockId,version:1,
          parentVersion:version,alreadyExists:false};
      }
      if(inserted!==attached)
        return err('conflict','Die Blocktransaktion konnte nicht vollständig bestätigt werden.');
      const existing=await ablage.hole('saetze',{bereich:w,id:blockId});
      if(existing&&!existing.geloescht&&!existing.verschluesselt&&existing.tabelle==='blocks'){
        try{
          const stored=JSON.parse(String(existing.daten)) as Record<string,unknown>;
          const fresh=await page(w,id,'lesen');
          if(stored.mcpRequestHash===fingerprint&&stored.parentId===id&&
            Array.isArray(fresh.data.content)&&fresh.data.content.includes(blockId))
            return {workspaceId:w,documentId:id,blockId,
              version:Number(existing.version)||1,parentVersion:Number(fresh.s.version)||1,
              alreadyExists:true};
        }catch(error){if(!(error instanceof CloudMcpToolError))throw error;}
      }
      if(Array.isArray(current.data.content)&&current.data.content.length>=200)
        return err('too_large','Diese Seite hat zu viele Blöcke für einen Cloud-MCP-Aufruf.');
      return err('conflict','Seitenversion oder requestId stimmt nicht mehr. Bitte neu lesen.');
    }
    if(name==='redion_create_page'){
      const title=required(args.title,160);
      if(args.content!==undefined&&(typeof args.content!=='string'||args.content.length>12000))
        err('invalid_arguments','Seiteninhalt muss ein Text mit höchstens 12.000 Zeichen sein.');
      const content=typeof args.content==='string'?args.content:'';
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
      if(typeof args.content!=='string'||args.content.length>4000||!args.content.trim())
        return err('invalid_arguments','Anhang muss einen nichtleeren Text mit höchstens 4.000 Zeichen enthalten.');
      const addition=args.content;
      const old=current.data.inhalt;
      if(typeof old!=='string')return err('not_found','Seite hat keinen Textinhalt.');
      const next=old?old+'\n'+addition:addition;
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
      return update(w,id,ver,{...current.data,parentId:target||null},target||undefined);
    }
    if(name==='redion_update_page'){
      return update(w,id,ver,{...current.data,text:required(args.title,160)});
    }
    if(name==='redion_replace_text'){
      if(typeof args.find!=='string'||!args.find.length||args.find.length>2000)
        return err('invalid_arguments','Suchtext muss 1 bis 2.000 Zeichen enthalten.');
      const find=args.find,replacement=text(args.replacement,4000);
      if(typeof args.replacement!=='string'||args.replacement.length>4000)err('invalid_arguments','Ungültiger Ersatztext.');
      const old=current.data.inhalt;
      if(typeof old!=='string')return err('not_found','Seite hat keinen Textinhalt.');
      if(!old.includes(find))return err('not_found','Text nicht im Seiteninhalt gefunden.');
      return update(w,id,ver,{...current.data,inhalt:old.replaceAll(find,replacement)});
    }
    return err('not_found','Unbekanntes Werkzeug.');
  };
};
