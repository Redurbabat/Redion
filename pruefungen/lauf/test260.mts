/* Suite 260 — Der Graph bekommt ein Suchfeld (E253)
 * ============================================================================
 * Der Wissensgraph zeigte nur, was um den Mittelpunkt liegt. Wer eine
 * BESTIMMTE Seite im Geflecht suchte, musste sie erst im Editor öffnen
 * und den Graphen neu aufmachen. Jetzt: ein Suchfeld in der Kopfleiste
 * des Graphen — tippen listet Treffer aus dem GANZEN Index (nicht nur
 * dem sichtbaren Ausschnitt), ein Klick oder Enter springt hin und
 * macht den Treffer zum neuen Mittelpunkt.
 *
 * §1 DAS FELD steht da, beschriftet (§38).
 * §2 TIPPEN listet Treffer aus dem ganzen Index — auch solche, die im
 *    aktuellen Ausschnitt nicht liegen.
 * §3 EIN KLICK springt: der Treffer wird Mittelpunkt, die Karte sagt es.
 * §4 ENTER nimmt den ersten Treffer.
 * §5 ESCAPE IM FELD leert erst die Suche — der Graph bleibt offen;
 *    das zweite Escape schliesst ihn (§38: kein Überraschungs-Zuschlag).
 * §6 KEIN TREFFER sagt es ehrlich (§47).
 *
 *   node pruefungen/lauf/test260.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9026;

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
const seite = await browser.newPage({ viewport: { width: 1400, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' && typeof App !== 'undefined' &&
  (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
await seite.evaluate(() => { Store.setMeta('rundgangGesehen', true); });

/* Zwei verbundene Seiten und eine ferne dritte: „Gamma-Zielseite" hängt
   NICHT am Alpha-Teilgraphen — genau sie muss die Suche finden. */
await seite.evaluate(async () => {
  const alpha = Store.addPage(null, { text: 'Alpha-Startseite' });
  Store.addPage(null, { text: 'Beta-Nachbar' });
  Store.addBlock(alpha.id, 'p', { text: 'Siehe [[Beta-Nachbar]]' });
  Store.addPage(null, { text: 'Gamma-Zielseite' });
  await Store.flush();
  App.oeffne(alpha.id);
});
await seite.waitForTimeout(800);
await seite.evaluate(() => { (globalThis as any).Links.graph(); });
await seite.waitForTimeout(900);

console.log('\n1 · Das Suchfeld steht in der Kopfleiste des Graphen');
const feld = await seite.evaluate(() => {
  const eingabe = document.querySelector<HTMLInputElement>('.graph-overlay [data-graph-suche]');
  return { da: !!eingabe, art: eingabe?.type || '',
           beschriftet: !!(eingabe?.getAttribute('aria-label') || '').trim() };
});
p('Ein beschriftetes Suchfeld ist da', feld.da && feld.beschriftet, JSON.stringify(feld));

console.log('\n2 · Tippen listet Treffer aus dem ganzen Index');
const vorher = await seite.evaluate(() =>
  (document.querySelector('.graph-panel') as HTMLElement)?.textContent || '');
p('Vor der Suche steht Gamma nicht im Ausschnitt', !vorher.includes('Gamma-Zielseite'),
  vorher.slice(0, 120));
await seite.fill('.graph-overlay [data-graph-suche]', 'Gamma');
await seite.waitForTimeout(400);
const treffer = await seite.evaluate(() => {
  const knopf = document.querySelector<HTMLElement>('.graph-panel [data-graph-ziel]');
  return { da: !!knopf, name: (knopf?.textContent || '').trim() };
});
p('Der Treffer „Gamma-Zielseite" steht in der Liste',
  treffer.da && treffer.name.includes('Gamma-Zielseite'), JSON.stringify(treffer));

console.log('\n3 · Ein Klick springt zum Treffer');
await seite.click('.graph-panel [data-graph-ziel]');
await seite.waitForTimeout(500);
const karte = await seite.evaluate(() => ({
  kopf: (document.querySelector('.graph-panel h2') as HTMLElement)?.textContent || '',
  mittelpunkt: /Mittelpunkt/.test(
    (document.querySelector('.graph-panel') as HTMLElement)?.textContent || '')
}));
p('Die Karte zeigt die Zielseite als neuen Mittelpunkt',
  karte.kopf.includes('Gamma-Zielseite') && karte.mittelpunkt, JSON.stringify(karte));

console.log('\n4 · Enter nimmt den ersten Treffer');
await seite.fill('.graph-overlay [data-graph-suche]', 'Beta');
await seite.waitForTimeout(300);
await seite.press('.graph-overlay [data-graph-suche]', 'Enter');
await seite.waitForTimeout(500);
p('Enter springt zu „Beta-Nachbar"',
  await seite.evaluate(() =>
    ((document.querySelector('.graph-panel h2') as HTMLElement)?.textContent || '')
      .includes('Beta-Nachbar')),
  await seite.evaluate(() =>
    (document.querySelector('.graph-panel h2') as HTMLElement)?.textContent || ''));

console.log('\n5 · Escape im Feld leert erst die Suche');
await seite.fill('.graph-overlay [data-graph-suche]', 'Alpha');
await seite.waitForTimeout(300);
await seite.press('.graph-overlay [data-graph-suche]', 'Escape');
await seite.waitForTimeout(300);
const nachEinmal = await seite.evaluate(() => ({
  offen: !!document.querySelector('.graph-overlay'),
  wert: (document.querySelector('.graph-overlay [data-graph-suche]') as HTMLInputElement)?.value ?? '(weg)'
}));
p('Das erste Escape leert das Feld, der Graph bleibt offen',
  nachEinmal.offen && nachEinmal.wert === '', JSON.stringify(nachEinmal));
await seite.press('.graph-overlay [data-graph-suche]', 'Escape');
await seite.waitForTimeout(300);
p('Das zweite Escape schliesst den Graphen',
  await seite.evaluate(() => !document.querySelector('.graph-overlay')));

console.log('\n6 · Kein Treffer sagt es ehrlich');
await seite.evaluate(() => { (globalThis as any).Links.graph(); });
await seite.waitForTimeout(700);
await seite.fill('.graph-overlay [data-graph-suche]', 'Xyzzy-gibt-es-nicht');
await seite.waitForTimeout(400);
p('Die leere Trefferliste sagt, wonach gesucht wurde (§47)',
  await seite.evaluate(() => {
    const t = (document.querySelector('.graph-panel') as HTMLElement)?.textContent || '';
    return /[Nn]ichts gefunden|[Kk]ein Treffer/.test(t) && t.includes('Xyzzy');
  }),
  await seite.evaluate(() =>
    ((document.querySelector('.graph-panel') as HTMLElement)?.textContent || '').slice(0, 140)));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await browser.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
