import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createSqliteSyncAdapter} from '../tools/red-sync-sqlite.mts';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {createRedPairProof,createRedIdV2Client,createRedSync,prepareRedStoreWrite,openRedStoreRecord,newRedStoreId,type RedSession} from '../red-sdk/client.mts';
test('RED store: explicit grants, device conflict, retry, tombstone and app isolation',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-store-')),origin='https://home.example.test',s=await openHomeServer({dataDir:root,origin,webOrigins:'https://web.example.test'});
 try{
  const post=(path:string,body:object,token?:string)=>s.handle(new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}));
  const get=(path:string,token:string)=>s.handle(new Request(origin+path,{headers:{Authorization:'Bearer '+token}}));
  const {code}=await (await post('/konto/code',{geraet:'Owner'})).json() as {code:string};
  approveHomeDevice(s.store.sqlite,code);
  const {token}=await (await post('/konto/code-holen',{code})).json() as {token:string};
  const pair=async(app:string)=>{const p=await createRedPairProof();assert.equal((await post('/red-id/v2/approve-login',{app,challenge:p.challenge},token)).status,201);return (await (await post('/red-id/v2/claim-login',{app,verifier:p.verifier})).json() as {accessToken:string}).accessToken;};
  const a=await pair('red-fit'),b=await pair('red-fit'),other=await pair('red-poly');
  const base='/red-store/v1/',id='a'.repeat(32),kind='sync',envelope=Buffer.alloc(40,7).toString('base64url'),one={kind,id,expectedRevision:0,operationId:'1'.repeat(32),envelope};
  assert.equal((await post(base+'put',one,a)).status,403);
  assert.equal((await post(base+'grant',{app:'red-fit',kind},a)).status,401);
  assert.equal((await post(base+'grant',{app:'red-fit',kind},token)).status,201);
  assert.equal((await post(base+'put',one,a)).status,201);
  assert.equal((await post(base+'put',one,a)).status,200);
  assert.equal((await post(base+'put',{...one,envelope:Buffer.alloc(40,8).toString('base64url')},a)).status,409);
  assert.equal((await post(base+'put',{...one,operationId:'2'.repeat(32)},b)).status,409);
  assert.equal((await post(base+'get',{kind,id},b)).status,200);
  assert.equal((await post(base+'get',{kind,id},other)).status,403);
  assert.equal((await post(base+'grant',{app:'red-poly',kind},token)).status,201);
  assert.equal((await post(base+'get',{kind,id},other)).status,404);
  assert.equal((await post(base+'get',{kind,id,app:'red-fit'},other)).status,400);
  assert.equal((await post(base+'get',{kind:'file',id},a)).status,403);
  assert.equal((await post(base+'grant',{app:'red-fit',kind:'file'},token)).status,201);
  assert.equal((await post(base+'put',{...one,kind:'file'},a)).status,201);
  assert.equal((await post(base+'put',{...one,expectedRevision:1,operationId:'2'.repeat(32)},b)).status,200);
  assert.equal((await post(base+'delete',{kind,id,expectedRevision:2,operationId:'3'.repeat(32)},a)).status,200);
  const tomb=await (await post(base+'get',{kind,id},b)).json() as {revision:number;deleted:number;envelope:string};
  assert.equal(tomb.revision,3);assert.equal(tomb.deleted,1);assert.equal(tomb.envelope,'');
  assert.equal((await post(base+'put',{...one,expectedRevision:3,operationId:'4'.repeat(32)},a)).status,409);
  assert.equal((await post(base+'list',{kind},b)).status,200);
  assert.equal((await get(base+'grants',a)).status,401);
  assert.equal((await get(base+'grants',token)).status,200);
  assert.equal((await s.handle(new Request(origin+base+'list',{method:'OPTIONS',headers:{Origin:'https://web.example.test'}}))).status,403);
  assert.equal((await post('/red-id/v2/revoke',{app:'red-fit'},token)).status,200);
  const newDevice=await pair('red-fit');assert.equal((await post(base+'get',{kind,id},newDevice)).status,403);
  assert.equal((await post(base+'grant',{app:'red-fit',kind},token)).status,201);
  assert.equal((await post(base+'get',{kind,id},newDevice)).status,200);
 }finally{s.close();await rm(root,{recursive:true,force:true});}
});

test('SDK encrypted sync survives a second device and rejects context substitution',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-store-sdk-')),origin='https://home.example.test',s=await openHomeServer({dataDir:root,origin});
 try{
  const post=(path:string,body:object,token?:string)=>s.handle(new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}));
  const {code}=await (await post('/konto/code',{geraet:'Owner'})).json() as {code:string};approveHomeDevice(s.store.sqlite,code);
  const {token,konto}=await (await post('/konto/code-holen',{code})).json() as {token:string;konto:{id:string}};
  const make=async()=>{
   let value:RedSession|null=null;
   const store={async load(){return value;},async save(v:RedSession){value=v;},async clear(){value=null;}};
   const client=createRedIdV2Client(origin,'red-poly',store,(i,n)=>s.handle(new Request(i,n)));
   const proof=await createRedPairProof();await post('/red-id/v2/approve-login',{app:'red-poly',challenge:proof.challenge},token);await client.claimLogin(proof.verifier);return client;
  };
  const a=await make(),b=await make();await post('/red-store/v1/grant',{app:'red-poly',kind:'sync'},token);
  const key=crypto.getRandomValues(new Uint8Array(32)),context={origin,owner:konto.id,app:'red-poly',kind:'sync',id:newRedStoreId()} as const,plaintext=new TextEncoder().encode('private learning progress');
  const prepared=await prepareRedStoreWrite(key,context,0,plaintext);
  const empty=await b.storeChanges('sync');assert.equal(empty.reset,true);assert.equal(empty.cursor,null);
  assert.equal((await a.storePut(prepared)).revision,1);
  const initial=await b.storeChanges('sync');assert.equal(initial.reset,true);assert.equal(initial.items.length,1);assert.ok(initial.cursor);
  assert.equal((await a.storePut(prepared)).revision,1);
  const idle=await b.storeChanges('sync',initial.cursor);assert.equal(idle.reset,false);assert.deepEqual(idle.items,[]);assert.equal(idle.cursor,initial.cursor);
  const page=await b.storeList('sync');assert.equal(page.items[0]?.id,context.id);
  const result=await b.storeGet('sync',context.id);assert.equal(result.revision,1);
  assert.deepEqual(await openRedStoreRecord(key,context,result),plaintext);
  await assert.rejects(openRedStoreRecord(key,{...context,owner:'other'},result));
  await assert.rejects(openRedStoreRecord(key,{...context,kind:'file'},result));
  await assert.rejects(openRedStoreRecord(key,context,{...result,revision:2}));
  assert.equal((await b.storeDelete('sync',context.id,1,newRedStoreId())).deleted,1);
  const delta=await a.storeChanges('sync',initial.cursor);assert.equal(delta.reset,false);assert.equal(delta.items.length,1);assert.equal(delta.items[0]?.deleted,1);assert.equal(delta.items[0]?.revision,2);assert.notEqual(delta.cursor,initial.cursor);
  const reset=await a.storeChanges('sync','f'.repeat(64));assert.equal(reset.reset,true);assert.deepEqual(reset.items,delta.items);
  assert.ok(!JSON.stringify(delta).includes(prepared.envelope));
  await assert.rejects(openRedStoreRecord(key,context,await a.storeGet('sync',context.id)));
 }finally{s.close();await rm(root,{recursive:true,force:true});}
});

test('Two persistent encrypted clients reconcile through actual RED Home API, including lost response and grant revocation',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-store-two-clients-')),origin='https://home.example.test',serverDir=join(root,'server');
 await mkdir(serverDir);
 const service=await openHomeServer({dataDir:serverDir,origin});
 const fileA=join(root,'a.sqlite'),fileB=join(root,'b.sqlite');
 let dbA=new DatabaseSync(fileA);
 const dbB=new DatabaseSync(fileB),key=crypto.getRandomValues(new Uint8Array(32)),localA=crypto.getRandomValues(new Uint8Array(32)),localB=crypto.getRandomValues(new Uint8Array(32));
 try{
  const post=(path:string,body:object,token?:string)=>service.handle(new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}));
  const {code}=await (await post('/konto/code',{geraet:'Synthetic owner'})).json() as {code:string};approveHomeDevice(service.store.sqlite,code);
  const {token,konto}=await (await post('/konto/code-holen',{code})).json() as {token:string;konto:{id:string}};
  const scope={origin,owner:konto.id,app:'red-poly',kind:'sync'} as const;
  let loseReply=false;
  const make=async(drop:boolean)=>{
   let session:RedSession|null=null;
   const store={async load(){return session;},async save(v:RedSession){session=v;},async clear(){session=null;}};
   const client=createRedIdV2Client(origin,'red-poly',store,async(input,init)=>{
    const request=new Request(input,init),response=await service.handle(request);
    if(drop&&loseReply&&new URL(request.url).pathname==='/red-store/v1/put'&&response.ok){loseReply=false;throw Error('synthetic lost response');}
    return response;
   });
   const proof=await createRedPairProof();
   assert.equal((await post('/red-id/v2/approve-login',{app:'red-poly',challenge:proof.challenge},token)).status,201);
   await client.claimLogin(proof.verifier);return client;
  };
  const clientA=await make(true),clientB=await make(false);
  assert.equal((await post('/red-store/v1/grant',{app:'red-poly',kind:'sync'},token)).status,201);
  let a=createSqliteSyncAdapter(dbA,scope,localA);
  const b=createSqliteSyncAdapter(dbB,scope,localB),decode=(bytes:Uint8Array)=>new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  const syncB=createRedSync(clientB,scope,key,b,decode),id=newRedStoreId();
  const original='SYNTHETIC_PRIVATE_SYNC_TEXT_972641';
  a.putLocal(id,original);loseReply=true;
  await assert.rejects(a.pushLocal(id,key,clientA),/synthetic lost response/);
  assert.equal(a.pendingUploads().length,1);
  assert.equal((await syncB.pull()).imported,1);assert.equal(b.getLocal(id)?.value,original);
  a.putLocal(id,'Offline edit A');a.dispose();dbA.close();
  assert.ok(!(await readFile(fileA)).includes(Buffer.from(original)));
  dbA=new DatabaseSync(fileA);a=createSqliteSyncAdapter(dbA,scope,localA);
  // A successful idempotent retry acknowledges the first write but not the newer edit.
  assert.deepEqual(await a.pushLocal(id,key,clientA),{revision:1,dirty:true});
  b.putLocal(id,'Independent edit B');assert.equal((await b.pushLocal(id,key,clientB)).revision,2);
  const syncA=createRedSync(clientA,scope,key,a,decode);
  assert.equal((await syncA.pull()).conflicts,1);
  const preview=await a.previewPullConflict(id,key,clientA);
  const before=(await a.snapshot()).cursor;
  const resolved=await a.resolvePullKeepBoth(id,preview.token,key,clientA);
  assert.ok(resolved.copyId);assert.equal(a.getLocal(id)?.value,'Independent edit B');assert.equal(a.getLocal(resolved.copyId)?.value,'Offline edit A');
  assert.equal((await a.snapshot()).cursor,before);assert.equal(a.conflicts().length,0);
  await a.pushLocal(resolved.copyId,key,clientA);
  assert.equal((await syncB.pull()).imported,1);assert.equal(b.getLocal(resolved.copyId)?.value,'Offline edit A');
  const oldCursor=(await a.snapshot()).cursor;
  assert.equal((await post('/red-id/v2/revoke',{app:'red-poly'},token)).status,200);
  await assert.rejects(syncA.pull());assert.equal((await a.snapshot()).cursor,oldCursor);
  assert.equal(a.getLocal(id)?.value,'Independent edit B');assert.equal(a.getLocal(resolved.copyId)?.value,'Offline edit A');
  syncA.dispose();syncB.dispose();a.dispose();b.dispose();
 }finally{key.fill(0);localA.fill(0);localB.fill(0);if(dbA.isOpen)dbA.close();dbB.close();service.close();await rm(root,{recursive:true,force:true});}
});
