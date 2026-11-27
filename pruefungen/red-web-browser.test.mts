import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {parseRedWebOrigins} from '../server/home/web-origins.ts';
import {createRedBrowserIdentity} from '../red-sdk/browser.mts';
test('configured web origin is identity-only; browser session is explicitly claimed and disposed',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'red-web-')),origin='https://home.example.test',web='https://fit.example.test';
 const s=await openHomeServer({dataDir:dir,origin,webOrigins:web});
 try{
  const send=(path:string,init?:RequestInit)=>s.handle(new Request(origin+path,init));
  const post=(path:string,body:object,token?:string)=>send(path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  const {code}=await (await post('/konto/code',{geraet:'Owner'})).json() as {code:string};
  approveHomeDevice(s.store.sqlite,code);
  const {token}=await (await post('/konto/code-holen',{code})).json() as {token:string};
  for(const path of ['/home/dashboard','/sync/runter','/red-id/v2/apps','/red-id/v2/approve-login','/red-share/v1/inbox']){
   assert.equal((await send(path,{headers:{Origin:web,Authorization:'Bearer '+token}})).status,403);
  }
  assert.equal((await send('/red-id/v2/me',{headers:{Origin:'https://evil.example.test'}})).status,403);
  const preflight=await send('/red-id/v2/claim-login',{method:'OPTIONS',headers:{Origin:web,'Access-Control-Request-Method':'POST'}});
  assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),web);
  const client=createRedBrowserIdentity(origin,'red-fit',async(input,init)=>{
   assert.equal(init?.credentials,'omit');assert.equal(init?.redirect,'error');
   const headers=new Headers(init?.headers);headers.set('Origin',web);
   const r=await s.handle(new Request(input,{...init,headers}));assert.equal(r.headers.get('Access-Control-Allow-Origin'),web);return r;
  });
  const req=JSON.parse(await client.begin());
  assert.equal((await post('/red-id/v2/approve-login',{app:req.app,challenge:req.challenge},token)).status,201);
  assert.equal((await client.claim()).app,'red-fit');
  await client.logout();await assert.rejects(client.me());
  client.dispose();await assert.rejects(client.begin());
  for(const invalid of ['*','http://localhost','https://a.test/path','https://a.test/','https://a.test:443'])assert.throws(()=>parseRedWebOrigins(invalid));
 }finally{s.close();await rm(dir,{recursive:true,force:true});}
});
