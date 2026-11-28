import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {issueRedId} from '../server/home/red-id.ts';

test('dashboard requires a real device session and exposes measured, non-secret status',async()=>{
  const root=await mkdtemp(join(tmpdir(),'red-dashboard-'));
  const origin='https://redion.example.test';
  const service=await openHomeServer({dataDir:root,origin});
  try{
    const send=(path:string,init?:RequestInit)=>service.handle(new Request(origin+path,init));
    const post=(path:string,body:unknown)=>send(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const endpoint='/home/dashboard';
    assert.equal((await send(endpoint)).status,401);
    const {code}=await (await post('/konto/code',{geraet:'Test'})).json() as {code:string};
    approveHomeDevice(service.store.sqlite,code);
    const {token}=await (await post('/konto/code-holen',{code})).json() as {token:string};
    const app=issueRedId(service.store.sqlite,'red-fit');
    assert.equal((await send(endpoint,{headers:{Authorization:'Bearer '+app.token}})).status,401);
    const headers={Authorization:'Bearer '+token,Origin:'capacitor://localhost'};
    const response=await send(endpoint,{headers});
    assert.equal(response.status,200);
    assert.equal(response.headers.get('Cache-Control'),'no-store');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'),'capacitor://localhost');
    const data=await response.json() as any;
    assert.equal(data.version,1);assert.equal(data.devices.authorizedSessions,1);
    assert.equal(data.redId.activeCredentials,1);assert.equal(data.services.mcp,'disabled');
    assert.ok(data.memory.totalBytes>0&&data.storage.totalBytes>0);
    assert.ok(['ok','warning','critical'].includes(data.storageReview.status));
    assert.equal(data.storageReview.totalBytes,data.storage.totalBytes);
    assert.equal(data.storageReview.availableBytes,data.storage.availableBytes);
    assert.ok(data.cpu.percent===null||data.cpu.percent>=0&&data.cpu.percent<=100);
    assert.ok(!JSON.stringify(data).includes(token));assert.ok(!JSON.stringify(data).includes(root));
    assert.equal((await send(endpoint,{headers:{...headers,Origin:'https://evil.example'}})).status,403);
    assert.equal((await send(endpoint,{method:'POST',headers})).status,405);
    const preflight=await send(endpoint,{method:'OPTIONS',headers:{Origin:'capacitor://localhost','Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'authorization'}});
    assert.equal(preflight.status,204);assert.match(preflight.headers.get('Access-Control-Allow-Headers')??'',/Authorization/i);
  }finally{service.close();await rm(root,{recursive:true,force:true});}
});
