/* ============================================================================
 * bauen.mts — baut redion-einzeldatei.html
 * ----------------------------------------------------------------------------
 * Nimmt index.html, das Stilblatt und alle Skripte und schreibt daraus eine
 * einzige Datei, die man per Doppelklick öffnen oder weitergeben kann.
 *
 *   node bauen.mts
 * ==========================================================================*/
import fs from 'node:fs';
import pfad from 'node:path';

/* `__dirname` gibt es in einem Modul nicht; `import.meta.dirname` ist sein
   Ersatz (ab Node 21.2). Nicht `new URL(import.meta.url).pathname` — das
   liefert unter Windows `/C:/…` mit einem führenden Schrägstrich, und jeder
   Dateizugriff darauf geht ins Leere. */
const wurzel = import.meta.dirname;
const lies = (p: string): string => fs.readFileSync(pfad.join(wurzel, p), 'utf8');

let html = lies('index.html');

/* Lokale CSS-Imports mitnehmen.

   Ein normales index.html darf ein Stilblatt in kleinere Stilblätter teilen.
   Die Einzeldatei darf diese Neben-Dateien aber nicht voraussetzen. Ein
   `@import url("./einfach.css")` würde nach dem Einbetten relativ zur
   Einzeldatei gesucht — also am falschen Ort — und die Oberfläche wäre dort
   unvollständig.

   Deshalb werden ausschliesslich lokale Imports rekursiv eingesetzt. URLs,
   data:-Adressen und andere externe Quellen bleiben unangetastet. Ein Kreis
   in lokalen Imports ist ein Baufehler und wird ausdrücklich gemeldet, statt
   eine halb gebaute Datei zu erzeugen. */
const cssMitImports = (datei: string, kette: string[] = []): string => {
  const normal = pfad.normalize(datei);
  if (kette.includes(normal)) {
    throw new Error('Kreis in CSS-Imports: ' + [...kette, normal].join(' -> '));
  }
  const basis = pfad.dirname(normal);
  const naechste = [...kette, normal];
  return lies(normal).replace(
    /@import\s+(?:url\(\s*)?["']([^"')]+)["']\s*\)?\s*;/g,
    (ganz: string, ziel: string) => {
      const z = String(ziel).trim();
      if (/^(?:[a-z]+:|\/\/|#)/i.test(z)) return ganz;
      const importDatei = pfad.normalize(pfad.join(basis, z));
      return '\n/* ===== import ' + importDatei.replace(/\\/g, '/') + ' ===== */\n' +
             cssMitImports(importDatei, naechste) + '\n';
    }
  );
};

/* Stilblätter einsetzen — ALLE, in der Reihenfolge, in der sie im HTML stehen.
   Hier fehlte das g: solange es nur ein Stilblatt gab, fiel das nicht auf.
   Ab dem zweiten hätte die Einzeldatei die übrigen als <link> behalten — und
   ein <link> auf quell/schale/stil/… geht ins Leere, sobald die Datei allein
   irgendwo liegt. Sie hätte gestartet und wäre unfertig gewesen: die halbe
   Gestaltung fehlt, aber nichts meldet einen Fehler. */
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g,
  (_m: string, datei: string) =>
    '<style>\n/* ===== ' + datei + ' ===== */\n' + cssMitImports(datei) + '\n</style>');

/* DIE PDF-BYTES IN DIE EINZELDATEI (E389).
 *
 * `index.html` lädt `quell/fremd/pdfjs/daten.js` seit dem 4. September NICHT
 * mehr über ein `<script src>` — 527 KB über die Leitung bei jedem Start,
 * für etwas, das nur beim Öffnen einer PDF gebraucht wird. Im Ordnerbetrieb
 * hängt `laden.js` die Datei bei Bedarf selbst ein.
 *
 * DIE EINZELDATEI KANN DAS NICHT: sie hat keinen Ordner neben sich, aus dem
 * sich nachladen liesse. Also werden die Bytes hier eingesetzt, an genau der
 * Stelle, an der die Marke steht — vor `laden.js`, damit `PDFJS_EINGEPACKT`
 * dasteht, bevor jemand danach fragt.
 *
 * WENN DIE MARKE FEHLT, BRICHT DER BAU AB. Ein stilles Weglassen wäre eine
 * Einzeldatei, die aussieht wie immer und beim ersten PDF sagt „die
 * Bibliothek fehlt" — die Sorte Fehler, die niemand beim Bauen bemerkt. */
const PDF_MARKE = /<!-- pdfjs-daten:[\s\S]*?-->/;
if (!PDF_MARKE.test(html)) {
  throw new Error('bauen.mts: die Marke „pdfjs-daten" fehlt in index.html — ' +
    'ohne sie hätte die Einzeldatei keine PDF-Bibliothek.');
}
html = html.replace(PDF_MARKE,
  () => '<script>\n/* ===== quell/fremd/pdfjs/daten.js ===== */\n' +
        lies('quell/fremd/pdfjs/daten.js') + '\n</script>');

/* Skripte einsetzen — in der Reihenfolge, in der sie im HTML stehen.
 *
 * `defer` WIRD DABEI WEGGELASSEN, und zwar richtig: seit E389 tragen die
 * 185 Zeilen in `index.html` ein `defer`, damit der Browser sie parallel
 * holt und der Parser nicht auf jede einzelne wartet. Ein INLINE-Skript
 * kennt kein `defer` — die Angabe gilt nur für externe Dateien und würde
 * hier nur stumm dastehen. Die Reihenfolge bleibt dieselbe: eingesetzte
 * Skripte laufen beim Parsen der Reihe nach, genau wie deferred Skripte
 * nach dem Parsen der Reihe nach laufen.
 *
 * `\s+defer` steht als OPTION im Muster, nicht als Pflicht — sonst hinge
 * die Einzeldatei daran, dass jede Zeile es trägt, und eine ohne würde
 * still als `<script src>` in der Einzeldatei stehenbleiben. Genau das
 * fängt `test105`/`test74` nicht, weil die Datei ja gebaut WIRD. */
html = html.replace(/<script src="(quell\/[^"]+)"(?:\s+defer)?><\/script>/g,
  (_m: string, datei: string) =>
    '<script>\n/* ===== ' + datei + ' ===== */\n' + lies(datei) + '\n</script>');

/* Das BABAT-RED-Lernpaket bleibt im Projekt ein eigenständiges JSON-Artefakt.
   Die Einzeldatei darf jedoch keine Neben-Datei voraussetzen. Deshalb wird
   nur beim Einzeldatei-Bau der Inhalt in das vorhandene application/json-
   Element eingesetzt. \`<\` wird als JSON-Escape geschrieben, damit selbst
   ein Quelltextfragment \`</script>\` das Element nicht vorzeitig beendet. */
html = html.replace(
  /<script type="application\/json" id="redion-learning-package-babat"\s+data-src="([^"]+)"><\/script>/,
  (_m: string, datei: string) => {
    const paket = JSON.parse(lies(datei));
    const sicher = JSON.stringify(paket).replace(/</g, '\\u003c');
    return '<script type="application/json" id="redion-learning-package-babat" ' +
      'data-src="' + datei + '">\n' + sicher + '\n</script>';
  });

fs.writeFileSync(pfad.join(wurzel, 'redion-einzeldatei.html'), html);
const kb = (fs.statSync(pfad.join(wurzel, 'redion-einzeldatei.html')).size / 1024).toFixed(0);
console.log('redion-einzeldatei.html geschrieben — ' + kb + ' KB');