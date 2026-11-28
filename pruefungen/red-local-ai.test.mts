import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {createLocalAiGateway,parseLocalAiModels} from '../server/home/ai-gateway.ts';
import {createRedPairProof,type RedSession} from '../red-sdk/client.mts';
test('local AI allowlist is explicit and rejects URLs and cloud model names',()=>{
 assert.deepEqual(parseLocalAiModels(''),[]);
 assert.deepEqual(parseLocalAiModels('qwen2.5-coder:7b, llama3.2'),['qwen2.5-coder:7b','llama3.2']);
 for(const raw of ['http://host','a,a','a,','a:cloud','model-cloud','../a'])assert.throws(()=>parseLocalAiModels(raw));
});
test('owner-only AI gateway uses fixed endpoint, consent and bounded explicit generation',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-ai-')),origin='https://home.example.test';
 const s=await openHomeServer({dataDir:root,origin,webOrigins:'https://web.example.test',localAiModels:'qwen2.5-coder:7b'});
 let calls=0,finish:(()=>void)|undefined;
 const mock:typeof fetch=async(url,init)=>{
  calls++;assert.equal(url,'http://127.0.0.1:11434/api/generate');assert.equal(init?.redirect,'error');
  const body=JSON.parse(String(init?.body));assert.equal(body.stream,false);assert.equal(body.options.num_predict,512);assert.equal(body.options.num_ctx,4096);assert.equal(body.prompt,'Test');
  await new Promise<void>(resolve=>{finish=resolve;});
  return Response.json({done:true,response:'Antwort',internal:'private'});
 };
 const gateway=createLocalAiGateway(s.store.ablage,['qwen2.5-coder:7b'],mock);
 try{
  const req=(path:string,body?:object,token?:string,from?:string)=>new Request(origin+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(from?{Origin:from}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const {code}=await (await s.handle(req('/konto/code',{geraet:'Owner'}))).json() as {code:string};
  approveHomeDevice(s.store.sqlite,code);
  const {token}=await (await s.handle(req('/konto/code-holen',{code}))).json() as {token:string};
  const proof=await createRedPairProof();
  await s.handle(req('/red-id/v2/approve-login',{app:'red-fit',challenge:proof.challenge},token));
  const app=await (await s.handle(req('/red-id/v2/claim-login',{app:'red-fit',verifier:proof.verifier}))).json() as RedSession;
  const model='/home/ai/models',gen='/home/ai/generate',payload={model:'qwen2.5-coder:7b',prompt:'Test',confirmLocalProcessing:true};
  assert.equal((await s.handle(req(model))).status,401);
  assert.equal((await s.handle(req(model,undefined,app.accessToken))).status,401);
  assert.equal((await s.handle(req(model,undefined,token,'https://web.example.test'))).status,403);
  const list=await s.handle(req(model,undefined,token));assert.equal(list.status,200);assert.equal(list.headers.get('Cache-Control'),'no-store');
  assert.equal((await gateway.handle(req(gen,payload,app.accessToken))).status,401);
  for(const invalid of [{...payload,confirmLocalProcessing:false},{...payload,url:'https://example.test'},{...payload,model:'other'},{...payload,prompt:'x'.repeat(16385)}])assert.equal((await gateway.handle(req(gen,invalid,token))).status,400);
  assert.equal(calls,0);
  const running=gateway.handle(req(gen,payload,token));
  const deadline=Date.now()+5000;
  while(!finish&&Date.now()<deadline)await new Promise(r=>setTimeout(r,1));
  if(!finish)throw Error('Provider was not called');
  assert.equal((await gateway.handle(req(gen,payload,token))).status,429);
  finish();const result=await running;assert.equal(result.status,200);assert.deepEqual(await result.json(),{version:1,model:payload.model,text:'Antwort'});assert.equal(calls,1);
  gateway.close();assert.equal((await gateway.handle(req(model,undefined,token))).status,404);
  const disabled=createLocalAiGateway(s.store.ablage,[],mock);
  assert.equal((await disabled.handle(req(model,undefined,token))).status,404);disabled.close();
 }finally{finish?.();gateway.close();s.close();await rm(root,{recursive:true,force:true});}
});
