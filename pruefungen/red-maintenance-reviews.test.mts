import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {prepareMaintenanceReviews,createMaintenanceReview} from '../server/home/maintenance-reviews.ts';
import {advanceRedReminders} from '../server/home/reminder-scheduler.ts';
const DAY=86_400_000;
function setup(db:DatabaseSync){
 db.exec('CREATE TABLE home_red_reminder(owner TEXT,id TEXT,kind TEXT,period TEXT,next_due INTEGER,pending_due INTEGER,PRIMARY KEY(owner,id)); CREATE TABLE home_red_store_grant(owner TEXT,expires INTEGER); CREATE TABLE home_red_share_grant(owner TEXT,expires INTEGER); CREATE TABLE home_red_id(owner TEXT,expires INTEGER); CREATE TABLE home_red_session(owner TEXT,refresh_until INTEGER);');
 prepareMaintenanceReviews(db);
}
test('typed reviews are atomic, coalesced, bounded per rule and owner scoped',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-maintenance-'));const db=new DatabaseSync(':memory:');
 try{
  setup(db);const now=1000;
  const add=db.prepare('INSERT INTO home_red_reminder VALUES(?,?,?,?,?,NULL)');
  add.run('a','same','grant-review','daily',now);add.run('b','same','grant-review','once',now);
  add.run('a','storage','storage-review','once',now);add.run('a','backup','backup-review','once',now);
  db.prepare('INSERT INTO home_red_store_grant VALUES(?,?)').run('b',now+1000);
  const review=createMaintenanceReview(db,root);
  assert.equal(advanceRedReminders(db,now,'a',review),3);
  const get=(owner:string,id:string)=>db.prepare('SELECT due,measured_at,status,result FROM home_red_maintenance_review WHERE owner=? AND id=?').get(owner,id);
  assert.equal(get('a','same')?.status,'ok');assert.equal(get('b','same'),undefined);assert.equal(get('a','backup'),undefined);
  assert.ok(['ok','warning','critical'].includes(String(get('a','storage')?.status)));
  assert.equal(advanceRedReminders(db,now,undefined,review),1);assert.equal(get('b','same')?.status,'warning');
  assert.equal(advanceRedReminders(db,now+DAY,'a',review),1);assert.equal(get('a','same')?.due,now);
  db.prepare('UPDATE home_red_reminder SET pending_due=NULL WHERE owner=? AND id=?').run('a','same');
  assert.equal(advanceRedReminders(db,now+2*DAY,'a',review),1);assert.equal(get('a','same')?.due,now+2*DAY);
  assert.equal(db.prepare('SELECT count(*) AS n FROM home_red_maintenance_review').get()?.n,3);
 }finally{db.close();await rm(root,{recursive:true,force:true});}
});
test('measurement failures are unknown; transaction rolls back if persistence fails',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-maintenance-'));const db=new DatabaseSync(':memory:');
 try{
  setup(db);db.prepare('INSERT INTO home_red_reminder VALUES(?,?,?,?,?,NULL)').run('a','x','storage-review','once',1000);
  const review=createMaintenanceReview(db,join(root,'missing'));
  assert.equal(advanceRedReminders(db,1000,'a',review),1);
  assert.equal(db.prepare('SELECT status FROM home_red_maintenance_review').get()?.status,'unknown');
  db.prepare('INSERT INTO home_red_reminder VALUES(?,?,?,?,?,NULL)').run('a','y','storage-review','once',1000);
  db.exec('DROP TABLE home_red_maintenance_review');
  assert.throws(()=>advanceRedReminders(db,1000,'a',review));
  assert.equal(db.prepare('SELECT pending_due FROM home_red_reminder WHERE id=?').get('y')?.pending_due,null);
 }finally{db.close();await rm(root,{recursive:true,force:true});}
});
