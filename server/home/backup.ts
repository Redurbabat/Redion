import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {mkdir,readFile,readdir,lstat,realpath,writeFile,rm} from 'node:fs/promises';
import {dirname,join,resolve,relative,isAbsolute} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {DatabaseSync} from 'node:sqlite';
import {pathToFileURL} from 'node:url';

const MAGIC=Buffer.from('REDBACKUP1');
const MAX_ENTRIES=200000,MAX_MANIFEST=64*1024*1024;
type Entry={path:string;file:string;nonce:string;tag:string;size:number};
type Manifest={version:1;id:string;createdAt:string;entries:Entry[]};
const validPath=(p:unknown):p is string=>typeof p==='string'&&(p==='redion.sqlite'||/^blobs\/(?:[a-f0-9]{64}|\.red-vault-v1)$/.test(p));
const validHex=(v:unknown,len:number):v is string=>typeof v==='string'&&v.length===len&&/^[a-f0-9]+$/.test(v);
const keyBytes=(key:Uint8Array)=>{if(key.byteLength!==32)throw Error('Backup key must contain 32 random bytes');return Buffer.from(key);};
const aad=(id:string,path:string)=>Buffer.from('redion-backup-v1:'+id+':'+path);
const nested=(root:string,target:string)=>{const rel=relative(root,target);return rel===''||(!rel.startsWith('..')&&!isAbsolute(rel));};
async function regular(path:string){
  const st=await lstat(path);if(!st.isFile()||st.isSymbolicLink())throw Error('Backup requires regular files');return st;
}
async function fresh(source:string,destination:string){
  const root=await realpath(source),target=join(await realpath(dirname(resolve(destination))),resolve(destination).split(/[\\/]/).pop()!);
  if(nested(root,target)||nested(target,root))throw Error('Source and destination must be separate');
  await mkdir(target,{mode:0o700}); // Exclusive: existing destination is never overwritten.
  return {root,target};
}
function checkDatabase(path:string,checkpoint:boolean){
  const db=new DatabaseSync(path,{readOnly:!checkpoint});
  try{
    db.exec('PRAGMA busy_timeout=5000;');
    if(checkpoint){const result=db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get();if(Number(result?.busy)!==0)throw Error('Database busy; stop the service first');}
    const checks=db.prepare('PRAGMA quick_check').all();if(checks.length!==1||checks[0]?.quick_check!=='ok')throw Error('SQLite integrity check failed');
  }finally{db.close();}
}
async function assertNoWal(path:string){
  try{if((await lstat(path+'-wal')).size!==0)throw Error('WAL still contains data; stop all database writers');}
  catch(e){if((e as NodeJS.ErrnoException)?.code!=='ENOENT')throw e;}
}
function sealManifest(manifest:Manifest,key:Buffer){
  const plain=Buffer.from(JSON.stringify(manifest));if(plain.length>MAX_MANIFEST)throw Error('Backup manifest too large');
  const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(MAGIC);
  const ciphertext=Buffer.concat([cipher.update(plain),cipher.final()]);return Buffer.concat([MAGIC,nonce,cipher.getAuthTag(),ciphertext]);
}
function openManifest(raw:Buffer,key:Buffer):Manifest{
  if(raw.length<MAGIC.length+28||raw.length>MAX_MANIFEST+MAGIC.length+28||!raw.subarray(0,MAGIC.length).equals(MAGIC))throw Error('Invalid backup manifest');
  const d=createDecipheriv('aes-256-gcm',key,raw.subarray(MAGIC.length,MAGIC.length+12));d.setAAD(MAGIC);d.setAuthTag(raw.subarray(MAGIC.length+12,MAGIC.length+28));
  const data=JSON.parse(Buffer.concat([d.update(raw.subarray(MAGIC.length+28)),d.final()]).toString('utf8')) as Manifest;
  if(data.version!==1||!validHex(data.id,32)||!Number.isFinite(Date.parse(data.createdAt))||!Array.isArray(data.entries)||data.entries.length<1||data.entries.length>MAX_ENTRIES)throw Error('Invalid backup manifest');
  const seen=new Set<string>();
  for(const [i,e] of data.entries.entries()){
    if(!validPath(e.path)||seen.has(e.path)||e.file!==String(i).padStart(6,'0')+'.enc'||!validHex(e.nonce,24)||!validHex(e.tag,32)||!Number.isSafeInteger(e.size)||e.size<0)throw Error('Invalid backup entry');
    seen.add(e.path);
  }
  if(!seen.has('redion.sqlite'))throw Error('Backup is missing SQLite database');return data;
}
/** Caller MUST stop the server and other writers before invoking this offline operation. */
export async function createOfflineBackup(source:string,destination:string,rawKey:Uint8Array){
  const key=keyBytes(rawKey),{root,target}=await fresh(source,destination);
  try{
    const dbPath=join(root,'redion.sqlite');await regular(dbPath);checkDatabase(dbPath,true);await assertNoWal(dbPath);
    const blobDir=join(root,'blobs'),dir=await lstat(blobDir);if(!dir.isDirectory()||dir.isSymbolicLink())throw Error('Invalid blob directory');
    const paths=['redion.sqlite',...(await readdir(blobDir)).sort().map(n=>'blobs/'+n)];
    if(paths.length>MAX_ENTRIES||paths.some(p=>!validPath(p)))throw Error('Unexpected files or unfinished blob writes; inspect offline data');
    const id=randomBytes(16).toString('hex'),entries:Entry[]=[];
    for(const [i,path] of paths.entries()){
      const file=String(i).padStart(6,'0')+'.enc',src=join(root,path),before=await regular(src),nonce=randomBytes(12);
      const cipher=createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(aad(id,path));
      await pipeline(createReadStream(src),cipher,createWriteStream(join(target,file),{flags:'wx',mode:0o600,flush:true}));
      const after=await regular(src);if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ino!==after.ino)throw Error('Source changed during backup');
      entries.push({path,file,nonce:nonce.toString('hex'),tag:cipher.getAuthTag().toString('hex'),size:before.size});
    }
    await assertNoWal(dbPath);
    const manifest:Manifest={version:1,id,createdAt:new Date().toISOString(),entries};
    // The authenticated manifest is written last. An interrupted directory is not a valid backup.
    await writeFile(join(target,'manifest.enc'),sealManifest(manifest,key),{flag:'wx',mode:0o600,flush:true});
    return {id,files:entries.length};
  }catch(e){await rm(target,{recursive:true,force:true});throw e;}
}
export async function restoreOfflineBackup(source:string,destination:string,rawKey:Uint8Array){
  const key=keyBytes(rawKey),root=await realpath(source),manifestPath=join(root,'manifest.enc'),st=await regular(manifestPath);
  if(st.size>MAX_MANIFEST+MAGIC.length+28)throw Error('Manifest too large');
  const manifest=openManifest(await readFile(manifestPath),key);
  const {target}=await fresh(root,destination);
  try{
    await mkdir(join(target,'blobs'),{mode:0o700});
    for(const e of manifest.entries){
      const src=join(root,e.file),st=await regular(src);if(st.size!==e.size)throw Error('Backup entry size mismatch');
      const d=createDecipheriv('aes-256-gcm',key,Buffer.from(e.nonce,'hex'));d.setAAD(aad(manifest.id,e.path));d.setAuthTag(Buffer.from(e.tag,'hex'));
      const dest=join(target,e.path);
      await pipeline(createReadStream(src),d,createWriteStream(dest,{flags:'wx',mode:0o600,flush:true}));
      if((await regular(dest)).size!==e.size)throw Error('Restore size mismatch');
    }
    checkDatabase(join(target,'redion.sqlite'),false);
    return {id:manifest.id,files:manifest.entries.length};
  }catch(e){await rm(target,{recursive:true,force:true});throw e;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  process.umask(0o077);
  const [command,source,destination,keyFile,confirmation]=process.argv.slice(2);
  if(!source||!destination||!keyFile||confirmation!=='--offline-confirmed'||!['create','restore'].includes(command??'')){
    console.error('Usage: backup.ts create|restore SOURCE NEW_DESTINATION KEY_FILE --offline-confirmed');process.exitCode=1;
  }else{
    (async()=>{const key=await readFile(keyFile);const result=await (command==='create'?createOfflineBackup:restoreOfflineBackup)(source,destination,key);console.log(JSON.stringify(result));})().catch(()=>{console.error('RED backup failed; source retained. Check offline status, key, free space and destination.');process.exitCode=1;});
  }
}
