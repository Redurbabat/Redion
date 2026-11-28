import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {createRedPairProof,createRedIdV2Client,prepareRedStoreWrite,openRedStoreRecord,newRedStoreId,type RedSession} from '../red-sdk/client.mts';
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
