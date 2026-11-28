import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,readFile,writeFile,access,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {openHomeServer} from '../server/home-server.ts';
import {createOfflineBackup,restoreOfflineBackup,verifyEncryptedBackup,verifyLatestEncryptedBackup,assessBackupAge} from '../server/home/backup.ts';

test('Encrypted offline backup restores SQLite and blobs, rejects tampering and never overwrites',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-backup-'));
 const source=join(root,'source'),dest=join(root,'backup'),restored=join(root,'restored'),bad=join(root,'bad'),key=randomBytes(32);
 try{
  await mkdir(source);
  const original=await openHomeServer({dataDir:source,origin:'https://redion.example.test'});
  try{await original.store.ablage.setze('konten',{id:'backup-owner',gesperrt:0});await original.blobs.lege('sample',new TextEncoder().encode('private backup attachment'));}
  finally{original.close();}
  const result=await createOfflineBackup(source,dest,key);assert.equal(result.files,2);
  const verified=await verifyEncryptedBackup(dest,key);assert.equal(verified.files,2);assert.equal(verified.sqliteIntegrityVerified,false);assert.ok(verified.verifiedBytes>0);
  await assert.rejects(verifyEncryptedBackup(dest,randomBytes(32)));
  assert.ok(!(await readFile(join(dest,'000001.enc'))).includes(Buffer.from('private backup attachment')));
  await assert.rejects(createOfflineBackup(source,dest,key));
  await assert.rejects(restoreOfflineBackup(dest,bad,randomBytes(32)));await assert.rejects(access(bad));
  await restoreOfflineBackup(dest,restored,key);
  const copy=await openHomeServer({dataDir:restored,origin:'https://redion.example.test'});
  try{assert.equal((await copy.store.ablage.hole('konten',{id:'backup-owner'}))?.id,'backup-owner');assert.equal(new TextDecoder().decode(await copy.blobs.hole('sample')??new Uint8Array()),'private backup attachment');}
  finally{copy.close();}
  await assert.rejects(restoreOfflineBackup(dest,restored,key));
  const encrypted=await readFile(join(dest,'000001.enc'));encrypted[0]=encrypted[0]!^1;await writeFile(join(dest,'000001.enc'),encrypted);
  await assert.rejects(verifyEncryptedBackup(dest,key));
  await assert.rejects(restoreOfflineBackup(dest,bad,key));await assert.rejects(access(bad));
 }finally{await rm(root,{recursive:true,force:true});}
});

test('latest backup verification never falls back to an older valid backup',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-backup-latest-')),key=randomBytes(32);
 const source=join(root,'source'),backups=join(root,'backups');
 const older=join(backups,'20260101T000000Z-aaaaaaaa'),newer=join(backups,'20260102T000000Z-bbbbbbbb'),newest=join(backups,'20260103T000000Z-cccccccc');
 try{
  await mkdir(source);await mkdir(backups);
  const s=await openHomeServer({dataDir:source,origin:'https://redion.example.test'});s.close();
  await assert.rejects(verifyLatestEncryptedBackup(backups,key));
  await createOfflineBackup(source,older,key);
  await createOfflineBackup(source,newer,key);
  await mkdir(join(backups,'unrelated'));
  const report=await verifyLatestEncryptedBackup(backups,key);
  assert.equal(report.backupName,'20260102T000000Z-bbbbbbbb');
  assert.equal(report.sqliteIntegrityVerified,false);
  assert.equal(report.freshness.status,'fresh');assert.equal(report.freshness.maxAgeHours,48);
  assert.ok(report.backupAgeMs>=0);assert.ok(Number.isFinite(Date.parse(report.verifiedAt)));
  await assert.rejects(verifyLatestEncryptedBackup(backups,randomBytes(32)));
  await symlink(older,newest,'dir');await assert.rejects(verifyLatestEncryptedBackup(backups,key));await rm(newest);
  await mkdir(newest);await assert.rejects(verifyLatestEncryptedBackup(backups,key));await rm(newest,{recursive:true});
  const bytes=await readFile(join(newer,'000000.enc'));bytes[0]=bytes[0]!^1;await writeFile(join(newer,'000000.enc'),bytes);
  await assert.rejects(verifyLatestEncryptedBackup(backups,key));
  assert.equal((await verifyEncryptedBackup(older,key)).sqliteIntegrityVerified,false);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('Backup freshness distinguishes authenticated old backups from current backups',()=>{
 const hour=3600000;
 assert.deepEqual(assessBackupAge(48*hour),{status:'fresh',maxAgeHours:48});
 assert.deepEqual(assessBackupAge(48*hour+1),{status:'stale',maxAgeHours:48});
 assert.equal(assessBackupAge(2*hour,1).status,'stale');
 for(const x of [0,-1,1.5,NaN,8761])assert.throws(()=>assessBackupAge(0,x));
 for(const x of [-1,NaN,Infinity,0.5])assert.throws(()=>assessBackupAge(x));
});
