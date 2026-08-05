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

/* Stilblätter einsetzen — ALLE, in der Reihenfolge, in der sie im HTML stehen.
   Hier fehlte das g: solange es nur ein Stilblatt gab, fiel das nicht auf.
   Ab dem zweiten hätte die Einzeldatei die übrigen als <link> behalten — und
   ein <link> auf quell/schale/stil/… geht ins Leere, sobald die Datei allein
   irgendwo liegt. Sie hätte gestartet und wäre unfertig gewesen: die halbe
   Gestaltung fehlt, aber nichts meldet einen Fehler. */
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g,
  (_m: string, datei: string) =>
    '<style>\n/* ===== ' + datei + ' ===== */\n' + lies(datei) + '\n</style>');

/* Skripte einsetzen — in der Reihenfolge, in der sie im HTML stehen */
html = html.replace(/<script src="(quell\/[^"]+)"><\/script>/g,
  (_m: string, datei: string) =>
    '<script>\n/* ===== ' + datei + ' ===== */\n' + lies(datei) + '\n</script>');

fs.writeFileSync(pfad.join(wurzel, 'redion-einzeldatei.html'), html);
const kb = (fs.statSync(pfad.join(wurzel, 'redion-einzeldatei.html')).size / 1024).toFixed(0);
console.log('redion-einzeldatei.html geschrieben — ' + kb + ' KB');
