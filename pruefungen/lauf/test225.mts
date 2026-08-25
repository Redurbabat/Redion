/* Suite 191 — Was die Dokumentation behauptet, gibt es auch
 * ============================================================================
 * `doku/AUFTRAG-STAND.md` sagt über sich selbst:
 *
 *   „Und die Prüflaufnummern in dieser Tabelle sind NACHGESEHEN, nicht
 *    erinnert. Beim ersten Schreiben standen hier „test91–test97" für die
 *    Tabellen und „test80–test84" für die Rechte; beide Spannen gehören zu
 *    ganz anderen Themen. Eine falsche Quellenangabe ist schlimmer als
 *    keine — sie schickt den Nächsten an eine Stelle, an der nichts steht."
 *
 * Genau das prüft diese Suite, und zwar mechanisch. Sie braucht keinen
 * Browser: sie liest die Dokumentation und die Prüfdateien.
 *
 * ─── WAS SIE PRÜFT ──────────────────────────────────────────────────────────
 *   1. Jede genannte Prüfdatei gibt es wirklich.
 *   2. Jeder genannte ABSCHNITT gibt es in dieser Datei — „test215 §3" muss
 *      auf einen Abschnitt 3 zeigen, nicht ins Leere.
 *   3. Dasselbe für ENTSCHEIDUNGEN.md, wo dieselben Nummern stehen.
 *
 * Punkt 2 hat beim ersten Lauf einen Treffer gehabt: „test31 §3" — test31
 * hat gar keine nummerierten Abschnitte. Die Sache selbst ist geprüft
 * (Service Worker, Ablage, Offline-Neuladen), nur die Adresse stimmte nicht.
 *
 * ─── WAS SIE NICHT PRÜFT ────────────────────────────────────────────────────
 * Ob der Abschnitt inhaltlich das prüft, was danebensteht. Das kann keine
 * Maschine, und es ist auch nicht der Fehler, den es hier gab: die Adresse
 * war falsch, nicht die Behauptung.
 *
 * ─── KANN SIE ROT WERDEN? (§55.2) ───────────────────────────────────────────
 * Ja, und sie WAR es beim ersten Lauf — sechsmal. Vier weitere Gegenproben
 * an einem Abzug des Baums: eine erfundene Datei (rot), ein erfundener
 * Abschnitt in einer echten Datei (rot), eine lügende Ausnahmeliste (rot),
 * und dieselbe Angabe in einem ```-Block (GRÜN, und das ist die Regel).
 * Die Herleitung steht in E168.
 *
 *   node pruefungen/lauf/test225.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const LAUF = path.join(WURZEL, 'pruefungen', 'lauf');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/** Den Quelltext einer Prüfdatei holen — .mts oder .mjs. */
const pruefdatei = (name: string): string | null => {
  for (const endung of ['.mts', '.mjs']) {
    const pfad = path.join(LAUF, name + endung);
    if (fs.existsSync(pfad)) return fs.readFileSync(pfad, 'utf8');
  }
  return null;
};

/**
 * Hat diese Prüfdatei einen Abschnitt mit dieser Nummer?
 *
 * Die Suiten schreiben ihre Abschnitte auf zwei Arten, und beide zählen:
 *
 *     console.log('\n3 · Der Pfad ordnet den Stoff')     die Ausgabe
 *      * §3 · Keine Sperre, und der Stand kommt aus SM-2  der Kopfkommentar
 *
 * Gesucht wird beides. Nur nach der Ausgabe zu suchen wäre zu streng —
 * ältere Suiten schreiben ihre Abschnitte nur in den Kommentar.
 */
const hatAbschnitt = (quelle: string, nummer: number): boolean =>
  new RegExp('\\\\n' + nummer + ' · ').test(quelle) ||
  new RegExp('^\\s*\\*?\\s*§' + nummer + ' ·', 'm').test(quelle);

/** Alle „testNNN"-Nennungen einer Datei, mit ihrer Abschnittsangabe. */
type Verweis = { datei: string; name: string; abschnitte: number[]; roh: string };
const verweise = (relPfad: string): Verweis[] => {
  /* EINGEZÄUNTER TEXT IST EIN ZITAT, KEINE ANGABE.
     Wer über eine falsche Quellenangabe schreibt, muss sie nennen dürfen —
     sonst kann die Berichtigung nicht sagen, was falsch war. Genau das
     passierte beim Schreiben von E168 zweimal: erst in der Tabelle, dann
     im Eintrag selbst, und beide Male fand diese Prüfung den alten Verweis
     wieder.
     Ein ```-Block ist die Stelle, an der man zitiert. Was dort steht,
     behauptet nichts; die Angabe daneben in gewöhnlichem Text schon. */
  const text = fs.readFileSync(path.join(WURZEL, relPfad), 'utf8')
    .replace(/```[\s\S]*?```/g, '');
  const raus: Verweis[] = [];
  /* KEIN ZEILENUMBRUCH zwischen Namen und Abschnitt. Ohne `[^\\S\\n]`
     verband der erste Wurf ein `test137` am Zeilenende mit dem `§55.2`,
     mit dem der nächste Absatz beginnt — und meldete einen Abschnitt 55,
     den niemand behauptet hatte. Eine Prüfung, die aus dem falschen Grund
     rot wird, ist so wenig wert wie eine, die aus dem falschen Grund grün
     ist (E168). */
  /* NACH JEDEM TRENNER MUSS WIEDER EIN § STEHEN — ausser bei einer Spanne
     mit Gedankenstrich, wo „§1–§4" und „§1–4" beide vorkommen. Ohne diese
     Regel las die Gegenprobe „test202 §77, 84 Punkte" als Spanne von 77 bis
     84 und meldete acht fehlende Abschnitte statt einem. Die Doku schreibt
     Listen als „§5 und §6" oder „§3/§8"; ein Komma trennt dort nie zwei
     Abschnitte, sondern den Verweis vom nächsten Halbsatz. */
  const muster = /(test\d+)((?:[^\S\n]*§\d+(?:[^\S\n]*(?:[–-][^\S\n]*§?|(?:und|,|\/)[^\S\n]*§)\d+)*)?)/g;
  let treffer: RegExpExecArray | null;
  while ((treffer = muster.exec(text)) !== null) {
    const zahlen = (treffer[2] || '').match(/\d+/g);
    const nummern = zahlen ? zahlen.map(Number) : [];
    /* Eine Spanne „§1–§4" meint alle dazwischen. */
    const alle = nummern.length >= 2
      ? Array.from({ length: Math.max(...nummern) - Math.min(...nummern) + 1 },
                   (_, i) => Math.min(...nummern) + i)
      : nummern;
    raus.push({ datei: relPfad, name: treffer[1] as string, abschnitte: alle,
                roh: (treffer[0] || '').trim() });
  }
  return raus;
};

const QUELLEN = ['doku/AUFTRAG-STAND.md', 'ENTSCHEIDUNGEN.md', 'LUECKEN.md'];

/**
 * Namen, die absichtlich ins Leere zeigen.
 *
 * E78 beschloss die React-Zielarchitektur und beschrieb fünf Wächter dafür.
 * E80 widerrief sie am Tag darauf, und die Dateien gingen mit dem Rohbau
 * (Commit „Der React-Umbau ist widerrufen"). Die Entscheidung selbst bleibt
 * stehen — sie ist Geschichte, und Geschichte löscht man nicht. Sie sagt
 * seit E168 aber dazu, dass es diese Prüfläufe nicht mehr gibt.
 *
 * Diese Liste darf nur schrumpfen. Wer einen Namen hinzufügt, schreibt
 * damit auf, dass eine Quellenangabe ins Leere zeigt — und muss den Grund
 * daneben stellen.
 */
const GESCHICHTE = new Set(['test149', 'test150', 'test151', 'test153', 'test154']);

/* ==========================================================================
 * §1 · Jede genannte Prüfdatei gibt es
 * ========================================================================*/
console.log('\n1 · Jede genannte Prüfdatei gibt es');

const alle = QUELLEN.flatMap(verweise);
p('Es gibt überhaupt Verweise zu prüfen', alle.length >= 100, String(alle.length));

const ohneDatei = [...new Set(alle
  .filter(v => !GESCHICHTE.has(v.name) && pruefdatei(v.name) === null)
  .map(v => v.datei + ': ' + v.name))];
gleich('Und zu jedem gibt es eine Datei', ohneDatei, []);

/* Und die Ausnahmeliste ist nicht ins Blaue geschrieben: die fünf Namen
   müssen wirklich fehlen. Stünde einer davon wieder da, wäre die Ausnahme
   eine Lüge, und dieser Punkt sagt es. */
gleich('Die Ausnahmen fehlen auch wirklich',
  [...GESCHICHTE].filter(n => pruefdatei(n) !== null), []);
p('Und werden in der Doku als vergangen benannt',
  /gibt es diese Prüfläufe nicht mehr|mit dem Rohbau entfernt/
    .test(fs.readFileSync(path.join(WURZEL, 'ENTSCHEIDUNGEN.md'), 'utf8')),
  'E78 sagt nicht, dass seine Wächter weg sind');

/* ==========================================================================
 * §2 · Und jeden genannten Abschnitt auch
 * --------------------------------------------------------------------------
 * DER PUNKT, DER BEIM ERSTEN LAUF ROT WAR. „test31 §3" zeigte auf einen
 * Abschnitt, den es nicht gibt — test31 ist eine ältere Suite ohne
 * nummerierte Abschnitte. Die Sache war geprüft, die Adresse falsch.
 * ========================================================================*/
console.log('\n2 · Und jeden genannten Abschnitt auch');

const mitAbschnitt = alle.filter(v => v.abschnitte.length);
p('Es gibt Abschnittsverweise zu prüfen', mitAbschnitt.length >= 30,
  String(mitAbschnitt.length));

const leere: string[] = [];
mitAbschnitt.forEach(v => {
  const quelle = pruefdatei(v.name);
  if (!quelle) return;
  v.abschnitte.forEach(n => {
    if (!hatAbschnitt(quelle, n)) leere.push(v.datei + ': ' + v.name + ' §' + n);
  });
});
gleich('Kein Verweis zeigt ins Leere', [...new Set(leere)], []);

/* ==========================================================================
 * §3 · Die Gegenrichtung: die Suche findet überhaupt etwas
 * --------------------------------------------------------------------------
 * Ohne diesen Abschnitt bestünde §2 auch mit einem `hatAbschnitt`, das
 * immer `true` sagt — oder mit einem Muster, das gar keine Verweise findet.
 * ========================================================================*/
console.log('\n3 · Die Suche findet überhaupt etwas');

const test215 = pruefdatei('test215') || '';
p('test215 hat einen Abschnitt 3', hatAbschnitt(test215, 3));
p('test215 hat einen Abschnitt 8', hatAbschnitt(test215, 8));
p('Aber keinen Abschnitt 99', !hatAbschnitt(test215, 99));

const test31 = pruefdatei('test31') || '';
p('test31 gibt es', test31.length > 0);
p('Und hat wirklich keine nummerierten Abschnitte',
  !hatAbschnitt(test31, 1) && !hatAbschnitt(test31, 2) && !hatAbschnitt(test31, 3));

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
