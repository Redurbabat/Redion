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

const PDF_LIB_MARKE = /<!-- pdf-lib-original:[\s\S]*?-->/;
if (!PDF_LIB_MARKE.test(html)) throw new Error('Die PDF-Lib-Marke fehlt in index.html.');
html = html.replace(PDF_LIB_MARKE, () => '<script type="application/octet-stream" id="redion-pdf-lib">' +
  Buffer.from(lies('quell/fremd/pdf-lib/library.js'), 'utf8').toString('base64') + '</script>');

/* DIE CHRONIK IN DIE EINZELDATEI (E613) — dasselbe aus demselben Grund.
 *
 * `chronik/daten.js` ist seit E613 nicht mehr im Startweg: 182 KB roh, 54 KB
 * über die Leitung, für einen Bildschirm hinter einem Zugangscode. Im
 * Ordnerbetrieb holt `chronik/laden.js` sie nach.
 *
 * Die Einzeldatei kann auch das nicht — also stehen die Bytes hier, vor
 * `laden.js`. `ChronikLaden.da()` sieht `window.ChronikDaten` dann schon
 * stehen und kehrt sofort zurück, ohne ein Skript einzuhängen. */
const CHRONIK_MARKE = /<!-- chronik-daten:[\s\S]*?-->/;
if (!CHRONIK_MARKE.test(html)) {
  throw new Error('bauen.mts: die Marke „chronik-daten" fehlt in index.html — ' +
    'ohne sie hätte die Einzeldatei keine Chronik.');
}
html = html.replace(CHRONIK_MARKE,
  () => '<script>\n/* ===== quell/bereiche/chronik/daten.js ===== */\n' +
        lies('quell/bereiche/chronik/daten.js') + '\n</script>');

/* DIE RELAIS-WERKSTATT IN DIE EINZELDATEI (E769) — dasselbe Muster wie die
 * Chronik: im Ordnerbetrieb lädt die Planfläche die drei Skripte erst, wenn
 * jemand die Werkstatt öffnet; die Einzeldatei hat keinen Ordner, also stehen
 * sie hier. Ihr Auswerten legt nur drei Konstanten an. */
const RELAIS_MARKE = /<!-- relais-werkstatt:[\s\S]*?-->/;
if (!RELAIS_MARKE.test(html)) {
  throw new Error('bauen.mts: die Marke „relais-werkstatt" fehlt in index.html — ' +
    'ohne sie hätte die Einzeldatei keine Relais-Werkstatt.');
}
html = html.replace(RELAIS_MARKE, () => ['relais-kern.js', 'relais-vorlagen.js', 'relais-werkstatt.js', 'schaltplan-pruefung.js']
  .map(d => '<script>\n/* ===== quell/bereiche/bloecke/arten/' + d + ' ===== */\n' +
    lies('quell/bereiche/bloecke/arten/' + d) + '\n</script>').join('\n'));

/* DIE REACT-INSELN IN DIE EINZELDATEI (E699) — dasselbe Muster, mit EINEM
 * Unterschied, und der ist der Punkt.
 *
 * pdf.js und die Chronik stehen hier als gewöhnliches `<script>`: ihr
 * Auswerten legt nur eine Konstante mit Daten an. React auszuwerten ist
 * Arbeit (rund 220 KB Code), und im Ordnerbetrieb geschieht das erst beim
 * ersten Gebrauch. Die Einzeldatei soll sich GLEICH verhalten: sie startet
 * ohne React. Also stehen die Bytes in `<script type="text/plain">` — das
 * liest der Parser, aber er führt es nicht aus. `Inseln.bereit()`
 * (`src/schale/inseln/laden.ts`) macht erst dann Skripte daraus, über
 * Blob-Adressen wie bei pdf.js, und aus dem dritten ein angenommenes
 * Stilblatt (`document.adoptedStyleSheets`) — kein `<link>`, denn in der
 * Einzeldatei steht keines (test492, E714), und kein `<style>` aus
 * TypeScript (test412).
 *
 * ROH EINGESETZT — deshalb darf in den Bytes kein `</script` stehen (er
 * beendete den Behälter) und kein `<!--` (er schaltet den Parser in einen
 * anderen Zustand). `bauen-inseln.mts` verweigert beides schon beim Bauen;
 * hier wird es noch einmal geprüft, weil ein Behälter, der zu früh endet,
 * eine Einzeldatei ergäbe, die startet und beim ersten Dialog zerbricht.
 *
 * WENN DIE MARKE FEHLT, BRICHT DER BAU AB — wie bei pdf.js. */
const INSELN_MARKE = /<!-- inseln-daten:[\s\S]*?-->/;
if (!INSELN_MARKE.test(html)) {
  throw new Error('bauen.mts: die Marke „inseln-daten" fehlt in index.html — ' +
    'ohne sie hätte die Einzeldatei keine React-Inseln.');
}
const behaelter = (id: string, datei: string): string => {
  const text = lies(datei);
  if (/<\/script|<!--/i.test(text)) {
    throw new Error('bauen.mts: ' + datei + ' enthält „</script" oder „<!--" — ' +
      'der Behälter in der Einzeldatei endete dort. `node bauen-inseln.mts` neu laufen lassen.');
  }
  return '<script type="text/plain" id="' + id + '">\n/* ===== ' + datei + ' ===== */\n' +
         text + '\n</script>';
};
html = html.replace(INSELN_MARKE, () => [
  behaelter('inseln-react', 'quell/fremd/react/react.js'),
  behaelter('inseln-js', 'quell/islands/islands.js'),
  behaelter('inseln-stil', 'quell/islands/islands.css')
].join('\n'));

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
/* Auch die zwei kleinen Batterie-Aufgaben-Skripte aus der Projektwurzel
 * gehören in die Weitergabe-Einzeldatei. Eine eingebettete Zeichenfläche,
 * deren Messungen nur mit Neben-Dateien laufen, wäre keine Einzeldatei. */
html = html.replace(/<script src="((?:quell\/[^"]+)|(?:batterie-(?:labor-kern|aufgaben)\.js))"(?:\s+defer)?><\/script>/g,
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

/* ==========================================================================
 * DIE SYMBOLE IN DIE EINZELDATEI (E527)
 * --------------------------------------------------------------------------
 * `index.html` verweist mit fünf `<link>` auf `oeffentlich/icons/…`. Im
 * Ordnerbetrieb liegen die Dateien daneben; die Einzeldatei hat keinen
 * Ordner neben sich (§29). Sie hatte damit KEIN Zeichen im Browserreiter —
 * und was ein Reiter ohne Zeichen zeigt, entscheidet der Browser: meist das
 * zuletzt gemerkte für diese Adresse. Redur sah deshalb weiter das alte
 * rote R, obwohl es das im Verzeichnis längst nicht mehr gibt.
 *
 * Dieselbe Bauart wie bei CSS und den PDF-Bytes darüber: die Bytes werden
 * eingesetzt, nicht verlinkt. Kostet rund 190 KB auf 9,3 MB.
 *
 * WENN EIN SYMBOL FEHLT, BRICHT DER BAU AB. Ein stilles Weglassen wäre
 * genau der Zustand, den dieser Abschnitt behebt.
 * ========================================================================*/
html = html.replace(
  /<link rel="(icon|apple-touch-icon)"([^>]*?)href="(oeffentlich\/icons\/[^"]+)">/g,
  (_m: string, art: string, mitte: string, datei: string) => {
    const voll = pfad.join(wurzel, datei);
    if (!fs.existsSync(voll)) throw new Error('bauen.mts: ' + datei + ' fehlt — ohne Symbol keine Einzeldatei.');
    const b64 = fs.readFileSync(voll).toString('base64');
    return '<link rel="' + art + '"' + mitte + 'href="data:image/png;base64,' + b64 + '">';
  });

/* DIE STARTBILDER FLIEGEN RAUS, statt eingesetzt zu werden.
   `apple-touch-startup-image` greift NUR, wenn die Seite auf dem
   Startbildschirm liegt — und dorthin kommt eine Datei von der Platte nicht.
   Sieben Vollbilder in Gerätegrösse wären 1,3 MB auf 9,4 MB, für etwas, das
   dort nie gezeigt wird. Ein Verweis auf eine Datei, die daneben nicht
   liegt, ist eine Zusage, die niemand einlösen kann; also weg. */
html = html.replace(
  /[ \t]*<link rel="apple-touch-startup-image"[\s\S]*?>\s*\n/g, '');

fs.writeFileSync(pfad.join(wurzel, 'redion-einzeldatei.html'), html);
const kb = (fs.statSync(pfad.join(wurzel, 'redion-einzeldatei.html')).size / 1024).toFixed(0);
console.log('redion-einzeldatei.html geschrieben — ' + kb + ' KB');