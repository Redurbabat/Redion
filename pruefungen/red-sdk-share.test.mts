import test from 'node:test';
import assert from 'node:assert/strict';
import {createRedPairProof,encodeRedPairRequest,decodeRedPairRequest,encryptRedShare,decryptRedShare,type RedShareAddress} from '../red-sdk/client.mts';
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
