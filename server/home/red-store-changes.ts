import type {DatabaseSync} from 'node:sqlite';
const KEEP=512;
/** Only metadata, never plaintext or old ciphertext. Scoped clocks are
 * monotonic inside a database history. Random anchors detect stale cursors
 * after restore or retention expiry rather than silently skipping updates. */
export function prepareRedStoreChanges(db:DatabaseSync){
 db.exec('BEGIN IMMEDIATE');
 try{
  db.exec(`CREATE TABLE IF NOT EXISTS home_red_store_clock(owner TEXT NOT NULL,app TEXT NOT NULL,kind TEXT NOT NULL,seq INTEGER NOT NULL,stamp TEXT NOT NULL,PRIMARY KEY(owner,app,kind));
CREATE TABLE IF NOT EXISTS home_red_store_change(owner TEXT NOT NULL,app TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,seq INTEGER NOT NULL,PRIMARY KEY(owner,app,kind,id));
CREATE INDEX IF NOT EXISTS home_red_store_change_seq ON home_red_store_change(owner,app,kind,seq,id);
CREATE TABLE IF NOT EXISTS home_red_store_anchor(owner TEXT NOT NULL,app TEXT NOT NULL,kind TEXT NOT NULL,seq INTEGER NOT NULL,stamp TEXT NOT NULL,PRIMARY KEY(owner,app,kind,seq));
CREATE UNIQUE INDEX IF NOT EXISTS home_red_store_anchor_stamp ON home_red_store_anchor(owner,app,kind,stamp);
INSERT OR IGNORE INTO home_red_store_clock SELECT owner,app,kind,1,lower(hex(randomblob(32))) FROM home_red_store_record GROUP BY owner,app,kind;
INSERT OR IGNORE INTO home_red_store_change SELECT r.owner,r.app,r.kind,r.id,c.seq FROM home_red_store_record r JOIN home_red_store_clock c ON r.owner=c.owner AND r.app=c.app AND r.kind=c.kind;
INSERT OR IGNORE INTO home_red_store_anchor SELECT owner,app,kind,seq,stamp FROM home_red_store_clock;`);
  // Triggers keep the revision and its change marker in the same SQLite
  // transaction, including when a compatible older writer updates the row.
  const statements=`INSERT INTO home_red_store_clock VALUES(NEW.owner,NEW.app,NEW.kind,1,lower(hex(randomblob(32)))) ON CONFLICT(owner,app,kind) DO UPDATE SET seq=seq+1,stamp=lower(hex(randomblob(32)));
INSERT OR REPLACE INTO home_red_store_change SELECT owner,app,kind,NEW.id,seq FROM home_red_store_clock WHERE owner=NEW.owner AND app=NEW.app AND kind=NEW.kind;
INSERT INTO home_red_store_anchor SELECT owner,app,kind,seq,stamp FROM home_red_store_clock WHERE owner=NEW.owner AND app=NEW.app AND kind=NEW.kind;
DELETE FROM home_red_store_anchor WHERE owner=NEW.owner AND app=NEW.app AND kind=NEW.kind AND seq<=(SELECT seq FROM home_red_store_clock WHERE owner=NEW.owner AND app=NEW.app AND kind=NEW.kind)-${KEEP};`;
  db.exec('CREATE TRIGGER IF NOT EXISTS home_red_store_change_insert AFTER INSERT ON home_red_store_record BEGIN '+statements+' END;');
  db.exec('CREATE TRIGGER IF NOT EXISTS home_red_store_change_update AFTER UPDATE OF revision ON home_red_store_record WHEN OLD.revision<>NEW.revision BEGIN '+statements+' END;');
  db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');throw e;}
}
/** A consistent, bounded metadata snapshot; the caller authenticates and
 * checks the existing owner/app/kind grant before calling this function. */
export function readRedStoreChanges(db:DatabaseSync,owner:string,app:string,kind:string,cursor:string|null){
 db.exec('BEGIN');
 try{
  const clock=db.prepare('SELECT seq,stamp FROM home_red_store_clock WHERE owner=? AND app=? AND kind=?').get(owner,app,kind);
  const anchor=cursor?db.prepare('SELECT seq FROM home_red_store_anchor WHERE owner=? AND app=? AND kind=? AND stamp=?').get(owner,app,kind,cursor):undefined;
  const reset=!anchor||!clock||Number(anchor.seq)>Number(clock.seq);
  const rows=reset?
   db.prepare('SELECT id,revision,deleted,updated,length(envelope) AS encodedBytes FROM home_red_store_record WHERE owner=? AND app=? AND kind=? ORDER BY id LIMIT 1025').all(owner,app,kind):
   db.prepare('SELECT r.id,r.revision,r.deleted,r.updated,length(r.envelope) AS encodedBytes FROM home_red_store_record r JOIN home_red_store_change c ON r.owner=c.owner AND r.app=c.app AND r.kind=c.kind AND r.id=c.id WHERE r.owner=? AND r.app=? AND r.kind=? AND c.seq>? ORDER BY c.seq,r.id LIMIT 1025').all(owner,app,kind,Number(anchor.seq));
  if(rows.length>1024)throw Error('RED store pilot record limit exceeded');
  const result={version:1,reset,cursor:typeof clock?.stamp==='string'?clock.stamp:null,items:rows};
  db.exec('COMMIT');return result;
 }catch(e){db.exec('ROLLBACK');throw e;}
}
