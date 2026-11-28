import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {createRedPairProof,encodeRedPairRequest,prepareRedBatchApproval,type RedSession} from '../red-sdk/client.mts';
test('batch approval is owner-only, all-or-nothing, separate proof-bound sessions',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-batch-')),origin='https://home.example.test',s=await openHomeServer({dataDir:root,origin,webOrigins:'https://web.example.test'});
 try{
  const send=(path:string,body?:object,token?:string,from?:string)=>s.handle(new Request(origin+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(from?{Origin:from}:{})},...(body?{body:JSON.stringify(body)}:{})}));
  const {code}=await (await send('/konto/code',{geraet:'Owner'})).json() as {code:string};approveHomeDevice(s.store.sqlite,code);
  const {token}=await (await send('/konto/code-holen',{code})).json() as {token:string};
  const fit=await createRedPairProof(),poly=await createRedPairProof(),bit=await createRedPairProof();
  const fitPayload=encodeRedPairRequest('red-fit',fit.challenge),polyPayload=encodeRedPairRequest('red-poly',poly.challenge);
  const payload=prepareRedBatchApproval([fitPayload,polyPayload]);
  const base='/red-id/v2/',claim=(app:string,verifier:string)=>send(base+'claim-login',{app,verifier});
  assert.throws(()=>prepareRedBatchApproval([fitPayload,fitPayload]));
  assert.equal((await send(base+'approve-batch',payload)).status,401);
  assert.equal((await send(base+'approve-batch',payload,token,'https://web.example.test')).status,403);
  assert.equal((await send(base+'approve-batch',{requests:[...payload.requests,{app:'red-bit',challenge:'bad'}]},token)).status,400);
  assert.equal((await claim('red-fit',fit.verifier)).status,401);
  assert.equal((await send(base+'approve-batch',payload,token)).status,201);
  assert.equal((await send(base+'approve-batch',{requests:[{app:'red-bit',challenge:bit.challenge},payload.requests[0]]},token)).status,409);
  assert.equal((await claim('red-bit',bit.verifier)).status,401);
  assert.equal((await claim('red-poly',fit.verifier)).status,401);
  const fa=await claim('red-fit',fit.verifier),pa=await claim('red-poly',poly.verifier);
  assert.equal(fa.status,200);assert.equal(pa.status,200);
  const f=await fa.json() as RedSession,p=await pa.json() as RedSession;
  assert.notEqual(f.accessToken,p.accessToken);assert.notEqual(f.refreshToken,p.refreshToken);
  assert.equal((await send(base+'approve-batch',payload,f.accessToken)).status,401);
  assert.equal((await claim('red-fit',fit.verifier)).status,401);
  assert.equal((await send(base+'revoke',{app:'red-fit'},token)).status,200);
  assert.equal((await send(base+'me',undefined,f.accessToken)).status,401);
  assert.equal((await send(base+'me',undefined,p.accessToken)).status,200);
 }finally{s.close();await rm(root,{recursive:true,force:true});}
});
