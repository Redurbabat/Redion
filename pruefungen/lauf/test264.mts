/* Suite 264 — Notizhefte: das Regal zum Losschreiben (E264)
 * ============================================================================
 * Redur: „eine ganz neue Ansicht, wie GoodNotes — wenn man öffnet, muss man
 * direkt wissen, was man machen muss." Diese Suite misst genau das:
 *
 * §1 REGISTER (§5 Regel 2): Modul- und Navigations-Eintrag, Öffnen wirkt.
 * §2 DREI-DINGE-BUDGET: das Regal zeigt neben Kopf und Telefon-Knopf
 *    höchstens zwei inhaltliche Dinge (Weiterschreiben + Gitter/Leerfall).
 * §3 SOFORT SCHREIBEN: ein Klick auf „Dein erstes Heft", dann TIPPEN —
 *    ohne weiteren Klick steht der Text im Blatt (liniert, Dokumentmodus).
 * §4 PAPIERVORGABE: das zuletzt gewählte Papier gilt fürs nächste Heft.
 * §5 DIE HEFT-REGEL: nur lebende Seiten mit blatt-Kind und ohne
 *    pdfseite-Kind stehen im Regal.
 * §6 WEITERSCHREIBEN: echte Blattzahl, öffnet das letzte Heft; eine tote
 *    Kennung bricht nichts.
 * §7 DER RÜCKWEG heisst mit sichtbarem WORT „Alle Dokumente" (§38/§47).
 * §8 BEIDE ENDEN VERDRAHTET (E236-Wächter): die Startwerte 'notizhefte'
 *    und 'notizheft' wirken beim Neuladen; ein Seiten-Hash gewinnt.
 * §9 TELEFON (§37): FAB über der unteren Leiste, Ziele fingertauglich.
 * §10 SICHERHEIT (§19): ein böser Heftname wird escaped.
 * §11 BAU-HYGIENE: index.html, sw.js und die Einzeldatei kennen die Teile.
 *
 *   node pruefungen/lauf/test264.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any; declare const Register: any;
declare const Notebook: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9041;

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
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
const startbereit = async (): Promise<void> => {
  await seite.waitForFunction(() => typeof Store !== 'undefined' &&
    typeof App !== 'undefined' && typeof (window as any).Notebook !== 'undefined',
    null, { timeout: 30000 });
  await seite.waitForTimeout(1100);
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
  });
};
await seite.goto(`http://localhost:${PORT}/index.html`);
await startbereit();

console.log('\n1 · Register: zwei Einträge, Öffnen wirkt (§5 Regel 2)');
const reg = await seite.evaluate(() => {
  const modul = (Register.module?.alle?.() || Register.module || [])
    ;
  const modulListe = Array.isArray(modul) ? modul : (modul.alle ? modul.alle() : []);
  const nav = Register.navigation?.anPlatz?.('apps') || [];
  const eintrag = nav.find((n: any) => n.id === 'app-notizhefte');
  return {
    modul: JSON.stringify(modulListe).includes('notizhefte'),
    nav: !!eintrag, rang: eintrag?.rang,
    zwischen: !!eintrag && eintrag.rang > 50 && eintrag.rang < 55
  };
});
p('Modul- und Navigationseintrag stehen, Rang zwischen Aufgaben und Alle Seiten',
  reg.modul && reg.nav && reg.zwischen, JSON.stringify(reg));
await seite.evaluate(() => Notebook.oeffnen());
await seite.waitForTimeout(600);
p('Öffnen zeichnet das Regal, setzt den Hash und räumt die Rand-Leiste',
  await seite.evaluate(() => !!document.querySelector('.nh-regal') &&
    location.hash === '#notizhefte' && !document.getElementById('rand-toc')));

console.log('\n2 · Drei-Dinge-Budget');
p('Neben Kopf und Telefon-Knopf höchstens zwei inhaltliche Kinder',
  await seite.evaluate(() =>
    [...document.querySelectorAll('.nh-regal > *')]
      .filter(k => !k.classList.contains('nh-kopf') &&
                   !k.classList.contains('nh-neu-fab')).length <= 2));

console.log('\n3 · Sofort schreiben: ein Klick, dann tippen');
p('Der Leerfall steht mit genau einem grossen Erste-Schritt-Knopf',
  await seite.locator('.nh-leer .nh-erstes').count() === 1);
await seite.locator('.nh-erstes').click();
await seite.waitForTimeout(900);
await seite.keyboard.type('U gleich R mal I');
await seite.waitForTimeout(400);
const geschrieben = await seite.evaluate(() => {
  const id = Store.getMeta('heft:zuletzt', '');
  const s = id ? Store.getBlock(id) : null;
  const blatt = s ? Store.childrenOf(s.id).find((k: any) => k.type === 'blatt') : null;
  const zeile = blatt ? Store.childrenOf(blatt.id)[0] : null;
  return { dok: !!s?.dokumentModus, papier: blatt?.papier,
           text: String(zeile?.text || ''),
           fokusImBlatt: !!document.activeElement?.closest?.('.blatt-papier') };
});
p('Ohne weiteren Klick steht der Text im linierten Blatt, Dokumentmodus an',
  geschrieben.dok && geschrieben.papier === 'liniert' &&
  geschrieben.text.includes('U gleich R mal I') && geschrieben.fokusImBlatt,
  JSON.stringify(geschrieben));

console.log('\n4 · Papiervorgabe aus dem letzten Heft');
await seite.evaluate(() => { Store.setMeta('heft:papier', 'kariert'); Notebook.oeffnen(); });
await seite.waitForTimeout(500);
await seite.locator('.nh-neu:not(.nh-neu-fab)').first().click();
await seite.waitForTimeout(700);
p('Das neue Heft nimmt das gemerkte Papier',
  await seite.evaluate(() => {
    const s = Store.getBlock(Store.getMeta('heft:zuletzt', ''));
    const blatt = s ? Store.childrenOf(s.id).find((k: any) => k.type === 'blatt') : null;
    return blatt?.papier === 'kariert';
  }));

console.log('\n5 · Die Heft-Regel');
const regel = await seite.evaluate(() => {
  const ohne = Store.addPage(null, { text: 'NurText-Seite' });
  Store.addBlock(ohne.id, 'text', { text: 'kein Heft' });
  const gemischt = Store.addPage(null, { text: 'PdfUndBlatt' });
  Store.addBlock(gemischt.id, 'blatt', { text: '' });
  Store.addBlock(gemischt.id, 'pdfseite', { text: '' });
  const tot = Store.addPage(null, { text: 'TotesHeft' });
  Store.addBlock(tot.id, 'blatt', { text: '' });
  Store.trashBlock(tot.id);
  Notebook.oeffnen();
  return { ohne: ohne.text, gemischt: gemischt.text, tot: tot.text };
});
await seite.waitForTimeout(500);
const gitterText = await seite.evaluate(() =>
  (document.querySelector('.nh-gitter') as HTMLElement)?.textContent || '');
p('Seite ohne Blatt, Seite mit PDF und totes Heft stehen NICHT im Regal',
  !gitterText.includes(regel.ohne) && !gitterText.includes(regel.gemischt) &&
  !gitterText.includes(regel.tot), gitterText.slice(0, 120));

console.log('\n6 · Die Weiterschreiben-Karte');
const weiter = await seite.evaluate(() => {
  const id = Store.getMeta('heft:zuletzt', '');
  const s = Store.getBlock(id);
  const karte = document.querySelector('.nh-weiter') as HTMLElement | null;
  return { da: !!karte, name: s?.text,
           zeigtName: !!karte && (karte.textContent || '').includes(s?.text || '@@'),
           zeigtBlatt: !!karte && /1 Blatt\b/.test(karte.textContent || '') };
});
p('Sie steht, nennt das letzte Heft und die ECHTE Blattzahl (Einzahl!)',
  weiter.da && weiter.zeigtName && weiter.zeigtBlatt, JSON.stringify(weiter));
await seite.locator('.nh-weiter').click();
await seite.waitForTimeout(700);
p('Ein Klick öffnet genau dieses Heft',
  await seite.evaluate(() => App.aktuelleSeite?.() === Store.getMeta('heft:zuletzt', '')));
await seite.evaluate(() => { Store.setMeta('heft:zuletzt', 'gibt-es-nicht'); Notebook.oeffnen(); });
await seite.waitForTimeout(400);
p('Eine tote Kennung: keine Karte, kein Skriptfehler',
  await seite.locator('.nh-weiter').count() === 0 && fehler.length === 0,
  fehler.join(' | '));

console.log('\n7 · Der Rückweg trägt ein Wort');
p('„Alle Dokumente" steht als TEXT auf dem Knopf (§38)',
  await seite.evaluate(() =>
    (document.querySelector('.nh-alle')?.textContent || '').includes('Alle Dokumente')));
await seite.locator('.nh-alle').click();
await seite.waitForTimeout(700);
p('Er führt in die Bibliothek',
  await seite.evaluate(() => !!document.querySelector('.bib-gitter, .bib-arten, .bib-reiter')));

console.log('\n8 · Beide Enden verdrahtet (E236-Wächter)');
await seite.evaluate(() => Store.setMeta('startAnsicht', 'notizhefte'));
await seite.waitForTimeout(400);
await seite.goto(`http://localhost:${PORT}/index.html`);
await startbereit();
await seite.waitForTimeout(800);
p('startAnsicht=notizhefte: nach dem Neuladen steht das Regal',
  await seite.locator('.nh-regal').count() === 1);
const heftId = await seite.evaluate(() => {
  const s = Object.values<any>(Store.cache.blocks).find((b: any) =>
    b?.type === 'page' && b.alive !== false &&
    Store.childrenOf(b.id).some((k: any) => k.type === 'blatt') &&
    !Store.childrenOf(b.id).some((k: any) => k.type === 'pdfseite'));
  Store.setMeta('heft:zuletzt', s.id);
  Store.setMeta('startAnsicht', 'notizheft');
  return s.id;
});
await seite.waitForTimeout(400);
await seite.goto(`http://localhost:${PORT}/index.html`);
await startbereit();
await seite.waitForTimeout(900);
p('startAnsicht=notizheft: das Heft ist offen und der Cursor sitzt im Blatt — null Klicks',
  await seite.evaluate((id: string) => App.aktuelleSeite?.() === id &&
    !!document.activeElement?.closest?.('.blatt-papier'), heftId));
await seite.evaluate(() => Store.setMeta('heft:zuletzt', 'weg-damit'));
await seite.waitForTimeout(300);
await seite.goto(`http://localhost:${PORT}/index.html`);
await startbereit();
await seite.waitForTimeout(800);
p('… und mit toter Kennung fällt der Start lautlos aufs Regal zurück (§47)',
  await seite.locator('.nh-regal').count() === 1 && fehler.length === 0);
const normalId = await seite.evaluate(() => {
  const s = Object.values<any>(Store.cache.blocks).find((b: any) =>
    b?.type === 'page' && b.alive !== false && b.text === 'NurText-Seite');
  return s?.id || '';
});
await seite.goto(`http://localhost:${PORT}/index.html#${normalId}`);
/* Der Sprung von `#notizhefte` zu `#<id>` ändert NUR das Fragment — der
   Browser lädt dabei nicht neu, `start()` liest den Hash also nie. Genau
   das prüft dieser Punkt aber: einen frischen Start MIT Seiten-Hash, wie
   ihn ein geteilter Link auslöst. Deshalb ausdrücklich neu laden. */
await seite.reload();
await startbereit();
await seite.waitForTimeout(800);
p('Ein Seiten-Hash gewinnt gegen die Startansicht',
  await seite.evaluate((id: string) => App.aktuelleSeite?.() === id, normalId));

console.log('\n9 · Telefon (§37)');
await seite.setViewportSize({ width: 390, height: 844 });
await seite.evaluate(() => Notebook.oeffnen());
await seite.waitForTimeout(700);
const handy = await seite.evaluate(() => {
  const fab = document.querySelector('.nh-neu-fab')?.getBoundingClientRect();
  const unten = document.getElementById('handy-oben')?.getBoundingClientRect();
  const kopf = document.querySelector('.nh-kopf');
  const lupe = document.querySelector('.nh-suche-knopf')?.getBoundingClientRect();
  return {
    fabDa: !!fab, fabGross: !!fab && fab.width >= 44 && fab.height >= 44,
    fabUeberLeiste: !!fab && !!unten && fab.bottom <= unten.top,
    kopfVertrag: kopf?.parentElement?.id === undefined
      ? kopf?.getAttribute('data-kopfzeile') === 'eigene' : false,
    kopfDirekt: kopf?.parentElement?.classList?.contains('nh-regal') === true,
    lupeGross: !!lupe && lupe.width >= 44 && lupe.height >= 44,
    wege: document.querySelectorAll('#handy-oben > button').length
  };
});
p('Der Neu-Knopf ist gross und liegt ÜBER der unteren Leiste',
  handy.fabDa && handy.fabGross && handy.fabUeberLeiste, JSON.stringify(handy));
p('Die untere Leiste behält ihre fünf Wege', handy.wege === 5, String(handy.wege));
p('Die Lupe ist fingertauglich', handy.lupeGross, JSON.stringify(handy));

console.log('\n10 · Sicherheit (§19)');
await seite.evaluate(() => {
  const s = Store.addPage(null, { text: '<img src=x onerror=alert(1)>' });
  const blatt = Store.addBlock(s.id, 'blatt', { text: '' });
  Store.addBlock(blatt.id, 'text', { text: '' });
  Notebook.oeffnen();
});
await seite.waitForTimeout(500);
p('Ein böser Heftname wird escaped — kein img im Regal',
  await seite.evaluate(() =>
    !document.querySelector('.nh-regal img') &&
    (document.querySelector('.nh-gitter')?.textContent || '').includes('<img')));

console.log('\n11 · Bau-Hygiene');
const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8');
const einzel = fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8');
const erzeugt = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/wissen/notebook.js'), 'utf8');
p('index.html lädt Modul und Stilblatt',
  html.includes('quell/bereiche/wissen/notebook.js') &&
  html.includes('quell/schale/stil/notizhefte.css'));
p('sw.js kennt beide — sonst fehlen sie offline',
  sw.includes('quell/bereiche/wissen/notebook.js') &&
  sw.includes('quell/schale/stil/notizhefte.css'));
p('Das erzeugte notebook.js trägt den ERZEUGT-Kopf',
  erzeugt.startsWith('"use strict"') && erzeugt.includes('ERZEUGT — NICHT VON HAND ÄNDERN'));
p('Die Einzeldatei enthält die Ansicht', einzel.includes('nh-regal'),
  'redion-einzeldatei.html neu bauen: node bauen.mts');

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await browser.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
