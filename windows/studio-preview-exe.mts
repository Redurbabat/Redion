/** Isolated unsigned portable preview. No release publishing or installation. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const windows=import.meta.dirname;
const root=path.resolve(windows,'..');
if(process.platform!=='win32')throw Error('Die Windows-Vorschau wird auf Windows gebaut.');
const pkg=JSON.parse(fs.readFileSync(path.join(windows,'package.json'),'utf8'));
const out=path.join(root,'build','studio-preview');
fs.mkdirSync(out,{recursive:true});
const config=path.join(out,'builder-config.json');
const executable=path.join(out,'RED-Studio-Preview.exe');
if(fs.existsSync(executable))fs.unlinkSync(executable);
const run=(file:string,args:string[],cwd:string)=>{
  const result=spawnSync(file,args,{cwd,stdio:'inherit',env:{...process.env,CSC_IDENTITY_AUTO_DISCOVERY:'false'}});
  if(result.error||result.status!==0)throw result.error||Error('Vorschau-Bau fehlgeschlagen: '+args.join(' '));
};
run(process.execPath,[path.join(windows,'prepare.mjs')],windows);
run(process.execPath,[path.join(root,'plugins/red-ion/build.mts')],root);
fs.writeFileSync(config,JSON.stringify({
  ...pkg.build,appId:'ch.redurbabat.redion.studio.preview',productName:'RED Studio Preview',
  extraMetadata:{studioPreview:true},
  directories:{...pkg.build.directories,output:out},
  artifactName:'RED-Studio-Preview.exe',
  win:{...pkg.build.win,target:[{target:'portable',arch:['x64']}],forceCodeSigning:false},
  publish:null
},null,2));
run(process.execPath,[path.join(windows,'node_modules/electron-builder/cli.js'),'--config',config,'--win','portable','--x64','--publish','never'],windows);
if(!fs.statSync(executable).isFile())throw Error('Portable EXE fehlt.');
const hash=createHash('sha256');
for await(const chunk of fs.createReadStream(executable))hash.update(chunk);
fs.writeFileSync(path.join(out,'SHA256.txt'),hash.digest('hex')+'  RED-Studio-Preview.exe\n');
console.log('Isolierte, unsignierte Vorschau:',executable);
