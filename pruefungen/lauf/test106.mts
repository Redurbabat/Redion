/* Suite 71 — Die deutschen Excel-Namen, in Node, ohne Browser
 * ----------------------------------------------------------------------------
 * `doku/EXCEL-IN-REDION-RECHERCHE.md` hat nachgemessen, und das Ergebnis war
 * nicht das erwartete:
 *
 *   158  Funktionen im Register, davon 0 ohne Implementierung
 *    37  von 63 des Excel-Startpakets sind bereits da und laufen
 *     0  davon sind unter ihrem deutschen Namen erreichbar
 *
 * Wer aus Excel kommt und `SUMME(…)` tippt, bekam einen Fehler. `sum` hätte
 * funktioniert. Es fehlten also nicht 63 Funktionen, sondern 26 Funktionen
 * und **37 Namen** — und die Namen kosten fast nichts: der Zerteiler kennt
 * Umlaute schon (`/[A-Za-zÄÖÜäöüß_]/`), und Namen werden vor dem Nachschlagen
 * kleingeschrieben.
 *
 * ─── WAS DIESER LAUF PRÜFT ──────────────────────────────────────────────────
 *
 * 1. Jeder deutsche Name lässt sich aufrufen.
 * 2. Er rechnet **dasselbe** wie sein englisches Gegenstück — nicht nur
 *    „gibt etwas zurück". Ein Alias, der leicht anders rechnet, ist schlimmer
 *    als keiner: er sieht richtig aus.
 * 3. Gross- und Kleinschreibung ist egal (`SUMME`, `Summe`, `summe`).
 * 4. Die englischen Namen funktionieren weiterhin — die Gegenrichtung.
 * 5. Jeder deutsche Name steht im Register, sonst findet ihn die Suche im
 *    Formeleditor nicht, und eine Funktion, die niemand findet, ist fast wie
 *    nicht vorhanden.
 *
 * WIE: `laufzeit.js` und `register/formeln.js` sind gewöhnliche Skripte. Sie
 * werden gelesen und ausgewertet — kein `document`, kein Browser.
 *
 *   node pruefungen/lauf/test106.mts
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies } from 'node:fs';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

/* Beide Dateien in den echten globalen Raum laden.
   WARUM NICHT IN EIN EIGENES OBJEKT. `register/formeln.js` schreibt
   `window.Register = (window as any).Register || {}` und spricht danach `Register`
   ohne Vorsatz an. Im Browser geht das, weil eine Eigenschaft von `window`
   ein globaler Name ist. Ein untergeschobenes Objekt hat diese Eigenschaft
   nicht — dort bliebe `Register` undefiniert. Also `globalThis`. */
(globalThis as any).window = globalThis;
(globalThis as any).self = globalThis;
const laden = (pfad: any) => new Function(_lies(_dazu(WURZEL, pfad), 'utf8'))();
laden('quell/register/formeln.js');
laden('quell/bereiche/datenbanken/formeln/laufzeit.js');

const Formula = (globalThis as any).Formula;
const Register = (globalThis as any).Register;

/* ---------------------------------------------------------------------------
 * Die Paare: deutscher Name → interner Name
 * ---------------------------------------------------------------------------
 * Achtung, und das ist die Lehre dieses Laufs: Abschnitt 1 vergleicht den
 * deutschen Namen mit dem, worauf er **zeigt**. Er kann deshalb nur einen
 * **fehlenden** Zweitnamen finden, niemals einen **falschen** — zeigt der
 * Name auf die verkehrte Funktion, rechnen beide Seiten dasselbe Verkehrte
 * und der Vergleich ist zufrieden.
 *
 * Genau so kamen elf falsche Zuordnungen durch. Gefunden hat sie erst
 * Abschnitt 4e, der gegen **feste erwartete Werte** prüft statt gegen die
 * Gegenseite.
 *
 * Beide Abschnitte zusammen: 1 findet, was fehlt · 4e findet, was falsch ist.
 * -------------------------------------------------------------------------*/
/* Deutscher Name, englischer Name — in dieser Reihenfolge, immer zu zweit. */
const PAARE: [string, string][] = [
  /* Mathematik */
  ['SUMME', 'sum'], ['MITTELWERT', 'mean'], ['MIN', 'min'], ['MAX', 'max'],
  ['ABS', 'abs'], ['WURZEL', 'sqrt'], ['REST', 'excelmod'],
  ['RUNDEN', 'excelround'], ['ABRUNDEN', 'rounddown'], ['AUFRUNDEN', 'roundup'],
  ['GANZZAHL', 'int'], ['PRODUKT', 'product'], ['ANZAHL', 'count'],
  ['ANZAHL2', 'counta'], ['POTENZ', 'power'],
  /* Logik */
  ['WENN', 'if'], ['WENNS', 'ifs'], ['UND', 'and'], ['ODER', 'or'],
  ['NICHT', 'not'],
  /* Datum */
  ['HEUTE', 'today'], ['JETZT', 'now'], ['DATUM', 'datefromparts'],
  ['JAHR', 'year'], ['MONAT', 'month'], ['TAG', 'date'],
  ['KALENDERWOCHE', 'week'], ['ZEIT', 'time'], ['WOCHENTAG', 'weekday'],
  /* Text */
  ['LÄNGE', 'length'], ['TEIL', 'mid'], ['GLÄTTEN', 'trim'],
  ['GROSS', 'upper'], ['KLEIN', 'lower'], ['WECHSELN', 'substitute'],
  ['ERSETZEN', 'replaceat'], ['TEXT', 'textformat'], ['WERT', 'tonumber'],
  ['TEXTKETTE', 'concattext'], ['TEXTVERKETTEN', 'textjoin'],
  ['LINKS', 'left'], ['RECHTS', 'right'], ['SÄUBERN', 'clean'],
  ['SUCHEN', 'search'], ['FINDEN', 'findtext'],
  /* Info */
  ['ISTLEER', 'empty'], ['ISTZAHL', 'isnumber'], ['ISTTEXT', 'istext'],
  /* Suche */
  ['VERGLEICH', 'matchpos'], ['SORTIEREN', 'sort'], ['EINDEUTIG', 'unique']
];

/* Ein Aufruf je Paar, mit Argumenten, die für beide Seiten passen. Wo eine
   Funktion die Zeit liest, wird nur die Form verglichen — `JETZT()` zweimal
   aufgerufen ergibt zwei verschiedene Werte, und das ist richtig so. */
/* Womit ein Name aufgerufen wird, damit er etwas zu rechnen hat. */
const AUFRUF: Record<string, string> = {
  sum: '(1, 2, 3)', mean: '(2, 4, 6)', min: '(3, 1, 2)', max: '(3, 1, 2)',
  abs: '(0 - 7)', sqrt: '(16)', excelmod: '(7, 3)', excelround: '(2.6)',
  rounddown: '(2.6)', roundup: '(2.1)', int: '(2.9)',
  product: '(2, 3, 4)', count: '(1, "x", 3)', counta: '(1, "x", "")',
  power: '(2, 10)',
  if: '(true, "ja", "nein")', ifs: '(false, "a", true, "b")',
  and: '(true, true)', or: '(false, true)', not: '(false)',
  datefromparts: '(2026, 8, 4)', year: '("2026-08-04")', month: '("2026-08-04")',
  date: '("2026-08-04")', week: '("2026-08-04")',
  time: '(9, 30, 0)', weekday: '("2026-08-04")',
  length: '("Hallo")', mid: '("Redion", 2, 3)', trim: '("  x  ")',
  upper: '("abc")', lower: '("ABC")', substitute: '("a.b.c", ".", "-")',
  replaceat: '("Redion", 1, 3, "XX")', textformat: '(1234.5, "0.00")',
  tonumber: '("42")', concattext: '("a", "b")', textjoin: '("-", "a", "b")',
  left: '("Redion", 3)', right: '("Redion", 3)', clean: '("abc")',
  search: '("di", "Redion")', findtext: '("di", "Redion")',
  empty: '("")', isnumber: '(42)', istext: '("x")',
  matchpos: '("b", ["a","b","c"])', sort: '([3, 1, 2])', unique: '([1, 1, 2])'
};

/* Diese lesen die Uhr — nur die Form vergleichen, nicht den Wert. */
const ZEITABHAENGIG = new Set(['today', 'now']);

const rechne = (quelltext: any) => {
  try {
    const e = Formula.run(quelltext, () => null, () => null, {});
    return e && e.ok ? { ok: true, wert: e.wert } : { ok: false, fehler: e && e.fehler };
  } catch (err: unknown) { return { ok: false, fehler: (err instanceof Error ? err.message : String(err)) }; }
};

console.log('\n1 · Jeder deutsche Name rechnet dasselbe wie sein englischer');

for (const [de, en] of PAARE) {
  const args = AUFRUF[en];
  if (ZEITABHAENGIG.has(en)) {
    const a = rechne(de + '()'), b = rechne(en + '()');
    p(de + ' läuft wie ' + en, a.ok && b.ok && typeof a.wert === typeof b.wert,
      JSON.stringify(a) + ' / ' + JSON.stringify(b));
    continue;
  }
  if (!args) { p(de + ' hat einen Prüfaufruf', false, 'kein Eintrag in AUFRUF'); continue; }
  const a = rechne(de + args), b = rechne(en + args);
  p(de + args + ' == ' + en + args,
    a.ok && b.ok && JSON.stringify(a.wert) === JSON.stringify(b.wert),
    'de=' + JSON.stringify(a) + ' en=' + JSON.stringify(b));
}

/* ===========================================================================
 * 1b · DER TOTE ZWEIG DARF NICHT RECHNEN
 * ---------------------------------------------------------------------------
 * Der erste Wurf dieses Laufs hat einen echten Fehler durchgelassen, und der
 * ist lehrreich genug, um hier zu stehen.
 *
 * `evaluate` behandelt dreizehn Namen besonders, **bevor** es in die
 * Funktionstabelle schaut — darunter `if` und `ifs`, die ihre Zweige faul
 * auswerten, damit der nicht genommene Zweig nicht rechnet. Diese
 * Sonderbehandlung hängt am **Namen**. Ein Alias, der nur in der
 * Funktionstabelle steht, läuft daran vorbei und landet in der gewöhnlichen,
 * eifrigen Auswertung.
 *
 * Ergebnis: `if(true, 1, teuer())` rechnete `teuer()` nicht,
 * `WENN(true, 1, teuer())` rechnete es. **Beide gaben 1 zurück** — und genau
 * deshalb fiel es nicht auf: Abschnitt 1 vergleicht Ergebnisse, und die waren
 * gleich.
 *
 * Was daran nicht nur Geschmack ist:
 *   · ein Zweig mit `prop()` wirft in einer Umgebung ohne Verknüpfung — auch
 *     wenn er gar nicht genommen wird
 *   · ein teurer Zweig kostet Zeit, den niemand angefordert hat
 *   · und `WENNFEHLER` liesse sich ohne faule Auswertung gar nicht bauen
 *
 * Die Lehre ist dieselbe wie an einem Dutzend Stellen zuvor: geprüft wurde
 * der Wert, nicht die Nachbareigenschaft.
 * =========================================================================*/
console.log('\n1b · Der nicht genommene Zweig wird nicht gerechnet');

{
  /* Eine Funktion, die mitzählt, wie oft sie ausgewertet wurde. */
  let zaehler = 0;
  Formula.F.zaehlmarke = () => { zaehler++; return 1; };

  const zaehleFuer = (quelltext: any) => {
    zaehler = 0;
    rechne(quelltext);
    return zaehler;
  };

  for (const [de, en] of [['WENN', 'if'], ['WENNS', 'ifs']]) {
    const args = de === 'WENN'
      ? '(true, 1, zaehlmarke())'
      : '(true, 1, zaehlmarke())';
    const eng = zaehleFuer(en + args);
    const deu = zaehleFuer(de + args);
    p(de + ' rechnet den toten Zweig so oft wie ' + en + ' (' + eng + '×)',
      deu === eng, de + ' rechnete ihn ' + deu + '× statt ' + eng + '×');
  }

  delete Formula.F.zaehlmarke;
}

console.log('\n2 · Gross- und Kleinschreibung ist egal');

for (const schreibweise of ['SUMME(1, 2, 3)', 'Summe(1, 2, 3)', 'summe(1, 2, 3)']) {
  const e = rechne(schreibweise);
  p(schreibweise + ' ergibt 6', e.ok && Number(e.wert) === 6, JSON.stringify(e));
}

console.log('\n3 · Die englischen Namen gehen weiterhin');

/* Die Gegenrichtung. Ein Alias, der das Original verdrängt, hätte jede
   bestehende Formel in jedem Bestand gebrochen. */
for (const [, en] of PAARE) {
  if (ZEITABHAENGIG.has(en)) continue;
  const e = rechne(en + AUFRUF[en]);
  p(en + ' rechnet weiterhin', e.ok, JSON.stringify(e));
}

console.log('\n4 · Jeder deutsche Name steht im Register');

const imRegister = new Set(Register.formeln.alle().map((f: any) => f.name.toLowerCase()));
const fehlen = PAARE.map(([de]) => de).filter(de => !imRegister.has(de.toLowerCase()));
p('Alle ' + PAARE.length + ' deutschen Namen sind im Register eingetragen',
  fehlen.length === 0, fehlen.join(', '));

const ohneBeschreibung = Register.formeln.alle()
  .filter((f: any) => PAARE.some(([de]) => de.toLowerCase() === f.name.toLowerCase()))
  .filter((f: any) => !f.was);
p('Jeder deutsche Name hat eine Beschreibung', ohneBeschreibung.length === 0,
  ohneBeschreibung.map((f: any) => f.name).join(', '));

/* ===========================================================================
 * 4b · ABRUNDEN UND AUFRUNDEN RECHNEN WIE EXCEL, NICHT WIE floor/ceil
 * ---------------------------------------------------------------------------
 * Der erste Wurf setzte `ABRUNDEN = floor` und `AUFRUNDEN = ceil`. Für
 * positive Zahlen stimmt das, und deshalb fiel es nicht auf. Für negative
 * nicht:
 *
 *              Excel      floor/ceil
 *   ABRUNDEN(-2,5)   -2         -3
 *   AUFRUNDEN(-2,1)  -3         -2
 *
 * Excel rundet **zur Null hin** (ABRUNDEN) und **von der Null weg**
 * (AUFRUNDEN). `floor` und `ceil` runden nach unten und nach oben. Bei
 * positiven Zahlen ist das dasselbe, bei negativen nicht.
 *
 * Wer eine Ausgabenliste mit negativen Beträgen rundet, bekommt sonst einen
 * Rappen Unterschied je Zeile — die Sorte Fehler, die man erst in der Summe
 * sieht und dann nicht mehr findet.
 *
 * GANZZAHL ist der Name für das, was `floor` tut: immer nach unten.
 * =========================================================================*/
console.log('\n4b · Runden zur Null hin, nicht nach unten');

const rundung = [
  ['ABRUNDEN(2,5)',    'ABRUNDEN(2.5)',    2],
  ['ABRUNDEN(-2,5)',   'ABRUNDEN(0 - 2.5)', -2],
  ['AUFRUNDEN(2,1)',   'AUFRUNDEN(2.1)',   3],
  ['AUFRUNDEN(-2,1)',  'AUFRUNDEN(0 - 2.1)', -3],
  ['GANZZAHL(2,9)',    'GANZZAHL(2.9)',    2],
  ['GANZZAHL(-2,5)',   'GANZZAHL(0 - 2.5)', -3]
];
for (const [zeigen, quelle, soll] of rundung) {
  const e = rechne(quelle);
  p(zeigen + ' = ' + soll, e.ok && Number(e.wert) === soll, JSON.stringify(e));
}

/* Die Gegenrichtung: floor und ceil behalten ihre mathematische Bedeutung. */
for (const [quelle, soll] of [['floor(0 - 2.5)', -3], ['ceil(0 - 2.1)', -2]]) {
  const e = rechne(quelle);
  p(quelle + ' bleibt ' + soll, e.ok && Number(e.wert) === soll, JSON.stringify(e));
}

/* ===========================================================================
 * 4c · DIE VIERZEHN NACHGEBAUTEN FUNKTIONEN
 * ---------------------------------------------------------------------------
 * WENNFEHLER und ISTFEHLER fehlen hier mit Absicht — siehe Abschnitt 4d.
 * =========================================================================*/
console.log('\n4c · Die nachgebauten Excel-Funktionen rechnen richtig');

const NEU = [
  ['PRODUKT(2; 3; 4)',        'PRODUKT(2, 3, 4)',            24],
  ['ANZAHL(1; "x"; 3)',       'ANZAHL(1, "x", 3)',           2],
  ['ANZAHL2(1; "x"; "")',     'ANZAHL2(1, "x", "")',         2],
  ['POTENZ(2; 10)',           'POTENZ(2, 10)',               1024],
  ['ZEIT(9; 30; 0)',          'ZEIT(9, 30, 0)',              '09:30:00'],
  /* 2026-08-04 ist ein Dienstag. Excel zählt bei Typ 1 ab Sonntag = 1,
     also Dienstag = 3. Beim ersten Schreiben stand hier 2 — der Lauf hat
     meine Erwartung berichtigt, nicht den Code. */
  ['WOCHENTAG("2026-08-04")', 'WOCHENTAG("2026-08-04")',     3],
  ['LINKS("Redion"; 3)',      'LINKS("Redion", 3)',          'Red'],
  ['RECHTS("Redion"; 3)',     'RECHTS("Redion", 3)',         'ion'],
  /* R-e-d-i-o-n: „di" beginnt beim dritten Zeichen. Excel zählt ab 1. */
  ['SUCHEN("di"; "Redion")',  'SUCHEN("di", "Redion")',      3],
  ['FINDEN("di"; "Redion")',  'FINDEN("di", "Redion")',      3],
  ['ISTZAHL(42)',             'ISTZAHL(42)',                 true],
  ['ISTZAHL("x")',            'ISTZAHL("x")',                false],
  ['ISTTEXT("x")',            'ISTTEXT("x")',                true],
  ['ISTTEXT(42)',             'ISTTEXT(42)',                 false]
];
for (const [zeigen, quelle, soll] of NEU) {
  const e = rechne(quelle);
  p(zeigen + ' = ' + JSON.stringify(soll),
    e.ok && JSON.stringify(e.wert) === JSON.stringify(soll), JSON.stringify(e));
}

/* SÄUBERN entfernt Steuerzeichen — mit einem echten davon geprüft.
   Das Zeichen kommt über `prop()` herein und nicht als Zeichenkette im
   Quelltext: ein rohes Steuerzeichen in einer Quelldatei ist genau das, was
   `test87` verbietet. In der Einzeldatei macht der HTML-Zerteiler U+FFFD
   daraus und reisst den ganzen Skriptblock mit. */
{
  const mitSteuerzeichen = 'a' + String.fromCharCode(7) + 'b' + String.fromCharCode(31) + 'c';
  const e = (() => {
    try {
      const r = Formula.run('SÄUBERN(prop("x"))',
        (feld: any) => (feld === 'x' ? mitSteuerzeichen : null), () => null, {});
      return r && r.ok ? { ok: true, wert: r.wert } : { ok: false, fehler: r && r.fehler };
    } catch (err: unknown) { return { ok: false, fehler: (err instanceof Error ? err.message : String(err)) }; }
  })();
  p('SÄUBERN wirft Steuerzeichen weg', e.ok && e.wert === 'abc', JSON.stringify(e));
}

/* SUCHEN ist blind für Gross und Klein, FINDEN nicht — genau wie in Excel. */
{
  const a = rechne('SUCHEN("DI", "Redion")');
  const b = rechne('FINDEN("DI", "Redion")');
  p('SUCHEN achtet nicht auf Gross/Klein', a.ok && Number(a.wert) === 3, JSON.stringify(a));
  p('FINDEN achtet auf Gross/Klein', b.ok && Number(b.wert) === 0, JSON.stringify(b));
}

/* Die Gegenrichtung: die Listenfunktion `find` bleibt, wie sie war. Sie wird
   in `evaluate` besonders behandelt und darf von FINDEN nicht verdrängt
   werden — sonst bräche jede Formel, die sie benutzt. */
{
  const e = rechne('find([1, 2, 3], current > 1)');
  p('Die Listenfunktion find bleibt unangetastet',
    e.ok && Number(e.wert) === 2, JSON.stringify(e));
}

/* ===========================================================================
 * 4d · WENNFEHLER GIBT ES NICHT — UND DAS IST ABSICHT
 * ---------------------------------------------------------------------------
 * Excels WENNFEHLER fängt `#DIV/0!`, `#WERT!`, `#NV`. Redions Laufzeit
 * erzeugt solche Werte gar nicht: sie ist **abwehrend** gebaut.
 *
 *   1/0              →  0
 *   WURZEL(-1)       →  0
 *   WERT("abc")      →  0
 *
 * Ein WENNFEHLER, das hier eingebaut würde, fienge also **nichts von dem**,
 * wofür man es aus Excel kennt. Es sähe aus wie Excels und wäre etwas
 * anderes — die schlimmste Sorte Funktion.
 *
 * Deshalb fehlt es, bis entschieden ist, ob Redion echte Fehlerwerte bekommt.
 * Diese Prüfung hält den Zustand fest, damit er eine Entscheidung bleibt und
 * nicht zu einer Lücke wird, die jemand aus Versehen füllt.
 * =========================================================================*/
console.log('\n4d · Kein WENNFEHLER ohne echte Fehlerwerte');

for (const [quelle, soll] of [['1 / 0', 0], ['WURZEL(0 - 1)', 0], ['WERT("abc")', 0]]) {
  const e = rechne(quelle);
  p(quelle + ' ergibt ' + soll + ' statt eines Fehlerwerts',
    e.ok && Number(e.wert) === soll, JSON.stringify(e));
}
for (const name of ['WENNFEHLER', 'ISTFEHLER']) {
  const e = rechne(name + '(1, 2)');
  p(name + ' gibt es (noch) nicht', !e.ok,
    'es antwortet — dann muss Abschnitt 4d neu geschrieben werden');
}

/* ===========================================================================
 * 4e · GLEICHER NAME IST NICHT GLEICHE BEDEUTUNG
 * ---------------------------------------------------------------------------
 * Der grösste Fehler dieser Arbeit, und er stand schon in der Doku als Regel:
 * **nachsehen statt raten.** Acht der siebenunddreissig Zuordnungen waren
 * nach Namensähnlichkeit gemacht, nicht nach Bedeutung — und sieben davon
 * rechneten deshalb etwas anderes als Excel:
 *
 *   TEIL("Redion";2;3)          "d"          statt "edi"
 *   TEXTKETTE("a";"b")          ["a","b"]    statt "ab"
 *   TEXTVERKETTEN("-";"a";"b")  "-"          statt "a-b"
 *   DATUM(2026;8;4)             1            statt 2026-08-04
 *   ERSETZEN("Redion";1;3;"XX") "Redion"     statt "XXion"
 *   WECHSELN("a.b.c";".";"-")   "-----"      statt "a-b-c"
 *   VERGLEICH(…)                ["Genf"]     statt der Position
 *
 * `WECHSELN` ist das lehrreichste Beispiel: Redions `replaceall` nimmt einen
 * regulären Ausdruck, Excels WECHSELN einen wörtlichen Text. Bei „a.b.c" mit
 * Suchtext „." trifft der Punkt als Regex **jedes** Zeichen — heraus kommt
 * „-----". Für Suchtexte ohne Sonderzeichen wäre es nie aufgefallen.
 *
 * Diese Prüfungen halten die Excel-Bedeutung fest, nicht nur die Existenz
 * eines Namens.
 * =========================================================================*/
console.log('\n4e · Die Excel-Bedeutung, nicht nur der Excel-Name');

const BEDEUTUNG = [
  ['TEIL zählt ab 1 und nimmt eine Anzahl',
   'TEIL("Redion", 2, 3)', 'edi'],
  ['TEIL ohne Anzahl nimmt den Rest',
   'TEIL("Redion", 4)', 'ion'],
  ['TEXTKETTE hängt Text aneinander',
   'TEXTKETTE("a", "b", "c")', 'abc'],
  ['TEXTVERKETTEN nimmt den Trenner zuerst',
   'TEXTVERKETTEN("-", "a", "b")', 'a-b'],
  ['TEXTVERKETTEN nimmt auch eine Liste',
   'TEXTVERKETTEN("-", ["a", "b"])', 'a-b'],
  ['DATUM baut aus Jahr, Monat, Tag',
   'JAHR(DATUM(2026, 8, 4))', 2026],
  ['DATUM trifft den Monat',
   'MONAT(DATUM(2026, 8, 4))', 8],
  ['DATUM trifft den Tag',
   'TAG(DATUM(2026, 8, 4))', 4],
  ['ERSETZEN ersetzt nach Stelle und Anzahl',
   'ERSETZEN("Redion", 1, 3, "XX")', 'XXion'],
  ['ERSETZEN mitten im Wort',
   'ERSETZEN("Redion", 4, 3, "")', 'Red'],
  ['WECHSELN nimmt den Suchtext wörtlich',
   'WECHSELN("a.b.c", ".", "-")', 'a-b-c'],
  ['WECHSELN ersetzt jedes Vorkommen',
   'WECHSELN("aaa", "a", "b")', 'bbb'],
  ['VERGLEICH gibt die Stelle, ab 1 gezählt',
   'VERGLEICH("Genf", ["Bern", "Zürich", "Genf"])', 3],
  ['VERGLEICH ohne Treffer gibt 0',
   'VERGLEICH("Basel", ["Bern", "Zürich"])', 0],
  /* TAG ist der Tag im Monat. Redions `day` ist der Wochentag — das ist
     Notions Bedeutung und bleibt so; der Tag im Monat heisst dort `date`. */
  ['TAG ist der Tag im Monat, nicht der Wochentag',
   'TAG("2026-08-04")', 4],
  /* Excel lässt das Vorzeichen dem Teiler folgen, JavaScript dem Dividenden. */
  ['REST folgt dem Vorzeichen des Teilers',
   'REST(0 - 7, 3)', 2],
  ['REST bleibt bei positiven Zahlen gleich',
   'REST(7, 3)', 1],
  /* Excel rundet die Hälfte von der Null weg, JavaScript immer nach oben. */
  ['RUNDEN rundet die Hälfte von der Null weg',
   'RUNDEN(0 - 2.5)', -3],
  ['RUNDEN bleibt bei positiven Zahlen gleich',
   'RUNDEN(2.5)', 3]
];
for (const [n, quelle, soll] of BEDEUTUNG) {
  const e = rechne(quelle);
  p(n + ' → ' + JSON.stringify(soll),
    e.ok && JSON.stringify(e.wert) === JSON.stringify(soll), JSON.stringify(e));
}

/* TEXT bekommt ein Muster — Excels grosse Formatsprache in dem Umfang, den
   Redion ehrlich kann. Was darüber hinausgeht, bleibt unverändert stehen,
   statt etwas Falsches zu zeigen. */
for (const [quelle, soll] of [
  ['TEXT(1234.5, "0.00")',   '1234.50'],
  ['TEXT(1234.5, "0")',      '1235'],
  ['TEXT(0.25, "0%")',       '25%'],
  ['TEXT(1234567, "#,##0")', "1’234’567"],
  ['TEXT(42, "")',           '42']
]) {
  const e = rechne(quelle);
  p('TEXT: ' + quelle + ' → ' + JSON.stringify(soll),
    e.ok && e.wert === soll, JSON.stringify(e));
}

/* Die Gegenrichtung, und sie ist hier besonders wichtig: die englischen
   Namen behalten ihre bisherige Bedeutung. `replace` bleibt regulärer
   Ausdruck, `concat` bleibt für Listen, `match` bleibt Textsuche. Jede
   bestehende Formel in jedem Bestand hängt daran. */
for (const [quelle, soll] of [
  ['replaceall("a.b.c", ".", "-")', '-----'],
  ['concat("a", "b")',              ['a', 'b']],
  ['match("Genf", "Ge")',           ['Ge']],
  ['slice("Redion", 2, 3)',         'd'],
  ['join(["a", "b"], "-")',         'a-b']
]) {
  const e = rechne(quelle);
  p('Unverändert: ' + quelle,
    e.ok && JSON.stringify(e.wert) === JSON.stringify(soll), JSON.stringify(e));
}

console.log('\n5 · Das Register verspricht nichts, was die Maschine nicht kann');

const a = Register.formeln.abgleich();
p('Keine Beschreibung ohne Funktion', a.ohneFunktion.length === 0,
  a.ohneFunktion.slice(0, 6).join(', '));

/* ==========================================================================
 * 6 · JEDES BEISPIEL IM FORMELEDITOR RECHNET AUCH
 * --------------------------------------------------------------------------
 * Abschnitt 5 prüft die Namen. Das Beispiel ist die zweite Zusage, und sie
 * war die gebrochene: von 41 Beispielen liefen 30 nicht.
 *
 * Zwölf davon nur wegen eines Zeichens. Die Signaturen stehen in deutscher
 * Excel-Schreibweise — `(a; b; …)` — und die Beispiele auch: `SUMME(1; 2; 3)`.
 * Der Zerleger kannte das Semikolon aber gar nicht. Es fiel unter
 * „unbekanntes Zeichen überspringen", aus `SUMME(1; 2; 3)` wurde
 * `SUMME(1 2 3)`, und der Mensch las „`)` erwartet". Die deutschen NAMEN
 * waren gebaut worden, das deutsche TRENNZEICHEN nicht.
 *
 * Nicht jedes Beispiel kann hier rechnen: `rowNumber()` und Geschwister
 * brauchen eine Zeile, `countWhere` eine zweite Datenbank. Die sagen das
 * auch — und genau diese zwei Sätze sind erlaubt. Alles andere ist ein
 * Versprechen, das beim Tippen bricht.
 * ======================================================================== */
console.log('\n6 · Jedes Beispiel im Formeleditor rechnet auch');

const ERLAUBTE_FEHLER = [
  'Das geht nur in einer Datenbankspalte',
  'Hier lassen sich keine anderen Datenbanken lesen'
];

const mitBeispiel = Register.formeln.alle().filter((f: any) => f.beispiel);
const kaputt = [];
for (const f of mitBeispiel) {
  /* Manche Beispiele tragen das Ergebnis mit: „REST(-7; 3) → 2". Für den
     Lauf zählt der Teil davor. */
  const quelle = (String(f.beispiel).split('→')[0] ?? '').trim();
  const e = Formula.run(quelle, () => undefined);
  if (!e.ok && !ERLAUBTE_FEHLER.some(z => String(e.fehler).includes(z)))
    kaputt.push(f.name + ': ' + quelle + '  →  ' + e.fehler);
}
p('Es wurden wirklich Beispiele geprüft', mitBeispiel.length >= 40,
  String(mitBeispiel.length));
p('Kein Beispiel scheitert am Zerleger', kaputt.length === 0,
  kaputt.slice(0, 5).join(' | '));

/* Und das Zeichen selbst, damit die Ursache benannt bleibt und nicht nur
   ihre Folgen geprüft werden. */
const semi = Formula.run('SUMME(1; 2; 3)', () => undefined);
const komma = Formula.run('SUMME(1, 2, 3)', () => undefined);
p('Semikolon und Komma trennen gleich',
  semi.ok && komma.ok && semi.wert === 6 && komma.wert === 6,
  JSON.stringify({ semi, komma }));

/* Wissenschaftliche Schreibweise: `2e6` war still zu 2 geworden — die Zahl
   wurde gelesen, der Exponent als Name verschluckt. */
const exp = ['1e3', '2e6', '1.5e2', '1e-3', '1E3']
  .map(f => ({ f, ...Formula.run(f, () => undefined) }));
p('Wissenschaftliche Schreibweise rechnet',
  JSON.stringify(exp.map(x => x.wert)) === JSON.stringify([1000, 2000000, 150, 0.001, 1000]),
  JSON.stringify(exp.map(x => [x.f, x.wert])));
p('Und die Formel sagt dasselbe wie die Umwandlung',
  Formula.run('2e6', () => undefined).wert === Formula.zahl('2e6'));
/* Die Gegenprobe: `2e` ist keine Zahl mit Exponent und darf keine werden. */
p('Ein `e` ohne Ziffern dahinter bleibt kein Exponent',
  Formula.run('2e', () => undefined).wert === 2,
  JSON.stringify(Formula.run('2e', () => undefined)));

/* Die leere Formel: run() war zufrieden, check() meldete einen Fehler. */
p('Die leere Formel gilt beiden als in Ordnung',
  Formula.check('').ok === true && Formula.run('', () => undefined).ok === true,
  JSON.stringify({ check: Formula.check(''), run: Formula.run('', () => undefined) }));

console.log(`\n  Suite 71 — Deutsche Excel-Namen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
