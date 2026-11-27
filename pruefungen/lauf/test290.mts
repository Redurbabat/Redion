/* Suite 290 — Kein Namensraum ohne Verzeichnis (E293, L90)
 * ============================================================================
 * `bs-` gehört seit dem Formelbuch der BUCHSEITE. Die Datei-Fläche griff beim
 * ersten Entwurf danach und erbte prompt `font-weight:700` und
 * `--accent-text` in ihren Unterzeilen. Sie heisst seither `bst-`. Gefunden
 * wurde das auf einem Bild, nicht von einem Prüflauf.
 *
 * L90 hält fest, dass DAS NICHT DIE LÜCKE IST:
 *
 *     „DIE LÜCKE IST NICHT DIESE EINE STELLE, SONDERN DASS NICHTS DAVOR
 *      WARNT. Redion hat rund vierzig CSS-Namensräume mit zwei bis vier
 *      Buchstaben, und keiner ist irgendwo aufgeschrieben. Der nächste neue
 *      Bereich greift genauso ins Leere, und der Fehler sieht wieder nicht
 *      wie ein Fehler aus — er sieht aus wie ein Stil, den man nicht
 *      bestellt hat."
 *
 * ─── WAS HIER NICHT GEMESSEN WIRD, UND WARUM ────────────────────────────────
 *
 * Der erste Entwurf dieses Laufs verlangte, dass jedes Präfix GENAU EINER
 * Stildatei gehört. Gemessen ergab das 21 „Verstösse" — und keiner davon war
 * einer:
 *
 *     db    → ansichten, bausteine, datenbanken, tabelle
 *     side  → aufbau, bausteine, grund, werkzeuge
 *     mb    → aufbau, premium
 *
 * Das ist jedes Mal EIN Bereich, der in mehreren Dateien wohnt. Redions
 * Stildateien sind nach Thema geschnitten, nicht nach Präfix. Eine Prüfung,
 * die das als Fehler meldet, ist rot, ohne dass jemand etwas falsch gemacht
 * hätte — und wird deshalb abgeschaltet statt gelesen.
 *
 * Gemessen wird stattdessen genau das, was L90 verlangt: dass die Namen
 * AUFGESCHRIEBEN sind. Das Verzeichnis steht in `doku/CSS-NAMENSRAEUME.md`.
 * Wer ein neues Präfix nimmt, wird von diesem Lauf gezwungen, es einzutragen
 * — und sieht dabei die Liste, auf der sein Wunschname vielleicht schon steht.
 *
 *   §1 DIE MESSUNG findet Präfixe im echten Stil.
 *   §2 JEDES benutzte Präfix steht im Verzeichnis.
 *   §3 JEDER Verzeichniseintrag wird auch benutzt — keine Karteileichen.
 *   §4 DIE HAUPTDATEI stimmt: ein Bereich, der umzieht, fällt auf.
 *   §5 GEGENPROBE in beide Richtungen.
 *   §6 DAS INSELBLATT (E699) nimmt keinen Namensraum der Schale, und seine
 *      Präfixe stehen im Verzeichnis unter „ausserhalb der Zählung".
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §5 ist die Antwort, und er prüft BEIDE Richtungen: ein erfundenes Präfix im
 * Stil muss als fehlend gemeldet werden, ein erfundener Verzeichniseintrag
 * als überflüssig. Ein Wächter, der nur „alles in Ordnung" sagen kann, ist
 * keiner.
 *
 *   node pruefungen/lauf/test290.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const STIL = path.join(WURZEL, 'quell/schale/stil');
const LISTE = path.join(WURZEL, 'doku/CSS-NAMENSRAEUME.md');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/** Ab wie vielen Vorkommen ein Präfix ein eigener Namensraum ist. Darunter
    ist es meist ein Fremdzugriff — eine Datei, die eine Klasse einer anderen
    mitgestaltet, und das ist erlaubt. */
const EIGEN_AB = 4;

/**
 * Was im Stil wirklich steht.
 *
 * Gibt je Präfix die Gesamtzahl und die Datei mit den meisten Vorkommen.
 * Der Regex ist derselbe, mit dem `doku/CSS-NAMENSRAEUME.md` entstanden ist;
 * änderte man einen von beiden allein, wäre das Verzeichnis eine Behauptung
 * über etwas anderes als den Stil.
 */
const messen = (dateien: Array<{ name: string; text: string }>) => {
  const je = new Map<string, Map<string, number>>();
  for (const d of dateien)
    for (const t of d.text.matchAll(/\.([a-z]{2,4})-[a-z0-9-]+/g)) {
      const px = t[1] as string;
      if (!je.has(px)) je.set(px, new Map());
      const m = je.get(px)!;
      m.set(d.name, (m.get(d.name) || 0) + 1);
    }
  const raus = new Map<string, { gesamt: number; haupt: string }>();
  for (const [px, m] of je) {
    const gesamt = [...m.values()].reduce((a, b) => a + b, 0);
    if (gesamt < EIGEN_AB) continue;
    const haupt = [...m.entries()].sort((a, b) => b[1] - a[1])[0]![0];
    raus.set(px, { gesamt, haupt });
  }
  return raus;
};

/** Was das Verzeichnis behauptet. */
const lesen = (text: string): Map<string, string> => {
  const raus = new Map<string, string>();
  for (const z of text.split('\n')) {
    const t = /^([a-z]{2,4})\s+(\d+)\s+([a-z][a-z0-9-]*\.css)\s*$/.exec(z);
    if (t) raus.set(t[1] as string, t[3] as string);
  }
  return raus;
};

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Messung findet Präfixe im echten Stil');

const namen = fs.readdirSync(STIL).filter(n => n.endsWith('.css')).sort();
const dateien = namen.map(n => ({ name: n, text: fs.readFileSync(path.join(STIL, n), 'utf-8') }));
const stil = messen(dateien);

p('Es gibt Stildateien', dateien.length >= 10, String(dateien.length));
p('Und Präfixe darin', stil.size >= 100, String(stil.size) + ' Präfixe');
p('`bs-` gehört den Bausteinen', stil.get('bs')?.haupt === 'bausteine.css',
  JSON.stringify(stil.get('bs')));
p('`bst-` ist ein eigener Namensraum — genau der Umzug aus L90',
  !!stil.get('bst'), JSON.stringify(stil.get('bst')));

/* ------------------------------------------------------------------------ */
console.log('\n2 · Jedes benutzte Präfix steht im Verzeichnis');

p('Das Verzeichnis gibt es', fs.existsSync(LISTE), LISTE);
const liste = fs.existsSync(LISTE) ? lesen(fs.readFileSync(LISTE, 'utf-8')) : new Map();
p('Und es hat Einträge', liste.size >= 100, String(liste.size) + ' Einträge');

const fehlend = [...stil.keys()].filter(px => !liste.has(px)).sort();
p('Kein Präfix fehlt im Verzeichnis', fehlend.length === 0,
  fehlend.join(', ') + ' — bitte in doku/CSS-NAMENSRAEUME.md eintragen');

/* ------------------------------------------------------------------------ */
console.log('\n3 · Jeder Eintrag wird auch benutzt');

const tot = [...liste.keys()].filter(px => !stil.has(px)).sort();
p('Keine Karteileiche im Verzeichnis', tot.length === 0,
  tot.join(', ') + ' — steht im Verzeichnis, aber nicht mehr im Stil');

/* ------------------------------------------------------------------------ */
console.log('\n4 · Die Hauptdatei stimmt');

const gewandert = [...stil.entries()]
  .filter(([px, m]) => liste.has(px) && liste.get(px) !== m.haupt)
  .map(([px, m]) => px + ': Verzeichnis sagt ' + liste.get(px) + ', Stil sagt ' + m.haupt);
p('Kein Bereich ist unbemerkt in eine andere Datei gezogen',
  gewandert.length === 0, gewandert.join(' | '));

/* ------------------------------------------------------------------------ */
console.log('\n5 · GEGENPROBE in beide Richtungen');

const mitNeuem = messen(dateien.concat([{
  name: 'erfunden.css',
  text: '.xyz-eins{a:1}.xyz-zwei{a:1}.xyz-drei{a:1}.xyz-vier{a:1}'
}]));
const jetztFehlend = [...mitNeuem.keys()].filter(px => !liste.has(px));
p('Ein neues Präfix im Stil WIRD als fehlend gemeldet',
  jetztFehlend.includes('xyz'), jetztFehlend.join(', '));

const mitTotem = new Map(liste);
mitTotem.set('qqq', 'erfunden.css');
const jetztTot = [...mitTotem.keys()].filter(px => !stil.has(px));
p('Ein Eintrag ohne Stil WIRD als Karteileiche gemeldet',
  jetztTot.includes('qqq'), jetztTot.join(', '));

const mitUmzug = new Map(liste);
mitUmzug.set('bs', 'ganz-woanders.css');
const jetztGewandert = [...stil.entries()]
  .filter(([px, m]) => mitUmzug.has(px) && mitUmzug.get(px) !== m.haupt);
p('Eine falsche Hauptdatei WIRD gemeldet',
  jetztGewandert.some(([px]) => px === 'bs'),
  jetztGewandert.map(([px]) => px).join(', '));

/* Und die Gegenprobe zur Gegenprobe: unter der Schwelle zählt nichts. */
const knapp = messen(dateien.concat([{
  name: 'knapp.css', text: '.uvw-eins{a:1}.uvw-zwei{a:1}.uvw-drei{a:1}'
}]));
p('Drei Vorkommen sind noch kein Namensraum — Fremdzugriff bleibt erlaubt',
  !knapp.has('uvw'), JSON.stringify(knapp.get('uvw')));

/* ------------------------------------------------------------------------ */
console.log('\n6 · Das Inselblatt trägt keinen Namensraum der Schale (E699)');

/* `quell/islands/islands.css` liegt nicht unter `quell/schale/stil/` und
   zählt deshalb oben nicht mit — dieselbe Lage wie `res-` (UI-Reserve). Es
   ist das CSS des Touch Kits, gebündelt von `bauen-inseln.mts`, und es
   kommt in DIESELBE Seite wie Redions Stil. Ein Präfix, das beide
   benutzen, wäre der Fall `bs-`/`bst-` aus L90, nur zwischen zwei
   Bibliotheken statt zwischen zwei Bereichen. */
const INSELBLATT = path.join(WURZEL, 'quell/islands/islands.css');
const inselText = fs.existsSync(INSELBLATT) ? fs.readFileSync(INSELBLATT, 'utf-8') : '';
const insel = messen([{ name: 'islands.css', text: inselText }]);
p('Das Inselblatt ist da und hat Präfixe', insel.size >= 1, [...insel.keys()].join(', ') || 'keins');
const kollision = [...insel.keys()].filter(px => stil.has(px) || liste.has(px));
p('Kein Präfix des Inselblatts gehört schon der Schale', kollision.length === 0,
  kollision.join(', '));
const doku = fs.existsSync(LISTE) ? fs.readFileSync(LISTE, 'utf-8') : '';
const ausserhalb = /\n## [^\n]*ausserhalb der Zählung[\s\S]*?(?=\n## )/.exec(doku)?.[0] ?? '';
const unbenannt = [...insel.keys()].filter(px => !ausserhalb.includes('`' + px + '-'));
p('Jedes Präfix des Inselblatts steht im Verzeichnis unter „ausserhalb der Zählung"',
  !!ausserhalb && unbenannt.length === 0, unbenannt.join(', ') || (ausserhalb ? '' : 'Abschnitt fehlt'));
const mitSchale = messen([{ name: 'islands.css', text: inselText + '.bs-a{}.bs-b{}.bs-c{}.bs-d{}' }]);
p('Gegenprobe: ein Schalen-Präfix im Inselblatt WIRD gemeldet',
  [...mitSchale.keys()].some(px => stil.has(px)), [...mitSchale.keys()].join(', '));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
