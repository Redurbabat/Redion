/* Suite 362 — Die Telefonmarken sagen, was wirklich dasteht (E372, L10)
 * ============================================================================
 * BEFUND: `marken.css` führt acht Telefonmasse als Marken. Nachgezählt am
 * 3. September 2026, wie oft sie benutzt werden:
 *
 *     --touch-min          14×      und 113× die rohe 44px daneben
 *     --mobile-gutter       4×
 *     --mobile-gutter-small 3×
 *     --sheet-radius        4×
 *     --mobile-topbar       1×
 *     --table-row-touch     1×
 *     --mobile-nav-height   0×
 *
 * Eine Marke, die niemand benutzt, kann jahrelang falsch sein, ohne dass es
 * jemand merkt. Und zwei WAREN falsch:
 *
 *   · `--mobile-topbar` sagte 46, der Balken misst 56. Die eine Stelle, die
 *     die Marke benutzte, war die Kerbenregel — am iPhone rechnete sie
 *     46 + 47 = 93, `padding-top:47` nahm die Kerbe weg, und dem Inhalt
 *     blieben 46 statt 56 px. Zehn zu wenig, auf genau dem Gerät, für das
 *     die Regel geschrieben wurde.
 *   · `--mobile-nav-height` sagte 56, die Leiste misst 59.
 *
 * DIESER LAUF MISST DIE MARKEN GEGEN DIE ECHTEN ELEMENTE. Er rechnet nichts
 * nach, was der Stil schon rechnet (§55.2) — er fragt die Seite, wie hoch
 * die Dinge wirklich sind, und vergleicht.
 *
 * §1 DIE MARKEN GIBT ES überhaupt, und sie tragen Zahlen.
 * §2 KOPFLEISTE: die Marke ist die Höhe des Balkens.
 * §3 UNTERE LEISTE: die Marke ist die Höhe der Leiste.
 * §4 TREFFERFLÄCHE: was --touch-min verspricht, hält die Oberfläche.
 * §5 IN ZWEI BILDMASSEN gilt dasselbe.
 * §6 DIE ZAHL STEHT EINMAL: keine rohe Wiederholung an der Quelle.
 * §7 DAS VERZEICHNIS der rohen Wiederholungen darf nur schrumpfen.
 *
 *   node pruefungen/lauf/test362.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9383;

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

const messen = async (breite: number, hoehe: number) => {
  const s = await browser.newPage({
    viewport: { width: breite, height: hoehe }, hasTouch: true, isMobile: true,
  });
  s.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction(() => typeof Store !== 'undefined' &&
    typeof App !== 'undefined', null, { timeout: 30000 });
  await s.waitForTimeout(1100);
  const werte = await s.evaluate(() => {
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    const w = getComputedStyle(document.documentElement);
    const zahl = (n: string) => parseFloat(w.getPropertyValue(n)) || 0;
    const hoch = (sel: string) => {
      const e = document.querySelector(sel);
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return r.height > 0 ? Math.round(r.height) : 0;
    };
    /* Die kleinste Trefferfläche unter den SICHTBAREN Knöpfen der beiden
       Leisten. Nicht über alle Knöpfe der Seite — dort stehen auch die
       vom Rechner, die hier gar nicht gezeigt werden. */
    const knoepfe = [...document.querySelectorAll('#handy-oben > button, #topbar button')]
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
      .map(e => Math.round(e.getBoundingClientRect().height));
    return {
      marke: { topbar: zahl('--mobile-topbar'), nav: zahl('--mobile-nav-height'),
               touch: zahl('--touch-min'), zeile: zahl('--table-row-touch'),
               rand: zahl('--mobile-gutter'), randK: zahl('--mobile-gutter-small'),
               radius: zahl('--sheet-radius') },
      echt: { topbar: hoch('#topbar'), nav: hoch('#handy-oben') },
      knoepfe: { wieviele: knoepfe.length, kleinster: knoepfe.length ? Math.min(...knoepfe) : 0 },
    };
  });
  await s.close();
  return werte;
};

/* ========================================================================= */
console.log('\n1 · Die Marken gibt es, und sie tragen Zahlen');

const m390 = await messen(390, 844);
const namen = Object.keys(m390.marke) as Array<keyof typeof m390.marke>;
gleich('Sieben Telefonmarken', namen.length, 7);
p('Keine ist leer oder null',
  namen.every(n => m390.marke[n] > 0),
  JSON.stringify(m390.marke));

console.log('\n2 · Kopfleiste: die Marke IST die Höhe');

p('Es gibt eine Kopfleiste', (m390.echt.topbar || 0) > 0);
gleich('--mobile-topbar stimmt mit dem Balken überein',
  m390.echt.topbar, m390.marke.topbar);

console.log('\n3 · Untere Leiste: die Marke IST die Höhe');

p('Es gibt eine untere Leiste', (m390.echt.nav || 0) > 0);
gleich('--mobile-nav-height stimmt mit der Leiste überein',
  m390.echt.nav, m390.marke.nav);

console.log('\n4 · Trefferfläche: was die Marke verspricht, hält die Oberfläche');

p('Es wurden Knöpfe gefunden', m390.knoepfe.wieviele >= 5,
  'gezählt ' + m390.knoepfe.wieviele);
p('Der kleinste sichtbare Leistenknopf hält --touch-min',
  m390.knoepfe.kleinster >= m390.marke.touch,
  'kleinster ' + m390.knoepfe.kleinster + ', Marke ' + m390.marke.touch);

console.log('\n5 · In zwei Bildmassen gilt dasselbe');

const m428 = await messen(428, 926);
gleich('Die Marken sind in beiden Massen dieselben', m428.marke, m390.marke);
gleich('Und der Balken auch', m428.echt.topbar, m428.marke.topbar);
gleich('Und die Leiste auch', m428.echt.nav, m428.marke.nav);

console.log('\n6 · Die Zahl steht einmal, nicht zweimal');

const bau = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/bausteine.css'), 'utf8');
const marken = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/marken.css'), 'utf8');
const ohneWorte = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '');
p('Die Kopfleiste holt ihre Mindesthöhe aus der Marke',
  /#topbar\{\s*min-height:var\(--mobile-topbar\)/.test(ohneWorte(bau)));
p('Und keine rohe Zahl mehr an dieser Stelle',
  !/#topbar\{\s*min-height:\d+px/.test(ohneWorte(bau)));
p('Die Kerbenregel benutzt dieselbe Marke',
  /#topbar\{[\s\S]{0,140}calc\(var\(--mobile-topbar\)/.test(ohneWorte(bau)));
p('marken.css sagt, woraus sich die Leistenhöhe zusammensetzt',
  /5 Polster oben \+ 48 Knopf/.test(marken));

console.log('\n7 · Das Verzeichnis der rohen Wiederholungen darf nur schrumpfen');

/* WARUM EIN VERZEICHNIS UND KEIN VERBOT. 44px steht 113× roh in den
   Stildateien, und das ist NICHT durchweg falsch: ein Zeichen, das zufällig
   44 px misst, meint keine Trefferfläche. Ein Verbot wäre also entweder
   unehrlich oder unerfüllbar. Ein VERZEICHNIS ist beides nicht: es hält den
   Stand fest, und es darf nur kleiner werden — dieselbe Bauform wie
   `js-bestand.json` (E28, test109). */
const stildir = path.join(WURZEL, 'quell/schale/stil');
const zaehlen = (wert: number) => fs.readdirSync(stildir)
  .filter(f => f.endsWith('.css'))
  .reduce((n, f) => n + (ohneWorte(fs.readFileSync(path.join(stildir, f), 'utf8'))
    .match(new RegExp('(?<![\\w-])' + wert + 'px', 'g')) || []).length, 0);

const DECKE: Record<string, number> = JSON.parse(
  fs.readFileSync(path.join(WURZEL, 'pruefungen/marken-decke.json'), 'utf8'));
const jetzt: Record<string, number> = {};
Object.keys(DECKE).forEach(w => { jetzt[w] = zaehlen(Number(w)); });
p('Es gibt ein Verzeichnis', Object.keys(DECKE).length >= 4);

/* GENAU GLEICH, NICHT HÖCHSTENS. „Höchstens" hätte eine Decke, die längst
   zu hoch steht, für immer stehen lassen — und eine Decke mit Luft ist
   keine Decke, sondern eine Zahl. So muss jede Änderung in BEIDE Richtungen
   eingetragen werden: wer eine rohe 44px durch die Marke ersetzt, sieht den
   Lauf rot und trägt die kleinere Zahl nach. Dieselbe Zucht wie bei
   `js-bestand.json` (E28). */
gleich('Jede Decke ist genau der heutige Stand', jetzt, DECKE);
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
