/* Gleiche saetze wie /sync. Momentaufnahme nur im Request-Speicher, kein
 * zweiter Dokumentbestand. D1.batch + CHECK garantiert alles oder nichts;
 * null betroffene UPDATE-Zeilen allein wären in D1 kein Rollback.
 */
import {rolleAuf,darf,feldFilter} from '../kern.ts';
import type {Ablage,Satz,Wo,FindeOpt} from '../typen.ts';
import type {McpPrincipal} from './oauth.ts';

export type SqlValue=string|number|null;
export type CloudStatement={bind(...values:SqlValue[]):CloudStatement;first<T>():Promise<T|null>;all<T>():Promise<{results:T[]}>};
export type CloudDatabase={prepare(sql:string):CloudStatement;batch(statements:CloudStatement[]):Promise<{results:Satz[]}[]>};
export type CloudRecord={id:string;bereich:string;tabelle:string;daten:string;verschluesselt:number;seite:string;version:number;
  geaendert:string;geloescht:number;vonGeraet:string};
export class CloudError extends Error {readonly code:string;constructor(code:string){super(code);this.code=code;}}
export const cloudError=(code:string):never=>{throw new CloudError(code);};
const keys:Record<string,string[]>={konten:['id'],bereiche:['id'],freigaben:['bereich','seite','kontoId'],
  feldrechte:['bereich','sammlung','feld','kontoId'],saetze:['bereich','id']};
const columns:Record<string,string[]>={konten:['id','mail','name','bild','herkunft','angelegt','gesperrt'],bereiche:['id','name','besitzer','angelegt'],
  freigaben:['bereich','seite','kontoId','rolle','von','wann'],feldrechte:['bereich','sammlung','feld','kontoId','rolle','von','wann'],
  saetze:['id','bereich','tabelle','daten','verschluesselt','seite','version','geaendert','geloescht','vonGeraet']};
const clone=<T>(value:T):T=>structuredClone(value);
const placeholders=(length:number):string=>Array.from({length},()=>'?').join(',');
const sqlValue=(value:unknown):SqlValue=>typeof value==='string'||typeof value==='number'?value:value===true?1:value===false?0:null;
const matches=(row:Satz,where:Wo):boolean=>Object.entries(where).every(([k,v])=>row[k]===v);
type Snapshot={table:string;where:string;values:SqlValue[];rows:Satz[]};

export const openCloudRepository=async(db:CloudDatabase,principal:McpPrincipal,now:()=>number=Date.now)=>{
  if(!principal.scopes.includes('redion:read')||!principal.workspaceIds.length||principal.workspaceIds.length>20||principal.checks.length!==3)return cloudError('PERMISSION_DENIED');
  const workspaceIds=[...new Set(principal.workspaceIds)];
  const snapshots:Snapshot[]=[],recordCache=new Map<string,CloudRecord|null>();
  const marks=placeholders(workspaceIds.length);
  const definitions=[
    {table:'konten',where:'id=?',values:[principal.userId]},
    {table:'bereiche',where:'id IN ('+marks+')',values:workspaceIds},
    {table:'freigaben',where:'bereich IN ('+marks+') AND (kontoId=? OR kontoId=\'*\')',values:[...workspaceIds,principal.userId]},
    {table:'feldrechte',where:'bereich IN ('+marks+') AND (kontoId=? OR kontoId=\'*\')',values:[...workspaceIds,principal.userId]}
  ];
  const prefetched=await db.batch(definitions.map(d=>db.prepare('SELECT * FROM '+d.table+' WHERE '+d.where+' LIMIT 501').bind(...d.values)));
  for(let i=0;i<definitions.length;i++){
    const definition=definitions[i]!,rows=prefetched[i]!.results;
    if(rows.length>500)return cloudError('ACTION_TOO_LARGE');snapshots.push({...definition,rows:clone(rows)});
  }
  const account=snapshots[0]!.rows[0];if(!account||account.gesperrt)return cloudError('PERMISSION_DENIED');
  const raw=async(workspaceId:string,id:string):Promise<CloudRecord|null>=>{
    if(!workspaceIds.includes(workspaceId))return cloudError('PERMISSION_DENIED');
    const key=workspaceId+'\0'+id;if(recordCache.has(key))return clone(recordCache.get(key)!);
    const row=await db.prepare('SELECT * FROM saetze WHERE bereich=? AND id=?').bind(workspaceId,id).first<CloudRecord>();
    if(row&&new TextEncoder().encode(row.daten??'').byteLength>1024*1024)return cloudError('ACTION_TOO_LARGE');
    recordCache.set(key,clone(row));snapshots.push({table:'saetze',where:'bereich=? AND id=?',values:[workspaceId,id],rows:row?[clone(row)]:[]});return row;
  };
  const noWrite=async():Promise<never>=>cloudError('PERMISSION_DENIED');
  /* Vorhandene Rollen-/Feldprüfung aus dem Serverkern; Metadaten sind einmal
   * gebündelt geladen und werden vor einer Änderung erneut atomar geprüft. */
  const access:Ablage={art:'mcp-snapshot',einrichten:noWrite,setze:noWrite,weg:noWrite,
    async hole(table:string,where:Wo){
      if(table==='saetze')return raw(String(where.bereich??''),String(where.id??''));
      const snapshot=snapshots.find(s=>s.table===table);if(!snapshot)return cloudError('PERMISSION_DENIED');
      return clone(snapshot.rows.find(row=>matches(row,where))??null);
    },
    async finde(table:string,where:Wo={},_options:FindeOpt={}){
      const snapshot=snapshots.find(s=>s.table===table);if(!snapshot)return cloudError('PERMISSION_DENIED');
      return clone(snapshot.rows.filter(row=>matches(row,where)));
    },async zaehle(table:string,where:Wo={}){return (await this.finde(table,where)).length;},
    summe:noWrite};
  const role=async(workspaceId:string,pageId:string):Promise<string>=>String(await rolleAuf(access,workspaceId,pageId,principal.userId));
  const rowData=(row:CloudRecord):Record<string,unknown>=>{
    if(row.geloescht)return cloudError('INVALID_DOCUMENT');if(row.verschluesselt)return cloudError('ENCRYPTED_DOCUMENT');
    let data:unknown;try{data=JSON.parse(row.daten);}catch{return cloudError('INVALID_DOCUMENT');}
    if(!data||typeof data!=='object'||Array.isArray(data)||(data as Record<string,unknown>).alive===false)return cloudError('INVALID_DOCUMENT');
    return data as Record<string,unknown>;
  };
  const authorize=async(row:CloudRecord,write=false):Promise<Record<string,unknown>>=>{
    if(!workspaceIds.includes(row.bereich)||write&&!principal.scopes.includes('redion:write')||
      !darf(await role(row.bereich,row.seite||row.id),write?'bearbeiten':'lesen'))return cloudError('PERMISSION_DENIED');
    const data=rowData(row);if(write&&data.locked)return cloudError('DOCUMENT_LOCKED');
    if(write)return data; // Textänderung erhält auch nicht ausgegebene Spalten unverändert.
    const filtered=await feldFilter(access,row.bereich,principal.userId,row) as CloudRecord;return rowData(filtered);
  };
  const record=async(id:string,workspaceId?:string,write=false):Promise<{row:CloudRecord;data:Record<string,unknown>} >=>{
    if(!/^[A-Za-z0-9_-]{1,80}$/.test(id))return cloudError('INVALID_DOCUMENT');
    const candidates:CloudRecord[]=[];
    for(const candidate of workspaceId?[workspaceId]:workspaceIds){const row=await raw(candidate,id);if(row)candidates.push(row);}
    if(candidates.length>1)return cloudError('AMBIGUOUS_DOCUMENT');if(!candidates.length)return cloudError('INVALID_DOCUMENT');
    const row=candidates[0]!;return {row,data:await authorize(row,write)};
  };
  const workspaces=async()=>{
    const result:{id:string;name:string;role:string}[]=[];
    for(const row of snapshots[1]!.rows){
      const ownRole=await role(String(row.id),'*');
      const shared=snapshots[2]!.rows.some(g=>g.bereich===row.id&&darf(String(g.rolle),'lesen'));
      if(darf(ownRole,'lesen')||shared)result.push({id:String(row.id),name:String(row.name??''),role:ownRole});
    }return result;
  };
  const pages=async(limit=100,workspaceId?:string)=>{
    const output:{row:CloudRecord;data:Record<string,unknown>}[]=[];
    for(const id of workspaceId?[workspaceId]:workspaceIds){
      if(!workspaceIds.includes(id))return cloudError('PERMISSION_DENIED');
      const rows=await db.prepare("SELECT * FROM saetze WHERE bereich=? AND tabelle='blocks' AND geloescht=0 AND verschluesselt=0 AND CASE WHEN json_valid(daten) THEN json_extract(daten,'$.type') END='page' ORDER BY geaendert DESC,id LIMIT ?").bind(id,Math.min(101,limit+1)).all<CloudRecord>();
      for(const row of rows.results){
        recordCache.set(row.bereich+'\0'+row.id,clone(row));snapshots.push({table:'saetze',where:'bereich=? AND id=?',values:[row.bereich,row.id],rows:[clone(row)]});
        if(!darf(await role(row.bereich,row.seite||row.id),'lesen'))continue;
        const data=await authorize(row);if(data.parentTable==='collection')continue;
        output.push({row,data});if(output.length>=limit)return output;
      }
    }return output;
  };
  const children=async(page:CloudRecord,data:Record<string,unknown>,limit=100)=>{
    const ids=Array.isArray(data.content)?data.content:[];if(ids.length>10000)return cloudError('ACTION_TOO_LARGE');
    const missing=ids.slice(0,limit).filter((id):id is string=>typeof id==='string'&&!recordCache.has(page.bereich+'\0'+id));
    let totalBytes=0;
    for(let start=0;start<missing.length;start+=10){
      const group=missing.slice(start,start+10);
      const loaded=await db.batch(group.map(id=>db.prepare('SELECT * FROM saetze WHERE bereich=? AND id=?').bind(page.bereich,id)));
      for(const [index,id] of group.entries()){
        const row=loaded[index]!.results[0] as CloudRecord|undefined,bytes=row?new TextEncoder().encode(row.daten??'').byteLength:0;
        totalBytes+=bytes;if(bytes>1024*1024||totalBytes>8*1024*1024)return cloudError('ACTION_TOO_LARGE');
        recordCache.set(page.bereich+'\0'+id,clone(row??null));snapshots.push({table:'saetze',where:'bereich=? AND id=?',values:[page.bereich,id],rows:row?[clone(row)]:[]});
      }
    }
    const result:{row:CloudRecord;data:Record<string,unknown>}[]=[];
    for(const id of ids.slice(0,limit)){
      if(typeof id!=='string')continue;const row=await raw(page.bereich,id);if(!row||row.geloescht||row.verschluesselt)continue;
      const parsed=rowData(row);if(parsed.parentId!==page.id)continue;
      if(!darf(await role(row.bereich,row.seite||row.id),'lesen'))continue;
      result.push({row,data:await authorize(row)});
    }return result;
  };
  const commit=async(changes:CloudRecord[],tool:string):Promise<void>=>{
    if(!principal.scopes.includes('redion:write')||!changes.length||changes.length>100)return cloudError('PERMISSION_DENIED');
    if(new Set(changes.map(r=>r.bereich+'\0'+r.id)).size!==changes.length)return cloudError('INVALID_INPUT');
    /* Alle Rollen-/Elternprüfungen vor dem Erzeugen der SQL-Vorbedingungen:
     * auch während dieser Prüfung gelesene Vorfahren gehören in den Batch. */
    for(const change of changes){
      if(!workspaceIds.includes(change.bereich)||change.tabelle!=='blocks'||change.verschluesselt||change.geloescht)return cloudError('PERMISSION_DENIED');
      const previous=recordCache.get(change.bereich+'\0'+change.id);
      if(previous===undefined)return cloudError('INVALID_INPUT');
      if(previous){
        await authorize(previous,true);
        if(change.version!==previous.version+1||change.seite!==previous.seite)return cloudError('STALE_DOCUMENT');
      }else{
        let anchor=change;const visited=new Set<string>();
        while(true){
          if(visited.has(anchor.id))return cloudError('INVALID_INPUT');visited.add(anchor.id);
          const data=rowData(anchor),parent=typeof data.parentId==='string'?data.parentId:'*';
          const stagedParent=changes.find(row=>row.bereich===change.bereich&&row.id===parent&&recordCache.get(row.bereich+'\0'+row.id)===null);
          if(stagedParent){anchor=stagedParent;continue;}
          if(change.version!==1||!darf(await role(change.bereich,parent),'bearbeiten'))return cloudError('PERMISSION_DENIED');
          break;
        }
      }
    }
    const batchId=crypto.randomUUID(),statements:CloudStatement[]=[];let seq=0;
    const guard=(condition:string,values:SqlValue[])=>{
      statements.push(db.prepare('INSERT INTO mcp_commit_guard(id,seq,valid) VALUES(?,?,CASE WHEN ('+condition+') THEN 1 ELSE 0 END)').bind(batchId,seq++,...values));
    };
    for(const check of principal.checks)guard('EXISTS(SELECT 1 FROM mcp_state WHERE key=? AND revision=? AND expires=? AND expires>?)',[check.key,check.revision,check.expires,now()]);
    for(const snapshot of snapshots){
      guard('(SELECT COUNT(*) FROM '+snapshot.table+' WHERE '+snapshot.where+')=?',[...snapshot.values,snapshot.rows.length]);
      for(const row of snapshot.rows){
        const fields=columns[snapshot.table]!,primary=keys[snapshot.table]!;
        guard('EXISTS(SELECT 1 FROM '+snapshot.table+' WHERE '+[...primary,...fields].map(k=>k+' IS ?').join(' AND ')+')',
          [...primary,...fields].map(k=>sqlValue(row[k])));
      }
    }
    for(const change of changes){
      const fields=columns.saetze!;
      statements.push(db.prepare('INSERT OR REPLACE INTO saetze('+fields.join(',')+') VALUES('+placeholders(fields.length)+')').bind(...fields.map(k=>sqlValue(change[k as keyof CloudRecord]))));
    }
    statements.push(db.prepare('INSERT INTO protokoll(id,bereich,kontoId,art,text,objekt,wann) VALUES(?,?,?,?,?,?,?)')
      .bind(crypto.randomUUID(),changes[0]!.bereich,principal.userId,'mcp',tool,changes[0]!.seite,new Date(now()).toISOString()));
    statements.push(db.prepare('DELETE FROM mcp_commit_guard WHERE id=?').bind(batchId));
    try{await db.batch(statements);}catch(error){return cloudError(error instanceof Error&&/CHECK constraint failed/.test(error.message)?'STALE_DOCUMENT':'PERSISTENCE_UNAVAILABLE');}
  };
  const search=async(query:string,limit=20,offset=0,workspaceId?:string)=>{
    const ids=workspaceId?[workspaceId]:workspaceIds;if(ids.some(id=>!workspaceIds.includes(id)))return cloudError('PERMISSION_DENIED');
    const unicode=/[^\x00-\x7f]/.test(query),needle=query.toLocaleLowerCase();
    const where="bereich IN ("+placeholders(ids.length)+") AND tabelle='blocks' AND geloescht=0 AND verschluesselt=0 AND json_valid(daten)";
    const expression="CASE WHEN json_valid(daten) THEN json_extract(daten,'$.text') END";
    const filter=unicode?'':' AND instr(lower('+expression+'),?)>0';
    const values:SqlValue[]=[...ids,...(unicode?[]:[needle]),offset];
    const candidates=await db.prepare('SELECT * FROM saetze WHERE '+where+filter+' ORDER BY bereich,id LIMIT 500 OFFSET ?').bind(...values).all<CloudRecord>();
    const found=new Map<string,{row:CloudRecord;data:Record<string,unknown>}>();let scanned=0;
    for(const row of candidates.results){
      scanned++;recordCache.set(row.bereich+'\0'+row.id,clone(row));snapshots.push({table:'saetze',where:'bereich=? AND id=?',values:[row.bereich,row.id],rows:[clone(row)]});
      if(!darf(await role(row.bereich,row.seite||row.id),'lesen'))continue;
      const data=await authorize(row);if(!String(data.text??'').toLocaleLowerCase().includes(needle))continue;
      const parent=await record(String(data.type==='page'?row.id:row.seite),row.bereich);
      if(parent.data.type!=='page'||parent.data.parentTable==='collection')continue;
      found.set(parent.row.bereich+'\0'+parent.row.id,parent);if(found.size>=limit)break;
    }
    const nextOffset=scanned<candidates.results.length||candidates.results.length===500?offset+scanned:null;
    return {documents:[...found.values()],nextOffset};
  };
  return {principal,raw,record,rowData,authorize,role,workspaces,pages,children,search,commit,
    async reserve(workspaceId:string,id:string){if(await raw(workspaceId,id))return cloudError('INVALID_INPUT');},
    changedAt(){return new Date(Math.max(now(),...snapshots.flatMap(s=>s.table==='saetze'?s.rows.map(r=>Date.parse(String(r.geaendert))||0):[]))+1).toISOString();}};
};
export type CloudRepository=Awaited<ReturnType<typeof openCloudRepository>>;
