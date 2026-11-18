import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {build} from 'rolldown';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {auth,type OAuthClientProvider} from '@modelcontextprotocol/sdk/client/auth.js';
import type {OAuthClientInformationMixed,OAuthTokens} from '@modelcontextprotocol/sdk/shared/auth.js';
import {cloudFixture,hidden} from '../../../pruefungen/helfer/mcp-cloud.mts';
import {cloudDatabase} from '../../../pruefungen/helfer/mcp-cloud-database.mts';
import type {createCloudMcpHttp as factory} from '../server/cloud-http.mts';
import {CLOUD_TOOL_NAMES} from '../../../server/mcp/tools.ts';

const output=path.resolve(import.meta.dirname,'../../../build/cloud-mcp-test.mjs');
await build({input:path.resolve(import.meta.dirname,'../server/cloud-http.mts'),platform:'neutral',resolve:{mainFields:['module','main']},output:{file:output,format:'esm',codeSplitting:false}});
const {createCloudMcpHttp}=await import(new URL('file:///'+output.replace(/\\/g,'/')).href) as {createCloudMcpHttp:typeof factory};

/** Ein MCP-Handler, der null liefert, hat die Adresse nicht erkannt — hier ein Fehler. */
const must=(response:Response|null):Response=>{assert.ok(response,'MCP-Handler gab null zurück');return response;};
const setup=async(scope='redion:read redion:write')=>{
  const fixture=cloudFixture(),db=cloudDatabase(fixture.sqlite),handler=createCloudMcpHttp({oauth:fixture.oauth,database:db.database,now:fixture.now});
  fixture.sqlite.prepare('INSERT INTO konten(id,gesperrt) VALUES(?,0)').run('owner');
  fixture.sqlite.prepare('INSERT INTO bereiche(id,name,besitzer) VALUES(?,?,?)').run('workspace-one','Synthetic','owner');
  const fetcher=async(input:string|URL|Request,init?:RequestInit):Promise<Response>=>{
    const request=new Request(input,init);return new URL(request.url).pathname==='/mcp'?(await handler(request))??new Response(null,{status:404}):fixture.fetcher(request);
  };
  let information:OAuthClientInformationMixed|undefined,tokens:OAuthTokens|undefined,verifier='',authorization:URL|undefined;
  const provider:OAuthClientProvider={redirectUrl:'https://ai.example.test/cb',clientMetadata:{client_name:'Synthetic SDK',redirect_uris:['https://ai.example.test/cb'],
    token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code'],scope},
    clientInformation:()=>information,saveClientInformation:next=>{information=next;},tokens:()=>tokens,saveTokens:next=>{tokens=next;},
    saveCodeVerifier:next=>{verifier=next;},codeVerifier:()=>verifier,redirectToAuthorization:next=>{authorization=next;}};
  const options={serverUrl:'https://mcp.example.test/mcp',fetchFn:fetcher,scope};
  assert.equal(await auth(provider,options),'REDIRECT');const html=await (await fetcher(authorization!)).text();
  const approval=await fetcher('https://app.example.test/mcp/authorize',{method:'POST',headers:{Origin:'https://app.example.test'},
    body:new URLSearchParams({requestId:hidden(html,'requestId'),csrf:hidden(html,'csrf'),workspace:'workspace-one',remember:'yes',decision:'allow'})});
  assert.equal(approval.status,303);
  assert.equal(await auth(provider,{...options,authorizationCode:new URL(approval.headers.get('Location')!).searchParams.get('code')!}),'AUTHORIZED');
  const connect=async()=>{
    const client=new Client({name:'actual-synthetic-cloud-client',version:'1.0.0'}),transport=new StreamableHTTPClientTransport(new URL(options.serverUrl),{authProvider:provider,fetch:fetcher});
    await client.connect(transport);return client;
  };
  return {...fixture,...db,handler,fetcher,connect,tokens:()=>tokens};
};
const result=(response:unknown):Record<string,unknown>=>{
  const r=response as {isError?:boolean;structuredContent?:{ok:boolean;data:Record<string,unknown>;error?:unknown}};
  assert.equal(r.isError,false,JSON.stringify(r.structuredContent?.error));assert.equal(r.structuredContent?.ok,true);return r.structuredContent!.data;
};

test('Cloud-MCP: echter SDK-Client liest und schreibt bestehende saetze ohne Electron-Prozess',async()=>{
  const f=await setup();let client:Client|undefined;
  try{
    client=await f.connect();const list=await client.listTools();assert.deepEqual(list.tools.map(t=>t.name),[...CLOUD_TOOL_NAMES]);
    const status=result(await client.callTool({name:'redion_get_status',arguments:{}}));assert.equal(status.source,'cloud');assert.equal(status.windowAvailable,false);
    const created=result(await client.callTool({name:'redion_create_page',arguments:{title:'Künstliche Cloud-Notiz',open:false,
      blocks:[{type:'h1',text:'Übung <>& 😀'},{type:'text',text:'Stromkreis beschreiben'}]}}));
    const pageId=(created.document as {id:string}).id;
    const read=result(await client.callTool({name:'redion_read_page',arguments:{documentId:pageId}}));
    assert.equal((read.blocks as {text:string}[])[0]!.text,'Übung <>& 😀');
    const child=(read.blocks as {id:string;text:string}[])[1]!;
    result(await client.callTool({name:'redion_update_block',arguments:{blockId:child.id,text:'Neue Erklärung',expectedText:child.text}}));
    const stale=await client.callTool({name:'redion_update_block',arguments:{blockId:child.id,text:'Überschreiben',expectedText:child.text}});
    assert.equal((stale.structuredContent as {error:{code:string}}).error.code,'STALE_DOCUMENT');
    await client.close();client=await f.connect();
    const restarted=result(await client.callTool({name:'redion_read_page',arguments:{documentId:pageId}}));
    assert.equal((restarted.blocks as {text:string}[])[1]!.text,'Neue Erklärung');
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM saetze').get()!.n,3);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM mcp_commit_guard').get()!.n,0);
    const search=result(await client.callTool({name:'redion_search',arguments:{query:'Erklärung'}}));assert.equal((search.documents as unknown[]).length,1);
  }finally{await client?.close();f.close();}
});
test('Cloud-MCP: fehlender/fremder Token, Origin, Nur-Lesen und Widerruf sperren',async()=>{
  const f=await setup('redion:read');let client:Client|undefined;
  try{
    const noAuth=must(await f.handler(new Request('https://mcp.example.test/mcp',{method:'POST'})));assert.equal(noAuth.status,401);
    assert.ok(noAuth.headers.get('WWW-Authenticate')?.includes('oauth-protected-resource/mcp'));
    const foreign=must(await f.handler(new Request('https://mcp.example.test/mcp',{method:'POST',headers:{Origin:'https://evil.test',Authorization:'Bearer '+f.tokens()!.access_token}})));
    assert.equal(foreign.status,403);
    client=await f.connect();const write=await client.callTool({name:'redion_create_page',arguments:{title:'Denied',open:false}});
    assert.equal((write.structuredContent as {error:{code:string}}).error.code,'PERMISSION_DENIED');
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM saetze').get()!.n,0);
    const grant=(await f.oauth.listGrants('owner'))[0]!;await f.oauth.revokeGrant('owner',grant.id);
    const blocked=must(await f.handler(new Request('https://mcp.example.test/mcp',{method:'POST',headers:{Authorization:'Bearer '+f.tokens()!.access_token}})));
    assert.equal(blocked.status,401);
  }finally{await client?.close();f.close();}
});
test('Cloud-MCP: Fehler nach dem 25. bereits geschriebenen Datensatz rollt die ganze Seite zurück',async()=>{
  const f=await setup();let client:Client|undefined;
  try{
    client=await f.connect();f.failAfterRecordWrites(25);
    const failed=await client.callTool({name:'redion_create_page',arguments:{title:'Atomic cloud page',open:false,
      blocks:Array.from({length:25},(_,index)=>({type:'text',text:'Block '+index}))}});
    assert.equal(f.lastAbortedWrites(),25);assert.equal(failed.isError,true);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM saetze').get()!.n,0);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM protokoll').get()!.n,0);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM mcp_commit_guard').get()!.n,0);
  }finally{await client?.close();f.close();}
});
