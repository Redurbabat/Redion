import {torPruefen,torModus,nachweisAusAnfrage,zerlegeNachweis,type Torumwelt} from '../sicherheit/tor.ts';
import {ablageD1} from '../ablage.ts';
import {rolleAuf,darf} from '../kern.ts';
import {createMcpOAuth} from './oauth.ts';
import {createMcpOAuthHttp,type CloudUser} from './oauth-http.ts';
import {mcpStateD1} from './state.ts';
import type {CloudDatabase} from './repository.ts';

const hash=async(value:string):Promise<string>=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
/** Nur ein kryptografisch geprüfter Access-App-Nachweis mit menschlicher
 * Identität darf ein Redion-Konto auflösen. Kein Mail-Abgleich zwischen
 * Anbietern und kein Vertrauen in vom MCP-Client gesetzte Konto-Header. */
export const cloudUserFromAccess=async(request:Request,database:CloudDatabase,env:Torumwelt,
  options:{now?:()=>number;fetchKeys?:typeof fetch;create?:boolean}={}):Promise<CloudUser|null>=>{
  if(torModus(env)!=='access')return null;
  const now=options.now??Date.now;
  if(await torPruefen(request,env,now(),options.fetchKeys??fetch))return null;
  const identity=zerlegeNachweis(nachweisAusAnfrage(request))?.nutz;
  const team=String(env.ACCESS_TEAM??'').trim().replace(/^https:\/\//,'').replace(/\/$/,'');
  if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(team)||!identity||identity.iss!=='https://'+team||identity.type!=='app'||
    typeof identity.sub!=='string'||!identity.sub||identity.sub.length>256||typeof identity.email!=='string'||
    !/^[^\s@]{1,128}@[^\s@]{1,128}$/.test(identity.email))return null;
  const fingerprint=await hash(identity.iss+'\0'+identity.sub),id='cf_'+fingerprint;
  let account=await database.prepare('SELECT * FROM konten WHERE id=?').bind(id).first<{id:string;gesperrt:number}>();
  if(account?.gesperrt)return null;
  if(!account){
    if(!options.create)return null;
    const when=new Date(now()).toISOString();
    await database.batch([
      database.prepare('INSERT OR IGNORE INTO konten(id,mail,name,herkunft,angelegt,gesperrt) VALUES(?,?,?,?,?,0)')
        .bind(id,identity.email,identity.email,'cloudflare-access',when),
      database.prepare('INSERT OR IGNORE INTO bereiche(id,name,besitzer,angelegt) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM konten WHERE id=? AND COALESCE(gesperrt,0)=0)')
        .bind('ws_'+fingerprint,'Mein Redion',id,when,id)
    ]);
    account=await database.prepare('SELECT * FROM konten WHERE id=?').bind(id).first<{id:string;gesperrt:number}>();
  }
  if(!account||account.gesperrt)return null;
  const candidates=await database.prepare("SELECT DISTINCT b.* FROM bereiche b WHERE b.besitzer=? OR EXISTS(SELECT 1 FROM freigaben f WHERE f.bereich=b.id AND (f.kontoId=? OR f.kontoId='*') AND f.rolle IN ('voll','edit','komm','lesen')) ORDER BY b.id LIMIT 101")
    .bind(id,id).all<{id:string;name:string;besitzer:string}>();
  if(candidates.results.length>100)return null;
  const storage=ablageD1(database),workspaces:CloudUser['workspaces']=[];
  for(const workspace of candidates.results){
    const role=String(await rolleAuf(storage,workspace.id,'*',id));
    workspaces.push({id:workspace.id,name:workspace.name,canWrite:darf(role,'bearbeiten')});
  }
  return {id,workspaces};
};

/** Nur /mcp/authorize und /mcp/settings der vorhandenen geschützten Website.
 * Der öffentliche MCP-Worker besitzt weder Assets noch diese Anmeldung. */
export const createCloudAuthorization=({database,env,issuer,authorizationEndpoint,now=Date.now,fetchKeys=fetch}:{database:CloudDatabase;
  env:Torumwelt;issuer:string;authorizationEndpoint:string;now?:()=>number;fetchKeys?:typeof fetch})=>{
  const state=mcpStateD1(database,now),oauth=createMcpOAuth({state,issuer,resource:issuer+'/mcp',authorizationEndpoint,now});
  return createMcpOAuthHttp({state,oauth,now,
    identify:request=>cloudUserFromAccess(request,database,env,{now,fetchKeys,create:true}),
    rateKey:request=>request.headers.get('CF-Connecting-IP')??'unknown-source'});
};
