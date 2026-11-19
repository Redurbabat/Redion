/* Begrenzte HTTP-Grenze für OAuth. Läuft ohne Node, R2 oder laufenden Laptop.
 * identify() MUSS das vorhandene Kontotor prüfen. Client-Header liefern
 * keine Identität. Der Router nimmt nur bereits zugängliche Bereiche an.
 */
import {OAuthError,type McpOAuth} from './oauth.ts';
import type {McpState} from './state.ts';
import {leseBegrenzt} from '../sicherheit/eingaben.ts';

export type CloudUser={id:string;workspaces:{id:string;name:string;canWrite:boolean}[]};
const escape=(value:string):string=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const nonce=():string=>Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');
const hash=async(value:string):Promise<string>=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const headers={'Cache-Control':'no-store','Pragma':'no-cache','X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
const json=(body:unknown,status=200,extra:Record<string,string>={}):Response=>new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8',...extra}});
const redirect=(location:string):Response=>new Response(null,{status:303,headers:{...headers,Location:location}});
const labels:Record<string,string>={'redion:read':'Freigegebene Inhalte lesen','redion:write':'Freigegebene Inhalte bearbeiten',
  'redion:images':'Freigegebene Dokumentbilder lesen'};
const page=(title:string,body:string,status=200,callbackOrigin=''):Response=>{
  const styleNonce=nonce();
  return new Response('<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+escape(title)+' · RED Ion</title><style nonce="'+styleNonce+'">'+
    ':root{color-scheme:light dark;font-family:system-ui,sans-serif;background:light-dark(#f4f6fc,#14161c);color:light-dark(#182034,#eff2fa)}'+
    '*{box-sizing:border-box}body{margin:0;padding:32px 18px}main{max-width:620px;margin:3vh auto;background:light-dark(#fff,#20232d);padding:32px;border:1px solid light-dark(#d3dbea,#41495f);border-radius:24px}'+
    'h1{font-size:26px;line-height:1.25}p,li{line-height:1.6}small{display:block;line-height:1.6}code{overflow-wrap:anywhere}fieldset{border:1px solid light-dark(#d3dbea,#56617a);border-radius:12px;padding:12px 16px;margin:22px 0}'+
    'label{display:flex;align-items:start;gap:12px;min-height:44px;padding:10px 0}input{margin-top:5px;accent-color:#2259d1}button{font:inherit;min-height:44px;border-radius:12px;padding:10px 18px;border:1px solid light-dark(#7484a0,#8190ae);cursor:pointer;background:transparent;color:inherit}'+
    'button[value=allow]{background:#2259d1;color:#fff;border-color:#2259d1}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid light-dark(#003a99,#9fc0ff);outline-offset:3px}'+
    '.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}a{color:light-dark(#174faa,#b5ccff)}article{border-top:1px solid light-dark(#d3dbea,#56617a);padding:20px 0}'+
    '@media(max-width:480px){body{padding:12px}main{padding:22px;margin:0 auto}h1{font-size:24px}.actions button{flex:1}}'+
    '</style></head><body><main><small>RED ION · VERBINDUNGEN</small><h1>'+escape(title)+'</h1>'+body+'</main></body></html>',
    {status,headers:{...headers,'Content-Type':'text/html; charset=utf-8',
      /* no-referrer macht den Origin eines Browser-Formulars zu null.
       * same-origin erhält unsere CSRF-Prüfung und sendet beim Rückweg
       * zu einer fremden KI weiterhin keinen Referrer. */
      'Referrer-Policy':'same-origin',
      /* Chromium prüft form-action auch nach dem 303. Nur der Ursprung des
       * exakt registrierten Rückwegs kommt zur eigenen Form-Adresse dazu. */
      'Content-Security-Policy':"default-src 'none'; style-src 'nonce-"+styleNonce+"'; form-action 'self'"+(callbackOrigin?' '+callbackOrigin:'')+"; frame-ancestors 'none'; base-uri 'none'"}});
};
const params=(input:URLSearchParams):Record<string,string>=>{
  const result:Record<string,string>={};
  for(const [key,value] of input){if(Object.hasOwn(result,key)||['__proto__','constructor','prototype'].includes(key))throw new OAuthError('invalid_request');result[key]=value;}
  return result;
};
const readForm=async(request:Request):Promise<URLSearchParams>=>{
  if(request.headers.get('content-type')?.split(';')[0]?.trim()!=='application/x-www-form-urlencoded')throw new OAuthError('invalid_request');
  const bytes=await leseBegrenzt(request.body,16*1024);if(!bytes)throw new OAuthError('invalid_request');
  return new URLSearchParams(new TextDecoder().decode(bytes));
};

export const createMcpOAuthHttp=({oauth,state,identify,rateKey,now=Date.now}:{oauth:McpOAuth;state:McpState;
  identify:(request:Request)=>Promise<CloudUser|null>;rateKey:(request:Request)=>string;now?:()=>number})=>{
  const metadata=oauth.metadata(),issuer=metadata.issuer,resource=oauth.resourceMetadata().resource;
  const authUrl=new URL(metadata.authorization_endpoint),settingsUrl=new URL('./settings',authUrl).href;
  const limited=async(request:Request,kind:string,max:number,period:number):Promise<boolean>=>{
    const bucket=Math.floor(now()/period),key='rate:'+await hash(kind+'\0'+rateKey(request)+'\0'+bucket);
    for(let i=0;i<5;i++){
      const row=await state.read<{count:number}>(key);
      if(!row){if(await state.create(key,'rate',{count:1},(bucket+1)*period)){await state.prune(100);return true;}}
      else {if(row.data.count>=max)return false;if(await state.replace(row,{count:row.data.count+1}))return true;}
    }
    return false;
  };
  const sameOrigin=(request:Request):boolean=>request.headers.get('origin')===authUrl.origin&&
    !['cross-site','none'].includes(request.headers.get('sec-fetch-site')??'');
  const userFor=async(request:Request):Promise<CloudUser>=>{
    const user=await identify(request);if(!user)throw new OAuthError('access_denied');return user;
  };
  return async(request:Request):Promise<Response|null>=>{
    const url=new URL(request.url),privateRoute=url.origin+url.pathname===authUrl.href||url.origin+url.pathname===settingsUrl;
    if(!privateRoute&&url.origin!==issuer)return null;
    const path=url.pathname;
    const publicRoute=['/.well-known/oauth-authorization-server','/.well-known/oauth-protected-resource',
      '/.well-known/oauth-protected-resource'+new URL(resource).pathname,'/register','/token','/revoke'].includes(path);
    if(!privateRoute&&!publicRoute)return null;
    try{
      /* Weder Tokens noch Benutzerkennungen aus der URL übernehmen. */
      if(['access_token','refresh_token','token','client_secret','code_verifier','client_assertion'].some(key=>url.searchParams.has(key)))throw new OAuthError('invalid_request');
      if(!privateRoute){
        if(request.headers.has('origin')&&request.headers.get('origin')!==issuer)return json({error:'invalid_request'},403);
        if(path.startsWith('/.well-known/')){
          if(request.method!=='GET')return json({error:'invalid_request'},405,{Allow:'GET'});
          return json(path==='/.well-known/oauth-authorization-server'?metadata:oauth.resourceMetadata());
        }
        if(request.method!=='POST')return json({error:'invalid_request'},405,{Allow:'POST'});
        if(!await limited(request,path,path==='/register'?10:120,path==='/register'?3600000:600000))return json({error:'temporarily_unavailable'},429,{'Retry-After':'600'});
        if(path==='/register'){
          if(request.headers.get('content-type')?.split(';')[0]?.trim()!=='application/json')throw new OAuthError('invalid_client_metadata');
          const bytes=await leseBegrenzt(request.body,16*1024);if(!bytes)throw new OAuthError('invalid_client_metadata');
          let input:unknown;try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new OAuthError('invalid_client_metadata');}
          if(!input||typeof input!=='object'||Array.isArray(input))throw new OAuthError('invalid_client_metadata');
          return json(await oauth.register(input as Record<string,unknown>),201);
        }
        /* Nur die publizierte Client-Authentifizierung im Formular zulassen. */
        if(request.headers.has('authorization'))throw new OAuthError('invalid_client');
        const input=params(await readForm(request));
        if(path==='/token')return json(await oauth.exchange(input));
        await oauth.revokeToken(input);return new Response(null,{status:200,headers});
      }
      if(!['GET','POST'].includes(request.method))return json({error:'invalid_request'},405,{Allow:'GET, POST'});
      if(!await limited(request,'authorize',60,600000))return json({error:'temporarily_unavailable'},429,{'Retry-After':'600'});
      const user=await userFor(request);
      if(request.method==='POST'&&!sameOrigin(request))return page('Freigabe nicht übernommen','<p>Die Anfrage stammt nicht von dieser Redion-Anmeldung. Bitte die Verbindung erneut öffnen.</p>',403);
      if(url.origin+path===settingsUrl){
        if(request.method==='POST'){
          const input=params(await readForm(request)),csrf=input.csrf??'';
          if(!/^[a-f0-9]{48}$/.test(csrf))throw new OAuthError('invalid_request');
          const proof=await state.read<{userId:string}>('manage:'+await hash(csrf));
          if(!proof||proof.data.userId!==user.id||!await state.consume(proof))throw new OAuthError('invalid_request');
          await oauth.revokeGrant(user.id,input.grantId??'');return redirect(settingsUrl);
        }
        const csrf=nonce();await state.create('manage:'+await hash(csrf),'manage',{userId:user.id},now()+600000);
        const grants=await oauth.listGrants(user.id);
        return page('Freigegebene KI-Verbindungen','<p>Hier kannst du bestehende Zugriffe widerrufen. Um Schreiben zu erlauben, muss der KI-Client die Verbindung mit redion:write erneut anfordern. Dann erscheint eine eigene, zunächst ausgeschaltete Schreibfreigabe.</p>'+(grants.length?grants.map(grant=>'<article><h2>'+escape(grant.clientName)+'</h2><p>'+grant.scopes.map(s=>escape(labels[s]!)).join(' · ')+
          '</p><small>Client: <code>'+escape(grant.clientId)+'</code></small><form method="post" action="'+escape(settingsUrl)+'"><input type="hidden" name="csrf" value="'+csrf+'">'+
          '<input type="hidden" name="grantId" value="'+escape(grant.id)+'"><button>Freigabe widerrufen</button></form></article>').join(''):'<p>Keine KI-Verbindung ist freigegeben.</p>'));
      }
      if(request.method==='POST'){
        const form=await readForm(request),selected=form.getAll('workspace');
        const input=params(new URLSearchParams([...form].filter(([key])=>key!=='workspace')));
        if(selected.some(id=>!user.workspaces.some(w=>w.id===id)))throw new OAuthError('access_denied');
        if(!['allow','deny'].includes(input.decision??'')||input.write!==undefined&&input.write!=='yes')
          throw new OAuthError('invalid_request');
        /* Das Checkbox-Feld ist nicht vertrauenswürdig. Bei Schreibfreigabe
         * MUSS jede ausgewählte Arbeitswelt serverseitig editierbar sein. */
        const allowWrite=input.write==='yes'&&input.decision==='allow';
        if(allowWrite&&selected.some(id=>!user.workspaces.some(w=>w.id===id&&w.canWrite)))
          throw new OAuthError('access_denied');
        const result=await oauth.approve(user.id,input.requestId??'',input.csrf??'',{
          allow:input.decision==='allow',remember:input.remember==='yes',workspaceIds:selected,allowWrite});
        return redirect(result.redirect);
      }
      const start=await oauth.begin(user.id,params(url.searchParams));
      if(start.kind==='redirect')return redirect(start.redirect);
      return page('KI mit RED Ion verbinden','<p><strong>'+escape(start.clientName)+'</strong> möchte auf deine synchronisierten Inhalte zugreifen.</p>'+
        '<p>Der Clientname ist selbst angegeben. Prüfe, ob du diese Verbindung gestartet hast.</p><small>Rückgabeadresse: <code>'+escape(start.redirectUri)+'</code></small>'+
        '<ul>'+start.scopes.filter(s=>s!=='redion:write').map(s=>'<li>'+escape(labels[s]!)+'</li>').join('')+'</ul><form method="post" action="'+escape(authUrl.href)+'">'+
        '<input type="hidden" name="requestId" value="'+start.requestId+'"><input type="hidden" name="csrf" value="'+start.csrf+'">'+
        '<fieldset><legend>Zugängliche Arbeitsbereiche auswählen</legend>'+user.workspaces.slice(0,20).map(w=>'<label><input type="checkbox" name="workspace" value="'+escape(w.id)+'">'+escape(w.name)+
          (w.canWrite?'':' (nur lesen)')+'</label>').join('')+(user.workspaces.length?'':'<p>Du hast noch keinen synchronisierten Arbeitsbereich. Richte zuerst den Abgleich in Redion ein.</p>')+'</fieldset>'+
        (start.scopes.includes('redion:write')
          ? '<label><input type="checkbox" name="write" value="yes"><span><strong>Schreiben erlauben</strong> (standardmässig aus). Die KI darf dann Dokumente in den ausgewählten Arbeitsbereichen ändern.</span></label>'+
            '<small>Schreibzugriff ist nur für Bereiche mit Bearbeitungsrecht möglich. Ohne Haken erhält diese Verbindung ausschliesslich Leserechte und allenfalls separat angeforderte Bildrechte.</small>'
          : '<small>Diese Verbindung fragt nur Leserechte an. Für Schreiben muss der KI-Client beim erneuten Verbinden redion:write anfordern.</small>')+
        '<label><input type="checkbox" name="remember" value="yes" checked>Diese Freigabe bis zum Widerruf merken</label><small>Weitere Rechte verlangen erneut deine Zustimmung. Verbindungen kannst du unter '+
        '<a href="'+escape(settingsUrl)+'">Freigaben</a> widerrufen. Verschlüsselte private Inhalte bleiben für den Cloud-Dienst unlesbar.</small><div class="actions">'+
        '<button name="decision" value="allow">Verbindung erlauben</button><button name="decision" value="deny">Ablehnen</button></div></form>',200,new URL(start.redirectUri).origin);
    }catch(error){
      if(error instanceof OAuthError){
        const status=error.error==='access_denied'?401:error.error==='invalid_client'?401:error.error==='temporarily_unavailable'?503:400;
        return privateRoute?page('Verbindung nicht freigegeben','<p>Die Anmeldung oder Freigabe konnte nicht übernommen werden. Starte die Verbindung erneut über deine KI-Anwendung.</p>',status):
          json({error:error.error},status);
      }
      /* Keine Fehlerobjekte, Formulardaten oder Tokenwerte in Diagnose-Logs. */
      return json({error:'temporarily_unavailable'},503);
    }
  };
};
