import {createHash} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {Ablage} from '../typen.ts';
import {werFragt} from '../kern.ts';
import {leseBegrenzt} from '../sicherheit/eingaben.ts';

export const RED_BIT_TRANSPORT_ROUTES=['/home/red-bit/transport-grants','/home/red-bit/transport-grant','/home/red-bit/transport-revoke','/red-bit/v1/transport-permission'] as const;
const SCOPE='music:transport:control';
const TTL=15*60*1000;
const LIMIT=128;
const sessionId=(v:unknown):v is string=>typeof v==='string'&&/^session_[a-f0-9]{64}$/.test(v);
const reply=(status:number,body:unknown)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hash=(token:string)=>createHash('sha256').update(token).digest('hex');

/** Separate, vorbereitende Transportfreigabe je RED-ID-Sitzung. Keine
 * Befehlsausführung; lokale Bestätigung bleibt zwingend. */
export function prepareRedBitTransportPermissions(db:DatabaseSync){
 db.exec("CREATE TABLE IF NOT EXISTS home_red_bit_transport_permission(owner TEXT NOT NULL,session_id TEXT PRIMARY KEY,expires INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS home_red_bit_transport_permission_owner ON home_red_bit_transport_permission(owner,expires); CREATE TRIGGER IF NOT EXISTS home_red_bit_transport_permission_cleanup AFTER DELETE ON home_red_session BEGIN DELETE FROM home_red_bit_transport_permission WHERE session_id=OLD.id; END;");
}
async function readInput(request:Request):Promise<Record<string,unknown>|null>{
 if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')return null;
 try{
  const bytes=await leseBegrenzt(request.body,1024);
  if(!bytes)return null;
  const value:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
 }catch{return null;}
}

export function createRedBitTransportPermissions(db:DatabaseSync,ablage:Ablage,clock=Date.now){
 return async(request:Request):Promise<Response>=>{
  const path=new URL(request.url).pathname;
  if(!(RED_BIT_TRANSPORT_ROUTES as readonly string[]).includes(path))return reply(404,{error:'not_found'});
  const check=path==='/red-bit/v1/transport-permission',list=path==='/home/red-bit/transport-grants';
  if(request.method!==(check||list?'GET':'POST'))return reply(405,{error:'method_not_allowed'});
  if(check){
   const m=/^Bearer (redat_[a-f0-9]{64})$/.exec(request.headers.get('authorization')??'');
   if(!m)return reply(401,{error:'unauthorized'});
   const now=clock();
   const session=db.prepare("SELECT s.id,s.owner,s.refresh_until FROM home_red_session s JOIN konten c ON c.id=s.owner WHERE s.access_digest=? AND s.app='red-bit' AND s.access_until>? AND s.refresh_until>? AND c.gesperrt=0").get(hash(m[1]!),now,now);
   if(!session||typeof session.id!=='string'||typeof session.owner!=='string')return reply(401,{error:'unauthorized'});
   const grant=db.prepare('SELECT expires FROM home_red_bit_transport_permission WHERE session_id=? AND owner=? AND expires>?').get(session.id,session.owner,now);
   if(!grant)return reply(403,{error:'grant_required'});
   return reply(200,{version:1,app:'red-bit',scope:SCOPE,expiresAt:Math.min(Number(grant.expires),Number(session.refresh_until)),remoteAvailable:false,localConfirmationRequired:true});
  }

  // Der bestehende RED ION Geräte-Login ist die einzige Owner-Autorisierung.
  // Ein RED-ID-App-Token ist keine Owner-Sitzung.
  const input=list?null:await readInput(request);
  if(!list&&(!input||Object.keys(input).length!==2||!sessionId(input.sessionId)||input.confirm!==true))return reply(400,{error:'invalid_request'});
  const who=await werFragt(ablage,{authorization:request.headers.get('authorization')??''});
  if(!who?.sitzung)return reply(401,{error:'unauthorized'});
  const owner=String(who.konto.id),now=clock();
  if(list){
   const rows=db.prepare("SELECT g.session_id,g.expires,s.refresh_until FROM home_red_bit_transport_permission g JOIN home_red_session s ON s.id=g.session_id AND s.owner=g.owner JOIN konten c ON c.id=s.owner WHERE g.owner=? AND g.expires>? AND s.refresh_until>? AND s.app='red-bit' AND c.gesperrt=0 ORDER BY g.session_id LIMIT ?").all(owner,now,now,LIMIT+1);
   return reply(200,{version:1,scope:SCOPE,grants:rows.slice(0,LIMIT).map(row=>({sessionId:row.session_id,expiresAt:Math.min(Number(row.expires),Number(row.refresh_until))})),truncated:rows.length>LIMIT,remoteAvailable:false,localConfirmationRequired:true});
  }
  const id=input!.sessionId as string;
  if(path==='/home/red-bit/transport-revoke'){
   db.prepare('DELETE FROM home_red_bit_transport_permission WHERE owner=? AND session_id=?').run(owner,id);
   return reply(200,{ok:true});
  }

  // Kein Client darf App, Owner, Laufzeit oder Scope vorgeben. Eine alte
  // Freigabe gilt nur bis zum früheren Ende von Sitzung und Freigabe.
  const session=db.prepare("SELECT s.refresh_until FROM home_red_session s JOIN konten c ON c.id=s.owner WHERE s.id=? AND s.owner=? AND s.app='red-bit' AND s.refresh_until>? AND c.gesperrt=0").get(id,owner,now);
  if(!session)return reply(404,{error:'not_found'});
  const expiresAt=Math.min(now+TTL,Number(session.refresh_until));
  db.prepare('DELETE FROM home_red_bit_transport_permission WHERE expires<=?').run(now);
  db.prepare('INSERT INTO home_red_bit_transport_permission(owner,session_id,expires) VALUES(?,?,?) ON CONFLICT(session_id) DO UPDATE SET expires=excluded.expires WHERE home_red_bit_transport_permission.owner=excluded.owner').run(owner,id,expiresAt);
  return reply(201,{version:1,sessionId:id,scope:SCOPE,expiresAt,remoteAvailable:false,localConfirmationRequired:true});
 };
}
