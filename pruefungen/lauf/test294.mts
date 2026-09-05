/* Suite 294 — Ein Typ, der etwas anderes behauptet als der Bestand (E298)
 * ============================================================================
 * CLAUDE.md 52.8 sagt es selbst, und es steht dort, weil es schon einmal
 * passiert ist:
 *
 *     „Nicht raten, welche Felder es gibt. Nachsehen. Diese Beispiele
 *      zeigten hier einmal createdAt, updatedAt, properties, children und
 *      deleted. Vier davon gibt es nicht."
 *
 * Am 1. September 2026 nachgemessen: in `src/core/types/` stand es wieder.
 *
 *   `database.ts`  behauptete `zielCollection`, `rollupRelation`,
 *                  `rollupZiel`, `rollupArt`. Keines davon gibt es. Die
 *                  echten heissen `ziel`, `relation`, `zielKey`, `rollup`
 *                  (`bereiche/datenbanken/steuerung.ts:1355, 5362, 6021`).
 *                  Und acht Felder, die es wirklich gibt, fehlten ganz.
 *   `storage.ts`   behauptete `belegt` und `zugeteilt`. Der Bestand gibt
 *                  `{ benutzt, verfuegbar }` (`indexdb.ts:2782`).
 *
 * DAS IST NICHT NUR UNORDNUNG. Ein Typ ist die Stelle, an der man nachsieht,
 * statt zu raten — genau das verlangt die Regel. Steht dort etwas Falsches,
 * ist es schlimmer als gar nichts: man sieht nach, glaubt es, und schreibt
 * ein Feld, das niemand liest.
 *
 *   §1 DIE MESSUNG findet Felder in Typen und im Bestand.
 *   §2 KEIN FELD in den gemessenen Typdateien fehlt im Bestand.
 *   §3 DIE VIER ALTEN NAMEN sind wirklich weg und die neuen da.
 *   §4 GEGENPROBE: ein erfundenes Feld WIRD gemeldet.
 *
 * ─── WELCHE DATEIEN AUSGENOMMEN SIND, UND WARUM ─────────────────────────────
 *
 * `spreadsheet.ts` sagt in ihrem eigenen Kopf: „Diese Datei beschreibt etwas,
 * das es noch nicht gibt … wer hier etwas ändert, darf das ohne Messung."
 * Sie hält eine Absicht fest, keinen Zustand. `excel.ts` beschreibt die
 * Berührungsflächen zu Excel und nennt ausdrücklich Dinge, die nicht in
 * Redions Code stehen, sondern in Excel.
 *
 * Beide sind hier ausgenommen — nicht, weil sie stören, sondern weil die
 * Behauptung dieses Laufs auf sie nicht zutrifft. Ein Wächter, der sie
 * mitmisst, ist rot, ohne dass jemand etwas falsch gemacht hat, und wird
 * dafür abgeschaltet.
 *
 *   node pruefungen/lauf/test294.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const TYPEN = path.join(WURZEL, 'src/core/types');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/** Diese beiden halten eine Absicht fest, keinen Zustand — siehe oben. */
const OHNE_MESSUNG = ['spreadsheet.ts', 'excel.ts', 'index.ts', 'id.ts'];

/**
 * Die Feldnamen einer Typdatei.
 *
 * NUR INNERHALB EINES KLAMMERBLOCKS. Der erste Entwurf las jede Zeile mit
 * `wort:` und fing damit deutsche Kommentarwörter — „Zustands: den
 * Spreadsheet-Block" wurde zu einem Feld namens `Zustands`. Ein Wächter,
 * der sich seine eigenen Fehler ausdenkt, ist keiner.
 */
const felderVon = (text: string): string[] => {
  const raus: string[] = [];
  let tiefe = 0, imKommentar = false;
  for (const roh of text.split('\n')) {
    const zeile = roh.trim();
    if (zeile.startsWith('/*')) imKommentar = !zeile.includes('*/');
    else if (imKommentar) { if (zeile.includes('*/')) imKommentar = false; }
    else if (!zeile.startsWith('//')) {
      if (tiefe > 0) {
        const t = /^([a-zA-Z][a-zA-Z0-9_]*)\??\s*:/.exec(zeile);
        if (t) raus.push(t[1] as string);
      }
      tiefe += (roh.match(/\{/g) || []).length;
      tiefe -= (roh.match(/\}/g) || []).length;
      if (tiefe < 0) tiefe = 0;
    }
  }
  return [...new Set(raus)];
};

/** Der ganze übrige Quelltext — dort müssen die Felder vorkommen. */
const quelltext = (): string => {
  const dateien: string[] = [];
  const lauf = (d: string): void => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const pf = path.join(d, e.name);
      if (e.isDirectory()) { if (!pf.includes(path.join('core', 'types'))) lauf(pf); }
      /* DIESE DATEI GEHÖRT NICHT ZUM BESTAND, DEN SIE MISST. Die Gegenprobe
         unten erfindet einen Feldnamen und behauptet, dass es ihn nirgends
         gibt — und schrieb ihn damit selbst in den Bestand hinein. Der Punkt
         war grün, weil er sich selbst gefunden hat. */
      else if (/\.(ts|mts|js|mjs)$/.test(e.name) && pf !== import.meta.filename)
        dateien.push(pf);
    }
  };
  lauf(path.join(WURZEL, 'src'));
  lauf(path.join(WURZEL, 'pruefungen'));
  lauf(path.join(WURZEL, 'server'));
  return dateien.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
};

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Messung findet Felder in Typen und im Bestand');

const namen = fs.readdirSync(TYPEN).filter(n => n.endsWith('.ts')).sort();
const alles = quelltext();
const felder = new Map<string, string[]>();
for (const n of namen)
  felder.set(n, felderVon(fs.readFileSync(path.join(TYPEN, n), 'utf-8')));

p('Es gibt Typdateien', namen.length >= 8, namen.join(', '));
p('Und Felder darin',
  [...felder.values()].reduce((a, b) => a + b.length, 0) >= 100,
  String([...felder.values()].reduce((a, b) => a + b.length, 0)));
p('Der Klammerblock-Leser erfindet keine deutschen Wörter',
  !(felder.get('index.ts') || []).includes('Zustands'),
  JSON.stringify(felder.get('index.ts')));

/* ------------------------------------------------------------------------ */
console.log('\n2 · Kein Feld der gemessenen Typdateien fehlt im Bestand');

/** Kommt ein Feldname irgendwo im Bestand vor — als Zugriff, als Schlüssel
    oder als Zeichenkette? Alle drei sind echte Verwendungen. */
const kommtVor = (f: string): boolean =>
  new RegExp('(\\.' + f + '\\b)|(\\b' + f + '\\s*:)|([\'"`]' + f + '[\'"`])').test(alles);

const tot: string[] = [];
for (const [datei, liste] of felder) {
  if (OHNE_MESSUNG.includes(datei)) continue;
  for (const f of liste) if (!kommtVor(f)) tot.push(datei + ':' + f);
}
gleich('Jedes Feld kommt im Bestand vor', tot, []);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Die alten Namen sind weg, die echten da');

const db = felder.get('database.ts') || [];
gleich('Die vier erfundenen Namen stehen nicht mehr da',
  ['zielCollection', 'rollupRelation', 'rollupZiel', 'rollupArt'].filter(f => db.includes(f)),
  []);
gleich('Und die echten stehen da',
  ['ziel', 'gegen', 'limit', 'relation', 'zielKey', 'rollup'].filter(f => !db.includes(f)),
  []);
const sp = felder.get('storage.ts') || [];
gleich('Die Speicherauskunft heisst wie im Bestand',
  [['belegt', false], ['zugeteilt', false], ['benutzt', true], ['verfuegbar', true]]
    .filter(([f, soll]) => sp.includes(String(f)) !== soll).map(([f]) => f),
  []);

/* ------------------------------------------------------------------------ */
console.log('\n4 · GEGENPROBE: ein erfundenes Feld wird gemeldet');

const erfunden = felderVon(
  'export interface Probe {\n  name: string;\n  gibtEsSicherNichtXyz?: number;\n}');
p('Der Leser findet beide Felder', erfunden.length === 2, JSON.stringify(erfunden));
p('Und das erfundene kommt im Bestand NICHT vor',
  !kommtVor('gibtEsSicherNichtXyz'));
p('Ein echtes dagegen schon — sonst wäre die Messung blind',
  kommtVor('parentTable'));

/* ==========================================================================
 * 5 · DIE ANDERE RICHTUNG: WAS DER CODE LIEST UND DER TYP NICHT KENNT
 * --------------------------------------------------------------------------
 * Die Abschnitte 1 bis 4 messen EINE Richtung — kein Feld des Typs darf
 * erfunden sein. Am 5. September 2026 kam heraus, dass die andere Richtung
 * genauso weh tut (E412):
 *
 *   `Column.formel` hiess in Wahrheit `formula`. Gelesen und geschrieben
 *   wird `def.formula` (dienst.ts formelRechnen, steuerung.ts:5603, 5765,
 *   7048). Wer nach dem Typ baute, bekam eine Formel, die nie rechnete.
 *
 * Und Abschnitt 2 schwieg dazu, obwohl er dafür gebaut wurde: er prüft, ob
 * ein Feldname IRGENDWO im Bestand vorkommt — und `formel` kommt vor, im
 * Formeldreieck der Elektrolehre, in den Knopfvariablen des Editors und in
 * `Redion.formel()` der Erweiterungen. Drei Dinge, die mit einer Spalte
 * nichts zu tun haben. Ein häufiges deutsches Wort macht diese Messung
 * blind, und `formel` ist in dieser App ein sehr häufiges Wort.
 *
 * Gemessen wird deshalb hier der ZUGRIFF, nicht der Name: jedes `def.X`
 * unter `bereiche/datenbanken/`. Was dort gelesen wird, muss der Typ
 * kennen. Beim ersten Lauf waren es dreizehn Treffer.
 *
 * Eine unvollständige Wahrheit ist die leiser gefährliche: wer den Typ
 * liest, hält ihn für vollständig und legt das Feld unter einem zweiten
 * Namen neu an.
 * ========================================================================*/
console.log('\n5 · Was der Code liest, muss der Typ kennen');

const dbBereich = (): string => {
  const dateien: string[] = [];
  const lauf = (d: string): void => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const pf = path.join(d, e.name);
      if (e.isDirectory()) lauf(pf);
      else if (e.name.endsWith('.ts')) dateien.push(pf);
    }
  };
  lauf(path.join(WURZEL, 'src/bereiche/datenbanken'));
  /* Kommentare weg — sonst zählt ein erklärendes `def.formel` im Fliesstext
     als Zugriff, und der Wächter findet wieder sich selbst. */
  return dateien.map(f => fs.readFileSync(f, 'utf-8')).join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
};

const zugriffe = new Set<string>();
for (const m of dbBereich().matchAll(/\bdef\.([A-Za-z_][A-Za-z0-9_]*)/g))
  zugriffe.add(m[1]!);

p('Es werden überhaupt Schema-Felder gelesen', zugriffe.size >= 20,
  String(zugriffe.size));

/* `type` und `name` stehen im Typ; alles Weitere muss es auch. Ausgenommen
   ist nur, was gar kein Schema-Feld ist: `def.length` an einer Liste etwa. */
const KEIN_SCHEMAFELD = new Set(['length', 'map', 'filter', 'forEach', 'push']);
const unbekannt = [...zugriffe]
  .filter(f => !KEIN_SCHEMAFELD.has(f) && !db.includes(f)).sort();
gleich('Jedes gelesene Schema-Feld steht im Typ', unbekannt, []);

/* Und die Gegenprobe zu dieser Messung selbst: sie muss überhaupt etwas
   finden können. Ein leerer Zugriffs-Satz hätte oben auch „grün" ergeben. */
p('Die Messung findet die bekannten Felder wieder',
  ['type', 'name', 'options', 'formula'].every(f => zugriffe.has(f)),
  [...zugriffe].sort().join(' '));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
