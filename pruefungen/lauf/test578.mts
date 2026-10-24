/* Suite 578 — Die React-Inseln: gebaut, eingepackt, nachgerechnet (E699)
 * ============================================================================
 * Redur, 27. September 2026: „du kannst react nutzen keien problem" — im
 * Fragebogen „Mit React (E80 aufheben)", und je Stück (§57): „React 19.3.0,
 * Touch Kit (dein UI-Kit), Glas-Code (ALEXalesha, MIT)".
 *
 * E80 hat den ersten React-Versuch (E78) mit einem Satz beendet: „Redur
 * braucht keine zweite Oberfläche." E699 hebt E80 auf, aber nicht diesen
 * Satz — er wird hier zu Regeln, die man prüfen kann. Diese Suite liest nur
 * Dateien und startet keinen Browser; was im Browser gilt, prüft `test579`.
 *
 *   §1  Die Bündel sind frisch: neu gebaut nach /tmp, Byte für Byte gleich,
 *       und zweimal gebaut zweimal dasselbe.
 *   §2  Sie sind klassische Skripte, die man roh in ein <script> setzen darf.
 *   §3  Fremdes ist, was es zu sein behauptet: React, das Touch Kit und der
 *       Glas-Code gegen `pruefungen/fremd-bestand.json`.
 *   §4  Der Start trägt sie nicht — und doch sind sie überall da: Marke in
 *       index.html, GRUNDSTOCK, Behälter in der Einzeldatei.
 *   §5  Beim Auswerten geschieht nichts (in einer Nachbildung ausgewertet).
 *   §6  Keine zweite Oberfläche: E80s Einwand als Regeln.
 *   §7  Die Pakete sind festgenagelt, `dependencies` bleibt leer.
 *   §8  Die Typen: Inseln und Kit prüfen sauber — und die Inseln selbst
 *       halten sogar Redions strenge Schalter.
 *   §9  Das Inselblatt: Namensraum, Glas mit Zwilling, kein `transition: all`.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Sie WAR es, vor dem Bau: rot eingecheckt (commit „test578 (rot)"), weil es
 * kein Bündel, keinen Bau und keine Einträge gab. Dazu hat jeder Abschnitt
 * seine Gegenprobe im Lauf selbst: ein verbogenes Byte, ein erfundenes
 * `</script>`, ein Bündel, das beim Laden etwas einhängt, ein Typfehler.
 *
 *   node pruefungen/lauf/test578.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { typescriptGlob } from '../ts-glob-pfad.mjs';

const WURZEL = path.resolve(import.meta.dirname, '../..');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const da = (rel: string): boolean => fs.existsSync(path.join(WURZEL, rel));
const lies = (rel: string): string => da(rel) ? fs.readFileSync(path.join(WURZEL, rel), 'utf8') : '';
const summe = (b: Buffer | string): string => crypto.createHash('sha256').update(b).digest('hex');
const liesJson = (rel: string): any => { try { return JSON.parse(lies(rel)); } catch { return null; } };

/* Die vier Ausgaben von `bauen-inseln.mts`. */
const AUSGABEN = ['quell/fremd/react/react.js', 'quell/fremd/react/LIZENZ.txt',
                  'quell/islands/islands.js', 'quell/islands/islands.css'];
const REACT = 'quell/fremd/react/react.js';
const INSELN = 'quell/islands/islands.js';
const STIL = 'quell/islands/islands.css';

/* ==========================================================================
 * §1 · Die Bündel sind frisch
 * --------------------------------------------------------------------------
 * DIESELBE FRAGE WIE `test105` FÜR `quell/**.js`: passt das Erzeugte zu
 * seiner Quelle? Ein Bündel ist unlesbar — niemand sieht im Diff, ob jemand
 * es von Hand geändert oder die Quelle geändert und den Bau vergessen hat.
 * Also wird neu gebaut und verglichen, Zeichen für Zeichen.
 * ======================================================================== */
console.log('\n§1 · Die Bündel sind frisch — neu gebaut und Byte für Byte verglichen');

p('Der Bau `bauen-inseln.mts` liegt in der Wurzel', da('bauen-inseln.mts'));
for (const a of AUSGABEN) p(a + ' ist da', da(a));

const bauen = (ziel: string): string | null => {
  try {
    execFileSync(process.execPath, [path.join(WURZEL, 'bauen-inseln.mts'), '--ziel', ziel],
                 { cwd: WURZEL, stdio: 'pipe' });
    return null;
  } catch (e: unknown) {
    const roh = String((e as { stderr?: Buffer }).stderr ?? (e instanceof Error ? e.message : e));
    return roh.split('\n').filter(z => /Error|Fehler|bauen-inseln/.test(z)).slice(0, 3).join(' | ') || roh.slice(0, 300);
  }
};
const tmp1 = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-inseln-a-'));
const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-inseln-b-'));
const fehler1 = da('bauen-inseln.mts') ? bauen(tmp1) : 'bauen-inseln.mts fehlt';
p('Der Bau läuft ohne Fehler durch', fehler1 === null, String(fehler1));
const fehler2 = fehler1 === null ? bauen(tmp2) : 'erster Bau gescheitert';
const frisch = (ziel: string, a: string): Buffer | null =>
  fs.existsSync(path.join(ziel, a)) ? fs.readFileSync(path.join(ziel, a)) : null;

const veraltet: string[] = [];
const wackelt: string[] = [];
for (const a of AUSGABEN) {
  const f1 = frisch(tmp1, a), f2 = frisch(tmp2, a);
  const drin = da(a) ? fs.readFileSync(path.join(WURZEL, a)) : null;
  if (!f1 || !drin || !f1.equals(drin)) veraltet.push(a);
  if (fehler2 === null && (!f1 || !f2 || summe(f1) !== summe(f2))) wackelt.push(a);
}
gleich('Kein Bündel weicht von seiner Quelle ab (sonst: `npm run bauen:ts` und mitcommitten)',
  veraltet, []);
p('Zweimal gebaut, zweimal dieselbe Prüfsumme', fehler2 === null && wackelt.length === 0,
  fehler2 ?? wackelt.join(', '));

/* Gegenprobe: ein einziges verändertes Byte muss auffallen — sonst misst der
   Vergleich oben nichts. */
{
  const f = frisch(tmp1, INSELN);
  const verbogen = f ? Buffer.from(f) : Buffer.from('x');
  verbogen[Math.floor(verbogen.length / 2)]! ^= 0x01;
  p('Gegenprobe: ein verbogenes Byte fällt auf', !f || !verbogen.equals(f));
}

/* Und die Liste der Ausgaben ist die, die test109 kennt. */
const buendel = liesJson('pruefungen/buendel-bestand.json');
gleich('pruefungen/buendel-bestand.json nennt genau diese vier Ausgaben',
  (buendel?.buendel ?? []).map((b: { pfad: string }) => b.pfad).sort(), [...AUSGABEN].sort());
p('… mit Bau und Wächter', buendel?.bau === 'bauen-inseln.mts' && buendel?.waechter === 'test578',
  JSON.stringify({ bau: buendel?.bau, waechter: buendel?.waechter }));
p('… und jede Quelle liegt da', (buendel?.buendel ?? []).every((b: { quelle: string }) => da(b.quelle)),
  (buendel?.buendel ?? []).filter((b: { quelle: string }) => !da(b.quelle)).map((b: { quelle: string }) => b.quelle).join(', '));

/* ==========================================================================
 * §2 · Klassische Skripte, die man roh einsetzen darf
 * --------------------------------------------------------------------------
 * `bauen.mts` setzt die Bytes ROH in die Einzeldatei. Ein `</script` darin
 * beendete den Behälter, ein `<!--` schaltet den Parser um. Ein `import`
 * wäre ein Modul, und Module laufen per Doppelklick nicht (§6).
 * ======================================================================== */
console.log('\n§2 · Klassische Skripte — ein Name, kein Modul, nichts, was die Einzeldatei bricht');

type Befund = string[];
const pruefeText = (text: string, istJs: boolean): Befund => {
  const raus: Befund = [];
  if (/<\/script/i.test(text)) raus.push('</script');
  if (/<!--/.test(text)) raus.push('<!--');
  if (/<\/style/i.test(text)) raus.push('</style');
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) raus.push('Steuerzeichen');
  if (/\r/.test(text)) raus.push('CR');
  if (!text.endsWith('\n')) raus.push('kein Zeilenende am Schluss');
  if (istJs) {
    if (/^\s*(import|export)\s/m.test(text)) raus.push('import/export');
    if (/\bimport\s*\(/.test(text)) raus.push('import()');
    if (/import\.meta/.test(text)) raus.push('import.meta');
    if (/\beval\s*\(/.test(text)) raus.push('eval');
    if (/new\s+Function\s*\(/.test(text)) raus.push('new Function');
    if (/process\.env/.test(text)) raus.push('process.env');
  }
  return raus;
};
for (const [datei, istJs] of [[REACT, true], [INSELN, true], [STIL, false]] as const) {
  const text = lies(datei);
  gleich(datei + ': nichts, was die Einzeldatei oder test87 bricht', pruefeText(text, istJs), []);
  const kopf = text.slice(0, 1600);
  p(datei + ': sagt oben, dass es erzeugt ist, und woraus',
    /ERZEUGT — NICHT VON HAND ÄNDERN/.test(kopf) && /bauen-inseln\.mts/.test(kopf) && /E699/.test(kopf));
}
const namenOben = (text: string): string[] =>
  [...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/^(?:var|let|const|function|class)\s+([A-Za-z_$][\w$]*)/gm)]
    .map(m => m[1] ?? '');
gleich('react.js legt genau einen Namen an: RedionReact', namenOben(lies(REACT)), ['RedionReact']);
gleich('islands.js legt genau einen Namen an: RedionIslands', namenOben(lies(INSELN)), ['RedionIslands']);
p('islands.js holt React von aussen und bringt es nicht selbst mit',
  /\}\)\(\{\},\s*RedionReact\.React\b/.test(lies(INSELN)) && !/react-dom-client|scheduler/.test(lies(INSELN)));
p('react.js enthält die Produktionsfassung, keine Entwicklungsfassung',
  /react-dom-client\.production\.js/.test(lies(REACT).slice(0, 2000)) && !/\.development\.js/.test(lies(REACT)));
p('react.js trägt den MIT-Text in sich — er reist mit in die Einzeldatei',
  /MIT License/.test(lies(REACT).slice(0, 3000)) && /Meta Platforms, Inc\. and affiliates/.test(lies(REACT).slice(0, 3000)));
gleich('Gegenprobe: ein erfundenes „</script>" wird gefunden',
  pruefeText('var a = "</script>";\n', true), ['</script']);
gleich('Gegenprobe: ein Modul wird gefunden', pruefeText('export const a = 1;\n', true), ['import/export']);

/* ==========================================================================
 * §3 · Fremdes ist, was es zu sein behauptet (§57)
 * ======================================================================== */
console.log('\n§3 · React, das Touch Kit und der Glas-Code gegen pruefungen/fremd-bestand.json');

const bestand = liesJson('pruefungen/fremd-bestand.json');
const eintrag = (pfad: string): any => (bestand?.eintraege ?? []).find((e: { pfad: string }) => e.pfad === pfad);

/* -- React ---------------------------------------------------------------- */
const re = eintrag(REACT);
p('React steht im Verzeichnis', !!re);
gleich('… als MIT', re?.lizenz, 'MIT');
gleich('… in genau diesen Fassungen', re?.fassung, 'react 19.3.0, react-dom 19.3.0, scheduler 0.28.0');
p('… mit Begründung und Redurs Satz', /keien problem/.test(String(re?.begruendung ?? '')));
const reactBytes = da(REACT) ? fs.readFileSync(path.join(WURZEL, REACT)) : Buffer.alloc(0);
gleich('react.js: so viele Bytes wie eingetragen', reactBytes.length, re?.datei?.bytes);
gleich('react.js: Prüfsumme stimmt', summe(reactBytes), re?.datei?.sha256);
p('Die Lizenzdatei liegt daneben und nennt alle drei Pakete',
  /===== react 19\.3\.0/.test(lies('quell/fremd/react/LIZENZ.txt')) &&
  /===== react-dom 19\.3\.0/.test(lies('quell/fremd/react/LIZENZ.txt')) &&
  /===== scheduler 0\.28\.0/.test(lies('quell/fremd/react/LIZENZ.txt')) &&
  /MIT License/.test(lies('quell/fremd/react/LIZENZ.txt')));
/* Die Quelldateien der Pakete — nur, wenn `npm install` gelaufen ist. Ohne
   node_modules ist §1 schon rot; hier soll nicht zweimal dasselbe fehlen. */
if (da('node_modules/react/package.json')) {
  const abw = (re?.enthaelt ?? []).filter((e: { datei: string; sha256: string }) => {
    const f = path.join(WURZEL, 'node_modules', e.datei);
    return !fs.existsSync(f) || summe(fs.readFileSync(f)) !== e.sha256;
  }).map((e: { datei: string }) => e.datei);
  p('Die fünf Dateien aus node_modules sind die eingetragenen (Prüfsumme je Datei)',
    (re?.enthaelt ?? []).length === 5 && abw.length === 0, abw.join(', ') || String((re?.enthaelt ?? []).length));
}

/* -- Touch Kit ------------------------------------------------------------ */
const kit = eintrag('fremd/touch');
const HERKUNFT = 'fremd/touch/HERKUNFT.txt';
p('Das Touch Kit steht im Verzeichnis, als Redurs eigener Code', !!kit && /eigener Code von Redur/.test(String(kit?.lizenz)));
const herkunft = lies(HERKUNFT);
gleich('HERKUNFT.txt: Prüfsumme wie eingetragen',
  summe(Buffer.from(herkunft, 'utf8')), kit?.enthaelt?.[0]?.sha256);
const commit = /^Commit:\s+([0-9a-f]{40})$/m.exec(herkunft)?.[1];
gleich('HERKUNFT.txt nennt den festgenagelten Commit', commit, kit?.fassung);
/* E710: neu geholt von d21c402 — Redurs neuester Stand mit strengen Typen,
   `data-ui-motion` und Hinweis/`buttonProps` an Dialog und Aktionsblatt. */
p('… und der ist d21c402 (E710)', String(commit).startsWith('d21c402'), String(commit));
const liste = [...herkunft.matchAll(/^([0-9a-f]{64}) {2}(.+)$/gm)].map(m => ({ sha: m[1] ?? '', datei: m[2] ?? '' }));
const kopfZahl = Number(/^Dateien:\s+(\d+)/m.exec(herkunft)?.[1] ?? -1);
p('HERKUNFT.txt listet jede Datei (Zahl im Kopf = Zeilen)', liste.length > 50 && liste.length === kopfZahl,
  `${liste.length} Zeilen, Kopf ${kopfZahl}`);
const vonHand = liste.filter(e => {
  const f = path.join(WURZEL, 'fremd/touch', e.datei);
  return !fs.existsSync(f) || summe(fs.readFileSync(f)) !== e.sha;
}).map(e => e.datei);
gleich('Keine Datei im Kit ist von Hand geändert („Nie im Kit-Ordner von Hand ändern")', vonHand, []);
const alleImKit = (ordner: string, raus: string[] = []): string[] => {
  if (!fs.existsSync(ordner)) return raus;
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    const v = path.join(ordner, e.name);
    if (e.isDirectory()) alleImKit(v, raus);
    else raus.push(path.relative(path.join(WURZEL, 'fremd/touch'), v).split(path.sep).join('/'));
  }
  return raus;
};
const REDION_EIGEN = ['HERKUNFT.txt', 'glass/LIZENZ-ALEXalesha.txt'];
const zuviel = alleImKit(path.join(WURZEL, 'fremd/touch'))
  .filter(d => !REDION_EIGEN.includes(d) && !liste.some(e => e.datei === d));
gleich('Keine Datei im Kit, die nicht aus dem Commit kommt', zuviel, []);
gleich('Keine Prüfläufe des Kits (Vitest) mitgekommen',
  alleImKit(path.join(WURZEL, 'fremd/touch')).filter(d => /\.test\.tsx?$|(^|\/)test\//.test(d)), []);
p('Der Holer liegt da und liest aus git, nicht aus dem Arbeitsbaum',
  /ls-tree/.test(lies('skripte/touch-holen.mts')) && /cat-file/.test(lies('skripte/touch-holen.mts')));
/* Gegenprobe: eine veränderte Zeile im Kit fällt auf. */
{
  const e = liste.find(x => x.datei === 'components/Button.tsx');
  const inhalt = e ? fs.readFileSync(path.join(WURZEL, 'fremd/touch', e.datei), 'utf8') : '';
  p('Gegenprobe: eine veränderte Zeile im Kit fällt auf',
    !!e && summe(inhalt + ' ') !== e.sha && summe(inhalt) === e.sha);
}

/* -- Glas-Code (ALEXalesha, MIT) ------------------------------------------ */
const glas = eintrag('fremd/touch/glass');
p('Der Glas-Code steht im Verzeichnis, als MIT von ALEXalesha',
  glas?.lizenz === 'MIT' && /ALEXalesha/.test(String(glas?.paket)));
for (const d of ['field.ts', 'filter.ts', 'LIZENZ-ALEXalesha.txt']) {
  const soll = (glas?.enthaelt ?? []).find((e: { datei: string }) => e.datei === d);
  const f = 'fremd/touch/glass/' + d;
  gleich('glass/' + d + ': Prüfsumme wie eingetragen', da(f) ? summe(fs.readFileSync(path.join(WURZEL, f))) : '(fehlt)', soll?.sha256);
}
p('Der Lizenztext ist MIT und nennt ALEXalesha',
  /MIT License/.test(lies('fremd/touch/glass/LIZENZ-ALEXalesha.txt')) &&
  /Copyright \(c\) 2026 ALEXalesha/.test(lies('fremd/touch/glass/LIZENZ-ALEXalesha.txt')));
p('Beide Glas-Dateien nennen ihre Herkunft im Kopf',
  ['field.ts', 'filter.ts'].every(d => /ALEXalesha\/LiquidGlass/.test(lies('fremd/touch/glass/' + d).slice(0, 600))));

/* ==========================================================================
 * §4 · Der Start trägt sie nicht — und doch sind sie überall da
 * --------------------------------------------------------------------------
 * `test388` §5 misst die Decke (2850 KB, E688). React liegt mit 69 KB fast
 * auf der ganzen Luft darunter. Deshalb: nichts davon als <script src> oder
 * <link> in index.html — dafür eine Marke, der GRUNDSTOCK und die Behälter.
 * ======================================================================== */
console.log('\n§4 · Nicht im Startweg, aber im Grundstock und in der Einzeldatei');

const html = lies('index.html');
p('index.html lädt den Lader — und zwar klassisch, mit defer',
  html.includes('<script src="quell/schale/inseln/laden.js" defer></script>'));
p('… aber weder React noch die Inseln noch ihr Stil stehen im Startweg',
  !/<script[^>]+(fremd\/react|islands\/islands)/.test(html) && !/<link[^>]+islands\.css/.test(html));
p('Die Marke „inseln-daten" steht in index.html', /<!-- inseln-daten:[\s\S]*?-->/.test(html));
p('… vor dem Lader, der sie liest',
  html.indexOf('<!-- inseln-daten:') >= 0 &&
  html.indexOf('<!-- inseln-daten:') < html.indexOf('quell/schale/inseln/laden.js" defer'));
p('`bauen.mts` bricht ab, wenn die Marke fehlt',
  /die Marke „inseln-daten" fehlt/.test(lies('bauen.mts')));
p('`bauen.mts` bricht ab, wenn ein Bündel „</script" oder „<!--" enthält',
  /<\\\/script\|<!--/.test(lies('bauen.mts')));
const swTs = lies('src/dienst/sw.ts'), swJs = lies('sw.js');
const GRUNDSTOCK = ['quell/schale/inseln/laden.js', REACT, INSELN, STIL];
gleich('Alle vier stehen im GRUNDSTOCK von sw.ts — offline da (§28)',
  GRUNDSTOCK.filter(g => !swTs.includes("'./" + g + "'")), []);
gleich('… und im gebauten sw.js', GRUNDSTOCK.filter(g => !swJs.includes("'./" + g + "'")), []);
const einzel = lies('redion-einzeldatei.html');
const behaelter = (id: string): string | null => {
  const m = new RegExp('<script type="text/plain" id="' + id + '">\\n/\\* ===== ([^ ]+) ===== \\*/\\n([\\s\\S]*?)\\n</script>').exec(einzel);
  return m ? (m[2] ?? '') : null;
};
for (const [id, datei] of [['inseln-react', REACT], ['inseln-js', INSELN], ['inseln-stil', STIL]] as const) {
  const b = behaelter(id);
  p(`Die Einzeldatei trägt ${datei} als Behälter „${id}" (text/plain, wird nicht ausgewertet)`, b !== null);
  p(`… Byte für Byte die Datei aus quell/`, b !== null && b === lies(datei),
    b === null ? 'fehlt' : `${b.length} gegen ${lies(datei).length} Zeichen`);
}
p('Die Einzeldatei verweist auf keine Datei daneben', !/<script src="quell\//.test(einzel));
p('… und hat kein type="module"', !/<script[^>]*type="module"/.test(einzel));

/* ==========================================================================
 * §5 · Beim Auswerten geschieht nichts
 * --------------------------------------------------------------------------
 * VORWÄRMEN DARF DIE SEITE NICHT ÄNDERN. Und die Einzeldatei wertet die
 * Bündel an einer anderen Stelle aus als der Ordner (§7: keine zweite
 * Startlogik). Also darf `islands.js` beim Auswerten nichts tun: kein
 * Element, kein Beobachter, kein Zuhörer, kein Zeitgeber.
 *
 * Geprüft in einer NACHBILDUNG: `document` und `window` schreiben jeden
 * Griff mit. React selbst darf beim Auswerten lesen (es prüft, ob es ein
 * DOM gibt) — die Inseln danach dürfen GAR NICHTS.
 * ======================================================================== */
console.log('\n§5 · Beim Auswerten geschieht nichts');

const nachbildung = () => {
  const griffe: string[] = [];
  const knoten = (name: string): any => new Proxy({}, {
    get: (_z, k) => {
      if (k === Symbol.toPrimitive) return () => name;
      if (typeof k === 'string' && /^(append|appendChild|insertBefore|prepend|setAttribute|removeAttribute|addEventListener|remove|replaceChildren|attachShadow)$/.test(k))
        return () => { griffe.push(name + '.' + k); };
      if (k === 'style' || k === 'dataset' || k === 'classList') return knoten(name + '.' + String(k));
      return undefined;
    },
    set: (_z, k) => { griffe.push(name + '.' + String(k) + '='); return true; }
  });
  const document = {
    createElement: (t: string) => knoten('<' + t + '>'),
    documentElement: knoten('html'), body: knoten('body'), head: knoten('head'),
    addEventListener: () => { griffe.push('document.addEventListener'); },
    querySelector: () => { griffe.push('document.querySelector'); return null; },
    getElementById: () => { griffe.push('document.getElementById'); return null; },
  };
  const kontext: Record<string, unknown> = {
    document, navigator: { userAgent: 'Nachbildung' }, console,
    MessageChannel: class { port1 = {} as any; port2 = { postMessage: () => { griffe.push('port.postMessage'); } }; },
    setTimeout: () => { griffe.push('setTimeout'); return 0; },
    setInterval: () => { griffe.push('setInterval'); return 0; },
    requestAnimationFrame: () => { griffe.push('requestAnimationFrame'); return 0; },
    queueMicrotask: () => { griffe.push('queueMicrotask'); },
    MutationObserver: class { constructor() { griffe.push('new MutationObserver'); } },
    matchMedia: () => { griffe.push('matchMedia'); return { matches: false, addEventListener: () => {} }; },
    /* React DOM prüft beim Laden, ob der Browser „passive" Zuhörer kennt:
       es meldet einen Zuhörer an und SOFORT wieder ab. Das ist erlaubt —
       gezählt wird, was danach noch angemeldet ist. */
    addEventListener: (art: string) => { griffe.push('window.addEventListener(' + art + ')'); },
    removeEventListener: (art: string) => {
      const i = griffe.lastIndexOf('window.addEventListener(' + art + ')');
      if (i >= 0) griffe.splice(i, 1); else griffe.push('window.removeEventListener(' + art + ')');
    },
    localStorage: new Proxy({}, { get: () => { griffe.push('localStorage'); return () => null; } }),
    indexedDB: new Proxy({}, { get: () => { griffe.push('indexedDB'); return () => null; } }),
  };
  kontext['window'] = kontext; kontext['self'] = kontext; kontext['globalThis'] = kontext;
  return { kontext: vm.createContext(kontext), griffe };
};

let api: any = null;
{
  const { kontext, griffe } = nachbildung();
  let fehler: string | null = null;
  try { vm.runInContext(lies(REACT), kontext, { filename: REACT }); }
  catch (e: unknown) { fehler = 'react.js: ' + (e instanceof Error ? e.message : String(e)); }
  const vorher = griffe.length;
  const reactGriffe = griffe.filter(g => !/^<div>\./.test(g));   /* ein losgelöstes div zum Nachsehen ist erlaubt */
  try { if (!fehler) vm.runInContext(lies(INSELN), kontext, { filename: INSELN }); }
  catch (e: unknown) { fehler = 'islands.js: ' + (e instanceof Error ? e.message : String(e)); }
  p('Beide Bündel lassen sich auswerten', fehler === null, String(fehler));
  gleich('react.js hängt beim Auswerten nichts ein und meldet nichts an', reactGriffe, []);
  gleich('islands.js tut beim Auswerten GAR NICHTS (kein Element, kein Beobachter, kein Zeitgeber)',
    griffe.slice(vorher), []);
  const rr: any = (kontext as any).RedionReact;
  gleich('RedionReact trägt genau React, ReactDOM, ReactDOMClient, ReactJsxRuntime',
    Object.keys(rr ?? {}).sort(), ['React', 'ReactDOM', 'ReactDOMClient', 'ReactJsxRuntime']);
  p('… und createRoot ist darin', typeof rr?.ReactDOMClient?.createRoot === 'function');
  api = (kontext as any).RedionIslands;
  gleich('RedionIslands trägt genau version, mount, update, unmount',
    Object.keys(api ?? {}).sort(), ['mount', 'unmount', 'update', 'version']);
  p('… drei Funktionen und eine Fassung',
    ['mount', 'update', 'unmount'].every(k => typeof api?.[k] === 'function') && typeof api?.version === 'string');
}
{
  /* Gegenprobe: ein Bündel, das beim Laden etwas einhängt, MUSS auffallen. */
  const { kontext, griffe } = nachbildung();
  vm.runInContext('var RedionIslands=(function(){var d=document.createElement("div");' +
    'document.body.appendChild(d);new MutationObserver(function(){});return {};})();', kontext);
  p('Gegenprobe: ein Bündel, das beim Laden einhängt und beobachtet, fällt auf',
    griffe.includes('body.appendChild') && griffe.includes('new MutationObserver'), griffe.join(', '));
}
/* Und die Namen stimmen mit dem, was die Schale getypt erwartet. */
{
  const dts = lies('src/global.d.ts');
  const schnitt = /interface RedionIslandsApi \{([\s\S]*?)\n\}/.exec(dts)?.[1] ?? '';
  const namen = [...schnitt.matchAll(/^\s*(?:readonly\s+)?([a-z]\w*)\s*[(:]/gm)].map(m => m[1]).sort();
  gleich('src/global.d.ts beschreibt RedionIslandsApi mit denselben vier Namen', namen,
    ['mount', 'unmount', 'update', 'version']);
}

/* ==========================================================================
 * §6 · Keine zweite Oberfläche — E80s Einwand als Regeln
 * --------------------------------------------------------------------------
 * E78 baute `app.html`, einen Router, eine eigene Schale mit eigenem
 * Datenweg. Redur: „Nein, ich brauche keine neue Shell?" (E80). Was das
 * heute heisst, steht in E699 als fünf Regeln; hier ist jede eine Zeile.
 * ======================================================================== */
console.log('\n§6 · Keine zweite Oberfläche (E80, als Regeln aus E699)');

/* Regel 1 — ein Einstieg. */
const skripte = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1] ?? '');
p('Regel 1: quell/start.js ist das letzte Skript und steht genau einmal da',
  skripte[skripte.length - 1] === 'quell/start.js' && skripte.filter(s => s === 'quell/start.js').length === 1,
  String(skripte[skripte.length - 1]));
gleich('… und es gibt keinen zweiten Einstieg (main.js, app.js unter quell/ als Start)',
  skripte.filter(s => /(^|\/)main\.js$/.test(s) || s === 'quell/app.js'), []);
p('… und keine Datei der Inseln ruft App.start oder hängt beim Laden etwas ein',
  !/App\.start|RedionMotion\.start/.test(lies('src/schale/inseln/laden.ts') + lies('src/islands/main.tsx')));

/* Regel 2 — keine neue HTML-Seite. */
const htmlDateien = (ordner: string, raus: string[] = []): string[] => {
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'bilder', 'entwicklung'].includes(e.name)) continue;
    const v = path.join(ordner, e.name);
    if (e.isDirectory()) htmlDateien(v, raus);
    else if (e.name.endsWith('.html')) raus.push(path.relative(WURZEL, v).split(path.sep).join('/'));
  }
  return raus;
};
const seiten = htmlDateien(WURZEL);
gleich('Regel 2: keine HTML-Seite ausser index.html lädt die Inseln oder React',
  seiten.filter(s => s !== 'index.html' && s !== 'redion-einzeldatei.html' &&
    /inseln\/laden\.js|islands\.js|fremd\/react/.test(lies(s))), []);
gleich('… keine Seite ist ein Modul (type="module" liefe per Doppelklick nicht)',
  seiten.filter(s => /<script[^>]*type="module"/.test(lies(s))), []);
p('… und es gibt keine app.html wie bei E78', !da('app.html') && !da('src/app'));

/* Regel 3 — kein Router, keine eigene Schale. */
/* Auch Unterordner (Durchsicht von E699): ab Stufe 1b bekommt eine Insel
   vielleicht ihren eigenen Ordner, und eine Regel, die nur die oberste Ebene
   liest, wäre dort blind. */
const inselDateien = (ordner: string, raus: string[] = []): string[] => {
  if (!fs.existsSync(ordner)) return raus;
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    const v = path.join(ordner, e.name);
    if (e.isDirectory()) inselDateien(v, raus);
    else if (/\.(tsx?|css)$/.test(e.name)) raus.push(path.relative(WURZEL, v).split(path.sep).join('/'));
  }
  return raus;
};
const inselQuellen = inselDateien(path.join(WURZEL, 'src/islands')).sort();
p('Es gibt Inselquellen zu lesen', inselQuellen.length >= 4, inselQuellen.join(', '));
/* Kommentare weg — sie ERKLÄREN die Regeln und nennen dabei die Namen. */
const code = (rel: string): string => lies(rel).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const ROUTER = /pushState|replaceState|popstate|hashchange|location\.hash\s*=|react-router|createBrowserRouter/;
gleich('Regel 3: kein Router, kein Verlauf, keine Adresse — die Schale navigiert',
  inselQuellen.filter(q => ROUTER.test(code(q))), []);

/* Regel 4 — Inseln sind NUR Ansicht. */
const DATEN = /\bStore\b|indexedDB|IDBDatabase|localStorage|sessionStorage|\bfetch\s*\(|XMLHttpRequest|dangerouslySetInnerHTML|innerHTML|\bRegister\b|\bApp\.|\bDatenbank\b|\bBibliothek\b|\beval\s*\(|new\s+Function/;
gleich('Regel 4: keine Insel liest oder schreibt Daten — kein Store, keine IndexedDB, kein localStorage, kein innerHTML',
  inselQuellen.filter(q => DATEN.test(code(q))), []);
p('Gegenprobe: eine Insel mit `Store.addPage` würde gefunden', DATEN.test('const s = Store.addPage(null, {});'));

/* REGEL 3 UND 4 AUCH IM GEBAUTEN BÜNDEL (Durchsicht von E699). Die Zeilen
   darüber lesen `src/islands/` — ins Bündel kommt aber auch Code des Kits
   (Stufe 1a: Button, Toggle, Glyph, usePress; ab 1b mehr), und den liest
   dort niemand. Was die Regeln verbieten, darf deshalb auch in
   `islands.js` nicht stehen, egal aus welcher Datei es kam. React selbst
   liegt in `react.js` und ist ausgenommen: es setzt intern `innerHTML`
   (SVG, `dangerouslySetInnerHTML`) — das ist sein Werkzeug, nicht der
   Datenweg einer Insel. */
const IM_BUENDEL = /\b(pushState|replaceState)\s*\(|["'`](popstate|hashchange)["'`]|\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bIDBDatabase\b|\.innerHTML\s*=|dangerouslySetInnerHTML|\bfetch\s*\(|XMLHttpRequest|\beval\s*\(|new\s+Function\s*\(/;
const inselBuendel = lies(INSELN);
p('… und auch im gebauten Bündel nicht (islands.js, samt dem Code des Kits darin)',
  inselBuendel.length > 0 && !IM_BUENDEL.test(inselBuendel),
  String(IM_BUENDEL.exec(inselBuendel)?.[0] ?? (inselBuendel ? '' : 'islands.js fehlt')));
p('Gegenprobe: ein Kit-Bauteil mit `history.pushState(…)` im Bündel würde gefunden',
  IM_BUENDEL.test(inselBuendel + ';history.pushState(null,"",e)') &&
  IM_BUENDEL.test(inselBuendel + ';window.localStorage.getItem("x")'));

/* Regel 5 — an Ort und Stelle. Stufe 1a hatte nur die Probe; Stufe 1b
   (E710) bringt GENAU die Dialoge dazu, und sie hängen an GENAU EINER
   Stelle der Schale: `dialog.ts`, dort, wo die Fragen schon immer gestellt
   wurden. Eine dritte Insel oder eine zweite Stelle macht das hier rot —
   sie kommt mit ihrem eigenen Bogen und ihrer eigenen Zeile. */
const katalog = /const catalog\b[\s\S]*?=\s*\{([\s\S]*?)\n\}/.exec(code('src/islands/main.tsx'))?.[1] ?? '';
gleich('Regel 5: der Katalog hat genau die Probe (test579) und die Dialoge (E710)',
  [...katalog.matchAll(/^\s*([a-z][\w-]*)\s*:/gm)].map(m => m[1]), ['probe', 'dialog']);
const srcDateien = (ordner: string, raus: string[] = []): string[] => {
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    const v = path.join(ordner, e.name);
    if (e.isDirectory()) { if (e.name !== 'islands') srcDateien(v, raus); }
    else if (/\.ts$/.test(e.name) && !e.name.endsWith('.d.ts')) raus.push(path.relative(WURZEL, v).split(path.sep).join('/'));
  }
  return raus;
};
gleich('… und genau eine Stelle der App hängt eine Insel ein: die Fragen in dialog.ts (E710)',
  srcDateien(path.join(WURZEL, 'src')).filter(f => /\.mount\s*\(/.test(code(f)) && /Inseln|RedionIslands/.test(code(f))),
  ['src/schale/ueberlagerung/dialog.ts']);
p('… mit dem Namen „dialog" und an einem Träger, den Fokus und Escape kennen (data-insel-traeger)',
  /\.mount\(\s*o\s*,\s*'dialog'/.test(code('src/schale/ueberlagerung/dialog.ts')) &&
  /data-insel-traeger/.test(code('src/schale/ueberlagerung/fokus.ts')) &&
  /data-insel-traeger/.test(code('src/schale/aufbau/schale.ts')));
p('… und das bisherige Fenster bleibt als Rückweg da (frageAlt, wahlAlt, mehrzeiligAlt — §43)',
  ['frageAlt', 'wahlAlt', 'mehrzeiligAlt'].every(n => new RegExp('const ' + n + '\\b').test(code('src/schale/ueberlagerung/dialog.ts'))));

/* ==========================================================================
 * §7 · Die Pakete sind festgenagelt
 * ======================================================================== */
console.log('\n§7 · Festgenagelt — und `dependencies` bleibt leer');

const paket = liesJson('package.json') ?? {};
const SOLL: Record<string, string> = {
  vite: '8.3.1', react: '19.3.0', 'react-dom': '19.3.0', '@types/react': '19.3.0', '@types/react-dom': '19.3.0' };
for (const [name, fassung] of Object.entries(SOLL))
  gleich(`devDependencies: ${name} genau ${fassung} (ohne ^)`, paket.devDependencies?.[name], fassung);
gleich('`dependencies` ist leer — React kommt eingepackt, nicht als Laufzeitpaket (E699)',
  Object.keys(paket.dependencies ?? {}), []);
p('Kein @vitejs/plugin-react — nicht nötig, gemessen', !paket.devDependencies?.['@vitejs/plugin-react']);
const sperre = liesJson('package-lock.json');
const imLock = (n: string): string | undefined => sperre?.packages?.['node_modules/' + n]?.version;
gleich('package-lock.json sagt dasselbe',
  ['vite', 'react', 'react-dom', 'scheduler', '@types/react', '@types/react-dom'].map(imLock),
  ['8.3.1', '19.3.0', '19.3.0', '0.28.0', '19.3.0', '19.3.0']);
p('`npm run bauen:inseln` gibt es', paket.scripts?.['bauen:inseln'] === 'node bauen-inseln.mts');
p('`npm run bauen:ts` baut die Inseln ZUERST — dann rechnet dienststand die frischen Bytes',
  String(paket.scripts?.['bauen:ts'] ?? '').startsWith('node bauen-inseln.mts && tsc -p tsconfig.bauen.json && node dienststand.mts'));
p('`npm run typecheck` prüft die Inseln mit', /tsc -p tsconfig\.islands\.json/.test(String(paket.scripts?.typecheck ?? '')));

/* ==========================================================================
 * §8 · Die Typen
 * --------------------------------------------------------------------------
 * `tsconfig.islands.json` trägt die Schalter des Kits, weil das Kit unter
 * Redions Schaltern 73 Fehler hat und nicht von Hand geändert werden darf
 * (LUECKEN, E699). DIE INSELN SELBST sollen aber Redions Mass halten: mit
 * den strengen Schaltern darf kein einziger Fehler in `src/islands/` stehen.
 * ======================================================================== */
console.log('\n§8 · Die Typen — Kit mit seinen Schaltern, die Inseln mit Redions');

const TSC = path.join(WURZEL, 'node_modules', 'typescript', 'bin', 'tsc');
const tsc = (projekt: string): string => {
  try { execFileSync(process.execPath, [TSC, '-p', projekt], { cwd: WURZEL, stdio: 'pipe' }); return ''; }
  catch (e: unknown) { return String((e as { stdout?: Buffer }).stdout ?? e); }
};
const islandsConf = lies('tsconfig.islands.json');
p('tsconfig.islands.json nimmt src/islands und das Kit, mit JSX',
  /src\/islands\/\*\*\/\*\.tsx/.test(islandsConf) && /fremd\/touch\/\*\*\/\*\.tsx/.test(islandsConf) &&
  /"jsx"\s*:\s*"react-jsx"/.test(islandsConf));
const fehlerKit = da('tsconfig.islands.json') ? tsc('tsconfig.islands.json') : 'tsconfig.islands.json fehlt';
p('tsc -p tsconfig.islands.json: sauber', fehlerKit === '',
  fehlerKit.split('\n').filter(z => /error TS/.test(z)).slice(0, 3).join(' | ') || fehlerKit.slice(0, 200));
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-inseln-typ-'));
  const streng = path.join(tmp, 'streng.json');
  fs.writeFileSync(streng, JSON.stringify({
    extends: path.join(WURZEL, 'tsconfig.islands.json'),
    compilerOptions: { noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true,
                       useUnknownInCatchVariables: true, noImplicitReturns: true },
    /* Auf Windows liefert path.join C:\\...\\**\\*.tsx – der tsc-Glob
       erkennt das dort nicht (TS18003). Immer / im JSON-Glob benutzen. */
    include: [
      typescriptGlob(WURZEL, 'src/islands', 'tsx'),
      typescriptGlob(WURZEL, 'fremd/touch', 'ts'),
      typescriptGlob(WURZEL, 'fremd/touch', 'tsx')
    ]
  }));
  const aus = da('tsconfig.islands.json') ? tsc(streng) : '';
  const zeilen = aus.split('\n').filter(z => /error TS/.test(z));
  const inInseln = zeilen.filter(z => /src[\\/]islands/.test(z));
  gleich('Mit Redions strengen Schaltern (§52.6): kein Fehler in src/islands', inInseln.slice(0, 3), []);
  /* SEIT E710 AUCH IM KIT (L222 Punkt 1). UI-Kit hat den strengen Durchgang
     gemacht (0d6222b), und d21c402 ist unter Redions Schaltern sauber —
     also steht die Ausnahme von §52.6 nicht mehr in tsconfig.islands.json:
     die Datei trägt die Schalter selbst, und ein Kit-Stand, der sie bricht,
     macht `npm run typecheck` rot, nicht nur diese Zeile. */
  gleich('… und auch im Kit kein einziger (L222 Punkt 1, seit d21c402)', zeilen.slice(0, 3), []);
  const schalter = liesJson('tsconfig.islands.json')?.compilerOptions ?? {};
  gleich('tsconfig.islands.json trägt Redions strenge Schalter selbst (§52.6, E710)',
    ['noUncheckedIndexedAccess', 'exactOptionalPropertyTypes', 'useUnknownInCatchVariables',
     'noImplicitReturns', 'verbatimModuleSyntax'].filter(k => schalter[k] !== true), []);
  /* Gegenprobe: ein Typfehler unter den Inseln-Schaltern wird gemeldet. */
  fs.writeFileSync(path.join(tmp, 'kaputt.tsx'), 'const x: number = "nein"\nexport const y = <b>{x}</b>\n');
  const gegen = path.join(tmp, 'gegen.json');
  fs.writeFileSync(gegen, JSON.stringify({ extends: path.join(WURZEL, 'tsconfig.islands.json'),
    include: [path.join(tmp, 'kaputt.tsx')],
    compilerOptions: { typeRoots: [path.join(WURZEL, 'node_modules/@types')], types: ['react'] } }));
  p('Gegenprobe: ein Typfehler in einer .tsx wird gemeldet', /error TS2322/.test(tsc(gegen)));
  fs.rmSync(tmp, { recursive: true, force: true });
}

/* ==========================================================================
 * §9 · Das Inselblatt
 * ======================================================================== */
console.log('\n§9 · Das Inselblatt: eigener Namensraum, Glas mit Zwilling, kein `transition: all`');

const css = lies(STIL).replace(/\/\*[\s\S]*?\*\//g, '');
const klassen = [...new Set([...css.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map(m => m[1] ?? ''))]
  .filter(k => !/^\d/.test(k));
gleich('Jede Klasse im Inselblatt gehört dem Kit (`ui-touch-…`) — keine der Schale, keine allgemeine',
  klassen.filter(k => !k.startsWith('ui-touch-')), []);
p('Keine Regel an einem nackten Element (button, input, body …) ausserhalb der Brücke',
  !/(^|[},])\s*(button|input|a|p|div|span|body|html)\s*[{,:]/.test(css.replace(/html(:root|\[data-ui-theme[^\]]*\])/g, '')));
p('Kein `transition: all` (UI-Kit CLAUDE.md, §39)', !/transition\s*:\s*all\b/.test(css));
/* E695: Glas nur mit beiden Schreibweisen. lightningcss fasst bei der
   Folge „backdrop-filter; -webkit-backdrop-filter" beide zu EINER
   (-webkit-) zusammen — Chrome hätte dort kein Glas. Das Kit schreibt die
   Folge so bei c192821; die Verbesserung gehört nach UI-Kit (upstream).
   Bis dahin steht die eine Regel hier mit Namen — die Liste darf nur
   schrumpfen, und in Stufe 1a benutzt keine Insel sie. */
const OHNE_ZWILLING_BEKANNT = ['.ui-touch-button--glass'];
const bloecke = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: (m[1] ?? '').trim(), rumpf: m[2] ?? '' }));
const mitBeiden = (rumpf: string): boolean =>
  /-webkit-backdrop-filter/.test(rumpf) && /(^|[;{\s])backdrop-filter/.test(rumpf);
/* ÜBERSCHRIEBEN ZÄHLT (E710). Das Kit schreibt die Glas-Folge beim Dialog
   und beim Aktionsblatt verkehrt (L222 Punkt 3); lightningcss lässt davon
   nur die Zeile mit Präfix übrig. Die Brücke setzt für genau diese Flächen
   Redions EINES Glas neu — beide Schreibweisen, `-webkit-` zuerst. Ein
   Block ohne Zwilling ist darum nur dann ein Fehler, wenn KEIN späterer
   Block für denselben Wähler beide setzt: dann hätte Chrome dort wirklich
   kein Glas. Die Gegenprobe darunter zeigt, dass ohne die Brücke genau
   diese zwei Flächen rot würden. */
const ueberschrieben = (i: number, sel: string): boolean =>
  bloecke.slice(i + 1).some(b => b.sel.split(',').map(x => x.trim()).includes(sel) && mitBeiden(b.rumpf));
const ohneZwillingRoh = bloecke
  .map((b, i) => ({ ...b, i }))
  .filter(b => /-webkit-backdrop-filter/.test(b.rumpf) !== /(^|[;{\s])backdrop-filter/.test(b.rumpf));
const ohneZwilling = ohneZwillingRoh.filter(b => !ueberschrieben(b.i, b.sel)).map(b => b.sel);
gleich('Gegenprobe: ohne die Überschreibung der Brücke fehlte Dialog und Aktionsblatt der Zwilling',
  ohneZwillingRoh.map(b => b.sel).filter(s => /dialog|action-sheet/.test(s)).sort(),
  ['.ui-touch-action-sheet-group', '.ui-touch-dialog']);
gleich('Glas: jede Unschärfe mit ihrem Zwilling (E695) — ausser den benannten, die nur schrumpfen dürfen',
  ohneZwilling.filter(s => !OHNE_ZWILLING_BEKANNT.includes(s)), []);
p('… und die benannte Ausnahme gibt es wirklich noch (sonst ist sie zu streichen)',
  OHNE_ZWILLING_BEKANNT.every(s => ohneZwilling.includes(s)), ohneZwilling.join(', '));
p('Die Brücke steht im Blatt: Kit-Farbe → Redions Marke',
  /--ui-color-accent:var\(--accent\)/.test(css) && /--ui-color-label:var\(--text\)/.test(css) &&
  /--ui-font-sans:var\(--font\)/.test(css) && /--ui-radius-sheet:var\(--sheet-radius\)/.test(css) &&
  /--ui-z-overlay:700/.test(css));
p('… und `color-scheme` bleibt am Wurzelelement, wie es war',
  /html\[data-ui-theme\]\{color-scheme:normal/.test(css));

fs.rmSync(tmp1, { recursive: true, force: true });
fs.rmSync(tmp2, { recursive: true, force: true });
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
