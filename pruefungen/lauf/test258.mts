/* Suite 258 — Glocke und Statuspunkt in der Menüleiste (E251, zweiter Anlauf)
 * ============================================================================
 * Der erste Anlauf hängte Glocke und Konto-Knopf an die KOPFZEILE — und
 * drei Wächter wurden rot: test40 führt die sechs Seitenknöpfe namentlich,
 * test248 zählt das Budget, test245 mass die Suche aus der Mitte gerückt.
 * Die Wächter hatten recht: die Kopfzeile gehört der SEITE, Ungelesenes
 * und Kontostand gehören der APP — also in die Menüleiste, wo rechts schon
 * Suche, KI und Arbeitsbereich stehen.
 *
 * §1 DIE KOPFZEILE IST SAUBER: btn-glocke/btn-konto gibt es nicht mehr;
 *    die Glocke wartet versteckt in der Menüleiste.
 * §2 DER ZÄHLER LEBT: jede Meldung hebt ihn, das Wort steht im aria-label.
 * §3 EIN NEUBAU DER LEISTE (Reiterwechsel) verliert den Stand nicht.
 * §4 GELESEN SENKT, LEEREN VERSTECKT.
 * §5 EIN KLICK öffnet den Posteingang.
 * §6 DER STATUSPUNKT hängt am Arbeitsbereichs-Knopf — abgemeldet ist er
 *    weg, und das aria-label verspricht nur, was der Klick tut.
 * §7 DER WEG ZUR WOLKE steht unter „Mehr" — nicht mehr nur in der Palette.
 * §8 AM TELEFON ist die Glocke da und fingertauglich (§37) — die
 *    Menüleiste ist die App-Zeile, und die gibt es dort auch.
 * ==========================================================================*/
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = 9024;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2'
};
const server = createServer((q, a) => {
  let pfad = join(WURZEL, decodeURIComponent((q.url || '/').split('?')[0]!));
  if (existsSync(pfad) && statSync(pfad).isDirectory()) pfad = join(pfad, 'index.html');
  if (!existsSync(pfad) || !pfad.startsWith(WURZEL)) { a.statusCode = 404; a.end('weg'); return; }
  a.setHeader('Content-Type', TYP[extname(pfad)] || 'application/octet-stream');
  a.end(readFileSync(pfad));
});
await new Promise<void>(f => server.listen(PORT, () => f()));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 950 } });
const fehler: string[] = [];
p.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));

let ok = 0, weg = 0;
const pr = (name: string, gut: unknown, ist = ''): void => {
  if (gut) ok++; else weg++;
  console.log((gut ? '  ✓ ' : '  ✗ ') + name + (gut || !ist ? '' : ' — ' + ist));
};

await p.goto(`http://localhost:${PORT}/index.html`);
await p.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
  (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
await p.evaluate(() => { Store.setMeta('rundgangGesehen', true); });

console.log('\n1 · Die Kopfzeile ist sauber, die Glocke wartet in der Menüleiste');
const start = await p.evaluate(() => ({
  kopfGlocke: !!document.getElementById('btn-glocke'),
  kopfKonto: !!document.getElementById('btn-konto'),
  glocke: !!document.querySelector('#menueband #mb-glocke'),
  inRechts: !!document.querySelector('.mb-rechts #mb-glocke'),
  versteckt: (document.getElementById('mb-glocke') as HTMLElement)?.hidden === true,
  /* GERECHNETER STIL, NICHT NUR DAS ATTRIBUT. `display:grid` an
     .mb-rechts-knopf schlägt die [hidden]-Regel des Browsers; genau so
     stand im ersten Anlauf eine „versteckte" Glocke sichtbar in der
     Kopfzeile, und die Prüfung, die nur das Attribut las, blieb grün. */
  wirklichWeg: getComputedStyle(document.getElementById('mb-glocke')!).display === 'none',
  symbol: !!document.querySelector('#mb-glocke svg, #mb-glocke [data-sym] *')
}));
pr('btn-glocke und btn-konto stehen NICHT mehr in der Kopfzeile',
  !start.kopfGlocke && !start.kopfKonto, JSON.stringify(start));
pr('Die Glocke wartet versteckt rechts in der Menüleiste — mit gezeichnetem Symbol',
  start.glocke && start.inRechts && start.versteckt && start.symbol, JSON.stringify(start));
pr('Und versteckt heisst auch GEZEICHNET weg (display:none, nicht nur das Attribut)',
  start.wirklichWeg, JSON.stringify(start));

console.log('\n2 · Der Zähler lebt');
const einz = await p.evaluate(() => {
  Werkzeuge.posteingangMelden({ text: 'Erste Probe', quelle: 'test258' });
  const zahl = document.querySelector('#mb-glocke .glocke-zahl') as HTMLElement;
  return { text: zahl?.textContent, sichtbar: zahl?.hidden === false,
           knopfDa: (document.getElementById('mb-glocke') as HTMLElement)?.hidden === false,
           beschriftung: document.getElementById('mb-glocke')?.getAttribute('aria-label') || '' };
});
pr('Eine Meldung: die Glocke ERSCHEINT mit Zähler 1, das aria-label sagt es in Worten',
  einz.knopfDa && einz.text === '1' && einz.sichtbar &&
  /Posteingang, 1 ungelesen/.test(einz.beschriftung),
  JSON.stringify(einz));
const zwei = await p.evaluate(() => {
  Werkzeuge.posteingangMelden({ text: 'Zweite Probe', quelle: 'test258' });
  return (document.querySelector('#mb-glocke .glocke-zahl') as HTMLElement)?.textContent;
});
pr('Die zweite Meldung hebt auf 2', zwei === '2', String(zwei));

console.log('\n3 · Ein Neubau der Leiste verliert den Stand nicht');
/* Die Leiste wird bei jedem Reiterwechsel komplett neu gebaut. Eine
   Glocke, die nur auf Ereignisse hört, wäre nach dem Neubau leer —
   deshalb ruft zeichne() selbst auf. Hier wird genau das geprüft. */
const neubau = await p.evaluate(() => {
  Menueband.zeichne();
  const g = document.getElementById('mb-glocke') as HTMLElement;
  return { da: g?.hidden === false,
           zahl: (g?.querySelector('.glocke-zahl') as HTMLElement)?.textContent };
});
pr('Nach Menueband.zeichne() zeigt die frische Glocke weiterhin 2',
  neubau.da && neubau.zahl === '2', JSON.stringify(neubau));

console.log('\n4 · Gelesen senkt, Leeren versteckt');
const gelesen = await p.evaluate(() => {
  const erste = Werkzeuge.meldungen()[0];
  Werkzeuge.meldungGelesen(erste.id);
  return (document.querySelector('#mb-glocke .glocke-zahl') as HTMLElement)?.textContent;
});
pr('Eine gelesene Meldung senkt auf 1', gelesen === '1', String(gelesen));
const leer = await p.evaluate(() => {
  Werkzeuge.meldungenLeeren();
  return { knopfWeg: (document.getElementById('mb-glocke') as HTMLElement)?.hidden === true,
           beschriftung: document.getElementById('mb-glocke')?.getAttribute('aria-label') || '' };
});
pr('Leeren lässt die ganze Glocke wieder verschwinden',
  leer.knopfWeg && leer.beschriftung === 'Posteingang', JSON.stringify(leer));

console.log('\n5 · Ein Klick öffnet den Posteingang');
await p.evaluate(() => { Werkzeuge.posteingangMelden({ text: 'Klickprobe', quelle: 'test258' }); });
/* AM RECHNER IST DAS BAND SEIT E457 EINE LADE — die Glocke, die man sieht,
   ist die im Studio-Kopf. Geklickt wird die sichtbare von beiden; beide
   tragen dieselbe Zahl (`glockeFrisch`). */
const sichtbareGlocke = await p.evaluate(() => {
  const s = document.getElementById('studio-glocke');
  return s && !s.hidden && s.getBoundingClientRect().width > 0 ? '#studio-glocke' : '#mb-glocke';
});
pr('Die Studio-Glocke zeigt dieselbe Zahl wie die im Band', await p.evaluate(() =>
  (document.querySelector('#studio-glocke .glocke-zahl')?.textContent || '') ===
  (document.querySelector('#mb-glocke .glocke-zahl')?.textContent || '')));
await p.click(sichtbareGlocke);
await p.waitForTimeout(600);
pr('Die Krume zeigt den Posteingang',
  await p.evaluate(() => /Posteingang/.test(document.getElementById('crumb')?.textContent || '')),
  await p.evaluate(() => (document.getElementById('crumb')?.textContent || '').trim()));
await p.evaluate(() => { Werkzeuge.meldungenLeeren(); });

console.log('\n6 · Der Statuspunkt am Arbeitsbereichs-Knopf');
const konto = await p.evaluate(() => ({
  da: !!document.getElementById('mb-konto'),
  punktDa: !!document.querySelector('#mb-konto .wolke-punkt'),
  punktWeg: (document.querySelector('#mb-konto .wolke-punkt') as HTMLElement)?.hidden === true,
  beschriftung: document.getElementById('mb-konto')?.getAttribute('aria-label') || ''
}));
pr('Abgemeldet ist der Punkt versteckt; das aria-label verspricht den Arbeitsbereich',
  konto.da && konto.punktDa && konto.punktWeg && /Arbeitsbereich/.test(konto.beschriftung),
  JSON.stringify(konto));

console.log('\n7 · Der Weg zur Wolke steht unter „Mehr"');
await p.evaluate(() => { Ansichten.mehr(); });
await p.waitForTimeout(400);
const wolkeZeile = await p.evaluate(() => {
  const knopf = document.querySelector<HTMLElement>('#page [data-a="wolke"]');
  return { da: !!knopf, wort: (knopf?.textContent || '').includes('Wolke') };
});
pr('„Mehr" führt eine Wolke-Zeile bei Daten und Sicherheit',
  wolkeZeile.da && wolkeZeile.wort, JSON.stringify(wolkeZeile));
await p.click('#page [data-a="wolke"]');
await p.waitForTimeout(600);
pr('Ein Klick darauf öffnet den Wolke-Dialog',
  await p.evaluate(() => !!document.querySelector('.overlay') &&
    /Wolke|Konto|Anmelden/i.test(document.querySelector('.overlay')?.textContent || '')),
  await p.evaluate(() => (document.querySelector('.overlay')?.textContent || '').slice(0, 80)));
await p.keyboard.press('Escape');
await p.waitForTimeout(300);

console.log('\n8 · Am Telefon ist die Glocke da und fingertauglich');
await p.setViewportSize({ width: 390, height: 844 });
await p.waitForTimeout(400);
const handy = await p.evaluate(() => {
  Werkzeuge.posteingangMelden({ text: 'Handyprobe', quelle: 'test258' });
  const g = document.getElementById('mb-glocke') as HTMLElement;
  const r = g?.getBoundingClientRect();
  return { da: g?.hidden === false,
           sichtbar: !!r && r.width > 0 && r.height > 0,
           hoehe: r ? Math.round(r.height) : 0,
           breite: r ? Math.round(r.width) : 0 };
});
pr('Mit Ungelesenem erscheint die Glocke auch am Telefon',
  handy.da && handy.sichtbar, JSON.stringify(handy));
pr('Und sie ist mindestens 44 px gross (§37)',
  handy.hoehe >= 44 && handy.breite >= 44, JSON.stringify(handy));

console.log('\n9 · Kein `hidden` bedeutet gar nichts (E334)');

/* §1 misst DIE GLOCKE. Das reichte nicht: E322 hängte einen zweiten Knopf
   mit derselben Klasse daneben, und die Reparatur von E251 hing an der
   Kennung `#mb-glocke`. Also nahm `#mb-auftraege` mit `hidden` weiter
   44 px, die Reitergruppe wuchs von 190 auf 234 px und lag damit über der
   Reserve der Reiterzeile (`scroll-padding-inline-end: 200px`). Gefunden
   hat es test247, dreizehn Bögen später und an einer ganz anderen Stelle.

   DIESE ZEILE FRAGT NICHT MEHR NACH NAMEN. Sie geht über ALLES, was
   `hidden` trägt, und verlangt, dass es auch wirklich weg ist. Der nächste
   Knopf mit demselben Fehler fällt hier auf, nicht dreizehn Bögen später
   an einer Breite. */
const versteckte = async (): Promise<any> => p.evaluate(() => {
  const raus: string[] = [];
  document.querySelectorAll('[hidden]').forEach(e => {
    if (getComputedStyle(e).display === 'none') return;
    const k = e.getBoundingClientRect();
    raus.push((e.id || e.tagName.toLowerCase()) + '.' +
      String(e.className || '').split(' ')[0] + ' → ' +
      getComputedStyle(e).display + ' ' +
      Math.round(k.width) + '×' + Math.round(k.height));
  });
  return { gesamt: document.querySelectorAll('[hidden]').length, raus };
});

const hTelefon = await versteckte();
/* GEGENPROBE ZUR MESSUNG SELBST: gäbe es gar kein `hidden`-Element, wäre
   die Zeile darunter grün, ohne irgendetwas geprüft zu haben. */
pr('Am Telefon tragen überhaupt Elemente `hidden`', hTelefon.gesamt >= 5,
  String(hTelefon.gesamt));
pr('Und keines davon wird trotzdem gezeichnet',
  hTelefon.raus.length === 0, hTelefon.raus.join(' | '));

await p.setViewportSize({ width: 1280, height: 860 });
await p.waitForTimeout(400);
const hRechner = await versteckte();
pr('Am Rechner ebenso — Elemente mit `hidden` gibt es',
  hRechner.gesamt >= 5, String(hRechner.gesamt));
pr('Und auch dort wird keines gezeichnet',
  hRechner.raus.length === 0, hRechner.raus.join(' | '));

pr('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await b.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
