import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {prepareRedClipboard,openRedClipboard,receiveRedClipboard,prepareRedShareJson,RED_CLIPBOARD_MAX_BYTES,RED_CLIPBOARD_TTL_MS,type RedPreparedShare,type RedShareMessage} from '../red-sdk/client.mts';
const key=()=>new Uint8Array(randomBytes(32));
const message=(p:RedPreparedShare,expires=Date.now()+60_000):RedShareMessage=>({source:p.address.source,channel:p.address.channel,id:p.address.id,envelope:p.envelope,expires});
test('explicit clipboard text is encrypted and bounded by sender, channel and target',async()=>{
 const k=key(),secret='Prüfung 🔒';
 const p=await prepareRedClipboard(k,'red-ion','red-fit',secret);
 assert.equal(p.address.channel,'clipboard');assert.ok(!p.envelope.includes(secret));
 const m=message(p),decoded=await openRedClipboard(k,'red-ion','red-fit',m);
 assert.equal(decoded.text,secret);assert.equal(decoded.expiresAt-decoded.createdAt,RED_CLIPBOARD_TTL_MS);
 await assert.rejects(openRedClipboard(k,'red-poly','red-fit',m));
 await assert.rejects(openRedClipboard(k,'red-ion','red-poly',m));
 await assert.rejects(openRedClipboard(k,'red-ion','red-fit',{...m,channel:'other'}));
 await assert.rejects(openRedClipboard(k,'red-ion','red-fit',{...m,id:'0'.repeat(32)}));
 await assert.rejects(openRedClipboard(key(),'red-ion','red-fit',m));
 await assert.rejects(openRedClipboard(k,'red-ion','red-fit',{...m,expires:Date.now()-1}));
});
test('clipboard rejects invalid UTF-8 byte size and invalid authenticated payloads',async()=>{
 const k=key();
 for(const text of ['', 'x'.repeat(RED_CLIPBOARD_MAX_BYTES+1),'🔒'.repeat(RED_CLIPBOARD_MAX_BYTES/4+1)])await assert.rejects(prepareRedClipboard(k,'red-ion','red-fit',text));
 await prepareRedClipboard(k,'red-ion','red-fit','🔒'.repeat(RED_CLIPBOARD_MAX_BYTES/4));
 const now=Date.now();
 for(const data of [
  {version:1,text:'x',createdAt:now-RED_CLIPBOARD_TTL_MS-1000,expiresAt:now-1000},
  {version:1,text:'x',createdAt:now+60_000,expiresAt:now+60_000+RED_CLIPBOARD_TTL_MS},
  {version:1,text:'x',createdAt:now,expiresAt:now+RED_CLIPBOARD_TTL_MS+1},
  {version:1,text:'x',createdAt:now,expiresAt:now+RED_CLIPBOARD_TTL_MS,extra:true},
  {version:1,text:'x'.repeat(RED_CLIPBOARD_MAX_BYTES+1),createdAt:now,expiresAt:now+RED_CLIPBOARD_TTL_MS}
 ]){
  const p=await prepareRedShareJson(k,'red-ion','red-fit','clipboard',data);
  await assert.rejects(openRedClipboard(k,'red-ion','red-fit',message(p)));
 }
});

test('clipboard receive authenticates before durable commit and ACK; retry is idempotent',async()=>{
 const k=key(),p=await prepareRedClipboard(k,'red-ion','red-fit','private clipboard'),m=message(p);
 const stored=new Map<string,RedShareMessage>();
 let commits=0,acks=0,failCommit=true,failAck=true;
 const inbox={async commitOnce(address:{id:string},encrypted:RedShareMessage,expiresAt:number){
  commits++;assert.ok(expiresAt>Date.now());assert.ok(!JSON.stringify(encrypted).includes('private clipboard'));
  if(failCommit)throw Error('disk unavailable');
  if(stored.has(address.id))return 'duplicate' as const;
  stored.set(address.id,encrypted);return 'stored' as const;
 }};
 const transport={async shareAck(source:string,channel:string,id:string){
  acks++;assert.equal(source,'red-ion');assert.equal(channel,'clipboard');assert.equal(id,m.id);assert.ok(stored.has(id));
  if(failAck)throw Error('network unavailable');
 }};
 const receive=(value=m)=>receiveRedClipboard(k,'red-ion','red-fit',value,inbox,transport);
 await assert.rejects(receive({...m,id:'0'.repeat(32)}));assert.equal(commits,0);assert.equal(acks,0);
 await assert.rejects(receive());assert.equal(acks,0);assert.equal(stored.size,0);
 failCommit=false;await assert.rejects(receive());assert.equal(stored.size,1);assert.equal(acks,1);
 failAck=false;assert.equal(await receive(),'duplicate');assert.equal(stored.size,1);assert.equal(acks,2);
});
