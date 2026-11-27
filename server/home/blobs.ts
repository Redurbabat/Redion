import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import type {Blobs} from '../typen.ts';

/** Hash logical identifiers so user input cannot escape the storage root.
 * Atomic same-directory replacement avoids partially published chunks. */
export async function openHomeBlobs(directory:string):Promise<Blobs>{
  const root=resolve(directory);
  await mkdir(root,{recursive:true,mode:0o700});
  const file=(key:string)=>{
    if(!key||key.length>512)throw new Error('Invalid blob key');
    return join(root,createHash('sha256').update(key).digest('hex'));
  };
  const missing=(error:unknown)=> (error as NodeJS.ErrnoException)?.code==='ENOENT';
  return {
    art:'filesystem',
    async lege(key,bytes){
      const target=file(key),temp=target+'.'+randomUUID()+'.tmp';
      try {await writeFile(temp,bytes,{flag:'wx',mode:0o600,flush:true});await rename(temp,target);}
      finally {await unlink(temp).catch(error=>{if(!missing(error))throw error;});}
    },
    async hole(key){try{return new Uint8Array(await readFile(file(key)));}catch(error){if(missing(error))return null;throw error;}},
    async weg(key){try{await unlink(file(key));return true;}catch(error){if(missing(error))return false;throw error;}}
  };
}
