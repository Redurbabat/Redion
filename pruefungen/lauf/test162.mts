/* Suite 126 — Markdown-Tabellen: Einfügen wird ein Tabellenblock (L20/E88)
 * ============================================================================
 * `| a | b |` mit Trennzeile wurde beim Einfügen bisher gewöhnlicher Text —
 * die Gliederung war da, und Redion warf sie weg. Jetzt wird daraus ein
 * Tabellenblock: die Zellen gehen durch Spreadsheet.setze, also wird aus
 * „12" eine Zahl und aus „=A1+B1" eine Formel, genau wie beim Tippen.
 * Und die Gegenrichtung: Strg+C schreibt den Tabellenblock als
 * Markdown-Tabelle — vorher verschwand er beim Kopieren einfach (sein
 * `text` ist leer).
 *
 * Ohne Trennzeile ist es KEINE Tabelle: „| a | b |" kann auch einfach so
 * gemeinter Text sein.
 *
 *   node pruefungen/lauf/test162.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8879;

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
const seite = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

console.log('\n1 · Eine Markdown-Tabelle wird ein Tabellenblock — Zahlen werden Zahlen');

const md = [
  '# Einkauf',
  '| Ware | Preis | Summe |',
  '| --- | ---: | --- |',
  '| Brot | 3.5 | =B2*2 |',
  '| Milch | 1.2 | fest |'
].join('\n');

const eins = await seite.evaluate(async (roh: string) => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addBlock(null, 'page', { text: 'Tabellenprobe' });
  const teile = Blocks.mdLesen(roh);
  Blocks.mdEinsetzen(teile, s.id, 0);
  await new Promise(r => setTimeout(r, 300));
  const kinder = (Store.getBlock(s.id)?.content || []).map((id: string) => Store.getBlock(id));
  const tab = kinder.find((b: any) => b && b.type === 'spreadsheet');
  if (!tab) return { typen: kinder.map((b: any) => b?.type) };
  const blatt = tab.mappe.blaetter[0];
  const z = (adr: string) => blatt.zellen[adr] || {};
  return {
    typen: kinder.map((b: any) => b?.type),
    seite: s.id, tabId: tab.id,
    kopf: (z('A1').wert ?? z('A1').eingabe),
    zahl: z('B2').wert,
    zahlTyp: typeof z('B2').wert,
    formel: z('C2').formel || z('C2').eingabe,
    text: z('B4') && z('C3').wert
  };
}, md);
p('Die Überschrift blieb eine Überschrift, die Tabelle wurde ein Block',
  JSON.stringify((eins as any).typen) === JSON.stringify(['h1', 'spreadsheet']),
  JSON.stringify((eins as any).typen));
gleich('A1 trägt den Kopf „Ware"', (eins as any).kopf, 'Ware');
gleich('B2 ist eine ZAHL 3.5, kein Text', (eins as any).zahl, 3.5);
gleich('… wirklich als Zahl gespeichert', (eins as any).zahlTyp, 'number');
p('C2 ist eine Formel', String((eins as any).formel || '').includes('B2*2'),
  String((eins as any).formel));

console.log('\n2 · Ohne Trennzeile bleibt es Text');

const zwei = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'KeineTabelle' });
  const teile = Blocks.mdLesen('| a | b |\n| c | d |');
  Blocks.mdEinsetzen(teile, s.id, 0);
  const kinder = (Store.getBlock(s.id)?.content || []).map((id: string) => Store.getBlock(id));
  return { typen: kinder.map((b: any) => b?.type), erster: kinder[0]?.text };
});
p('Beide Zeilen sind Textblöcke geblieben',
  JSON.stringify((zwei as any).typen) === JSON.stringify(['text', 'text']),
  JSON.stringify((zwei as any).typen));
gleich('… mit den Zeichen darin', (zwei as any).erster, '| a | b |');

console.log('\n3 · Der Kreis: Strg+C schreibt die Tabelle, Einfügen liest sie zurück');

const kreis = await seite.evaluate(async (x: any) => {
  /* Die Auswahl kennt nur die SICHTBARE Seite — also erst öffnen,
     wie es der Mensch täte. */
  App.oeffne(x.seite);
  await new Promise(r => setTimeout(r, 500));
  Blocks.auswahlSetzen([x.tabId]);
  const raus = Blocks.auswahlAlsText();
  Blocks.auswahlLeeren();
  /* … und zurück auf eine frische Seite */
  const s2 = Store.addBlock(null, 'page', { text: 'Rückweg' });
  Blocks.mdEinsetzen(Blocks.mdLesen(raus), s2.id, 0);
  const kinder = (Store.getBlock(s2.id)?.content || []).map((id: string) => Store.getBlock(id));
  const tab = kinder.find((b: any) => b && b.type === 'spreadsheet');
  if (!tab) return { raus, typen: kinder.map((b: any) => b?.type) };
  const blatt = tab.mappe.blaetter[0];
  return {
    raus,
    kopf: blatt.zellen['A1']?.wert ?? blatt.zellen['A1']?.eingabe,
    zahl: blatt.zellen['B2']?.wert
  };
}, eins);
p('Der Text beginnt mit der Kopfzeile', String((kreis as any).raus || '').startsWith('| Ware | Preis |'),
  String((kreis as any).raus).slice(0, 60));
p('… und trägt die Trennzeile', /\n\|\s*---/.test(String((kreis as any).raus || '')));
gleich('Nach dem Rückweg steht der Kopf wieder in A1', (kreis as any).kopf, 'Ware');
gleich('… und die Zahl in B2', (kreis as any).zahl, 3.5);

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
