import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {SCHEMA,ablageD1} from '../server/ablage.ts';
import {mcpStateD1,type McpDatabase} from '../server/mcp/state.ts';
import {createMcpOAuth,pkceChallenge} from '../server/mcp/oauth.ts';
import {handleCloudMcp,isCloudMcpPublicPath,isCloudMcpPrivatePath} from '../server/mcp/cloud-router.ts';
import fs from 'node:fs';
import {createMcpOAuthHttp} from '../server/mcp/oauth-http.ts';
import {hidden} from './helfer/mcp-cloud.mts';

const origin='https://redion.example.test';
const fixture=async()=>{
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(SCHEMA);
  sqlite.exec(fs.readFileSync(new URL('../server/mcp/schema.sql',import.meta.url),'utf8'));
  const db:McpDatabase={prepare(sql){
    let values:(string|number)[]=[];
    const params=()=>Object.fromEntries(values.map((v,i)=>['?'+(i+1),v]));
    const bound=():any[]=>sql.includes('?1')?[params()]:values;
    return {
      bind(...next){values=next;return this;},
      async first<T>(){return (sqlite.prepare(sql).get(...bound()) as T|undefined)??null;},
      async all<T>(){return {results:sqlite.prepare(sql).all(...bound()) as T[]};},
      async run(){return sqlite.prepare(sql).run(...bound());}
    };
  }};
  const store=ablageD1(db);
  await store.setze('konten',{id:'owner',mail:'owner@example.test',name:'owner',herkunft:'github',angelegt:'',gesperrt:0});
  await store.setze('bereiche',{id:'ws_test',name:'Tests',besitzer:'owner',angelegt:''});
  const state=mcpStateD1(db);
  const oauth=createMcpOAuth({state,issuer:origin,resource:origin+'/mcp/cloud',authorizationEndpoint:origin+'/mcp/authorize'});
  const client=await oauth.register({client_name:'Synthetic ChatGPT',redirect_uris:['https://client.example.test/callback'],grant_types:['authorization_code','refresh_token']});
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
      method:'POST',headers:{Authorization:'Bearer '+access_token,'Content-Type':'application/json',Accept:'application/json, text/event-stream'},
      body:JSON.stringify({jsonrpc:'2.0',id:++rpcId,method,params})}),env);
    return {status:result.status,data:await result.json() as any};
  };
  return {db,state,store,env,oauth,authorize,rpc,close:()=>sqlite.close()};
};

test('Cloud-Router: nur eng definierte Protokollwege ohne Access; Consent bleibt privat',()=>{
  assert.equal(isCloudMcpPublicPath('/mcp/cloud'),true);
  assert.equal(isCloudMcpPublicPath('/mcp/settings'),false);
  assert.equal(isCloudMcpPublicPath('/sync/runter'),false);
  assert.equal(isCloudMcpPublicPath('/api/bruecke'),false);
  assert.equal(isCloudMcpPrivatePath('/mcp/authorize'),true);
});

test('Cloud-MCP: Origin, Transportheader, JSON-RPC und Protokollversion werden geprüft',async()=>{
  const f=await fixture();try{
    const token=await f.authorize(false);
    const headers={Authorization:'Bearer '+token.access_token,'Content-Type':'application/json',Accept:'application/json, text/event-stream'};
    const body=JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'Synthetic',version:'1'}}});
    const send=(h:Record<string,string>,b=body)=>handleCloudMcp(new Request(origin+'/mcp/cloud',{method:'POST',headers:h,body:b}),f.env);
    assert.equal((await send({...headers,Origin:'https://evil.example.test'})).status,403);
    assert.equal((await send({...headers,'Content-Type':'text/plain'})).status,415);
    assert.equal((await send({...headers,Accept:'text/html'})).status,406);
    assert.equal((await send({...headers,'MCP-Protocol-Version':'2099-01-01'})).status,400);
    const init=await send(headers);assert.equal(init.status,200);
    assert.equal((await init.json() as any).result.protocolVersion,'2025-11-25');
    const notification=await send(headers,JSON.stringify({jsonrpc:'2.0',method:'notifications/cancelled',params:{requestId:1}}));
    assert.equal(notification.status,202);assert.equal(await notification.text(),'');
    const invalid=await send(headers,JSON.stringify({jsonrpc:'2.0',id:null,method:'tools/list'}));
    assert.equal((await invalid.json() as any).error.code,-32600);
  }finally{f.close();}
});

test('Cloud-MCP: ungültige, abgelaufene Tokens und gesperrte Konten erhalten keine Daten',async()=>{
  const f=await fixture();try{
    const token=await f.authorize(false);
    assert.equal((await f.rpc('rim_at_'+'a'.repeat(43),'tools/list')).status,401);
    await f.db.prepare("UPDATE mcp_state SET data=json_set(data,'$.accessUntil',?1) WHERE kind='family' RETURNING key").bind(Date.now()-1).first();
    assert.equal((await f.rpc(token.access_token,'tools/list')).status,401);
    const refresh=await f.oauth.exchange({grant_type:'refresh_token',client_id:(await f.oauth.listGrants('owner'))[0]!.clientId,
      refresh_token:token.refresh_token,resource:origin+'/mcp/cloud'});
    await f.store.setze('konten',{id:'owner',mail:'owner@example.test',name:'owner',herkunft:'github',angelegt:'',gesperrt:1});
    const denied=await f.rpc(refresh.access_token,'tools/call',{name:'redion_list_workspaces'});
    assert.equal(denied.status,401);
    const clientId=(await f.oauth.listGrants('owner'))[0]!.clientId;
    const blockedRefresh=await handleCloudMcp(new Request(origin+'/token',{method:'POST',body:new URLSearchParams({
      grant_type:'refresh_token',client_id:clientId,refresh_token:refresh.refresh_token!,resource:origin+'/mcp/cloud'})}),f.env);
    assert.equal(blockedRefresh.status,400);
    assert.equal((await blockedRefresh.json() as any).error,'invalid_grant');
    await f.db.prepare('DELETE FROM konten WHERE id=?1 RETURNING id').bind('owner').first();
    assert.equal((await f.rpc(refresh.access_token,'tools/list')).status,401);
  }finally{f.close();}
});

test('Echter MCP-SDK-Transport: DCR ohne Name, S256, initialize, Toolliste, Lesen, Refresh und Wiederverbindung',async()=>{
  const f=await fixture();
  const {Client}=await import(new URL('../plugins/red-ion/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js',import.meta.url).href);
  const {StreamableHTTPClientTransport}=await import(new URL('../plugins/red-ion/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js',import.meta.url).href);
  const {auth}=await import(new URL('../plugins/red-ion/node_modules/@modelcontextprotocol/sdk/dist/esm/client/auth.js',import.meta.url).href);
  let clientInfo:any,tokens:any,verifier='',authorization:URL|undefined;
  const provider={redirectUrl:'https://client.example.test/callback',
    clientMetadata:{redirect_uris:['https://client.example.test/callback'],token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code'],scope:'redion:read'},
    clientInformation:()=>clientInfo,saveClientInformation:(v:any)=>{clientInfo=v;},tokens:()=>tokens,saveTokens:(v:any)=>{tokens=v;},
    codeVerifier:()=>verifier,saveCodeVerifier:(v:string)=>{verifier=v;},redirectToAuthorization:(u:URL)=>{authorization=u;},state:()=> 'synthetic-sdk-state'};
  // Nur die bereits geprüfte menschliche Identität ist hier synthetisch.
  // Die öffentlichen Wege laufen durch denselben Router wie im Worker.
  const consent=createMcpOAuthHttp({oauth:f.oauth,state:f.state,identify:async()=>({id:'owner',workspaces:[{id:'ws_test',name:'Tests',canWrite:true}]}),rateKey:()=> 'sdk-test'});
  const fetcher=async(input:string|URL|Request,init?:RequestInit)=>{
    const request=new Request(input,init);
    return isCloudMcpPrivatePath(new URL(request.url).pathname)?(await consent(request))!:
      handleCloudMcp(request,f.env);
  };
  const clients:any[]=[];
  try{
    await f.store.setze('saetze',{id:'page_test',bereich:'ws_test',tabelle:'blocks',daten:JSON.stringify({type:'page',text:'Synthetische Seite',inhalt:'Nur Testdaten'}),verschluesselt:0,seite:'page_test',version:1,geaendert:'',geloescht:0,vonGeraet:'Test'});
    const options={serverUrl:origin+'/mcp/cloud',fetchFn:fetcher,scope:'redion:read'};
    assert.equal(await auth(provider,options),'REDIRECT');assert.ok(authorization);
    const html=await (await fetcher(authorization!)).text();
    assert.equal(html.includes('name="write"'),false);
    const approved=await fetcher(origin+'/mcp/authorize',{method:'POST',headers:{Origin:origin},body:new URLSearchParams({
      requestId:hidden(html,'requestId'),csrf:hidden(html,'csrf'),decision:'allow',workspace:'ws_test',remember:'yes'})});
    assert.equal(approved.status,303);const callback=new URL(approved.headers.get('location')!);
    assert.equal(callback.searchParams.get('state'),'synthetic-sdk-state');
    assert.equal(await auth(provider,{...options,authorizationCode:callback.searchParams.get('code')!}),'AUTHORIZED');
    for(let i=0;i<2;i++){
      const client=new Client({name:'Real synthetic SDK client',version:'1'},{capabilities:{}});clients.push(client);
      const transport=new StreamableHTTPClientTransport(new URL(origin+'/mcp/cloud'),{authProvider:provider,fetch:fetcher});
      await client.connect(transport);
      assert.equal(transport.sessionId,undefined);
      const list=await client.listTools();assert.equal(list.tools.length,3);
      const result=await client.callTool({name:'redion_read_page',arguments:{workspaceId:'ws_test',documentId:'page_test'}});
      assert.equal(JSON.parse(result.content[0].text).content,'Nur Testdaten');
      const denied=await client.callTool({name:'redion_create_page',arguments:{workspaceId:'ws_test',title:'Gesperrt',requestId:'sdk_request_01'}});
      assert.equal(denied.isError,true);
      await client.close();
      const previous=tokens.access_token;
      assert.equal(await auth(provider,options),'AUTHORIZED');assert.notEqual(tokens.access_token,previous);
      assert.equal((await f.rpc(previous,'tools/list')).status,401);
    }
  }finally{await Promise.allSettled(clients.map(c=>c.close()));f.close();}
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
    assert.match(unauth.headers.get('www-authenticate')!,/scope="redion:read"/);
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
