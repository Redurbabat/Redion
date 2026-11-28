import type {Ablage} from '../typen.ts';
import {werFragt} from '../kern.ts';

export const AI_ROUTES=['/home/ai/models','/home/ai/generate'] as const;
const ENDPOINT='http://127.0.0.1:11434/api/generate';
const MAX_PROMPT=16*1024,MAX_REQUEST=96*1024,MAX_RESPONSE=256*1024;
const reply=(status:number,data:unknown)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function parseLocalAiModels(raw:string):string[]{
 if(raw.length>2048)throw Error('Invalid local AI model list');
 if(!raw.trim())return [];
 const list=raw.split(',').map(s=>s.trim());
 if(list.length>16||new Set(list).size!==list.length||list.some(s=>! /^[A-Za-z0-9][A-Za-z0-9._/-]*(?::[A-Za-z0-9][A-Za-z0-9._-]*)?$/.test(s)||s.length>120||s.split('/').some(p=>p==='.'||p==='..')||/(?:^|[:_-])cloud(?:$|[:_-])/i.test(s)))throw Error('Invalid local AI model list');
 return list;
}
async function readJson(body:ReadableStream<Uint8Array>|null,limit:number):Promise<unknown>{
 if(!body)throw Error('Missing body');
 const reader=body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});
 let bytes=0,text='';
 try{
  while(true){const next=await reader.read();if(next.done)break;bytes+=next.value.byteLength;if(bytes>limit)throw Error('Payload limit');text+=decoder.decode(next.value,{stream:true});}
  return JSON.parse(text+decoder.decode()) as unknown;
 }catch(error){void reader.cancel().catch(()=>undefined);throw error;}finally{reader.releaseLock();}
}
/** Fixed loopback transport. The administrator must ensure that the
 * configured Ollama models are offline and cannot relay to the cloud. */
export function createLocalAiGateway(ablage:Ablage,models:readonly string[],fetcher:typeof fetch=fetch){
 const allowed=new Set(parseLocalAiModels(models.join(',')));
 let active:AbortController|null=null,closed=false;
 const handle=async(request:Request):Promise<Response>=>{
  const path=new URL(request.url).pathname;
  if(closed||!allowed.size||!(AI_ROUTES as readonly string[]).includes(path))return reply(404,{error:'not_found'});
  const list=path===AI_ROUTES[0];
  if(request.method!==(list?'GET':'POST'))return reply(405,{error:'method_not_allowed'});
  const who=await werFragt(ablage,{authorization:request.headers.get('authorization')??''});
  if(!who?.sitzung)return reply(401,{error:'unauthorized'});
  if(list)return reply(200,{version:1,provider:'loopback-ollama',models:[...allowed],installedStatus:false,maxPromptBytes:MAX_PROMPT,maxOutputTokens:512});
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??'')||Number(request.headers.get('content-length')??0)>MAX_REQUEST)return reply(400,{error:'invalid_request'});
  let input:unknown;
  try{input=await readJson(request.body,MAX_REQUEST);}catch{return reply(400,{error:'invalid_request'});}
  if(!object(input)||Object.keys(input).length!==3||typeof input.model!=='string'||!allowed.has(input.model)||typeof input.prompt!=='string'||!input.prompt.trim()||new TextEncoder().encode(input.prompt).byteLength>MAX_PROMPT||input.confirmLocalProcessing!==true)return reply(400,{error:'invalid_request'});
  if(closed)return reply(503,{error:'gateway_closed'});
  if(active)return reply(429,{error:'gateway_busy'});
  const controller=new AbortController();active=controller;
  const signal=AbortSignal.any([controller.signal,request.signal,AbortSignal.timeout(60_000)]);
  try{
   const response=await fetcher(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:input.model,prompt:input.prompt,stream:false,keep_alive:0,options:{num_predict:512,num_ctx:4096}}),redirect:'error',credentials:'omit',cache:'no-store',signal});
   if(!response.ok){void response.body?.cancel().catch(()=>undefined);return reply(502,{error:'provider_failed'});}
   const result=await readJson(response.body,MAX_RESPONSE);
   if(!object(result)||result.done!==true||typeof result.response!=='string')return reply(502,{error:'provider_failed'});
   return reply(200,{version:1,model:input.model,text:result.response});
  }catch{return reply(signal.aborted?504:502,{error:signal.aborted?'generation_interrupted':'provider_failed'});}
  finally{if(active===controller)active=null;}
 };
 return {handle,close(){closed=true;active?.abort();}};
}
