import {cpus,totalmem,freemem,uptime,loadavg} from 'node:os';
import {statfs,readFile} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import type {DatabaseSync} from 'node:sqlite';
import {werFragt} from '../kern.ts';
import type {Ablage} from '../typen.ts';

const json=(status:number,body:unknown)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const cpuSample=()=>cpus().reduce((sum,c)=>({idle:sum.idle+c.times.idle,total:sum.total+Object.values(c.times).reduce((a,b)=>a+b,0)}),{idle:0,total:0});
async function temperature(){
  try{const raw=Number((await readFile('/sys/class/thermal/thermal_zone0/temp','utf8')).trim())/1000;return Number.isFinite(raw)&&raw>=-20&&raw<=150?raw:null;}catch{return null;}
}
async function network(){
  try{
    const rows=(await readFile('/proc/net/dev','utf8')).split('\n').slice(2);
    let received=0,sent=0,interfaces=0;
    for(const line of rows){const [name,raw]=line.split(':');if(!raw||name?.trim()==='lo')continue;const v=raw.trim().split(/\s+/).map(Number);if(v.length<16||!Number.isFinite(v[0])||!Number.isFinite(v[8]))continue;received+=v[0]!;sent+=v[8]!;interfaces++;}
    return interfaces?{receivedBytes:received,sentBytes:sent}:null;
  }catch{return null;}
}
export function createHomeDashboard(db:DatabaseSync,ablage:Ablage,dataDir:string,mcpEnabled:boolean,monitor?:()=>unknown){
  let sample:Promise<unknown>|null=null;
  async function metrics(){
    const first=cpuSample();await delay(100);const last=cpuSample();
    const delta=last.total-first.total;
    const fs=await statfs(dataDir);
    const total=totalmem(),free=freemem();
    return {version:1,measuredAt:new Date().toISOString(),scope:'server-visible',
      cpu:{percent:delta>0?Math.max(0,Math.min(100,100*(1-(last.idle-first.idle)/delta))):null,cores:cpus().length,load1m:loadavg()[0]??null},
      memory:{totalBytes:total,usedBytes:Math.max(0,total-free)},
      storage:{totalBytes:fs.blocks*fs.bsize,availableBytes:fs.bavail*fs.bsize},
      temperatureC:await temperature(),network:await network(),uptimeSeconds:Math.floor(uptime()),processUptimeSeconds:Math.floor(process.uptime()),
      services:{sqlite:'ready',sync:'ready',redId:'ready',mcp:mcpEnabled?'enabled':'disabled'}};
  }
  return async(request:Request)=>{
    if(request.method!=='GET')return json(405,{error:'method_not_allowed'});
    const who=await werFragt(ablage,{authorization:request.headers.get('authorization')??''});
    if(!who?.sitzung)return json(401,{error:'unauthorized'});
    const owner=String(who.konto.id);
    const count=(sql:string,...values:(string|number)[])=>Number(db.prepare(sql).get(...values)?.n??0);
    const devices=count("SELECT COUNT(*) AS n FROM sitzungen WHERE kontoId=? AND (bis IS NULL OR bis='' OR bis>=?)",owner,new Date().toISOString());
    const appCredentials=count('SELECT COUNT(*) AS n FROM home_red_id WHERE owner=? AND expires>?',owner,Date.now())+count('SELECT COUNT(*) AS n FROM home_red_session WHERE owner=? AND refresh_until>?',owner,Date.now());
    const mcpGrantRecords=mcpEnabled?count("SELECT COUNT(*) AS n FROM mcp_state WHERE kind='grant' AND expires>?",Date.now()):0;
    // Concurrent authenticated requests share the same measurement; no user data in the sample.
    if(!sample)sample=metrics().finally(()=>{sample=null;});
    const data=await sample;
    return json(200,{...data as Record<string,unknown>,devices:{authorizedSessions:devices},redId:{activeCredentials:appCredentials},mcp:{grantRecords:mcpGrantRecords},...(monitor?{monitor:monitor()}: {})});
  };
}
