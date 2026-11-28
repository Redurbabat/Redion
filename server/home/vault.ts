import {createCipheriv,createDecipheriv,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const MAGIC=Buffer.from('REDVAULT1');
const MARKER='.red-vault-v1';
const missing=(e:unknown)=>(e as NodeJS.ErrnoException)?.code==='ENOENT';

/** File encryption, not SQLite encryption or end-to-end encryption.
 * Existing plaintext volumes are never silently migrated. */
export async function openVault(root:string,key?:Uint8Array){
  const marker=join(root,MARKER);
  let existing:Buffer|null;
  try{existing=await readFile(marker);}catch(e){if(!missing(e))throw e;existing=null;}
  if(!key){if(existing)throw new Error('Encrypted RED Vault requires its key');return null;}
  if(key.byteLength!==32)throw new Error('RED Vault key must contain exactly 32 random bytes');
  const material=Buffer.from(key);
  const verifier=createHmac('sha256',material).update('redion-vault-key-verifier-v1').digest();
  if(!existing){
    if((await readdir(root)).length!==0)throw new Error('RED Vault refuses automatic conversion of a non-empty plaintext blob directory');
    try{await writeFile(marker,verifier,{flag:'wx',mode:0o600,flush:true});existing=verifier;}
    catch(e){if((e as NodeJS.ErrnoException)?.code!=='EEXIST')throw e;existing=await readFile(marker);}
  }
  if(existing.length!==verifier.length||!timingSafeEqual(existing,verifier))throw new Error('Wrong RED Vault key');
  const aad=(digest:string)=>Buffer.from('redion-vault-blob-v1:'+digest);
  return {
    seal(digest:string,bytes:Uint8Array):Buffer{
      const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',material,nonce);
      cipher.setAAD(aad(digest));
      const encrypted=Buffer.concat([cipher.update(bytes),cipher.final()]);
      return Buffer.concat([MAGIC,nonce,cipher.getAuthTag(),encrypted]);
    },
    open(digest:string,bytes:Uint8Array):Uint8Array{
      const data=Buffer.from(bytes);
      if(data.length<MAGIC.length+28||!data.subarray(0,MAGIC.length).equals(MAGIC))throw new Error('Invalid RED Vault blob');
      const nonce=data.subarray(MAGIC.length,MAGIC.length+12),tag=data.subarray(MAGIC.length+12,MAGIC.length+28);
      const decipher=createDecipheriv('aes-256-gcm',material,nonce);
      decipher.setAAD(aad(digest));decipher.setAuthTag(tag);
      return new Uint8Array(Buffer.concat([decipher.update(data.subarray(MAGIC.length+28)),decipher.final()]));
    }
  };
}
