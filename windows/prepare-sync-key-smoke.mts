import {stripTypeScriptTypes} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),out=resolve(root,'windows/generated/red-sync-smoke');
mkdirSync(out,{recursive:true});
for(const [source,target] of [['tools/red-windows-sync-keys.cts','red-windows-sync-keys.cjs'],['windows/red-sync-keys-smoke.cts','red-sync-keys-smoke.cjs']] as const){
 const text=readFileSync(resolve(root,source),'utf8').replace('../tools/red-windows-sync-keys.cts','./red-windows-sync-keys.cjs');
 writeFileSync(resolve(out,target),stripTypeScriptTypes(text,{mode:'strip'}),'utf8');
}
