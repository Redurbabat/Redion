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
    if(v?.version!==2||v.app!==app||Date.parse(v.expiresAt)>Date.parse(v.refreshExpiresAt)||!/^redat_[a-f0-9]{64}$/.test(v.accessToken)||!/^redrt_[a-f0-9]{64}$/.test(v.refreshToken)||!Number.isFinite(Date.parse(v.expiresAt))||!Number.isFinite(Date.parse(v.refreshExpiresAt))||!Array.isArray(v.scopes)||v.scopes.length!==1||v.scopes[0]!=='identity:read')throw new Error('Invalid RED ID session');
    return v as RedSession;
  };
  const rotate=async(s:RedSession)=>{try{const next=validate(await request('refresh','POST',{app,refreshToken:s.refreshToken}));await store.save(next);return next;}catch(error){if(error instanceof RedIdError&&error.status===401)await store.clear();throw error;}};
  const loaded=async()=>{const s=await store.load();if(!s)throw new RedIdError(401);return validate(s);};
  const authenticated=async(service:'red-share'|'red-store',path:string,input?:object)=>{
    let s=await loaded();
    if(Date.parse(s.expiresAt)<=Date.now()+30000)s=await rotate(s);
    const send=async(session:RedSession)=>{
      const res=await fetcher(origin+'/'+service+'/v1/'+path,{method:input?'POST':'GET',headers:{Authorization:'Bearer '+session.accessToken,...(input?{'Content-Type':'application/json'}:{})},...(input?{body:JSON.stringify(input)}:{}),cache:'no-store',credentials:'omit',redirect:'error'});
      if(!res.ok)throw new RedIdError(res.status);return res.json();
    };
    try{return await send(s);}catch(error){if(!(error instanceof RedIdError)||error.status!==401)throw error;return send(await rotate(s));}
  };
  return {
    shareSend:(target:RedAppId,channel:string,id:string,envelope:string)=>serial(async()=>{await authenticated('red-share','send',{target,channel,id,envelope});}),
    shareInbox:()=>serial(async():Promise<RedShareMessage[]>=>{
      const data=await authenticated('red-share','inbox');if(data?.version!==1||!Array.isArray(data.messages)||data.messages.length>32||!data.messages.every(isShareMessage))throw Error('Invalid share inbox');return data.messages as RedShareMessage[];
    }),
    shareAck:(source:RedAppId,channel:string,id:string)=>serial(async()=>{await authenticated('red-share','ack',{source,channel,id});}),
    storeList:(kind:RedStoreKind,after?:string)=>serial(async():Promise<RedStorePage>=>{
      const data=await authenticated('red-store','list',{kind,...(after?{after}:{})});
      if(data?.version!==1||!Array.isArray(data.items)||data.items.length>64||!data.items.every(isStoreMeta)||(data.next!==null&&(typeof data.next!=='string'||!storeId(data.next))))throw Error('Invalid RED store page');
      return data as RedStorePage;
    }),
    /** A null or expired cursor returns a fresh metadata snapshot.
     * Commit the returned cursor only after all records are applied locally. */
    storeChanges:(kind:RedStoreKind,cursor:string|null=null)=>serial(async():Promise<RedStoreChanges>=>{
      if(cursor!==null&&!/^[a-f0-9]{64}$/.test(cursor))throw Error('Invalid RED store cursor');
      const data=await authenticated('red-store','changes',{kind,cursor});
      if(data?.version!==1||typeof data.reset!=='boolean'||(data.cursor!==null&&(typeof data.cursor!=='string'||!/^[a-f0-9]{64}$/.test(data.cursor)))||!Array.isArray(data.items)||data.items.length>1024||!data.items.every(isStoreMeta)||new Set(data.items.map((item:RedStoreMeta)=>item.id)).size!==data.items.length||(!data.reset&&cursor===null)||data.cursor===null&&data.items.length!==0)throw Error('Invalid RED store changes');
      return data as RedStoreChanges;
    }),
    storeGet:(kind:RedStoreKind,id:string)=>serial(async():Promise<RedStoreRecord>=>{
      const data=await authenticated('red-store','get',{kind,id});
      if(data?.version!==1||data.id!==id||!isStoreRecord(data))throw Error('Invalid RED store record');
      return data as RedStoreRecord;
    }),
    storePut:(prepared:RedStoreWrite)=>serial(async():Promise<RedStoreResult>=>{
      const {kind,id,expectedRevision,operationId,envelope}=prepared;
      const data=await authenticated('red-store','put',{kind,id,expectedRevision,operationId,envelope});
      return checkStoreResult(data,id,expectedRevision+1,0);
    }),
    storeDelete:(kind:RedStoreKind,id:string,expectedRevision:number,operationId:string)=>serial(async():Promise<RedStoreResult>=>{
      const data=await authenticated('red-store','delete',{kind,id,expectedRevision,operationId});
      return checkStoreResult(data,id,expectedRevision+1,1);
    }),
    claimLogin:(verifier:string)=>serial(async()=>{const s=validate(await request('claim-login','POST',{app,verifier}));await store.save(s);}),
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

/** Native platform bridge. Implement with Keychain, Keystore or equivalent,
 * not plain preferences or browser localStorage. */
export interface RedNativeSecrets {
  get(key:string):Promise<string|null>;
  set(key:string,value:string):Promise<void>;
  remove(key:string):Promise<void>;
}
export async function createScopedRedStore(origin:string,app:RedAppId,bridge:RedNativeSecrets):Promise<RedSecureStore>{
  const u=new URL(origin);
  if(u.protocol!=='https:'||u.origin!==origin)throw Error('RED ID requires exact HTTPS origin');
  const scope=base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([origin,app])))));
  const key='red-id-v2-'+scope;
  return {
    async load(){const raw=await bridge.get(key);if(raw===null)return null;const parsed=JSON.parse(raw);if(parsed.origin!==origin||parsed.app!==app||parsed.session?.app!==app)throw Error('Credential scope mismatch');return parsed.session as RedSession;},
    async save(session){if(session.app!==app)throw Error('Credential scope mismatch');await bridge.set(key,JSON.stringify({origin,app,session}));},
    async clear(){await bridge.remove(key);}
  };
}
export type RedShareKeyContext={origin:string;owner:string;source:RedAppId;target:RedAppId;channel:string};
export type RedShareKeyOffer={kind:'red-share-key';version:1;role:'source'|'target';context:RedShareKeyContext;publicKey:string};
const contextBytes=(c:RedShareKeyContext)=>{
  const url=new URL(c.origin);
  const apps=['red-ion','red-fit','red-poly','red-bit','red-loop','red-efz','red-kurd','red-uhr','red-yt','stran','babat-red'];
  if(url.protocol!=='https:'||url.origin!==c.origin||typeof c.owner!=='string'||c.owner.length<1||c.owner.length>128||!apps.includes(c.source)||!apps.includes(c.target)||c.source===c.target||!/^[a-z][a-z0-9_-]{0,31}$/.test(c.channel))throw Error('Invalid key context');
  return JSON.stringify([c.origin,c.owner,c.source,c.target,c.channel]);
};
/** Authenticated out-of-band exchange. Exchange PUBLIC offers, then compare
 * the 128-bit fingerprint on both trusted devices (not via the relay).
 * Never accept a fingerprint supplied by the server. Private keys stay
 * non-exportable. This is not automatic or unattended key distribution. */
export async function createRedShareKeyExchange(context:RedShareKeyContext,role:'source'|'target'){
  const ctx=contextBytes(context);
  if(role!=='source'&&role!=='target')throw Error('Invalid role');
  const pair=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);
  const own=base64url(new Uint8Array(await crypto.subtle.exportKey('raw',pair.publicKey)));
  const offer:RedShareKeyOffer={kind:'red-share-key',version:1,role,context:{...context},publicKey:own};
  let used=false;
  return {offer,async compare(peer:RedShareKeyOffer){
    if(used)throw Error('Exchange already used');
    if(peer?.kind!=='red-share-key'||peer.version!==1||peer.role!==(role==='source'?'target':'source')||contextBytes(peer.context)!==ctx||typeof peer.publicKey!=='string'||peer.publicKey===own||peer.publicKey.length!==87)throw Error('Invalid peer offer');
    const raw=unbase64url(peer.publicKey);
    if(raw.length!==65||raw[0]!==4||base64url(raw)!==peer.publicKey)throw Error('Invalid public key');
    used=true;
    const publicKey=await crypto.subtle.importKey('raw',raw,{name:'ECDH',namedCurve:'P-256'},false,[]);
    const shared=await crypto.subtle.deriveBits({name:'ECDH',public:publicKey},pair.privateKey,256);
    const transcript=new TextEncoder().encode(JSON.stringify(['red-share-key-v1',ctx,role==='source'?own:peer.publicKey,role==='target'?own:peer.publicKey]));
    const salt=await crypto.subtle.digest('SHA-256',transcript);
    const master=await crypto.subtle.importKey('raw',shared,'HKDF',false,['deriveBits']);
    new Uint8Array(shared).fill(0);
    const derive=async(label:string)=>new Uint8Array(await crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info:new TextEncoder().encode(label)},master,256));
    const check=await derive('red-share-fingerprint-v1');
    const fingerprint=Array.from(check.subarray(0,16),v=>v.toString(16).padStart(2,'0')).join('').match(/.{1,4}/g)!.join('-');
    check.fill(0);
    let confirmed=false;
    return {fingerprint,async confirm(expected:string){
      if(confirmed)throw Error('Exchange already confirmed');
      if(expected.toLowerCase()!==fingerprint)throw Error('Fingerprint mismatch');
      confirmed=true;return derive('red-share-aes256-v1');
    }};
  }};
}

const shareApps=new Set(['red-ion','red-fit','red-poly','red-bit','red-loop','red-efz','red-kurd','red-uhr','red-yt','stran','babat-red']);
function isShareMessage(value:unknown):value is RedShareMessage{
 if(!value||typeof value!=='object')return false;
 const v=value as Record<string,unknown>;
 return typeof v.source==='string'&&shareApps.has(v.source)&&typeof v.channel==='string'&&/^[a-z][a-z0-9_-]{0,31}$/.test(v.channel)&&typeof v.id==='string'&&/^[a-f0-9]{32}$/.test(v.id)&&typeof v.envelope==='string'&&/^[A-Za-z0-9_-]{38,60000}$/.test(v.envelope)&&Number.isSafeInteger(v.expires);
}
export type RedPreparedShare={address:RedShareAddress;envelope:string};
/** Prepare exactly once and reuse the resulting ID and ciphertext on retry.
 * The caller must persist only the encrypted envelope in a durable outbox. */
export async function prepareRedShareJson(key:Uint8Array,source:RedAppId,target:RedAppId,channel:string,data:unknown):Promise<RedPreparedShare>{
 if(!shareApps.has(source)||!shareApps.has(target))throw Error('Unknown RED app');
 const id=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
 const address={source,target,channel,id};
 const json=JSON.stringify({version:1,data});
 if(json===undefined||data===undefined)throw Error('Invalid JSON payload');
 return {address,envelope:await encryptRedShare(key,address,new TextEncoder().encode(json))};
}
/** Authenticate/decrypt first, then validate the app-specific schema.
 * Persist application data and the message ID atomically BEFORE acknowledging.
 * Multiple devices of the same app compete for the same mailbox. */
export async function openRedShareJson<T>(key:Uint8Array,target:RedAppId,message:RedShareMessage,validate:(data:unknown)=>T):Promise<T>{
 if(!isShareMessage(message)||!shareApps.has(target)||message.expires<=Date.now())throw Error('Invalid or expired message');
 const bytes=await decryptRedShare(key,{source:message.source,target,channel:message.channel,id:message.id},message.envelope);
 const decoded=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 if(decoded?.version!==1||!Object.hasOwn(decoded,'data'))throw Error('Invalid RED JSON payload');
 return validate(decoded.data);
}

export type RedStoreKind='sync'|'file';
export type RedStoreContext={origin:string;owner:string;app:RedAppId;kind:RedStoreKind;id:string;revision:number};
export type RedStoreWrite={kind:RedStoreKind;id:string;expectedRevision:number;operationId:string;envelope:string};
export type RedStoreResult={version:1;id:string;revision:number;deleted:0|1};
export type RedStoreRecord=RedStoreResult&{envelope:string;updated:number};
export type RedStoreMeta=Omit<RedStoreRecord,'version'|'envelope'>&{encodedBytes:number};
export type RedStorePage={version:1;items:RedStoreMeta[];next:string|null};
export type RedStoreChanges={version:1;items:RedStoreMeta[];cursor:string|null;reset:boolean};
const storeId=(s:string)=>/^[a-f0-9]{32}$/.test(s);
const safeNatural=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0;
const storeKind=(x:unknown):x is RedStoreKind=>x==='sync'||x==='file';
export function newRedStoreId(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');}
function isStoreResult(v:unknown):v is RedStoreResult{
 if(!v||typeof v!=='object')return false;
 const r=v as Record<string,unknown>;return typeof r.id==='string'&&storeId(r.id)&&safeNatural(r.revision)&&Number(r.revision)>0&&(r.deleted===0||r.deleted===1);
}
function validStoreEnvelope(v:unknown):v is string{
 if(typeof v!=='string'||!/^[A-Za-z0-9_-]{38,60000}$/.test(v))return false;
 try{const b=unbase64url(v);return b.length>=28&&base64url(b)===v;}catch{return false;}
}
function isStoreMeta(v:unknown):v is RedStoreMeta{
 if(!isStoreResult(v))return false;
 const r=v as RedStoreResult & Partial<RedStoreMeta>;return safeNatural(r.updated)&&safeNatural(r.encodedBytes)&&r.encodedBytes<=60000&&(r.deleted===1?r.encodedBytes===0:r.encodedBytes>=38);
}
function isStoreRecord(v:unknown):v is RedStoreRecord{
 if(!isStoreResult(v))return false;
 const r=v as RedStoreRecord;return safeNatural(r.updated)&&(r.deleted===1?r.envelope==='':validStoreEnvelope(r.envelope));
}
function checkStoreResult(v:unknown,id:string,revision:number,deleted:0|1):RedStoreResult{
 if(!isStoreResult(v)||v.version!==1||v.id!==id||v.revision!==revision||v.deleted!==deleted)throw Error('Unexpected RED store revision');
 return v;
}
function storeAAD(c:RedStoreContext){
 const u=new URL(c.origin);
 if(u.protocol!=='https:'||u.origin!==c.origin||typeof c.owner!=='string'||c.owner.length<1||c.owner.length>128||!shareApps.has(c.app)||!storeKind(c.kind)||!storeId(c.id)||!safeNatural(c.revision)||c.revision<1)throw Error('Invalid RED store context');
 return new TextEncoder().encode(JSON.stringify(['red-store-v1',c.origin,c.owner,c.app,c.kind,c.id,c.revision]));
}
/** Key is per owner/app and must be distributed securely outside the server.
 * The envelope binds origin, owner, app, object kind, ID and revision.
 * Retain the prepared operation unchanged for safe retry. */
export async function prepareRedStoreWrite(key:Uint8Array,context:Omit<RedStoreContext,'revision'>,expectedRevision:number,bytes:Uint8Array):Promise<RedStoreWrite>{
 if(key.byteLength!==32||bytes.byteLength>44000||!safeNatural(expectedRevision)||expectedRevision>=Number.MAX_SAFE_INTEGER-1)throw Error('Invalid RED store payload');
 const nonce=crypto.getRandomValues(new Uint8Array(12)),k=await crypto.subtle.importKey('raw',new Uint8Array(key),'AES-GCM',false,['encrypt']);
 const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:storeAAD({...context,revision:expectedRevision+1})},k,new Uint8Array(bytes)));
 const combined=new Uint8Array(nonce.length+ciphertext.length);combined.set(nonce);combined.set(ciphertext,nonce.length);
 return {kind:context.kind,id:context.id,expectedRevision,operationId:newRedStoreId(),envelope:base64url(combined)};
}
export async function openRedStoreRecord(key:Uint8Array,context:Omit<RedStoreContext,'revision'>,record:RedStoreRecord):Promise<Uint8Array>{
 if(key.byteLength!==32||!isStoreRecord(record)||record.version!==1||record.id!==context.id||record.deleted!==0)throw Error('Invalid or deleted RED store record');
 const raw=unbase64url(record.envelope),k=await crypto.subtle.importKey('raw',new Uint8Array(key),'AES-GCM',false,['decrypt']);
 return new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:raw.slice(0,12),additionalData:storeAAD({...context,revision:record.revision})},k,raw.slice(12)));
}

/** App adapters implement an atomic local commit (e.g. SQLite transaction)
 * including the cursor, imported records, and conflict journal. The SDK
 * does not persist plaintext or create a background service. */
export type RedSyncScope=Omit<RedStoreContext,'id'|'revision'>;
export type RedSyncLocalItem={id:string;revision:number;dirty:boolean;deleted:0|1};
export type RedSyncSnapshot={cursor:string|null;generation:string;items:RedSyncLocalItem[]};
export type RedSyncImport<T>={id:string;revision:number;deleted:0|1;value:T|null};
export type RedSyncConflict={id:string;localRevision:number;remoteRevision:number|null;reason:'local_edit'|'remote_rollback'|'missing_remote'|'revision_changed'};
export type RedSyncBatch<T>={cursor:string|null;imports:RedSyncImport<T>[];conflicts:RedSyncConflict[]};
export interface RedSyncAdapter<T>{
 snapshot():Promise<RedSyncSnapshot>;
 /** Must reject if local generation changed; must durably journal every
  * conflict before advancing the cursor. Never clear dirty local data. */
 commit(expectedGeneration:string,batch:RedSyncBatch<T>):Promise<void>;
}
type RedSyncTransport={storeChanges(kind:RedStoreKind,cursor:string|null):Promise<RedStoreChanges>;storeGet(kind:RedStoreKind,id:string):Promise<RedStoreRecord>};
export function createRedSync<T>(client:RedSyncTransport,scope:RedSyncScope,key:Uint8Array,adapter:RedSyncAdapter<T>,decode:(bytes:Uint8Array)=>T,recordDecoders:ReadonlyMap<string,(record:RedStoreRecord)=>Promise<T>>=new Map()){
 const special=new Map(recordDecoders);
 for(const id of special.keys())if(!storeId(id))throw Error('Invalid special record ID');
 const bound={...scope};
 storeAAD({...bound,id:'0'.repeat(32),revision:1});
 if(key.byteLength!==32)throw Error('Invalid sync key');
 const secret=new Uint8Array(key);
 let running=false,disposed=false;
 async function pull():Promise<{imported:number;conflicts:number;reset:boolean}>{
  if(disposed||running)throw Error('Sync unavailable or already running');
  running=true;
  try{
   const snapshot=await adapter.snapshot();
   if(typeof snapshot.generation!=='string'||snapshot.generation.length===0||snapshot.items.length>4096||snapshot.cursor!==null&&!/^[a-f0-9]{64}$/.test(snapshot.cursor))throw Error('Invalid local sync snapshot');
   const local=new Map<string,RedSyncLocalItem>();
   for(const item of snapshot.items){
    if(!storeId(item.id)||!safeNatural(item.revision)||typeof item.dirty!=='boolean'||(item.deleted!==0&&item.deleted!==1)||local.has(item.id))throw Error('Invalid local sync record');
    local.set(item.id,{...item});
   }
   const feed=await client.storeChanges(bound.kind,snapshot.cursor);
   const imports:RedSyncImport<T>[]=[],conflicts:RedSyncConflict[]=[];
   const seen=new Set<string>();
   for(const meta of feed.items){
    if(seen.has(meta.id)||!isStoreMeta(meta))throw Error('Invalid change feed');
    seen.add(meta.id);
    const old=local.get(meta.id);
    if(old&&old.revision>meta.revision){conflicts.push({id:meta.id,localRevision:old.revision,remoteRevision:meta.revision,reason:'remote_rollback'});continue;}
    if(old&&old.revision===meta.revision&&old.deleted===meta.deleted)continue;
    if(old?.dirty){conflicts.push({id:meta.id,localRevision:old.revision,remoteRevision:meta.revision,reason:'local_edit'});continue;}
    // A tombstone has no authenticated payload. Never automatically delete a
    // local record: surface the remote deletion for explicit reconciliation.
    if(meta.deleted===1){conflicts.push({id:meta.id,localRevision:old?.revision??0,remoteRevision:meta.revision,reason:'revision_changed'});continue;}
    const record=await client.storeGet(bound.kind,meta.id);
    if(record.revision!==meta.revision||record.deleted!==meta.deleted){
     // The feed cursor covers only the observed snapshot. Do not commit it
     // on a concurrent mutation; the next pull starts from the old cursor.
     throw Error('Remote record changed during pull; retry');
    }
    const custom=special.get(meta.id);
    if(custom)imports.push({id:meta.id,revision:meta.revision,deleted:0,value:await custom(record)});
    else{
     const bytes=await openRedStoreRecord(secret,{...bound,id:meta.id},record);
     try{imports.push({id:meta.id,revision:meta.revision,deleted:0,value:decode(bytes)});}
     finally{bytes.fill(0);}
    }
   }
   if(feed.reset)for(const old of local.values())if(old.revision>0&&!seen.has(old.id))conflicts.push({id:old.id,localRevision:old.revision,remoteRevision:null,reason:'missing_remote'});
   if(disposed)throw Error('Sync disposed');
   await adapter.commit(snapshot.generation,{cursor:feed.cursor,imports,conflicts});
   return {imported:imports.length,conflicts:conflicts.length,reset:feed.reset};
  }finally{running=false;}
 }
 return {pull,dispose(){disposed=true;secret.fill(0);}};
}

/** RED Config: deliberately non-sensitive, app-scoped preferences only.
 * Settings are encrypted with a separate derived key. A deterministic
 * opaque ID is scoped to origin, owner and app, not shared across apps. */
export type RedConfig={version:1;theme:'system'|'light'|'dark';locale:string;reducedMotion:boolean};
export function parseRedConfig(value:unknown):RedConfig{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid RED config');
 const v=value as Record<string,unknown>;
 if(Object.keys(v).length!==4||v.version!==1||(v.theme!=='system'&&v.theme!=='light'&&v.theme!=='dark')||typeof v.locale!=='string'||v.locale.length>35||typeof v.reducedMotion!=='boolean')throw Error('Invalid RED config');
 let locale:string;
 try{const list=Intl.getCanonicalLocales(v.locale);if(list.length!==1)throw Error('locale');locale=list[0]!;}catch{throw Error('Invalid RED config locale');}
 return {version:1,theme:v.theme,locale,reducedMotion:v.reducedMotion};
}
export async function createRedConfigContext(key:Uint8Array,scope:Omit<RedSyncScope,'kind'>){
 if(key.byteLength!==32)throw Error('Invalid config key');
 const base={origin:scope.origin,owner:scope.owner,app:scope.app,kind:'sync' as const};
 const salt=storeAAD({...base,id:'0'.repeat(32),revision:1});
 const master=await crypto.subtle.importKey('raw',new Uint8Array(key),'HKDF',false,['deriveBits']);
 const derive=(label:string)=>crypto.subtle.deriveBits({name:'HKDF',hash:'SHA-256',salt,info:new TextEncoder().encode(label)},master,256);
 const idBytes=new Uint8Array(await derive('red-config-id-v1')),configKey=new Uint8Array(await derive('red-config-key-v1'));
 const id=Array.from(idBytes.slice(0,16),b=>b.toString(16).padStart(2,'0')).join('');idBytes.fill(0);
 const context={...base,id};
 let disposed=false;
 return {id,
  async prepare(value:RedConfig,expectedRevision:number){
   if(disposed)throw Error('Config disposed');
   const bytes=new TextEncoder().encode(JSON.stringify(parseRedConfig(value)));
   try{return await prepareRedStoreWrite(configKey,context,expectedRevision,bytes);}finally{bytes.fill(0);}
  },
  async open(record:RedStoreRecord){
   if(disposed)throw Error('Config disposed');
   const bytes=await openRedStoreRecord(configKey,context,record);
   try{return parseRedConfig(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));}finally{bytes.fill(0);}
  },
  dispose(){disposed=true;configKey.fill(0);}
 };
}

/** A foreground/app-lifecycle sync coordinator. Coalesces requests, backs
 * off failures, never overlaps pulls, never schedules itself after stop.
 * Callers own timers and platform lifecycle; there is no background daemon. */
export function createRedSyncCoordinator(run:()=>Promise<unknown>,options:{now?:()=>number;minIntervalMs?:number;maxBackoffMs?:number}={}){
 const now=options.now??Date.now,min=options.minIntervalMs??15000,max=options.maxBackoffMs??300000;
 if(!Number.isSafeInteger(min)||min<1000||!Number.isSafeInteger(max)||max<min||max>3600000)throw Error('Invalid sync interval');
 let pending:Promise<'synced'|'deferred'>|null=null,after=0,failures=0,stopped=false;
 return {
  trigger():Promise<'synced'|'deferred'>{
   if(stopped)return Promise.resolve('deferred');
   if(pending)return pending;
   if(now()<after)return Promise.resolve('deferred');
   pending=Promise.resolve().then(async()=>{
    if(stopped)return 'deferred' as const;
    try{await run();failures=0;after=now()+min;return 'synced' as const;}
    catch(e){failures=Math.min(20,failures+1);after=now()+Math.min(max,min*2**(failures-1));throw e;}
   }).finally(()=>{pending=null;});
   return pending;
  },
  status(){return {running:pending!==null,stopped,failures,nextAttemptAt:after};},
  stop(){stopped=true;}
 };
}
