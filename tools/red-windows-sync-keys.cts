'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {createHash,randomBytes,timingSafeEqual}=require('node:crypto');
const apps=new Set(['red-ion','red-fit','red-poly','red-bit','red-loop','red-efz','red-kurd','red-uhr','red-yt','stran','babat-red']);
const purposes=new Set(['sync','file','localSync']);
type Scope={origin:string;owner:string;app:string;purpose:string};
type SafeStorage={isEncryptionAvailable():boolean;encryptString(value:string):Buffer;decryptString(value:Buffer):string};
function account(scope:Scope){
 const {origin,owner,app,purpose}=scope;
 const url=new URL(origin);
 if(url.protocol!=='https:'||url.origin!==origin||typeof owner!=='string'||!owner.length||owner.length>128||!apps.has(app)||!purposes.has(purpose))throw Error('Invalid sync key scope');
 return createHash('sha256').update(JSON.stringify(['red-windows-sync-key-v1',origin,owner,app,purpose])).digest('hex');
}
/** Isolated main-process pilot. Call after app.whenReady() on Windows.
 * The directory must be private, trusted and separate from existing profiles.
 * No IPC, automatic creation of keys, rotation or deletion. */
function createWindowsSyncKeyStore(root:string,safeStorage:SafeStorage){
 if(process.platform!=='win32')throw Error('Windows DPAPI required');
 if(!safeStorage?.isEncryptionAvailable())throw Error('Windows secure storage unavailable');
 const stat=fs.lstatSync(root);
 if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Trusted key directory required');
 const dir=fs.realpathSync(root);
 function active(){if(!safeStorage.isEncryptionAvailable())throw Error('Windows secure storage unavailable');}
 function read(id:string):Buffer|null{
  active();
  const target=path.join(dir,id+'.enc');
  let info;
  try{info=fs.lstatSync(target);}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!info.isFile()||info.isSymbolicLink()||info.size<1||info.size>16384)throw Error('Invalid encrypted key file');
  const fd=fs.openSync(target,'r');
  let bytes;
  try{
   const stat=fs.fstatSync(fd);
   if(!stat.isFile()||stat.size!==info.size)throw Error('Key file changed');
   bytes=Buffer.alloc(stat.size);
   let offset=0;while(offset<bytes.length){const n=fs.readSync(fd,bytes,offset,bytes.length-offset,offset);if(!n)throw Error('Incomplete encrypted key');offset+=n;}
  }finally{fs.closeSync(fd);}
  const value=JSON.parse(safeStorage.decryptString(bytes));
  if(value?.version!==1||value.scope!==id||typeof value.key!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(value.key))throw Error('Invalid encrypted key');
  const key=Buffer.from(value.key,'base64url');
  if(key.length!==32||key.toString('base64url')!==value.key){key.fill(0);throw Error('Invalid key encoding');}
  return key;
 }
 return {
  load(scope:Scope){return read(account(scope));},
  install(scope:Scope,key:Uint8Array){
   active();
   if(!(key instanceof Uint8Array)||key.byteLength!==32)throw Error('Invalid key');
   const id=account(scope),existing=read(id),incoming=Buffer.from(key);
   function compare(old:Buffer){try{if(!timingSafeEqual(old,incoming))throw Error('Existing different key');}finally{old.fill(0);}}
   try{
    if(existing){compare(existing);return;}
    const encrypted=safeStorage.encryptString(JSON.stringify({version:1,scope:id,key:incoming.toString('base64url')}));
    if(!Buffer.isBuffer(encrypted)||!encrypted.length||encrypted.length>16384)throw Error('Invalid encrypted key');
    const staging=path.join(dir,'.stage-'+randomBytes(16).toString('hex'));
    const fd=fs.openSync(staging,'wx',0o600);
    try{
     try{fs.writeFileSync(fd,encrypted);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
     try{fs.linkSync(staging,path.join(dir,id+'.enc'));}
     catch(e){if(e.code!=='EEXIST')throw e;const old=read(id);if(!old)throw Error('Key file changed');compare(old);}
    }finally{fs.unlinkSync(staging);}
   }finally{incoming.fill(0);}
  }
 };
}
module.exports={createWindowsSyncKeyStore,account};
