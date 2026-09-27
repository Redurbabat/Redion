/* ============================================================================
 * skripte/touch-holen.mts — das Touch Kit aus UI-Kit nach fremd/touch holen
 * ----------------------------------------------------------------------------
 *     node skripte/touch-holen.mts <UI-Kit-Ordner> <Commit>
 *     node skripte/touch-holen.mts ../UI-Kit c192821
 *
 * WAS ES TUT (E699). Es liest den Ordner `app/src/touch` GENAU aus dem
 * genannten Commit — nicht aus dem Arbeitsbaum des UI-Kits, in dem gerade
 * jemand etwas halb Fertiges liegen haben kann — und schreibt ihn nach
 * `fremd/touch/`. Dabei bleiben draussen:
 *
 *     *.test.ts, *.test.tsx     die Vitest-Läufe des Kits
 *     test/                     ihr Hilfsordner (happy-dom, render)
 *
 * Redion prüft mit echten Läufen gegen die echte App (§30: „Keine Mocks, wenn
 * die echte App geprüft werden kann"), nicht mit Vitest. Die Zusagen des
 * Kits, die Redion braucht, stehen in `test578` und `test579`.
 *
 * WARUM AUS GIT UND NICHT AUS DEM ORDNER. Zweimal holen muss dasselbe
 * ergeben, Byte für Byte — sonst ist die Prüfsumme in
 * `pruefungen/fremd-bestand.json` eine Behauptung über einen Zufall. `git
 * ls-tree` und `git cat-file` lesen den Commit, und der ändert sich nie.
 *
 * WAS ES NICHT TUT. Es ändert keine Zeile des Kits. Das Kit sagt selbst
 * „Nie im Kit-Ordner von Hand ändern", und `test578` hält das fest: jede
 * Datei steht mit ihrer Prüfsumme in `fremd/touch/HERKUNFT.txt`, und die
 * Summe dieser Datei steht in `pruefungen/fremd-bestand.json`. Was das Kit
 * anders braucht, gehört nach UI-Kit (upstream), nicht hierher.
 *
 * Zwei Dateien daneben gehören Redion und werden hier nie angefasst:
 * `HERKUNFT.txt` schreibt dieses Skript neu, `glass/LIZENZ-ALEXalesha.txt`
 * (der MIT-Text des Glas-Codes) liegt von Hand daneben, weil UI-Kit ihn bei
 * c192821 noch nicht mitliefert.
 *
 * Braucht nur git und Node — kein tar, kein Paket, läuft auch unter Windows.
 * ==========================================================================*/
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const WURZEL = resolve(import.meta.dirname, '..');
const ZIEL = join(WURZEL, 'fremd', 'touch');
const HERKUNFT = join(ZIEL, 'HERKUNFT.txt');
const QUELLORDNER = 'app/src/touch';

const kit = process.argv[2];
const commit = process.argv[3];
if (!kit || !commit) {
  console.error('Aufruf: node skripte/touch-holen.mts <UI-Kit-Ordner> <Commit>');
  process.exit(1);
}

const git = (...args: string[]): Buffer =>
  execFileSync('git', ['-C', resolve(kit), ...args], { maxBuffer: 64 * 1024 * 1024 });

/* Den Commit ausschreiben: in HERKUNFT.txt steht die volle Kennung, damit
   niemand raten muss, welches „c192821" gemeint war. */
const voll = git('rev-parse', '--verify', commit + '^{commit}').toString('utf8').trim();

/** Was vom Kit NICHT mitkommt — die Vitest-Läufe und ihr Hilfsordner. */
const weglassen = (pfad: string): boolean =>
  /\.test\.tsx?$/.test(pfad) || /(^|\/)test\//.test(pfad);

/* `-z` trennt mit Nullbytes: ein Dateiname mit Leerzeichen oder Umlaut kommt
   so heil an, ohne dass git ihn in Anführungszeichen setzt. */
const baum = git('ls-tree', '-r', '-z', voll, '--', QUELLORDNER).toString('utf8')
  .split('\0').filter(Boolean)
  .map(z => {
    const [kopf, pfad] = z.split('\t');
    const [, art, objekt] = (kopf ?? '').split(' ');
    return { art: art ?? '', objekt: objekt ?? '', pfad: pfad ?? '' };
  })
  .filter(e => e.art === 'blob')
  .map(e => ({ ...e, rel: e.pfad.slice(QUELLORDNER.length + 1) }))
  .filter(e => !weglassen(e.rel))
  .sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));

if (baum.length === 0) {
  console.error(`In ${voll} gibt es kein ${QUELLORDNER} — falscher Ordner oder falscher Commit?`);
  process.exit(1);
}

/* WAS BEIM LETZTEN HOLEN KAM, darf weg, wenn es im neuen Commit fehlt — aber
   NUR das. Was nicht in der alten Liste steht (die zwei Redion-Dateien
   oben), bleibt unangetastet. */
const alteListe = existsSync(HERKUNFT)
  ? readFileSync(HERKUNFT, 'utf8').split('\n')
      .map(z => /^[0-9a-f]{64} {2}(.+)$/.exec(z)?.[1])
      .filter((x): x is string => !!x)
  : [];
const neu = new Set(baum.map(e => e.rel));
for (const alt of alteListe)
  if (!neu.has(alt)) rmSync(join(ZIEL, alt), { force: true });

const zeilen: string[] = [];
let bytes = 0;
for (const e of baum) {
  const inhalt = git('cat-file', 'blob', e.objekt);
  const datei = join(ZIEL, e.rel);
  mkdirSync(dirname(datei), { recursive: true });
  writeFileSync(datei, inhalt);
  bytes += inhalt.length;
  zeilen.push(createHash('sha256').update(inhalt).digest('hex') + '  ' + e.rel);
}

const text = [
  'Touch Kit — Kopie aus Redurbabat/UI-Kit (E699)',
  '',
  'Quelle:       https://github.com/Redurbabat/UI-Kit, Ordner ' + QUELLORDNER,
  'Commit:       ' + voll,
  'Geholt mit:   node skripte/touch-holen.mts <UI-Kit-Ordner> ' + voll.slice(0, 7),
  'Weggelassen:  *.test.ts, *.test.tsx, test/ (Redion prüft mit test578/test579)',
  'Wem es gehört: Redur — eigener Code aus seinem UI-Kit, kein fremder.',
  '              Ausnahme: glass/field.ts und glass/filter.ts sind angepasst aus',
  '              ALEXalesha/LiquidGlass (MIT), Lizenztext in glass/LIZENZ-ALEXalesha.txt.',
  'NICHT VON HAND ÄNDERN. Was anders sein soll, gehört nach UI-Kit und kommt',
  'mit einem neuen Commit wieder hierher. test578 rechnet jede Zeile nach.',
  '',
  'Dateien: ' + baum.length + ' · Bytes: ' + bytes,
  ...zeilen,
  ''
].join('\n');
mkdirSync(ZIEL, { recursive: true });
writeFileSync(HERKUNFT, text);

const summe = createHash('sha256').update(text).digest('hex');
console.log(`fremd/touch: ${baum.length} Dateien, ${bytes} Bytes aus ${voll.slice(0, 7)}`);
console.log(`HERKUNFT.txt sha256 ${summe} — so steht es in pruefungen/fremd-bestand.json`);
