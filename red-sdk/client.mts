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
  const serial=<T>(fn:()=>Promise<T>):Promise<T>=>{const pending=queue.then(fn);queue=pending.catch(()=>undefined);return pending;};
  const request=async(path:string,method:string,input?:object,token?:string)=>{
    const headers:Record<string,string>={};
    if(input)headers['Content-Type']='application/json';
    if(token)headers.Authorization='Bearer '+token;
    const res=await fetcher(origin+'/red-id/v2/'+path,{method,headers,body:input?JSON.stringify(input):undefined,credentials:'omit',redirect:'error',cache:'no-store'});
    if(!res.ok)throw new RedIdError(res.status);
    return res.json();
  };
  const validate=(v:any):RedSession=>{
    if(v?.version!==2||v.app!==app||!/^redat_[a-f0-9]{64}$/.test(v.accessToken)||!/^redrt_[a-f0-9]{64}$/.test(v.refreshToken)||!Number.isFinite(Date.parse(v.expiresAt))||!Number.isFinite(Date.parse(v.refreshExpiresAt))||!Array.isArray(v.scopes)||v.scopes.length!==1||v.scopes[0]!=='identity:read')throw new Error('Invalid RED ID session');
    return v as RedSession;
  };
  const rotate=async(s:RedSession)=>{try{const next=validate(await request('refresh','POST',{app,refreshToken:s.refreshToken}));await store.save(next);return next;}catch(error){if(error instanceof RedIdError&&error.status===401)await store.clear();throw error;}};
  const loaded=async()=>{const s=await store.load();if(!s)throw new RedIdError(401);return validate(s);};
  return {
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
