/* ============================================================================
 * umzug.mts — die mechanischen Schritte eines Umzugs von JavaScript zu TypeScript
 * ----------------------------------------------------------------------------
 *     node umzug.mts quell/kern/zustand/verlauf.js quell/register/module.js
 *     node umzug.mts --stand
 *
 * ─── WOZU ───────────────────────────────────────────────────────────────────
 *
 * `doku/MIGRATION-REZEPT.md` beschreibt acht Schritte. Fünf davon sind reine
 * Handarbeit ohne Urteil: verschieben, Kopf einsetzen, `window.X` umschreiben,
 * aus `src/global.d.ts` streichen, aus `pruefungen/js-bestand.json` streichen.
 * Wer sie von Hand macht, vergisst irgendwann einen — und merkt es erst, wenn
 * ein Prüflauf rot wird oder, schlimmer, wenn er nicht rot wird, weil der
 * Eintrag in `global.d.ts` stehenblieb und das Modul weiter als `any` gilt.
 *
 * Die drei Schritte, die Urteil brauchen — Typen setzen, echte Funde beheben,
 * prüfen —, macht dieses Werkzeug ausdrücklich NICHT. Es bereitet vor.
 *
 * ─── DIE FALLE MIT DEM PFAD ─────────────────────────────────────────────────
 *
 * Der Pfad unter `src/` muss den Pfad unter `quell/` spiegeln, Ordner für
 * Ordner. `src/schale/ui.ts` landet als `quell/schale/ui.js` — geladen wird
 * aber `quell/schale/ueberlagerung/ui.js`, und die Seite bleibt weiss, ohne
 * dass irgendwo ein Fehler steht. Dieses Werkzeug leitet das Ziel deshalb aus
 * der Quelle ab, statt es tippen zu lassen.
 *
 * ─── SPRACHE ────────────────────────────────────────────────────────────────
 *
 * TypeScript, `.mts`, von Node direkt ausgeführt (E28). Der Vorläufer war ein
 * Python-Skript in /tmp — praktisch, aber Python steht nicht in der Liste der
 * erlaubten Sprachen, und ein Werkzeug ausserhalb der Regel ist ein Werkzeug,
 * das niemand ausser mir benutzen kann.
 * ==========================================================================*/

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';

const VERZEICHNIS = 'pruefungen/js-bestand.json';
const GLOBAL = 'src/global.d.ts';

/** Zeichen, die in einer regulären Ausdruck-Vorlage etwas bedeuten. */
const roh = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Das Verzeichnis der noch nicht umgezogenen Dateien. */
const bestand = (): string[] =>
  JSON.parse(readFileSync(VERZEICHNIS, 'utf8')) as string[];

const bestandSchreiben = (liste: string[]): void =>
  writeFileSync(VERZEICHNIS, JSON.stringify(liste, null, 1) + '\n', 'utf8');

/**
 * Schritt 2 — der Warnhinweis.
 *
 * Er muss in die ersten 1200 Zeichen, weil `pruefungen/lauf/test105.mts` nur
 * dort nachsieht. Steht ein Kopfkommentar da, wird er hinter dessen erste
 * Trennlinie gesetzt; sonst kommt ein eigener Block davor.
 */
const hinweisEinsetzen = (s: string, ts: string, js: string): string => {
  const kopf =
    ' * ERZEUGT — NICHT VON HAND ÄNDERN.\n' +
    ' * Die Quelle ist `' + ts + '`. `npm run bauen:ts` schreibt daraus\n' +
    ' * `' + js + '`. Wer das .js bearbeitet, verliert die Änderung beim\n' +
    ' * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.\n' +
    ' * ----------------------------------------------------------------------------\n';
  const m = /^( \* [^\n]*\n)( \* -{10,}\n)/m.exec(s);
  if (m && m.index < 400) {
    const bis = m.index + m[0].length;
    return s.slice(0, bis) + kopf + s.slice(bis);
  }
  return '/* ' + '='.repeat(76) + '\n' + kopf + ' * ' + '='.repeat(74) + '*/\n' + s;
};

/** Schritt 4 — `window.X = …` schreibt TypeScript nicht ohne Erlaubnis. */
const fensterUmschreiben = (s: string): string =>
  s.replace(/^window\.([\w$]+)(\s*=\s*)window\.\1(\s*\|\|)/gm,
            '(window as any).$1$2(window as any).$1$3')
   .replace(/^window\.([\w$]+)\s*=/gm, '(window as any).$1 =');

/**
 * Welche Namen legt diese Datei auf dem Fenster oder als Konstante an?
 *
 * Nicht mitgezählt werden **Sammelpunkte** — `(window as any).X =
 * (window as any).X || {}`. Wer das schreibt, legt den Namen nicht an,
 * sondern schliesst sich ihm an: `Register` gehört keiner der neun
 * Registerdateien. Striche man ihn beim Umzug der ersten aus
 * `src/global.d.ts`, kennten die anderen acht ihn nicht mehr.
 */
const namenIn = (s: string): string[] => {
  const raus = new Set<string>();
  const sammelpunkte = new Set<string>();
  for (const m of s.matchAll(/^\(window as any\)\.([\w$]+)\s*=\s*\(window as any\)\.\1\s*\|\|/gm))
    if (m[1]) sammelpunkte.add(m[1]);
  for (const m of s.matchAll(/^(?:const|let|var)\s+([A-Z][\w$]*)\s*=/gm))
    if (m[1]) raus.add(m[1]);
  for (const m of s.matchAll(/^\(window as any\)\.([\w$]+)\s*=/gm))
    if (m[1] && !sammelpunkte.has(m[1])) raus.add(m[1]);
  return [...raus];
};

/**
 * Schritt 6 — aus `src/global.d.ts` streichen.
 *
 * Der wichtigste Schritt und der, den man am leichtesten vergisst: bleibt die
 * Zeile `declare const Hinweis: any;` stehen, gewinnt sie gegen die echte
 * Deklaration. Die Datei ist dann TypeScript und wird trotzdem nicht geprüft.
 */
const ausGlobalStreichen = (namen: string[]): string[] => {
  let d = readFileSync(GLOBAL, 'utf8');
  const weg: string[] = [];
  for (const name of namen) {
    const vorlage = new RegExp(
      '(?:/\\*\\*[^\\n]*\\*/\\n)?declare const ' + roh(name) + ': any;\\n', 'g');
    if (vorlage.test(d)) { d = d.replace(vorlage, ''); weg.push(name); }
  }
  writeFileSync(GLOBAL, d, 'utf8');
  return weg;
};

const umzug = (js: string): { ts: string; namen: string[]; weg: string[]; rest: number } => {
  if (!js.startsWith('quell/') || !js.endsWith('.js'))
    throw new Error('Nur Dateien unter quell/ mit .js: ' + js);
  if (!existsSync(js)) throw new Error('Gibt es nicht: ' + js);

  const ts = 'src/' + js.slice('quell/'.length, -'.js'.length) + '.ts';
  mkdirSync(dirname(ts), { recursive: true });
  execFileSync('git', ['mv', js, ts], { stdio: 'inherit' });

  let s = readFileSync(ts, 'utf8');
  s = hinweisEinsetzen(s, ts, js);
  s = fensterUmschreiben(s);
  writeFileSync(ts, s, 'utf8');

  const namen = namenIn(s);
  const weg = ausGlobalStreichen(namen);

  const liste = bestand().filter(x => x !== js);
  bestandSchreiben(liste);
  return { ts, namen, weg, rest: liste.length };
};

/* ---------------------------------------------------------------------- */

const argumente = process.argv.slice(2);

if (!argumente.length || argumente.includes('--stand')) {
  const liste = bestand();
  const nach: Record<string, number> = {};
  for (const p of liste) {
    const wurzel = p.includes('/') ? p.slice(0, p.indexOf('/')) : '.';
    nach[wurzel] = (nach[wurzel] ?? 0) + 1;
  }
  console.log('Noch JavaScript: ' + liste.length);
  for (const [ordner, anzahl] of Object.entries(nach).sort((a, b) => b[1] - a[1]))
    console.log('  ' + ordner.padEnd(14) + String(anzahl).padStart(4));
  if (!argumente.length)
    console.log('\nAufruf: node umzug.mts <datei.js> [<datei.js> …]');
} else {
  for (const js of argumente) {
    const { ts, namen, weg, rest } = umzug(js);
    console.log(js.padEnd(46) + ' -> ' + ts.padEnd(46) +
                '  Verzeichnis: ' + rest);
    if (namen.length) console.log('   Namen: ' + namen.join(', '));
    if (weg.length) console.log('   aus global.d.ts: ' + weg.join(', '));
  }
  console.log('\nJetzt von Hand: Typen setzen, `npm run bauen:ts`, ' +
              'die Datei in tsconfig.bauen.json aufnehmen.');
}
