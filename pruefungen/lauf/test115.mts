/* Suite 79 — Die Begrüssung kommt einmal, das Neue kommt, wenn es neu ist
 * ============================================================================
 * DER FEHLER, DER DAZU FÜHRTE. „Neu hier? Neun Schritte durch das Wichtigste"
 * stand bei JEDEM Öffnen wieder da. Die Marke `rundgangGesehen` wurde nämlich
 * nur gesetzt, wenn jemand auf das ✕ klickte — wer den Hinweis einfach stehen
 * liess und die Seite neu lud, bekam ihn wieder. Und wieder.
 *
 * Gemeint war eine Begrüssung. Was daraus wurde, war eine Ermahnung: „du bist
 * neu hier", jedes Mal, monatelang.
 *
 * WAS JETZT GILT — und was dieser Lauf misst:
 *
 *   1. Beim ERSTEN Öffnen kommt die Begrüssung.
 *   2. Beim ZWEITEN kommt sie nicht mehr. Gezeigt ist gesehen.
 *   3. Und auch sonst nichts: wer gerade erst anfängt, hat nichts verpasst.
 *      Ein Kasten „Neu in Redion" mit allem, was je dazukam, wäre für ihn
 *      keine Neuigkeit, sondern die App.
 *   4. Kommt SPÄTER etwas dazu, erscheint es — und zwar alles, was seit dem
 *      letzten Mal dazukam, nicht nur das Neueste. Wer Redion drei Monate
 *      nicht geöffnet hat, soll nicht drei Monate verpassen.
 *   5. Danach wieder nichts, bis das nächste Mal etwas dazukommt.
 *
 * WARUM DAS EIN EIGENER LAUF IST. Der Fehler war nicht zu sehen, er war zu
 * ERLEBEN — man musste die Seite zweimal öffnen. Genau solche Fehler bleiben
 * jahrelang liegen: beim Entwickeln lädt man ohnehin dauernd neu und hält es
 * für normal.
 *
 *   node pruefungen/lauf/test115.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8795;

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
/* EIN FRISCHER ZUSAMMENHANG — sonst bringt der Lauf die Marken eines
   früheren mit und misst nichts. */
const kontext = await browser.newContext();
const seite = await kontext.newPage();

type Stand = { gruss: boolean; neu: boolean; marke: unknown; gesehen: unknown; eintraege: number };
/* `gruss` MISST SEIT E55 DAS WILLKOMMEN. Bis dahin war die Begrüssung eine
   kleine Einladung unten links; jetzt ist es ein Blatt mit drei Wegen, das
   sagt, was Redion ist und wohin die Daten gehören. Die Frage dieses Laufs
   ist dieselbe geblieben, und sie ist die eigentliche: kommt sie ein
   zweites Mal? Eine Begrüssung, die bei jedem Öffnen erscheint, ist eine
   Ermahnung — und beim Willkommen wäre sie eine, die den ganzen Bildschirm
   nimmt. Die Einladung zählt weiter mit: sie gibt es noch, und käme sie
   statt des Willkommens, wäre auch das eine Begrüssung. */
const nachsehen = async (): Promise<Stand> => seite.evaluate(() => ({
  gruss: !!document.getElementById('rg-willkommen') ||
         !!document.getElementById('rg-einladung'),
  neu: !!document.getElementById('rg-neu'),
  marke: Store.getMeta('rundgangGesehen', false),
  gesehen: Store.getMeta('neuerungenGesehen', 0),
  eintraege: document.querySelectorAll('#rg-neu .rgn-eintrag').length
})) as Promise<Stand>;

console.log('\n1 · Beim ersten Öffnen wird begrüsst');

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(3200);
const erst = await nachsehen();
p('Die Begrüssung steht da', erst.gruss);
p('… und sie sagt, wo die Daten liegen',
  await seite.evaluate(() =>
    /auf deinem Ger\u00e4t/.test(document.getElementById('rg-willkommen')?.textContent || '')));
p('Und sie ist damit als gesehen vermerkt', erst.marke === true, String(erst.marke));

console.log('\n2 · Beim zweiten Öffnen nicht mehr');

await seite.reload();
await seite.waitForTimeout(3200);
const zweit = await nachsehen();
p('Die Begrüssung kommt nicht wieder', !zweit.gruss,
  'genau das war der Fehler: sie kam bei jedem Öffnen');
/* Der zweite Teil derselben Frage. Ohne ihn wäre die Begrüssung zwar weg,
   aber an ihrer Stelle stünde ein Kasten mit allem, was je dazukam — für
   jemanden, der gestern angefangen hat. */
p('Und auch kein „Neu in Redion"', !zweit.neu,
  'wer gerade erst anfängt, hat nichts verpasst');
p('Der Stand ist auf dem Neuesten', Number(zweit.gesehen) > 0, String(zweit.gesehen));

console.log('\n3 · Beim dritten auch nicht');

await seite.reload();
await seite.waitForTimeout(3200);
const dritt = await nachsehen();
p('Weiterhin nichts', !dritt.gruss && !dritt.neu);

console.log('\n4 · Kommt etwas dazu, wird es gezeigt');

/* So tun, als hätte dieses Gerät nur den ersten Eintrag gesehen. Genau das
   passiert im Betrieb, wenn eine neue Fassung dazukommt. */
const hoechste = await seite.evaluate(() =>
  Rundgang.NEUERUNGEN.reduce((h: number, n: any) => Math.max(h, n.nr), 0)) as number;
p('Es gibt überhaupt Einträge', hoechste >= 2, String(hoechste));

await seite.evaluate(() => Store.setMeta('neuerungenGesehen', 1));
await seite.reload();
await seite.waitForTimeout(3200);
const nach = await nachsehen();
p('Der Kasten „Neu in Redion" erscheint', nach.neu);
/* ALLES SEIT DEM LETZTEN MAL, nicht nur das Neueste. Wer lange nicht da
   war, soll nicht das Meiste verpassen. */
p('Und zeigt alles seit dem letzten Mal', nach.eintraege === hoechste - 1,
  nach.eintraege + ' von ' + (hoechste - 1));
p('Die Begrüssung bleibt weg', !nach.gruss);

console.log('\n5 · Und danach wieder Ruhe');

await seite.reload();
await seite.waitForTimeout(3200);
const ruhe = await nachsehen();
p('Nichts mehr, bis das nächste Mal etwas dazukommt', !ruhe.neu && !ruhe.gruss);

console.log('\n6 · Wer die Führung will, findet sie weiterhin');

const erreichbar = await seite.evaluate(() =>
  typeof Rundgang?.start === 'function' && typeof Rundgang?.uebersicht === 'function') as boolean;
p('Rundgang.start und die Übersicht gibt es', erreichbar,
  'sonst wäre der Weg zurück zur Führung zu — und das Wegklicken endgültig');

await browser.close();
server.close();

console.log(`\n  Suite 79 — Begrüssung und Neuerungen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
