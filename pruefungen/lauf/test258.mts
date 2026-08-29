/* Suite 258 — Glocke und Konto-Knopf in der Kopfzeile (E251)
 * ============================================================================
 * Der Bild-Abgleich fand drei Fertigteile, die versteckt lagen: der
 * Posteingang zählte seine Ungelesenen (der Punkt am Telefon zeigt sie),
 * der Wolke-Dialog kannte Konto und Abgleichzustand — erreichbar nur über
 * die Befehlspalette. Jetzt hängen Glocke (mit Zähler) und Konto-Knopf
 * (mit Statuspunkt) an der Kopfzeile.
 *
 * §1 DIE GLOCKE steht da — ohne Ungelesenes ohne Zahl.
 * §2 DER ZÄHLER LEBT: jede Meldung hebt ihn, das Wort steht im aria-label.
 * §3 GELESEN SENKT, LEEREN VERSTECKT.
 * §4 EIN KLICK öffnet den Posteingang.
 * §5 DER KONTO-KNOPF: abgemeldet ohne Punkt, ehrlich beschriftet; ein
 *    Klick öffnet den Wolke-Dialog.
 * §6 AM TELEFON bleiben beide weg — die Kopfzeile ist dort voll, den
 *    Ungelesen-Punkt trägt die Seitenleiste.
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

console.log('\n1 · Die Glocke steht da — ohne Ungelesenes ohne Zahl');
const start = await p.evaluate(() => ({
  glocke: !!document.getElementById('btn-glocke'),
  symbol: !!document.querySelector('#btn-glocke svg, #btn-glocke [data-sym] *'),
  zahlWeg: (document.querySelector('#btn-glocke .glocke-zahl') as HTMLElement)?.hidden === true,
  beschriftung: document.getElementById('btn-glocke')?.getAttribute('aria-label') || ''
}));
pr('Glocke mit gezeichnetem Symbol', start.glocke && start.symbol);
pr('Ohne Ungelesenes keine Zahl, schlichtes aria-label',
  start.zahlWeg && start.beschriftung === 'Posteingang', JSON.stringify(start));

console.log('\n2 · Der Zähler lebt');
const einz = await p.evaluate(() => {
  Werkzeuge.posteingangMelden({ text: 'Erste Probe', quelle: 'test258' });
  const zahl = document.querySelector('#btn-glocke .glocke-zahl') as HTMLElement;
  return { text: zahl?.textContent, sichtbar: zahl?.hidden === false,
           beschriftung: document.getElementById('btn-glocke')?.getAttribute('aria-label') || '' };
});
pr('Eine Meldung: der Zähler zeigt 1 und das aria-label sagt es in Worten',
  einz.text === '1' && einz.sichtbar && /Posteingang, 1 ungelesen/.test(einz.beschriftung),
  JSON.stringify(einz));
const zwei = await p.evaluate(() => {
  Werkzeuge.posteingangMelden({ text: 'Zweite Probe', quelle: 'test258' });
  return (document.querySelector('#btn-glocke .glocke-zahl') as HTMLElement)?.textContent;
});
pr('Die zweite Meldung hebt auf 2', zwei === '2', String(zwei));

console.log('\n3 · Gelesen senkt, Leeren versteckt');
const gelesen = await p.evaluate(() => {
  const erste = Werkzeuge.meldungen()[0];
  Werkzeuge.meldungGelesen(erste.id);
  return (document.querySelector('#btn-glocke .glocke-zahl') as HTMLElement)?.textContent;
});
pr('Eine gelesene Meldung senkt auf 1', gelesen === '1', String(gelesen));
const leer = await p.evaluate(() => {
  Werkzeuge.meldungenLeeren();
  const zahl = document.querySelector('#btn-glocke .glocke-zahl') as HTMLElement;
  return { versteckt: zahl?.hidden === true,
           beschriftung: document.getElementById('btn-glocke')?.getAttribute('aria-label') || '' };
});
pr('Leeren versteckt die Zahl wieder', leer.versteckt && leer.beschriftung === 'Posteingang',
  JSON.stringify(leer));

console.log('\n4 · Ein Klick öffnet den Posteingang');
await p.click('#btn-glocke');
await p.waitForTimeout(600);
pr('Die Krume zeigt den Posteingang',
  await p.evaluate(() => /Posteingang/.test(document.getElementById('crumb')?.textContent || '')),
  await p.evaluate(() => (document.getElementById('crumb')?.textContent || '').trim()));

console.log('\n5 · Der Konto-Knopf');
const konto = await p.evaluate(() => ({
  da: !!document.getElementById('btn-konto'),
  punktWeg: (document.querySelector('#btn-konto .wolke-punkt') as HTMLElement)?.hidden === true,
  beschriftung: document.getElementById('btn-konto')?.getAttribute('aria-label') || ''
}));
pr('Abgemeldet: kein Punkt, und das aria-label sagt es',
  konto.da && konto.punktWeg && /nicht angemeldet/.test(konto.beschriftung),
  JSON.stringify(konto));
await p.click('#btn-konto');
await p.waitForTimeout(600);
pr('Ein Klick öffnet den Wolke-Dialog',
  await p.evaluate(() => !!document.querySelector('.overlay') &&
    /Wolke|Konto|Anmelden/i.test(document.querySelector('.overlay')?.textContent || '')),
  await p.evaluate(() => (document.querySelector('.overlay')?.textContent || '').slice(0, 80)));
await p.keyboard.press('Escape');

console.log('\n6 · Am Telefon bleiben beide weg');
await p.setViewportSize({ width: 390, height: 844 });
await p.waitForTimeout(400);
const handy = await p.evaluate(() => ({
  glocke: getComputedStyle(document.getElementById('btn-glocke')!).display,
  konto: getComputedStyle(document.getElementById('btn-konto')!).display
}));
pr('Glocke und Konto sind am Telefon ausgeblendet',
  handy.glocke === 'none' && handy.konto === 'none', JSON.stringify(handy));

pr('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await b.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
