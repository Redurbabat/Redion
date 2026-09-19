/* Suite 537 — Bereiche bleiben getrennt (E626, L150)
 * ============================================================================
 * CLAUDE.md §5 Regel 1 ist **[hart]**:
 *
 *     Bereiche importieren sich nicht gegenseitig. Ein Bereich darf
 *     verwenden: kern/, register/, eigene Dateien. Sonst nichts.
 *
 * Darunter stand bis zum 12. September 2026 ein Satz, der nicht stimmte:
 * „Der Wächter dafür ist test87." Nachgemessen prüft `test87` Steuerzeichen,
 * Rollen, die A1/A2-Grenze, Stilblätter, Manifest, `esc`, Schema und ein paar
 * Namen — ein Bereich, der einen anderen anfasst, kommt darin nicht vor. Der
 * Befund steht als L150 in LUECKEN.md. Dieser Lauf schliesst ihn.
 *
 * ─── UND DIE REGEL BESCHREIBT EINEN MECHANISMUS, DEN ES HIER NICHT GIBT ────
 *
 *     grep -rh "^import " src/bereiche --include=*.ts | wc -l     →  0
 *
 * Kein einziger Import. Geladen wird über 209 <script> in index.html, geredet
 * wird über globale Namen. Das `import`-Beispiel in §5 kann also gar nicht
 * auftreten; gebrochen wird die Regel so:
 *
 *     Datenbank.oeffne(id)            ← mitten im Editor
 *     (window as any).Datenbank?.x()  ← derselbe Verstoss, andere Schreibweise
 *
 * ─── WAS DAS NACHMESSEN ERGEBEN HAT (19. September 2026) ───────────────────
 * L150 sagt: „heute hält die Regel … es gibt keinen Querverweis." Das ist
 * falsch. Gemessen mit genau dem Verfahren dieses Laufs:
 *
 *     520 Querverweise   in 63 von 306 möglichen Bereichspaaren
 *                        in 52 von 86 Dateien, über 61 fremde Namen
 *      88 weitere nur in Schablonen (Backticks) — nicht mitgezählt
 *
 * Zwölf Namen tragen 64 % davon, und die grössten sind keine gemeinsamen
 * Helfer, sondern die KERNE ihrer Bereiche: `Datenbank` ist
 * `datenbanken/steuerung.ts` mit 502 KB, `Werkzeuge` die Befehlspalette samt
 * Journal mit 163 KB. Sie nach `kern/` zu schieben hiesse §4 brechen —
 * „kern/ kennt keinen einzelnen Bereich und darf keinen kennen".
 *
 * Deshalb führt dieser Lauf ein VERZEICHNIS und kein Urteil:
 * `pruefungen/bereiche-bestand.json`, nach dem Vorbild von `js-bestand.json`
 * (§54.4), `masse-bestand.json` (E407) und `schalter-bestand.json` (E417).
 *
 *     Ein Verzeichnis ist keine Erlaubnis, sondern eine Schuld.
 *
 * Es darf nur SCHRUMPFEN. Der Stand ist damit eingefroren: jeder NEUE
 * Querverweis macht diesen Lauf rot, und die 520 schrumpfen, wann immer
 * jemand ohnehin an einer Stelle arbeitet.
 *
 * ─── DIE ABSCHNITTE ────────────────────────────────────────────────────────
 *   §1 Der Katalog steht — jeder Bereich bietet mindestens einen Namen an.
 *   §2 Kein NEUER Querverweis (der Kern).
 *   §3 Keine Karteileiche — ein Eintrag, den es nicht mehr gibt.
 *   §4 Das Verzeichnis ist nicht gewachsen.
 *   §5 Der Seitenweg über `window` zählt mit.
 *   §6 Die Gegenproben der Ausdrücke selbst.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ──────────────────────────────────
 * §6 ist die eingebaute Antwort, nach dem Vorbild von `test87:162`: jeder
 * Ausdruck wird an einem erfundenen Stück Code geprüft, das er finden MUSS —
 * und an einem Stück Prosa, das er in Ruhe lassen muss. Dazu die Gegenprobe
 * von Hand: einen Querverweis einsetzen, rot sehen, herausnehmen. Beide Wege
 * einzeln, siehe ENTSCHEIDUNGEN.md E626.
 *
 * Kein Browser, kein Port — dieser Lauf liest Dateien.
 *
 *   node pruefungen/lauf/test537.mts
 *   node pruefungen/lauf/test537.mts --schreiben    das Verzeichnis neu setzen
 *   node pruefungen/alle.mts 537
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const QUELLE = path.join(WURZEL, 'src');
const VERZEICHNIS = path.join(WURZEL, 'pruefungen/bereiche-bestand.json');
const SCHREIBEN = process.argv.includes('--schreiben');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* ══ NUR DER CODE, NICHT DIE PROSA ═════════════════════════════════════════
   Wortgleich aus `test87:145` übernommen — wiederverwenden, nicht nachbauen
   (§8). Zwei Eigenheiten stehen dort begründet und gelten hier genauso:

     · `(^|[^:])` vor dem `//` lässt ein `https://` in Ruhe;
     · SCHABLONEN (Backticks) bleiben absichtlich stehen, weil das, was in
       `${…}` steht, echter Code ist. Der Versuch, sie mit einem regulären
       Ausdruck zu entfernen, „verschluckte 24 000 Zeichen aus schale.js"
       und machte die Prüfung blind.

   FÜR DIESEN LAUF BRAUCHT ES EINEN SCHRITT MEHR. `test87` sucht nach `App.`,
   und „App" steht in keinem deutschen Satz. Bereichsnamen dagegen sind
   deutsche Wörter: „öffne die Bibliothek." in einer Meldung innerhalb eines
   Backticks sähe aus wie `Bibliothek.`. Gemessen macht das 88 Treffer
   Unterschied. Also wird für die SUCHE zusätzlich der Inhalt der Schablonen
   geleert — nicht die Schablone selbst. */
const nurCode = (text: string): string => text
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');

const ohneSchablonen = (text: string): string =>
  text.replace(/`(?:[^`\\]|\\.)*`/g, '``');

/* ══ WER EINEN NAMEN ANBIETET ══════════════════════════════════════════════
   Gelesen, nicht gepflegt. Eine Liste, die jemand nachtragen muss, ist nach
   dem dritten Bereich falsch und meldet dann entweder Unsinn oder schweigt.

   Zwei Muster, beide aus dem Bestand abgelesen:
     const Name = (() => { … })();        die Hausform der Module
     (window as any).Name = Name;         und ihre Anmeldung am Fenster

   NUR AM ZEILENANFANG. Eingerückt heisst: in einer Funktion, also nicht
   global — dieselbe Überlegung wie in `test87:652`. */
const dateienUnter = (ordner: string): string[] => {
  const raus: string[] = [];
  const gehe = (o: string): void => {
    for (const e of fs.readdirSync(o, { withFileTypes: true })) {
      const voll = path.join(o, e.name);
      if (e.isDirectory()) gehe(voll);
      else if (e.name.endsWith('.ts')) raus.push(voll);
    }
  };
  if (fs.existsSync(ordner)) gehe(ordner);
  return raus.sort();
};

/** `bereiche/editor` für einen Bereich, `kern` für alles andere. */
const ortVon = (voll: string): string => {
  const rel = path.relative(QUELLE, voll).split(path.sep);
  return rel[0] === 'bereiche' && rel[1] ? `bereiche/${rel[1]}` : (rel[0] ?? '');
};

const alleDateien = dateienUnter(QUELLE);
const heimat = new Map<string, Set<string>>();
for (const datei of alleDateien) {
  const ort = ortVon(datei);
  const text = fs.readFileSync(datei, 'utf8');
  for (const m of text.matchAll(/^[ \t]*(?:const|let|var)[ \t]+([A-Z][A-Za-z0-9_]*)[ \t]*=/gm))
    (heimat.get(m[1] ?? '') ?? heimat.set(m[1] ?? '', new Set()).get(m[1] ?? '')!).add(ort);
  for (const m of text.matchAll(/\(window as any\)\.([A-Z][A-Za-z0-9_]*)\s*=/g))
    (heimat.get(m[1] ?? '') ?? heimat.set(m[1] ?? '', new Set()).get(m[1] ?? '')!).add(ort);
}

/* Ein Name zählt nur, wenn er GENAU EINEM Bereich gehört. Wer an zwei Orten
   steht, gehört keinem — und eine Meldung darüber wäre geraten, nicht
   gemessen. Namen aus kern/, register/, schale/, fremd/, dienst/, core/ sind
   die Positivliste aus §5 und werden nie gemeldet. */
const gehoertBereich = new Map<string, string>();
for (const [name, orte] of heimat)
  if (orte.size === 1 && [...orte][0]!.startsWith('bereiche/'))
    gehoertBereich.set(name, [...orte][0]!);

/* ══ DIE ZWEI KOPPLUNGSWEGE ════════════════════════════════════════════════
   1. der Name selbst:   Datenbank.oeffne(…)   — verlangt ein klein
      geschriebenes Glied dahinter, sonst wäre „Bibliothek. Danach" ein Treffer
   2. der Umweg über das Fenster — derselbe Verstoss, andere Schreibweise, und
      die eine Zeile, mit der Weg 1 zu umgehen wäre */
const muster = (name: string): RegExp =>
  new RegExp('\\b' + name + '\\s*\\??\\.\\s*[a-z_$]\\w*', 'g');
const fensterMuster = (name: string): RegExp =>
  new RegExp('\\(window as any\\)\\s*\\.\\s*' + name + '\\b(?!\\s*=[^=])', 'g');

type Fund = { von: string; name: string; zu: string; zahl: number };
const gefunden = new Map<string, Fund>();
const schluessel = (f: { von: string; name: string }) => `${f.von}|${f.name}`;
let ueberFenster = 0;

for (const datei of alleDateien) {
  const ort = ortVon(datei);
  if (!ort.startsWith('bereiche/')) continue;
  const code = ohneSchablonen(nurCode(fs.readFileSync(datei, 'utf8')));
  for (const [name, zuhause] of gehoertBereich) {
    if (zuhause === ort) continue;
    /* ERST DEN FENSTERWEG ZÄHLEN, DANN IHN HERAUSNEHMEN. Sonst zählt
       `(window as any).Chronik?.oeffne()` zweimal: einmal als Fensterzugriff
       und einmal als nackter Aufruf `Chronik?.oeffne`. Gesehen in der
       Gegenprobe zu E626 — 526 Treffer wurden 528, obwohl nur EINE Zeile
       dazugekommen war. Eine Zahl, die eine Kopplung doppelt zählt, sagt
       beim Schrumpfen das Falsche. */
    const b = (code.match(fensterMuster(name)) || []).length;
    const ohneFenster = code.replace(fensterMuster(name), ' ');
    const a = (ohneFenster.match(muster(name)) || []).length;
    if (!a && !b) continue;
    ueberFenster += b;
    const k = `${ort}|${name}`;
    const da = gefunden.get(k);
    if (da) da.zahl += a + b;
    else gefunden.set(k, { von: ort, name, zu: zuhause, zahl: a + b });
  }
}

const jetzt = [...gefunden.values()].sort((x, y) =>
  x.von.localeCompare(y.von) || x.name.localeCompare(y.name));
const summe = jetzt.reduce((s, f) => s + f.zahl, 0);

/* ══ DAS VERZEICHNIS NEU SETZEN ════════════════════════════════════════════
   Nur mit `--schreiben`, nur von Hand, und der Unterschied gehört in den
   Bogen. Ein Lauf, der seine eigenen Erwartungen stillschweigend nachzieht,
   ist kein Wächter, sondern ein Protokoll. */
if (SCHREIBEN) {
  const inhalt = {
    _was: 'Querverweise zwischen Bereichen — CLAUDE.md §5 Regel 1 ist [hart].',
    _regel: 'Dieses Verzeichnis darf nur SCHRUMPFEN. Es ist keine Erlaubnis, '
      + 'sondern eine Schuld. Ein neuer Eintrag heisst: ein Bereich fasst einen '
      + 'anderen an. Der Weg heraus steht in §5 — erst der Ereignisbus, dann '
      + 'gemeinsame Logik nach kern/, dann über register/ bekannt machen.',
    _woher: 'E626, L150 — gemessen am 19. September 2026 mit test537.',
    _gesetzt: { paare: jetzt.length, treffer: summe },
    eintraege: jetzt
  };
  fs.writeFileSync(VERZEICHNIS, JSON.stringify(inhalt, null, 2) + '\n');
  console.log(`Verzeichnis geschrieben: ${jetzt.length} Paare, ${summe} Treffer.`);
  process.exit(0);
}

/* ═══ §1 Der Katalog steht ═════════════════════════════════════════════════ */
console.log('\n§1 Der Katalog — wer bietet welchen Namen an');
const bereiche = [...new Set(alleDateien.map(ortVon).filter(o => o.startsWith('bereiche/')))].sort();
console.log(`    ${bereiche.length} Bereiche, ${alleDateien.length} Dateien, `
  + `${gehoertBereich.size} eindeutig zugeordnete Namen`);
p('Es gibt Bereiche', bereiche.length >= 15, String(bereiche.length));
const ohneNamen = bereiche.filter(b => ![...gehoertBereich.values()].includes(b));
p('Jeder Bereich bietet mindestens einen Namen an — sonst wäre er ein Loch im Wächter',
  ohneNamen.length === 0, ohneNamen.join(', '));
p('Und die Positivliste wird erkannt (kern, register, schale)',
  ['kern', 'register', 'schale'].every(o => alleDateien.some(d => ortVon(d) === o)));

/* ═══ §2 Kein neuer Querverweis ════════════════════════════════════════════ */
console.log('\n§2 Kein NEUER Querverweis (§5 Regel 1)');
p('Es gibt ein Verzeichnis', fs.existsSync(VERZEICHNIS),
  'pruefungen/bereiche-bestand.json fehlt — mit --schreiben anlegen');
const roh = fs.existsSync(VERZEICHNIS)
  ? JSON.parse(fs.readFileSync(VERZEICHNIS, 'utf8')) : { eintraege: [] };
const bestand: Fund[] = (roh.eintraege || []) as Fund[];
const bekannt = new Map(bestand.map(e => [schluessel(e), e]));
console.log(`    Verzeichnis: ${bestand.length} Paare · gemessen: ${jetzt.length} Paare, ${summe} Treffer`);

const neu = jetzt.filter(f => !bekannt.has(schluessel(f)));
p('Kein Bereich fasst einen neuen anderen an', neu.length === 0,
  neu.map(f => `${f.von} → ${f.name} (${f.zu})`).join(' · ')
  + ' → §5: erst der Ereignisbus, dann kern/, dann register/ — '
  + 'oder mit Grund in bereiche-bestand.json');

/* ═══ §3 Keine Karteileiche ════════════════════════════════════════════════ */
console.log('\n§3 Kein Eintrag zeigt ins Leere');
const lebend = new Set(jetzt.map(schluessel));
const tot = bestand.filter(e => !lebend.has(schluessel(e)));
p('Jeder Eintrag beschreibt einen Querverweis, den es gibt', tot.length === 0,
  tot.map(e => `${e.von} → ${e.name}`).join(' · ') + ' → aus bereiche-bestand.json streichen');

/* ═══ §4 Das Verzeichnis wächst nicht ══════════════════════════════════════ */
console.log('\n§4 Es wird weniger, nicht mehr');
const warenTreffer = Number(roh._gesetzt?.treffer ?? summe);
p('Die Zahl der Paare ist nicht gewachsen', jetzt.length <= bestand.length,
  `${jetzt.length} gegen ${bestand.length}`);
p('Und die Zahl der Treffer auch nicht', summe <= warenTreffer,
  `${summe} gegen ${warenTreffer}`);

/* ═══ §5 Der Seitenweg über `window` ═══════════════════════════════════════ */
console.log('\n§5 Der Umweg über `window` zählt mit');
console.log(`    ${ueberFenster} Zugriffe über \`(window as any).X\``);
p('Der Seitenweg wird mitgezählt — sonst wäre §2 mit einer Zeile zu umgehen',
  fensterMuster('Datenbank').test('(window as any).Datenbank?.oeffne(id)'));
p('… und eine Zuweisung ist kein Zugriff',
  !fensterMuster('Datenbank').test('(window as any).Datenbank = Datenbank;'));

/* ═══ §6 Die Gegenproben der Ausdrücke ═════════════════════════════════════ */
console.log('\n§6 Und die Ausdrücke selbst — sonst ist der Lauf für immer grün');
p('Der Ausdruck findet einen Aufruf',
  muster('Datenbank').test(nurCode('const x = Datenbank.oeffne(id);')));
p('… auch mit Fragezeichen', muster('Datenbank').test('Datenbank?.oeffne(id)'));
p('… und lässt einen Kommentar in Ruhe',
  !muster('Bibliothek').test(nurCode('/* öffne die Bibliothek.mehr */')));
p('… und eine Zeichenkette auch',
  !muster('Bibliothek').test(nurCode("const t = 'Bibliothek.mehr';")));
p('… und deutsche Prosa in einer Schablone',
  !muster('Bibliothek').test(ohneSchablonen(nurCode('const t = `öffne die Bibliothek.mehr`;'))));
p('Ein GROSS geschriebenes Glied ist kein Aufruf, sondern ein Satzende',
  !muster('Bibliothek').test('Die Bibliothek. Danach kommt'));
p('Der Katalog kennt die grossen Module',
  ['Datenbank', 'Werkzeuge', 'Dateien', 'KI'].every(n => gehoertBereich.has(n)),
  ['Datenbank', 'Werkzeuge', 'Dateien', 'KI'].filter(n => !gehoertBereich.has(n)).join(', '));

console.log(`\n  Suite 537 — Bereiche bleiben getrennt: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
