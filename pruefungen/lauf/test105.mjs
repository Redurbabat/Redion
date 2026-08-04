/* Suite 70 — Das erzeugte JavaScript passt zu seinem TypeScript
 * ----------------------------------------------------------------------------
 * Ab Phase TS-3 gibt es Dateien, die zweimal existieren: einmal als `.ts`
 * unter `src/` und einmal als erzeugtes `.js` unter `quell/`. Geladen wird
 * das `.js` — die App muss per Doppelklick auf `index.html` starten, und
 * dafür darf es keinen Pflicht-Bauschritt geben.
 *
 * ─── DAS PROBLEM, DAS DABEI ENTSTEHT ────────────────────────────────────────
 *
 * Zwei Dateien mit demselben Inhalt driften auseinander. Wer das `.js`
 * bearbeitet — weil es das ist, was im Browser läuft, weil die Fehlermeldung
 * dorthin zeigt, weil es einfach danebenliegt —, verliert seine Änderung beim
 * nächsten `npm run bauen:ts`. Und zwar wortlos.
 *
 * Genau dieselbe Falle stand schon einmal in diesem Projekt, an anderer
 * Stelle: `redion-einzeldatei.html` wurde aus den Quellen gebaut, jemand
 * änderte die Quellen und zog die Einzeldatei nicht nach, und in der
 * weitergegebenen Datei fehlte die komplette HTML-Säuberung. Niemandem fiel
 * es auf. Die CI prüft das seither — hier ist dieselbe Prüfung für
 * TypeScript.
 *
 * ─── WIE GEPRÜFT WIRD ───────────────────────────────────────────────────────
 *
 * Frisch nach `/tmp` ausgeben und mit dem vergleichen, was im Repository
 * liegt. Nicht „sieht ähnlich aus", sondern Zeichen für Zeichen. Ein
 * Unterschied heisst immer eines von beiden: das `.js` wurde von Hand
 * geändert, oder das `.ts` wurde geändert und nicht neu gebaut. Beides muss
 * auffallen, und beides ist mit einem Befehl behoben.
 *
 * Der Lauf braucht keinen Browser.
 *
 *   node pruefungen/lauf/test105.mjs
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu, relative as _rel } from 'node:path';
import { readFileSync as _lies, existsSync as _da, mkdtempSync as _tmpOrdner,
         rmSync as _weg, readdirSync as _liesOrdner, statSync as _stat } from 'node:fs';
import { execFileSync as _lauf } from 'node:child_process';
import { tmpdir as _tmp } from 'node:os';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n, b, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

/* --------------------------------------------------------------------------
 * Welche Dateien sind überhaupt migriert?
 * ------------------------------------------------------------------------*/
const alleTs = (ordner, gesammelt = []) => {
  if (!_da(ordner)) return gesammelt;
  for (const eintrag of _liesOrdner(ordner)) {
    const voll = _dazu(ordner, eintrag);
    if (_stat(voll).isDirectory()) alleTs(voll, gesammelt);
    else if (eintrag.endsWith('.ts') && !eintrag.endsWith('.d.ts')) gesammelt.push(voll);
  }
  return gesammelt;
};

const quellen = alleTs(_dazu(WURZEL, 'src/core/helpers'));

console.log('\n1 · Jede migrierte Datei hat ihr erzeugtes Gegenstück');

p('Es gibt migrierte Dateien', quellen.length > 0,
  'src/core/helpers/ ist leer — dann prüft dieser Lauf nichts');

for (const ts of quellen) {
  const rel = _rel(_dazu(WURZEL, 'src'), ts).replace(/\.ts$/, '.js');
  const js = _dazu(WURZEL, 'quell', rel);
  p('quell/' + rel + ' ist da', _da(js));
}

/* --------------------------------------------------------------------------
 * Die eigentliche Frage
 * ------------------------------------------------------------------------*/
console.log('\n2 · Das erzeugte JavaScript ist auf dem Stand der Quellen');

const nachTmp = _tmpOrdner(_dazu(_tmp(), 'redion-ts-'));
let baufehler = null;
try {
  _lauf('npx', ['tsc', '-p', 'tsconfig.bauen.json', '--outDir', nachTmp],
        { cwd: WURZEL, stdio: 'pipe' });
} catch (e) {
  baufehler = String(e.stdout || e.message).slice(0, 400);
}

p('`npm run bauen:ts` läuft ohne Fehler durch', baufehler === null, String(baufehler));

if (!baufehler) {
  const abweichend = [];
  for (const ts of quellen) {
    const rel = _rel(_dazu(WURZEL, 'src'), ts).replace(/\.ts$/, '.js');
    const frisch = _dazu(nachTmp, rel);
    const drin = _dazu(WURZEL, 'quell', rel);
    if (!_da(frisch) || !_da(drin)) { abweichend.push(rel + ' (fehlt)'); continue; }
    if (_lies(frisch, 'utf8') !== _lies(drin, 'utf8')) abweichend.push(rel);
  }
  p('Kein erzeugtes JavaScript weicht von seiner Quelle ab',
    abweichend.length === 0,
    abweichend.join(', ') + ' — bitte `npm run bauen:ts` laufen lassen und ' +
    'das Ergebnis mitcommitten');
}
_weg(nachTmp, { recursive: true, force: true });

/* --------------------------------------------------------------------------
 * Und die Warnung muss im erzeugten Text stehen
 * ------------------------------------------------------------------------
 * Wer die Datei im Browser-Debugger oder im Editor aufmacht, soll im ersten
 * Bildschirm lesen, dass er die falsche Datei vor sich hat. Ein Prüflauf,
 * der erst in der CI meckert, kommt für die verlorene Arbeit zu spät.
 * ------------------------------------------------------------------------*/
console.log('\n3 · Das erzeugte JavaScript sagt selbst, dass es erzeugt ist');

for (const ts of quellen) {
  const rel = _rel(_dazu(WURZEL, 'src'), ts).replace(/\.ts$/, '.js');
  const js = _dazu(WURZEL, 'quell', rel);
  if (!_da(js)) continue;
  const kopf = _lies(js, 'utf8').slice(0, 1200);
  p('quell/' + rel + ' warnt vor Änderungen von Hand',
    /NICHT VON HAND/i.test(kopf) && /\.ts/.test(kopf));
}

/* --------------------------------------------------------------------------
 * Die Gegenrichtung: keine Importzeile
 * ------------------------------------------------------------------------
 * `module: none` in `tsconfig.bauen.json` verbietet `import` und `export`
 * schon beim Bauen. Diese Prüfung ist trotzdem da, weil sie beim Lesen
 * erklärt, warum: eine Datei mit `import` würde als ES-Modul ausgegeben und
 * liefe von `file://` gar nicht — und `file://` ist die Nutzungsart, um die
 * es bei Redion geht.
 * ------------------------------------------------------------------------*/
console.log('\n4 · Kein erzeugtes JavaScript ist ein ES-Modul');

for (const ts of quellen) {
  const rel = _rel(_dazu(WURZEL, 'src'), ts).replace(/\.ts$/, '.js');
  const js = _dazu(WURZEL, 'quell', rel);
  if (!_da(js)) continue;
  const quelle = _lies(js, 'utf8');
  p('quell/' + rel + ' kommt ohne import/export aus',
    !/^\s*(import|export)\s/m.test(quelle));
}

console.log(`\n  Suite 70 — Erzeugtes JavaScript: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
