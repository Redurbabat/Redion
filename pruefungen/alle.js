/* ============================================================================
 * pruefungen/alle.js — alle Prüfläufe nacheinander
 * ----------------------------------------------------------------------------
 * `package.json` hat diesen Weg schon immer versprochen (`npm run pruefen`),
 * nur gab es den Ordner nicht. Die Läufe lagen unter `/tmp` auf genau einem
 * Rechner und waren damit für jeden anderen weg — auch für den, der das
 * Repository frisch auscheckt. Ein Prüfnetz, das nur an einem Ort hängt, ist
 * beim ersten Umzug keines mehr.
 *
 *   npm run pruefen              alles
 *   npm run pruefen seiten       nur die Läufe, deren Name das enthält
 *
 * Zwei Dinge macht diese Datei, die man von Hand vergisst:
 *
 *   1. ZWISCHEN ZWEI BROWSERLÄUFEN DREI SEKUNDEN PAUSE. Ohne sie werden sie
 *      flockig — der Port des vorigen Laufs ist noch belegt, und IndexedDB
 *      hält seine Sperre einen Moment länger als der Browser lebt. Das sieht
 *      dann aus wie ein Fehler im Code und ist keiner, was schlimmer ist:
 *      man sucht an der falschen Stelle.
 *   2. AM ENDE EINE ZAHL. Ein Lauf, der durchgelaufen ist, sagt nichts. Erst
 *      „4 von 4 Läufen grün" ist eine Aussage.
 *
 * Der Rückgabewert ist 0 nur dann, wenn jeder einzelne Lauf 0 war.
 * ==========================================================================*/

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const WURZEL = path.dirname(__dirname);

/* `browser: true` heisst: dieser Lauf startet Chromium und braucht danach
   seine Pause. Die reinen Serverläufe brauchen sie nicht. */
const LAEUFE = [
  { name: 'servercheck',  datei: 'server/servercheck.mjs',     browser: false,
    was: 'Der Server von unten: Anmeldung, Abgleich, Rechte' },
  { name: 'server-rechte', datei: 'server/test75.mjs',         browser: false,
    was: 'Rechte als Schloss, Veröffentlichen, /v1/, MCP' },
  { name: 'server-app',   datei: 'server/test76.mjs',          browser: true,
    was: 'Die App am Server, mit zwei Geräten' },
  { name: 'seitenleiste', datei: 'pruefungen/seitenleiste.mjs', browser: true,
    was: 'Abschnitte, Reihenfolge, Klappen, Reiter, Baum, Register' },
  { name: 'seite',        datei: 'pruefungen/seite.mjs',        browser: true,
    was: 'Kopf, Werkzeugzeile, Blöcke, Pfadleiste, Streifen' },
  { name: 'einzeldatei',  datei: 'pruefungen/einzeldatei.mjs',  browser: true,
    was: 'Was man weitergibt: startet sie, ist alles drin, säubert sie' }
];

const filter = process.argv[2];
const dran = filter
  ? LAEUFE.filter(l => l.name.includes(filter) || l.datei.includes(filter))
  : LAEUFE;

if (!dran.length) {
  console.error('Kein Lauf passt auf „' + filter + '". Vorhanden: ' +
                LAEUFE.map(l => l.name).join(', '));
  process.exit(1);
}

const schlafe = (ms) => {
  /* Absichtlich blockierend: die Läufe sollen nacheinander gehen, nicht
     nebeneinander. Genau das ist ja der Grund für die Pause. */
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const gescheitert = [];
let letzterWarBrowser = false;

dran.forEach((lauf, nr) => {
  if (letzterWarBrowser && lauf.browser) {
    console.log('\n   … drei Sekunden Pause, damit Port und IndexedDB frei werden');
    schlafe(3000);
  }

  console.log('\n════════════════════════════════════════════════════════════');
  console.log(`  ${nr + 1}/${dran.length}  ${lauf.name} — ${lauf.was}`);
  console.log('════════════════════════════════════════════════════════════');

  const a = spawnSync(process.execPath, [lauf.datei], { cwd: WURZEL, stdio: 'inherit' });
  if (a.status !== 0) gescheitert.push(lauf.name);
  letzterWarBrowser = lauf.browser;
});

console.log('\n════════════════════════════════════════════════════════════');
if (gescheitert.length) {
  console.log(`  ${dran.length - gescheitert.length}/${dran.length} Läufe grün` +
              ` — gescheitert: ${gescheitert.join(', ')}`);
} else {
  console.log(`  ${dran.length}/${dran.length} Läufe grün`);
}
console.log('════════════════════════════════════════════════════════════');

process.exit(gescheitert.length ? 1 : 0);
