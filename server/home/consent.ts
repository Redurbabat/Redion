import {createHash,randomBytes} from 'node:crypto';
import type {DatabaseSync} from 'node:sqlite';
import type {CloudUser} from '../mcp/oauth-http.ts';
import {leseBegrenzt} from '../sicherheit/eingaben.ts';

const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const token=()=>randomBytes(32).toString('hex');
const cookieName='__Host-redion-home-consent';
const headers={'Cache-Control':'no-store','Pragma':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"};
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const allowed=(value:string,origin:string)=>{
  if(!value.startsWith('/')||value.startsWith('//')||value.includes('\\')||value.length>8192)return '/mcp/settings';
  try{const u=new URL(value,origin);return u.origin===origin&&['/mcp/authorize','/mcp/settings'].includes(u.pathname)?u.pathname+u.search:'/mcp/settings';}
  catch{return '/mcp/settings';}
};
const respond=(status:number,error:string)=>Response.json({error},{status,headers});
const transaction=<T>(db:DatabaseSync,fn:()=>T):T=>{
  db.exec('BEGIN IMMEDIATE');
  try{const result=fn();db.exec('COMMIT');return result;}
  catch(error){db.exec('ROLLBACK');throw error;}
};
export function prepareHomeConsent(db:DatabaseSync){
  db.exec("CREATE TABLE IF NOT EXISTS home_consent (digest TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('code','session')), owner TEXT NOT NULL, expires INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS home_consent_expiry ON home_consent(expires);");
}
export function issueHomeConsentCode(db:DatabaseSync):string{
  return transaction(db,()=>{
    const owners=db.prepare('SELECT id,gesperrt FROM konten LIMIT 2').all();
    if(owners.length!==1||owners[0]?.gesperrt)throw new Error('Pair the first device before enabling MCP');
    const value=token();
    db.prepare("DELETE FROM home_consent WHERE expires<=? OR kind='code'").run(Date.now());
    db.prepare("INSERT INTO home_consent(digest,kind,owner,expires) VALUES(?,'code',?,?)").run(hash(value),owners[0]!.id!,Date.now()+300000);
    return value;
  });
}
function sessionDigest(request:Request):string|null{
  const matches=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).filter(v=>v.startsWith(cookieName+'='));
  if(matches.length!==1)return null;
  const value=matches[0]!.slice(cookieName.length+1);
  return /^[a-f0-9]{64}$/.test(value)?hash(value):null;
}
export function identifyHomeConsent(db:DatabaseSync,request:Request):CloudUser|null{
  const digest=sessionDigest(request);
  if(!digest)return null;
  const row=db.prepare("SELECT c.id FROM home_consent h JOIN konten c ON c.id=h.owner WHERE h.digest=? AND h.kind='session' AND h.expires>? AND c.gesperrt=0").get(digest,Date.now());
  if(!row||typeof row.id!=='string')return null;
  const areas=db.prepare('SELECT id,name FROM bereiche WHERE besitzer=? ORDER BY id LIMIT 20').all(row.id);
  return {id:row.id,workspaces:areas.map(a=>({id:String(a.id),name:String(a.name??''),canWrite:true}))};
}
export function homeConsentLogin(target:string,origin:string):Response{
  return new Response('<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RED ION – KI-Anmeldung</title><h1>KI-Verbindung bestätigen</h1><p>Erzeuge auf der lokalen Serverkonsole einen einmaligen MCP-Freigabecode. Gib ihn nur auf deinem eigenen RED Home Server ein.</p><form action="/home/mcp-login" method="post"><input type="hidden" name="target" value="'+escape(allowed(target,origin))+'"><label>Freigabecode <input type="password" name="code" required maxlength="64" autocomplete="off"></label><button>Anmelden</button></form></html>',{status:200,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
}
export async function exchangeHomeConsent(db:DatabaseSync,request:Request,origin:string):Promise<Response>{
  if(request.method!=='POST')return respond(405,'method_not_allowed');
  if(request.headers.get('origin')!==origin)return respond(403,'invalid_origin');
  if(request.headers.get('content-type')?.split(';')[0]?.trim()!=='application/x-www-form-urlencoded')return respond(415,'invalid_content_type');
  const body=await leseBegrenzt(request.body,16384);
  if(!body)return respond(413,'request_too_large');
  const form=new URLSearchParams(new TextDecoder().decode(body));
  if(form.getAll('code').length!==1||form.getAll('target').length!==1)return respond(400,'invalid_form');
  const code=form.get('code')||'';
  if(!/^[a-f0-9]{64}$/.test(code))return respond(401,'invalid_code');
  const value=transaction(db,()=>{
    const now=Date.now(),key=hash(code);
    const row=db.prepare("SELECT h.owner FROM home_consent h JOIN konten c ON c.id=h.owner WHERE h.digest=? AND h.kind='code' AND h.expires>? AND c.gesperrt=0").get(key,now);
    if(!row)return null;
    if(db.prepare("DELETE FROM home_consent WHERE digest=? AND kind='code'").run(key).changes!==1)return null;
    const value=token();
    db.prepare("DELETE FROM home_consent WHERE expires<=?").run(now);
    db.prepare("INSERT INTO home_consent(digest,kind,owner,expires) VALUES(?,'session',?,?)").run(hash(value),row.owner!,now+3600000);
    return value;
  });
  if(!value)return respond(401,'invalid_code');
  return new Response(null,{status:303,headers:{...headers,Location:allowed(form.get('target')||'',origin),'Set-Cookie':cookieName+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600'}});
}
export function logoutHomeConsent(db:DatabaseSync,request:Request,origin:string):Response{
  if(request.method!=='POST'||request.headers.get('origin')!==origin)return respond(403,'invalid_origin');
  const digest=sessionDigest(request);
  if(digest)db.prepare("DELETE FROM home_consent WHERE digest=? AND kind='session'").run(digest);
  return new Response(null,{status:204,headers:{...headers,'Set-Cookie':cookieName+'=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0'}});
}
