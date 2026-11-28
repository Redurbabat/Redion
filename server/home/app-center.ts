import type {DatabaseSync} from 'node:sqlite';
import type {Ablage} from '../typen.ts';
import {werFragt} from '../kern.ts';
import {RED_APPS} from './red-id.ts';

const labels:Record<typeof RED_APPS[number],{name:string;category:string;integration:string}>={
 'red-ion':{name:'RED ION',category:'Workspace',integration:'home-server'},
 'red-fit':{name:'RED FIT',category:'Fitness',integration:'browser-pilot'},
 'red-poly':{name:'RED POLY',category:'Sprachen',integration:'expo-pilot'},
 'red-bit':{name:'RED BIT',category:'Musik',integration:'apple-pilot'},
 'red-loop':{name:'RED LOOP',category:'Entwicklung',integration:'browser-pilot'},
 'red-efz':{name:'RED EFZ',category:'Ausbildung',integration:'companion-pilot'},
 'red-kurd':{name:'RED KURD',category:'Sprache und Kultur',integration:'browser-pilot'},
 'red-uhr':{name:'RED UHR',category:'Sportuhr',integration:'companion-pilot'},
 'red-yt':{name:'RED YT',category:'Video',integration:'apple-pilot'},
 'stran':{name:'STRAN',category:'Musik',integration:'browser-pilot'},
 'babat-red':{name:'BABAT RED',category:'Portal',integration:'browser-pilot'}
};
const reply=(status:number,body:unknown)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
/** Owner-only inventory. Never claims that a client is installed, online
 * or compatible. No download links, arbitrary app URLs or secrets. */
export function createRedAppCenter(db:DatabaseSync,ablage:Ablage){
 return async(request:Request)=>{
  if(request.method!=='GET')return reply(405,{error:'method_not_allowed'});
  const who=await werFragt(ablage,{authorization:request.headers.get('authorization')??''});
  if(!who?.sitzung)return reply(401,{error:'unauthorized'});
  const owner=String(who.konto.id),now=Date.now();
  db.exec('BEGIN');
  try{
   const count=(sql:string,...args:(string|number)[])=>Number(db.prepare(sql).get(...args)?.n??0);
   const apps=RED_APPS.map(app=>{
    const sessions=count('SELECT COUNT(*) AS n FROM home_red_session WHERE owner=? AND app=? AND refresh_until>?',owner,app,now);
    const legacy=count('SELECT COUNT(*) AS n FROM home_red_id WHERE owner=? AND app=? AND expires>?',owner,app,now);
    const incoming=count('SELECT COUNT(*) AS n FROM home_red_share_grant WHERE owner=? AND target=? AND expires>?',owner,app,now);
    const outgoing=count('SELECT COUNT(*) AS n FROM home_red_share_grant WHERE owner=? AND source=? AND expires>?',owner,app,now);
    const grants=db.prepare('SELECT kind,expires FROM home_red_store_grant WHERE owner=? AND app=? AND expires>? ORDER BY kind').all(owner,app,now);
    const usage=db.prepare('SELECT COUNT(*) AS objects,COALESCE(SUM(length(envelope)),0) AS encodedBytes,COALESCE(SUM(deleted),0) AS tombstones FROM home_red_store_record WHERE owner=? AND app=?').get(owner,app);
    return {app,...labels[app],sessions,legacyCredentials:legacy,connected:sessions+legacy>0,grants,share:{incoming,outgoing},storage:{objects:Number(usage?.objects??0),encodedBytes:Number(usage?.encodedBytes??0),tombstones:Number(usage?.tombstones??0)}};
   });
   db.exec('COMMIT');
   return reply(200,{version:1,asOf:new Date(now).toISOString(),apps,limits:{recordCount:1024,encodedBytes:16*1024*1024},note:'Authorized credentials only; pilot labels describe integration code, not live installation or release status.'});
  }catch(e){db.exec('ROLLBACK');throw e;}
 };
}
