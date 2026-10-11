/* Suite 610 — Die CI fährt den schnellen Lauf und sagt das auch (E745, L254)
 * ============================================================================
 * WARUM ES DIESEN LAUF GIBT. In `.github/workflows/pruefen.yml` stand bis zum
 * 11. Oktober 2026 eine Aufgabe „Alle Prüfläufe": `npm run pruefen`, vierzig
 * Minuten Zeit, und daneben der Satz „67 Läufe … rund 12 Minuten". Es waren
 * 550 Läufe; der volle Lauf braucht auf dem Rechner 158 Minuten (E743). Die
 * CI hat ihn deshalb jedes Mal nach vierzig Minuten ABGEBROCHEN — am 5. und
 * am 11. Oktober auf `main`, gemessen über die Schnittstelle von GitHub
 * (L254). Ein abgebrochener Lauf sagt über keinen einzigen Prüflauf etwas,
 * und er sieht im Verlauf aus wie einer, der nichts gefunden hat.
 *
 * Redur hat am 11. Oktober (19:43 UTC, „2 . Scnell lauf") Weg (c) aus L254
 * gewählt: in der CI nur der SCHNELLE Lauf, der volle bleibt beim Menschen
 * (`node pruefungen/volllauf.mts`, CLAUDE.md §30).
 *
 * DER HAKEN, UND ER WAR GEMESSEN, NICHT VERMUTET: `--schnell` liess bis dahin
 * genau einen Lauf weg (test73, die Startmessung) — 549 von 550. Der Name
 * versprach etwas, das der Schalter nicht tat. Seit E745 heisst `--schnell`:
 * jeder Lauf, der keinen Browser startet, und dazu die Läufe aus CLAUDE.md §31,
 * die einen brauchen (test96 und test100, die Sicherung mit echten Bytes).
 * `--liste` druckt die Auswahl, ohne einen Lauf zu starten.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Kein Job der CI fährt den vollen Lauf — und keiner heisst „alle",
 *      der nicht alle fährt.
 *   2  Genau ein Job fährt `npm run pruefen -- --schnell`, und jeder Aufruf
 *      des Orchestrators in der CI ist genau dieser. Jeder Job hat eine
 *      Zeitgrenze. Der schnelle Job baut die Einzeldatei und prüft, ob sie
 *      nachgezogen ist, holt Chromium genau dann, wenn die Auswahl einen
 *      Browser braucht, und sein Kommentar nennt die Messung und den vollen
 *      Lauf auf dem Rechner.
 *   3  Die Auswahl ist, was sie verspricht: jeder Lauf ohne Browser ist
 *      dabei; ein Lauf MIT Browser nur, wenn er in CLAUDE.md §31 beim Namen
 *      steht und in alle.mts einen Grund trägt; die Läufe aus §31 sind alle
 *      dabei; und was die Liste über einen Lauf sagt (Browser oder nicht),
 *      stimmt mit dem überein, was dieser Lauf selbst in der Datei liest.
 *   4  CLAUDE.md §30 sagt, was `--schnell` heisst.
 *
 * WIE „STARTET EINEN BROWSER" HIER GELESEN WIRD — unabhängig von alle.mts.
 * alle.mts erkennt einen Browserlauf daran, dass er Playwright lädt. Dieser
 * Lauf liest zusätzlich den AUFRUF (`chromium.launch(`, `launchPersistent…`,
 * `connectOverCDP(`) im Code ohne Kommentare und Zeichenketten. Ein Lauf gilt
 * hier als Browserlauf, wenn EINES von beiden zutrifft. Zwei Wege, die
 * einander gegenprüfen: übersieht alle.mts einen, sieht ihn dieser.
 *
 * DIE FALLE, VOR DER ER SICH SELBST SCHÜTZT. Gegen einen Stand ohne `--liste`
 * würde `alle.mts --schnell --liste` den Schalter nicht kennen und die
 * Auswahl FAHREN — 549 Läufe. Deshalb fragt §3 zuerst die Quelle, ob es den
 * Schalter gibt, und startet sonst nichts; dazu eine Uhr von 60 Sekunden.
 *
 * KEIN BROWSER, KEIN PORT. Dieser Lauf liest Dateien und startet alle.mts
 * nur mit `--liste`.
 *
 *   node pruefungen/lauf/test610.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { nurCode } from '../hilfe/quelltext.mts';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const LAUF = path.join(WURZEL, 'pruefungen', 'lauf');
const lies = (rel: string): string => fs.readFileSync(path.join(WURZEL, rel), 'utf8');

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

console.log('\n' + '─'.repeat(60));
console.log('Suite 610 — Die CI fährt den schnellen Lauf und sagt das auch');
console.log('─'.repeat(60));

/* ==========================================================================
 * Die Aufgaben der CI lesen
 * ------------------------------------------------------------------------
 * Kein YAML-Paket im Projekt (und keines nötig): die Datei ist von Hand
 * geschrieben und regelmässig eingerückt — Jobs mit zwei Leerzeichen, ihre
 * Schlüssel mit vier, die Schritte darunter. `run: |` sammelt die folgenden
 * Zeilen, die tiefer stehen als der Schlüssel.
 * ========================================================================*/
type Aufgabe = {
  id: string;
  name: string;
  zeit: number | null;
  schrittNamen: string[];
  befehle: string[];      // jede Befehlszeile einzeln, getrimmt, ohne # …
  text: string;           // der ganze Block, Kommentare eingeschlossen
};

/** Eine Zeile kann mehrere Befehle tragen — `a && b`, `a; b`, `a || b`.
 *  Jeder zählt für sich: ein `npm run pruefen -- --liste && npm run pruefen`
 *  ist ein voller Lauf, auch wenn die Zeile mit der Liste beginnt. */
const befehleIn = (zeile: string): string[] =>
  zeile.split(/&&|\|\||;/).map(t => t.trim()).filter(Boolean);

const aufgabenAus = (yml: string): Aufgabe[] => {
  const zeilen = yml.split('\n');
  const start = zeilen.findIndex(z => /^jobs:\s*$/.test(z));
  if (start < 0) return [];
  const liste: Aufgabe[] = [];
  let jetzt: Aufgabe | null = null;
  /* Der Kommentar ÜBER einem Job (zwei Leerzeichen und `#`) gehört zu dem
     Job, der darauf folgt — nicht zu dem davor. */
  let vorspann = '';
  for (let i = start + 1; i < zeilen.length; i++) {
    const z = zeilen[i] ?? '';
    if (/^[^\s#]/.test(z)) break;                       // nächster oberster Schlüssel
    if (/^ {2}#/.test(z) || (vorspann && z.trim() === '')) { vorspann += z + '\n'; continue; }
    const kopf = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(z);
    if (kopf) {
      jetzt = { id: kopf[1] ?? '', name: '', zeit: null, schrittNamen: [], befehle: [], text: vorspann };
      vorspann = '';
      liste.push(jetzt);
      continue;
    }
    if (!jetzt) continue;
    if (vorspann) { jetzt.text += vorspann; vorspann = ''; }
    jetzt.text += z + '\n';
    const name = /^ {4}name:\s*(.+?)\s*$/.exec(z);
    if (name) jetzt.name = (name[1] ?? '').replace(/^['"]|['"]$/g, '');
    const zeit = /^ {4}timeout-minutes:\s*(\d+)\s*$/.exec(z);
    if (zeit) jetzt.zeit = Number(zeit[1]);
    const schritt = /^\s+-\s+name:\s*(.+?)\s*$/.exec(z);
    if (schritt) jetzt.schrittNamen.push((schritt[1] ?? '').replace(/^['"]|['"]$/g, ''));
    const lauf = /^(\s+(?:-\s+)?)run:\s*(.*?)\s*$/.exec(z);
    if (!lauf) continue;
    const wert = lauf[2] ?? '';
    if (/^[|>][-+]?$/.test(wert)) {
      const spalte = (lauf[1] ?? '').length;              // Spalte von `run`
      for (let k = i + 1; k < zeilen.length; k++) {
        const b = zeilen[k] ?? '';
        if (b.trim() === '') continue;
        if ((b.match(/^ */)?.[0].length ?? 0) <= spalte) break;
        jetzt.text += b + '\n';
        const t = b.trim();
        if (!t.startsWith('#')) jetzt.befehle.push(...befehleIn(t));
        i = k;
      }
    } else if (wert) {
      jetzt.befehle.push(...befehleIn(wert));
    }
  }
  return liste;
};

const ablauf = lies('.github/workflows/pruefen.yml');
const aufgaben = aufgabenAus(ablauf);
console.log('\n    Jobs in pruefen.yml: ' +
  aufgaben.map(a => a.id + ' („' + a.name + '", ' + (a.zeit ?? '—') + ' min)').join(' · '));

/** Ruft dieser Befehl den Orchestrator (`npm run pruefen` oder alle.mts)?
 *  Nur am ANFANG des Befehls — ein `echo "npm run pruefen …"` in einer
 *  Hilfe-Ausgabe ist Prosa, kein Aufruf. */
const istOrchestrator = (b: string): boolean =>
  /^npm run pruefen\b/.test(b) || /^node\s+(?:\.\/)?pruefungen\/alle\.mts\b/.test(b);

/** Fährt dieser Befehl den VOLLEN Lauf? Ein Orchestrator-Aufruf ohne Auswahl
 *  (keine Nummer, kein `--schnell`, kein `server`, kein `--liste`) — oder
 *  der Lauf in Stücken selbst. */
const istVoll = (b: string): boolean => {
  if (/^node\s+(?:\.\/)?pruefungen\/volllauf\.mts\b/.test(b)) return true;
  if (!istOrchestrator(b)) return false;
  const rest = b.replace(/^npm run pruefen\b/, '').replace(/^node\s+(?:\.\/)?pruefungen\/alle\.mts\b/, '');
  return !/--schnell\b|--liste\b|\bserver\b|(^|\s)\d+(\s|$)/.test(rest);
};

/* ==========================================================================
 * 1 · KEIN JOB FÄHRT DEN VOLLEN LAUF (Redurs Weg (c), E745)
 * ========================================================================*/
console.log('\n1 · Der volle Lauf bleibt auf dem Rechner');

const vollJobs = aufgaben.filter(a => a.befehle.some(istVoll));
p('Kein Job der CI fährt den vollen Lauf — er bleibt bei volllauf.mts (§30, L254)',
  aufgaben.length > 0 && vollJobs.length === 0,
  aufgaben.length === 0 ? 'keine Jobs gelesen'
    : vollJobs.map(a => a.id + ': ' + a.befehle.filter(istVoll).join(' | ')).join(' · '));

const behauptetAlle = (a: Aufgabe): boolean =>
  [a.name, ...a.schrittNamen].some(n => /(^|[^\p{L}])alle([^\p{L}]|$)/iu.test(n));
const falscheBehauptung = aufgaben.filter(a => behauptetAlle(a) && !a.befehle.some(istVoll));
p('Kein Job heisst „alle", der nicht alle fährt',
  falscheBehauptung.length === 0,
  falscheBehauptung.map(a => a.id + ' („' + a.name + '")').join(', '));

/* ==========================================================================
 * 2 · DER SCHNELLE JOB
 * ========================================================================*/
console.log('\n2 · Der schnelle Job fährt genau --schnell, in einer Zeitgrenze');

const SCHNELL = 'npm run pruefen -- --schnell';
const schnelle = aufgaben.filter(a => a.befehle.includes(SCHNELL));
p('Genau ein Job fährt `' + SCHNELL + '`', schnelle.length === 1,
  schnelle.length + ' gefunden');

/* `--liste` fährt nichts (es druckt die Auswahl); jeder andere Aufruf des
   Orchestrators muss genau der schnelle sein. */
const andereAufrufe = aufgaben.flatMap(a =>
  a.befehle.filter(b => istOrchestrator(b) && b !== SCHNELL && b !== SCHNELL + ' --liste')
    .map(b => a.id + ': ' + b));
p('… und jeder Aufruf des Orchestrators in der CI ist genau dieser (oder seine Liste)',
  andereAufrufe.length === 0, andereAufrufe.join(' · '));

const ohneZeit = aufgaben.filter(a => !(a.zeit !== null && a.zeit > 0));
p('Jeder Job hat eine Zeitgrenze (timeout-minutes)', aufgaben.length > 0 && ohneZeit.length === 0,
  ohneZeit.map(a => a.id).join(', '));

const schnell = schnelle[0];
p('Der schnelle Job heisst so, wie er ist (sein Name sagt „schnell")',
  !!schnell && /schnell/i.test(schnell.name), schnell ? '„' + schnell.name + '"' : 'kein Job');
p('Er baut die Einzeldatei aus den Quellen',
  !!schnell && schnell.befehle.includes('node bauen.mts'));
p('… und prüft, ob sie nachgezogen ist',
  !!schnell && schnell.befehle.some(b => b.includes('git diff --quiet -- redion-einzeldatei.html')));
p('Sein Kommentar nennt die Messung und den vollen Lauf auf dem Rechner (volllauf.mts)',
  !!schnell && /gemessen/i.test(schnell.text) && schnell.text.includes('volllauf.mts'));
const holtChromium = !!schnell &&
  schnell.befehle.some(b => /playwright install\b/.test(b) && /\bchromium\b/.test(b));

/* ==========================================================================
 * 3 · DIE AUSWAHL --schnell IST, WAS SIE VERSPRICHT
 * ========================================================================*/
console.log('\n3 · Die Auswahl --schnell');

/** Startet dieser Lauf einen Browser? Zwei Wege, siehe Kopf. */
const LAEDT_PLAYWRIGHT = /\bfrom\s+['"]playwright(?:-core)?['"]|\bimport\(\s*['"]playwright(?:-core)?['"]\s*\)|\brequire\(\s*['"]playwright(?:-core)?['"]\s*\)/;
const RUFT_BROWSER = /\b(?:chromium|firefox|webkit)\s*\.\s*launch(?:PersistentContext)?\s*\(|\.connectOverCDP\s*\(/;
const browserLaeufe = new Set<string>();
const alleLaeufe: string[] = [];
for (const f of fs.readdirSync(LAUF).filter(f => /\.mts$/.test(f)).sort()) {
  const name = f.replace(/\.mts$/, '');
  alleLaeufe.push(name);
  const roh = fs.readFileSync(path.join(LAUF, f), 'utf8');
  if (LAEDT_PLAYWRIGHT.test(roh) || RUFT_BROWSER.test(nurCode(roh))) browserLaeufe.add(name);
}
console.log('    gelesen: ' + alleLaeufe.length + ' Läufe, ' + browserLaeufe.size +
  ' mit Browser, ' + (alleLaeufe.length - browserLaeufe.size) + ' ohne');

/* §31 — die Läufe, die man beim Namen kennt. Die dokumentierte Liste der
   Browserläufe, die in den schnellen Lauf dürfen. */
const claude = lies('CLAUDE.md');
const abschnitt31 = /\n## 31\.[\s\S]*?(?=\n## 32\.)/.exec(claude)?.[0] ?? '';
const namen31 = [...abschnitt31.matchAll(/^\|\s*`(test\d+)`\s*\|/gm)].map(m => m[1] ?? '');
console.log('    CLAUDE.md §31 nennt: ' + (namen31.join(' ') || 'NICHTS'));
p('CLAUDE.md §31 nennt seine Läufe beim Namen', namen31.length >= 6, namen31.length + ' gefunden');

const ORCH = lies('pruefungen/alle.mts');
const kenntListe = /['"]--liste['"]/.test(ORCH);
p('alle.mts kennt `--liste` (die Auswahl drucken, ohne zu fahren)', kenntListe);

type Zeile = { name: string; browser: boolean; grund: string };
let zeilen: Zeile[] = [];
let kopfZahl = NaN;
if (!kenntListe) {
  console.log('    → ohne `--liste` würde alle.mts die Auswahl FAHREN; §3 startet deshalb nichts');
  p('Die Auswahl --schnell liess sich lesen', false, 'kein --liste');
} else {
  const r = spawnSync(process.execPath, [path.join(WURZEL, 'pruefungen', 'alle.mts'), '--schnell', '--liste'],
    { cwd: WURZEL, encoding: 'utf8', timeout: 60_000 });
  const aus = (r.stdout ?? '') + (r.stderr ?? '');
  p('`alle.mts --schnell --liste` endet mit 0', r.status === 0,
    'Status ' + r.status + (r.error ? ' · ' + r.error.message : ''));
  p('… und startet dabei keinen einzigen Lauf', !/^──── \[/m.test(aus));
  kopfZahl = Number(/Prüfläufe: (\d+) Läufe/.exec(aus)?.[1] ?? NaN);
  zeilen = [...aus.matchAll(/^(test\d+|servercheck)\s+(ohne Browser|Browser)(?:\s+—\s+(.*?))?\s*$/gm)]
    .map(m => ({ name: m[1] ?? '', browser: m[2] === 'Browser', grund: (m[3] ?? '').trim() }));
}
const inListe = new Set(zeilen.map(z => z.name));
console.log('    --schnell wählt: ' + zeilen.length + ' Läufe, ' +
  zeilen.filter(z => browserLaeufe.has(z.name)).length + ' davon mit Browser (' +
  zeilen.filter(z => browserLaeufe.has(z.name)).map(z => z.name).join(' ') + ')');

p('Die Zahl im Kopf der Liste stimmt mit ihren Zeilen', zeilen.length > 0 && kopfZahl === zeilen.length,
  'Kopf ' + kopfZahl + ', Zeilen ' + zeilen.length);

const fehlend = alleLaeufe.filter(n => !browserLaeufe.has(n) && !inListe.has(n));
p('Jeder Lauf ohne Browser ist dabei', zeilen.length > 0 && fehlend.length === 0,
  fehlend.slice(0, 12).join(' ') + (fehlend.length > 12 ? ' … (' + fehlend.length + ')' : ''));

const fremdeBrowser = zeilen.filter(z => browserLaeufe.has(z.name) && !namen31.includes(z.name)).map(z => z.name);
p('Ein Lauf mit Browser ist nur dabei, wenn CLAUDE.md §31 ihn beim Namen nennt',
  zeilen.length > 0 && fremdeBrowser.length === 0,
  fremdeBrowser.slice(0, 12).join(' ') + (fremdeBrowser.length > 12 ? ' … (' + fremdeBrowser.length + ')' : ''));

const ohneGrund = zeilen.filter(z => browserLaeufe.has(z.name) && !(z.browser && z.grund.length >= 10)).map(z => z.name);
p('… und trägt in alle.mts einen Grund', ohneGrund.length === 0, ohneGrund.join(' '));

const fehlen31 = namen31.filter(n => !inListe.has(n));
p('Die Läufe aus §31 sind alle dabei', zeilen.length > 0 && fehlen31.length === 0, fehlen31.join(' '));

const falschGesagt = zeilen.filter(z => z.browser !== browserLaeufe.has(z.name))
  .map(z => z.name + (z.browser ? ' (sagt Browser, liest keinen)' : ' (sagt ohne, startet einen)'));
p('Was die Liste über jeden Lauf sagt (Browser oder nicht), stimmt',
  zeilen.length > 0 && falschGesagt.length === 0, falschGesagt.join(', '));

p('Dieser Lauf selbst ist dabei (er startet keinen Browser)', inListe.has('test610'));

const brauchtBrowser = zeilen.some(z => browserLaeufe.has(z.name));
p('Der schnelle Job holt Chromium genau dann, wenn die Auswahl einen Browser braucht',
  !!schnell && zeilen.length > 0 && holtChromium === brauchtBrowser,
  'braucht ' + brauchtBrowser + ', holt ' + holtChromium);

/* ==========================================================================
 * 4 · DIE DOKU SAGT, WAS --schnell HEISST
 * ========================================================================*/
console.log('\n4 · CLAUDE.md §30');

/* Die Zeile samt ihren eingerückten Fortsetzungen, Leerraum zu einem Zeichen. */
const befehlsZeile = (/^npm run pruefen -- --schnell[^\n]*(?:\n {20,}[^\n]*)*/m.exec(claude)?.[0] ?? '')
  .replace(/\s+/g, ' ');
console.log('    ' + (befehlsZeile || 'NICHT GEFUNDEN'));
p('Die Zeile `npm run pruefen -- --schnell` sagt „ohne Browser" und hat eine gemessene Dauer',
  /ohne Browser/.test(befehlsZeile) && !/ungemessen/.test(befehlsZeile) && /\d+\s*min/.test(befehlsZeile));

console.log(`\n${ok}/${ok + weg} bestanden`);
console.log(`\n  Suite 610 — Die CI fährt den schnellen Lauf: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
