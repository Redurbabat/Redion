import {createHash} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {Ablage} from '../typen.ts';
import {werFragt} from '../kern.ts';
import {RED_APPS} from './red-id.ts';
import {prepareRedStoreChanges,readRedStoreChanges} from './red-store-changes.ts';

export const STORE_ROUTES=['/red-store/v1/grants','/red-store/v1/grant','/red-store/v1/revoke','/red-store/v1/list','/red-store/v1/get','/red-store/v1/put','/red-store/v1/delete','/red-store/v1/changes'] as const;
const reply=(status:number,data:unknown)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
const app=(v:unknown):v is string=>typeof v==='string'&&(RED_APPS as readonly string[]).includes(v);
const kind=(v:unknown):v is 'sync'|'file'=>v==='sync'||v==='file';
const identifier=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{32}$/.test(v);
const revision=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0&&Number(v)<Number.MAX_SAFE_INTEGER;
const envelope=(v:unknown):v is string=>{
 if(typeof v!=='string'||!/^[A-Za-z0-9_-]{38,60000}$/.test(v))return false;
 const b=Buffer.from(v,'base64url');return b.length>=28&&b.toString('base64url')===v;
};
const MAX_RECORDS=1024,MAX_BYTES=16*1024*1024;
async function body(req:Request):Promise<Record<string,unknown>|null>{
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')??'')||!req.body||Number(req.headers.get('content-length')??0)>65536)return null;
 const reader=req.body.getReader();let size=0;const decoder=new TextDecoder('utf-8',{fatal:true});let text='';
 try{while(true){const v=await reader.read();if(v.done)break;size+=v.value.byteLength;if(size>65536){await reader.cancel();return null;}text+=decoder.decode(v.value,{stream:true});}const result=JSON.parse(text+decoder.decode());return result&&typeof result==='object'&&!Array.isArray(result)?result:null;}
 catch{return null;}finally{reader.releaseLock();}
}
export function prepareRedStore(db:DatabaseSync){
 db.exec('CREATE TABLE IF NOT EXISTS home_red_store_grant(owner TEXT NOT NULL,app TEXT NOT NULL,kind TEXT NOT NULL,expires INTEGER NOT NULL,PRIMARY KEY(owner,app,kind)); CREATE TABLE IF NOT EXISTS home_red_store_record(owner TEXT NOT NULL,app TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,revision INTEGER NOT NULL,deleted INTEGER NOT NULL,envelope TEXT NOT NULL,operation TEXT NOT NULL,digest TEXT NOT NULL,updated INTEGER NOT NULL,PRIMARY KEY(owner,app,kind,id));');
 prepareRedStoreChanges(db);
}
export function revokeRedStore(db:DatabaseSync,owner:string,appId:string){
 db.prepare('DELETE FROM home_red_store_grant WHERE owner=? AND app=?').run(owner,appId);
}
function tx<T>(db:DatabaseSync,fn:()=>T):T{db.exec('BEGIN IMMEDIATE');try{const value=fn();db.exec('COMMIT');return value;}catch(e){db.exec('ROLLBACK');throw e;}}
export function redStoreInventory(db:DatabaseSync,owner:string){
 return RED_APPS.map(appId=>{
  const grants=db.prepare('SELECT kind,expires FROM home_red_store_grant WHERE owner=? AND app=? AND expires>? ORDER BY kind').all(owner,appId,Date.now());
  const usage=db.prepare('SELECT kind,COUNT(*) AS records,COALESCE(SUM(length(envelope)),0) AS encodedBytes,SUM(deleted) AS tombstones FROM home_red_store_record WHERE owner=? AND app=? GROUP BY kind ORDER BY kind').all(owner,appId);
  return {app:appId,grants,usage};
 });
}
/** Per-owner, per-app encrypted objects. No automatic cross-app access;
 * device-session grants are separate from identity and Share scopes. */
export function createRedStore(db:DatabaseSync,ablage:Ablage){
 return async(req:Request):Promise<Response>=>{
  const path=new URL(req.url).pathname,action=path.split('/').at(-1);
  if(!(STORE_ROUTES as readonly string[]).includes(path))return reply(404,{error:'not_found'});
  if(req.method!==(action==='grants'?'GET':'POST'))return reply(405,{error:'method_not_allowed'});
  const input=action==='grants'?null:await body(req);
  if(action!=='grants'&&!input)return reply(400,{error:'invalid_request'});
  const now=Date.now();
  if(action==='grants'||action==='grant'||action==='revoke'){
   const who=await werFragt(ablage,{authorization:req.headers.get('authorization')??''});
   if(!who?.sitzung)return reply(401,{error:'unauthorized'});
   const owner=String(who.konto.id);
   if(action==='grants')return reply(200,{version:1,apps:redStoreInventory(db,owner)});
   if(!input||!app(input.app)||!kind(input.kind))return reply(400,{error:'invalid_grant'});
   if(action==='revoke'){
    db.prepare('DELETE FROM home_red_store_grant WHERE owner=? AND app=? AND kind=?').run(owner,input.app,input.kind);
    return reply(200,{ok:true});
   }
   const expires=now+7*86400000;
   db.prepare('INSERT INTO home_red_store_grant VALUES(?,?,?,?) ON CONFLICT(owner,app,kind) DO UPDATE SET expires=excluded.expires').run(owner,input.app,input.kind,expires);
   return reply(201,{app:input.app,kind:input.kind,expires});
  }
  const token=/^Bearer (redat_[a-f0-9]{64})$/.exec(req.headers.get('authorization')??'');
  if(!token)return reply(401,{error:'unauthorized'});
  const auth=db.prepare('SELECT s.owner,s.app FROM home_red_session s JOIN konten c ON c.id=s.owner WHERE s.access_digest=? AND s.access_until>? AND s.refresh_until>? AND c.gesperrt=0').get(hash(token[1]!),now,now);
  if(!auth||typeof auth.owner!=='string'||!app(auth.app))return reply(401,{error:'unauthorized'});
  if(!input||!kind(input.kind))return reply(400,{error:'invalid_kind'});
  const owner=auth.owner,client=auth.app,type=input.kind;
  // Ignore no supplied owner or app override; reject unexpected fields.
  const fields=action==='changes'?['kind','cursor']:action==='list'?['kind','after']:action==='get'?['kind','id']:action==='put'?['kind','id','expectedRevision','operationId','envelope']:['kind','id','expectedRevision','operationId'];
  if(Object.keys(input).some(k=>!fields.includes(k)))return reply(400,{error:'unexpected_field'});
  if(!db.prepare('SELECT 1 FROM home_red_store_grant WHERE owner=? AND app=? AND kind=? AND expires>?').get(owner,client,type,now))return reply(403,{error:'grant_required'});
  if(action==='changes'){
   const cursor=input.cursor??null;
   if(cursor!==null&&(typeof cursor!=='string'||!/^[a-f0-9]{64}$/.test(cursor)))return reply(400,{error:'invalid_cursor'});
   return reply(200,readRedStoreChanges(db,owner,client,type,cursor));
  }
  if(action==='list'){
   const after=input.after??'';if(after!==''&&!identifier(after))return reply(400,{error:'invalid_cursor'});
   const rows=db.prepare('SELECT id,revision,deleted,updated,length(envelope) AS encodedBytes FROM home_red_store_record WHERE owner=? AND app=? AND kind=? AND id>? ORDER BY id LIMIT 65').all(owner,client,type,after);
   const items=rows.slice(0,64);return reply(200,{version:1,items,next:rows.length>64?items.at(-1)?.id:null});
  }
  if(!identifier(input.id))return reply(400,{error:'invalid_id'});
  const recordId=input.id;
  if(action==='get'){
   const row=db.prepare('SELECT id,revision,deleted,envelope,updated FROM home_red_store_record WHERE owner=? AND app=? AND kind=? AND id=?').get(owner,client,type,recordId);
   return row?reply(200,{version:1,...row}):reply(404,{error:'not_found'});
  }
  if(!revision(input.expectedRevision)||!identifier(input.operationId)||action==='put'&&!envelope(input.envelope))return reply(400,{error:'invalid_operation'});
  const expected=input.expectedRevision,operation=input.operationId,deleted=action==='delete'?1:0,value=deleted?'':String(input.envelope),digest=hash(JSON.stringify([expected,deleted,value]));
  return tx(db,()=>{
   const old=db.prepare('SELECT revision,deleted,operation,digest,length(envelope) AS bytes FROM home_red_store_record WHERE owner=? AND app=? AND kind=? AND id=?').get(owner,client,type,recordId);
   const current=Number(old?.revision??0);
   if(old?.operation===operation)return old.digest===digest?reply(200,{version:1,id:recordId,revision:current,deleted:Number(old.deleted)}):reply(409,{error:'operation_conflict'});
   if(current!==expected||old?.deleted===1)return reply(409,{error:'revision_conflict',revision:current,deleted:Number(old?.deleted??0)});
   if(deleted&&!old)return reply(404,{error:'not_found'});
   const totals=db.prepare('SELECT COUNT(*) AS n,COALESCE(SUM(length(envelope)),0) AS bytes FROM home_red_store_record WHERE owner=?').get(owner);
   if(!old&&Number(totals?.n??0)>=MAX_RECORDS||Number(totals?.bytes??0)-Number(old?.bytes??0)+value.length>MAX_BYTES)return reply(429,{error:'pilot_capacity'});
   db.prepare('INSERT INTO home_red_store_record VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner,app,kind,id) DO UPDATE SET revision=excluded.revision,deleted=excluded.deleted,envelope=excluded.envelope,operation=excluded.operation,digest=excluded.digest,updated=excluded.updated').run(owner,client,type,recordId,current+1,deleted,value,operation,digest,now);
   return reply(old?200:201,{version:1,id:recordId,revision:current+1,deleted});
  });
 };
}
