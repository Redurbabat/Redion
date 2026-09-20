/* Suite 550 — Die Doku zählt, was da ist
 * ============================================================================
 * Zwei [harte] Abschnitte, die ihre eigene Buchführung verlangen und bis
 * heute niemanden hatten, der nachzählt:
 *
 * §30 — „Sie wird nicht geschätzt, sie wird gezählt:
 *        `ls pruefungen/lauf/test*.mts | wc -l`"
 *
 *       Die Zahl stand einmal **hundertfünfzehn Läufe** daneben. Beim
 *       nächsten Nachzählen achtundzwanzig. Beim übernächsten einen — und
 *       dieser eine war schon vorher falsch, ohne dass es jemand merkte.
 *       Der Satz „im selben Bogen nachziehen" steht seitdem fünfzehnmal in
 *       §30; was fehlte, war nicht die Absicht, sondern die Prüfung.
 *
 * §34 — „Ein neuer Eintrag kommt in beides: in das Verzeichnis und in den
 *        Text."
 *
 *       Gemessen am 20. September: 638 Index-Zeilen, 638 haben ihren Text.
 *       Das stimmt. ABER: vier Nummern — E198, E199, E222, E269 — werden
 *       drei- bis siebenmal im Text ZITIERT und existieren nicht. Wer „wie
 *       in E198" liest, sucht etwas, das es nie gab.
 *
 * ─── WIE HIER GEZÄHLT WIRD, UND WARUM DAS DER SCHWIERIGE TEIL IST ───────────
 * `ENTSCHEIDUNGEN.md` kennt mindestens drei Überschriftsformen für dieselbe
 * Sache: `## E123 — …`, einen Banner zwischen zwei `===`-Zeilen, und einen
 * Titel mit `===` darunter — der auch über zwei Zeilen laufen kann.
 *
 * VIER ANLÄUFE HABEN DAS NACHEINANDER ÜBERSEHEN und dabei je eine Zahl
 * gemeldet, die nach einem Fehler aussah (351 fehlende, dann 253, dann 203).
 * Es war jedes Mal der Prüfer, nicht die Datei. Die Regel, die hält, setzt
 * KEINE Form voraus: eine Zeile, die MIT der Nummer beginnt und einen
 * Gedankenstrich trägt, ist eine Überschrift — alles andere ist eine
 * Erwähnung. (§55.2: erst prüfen, ob die Messung misst, was sie behauptet.)
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Die drei Stellen in CLAUDE.md nennen die WIRKLICHE Zahl der Läufe.
 *   2  Jede Index-Zeile hat ihren Text, und jeder Text seine Index-Zeile.
 *   3  Die Zahl, die ENTSCHEIDUNGEN.md über sich selbst nennt, stimmt.
 *   4  Eine Lücke in der Nummernfolge ist erlaubt — aber sie wird GENANNT.
 *      Eine unerklärte Lücke ist ein Verweis ins Leere.
 *
 * KEIN BROWSER, KEIN PORT. Dieser Lauf liest Dateien und darf deshalb auch
 * neben einem vollen Lauf gefahren werden (§30 meint die Ports).
 *
 *   node pruefungen/lauf/test550.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

console.log('\n' + '─'.repeat(60));
console.log('Suite 550 — Die Doku zählt, was da ist');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Die Zahl der Prüfläufe in CLAUDE.md (§30)');

const echteZahl = fs.readdirSync(path.join(WURZEL, 'pruefungen', 'lauf'))
  .filter(f => /^test\d+\.mts$/.test(f)).length;
const claude = fs.readFileSync(path.join(WURZEL, 'CLAUDE.md'), 'utf8');

const stellen: Array<{ was: string; muster: RegExp }> = [
  { was: '§30 „Heute sind es N Läufe"', muster: /Heute sind es (\d+) Läufe/ },
  { was: '§30 Befehlsblock „alle N Läufe"', muster: /npm run pruefen\s+alle (\d+) Läufe/ },
  { was: '§31 „Von N Läufen"', muster: /Von (\d+) Läufen sind diese/ }
];

console.log('    gezählt: ' + echteZahl + ' Dateien unter pruefungen/lauf/');
for (const s of stellen) {
  const m = s.muster.exec(claude);
  const genannt = m ? Number(m[1]) : NaN;
  console.log('    ' + s.was + ': ' + (m ? genannt : 'NICHT GEFUNDEN'));
  p(s.was + ' nennt die gezählte Zahl', genannt === echteZahl,
    m ? 'genannt ' + genannt + ' · gezählt ' + echteZahl : 'die Stelle gibt es nicht mehr');
}

/* ---------------------------------------------------------------------- */
console.log('\n2 · Verzeichnis und Text in ENTSCHEIDUNGEN.md (§34)');

const entText = fs.readFileSync(path.join(WURZEL, 'ENTSCHEIDUNGEN.md'), 'utf8');
const entZeilen = entText.split('\n');

const index = new Set<number>();
for (const z of entZeilen) {
  const m = /^\* \*\*E(\d+)\*\*/.exec(z);
  if (m) index.add(Number(m[1]));
}

/* KEINE FORM VORAUSGESETZT — siehe Kopf. Eine Überschrift beginnt mit der
   Nummer und trägt ein Trennzeichen; eine Erwähnung steht mitten im Satz. */
const ueberschrift = new Set<number>();
for (const z of entZeilen) {
  const m = /^(?:#{1,4}\s*)?E(\d+)\s*(?:—|–|-|·|:)/.exec(z);
  if (m) ueberschrift.add(Number(m[1]));
}

const ohneText = [...index].filter(n => !ueberschrift.has(n)).sort((a, b) => a - b);
const ohneIndex = [...ueberschrift].filter(n => !index.has(n)).sort((a, b) => a - b);

console.log('    Index-Zeilen: ' + index.size + ' · Überschriften: ' + ueberschrift.size);
console.log('    im Index ohne Text: ' + (ohneText.length ? ohneText.join(' ') : 'keine'));
console.log('    Text ohne Index:    ' + (ohneIndex.length ? ohneIndex.join(' ') : 'keine'));

p('Jede Index-Zeile hat ihren Text', ohneText.length === 0, 'E' + ohneText.join(' E'));
p('Jeder Text hat seine Index-Zeile', ohneIndex.length === 0, 'E' + ohneIndex.join(' E'));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Die Zahl, die ENTSCHEIDUNGEN.md über sich selbst nennt');

const selbst = /(\d+) Entscheidungen, E1 bis E(\d+)/.exec(entText);
if (!selbst) {
  p('Es gibt einen Selbstzähl-Satz', false, 'keiner gefunden');
} else {
  const genannt = Number(selbst[1]);
  const hoechste = Number(selbst[2]);
  const echteHoechste = Math.max(...index);
  console.log('    genannt:  ' + genannt + ' Entscheidungen, E1 bis E' + hoechste);
  console.log('    gezählt:  ' + index.size + ' Einträge, höchste E' + echteHoechste);
  p('Die genannte Anzahl stimmt', genannt === index.size,
    'genannt ' + genannt + ' · gezählt ' + index.size);
  p('Die genannte höchste Nummer stimmt', hoechste === echteHoechste,
    'genannt E' + hoechste + ' · gezählt E' + echteHoechste);
}

/* ---------------------------------------------------------------------- */
console.log('\n4 · Eine Lücke darf sein — aber sie wird genannt');

const hoechste = Math.max(...index);
const luecken = [];
for (let n = 1; n <= hoechste; n++) if (!index.has(n)) luecken.push(n);

/* Der Satz ganz oben erklärt die vergebenen Nummern. Was dort steht, ist
   erklärt; was nicht dort steht, ist ein Verweis ins Leere. */
const kopfText = entZeilen.slice(0, 60).join('\n');
const genanntInKopf = (n: number): boolean => {
  if (new RegExp('E' + n + '\\b').test(kopfText)) return true;
  /* Spannen wie „E442 bis E455" */
  for (const m of kopfText.matchAll(/E(\d+)\s*(?:bis|–|—|-)\s*E(\d+)/g)) {
    if (n >= Number(m[1]) && n <= Number(m[2])) return true;
  }
  return false;
};
const unerklaert = luecken.filter(n => !genanntInKopf(n));

console.log('    Lücken in der Folge: ' + luecken.length +
            ' (' + luecken.join(' ') + ')');
console.log('    davon UNERKLÄRT: ' + (unerklaert.length ? unerklaert.join(' ') : 'keine'));
for (const n of unerklaert) {
  const wie = entZeilen.filter(z => new RegExp('E' + n + '\\b').test(z)).length;
  console.log('      E' + n + ' wird ' + wie + '-mal zitiert und existiert nicht');
}

p('Jede Lücke in der Nummernfolge ist oben erklärt', unerklaert.length === 0,
  unerklaert.map(n => 'E' + n).join(' ') + ' — zitiert, aber nie geschrieben (§34)');

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
