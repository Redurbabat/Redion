/* test651 — die Suche ordnet nach Passung, nicht nur nach Datum (E807, B31)
 *
 * Ohne Browser, wie test571: er liest das GEBAUTE `quell/kern/suche/query.js`
 * und führt es in einer kleinen Sandbox aus, in der `window` das globale
 * Objekt ist. So prüft er, was der Browser lädt, nicht die Quelle.
 *
 * Die Goldliste ist klein und mit Absicht gemein: in jedem Fall ist das
 * Dokument, das weniger passt, das JÜNGERE — sonst wäre der alte Stand
 * (Datum entscheidet) zufällig grün.
 *
 * Gegenprobe: der Stand vor E807 ist in §1, §2, §3 und §4 rot.
 */
import _pfad from 'node:path';
import fs from 'node:fs';
import vm from 'node:vm';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
let ok = 0, bad = 0;
const pruef = (n: string, ist: unknown, soll: unknown) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const quelle = fs.readFileSync(_pfad.join(WURZEL, 'quell/kern/suche/query.js'), 'utf8');
const sandbox: any = {};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(quelle, sandbox);
const Q = sandbox.QueryLanguage;
pruef('die gebaute Sprache ist geladen', typeof Q?.run, 'function');

let tag = 0;
const dok = (id: string, title: string, content: string) => ({
  id, title, content, path: title, documentType: 'page', tags: [], statuses: [], locations: [],
  /* Jedes spätere Dokument ist jünger: das Datum zieht immer zum Letzten. */
  changed: new Date(Date.UTC(2026, 10, 1 + (tag++))).toISOString()
});
const suche = (docs: any[], text: string) => {
  const p = Q.parse(text);
  return p.ok ? Q.run(docs, p.query).map((m: any) => m.document.id) : ['FEHLER'];
};

/* §1 · Titel gleich dem Wort vor Titel, der es nur enthält */
tag = 0;
const d1 = [dok('genau', 'Kabel', 'Querschnitt und Verlegung.'), dok('enthaelt', 'Netzkabel bestellen', 'Liste.')];
pruef('§1 „Kabel" findet zuerst die Seite „Kabel"', suche(d1, 'Kabel')[0], 'genau');

/* §2 · Titel beginnt mit dem Wort vor Titel, der es mittendrin hat */
tag = 0;
const d2 = [dok('anfang', 'Motor anschliessen', ''), dok('mitte', 'Der Elektromotor', '')];
pruef('§2 „Motor" — „Motor anschliessen" vor „Der Elektromotor"', suche(d2, 'Motor')[0], 'anfang');

/* §3 · Im Inhalt: oft genannt vor einmal am Rand */
tag = 0;
const lang = 'Ein Absatz über etwas anderes. '.repeat(20);
const d3 = [
  dok('oft', 'Notizen A', 'Schütz Schütz Schütz: der Schütz zieht an, der Schütz fällt ab.'),
  dok('rand', 'Notizen B', lang + 'Siehe auch Schütz.')
];
pruef('§3 der Inhalt, der das Wort oft nennt, steht vor dem, der es einmal streift', suche(d3, 'Schütz'), ['oft', 'rand']);

/* §4 · Seltene Wörter wiegen mehr als häufige */
tag = 0;
const d4 = [
  dok('selten', 'S1', 'Fehlerstrom Leitung'),
  dok('haeufig', 'S2', 'Leitung Leitung Leitung Fehlerstrom-frei? nein: Leitung'),
  dok('x1', 'S3', 'Leitung'), dok('x2', 'S4', 'Leitung'), dok('x3', 'S5', 'Leitung')
];
/* Nur zwei Dokumente enthalten beide Wörter; „Fehlerstrom" steht in zwei
   von fünf, „Leitung" in allen. „selten" hat nichts als die zwei Wörter und
   ist kürzer — es muss vorn sein, obwohl „haeufig" Leitung viermal nennt. */
pruef('§4 das seltene Wort entscheidet, nicht die Wiederholung des häufigen', suche(d4, 'Fehlerstrom Leitung')[0], 'selten');

/* §5 · Die grobe Stufe bleibt: ein Titeltreffer schlägt jeden Inhalt */
tag = 0;
const d5 = [dok('titel', 'Relais', ''), dok('inhalt', 'Anderes', 'Relais '.repeat(50))];
pruef('§5 Titeltreffer vor noch so viel Inhalt', suche(d5, 'Relais')[0], 'titel');

/* §6 · Bei gleicher Passung entscheidet weiter das Datum (jüngeres zuerst) */
tag = 0;
const d6 = [dok('alt', 'Plan', 'x'), dok('neu', 'Plan', 'x')];
pruef('§6 gleich gut passend — das jüngere zuerst, wie vorher', suche(d6, 'Plan'), ['neu', 'alt']);

/* §7 · Ohne Suchwort (nur Filter) ändert sich nichts */
tag = 0;
const d7 = [dok('a', 'A', ''), dok('b', 'B', '')];
pruef('§7 nur ein Filter: Reihenfolge nach Datum', suche(d7, 'typ:seite'), ['b', 'a']);

/* §8 · Nicht passende Dokumente kommen durch die Rechnung nicht hinein */
pruef('§8 kein zusätzlicher Treffer', suche(d3, 'Querschnitt'), []);

console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
process.exit(bad ? 1 : 0);
