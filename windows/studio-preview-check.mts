/** Real Windows Electron renderer, synthetic documents, isolated test profile. */
import { _electron as electron } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { previewFingerprint } from './studio-preview-fingerprint.mts';
declare const Store:any, App:any, Schaltplan:any, GlassWheel:any;
if(process.platform!=='win32')throw Error('Native Windows-Abnahme erfordert Windows.');
const windows=import.meta.dirname;
const root=path.resolve(windows,'..');
const out=path.join(root,'build','studio-preview','screenshots');
fs.mkdirSync(out,{recursive:true});
for(const filename of ['result.json','01-elektro.png','02-simulator.png','03-whiteboard.png','04-whiteboard-ebenen.png','05-pdf.png','fehler.png']){
  fs.rmSync(path.join(out,filename),{force:true});
}
const fingerprint=previewFingerprint(root);
const require=createRequire(import.meta.url);
const app=await electron.launch({executablePath:require('electron'),args:[windows,'--redion-test-profile='+randomBytes(16).toString('hex'),'--force-device-scale-factor=1']});
const page=await app.firstWindow();
const errors:string[]=[];
page.on('pageerror',error=>errors.push(error.message));
try{
  await app.evaluate(({BrowserWindow})=>{const win=BrowserWindow.getAllWindows()[0]!;win.setSize(1440,900);});
  await page.waitForFunction(()=>typeof Store!=='undefined'&&typeof App!=='undefined'&&typeof Schaltplan!=='undefined');
  await page.waitForSelector('html[data-windows-titelleiste]');
  await page.evaluate(()=>{
    Store.setMeta('rundgangGesehen',true); Store.setMeta('neuerungenGesehen',1e9);
    Store.setMeta('kartenGemeldet',new Date().toISOString().slice(0,10));
    if(typeof GlassWheel!=='undefined')GlassWheel.setMode('classic');
  });
  await page.waitForFunction(()=>innerWidth>=1024&&matchMedia('(hover:hover) and (pointer:fine)').matches);
  const ids=await page.evaluate(async()=>{
    const plan=Schaltplan.neuerPlan();plan.breite=800;plan.hoehe=500;
    Schaltplan.beispielBauen(plan,'wechselschaltung','plan');
    const electrical=Store.addPage(null,{text:'Studio Vorschau – Elektro'});
    Store.addBlock(electrical.id,'schaltplan',{text:'Wechselschaltung',plan});
    const board=Store.addPage(null,{text:'Studio Vorschau – Whiteboard'});
    Store.addBlock(board.id,'whiteboard',{text:'Entwurf',hoehe:360,shapes:[
      {id:'r1',art:'rechteck',x:60,y:60,w:180,h:90,farbe:'#529cca'},
      {id:'r2',art:'ellipse',x:300,y:70,w:120,h:100,farbe:'#d78c4a'}
    ]});
    const pdf=Store.addPage(null,{text:'Studio Vorschau – PDF'});
    for(let nr=1;nr<=3;nr++)Store.addBlock(pdf.id,'pdfseite',{text:'',suchtext:'Ohm',nr,vonSeiten:3,bw:595,bh:842,quelleId:'preview'});
    Store.updateBlock(pdf.id,{dokumentModus:true});
    await Store.flush();App.zeichneBaum();
    return {electrical:electrical.id,board:board.id,pdf:pdf.id};
  });
  const open=async(id:string,selector:string)=>{
    await page.evaluate(id=>App.oeffne(id),id);
    await page.waitForSelector(selector);
    await page.evaluate(()=>document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el=>el.remove()));
  };
  await open(ids.electrical,'.sp-wrap svg.sp-flaeche');
  const inspector=page.locator('.sp-desktop-inspector');
  await inspector.waitFor({state:'visible'});await inspector.click();
  await page.locator('.sp-studio:not([hidden])').waitFor({state:'visible'});
  await page.screenshot({path:path.join(out,'01-elektro.png')});
  console.log('PASS: native Elektro-Inspektor sichtbar.');
  // There is also a dock action with data-a="simulation". Exercise the
  // dedicated, visible main power button, not an ambiguous selector.
  await page.locator('.sp-wrap .sp-kopf .sp-start[data-a="simulation"]').click();
  await page.locator('.sp-desktop-messwerte summary').waitFor({state:'visible'});
  await page.locator('.sp-desktop-messwerte summary').click();
  await page.locator('.sp-desktop-messwerte-inhalt table').waitFor({state:'visible'});
  await page.screenshot({path:path.join(out,'02-simulator.png')});
  console.log('PASS: native Messwerttabelle sichtbar.');
  await open(ids.board,'.wb-flaeche');
  const commands=page.locator('.wb-desktop-command');
  await commands.waitFor({state:'visible'});
  assert.match(await commands.locator('.wb-desktop-status').innerText(),/2 Objekte/);
  await page.screenshot({path:path.join(out,'03-whiteboard.png')});
  await commands.locator('[data-wb-desktop="layers"]').click();
  await page.locator('.gfx-inspector').waitFor({state:'visible'});
  await page.screenshot({path:path.join(out,'04-whiteboard-ebenen.png')});
  console.log('PASS: native Whiteboard-Kommandos und Ebenen sichtbar.');
  await page.locator('.gfx-inspector [aria-label="Objektübersicht schliessen"]').click();
  await open(ids.pdf,'.document-workspace');
  await page.locator('.document-topbar [data-document-action="thumbnails"]').click();
  const search=page.locator('.document-desktop-filter input');
  await search.waitFor({state:'visible'});
  await search.fill('2');
  assert.equal(await page.locator('.document-thumb-zeile:not([hidden])').count(),1);
  await search.press('Enter');
  await page.locator('.document-topbar [data-document-action="inspector"]').click();
  await page.locator('.document-desktop-objects').waitFor({state:'visible'});
  await page.screenshot({path:path.join(out,'05-pdf.png')});
  console.log('PASS: native PDF-Seitenfilter und Objektzugriff sichtbar.');
  assert.deepEqual(errors,[]);
  assert.equal(previewFingerprint(root),fingerprint,'Der getestete Renderer wurde während der Prüfung verändert.');
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({ok:true,fingerprint,platform:process.platform,electron:true,errors,viewport:await page.evaluate(()=>({width:innerWidth,height:innerHeight}))},null,2));
  console.log('RED Studio: sichtbare Windows-Bedienelemente in Elektro, Simulator, Whiteboard und PDF geprüft.');
}catch(error){
  await page.screenshot({path:path.join(out,'fehler.png')}).catch(()=>{});
  console.error(errors);
  throw error;
}finally{await app.close();}
