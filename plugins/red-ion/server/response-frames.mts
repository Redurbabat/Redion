import crypto from 'node:crypto';
import { MAX_IMAGE_BYTES } from '../../../windows/visual-artifacts.cts';
import { fault, type ActionResult } from '../../../windows/automation-contract.cts';

export type BridgeResponse=ActionResult & {id?:string;bytes?:Buffer};
/** Eine JSON-Kopfzeile, optional gefolgt von exakt N rohen Bildbytes. */
export class ResponseFrames {
  private buffer=Buffer.alloc(0);
  private binary:{result:BridgeResponse;length:number;sha256:string}|null=null;
  push(chunk:Buffer):BridgeResponse[] {
    if(this.buffer.length+chunk.length>MAX_IMAGE_BYTES+2*1024*1024)throw fault('INVALID_FRAME','Die Antwort ist zu gross.');
    this.buffer=Buffer.concat([this.buffer,chunk]);const results:BridgeResponse[]=[];
    while(this.buffer.length) {
      if(this.binary) {
        if(this.buffer.length<this.binary.length)break;
        const bytes=Buffer.from(this.buffer.subarray(0,this.binary.length));this.buffer=this.buffer.subarray(this.binary.length);
        if(crypto.createHash('sha256').update(bytes).digest('hex')!==this.binary.sha256)throw fault('INVALID_FRAME','Das Bild wurde unvollständig übertragen.');
        results.push({...this.binary.result,bytes});this.binary=null;continue;
      }
      const newline=this.buffer.indexOf(10);
      if(newline<0){if(this.buffer.length>2*1024*1024)throw fault('INVALID_FRAME','Die Kopfzeile ist zu gross.');break;}
      if(newline>2*1024*1024)throw fault('INVALID_FRAME','Die Kopfzeile ist zu gross.');
      const parsed=JSON.parse(this.buffer.subarray(0,newline).toString('utf8')) as BridgeResponse & {binary?:{length?:unknown;sha256?:unknown}};
      this.buffer=this.buffer.subarray(newline+1);
      if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||typeof parsed.ok!=='boolean')throw fault('INVALID_FRAME','Ungültige Antwort.');
      if(Object.keys(parsed).some(key=>!['id','ok','data','error','operationId','binary'].includes(key)))throw fault('INVALID_FRAME','Unbekanntes Antwortfeld.');
      if(parsed.binary!==undefined) {
        const b=parsed.binary;
        if(!parsed.ok||!b||!Number.isSafeInteger(b.length)||Number(b.length)<1||Number(b.length)>MAX_IMAGE_BYTES||
          typeof b.sha256!=='string'||!/^[a-f0-9]{64}$/.test(b.sha256))throw fault('INVALID_FRAME','Ungültiger Bildrahmen.');
        delete parsed.binary;this.binary={result:parsed,length:Number(b.length),sha256:b.sha256};
      }else results.push(parsed);
    }
    return results;
  }
}
