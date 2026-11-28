import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {createRedPairProof,encryptRedShare} from '../red-sdk/client.mts';
test('directional app grants isolate mailboxes and revoke pending data',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-share-')),origin='https://redion.example.test';
 const s=await openHomeServer({dataDir:root,origin});
 try{
  const post=(path:string,body:unknown,token?:string)=>s.handle(new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}));
  const get=(path:string,token:string)=>s.handle(new Request(origin+path,{headers:{Authorization:'Bearer '+token}}));
  const {code}=await (await post('/konto/code',{geraet:'Owner'})).json() as any;
  approveHomeDevice(s.store.sqlite,code);
  const {token}=await (await post('/konto/code-holen',{code})).json() as any;
  const pair=async(app:string)=>{
   const proof=await createRedPairProof();
   const p=await (await post('/red-id/v2/pair',{app,challenge:proof.challenge},token)).json() as any;
   return (await (await post('/red-id/v2/exchange',{app,code:p.code,verifier:proof.verifier})).json() as any).accessToken as string;
  };
  const fit=await pair('red-fit'),poly=await pair('red-poly'),bit=await pair('red-bit');
  const base='/red-share/v1/',grant={source:'red-fit',target:'red-poly',channel:'test'},id='a'.repeat(32),payload={target:'red-poly',channel:'test',id,envelope:await encryptRedShare(crypto.getRandomValues(new Uint8Array(32)),{source:'red-fit',target:'red-poly',channel:'test',id},new TextEncoder().encode('private'))};
  const count=async(t:string)=>(await (await get(base+'inbox',t)).json() as any).messages.length;
  assert.equal((await post(base+'grant',grant,fit)).status,401);
  assert.equal((await post(base+'send',payload,fit)).status,403);
  assert.equal((await post(base+'grant',grant,token)).status,201);
  assert.equal((await post(base+'send',payload,fit)).status,201);
  assert.equal((await post(base+'send',payload,fit)).status,200);
  assert.equal((await post(base+'send',{...payload,target:'red-fit'},poly)).status,403);
  assert.equal(await count(bit),0);assert.equal(await count(fit),0);assert.equal(await count(poly),1);
  await post(base+'ack',{source:'red-fit',channel:'test',id},bit);assert.equal(await count(poly),1);
  await post(base+'ack',{source:'red-fit',channel:'test',id},poly);assert.equal(await count(poly),0);
  assert.equal((await post(base+'send',payload,fit)).status,200);assert.equal(await count(poly),0);
  const changed={...payload,envelope:await encryptRedShare(crypto.getRandomValues(new Uint8Array(32)),{source:'red-fit',target:'red-poly',channel:'test',id},new TextEncoder().encode('different'))};
  assert.equal((await post(base+'send',changed,fit)).status,409);
  assert.equal((await post(base+'send',{...payload,id:'b'.repeat(32),envelope:'YWJj'},fit)).status,400);
  assert.equal((await post(base+'send',{...payload,id:'b'.repeat(32)},fit)).status,201);
  assert.equal((await post('/red-id/v2/revoke',{app:'red-fit'},token)).status,200);
  assert.equal(await count(poly),0);
  assert.equal(Number(s.store.sqlite.prepare('SELECT COUNT(*) AS n FROM home_red_share_grant').get()?.n),0);
 }finally{s.close();await rm(root,{recursive:true,force:true});}
});
