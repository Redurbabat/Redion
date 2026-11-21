/* RED Ion Cloud-MCP: OAuth-Zustand, keine zweite Dokumentablage.
 * Der Aufrufer liefert die bereits verifizierte Konto-ID. Ein Header oder
 * ein vom Client gesendeter Benutzername ist niemals eine Anmeldung.
 * Codes und Tokens sind zufällig; in D1 stehen ausschliesslich ihre Hashes.
 */
import type {McpState,StateRow} from './state.ts';

export const MCP_SCOPES=['redion:read','redion:write','redion:images'] as const;
type Scope=typeof MCP_SCOPES[number];
type Input=Record<string,unknown>;
type Client={id:string;name:string;redirects:string[];method:'none'|'client_secret_post';secretHash:string|null;resource:string;grants:string[]};
type Grant={userId:string;clientId:string;epoch:string;active:boolean;remember:boolean;scopes:Scope[];workspaceIds:string[]};
type Pending={userId:string;clientId:string;redirect:string;scope:Scope[];challenge:string;state:string;csrfHash:string};
type Code={grantKey:string;epoch:string;clientId:string;redirect:string;challenge:string;scopes:Scope[]};
type Family={grantKey:string;epoch:string;clientId:string;active:boolean;accessHash:string;refreshHash:string;accessUntil:number;scopes:Scope[]};
type TokenIndex={familyKey:string};
export type McpPrincipal={userId:string;clientId:string;grantId:string;scopes:Scope[];workspaceIds:string[]};
export type ConsentDecision={allow:boolean;remember:boolean;workspaceIds:string[];allowWrite?:boolean};
export type AuthorizationStart={kind:'redirect';redirect:string}|{kind:'consent';requestId:string;csrf:string;
  clientName:string;redirectUri:string;scopes:Scope[]};

export class OAuthError extends Error {
  readonly error:string;
  constructor(error:string){super(error);this.name='OAuthError';this.error=error;}
}
const fail=(error:string):never=>{throw new OAuthError(error);};
const DAY=86400000,MINUTE=60000,PERSISTENT=Number.MAX_SAFE_INTEGER;
const text=(value:unknown,max=2048):string=>typeof value==='string'&&value.length<=max?value:'';
const b64=(bytes:Uint8Array):string=>btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const random=():string=>b64(crypto.getRandomValues(new Uint8Array(32)));
export const pkceChallenge=async(value:string):Promise<string>=>b64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));
const hash=async(value:string):Promise<string>=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
/* Verglichen werden gleich lange Fingerabdrücke, ohne Abbruch am ersten Byte. */
const equal=(a:string,b:string):boolean=>{if(a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0;};
const scopeOf=(value:unknown):Scope[]=>{
  const raw=text(value,200);const scopes=[...new Set(raw.trim().split(/\s+/).filter(Boolean))];
  if(!scopes.length||scopes.some(s=>!MCP_SCOPES.includes(s as Scope)))return fail('invalid_scope');
  if(!scopes.includes('redion:read'))return fail('invalid_scope');
  return scopes as Scope[];
};
const validId=(id:string):boolean=>/^[A-Za-z0-9_-]{1,128}$/.test(id);
const redirectOf=(value:unknown):string=>{
  const raw=text(value);let url:URL;try{url=new URL(raw);}catch{return fail('invalid_redirect_uri');}
  const loopback=url.protocol==='http:'&&['127.0.0.1','[::1]'].includes(url.hostname);
  if((url.protocol!=='https:'&&!loopback)||url.username||url.password||url.hash||!url.hostname||
    /[\x00-\x20\x7f]/.test(raw)||raw.includes('*'))return fail('invalid_redirect_uri');
  /* Exakte Zeichenfolge speichern und vergleichen, auch Query und Slash. */
  return raw;
};
const publicToken=(prefix:string):string=>prefix+random();

export const createMcpOAuth=({state,issuer,resource,authorizationEndpoint=issuer+'/authorize',now=Date.now,isUserActive=async()=>true}:{state:McpState;issuer:string;resource:string;authorizationEndpoint?:string;now?:()=>number;isUserActive?:(userId:string)=>Promise<boolean>})=>{
  const issuerUrl=new URL(issuer),resourceUrl=new URL(resource);
  if(issuerUrl.protocol!=='https:'||resourceUrl.protocol!=='https:'||issuerUrl.origin!==issuer||issuerUrl.search||issuerUrl.hash||
    resourceUrl.origin!==issuer||resourceUrl.search||resourceUrl.hash)throw new Error('Ungültige Cloud-MCP-Adresse.');
  const authUrl=new URL(authorizationEndpoint);
  if(authUrl.protocol!=='https:'||authUrl.search||authUrl.hash||authUrl.username||authUrl.password)throw new Error('Ungültige Anmeldeadresse.');
  /* Auch verschiedene MCP-Ressourcen auf derselben D1 dürfen Tokens nicht
   * gegenseitig annehmen. Der Fingerabdruck enthält die vollständige Audience.
   * Alte ungebundene Anmeldungen verlangen eine neue Registrierung. */
  const fingerprint=(value:string):Promise<string>=>hash(resource+'\0'+value);
  const grantKey=async(userId:string,clientId:string):Promise<string>=>'grant:'+await fingerprint(userId+'\0'+clientId);
  const clientFor=async(id:string):Promise<Client>=>{
    if(!validId(id))return fail('invalid_client');
    const row=await state.read<Client>('client:'+id);
    return row?.data.resource===resource?row.data:fail('invalid_client');
  };
  const requireResource=(input:Input):void=>{if(input.resource!==resource)fail('invalid_target');};
  const requireClient=async(input:Input):Promise<Client>=>{
    const client=await clientFor(text(input.client_id,128));
    if(client.method==='client_secret_post'){
      const supplied=await hash(text(input.client_secret,200));
      if(!client.secretHash||!equal(supplied,client.secretHash))return fail('invalid_client');
    }else if(input.client_secret!==undefined)return fail('invalid_client');
    return client;
  };
  const redirect=(uri:string,clientState:string,values:Record<string,string>):string=>{
    const url=new URL(uri);for(const [key,value] of Object.entries(values))url.searchParams.set(key,value);
    if(clientState)url.searchParams.set('state',clientState);url.searchParams.set('iss',issuer);return url.href;
  };
  const activeGrant=async(key:string,epoch:string):Promise<StateRow<Grant>|null>=>{
    const row=await state.read<Grant>(key);
    return row?.data.active&&row.data.epoch===epoch&&await isUserActive(row.data.userId)?row:null;
  };
  const codeFor=async(pending:Pending,key:string,epoch:string):Promise<string>=>{
    const code=publicToken('rim_ac_');
    if(!await state.create('code:'+await fingerprint(code),'code',{grantKey:key,epoch,clientId:pending.clientId,
      redirect:pending.redirect,challenge:pending.challenge,scopes:pending.scope} satisfies Code,now()+5*MINUTE))throw new Error('Code konnte nicht angelegt werden.');
    return redirect(pending.redirect,pending.state,{code});
  };
  const revokeFamily=async(key:string):Promise<void>=>{
    for(let i=0;i<4;i++){
      const row=await state.read<Family>(key);if(!row||!row.data.active)return;
      if(await state.replace(row,{...row.data,active:false}))return;
    }
    throw new Error('Sitzung konnte nicht widerrufen werden.');
  };
  const tokenPair=async(family:StateRow<Family>|null,code:Code,allowRefresh:boolean):Promise<{access_token:string;refresh_token?:string;token_type:'Bearer';expires_in:number;scope:string}>=>{
    const grant=await activeGrant(code.grantKey,code.epoch);if(!grant||code.scopes.some(s=>!grant.data.scopes.includes(s)))return fail('invalid_grant');
    const access=publicToken('rim_at_'),refresh=allowRefresh?publicToken('rim_rt_'):null;
    const accessHash=await fingerprint(access),refreshHash=refresh?await fingerprint(refresh):'',accessUntil=now()+15*MINUTE;
    const data:Family={grantKey:code.grantKey,epoch:code.epoch,clientId:code.clientId,active:true,accessHash,refreshHash,accessUntil,scopes:code.scopes};
    const key=family?.key??'family:'+random();const until=allowRefresh?now()+30*DAY:accessUntil;
    if(family){if(!await state.replace(family,data,until)){await revokeFamily(key);return fail('invalid_grant');}}
    else if(!await state.create(key,'family',data,until))throw new Error('Sitzung konnte nicht angelegt werden.');
    try{
      if(!await state.create('access:'+accessHash,'access',{familyKey:key} satisfies TokenIndex,Math.min(accessUntil,until))||
        refresh&&!await state.create('refresh:'+refreshHash,'refresh',{familyKey:key} satisfies TokenIndex,until))throw new Error('Token konnte nicht angelegt werden.');
    }catch(error){await revokeFamily(key);throw error;}
    return {access_token:access,...(refresh?{refresh_token:refresh}:{}),token_type:'Bearer',expires_in:Math.floor(Math.min(15*MINUTE,until-now())/1000),scope:code.scopes.join(' ')};
  };
  return {
    metadata(){return {issuer,authorization_endpoint:authorizationEndpoint,token_endpoint:issuer+'/token',registration_endpoint:issuer+'/register',
      revocation_endpoint:issuer+'/revoke',revocation_endpoint_auth_methods_supported:['none','client_secret_post'],response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],
      token_endpoint_auth_methods_supported:['none','client_secret_post'],code_challenge_methods_supported:['S256'],
      scopes_supported:[...MCP_SCOPES],authorization_response_iss_parameter_supported:true};},
    resourceMetadata(){return {resource,authorization_servers:[issuer],scopes_supported:[...MCP_SCOPES],bearer_methods_supported:['header'],resource_name:'RED Ion'};},
    async register(input:Input){
      if(input.client_name!==undefined&&(typeof input.client_name!=='string'||input.client_name.length>100||/[\x00-\x1f\x7f]/.test(input.client_name)))return fail('invalid_client_metadata');
      const name=text(input.client_name,100).trim()||'KI-Client (nicht benannt)';
      if(!Array.isArray(input.redirect_uris)||!input.redirect_uris.length||input.redirect_uris.length>5)return fail('invalid_client_metadata');
      const redirects=[...new Set(input.redirect_uris.map(redirectOf))];
      const method=input.token_endpoint_auth_method===undefined?'none':input.token_endpoint_auth_method;
      if(method!=='none'&&method!=='client_secret_post')return fail('invalid_client_metadata');
      const requested=input.grant_types===undefined?['authorization_code']:input.grant_types;
      if(!Array.isArray(requested)||!requested.includes('authorization_code')||requested.some(g=>!['authorization_code','refresh_token'].includes(g)))return fail('invalid_client_metadata');
      const grants=[...new Set(requested)] as string[];
      if(input.response_types!==undefined&&(!Array.isArray(input.response_types)||!input.response_types.length||input.response_types.some(r=>r!=='code')))return fail('invalid_client_metadata');
      if((await state.list<Client>('client')).length>=1000)return fail('temporarily_unavailable');
      const id='mcp_'+random(),secret=method==='client_secret_post'?publicToken('rim_cs_'):null;
      const client:Client={id,name,redirects,method,secretHash:secret?await hash(secret):null,resource,grants};
      if(!await state.create('client:'+id,'client',client,PERSISTENT))throw new Error('Client konnte nicht angelegt werden.');
      return {client_id:id,client_name:name,redirect_uris:redirects,token_endpoint_auth_method:method,
        grant_types:grants,response_types:['code'],client_id_issued_at:Math.floor(now()/1000),
        ...(secret?{client_secret:secret,client_secret_expires_at:0}:{})};
    },
    async begin(userId:string,input:Input):Promise<AuthorizationStart>{
      if(!validId(userId))return fail('access_denied');
      const client=await clientFor(text(input.client_id,128));
      const redirectUri=text(input.redirect_uri);if(!client.redirects.includes(redirectUri))return fail('invalid_request');
      requireResource(input);if(input.response_type!=='code'||input.code_challenge_method!=='S256'||
        !/^[A-Za-z0-9_-]{43}$/.test(text(input.code_challenge,43)))return fail('invalid_request');
      if(input.state!==undefined&&(typeof input.state!=='string'||input.state.length>512))return fail('invalid_request');
      if(input.prompt!==undefined&&input.prompt!=='consent')return fail('invalid_request');
      const scopes=scopeOf(input.scope??'redion:read');
      const pending:Pending={userId,clientId:client.id,redirect:redirectUri,scope:scopes,
        challenge:String(input.code_challenge),state:text(input.state,512),csrfHash:''};
      const key=await grantKey(userId,client.id),grant=await state.read<Grant>(key);
      if(input.prompt!=='consent'&&grant?.data.active&&grant.data.remember&&scopes.every(s=>grant.data.scopes.includes(s)))
        return {kind:'redirect',redirect:await codeFor(pending,key,grant.data.epoch)};
      const id=random(),csrf=random();pending.csrfHash=await hash(csrf);
      if(!await state.create('pending:'+id,'pending',pending,now()+10*MINUTE))throw new Error('Freigabe konnte nicht vorbereitet werden.');
      return {kind:'consent',requestId:id,csrf,clientName:client.name,redirectUri,scopes};
    },
    async approve(userId:string,requestId:string,csrf:string,decision:ConsentDecision){
      if(!validId(requestId))return fail('invalid_request');
      const pending=await state.read<Pending>('pending:'+requestId);
      if(!pending||pending.data.userId!==userId||!equal(await hash(text(csrf,100)),pending.data.csrfHash))return fail('invalid_request');
      const workspaces=[...new Set(decision.workspaceIds)];
      if(typeof decision.allow!=='boolean'||typeof decision.remember!=='boolean'||workspaces.length>20||
        workspaces.some(id=>!validId(id))||decision.allow&&!workspaces.length)return fail('invalid_request');
      /* Schreiben bleibt AUS, bis der Mensch genau dieses Recht bei
       * der Verbindung ausdrücklich gewählt hat. Ein Client kann es weder
       * über eine Leseanfrage noch beim Refresh nachfordern. */
      if(decision.allowWrite!==undefined&&typeof decision.allowWrite!=='boolean')return fail('invalid_request');
      if(decision.allowWrite===true&&!pending.data.scope.includes('redion:write'))return fail('invalid_scope');
      const approvedScopes=pending.data.scope.filter(s=>s!=='redion:write'||decision.allowWrite===true);
      if(!await state.consume(pending))return fail('invalid_request');
      if(!decision.allow)return {redirect:redirect(pending.data.redirect,pending.data.state,{error:'access_denied'})};
      const key=await grantKey(userId,pending.data.clientId),previous=await state.read<Grant>(key),epoch=random();
      const grant:Grant={userId,clientId:pending.data.clientId,epoch,active:true,remember:decision.remember,
        scopes:approvedScopes,workspaceIds:workspaces};
      const expires=decision.remember?PERSISTENT:now()+30*DAY;
      if(previous?!await state.replace(previous,grant,expires):!await state.create(key,'grant',grant,expires))return fail('temporarily_unavailable');
      return {redirect:await codeFor({...pending.data,scope:approvedScopes},key,epoch)};
    },
    async exchange(input:Input){
      requireResource(input);const client=await requireClient(input);
      if(!['authorization_code','refresh_token'].includes(String(input.grant_type)))return fail('unsupported_grant_type');
      if(!client.grants.includes(String(input.grant_type)))return fail('unauthorized_client');
      if(input.grant_type==='authorization_code'){
        const raw=text(input.code,100);if(!/^rim_ac_[A-Za-z0-9_-]{43}$/.test(raw))return fail('invalid_grant');
        const code=await state.read<Code>('code:'+await fingerprint(raw));
        if(!code||code.data.clientId!==client.id||code.data.redirect!==input.redirect_uri)return fail('invalid_grant');
        const verifier=text(input.code_verifier,128);if(!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)||
          !equal(await pkceChallenge(verifier),code.data.challenge))return fail('invalid_grant');
        if(!await state.consume(code))return fail('invalid_grant');
        return tokenPair(null,code.data,client.grants.includes('refresh_token'));
      }
      if(input.grant_type==='refresh_token'){
        const raw=text(input.refresh_token,100);if(!/^rim_rt_[A-Za-z0-9_-]{43}$/.test(raw))return fail('invalid_grant');
        const tokenHash=await fingerprint(raw),index=await state.read<TokenIndex>('refresh:'+tokenHash);
        const family=index?await state.read<Family>(index.data.familyKey):null;
        if(!family||!family.data.active||family.data.clientId!==client.id)return fail('invalid_grant');
        if(!equal(tokenHash,family.data.refreshHash)){await revokeFamily(family.key);return fail('invalid_grant');}
        const grant=await activeGrant(family.data.grantKey,family.data.epoch);if(!grant)return fail('invalid_grant');
        /* Refresh darf Rechte verringern, die gespeicherte Freigabe aber
         * weder erweitern noch eine Verringerung wieder rückgängig machen. */
        const scopes=input.scope===undefined?family.data.scopes:scopeOf(input.scope);
        if(scopes.some(s=>!family.data.scopes.includes(s)))return fail('invalid_scope');
        return tokenPair(family,{grantKey:family.data.grantKey,epoch:family.data.epoch,clientId:client.id,redirect:'',challenge:'',scopes},true);
      }
      return fail('unsupported_grant_type');
    },
    async authenticate(accessToken:string):Promise<McpPrincipal|null>{
      if(!/^rim_at_[A-Za-z0-9_-]{43}$/.test(accessToken))return null;
      const tokenHash=await fingerprint(accessToken),index=await state.read<TokenIndex>('access:'+tokenHash);
      const family=index?await state.read<Family>(index.data.familyKey):null;
      if(!family?.data.active||family.data.accessUntil<=now()||!equal(tokenHash,family.data.accessHash))return null;
      const grant=await activeGrant(family.data.grantKey,family.data.epoch);
      if(!grant||(await state.read<Client>('client:'+family.data.clientId))?.data.resource!==resource)return null;
      return {userId:grant.data.userId,clientId:grant.data.clientId,grantId:grant.key,scopes:[...family.data.scopes],workspaceIds:[...grant.data.workspaceIds]};
    },
    async listGrants(userId:string){
      const rows=await state.list<Grant>('grant');
      return Promise.all(rows.filter(row=>row.data.userId===userId&&row.data.active).map(async row=>({id:row.key,clientId:row.data.clientId,
        clientName:(await state.read<Client>('client:'+row.data.clientId))?.data.name??'Nicht mehr registrierter Client',
        scopes:[...row.data.scopes],workspaceIds:[...row.data.workspaceIds],remember:row.data.remember})));
    },
    async revokeGrant(userId:string,id:string){
      if(!/^grant:[a-f0-9]{64}$/.test(id))return fail('invalid_request');
      for(let i=0;i<4;i++){
        const row=await state.read<Grant>(id);if(!row||row.data.userId!==userId)return fail('invalid_request');
        if(!row.data.active)return;
        if(await state.replace(row,{...row.data,active:false,epoch:random()}))return;
      }
      return fail('temporarily_unavailable');
    },
    async revokeToken(input:Input){
      const client=await requireClient(input),raw=text(input.token,100);
      const kind=raw.startsWith('rim_rt_')?'refresh':raw.startsWith('rim_at_')?'access':null;
      if(!kind)return;const index=await state.read<TokenIndex>(kind+':'+await fingerprint(raw));
      const family=index?await state.read<Family>(index.data.familyKey):null;
      if(family?.data.clientId===client.id)await revokeFamily(family.key);
    }
  };
};
export type McpOAuth=ReturnType<typeof createMcpOAuth>;
