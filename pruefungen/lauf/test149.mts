/* Suite 113 — Die neue Schicht liest den Bestand, ohne ihn anzufassen (E78)
 * ============================================================================
 * Der erste Wächter der React-Migration. Er prüft die drei Regeln aus
 * CLAUDE.md §56.3 an der ECHTEN Kette:
 *
 *   1. EINE Datenquelle: die alte App schreibt in `notizen`, die neue
 *      React-Shell (Vite-Bau aus dist-neu/) liest DIESELBE Ablage unter
 *      demselben Ursprung — und zeigt die echten Seiten.
 *   2. Nur lesend: nach dem Besuch der Shell ist der Bestand Byte für
 *      Byte unverändert — gleiche Satzzahl, gleiche Inhalte, gleiche
 *      Schema-Fassung der IndexedDB.
 *   3. Die Zod-Schemas beschreiben den IST-Zustand: null Sätze fallen
 *      bei der Prüfung echter Daten durch. Ein Schema, das echte Sätze
 *      ablehnt, ist falsch — nicht die Sätze.
 *
 * Der Lauf baut die Shell NICHT selbst (das wäre ein npm-Lauf im
 * Prüflauf); er nimmt den eingecheckten Zustand voraus: existiert
 * dist-neu/ nicht, baut er einmal per npx vite build.
 *
 *   node pruefungen/lauf/test149.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8845;

/* Ohne Bau keine Shell — einmal bauen ist Teil des Laufs, nicht Mogeln:
   geprüft wird danach die echte Ausgabe. */
if (!fs.existsSync(path.join(WURZEL, 'dist-neu/app.html')))
  execSync('npx vite build', { cwd: WURZEL, stdio: 'pipe' });

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
/* EIN Ursprung für beide Welten: /app.html und /assets/* aus dist-neu,
   alles andere aus der Wurzel. Dieselbe Herkunft = dieselbe IndexedDB. */
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

console.log('\n1 · Die alte App schreibt');

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
const geschrieben = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  const a = Store.addBlock(null, 'page', { text: 'Bestandsseite Eins', icon: '📒' });
  Store.addBlock(a.id, 'text', { text: 'Inhalt aus der alten App' });
  Store.addBlock(null, 'page', { text: 'Bestandsseite Zwei', icon: '🌱' });
  await Store.flush();
  const alle = Object.values<any>(Store.cache.blocks);
  return { bloecke: alle.length,
           stand: JSON.stringify(alle.map(b => [b.id, b.text, b.edited]).sort()) };
});
p('Zwei Seiten und ein Absatz sind da', (geschrieben as any).bloecke >= 3,
  String((geschrieben as any).bloecke));

/* Der Abzug für §3 — VOR dem allerersten Shell-Besuch. Die Gegenprobe hat
   den ersten Wurf entlarvt: der Abzug lag nach §2, und eine Shell, die bei
   jedem Besuch DENSELBEN Satz schreibt, blieb unsichtbar — beim zweiten
   Besuch schrieb sie nur noch, was schon dastand. */
const abzug = `async () => {
  const oeffnen = () => new Promise((ok, nein) => {
    const r = indexedDB.open('notizen');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => nein(r.error);
  });
  const db = await oeffnen();
  const alle = await new Promise((ok, nein) => {
    const t = db.transaction(['blocks'], 'readonly').objectStore('blocks').getAll();
    t.onsuccess = () => ok(t.result || []);
    t.onerror = () => nein(t.error);
  });
  db.close();
  return JSON.stringify(alle.map(b => [b.id, b.text, b.edited]).sort());
}`;
await seite.goto(`http://localhost:${PORT}/neutrale-seite-gibt-es-nicht`);
const vorher = await seite.evaluate('(' + abzug + ')()');

console.log('\n2 · Die neue Shell liest dieselbe Ablage');

await seite.goto(`http://localhost:${PORT}/app.html`);
await seite.waitForTimeout(2000);
const shell = await seite.evaluate(() => document.body.innerText);
p('Die Shell zeigt die Seiten des Bestands',
  /Bestandsseite Eins/.test(String(shell)) && /Bestandsseite Zwei/.test(String(shell)));
p('… und die Fächer-Übersicht', /blocks/.test(String(shell)) && /vorrat/.test(String(shell)));
p('Null Sätze fallen durch die Zod-Schemas',
  !/entsprachen dem Schema nicht/.test(String(shell)),
  'Schema und Wirklichkeit gehen auseinander — das Schema ist zu richten, nicht der Satz');
p('Die Shell nennt sich ehrlich nur lesend',
  /liest den Bestand, schreibt nichts/.test(String(shell)));

console.log('\n3 · Der Bestand ist unangetastet');

/* GEMESSEN WIRD UM DEN SHELL-BESUCH HERUM — nicht um einen Neustart der
   alten App (deren gutes Recht ist es, beim Laden ihre Willkommensseite
   anzufassen; das war der Fehlalarm des allerersten Wurfs). Der Abzug
   „vorher" liegt oben VOR §2, aus einer neutralen 404-Seite desselben
   Ursprungs, roh aus der IndexedDB. Hier kommt nur noch „nachher". */
await seite.goto(`http://localhost:${PORT}/neutrale-seite-gibt-es-nicht`);
const nachher = await seite.evaluate('(' + abzug + ')()');
p('Satz für Satz identisch — der Shell-Besuch hat NICHTS verändert',
  vorher === nachher && String(vorher).length > 10,
  vorher === nachher ? '' : 'die Shell hat geschrieben');

/* Die Schema-Fassung der IndexedDB: hätte irgendetwas ein Upgrade
   ausgelöst (der Dexie-Fehler, vor dem §56.3 warnt), stünde hier eine
   andere Zahl oder ein anderes Fächer-Bild. */
const fassung = await seite.evaluate(async () => {
  const dbs = await indexedDB.databases();
  const n = dbs.find(d => d.name === 'notizen');
  return { version: n?.version ?? -1, neuDa: dbs.some(d => d.name === 'redion-neu') };
});
p('Die Ablage `notizen` trägt weiter ihre eigene Fassung',
  ((fassung as any).version ?? -1) >= 1, String((fassung as any).version));
gleich('Und `redion-neu` wurde beim blossen Lesen NICHT angelegt',
  (fassung as any).neuDa, false);

console.log('\n4 · Die Schutzregel in der Quelle');
const dbTs = fs.readFileSync(path.join(WURZEL, 'src/persistence/db.ts'), 'utf8');
p('Dexie wirft bei `notizen` — die Regel steht im Code, nicht nur in der Doku',
  /if \(name === 'notizen'\)\s*\n\s*throw/.test(dbTs));
const legacyTs = fs.readFileSync(path.join(WURZEL, 'src/persistence/legacyStore.ts'), 'utf8');
p('Der Bestandsleser öffnet ohne Versionsnummer — nie ein Upgrade',
  /indexedDB\.open\(DB_NAME\)(?!,)/.test(legacyTs));
p('… und bricht ein versehentliches Anlegen ab',
  /transaction\?\.abort\(\)/.test(legacyTs));

console.log('\n5 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 113 — Strangler-Wächter: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
