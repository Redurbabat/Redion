/* Suite 255 — Die Prüfungssimulation bekommt eine Uhr (E248)
 * ============================================================================
 * Der Elektro-Leser der Visionskarte: „eine Prüfungssimulation ohne Uhr
 * ist eine Übung mit strengerer Auflösung." Jetzt tickt sie — und diese
 * Suite lässt sie wirklich ablaufen, mit kleinen Minutenwerten statt
 * verstellter Systemzeit.
 *
 * §1 DIE UHR STEHT IN DER LEISTE und rechnet gegen den Endzeitpunkt
 *    (90 Sekunden je Aufgabe als Vorgabe, Minuten überschreibbar).
 * §2 UNTER EINER MINUTE wird sie knapp — als Wort in der Zahl, die Farbe
 *    kommt nur dazu (§38).
 * §3 LÄUFT SIE AB, wird abgegeben, was da steht: das Ergebnis erscheint
 *    von selbst und sagt, dass die Zeit um war.
 * §4 „NEUE PRÜFUNG" stellt die Uhr neu — die Fläche ist zurück in der
 *    Prüfung, kein stehengebliebenes Ergebnis.
 * ==========================================================================*/
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = 9017;
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
  typeof (globalThis as any).Elektroarbeitsplatz !== 'undefined' &&
  (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
await p.evaluate(() => { Store.setMeta('rundgangGesehen', true); });

console.log('\n1 · Die Uhr steht in der Leiste');
const start = await p.evaluate(() => {
  const alt = document.getElementById('t255'); if (alt) alt.remove();
  const halter = document.createElement('div'); halter.id = 't255';
  document.body.appendChild(halter);
  halter.appendChild((globalThis as any).Elektroarbeitsplatz.pruefungFlaeche(5, 42));
  return {
    uhr: (document.querySelector('#t255 .ea-uhr')?.textContent || '').trim(),
    knapp: !!document.querySelector('#t255 .ea-uhr.ist-knapp')
  };
});
pr('„Noch 7:30" — fünf Aufgaben zu je 90 Sekunden',
  /^Noch 7:(30|29)$/.test(start.uhr), start.uhr);
pr('… und sieben Minuten sind nicht knapp', !start.knapp);

console.log('\n2 · Unter einer Minute wird sie knapp');
await p.evaluate(() => {
  const halter = document.getElementById('t255')!;
  halter.innerHTML = '';
  halter.appendChild((globalThis as any).Elektroarbeitsplatz.pruefungFlaeche(3, 42, 0.5));
});
await p.waitForFunction(() =>
  !!document.querySelector('#t255 .ea-uhr.ist-knapp'), null, { timeout: 10000 });
const knapp = await p.evaluate(() =>
  (document.querySelector('#t255 .ea-uhr')?.textContent || '').trim());
pr('Eine halbe Minute steht knapp da: „Noch 0:…"', /^Noch 0:[0-5]\d$/.test(knapp), knapp);

console.log('\n3 · Läuft sie ab, wird abgegeben, was da steht');
await p.evaluate(() => {
  const halter = document.getElementById('t255')!;
  halter.innerHTML = '';
  halter.appendChild((globalThis as any).Elektroarbeitsplatz.pruefungFlaeche(2, 42, 0.03));
});
await p.waitForFunction(() =>
  !!document.querySelector('#t255 .ea-ergebnis'), null, { timeout: 15000 });
const ablauf = await p.evaluate(() => ({
  zeitaus: (document.querySelector('#t255 .ea-zeitaus')?.textContent || '').trim(),
  kopf: (document.querySelector('#t255 .ea-ergebnis h3')?.textContent || '').trim(),
  saat: (document.querySelector('#t255 .ea-saat code')?.textContent || '').trim()
}));
pr('Das Ergebnis erscheint von selbst und sagt, dass die Zeit um war',
  /Die Zeit war um/.test(ablauf.zeitaus) && /von 2 richtig/.test(ablauf.kopf),
  JSON.stringify(ablauf));
pr('Der Startwert steht weiterhin dabei — die Prüfung bleibt wiederholbar',
  ablauf.saat === '42', ablauf.saat);

console.log('\n4 · „Neue Prüfung" stellt die Uhr neu');
await p.click('#t255 [data-a="neu"]');
await p.waitForTimeout(400);
const danach = await p.evaluate(() => ({
  ergebnisWeg: !document.querySelector('#t255 .ea-ergebnis'),
  uhrDa: !!document.querySelector('#t255 .ea-uhr'),
  aufgabe: (document.querySelector('#t255 .ea-fortschritt')?.textContent || '').trim()
}));
pr('Die Fläche ist zurück in der Prüfung, mit Uhr und Aufgabe 1',
  danach.ergebnisWeg && danach.uhrDa && /Aufgabe 1 von 2/.test(danach.aufgabe),
  JSON.stringify(danach));

pr('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await b.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
