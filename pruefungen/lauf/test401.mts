/* Suite 401 — Erfundene Farbtokens und namenlose Farbfelder (E406)
 * ============================================================================
 * Zwei Wächter, beide ohne Browser und ohne Port — sie lesen den Quelltext.
 *
 *   §1 KEIN ERFUNDENES TOKEN. Jedes `var(--x)` in den Stildateien und im
 *      TypeScript muss ein `--x:` haben, das es irgendwo wirklich gibt.
 *   §2 KEIN RÜCKFALLWERT AUF EIN ERFUNDENES TOKEN. `var(--soft,#f6f6f6)`
 *      sieht aus wie ein Token und ist eine feste Farbe: der Rückfall greift
 *      IMMER, und im Dunkelmodus steht eine weisse Fläche da.
 *   §3 KEIN FARBFELD OHNE NAMEN. Ein Knopf, dessen ganze Aussage seine
 *      Hintergrundfarbe ist, braucht `aria-label` — §38 sagt: keine
 *      Information nur über Farbe, und bei einem Farbwähler ist das kein
 *      Wortspiel.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Sie WAR rot, gegen den Bestand vor E406: 30 Stellen mit sieben erfundenen
 * Tokens (--rot, --warn, --soft, --gelb, --c-rot, --c-gruen, --text-muted)
 * und vier Farbreihen, von denen drei keinen Namen trugen.
 *
 * Gegenprobe heute: in `wolke.ts` ein `var(--warnung)` zurück auf
 * `var(--warn,#c88)` setzen — §1 und §2 fallen beide.
 *
 *   node pruefungen/lauf/test401.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/** Alle Dateien unter einem Ordner, die auf eine der Endungen hören. */
const sammeln = (ordner: string, endungen: string[]): string[] => {
  const raus: string[] = [];
  const gehe = (d: string): void => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const voll = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') gehe(voll); }
      else if (endungen.some(x => e.name.endsWith(x))) raus.push(voll);
    }
  };
  gehe(ordner);
  return raus.sort();
};

const stile = sammeln(path.join(WURZEL, 'quell/schale/stil'), ['.css']);
const quelle = sammeln(path.join(WURZEL, 'src'), ['.ts']);

/* ==========================================================================
 * §1 + §2 · TOKENS
 * ========================================================================*/
console.log('\n§1 Kein erfundenes Farbtoken');

const definiert = new Set<string>();
// Ein direkt in index.html geladenes Fremdblatt kann öffentliche Tokens
// bereitstellen. Unbenutzte Dateien auf der Platte zählen nicht.
const index = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const fremdstile = [...index.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="(quell\/fremd\/[\w./-]+\.css)"/g)]
  .flatMap(m => m[1] ? [path.join(WURZEL, m[1])] : []);
for (const f of [...stile, ...fremdstile]) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/(--[\w-]+)\s*:/g)) if (m[1]) definiert.add(m[1]);
}
for (const f of quelle) {
  const t = fs.readFileSync(f, 'utf8');
  for (const m of t.matchAll(/setProperty\(\s*'(--[\w-]+)'/g)) if (m[1]) definiert.add(m[1]);
  /* Zur Laufzeit gesetzte Tokens stehen als Inline-Stil im HTML — und ein
     Attribut kann MEHRERE tragen. Hier stand ein Ausdruck, der `[^"]*;`
     gierig las und deshalb nur das LETZTE fand: aus
     `style="--i:${i};--dick:${dick}px"` kam allein `--dick` an, und `--i`
     galt als erfunden, obwohl die Zeile es setzt. Jetzt wird erst das
     ganze Attribut genommen und dann jedes Token darin. */
  for (const m of t.matchAll(/style="([^"]*)"/g))
    for (const n of (m[1] ?? '').matchAll(/(--[\w-]+)\s*:/g)) if (n[1]) definiert.add(n[1]);
  for (const m of t.matchAll(/'(--[\w-]+)':/g)) if (m[1]) definiert.add(m[1]);
  for (const m of t.matchAll(/stil:\s*`(--[\w-]+)/g)) if (m[1]) definiert.add(m[1]);
}
p('Es sind Tokens definiert', definiert.size > 100, String(definiert.size));

const erfunden: string[] = [];
const mitRueckfall: string[] = [];
for (const f of [...stile, ...quelle]) {
  const t = fs.readFileSync(f, 'utf8');
  const kurz = f.slice(WURZEL.length + 1);
  for (const m of t.matchAll(/var\(\s*(--[\w-]+)\s*(,[^)]*)?\)/g)) {
    const name = m[1];
    if (!name || definiert.has(name)) continue;
    /* `var(--c-${art})` und Ähnliches setzt der Code zusammen — die
       Kennung steht dann nicht als Ganzes da und ist hier nicht zu prüfen. */
    if (/^--[bc]-$/.test(name) || name === '--x') continue;
    (m[2] ? mitRueckfall : erfunden).push(`${name} (${kurz})`);
  }
}
p('Kein `var()` zeigt auf ein Token, das es nicht gibt',
  erfunden.length === 0, [...new Set(erfunden)].slice(0, 6).join(', '));

console.log('\n§2 Kein Rückfallwert, der immer greift');
p('Kein `var(--x, fest)` mit erfundenem --x',
  mitRueckfall.length === 0, [...new Set(mitRueckfall)].slice(0, 6).join(', '));

/* ==========================================================================
 * §3 · FARBFELDER
 * --------------------------------------------------------------------------
 * Erkannt wird ein Farbfeld daran, dass sein einziger Inhalt seine
 * Hintergrundfarbe ist: `<button ... style="background:…"></button>`.
 * ========================================================================*/
console.log('\n§3 Kein Farbfeld ohne Namen');

const namenlos: string[] = [];
for (const f of quelle) {
  const t = fs.readFileSync(f, 'utf8');
  const kurz = f.slice(WURZEL.length + 1);
  t.split('\n').forEach((z, i) => {
    for (const m of z.matchAll(/<button([^>]*background[^>]*)>([^<]*)(<\/button>)?/g)) {
      const attrs = m[1] ?? '';
      if (attrs.includes('aria-label') || attrs.includes('aria-hidden')) continue;
      /* Ein Knopf MIT Text ist kein Farbfeld — „Speichern" auf einer
         Akzentfläche trägt seinen Namen selbst. */
      const inhalt = (m[2] ?? '').replace(/\$\{[^}]*\}/g, 'X').replace(/[`'"+\s]/g, '');
      if (inhalt) continue;
      namenlos.push(`${kurz}:${i + 1}`);
    }
  });
}
p('Jedes Farbfeld trägt eine Marke', namenlos.length === 0,
  namenlos.slice(0, 6).join(', '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
