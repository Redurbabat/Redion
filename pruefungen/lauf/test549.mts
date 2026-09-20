/* Suite 549 — Die Lückenliste sagt die Wahrheit über sich selbst
 * ============================================================================
 * §35 ist **[hart]** und begründet sich selbst:
 *
 *   „Eine bekannte Lücke ist besser als ein stiller Fehler."
 *
 * Eine Lückenliste, die offene Punkte unter der Überschrift „Anhang B · Was
 * erledigt ist" führt, ist genau so ein stiller Fehler — nur einer, den die
 * Datei über sich selbst macht. Wer von oben liest, hält sie für erledigt.
 *
 * GEMESSEN AM 20. SEPTEMBER 2026, vor diesem Lauf:
 *
 *   101 Einträge · 34 davon OFFEN und unterhalb von „Anhang B"
 *
 * Die Warnung darüber stand schon in der Datei — jemand hatte es gefunden
 * und das Umsortieren vertagt, „während achtzehn Läufe rot waren" (§46).
 * Die sind weg.
 *
 * ─── DIE REGEL, NACH DER HIER GEZÄHLT WIRD ──────────────────────────────────
 * Ein Eintrag gilt als GESCHLOSSEN, wenn seine Überschrift durchgestrichen
 * ist (`~~…~~`) ODER das Wort GESCHLOSSEN in Grossbuchstaben trägt. Sonst
 * ist er offen.
 *
 * DAS WORT „offen" IM TITEL ZÄHLT NICHT. Der erste Anlauf suchte danach und
 * hielt L181 („Das Lineal steht zweimal, sobald ‚Zeichnen' offen ist") für
 * eine Statusangabe. Eine Messung, die den Titel für den Status hält, misst
 * den Titel (§55.2).
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Kein OFFENER Eintrag steht unterhalb von „Anhang B · Was erledigt ist".
 *   2  Jede Überschrift ist eindeutig einzuordnen — das Wort für „zu" ist
 *      GESCHLOSSEN (§35), nicht „erledigt", „abgearbeitet" oder „GELANDET".
 *      Drei Wörter für dieselbe Sache heissen: niemand kann zählen.
 *   3  Keine Nummer zweimal vergeben.
 *   4  Die Zahl, die die Datei über sich selbst nennt, stimmt.
 *
 * KEIN BROWSER, KEIN PORT. Dieser Lauf liest eine Datei. Er darf deshalb
 * auch neben einem vollen Lauf gefahren werden (§30 meint die Ports).
 *
 *   node pruefungen/lauf/test549.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const DATEI = path.join(WURZEL, 'LUECKEN.md');

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

console.log('\n' + '─'.repeat(60));
console.log('Suite 549 — Die Lückenliste sagt die Wahrheit über sich selbst');
console.log('─'.repeat(60));

const zeilen = fs.readFileSync(DATEI, 'utf8').split('\n');

/** Die Überschrift, hinter der nur noch Erledigtes stehen darf. */
const anhangB = zeilen.findIndex(z => /^#\s*Anhang B\b/.test(z));

type Eintrag = { zeile: number; nr: string; zu: boolean; kopf: string; wort: string };

const WORTE_ZU = ['GESCHLOSSEN'];
/** Andere Wörter, die dasselbe meinen sollen — und deshalb Fehler sind. */
const WORTE_FREMD = ['GELANDET', 'abgearbeitet', 'erledigt', 'BEHOBEN', 'GELÖST'];

const eintraege: Eintrag[] = [];
zeilen.forEach((z, i) => {
  const m = /^(#{2,3})\s*(L\d+)\b(.*)$/.exec(z);
  if (!m) return;
  const rest = m[3] ?? '';
  const durch = rest.includes('~~') || z.includes('~~');
  const wortZu = WORTE_ZU.find(w => rest.includes(w)) ?? '';
  const wortFremd = WORTE_FREMD.find(w => rest.includes(w)) ?? '';
  eintraege.push({ zeile: i, nr: m[2] ?? '', zu: durch || !!wortZu,
                   kopf: z.trim(), wort: wortZu || wortFremd });
});

const offen = eintraege.filter(e => !e.zu);
const zu = eintraege.filter(e => e.zu);

console.log('\n1 · Der Bestand');
console.log('    „Anhang B" steht in Zeile ' + (anhangB + 1));
console.log('    Einträge: ' + eintraege.length + ' · offen ' + offen.length +
            ' · geschlossen ' + zu.length);

p('Die Datei hat überhaupt eine Anhang-B-Überschrift', anhangB >= 0);
p('Es gibt Einträge zu zählen', eintraege.length > 0);

/* ---------------------------------------------------------------------- */
console.log('\n2 · Kein offener Punkt unter „Was erledigt ist"');

const offenUnten = offen.filter(e => e.zeile > anhangB);
console.log('    offen und unterhalb: ' + offenUnten.length);
for (const e of offenUnten.slice(0, 6))
  console.log('      Z' + (e.zeile + 1) + '  ' + e.kopf.slice(0, 78));
if (offenUnten.length > 6) console.log('      … und ' + (offenUnten.length - 6) + ' weitere');

p('Kein OFFENER Eintrag steht unter „Anhang B · Was erledigt ist"',
  offenUnten.length === 0,
  offenUnten.length + ' offene Lücken lesen sich von oben wie erledigt (§35)');

/* ---------------------------------------------------------------------- */
console.log('\n3 · Ein Wort für „zu", nicht fünf (§35)');

const fremd = eintraege.filter(e => WORTE_FREMD.some(w => e.kopf.includes(w)));
console.log('    fremde Schlusswörter: ' + fremd.length);
for (const e of fremd.slice(0, 6))
  console.log('      Z' + (e.zeile + 1) + '  ' + e.kopf.slice(0, 78));

p('Jede geschlossene Lücke sagt GESCHLOSSEN', fremd.length === 0,
  fremd.length + ' Überschriften mit „' +
  [...new Set(fremd.map(e => e.wort))].join('", „') + '" — dann kann niemand zählen');

/* ---------------------------------------------------------------------- */
console.log('\n4 · Keine Nummer zweimal');

const zaehler: Record<string, number> = {};
eintraege.forEach(e => { zaehler[e.nr] = (zaehler[e.nr] ?? 0) + 1; });
const doppelt = Object.entries(zaehler).filter(([, n]) => n > 1);
console.log('    doppelt vergeben: ' + (doppelt.length
  ? doppelt.map(([k, n]) => k + ' (' + n + '×)').join(', ') : 'keine'));
p('Keine L-Nummer ist doppelt vergeben', doppelt.length === 0,
  doppelt.map(([k]) => k).join(' '));

/* ---------------------------------------------------------------------- */
console.log('\n5 · Und die Zahl, die die Datei über sich selbst nennt');

/* „die Datei führt 103 Lücken, 53 offene und 50 geschlossene" — wenn so ein
   Satz dasteht, muss er stimmen. Eine Datei, die sich selbst falsch zählt,
   ist schlimmer als eine ohne Zahl (§30, dieselbe Lehre wie bei den 486). */
/* ÜBER DEN ZEILENUMBRUCH HINWEG. Der Satz steht in der Datei auf zwei
   Zeilen („… 103 Lücken, 53 offene und\n50 geschlossene"), und zeilenweise
   gesucht fehlt die dritte Zahl. Gesucht wird deshalb im ganzen Text. */
const ganzerText = zeilen.join('\n');
const treffer = /führt\s+(\d+)\s+Lücken[^.]*?(\d+)\s+offene[^.]*?(\d+)\s+geschlossene/
  .exec(ganzerText);
const satz = treffer ? treffer[0].replace(/\n/g, ' ') : '';
if (satz) {
  /* ERST AB „führt" ZÄHLEN. Der Satz beginnt mit „Gemessen am 20. September
     2026" — die ersten beiden Zahlen sind ein Datum, und der erste Anlauf
     verglich „genannt 20/2026/103" gegen „gemessen 101/52/49". Der Lauf war
     rot, sagte aber das Falsche: derselbe Fehler wie bei test544 und
     test545, nur diesmal in der eigenen Zeile (§55.2). */
  const zahlen = [Number(treffer![1]), Number(treffer![2]), Number(treffer![3])];
  console.log('    gefunden: „' + satz.trim().slice(0, 100) + '"');
  console.log('    gemessen: ' + eintraege.length + ' / ' + offen.length + ' / ' + zu.length);
  p('Die selbstgenannte Zahl stimmt mit der gezählten überein',
    zahlen[0] === eintraege.length && zahlen[1] === offen.length && zahlen[2] === zu.length,
    'genannt ' + zahlen.slice(0, 3).join('/') + ' · gemessen ' +
    [eintraege.length, offen.length, zu.length].join('/'));
} else {
  console.log('    kein Selbstzähl-Satz in der Datei — nichts nachzuprüfen');
  ok++; console.log('  ✓ Kein Selbstzähl-Satz, der falsch sein könnte');
}

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
