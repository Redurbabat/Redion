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
 *   node pruefungen/lauf/test105.mts
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu, relative as _rel } from 'node:path';
import { readFileSync as _lies, existsSync as _da, mkdtempSync as _tmpOrdner,
         rmSync as _weg, readdirSync as _liesOrdner, statSync as _stat,
         writeFileSync as _schreib } from 'node:fs';
import { execFileSync as _lauf } from 'node:child_process';
import { tmpdir as _tmp } from 'node:os';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const TSC = _dazu(WURZEL, 'node_modules', 'typescript', 'bin', 'tsc');

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

/* --------------------------------------------------------------------------
 * Welche Dateien sind überhaupt migriert?
 * ------------------------------------------------------------------------*/
const alleTs = (ordner: any, gesammelt: string[] = []) => {
  if (!_da(ordner)) return gesammelt;
  for (const eintrag of _liesOrdner(ordner)) {
    const voll = _dazu(ordner, eintrag);
    if (_stat(voll).isDirectory()) alleTs(voll, gesammelt);
    else if (eintrag.endsWith('.ts') && !eintrag.endsWith('.d.ts')) gesammelt.push(voll);
  }
  return gesammelt;
};

/* Alles unter src/core/ AUSSER types/. Die Typen beschreiben nur und geben
   nichts aus — sie gehören nicht hierher.

   Vorher stand hier `src/core/helpers`, und das war die stille Fassung des
   Fehlers, den dieser Lauf verhindern soll: der erste Ordner daneben
   (`security/`) wäre ungeprüft geblieben. Sein erzeugtes .js hätte veralten
   können, ohne dass irgendwo etwas rot wird — und darin liegt ausgerechnet
   die HTML-Säuberung. */
const ausfuehrbar = (ordner: any) => {
  const wurzel = _dazu(WURZEL, ordner);
  if (!_da(wurzel)) return [];
  return _liesOrdner(wurzel)
    .filter(n => n !== 'types')
    .map(n => _dazu(wurzel, n))
    .filter(v => _stat(v).isDirectory())
    .flatMap(v => alleTs(v));
};

const quellen = ausfuehrbar('src/core');

console.log('\n1 · Jede migrierte Datei hat ihr erzeugtes Gegenstück');

p('Es gibt migrierte Dateien', quellen.length > 0,
  'unter src/core/ liegt nichts Ausführbares — dann prüft dieser Lauf nichts');

/* Und der Ordner muss auch gebaut werden. Eine Datei, die zwar dasteht, aber
   in `tsconfig.bauen.json` nicht eingeschlossen ist, wird nie erzeugt — und
   ihr veraltetes .js läuft weiter, während die Quelle davonzieht. */
const bauplan = _lies(_dazu(WURZEL, 'tsconfig.bauen.json'), 'utf8');
const ordnerOhneBauplan = [...new Set(quellen.map(
  ts => _rel(_dazu(WURZEL, 'src/core'), ts).split(/[\\/]/)[0]))]
  .filter(o => !(bauplan ?? '').includes('src/core/' + o + '/**/*.ts'));
p('Jeder Ordner unter src/core/ steht in tsconfig.bauen.json',
  ordnerOhneBauplan.length === 0,
  ordnerOhneBauplan.join(', ') + ' — sonst wird dort nichts erzeugt');

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
/* Was der Bau WIRKLICH erzeugt — alle .js, nicht nur die unter core/.
   §3 braucht die Liste (E715). */
const erzeugt: string[] = [];
try {
  _lauf(process.execPath, [TSC, '-p', 'tsconfig.bauen.json', '--outDir', nachTmp],
        { cwd: WURZEL, stdio: 'pipe' });
} catch (e: unknown) {
  baufehler = String((e as { stdout?: string }).stdout || (e instanceof Error ? e.message : String(e))).slice(0, 400);
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
  const sammle = (ordner: string): void => {
    for (const n of _liesOrdner(ordner)) {
      const voll = _dazu(ordner, n);
      if (_stat(voll).isDirectory()) sammle(voll);
      else if (n.endsWith('.js')) erzeugt.push(_rel(nachTmp, voll).split('\\').join('/'));
    }
  };
  sammle(nachTmp);
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

/* SEIT E715 FÜR JEDE ERZEUGTE DATEI, nicht nur für core/. Bis dahin reiste
   der ganze Kopfkommentar der Quelle mit, und 183 der 227 Dateien warnten
   so ganz nebenbei — die übrigen 44 (darunter `pdf/marken.js`, das grösste
   Skript im Start) nie, und niemand sah hin, weil hier nur core/ stand.
   Seit E715 nimmt `removeComments` jeden Kommentar aus dem erzeugten .js;
   übrig bleibt allein die erste Zeile jeder Quelle, „ERZEUGT aus src/… —
   NICHT VON HAND ÄNDERN", die tsc stehen lässt, weil ihr Kommentar mit
   Schrägstrich, Stern und Ausrufezeichen beginnt. Ob sie
   in JEDER Datei steht, prüft dieser Abschnitt — mit der Liste dessen, was
   der Bau in §2 wirklich geschrieben hat. Schlug der Bau fehl, gilt die
   alte Liste (core/), damit §3 nie stillschweigend nichts prüft. */
const zuPruefen = erzeugt.length > 0
  ? erzeugt
  : quellen.map(ts => _rel(_dazu(WURZEL, 'src'), ts).split('\\').join('/').replace(/\.ts$/, '.js'));
p(`§3 sieht alles, was der Bau schreibt (${zuPruefen.length} Dateien, core/ allein ${quellen.length})`,
  zuPruefen.length > quellen.length, 'nur core/ — dann blieben die übrigen ungeprüft');
const ohneWarnung: string[] = [];
for (const rel of zuPruefen) {
  const js = _dazu(WURZEL, 'quell', rel);
  if (!_da(js)) continue;
  const kopf = _lies(js, 'utf8').slice(0, 1200);
  const warnt = /NICHT VON HAND/i.test(kopf) && /\.ts/.test(kopf);
  if (!warnt) ohneWarnung.push('quell/' + rel);
  p('quell/' + rel + ' warnt vor Änderungen von Hand', warnt);
}
p(`Alle ${zuPruefen.length} erzeugten Dateien warnen`, ohneWarnung.length === 0,
  `${ohneWarnung.length} ohne: ` + ohneWarnung.slice(0, 6).join(', '));

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

/* --------------------------------------------------------------------------
 * 5 · DER DIENSTARBEITER — dieselbe Frage, anderer Zielort
 * --------------------------------------------------------------------------
 * `sw.js` ist seit Bündel 20 auch erzeugt, aber nicht nach `quell/`: ein
 * Dienstarbeiter darf nur den Bereich bedienen, in dem seine eigene Datei
 * liegt, und muss deshalb in der Wurzel stehen. Dafür gibt es
 * `tsconfig.sw.json`.
 *
 * Die stille Fassung des Fehlers wäre hier besonders teuer: ein veralteter
 * Dienstarbeiter bedient die App weiter — aus dem Speicher, mit dem alten
 * Stand. Wer die Quelle ändert und das Bauen vergisst, merkt es nicht am
 * Bildschirm, sondern erst, wenn jemand ohne Netz etwas Altes sieht.
 * ------------------------------------------------------------------------*/
console.log('\n5 · Der Dienstarbeiter ist auf dem Stand seiner Quelle');

const swTs = _dazu(WURZEL, 'src/dienst/sw.ts');
const swJs = _dazu(WURZEL, 'sw.js');
p('src/dienst/sw.ts ist da', _da(swTs));
p('sw.js liegt in der Wurzel — nicht in quell/', _da(swJs) &&
  !_da(_dazu(WURZEL, 'quell/dienst/sw.js')));

const paket = _lies(_dazu(WURZEL, 'package.json'), 'utf8');
p('`npm run bauen:ts` baut ihn mit', /tsconfig\.sw\.json/.test(paket),
  'sonst wird sw.js nie neu geschrieben');

if (_da(swTs)) {
  const swTmp = _tmpOrdner(_dazu(_tmp(), 'redion-sw-'));
  let swFehler = null;
  try {
    _lauf(process.execPath, [TSC, '-p', 'tsconfig.sw.json', '--outDir', swTmp],
          { cwd: WURZEL, stdio: 'pipe' });
  } catch (e: unknown) {
    swFehler = String((e as { stdout?: string }).stdout || (e instanceof Error ? e.message : String(e))).slice(0, 400);
  }
  p('tsconfig.sw.json läuft ohne Fehler durch', swFehler === null, String(swFehler));

  if (!swFehler) {
    const frisch = _dazu(swTmp, 'sw.js');
    p('sw.js weicht nicht von src/dienst/sw.ts ab',
      _da(frisch) && _da(swJs) && _lies(frisch, 'utf8') === _lies(swJs, 'utf8'),
      'bitte `npm run bauen:ts` laufen lassen und das Ergebnis mitcommitten');
  }
  _weg(swTmp, { recursive: true, force: true });

  const swKopf = _da(swJs) ? _lies(swJs, 'utf8').slice(0, 1200) : '';
  p('sw.js warnt vor Änderungen von Hand',
    /NICHT VON HAND/i.test(swKopf) && /\.ts/.test(swKopf));
}

/* ==========================================================================
 * 3 · DAS GANZE PROJEKT MUSS TYPPRUEFEN — auch die Prueflaeufe (E276)
 * --------------------------------------------------------------------------
 * Punkt 2 darueber laesst `tsc -p tsconfig.bauen.json` laufen. Der Bauplan
 * kennt aber nur, was nach `quell/` ausgegeben wird — `pruefungen/lauf/`
 * steht nicht darin, und `server/` auch nicht.
 *
 * Die Folge, gemessen am 31. August 2026: ein `.find(...)`-Ergebnis ohne
 * Pruefung auf `undefined` in `pruefungen/lauf/test56.mts` ging durch ALLE
 * 235 Laeufe und landete auf `main`. Node entfernt beim Ausfuehren die
 * Typen, es PRUEFT sie nicht (CLAUDE.md §54.3) — der Lauf war gruen, und
 * `npm run typecheck` war rot, nur rief ihn niemand.
 *
 * Ein Prueflauf, den man von Hand starten muss, ist kein Netz. Dieser Punkt
 * ruft dasselbe, was `npm run typecheck` ruft: `tsc --noEmit` ueber das
 * ganze Projekt.
 * ========================================================================*/
console.log('\n3 · Das ganze Projekt typprueft (auch die Prueflaeufe)');

let typfehler: string | null = null;
try {
  _lauf(process.execPath, [TSC, '--noEmit'], { cwd: WURZEL, stdio: 'pipe' });
} catch (e: unknown) {
  const roh = String((e as { stdout?: string }).stdout ||
                     (e instanceof Error ? e.message : String(e)));
  /* Nur die Zeilen, die wirklich ein Fehler sind — die Ausgabe endet sonst
     mit dem ganzen Aufrufpfad von execFileSync und sagt nichts. */
  typfehler = roh.split('\n').filter(z => /error TS\d+/.test(z)).slice(0, 6).join(' | ')
              || roh.slice(0, 300);
}
p('`npm run typecheck` läuft ohne Fehler durch', typfehler === null,
  String(typfehler));

/* GEGENPROBE (§55.2): kann dieser Punkt ueberhaupt rot werden?
   Eine Datei mit einem echten Typfehler, in einem eigenen Ordner, mit
   derselben Strenge wie das Projekt — `tsc` muss sie beanstanden. Faende
   der Aufruf hier nichts, waere der Punkt darueber blind gruen. */
const gegenOrdner = _tmpOrdner(_dazu(_tmp(), 'redion-typ-'));
_schreib(_dazu(gegenOrdner, 'kaputt.ts'),
  'const x: number = "eine Zeichenkette";\nexport {};\n');
let gegenprobeSah = false;
try {
  _lauf(process.execPath, [TSC, '--noEmit', '--strict',
                           _dazu(gegenOrdner, 'kaputt.ts')],
        { cwd: WURZEL, stdio: 'pipe' });
} catch (e: unknown) {
  gegenprobeSah = /error TS\d+/.test(
    String((e as { stdout?: string }).stdout ||
           (e instanceof Error ? e.message : String(e))));
}
_weg(gegenOrdner, { recursive: true, force: true });
p('Gegenprobe: ein echter Typfehler wird auch gesehen', gegenprobeSah,
  'sonst sagt der Punkt darüber „grün", ohne etwas zu prüfen');

/* --------------------------------------------------------------------------
 * 3b · UND DIE INSELN (E699)
 * --------------------------------------------------------------------------
 * `npm run typecheck` ruft seit E699 ZWEI Prüfungen: `tsc --noEmit` und
 * `tsc -p tsconfig.islands.json` (TSX der Inseln und das Touch Kit, mit den
 * Schaltern des Kits — der Grund steht in der Datei). Dieser Punkt sagt oben
 * „ruft dasselbe, was `npm run typecheck` ruft" — also ruft er auch das.
 * Sonst liefe die Hälfte des Typchecks nur, wenn jemand daran denkt, und
 * der schnelle CI-Lauf, der diese Suite fährt, sähe sie nie.
 * ------------------------------------------------------------------------*/
const typRuf = String(JSON.parse(paket).scripts?.typecheck ?? '');
p('`npm run typecheck` prüft auch die Inseln (tsconfig.islands.json)',
  /tsc --noEmit && tsc -p tsconfig\.islands\.json/.test(typRuf), typRuf);
let inselFehler: string | null = null;
try {
  _lauf(process.execPath, [TSC, '-p', 'tsconfig.islands.json'], { cwd: WURZEL, stdio: 'pipe' });
} catch (e: unknown) {
  const roh = String((e as { stdout?: string }).stdout || (e instanceof Error ? e.message : String(e)));
  inselFehler = roh.split('\n').filter(z => /error TS\d+/.test(z)).slice(0, 6).join(' | ') || roh.slice(0, 300);
}
p('`tsc -p tsconfig.islands.json` läuft ohne Fehler durch', inselFehler === null, String(inselFehler));

console.log(`\n  Suite 70 — Erzeugtes JavaScript: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
