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
  const prepared=new WeakMap<object,{sql:string;bound:()=>any[]}>();
  const db:McpDatabase={
    prepare(sql){
      let values:(string|number)[]=[];
      const params=()=>Object.fromEntries(values.map((v,i)=>['?'+(i+1),v]));
      const bound=():any[]=>sql.includes('?1')?[params()]:values;
      const statement={
        bind(...next:(string|number)[]){values=next;return this;},
        async first<T>(){return (sqlite.prepare(sql).get(...bound()) as T|undefined)??null;},
        async all<T>(){return {results:sqlite.prepare(sql).all(...bound()) as T[]};}
      };
      prepared.set(statement,{sql,bound});
      return statement;
    },
    async batch(statements){
      // D1.batch uses a real transaction. Model it with the synchronous
      // SQLite engine, including rollback when any statement fails.
      sqlite.exec('BEGIN IMMEDIATE');
      try{
        const outcome=statements.map(statement=>{
          const p=prepared.get(statement);
          if(!p)throw new Error('Unbekanntes PreparedStatement im Batch');
          return {success:true,results:sqlite.prepare(p.sql).all(...p.bound())};
        });
        sqlite.exec('COMMIT');
        return outcome;
      }catch(error){sqlite.exec('ROLLBACK');throw error;}
    }
  };
  const store=ablageD1(db);
  await store.setze('konten',{id:'owner',mail:'owner@example.test',name:'owner',herkunft:'github',angelegt:'',gesperrt:0});
  await store.setze('bereiche',{id:'ws_test',name:'Tests',besitzer:'owner',angelegt:''});
  const state=mcpStateD1(db);
  const oauth=createMcpOAuth({state,issuer:origin,resource:origin+'/mcp/cloud',authorizationEndpoint:origin+'/mcp/authorize'});
  const client=await oauth.register({client_name:'Synthetic ChatGPT',redirect_uris:['https://client.example.test/callback'],grant_types:['authorization_code','refresh_token']});
  const verifier='v'.repeat(64);
  const authorize=async(write:boolean,accountId='owner')=>{
    const begin=await oauth.begin(accountId,{client_id:client.client_id,redirect_uri:client.redirect_uris[0],
      response_type:'code',resource:origin+'/mcp/cloud',scope:write?'redion:read redion:write':'redion:read',
      code_challenge:await pkceChallenge(verifier),code_challenge_method:'S256'});
    assert.equal(begin.kind,'consent');
    if(begin.kind!=='consent')throw new Error('consent expected');
    const approved=await oauth.approve(accountId,begin.requestId,begin.csrf,{
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
      const list=await client.listTools();assert.equal(list.tools.length,14);
      const result=await client.callTool({name:'redion_read_page',arguments:{workspaceId:'ws_test',documentId:'page_test'}});
      assert.equal(JSON.parse(result.content[0]!.text).markdown,'Nur Testdaten');
       assert.equal((result.structuredContent as any)?.markdown,'Nur Testdaten');
      const tasks=await client.callTool({name:'redion_list_tasks',arguments:{workspaceId:'ws_test'}});
      assert.deepEqual(JSON.parse(tasks.content[0]!.text).tasks,[]);
      const catalog=await client.callTool({name:'redion_list_block_types',arguments:{}});
      assert.ok(JSON.parse(catalog.content[0]!.text).blockTypes.some((x:any)=>x.id==='schaltplan'));
      const unknown=await client.callTool({name:'redion_trash_page',arguments:{workspaceId:'ws_test'}});
       assert.equal(unknown.isError,true);
       assert.equal(JSON.parse(unknown.content[0]!.text).code,'unknown_tool');
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
    assert.equal(JSON.parse(readBack.data.result.content[0].text).markdown,'Ein Testtext');
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


test('Cloud-MCP: Unterseiten, Anhängen, Verschieben und Schutzregeln über HTTP',async()=>{
  const f=await fixture();
  try{
    const read=await f.authorize(false);
    const args=(documentId:string,extra:Record<string,unknown>={})=>({workspaceId:'ws_test',documentId,...extra});
    const call=async(token:string,name:string,parameters:Record<string,unknown>)=>{
      const response=await f.rpc(token,'tools/call',{name,arguments:parameters});
      assert.equal(response.status,200,name);
      return response.data.result as {isError?:boolean;content:{text:string}[]};
    };
    const ok=async(token:string,name:string,parameters:Record<string,unknown>)=>{
      const result=await call(token,name,parameters);
      assert.notEqual(result.isError,true,name);
      return JSON.parse(result.content[0]!.text) as any;
    };
    const denied=async(token:string,name:string,parameters:Record<string,unknown>,code:string)=>{
      const result=await call(token,name,parameters);
      assert.equal(result.isError,true,name);
      assert.equal(JSON.parse(result.content[0]!.text).code,code,name);
    };
    await denied(read.access_token,'redion_append_content',args('missing',{content:'x',expectedVersion:1}),'forbidden');
    await denied(read.access_token,'redion_move_page',args('missing',{expectedVersion:1}),'forbidden');
    const write=await f.authorize(true);
    let count=0;
    const create=async(title:string,parentId?:string)=>{
      const requestId='cloud_tools_'+String(++count).padStart(5,'0');
      return ok(write.access_token,'redion_create_page',{workspaceId:'ws_test',title,content:'Erster Satz',requestId,...(parentId?{parentId}:{})});
    };
    const root=await create('Wurzel');
    const child=await create('Kind',root.documentId);
    const grandchild=await create('Enkel',child.documentId);
    const children=await ok(write.access_token,'redion_list_child_pages',{workspaceId:'ws_test',parentId:root.documentId});
    assert.deepEqual(children.documents.map((d:any)=>d.documentId),[child.documentId]);
    const appended=await ok(write.access_token,'redion_append_content',args(child.documentId,{content:'Zweiter Satz',expectedVersion:1}));
    assert.equal(appended.version,2);
    const content=await ok(write.access_token,'redion_read_page',args(child.documentId));
    assert.equal(content.markdown,'Erster Satz\nZweiter Satz');
    await denied(write.access_token,'redion_append_content',args(child.documentId,{content:'Veraltet',expectedVersion:1}),'conflict');
    await denied(write.access_token,'redion_move_page',args(child.documentId,{newParentId:grandchild.documentId,expectedVersion:2}),'invalid_arguments');
    await denied(write.access_token,'redion_move_page',args(child.documentId,{newParentId:child.documentId,expectedVersion:2}),'invalid_arguments');
    const moved=await ok(write.access_token,'redion_move_page',args(grandchild.documentId,{newParentId:root.documentId,expectedVersion:1}));
    assert.equal(moved.version,2);
    const newChildren=await ok(write.access_token,'redion_list_child_pages',{workspaceId:'ws_test',parentId:root.documentId});
    assert.deepEqual(new Set(newChildren.documents.map((d:any)=>d.documentId)),new Set([child.documentId,grandchild.documentId]));
    const empty=await ok(write.access_token,'redion_list_child_pages',{workspaceId:'ws_test',parentId:child.documentId});
    assert.equal(empty.documents.length,0);
    await denied(write.access_token,'redion_move_page',args(grandchild.documentId,{expectedVersion:1}),'conflict');
    await f.store.setze('saetze',{id:'encrypted_child',bereich:'ws_test',tabelle:'blocks',
      daten:JSON.stringify({type:'page',text:'Privat',inhalt:'Geheim',parentId:root.documentId}),
      verschluesselt:1,seite:'encrypted_child',version:1,geaendert:'',geloescht:0,vonGeraet:'Test'});
    const filtered=await ok(write.access_token,'redion_list_child_pages',{workspaceId:'ws_test',parentId:root.documentId});
    assert.ok(!filtered.documents.some((d:any)=>d.documentId==='encrypted_child'));
    await denied(write.access_token,'redion_append_content',args('encrypted_child',{content:'Nicht erlaubt',expectedVersion:1}),'encrypted');
    await denied(write.access_token,'redion_move_page',args(child.documentId,{newParentId:'encrypted_child',expectedVersion:2}),'encrypted');
    await denied(write.access_token,'redion_list_child_pages',{workspaceId:'ws_test',parentId:'encrypted_child'},'encrypted');
  }finally{f.close();}
});


test('Cloud-MCP: Unterseiten mit Offset über mehr als 1.000 fremde Einträge paginieren',async()=>{
  const f=await fixture();
  try{
    const token=await f.authorize(true);
    const created=await f.rpc(token.access_token,'tools/call',{name:'redion_create_page',arguments:{
      workspaceId:'ws_test',title:'Wurzel für Paginierung',requestId:'pagination_root_001'
    }});
    assert.equal(created.status,200);
    const root=JSON.parse(created.data.result.content[0].text).documentId as string;
    const record=async(id:string,parentId:string|null,geaendert:string,daten?:string,verschluesselt=0)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:daten??JSON.stringify({type:'page',text:id,inhalt:'',parentId}),
        verschluesselt,seite:id,version:1,geaendert,geloescht:0,vonGeraet:'Test'});
    };
    for(let i=0;i<1050;i++)await record('noise_'+i,null,'2099-01-01T00:00:00.000Z');
    for(let i=0;i<65;i++)await record('child_'+i,root,'2020-01-01T00:00:00.000Z');
    await record('bad_json',null,'2099-01-01T00:00:00.000Z','not valid JSON');
    await record('private_child',root,'2020-01-01T00:00:00.000Z',undefined,1);
    const seen=new Set<string>();
    let offset=0;
    for(let page=0;page<4;page++){
      const reply=await f.rpc(token.access_token,'tools/call',{name:'redion_list_child_pages',arguments:{
        workspaceId:'ws_test',parentId:root,limit:25,offset
      }});
      assert.equal(reply.status,200);
      assert.notEqual(reply.data.result.isError,true,JSON.stringify(reply.data.result));
      const data=JSON.parse(reply.data.result.content[0].text);
      for(const item of data.documents)seen.add(item.documentId);
      if(data.nextOffset===null){assert.equal(page,2);break;}
      assert.equal(data.nextOffset,offset+25);
      offset=data.nextOffset;
    }
    assert.equal(seen.size,65);
    assert.ok(!seen.has('private_child'));
    const bad=await f.rpc(token.access_token,'tools/call',{name:'redion_list_child_pages',arguments:{
      workspaceId:'ws_test',parentId:root,offset:100001
    }});
    assert.equal(bad.data.result.isError,true);
    assert.equal(JSON.parse(bad.data.result.content[0].text).code,'invalid_arguments');
  }finally{f.close();}
});

test('Cloud-MCP: zwei parallele Seitenverschiebungen können keinen Kreis erzeugen',async()=>{
  const f=await fixture();
  try{
    const token=await f.authorize(true);
    const create=async(title:string,requestId:string)=>{
      const response=await f.rpc(token.access_token,'tools/call',{name:'redion_create_page',arguments:{
        workspaceId:'ws_test',title,requestId
      }});
      assert.equal(response.status,200);
      return JSON.parse(response.data.result.content[0].text).documentId as string;
    };
    const a=await create('Seite A','parallel_move_A_001');
    const b=await create('Seite B','parallel_move_B_001');
    const move=(documentId:string,newParentId:string)=>f.rpc(token.access_token,'tools/call',{name:'redion_move_page',arguments:{
      workspaceId:'ws_test',documentId,newParentId,expectedVersion:1
    }});
    const results=await Promise.all([move(a,b),move(b,a)]);
    assert.ok(results.every(r=>r.status===200));
    assert.equal(results.filter(r=>r.data.result.isError!==true).length,1);
    const rowA=await f.store.hole('saetze',{bereich:'ws_test',id:a});
    const rowB=await f.store.hole('saetze',{bereich:'ws_test',id:b});
    assert.ok(rowA&&rowB);
    const pa=JSON.parse(rowA.daten).parentId;
    const pb=JSON.parse(rowB.daten).parentId;
    assert.equal(pa===b&&pb===a,false);
  }finally{f.close();}
});


test('Cloud-MCP: Unterseiten verbergen Existenz und Reihenfolge unfreigegebener Seiten',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('konten',{id:'collab',mail:'collab@example.test',
      name:'collab',herkunft:'github',angelegt:'',gesperrt:0});
    const owner=await f.authorize(true);
    const create=async(title:string,requestId:string,parentId?:string)=>{
      const response=await f.rpc(owner.access_token,'tools/call',{name:'redion_create_page',
        arguments:{workspaceId:'ws_test',title,requestId,...(parentId?{parentId}:{})}});
      assert.equal(response.status,200);
      assert.notEqual(response.data.result.isError,true);
      return JSON.parse(response.data.result.content[0].text).documentId as string;
    };
    const root=await create('Gemeinsamer Ordner','acl_parent_root_001');
    const visA=await create('Sichtbar A','acl_child_vis_a_001',root);
    const override=await create('Persönlich freigegeben','acl_child_override_001',root);
    const hidden=await create('Privat','acl_child_hidden_001',root);
    const visB=await create('Sichtbar B','acl_child_vis_b_001',root);
    const wildcardDeny=await create('Wildcard gesperrt','acl_child_wildcard_001',root);

    const share=async(pageId:string,accountId:string,rolle:string)=>{
      await f.store.setze('freigaben',{bereich:'ws_test',seite:pageId,kontoId:accountId,
        rolle,von:'owner',wann:'2026-11-23'});
    };
    await share(root,'collab','lesen');
    await share(hidden,'collab','kein');
    await share(wildcardDeny,'*','kein');
    await share(override,'*','kein');
    await share(override,'collab','lesen');
    const dated=[
      [wildcardDeny,'2035-01-01T00:00:00Z'],
      [visB,'2034-01-01T00:00:00Z'],
      [hidden,'2033-01-01T00:00:00Z'],
      [override,'2032-01-01T00:00:00Z'],
      [visA,'2031-01-01T00:00:00Z']
    ];
    for(const [id,geaendert] of dated){
      const s=await f.store.hole('saetze',{bereich:'ws_test',id});
      assert.ok(s);
      await f.store.setze('saetze',{...s,geaendert});
    }

    const collab=await f.authorize(false,'collab');
    const list=async(token:string,offset:number)=>{
      const response=await f.rpc(token,'tools/call',{name:'redion_list_child_pages',
        arguments:{workspaceId:'ws_test',parentId:root,limit:1,offset}});
      assert.equal(response.status,200);
      assert.notEqual(response.data.result.isError,true,JSON.stringify(response.data.result));
      return JSON.parse(response.data.result.content[0].text) as {
        documents:{documentId:string}[];nextOffset:number|null
      };
    };
    const expected=[visB,override,visA];
    for(let i=0;i<expected.length;i++){
      const result=await list(collab.access_token,i);
      assert.deepEqual(result.documents.map(d=>d.documentId),[expected[i]]);
      assert.equal(result.nextOffset,i<expected.length-1?i+1:null);
    }
    const noMore=await list(collab.access_token,3);
    assert.deepEqual(noMore.documents,[]);
    assert.equal(noMore.nextOffset,null);
    // Page counts and rank are only based on accessible children, not the
    // two hidden entries. The owner retains access to every child.
    const ownerList=await f.rpc(owner.access_token,'tools/call',{name:'redion_list_child_pages',
      arguments:{workspaceId:'ws_test',parentId:root,limit:10}});
    assert.equal(ownerList.status,200);
    assert.equal(JSON.parse(ownerList.data.result.content[0].text).documents.length,5);
  }finally{f.close();}
});


test('Cloud-MCP: Suche im gesamten Seiteninhalt und nur über sichtbare Resultate paginieren',async()=>{
  const f=await fixture();
  try{
    const owner=await f.authorize(true);
    await f.store.setze('konten',{id:'search_collab',mail:'search@example.test',
      name:'search_collab',herkunft:'github',angelegt:'',gesperrt:0});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'search_collab',
      rolle:'lesen',von:'owner',wann:'2026-11-23'});
    // More than the old 300-record search boundary.
    for(let i=0;i<330;i++){
      await f.store.setze('saetze',{id:'recent_search_'+i,bereich:'ws_test',
        tabelle:'blocks',daten:JSON.stringify({type:'page',text:'Neu '+i,inhalt:'Alltag'}),
        verschluesselt:0,seite:'recent_search_'+i,version:1,
        geaendert:'2099-01-01T00:00:00Z',geloescht:0,vonGeraet:'Test'});
    }
    const record=async(id:string,title:string,content:string,time:string)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify({type:'page',text:title,inhalt:content}),verschluesselt:0,
        seite:id,version:1,geaendert:time,geloescht:0,vonGeraet:'Test'});
    };
    await record('secret_result','Intern','verteiltes-suchwort','2040-01-01T00:00:00Z');
    await record('visible_result_one','Titel ohne Treffer','Verteiltes-Suchwort',
      '2039-01-01T00:00:00Z');
    await record('visible_result_two','verteiltes-suchwort Titel','Sonstiges',
      '2038-01-01T00:00:00Z');
    await record('visible_result_three','Dritte Seite','verteiltes-suchwort',
      '2037-01-01T00:00:00Z');
    await record('literal_wildcard','Ergebnis für %_','Anderer Text',
      '2036-01-01T00:00:00Z');
    await record('unicode_old_page','Äpfel und Öfen','Ausflug nach MÜNCHEN',
      '2020-01-01T00:00:00Z');
    await record('encrypted_result','Sperre','verteiltes-suchwort',
      '2035-01-01T00:00:00Z');
    const encrypted=await f.store.hole('saetze',{bereich:'ws_test',id:'encrypted_result'});
    assert.ok(encrypted);
    await f.store.setze('saetze',{...encrypted,verschluesselt:1});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'secret_result',
      kontoId:'search_collab',rolle:'kein',von:'owner',wann:'2026-11-23'});
    const token=await f.authorize(false,'search_collab');
    const call=async(name:string,parameters:Record<string,unknown>)=>{
      const response=await f.rpc(token.access_token,'tools/call',{name,arguments:parameters});
      assert.equal(response.status,200);
      return response.data.result;
    };
    const search=async(query:string,offset=0,limit=1)=>{
      const result=await call('redion_search',{workspaceId:'ws_test',query,offset,limit});
      assert.notEqual(result.isError,true,JSON.stringify(result));
      return JSON.parse(result.content[0].text) as {
        documents:{documentId:string}[];nextOffset:number|null;limited?:boolean
      };
    };
    for(const [offset,id] of ['visible_result_one','visible_result_two','visible_result_three'].entries()){
      const page=await search('verteiltes-suchwort',offset);
      assert.deepEqual(page.documents.map(x=>x.documentId),[id]);
      assert.equal(page.nextOffset,offset<2?offset+1:null);
      assert.equal(page.limited,undefined);
    }
    assert.deepEqual((await search('verteiltes-suchwort',3)).documents,[]);
    assert.deepEqual((await search('%_',0,10)).documents.map(x=>x.documentId),['literal_wildcard']);
    assert.deepEqual((await search('äPFEL',0,10)).documents.map(x=>x.documentId),['unicode_old_page']);
    assert.deepEqual((await search('münchen',0,10)).documents.map(x=>x.documentId),['unicode_old_page']);
    const long=await call('redion_search',{workspaceId:'ws_test',query:'x'.repeat(201)});
    assert.equal(long.isError,true);
    assert.equal(JSON.parse(long.content[0].text).code,'invalid_arguments');
    const offset=await call('redion_search',{workspaceId:'ws_test',query:'x',offset:1001});
    assert.equal(offset.isError,true);
    const oversized=await f.rpc(owner.access_token,'tools/call',{name:'redion_create_page',
      arguments:{workspaceId:'ws_test',title:'Ungültige Seite',
        content:'X'.repeat(12001),requestId:'search_oversized_page_001'}});
    assert.equal(oversized.data.result.isError,true);
    assert.equal(JSON.parse(oversized.data.result.content[0].text).code,'invalid_arguments');
  }finally{f.close();}
});


test('Cloud-MCP: Markdown-Einrückung und Zeilenumbrüche exakt erhalten',async()=>{
  const f=await fixture();
  try{
    const token=await f.authorize(true);
    const invoke=async(name:string,args:Record<string,unknown>)=>{
      const response=await f.rpc(token.access_token,'tools/call',{name,arguments:{workspaceId:'ws_test',...args}});
      assert.equal(response.status,200);
      return response.data.result as {isError?:boolean;content:{text:string}[]};
    };
    const created=await invoke('redion_create_page',{
      title:'Markdown-Formatierung',content:'Beginn',requestId:'mcp_markdown_format_001'
    });
    assert.notEqual(created.isError,true);
    const id=JSON.parse(created.content[0]!.text).documentId as string;
    const addition='\n    Code\n\n';
    const appended=await invoke('redion_append_content',{
      documentId:id,content:addition,expectedVersion:1
    });
    assert.notEqual(appended.isError,true);
    const read=await invoke('redion_read_page',{documentId:id});
    assert.equal(JSON.parse(read.content[0]!.text).markdown,'Beginn\n\n    Code\n\n');
    const replaced=await invoke('redion_replace_text',{
      documentId:id,find:'    Code',replacement:'  Block',expectedVersion:2
    });
    assert.notEqual(replaced.isError,true);
    const finalRead=await invoke('redion_read_page',{documentId:id});
    assert.equal(JSON.parse(finalRead.content[0]!.text).markdown,'Beginn\n\n  Block\n\n');
    const blank=await invoke('redion_append_content',{
      documentId:id,content:'   ',expectedVersion:3
    });
    assert.equal(blank.isError,true);
    assert.equal(JSON.parse(blank.content[0]!.text).code,'invalid_arguments');
    const empty=await invoke('redion_replace_text',{
      documentId:id,find:'',replacement:'Z',expectedVersion:3
    });
    assert.equal(empty.isError,true);
    assert.equal(JSON.parse(empty.content[0]!.text).code,'invalid_arguments');
  }finally{f.close();}
});


test('Cloud-MCP: grosse Seiten in Unicode-sicheren Abschnitten lesen',async()=>{
  const f=await fixture();
  try{
    const full='A'.repeat(11999)+'😀'+'B'.repeat(13);
    await f.store.setze('saetze',{id:'long_page',bereich:'ws_test',tabelle:'blocks',
      daten:JSON.stringify({type:'page',text:'Lange Seite',inhalt:full}),verschluesselt:0,
      seite:'long_page',version:7,geaendert:'2026-11-23',geloescht:0,vonGeraet:'Test'});
    const token=await f.authorize(false);
    const read=async(params:Record<string,unknown>={})=>{
      const reply=await f.rpc(token.access_token,'tools/call',{
        name:'redion_read_page',arguments:{workspaceId:'ws_test',documentId:'long_page',...params}
      });
      assert.equal(reply.status,200);
      return reply.data.result as {isError?:boolean;content:{text:string}[]};
    };
    const first=await read();
    assert.notEqual(first.isError,true);
    const data=JSON.parse(first.content[0]!.text);
    assert.equal(data.offset,0);
    assert.equal(data.version,7);
    assert.equal(data.totalLength,full.length);
    assert.equal(data.markdown.length,12001);
    assert.equal('content' in data,false);
    assert.equal(data.nextOffset,12001);
    const legacy=JSON.parse((await read({responseFormat:'legacy',limit:6})).content[0]!.text);
    assert.equal(legacy.content,'A'.repeat(6));
    assert.equal('markdown' in legacy,false);
    const invalidFormat=await read({responseFormat:'html'});
    assert.equal(invalidFormat.isError,true);
    assert.equal(JSON.parse(invalidFormat.content[0]!.text).code,'invalid_arguments');
    const second=JSON.parse((await read({offset:data.nextOffset})).content[0]!.text);
    assert.equal(second.nextOffset,null);
    assert.equal(second.offset,12001);
    assert.equal(data.markdown+second.markdown,full);
    const split=await read({offset:12000});
    assert.equal(split.isError,true);
    assert.equal(JSON.parse(split.content[0]!.text).code,'invalid_arguments');
    const invalid=await read({offset:1000001});
    assert.equal(invalid.isError,true);
    const short=JSON.parse((await read({offset:0,limit:6})).content[0]!.text);
    assert.equal(short.markdown,'A'.repeat(6));
    assert.equal(short.nextOffset,6);
    const empty=JSON.parse((await read({offset:full.length})).content[0]!.text);
    assert.equal(empty.markdown,'');
    assert.equal(empty.nextOffset,null);
  }finally{f.close();}
});


test('Cloud-MCP: Hauptseiten nach effektiven Rechten ohne versteckte Metadaten auflisten',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('konten',{id:'root_reader',mail:'root_reader@example.test',
      name:'Root reader',herkunft:'github',angelegt:'',gesperrt:0});
    await f.store.setze('konten',{id:'direct_only',mail:'direct@example.test',
      name:'Direct only',herkunft:'github',angelegt:'',gesperrt:0});
    const share=async(pageId:string,accountId:string,rolle:string)=>
      f.store.setze('freigaben',{bereich:'ws_test',seite:pageId,kontoId:accountId,
        rolle,von:'owner',wann:'2026-11-23'});
    await share('*','root_reader','lesen');
    const add=async(id:string,time:string,parent:'missing'|null|string=null,type='page',encrypted=0)=>{
      const data:Record<string,unknown>={type,text:id,inhalt:''};
      if(parent!=='missing')data.parentId=parent;
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify(data),verschluesselt:encrypted,seite:id,version:1,
        geaendert:time,geloescht:0,vonGeraet:'Test'});
    };
    await add('root_hidden_wild','2040-01-01T00:00:00Z',null);
    await add('root_visible_a','2039-01-01T00:00:00Z',null);
    await add('root_hidden_user','2038-01-01T00:00:00Z','missing');
    await add('root_visible_b','2037-01-01T00:00:00Z','');
    await add('root_override','2036-01-01T00:00:00Z','missing');
    await add('nested_not_root','2042-01-01T00:00:00Z','root_visible_a');
    await add('encrypted_root','2041-01-01T00:00:00Z',null,'page',1);
    await add('not_a_page','2043-01-01T00:00:00Z',null,'paragraph');
    await f.store.setze('saetze',{id:'invalid_json_root',bereich:'ws_test',tabelle:'blocks',
      daten:'{invalid',verschluesselt:0,seite:'invalid_json_root',version:1,
      geaendert:'2044-01-01T00:00:00Z',geloescht:0,vonGeraet:'Test'});
    await share('root_hidden_wild','*','kein');
    await share('root_hidden_user','root_reader','kein');
    await share('root_override','*','kein');
    await share('root_override','root_reader','lesen');
    await share('root_visible_a','direct_only','lesen');

    const read=await f.authorize(false,'root_reader');
    const direct=await f.authorize(false,'direct_only');
    const owner=await f.authorize(false);
    const list=async(token:string,opts:Record<string,unknown>={})=>{
      const response=await f.rpc(token,'tools/call',{name:'redion_list_root_pages',
        arguments:{workspaceId:'ws_test',limit:1,...opts}});
      assert.equal(response.status,200);
      assert.notEqual(response.data.result.isError,true,JSON.stringify(response.data.result));
      return JSON.parse(response.data.result.content[0].text) as {
        documents:{documentId:string}[];nextOffset:number|null;workspaceId:string
      };
    };
    const visible=['root_visible_a','root_visible_b','root_override'];
    for(let offset=0;offset<visible.length;offset++){
      const result=await list(read.access_token,{offset});
      assert.equal(result.workspaceId,'ws_test');
      assert.deepEqual(result.documents.map(d=>d.documentId),[visible[offset]]);
      assert.equal(result.nextOffset,offset<visible.length-1?offset+1:null);
    }
    assert.deepEqual((await list(read.access_token,{offset:3})).documents,[]);
    const onlyDirect=await list(direct.access_token,{limit:10});
    assert.deepEqual(onlyDirect.documents.map(d=>d.documentId),['root_visible_a']);
    assert.equal(onlyDirect.nextOffset,null);
    const ownerRows=await list(owner.access_token,{limit:10});
    assert.deepEqual(ownerRows.documents.map(d=>d.documentId),[
      'root_hidden_wild','root_visible_a','root_hidden_user','root_visible_b','root_override'
    ]);
    const bad=await f.rpc(read.access_token,'tools/call',{name:'redion_list_root_pages',
      arguments:{workspaceId:'ws_test',offset:100001}});
    assert.equal(bad.status,200);
    assert.equal(bad.data.result.isError,true);
    assert.equal(JSON.parse(bad.data.result.content[0].text).code,'invalid_arguments');
    const blocked=await f.rpc(read.access_token,'tools/call',{name:'redion_list_root_pages',
      arguments:{workspaceId:'not_granted'}});
    assert.equal(blocked.data.result.isError,true);
    assert.equal(JSON.parse(blocked.data.result.content[0].text).code,'forbidden');
  }finally{f.close();}
});


test('Cloud-MCP: mehrere Seiten mit neutralen Fehlern und begrenzter Antwort lesen',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('konten',{id:'batch_reader',mail:'batch@example.test',
      name:'batch_reader',herkunft:'github',angelegt:'',gesperrt:0});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'batch_reader',
      rolle:'lesen',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'secret_batch',
      kontoId:'batch_reader',rolle:'kein',von:'owner',wann:'2026-11-23'});
    const long='X'.repeat(1999)+'😀'+'END';
    const record=async(id:string,title:string,body:string,encrypted=0)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify({type:'page',text:title,inhalt:body}),verschluesselt:encrypted,
        seite:id,version:3,geaendert:'2026-11-23',geloescht:0,vonGeraet:'Test'});
    };
    await record('long_batch','Lange Notiz',long);
    await record('ordinary_batch','Normal','sichtbar');
    await record('secret_batch','Geheim','nicht zeigen');
    await record('encrypted_batch','Verschlüsselt','niemals anzeigen',1);
    await f.store.setze('saetze',{id:'bad_json_batch',bereich:'ws_test',tabelle:'blocks',
      daten:'{broken',verschluesselt:0,seite:'bad_json_batch',version:1,
      geaendert:'2026-11-23',geloescht:0,vonGeraet:'Test'});
    const token=await f.authorize(false,'batch_reader');
    const call=async(args:Record<string,unknown>)=>{
      const response=await f.rpc(token.access_token,'tools/call',{name:'redion_read_pages',
        arguments:{workspaceId:'ws_test',...args}});
      assert.equal(response.status,200);
      return response.data.result as {isError?:boolean;content:{text:string}[]};
    };
    const ids=['long_batch','ordinary_batch','secret_batch','encrypted_batch',
      'missing_batch','bad_json_batch'];
    const result=await call({documentIds:ids,maxChars:2000});
    assert.notEqual(result.isError,true,JSON.stringify(result));
    const parsed=JSON.parse(result.content[0]!.text);
    assert.equal(parsed.workspaceId,'ws_test');
    assert.deepEqual(parsed.documents.map((d:any)=>d.documentId),ids);
    assert.equal(parsed.documents[0].content,'X'.repeat(1999)+'😀');
    assert.equal(parsed.documents[0].totalLength,long.length);
    assert.equal(parsed.documents[0].nextOffset,2001);
    assert.equal(parsed.documents[0].version,3);
    assert.equal(parsed.documents[1].content,'sichtbar');
    assert.equal(parsed.documents[1].nextOffset,null);
    for(const item of parsed.documents.slice(2))
      assert.deepEqual(item,{documentId:item.documentId,unavailable:true});
    const follow=await f.rpc(token.access_token,'tools/call',{name:'redion_read_page',
      arguments:{workspaceId:'ws_test',documentId:'long_batch',offset:2001}});
    assert.equal(JSON.parse(follow.data.result.content[0].text).markdown,'END');
    const duplicates=await call({documentIds:['long_batch','long_batch']});
    assert.equal(duplicates.isError,true);
    assert.equal(JSON.parse(duplicates.content[0]!.text).code,'invalid_arguments');
    const tooMany=await call({documentIds:Array.from({length:11},(_,i)=>'item_'+i)});
    assert.equal(tooMany.isError,true);
    const tooLarge=await call({documentIds:['long_batch'],maxChars:2001});
    assert.equal(tooLarge.isError,true);
    const noAccess=await f.rpc(token.access_token,'tools/call',{name:'redion_read_pages',
      arguments:{workspaceId:'another_workspace',documentIds:['long_batch']}});
    assert.equal(noAccess.data.result.isError,true);
  }finally{f.close();}
});


test('Cloud-MCP: Leseabschnitte mit Versionsnummer gegen Datenänderungen absichern',async()=>{
  const f=await fixture();
  try{
    const docId='pinned_read_page';
    const put=async(version:number,content:string)=>{
      await f.store.setze('saetze',{id:docId,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify({type:'page',text:'Versionskontrolle',inhalt:content}),
        verschluesselt:0,seite:docId,version,geaendert:'2026-11-23',
        geloescht:0,vonGeraet:'Test'});
    };
    await put(2,'Alter Inhalt 123456789');
    const token=await f.authorize(false);
    const read=async(args:Record<string,unknown>)=>{
      const response=await f.rpc(token.access_token,'tools/call',{name:'redion_read_page',
        arguments:{workspaceId:'ws_test',documentId:docId,...args}});
      assert.equal(response.status,200);
      return response.data.result as {isError?:boolean;content:{text:string}[]};
    };
    const first=await read({offset:0,limit:6});
    assert.notEqual(first.isError,true);
    const previous=JSON.parse(first.content[0]!.text);
    assert.equal(previous.markdown,'Alter ');
    assert.equal(previous.version,2);
    assert.equal(previous.nextOffset,6);
    const second=await read({offset:6,limit:8,expectedVersion:2});
    assert.equal(JSON.parse(second.content[0]!.text).markdown,'Inhalt 1');
    await put(3,'Neuer Inhalt 987654321');
    const stale=await read({offset:6,limit:8,expectedVersion:2});
    assert.equal(stale.isError,true);
    assert.equal(JSON.parse(stale.content[0]!.text).code,'conflict');
    const refreshed=await read({offset:6,limit:8,expectedVersion:3});
    assert.notEqual(refreshed.isError,true);
    assert.equal(JSON.parse(refreshed.content[0]!.text).markdown,'Inhalt 9');
    const invalid=await read({offset:6,expectedVersion:0});
    assert.equal(invalid.isError,true);
    assert.equal(JSON.parse(invalid.content[0]!.text).code,'invalid_arguments');
  }finally{f.close();}
});

test('Cloud-MCP: sichere Seitenpfade ohne Metadaten verborgener Vorfahren',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('konten',{id:'path_reader',mail:'path_reader@example.test',
      name:'Path Reader',herkunft:'github',angelegt:'',gesperrt:0});
    const put=async(id:string,parentId:string|null)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify({type:'page',text:'Titel '+id,inhalt:'',parentId}),
        verschluesselt:0,seite:id,version:1,geaendert:'2026-11-23',
        geloescht:0,vonGeraet:'Test'});
    };
    const grant=async(id:string,rolle:string)=>
      f.store.setze('freigaben',{bereich:'ws_test',seite:id,kontoId:'path_reader',
        rolle,von:'owner',wann:'2026-11-23'});
    await put('path_root',null);
    await put('path_middle','path_root');
    await put('path_leaf','path_middle');
    const owner=await f.authorize(false);
    const reader=await f.authorize(false,'path_reader');
    const path=async(token:string,documentId='path_leaf')=>{
      const reply=await f.rpc(token,'tools/call',{name:'redion_get_page_path',
        arguments:{workspaceId:'ws_test',documentId}});
      assert.equal(reply.status,200);
      return reply.data.result as {isError?:boolean;content:{text:string}[]};
    };
    const full=await path(owner.access_token);
    assert.notEqual(full.isError,true);
    assert.deepEqual(JSON.parse(full.content[0]!.text).path.map((p:any)=>p.documentId),
      ['path_root','path_middle','path_leaf']);
    await grant('path_leaf','lesen');
    const hidden=await path(reader.access_token);
    assert.notEqual(hidden.isError,true);
    assert.deepEqual(JSON.parse(hidden.content[0]!.text),
      {workspaceId:'ws_test',documentId:'path_leaf',unavailable:true});
    await grant('*','lesen');
    await grant('path_middle','kein');
    const stillHidden=await path(reader.access_token);
    assert.deepEqual(JSON.parse(stillHidden.content[0]!.text),
      {workspaceId:'ws_test',documentId:'path_leaf',unavailable:true});
    await grant('path_middle','lesen');
    const allowed=await path(reader.access_token);
    assert.deepEqual(JSON.parse(allowed.content[0]!.text).path.map((p:any)=>p.documentId),
      ['path_root','path_middle','path_leaf']);
    await put('path_root','path_leaf');
    const cycle=await path(owner.access_token);
    assert.equal(cycle.isError,true);
    assert.equal(JSON.parse(cycle.content[0]!.text).code,'invalid_data');
    await put('path_root',null);
    const row=await f.store.hole('saetze',{bereich:'ws_test',id:'path_middle'});
    assert.ok(row);
    await f.store.setze('saetze',{...row,verschluesselt:1});
    const encrypted=await path(owner.access_token);
    assert.notEqual(encrypted.isError,true);
    assert.deepEqual(JSON.parse(encrypted.content[0]!.text),
      {workspaceId:'ws_test',documentId:'path_leaf',unavailable:true});
  }finally{f.close();}
});


test('Cloud-MCP: Datenbankliste zeigt nur lesbare eingebettete Klartext-Sammlungen',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('konten',{id:'db_reader',mail:'db_reader@example.test',
      name:'db_reader',herkunft:'github',angelegt:'',gesperrt:0});
    const page=async(id:string)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify({type:'page',text:'Seite '+id,inhalt:''}),
        verschluesselt:0,seite:id,version:1,geaendert:'2030-01-01',
        geloescht:0,vonGeraet:'Test'});
    };
    for(const id of ['db_public_page','db_private_page','db_override_page'])
      await page(id);
    const collection=async(id:string,name:string,time:string,encrypted=0,valid=true)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'collections',
        daten:valid?JSON.stringify({id,name,schema:{secret:{name:'Gehalt',type:'number'}}}):'{broken',
        verschluesselt:encrypted,seite:id,version:2,geaendert:time,
        geloescht:0,vonGeraet:'Test'});
    };
    const link=async(id:string,collectionId:string,pageId:string)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify({type:'database',collectionId,parentId:pageId}),
        verschluesselt:0,seite:pageId,version:1,geaendert:'2026-11-23',
        geloescht:0,vonGeraet:'Test'});
    };
    await collection('db_secret','Verborgener Name','2048-01-01');
    await collection('db_visible_a','Sichtbare Eins','2047-01-01');
    await collection('db_visible_b','Sichtbare Zwei','2046-01-01');
    await collection('db_override','Individuelle Freigabe','2045-01-01');
    await collection('db_unlinked','Nicht verbunden','2044-01-01');
    await collection('db_encrypted','Verschlüsselte DB','2043-01-01',1);
    await collection('db_corrupt','Ungültiges JSON','2042-01-01',0,false);
    await link('link_secret','db_secret','db_private_page');
    await link('link_visible_a','db_visible_a','db_public_page');
    // One hidden and one visible database embedding: never choose the hidden
    // first link as the only source of rights.
    await link('link_visible_b_private','db_visible_b','db_private_page');
    await link('link_visible_b_public','db_visible_b','db_public_page');
    await link('link_override','db_override','db_override_page');
    await link('link_encrypted','db_encrypted','db_public_page');
    await link('link_corrupt','db_corrupt','db_public_page');
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'db_reader',
      rolle:'lesen',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'db_private_page',
      kontoId:'db_reader',rolle:'kein',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'db_override_page',
      kontoId:'*',rolle:'kein',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'db_override_page',
      kontoId:'db_reader',rolle:'lesen',von:'owner',wann:'2026-11-23'});
    const reader=await f.authorize(false,'db_reader');
    const owner=await f.authorize(false);
    const list=async(token:string,args:Record<string,unknown>={})=>{
      const response=await f.rpc(token,'tools/call',{name:'redion_list_databases',
        arguments:{workspaceId:'ws_test',limit:1,...args}});
      assert.equal(response.status,200);
      return response.data.result as {isError?:boolean;content:{text:string}[]};
    };
    const expected=['db_visible_a','db_visible_b','db_override'];
    for(let offset=0;offset<expected.length;offset++){
      const result=await list(reader.access_token,{offset});
      assert.notEqual(result.isError,true,JSON.stringify(result));
      const data=JSON.parse(result.content[0]!.text);
      assert.equal(data.workspaceId,'ws_test');
      assert.deepEqual(data.databases.map((x:any)=>x.databaseId),[expected[offset]]);
      assert.equal(data.nextOffset,offset<expected.length-1?offset+1:null);
      assert.equal(data.databases[0].name,[
        'Sichtbare Eins','Sichtbare Zwei','Individuelle Freigabe'][offset]);
      assert.equal(data.databases[0].version,2);
      assert.equal('schema' in data.databases[0],false);
    }
    const exhausted=JSON.parse((await list(reader.access_token,{offset:3})).content[0]!.text);
    assert.deepEqual(exhausted.databases,[]);
    assert.equal(exhausted.nextOffset,null);
    const ownerResult=JSON.parse((await list(owner.access_token,{limit:30})).content[0]!.text);
    assert.deepEqual(ownerResult.databases.map((x:any)=>x.databaseId),
      ['db_secret','db_visible_a','db_visible_b','db_override']);
    const invalidOffset=await list(reader.access_token,{offset:1001});
    assert.equal(invalidOffset.isError,true);
    assert.equal(JSON.parse(invalidOffset.content[0]!.text).code,'invalid_arguments');
    const invalidLimit=await list(reader.access_token,{limit:31});
    assert.equal(invalidLimit.isError,true);
    const wrongWorkspace=await f.rpc(reader.access_token,'tools/call',{
      name:'redion_list_databases',arguments:{workspaceId:'not_granted'}});
    assert.equal(wrongWorkspace.data.result.isError,true);
  }finally{f.close();}
});


test('Cloud-MCP: Tabellenzeilen und Schema beachten Seiten-, Zeilen- und Spaltenrechte',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('konten',{id:'table_reader',mail:'table_reader@example.test',
      name:'table_reader',herkunft:'github',angelegt:'',gesperrt:0});
    const put=async(id:string,tabelle:string,daten:Record<string,unknown>,geaendert='2030-01-01',encrypted=0)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle,
        daten:JSON.stringify(daten),verschluesselt:encrypted,seite:id,version:3,
        geaendert,geloescht:0,vonGeraet:'Test'});
    };
    await put('db_access_page','blocks',{type:'page',text:'Kundenliste',inhalt:''});
    await put('db_restricted_page','blocks',{type:'page',text:'Privat',inhalt:''});
    await put('db_access_block','blocks',{type:'database',collectionId:'db_readable',
      parentId:'db_access_page'});
    const link=await f.store.hole('saetze',{bereich:'ws_test',id:'db_access_block'});
    assert.ok(link);
    await f.store.setze('saetze',{...link,seite:'db_access_page'});
    await put('db_restricted_block','blocks',{type:'database',collectionId:'db_secret',
      parentId:'db_restricted_page'});
    const secretLink=await f.store.hole('saetze',{bereich:'ws_test',id:'db_restricted_block'});
    assert.ok(secretLink);
    await f.store.setze('saetze',{...secretLink,seite:'db_restricted_page'});
    const schema={title:{name:'Name',type:'title'},amount:{name:'Betrag',type:'number'},
      private:{name:'Privates Gehalt',type:'number'}};
    await put('db_readable','collections',{id:'db_readable',name:'Kunden',schema},'2040-01-01');
    await put('db_secret','collections',{id:'db_secret',name:'Nicht freigegeben',schema},'2039-01-01');
    const row=async(id:string,time:string,props:Record<string,unknown>,encrypted=0)=>{
      await put(id,'blocks',{type:'page',parentTable:'collection',
        parentId:'db_readable',text:id,props},time,encrypted);
    };
    await row('row_visible_1','2042-01-01',
      {title:'A',amount:10,private:12345,note:'Feld nicht im Schema'});
    await row('row_private','2041-01-01',{title:'Versteckt',amount:999,private:99999});
    await row('row_visible_2','2040-01-01',{title:'B',amount:20,private:54321});
    await row('row_encrypted','2039-01-01',{title:'Geheim',amount:77},1);
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'table_reader',
      rolle:'lesen',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'row_private',
      kontoId:'table_reader',rolle:'kein',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'db_restricted_page',
      kontoId:'table_reader',rolle:'kein',von:'owner',wann:'2026-11-23'});
    await f.store.setze('feldrechte',{bereich:'ws_test',sammlung:'db_readable',
      feld:'private',kontoId:'table_reader',rolle:'kein',von:'owner',wann:'2026-11-23'});
    const reader=await f.authorize(false,'table_reader');
    const owner=await f.authorize(false);
    const call=async(token:string,params:Record<string,unknown>)=>{
      const r=await f.rpc(token,'tools/call',{name:'redion_read_database',
        arguments:{workspaceId:'ws_test',databaseId:'db_readable',limit:1,...params}});
      assert.equal(r.status,200);
      return r.data.result as {isError?:boolean;content:{text:string}[]};
    };
    const first=await call(reader.access_token,{offset:0});
    assert.notEqual(first.isError,true,JSON.stringify(first));
    const firstData=JSON.parse(first.content[0]!.text);
    assert.equal(firstData.databaseId,'db_readable');
    assert.deepEqual(firstData.columns.map((x:any)=>x.key),['title','amount']);
    assert.equal(firstData.rows.length,1);
    assert.equal(firstData.rows[0].rowId,'row_visible_1');
    assert.deepEqual(firstData.rows[0].values,{title:'A',amount:10});
    assert.equal(firstData.rows[0].version,3);
    assert.equal(firstData.nextOffset,1);
    const second=JSON.parse((await call(reader.access_token,{offset:1})).content[0]!.text);
    assert.equal(second.rows[0].rowId,'row_visible_2');
    assert.equal(second.nextOffset,null);
    const third=JSON.parse((await call(reader.access_token,{offset:2})).content[0]!.text);
    assert.deepEqual(third.rows,[]);
    assert.equal(third.nextOffset,null);
    const ownerData=JSON.parse((await call(owner.access_token,{limit:10})).content[0]!.text);
    assert.deepEqual(ownerData.columns.map((x:any)=>x.key),['title','amount','private']);
    assert.deepEqual(ownerData.rows.map((x:any)=>x.rowId),
      ['row_visible_1','row_private','row_visible_2']);
    const noPage=await call(reader.access_token,{databaseId:'db_secret'});
    assert.equal(noPage.isError,true);
    assert.equal(JSON.parse(noPage.content[0]!.text).code,'not_found');
    const invalid=await call(reader.access_token,{offset:1001});
    assert.equal(invalid.isError,true);
    const noWorkspace=await f.rpc(reader.access_token,'tools/call',{
      name:'redion_read_database',arguments:{workspaceId:'not_granted',databaseId:'db_readable'}});
    assert.equal(noWorkspace.data.result.isError,true);
  }finally{f.close();}
});


test('Cloud-MCP: Aufgabenlisten prüfen Seitenrechte, Statusspalten, Verschlüsselung und sichtbare Offsets',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('konten',{id:'task_reader',mail:'task_reader@example.test',
      name:'Task reader',herkunft:'github',angelegt:'',gesperrt:0});
    const put=async(id:string,table:string,data:Record<string,unknown>,seite=id,time='2030-01-01',encrypted=0)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:table,daten:JSON.stringify(data),
        verschluesselt:encrypted,seite,version:2,geaendert:time,geloescht:0,vonGeraet:'Test'});
    };
    await put('page_public','blocks',{type:'page',text:'Offene Seite',inhalt:''});
    await put('page_private','blocks',{type:'page',text:'Vertrauliche Seite',inhalt:''});
    await put('page_encrypted','blocks',{type:'page',text:'Verschlüsselt',inhalt:''},'page_encrypted','2030-01-01',1);
    await put('todo_open','blocks',{type:'todo',text:'Öffentliche Aufgabe',checked:false},
      'page_public','2045-01-01');
    await put('todo_done','blocks',{type:'todo',text:'Erledigte Aufgabe',checked:true},
      'page_public','2044-01-01');
    await put('todo_private','blocks',{type:'todo',text:'Geheime Aufgabe',checked:false},
      'page_private','2043-01-01');
    await put('todo_encrypted_parent','blocks',{type:'todo',text:'Verschlüsselter Elternblock',checked:false},
      'page_encrypted','2042-01-01');
    await put('todo_encrypted','blocks',{type:'todo',text:'Verschlüsselter Block',checked:false},
      'page_public','2042-01-01',1);
    await put('todo_no_text','blocks',{type:'todo',text:'   ',checked:false},
      'page_public','2041-01-01');
    const schema={title:{name:'Titel',type:'title'},status:{
      name:'Stand',type:'status',options:[{name:'Offen'},{name:'Erledigt'}]},due:{name:'Fällig',type:'date'}};
    const blockedSchema={title:{name:'Titel',type:'title'},
      status:{name:'Privater Stand',type:'status'}};
    await put('coll_public','collections',{id:'coll_public',name:'Aufgabenbank',schema},
      'coll_public','2040-01-01');
    await put('coll_hidden_status','collections',{id:'coll_hidden_status',name:'Versteckt',schema:blockedSchema},
      'coll_hidden_status','2039-01-01');
    await put('coll_private','collections',{id:'coll_private',name:'Privat',schema},
      'coll_private','2038-01-01');
    await put('link_public','blocks',{type:'database',collectionId:'coll_public',parentId:'page_public'},
      'page_public');
    await put('link_hidden_status','blocks',{type:'database',collectionId:'coll_hidden_status',
      parentId:'page_public'},'page_public');
    await put('link_private','blocks',{type:'database',collectionId:'coll_private',parentId:'page_private'},
      'page_private');
    const row=async(id:string,collection:string,props:Record<string,unknown>,time:string,encrypted=0)=>{
      await put(id,'blocks',{type:'page',text:'Zeile '+id,parentId:collection,
        parentTable:'collection',props},id,time,encrypted);
    };
    await row('row_open','coll_public',{title:'Aufgabe',status:'Offen',due:'2026-12-01'},'2038-01-01');
    await row('row_done','coll_public',{title:'Aufgabe',status:{name:'Erledigt'}},'2037-01-01');
    await row('row_forbidden','coll_public',{title:'Geheim',status:'Offen'},'2036-01-01');
    await row('row_encrypted','coll_public',{title:'Geheim',status:'Offen'},'2035-01-01',1);
    await row('row_hidden_field','coll_hidden_status',{status:'Offen'},'2034-01-01');
    await row('row_private_collection','coll_private',{status:'Offen'},'2033-01-01');
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'task_reader',
      rolle:'lesen',von:'owner',wann:'2026-11-23'});
    for(const pageId of ['page_private','row_forbidden']){
      await f.store.setze('freigaben',{bereich:'ws_test',seite:pageId,kontoId:'task_reader',
        rolle:'kein',von:'owner',wann:'2026-11-23'});
    }
    await f.store.setze('feldrechte',{bereich:'ws_test',sammlung:'coll_hidden_status',
      feld:'status',kontoId:'task_reader',rolle:'kein',von:'owner',wann:'2026-11-23'});
    const token=await f.authorize(false,'task_reader');
    const invoke=async(args:Record<string,unknown>)=>{
      const reply=await f.rpc(token.access_token,'tools/call',{name:'redion_list_tasks',
        arguments:{workspaceId:'ws_test',...args}});
      assert.equal(reply.status,200);
      return reply.data.result as {isError?:boolean;content:{text:string}[]};
    };
    const all=await invoke({nurOffen:false,limit:40});
    assert.notEqual(all.isError,true,JSON.stringify(all));
    const payload=JSON.parse(all.content[0]!.text);
    assert.deepEqual(payload.tasks.map((t:any)=>t.taskId),['todo_open','todo_done','row_open','row_done']);
    assert.equal(payload.tasks.some((t:any)=>String(t.title).includes('Geheim')),false);
    assert.equal(payload.tasks.find((t:any)=>t.taskId==='row_open').faellig,'2026-12-01');
    assert.equal(payload.tasks.find((t:any)=>t.taskId==='row_done').fertig,true);
    assert.equal(payload.nextOffset,null);
    const onlyOpen=JSON.parse((await invoke({nurOffen:true,limit:1})).content[0]!.text);
    assert.deepEqual(onlyOpen.tasks.map((t:any)=>t.taskId),['todo_open']);
    assert.equal(onlyOpen.nextOffset,1);
    const next=JSON.parse((await invoke({nurOffen:true,limit:1,offset:1})).content[0]!.text);
    assert.deepEqual(next.tasks.map((t:any)=>t.taskId),['row_open']);
    assert.equal(next.nextOffset,null);
    const badOffset=await invoke({offset:1001});
    assert.equal(badOffset.isError,true);
    const badOpen=await invoke({nurOffen:'nein'});
    assert.equal(badOpen.isError,true);
    const noWorkspace=await f.rpc(token.access_token,'tools/call',{name:'redion_list_tasks',
      arguments:{workspaceId:'not_granted'}});
    assert.equal(noWorkspace.data.result.isError,true);
  }finally{f.close();}
});

test('Cloud-MCP: Blockkatalog ist lesend, enthält interne Arten und keine Menüaktionen',async()=>{
  const f=await fixture();
  try{
    const token=await f.authorize(false);
    const list=await f.rpc(token.access_token,'tools/call',{name:'redion_list_block_types',arguments:{}});
    assert.equal(list.status,200);
    const result=JSON.parse(list.data.result.content[0]!.text);
    assert.equal(result.total,56);
    assert.equal(result.externalExtensionsIncluded,false);
    assert.ok(result.blockTypes.some((x:any)=>x.id==='todo'&&x.insertable===true));
    assert.ok(result.blockTypes.some((x:any)=>x.id==='schaltplan'&&x.gruppe==='Wissen'));
    assert.ok(result.blockTypes.some((x:any)=>x.id==='pdfseite'&&x.insertable===false));
    assert.equal(result.blockTypes.some((x:any)=>x.id==='a-del'),false);
    // Repeating the same consent is not needed here: the existing token
    // already verifies read-only access without any write scope.
    const again=await f.rpc(token.access_token,'tools/call',{name:'redion_list_block_types',arguments:{}});
    assert.equal(again.data.result.isError,undefined);
  }finally{f.close();}
});


test('Cloud-MCP: Block lesen schützt Seiten, geheime Kinder und Datenbankzeilen',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('konten',{id:'block_reader',mail:'block_reader@example.test',
      name:'Block Reader',herkunft:'github',angelegt:'',gesperrt:0});
    const put=async(id:string,data:Record<string,unknown>,seite=id,encrypted=0,deleted=0)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify(data),verschluesselt:encrypted,seite,
        version:4,geaendert:'2030-01-01',geloescht:deleted,vonGeraet:'Test'});
    };
    await put('block_page_public',{type:'page',text:'Frei',inhalt:'Seiteninhalt'});
    await put('block_page_private',{type:'page',text:'Geheim',inhalt:'Nicht lesen'});
    await put('block_page_encrypted',{type:'page',text:'Unsichtbar'},'block_page_encrypted',1);
    await put('block_parent',{type:'toggle',text:'Lesbarer Block',parentId:'block_page_public',
      content:['block_child','block_secret_child','block_deleted_child',
        'block_foreign_child','block_unrelated_child','missing_child'],
      children:['raw_unchecked_child']},'block_page_public');
    await put('block_child',{type:'text',text:'Kind',parentId:'block_parent'},'block_page_public');
    await put('block_secret_child',{type:'text',text:'Verschlüsselt',parentId:'block_parent'},
      'block_page_public',1);
    await put('block_deleted_child',{type:'text',text:'Papierkorb',parentId:'block_parent'},
      'block_page_public',0,1);
    await put('block_foreign_child',{type:'text',text:'Andere Seite',parentId:'block_parent'},
      'block_page_private');
    await put('block_unrelated_child',{type:'text',text:'Falsche Eltern',parentId:'block_page_public'},
      'block_page_public');
    await put('block_private',{type:'text',text:'Vertraulicher Inhalt',parentId:'block_page_private'},
      'block_page_private');
    await put('block_encrypted_parent',{type:'text',text:'Klartext aber Eltern verschlüsselt',
      parentId:'block_page_encrypted'},'block_page_encrypted');
    await put('block_row',{type:'page',parentTable:'collection',parentId:'db_secret',
      text:'Geheime Zeile',props:{salary:1000}},'block_row');
    await put('block_orphan',{type:'text',text:'Ohne Seite'},'block_orphan');
    await put('block_oversized',{type:'code',text:'x'.repeat(12500),parentId:'block_page_public'},
      'block_page_public');
    const schematic={art:'stromlauf',teile:[{id:'t1',zeichen:'schliesser',bmk:'S1',x:20,y:20}],
      leitungen:[{id:'l1',punkte:[{x:20,y:20},{x:30,y:20}]}],
      texte:[{id:'caption',text:'Steuerkreis'}]};
    await put('block_schematic',{type:'schaltplan',text:'Schaltplan',parentId:'block_page_public',plan:schematic},
      'block_page_public');
    await put('block_secret_schematic',{type:'schaltplan',parentId:'block_page_private',plan:schematic},
      'block_page_private');

    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'block_reader',
      rolle:'lesen',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'block_page_private',
      kontoId:'block_reader',rolle:'kein',von:'owner',wann:'2026-11-23'});
    const reader=await f.authorize(false,'block_reader');
    const tool=async(id:string,w='ws_test')=>{
      const response=await f.rpc(reader.access_token,'tools/call',{
        name:'redion_read_block',arguments:{workspaceId:w,blockId:id}});
      assert.equal(response.status,200);
      return response.data.result as {isError?:boolean;content:{text:string}[];structuredContent?:unknown};
    };
    const ok=await tool('block_parent');
    assert.notEqual(ok.isError,true,JSON.stringify(ok));
    const data=JSON.parse(ok.content[0]!.text);
    assert.equal(data.type,'toggle');
    assert.equal(data.documentId,'block_page_public');
    assert.equal(data.version,4);
    assert.equal(data.text,'Lesbarer Block');
    assert.deepEqual(data.children,['block_child']);
    assert.deepEqual(data.data.content,['block_child']);
    assert.equal('children' in data.data,false);
    assert.deepEqual(ok.structuredContent,data);
    const schematicReply=await f.rpc(reader.access_token,'tools/call',{
      name:'redion_read_schematic',
      arguments:{workspaceId:'ws_test',blockId:'block_schematic'}});
    assert.equal(schematicReply.status,200);
    assert.equal(schematicReply.data.result.isError,undefined);
    const schematicData=JSON.parse(schematicReply.data.result.content[0]!.text);
    assert.deepEqual(schematicData.plan,schematic);
    assert.deepEqual(schematicData.teile,schematic.teile);
    assert.deepEqual(schematicData.leitungen,schematic.leitungen);
    assert.equal(schematicData.version,4);
    for(const id of ['block_private','block_secret_schematic','block_row','block_parent']){
      const bad=await f.rpc(reader.access_token,'tools/call',{
        name:'redion_read_schematic',arguments:{workspaceId:'ws_test',blockId:id}});
      assert.equal(bad.data.result.isError,true,id);
    }
    const page=JSON.parse((await tool('block_page_public')).content[0]!.text);
    assert.equal(page.type,'page');
    assert.equal(page.data.inhalt,'Seiteninhalt');
    for(const id of ['block_private','block_encrypted_parent','block_row','block_orphan']){
      const rejected=await tool(id);
      assert.equal(rejected.isError,true,id);
      const err=JSON.parse(rejected.content[0]!.text);
      assert.ok(['not_found','encrypted','forbidden'].includes(err.code),id+': '+JSON.stringify(err));
    }
    const tooLarge=await tool('block_oversized');
    assert.equal(tooLarge.isError,true);
    assert.equal(JSON.parse(tooLarge.content[0]!.text).code,'too_large');
    const invalidWorkspace=await tool('block_parent','not_granted');
    assert.equal(invalidWorkspace.isError,true);
    assert.equal(JSON.parse(invalidWorkspace.content[0]!.text).code,'forbidden');
    const owner=await f.authorize(false);
    const owned=await f.rpc(owner.access_token,'tools/call',{
      name:'redion_read_block',arguments:{workspaceId:'ws_test',blockId:'block_private'}});
    assert.equal(owned.data.result.isError,undefined);
  }finally{f.close();}
});
