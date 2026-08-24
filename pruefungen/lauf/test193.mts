/* Suite 159 — Einrückung ist Struktur (E120)
 * ============================================================================
 * `alsMarkdown` schreibt sie seit jeher: `'  '.repeat(tiefe)`.
 * `ausMarkdown` warf sie weg — jede Zeile wurde mit `trim()` beschnitten und
 * landete direkt unter der Seite.
 *
 * Gemessen an einer dreistufigen Liste, vor dieser Änderung:
 *
 *     - Oben eins              bullet
 *       - Darunter A             bullet      →   alle sieben Blöcke
 *         - Noch tiefer            bullet        nebeneinander auf
 *       - Darunter B             bullet        Ebene null
 *     - Oben zwei              bullet
 *     - [ ] Aufgabe            todo
 *       Unteraufgabe             text
 *
 * Der Text war da, die Ordnung nicht. Und beim Einlesen einer `.md`-Datei
 * wiegt es schwerer: dort ist die Einrückung die einzige Strukturangabe,
 * die es überhaupt gibt.
 *
 * L40 hat das bei E113 ausdrücklich offen gelassen — „dieselbe Funktion
 * bedient auch den `.md`-Import, und ein zweites Thema in einer Änderung
 * geht gegen §45". Hier ist es als eigene Änderung.
 *
 *   node pruefungen/lauf/test193.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8947;

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
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.setViewportSize({ width: 1300, height: 880 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* Ein Baum als flache Liste mit Tiefenangabe — so lässt sich „gleich" mit
   einem einzigen Vergleich sagen. */
const BAUM = `(id) => {
  const gehe = (x, t) => Store.childrenOf(x).flatMap(b =>
    [b.type + '@' + t + ':' + (b.text || ''), ...gehe(b.id, t + 1)]);
  return gehe(id, 0).join(' | ');
}`;

/* ==========================================================================
 * §1 · Der Rundlauf: hin und zurück ändert nichts
 * ========================================================================*/
console.log('\n1 · Der Rundlauf: hin und zurück ändert nichts');

const rund = await seite.evaluate((baumQuelle: string) => {
  const baum = eval('(' + baumQuelle + ')') as (id: string) => string;
  const s = Store.addPage(null, { text: 'Verschachtelt' });
  const a  = Store.addBlock(s.id, 'bullet', { text: 'Oben eins' });
  const a1 = Store.addBlock(a.id, 'bullet', { text: 'Darunter A' });
  Store.addBlock(a1.id, 'bullet', { text: 'Noch tiefer' });
  Store.addBlock(a.id, 'bullet', { text: 'Darunter B' });
  Store.addBlock(s.id, 'bullet', { text: 'Oben zwei' });
  const t = Store.addBlock(s.id, 'todo', { text: 'Aufgabe', checked: false });
  Store.addBlock(t.id, 'text', { text: 'Unteraufgabe' });

  const vorher = baum(s.id);
  const md = Werkzeuge.alsMarkdown(Store.getBlock(s.id));
  Werkzeuge.ausMarkdown(Store.getBlock(s.id), md);
  const nachher = baum(s.id);
  Werkzeuge.ausMarkdown(Store.getBlock(s.id), Werkzeuge.alsMarkdown(Store.getBlock(s.id)));
  return { vorher, nachher, zweimal: baum(s.id), md };
}, BAUM);

p('Der Text trägt die Einrückung schon immer',
  /^- Oben eins\n  - Darunter A\n    - Noch tiefer\n  - Darunter B/.test(rund.md),
  JSON.stringify(rund.md.slice(0, 80)));
gleich('Und der Baum kommt unverändert zurück', rund.nachher, rund.vorher);
gleich('Auch nach dem zweiten Rundlauf', rund.zweimal, rund.vorher);
p('Er ist wirklich verschachtelt, nicht flach',
  /@2:/.test(rund.vorher), rund.vorher);

/* ==========================================================================
 * §2 · Eine gewöhnliche Markdown-Datei
 * --------------------------------------------------------------------------
 * Der Fall, der schwerer wiegt: hier ist die Einrückung die EINZIGE
 * Strukturangabe. Und Menschen tippen zwei, drei oder vier Leerzeichen —
 * oder einen Tabulator.
 * ========================================================================*/
console.log('\n2 · Eine gewöhnliche Markdown-Datei');

const DATEI = [
  '# Einkauf',
  '',
  '- Obst',
  '  - Äpfel',            /* zwei */
  '  - Birnen',
  '- Gemüse',
  '    - Karotten',       /* vier */
  '\t- Zwiebeln',         /* Tabulator */
  '- Getränke',
  '',
  '1. Erster Schritt',
  '   1. Unterschritt',   /* drei */
  '2. Zweiter Schritt',
].join('\n');

const datei = await seite.evaluate(([md, baumQuelle]: string[]) => {
  const baum = eval('(' + baumQuelle + ')') as (id: string) => string;
  const s = Store.addPage(null, { text: 'Import' });
  Werkzeuge.ausMarkdown(Store.getBlock(s.id), md!);
  return baum(s.id);
}, [DATEI, BAUM]);

p('Die Überschrift steht oben', /^h1@0:Einkauf/.test(datei), datei);
p('Äpfel und Birnen hängen unter Obst',
  /bullet@0:Obst \| bullet@1:Äpfel \| bullet@1:Birnen/.test(datei), datei);
p('Vier Leerzeichen zählen auch — Karotten unter Gemüse',
  /bullet@0:Gemüse \| bullet@1:Karotten/.test(datei), datei);
p('Und ein Tabulator ebenso — Zwiebeln daneben',
  /bullet@1:Karotten \| bullet@1:Zwiebeln/.test(datei), datei);
p('Getränke steht wieder oben', /bullet@0:Getränke/.test(datei), datei);
p('Drei Leerzeichen in der Nummernliste zählen auch',
  /number@0:Erster Schritt \| number@1:Unterschritt \| number@0:Zweiter Schritt/.test(datei),
  datei);
p('Nichts ist verlorengegangen',
  ['Einkauf','Obst','Äpfel','Birnen','Gemüse','Karotten','Zwiebeln','Getränke',
   'Erster Schritt','Unterschritt','Zweiter Schritt'].every(w => datei.includes(w)),
  datei);

/* ==========================================================================
 * §3 · Wer zu tief springt, verliert nichts
 * --------------------------------------------------------------------------
 * Markdown erlaubt einen Sprung von Ebene 0 auf Ebene 3. Ein verlorener
 * Block wäre schlimmer als eine Ebene daneben.
 * ========================================================================*/
console.log('\n3 · Wer zu tief springt, verliert nichts');

const sprung = await seite.evaluate((baumQuelle: string) => {
  const baum = eval('(' + baumQuelle + ')') as (id: string) => string;
  const s = Store.addPage(null, { text: 'Sprung' });
  Werkzeuge.ausMarkdown(Store.getBlock(s.id),
    '- Ganz oben\n' +
    '            - Sehr weit rechts\n' +   /* zwölf Leerzeichen */
    '- Wieder oben');
  return baum(s.id);
}, BAUM);

p('Alle drei Zeilen sind da',
  ['Ganz oben','Sehr weit rechts','Wieder oben'].every(w => sprung.includes(w)),
  sprung);
p('Die weit eingerückte hängt EINE Ebene tiefer, nicht im Nichts',
  /bullet@0:Ganz oben \| bullet@1:Sehr weit rechts \| bullet@0:Wieder oben/.test(sprung),
  sprung);

/* ==========================================================================
 * §4 · Code, Tabelle und Platzhalter hängen an ihrem Platz
 * --------------------------------------------------------------------------
 * Diese drei laufen über mehrere Zeilen oder über einen anderen Weg. Sie
 * dürfen nicht dort landen, wo die Zeile DANACH steht.
 * ========================================================================*/
console.log('\n4 · Code, Tabelle und Platzhalter hängen an ihrem Platz');

const mehrzeilig = await seite.evaluate((baumQuelle: string) => {
  const baum = eval('(' + baumQuelle + ')') as (id: string) => string;
  const s = Store.addPage(null, { text: 'Mehrzeilig' });
  /* Erst ein Rechenblatt anlegen, damit es einen Platzhalter gibt. */
  Store.addBlock(s.id, 'spreadsheet', { text: '', zellen: { A1: { w: '42' } } });
  const md = Werkzeuge.alsMarkdown(Store.getBlock(s.id));
  /* Und darum herum Code und eine Tabelle bauen. */
  const gebaut = [
    '- Aufgabe',
    '  ```js',
    '  if (x) {',
    '    tuWas();',      /* zwei Leerzeichen MEHR — die gehören dem Code */
    '  }',
    '  ```',
    '  | Jahr | Wert |',
    '  |---|---|',
    '  | 2026 | 19 |',
    md.trim(),
    'Ein Satz danach.',
  ].join('\n');
  Werkzeuge.ausMarkdown(Store.getBlock(s.id), gebaut);
  const b = baum(s.id);
  const code = Store.childrenOf(s.id).flatMap((x: any) => Store.childrenOf(x.id))
    .find((x: any) => x.type === 'code');
  const tab = Store.childrenOf(s.id).flatMap((x: any) => Store.childrenOf(x.id))
    .find((x: any) => x.type === 'table');
  return { baum: b, codeText: code?.text || '', codeLang: code?.lang || '',
           zeilen: JSON.stringify(tab?.rows || null) };
}, BAUM);

p('Der Codeblock hängt unter der Aufgabe',
  /bullet@0:Aufgabe \| code@1:/.test(mehrzeilig.baum), mehrzeilig.baum);
/* Der Einzug des Zauns gehört zum Markdown und muss weg; der Einzug INNEN
   gehört zum Code und muss bleiben. `trim()` würde beides nehmen. */
gleich('Und sein Inhalt steht ohne den Markdown-Einzug da',
  mehrzeilig.codeText, 'if (x) {\n  tuWas();\n}');
gleich('Samt Sprache', mehrzeilig.codeLang, 'js');
p('Die Tabelle hängt auch dort',
  /table@1:/.test(mehrzeilig.baum), mehrzeilig.baum);
gleich('Mit ihren Zeilen', mehrzeilig.zeilen,
  JSON.stringify([['Jahr', 'Wert'], ['2026', '19']]));
p('Das Rechenblatt hat den Rundlauf überlebt (E113)',
  /spreadsheet@0:/.test(mehrzeilig.baum), mehrzeilig.baum);
p('Und der Satz danach steht wieder oben',
  /text@0:Ein Satz danach\./.test(mehrzeilig.baum), mehrzeilig.baum);

/* ==========================================================================
 * §5 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n5 · Was der Quelltext verspricht');

const code = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/dienst.ts'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

p('Es gibt einen Stapel von Eltern', /const stapel: string\[\] = \[p\.id\]/.test(code));
p('Ein Tabulator zählt als zwei Schritte', /replace\(\/\\t\/g, '  '\)/.test(code));
p('Und ein zu tiefer Sprung wird abgefangen',
  /Math\.min\(tiefeVon\(roh\), stapel\.length - 1\)/.test(code));
gleich('Keine Zeile hängt sich mehr blind an die Seite',
  (code.match(/Store\.addBlock\(p\.id, '/g) || []).length, 0);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
