/* Cloud-MCP actions on the existing Redion sync store.
 * No second document database. Every call checks token workspace selection,
 * current page role and encryption status. Writes are version-conditional.
 */
import type {Ablage} from '../typen.ts';
import type {McpPrincipal} from './oauth.ts';
import {rolleAuf,darf,notieren} from '../kern.ts';
import {textToBlocks,appBlock,appPage,blockToLine,stampAfter,MAX_BLOCKS} from './page-blocks.ts';
import {buildPlan,describePlan,listSymbols,symbolGroups,PLAN_ARTEN,LIMITS,SchematicError} from './schematic.ts';
import {buildSchema,rowProps,describeRow,describeSchema,databaseRecords,rowRecord,DatabaseError,LAYOUTS,WRITABLE_TYPES,LIMITS as DB_LIMITS,type Schema} from './databases.ts';
/* Fehler der Eingabe eines Schaltplans werden zu Werkzeugfehlern mit Satz. */
const plan=(input:Args,prefix:string)=>{
  try{return buildPlan(input,prefix);}
  catch(e){if(e instanceof SchematicError)return err('invalid_arguments',e.message);throw e;}
};

type Db={prepare(sql:string):{bind(...values:(string|number)[]):{first<T>():Promise<T|null>;all<T>():Promise<{results:T[]}>}}};
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
  {name:'redion_create_page',description:'Legt eine Seite an, die sofort in der Redion-App erscheint. content ist Markdown: je Zeile ein Block (# Überschrift, - Liste, 1. Nummer, - [ ] Aufgabe, > Zitat, --- Linie). requestId verhindert doppelte Erstellung bei Wiederholung.',
    inputSchema:{type:'object',properties:{...workspace,title:nameField,content:{type:'string',maxLength:12000},parentId:idField,requestId:{type:'string',minLength:8,maxLength:100}},
      required:['workspaceId','title','requestId'],additionalProperties:false}},
  {name:'redion_append_content',description:'Hängt Markdown-Inhalt (je Zeile ein Block) unten an eine Klartext-Seite an, nur bei passender expectedVersion.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,content:{type:'string',minLength:1,maxLength:12000},expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId','content','expectedVersion'],additionalProperties:false}},
  {name:'redion_update_page',description:'Ändert den Seitentitel nur bei passender expectedVersion.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,title:nameField,expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId','title','expectedVersion'],additionalProperties:false}},
  {name:'redion_replace_text',description:'Ersetzt Text im Seiteninhalt mit Versionskontrolle; nicht in verschlüsselten Seiten.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,find:{type:'string',minLength:1,maxLength:2000},
      replacement:{type:'string',maxLength:4000},expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId','find','replacement','expectedVersion'],additionalProperties:false}},
  {name:'redion_trash_page',description:'Legt eine Klartext-Seite in den Papierkorb der App (wiederherstellbar, nicht endgültig gelöscht).',
    inputSchema:{type:'object',properties:{...workspace,...documentId,expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId','expectedVersion'],additionalProperties:false}},
  /* --- Schaltpläne (schematic.ts) ------------------------------------- */
  {name:'redion_list_symbols',description:'Listet die Schaltzeichen der Redion-Schaltpläne mit Kennung, Gruppe, Kennbuchstabe, Grösse (Raster 10) und Anschlussnummern. Vor redion_add_schematic aufrufen.',
    inputSchema:{type:'object',properties:{gruppe:{type:'string',maxLength:40},suche:{type:'string',maxLength:80}},additionalProperties:false}},
  {name:'redion_add_schematic',description:'Fügt einer Klartext-Seite einen Schaltplan hinzu, der in der App wie selbst gezeichnet erscheint. teile: Schaltzeichen mit x/y (Raster 10, y nach unten), drehung 0/90/180/270, optional bmk (sonst K1, S1 … automatisch). verbindungen: von/nach als Klemme „BMK:Anschluss“ (z. B. „K1:A1“ → „S1:14“); die Leitung wird rechtwinklig auf die Anschlüsse gelegt, optional mit punkte als Zwischenpunkten und schiene L1/L2/L3/N/PE.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,expectedVersion:{type:'integer',minimum:1},titel:{type:'string',maxLength:160},
      art:{type:'string',enum:[...PLAN_ARTEN]},
      teile:{type:'array',maxItems:LIMITS.teile,items:{type:'object',properties:{zeichen:{type:'string'},x:{type:'number'},y:{type:'number'},
        drehung:{type:'integer',enum:[0,90,180,270]},gespiegelt:{type:'boolean'},bmk:{type:'string',maxLength:20},ref:{type:'string',maxLength:40},
        beschriftung:{type:'string',maxLength:120},werte:{type:'object',additionalProperties:{type:'number'}}},required:['zeichen','x','y'],additionalProperties:false}},
      verbindungen:{type:'array',maxItems:LIMITS.verbindungen,items:{type:'object',properties:{von:{type:'string'},nach:{type:'string'},
        schiene:{type:'string',enum:['L1','L2','L3','N','PE']},punkte:{type:'array',maxItems:50,items:{type:'object',properties:{x:{type:'number'},y:{type:'number'}},required:['x','y'],additionalProperties:false}}},
        required:['von','nach'],additionalProperties:false}},
      texte:{type:'array',maxItems:LIMITS.texte,items:{type:'object',properties:{x:{type:'number'},y:{type:'number'},t:{type:'string',maxLength:200}},required:['x','y','t'],additionalProperties:false}}},
      required:['workspaceId','documentId','expectedVersion','teile'],additionalProperties:false}},
  {name:'redion_read_schematic',description:'Liest einen Schaltplan-Block: Bauteile mit BMK und Lage, Verbindungen als Klemmen.',
    inputSchema:{type:'object',properties:{...workspace,blockId:idField},required:['workspaceId','blockId'],additionalProperties:false}},
  {name:'redion_update_schematic',description:'Ersetzt den Inhalt eines Schaltplan-Blocks (gleiche Felder wie redion_add_schematic) bei passender expectedVersion des Blocks.',
    inputSchema:{type:'object',properties:{...workspace,blockId:idField,expectedVersion:{type:'integer',minimum:1},titel:{type:'string',maxLength:160},
      art:{type:'string',enum:[...PLAN_ARTEN]},teile:{type:'array',maxItems:LIMITS.teile,items:{type:'object'}},
      verbindungen:{type:'array',maxItems:LIMITS.verbindungen,items:{type:'object'}},texte:{type:'array',maxItems:LIMITS.texte,items:{type:'object'}}},
      required:['workspaceId','blockId','expectedVersion','teile'],additionalProperties:false}},
  /* --- Datenbanken (databases.ts) ------------------------------------- */
  {name:'redion_list_databases',description:'Listet die Klartext-Datenbanken eines Bereichs mit Kennung, Name und Spalten.',
    inputSchema:{type:'object',properties:{...workspace},required:['workspaceId'],additionalProperties:false}},
  {name:'redion_read_database',description:'Liest eine Datenbank: Spalten (Name, Typ, Optionen) und Zeilen als Spaltenname → Wert, mit rowId und Version.',
    inputSchema:{type:'object',properties:{...workspace,databaseId:idField,limit:{type:'integer',minimum:1,maximum:500}},required:['workspaceId','databaseId'],additionalProperties:false}},
  {name:'redion_create_database',description:'Legt auf einer Klartext-Seite eine Datenbank an, die in der App erscheint. spalten: name und typ ('+WRITABLE_TYPES.join(', ')+'), bei select/multi/status optionen. Ohne title-Spalte kommt „Name“ dazu. zeilen: Objekte Spaltenname → Wert (Datum JJJJ-MM-TT, Spanne „a → b“).',
    inputSchema:{type:'object',properties:{...workspace,...documentId,expectedVersion:{type:'integer',minimum:1},name:nameField,
      ansicht:{type:'string',enum:[...LAYOUTS]},
      spalten:{type:'array',minItems:1,maxItems:DB_LIMITS.spalten,items:{type:'object',properties:{name:{type:'string',maxLength:80},
        typ:{type:'string',enum:[...WRITABLE_TYPES]},optionen:{type:'array',maxItems:DB_LIMITS.optionen,items:{type:'string',maxLength:80}}},required:['name','typ'],additionalProperties:false}},
      zeilen:{type:'array',maxItems:DB_LIMITS.zeilen,items:{type:'object'}}},
      required:['workspaceId','documentId','expectedVersion','name','spalten'],additionalProperties:false}},
  {name:'redion_add_rows',description:'Fügt einer Klartext-Datenbank Zeilen hinzu (Spaltenname → Wert). Neue Auswahl-Optionen werden ergänzt.',
    inputSchema:{type:'object',properties:{...workspace,databaseId:idField,zeilen:{type:'array',minItems:1,maxItems:DB_LIMITS.zeilen,items:{type:'object'}}},
      required:['workspaceId','databaseId','zeilen'],additionalProperties:false}},
  {name:'redion_update_row',description:'Ändert Werte einer Zeile (Spaltenname → Wert) bei passender expectedVersion; papierkorb:true legt sie in den Papierkorb.',
    inputSchema:{type:'object',properties:{...workspace,rowId:idField,expectedVersion:{type:'integer',minimum:1},werte:{type:'object'},papierkorb:{type:'boolean'}},
      required:['workspaceId','rowId','expectedVersion'],additionalProperties:false}}
];
const writeNames=new Set(['redion_create_page','redion_append_content','redion_update_page','redion_replace_text','redion_trash_page',
  'redion_add_schematic','redion_update_schematic','redion_create_database','redion_add_rows','redion_update_row']);
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
  /* Ein Zeitstempel nach allem, was der Bereich schon hat (page-blocks.ts). */
  const stamp=async(w:string)=>{
    const r=await db.prepare('SELECT MAX(geaendert) AS m FROM saetze WHERE bereich=?1').bind(w).first<{m:string|null}>();
    return stampAfter(r?.m);
  };
  const insertRow=async(w:string,satz:Record<string,unknown>&{id:string},seite:string,at:string,
                        tabelle:'blocks'|'collections'|'views'='blocks')=>{
    const payload=JSON.stringify(satz);
    if(payload.length>64000)return err('invalid_arguments','Ein Eintrag ist zu gross.');
    return db.prepare(
      'INSERT OR IGNORE INTO saetze (id,bereich,tabelle,daten,verschluesselt,seite,version,geaendert,geloescht,vonGeraet) '+
      "VALUES (?1,?2,?6,?3,0,?4,1,?5,0,'Cloud-MCP') RETURNING version"
    ).bind(satz.id,w,payload,seite,at,tabelle).first<{version:number}>();
  };
  /* Eine Sammlung (Datenbank) im Klartext, mit Recht auf ihr. */
  const collection=async(w:string,id:string,permission:'lesen'|'bearbeiten')=>{
    const s=await ablage.hole('saetze',{bereich:w,id});
    if(!s||s.geloescht||s.tabelle!=='collections')return err('not_found','Datenbank nicht gefunden.');
    await role(w,id,permission);
    if(s.verschluesselt)return err('encrypted','Diese Datenbank ist verschlüsselt und für die Cloud nicht lesbar.');
    let data:Record<string,any>;
    try{data=JSON.parse(String(s.daten||'{}'));}catch{return err('invalid_data','Unlesbare Datenbank.');}
    if(!data||typeof data.schema!=='object')return err('invalid_data','Datenbank ohne Schema.');
    return {s,data};
  };
  /* Die Klartext-Zeilen einer Sammlung — über json_extract, nicht über den
     ganzen Bestand (CPU-Grenze des Gratis-Tarifs). Verschlüsselte Sätze sind
     kein JSON; das CASE fragt sie gar nicht erst. */
  const rowsOf=async(w:string,colId:string,limit:number)=>(await db.prepare(
    "SELECT id,daten,version FROM saetze WHERE bereich=?1 AND tabelle='blocks' AND geloescht=0 AND "+
    "(CASE WHEN verschluesselt=0 AND json_valid(daten) THEN json_extract(daten,'$.parentId') END)=?2 "+
    "ORDER BY geaendert LIMIT ?3").bind(w,colId,limit).all<{id:string;daten:string;version:number}>()).results
    .map(r=>{try{return {id:r.id,version:Number(r.version)||1,data:JSON.parse(r.daten)};}catch{return null;}})
    .filter((r):r is {id:string;version:number;data:any}=>!!r&&r.data.alive!==false&&r.data.parentTable==='collection');
  /* Die Sammlung samt neuen Optionen zurückschreiben (Version geprüft). */
  const saveCollection=async(w:string,c:{s:any;data:any},schema:Schema,at:string)=>{
    if(JSON.stringify(schema)===JSON.stringify(c.data.schema))return Number(c.s.version)||1;
    const changed=await db.prepare(
      "UPDATE saetze SET daten=?1,version=version+1,geaendert=?2,vonGeraet='Cloud-MCP' "+
      "WHERE bereich=?3 AND id=?4 AND version=?5 AND verschluesselt=0 AND tabelle='collections' RETURNING version"
    ).bind(JSON.stringify({...c.data,schema,edited:at}),at,w,String(c.s.id),Number(c.s.version)||1).first<{version:number}>();
    if(!changed)return err('conflict','Die Datenbank wurde zwischenzeitlich geändert. Bitte erneut versuchen.');
    return changed.version;
  };
  const dbErr=<T>(f:()=>T):T=>{try{return f();}catch(e){if(e instanceof DatabaseError)return err('invalid_arguments',e.message);throw e;}};
  const newRows=async(w:string,colId:string,schema:Schema,zeilen:unknown,at:string,seed:string)=>{
    const liste=Array.isArray(zeilen)?zeilen:[];
    if(liste.length>DB_LIMITS.zeilen)err('invalid_arguments','Höchstens '+DB_LIMITS.zeilen+' Zeilen auf einmal.');
    const ids:string[]=[];
    for(const [i,werte] of liste.entries()){
      const {props,title}=dbErr(()=>rowProps(schema,werte));
      const id=(seed+'r'+i.toString(36)).slice(0,64);
      await insertRow(w,rowRecord(id,colId,props,title,at,i+1),id,at);
      ids.push(id);
    }
    return ids;
  };
  const updateRow=async(w:string,id:string,old:number,updated:Record<string,unknown>,at:string)=>{
    const payload=JSON.stringify(updated);
    if(payload.length>64000)return err('invalid_arguments','Seite ist für diese Änderung zu gross.');
    const changed=await db.prepare(
      "UPDATE saetze SET daten=?1,version=version+1,geaendert=?2,vonGeraet='Cloud-MCP' "+
      "WHERE bereich=?3 AND id=?4 AND version=?5 AND geloescht=0 AND verschluesselt=0 AND tabelle='blocks' RETURNING version"
    ).bind(payload,at,w,id,old).first<{version:number}>();
    if(!changed)return err('conflict','Seite wurde zwischenzeitlich geändert. Bitte erneut lesen.');
    return changed.version;
  };
  const update=async(w:string,id:string,old:number,updated:Record<string,unknown>)=>{
    const at=await stamp(w);
    const version=await updateRow(w,id,old,{...updated,edited:at},at);
    await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Seite über Cloud-MCP bearbeitet',objekt:id});
    return {documentId:id,version};
  };
  /* Die Kindblöcke einer Seite im App-Format, in ihrer Reihenfolge. */
  const children=async(w:string,data:Record<string,unknown>)=>{
    const ids=Array.isArray(data.content)?data.content.map(String).slice(0,MAX_BLOCKS*2):[];
    const out:Array<{row:Record<string,any>;data:Record<string,any>}>=[];
    for(const cid of ids){
      const row=await ablage.hole('saetze',{bereich:w,id:cid});
      if(!row||row.geloescht||row.verschluesselt||row.tabelle!=='blocks')continue;
      try{const d=JSON.parse(String(row.daten||'{}'));if(d&&d.alive!==false)out.push({row,data:d});}catch{}
    }
    return out;
  };
  /* Neue Kindblöcke anlegen; liefert ihre Kennungen. Deterministisch aus der
     Seite und dem Zähler, damit eine Wiederholung nichts doppelt anlegt. */
  const addChildren=async(w:string,pageId:string,seite:string,content:string,start:number,at:string)=>{
    const ids:string[]=[];
    let n=start;
    for(const b of textToBlocks(content)){
      const id=(pageId+'b'+(n++).toString(36)).slice(0,64);
      await insertRow(w,appBlock(id,b.type,b.text,pageId,at,b.checked===undefined?{}:{checked:b.checked}),seite,at);
      ids.push(id);
    }
    return ids;
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
    if(name==='redion_list_symbols')
      return {raster:10,gruppen:symbolGroups(),symbole:listSymbols(text(args.gruppe,40),text(args.suche,80))};
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
        if(data.type!=='page'||data.alive===false||query&&!String(data.text||'').toLocaleLowerCase().includes(query))continue;
        const r=await rolleAuf(ablage,w,String(s.seite||s.id),userId);
        if(darf(r,'lesen'))found.push({documentId:s.id,title:String(data.text||'').slice(0,160),version:Number(s.version)||1});
      }
      return {documents:found};
    }
    if(name==='redion_read_page'){
      const id=required(args.documentId,128);
      const result=await page(w,id,'lesen');
      /* Alte Cloud-Seiten trugen `inhalt`; Seiten der App tragen Kindblöcke. */
      const content=typeof result.data.inhalt==='string'&&!Array.isArray(result.data.content)
        ?result.data.inhalt
        :(await children(w,result.data)).map(c=>blockToLine(c.data)).join('\n');
      return {documentId:id,workspaceId:w,title:String(result.data.text||''),
        content,version:Number(result.s.version)||1,inTrash:result.data.alive===false};
    }
    /* Ein einzelner Block (nicht die Seite), mit Recht auf seiner Seite. */
    const block=async(id:string,permission:'lesen'|'bearbeiten',type:string)=>{
      const s=await ablage.hole('saetze',{bereich:w,id});
      if(!s||s.geloescht||s.tabelle!=='blocks')return err('not_found','Block nicht gefunden.');
      await role(w,String(s.seite||id),permission);
      if(s.verschluesselt)return err('encrypted','Verschlüsselte Inhalte sind für die Cloud nicht lesbar.');
      let data:Record<string,any>;
      try{data=JSON.parse(String(s.daten||'{}'));}catch{return err('invalid_data','Unlesbarer Block.');}
      if(!data||data.type!==type)return err('not_found','Kein Block der Art „'+type+'“.');
      return {s,data};
    };
    if(name==='redion_read_schematic'){
      const id=required(args.blockId,128);
      const b=await block(id,'lesen','schaltplan');
      return {blockId:id,titel:String(b.data.text||''),version:Number(b.s.version)||1,...describePlan(b.data.plan)};
    }
    if(name==='redion_list_databases'){
      await role(w,'*','lesen');
      const rows=(await db.prepare("SELECT id,daten FROM saetze WHERE bereich=?1 AND tabelle='collections' AND verschluesselt=0 AND geloescht=0 LIMIT 200")
        .bind(w).all<{id:string;daten:string}>()).results;
      const out=[];
      for(const r of rows){
        try{const d=JSON.parse(r.daten);if(darf(await rolleAuf(ablage,w,r.id,userId),'lesen'))
          out.push({databaseId:r.id,name:String(d.name||''),spalten:Object.values(d.schema||{}).map((c:any)=>c.name)});}catch{}
      }
      return {databases:out};
    }
    if(name==='redion_read_database'){
      const id=required(args.databaseId,128);
      const c=await collection(w,id,'lesen');
      const rows=await rowsOf(w,id,limit(args.limit,200,500));
      return {databaseId:id,name:String(c.data.name||''),version:Number(c.s.version)||1,spalten:describeSchema(c.data.schema),
        zeilen:rows.map(r=>({rowId:r.id,version:r.version,werte:describeRow(c.data.schema,r.data)}))};
    }
    if(!principal.scopes.includes('redion:write'))
      return err('forbidden','Schreibrechte sind nicht freigegeben.');
    if(name==='redion_add_rows'){
      const id=required(args.databaseId,128);
      const c=await collection(w,id,'bearbeiten');
      const schema:Schema=structuredClone(c.data.schema);
      const at=await stamp(w);
      const ids=await newRows(w,id,schema,args.zeilen,at,id.slice(-8)+Date.now().toString(36));
      await saveCollection(w,c,schema,at);
      await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:ids.length+' Zeilen über Cloud-MCP',objekt:id});
      return {databaseId:id,rowIds:ids};
    }
    if(name==='redion_update_row'){
      const id=required(args.rowId,128);
      const r=await block(id,'bearbeiten','page');
      if(r.data.parentTable!=='collection')err('not_found','Das ist keine Datenbankzeile.');
      const ver=expected(args.expectedVersion);
      if(ver!==Number(r.s.version||1))err('conflict','Zeile wurde zwischenzeitlich geändert. Bitte erneut lesen.');
      const c=await collection(w,String(r.data.parentId),'bearbeiten');
      const schema:Schema=structuredClone(c.data.schema);
      const neu:{props:Record<string,unknown>}=args.werte===undefined?{props:{}}:dbErr(()=>rowProps(schema,args.werte));
      const at=await stamp(w);
      const props={...(r.data.props||{}),...neu.props};
      const satz:Record<string,unknown>={...r.data,props,edited:at,
        ...(neu.props.title!==undefined?{text:String(neu.props.title)}:{}),
        ...(args.papierkorb===true?{alive:false,trashedAt:at}:{})};
      const version=await updateRow(w,id,ver,satz,at);
      await saveCollection(w,c,schema,at);
      return {rowId:id,version,werte:describeRow(schema,satz),inPapierkorb:satz.alive===false};
    }
    if(name==='redion_update_schematic'){
      const id=required(args.blockId,128);
      const b=await block(id,'bearbeiten','schaltplan');
      const ver=expected(args.expectedVersion);
      if(ver!==Number(b.s.version||1))err('conflict','Schaltplan wurde zwischenzeitlich geändert. Bitte erneut lesen.');
      const built=plan(args,id.slice(-6)+'u'+Date.now().toString(36).slice(-4));
      const at=await stamp(w);
      const titel=args.titel===undefined?b.data.text:text(args.titel,160);
      const version=await updateRow(w,id,ver,{...b.data,text:titel,plan:built.plan,edited:at},at);
      await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Schaltplan über Cloud-MCP geändert',objekt:id});
      return {blockId:id,version,teile:built.plan.teile.length,leitungen:built.plan.leitungen.length,warnungen:built.warnungen};
    }
    if(name==='redion_create_page'){
      const title=required(args.title,160);
      const content=text(args.content??'',12000);
      if(args.content!==undefined&&typeof args.content!=='string')err('invalid_arguments','Ungültiger Seiteninhalt.');
      const parentId=args.parentId===undefined?'':text(args.parentId,128);
      if(args.parentId!==undefined&&!parentId)err('invalid_arguments','Ungültige Elternseite.');
      const parent=parentId?await page(w,parentId,'bearbeiten'):null;
      if(!parent)await role(w,'*','bearbeiten');
      const key=required(args.requestId,100);
      if(key.length<8||!/^[A-Za-z0-9_-]+$/.test(key))err('invalid_arguments','requestId ist ungültig.');
      const bytes=new TextEncoder().encode('cloud-mcp-page\0'+principal.grantId+'\0'+w+'\0'+key);
      const digest=await crypto.subtle.digest('SHA-256',bytes);
      const documentId=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('').slice(0,32);
      const existing=await ablage.hole('saetze',{bereich:w,id:documentId});
      if(existing){
        const again=await page(w,documentId,'lesen');
        if(again.data.text!==title||(again.data.parentId??null)!==(parentId||null))
          err('conflict','requestId wurde bereits für eine andere Seite verwendet.');
        return {documentId,version:Number(again.s.version)||1,alreadyExists:true};
      }
      const at=await stamp(w);
      /* Erst die Kinder, dann die Seite, dann der Eintrag beim Elternteil:
         bricht etwas ab, bleibt höchstens ein unsichtbarer Kindblock — nie
         eine Seite, die auf Fehlendes zeigt. */
      const childIds=await addChildren(w,documentId,documentId,content,0,at);
      const row=await insertRow(w,appPage(documentId,title,parentId||null,childIds,at),documentId,at);
      if(!row)return err('conflict','Seite konnte nicht angelegt werden. Bitte erneut versuchen.');
      if(parent){
        const list=Array.isArray(parent.data.content)?parent.data.content.map(String):[];
        await updateRow(w,parentId,Number(parent.s.version)||1,{...parent.data,content:[...list,documentId],edited:at},at);
      }
      await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Neue Seite über Cloud-MCP',objekt:documentId});
      return {documentId,version:1,alreadyExists:false,blocks:childIds.length};
    }
    const id=required(args.documentId,128);
    const current=await page(w,id,'bearbeiten');
    const ver=expected(args.expectedVersion);
    if(ver!==Number(current.s.version||1))err('conflict','Seite wurde zwischenzeitlich geändert. Bitte erneut lesen.');
    if(name==='redion_update_page'){
      return update(w,id,ver,{...current.data,text:required(args.title,160)});
    }
    if(name==='redion_trash_page'){
      const at=await stamp(w);
      return update(w,id,ver,{...current.data,alive:false,trashedAt:at});
    }
    if(name==='redion_create_database'){
      const content=current.data.content;
      if(!Array.isArray(content))return err('invalid_arguments','Diese Seite hat noch das alte Format. Bitte eine neue Seite anlegen.');
      const dbName=required(args.name,160);
      const seed=(id.slice(-6)+Date.now().toString(36)).slice(-10);
      const schema=dbErr(()=>buildSchema(args.spalten,seed));
      const layout=args.ansicht===undefined?'table':String(args.ansicht);
      if(!(LAYOUTS as readonly string[]).includes(layout))err('invalid_arguments','Unbekannte Ansicht.');
      const at=await stamp(w);
      const rec=databaseRecords({name:dbName,schema,layout,pageId:id,seed,at});
      const {colId,blockId}=rec;
      /* Erst die Zeilen, dann die Sammlung (mit den dabei ergänzten Optionen),
         Ansicht und Block — der Block zuletzt, damit nie etwas ins Leere zeigt. */
      const rowIds=await newRows(w,colId,schema,args.zeilen,at,colId);
      await insertRow(w,{...rec.collection,schema},colId,at,'collections');
      await insertRow(w,rec.view,colId,at,'views');
      await insertRow(w,rec.block,String(current.s.seite||id),at);
      const r=await update(w,id,ver,{...current.data,content:[...content.map(String),blockId]});
      await notieren(ablage,{bereich:w,kontoId:userId,art:'mcp',text:'Datenbank über Cloud-MCP angelegt',objekt:colId});
      return {...r,databaseId:colId,blockId,rowIds,spalten:describeSchema(schema)};
    }
    if(name==='redion_add_schematic'){
      const content=current.data.content;
      if(!Array.isArray(content))return err('invalid_arguments','Diese Seite hat noch das alte Format. Bitte eine neue Seite anlegen.');
      const list=content.map(String);
      const blockId=(id+'s'+Date.now().toString(36)).slice(0,64);
      const built=plan(args,blockId.slice(-6));
      const at=await stamp(w);
      await insertRow(w,appBlock(blockId,'schaltplan',text(args.titel,160),id,at,{plan:built.plan}),String(current.s.seite||id),at);
      const r=await update(w,id,ver,{...current.data,content:[...list,blockId]});
      return {...r,blockId,teile:built.plan.teile.length,leitungen:built.plan.leitungen.length,warnungen:built.warnungen};
    }
    if(name==='redion_append_content'){
      const content=required(args.content,12000);
      const list=Array.isArray(current.data.content)?current.data.content.map(String):[];
      if(!Array.isArray(current.data.content)&&typeof current.data.inhalt==='string')
        return update(w,id,ver,{...current.data,inhalt:current.data.inhalt+'\n'+content});
      if(list.length+textToBlocks(content).length>MAX_BLOCKS*2)err('invalid_arguments','Seite hat zu viele Blöcke.');
      const at=await stamp(w);
      const added=await addChildren(w,id,String(current.s.seite||id),content,list.length+Date.now()%100000,at);
      return {...await update(w,id,ver,{...current.data,content:[...list,...added]}),blocks:added.length};
    }
    if(name==='redion_replace_text'){
      const find=required(args.find,2000),replacement=text(args.replacement,4000);
      if(typeof args.replacement!=='string'||args.replacement.length>4000)err('invalid_arguments','Ungültiger Ersatztext.');
      const old=current.data.inhalt;
      if(!Array.isArray(current.data.content)){
        if(typeof old!=='string')return err('not_found','Seite hat keinen Textinhalt.');
        if(!old.includes(find))return err('not_found','Text nicht im Seiteninhalt gefunden.');
        return update(w,id,ver,{...current.data,inhalt:old.replaceAll(find,replacement)});
      }
      const hits=(await children(w,current.data)).filter(c=>String(c.data.text||'').includes(find));
      if(!hits.length)return err('not_found','Text nicht im Seiteninhalt gefunden.');
      const at=await stamp(w);
      for(const c of hits)
        await updateRow(w,String(c.row.id),Number(c.row.version)||1,{...c.data,text:String(c.data.text).replaceAll(find,replacement),edited:at},at);
      return {...await update(w,id,ver,{...current.data}),changedBlocks:hits.length};
    }
    return err('not_found','Unbekanntes Werkzeug.');
  };
};
