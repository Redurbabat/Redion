import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'rolldown';
const require=createRequire(import.meta.url);
const {VisualArtifacts,MAX_IMAGE_BYTES}=require('../../../windows/generated/visual-artifacts.cjs');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'redion-binary-model-'));
const compiled=path.join(temporary,'frames.mjs');
await build({input:path.resolve(import.meta.dirname,'../server/response-frames.mts'),platform:'node',external:[/^node:/],output:{file:compiled,format:'esm'}});
const {ResponseFrames}=await import(pathToFileURL(compiled).href);
test.after(()=>fs.rmSync(temporary,{recursive:true,force:true}));

test('Bildartefakte gehören ihrer Sitzung, verfallen, bleiben begrenzt und verschwinden bei Widerruf',()=>{
  let time=0;const vault=new VisualArtifacts(()=>time);
  const info={mimeType:'image/png',width:100,height:100,target:'window'};
  const image=vault.put('first',Buffer.from([0,10,255,128]),info);
  assert.equal(JSON.stringify(image).includes('base64'),false);
  assert.throws(()=>vault.read('second',image.artifactId),{code:'IMAGE_EXPIRED'});
  const copy=vault.read('first',image.artifactId).bytes;copy.fill(0);
  assert.deepEqual(vault.read('first',image.artifactId).bytes,Buffer.from([0,10,255,128]));
  time=60_000;assert.throws(()=>vault.read('first',image.artifactId),{code:'IMAGE_EXPIRED'});
  const oldest=vault.put('first',Buffer.alloc(1),info);
  for(let i=0;i<8;i++)vault.put('first',Buffer.alloc(1),info);
  assert.throws(()=>vault.read('first',oldest.artifactId),{code:'IMAGE_EXPIRED'});
  const revoked=vault.put('first',Buffer.alloc(1),info);vault.release('first');
  assert.throws(()=>vault.read('first',revoked.artifactId),{code:'IMAGE_EXPIRED'});
  assert.throws(()=>vault.put('first',Buffer.alloc(MAX_IMAGE_BYTES+1),info),{code:'IMAGE_TOO_LARGE'});
});
test('Binäre Bilder überleben jede Paketgrenze und werden nie als UTF-8/JSON verarbeitet',()=>{
  const bytes=crypto.randomBytes(64*1024);bytes.set([10,0,255,192,128],0);
  const header=Buffer.from(JSON.stringify({id:'image-1',ok:true,data:{width:64},binary:{length:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')}})+'\n');
  const plain=Buffer.from(JSON.stringify({id:'next',ok:true,data:{text:'ä⚡'}})+'\n');
  const stream=Buffer.concat([header,bytes,plain]);
  for(const size of [1,3,37,4096,stream.length]) {
    const parser=new ResponseFrames(),results:any[]=[];
    for(let i=0;i<stream.length;i+=size)results.push(...parser.push(stream.subarray(i,i+size)));
    assert.equal(results.length,2);assert.deepEqual(results[0].bytes,bytes);assert.equal(results[1].data.text,'ä⚡');
    assert.equal(results[0].binary,undefined);
  }
});
test('Gefälschte Grösse, beschädigte Bildbytes und ungeprüfte Antworten brechen ab',()=>{
  const frame=(length:number,hash='a'.repeat(64))=>Buffer.from(JSON.stringify({ok:true,binary:{length,sha256:hash}})+'\n');
  for(const length of [-1,0,MAX_IMAGE_BYTES+1,1.5])assert.throws(()=>new ResponseFrames().push(frame(length)),{code:'INVALID_FRAME'});
  assert.throws(()=>new ResponseFrames().push(Buffer.concat([frame(3),Buffer.from([1,2,3])])),{code:'INVALID_FRAME'});
  assert.throws(()=>new ResponseFrames().push(Buffer.from('{"ok":"true"}\n')),{code:'INVALID_FRAME'});
  assert.throws(()=>new ResponseFrames().push(Buffer.from('{"ok":true,"bytes":"gefälscht"}\n')),{code:'INVALID_FRAME'});
  assert.throws(()=>new ResponseFrames().push(Buffer.alloc(2*1024*1024+1,65)),{code:'INVALID_FRAME'});
});
