import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {openHomeBlobs} from '../server/home/blobs.ts';
test('RED Vault encrypts chunks, rejects wrong keys and authenticated tampering',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-vault-')),key=randomBytes(32),bytes=new TextEncoder().encode('private attachment bytes');
 try{
  const vault=await openHomeBlobs(root,key);
  await vault.lege('attachment',bytes);await vault.lege('another',bytes);
  const path=join(root,createHash('sha256').update('attachment').digest('hex'));
  const second=join(root,createHash('sha256').update('another').digest('hex'));
  const encoded=await readFile(path);
  assert.ok(!encoded.includes(Buffer.from(bytes)));assert.notDeepEqual(encoded,await readFile(second));
  assert.deepEqual(await (await openHomeBlobs(root,key)).hole('attachment'),bytes);
  await assert.rejects(openHomeBlobs(root));await assert.rejects(openHomeBlobs(root,randomBytes(32)));
  await writeFile(second,encoded);await assert.rejects(vault.hole('another'));
  encoded[encoded.length-1]=encoded[encoded.length-1]!^1;await writeFile(path,encoded);await assert.rejects(vault.hole('attachment'));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('RED Vault will not reinterpret or erase an existing plaintext volume',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-plain-'));
 try{const plain=await openHomeBlobs(root);await plain.lege('existing',new Uint8Array([9]));await assert.rejects(openHomeBlobs(root,randomBytes(32)));assert.deepEqual(await plain.hole('existing'),new Uint8Array([9]));}
 finally{await rm(root,{recursive:true,force:true});}
});
