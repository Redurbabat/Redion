import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {SCHEMA,ablageD1} from '../server/ablage.ts';
import {mcpStateD1,type McpDatabase} from '../server/mcp/state.ts';
import {createMcpOAuth,pkceChallenge} from '../server/mcp/oauth.ts';
import {handleCloudMcp,isCloudMcpPublicPath,isCloudMcpPrivatePath} from '../server/mcp/cloud-router.ts';
import fs from 'node:fs';

const origin='https://redion.example.test';
const fixture=async()=>{
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(SCHEMA);
  sqlite.exec(fs.readFileSync(new URL('../server/mcp/schema.sql',import.meta.url),'utf8'));
  const db:McpDatabase={prepare(sql){
    let values:(string|number)[]=[];
    const params=()=>Object.fromEntries(values.map((v,i)=>['?'+(i+1),v]));
    return {
      bind(...next){values=next;return this;},
      async first<T>(){return (sqlite.prepare(sql).get(params()) as T|undefined)??null;},
      async all<T>(){return {results:sqlite.prepare(sql).all(params()) as T[]};},
      async run(){return sqlite.prepare(sql).run(params());}
    };
  }};
  const store=ablageD1(db);
  await store.setze('konten',{id:'owner',mail:'owner@example.test',name:'owner',herkunft:'github',angelegt:'',gesperrt:0});
  await store.setze('bereiche',{id:'ws_test',name:'Tests',besitzer:'owner',angelegt:''});
  const state=mcpStateD1(db);
  const oauth=createMcpOAuth({state,issuer:origin,resource:origin+'/mcp/cloud',authorizationEndpoint:origin+'/mcp/authorize'});
  const client=await oauth.register({client_name:'Synthetic ChatGPT',redirect_uris:['https://client.example.test/callback']});
  const verifier='v'.repeat(64);
  const authorize=async(write:boolean)=>{
    const begin=await oauth.begin('owner',{client_id:client.client_id,redirect_uri:client.redirect_uris[0],
      response_type:'code',resource:origin+'/mcp/cloud',scope:write?'redion:read redion:write':'redion:read',
      code_challenge:await pkceChallenge(verifier),code_challenge_method:'S256'});
    assert.equal(begin.kind,'consent');
    if(begin.kind!=='consent')throw new Error('consent expected');
    const approved=await oauth.approve('owner',begin.requestId,begin.csrf,{
      allow:true,remember:true,workspaceIds:['ws_test'],allowWrite:write});
    return oauth.exchange({grant_type:'authorization_code',client_id:client.client_id,
      code:new URL(approved.redirect).searchParams.get('code'),
      code_verifier:verifier,redirect_uri:client.redirect_uris[0],resource:origin+'/mcp/cloud'});
  };
  const env={DB:db,ACCESS_AUD:'test-audience',ACCESS_TEAM:'example.cloudflareaccess.com'};
  let rpcId=0;
  const rpc=async(access_token:string,method:string,params:unknown={})=>{
    const result=await handleCloudMcp(new Request(origin+'/mcp/cloud',{
      method:'POST',headers:{Authorization:'Bearer '+access_token,'Content-Type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:++rpcId,method,params})}),env);
    return {status:result.status,data:await result.json() as any};
  };
  return {db,store,env,oauth,authorize,rpc,close:()=>sqlite.close()};
};

test('Cloud-Router: nur eng definierte Protokollwege ohne Access; Consent bleibt privat',()=>{
  assert.equal(isCloudMcpPublicPath('/mcp/cloud'),true);
  assert.equal(isCloudMcpPublicPath('/mcp/settings'),false);
  assert.equal(isCloudMcpPublicPath('/sync/runter'),false);
  assert.equal(isCloudMcpPublicPath('/api/bruecke'),false);
  assert.equal(isCloudMcpPrivatePath('/mcp/authorize'),true);
});
test('Cloud-Router: keine Datenbank, keine OAuth-Tokens, kein Zugang',async()=>{
  const missing=await handleCloudMcp(new Request(origin+'/.well-known/oauth-authorization-server'),{});
  assert.equal(missing.status,503);
  const f=await fixture();try{
    const metadata=await handleCloudMcp(new Request(origin+'/.well-known/oauth-protected-resource/mcp/cloud'),f.env);
    assert.equal(metadata.status,200);
    assert.equal((await metadata.json() as any).resource,origin+'/mcp/cloud');
    const unauth=await handleCloudMcp(new Request(origin+'/mcp/cloud',{method:'POST',
      body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})}),f.env);
    assert.equal(unauth.status,401);
  }finally{f.close();}
});
test('Cloud-MCP: nur Lesen, danach Schreiben mit Rollen- und Versionskontrolle',async()=>{
  const f=await fixture();try{
    const read=await f.authorize(false);
    let tools=await f.rpc(read.access_token,'tools/list');
    assert.equal(tools.status,200);
    assert.equal(tools.data.result.tools.some((t:any)=>t.name==='redion_create_page'),false);
    const denied=await f.rpc(read.access_token,'tools/call',{name:'redion_create_page',arguments:{
      workspaceId:'ws_test',title:'Test',requestId:'request_00001'}});
    assert.equal(denied.data.result.isError,true);
    const write=await f.authorize(true);
    tools=await f.rpc(write.access_token,'tools/list');
    assert.equal(tools.data.result.tools.some((t:any)=>t.name==='redion_create_page'),true);
    const args={workspaceId:'ws_test',title:'Erste Seite',content:'Ein Testtext',requestId:'request_00001'};
    const created=await f.rpc(write.access_token,'tools/call',{name:'redion_create_page',arguments:args});
    const first=JSON.parse(created.data.result.content[0].text);
    assert.equal(first.version,1);
    assert.equal(first.alreadyExists,false);
    const retry=await f.rpc(write.access_token,'tools/call',{name:'redion_create_page',arguments:args});
    assert.equal(JSON.parse(retry.data.result.content[0].text).alreadyExists,true);
    const readBack=await f.rpc(write.access_token,'tools/call',{name:'redion_read_page',arguments:{
      workspaceId:'ws_test',documentId:first.documentId}});
    assert.equal(JSON.parse(readBack.data.result.content[0].text).content,'Ein Testtext');
    const edited=await f.rpc(write.access_token,'tools/call',{name:'redion_replace_text',arguments:{
      workspaceId:'ws_test',documentId:first.documentId,find:'Testtext',replacement:'geprüfter Inhalt',expectedVersion:1}});
    assert.equal(JSON.parse(edited.data.result.content[0].text).version,2);
    const stale=await f.rpc(write.access_token,'tools/call',{name:'redion_update_page',arguments:{
      workspaceId:'ws_test',documentId:first.documentId,title:'Alt',expectedVersion:1}});
    assert.equal(stale.data.result.isError,true);
    const outOfScope=await f.rpc(write.access_token,'tools/call',{name:'redion_read_page',arguments:{
      workspaceId:'not_approved',documentId:first.documentId}});
    assert.equal(outOfScope.data.result.isError,true);
    await f.oauth.revokeGrant('owner',(await f.oauth.listGrants('owner'))[0]!.id);
    const after=await f.rpc(write.access_token,'tools/list');
    assert.equal(after.status,401);
  }finally{f.close();}
});
test('Cloud-MCP: Access-Consent und Kontoverknüpfung versagen ohne verifizierte Access-Grenze',async()=>{
  const f=await fixture();try{
    const denied=await handleCloudMcp(new Request(origin+'/mcp/settings'),f.env,false);
    assert.equal(denied.status,401);
    const offline=await handleCloudMcp(new Request(origin+'/mcp/settings'),
      {...f.env,TOR:'offen'},true);
    assert.equal(offline.status,401);
  }finally{f.close();}
});
