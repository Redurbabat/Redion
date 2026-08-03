#!/usr/bin/env node
/* ============================================================================
 * pruefungen/alle.js — alle Prüfläufe nacheinander
 * ----------------------------------------------------------------------------
 *     node pruefungen/alle.js              alles
 *     node pruefungen/alle.js 33 85 86     nur diese
 *     node pruefungen/alle.js server       nur die Serverläufe
 *     node pruefungen/alle.js --schnell    ohne die langsamen Messläufe
 *     node pruefungen/alle.js --alt        auch die alten aus pruefungen/alt
 *
 * Zwei Dinge, die nicht offensichtlich sind und sonst eine Stunde kosten:
 *
 *   1. **Drei Sekunden Pause zwischen den Läufen.** Ohne sie werden sie
 *      flockig: Playwright braucht einen Moment, um Ports freizugeben, und
 *      IndexedDB hält die Datenbank kurz gesperrt. Ein Lauf, der einzeln
 *      grün ist und in der Reihe rot, ist fast immer das — nicht ein Fehler
 *      im Code.
 *
 *   2. **Jeder Lauf ist ein eigener Prozess.** Sie teilen nichts, und ein
 *      Absturz reisst die anderen nicht mit. Dafür dauert das Ganze länger;
 *      das ist der Preis dafür, dass ein rotes Ergebnis wirklich etwas
 *      bedeutet.
 * ==========================================================================*/

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HIER  = __dirname;
const LAUF  = path.join(HIER, 'lauf');
const ALT   = path.join(HIER, 'alt');

/* Läufe, die messen statt zu prüfen — sie dauern lang und sagen nichts
   über richtig oder falsch. Bei --schnell bleiben sie aussen vor. */
const LANGSAM = ['test73.js', 'test74.js'];

const argumente = process.argv.slice(2);
const schnell  = argumente.includes('--schnell');
const auchAlt  = argumente.includes('--alt');
const nurServer = argumente.includes('server');
const zahlen   = argumente.filter(a => /^\d+$/.test(a));

const nummer = (name) => {
  const m = name.match(/^test(\d*)\./);
  return m ? Number(m[1] || 1) : 0;
};

const sammeln = (ordner) => fs.existsSync(ordner)
  ? fs.readdirSync(ordner).filter(f => /\.(js|mjs)$/.test(f)).sort((a, b) => nummer(a) - nummer(b))
  : [];

let dateien = sammeln(LAUF).map(f => ({ ordner: LAUF, datei: f }));
if (auchAlt) dateien = dateien.concat(sammeln(ALT).map(f => ({ ordner: ALT, datei: f })));

if (zahlen.length)
  dateien = dateien.filter(x => zahlen.includes(String(nummer(x.datei))));
if (nurServer)
  dateien = dateien.filter(x => /^(servercheck|test7[5-9]|test8[0-6])/.test(x.datei));
if (schnell)
  dateien = dateien.filter(x => !LANGSAM.includes(x.datei));

if (!dateien.length) {
  console.log('Nichts gefunden. Liegt pruefungen/lauf/ an seinem Platz?');
  process.exit(1);
}

console.log('');
console.log('  ' + dateien.length + ' Prüfläufe' + (schnell ? ' (ohne die Messläufe)' : ''));
console.log('  ' + '─'.repeat(60));

const warten = (ms) => spawnSync(process.execPath, ['-e', `setTimeout(()=>{},${ms})`], { timeout: ms + 2000 });

let gut = 0, schlecht = 0;
const gescheitert = [];
const t0 = Date.now();

dateien.forEach(({ ordner, datei }, i) => {
  const r = spawnSync(process.execPath, [path.join(ordner, datei)],
    { encoding: 'utf8', timeout: 420000, cwd: path.resolve(HIER, '..') });

  const text = (r.stdout || '') + (r.stderr || '');
  const zeile = (text.match(/\d+\/\d+ bestanden|\d+ ok, \d+ offen/g) || []).pop() || '';
  const rot   = (text.match(/^❌|✗ /gm) || []).length;
  const heil  = rot === 0 && r.status === 0;

  if (heil) { gut++; console.log('  ✅ ' + datei.padEnd(18) + zeile); }
  else {
    schlecht++;
    gescheitert.push(datei);
    console.log('  ❌ ' + datei.padEnd(18) + (zeile || 'abgebrochen'));
    (text.match(/^(❌|  ✗ ).*/gm) || []).slice(0, 4).forEach(z => console.log('       ' + z.trim()));
  }

  /* Die Pause, ohne die sie flockig werden. */
  if (i < dateien.length - 1) warten(3000);
});

const dauer = Math.round((Date.now() - t0) / 1000);
console.log('  ' + '─'.repeat(60));
console.log('  ' + gut + ' grün, ' + schlecht + ' rot — ' +
            Math.floor(dauer / 60) + ' min ' + (dauer % 60) + ' s');
if (gescheitert.length) {
  console.log('');
  console.log('  Noch einmal einzeln:');
  gescheitert.forEach(f => console.log('    node pruefungen/lauf/' + f));
}
console.log('');
process.exit(schlecht ? 1 : 0);
