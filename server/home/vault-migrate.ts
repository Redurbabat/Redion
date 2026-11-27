import {mkdir,readdir,readFile,writeFile,rename,rm,lstat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {restoreOfflineBackup} from './backup.ts';
import {openVault} from './vault.ts';

/** Restore an authenticated backup into a new location and optionally re-key
 * the copied blob files. Never touch the live data or source backup. */
export async function migrateVaultBackup(backup:string,destination:string,backupKey:Uint8Array,newVaultKey:Uint8Array,oldVaultKey?:Uint8Array){
 if(newVaultKey.byteLength!==32||oldVaultKey&&oldVaultKey.byteLength!==32)throw Error('Vault keys must be 32 bytes');
 const target=resolve(destination);
 await restoreOfflineBackup(backup,target,backupKey);
 try{
  const source=join(target,'blobs'),staged=join(target,'blobs.encrypted-stage'),previous=join(target,'blobs.previous');
  const old=await openVault(source,oldVaultKey);
  await mkdir(staged,{mode:0o700});
  const vault=await openVault(staged,newVaultKey);
  if(!vault)throw Error('New vault not initialized');
  let count=0;
  for(const name of await readdir(source)){
   if(name==='.red-vault-v1')continue;
   if(!/^[a-f0-9]{64}$/.test(name))throw Error('Invalid source blob');
   const path=join(source,name),stat=await lstat(path);
   if(!stat.isFile()||stat.isSymbolicLink())throw Error('Invalid blob file');
   const raw=await readFile(path),plain=old?old.open(name,raw):raw;
   const sealed=vault.seal(name,plain);
   await writeFile(join(staged,name),sealed,{flag:'wx',mode:0o600,flush:true});
   const checked=vault.open(name,await readFile(join(staged,name)));
   if(!Buffer.from(checked).equals(Buffer.from(plain)))throw Error('Migration verification failed');
   count++;
  }
  await rename(source,previous);
  await rename(staged,source);
  await rm(previous,{recursive:true,force:true});
  return {files:count};
 }catch(e){await rm(target,{recursive:true,force:true});throw e;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 process.umask(0o077);
 const [source,dest,backupKey,newKey,confirm,oldKey]=process.argv.slice(2);
 if(!source||!dest||!backupKey||!newKey||confirm!=='--new-copy'){
  console.error('Usage: vault-migrate.ts BACKUP NEW_DATA_DIR BACKUP_KEY NEW_VAULT_KEY --new-copy [OLD_VAULT_KEY]');process.exitCode=1;
 }else{
  (async()=>console.log(JSON.stringify(await migrateVaultBackup(source,dest,await readFile(backupKey),await readFile(newKey),oldKey?await readFile(oldKey):undefined))))().catch(()=>{console.error('Migration failed; source backup retained.');process.exitCode=1;});
 }
}
