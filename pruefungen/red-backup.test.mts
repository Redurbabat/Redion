import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,readFile,writeFile,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {openHomeServer} from '../server/home-server.ts';
import {createOfflineBackup,restoreOfflineBackup} from '../server/home/backup.ts';

test('Encrypted offline backup restores SQLite and blobs, rejects tampering and never overwrites',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-backup-'));
 const source=join(root,'source'),dest=join(root,'backup'),restored=join(root,'restored'),bad=join(root,'bad'),key=randomBytes(32);
 try{
  await mkdir(source);
  const original=await openHomeServer({dataDir:source,origin:'https://redion.example.test'});
  try{await original.store.ablage.setze('konten',{id:'backup-owner',gesperrt:0});await original.blobs.lege('sample',new TextEncoder().encode('private backup attachment'));}
  finally{original.close();}
  const result=await createOfflineBackup(source,dest,key);assert.equal(result.files,2);
  assert.ok(!(await readFile(join(dest,'000001.enc'))).includes(Buffer.from('private backup attachment')));
  await assert.rejects(createOfflineBackup(source,dest,key));
  await assert.rejects(restoreOfflineBackup(dest,bad,randomBytes(32)));await assert.rejects(access(bad));
  await restoreOfflineBackup(dest,restored,key);
  const copy=await openHomeServer({dataDir:restored,origin:'https://redion.example.test'});
  try{assert.equal((await copy.store.ablage.hole('konten',{id:'backup-owner'}))?.id,'backup-owner');assert.equal(new TextDecoder().decode(await copy.blobs.hole('sample')??new Uint8Array()),'private backup attachment');}
  finally{copy.close();}
  await assert.rejects(restoreOfflineBackup(dest,restored,key));
  const encrypted=await readFile(join(dest,'000001.enc'));encrypted[0]=encrypted[0]!^1;await writeFile(join(dest,'000001.enc'),encrypted);
  await assert.rejects(restoreOfflineBackup(dest,bad,key));await assert.rejects(access(bad));
 }finally{await rm(root,{recursive:true,force:true});}
});
