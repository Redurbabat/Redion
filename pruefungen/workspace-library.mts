/* Workspace 2.0: echte App, frische Browserkontexte, ausschliesslich Prüfdaten.
 * --capture=vorher / --capture=nachher: dieselben acht Bildschirmfotos.
 * Ohne Argument: die neuen Bedienverträge gegen die laufende Bibliothek.
 */
import { chromium, type Page } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const capture = process.argv.find(a => a.startsWith('--capture='))?.split('=')[1];
if (capture && !['vorher', 'nachher'].includes(capture)) throw new Error('Unbekannter Bildlauf');
const output = path.join(root, 'bilder', 'workspace-2', capture || 'pruefung');
fs.mkdirSync(output, { recursive: true });
const sizes = [[390, 844], [430, 932], [1366, 768], [1440, 900]] as const;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist', '--enable-gpu-compositing'] });

async function seed(page: Page, dark: boolean) {
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction("typeof App !== 'undefined' && typeof Bibliothek !== 'undefined' && !!document.body.dataset.studioNav");
  await page.waitForTimeout(900);
  return await page.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', Math.max(...Rundgang.NEUERUNGEN.map(n => n.nr)));
    Store.setMeta('bibForm', 'deckel'); Store.setMeta('bibBaumSichtbar', false);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e => e.remove());
    App.theme(${dark ? "'dark'" : "'light'"});
    const folder = Store.addPage(null, {text:'Arbeitsunterlagen', heftArt:'fach', color:'blue'});
    const notes = Store.addPage(folder.id, {text:'Ideen für die nächste Woche', icon:'✍️'});
    Store.addBlock(notes.id, 'heading', {text:'Raum für gute Gedanken'});
    Store.addBlock(notes.id, 'text', {text:'Den nächsten Schritt klein halten. Entwürfe sammeln, Zusammenhänge erkennen und gemeinsam weiterdenken.'});
    const study = Store.addPage(folder.id, {text:'Elektrotechnik – Grundlagen & Übungen', icon:'⚡', favorite:true});
    Store.addBlock(study.id, 'text', {text:'Leitungsschutz und sichere Schaltungen. Zusammenfassung für die nächste Übung.'});
    const pdf = Store.addPage(folder.id, {text:'Projektunterlagen.pdf'});
    Store.addBlock(pdf.id, 'pdfseite', {nr:1,bw:595,bh:842,suchtext:'Leitungsschutz im Projekt',raumVersion:1,
      marken:[{id:'probe',art:'stift',farbe:'#4b66b6',breite:2,pts:[[60,80],[180,100],[260,60]]}]});
    const sub = Store.addPage(folder.id, {text:'Projekt Nord',heftArt:'fach',color:'green'});
    Store.addPage(sub.id,{text:'Besprechung'}); Store.addPage(sub.id,{text:'Materialliste'});
    const long = Store.addPage(folder.id,{text:'Planungsunterlagen_mit_einem_sehr_langen_Dateinamen_und_ohne_Leerzeichen_2026'});
    Store.addBlock(long.id,'text',{text:'Ein Titel darf die Oberfläche nicht verbreitern.'});
    const blank = Store.addPage(folder.id,{text:'Neues Kapitel'});
    const edited = '2026-10-22T08:00:00.000Z';
    [notes, study, pdf, sub, long, blank].forEach(p => Store.updateBlock(p.id,{edited}));
    await Store.flush(); App.zeichneBaum(); Bibliothek.oeffne(folder.id);
    return {folder:folder.id,notes:notes.id,pdf:pdf.id,sub:sub.id,long:long.id,blank:blank.id};
  })()`) as {folder:string;notes:string;pdf:string;sub:string;long:string;blank:string};
}

try {
  for (const [width,height] of sizes) for (const dark of [false,true]) {
    const context = await browser.newContext({viewport:{width,height},deviceScaleFactor:1,
      hasTouch:width<761,isMobile:width<761,colorScheme:dark?'dark':'light'});
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
    const ids=await seed(page,dark);
    await page.waitForSelector('.bib-gitter .bib-deckel'); await page.waitForTimeout(500);
    if (capture) {
      await page.screenshot({path:path.join(output,`${width}-${dark?'dunkel':'hell'}.png`)});
    } else {
      assert.equal(await page.locator('.bib-gitter .bib-deckel').count(),6,'Nur echte direkte Kinder');
      assert.equal(await page.locator('.bib-workspace-intro').count(),1,'Ein gemeinsamer neuer Kopf');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      assert.equal(overflow,false,`${width}: kein horizontaler Überlauf`);
      for (const selector of ['[data-bib-search]','[data-neu-auf]','[data-form-wahl]',`[data-bib-favorite="${ids.notes}"]`]) {
        const r=await page.locator('.bib '+selector).first().boundingBox();
        assert.ok(r && r.width>=44 && r.height>=44,selector+' mindestens 44 × 44');
      }
      const favorite=page.locator(`[data-bib-favorite="${ids.notes}"]`);
      // Gegenprobe: nur im isolierten Testbrowser die Zustandsbindung lösen.
      if (process.argv.includes('--counterprobe')) await favorite.evaluate(el=>el.replaceWith(el.cloneNode(true)));
      await favorite.focus(); await page.keyboard.press('Space');
      await page.waitForFunction(id=>document.querySelector(`[data-bib-favorite="${id}"]`)?.getAttribute('aria-pressed')==='true',ids.notes);
      assert.equal(await page.evaluate(id=>document.activeElement?.getAttribute('data-bib-favorite')===id,ids.notes),true,'Fokus bleibt beim Favoriten');
      await page.locator('.bib [data-bib-search]').click();
      await page.waitForSelector('.finder.such'); await page.keyboard.press('Escape');
      await page.locator(`[data-mehr-id="${ids.notes}"]`).click();
      await page.waitForSelector('.menu,.r-sheet,.overlay'); await page.keyboard.press('Escape');
      await page.locator(`[data-id="${ids.sub}"].bib-deckel`).click();
      await page.waitForFunction(()=>document.querySelector('.bib-dkopf h1')?.textContent==='Projekt Nord');
      assert.equal(await page.locator('.bib-gitter .bib-deckel').count(),2,'Ordner öffnet seine Kinder');
      await page.locator('[data-hoch]').click();
      await page.locator('[data-form-wahl]').click();
      await page.locator('[data-wahl="liste"]').click();
      await page.waitForSelector('.bib-tab');
      assert.equal(await page.locator('.bib-zeile[data-id]').count(),6,'Alle Dokumente auch in der Tabelle');
      await page.evaluate(`Store.setMeta('bibForm','deckel'); Bibliothek.oeffne('${ids.folder}')`);
      await page.locator(`.bib-deckel[data-id="${ids.notes}"]`).focus(); await page.keyboard.press('Enter');
      await page.waitForSelector('#title');
      assert.ok((await page.locator('#title').textContent())?.includes('Ideen'),'Dokument öffnet über Tastatur');
      await page.evaluate(`Bibliothek.oeffne('${ids.blank}')`);
      await page.waitForSelector('.bib-empty-title');
      assert.equal(await page.locator('.bib-leer [data-neu-auf]').count(),1,'Leerer Ordner hat eine echte Aktion');
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.evaluate(`Bibliothek.oeffne('${ids.folder}')`);
      assert.equal(await page.locator('.bib-gitter').evaluate(el=>getComputedStyle(el).animationName),'none','Keine Ankunft bei weniger Bewegung');
      await page.evaluate(`document.body.dataset.bewegung='ruhig'`);
      assert.equal(await page.locator('.bib-gitter').evaluate(el=>getComputedStyle(el).animationName),'none','Redions Ruhe-Schalter');
      assert.deepEqual(errors,[],'Keine Browserfehler');
    }
    console.log(`✓ ${width} × ${height} ${dark?'dunkel':'hell'} ${capture||'Bedienung'}`);
    await context.close();
  }
} finally { await browser.close(); }
