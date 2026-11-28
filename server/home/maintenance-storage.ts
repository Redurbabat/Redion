import {statfs} from 'node:fs/promises';

export type StorageReview={status:'ok'|'warning'|'critical'|'unknown';totalBytes:number|null;availableBytes:number|null;availablePercent:number|null;reason:'capacity'|'unavailable'|'invalid_metrics'};
/** Read-only capacity of the server-visible filesystem, not SSD identity or encryption. */
export function assessStorageCapacity(totalBytes:number,availableBytes:number):StorageReview{
 if(!Number.isSafeInteger(totalBytes)||totalBytes<=0||!Number.isSafeInteger(availableBytes)||availableBytes<0||availableBytes>totalBytes)return {status:'unknown',totalBytes:null,availableBytes:null,availablePercent:null,reason:'invalid_metrics'};
 const fraction=availableBytes/totalBytes;
 const status=fraction<=0.05?'critical':fraction<=0.15?'warning':'ok';
 return {status,totalBytes,availableBytes,availablePercent:100*fraction,reason:'capacity'};
}
export async function reviewStorageCapacity(dataDir:string):Promise<StorageReview>{
 try{const fs=await statfs(dataDir);return assessStorageCapacity(fs.blocks*fs.bsize,fs.bavail*fs.bsize);}
 catch{return {status:'unknown',totalBytes:null,availableBytes:null,availablePercent:null,reason:'unavailable'};}
}
