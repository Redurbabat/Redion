import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {TOOLS,validateCall}=require('../windows/generated/automation-contract.cjs');
const {AutomationBridge}=require('../windows/generated/automation-bridge.cjs');
const sample=(schema:any):any=>{
  if(schema.enum)return schema.enum[0];
  if(schema.type==='object')return Object.fromEntries((schema.required||[]).map((key:string)=>[key,sample(schema.properties[key])]));
  if(schema.type==='array')return Array.from({length:schema.minItems||0},()=>sample(schema.items));
  if(schema.type==='string')return schema.pattern?'test-id':'Test';
  if(schema.type==='boolean')return false;
  if(schema.type==='number'||schema.type==='integer')return schema.minimum??0;
  return null;
};
test('Jedes beworbene Werkzeug hat einen geschlossenen, geprüften Ein- und Ausgabevertrag',()=>{
  assert.ok(TOOLS.length>=35);assert.equal(new Set(TOOLS.map((t:any)=>t.name)).size,TOOLS.length);
  for(const tool of TOOLS){
    const valid=sample(tool.inputSchema);assert.doesNotThrow(()=>validateCall(tool.name,valid),tool.name);
    assert.throws(()=>validateCall(tool.name,{...valid,unexpected:true}),{code:'INVALID_INPUT'},tool.name);
    if(tool.inputSchema.required.length){const invalid={...valid};delete invalid[tool.inputSchema.required[0]];assert.throws(()=>validateCall(tool.name,invalid),{code:'INVALID_INPUT'},tool.name);}
    assert.equal(tool.outputSchema.type,'object');assert.deepEqual(tool.outputSchema.required,['ok']);
    assert.ok(['read','write','critical'].includes(tool.permission));
  }
  assert.throws(()=>validateCall('redion_eval',{}),{code:'UNKNOWN_TOOL'});
  assert.throws(()=>validateCall('redion_create_page',JSON.parse('{"title":"X","__proto__":{"polluted":true}}')),{code:'INVALID_INPUT'});
  assert.throws(()=>validateCall('redion_insert_block',{documentId:'x',block:{type:'text',text:'x'.repeat(13000)}}),{code:'INVALID_INPUT'});
});
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
function pipeClient(pipe:string):Promise<{call:(frame:any)=>Promise<any>;socket:net.Socket}> {
  return new Promise((resolve,reject)=>{
    const socket=net.createConnection(pipe);let buffer='';let reply:((value:any)=>void)|null=null;
    socket.on('error',reject);socket.on('data',chunk=>{buffer+=chunk.toString();const n=buffer.indexOf('\n');if(n<0)return;const value=JSON.parse(buffer.slice(0,n));buffer=buffer.slice(n+1);const callback=reply;reply=null;callback?.(value);});
    socket.once('connect',()=>resolve({socket,call:frame=>new Promise(ok=>{reply=ok;socket.write(JSON.stringify(frame)+'\n');})}));
  });
}
test('Realer lokaler Kanal: standardmässig aus, Authentifizierung, Sitzungen, Widerruf und Einmalbestätigung',async()=>{
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'redion-mcp-contract-'));
  const changes:any[]=[];let confirmations=0;
  const bridge=new AutomationBridge({userData:profile,profile:'test',invoke:async(tool:string,input:any)=>{changes.push({tool,input});return {changed:true};},
    confirm:async()=>{confirmations++;return true;},changed:()=>{},cancel:()=>{},focus:()=>{}});
  const clients:net.Socket[]=[];
  const connect=async()=>{
    const record=JSON.parse(fs.readFileSync(bridge.discovery,'utf8'));
    const client=await pipeClient(record.pipe);clients.push(client.socket);
    return {client,record};
  };
  try {
    await bridge.start();assert.equal(bridge.state().enabled,false);assert.equal(fs.existsSync(bridge.discovery),false);
    await bridge.configure({enabled:true,write:false,allowLaunch:false,scopes:['app','documents']});
    const invalid=await connect();const denied=await invalid.client.call({kind:'hello',protocol:1,client:'Unberechtigt',token:'f'.repeat(64)});
    assert.equal(denied.error.code,'UNAUTHORIZED');assert.equal(confirmations,1,'Falsches Token öffnet keinen Freigabedialog');
    let {client,record}=await connect();
    assert.equal((await client.call({kind:'hello',protocol:1,client:'Pruefclient',token:record.token})).ok,true);
    const request=(tool:string,args:any={})=>client.call({kind:'call',id:crypto.randomUUID(),tool,arguments:args});
    assert.equal((await request('redion_create_page',{title:'Privater Testinhalt'})).error.code,'WRITE_DISABLED');
    assert.equal((await request('redion_get_settings')).error.code,'SCOPE_DENIED');
    await bridge.configure({enabled:true,write:true,allowLaunch:false,scopes:['app','documents']});
    await wait(2100);({client,record}=await connect());
    assert.equal((await client.call({kind:'hello',protocol:1,client:'Pruefclient',token:record.token})).ok,true);
    assert.equal((await request('redion_delete_block',{blockId:'block-one'})).error.code,'CONFIRMATION_REQUIRED');
    const approval=await request('redion_request_confirmation',{tool:'redion_delete_block',arguments:{blockId:'block-one'}});
    const confirmationId=approval.data.confirmationId;
    assert.equal((await request('redion_delete_block',{blockId:'block-two',confirmationId})).error.code,'CONFIRMATION_REQUIRED');
    assert.equal((await request('redion_delete_block',{blockId:'block-one',confirmationId})).ok,true);
    assert.equal((await request('redion_delete_block',{blockId:'block-one',confirmationId})).error.code,'CONFIRMATION_REQUIRED');
    const created=await request('redion_create_page',{title:'Privater Testinhalt'});assert.equal(created.ok,true);
    const logs=await request('redion_get_activity_log');const serialized=JSON.stringify(logs);
    assert.ok(!serialized.includes('Privater Testinhalt'));assert.ok(!serialized.includes(record.token));
    assert.equal((await request('redion_get_operation_status',{operationId:created.operationId})).data.operation.status,'completed');
    await bridge.configure({enabled:false,write:false,allowLaunch:false,scopes:['app']});
    assert.equal(fs.existsSync(bridge.discovery),false);assert.equal(bridge.state().connected,false);
    assert.equal(changes.filter(x=>x.tool==='redion_delete_block').length,1);
  } finally {clients.forEach(s=>s.destroy());await bridge.shutdown();}
});
test('Ein umgeleiteter Automatisierungsordner darf keine fremde Datei verändern oder löschen',async()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'redion-mcp-redirect-'));
  const profile=path.join(root,'profile'),outside=path.join(root,'outside');fs.mkdirSync(profile);fs.mkdirSync(outside);
  const protectedFile=path.join(outside,'connection.json');fs.writeFileSync(protectedFile,'unveraendert');
  fs.symlinkSync(outside,path.join(profile,'automation'),process.platform==='win32'?'junction':'dir');
  const bridge=new AutomationBridge({userData:profile,profile:'test',invoke:async()=>({}),confirm:async()=>true,changed:()=>{},cancel:()=>{},focus:()=>{}});
  await assert.rejects(()=>bridge.configure({enabled:false,write:false,allowLaunch:false,scopes:['app']}),{code:'UNSAFE_DIRECTORY'});
  assert.equal(fs.readFileSync(protectedFile,'utf8'),'unveraendert');
});
