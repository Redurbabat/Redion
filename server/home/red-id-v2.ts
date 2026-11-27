import {createHash,randomBytes} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {Ablage} from '../typen.ts';
import {werFragt} from '../kern.ts';
import {RED_APPS} from './red-id.ts';

const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
const proof=(v:string)=>createHash('sha256').update(v).digest('base64url');
const secret=(prefix:string)=>prefix+randomBytes(32).toString('hex');
const appValid=(v:unknown):v is string=>typeof v==='string'&&(RED_APPS as readonly string[]).includes(v);
const is=(v:unknown,re:RegExp):v is string=>typeof v==='string'&&re.test(v);
const reply=(status:number,data:unknown)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const ACCESS=15*60*1000,REFRESH=30*86400000,PAIR=5*60*1000;
export const RED_ID_V2_ROUTES=['/red-id/v2/pair','/red-id/v2/exchange','/red-id/v2/refresh','/red-id/v2/me','/red-id/v2/logout','/red-id/v2/revoke'] as const;
export function prepareRedIdV2(db:DatabaseSync){
  db.exec(`CREATE TABLE IF NOT EXISTS home_red_pair (digest TEXT PRIMARY KEY, owner TEXT NOT NULL, app TEXT NOT NULL, challenge TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS home_red_session (id TEXT PRIMARY KEY, owner TEXT NOT NULL, app TEXT NOT NULL, access_digest TEXT UNIQUE NOT NULL, refresh_digest TEXT UNIQUE NOT NULL, access_until INTEGER NOT NULL, refresh_until INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS home_red_session_owner ON home_red_session(owner,app);
CREATE INDEX IF NOT EXISTS home_red_pair_owner ON home_red_pair(owner,app);`);
}
async function body(request:Request):Promise<Record<string,unknown>|null>{
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??''))return null;
  if(Number(request.headers.get('content-length')??0)>4096||!request.body)return null;
  const reader=request.body.getReader();let size=0;const decoder=new TextDecoder();let value='';
  try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>4096){await reader.cancel();return null;}value+=decoder.decode(next.value,{stream:true});}value+=decoder.decode();const parsed=JSON.parse(value);return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:null;}
  catch{return null;}finally{reader.releaseLock();}
}
function transaction<T>(db:DatabaseSync,run:()=>T):T{db.exec('BEGIN IMMEDIATE');try{const v=run();db.exec('COMMIT');return v;}catch(e){db.exec('ROLLBACK');throw e;}}
function credentials(now:number,limit=now+REFRESH){
  const accessToken=secret('redat_'),refreshToken=secret('redrt_'),accessUntil=Math.min(now+ACCESS,limit),refreshUntil=limit;
  return {accessToken,refreshToken,accessUntil,refreshUntil,accessDigest:hash(accessToken),refreshDigest:hash(refreshToken)};
}
type Cred=ReturnType<typeof credentials>;
const responseTokens=(app:string,c:Cred)=>({version:2,app,accessToken:c.accessToken,refreshToken:c.refreshToken,expiresAt:new Date(c.accessUntil).toISOString(),refreshExpiresAt:new Date(c.refreshUntil).toISOString(),scopes:['identity:read']});
export function createRedIdV2(db:DatabaseSync,ablage:Ablage){
  return async(request:Request):Promise<Response>=>{
    const path=new URL(request.url).pathname;
    if(!(RED_ID_V2_ROUTES as readonly string[]).includes(path))return reply(404,{error:'not_found'});
    if(request.method!==(path.endsWith('/me')?'GET':'POST'))return reply(405,{error:'method_not_allowed'});
    const now=Date.now();
    if(path.endsWith('/me')||path.endsWith('/logout')){
      const m=/^Bearer (redat_[a-f0-9]{64})$/.exec(request.headers.get('authorization')??'');
      if(!m)return reply(401,{error:'unauthorized'});
      const row=db.prepare('SELECT s.id AS sessionId,s.owner,s.app,s.access_until,c.name FROM home_red_session s JOIN konten c ON c.id=s.owner WHERE s.access_digest=? AND s.access_until>? AND s.refresh_until>? AND c.gesperrt=0').get(hash(m[1]!),now,now);
      if(!row||typeof row.owner!=='string'||typeof row.sessionId!=='string'||typeof row.app!=='string'||typeof row.access_until!=='number')return reply(401,{error:'unauthorized'});
      if(path.endsWith('/logout')){db.prepare('DELETE FROM home_red_session WHERE id=?').run(row.sessionId);return reply(200,{ok:true});}
      return reply(200,{version:2,id:row.owner,name:String(row.name??''),app:row.app,scopes:['identity:read'],expiresAt:new Date(row.access_until).toISOString()});
    }
    if(path.endsWith('/pair')||path.endsWith('/revoke')){
      const who=await werFragt(ablage,{authorization:request.headers.get('authorization')??''});
      if(!who?.sitzung)return reply(401,{error:'unauthorized'});
      const owner=String(who.konto.id),input=await body(request);
      if(!input||!appValid(input.app))return reply(400,{error:'invalid_request'});
      const app=input.app;
      if(path.endsWith('/revoke')){
        const revoked=transaction(db,()=>{
          const a=db.prepare('DELETE FROM home_red_session WHERE owner=? AND app=?').run(owner,app);
          const b=db.prepare('DELETE FROM home_red_id WHERE owner=? AND app=?').run(owner,app);
          db.prepare('DELETE FROM home_red_pair WHERE owner=? AND app=?').run(owner,app);
          return Number(a.changes)+Number(b.changes);
        });return reply(200,{revoked});
      }
      if(!is(input.challenge,/^[A-Za-z0-9_-]{43}$/))return reply(400,{error:'invalid_challenge'});
      const challenge=input.challenge,code=secret('redpair_');
      transaction(db,()=>{
        db.prepare('DELETE FROM home_red_pair WHERE expires<=? OR (owner=? AND app=?)').run(now,owner,app);
        db.prepare('INSERT INTO home_red_pair(digest,owner,app,challenge,expires) VALUES(?,?,?,?,?)').run(hash(code),owner,app,challenge,now+PAIR);
      });
      return reply(201,{version:2,app,code,expiresAt:new Date(now+PAIR).toISOString()});
    }
    const input=await body(request);
    if(!input||!appValid(input.app))return reply(400,{error:'invalid_request'});
    const app=input.app;
    if(path.endsWith('/exchange')){
      if(!is(input.code,/^redpair_[a-f0-9]{64}$/)||!is(input.verifier,/^[A-Za-z0-9._~-]{43,128}$/))return reply(400,{error:'invalid_request'});
      const digest=hash(input.code),challenge=proof(input.verifier);
      return transaction(db,()=>{
        const row=db.prepare('SELECT p.owner FROM home_red_pair p JOIN konten c ON c.id=p.owner WHERE p.digest=? AND p.app=? AND p.challenge=? AND p.expires>? AND c.gesperrt=0').get(digest,app,challenge,now);
        if(!row||typeof row.owner!=='string')return reply(401,{error:'invalid_pairing'});
        db.prepare('DELETE FROM home_red_pair WHERE digest=?').run(digest);
        db.prepare('DELETE FROM home_red_session WHERE refresh_until<=?').run(now);
        const c=credentials(now);
        db.prepare('INSERT INTO home_red_session VALUES(?,?,?,?,?,?,?)').run(secret('session_'),row.owner,app,c.accessDigest,c.refreshDigest,c.accessUntil,c.refreshUntil);
        return reply(200,responseTokens(app,c));
      });
    }
    if(!is(input.refreshToken,/^redrt_[a-f0-9]{64}$/))return reply(400,{error:'invalid_request'});
    const digest=hash(input.refreshToken);
    return transaction(db,()=>{
      const row=db.prepare('SELECT s.id,s.refresh_until FROM home_red_session s JOIN konten c ON c.id=s.owner WHERE s.refresh_digest=? AND s.app=? AND s.refresh_until>? AND c.gesperrt=0').get(digest,app,now);
      if(!row||typeof row.id!=='string'||typeof row.refresh_until!=='number')return reply(401,{error:'invalid_refresh'});
      // Rotation is atomic; the previous access and refresh credentials stop working immediately.
      const c=credentials(now,row.refresh_until);
      db.prepare('UPDATE home_red_session SET access_digest=?,refresh_digest=?,access_until=? WHERE id=?').run(c.accessDigest,c.refreshDigest,c.accessUntil,row.id);
      return reply(200,responseTokens(app,c));
    });
  };
}
