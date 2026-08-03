/* ============================================================================
 * bauen.js — baut redion-einzeldatei.html
 * ----------------------------------------------------------------------------
 * Nimmt index.html, das Stilblatt und alle Skripte und schreibt daraus eine
 * einzige Datei, die man per Doppelklick öffnen oder weitergeben kann.
 *
 *   node bauen.js
 * ==========================================================================*/
const fs = require('fs');
const pfad = require('path');

const wurzel = __dirname;
const lies = (p) => fs.readFileSync(pfad.join(wurzel, p), 'utf8');

let html = lies('index.html');

/* Stilblätter einsetzen — ALLE, in der Reihenfolge, in der sie im HTML stehen.
   Hier fehlte das g: solange es nur ein Stilblatt gab, fiel das nicht auf.
   Ab dem zweiten hätte die Einzeldatei die übrigen als <link> behalten — und
   ein <link> auf quell/schale/stil/… geht ins Leere, sobald die Datei allein
   irgendwo liegt. Sie hätte gestartet und wäre unfertig gewesen: die halbe
   Gestaltung fehlt, aber nichts meldet einen Fehler. */
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g,
  (_, datei) => '<style>\n/* ===== ' + datei + ' ===== */\n' + lies(datei) + '\n</style>');

/* Skripte einsetzen — in der Reihenfolge, in der sie im HTML stehen */
html = html.replace(/<script src="(quell\/[^"]+)"><\/script>/g, (_, datei) =>
  '<script>\n/* ===== ' + datei + ' ===== */\n' + lies(datei) + '\n</script>');

fs.writeFileSync(pfad.join(wurzel, 'redion-einzeldatei.html'), html);
const kb = (fs.statSync(pfad.join(wurzel, 'redion-einzeldatei.html')).size / 1024).toFixed(0);
console.log('redion-einzeldatei.html geschrieben — ' + kb + ' KB');
