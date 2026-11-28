import type {DatabaseSync} from 'node:sqlite';

const DAY=86_400_000;
const periods={once:0,daily:DAY,weekly:7*DAY} as const;
const BATCH=256;
export type ReminderReview=(owner:string,id:string,kind:string,due:number,now:number)=>void;

/** Advance rules and optionally record typed read-only review results atomically.
 * No maintenance commands or network calls. */
export function advanceRedReminders(db:DatabaseSync,now:number,owner?:string,review?:ReminderReview):number{
 if(!Number.isSafeInteger(now)||now<0)throw new RangeError('Invalid reminder clock');
 db.exec('BEGIN IMMEDIATE');
 try{
  const rows=owner===undefined
   ?db.prepare('SELECT owner,id,kind,period,next_due,pending_due FROM home_red_reminder WHERE next_due<=? ORDER BY next_due,owner,id LIMIT ?').all(now,BATCH)
   :db.prepare('SELECT owner,id,kind,period,next_due,pending_due FROM home_red_reminder WHERE owner=? AND next_due<=? ORDER BY next_due,id').all(owner,now);
  const update=db.prepare('UPDATE home_red_reminder SET next_due=?,pending_due=? WHERE owner=? AND id=?');
  for(const row of rows){
   const first=Number(row.next_due),period=String(row.period);
   if(!Object.hasOwn(periods,period)||!Number.isSafeInteger(first)||first<0)throw new Error('Invalid reminder rule');
   const step=periods[period as keyof typeof periods];
   const latest=step===0?first:first+Math.floor((now-first)/step)*step;
   const next=step===0?null:latest+step;
   if(next!==null&&!Number.isSafeInteger(next))throw new RangeError('Invalid next reminder');
   update.run(next,row.pending_due===null?latest:Number(row.pending_due),String(row.owner),String(row.id));
   if(row.pending_due===null)review?.(String(row.owner),String(row.id),String(row.kind),latest,now);
  }
  db.exec('COMMIT');return rows.length;
 }catch(error){db.exec('ROLLBACK');throw error;}
}
export function startRedReminderScheduler(db:DatabaseSync,options:{intervalMs?:number;clock?:()=>number;onError?:()=>void;review?:ReminderReview}={}){
 const interval=options.intervalMs??30_000,clock=options.clock??Date.now;
 if(!Number.isSafeInteger(interval)||interval<1000||interval>2_147_483_647)throw new RangeError('Invalid reminder interval');
 let closed=false;
 const run=()=>{
  if(closed)return;
  try{advanceRedReminders(db,clock(),undefined,options.review);}catch{options.onError?.();}
 };
 run();
 const timer=setInterval(run,interval);timer.unref();
 return {close(){if(closed)return;closed=true;clearInterval(timer);}};
}
