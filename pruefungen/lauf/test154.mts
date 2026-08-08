/* Suite 118 — ProseMirror in der Werkstatt: tippt, zeichnet aus, speichert NICHT (RM-7)
 * ============================================================================
 * Der erste ProseMirror-Einsatz, an einem echten Block des Bestands:
 *
 *   1. Der Editor lädt den Blocktext und ist tippbar.
 *   2. Strg B macht fett — als <strong> im Editor-DOM, nicht als Literal.
 *   3. Strg Z nimmt zurück (prosemirror-history läuft).
 *   4. Die Vorschau „So würde gespeichert" folgt live — Konjunktiv.
 *   5. UND DER KERN: der Bestand bleibt unberührt. Der Block in `notizen`
 *      trägt nach allem Tippen denselben Text wie vorher (E78, Regel 1).
 *
 *   node pruefungen/lauf/test154.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8861;

if (!fs.existsSync(path.join(WURZEL, 'dist-neu/app.html')))
  execSync('npx vite build', { cwd: WURZEL, stdio: 'pipe' });

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const ausNeu = rein === '/app.html' || rein.startsWith('/assets/');
  const basis = ausNeu ? path.join(WURZEL, 'dist-neu') : WURZEL;
  const pfad = path.join(basis, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(basis) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
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
const seite = await browser.newPage({ viewport: { width: 900, height: 800 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));

console.log('\n1 · Ein Block entsteht im Bestand');

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
const ids = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  const s = Store.addBlock(null, 'page', { text: 'Werkstattseite' });
  const b = Store.addBlock(s.id, 'text', { text: 'Erster Absatz\nZweiter Absatz' });
  await Store.flush();
  return { block: b.id };
});
p('Der Block steht', !!(ids as any).block);

console.log('\n2 · Der Editor lädt ihn und ist tippbar');

await seite.goto(`http://localhost:${PORT}/app.html#/werkstatt/${(ids as any).block}`);
await seite.waitForTimeout(1800);
const geladen = await seite.evaluate(() => ({
  absaetze: document.querySelectorAll('.tbe .ProseMirror p').length,
  text: (document.querySelector('.tbe .ProseMirror') as HTMLElement | null)?.innerText || '',
  banner: document.body.innerText
}));
gleich('Zwei Absätze aus dem Blocktext', (geladen as any).absaetze, 2);
p('… mit dem echten Inhalt', /Erster Absatz/.test((geladen as any).text));
p('Die Seite sagt gross, dass sie NICHT speichert',
  /speichert\s*nicht/i.test((geladen as any).banner));

await seite.click('.tbe .ProseMirror');
await seite.keyboard.press('End');
await seite.keyboard.type(' — getippt');
await seite.waitForTimeout(300);
const getippt = await seite.evaluate(() =>
  (document.querySelector('[data-vorschau]') as HTMLElement | null)?.textContent || '');
p('Die Vorschau folgt dem Tippen', / — getippt/.test(getippt), getippt.slice(0, 80));

console.log('\n3 · Strg B macht fett, Strg Z nimmt zurück');

await seite.keyboard.press('Control+a');
await seite.keyboard.press('Control+b');
await seite.waitForTimeout(200);
p('Die Auswahl trägt <strong> im Editor-DOM',
  await seite.evaluate(() => !!document.querySelector('.tbe .ProseMirror strong')));

await seite.keyboard.press('Control+z');
await seite.waitForTimeout(200);
p('Strg Z nimmt das Fett zurück',
  await seite.evaluate(() => !document.querySelector('.tbe .ProseMirror strong')));

/* Und weiter zurück bis vor das Tippen — der Verlauf trägt mehr als einen
   Schritt. */
for (let i = 0; i < 12; i++) await seite.keyboard.press('Control+z');
await seite.waitForTimeout(300);
const zurueck = await seite.evaluate(() =>
  (document.querySelector('[data-vorschau]') as HTMLElement | null)?.textContent || '');
p('Der Verlauf reicht bis vor das Tippen zurück',
  !/ — getippt/.test(zurueck), zurueck.slice(0, 80));

console.log('\n4 · Der Bestand ist unberührt — der Kern der Sache');

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2200);
const danach = await seite.evaluate((blockId) =>
  Store.getBlock(blockId)?.text, (ids as any).block);
gleich('Der Block in `notizen` trägt denselben Text wie vorher',
  danach, 'Erster Absatz\nZweiter Absatz');

console.log('\n5 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 118 — ProseMirror-Werkstatt: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
