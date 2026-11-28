import {createHash} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {Ablage} from '../typen.ts';
import {werFragt} from '../kern.ts';
import {leseBegrenzt} from '../sicherheit/eingaben.ts';

export const RED_BIT_JOB_ROUTES=['/home/red-bit/read-request','/home/red-bit/read-result','/red-bit/v1/read-claim','/red-bit/v1/read-complete'] as const;
const TTL=45_000, RETAIN=120_000;
const id=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{32}$/.test(v);
const sid=(v:unknown):v is string=>typeof v==='string'&&/^session_[a-f0-9]{64}$/.test(v);
const reply=(status:number,body:unknown)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));

export function prepareRedBitReadJobs(db:DatabaseSync){
 db.exec("CREATE TABLE IF NOT EXISTS home_red_bit_read_job(owner TEXT NOT NULL, session_id TEXT NOT NULL, id TEXT NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL, state TEXT NOT NULL CHECK(state IN ('pending','claimed','completed')), result TEXT, PRIMARY KEY(owner,id)); CREATE INDEX IF NOT EXISTS home_red_bit_job_session ON home_red_bit_read_job(session_id,created); CREATE TRIGGER IF NOT EXISTS home_red_bit_job_revoke AFTER DELETE ON home_red_bit_permission BEGIN DELETE FROM home_red_bit_read_job WHERE session_id=OLD.session_id; END; CREATE TRIGGER IF NOT EXISTS home_red_bit_job_renew AFTER UPDATE ON home_red_bit_permission BEGIN DELETE FROM home_red_bit_read_job WHERE session_id=OLD.session_id; END;");
}
async function input(request:Request){
 if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')return null;
 try{const bytes=await leseBegrenzt(request.body,2048);if(!bytes)return null;
 const v:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));return object(v)?v:null;
 }catch{return null;}
}
function validStatus(v:unknown):v is Record<string,unknown>{
 if(!object(v))return false;
 const flags=['hasTrack','canNext','canPrevious','controlsLocked','hasPlaybackError'];
 const required=['version','state',...flags],optional=['positionSeconds','durationSeconds'];
 if(!required.every(k=>Object.hasOwn(v,k))||Object.keys(v).some(k=>!required.includes(k)&&!optional.includes(k)))return false;
 if(v.version!==1||!['stopped','buffering','playing','paused'].includes(String(v.state))||typeof v.state!=='string'||!flags.every(k=>typeof v[k]==='boolean'))return false;
 for(const k of optional)if(Object.hasOwn(v,k)&&!(typeof v[k]==='number'&&Number.isFinite(v[k])&&Number(v[k])>=0&&Number(v[k])<=86400000))return false;
 return true;
}
function tx<T>(db:DatabaseSync,fn:()=>T):T{
 db.exec('BEGIN IMMEDIATE');try{const v=fn();db.exec('COMMIT');return v;}catch(error){db.exec('ROLLBACK');throw error;}
}

/** Nur explizite Statusabfragen. Der Client muss separat lokal zustimmen;
 * es gibt keinen automatischen Ausführungspfad und keine Schreibwerkzeuge. */
export function createRedBitReadJobs(db:DatabaseSync,ablage:Ablage,clock=Date.now){
 return async(request:Request):Promise<Response>=>{
  const path=new URL(request.url).pathname;
  if(!(RED_BIT_JOB_ROUTES as readonly string[]).includes(path))return reply(404,{error:'not_found'});
  if(request.method!=='POST')return reply(405,{error:'method_not_allowed'});
  const body=await input(request);if(!body)return reply(400,{error:'invalid_request'});
  const ownerRoute=path.startsWith('/home/');
  const who=ownerRoute?await werFragt(ablage,{authorization:request.headers.get('authorization')??''}):null;
  if(ownerRoute&&!who?.sitzung)return reply(401,{error:'unauthorized'});
  const token=/^Bearer (redat_[a-f0-9]{64})$/.exec(request.headers.get('authorization')??'');
  if(!ownerRoute&&!token)return reply(401,{error:'unauthorized'});
  return tx(db,()=>{
   const now=clock();
   let owner:string,session:string;
   if(ownerRoute){
    owner=String(who!.konto.id);
    if(!sid(body.sessionId))return reply(400,{error:'invalid_request'});
    session=body.sessionId;
   }else{
    const row=db.prepare("SELECT s.id,s.owner FROM home_red_session s JOIN konten c ON c.id=s.owner WHERE s.access_digest=? AND s.app='red-bit' AND s.access_until>? AND s.refresh_until>? AND c.gesperrt=0").get(hash(token![1]!),now,now);
    if(!row)return reply(401,{error:'unauthorized'});
    owner=String(row.owner);session=String(row.id);
   }
   const permission=db.prepare("SELECT g.expires,s.refresh_until FROM home_red_bit_permission g JOIN home_red_session s ON s.id=g.session_id AND s.owner=g.owner JOIN konten c ON c.id=s.owner WHERE g.owner=? AND g.session_id=? AND g.expires>? AND s.refresh_until>? AND s.app='red-bit' AND c.gesperrt=0").get(owner,session,now,now);
   if(!permission)return reply(403,{error:'grant_required'});
   // Abgelaufene Ergebnisse werden sofort unlesbar; Tombstones begrenzen Replay.
   db.prepare('UPDATE home_red_bit_read_job SET result=NULL WHERE expires<=? AND result IS NOT NULL').run(now);
   db.prepare('DELETE FROM home_red_bit_read_job WHERE created<=?').run(now-RETAIN);
   if(path==='/home/red-bit/read-request'){
    if(!exact(body,['sessionId','id','issuedAt','confirm'])||!id(body.id)||body.confirm!==true||typeof body.issuedAt!=='number'||!Number.isSafeInteger(body.issuedAt)||body.issuedAt>now||body.issuedAt<=now-30_000)return reply(400,{error:'invalid_request'});
    if(db.prepare('SELECT 1 FROM home_red_bit_read_job WHERE owner=? AND id=?').get(owner,body.id))return reply(409,{error:'duplicate_request'});
    const count=Number(db.prepare('SELECT COUNT(*) AS n FROM home_red_bit_read_job WHERE session_id=? AND created>?').get(session,now-60_000)?.n??0);
    if(count>=10)return reply(429,{error:'rate_limit'});
    if(db.prepare("SELECT 1 FROM home_red_bit_read_job WHERE session_id=? AND expires>? AND state IN ('pending','claimed')").get(session,now))return reply(409,{error:'request_pending'});
    const expires=Math.min(body.issuedAt+TTL,Number(permission.expires),Number(permission.refresh_until));
    db.prepare("INSERT INTO home_red_bit_read_job(owner,session_id,id,created,expires,state) VALUES(?,?,?,?,?,'pending')").run(owner,session,body.id,now,expires);
    return reply(201,{version:1,id:body.id,tool:'redbit_read_status',expiresAt:expires});
   }
   if(path==='/red-bit/v1/read-claim'){
    if(!exact(body,['confirm'])||body.confirm!==true)return reply(400,{error:'invalid_request'});
    const job=db.prepare("SELECT id,expires FROM home_red_bit_read_job WHERE owner=? AND session_id=? AND expires>? AND state='pending' ORDER BY created LIMIT 1").get(owner,session,now);
    if(!job)return reply(200,{version:1,job:null});
    db.prepare("UPDATE home_red_bit_read_job SET state='claimed' WHERE owner=? AND id=? AND state='pending'").run(owner,job.id!);
    return reply(200,{version:1,job:{id:job.id,tool:'redbit_read_status',expiresAt:job.expires}});
   }
   if(!id(body.id))return reply(400,{error:'invalid_request'});
   if(path==='/red-bit/v1/read-complete'){
    if(!exact(body,['id','status'])||!validStatus(body.status))return reply(400,{error:'invalid_status'});
    const updated=db.prepare("UPDATE home_red_bit_read_job SET state='completed',result=? WHERE owner=? AND session_id=? AND id=? AND expires>? AND state='claimed'").run(JSON.stringify(body.status),owner,session,body.id,now);
    return updated.changes===1?reply(200,{ok:true}):reply(409,{error:'not_claimed_or_expired'});
   }
   if(!exact(body,['sessionId','id']))return reply(400,{error:'invalid_request'});
   const row=db.prepare('SELECT state,result FROM home_red_bit_read_job WHERE owner=? AND session_id=? AND id=? AND expires>?').get(owner,session,body.id,now);
   if(!row)return reply(404,{error:'not_found'});
   return reply(200,{version:1,state:row.state,status:row.state==='completed'?JSON.parse(String(row.result)):null});
  });
 };
}
