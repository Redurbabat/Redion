import test from 'node:test';
import assert from 'node:assert/strict';
import {createRedSync,createRedConfigContext,parseRedConfig,prepareRedStoreWrite,openRedStoreRecord,type RedStoreRecord,type RedStoreChanges,type RedSyncSnapshot,type RedSyncBatch} from '../red-sdk/client.mts';
const scope={origin:'https://home.example.test',owner:'owner',app:'red-fit',kind:'sync'} as const;
const key=new Uint8Array(32).fill(3);
const id='a'.repeat(32),cursor='b'.repeat(64);
const decode=(bytes:Uint8Array)=>JSON.parse(new TextDecoder().decode(bytes)) as {count:number};
async function fixture(){
 const prepared=await prepareRedStoreWrite(key,{...scope,id},0,new TextEncoder().encode('{"count":5}'));
 const record:RedStoreRecord={version:1,id,revision:1,deleted:0,updated:1,envelope:prepared.envelope};
 const feed:RedStoreChanges={version:1,reset:true,cursor,items:[{id,revision:1,deleted:0,updated:1,encodedBytes:record.envelope.length}]};
 return {record,feed};
}
test('atomic pull imports authenticated data and commits cursor only with local generation',async()=>{
 const {record,feed}=await fixture();let committed:RedSyncBatch<{count:number}>|undefined;
 const adapter={async snapshot():Promise<RedSyncSnapshot>{return {cursor:null,generation:'g1',items:[]};},async commit(g:string,b:RedSyncBatch<{count:number}>){assert.equal(g,'g1');committed=b;}};
 const sync=createRedSync({async storeChanges(){return feed;},async storeGet(){return record;}},scope,key,adapter,decode);
 assert.deepEqual(await sync.pull(),{imported:1,conflicts:0,reset:true});
 assert.equal(committed?.cursor,cursor);assert.equal(committed?.imports[0]?.value?.count,5);
 sync.dispose();await assert.rejects(sync.pull());
});
test('dirty records, rollback, missing records and tombstones are journaled without overwriting local data',async()=>{
 const {record,feed}=await fixture();const tomb='c'.repeat(32),missing='d'.repeat(32),rollback='e'.repeat(32);
 feed.items.push({id:tomb,revision:2,deleted:1,updated:2,encodedBytes:0},{id:rollback,revision:1,deleted:0,updated:2,encodedBytes:40});
 let batch:RedSyncBatch<{count:number}>|undefined;
 const sync=createRedSync({async storeChanges(){return feed;},async storeGet(){throw Error('unexpected fetch');}},scope,key,{async snapshot(){return {cursor:null,generation:'g',items:[{id,revision:0,dirty:true,deleted:0},{id:tomb,revision:1,dirty:false,deleted:0},{id:missing,revision:2,dirty:false,deleted:0},{id:rollback,revision:3,dirty:false,deleted:0}]};},async commit(_,b){batch=b;}},decode);
 assert.equal((await sync.pull()).conflicts,4);
 assert.deepEqual(batch?.imports,[]);assert.deepEqual(batch?.conflicts.map(c=>c.reason),['local_edit','revision_changed','remote_rollback','missing_remote']);
 sync.dispose();
});
test('failed decryption or moving remote revision never commits a cursor',async()=>{
 const {record,feed}=await fixture();let commits=0;
 const adapter={async snapshot():Promise<RedSyncSnapshot>{return {cursor:null,generation:'g',items:[]};},async commit(){commits++;}};
 const wrong=createRedSync({async storeChanges(){return feed;},async storeGet(){return record;}},scope,new Uint8Array(32),adapter,decode);
 await assert.rejects(wrong.pull());wrong.dispose();
 const raced=createRedSync({async storeChanges(){return feed;},async storeGet(){return {...record,revision:2};}},scope,key,adapter,decode);
 await assert.rejects(raced.pull());raced.dispose();assert.equal(commits,0);
});
test('config is validated, encrypted, deterministic and scoped per app',async()=>{
 const a=await createRedConfigContext(key,scope),b=await createRedConfigContext(key,scope),other=await createRedConfigContext(key,{...scope,app:'red-poly'});
 assert.equal(a.id,b.id);assert.notEqual(a.id,other.id);
 const value=parseRedConfig({version:1,theme:'dark',locale:'de-ch',reducedMotion:false});
 assert.equal(value.locale,'de-CH');assert.throws(()=>parseRedConfig({...value,secret:'no'}));
 const p=await a.prepare(value,0),record:RedStoreRecord={version:1,id:p.id,revision:1,deleted:0,updated:1,envelope:p.envelope};
 assert.deepEqual(await b.open(record),value);
 await assert.rejects(openRedStoreRecord(key,{...scope,id:p.id},record));
 await assert.rejects(other.open(record));
 a.dispose();b.dispose();other.dispose();await assert.rejects(a.prepare(value,1));
});
