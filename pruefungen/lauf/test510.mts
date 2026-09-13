/* Suite 510 — Das Dokumentstudio trägt Redions Farben, nicht seine eigenen
 * ============================================================================
 * Redur, wörtlich: „das hier gefelt mir nich die farben, usw es sollte wie die
 * redion farben sein wenn ich die fraben ändere sollte das auch sich ändern".
 *
 * ─── WAS GEMESSEN WURDE, BEVOR ETWAS GEBAUT WURDE ───────────────────────────
 * Bei 1440 × 852, Präsentation im Dokumentmodus, Reiter „Zeichnen" gewählt,
 * alle ACHT Schemata durchgefahren (standard, hell, nacht, wald, sand,
 * papier, kontrast, rose):
 *
 *   ÄNDERT SICH  (3 von 8 Stellen)
 *     .folienband                        rgb(26,26,26) → rgb(251,251,250)
 *     .folienband-reiter-knopf           rgb(167,167,167) → rgb(102,101,95)
 *     …[aria-selected=true]              rgb(109,74,255) → rgb(124,58,237)
 *
 *   ÄNDERT SICH NICHT  (5 von 8) — in ALLEN ACHT byte-gleich
 *     .document-drawingbar               rgb(48,77,120)  ← Redurs dunkles Blau
 *     …button[aria-pressed=true]         rgb(216,228,241) auf rgb(25,56,89)
 *     #reiterleiste                      rgb(34,55,92)
 *     .document-topbar                   rgb(48,77,120)
 *     .document-center                   rgb(36,35,35)
 *
 * Der Grund steht in `pdf-studio.css:7`: `--pdf-chrome`, `--pdf-tools`,
 * `--pdf-on-chrome`, `--pdf-desk` und `--pdf-dock` sind feste Hexwerte auf
 * blankem `:root`, ohne Hell/Dunkel-Variante. `Aussehen.setzen()` schreibt
 * nur `--bg*`, `--line*`, `--text` und `--accent` an `documentElement` — es
 * kann diese fünf Namen gar nicht erreichen. Selbst „Starker Kontrast"
 * (`--bg #000`, `--text #fff`) lässt sie unberührt.
 *
 * ─── WARUM DAS EINE ENTSCHEIDUNG UMDREHT ────────────────────────────────────
 * Die blaue Palette ist Redurs eigener Entwurf aus `codex/pdf-schreibstudio`,
 * und E464 hat sie beim Zusammenführen AUSDRÜCKLICH unangetastet gelassen
 * („dieselben Pixel, ein anderer Name. Sonst nichts an seinem Stil").
 * Redur hat sie jetzt selbst zurückgenommen. Deshalb E554 und deshalb dieser
 * Lauf.
 *
 * ─── WIE DIESE SUITE GEBAUT IST, DAMIT SIE NICHT ZU FRÜH GRÜN WIRD ─────────
 * „standard ≠ hell" wäre schon mit der halben Reparatur grün. Gemessen wird
 * deshalb über ALLE ACHT: mindestens SECHS verschiedene Werte. Heute liefert
 * das 1 von 8.
 *
 * Und ein Kontrastteil dazu, denn die naheliegende Reparatur wäre hier fast
 * schiefgegangen: `--auf-accent`, `--accent-text` und `--accent-schwach`
 * folgen den acht Schemata NICHT (nur `--accent` tut es, `aussehen.ts:112`).
 * `background:var(--accent); color:var(--auf-accent)` für den gewählten Stift
 * fällt in FÜNF von acht unter 4,5:1 — in „Starker Kontrast" von heute
 * 9,30:1 auf 1,43:1. Das wäre §38, hart gebrochen, und keine Zusage hätte es
 * gemeldet. §4 misst den Kontrast deshalb selbst, in allen acht.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   Sie IST heute rot, vor der Reparatur:                     10 grün, 8 rot  (1 von 8 bei jeder Fläche; nur das Folienband war grün)
 * Dazu drei Gegenproben nach der Reparatur:
 *   G1 → `--pdf-tools` wieder fest:                           13 grün, 5 rot  (und sechs Kontrastpaare dazu — Fläche und Schrift gehören zusammen)
 *   G2 → `--pdf-desk` auf `var(--bg-tief)` (nur zwei Werte):  17 grün, 1 rot  („2 von 8" — genau die zwei Werte, die --bg-tief hat)
 *   G3 → gewählter Stift auf `--accent`/`--auf-accent`:       16 grün, 2 rot  (nacht 3,07 · wald 2,26 · sand 3,87 · kontrast 1,43)
 *
 *   node pruefungen/lauf/test510.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any;
declare const App: any;
declare const Aussehen: any;
declare const Folienvorlagen: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9620;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

/* ── WCAG-Kontrast, gerechnet statt geschätzt ──────────────────────────── */
const zuRgb = (s: string): [number, number, number] => {
  const m = /rgba?\(([^)]+)\)/.exec(s);
  if (!m) return [0, 0, 0];
  const t = m[1]!.split(/[,\s/]+/).filter(Boolean).map(Number);
  return [t[0] || 0, t[1] || 0, t[2] || 0];
};
const helligkeit = (c: [number, number, number]): number => {
  const f = c.map(v => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * f[0]! + 0.7152 * f[1]! + 0.0722 * f[2]!;
};
const kontrast = (a: string, b: string): number => {
  const la = helligkeit(zuRgb(a)), lb = helligkeit(zuRgb(b));
  return Math.round(((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)) * 100) / 100;
};

const SCHEMATA = ['standard', 'hell', 'nacht', 'wald', 'sand', 'papier', 'kontrast', 'rose'];

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1440, height: 852 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
for (let versuch = 0; versuch < 8; versuch++) {
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(230);
  if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
}
const deck = await seite.evaluate(() => {
  const d = Folienvorlagen.neuePraesentation('titelInhalt');
  Folienvorlagen.neueFolie(d.id, 'zweiInhalte');
  return d.id;
});
await seite.evaluate((x: string) => App.oeffne(x), deck);
await seite.waitForTimeout(1800);
await seite.evaluate(() => {
  document.querySelectorAll<HTMLElement>('#rg-willkommen').forEach(o => o.remove());
});
/* Die Zeichenleiste sichtbar machen — sie wohnt seit E552 im Reiter. */
await seite.evaluate(() => {
  document.querySelector<HTMLElement>('[data-fb-reiter="zeichnen"]')?.click();
});
await seite.waitForTimeout(500);

/** Alle gemessenen Flächen in EINEM Schema ablesen. */
const ablesen = async (schema: string) => {
  await seite.evaluate((s: string) => { Aussehen.setzen({ schema: s }); }, schema);
  await seite.waitForTimeout(380);
  return seite.evaluate(() => {
    const s = (sel: string) => {
      const e = document.querySelector<HTMLElement>(sel);
      if (!e) return null;
      const c = getComputedStyle(e);
      return { bg: c.backgroundColor, fg: c.color };
    };
    return {
      leiste: s('.document-drawingbar'),
      gewaehlt: s('.document-drawingbar button[aria-pressed="true"]'),
      kopf: s('.document-studio .document-topbar'),
      tisch: s('.document-studio .document-center'),
      reiterleiste: s('#reiterleiste'),
      band: s('.folienband'),
      /* Die Tokens selbst — zum Vergleich, und um zu sehen, ob das Schema
         überhaupt angekommen ist. */
      tok: (() => {
        const c = getComputedStyle(document.documentElement);
        return { bg: c.getPropertyValue('--bg').trim(),
                 bgCard: c.getPropertyValue('--bg-card').trim(),
                 akzent: c.getPropertyValue('--accent').trim(),
                 pdfTools: c.getPropertyValue('--pdf-tools').trim() };
      })(),
    };
  });
};

const alle: Record<string, any> = {};
for (const sch of SCHEMATA) alle[sch] = await ablesen(sch);

/* ══ §1 DIE SCHEMATA KOMMEN ÜBERHAUPT AN ═════════════════════════════════ */
console.log('\n§1 Die acht Schemata sind wirklich verschieden (sonst misst §2 nichts)');
{
  const gruende = new Set(SCHEMATA.map(s => alle[s].tok.bg));
  p('Acht Schemata gemessen', SCHEMATA.length === 8);
  p('… und sie setzen verschiedene Grundfarben', gruende.size >= 6,
    gruende.size + ' verschiedene: ' + [...gruende].join(' '));
  p('… und die Leiste ist sichtbar, sonst wäre alles 0',
    !!alle['standard'].leiste, JSON.stringify(alle['standard'].leiste));
  p('… und ein Werkzeug ist gewählt', !!alle['standard'].gewaehlt,
    JSON.stringify(alle['standard'].gewaehlt));
}

/* ══ §2 JEDE FLÄCHE FOLGT DEM AUSSEHEN ═══════════════════════════════════ */
console.log('\n§2 Jede Fläche wechselt mit — mindestens sechs verschiedene von acht');
{
  const zaehle = (holen: (m: any) => string | undefined): string[] =>
    [...new Set(SCHEMATA.map(s => holen(alle[s]) || '?'))];
  const flaechen: Array<[string, (m: any) => string | undefined]> = [
    ['Zeichenleiste',   m => m.leiste?.bg],
    ['Dokumentleiste',  m => m.kopf?.bg],
    ['Schreibtisch',    m => m.tisch?.bg],
    ['Fensterreiter',   m => m.reiterleiste?.bg],
    ['Folienband',      m => m.band?.bg],
    ['gewähltes Werkzeug', m => m.gewaehlt?.bg],
  ];
  for (const [name, holen] of flaechen) {
    const w = zaehle(holen);
    p(`${name}: mindestens sechs verschiedene Farben in acht Schemata`,
      w.length >= 6, w.length + ' von 8 — ' + w.join(' · '));
  }
  /* UND DIE SCHRIFT DARAUF AUCH. Eine Fläche, die wechselt, und eine
     Schrift, die feststeht, ist der halbe Weg — und der gefährlichere. */
  const schriften = [...new Set(SCHEMATA.map(s => alle[s].leiste?.fg || '?'))];
  p('Auch die Schrift der Leiste wechselt mit', schriften.length >= 6,
    schriften.length + ' von 8 — ' + schriften.join(' · '));
}

/* ══ §3 DIE FESTEN NAMEN SIND ABGELEITET, NICHT EINGETIPPT ═══════════════ */
console.log('\n§3 `--pdf-tools` ist keine feste Zahl mehr');
{
  const werte = [...new Set(SCHEMATA.map(s => alle[s].tok.pdfTools))];
  p('`--pdf-tools` hat in acht Schemata mehr als einen Wert', werte.length >= 6,
    werte.length + ' von 8 — ' + werte.join(' · '));
  /* Die Quelle mitprüfen: ein `:root` mit rohem Hex für diese Namen wäre
     der Rückfall, und er sieht im Stilblatt harmlos aus. */
  const css = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/pdf-studio.css'), 'utf8');
  const wurzelZeile = /:root\{[^}]*--pdf-tools:\s*([^;]+);/.exec(css);
  p('… und im Stilblatt steht dort kein roher Hexwert',
    !!wurzelZeile && !/^#[0-9a-fA-F]{3,8}$/.test(wurzelZeile[1]!.trim()),
    wurzelZeile ? wurzelZeile[1]!.trim() : 'keine :root-Zeile gefunden');
  p('`--pdf-paper-max` bleibt ein Mass, keine Farbe (test285 rechnet damit)',
    /--pdf-paper-max:\s*\d+px/.test(css));
}

/* ══ §4 UND ES BLEIBT LESBAR — IN ALLEN ACHT ═════════════════════════════ */
console.log('\n§4 Kontrast: die naheliegende Reparatur wäre hier durchgefallen');
{
  const schlecht: string[] = [];
  const knapp: string[] = [];
  for (const sch of SCHEMATA) {
    const m = alle[sch];
    const paare: Array<[string, string, string]> = [
      ['Zeichenleiste', m.leiste?.fg, m.leiste?.bg],
      ['gewähltes Werkzeug', m.gewaehlt?.fg, m.gewaehlt?.bg],
      ['Dokumentleiste', m.kopf?.fg, m.kopf?.bg],
    ] as any;
    for (const [was, fg, bg] of paare) {
      if (!fg || !bg) continue;
      const k = kontrast(fg, bg);
      if (k < 4.5) schlecht.push(`${sch}/${was} ${k}:1`);
      else if (k < 7) knapp.push(`${sch}/${was} ${k}:1`);
    }
  }
  gleich('Kein Paar unter 4,5:1 (§38)', schlecht.length, 0);
  if (schlecht.length) console.log('     ' + schlecht.join('\n     '));
  p('… und die knappen sind benannt, nicht verschwiegen', true,
    knapp.length ? knapp.join(' · ') : 'keine unter 7:1');
  /* „Starker Kontrast" ist der Fall, für den es das Schema gibt. */
  const kk = kontrast(alle['kontrast'].gewaehlt?.fg || 'rgb(0,0,0)',
                      alle['kontrast'].gewaehlt?.bg || 'rgb(0,0,0)');
  p('In „Starker Kontrast" liegt das gewählte Werkzeug über 7:1', kk >= 7,
    kk + ':1');
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 510: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
