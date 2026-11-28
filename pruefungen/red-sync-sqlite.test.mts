import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSqliteSyncAdapter} from '../tools/red-sync-sqlite.mts';
import {createRedSync,prepareRedStoreWrite,type RedStoreRecord,type RedStoreChanges,type RedStoreWrite} from '../red-sdk/client.mts';
const scope={origin:'https://home.example.test',owner:'owner',app:'red-fit',kind:'sync'} as const;
const localKey=new Uint8Array(32).fill(4),remoteKey=new Uint8Array(32).fill(5);
const id='a'.repeat(32),other='b'.repeat(32),cursor='c'.repeat(64);
const secret='SYNTHETISCHER_PRIVATER_TESTTEXT_923491';
test('Real SDK pull, durable encrypted local data and restart',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'red-sync-sqlite-')),file=join(dir,'local.sqlite');
 let db=new DatabaseSync(file);
 try{
  const a=createSqliteSyncAdapter(db,scope,localKey);
  const prepared=await prepareRedStoreWrite(remoteKey,{...scope,id},0,new TextEncoder().encode(secret));
  const record:RedStoreRecord={version:1,id,revision:1,deleted:0,updated:1,envelope:prepared.envelope};
  const feed:RedStoreChanges={version:1,reset:true,cursor,items:[{id,revision:1,deleted:0,updated:1,encodedBytes:record.envelope.length}]};
  const sync=createRedSync({async storeChanges(){return feed;},async storeGet(){return record;}},scope,remoteKey,a,b=>new TextDecoder().decode(b));
  assert.equal((await sync.pull()).imported,1);assert.equal(a.getLocal(id)?.value,secret);
  a.putLocal(other,'Lokale Änderung');sync.dispose();a.dispose();db.close();
  assert.ok(!(await readFile(file)).includes(Buffer.from(secret)));
  db=new DatabaseSync(file);const b=createSqliteSyncAdapter(db,scope,localKey);
  assert.equal((await b.snapshot()).cursor,cursor);assert.equal(b.getLocal(id)?.value,secret);assert.equal(b.getLocal(other)?.dirty,true);
  b.dispose();assert.throws(()=>createSqliteSyncAdapter(db,scope,remoteKey));assert.throws(()=>createSqliteSyncAdapter(db,{...scope,app:'red-poly'},localKey));
  const c=createSqliteSyncAdapter(db,scope,localKey);assert.equal(c.getLocal(id)?.value,secret);c.dispose();
 }finally{if(db.isOpen)db.close();await rm(dir,{recursive:true,force:true});}
});
test('Two connections protect concurrent edits, atomic conflict journal and cursor',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'red-sync-race-')),file=join(dir,'local.sqlite');
 const db=new DatabaseSync(file),db2=new DatabaseSync(file);
 try{
  const a=createSqliteSyncAdapter(db,scope,localKey),b=createSqliteSyncAdapter(db2,scope,localKey);
  const old=await a.snapshot();b.putLocal(id,'Offline');
  await assert.rejects(a.commit(old.generation,{cursor,imports:[],conflicts:[]}));
  const current=await a.snapshot();
  await assert.rejects(a.commit(current.generation,{cursor,imports:[{id:other,revision:1,deleted:0,value:'Remote'},{id,revision:1,deleted:0,value:'Overwrite'}],conflicts:[]}));
  assert.equal(a.getLocal(other),null);assert.equal(a.getLocal(id)?.value,'Offline');assert.equal((await a.snapshot()).cursor,null);
  const conflict={id,localRevision:0,remoteRevision:1,reason:'local_edit'} as const;
  await a.commit(current.generation,{cursor,imports:[{id:other,revision:1,deleted:0,value:'Remote'}],conflicts:[conflict]});
  assert.deepEqual(b.conflicts(),[conflict]);assert.equal(b.getLocal(id)?.value,'Offline');assert.equal((await b.snapshot()).cursor,cursor);
  const next=await b.snapshot();await b.commit(next.generation,{cursor,imports:[],conflicts:[conflict]});assert.equal(a.conflicts().length,1);
  a.dispose();b.dispose();
 }finally{db2.close();db.close();await rm(dir,{recursive:true,force:true});}
});
test('Tamper and journal overflow fail closed without advancing the cursor',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  const a=createSqliteSyncAdapter(db,scope,localKey),s=await a.snapshot();
  const conflicts=Array.from({length:4096},(_,i)=>({id,localRevision:i,remoteRevision:i+1,reason:'local_edit' as const}));
  await a.commit(s.generation,{cursor:null,imports:[],conflicts});
  const t=await a.snapshot();await assert.rejects(a.commit(t.generation,{cursor,imports:[],conflicts:[{id,localRevision:4096,remoteRevision:4097,reason:'local_edit'}]}));
  assert.equal((await a.snapshot()).cursor,null);assert.equal(a.conflicts().length,4096);
  db.exec('UPDATE red_local_sync_v1 SET payload=zeroblob(length(payload)) WHERE id=1');
  await assert.rejects(a.snapshot());assert.throws(()=>createSqliteSyncAdapter(db,scope,localKey));a.dispose();
 }finally{db.close();}
});

test('Durable outbox reuses ciphertext after lost reply and preserves concurrent edits',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'red-sync-outbox-')),file=join(dir,'local.sqlite');
 let db=new DatabaseSync(file),remote:RedStoreRecord|undefined,first:RedStoreWrite|undefined,calls=0;
 const transport={async storePut(write:RedStoreWrite){
  calls++;
  if(!remote){first={...write};remote={version:1,id:write.id,revision:write.expectedRevision+1,deleted:0,updated:1,envelope:write.envelope};throw Error('lost reply');}
  if(calls===2)assert.deepEqual(write,first);
  else remote={version:1,id:write.id,revision:write.expectedRevision+1,deleted:0,updated:1,envelope:write.envelope};
  return {version:1 as const,id:write.id,revision:remote.revision,deleted:0 as const};
 },async storeGet(){if(!remote)throw Error('missing');return remote;}};
 try{
  const a=createSqliteSyncAdapter(db,scope,localKey);a.putLocal(id,'First version');
  await assert.rejects(a.pushLocal(id,remoteKey,transport),/lost reply/);
  assert.deepEqual(a.pendingUploads(),[{id,expectedRevision:0}]);await assert.rejects(a.snapshot());
  a.putLocal(id,'Edited while offline');a.dispose();db.close();
  db=new DatabaseSync(file);const b=createSqliteSyncAdapter(db,scope,localKey);
  await assert.rejects(b.pushLocal(id,localKey,transport));assert.equal(calls,1);
  assert.deepEqual(await b.pushLocal(id,remoteKey,transport),{revision:1,dirty:true});
  assert.equal(b.getLocal(id)?.value,'Edited while offline');assert.deepEqual(b.pendingUploads(),[]);
  assert.deepEqual(await b.pushLocal(id,remoteKey,transport),{revision:2,dirty:false});
  assert.equal(b.getLocal(id)?.dirty,false);assert.equal((await b.snapshot()).cursor,null);b.dispose();
 }finally{if(db.isOpen)db.close();await rm(dir,{recursive:true,force:true});}
});
test('Upload confirmation mismatch retains outbox; no automatic tombstone upload',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  const a=createSqliteSyncAdapter(db,scope,localKey);a.putLocal(id,'Local');a.putLocal(other,null);
  let calls=0;
  const transport={async storePut(w:RedStoreWrite){calls++;return {version:1 as const,id:w.id,revision:w.expectedRevision+1,deleted:0 as const};},async storeGet(){return {version:1 as const,id,revision:2,deleted:0 as const,updated:1,envelope:'unexpected'};}};
  await assert.rejects(a.pushLocal(other,remoteKey,transport));assert.equal(calls,0);
  await assert.rejects(a.pushLocal(id,remoteKey,transport),/nicht bestätigt/);
  assert.equal(a.getLocal(id)?.dirty,true);assert.equal(a.getLocal(id)?.revision,0);assert.equal(a.pendingUploads().length,1);
  await assert.rejects(a.snapshot());a.dispose();
 }finally{db.close();}
});

test('Keep-both conflict recovery authenticates server state and preserves both local versions',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  const a=createSqliteSyncAdapter(db,scope,localKey);a.putLocal(id,'Pending first version');
  const failed={async storePut(_w:RedStoreWrite){throw Error('offline');},async storeGet():Promise<RedStoreRecord>{throw Error('offline');}};
  await assert.rejects(a.pushLocal(id,remoteKey,failed));a.putLocal(id,'Newest offline edit');
  const r=await prepareRedStoreWrite(remoteKey,{...scope,id},1,new TextEncoder().encode('Other device'));
  let record:RedStoreRecord={version:1,id,revision:2,deleted:0,updated:2,envelope:r.envelope};
  const transport={async storeGet(){return record;}};
  await assert.rejects(a.previewPendingConflict(id,localKey,transport));
  const old=await a.previewPendingConflict(id,remoteKey,transport);
  assert.equal(old.remoteValue,'Other device');assert.equal(old.localValue,'Newest offline edit');assert.equal(old.pendingValue,'Pending first version');
  a.putLocal(id,'Newer edit after preview');
  await assert.rejects(a.resolvePendingKeepBoth(id,old.token,remoteKey,transport),/veraltet/);
  const preview=await a.previewPendingConflict(id,remoteKey,transport);
  const newer=await prepareRedStoreWrite(remoteKey,{...scope,id},2,new TextEncoder().encode('Latest remote'));
  record={...record,revision:3,envelope:newer.envelope};
  await assert.rejects(a.resolvePendingKeepBoth(id,preview.token,remoteKey,transport),/veraltet/);
  assert.equal(a.pendingUploads().length,1);assert.equal(a.getLocal(id)?.value,'Newer edit after preview');
  const fresh=await a.previewPendingConflict(id,remoteKey,transport);
  const result=await a.resolvePendingKeepBoth(id,fresh.token,remoteKey,transport);
  assert.equal(result.remoteRevision,3);assert.equal(result.copies.length,2);
  assert.equal(a.getLocal(id)?.value,'Latest remote');assert.equal(a.getLocal(id)?.dirty,false);
  assert.deepEqual(result.copies.map(c=>a.getLocal(c.id)?.value),['Newer edit after preview','Pending first version']);
  assert.ok(result.copies.every(c=>a.getLocal(c.id)?.dirty===true&&a.getLocal(c.id)?.revision===0));
  assert.deepEqual(a.pendingUploads(),[]);assert.equal((await a.snapshot()).cursor,null);
  await assert.rejects(a.resolvePendingKeepBoth(id,fresh.token,remoteKey,transport));
  a.dispose();
 }finally{db.close();}
});
test('Conflict recovery refuses unauthenticated records, tombstones and a matching upload',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  const a=createSqliteSyncAdapter(db,scope,localKey);a.putLocal(id,'Local');
  let write:RedStoreWrite|undefined;
  await assert.rejects(a.pushLocal(id,remoteKey,{async storePut(w){write=w;throw Error('lost reply');},async storeGet(){throw Error('not called');}}));
  const original:RedStoreRecord={version:1,id,revision:1,deleted:0,updated:1,envelope:write!.envelope};
  for(const record of [original,{...original,revision:2},{...original,revision:2,deleted:1 as const,envelope:''}]){
   await assert.rejects(a.previewPendingConflict(id,remoteKey,{async storeGet(){return record;}}));
   assert.equal(a.pendingUploads().length,1);assert.equal(a.getLocal(id)?.value,'Local');
  }
  a.dispose();
 }finally{db.close();}
});
