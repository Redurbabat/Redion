/* Suite 305 — Die Lernzeit wird gemessen, nicht geraten (L110, E311)
 * ============================================================================
 * `lernwelt.ts` rechnete die Lernzeit so:
 *
 *     const ms  = zahl(eintrag.durationMs ?? eintrag.dauerMs, 0);
 *     const sek = zahl(eintrag.durationSeconds ?? eintrag.dauerSekunden, 0);
 *     minuten += ms > 0 ? ms / 60000 : sek > 0 ? sek / 60 : 1;
 *
 * Alle vier Feldnamen kamen im ganzen Bestand genau an dieser Stelle vor.
 * Niemand schreibt sie. Die Rechnung landete also IMMER im dritten Zweig —
 * eine Minute je Wiederholung — und sah dabei aus, als benutzte sie eine
 * Messung.
 *
 * Das ist die gefährliche Sorte: nicht falsch genug, um aufzufallen, und zu
 * genau aussehend, um geprüft zu werden.
 *
 *   §1 DER KERN `lerntempo.ts` rechnet richtig und ohne Uhr.
 *   §2 DIE VIER TOTEN NAMEN stehen in keinem ausführbaren Code mehr.
 *   §3 GEGENPROBE: eine erfundene Messung wird nicht behauptet.
 *   §4 IM FENSTER: erst „geschätzt", nach genug Belegen „gemessen aus N".
 *
 *   node pruefungen/lauf/test305.mts
 * ==========================================================================*/
declare const Store: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9315;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/learning/lerntempo.js'), 'utf-8'));
const T = (globalThis as any).Lerntempo;

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der Kern rechnet richtig und ohne Uhr');

const quelle = fs.readFileSync(path.join(WURZEL, 'src/core/learning/lerntempo.ts'), 'utf-8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
p('Der Kern ist geladen', !!T && typeof T.jeKarte === 'function');
gleich('Keine Uhr, keine Ablage, kein DOM',
  ['new Date', 'Date.now', 'Store.', 'document.'].filter(w => quelle.includes(w)), []);

/** Zeitpunkte im Abstand von `sek` Sekunden, `n` Stück. */
const reihe = (n: number, sek: number, ab = 1_700_000_000_000): number[] =>
  Array.from({ length: n }, (_, i) => ab + i * sek * 1000);

const m20 = T.jeKarte(reihe(20, 25));
gleich('Zwanzig Antworten im Abstand von 25 s ergeben 25 s', m20.sekunden, 25);
gleich('Aus neunzehn Abständen', m20.belege, 19);
p('Und das heisst „gemessen"', m20.gemessen === true, T.satz(m20));

/* Ein Telefonat zwischen zwei Karten. Der Median merkt es nicht — genau
   dafür ist er da. Der Mittelwert läge bei über 40 s. */
const mitPause = [...reihe(20, 25)];
const gestoert = mitPause.map((t, i) => i >= 10 ? t + 4 * 60 * 1000 : t);
gleich('Eine Unterbrechung verschiebt den Median nicht',
  T.jeKarte(gestoert).sekunden, 25);

/* Zu grosse und zu kleine Abstände zählen nicht mit. */
gleich('Abstände über fünf Minuten fallen weg', T.jeKarte(reihe(20, 600)).belege, 0);
gleich('Und Abstände unter 1,2 s auch', T.jeKarte(reihe(20, 0.4)).belege, 0);

gleich('Zwanzig Karten zu 30 s sind 10 Minuten',
  T.minutenFuer(20, { sekunden: 30, belege: 99, gemessen: true }), 10);
gleich('Und eine einzige Karte ist mindestens eine Minute',
  T.minutenFuer(1, { sekunden: 20, belege: 99, gemessen: true }), 1);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Die vier toten Namen stehen in keinem Code mehr');

const TOT = ['durationMs', 'dauerMs', 'durationSeconds', 'dauerSekunden'];
/** Kommentare weg — dort dürfen die Namen stehen, sie erklären den Fund. */
const ohneKommentar = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

const dateien: string[] = [];
const lauf = (d: string): void => {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const pf = path.join(d, e.name);
    if (e.isDirectory()) lauf(pf);
    /* Diese Datei nennt die vier Namen selbst — sie gehört nicht zum
       Bestand, den sie misst (dieselbe Falle wie in test294). */
    else if (/\.(ts|mts)$/.test(e.name) && pf !== import.meta.filename) dateien.push(pf);
  }
};
lauf(path.join(WURZEL, 'src'));
lauf(path.join(WURZEL, 'pruefungen'));
lauf(path.join(WURZEL, 'server'));

const funde: string[] = [];
for (const f of dateien) {
  const code = ohneKommentar(fs.readFileSync(f, 'utf-8'));
  for (const n of TOT)
    if (new RegExp('\\b' + n + '\\b').test(code)) funde.push(path.basename(f) + ':' + n);
}
gleich('Keiner der vier steht mehr im Code', funde, []);
p('Es wurden überhaupt Dateien gelesen', dateien.length > 300, String(dateien.length));
/* Gegenprobe: ein Name, den es WIRKLICH gibt, wird gefunden — sonst misst
   der Abschnitt nur, dass sein Ausdruck nie zutrifft. */
p('Ein echter Feldname würde dagegen auffallen',
  dateien.some(f => /\breviewVerlauf\b/.test(ohneKommentar(fs.readFileSync(f, 'utf-8')))));

/* ------------------------------------------------------------------------ */
console.log('\n3 · GEGENPROBE: ohne Belege wird nichts behauptet');

const wenig = T.jeKarte(reihe(4, 25));
p('Vier Antworten reichen nicht', wenig.gemessen === false, T.satz(wenig));
gleich('Dann gilt die Vorgabe', T.jeKarte(reihe(4, 25), 60).sekunden, 60);
p('Und der Satz sagt es', /geschätzt/.test(T.satz(wenig)), T.satz(wenig));
p('Er nennt sogar, wie viele noch fehlen',
  T.satz(wenig).includes(String(T.GENUG)), T.satz(wenig));
gleich('Ganz ohne Antworten ebenso', T.jeKarte([]).gemessen, false);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Im Fenster: erst geschätzt, dann gemessen');

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
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
const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2800);

const frisch = await pc.evaluate(async () => {
  const w = globalThis as any;
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const a = w.Lernwelt.modelle.aktivitaet();
  return { satz: String(a.tempoSatz || ''), sek: a.tempoSekunden, minuten: a.minuten };
});
p('Ein frischer Arbeitsbereich behauptet keine Messung',
  /geschätzt/.test(frisch.satz), JSON.stringify(frisch));

const voll = await pc.evaluate(async () => {
  const w = globalThis as any;
  const seite = Store.addPage(null, { text: 'Tempo-Probe', icon: '🃏' });
  /* Dreissig Antworten im Abstand von zwanzig Sekunden, verteilt auf drei
     Karten — so wie eine echte Sitzung aussieht. */
  const ab = Date.now() - 3 * 86400000;
  for (let k = 0; k < 3; k++) {
    const karte = Store.addBlock(seite.id, 'flashcard',
      { text: 'Frage ' + k, rueck: 'Antwort ' + k });
    const verlauf = Array.from({ length: 10 }, (_, i) => ({
      id: 'r' + k + '-' + i,
      at: new Date(ab + (k * 10 + i) * 20000).toISOString(),
      note: 3
    }));
    Store.updateBlock(karte.id, { reviewVerlauf: verlauf, sr: { ease: 2.5, intervall: 3, wdh: 3 } });
  }
  await Store.flush();
  const a = w.Lernwelt.modelle.aktivitaet();
  return { satz: String(a.tempoSatz || ''), sek: a.tempoSekunden, minuten: a.minuten };
});
p('Mit dreissig Antworten steht „gemessen" da',
  /gemessen/.test(voll.satz), JSON.stringify(voll));
p('Und die gemessene Dauer ist die eingetragene',
  Math.abs(Number(voll.sek) - 20) < 0.6, String(voll.sek));
/* Die eigentliche Wirkung: 30 Antworten zu 20 s sind 10 Minuten — vorher
   waren es 30, weil jede Wiederholung pauschal eine Minute zählte. */
p('Die Lernzeit ist damit die gerechnete und nicht die pauschale',
  Number(voll.minuten) === 10, JSON.stringify(voll));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
