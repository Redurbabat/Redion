/* Calm Studio shell: isolated browser storage, real controllers and existing content. */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '../..');
const types: Record<string,string> = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent((req.url || '/index.html').split('?')[0]!));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404).end();return;}
  res.writeHead(200, {'Content-Type':(types[path.extname(file)] || 'application/octet-stream')+'; charset=utf-8'});
  res.end(fs.readFileSync(file));
});
await new Promise<void>(r=>server.listen(9630,'127.0.0.1',r));
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'});
page.setDefaultTimeout(12000);
let passed=0;
const check=(name:string,ok:unknown)=>{assert.ok(ok,name);passed++;console.log('  ✓ '+name);};
const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:9630/index.html');
  await page.waitForFunction("typeof StudioSchale !== 'undefined' && document.body.dataset.studioNav");
  await page.waitForTimeout(900);
  const ids=await page.evaluate<string[]>(`(() => {
    Store.setMeta('rundgangGesehen',true);
    Store.setMeta('neuerungenGesehen',Math.max(...Rundgang.NEUERUNGEN.map(n=>n.nr)));
    document.querySelectorAll('.overlay,#rg-willkommen,#rg-neu,#rg-einladung').forEach(e=>e.remove());
    const folder=Store.addPage(null,{text:'Elektrotechnik'});
    const p=Store.addPage(folder.id,{text:'Mein Lernjournal',favorite:true});
    Store.addBlock(p.id,'text',{text:'Messwerte, Ideen und eigene Notizen.'});
    const q=Store.addPage(null,{text:'Projekt Lichtplanung'});
    Store.addBlock(q.id,'text',{text:'Ausarbeitung und Skizzen.'});
    Store.setMeta('bibForm','deckel'); Ruhig.setzen(true); Bibliothek.oeffne();
    return [folder.id,p.id,q.id];
  })()`);
  await page.waitForTimeout(250);
  const count=await page.evaluate('Object.keys(Store.cache.blocks).length');
  check('Drei Hauptwege plus Mehr', await page.locator('#kante .k-orte button').count()===4);
  check('Notizhefte ist ein Hauptweg', await page.locator('#kante [data-k="app-notizhefte"]').count()===1);
  check('Nur Seiten und Werkzeuge als Kontextgriffe', await page.locator('#kante .k-oben button').count()===2);
  check('Menüband wartet auf bewussten Werkzeugaufruf', !await page.locator('#menueband').isVisible());
  await page.locator('#studio-tools').click();
  check('Werkzeugknopf öffnet echtes Menüband',await page.locator('#menueband').isVisible());
  await page.keyboard.press('Escape');
  check('Escape schließt und stellt Fokus wieder her',await page.locator('#studio-tools').evaluate(e=>e===document.activeElement) && !await page.locator('#menueband').isVisible());
  await page.locator('#kante [data-k="mehr-orte"]').click();
  check('Weitere Bereiche bleiben erreichbar', /Aufgaben/.test(await page.locator('#kanten-lade').innerText()));
  await page.keyboard.press('Escape');
  await page.locator('#kante [data-k="mehr-werkzeuge"]').click();
  check('KI bleibt hinter Werkzeuge erreichbar',/Lokale KI/.test(await page.locator('#kanten-lade').innerText()));
  await page.keyboard.press('Escape');
  check('Ordnerbaum startet kompakt',!await page.locator('.bib-ablage-baum').evaluate(e=>(e as HTMLDetailsElement).open));
  await page.locator('.bib-ablage-baum summary').focus();await page.keyboard.press('Enter');
  check('Ordnerbaum per Tastatur verfügbar',await page.locator('[data-bib-baum]').isVisible());
  await page.waitForTimeout(100);
  await page.evaluate('Bibliothek.oeffne()');
  check('Ordnerzustand bleibt beim Zeichnen erhalten',await page.locator('.bib-ablage-baum').evaluate(e=>(e as HTMLDetailsElement).open));
  await page.locator('.bib-ablage-baum summary').click();
  check('Sicherungswarnung bleibt sichtbar',/Noch keine vollständige Sicherung/.test(await page.locator('.bib-pflege-details summary').innerText()));
  await page.locator('.bib-pflege-details summary').click();
  check('Sicherung und Papierkorb sind bedienbar',await page.locator('[data-a="sichern"]').isVisible() && await page.locator('[data-a="papierkorb"]').isVisible());
  await page.locator('.bib-pflege-details summary').click();
  for (const form of ['deckel','regal','liste']) {
    await page.evaluate(`Store.setMeta('bibForm','${form}'); Bibliothek.oeffne()`);
    check(form+': gleicher Dokumentkopf und echter Import',await page.locator('.bib-dkopf').count()===1 && await page.locator('.bib-studio-import').isVisible());
    await page.locator('[data-studio-wege]').click();
    await page.locator('.menu [data-studio-weg="pdf"]').click();
    check(form+': PDF-Filter zeigt keine normalen Seiten',await page.locator('.bib-deckel[data-id],.bib-heft[data-id],.bib-zeile[data-id]').count()===0);
    await page.locator('[data-studio-wege]').click();
    await page.locator('.menu [data-studio-weg="ablage"]').click();
    await page.locator('.bib-studio-optionen summary').click();
    check(form+': alle Sammlungen zugänglich',await page.locator('.bib-studio-sammlungen').isVisible());
  }
  await page.locator('[data-form="deckel"]').click();
  check('Rückweg von Liste zu Dokumentdeckeln',await page.locator('.bib-gitter').count()===1);
  for (const theme of ['hell','standard']) {
    await page.evaluate(`Aussehen.setzen({schema:'${theme}'})`);
    for (const [width,height] of [[1366,768],[820,1180],[390,844]]) {
      await page.setViewportSize({width:width!,height:height!});
      await page.waitForTimeout(250);
      check(`${theme} ${width}: kein horizontaler Überlauf`,await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
      check(`${theme} ${width}: Import sichtbar`,await page.locator('.bib-studio-import').isVisible());
      if (process.argv.includes('--screenshots')) {
        const out=path.join(root,'doku/studio-abnahme');fs.mkdirSync(out,{recursive:true});
        await page.screenshot({path:path.join(out,`ruhig-${theme}-${width}.png`)});
      }
    }
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.bib-ablage-baum summary').click();
  check('Reduced Motion: Baum ohne Einblendanimation',await page.locator('[data-bib-baum]').evaluate(e=>getComputedStyle(e).animationName)==='none');
  check('Kein Inhaltsobjekt verloren oder dupliziert',count===await page.evaluate('Object.keys(Store.cache.blocks).length'));
  check('Bestehende Objektkennungen erhalten',await page.evaluate(`(${JSON.stringify(ids)}).every(id=>!!Store.getBlock(id))`));
  check('Keine Laufzeitfehler',errors.length===0);
  console.log(`\n${passed}/${passed} bestanden`);
} finally {await browser.close();await new Promise<void>(r=>server.close(()=>r()));}
