/* Suite 321 — Geht es aufwärts? (L106 Punkt 3 und 4, E328)
 * ============================================================================
 * Zwei Lücken, eine Antwort.
 *
 *   Punkt 3: `fensterTage` konnte die Rechnung seit E289 — und keine
 *            Aufrufstelle fragte danach. §47 in seiner leisesten Form.
 *   Punkt 4: es gab keinen Vergleich über Zeit, also keine Antwort auf
 *            „geht es aufwärts".
 *
 * Der frühere Zeitraum entsteht durch ZURÜCKSTELLEN DER UHR — dieselbe
 * Rechnung, nur mit `jetzt` um ein Fenster zurück. Damit das überhaupt
 * geht, musste das Fenster erst nach oben schliessen: es war
 * [jetzt−fenster, ∞) und liess alles durch, was danach kam.
 *
 *   §1 DAS FENSTER SCHLIESST NACH OBEN — und das ist belegbar rot.
 *   §2 EIN THEMA, DAS BESSER WIRD, wird als aufwärts erkannt.
 *   §3 UND EINES, DAS SCHLECHTER WIRD, als abwärts. Beide Richtungen.
 *   §4 UNTER DER SCHWELLE heisst es „gleich" — kein Rauschen als Richtung.
 *   §5 GEGENPROBE: ohne Belege im FRÜHEREN Zeitraum kein Vergleich.
 *   §6 UND IN DER ANSICHT: der Abschnitt erscheint nur, wenn es etwas zu
 *      sagen gibt — und dann mit Zeichen, nicht nur mit Farbe (§38).
 *
 *   node pruefungen/lauf/test321.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Kompetenz: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9324;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

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
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2600);

/* Ein fester Zeitpunkt, damit nichts an der echten Uhr hängt. */
const JETZT = Date.UTC(2026, 8, 1, 12, 0, 0);
const TAG = 86400000;

const gerechnet = await pc.evaluate(({ jetzt, TAG }: { jetzt: number; TAG: number }) => {
  /**
   * Eine Karte mit Antworten zu bestimmten Zeitpunkten.
   * @param vorTagen  Liste von [wie viele Tage her, richtig?]
   */
  const karte = (id: string, thema: string,
                 antworten: Array<[number, boolean]>): any => ({
    id, thema, titel: id,
    sr: { intervall: 10, faellig: new Date(jetzt + 5 * TAG).toISOString() },
    reviewVerlauf: antworten.map(([tage, gut]) => ({
      at: new Date(jetzt - tage * TAG).toISOString(),
      rating: gut ? 4 : 1
    }))
  });

  /* ── §1: schliesst das Fenster nach oben? ──────────────────────────────
     Eine Karte, deren Antworten ALLE in den letzten 30 Tagen liegen. Mit
     einer um 90 Tage zurückgestellten Uhr und 90-Tage-Fenster darf davon
     NICHTS zählen — sie liegen alle nach diesem Zeitpunkt. */
  const nurNeu = [karte('n1', 'Neu', [[5, true], [10, true], [15, true],
                                      [20, true], [25, true], [28, true]])];
  const rueckwaerts = Kompetenz.karteAus(nurNeu[0],
    { jetzt: jetzt - 90 * TAG, fensterTage: 90 });
  const vorwaerts = Kompetenz.karteAus(nurNeu[0], { jetzt, fensterTage: 90 });
  const ohneFenster = Kompetenz.karteAus(nurNeu[0], { jetzt: jetzt - 90 * TAG });

  /* ── §2/§3/§4: drei Themen mit verschiedenen Verläufen ─────────────────
     „Früher" ist 100–180 Tage her, „jetzt" ist 5–85 Tage her. */
  const frueher = (n: number, gut: number): Array<[number, boolean]> =>
    Array.from({ length: n }, (_, i) => [100 + i * 5, i < gut] as [number, boolean]);
  const heute = (n: number, gut: number): Array<[number, boolean]> =>
    Array.from({ length: n }, (_, i) => [5 + i * 5, i < gut] as [number, boolean]);

  const karten = [
    /* Mathematik: früher 8 von 16, jetzt 15 von 16 — deutlich aufwärts. */
    karte('m1', 'Mathematik', [...frueher(16, 8), ...heute(16, 15)]),
    /* Physik: früher 15 von 16, jetzt 8 von 16 — deutlich abwärts. */
    karte('p1', 'Physik', [...frueher(16, 15), ...heute(16, 8)]),
    /* Chemie: früher 12 von 16, jetzt 12 von 16 — gleich. */
    karte('c1', 'Chemie', [...frueher(16, 12), ...heute(16, 12)]),
    /* Deutsch: NUR jetzt — kein früherer Zeitraum, also kein Vergleich. */
    karte('d1', 'Deutsch', heute(16, 14))
  ];

  const reihen = Kompetenz.verlauf(karten, { jetzt });
  const nachThema: Record<string, any> = {};
  for (const r of reihen) nachThema[r.thema] = r;

  return {
    rueckwaerts: { gesamt: rueckwaerts.gesamt, richtig: rueckwaerts.richtig },
    vorwaerts: { gesamt: vorwaerts.gesamt, richtig: vorwaerts.richtig },
    ohneFenster: { gesamt: ohneFenster.gesamt },
    themen: reihen.map((r: any) => r.thema),
    reihenfolge: reihen.map((r: any) => r.richtung),
    m: nachThema['Mathematik'], ph: nachThema['Physik'],
    ch: nachThema['Chemie'], de: nachThema['Deutsch'],
    schwelle: Kompetenz.RICHTUNG_SCHWELLE, fenster: Kompetenz.FENSTER_TAGE
  };
}, { jetzt: JETZT, TAG });

/* ------------------------------------------------------------------------ */
console.log('\n1 · Das Fenster schliesst nach oben');

/* MIT ZURÜCKGESTELLTER UHR darf nichts zählen, was danach kam. Vorher
   zählte alles — [jetzt−fenster, ∞) statt [jetzt−fenster, jetzt]. */
gleich('Zurückgestellte Uhr: keine der späteren Antworten zählt',
  gerechnet.rueckwaerts.gesamt, 0);
gleich('Mit der echten Uhr zählen alle sechs',
  gerechnet.vorwaerts.gesamt, 6);
/* GEGENPROBE ZUR REGEL SELBST: OHNE Fenster gibt es keine Schranke, weder
   nach unten noch nach oben — dann zählen sie auch bei alter Uhr mit. */
gleich('Ohne Fenster ändert sich nichts', gerechnet.ohneFenster.gesamt, 6);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Ein Thema, das besser wird');

p('Mathematik ist dabei', !!gerechnet.m, JSON.stringify(gerechnet.themen));
gleich('… und geht aufwärts', gerechnet.m?.richtung, 'auf');
p('Der Unterschied ist positiv und deutlich',
  (gerechnet.m?.unterschied || 0) >= gerechnet.schwelle,
  String(gerechnet.m?.unterschied));
p('Beide Zeiträume tragen Belege',
  (gerechnet.m?.belegeJetzt || 0) >= 5 && (gerechnet.m?.belegeVorher || 0) >= 5,
  gerechnet.m?.belegeJetzt + ' gegen ' + gerechnet.m?.belegeVorher);
p('Der Satz nennt beide Werte und die Richtung',
  /→/.test(gerechnet.m?.satz || '') && /aufwärts/.test(gerechnet.m?.satz || ''),
  gerechnet.m?.satz);
/* PROZENTPUNKTE, NICHT PROZENT. „von 60 auf 70" sind zehn Punkte. */
p('Und zählt in Punkten', /Punkte/.test(gerechnet.m?.satz || ''), gerechnet.m?.satz);

/* ------------------------------------------------------------------------ */
console.log('\n3 · Und eines, das schlechter wird');

/* BEIDE RICHTUNGEN. Eine Anzeige, die nur Fortschritt kennt, ist Werbung. */
gleich('Physik geht abwärts', gerechnet.ph?.richtung, 'ab');
p('Mit negativem Unterschied',
  (gerechnet.ph?.unterschied || 0) <= -gerechnet.schwelle,
  String(gerechnet.ph?.unterschied));
p('Und der Satz sagt es auch so',
  /abwärts/.test(gerechnet.ph?.satz || ''), gerechnet.ph?.satz);

/* DIE GRÖSSTE VERÄNDERUNG ZUERST — in beide Richtungen. Wer schlechter
   geworden ist, will das nicht zuletzt lesen. */
p('Die grösste Veränderung steht oben',
  Math.abs(gerechnet.m?.unterschied || 0) >= Math.abs(gerechnet.ch?.unterschied || 0) &&
  gerechnet.themen[gerechnet.themen.length - 1] === 'Chemie',
  JSON.stringify(gerechnet.themen));

/* ------------------------------------------------------------------------ */
console.log('\n4 · Unter der Schwelle heisst es „gleich"');

gleich('Chemie ist gleich geblieben', gerechnet.ch?.richtung, 'gleich');
p('Der Unterschied liegt unter der Schwelle',
  Math.abs(gerechnet.ch?.unterschied || 0) < gerechnet.schwelle,
  String(gerechnet.ch?.unterschied) + ' gegen ' + gerechnet.schwelle);
p('Und der Satz behauptet keine Richtung',
  /gleich geblieben/.test(gerechnet.ch?.satz || '') &&
  !/aufwärts|abwärts/.test(gerechnet.ch?.satz || ''), gerechnet.ch?.satz);

/* ------------------------------------------------------------------------ */
console.log('\n5 · GEGENPROBE: ohne früheren Zeitraum kein Vergleich');

/* „Deutsch" hat sechzehn Antworten — aber alle aus dem jetzigen Fenster.
   Wer erst seit acht Wochen lernt, ist nicht „besser geworden". */
p('Deutsch steht NICHT in der Liste', !gerechnet.de,
  JSON.stringify(gerechnet.themen));
gleich('Genau drei Themen werden verglichen', gerechnet.themen.length, 3);
gleich('Das Standardfenster ist ein Vierteljahr', gerechnet.fenster, 90);

/* ------------------------------------------------------------------------ */
console.log('\n6 · In der Ansicht');

const ansicht = await pc.evaluate(async ({ jetzt, TAG }: { jetzt: number; TAG: number }) => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());

  const w = globalThis as any;
  const machKarten = (mit: boolean) => {
    const frueher = (n: number, gut: number) =>
      Array.from({ length: n }, (_, i) => ({
        at: new Date(jetzt - (100 + i * 5) * TAG).toISOString(),
        rating: i < gut ? 4 : 1
      }));
    const heute = (n: number, gut: number) =>
      Array.from({ length: n }, (_, i) => ({
        at: new Date(jetzt - (5 + i * 5) * TAG).toISOString(),
        rating: i < gut ? 4 : 1
      }));
    return [{
      id: 'k1', thema: 'Mathematik', titel: 'x',
      sr: { intervall: 10, faellig: new Date(jetzt + 5 * TAG).toISOString() },
      reviewVerlauf: mit ? [...frueher(16, 8), ...heute(16, 15)] : heute(16, 15)
    }];
  };

  const zaehle = (mit: boolean) => w.Kompetenz.verlauf(machKarten(mit), { jetzt }).length;

  /* Die Ansicht selbst öffnen — nicht nur die Rechnung prüfen. */
  if (w.Learning && typeof w.Learning.open === 'function') w.Learning.open();
  await new Promise(r => setTimeout(r, 700));
  const ueber = [...document.querySelectorAll('.overlay h3')]
    .map(h => (h.textContent || '').trim());

  return { mitVergleich: zaehle(true), ohneVergleich: zaehle(false),
           ueberschriften: ueber, fensterAuf: !!document.querySelector('.overlay') };
}, { jetzt: JETZT, TAG });

/* DASS DAS FENSTER ÜBERHAUPT AUFGING — sonst wäre §6 stumm grün, genau wie
   test318 §5 es einmal war. */
p('Das Lernfenster geht auf', ansicht.fensterAuf,
  JSON.stringify(ansicht.ueberschriften));
p('Und es hat Überschriften', ansicht.ueberschriften.length > 0,
  JSON.stringify(ansicht.ueberschriften));

/* DIE EIGENTLICHE ZUSAGE: mit Vergleich eine Zeile, ohne Vergleich keine. */
gleich('Mit beiden Zeiträumen gibt es eine Zeile', ansicht.mitVergleich, 1);
gleich('Ohne früheren Zeitraum keine', ansicht.ohneVergleich, 0);

/* ------------------------------------------------------------------------ */
/* §38: nicht nur Farbe. Im Quelltext muss neben der Farbe ein Zeichen und
   eine Zahl stehen. */
const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/learning.ts'), 'utf-8');
const abschnitt = quelle.slice(quelle.indexOf('const verlaufSection'),
                               quelle.indexOf('const topicSection'));
p('Die Richtung steht auch als Zeichen da, nicht nur als Farbe',
  /▲/.test(abschnitt) && /▼/.test(abschnitt));
p('Und die Zahl mit Vorzeichen',
  /punkte > 0 \? '\+' : ''/.test(abschnitt));
p('Der Abschnitt kann null zurückgeben',
  /if \(!reihen\.length\) return null;/.test(abschnitt));

/* Und `fensterTage` hat jetzt wirklich einen Aufrufer — das war Punkt 3. */
const kern = fs.readFileSync(
  path.join(WURZEL, 'src/core/learning/kompetenz.ts'), 'utf-8');
p('`fensterTage` wird jetzt auch gesetzt, nicht nur gelesen',
  /fensterTage: tage/.test(kern));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
