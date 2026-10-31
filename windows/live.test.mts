import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { classifyChange } from './live.mts';
import { webRootFiles } from './web-files.mts';
const require = createRequire(import.meta.url);
const { startLiveReload, readRevision } = require('./live-reload.cts');

test('nur relevante Ordneränderungen triggern den Live-Bau', () => {
  assert.equal(classifyChange('src','bereiche/test.ts'), 'compile');
  assert.equal(classifyChange('src','register/fachzeichen.ts'), 'compile');
  assert.equal(classifyChange('root','index.html'), 'stage');
  assert.equal(classifyChange('root','sw.js'), 'stage');
  assert.equal(classifyChange('root','batterie-aufgaben.js'), 'stage');
  assert.equal(classifyChange('src',null), 'compile');
  assert.equal(classifyChange('root','package.json'), 'compile');
  assert.equal(classifyChange('quell','schale/stil/bausteine.css'), 'stage');
  assert.equal(classifyChange('quell','schale/aufbau/app.js',true), null);
  assert.equal(classifyChange('oeffentlich','icons/icon-512.png'), 'stage');
  assert.equal(classifyChange('windows','main.cjs'), 'native');
  assert.equal(classifyChange('windows','preload.cts'), 'native');
  assert.equal(classifyChange('windows','node_modules/electron/a.js'), null);
  assert.equal(classifyChange('windows','generated/preload.cjs'), null);
  assert.equal(classifyChange('root','.env'), null);
  assert.equal(classifyChange('src','../.git/secret'), null);
  assert.equal(classifyChange('root','readme.md'), null);
});

test('nur ausdrücklich von index.html referenzierte Root-JS-Dateien werden paketiert', () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'redion-webassets-'));
  try {
    fs.writeFileSync(path.join(root,'index.html'),
      '<script src="batterie-aufgaben.js" defer></script>'+
      '<script src="quell/start.js" defer></script>'+
      '<script src="../secret.js"></script>'+
      '<script src="https://example.org/remote.js"></script>');
    assert.deepEqual(webRootFiles(root), ['batterie-aufgaben.js','index.html','sw.js','version.json','version.md']);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('Live-Reload: Stempel nur nach erfolgreichem Bau, einmal je Stand, kein Nutzerdatenverlust', async () => {
  const events = new EventEmitter();
  const callbacks = [];
  let stamp = JSON.stringify({ revision: 1, status: 'ready' });
  let watched, closed = false, reloads = 0, safe = false, saves = 0;
  const io = {
    readFileSync:()=>stamp,
    watch:(_dir,callback)=>{ watched=callback; return {close(){closed=true;}}; }
  };
  const webContents=Object.assign(events,{
    isDestroyed:()=>false,
    isLoading:()=>false,
    executeJavaScript:async code=>{
      if(code.includes('__redionLiveTracking')) return;
      saves++;
      return safe;
    },
    reloadIgnoringCache:()=>{reloads++;}
  });
  const window={webContents,isDestroyed:()=>false};
  const controller=startLiveReload({
    buildDir:'C:/redion/build',window,io,
    timer: fn=>{callbacks.push(fn);return fn;},
    clear:fn=>{const i=callbacks.indexOf(fn);if(i>=0)callbacks.splice(i,1);},
    logger:{warn(){},info(){}}
  });
  const tick=async()=>{const fn=callbacks.shift();assert.ok(fn);fn();await new Promise(resolve=>setImmediate(resolve));};
  assert.equal(readRevision('C:/redion/build',io),1);
  watched('rename','other.txt'); assert.equal(callbacks.length,0);
  stamp=JSON.stringify({revision:2,status:'ready'});
  watched('rename','windows-live-stand.json');
  await tick(); assert.equal(reloads,0); assert.equal(saves,1);
  safe=true;
  await tick(); assert.equal(reloads,1); assert.equal(saves,2);
  watched('rename','windows-live-stand.json');assert.equal(callbacks.length,0);
  stamp='{"revision":3,"status":"building"}';
  watched('rename','windows-live-stand.json');assert.equal(callbacks.length,0);
  stamp='{"revision":3,"status":"ready"}';
  watched('rename','windows-live-stand.json');await tick();assert.equal(reloads,2);
  controller.stop();assert.equal(closed,true);
  stamp='{"revision":4,"status":"ready"}';
  watched('rename','windows-live-stand.json');assert.equal(callbacks.length,0);
});
