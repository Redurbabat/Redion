/* Suite 114 — RM-4 an echten Daten: Abschrift, nachgerechnet (E78)
 * ============================================================================
 * test149 hat bewiesen, dass die neue Schicht den Bestand liest, ohne ihn
 * anzufassen. Dieser Lauf geht den nächsten Schritt: die ECHTE Migration —
 * der gebaute Code aus dist-neu/, nicht eine Abschrift davon (E73) —
 * kopiert einen echten Bestand nach `redion-neu` und rechnet ihn nach.
 *
 * Der Bestand hier ist absichtlich kein Spielzeug: Seiten, eine Datenbank
 * mit Zeilen, eine Datei MIT Stücken (der `dateiId`-Fall, der beim
 * L14-Messen den Feldnamen-Fehler fand), Meta-Einträge.
 *
 * Und die drei Fragen, die zählen:
 *   1. Ist die Abschrift deckungsgleich — Satz für Satz, Byte für Byte?
 *   2. Ist `notizen` danach unverändert (die Migration LIEST nur)?
 *   3. Fällt eine manipulierte Abschrift auf (Gegenprobe im Lauf selbst)?
 *
 *   node pruefungen/lauf/test150.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8853;

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

console.log('\n1 · Ein echter Bestand entsteht');

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
const bestand = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  const s = Store.addBlock(null, 'page', { text: 'Migrationsseite', icon: '🧳' });
  Store.addBlock(s.id, 'text', { text: 'Ein Absatz' });
  const db = Store.addDatabase(s.id, 'Umzugsgut', {
    title: { name: 'Titel', type: 'title' },
    zahl:  { name: 'Zahl',  type: 'number' }
  }, 'table');
  const z = Store.addRow(db.collectionId, { zahl: 42 });
  Store.updateBlock(z.id, { text: 'Zeile Eins' });
  const b = Store.addBlock(s.id, 'file', { text: 'daten.bin' });
  const bytes = new Uint8Array(3 * 1048576);
  for (let i = 0; i < bytes.length; i++) bytes[i] = i % 251;
  const satz = await Dateien.ablegen(new File([bytes], 'daten.bin',
    { type: 'application/octet-stream' }), { blockId: b.id });
  Store.updateBlock(b.id, { dateiId: satz.id });
  await (Store as any).versionSpeichern(s.id, 'hand');
  await Store.flush();
  return { dateiId: satz.id };
});
p('Der Bestand steht (Seite, Datenbank, Datei mit Stücken, Fassung)',
  !!(bestand as any).dateiId);

/* Der Abzug VOR der Migration — roh, aus einer neutralen Seite. */
const abzug = `async () => {
  const oeffnen = () => new Promise((ok, nein) => {
    const r = indexedDB.open('notizen');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => nein(r.error);
  });
  const db = await oeffnen();
  const raus = {};
  for (const fach of [...db.objectStoreNames]) {
    raus[fach] = await new Promise((ok, nein) => {
      const t = db.transaction([fach], 'readonly').objectStore(fach).getAll();
      t.onsuccess = () => ok((t.result || []).map(s =>
        JSON.stringify(s, (k, v) => v && v.constructor === Blob ? '[blob:' + v.size + ']' : v)).sort());
      t.onerror = () => nein(t.error);
    });
  }
  db.close();
  return JSON.stringify(raus);
}`;
await seite.goto(`http://localhost:${PORT}/neutrale-seite`);
const vorher = await seite.evaluate('(' + abzug + ')()');
p('Der Abzug trägt etwas', String(vorher).length > 500, String(vorher).length + ' Zeichen');

console.log('\n2 · Die echte Migration läuft — der gebaute Code');

await seite.goto(`http://localhost:${PORT}/app.html`);
await seite.waitForTimeout(1500);
const erg = await seite.evaluate(async () => {
  const M = (window as any).RedionMigration;
  if (!M) return { fehlt: true };
  const db = new M.RedionDb();
  const { kopie, vergleich } = await M.migrateAndVerify(db);
  return { fehlt: false, kopie, vergleich };
});
p('Die Migration ist im Bau erreichbar', (erg as any).fehlt !== true);
const v = (erg as any).vergleich;
gleich('Der Vergleich sagt: deckungsgleich', v?.gleich, true);
p('Er hat wirklich Sätze geprüft', (v?.geprueft ?? 0) > 10, String(v?.geprueft));
p('… und die Stücke Byte für Byte', (v?.blobsGeprueft ?? 0) >= 3, String(v?.blobsGeprueft));
p('Die Fächer stimmen in der Zahl überein',
  v && Object.values(v.faecher as Record<string, { alt: number; neu: number }>)
        .every(f => f.alt === f.neu),
  JSON.stringify(v?.faecher));

console.log('\n3 · Gegenprobe im Lauf: eine verfälschte Abschrift fällt auf');

const gegen = await seite.evaluate(async () => {
  const M = (window as any).RedionMigration;
  const db = new M.RedionDb();
  /* Ein Byte im ersten Stück kippen. */
  const stueck = (await db.stuecke.toArray())[0];
  const bytes = new Uint8Array(await stueck.blob.arrayBuffer());
  bytes[bytes.length - 1] = ((bytes[bytes.length - 1] ?? 0) + 1) % 256;
  await db.stuecke.update(stueck.id, { blob: new Blob([bytes]) });
  const v1 = await M.compare(db);
  /* Und einen Satz verfälschen. */
  const block = (await db.blocks.toArray())[0];
  await db.blocks.update(block.id, { text: (block.text || '') + '!' });
  const v2 = await M.compare(db);
  return { blobRot: v1.abweichungen.some((a: any) => a.was === 'blob-ungleich'),
           satzRot: v2.abweichungen.some((a: any) => a.was === 'ungleich'),
           v1gleich: v1.gleich, v2gleich: v2.gleich };
});
gleich('Ein gekipptes Byte macht den Vergleich rot', (gegen as any).v1gleich, false);
p('… und zwar als blob-ungleich', (gegen as any).blobRot === true);
gleich('Ein verfälschter Satz ebenso', (gegen as any).v2gleich, false);
p('… als ungleich', (gegen as any).satzRot === true);

console.log('\n4 · Der Bestand ist von alledem unberührt');

await seite.goto(`http://localhost:${PORT}/neutrale-seite`);
const nachher = await seite.evaluate('(' + abzug + ')()');
p('`notizen` ist Satz für Satz identisch — kopiert wurde nur heraus',
  vorher === nachher);

/* Aufräumen: die Abschrift ist Prüfmaterial, kein Bestand. */
await seite.evaluate(async () => {
  await new Promise<void>((ok) => {
    const d = indexedDB.deleteDatabase('redion-neu');
    d.onsuccess = d.onerror = d.onblocked = () => ok();
  });
});

console.log('\n5 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 114 — RM-4 nachgerechnet: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
