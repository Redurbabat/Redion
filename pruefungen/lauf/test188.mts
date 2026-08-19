/* Suite 154 — Eine Tabelle bleibt eine Tabelle, wo immer sie hinkopiert wird
 * ============================================================================
 * E114. Gefunden beim Schreiben von `test187`: nach einem Markdown-Rundlauf
 * stand die einfache Tabelle wieder da — LEER. `Store.baum` hatte ihre Zellen
 * korrekt eingesammelt, `Store.baumEinfuegen` warf sie weg:
 *
 *     delete patch.id; delete patch.kinder; delete patch.collection;
 *     delete patch.views; delete patch.rows; delete patch.content;
 *                                     ^^^^
 *
 * Der Grund für dieses `delete` ist eine DATENBANK: dort sind `rows` die
 * Zeilen-Blöcke, die zwanzig Zeilen tiefer einzeln neu angelegt werden. Am
 * `table`-Block heisst dasselbe Feld etwas ganz anderes — es sind seine
 * Zellen, und sonst hat er nichts.
 *
 * `baumEinfuegen` steht an SIEBZEHN Stellen: Verdoppeln, Einfügen,
 * Rückgängig, Fassung wiederherstellen, Vorlage, Seite entsperren, Ziehen
 * zwischen Seiten. Jede davon hat eine einfache Tabelle geleert, und keine
 * hat es gemeldet — der Block stand ja noch da.
 *
 * Diese Suite fährt die Wege ab, nicht die Funktion.
 *
 *   node pruefungen/lauf/test188.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8942;

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
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.setViewportSize({ width: 1300, height: 850 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

const ZEILEN = JSON.stringify([['Jahr', 'Wert'], ['2025', '12'], ['2026', '19']]);

/* ==========================================================================
 * §1 · Verdoppeln
 * --------------------------------------------------------------------------
 * Der kürzeste Weg zum Fehler: eine Tabelle anlegen, ausfüllen, den
 * Blockbefehl „Duplizieren" nehmen. Die Kopie war leer.
 * ========================================================================*/
console.log('\n1 · Verdoppeln');

const doppelt = await seite.evaluate((zeilen: string) => {
  const s = Store.addPage(null, { text: 'Tabellen' });
  App.oeffne(s.id);
  const t = Store.addBlock(s.id, 'table', { text: '', rows: JSON.parse(zeilen), kopfZeile: true });
  Blocks.dupliziere(Store.getBlock(t.id));
  const tab = Store.childrenOf(s.id).filter((b: any) => b.type === 'table');
  return {
    anzahl: tab.length,
    zeilen: tab.map((b: any) => JSON.stringify(b.rows || null)),
    kopf: tab.map((b: any) => !!b.kopfZeile),
    ids: tab.map((b: any) => b.id),
  };
}, ZEILEN);

gleich('Es gibt zwei Tabellen', doppelt.anzahl, 2);
gleich('Die erste hat ihre Zeilen', doppelt.zeilen[0], ZEILEN);
gleich('Und die Kopie genauso', doppelt.zeilen[1], ZEILEN);
p('Beide wissen, dass die erste Zeile der Kopf ist',
  doppelt.kopf[0] === true && doppelt.kopf[1] === true, JSON.stringify(doppelt.kopf));
p('Aber es sind zwei verschiedene Blöcke',
  doppelt.ids[0] !== doppelt.ids[1], doppelt.ids.join(' '));

/* ==========================================================================
 * §2 · Rückgängig
 * --------------------------------------------------------------------------
 * Der schlimmste Weg. `Verlauf.anwenden` leert die Seite und baut sie aus
 * der Momentaufnahme neu — mit `baumEinfuegen`. Wer eine Tabelle füllte,
 * dann irgendetwas anderes tat und einmal Strg + Z drückte, bekam die
 * Tabelle leer zurück. Rückgängig als Datenverlust.
 * ========================================================================*/
console.log('\n2 · Rückgängig');

const zurueck = await seite.evaluate(async (zeilen: string) => {
  const s = Store.addPage(null, { text: 'Rückgängig' });
  App.oeffne(s.id);
  const t = Store.addBlock(s.id, 'table', { text: '', rows: JSON.parse(zeilen) });
  await new Promise(r => setTimeout(r, 60));
  Verlauf.merke(true);                       /* Stand MIT gefüllter Tabelle */
  const weg = Store.addBlock(s.id, 'text', { text: 'Ein Versehen' });
  await new Promise(r => setTimeout(r, 60));
  Verlauf.zurueck();
  await new Promise(r => setTimeout(r, 200));
  const k = Store.childrenOf(s.id);
  const tab = k.filter((b: any) => b.type === 'table');
  return {
    tabellen: tab.length,
    zeilen: JSON.stringify(tab[0]?.rows || null),
    versehenWeg: !k.some((b: any) => (b.text || '') === 'Ein Versehen'),
    alteId: t.id, wegId: weg.id,
  };
}, ZEILEN);

gleich('Die Tabelle steht wieder da', zurueck.tabellen, 1);
gleich('Mit ihren Zeilen', zurueck.zeilen, ZEILEN);
p('Und das Versehen ist zurückgenommen', zurueck.versehenWeg);

/* ==========================================================================
 * §3 · Eine Fassung wiederherstellen
 * ========================================================================*/
console.log('\n3 · Eine Fassung wiederherstellen');

const fassung = await seite.evaluate(async (zeilen: string) => {
  const s = Store.addPage(null, { text: 'Fassungen' });
  App.oeffne(s.id);
  Store.addBlock(s.id, 'table', { text: '', rows: JSON.parse(zeilen) });
  await Store.versionSpeichern(s.id, 'Probe');
  /* Alles wegwerfen, dann die Fassung zurückholen. */
  Store.kinderLeeren(s.id);
  const v = (await Store.versionen(s.id)).pop();
  (v.daten.kinder || []).forEach((k: any) => Store.baumEinfuegen(k, s.id));
  const tab = Store.childrenOf(s.id).filter((b: any) => b.type === 'table');
  return { tabellen: tab.length, zeilen: JSON.stringify(tab[0]?.rows || null) };
}, ZEILEN);

gleich('Die Fassung bringt die Tabelle zurück', fassung.tabellen, 1);
gleich('Und ihre Zeilen sind dieselben', fassung.zeilen, ZEILEN);

/* ==========================================================================
 * §4 · Aus einer Vorlage
 * ========================================================================*/
console.log('\n4 · Aus einer Vorlage');

const vorlage = await seite.evaluate(async (zeilen: string) => {
  const quelle = Store.addPage(null, { text: 'Wochenplan' });
  Store.addBlock(quelle.id, 'h2', { text: 'Meine Zahlen' });
  Store.addBlock(quelle.id, 'table', { text: '', rows: JSON.parse(zeilen) });
  Werkzeuge.alsVorlage(Store.getBlock(quelle.id));
  await new Promise(r => setTimeout(r, 400));

  /* Der echte Weg: `vorlageEinfuegen` öffnet ein Menü, und im Menü steht
     ein Knopf je Vorlage. Den drücken, statt die Funktion zu umgehen — die
     Verdrahtung ist der Teil, der schiefgehen kann (E93). */
  const ziel = Store.addPage(null, { text: 'Diese Woche' });
  Werkzeuge.vorlageEinfuegen(Store.getBlock(ziel.id));
  await new Promise(r => setTimeout(r, 200));
  const knoepfe = [...document.querySelectorAll('[data-v]')] as HTMLElement[];
  const knopf = knoepfe.find(k => (k.textContent || '').includes('Wochenplan'));
  if (!knopf) return { gefunden: false, tabellen: -1, zeilen: '' };
  knopf.click();
  await new Promise(r => setTimeout(r, 400));
  const tab = Store.childrenOf(ziel.id).filter((b: any) => b.type === 'table');
  return { gefunden: true, tabellen: tab.length,
           zeilen: JSON.stringify(tab[0]?.rows || null) };
}, ZEILEN);

p('Die Vorlage ist da', vorlage.gefunden);
gleich('Sie bringt die Tabelle mit', vorlage.tabellen, 1);
gleich('Samt Zeilen', vorlage.zeilen, ZEILEN);

/* ==========================================================================
 * §5 · Und eine Datenbank darf davon NICHTS abbekommen
 * --------------------------------------------------------------------------
 * Das `delete patch.rows` gab es aus einem Grund: an einer Datenbank sind
 * `rows` die Zeilen-BLÖCKE, die zwanzig Zeilen tiefer einzeln neu angelegt
 * werden. Bliebe die alte Liste am Block hängen, stünden dieselben Zeilen
 * zweimal im Bestand — einmal echt, einmal als toter Abdruck.
 *
 * Die Bedingung muss also genau dort greifen und nirgends sonst.
 * ========================================================================*/
console.log('\n5 · Und eine Datenbank darf davon NICHTS abbekommen');

const db = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Datenbank' });
  App.oeffne(s.id);
  const d = Store.addDatabase(s.id, 'Aufgaben');
  Store.addRow(d.collectionId, { title: 'Erste Aufgabe' });
  Store.addRow(d.collectionId, { title: 'Zweite Aufgabe' });
  await new Promise(r => setTimeout(r, 200));

  const vorher = Store.rowsOf(d.collectionId).length;
  Blocks.dupliziere(Store.getBlock(d.block.id));
  await new Promise(r => setTimeout(r, 300));

  const dbs = Store.childrenOf(s.id).filter((b: any) => b.type === 'database');
  return {
    anzahl: dbs.length,
    vorher,
    zeilen: dbs.map((b: any) => Store.rowsOf(b.collectionId).length),
    /* Und der entscheidende Punkt: KEIN toter Abdruck am Block selbst. */
    abdruck: dbs.map((b: any) => (b.rows === undefined ? 'nichts' : 'ABDRUCK')),
    verschiedeneSammlungen: new Set(dbs.map((b: any) => b.collectionId)).size,
  };
});

gleich('Es gibt zwei Datenbanken', db.anzahl, 2);
gleich('Die erste hatte zwei Zeilen', db.vorher, 2);
p('Beide haben zwei echte Zeilen', db.zeilen.join(',') === '2,2', db.zeilen.join(','));
p('Und keine trägt einen toten Zeilen-Abdruck am Block',
  db.abdruck.every((x: string) => x === 'nichts'), db.abdruck.join(','));
gleich('Es sind zwei getrennte Sammlungen', db.verschiedeneSammlungen, 2);

/* ==========================================================================
 * §6 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n6 · Was der Quelltext verspricht');

const roh = fs.readFileSync(
  path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf8');
const code = roh.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

p('`rows` wird nur noch bedingt gelöscht',
  /if \(k\.collection\) delete patch\.rows;/.test(code));
/* GEZÄHLT, nicht gesucht. Ein `test()` auf die alte Schreibweise wäre schon
   dann grün, wenn jemand `delete patch.rows;` in eine eigene Zeile setzt —
   gemessen genau so passiert, als die Gegenprobe gelegt wurde (§55.2).
   Also: jedes `delete patch.rows` muss ein bewachtes sein. */
gleich('Und JEDES `delete patch.rows` steht hinter dieser Bedingung',
  (code.match(/delete patch\.rows/g) || []).length,
  (code.match(/if \(k\.collection\) delete patch\.rows/g) || []).length);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
