/* Stateless Cloudflare MCP transport + OAuth on the existing Redion D1.
 * Public protocol endpoints authenticate with OAuth; human consent and
 * grant management require a previously verified Cloudflare Access JWT.
 * No database binding or schema -> fail closed; never create paid resources.
 */
import {ablageD1} from '../ablage.ts';
import {rolleAuf,darf} from '../kern.ts';
import {torModus,nachweisAusAnfrage,zerlegeNachweis} from '../sicherheit/tor.ts';
import {createMcpOAuth} from './oauth.ts';
import {createMcpOAuthHttp} from './oauth-http.ts';
import {mcpStateD1,type McpDatabase} from './state.ts';
import {CloudMcpToolError,createCloudActions,visibleCloudTools} from './cloud-tools.ts';
import {leseBegrenzt} from '../sicherheit/eingaben.ts';

export type CloudMcpEnvironment={DB?:McpDatabase|null;TOR?:string;ACCESS_AUD?:string;ACCESS_TEAM?:string};
const publicPaths=new Set([
  '/.well-known/oauth-authorization-server',
  '/.well-known/oauth-protected-resource',
  '/.well-known/oauth-protected-resource/mcp/cloud',
  '/register','/token','/revoke','/mcp/cloud'
]);
const privatePaths=new Set(['/mcp/authorize','/mcp/settings']);
export const isCloudMcpPublicPath=(path:string)=>publicPaths.has(path);
export const isCloudMcpPrivatePath=(path:string)=>privatePaths.has(path);
const json=(body:unknown,status=200,headers:Record<string,string>={})=>
  new Response(JSON.stringify(body),{status,headers:{
    'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',...headers}});
const missing=()=>json({error:'cloud_mcp_unavailable',
  message:'RED ION Cloud-MCP benötigt eine bereits vorhandene D1-Bindung und das MCP-Schema.'},503);
const rpc=(id:string|number|null,result:unknown)=>json({jsonrpc:'2.0',id,result});
const rpcError=(id:string|number|null,code:number,message:string)=>json({jsonrpc:'2.0',id,error:{code,message}});
const bodyLimit=32768;
const protocolVersions=['2025-11-25','2025-06-18','2025-03-26'];

export const handleCloudMcp=async(request:Request,env:CloudMcpEnvironment,accessVerified=false):Promise<Response>=>{
  const url=new URL(request.url);
  const path=url.pathname;
  if(!publicPaths.has(path)&&!privatePaths.has(path))return json({error:'not_found'},404);
  if(!env.DB)return missing();
  if(!url.protocol.startsWith('https:'))return json({error:'https_required'},400);

  const db=env.DB;
  const ablage=ablageD1(db);
  const state=mcpStateD1(db);
  const issuer=url.origin;
  const resource=issuer+'/mcp/cloud';
  const oauth=createMcpOAuth({state,issuer,resource,authorizationEndpoint:issuer+'/mcp/authorize',
    isUserActive:async id=>{const user=await ablage.hole('konten',{id});return !!user&&!user.gesperrt;}});

  const identify=async(_request:Request)=>{
    /* The caller is the Worker AFTER torPruefen returned null under access
     * mode. JWT is only decoded here for the verified identity. It is NEVER
     * accepted as proof of identity from an open/public MCP route. */
    if(!accessVerified||torModus(env)!=='access')return null;
    const token=nachweisAusAnfrage(_request);
    const claim=zerlegeNachweis(token)?.nutz;
    const email=typeof claim?.email==='string'?claim.email.trim():'';
    if(!email||email.length>254)return null;
    const users=await ablage.finde('konten',{mail:email},{grenze:2});
    if(users.length!==1||users[0]!.gesperrt)return null;
    const user=users[0]!;
    const areas=await ablage.finde('bereiche',{besitzer:user.id},{grenze:20});
    const byId=new Map<string,{id:string;name:string;canWrite:boolean}>();
    for(const b of areas)byId.set(String(b.id),{id:String(b.id),name:String(b.name||''),canWrite:true});
    const shares=await ablage.finde('freigaben',{kontoId:user.id,seite:'*'},{grenze:40});
    for(const f of shares){
      if(byId.has(String(f.bereich))||f.rolle==='kein')continue;
      const b=await ablage.hole('bereiche',{id:String(f.bereich)});
      if(!b)continue;
      const role=await rolleAuf(ablage,String(b.id),'*',user.id);
      if(darf(role,'lesen'))byId.set(String(b.id),{
        id:String(b.id),name:String(b.name||''),canWrite:darf(role,'bearbeiten')});
    }
    return {id:String(user.id),workspaces:[...byId.values()].slice(0,20)};
  };
  try{
    if(path!=='/mcp/cloud'){
      const oauthHttp=createMcpOAuthHttp({
        oauth,state,identify,rateKey:req=>req.headers.get('cf-connecting-ip')||'unbekannt'});
      return await oauthHttp(request)??json({error:'not_found'},404);
    }
    if(request.headers.has('origin')&&request.headers.get('origin')!==issuer)
      return json({error:'invalid_origin'},403);
    if(!['GET','POST'].includes(request.method))
      return json({error:'method_not_allowed'},405,{Allow:'GET, POST'});
    const header=request.headers.get('authorization')||'';
    const match=/^Bearer (rim_at_[A-Za-z0-9_-]{43})$/.exec(header);
    const principal=match?await oauth.authenticate(match[1]!):null;
    /* Die Herausforderung fragt Lesen UND Schreiben an (Redur, 21. November
       2026: ChatGPT bekam mit scope="redion:read" nie Schreibwerkzeuge). Das
       erteilt kein Schreibrecht: auf der Zustimmungsseite ist „Schreiben
       erlauben" ausgeschaltet, bis der Mensch den Haken selbst setzt
       (oauth.ts, allowWrite). */
    if(!principal||!principal.scopes.includes('redion:read'))
      return json({error:'unauthorized',message:'Erneute OAuth-Anmeldung erforderlich.'},401,{
        'WWW-Authenticate':'Bearer resource_metadata="'+issuer+'/.well-known/oauth-protected-resource/mcp/cloud", scope="redion:read redion:write"'});
    /* A stateless MCP server does not provide a separate SSE GET stream. */
    if(request.method==='GET')return json({error:'method_not_allowed'},405,{Allow:'POST'});
    if(request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()!=='application/json')
      return json({error:'unsupported_media_type'},415);
    const accepted=(request.headers.get('accept')??'').split(',').map(v=>v.split(';')[0]!.trim());
    if(!accepted.includes('application/json')&&!accepted.includes('*/*'))
      return json({error:'not_acceptable'},406);
    const version=request.headers.get('mcp-protocol-version');
    if(version!==null&&!protocolVersions.includes(version))return json({error:'unsupported_protocol_version'},400);
    const bytes=await leseBegrenzt(request.body,bodyLimit);
    if(!bytes)return json({error:'request_too_large'},413);
    let payload:unknown;
    try{payload=JSON.parse(new TextDecoder().decode(bytes));}
    catch{return rpcError(null,-32700,'Ungültiges JSON.');}
    if(!payload||typeof payload!=='object'||Array.isArray(payload))
      return rpcError(null,-32600,'Ungültige JSON-RPC-Anfrage.');
    const p=payload as Record<string,unknown>;
    const method=typeof p.method==='string'?p.method:'';
    const id=typeof p.id==='string'||typeof p.id==='number'&&Number.isSafeInteger(p.id)?p.id:null;
    if(p.jsonrpc!=='2.0'||!method)return rpcError(id,-32600,'Ungültige JSON-RPC-Anfrage.');
    if(method.startsWith('notifications/')&&p.id===undefined)
      return new Response(null,{status:202,headers:{'Cache-Control':'no-store'}});
    if(id===null)return rpcError(null,-32600,'Anfragekennung fehlt oder ist ungültig.');
    if(method==='initialize'){
      const params=p.params as Record<string,unknown>|undefined;
      if(!params||typeof params!=='object'||Array.isArray(params)||typeof params.protocolVersion!=='string'||
        !params.capabilities||typeof params.capabilities!=='object'||Array.isArray(params.capabilities)||
        !params.clientInfo||typeof params.clientInfo!=='object'||Array.isArray(params.clientInfo))
        return rpcError(id,-32602,'Initialisierungsparameter fehlen.');
      return rpc(id,{
        protocolVersion:protocolVersions.includes(params.protocolVersion)?params.protocolVersion:protocolVersions[0],
        capabilities:{tools:{listChanged:false}},serverInfo:{name:'RED ION Cloud MCP',version:'1.0.1'}});
    }
    if(method==='ping')return rpc(id,{});
    if(method==='tools/list')return rpc(id,{tools:visibleCloudTools(principal)});
    if(method==='tools/call'){
      const params=p.params;
      if(!params||typeof params!=='object'||Array.isArray(params))
        return rpcError(id,-32602,'Werkzeugparameter fehlen.');
      const call=params as Record<string,unknown>;
      const name=typeof call.name==='string'?call.name:'';
      const args=call.arguments===undefined?{}:call.arguments;
      if(!args||typeof args!=='object'||Array.isArray(args))
        return rpcError(id,-32602,'Ungültige Argumente.');
      try{
        const result=await createCloudActions(ablage,db,principal)(name,args as Record<string,unknown>);
        return rpc(id,{content:[{type:'text',text:JSON.stringify(result)}]});
      }catch(error){
        if(error instanceof CloudMcpToolError)
          return rpc(id,{isError:true,content:[{type:'text',text:JSON.stringify({code:error.reason,message:error.message})}]});
        return rpc(id,{isError:true,content:[{type:'text',text:'Werkzeug konnte nicht ausgeführt werden.'}]});
      }
    }
    return rpcError(id,-32601,'Unbekannte Methode.');
  }catch(error){
    /* The state table is optional and might not have been provisioned yet.
     * Never leak D1 SQL errors or access tokens in the response. */
    return json({error:'cloud_mcp_unavailable',
      message:'Cloud-MCP ist noch nicht eingerichtet oder vorübergehend nicht erreichbar.'},503);
  }
};
