import {createHash} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {Ablage} from '../typen.ts';
import {werFragt} from '../kern.ts';
import {RED_APPS} from './red-id.ts';

export const SHARE_ROUTES=['/red-share/v1/grants','/red-share/v1/grant','/red-share/v1/revoke','/red-share/v1/send','/red-share/v1/inbox','/red-share/v1/ack'] as const;
const reply=(status:number,data:unknown)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const app=(v:unknown):v is string=>typeof v==='string'&&(RED_APPS as readonly string[]).includes(v);
const channel=(v:unknown):v is string=>typeof v==='string'&&/^[a-z][a-z0-9_-]{0,31}$/.test(v);
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
// AES-GCM envelope: 12-byte nonce, ciphertext, 16-byte tag. Shape only;
// the server cannot verify that the bytes are genuine ciphertext.
const validEnvelope=(v:unknown):v is string=>{if(typeof v!=='string'||!/^[A-Za-z0-9_-]{38,60000}$/.test(v))return false;const bytes=Buffer.from(v,'base64url');return bytes.length>=28&&bytes.toString('base64url')===v;};
async function read(req:Request):Promise<Record<string,unknown>|null>{
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')??'')||!req.body)return null;
 const r=req.body.getReader();let n=0,s='';const d=new TextDecoder();
 try{while(true){const v=await r.read();if(v.done)break;n+=v.value.byteLength;if(n>65536){await r.cancel();return null;}s+=d.decode(v.value,{stream:true});}s+=d.decode();const v=JSON.parse(s);return v&&typeof v==='object'&&!Array.isArray(v)?v:null;}
 catch{return null;}finally{r.releaseLock();}
}
export function prepareRedShare(db:DatabaseSync){
 db.exec("CREATE TABLE IF NOT EXISTS home_red_share_grant(owner TEXT NOT NULL,source TEXT NOT NULL,target TEXT NOT NULL,channel TEXT NOT NULL,expires INTEGER NOT NULL,PRIMARY KEY(owner,source,target,channel)); CREATE TABLE IF NOT EXISTS home_red_share_message(owner TEXT NOT NULL,source TEXT NOT NULL,target TEXT NOT NULL,channel TEXT NOT NULL,id TEXT NOT NULL,envelope TEXT NOT NULL,expires INTEGER NOT NULL,PRIMARY KEY(owner,source,target,channel,id)); CREATE INDEX IF NOT EXISTS home_red_share_inbox ON home_red_share_message(owner,target,expires); CREATE TABLE IF NOT EXISTS home_red_share_receipt(owner TEXT NOT NULL,source TEXT NOT NULL,target TEXT NOT NULL,channel TEXT NOT NULL,id TEXT NOT NULL,digest TEXT NOT NULL,expires INTEGER NOT NULL,PRIMARY KEY(owner,source,target,channel,id)); CREATE INDEX IF NOT EXISTS home_red_share_receipt_expiry ON home_red_share_receipt(expires);");
}
function tx<T>(db:DatabaseSync,f:()=>T):T{db.exec('BEGIN IMMEDIATE');try{const v=f();db.exec('COMMIT');return v;}catch(e){db.exec('ROLLBACK');throw e;}}
function prune(db:DatabaseSync,now:number){
 db.prepare('DELETE FROM home_red_share_receipt WHERE expires<=?').run(now);
 db.prepare('DELETE FROM home_red_share_message WHERE expires<=? OR NOT EXISTS (SELECT 1 FROM home_red_share_grant g WHERE g.owner=home_red_share_message.owner AND g.source=home_red_share_message.source AND g.target=home_red_share_message.target AND g.channel=home_red_share_message.channel AND g.expires>?)').run(now,now);
 db.prepare('DELETE FROM home_red_share_grant WHERE expires<=?').run(now);
}
export function revokeRedShare(db:DatabaseSync,owner:string,appId:string){
 db.prepare('DELETE FROM home_red_share_message WHERE owner=? AND (source=? OR target=?)').run(owner,appId,appId);
 db.prepare('DELETE FROM home_red_share_grant WHERE owner=? AND (source=? OR target=?)').run(owner,appId,appId);
}
export function createRedShare(db:DatabaseSync,ablage:Ablage){
 return async(req:Request):Promise<Response>=>{
 const path=new URL(req.url).pathname;
 if(!(SHARE_ROUTES as readonly string[]).includes(path))return reply(404,{error:'not_found'});
 const get=path.endsWith('/grants')||path.endsWith('/inbox');
 if(req.method!==(get?'GET':'POST'))return reply(405,{error:'method_not_allowed'});
 const b=get?null:await read(req),now=Date.now();
 if(!get&&!b)return reply(400,{error:'invalid_request'});
 if(path.endsWith('/grant')||path.endsWith('/revoke')||path.endsWith('/grants')){
  const who=await werFragt(ablage,{authorization:req.headers.get('authorization')??''});
  if(!who?.sitzung)return reply(401,{error:'unauthorized'});
  const owner=String(who.konto.id);
  if(get)return reply(200,{version:1,grants:db.prepare('SELECT source,target,channel,expires FROM home_red_share_grant WHERE owner=? AND expires>? ORDER BY source,target,channel').all(owner,now)});
  if(!b||!app(b.source)||!app(b.target)||b.source===b.target||!channel(b.channel))return reply(400,{error:'invalid_grant'});
  const {source,target,channel:kind}=b;
  return tx(db,()=>{
   prune(db,now);
   if(path.endsWith('/revoke')){
    db.prepare('DELETE FROM home_red_share_message WHERE owner=? AND source=? AND target=? AND channel=?').run(owner,source,target,kind);
    db.prepare('DELETE FROM home_red_share_grant WHERE owner=? AND source=? AND target=? AND channel=?').run(owner,source,target,kind);
    return reply(200,{ok:true});
   }
   const existing=db.prepare('SELECT expires FROM home_red_share_grant WHERE owner=? AND source=? AND target=? AND channel=?').get(owner,source,target,kind);
   if(!existing&&Number(db.prepare('SELECT COUNT(*) AS n FROM home_red_share_grant WHERE owner=?').get(owner)?.n??0)>=64)return reply(429,{error:'grant_limit'});
   const expires=now+7*86400000;
   db.prepare('INSERT INTO home_red_share_grant VALUES(?,?,?,?,?) ON CONFLICT(owner,source,target,channel) DO UPDATE SET expires=excluded.expires').run(owner,source,target,kind,expires);
   return reply(201,{source,target,channel:kind,expires});
  });
 }
 const auth=/^Bearer (redat_[a-f0-9]{64})$/.exec(req.headers.get('authorization')??'');
 if(!auth)return reply(401,{error:'unauthorized'});
 const s=db.prepare('SELECT s.owner,s.app FROM home_red_session s JOIN konten c ON c.id=s.owner WHERE s.access_digest=? AND s.access_until>? AND s.refresh_until>? AND c.gesperrt=0').get(hash(auth[1]!),now,now);
 if(!s||typeof s.owner!=='string'||!app(s.app))return reply(401,{error:'unauthorized'});
 const owner=s.owner,client=s.app;
 if(get){const rows=db.prepare('SELECT m.source,m.channel,m.id,m.envelope,m.expires FROM home_red_share_message m JOIN home_red_share_grant g ON g.owner=m.owner AND g.source=m.source AND g.target=m.target AND g.channel=m.channel WHERE m.owner=? AND m.target=? AND m.expires>? AND g.expires>? ORDER BY m.expires,m.id LIMIT 32').all(owner,client,now,now);
  const messages:typeof rows=[];
  for(const row of rows){if(Buffer.byteLength(JSON.stringify({version:1,messages:[...messages,row]}))>65536)break;messages.push(row);}
  return reply(200,{version:1,messages});
 }
 if(!b||!channel(b.channel)||typeof b.id!=='string'||!/^[a-f0-9]{32}$/.test(b.id))return reply(400,{error:'invalid_message'});
 const kind=b.channel,messageId=b.id;
 if(path.endsWith('/ack')){
  if(!app(b.source))return reply(400,{error:'invalid_message'});
  const source=b.source;
  return tx(db,()=>{
   prune(db,now);
   const message=db.prepare('SELECT envelope FROM home_red_share_message WHERE owner=? AND source=? AND target=? AND channel=? AND id=?').get(owner,source,client,kind,messageId);
   if(!message||typeof message.envelope!=='string')return reply(200,{ok:true});
   if(Number(db.prepare('SELECT COUNT(*) AS n FROM home_red_share_receipt WHERE owner=?').get(owner)?.n??0)>=1024)return reply(429,{error:'receipt_limit'});
   db.prepare('INSERT INTO home_red_share_receipt VALUES(?,?,?,?,?,?,?)').run(owner,source,client,kind,messageId,hash(message.envelope),now+7*86400000);
   db.prepare('DELETE FROM home_red_share_message WHERE owner=? AND source=? AND target=? AND channel=? AND id=?').run(owner,source,client,kind,messageId);
   return reply(200,{ok:true});
  });
 }
 if(!app(b.target)||b.target===client||!validEnvelope(b.envelope))return reply(400,{error:'invalid_message'});
 const target=b.target,envelope=b.envelope;
 return tx(db,()=>{
  prune(db,now);
  const grant=db.prepare('SELECT expires FROM home_red_share_grant WHERE owner=? AND source=? AND target=? AND channel=? AND expires>?').get(owner,client,target,kind,now);
  if(!grant||typeof grant.expires!=='number')return reply(403,{error:'grant_required'});
  const receipt=db.prepare('SELECT digest FROM home_red_share_receipt WHERE owner=? AND source=? AND target=? AND channel=? AND id=? AND expires>?').get(owner,client,target,kind,messageId,now);
  if(receipt){const same=receipt.digest===hash(envelope);return reply(same?200:409,{ok:same});}
  const previous=db.prepare('SELECT envelope FROM home_red_share_message WHERE owner=? AND source=? AND target=? AND channel=? AND id=?').get(owner,client,target,kind,messageId);
  if(previous)return reply(previous.envelope===envelope?200:409,{ok:previous.envelope===envelope});
  if(Number(db.prepare('SELECT COUNT(*) AS n FROM home_red_share_message WHERE owner=?').get(owner)?.n??0)>=128)return reply(429,{error:'queue_limit'});
  db.prepare('INSERT INTO home_red_share_message VALUES(?,?,?,?,?,?,?)').run(owner,client,target,kind,messageId,envelope,Math.min(grant.expires,now+86400000));
  return reply(201,{ok:true});
 });
 };
}
