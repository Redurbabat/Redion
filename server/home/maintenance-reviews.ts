import type {DatabaseSync} from 'node:sqlite';
import {statfsSync} from 'node:fs';
import {assessStorageCapacity} from './maintenance-storage.ts';
import {reviewRedGrants} from './maintenance-grants.ts';
import type {ReminderReview} from './reminder-scheduler.ts';

export const MAINTENANCE_HISTORY_LIMIT=256;
const HISTORY_RESPONSE_LIMIT=64;
export function prepareMaintenanceReviews(db:DatabaseSync){
 db.exec('CREATE TABLE IF NOT EXISTS home_red_maintenance_review(owner TEXT NOT NULL,id TEXT NOT NULL,due INTEGER NOT NULL,measured_at INTEGER NOT NULL,status TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(owner,id)); CREATE TABLE IF NOT EXISTS home_red_maintenance_history(owner TEXT NOT NULL,id TEXT NOT NULL,kind TEXT NOT NULL,due INTEGER NOT NULL,measured_at INTEGER NOT NULL,status TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(owner,id,due)); CREATE INDEX IF NOT EXISTS home_red_maintenance_history_recent ON home_red_maintenance_history(owner,measured_at DESC,due DESC,id DESC);');
}
/** Read bounded owner-scoped history. The latest result per rule is separate. */
export function listMaintenanceHistory(db:DatabaseSync,owner:string){
 const rows=db.prepare('SELECT id,kind,due,measured_at AS measuredAt,status,result FROM home_red_maintenance_history WHERE owner=? ORDER BY measured_at DESC,due DESC,id DESC LIMIT ?').all(owner,HISTORY_RESPONSE_LIMIT+1);
 return {entries:rows.slice(0,HISTORY_RESPONSE_LIMIT).map(row=>({id:String(row.id),kind:String(row.kind),due:Number(row.due),measuredAt:Number(row.measuredAt),status:String(row.status),result:JSON.parse(String(row.result)) as unknown})),truncated:rows.length>HISTORY_RESPONSE_LIMIT,retentionLimit:MAINTENANCE_HISTORY_LIMIT};
}
/** Called synchronously inside the reminder transaction. No external actions.
 * Store the latest result plus a bounded history, not user content. */
export function createMaintenanceReview(db:DatabaseSync,dataDir:string):ReminderReview{
 return (owner,id,kind,due,now)=>{
  if(kind!=='storage-review'&&kind!=='grant-review')return;
  if(db.prepare('SELECT 1 FROM home_red_maintenance_history WHERE owner=? AND id=? AND due=?').get(owner,id,due))return;
  let result:{status:string};
  try{
   if(kind==='storage-review'){
    const fs=statfsSync(dataDir);
    result=assessStorageCapacity(fs.blocks*fs.bsize,fs.bavail*fs.bsize);
   }else result=reviewRedGrants(db,owner,now);
  }catch{result={status:'unknown'};}
  const encoded=JSON.stringify(result);
  db.prepare('INSERT INTO home_red_maintenance_review(owner,id,due,measured_at,status,result) VALUES(?,?,?,?,?,?) ON CONFLICT(owner,id) DO UPDATE SET due=excluded.due,measured_at=excluded.measured_at,status=excluded.status,result=excluded.result').run(owner,id,due,now,result.status,encoded);
  db.prepare('INSERT INTO home_red_maintenance_history(owner,id,kind,due,measured_at,status,result) VALUES(?,?,?,?,?,?,?) ON CONFLICT(owner,id,due) DO NOTHING').run(owner,id,kind,due,now,result.status,encoded);
  db.prepare('DELETE FROM home_red_maintenance_history WHERE owner=? AND rowid IN (SELECT rowid FROM home_red_maintenance_history WHERE owner=? ORDER BY measured_at DESC,due DESC,id DESC LIMIT -1 OFFSET ?)').run(owner,owner,MAINTENANCE_HISTORY_LIMIT);
 };
}
