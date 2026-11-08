import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {
  configuredSource, saveConfiguredSource, validateSource, scriptRootFiles,
  snapshot, shouldRestage, startSourceUpdates
} = require('./local-source.cts');

type FixturePaths = { root: string; appData: string; base: string };

function fixture<T>(run: (paths: FixturePaths) => T): T {
  const base=fs.mkdtempSync(path.join(os.tmpdir(), 'redion-local-updates-'));
  const root=path.join(base,'checkout'), appData=path.join(base,'config');
  fs.mkdirSync(root); fs.mkdirSync(appData);
  fs.mkdirSync(path.join(root,'quell'));
  fs.mkdirSync(path.join(root,'src'));
  fs.writeFileSync(path.join(root,'package.json'),'{"name":"redion","version":"2026.8.4"}');
  fs.writeFileSync(path.join(root,'index.html'),
    '<script src="quell/start.js" defer></script><script src="batterie-aufgaben.js" defer></script>');
  fs.writeFileSync(path.join(root,'sw.js'),'');
  fs.writeFileSync(path.join(root,'version.json'),'{"version":"2026.8.4"}');
  fs.writeFileSync(path.join(root,'version.md'),'# 2026.8.4');
  fs.writeFileSync(path.join(root,'batterie-aufgaben.js'),'window.BatterieAufgaben={};');
  fs.writeFileSync(path.join(root,'quell/start.js'),'window.Redion=1;');
  fs.writeFileSync(path.join(root,'src/secret.ts'),'let secret="should not be copied";');
  fs.writeFileSync(path.join(root,'.env'),'NEVER-COPY');
  try { return run({root,appData,base}); }
  finally {fs.rmSync(base,{recursive:true,force:true});}
}

test('Verbinden ist opt-in und speichert nur einen privaten Pfad', () => fixture(({root,appData}) => {
  assert.equal(configuredSource(appData), null);
  assert.equal(validateSource(root, appData), true);
  assert.deepEqual(scriptRootFiles(root).sort(),
    ['index.html','sw.js','version.json','version.md','batterie-aufgaben.js'].sort());
  saveConfiguredSource(appData, root);
  assert.equal(configuredSource(appData), fs.realpathSync(root));
  assert.throws(() => saveConfiguredSource(appData, appData), /zulässig/);
  saveConfiguredSource(appData, null);
  assert.equal(configuredSource(appData), null);
  assert.equal(fs.readFileSync(path.join(root,'quell/start.js'),'utf8'),'window.Redion=1;');
}));

test('Vorschau enthält ausschliesslich zulässige Redion-Webdateien', () => fixture(({root,appData,base}) => {
  const dest=snapshot(root,path.join(base,'preview'),1,appData);
  assert.equal(fs.readFileSync(path.join(dest,'quell/start.js'),'utf8'),'window.Redion=1;');
  assert.ok(fs.existsSync(path.join(dest,'batterie-aufgaben.js')));
  assert.ok(fs.existsSync(path.join(dest,'version.md')));
  assert.ok(!fs.existsSync(path.join(dest,'src/secret.ts')));
  assert.ok(!fs.existsSync(path.join(dest,'.env')));
  assert.ok(!fs.existsSync(path.join(dest,'package.json')));
  assert.throws(()=>snapshot(root,path.join(base,'preview'),1,appData), /vorhanden/);
  assert.equal(shouldRestage('.git/objects/a'),false);
  assert.equal(shouldRestage('src/a.ts'),false);
  assert.equal(shouldRestage('quell/start.js'),true);
  assert.equal(shouldRestage('batterie-aufgaben.js'),true);
  assert.equal(shouldRestage('version.md'),true);
  assert.equal(shouldRestage('windows/main.cjs'),false);
}));

test('GitHub-Änderung übernimmt neuen Stand; unvollständige Dateien bewahren alten Stand', async () => {
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'redion-watcher-'));
  const root=path.join(base,'checkout'), appData=path.join(base,'config');
  fs.mkdirSync(root);fs.mkdirSync(appData);fs.mkdirSync(path.join(root,'quell'));
  const put=(f: string,v: string)=>fs.writeFileSync(path.join(root,f),v);
  put('package.json','{"name":"redion"}');
  put('index.html','<script src="quell/start.js" defer></script>');
  put('quell/start.js','version1');
  put('sw.js','');put('version.json','{}');put('version.md','');
  const received: string[]=[];
  const watcher: { handle?: (event: string, filename: string) => void } = {};
  try {
    const controller=startSourceUpdates({
      source:root, appData, previewBase:path.join(base,'preview'),
      markerDir:path.join(base,'marker'),debounceMs:10,
      onReady:(directory: string)=>received.push(directory),
      io:{watch:(_root: string,_options: { recursive: boolean },callback: (event: string, filename: string) => void)=>{
        watcher.handle=callback;
        return {on(){},close(){}};
      }},
      logger:{warn(){},info(){}}
    });
    assert.equal(controller.revision,1);
    assert.equal(received.length,1);
    put('quell/start.js','version2');
    assert.ok(watcher.handle, 'Ordnerbeobachtung registriert');
    watcher.handle('change','quell/start.js');
    await new Promise(resolve=>setTimeout(resolve,40));
    assert.equal(controller.revision,2);
    assert.equal(fs.readFileSync(path.join(controller.active,'quell/start.js'),'utf8'),'version2');
    fs.unlinkSync(path.join(root,'index.html'));
    watcher.handle('rename','index.html');
    await new Promise(resolve=>setTimeout(resolve,40));
    assert.equal(controller.revision,2);
    assert.equal(received.length,2);
    assert.equal(JSON.parse(fs.readFileSync(path.join(base,'marker/windows-live-stand.json'),'utf8')).revision,2);
    controller.stop();
  } finally {fs.rmSync(base,{recursive:true,force:true});}
});
