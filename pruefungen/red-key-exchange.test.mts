import test from 'node:test';
import assert from 'node:assert/strict';
import {createScopedRedStore,createRedShareKeyExchange,encryptRedShare,decryptRedShare,type RedShareKeyContext,type RedSession} from '../red-sdk/client.mts';
test('key exchange binds context and requires identical fingerprint before deriving a key',async()=>{
 const context:RedShareKeyContext={origin:'https://home.example.test',owner:'owner-1',source:'red-fit',target:'red-poly',channel:'workout'};
 const a=await createRedShareKeyExchange(context,'source'),b=await createRedShareKeyExchange(context,'target');
 assert.ok(!JSON.stringify(a.offer).includes('privateKey'));
 await assert.rejects(a.compare({...b.offer,context:{...context,channel:'wrong'}}));
 const [x,y]=await Promise.all([a.compare(b.offer),b.compare(a.offer)]);
 assert.equal(x.fingerprint,y.fingerprint);
 await assert.rejects(x.confirm('0000-0000-0000-0000-0000-0000-0000-0000'));
 const [ka,kb]=await Promise.all([x.confirm(y.fingerprint),y.confirm(x.fingerprint)]);
 assert.deepEqual(ka,kb);await assert.rejects(x.confirm(y.fingerprint));
 const addr={source:context.source,target:context.target,channel:context.channel,id:'a'.repeat(32)};
 const data=new TextEncoder().encode('private');
 assert.deepEqual(await decryptRedShare(kb,addr,await encryptRedShare(ka,addr,data)),data);
});
test('native store scopes credentials by exact origin and app',async()=>{
 const values=new Map<string,string>();const bridge={async get(k:string){return values.get(k)??null;},async set(k:string,v:string){values.set(k,v);},async remove(k:string){values.delete(k);}};
 const a=await createScopedRedStore('https://a.example.test','red-fit',bridge);
 const b=await createScopedRedStore('https://b.example.test','red-fit',bridge);
 const c=await createScopedRedStore('https://a.example.test','red-poly',bridge);
 const session:RedSession={version:2,app:'red-fit',accessToken:'redat_'+'1'.repeat(64),refreshToken:'redrt_'+'2'.repeat(64),expiresAt:new Date().toISOString(),refreshExpiresAt:new Date().toISOString(),scopes:['identity:read']};
 await a.save(session);assert.deepEqual(await a.load(),session);assert.equal(await b.load(),null);assert.equal(await c.load(),null);
 await assert.rejects(c.save(session));await a.clear();assert.equal(await a.load(),null);
});
