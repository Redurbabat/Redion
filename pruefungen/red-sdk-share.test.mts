import test from 'node:test';
import assert from 'node:assert/strict';
import {createRedPairProof,encodeRedPairRequest,decodeRedPairRequest,encryptRedShare,decryptRedShare,prepareRedShareJson,openRedShareJson,type RedShareAddress} from '../red-sdk/client.mts';
test('pair request contains public challenge only',async()=>{
 const proof=await createRedPairProof(),payload=encodeRedPairRequest('red-fit',proof.challenge);
 assert.deepEqual(decodeRedPairRequest(payload),{app:'red-fit',challenge:proof.challenge});
 assert.ok(!payload.includes(proof.verifier));assert.throws(()=>decodeRedPairRequest('{"app":"unknown"}'));
});
test('share encryption authenticates message context and rejects wrong keys',async()=>{
 const key=crypto.getRandomValues(new Uint8Array(32)),data=new TextEncoder().encode('private');
 const a:RedShareAddress={source:'red-fit',target:'red-ion',channel:'test',id:'1'.repeat(32)};
 const envelope=await encryptRedShare(key,a,data);
 assert.notEqual(envelope,await encryptRedShare(key,a,data));
 assert.deepEqual(await decryptRedShare(key,a,envelope),data);
 await assert.rejects(decryptRedShare(key,{...a,target:'red-poly'},envelope));
 await assert.rejects(decryptRedShare(crypto.getRandomValues(new Uint8Array(32)),a,envelope));
});

test('JSON share helper encrypts and validates before application import',async()=>{
 const key=crypto.getRandomValues(new Uint8Array(32));
 const p=await prepareRedShareJson(key,'red-poly','red-ion','progress',{completed:5});
 const message={source:p.address.source,channel:p.address.channel,id:p.address.id,envelope:p.envelope,expires:Date.now()+60000};
 const validate=(v:unknown)=>{if(!v||typeof v!=='object'||typeof (v as {completed?:unknown}).completed!=='number')throw Error('Invalid progress');return v as {completed:number};};
 assert.deepEqual(await openRedShareJson(key,'red-ion',message,validate),{completed:5});
 await assert.rejects(openRedShareJson(key,'red-fit',message,validate));
 await assert.rejects(openRedShareJson(key,'red-ion',{...message,expires:0},validate));
 await assert.rejects(openRedShareJson(key,'red-ion',message,()=>{throw Error('Invalid schema');}));
});

test('cross-platform AES-GCM fixture',async()=>{
 const key=Uint8Array.from({length:32},(_,i)=>i);
 const address:RedShareAddress={source:'red-poly',target:'red-ion',channel:'progress',id:'ab'.repeat(16)};
 const clear=await decryptRedShare(key,address,'AAECAwQFBgcICQoLPCCgfreWq3TjY626ncscDPe3pQ6LWTwTVReJ4GkMZJA7JdOBAzc9bkALwlMYEGiQhNYF2Q');
 assert.equal(new TextDecoder().decode(clear),'{"version":1,"data":{"completed":5}}');
});
