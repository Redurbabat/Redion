import type {DatabaseSync} from 'node:sqlite';
import type {Ablage} from '../typen.ts';
import {werFragt} from '../kern.ts';
import {advanceRedReminders} from './reminder-scheduler.ts';
export const REMINDER_ROUTES=['/home/reminders/list','/home/reminders/create','/home/reminders/poll','/home/reminders/ack','/home/reminders/cancel'] as const;
const DAY=86400000;
const MAX_RULES=64;
const kinds=['backup-review','grant-review','storage-review','update-review'] as const;
const periods={once:0,daily:DAY,weekly:7*DAY} as const;
const idValid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{32}$/.test(v);
const integer=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const reply=(status:number,data:unknown)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
async function read(req:Request):Promise<Record<string,unknown>|null>{
 if(!req.body||!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')??'')||Number(req.headers.get('content-length')??0)>4096)return null;
 const r=req.body.getReader(),d=new TextDecoder('utf-8',{fatal:true});let n=0,s='';
 try{while(true){const v=await r.read();if(v.done)break;n+=v.value.byteLength;if(n>4096){await r.cancel();return null;}s+=d.decode(v.value,{stream:true});}const v=JSON.parse(s+d.decode());return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}
 catch{return null;}finally{r.releaseLock();}
}
export function prepareRedReminders(db:DatabaseSync){
 db.exec('CREATE TABLE IF NOT EXISTS home_red_reminder(owner TEXT NOT NULL,id TEXT NOT NULL,kind TEXT NOT NULL,period TEXT NOT NULL,first_due INTEGER NOT NULL,next_due INTEGER,pending_due INTEGER,last_ack INTEGER,PRIMARY KEY(owner,id)); CREATE INDEX IF NOT EXISTS home_red_reminder_due ON home_red_reminder(next_due,owner,id);');
}
function transaction<T>(db:DatabaseSync,fn:()=>T):T{db.exec('BEGIN IMMEDIATE');try{const v=fn();db.exec('COMMIT');return v;}catch(e){db.exec('ROLLBACK');throw e;}}
/** Owner-only maintenance reminders. Poll advances time rules, never runs
 * commands, opens other apps, sends network requests or touches backups.
 * One pending notification per rule; missed periods are coalesced. */
export function createRedReminders(db:DatabaseSync,ablage:Ablage,clock=Date.now){
 const inventory=(owner:string)=>db.prepare('SELECT id,kind,period,first_due AS firstDue,next_due AS nextDue,pending_due AS pendingDue,last_ack AS lastAck FROM home_red_reminder WHERE owner=? ORDER BY first_due,id').all(owner);
 return async(req:Request):Promise<Response>=>{
  const path=new URL(req.url).pathname,action=path.split('/').at(-1);
  if(!(REMINDER_ROUTES as readonly string[]).includes(path))return reply(404,{error:'not_found'});
  if(req.method!==(action==='list'?'GET':'POST'))return reply(405,{error:'method_not_allowed'});
  const input=action==='list'?null:await read(req);
  if(action!=='list'&&!input)return reply(400,{error:'invalid_request'});
  const who=await werFragt(ablage,{authorization:req.headers.get('authorization')??''});
  if(!who?.sitzung)return reply(401,{error:'unauthorized'});
  const owner=String(who.konto.id),now=clock();
  if(action==='list')return reply(200,{version:1,asOf:now,rules:inventory(owner)});
  if(!input)return reply(400,{error:'invalid_request'});
  if(action==='poll'){
   if(!exact(input,[]))return reply(400,{error:'invalid_poll'});
   advanceRedReminders(db,now,owner);
   return reply(200,{version:1,asOf:now,rules:inventory(owner)});
  }
  if(!idValid(input.id))return reply(400,{error:'invalid_id'});
  const id=input.id;
  if(action==='create'){
   if(!exact(input,['id','kind','period','firstDue'])||typeof input.kind!=='string'||!(kinds as readonly string[]).includes(input.kind)||typeof input.period!=='string'||!Object.hasOwn(periods,input.period)||!integer(input.firstDue))return reply(400,{error:'invalid_rule'});
   const kind=input.kind,period=input.period,first=input.firstDue;
   return transaction(db,()=>{
    const previous=db.prepare('SELECT kind,period,first_due FROM home_red_reminder WHERE owner=? AND id=?').get(owner,id);
    if(previous)return previous.kind===kind&&previous.period===period&&previous.first_due===first?reply(200,{version:1,id}):reply(409,{error:'rule_conflict'});
    if(first<now-DAY||first>now+366*DAY)return reply(400,{error:'invalid_due'});
    const count=Number(db.prepare('SELECT COUNT(*) AS n FROM home_red_reminder WHERE owner=?').get(owner)?.n??0);
    if(count>=MAX_RULES)return reply(429,{error:'rule_limit'});
    db.prepare('INSERT INTO home_red_reminder VALUES(?,?,?,?,?,?,NULL,NULL)').run(owner,id,kind,period,first,first);
    return reply(201,{version:1,id});
   });
  }
  if(action==='cancel'){
   if(!exact(input,['id']))return reply(400,{error:'invalid_cancel'});
   db.prepare('DELETE FROM home_red_reminder WHERE owner=? AND id=?').run(owner,id);
   return reply(200,{ok:true});
  }
  if(!exact(input,['id','due'])||!integer(input.due))return reply(400,{error:'invalid_ack'});
  const due=input.due;
  return transaction(db,()=>{
   const row=db.prepare('SELECT pending_due,last_ack FROM home_red_reminder WHERE owner=? AND id=?').get(owner,id);
   if(!row)return reply(404,{error:'not_found'});
   if(row.last_ack===due)return reply(200,{ok:true});
   if(row.pending_due!==due)return reply(409,{error:'occurrence_conflict'});
   db.prepare('UPDATE home_red_reminder SET pending_due=NULL,last_ack=? WHERE owner=? AND id=?').run(due,owner,id);
   return reply(200,{ok:true});
  });
 };
}
