/* Suite 353 — Der Dienststand folgt dem Inhalt; holen.bat wartet auf Grün; die App nennt ihren Stand (E361, L83)
 * ============================================================================
 * L83 Punkt 3: ohne erhöhte `VERSION` in sw.ts mischt der Dienst-Arbeiter
 * alte und neue Dateien, und nichts erzwang die Erhöhung. Jetzt rechnet
 * `dienststand.mts` einen Stempel über den Grundstock und hebt die Fassung
 * von selbst — und diese Suite rechnet ihn NACH: sie wird rot, sobald
 * jemand eine Datei des Grundstocks ändert und den Bau vergisst.
 * L83 Punkt 1: `holen.bat` fragt GitHub, ob der Stand geprüft ist.
 * L83 Punkt 2: „Über diese App" nennt Fassung, Bauzeit und den Weg.
 *
 *   1 · DER STEMPEL ist bestimmt, hängt an jedem Byte und jedem Pfad.
 *   2 · DER STAND STIMMT: sw.ts, stand.ts und der Grundstock sagen dasselbe.
 *   3 · DAS HEBEN: geänderter Inhalt hebt die Fassung um eins, ungeänderter
 *       nicht; --pruefen schreibt nichts.
 *   4 · DER BAUWEG: npm run bauen:ts ruft es zwischen den zwei tsc-Läufen;
 *       stand.js ist geladen und liegt offline bereit.
 *   5 · holen.bat FRAGT GITHUB — rot, läuft noch, unbekannt, und danach der
 *       Vergleich der Kennungen.
 *   6 · DIE APP nennt ihren Stand unter „Über diese App", samt Weg.
 *   7 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test353.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Stand: any; declare const Einstellungen: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { grundstock, inhaltsStempel, gelesen, abgleichen } from '../../dienststand.mts';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9363;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (rel: string): string => fs.readFileSync(path.join(WURZEL, rel), 'utf8');

/* ── 1 ────────────────────────────────────────────────────────────────── */
console.log('\n1 · Der Stempel ist bestimmt und hängt an jedem Byte und jedem Pfad');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-stand-'));
const schreib = (rel: string, inhalt: string): void => {
  fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true });
  fs.writeFileSync(path.join(tmp, rel), inhalt);
};
schreib('index.html', '<html>eins</html>');
schreib('quell/a.js', 'const a = 1;');
schreib('quell/b.css', '.a{color:red}');
const liste = ['index.html', 'quell/a.js', 'quell/b.css'];
const s1 = inhaltsStempel(tmp, liste);
const s2 = inhaltsStempel(tmp, [...liste].reverse());
p('Sechzehn Hexzeichen', /^[0-9a-f]{16}$/.test(s1), s1);
gleich('Dieselben Dateien in anderer Reihenfolge: derselbe Stempel', s2, s1);
schreib('quell/a.js', 'const a = 2;');
const s3 = inhaltsStempel(tmp, liste);
p('Ein Byte anders: ein anderer Stempel', s3 !== s1, `${s1} → ${s3}`);
schreib('quell/a.js', 'const a = 1;');
gleich('Zurückgedreht: wieder der alte', inhaltsStempel(tmp, liste), s1);
fs.renameSync(path.join(tmp, 'quell/b.css'), path.join(tmp, 'quell/c.css'));
const s4 = inhaltsStempel(tmp, ['index.html', 'quell/a.js', 'quell/c.css']);
p('Gleiche Bytes unter anderem Pfad: ein anderer Stempel', s4 !== s1, `${s1} → ${s4}`);
fs.renameSync(path.join(tmp, 'quell/c.css'), path.join(tmp, 'quell/b.css'));
schreib('quell/kern/einstellung/stand.js', 'const Stand = { fassung: 1 };');
gleich('stand.js selbst bleibt aus dem Stempel heraus (es trägt ihn)',
  inhaltsStempel(tmp, [...liste, 'quell/kern/einstellung/stand.js']), s1);

/* ── 2 ────────────────────────────────────────────────────────────────── */
console.log('\n2 · Der Stand stimmt: sw.ts, stand.ts und der Grundstock sagen dasselbe');
const swTs = lies('src/dienst/sw.ts');
const vorrat = grundstock(swTs);
p('Der Grundstock hat mehr als fünfzig Einträge', vorrat.length > 50, String(vorrat.length));
const echt = gelesen(WURZEL);
p('sw.ts und stand.ts nennen dieselbe Fassung', echt.fassungSw === echt.stand.fassung && echt.fassungSw > 0,
  `sw ${echt.fassungSw}, stand ${echt.stand.fassung}`);
const jetzt = inhaltsStempel(WURZEL, vorrat);
gleich('Der Stempel in stand.ts ist der Stempel des Grundstocks — sonst wurde eine Datei geändert und der Bau vergessen',
  echt.stand.inhalt, jetzt);
p('… und ein Bauzeitpunkt steht da', /^\d{4}-\d{2}-\d{2}T/.test(echt.stand.gebaut), echt.stand.gebaut);
gleich('--pruefen sagt: nicht veraltet', abgleichen(WURZEL, true).veraltet, false);
const standJs = lies('quell/kern/einstellung/stand.js');
p('stand.js ist gebaut und trägt dieselbe Fassung', standJs.includes(`fassung: ${echt.stand.fassung}`) && standJs.includes(echt.stand.inhalt));

/* ── 3 ────────────────────────────────────────────────────────────────── */
console.log('\n3 · Das Heben: geänderter Inhalt hebt die Fassung um eins, ungeänderter nicht');
schreib('src/dienst/sw.ts', "const VERSION = 'notizen-v7';\nconst GRUNDSTOCK = [\n  './index.html',\n  './quell/a.js',\n  './quell/b.css',\n  './quell/kern/einstellung/stand.js',\n];\n");
const e1 = abgleichen(tmp, false);
p('Ohne stand.ts: geschrieben, Fassung 8 (eine Stufe über sw.ts)', e1.geschrieben && e1.stand.fassung === 8, JSON.stringify(e1));
p('… sw.ts trägt jetzt v8', /const VERSION = 'notizen-v8';/.test(fs.readFileSync(path.join(tmp, 'src/dienst/sw.ts'), 'utf8')));
const standTs = fs.readFileSync(path.join(tmp, 'src/kern/einstellung/stand.ts'), 'utf8');
p('… stand.ts trägt Fassung, Stempel und Zeit', standTs.includes('fassung: 8') && standTs.includes(`inhalt: '${s1}'`) && /gebaut: '\d{4}-/.test(standTs));
const e2 = abgleichen(tmp, false);
gleich('Noch einmal ohne Änderung: nichts geschrieben, nicht veraltet', [e2.geschrieben, e2.veraltet, e2.stand.fassung], [false, false, 8]);
const gebaut1 = /gebaut: '([^']*)'/.exec(standTs)?.[1];
schreib('quell/a.js', 'const a = 3;');
const e3p = abgleichen(tmp, true);
p('--pruefen nach einer Änderung: veraltet, aber nichts geschrieben', e3p.veraltet && !e3p.geschrieben &&
  /notizen-v8/.test(fs.readFileSync(path.join(tmp, 'src/dienst/sw.ts'), 'utf8')), JSON.stringify(e3p));
await new Promise(f => setTimeout(f, 20));
const e3 = abgleichen(tmp, false);
gleich('Heben nach der Änderung: Fassung 9', [e3.geschrieben, e3.stand.fassung], [true, 9]);
p('… mit neuem Stempel und neuer Bauzeit', e3.stand.inhalt !== s1 && e3.stand.gebaut !== gebaut1, `${e3.stand.gebaut} nach ${gebaut1}`);
schreib('src/dienst/sw.ts', fs.readFileSync(path.join(tmp, 'src/dienst/sw.ts'), 'utf8').replace("notizen-v9", "notizen-v20"));
const e4 = abgleichen(tmp, false);
gleich('Eine von Hand höher gesetzte Fassung bleibt höher (20), ohne Änderung keine Stufe', e4.stand.fassung, 20);
fs.rmSync(tmp, { recursive: true, force: true });

/* ── 4 ────────────────────────────────────────────────────────────────── */
console.log('\n4 · Der Bauweg');
const paket = JSON.parse(lies('package.json'));
const bauen = String(paket.scripts?.['bauen:ts'] || '');
p('npm run bauen:ts ruft dienststand.mts nach dem Bau und baut stand.ts danach noch einmal',
  /tsc -p tsconfig\.bauen\.json && node dienststand\.mts && tsc -p tsconfig\.stand\.json && tsc -p tsconfig\.sw\.json/.test(bauen), bauen);
p('… und es gibt npm run stand zum blossen Prüfen', /dienststand\.mts --pruefen/.test(String(paket.scripts?.stand || '')));
const html = lies('index.html');
const ladeStand = html.indexOf('quell/kern/einstellung/stand.js');
const ladeApp = html.indexOf('quell/kern/einstellung/app.js');
p('index.html lädt stand.js, und zwar vor app.js', ladeStand > 0 && ladeStand < ladeApp, `${ladeStand} / ${ladeApp}`);
p('Der Grundstock legt stand.js offline bereit', vorrat.includes('quell/kern/einstellung/stand.js'));
p('Der schnelle CI-Job prüft den Stand (rot, wenn der Bau vergessen wurde)', lies('.github/workflows/pruefen.yml').includes('npm run stand'));

/* ── 5 ────────────────────────────────────────────────────────────────── */
console.log('\n5 · holen.bat fragt GitHub, ob der Stand geprüft ist');
const holen = lies('holen.bat');
p('Es fragt die Läufe des Zweigs ab, den es holt',
  holen.includes('actions/runs?branch=%ZIEL%'));
/* JE ZWEIG SEINE FRAGE: zwischen der Meldung und dem Weiter muss das
   `choice` stehen — eine einzige Frage irgendwo in der Datei reicht nicht
   (die erste Fassung dieses Punkts liess genau das durch, Mutation d). */
const zweigFragt = (marke: string): boolean => {
  const von = holen.indexOf(marke);
  if (von < 0) return false;
  const bis = holen.indexOf('lauf_geklaert', von);
  return bis > von && /choice \/c JN \/t 30 \/d N/.test(holen.slice(von, bis));
};
p('Rot heisst: fragen, und nach 30 Sekunden ist die Antwort Nein', zweigFragt('ist ROT'));
p('Läuft noch heisst: dasselbe', zweigFragt('LAEUFT NOCH'));
p('Ohne Antwort: Warnung, kein Abbruch — holen darf man immer', holen.includes('unbekannt') && holen.includes('Geholt wird trotzdem'));
p('Grün wird genannt, mit Kennung', holen.includes('GRUEN'));
p('Nach dem Holen: die Kennung des Geprüften gegen die des Geholten', holen.includes('Geprueft wurde ein anderer Stand'));
const vorFetch = holen.indexOf('git fetch origin %ZIEL%');
const frage = holen.indexOf('actions/runs?branch=%ZIEL%');
p('Gefragt wird VOR dem Holen', frage > 0 && frage < vorFetch, `${frage} / ${vorFetch}`);
p('Und das Skript lädt weiterhin nichts hoch', !/git push/.test(holen));

/* ── 5a — EIN ZWEIG STATT main (E517) ─────────────────────────────────────
   Redur, 9. September: „gebe mir immer nach jeder Änderung, wie kann ich die
   aktuelle GitHub-Version auf Laptop speichern."

   Das ging nicht. `holen.bat` holte fest `main`, und `main` bewegt sich erst,
   wenn ein voller Lauf grün ist (§46) — der Arbeitsstand liegt auf einem
   Zweig und war vom Laptop aus nicht erreichbar. Kein Fehler, aber es sah
   aus wie einer: der Laptop zeigte tagelang denselben Stand.

   DIE ZUSAGE HAT ZWEI HÄLFTEN, und die zweite ist die wichtigere:
     · ohne Angabe bleibt es `main` — wer doppelklickt, bekommt weiterhin den
       GEPRÜFTEN Stand, nicht den letzten;
     · und `holen-zweig.bat` hat KEINE eigene Logik. Alles, was rettet und
       warnt, steht in `holen.bat`. Zwei Dateien mit derselben Rettungslogik
       laufen nach dem dritten Durchgang auseinander (§8). */
console.log('\n5a · Ein Zweig statt main — und nur EINE Datei mit Logik');
p('Ohne Angabe bleibt es main', /set "ZIEL=%~1"/.test(holen) && /if "%ZIEL%"=="" set "ZIEL=main"/.test(holen));
p('Ein anderer Zweig wird als Arbeitsstand angesagt, nicht als geprüfter',
  /ARBEITSZWEIG, nicht  main/.test(holen));
/* JEDER git-BEFEHL MUSS DEN ZWEIG NEHMEN. Ein einziger vergessener
   `origin/main` mitten drin holt den Arbeitsstand und setzt danach auf
   main zurück — und das Fenster meldet Erfolg. Genau der Fund aus E271,
   eine Ebene höher. */
for (const [was, muster] of [
  ['fetch',        /git fetch origin %ZIEL%/],
  ['rev-parse',    /git rev-parse --verify --quiet origin\/%ZIEL%/],
  ['der Vergleich',/git rev-parse origin\/%ZIEL%/],
  ['das Protokoll',/HEAD\.\.origin\/%ZIEL%/],
  ['die Zählung',  /origin\/%ZIEL%\.\.HEAD/],
  ['der Umzug',    /git checkout -B "%ZIEL%" "origin\/%ZIEL%"/]
] as Array<[string, RegExp]>) {
  p('… und ' + was + ' nimmt ihn auch', muster.test(holen));
}
p('Kein fest verdrahtetes origin/main mehr im Ablauf',
  !/origin\/main/.test(holen.replace(/^REM.*$/gm, '')));
/* DER NAME WIRD IN ANFÜHRUNGSZEICHEN GEREICHT. Ein Zweig heisst hier
   `claude/…` und trägt einen Schrägstrich; ohne Anführungszeichen zerlegt
   die Eingabeaufforderung ihn nicht, aber ein Leerzeichen täte es. */
p('Der Name wird in Anführungszeichen gereicht',
  /git checkout -B "%ZIEL%"/.test(holen) && /git branch "sicherung\/vor-holen-%STEMPEL%-ort" "%ZIEL%"/.test(holen));

const zweigBat = lies('holen-zweig.bat');
p('Es gibt holen-zweig.bat', zweigBat.length > 500, String(zweigBat.length));
p('… und es ruft holen.bat mit dem Namen auf',
  /call "%~dp0holen\.bat" "%ZIEL%"/.test(zweigBat));
p('… schlägt den Zweig vor, auf dem der Ordner gerade steht',
  /git rev-parse --abbrev-ref HEAD/.test(zweigBat) && /Zweig \[%VORGABE%\]/.test(zweigBat));
/* KEINE ZWEITE RETTUNGSLOGIK. Das ist die Zusage, die den §8-Fehler hält. */
for (const [name, muster] of [
  ['checkout', /git checkout/],
  ['branch',   /git branch/],
  ['stash',    /git stash/],
  ['reset',    /git reset/],
  ['fetch',    /git fetch/],
  ['merge',    /git merge/],
  ['push',     /git push/]
] as Array<[string, RegExp]>) {
  p('holen-zweig.bat macht kein ' + name + ' — die Logik steht in holen.bat',
    !muster.test(zweigBat));
}

/* ── 5a2 — UND JETZT WIRKLICH GEFAHREN ────────────────────────────────────
   Batch läuft in diesem Container nicht (Linux). Die GIT-BEFEHLE darin
   laufen sehr wohl — und genau sie sind das Risiko, nicht die Hülle.
   Nachgefahren wird deshalb dieselbe Folge in einem echten Wegwerf-Repo,
   mit einem Zweignamen MIT SCHRÄGSTRICH, wie ihn dieses Projekt benutzt. */
console.log('\n5a2 · Dieselbe Befehlsfolge in einem echten Repo gefahren');
{
  const heim = fs.mkdtempSync(path.join(os.tmpdir(), 'holen-'));
  const fern = path.join(heim, 'fern');
  const hier = path.join(heim, 'hier');
  const ZWEIG = 'claude/probe-mit-schraegstrich';
  const git = (wo: string, ...args: string[]): string => {
    const r = spawnSync('git', args, { cwd: wo, encoding: 'utf8' });
    return (r.stdout || '') + (r.stderr || '');
  };
  try {
    fs.mkdirSync(fern);
    git(fern, 'init', '-q', '-b', 'main');
    git(fern, 'config', 'user.email', 'probe@redion.test');
    git(fern, 'config', 'user.name', 'Probe');
    fs.writeFileSync(path.join(fern, 'index.html'), 'alt');
    git(fern, 'add', '-A'); git(fern, 'commit', '-qm', 'main');
    git(fern, 'checkout', '-q', '-b', ZWEIG);
    fs.writeFileSync(path.join(fern, 'index.html'), 'neu vom Zweig');
    git(fern, 'add', '-A'); git(fern, 'commit', '-qm', 'zweig');
    git(fern, 'checkout', '-q', 'main');

    git(heim, 'clone', '-q', fern, 'hier');
    git(hier, 'config', 'user.email', 'probe@redion.test');
    git(hier, 'config', 'user.name', 'Probe');
    gleich('Der Klon steht auf main mit dem alten Inhalt',
      fs.readFileSync(path.join(hier, 'index.html'), 'utf8'), 'alt');

    /* Genau die Folge aus holen.bat, mit %ZIEL% = dem Zweig. */
    git(hier, 'fetch', 'origin', ZWEIG);
    const gibt = spawnSync('git', ['rev-parse', '--verify', '--quiet', 'origin/' + ZWEIG],
                           { cwd: hier, encoding: 'utf8' });
    p('rev-parse findet den Zweig auf der Gegenseite', gibt.status === 0, gibt.stdout.trim());
    git(hier, 'checkout', '-B', ZWEIG, 'origin/' + ZWEIG);
    gleich('Nach dem Umzug steht der Inhalt DES ZWEIGS da',
      fs.readFileSync(path.join(hier, 'index.html'), 'utf8'), 'neu vom Zweig');
    gleich('… und der Ordner steht wirklich auf diesem Zweig',
      git(hier, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), ZWEIG);

    /* UND DIE RETTUNG GREIFT AUCH HIER. Eigene Arbeit auf dem Zweig darf
       der nächste Lauf nicht wegnehmen — dieselbe Zusage wie bei main. */
    fs.writeFileSync(path.join(hier, 'eigenes.txt'), 'meine Arbeit');
    git(hier, 'add', '-A'); git(hier, 'commit', '-qm', 'eigenes');
    const eigene = git(hier, 'rev-list', '--count', 'origin/' + ZWEIG + '..HEAD').trim();
    gleich('Ein eigener Commit auf dem Zweig wird gezählt', eigene, '1');
    git(hier, 'branch', 'sicherung/vor-holen-probe');
    git(hier, 'checkout', '-B', ZWEIG, 'origin/' + ZWEIG);
    p('… und liegt nach dem Umzug in der Sicherung, nicht im Nichts',
      /eigenes/.test(git(hier, 'log', '--oneline', 'sicherung/vor-holen-probe')),
      git(hier, 'log', '--oneline', 'sicherung/vor-holen-probe').slice(0, 120));
  } finally {
    fs.rmSync(heim, { recursive: true, force: true });
  }
}

/* ── 5b ───────────────────────────────────────────────────────────────── */
console.log('\n5b · vergleichen.bat sieht nur nach und faesst nichts an');
/* DIE DRITTE RICHTUNG (E438). Redur fragte, wie er seinen Stand mit GitHub
   vergleicht; die Antwort war bis dahin "starte holen.bat und lies mit" —
   nur HOLT das eben auch. Ein Skript, das nur nachsieht, darf nichts
   veraendern, und genau das wird hier gemessen.
   STATISCH GEPRUEFT, und das ist eine Grenze, die dabeistehen muss: dieser
   Container ist Linux und kann kein Windows-Batch ausfuehren. Geprueft wird
   der Text, nicht der Lauf. Die git-Befehle darin sind einzeln von Hand
   nachgefahren worden; die Batch-Huelle ist gespiegelt von holen.bat. */
const vergl = lies('vergleichen.bat');
p('Es gibt die Datei', vergl.length > 500, String(vergl.length));
/* Die verbotenen Befehle — jeder einzeln, damit der Bericht sagt WELCHER. */
for (const [name, muster] of [
  ['push',    /git push/],
  ['checkout',/git checkout/],
  ['merge',   /git merge/],
  ['reset',   /git reset/],
  ['stash',   /git stash/],
  ['pull',    /git pull/],
  ['clean',   /git clean/],
  ['restore', /git restore/]
] as Array<[string, RegExp]>) {
  p('Kein ' + name + ' — es veraendert nichts', !muster.test(vergl));
}
/* Und der eine Schreibvorgang, den es geben DARF, ist benannt. */
p('Es holt den Fernstand mit fetch', /git fetch origin main/.test(vergl));
p('… und sagt selbst, dass das der einzige Schreibvorgang ist',
  /einzige Schreibvorgang/.test(vergl));
/* Die Kernfrage wird ueber INHALTE beantwortet, nicht ueber Kennungen —
   dieselbe Lehre, die holen.bat in E271 gekostet hat. */
p('Der Vergleich fragt nach den Dateien, nicht nach den Kennungen',
  /git diff --name-only origin\/main HEAD/.test(vergl));
/* Kein `find /c`: die Zahl kommt mit fuehrenden Leerzeichen und der
   Vergleich schlaegt still fehl. */
p('Es zaehlt nicht mit find /c, sondern fragt ob es Ausgabe gibt',
  !/find \/c/.test(vergl.replace(/^REM.*$/gm, '')) && /if not defined ANDERS/.test(vergl));
/* Die Zaehler sind vorbelegt, sonst wird aus "" != "0" immer wahr. */
p('Die Schrittzaehler sind mit 0 vorbelegt',
  /set "VOR=0"/.test(vergl) && /set "ZURUECK=0"/.test(vergl));
/* Und es sagt, was es NICHT vergleichen kann — die Notizen des Nutzers. */
p('Es erklaert, dass die eigenen Notizen nicht auf GitHub liegen',
  /verlassen ihn nie/.test(vergl) && /\.redion/.test(vergl));
p('Es sagt am Ende zu, nichts geaendert zu haben',
  /nichts an deinen Dateien geaendert/.test(vergl));

/* ── 6 ────────────────────────────────────────────────────────────────── */
console.log('\n6 · Die App nennt ihren Stand unter „Über diese App", samt Weg');
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });
const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const pg = await ktx.newPage();
pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pg.goto(`http://localhost:${PORT}/index.html`);
await pg.waitForTimeout(2800);
const ueber = await pg.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  Einstellungen.oeffne('ueber');
  await new Promise(f => setTimeout(f, 400));
  const zeile = document.querySelector<HTMLElement>('.ez-stand');
  return { da: !!zeile, text: zeile?.textContent ?? '', fassung: zeile?.dataset['fassung'] ?? '',
    stand: typeof Stand !== 'undefined' ? { fassung: Stand.fassung, inhalt: Stand.inhalt } : null };
});
p('Unter „Über diese App" steht eine Zeile „Stand"', ueber.da, JSON.stringify(ueber));
gleich('… mit der Fassung aus stand.ts', ueber.fassung, 'v' + echt.stand.fassung);
p('… dem Bauzeitpunkt', /gebaut \d+\. \S+ \d{4}/.test(ueber.text), ueber.text);
p('… und dem Weg: hier der örtliche Server', ueber.text.includes('örtlicher Server'), ueber.text);
p('Der Stand ist als Global lesbar, mit demselben Stempel', ueber.stand?.inhalt === echt.stand.inhalt, JSON.stringify(ueber.stand));
await ktx.close();

/* ── 7 ────────────────────────────────────────────────────────────────── */
console.log('\n7 · Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
