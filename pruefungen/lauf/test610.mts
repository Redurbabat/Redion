/* Suite 610 — Die CI fährt den schnellen Lauf und sagt das auch (E745, L254)
 * ============================================================================
 * WARUM ES DIESEN LAUF GIBT. In `.github/workflows/pruefen.yml` stand bis zum
 * 11. Oktober 2026 eine Aufgabe „Alle Prüfläufe": `npm run pruefen`, vierzig
 * Minuten Zeit, und daneben der Satz „67 Läufe … rund 12 Minuten". Es waren
 * 550 Läufe; der volle Lauf braucht auf dem Rechner 158 Minuten (E743). Die
 * CI hat ihn deshalb jedes Mal nach vierzig Minuten ABGEBROCHEN — am 5. und
 * am 11. Oktober auf `main`, gemessen über die Schnittstelle von GitHub
 * (L254). Ein abgebrochener Lauf sagt über keinen einzigen Prüflauf etwas,
 * und er sieht im Verlauf aus wie einer, der nichts gefunden hat.
 *
 * Redur hat am 11. Oktober (19:43 UTC, „2 . Scnell lauf") Weg (c) aus L254
 * gewählt: in der CI nur der SCHNELLE Lauf, der volle bleibt beim Menschen
 * (`node pruefungen/volllauf.mts`, CLAUDE.md §30).
 *
 * DER HAKEN, UND ER WAR GEMESSEN, NICHT VERMUTET: `--schnell` liess bis dahin
 * genau einen Lauf weg (test73, die Startmessung) — 549 von 550. Der Name
 * versprach etwas, das der Schalter nicht tat. Seit E745 heisst `--schnell`:
 * jeder Lauf, der keinen Browser startet, und dazu die Läufe aus CLAUDE.md §31,
 * die einen brauchen (test96 und test100, die Sicherung mit echten Bytes).
 * `--liste` druckt die Auswahl, ohne einen Lauf zu starten.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Kein Job der CI fährt den vollen Lauf — und keiner heisst „alle",
 *      der nicht alle fährt. Gelesen wird JEDE Ablaufdatei unter
 *      `.github/workflows/` (`*.yml` und `*.yaml`), nicht nur pruefen.yml,
 *      und jede muss für den Leser unten mindestens einen Job ergeben — eine
 *      Datei, aus der er nichts liest, wäre sonst still geprüft. Ruft ein
 *      Schritt eine eigene Action (`uses: ./ci/v` — auch ausserhalb von
 *      `.github/`, auch eine, die ihrerseits eine ruft), liest er deren
 *      `action.yml` mit und zählt ihre Befehle für den Job, der sie ruft;
 *      jede gerufene muss es geben, und eine composite muss für den Leser
 *      ihre Schritte ergeben. Dazu, ohne den Leser, Zeile für Zeile jede
 *      YAML-Datei unter `.github/` und jede gerufene Action: in keiner steht
 *      ein voller Lauf.
 *   2  Genau ein Job fährt `npm run pruefen -- --schnell`, und jeder Aufruf
 *      des Orchestrators in der CI ist genau dieser (oder seine `--liste`).
 *      Als Aufruf zählen DIESE Schreibweisen — eine Liste, kein Beweis (siehe
 *      „Was er nicht hält"): jedes Wort `pruefen` hinter `npm`, `pnpm`,
 *      `yarn`, `bun` oder `deno` im selben Befehl, auch mit Fassung
 *      (`yarn pruefen`, `pnpm pruefen`, `yarn workspace redion pruefen`,
 *      `npx npm@10 run pruefen`); `test` hinter `run`, `run-script`, `rum`,
 *      `urn` oder `task`; `npm test` mit seinen anderen Namen (`t`, `tst`,
 *      `it`, `cit` …), auch mit Schaltern davor, die einen Wert als eigenes
 *      Wort nehmen (`npm -C . test`); `node --run pruefen` (Nodes eigener
 *      Skriptstarter); jeder Befehl, der `alle.mts` oder `volllauf.mts` nennt
 *      (auch über `npx`). Gesucht wird in dem, was die Shell ausführt:
 *      Anführungszeichen und ein `\` vor einem Zeichen fallen weg
 *      (`npm run 'pruefen'`, `npm run prue""fen`, `npm run pr\uefen`),
 *      Leerraum wird zusammengezogen, ein Kommentar hinter `#` abgeschnitten
 *      (auch ein `#` IN Anführungszeichen — siehe „Was er nicht hält"),
 *      und eine Zeile zerfällt an `&&`, `||`, `;` und an einem einzelnen `&`
 *      in ihre Befehle. Ein `run:` liest er so, wie YAML es liest: `|` und
 *      `>` auch mit Kommentar oder Einrückungszahl, ein gefalteter Block
 *      faltet über eine Leerzeile NICHT, ein Wert darf über mehrere Zeilen
 *      gehen, und in doppelten Anführungszeichen ist `\n` ein Umbruch.
 *      Ein `echo` oder `printf` gilt als Prosa und startet nichts — aber nur,
 *      wenn in seiner Zeile kein `$(`, kein Backtick und kein `<(` oder `>(`
 *      steht (dort wird etwas AUSGEFÜHRT und das Ergebnis ausgegeben) und
 *      seine Ausgabe in keine Röhre und keine Datei geht (`echo … | sh`,
 *      `echo … > s.sh`). Der schnelle Lauf steht allein in seiner Zeile —
 *      kein `|| true`, keine Röhre, kein `continue-on-error`.
 *      In package.json ist `pruefen` genau `node pruefungen/alle.mts`, ohne
 *      `prepruefen` und `postpruefen` (npm führt beide von selbst aus), und
 *      kein anderes Skript ruft den Orchestrator (sonst hiesse der volle
 *      Lauf in der CI nur anders: `npm run ci`).
 *      Jeder Job hat eine Zeitgrenze. Der schnelle Job baut die Einzeldatei
 *      und prüft, ob sie nachgezogen ist, holt Chromium genau dann, wenn die
 *      Auswahl einen Browser braucht, und sein Kommentar nennt die Messung
 *      und den vollen Lauf auf dem Rechner.
 *   3  Die Auswahl ist, was sie verspricht: jeder Lauf ohne Browser ist
 *      dabei; ein Lauf MIT Browser nur, wenn er in CLAUDE.md §31 beim Namen
 *      steht und in alle.mts einen Grund trägt; die Läufe aus §31 sind alle
 *      dabei; und was die Liste über einen Lauf sagt (Browser oder nicht),
 *      stimmt mit dem überein, was dieser Lauf selbst in der Datei liest.
 *   4  CLAUDE.md §30 sagt, was `--schnell` heisst.
 *
 * WAS ER NICHT HÄLT. Er liest Text; er führt die CI nicht aus, und YAML
 * liest er von Hand, ohne Paket — einem Verweis (`*a`) folgt er nicht. Ein
 * Lauf hinter einem eigenen Skript kommt an ihm vorbei: `bash ci.sh`, eine
 * eigene Action aus JavaScript oder Docker (er findet sie, liest aber ihren
 * Code nicht), eine fremde Action (`uses: jemand/etwas@v1`). Ebenso ein
 * Name, den erst die Shell oder GitHub zusammensetzt: eine Variable (`$LAUF`,
 * `eval "$LAUF"`), ein Ausdruck (`npm run ${{ matrix.skript }}`), eine
 * Röhre (`echo pruefen | xargs npm run`), ein `\x75` in `$'…'`. Und jede
 * Schreibweise, die nicht in der Liste in §2 steht — die Liste ist nicht
 * vollständig und kann es nicht sein. Dass ein Rot des schnellen Laufs den
 * Job rot macht, sichert er nur gegen die drei Formen in §2 (`|| true`,
 * Röhre, `continue-on-error`): ein `set +e` vor dem Lauf mit einem Befehl
 * dahinter, eine `shell:` ohne `-e` mit einem Befehl dahinter und ein `if:`
 * am Schritt oder am Job, das ihn gar nicht starten lässt, prüft er nicht.
 * Die Lesung Zeile für Zeile kennt keinen gefalteten Block und keinen Wert
 * über mehrere Zeilen; den fängt der Leser — in jeder Ablaufdatei und in
 * jeder Action, die ein Schritt ruft, solange beide in Blockschreibweise
 * mit Schlüsseln ohne Anführungszeichen stehen. Eine YAML-Datei, die kein
 * Schritt ruft, liest nur sie, und die fährt auch nicht.
 * Gemessen in der vierten Durchsicht von E745 (je eine Probe, jede grün
 * durchgelassen), also NICHT gehalten: ein `#` in Anführungszeichen schneidet
 * den Rest der Zeile ab (`echo "Lauf #1"; npm run pruefen`); ein Schritt in
 * Klammerschreibweise oder mit Schlüssel in Anführungszeichen
 * (`- { name: Z, uses: ./ci/v }`, `"uses": ./ci/v`, `"run": >`) und ein
 * Leerzeichen vor dem Doppelpunkt (`run : >`); ein Kommentar hinter dem
 * Schlüssel des ERSTEN Jobs (`voll: # …`) — der Leser verwirft dann den
 * ganzen Job, auch für „Jeder Job hat eine Zeitgrenze". Hier stand bis zur zweiten
 * Durchsicht von E745 „jede Form, die einen Lauf startet" und „ein Rot
 * bricht den Job ab" — beides mehr, als er hält. Und bis zur dritten fehlten
 * in seiner Liste `yarn pruefen` und `pnpm pruefen`, Anführungszeichen um
 * den Namen, ein einzelnes `&`, ein Wert über mehrere Zeilen und eine
 * Action ausserhalb von `.github/` — alle grün durchgelassen.
 *
 * WIE „STARTET EINEN BROWSER" HIER GELESEN WIRD — auf zwei Wegen, die
 * einander VERGLEICHEN. Weg 1 ist der von alle.mts: die Datei lädt
 * Playwright. Weg 2 ist unabhängig davon: der AUFRUF (`chromium.launch(`,
 * `launchPersistent…`, `connectOverCDP(`) im Code ohne Kommentare — nur die
 * Kommentare heraus, Zeichen für Zeichen (`ohneKommentareGenau`), die
 * Zeichenketten bleiben stehen. Beide Wege müssen dieselben Läufe finden.
 *
 * Die erste Fassung las Weg 2 über `nurCode`, das auch Zeichenketten leert,
 * und vereinigte beide Wege, statt sie zu vergleichen. In `test587` steht
 * `'image/*'`; für `nurCode` beginnt dort ein Kommentar, der den Aufruf des
 * Browsers verschluckt. Weg 2 kam auf 508, Weg 1 auf 509 — und die
 * Vereinigung zeigte 509, als stimmte alles (Durchsicht von E745).
 *
 * DIE FALLE, VOR DER ER SICH SELBST SCHÜTZT. Gegen einen Stand ohne `--liste`
 * würde `alle.mts --schnell --liste` den Schalter nicht kennen und die
 * Auswahl FAHREN — 549 Läufe. Deshalb fragt §3 zuerst die Quelle, ob es den
 * Schalter gibt, und startet sonst nichts; dazu eine Uhr von 60 Sekunden.
 *
 * KEIN BROWSER, KEIN PORT. Dieser Lauf liest Dateien und startet alle.mts
 * nur mit `--liste`.
 *
 *   node pruefungen/lauf/test610.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { nurCode, ohneKommentareGenau } from '../hilfe/quelltext.mts';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const LAUF = path.join(WURZEL, 'pruefungen', 'lauf');
const lies = (rel: string): string => fs.readFileSync(path.join(WURZEL, rel), 'utf8');

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

console.log('\n' + '─'.repeat(60));
console.log('Suite 610 — Die CI fährt den schnellen Lauf und sagt das auch');
console.log('─'.repeat(60));

/* ==========================================================================
 * Die Aufgaben der CI lesen
 * ------------------------------------------------------------------------
 * Kein YAML-Paket im Projekt (und keines nötig): die Dateien sind von Hand
 * geschrieben und regelmässig eingerückt — Jobs mit zwei Leerzeichen, ihre
 * Schlüssel mit vier, die Schritte darunter. `run: |` sammelt die folgenden
 * Zeilen, die tiefer stehen als der Schlüssel. Eine Datei, die anders
 * eingerückt ist, ergibt hier keinen Job — und genau das prüft §1, statt
 * sie still für leer zu halten.
 * ========================================================================*/
type Aufgabe = {
  /** Die Ablaufdatei unter `.github/workflows/`, aus der der Job stammt. */
  datei: string;
  id: string;
  name: string;
  zeit: number | null;
  schrittNamen: string[];
  /** Jede Befehlszeile ganz — eine Fortsetzung mit `\` angehängt, so gelesen
   *  wie die Shell sie liest (siehe `glatt`). */
  zeilen: string[];
  /** Dieselben Zeilen, zerlegt in ihre einzelnen Befehle — ohne die, die
   *  nur etwas ausgeben (siehe `nurAusgabe`). */
  befehle: string[];
  /** Steht irgendwo im Job `continue-on-error` (ausser `false`)? */
  weiterBeiFehler: boolean;
  /** Die eigenen Actions, die ein Schritt dieses Jobs über `uses: ./…`
   *  ruft, so wie sie dastehen (`./ci/v`). Ihre Befehle mischt `einmischen`
   *  unten in die dieses Jobs. */
  eigene: string[];
  text: string;           // der ganze Block, Kommentare eingeschlossen
};

const einzug = (z: string): number => z.match(/^ */)?.[0].length ?? 0;

/** So liest die Shell eine Zeile: ein Kommentar beginnt mit `#` am
 *  Wortanfang und reicht bis zum Ende, und wie viel Leerraum zwischen zwei
 *  Wörtern steht, ist gleich. Ohne das wäre `npm  run pruefen` (zwei
 *  Leerzeichen) kein Aufruf und `npm run pruefen # --schnell` kein voller
 *  Lauf — beides war in der ersten Fassung so (Durchsicht von E745). */
const glatt = (zeile: string): string =>
  zeile.replace(/(^|\s)#.*$/, '$1').replace(/\s+/g, ' ').trim();

/** Eine Zeile kann mehrere Befehle tragen — `a && b`, `a; b`, `a || b` und
 *  `a & b` (das `&` schickt `a` in den Hintergrund, und `b` läuft sofort).
 *  Jeder zählt für sich: ein `npm run pruefen -- --liste && npm run pruefen`
 *  ist ein voller Lauf, auch wenn die Zeile mit der Liste beginnt — und
 *  `echo start & npm run pruefen` ist kein `echo`, sondern zwei Befehle.
 *  Die Fassung vor der dritten Durchsicht von E745 teilte nicht am
 *  einzelnen `&`, und `nurAusgabe` warf die ganze Zeile als Prosa weg. Ein
 *  `&` in einer Umleitung (`2>&1`, `&>`, `|&`) teilt nicht. Was zwei
 *  Zeilen sind, bleibt zwei Befehle, auch wenn es in EINEM Text ankommt (ein
 *  gefalteter Block mit Leerzeile, ein `\n` in Anführungszeichen). Eine
 *  Röhre (`a | b`) bleibt EIN Befehl: hinter `| tee` endet der Schritt mit
 *  dem Ergebnis von `tee`, und das ist nicht der schnelle Lauf. */
const TRENNER = /&&|\|\||;|(?<![&<>|])&(?![&>])/;
const befehleIn = (text: string): string[] =>
  text.split(/\r?\n/).flatMap(zeile => glatt(zeile).split(TRENNER)).map(t => t.trim()).filter(Boolean);

/** Ein Befehl, der nur etwas AUSGIBT, startet nichts: ein
 *  `echo "  npm run pruefen -- --schnell …"` in einer Hilfe ist Prosa.
 *  Aber nur, solange die Ausgabe wirklich ins Protokoll geht. Steht in der
 *  ZEILE ein `$(`, ein Backtick, ein `<(` oder ein `>(`, wird dort etwas
 *  ausgeführt und erst das Ergebnis ausgegeben — `echo "$(npm run pruefen)"`
 *  und `echo <(npm run pruefen)` fahren den vollen Lauf. Gefragt wird die
 *  Zeile, nicht der Befehl: `$(true; npm run pruefen)` zerfällt an `;` in
 *  zwei Stücke, und das zweite trägt kein `$(` mehr. Und eine Röhre oder
 *  eine Umleitung gibt die „Prosa" einem Programm: `echo npm run pruefen |
 *  sh`, `echo npm run pruefen > s.sh && bash s.sh`. Gefragt wird nach jedem
 *  `|` und `>` im Befehl, auch in Anführungszeichen — lieber einmal zu
 *  streng: `echo "… test<nr>.mts …"` in der Hilfe von pruefen.yml ist damit
 *  ein Befehl, aber keiner, der etwas startet. Die erste Fassung nahm jedes
 *  `echo` aus (zweite Durchsicht von E745), die zweite kannte `<(` und `>`
 *  nicht (dritte). */
const PROSA = /^(?:echo|printf)\b/;
const nurAusgabe = (befehl: string, zeile: string): boolean =>
  PROSA.test(befehl) && !/\$\(|`|[<>]\(/.test(zeile) && !/[|>]/.test(befehl);

/** Ein `\` am Zeilenende setzt die Zeile fort — ohne Leerzeichen, so wie
 *  die Shell: `npm run pru\` und `efen` sind `npm run pruefen`. In einem
 *  Kommentar setzt er nichts fort. */
const mitFortsetzung = (zeilen: string[]): string[] => {
  const raus: string[] = [];
  let offen = '';
  for (const z of zeilen) {
    if (z.endsWith('\\') && !/(^|\s)#/.test(z)) { offen += z.slice(0, -1); continue; }
    raus.push(offen + z);
    offen = '';
  }
  if (offen) raus.push(offen);
  return raus;
};

/** Die Fluchtfolgen in doppelten Anführungszeichen von YAML: `\n` ist ein
 *  Umbruch, `\u0075` ein `u`, `\"` ein `"`. */
const FLUCHT: Record<string, string> = { n: '\n', r: '\n', N: '\n', L: '\n', P: '\n', t: ' ', _: ' ', ' ': ' ',
  '"': '"', '\\': '\\', '/': '/', '0': '', a: '', b: '', e: '', f: '', v: '' };
const ausDoppelt = (s: string): string =>
  s.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|[\s\S])/g, (_g, f: string) =>
    f.length > 1 ? String.fromCodePoint(parseInt(f.slice(1), 16)) : (FLUCHT[f] ?? f));

/** Was die Shell aus einem `run:` bekommt, Zeile für Zeile — so, wie YAML
 *  den Wert liest. `wert` steht hinter `run:`, `tiefer` sind die Zeilen
 *  darunter, die tiefer stehen als `run` (Leerzeilen eingeschlossen).
 *
 *    `|`  (auch `|-`, `|2`, ein Kommentar dahinter): jede Zeile, wie sie
 *         steht, ein `\` am Ende setzt fort.
 *    `>`  YAML faltet zwei Zeilen zu einer — aber NICHT über eine Leerzeile
 *         und nicht neben einer tiefer eingerückten Zeile: dort bleibt der
 *         Umbruch, und die Shell sieht zwei Befehle.
 *    sonst  ein einfacher Wert oder einer in Anführungszeichen, auch über
 *         mehrere Zeilen (YAML faltet sie wie bei `>`); in doppelten
 *         Anführungszeichen gelten die Fluchtfolgen.
 *
 *  Die Fassung vor der dritten Durchsicht von E745 kannte nur `|`, `|-`,
 *  `|+`, `>` mit derselben Faltung über jede Zeile und einen Wert in EINER
 *  Zeile: `run: npm run` mit `pruefen` darunter fuhr unbemerkt den vollen
 *  Lauf, und ein `>`-Block mit Leerzeile vor `npm run pruefen` galt als
 *  ein einziges `echo`. */
const shellZeilen = (wert: string, tiefer: string[]): string[] => {
  const voll = tiefer.filter(b => b.trim() !== '');
  const basis = voll.length ? Math.min(...voll.map(einzug)) : 0;
  const block = /^([|>])(?:[1-9][-+]?|[-+][1-9]?)?$/.exec(wert.replace(/(^|\s+)#.*$/, ''))?.[1];
  if (block === '|') return mitFortsetzung(tiefer.map(b => b.slice(basis).replace(/\s+$/, '')));
  if (block === '>') {
    let s = '', vorigeTief: boolean | null = null, leer = 0;
    for (const b of tiefer) {
      if (b.trim() === '') { if (vorigeTief !== null) leer++; continue; }
      const tief = einzug(b) > basis;
      if (vorigeTief !== null) s += leer === 0 && !tief && !vorigeTief ? ' ' : '\n';
      s += b.slice(basis).replace(/\s+$/, '');
      vorigeTief = tief;
      leer = 0;
    }
    return mitFortsetzung(s.split('\n'));
  }
  const zeichen = ([wert, ...tiefer.map(b => b.trim())].find(t => t !== '') ?? '').charAt(0);
  const einfach = zeichen !== '"' && zeichen !== "'";
  let s = '', angefangen = false, leer = 0;
  for (const t of [wert, ...tiefer.map(b => b.trim())]) {
    if (t === '') { if (angefangen) leer++; continue; }
    if (einfach && t.startsWith('#')) continue;
    if (angefangen) {
      if (zeichen === '"' && /(^|[^\\])(\\\\)*\\$/.test(s)) s = s.slice(0, -1);   // `\` am Ende: ohne Umbruch weiter
      else s += leer ? '\n' : ' ';
    }
    s += t;
    angefangen = true;
    leer = 0;
  }
  const inhalt = zeichen === '"' && /^"[\s\S]*"$/.test(s) ? ausDoppelt(s.slice(1, -1))
    : zeichen === "'" && /^'[\s\S]*'$/.test(s) ? s.slice(1, -1).replace(/''/g, "'")
    : s;
  return mitFortsetzung(inhalt.split('\n'));
};

/** Ein Schritt, der eine eigene Action ruft: `uses: ./ci/v` (auch in
 *  Anführungszeichen). Eine fremde (`uses: jemand/etwas@v1`) liest er nicht. */
const EIGENE = /^\s+(?:-\s+)?uses:\s*(['"]?)(\.\/[^'"\s#]*)\1\s*(?:#.*)?$/;

/** Die Jobs einer Ablaufdatei — oder, mit `wurzel = 'runs'`, die Schritte
 *  einer eigenen Action: dort steht `steps:` mit zwei Leerzeichen unter
 *  `runs:`, genau wie ein Job unter `jobs:`, und wird ein Abschnitt mit der
 *  Kennung `steps`. */
const aufgabenAus = (yml: string, datei: string, wurzel = 'jobs'): Aufgabe[] => {
  const zeilen = yml.split('\n');
  const start = zeilen.findIndex(z => new RegExp('^' + wurzel + ':\\s*$').test(z));
  if (start < 0) return [];
  const liste: Aufgabe[] = [];
  let jetzt: Aufgabe | null = null;
  /* Der Kommentar ÜBER einem Job (zwei Leerzeichen und `#`) gehört zu dem
     Job, der darauf folgt — nicht zu dem davor. */
  let vorspann = '';
  const zeileDazu = (a: Aufgabe, zeile: string): void => {
    const g = glatt(zeile);
    if (!g) return;
    a.zeilen.push(g);
    a.befehle.push(...befehleIn(g).filter(b => !nurAusgabe(b, g)));
  };
  for (let i = start + 1; i < zeilen.length; i++) {
    const z = zeilen[i] ?? '';
    if (/^[^\s#]/.test(z)) break;                       // nächster oberster Schlüssel
    if (/^ {2}#/.test(z) || (vorspann && z.trim() === '')) { vorspann += z + '\n'; continue; }
    const kopf = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(z);
    if (kopf) {
      jetzt = { datei, id: kopf[1] ?? '', name: '', zeit: null, schrittNamen: [], zeilen: [], befehle: [],
        weiterBeiFehler: false, eigene: [], text: vorspann };
      vorspann = '';
      liste.push(jetzt);
      continue;
    }
    if (!jetzt) continue;
    if (vorspann) { jetzt.text += vorspann; vorspann = ''; }
    jetzt.text += z + '\n';
    const name = /^ {4}name:\s*(.+?)\s*$/.exec(z);
    if (name) jetzt.name = (name[1] ?? '').replace(/^['"]|['"]$/g, '');
    const zeit = /^ {4}timeout-minutes:\s*(\d+)\s*$/.exec(z);
    if (zeit) jetzt.zeit = Number(zeit[1]);
    if (/^\s+(?:-\s+)?continue-on-error:\s*(?!false\s*$)\S/.test(z)) jetzt.weiterBeiFehler = true;
    const schritt = /^\s+-\s+name:\s*(.+?)\s*$/.exec(z);
    if (schritt) jetzt.schrittNamen.push((schritt[1] ?? '').replace(/^['"]|['"]$/g, ''));
    const eigen = EIGENE.exec(z);
    if (eigen) jetzt.eigene.push(eigen[2] ?? '');
    const lauf = /^(\s+(?:-\s+)?)run:\s*(.*?)\s*$/.exec(z);
    if (!lauf) continue;
    /* Alles, was danach tiefer steht als `run`, gehört zu seinem Wert —
       als Block, als Fortsetzung eines einfachen Werts oder einer
       Zeichenkette in Anführungszeichen. Leerzeilen am Ende nicht. */
    const spalte = (lauf[1] ?? '').length;
    const tiefer: string[] = [];
    for (let k = i + 1; k < zeilen.length; k++) {
      const b = zeilen[k] ?? '';
      if (b.trim() !== '' && einzug(b) <= spalte) break;
      tiefer.push(b);
    }
    while (tiefer.length > 0 && (tiefer[tiefer.length - 1] ?? '').trim() === '') tiefer.pop();
    i += tiefer.length;
    jetzt.text += tiefer.map(b => b + '\n').join('');
    for (const zeile of shellZeilen(lauf[2] ?? '', tiefer)) zeileDazu(jetzt, zeile);
  }
  return liste;
};

/* JEDE Ablaufdatei, nicht nur pruefen.yml: ein voller Lauf in einer zweiten
   Datei fährt genauso bei jedem Push (zweite Durchsicht von E745). */
const ABLAEUFE = '.github/workflows';
const ablaufDateien = fs.readdirSync(path.join(WURZEL, ABLAEUFE)).filter(f => /\.ya?ml$/.test(f)).sort();
const jobsJeDatei = new Map<string, Aufgabe[]>(
  ablaufDateien.map(f => [f, aufgabenAus(lies(ABLAEUFE + '/' + f), f)]));
const aufgaben = [...jobsJeDatei.values()].flat();
/** Wo ein Job steht, für die Meldungen: Datei und Kennung. */
const wo = (a: Aufgabe): string => a.datei + '/' + a.id;
for (const [f, jobs] of jobsJeDatei) {
  console.log('\n    Jobs in ' + f + ': ' +
    (jobs.map(a => a.id + ' („' + a.name + '", ' + (a.zeit ?? '—') + ' min)').join(' · ') || 'KEINER'));
}

/* Eigene Actions. Ein Schritt mit `uses: ./ci/v` führt die `run:` aus
   `ci/v/action.yml` aus, als stünden sie im Job — und der Pfad muss nicht
   unter `.github/` liegen. Die Fassung vor der dritten Durchsicht von E745
   las nur `.github/` und nur Zeile für Zeile: `uses: ./ci/v` mit einem
   vollen Lauf darin kam an jeder Zusage vorbei. Jetzt liest der Leser jede
   gerufene Action (`runs:` statt `jobs:`, siehe `aufgabenAus`), auch eine,
   die eine Action ruft, und ihre Befehle zählen für den Job, der sie ruft.
   Ein Pfad mit `.yml` am Ende ist ein wiederverwendbarer Ablauf: er muss
   unter `.github/workflows/` stehen und ist dort schon gelesen. */
const aktionen = new Map<string, Aufgabe[]>();    // Datei → Abschnitte des Lesers
const fehlendeAktionen = new Set<string>();
const aktionsDatei = (ref: string): string | null => {
  const ort = path.posix.normalize(ref.replace(/^\.\//, '') || '.').replace(/\/$/, '');
  if (ort === '..' || ort.startsWith('../')) return null;
  if (/\.ya?ml$/.test(ort)) return ort.startsWith(ABLAEUFE + '/') && fs.existsSync(path.join(WURZEL, ort)) ? ort : null;
  for (const n of ['action.yml', 'action.yaml']) {
    const rel = (ort === '.' ? '' : ort + '/') + n;
    if (fs.existsSync(path.join(WURZEL, rel))) return rel;
  }
  return null;
};
const einmischen = (job: Aufgabe, refs: string[], von: string, gesehen: Set<string>): void => {
  for (const ref of refs) {
    const rel = aktionsDatei(ref);
    if (!rel) { fehlendeAktionen.add(von + ' → ' + ref); continue; }
    if (rel.startsWith(ABLAEUFE + '/') || gesehen.has(rel)) continue;
    gesehen.add(rel);
    if (!aktionen.has(rel)) aktionen.set(rel, aufgabenAus(lies(rel), rel, 'runs'));
    for (const s of aktionen.get(rel) ?? []) {
      job.zeilen.push(...s.zeilen);
      job.befehle.push(...s.befehle);
      job.schrittNamen.push(...s.schrittNamen);
      if (s.weiterBeiFehler) job.weiterBeiFehler = true;
      einmischen(job, s.eigene, rel, gesehen);
    }
  }
};
for (const job of aufgaben) einmischen(job, job.eigene, wo(job), new Set());
const aktionsDateien = [...aktionen.keys()].sort();
console.log('    Eigene Actions, die ein Schritt ruft: ' + (aktionsDateien.join(' · ') || 'keine'));

/** Die Schreibweisen, die den Orchestrator oder den Lauf in Stücken
 *  starten — gesucht ÜBERALL im Befehl, nicht nur am Anfang: `timeout 3600
 *  npm run pruefen`, `npx tsx pruefungen/alle.mts` und `env X=1 npm test`
 *  sind Aufrufe. `npm test` gehört dazu, auch wenn package.json heute kein
 *  `test` kennt: wer es einträgt, soll es nicht an diesem Lauf vorbei in die
 *  CI bringen. Eine Liste, kein Beweis (Kopf, „Was er nicht hält").
 *
 *  `SCHALTER` ist ein Schalter vor dem Unterbefehl, mit oder ohne Wert:
 *  `--silent`, `--prefix=.`, aber auch `--prefix .` und `-C .` — npm nimmt
 *  den Wert dann aus dem nächsten Wort. Die erste Fassung kannte nur
 *  Schalter ohne eigenes Wort, und `npm --prefix . run pruefen` kam vorbei.
 *  `node --run` ist Nodes eigener Skriptstarter (seit Node 22): er liest
 *  package.json wie npm und kam ebenso vorbei (zweite Durchsicht von E745).
 *
 *  Das Skript `pruefen` ist seit der dritten Durchsicht JEDES Wort `pruefen`
 *  hinter einem Paketmanager im selben Befehl, nicht nur das hinter `run`:
 *  `yarn pruefen`, `pnpm pruefen` und `bun pruefen` starten ein Skript auch
 *  ohne `run`, `yarn workspace redion pruefen` mit einem Unterbefehl davor,
 *  `deno task pruefen` liest package.json ebenso, und `npx npm@10 run
 *  pruefen` trägt eine Fassung am Namen. `rum` und `urn` sind npms
 *  Kurzformen für `run-script`, `cit` und `sit` fahren `npm test` nach
 *  `npm ci`. `bun test` und `deno test` fehlen mit Absicht: sie starten den
 *  eigenen Testläufer, nicht das Skript. */
const SCHALTER = String.raw`(?:\s+-\S+(?:\s+[^\s-]\S*)?)*`;
const PAKET = String.raw`\b(?:npm|pnpm|yarn|bun|deno)\b(?:@\S*)?`;
const AUFRUFE: readonly RegExp[] = [
  new RegExp(String.raw`${PAKET}.*?\spruefen\b`),
  new RegExp(String.raw`${PAKET}${SCHALTER}\s+(?:run|run-script|rum|urn|task)\b${SCHALTER}\s+test\b`),
  new RegExp(String.raw`\b(?:npm|pnpm|yarn)\b(?:@\S*)?${SCHALTER}\s+(?:test|tst|t|it|install-test|cit|sit|install-ci-test|clean-install-test)\b`),
  /\bnode\b.*?\s--run(?:=|\s+)(?:pruefen|test)\b/,
  /(?:^|[\s/=])alle\.mts\b/,
  /(?:^|[\s/=])volllauf\.mts\b/,
];

/** So sieht die Shell die Wörter, bevor sie den Befehl ausführt:
 *  Anführungszeichen fallen weg, ein `\` vor einem Zeichen auch, und `$'…'`
 *  gilt wie `'…'`. `npm run 'pruefen'`, `npm run prue""fen` und
 *  `npm run pr\uefen` rufen alle `pruefen` — für die Fassung vor der dritten
 *  Durchsicht von E745 waren sie kein Aufruf. Was in `$'…'` mit `\x` steht,
 *  löst er nicht auf (Kopf, „Was er nicht hält"). */
const wieDieShell = (b: string): string =>
  b.replace(/\$(?=['"])/g, '').replace(/\\([\s\S])/g, '$1').replace(/['"]/g, '');

/** Prosa (`nurAusgabe`) ist schon beim Lesen aus den Befehlen gefallen. */
const istOrchestrator = (b: string): boolean => AUFRUFE.some(m => m.test(wieDieShell(b)));

/** Fährt dieser Befehl den VOLLEN Lauf? Der Lauf in Stücken immer; sonst
 *  ein Aufruf ohne Auswahl (keine Nummer, kein `--schnell`, kein `server`,
 *  kein `--liste`). */
const istVoll = (befehl: string): boolean => {
  const b = wieDieShell(befehl);
  const treffer = AUFRUFE.map(m => m.exec(b)).find(t => t !== null) ?? null;
  if (!treffer) return false;
  if (/volllauf\.mts\b/.test(b)) return true;
  const rest = b.slice(treffer.index + treffer[0].length);
  return !/--schnell\b|--liste\b|\bserver\b|(^|\s)\d+(\s|$)/.test(rest);
};

/* ==========================================================================
 * 1 · KEIN JOB FÄHRT DEN VOLLEN LAUF (Redurs Weg (c), E745)
 * ========================================================================*/
console.log('\n1 · Der volle Lauf bleibt auf dem Rechner');

const leereDateien = ablaufDateien.filter(f => (jobsJeDatei.get(f) ?? []).length === 0);
p('Jede Ablaufdatei unter .github/workflows/ ergibt mindestens einen Job (sonst wäre sie still ungeprüft)',
  ablaufDateien.length > 0 && leereDateien.length === 0,
  ablaufDateien.length === 0 ? 'keine Ablaufdatei' : leereDateien.join(', '));

/* Eine composite Action, aus der der Leser keine Schritte liest (weil sie
   anders eingerückt ist), wäre still geprüft — dieselbe Frage wie eben für
   die Ablaufdateien. Eine aus JavaScript oder Docker hat keine Schritte;
   ihren Code liest er nicht (Kopf, „Was er nicht hält"). */
const ohneSchritte = aktionsDateien.filter(rel =>
  /^\s*using:\s*['"]?composite['"]?\s*(?:#.*)?$/m.test(lies(rel)) && !(aktionen.get(rel) ?? []).some(a => a.id === 'steps'));
p('Jede eigene Action, die ein Schritt über `uses: ./…` ruft, gibt es — auch ausserhalb von .github/ —, und eine composite ergibt für den Leser ihre Schritte',
  fehlendeAktionen.size === 0 && ohneSchritte.length === 0,
  [...[...fehlendeAktionen].map(f => 'nicht gefunden: ' + f), ...ohneSchritte.map(r => 'keine Schritte gelesen: ' + r)].join(' · '));

const vollJobs = aufgaben.filter(a => a.befehle.some(istVoll));
p('Kein Job der CI fährt den vollen Lauf — er bleibt bei volllauf.mts (§30, L254)',
  aufgaben.length > 0 && vollJobs.length === 0,
  aufgaben.length === 0 ? 'keine Jobs gelesen'
    : vollJobs.map(a => wo(a) + ': ' + a.befehle.filter(istVoll).join(' | ')).join(' · '));

/* Ohne den Leser, Zeile für Zeile: jede YAML-Datei unter `.github/` — auch
   eine eigene Action (`.github/actions/…/action.yml`), und eine Ablaufdatei,
   die anders eingerückt ist, als der Leser oben erwartet — und dazu jede
   Action, die ein Schritt ruft, wo immer sie liegt. Eine Fortsetzung mit `\`
   wird angehängt, ein Schlüssel `run:` vorne abgenommen, ein `\n` in
   doppelten Anführungszeichen ist ein Umbruch; was danach einen vollen Lauf
   fährt, ist einer. Gröber als der Leser — es kennt keine Jobs, keine
   gefalteten Blöcke (`run: >`) und keinen Wert über mehrere Zeilen —, aber
   an keine Einrückung gebunden. */
const yamlUnter = (rel: string): string[] =>
  fs.readdirSync(path.join(WURZEL, rel), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? yamlUnter(rel + '/' + e.name)
      : /\.ya?ml$/.test(e.name) ? [rel + '/' + e.name] : []);
const yamlDateien = [...new Set([...yamlUnter('.github'), ...aktionsDateien])].sort();
const vollInZeilen = yamlDateien.flatMap(rel =>
  lies(rel).replace(/\\\r?\n\s*/g, ' ').split('\n').flatMap(roh => {
    const ohneSchluessel = glatt(roh).replace(/^(?:-\s+)?run:\s*/, '');
    const doppelt = /^"(.*)"$/.exec(ohneSchluessel);
    const zeile = doppelt ? ausDoppelt(doppelt[1] ?? '') : ohneSchluessel.replace(/^'(.*)'$/, '$1');
    return befehleIn(zeile).filter(b => !nurAusgabe(b, zeile) && istVoll(b)).map(b => rel + ': ' + b);
  }));
console.log('    YAML unter .github/ und gerufene Actions: ' + yamlDateien.join(' · '));
p('Auch Zeile für Zeile steht in keiner YAML-Datei unter .github/ und in keiner gerufenen Action ein voller Lauf',
  yamlDateien.length > 0 && vollInZeilen.length === 0, vollInZeilen.join(' · '));

const behauptetAlle = (a: Aufgabe): boolean =>
  [a.name, ...a.schrittNamen].some(n => /(^|[^\p{L}])alle([^\p{L}]|$)/iu.test(n));
const falscheBehauptung = aufgaben.filter(a => behauptetAlle(a) && !a.befehle.some(istVoll));
p('Kein Job heisst „alle", der nicht alle fährt',
  falscheBehauptung.length === 0,
  falscheBehauptung.map(a => wo(a) + ' („' + a.name + '")').join(', '));

/* ==========================================================================
 * 2 · DER SCHNELLE JOB
 * ========================================================================*/
console.log('\n2 · Der schnelle Job fährt genau --schnell, in einer Zeitgrenze');

const SCHNELL = 'npm run pruefen -- --schnell';
const schnelle = aufgaben.filter(a => a.befehle.includes(SCHNELL));
p('Genau ein Job fährt `' + SCHNELL + '`', schnelle.length === 1,
  schnelle.length + ' gefunden');

/* `--liste` fährt nichts (es druckt die Auswahl); jeder andere Aufruf des
   Orchestrators muss genau der schnelle sein. */
const andereAufrufe = aufgaben.flatMap(a =>
  a.befehle.filter(b => istOrchestrator(b) && b !== SCHNELL && b !== SCHNELL + ' --liste')
    .map(b => wo(a) + ': ' + b));
p('… und jeder Aufruf des Orchestrators in der CI ist genau dieser (oder seine Liste)',
  andereAufrufe.length === 0, andereAufrufe.join(' · '));

/* `npm run pruefen` ist nur so viel wert wie das, was package.json darunter
   einträgt — und npm führt `prepruefen` und `postpruefen` von selbst davor
   und danach aus. Ein voller Lauf dort käme an jeder Zeile oben vorbei. */
const paket = JSON.parse(lies('package.json')) as { scripts?: Record<string, string> };
const skripte = paket.scripts ?? {};
p('package.json: `pruefen` ist genau `node pruefungen/alle.mts`, ohne prepruefen und postpruefen',
  skripte['pruefen'] === 'node pruefungen/alle.mts' && !('prepruefen' in skripte) && !('postpruefen' in skripte),
  JSON.stringify({ pruefen: skripte['pruefen'], prepruefen: skripte['prepruefen'], postpruefen: skripte['postpruefen'] }));

/* Ein ANDERES Skript, das den Orchestrator ruft, wäre der volle Lauf unter
   anderem Namen: `npm run ci` steht in keiner Schreibweise oben, und mit
   `"ci": "node pruefungen/alle.mts"` fuhr er an der Fassung vor der dritten
   Durchsicht von E745 vorbei. Ein `postinstall` fiele ebenso darunter —
   npm führt es bei jedem `npm install` aus. */
const fremdeSkripte = Object.entries(skripte)
  .filter(([n, s]) => n !== 'pruefen' && befehleIn(s).some(istOrchestrator))
  .map(([n, s]) => n + ': ' + s);
p('package.json: kein anderes Skript ruft den Orchestrator (sonst hiesse der volle Lauf in der CI nur anders)',
  fremdeSkripte.length === 0, fremdeSkripte.join(' · '));

const ohneZeit = aufgaben.filter(a => !(a.zeit !== null && a.zeit > 0));
p('Jeder Job hat eine Zeitgrenze (timeout-minutes)', aufgaben.length > 0 && ohneZeit.length === 0,
  ohneZeit.map(wo).join(', '));

const schnell = schnelle[0];

/* Ein Rot soll den Job rot machen. `npm run pruefen -- --schnell || true`
   zerlegt sich in den schnellen Lauf und ein `true` — beide Befehle für sich
   unverdächtig, zusammen ein Job, der immer grün ist. Dasselbe tun eine
   Röhre (`| tee …` ohne pipefail) und `continue-on-error`. Diese drei Formen
   fängt die Zusage unten; `set +e`, eine `shell:` ohne `-e` und ein `if:`
   fängt sie nicht (Kopf, „Was er nicht hält"). Hier stand bis zur zweiten
   Durchsicht „und ein Rot bricht den Job ab" — mehr, als sie prüft. */
const zeilenMitSchnell = schnell
  ? schnell.zeilen.filter(z => befehleIn(z).some(b => !nurAusgabe(b, z) && b.includes(SCHNELL)))
  : [];
p('Der schnelle Lauf steht allein in seiner Zeile — kein `|| true`, keine Röhre, kein continue-on-error',
  !!schnell && zeilenMitSchnell.includes(SCHNELL) && !schnell.weiterBeiFehler &&
    zeilenMitSchnell.every(z => z === SCHNELL || z === SCHNELL + ' --liste'),
  schnell ? zeilenMitSchnell.join(' · ') + (schnell.weiterBeiFehler ? ' · continue-on-error' : '') : 'kein Job');
p('Der schnelle Job heisst so, wie er ist (sein Name sagt „schnell")',
  !!schnell && /schnell/i.test(schnell.name), schnell ? '„' + schnell.name + '"' : 'kein Job');
p('Er baut die Einzeldatei aus den Quellen',
  !!schnell && schnell.befehle.includes('node bauen.mts'));
p('… und prüft, ob sie nachgezogen ist',
  !!schnell && schnell.befehle.some(b => b.includes('git diff --quiet -- redion-einzeldatei.html')));
p('Sein Kommentar nennt die Messung und den vollen Lauf auf dem Rechner (volllauf.mts)',
  !!schnell && /gemessen/i.test(schnell.text) && schnell.text.includes('volllauf.mts'));
const holtChromium = !!schnell &&
  schnell.befehle.some(b => /playwright install\b/.test(b) && /\bchromium\b/.test(b));

/* ==========================================================================
 * 3 · DIE AUSWAHL --schnell IST, WAS SIE VERSPRICHT
 * ========================================================================*/
console.log('\n3 · Die Auswahl --schnell');

/** Startet dieser Lauf einen Browser? Zwei Wege, siehe Kopf — sie werden
 *  VERGLICHEN, nicht vereinigt. Weg 1 ist der von alle.mts, Weg 2 liest den
 *  Aufruf im Code ohne Kommentare. */
const LAEDT_PLAYWRIGHT = /\bfrom\s+['"]playwright(?:-core)?['"]|\bimport\(\s*['"]playwright(?:-core)?['"]\s*\)|\brequire\(\s*['"]playwright(?:-core)?['"]\s*\)/;
const RUFT_BROWSER = /\b(?:chromium|firefox|webkit)\s*\.\s*launch(?:PersistentContext)?\s*\(|\.connectOverCDP\s*\(/;

/* Kann Weg 2 an der Falle vorbei, an der die erste Fassung hängenblieb?
   Eine Probe derselben Bauart wie test587: eine Zeichenkette mit `/*` vor
   dem Aufruf und ein echter Kommentar danach — für einen Filter, der
   Zeichenketten nicht kennt, reicht der Kommentar vom `/*` in der
   Zeichenkette bis dorthin und verschluckt den Aufruf. Und die Gegenrichtung: ein Aufruf, der nur in einem Kommentar
   steht, zählt nicht. Der Aufruf ist hier zusammengesetzt, damit dieser
   Lauf ihn nicht selbst als Zeichenkette im Code trägt — Weg 2 lässt
   Zeichenketten stehen und hielte test610 sonst für einen Browserlauf. */
const AUFRUF = ['chromium', 'launch()'].join('.');
const PROBE_FALLE = "const art = 'image/" + "*';\nconst b = await " + AUFRUF + ";\n/" + "* ein echter Kommentar *" + "/\n";
const PROBE_KOMMENTAR = 'const b = 1; /' + '* await ' + AUFRUF + ' *' + '/\n// await ' + AUFRUF + '\n';
p('Weg 2 liest an einer Zeichenkette mit „/*" vorbei (die Falle aus test587) und zählt keinen Aufruf im Kommentar',
  RUFT_BROWSER.test(ohneKommentareGenau(PROBE_FALLE)) && !RUFT_BROWSER.test(ohneKommentareGenau(PROBE_KOMMENTAR)));
console.log('    zum Vergleich: `nurCode` sieht den Aufruf in der Probe ' +
  (RUFT_BROWSER.test(nurCode(PROBE_FALLE)) ? 'auch' : 'NICHT — das war die erste Fassung'));

const wegImport = new Set<string>();
const wegAufruf = new Set<string>();
const alleLaeufe: string[] = [];
for (const f of fs.readdirSync(LAUF).filter(f => /\.mts$/.test(f)).sort()) {
  const name = f.replace(/\.mts$/, '');
  alleLaeufe.push(name);
  const roh = fs.readFileSync(path.join(LAUF, f), 'utf8');
  if (LAEDT_PLAYWRIGHT.test(roh)) wegImport.add(name);
  if (RUFT_BROWSER.test(ohneKommentareGenau(roh))) wegAufruf.add(name);
}
const browserLaeufe = new Set<string>([...wegImport, ...wegAufruf]);
console.log('    gelesen: ' + alleLaeufe.length + ' Läufe · Weg 1 (lädt Playwright) ' + wegImport.size +
  ' · Weg 2 (ruft den Browser, im Code ohne Kommentare) ' + wegAufruf.size +
  ' · ohne Browser ' + (alleLaeufe.length - browserLaeufe.size));
const nurWeg1 = [...wegImport].filter(n => !wegAufruf.has(n));
const nurWeg2 = [...wegAufruf].filter(n => !wegImport.has(n));
p('Beide Wege finden dieselben Browserläufe',
  wegImport.size > 0 && nurWeg1.length === 0 && nurWeg2.length === 0,
  'nur Weg 1: ' + (nurWeg1.join(' ') || '—') + ' · nur Weg 2: ' + (nurWeg2.join(' ') || '—'));

/* §31 — die Läufe, die man beim Namen kennt. Die dokumentierte Liste der
   Browserläufe, die in den schnellen Lauf dürfen. */
const claude = lies('CLAUDE.md');
const abschnitt31 = /\n## 31\.[\s\S]*?(?=\n## 32\.)/.exec(claude)?.[0] ?? '';
const namen31 = [...abschnitt31.matchAll(/^\|\s*`(test\d+)`\s*\|/gm)].map(m => m[1] ?? '');
console.log('    CLAUDE.md §31 nennt: ' + (namen31.join(' ') || 'NICHTS'));
p('CLAUDE.md §31 nennt seine Läufe beim Namen', namen31.length >= 6, namen31.length + ' gefunden');

const ORCH = lies('pruefungen/alle.mts');
const kenntListe = /['"]--liste['"]/.test(ORCH);
p('alle.mts kennt `--liste` (die Auswahl drucken, ohne zu fahren)', kenntListe);

type Zeile = { name: string; browser: boolean; grund: string };
let zeilen: Zeile[] = [];
let kopfZahl = NaN;
if (!kenntListe) {
  console.log('    → ohne `--liste` würde alle.mts die Auswahl FAHREN; §3 startet deshalb nichts');
  p('Die Auswahl --schnell liess sich lesen', false, 'kein --liste');
} else {
  const r = spawnSync(process.execPath, [path.join(WURZEL, 'pruefungen', 'alle.mts'), '--schnell', '--liste'],
    { cwd: WURZEL, encoding: 'utf8', timeout: 60_000 });
  const aus = (r.stdout ?? '') + (r.stderr ?? '');
  p('`alle.mts --schnell --liste` endet mit 0', r.status === 0,
    'Status ' + r.status + (r.error ? ' · ' + r.error.message : ''));
  p('… und startet dabei keinen einzigen Lauf', !/^──── \[/m.test(aus));
  kopfZahl = Number(/Prüfläufe: (\d+) Läufe/.exec(aus)?.[1] ?? NaN);
  zeilen = [...aus.matchAll(/^(test\d+|servercheck)\s+(ohne Browser|Browser)(?:\s+—\s+(.*?))?\s*$/gm)]
    .map(m => ({ name: m[1] ?? '', browser: m[2] === 'Browser', grund: (m[3] ?? '').trim() }));
}
const inListe = new Set(zeilen.map(z => z.name));
console.log('    --schnell wählt: ' + zeilen.length + ' Läufe, ' +
  zeilen.filter(z => browserLaeufe.has(z.name)).length + ' davon mit Browser (' +
  zeilen.filter(z => browserLaeufe.has(z.name)).map(z => z.name).join(' ') + ')');

p('Die Zahl im Kopf der Liste stimmt mit ihren Zeilen', zeilen.length > 0 && kopfZahl === zeilen.length,
  'Kopf ' + kopfZahl + ', Zeilen ' + zeilen.length);

const fehlend = alleLaeufe.filter(n => !browserLaeufe.has(n) && !inListe.has(n));
p('Jeder Lauf ohne Browser ist dabei', zeilen.length > 0 && fehlend.length === 0,
  fehlend.slice(0, 12).join(' ') + (fehlend.length > 12 ? ' … (' + fehlend.length + ')' : ''));

const fremdeBrowser = zeilen.filter(z => browserLaeufe.has(z.name) && !namen31.includes(z.name)).map(z => z.name);
p('Ein Lauf mit Browser ist nur dabei, wenn CLAUDE.md §31 ihn beim Namen nennt',
  zeilen.length > 0 && fremdeBrowser.length === 0,
  fremdeBrowser.slice(0, 12).join(' ') + (fremdeBrowser.length > 12 ? ' … (' + fremdeBrowser.length + ')' : ''));

const ohneGrund = zeilen.filter(z => browserLaeufe.has(z.name) && !(z.browser && z.grund.length >= 10)).map(z => z.name);
p('… und trägt in alle.mts einen Grund', ohneGrund.length === 0, ohneGrund.join(' '));

const fehlen31 = namen31.filter(n => !inListe.has(n));
p('Die Läufe aus §31 sind alle dabei', zeilen.length > 0 && fehlen31.length === 0, fehlen31.join(' '));

const falschGesagt = zeilen.filter(z => z.browser !== browserLaeufe.has(z.name))
  .map(z => z.name + (z.browser ? ' (sagt Browser, liest keinen)' : ' (sagt ohne, startet einen)'));
p('Was die Liste über jeden Lauf sagt (Browser oder nicht), stimmt',
  zeilen.length > 0 && falschGesagt.length === 0, falschGesagt.join(', '));

p('Dieser Lauf selbst ist dabei (er startet keinen Browser)', inListe.has('test610'));

const brauchtBrowser = zeilen.some(z => browserLaeufe.has(z.name));
p('Der schnelle Job holt Chromium genau dann, wenn die Auswahl einen Browser braucht',
  !!schnell && zeilen.length > 0 && holtChromium === brauchtBrowser,
  'braucht ' + brauchtBrowser + ', holt ' + holtChromium);

/* ==========================================================================
 * 4 · DIE DOKU SAGT, WAS --schnell HEISST
 * ========================================================================*/
console.log('\n4 · CLAUDE.md §30');

/* Die Zeile samt ihren eingerückten Fortsetzungen, Leerraum zu einem Zeichen. */
const befehlsZeile = (/^npm run pruefen -- --schnell[^\n]*(?:\n {20,}[^\n]*)*/m.exec(claude)?.[0] ?? '')
  .replace(/\s+/g, ' ');
console.log('    ' + (befehlsZeile || 'NICHT GEFUNDEN'));
p('Die Zeile `npm run pruefen -- --schnell` sagt „ohne Browser" und hat eine gemessene Dauer',
  /ohne Browser/.test(befehlsZeile) && !/ungemessen/.test(befehlsZeile) && /\d+\s*min/.test(befehlsZeile));

console.log(`\n${ok}/${ok + weg} bestanden`);
console.log(`\n  Suite 610 — Die CI fährt den schnellen Lauf: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
