import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {advanceRedReminders,startRedReminderScheduler} from '../server/home/reminder-scheduler.ts';
const DAY=86_400_000;
function setup(db:DatabaseSync){db.exec('CREATE TABLE IF NOT EXISTS home_red_reminder(owner TEXT NOT NULL,id TEXT NOT NULL,kind TEXT NOT NULL,period TEXT NOT NULL,first_due INTEGER NOT NULL,next_due INTEGER,pending_due INTEGER,last_ack INTEGER,PRIMARY KEY(owner,id));');}
function add(db:DatabaseSync,owner:string,id:string,period='daily',due=1000){db.prepare('INSERT INTO home_red_reminder VALUES(?,?,?,?,?,?,NULL,NULL)').run(owner,id,'backup-review',period,due,due);}
function row(db:DatabaseSync,owner:string,id:string){return db.prepare('SELECT next_due,pending_due FROM home_red_reminder WHERE owner=? AND id=?').get(owner,id)!;}
test('owner-scoped polling, background catch-up and stable pending occurrences',()=>{
 const db=new DatabaseSync(':memory:');try{setup(db);add(db,'a','x');add(db,'b','x','once');
 const now=1000+3*DAY;assert.equal(advanceRedReminders(db,now,'a'),1);assert.equal(row(db,'a','x').pending_due,now);assert.equal(row(db,'b','x').pending_due,null);
 assert.equal(advanceRedReminders(db,now),1);assert.equal(row(db,'b','x').next_due,null);assert.equal(row(db,'b','x').pending_due,1000);
 assert.equal(advanceRedReminders(db,now+2*DAY),1);assert.equal(row(db,'a','x').pending_due,now);assert.equal(row(db,'a','x').next_due,now+3*DAY);
 assert.equal(advanceRedReminders(db,now+2*DAY),0);
 }finally{db.close();}
});
test('bounded backlog drains without dropping other accounts',()=>{
 const db=new DatabaseSync(':memory:');try{setup(db);for(let i=0;i<260;i++)add(db,'o'+i,'x','once');
 assert.equal(advanceRedReminders(db,1000),256);assert.equal(advanceRedReminders(db,1000),4);assert.equal(advanceRedReminders(db,1000),0);
 assert.equal(db.prepare('SELECT count(*) AS n FROM home_red_reminder WHERE pending_due=1000').get()?.n,260);
 }finally{db.close();}
});
test('invalid stored rules roll back the entire batch',()=>{
 const db=new DatabaseSync(':memory:');try{setup(db);add(db,'a','x');add(db,'b','x','bad');
 assert.throws(()=>advanceRedReminders(db,1000));assert.equal(row(db,'a','x').pending_due,null);assert.throws(()=>advanceRedReminders(db,NaN));
 }finally{db.close();}
});
test('startup catch-up persists over restart; closing stops the timer',async()=>{
 const root=await mkdtemp(join(tmpdir(),'red-scheduler-'));let db=new DatabaseSync(join(root,'rules.sqlite'));
 try{setup(db);add(db,'a','x','once');const job=startRedReminderScheduler(db,{clock:()=>1000,intervalMs:1000});job.close();job.close();db.close();db=new DatabaseSync(join(root,'rules.sqlite'));assert.equal(row(db,'a','x').pending_due,1000);
 }finally{db.close();await rm(root,{recursive:true,force:true});}
});
test('background ticks without client requests; close prevents later ticks',async()=>{
 const db=new DatabaseSync(':memory:');let job:ReturnType<typeof startRedReminderScheduler>|undefined;
 try{setup(db);add(db,'a','x','once',2000);let now=1000;job=startRedReminderScheduler(db,{clock:()=>now,intervalMs:1000});assert.equal(row(db,'a','x').pending_due,null);now=2000;
 const deadline=Date.now()+5000;while(row(db,'a','x').pending_due===null&&Date.now()<deadline)await new Promise(r=>setTimeout(r,25));assert.equal(row(db,'a','x').pending_due,2000);job.close();add(db,'b','x','once',3000);now=3000;await new Promise(r=>setTimeout(r,1100));assert.equal(row(db,'b','x').pending_due,null);
 }finally{job?.close();db.close();}
});
