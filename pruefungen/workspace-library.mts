/* Workspace 2.0: echte App, frische Browserkontexte, ausschliesslich Prüfdaten.
 * --capture=vorher / --capture=nachher: dieselben acht Bildschirmfotos.
 * Ohne Argument: die neuen Bedienverträge gegen die laufende Bibliothek.
 */
import { chromium, webkit, type Page } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = path.resolve(import.meta.dirname, '..');
// Vergleichsbilder dürfen einen getrennten Basis-Checkout öffnen. Die Bilder
// landen weiterhin nur im ignorierten Arbeitsmaterial dieses Prüflaufs.
const root = path.resolve(process.env.REDION_WORKSPACE_ROOT || repo);
const engine = process.argv.includes('--webkit') ? 'webkit' : 'chromium';
const capture = process.argv.find(a => a.startsWith('--capture='))?.split('=')[1];
if (capture && !['vorher', 'nachher'].includes(capture)) throw new Error('Unbekannter Bildlauf');
const output = path.join(repo, 'bilder', 'workspace-2', engine, capture || 'pruefung');
fs.mkdirSync(output, { recursive: true });
const sizes = [[390, 844], [430, 932], [1366, 768], [1440, 900]] as const;
const selectedCase=process.argv.find(a=>a.startsWith('--case='))?.slice(7);
const cases=sizes.flatMap(([width,height])=>[false,true].map(dark=>({width,height,dark})))
  .filter(({width,dark})=>!selectedCase || selectedCase===`${width}-${dark?'dunkel':'hell'}`);
assert.ok(cases.length,'Unbekannter Bildschirmfall');
const browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader',
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

let activePage: Page | undefined;
try {
  for (const [caseIndex,{width,height,dark}] of cases.entries()) {
    const context = await browser.newContext({viewport:{width,height},deviceScaleFactor:1,
      hasTouch:width<761,isMobile:width<761,colorScheme:dark?'dark':'light'});
    const page = await context.newPage(); activePage=page; page.setDefaultTimeout(15000);
    const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
    const ids=await seed(page,dark);
    const screenshot = async (state: string) => {
      if (!process.argv.includes('--states')) return;
      await page.screenshot({path:path.join(output,`${width}-${dark?'dunkel':'hell'}-${state}.png`)});
    };
    await page.waitForSelector('.bib-gitter .bib-deckel'); await page.waitForTimeout(500);
    if (capture) {
      await page.screenshot({path:path.join(output,`${width}-${dark?'dunkel':'hell'}.png`)});
    } else {
      assert.equal(await page.locator('.bib-gitter .bib-deckel').count(),6,'Nur echte direkte Kinder');
      // Gegenprobe zur Ablageordnung: Ein Dokument ist neuer als die anderen.
      // Die Karten müssen trotzdem Ordner zuerst, danach Namen zeigen.
      // In der Tabellenansicht darf weiterhin eine Spaltensortierung gelten.
      await page.evaluate(id => {
        Store.updateBlock(id, { edited: '2026-11-06T08:00:00.000Z' });
        App.zeichneSeite();
      }, ids.long);
      const order = await page.locator('.bib-gitter .bib-deckel').evaluateAll(cards =>
        cards.map(card => ({
          id: (card as HTMLElement).dataset.id || '',
          name: card.querySelector('.bib-deckel-name b')?.textContent?.trim() || ''
        })));
      assert.equal(order[0]?.id, ids.sub, 'Ein Ordner bleibt vor den neueren Dokumenten');
      const names = order.slice(1).map(card => card.name);
      assert.deepEqual(names, names.slice().sort((a,b) =>
        a.localeCompare(b, 'de', { sensitivity: 'base', numeric: true })),
        'Dokumentkarten bleiben alphabetisch statt nach Bearbeitungsdatum sortiert');
      assert.equal(await page.locator('.bib-workspace-intro').count(),1,'Ein gemeinsamer neuer Kopf');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      assert.equal(overflow,false,`${width}: kein horizontaler Überlauf`);
      const contrast = await page.locator('.bib-gitter .bib-deckel').first().evaluate(card=>{
        const luminance=(color:string) => {
          const rgb=(color.match(/[\d.]+/g)||[]).slice(0,3).map(Number).map(v=>{
            const value=v/255; return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;
          });
          return .2126*(rgb[0]||0)+.7152*(rgb[1]||0)+.0722*(rgb[2]||0);
        };
        const background=luminance(getComputedStyle(card).backgroundColor);
        return ['.bib-card-kind','.bib-card-meta','.bib-deckel-name b'].map(selector=>{
          const element=card.querySelector(selector)!;
          const foreground=luminance(getComputedStyle(element).color);
          return {selector,ratio:(Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05),
            color:getComputedStyle(element).color,cardBackground:getComputedStyle(card).backgroundColor,
            textToken:getComputedStyle(document.documentElement).getPropertyValue('--text')};
        });
      });
      for (const item of contrast) assert.ok(item.ratio>=4.5,`${width}/${dark?'dark':'light'}: ${item.selector}: Textkontrast ${item.ratio.toFixed(2)}; color=${item.color}, Hintergrund=${item.cardBackground}, --text=${item.textToken}`);
      for (const selector of ['[data-bib-search]','[data-neu-auf]','[data-form-wahl]',`[data-bib-favorite="${ids.notes}"]`]) {
        const r=await page.locator('.bib '+selector).first().boundingBox();
        assert.ok(r && r.width>=44 && r.height>=44,selector+' mindestens 44 × 44');
      }
      const favorite=page.locator(`[data-bib-favorite="${ids.notes}"]`);
      // Gegenprobe: nur im isolierten Testbrowser die Zustandsbindung lösen.
      if (process.argv.includes('--counterprobe')) await favorite.evaluate(el=>el.replaceWith(el.cloneNode(true)));
      await favorite.focus(); await page.keyboard.press('Space');
      await page.waitForFunction(id=>document.querySelector(`[data-bib-favorite="${id}"]`)?.getAttribute('aria-pressed')==='true',ids.notes);
      // Der Fokus wird nach dem Neuzeichnen im nächsten Bild restauriert.
      // WebKit kann den Zustandswechsel schon VOR diesem Bild liefern.
      await page.waitForFunction(id=>document.activeElement?.getAttribute('data-bib-favorite')===id,ids.notes,{timeout:1000});
      assert.equal(await page.evaluate(id=>document.activeElement?.getAttribute('data-bib-favorite')===id,ids.notes),true,'Fokus bleibt beim Favoriten');
      await page.locator('[data-art-wahl]').click();
      await page.locator('[data-wahl="pdf"]').click();
      assert.equal(await page.locator('.bib-gitter .bib-deckel').count(),1,'Artfilter zeigt nur die echte PDF');
      assert.equal(await page.locator(`.bib-deckel[data-id="${ids.pdf}"]`).count(),1);
      await screenshot('pdf-filter');
      // Reale Zustandsänderung: die letzte passende PDF liegt nun im
      // Unterordner. Der offene Filter bleibt bestehen; kein Dokument löschen.
      await page.evaluate(`Store.updateBlock('${ids.pdf}',{parentId:'${ids.sub}'}); App.zeichneSeite()`);
      await page.waitForSelector('[data-bib-reset]');
      await screenshot('filter-leer');
      await page.locator('[data-bib-reset]').click();
      assert.equal(await page.locator('.bib-gitter .bib-deckel').count(),5,'Filter zurücksetzen zeigt alle verbliebenen direkten Kinder');
      await page.evaluate(`Store.updateBlock('${ids.pdf}',{parentId:'${ids.folder}'}); App.zeichneSeite()`);
      assert.equal(await page.locator('.bib-gitter .bib-deckel').count(),6,'Die verschobene PDF ist unverändert vorhanden');
      await page.locator('[data-orte]').click();
      await page.locator('[data-wahl="favoriten"]').click();
      assert.equal(await page.locator('.bib-gitter .bib-deckel').count(),2,'Favoriten sind echte gespeicherte Dokumente');
      assert.equal(await page.locator('.bib-krume').count(),0,'Globale Favoriten zeigen keinen veralteten Ordnerpfad');
      await screenshot('favoriten');
      if (width<761) await favorite.tap(); else await favorite.click();
      await page.waitForFunction(id=>!document.querySelector(`[data-bib-favorite="${id}"]`),ids.notes);
      await page.waitForFunction(()=>document.activeElement?.hasAttribute('data-orte'),null,{timeout:1000});
      assert.equal(await page.locator('.bib-gitter .bib-deckel').count(),1,'Entfernen eines Favoriten entfernt nur die Markierung');
      await page.locator('.bib-favorite').click();
      await page.waitForSelector('[data-bib-home]');
      assert.ok((await page.locator('.bib-empty-title').textContent())?.includes('Favoriten'));
      await screenshot('favoriten-leer');
      await page.locator('[data-bib-home]').click();
      await page.locator(`.bib-deckel[data-id="${ids.folder}"]`).click();
      await page.locator('.bib [data-bib-search]').click();
      await page.waitForSelector('.finder.such');
      await page.locator('#q').fill('Zusammenhänge');
      await page.waitForFunction(()=>Array.from(document.querySelectorAll('#res button[data-i]')).some(el=>el.textContent?.includes('Ideen für die nächste Woche')));
      assert.ok((await page.locator('.finder.such .such-bereich [aria-checked="true"]').textContent())?.includes('Arbeitsunterlagen'),'Suchknopf erhält den echten Ordnerbereich');
      const selection=await page.locator('#res > button.on').evaluate(button=>{
        const marker=button.parentElement?.querySelector('.ru-marke');
        const br=button.getBoundingClientRect(), mr=marker?.getBoundingClientRect();
        const background=getComputedStyle(button).backgroundColor;
        const numbers=(background.match(/[\d.]+/g)||[]).map(Number);
        const opaque=background!=='transparent' && (numbers.length===3 || (numbers[3]||0)>=.99);
        return {opaque,covered:!!mr && mr.top<=br.top+1 && mr.bottom>=br.bottom-1};
      });
      assert.ok(selection.opaque || selection.covered,'Auch während der Auswahlbewegung steht der ganze Suchtreffer auf lesbarem Grund');
      if(process.argv.includes('--diagnose')) {
        const geometry=()=>page.evaluate(()=>Array.from(document.querySelectorAll('#res,#res > button.on,#res > .ru-marke,#res .snip')).map(el=>({
          tag:el.tagName,classes:el.className,rect:el.getBoundingClientRect().toJSON(),
          height:getComputedStyle(el).height,color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor,
          transform:getComputedStyle(el).transform,animations:el.getAnimations().length
        })));
        console.log('Suche sofort:',JSON.stringify(await geometry()));
        await page.waitForTimeout(1000);
        console.log('Suche nach 1s:',JSON.stringify(await geometry()));
      }
      await screenshot('suche'); await page.keyboard.press('Escape');
      await page.locator(`[data-mehr-id="${ids.notes}"]`).click();
      await page.waitForSelector('.menu,.r-sheet,.overlay'); await screenshot('menue'); await page.keyboard.press('Escape');
      await page.locator(`[data-id="${ids.sub}"].bib-deckel`).click();
      await page.waitForFunction(()=>document.querySelector('.bib-dkopf h1')?.textContent==='Projekt Nord');
      assert.equal(await page.locator('.bib-gitter .bib-deckel').count(),2,'Ordner öffnet seine Kinder');
      await page.locator('[data-hoch]').click();
      await page.locator('[data-form-wahl]').click();
      await page.locator('[data-wahl="liste"]').click();
      await page.waitForSelector('.bib-tab');
      assert.equal(await page.locator('.bib-zeile[data-id]').count(),6,'Alle Dokumente auch in der Tabelle');
      await screenshot('liste');
      await page.evaluate(`Store.setMeta('bibForm','deckel'); Bibliothek.oeffne('${ids.folder}')`);
      await page.locator(`.bib-deckel[data-id="${ids.notes}"]`).focus(); await page.keyboard.press('Enter');
      await page.waitForSelector('#title');
      assert.ok((await page.locator('#title').textContent())?.includes('Ideen'),'Dokument öffnet über Tastatur');
      await page.evaluate(`Bibliothek.oeffne('${ids.blank}')`);
      await page.waitForSelector('.bib-empty-title');
      assert.equal(await page.locator('.bib-leer [data-neu-auf]').count(),1,'Leerer Ordner hat eine echte Aktion');
      await screenshot('ordner-leer');
      await page.locator('.bib-leer [data-neu-auf]').click();
      await page.waitForSelector('.menu,.r-sheet,.overlay');
      await page.keyboard.press('Escape');
      await page.evaluate('Store.flush()');
      await page.reload();
      await page.waitForFunction("typeof Store !== 'undefined' && !!Store.getBlock('"+ids.folder+"')");
      assert.equal(await page.evaluate(`!!Store.getBlock('${ids.notes}').favorite`),false,'Favoritenänderung bleibt nach Neuladen erhalten');
      assert.equal(await page.evaluate(`Store.childrenOf('${ids.folder}').filter(p=>p.alive!==false).length`),6,'Keine Seite beim Favoritenwechsel verloren');
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.evaluate(`Bibliothek.oeffne('${ids.folder}')`);
      assert.equal(await page.locator('.bib-gitter').evaluate(el=>getComputedStyle(el).animationName),'none','Keine Ankunft bei weniger Bewegung');
      await page.evaluate(`document.body.dataset.bewegung='ruhig'`);
      assert.equal(await page.locator('.bib-gitter').evaluate(el=>getComputedStyle(el).animationName),'none','Redions Ruhe-Schalter');
      assert.deepEqual(errors,[],'Keine Browserfehler');
    }
    console.log(`✓ ${width} × ${height} ${dark?'dunkel':'hell'} ${capture||'Bedienung'}`);
    // Der letzte Kontext wird gemeinsam mit dem Browser geschlossen.
    // Kein doppelter Teardown desselben WebKit-Prozesses auf Windows.
    if (caseIndex<cases.length-1) await context.close();
  }
} catch (error) {
  await activePage?.screenshot({path:path.join(output,'fehler.png')}).catch(()=>{});
  throw error;
} finally { await browser.close(); console.log(`✓ ${engine} geschlossen`); }
