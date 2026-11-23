/* Cloud-MCP actions on the existing Redion sync store.
 * No second document database. Every call checks token workspace selection,
 * current page role and encryption status. Writes are version-conditional.
 */
import type {Ablage} from '../typen.ts';
import type {McpPrincipal} from './oauth.ts';
import type {McpDatabase} from './state.ts';
import {rolleAuf,darf,notieren} from '../kern.ts';

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
  {name:'redion_read_page',description:'Liest maximal 12.000 Zeichen einer freigegebenen Klartext-Seite. expectedVersion aus der ersten Antwort beim Nachladen mitsenden, damit Abschnitte nicht aus unterschiedlichen Versionen stammen.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,offset:{type:'integer',minimum:0},limit:{type:'integer',minimum:1,maximum:12000},expectedVersion:{type:'integer',minimum:1}},required:['workspaceId','documentId'],additionalProperties:false}},
  {name:'redion_get_page_path',description:'Zeigt den Pfad einer lesbaren Seite von der Hauptseite bis zum Dokument. Wenn ein Vorfahr nicht lesbar ist, werden keine Pfadteile offengelegt.',
    inputSchema:{type:'object',properties:{...workspace,...documentId},required:['workspaceId','documentId'],additionalProperties:false}},
  {name:'redion_read_pages',description:'Liest bis zu 10 Seiten auf einmal, maximal 2.000 Zeichen pro Seite. Unzugängliche IDs werden einheitlich als nicht verfügbar markiert.',
    inputSchema:{type:'object',properties:{...workspace,documentIds:{type:'array',items:{type:'string',minLength:1,maxLength:128},minItems:1,maxItems:10},maxChars:{type:'integer',minimum:1,maximum:2000}},
      required:['workspaceId','documentIds'],additionalProperties:false}},
  {name:'redion_create_page',description:'Legt eine Seite an. requestId verhindert doppelte Erstellung bei Wiederholung.',
    inputSchema:{type:'object',properties:{...workspace,title:nameField,content:{type:'string',maxLength:12000},parentId:idField,requestId:{type:'string',minLength:8,maxLength:100}},
      required:['workspaceId','title','requestId'],additionalProperties:false}},
  {name:'redion_update_page',description:'Ändert den Seitentitel nur bei passender expectedVersion.',
    inputSchema:{type:'object',properties:{...workspace,...documentId,title:nameField,expectedVersion:{type:'integer',minimum:1}},
      required:['workspaceId','documentId','title','expectedVersion'],additionalProperties:false}},
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
const writeNames=new Set(['redion_create_page','redion_update_page','redion_replace_text','redion_append_content','redion_move_page']);
// MCP annotations tell AI clients which tools are read-only, additive or
// modifying. They are advisory; server-side OAuth and ACL checks still govern.
const toolTitles:Record<string,string>={
  redion_list_workspaces:'Bereiche auflisten',
  redion_search:'Seiten und Inhalte suchen',
  redion_read_page:'Seite lesen',
  redion_get_page_path:'Seitenpfad anzeigen',
  redion_read_pages:'Mehrere Seiten lesen',
  redion_create_page:'Seite erstellen',
  redion_update_page:'Seitentitel ändern',
  redion_list_databases:'Datenbanken auflisten',
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
        idempotentHint:t.name==='redion_create_page',
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
    const area=await inScope(w);
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
      return {documentId:id,workspaceId:w,title:String(result.data.text||''),
        content:full.slice(start,end),version:Number(result.s.version)||1,
        offset:start,totalLength:full.length,nextOffset:end<full.length?end:null};
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
