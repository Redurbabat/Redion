import crypto = require('node:crypto');
import { fault } from './automation-contract.cjs';

/** Kurzlebige Bildbytes. Weder Dateipfade noch Base64 werden in der Bridge abgelegt. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export type ImageMetadata = { artifactId:string; mimeType:'image/png'|'image/jpeg'; bytes:number;
  sha256:string; width:number; height:number; expires:string; documentId?:string; blockId?:string;target:string };
type Artifact = { owner:string; expires:number; bytes:Buffer; metadata:ImageMetadata;timer:ReturnType<typeof setTimeout> };
export class VisualArtifacts {
  private entries=new Map<string,Artifact>();
  constructor(private readonly now:()=>number=Date.now) {}
  private remove(id:string):void {const entry=this.entries.get(id);if(entry){clearTimeout(entry.timer);entry.bytes.fill(0);}this.entries.delete(id);}
  private prune():void {for(const [id,entry] of this.entries)if(entry.expires<=this.now())this.remove(id);}
  put(owner:string,bytes:Buffer,info:{mimeType:'image/png'|'image/jpeg';width:number;height:number;target:string;documentId?:string;blockId?:string}):ImageMetadata {
    this.prune();
    if(bytes.length===0||bytes.length>MAX_IMAGE_BYTES||!Number.isSafeInteger(info.width)||!Number.isSafeInteger(info.height)||
      info.width<1||info.height<1||info.width>4096||info.height>4096)throw fault('IMAGE_TOO_LARGE','Das Bild überschreitet die erlaubte Grösse.');
    while(this.entries.size>=8||[...this.entries.values()].reduce((sum,e)=>sum+e.bytes.length,0)+bytes.length>16*1024*1024)
      this.remove(this.entries.keys().next().value!);
    const artifactId=crypto.randomUUID(),expires=this.now()+60_000;
    const metadata:ImageMetadata={artifactId,...info,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),expires:new Date(expires).toISOString()};
    const timer=setTimeout(()=>this.remove(artifactId),60_000);timer.unref();
    this.entries.set(artifactId,{owner,expires,bytes:Buffer.from(bytes),metadata,timer});return {...metadata};
  }
  read(owner:string,id:unknown):{metadata:ImageMetadata;bytes:Buffer} {
    this.prune();const entry=typeof id==='string'?this.entries.get(id):undefined;
    if(!entry||entry.owner!==owner)throw fault('IMAGE_EXPIRED','Das Bild ist abgelaufen oder gehört nicht zu dieser Sitzung.');
    return {metadata:{...entry.metadata},bytes:Buffer.from(entry.bytes)};
  }
  release(owner?:string):void {for(const [id,e] of this.entries)if(owner===undefined||e.owner===owner)this.remove(id);}
}
