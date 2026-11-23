/** Dauerhafte MCP-Freigaben in derselben D1-Datenbank wie der vorhandene Sync. */
export type StateRow<T>={key:string;kind:string;data:T;expires:number;revision:number};
export interface McpState {
  read<T>(key:string):Promise<StateRow<T>|null>;
  create<T>(key:string,kind:string,data:T,expires:number):Promise<boolean>;
  replace<T>(row:StateRow<T>,data:T,expires?:number):Promise<boolean>;
  consume<T>(row:StateRow<T>):Promise<boolean>;
  list<T>(kind:string):Promise<StateRow<T>[]>;
  prune(limit?:number):Promise<number>;
}
type SqlRow={key:string;kind:string;data:string;expires:number;revision:number};
export type McpStatement={bind(...values:(string|number)[]):McpStatement;first<T>():Promise<T|null>;all<T>():Promise<{results:T[]}>};
/** D1.batch runs all prepared statements atomically. If a test database lacks
 * batch support, write tools must fail closed rather than creating orphan rows.
 * The optional method allows older read-only tests to use simple adapters. */
export type McpDatabase={prepare(sql:string):McpStatement;
  batch?:(statements:McpStatement[])=>Promise<Array<{results?:unknown[];success?:boolean}>>};
const valid=(key:string,kind?:string):void=>{
  if(!/^[a-z_]{1,30}:[A-Za-z0-9_-]{1,128}$/.test(key)||kind!==undefined&&!/^[a-z_]{1,30}$/.test(kind))throw new Error('Ungültige interne MCP-Kennung.');
};
const encode=(data:unknown,expires:number):string=>{
  const encoded=JSON.stringify(data);
  if(!encoded||new TextEncoder().encode(encoded).byteLength>16384||!Number.isSafeInteger(expires)||expires<1)throw new Error('Ungültiger MCP-Zustand.');
  return encoded;
};
export const mcpStateD1=(db:McpDatabase,now:()=>number=Date.now):McpState=>{
  const decode=<T>(row:SqlRow):StateRow<T>=>({...row,data:JSON.parse(row.data) as T});
  return {
    async read<T>(key:string){valid(key);const row=await db.prepare('SELECT * FROM mcp_state WHERE key=?1 AND expires>?2').bind(key,now()).first<SqlRow>();return row?decode<T>(row):null;},
    async create(key,kind,data,expires){valid(key,kind);if(expires<=now())throw new Error('MCP-Zustand ist bereits abgelaufen.');return !!await db.prepare('INSERT INTO mcp_state(key,kind,data,expires,revision) VALUES(?1,?2,?3,?4,1) ON CONFLICT(key) DO UPDATE SET kind=excluded.kind,data=excluded.data,expires=excluded.expires,revision=mcp_state.revision+1 WHERE mcp_state.expires<=?5 RETURNING key').bind(key,kind,encode(data,expires),expires,now()).first();},
    async replace(row,data,expires=row.expires){valid(row.key,row.kind);return !!await db.prepare('UPDATE mcp_state SET data=?1,expires=?2,revision=revision+1 WHERE key=?3 AND revision=?4 AND expires>?5 AND expires=?6 RETURNING key').bind(encode(data,expires),expires,row.key,row.revision,now(),row.expires).first();},
    async consume(row){valid(row.key,row.kind);return !!await db.prepare('DELETE FROM mcp_state WHERE key=?1 AND revision=?2 AND expires>?3 AND expires=?4 RETURNING key').bind(row.key,row.revision,now(),row.expires).first();},
    async list<T>(kind:string){valid('kind:lookup',kind);const rows=await db.prepare('SELECT * FROM mcp_state WHERE kind=?1 AND expires>?2 ORDER BY key LIMIT 1000').bind(kind,now()).all<SqlRow>();return rows.results.map(row=>decode<T>(row));},
    async prune(limit=100){if(!Number.isSafeInteger(limit)||limit<1||limit>1000)throw new Error('Ungültige Aufräumgrenze.');const rows=await db.prepare('DELETE FROM mcp_state WHERE key IN (SELECT key FROM mcp_state WHERE expires<=?1 ORDER BY expires LIMIT ?2) RETURNING key').bind(now(),limit).all<{key:string}>();return rows.results.length;}
  };
};
