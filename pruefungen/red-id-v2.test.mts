import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {createRedPairProof,createRedIdV2Client,type RedSession} from '../red-sdk/client.mts';

test('RED ID v2: authenticated pairing, proof, rotation, isolation, revocation',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-id-v2-')),origin='https://redion.example.test';
 const service=await openHomeServer({dataDir:root,origin});
 try{
  const send=(path:string,init?:RequestInit)=>service.handle(new Request(origin+path,init));
  const post=(path:string,body:unknown,token?:string)=>send(path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  const {code}=await (await post('/konto/code',{geraet:'Owner'})).json() as any;
  approveHomeDevice(service.store.sqlite,code);
  const {token}=await (await post('/konto/code-holen',{code})).json() as any;
  const proof=await createRedPairProof(),base='/red-id/v2/';
  assert.equal((await post(base+'pair',{app:'red-fit',challenge:proof.challenge})).status,401);
  const pair=await post(base+'pair',{app:'red-fit',challenge:proof.challenge},token);assert.equal(pair.status,201);
  const pairing=await pair.json() as any;
  assert.equal((await post(base+'exchange',{app:'red-poly',code:pairing.code,verifier:proof.verifier})).status,401);
  assert.equal((await post(base+'exchange',{app:'red-fit',code:pairing.code,verifier:'a'.repeat(43)})).status,401);
  let session:RedSession|null=null;
  const store={async load(){return session;},async save(v:RedSession){session=v;},async clear(){session=null;}};
  const client=createRedIdV2Client(origin,'red-fit',store,(input,init)=>service.handle(new Request(input,init)));
  await client.pair(pairing.code,proof.verifier);
  const identity=await client.me();assert.equal(identity.app,'red-fit');assert.deepEqual(identity.scopes,['identity:read']);
  const old=(await store.load())!;
  assert.equal((await post(base+'exchange',{app:'red-fit',code:pairing.code,verifier:proof.verifier})).status,401);
  assert.equal((await send('/home/dashboard',{headers:{Authorization:'Bearer '+old.accessToken}})).status,401);
  assert.equal((await send('/sync/runter',{headers:{Authorization:'Bearer '+old.accessToken}})).status,401);
  await client.refresh();
  const next=(await store.load())!;assert.notEqual(next.accessToken,old.accessToken);assert.notEqual(next.refreshToken,old.refreshToken);
  assert.equal((await post(base+'refresh',{app:'red-fit',refreshToken:old.refreshToken})).status,401);
  assert.equal((await send(base+'me',{headers:{Authorization:'Bearer '+old.accessToken}})).status,401);
  assert.equal((await post(base+'revoke',{app:'red-fit'},next.accessToken)).status,401);
  assert.equal((await post(base+'revoke',{app:'red-fit'},token)).status,200);
  await assert.rejects(client.me());assert.equal(await store.load(),null);
 }finally{service.close();await rm(root,{recursive:true,force:true});}
});
