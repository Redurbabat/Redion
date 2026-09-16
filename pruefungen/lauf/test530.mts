/* Suite 530 — Der Ablagename folgt dem INHALT, nicht der Nummer (E610, L83)
 * ============================================================================
 * DER FUND. Am 16. September stand `const ABLAGE = VERSION;` — die Ablage des
 * Dienst-Arbeiters hiess also nach der Fassungsnummer allein. Solange die
 * Nummer nur steigt, geht das gut. Sie steigt aber nicht immer:
 *
 *   E608 hob sie auf v1145 und entfernte das Auge am Ordner.
 *   E609 nahm E608 mit `git revert` zurück — und weil der Bogen `sw.ts` und
 *   `stand.ts` mit angefasst hatte, ging die Nummer MIT zurück, auf v1141.
 *
 * Damit sind v1142 bis v1145 wieder frei, und der nächste Bogen vergibt sie
 * ein zweites Mal — mit anderem Inhalt. Wer die erste v1142 im Browser hat,
 * bekommt beim zweiten Mal DIESELBE Ablage geöffnet (`caches.open(ABLAGE)`):
 * der Aufräumer in `activate` löscht nur, was ANDERS heisst, und `cache.add`
 * überschreibt nur die Pfade, die der neue Grundstock noch nennt. Eine Datei,
 * die aus dem Grundstock gefallen ist, bleibt liegen und wird weiter bedient.
 * Genau das verbietet §28: „Der Service Worker darf keine alten kritischen
 * Dateien endlos halten."
 *
 * DIE REGEL, die dieser Lauf hält: der Ablagename trägt den Inhaltsstempel.
 * Zwei verschiedene Inhalte können dann nie dieselbe Ablage benutzen — auch
 * dann nicht, wenn ihre Nummer gleich ist. Und zwei gleiche Inhalte teilen
 * sie sehr wohl, was richtig ist: nach einem Zurücknehmen sind die Bytes
 * wieder dieselben.
 *
 *   1 · IM QUELLTEXT: ABLAGE setzt sich aus Nummer UND Stempel zusammen,
 *       der Stempel in sw.ts stimmt mit stand.ts und dem Grundstock überein,
 *       und VERSION behält seine schlichte Form (test143 hängt daran).
 *   2 · DER FALL, DER ES AUSGELÖST HAT: gleiche Nummer, anderer Inhalt —
 *       die Ablagenamen müssen sich trotzdem unterscheiden.
 *   3 · AM ECHTEN DIENST: die Ablage im Browser heisst wirklich so, und sie
 *       ist die einzige, die stehen bleibt.
 *   4 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test530.mts
 *   node pruefungen/alle.mts 530
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { grundstock, inhaltsStempel, gelesen, abgleichen } from '../../dienststand.mts';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9530;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, a: unknown, b: unknown): void =>
  p(n, JSON.stringify(a) === JSON.stringify(b), `${JSON.stringify(a)} statt ${JSON.stringify(b)}`);

/** Der Ablagename, so wie der Dienst-Arbeiter ihn zur Laufzeit bildet —
 *  abgelesen aus dem Quelltext, nicht nachgebaut. */
const ablageAus = (swTs: string): string => {
  const version = /const VERSION = '([^']*)'/.exec(swTs)?.[1] ?? '';
  const inhalt = /const INHALT = '([^']*)'/.exec(swTs)?.[1] ?? '';
  /* Am ZEILENANFANG, nicht irgendwo: der Kommentar über der Zeile nennt
     den alten Bauplan `const ABLAGE = VERSION;` im Text, und ein Muster
     ohne Anker fand ihn zuerst — der Wächter las den Kommentar statt
     des Codes und blieb rot, obwohl die Reparatur längst stand. */
  const bauplan = /^const ABLAGE = ([^;]+);/m.exec(swTs)?.[1]?.trim() ?? '';
  /* Der Bauplan wird gelesen, nicht geraten: stünde dort wieder `VERSION`
     allein, käme hier auch nur die Nummer heraus — und §2 wird rot. */
  if (bauplan === 'VERSION') return version;
  if (/^VERSION \+ '-' \+ INHALT$/.test(bauplan)) return version + '-' + inhalt;
  return '?unbekannter Bauplan: ' + bauplan;
};

/* ── 1 ────────────────────────────────────────────────────────────────── */
console.log('\n1 · Im Quelltext: der Ablagename trägt den Stempel');
const swTs = fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8');
const echt = gelesen(WURZEL);
const stempel = inhaltsStempel(WURZEL, grundstock(swTs));
const inhaltSw = /const INHALT = '([^']*)'/.exec(swTs)?.[1] ?? '';

p('sw.ts nennt einen Inhaltsstempel', /^[0-9a-f]{16}$/.test(inhaltSw), inhaltSw || '(keiner)');
gleich('… und er ist der Stempel über den Grundstock', inhaltSw, stempel);
gleich('… und derselbe, den stand.ts trägt', inhaltSw, echt.stand.inhalt);
p('ABLAGE setzt sich aus Nummer UND Stempel zusammen',
  ablageAus(swTs) === `notizen-v${echt.stand.fassung}-${stempel}`, ablageAus(swTs));
/* test143 prüft `^notizen-v\d+$` an VERSION. Die Form bleibt deshalb
   unangetastet — der Stempel kommt daneben, nicht hinein. */
p('VERSION behält seine schlichte Form (test143 hängt daran)',
  /^notizen-v\d+$/.test(`notizen-v${echt.stand.fassung}`) &&
  /const VERSION = 'notizen-v\d+';/.test(swTs));

const swJs = fs.readFileSync(path.join(WURZEL, 'sw.js'), 'utf8');
p('Das gebaute sw.js trägt denselben Stempel', swJs.includes(stempel), stempel);
gleich('… und denselben Ablagenamen', ablageAus(swJs), ablageAus(swTs));

/* ── 2 ────────────────────────────────────────────────────────────────── */
console.log('\n2 · Der Fall, der es ausgelöst hat: gleiche Nummer, anderer Inhalt');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-530-'));
const schreib = (rel: string, text: string): void => {
  const ziel = path.join(tmp, rel);
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, text);
};
const liesSw = (): string => fs.readFileSync(path.join(tmp, 'src/dienst/sw.ts'), 'utf8');

/* Ein winziges Projekt mit demselben Bauplan wie das echte. */
const vorlage = (nummer: number): string =>
  `const VERSION = 'notizen-v${nummer}';\n` +
  `const INHALT = '';\n` +
  `const ABLAGE = ${/^const ABLAGE = ([^;]+);/m.exec(swTs)?.[1]?.trim() ?? 'VERSION'};\n` +
  `const GRUNDSTOCK = [\n  './index.html',\n  './quell/a.js',\n` +
  `  './quell/kern/einstellung/stand.js',\n];\n`;

const stempelAus = (s: string): string => /const INHALT = '([^']*)'/.exec(s)?.[1] ?? '';
const liesStand = (): string =>
  fs.readFileSync(path.join(tmp, 'src/kern/einstellung/stand.ts'), 'utf8');

/* Schritt 1 — Inhalt A. Das ist der Stand, auf den später zurückgenommen
   wird; seine beiden Dateien werden hier weggelegt wie ein Commit. */
schreib('index.html', '<!doctype html><title>A</title>');
schreib('quell/a.js', 'const a = 1;');
schreib('src/dienst/sw.ts', vorlage(1141));
abgleichen(tmp, false);
const nummerA = gelesen(tmp).stand.fassung;
const stempelA = stempelAus(liesSw());
const swBeiA = liesSw(), standBeiA = liesStand();

/* Schritt 2 — Inhalt B, der Bogen, der später zurückgenommen wird. */
schreib('quell/a.js', 'const a = 2;');
abgleichen(tmp, false);
const nummerB = gelesen(tmp).stand.fassung;
const ablageB = ablageAus(liesSw());

/* Schritt 3 — DAS ZURÜCKNEHMEN. `git revert` stellt alle Dateien des Bogens
   wieder her, sw.ts und stand.ts eingeschlossen; die Nummer fällt mit. */
schreib('quell/a.js', 'const a = 1;');
schreib('src/dienst/sw.ts', swBeiA);
schreib('src/kern/einstellung/stand.ts', standBeiA);
gleich('Nach dem Zurücknehmen steht die Nummer wieder auf der alten Stufe',
  gelesen(tmp).stand.fassung, nummerA);
gleich('… und der Stempel ist wieder derselbe wie vorher — gleiche Bytes, gleicher Name',
  stempelAus(liesSw()), stempelA);

/* Schritt 4 — der nächste Bogen. Inhalt C, und die Nummer von Schritt 2
   wird ein ZWEITES Mal vergeben. Genau hier stossen die beiden zusammen. */
schreib('quell/a.js', 'const a = 3;');
abgleichen(tmp, false);
const nummerC = gelesen(tmp).stand.fassung;
const ablageC = ablageAus(liesSw());

gleich('Die Nummer wird ein zweites Mal vergeben — der Fall ist hergestellt',
  nummerC, nummerB);
p('… aber die beiden Ablagen heißen trotzdem verschieden', ablageB !== ablageC,
  `${ablageB} gegen ${ablageC}`);
fs.rmSync(tmp, { recursive: true, force: true });

/* ── 3 ────────────────────────────────────────────────────────────────── */
console.log('\n3 · Am echten Dienst: so heißt die Ablage im Browser');
const TYPEN: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript',
  '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
  '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
const srv = http.createServer((req, res) => {
  let rein = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
  if (rein === '/') rein = '/index.html';
  const datei = path.join(WURZEL, rein);
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    res.writeHead(404); res.end('weg'); return;
  }
  res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream' });
  res.end(fs.readFileSync(datei));
});
await new Promise<void>(f => srv.listen(PORT, () => f()));

const browser = await chromium.launch();
const ktx = await browser.newContext();
const seite = await ktx.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push(String(e)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2600);
const angemeldet = await seite.evaluate(async () =>
  !!(await navigator.serviceWorker.getRegistration()));
p('Der Dienst-Arbeiter ist angemeldet', angemeldet);
await seite.waitForTimeout(2600);

const namen: string[] = await seite.evaluate(() => caches.keys());
console.log('     Ablagen im Browser: ' + JSON.stringify(namen));
gleich('Genau eine Ablage — der Aufräumer hat seine Arbeit getan', namen.length, 1);
p('… und sie heißt wie im Quelltext gerechnet', namen[0] === ablageAus(swTs),
  `${namen[0]} statt ${ablageAus(swTs)}`);
p('… der Stempel steht wirklich im Namen', (namen[0] ?? '').includes(stempel), stempel);

/* ── 4 ────────────────────────────────────────────────────────────────── */
console.log('\n4 · Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await ktx.close();
await browser.close();
srv.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
