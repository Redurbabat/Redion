import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {mcpStateD1,type McpDatabase} from '../../server/mcp/state.ts';
import {createMcpOAuth} from '../../server/mcp/oauth.ts';
import {createMcpOAuthHttp,type CloudUser} from '../../server/mcp/oauth-http.ts';

export const cloudFixture=(options:{issuer?:string;authorizationEndpoint?:string}={})=>{
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync(new URL('../../server/mcp/schema.sql',import.meta.url),'utf8'));
  const database:McpDatabase={prepare(sql){let values:(string|number)[]=[];
    const params=()=>Object.fromEntries(values.map((value,index)=>['?'+(index+1),value]));
    return {bind(...next){values=next;return this;},async first<T>(){return (sqlite.prepare(sql).get(params()) as T|undefined)??null;},
      async all<T>(){return {results:sqlite.prepare(sql).all(params()) as T[]};}};}};
  let time=Date.parse('2026-11-18T12:00:00Z');let user:CloudUser|null={id:'owner',workspaces:[{id:'workspace-one',name:'Künstlicher Unterricht',canWrite:true}]};
  const state=mcpStateD1(database,()=>time);
  const issuer=options.issuer??'https://mcp.example.test';
  const oauth=createMcpOAuth({state,issuer,resource:issuer+'/mcp',
    authorizationEndpoint:options.authorizationEndpoint??'https://app.example.test/mcp/authorize',now:()=>time});
  const route=createMcpOAuthHttp({state,oauth,identify:async()=>user,rateKey:()=> 'synthetic-source',now:()=>time});
  const fetcher=async(input:string|URL|Request,init?:RequestInit):Promise<Response>=>{
    const request=new Request(input,init);return await route(request)??new Response('Not found',{status:404});
  };
  return {state,oauth,route,fetcher,sqlite,now:()=>time,tick:(ms:number)=>{time+=ms;},user:(next:CloudUser|null)=>{user=next;},close:()=>sqlite.close()};
};
export const hidden=(html:string,name:string):string=>{
  const match=html.match(new RegExp('name="'+name+'" value="([A-Za-z0-9_:-]+)"'));
  if(!match)throw new Error('Expected hidden field '+name);return match[1]!;
};
