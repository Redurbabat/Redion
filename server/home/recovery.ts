import type {DatabaseSync} from 'node:sqlite';
/** Local, offline-only credential reset. Never exposed by HTTP or MCP.
 * Keep user data, encrypted objects, documents and blob files unchanged.
 * All accounts on this private server must re-pair. */
export function resetHomeAccess(db:DatabaseSync,confirmation:string){
 if(confirmation!=='--offline-confirmed-reset-all-access')throw Error('Explicit offline reset confirmation required');
 db.exec('BEGIN IMMEDIATE');
 try{
  const tables=['sitzungen','marken','home_red_id','home_red_session','home_red_pair','home_red_refresh_used','home_red_share_grant','home_red_share_message','home_red_store_grant','mcp_state','home_consent'] as const;
  const removed:Record<string,number>={};
  for(const table of tables){
   // Optional consent table can be absent when MCP has never been enabled.
   if(table==='home_consent'&&!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='home_consent'").get())continue;
   removed[table]=Number(db.prepare('DELETE FROM '+table).run().changes);
  }
  // Keep used approval tombstones until expiration so captured old requests
  // cannot immediately be approved again. They do not authorize a claim.
  removed.pendingApprovals=Number(db.prepare('UPDATE home_red_login SET used=1 WHERE used=0').run().changes);
  db.exec('COMMIT');
  return {version:1,removed,dataPreserved:true};
 }catch(error){db.exec('ROLLBACK');throw error;}
}
