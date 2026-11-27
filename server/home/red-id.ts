import {createHash,randomBytes} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';

export const RED_APPS=['red-ion','red-fit','red-poly','red-bit','red-loop','red-efz','red-kurd','red-uhr','red-yt','stran','babat-red'] as const;
type RedApp=typeof RED_APPS[number];
const validApp=(app:string):app is RedApp=>(RED_APPS as readonly string[]).includes(app);
const hash=(token:string)=>createHash('sha256').update(token).digest('hex');
const reply=(status:number,data:Record<string,unknown>)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function prepareRedId(db:DatabaseSync){
  db.exec("CREATE TABLE IF NOT EXISTS home_red_id(digest TEXT PRIMARY KEY, app TEXT NOT NULL, owner TEXT NOT NULL, expires INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS home_red_id_owner ON home_red_id(owner,app);");
}
/** Explicit operator action; identity-only tokens never authorize RED ION documents. */
export function issueRedId(db:DatabaseSync,app:string):{token:string;expiresAt:string}{
  if(!validApp(app))throw new Error('Unknown RED app');
  db.exec('BEGIN IMMEDIATE');
  try{
    const owners=db.prepare('SELECT id,gesperrt FROM konten LIMIT 2').all();
    const owner=owners[0];
    if(owners.length!==1||typeof owner?.id!=='string'||owner.gesperrt)throw new Error('Pair an active single owner first');
    const token='redid_'+randomBytes(32).toString('hex'),expires=Date.now()+30*86400000;
    db.prepare('DELETE FROM home_red_id WHERE expires<=?').run(Date.now());
    db.prepare('INSERT INTO home_red_id(digest,app,owner,expires) VALUES(?,?,?,?)').run(hash(token),app,owner.id,expires);
    db.exec('COMMIT');
    return {token,expiresAt:new Date(expires).toISOString()};
  }catch(error){db.exec('ROLLBACK');throw error;}
}
export function revokeRedApp(db:DatabaseSync,app:string):number{
  if(!validApp(app))throw new Error('Unknown RED app');
  return Number(db.prepare('DELETE FROM home_red_id WHERE app=?').run(app).changes);
}
export function handleRedId(db:DatabaseSync,request:Request):Response{
  const path=new URL(request.url).pathname;
  if(path==='/red-id/v1/me'&&request.method!=='GET'||path==='/red-id/v1/logout'&&request.method!=='POST')return reply(405,{error:'method_not_allowed'});
  const m=/^Bearer (redid_[a-f0-9]{64})$/.exec(request.headers.get('authorization')??'');
  if(!m)return reply(401,{error:'unauthorized'});
  const digest=hash(m[1]!);
  const row=db.prepare('SELECT r.app,r.expires,c.id,c.name FROM home_red_id r JOIN konten c ON c.id=r.owner WHERE r.digest=? AND r.expires>? AND c.gesperrt=0').get(digest,Date.now());
  if(!row||typeof row.id!=='string'||typeof row.expires!=='number'||typeof row.app!=='string'||!validApp(row.app))return reply(401,{error:'unauthorized'});
  if(path==='/red-id/v1/logout'){
    db.prepare('DELETE FROM home_red_id WHERE digest=?').run(digest);
    return reply(200,{ok:true});
  }
  return reply(200,{version:1,id:row.id,name:String(row.name??''),app:row.app,scopes:['identity:read'],expiresAt:new Date(row.expires).toISOString()});
}
