/** Minimal RED ID client. Store the credential in the native secure store,
 * not in localStorage, URLs, shared logs or the project repository. */
export type RedIdentity={version:1;id:string;name:string;app:string;scopes:string[];expiresAt:string};
export function createRedIdClient(origin:string,token:()=>Promise<string>,fetcher:typeof fetch=fetch){
  const parsed=new URL(origin);
  if(parsed.protocol!=='https:'||parsed.origin!==origin)throw new Error('RED ID requires an exact HTTPS origin');
  const request=async(path:string,method:string)=>{
    const credential=await token();
    if(!/^redid_[a-f0-9]{64}$/.test(credential))throw new Error('Invalid RED ID credential');
    const response=await fetcher(origin+path,{method,headers:{Authorization:'Bearer '+credential},credentials:'omit',redirect:'error',cache:'no-store'});
    if(!response.ok)throw new Error('RED ID request failed: '+response.status);
    return response.json();
  };
  return {me:async():Promise<RedIdentity>=>{
    const value=await request('/red-id/v1/me','GET');
    if(value.version!==1||typeof value.id!=='string'||typeof value.name!=='string'||typeof value.app!=='string'||!Array.isArray(value.scopes)||typeof value.expiresAt!=='string')throw new Error('Invalid RED ID response');
    return value as RedIdentity;
  },logout:async():Promise<void>=>{await request('/red-id/v1/logout','POST');}};
}

/** RED ID v2: caller supplies native Keychain / credential-vault storage.
 * Do not implement this interface with localStorage or plaintext files. */
export type RedAppId='red-ion'|'red-fit'|'red-poly'|'red-bit'|'red-loop'|'red-efz'|'red-kurd'|'red-uhr'|'red-yt'|'stran'|'babat-red';
export type RedSession={version:2;app:RedAppId;accessToken:string;refreshToken:string;expiresAt:string;refreshExpiresAt:string;scopes:string[]};
export type RedIdentityV2=Omit<RedIdentity,'version'|'app'>&{version:2;app:RedAppId};
export interface RedSecureStore{load():Promise<RedSession|null>;save(value:RedSession):Promise<void>;clear():Promise<void>}
const base64url=(v:Uint8Array)=>btoa(String.fromCharCode(...v)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
export async function createRedPairProof(){
  const bytes=globalThis.crypto.getRandomValues(new Uint8Array(32));
  const verifier=base64url(bytes);
  const challenge=base64url(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
  return {verifier,challenge};
}
export class RedIdError extends Error{readonly status:number;constructor(status:number){super('RED ID request failed: '+status);this.status=status;}}
export function createRedIdV2Client(origin:string,app:RedAppId,store:RedSecureStore,fetcher:typeof fetch=fetch){
  const url=new URL(origin);
  if(url.protocol!=='https:'||url.origin!==origin)throw new Error('RED ID requires exact HTTPS origin');
  let queue:Promise<unknown>=Promise.resolve();
  const serial=<T,>(fn:()=>Promise<T>):Promise<T>=>{const pending=queue.then(fn);queue=pending.catch(()=>undefined);return pending;};
  const request=async(path:string,method:string,input?:object,token?:string)=>{
    const headers:Record<string,string>={};
    if(input)headers['Content-Type']='application/json';
    if(token)headers.Authorization='Bearer '+token;
    const res=await fetcher(origin+'/red-id/v2/'+path,{method,headers,...(input?{body:JSON.stringify(input)}:{}),credentials:'omit',redirect:'error',cache:'no-store'});
    if(!res.ok)throw new RedIdError(res.status);
    return res.json();
  };
  const validate=(v:any):RedSession=>{
    if(v?.version!==2||v.app!==app||!/^redat_[a-f0-9]{64}$/.test(v.accessToken)||!/^redrt_[a-f0-9]{64}$/.test(v.refreshToken)||!Number.isFinite(Date.parse(v.expiresAt))||!Number.isFinite(Date.parse(v.refreshExpiresAt))||!Array.isArray(v.scopes)||v.scopes.length!==1||v.scopes[0]!=='identity:read')throw new Error('Invalid RED ID session');
    return v as RedSession;
  };
  const rotate=async(s:RedSession)=>{try{const next=validate(await request('refresh','POST',{app,refreshToken:s.refreshToken}));await store.save(next);return next;}catch(error){if(error instanceof RedIdError&&error.status===401)await store.clear();throw error;}};
  const loaded=async()=>{const s=await store.load();if(!s)throw new RedIdError(401);return validate(s);};
  const share=async(path:string,input?:object)=>{
    let s=await loaded();
    if(Date.parse(s.expiresAt)<=Date.now()+30000)s=await rotate(s);
    const send=async(session:RedSession)=>{
      const res=await fetcher(origin+'/red-share/v1/'+path,{method:input?'POST':'GET',headers:{Authorization:'Bearer '+session.accessToken,...(input?{'Content-Type':'application/json'}:{})},...(input?{body:JSON.stringify(input)}:{}),cache:'no-store',credentials:'omit',redirect:'error'});
      if(!res.ok)throw new RedIdError(res.status);return res.json();
    };
    try{return await send(s);}catch(error){if(!(error instanceof RedIdError)||error.status!==401)throw error;return send(await rotate(s));}
  };
  return {
    shareSend:(target:RedAppId,channel:string,id:string,envelope:string)=>serial(async()=>{await share('send',{target,channel,id,envelope});}),
    shareInbox:()=>serial(async():Promise<RedShareMessage[]>=>{
      const data=await share('inbox');if(data?.version!==1||!Array.isArray(data.messages))throw Error('Invalid share inbox');return data.messages as RedShareMessage[];
    }),
    shareAck:(source:RedAppId,channel:string,id:string)=>serial(async()=>{await share('ack',{source,channel,id});}),
    pair:(code:string,verifier:string)=>serial(async()=>{const s=validate(await request('exchange','POST',{app,code,verifier}));await store.save(s);}),
    refresh:()=>serial(async()=>{await rotate(await loaded());}),
    me:()=>serial(async():Promise<RedIdentityV2>=>{
      let s=await loaded();
      if(Date.parse(s.expiresAt)<=Date.now()+30000)s=await rotate(s);
      let value:any;
      try{value=await request('me','GET',undefined,s.accessToken);}catch(error){if(!(error instanceof RedIdError)||error.status!==401)throw error;s=await rotate(s);value=await request('me','GET',undefined,s.accessToken);}
      if(value?.version!==2||value.app!==app||typeof value.id!=='string'||typeof value.name!=='string'||!Array.isArray(value.scopes)||value.scopes.length!==1||value.scopes[0]!=='identity:read'||!Number.isFinite(Date.parse(value.expiresAt)))throw new Error('Invalid RED identity');
      return value as RedIdentityV2;
    }),
    logout:()=>serial(async()=>{try{const s=await loaded();let current=s;if(Date.parse(s.expiresAt)<=Date.now()+30000)current=await rotate(s);await request('logout','POST',undefined,current.accessToken);}finally{await store.clear();}}),
  };
}

/** QR payload contains only the target app and public challenge, never a verifier or token. */
export function encodeRedPairRequest(app:RedAppId,challenge:string){
  if(!/^[A-Za-z0-9_-]{43}$/.test(challenge))throw Error('Invalid challenge');
  return JSON.stringify({kind:'red-pair',version:1,app,challenge});
}
export function decodeRedPairRequest(value:string):{app:RedAppId;challenge:string}{
  if(value.length>256)throw Error('Invalid pairing request');
  const data=JSON.parse(value);
  const apps:RedAppId[]=['red-ion','red-fit','red-poly','red-bit','red-loop','red-efz','red-kurd','red-uhr','red-yt','stran','babat-red'];
  if(data?.kind!=='red-pair'||data.version!==1||!apps.includes(data.app)||typeof data.challenge!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(data.challenge))throw Error('Invalid pairing request');
  return {app:data.app,challenge:data.challenge};
}
export type RedShareAddress={source:RedAppId;target:RedAppId;channel:string;id:string};
const shareAAD=(v:RedShareAddress)=>{
  if(!/^[a-z][a-z0-9_-]{0,31}$/.test(v.channel)||!/^[a-f0-9]{32}$/.test(v.id)||v.source===v.target)throw Error('Invalid share address');
  return new TextEncoder().encode(JSON.stringify(['red-share-v1',v.source,v.target,v.channel,v.id]));
};
const unbase64url=(value:string)=>{
  if(!/^[A-Za-z0-9_-]+$/.test(value))throw Error('Invalid envelope');
  const raw=atob(value.replaceAll('-','+').replaceAll('_','/'));
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
};
/** The caller must distribute a fresh 32-byte key securely to the two
 * authorized apps, independently of RED ID and the server. Never send keys
 * via the share API. No automatic key distribution is provided. */
export async function encryptRedShare(key:Uint8Array,address:RedShareAddress,plaintext:Uint8Array){
  if(key.byteLength!==32||plaintext.byteLength>44000)throw Error('Invalid key or payload size');
  const crypto=globalThis.crypto,nonce=crypto.getRandomValues(new Uint8Array(12));
  const k=await crypto.subtle.importKey('raw',new Uint8Array(key),'AES-GCM',false,['encrypt']);
  const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:shareAAD(address)},k,new Uint8Array(plaintext)));
  const out=new Uint8Array(12+encrypted.length);out.set(nonce);out.set(encrypted,12);
  // Avoid spreading tens of thousands of elements into one function call.
  let raw='';for(const byte of out)raw+=String.fromCharCode(byte);
  return btoa(raw).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export async function decryptRedShare(key:Uint8Array,address:RedShareAddress,envelope:string){
  if(key.byteLength!==32||envelope.length>60000)throw Error('Invalid key or envelope');
  const bytes=unbase64url(envelope);if(bytes.length<28)throw Error('Invalid envelope');
  const crypto=globalThis.crypto,k=await crypto.subtle.importKey('raw',new Uint8Array(key),'AES-GCM',false,['decrypt']);
  return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12),additionalData:shareAAD(address)},k,bytes.slice(12)));
}
export type RedShareMessage={source:RedAppId;channel:string;id:string;envelope:string;expires:number};
