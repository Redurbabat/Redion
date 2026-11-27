import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeDatabase} from '../server/home/sqlite.ts';
import {openHomeBlobs} from '../server/home/blobs.ts';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {issueHomeConsentCode} from '../server/home/consent.ts';
import {pkceChallenge} from '../server/mcp/oauth.ts';

test('Home SQLite persists across restart and rolls back failed batches',async()=>{
  const root=await mkdtemp(join(tmpdir(),'redion-home-'));
  try{
    const first=openHomeDatabase(join(root,'data.sqlite'));
    try{
      await first.ablage.setze('konten',{id:'synthetic-owner',gesperrt:0});
      await assert.rejects(first.db.batch!([
        first.db.prepare('INSERT INTO konten(id,gesperrt) VALUES(?,0)').bind('rollback'),
        first.db.prepare('INSERT INTO konten(id,gesperrt) VALUES(?,0)').bind('synthetic-owner')
      ]));
      assert.equal(await first.ablage.hole('konten',{id:'rollback'}),null);
    }finally{first.close();}
    const second=openHomeDatabase(join(root,'data.sqlite'));
    try{assert.equal((await second.ablage.hole('konten',{id:'synthetic-owner'}))?.id,'synthetic-owner');}
    finally{second.close();}
  }finally{await rm(root,{recursive:true,force:true});}
});
test('File chunks survive reopening and traversal strings cannot escape storage',async()=>{
  const root=await mkdtemp(join(tmpdir(),'redion-blobs-'));
  try{
    const first=await openHomeBlobs(join(root,'blobs'));
    await first.lege('../../outside',new Uint8Array([1,2,3]));
    const second=await openHomeBlobs(join(root,'blobs'));
    assert.deepEqual(await second.hole('../../outside'),new Uint8Array([1,2,3]));
    await second.weg('../../outside');
    assert.equal(await first.hole('../../outside'),null);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('Private home API blocks public routes, foreign origins and anonymous sync',async()=>{
  const root=await mkdtemp(join(tmpdir(),'redion-api-'));
  try{
    const origin='https://redion.example.test';
    const service=await openHomeServer({dataDir:root,origin});
    try{
      assert.equal((await service.handle(new Request(origin+'/api/stand'))).status,200);
      assert.equal((await service.handle(new Request(origin+'/sync/runter'))).status,401);
      assert.equal((await service.handle(new Request(origin+'/konto/oauth/github'))).status,404);
      assert.equal((await service.handle(new Request(origin+'/mcp/cloud'))).status,404);
      assert.equal((await service.handle(new Request(origin+'/server/schema.sql'))).status,404);
      assert.equal((await service.handle(new Request(origin+'/sync/runter',{headers:{Origin:'https://evil.example.test'}}))).status,403);
    }finally{service.close();}
  }finally{await rm(root,{recursive:true,force:true});}
});

test('Local device approval and claim are single-use across database connections',async()=>{
  const root=await mkdtemp(join(tmpdir(),'redion-pair-'));
  try{
    const origin='https://redion.example.test';
    const service=await openHomeServer({dataDir:root,origin});
    const operator=openHomeDatabase(join(root,'redion.sqlite'));
    try{
      const post=(path:string,body:Record<string,unknown>)=>service.handle(new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:'capacitor://localhost'},body:JSON.stringify(body)}));
      const created=await post('/konto/code',{geraet:'Test'});
      assert.equal(created.status,200);
      const {code}=await created.json() as {code:string};
      assert.equal((await post('/konto/code-holen',{code})).status,202);
      assert.equal((await post('/konto/code-freigeben',{code})).status,404);
      approveHomeDevice(operator.sqlite,code);
      assert.throws(()=>approveHomeDevice(operator.sqlite,code));
      const responses=await Promise.all([post('/konto/code-holen',{code}),post('/konto/code-holen',{code})]);
      assert.deepEqual(responses.map(r=>r.status).sort(),[200,404]);
      const success=responses.find(r=>r.status===200)!;
      const session=await success.json() as {token:string;bereiche:unknown[]};
      assert.equal(session.bereiche.length,1);
      assert.equal((await service.handle(new Request(origin+'/konto/ich',{headers:{Authorization:'Bearer '+session.token}}))).status,200);
      assert.equal(await service.store.ablage.zaehle('konten'),1);
      assert.equal(await service.store.ablage.zaehle('sitzungen'),1);
    }finally{operator.close();service.close();}
  }finally{await rm(root,{recursive:true,force:true});}
});

test('Opt-in home MCP requires a local one-time consent login and scoped OAuth',async()=>{
  const root=await mkdtemp(join(tmpdir(),'redion-mcp-home-'));
  try{
    const origin='https://redion.example.test',resource=origin+'/mcp/cloud';
    const service=await openHomeServer({dataDir:root,origin,enableMcp:true});
    try{
      await service.store.ablage.setze('konten',{id:'owner',gesperrt:0});
      await service.store.ablage.setze('bereiche',{id:'workspace',name:'Test',besitzer:'owner'});
      const send=(path:string,init?:RequestInit)=>service.handle(new Request(origin+path,init));
      assert.equal((await send('/.well-known/oauth-authorization-server')).status,200);
      assert.equal((await send('/mcp/cloud')).status,401);
      const registration=await send('/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_name:'Synthetic',redirect_uris:['https://client.example.test/callback'],grant_types:['authorization_code'],token_endpoint_auth_method:'none'})});
      assert.equal(registration.status,201);
      const client=await registration.json() as {client_id:string};
      const verifier='v'.repeat(64);
      const query=new URLSearchParams({client_id:client.client_id,redirect_uri:'https://client.example.test/callback',response_type:'code',resource,scope:'redion:read redion:write',code_challenge:await pkceChallenge(verifier),code_challenge_method:'S256',state:'synthetic'});
      const target='/mcp/authorize?'+query;
      const initial=await send(target,{headers:{'Cf-Access-Authenticated-User-Email':'owner@example.test'}});
      assert.match(await initial.text(),/name="code"/);
      const code=issueHomeConsentCode(service.store.sqlite);
      const login=()=>send('/home/mcp-login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,target})});
      const auth=await login();
      assert.equal(auth.status,303);
      assert.equal((await login()).status,401);
      const rawCookie=auth.headers.get('Set-Cookie')!;
      assert.match(rawCookie,/HttpOnly/);
      assert.match(rawCookie,/Secure/);
      const cookie=rawCookie.split(';')[0]!;
      const consent=await send(target,{headers:{Cookie:cookie}});
      assert.equal(consent.status,200);
      const html=await consent.text();
      const requestId=/name="requestId" value="([^"]+)"/.exec(html)?.[1];
      const csrf=/name="csrf" value="([^"]+)"/.exec(html)?.[1];
      assert.ok(requestId&&csrf);
      const approve=await send('/mcp/authorize',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({requestId,csrf,decision:'allow',workspace:'workspace'})});
      assert.equal(approve.status,303);
      const oauthCode=new URL(approve.headers.get('Location')!).searchParams.get('code')!;
      const exchange=await send('/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'authorization_code',client_id:client.client_id,code:oauthCode,redirect_uri:'https://client.example.test/callback',code_verifier:verifier,resource})});
      assert.equal(exchange.status,200);
      const issued=await exchange.json() as {access_token:string;scope:string};
      assert.equal(issued.scope,'redion:read');
      const list=await send('/mcp/cloud',{method:'POST',headers:{Authorization:'Bearer '+issued.access_token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})});
      assert.equal(list.status,200);
      assert.ok((await list.json() as {result:{tools:unknown[]}}).result.tools.length>0);
      assert.equal((await send('/home/mcp-logout',{method:'POST',headers:{Origin:origin,Cookie:cookie}})).status,204);
      assert.match(await (await send('/mcp/settings',{headers:{Cookie:cookie}})).text(),/name="code"/);
    }finally{service.close();}
  }finally{await rm(root,{recursive:true,force:true});}
});

test('Home device management and durable live invalidation use authenticated owner sessions',async()=>{
  const root=await mkdtemp(join(tmpdir(),'redion-live-home-'));
  try{
    const origin='https://redion.example.test';
    const service=await openHomeServer({dataDir:root,origin});
    try{
      const post=(path:string,body:Record<string,unknown>,token?:string)=>service.handle(new Request(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)}));
      const pair=async(name:string)=>{
        const {code}=await (await post('/konto/code',{geraet:name})).json() as {code:string};
        approveHomeDevice(service.store.sqlite,code);
        return await (await post('/konto/code-holen',{code})).json() as {token:string;bereiche:{id:string}[]};
      };
      const a=await pair('iPhone'),b=await pair('Windows');
      const workspace=a.bereiche[0]!.id,auth={Authorization:'Bearer '+a.token};
      const wait=(cursor?:string,seconds=0)=>service.handle(new Request(origin+'/home/sync/wait?'+new URLSearchParams({bereich:workspace,wait:String(seconds),...(cursor?{cursor}:{})}),{headers:auth}));
      assert.equal((await service.handle(new Request(origin+'/home/sync/wait?bereich='+workspace))).status,401);
      const first=await (await wait()).json() as {cursor:string;changed:boolean};
      assert.equal(first.changed,true);
      assert.equal((await (await wait(first.cursor)).json() as {changed:boolean}).changed,false);
      const pending=wait(first.cursor,2);
      const upload=await post('/sync/hoch',{bereich:workspace,saetze:[{id:'test-page',tabelle:'blocks',daten:'{}',version:1}]},b.token);
      assert.equal(upload.status,200);
      const next=await (await pending).json() as {cursor:string;changed:boolean};
      assert.equal(next.changed,true);
      assert.notEqual(next.cursor,first.cursor);
      await service.store.db.batch!([service.store.db.prepare('UPDATE saetze SET version=2 WHERE bereich=? AND id=?').bind(workspace,'test-page')]);
      const afterMcp=await (await wait(next.cursor)).json() as {cursor:string;changed:boolean};
      assert.equal(afterMcp.changed,true);
      const list=await service.handle(new Request(origin+'/konto/geraete',{headers:{...auth,Origin:'capacitor://localhost'}}));
      assert.equal(list.headers.get('Access-Control-Allow-Origin'),'capacitor://localhost');
      const devices=await list.json() as {geraete:{kennung:string;geraet:string}[]};
      const target=devices.geraete.find(x=>x.geraet==='Windows')!;
      assert.ok(target);
      assert.equal((await post('/konto/geraete/weg',{kennung:target.kennung},a.token)).status,200);
      assert.equal((await service.handle(new Request(origin+'/home/sync/wait?bereich='+workspace,{headers:{Authorization:'Bearer '+b.token}}))).status,401);
    }finally{service.close();}
  }finally{await rm(root,{recursive:true,force:true});}
});

test('RED ID issues separate app credentials without document privileges',async()=>{
  const root=await mkdtemp(join(tmpdir(),'red-id-home-'));
  try{
    const origin='https://redion.example.test';
    const service=await openHomeServer({dataDir:root,origin});
    try{
      const {issueRedId,revokeRedApp}=await import('../server/home/red-id.ts');
      const {createRedIdClient}=await import('../red-sdk/client.mts');
      await service.store.ablage.setze('konten',{id:'owner',name:'RED Owner',gesperrt:0});
      const fit=issueRedId(service.store.sqlite,'red-fit'),poly=issueRedId(service.store.sqlite,'red-poly');
      assert.notEqual(fit.token,poly.token);
      const fetcher:typeof fetch=async(input,init)=>service.handle(new Request(input,init));
      const client=createRedIdClient(origin,async()=>fit.token,fetcher);
      const identity=await client.me();
      assert.equal(identity.id,'owner');assert.equal(identity.app,'red-fit');
      assert.deepEqual(identity.scopes,['identity:read']);
      assert.equal((await service.handle(new Request(origin+'/sync/runter',{headers:{Authorization:'Bearer '+fit.token}}))).status,401);
      await client.logout();
      await assert.rejects(client.me());
      const other=createRedIdClient(origin,async()=>poly.token,fetcher);
      assert.equal((await other.me()).id,'owner');
      assert.equal(revokeRedApp(service.store.sqlite,'red-poly'),1);
      await assert.rejects(other.me());
    }finally{service.close();}
  }finally{await rm(root,{recursive:true,force:true});}
});
