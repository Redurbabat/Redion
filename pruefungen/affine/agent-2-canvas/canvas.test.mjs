import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { chromium } from 'playwright';

const root=path.resolve(import.meta.dirname,'../../..');
const dir=path.join(root,'src/integrationen/affine/canvas');
const sources=['model','adapter','host-bridge'];
const compiled=Object.fromEntries(sources.map(name=>[name,ts.transpileModule(fs.readFileSync(path.join(dir,name+'.ts'),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText]));
const loader='(()=>{const cache={};const modules={'+sources.map(name=>JSON.stringify('./'+name+'.js')+':(module,exports,require)=>{'+compiled[name]+'}').join(',')+'};function load(name){if(cache[name])return cache[name].exports;const module={exports:{}};cache[name]=module;modules[name](module,module.exports,load);return module.exports;}return {model:load("./model.js"),adapter:load("./adapter.js"),bridge:load("./host-bridge.js")};})()';
const {model:m}=vm.runInThisContext(loader);
const shape=(id='a')=>m.createShape(id,'pen',[m.point(0,0),m.point(10,10)],m.defaults);
test('Strenge Typprüfung der drei Quellen',()=>{
  const program=ts.createProgram(sources.map(n=>path.join(dir,n+'.ts')),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,strict:true,noEmit:true,noUncheckedIndexedAccess:true,exactOptionalPropertyTypes:true,noUnusedLocals:true,noUnusedParameters:true,skipLibCheck:true});
  const errors=ts.getPreEmitDiagnostics(program);
  assert.equal(errors.length,0,ts.formatDiagnosticsWithColorAndContext(errors,{getCurrentDirectory:()=>root,getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));
});
test('Speichern, Laden, Undo/Redo und ungültigen Import atomar ablehnen',()=>{
  const b=new m.BoardModel('doc');assert.equal(b.replace([shape()]),true);
  const stored=b.serialize();assert.equal(b.undo(),true);assert.equal(b.serialize().objects.length,0);
  assert.equal(b.redo(),true);assert.deepEqual(b.serialize(),stored);
  assert.deepEqual(new m.BoardModel('doc',JSON.parse(JSON.stringify(stored))).serialize(),stored);
  assert.throws(()=>b.import({...stored,version:2}));assert.deepEqual(b.serialize(),stored);
  assert.throws(()=>b.import({...stored,documentId:'fremd'}));
  assert.throws(()=>b.replace([{...shape(),image:'data:image/svg+xml;base64,AAAA'}]));
  assert.throws(()=>b.replace([shape(),shape()]));
  assert.throws(()=>b.replace([{...shape(),points:[m.point(Infinity,0)]}]));
  assert.deepEqual(b.serialize(),stored);
});
test('Gruppen, Bewegung, Verbindungen und Koordinaten',()=>{
  const a={...shape('a'),group:'g'},b={...shape('b'),group:'g'};
  const c={...shape('c'),kind:'connector',from:'a',to:'b'};
  const group=m.expandGroups([a,b,c],new Set(['a']));assert.deepEqual([...group],['a','b']);
  const moved=m.moveObjects([a,b,c],group,5,8);assert.equal(moved[0].points[0].x,5);
  assert.equal(m.without(moved,new Set(['a']))[1].from,'');
  const cursor=m.point(120,70),view={x:15,y:20,zoom:1.5};
  const next=m.zoomAt(cursor,view,2);assert.deepEqual(m.worldPoint(cursor,next),m.worldPoint(cursor,view));
  assert.equal(m.hit(a,m.point(5,5),1),true);
});
test('Chromium: Desktop und simulierte mobile Pointer-/Touch-Ereignisse',async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    for(const viewport of [{width:1024,height:768},{width:390,height:844}]){
      const mobile=viewport.width<500,context=await browser.newContext({viewport,hasTouch:mobile,isMobile:mobile,reducedMotion:'reduce'});
      const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
      await page.setContent('<meta name="viewport" content="width=device-width, initial-scale=1"><div id="host" style="height:700px;width:100%"></div>');
      await page.addScriptTag({content:'window.a2='+loader+';'});
      await page.evaluate(()=>{window.changes=[];window.a=new window.a2.adapter.CanvasAdapter({host:document.querySelector('#host'),documentId:'test',onChange:b=>window.changes.push(b),settings:{minimized:true}});});
      await page.waitForFunction(()=>document.querySelector('canvas').width>1);
      const canvas=page.locator('canvas');
      const gesture=async(cancel=false,offset=0)=>{
        for(const [type,x,y] of [['pointerdown',100+offset,300],['pointermove',160+offset,350],[cancel?'pointercancel':'pointerup',180+offset,360]]){
          await canvas.dispatchEvent(type,{pointerId:1,pointerType:mobile?'touch':'pen',isPrimary:true,button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y,pressure:.7,bubbles:true});
        }
      };
      await gesture(true);assert.equal(await page.evaluate(()=>window.a.serialize().objects.length),0);
      await gesture();assert.equal(await page.evaluate(()=>window.a.serialize().objects.length),1);
      await page.evaluate(()=>window.a.updateSettings({tool:'rectangle'}));await gesture(false,60);
      await page.evaluate(()=>window.a.command('undo'));assert.equal(await page.evaluate(()=>window.a.serialize().objects.length),1);
      await page.evaluate(()=>window.a.command('redo'));assert.equal(await page.evaluate(()=>window.a.serialize().objects.length),2);
      await page.evaluate(()=>{window.a.updateSettings({tool:'select'});window.a.command('zoomIn');});
      assert.ok(await page.evaluate(()=>window.a.getView().zoom>1));
      assert.ok(await page.evaluate(()=>window.a.exportPNG().startsWith('data:image/png;base64,')));
      const saved=await page.evaluate(()=>window.a.exportJSON());
      await page.evaluate(value=>window.a.import(JSON.parse(value)),saved);
      assert.equal(await page.evaluate(()=>window.a.exportJSON()),saved);
      await page.evaluate(()=>{window.a.updateSettings({minimized:false,vertical:true});window.a.setTheme('dark');});
      assert.ok(await page.getByRole('button',{name:'Stift',exact:true}).isVisible());
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.evaluate(()=>window.a.dispose());assert.equal(await canvas.count(),0);
      assert.deepEqual(errors,[]);
      await context.close();
    }
  }finally{await browser.close();}
});
test('PDF-/Elektro-Host: nur erlaubte Befehle, kein zweites Datenmodell',async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const page=await browser.newPage();await page.setContent('<div id="host" style="position:relative;width:600px;height:500px"></div>');
    await page.addScriptTag({content:'window.a2='+loader+';'});
    const result=await page.evaluate(()=>{
      const pdf={annotations:[{id:'old',pts:[[1,2],[3,4]]}]},plan={teile:[{zeichen:'lampe'}],leitungen:[]};
      const before=JSON.stringify({pdf,plan}),calls=[];let writable=false;
      const dock=window.a2.bridge.mountExistingDock({root:document.querySelector('#host'),documentId:'pdf',tools:['pen'],commands:['undo'],settingsKeys:['color'],canEdit:()=>writable,onTool:t=>calls.push(t),onCommand:c=>calls.push(c)});
      const click=label=>document.querySelector('[aria-label="'+label+'"]')?.click();
      click('Stift');click('Rückgängig');writable=true;click('Stift');click('Rückgängig');
      const unsupported=document.querySelector('[aria-label="Verbinder"]')===null;dock.dispose();
      return {calls,unchanged:before===JSON.stringify({pdf,plan}),unsupported};
    });
    assert.deepEqual(result,{calls:['pen','undo'],unchanged:true,unsupported:true});
  }finally{await browser.close();}
});
