import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {mcpStateD1,type McpDatabase} from '../server/mcp/state.ts';
const fixture=()=>{
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync(new URL('../server/mcp/schema.sql',import.meta.url),'utf8'));
  const database:McpDatabase={prepare(sql){let values:(string|number)[]=[];const params=()=>Object.fromEntries(values.map((value,index)=>['?'+(index+1),value]));return {bind(...next){values=next;return this;},async first<T>(){return (sqlite.prepare(sql).get(params()) as T|undefined)??null;},async all<T>(){return {results:sqlite.prepare(sql).all(params()) as T[]};}};}};
  let time=100;return {state:mcpStateD1(database,()=>time),tick:(next:number)=>{time=next;},close:()=>sqlite.close()};
};
test('Cloud-Anmeldecode wird bei paralleler Verwendung exakt einmal atomar verbraucht',async()=>{
  const f=fixture();try{
    assert.equal(await f.state.create('code:random','code',{client:'a'},500),true);
    const row=(await f.state.read<{client:string}>('code:random'))!;
    assert.equal(row.data.client,'a');
    assert.deepEqual((await Promise.all(Array.from({length:20},()=>f.state.consume(row)))).filter(Boolean),[true]);
    assert.equal(await f.state.read('code:random'),null);
  }finally{f.close();}
});
test('Veraltete Freigaben überschreiben keinen Widerruf; Ablauf gilt auch bei Änderungen',async()=>{
  const f=fixture();try{
    await f.state.create('grant:random','grant',{revoked:false},500);
    const before=(await f.state.read<{revoked:boolean}>('grant:random'))!;
    assert.equal(await f.state.replace(before,{revoked:true}),true);
    assert.equal(await f.state.replace(before,{revoked:false}),false);
    assert.equal((await f.state.read<{revoked:boolean}>('grant:random'))!.data.revoked,true);
    f.tick(500);assert.equal(await f.state.read('grant:random'),null);
    assert.equal(await f.state.consume(before),false);
    assert.equal(await f.state.replace(before,{revoked:false}),false);
  }finally{f.close();}
});
test('MCP-Zustand ist begrenzt, getrennt von Dokumenten und schützt atomare Neuanlage',async()=>{
  const f=fixture();try{
    assert.equal(await f.state.create('client:first','client',{name:'One'},500),true);
    assert.equal(await f.state.create('client:first','client',{name:'Overwrite'},500),false);
    await f.state.create('grant:first','grant',{client:'first'},500);
    assert.equal((await f.state.list('client')).length,1);
    await assert.rejects(()=>f.state.create('client:bad','client',{text:'x'.repeat(17000)},500));
    await assert.rejects(()=>f.state.create('client:unicode','client',{text:'字'.repeat(6000)},500));
    await assert.rejects(()=>f.state.read('saetze; DROP TABLE saetze'));
    assert.equal((await f.state.read<{name:string}>('client:first'))!.data.name,'One');
  }finally{f.close();}
});
test('Abgelaufene Zustände werden begrenzt gelöscht; alte Handles ändern keine spätere Neuanlage',async()=>{
  const f=fixture();try{
    await f.state.create('grant:reused','grant',{value:'old'},500);
    const old=(await f.state.read('grant:reused'))!;
    await f.state.create('client:expired','client',{},500);
    f.tick(600);assert.equal(await f.state.prune(1),1);
    assert.equal(await f.state.create('grant:reused','grant',{value:'new'},900),true);
    assert.equal(await f.state.consume(old),false);assert.equal(await f.state.replace(old,{value:'bad'}),false);
    assert.equal((await f.state.read<{value:string}>('grant:reused'))!.data.value,'new');
    assert.equal(await f.state.prune(100),1);
    await assert.rejects(()=>f.state.create('client:past','client',{},500));
  }finally{f.close();}
});
