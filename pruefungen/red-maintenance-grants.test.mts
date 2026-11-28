import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {reviewRedGrants} from '../server/home/maintenance-grants.ts';
const DAY=86_400_000;
function setup(){
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE home_red_store_grant(owner TEXT,expires INTEGER); CREATE TABLE home_red_share_grant(owner TEXT,expires INTEGER); CREATE TABLE home_red_id(owner TEXT,expires INTEGER); CREATE TABLE home_red_session(owner TEXT,refresh_until INTEGER);');
 return db;
}
test('grant review excludes expired and other owners and includes boundary',()=>{
 const db=setup();try{
 const now=1000;
 const store=db.prepare('INSERT INTO home_red_store_grant VALUES(?,?)');
 for(const due of [now-1,now,now+1,now+DAY,now+DAY+1])store.run('a',due);
 store.run('b',now+1);
 db.prepare('INSERT INTO home_red_share_grant VALUES(?,?)').run('a',now+DAY+1);
 db.prepare('INSERT INTO home_red_id VALUES(?,?)').run('a',now+1);
 db.prepare('INSERT INTO home_red_session VALUES(?,?)').run('a',now+DAY+1);
 const result=reviewRedGrants(db,'a',now);
 assert.deepEqual(result.store,{active:3,expiringSoon:2});
 assert.deepEqual(result.share,{active:1,expiringSoon:0});
 assert.deepEqual(result.credentials,{active:2,expiringSoon:1});
 assert.equal(result.status,'warning');
 assert.deepEqual(reviewRedGrants(db,'b',now).store,{active:1,expiringSoon:1});
 assert.equal(reviewRedGrants(db,'c',now).status,'ok');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM home_red_store_grant').get()?.n,6);
 }finally{db.close();}
});
test('invalid clocks rejected',()=>{
 const db=setup();try{for(const value of [-1,NaN,Infinity,Number.MAX_SAFE_INTEGER])assert.throws(()=>reviewRedGrants(db,'a',value));}finally{db.close();}
});
