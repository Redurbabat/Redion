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

async function fixture(enabled:boolean,run:(f:any)=>Promise<void>){
 const root=await mkdtemp(join(tmpdir(),'red-bit-permissions-'));
 const service=await openHomeServer({dataDir:root,origin,enableRedBitPermissions:enabled});
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
