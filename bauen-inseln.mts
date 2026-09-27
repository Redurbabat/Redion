/* ============================================================================
 * bauen-inseln.mts — baut React und die Inseln zu klassischen Skripten (E699)
 * ----------------------------------------------------------------------------
 *     node bauen-inseln.mts                  schreibt nach quell/
 *     node bauen-inseln.mts --ziel <Ordner>  schreibt dieselben Pfade dorthin
 *                                            (test578 baut so nach /tmp und
 *                                            vergleicht Byte für Byte)
 *
 * Läuft als erster Schritt von `npm run bauen:ts`, damit `dienststand.mts`
 * danach die frischen Bytes in den Stempel rechnet (§28, E361).
 *
 * WAS HERAUSKOMMT — vier Dateien, alle mitversioniert, alle Ausgabe:
 *
 *     quell/fremd/react/react.js      React 19.3.0 + React DOM + scheduler,
 *                                     EIN globaler Name: `RedionReact`
 *     quell/fremd/react/LIZENZ.txt    der MIT-Text der drei Pakete
 *     quell/islands/islands.js        die Inseln + was sie vom Touch Kit
 *                                     brauchen, EIN globaler Name:
 *                                     `RedionIslands`; React von aussen
 *     quell/islands/islands.css       das Kit-CSS dieser Bauteile + Brücke
 *
 * WARUM SO, UND NICHT ANDERS (gemessen, E699):
 *
 *   KLASSISCH, KEIN MODUL. `<script type="module">` und Import-Maps
 *   scheitern unter `file://` (gemessen in Chromium 1194: „Access to script
 *   … blocked", net::ERR_FAILED). Redion MUSS per Doppelklick starten (§6).
 *   Also IIFE: ein Skript, das einen Namen anlegt und sonst nichts tut.
 *
 *   ZWEI DATEIEN, NICHT EINE. React ist fremder Code mit Prüfsumme in
 *   `pruefungen/fremd-bestand.json` (§57), die Inseln sind Redions Code. In
 *   einer Datei wäre beides gemischt und keins davon nachrechenbar — dieselbe
 *   Trennung wie `pdfjs/daten.js` (Bytes) und `pdfjs/laden.js` (Redion).
 *
 *   BAUTEILE EINZELN IMPORTIERT, nicht über `fremd/touch/index.ts`: dann
 *   nimmt der Bündler nur deren CSS mit. Gemessen mit fünf Bauteilen:
 *   33 statt 128 KB CSS.
 *
 *   KEIN `@vitejs/plugin-react`. Vite 8 übersetzt TSX mit Oxc selbst; die
 *   Ausgabe war mit und ohne das Paket Byte für Byte gleich.
 *
 *   GLEICHE QUELLE, GLEICHE BYTES. Kein Zeitstempel, keine Quellkarte, keine
 *   absoluten Pfade. Zweimal bauen gibt dieselbe Prüfsumme — sonst wäre der
 *   Vergleich in `test578` ein Würfel.
 *
 * WAS DER BAU VERWEIGERT (und nicht still repariert): ein `</script`, `<!--`
 * oder `</style` in der Ausgabe (die Einzeldatei setzt die Bytes roh in ein
 * `<script>`), rohe Steuerzeichen (test87), `import`/`export`, `import(`,
 * `import.meta`, `eval`, `new Function`, `process.env` — und React in der
 * Entwicklungsfassung.
 * ==========================================================================*/
import { build, type Rolldown } from 'vite';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const WURZEL = import.meta.dirname;

const zielArg = process.argv.indexOf('--ziel');
const ZIEL = zielArg >= 0 && process.argv[zielArg + 1]
  ? resolve(process.argv[zielArg + 1] as string)
  : WURZEL;

const paket = (name: string): { version: string } =>
  JSON.parse(readFileSync(join(WURZEL, 'node_modules', name, 'package.json'), 'utf8'));

/* Die Fassungen stehen in package.json FEST (ohne ^). Hier werden sie aus
   node_modules gelesen und gegen die Erwartung gehalten — ein `npm install`,
   das eine andere Fassung holt, bricht den Bau, statt still andere Bytes zu
   erzeugen. */
const FASSUNG = { react: '19.3.0', 'react-dom': '19.3.0', scheduler: '0.28.0' } as const;
for (const [name, soll] of Object.entries(FASSUNG)) {
  const ist = paket(name).version;
  if (ist !== soll) throw new Error(`bauen-inseln.mts: ${name} ist ${ist}, erwartet ${soll} (E699).`);
}

const REACT_GLOBAL = 'RedionReact';
const EXTERN: Record<string, string> = {
  react: REACT_GLOBAL + '.React',
  'react-dom': REACT_GLOBAL + '.ReactDOM',
  'react-dom/client': REACT_GLOBAL + '.ReactDOMClient',
  'react/jsx-runtime': REACT_GLOBAL + '.ReactJsxRuntime',
};

/* Die Zielgeräte für das CSS. iOS 16.4 ist Redions Untergrenze (§37):
   `light-dark()` kennt Safari erst ab 17.5, und lightningcss schreibt es
   für diese Liste in Variablen um. */
const CSS_ZIEL = ['safari16.4', 'ios16.4', 'chrome111', 'firefox115', 'edge111'];

type Ergebnis = { js: string; css: string; module: string[] };

const buendeln = async (eingang: string, name: string, extern: boolean): Promise<Ergebnis> => {
  const aus = await build({
    configFile: false,
    root: WURZEL,
    logLevel: 'warn',
    mode: 'production',
    publicDir: false,
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    build: {
      write: false,
      target: 'es2022',
      cssTarget: CSS_ZIEL,
      minify: true,
      sourcemap: false,
      emptyOutDir: false,
      copyPublicDir: false,
      reportCompressedSize: false,
      lib: {
        entry: join(WURZEL, eingang),
        formats: ['iife'],
        name,
        fileName: () => 'aus.js',
        cssFileName: 'aus',
      },
      rolldownOptions: extern
        ? { external: Object.keys(EXTERN), output: { globals: EXTERN } }
        : {},
    },
  });
  const ausgaben = (Array.isArray(aus) ? aus : [aus]) as Rolldown.RolldownOutput[];
  let js = '', css = '';
  const module: string[] = [];
  for (const o of ausgaben)
    for (const f of o.output) {
      if (f.type === 'chunk') {
        if (js) throw new Error('bauen-inseln.mts: mehr als ein Stück aus ' + eingang + ' — kein Aufteilen erlaubt.');
        js = f.code;
        module.push(...Object.keys(f.modules));
      } else if (f.fileName.endsWith('.css')) css = String(f.source);
      else throw new Error('bauen-inseln.mts: unerwartete Datei ' + f.fileName);
    }
  return { js, css, module: module.map(m => relative(WURZEL, m).split('\\').join('/')).sort() };
};

/** Was die Einzeldatei und test87 nicht vertragen — der Bau bricht ab, statt es zu flicken. */
const pruefen = (datei: string, text: string, istJs: boolean): void => {
  const verboten: Array<[RegExp, string]> = [
    [/<\/script/i, '„</script" beendete das Element in der Einzeldatei'],
    [/<!--/, '„<!--" schaltet den Parser in der Einzeldatei um'],
    [/<\/style/i, '„</style" beendete ein Stilelement'],
    // eslint-disable-next-line no-control-regex
    [/[\x00-\x08\x0b\x0c\x0e-\x1f]/, 'rohes Steuerzeichen (test87)'],
    [/\r/, 'Wagenrücklauf — die Ausgabe ist LF'],
  ];
  if (istJs) verboten.push(
    [/^\s*(import|export)\s/m, 'import/export — das wäre ein Modul, und Module laufen unter file:// nicht'],
    [/\bimport\s*\(/, 'dynamisches import()'],
    [/import\.meta/, 'import.meta'],
    [/\beval\s*\(/, 'eval'],
    [/new\s+Function\s*\(/, 'new Function'],
    [/process\.env/, 'process.env — NODE_ENV muss ersetzt sein'],
  );
  for (const [muster, grund] of verboten)
    if (muster.test(text)) throw new Error(`bauen-inseln.mts: ${datei}: ${grund}.`);
};

const MIT = (kopf: string): string => readFileSync(join(WURZEL, 'node_modules', kopf, 'LICENSE'), 'utf8').trim();

/* ---- 1 · React ------------------------------------------------------------ */
const react = await buendeln('src/islands/react-runtime.tsx', REACT_GLOBAL, false);

/* Nur die Produktionsfassungen — sonst hätte `define` nicht gegriffen. */
const REACT_DATEIEN = [
  'node_modules/react-dom/cjs/react-dom-client.production.js',
  'node_modules/react-dom/cjs/react-dom.production.js',
  'node_modules/react/cjs/react-jsx-runtime.production.js',
  'node_modules/react/cjs/react.production.js',
  'node_modules/scheduler/cjs/scheduler.production.js',
];
const reactQuellen = react.module.filter(m => m.startsWith('node_modules/') && m.endsWith('.js') && m.includes('/cjs/'));
if (JSON.stringify(reactQuellen) !== JSON.stringify(REACT_DATEIEN))
  throw new Error('bauen-inseln.mts: react.js enthält andere React-Dateien als erwartet:\n  ' + reactQuellen.join('\n  '));
if (react.css) throw new Error('bauen-inseln.mts: react.js hat CSS — das gehört nicht dorthin.');

const reactKopf = [
  '/* ============================================================================',
  ' * quell/fremd/react/react.js — React, eingepackt (E699)',
  ' * ----------------------------------------------------------------------------',
  ' * ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/islands/react-runtime.tsx,',
  ' * gebaut mit `node bauen-inseln.mts` (Vite 8.3.1). test578 baut neu und',
  ' * vergleicht; die Prüfsumme steht in pruefungen/fremd-bestand.json.',
  ' *',
  ` * FREMDER CODE: react ${FASSUNG.react}, react-dom ${FASSUNG['react-dom']}, scheduler ${FASSUNG.scheduler}.`,
  ' * Ein globaler Name: RedionReact { React, ReactDOM, ReactDOMClient,',
  ' * ReactJsxRuntime }. Enthalten sind genau diese Dateien der Pakete:',
  ...REACT_DATEIEN.map(d => ' *   ' + d.replace('node_modules/', '')),
  ' *',
  ...MIT('react').split('\n').map(z => (' * ' + z).trimEnd()),
  ' * ==========================================================================*/',
  ''
].join('\n');

/* ---- 2 · Die Inseln ------------------------------------------------------- */
const inseln = await buendeln('src/islands/main.tsx', 'RedionIslands', true);
const ausDemKit = inseln.module.filter(m => m.startsWith('fremd/touch/'));
if (inseln.module.some(m => m.startsWith('node_modules/')))
  throw new Error('bauen-inseln.mts: islands.js zieht ein Paket aus node_modules hinein:\n  ' +
    inseln.module.filter(m => m.startsWith('node_modules/')).join('\n  '));

/* Wird der Glas-Code des Kits mitgebündelt, reist sein MIT-Text mit — in der
   Datei selbst, damit er auch in der Einzeldatei steht. */
const GLAS = ['fremd/touch/glass/field.ts', 'fremd/touch/glass/filter.ts'];
const mitGlas = GLAS.some(g => ausDemKit.includes(g));
const glasLizenz = mitGlas
  ? ['', ' * Darin angepasst aus ALEXalesha/LiquidGlass (glass/field.ts, glass/filter.ts):',
     ...readFileSync(join(WURZEL, 'fremd/touch/glass/LIZENZ-ALEXalesha.txt'), 'utf8').trim()
       .split('\n').map(z => (' * ' + z).trimEnd())]
  : [];

const kitCommit = (/^Commit:\s+([0-9a-f]{40})$/m.exec(
  readFileSync(join(WURZEL, 'fremd/touch/HERKUNFT.txt'), 'utf8'))?.[1] ?? '').slice(0, 7);
if (!kitCommit) throw new Error('bauen-inseln.mts: fremd/touch/HERKUNFT.txt nennt keinen Commit.');

const inselKopf = (art: string): string => [
  '/* ============================================================================',
  ` * quell/islands/islands.${art} — die React-Inseln (E699)`,
  ' * ----------------------------------------------------------------------------',
  ' * ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/islands/main.tsx, gebaut mit',
  ' * `node bauen-inseln.mts` (Vite 8.3.1). test578 baut neu und vergleicht.',
  ' *',
  ` * Touch Kit: eigener Code von Redur aus UI-Kit @${kitCommit} (fremd/touch/HERKUNFT.txt).`,
  ' * Daraus enthalten:',
  ...ausDemKit.map(m => ' *   ' + m),
  ...(art === 'js' ? [' * Ein globaler Name: RedionIslands { version, mount, update, unmount }.',
                      ' * React kommt von aussen: RedionReact (quell/fremd/react/react.js).'] : []),
  ...glasLizenz,
  ' * ==========================================================================*/',
  ''
].join('\n');

/* Vite hängt an ein ausgegebenes Stilblatt eine eigene Marke an
   (`/*$vite$:1*\/`) — ein Merkzettel für den Bündler, kein Stil. */
const ohneViteMarke = (css: string): string => css.replace(/\s*\/\*\$vite\$:\d+\*\/\s*$/, '');

const dateien: Array<[string, string, boolean | null]> = [
  ['quell/fremd/react/react.js', reactKopf + react.js.trimEnd() + '\n', true],
  ['quell/islands/islands.js', inselKopf('js') + inseln.js.trimEnd() + '\n', true],
  ['quell/islands/islands.css', inselKopf('css') + ohneViteMarke(inseln.css).trimEnd() + '\n', false],
  ['quell/fremd/react/LIZENZ.txt', [
    `React ${FASSUNG.react}, React DOM ${FASSUNG['react-dom']} und scheduler ${FASSUNG.scheduler} — MIT License.`,
    'Eingepackt in quell/fremd/react/react.js (E699). Die drei Pakete tragen',
    'denselben Lizenztext; er steht hier je Paket so, wie er in node_modules liegt.',
    '',
    ...(['react', 'react-dom', 'scheduler'] as const).flatMap(p => [
      `===== ${p} ${FASSUNG[p]} — node_modules/${p}/LICENSE =====`, '', MIT(p), '']),
  ].join('\n'), null],
];

for (const [pfad, text, istJs] of dateien) {
  if (istJs !== null) pruefen(pfad, text, istJs);
  const voll = join(ZIEL, pfad);
  mkdirSync(dirname(voll), { recursive: true });
  writeFileSync(voll, text);
  const summe = createHash('sha256').update(text).digest('hex').slice(0, 16);
  console.log(`  ${pfad.padEnd(30)} ${String(Buffer.byteLength(text)).padStart(7)} Bytes  sha256 ${summe}…`);
}
