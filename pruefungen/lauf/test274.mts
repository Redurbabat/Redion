/* Suite 274 — Kein Griff bindet an eine Kennung, die es nicht gibt (L86/E280)
 * ============================================================================
 * WARUM ES DIESEN LAUF GIBT. `an('x', …)` in der Schale und
 * `document.getElementById('x')` überall sonst binden STILL, wenn es `x`
 * nicht gibt. Das ist bequem und genau deshalb gefährlich: eine Zeile, die
 * aussieht wie ein Weg, kann seit Monaten an nichts hängen — und niemand
 * merkt es, weil nichts kaputtgeht. Es passiert einfach nichts.
 *
 * Drei solche Zeilen standen bis E280 im Code, jede mit einem Kommentar,
 * der erklärte, warum sie bleiben durfte:
 *
 *   hl-seiten     seit E236 in keinem Markup (schale.ts)
 *   hl-konto      seit E236 in keinem Markup (schale.ts)
 *   weltwechsel   seit E206 in keinem Markup (produktwelten.ts)
 *
 * Redur hat in E277 entschieden, dass sie weg sollen. Damit die nächsten
 * drei nicht wieder monatelang stehen, misst dieser Lauf sie.
 *
 * ─── WIE GEMESSEN WIRD ──────────────────────────────────────────────────────
 *   1. Jede Kennung aus `an('…')` in `schale.ts` — die eine Bindestelle
 *      der Schale.
 *   2. Jede Kennung aus `getElementById('…')` und `element('…')` in ganz
 *      `src/` — dieselbe Frage, anderer Weg.
 *
 * Beides braucht es: `hl-seiten` läuft nur über `an()`, `weltwechsel` nur
 * über `element()`. Ein Lauf, der nur eine der beiden Sammelstellen liest,
 * hätte je nachdem zwei von drei oder eins von drei gefunden.
 *
 * ─── DIE FALLE, und sie hat beim Schreiben zugeschlagen ─────────────────────
 * Ohne Kommentar-Streichung fand der erste Durchlauf ein VIERTES:
 * `btn-suche-mitte`. Es steht in `schale.ts` nur noch im Kommentar
 * „HIER STAND `an('btn-suche-mitte', …)` — bis E272" — also an einer
 * Stelle, die das Aufräumen dokumentiert. Ein Wächter, der aufgeräumte
 * Wege als tot meldet, macht sich beim ersten Blick unglaubwürdig.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * Er WAR es: am Baum von vor E280 fand er genau die drei oben, und mit dem
 * Kommentar-Fehler vier. Dazu unten eine Gegenprobe mit einer erfundenen
 * Kennung.
 *
 *   node pruefungen/lauf/test274.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const lies = (rel: string): string => {
  const pfad = path.join(WURZEL, rel);
  return fs.existsSync(pfad) ? fs.readFileSync(pfad, 'utf8') : '';
};

/** Kommentare raus, bevor gesucht wird — sonst zählen aufgeräumte Wege mit. */
const ohneKommentar = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

/** Alle .ts unter src/ — rekursiv. */
const alleQuellen = (unter: string): string[] => {
  const raus: string[] = [];
  const geh = (rel: string): void => {
    for (const e of fs.readdirSync(path.join(WURZEL, rel), { withFileTypes: true })) {
      const kind = rel + '/' + e.name;
      if (e.isDirectory()) geh(kind);
      else if (e.name.endsWith('.ts')) raus.push(kind);
    }
  };
  geh(unter);
  return raus;
};

/* ========================================================================= *
 * DIE AUSNAHMEN — jede mit geschriebenem Grund
 * ------------------------------------------------------------------------- *
 * Nicht jede Kennung steht als `id="…"` im Quelltext. Manche werden aus
 * einer Tabelle gesetzt. Solche gehören hierher, MIT Begründung — eine
 * leere Zeile wäre keine Ausnahme, sondern eine unbeantwortete Frage, und
 * der letzte Punkt unten besteht darauf.
 * ========================================================================= */
const ERLAUBT: Record<string, string> = {
  'mb-konto': 'menueband.ts setzt `b.id = id` aus der RECHTS-Tabelle — die ' +
              'Kennung steht dort als Tabellenwert, nicht als id="…" im Markup.'
};

console.log('\nSuite 274 — Kein Griff bindet ins Leere (L86/E280)');

const dateien = alleQuellen('src');
const markup = lies('index.html');
let alles = '';
for (const f of dateien) alles += lies(f);
/* Dasselbe noch einmal OHNE Kommentare. `alles` darf sie behalten — dort
   wird nach `id="…"` gesucht, und ein `id="x"` im Kommentar ist praktisch
   immer ein echtes daneben. Wo aber nach einem AUFRUF gesucht wird, muss
   der Kommentar weg: sonst meldet der Lauf einen Weg als lebendig, der nur
   noch in der Erklärung seines Abbaus steht. Genau das ist beim Schreiben
   dieser Datei passiert — die Zeile unten war rot, und zwar zu Recht. */
let allesOhne = '';
for (const f of dateien) allesOhne += ohneKommentar(lies(f));

/** Kann diese Kennung überhaupt irgendwo entstehen? */
const entsteht = (id: string): boolean =>
  markup.includes('id="' + id + '"') ||
  alles.includes('id="' + id + '"') ||
  alles.includes("id='" + id + "'") ||
  alles.includes('.id = \'' + id + '\'') ||
  alles.includes('.id = "' + id + '"') ||
  alles.includes('.id=\'' + id + '\'') ||
  alles.includes('.id="' + id + '"');

/* ------------------------------------------------------------------------ */
console.log('\n1 · Die Schale: jedes an() trifft eine Kennung, die es gibt');

const schale = ohneKommentar(lies('src/schale/aufbau/schale.ts'));
const gebunden = [...schale.matchAll(/(?:^|[^\w.])an\(\s*'([a-z0-9-]+)'/gi)]
  .map(m => m[1]!)
  .filter((x, i, a) => a.indexOf(x) === i);

p('Die Messung findet überhaupt Bindungen', gebunden.length >= 15,
  gebunden.length + ' gefunden — zu wenige hiesse, das Muster passt nicht mehr');

const verwaisteAn = gebunden.filter(id => !entsteht(id) && !(id in ERLAUBT));
p('Keine verwaiste Bindung in der Schale', verwaisteAn.length === 0,
  verwaisteAn.join(', '));

/* Die drei aus L86 namentlich — damit sie nicht durch die Hintertür
   zurückkommen, und damit der Punkt sagt, worum es ging. */
p('`hl-seiten` ist wirklich weg', !gebunden.includes('hl-seiten'));
p('`hl-konto` ist wirklich weg', !gebunden.includes('hl-konto'));

/* ------------------------------------------------------------------------ */
console.log('\n2 · Der ganze Quellbaum: getElementById und element()');

let geprueft = 0;
const verwaisteSuche: string[] = [];
for (const f of dateien) {
  const t = ohneKommentar(lies(f));
  const treffer = [
    ...t.matchAll(/getElementById\(\s*'([a-z0-9-]+)'\s*\)/gi),
    ...t.matchAll(/(?:^|[^\w.])element\(\s*'([a-z0-9-]+)'\s*\)/gi)
  ];
  for (const m of treffer) {
    geprueft++;
    const id = m[1]!;
    if (!entsteht(id) && !(id in ERLAUBT)) verwaisteSuche.push(f + ': ' + id);
  }
}
p('Die Messung findet überhaupt Nachschlagestellen', geprueft >= 80,
  geprueft + ' gefunden');
p('Keine verwaiste Nachschlagestelle', verwaisteSuche.length === 0,
  [...new Set(verwaisteSuche)].join(' | '));
p('`weltwechsel` ist wirklich weg', !allesOhne.includes("element('weltwechsel')"),
  'die Erwähnung im Kommentar zählt nicht — der Aufruf schon');

/* ------------------------------------------------------------------------ */
console.log('\n3 · Gegenproben — kann dieser Lauf überhaupt rot werden?');

/* (a) Eine erfundene Kennung muss auffallen. Ohne diesen Punkt wäre
   „nichts verwaist" auch dann grün, wenn `entsteht` immer wahr sagt. */
p('Eine erfundene Kennung entsteht nirgends', !entsteht('gibt-es-hier-sicher-nicht'));

/* (b) Und eine echte muss gefunden werden — sonst wäre `entsteht` immer
   falsch und §1/§2 meldeten alles als verwaist. Das ist der Zwilling zu
   (a), und ohne ihn wäre der Lauf in die andere Richtung blind. */
p('Eine echte Kennung aus dem Markup wird gefunden', entsteht('handy-oben'));

/* (c) Kommentare zählen NICHT mit. `btn-suche-mitte` steht in schale.ts nur
   noch im Kommentar über sein eigenes Aufräumen; ohne die Streichung meldete
   der Lauf es als vierten toten Griff. Genau so ist es beim Schreiben
   passiert. */
p('Ein Kommentar über einen aufgeräumten Weg zählt nicht mit',
  lies('src/schale/aufbau/schale.ts').includes("an('btn-suche-mitte'") &&
  !gebunden.includes('btn-suche-mitte'),
  'entweder fehlt der Kommentar, oder die Streichung greift nicht');

/* (d) Jede Ausnahme trägt ihren Grund. Eine Ausnahmeliste ohne Begründung
   ist eine Liste, in die man alles schiebt, was gerade rot ist. */
const ohneGrund = Object.entries(ERLAUBT)
  .filter(([, g]) => g.trim().length <= 20).map(([k]) => k);
p('Jede Ausnahme in ERLAUBT ist begründet', ohneGrund.length === 0,
  ohneGrund.join(', '));

/* ========================================================================= */
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
