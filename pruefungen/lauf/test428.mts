/* Workspace auflösen, Inhalte behalten. Isolierte Browserablage mit Testdaten.
 * Prüft echte Navigation, alte Links, Wiederherstellung, Sammlungen am Handy
 * und dass die bisherigen Fenster- und Erstellwerkzeuge erreichbar bleiben.
 * node pruefungen/lauf/test428.mts [--screenshots]
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '../..');
const types: Record<string, string> = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.json':'application/json' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent((req.url || '/index.html').split('?')[0]!));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' });
  res.end(fs.readFileSync(file));
});
await new Promise<void>(resolve => server.listen(9628, '127.0.0.1', resolve));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{width:1366,height:900}, serviceWorkers:'block' });
page.setDefaultTimeout(12000);
const errors: string[] = [];
page.on('pageerror', e => errors.push(e.message));
let passed = 0;
const check = (name: string, value: unknown) => { assert.ok(value, name); passed++; console.log('  ✓ ' + name); };
const ready = async () => {
  await page.waitForFunction("typeof Arbeitswelt !== 'undefined' && Store.cache.blocks && document.body.dataset.studioNav");
  await page.waitForTimeout(700);
};
const noWorkspace = async () => {
  check('Keine zusätzliche Workspace-Schale oder Navigation', await page.locator('#btn-workspace,.aw-navigation,.aw-titelgruppe').count() === 0);
  /* NUR DIE SCHALE, NICHT DER INHALT. `innerText` der ganzen Ansicht traf
     einen Nutzerblock aus dem Notion-Wissen („in jedem Notion-Workspace")
     — je nach Reihenfolge der 80 gezeigten Einträge mal ja, mal nein.
     Gemessen wird, was Redion SELBST beschriftet: Überschriften,
     Navigation, Krume. */
  check('Keine Workspace-Beschriftung in der Schale', !/Workspace/.test(await page.evaluate(
    "[...document.querySelectorAll('#crumb, .arbeitswelt :is(h1,h2,h3,nav,summary,.aw-eyebrow,.aw-bereich-text,.aw-untertitel)')].map(e => e.textContent).join(' | ')")));
};
try {
  await page.goto('http://127.0.0.1:9628/index.html'); await ready();
  const fixture = await page.evaluate<{page:string;todo:string;board:string;database:string}>(`(() => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', Math.max(...Rundgang.NEUERUNGEN.map(n=>n.nr)));
    document.querySelectorAll('.overlay,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e=>e.remove());
    const p = Store.addPage(null, {text:'Navigation – Bestand', favorite:true});
    const todo = Store.addBlock(p.id, 'todo', {text:'Messbericht abgeben', checked:false});
    const board = Store.addBlock(p.id, 'whiteboard', {text:'Prinzipskizze', shapes:[]});
    const database = Store.addDatabase(p.id, 'Messwerte');
    Bibliothek.oeffne();
    /* addDatabase gibt { block, collectionId } zurueck, keine Kennung
       (test33 liest es genau so). database.id war undefined, und die
       letzte Zusicherung unten waere auch bei heilen Daten rot geworden.
       (Kein Backtick hier drin: der Block ist eine Vorlagenzeichenkette.) */
    return {page:p.id, todo:todo.id, board:board.id, database:database.collectionId ?? database.id};
  })()`);
  await page.evaluate('Store.flush()');
  const before = await page.evaluate('Object.keys(Store.cache.blocks).length');
  check('Bibliothek öffnet direkt das Dokumentregal', new URL(page.url()).hash === '#dokumente');
  check('Workspace ist nicht mehr im Navigationsregister', await page.evaluate("!Register.navigation.eines('workspace')"));
  const collectionIds = ['uebersicht','bibliothek','datenbanken','whiteboards','wiki','vorlagen'];
  /* SEIT E725 stehen die Sammlungen als eigene Gruppe im Ortsmenü (ein
     Wähler je Kategorie) — dort ist ihr sichtbarer Zugang. */
  await page.locator('.bib [data-orte]').click();
  check('Alle sechs Bibliothek-Sammlungen haben einen sichtbaren Zugang', JSON.stringify(await page.locator('.menu [data-wahl^="sammlung:"]').evaluateAll(es => es.map(e => String(e.getAttribute('data-wahl')).slice(9)))) === JSON.stringify(collectionIds));
  await page.keyboard.press('Escape');
  const routes: Record<string,string> = { uebersicht:'seiten-wissen', bibliothek:'dateien-pdfs', datenbanken:'datenbanken', whiteboards:'whiteboards', wiki:'wissen-verweise', vorlagen:'vorlagen', aufgaben:'aufgaben', kalender:'kalender' };
  for (const [view, route] of Object.entries(routes)) {
    await page.evaluate(`Produktwelten.routeOeffnen(Produktwelten.routeAusHash('#welt-workspace-${view}'))`);
    await page.waitForURL('**#' + route);
    await noWorkspace();
    check(view + ': richtiger Bereich markiert', await page.evaluate('App.schauplatz()') === (view === 'aufgaben' ? 'aufgaben' : view === 'kalender' ? 'kalender' : 'bibliothek'));
    await page.evaluate("Store.setMeta('startAnsicht','dokumente'); Store.flush()");
    await page.reload(); await ready();
    check(view + ': Deep Link überlebt Neuladen auch bei anderer Startwahl', new URL(page.url()).hash === '#' + route);
    check(view + ': tatsächlicher Inhalt wiederhergestellt', await page.locator('.arbeitswelt .aw-inhalt').count() === 1);
  }
  await page.evaluate("Bibliothek.oeffne(); location.hash='#welt-workspace-whiteboards'");
  await page.waitForURL('**#whiteboards');
  check('Alter Link funktioniert auch während der laufenden Sitzung', await page.locator('.aw-board').count() >= 1);
  await page.evaluate("Arbeitswelt.oeffnen('aufgaben')");
  check('Bestehende Todo-Aufgabe ist erreichbar', (await page.locator('.aw-inhalt').innerText()).includes('Messbericht abgeben'));
  await page.evaluate("Arbeitswelt.oeffnen('datenbanken')");
  await page.evaluate("Arbeitswelt.oeffnen('whiteboards')");
  await page.goBack();
  /* `#aw-datenbanken-kopf` ist eine KENNUNG, keine Klasse: `bereich()` in
     arbeitswelt.ts schreibt den Namen in `id`, die Klasse heisst
     `aw-bereich`. Mit `.aw-datenbanken-kopf` wartete der Lauf zwölf
     Sekunden auf etwas, das nie da sein konnte — der Zurück-Weg selbst
     funktionierte die ganze Zeit (nachgemessen am 6. September). */
  await page.waitForFunction("location.hash === '#datenbanken' && document.querySelector('#aw-datenbanken-kopf')");
  check('Browser-Zurück wechselt auch den tatsächlichen Inhalt', (await page.locator('.aw-inhalt').innerText()).includes('Messwerte'));
  await page.evaluate(`App.oeffne(${JSON.stringify(fixture.page)}); Arbeitswelt.oeffnen('uebersicht')`);
  await page.locator('.aw-fenster summary').click();
  check('Offene Seiten und Split-Steuerung bleiben zugänglich', await page.locator('.aw-fenster [data-aw-split]').count() > 0);
  await page.locator('[data-aw-action="show-templates"]').click();
  await page.waitForURL('**#vorlagen');
  check('Interner Wechsel aktualisiert auch die Adresse', await page.locator('.aw-vorlagen').count() === 1);
  check('Navigation hat keine Inhaltsobjekte angelegt oder entfernt', before === await page.evaluate('Object.keys(Store.cache.blocks).length'));
  check('Objektkennungen und Inhalte bleiben unverändert', await page.evaluate(`(() => {
    const f=${JSON.stringify(fixture)};
    return Store.getBlock(f.page)?.text==='Navigation – Bestand' && Store.getBlock(f.todo)?.text==='Messbericht abgeben'
      && Store.getBlock(f.board)?.type==='whiteboard' && !!Store.getCollection(f.database);
  })()`));
  for (const theme of ['hell','standard']) {
    await page.evaluate(`Aussehen.setzen({schema:'${theme}'})`);
    for (const [width,height] of [[1366,768],[820,1180],[390,844]]) {
      await page.setViewportSize({width:width!,height:height!});
      await page.evaluate('Bibliothek.oeffne()');
      await page.locator('.bib [data-orte]').click();
      await page.locator('.menu [data-wahl="sammlung:whiteboards"]').click();
      await page.waitForURL('**#whiteboards');
      check(`${theme} ${width}: Sammlung über echte Bibliothek-Auswahl erreichbar`, await page.locator('.aw-board').count() >= 1);
      check(`${theme} ${width}: kein horizontaler Seitenüberlauf`, await page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'));
      if (process.argv.includes('--screenshots')) {
        const out = path.join(root, 'doku/studio-abnahme'); fs.mkdirSync(out,{recursive:true});
        await page.screenshot({path:path.join(out,`sammlung-${theme}-${width}.png`)});
      }
    }
  }
  /* Mit der Tastatur: der Ort-Wähler, Enter, bis „Seiten & Wissen", Enter.
     Am Rechner ist es ein Menü (Pfeiltasten), am Telefon ein Blatt (Tab) —
     bis E725 lief diese Probe nach der Schleife oben zufällig bei 390 px
     über das `<select>`; jetzt steht beides ausdrücklich da. */
  for (const [width,height,taste] of [[1366,900,'ArrowDown'],[390,844,'Tab']] as const) {
    await page.setViewportSize({width,height});
    await page.evaluate('Bibliothek.oeffne()');
    await page.locator('.bib [data-orte]').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    for (let n = 0; n < 25 && await page.evaluate(`document.activeElement?.getAttribute('data-wahl')`) !== 'sammlung:uebersicht'; n++)
      await page.keyboard.press(taste);
    await page.keyboard.press('Enter');
    await page.waitForURL('**#seiten-wissen');
    check(`${width}: Sammlungen sind mit Tastatur bedienbar (${taste})`, await page.locator('.aw-fenster summary').count() === 1);
  }
  check('Keine Laufzeitfehler', errors.length === 0);
  console.log(`\n${passed}/${passed} bestanden`);
} finally { await browser.close(); await new Promise<void>(resolve => server.close(() => resolve())); }
