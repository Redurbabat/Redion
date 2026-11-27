import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {SCHEMA,ablageD1} from '../server/ablage.ts';
import {mcpStateD1,type McpDatabase} from '../server/mcp/state.ts';
import {createMcpOAuth,pkceChallenge} from '../server/mcp/oauth.ts';
import {handleCloudMcp,isCloudMcpPublicPath,isCloudMcpPrivatePath} from '../server/mcp/cloud-router.ts';
import {createCloudActions} from '../server/mcp/cloud-tools.ts';
import {_intern as redionKern} from '../server/kern.ts';
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
        async all<T>(){return {results:sqlite.prepare(sql).all(...bound()) as T[]};},
        async run(){return sqlite.prepare(sql).run(...bound());}
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
  const authorize=async(write:boolean,accountId='owner',clientForGrant=client)=>{
    const client=clientForGrant;
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
      const list=await client.listTools();assert.equal(list.tools.length,16);
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
    const legacyLarge=JSON.parse((await call(reader.access_token,{limit:50})).content[0]!.text);
    assert.equal(legacyLarge.requestedLimit,50);
    assert.equal(legacyLarge.effectiveLimit,10);
    assert.equal(legacyLarge.limitCapped,true);
    assert.deepEqual(legacyLarge.rows.map((x:any)=>x.rowId),
      ['row_visible_1','row_visible_2']);
    const legacyMaximum=JSON.parse((await call(reader.access_token,{limit:500})).content[0]!.text);
    assert.equal(legacyMaximum.limitCapped,true);
    assert.equal(legacyMaximum.effectiveLimit,10);
    const rejectAbove=await call(reader.access_token,{limit:501});
    assert.equal(rejectAbove.isError,true);
    assert.equal(JSON.parse(rejectAbove.content[0]!.text).code,'invalid_arguments');
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
    await put('block_page_public',{type:'page',text:'Frei',inhalt:'Seiteninhalt',content:['block_parent','block_schematic']});
    await put('block_page_private',{type:'page',text:'Geheim',inhalt:'Nicht lesen',content:['block_secret_schematic']});
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


test('Cloud-MCP: atomare Block- und Aufgabenerstellung ist sichtbar, versioniert und idempotent',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('saetze',{id:'task_page',bereich:'ws_test',tabelle:'blocks',
      daten:JSON.stringify({type:'page',text:'Lernaufgaben',inhalt:'Unveränderter Markdown-Inhalt'}),
      verschluesselt:0,seite:'task_page',version:1,geaendert:'2026-11-23',
      geloescht:0,vonGeraet:'Test'});
    const reader=await f.authorize(false,'owner');
    const denied=await f.rpc(reader.access_token,'tools/call',{name:'redion_add_block',
      arguments:{workspaceId:'ws_test',documentId:'task_page',typ:'todo',
        text:'Lernkarte wiederholen',expectedVersion:1}});
    assert.equal(denied.data.result.isError,true);
    assert.equal(JSON.parse(denied.data.result.content[0]!.text).code,'forbidden');
    const writer=await f.authorize(true);
    const token=writer.access_token;
    const call=async(p:Record<string,unknown>)=>{
      const result=await f.rpc(token,'tools/call',{name:'redion_add_block',
        arguments:{workspaceId:'ws_test',documentId:'task_page',...p}});
      assert.equal(result.status,200);
      return result.data.result as {isError?:boolean;content:{text:string}[]};
    };
    const args={typ:'todo',text:'Lernkarte wiederholen',expectedVersion:1,
      daten:{faellig:'2026-12-12',notiz:'Im ÜK nochmals kontrollieren'},
      requestId:'unique_task_001'};
    const first=await call(args);
    assert.notEqual(first.isError,true,JSON.stringify(first));
    const a=JSON.parse(first.content[0]!.text);
    assert.equal(a.documentId,'task_page');
    assert.equal(a.version,1);
    assert.equal(a.parentVersion,2);
    assert.equal(a.alreadyExists,false);
    assert.match(a.blockId,/^[a-f0-9]{32}$/);
    const row=await f.store.hole('saetze',{bereich:'ws_test',id:a.blockId});
    assert.ok(row);
    assert.equal(row.verschluesselt,0);
    assert.equal(row.tabelle,'blocks');
    assert.equal(row.seite,'task_page');
    const payload=JSON.parse(row.daten);
    assert.equal(payload.type,'todo');
    assert.equal(payload.checked,false);
    assert.equal(payload.parentId,'task_page');
    assert.equal(payload.parentTable,'block');
    assert.equal(payload.faellig,'2026-12-12');
    assert.equal(payload.notiz,'Im ÜK nochmals kontrollieren');
    const page=await f.store.hole('saetze',{bereich:'ws_test',id:'task_page'});
    assert.ok(page);
    const pageData=JSON.parse(page.daten);
    assert.equal(page.version,2);
    assert.deepEqual(pageData.content,[a.blockId]);
    assert.equal(pageData.inhalt,'Unveränderter Markdown-Inhalt');
    const read=await f.rpc(token,'tools/call',{
      name:'redion_read_block',arguments:{workspaceId:'ws_test',blockId:a.blockId}});
    assert.equal(JSON.parse(read.data.result.content[0]!.text).type,'todo');
    const list=await f.rpc(token,'tools/call',{name:'redion_list_tasks',
      arguments:{workspaceId:'ws_test',nurOffen:true}});
    const tasks=JSON.parse(list.data.result.content[0]!.text).tasks;
    assert.ok(tasks.some((x:any)=>x.taskId===a.blockId));
    const retry=await call(args);
    assert.notEqual(retry.isError,true);
    const same=JSON.parse(retry.content[0]!.text);
    assert.equal(same.alreadyExists,true);
    assert.equal(same.blockId,a.blockId);
    assert.equal(same.parentVersion,2);
    assert.equal((await f.store.hole('saetze',{bereich:'ws_test',id:'task_page'}))!.version,2);
    const reusingKey=await call({...args,text:'Andere Aufgabe'});
    assert.equal(reusingKey.isError,true);
    assert.equal(JSON.parse(reusingKey.content[0]!.text).code,'conflict');
    const stale=await call({typ:'text',text:'Neue Überschrift',expectedVersion:1,
      requestId:'different_task_001'});
    assert.equal(stale.isError,true);
    assert.equal(JSON.parse(stale.content[0]!.text).code,'conflict');
    // No detached orphan block is created by a stale request.
    const all=await f.store.finde('saetze',{bereich:'ws_test',tabelle:'blocks'});
    assert.equal(all.length,2);
    const second=await call({typ:'h2',text:'Kapitel 2',expectedVersion:2});
    assert.notEqual(second.isError,true);
    const b=JSON.parse(second.content[0]!.text);
    assert.equal(b.parentVersion,3);
    const secondRetry=JSON.parse((await call({typ:'h2',text:'Kapitel 2',
      expectedVersion:2})).content[0]!.text);
    assert.equal(secondRetry.alreadyExists,true);
    assert.equal(secondRetry.blockId,b.blockId);
    const finalPage=await f.store.hole('saetze',{bereich:'ws_test',id:'task_page'});
    assert.deepEqual(JSON.parse(finalPage!.daten).content,[a.blockId,b.blockId]);
  }finally{f.close();}
});

test('Cloud-MCP: Blockerstellung lehnt verbotene Typen, Fremdseiten, Geheimdaten und ungültige Angaben ab',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('konten',{id:'block_collab',mail:'block_collab@example.test',
      name:'Block collaborator',herkunft:'github',angelegt:'',gesperrt:0});
    const put=async(id:string,version=1,encrypted=0)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify({type:'page',text:id,content:[]}),
        verschluesselt:encrypted,seite:id,version,geaendert:'2026-11-23',
        geloescht:0,vonGeraet:'Test'});
    };
    await put('open_page');
    await put('private_page');
    await put('encrypted_page',1,1);
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'block_collab',
      rolle:'edit',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'private_page',
      kontoId:'block_collab',rolle:'kein',von:'owner',wann:'2026-11-23'});
    const writer=await f.authorize(true,'block_collab');
    const invoke=async(arguments_:Record<string,unknown>)=>{
      const result=await f.rpc(writer.access_token,'tools/call',{
        name:'redion_add_block',arguments:{workspaceId:'ws_test',documentId:'open_page',
          typ:'text',text:'Hallo',expectedVersion:1,...arguments_}});
      assert.equal(result.status,200);
      return result.data.result as {isError?:boolean;content:{text:string}[]};
    };
    const badCases=[
      {typ:'schaltplan',text:'a'},
      {typ:'database'},
      {typ:'todo',text:'  '},
      {typ:'todo',daten:{checked:true}},
      {typ:'todo',daten:{faellig:'2026-02-30'}},
      {typ:'todo',daten:{notiz:'x'.repeat(2001)}},
      {typ:'h2',daten:{parentId:'private_page'}},
      {inBlockId:'some_nested_parent'},
      {requestId:'bad'},
      {expectedVersion:0}
    ];
    for(const item of badCases){
      const result=await invoke(item);
      assert.equal(result.isError,true,JSON.stringify(item));
      assert.equal(JSON.parse(result.content[0]!.text).code,'invalid_arguments',JSON.stringify(item));
    }
    const privatePage=await invoke({documentId:'private_page'});
    assert.equal(privatePage.isError,true);
    assert.equal(JSON.parse(privatePage.content[0]!.text).code,'forbidden');
    const encryptedPage=await invoke({documentId:'encrypted_page'});
    assert.equal(encryptedPage.isError,true);
    assert.equal(JSON.parse(encryptedPage.content[0]!.text).code,'encrypted');
    const outside=await invoke({workspaceId:'foreign_workspace'});
    assert.equal(outside.isError,true);
    const first=await invoke({typ:'todo',text:'Nur im offenen Projekt'});
    assert.notEqual(first.isError,true,JSON.stringify(first));
    const item=JSON.parse(first.content[0]!.text);
    const siblings=await f.store.finde('saetze',{bereich:'ws_test',tabelle:'blocks'});
    assert.equal(siblings.length,4);
    assert.equal(JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:'open_page'}))!.daten).content[0],item.blockId);
    // At most one of two same-version competing writes is accepted.
    const competitors=await Promise.all([
      invoke({typ:'h2',text:'First',expectedVersion:2,requestId:'concurrent_first'}),
      invoke({typ:'h2',text:'Second',expectedVersion:2,requestId:'concurrent_second'})
    ]);
    assert.equal(competitors.filter(x=>x.isError!==true).length,1);
    assert.equal(competitors.filter(x=>x.isError===true).length,1);
    const updated=await f.store.hole('saetze',{bereich:'ws_test',id:'open_page'});
    const ids=JSON.parse(updated!.daten).content as string[];
    assert.equal(ids.length,2);
    const all=await f.store.finde('saetze',{bereich:'ws_test',tabelle:'blocks'});
    assert.equal(all.length,5);
    assert.equal(new Set(ids).size,ids.length);
  }finally{f.close();}
});


test('Cloud-MCP: ohne atomare D1-Batch-Funktion wird kein Block erstellt',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('saetze',{id:'batch_guard_page',bereich:'ws_test',tabelle:'blocks',
      daten:JSON.stringify({type:'page',text:'Sicherungsseite',content:[]}),
      verschluesselt:0,seite:'batch_guard_page',version:1,geaendert:'2026-11-23',
      geloescht:0,vonGeraet:'Test'});
    const noBatch={prepare:f.db.prepare.bind(f.db)};
    const action=createCloudActions(f.store,noBatch,{
      userId:'owner',clientId:'test-client',grantId:'guard-test',
      workspaceIds:['ws_test'],scopes:['redion:read','redion:write']
    });
    await assert.rejects(
      action('redion_add_block',{workspaceId:'ws_test',documentId:'batch_guard_page',
        expectedVersion:1,typ:'todo',text:'Darf nicht gespeichert werden'}),
      (error:any)=>error?.reason==='unavailable');
    assert.equal((await f.store.finde('saetze',{bereich:'ws_test',tabelle:'blocks'})).length,1);
    assert.deepEqual(JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:'batch_guard_page'}))!.daten).content,[]);
  }finally{f.close();}
});

test('Cloud-MCP: Test-Datenbank rollt vollständige Batch-Schreibfehler zurück',async()=>{
  const f=await fixture();
  try{
    assert.ok(f.db.batch);
    await assert.rejects(f.db.batch!([
      f.db.prepare("INSERT INTO saetze(id,bereich,tabelle,daten,seite,version,geaendert) "+
        "VALUES(?1,?2,'blocks',?3,?4,1,?5) RETURNING id")
        .bind('rolled_back','ws_test','{"type":"todo"}','rolled_back','2030-01-01'),
      f.db.prepare("INSERT INTO a_table_that_does_not_exist(id) VALUES('bad') RETURNING id")
    ]));
    assert.equal(await f.store.hole('saetze',{bereich:'ws_test',id:'rolled_back'}),null);
  }finally{f.close();}
});


test('Cloud-MCP: paginiert mehr als 40 Seitenblöcke ohne geheime IDs oder Reihenfolgeverlust',async()=>{
  const f=await fixture();
  try{
    const ids=Array.from({length:52},(_,i)=>'paging_child_'+i);
    const excluded=new Set([7,21,25,31]);
    const content=[...ids,ids[30],'paging_missing'];
    const put=async(id:string,data:Record<string,unknown>,seite='paging_page',encrypted=0,deleted=0)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify(data),verschluesselt:encrypted,seite,
        version:5,geaendert:'2026-11-23',geloescht:deleted,vonGeraet:'Test'});
    };
    await put('paging_page',{type:'page',text:'Viele Blöcke',inhalt:'',content},'paging_page');
    for(let i=0;i<ids.length;i++){
      await put(ids[i]!,{type:'text',text:'Block '+i,parentId:i===25?'falscher_elternblock':'paging_page',
        content:i===2?['paging_nested_visible','paging_nested_secret']:[]},
        i===31?'andere_seite':'paging_page',i===7?1:0,i===21?1:0);
    }
    await put('paging_nested_visible',{type:'todo',text:'Verschachtelt',parentId:ids[2]});
    await put('paging_nested_secret',{type:'text',text:'Geheim',parentId:ids[2]},
      'paging_page',1);
    const reader=await f.authorize(false);
    const invoke=async(args:Record<string,unknown>,token=reader.access_token)=>{
      const response=await f.rpc(token,'tools/call',{name:'redion_list_page_blocks',
        arguments:{workspaceId:'ws_test',documentId:'paging_page',...args}});
      assert.equal(response.status,200);
      const result=response.data.result as {isError?:boolean;content:{text:string}[];structuredContent?:unknown};
      const value=JSON.parse(result.content[0]!.text);
      if(result.isError!==true)assert.deepEqual(result.structuredContent,value);
      return {result,value};
    };
    const page=await f.rpc(reader.access_token,'tools/call',{name:'redion_read_page',
      arguments:{workspaceId:'ws_test',documentId:'paging_page'}});
    const parsedPage=JSON.parse(page.data.result.content[0]!.text);
    assert.equal(parsedPage.markdown,'');
    assert.equal(parsedPage.blockStorage,'referenced');
    assert.equal(parsedPage.blockPreview.length,20);
    assert.equal(parsedPage.blockPreview[0].text,'Block 0');
    assert.equal(parsedPage.nextBlockOffset,20);
    assert.equal(parsedPage.blockPreview.some((x:any)=>excluded.has(
      Number(x.blockId.replace('paging_child_','')))),false);
    const pageWindow=await f.rpc(reader.access_token,'tools/call',{name:'redion_read_page',
      arguments:{workspaceId:'ws_test',documentId:'paging_page',
        blockOffset:20,blockLimit:10,expectedVersion:5}});
    assert.equal(pageWindow.status,200);
    const after=JSON.parse(pageWindow.data.result.content[0]!.text);
    assert.equal(after.blockPreview.length,10);
    assert.equal(after.nextBlockOffset,30);
    const legacy=await f.rpc(reader.access_token,'tools/call',{name:'redion_read_block',
      arguments:{workspaceId:'ws_test',blockId:'paging_page'}});
    assert.notEqual(legacy.data.result.isError,true);
    const legacyData=JSON.parse(legacy.data.result.content[0]!.text);
    assert.equal(legacyData.children.length,40);
    assert.equal(legacyData.childrenTruncated,true);
    assert.equal(legacyData.nextChildOffset,40);
    const legacyTail=await f.rpc(reader.access_token,'tools/call',{name:'redion_read_block',
      arguments:{workspaceId:'ws_test',blockId:'paging_page',childOffset:40}});
    assert.notEqual(legacyTail.data.result.isError,true);
    const tail=JSON.parse(legacyTail.data.result.content[0]!.text);
    assert.equal(tail.children.length,8);
    assert.equal(tail.nextChildOffset,null);
    assert.equal(tail.childrenTruncated,false);
    assert.deepEqual(new Set([...legacyData.children,...tail.children]).size,48);

    const all:string[]=[];
    let next:number|null=0;
    for(let pass=0;next!==null&&pass<10;pass++){
      const {result,value}=await invoke({offset:next,limit:10,expectedVersion:5});
      assert.notEqual(result.isError,true);
      assert.equal(value.parentVersion,5);
      assert.equal(value.blocks.length<=10,true);
      all.push(...value.blocks.map((x:{blockId:string})=>x.blockId));
      next=value.nextOffset;
    }
    assert.equal(next,null,'Paginierung muss enden');
    assert.deepEqual(all,ids.filter((_,i)=>!excluded.has(i)));
    assert.equal(all.length,48);
    const nested=await invoke({parentBlockId:ids[2],limit:5,expectedVersion:5});
    assert.deepEqual(nested.value.blocks.map((x:{blockId:string})=>x.blockId),
      ['paging_nested_visible']);
    assert.equal(nested.value.parentBlockId,ids[2]);
    assert.equal(nested.value.nextOffset,null);
    assert.equal((await invoke({offset:0,limit:100})).value.code,'invalid_arguments');
    assert.equal((await invoke({expectedVersion:4})).value.code,'conflict');
    assert.equal((await invoke({parentBlockId:'paging_nested_secret'})).value.code,'not_found');
    assert.equal((await invoke({parentBlockId:ids[31]})).value.code,'not_found');
    assert.equal((await invoke({parentBlockId:ids[2],expectedVersion:5})).result.isError,undefined);

    await f.store.setze('konten',{id:'paging_reader',mail:'paging@example.test',
      name:'Paging Reader',herkunft:'github',angelegt:'',gesperrt:0});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'paging_reader',
      rolle:'lesen',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'paging_page',kontoId:'paging_reader',
      rolle:'kein',von:'owner',wann:'2026-11-23'});
    const deniedReader=await f.authorize(false,'paging_reader');
    const denied=await invoke({},deniedReader.access_token);
    assert.equal(denied.result.isError,true);
    assert.equal(denied.value.code,'forbidden');
  }finally{f.close();}
});


test('Cloud-MCP: Schweizer Fachzeichen sind filterbar und ohne Schreibrechte abrufbar',async()=>{
  const f=await fixture();
  try{
    const reader=await f.authorize(false);
    const invoke=async(args:Record<string,unknown>)=>{
      const result=await f.rpc(reader.access_token,'tools/call',{
        name:'redion_list_symbols',arguments:args
      });
      assert.equal(result.status,200);
      const payload=result.data.result;
      const parsed=JSON.parse(payload.content[0].text);
      if(!payload.isError)assert.deepEqual(payload.structuredContent,parsed);
      return {payload,parsed};
    };
    const all=await invoke({});
    assert.equal(all.payload.isError,undefined);
    assert.equal(all.parsed.total,131);
    assert.equal(all.parsed.raster,10);
    assert.equal(all.parsed.externalExtensionsIncluded,false);
    assert.equal(all.parsed.symbols.length,131);
    const filtered=await invoke({gruppe:'ch-bauplan',suche:'typ 13'});
    assert.ok(filtered.parsed.total>=1);
    assert.ok(filtered.parsed.symbols.some((x:any)=>x.id==='bp-t13'));
    assert.ok(filtered.parsed.symbols.every((x:any)=>x.gruppe==='ch-bauplan'));
    const plan=await invoke({gruppe:'ch-schema',suche:'schema 6'});
    assert.ok(plan.parsed.symbols.some((x:any)=>
      x.id==='ch-schema6'&&x.anschluesse.length===4));
    const invalid=await invoke({suche:'x'.repeat(81)});
    assert.equal(invalid.payload.isError,true);
    assert.equal(invalid.parsed.code,'invalid_arguments');
  }finally{f.close();}
});


test('Cloud-MCP: ein nativer Schaltplan wird atomar, sicher und wiederholbar erstellt',async()=>{
  const f=await fixture();
  try{
    const put=async(id:string,encrypted=0)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify({type:'page',text:id,inhalt:'Bestehende Notizen',content:[]}),
        verschluesselt:encrypted,seite:id,version:1,geaendert:'2026-11-23',
        geloescht:0,vonGeraet:'Test'});
    };
    await put('schematic_test_page');
    await put('schematic_secret_page',1);
    const reader=await f.authorize(false);
    const args={workspaceId:'ws_test',documentId:'schematic_test_page',
      art:'installationsplan',titel:'12-V Sonnerie',expectedVersion:1,
      requestId:'schematic_safe_2026_01'};
    const call=async(token:string,params:Record<string,unknown>)=>{
      const response=await f.rpc(token,'tools/call',{
        name:'redion_add_schematic',arguments:{...args,...params}});
      assert.equal(response.status,200);
      const outcome=response.data.result as {isError?:boolean;content:{text:string}[]};
      return {outcome,data:JSON.parse(outcome.content[0]!.text)};
    };
    const denied=await call(reader.access_token,{});
    assert.equal(denied.outcome.isError,true);
    assert.equal(denied.data.code,'forbidden');
    const writer=await f.authorize(true);
    const token=writer.access_token;
    const created=await call(token,{});
    assert.equal(created.outcome.isError,undefined);
    const id=created.data.blockId;
    assert.match(id,/^[a-f0-9]{32}$/);
    assert.equal(created.data.parentVersion,2);
    assert.equal(created.data.alreadyExists,false);
    const row=await f.store.hole('saetze',{bereich:'ws_test',id});
    assert.ok(row);
    assert.equal(row.tabelle,'blocks');
    assert.equal(row.verschluesselt,0);
    assert.equal(row.seite,'schematic_test_page');
    const data=JSON.parse(row.daten);
    assert.equal(data.type,'schaltplan');
    assert.equal(data.text,'12-V Sonnerie');
    assert.equal(data.parentId,'schematic_test_page');
    assert.deepEqual(data.content,[]);
    assert.equal(data.plan.art,'installationsplan');
    assert.equal(data.plan.breite,1000);
    assert.equal(data.plan.hoehe,600);
    assert.deepEqual(data.plan.teile,[]);
    assert.deepEqual(data.plan.leitungen,[]);
    assert.deepEqual(data.plan.texte,[]);
    assert.deepEqual(data.plan.ebenen.map((e:any)=>e.id),['plan','aufgabe','loesung']);
    const read=await f.rpc(token,'tools/call',{
      name:'redion_read_schematic',arguments:{workspaceId:'ws_test',blockId:id}});
    assert.equal(read.data.result.isError,undefined);
    const schematic=JSON.parse(read.data.result.content[0]!.text);
    assert.deepEqual(schematic.plan,data.plan);
    const listed=await f.rpc(token,'tools/call',{name:'redion_list_page_blocks',
      arguments:{workspaceId:'ws_test',documentId:'schematic_test_page'}});
    assert.deepEqual(JSON.parse(listed.data.result.content[0]!.text).blocks.map((x:any)=>x.blockId),[id]);
    const retry=await call(token,{});
    assert.equal(retry.data.alreadyExists,true);
    assert.equal(retry.data.blockId,id);
    assert.equal(retry.data.parentVersion,2);
    const changed=await call(token,{art:'hauptstromkreis'});
    assert.equal(changed.outcome.isError,true);
    assert.equal(changed.data.code,'conflict');
    const stale=await call(token,{requestId:'schematic_different_2026',art:'klemmenplan'});
    assert.equal(stale.outcome.isError,true);
    assert.equal(stale.data.code,'conflict');
    const bad=await call(token,{art:'stromlauf-ungueltig'});
    assert.equal(bad.outcome.isError,true);
    assert.equal(bad.data.code,'invalid_arguments');
    const title=await call(token,{titel:'   '});
    assert.equal(title.outcome.isError,true);
    assert.equal(title.data.code,'invalid_arguments');
    const encrypted=await call(token,{documentId:'schematic_secret_page'});
    assert.equal(encrypted.outcome.isError,true);
    assert.equal(encrypted.data.code,'encrypted');
    const outside=await call(token,{workspaceId:'foreign_workspace'});
    assert.equal(outside.outcome.isError,true);
    assert.equal(outside.data.code,'forbidden');
    const all=await f.store.finde('saetze',{bereich:'ws_test',tabelle:'blocks'});
    assert.equal(all.length,3,'Ein Fehler darf keinen verwaisten Schaltplan speichern.');
  }finally{f.close();}
});


test('Cloud-MCP: Schaltplanbearbeitung prüft Symbole, reale Klemmen, ACL und atomare Versionen',async()=>{
  const f=await fixture();
  try{
    // Separate users avoid OAuth grant replacement when switching scope.
    await f.store.setze('konten',{id:'schematic_reader',mail:'schematic_reader@example.test',
      name:'Schematic Reader',herkunft:'github',angelegt:'',gesperrt:0});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'schematic_reader',
      rolle:'lesen',von:'owner',wann:'2026-11-23'});
    const readOnly=await f.authorize(false,'schematic_reader');
    const writer=await f.authorize(true);
    await f.store.setze('saetze',{id:'edit_schematic_page',bereich:'ws_test',tabelle:'blocks',
      daten:JSON.stringify({type:'page',text:'Elektro',inhalt:'',content:[]}),
      verschluesselt:0,seite:'edit_schematic_page',version:1,geaendert:'2026-11-23',
      geloescht:0,vonGeraet:'Test'});
    const call=async(name:string,params:Record<string,unknown>,token=writer.access_token)=>{
      const response=await f.rpc(token,'tools/call',{name,
        arguments:{workspaceId:'ws_test',...params}});
      assert.equal(response.status,200);
      const reply=response.data.result as {isError?:boolean;content:{text:string}[]};
      return {reply,data:JSON.parse(reply.content[0]!.text)};
    };
    const created=await call('redion_add_schematic',{documentId:'edit_schematic_page',
      art:'stromlauf-aufgeloest',expectedVersion:1,requestId:'schematic_edit_0001'});
    assert.notEqual(created.reply.isError,true);
    const blockId=created.data.blockId;
    const update=async(fields:Record<string,unknown>,token?:string)=>
      call('redion_update_schematic',{blockId,...fields},token);
    const denied=await update({expectedVersion:1,operation:'add_component',
      componentId:'S1',symbolId:'taster-schliesser',x:100,y:100},readOnly.access_token);
    assert.equal(denied.reply.isError,true);
    assert.equal(denied.data.code,'forbidden');

    const first=await update({expectedVersion:1,operation:'add_component',
      componentId:'S1',symbolId:'taster-schliesser',x:100,y:100,bmk:'S1'});
    assert.notEqual(first.reply.isError,true);
    assert.equal(first.data.version,2);
    assert.equal(first.data.elementType,'component');
    assert.equal(first.data.electricalValidation,false);
    const second=await update({expectedVersion:2,operation:'add_component',
      componentId:'P1',symbolId:'bp-sonnerie',x:320,y:100,bmk:'P1'});
    assert.equal(second.data.version,3);
    const wire=await update({expectedVersion:3,operation:'connect_terminals',
      wireId:'L1',fromComponentId:'S1',fromTerminal:'3',
      toComponentId:'P1',toTerminal:'X1'});
    assert.notEqual(wire.reply.isError,true);
    assert.equal(wire.data.version,4);
    assert.equal(wire.data.routingVerified,false);
    const label=await update({expectedVersion:4,operation:'add_label',
      labelId:'T1',labelText:'Nur Schulungszwecke',x:100,y:300,layer:'aufgabe'});
    assert.equal(label.data.version,5);
    const read=await call('redion_read_schematic',{blockId});
    assert.equal(read.data.version,5);
    assert.equal(read.data.plan.teile.length,2);
    assert.equal(read.data.plan.teile[0].zeichen,'taster-schliesser');
    assert.equal(read.data.plan.teile[0].drehung,0);
    assert.equal(read.data.plan.teile[1].zeichen,'bp-sonnerie');
    assert.deepEqual(read.data.plan.leitungen[0].punkte,[{x:120,y:100},{x:350,y:100}]);
    assert.equal(read.data.plan.leitungen[0].vonNr,'3');
    assert.equal(read.data.plan.leitungen[0].nachNr,'X1');
    assert.equal(read.data.plan.texte[0].t,'Nur Schulungszwecke');
    assert.equal(read.data.plan.texte[0].ebene,'aufgabe');

    const bad=[
      {expectedVersion:4,operation:'add_component',componentId:'OLD',symbolId:'schliesser',x:100,y:100,code:'conflict'},
      {expectedVersion:5,operation:'add_component',componentId:'B1',symbolId:'nicht-vorhanden',x:100,y:100},
      {expectedVersion:5,operation:'add_component',componentId:'S1',symbolId:'schliesser',x:100,y:100},
      {expectedVersion:5,operation:'add_component',componentId:'B2',symbolId:'schliesser',x:103,y:100},
      {expectedVersion:5,operation:'add_component',componentId:'B3',symbolId:'schliesser',x:800,y:700},
      {expectedVersion:5,operation:'connect_terminals',wireId:'W2',
        fromComponentId:'S1',fromTerminal:'falsch',toComponentId:'P1',toTerminal:'X1'},
      {expectedVersion:5,operation:'connect_terminals',wireId:'W3',
        fromComponentId:'S1',fromTerminal:'3',toComponentId:'P1',toTerminal:'X1'},
      {expectedVersion:5,operation:'connect_terminals',wireId:'W4',
        fromComponentId:'S1',fromTerminal:'3',toComponentId:'P1',toTerminal:'X1',bmk:'bad'},
      {expectedVersion:5,operation:'add_label',labelId:'T2',labelText:'',x:100,y:100},
      {expectedVersion:5,operation:'add_label',labelId:'T3',labelText:'Test',x:100,y:100,layer:'fremd'}
    ];
    for(const params of bad){
      const failed=await update(params);
      assert.equal(failed.reply.isError,true,JSON.stringify(params));
      assert.equal(failed.data.code,params.code??'invalid_arguments',JSON.stringify(params));
    }
    assert.equal((await call('redion_read_schematic',{blockId})).data.version,5);
    const two=await Promise.all([
      update({expectedVersion:5,operation:'add_label',labelId:'T4',
        labelText:'Parallel 1',x:100,y:340}),
      update({expectedVersion:5,operation:'add_label',labelId:'T5',
        labelText:'Parallel 2',x:100,y:360})
    ]);
    assert.equal(two.filter(x=>x.reply.isError!==true).length,1);
    assert.equal(two.filter(x=>x.data.code==='conflict').length,1);
    const after=await call('redion_read_schematic',{blockId});
    assert.equal(after.data.version,6);
    assert.equal(after.data.plan.texte.length,2);
    assert.equal(new Set(after.data.plan.texte.map((x:any)=>x.id)).size,2);
    const addBatchLabel={operation:'add_label',labelId:'TB',labelText:'Batch',x:200,y:350};
    const rejected=await update({expectedVersion:6,changes:[addBatchLabel,addBatchLabel]});
    assert.equal(rejected.data.code,'invalid_arguments');
    assert.match(rejected.data.message,/Schritt 2/);
    const unchanged=await call('redion_read_schematic',{blockId});
    assert.equal(unchanged.data.version,6);
    assert.deepEqual(unchanged.data.plan,after.data.plan);
    const changes=[addBatchLabel,{operation:'move_label',labelId:'TB',x:210,y:370}];
    const committed=await update({expectedVersion:6,changes});
    assert.equal(committed.data.version,7);
    assert.deepEqual(committed.data.changeSummary,{added:1,removed:0,modified:0,total:1,truncated:false,
      entries:[{elementId:'TB',elementType:'label',action:'added',fields:[]}]});
    assert.deepEqual(committed.data.elements,[{elementId:'TB',elementType:'label'},{elementId:'TB',elementType:'label'}]);
    assert.equal((await update({expectedVersion:6,changes})).data.code,'conflict');
    const finalPlan=await call('redion_read_schematic',{blockId});
    assert.deepEqual(finalPlan.data.plan.texte.filter((item:any)=>item.id==='TB').map((item:any)=>[item.x,item.y]),[[210,370]]);
    const values=await update({expectedVersion:7,changes:[
      {operation:'add_component',componentId:'G12',symbolId:'gleichspannung',x:500,y:450},
      {operation:'set_component_values',componentId:'G12',values:{U:12}},
      {operation:'add_component',componentId:'E12',symbolId:'lampe',x:650,y:450},
      {operation:'set_component_values',componentId:'E12',values:{R:24,Un:12}}
    ]});
    assert.equal(values.data.version,8);
    const valued=await call('redion_read_schematic',{blockId});
    assert.deepEqual(valued.data.plan.teile.find((p:any)=>p.id==='G12').werte,{U:12});
    assert.deepEqual(valued.data.plan.teile.find((p:any)=>p.id==='E12').werte,{R:24,Un:12});
    for(const [componentId,values] of [['G12',{U:-1}],['G12',{R:24}],['S1',{U:12}]]){
      const invalid=await update({expectedVersion:8,operation:'set_component_values',componentId,values});
      assert.equal(invalid.data.code,'invalid_arguments');
    }
    assert.equal((await call('redion_read_schematic',{blockId})).data.version,8);
    const previewWires=[
      {operation:'connect_terminals',wireId:'preview_plus',fromComponentId:'G12',fromTerminal:'+',toComponentId:'E12',toTerminal:'X1'},
      {operation:'connect_terminals',wireId:'preview_minus',fromComponentId:'G12',fromTerminal:'−',toComponentId:'E12',toTerminal:'X2'}
    ];
    const previewMeasurement={switches:[],componentIds:['E12']};
    const simulated=await update({expectedVersion:8,dryRun:true,changes:previewWires,previewOperatingPoint:previewMeasurement,previewGeometryAudit:true});
    assert.equal(simulated.data.saved,false,JSON.stringify(simulated.data));
    assert.equal(simulated.data.version,8);
    assert.equal(simulated.data.changeSummary.added,2);
    assert.equal(simulated.data.changeSummary.total,2);
    assert.deepEqual(simulated.data.changeSummary.entries.map((e:any)=>e.elementId),['preview_plus','preview_minus']);
    const comparison=simulated.data.geometryComparison;
    assert.equal(comparison.before.wireCount,valued.data.plan.leitungen.length);
    assert.equal(comparison.after.wireCount,comparison.before.wireCount+2);
    assert.equal(comparison.errorCountDelta,comparison.after.errorCount-comparison.before.errorCount);
    assert.equal(comparison.after.errorCount,0);
    assert.equal((await update({expectedVersion:8,changes:previewWires,previewGeometryAudit:true})).data.code,'invalid_arguments');
    assert.equal((await update({expectedVersion:8,dryRun:true,changes:previewWires,previewGeometryAudit:false})).data.code,'invalid_arguments');
    assert.equal(simulated.data.previewReport.status,'berechnet',JSON.stringify(simulated.data.previewReport));
    const lamp=simulated.data.previewReport.messwerte.find((m:any)=>m.componentId==='E12').wert;
    assert.ok(Math.abs(Math.abs(lamp.U)-12)<1e-6);
    assert.ok(Math.abs(Math.abs(lamp.I)-0.5)<1e-6);
    assert.equal((await update({expectedVersion:8,changes:previewWires,previewOperatingPoint:previewMeasurement})).data.code,'invalid_arguments');
    assert.equal((await update({expectedVersion:8,dryRun:true,changes:previewWires,
      previewOperatingPoint:previewMeasurement,previewSwitchTest:{switchIds:['S1'],targetId:'E12',expected:[true,true]}})).data.code,'invalid_arguments');
    assert.equal((await update({expectedVersion:8,dryRun:true,changes:previewWires,
      previewOperatingPoint:{switches:[],componentIds:['missing']}})).data.code,'invalid_arguments');
    const switchedPreview=await update({expectedVersion:8,dryRun:true,changes:previewWires,
      previewSwitchTest:{switchIds:['S1'],targetId:'E12',expected:[true,true]}});
    assert.equal(switchedPreview.data.saved,false,JSON.stringify(switchedPreview.data));
    assert.equal(switchedPreview.data.previewReport.faelle.length,2);
    const untouched=await call('redion_read_schematic',{blockId});
    assert.equal(untouched.data.version,8);
    assert.deepEqual(untouched.data.plan,valued.data.plan);
    const badCorrection=await update({expectedVersion:8,changes:[
      {operation:'rename_label',labelId:'TB',labelText:'Korrigiert'},
      {operation:'delete_wire',wireId:'missing_wire'}
    ]});
    assert.equal(badCorrection.data.code,'invalid_arguments');
    const unchangedCorrection=await call('redion_read_schematic',{blockId});
    assert.equal(unchangedCorrection.data.version,8);
    assert.deepEqual(unchangedCorrection.data.plan,valued.data.plan);
    const correction=await update({expectedVersion:8,changes:[
      {operation:'rename_label',labelId:'TB',labelText:'Korrigiert'}
    ]});
    assert.equal(correction.data.version,9);
    const corrected=await call('redion_read_schematic',{blockId});
    assert.equal(corrected.data.plan.texte.find((p:any)=>p.id==='TB').t,'Korrigiert');
    const deletion=await update({expectedVersion:9,operation:'delete_label',labelId:'TB'});
    assert.equal(deletion.data.version,10);
    const afterDeletion=await call('redion_read_schematic',{blockId});
    assert.equal(afterDeletion.data.plan.texte.some((p:any)=>p.id==='TB'),false);
    assert.deepEqual(afterDeletion.data.plan.leitungen,valued.data.plan.leitungen);
    assert.deepEqual(afterDeletion.data.plan.teile,valued.data.plan.teile);
    assert.equal((await update({expectedVersion:9,operation:'delete_label',labelId:'TB'})).data.code,'conflict');
    const deniedDeletion=await update({expectedVersion:10,operation:'delete_wire',wireId:'L1'},readOnly.access_token);
    assert.equal(deniedDeletion.data.code,'forbidden');
    const removedWire=await update({expectedVersion:10,operation:'delete_wire',wireId:'L1'});
    assert.equal(removedWire.data.version,11);
    assert.equal(removedWire.data.electricalValidation,false);
    const disconnected=await call('redion_read_schematic',{blockId});
    assert.deepEqual(disconnected.data.plan.leitungen,[]);
    assert.deepEqual(disconnected.data.plan.teile,afterDeletion.data.plan.teile);
    assert.deepEqual(disconnected.data.plan.texte,afterDeletion.data.plan.texte);
    const forbiddenRotate=await update({expectedVersion:11,operation:'rotate_component',componentId:'S1',rotation:90},readOnly.access_token);
    assert.equal(forbiddenRotate.data.code,'forbidden');
    const rotatedComponent=await update({expectedVersion:11,changes:[
      {operation:'rotate_component',componentId:'S1',rotation:90},
      {operation:'mirror_component',componentId:'S1',mirrored:true}
    ]});
    assert.equal(rotatedComponent.data.version,12);
    const transformed=await call('redion_read_schematic',{blockId});
    const transformedS1=transformed.data.plan.teile.find((p:any)=>p.id==='S1');
    assert.equal(transformedS1.drehung,90);
    assert.equal(transformedS1.gespiegelt,true);
    const invalidDelete=await update({expectedVersion:12,changes:[
      {operation:'delete_component',componentId:'S1'},
      {operation:'delete_component',componentId:'S1'}
    ]});
    assert.equal(invalidDelete.data.code,'invalid_arguments');
    const afterInvalidDelete=await call('redion_read_schematic',{blockId});
    assert.equal(afterInvalidDelete.data.version,12);
    assert.deepEqual(afterInvalidDelete.data.plan,transformed.data.plan);
    const removedComponent=await update({expectedVersion:12,operation:'delete_component',componentId:'S1'});
    assert.equal(removedComponent.data.version,13);
    const afterComponentDelete=await call('redion_read_schematic',{blockId});
    assert.equal(afterComponentDelete.data.plan.teile.some((p:any)=>p.id==='S1'),false);
    assert.deepEqual(afterComponentDelete.data.plan.teile,transformed.data.plan.teile.filter((p:any)=>p.id!=='S1'));
    assert.deepEqual(afterComponentDelete.data.plan.leitungen,transformed.data.plan.leitungen);
    const newPart=await update({expectedVersion:13,operation:'add_component',componentId:'P2',
      symbolId:'bp-sonnerie',x:100,y:100});
    assert.equal(newPart.data.version,14);
    const newWire=await update({expectedVersion:14,operation:'connect_terminals',wireId:'Wmove',
      fromComponentId:'P2',fromTerminal:'X1',toComponentId:'P1',toTerminal:'X1'});
    assert.equal(newWire.data.version,15);
    const deniedMove=await update({expectedVersion:15,operation:'move_connected_component',
      componentId:'P2',x:100,y:200},readOnly.access_token);
    assert.equal(deniedMove.data.code,'forbidden');
    const moveResult=await update({expectedVersion:15,operation:'move_connected_component',
      componentId:'P2',x:100,y:200});
    assert.equal(moveResult.data.version,16);
    const movedPlan=await call('redion_read_schematic',{blockId});
    assert.deepEqual(movedPlan.data.plan.leitungen.find((p:any)=>p.id==='Wmove').punkte[0],{x:130,y:200});
    assert.equal(movedPlan.data.plan.teile.find((p:any)=>p.id==='P2').y,200);
    assert.equal((await update({expectedVersion:15,operation:'move_connected_component',
      componentId:'P2',x:100,y:240})).data.code,'conflict');
    const branchBatch=await update({expectedVersion:16,changes:[
      {operation:'add_component',componentId:'BA',symbolId:'bp-sonnerie',x:100,y:600},
      {operation:'add_component',componentId:'BB',symbolId:'bp-sonnerie',x:300,y:600},
      {operation:'add_component',componentId:'BC',symbolId:'bp-sonnerie',x:200,y:350},
      {operation:'connect_terminals',wireId:'BT',fromComponentId:'BA',fromTerminal:'X1',toComponentId:'BB',toTerminal:'X1'},
      {operation:'branch_wire',wireId:'BR',targetWireId:'BT',fromComponentId:'BC',fromTerminal:'X2',x:230,y:600}
    ]});
    assert.equal(branchBatch.data.version,17,JSON.stringify(branchBatch.data));
    const branchedPlan=await call('redion_read_schematic',{blockId});
    const branch=branchedPlan.data.plan.leitungen.find((p:any)=>p.id==='BR');
    assert.deepEqual(branch.punkte.at(-1),{x:230,y:600});
    assert.equal(branch.vonTeil,'BC');
    const badBranch=await update({expectedVersion:17,operation:'branch_wire',wireId:'BR2',
      targetWireId:'BT',fromComponentId:'BC',fromTerminal:'X2',x:130,y:600});
    assert.equal(badBranch.data.code,'invalid_arguments');
    assert.equal((await call('redion_read_schematic',{blockId})).data.version,17);
    const busbar=await update({expectedVersion:17,operation:'add_busbar',wireId:'railL1',
      conductor:'L1',x:40,y:20,endX:760,endY:20});
    assert.equal(busbar.data.version,18,JSON.stringify(busbar.data));
    const withRail=await call('redion_read_schematic',{blockId});
    assert.deepEqual(withRail.data.plan.leitungen.find((w:any)=>w.id==='railL1'),
      {id:'railL1',punkte:[{x:40,y:20},{x:760,y:20}],ebene:'plan',schiene:'L1'});
    const overlappingRail=await update({expectedVersion:18,operation:'add_busbar',wireId:'railN',
      conductor:'N',x:40,y:20,endX:760,endY:20});
    assert.equal(overlappingRail.data.code,'invalid_arguments');
    const afterRail=await call('redion_read_schematic',{blockId});
    assert.equal(afterRail.data.version,18);
    assert.deepEqual(afterRail.data.plan,withRail.data.plan);
    const preview=await update({expectedVersion:18,dryRun:true,changes:[
      {operation:'add_label',labelId:'preview_label',labelText:'Nur Vorschau',x:100,y:500},
      {operation:'rename_label',labelId:'preview_label',labelText:'Vorschau geändert'}
    ]});
    assert.equal(preview.data.version,18,JSON.stringify(preview.data));
    assert.equal(preview.data.dryRun,true);
    assert.equal(preview.data.saved,false);
    assert.equal(preview.data.elements.length,2);
    assert.equal(preview.data.previewPlan.texte.find((t:any)=>t.id==='preview_label').t,'Vorschau geändert');
    const singlePreview=await update({expectedVersion:18,dryRun:true,operation:'delete_wire',wireId:'railL1'});
    assert.equal(singlePreview.data.saved,false);
    assert.equal(singlePreview.data.previewPlan.leitungen.some((w:any)=>w.id==='railL1'),false);
    assert.equal((await update({expectedVersion:18,dryRun:true,operation:'delete_wire',wireId:'railL1'},readOnly.access_token)).data.code,'forbidden');
    assert.equal((await update({expectedVersion:17,dryRun:true,operation:'delete_wire',wireId:'railL1'})).data.code,'conflict');
    assert.equal((await update({expectedVersion:18,dryRun:false,operation:'delete_wire',wireId:'railL1'})).data.code,'invalid_arguments');
    assert.equal((await update({expectedVersion:18,dryRun:true,changes:[
      {operation:'delete_wire',wireId:'railL1'},
      {operation:'delete_wire',wireId:'missing'}
    ]})).data.code,'invalid_arguments');
    const afterPreview=await call('redion_read_schematic',{blockId});
    assert.equal(afterPreview.data.version,18);
    assert.deepEqual(afterPreview.data.plan,withRail.data.plan);
    const geometry=await call('redion_read_schematic',{blockId,expectedVersion:18,geometryAudit:true},readOnly.access_token);
    assert.equal(geometry.data.version,18,JSON.stringify(geometry.data));
    assert.equal(geometry.data.report.wireCount,withRail.data.plan.leitungen.length);
    assert.equal(geometry.data.report.errorCount,0,JSON.stringify(geometry.data.report));
    const staleGeometry=await call('redion_read_schematic',{blockId,expectedVersion:17,geometryAudit:true});
    assert.equal(staleGeometry.data.code,'conflict');
    const noVersionGeometry=await call('redion_read_schematic',{blockId,geometryAudit:true});
    assert.equal(noVersionGeometry.data.code,'invalid_arguments');
    const bothModes=await call('redion_read_schematic',{blockId,expectedVersion:18,geometryAudit:true,
      operatingPoint:{switches:[],componentIds:['P2']}});
    assert.equal(bothModes.data.code,'invalid_arguments');
    const afterAudit=await call('redion_read_schematic',{blockId});
    assert.equal(afterAudit.data.version,18);
    assert.deepEqual(afterAudit.data.plan,withRail.data.plan);
    const orphanId='detached_schematic';
    await f.store.setze('saetze',{id:orphanId,bereich:'ws_test',tabelle:'blocks',
      daten:JSON.stringify({type:'schaltplan',parentId:'edit_schematic_page',plan:finalPlan.data.plan}),
      verschluesselt:0,seite:'edit_schematic_page',version:1,geaendert:'2026-11-23',
      geloescht:0,vonGeraet:'Test'});
    assert.equal((await call('redion_read_schematic',{blockId:orphanId})).data.code,'not_found');
    assert.equal((await call('redion_read_block',{blockId:orphanId})).data.code,'not_found');
    assert.equal((await update({blockId:orphanId,expectedVersion:1,changes})).data.code,'not_found');
    assert.equal((await f.store.hole('saetze',{bereich:'ws_test',id:orphanId}))?.version,1);

    await f.store.setze('saetze',{id:'encrypted_schematic',bereich:'ws_test',tabelle:'blocks',
      daten:JSON.stringify({type:'schaltplan',plan:after.data.plan}),
      verschluesselt:1,seite:'edit_schematic_page',version:1,geaendert:'2026-11-23',
      geloescht:0,vonGeraet:'Test'});
    const encrypted=await update({blockId:'encrypted_schematic',expectedVersion:1,
      operation:'add_label',labelId:'H1',labelText:'Geheim',x:100,y:100});
    assert.equal(encrypted.reply.isError,true);
    assert.equal(encrypted.data.code,'encrypted');
    const outside=await update({workspaceId:'not_approved',expectedVersion:6,
      operation:'add_label',labelId:'H2',labelText:'Fremd',x:100,y:100});
    assert.equal(outside.reply.isError,true);
    assert.equal(outside.data.code,'forbidden');
    const notSchematic=await update({blockId:'edit_schematic_page',expectedVersion:2,
      operation:'add_label',labelId:'H3',labelText:'Falsch',x:100,y:100});
    assert.equal(notSchematic.reply.isError,true);
    assert.equal(notSchematic.data.code,'not_found');

    await f.store.setze('konten',{id:'schematic_guest',mail:'schematic@example.test',
      name:'Schematic Guest',herkunft:'github',angelegt:'',gesperrt:0});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'schematic_guest',
      rolle:'edit',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'edit_schematic_page',
      kontoId:'schematic_guest',rolle:'kein',von:'owner',wann:'2026-11-23'});
    const guest=await f.authorize(true,'schematic_guest');
    const blocked=await update({expectedVersion:6,operation:'add_label',
      labelId:'H4',labelText:'Unberechtigt',x:100,y:100},guest.access_token);
    assert.equal(blocked.reply.isError,true);
    assert.equal(blocked.data.code,'forbidden');
  }finally{f.close();}
});


test('Cloud-MCP: Suche findet direkte lesbare Blöcke ohne Geheimdaten oder verwaiste Kinder',async()=>{
  const f=await fixture();
  try{
    const putPage=async(id:string,ids:string[],time:string)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify({type:'page',text:'Übersicht',inhalt:'',content:ids}),
        verschluesselt:0,seite:id,version:1,geaendert:time,geloescht:0,vonGeraet:'Test'});
    };
    const putBlock=async(id:string,page:string,parent:string,content:string,
      encrypted=0,parentTable='block',children:string[]=[])=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify({type:'text',text:content,parentId:parent,
          parentTable,alive:true,content:children}),
        verschluesselt:encrypted,seite:page,version:1,
        geaendert:'2026-11-23',geloescht:0,vonGeraet:'Test'});
    };
    await putPage('block_visible_a',['a_text','a_unicode'],
      '2035-01-01T00:00:00Z');
    await putBlock('a_text','block_visible_a','block_visible_a',
      'BLOCKTREFFER Steckdose Typ 13');
    await putBlock('a_unicode','block_visible_a','block_visible_a',
      'BrÜCke und Öfen');
    await putPage('block_secret_page',['secret_child'],
      '2034-01-01T00:00:00Z');
    await putBlock('secret_child','block_secret_page','block_secret_page',
      'blocktreffer vertraulich');
    await putPage('block_hidden_child',['encrypted_child'],
      '2033-01-01T00:00:00Z');
    await putBlock('encrypted_child','block_hidden_child','block_hidden_child',
      'blocktreffer geheim',1);
    await putPage('block_wrong_parent',['wrong_parent_child','wrong_page_child',
      'collection_child','missing_reference'],
      '2032-01-01T00:00:00Z');
    await putBlock('wrong_parent_child','block_wrong_parent','other_page',
      'blocktreffer falscher Vater');
    await putBlock('wrong_page_child','foreign_page','block_wrong_parent',
      'blocktreffer fremde Seite');
    await putBlock('collection_child','block_wrong_parent','block_wrong_parent',
      'blocktreffer Datenbankspalte',0,'collection');
    await putPage('block_visible_b',['b_text'],
      '2031-01-01T00:00:00Z');
    await putBlock('b_text','block_visible_b','block_visible_b',
      'Weitere blocktreffer Angaben');
    await putPage('block_orphan_page',[], '2030-01-01T00:00:00Z');
    await putBlock('orphan_child','block_orphan_page','block_orphan_page',
      'blocktreffer ohne Elternreferenz');
    await putPage('block_nested_page',['nested_parent'],
      '2029-01-01T00:00:00Z');
    await putBlock('nested_parent','block_nested_page','block_nested_page',
      'Elternblock',0,'block',['nested_child','nested_secret','nested_bad_parent','nested_cycle']);
    await putBlock('nested_child','block_nested_page','nested_parent',
      'blocktreffer tief verschachtelt',0,'block',['nested_grandchild']);
    await putBlock('nested_grandchild','block_nested_page','nested_child',
      'Mehrstufiger Stromkreis',0,'block',['nested_greatgrandchild']);
    await putBlock('nested_greatgrandchild','block_nested_page','nested_grandchild',
      'Fehlersuche Schweizer Elektroplan',0,'block',['nested_too_deep']);
    await putBlock('nested_too_deep','block_nested_page','nested_greatgrandchild',
      'Hier nicht finden nach Tiefenlimit');
    await putBlock('nested_secret','block_nested_page','nested_parent',
      'blocktreffer geheim im Unterblock',1);
    await putBlock('nested_bad_parent','block_nested_page','other_parent',
      'blocktreffer falscher Unterblock');
    await putBlock('nested_cycle','block_nested_page','nested_parent',
      'Rundweg',0,'block',['nested_parent']);
    await putBlock('nested_grandchild_private','block_nested_page','nested_child',
      'Versteckter Vorfahr',1,'block',['nested_private_leaf']);
    await putBlock('nested_private_leaf','block_nested_page','nested_grandchild_private',
      'Nicht finden trotz Klartext');
    await putBlock('nested_crosspage','foreign_nested_page','nested_child',
      'Nicht finden fremde Wurzel');
    await putBlock('nested_unicode','block_nested_page','nested_child',
      'Überprüfung der Lüftungsanlage');
    await putBlock('nested_deleted','block_nested_page','nested_parent',
      'Nicht finden gelöschten Block',0,'block',['nested_deleted_leaf']);
    const deleted=await f.store.hole('saetze',{bereich:'ws_test',id:'nested_deleted'});
    assert.ok(deleted);
    await f.store.setze('saetze',{...deleted,geloescht:1});
    await putBlock('nested_deleted_leaf','block_nested_page','nested_deleted',
      'Nicht finden hinter Löschung');
    const root=await f.store.hole('saetze',{bereich:'ws_test',id:'block_nested_page'});
    assert.ok(root);
    const parent=await f.store.hole('saetze',{bereich:'ws_test',id:'nested_parent'});
    assert.ok(parent);
    const child=await f.store.hole('saetze',{bereich:'ws_test',id:'nested_child'});
    assert.ok(child);
    await f.store.setze('saetze',{...root,
      daten:JSON.stringify({...JSON.parse(root.daten),content:['nested_parent','nested_deleted']})});
    await f.store.setze('saetze',{...parent,
      daten:JSON.stringify({...JSON.parse(parent.daten),
        content:['nested_child','nested_secret','nested_bad_parent','nested_cycle','nested_deleted']})});
    await f.store.setze('saetze',{...child,
      daten:JSON.stringify({...JSON.parse(child.daten),
        content:['nested_grandchild','nested_grandchild_private','nested_crosspage','nested_unicode']})});

    await f.store.setze('konten',{id:'search_visible_guest',
      mail:'search_visible@example.test',name:'Search Guest',
      herkunft:'github',angelegt:'',gesperrt:0});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',
      kontoId:'search_visible_guest',rolle:'lesen',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'block_secret_page',
      kontoId:'search_visible_guest',rolle:'kein',von:'owner',wann:'2026-11-23'});
    const guest=await f.authorize(false,'search_visible_guest');
    const query=async(q:string,offset=0,limit=10)=>{
      const result=await f.rpc(guest.access_token,'tools/call',{
        name:'redion_search',arguments:{workspaceId:'ws_test',query:q,offset,limit}});
      assert.equal(result.status,200);
      assert.equal(result.data.result.isError,undefined);
      return JSON.parse(result.data.result.content[0]!.text) as {
        documents:{documentId:string}[];nextOffset:number|null;
      };
    };
    const all=await query('blocktreffer');
    assert.deepEqual(all.documents.map(x=>x.documentId),
      ['block_visible_a','block_visible_b','block_nested_page']);
    const first=await query('BLOCKTREFFER',0,1);
    assert.deepEqual(first.documents.map(x=>x.documentId),['block_visible_a']);
    assert.equal(first.nextOffset,1);
    const second=await query('blocktreffer',1,1);
    assert.deepEqual(second.documents.map(x=>x.documentId),['block_visible_b']);
    assert.equal(second.nextOffset,2);
    const third=await query('blocktreffer',2,1);
    assert.deepEqual(third.documents.map(x=>x.documentId),['block_nested_page']);
    assert.equal(third.nextOffset,null);
    assert.deepEqual((await query('brücke')).documents.map(x=>x.documentId),
      ['block_visible_a'],'Unicode-Suche muss direkte Blocktexte berücksichtigen');
    assert.deepEqual((await query('GEHEIM')).documents,[],
      'Verschlüsselte Blocktexte dürfen nicht durch Suche sichtbar werden.');
    assert.deepEqual((await query('falscher Vater')).documents,[]);
    assert.deepEqual((await query('fremde Seite')).documents,[]);
    assert.deepEqual((await query('Datenbankspalte')).documents,[]);
    assert.deepEqual((await query('ohne Elternreferenz')).documents,[]);
    assert.deepEqual((await query('tief verschachtelt')).documents.map(x=>x.documentId),
      ['block_nested_page']);
    assert.deepEqual((await query('Mehrstufiger Stromkreis')).documents.map(x=>x.documentId),
      ['block_nested_page']);
    assert.deepEqual((await query('Schweizer Elektroplan')).documents.map(x=>x.documentId),
      ['block_nested_page']);
    assert.deepEqual((await query('geheim im Unterblock')).documents,[],
      'Verschlüsselte verschachtelte Blöcke dürfen nicht durchsucht werden.');
    assert.deepEqual((await query('falscher Unterblock')).documents,[],
      'Ungültige Elternzuordnungen dürfen nicht durchsucht werden.');
    assert.deepEqual((await query('Hier nicht finden nach Tiefenlimit')).documents,[],
      'Die verschachtelte Suche muss eine feste maximale Tiefe einhalten.');
    assert.deepEqual((await query('LÜFTUNGSANLAGE')).documents.map(x=>x.documentId),
      ['block_nested_page'],'Unicode-Casefold muss auch tief verschachtelte Blöcke treffen.');
    assert.deepEqual((await query('Nicht finden trotz Klartext')).documents,[],
      'Klartext hinter einem verschlüsselten Elternblock darf nicht durchsuchbar sein.');
    assert.deepEqual((await query('Nicht finden fremde Wurzel')).documents,[],
      'Kindblöcke mit abweichender seite dürfen nicht als Treffer erscheinen.');
    assert.deepEqual((await query('Nicht finden hinter Löschung')).documents,[],
      'Klartext hinter einem gelöschten Elternblock darf nicht gefunden werden.');
    assert.deepEqual((await query('Nicht finden gelöschten Block')).documents,[],
      'Auch der gelöschte Elternblock selbst muss unsichtbar bleiben.');
  }finally{f.close();}
});


test('Cloud-MCP: eingebettete Blöcke und Aufgaben versioniert und mit Eltern-ACL bearbeiten',async()=>{
  const f=await fixture();
  try{
    const put=async(id:string,data:Record<string,unknown>,page:string,encrypted=0,deleted=0)=>{
      await f.store.setze('saetze',{id,bereich:'ws_test',tabelle:'blocks',
        daten:JSON.stringify(data),verschluesselt:encrypted,seite:page,version:1,
        geaendert:'2026-11-23',geloescht:deleted,vonGeraet:'Test'});
    };
    await put('edit_blocks_page',{type:'page',text:'Schule',inhalt:'',
      content:['edit_task','edit_section']},'edit_blocks_page');
    await put('edit_task',{type:'todo',text:'ÜK vorbereiten',checked:false,alive:true,
      faellig:'2026-12-01',parentId:'edit_blocks_page',parentTable:'block',content:[]},
      'edit_blocks_page');
    await put('edit_section',{type:'toggle',text:'Unterkapitel',alive:true,
      parentId:'edit_blocks_page',parentTable:'block',content:['edit_nested']},
      'edit_blocks_page');
    await put('edit_nested',{type:'text',text:'Kapitelanfang',alive:true,
      parentId:'edit_section',parentTable:'block',content:[]},'edit_blocks_page');
    await put('edit_orphan',{type:'text',text:'Verwaist',alive:true,
      parentId:'edit_blocks_page',parentTable:'block',content:[]},'edit_blocks_page');
    await put('edit_hidden_section',{type:'toggle',text:'Gelöschter Vorfahr',
      parentId:'edit_blocks_page',parentTable:'block',content:['edit_hidden_child']},
      'edit_blocks_page',1);
    await put('edit_hidden_child',{type:'text',text:'Nicht erreichbar',
      parentId:'edit_hidden_section',parentTable:'block',content:[]},
      'edit_blocks_page');
    await put('edit_collection_row',{type:'page',text:'Datenbankzeile',
      parentId:'collection_1',parentTable:'collection'},'edit_collection_row');
    await put('edit_secret_page',{type:'page',text:'Geheime Seite',content:['edit_secret_block']},
      'edit_secret_page');
    await put('edit_secret_block',{type:'text',text:'Privat',
      parentId:'edit_secret_page',parentTable:'block'},'edit_secret_page');
    await f.store.setze('konten',{id:'edit_blocks_guest',
      mail:'edit_blocks_guest@example.test',name:'Editor Guest',herkunft:'github',
      angelegt:'',gesperrt:0});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',
      kontoId:'edit_blocks_guest',rolle:'lesen',von:'owner',wann:'2026-11-23'});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'edit_secret_page',
      kontoId:'edit_blocks_guest',rolle:'kein',von:'owner',wann:'2026-11-23'});
    const reader=await f.authorize(false,'edit_blocks_guest');
    const writer=await f.authorize(true);
    const call=async(token:string,blockId:string,expectedVersion:number,
      operation:string,params:Record<string,unknown>={})=>{
      const response=await f.rpc(token,'tools/call',{name:'redion_update_block',
        arguments:{workspaceId:'ws_test',blockId,expectedVersion,operation,...params}});
      assert.equal(response.status,200);
      const reply=response.data.result as {isError?:boolean;content:{text:string}[]};
      return {reply,data:JSON.parse(reply.content[0]!.text)};
    };
    const write=async(id:string,ver:number,op:string,params:Record<string,unknown>={})=>
      call(writer.access_token,id,ver,op,params);
    const denied=await call(reader.access_token,'edit_task',1,'set_checked',{checked:true});
    assert.equal(denied.reply.isError,true);
    assert.equal(denied.data.code,'forbidden');

    const checked=await write('edit_task',1,'set_checked',{checked:true});
    assert.equal(checked.reply.isError,undefined);
    assert.equal(checked.data.version,2);
    assert.equal(checked.data.unchanged,false);
    const note=await write('edit_task',2,'set_note',{note:'Mit der Lehrperson prüfen'});
    assert.equal(note.data.version,3);
    const due=await write('edit_task',3,'set_due_date',{dueDate:'2026-12-20'});
    assert.equal(due.data.version,4);
    const title=await write('edit_task',4,'set_text',{text:'Praktische Prüfung vorbereiten'});
    assert.equal(title.data.version,5);
    const same=await write('edit_task',5,'set_text',{text:'Praktische Prüfung vorbereiten'});
    assert.equal(same.data.unchanged,true);
    assert.equal(same.data.version,5);
    const stored=await f.store.hole('saetze',{bereich:'ws_test',id:'edit_task'});
    assert.equal(stored?.version,5);
    const saved=JSON.parse(stored!.daten);
    assert.equal(saved.checked,true);
    assert.equal(saved.notiz,'Mit der Lehrperson prüfen');
    assert.equal(saved.faellig,'2026-12-20');
    assert.equal(saved.text,'Praktische Prüfung vorbereiten');
    assert.deepEqual(saved.content,[]);
    assert.equal(saved.parentId,'edit_blocks_page');
    const openTasks=await f.rpc(writer.access_token,'tools/call',{
      name:'redion_list_tasks',arguments:{workspaceId:'ws_test',nurOffen:true}});
    assert.ok(!JSON.parse(openTasks.data.result.content[0]!.text).tasks.some(
      (t:any)=>t.taskId==='edit_task'));

    const nested=await write('edit_nested',1,'set_text',{text:'Geänderter Unterpunkt'});
    assert.equal(nested.data.version,2);
    assert.equal((await f.store.hole('saetze',{bereich:'ws_test',id:'edit_nested'}))?.version,2);
    const immutableParent=await f.store.hole('saetze',{bereich:'ws_test',id:'edit_section'});
    assert.equal(immutableParent?.version,1);
    const bad=[
      {id:'edit_task',ver:4,op:'set_text',args:{text:'Veralteter Schreibversuch'},code:'conflict'},
      {id:'edit_task',ver:5,op:'set_text',args:{text:''}},
      {id:'edit_task',ver:5,op:'set_checked',args:{checked:'true'}},
      {id:'edit_task',ver:5,op:'set_checked',args:{checked:true,text:'unerlaubt'}},
      {id:'edit_task',ver:5,op:'set_due_date',args:{dueDate:'2026-02-29'}},
      {id:'edit_task',ver:5,op:'set_due_date',args:{dueDate:'2026-13-01'}},
      {id:'edit_task',ver:5,op:'set_note',args:{note:'n'.repeat(2001)}},
      {id:'edit_nested',ver:2,op:'set_checked',args:{checked:true}},
      {id:'edit_nested',ver:2,op:'set_due_date',args:{dueDate:'2026-12-01'}},
      {id:'edit_section',ver:1,op:'set_text',args:{text:'Toggle darf nicht verändert werden'},code:'not_found'},
      {id:'edit_orphan',ver:1,op:'set_text',args:{text:'Unerlaubt'},code:'not_found'},
      {id:'edit_hidden_child',ver:1,op:'set_text',args:{text:'Unerlaubt'},code:'not_found'},
      {id:'edit_collection_row',ver:1,op:'set_text',args:{text:'Unerlaubt'},code:'not_found'}
    ];
    for(const t of bad){
      const result=await write(t.id,t.ver,t.op,t.args);
      assert.equal(result.reply.isError,true,JSON.stringify(t));
      assert.equal(result.data.code,t.code??'invalid_arguments',JSON.stringify(t));
    }
    const secret=await call(reader.access_token,'edit_secret_block',1,'set_text',{text:'Nein'});
    assert.equal(secret.reply.isError,true);
    assert.equal(secret.data.code,'forbidden');
    assert.equal((await f.store.hole('saetze',{bereich:'ws_test',id:'edit_task'}))?.version,5);

    const parallel=await Promise.all([
      write('edit_task',5,'set_note',{note:'Parallel A'}),
      write('edit_task',5,'set_note',{note:'Parallel B'})
    ]);
    assert.equal(parallel.filter(x=>x.reply.isError!==true).length,1);
    assert.equal(parallel.filter(x=>x.data.code==='conflict').length,1);
    assert.equal((await f.store.hole('saetze',{bereich:'ws_test',id:'edit_task'}))?.version,6);
    const cleared=await write('edit_task',6,'set_due_date',{dueDate:''});
    assert.equal(cleared.data.version,7);
    assert.equal(JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:'edit_task'}))!.daten).faellig,'');
  }finally{f.close();}
});

test('Cloud-MCP und Native-Sync: neu erstellte Seite im selben Delta',async()=>{
  const f=await fixture();try{
    const token=await f.authorize(true);
    const seit=new Date(Date.now()-60000).toISOString();
    const created=await f.rpc(token.access_token,'tools/call',{name:'redion_create_page',
      arguments:{workspaceId:'ws_test',title:'Live-Sync Probe',
        content:'Aus MCP auf dem iPhone sichtbar',requestId:'live_sync_probe_001'}});
    assert.equal(created.status,200);
    assert.notEqual(created.data.result.isError,true);
    const page=JSON.parse(created.data.result.content[0].text);
    const app=await redionKern.syncWeg({suche:{}},f.store,
      {konto:{id:'owner'},rechte:['alles']},['sync','runter'],'POST',
      {bereich:'ws_test',seit},{'redion-geraet':'iPhone'});
    assert.equal(app.status,200);
    const delta=JSON.parse(app.koerper);
    const visible=delta.saetze.find((row:any)=>row.id===page.documentId);
    assert.ok(visible,'MCP-Seite muss im normalen iPhone-/Windows-Delta erscheinen');
    assert.equal(visible.tabelle,'blocks');
    assert.equal(visible.verschluesselt,false);
    assert.equal(visible.version,1);
    const payload=JSON.parse(visible.daten);
    assert.equal(payload.text,'Live-Sync Probe');
    assert.equal(payload.inhalt,'Aus MCP auf dem iPhone sichtbar');
    const stranger=await redionKern.syncWeg({suche:{}},f.store,
      {konto:{id:'fremdes_konto'},rechte:['alles']},['sync','runter'],'POST',
      {bereich:'ws_test',seit},{'redion-geraet':'Fremdes Gerät'});
    assert.equal(stranger.status,403,'Ohne Konto-Rechte keine Live-Sync-Daten');
  }finally{f.close();}
});

test('Cloud-MCP creates actual Trainer cards atomically, with write scope and idempotence',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('saetze',{id:'learning_test_page',bereich:'ws_test',tabelle:'blocks',
      daten:JSON.stringify({type:'page',text:'Lernkarten',content:[]}),verschluesselt:0,seite:'learning_test_page',version:1,geaendert:'2026-11-23',geloescht:0,vonGeraet:'Test'});
    const reader=await f.authorize(false,'owner');
    const args={workspaceId:'ws_test',documentId:'learning_test_page',expectedVersion:1,requestId:'learning_test_001',
      kind:'single_select',deck:'Elektrotechnik',question:'Einheit der Spannung?',answer:'Volt',
      options:[{text:'Volt',correct:true},{text:'Ampere',correct:false},{text:'Ohm',correct:false},{text:'Watt',correct:false}]};
    const call=async(token:string,p:Record<string,unknown>)=>{const response=await f.rpc(token,'tools/call',{name:'redion_create_learning_card',arguments:p});assert.equal(response.status,200,JSON.stringify(response.data));return response.data.result;};
    const denied=await call(reader.access_token,args);
    assert.equal(denied?.isError,true,JSON.stringify(denied));
    assert.equal(JSON.parse(denied.content[0]!.text).code,'forbidden');
    // Changing a remembered grant rotates its epoch, invalidating the earlier token.
    const writer=await f.authorize(true);
    const first=await call(writer.access_token,args);
    assert.notEqual(first.isError,true,JSON.stringify(first));
    const card=JSON.parse(first.content[0]!.text);
    const row=await f.store.hole('saetze',{bereich:'ws_test',id:card.blockId});
    const data=JSON.parse(row!.daten);
    assert.equal(data.type,'flashcard');assert.equal(data.quiz.kind,'mc');
    assert.equal(data.quiz.kapitel,'Elektrotechnik');assert.equal(data.quiz.optionen[0].richtig,true);
    assert.equal(data.sr,undefined);
    assert.equal(card.parentVersion,2);
    const retry=JSON.parse((await call(writer.access_token,args)).content[0]!.text);
    assert.equal(retry.blockId,card.blockId);assert.equal(retry.alreadyExists,true);
    assert.equal((await call(writer.access_token,{...args,requestId:'learning_test_002'})).isError,true);
    const page=await f.store.hole('saetze',{bereich:'ws_test',id:'learning_test_page'});
    assert.deepEqual(JSON.parse(page!.daten).content,[card.blockId]);
  }finally{f.close();}
});

test('Cloud-MCP learning set validates all cards, attaches them once and retries atomically',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('saetze',{id:'learning_set_page',bereich:'ws_test',tabelle:'blocks',
      daten:JSON.stringify({type:'page',text:'Elektro',content:[]}),verschluesselt:0,seite:'learning_set_page',version:1,geaendert:'2026-11-23',geloescht:0,vonGeraet:'Test'});
    const reader=await f.authorize(false,'owner');
    const args={workspaceId:'ws_test',documentId:'learning_set_page',expectedVersion:1,requestId:'learning_set_001',deck:'Elektrotechnik',subject:'ET',
      cards:[{kind:'flashcard',question:'Einheit der Spannung?',answer:'Volt'},{kind:'cloze',question:'Strom wird in ___ gemessen.',answer:'Ampere'}]};
    const call=async(token:string,p:Record<string,unknown>)=>{const response=await f.rpc(token,'tools/call',{name:'redion_create_learning_set',arguments:p});assert.equal(response.status,200,JSON.stringify(response.data));return response.data.result;};
    const denied=await call(reader.access_token,args);
    assert.equal(denied?.isError,true,JSON.stringify(denied));
    assert.equal(JSON.parse(denied.content[0]!.text).code,'forbidden');
    // Changing a remembered grant rotates its epoch, invalidating the earlier token.
    const writer=await f.authorize(true);
    assert.equal((await call(writer.access_token,{...args,cards:[args.cards[0],{...args.cards[1],question:'Keine Lücke'}]})).isError,true);
    assert.equal((await f.store.finde('saetze',{bereich:'ws_test',tabelle:'blocks'})).length,1);
    const first=await call(writer.access_token,args);
    assert.notEqual(first.isError,true,JSON.stringify(first));
    const set=JSON.parse(first.content[0]!.text);
    assert.equal(set.count,2);assert.equal(set.parentVersion,2);
    const page=await f.store.hole('saetze',{bereich:'ws_test',id:'learning_set_page'});
    assert.deepEqual(JSON.parse(page!.daten).content,set.cardIds);
    for(const id of set.cardIds){
      const row=await f.store.hole('saetze',{bereich:'ws_test',id});
      const card=JSON.parse(row!.daten);
      assert.equal(card.type,'flashcard');assert.equal(card.quiz.kapitel,'Elektrotechnik');assert.equal(card.quiz.subject,'ET');
    }
    const retry=JSON.parse((await call(writer.access_token,args)).content[0]!.text);
    assert.deepEqual(retry.cardIds,set.cardIds);assert.equal(retry.alreadyExists,true);
    assert.equal((await call(writer.access_token,{...args,requestId:'learning_set_002'})).isError,true);
    assert.equal((await call(writer.access_token,{...args,expectedVersion:2,cards:[{...args.cards[0],answer:'Ampere'}]})).isError,true);
    assert.equal((await f.store.finde('saetze',{bereich:'ws_test',tabelle:'blocks'})).length,3);
  }finally{f.close();}
});

test('Cloud-MCP native visual objects with version protection',async()=>{
 const f=await fixture();try{
 await f.store.setze('saetze',{id:'visual_page',bereich:'ws_test',tabelle:'blocks',daten:JSON.stringify({type:'page',text:'Visuals',content:[]}),verschluesselt:0,seite:'visual_page',version:1,geaendert:'',geloescht:0,vonGeraet:'Test'});
 const reader=await f.authorize(false),base={workspaceId:'ws_test',documentId:'visual_page',expectedVersion:1,requestId:'native_map_001',title:'RED ION',nodes:[{id:'root',text:'RED ION',parentId:null},{id:'learn',text:'Lernen',parentId:'root'}]};
 const call=async(token:string,name:string,args:Record<string,unknown>)=>(await f.rpc(token,'tools/call',{name,arguments:args})).data.result;
 assert.equal((await call(reader.access_token,'redion_create_mindmap',base)).isError,true);
 const writer=await f.authorize(true),run=(name:string,args:Record<string,unknown>)=>call(writer.access_token,name,args);
 const ok=async(name:string,args:Record<string,unknown>)=>{const x=await run(name,args);assert.notEqual(x.isError,true,JSON.stringify(x));return JSON.parse(x.content[0].text);};
 assert.equal((await run('redion_create_mindmap',{...base,nodes:[{id:'x',text:'X',parentId:'x'}]})).isError,true);
 const map=await ok('redion_create_mindmap',base),ref={workspaceId:'ws_test',blockId:map.blockId};
 assert.equal(map.parentVersion,2);assert.equal((await ok('redion_create_mindmap',base)).alreadyExists,true);
 const read=await ok('redion_read_visual',ref);assert.equal(read.type,'mindmap');assert.equal(read.karte.knoten[1].eltern,'root');
 assert.equal((await ok('redion_update_visual',{...ref,expectedVersion:1,operation:'replace_mindmap',nodes:[...base.nodes,{id:'docs',text:'Dokumente',parentId:'root'}]})).version,2);
 assert.equal((await run('redion_update_visual',{...ref,expectedVersion:1,operation:'replace_mindmap',nodes:base.nodes})).isError,true);
 assert.equal((await ok('redion_update_visual',{...ref,expectedVersion:2,operation:'rename_node',elementId:'learn',text:'Lernzentrum'})).version,3);
 assert.equal((await ok('redion_update_visual',{...ref,expectedVersion:3,operation:'style_node',elementId:'learn',color:'#ff0000',form:'pille'})).version,4);
 assert.equal((await run('redion_update_visual',{...ref,expectedVersion:4,operation:'delete_branch',elementId:'root'})).isError,true);
 await ok('redion_update_visual',{...ref,expectedVersion:4,operation:'delete_branch',elementId:'docs'});
 const renamed=await ok('redion_read_visual',ref);assert.equal(renamed.karte.knoten.length,2);assert.equal(renamed.karte.knoten[1].text,'Lernzentrum');assert.equal(renamed.karte.knoten[1].farbe,'#ff0000');
 await ok('redion_update_visual',{...ref,expectedVersion:5,operation:'append_node',node:{id:'topic',text:'Projekte',parentId:'root'}});
 await ok('redion_update_visual',{...ref,expectedVersion:6,operation:'append_node',node:{id:'detail',text:'Planung',parentId:'topic'}});
 await ok('redion_update_visual',{...ref,expectedVersion:7,operation:'move_node',elementId:'detail',parentId:'learn'});
 const cycle=await run('redion_update_visual',{...ref,expectedVersion:8,operation:'move_node',elementId:'learn',parentId:'detail'});
 assert.match(JSON.parse(cycle.content[0].text).message,/zyklisch/);
 await ok('redion_update_visual',{...ref,expectedVersion:8,operation:'add_connection',connection:{id:'cross',from:'topic',to:'detail'}});
 const links=await ok('redion_read_visual',{...ref,collection:'connections'});
 assert.deepEqual(links.items,[{id:'cross',von:'topic',zu:'detail'}]);
 const duplicate=await run('redion_update_visual',{...ref,expectedVersion:9,operation:'add_connection',connection:{id:'back',from:'detail',to:'topic'}});
 assert.equal(JSON.parse(duplicate.content[0].text).code,'invalid_arguments');
 await ok('redion_update_visual',{...ref,expectedVersion:9,operation:'remove_connection',elementId:'cross'});
 const edited=await ok('redion_read_visual',ref);
 assert.equal(edited.karte.knoten.find((node:any)=>node.id==='detail').eltern,'learn');
 assert.equal(edited.karte.knoten.find((node:any)=>node.id==='learn').farbe,'#ff0000');
 assert.deepEqual(edited.karte.verbindungen,[]);
 const wb=await ok('redion_create_whiteboard',{workspaceId:'ws_test',documentId:'visual_page',expectedVersion:2,requestId:'native_board_001',title:'Board',shapes:[{id:'n',kind:'notiz',x:20,y:20,width:180,height:90,text:'Idee'}]});
 assert.equal((await ok('redion_read_visual',{workspaceId:'ws_test',blockId:wb.blockId})).shapes[0].art,'notiz');
 const bref={workspaceId:'ws_test',blockId:wb.blockId};
 await ok('redion_update_visual',{...bref,expectedVersion:1,operation:'move_shape',elementId:'n',x:50,y:70});
 await ok('redion_update_visual',{...bref,expectedVersion:2,operation:'resize_shape',elementId:'n',width:220,height:110});
 await ok('redion_update_visual',{...bref,expectedVersion:3,operation:'style_shape',elementId:'n',text:'Neue Idee',color:'#ff0000'});
 const bEdit=await ok('redion_read_visual',bref);assert.equal(bEdit.shapes[0].x,50);assert.equal(bEdit.shapes[0].w,220);assert.equal(bEdit.shapes[0].text,'Neue Idee');
 await ok('redion_update_visual',{...bref,expectedVersion:4,operation:'delete_shape',elementId:'n'});
 assert.equal((await ok('redion_read_visual',bref)).shapes.length,0);
 await ok('redion_update_visual',{...bref,expectedVersion:5,operation:'append_shapes',shapes:[{id:'ink',kind:'stift',points:[[10,20],[30,40],[50,60]],pressure:[0.4,0.8,0.5],strokeWidth:3,marker:true},{id:'rect',kind:'rechteck',x:20,y:20,width:100,height:80}]});
 const ink=await ok('redion_read_visual',bref);assert.deepEqual(ink.shapes[0].pts,[[10,20],[30,40],[50,60]]);assert.equal(ink.shapes[0].strichBreite,3);
 const firstShape=await ok('redion_read_visual',{...bref,collection:'shapes',limit:1});
 assert.equal(firstShape.nextOffset,1);
 assert.equal(firstShape.items[0].id,'ink');
 const secondShape=await ok('redion_read_visual',{...bref,offset:1,limit:1,expectedVersion:firstShape.version});
 assert.equal(secondShape.items[0].id,'rect');
 assert.equal(secondShape.nextOffset,null);
 await ok('redion_update_visual',{...bref,expectedVersion:6,operation:'move_stroke',elementId:'ink',dx:5,dy:-5});
 const outdated=await run('redion_read_visual',{...bref,offset:1,expectedVersion:firstShape.version});
 assert.equal(JSON.parse(outdated.content[0].text).code,'conflict');
 await ok('redion_update_visual',{...bref,expectedVersion:7,operation:'rotate_shape',elementId:'rect',rotation:45});
 await ok('redion_update_visual',{...bref,expectedVersion:8,operation:'order_shape',elementId:'ink',order:'front'});
 await ok('redion_update_visual',{...bref,expectedVersion:9,operation:'lock_shape',elementId:'rect',locked:true});
 assert.equal((await run('redion_update_visual',{...bref,expectedVersion:10,operation:'move_shape',elementId:'rect',x:10,y:10})).isError,true);
 const locked=await ok('redion_read_visual',bref);assert.equal(locked.shapes[0].id,'rect');assert.equal(locked.shapes[0].rotation,45);assert.equal(locked.shapes[0].locked,true);assert.deepEqual(locked.shapes[1].pts[0],[15,15]);
 await ok('redion_update_visual',{...bref,expectedVersion:10,operation:'lock_shape',elementId:'rect',locked:false});
 assert.equal((await run('redion_update_visual',{...bref,expectedVersion:11,operation:'append_shapes',shapes:[{id:'invalid',kind:'stift',points:[[1,2],[3,4]],pressure:[0.5]}]})).isError,true);
 assert.equal((await ok('redion_read_visual',bref)).version,11);
 await ok('redion_update_visual',{...bref,expectedVersion:11,operation:'append_shapes',shapes:[
   {id:'loose',kind:'rechteck',x:240,y:140,width:50,height:50},
   {id:'link',kind:'verbindung',from:'rect',to:'loose'}
 ]});
 await ok('redion_update_visual',{...bref,expectedVersion:12,operation:'group_selection',selection:['rect','ink'],groupId:'inner'});
 await ok('redion_update_visual',{...bref,expectedVersion:13,operation:'group_selection',selection:['ink'],groupId:'outer'});
 const nested=await ok('redion_read_visual',bref);
 assert.deepEqual(nested.shapes.find((s:any)=>s.id==='rect').groupPath,['inner','outer']);
 assert.deepEqual(nested.shapes.find((s:any)=>s.id==='ink').groupPath,['inner','outer']);
 await ok('redion_update_visual',{...bref,expectedVersion:14,operation:'ungroup_selection',selection:['rect']});
 await ok('redion_update_visual',{...bref,expectedVersion:15,operation:'lock_shape',elementId:'rect',locked:true});
 const align={...bref,operation:'align_selection',selection:['ink','loose'],alignment:'left'};
 const blockedAlign=await run('redion_update_visual',{...align,expectedVersion:16});
 assert.match(JSON.parse(blockedAlign.content[0].text).message,/gesperrt/);
 await ok('redion_update_visual',{...bref,expectedVersion:16,operation:'lock_shape',elementId:'rect',locked:false});
 await ok('redion_update_visual',{...align,expectedVersion:17});
 const aligned=await ok('redion_read_visual',bref);
 const loose=aligned.shapes.find((s:any)=>s.id==='loose');
 assert.equal(loose.groupId,undefined);
 assert.ok(loose.x>=0&&loose.x<25);
 assert.deepEqual(aligned.shapes.find((s:any)=>s.id==='ink').groupPath,['inner']);
 assert.deepEqual(aligned.shapes.find((s:any)=>s.id==='ink').pts[0],[15,15]);
 assert.deepEqual(aligned.shapes.find((s:any)=>s.id==='link'),nested.shapes.find((s:any)=>s.id==='link'));
 await ok('redion_update_visual',{...bref,expectedVersion:18,operation:'move_selection',selection:['rect'],dx:30,dy:40});
 const movedGroup=await ok('redion_read_visual',bref);
 assert.equal(movedGroup.shapes.find((s:any)=>s.id==='rect').x,50);
 assert.deepEqual(movedGroup.shapes.find((s:any)=>s.id==='ink').pts[0],[45,55]);
 assert.equal(movedGroup.shapes.find((s:any)=>s.id==='loose').x,loose.x);
 await ok('redion_update_visual',{...bref,expectedVersion:19,operation:'order_selection',selection:['ink'],order:'front'});
 const ordered=await ok('redion_read_visual',bref);
 assert.deepEqual(ordered.shapes.filter((s:any)=>s.art!=='verbindung').map((s:any)=>s.id),['loose','rect','ink']);
 await ok('redion_update_visual',{...bref,expectedVersion:20,operation:'ungroup_selection',selection:['ink']});
 assert.equal((await ok('redion_read_visual',bref)).shapes.find((s:any)=>s.id==='rect').groupId,undefined);
 const textMark={id:'title',kind:'text',text:'Übungsblatt',x:50,y:60,width:320,fontSize:24,bold:true};
 const penMark={id:'stroke',kind:'stift',color:'#2e77a5',points:[[50,895],[140,900],[230,895]]};
 const sheetArgs={workspaceId:'ws_test',documentId:'visual_page',expectedVersion:3,requestId:'native_sheet_001',title:'A4',paper:'kariert',pages:2,marks:[textMark]};
 const sheet=await ok('redion_create_sheet',sheetArgs);
 assert.equal((await ok('redion_create_sheet',sheetArgs)).blockId,sheet.blockId);
 const sheetRef={workspaceId:'ws_test',blockId:sheet.blockId};
 assert.equal((await ok('redion_read_visual',sheetRef)).blattHoehe,1683.78);
 const append={...sheetRef,expectedVersion:1,operation:'append_marks'};
 for(const invalid of [textMark,{...penMark,id:'ausserhalb',points:[[10,40],[596,900]]}]){
   const rejected=await run('redion_update_visual',{...append,marks:[penMark,invalid]});
   assert.equal(JSON.parse(rejected.content[0].text).code,'invalid_arguments');
 }
 const firstMarks=await ok('redion_read_visual',{...sheetRef,collection:'marks',limit:1});
 assert.equal(firstMarks.coordinateSpace,'sheetPoints');
 assert.deepEqual(firstMarks.items[0],{id:'title',art:'text',farbe:'#2e77a5',point:[50,60],text:'Übungsblatt',breiteBox:320,fontSize:24,fett:true});
 assert.equal(firstMarks.nextOffset,null);
 await ok('redion_update_visual',{...append,marks:[penMark]});
 const marked=await ok('redion_read_visual',{...sheetRef,collection:'marks',limit:1,expectedVersion:2});
 assert.equal(marked.nextOffset,1);
 assert.deepEqual((await ok('redion_read_visual',{...sheetRef,offset:1,expectedVersion:2})).items[0].pts,penMark.points);
 assert.equal(JSON.parse((await run('redion_update_visual',{...append,marks:[penMark]})).content[0].text).code,'conflict');
 const move={...sheetRef,expectedVersion:2,operation:'move_mark',elementId:'stroke',dx:10,dy:-30};
 const movedOutside=await run('redion_update_visual',{...move,dx:-51});
 assert.equal(JSON.parse(movedOutside.content[0].text).code,'invalid_arguments');
 assert.equal((await ok('redion_update_visual',move)).version,3);
 const movedMarks=await ok('redion_read_visual',{...sheetRef,collection:'marks'});
 assert.deepEqual(movedMarks.items[0],firstMarks.items[0]);
 assert.deepEqual(movedMarks.items[1].pts,[[60,865],[150,870],[240,865]]);
 const pageRecord=await f.store.hole('saetze',{bereich:'ws_test',id:'visual_page'});
 assert.ok(pageRecord);
 const prepare=f.db.prepare;
 let parentChanged=false;
 f.db.prepare=function(sql){
   const statement=prepare.call(this,sql);
   if(!sql.startsWith('UPDATE saetze SET daten=?1,version=version+1')||!sql.includes('AND daten=?7'))return statement;
   const first=statement.first.bind(statement);
   statement.first=async function<T>(){
     const parent=JSON.parse(String(pageRecord.daten));
     parent.content=parent.content.filter((child:string)=>child!==sheet.blockId);
     await f.store.setze('saetze',{...pageRecord,daten:JSON.stringify(parent),version:Number(pageRecord.version)+1});
     parentChanged=true;
     return first<T>();
   };
   return statement;
 };
 try{
   const raced=await run('redion_update_visual',{workspaceId:'ws_test',blockId:sheet.blockId,
     expectedVersion:3,operation:'set_paper',paper:'blanko'});
   assert.equal(parentChanged,true);
   assert.equal(JSON.parse(raced.content[0].text).code,'conflict');
   const saved=await f.store.hole('saetze',{bereich:'ws_test',id:sheet.blockId});
   assert.equal(saved?.version,3);
   assert.equal(JSON.parse(String(saved?.daten)).papier,'kariert');
 }finally{f.db.prepare=prepare;}
 const reviewClient=await f.oauth.register({client_name:'Synthetic visual reader',
   redirect_uris:['https://reader.example.test/callback'],grant_types:['authorization_code']});
 const readOnly=await f.authorize(false,'owner',reviewClient);
 const readerResult=await call(readOnly.access_token,'redion_read_visual',ref);
 assert.notEqual(readerResult.isError,true);
 assert.deepEqual(JSON.parse(readerResult.content[0].text),edited);
 const forbiddenEdit=await call(readOnly.access_token,'redion_update_visual',{
   ...ref,expectedVersion:1,operation:'rename_node',elementId:'learn',text:'Verboten'
 });
 assert.equal(forbiddenEdit.isError,true);
 assert.equal(JSON.parse(forbiddenEdit.content[0].text).code,'forbidden');
 const mapRecord=await f.store.hole('saetze',{bereich:'ws_test',id:ref.blockId});
 assert.ok(mapRecord);
 const mapData=JSON.parse(String(mapRecord.daten));
 const originalNodes=mapData.karte.knoten.length;
 const nodes=Array.from({length:80},(_,i)=>({id:'long_'+i,text:'漢'.repeat(400),eltern:'root'}));
 mapData.karte.knoten.push(...nodes);
 await f.store.setze('saetze',{...mapRecord,daten:JSON.stringify(mapData),version:Number(mapRecord.version)+1});
 const readAsReader=(options:Record<string,unknown>)=>call(readOnly.access_token,'redion_read_visual',{...ref,...options});
 assert.equal(JSON.parse((await readAsReader({})).content[0].text).code,'too_large');
 const firstPage=JSON.parse((await readAsReader({collection:'nodes',limit:40})).content[0].text);
 assert.equal(firstPage.items[0].id,'root');
 assert.ok(firstPage.nextOffset>originalNodes&&firstPage.nextOffset<40,'Bytegrenze begrenzt auch Unicode-Daten');
 const unversioned=await readAsReader({collection:'nodes',offset:firstPage.nextOffset});
 assert.equal(JSON.parse(unversioned.content[0].text).code,'invalid_arguments');
 const nextPage=JSON.parse((await readAsReader({
   collection:'nodes',offset:firstPage.nextOffset,expectedVersion:firstPage.version
 })).content[0].text);
 assert.equal(nextPage.items[0].id,nodes[firstPage.nextOffset-originalNodes]?.id);
 const currentPage=await f.store.hole('saetze',{bereich:'ws_test',id:'visual_page'});
 assert.ok(currentPage);
 const manyNodes=[{id:'root',text:'Übersicht',parentId:null},
   ...Array.from({length:150},(_,i)=>({id:'node_'+i,text:'Thema '+i,parentId:'root'}))];
 const large=await ok('redion_create_mindmap',{...base,nodes:manyNodes,
   expectedVersion:Number(currentPage.version),requestId:'native_map_large_001'});
 const lastPage=await ok('redion_read_visual',{workspaceId:'ws_test',blockId:large.blockId,
   offset:150,limit:40,expectedVersion:1});
 assert.deepEqual(lastPage.items,[{id:'node_149',text:'Thema 149',eltern:'root'}]);
 assert.equal(lastPage.nextOffset,null);
 const landscapeArgs={...sheetArgs,expectedVersion:large.parentVersion,requestId:'native_sheet_landscape',
   orientation:'landscape',marks:[{...textMark,x:650,y:640,width:160}]};
 const landscape=await ok('redion_create_sheet',landscapeArgs);
 const landscapeRef={workspaceId:'ws_test',blockId:landscape.blockId};
 const landscapeRead=await ok('redion_read_visual',landscapeRef);
 assert.equal(landscapeRead.blattBreite,841.89);
 assert.equal(landscapeRead.blattHoehe,1190.56);
 assert.equal(landscapeRead.orientation,'landscape');
 assert.deepEqual((await ok('redion_read_visual',{...landscapeRef,collection:'marks'})).items[0].point,[650,640]);
 const mismatched=await run('redion_create_sheet',{...landscapeArgs,requestId:'native_sheet_bad_portrait',
   expectedVersion:landscape.parentVersion,orientation:'portrait'});
 assert.equal(JSON.parse(mismatched.content[0].text).code,'invalid_arguments');
 }finally{f.close();}
});

test('Cloud-MCP reads prepared PDF text and edits native marks within the page grant',async()=>{
 const f=await fixture();
 try{
  const storage={bereich:'ws_test',tabelle:'blocks',verschluesselt:0,seite:'pdf_parent',version:1,
    geaendert:'2026-11-23',geloescht:0,vonGeraet:'Test'};
  const firstText='A'.repeat(499)+'📄';
  const pdf={type:'pdfseite',text:'',id:'pdf_page',parentId:'pdf_parent',parentTable:'block',
    nr:2,vonSeiten:3,bw:420,bh:595,gedreht:90,suchtext:firstText+' Stromkreis',raumVersion:1,
    quelleId:'synthetic_source',bildDateiId:'synthetic_preview'};
  await f.store.setze('saetze',{...storage,id:'pdf_parent',daten:JSON.stringify({type:'page',content:['pdf_page']})});
  await f.store.setze('saetze',{...storage,id:pdf.id,daten:JSON.stringify(pdf)});
  await f.store.setze('saetze',{...storage,id:'detached',daten:JSON.stringify({...pdf,id:'detached'})});
  const readClient=await f.oauth.register({client_name:'Synthetic PDF reader',
    redirect_uris:['https://reader.example.test/callback'],grant_types:['authorization_code']});
  const reader=await f.authorize(false,'owner',readClient),writer=await f.authorize(true);
  const ref={workspaceId:'ws_test',blockId:'pdf_page'};
  const call=async(token:string,name:string,args:Record<string,unknown>)=>{
    const response=await f.rpc(token,'tools/call',{name,arguments:{...ref,...args}});
    assert.equal(response.status,200);
    return JSON.parse(response.data.result.content[0].text);
  };
  const read=(args:Record<string,unknown>={})=>call(reader.access_token,'redion_read_visual',args);
  const update=(args:Record<string,unknown>)=>call(writer.access_token,'redion_update_visual',args);
  assert.deepEqual(await read(),{...ref,documentId:'pdf_parent',type:'pdfseite',version:1,
    width:420,height:595,rotation:90,pageNumber:2,pageCount:3,hasText:true});
  assert.equal((await read({blockId:'detached'})).code,'not_found');
  const text=await read({collection:'pdf_text',limit:1});
  assert.deepEqual(text.items,[firstText]);
  assert.equal(text.nextOffset,1);
  assert.deepEqual((await read({collection:'pdf_text',offset:1,expectedVersion:1})).items,[' Stromkreis']);
  const mark={id:'highlight',kind:'marker',points:[[30,45],[185,45]],color:'#efb62e'};
  const append={expectedVersion:1,operation:'append_marks',marks:[mark]};
  assert.equal((await call(reader.access_token,'redion_update_visual',append)).code,'forbidden');
  assert.equal((await update({...append,marks:[{...mark,points:[[30,45],[421,45]]}]})).code,'invalid_arguments');
  assert.equal((await update(append)).version,2);
  assert.equal((await read({collection:'pdf_text',offset:1,expectedVersion:1})).code,'conflict');
  const moved=await update({expectedVersion:2,operation:'move_mark',elementId:'highlight',dx:10,dy:15});
  assert.equal(moved.version,3);
  assert.deepEqual((await read({collection:'marks'})).items[0].pts,[[40,60],[195,60]]);
  const saved=await f.store.hole('saetze',{bereich:'ws_test',id:pdf.id});
  const data=JSON.parse(String(saved?.daten));
  assert.equal(data.quelleId,pdf.quelleId);
  assert.equal(data.bildDateiId,pdf.bildDateiId);
  assert.equal(data.suchtext,pdf.suchtext);
 }finally{f.close();}
});

test('Cloud-MCP edits native database rows atomically with live rights and version protection',async()=>{
 const f=await fixture();
 try{
  const put=(id:string,tabelle:string,seite:string,data:Record<string,unknown>,version=1)=>
    f.store.setze('saetze',{id,tabelle,seite,bereich:'ws_test',daten:JSON.stringify(data),
      version,geloescht:0,verschluesselt:0,geaendert:'2026-11-25',vonGeraet:'Test'});
  const schema={title:{type:'title'},amount:{type:'number'},date:{type:'date'},done:{type:'checkbox'},
    hidden:{type:'text'},result:{type:'formula'}};
  await put('table_page','blocks','table_page',{type:'page',content:['table_block']});
  await put('table_block','blocks','table_page',{type:'database',parentId:'table_page',collectionId:'table_collection'});
  await put('detached_table','blocks','table_page',{type:'database',parentId:'table_page',collectionId:'table_collection'});
  await put('table_collection','collections','table_collection',{schema});
  for(const id of ['table_row_1','table_row_2'])await put(id,'blocks',id,{id,type:'page',
    parentId:'table_collection',parentTable:'collection',text:'vorher',props:{amount:20,hidden:'bleibt'},content:[]});
  await f.store.setze('konten',{id:'table_editor',mail:'table_editor@example.test',name:'Editor',herkunft:'github',angelegt:'',gesperrt:0});
  await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'table_editor',rolle:'edit',von:'owner',wann:''});
  const protect=(feld:string,rolle:string)=>f.store.setze('feldrechte',{bereich:'ws_test',sammlung:'table_collection',
    feld,kontoId:'table_editor',rolle,von:'owner',wann:''});
  await protect('hidden','kein');
  const token=await f.authorize(true,'table_editor');
  const readOnly=await f.authorize(false);
  const base={workspaceId:'ws_test',databaseId:'table_collection',databaseBlockId:'table_block',
    expectedDatabaseVersion:1,changes:[
      {rowId:'table_row_1',expectedVersion:1,values:{title:'A',amount:31.5,done:false}},
      {rowId:'table_row_2',expectedVersion:1,values:{title:'B',date:'2026-11-27'}}
    ]};
  const call=async(patch:Record<string,unknown>={},access=token.access_token)=>{
    const res=await f.rpc(access,'tools/call',{name:'redion_update_database_rows',arguments:{...base,...patch}});
    assert.equal(res.status,200);
    return JSON.parse(res.data.result.content[0].text);
  };
  const row=(id:string)=>f.store.hole('saetze',{bereich:'ws_test',id});
  assert.equal((await call({},readOnly.access_token)).code,'forbidden');
  assert.equal((await call({databaseBlockId:'detached_table'})).code,'not_found');
  assert.equal((await call({expectedDatabaseVersion:2})).code,'conflict');
  const other=base.changes[1]!;
  for(const [change,code] of [
    [{...other,expectedVersion:2},'conflict'],
    [{...other,values:{date:'2026-02-30'}},'invalid_arguments'],
    [{...other,values:{result:'1+1'}},'invalid_arguments'],
    [{...other,values:{hidden:'unerlaubt'}},'forbidden'],
    [base.changes[0],'invalid_arguments']
  ] as const){
    assert.equal((await call({changes:[base.changes[0],change]})).code,code);
    assert.equal((await row('table_row_1'))?.version,1);
  }
  const prepare=f.db.prepare;
  let beforeWrite:()=>Promise<unknown>=()=>protect('amount','lesen');
  f.db.prepare=function(sql){
    const stmt=prepare.call(this,sql);
    if(sql.includes('eligible AS MATERIALIZED')){
      const run=stmt.all.bind(stmt);
      stmt.all=async function<T>(){
        await beforeWrite();
        return run<T>();
      };
    }
    return stmt;
  };
  try{
    assert.equal((await call()).code,'conflict');
    assert.equal((await row('table_row_1'))?.version,1);
    assert.equal((await row('table_row_2'))?.version,1);
    await protect('amount','voll');
    beforeWrite=async()=>{
      const saved=await row('table_row_2');
      assert.ok(saved);
      await f.store.setze('saetze',{...saved,version:2,daten:JSON.stringify({
        ...JSON.parse(String(saved.daten)),icon:'🔧'
      })});
    };
    assert.equal((await call()).code,'conflict');
    assert.equal((await row('table_row_1'))?.version,1);
    assert.equal((await row('table_row_2'))?.version,2);
  }finally{f.db.prepare=prepare;}
  assert.deepEqual((await call({changes:[base.changes[0],{...other,expectedVersion:2}]})).rows,
    [{rowId:'table_row_1',version:2},{rowId:'table_row_2',version:3}]);
  assert.equal((await call()).code,'conflict');
  const saved=JSON.parse(String((await row('table_row_1'))?.daten));
  assert.equal(saved.text,'A');
  assert.deepEqual(saved.props,{amount:31.5,hidden:'bleibt',done:false});
  assert.equal(saved.parentId,'table_collection');
  assert.equal(JSON.parse(String((await row('table_row_2'))?.daten)).icon,'🔧');
  const readable=await f.rpc(token.access_token,'tools/call',{name:'redion_read_database',
    arguments:{workspaceId:'ws_test',databaseId:'table_collection'}});
  assert.equal(JSON.parse(readable.data.result.content[0].text).rows.find((entry:{rowId:string})=>
    entry.rowId==='table_row_1').values.amount,31.5);
  const app=await redionKern.syncWeg({suche:{}},f.store,
    {konto:{id:'table_editor'},rechte:['alles']},['sync','runter'],'POST',
    {bereich:'ws_test',seit:new Date(Date.now()-60000).toISOString()},{'redion-geraet':'iPhone'});
  assert.equal(app.status,200);
  const delta=JSON.parse(app.koerper).saetze.find((entry:{id:string})=>entry.id==='table_row_1');
  assert.equal(delta.version,2);
  assert.deepEqual(JSON.parse(delta.daten).props,{amount:31.5,done:false});
 }finally{f.close();}
});

test('Cloud-MCP archives, finds and restores native pages without deleting content',async()=>{
 const f=await fixture();
 try{
  const readClient=await f.oauth.register({client_name:'Synthetic archive reader',
    redirect_uris:['https://reader.example.test/callback'],grant_types:['authorization_code']});
  const reader=await f.authorize(false,'owner',readClient),writer=await f.authorize(true);
  const call=async(token:string,name:string,args:Record<string,unknown>)=>{
    const response=await f.rpc(token,'tools/call',{name,arguments:{workspaceId:'ws_test',...args}});
    assert.equal(response.status,200);
    return JSON.parse(response.data.result.content[0].text);
  };
  const root=await call(writer.access_token,'redion_create_page',{title:'Werkstattarchiv',requestId:'archive_root_seed'});
  const child=await call(writer.access_token,'redion_create_page',{title:'Messreihe',content:'Zwei Prüfungen',
    parentId:root.documentId,requestId:'archive_child_seed'});
  const args={documentId:child.documentId,expectedVersion:1,archived:true};
  const archive=(patch:Record<string,unknown>={})=>call(writer.access_token,'redion_update_page',{...args,...patch});
  const list=(archived?:boolean)=>call(reader.access_token,'redion_list_child_pages',{parentId:root.documentId,...(archived===undefined?{}:{archived})});
  const find=(archived:boolean)=>call(reader.access_token,'redion_search',{query:'Messreihe',archived});
  assert.equal((await call(reader.access_token,'redion_update_page',args)).code,'forbidden');
  assert.equal((await archive({archived:'true'})).code,'invalid_arguments');
  assert.equal((await list()).documents[0].documentId,child.documentId);
  assert.equal((await archive()).version,2);
  assert.equal((await archive()).code,'conflict');
  assert.deepEqual(await archive({expectedVersion:2}),{documentId:child.documentId,archived:true,version:2,unchanged:true});
  assert.deepEqual((await list()).documents,[]);
  assert.deepEqual((await find(false)).documents,[]);
  assert.equal((await list(true)).documents[0].documentId,child.documentId);
  assert.equal((await find(true)).documents[0].documentId,child.documentId);
  const read=await call(reader.access_token,'redion_read_page',{documentId:child.documentId});
  assert.equal(read.archived,true);
  assert.equal(read.markdown,'Zwei Prüfungen');
  const saved=await f.store.hole('saetze',{bereich:'ws_test',id:child.documentId});
  assert.equal(saved?.geloescht,0);
  const data=JSON.parse(String(saved?.daten));
  assert.equal(data.parentId,root.documentId);
  assert.ok(Number.isFinite(Date.parse(data.archiviertAm)));
  const restored=await archive({expectedVersion:2,archived:false});
  assert.equal(restored.archived,false);
  assert.equal(restored.version,3);
  assert.equal((await list()).documents[0].documentId,child.documentId);
  assert.deepEqual((await list(true)).documents,[]);
 }finally{f.close();}
});


test('Cloud MCP: opt-in Undo speichert und verbraucht Prüfpunkt atomar',async()=>{
  const f=await fixture();
  try{
    await f.store.setze('konten',{id:'undo_reader',mail:'undo-reader@example.test',
      name:'Undo Reader',herkunft:'github',angelegt:'',gesperrt:0});
    await f.store.setze('freigaben',{bereich:'ws_test',seite:'*',kontoId:'undo_reader',
      rolle:'lesen',von:'owner',wann:'2026-11-27'});
    const reader=await f.authorize(false,'undo_reader');
    const writer=await f.authorize(true);
    await f.store.setze('saetze',{id:'undo_page',bereich:'ws_test',tabelle:'blocks',
      daten:JSON.stringify({type:'page',text:'Undo',content:[]}),
      verschluesselt:0,seite:'undo_page',version:1,geaendert:'',geloescht:0,vonGeraet:'Test'});
    const call=async(name:string,args:Record<string,unknown>,token=writer.access_token)=>{
      const r=await f.rpc(token,'tools/call',{name,arguments:{workspaceId:'ws_test',...args}});
      assert.equal(r.status,200);
      return JSON.parse(r.data.result.content[0].text);
    };
    const created=await call('redion_add_schematic',{documentId:'undo_page',
      art:'stromlauf-aufgeloest',expectedVersion:1,requestId:'undo_test_0001'});
    const blockId=created.blockId;
    assert.ok(blockId);
    const update=(args:Record<string,unknown>,token?:string)=>call('redion_update_schematic',{blockId,...args},token);
    const read=()=>call('redion_read_schematic',{blockId});
    const checkpoints=async()=>(await f.db.prepare("SELECT key FROM mcp_state WHERE kind='schematic_undo'").all<{key:string}>()).results;
    const initial=await read();
    const label={operation:'add_label',labelId:'T1',labelText:'Test',x:100,y:100};
    assert.equal((await update({...label,expectedVersion:1,retainUndo:true,dryRun:true})).code,'invalid_arguments');
    assert.equal((await update({...label,expectedVersion:1,dryRun:true})).saved,false);
    assert.equal((await checkpoints()).length,0);
    const edit=await update({...label,expectedVersion:1,retainUndo:true});
    assert.equal(edit.version,2,JSON.stringify(edit));
    assert.match(edit.undoId,/^schematic_undo:[a-f0-9-]{36}$/);
    assert.ok(edit.undoExpires>Date.now());
    assert.equal((await checkpoints()).length,1);
    assert.equal((await read()).plan.texte.length,1);
    assert.equal((await update({undoId:edit.undoId,expectedVersion:2},reader.access_token)).code,'forbidden');
    assert.equal((await update({undoId:edit.undoId,expectedVersion:1})).code,'conflict');
    assert.equal((await update({undoId:edit.undoId,expectedVersion:2,operation:'delete_label',labelId:'T1'})).code,'invalid_arguments');
    const restored=await update({undoId:edit.undoId,expectedVersion:2});
    assert.equal(restored.undone,true,JSON.stringify(restored));
    assert.equal(restored.version,3);
    assert.deepEqual((await read()).plan,initial.plan);
    assert.equal((await checkpoints()).length,0);
    assert.equal((await update({undoId:edit.undoId,expectedVersion:3})).code,'conflict');
    const saved=await update({...label,expectedVersion:3,retainUndo:true});
    assert.equal(saved.version,4,JSON.stringify(saved));
    const normal=await update({operation:'rename_label',labelId:'T1',labelText:'Neu',expectedVersion:4});
    assert.equal(normal.version,5);
    assert.equal(normal.undoId,undefined);
    assert.equal((await update({undoId:saved.undoId,expectedVersion:5})).code,'conflict');
    assert.equal((await read()).plan.texte[0].t,'Neu');
    const expiring=await update({operation:'rename_label',labelId:'T1',labelText:'Befristet',expectedVersion:5,retainUndo:true});
    assert.equal(expiring.version,6,JSON.stringify(expiring));
    await f.db.prepare("UPDATE mcp_state SET expires=?1 WHERE key=?2 RETURNING key")
      .bind(Date.now()-1000,expiring.undoId).first();
    assert.equal((await update({undoId:expiring.undoId,expectedVersion:6})).code,'conflict');
    assert.equal((await read()).version,6);
    const race=await Promise.all([
      update({operation:'rename_label',labelId:'T1',labelText:'A',expectedVersion:6,retainUndo:true}),
      update({operation:'rename_label',labelId:'T1',labelText:'B',expectedVersion:6,retainUndo:true})
    ]);
    assert.equal(race.filter(r=>r.version===7).length,1);
    assert.equal(race.filter(r=>r.code==='conflict').length,1);
    const winner=race.find(r=>r.version===7)!;
    const consumed=await Promise.all([
      update({undoId:winner.undoId,expectedVersion:7}),update({undoId:winner.undoId,expectedVersion:7})
    ]);
    assert.equal(consumed.filter(r=>r.undone===true).length,1);
    assert.equal(consumed.filter(r=>r.code==='conflict').length,1);
    assert.equal((await read()).plan.texte[0].t,'Befristet');
    assert.equal((await read()).version,8);
    assert.deepEqual((await checkpoints()).map(r=>r.key),[saved.undoId]);
  }finally{f.close();}
});
