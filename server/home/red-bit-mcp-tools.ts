import {createHash} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {McpPrincipal} from '../mcp/oauth.ts';
import {CloudMcpToolError} from '../mcp/cloud-tools.ts';
import {redBitMcpAllowed} from './red-bit-mcp-grants.ts';

type Mode='status'|'transport';
const commands={redbit_read_status:'status',redbit_play:'play',redbit_pause:'pause',redbit_next:'next',redbit_previous:'previous'} as const;
const names=['redbit_list_devices','redbit_get_job_result',...Object.keys(commands)];
const sessionId=(v:unknown):v is string=>typeof v==='string'&&/^session_[a-f0-9]{64}$/.test(v);
const requestId=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{32}$/.test(v);
const exact=(args:Record<string,unknown>,keys:string[])=>Object.keys(args).length===keys.length&&keys.every(k=>Object.hasOwn(args,k));
const denied=()=>new CloudMcpToolError('permission_denied','Separate RED Bit delegation required.');
const invalid=()=>new CloudMcpToolError('invalid_arguments','Invalid RED Bit arguments.');
const conflict=()=>new CloudMcpToolError('request_conflict','Request already exists, another job is active or rate limit reached. Do not retry automatically.');
const schema=(properties:Record<string,unknown>,required:string[])=>({type:'object',properties,required,additionalProperties:false});
const session={type:'string',pattern:'^session_[a-f0-9]{64}$'},id={type:'string',pattern:'^[a-f0-9]{32}$'};
const requestSchema=schema({sessionId:session,requestId:id,confirm:{type:'boolean',const:true}},['sessionId','requestId','confirm']);
const resultSchema=schema({sessionId:session,jobId:id},['sessionId','jobId']);
const readAnnotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
const requestAnnotations={readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:true};
export function createRedBitMcpTools(db:DatabaseSync,enabled:ReadonlySet<Mode>,clock=Date.now){
 const allowed=(p:McpPrincipal,s:string,m:Mode,now=clock())=>redBitMcpAllowed(db,p,s,m,enabled,now);
 const devices=(p:McpPrincipal)=>{
  const now=clock();
  const rows=db.prepare('SELECT session_id,mode,expires FROM home_red_bit_mcp_grant WHERE owner=? AND grant_id=? AND expires>? ORDER BY session_id,mode LIMIT 128').all(p.userId,p.grantId,now);
  return rows.flatMap(r=>{
   const m=r.mode;
   if((m!=='status'&&m!=='transport')||typeof r.session_id!=='string'||!allowed(p,r.session_id,m,now))return [];
   return [{sessionId:r.session_id,mode:m,expiresAt:Number(r.expires)}];
  });
 };
 const list=(p:McpPrincipal)=>{
  const modes=new Set(devices(p).map(d=>d.mode));
  if(!modes.size)return [];
  return [
   {name:'redbit_list_devices',description:'List explicitly delegated RED Bit sessions, not online presence.',inputSchema:schema({},[]),annotations:readAnnotations},
   {name:'redbit_get_job_result',description:'Read a result for a job created by this MCP connection, before expiry. Never automatically retry a music command.',inputSchema:resultSchema,annotations:readAnnotations},
   ...Object.entries(commands).filter(([,command])=>modes.has(command==='status'?'status':'transport')).map(([name,command])=>({
    name,description:'Queue a single RED Bit '+command+' request. Requires explicit user approval and separate confirmation on the target device. Returns a job ID, not playback success. Use a fresh random 32-character lowercase hex requestId for a new confirmed request; never retry automatically.',
    inputSchema:requestSchema,annotations:requestAnnotations
   }))
  ];
 };
 const call=(p:McpPrincipal,name:string,args:Record<string,unknown>)=>{
  if(name==='redbit_list_devices'){
   if(!exact(args,[]))throw invalid();
   return {version:1,devices:devices(p)};
  }
  if(name==='redbit_get_job_result'){
   if(!exact(args,['sessionId','jobId'])||!sessionId(args.sessionId)||!requestId(args.jobId))throw invalid();
   const now=clock();
   const provenance=db.prepare("SELECT j.mode FROM home_red_bit_mcp_job j JOIN home_red_bit_mcp_grant g ON g.owner=j.owner AND g.grant_id=j.grant_id AND g.epoch=j.epoch AND g.session_id=j.session_id AND g.mode=j.mode WHERE j.owner=? AND j.grant_id=? AND j.session_id=? AND j.id=? AND g.expires>?").get(p.userId,p.grantId,args.sessionId,args.jobId,now);
   const mode=provenance?.mode;
   if((mode!=='status'&&mode!=='transport')||!allowed(p,args.sessionId,mode,now))throw denied();
   const table=mode==='status'?'home_red_bit_read_job':'home_red_bit_transport_job';
   const field=mode==='status'?'result':'outcome';
   const row=db.prepare('SELECT state,'+field+' AS value FROM '+table+' WHERE owner=? AND session_id=? AND id=? AND expires>?').get(p.userId,args.sessionId,args.jobId,now);
   if(!row)throw new CloudMcpToolError('not_found','Job expired or unavailable.');
   return {version:1,state:row.state,...(mode==='status'?{status:row.state==='completed'?JSON.parse(String(row.value)):null}:{outcome:row.value}),playbackVerified:false};
  }
  if(!Object.hasOwn(commands,name)||!exact(args,['sessionId','requestId','confirm'])||!sessionId(args.sessionId)||!requestId(args.requestId)||args.confirm!==true)throw invalid();
  const command=commands[name as keyof typeof commands],mode:Mode=command==='status'?'status':'transport';
  const session=args.sessionId;
  const jobId=createHash('sha256').update(JSON.stringify([p.userId,p.grantId,args.requestId])).digest('hex').slice(0,32);
  db.exec('BEGIN IMMEDIATE');
  try{
   const now=clock();
   if(!allowed(p,session,mode,now))throw denied();
   const g=db.prepare('SELECT epoch,expires FROM home_red_bit_mcp_grant WHERE owner=? AND grant_id=? AND session_id=? AND mode=?').get(p.userId,p.grantId,session,mode);
   if(!g||typeof g.epoch!=='string')throw denied();
   // The provenance tombstone also survives device-grant renewal and revocation.
   db.prepare('DELETE FROM home_red_bit_mcp_job WHERE created<=?').run(now-120000);
   if(db.prepare('SELECT 1 FROM home_red_bit_mcp_job WHERE owner=? AND id=?').get(p.userId,jobId))throw conflict();
   const table=mode==='status'?'home_red_bit_read_job':'home_red_bit_transport_job';
   const live=mode==='status'?"'pending','claimed'":"'pending','claimed','authorized'";
   db.prepare('DELETE FROM '+table+' WHERE created<=?').run(now-120000);
   if(db.prepare('SELECT 1 FROM '+table+' WHERE owner=? AND id=?').get(p.userId,jobId))throw conflict();
   const recent=Number(db.prepare('SELECT COUNT(*) AS n FROM '+table+' WHERE session_id=? AND created>?').get(session,now-60000)?.n??0);
   if(recent>=(mode==='status'?10:6)||db.prepare('SELECT 1 FROM '+table+' WHERE session_id=? AND expires>? AND state IN ('+live+')').get(session,now))throw conflict();
   const expiresAt=Math.min(now+(mode==='status'?45000:30000),Number(g.expires));
   if(expiresAt<=now)throw denied();
   db.prepare('INSERT INTO home_red_bit_mcp_job(owner,id,grant_id,epoch,session_id,mode,created) VALUES(?,?,?,?,?,?,?)').run(p.userId,jobId,p.grantId,g.epoch,session,mode,now);
   if(mode==='status')db.prepare("INSERT INTO home_red_bit_read_job(owner,session_id,id,created,expires,state) VALUES(?,?,?,?,?,'pending')").run(p.userId,session,jobId,now,expiresAt);
   else db.prepare("INSERT INTO home_red_bit_transport_job(owner,session_id,id,command,created,expires,state) VALUES(?,?,?,?,?,?,'pending')").run(p.userId,session,jobId,command,now,expiresAt);
   db.exec('COMMIT');
   return {version:1,jobId,sessionId:session,expiresAt,state:'pending',localConfirmationRequired:true,playbackVerified:false};
  }catch(e){db.exec('ROLLBACK');throw e;}
 };
 return {list,call,has:(name:string)=>names.includes(name)};
}
