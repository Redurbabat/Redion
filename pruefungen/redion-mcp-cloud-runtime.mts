import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'rolldown';
import {SCHEMA} from '../server/ablage.ts';
import {mcpStateD1} from '../server/mcp/state.ts';
import {createMcpOAuth,pkceChallenge} from '../server/mcp/oauth.ts';

// Vorhandenes Wrangler verwenden. Kein Download, keine Kontoverbindung,
// keine entfernte Bindung. Der Test schlägt bei fehlender Laufzeit klar fehl.
const require=createRequire(import.meta.url);
const wranglerEntry=process.env.REDION_WRANGLER_ENTRY??require.resolve('wrangler');
const wranglerRequire=createRequire(wranglerEntry);
const {Miniflare,convertV4MiniflareOptions}=await import(pathToFileURL(wranglerRequire.resolve('miniflare')).href);

test('Cloudflare workerd: echter Worker, isoliertes D1, öffentliche DCR, SDK-Lesen und private Access-Grenze',async()=>{
  const output=path.resolve('bilder/redion-mcp/cloud/runtime-worker.mjs');
  await fs.mkdir(path.dirname(output),{recursive:true});
  await build({input:path.resolve('worker.ts'),platform:'neutral',
    output:{file:output,format:'esm',codeSplitting:false}});
  const outbound:string[]=[];
  const options={modules:true,script:await fs.readFile(output,'utf8'),compatibilityDate:'2025-04-01',
    d1Databases:{DB:'redion-oauth-synthetic-only'},
    bindings:{ACCESS_TEAM:'synthetic.cloudflareaccess.com',ACCESS_AUD:'synthetic-audience'},
    outboundService:(request:Request)=>{outbound.push(request.url);return new Response('Kein Netz im Test',{status:599});}};
  const mf=new Miniflare(typeof convertV4MiniflareOptions==='function'?convertV4MiniflareOptions(options):options);
  const {Client}=await import(new URL('../plugins/red-ion/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js',import.meta.url).href);
  const {StreamableHTTPClientTransport}=await import(new URL('../plugins/red-ion/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js',import.meta.url).href);
  let client:any,writer:any;
  try{
    const db=await mf.getD1Database('DB');
    const mcpSchema=await fs.readFile(new URL('../server/mcp/schema.sql',import.meta.url),'utf8');
    const statements=(sql:string)=>sql.replace(/\/\*[\s\S]*?\*\//g,'').replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean);
    for(const sql of statements(SCHEMA+'\n'+mcpSchema))await db.prepare(sql).run();
    await db.prepare('INSERT INTO konten(id,gesperrt) VALUES(?,0)').bind('runtime-owner').run();
    await db.prepare('INSERT INTO bereiche(id,name,besitzer) VALUES(?,?,?)').bind('runtime-workspace','Synthetic runtime','runtime-owner').run();
    await db.prepare('INSERT INTO saetze(id,bereich,tabelle,daten,verschluesselt,seite,version,geloescht) VALUES(?,?,?,?,0,?,1,0)')
      .bind('runtime-page','runtime-workspace','blocks',JSON.stringify({type:'page',text:'Test',inhalt:'Isolierte Testdaten'}),'runtime-page').run();
    for(const sql of statements(mcpSchema))await db.prepare(sql).run();
    const origin='https://runtime.example.test',resource=origin+'/mcp/cloud';
    const fetcher=async(input:string|URL|Request,init?:RequestInit):Promise<Response>=>{
      const request=new Request(input,init);
      const forwarded:{method:string;headers:Record<string,string>;body?:string}={method:request.method,headers:Object.fromEntries(request.headers)};
      if(!['GET','HEAD'].includes(request.method))forwarded.body=await request.text();
      const response=await mf.dispatchFetch(request.url,forwarded),bytes=await response.arrayBuffer();
      return new Response(bytes.byteLength?bytes:null,{status:response.status,headers:Object.fromEntries(response.headers)});
    };
    assert.equal((await fetcher(origin+'/.well-known/oauth-authorization-server')).status,200);
    assert.equal((await fetcher(resource)).status,401);
    for(const p of ['/mcp/authorize','/mcp/settings','/index.html','/sync/runter','/api/bruecke'])
      assert.equal((await fetcher(origin+p)).status,403,'Access muss erhalten bleiben: '+p);
    const registered=await fetcher(origin+'/register',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({redirect_uris:['https://ai.example.test/cb'],token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token']})});
    assert.equal(registered.status,201);const registration=await registered.json();
    // Die Zustimmung erfolgt hier direkt auf den künstlichen Daten; der
    // Browser-Ablauf und das echte Access-Konto werden getrennt geprüft.
    const oauth=createMcpOAuth({state:mcpStateD1(db),issuer:origin,resource,authorizationEndpoint:origin+'/mcp/authorize'});
    const verifier='t'.repeat(64),args={client_id:registration.client_id,redirect_uri:registration.redirect_uris[0],response_type:'code',
      resource,code_challenge:await pkceChallenge(verifier),code_challenge_method:'S256'};
    const start=await oauth.begin('runtime-owner',args);if(start.kind!=='consent')throw new Error('consent expected');
    const approval=await oauth.approve('runtime-owner',start.requestId,start.csrf,{allow:true,remember:true,workspaceIds:['runtime-workspace']});
    const tokenResponse=await fetcher(origin+'/token',{method:'POST',body:new URLSearchParams({grant_type:'authorization_code',
      client_id:registration.client_id,code:new URL(approval.redirect).searchParams.get('code')!,redirect_uri:args.redirect_uri,resource,code_verifier:verifier})});
    assert.equal(tokenResponse.status,200);const tokens=await tokenResponse.json();
    client=new Client({name:'synthetic-workerd-client',version:'1'});
    await client.connect(new StreamableHTTPClientTransport(new URL(resource),{fetch:fetcher,requestInit:{headers:{Authorization:'Bearer '+tokens.access_token}}}));
    assert.equal((await client.listTools()).tools.length,15);
    const result=await client.callTool({name:'redion_read_page',arguments:{workspaceId:'runtime-workspace',documentId:'runtime-page'}});
    assert.equal(JSON.parse(result.content[0].text).markdown,'Isolierte Testdaten');
    const denied=await client.callTool({name:'redion_create_page',arguments:{workspaceId:'runtime-workspace',title:'Gesperrt',requestId:'runtime_request'}});
    assert.equal(denied.isError,true);
    // Real workerd/D1 integration: exercise the new write tools, not only read.
    const writeStart=await oauth.begin('runtime-owner',{...args,scope:'redion:read redion:write'});
    if(writeStart.kind!=='consent')throw new Error('write consent expected');
    const writeApproval=await oauth.approve('runtime-owner',writeStart.requestId,writeStart.csrf,{
      allow:true,remember:true,workspaceIds:['runtime-workspace'],allowWrite:true
    });
    const writeResponse=await fetcher(origin+'/token',{method:'POST',body:new URLSearchParams({
      grant_type:'authorization_code',client_id:registration.client_id,
      code:new URL(writeApproval.redirect).searchParams.get('code')!,redirect_uri:args.redirect_uri,
      resource,code_verifier:verifier
    })});
    assert.equal(writeResponse.status,200);
    const writeTokens=await writeResponse.json();
    writer=new Client({name:'synthetic-workerd-writer',version:'1'});
    await writer.connect(new StreamableHTTPClientTransport(new URL(resource),{
      fetch:fetcher,requestInit:{headers:{Authorization:'Bearer '+writeTokens.access_token}}
    }));
    const invoke=async(name:string,arguments_:Record<string,unknown>)=>{
      const res=await writer.callTool({name,arguments:arguments_});
      return {res,payload:JSON.parse(res.content[0].text) as any};
    };
    const create=async(title:string,requestId:string,parentId?:string)=>{
      const {res,payload}=await invoke('redion_create_page',{
        workspaceId:'runtime-workspace',title,content:'Ausgang',requestId,...(parentId?{parentId}:{})
      });
      assert.notEqual(res.isError,true,title);
      return payload.documentId as string;
    };
    const rootA=await create('Ordner A','runtime_root_a_001');
    const rootB=await create('Ordner B','runtime_root_b_001');
    const child=await create('Unterseite','runtime_child_001',rootA);
    const childrenA=await invoke('redion_list_child_pages',{workspaceId:'runtime-workspace',parentId:rootA});
    assert.notEqual(childrenA.res.isError,true);
    assert.deepEqual(childrenA.payload.documents.map((d:any)=>d.documentId),[child]);
    const append=await invoke('redion_append_content',{
      workspaceId:'runtime-workspace',documentId:child,content:'Nachtrag',expectedVersion:1
    });
    assert.notEqual(append.res.isError,true);
    assert.equal(append.payload.version,2);
    const stale=await invoke('redion_append_content',{
      workspaceId:'runtime-workspace',documentId:child,content:'Alt',expectedVersion:1
    });
    assert.equal(stale.res.isError,true);
    assert.equal(stale.payload.code,'conflict');
    const move=await invoke('redion_move_page',{
      workspaceId:'runtime-workspace',documentId:child,newParentId:rootB,expectedVersion:2
    });
    assert.notEqual(move.res.isError,true);
    assert.equal(move.payload.version,3);
    const childrenB=await invoke('redion_list_child_pages',{workspaceId:'runtime-workspace',parentId:rootB});
    assert.deepEqual(childrenB.payload.documents.map((d:any)=>d.documentId),[child]);
    const cyclic=await invoke('redion_move_page',{
      workspaceId:'runtime-workspace',documentId:rootB,newParentId:child,expectedVersion:1
    });
    assert.equal(cyclic.res.isError,true);
    assert.equal(cyclic.payload.code,'invalid_arguments');
    const readAfter=await invoke('redion_read_page',{workspaceId:'runtime-workspace',documentId:child});
    assert.equal(readAfter.payload.markdown,'Ausgang\nNachtrag');
    await oauth.revokeGrant('runtime-owner',(await oauth.listGrants('runtime-owner'))[0]!.id);
    assert.equal((await fetcher(resource,{headers:{Authorization:'Bearer '+tokens.access_token}})).status,401);
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM saetze').first()).n,4);
    assert.deepEqual(outbound,[],'Keine ausgehenden Netzaufrufe');
  }finally{await Promise.allSettled([client?.close(),writer?.close()]);await mf.dispose();}
});
