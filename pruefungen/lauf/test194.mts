/* Suite 160 — Phase 13: mobile Blätter, Tastatur und zielgenaues Raster
 * ============================================================================
 * Dieser Lauf geht durch die echten Produktmodule. Er baut weder Fokuslogik
 * noch Geräteerkennung nach. Wichtigste Gegenprobe: zeigt `Fokus` wieder auf
 * `.menu-grund`, bleiben Rolle/Fokus/Inert hier nicht grün. Entfernt man den
 * visualViewport-Rand, endet das Blatt hinter der simulierten Tastatur.
 *
 *   node pruefungen/lauf/test194.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8950;
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(fertig => server.listen(PORT, fertig));

let ok = 0, offen = 0;
const pruefe = (name: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + name); }
  else { offen++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};
const gleich = (name: string, ist: unknown, soll: unknown): void =>
  pruefe(name, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];

const vorbereiten = async (breite: number, hoehe: number, touch = true) => {
  const kontext = await browser.newContext({ viewport: { width: breite, height: hoehe }, hasTouch: touch });
  const seite = await kontext.newPage();
  seite.on('pageerror', e => fehler.push(`${breite}×${hoehe}: ${e.message}`));
  await seite.addInitScript(() => {
    let sichtbar: number | null = null;
    const zuhoerer: Record<string, Array<() => void>> = {};
    const stummel = {
      get height() { return sichtbar ?? window.innerHeight; },
      get width() { return window.innerWidth; },
      get offsetTop() { return 0; }, get offsetLeft() { return 0; },
      get pageTop() { return 0; }, get scale() { return 1; },
      addEventListener(art: string, fn: () => void) { (zuhoerer[art] ??= []).push(fn); },
      removeEventListener() {}
    };
    (window as any).__sichtbar = (h: number | null) => {
      sichtbar = h;
      (zuhoerer.resize ?? []).forEach(fn => fn());
    };
    Object.defineProperty(window, 'visualViewport', { get: () => stummel, configurable: true });
  });
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForTimeout(2200);
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });
  return { kontext, seite };
};

console.log('\n1 · Drei Hochformatbreiten benutzen dasselbe echte Blatt');
for (const breite of [375, 390, 428]) {
  const { kontext, seite } = await vorbereiten(breite, 844);
  const wert = await seite.evaluate(async (b: number) => {
    const auf = document.createElement('button');
    auf.id = 'blatt-oeffner-' + b;
    auf.textContent = 'Öffnen';
    document.body.appendChild(auf);
    auf.focus();
    Menue.menu(
      '<button id="blatt-erste">Erste Aktion</button>' +
      '<button>Zweite Aktion mit Donaudampfschifffahrtsgesellschaftskapitän</button>',
      10, 10, { titel: 'Aktionen' });
    await new Promise(r => setTimeout(r, 120));
    const m = document.querySelector<HTMLElement>('.menu.blatt')!;
    const grund = document.querySelector<HTMLElement>('.menu-grund')!;
    const knopf = m.querySelector<HTMLElement>('button')!;
    const mr = m.getBoundingClientRect(), kr = knopf.getBoundingClientRect();
    return {
      rolle: m.getAttribute('role'), modal: m.getAttribute('aria-modal'),
      name: m.getAttribute('aria-label'), grundRolle: grund.getAttribute('role'),
      fokus: m.contains(document.activeElement),
      inert: auf.inert,
      breite: Math.round(mr.width), links: Math.round(mr.left), rechts: Math.round(mr.right),
      ziel: Math.min(kr.width, kr.height),
      seitlich: m.scrollWidth <= m.clientWidth
    };
  }, breite);
  pruefe(`${breite}px: Das Blatt, nicht der Grund, ist benannter Dialog`,
    wert.rolle === 'dialog' && wert.modal === 'true' && wert.name === 'Aktionen' && !wert.grundRolle,
    JSON.stringify(wert));
  pruefe(`${breite}px: Fokus ist im Blatt und Hintergrund inert`, wert.fokus && wert.inert,
    JSON.stringify(wert));
  pruefe(`${breite}px: volle Breite, kein seitliches Abschneiden`,
    wert.breite === breite && wert.links === 0 && wert.rechts === breite && wert.seitlich,
    JSON.stringify(wert));
  pruefe(`${breite}px: Touchziel mindestens 44 px`, wert.ziel >= 44, String(wert.ziel));

  /* Tab-Falle und Rückkehr werden als echte Tastendrücke geprüft. */
  for (let i = 0; i < 6; i++) await seite.keyboard.press('Tab');
  gleich(`${breite}px: Tab bleibt im Blatt`,
    await seite.evaluate(() => !!document.querySelector('.menu.blatt')?.contains(document.activeElement)), true);
  await seite.keyboard.press('Escape');
  await seite.waitForTimeout(120);
  const zu = await seite.evaluate((b: number) => ({
    menu: !!document.querySelector('.menu'), grund: !!document.querySelector('.menu-grund'),
    fokus: (document.activeElement as HTMLElement | null)?.id,
    inert: (document.getElementById('blatt-oeffner-' + b) as HTMLElement | null)?.inert
  }), breite);
  pruefe(`${breite}px: Escape räumt Blatt und Grund auf`, !zu.menu && !zu.grund, JSON.stringify(zu));
  pruefe(`${breite}px: Fokus und Bedienbarkeit kehren zurück`,
    zu.fokus === 'blatt-oeffner-' + breite && zu.inert === false, JSON.stringify(zu));
  await kontext.close();
}

console.log('\n2 · visualViewport hält ein langes Blatt über der Tastatur');
{
  const { kontext, seite } = await vorbereiten(390, 844);
  const lage = await seite.evaluate(async () => {
    const lang = Array.from({ length: 30 }, (_, i) => `<button>Aktion ${i + 1}</button>`).join('');
    Menue.menu(lang, 0, 0, { titel: 'Lange Liste' });
    await new Promise(r => setTimeout(r, 100));
    (window as any).__sichtbar(508);             /* 336 px Softwaretastatur */
    await new Promise(r => setTimeout(r, 100));
    const m = document.querySelector<HTMLElement>('.menu.blatt')!;
    const liste = m.querySelector<HTMLElement>('.menu-liste')!;
    const r = m.getBoundingClientRect();
    liste.scrollTop = liste.scrollHeight;
    const letzter = liste.querySelector<HTMLElement>('button:last-child')!.getBoundingClientRect();
    return {
      oben: Math.round(r.top), unten: Math.round(r.bottom), sichtbar: 508,
      rollt: liste.scrollHeight > liste.clientHeight,
      letzterDrin: letzter.bottom <= r.bottom + 1,
      cssUnten: getComputedStyle(document.documentElement).getPropertyValue('--visual-bottom').trim()
    };
  });
  gleich('Das Blatt endet exakt an der Tastaturkante', lage.unten, lage.sichtbar);
  pruefe('Die lange Liste rollt und ihre letzte Aktion bleibt erreichbar',
    lage.rollt && lage.letzterDrin, JSON.stringify(lage));
  gleich('Der gemeinsame Viewportwert nennt 336 px', lage.cssUnten, '336px');
  await kontext.close();
}

console.log('\n3 · Side Peek öffnet mobil direkt, bleibt am Rechner ein Peek');
{
  const { kontext, seite } = await vorbereiten(390, 844);
  const mobil = await seite.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Daten' });
    const db = Store.addDatabase(s.id, 'Kunden', { title: { name: 'Name', type: 'title' } });
    const row = Store.addRow(db.collectionId, { title: 'Ada Lovelace' });
    Datenbank.zeilePeek(row, Store.getCollection(db.collectionId));
    await new Promise(r => setTimeout(r, 250));
    return { peek: !!document.querySelector('.peek'), titel: document.getElementById('title')?.textContent || '' };
  });
  gleich('390 px: kein gequetschter Peek entsteht', mobil.peek, false);
  pruefe('390 px: die echte Zeilenseite wurde geöffnet', /Ada Lovelace/.test(mobil.titel), mobil.titel);
  await kontext.close();

  const { kontext: dk, seite: ds } = await vorbereiten(1280, 850, false);
  const desktop = await ds.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Daten Desktop' });
    const db = Store.addDatabase(s.id, 'Kunden', { title: { name: 'Name', type: 'title' } });
    const row = Store.addRow(db.collectionId, { title: 'Grace Hopper' });
    Datenbank.zeilePeek(row, Store.getCollection(db.collectionId));
    await new Promise(r => setTimeout(r, 100));
    const p = document.querySelector<HTMLElement>('.peek');
    const r = p?.getBoundingClientRect();
    return { da: !!p, breite: Math.round(r?.width || 0), fenster: innerWidth };
  });
  pruefe('1280 px: Desktop-Side-Peek bleibt erhalten', desktop.da && desktop.breite < desktop.fenster,
    JSON.stringify(desktop));
  await dk.close();
}

console.log('\n4 · Karten öffnen genau ihre Tabellenzeile, auch quer');
for (const [breite, hoehe] of [[390, 844], [844, 390]] as const) {
  const { kontext, seite } = await vorbereiten(breite, hoehe, true);
  const stand = await seite.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Tabelle mobil' });
    Blocks.mdEinsetzen(Blocks.mdLesen(
      '| Ware | Preis |\n| --- | ---: |\n| Brot | 3.5 |\n| Milch | 1.2 |'), s.id, 0);
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    const karten = [...document.querySelectorAll<HTMLElement>('.tblk-karte')];
    karten[1]?.click();
    await new Promise(r => setTimeout(r, 500));
    const block = (Store.childrenOf(s.id) || []).find((b: any) => b.type === 'spreadsheet');
    return {
      kartenVorher: karten.length,
      raster: !!document.querySelector('.tbl'),
      adresse: document.querySelector('.tbl-adresse')?.textContent || '',
      gemerkt: block?.telefonZelle,
      telefon: AppEinstellung.amTelefon()
    };
  });
  pruefe(`${breite}×${hoehe}: Gerät gilt als Telefon und zeigt Karten`,
    stand.telefon && stand.kartenVorher === 2, JSON.stringify(stand));
  pruefe(`${breite}×${hoehe}: zweite Karte öffnet A3 statt A1`,
    stand.raster && stand.adresse === 'A3' && stand.gemerkt === 'A3', JSON.stringify(stand));
  await kontext.close();
}

console.log('\n5 · Konsole und Plattformzusagen');
pruefe('Keine Skriptfehler', fehler.length === 0, fehler.slice(0, 5).join(' | '));
pruefe('Der Browser versteht Safe-Area-Ausdrücke',
  await browser.newPage().then(async s => { const v = await s.evaluate(() => CSS.supports('padding-bottom', 'env(safe-area-inset-bottom)')); await s.close(); return v; }));

await browser.close();
server.close();
console.log(`\n${offen ? '✗' : '✓'} ${ok} ok, ${offen} offen`);
process.exit(offen ? 1 : 0);
