import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { previewFingerprint } from './studio-preview-fingerprint.mts';

test('preview evidence changes for every packaged asset and native source change',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'redion-preview-proof-'));
  const write=(name:string,data:string)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,data);};
  try{
    for(const name of ['main.cjs','paths.cjs','auto-update.cjs','update-policy.cjs','package.json','generated/preload.cjs'])write('windows/'+name,name);
    write('build/windows-app/index.html','html');
    write('build/windows-app/quell/editor.js','code');
    const before=previewFingerprint(root);
    assert.equal(previewFingerprint(root),before);
    write('build/windows-app/quell/editor.js','changed');
    assert.notEqual(previewFingerprint(root),before);
    write('build/windows-app/quell/editor.js','code');
    assert.equal(previewFingerprint(root),before);
    write('build/windows-app/extra.css','new');
    assert.notEqual(previewFingerprint(root),before);
    fs.unlinkSync(path.join(root,'build/windows-app/extra.css'));
    assert.equal(previewFingerprint(root),before);
    write('windows/generated/preload.cjs','changed');
    assert.notEqual(previewFingerprint(root),before);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
