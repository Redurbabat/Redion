/* Suite 120 — Die Formatleiste über der Tastatur, mit Augen gemessen (L10)
 * ============================================================================
 * Die Leiste gab es längst (`pwa.ts`, `#tastenleiste`) — aber das Hinsehen
 * am 9. August fand vier Fehler, die kein Prüflauf hatte:
 *
 *   · Die Versteck-Regel zielte auf `#handy-leiste` — ein Element, das es
 *     nicht mehr gibt. Die echte Reiterleiste (`#handy-unten`) blieb stehen,
 *     ihre Knopfkreise ragten hinter der Formatleiste hervor.
 *   · Die Knöpfe waren 44×38 statt 44×44 — die Fingerregel (§37) galt für
 *     die Breite und wurde bei der Höhe vergessen.
 *   · `bottom:0` ohne visualViewport-Ausgleich: am echten iPhone legt sich
 *     die Tastatur ÜBER die Seite, ohne das Layout zu verkleinern — die
 *     Leiste „über der Tastatur" stünde exakt HINTER ihr.
 *   · Der Fertig-Knopf (Tastatur schliessen) rollte mit den elf Knöpfen
 *     seitlich aus dem Bild.
 *
 * Und die schwebende Auswahlleiste war am Telefon 442 px breit bei 390 px
 * Bild — Farbe und Kommentar lagen ausserhalb, die Knöpfe massen 28×31.
 *
 * Die Tastatur selbst kann Playwright nicht öffnen. Deshalb der Stummel:
 * er ersetzt `window.visualViewport`, BEVOR die App startet, und lässt die
 * Prüfung eine Tastatur beliebiger Höhe „öffnen". Was die App dann tut,
 * ist ihr echter Code — nur die Meldung der Höhe ist gestellt.
 *
 *   node pruefungen/lauf/test156.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8867;

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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();

const handy = await browser.newPage({ viewport: { width: 390, height: 844 } });
const fehler: string[] = [];
handy.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));

/* Der Tastatur-Stummel — muss VOR der App da sein, weil sie ihre
   Zuhörer beim Start anmeldet. */
await handy.addInitScript(() => {
  let hoehe: number | null = null;
  const zuhoerer: Record<string, Array<() => void>> = {};
  const stummel = {
    get height() { return hoehe ?? window.innerHeight; },
    get width() { return window.innerWidth; },
    get offsetTop() { return 0; },
    get offsetLeft() { return 0; },
    get pageTop() { return 0; },
    get scale() { return 1; },
    addEventListener(art: string, f: () => void) { (zuhoerer[art] ??= []).push(f); },
    removeEventListener() {}
  };
  (window as any).__tastatur = (h: number | null) => {
    hoehe = h;
    (zuhoerer['resize'] ?? []).forEach(f => f());
  };
  Object.defineProperty(window, 'visualViewport', { get: () => stummel, configurable: true });
});

await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2400);
const blockId = await handy.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Formatleiste' });
  const b = Store.addBlock(s.id, 'text', { text: 'Hier steht ein Satz zum Formatieren.' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 600));
  return b.id;
});

console.log('\n1 · Beim Schreiben erscheint die Leiste — und stimmt');

const lage = await handy.evaluate(async () => {
  const ct = document.querySelector('.blk .ct') as HTMLElement | null;
  ct?.focus();
  await new Promise(r => setTimeout(r, 300));
  const l = document.getElementById('tastenleiste')!;
  const knoepfe = [...l.querySelectorAll('button')].map(k => {
    const r = k.getBoundingClientRect();
    return { t: (k as HTMLElement).dataset['t'], kurz: Math.min(r.width, r.height) };
  });
  const fertig = l.querySelector('button[data-t="fertig"]')!.getBoundingClientRect();
  const unten = document.getElementById('handy-unten');
  return {
    sichtbar: !l.hidden,
    schreibt: document.body.classList.contains('schreibt'),
    knoepfe: knoepfe.length,
    zuKlein: knoepfe.filter(k => k.kurz < 44).map(k => k.t),
    fertigImBild: fertig.right <= innerWidth && fertig.left >= 0,
    untenWeg: unten ? getComputedStyle(unten).display === 'none' : null,
    bottom: Math.round(l.getBoundingClientRect().bottom)
  };
});
gleich('Die Leiste ist da, sobald ein Textfeld den Fokus hat', lage.sichtbar, true);
gleich('… und der Körper weiss, dass geschrieben wird', lage.schreibt, true);
p('Alle ' + lage.knoepfe + ' Knöpfe messen mindestens 44 px (§37)',
  lage.knoepfe >= 11 && lage.zuKlein.length === 0,
  'zu klein: ' + lage.zuKlein.join(', '));
gleich('Der Fertig-Knopf bleibt im Bild, obwohl die Leiste rollt', lage.fertigImBild, true);
gleich('Die Reiterleiste #handy-unten tritt zurück — die Regel zielt aufs echte Element',
  lage.untenWeg, true);
gleich('Ohne Tastatur sitzt die Leiste am unteren Rand', lage.bottom, 844);

console.log('\n2 · Die Tastatur schiebt die Leiste hoch');

const tast = await handy.evaluate(async () => {
  (window as any).__tastatur(844 - 336);   /* Tastatur: 336 px hoch */
  await new Promise(r => setTimeout(r, 100));
  const l = document.getElementById('tastenleiste')!;
  const oben = Math.round(l.getBoundingClientRect().bottom);
  (window as any).__tastatur(null);        /* Tastatur wieder zu */
  await new Promise(r => setTimeout(r, 100));
  const zurueck = Math.round(l.getBoundingClientRect().bottom);
  return { oben, zurueck };
});
gleich('Mit 336-px-Tastatur sitzt die Leiste auf 508 — direkt darüber', tast.oben, 844 - 336);
gleich('Ohne Tastatur sitzt sie wieder am Rand', tast.zurueck, 844);

console.log('\n3 · Die Leiste tut, was sie sagt: Fett');

await handy.evaluate(() => {
  const ct = document.querySelector('.blk .ct') as HTMLElement;
  ct.focus();
  const s = getSelection()!;
  const r = document.createRange();
  r.setStart(ct.firstChild!, 5); r.setEnd(ct.firstChild!, 10);   /* „steht" */
  s.removeAllRanges(); s.addRange(r);
});
await handy.click('#tastenleiste button[data-t="fett"]');
await handy.waitForTimeout(700);
const fett = await handy.evaluate((id: string) => (Store.getBlock(id) || {}).text || '', blockId);
p('Aus „steht" wurde „**steht**" — gespeichert, nicht nur angezeigt',
  fett.includes('**steht**'), 'Text: ' + JSON.stringify(fett));

console.log('\n4 · Fertig heisst fertig');

await handy.click('#tastenleiste button[data-t="fertig"]');
await handy.waitForTimeout(300);
const zu = await handy.evaluate(() => ({
  versteckt: document.getElementById('tastenleiste')!.hidden,
  schreibt: document.body.classList.contains('schreibt'),
  untenDa: getComputedStyle(document.getElementById('handy-unten')!).display !== 'none'
}));
gleich('Die Leiste ist zu', zu.versteckt, true);
gleich('… der Schreibzustand beendet', zu.schreibt, false);
gleich('… und die Reiterleiste wieder da', zu.untenDa, true);

console.log('\n5 · Die schwebende Auswahlleiste passt ins Telefonbild');

const schwebend = await handy.evaluate(async () => {
  const ct = document.querySelector('.blk .ct') as HTMLElement;
  const s = getSelection()!;
  const r = document.createRange();
  r.setStart(ct.firstChild!, 0); r.setEnd(ct.firstChild!, 4);
  s.removeAllRanges(); s.addRange(r);
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  await new Promise(w => setTimeout(w, 200));
  const al = document.querySelector('.auswahlleiste');
  if (!al) return null;
  const rr = al.getBoundingClientRect();
  const kurz = [...al.querySelectorAll('button')].map(k => {
    const kr = k.getBoundingClientRect();
    return Math.min(kr.width, kr.height);
  });
  return { imBild: rr.right <= innerWidth && rr.left >= 0,
           rechts: Math.round(rr.right), kleinster: Math.min(...kurz) };
});
p('Sie erscheint', !!schwebend);
p('… ragt nicht mehr aus dem Bild (war: 450 bei 390 Breite)',
  !!schwebend && schwebend.imBild, 'rechts: ' + schwebend?.rechts);
p('… und auch ihre Knöpfe messen mindestens 44 px (waren: 28×31)',
  !!schwebend && schwebend.kleinster >= 44, 'kleinster: ' + schwebend?.kleinster);

console.log('\n6 · Am Rechner bleibt alles beim Alten');

const rechner = await browser.newPage({ viewport: { width: 1280, height: 800 } });
rechner.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await rechner.goto(`http://localhost:${PORT}/index.html`);
await rechner.waitForTimeout(2400);
const amRechner = await rechner.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Rechner' });
  Store.addBlock(s.id, 'text', { text: 'Hier steht ein Satz zum Formatieren.' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 600));
  const ct = document.querySelector('.blk .ct') as HTMLElement;
  ct.focus();
  await new Promise(r => setTimeout(r, 300));
  const leisteZu = document.getElementById('tastenleiste')!.hidden;
  const sel = getSelection()!;
  const bereich = document.createRange();
  bereich.setStart(ct.firstChild!, 0); bereich.setEnd(ct.firstChild!, 4);
  sel.removeAllRanges(); sel.addRange(bereich);
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  await new Promise(w => setTimeout(w, 200));
  const al = document.querySelector('.auswahlleiste');
  const kurz = al ? [...al.querySelectorAll('button')].map(k => {
    const kr = k.getBoundingClientRect();
    return Math.min(kr.width, kr.height);
  }) : [];
  return { leisteZu, schwebendDa: !!al, kompakt: kurz.length ? Math.min(...kurz) < 44 : false };
});
gleich('Die Formatleiste bleibt am Rechner versteckt', amRechner.leisteZu, true);
gleich('Die schwebende Auswahlleiste erscheint wie immer', amRechner.schwebendDa, true);
p('… und ist kompakt geblieben — die Telefonregel leckt nicht auf den Rechner',
  amRechner.kompakt);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
