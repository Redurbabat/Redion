import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudFixture,hidden} from './helfer/mcp-cloud.mts';
import {pkceChallenge} from '../server/mcp/oauth.ts';
import {createMcpOAuthHttp} from '../server/mcp/oauth-http.ts';

test('OAuth HTTP: Discovery, korrekte Methoden und begrenzte Eingaben',async()=>{
  const f=cloudFixture();try{
    const meta=await f.fetcher('https://mcp.example.test/.well-known/oauth-authorization-server');assert.equal(meta.status,200);
    assert.equal((await meta.json()).authorization_endpoint,'https://app.example.test/mcp/authorize');
    const resource=await f.fetcher('https://mcp.example.test/.well-known/oauth-protected-resource/mcp');
    assert.equal((await resource.json()).resource,'https://mcp.example.test/mcp');
    assert.equal((await f.fetcher('https://mcp.example.test/token')).status,405);
    assert.equal((await f.fetcher('https://mcp.example.test/token?client_secret=never-in-url',{method:'POST'})).status,400);
    assert.equal((await f.fetcher('https://mcp.example.test/token?refresh_token=never-in-url',{method:'POST'})).status,400);
    assert.equal((await f.fetcher('https://mcp.example.test/register',{method:'POST',headers:{'Content-Type':'application/json'},body:'[1]'})).status,400);
    assert.equal((await f.fetcher('https://mcp.example.test/register',{method:'POST',headers:{'Content-Type':'application/json'},body:' '.repeat(17000)})).status,400);
    assert.equal((await f.fetcher('https://mcp.example.test/register',{method:'POST',headers:{Origin:'https://evil.test','Content-Type':'application/json'},body:'{}'})).status,403);
    const duplicate=await f.fetcher('https://mcp.example.test/token',{method:'POST',body:new URLSearchParams('client_id=a&client_id=b')});
    assert.equal(duplicate.status,400);
  }finally{f.close();}
});
test('OAuth HTTP: fehlende Anmeldung, CSRF und fremde Arbeitsbereiche sperren',async()=>{
  const f=cloudFixture();try{
    const client=await f.oauth.register({client_name:'<script>evil()</script>',redirect_uris:['https://ai.example.test/cb']});
    const args=new URLSearchParams({client_id:client.client_id,redirect_uri:client.redirect_uris[0]!,response_type:'code',
      resource:'https://mcp.example.test/mcp',scope:'redion:read',code_challenge:await pkceChallenge('v'.repeat(64)),code_challenge_method:'S256'});
    f.user(null);assert.equal((await f.fetcher('https://app.example.test/mcp/authorize?'+args)).status,401);
    f.user({id:'owner',workspaces:[{id:'workspace-one',name:'Synthetisch',canWrite:true}]});
    const consent=await f.fetcher('https://app.example.test/mcp/authorize?'+args);const html=await consent.text();assert.equal(consent.status,200);
    assert.ok(consent.headers.get('Content-Security-Policy')?.includes("frame-ancestors 'none'"));assert.equal(consent.headers.get('Referrer-Policy'),'same-origin');
    assert.equal(html.includes('<script>evil()'),false);assert.ok(html.includes('&lt;script&gt;evil()'));
    assert.equal(html.includes('name="write"'),false); // Nur ein angefordertes Schreibrecht wird angeboten.
    const form=new URLSearchParams({requestId:hidden(html,'requestId'),csrf:hidden(html,'csrf'),decision:'allow',remember:'yes',workspace:'workspace-one'});
    assert.equal((await f.fetcher('https://app.example.test/mcp/authorize',{method:'POST',headers:{Origin:'https://evil.test'},body:form})).status,403);
    form.set('workspace','someone-elses-workspace');
    assert.equal((await f.fetcher('https://app.example.test/mcp/authorize',{method:'POST',headers:{Origin:'https://app.example.test'},body:form})).status,401);
    assert.equal((await f.oauth.listGrants('owner')).length,0);
    form.set('workspace','workspace-one');
    assert.equal((await f.fetcher('https://app.example.test/mcp/authorize',{method:'POST',headers:{Origin:'https://app.example.test'},body:form})).status,303);
    const settings=await f.fetcher('https://app.example.test/mcp/settings');const settingsHtml=await settings.text();
    const revoke=new URLSearchParams({csrf:hidden(settingsHtml,'csrf'),grantId:hidden(settingsHtml,'grantId')});
    assert.equal((await f.fetcher('https://app.example.test/mcp/settings',{method:'POST',headers:{Origin:'https://app.example.test'},body:revoke})).status,303);
    assert.equal((await f.oauth.listGrants('owner')).length,0);
    assert.equal((await f.fetcher('https://app.example.test/mcp/settings',{method:'POST',headers:{Origin:'https://app.example.test'},body:revoke})).status,400);
  }finally{f.close();}
});
test('OAuth HTTP: atomare Ratenbegrenzung über mehrere Routerinstanzen und Ablauf',async()=>{
  const f=cloudFixture();try{
    const replica=createMcpOAuthHttp({oauth:f.oauth,state:f.state,identify:async()=>null,rateKey:()=> 'synthetic-source',now:f.now});
    const responses=[];
    for(let i=0;i<11;i++){
      const request=new Request('https://mcp.example.test/register',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({client_name:'Synthetic '+i,redirect_uris:['https://ai.example.test/cb']})});
      responses.push(i%2? (await replica(request))! : await f.fetcher(request));
    }
    assert.equal(responses.filter(r=>r.status===201).length,10);assert.equal(responses[10]!.status,429);
    f.tick(3600001);assert.equal((await f.fetcher('https://mcp.example.test/register',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({client_name:'After interval',redirect_uris:['https://ai.example.test/cb']})})).status,201);
  }finally{f.close();}
});
test('Echter MCP-SDK-OAuth-Client: Discovery, Registrierung, Zustimmung, Token und automatischer Refresh',async()=>{
  const f=cloudFixture();try{
    const {auth}=await import(new URL('../plugins/red-ion/node_modules/@modelcontextprotocol/sdk/dist/esm/client/auth.js',import.meta.url).href);
    let client:Record<string,unknown>|undefined,tokens:Record<string,unknown>|undefined,verifier='',authorization:URL|undefined;
    const provider={redirectUrl:'https://ai.example.test/cb',clientMetadata:{client_name:'Synthetic SDK Client',redirect_uris:['https://ai.example.test/cb'],
      token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code'],scope:'redion:read'},
      clientInformation:()=>client,saveClientInformation:(next:Record<string,unknown>)=>{client=next;},tokens:()=>tokens,
      saveTokens:(next:Record<string,unknown>)=>{tokens=next;},saveCodeVerifier:(next:string)=>{verifier=next;},codeVerifier:()=>verifier,
      redirectToAuthorization:(next:URL)=>{authorization=next;},state:()=> 'synthetic-client-state'};
    const options={serverUrl:'https://mcp.example.test/mcp',fetchFn:f.fetcher,scope:'redion:read'};
    assert.equal(await auth(provider,options),'REDIRECT');assert.ok(authorization);
    const html=await (await f.fetcher(authorization!)).text();
    const consent=await f.fetcher('https://app.example.test/mcp/authorize',{method:'POST',headers:{Origin:'https://app.example.test'},
      body:new URLSearchParams({requestId:hidden(html,'requestId'),csrf:hidden(html,'csrf'),decision:'allow',remember:'yes',workspace:'workspace-one'})});
    assert.equal(consent.status,303);const callback=new URL(consent.headers.get('Location')!);
    assert.equal(callback.searchParams.get('state'),'synthetic-client-state');
    assert.equal(await auth(provider,{...options,authorizationCode:callback.searchParams.get('code')!}),'AUTHORIZED');
    assert.ok(tokens?.access_token);const previous=String(tokens!.access_token);
    assert.equal((await f.oauth.authenticate(previous))?.userId,'owner');
    assert.equal(await auth(provider,options),'AUTHORIZED');assert.notEqual(tokens!.access_token,previous);
    assert.equal(await f.oauth.authenticate(previous),null);
    const grant=(await f.oauth.listGrants('owner'))[0]!;await f.oauth.revokeGrant('owner',grant.id);
    assert.equal(await f.oauth.authenticate(String(tokens!.access_token)),null);
  }finally{f.close();}
});

test('OAuth HTTP: Schreibschalter AUS, Lesezugriff bleibt, schreibgeschützter Bereich gesperrt',async()=>{
  const f=cloudFixture();try{
    const client=await f.oauth.register({client_name:'ChatGPT-Testclient',redirect_uris:['https://ai.example.test/cb']});
    f.user({id:'owner',workspaces:[
      {id:'workspace-edit',name:'Bearbeitbar',canWrite:true},
      {id:'workspace-read',name:'Nur lesbar',canWrite:false}]});
    const args=new URLSearchParams({client_id:client.client_id,redirect_uri:client.redirect_uris[0]!,
      response_type:'code',resource:'https://mcp.example.test/mcp',scope:'redion:read redion:write',
      code_challenge:await pkceChallenge('v'.repeat(64)),code_challenge_method:'S256'});
    const auth='https://app.example.test/mcp/authorize';
    const headers={Origin:'https://app.example.test'};
    const first=await f.fetcher(auth+'?'+args);
    const html=await first.text();
    assert.equal(first.status,200);
    assert.match(html,/name="write" value="yes"/);
    assert.match(html,/standardmässig aus/);
    const form=new URLSearchParams({requestId:hidden(html,'requestId'),csrf:hidden(html,'csrf'),
      decision:'allow',remember:'yes',workspace:'workspace-read',write:'yes'});
    assert.equal((await f.fetcher(auth,{method:'POST',headers,body:form})).status,401);
    assert.deepEqual(await f.oauth.listGrants('owner'),[]);
    form.delete('write');
    assert.equal((await f.fetcher(auth,{method:'POST',headers,body:form})).status,303);
    const grants=await f.oauth.listGrants('owner');
    assert.deepEqual(grants[0]?.scopes,['redion:read']);
    const retry=await f.fetcher(auth+'?'+args);
    const retryHtml=await retry.text();
    assert.equal(retry.status,200);
    const writeForm=new URLSearchParams({requestId:hidden(retryHtml,'requestId'),csrf:hidden(retryHtml,'csrf'),
      decision:'allow',remember:'yes',workspace:'workspace-edit',write:'yes'});
    assert.equal((await f.fetcher(auth,{method:'POST',headers,body:writeForm})).status,303);
    const granted=await f.oauth.listGrants('owner');
    assert.deepEqual(granted[0]?.scopes,['redion:read','redion:write']);
    assert.deepEqual(granted[0]?.workspaceIds,['workspace-edit']);
  }finally{f.close();}
});
