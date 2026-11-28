/** Process-local rolling request metrics, no request payloads, URLs,
 * tokens, user IDs or IP addresses. Reset when the process restarts. */
export function createHomeMonitor(now=Date.now){
 const slots=Array.from({length:60},()=>({minute:-1,requests:0,clientErrors:0,serverErrors:0,totalMs:0,maxMs:0}));
 const started=now();
 function record(status:number,durationMs:number){
  const minute=Math.floor(now()/60000),slot=slots[minute%60]!;
  if(slot.minute!==minute)Object.assign(slot,{minute,requests:0,clientErrors:0,serverErrors:0,totalMs:0,maxMs:0});
  const ms=Number.isFinite(durationMs)?Math.min(3600000,Math.max(0,durationMs)):0;
  slot.requests++;slot.clientErrors+=status>=400&&status<500?1:0;slot.serverErrors+=status>=500?1:0;slot.totalMs+=ms;slot.maxMs=Math.max(slot.maxMs,ms);
 }
 function snapshot(){
  const minute=Math.floor(now()/60000),valid=slots.filter(s=>s.minute>=minute-59&&s.minute<=minute);
  const total=valid.reduce((a,s)=>({requests:a.requests+s.requests,clientErrors:a.clientErrors+s.clientErrors,serverErrors:a.serverErrors+s.serverErrors,totalMs:a.totalMs+s.totalMs,maxMs:Math.max(a.maxMs,s.maxMs)}),{requests:0,clientErrors:0,serverErrors:0,totalMs:0,maxMs:0});
  return {scope:'process',windowMinutes:60,startedAt:new Date(started).toISOString(),requests:total.requests,clientErrors:total.clientErrors,serverErrors:total.serverErrors,meanMs:total.requests?Math.round(total.totalMs/total.requests):null,maxMs:total.requests?Math.round(total.maxMs):null};
 }
 return {record,snapshot};
}
