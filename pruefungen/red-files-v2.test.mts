import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {createRedFiles,createRedPairProof,createRedIdV2Client,RED_FILE_MAX_BYTES,RED_FILE_CHUNK_BYTES,type RedSession,type RedStoreWrite,type RedStoreRecord} from '../red-sdk/client.mts';

test('RED Files: manifest-last, interrupted upload retry, isolation and authenticated reconstruction',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-files-')),origin='https://home.example.test',s=await openHomeServer({dataDir:root,origin});
 try{
  const post=(path:string,body:object,token?:string)=>s.handle(new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}));
  const {code}=await (await post('/konto/code',{geraet:'Owner'})).json() as {code:string};approveHomeDevice(s.store.sqlite,code);
  const {token,konto}=await (await post('/konto/code-holen',{code})).json() as {token:string;konto:{id:string}};
  const make=async(app:'red-fit'|'red-poly')=>{
   let session:RedSession|null=null;
   const c=createRedIdV2Client(origin,app,{async load(){return session;},async save(v){session=v;},async clear(){session=null;}},(i,n)=>s.handle(new Request(i,n)));
   const proof=await createRedPairProof();await post('/red-id/v2/approve-login',{app,challenge:proof.challenge},token);await c.claimLogin(proof.verifier);return c;
  };
  const a=await make('red-fit'),b=await make('red-fit'),other=await make('red-poly');
  await post('/red-store/v1/grant',{app:'red-fit',kind:'file'},token);
  await post('/red-store/v1/grant',{app:'red-poly',kind:'file'},token);
  const scope={origin,owner:konto.id,app:'red-fit'} as const,key=new Uint8Array(32).fill(8),bytes=new Uint8Array(RED_FILE_CHUNK_BYTES*2+11);
  for(let i=0;i<bytes.length;i++)bytes[i]=i%251;
  let count=0,interrupt=true;
  const writer=createRedFiles({storeGet:a.storeGet,async storePut(w:RedStoreWrite){const r=await a.storePut(w);if(interrupt&&++count===1)throw Error('connection lost after commit');return r;}},scope,key);
  const reader=createRedFiles(b,scope,key),plan=await writer.prepare('private.pdf',bytes);
  assert.equal(plan.chunks.length,3);assert.ok(!JSON.stringify(plan).includes('private.pdf'));
  await assert.rejects(writer.upload(plan));
  await assert.rejects(b.storeGet('file',plan.id));
  interrupt=false;
  const progress:number[]=[];assert.equal(await writer.upload(JSON.parse(JSON.stringify(plan)),(n)=>progress.push(n)),plan.id);
  assert.deepEqual(progress,[1,2,3,4]);assert.equal(await writer.upload(plan),plan.id);
  const result=await reader.download(plan.id);assert.equal(result.name,'private.pdf');assert.deepEqual(result.bytes,bytes);
  await assert.rejects(other.storeGet('file',plan.id));
  const wrong=createRedFiles(b,scope,new Uint8Array(32).fill(9));await assert.rejects(wrong.download(plan.id));wrong.dispose();
  const corrupt=createRedFiles({storePut:b.storePut,async storeGet(kind,id){const record=await b.storeGet(kind,id);return id===plan.chunks[0]?.id?{...record,envelope:(record.envelope[0]==='A'?'B':'A')+record.envelope.slice(1)}:record;}},scope,key);
  await assert.rejects(corrupt.download(plan.id));corrupt.dispose();
  // The staged sink receives authenticated chunks, then publishes exactly once.
  const staged:Uint8Array[]=[];const borrowed:Uint8Array[]=[];let commits=0,aborts=0;
  const sink={
   async begin(info:Readonly<{name:string;size:number}>){assert.equal(info.name,'private.pdf');assert.equal(info.size,bytes.length);staged.length=0;},
   async write(chunk:Uint8Array,offset:number){assert.equal(offset,staged.reduce((n,v)=>n+v.length,0));borrowed.push(chunk);staged.push(new Uint8Array(chunk));},
   async commit(){commits++;},async abort(){aborts++;staged.length=0;}
  };
  assert.deepEqual(await reader.downloadTo(plan.id,sink),{name:'private.pdf',size:bytes.length});
  assert.deepEqual(Buffer.concat(staged),Buffer.from(bytes));assert.equal(commits,1);assert.equal(aborts,0);
  assert.ok(borrowed.every(chunk=>chunk.every(v=>v===0)));
  const lateCorrupt=createRedFiles({storePut:b.storePut,async storeGet(kind,id){const record=await b.storeGet(kind,id);return id===plan.chunks[1]?.id?{...record,envelope:(record.envelope[0]==='A'?'B':'A')+record.envelope.slice(1)}:record;}},scope,key);
  await assert.rejects(lateCorrupt.downloadTo(plan.id,sink));
  assert.equal(commits,1);assert.equal(aborts,1);assert.equal(staged.length,0);lateCorrupt.dispose();
  await assert.rejects(reader.downloadTo(plan.id,{...sink,async write(){throw Error('disk full');}}),/disk full/);
  assert.equal(aborts,2);assert.equal(commits,1);
  await assert.rejects(reader.downloadTo(plan.id,{...sink,async begin(){throw Error('staging failed');}}),/staging failed/);
  assert.equal(aborts,3);assert.equal(commits,1);
  const invalid={...plan,chunks:[...plan.chunks].reverse()};await assert.rejects(writer.upload(invalid));
  const empty=await writer.prepare('empty.txt',new Uint8Array());assert.equal(empty.chunks.length,0);await writer.upload(empty);assert.equal((await reader.download(empty.id)).bytes.length,0);
  await assert.rejects(writer.prepare('../secret',bytes));await assert.rejects(writer.prepare('too-big',new Uint8Array(RED_FILE_MAX_BYTES+1)));
  writer.dispose();reader.dispose();await assert.rejects(reader.download(plan.id));
 }finally{s.close();await rm(root,{recursive:true,force:true});}
});
test('maximum file plan reconstructs all bytes within bounded pilot size',async()=>{
 const scope={origin:'https://home.example.test',owner:'owner',app:'red-fit'} as const;
 const records=new Map<string,RedStoreRecord>();
 const client={async storePut(w:RedStoreWrite){records.set(w.id,{version:1,id:w.id,revision:1,deleted:0,envelope:w.envelope,updated:1});return {version:1 as const,id:w.id,revision:1,deleted:0 as const};},async storeGet(_kind:'file'|'sync',id:string){const r=records.get(id);if(!r)throw Error('missing');return r;}};
 const files=createRedFiles(client,scope,new Uint8Array(32).fill(5));
 const bytes=new Uint8Array(RED_FILE_MAX_BYTES);bytes[0]=13;bytes[bytes.length-1]=29;
 const plan=await files.prepare('large.bin',bytes);
 assert.equal(plan.chunks.length,Math.ceil(RED_FILE_MAX_BYTES/RED_FILE_CHUNK_BYTES));
 await files.upload(plan);
 assert.ok([...records.values()].reduce((n,r)=>n+r.envelope.length,0)<16*1024*1024);
 assert.deepEqual((await files.download(plan.id)).bytes,bytes);
 files.dispose();
});
