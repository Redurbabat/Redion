import type {DatabaseSync} from 'node:sqlite';
import {setTimeout as delay} from 'node:timers/promises';
import {randomUUID} from 'node:crypto';
import {werFragt} from '../kern.ts';
import type {Ablage} from '../typen.ts';

/** Durable invalidation markers only, never document contents. Triggers also
 * cover MCP transactions and roll back with the corresponding write. */
export function prepareHomeSync(db:DatabaseSync):void{
  db.exec(`
    CREATE TABLE IF NOT EXISTS home_sync_revision(
      bereich TEXT PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0
    );
    CREATE TRIGGER IF NOT EXISTS home_sync_insert AFTER INSERT ON saetze BEGIN
      INSERT INTO home_sync_revision(bereich,revision) VALUES(NEW.bereich,1)
      ON CONFLICT(bereich) DO UPDATE SET revision=revision+1;
    END;
    CREATE TRIGGER IF NOT EXISTS home_sync_update AFTER UPDATE ON saetze BEGIN
      INSERT INTO home_sync_revision(bereich,revision) VALUES(NEW.bereich,1)
      ON CONFLICT(bereich) DO UPDATE SET revision=revision+1;
    END;
    CREATE TRIGGER IF NOT EXISTS home_sync_delete AFTER DELETE ON saetze BEGIN
      INSERT INTO home_sync_revision(bereich,revision) VALUES(OLD.bereich,1)
      ON CONFLICT(bereich) DO UPDATE SET revision=revision+1;
    END;
  `);
}

export function createHomeSyncWait(db:DatabaseSync,ablage:Ablage){
  let active=0,closed=false;
  const epoch=randomUUID();
  const response=(status:number,body:Record<string,unknown>)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  async function handle(request:Request):Promise<Response>{
    if(request.method!=='GET')return response(405,{error:'method_not_allowed'});
    const url=new URL(request.url),area=url.searchParams.get('bereich')||'',cursor=url.searchParams.get('cursor');
    if(!area||area.length>128||cursor!==null&&(cursor.length>100||!/^[a-f0-9-]{36}:\d+$/.test(cursor)))return response(400,{error:'invalid_cursor_or_workspace'});
    const raw=url.searchParams.get('wait')??'10';
    if(!/^\d{1,2}$/.test(raw)||Number(raw)>10)return response(400,{error:'invalid_wait'});
    if(active>=64||closed)return response(503,{error:'busy'});
    active++;
    const deadline=Date.now()+Number(raw)*1000;
    try{
      while(!closed&&!request.signal.aborted){
        const user=await werFragt(ablage,{authorization:request.headers.get('authorization')??''});
        if(!user?.sitzung)return response(401,{error:'unauthorized'});
        // Single-owner home service. No metadata about foreign workspaces.
        const workspace=db.prepare('SELECT id FROM bereiche WHERE id=? AND besitzer=?').get(area,String(user.konto.id));
        if(!workspace)return response(404,{error:'not_found'});
        const revision=db.prepare('SELECT revision FROM home_sync_revision WHERE bereich=?').get(area)?.revision??0;
        const current=epoch+':'+String(revision);
        if(cursor===null||cursor!==current||Date.now()>=deadline)return response(200,{cursor:current,changed:cursor!==current});
        await delay(Math.min(200,Math.max(1,deadline-Date.now())),undefined,{signal:request.signal});
      }
      return response(503,{error:'closed'});
    }catch(error){
      if(request.signal.aborted||closed)return response(503,{error:'closed'});
      throw error;
    }finally{active--;}
  }
  return {handle,close:()=>{closed=true;}};
}
