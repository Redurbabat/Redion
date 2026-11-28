import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openHomeServer} from '../server/home-server.ts';
import {approveHomeDevice} from '../server/home/pairing.ts';
import {createRedBitMcpTools} from '../server/home/red-bit-mcp-tools.ts';
import {redBitMcpAllowed} from '../server/home/red-bit-mcp-grants.ts';
import {issueHomeConsentCode} from '../server/home/consent.ts';
import {pkceChallenge} from '../server/mcp/oauth.ts';
import {createRedPairProof} from '../red-sdk/client.mts';

const origin='https://redion.example.test';
const grant='/home/red-bit/grant',revoke='/home/red-bit/revoke',grants='/home/red-bit/grants',permission='/red-bit/v1/permission';

async function fixture(enabled:boolean,run:(f:any)=>Promise<void>,jobs=false,transport=false,transportJobs=false,mcp=false){
 const root=await mkdtemp(join(tmpdir(),'red-bit-permissions-'));
 const service=await openHomeServer({dataDir:root,origin,enableRedBitPermissions:enabled,enableRedBitReadJobs:jobs,enableRedBitTransportPermissions:transport,enableRedBitTransportJobs:transportJobs,enableMcp:mcp,enableRedBitMcp:mcp});
 try{
  const send=(path:string,init?:RequestInit)=>service.handle(new Request(origin+path,init));
  const get=(path:string,token?:string)=>send(path,{headers:token?{Authorization:'Bearer '+token}:{}});
  const post=(path:string,body:unknown,token?:string)=>send(path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  const {code}=await (await post('/konto/code',{geraet:'Owner'})).json() as any;
  approveHomeDevice(service.store.sqlite,code);
  const {token}=await (await post('/konto/code-holen',{code})).json() as any;
  const pair=async(app:string)=>{
   const proof=await createRedPairProof();
   const approval=await post('/red-id/v2/approve-login',{app,challenge:proof.challenge},token);
   assert.equal(approval.status,201);
   const claimed=await post('/red-id/v2/claim-login',{app,verifier:proof.verifier});
   assert.equal(claimed.status,200);
   const credentials=await claimed.json() as any;
   const digest=(await import('node:crypto')).createHash('sha256').update(credentials.accessToken).digest('hex');
   const row=service.store.sqlite.prepare('SELECT id FROM home_red_session WHERE access_digest=?').get(digest);
   assert.ok(row);
   return {...credentials,sessionId:String(row.id)};
  };
  await run({service,send,get,post,token,pair});
 }finally{service.close();await rm(root,{recursive:true,force:true});}
}

test('RED Bit permission pilot default disabled, not an action transport',async()=>{
 await fixture(false,async({get,post,token,pair})=>{
  const bit=await pair('red-bit');
  assert.equal((await get(grants,token)).status,404);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true},token)).status,404);
  assert.equal((await get(permission,bit.accessToken)).status,404);
  assert.equal((await post('/red-bit/v1/execute',{},bit.accessToken)).status,404);
 });
});

test('Owner confirmation creates only a bounded read permission for one live RED Bit session',async()=>{
 await fixture(true,async({get,post,token,pair})=>{
  const bit=await pair('red-bit'),other=await pair('red-bit'),fit=await pair('red-fit');
  assert.equal((await get(permission,bit.accessToken)).status,403);
  assert.equal((await get(permission,fit.accessToken)).status,401);
  assert.equal((await get(permission,token)).status,401);
  assert.equal((await get(grants,bit.accessToken)).status,401);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true},bit.accessToken)).status,401);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:false},token)).status,400);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true,scope:'transport'},token)).status,400);
  assert.equal((await post(grant,{sessionId:fit.sessionId,confirm:true},token)).status,404);
  const result=await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal(result.status,201);
  const g=await result.json() as any;
  assert.equal(g.scope,'music:status:read');
  assert.equal(g.remoteAvailable,false);
  assert.ok(g.expiresAt>Date.now()&&g.expiresAt<=Date.now()+3600000);
  const check=await get(permission,bit.accessToken);
  assert.equal(check.status,200);
  assert.equal(check.headers.get('Cache-Control'),'no-store');
  assert.deepEqual(await check.json(),{version:1,app:'red-bit',scope:'music:status:read',expiresAt:g.expiresAt,remoteAvailable:false});
  assert.equal((await get(permission,other.accessToken)).status,403);
  assert.equal((await get(permission,fit.accessToken)).status,401);
  const inventory=await (await get(grants,token)).json() as any;
  assert.deepEqual(inventory.grants,[{sessionId:bit.sessionId,expiresAt:g.expiresAt}]);
  assert.equal(inventory.remoteAvailable,false);
  assert.equal((await post('/red-bit/v1/execute',{},bit.accessToken)).status,404);
  assert.equal((await post(revoke,{sessionId:bit.sessionId,confirm:true},token)).status,200);
  assert.equal((await get(permission,bit.accessToken)).status,403);
 });
});

test('RED Bit permission is checked against rotation, expiry and session revocation',async()=>{
 await fixture(true,async({service,get,post,token,pair})=>{
  const bit=await pair('red-bit');
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true},token)).status,201);
  const rotation=await post('/red-id/v2/refresh',{app:'red-bit',refreshToken:bit.refreshToken});
  assert.equal(rotation.status,200);
  const next=await rotation.json() as any;
  assert.equal((await get(permission,bit.accessToken)).status,401);
  assert.equal((await get(permission,next.accessToken)).status,200);
  service.store.sqlite.prepare('UPDATE home_red_bit_permission SET expires=? WHERE session_id=?').run(Date.now()-1,bit.sessionId);
  assert.equal((await get(permission,next.accessToken)).status,403);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true},token)).status,201);
  assert.equal((await post('/red-id/v2/revoke-session',{id:bit.sessionId},token)).status,200);
  assert.equal((await get(permission,next.accessToken)).status,401);
  assert.equal(service.store.sqlite.prepare('SELECT 1 FROM home_red_bit_permission WHERE session_id=?').get(bit.sessionId),undefined);
 });
});

test('Permission pilot rejects invalid origin, unbounded input, and locked account',async()=>{
 await fixture(true,async({service,send,get,post,token,pair})=>{
  const bit=await pair('red-bit');
  const req={method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',Origin:'https://foreign.example.test'},body:JSON.stringify({sessionId:bit.sessionId,confirm:true})};
  assert.equal((await send(grant,req)).status,403);
  assert.equal((await post(grant,{sessionId:'x'.repeat(2048),confirm:true},token)).status,400);
  assert.equal((await post(grant,{sessionId:bit.sessionId,confirm:true},token)).status,201);
  service.store.sqlite.exec('UPDATE konten SET gesperrt=1');
  assert.equal((await get(permission,bit.accessToken)).status,401);
  assert.equal((await get(grants,token)).status,401);
 });
});

const requestJob='/home/red-bit/read-request',resultJob='/home/red-bit/read-result',claimJob='/red-bit/v1/read-claim',completeJob='/red-bit/v1/read-complete';
const status={version:1,state:'paused',hasTrack:true,canNext:false,canPrevious:false,controlsLocked:false,hasPlaybackError:false};
const jobId='a'.repeat(32);
const requestBody=(sessionId:string,id=jobId)=>({sessionId,id,issuedAt:Date.now(),confirm:true});

test('Read job transport needs its own opt-in',async()=>{
 await fixture(true,async({post,token,pair})=>{
  const bit=await pair('red-bit');
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal((await post(requestJob,requestBody(bit.sessionId),token)).status,404);
  assert.equal((await post(claimJob,{confirm:true},bit.accessToken)).status,404);
 });
});

test('Read job is owner-approved, isolated, claimed once and returns only strict status',async()=>{
 await fixture(true,async({post,token,pair})=>{
  const bit=await pair('red-bit'),other=await pair('red-bit'),fit=await pair('red-fit');
  assert.equal((await post(requestJob,requestBody(bit.sessionId),token)).status,403);
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  await post(grant,{sessionId:other.sessionId,confirm:true},token);
  const body=requestBody(bit.sessionId);
  assert.equal((await post(requestJob,body,bit.accessToken)).status,401);
  assert.equal((await post(requestJob,{...body,tool:'redbit_play'},token)).status,400);
  assert.equal((await post(requestJob,{...body,issuedAt:Date.now()-31000},token)).status,400);
  const created=await post(requestJob,body,token);assert.equal(created.status,201);
  assert.equal((await created.json() as any).tool,'redbit_read_status');
  assert.equal((await post(requestJob,body,token)).status,409);
  assert.equal((await post(requestJob,requestBody(bit.sessionId,'b'.repeat(32)),token)).status,409);
  assert.equal((await post(claimJob,{confirm:true},fit.accessToken)).status,401);
  assert.equal((await post(claimJob,{confirm:false},bit.accessToken)).status,400);
  assert.deepEqual(await (await post(claimJob,{confirm:true},other.accessToken)).json(),{version:1,job:null});
  assert.equal((await post(completeJob,{id:jobId,status},bit.accessToken)).status,409);
  const claimed=await (await post(claimJob,{confirm:true},bit.accessToken)).json() as any;
  assert.equal(claimed.job.id,jobId);
  assert.deepEqual(await (await post(claimJob,{confirm:true},bit.accessToken)).json(),{version:1,job:null});
  assert.equal((await post(completeJob,{id:jobId,status},other.accessToken)).status,409);
  assert.equal((await post(completeJob,{id:jobId,status:{...status,title:'private'}},bit.accessToken)).status,400);
  assert.equal((await post(completeJob,{id:jobId,status},bit.accessToken)).status,200);
  assert.equal((await post(completeJob,{id:jobId,status},bit.accessToken)).status,409);
  assert.equal((await post(resultJob,{sessionId:bit.sessionId,id:jobId},bit.accessToken)).status,401);
  assert.deepEqual(await (await post(resultJob,{sessionId:bit.sessionId,id:jobId},token)).json(),{version:1,state:'completed',status});
  await post(revoke,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal((await post(resultJob,{sessionId:bit.sessionId,id:jobId},token)).status,403);
 },true);
});

test('Read job expiry and grant renewal cannot revive a previously claimed result',async()=>{
 await fixture(true,async({service,post,token,pair})=>{
  const bit=await pair('red-bit');
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  await post(requestJob,requestBody(bit.sessionId),token);
  await post(claimJob,{confirm:true},bit.accessToken);
  service.store.sqlite.prepare('UPDATE home_red_bit_read_job SET expires=? WHERE id=?').run(Date.now()-1,jobId);
  assert.equal((await post(completeJob,{id:jobId,status},bit.accessToken)).status,409);
  assert.equal((await post(resultJob,{sessionId:bit.sessionId,id:jobId},token)).status,404);
  const second='c'.repeat(32);
  assert.equal((await post(requestJob,requestBody(bit.sessionId,second),token)).status,201);
  await post(claimJob,{confirm:true},bit.accessToken);
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal((await post(completeJob,{id:second,status},bit.accessToken)).status,409);
  assert.equal(Number(service.store.sqlite.prepare('SELECT COUNT(*) AS n FROM home_red_bit_read_job').get().n),0);
 },true);
});

test('Read-job preflight allows only trusted app origins and never grants execution',async()=>{
 for(const enabled of [false,true]){
  await fixture(true,async({send})=>{
   for(const path of [requestJob,resultJob,claimJob,completeJob]){
    for(const source of ['redion-local://app','capacitor://localhost',origin]){
     const headers={Origin:source,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'};
     const response=await send(path,{method:'OPTIONS',headers});
     assert.equal(response.status,enabled?204:404);
     if(enabled){
      assert.equal(response.headers.get('Access-Control-Allow-Origin'),source);
      assert.match(response.headers.get('Access-Control-Allow-Methods')??'',/POST/);
      assert.match(response.headers.get('Access-Control-Allow-Headers')??'',/Authorization/i);
      assert.equal(await response.text(),'');
      const denied=await send(path,{method:'POST',headers:{Origin:source,'Content-Type':'application/json'},body:JSON.stringify({confirm:true})});
      assert.equal(denied.status,401);
     }
    }
    for(const source of ['https://evil.example.test','null']){
     const response=await send(path,{method:'OPTIONS',headers:{Origin:source}});
     assert.equal(response.status,403);
     assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
    }
   }
  },enabled);
 }
});

const transportGrant='/home/red-bit/transport-grant',transportRevoke='/home/red-bit/transport-revoke',transportList='/home/red-bit/transport-grants',transportCheck='/red-bit/v1/transport-permission';
test('Transport permission is independently disabled even with read access',async()=>{
 await fixture(true,async({get,post,token,pair})=>{
  const bit=await pair('red-bit');
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal((await get(transportCheck,bit.accessToken)).status,404);
  assert.equal((await get(transportList,token)).status,404);
  assert.equal((await post(transportGrant,{sessionId:bit.sessionId,confirm:true},token)).status,404);
 },true);
});
test('Transport grant is short-lived, explicitly confirmed and isolated from read grants',async()=>{
 await fixture(true,async({get,post,token,pair,service})=>{
  const bit=await pair('red-bit'),other=await pair('red-bit'),fit=await pair('red-fit');
  const body={sessionId:bit.sessionId,confirm:true};
  assert.equal((await get(transportCheck,bit.accessToken)).status,403);
  assert.equal((await post(transportGrant,body,bit.accessToken)).status,401);
  assert.equal((await post(transportGrant,{...body,confirm:false},token)).status,400);
  assert.equal((await post(transportGrant,{...body,scope:'arbitrary'},token)).status,400);
  assert.equal((await post(transportGrant,{...body,sessionId:fit.sessionId},token)).status,404);
  const created=await post(transportGrant,body,token);
  assert.equal(created.status,201);
  const g=await created.json() as any;
  assert.equal(g.scope,'music:transport:control');
  assert.equal(g.localConfirmationRequired,true);
  assert.equal(g.remoteAvailable,false);
  assert.ok(g.expiresAt>Date.now()&&g.expiresAt<=Date.now()+900000);
  assert.equal((await get(permission,bit.accessToken)).status,403);
  assert.equal((await get(transportCheck,other.accessToken)).status,403);
  assert.equal((await get(transportCheck,fit.accessToken)).status,401);
  assert.equal((await get(transportList,bit.accessToken)).status,401);
  assert.equal((await get(transportCheck,bit.accessToken)).status,200);
  assert.equal((await post(grant,body,token)).status,201);
  assert.equal((await post(transportRevoke,body,token)).status,200);
  assert.equal((await get(transportCheck,bit.accessToken)).status,403);
  assert.equal((await get(permission,bit.accessToken)).status,200);
  await post(transportGrant,body,token);
  service.store.sqlite.prepare('UPDATE home_red_bit_transport_permission SET expires=? WHERE session_id=?').run(Date.now()-1,bit.sessionId);
  assert.equal((await get(transportCheck,bit.accessToken)).status,403);
  await post(transportGrant,body,token);
  assert.equal((await post('/red-id/v2/revoke-session',{id:bit.sessionId},token)).status,200);
  assert.equal(Number(service.store.sqlite.prepare('SELECT COUNT(*) AS n FROM home_red_bit_transport_permission WHERE session_id=?').get(bit.sessionId).n),0);
  assert.equal((await post('/red-bit/v1/execute',{},other.accessToken)).status,404);
 },false,true);
});

const trRequest='/home/red-bit/transport-request',trResult='/home/red-bit/transport-result',trClaim='/red-bit/v1/transport-claim',trAuthorize='/red-bit/v1/transport-authorize',trComplete='/red-bit/v1/transport-complete';
test('Transport jobs need independent opt-in and transport grant',async()=>{
 await fixture(true,async({post,token,pair})=>{
  const bit=await pair('red-bit');
  await post(transportGrant,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal((await post(trClaim,{confirm:true},bit.accessToken)).status,404);
 },false,true);
 await fixture(true,async({post,token,pair})=>{
  const bit=await pair('red-bit');
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal((await post(trClaim,{confirm:true},bit.accessToken)).status,403);
 },false,true,true);
});
test('Transport command is isolated and authorized once; only exact allowed commands',async()=>{
 await fixture(false,async({post,token,pair})=>{
  const bit=await pair('red-bit'),other=await pair('red-bit');
  const body={sessionId:bit.sessionId,confirm:true};
  await post(transportGrant,body,token);
  await post(transportGrant,{sessionId:other.sessionId,confirm:true},token);
  const id='d'.repeat(32),request={...body,id,command:'next',issuedAt:Date.now()};
  assert.equal((await post(trRequest,{...request,command:'delete'},token)).status,400);
  assert.equal((await post(trRequest,request,bit.accessToken)).status,401);
  assert.equal((await post(trRequest,request,token)).status,201);
  assert.equal((await post(trRequest,{...request,id:'e'.repeat(32)},token)).status,409);
  assert.deepEqual(await (await post(trClaim,{confirm:true},other.accessToken)).json(),{version:1,job:null});
  assert.equal((await post(trAuthorize,{id,command:'next',confirm:true},bit.accessToken)).status,409);
  const claim=await (await post(trClaim,{confirm:true},bit.accessToken)).json() as any;
  assert.equal(claim.job.command,'next');
  assert.deepEqual(await (await post(trClaim,{confirm:true},bit.accessToken)).json(),{version:1,job:null});
  assert.equal((await post(trComplete,{id,outcome:'executed'},bit.accessToken)).status,409);
  assert.equal((await post(trAuthorize,{id,command:'pause',confirm:true},bit.accessToken)).status,409);
  assert.equal((await post(trAuthorize,{id,command:'next',confirm:false},bit.accessToken)).status,400);
  assert.equal((await post(trAuthorize,{id,command:'next',confirm:true},other.accessToken)).status,409);
  const permit=await post(trAuthorize,{id,command:'next',confirm:true},bit.accessToken);
  assert.equal(permit.status,200);
  assert.ok((await permit.json() as any).expiresAt<=Date.now()+5000);
  assert.equal((await post(trAuthorize,{id,command:'next',confirm:true},bit.accessToken)).status,409);
  assert.equal((await post(trComplete,{id,outcome:'executed'},bit.accessToken)).status,200);
  assert.equal((await post(trComplete,{id,outcome:'executed'},bit.accessToken)).status,409);
  assert.deepEqual(await (await post(trResult,{sessionId:bit.sessionId,id},token)).json(),{version:1,state:'completed',outcome:'executed'});
  await post(transportRevoke,body,token);
  await post(transportGrant,body,token);
  assert.equal((await post(trRequest,{...request,issuedAt:Date.now()},token)).status,409);
 },false,true,true);
});
test('Transport cancellation, expiry and grant renewal prevent authorization',async()=>{
 await fixture(false,async({post,token,pair,service})=>{
  const bit=await pair('red-bit'),body={sessionId:bit.sessionId,confirm:true};
  await post(transportGrant,body,token);
  const req=(id:string)=>({...body,id,command:'play',issuedAt:Date.now()});
  const a='a'.repeat(32),b='b'.repeat(32),c='c'.repeat(32);
  await post(trRequest,req(a),token);
  await post(trClaim,{confirm:true},bit.accessToken);
  assert.equal((await post(trComplete,{id:a,outcome:'declined'},bit.accessToken)).status,200);
  assert.equal((await post(trAuthorize,{id:a,command:'play',confirm:true},bit.accessToken)).status,409);
  await post(trRequest,req(b),token);
  await post(trClaim,{confirm:true},bit.accessToken);
  await post(transportGrant,body,token);
  assert.equal((await post(trAuthorize,{id:b,command:'play',confirm:true},bit.accessToken)).status,409);
  await post(trRequest,req(c),token);
  await post(trClaim,{confirm:true},bit.accessToken);
  service.store.sqlite.prepare('UPDATE home_red_bit_transport_job SET expires=? WHERE id=?').run(Date.now()-1,c);
  assert.equal((await post(trAuthorize,{id:c,command:'play',confirm:true},bit.accessToken)).status,409);
 },false,true,true);
});

test('MCP delegation requires separate owner confirmation, matching OAuth epoch and device permission',async()=>{
 await fixture(true,async({service,get,post,token,pair})=>{
  const bit=await pair('red-bit'),other=await pair('red-bit');
  const db=service.store.sqlite;
  const owner=String(db.prepare('SELECT owner FROM home_red_session WHERE id=?').get(bit.sessionId).owner);
  const grantId='grant:'+'a'.repeat(64),clientId='client-fixture';
  const oauth={userId:owner,clientId,epoch:'epoch-1',active:true,remember:false,scopes:['redion:read'],workspaceIds:[]};
  db.prepare("INSERT INTO mcp_state(key,kind,data,expires,revision) VALUES(?,'grant',?,?,1)").run(grantId,JSON.stringify(oauth),Date.now()+600000);
  const principal={userId:owner,clientId,grantId,scopes:['redion:read' as const],workspaceIds:[]};
  const enabled=new Set<'status'|'transport'>(['status','transport']);
  const body={grantId,sessionId:bit.sessionId,mode:'status',confirm:true};
  const allow=()=>redBitMcpAllowed(db,principal,bit.sessionId,'status',enabled);
  assert.equal(allow(),false);
  assert.equal((await post('/home/red-bit/mcp-grant',body,token)).status,403);
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal((await post('/home/red-bit/mcp-grant',body,bit.accessToken)).status,401);
  assert.equal((await post('/home/red-bit/mcp-grant',{...body,confirm:false},token)).status,400);
  const created=await post('/home/red-bit/mcp-grant',body,token);
  assert.equal(created.status,201);
  const receipt=await created.json() as any;
  assert.equal(receipt.toolsAvailable,true);
  assert.ok(receipt.expiresAt<=Date.now()+300000);
  assert.equal(allow(),true);
  assert.equal(redBitMcpAllowed(db,principal,other.sessionId,'status',enabled),false);
  assert.equal(redBitMcpAllowed(db,principal,bit.sessionId,'transport',enabled),false);
  assert.equal(redBitMcpAllowed(db,{...principal,clientId:'other'},bit.sessionId,'status',enabled),false);
  const listed=await (await get('/home/red-bit/mcp-grants',token)).json() as any;
  assert.equal(listed.grants.length,1);assert.equal(Object.hasOwn(listed.grants[0],'epoch'),false);
  db.prepare('UPDATE mcp_state SET data=? WHERE key=?').run(JSON.stringify({...oauth,epoch:'epoch-2'}),grantId);
  assert.equal(allow(),false);
  await post('/home/red-bit/mcp-grant',body,token);
  assert.equal(allow(),true);
  await post(grant,{sessionId:bit.sessionId,confirm:true},token);
  assert.equal(allow(),false);
  await post('/home/red-bit/mcp-grant',body,token);
  assert.equal((await post('/home/red-bit/mcp-revoke',body,token)).status,200);
  assert.equal(allow(),false);
 },true,true,true,true);
});
test('MCP delegation is disabled by default despite device permissions',async()=>{
 await fixture(true,async({get,token})=>{
  assert.equal((await get('/home/red-bit/mcp-grants',token)).status,404);
 },true,true,true);
});

test('Delegated MCP tools queue actual device jobs, isolate results and cancel on revocation',async()=>{
 await fixture(true,async({service,post,token,pair})=>{
  const bit=await pair('red-bit'),db=service.store.sqlite;
  const owner=String(db.prepare('SELECT owner FROM home_red_session WHERE id=?').get(bit.sessionId).owner);
  const grantId='grant:'+'c'.repeat(64),clientId='mcp-fixture',epoch='epoch-a';
  const oauth={userId:owner,clientId,epoch,active:true,remember:false,scopes:['redion:read'],workspaceIds:[]};
  db.prepare("INSERT INTO mcp_state(key,kind,data,expires,revision) VALUES(?,'grant',?,?,1)").run(grantId,JSON.stringify(oauth),Date.now()+600000);
  const p={userId:owner,clientId,grantId,scopes:['redion:read' as const],workspaceIds:[]};
  const tools=createRedBitMcpTools(db,new Set(['status','transport'] as const));
  const sessionId=bit.sessionId,base={sessionId,confirm:true},delegation={...base,grantId,mode:'status'};
  const args={...base,requestId:'1'.repeat(32)};
  assert.deepEqual(tools.list(p),[]);
  assert.throws(()=>tools.call(p,'redbit_read_status',args));
  await post(grant,base,token);
  await post('/home/red-bit/mcp-grant',delegation,token);
  assert.ok(tools.list(p).some(t=>t.name==='redbit_read_status'));
  assert.ok(!tools.list(p).some(t=>t.name==='redbit_play'));
  const job=tools.call(p,'redbit_read_status',args) as {jobId:string};
  assert.throws(()=>tools.call(p,'redbit_read_status',args));
  assert.throws(()=>tools.call(p,'redbit_play',{...args,requestId:'2'.repeat(32)}));
  const claim=await (await post(claimJob,{confirm:true},bit.accessToken)).json() as any;
  assert.equal(claim.job.id,job.jobId);
  await post(completeJob,{id:job.jobId,status},bit.accessToken);
  assert.equal((tools.call(p,'redbit_get_job_result',{sessionId,jobId:job.jobId}) as {state:string}).state,'completed');
  assert.throws(()=>tools.call({...p,grantId:'grant:'+'d'.repeat(64)},'redbit_get_job_result',{sessionId,jobId:job.jobId}));
  await post(transportGrant,base,token);
  await post('/home/red-bit/mcp-grant',{...delegation,mode:'transport'},token);
  const play=tools.call(p,'redbit_play',{...args,requestId:'3'.repeat(32)}) as {jobId:string};
  const claimed=await (await post(trClaim,{confirm:true},bit.accessToken)).json() as any;
  assert.equal(claimed.job.id,play.jobId);
  await post('/home/red-bit/mcp-revoke',{...delegation,mode:'transport'},token);
  assert.equal((await post(trAuthorize,{id:play.jobId,command:'play',confirm:true},bit.accessToken)).status,409);
  assert.throws(()=>tools.call(p,'redbit_get_job_result',{sessionId,jobId:play.jobId}));
  const next=tools.call(p,'redbit_read_status',{...args,requestId:'4'.repeat(32)}) as {jobId:string};
  db.prepare('UPDATE mcp_state SET data=? WHERE key=?').run(JSON.stringify({...oauth,epoch:'new'}),grantId);
  assert.deepEqual(await (await post(claimJob,{confirm:true},bit.accessToken)).json(),{version:1,job:null});
  assert.throws(()=>tools.call(p,'redbit_get_job_result',{sessionId,jobId:next.jobId}));
 },true,true,true,true);
});

test('End-to-end Home MCP OAuth, separate delegation and RED Bit device command lifecycle',async()=>{
 await fixture(true,async({service,send,get,post,token,pair})=>{
  const bit=await pair('red-bit'),sessionId=bit.sessionId;
  const owner=String(service.store.sqlite.prepare('SELECT owner FROM home_red_session WHERE id=?').get(sessionId).owner);
  await service.store.ablage.setze('bereiche',{id:'redbit-e2e',name:'Fixture',besitzer:owner});
  const redirect='https://client.example.test/callback',resource=origin+'/mcp/cloud';
  const registration=await post('/register',{client_name:'RED Bit integration fixture',redirect_uris:[redirect],grant_types:['authorization_code'],token_endpoint_auth_method:'none'});
  assert.equal(registration.status,201);
  const {client_id}=await registration.json() as {client_id:string};
  const verifier='v'.repeat(64);
  const target='/mcp/authorize?'+new URLSearchParams({client_id,redirect_uri:redirect,response_type:'code',resource,scope:'redion:read',code_challenge:await pkceChallenge(verifier),code_challenge_method:'S256',state:'redbit-e2e'});
  const form=(path:string,body:Record<string,string>,cookie?:string)=>send(path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded',...(cookie?{Cookie:cookie}:{})},body:new URLSearchParams(body)});
  const login=await form('/home/mcp-login',{code:issueHomeConsentCode(service.store.sqlite),target});
  assert.equal(login.status,303);
  const cookie=login.headers.get('Set-Cookie')!.split(';')[0]!;
  const html=await (await send(target,{headers:{Cookie:cookie}})).text();
  const requestId=/name="requestId" value="([^"]+)"/.exec(html)?.[1],csrf=/name="csrf" value="([^"]+)"/.exec(html)?.[1];
  assert.ok(requestId&&csrf);
  const approved=await form('/mcp/authorize',{requestId,csrf,decision:'allow',workspace:'redbit-e2e'},cookie);
  assert.equal(approved.status,303);
  const code=new URL(approved.headers.get('Location')!).searchParams.get('code')!;
  const exchanged=await form('/token',{grant_type:'authorization_code',client_id,code,redirect_uri:redirect,code_verifier:verifier,resource});
  assert.equal(exchanged.status,200);
  const {access_token}=await exchanged.json() as {access_token:string};
  let seq=0;
  const rpc=async(method:string,params:object={},access=access_token)=>{
   const response=await send('/mcp/cloud',{method:'POST',headers:{Authorization:'Bearer '+access,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++seq,method,params})});
   assert.equal(response.status,200);return (await response.json() as any).result;
  };
  const call=(name:string,args:object)=>rpc('tools/call',{name,arguments:args});
  const names=async()=> (await rpc('tools/list')).tools.map((tool:{name:string})=>tool.name) as string[];
  assert.ok(!(await names()).some(n=>n.startsWith('redbit_')));
  const args={sessionId,requestId:'f'.repeat(32),confirm:true};
  assert.equal((await call('redbit_play',args)).isError,true);
  const inventory=await (await get('/home/mcp-hub/connections',token)).json() as any;
  const grantId=inventory.connections[0].id;
  const base={sessionId,confirm:true};
  assert.equal((await post(transportGrant,base,token)).status,201);
  assert.equal((await post('/home/red-bit/mcp-grant',{...base,grantId,mode:'transport'},access_token)).status,401);
  assert.equal((await post('/home/red-bit/mcp-grant',{...base,grantId,mode:'transport'},token)).status,201);
  const available=await names();
  for(const name of ['redbit_play','redbit_pause','redbit_next','redbit_previous','redbit_list_devices','redbit_get_job_result'])assert.ok(available.includes(name),name);
  assert.ok(!available.includes('redbit_read_status'));
  const job=(await call('redbit_play',args)).structuredContent;
  assert.equal(job.state,'pending');assert.equal(job.playbackVerified,false);
  assert.equal((await call('redbit_play',args)).isError,true);
  const claim=await (await post(trClaim,{confirm:true},bit.accessToken)).json() as any;
  assert.equal(claim.job.id,job.jobId);assert.equal(claim.job.command,'play');
  assert.equal((await post(trAuthorize,{id:job.jobId,command:'play',confirm:true},bit.accessToken)).status,200);
  assert.equal((await post(trComplete,{id:job.jobId,outcome:'executed'},bit.accessToken)).status,200);
  const result=(await call('redbit_get_job_result',{sessionId,jobId:job.jobId})).structuredContent;
  assert.equal(result.outcome,'executed');assert.equal(result.playbackVerified,false);
  const pending=(await call('redbit_next',{...args,requestId:'e'.repeat(32)})).structuredContent;
  assert.equal(pending.state,'pending');
  assert.equal((await post('/home/mcp-hub/revoke',{id:grantId,confirm:true},token)).status,200);
  assert.deepEqual(await (await post(trClaim,{confirm:true},bit.accessToken)).json(),{version:1,job:null});
  const denied=await send('/mcp/cloud',{method:'POST',headers:{Authorization:'Bearer '+access_token,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:99,method:'tools/list'})});
  assert.equal(denied.status,401);
 },true,true,true,true);
});
