/* PDF-Studio: Radierkurven, Abheben und Abbruch gegen die echte Ink-Schicht
 * und den echten IndexedDB-Store. REDION_INK_SOURCE erlaubt die Gegenprobe
 * mit der alten TypeScript-Quelle, ohne erzeugte Dateien zu verändern. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import ts from 'typescript';
declare const Store: any;
declare const Marken: any;
const root = path.resolve(import.meta.dirname, '../..');
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent((req.url || '/index.html').split('?')[0]!));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'} as Record<string,string>)[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch();
const url = `http://127.0.0.1:${(server.address() as any).port}/index.html`;
try {
 for (const width of [390, 820, 1440]) {
  const page = await browser.newPage({viewport:{width,height:900},hasTouch:width < 1000});
  if (process.env.REDION_INK_SOURCE) await page.route('**/quell/bereiche/pdf/marken.js', route => route.fulfill({contentType:'text/javascript',body:ts.transpileModule(fs.readFileSync(process.env.REDION_INK_SOURCE!, 'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText}));
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(url); await page.waitForFunction('typeof Marken !== "undefined" && typeof Store !== "undefined" && Store.cache');
  await page.waitForTimeout(1000);
  const result = await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay, #rg-willkommen').forEach(n => n.remove());
    const parent = Store.addPage(null, {text:'Radierprobe'});
    const initial = [
      {id:'curve',art:'stift',breite:1,farbe:'#111111',pts:[[145,200],[155,200]]},
      {id:'chord',art:'stift',breite:1,farbe:'#111111',pts:[[145,100],[155,100]]}
    ];
    const block = Store.addBlock(parent.id,'pdfseite',{bw:300,bh:300,raumVersion:1,marken:initial});
    const controls = Marken.schicht(block,300,300); const svg=controls.flaeche as SVGSVGElement;
    svg.style.cssText='width:300px;height:300px;position:fixed;left:20px;top:20px;z-index:99999'; document.body.append(svg);
    controls.setzeWerkzeug('radierer'); controls.setzeRadierModus('ganz'); controls.setEraserSize(5);
    const event = (type:string,x:number,y:number) => {
      const p = new DOMPoint(x,y).matrixTransform(svg.getScreenCTM()!);
      return new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:71,pointerType:'mouse',isPrimary:true,button:0,buttons:type==='pointerup'?0:1,clientX:p.x,clientY:p.y});
    };
    const send = (type:string,x:number,y:number) => svg.dispatchEvent(event(type,x,y));
    const ids=()=>controls.marken.map((m:any)=>m.id).sort();
    send('pointerdown',100,100);
    const move=event('pointermove',200,100);
    Object.defineProperty(move,'getCoalescedEvents',{value:()=>[event('pointermove',150,200),event('pointermove',200,100)]});
    svg.dispatchEvent(move); send('pointerup',200,100);
    const curved=ids(); controls.undo(); const undo=ids(); controls.redo(); const redo=ids(); controls.undo();
    send('pointerdown',100,200); send('pointerup',155,200); const endpoint=ids(); controls.undo();
    const before=JSON.stringify(Store.getBlock(block.id).marken);
    send('pointerdown',150,200); const preview=ids(); send('pointercancel',150,200);
    const cancelled=ids(), noUndo=!controls.state().undo, saved=JSON.stringify(Store.getBlock(block.id).marken)===before;
    // Ein Tipp auf den obersten Strich löscht nicht beim Abheben den Nachbarn.
    const over=Store.addBlock(parent.id,'pdfseite',{bw:300,bh:300,marken:[{...initial[0],id:'bottom'},{...initial[0],id:'top'}]});
    const top=Marken.schicht(over,300,300); const topSvg=top.flaeche; topSvg.style.cssText=svg.style.cssText; document.body.append(topSvg);
    top.setzeWerkzeug('radierer'); top.setzeRadierModus('ganz');
    const pos=new DOMPoint(150,200).matrixTransform(topSvg.getScreenCTM());
    const props={bubbles:true,pointerId:72,pointerType:'mouse',isPrimary:true,button:0,buttons:1,clientX:pos.x,clientY:pos.y};
    topSvg.querySelector('[data-sid="top"]').dispatchEvent(new PointerEvent('pointerdown',props));
    topSvg.dispatchEvent(new PointerEvent('pointerup',{...props,buttons:0}));
    const stacked=top.marken.map((m:any)=>m.id);
    await Store.flush(); svg.remove(); topSvg.remove();
    return {curved,undo,redo,endpoint,preview,cancelled,noUndo,saved,stacked,id:block.id};
  });
  assert.deepEqual(result.curved,['chord'],`${width}: die Kurve löscht ihren Treffer und erhält die Sehne`);
  assert.deepEqual(result.undo,['chord','curve']); assert.deepEqual(result.redo,['chord']);
  assert.deepEqual(result.endpoint,['chord'], 'Abheben verarbeitet die letzte Position');
  assert.deepEqual(result.preview,['chord'], 'Radierkreis reagiert vor dem Loslassen');
  assert.deepEqual(result.cancelled,['chord','curve']); assert.ok(result.noUndo); assert.ok(result.saved);
  assert.deepEqual(result.stacked,['bottom'], 'Ein Tipp bleibt ein Treffer');
  await page.reload(); await page.waitForFunction(id => typeof Store !== 'undefined' && !!Store.getBlock(id),result.id);
  const reopened=await page.evaluate(id=>Store.getBlock(id).marken.map((m:any)=>m.id).sort(),result.id);
  assert.deepEqual(reopened,['chord','curve']); assert.deepEqual(errors,[]);
  console.log(`✓ ${width}px: Kurve, Endpunkt, Vorschau, Abbruch, Undo/Redo, Stapel und Neuladen`);
  await page.close();
 }
} finally { await browser.close(); await new Promise<void>(resolve=>server.close(()=>resolve())); }
