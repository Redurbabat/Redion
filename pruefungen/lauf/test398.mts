/* Suite 398 — Der Favoritenblock war immer leer (E402, L128 Punkt 3)
 * ============================================================================
 * Der Bildschirm „Seiten und Notizen" hat einen Abschnitt „Favoriten". Er
 * filterte `alle.filter(b => b.fav)` — das Feld heisst `favorite`. Die Liste
 * war deshalb IMMER leer, und weil ein leerer Abschnitt ganz weggelassen
 * wird, sah man nicht einmal, dass etwas fehlte.
 *
 *   §1 Ein Favorit steht wirklich unter „Favoriten".
 *   §2 Ohne Favoriten steht die Überschrift nicht da (das war schon richtig).
 *   §3 Der Abschnitt fragt den KATALOG, nicht ein Feld — Zeilen und
 *      Systemseiten kommen nicht hinein.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja: `b.fav` zurückgeschrieben, und §1 fällt. Genau so stand es vier Bögen
 * lang im Code, ohne dass ein Lauf es merkte.
 *
 *   node pruefungen/lauf/test398.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Ansichten: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9429;

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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];
const seite = await browser.newPage({ viewport: { width: 1360, height: 900 } });
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);
await seite.evaluate(`(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
})()`);

const oeffne = async (): Promise<void> => {
  await seite.evaluate(`Ansichten.seiten()`);
  await seite.waitForTimeout(700);
};
/* Die Überschriften des Bildschirms, in der Reihenfolge, in der sie stehen. */
const ueberschriften = async (): Promise<string[]> => await seite.evaluate(`(() =>
  Array.from(document.querySelectorAll('.home h2')).map(h => h.textContent.trim()))()`) as string[];
/* Die Einträge UNTER einer bestimmten Überschrift. */
const unter = async (titel: string): Promise<string[]> =>
  await seite.evaluate((t: string) => {
    const h = Array.from(document.querySelectorAll('.home h2'))
      .find(x => (x.textContent || '').trim() === t);
    const liste = h && h.nextElementSibling;
    if (!liste) return [];
    return Array.from(liste.querySelectorAll('button .pt'))
      .map(e => (e.textContent || '').trim());
  }, titel) as string[];

/* ==========================================================================
 * §2 zuerst · OHNE FAVORITEN STEHT DIE ÜBERSCHRIFT NICHT DA
 * --------------------------------------------------------------------------
 * Das war schon vorher richtig und ist der Grund, warum niemand etwas
 * merkte. Der Punkt steht ZUERST, damit klar ist: der Fehler war nicht die
 * fehlende Überschrift, sondern die immer leere Liste dahinter.
 * ======================================================================== */
console.log('\n1 · Ohne Favoriten fehlt die Überschrift — und das ist richtig');
await oeffne();
const u0 = await ueberschriften();
p('Der Bildschirm steht da', u0.length > 0, 'keine Überschrift gefunden');
p('„Favoriten" steht NICHT da', u0.indexOf('Favoriten') < 0, u0.join(' · '));

/* ==========================================================================
 * §2 · EIN FAVORIT STEHT WIRKLICH DARUNTER
 * ======================================================================== */
console.log('\n2 · Ein Favorit steht wirklich unter „Favoriten"');
await seite.evaluate(`(async () => {
  const s = Store.addPage(null, { text: 'Mein Merkzettel', icon: '⭐' });
  Store.updateBlock(s.id, { favorite: true });
  Store.addPage(null, { text: 'Gewöhnliche Seite', icon: '📄' });
  await Store.flush();
})()`);
await oeffne();
const u1 = await ueberschriften();
p('Jetzt steht „Favoriten" da', u1.indexOf('Favoriten') >= 0, u1.join(' · '));
gleich('Und der Favorit steht darunter', await unter('Favoriten'), ['Mein Merkzettel']);
p('Die gewöhnliche Seite steht NICHT darunter',
  (await unter('Favoriten')).indexOf('Gewöhnliche Seite') < 0);

/* GEGENPROBE: der Bildschirm fragt den KATALOG. `Store.favorites()` muss
   dieselbe Seite nennen — sonst hätte der Bildschirm wieder einen eigenen
   Filter, und genau das war der Fehler (§8). */
const ausKatalog = await seite.evaluate(`(() =>
  (Store.favorites() || []).map(b => b.text))()`) as string[];
gleich('Der Katalog sagt dasselbe', ausKatalog, ['Mein Merkzettel']);

/* ==========================================================================
 * §3 · ZEILEN UND SYSTEMSEITEN KOMMEN NICHT HINEIN
 * --------------------------------------------------------------------------
 * Der Bildschirm schneidet den Katalog mit seiner eigenen Menge: keine
 * Datenbankzeilen, keine Systemseiten. Ohne diesen Schnitt stünde eine
 * angesternte Datenbankzeile zwischen den Seiten.
 * ======================================================================== */
console.log('\n3 · Eine angesternte Datenbankzeile bleibt draussen');
await seite.evaluate(`(async () => {
  const db = Store.addCollection ? Store.addCollection({ name: 'Aufgaben' }) : null;
  if (db) {
    const z = Store.addBlock(db.id, 'page', { text: 'Eine Zeile' });
    Store.updateBlock(z.id, { parentTable: 'collection', favorite: true });
  }
  await Store.flush();
})()`);
await oeffne();
const f3 = await unter('Favoriten');
gleich('Unter „Favoriten" steht weiterhin nur die Seite', f3, ['Mein Merkzettel']);
p('Die Zeile ist nicht dabei', f3.indexOf('Eine Zeile') < 0, f3.join(' · '));

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.join(' · '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
