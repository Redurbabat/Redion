/* Suite 136 — Spaltenschlüssel dürfen nicht rein numerisch sein (E96)
 * ============================================================================
 * voll53 wurde rot: test33 fand die neue Spalte VORN statt rechts neben
 * ihrem Anker. Die Wurzel steckt tiefer als jedes Menü: `Object.keys`
 * sortiert Integer-artige Schlüssel („12345") VOR alle String-Schlüssel —
 * und `Store.uid().slice(0, 5)` ist Hex, also mit gemessenen 9,6 % rein
 * numerisch (vier Zeichen: 15 %). Jede zehnte neue Spalte konnte also
 * IRGENDWO landen, jede siebte Standard-Datenbank ihren Status oder ihr
 * Datum vor den Titel stellen. Die Testhistorie in test33 machte dafür
 * „ein fremdes offenes Menü" verantwortlich — widerlegt: ein falsches
 * Menü setzt die Spalte woandershin, aber nie an Position 0.
 *
 * Seit E96 bildet `Ids.short` einen Ziffern-Anfang deterministisch auf
 * a–f ab, und alle Schema-Schlüssel-Stellen gehen durch `Ids.short`.
 *
 *   node pruefungen/lauf/test170.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8899;

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
const seite = await browser.newPage();
await seite.setViewportSize({ width: 1280, height: 800 });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

console.log('\n1 · Der Mechanismus, festgenagelt: Integer-Schlüssel wandern vor');
/* Kein Redion-Code — die Sprache selbst. Wenn dieser Punkt je rot wird,
   hat sich JavaScript geändert, und E96 gehört neu gelesen. */
const mech = await seite.evaluate(() => {
  const o: Record<string, number> = {};
  o['name'] = 1; o['zahl'] = 1; o['12345'] = 1; o['art'] = 1;
  return Object.keys(o).join(',');
});
p('„12345" steht vorn, obwohl es zuletzt kam', mech === '12345,name,zahl,art', mech);

console.log('\n2 · Ids.short beginnt nie mit einer Ziffer');
const ziehung = await seite.evaluate(() => {
  const schlecht: string[] = [];
  for (let i = 0; i < 800; i++) {
    const k4 = (window as any).Ids.short(4);
    const k5 = (window as any).Ids.short(5);
    if (/^[0-9]/.test(k4)) schlecht.push(k4);
    if (/^[0-9]/.test(k5)) schlecht.push(k5);
    if (k4.length !== 4 || k5.length !== 5) schlecht.push('LAENGE:' + k4 + '/' + k5);
  }
  return schlecht;
});
p('1600 Ziehungen (je 800 mit 4 und 5 Zeichen), keine beginnt numerisch',
  (ziehung as string[]).length === 0, (ziehung as string[]).slice(0, 5).join(' '));

console.log('\n3 · Der echte Weg: 25-mal „Rechts einfügen", 25-mal richtig');
const echt = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  /* UI.frage stellt sonst eine echte Frage — hier antwortet der Prüfstand. */
  (UI as any).frage = async () => 'Dazwischen';
  const s = Store.addBlock(null, 'page', { text: 'Schlüsselprobe' });
  const falsch: string[] = [];
  for (let i = 0; i < 25; i++) {
    const db = Store.addDatabase(s.id, 'Probe' + i, {
      name: { name: 'Name', type: 'title' },
      zahl: { name: 'Zahl', type: 'number' },
      art:  { name: 'Art',  type: 'text' }
    }, 'table');
    const c = Store.getCollection(db.collectionId);
    const key = await (Datenbank as any).eigenschaftAnlegen(c, 'text', -1,
      { nebenKey: 'zahl', versatz: 1 });
    const keys = Object.keys(Store.getCollection(db.collectionId).schema);
    if (keys.indexOf(key) !== keys.indexOf('zahl') + 1)
      falsch.push(i + ':' + keys.join(','));
    if (/^[0-9]/.test(key)) falsch.push(i + ':SCHLUESSEL ' + key);
  }
  return falsch;
});
p('Die neue Spalte steht 25 von 25 Malen direkt rechts neben dem Anker',
  (echt as string[]).length === 0, (echt as string[]).slice(0, 3).join(' | '));

console.log('\n4 · Die Standard-Datenbank: der Titel bleibt 30 von 30 Malen vorn');
const standard = await seite.evaluate(() => {
  const s = Store.addBlock(null, 'page', { text: 'Standardprobe' });
  const falsch: string[] = [];
  for (let i = 0; i < 30; i++) {
    const db = Store.addDatabase(s.id, 'Std' + i, null, 'table');
    const keys = Object.keys(Store.getCollection(db.collectionId).schema);
    if (keys[0] !== 'title') falsch.push(i + ':' + keys.join(','));
  }
  return falsch;
});
p('„title" ist immer der erste Schlüssel',
  (standard as string[]).length === 0, (standard as string[]).slice(0, 3).join(' | '));

console.log('\n5 · Der Quelltext kennt keine rohen 5er-Schnipsel mehr');
const st = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/datenbanken/steuerung.ts'), 'utf8');
p('steuerung.ts: kein Store.uid().slice(0, 5) mehr',
  !st.includes('Store.uid().slice(0, 5)'));
const vb = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/verbinden/schnittstelle.ts'), 'utf8');
p('verbinden: Schema-Schlüssel über Ids.short(6)',
  !vb.includes('Store.uid().slice(0, 6)') && vb.includes('Ids.short(6)'));
const ix = fs.readFileSync(
  path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf8');
p('Standard-Schema über den kurz-Wächter',
  !ix.includes('[uid().slice(0,4)]') && ix.includes('[kurz(4)]'));
const ids = fs.readFileSync(
  path.join(WURZEL, 'src/core/helpers/ids.ts'), 'utf8');
p('Die Regel wohnt in Ids.short', /abcdef.*charCodeAt/.test(ids));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
