import type {DatabaseSync} from 'node:sqlite';
import {statfsSync} from 'node:fs';
import {assessStorageCapacity} from './maintenance-storage.ts';
import {reviewRedGrants} from './maintenance-grants.ts';
import type {ReminderReview} from './reminder-scheduler.ts';

export function prepareMaintenanceReviews(db:DatabaseSync){
 db.exec('CREATE TABLE IF NOT EXISTS home_red_maintenance_review(owner TEXT NOT NULL,id TEXT NOT NULL,due INTEGER NOT NULL,measured_at INTEGER NOT NULL,status TEXT NOT NULL,result TEXT NOT NULL,PRIMARY KEY(owner,id));');
}
/** Called synchronously inside the reminder transaction. No external actions.
 * Store only the most recent completed check per rule, not user content. */
export function createMaintenanceReview(db:DatabaseSync,dataDir:string):ReminderReview{
 return (owner,id,kind,due,now)=>{
  if(kind!=='storage-review'&&kind!=='grant-review')return;
  let result:{status:string};
  try{
   if(kind==='storage-review'){
    const fs=statfsSync(dataDir);
    result=assessStorageCapacity(fs.blocks*fs.bsize,fs.bavail*fs.bsize);
   }else result=reviewRedGrants(db,owner,now);
  }catch{result={status:'unknown'};}
  db.prepare('INSERT INTO home_red_maintenance_review(owner,id,due,measured_at,status,result) VALUES(?,?,?,?,?,?) ON CONFLICT(owner,id) DO UPDATE SET due=excluded.due,measured_at=excluded.measured_at,status=excluded.status,result=excluded.result').run(owner,id,due,now,result.status,JSON.stringify(result));
 };
}
