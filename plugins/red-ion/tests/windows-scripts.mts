import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

const root=path.resolve(import.meta.dirname,'../../..');
const packaged=path.join(root,'build/red-ion-plugin');
const powershell=path.join(process.env.SystemRoot||'C:/Windows','System32/WindowsPowerShell/v1.0/powershell.exe');
const scratch=path.join(root,'build/mcp-install-test',crypto.randomBytes(16).toString('hex'));
const run=(script:string,args:string[]=[])=>spawnSync(powershell,['-NoProfile','-ExecutionPolicy','Bypass','-File',script,...args],{encoding:'utf8',timeout:30000});

test('Geliefertes Paket unter Windows PowerShell 5.1 installieren; verknüpftes Update ablehnen', {skip:process.platform!=='win32'},()=>{
  const destination=path.join(scratch,'MCP Ä mit Leerzeichen');
  const installed=run(path.join(packaged,'Install.ps1'),['-Target',destination]);
  assert.equal(installed.status,0,installed.stderr);
  assert.deepEqual(fs.readFileSync(path.join(destination,'server/dist/index.mjs')),fs.readFileSync(path.join(packaged,'server/dist/index.mjs')));
  for(const name of ['Install.ps1','Start-MCP.ps1','Start-Tunnel.ps1','Diagnose.ps1'])
    assert.equal(fs.readFileSync(path.join(destination,name)).subarray(0,3).toString('hex'),'efbbbf','Deutscher Text ist auch unter PowerShell 5.1 UTF-8');
  const diagnosis=run(path.join(destination,'Diagnose.ps1'));
  assert.equal(diagnosis.status,0,diagnosis.stderr);assert.match(diagnosis.stdout,/ChatGPTVerified\s*:\s*False/);
  const hostile=path.join(scratch,'verknüpftes Update'),foreign=path.join(scratch,'fremde Testdateien');
  fs.mkdirSync(hostile,{recursive:true});fs.mkdirSync(path.join(foreign,'dist'),{recursive:true});
  const sentinel=path.join(foreign,'dist/index.mjs');fs.writeFileSync(sentinel,'unveränderte synthetische Fremddatei');
  fs.symlinkSync(foreign,path.join(hostile,'server'),'junction');
  const rejected=run(path.join(packaged,'Install.ps1'),['-Target',hostile,'-Update']);
  assert.notEqual(rejected.status,0,'Verknüpfung muss vor der ersten Kopie abgewiesen werden');
  assert.equal(fs.readFileSync(sentinel,'utf8'),'unveränderte synthetische Fremddatei');
  assert.equal(fs.existsSync(path.join(hostile,'plugin.json')),false);
});

test('Echter SDK-Client erreicht 46 Werkzeuge über das gelieferte PowerShell-Startskript', {skip:process.platform!=='win32'},async()=>{
  const env=Object.fromEntries(Object.entries(process.env).filter((item):item is [string,string]=>item[1]!==undefined));
  env.REDION_MCP_DISCOVERY=path.join(scratch,'nicht vorhandenes Testprofil/automation/connection.json');
  const transport=new StdioClientTransport({command:powershell,args:['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(packaged,'Start-MCP.ps1')],env,stderr:'pipe'});
  const client=new Client({name:'RED Ion Windows-Skriptprüfung',version:'0.1.0'});
  try {
    await client.connect(transport);assert.equal((await client.listTools()).tools.length,46);
    const response=await client.callTool({name:'redion_get_status',arguments:{}});
    const result=response.structuredContent as {ok?:boolean;data?:Record<string,unknown>};
    assert.equal(result?.ok,true);
    assert.equal(result.data?.running,false,'Kein echtes Nutzerprofil lesen oder starten');
  }finally{await client.close();}
});

test('Geschlossene App respektiert ausgeschaltete Verbindung und entzogene App-Freigabe', {skip:process.platform!=='win32'},async()=>{
  const directory=path.join(scratch,'Startfreigabe');fs.mkdirSync(directory,{recursive:true});
  fs.writeFileSync(path.join(directory,'launcher.json'),JSON.stringify({protocol:1,allowed:true,executable:path.join(directory,'nicht-vorhanden.exe'),sha256:'synthetisch'}));
  const env=Object.fromEntries(Object.entries(process.env).filter((item):item is [string,string]=>item[1]!==undefined));
  env.REDION_MCP_DISCOVERY=path.join(directory,'connection.json');
  const transport=new StdioClientTransport({command:process.execPath,args:[path.join(packaged,'server/dist/index.mjs')],env,stderr:'pipe'});
  const client=new Client({name:'RED Ion Widerrufprüfung',version:'0.1.0'});
  try {
    await client.connect(transport);
    for(const policy of [{enabled:false,allowLaunch:true,scopes:['app']},{enabled:true,allowLaunch:true,scopes:['documents']}]) {
      fs.writeFileSync(path.join(directory,'policy.json'),JSON.stringify(policy));
      const response=await client.callTool({name:'redion_launch_app',arguments:{allowLaunch:true}});
      const result=response.structuredContent as {ok?:boolean;error?:{code:string}};
      assert.equal(result.ok,false);assert.equal(result.error?.code,'LAUNCH_DISABLED','Widerruf muss vor Zugriff auf die EXE wirken');
    }
  } finally {await client.close();}
});
