/** Isolierter lokaler SQLite-Adapter. Kein Zugriff auf bestehende Redion-Profile. */
import {createCipheriv,createDecipheriv,randomBytes,randomUUID} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import {prepareRedStoreWrite,openRedStoreRecord} from '../red-sdk/client.mts';
import type {RedStoreWrite,RedStoreResult,RedStoreRecord,RedStoreKind,RedSyncAdapter,RedSyncBatch,RedSyncConflict,RedSyncLocalItem,RedSyncScope,RedSyncSnapshot} from '../red-sdk/client.mts';

type Item=RedSyncLocalItem&{value:string|null};
type Pending={write:RedStoreWrite;value:string};
type State={cursor:string|null;items:Item[];conflicts:RedSyncConflict[];outbox?:Pending[]};
type UploadTransport={storePut(write:RedStoreWrite):Promise<RedStoreResult>;storeGet(kind:RedStoreKind,id:string):Promise<RedStoreRecord>};
const MAX_PENDING=64;
const MAX_ITEMS=4096,MAX_CONFLICTS=4096,MAX_VALUE=128*1024,MAX_STATE=16*1024*1024;
const validId=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{32}$/.test(v);
const natural=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const cursorValid=(v:unknown):v is string|null=>v===null||typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const textValid=(v:unknown):v is string=>typeof v==='string'&&Buffer.byteLength(v,'utf8')<=MAX_VALUE;
const reasons=['local_edit','remote_rollback','missing_remote','revision_changed'];
function validConflict(c:RedSyncConflict):boolean{
 return !!c&&validId(c.id)&&natural(c.localRevision)&&(c.remoteRevision===null||natural(c.remoteRevision))&&reasons.includes(c.reason);
}
function validateState(s:State){
 if(!s||!cursorValid(s.cursor)||!Array.isArray(s.items)||s.items.length>MAX_ITEMS||!Array.isArray(s.conflicts)||s.conflicts.length>MAX_CONFLICTS)throw Error('Ungültiger lokaler Sync-Bestand');
 const seen=new Set<string>();
 for(const item of s.items){
  if(!item||!validId(item.id)||seen.has(item.id)||!natural(item.revision)||typeof item.dirty!=='boolean'||(item.deleted!==0&&item.deleted!==1)||(item.deleted===1?item.value!==null:!textValid(item.value)))throw Error('Ungültiger lokaler Sync-Eintrag');
  seen.add(item.id);
 }
 if(s.conflicts.some(c=>!validConflict(c)))throw Error('Ungültiges Konfliktjournal');
 if(s.outbox!==undefined){
  if(!Array.isArray(s.outbox)||s.outbox.length>MAX_PENDING)throw Error('Ungültige Upload-Warteschlange');
  const queued=new Set<string>();
  for(const entry of s.outbox){
   const w=entry?.write,item=s.items.find(i=>i.id===w?.id);
   if(!w||w.kind!=='sync'||!validId(w.id)||!validId(w.operationId)||queued.has(w.id)||!natural(w.expectedRevision)||w.expectedRevision>=Number.MAX_SAFE_INTEGER-1||typeof w.envelope!=='string'||!/^[A-Za-z0-9_-]{38,60000}$/.test(w.envelope)||!textValid(entry.value)||Buffer.byteLength(entry.value)>44000||!item?.dirty||item.revision!==w.expectedRevision)throw Error('Ungültiger Upload-Auftrag');
   queued.add(w.id);
  }
 }
}
function conflictKey(c:RedSyncConflict){return JSON.stringify([c.id,c.localRevision,c.remoteRevision,c.reason]);}

/** Eine separate, vertrauenswürdige lokale Datenbank pro Konto/App/Kind.
 * Der Aufrufer verwaltet DB-Lebensdauer, Dateirechte und einen separaten
 * 32-Byte-Schlüssel. Keine Schlüsselablage oder automatische Konfliktauflösung. */
export function createSqliteSyncAdapter(db:DatabaseSync,scope:RedSyncScope,localKey:Uint8Array){
 if(localKey.byteLength!==32||![scope.origin,scope.owner,scope.app,scope.kind].every(v=>typeof v==='string'&&v.length>0&&v.length<=512))throw Error('Ungültiger lokaler Sync-Schlüssel oder Bereich');
 const syncScope={...scope};
 const bound=JSON.stringify(['red-local-sync-v1',syncScope.origin,syncScope.owner,syncScope.app,syncScope.kind]);
 const key=Buffer.from(localKey);let disposed=false;
 function active(){if(disposed)throw Error('Sync-Adapter geschlossen');}
 function aad(g:string){return Buffer.from(JSON.stringify([bound,g]));}
 function transaction<T>(fn:()=>T):T{
  active();db.exec('BEGIN IMMEDIATE');
  try{const result=fn();db.exec('COMMIT');return result;}
  catch(error){db.exec('ROLLBACK');throw error;}
 }
 function encode(state:State,generation:string){
  validateState(state);const plain=Buffer.from(JSON.stringify(state),'utf8');
  try{
   if(plain.length>MAX_STATE)throw Error('Lokaler Sync-Speicher voll');
   const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(aad(generation));
   return Buffer.concat([nonce,cipher.update(plain),cipher.final(),cipher.getAuthTag()]);
  }finally{plain.fill(0);}
 }
 function read():{generation:string;state:State}{
  active();const row=db.prepare('SELECT generation, length(payload) AS size FROM red_local_sync_v1 WHERE id=1').get();
  if(!row||typeof row.generation!=='string'||!/^[-a-f0-9]{36}$/.test(row.generation)||!natural(row.size)||row.size<28||row.size>MAX_STATE+28)throw Error('Lokaler Sync-Bestand fehlt oder ist ungültig');
  const payload=db.prepare('SELECT payload FROM red_local_sync_v1 WHERE id=1 AND generation=?').get(row.generation)?.payload;
  if(!(payload instanceof Uint8Array)||payload.byteLength!==row.size)throw Error('Lokaler Sync-Bestand geändert; erneut versuchen');
  const bytes=Buffer.from(payload),decipher=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));
  decipher.setAAD(aad(row.generation));decipher.setAuthTag(bytes.subarray(-16));
  const first=decipher.update(bytes.subarray(12,-16));let last:Buffer|undefined,plain:Buffer|undefined;
  try{last=decipher.final();plain=Buffer.concat([first,last]);const state=JSON.parse(plain.toString('utf8')) as State;validateState(state);return {generation:row.generation,state};}
  finally{first.fill(0);last?.fill(0);plain?.fill(0);}
 }
 function save(state:State,expected:string){
  const generation=randomUUID(),payload=encode(state,generation);
  const result=db.prepare('UPDATE red_local_sync_v1 SET generation=?,payload=? WHERE id=1 AND generation=?').run(generation,payload,expected);
  if(result.changes!==1)throw Error('Lokale Generation geändert');
 }
 try{
  transaction(()=>{
   db.exec('CREATE TABLE IF NOT EXISTS red_local_sync_v1(id INTEGER PRIMARY KEY CHECK(id=1),generation TEXT NOT NULL,payload BLOB NOT NULL)');
   if(!db.prepare('SELECT 1 FROM red_local_sync_v1 WHERE id=1').get()){
    const g=randomUUID();db.prepare('INSERT INTO red_local_sync_v1 VALUES(1,?,?)').run(g,encode({cursor:null,items:[],conflicts:[]},g));
   }else read(); // Falscher Schlüssel/Bereich oder beschädigte Daten: kein Reset.
  });
 }catch(error){key.fill(0);disposed=true;throw error;}
 const adapter:RedSyncAdapter<string>={
  async snapshot():Promise<RedSyncSnapshot>{
   const {generation,state}=read();
   if(state.outbox?.length)throw Error('Ausstehende Uploads zuerst abgleichen');
   return {generation,cursor:state.cursor,items:state.items.map(({id,revision,dirty,deleted})=>({id,revision,dirty,deleted}))};
  },
  async commit(expectedGeneration:string,batch:RedSyncBatch<string>){
   transaction(()=>{
    const {generation,state}=read();
    if(generation!==expectedGeneration||state.outbox?.length)throw Error('Lokale Generation geändert oder Upload ausstehend');
    if(!cursorValid(batch.cursor)||!Array.isArray(batch.imports)||batch.imports.length>MAX_ITEMS||!Array.isArray(batch.conflicts)||batch.conflicts.length>MAX_CONFLICTS)throw Error('Ungültiger Sync-Batch');
    const items=new Map(state.items.map(i=>[i.id,i])),seen=new Set<string>(),journal=new Map(state.conflicts.map(c=>[conflictKey(c),c]));
    for(const item of batch.imports){
     if(!item||!validId(item.id)||seen.has(item.id)||!natural(item.revision)||item.revision===0||item.deleted!==0||!textValid(item.value))throw Error('Ungültiger Sync-Import');
     const previous=items.get(item.id);
     if(previous&&(previous.dirty||previous.revision>=item.revision))throw Error('Lokaler Eintrag geschützt');
     seen.add(item.id);items.set(item.id,{id:item.id,revision:item.revision,dirty:false,deleted:0,value:item.value});
    }
    for(const conflict of batch.conflicts){
     if(!validConflict(conflict)||seen.has(conflict.id))throw Error('Ungültiger Sync-Konflikt');
     journal.set(conflictKey(conflict),{id:conflict.id,localRevision:conflict.localRevision,remoteRevision:conflict.remoteRevision,reason:conflict.reason});
    }
    // Bei vollem Journal weder Konflikte verwerfen noch Cursor fortschreiben.
    save({...state,cursor:batch.cursor,items:[...items.values()],conflicts:[...journal.values()]},generation);
   });
  }
 };
 return {
  ...adapter,
  putLocal(id:string,value:string|null){
   if(!validId(id)||(value!==null&&!textValid(value)))throw Error('Ungültige lokale Änderung');
   transaction(()=>{const {generation,state}=read();const items=new Map(state.items.map(i=>[i.id,i]));items.set(id,{id,revision:items.get(id)?.revision??0,dirty:true,deleted:value===null?1:0,value});save({...state,items:[...items.values()]},generation);});
  },
  /** Expliziter Upload eines einzelnen dirty Textes. Kein automatischer
   * Löschauftrag. Persistiert die exakte Chiffre VOR dem Netzwerkaufruf.
   * Bei Fehler bleiben Auftrag, Operation-ID und neuere Bearbeitungen erhalten. */
  async pushLocal(id:string,remoteKey:Uint8Array,transport:UploadTransport){
   if(!validId(id)||syncScope.kind!=='sync'||remoteKey.byteLength!==32)throw Error('Ungültiger Upload');
   const secret=Buffer.from(remoteKey);
   try{
    const initial=read();let entry=initial.state.outbox?.find(p=>p.write.id===id);
    if(!entry){
     const item=initial.state.items.find(i=>i.id===id);
     if(!item?.dirty||item.deleted!==0||item.value===null||initial.state.conflicts.some(c=>c.id===id))throw Error('Kein freigegebener lokaler Text-Upload');
     const value=item.value,bytes=Buffer.from(value,'utf8');
     if(bytes.toString('utf8')!==value){bytes.fill(0);throw Error('Ungültiger UTF-8-Text');}
     let write:RedStoreWrite;
     try{write=await prepareRedStoreWrite(secret,{...syncScope,id},item.revision,bytes);}
     finally{bytes.fill(0);}
     const prepared:Pending={write,value};
     transaction(()=>{
      const {generation,state}=read();if(generation!==initial.generation)throw Error('Lokale Generation geändert; Upload erneut starten');
      save({...state,outbox:[...(state.outbox??[]),prepared]},generation);
     });
     entry=prepared;
    }
    const pending=entry,write=pending.write,revision=write.expectedRevision+1;
    // Vor jeder Wiederholung auch den Schlüssel der gespeicherten Chiffre prüfen.
    const bytes=await openRedStoreRecord(secret,{...syncScope,id},{version:1,id,revision,deleted:0,updated:0,envelope:write.envelope});
    try{if(new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes)!==pending.value)throw Error('Upload-Auftrag stimmt nicht überein');}
    finally{bytes.fill(0);}
    active();
    const response=await transport.storePut({...write});
    if(response.version!==1||response.id!==id||response.revision!==revision||response.deleted!==0)throw Error('Unerwartete Upload-Bestätigung');
    const confirmed=await transport.storeGet('sync',id);
    if(confirmed.version!==1||confirmed.id!==id||confirmed.revision!==revision||confirmed.deleted!==0||confirmed.envelope!==write.envelope)throw Error('Remote-Auftrag nicht bestätigt; Konflikt prüfen');
    return transaction(()=>{
     const {generation,state}=read(),current=state.outbox?.find(p=>p.write.id===id),item=state.items.find(i=>i.id===id);
     if(!current||current.write.operationId!==write.operationId||!item?.dirty||item.revision!==write.expectedRevision)throw Error('Upload-Auftrag geändert; erneut prüfen');
     const dirty=item.deleted!==0||item.value!==pending.value;
     const items=state.items.map(i=>i.id===id?{...i,revision,dirty}:i);
     save({...state,items,outbox:(state.outbox??[]).filter(p=>p.write.id!==id)},generation);
     return {revision,dirty};
    });
   }finally{secret.fill(0);}
  },
  pendingUploads(){return (read().state.outbox??[]).map(p=>({id:p.write.id,expectedRevision:p.write.expectedRevision}));},
  getLocal(id:string){if(!validId(id))throw Error('Ungültige ID');return read().state.items.find(i=>i.id===id)??null;},
  conflicts(){return read().state.conflicts;},
  dispose(){disposed=true;key.fill(0);}
 };
}
