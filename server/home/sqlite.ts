import {DatabaseSync,type SQLInputValue} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {SCHEMA,ablageD1} from '../ablage.ts';
import type {McpDatabase,McpStatement} from '../mcp/state.ts';

/** D1-compatible adapter. A batch executes synchronously in one transaction. */
export function openHomeDatabase(filename:string) {
  mkdirSync(dirname(filename),{recursive:true,mode:0o700});
  const sqlite=new DatabaseSync(filename);
  try {
    sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;');
    sqlite.exec(SCHEMA);
    sqlite.exec(readFileSync(new URL('../mcp/schema.sql',import.meta.url),'utf8'));
  } catch(error) {sqlite.close();throw error;}
  const prepared=new WeakMap<object,()=>Record<string,unknown>[]>();
  function statement(sql:string,values:SQLInputValue[]=[]): McpStatement & {run():Promise<unknown>} {
    const args=()=>/\?\d+/.test(sql)?[Object.fromEntries(values.map((v,i)=>['?'+(i+1),v]))]:values;
    const rows=()=>sqlite.prepare(sql).all(...args()) as Record<string,unknown>[];
    const stmt={
      bind(...next:SQLInputValue[]){return statement(sql,next);},
      async first<T>(){return (sqlite.prepare(sql).get(...args()) as T|undefined)??null;},
      async all<T>(){return {results:rows() as T[]};},
      async run(){return sqlite.prepare(sql).run(...args());}
    };
    prepared.set(stmt,rows);
    return stmt;
  }
  const db:McpDatabase={prepare:statement,async batch(statements){
    sqlite.exec('BEGIN IMMEDIATE');
    try {
      const result=statements.map(s=>{
        const run=prepared.get(s);
        if(!run)throw new Error('Foreign prepared statement');
        return {success:true,results:run()};
      });
      sqlite.exec('COMMIT');
      return result;
    } catch(error){sqlite.exec('ROLLBACK');throw error;}
  }};
  return {db,sqlite,ablage:{...ablageD1(db),art:'sqlite'},close:()=>sqlite.close()};
}
