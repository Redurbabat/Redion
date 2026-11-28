import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,readdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {validateTimeline,renderVideoPreview} from '../tools/red-video-preview.mts';
import {inspectDeveloper,supportedNode} from '../tools/red-developer-check.mts';
import {createDiskDownloadSink} from '../tools/red-file-disk-sink.mts';
import {createRedFiles,RED_FILE_CHUNK_BYTES,type RedStoreRecord,type RedStoreWrite} from '../red-sdk/client.mts';

test('Timeline: begrenzte Dauer, escaped Inhalte, keine eingebetteten Nutzerskripte',()=>{
 const t={version:1,title:'<script>alert(1)</script>',scenes:[{title:'Ohm',body:'U = R × I & <b>Text</b>',seconds:5}]};
 assert.equal(validateTimeline(t).scenes[0]?.seconds,5);
 const html=renderVideoPreview(t);
 assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert.ok(!html.includes('<script>alert(1)'));
 assert.ok(html.includes('&amp; &lt;b&gt;'));assert.ok(html.includes('Content-Security-Policy'));
 assert.throws(()=>validateTimeline({...t,scenes:[{...t.scenes[0],seconds:0}]}));
 assert.throws(()=>validateTimeline({...t,scenes:Array.from({length:21},()=>({title:'x',body:'y',seconds:60}))}));
 assert.throws(()=>validateTimeline({...t,script:'alert(1)'}));
});
test('Developer-Diagnose meldet fehlenden Bestand, erfindet keine CI oder Builds',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'red-dev-'));
 try{await writeFile(join(dir,'package.json'),'{"version":"1.2.3"}');const result=await inspectDeveloper(dir,'24.0.0');
 assert.equal(result.appVersion,'1.2.3');assert.equal(result.readyForSourceInspection,false);
 assert.equal(result.ciVerified,false);assert.equal(result.buildVerified,false);assert.equal(result.deviceVerified,false);
 assert.ok(supportedNode('22.18.0'));assert.ok(!supportedNode('22.17.9'));assert.ok(!supportedNode('garbage'));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('Disk-Sink publiziert erst nach vollständigem Export und überschreibt niemals',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'red-sink-')),dest=join(dir,'export.bin');
 try{
  const sink=createDiskDownloadSink(dest);
  await sink.begin({name:'ignored',size:3});await sink.write(new Uint8Array([1,2]),0);
  await assert.rejects(readFile(dest));await assert.rejects(sink.commit());
  await sink.write(new Uint8Array([3]),2);await sink.commit();
  assert.deepEqual(await readFile(dest),Buffer.from([1,2,3]));assert.deepEqual(await readdir(dir),['export.bin']);
  const collision=createDiskDownloadSink(dest);await collision.begin({name:'ignored',size:1});await collision.write(new Uint8Array([9]),0);
  await assert.rejects(collision.commit());await collision.abort();assert.deepEqual(await readFile(dest),Buffer.from([1,2,3]));
  const failed=createDiskDownloadSink(join(dir,'never.bin'));await failed.begin({name:'ignored',size:2});
  await assert.rejects(failed.write(new Uint8Array([1]),1));await failed.abort();assert.deepEqual(await readdir(dir),['export.bin']);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('Encrypted SDK file download to disk: authenticated bytes, zero length and corruption rollback',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'red-encrypted-sink-'));
 const records=new Map<string,RedStoreRecord>();
 const transport={async storePut(w:RedStoreWrite){records.set(w.id,{version:1,id:w.id,revision:1,deleted:0,envelope:w.envelope,updated:1});return {version:1 as const,id:w.id,revision:1,deleted:0 as const};},async storeGet(_kind:'file'|'sync',id:string){const r=records.get(id);if(!r)throw Error('missing');return r;}};
 const scope={origin:'https://home.example.test',owner:'owner',app:'red-fit'} as const;
 const key=new Uint8Array(32).fill(4),files=createRedFiles(transport,scope,key);
 try{
  const bytes=new Uint8Array(RED_FILE_CHUNK_BYTES*2+5);for(let i=0;i<bytes.length;i++)bytes[i]=i%251;
  const plan=await files.prepare('test.bin',bytes);await files.upload(plan);
  const dest=join(dir,'export.bin');await files.downloadTo(plan.id,createDiskDownloadSink(dest));assert.deepEqual(await readFile(dest),Buffer.from(bytes));
  const empty=await files.prepare('empty.bin',new Uint8Array());await files.upload(empty);await files.downloadTo(empty.id,createDiskDownloadSink(join(dir,'empty.bin')));assert.equal((await readFile(join(dir,'empty.bin'))).length,0);
  const id=plan.chunks[1]!.id,record=records.get(id)!;
  records.set(id,{...record,envelope:(record.envelope[0]==='A'?'B':'A')+record.envelope.slice(1)});
  await assert.rejects(files.downloadTo(plan.id,createDiskDownloadSink(join(dir,'broken.bin'))));
  assert.deepEqual((await readdir(dir)).sort(),['empty.bin','export.bin']);
 }finally{files.dispose();key.fill(0);await rm(dir,{recursive:true,force:true});}
});
