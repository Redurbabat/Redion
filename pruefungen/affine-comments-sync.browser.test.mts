/* Objektkommentare auf dem echten Store und dem vorhandenen Dreiwege-Abgleich. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const repo = path.resolve(import.meta.dirname, '..'), root = process.env.REDION_DOCK_ROOT || repo;
const folder = path.join(repo, 'bilder', 'affine-elektro'); fs.mkdirSync(folder, { recursive: true });
const browser = await chromium.launch(); let checked = 0;
const check = (name: string, value: unknown) => { assert.ok(value, name); checked++; console.log('✓ ' + name); };
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' }), page = await context.newPage();
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
  const merge = await page.evaluate(() => {
    const base = { id: 'page', shapes: [{ id:'a', art:'rechteck', x:1, y:2, w:100, h:80, objectComments:[{id:'c',text:'Prüfen',replies:[]}] }] };
    const clone = (x: any) => JSON.parse(JSON.stringify(x));
    const local = clone(base), remote = clone(base); local.shapes[0].objectComments[0].replies.push({id:'r1',text:'Antwort Gerät A'});
    remote.shapes[0].objectComments[0].replies.push({id:'r2',text:'Antwort Gerät B'}); remote.shapes[0].x=30;
    const result = Zusammen.dreiWege(base,local,remote);
    const removed = clone(base); removed.shapes=[];
    const conflict = Zusammen.dreiWege(base,removed,remote);
    const geometryA = clone(base), geometryB = clone(base); geometryA.shapes[0].x=10; geometryB.shapes[0].x=20;
    const geometry = Zusammen.dreiWege(base,geometryA,geometryB);
    const chosen = JSON.parse(JSON.stringify(geometry.satz));
    Zusammen.setzeTief(chosen, geometry.konflikte[0].pfad, geometry.konflikte[0].dort);
    const deleted = JSON.parse(JSON.stringify(conflict.satz));
    Zusammen.setzeTief(deleted, conflict.konflikte[0].pfad, undefined);
    const b = { id:'p',marken:[{id:'m',art:'rectangle',pts:[[0,0],[10,10]],objectComments:[]}] }, h=clone(b),d=clone(b);
    h.marken[0].objectComments.push({id:'c1',text:'A'}); d.marken[0].objectComments.push({id:'c2',text:'B'});
    const ink = Zusammen.dreiWege(b,h,d);
    return { replies:result.satz.shapes[0].objectComments[0].replies.map((r:any)=>r.id).sort(), x:result.satz.shapes[0].x,
      conflicts:result.konflikte.length, deletedKept:conflict.satz.shapes.length===1&&conflict.konflikte.length>0,
      geometryKept:geometry.satz.shapes[0].x===10&&geometry.konflikte.length>0, ink:ink.satz.marken[0].objectComments.length,
      baseUnchanged:base.shapes[0]!.objectComments[0]!.replies.length===0,
      chosen: Array.isArray(chosen.shapes)&&chosen.shapes[0]?.x===20, deleted: Array.isArray(deleted.shapes)&&deleted.shapes.length===0 };
  });
  check('Antworten beider Geräte bleiben erhalten', merge.replies.join() === 'r1,r2' && !merge.conflicts);
  check('Unabhängige Objektänderung geht mit Kommentaren zusammen', merge.x === 30);
  check('Löschen gegen Bearbeiten bewahrt Inhalt und meldet Konflikt', merge.deletedKept);
  check('Konkurrierende Geometrie wird nicht still überschrieben', merge.geometryKept);
  check('PDF-Kommentare verwenden denselben Abgleich', merge.ink === 2);
  check('Gemeinsame Basis bleibt unverändert', merge.baseUnchanged);
  check('Konfliktentscheidung erreicht das Objekt anhand seiner Kennung',merge.chosen);
  check('Explizite Löschentscheidung entfernt nur das gewählte Objekt',merge.deleted);
  const ids = await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen',true);Store.setMeta('neuerungenGesehen',1e9);Store.setMeta('nutzer','Prüfperson');
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e=>e.remove());App.theme('dark');
    const target=Store.addPage(null,{text:'Abnahme'}),p=Store.addPage(null,{text:'Objektkommentare',seitenAnsicht:'flaeche',flaecheNotiz:{x:-900,y:-400,w:280,raumVersion:1},shapes:[{id:'a',art:'rechteck',text:'Entwurf',x:50,y:100,w:180,h:100,farbe:'#529cca'}]});
    await Store.flush();App.zeichneBaum();App.oeffne(p.id);return {page:p.id,target:target.id};
  });
  await page.locator('.pg-fl-tools [data-a="objekte"]').click();const panel=page.locator('.gfx-inspector');
  await panel.getByRole('button',{name:'Entwurf',exact:true}).click();await panel.getByRole('button',{name:'Kommentare',exact:true}).click();
  await panel.getByRole('textbox',{name:'Neuer Objektkommentar'}).fill('Bitte abstimmen');
  const option=await panel.getByLabel('Erwähnung hinzufügen').locator('option').filter({hasText:'Abnahme'}).getAttribute('value');
  await panel.getByLabel('Erwähnung hinzufügen').selectOption(option!);await panel.getByRole('button',{name:'Kommentar hinzufügen',exact:true}).click();
  await panel.getByRole('button',{name:'Antworten',exact:true}).click();await panel.getByRole('textbox',{name:'Antwort auf Kommentar',exact:true}).fill('Ist geprüft und freigegeben.');
  await panel.getByRole('button',{name:'Antwort speichern',exact:true}).click();
  const thread=await page.evaluate(id=>Store.getBlock(id).shapes[0].objectComments[0],ids.page);
  check('Kommentar speichert tatsächlichen Autor',thread.author.name==='Prüfperson');
  check('Erwähnung enthält die echte Seitenkennung',thread.mentions[0].id===ids.target&&thread.mentions[0].kind==='page');
  check('Antwort ist ein eigener Eintrag im vorhandenen Objekt',thread.replies.length===1&&thread.replies[0].author.name==='Prüfperson');
  if(process.argv.includes('--capture'))await page.screenshot({path:path.join(folder,'antworten-erwaehnungen-390.png')});
  const roundtrip=await page.evaluate(async id=>{const before=JSON.stringify(Store.getBlock(id).shapes);await Store.importAll(Store.exportAll(),'ersetzen');return JSON.stringify(Store.getBlock(id).shapes)===before;},ids.page);
  check('Sicherung bewahrt Antworten, Autoren und Erwähnungen',roundtrip);
  check('Keine Browserfehler',!errors.length);console.log(`${checked} Zusagen erfüllt`);
} finally {await browser.close();}
