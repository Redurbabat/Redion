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
p('Es fragt die Läufe von main ab', holen.includes('actions/runs?branch=main'));
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
const vorFetch = holen.indexOf('git fetch origin main');
const frage = holen.indexOf('actions/runs?branch=main');
p('Gefragt wird VOR dem Holen', frage > 0 && frage < vorFetch, `${frage} / ${vorFetch}`);
p('Und das Skript lädt weiterhin nichts hoch', !/git push/.test(holen));

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
