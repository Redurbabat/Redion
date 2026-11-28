import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm,access,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {openHomeServer} from '../server/home-server.ts';
import {createOfflineBackup} from '../server/home/backup.ts';
import {migrateVaultBackup} from '../server/home/vault-migrate.ts';
test('vault migration and re-key work on fresh authenticated backup copies only',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-migrate-')),origin='https://redion.example.test';
 const source=join(root,'original'),backup=join(root,'backup'),target=join(root,'encrypted'),rekey=join(root,'rekey'),backup2=join(root,'backup2');
 const key=randomBytes(32),key2=randomBytes(32),backupKey=randomBytes(32),plain=new TextEncoder().encode('private content');
 const put=async()=>{await mkdir(source);const s=await openHomeServer({dataDir:source,origin});try{await s.blobs.lege('private',plain);}finally{s.close();}};
 const verify=async(dataDir:string,vaultKey:Uint8Array)=>{const s=await openHomeServer({dataDir,origin,vaultKey});try{assert.deepEqual(await s.blobs.hole('private'),plain);}finally{s.close();}};
 try{
  await put();await createOfflineBackup(source,backup,backupKey);
  assert.equal((await migrateVaultBackup(backup,target,backupKey,key)).files,1);
  await verify(target,key);
  const name=createHash('sha256').update('private').digest('hex');
  assert.deepEqual(new Uint8Array(await readFile(join(source,'blobs',name))),plain);
  assert.ok(!(await readFile(join(target,'blobs',name))).includes(Buffer.from(plain)));
  await assert.rejects(migrateVaultBackup(backup,target,backupKey,key));await verify(target,key);
  await createOfflineBackup(target,backup2,backupKey);
  await assert.rejects(migrateVaultBackup(backup2,rekey,backupKey,key2,randomBytes(32)));await assert.rejects(access(rekey));
  await migrateVaultBackup(backup2,rekey,backupKey,key2,key);await verify(rekey,key2);await verify(target,key);
 }finally{await rm(root,{recursive:true,force:true});}
});
