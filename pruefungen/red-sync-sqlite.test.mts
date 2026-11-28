import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSqliteSyncAdapter} from '../tools/red-sync-sqlite.mts';
import {createRedSync,prepareRedStoreWrite,type RedStoreRecord,type RedStoreChanges} from '../red-sdk/client.mts';
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
