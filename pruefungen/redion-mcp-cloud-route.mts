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
      /* Nur Lesewerkzeuge: Bereiche, Suche, Seite, Schaltzeichen, Schaltplan, Datenbanken. */
      const list=await client.listTools();
      assert.deepEqual(list.tools.map((t:{name:string})=>t.name).sort(),['redion_list_databases','redion_list_symbols',
        'redion_list_tasks','redion_list_workspaces','redion_read_database','redion_read_page','redion_read_schematic','redion_search']);
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
    assert.match(unauth.headers.get('www-authenticate')!,/scope="redion:read redion:write"/);
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

    /* Die Seite steht im Format der App (page-blocks.ts): sichtbar (`alive`),
       mit `created` und Kindblöcken — sonst läge sie dort im Papierkorb. */
    const row=await f.store.hole('saetze',{bereich:'ws_test',id:first.documentId});
    const pageData=JSON.parse(row!.daten);
    assert.equal(pageData.alive,true,'Seite muss in der App sichtbar sein');
    assert.equal(pageData.type,'page');
    assert.equal(pageData.parentTable,'block');
    assert.ok(pageData.created&&pageData.edited,'created/edited fehlen');
    assert.equal(pageData.inhalt,undefined,'kein Feld, das die App nicht kennt');
    assert.equal(pageData.content.length,1);
    const child=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:pageData.content[0]}))!.daten);
    assert.deepEqual([child.type,child.text,child.parentId,child.alive],['text','Ein geprüfter Inhalt',first.documentId,true]);

    const rich=await f.rpc(write.access_token,'tools/call',{name:'redion_create_page',arguments:{workspaceId:'ws_test',
      title:'Plan',content:'# Ziel\n\n- Punkt\n- [x] Erledigt\n1. Eins\n> Satz\n---\nText',requestId:'request_00002'}});
    const plan=JSON.parse(rich.data.result.content[0].text);
    const planData=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:plan.documentId}))!.daten);
    const kinds=[];
    for(const cid of planData.content)kinds.push(JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:cid}))!.daten));
    assert.deepEqual(kinds.map(k=>k.type),['h1','bullet','todo','number','quote','divider','text']);
    assert.equal(kinds[2].checked,true);
    const planRead=JSON.parse((await f.rpc(write.access_token,'tools/call',{name:'redion_read_page',arguments:{
      workspaceId:'ws_test',documentId:plan.documentId}})).data.result.content[0].text);
    assert.equal(planRead.content,'# Ziel\n- Punkt\n- [x] Erledigt\n1. Eins\n> Satz\n---\nText');
    const appended=JSON.parse((await f.rpc(write.access_token,'tools/call',{name:'redion_append_content',arguments:{
      workspaceId:'ws_test',documentId:plan.documentId,content:'## Neu',expectedVersion:1}})).data.result.content[0].text);
    assert.equal(appended.version,2);
    const trashed=JSON.parse((await f.rpc(write.access_token,'tools/call',{name:'redion_trash_page',arguments:{
      workspaceId:'ws_test',documentId:plan.documentId,expectedVersion:2}})).data.result.content[0].text);
    assert.equal(trashed.version,3);
    const trashedData=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:plan.documentId}))!.daten);
    assert.deepEqual([trashedData.alive,trashedData.content.length],[false,8]);

    /* Schaltpläne über MCP (schematic.ts, test644 prüft die Geometrie in der App). */
    const call=async(name:string,a:Record<string,unknown>)=>{
      const r=(await f.rpc(write.access_token,'tools/call',{name,arguments:{workspaceId:'ws_test',...a}})).data.result;
      return {fehler:r.isError===true,daten:r.isError?r.content[0].text:JSON.parse(r.content[0].text)};
    };
    const symbole=await call('redion_list_symbols',{suche:'spule'});
    assert.ok(symbole.daten.symbole.some((s:any)=>s.id==='spule'&&s.anschluesse.includes('A1')));
    const sp=await call('redion_create_page',{title:'Steuerung',requestId:'request_00003'});
    const added=await call('redion_add_schematic',{documentId:sp.daten.documentId,expectedVersion:1,titel:'Selbsthaltung',
      teile:[{zeichen:'taster-schliesser',x:100,y:100,bmk:'S1'},{zeichen:'spule',x:100,y:260}],
      verbindungen:[{von:'S1:4',nach:'K1:A1'}]});
    assert.equal(added.fehler,false,String(added.daten));
    assert.deepEqual([added.daten.teile,added.daten.leitungen,added.daten.version],[2,1,2]);
    const gelesen=await call('redion_read_schematic',{blockId:added.daten.blockId});
    assert.deepEqual(gelesen.daten.verbindungen,[{von:'S1:4',nach:'K1:A1'}]);
    assert.equal(gelesen.daten.titel,'Selbsthaltung');
    const seite=await call('redion_read_page',{documentId:sp.daten.documentId});
    assert.match(seite.daten.content,/⚡ Schaltplan „Selbsthaltung“ \(blockId /);
    const blockSatz=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:added.daten.blockId}))!.daten);
    assert.deepEqual([blockSatz.type,blockSatz.alive,blockSatz.parentId],['schaltplan',true,sp.daten.documentId]);
    const geaendert=await call('redion_update_schematic',{blockId:added.daten.blockId,expectedVersion:1,
      teile:[{zeichen:'spule',x:100,y:100,bmk:'K1'}]});
    assert.equal(geaendert.daten.version,2);
    const falsch=await call('redion_add_schematic',{documentId:sp.daten.documentId,expectedVersion:2,
      teile:[{zeichen:'gibtsnicht',x:0,y:0}]});
    assert.equal(falsch.fehler,true);
    assert.match(String(falsch.daten),/Unbekanntes Schaltzeichen/);

    /* Aufgaben und Termine: eine Seite „ChatGPT", je eine Datenbank, beim
       zweiten Aufruf wiedergefunden statt doppelt angelegt. */
    const a1=await call('redion_add_task',{titel:'Schütz prüfen',faellig:'2026-12-02'});
    const a2=await call('redion_add_task',{titel:'Bericht',status:'Erledigt'});
    assert.equal(a1.fehler,false,String(a1.daten));
    assert.equal(a1.daten.databaseId,a2.daten.databaseId);
    const t1=await call('redion_add_event',{titel:'Prüfung',datum:'2026-12-10',ort:'Zürich'});
    assert.equal(t1.fehler,false,String(t1.daten));
    assert.equal(t1.daten.seite,a1.daten.seite,'Termine und Aufgaben liegen auf derselben Seite');
    const home=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:a1.daten.seite}))!.daten);
    assert.deepEqual([home.text,home.content.length,home.alive],['ChatGPT',2,true]);
    const aufCol=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:a1.daten.databaseId}))!.daten);
    assert.equal(aufCol.istAufgaben,true);
    const offen=await call('redion_list_tasks',{nurOffen:true});
    assert.deepEqual(offen.daten.aufgaben.map((x:any)=>[x.titel,x.status,x.faellig]),[['Schütz prüfen','Offen','2026-12-02']]);
    const termine=await call('redion_read_database',{databaseId:t1.daten.databaseId});
    assert.deepEqual(termine.daten.zeilen[0].werte,{Termin:'Prüfung',Datum:'2026-12-10',Ort:'Zürich'});
    const viewT=(await f.store.finde('saetze',{bereich:'ws_test'})).map((s:any)=>s.tabelle==='views'?JSON.parse(s.daten):null)
      .find((v:any)=>v&&v.collectionId===t1.daten.databaseId);
    assert.equal(viewT.layout,'calendar');

    /* Seiten komplett: Code, Callout, Einrückung, Verschieben. */
    const md='## Plan\n- Oben\n    - Unten\n        - [ ] Ganz unten\n> 💡 Merke\n```ts\nconst a = 1;\n\n# kein Titel\n```\nEnde';
    const reich=await call('redion_create_page',{title:'Reich',content:md,requestId:'request_00004'});
    assert.equal(reich.daten.blocks,5,'oberste Ebene: Plan, Oben, Merke, Code, Ende');
    const reichGelesen=await call('redion_read_page',{documentId:reich.daten.documentId});
    assert.equal(reichGelesen.daten.content,'## Plan\n- Oben\n    - Unten\n        - [ ] Ganz unten\n> 💡 Merke\n```ts\nconst a = 1;\n\n# kein Titel\n```\nEnde');
    const reichDaten=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:reich.daten.documentId}))!.daten);
    const oben=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:reichDaten.content[1]}))!.daten);
    assert.deepEqual([oben.text,oben.content.length],['Oben',1],'Unten ist Kind von Oben');
    const code=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:reichDaten.content[3]}))!.daten);
    assert.deepEqual([code.type,code.lang],['code','ts']);
    const ziel=await call('redion_create_page',{title:'Ordner',requestId:'request_00005'});
    const mv=await call('redion_move_page',{documentId:reich.daten.documentId,newParentId:ziel.daten.documentId,expectedVersion:1});
    assert.equal(mv.fehler,false,String(mv.daten));
    const zielDaten=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:ziel.daten.documentId}))!.daten);
    assert.deepEqual(zielDaten.content,[reich.daten.documentId]);
    const ring=await call('redion_move_page',{documentId:ziel.daten.documentId,newParentId:reich.daten.documentId,expectedVersion:2});
    assert.equal(ring.fehler,true);assert.match(String(ring.daten),/liegt unter dieser Seite/);
    const zurueck=await call('redion_move_page',{documentId:reich.daten.documentId,newParentId:'',expectedVersion:mv.daten.version});
    assert.equal(zurueck.fehler,false,String(zurueck.daten));
    assert.deepEqual(JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:ziel.daten.documentId}))!.daten).content,[]);
    assert.equal(JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:reich.daten.documentId}))!.daten).parentId,null);

    /* Datenbanken über MCP (databases.ts). */
    const seite2=await call('redion_read_page',{documentId:sp.daten.documentId});
    const neuDb=await call('redion_create_database',{documentId:sp.daten.documentId,expectedVersion:seite2.daten.version,
      name:'Lernplan',ansicht:'board',spalten:[{name:'Thema',typ:'title'},{name:'Status',typ:'status'},
        {name:'Fach',typ:'select',optionen:['Elektro']},{name:'Bis',typ:'date'},{name:'Stunden',typ:'number'},{name:'Tags',typ:'multi'}],
      zeilen:[{Thema:'Schütze',Status:'Offen',Fach:'Elektro',Bis:'2026-12-01',Stunden:2,Tags:'Prüfung, Praxis'},
        {Thema:'FI',Status:'In Arbeit',Fach:'Mathe',Bis:'2026-12-03T10:00:00Z'}]});
    assert.equal(neuDb.fehler,false,String(neuDb.daten));
    assert.equal(neuDb.daten.rowIds.length,2);
    const col=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:neuDb.daten.databaseId}))!.daten);
    assert.equal(col.schema.title.name,'Thema');
    assert.deepEqual((Object.values(col.schema) as any[]).find((c:any)=>c.name==='Fach')!.options.map((o:any)=>o.name),['Elektro','Mathe'],
      'eine neue Auswahl kommt als Option dazu');
    const view=(await f.store.finde('saetze',{bereich:'ws_test'})).find((s:any)=>s.tabelle==='views');
    assert.equal(JSON.parse(view!.daten).layout,'board');
    const dbBlock=JSON.parse((await f.store.hole('saetze',{bereich:'ws_test',id:neuDb.daten.blockId}))!.daten);
    assert.deepEqual([dbBlock.type,dbBlock.collectionId,dbBlock.alive],['database',neuDb.daten.databaseId,true]);
    const liste=await call('redion_list_databases',{});
    assert.ok(liste.daten.databases.some((d:any)=>d.databaseId===neuDb.daten.databaseId&&d.name==='Lernplan'));
    const gelesenDb=await call('redion_read_database',{databaseId:neuDb.daten.databaseId});
    assert.deepEqual(gelesenDb.daten.zeilen.map((z:any)=>z.werte),[
      {Thema:'Schütze',Status:'Offen',Fach:'Elektro',Bis:'2026-12-01',Stunden:2,Tags:['Prüfung','Praxis']},
      {Thema:'FI',Status:'In Arbeit',Fach:'Mathe',Bis:'2026-12-03'}]);
    const mehr=await call('redion_add_rows',{databaseId:neuDb.daten.databaseId,zeilen:[{Thema:'Motor',Stunden:'1,5'}]});
    assert.equal(mehr.daten.rowIds.length,1);
    const zeile=gelesenDb.daten.zeilen[0];
    const upd=await call('redion_update_row',{rowId:zeile.rowId,expectedVersion:zeile.version,werte:{Status:'Erledigt'}});
    assert.equal(upd.daten.werte.Status,'Erledigt');
    const weg=await call('redion_update_row',{rowId:zeile.rowId,expectedVersion:upd.daten.version,papierkorb:true});
    assert.equal(weg.daten.inPapierkorb,true);
    const danach=await call('redion_read_database',{databaseId:neuDb.daten.databaseId});
    assert.deepEqual(danach.daten.zeilen.map((z:any)=>z.werte.Thema),['FI','Motor']);
    for(const [a,muster] of [[{zeilen:[{Unbekannt:1}]},/Keine Spalte „Unbekannt“/],[{zeilen:[{Stunden:'viel'}]},/braucht eine Zahl/],
      [{zeilen:[{Bis:'morgen'}]},/JJJJ-MM-TT/]] as const){
      const r=await call('redion_add_rows',{databaseId:neuDb.daten.databaseId,...a});
      assert.equal(r.fehler,true);assert.match(String(r.daten),muster);
    }

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
