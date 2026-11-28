import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {prepareRedStore} from '../server/home/red-store.ts';
import {prepareRedStoreChanges,readRedStoreChanges} from '../server/home/red-store-changes.ts';
test('change anchors are scoped, bounded and transactional; legacy records are seeded',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  // Simulate the 0.7 schema before upgrading.
  db.exec('CREATE TABLE home_red_store_record(owner TEXT NOT NULL,app TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,revision INTEGER NOT NULL,deleted INTEGER NOT NULL,envelope TEXT NOT NULL,operation TEXT NOT NULL,digest TEXT NOT NULL,updated INTEGER NOT NULL,PRIMARY KEY(owner,app,kind,id))');
  const add=db.prepare('INSERT INTO home_red_store_record VALUES(?,?,?,?,?,?,?,?,?,?)');
  add.run('owner','red-fit','sync','a'.repeat(32),1,0,'A'.repeat(40),'o','d',1);
  prepareRedStore(db);
  const first=readRedStoreChanges(db,'owner','red-fit','sync',null);
  assert.equal(first.items.length,1);assert.ok(first.cursor);assert.equal(first.reset,true);
  prepareRedStoreChanges(db);
  assert.equal(readRedStoreChanges(db,'owner','red-fit','sync',first.cursor).reset,false);
  db.exec('BEGIN');
  add.run('owner','red-fit','sync','b'.repeat(32),1,0,'A'.repeat(40),'o','d',2);
  db.exec('ROLLBACK');
  assert.equal(readRedStoreChanges(db,'owner','red-fit','sync',first.cursor).items.length,0);
  add.run('other','red-fit','sync','c'.repeat(32),1,0,'A'.repeat(40),'o','d',2);
  assert.equal(readRedStoreChanges(db,'other','red-fit','sync',first.cursor).reset,true);
  assert.equal(readRedStoreChanges(db,'owner','red-fit','file',first.cursor).items.length,0);
  // Outer UPSERT conflict policies must not override the trigger's explicit UPSERT.
  const update=db.prepare('INSERT INTO home_red_store_record VALUES(?,?,?,?,1,0,?,\'o\',\'d\',1) ON CONFLICT(owner,app,kind,id) DO UPDATE SET revision=home_red_store_record.revision+1');
  for(let i=0;i<513;i++)update.run('owner','red-fit','sync','a'.repeat(32),'A'.repeat(40));
  const reset=readRedStoreChanges(db,'owner','red-fit','sync',first.cursor);
  assert.equal(reset.reset,true);assert.equal(reset.items[0]?.revision,514);
  assert.equal(Number(db.prepare("SELECT COUNT(*) AS n FROM home_red_store_anchor WHERE owner='owner'").get()?.n),512);
  assert.equal(readRedStoreChanges(db,'owner','red-fit','sync',reset.cursor).items.length,0);
 }finally{db.close();}
});
