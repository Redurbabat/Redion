import type {DatabaseSync} from 'node:sqlite';
import type {Ablage} from '../typen.ts';
import {werFragt} from '../kern.ts';
import {createMcpOAuth,MCP_SCOPES,OAuthError} from '../mcp/oauth.ts';
import {mcpStateD1,type McpDatabase} from '../mcp/state.ts';
import {leseBegrenzt} from '../sicherheit/eingaben.ts';

export const MCP_HUB_ROUTES=['/home/mcp-hub/connections','/home/mcp-hub/revoke'] as const;
const LIMIT=128;
const validId=(value:unknown):value is string=>typeof value==='string'&&/^grant:[a-f0-9]{64}$/.test(value);
const reply=(status:number,body:unknown)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
/** Owner-device management of the existing Home MCP OAuth grants. Never
 * executes a tool or exposes tokens, workspace IDs, or client secrets. */
export function createHomeMcpHub(sqlite:DatabaseSync,db:McpDatabase,ablage:Ablage,origin:string,enabled:boolean){
 const oauth=createMcpOAuth({state:mcpStateD1(db),issuer:origin,resource:origin+'/mcp/cloud',authorizationEndpoint:origin+'/mcp/authorize',isUserActive:async id=>{const user=await ablage.hole('konten',{id});return !!user&&!user.gesperrt;}});
 return async(request:Request):Promise<Response>=>{
  const path=new URL(request.url).pathname,list=path===MCP_HUB_ROUTES[0];
  if(!(MCP_HUB_ROUTES as readonly string[]).includes(path))return reply(404,{error:'not_found'});
  if(request.method!==(list?'GET':'POST'))return reply(405,{error:'method_not_allowed'});
  const who=await werFragt(ablage,{authorization:request.headers.get('authorization')??''});
  if(!who?.sitzung)return reply(401,{error:'unauthorized'});
  const owner=String(who.konto.id),now=Date.now();
  if(list){
   const rows=sqlite.prepare("SELECT g.key AS id,g.data AS grant,c.data AS client FROM mcp_state g LEFT JOIN mcp_state c ON c.key='client:'||json_extract(g.data,'$.clientId') AND c.kind='client' AND c.expires>? WHERE g.kind='grant' AND g.expires>? AND json_extract(g.data,'$.userId')=? AND json_extract(g.data,'$.active')=1 ORDER BY g.key LIMIT ?").all(now,now,owner,LIMIT+1);
   const connections=rows.slice(0,LIMIT).map(row=>{
    const grant=JSON.parse(String(row.grant)),client=row.client===null?null:JSON.parse(String(row.client));
    return {id:String(row.id),clientName:typeof client?.name==='string'?client.name.slice(0,120):'Nicht mehr registrierter Client',scopes:MCP_SCOPES.filter(scope=>Array.isArray(grant.scopes)&&grant.scopes.includes(scope)),workspaceCount:Array.isArray(grant.workspaceIds)?grant.workspaceIds.length:0,remember:grant.remember===true};
   });
   return reply(200,{version:1,enabled,connections,truncated:rows.length>LIMIT});
  }
  if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')return reply(400,{error:'invalid_request'});
  let input:unknown;
  try{const bytes=await leseBegrenzt(request.body,1024);if(!bytes)return reply(400,{error:'invalid_request'});input=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{return reply(400,{error:'invalid_request'});}
  if(!input||typeof input!=='object'||Array.isArray(input))return reply(400,{error:'invalid_request'});
  const v=input as Record<string,unknown>;
  if(Object.keys(v).length!==2||!validId(v.id)||v.confirm!==true)return reply(400,{error:'invalid_request'});
  try{await oauth.revokeGrant(owner,v.id);return reply(200,{ok:true});}
  catch(error){if(error instanceof OAuthError&&error.error==='invalid_request')return reply(404,{error:'not_found'});return reply(503,{error:'revoke_failed'});}
 };
}
