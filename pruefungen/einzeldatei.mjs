/* Die Einzeldatei: läuft sie wirklich, und ist wirklich alles drin?
 * ----------------------------------------------------------------------------
 * `redion-einzeldatei.html` ist das, was man weitergibt — die README sagt
 * ausdrücklich „Lieber eine einzige Datei? redion-einzeldatei.html enthält
 * alles." Geprüft wurde sie nie, und das ist teuer geworden:
 *
 * In vier Quelldateien standen Steuerzeichen **roh** im Text — ein NUL als
 * Trennzeichen in Pivot-Schlüsseln, eines in einem Vergleich, und zweimal
 * ein Bereich `[NUL-US]` mitten in einer regulären Ausdrucksklasse. Als
 * getrennte .js-Dateien ist das gültig und läuft. In der Einzeldatei nicht:
 * der HTML-Parser ersetzt ein NUL nach Vorschrift durch U+FFFD. Aus
 * `[NUL-US]` wird damit `[U+FFFD-US]` — ein Bereich von 65533 bis 31, also
 * verkehrt herum. Der reguläre Ausdruck wird beim Einlesen gebaut, nicht beim
 * Aufruf; er reisst also den **ganzen** Skriptblock mit.
 *
 * Betroffen war ausgerechnet `kern/sicherheit/saeubern.js` — die Datei, die
 * fremdes HTML entschärft. In der weitergegebenen Einzeldatei gab es sie
 * schlicht nicht: `Saeubern` war `undefined`. Alles, was aus der
 * Zwischenablage, dem Web-Clipper, einem Import oder einer Einbettung kam,
 * lief ungeprüft durch. Gemerkt hätte das niemand — die App startete, die
 * Seitenleiste stand da, nichts sah kaputt aus.
 *
 * Deshalb dieser Lauf. Er prüft zwei Dinge, die zusammengehören: dass in
 * keiner Quelldatei rohe Steuerzeichen stehen, und dass die gebaute
 * Einzeldatei ohne einen einzigen Fehler startet und ihre Module hat.
 *
 *   node pruefungen/einzeldatei.mjs
 * ==========================================================================*/

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let ok = 0, bad = 0;
const pruef = (n, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const WURZELORDNER = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* ======================================================================== *
 * 1 · ROHE STEUERZEICHEN IM QUELLTEXT
 * Ohne Browser, in Millisekunden — und findet genau die Sorte Fehler, die
 * einen erst drei Ebenen später einholt.
 * ======================================================================== */
console.log('\n--- Steuerzeichen im Quelltext ---');

const alleDateien = (ordner) => fs.readdirSync(ordner, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? alleDateien(path.join(ordner, e.name))
                                : [path.join(ordner, e.name)]);

const quellen = alleDateien(path.join(WURZELORDNER, 'quell'))
  .filter(f => f.endsWith('.js') || f.endsWith('.css'));

/* Erlaubt sind Tabulator (9), Zeilenumbruch (10) und Wagenrücklauf (13).
   Alles andere unter 32 gehört als Escape-Folge geschrieben, nicht roh. */
const schmutzig = quellen.filter(f => {
  const d = fs.readFileSync(f);
  return d.some(b => b < 9 || (b > 13 && b < 32));
}).map(f => path.relative(WURZELORDNER, f));

pruef('Keine Quelldatei hat rohe Steuerzeichen', schmutzig, []);
pruef('Und es wurden wirklich Dateien angesehen', quellen.length > 80, true);

/* ======================================================================== *
 * 2 · DIE EINZELDATEI IST AKTUELL
 * ======================================================================== */
console.log('\n--- Ist alles drin? ---');

const einzel = path.join(WURZELORDNER, 'redion-einzeldatei.html');
pruef('Die Einzeldatei ist da', fs.existsSync(einzel), true);

const html = fs.readFileSync(WURZELORDNER + '/index.html', 'utf8');
const gebaut = fs.readFileSync(einzel, 'utf8');
const skripte = [...html.matchAll(/<script src="(quell\/[^"]+)"><\/script>/g)].map(m => m[1]);

pruef('index.html nennt Skripte', skripte.length > 80, true);
const fehlend = skripte.filter(s => !gebaut.includes('/* ===== ' + s + ' ===== */'));
pruef('Jedes davon steckt in der Einzeldatei', fehlend, []);

/* ======================================================================== *
 * 3 · SIE STARTET — OHNE EINEN EINZIGEN FEHLER
 * ======================================================================== */
console.log('\n--- Startet sie? ---');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const p = await ctx.newPage();
const fehler = [];
p.on('pageerror', e => fehler.push(e.message));

await p.goto('file://' + einzel);
await p.waitForFunction(
  () => typeof App !== 'undefined' &&
        (document.getElementById('tree') || {}).childElementCount > 0,
  null, { timeout: 30000 });

const stand = await p.evaluate(() => ({
  app:          typeof App,
  store:        typeof Store,
  seitenleiste: typeof Seitenleiste,
  saeubern:     typeof Saeubern,
  datenbank:    typeof Datenbank,
  baum:         document.getElementById('tree').childElementCount,
  werkzeuge:    document.querySelectorAll('#tree [data-wz]').length
}));
pruef('Die App steht',             stand.app, 'object');
pruef('Der Speicher steht',        stand.store, 'object');
pruef('Die Seitenleiste steht',    stand.seitenleiste, 'object');
pruef('Die Datenbanken stehen',    stand.datenbank, 'object');
pruef('Und der Baum ist gezeichnet', stand.baum > 0, true);
pruef('Mit seinen Werkzeugen',     stand.werkzeuge, 7);

/* Das Herzstück des Fundes: die Säuberung muss es geben, und sie muss
   arbeiten. „Vorhanden" allein hätte hier nichts bewiesen. */
pruef('Die Säuberung ist da',      stand.saeubern, 'object');
const sauber = await p.evaluate(() => typeof Saeubern === 'undefined' ? null : ({
  gut:    Saeubern.adresseOk('https://example.com'),
  boese:  Saeubern.adresseOk('javascript:alert(1)'),
  skript: Saeubern.html('<p>Hallo</p><script>alert(1)<\/script>').includes('script'),
  text:   Saeubern.html('<p>Hallo</p>').includes('Hallo')
}));
pruef('Eine richtige Adresse geht durch',   sauber?.gut, true);
pruef('javascript: kommt nicht durch',      sauber?.boese, false);
pruef('Ein Skript wird herausgenommen',     sauber?.skript, false);
pruef('Der Text bleibt aber stehen',        sauber?.text, true);

/* ======================================================================== */
console.log(`\n${ok}/${ok + bad} bestanden`);
console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');

await browser.close();
process.exit(bad || fehler.length ? 1 : 0);
