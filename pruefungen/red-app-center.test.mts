import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {createRedPairProof,type RedSession} from '../red-sdk/client.mts';

test('App Center is owner-only, exposes scoped inventory and never credentials',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-app-center-')),origin='https://home.example.test',s=await openHomeServer({dataDir:root,origin,webOrigins:'https://web.example.test'});
 try{
  const post=(path:string,body:object,token?:string)=>s.handle(new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}));
  const get=(token?:string,clientOrigin?:string)=>s.handle(new Request(origin+'/home/apps',{headers:{...(token?{Authorization:'Bearer '+token}:{}),...(clientOrigin?{Origin:clientOrigin}:{})}}));
  const {code}=await (await post('/konto/code',{geraet:'Owner'})).json() as {code:string};approveHomeDevice(s.store.sqlite,code);
  const {token}=await (await post('/konto/code-holen',{code})).json() as {token:string};
  assert.equal((await get()).status,401);assert.equal((await get(token,'https://web.example.test')).status,403);
  const proof=await createRedPairProof();await post('/red-id/v2/approve-login',{app:'red-fit',challenge:proof.challenge},token);
  const session=await (await post('/red-id/v2/claim-login',{app:'red-fit',verifier:proof.verifier})).json() as RedSession;
  assert.equal((await get(session.accessToken)).status,401);
  assert.equal((await post('/red-store/v1/grant',{app:'red-fit',kind:'file'},token)).status,201);
  assert.equal((await post('/red-store/v1/put',{kind:'file',id:'a'.repeat(32),expectedRevision:0,operationId:'b'.repeat(32),envelope:Buffer.alloc(40,1).toString('base64url')},session.accessToken)).status,201);
  assert.equal((await post('/red-share/v1/grant',{source:'red-fit',target:'red-ion',channel:'workout'},token)).status,201);
  const response=await get(token,'capacitor://localhost');assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
  const data=await response.json() as {apps:{app:string;connected:boolean;sessions:number;grants:{kind:string}[];share:{incoming:number;outgoing:number};storage:{objects:number}}[]};
  assert.equal(data.apps.length,11);const fit=data.apps.find(a=>a.app==='red-fit')!,ion=data.apps.find(a=>a.app==='red-ion')!;
  assert.equal(fit.connected,true);assert.equal(fit.sessions,1);assert.equal(fit.grants[0]?.kind,'file');assert.equal(fit.storage.objects,1);assert.equal(fit.share.outgoing,1);assert.equal(ion.share.incoming,1);
  assert.ok(!JSON.stringify(data).includes(session.accessToken));assert.ok(!JSON.stringify(data).includes(session.refreshToken));assert.ok(!JSON.stringify(data).includes('a'.repeat(32)));
  assert.equal((await post('/red-id/v2/revoke',{app:'red-fit'},token)).status,200);
  const after=await (await get(token)).json() as typeof data;const revoked=after.apps.find(a=>a.app==='red-fit')!;
  assert.equal(revoked.connected,false);assert.equal(revoked.grants.length,0);assert.equal(revoked.storage.objects,1);
 }finally{s.close();await rm(root,{recursive:true,force:true});}
});
