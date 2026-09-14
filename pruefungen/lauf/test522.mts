/* Suite 522 — Die Stiftleiste: eine laute Fläche, nicht sechs (E568)
 * ============================================================================
 * Redur, 14. September: „die Stift, wie es geordnet ist, gefällt mir nicht,
 * und es hat keine Qualität, also kein gutes Gefühl."
 *
 * ─── WAS GEMESSEN WAR, BEVOR ETWAS GEÄNDERT WURDE ──────────────────────────
 * Bei 1280 px Fenster, Werkzeug «Stift», Leiste 584 px breit:
 *
 *   · 33 Bedienteile, ALLE exakt 36 × 32 px — keine Rangfolge
 *   · SECHS Flächen gleichzeitig in `rgb(109,74,255)`: das Werkzeug, die
 *     Schalter «Formen» und «Kritzeln», der geführte Stift, die gewählte
 *     Breite, der Ring um die Farbe. Drei davon nebeneinander.
 *   · KEIN einziger Trenner sichtbar — `.blatt-werk[data-tool] > span
 *     .blatt-trenn[data-gruppe]{display:none}` galt immer, weil
 *     `[data-tool]` immer steht
 *   · die Farbreihe MITTEN durchgeschnitten: Schwarz, Rot, Blau in Zeile 2,
 *     Grün und Gelb in Zeile 3
 *   · die Tupfer waren keine Tupfer: `border-radius:50%` (0,1,0) verlor
 *     gegen `.blatt-werk button{border-radius:6px}` (0,1,1) — auf dem
 *     Bildschirm standen fünf abgerundete Kacheln
 *
 * ─── WAS DIESE SUITE HÄLT ───────────────────────────────────────────────────
 *   1 · Genau EINE volle Akzentfläche in der Leiste: das Werkzeug.
 *   2 · Spielart (Stift, Breite, Farbe) = Ring. Schalter = getönt + Balken.
 *   3 · Die Tupfer sind rund, und die Farbe sitzt INNEN.
 *   4 · Die Trenner stehen am Rechner und liegen am Telefon.
 *   5 · Der Umbruch fällt auf eine Gruppengrenze: die Palette bleibt ganz
 *       und steht unmittelbar rechts der Stiftreihe (E512).
 *   6 · Das Werkzeug ist breiter als sein Zubehör.
 *   7 · §37 am Telefon: nichts unter 44 px.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Zurückgedreht und nachgesehen, nicht behauptet:
 *   G1 → `.blatt-werk button.on{background:var(--accent)}` wie vorher:  7 rot
 *   G2 → die Tupfer-Regel (Kachel statt Tupfer) zurückdrehen:           6 rot
 *   G3 → den Trenner wieder überall ausblenden:                         2 rot
 *   G4 → `order:1` des Verlaufs entfernen:                              1 rot
 *   G5 → `min-width:32px` des Zubehörs auf 36 zurück:                   4 rot
 *
 * G3 und G4 zeigen dabei, dass die Palette an BEIDEM hängt: die Trenner
 * machen die Zeile breit genug, dass die Breiten hinausfallen, und der
 * Verlauf am Ende macht Platz für die Palette neben den Stiften. Nimmt man
 * eines davon weg, rutschen die Farben wieder auseinander.
 *
 *   node pruefungen/lauf/test522.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
declare const App: any;
declare const Store: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9632;
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];

/** Eine Seite mit einem Blatt, das Werkzeug «Stift» geführt. */
const aufbauen = async (breite: number): Promise<Page> => {
  const ktx = await browser.newContext({ viewport: { width: breite, height: 900 } });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  for (let v = 0; v < 8; v++) {
    await pg.evaluate(() => {
      document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
    });
    await pg.waitForTimeout(200);
    if (!await pg.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
  }
  await pg.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const s = Store.addPage(null, { text: 'Stiftleiste' });
    Store.addBlock(s.id, 'blatt', {
      text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: []
    });
    await Store.flush();
    App.oeffne(s.id);
  });
  await pg.waitForTimeout(900);
  await pg.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click());
  await pg.waitForTimeout(400);
  return pg;
};

/** Alles, was ein Auge an der Leiste sehen kann — in Zahlen. */
const messen = (pg: Page) => pg.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.blatt-werk')!;
  const wb = w.getBoundingClientRect();
  const sichtbar = (e: Element) => (e as HTMLElement).getClientRects().length > 0;
  /* EINE FLÄCHE IST VOLL, wenn ihr Grund die Akzentfarbe selbst ist. Die
     getönte Fassung des Schalters ist `color-mix(... 14%)` und damit eine
     ANDERE Farbe — genau deshalb lässt sich das hier zählen. */
  const akzent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const rgbAkzent = (() => {
    const probe = document.createElement('span');
    probe.style.color = akzent; document.body.appendChild(probe);
    const c = getComputedStyle(probe).color; probe.remove(); return c;
  })();
  const teile = [...w.children].filter(sichtbar).map(k => {
    const el = k as HTMLElement, r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return {
      name: el.dataset.wz || el.dataset.act || el.className || el.tagName.toLowerCase(),
      wz: !!el.dataset.wz, act: el.dataset.act || '', cls: el.className,
      gruppe: el.dataset.gruppe || '', an: el.classList.contains('on'),
      x: Math.round(r.x - wb.x), y: Math.round(r.y - wb.y),
      w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
      bg: cs.backgroundColor, voll: cs.backgroundColor === rgbAkzent,
      schatten: cs.boxShadow, radius: cs.borderRadius,
      randfarbe: cs.borderTopColor, clip: cs.backgroundClip,
      polster: cs.paddingTop
    };
  });
  const spur = (y: number) => Math.round(y / 12) * 12;
  const zeilen = [...new Set(teile.map(t => spur(t.y)))].sort((a, b) => a - b);
  return {
    breite: Math.round(wb.width), hoehe: Math.round(wb.height), akzent: rgbAkzent,
    teile, zeilen: zeilen.map(y => teile.filter(t => spur(t.y) === y).map(t => t.name))
  };
});

/* ======================================================================== */
console.log('\n1 · Genau EINE volle Akzentfläche in der ganzen Leiste');
const pg = await aufbauen(1280);
let z = await messen(pg);
const voll = z.teile.filter(t => t.voll);
gleich('Eine einzige volle Fläche', voll.length, 1);
gleich('… und das ist das Werkzeug «Stift»', voll[0]?.name, 'stift');
/* Vorher waren es sechs: Werkzeug, Formen, Kritzeln, Stift, Breite, Farbring. */
p('Mindestens vier weitere Teile sind gewählt oder an — und KEINES davon voll',
  z.teile.filter(t => t.an).length >= 4 && z.teile.filter(t => t.an && t.voll).length === 1,
  JSON.stringify(z.teile.filter(t => t.an).map(t => [t.name, t.voll])));

/* ======================================================================== */
console.log('\n2 · Spielart = Ring, Schalter = getönt mit Balken');
const stiftAn = z.teile.find(t => t.act === 'stilwahl' && t.an);
const breiteAn = z.teile.find(t => t.cls.includes('blatt-strich') && t.an);
const schalter = z.teile.filter(t => (t.act === 'formen' || t.act === 'kritzel') && t.an);
p('Der geführte Stift trägt einen Ring (inset, ohne Versatz)',
  !!stiftAn && /inset/.test(stiftAn.schatten) && !stiftAn.voll, JSON.stringify(stiftAn?.schatten));
p('Die gewählte Breite auch', !!breiteAn && /inset/.test(breiteAn.schatten) && !breiteAn.voll,
  JSON.stringify(breiteAn?.schatten));
gleich('Beide Schalter liegen an', schalter.length, 2);
p('… und tragen einen BALKEN, keinen Ring — der Schatten hat einen Versatz nach oben',
  schalter.every(s => /inset/.test(s.schatten) && /-2px/.test(s.schatten)),
  JSON.stringify(schalter.map(s => s.schatten)));
p('… und ihr Grund ist getönt, nicht der Akzent selbst',
  schalter.every(s => !s.voll && s.bg !== 'rgba(0, 0, 0, 0)'), JSON.stringify(schalter.map(s => s.bg)));

/* ======================================================================== */
console.log('\n3 · Die Farbtupfer sind Tupfer — rund, und die Farbe sitzt innen');
const tupfer = z.teile.filter(t => t.cls.includes('blatt-farbe') && !t.cls.includes('leiter'));
p('Fünf feste Farben und der Weg zu eigenen', tupfer.length >= 6, String(tupfer.length));
p('Alle rund (50 %), keine Kachel', tupfer.every(t => t.radius.includes('50%')),
  JSON.stringify([...new Set(tupfer.map(t => t.radius))]));
p('Alle quadratisch — sonst wäre 50 % ein Ei', tupfer.every(t => Math.abs(t.w - t.h) < 1.5),
  JSON.stringify(tupfer.map(t => [t.w, t.h])));
p('Die Farbe sitzt im Inneren (background-clip: content-box) mit Polsterung',
  tupfer.every(t => t.clip === 'content-box' && parseFloat(t.polster) >= 3),
  JSON.stringify([...new Set(tupfer.map(t => t.clip + '/' + t.polster))]));
const gewaehlt = tupfer.find(t => t.an);
p('Der gewählte Tupfer trägt den Akzentring — nicht `--text`, das auf Schwarz verschwände',
  !!gewaehlt && gewaehlt.randfarbe === z.akzent, JSON.stringify([gewaehlt?.randfarbe, z.akzent]));

/* ======================================================================== */
console.log('\n4 · Die Trenner stehen am Rechner');
const trenner = z.teile.filter(t => t.cls.includes('blatt-trenn'));
p('Mindestens drei Gruppen sind sichtbar getrennt', trenner.length >= 3,
  JSON.stringify(trenner.map(t => t.gruppe)));
p('… und keiner steht am Anfang einer Zeile', trenner.every(t => t.x > 2),
  JSON.stringify(trenner.map(t => [t.gruppe, t.x])));

/* ======================================================================== */
console.log('\n5 · Der Umbruch fällt auf eine Gruppengrenze: die Palette bleibt ganz');
const zeileVon = (t: { y: number }) => Math.round(t.y / 12) * 12;
const palettenZeilen = new Set(tupfer.map(zeileVon));
gleich('Alle Farbtupfer stehen auf EINER Zeile', palettenZeilen.size, 1);
const stifte = z.teile.filter(t => t.act === 'stilwahl');
gleich('Die sechs Stifte auch', new Set(stifte.map(zeileVon)).size, 1);
gleich('Die drei Breiten auch', new Set(z.teile.filter(t => t.cls.includes('blatt-strich')).map(zeileVon)).size, 1);
/* DAS IST DER PUNKT, DER VORHER ROT WAR: Schwarz, Rot und Blau standen in
   der Zeile der Stifte, Grün und Gelb eine Zeile tiefer.
   UND ER SAGT ZUGLEICH E512 NACH: Redur wollte die Stiftreihe „links unten,
   wo die Farben dort sind" — also in DERSELBEN Zeile, unmittelbar davor.
   `test480` misst dasselbe von der anderen Seite. */
p('Die Palette steht in derselben Zeile wie die Stifte, unmittelbar rechts davon',
  zeileVon(tupfer[0]!) === zeileVon(stifte[0]!)
  && stifte[stifte.length - 1]!.x + stifte[stifte.length - 1]!.w <= tupfer[0]!.x + 1,
  JSON.stringify([zeileVon(tupfer[0]!), zeileVon(stifte[0]!),
                  stifte[stifte.length - 1]!.x + stifte[stifte.length - 1]!.w, tupfer[0]!.x]));
/* … und NICHTS steht dazwischen ausser dem Trenner der Gruppe. */
p('Zwischen dem letzten Stift und dem ersten Tupfer steht nur der Trenner',
  z.teile.filter(t => t.y === stifte[0]!.y
    && t.x > stifte[stifte.length - 1]!.x
    && t.x < tupfer[0]!.x && !t.cls.includes('blatt-trenn')).length === 0,
  JSON.stringify(z.teile.filter(t => t.x > stifte[stifte.length - 1]!.x && t.x < tupfer[0]!.x).map(t => t.name)));
p('Die Leiste bleibt bei höchstens drei Zeilen', z.hoehe < 140, `${z.hoehe} px`);

/* ======================================================================== */
console.log('\n6 · Das Werkzeug ist breiter als sein Zubehör');
const werkzeugBreite = Math.min(...z.teile.filter(t => t.wz).map(t => t.w));
const zubehoerBreite = Math.max(...z.teile.filter(t => !t.wz && t.gruppe && !t.cls.includes('blatt-trenn')
  && !t.cls.includes('blatt-farbe')).map(t => t.w));
p('Das schmalste Werkzeug ist breiter als das breiteste Zubehörteil',
  werkzeugBreite > zubehoerBreite, `Werkzeug ${werkzeugBreite}, Zubehör ${zubehoerBreite}`);
gleich('Die Werkzeuge stehen alle auf EINER Zeile',
  new Set(z.teile.filter(t => t.wz).map(zeileVon)).size, 1);
await pg.context().close();

/* ======================================================================== */
console.log('\n7 · Am Telefon: 44 px, und kein Trenner im Rollweg (§37)');
const handy = await aufbauen(390);
z = await messen(handy);
const zuKlein = z.teile.filter(t => !t.cls.includes('blatt-zeilenbruch') && (t.w < 44 || t.h < 44));
gleich('Kein sichtbares Bedienteil unter 44 × 44', zuKlein.map(t => [t.name, t.w, t.h]), []);
gleich('Kein Trenner sichtbar', z.teile.filter(t => t.cls.includes('blatt-trenn')).length, 0);
const tupferH = z.teile.filter(t => t.cls.includes('blatt-farbe') && !t.cls.includes('leiter'));
p('Die Tupfer sind auch dort rund und tragen ihre Farbe innen',
  tupferH.length >= 6 && tupferH.every(t => t.radius.includes('50%') && t.clip === 'content-box'),
  JSON.stringify([tupferH.length, tupferH[0]?.radius, tupferH[0]?.clip]));
gleich('Und genau eine volle Akzentfläche', z.teile.filter(t => t.voll).length, 1);
await handy.context().close();

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 522: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
