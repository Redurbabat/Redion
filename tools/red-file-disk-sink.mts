/** Expliziter Klartextexport. Nur für ein vom Nutzer gewähltes, vertrauenswürdiges Verzeichnis. */
import {open,link,unlink,mkdtemp,rm,realpath,stat} from 'node:fs/promises';
import type {FileHandle} from 'node:fs/promises';
import {dirname,basename,join,resolve} from 'node:path';
import type {RedFileSink} from '../red-sdk/client.mts';

export function createDiskDownloadSink(destination:string):RedFileSink{
 const target=resolve(destination),name=basename(target);
 if(!name||name==='.'||name==='..')throw Error('Ungültiges Exportziel');
 let stage:string|null=null,handle:FileHandle|null=null,final:string|null=null,offset=0,total=0;
 let state:'new'|'staging'|'done'|'aborted'='new';
 async function abort(){
  if(state==='done')return;
  if(handle){await handle.close();handle=null;}
  if(stage){await rm(stage,{recursive:true,force:true});stage=null;}
  state='aborted';
 }
 return {
  async begin(info){
   if(state!=='new'||!Number.isSafeInteger(info.size)||info.size<0||info.size>8*1024*1024)throw Error('Ungültiger Export');
   state='staging';total=info.size;
   const parent=await realpath(dirname(target));if(!(await stat(parent)).isDirectory())throw Error('Exportordner fehlt');
   final=join(parent,name);stage=await mkdtemp(join(parent,'.redion-download-'));
   handle=await open(join(stage,'data'),'wx',0o600);
  },
  async write(bytes,position){
   if(state!=='staging'||!handle||position!==offset||bytes.length<1||offset+bytes.length>total)throw Error('Ungültiges Dateistück');
   let written=0;while(written<bytes.length){const r=await handle.write(bytes,written,bytes.length-written,offset+written);if(r.bytesWritten<1)throw Error('Schreibvorgang fehlgeschlagen');written+=r.bytesWritten;}
   offset+=written;
  },
  async commit(){
   if(state!=='staging'||!handle||!stage||!final||offset!==total)throw Error('Export unvollständig');
   await handle.sync();await handle.close();handle=null;
   // Hardlink ist atomar und überschreibt kein bestehendes Ziel. Kein unsicherer Fallback.
   await link(join(stage,'data'),final);
   try{await rm(stage,{recursive:true,force:true});stage=null;state='done';}
   catch(error){try{await unlink(final);}catch(rollback){throw new AggregateError([error,rollback],'Export veröffentlicht; Bereinigung nicht bestätigt');}throw error;}
  },
  abort
 };
}
