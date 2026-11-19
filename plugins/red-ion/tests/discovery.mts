import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const entry=path.resolve(import.meta.dirname,'../server/dist/index.mjs');
test('Automatische Diagnose erkennt das aktive Profil, explizite Auswahl und Mehrdeutigkeit',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'redion-mcp-discovery-'));
  const make=(name:string,pid:number)=>{
    const folder=path.join(directory,name,'automation');fs.mkdirSync(folder,{recursive:true});
    fs.writeFileSync(path.join(folder,'runtime.json'),JSON.stringify({pid,profile:name==='Redion'?'production':'development',bridgeVersion:'0.2.0'}));
  };
  const diagnose=(profile='auto')=>{
    const env:NodeJS.ProcessEnv={...process.env,APPDATA:directory,REDION_MCP_PROFILE:profile};delete env.REDION_MCP_DISCOVERY;
    const result=spawnSync(process.execPath,[entry,'--diagnose'],{env,encoding:'utf8',timeout:10000});
    assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
  };
  make('Redion-Entwicklung',process.pid);
  const development=diagnose();assert.equal(development.running,true);assert.equal(development.profile,'development');
  assert.equal(development.status,'CONNECTION_DISABLED','Aktiver Prozess bedeutet keine automatische Freigabe');
  assert.equal(diagnose('production').running,false,'Explizite Auswahl wird nie still umgebogen');
  make('Redion',process.pid);assert.equal(diagnose().status,'AMBIGUOUS_PROFILE');
  assert.equal(diagnose('production').profile,'production');
  make('Redion',2147483647);assert.equal(diagnose().profile,'development','Ein toter Prozess ist kein aktives Profil');
});
