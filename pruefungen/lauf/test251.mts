/* Suite 251 — Seitenzahlen und Kopfzeile beim Drucken (E244)
 * ============================================================================
 * AUFGABEN.md nannte es den „sichtbarsten Unterschied zu Word für
 * abzugebende Berichte": der Ausdruck hatte keine Seitenzahlen, keine
 * Kopfzeile, kein Datum. Jetzt leben sie in @page-Randkästen.
 *
 * §1 DER DRUCKRAHMEN TRÄGT DIE REGELN: counter(page) im Fusskasten, Titel
 *    und Datum oben, die erste Seite ohne Kopf (der H1 steht dort schon),
 *    und ein Titel mit Anführungszeichen und Backslash sprengt die
 *    CSS-content-Zeichenkette nicht.
 * §2 ECHTE BYTES, RUNDGELESEN: derselbe Rahmen wird per Chromium zu einem
 *    echten PDF gedruckt, das PDF wird in Redion EINGELESEN (derselbe Weg
 *    wie jedes Schul-Skript), und der Suchtext der zweiten Seite muss
 *    „Seite 2 von" und den Titel aus der Kopfzeile tragen. Redion liest
 *    seinen eigenen Ausdruck.
 * ==========================================================================*/
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = 9011;
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
await p.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
});

console.log('\n1 · Der Druckrahmen trägt Kopf, Datum und Seitenzähler');
/* Der Titel ist absichtlich gemein: Anführungszeichen und Backslash. */
const druckDoc = await p.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Bericht "Q3" \\ Schluss' });
  for (let i = 1; i <= 100; i++)
    Store.addBlock(s.id, 'p', { text: 'Absatz ' + i + ': Der Prüfbericht beschreibt ' +
      'die Messreihe am Ohmschen Widerstand und die daraus errechnete Leistung.' });
  const vorher = document.querySelectorAll('iframe').length;
  const fertig = new Promise<string>(loese => {
    const beobachter = new MutationObserver(() => {
      const rahmen = [...document.querySelectorAll('iframe')];
      if (rahmen.length <= vorher) return;
      const d = (rahmen[rahmen.length - 1] as HTMLIFrameElement).contentDocument;
      if (d && d.body && d.body.innerHTML) {
        beobachter.disconnect();
        loese(d.documentElement.outerHTML);
      }
    });
    beobachter.observe(document.body, { childList: true, subtree: true });
  });
  Werkzeuge.drucken(Store.getBlock(s.id));
  return Promise.race([fertig, new Promise<string>(l => setTimeout(() => l(''), 15000))]);
});

pr('Es gibt ein Druckdokument', druckDoc.length > 500, druckDoc.length + ' Zeichen');
pr('Der Fusskasten zählt: „Seite " counter(page) " von " counter(pages)',
  /@bottom-center\{content:"Seite " counter\(page\) " von " counter\(pages\)/.test(druckDoc));
pr('Der Titel steht oben links — mit escaptem " und \\',
  druckDoc.includes('@top-left{content:"Bericht \\"Q3\\" \\\\ Schluss"'),
  (druckDoc.match(/@top-left\{[^}]{0,60}/) || ['(kein top-left)'])[0]);
pr('Das Datum steht oben rechts (Tag. Monat Jahr)',
  /@top-right\{content:"\d{1,2}\. [A-ZÄÖÜ][a-zä]+ \d{4}"/.test(druckDoc),
  (druckDoc.match(/@top-right\{[^}]{0,60}/) || ['(kein top-right)'])[0]);
pr('Die erste Seite trägt keinen Kopf — dort steht der H1',
  /@page:first\{@top-left\{content:none\}@top-right\{content:none\}\}/.test(druckDoc));
pr('Der Rand wohnt in @page, der body hat keinen zweiten (margin:0)',
  /@page\{size:A4;margin:20mm 18mm 22mm/.test(druckDoc) && /body\{[^}]*margin:0/.test(druckDoc));

console.log('\n2 · Echte Bytes: Redion liest seinen eigenen Ausdruck');
const druckSeite = await b.newPage();
await druckSeite.setContent(druckDoc, { waitUntil: 'load' });
const pdfBytes = await druckSeite.pdf({ preferCSSPageSize: true });
await druckSeite.close();
pr('Der Druck ergibt ein echtes PDF', pdfBytes.subarray(0, 5).toString() === '%PDF-',
  pdfBytes.subarray(0, 8).toString());
pr('… mit mehr als einer Seite (sonst prüft §2 nichts)',
  (pdfBytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length >= 2,
  String((pdfBytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length));

await p.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Kontrolle' });
  App.oeffne(s.id);
});
await p.waitForFunction(() => !!document.getElementById('scroll'));
await p.evaluate((hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], 'ausdruck.pdf', { type: 'application/pdf' }));
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, pdfBytes.toString('hex'));
await p.waitForSelector('.overlay [data-w="untereinander"]', { timeout: 20000 });
await p.click('.overlay [data-w="untereinander"]');
await p.waitForFunction(() => (Object.values(Store.cache.blocks || {}) as any[])
  .filter(b => b.type === 'pdfseite' && b.alive && b.bildDateiId).length >= 2,
  null, { timeout: 90000 });

const seiten = await p.evaluate(() =>
  (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive)
    .sort((a, b2) => a.nr - b2.nr)
    .map(b => String(b.suchtext || '')));

pr('Seite 1 trägt ihre Nummer im Fuss: „Seite 1 von N"',
  /Seite 1 von \d+/.test(seiten[0] || ''), (seiten[0] || '').slice(0, 120));
pr('Seite 2 auch: „Seite 2 von N"',
  /Seite 2 von \d+/.test(seiten[1] || ''), (seiten[1] || '').slice(0, 120));
pr('Seite 2 trägt den Titel als Kopfzeile',
  /Bericht "Q3" \\ Schluss/.test(seiten[1] || ''), (seiten[1] || '').slice(0, 160));
pr('Seite 1 trägt den Titel als H1 (nicht doppelt gemogelt: §1 hat den Kopf dort abgeschaltet)',
  /Bericht "Q3" \\ Schluss/.test(seiten[0] || ''), (seiten[0] || '').slice(0, 160));

pr('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await b.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
