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
 *      der nicht alle fährt. Gelesen wird JEDE Ablaufdatei unter
 *      `.github/workflows/` (`*.yml` und `*.yaml`), nicht nur pruefen.yml,
 *      und jede muss für den Leser unten mindestens einen Job ergeben — eine
 *      Datei, aus der er nichts liest, wäre sonst still geprüft. Dazu, ohne
 *      den Leser, Zeile für Zeile jede YAML-Datei unter `.github/` (auch eine
 *      eigene Action unter `.github/actions/`): in keiner steht ein voller
 *      Lauf.
 *   2  Genau ein Job fährt `npm run pruefen -- --schnell`, und jeder Aufruf
 *      des Orchestrators in der CI ist genau dieser (oder seine `--liste`).
 *      Als Aufruf zählen DIESE Schreibweisen — eine Liste, kein Beweis (siehe
 *      „Was er nicht hält"): `npm`, `pnpm` oder `yarn` mit `run`,
 *      `run-script` oder `test`, auch mit Schaltern davor, die einen Wert als
 *      eigenes Wort nehmen (`npm --prefix . run pruefen`, `npm -C . run
 *      pruefen`); `node --run pruefen` (Nodes eigener Skriptstarter); jeder
 *      Befehl, der `alle.mts` oder `volllauf.mts` nennt (auch über `npx`).
 *      Leerraum wird zusammengezogen, ein Kommentar hinter `#` abgeschnitten.
 *      Ein `echo` oder `printf` gilt als Prosa und startet nichts — aber nur,
 *      wenn in seiner Zeile kein `$(` und kein Backtick steht (dort wird
 *      etwas AUSGEFÜHRT und das Ergebnis ausgegeben) und seine Ausgabe in
 *      keine Röhre geht (`echo … | sh`). Der schnelle Lauf steht allein in
 *      seiner Zeile — kein `|| true`, keine Röhre, kein `continue-on-error`.
 *      In package.json ist `pruefen` genau `node pruefungen/alle.mts`, ohne
 *      `prepruefen` und `postpruefen` (npm führt beide von selbst aus).
 *      Jeder Job hat eine Zeitgrenze. Der schnelle Job baut die Einzeldatei
 *      und prüft, ob sie nachgezogen ist, holt Chromium genau dann, wenn die
 *      Auswahl einen Browser braucht, und sein Kommentar nennt die Messung
 *      und den vollen Lauf auf dem Rechner.
 *   3  Die Auswahl ist, was sie verspricht: jeder Lauf ohne Browser ist
 *      dabei; ein Lauf MIT Browser nur, wenn er in CLAUDE.md §31 beim Namen
 *      steht und in alle.mts einen Grund trägt; die Läufe aus §31 sind alle
 *      dabei; und was die Liste über einen Lauf sagt (Browser oder nicht),
 *      stimmt mit dem überein, was dieser Lauf selbst in der Datei liest.
 *   4  CLAUDE.md §30 sagt, was `--schnell` heisst.
 *
 * WAS ER NICHT HÄLT. Er liest Text; er führt die CI nicht aus. Ein Lauf
 * hinter einem eigenen Skript oder einer Variablen (`bash ci.sh`, `$LAUF`)
 * kommt an ihm vorbei. Und dass ein Rot des schnellen Laufs den Job rot
 * macht, sichert er nur gegen die drei Formen in §2 (`|| true`, Röhre,
 * `continue-on-error`): ein `set +e` vor dem Lauf mit einem Befehl dahinter,
 * eine `shell:` ohne `-e` mit einem Befehl dahinter und ein `if:` am Schritt
 * oder am Job, das ihn gar nicht starten lässt, prüft er nicht. Die Lesung
 * Zeile für Zeile kennt keinen gefalteten Block (`run: >`, ein Befehl über
 * mehrere Zeilen ohne `\`): in einer Ablaufdatei fängt ihn der Leser, in
 * einer eigenen Action nicht. Hier stand bis zur zweiten Durchsicht von
 * E745 „jede Form, die einen Lauf startet" und „ein Rot bricht den Job ab"
 * — beides mehr, als er hält.
 *
 * WIE „STARTET EINEN BROWSER" HIER GELESEN WIRD — auf zwei Wegen, die
 * einander VERGLEICHEN. Weg 1 ist der von alle.mts: die Datei lädt
 * Playwright. Weg 2 ist unabhängig davon: der AUFRUF (`chromium.launch(`,
 * `launchPersistent…`, `connectOverCDP(`) im Code ohne Kommentare — nur die
 * Kommentare heraus, Zeichen für Zeichen (`ohneKommentareGenau`), die
 * Zeichenketten bleiben stehen. Beide Wege müssen dieselben Läufe finden.
 *
 * Die erste Fassung las Weg 2 über `nurCode`, das auch Zeichenketten leert,
 * und vereinigte beide Wege, statt sie zu vergleichen. In `test587` steht
 * `'image/*'`; für `nurCode` beginnt dort ein Kommentar, der den Aufruf des
 * Browsers verschluckt. Weg 2 kam auf 508, Weg 1 auf 509 — und die
 * Vereinigung zeigte 509, als stimmte alles (Durchsicht von E745).
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
import { nurCode, ohneKommentareGenau } from '../hilfe/quelltext.mts';

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
 * Kein YAML-Paket im Projekt (und keines nötig): die Dateien sind von Hand
 * geschrieben und regelmässig eingerückt — Jobs mit zwei Leerzeichen, ihre
 * Schlüssel mit vier, die Schritte darunter. `run: |` sammelt die folgenden
 * Zeilen, die tiefer stehen als der Schlüssel. Eine Datei, die anders
 * eingerückt ist, ergibt hier keinen Job — und genau das prüft §1, statt
 * sie still für leer zu halten.
 * ========================================================================*/
type Aufgabe = {
  /** Die Ablaufdatei unter `.github/workflows/`, aus der der Job stammt. */
  datei: string;
  id: string;
  name: string;
  zeit: number | null;
  schrittNamen: string[];
  /** Jede Befehlszeile ganz — eine Fortsetzung mit `\` angehängt, so gelesen
   *  wie die Shell sie liest (siehe `glatt`). */
  zeilen: string[];
  /** Dieselben Zeilen, zerlegt in ihre einzelnen Befehle — ohne die, die
   *  nur etwas ausgeben (siehe `nurAusgabe`). */
  befehle: string[];
  /** Steht irgendwo im Job `continue-on-error` (ausser `false`)? */
  weiterBeiFehler: boolean;
  text: string;           // der ganze Block, Kommentare eingeschlossen
};

/** So liest die Shell eine Zeile: ein Kommentar beginnt mit `#` am
 *  Wortanfang und reicht bis zum Ende, und wie viel Leerraum zwischen zwei
 *  Wörtern steht, ist gleich. Ohne das wäre `npm  run pruefen` (zwei
 *  Leerzeichen) kein Aufruf und `npm run pruefen # --schnell` kein voller
 *  Lauf — beides war in der ersten Fassung so (Durchsicht von E745). */
const glatt = (zeile: string): string =>
  zeile.replace(/(^|\s)#.*$/, '$1').replace(/\s+/g, ' ').trim();

/** Eine Zeile kann mehrere Befehle tragen — `a && b`, `a; b`, `a || b`.
 *  Jeder zählt für sich: ein `npm run pruefen -- --liste && npm run pruefen`
 *  ist ein voller Lauf, auch wenn die Zeile mit der Liste beginnt. Eine
 *  Röhre (`a | b`) bleibt EIN Befehl: hinter `| tee` endet der Schritt mit
 *  dem Ergebnis von `tee`, und das ist nicht der schnelle Lauf. */
const befehleIn = (zeile: string): string[] =>
  glatt(zeile).split(/&&|\|\||;/).map(t => t.trim()).filter(Boolean);

/** Ein Befehl, der nur etwas AUSGIBT, startet nichts: ein
 *  `echo "  npm run pruefen -- --schnell …"` in einer Hilfe ist Prosa.
 *  Aber nur, solange die Ausgabe wirklich ins Protokoll geht. Steht in der
 *  ZEILE ein `$(` oder ein Backtick, wird dort etwas ausgeführt und erst das
 *  Ergebnis ausgegeben — `echo "$(npm run pruefen)"` fährt den vollen Lauf.
 *  Gefragt wird die Zeile, nicht der Befehl: `$(true; npm run pruefen)`
 *  zerfällt an `;` in zwei Stücke, und das zweite trägt kein `$(` mehr. Und
 *  eine Röhre gibt die „Prosa" einem Programm: `echo npm run pruefen | sh`.
 *  Die erste Fassung nahm jedes `echo` aus (zweite Durchsicht von E745). */
const PROSA = /^(?:echo|printf)\b/;
const nurAusgabe = (befehl: string, zeile: string): boolean =>
  PROSA.test(befehl) && !/\$\(|`/.test(zeile) && !befehl.includes('|');

const aufgabenAus = (yml: string, datei: string): Aufgabe[] => {
  const zeilen = yml.split('\n');
  const start = zeilen.findIndex(z => /^jobs:\s*$/.test(z));
  if (start < 0) return [];
  const liste: Aufgabe[] = [];
  let jetzt: Aufgabe | null = null;
  /* Der Kommentar ÜBER einem Job (zwei Leerzeichen und `#`) gehört zu dem
     Job, der darauf folgt — nicht zu dem davor. */
  let vorspann = '';
  const zeileDazu = (a: Aufgabe, zeile: string): void => {
    const g = glatt(zeile);
    if (!g) return;
    a.zeilen.push(g);
    a.befehle.push(...befehleIn(g).filter(b => !nurAusgabe(b, g)));
  };
  for (let i = start + 1; i < zeilen.length; i++) {
    const z = zeilen[i] ?? '';
    if (/^[^\s#]/.test(z)) break;                       // nächster oberster Schlüssel
    if (/^ {2}#/.test(z) || (vorspann && z.trim() === '')) { vorspann += z + '\n'; continue; }
    const kopf = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(z);
    if (kopf) {
      jetzt = { datei, id: kopf[1] ?? '', name: '', zeit: null, schrittNamen: [], zeilen: [], befehle: [],
        weiterBeiFehler: false, text: vorspann };
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
    if (/^\s+(?:-\s+)?continue-on-error:\s*(?!false\s*$)\S/.test(z)) jetzt.weiterBeiFehler = true;
    const schritt = /^\s+-\s+name:\s*(.+?)\s*$/.exec(z);
    if (schritt) jetzt.schrittNamen.push((schritt[1] ?? '').replace(/^['"]|['"]$/g, ''));
    const lauf = /^(\s+(?:-\s+)?)run:\s*(.*?)\s*$/.exec(z);
    if (!lauf) continue;
    const wert = lauf[2] ?? '';
    if (/^[|>][-+]?$/.test(wert)) {
      const gefaltet = wert.startsWith('>');          // `>`: YAML faltet die Zeilen zu einer
      const spalte = (lauf[1] ?? '').length;          // Spalte von `run`
      let offen = '';                                 // eine Zeile, die mit `\` weitergeht
      for (let k = i + 1; k < zeilen.length; k++) {
        const b = zeilen[k] ?? '';
        if (b.trim() === '') continue;
        if ((b.match(/^ */)?.[0].length ?? 0) <= spalte) break;
        jetzt.text += b + '\n';
        const t = b.trim();
        i = k;
        if (t.startsWith('#') && !offen) continue;
        if (gefaltet || t.endsWith('\\')) { offen += t.replace(/\\$/, '') + ' '; continue; }
        zeileDazu(jetzt, offen + t);
        offen = '';
      }
      if (offen) zeileDazu(jetzt, offen);
    } else if (wert) {
      zeileDazu(jetzt, wert.replace(/^(['"])(.*)\1$/, '$2'));
    }
  }
  return liste;
};

/* JEDE Ablaufdatei, nicht nur pruefen.yml: ein voller Lauf in einer zweiten
   Datei fährt genauso bei jedem Push (zweite Durchsicht von E745). */
const ABLAEUFE = '.github/workflows';
const ablaufDateien = fs.readdirSync(path.join(WURZEL, ABLAEUFE)).filter(f => /\.ya?ml$/.test(f)).sort();
const jobsJeDatei = new Map<string, Aufgabe[]>(
  ablaufDateien.map(f => [f, aufgabenAus(lies(ABLAEUFE + '/' + f), f)]));
const aufgaben = [...jobsJeDatei.values()].flat();
/** Wo ein Job steht, für die Meldungen: Datei und Kennung. */
const wo = (a: Aufgabe): string => a.datei + '/' + a.id;
for (const [f, jobs] of jobsJeDatei) {
  console.log('\n    Jobs in ' + f + ': ' +
    (jobs.map(a => a.id + ' („' + a.name + '", ' + (a.zeit ?? '—') + ' min)').join(' · ') || 'KEINER'));
}

/** Die Schreibweisen, die den Orchestrator oder den Lauf in Stücken
 *  starten — gesucht ÜBERALL im Befehl, nicht nur am Anfang: `timeout 3600
 *  npm run pruefen`, `npx tsx pruefungen/alle.mts` und `env X=1 npm test`
 *  sind Aufrufe. `npm test` gehört dazu, auch wenn package.json heute kein
 *  `test` kennt: wer es einträgt, soll es nicht an diesem Lauf vorbei in die
 *  CI bringen. Eine Liste, kein Beweis (Kopf, „Was er nicht hält").
 *
 *  `SCHALTER` ist ein Schalter vor dem Unterbefehl, mit oder ohne Wert:
 *  `--silent`, `--prefix=.`, aber auch `--prefix .` und `-C .` — npm nimmt
 *  den Wert dann aus dem nächsten Wort. Die erste Fassung kannte nur
 *  Schalter ohne eigenes Wort, und `npm --prefix . run pruefen` kam vorbei.
 *  `node --run` ist Nodes eigener Skriptstarter (seit Node 22): er liest
 *  package.json wie npm und kam ebenso vorbei (zweite Durchsicht von E745). */
const SCHALTER = String.raw`(?:\s+-\S+(?:\s+[^\s-]\S*)?)*`;
const AUFRUFE: readonly RegExp[] = [
  new RegExp(String.raw`\b(?:npm|pnpm|yarn)\b${SCHALTER}\s+(?:run|run-script)\b${SCHALTER}\s+(?:pruefen|test)\b`),
  new RegExp(String.raw`\b(?:npm|pnpm|yarn)\b${SCHALTER}\s+(?:test|tst|t|it|install-test)\b`),
  /\bnode\b.*?\s--run(?:=|\s+)(?:pruefen|test)\b/,
  /(?:^|[\s/=])alle\.mts\b/,
  /(?:^|[\s/=])volllauf\.mts\b/,
];
/** Prosa (`nurAusgabe`) ist schon beim Lesen aus den Befehlen gefallen. */
const istOrchestrator = (b: string): boolean => AUFRUFE.some(m => m.test(b));

/** Fährt dieser Befehl den VOLLEN Lauf? Der Lauf in Stücken immer; sonst
 *  ein Aufruf ohne Auswahl (keine Nummer, kein `--schnell`, kein `server`,
 *  kein `--liste`). */
const istVoll = (b: string): boolean => {
  if (!istOrchestrator(b)) return false;
  if (/volllauf\.mts\b/.test(b)) return true;
  const treffer = AUFRUFE.map(m => m.exec(b)).find(t => t !== null) ?? null;
  const rest = treffer ? b.slice(treffer.index + treffer[0].length) : b;
  return !/--schnell\b|--liste\b|\bserver\b|(^|\s)\d+(\s|$)/.test(rest);
};

/* ==========================================================================
 * 1 · KEIN JOB FÄHRT DEN VOLLEN LAUF (Redurs Weg (c), E745)
 * ========================================================================*/
console.log('\n1 · Der volle Lauf bleibt auf dem Rechner');

const leereDateien = ablaufDateien.filter(f => (jobsJeDatei.get(f) ?? []).length === 0);
p('Jede Ablaufdatei unter .github/workflows/ ergibt mindestens einen Job (sonst wäre sie still ungeprüft)',
  ablaufDateien.length > 0 && leereDateien.length === 0,
  ablaufDateien.length === 0 ? 'keine Ablaufdatei' : leereDateien.join(', '));

const vollJobs = aufgaben.filter(a => a.befehle.some(istVoll));
p('Kein Job der CI fährt den vollen Lauf — er bleibt bei volllauf.mts (§30, L254)',
  aufgaben.length > 0 && vollJobs.length === 0,
  aufgaben.length === 0 ? 'keine Jobs gelesen'
    : vollJobs.map(a => wo(a) + ': ' + a.befehle.filter(istVoll).join(' | ')).join(' · '));

/* Ohne den Leser, Zeile für Zeile: jede YAML-Datei unter `.github/` — auch
   eine eigene Action (`.github/actions/…/action.yml`), deren `run:` ein Job
   über `uses:` ausführt, und eine Ablaufdatei, die anders eingerückt ist,
   als der Leser oben erwartet. Eine Fortsetzung mit `\` wird angehängt, ein
   Schlüssel `run:` vorne abgenommen; was danach einen vollen Lauf fährt, ist
   einer. Gröber als der Leser — es kennt keine Jobs und keine gefalteten
   Blöcke (`run: >`) —, aber an keine Einrückung gebunden. */
const yamlUnter = (rel: string): string[] =>
  fs.readdirSync(path.join(WURZEL, rel), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? yamlUnter(rel + '/' + e.name)
      : /\.ya?ml$/.test(e.name) ? [rel + '/' + e.name] : []);
const yamlDateien = yamlUnter('.github').sort();
const vollInZeilen = yamlDateien.flatMap(rel =>
  lies(rel).replace(/\\\r?\n\s*/g, ' ').split('\n').flatMap(roh => {
    const zeile = glatt(roh).replace(/^(?:-\s+)?run:\s*/, '').replace(/^(['"])(.*)\1$/, '$2');
    return befehleIn(zeile).filter(b => !nurAusgabe(b, zeile) && istVoll(b)).map(b => rel + ': ' + b);
  }));
console.log('    YAML unter .github/: ' + yamlDateien.join(' · '));
p('Auch Zeile für Zeile steht in keiner YAML-Datei unter .github/ ein voller Lauf (auch nicht in einer eigenen Action)',
  yamlDateien.length > 0 && vollInZeilen.length === 0, vollInZeilen.join(' · '));

const behauptetAlle = (a: Aufgabe): boolean =>
  [a.name, ...a.schrittNamen].some(n => /(^|[^\p{L}])alle([^\p{L}]|$)/iu.test(n));
const falscheBehauptung = aufgaben.filter(a => behauptetAlle(a) && !a.befehle.some(istVoll));
p('Kein Job heisst „alle", der nicht alle fährt',
  falscheBehauptung.length === 0,
  falscheBehauptung.map(a => wo(a) + ' („' + a.name + '")').join(', '));

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
    .map(b => wo(a) + ': ' + b));
p('… und jeder Aufruf des Orchestrators in der CI ist genau dieser (oder seine Liste)',
  andereAufrufe.length === 0, andereAufrufe.join(' · '));

/* `npm run pruefen` ist nur so viel wert wie das, was package.json darunter
   einträgt — und npm führt `prepruefen` und `postpruefen` von selbst davor
   und danach aus. Ein voller Lauf dort käme an jeder Zeile oben vorbei. */
const paket = JSON.parse(lies('package.json')) as { scripts?: Record<string, string> };
const skripte = paket.scripts ?? {};
p('package.json: `pruefen` ist genau `node pruefungen/alle.mts`, ohne prepruefen und postpruefen',
  skripte['pruefen'] === 'node pruefungen/alle.mts' && !('prepruefen' in skripte) && !('postpruefen' in skripte),
  JSON.stringify({ pruefen: skripte['pruefen'], prepruefen: skripte['prepruefen'], postpruefen: skripte['postpruefen'] }));

const ohneZeit = aufgaben.filter(a => !(a.zeit !== null && a.zeit > 0));
p('Jeder Job hat eine Zeitgrenze (timeout-minutes)', aufgaben.length > 0 && ohneZeit.length === 0,
  ohneZeit.map(wo).join(', '));

const schnell = schnelle[0];

/* Ein Rot soll den Job rot machen. `npm run pruefen -- --schnell || true`
   zerlegt sich in den schnellen Lauf und ein `true` — beide Befehle für sich
   unverdächtig, zusammen ein Job, der immer grün ist. Dasselbe tun eine
   Röhre (`| tee …` ohne pipefail) und `continue-on-error`. Diese drei Formen
   fängt die Zusage unten; `set +e`, eine `shell:` ohne `-e` und ein `if:`
   fängt sie nicht (Kopf, „Was er nicht hält"). Hier stand bis zur zweiten
   Durchsicht „und ein Rot bricht den Job ab" — mehr, als sie prüft. */
const zeilenMitSchnell = schnell
  ? schnell.zeilen.filter(z => befehleIn(z).some(b => !nurAusgabe(b, z) && b.includes(SCHNELL)))
  : [];
p('Der schnelle Lauf steht allein in seiner Zeile — kein `|| true`, keine Röhre, kein continue-on-error',
  !!schnell && zeilenMitSchnell.includes(SCHNELL) && !schnell.weiterBeiFehler &&
    zeilenMitSchnell.every(z => z === SCHNELL || z === SCHNELL + ' --liste'),
  schnell ? zeilenMitSchnell.join(' · ') + (schnell.weiterBeiFehler ? ' · continue-on-error' : '') : 'kein Job');
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

/** Startet dieser Lauf einen Browser? Zwei Wege, siehe Kopf — sie werden
 *  VERGLICHEN, nicht vereinigt. Weg 1 ist der von alle.mts, Weg 2 liest den
 *  Aufruf im Code ohne Kommentare. */
const LAEDT_PLAYWRIGHT = /\bfrom\s+['"]playwright(?:-core)?['"]|\bimport\(\s*['"]playwright(?:-core)?['"]\s*\)|\brequire\(\s*['"]playwright(?:-core)?['"]\s*\)/;
const RUFT_BROWSER = /\b(?:chromium|firefox|webkit)\s*\.\s*launch(?:PersistentContext)?\s*\(|\.connectOverCDP\s*\(/;

/* Kann Weg 2 an der Falle vorbei, an der die erste Fassung hängenblieb?
   Eine Probe derselben Bauart wie test587: eine Zeichenkette mit `/*` vor
   dem Aufruf und ein echter Kommentar danach — für einen Filter, der
   Zeichenketten nicht kennt, reicht der Kommentar vom `/*` in der
   Zeichenkette bis dorthin und verschluckt den Aufruf. Und die Gegenrichtung: ein Aufruf, der nur in einem Kommentar
   steht, zählt nicht. Der Aufruf ist hier zusammengesetzt, damit dieser
   Lauf ihn nicht selbst als Zeichenkette im Code trägt — Weg 2 lässt
   Zeichenketten stehen und hielte test610 sonst für einen Browserlauf. */
const AUFRUF = ['chromium', 'launch()'].join('.');
const PROBE_FALLE = "const art = 'image/" + "*';\nconst b = await " + AUFRUF + ";\n/" + "* ein echter Kommentar *" + "/\n";
const PROBE_KOMMENTAR = 'const b = 1; /' + '* await ' + AUFRUF + ' *' + '/\n// await ' + AUFRUF + '\n';
p('Weg 2 liest an einer Zeichenkette mit „/*" vorbei (die Falle aus test587) und zählt keinen Aufruf im Kommentar',
  RUFT_BROWSER.test(ohneKommentareGenau(PROBE_FALLE)) && !RUFT_BROWSER.test(ohneKommentareGenau(PROBE_KOMMENTAR)));
console.log('    zum Vergleich: `nurCode` sieht den Aufruf in der Probe ' +
  (RUFT_BROWSER.test(nurCode(PROBE_FALLE)) ? 'auch' : 'NICHT — das war die erste Fassung'));

const wegImport = new Set<string>();
const wegAufruf = new Set<string>();
const alleLaeufe: string[] = [];
for (const f of fs.readdirSync(LAUF).filter(f => /\.mts$/.test(f)).sort()) {
  const name = f.replace(/\.mts$/, '');
  alleLaeufe.push(name);
  const roh = fs.readFileSync(path.join(LAUF, f), 'utf8');
  if (LAEDT_PLAYWRIGHT.test(roh)) wegImport.add(name);
  if (RUFT_BROWSER.test(ohneKommentareGenau(roh))) wegAufruf.add(name);
}
const browserLaeufe = new Set<string>([...wegImport, ...wegAufruf]);
console.log('    gelesen: ' + alleLaeufe.length + ' Läufe · Weg 1 (lädt Playwright) ' + wegImport.size +
  ' · Weg 2 (ruft den Browser, im Code ohne Kommentare) ' + wegAufruf.size +
  ' · ohne Browser ' + (alleLaeufe.length - browserLaeufe.size));
const nurWeg1 = [...wegImport].filter(n => !wegAufruf.has(n));
const nurWeg2 = [...wegAufruf].filter(n => !wegImport.has(n));
p('Beide Wege finden dieselben Browserläufe',
  wegImport.size > 0 && nurWeg1.length === 0 && nurWeg2.length === 0,
  'nur Weg 1: ' + (nurWeg1.join(' ') || '—') + ' · nur Weg 2: ' + (nurWeg2.join(' ') || '—'));

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
