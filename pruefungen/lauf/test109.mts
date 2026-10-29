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
// Native Paketkopien sind keine neuen handgeschriebenen Quellen. Nur diese
// expliziten, ignorierten Bauausgaben auslassen, nicht pauschal build/.
const NATIVE_AUSGABEN = new Set(['build/windows-app', 'build/windows-dist', 'build/ios-capacitor', 'windows/generated', 'www']);

const alleDateien = (ordner: string, gesammelt: string[] = []): string[] => {
  for (const eintrag of liesOrdner(ordner)) {
    if (UEBERGANGEN.includes(eintrag)) continue;
    const voll = dazu(ordner, eintrag);
    if (NATIVE_AUSGABEN.has(rel(WURZEL, voll).split('\\').join('/'))) continue;
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

/* Eine Ausnahme, und nur diese eine: `src/dienst/sw.ts` wird nach `sw.js`
   in der WURZEL geschrieben, nicht nach `quell/`. Ein Dienstarbeiter darf
   nur den Bereich bedienen, in dem seine eigene Datei liegt — läge er unter
   `quell/`, könnte er `index.html` nicht mehr beiseitelegen, und die App
   startete ohne Netz nicht mehr. `tsconfig.sw.json` erledigt das, `test105`
   prüft, dass die erzeugte Datei zu ihrer Quelle passt. */
if ((alles ?? '').includes('src/dienst/sw.ts')) erzeugt.add('sw.js');

/* FREMDER CODE zählt auch nicht — er ist nichts, was hier jemand
   geschrieben hat, und ihn zu migrieren wäre sinnlos. Er steht mit Pfad,
   Fassung, Lizenz, Herkunft und Prüfsumme in `pruefungen/fremd-bestand.json`;
   `test177` rechnet die Prüfsummen nach. `js-bestand.json` bleibt dabei
   leer — §54.4 sagt „darf nur schrumpfen", und eine fremde Bibliothek ist
   kein Rückschritt in der Migration, sondern eine eigene Entscheidung
   (E103). */
const FREMD = dazu(WURZEL, 'pruefungen/fremd-bestand.json');
const fremd = new Set<string>(
  da(FREMD)
    ? (JSON.parse(lies(FREMD, 'utf8')).eintraege || [])
        .map((e: { pfad: string }) => e.pfad)
    : []);

/* DIE DRITTE SORTE ERZEUGTES JAVASCRIPT: DAS BÜNDEL (E699).
   `bauen-inseln.mts` baut aus `src/islands/*.tsx` und dem Touch Kit zwei
   klassische Skripte — React (`quell/fremd/react/react.js`, zugleich fremd)
   und die Inseln (`quell/islands/islands.js`). Sie sind Ausgabe wie
   `quell/**.js` aus tsc, nur mit einem anderen Werkzeug gebaut.

   ABER NUR, WENN ES BEWIESEN IST. Ein Eintrag in `buendel-bestand.json`
   allein entlastet nichts — sonst wäre die Datei ein zweites
   `js-bestand.json`, das niemand schrumpfen lässt. Ein Bündel zählt nur als
   erzeugt, wenn (1) seine Quelle daliegt, (2) der Bau daliegt und (3) der
   Wächter daliegt UND die Datei beim Namen nennt: `test578` baut bei jedem
   Lauf neu und vergleicht Byte für Byte. Fehlt eines der drei, ist die
   Datei für diesen Lauf von Hand geschrieben — und rot. */
const BUENDEL = dazu(WURZEL, 'pruefungen/buendel-bestand.json');
type BuendelEintrag = { pfad: string; quelle: string };
type Buendel = { bau?: string; waechter?: string; buendel?: BuendelEintrag[] };
const bewiesen = (b: Buendel, e: BuendelEintrag, gibt: (rel: string) => boolean,
                  waechterText: string): boolean =>
  /\.js$/.test(e.pfad) && gibt(e.quelle) && !!b.bau && gibt(b.bau) &&
  !!b.waechter && waechterText.includes(e.pfad);
const buendel: Buendel = da(BUENDEL) ? JSON.parse(lies(BUENDEL, 'utf8')) : {};
const waechterDatei = dazu(WURZEL, 'pruefungen/lauf', (buendel.waechter ?? '') + '.mts');
const waechterText = buendel.waechter && da(waechterDatei) ? lies(waechterDatei, 'utf8') : '';
const gibt = (rel: string): boolean => da(dazu(WURZEL, rel));
for (const e of buendel.buendel ?? [])
  if (bewiesen(buendel, e, gibt, waechterText)) erzeugt.add(e.pfad);

const vonHand = alles
  .filter(f => /\.(js|mjs|cjs)$/.test(f))
  .filter(f => !erzeugt.has(f))
  .filter(f => !fremd.has(f))
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

/* HIER STAND `eingetragen.length > 50`. Das war eine Zahl gegen den Fall,
   dass jemand die Datei leert — und sie ist mit Bündel 22 überholt: der
   Bestand ist auf 35 gefallen, und am Ende der Migration wird er 0 sein.
   Eine Zahl, die irgendwann von selbst rot wird, prüft nichts mehr, sie
   erinnert nur noch an ihren eigenen Aufstellungstag.

   Was den leergeräumten Fall wirklich abdeckt, stehen zwei Zeilen weiter
   unten schon: „Keine neue JavaScript-Datei" (was auf der Platte liegt,
   steht im Verzeichnis) und „Kein Eintrag zeigt ins Leere" (was im
   Verzeichnis steht, liegt auch da). Zusammen heisst das: die beiden Mengen
   sind gleich. Wer das Verzeichnis leert, ohne die Dateien zu entfernen,
   wird von der ersten der beiden rot — sofort und mit Namen.

   Die Zahl bleibt als BERICHT stehen, nicht als Bedingung. */
console.log(`    im Verzeichnis: ${eingetragen.length} JavaScript-Dateien`);

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
 * 1b · DIE BÜNDEL SIND BEWIESEN, NICHT NUR EINGETRAGEN (E699)
 * ------------------------------------------------------------------------
 * Die Gegenproben stehen hier, weil die Ausnahme oben sonst eine Behauptung
 * wäre: ein Eintrag ohne Quelle oder ohne Wächter darf NICHT entlasten.
 * ========================================================================*/
console.log('\n1b · Die Bündel aus bauen-inseln.mts zählen nur mit Beweis (E699)');
const inselBuendel: BuendelEintrag = { pfad: 'quell/islands/islands.js', quelle: 'src/islands/main.tsx' };
p('Das Inselbündel ist bewiesen erzeugt (Quelle, Bau, test578 nennt es)',
  bewiesen(buendel, inselBuendel, gibt, waechterText),
  JSON.stringify({ quelle: gibt(inselBuendel.quelle), bau: buendel.bau, waechter: buendel.waechter }));
p('Gegenprobe: ohne Quelle wäre es von Hand geschrieben',
  !bewiesen(buendel, { ...inselBuendel, quelle: 'src/islands/gibt-es-nicht.tsx' }, gibt, waechterText));
p('Gegenprobe: ohne einen Wächter, der es nennt, auch', !bewiesen(buendel, inselBuendel, gibt, ''));
p('Gegenprobe: und ein Stilblatt ist kein JavaScript-Bündel',
  !bewiesen(buendel, { pfad: 'quell/islands/islands.css', quelle: 'src/islands/main.tsx' }, gibt, waechterText));

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
  if ((f ?? '').includes('/')) return f.split('/')[0] ?? '(Wurzel)';
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

/* SEIT BÜNDEL 19 GILT DASSELBE FÜR server/. Der Ordner stand vorher in
   `exclude`, weil er JavaScript war. Jetzt ist er TypeScript — und ein
   Server, der Anmeldungen und Zugangsschlüssel behandelt und dessen Typen
   niemand ansieht, wäre die stille Fassung des Fehlers: der Typecheck läuft
   grün, prüft aber genau die Stelle nicht, an der ein Fehler etwas kostet.
   Diese zwei Zeilen sind die Erinnerung daran. */
p('tsconfig.json prüft den Server mit',
  /server\/\*\*\/\*\.ts/.test(tsconfig));
p('… und schliesst ihn nicht gleichzeitig aus',
  !/"exclude"[^\]]*"server"/.test(tsconfig));

/* `worker.ts` ist der Einstiegspunkt bei Cloudflare, `functions/` die Brücke
   daneben. Beide rufen denselben Kern; fehlt eines von beiden hier, wird ein
   Aufrufer ungeprüft, dessen Fehler erst im Betrieb auffällt. */
p('… samt Einstiegspunkt und functions/',
  /"worker\.ts"/.test(tsconfig) && /functions\/\*\*\/\*\.ts/.test(tsconfig));

/* Der Server wird nicht gebaut: Node führt die .ts unmittelbar aus. Dafür
   muss im Import die echte Endung stehen, und dafür braucht tsc diese
   Einstellung. Ohne sie ist jeder Import im Server rot. */
p('allowImportingTsExtensions steht an — sonst laufen die Server-Importe nicht',
  /"allowImportingTsExtensions"\s*:\s*true/.test(tsconfig));

/* Und in der bauenden Konfiguration steht sie auf false: sie verträgt sich
   nicht mit `noEmit: false`, und dort wird wirklich etwas erzeugt. */
const tsbauen = lies(dazu(WURZEL, 'tsconfig.bauen.json'), 'utf8');
p('… und in tsconfig.bauen.json ausdrücklich aus',
  /"allowImportingTsExtensions"\s*:\s*false/.test(tsbauen));

/* @types/node ist die einzige Abhängigkeit, die dafür dazukam. Sie ist
   reine Typinformation: sie läuft nie, landet nie im Browser und steht
   unter devDependencies. Ohne sie kennt `tsc` weder `process` noch
   `node:fs` — und jeder Node-Lauf wäre rot, ohne dass etwas falsch wäre. */
const paketRoh = lies(dazu(WURZEL, 'package.json'), 'utf8');
p('@types/node steht bei den Entwicklungsabhängigkeiten',
  /"devDependencies"[\s\S]*"@types\/node"/.test(paketRoh));
/* Bis zum 8. August galt: gar keine echten Abhängigkeiten. Seit E78 gibt
   es GENAU VIER — react, react-dom, dexie, zod, die beschlossene
   Zielarchitektur. Der Punkt bleibt ein Wächter, nur die Regel ist neu:
   jede WEITERE Laufzeit-Abhängigkeit braucht ihren eigenen E-Eintrag,
   und bis dahin ist sie hier rot. */
/* Seit E80 gilt wieder der alte Satz: KEINE Laufzeit-Abhängigkeiten.
   Zwischen E78 und E80 stand hier eine Allowlist (react, dexie, zod,
   prosemirror …) — Redur hat den React-Umbau nach Ansicht des Rohbaus
   widerrufen, und mit ihm gingen alle elf Pakete wieder. */
/* UND SEIT E699 GILT ER IMMER NOCH — obwohl React zurück ist. Redur,
   27. September 2026: „du kannst react nutzen keien problem". Aber React
   kommt NICHT als Laufzeitpaket: `dependencies` bleibt leer. Es steht als
   Werkstoff unter `devDependencies` (festgenagelt, unten), `bauen-inseln.mts`
   packt es in `quell/fremd/react/react.js`, und DIESE Bytes stehen mit
   Prüfsumme in `fremd-bestand.json` — wie pdf.js (E103). Ein `npm install`
   ist für die Nutzung damit so wenig nötig wie vorher (§6). */
const echte = Object.keys(JSON.parse(paketRoh).dependencies || {});
p('… und echte Laufzeit-Abhängigkeiten gibt es KEINE (E80, bestätigt in E699)',
  echte.length === 0, 'gefunden: ' + echte.join(', '));

/* Der Werkstoff ist festgenagelt: ein `^` liesse `npm install` still eine
   andere React-Fassung holen, und das Bündel sähe danach anders aus als
   die Prüfsumme in fremd-bestand.json — ohne dass jemand etwas geändert
   hätte. */
const entw = JSON.parse(paketRoh).devDependencies || {};
const genau: Record<string, string> = { react: '19.3.0', 'react-dom': '19.3.0', vite: '8.3.1',
  '@types/react': '19.3.0', '@types/react-dom': '19.3.0' };
const lose = Object.entries(genau).filter(([n, v]) => entw[n] !== v).map(([n]) => n + '=' + entw[n]);
p('React, React DOM und Vite sind als Werkstoff GENAU festgenagelt (E699)', lose.length === 0,
  lose.join(', '));

console.log(`\n  Suite 73 — Keine neue JavaScript-Datei: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
