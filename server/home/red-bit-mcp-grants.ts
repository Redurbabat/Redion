import type {DatabaseSync} from 'node:sqlite';
import type {Ablage} from '../typen.ts';
import {werFragt} from '../kern.ts';
import {leseBegrenzt} from '../sicherheit/eingaben.ts';
import type {McpPrincipal} from '../mcp/oauth.ts';

export const RED_BIT_MCP_GRANT_ROUTES=['/home/red-bit/mcp-grants','/home/red-bit/mcp-grant','/home/red-bit/mcp-revoke'] as const;
const modes=['status','transport'] as const;
type Mode=typeof modes[number];
const mode=(v:unknown):v is Mode=>typeof v==='string'&&(modes as readonly string[]).includes(v);
const grantId=(v:unknown):v is string=>typeof v==='string'&&/^grant:[a-f0-9]{64}$/.test(v);
const sessionId=(v:unknown):v is string=>typeof v==='string'&&/^session_[a-f0-9]{64}$/.test(v);
const reply=(status:number,body:unknown)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const TTL=300_000,LIMIT=128;
const activeOAuth=(db:DatabaseSync,owner:string,grant:string,now:number)=>db.prepare("SELECT expires,json_extract(data,'$.epoch') AS epoch,json_extract(data,'$.clientId') AS client_id FROM mcp_state WHERE key=? AND kind='grant' AND expires>? AND json_extract(data,'$.userId')=? AND json_extract(data,'$.active')=1").get(grant,now,owner);
const activeDevice=(db:DatabaseSync,owner:string,session:string,kind:Mode,now:number)=>{
 const table=kind==='status'?'home_red_bit_permission':'home_red_bit_transport_permission';
 return db.prepare("SELECT g.expires,s.refresh_until FROM "+table+" g JOIN home_red_session s ON s.id=g.session_id AND s.owner=g.owner JOIN konten c ON c.id=s.owner WHERE g.owner=? AND g.session_id=? AND g.expires>? AND s.refresh_until>? AND s.app='red-bit' AND c.gesperrt=0").get(owner,session,now,now);
};

export function prepareRedBitMcpGrants(db:DatabaseSync,enabled:ReadonlySet<Mode>){
 db.exec(`CREATE TABLE IF NOT EXISTS home_red_bit_mcp_grant(owner TEXT NOT NULL,grant_id TEXT NOT NULL,epoch TEXT NOT NULL,session_id TEXT NOT NULL,mode TEXT NOT NULL CHECK(mode IN ('status','transport')),expires INTEGER NOT NULL,PRIMARY KEY(owner,grant_id,session_id,mode));
 CREATE TRIGGER IF NOT EXISTS home_red_bit_mcp_session_cleanup AFTER DELETE ON home_red_session BEGIN DELETE FROM home_red_bit_mcp_grant WHERE session_id=OLD.id; END;`);
 for(const kind of enabled){
  const table=kind==='status'?'home_red_bit_permission':'home_red_bit_transport_permission';
  for(const event of ['DELETE','UPDATE']){
   db.exec("CREATE TRIGGER IF NOT EXISTS home_red_bit_mcp_"+kind+"_"+event.toLowerCase()+" AFTER "+event+" ON "+table+" BEGIN DELETE FROM home_red_bit_mcp_grant WHERE session_id=OLD.session_id AND mode='"+kind+"'; END;");
  }
 }
 // A new pilot configuration must not revive old explicit authorizations.
 db.exec('DELETE FROM home_red_bit_mcp_grant');
}

/** Both the current OAuth authorization and the device permission must exist.
 * This is a policy predicate only, not a tool or job execution path. */
export function redBitMcpAllowed(db:DatabaseSync,principal:McpPrincipal,session:string,kind:Mode,enabled:ReadonlySet<Mode>,now=Date.now()):boolean{
 if(!enabled.has(kind)||!sessionId(session)||!grantId(principal.grantId)||!principal.scopes.includes('redion:read'))return false;
 const oauth=activeOAuth(db,principal.userId,principal.grantId,now);
 if(!oauth||typeof oauth.epoch!=='string'||oauth.client_id!==principal.clientId)return false;
 const row=db.prepare('SELECT 1 FROM home_red_bit_mcp_grant WHERE owner=? AND grant_id=? AND epoch=? AND session_id=? AND mode=? AND expires>?').get(principal.userId,principal.grantId,oauth.epoch,session,kind,now);
 return !!row&&!!activeDevice(db,principal.userId,session,kind,now);
}

export function createRedBitMcpGrants(db:DatabaseSync,ablage:Ablage,enabled:ReadonlySet<Mode>,clock=Date.now){
 return async(request:Request):Promise<Response>=>{
  const path=new URL(request.url).pathname,list=path===RED_BIT_MCP_GRANT_ROUTES[0];
  if(!(RED_BIT_MCP_GRANT_ROUTES as readonly string[]).includes(path))return reply(404,{error:'not_found'});
  if(request.method!==(list?'GET':'POST'))return reply(405,{error:'method_not_allowed'});
  const who=await werFragt(ablage,{authorization:request.headers.get('authorization')??''});
  if(!who?.sitzung)return reply(401,{error:'unauthorized'});
  const owner=String(who.konto.id),now=clock();
  db.prepare('DELETE FROM home_red_bit_mcp_grant WHERE expires<=?').run(now);
  if(list){
   const rows=db.prepare("SELECT grant_id,epoch,session_id,mode,expires FROM home_red_bit_mcp_grant WHERE owner=? AND expires>? ORDER BY grant_id,session_id,mode LIMIT ?").all(owner,now,LIMIT+1);
   const grants=rows.slice(0,LIMIT).flatMap(row=>{
    if(!mode(row.mode)||!enabled.has(row.mode))return [];
    const oauth=activeOAuth(db,owner,String(row.grant_id),now),device=activeDevice(db,owner,String(row.session_id),row.mode,now);
    if(!oauth||oauth.epoch!==row.epoch||!device)return [];
    return [{grantId:row.grant_id,sessionId:row.session_id,mode:row.mode,expiresAt:Math.min(Number(row.expires),Number(oauth.expires),Number(device.expires),Number(device.refresh_until))}];
   });
   return reply(200,{version:1,grants,truncated:rows.length>LIMIT,toolsAvailable:false});
  }
  if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')return reply(400,{error:'invalid_request'});
  let v:Record<string,unknown>;
  try{
   const bytes=await leseBegrenzt(request.body,1024);if(!bytes)return reply(400,{error:'invalid_request'});
   const value:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
   if(!value||typeof value!=='object'||Array.isArray(value))return reply(400,{error:'invalid_request'});
   v=value as Record<string,unknown>;
  }catch{return reply(400,{error:'invalid_request'});}
  if(Object.keys(v).length!==4||!grantId(v.grantId)||!sessionId(v.sessionId)||!mode(v.mode)||v.confirm!==true)return reply(400,{error:'invalid_request'});
  if(path==='/home/red-bit/mcp-revoke'){
   db.prepare('DELETE FROM home_red_bit_mcp_grant WHERE owner=? AND grant_id=? AND session_id=? AND mode=?').run(owner,v.grantId,v.sessionId,v.mode);
   return reply(200,{ok:true});
  }
  if(!enabled.has(v.mode))return reply(404,{error:'not_found'});
  const oauth=activeOAuth(db,owner,v.grantId,now),device=activeDevice(db,owner,v.sessionId,v.mode,now);
  if(!oauth||typeof oauth.epoch!=='string'||!device)return reply(403,{error:'grant_required'});
  const expires=Math.min(now+TTL,Number(oauth.expires),Number(device.expires),Number(device.refresh_until));
  db.prepare('INSERT INTO home_red_bit_mcp_grant(owner,grant_id,epoch,session_id,mode,expires) VALUES(?,?,?,?,?,?) ON CONFLICT(owner,grant_id,session_id,mode) DO UPDATE SET epoch=excluded.epoch,expires=excluded.expires').run(owner,v.grantId,oauth.epoch,v.sessionId,v.mode,expires);
  return reply(201,{version:1,grantId:v.grantId,sessionId:v.sessionId,mode:v.mode,expiresAt:expires,toolsAvailable:false});
 };
}
