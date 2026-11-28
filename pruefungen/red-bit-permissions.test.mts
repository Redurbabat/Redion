import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {createRedPairProof} from '../red-sdk/client.mts';

const origin='https://redion.example.test';
const grant='/home/red-bit/grant',revoke='/home/red-bit/revoke',grants='/home/red-bit/grants',permission='/red-bit/v1/permission';

async function fixture(enabled:boolean,run:(f:any)=>Promise<void>,jobs=false){
 const root=await mkdtemp(join(tmpdir(),'red-bit-permissions-'));
 const service=await openHomeServer({dataDir:root,origin,enableRedBitPermissions:enabled,enableRedBitReadJobs:jobs});
 try{
  const send=(path:string,init?:RequestInit)=>service.handle(new Request(origin+path,init));
  const get=(path:string,token?:string)=>send(path,{headers:token?{Authorization:'Bearer '+token}:{}});
  const post=(path:string,body:unknown,token?:string)=>send(path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  const {code}=await (await post('/konto/code',{geraet:'Owner'})).json() as any;
  approveHomeDevice(service.store.sqlite,code);
  const {token}=await (await post('/konto/code-holen',{code})).json() as any;
  const pair=async(app:string)=>{
   const proof=await createRedPairProof();
   const approval=await post('/red-id/v2/approve-login',{app,challenge:proof.challenge},token);
   assert.equal(approval.status,201);
   const claimed=await post('/red-id/v2/claim-login',{app,verifier:proof.verifier});
   assert.equal(claimed.status,200);
   const credentials=await claimed.json() as any;
   const digest=(await import('node:crypto')).createHash('sha256').update(credentials.accessToken).digest('hex');
   const row=service.store.sqlite.prepare('SELECT id FROM home_red_session WHERE access_digest=?').get(digest);
   assert.ok(row);
   return {...credentials,sessionId:String(row.id)};
  };
  await run({service,send,get,post,token,pair});
 }finally{service.close();await rm(root,{recursive:true,force:true});}
}

test('RED Bit permission pilot default disabled, not an action transport',async()=>{
 await fixture(false,async({get,post,token,pair})=>{
  const bit=await pair('red-bit');
  assert.equal((await get(grants,token)).status,404);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true},token)).status,404);
  assert.equal((await get(permission,bit.accessToken)).status,404);
  assert.equal((await post('/red-bit/v1/execute',{},bit.accessToken)).status,404);
 });
});

test('Owner confirmation creates only a bounded read permission for one live RED Bit session',async()=>{
 await fixture(true,async({get,post,token,pair})=>{
  const bit=await pair('red-bit'),other=await pair('red-bit'),fit=await pair('red-fit');
  assert.equal((await get(permission,bit.accessToken)).status,403);
  assert.equal((await get(permission,fit.accessToken)).status,401);
  assert.equal((await get(permission,token)).status,401);
  assert.equal((await get(grants,bit.accessToken)).status,401);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true},bit.accessToken)).status,401);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:false},token)).status,400);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true,scope:'transport'},token)).status,400);
  assert.equal((await post(grant,{sessionId:fit.sessionId,confirm:true},token)).status,404);
  const result=await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal(result.status,201);
  const g=await result.json() as any;
  assert.equal(g.scope,'music:status:read');
  assert.equal(g.remoteAvailable,false);
  assert.ok(g.expiresAt>Date.now()&&g.expiresAt<=Date.now()+3600000);
  const check=await get(permission,bit.accessToken);
  assert.equal(check.status,200);
  assert.equal(check.headers.get('Cache-Control'),'no-store');
  assert.deepEqual(await check.json(),{version:1,app:'red-bit',scope:'music:status:read',expiresAt:g.expiresAt,remoteAvailable:false});
  assert.equal((await get(permission,other.accessToken)).status,403);
  assert.equal((await get(permission,fit.accessToken)).status,401);
  const inventory=await (await get(grants,token)).json() as any;
  assert.deepEqual(inventory.grants,[{sessionId:bit.sessionId,expiresAt:g.expiresAt}]);
  assert.equal(inventory.remoteAvailable,false);
  assert.equal((await post('/red-bit/v1/execute',{},bit.accessToken)).status,404);
  assert.equal((await post(revoke,{sessionId:bit.sessionId,confirm:true},token)).status,200);
  assert.equal((await get(permission,bit.accessToken)).status,403);
 });
});

test('RED Bit permission is checked against rotation, expiry and session revocation',async()=>{
 await fixture(true,async({service,get,post,token,pair})=>{
  const bit=await pair('red-bit');
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true},token)).status,201);
  const rotation=await post('/red-id/v2/refresh',{app:'red-bit',refreshToken:bit.refreshToken});
  assert.equal(rotation.status,200);
  const next=await rotation.json() as any;
  assert.equal((await get(permission,bit.accessToken)).status,401);
  assert.equal((await get(permission,next.accessToken)).status,200);
  service.store.sqlite.prepare('UPDATE home_red_bit_permission SET expires=? WHERE session_id=?').run(Date.now()-1,bit.sessionId);
  assert.equal((await get(permission,next.accessToken)).status,403);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true},token)).status,201);
  assert.equal((await post('/red-id/v2/revoke-session',{id:bit.sessionId},token)).status,200);
  assert.equal((await get(permission,next.accessToken)).status,401);
  assert.equal(service.store.sqlite.prepare('SELECT 1 FROM home_red_bit_permission WHERE session_id=?').get(bit.sessionId),undefined);
 });
});

test('Permission pilot rejects invalid origin, unbounded input, and locked account',async()=>{
 await fixture(true,async({service,send,get,post,token,pair})=>{
  const bit=await pair('red-bit');
  const req={method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Origin:'https://foreign.example.test'},body:JSON.stringify({sessionId:bit.sessionId,confirm:true})};
  assert.equal((await send(grant,req)).status,403);
  assert.equal((await post(grant,{sessionId:'x'.repeat(2048),confirm:true},token)).status,400);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true},token)).status,201);
  service.store.sqlite.exec('UPDATE konten SET gesperrt=1');
  assert.equal((await get(permission,bit.accessToken)).status,401);
  assert.equal((await get(grants,token)).status,401);
 });
});

const requestJob='/home/red-bit/read-request',resultJob='/home/red-bit/read-result',claimJob='/red-bit/v1/read-claim',completeJob='/red-bit/v1/read-complete';
const status={version:1,state:'paused',hasTrack:true,canNext:false,canPrevious:false,controlsLocked:false,hasPlaybackError:false};
const jobId='a'.repeat(32);
const requestBody=(sessionId:string,id=jobId)=>({sessionId,id,issuedAt:Date.now(),confirm:true});

test('Read job transport needs its own opt-in',async()=>{
 await fixture(true,async({get,post,token,pair})=>{
  const bit=await pair('red-bit');
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal((await post(requestJob,requestBody(bit.sessionId),token)).status,404);
  assert.equal((await post(claimJob,{confirm:true},bit.accessToken)).status,404);
 });
});

test('Read job is owner-approved, isolated, claimed once and returns only strict status',async()=>{
 await fixture(true,async({post,token,pair})=>{
  const bit=await pair('red-bit'),other=await pair('red-bit'),fit=await pair('red-fit');
  assert.equal((await post(requestJob,requestBody(bit.sessionId),token)).status,403);
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  await post(grant,{sessionId:other.sessionId,confirm:true},token);
  const body=requestBody(bit.sessionId);
  assert.equal((await post(requestJob,body,bit.accessToken)).status,401);
  assert.equal((await post(requestJob,{...body,tool:'redbit_play'},token)).status,400);
  assert.equal((await post(requestJob,{...body,issuedAt:Date.now()-31000},token)).status,400);
  const created=await post(requestJob,body,token);assert.equal(created.status,201);
  assert.equal((await created.json() as any).tool,'redbit_read_status');
  assert.equal((await post(requestJob,body,token)).status,409);
  assert.equal((await post(requestJob,requestBody(bit.sessionId,'b'.repeat(32)),token)).status,409);
  assert.equal((await post(claimJob,{confirm:true},fit.accessToken)).status,401);
  assert.equal((await post(claimJob,{confirm:false},bit.accessToken)).status,400);
  assert.deepEqual(await (await post(claimJob,{confirm:true},other.accessToken)).json(),{version:1,job:null});
  assert.equal((await post(completeJob,{id:jobId,status},bit.accessToken)).status,409);
  const claimed=await (await post(claimJob,{confirm:true},bit.accessToken)).json() as any;
  assert.equal(claimed.job.id,jobId);
  assert.deepEqual(await (await post(claimJob,{confirm:true},bit.accessToken)).json(),{version:1,job:null});
  assert.equal((await post(completeJob,{id:jobId,status},other.accessToken)).status,409);
  assert.equal((await post(completeJob,{id:jobId,status:{...status,title:'private'}},bit.accessToken)).status,400);
  assert.equal((await post(completeJob,{id:jobId,status},bit.accessToken)).status,200);
  assert.equal((await post(completeJob,{id:jobId,status},bit.accessToken)).status,409);
  assert.equal((await post(resultJob,{sessionId:bit.sessionId,id:jobId},bit.accessToken)).status,401);
  assert.deepEqual(await (await post(resultJob,{sessionId:bit.sessionId,id:jobId},token)).json(),{version:1,state:'completed',status});
  await post(revoke,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal((await post(resultJob,{sessionId:bit.sessionId,id:jobId},token)).status,403);
 },true);
});

test('Read job expiry and grant renewal cannot revive a previously claimed result',async()=>{
 await fixture(true,async({service,post,token,pair})=>{
  const bit=await pair('red-bit');
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  await post(requestJob,requestBody(bit.sessionId),token);
  await post(claimJob,{confirm:true},bit.accessToken);
  service.store.sqlite.prepare('UPDATE home_red_bit_read_job SET expires=? WHERE id=?').run(Date.now()-1,jobId);
  assert.equal((await post(completeJob,{id:jobId,status},bit.accessToken)).status,409);
  assert.equal((await post(resultJob,{sessionId:bit.sessionId,id:jobId},token)).status,404);
  const second='c'.repeat(32);
  assert.equal((await post(requestJob,requestBody(bit.sessionId,second),token)).status,201);
  await post(claimJob,{confirm:true},bit.accessToken);
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal((await post(completeJob,{id:second,status},bit.accessToken)).status,409);
  assert.equal(Number(service.store.sqlite.prepare('SELECT COUNT(*) AS n FROM home_red_bit_read_job').get().n),0);
 },true);
});

test('Read-job preflight allows only trusted app origins and never grants execution',async()=>{
 for(const enabled of [false,true]){
  await fixture(true,async({send})=>{
   for(const path of [requestJob,resultJob,claimJob,completeJob]){
    for(const source of ['redion-local://app','capacitor://localhost',origin]){
     const headers={Origin:source,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'};
     const response=await send(path,{method:'OPTIONS',headers});
     assert.equal(response.status,enabled?204:404);
     if(enabled){
      assert.equal(response.headers.get('Access-Control-Allow-Origin'),source);
      assert.match(response.headers.get('Access-Control-Allow-Methods')??'',/POST/);
      assert.match(response.headers.get('Access-Control-Allow-Headers')??'',/Authorization/i);
      assert.equal(await response.text(),'');
      const denied=await send(path,{method:'POST',headers:{Origin:source,'Content-Type':'application/json'},body:JSON.stringify({confirm:true})});
      assert.equal(denied.status,401);
     }
    }
    for(const source of ['https://evil.example.test','null']){
     const response=await send(path,{method:'OPTIONS',headers:{Origin:source}});
     assert.equal(response.status,403);
     assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
    }
   }
  },enabled);
 }
});
