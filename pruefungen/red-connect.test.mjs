import test from 'node:test';
import assert from 'node:assert/strict';
import {checkPrivateConnection} from '../deploy/home/connect-check.mjs';
test('private connection probe never sends credentials or follows redirects',async()=>{
 const seen=[];
 const mock=async(url,options)=>{seen.push(url);assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.headers,undefined);return new Response(null,{status:url.endsWith('/api/stand')?200:401});};
 assert.equal((await checkPrivateConnection('https://home.example.test',mock)).ready,true);
 assert.deepEqual(seen,['https://home.example.test/api/stand','https://home.example.test/home/dashboard']);
 await assert.rejects(checkPrivateConnection('http://home.example.test',mock));
 await assert.rejects(checkPrivateConnection('https://home.example.test/path',mock));
 assert.equal((await checkPrivateConnection('https://home.example.test',async()=>new Response(null,{status:200}))).ready,false);
});
