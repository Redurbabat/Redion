/** Nur lesende Entwicklungsdiagnose, keine Nutzerdaten und keine Netzwerkzugriffe. */
import {stat,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const required=['index.html','redion-einzeldatei.html','sw.js','src/start.ts','server/home-server.ts','red-sdk/client.mts','windows/package.json','capacitor.config.json','codemagic.yaml','plugins/red-ion/README.md'] as const;
export function supportedNode(version:string):boolean{
 const m=/^v?(\d+)\.(\d+)\.\d+$/.exec(version);
 if(!m)return false;
 const major=Number(m[1]),minor=Number(m[2]);return major>22||major===22&&minor>=18;
}
export async function inspectDeveloper(root:string,nodeVersion=process.versions.node){
 const files=await Promise.all(required.map(async path=>{
  try{return {path,present:(await stat(join(root,path))).isFile()};}catch{return {path,present:false};}
 }));
 let version:string|null=null;
 try{const v=JSON.parse(await readFile(join(root,'package.json'),'utf8')) as {version?:unknown};if(typeof v.version==='string'&&/^\d+\.\d+\.\d+$/.test(v.version))version=v.version;}catch{/* Kein erratenes Ergebnis. */}
 return {version:1,appVersion:version,nodeSupported:supportedNode(nodeVersion),files,readyForSourceInspection:!!version&&supportedNode(nodeVersion)&&files.every(f=>f.present),buildVerified:false,ciVerified:false,deviceVerified:false};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const result=await inspectDeveloper(resolve(fileURLToPath(new URL('..',import.meta.url))));
 console.log(JSON.stringify(result,null,2));
 if(!result.readyForSourceInspection)process.exitCode=1;
}
