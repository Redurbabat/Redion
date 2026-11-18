import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudFixture} from './helfer/mcp-cloud.mts';
import {cloudDatabase} from './helfer/mcp-cloud-database.mts';
import {openCloudRepository,CloudError,type CloudRecord} from '../server/mcp/repository.ts';
import {pkceChallenge} from '../server/mcp/oauth.ts';

const fixture=async(userId='owner')=>{
  const f=cloudFixture(),database=cloudDatabase(f.sqlite);
  f.sqlite.prepare('INSERT INTO konten(id,gesperrt) VALUES(?,0)').run(userId);
  f.sqlite.prepare('INSERT INTO bereiche(id,name,besitzer) VALUES(?,?,?)').run('workspace-one','Synthetic','owner');
  const client=await f.oauth.register({client_name:'Synthetic AI',redirect_uris:['https://ai.example.test/cb']});
  const verifier='z'.repeat(64),args={client_id:client.client_id,redirect_uri:client.redirect_uris[0]!,response_type:'code',resource:'https://mcp.example.test/mcp',
    scope:'redion:read redion:write',code_challenge:await pkceChallenge(verifier),code_challenge_method:'S256'};
  const start=await f.oauth.begin(userId,args);if(start.kind!=='consent')throw 0;
  const approved=await f.oauth.approve(userId,start.requestId,start.csrf,{allow:true,remember:true,workspaceIds:['workspace-one']});
  const tokens=await f.oauth.exchange({grant_type:'authorization_code',client_id:client.client_id,code:new URL(approved.redirect).searchParams.get('code')!,
    resource:args.resource,redirect_uri:args.redirect_uri,code_verifier:verifier});
  const principal=(await f.oauth.authenticate(tokens.access_token))!;
  const seed=(id:string,data:Record<string,unknown>,encrypted=0,workspace='workspace-one'):void=>{
    f.sqlite.prepare('INSERT INTO saetze(id,bereich,tabelle,daten,verschluesselt,seite,version,geaendert,geloescht,vonGeraet) VALUES(?,?,?,?,?,?,1,?,0,?)')
      .run(id,workspace,'blocks',JSON.stringify({id,alive:true,...data}),encrypted,String(data.type==='page'?id:data.parentId??id),new Date(f.now()).toISOString(),'synthetic-device');
  };
  const changed=(row:CloudRecord,patch:Record<string,unknown>):CloudRecord=>({...row,version:row.version+1,
    daten:JSON.stringify({...JSON.parse(row.daten),...patch}),geaendert:new Date(f.now()+1).toISOString(),vonGeraet:'MCP'});
  return {...f,...database,principal,seed,changed,open:()=>openCloudRepository(database.database,principal,f.now)};
};
const code=(expected:string)=>(error:unknown)=>error instanceof CloudError&&error.code===expected;

test('Cloud-Repository verwendet vorhandene saetze; Rechte, Verschlüsselung und Felder bleiben wirksam',async()=>{
  const f=await fixture('guest');try{
    f.seed('page',{type:'page',text:'Shared',content:['child']});f.seed('child',{type:'text',parentId:'page',text:'Hello'});
    f.seed('private',{type:'page',text:'Private',content:[]});f.seed('encrypted',{type:'page',text:'Encrypted'},1);
    f.sqlite.prepare('INSERT INTO freigaben(bereich,seite,kontoId,rolle) VALUES(?,?,?,?)').run('workspace-one','page','guest','edit');
    const r=await f.open();assert.equal((await r.record('page')).data.text,'Shared');
    await assert.rejects(()=>r.record('private'),code('PERMISSION_DENIED'));
    await assert.rejects(()=>r.record('page','other-workspace'),code('PERMISSION_DENIED'));
    f.sqlite.prepare('INSERT INTO freigaben(bereich,seite,kontoId,rolle) VALUES(?,?,?,?)').run('workspace-one','encrypted','guest','lesen');
    const next=await f.open();await assert.rejects(()=>next.record('encrypted'),code('ENCRYPTED_DOCUMENT'));
    assert.equal((await r.children((await r.record('page')).row,(await r.record('page')).data)).length,1);
  }finally{f.close();}
});
test('Cloud-Commit ist bei Konflikt im zweiten Satz vollständig unverändert',async()=>{
  const f=await fixture();try{
    f.seed('page',{type:'page',text:'Before',content:['child']});f.seed('child',{type:'text',text:'Before child',parentId:'page'});
    const r=await f.open(),p=await r.record('page',undefined,true),b=await r.record('child',undefined,true);
    f.beforeNextBatch(()=>f.sqlite.prepare('UPDATE saetze SET daten=? WHERE id=?').run(JSON.stringify({...b.data,text:'Concurrent edit'}),'child'));
    await assert.rejects(()=>r.commit([f.changed(p.row,{text:'After'}),f.changed(b.row,{text:'After child'})],'redion_update_block'),code('STALE_DOCUMENT'));
    assert.equal(JSON.parse(String(f.sqlite.prepare('SELECT daten FROM saetze WHERE id=?').get('page')!.daten)).text,'Before');
    assert.equal(JSON.parse(String(f.sqlite.prepare('SELECT daten FROM saetze WHERE id=?').get('child')!.daten)).text,'Concurrent edit');
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM mcp_commit_guard').get()!.n,0);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM protokoll').get()!.n,0);
  }finally{f.close();}
});
test('Cloud-Commit stoppt bei Widerruf oder Rollenwechsel zwischen Lesen und Speichern',async()=>{
  for(const revoke of ['grant','account','role'] as const){
    const f=await fixture(revoke==='role'?'guest':'owner');try{
      f.seed('page',{type:'page',text:'Before',content:[]});
      if(revoke==='role')f.sqlite.prepare('INSERT INTO freigaben(bereich,seite,kontoId,rolle) VALUES(?,?,?,?)').run('workspace-one','page','guest','edit');
      const r=await f.open(),p=await r.record('page',undefined,true);
      f.beforeNextBatch(()=>{
        if(revoke==='grant')f.sqlite.prepare('UPDATE mcp_state SET revision=revision+1 WHERE key=?').run(f.principal.grantId);
        else if(revoke==='account')f.sqlite.prepare('UPDATE konten SET gesperrt=1 WHERE id=?').run('owner');
        else f.sqlite.prepare('UPDATE freigaben SET rolle=? WHERE kontoId=?').run('lesen','guest');
      });
      await assert.rejects(()=>r.commit([f.changed(p.row,{text:'After'})],'redion_update_page'),code('STALE_DOCUMENT'));
      assert.equal(JSON.parse(String(f.sqlite.prepare('SELECT daten FROM saetze WHERE id=?').get('page')!.daten)).text,'Before');
    }finally{f.close();}
  }
});
test('Erfolgreicher Cloud-Commit erhöht Version und schreibt nur Metadaten ins Protokoll',async()=>{
  const f=await fixture();try{
    f.seed('page',{type:'page',text:'Before',content:[]});const r=await f.open(),p=await r.record('page',undefined,true);
    await r.commit([f.changed(p.row,{text:'After <>& Ü😀'})],'redion_update_page');
    const stored=f.sqlite.prepare('SELECT * FROM saetze WHERE id=?').get('page')!;assert.equal(stored.version,2);
    assert.equal(JSON.parse(String(stored.daten)).text,'After <>& Ü😀');assert.equal(stored.vonGeraet,'MCP');
    const log=f.sqlite.prepare('SELECT * FROM protokoll').get()!;assert.equal(log.text,'redion_update_page');assert.equal(JSON.stringify(log).includes('After <>&'),false);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM mcp_commit_guard').get()!.n,0);
  }finally{f.close();}
});
test('Versteckte Datenbankspalten bleiben beim freigegebenen Textschreiben erhalten',async()=>{
  const f=await fixture('guest');try{
    f.seed('page',{type:'page',parentTable:'collection',parentId:'collection',text:'Title',props:{secret:'Keep me',public:'Visible'}});
    f.sqlite.prepare('INSERT INTO freigaben(bereich,seite,kontoId,rolle) VALUES(?,?,?,?)').run('workspace-one','page','guest','edit');
    f.sqlite.prepare('INSERT INTO feldrechte(bereich,sammlung,feld,kontoId,rolle) VALUES(?,?,?,?,?)').run('workspace-one','collection','secret','guest','kein');
    const r=await f.open();assert.deepEqual((await r.record('page')).data.props,{public:'Visible'});
    const writable=await r.record('page',undefined,true);await r.commit([f.changed(writable.row,{text:'New title'})],'redion_update_page');
    assert.equal(JSON.parse(String(f.sqlite.prepare('SELECT daten FROM saetze WHERE id=?').get('page')!.daten)).props.secret,'Keep me');
  }finally{f.close();}
});
