import type {DatabaseSync} from 'node:sqlite';
import {SCHEMA} from '../../server/ablage.ts';
import type {CloudDatabase,CloudStatement,SqlValue} from '../../server/mcp/repository.ts';
import type {Satz} from '../../server/typen.ts';

export const cloudDatabase=(sqlite:DatabaseSync)=>{
  sqlite.exec(SCHEMA);let beforeBatch:(()=>void)|null=null,failAfter:number|null=null,failRecordWrites:number|null=null,lastAbortedWrites=0;
  const sqlOf=new WeakMap<CloudStatement,string>();
  const database:CloudDatabase={prepare(sql:string):CloudStatement{
    let values:SqlValue[]=[];
    const bound=()=>Object.fromEntries(values.map((value,index)=>['?'+(index+1),value]));
    const statement:CloudStatement={bind(...next){values=next;return this;},async first<T>(){
      const prepared=sqlite.prepare(sql);return ((/\?\d+/.test(sql)?prepared.get(bound()):prepared.get(...values)) as T|undefined)??null;},
      async all<T>(){const prepared=sqlite.prepare(sql);return {results:(/\?\d+/.test(sql)?prepared.all(bound()):prepared.all(...values)) as T[]};}};
    sqlOf.set(statement,sql);return statement;
  },async batch(statements:CloudStatement[]){
    const hook=beforeBatch;beforeBatch=null;hook?.();
    sqlite.exec('BEGIN');const result:{results:Satz[]}[]=[];let recordWrites=0;
    try{
      for(const [index,statement] of statements.entries()){
        result.push(await statement.all<Satz>());if(failAfter===index+1){failAfter=null;throw new Error('synthetic disk failure');}
        if(/^INSERT OR REPLACE INTO saetze\(/.test(sqlOf.get(statement)??''))recordWrites++;
        if(failRecordWrites===recordWrites&&recordWrites>0){lastAbortedWrites=recordWrites;failRecordWrites=null;throw new Error('synthetic failure after record writes');}
      }
      sqlite.exec('COMMIT');return result;
    }catch(error){sqlite.exec('ROLLBACK');throw error;}
  }};
  return {database,beforeNextBatch:(hook:()=>void)=>{beforeBatch=hook;},failAfter:(count:number)=>{failAfter=count;},
    failAfterRecordWrites:(count:number)=>{failRecordWrites=count;},lastAbortedWrites:()=>lastAbortedWrites};
};
