/* Suite 410 — Eine CSS-Zeile ohne Semikolon ist zwei tote Regeln (E415)
 * ============================================================================
 * Zweimal passiert, beide Male durch dieselbe Hand: ein Skript setzte eine
 * Deklaration hinter eine andere, ohne Semikolon dazwischen.
 *
 *     cursor:pointer position:relative;
 *
 * CSS meldet das nicht. Es wirft die GANZE Deklaration weg — beide, nicht
 * nur die zweite — und macht weiter. Kein Fehler in der Konsole, kein Hinweis
 * beim Bauen, nichts.
 *
 * E407 hat vier solche Stellen gefunden und mit einem Regex repariert. Eine
 * hat der Regex nicht erwischt, und sie kostete `test179`: ohne das
 * `position:relative` bezog sich die 44-px-Treffläche des `::after` nicht
 * mehr auf ihren Knopf, sondern auf einen Vorfahren — und legte sich über
 * die Nachbarknöpfe. Ein Klick auf den Anker der PDF-Leiste lief in eine
 * Zeitüberschreitung.
 *
 * Gefunden hat es kein Mensch und kein Bild, sondern ein voller Lauf, drei
 * Wochen später. Deshalb dieser Wächter.
 *
 *   §1 Keine Deklaration ohne Semikolon vor der nächsten.
 *   §2 Der Leser findet einen eingebauten Fall — sonst prüft er nichts.
 *   §3 Und er meldet KEINE gültigen Zeilen (Kurzschreibweisen, `content`,
 *      `grid-template`, Farbfunktionen).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * §1 → in einer Stildatei ein Semikolon zwischen zwei Deklarationen
 *      entfernen. Gelaufen, Ergebnis im Bericht zu E415.
 * Und §2 ist die eingebaute Dauergegenprobe: der Leser bekommt bei JEDEM
 * Lauf einen erfundenen Fall vorgesetzt und muss ihn finden.
 *
 *   node pruefungen/lauf/test410.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const STIL = path.join(WURZEL, 'quell/schale/stil');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* Die Liste der Eigenschaften, hinter denen eine zweite stehen KÖNNTE.
   Absichtlich klein und wörtlich: ein allgemeiner Ausdruck über „irgendein
   Wort gefolgt von Doppelpunkt" fängt `background:linear-gradient(...)` und
   jede Farbfunktion mit. Ein Wächter, der bei gültigem CSS anschlägt, wird
   abgeschaltet — und dann fängt er auch das Echte nicht mehr. */
const EIGENSCHAFTEN = [
  'position', 'cursor', 'display', 'color', 'background', 'border',
  'margin', 'padding', 'font-size', 'font-weight', 'width', 'height',
  'flex', 'overflow', 'z-index', 'content', 'transform', 'opacity',
  'text-align', 'line-height', 'border-radius', 'box-shadow', 'gap'
];

/**
 * Sucht eine Deklaration, hinter der ohne Semikolon eine zweite beginnt.
 *
 * Gearbeitet wird zeilenweise INNERHALB eines Regelblocks. Kommentare
 * fliegen vorher heraus — sonst meldet der Wächter jeden erklärenden Satz,
 * in dem zufällig „position: oben" steht.
 */
const findeFehler = (text: string): string[] => {
  const ohneKommentar = text.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const raus: string[] = [];
  /* Ein Wert endet, wo ein Semikolon, eine schliessende Klammer oder das
     Zeilenende steht. Was DAVOR liegt und selbst wie „name:" aussieht, ist
     der Fehler — aber nur, wenn ein Leerzeichen davor steht und kein Komma,
     keine Klammer und kein Doppelpunkt: `url(a:b)` und `rgb(1,2,3)` sind
     gültig, ebenso `background:var(--x) center`. */
  for (const eig of EIGENSCHAFTEN) {
    const re = new RegExp(
      '[a-zA-Z0-9%)\\]"\'-]\\s+' + eig + '\\s*:[^;{}]*[;}]', 'g');
    for (const m of ohneKommentar.matchAll(re)) {
      const stelle = m[0];
      /* Nur wenn im Stück davor KEIN Semikolon steht — sonst ist es eine
         gewöhnliche zweite Deklaration in derselben Zeile. */
      const vorher = ohneKommentar.slice(Math.max(0, m.index - 90), m.index + 1);
      const letzteTrennung = Math.max(
        vorher.lastIndexOf(';'), vorher.lastIndexOf('{'), vorher.lastIndexOf('}'));
      const zwischen = vorher.slice(letzteTrennung + 1);
      /* In diesem Zwischenstück muss bereits ein Doppelpunkt stehen — dann
         ist hier schon eine Deklaration im Gang und die zweite beginnt ohne
         Trennung. Klammern schliessen Funktionswerte aus. */
      if (zwischen.includes(':') && !zwischen.includes('(') && !zwischen.includes('@'))
        raus.push(stelle.trim().slice(0, 70));
    }
  }
  return [...new Set(raus)];
};

/* ==========================================================================
 * §2 · ZUERST: FINDET DER LESER ÜBERHAUPT ETWAS?
 * --------------------------------------------------------------------------
 * Das steht VOR §1, und mit Absicht. Ein Wächter, der nichts finden kann,
 * meldet fröhlich „alles in Ordnung" — genau das ist §55.2. Also bekommt er
 * bei jedem Lauf den echten Fall von E407 vorgesetzt.
 * ========================================================================*/
console.log('\n§2 Der Leser findet den eingebauten Fall');

const ECHTER_FALL = `.blatt-fest button{min-height:32px; padding:4px 9px;
  font-size:13px; color:var(--text); background:none; cursor:pointer position:relative;}`;
const gefunden = findeFehler(ECHTER_FALL);
p('Der Fall aus E407 wird gefunden', gefunden.length === 1, JSON.stringify(gefunden));
p('Und zwar mit dem richtigen Wortlaut',
  gefunden.some(f => /position\s*:/.test(f)), JSON.stringify(gefunden));

/* ==========================================================================
 * §3 · UND ER MELDET NICHTS GÜLTIGES
 * ========================================================================*/
console.log('\n§3 Gültiges CSS bleibt unbehelligt');

const GUELTIG = [
  '.a{background:linear-gradient(100deg, var(--text) 44%, var(--accent) 50%)}',
  '.b{cursor:pointer; position:relative}',
  '.c{content:""; position:absolute; left:0; right:0}',
  '.d{grid-template-columns:repeat(7,1fr); gap:1px}',
  '.e{background:url("bild.png") center / cover no-repeat}',
  '.f{box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--text) 26%, transparent)}',
  '.g{font:13px/1.4 system-ui; color:red}',
  '.h{transition:color .1s ease; opacity:.6}',
  '/* position:relative steht hier nur im Text, background:none auch */\n.i{color:red}'
];
const falschAlarm = GUELTIG.map(t => [t.slice(0, 34), findeFehler(t)] as const)
  .filter(([, f]) => f.length);
p('Keine der neun gültigen Zeilen wird gemeldet', falschAlarm.length === 0,
  JSON.stringify(falschAlarm));

/* ==========================================================================
 * §1 · UND JETZT DER BESTAND
 * ========================================================================*/
console.log('\n§1 Der echte Bestand');

const dateien = fs.readdirSync(STIL).filter(n => n.endsWith('.css')).sort();
p('Es gibt Stildateien zu prüfen', dateien.length >= 5, dateien.join(', '));

const treffer: string[] = [];
for (const n of dateien) {
  for (const f of findeFehler(fs.readFileSync(path.join(STIL, n), 'utf8')))
    treffer.push(n + ': ' + f);
}
p('Keine Deklaration ohne Semikolon vor der nächsten', treffer.length === 0,
  treffer.slice(0, 4).join(' | '));

/* Und die Einzeldatei, weil sie dasselbe CSS trägt und getrennt gebaut wird. */
const einzel = path.join(WURZEL, 'redion-einzeldatei.html');
if (fs.existsSync(einzel)) {
  const roh = fs.readFileSync(einzel, 'utf8');
  /* ══ NUR EIN `<style>` AM ZEILENANFANG IST EINES (E671) ══════════════════
     Hier stand dasselbe ohne `^` und `m` — und damit fing dieser Lauf jedes
     `<style>` ein, das irgendwo im Fliesstext eines Kommentars vorkommt.
     Genau eines gibt es: die Sanitizer-Doku zählt die verbotenen Tags auf
     („· <script>, <style>, <iframe>, <object> …"). Von dort schluckte der
     nicht-gierige Ausdruck **5,3 MB** bis zum nächsten `</style>` — quer
     durch den ganzen eingebetteten JavaScript-Bestand.

     Aufgefallen ist es erst, als in der Chronik ein deutscher Satz stand,
     der wie CSS aussieht: „Die 26 px entstehen aus font-size:12px und
     padding:3px 9px." (P97). Der Lauf meldete ihn als tote Deklaration —
     eine Messung, die Prosa für Code hält.

     `bauen.mts` schreibt jeden echten Stilblock an den Zeilenanfang: auf
     `<style>` folgt sofort ein Zeilenumbruch und die Kopfzeile mit dem
     Dateinamen. Das ist der Unterschied, und er ist gemessen: 21 echte
     Blöcke statt 25.

     (Der Anfang dieses Kommentars zitierte die Bau-Zeile wörtlich — mit
     ihrem Kommentar-Ende darin. Damit schloss sich dieser Kommentar
     selbst, und Node sagte `ERR_INVALID_TYPESCRIPT_SYNTAX`. Derselbe
     Fehler wie die runde Klammer im PDF-Text von test177.) */
  const stilBloecke = [...roh.matchAll(/^<style[^>]*>([\s\S]*?)<\/style>/gm)].map(m => m[1] ?? '');
  p('Die Einzeldatei trägt Stil', stilBloecke.length > 0, String(stilBloecke.length));
  const inEinzel = stilBloecke.flatMap(b => findeFehler(b));
  p('Und auch dort keine tote Deklaration', inEinzel.length === 0,
    inEinzel.slice(0, 3).join(' | '));
}

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
