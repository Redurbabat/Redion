import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
export function previewFingerprint(root:string):string{
  const hash=createHash('sha256');
  for(const file of ['index.html','quell/schale/stil/redion2.css','quell/core/gfx/toolbar.js','quell/bereiche/bloecke/arten/planflaeche.js','quell/bereiche/bloecke/arten/zeichenflaeche.js','quell/bereiche/pdf/document-mode.js']){
    hash.update(file+'\0');hash.update(fs.readFileSync(path.join(root,'build','windows-app',file)));hash.update('\0');
  }
  return hash.digest('hex');
}
