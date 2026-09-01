/* Suite 252 — Der DOCX-Import hat jetzt einen Prüflauf (L72, Teil 1)
 * ============================================================================
 * Der Word-Leser der Visionskarte fand es: `docxLesen` war der EINZIGE
 * Einlese-Weg ohne Test — test49 prüft nur die Ausgabe. Nach §30 ist das
 * eine Pflichtlücke, unabhängig davon, wann die Formatierung kommt.
 *
 * §1 DER RUNDLAUF: eine Redion-Seite geht als .docx hinaus (Austausch
 *    .alsWord, von test49 mit CRC geprüft) und über Einlesen.datei wieder
 *    herein. Titel wird H1, Überschrift bleibt Überschrift, Zitat bleibt
 *    Zitat, Listenpunkte bleiben Listenpunkte, die Tabelle behält ihre
 *    Zeilen, Umlaute und Ω überleben.
 * §2 EINE FREMDE DEUTSCHE WORD-DATEI: von Hand gebaut, mit den Stil-IDs,
 *    die deutsches Word wirklich schreibt („berschrift2", „Zitat") und
 *    einer Nummerierung über w:numPr statt Stilnamen — die toleranten
 *    Erkennungswege, die der Rundlauf allein nie berühren würde.
 * §3 WAS HEUTE VERLOREN GEHT, geht wenigstens nicht STILL verloren:
 *    `**fett**` steht wörtlich da (LUECKEN.md L72 dokumentiert es), aber
 *    der TEXT kommt vollständig an.
 * ==========================================================================*/
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = 9013;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2'
};
const server = createServer((q, a) => {
  let pfad = join(WURZEL, decodeURIComponent((q.url || '/').split('?')[0]!));
  if (existsSync(pfad) && statSync(pfad).isDirectory()) pfad = join(pfad, 'index.html');
  if (!existsSync(pfad) || !pfad.startsWith(WURZEL)) { a.statusCode = 404; a.end('weg'); return; }
  a.setHeader('Content-Type', TYP[extname(pfad)] || 'application/octet-stream');
  a.end(readFileSync(pfad));
});
await new Promise<void>(f => server.listen(PORT, () => f()));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 950 } });
const fehler: string[] = [];
p.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));

let ok = 0, weg = 0;
const pr = (name: string, gut: unknown, ist = ''): void => {
  if (gut) ok++; else weg++;
  console.log((gut ? '  ✓ ' : '  ✗ ') + name + (gut || !ist ? '' : ' — ' + ist));
};

await p.goto(`http://localhost:${PORT}/index.html`);
await p.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
  (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
await p.evaluate(() => { Store.setMeta('rundgangGesehen', true); });

console.log('\n1 · Der Rundlauf: hinaus als Word, herein als Blöcke');
const rundlauf = await p.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Wochenbericht KW 35' });
  Store.addBlock(s.id, 'h2', { text: 'Aufbau der Messschaltung' });
  Store.addBlock(s.id, 'p', { text: 'Der Vorwiderstand hat 4.7 kΩ; die Prüfspannung betrug zwölf Volt. Grösse und Gewicht ändern sich nicht — äöüß bleiben äöüß.' });
  Store.addBlock(s.id, 'quote', { text: 'Wer misst, misst Mist — ausser er weiss, was sein Messgerät tut.' });
  Store.addBlock(s.id, 'bullet', { text: 'Spannungsmesser parallel' });
  Store.addBlock(s.id, 'bullet', { text: 'Strommesser in Reihe' });
  Store.addBlock(s.id, 'table', { rows: [['Fach', 'Note'], ['Elektrotechnik', '5.5'], ['Mathematik', '4.0']], kopfZeile: true });
  const blob = await Austausch.alsWord(Store.getBlock(s.id));
  const puffer = await blob.arrayBuffer();
  const kopf = new Uint8Array(puffer.slice(0, 2));
  const erg = await Einlesen.datei(new File([puffer], 'wochenbericht.docx',
    { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), undefined);
  const drin = Store.childrenOf(erg.seite.id).map((x: any) => ({ typ: x.type, text: String(x.text || ''), rows: x.rows }));
  return { pk: kopf[0] === 0x50 && kopf[1] === 0x4b, hinweis: erg.hinweis, drin,
           seitenName: String(erg.seite.text || '') };
});
pr('Die Ausgabe ist ein echtes ZIP (PK) — dieselbe, die test49 mit CRC prüft', rundlauf.pk);
pr('Der Import meldet, was er übernommen hat', /übernommen/.test(rundlauf.hinweis), rundlauf.hinweis);
pr('Die neue Seite heisst wie die Datei', rundlauf.seitenName === 'wochenbericht', rundlauf.seitenName);
const titelBlock = rundlauf.drin[0];
pr('Der Seitentitel kommt als H1 zurück (alsWord schreibt ihn als Heading1)',
  !!titelBlock && titelBlock.typ === 'h1' && titelBlock.text === 'Wochenbericht KW 35',
  JSON.stringify(titelBlock));
pr('Die Überschrift bleibt eine Überschrift (h2)',
  rundlauf.drin.some((x: any) => x.typ === 'h2' && x.text === 'Aufbau der Messschaltung'),
  JSON.stringify(rundlauf.drin.map((x: any) => x.typ)));
pr('Der Absatz kommt vollständig an — mit kΩ, äöüß und Gedankenstrich',
  rundlauf.drin.some((x: any) => x.text.includes('4.7 kΩ') && x.text.includes('äöüß bleiben äöüß')),
  (rundlauf.drin.find((x: any) => /kΩ/.test(x.text)) || { text: '(fehlt)' }).text.slice(0, 90));
pr('Das Zitat bleibt ein Zitat',
  rundlauf.drin.some((x: any) => x.typ === 'quote' && /Wer misst, misst Mist/.test(x.text)));
pr('Beide Listenpunkte bleiben Listenpunkte',
  rundlauf.drin.filter((x: any) => x.typ === 'bullet').length === 2 &&
  rundlauf.drin.some((x: any) => x.typ === 'bullet' && x.text === 'Strommesser in Reihe'),
  JSON.stringify(rundlauf.drin.filter((x: any) => x.typ === 'bullet')));
const tabelle = rundlauf.drin.find((x: any) => x.typ === 'table');
pr('Die Tabelle behält ihre drei Zeilen und zwei Spalten',
  !!tabelle && Array.isArray(tabelle.rows) && tabelle.rows.length === 3 &&
  tabelle.rows[1][0] === 'Elektrotechnik' && tabelle.rows[2][1] === '4.0',
  JSON.stringify(tabelle?.rows));

console.log('\n2 · Eine fremde deutsche Word-Datei — Stil-IDs, wie Word sie wirklich schreibt');
const fremd = await p.evaluate(async () => {
  const wp = (inhalt: string) => '<w:p>' + inhalt + '</w:p>';
  const lauf = (t: string) => '<w:r><w:t xml:space="preserve">' + t + '</w:t></w:r>';
  const dokument =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    wp('<w:pPr><w:pStyle w:val="berschrift2"/></w:pPr>' + lauf('Versuchsauswertung')) +
    wp('<w:pPr><w:pStyle w:val="Zitat"/></w:pPr>' + lauf('Ohne Fleiss kein Preis.')) +
    wp('<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>' + lauf('Erster Punkt aus deutschem Word')) +
    wp(lauf('Ein ganz gewöhnlicher Absatz.')) +
    '</w:body></w:document>';
  const blob = await Austausch.zipSchreiben([
    { name: '[Content_Types].xml', inhalt:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>' },
    { name: '_rels/.rels', inhalt:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>' },
    { name: 'word/document.xml', inhalt: dokument }
  ]);
  const erg = await Einlesen.datei(new File([await blob.arrayBuffer()], 'aus-word.docx',
    { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), undefined);
  return Store.childrenOf(erg.seite.id).map((x: any) => ({ typ: x.type, text: String(x.text || '') }));
});
pr('„berschrift2" — die deutsche Stil-ID ohne Ü — wird eine Überschrift',
  fremd.some((x: any) => x.typ === 'h2' && x.text === 'Versuchsauswertung'), JSON.stringify(fremd));
pr('Der Stil „Zitat" wird ein Zitat',
  fremd.some((x: any) => x.typ === 'quote' && /Ohne Fleiss/.test(x.text)));
pr('w:numPr ohne Stilnamen wird ein Listenpunkt',
  fremd.some((x: any) => x.typ === 'bullet' && /Erster Punkt/.test(x.text)));
pr('Der gewöhnliche Absatz bleibt gewöhnlich',
  fremd.some((x: any) => (x.typ === 'text' || x.typ === 'p') && x.text === 'Ein ganz gewöhnlicher Absatz.'));

/* SEIT E315 GEHT HIER NICHTS MEHR VERLOREN, und dieser Abschnitt sagt es
   jetzt auch. Er hiess „Was verloren geht, geht nicht still verloren" und
   hielt fest, dass `**fett**` in Word wörtlich mit Sternchen dasteht.
   Der Export schreibt seit L72 Teil 2 echte `w:rPr`-Läufe, der Einleser
   liest sie zurück — der Text kommt IDENTISCH zurück, aber aus dem
   umgekehrten Grund: nicht weil nichts passiert ist, sondern weil beide
   Richtungen dasselbe können.

   Der Punkt wäre grün geblieben, ohne dass jemand es merkt. Genau davor
   warnt L97: eine Prüfung, deren Name nicht mehr stimmt, prüft etwas
   anderes als das, was dort steht. Dass die Sternchen INNERHALB der Datei
   verschwunden sind, misst test309 §3. */
console.log('\n3 · Auszeichnung überlebt den Rundlauf (seit E315)');
const fett = await p.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Formatprobe' });
  Store.addBlock(s.id, 'p', { text: 'Hier steht **fett** und *kursiv* im Text.' });
  const blob = await Austausch.alsWord(Store.getBlock(s.id));
  const erg = await Einlesen.datei(new File([await blob.arrayBuffer()], 'formatprobe.docx',
    { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), undefined);
  return Store.childrenOf(erg.seite.id).map((x: any) => String(x.text || '')).join(' | ');
});
pr('Fett und kursiv kommen als Auszeichnung zurück (E315, vorher als Sternchen)',
  fett.includes('**fett**') && fett.includes('*kursiv*'), fett.slice(0, 120));

pr('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await b.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
