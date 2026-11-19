import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { build } from 'rolldown';
const root=path.resolve(import.meta.dirname,'../..');
const plugin=import.meta.dirname;
const result=await build({input:path.join(plugin,'server/index.mts'),platform:'node',external:[/^node:/],
  output:{file:path.join(plugin,'server/dist/index.mjs'),format:'esm',codeSplitting:false}});
void result;
const target=path.join(root,'build/red-ion-plugin');fs.mkdirSync(path.join(target,'server/dist'),{recursive:true});
for(const file of ['plugin.json','mcp.json','README.md','Install.ps1','Start-MCP.ps1','Start-Tunnel.ps1','Diagnose.ps1']) {
  if(!fs.existsSync(path.join(plugin,file)))throw new Error('Plugin-Datei fehlt: '+file);
  if(file.endsWith('.ps1'))fs.writeFileSync(path.join(target,file),'\uFEFF'+fs.readFileSync(path.join(plugin,file),'utf8').replace(/^\uFEFF/,''));
  else fs.copyFileSync(path.join(plugin,file),path.join(target,file));
}
fs.copyFileSync(path.join(plugin,'server/dist/index.mjs'),path.join(target,'server/dist/index.mjs'));
// Optionaler offizieller Windows-Client: nur die zuvor geprüfte feste Version.
// Keine Downloads beim normalen Build und keine Aufnahme fremder lokaler Dateien.
const tunnelSource=path.join(root,'build/redion-mcp-tools/v0.0.21/extracted');
const tunnelExe=path.join(tunnelSource,'tunnel-client.exe');
if(fs.existsSync(tunnelExe)) {
  if(crypto.createHash('sha256').update(fs.readFileSync(tunnelExe)).digest('hex')!=='e0b2f25d08f24a4ddb7a04f3d43b62f88d4b18a5b20f2e478295cd8f353f21e5')throw new Error('Ungeprüfter Tunnel-Client.');
  fs.mkdirSync(path.join(target,'tools'),{recursive:true});
  for(const name of ['tunnel-client.exe','LICENSE','NOTICE','tunnel-client-v0.0.21-windows-amd64-licenses.txt'])
    fs.copyFileSync(path.join(tunnelSource,name),path.join(target,'tools',name));
  fs.writeFileSync(path.join(target,'tools/sha256.txt'),'e0b2f25d08f24a4ddb7a04f3d43b62f88d4b18a5b20f2e478295cd8f353f21e5  tunnel-client.exe\n');
}
const licenses:string[]=[];
const walk=(directory:string):void=>{
  for(const item of fs.readdirSync(directory,{withFileTypes:true})) {
    if(item.name.startsWith('.'))continue;
    const full=path.join(directory,item.name);
    if(item.isDirectory())walk(full);
    else if(/^licen[cs]e(?:\.md|\.txt)?$/i.test(item.name))licenses.push('\n\n--- '+path.relative(plugin,full)+' ---\n'+fs.readFileSync(full,'utf8'));
  }
};
walk(path.join(plugin,'node_modules'));fs.writeFileSync(path.join(target,'THIRD-PARTY-LICENSES.txt'),licenses.join(''));
console.log('RED Ion Plugin vorbereitet:',target);
