/* Suite 73 — Es entsteht kein neues JavaScript
 * ----------------------------------------------------------------------------
 * `ENTSCHEIDUNGEN.md` E28 sagt: neuer Code ist TypeScript, der bestehende
 * JavaScript-Bestand wird migriert und nicht vermehrt. Dieser Lauf ist der
 * Grund, warum dieser Satz mehr ist als eine Absicht.
 *
 * ─── WARUM EIN VERZEICHNIS UND KEINE ZÄHLUNG ────────────────────────────────
 *
 * Eine Zahl liesse sich austauschen: eine Datei weg, eine neu, Summe gleich,
 * Prüfung grün. Deshalb steht in `pruefungen/js-bestand.json` jede einzelne
 * Datei mit Pfad.
 *
 *   Das Verzeichnis darf nur schrumpfen.
 *   Eine Datei, die nicht darin steht, ist neu — und damit ein Fehler.
 *
 * Wer eine Datei migriert, streicht sie heraus; die Zeile im Diff ist der
 * Fortschritt. Wer eine neue `.js` anlegt, wird sofort rot.
 *
 * ─── DIESE DATEI IST SELBST DER BEWEIS ──────────────────────────────────────
 *
 * Sie ist die erste TypeScript-Datei unter `pruefungen/` und läuft **direkt**:
 *
 *   node pruefungen/lauf/test109.mts
 *
 * Kein Übersetzer, kein Paket, kein Schritt, den jemand vergessen kann. Node
 * entfernt die Typen seit 22.18 von selbst.
 *
 * WARUM `.mts` UND NICHT `.ts`. Genau aus demselben Grund, aus dem die
 * bestehenden Läufe `.mjs` heissen: die `package.json` in der Wurzel sagt
 * nichts über `type`, also gilt CommonJS — und eine `import`-Zeile scheitert
 * dort. `.mts` ist zu `.ts`, was `.mjs` zu `.js` ist. Der erste Versuch mit
 * `.ts` scheiterte an genau dieser Stelle. Der Preis: die Typen müssen
 * löschbar sein — kein `enum`, kein `namespace`. Abschnitt 3 hält das fest,
 * denn eine einzige solche Zeile nimmt Node die Fähigkeit, die Datei
 * auszuführen, und der Lauf scheitert dann an etwas anderem als an dem, was
 * er prüft.
 * ==========================================================================*/
import { fileURLToPath as alsPfad } from 'node:url';
import { dirname as ordnerVon, resolve as loese, join as dazu, relative as rel } from 'node:path';
import { readFileSync as lies, readdirSync as liesOrdner, statSync as stat,
         existsSync as da } from 'node:fs';

const WURZEL: string = loese(ordnerVon(alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n: string, b: boolean, extra: string = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* --------------------------------------------------------------------------
 * Alles einsammeln
 * ------------------------------------------------------------------------*/
const UEBERGANGEN = ['.git', 'node_modules', '.wrangler'];

const alleDateien = (ordner: string, gesammelt: string[] = []): string[] => {
  for (const eintrag of liesOrdner(ordner)) {
    if (UEBERGANGEN.includes(eintrag)) continue;
    const voll = dazu(ordner, eintrag);
    if (stat(voll).isDirectory()) alleDateien(voll, gesammelt);
    else gesammelt.push(rel(WURZEL, voll).split('\\').join('/'));
  }
  return gesammelt;
};

const alles = alleDateien(WURZEL);

/* Was `npm run bauen:ts` erzeugt, zählt nicht: es ist Ausgabe, kein
   Quelltext. `test105` hält es an seiner `.ts`. */
const erzeugt = new Set<string>(
  alles.filter(f => f.startsWith('src/') && f.endsWith('.ts') && !f.endsWith('.d.ts'))
       .map(f => 'quell/' + f.slice('src/'.length, -3) + '.js'));

const vonHand = alles
  .filter(f => /\.(js|mjs|cjs)$/.test(f))
  .filter(f => !erzeugt.has(f))
  .sort();

/* ==========================================================================
 * 1 · DAS VERZEICHNIS
 * ========================================================================*/
console.log('\n1 · Das Verzeichnis des bestehenden JavaScripts');

const VERZEICHNIS = dazu(WURZEL, 'pruefungen/js-bestand.json');
p('Es gibt ein Verzeichnis', da(VERZEICHNIS), 'pruefungen/js-bestand.json fehlt');

const eingetragen: string[] = da(VERZEICHNIS)
  ? JSON.parse(lies(VERZEICHNIS, 'utf8')) as string[]
  : [];
const bekannt = new Set<string>(eingetragen);

p('Es steht wirklich etwas darin', eingetragen.length > 50, String(eingetragen.length));

/* Die eigentliche Regel. */
const neu = vonHand.filter(f => !bekannt.has(f));
p('Keine neue JavaScript-Datei', neu.length === 0,
  neu.length
    ? neu.slice(0, 8).join(', ') +
      (neu.length > 8 ? ` … und ${neu.length - 8} weitere` : '') +
      '  →  als .ts anlegen (E28), oder — falls es wirklich JavaScript ' +
      'bleiben muss — mit Begründung in js-bestand.json eintragen'
    : '');

/* Die Gegenrichtung: was migriert wurde, gehört aus dem Verzeichnis heraus.
   Bleibt es stehen, zeigt die Fortschrittsanzeige zu viel an — und beim
   nächsten Mal glaubt sie niemand mehr. */
const vorhanden = new Set<string>(vonHand);
const verwaist = eingetragen.filter(f => !vorhanden.has(f));
p('Kein Eintrag zeigt ins Leere', verwaist.length === 0,
  verwaist.slice(0, 8).join(', ') + '  →  aus js-bestand.json streichen');

/* ==========================================================================
 * 2 · DER FORTSCHRITT
 * ------------------------------------------------------------------------
 * Keine Prüfung, ein Bericht. Er steht hier, weil eine Migration ohne
 * sichtbaren Fortschritt eine Migration ist, die versandet.
 * ========================================================================*/
console.log('\n2 · Wie weit die Migration ist');

const bereich = (f: string): string => {
  if (f.startsWith('quell/')) return 'quell (Produktcode)';
  if (f.startsWith('server/')) return 'server';
  if (f.startsWith('pruefungen/lauf/')) return 'pruefungen/lauf';
  if (f.startsWith('pruefungen/')) return 'pruefungen (sonst)';
  if (f.includes('/')) return f.split('/')[0] ?? '(Wurzel)';
  return '(Wurzel)';
};

const zaehlung = new Map<string, number>();
for (const f of vonHand) zaehlung.set(bereich(f), (zaehlung.get(bereich(f)) ?? 0) + 1);

const ts = alles.filter(f => f.startsWith('src/') && f.endsWith('.ts')).length;
console.log('    TypeScript unter src/:  ' + ts);
console.log('    erzeugtes JavaScript:   ' + erzeugt.size + '  (zählt nicht)');
console.log('    noch JavaScript:        ' + vonHand.length);
for (const [k, v] of [...zaehlung.entries()].sort((a, b) => b[1] - a[1]))
  console.log('      ' + k.padEnd(22) + v);

/* ==========================================================================
 * 3 · LÖSCHBARE TYPEN
 * ------------------------------------------------------------------------
 * Node führt TypeScript aus, indem es die Typen **entfernt**. Was sich nicht
 * entfernen lässt, weil es zur Laufzeit etwas erzeugt, geht nicht: `enum`
 * baut ein Objekt, `namespace` auch, und Parameter-Felder im Konstruktor
 * schreiben Zuweisungen.
 *
 * Eine einzige solche Zeile nimmt Node die Fähigkeit, die Datei
 * auszuführen — und der Fehler kommt dann aus einer ganz anderen Ecke.
 * ========================================================================*/
console.log('\n3 · Alle Typen lassen sich entfernen');

const tsDateien = alles.filter(f => f.startsWith('src/') && f.endsWith('.ts'))
  .concat(alles.filter(f => f.startsWith('pruefungen/') && /\.m?ts$/.test(f)));

const nichtLoeschbar: string[] = [];
for (const f of tsDateien) {
  /* Kommentare und Zeichenketten weg — sonst prüft der Lauf die Prosa. In
     diesem Kopfkommentar steht `enum` schliesslich mehrfach. */
  const quelle = lies(dazu(WURZEL, f), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""');
  if (/\b(?:const\s+)?enum\s+\w/.test(quelle)) nichtLoeschbar.push(f + ': enum');
  if (/\bnamespace\s+\w/.test(quelle)) nichtLoeschbar.push(f + ': namespace');
  if (/constructor\s*\([^)]*\b(?:private|public|readonly)\s/.test(quelle))
    nichtLoeschbar.push(f + ': Parameter-Feld im Konstruktor');
}
p('Kein enum, kein namespace, kein Parameter-Feld', nichtLoeschbar.length === 0,
  nichtLoeschbar.slice(0, 5).join(', '));
p('Und es wurden wirklich Dateien angesehen', tsDateien.length >= 15,
  String(tsDateien.length));

/* ==========================================================================
 * 4 · DIE UNTERGRENZE STEHT ÜBERALL DERSELBEN
 * ------------------------------------------------------------------------
 * Node führt `.ts` erst ab 22.18 aus. Sagt `package.json` weiterhin `>=20`
 * und die CI läuft auf 20, dann scheitert dieser Lauf dort an einem
 * Syntaxfehler — und niemand käme darauf, dass die Node-Fassung gemeint ist.
 * ========================================================================*/
console.log('\n4 · Node 22.18 als Untergrenze, an allen drei Stellen');

const paket = JSON.parse(lies(dazu(WURZEL, 'package.json'), 'utf8')) as
  { engines?: { node?: string } };
const verlangt = paket.engines?.node ?? '';
const mindestens = Number((verlangt.match(/(\d+)/) ?? [])[1] ?? 0);
p('package.json verlangt mindestens Node 22', mindestens >= 22, 'engines.node = ' + verlangt);

const ablauf = lies(dazu(WURZEL, '.github/workflows/pruefen.yml'), 'utf8');
const fassungen = [...ablauf.matchAll(/node-version:\s*'?(\d+)/g)].map(m => Number(m[1]));
p('Die CI läuft überall auf mindestens 22',
  fassungen.length > 0 && fassungen.every(v => v >= 22),
  'gefunden: ' + fassungen.join(', '));

/* Und die laufende Fassung selbst — sonst prüft dieser Lauf eine Regel, die
   er gerade selbst verletzt. */
const hier = Number((process.versions.node.match(/^(\d+)/) ?? [])[1] ?? 0);
p('Dieser Lauf selbst läuft auf mindestens 22', hier >= 22, 'node ' + process.versions.node);

/* ==========================================================================
 * 5 · DIE ENTSCHEIDUNG STEHT GESCHRIEBEN
 * ========================================================================*/
console.log('\n5 · E28 steht in den Entscheidungen und in CLAUDE.md');

const entscheidungen = lies(dazu(WURZEL, 'ENTSCHEIDUNGEN.md'), 'utf8');
p('ENTSCHEIDUNGEN.md führt E28', /##\s*E28\s*·/.test(entscheidungen));
p('… und nennt die Sprachliste', /TOML/.test(entscheidungen) && /Wrangler/.test(entscheidungen));

const claude = lies(dazu(WURZEL, 'CLAUDE.md'), 'utf8');
p('CLAUDE.md sagt es auch', /kein neues JavaScript/i.test(claude));

/* ==========================================================================
 * 6 · DIE TYPEN IN DEN PRÜFLÄUFEN WERDEN AUCH GEPRÜFT
 * ------------------------------------------------------------------------
 * Node ENTFERNT die Typen beim Ausführen — es prüft sie nicht. Stünde
 * `pruefungen/**\/*.mts` nicht in `tsconfig.json`, trüge ein Prüflauf in
 * TypeScript also Typen, die niemand ansieht: Zierde statt Zusage, und
 * schlimmer als gar keine, weil sie Sicherheit vortäuschen.
 * ========================================================================*/
console.log('\n6 · Auch die Prüfläufe werden getypt geprüft');

const tsconfig = lies(dazu(WURZEL, 'tsconfig.json'), 'utf8');
p('tsconfig.json nimmt die .mts der Prüfläufe mit',
  /pruefungen\/\*\*\/\*\.mts/.test(tsconfig));
p('… und schliesst sie nicht gleichzeitig aus',
  !/"exclude"[^\]]*"pruefungen"/.test(tsconfig));

/* @types/node ist die einzige Abhängigkeit, die dafür dazukam. Sie ist
   reine Typinformation: sie läuft nie, landet nie im Browser und steht
   unter devDependencies. Ohne sie kennt `tsc` weder `process` noch
   `node:fs` — und jeder Node-Lauf wäre rot, ohne dass etwas falsch wäre. */
const paketRoh = lies(dazu(WURZEL, 'package.json'), 'utf8');
p('@types/node steht bei den Entwicklungsabhängigkeiten',
  /"devDependencies"[\s\S]*"@types\/node"/.test(paketRoh));
p('… und nicht bei den echten',
  !/"dependencies"\s*:/.test(paketRoh));

console.log(`\n  Suite 73 — Keine neue JavaScript-Datei: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
