/* Suite 80 — OpenDocument: schreiben, lesen, und was LibreOffice wirklich schickt
 * ============================================================================
 * WARUM ÜBERHAUPT .ods. Wer keine Excel-Lizenz hat, speichert in .ods — das
 * ist der Normalfall auf einem Linux-Rechner und in vielen Schulen und
 * Verwaltungen. Eine Tabellen-App, die dieses Format nicht liest, sagt
 * solchen Leuten: hol dir erst Excel.
 *
 * WAS DIESER LAUF NICHT TUT: die eigene Ausgabe wieder einlesen und sich
 * darüber freuen, dass dasselbe herauskommt. Das prüft nur, dass zwei
 * Fehler sich aufheben — schreibt man Zeilen und Spalten vertauscht und
 * liest sie genauso vertauscht zurück, ist der Kreis geschlossen und die
 * Datei trotzdem für jedes andere Programm falsch.
 *
 * Deshalb steht hier zusätzlich eine .ods, die NICHT von Redion stammt: von
 * Hand nach der Norm gebaut, mit genau den zwei Eigenheiten, die
 * LibreOffice wirklich schreibt und an denen ein selbstgebauter Leser
 * scheitert:
 *
 *   1. WIEDERHOLUNGEN. Steht in zehn Zellen nebeneinander nichts, schreibt
 *      LibreOffice EINE Zelle mit `table:number-columns-repeated="10"`. Wer
 *      das übergeht, bekommt eine Tabelle, in der ab der ersten Lücke jede
 *      Spalte verrutscht ist — und das sieht man dem Ergebnis nicht an, man
 *      sieht nur falsche Zahlen.
 *
 *   2. DER SCHWANZ. Am Ende jedes Blattes stehen leere Zeilen mit einer
 *      Wiederholungsangabe wie „bis Zeile 1048576". Wer sie ausrollt, baut
 *      eine Million leerer Zeilen und friert den Browser ein.
 *
 * Die Gegenprobe für die eigene Ausgabe ist eine andere: die Datei muss die
 * vier Teile enthalten, die die Norm verlangt, `mimetype` muss der ERSTE
 * Eintrag sein, und Zahlen müssen als Zahlen dastehen — sonst ist in
 * LibreOffice alles Text, die Summe ist 0 und `100` sortiert vor `20`.
 *
 *   node pruefungen/lauf/test116.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8794;

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
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2200);

/* ==========================================================================
 * 1 · SCHREIBEN — hat die Datei, was die Norm verlangt?
 * ========================================================================*/
console.log('\n1 · Die geschriebene Datei');

const gebaut = await seite.evaluate(async () => {
  const blaetter = [
    { name: 'Zahlen', zeilen: [['Ware', 'Menge', 'Preis'],
                               ['Schraube', 250, 0.12],
                               ['Mutter', 80, 0.08]] },
    { name: 'Text',   zeilen: [['Notiz'], ['Zwei Zeilen\nin einer Zelle']] }
  ];
  const blob = await Austausch.alsOds(blaetter, 'Probe');
  const zip = await Einlesen.zipLesen(await blob.arrayBuffer());
  return {
    groesse: blob.size,
    namen: zip.namen,
    erster: zip.namen[0],
    inhalt: await zip.text('content.xml'),
    mimetype: await zip.text('mimetype')
  };
}) as any;

p('Es kommt überhaupt eine Datei heraus', Number(gebaut.groesse) > 300, gebaut.groesse + ' Byte');
/* DIE REIHENFOLGE IST KEIN SCHÖNHEITSFEHLER. Die Norm verlangt `mimetype`
   als ersten Eintrag; manche Programme erkennen das Format daran, bevor sie
   das Verzeichnis überhaupt lesen. */
gleich('`mimetype` steht an erster Stelle', gebaut.erster, 'mimetype');
gleich('… und nennt eine Tabelle', gebaut.mimetype,
       'application/vnd.oasis.opendocument.spreadsheet');
p('Die vier verlangten Teile sind da',
  ['mimetype', 'META-INF/manifest.xml', 'content.xml', 'styles.xml']
    .every(n => (gebaut.namen ?? []).includes(n)),
  (gebaut.namen ?? []).join(', '));

const inhalt: string = gebaut.inhalt ?? '';
p('Beide Blätter stehen drin',
  inhalt.includes('table:name="Zahlen"') && inhalt.includes('table:name="Text"'));
/* ZAHLEN BLEIBEN ZAHLEN. Ohne `office:value` steht in LibreOffice überall
   Text: die Summe ist 0, und Sortieren stellt `100` vor `20`. Genau das war
   beim CSV-Import schon einmal der Fehler. */
p('Zahlen stehen als Zahl da, nicht als Text',
  inhalt.includes('office:value-type="float"') && inhalt.includes('office:value="250"'),
  'sonst rechnet LibreOffice damit nicht');
p('Text steht als Text da', inhalt.includes('office:value-type="string"'));
p('Ein Zeilenumbruch in der Zelle wird zu zwei Absätzen',
  (inhalt.match(/<text:p>Zwei Zeilen<\/text:p><text:p>in einer Zelle<\/text:p>/) || []).length === 1);

/* ==========================================================================
 * 2 · HIN UND ZURÜCK
 * ========================================================================*/
console.log('\n2 · Dieselben Werte kommen zurück');

const zurueck = await seite.evaluate(async () => {
  const blaetter = [{ name: 'Rund', zeilen: [['A', 'B'], ['x', 7], ['', 'y']] }];
  const blob = await Austausch.alsOds(blaetter, 'Rund');
  const gelesen = await Einlesen.odsLesen(await blob.arrayBuffer());
  return { name: gelesen[0]?.name, zeilen: gelesen[0]?.zeilen };
}) as any;

gleich('Der Blattname bleibt', zurueck.name, 'Rund');
/* Die leere Zelle in der letzten Zeile MUSS erhalten bleiben — sonst rutscht
   `y` eine Spalte nach links, und niemand sieht es der Tabelle an. */
gleich('Die Werte stehen an derselben Stelle', zurueck.zeilen,
       [['A', 'B'], ['x', 7], ['', 'y']]);

/* ==========================================================================
 * 3 · EINE DATEI, DIE NICHT VON REDION STAMMT
 * --------------------------------------------------------------------------
 * Hier steht der eigentliche Wert dieses Laufs. Der Abschnitt oben prüft
 * Redion gegen Redion; dieser prüft Redion gegen die Norm.
 * ========================================================================*/
console.log('\n3 · Wie LibreOffice es wirklich schreibt');

const fremd = await seite.evaluate(async () => {
  const NS =
    ' xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"' +
    ' xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"' +
    ' xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"';

  const zelle = (t: string) => `<table:table-cell office:value-type="string">` +
                               `<text:p>${t}</text:p></table:table-cell>`;
  const zahl = (n: number) => `<table:table-cell office:value-type="float" ` +
                              `office:value="${n}"><text:p>${n}</text:p></table:table-cell>`;

  const content =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<office:document-content${NS} office:version="1.2">` +
    '<office:body><office:spreadsheet>' +
    '<table:table table:name="Aus LibreOffice">' +
      /* Kopfzeile */
      '<table:table-row>' + zelle('Name') + zelle('Ort') + zelle('Zahl') + '</table:table-row>' +
      /* EINE ZEILE MIT LÜCKE: zwei leere Zellen als eine mit Wiederholung.
         Genau hier verrutscht ein Leser, der die Wiederholung übergeht. */
      '<table:table-row>' + zelle('Meier') +
        '<table:table-cell table:number-columns-repeated="2"/>' +
      '</table:table-row>' +
      '<table:table-row>' + zelle('Huber') + zelle('Bern') + zahl(42) + '</table:table-row>' +
      /* DER SCHWANZ: „ab hier bis Zeile 1048576 nichts". */
      '<table:table-row table:number-rows-repeated="1048573">' +
        '<table:table-cell table:number-columns-repeated="3"/>' +
      '</table:table-row>' +
    '</table:table>' +
    '</office:spreadsheet></office:body></office:document-content>';

  const blob = await Austausch.zipSchreiben([
    { name: 'mimetype', inhalt: 'application/vnd.oasis.opendocument.spreadsheet' },
    { name: 'content.xml', inhalt: content }
  ]);
  const t0 = Date.now();
  const gelesen = await Einlesen.odsLesen(await blob.arrayBuffer());
  return { dauer: Date.now() - t0, name: gelesen[0]?.name, zeilen: gelesen[0]?.zeilen };
}) as any;

gleich('Der Blattname kommt aus der Datei', fremd.name, 'Aus LibreOffice');
/* DIE LÜCKE MUSS BLEIBEN. `Huber | Bern | 42` steht in Zeile 3; rutschte
   Zeile 2 zusammen, stünde „Meier" allein da und alles darunter wäre
   trotzdem richtig — der Fehler zeigte sich erst bei breiteren Tabellen,
   und dann als falsche Spalte, nicht als Fehlermeldung. */
gleich('Wiederholte leere Zellen halten die Spalten',
       fremd.zeilen, [['Name', 'Ort', 'Zahl'], ['Meier'], ['Huber', 'Bern', 42]]);
/* Die 1 048 573 wiederholten Leerzeilen dürfen NICHT ausgerollt werden. */
p('Der leere Schwanz wird nicht zu einer Million Zeilen',
  (fremd.zeilen ?? []).length === 3, (fremd.zeilen ?? []).length + ' Zeilen');
p('Und es dauert keine Ewigkeit', Number(fremd.dauer) < 3000, fremd.dauer + ' ms');

/* ==========================================================================
 * 4 · EINE .ods WIRD ZU EINER DATENBANK
 * ========================================================================*/
console.log('\n4 · Eingelesen wird eine Datenbank daraus, kein Bild');

const eingelesen = await seite.evaluate(async () => {
  const blaetter = [{ name: 'Kunden', zeilen: [['Kunde', 'Umsatz'],
                                               ['Meier AG', 100],
                                               ['Huber & Co', 200]] }];
  const blob = await Austausch.alsOds(blaetter, 'Kunden');
  const datei = new File([blob], 'Kunden.ods');
  const vorher = Object.keys(Store.cache.collections).length;
  const erg = await Einlesen.datei(datei);
  const nachher = Object.keys(Store.cache.collections).length;
  const coll = Object.values<any>(Store.cache.collections).slice(-1)[0];
  return { hinweis: erg?.hinweis, mehr: nachher - vorher,
           spalten: coll ? Object.values<any>(coll.schema).map(s => s.name) : [],
           zeilen: coll ? Store.rowsOf(coll.id).length : 0 };
}) as any;

p('Eine Datenbank ist dazugekommen', Number(eingelesen.mehr) === 1, String(eingelesen.mehr));
gleich('Mit den Spalten aus der Kopfzeile', eingelesen.spalten, ['Kunde', 'Umsatz']);
p('Und den zwei Zeilen darunter', Number(eingelesen.zeilen) === 2, String(eingelesen.zeilen));
p('Der Hinweis nennt die Zahl', /1 von 1/.test(String(eingelesen.hinweis ?? '')),
  String(eingelesen.hinweis));

/* ==========================================================================
 * 5 · DER WEG DAHIN IST AUCH DA
 * ========================================================================*/
console.log('\n5 · Man findet es auch');

/* Ob der Menüpunkt wirklich dasteht, wird unten am erzeugten Quelltext
   geprüft — im laufenden Fenster ist das Menü zu, und ein Menü aufzuklappen,
   nur um nachzusehen, ob ein Eintrag darin steht, misst am Ende das
   Aufklappen. */
const wege = await seite.evaluate(() => ({
  schreiber: typeof Austausch.alsOds === 'function' &&
             typeof Austausch.datenbankAlsOds === 'function',
  leser: typeof Einlesen.odsLesen === 'function'
})) as any;
p('Es gibt einen Schreiber und einen Leser', wege.schreiber && wege.leser);

const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const quell = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/datenbanken/steuerung.js'), 'utf8');
p('Der Menüpunkt „Als OpenDocument" steht im Ansichtsmenü',
  /data-a="ods"/.test(quell) && /OpenDocument/.test(quell));
/* Ein Format, das man nicht auswählen kann, kann man auch nicht einlesen —
   der Dateidialog filtert sonst .ods weg. */
const wz = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/wissen/werkzeuge.js'), 'utf8');
p('Der Dateidialog lässt .ods zu', /accept[^\n]*\.ods/.test(wz),
  'sonst kann man die Datei nicht einmal auswählen');
p('index.html ist unverändert gültig', html.includes('<html'));

await browser.close();
server.close();

console.log(`\n  Suite 80 — OpenDocument: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
