import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'rolldown';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {SCHEMA} from '../../../server/ablage.ts';
import {mcpStateD1} from '../../../server/mcp/state.ts';
import {createMcpOAuth,pkceChallenge} from '../../../server/mcp/oauth.ts';

/* Bereits vorhandene Wrangler-Laufzeit verwenden. Keine Installation und
 * keine Verbindung zum Cloudflare-Konto durch diesen lokalen Prüflauf. */
const require=createRequire(import.meta.url);
const wranglerEntry=process.env.REDION_WRANGLER_ENTRY??require.resolve('wrangler');
const wranglerRequire=createRequire(wranglerEntry);
const {Miniflare,convertV4MiniflareOptions}=await import(pathToFileURL(wranglerRequire.resolve('miniflare')).href);
const output=path.resolve(import.meta.dirname,'../../../build/cloud-worker-runtime-test.mjs');
await build({input:path.resolve(import.meta.dirname,'../server/cloud-worker.mts'),platform:'neutral',resolve:{mainFields:['module','main']},
  output:{file:output,format:'esm',codeSplitting:false}});

test('Cloud-MCP läuft im echten lokalen workerd mit D1 und einem SDK-Client',async()=>{
  /* Kein Netz: jede ausgehende Anfrage des Workers wird abgewiesen UND gezählt.
   * (createFetchMock gibt es ab Miniflare 5 nicht mehr; outboundService schon seit 3.) */
  const outbound:string[]=[];
  const v4Options={modules:true,script:await fs.readFile(output,'utf8'),compatibilityDate:'2026-11-18',
    d1Databases:{DB:'redion-cloud-synthetic'},bindings:{MCP_ISSUER:'https://mcp.example.test',
      MCP_AUTHORIZATION_ENDPOINT:'https://app.example.test/mcp/authorize',MCP_FREE_ONLY:'1'},outboundService:(request:Request)=>{outbound.push(request.url);return new Response('Netz gesperrt',{status:599});}};
  /* Miniflare 5 nimmt die v4-Form nur noch über seinen eigenen Umwandler. */
  const mf=new Miniflare(typeof convertV4MiniflareOptions==='function'?convertV4MiniflareOptions(v4Options):v4Options);
  let client:Client|undefined;
  try{
    const db=await mf.getD1Database('DB');
    const schema=SCHEMA+'\n'+await fs.readFile(new URL('../../../server/mcp/schema.sql',import.meta.url),'utf8');
    for(const sql of schema.replace(/\/\*[\s\S]*?\*\//g,'').replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
    await db.prepare('INSERT INTO konten(id,gesperrt) VALUES(?,0)').bind('runtime-owner').run();
    await db.prepare('INSERT INTO bereiche(id,name,besitzer) VALUES(?,?,?)').bind('runtime-workspace','Synthetic runtime','runtime-owner').run();
    const oauth=createMcpOAuth({state:mcpStateD1(db),issuer:'https://mcp.example.test',resource:'https://mcp.example.test/mcp',authorizationEndpoint:'https://app.example.test/mcp/authorize'});
    const registered=await oauth.register({client_name:'Synthetic runtime SDK',redirect_uris:['https://ai.example.test/cb']});
    const verifier='t'.repeat(64),args={client_id:registered.client_id,redirect_uri:registered.redirect_uris[0]!,response_type:'code',scope:'redion:read redion:write',
      resource:'https://mcp.example.test/mcp',code_challenge:await pkceChallenge(verifier),code_challenge_method:'S256'};
    const start=await oauth.begin('runtime-owner',args);if(start.kind!=='consent')throw new Error('Expected consent');
    const approval=await oauth.approve('runtime-owner',start.requestId,start.csrf,{allow:true,remember:true,workspaceIds:['runtime-workspace']});
    const tokens=await oauth.exchange({grant_type:'authorization_code',client_id:registered.client_id,code:new URL(approval.redirect).searchParams.get('code')!,
      redirect_uri:args.redirect_uri,resource:args.resource,code_verifier:verifier});
    const fetcher=async(input:string|URL|Request,init?:RequestInit):Promise<Response>=>{
      const request=new Request(input,init),headers=Object.fromEntries(request.headers);
      const forwarded:{method:string;headers:Record<string,string>;body?:string}={method:request.method,headers};
      if(request.method!=='GET'&&request.method!=='HEAD')forwarded.body=await request.text();
      const response=await mf.dispatchFetch(request.url,forwarded);
      const bytes=await response.arrayBuffer();return new Response(bytes.byteLength?bytes:null,{status:response.status,headers:Object.fromEntries(response.headers)});
    };
    assert.equal((await fetcher('https://mcp.example.test/mcp',{method:'POST'})).status,401);
    client=new Client({name:'synthetic-workerd-client',version:'1.0.0'});
    await client.connect(new StreamableHTTPClientTransport(new URL('https://mcp.example.test/mcp'),{fetch:fetcher,requestInit:{headers:{Authorization:'Bearer '+tokens.access_token}}}));
    const tools=await client.listTools();assert.equal(tools.tools.length,13);
    const created=await client.callTool({name:'redion_create_page',arguments:{title:'Workerd synthetic note',open:false,blocks:[{type:'text',text:'Persistent in D1'}]}});
    assert.equal(created.isError,false,JSON.stringify(created.structuredContent));
    const pageId=(created.structuredContent as {data:{document:{id:string}}}).data.document.id;
    const read=await client.callTool({name:'redion_read_page',arguments:{documentId:pageId}});
    assert.equal((read.structuredContent as {data:{blocks:{text:string}[]}}).data.blocks[0]!.text,'Persistent in D1');
    const count=await db.prepare('SELECT COUNT(*) n FROM saetze').first();assert.equal(count.n,2);
    const grant=(await oauth.listGrants('runtime-owner'))[0]!;await oauth.revokeGrant('runtime-owner',grant.id);
    assert.equal((await fetcher('https://mcp.example.test/mcp',{method:'POST',headers:{Authorization:'Bearer '+tokens.access_token}})).status,401);
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM mcp_commit_guard').first()).n,0);
    assert.deepEqual(outbound,[],'Der Cloud-MCP darf im Test keine Anfrage nach aussen schicken');
  }finally{await client?.close();await mf.dispose();}
});
