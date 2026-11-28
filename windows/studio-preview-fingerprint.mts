import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

/** Bind the proof to every staged renderer file, not merely a few screens.
 * Length-prefix the names and byte content; reject links and special files.
 * Native files are included as well, without reading arbitrary project data. */
export function previewFingerprint(root:string):string {
  const hash=createHash('sha256');
  const add=(relative:string, absolute:string):void=>{
    const stat=fs.lstatSync(absolute);
    if(stat.isSymbolicLink())throw Error('Symlink im Vorschau-Paket: '+relative);
    if(stat.isDirectory()){
      for(const name of fs.readdirSync(absolute).sort())add(relative+'/'+name,path.join(absolute,name));
      return;
    }
    if(!stat.isFile())throw Error('Ungültige Vorschau-Datei: '+relative);
    const bytes=fs.readFileSync(absolute);
    hash.update(JSON.stringify([relative,bytes.length])+'\n');hash.update(bytes);
  };
  add('renderer',path.join(root,'build','windows-app'));
  for(const file of ['main.cjs','paths.cjs','auto-update.cjs','update-policy.cjs','package.json','generated'])
    add('native/'+file,path.join(root,'windows',file));
  return hash.digest('hex');
}
