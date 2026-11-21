import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {mcpStateD1,type McpDatabase} from '../server/mcp/state.ts';
import {createMcpOAuth,pkceChallenge,OAuthError} from '../server/mcp/oauth.ts';

const fixture=()=>{
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(fs.readFileSync(new URL('../server/mcp/schema.sql',import.meta.url),'utf8'));
  const database:McpDatabase={prepare(sql){let values:(string|number)[]=[];
    const params=()=>Object.fromEntries(values.map((value,index)=>['?'+(index+1),value]));
    return {bind(...next){values=next;return this;},async first<T>(){return (sqlite.prepare(sql).get(params()) as T|undefined)??null;},
      async all<T>(){return {results:sqlite.prepare(sql).all(params()) as T[]};}};}};
  let time=Date.parse('2026-11-18T12:00:00Z');const state=mcpStateD1(database,()=>time);
  return {state,oauth:createMcpOAuth({state,issuer:'https://mcp.example.test',resource:'https://mcp.example.test/mcp',now:()=>time}),
    now:()=>time,tick:(ms:number)=>{time+=ms;},sql:sqlite,close:()=>sqlite.close()};
};
const verifier='a'.repeat(64);
const setup=async(f:ReturnType<typeof fixture>,scope='redion:read',method:'none'|'client_secret_post'='none')=>{
  const client=await f.oauth.register({client_name:'Synthetic AI',redirect_uris:['https://ai.example.test/callback'],token_endpoint_auth_method:method,
    grant_types:['authorization_code','refresh_token']});
  const args={client_id:client.client_id,redirect_uri:client.redirect_uris[0]!,response_type:'code',scope,
    resource:'https://mcp.example.test/mcp',code_challenge:await pkceChallenge(verifier),code_challenge_method:'S256',state:'client-state'};
  return {client,args};
};
const login=async(f:ReturnType<typeof fixture>,userId='owner')=>{
  const s=await setup(f);const begin=await f.oauth.begin(userId,s.args);
  assert.equal(begin.kind,'consent');if(begin.kind!=='consent')throw new Error('consent expected');
  const approval=await f.oauth.approve(userId,begin.requestId,begin.csrf,{allow:true,remember:true,workspaceIds:['workspace-one']});
  const code=new URL(approval.redirect).searchParams.get('code')!;
  const tokens=await f.oauth.exchange({grant_type:'authorization_code',client_id:s.client.client_id,code,code_verifier:verifier,
    redirect_uri:s.args.redirect_uri,resource:s.args.resource});
  return {...s,tokens,approval};
};
const isError=(code:string)=>(e:unknown)=>e instanceof OAuthError&&e.error===code;

test('OAuth: Tokens und registrierte Clients sind auch bei gemeinsamer D1 an die Ressource gebunden',async()=>{
  const f=fixture();try{
    const s=await login(f);
    const other=createMcpOAuth({state:f.state,issuer:'https://mcp.example.test',resource:'https://mcp.example.test/other',now:f.now});
    assert.equal(await other.authenticate(s.tokens.access_token),null);
    await assert.rejects(()=>other.begin('owner',{...s.args,resource:'https://mcp.example.test/other'}),isError('invalid_client'));
    await assert.rejects(()=>other.exchange({grant_type:'refresh_token',client_id:s.client.client_id,
      refresh_token:s.tokens.refresh_token,resource:'https://mcp.example.test/other'}),isError('invalid_client'));
    assert.ok(await f.oauth.authenticate(s.tokens.access_token));
  }finally{f.close();}
});

test('OAuth: S256, Resource-Bindung, echte Zustimmung und einmaliger Code',async()=>{
  const f=fixture();try{
    const s=await setup(f);const b=await f.oauth.begin('owner',s.args);assert.equal(b.kind,'consent');if(b.kind!=='consent')throw 0;
    await assert.rejects(()=>f.oauth.approve('other',b.requestId,b.csrf,{allow:true,remember:true,workspaceIds:['workspace-one']}),isError('invalid_request'));
    await assert.rejects(()=>f.oauth.approve('owner',b.requestId,'wrong',{allow:true,remember:true,workspaceIds:['workspace-one']}),isError('invalid_request'));
    const a=await f.oauth.approve('owner',b.requestId,b.csrf,{allow:true,remember:true,workspaceIds:['workspace-one']});
    assert.equal(new URL(a.redirect).searchParams.get('state'),'client-state');
    assert.equal(new URL(a.redirect).searchParams.get('iss'),'https://mcp.example.test');
    const input={grant_type:'authorization_code',client_id:s.client.client_id,code:new URL(a.redirect).searchParams.get('code')!,
      code_verifier:verifier,redirect_uri:s.args.redirect_uri,resource:s.args.resource};
    await assert.rejects(()=>f.oauth.exchange({...input,resource:'https://other.example.test/mcp'}),isError('invalid_target'));
    await assert.rejects(()=>f.oauth.exchange({...input,code_verifier:'b'.repeat(64)}),isError('invalid_grant'));
    const results=await Promise.allSettled(Array.from({length:12},()=>f.oauth.exchange(input)));
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    const success=results.find(r=>r.status==='fulfilled')!;if(success.status!=='fulfilled')throw 0;
    const principal=await f.oauth.authenticate(success.value.access_token);assert.equal(principal?.userId,'owner');
    assert.deepEqual(principal?.workspaceIds,['workspace-one']);assert.deepEqual(principal?.scopes,['redion:read']);
  }finally{f.close();}
});
test('OAuth: Freigabe merken, Erweiterung erneut fragen, Konten isolieren',async()=>{
  const f=fixture();try{
    const s=await login(f);const again=await f.oauth.begin('owner',s.args);assert.equal(again.kind,'redirect');
    assert.equal((await f.oauth.begin('other',s.args)).kind,'consent');
    assert.equal((await f.oauth.begin('owner',{...s.args,scope:'redion:read redion:write'})).kind,'consent');
    assert.equal((await f.oauth.begin('owner',{...s.args,prompt:'consent'})).kind,'consent');
    assert.equal((await f.oauth.listGrants('other')).length,0);
    const grants=await f.oauth.listGrants('owner');assert.equal(grants.length,1);
    await assert.rejects(()=>f.oauth.revokeGrant('other',grants[0]!.id),isError('invalid_request'));
    await f.oauth.revokeGrant('owner',grants[0]!.id);
    assert.equal(await f.oauth.authenticate(s.tokens.access_token),null);
    await assert.rejects(()=>f.oauth.exchange({grant_type:'refresh_token',client_id:s.client.client_id,refresh_token:s.tokens.refresh_token,
      resource:s.args.resource}),isError('invalid_grant'));
    assert.equal((await f.oauth.begin('owner',s.args)).kind,'consent');
  }finally{f.close();}
});
test('OAuth: Refresh rotiert; Wiederverwendung sperrt die ganze betroffene Sitzung',async()=>{
  const f=fixture();try{
    const s=await login(f);
    const input={grant_type:'refresh_token',client_id:s.client.client_id,refresh_token:s.tokens.refresh_token,resource:s.args.resource};
    const next=await f.oauth.exchange(input);assert.notEqual(next.refresh_token,s.tokens.refresh_token);
    assert.equal(await f.oauth.authenticate(s.tokens.access_token),null);
    assert.equal((await f.oauth.authenticate(next.access_token))?.userId,'owner');
    await assert.rejects(()=>f.oauth.exchange(input),isError('invalid_grant'));
    assert.equal(await f.oauth.authenticate(next.access_token),null);
  }finally{f.close();}
});
test('OAuth: Client-Geheimnis, Redirect, PKCE und Rechte können nicht ausgewechselt werden',async()=>{
  const f=fixture();try{
    const s=await setup(f,'redion:read','client_secret_post');const b=await f.oauth.begin('owner',s.args);if(b.kind!=='consent')throw 0;
    const a=await f.oauth.approve('owner',b.requestId,b.csrf,{allow:true,remember:false,workspaceIds:['workspace-one']});
    const input={grant_type:'authorization_code',client_id:s.client.client_id,client_secret:s.client.client_secret!,
      code:new URL(a.redirect).searchParams.get('code')!,code_verifier:verifier,resource:s.args.resource,redirect_uri:s.args.redirect_uri};
    await assert.rejects(()=>f.oauth.exchange({...input,client_secret:'wrong'}),isError('invalid_client'));
    await assert.rejects(()=>f.oauth.exchange({...input,redirect_uri:'https://evil.example.test/callback'}),isError('invalid_grant'));
    const tokens=await f.oauth.exchange(input);
    await assert.rejects(()=>f.oauth.exchange({grant_type:'refresh_token',client_id:s.client.client_id,client_secret:s.client.client_secret!,
      refresh_token:tokens.refresh_token,resource:s.args.resource,scope:'redion:read redion:write'}),isError('invalid_scope'));
    assert.equal((await f.oauth.begin('owner',s.args)).kind,'consent');
    const stored=f.sql.prepare('SELECT data FROM mcp_state').all().map(r=>String(r.data)).join('');
    assert.ok(tokens.refresh_token);
    for(const secret of [tokens.access_token,tokens.refresh_token,input.code,s.client.client_secret!,b.csrf])assert.equal(stored.includes(secret),false);
  }finally{f.close();}
});
test('OAuth: Ablehnung, Ablauf, ungültige Registrierung und Protokoll-Downgrade',async()=>{
  const f=fixture();try{
    for(const redirect of ['http://example.test/cb','https://a.test/cb#fragment','https://u:p@a.test/cb','javascript:alert(1)'])
      await assert.rejects(()=>f.oauth.register({client_name:'bad',redirect_uris:[redirect]}),isError('invalid_redirect_uri'));
    const s=await setup(f);
    for(const change of [{code_challenge_method:'plain'},{response_type:'token'},{scope:'admin'},
      {resource:'https://other.test/mcp'},{redirect_uri:'https://ai.example.test/callback?surprise=1'}])
      await assert.rejects(()=>f.oauth.begin('owner',{...s.args,...change}));
    const b=await f.oauth.begin('owner',s.args);if(b.kind!=='consent')throw 0;
    const denied=await f.oauth.approve('owner',b.requestId,b.csrf,{allow:false,remember:false,workspaceIds:[]});
    assert.equal(new URL(denied.redirect).searchParams.get('error'),'access_denied');
    await assert.rejects(()=>f.oauth.approve('owner',b.requestId,b.csrf,{allow:true,remember:true,workspaceIds:['workspace-one']}));
    const l=await login(f);f.tick(15*60*1000+1);assert.equal(await f.oauth.authenticate(l.tokens.access_token),null);
    f.tick(31*86400000);await assert.rejects(()=>f.oauth.exchange({grant_type:'refresh_token',client_id:l.client.client_id,
      refresh_token:l.tokens.refresh_token,resource:l.args.resource}),isError('invalid_grant'));
  }finally{f.close();}
});

test('OAuth: registrierte Grant-Typen gelten auch am Token-Endpunkt; Standard erhält keinen Refresh-Token',async()=>{
  const f=fixture();try{
    const client=await f.oauth.register({redirect_uris:['https://ai.example.test/cb'],token_endpoint_auth_method:'none'});
    const begin=await f.oauth.begin('owner',{client_id:client.client_id,redirect_uri:client.redirect_uris[0],response_type:'code',
      resource:'https://mcp.example.test/mcp',code_challenge:await pkceChallenge(verifier),code_challenge_method:'S256'});
    if(begin.kind!=='consent')throw new Error('consent expected');
    assert.deepEqual(begin.scopes,['redion:read']);
    const approved=await f.oauth.approve('owner',begin.requestId,begin.csrf,{allow:true,remember:true,workspaceIds:['workspace-one']});
    const token=await f.oauth.exchange({client_id:client.client_id,grant_type:'authorization_code',redirect_uri:client.redirect_uris[0],
      resource:'https://mcp.example.test/mcp',code:new URL(approved.redirect).searchParams.get('code'),code_verifier:verifier});
    assert.equal(token.refresh_token,undefined);assert.ok(await f.oauth.authenticate(token.access_token));
    await assert.rejects(()=>f.oauth.exchange({client_id:client.client_id,grant_type:'refresh_token',refresh_token:'rim_rt_'+'a'.repeat(43),
      resource:'https://mcp.example.test/mcp'}),isError('unauthorized_client'));
  }finally{f.close();}
});

test('OAuth: Ablauf von Zustimmung und Code, fremder Client und Tokenwiderruf',async()=>{
  const f=fixture();try{
    const s=await setup(f);const b=await f.oauth.begin('owner',s.args);if(b.kind!=='consent')throw new Error('consent expected');
    f.tick(600001);
    await assert.rejects(()=>f.oauth.approve('owner',b.requestId,b.csrf,{allow:true,remember:true,workspaceIds:['workspace-one']}),isError('invalid_request'));
    const fresh=await f.oauth.begin('owner',s.args);if(fresh.kind!=='consent')throw new Error('consent expected');
    const approved=await f.oauth.approve('owner',fresh.requestId,fresh.csrf,{allow:true,remember:true,workspaceIds:['workspace-one']});
    f.tick(300001);
    await assert.rejects(()=>f.oauth.exchange({client_id:s.client.client_id,grant_type:'authorization_code',redirect_uri:s.args.redirect_uri,
      resource:s.args.resource,code:new URL(approved.redirect).searchParams.get('code'),code_verifier:verifier}),isError('invalid_grant'));
    const one=await login(f),two=await setup(f);
    await assert.rejects(()=>f.oauth.exchange({client_id:two.client.client_id,grant_type:'refresh_token',refresh_token:one.tokens.refresh_token,
      resource:one.args.resource}),isError('invalid_grant'));
    await f.oauth.revokeToken({client_id:two.client.client_id,token:one.tokens.access_token});
    assert.ok(await f.oauth.authenticate(one.tokens.access_token));
    await f.oauth.revokeToken({client_id:one.client.client_id,token:one.tokens.refresh_token});
    assert.equal(await f.oauth.authenticate(one.tokens.access_token),null);
    await f.oauth.revokeToken({client_id:one.client.client_id,token:one.tokens.refresh_token});
  }finally{f.close();}
});
test('OAuth: Kleinere Anfrage erbt keine weiteren Rechte einer gemerkten Freigabe',async()=>{
  const f=fixture();try{
    const s=await setup(f,'redion:read redion:write');const b=await f.oauth.begin('owner',s.args);if(b.kind!=='consent')throw 0;
    await f.oauth.approve('owner',b.requestId,b.csrf,{allow:true,remember:true,workspaceIds:['workspace-one'],allowWrite:true});
    const smaller=await f.oauth.begin('owner',{...s.args,scope:'redion:read'});if(smaller.kind!=='redirect')throw 0;
    const tokens=await f.oauth.exchange({grant_type:'authorization_code',client_id:s.client.client_id,code:new URL(smaller.redirect).searchParams.get('code')!,
      code_verifier:verifier,resource:s.args.resource,redirect_uri:s.args.redirect_uri});
    assert.equal(tokens.scope,'redion:read');assert.deepEqual((await f.oauth.authenticate(tokens.access_token))?.scopes,['redion:read']);
    await assert.rejects(()=>f.oauth.exchange({grant_type:'refresh_token',client_id:s.client.client_id,refresh_token:tokens.refresh_token,
      resource:s.args.resource,scope:'redion:read redion:write'}),isError('invalid_scope'));
  }finally{f.close();}
});
test('Gemerkte Zustimmung bleibt bis Widerruf erhalten; aktive Refresh-Sitzung verlängert sich',async()=>{
  const f=fixture();try{
    const s=await login(f);f.tick(29*86400000);
    const next=await f.oauth.exchange({grant_type:'refresh_token',client_id:s.client.client_id,refresh_token:s.tokens.refresh_token,resource:s.args.resource});
    f.tick(2*86400000);
    const renewed=await f.oauth.exchange({grant_type:'refresh_token',client_id:s.client.client_id,refresh_token:next.refresh_token,resource:s.args.resource});
    assert.equal((await f.oauth.authenticate(renewed.access_token))?.userId,'owner');
    f.tick(400*86400000);assert.equal((await f.oauth.begin('owner',s.args)).kind,'redirect');
    assert.equal(await f.oauth.authenticate(renewed.access_token),null);
  }finally{f.close();}
});

test('OAuth: Schreiben nur mit aktivem Haken, kein stilles Upgrade durch Refresh oder Neuanfrage',async()=>{
  const f=fixture();try{
    const s=await setup(f,'redion:read redion:write');
    const begin=await f.oauth.begin('owner',s.args);
    assert.equal(begin.kind,'consent');if(begin.kind!=='consent')throw new Error('consent expected');
    await assert.rejects(()=>f.oauth.approve('owner',begin.requestId,begin.csrf,
      {allow:true,remember:true,workspaceIds:['workspace-one'],allowWrite:'yes' as unknown as boolean}),isError('invalid_request'));
    const read=await f.oauth.approve('owner',begin.requestId,begin.csrf,
      {allow:true,remember:true,workspaceIds:['workspace-one']});
    const readTokens=await f.oauth.exchange({grant_type:'authorization_code',client_id:s.client.client_id,
      code:new URL(read.redirect).searchParams.get('code')!,code_verifier:verifier,
      redirect_uri:s.args.redirect_uri,resource:s.args.resource});
    assert.equal(readTokens.scope,'redion:read');
    assert.deepEqual((await f.oauth.authenticate(readTokens.access_token))?.scopes,['redion:read']);
    await assert.rejects(()=>f.oauth.exchange({grant_type:'refresh_token',client_id:s.client.client_id,
      refresh_token:readTokens.refresh_token,resource:s.args.resource,scope:'redion:read redion:write'}),isError('invalid_scope'));
    const next=await f.oauth.begin('owner',s.args);
    assert.equal(next.kind,'consent');if(next.kind!=='consent')throw new Error('consent expected');
    const allowed=await f.oauth.approve('owner',next.requestId,next.csrf,
      {allow:true,remember:true,workspaceIds:['workspace-one'],allowWrite:true});
    const tokens=await f.oauth.exchange({grant_type:'authorization_code',client_id:s.client.client_id,
      code:new URL(allowed.redirect).searchParams.get('code')!,code_verifier:verifier,
      redirect_uri:s.args.redirect_uri,resource:s.args.resource});
    assert.equal(tokens.scope,'redion:read redion:write');
    assert.deepEqual((await f.oauth.authenticate(tokens.access_token))?.scopes,['redion:read','redion:write']);
    assert.equal(await f.oauth.authenticate(readTokens.access_token),null);
    const readOnly=await f.oauth.begin('owner',{...s.args,scope:'redion:read',prompt:'consent'});
    assert.equal(readOnly.kind,'consent');if(readOnly.kind!=='consent')throw new Error('consent expected');
    await assert.rejects(()=>f.oauth.approve('owner',readOnly.requestId,readOnly.csrf,
      {allow:true,remember:true,workspaceIds:['workspace-one'],allowWrite:true}),isError('invalid_scope'));
  }finally{f.close();}
});
