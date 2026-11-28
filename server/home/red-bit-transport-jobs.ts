import {createHash} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {Ablage} from '../typen.ts';
import {werFragt} from '../kern.ts';
import {leseBegrenzt} from '../sicherheit/eingaben.ts';

export const RED_BIT_TRANSPORT_JOB_ROUTES=['/home/red-bit/transport-request','/home/red-bit/transport-result','/red-bit/v1/transport-claim','/red-bit/v1/transport-authorize','/red-bit/v1/transport-complete'] as const;
const TTL=30_000, RETAIN=120_000;
const commands=['play','pause','next','previous'] as const;
const command=(v:unknown):v is typeof commands[number]=>typeof v==='string'&&(commands as readonly string[]).includes(v);
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{32}$/.test(v);
const sid=(v:unknown):v is string=>typeof v==='string'&&/^session_[a-f0-9]{64}$/.test(v);
const reply=(status:number,body:unknown)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));

export function prepareRedBitTransportJobs(db:DatabaseSync){
 db.exec(`CREATE TABLE IF NOT EXISTS home_red_bit_transport_job(owner TEXT NOT NULL,session_id TEXT NOT NULL,id TEXT NOT NULL,command TEXT NOT NULL CHECK(command IN ('play','pause','next','previous')),created INTEGER NOT NULL,expires INTEGER NOT NULL,state TEXT NOT NULL CHECK(state IN ('pending','claimed','authorized','completed','cancelled')),outcome TEXT CHECK(outcome IN ('executed','declined','failed')),PRIMARY KEY(owner,id));
 CREATE INDEX IF NOT EXISTS home_red_bit_transport_job_session ON home_red_bit_transport_job(session_id,created);
 CREATE TRIGGER IF NOT EXISTS home_red_bit_transport_job_revoke AFTER DELETE ON home_red_bit_transport_permission BEGIN UPDATE home_red_bit_transport_job SET state='cancelled',outcome=NULL WHERE session_id=OLD.session_id; END;
 CREATE TRIGGER IF NOT EXISTS home_red_bit_transport_job_renew AFTER UPDATE ON home_red_bit_transport_permission BEGIN UPDATE home_red_bit_transport_job SET state='cancelled',outcome=NULL WHERE session_id=OLD.session_id; END;`);
}
async function input(request:Request){
 if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')return null;
 try{const bytes=await leseBegrenzt(request.body,1024);if(!bytes)return null;
 const value:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));return object(value)?value:null;
 }catch{return null;}
}
function tx<T>(db:DatabaseSync,fn:()=>T):T{
 db.exec('BEGIN IMMEDIATE');try{const value=fn();db.exec('COMMIT');return value;}catch(error){db.exec('ROLLBACK');throw error;}
}

/** Server vermittelt nur. Der Client zeigt den konkreten Befehl an, bestätigt
 * lokal und holt einmalig die Autorisierung unmittelbar vor der Ausführung.
 * Nach unklarer Antwort keine automatische Wiederholung. */
export function createRedBitTransportJobs(db:DatabaseSync,ablage:Ablage,clock=Date.now){
 return async(request:Request):Promise<Response>=>{
  const path=new URL(request.url).pathname;
  if(!(RED_BIT_TRANSPORT_JOB_ROUTES as readonly string[]).includes(path))return reply(404,{error:'not_found'});
  if(request.method!=='POST')return reply(405,{error:'method_not_allowed'});
  const body=await input(request);if(!body)return reply(400,{error:'invalid_request'});
  const ownerRoute=path.startsWith('/home/');
  const who=ownerRoute?await werFragt(ablage,{authorization:request.headers.get('authorization')??''}):null;
  if(ownerRoute&&!who?.sitzung)return reply(401,{error:'unauthorized'});
  const token=/^Bearer (redat_[a-f0-9]{64})$/.exec(request.headers.get('authorization')??'');
  if(!ownerRoute&&!token)return reply(401,{error:'unauthorized'});
  return tx(db,()=>{
   const now=clock();let owner:string,session:string;
   if(ownerRoute){
    owner=String(who!.konto.id);if(!sid(body.sessionId))return reply(400,{error:'invalid_request'});session=body.sessionId;
   }else{
    const row=db.prepare("SELECT s.id,s.owner FROM home_red_session s JOIN konten c ON c.id=s.owner WHERE s.access_digest=? AND s.app='red-bit' AND s.access_until>? AND s.refresh_until>? AND c.gesperrt=0").get(hash(token![1]!),now,now);
    if(!row)return reply(401,{error:'unauthorized'});owner=String(row.owner);session=String(row.id);
   }
   const permission=db.prepare("SELECT g.expires,s.refresh_until FROM home_red_bit_transport_permission g JOIN home_red_session s ON s.id=g.session_id AND s.owner=g.owner JOIN konten c ON c.id=s.owner WHERE g.owner=? AND g.session_id=? AND g.expires>? AND s.refresh_until>? AND s.app='red-bit' AND c.gesperrt=0").get(owner,session,now,now);
   if(!permission)return reply(403,{error:'grant_required'});
   db.prepare("UPDATE home_red_bit_transport_job SET state='cancelled',outcome=NULL WHERE expires<=? AND state!='cancelled'").run(now);
   db.prepare('DELETE FROM home_red_bit_transport_job WHERE created<=?').run(now-RETAIN);
   if(path==='/home/red-bit/transport-request'){
    if(!exact(body,['sessionId','id','command','issuedAt','confirm'])||!id(body.id)||!command(body.command)||body.confirm!==true||typeof body.issuedAt!=='number'||!Number.isSafeInteger(body.issuedAt)||body.issuedAt>now||body.issuedAt<=now-15_000)return reply(400,{error:'invalid_request'});
    if(db.prepare('SELECT 1 FROM home_red_bit_transport_job WHERE owner=? AND id=?').get(owner,body.id))return reply(409,{error:'duplicate_request'});
    const count=Number(db.prepare('SELECT COUNT(*) AS n FROM home_red_bit_transport_job WHERE session_id=? AND created>?').get(session,now-60_000)?.n??0);
    if(count>=6)return reply(429,{error:'rate_limit'});
    if(db.prepare("SELECT 1 FROM home_red_bit_transport_job WHERE session_id=? AND expires>? AND state IN ('pending','claimed','authorized')").get(session,now))return reply(409,{error:'request_pending'});
    const expires=Math.min(body.issuedAt+TTL,Number(permission.expires),Number(permission.refresh_until));
    db.prepare("INSERT INTO home_red_bit_transport_job(owner,session_id,id,command,created,expires,state) VALUES(?,?,?,?,?,?,'pending')").run(owner,session,body.id,body.command,now,expires);
    return reply(201,{version:1,id:body.id,command:body.command,expiresAt:expires});
   }
   if(path==='/red-bit/v1/transport-claim'){
    if(!exact(body,['confirm'])||body.confirm!==true)return reply(400,{error:'invalid_request'});
    const job=db.prepare("SELECT id,command,expires FROM home_red_bit_transport_job WHERE owner=? AND session_id=? AND expires>? AND state='pending' ORDER BY created LIMIT 1").get(owner,session,now);
    if(!job)return reply(200,{version:1,job:null});
    db.prepare("UPDATE home_red_bit_transport_job SET state='claimed' WHERE owner=? AND id=? AND state='pending'").run(owner,job.id!);
    return reply(200,{version:1,job:{id:job.id,command:job.command,expiresAt:job.expires}});
   }
   if(!id(body.id))return reply(400,{error:'invalid_request'});
   if(path==='/red-bit/v1/transport-authorize'){
    if(!exact(body,['id','command','confirm'])||!command(body.command)||body.confirm!==true)return reply(400,{error:'invalid_request'});
    const row=db.prepare("SELECT expires FROM home_red_bit_transport_job WHERE owner=? AND session_id=? AND id=? AND command=? AND expires>? AND state='claimed'").get(owner,session,body.id,body.command,now);
    if(!row)return reply(409,{error:'not_claimed_or_expired'});
    const expires=Math.min(Number(row.expires),now+5000);
    db.prepare("UPDATE home_red_bit_transport_job SET state='authorized' WHERE owner=? AND id=?").run(owner,body.id);
    return reply(200,{version:1,id:body.id,command:body.command,expiresAt:expires});
   }
   if(path==='/red-bit/v1/transport-complete'){
    if(!exact(body,['id','outcome'])||(body.outcome!=='executed'&&body.outcome!=='failed'&&body.outcome!=='declined'))return reply(400,{error:'invalid_request'});
    const required=body.outcome==='declined'?'claimed':'authorized';
    const updated=db.prepare("UPDATE home_red_bit_transport_job SET state='completed',outcome=? WHERE owner=? AND session_id=? AND id=? AND expires>? AND state=?").run(body.outcome,owner,session,body.id,now,required);
    return updated.changes===1?reply(200,{ok:true}):reply(409,{error:'not_authorized_or_expired'});
   }
   if(!exact(body,['sessionId','id']))return reply(400,{error:'invalid_request'});
   const row=db.prepare("SELECT state,outcome FROM home_red_bit_transport_job WHERE owner=? AND session_id=? AND id=? AND expires>? AND state!='cancelled'").get(owner,session,body.id,now);
   if(!row)return reply(404,{error:'not_found'});
   return reply(200,{version:1,state:row.state,outcome:row.outcome});
  });
 };
}
