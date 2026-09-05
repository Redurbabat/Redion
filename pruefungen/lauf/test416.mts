/* Suite 416 — Die Karte nimmt die Ortsspalte (E423)
 * ============================================================================
 * Auf dem Bild `db-map` stand über der Karte:
 *
 *     0 auf der Karte   ·   9 Orte nachschlagen   ·   Ortsspalte: Projekt
 *
 * „Projekt" ist die TITELSPALTE. Die Datenbank hat eine Spalte „Ort" vom
 * Typ `place` — dem einen Typ, der wörtlich „hier steht ein Ort" bedeutet,
 * mit dem Zeichen 📍 im Eigenschaftenregister — und die Karte hat sie nicht
 * einmal in Betracht gezogen:
 *
 *     const ortKeys = Object.keys(coll.schema).filter(k =>
 *       ['text','title','select'].includes(coll.schema[k].type));
 *     const ortKey = … : ortKeys[0];
 *
 * Zwei Fehler in zwei Zeilen. `place` fehlt in der Liste, und die Vorgabe
 * ist das erste Element — und der Titel steht in jedem Schema zuerst.
 *
 * DAS IST WÖRTLICH DER BEFUND AUS E414, nur an einer anderen Ansicht: dort
 * war die Vorgabe-Gruppierung des Diagramms `gruppierbar[0]`, und
 * `gruppierbar` schloss `title` ein. Neun Zeilen ergaben neun Balken. Hier
 * ergeben neun Zeilen neun unauffindbare Orte — „Schaltplan Werkstatt" ist
 * kein Ort, und die Karte bleibt leer.
 *
 *   §1 Die Vorgabe ist die Ortsspalte, nicht der Titel.
 *   §2 Eine `place`-Spalte steht überhaupt zur Wahl.
 *   §3 Der Titel bleibt WÄHLBAR — eine bessere Vorgabe nimmt keine
 *      Möglichkeit weg.
 *   §4 Und dann sind auch Orte da, die nachgeschlagen werden können.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1/§2/§4 → `ortVorgabe` zurück auf `ortKeys[0]` und `place` aus der
 *              Liste nehmen. Gemessen: „Ortsspalte: Projekt", 0 auf der
 *              Karte.
 *   §3       → den Titel aus `ortKeys` werfen.
 * Beide gelaufen, Ergebnisse im Bericht zu E423.
 *
 *   node pruefungen/lauf/test416.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9538;

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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

const bilderQuelle = fs.readFileSync(path.join(WURZEL, 'bilder.mts'), 'utf8');
const teil = bilderQuelle.slice(bilderQuelle.indexOf('const dbAufbau'),
                                bilderQuelle.indexOf('for (const l of DB_ANSICHTEN)'));
const vorlage = teil.slice(teil.indexOf('`') + 1, teil.lastIndexOf('`'));

const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(400);
await s.evaluate(new Function(vorlage.replace('${layout}', 'map')) as any);
await s.waitForTimeout(1200);

const kopf = await s.evaluate(`JSON.stringify((() => {
  const spalte = document.querySelector('.karte-w [data-a="spalte"]');
  const leiste = document.querySelector('.karte-kopf') || spalte?.parentElement;
  return {
    spalte: (spalte?.querySelector('b') || {}).textContent || '',
    text: (leiste?.textContent || '').replace(/\\s+/g, ' ').trim(),
    leer: !!document.querySelector('.karte-w .db-leer')
  };
})())`) as string;
const k = JSON.parse(kopf);

/* ==========================================================================
 * §1 · DIE VORGABE IST DIE ORTSSPALTE
 * ========================================================================*/
console.log('\n§1 Die Vorgabe ist die Ortsspalte');
p('Die Karte steht überhaupt da', k.leer === false, JSON.stringify(k));
p('Die gewählte Spalte heisst „Ort"', k.spalte === 'Ort', JSON.stringify(k.spalte));
/* Und ausdrücklich NICHT der Titel — das war der Befund. */
p('… und nicht „Projekt", die Titelspalte', k.spalte !== 'Projekt', JSON.stringify(k.spalte));

/* ==========================================================================
 * §2 · EINE place-SPALTE STEHT ZUR WAHL
 * ========================================================================*/
console.log('\n§2 Eine Ortsspalte steht überhaupt zur Wahl');
const wahl = JSON.parse(await s.evaluate(`(async () => {
  document.querySelector('.karte-w [data-a="spalte"]').click();
  await new Promise(f => setTimeout(f, 400));
  /* Nur die Knoepfe MIT Text: data-k steht auch an Zellen der Tabelle
     darunter, und die haben keinen. Ein Menue mit fuenfzehn leeren
     Eintraegen waere keine Messung, sondern Rauschen.
     (Keine Backticks in einem Kommentar innerhalb einer Vorlage — sie
     beenden die Zeichenkette. Vierter Anlauf an derselben Sorte Stelle.) */
  const m = [...document.querySelectorAll('[data-k]')]
    .map(b => ({ k: b.dataset.k, name: b.textContent.trim() }))
    .filter(x => x.name.length > 0);
  document.body.click();
  await new Promise(f => setTimeout(f, 200));
  return JSON.stringify(m);
})()`) as string);
p('Das Menü bietet Spalten an', wahl.length >= 2, JSON.stringify(wahl));
p('Die Spalte „Ort" ist darunter',
  wahl.some((x: any) => x.name === 'Ort'), JSON.stringify(wahl.map((x: any) => x.name)));

/* ==========================================================================
 * §3 · DER TITEL BLEIBT WÄHLBAR
 * --------------------------------------------------------------------------
 * E414 §5 hat denselben Satz für das Diagramm festgehalten: eine bessere
 * Vorgabe darf keine Möglichkeit wegnehmen. Wer seine Orte im Titel führt,
 * soll das weiter können.
 * ========================================================================*/
console.log('\n§3 Der Titel bleibt wählbar');
p('„Projekt" steht weiter im Menü',
  wahl.some((x: any) => x.name === 'Projekt'), JSON.stringify(wahl.map((x: any) => x.name)));
const umgestellt = JSON.parse(await s.evaluate(`(async () => {
  document.querySelector('.karte-w [data-a="spalte"]').click();
  await new Promise(f => setTimeout(f, 400));
  const b = [...document.querySelectorAll('[data-k]')].find(x => x.textContent.trim() === 'Projekt');
  b.click();
  await new Promise(f => setTimeout(f, 700));
  const sp = document.querySelector('.karte-w [data-a="spalte"] b');
  return JSON.stringify({ jetzt: sp ? sp.textContent : '' });
})()`) as string);
p('… und die Wahl wirkt', umgestellt.jetzt === 'Projekt', JSON.stringify(umgestellt));

/* ==========================================================================
 * §4 · MIT DER ORTSSPALTE GIBT ES ORTE ZUM NACHSCHLAGEN
 * --------------------------------------------------------------------------
 * Nachgeschlagen wird online, und im Container gibt es kein Netz — die
 * Karte bleibt hier also leer. Geprüft wird deshalb, was OHNE Netz zu
 * prüfen ist: dass die Karte neun Zeilen mit einem Ort FINDET.
 * ========================================================================*/
console.log('\n§4 Es gibt Orte zum Nachschlagen');
const zurueck = JSON.parse(await s.evaluate(`(async () => {
  document.querySelector('.karte-w [data-a="spalte"]').click();
  await new Promise(f => setTimeout(f, 400));
  const b = [...document.querySelectorAll('[data-k]')].find(x => x.textContent.trim() === 'Ort');
  /* Fehlt der Eintrag, ist genau das der Befund — melden, nicht abstürzen. */
  if (!b) { document.body.click(); return JSON.stringify({ text: 'Ort steht nicht im Menü', offen: -1 }); }
  b.click();
  await new Promise(f => setTimeout(f, 700));
  const leiste = document.querySelector('.karte-w');
  const t = (leiste?.textContent || '').replace(/\\s+/g, ' ');
  return JSON.stringify({ text: t.slice(0, 120),
    offen: Number((t.match(/(\\d+) Orte nachschlagen/) || [])[1] || 0) });
})()`) as string);
p('Neun Zeilen tragen einen Ort', zurueck.offen === 9, JSON.stringify(zurueck));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
