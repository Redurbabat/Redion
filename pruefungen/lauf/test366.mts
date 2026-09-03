/* Suite 366 — Der Stift zeichnet flüssig (E376)
 * ============================================================================
 * BEFUND, GEMESSEN VOR DEM BAUEN (§36, §45):
 *
 *   Ein Füllerstrich mit 600 Punkten kostete 484,7 ms allein an Geometrie,
 *   weil bei JEDEM Zeigerereignis der ganze Umriss neu entstand. Am Ende des
 *   Strichs kostete ein einzelnes Ereignis 0,774 ms und erzeugte eine
 *   `d`-Zeichenkette von rund 17 kB — über den Strich hinweg 10,2 MB.
 *
 * Das ist die Unflüssigkeit, und sie WÄCHST mit dem Strich: der Anfang eines
 * Satzes läuft, das Ende hängt. Genau das meint „soll flüssiger sein".
 *
 * DIE ANTWORT IST `InkStroke` — und ihr gefährlichster Punkt ist nicht die
 * Geschwindigkeit, sondern die GLEICHHEIT: der nasse Strich muss ZEICHEN FÜR
 * ZEICHEN denselben Pfad ergeben wie der trockene. Wäre er nur „ungefähr
 * gleich", spränge die Form beim Absetzen des Stifts.
 *
 * §1 DIE FEDER IST ZEICHENGLEICH mit `InkGeometry.outline` und `.path`,
 *    über hunderte zufällige Striche.
 * §2 SIE IST SCHNELLER, und zwar messbar — nicht behauptet.
 * §3 DER GLÄTTER nimmt das Zittern weg und bleibt im Zug am Stift.
 * §4 DIE VORHERSAGE schweigt, wo sie raten müsste.
 * §5 DIE VORHERSAGE GEHT NIE IN DIE DATEN — der teuerste Fehler wäre, sie
 *    mitzuspeichern.
 * §6 DER BEREICH ist wirklich verdrahtet: ein Bild je Bild, Vorhersage,
 *    Glätter, und der Aufsetzpunkt bleibt roh.
 * §7 AUF DER ECHTEN SEITE entsteht ein Strich, und er liegt dort, wo
 *    gezogen wurde.
 *
 *   node pruefungen/lauf/test366.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9397;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon'
};
const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  const rein = decodeURIComponent((req.url || '/').split('?')[0] || '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein);
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    res.writeHead(404); res.end('weg'); return;
  }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] || 'application/octet-stream' });
  res.end(fs.readFileSync(datei));
});
await new Promise<void>(fertig => server.listen(PORT, fertig));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* --------------------------------------------------------------------------
 * Der Kern läuft OHNE Browser: er kennt weder Uhr noch Ablage noch DOM.
 * Genau das ist der Grund, warum er ein Kern ist.
 * ------------------------------------------------------------------------ */
(globalThis as any).window = globalThis;
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/ink/geometry.js'), 'utf-8'));
(0, eval)(fs.readFileSync(path.join(WURZEL, 'quell/core/ink/stroke.js'), 'utf-8'));
const G: any = (globalThis as any).InkGeometry;
const S: any = (globalThis as any).InkStroke;

let saat = 12345;
const zufall = (): number => { saat = (saat * 1103515245 + 12345) & 0x7fffffff; return saat / 0x7fffffff; };
const strich = (n: number): { pts: number[][]; halb: number[] } => {
  const pts: number[][] = [], halb: number[] = [];
  let x = zufall() * 200, y = zufall() * 200;
  for (let i = 0; i < n; i++) {
    x += (zufall() - 0.5) * 20; y += (zufall() - 0.5) * 20;
    pts.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
    halb.push(0.2 + zufall() * 3);
  }
  return { pts, halb };
};
const feder = (s: { pts: number[][]; halb: number[] }): any => {
  const f = new S.Feder();
  s.pts.forEach((q, i) => f.punkt(q, s.halb[i]!));
  return f;
};

console.log('\n1 · Die Feder ist zeichengleich mit InkGeometry');

let ungleichUmriss = 0, ungleichLinie = 0, erstes = '';
for (let lauf = 0; lauf < 400; lauf++) {
  const s = strich(1 + Math.floor(zufall() * 40));
  const f = feder(s);
  if (f.d() !== G.outline(s.pts, s.halb)) {
    ungleichUmriss++;
    if (!erstes) erstes = `n=${s.pts.length}: ${f.d().slice(0, 90)} ≠ ${G.outline(s.pts, s.halb).slice(0, 90)}`;
  }
  if (f.linie() !== G.path(s.pts)) ungleichLinie++;
}
p('400 zufällige Striche: der Umriss ist Zeichen für Zeichen derselbe',
  ungleichUmriss === 0, erstes);
p('400 zufällige Striche: die Mittellinie ist Zeichen für Zeichen dieselbe',
  ungleichLinie === 0, String(ungleichLinie) + ' ungleich');

const lang = strich(600);
const fLang = feder(lang);
p('Auch bei 600 Punkten: gleicher Umriss', fLang.d() === G.outline(lang.pts, lang.halb));
p('Auch bei 600 Punkten: gleiche Mittellinie', fLang.linie() === G.path(lang.pts));

for (const n of [1, 2, 3, 4]) {
  const s = strich(n);
  const f = feder(s);
  p(`Der Grenzfall mit ${n} Punkt${n === 1 ? '' : 'en'} stimmt`,
    f.d() === G.outline(s.pts, s.halb) && f.linie() === G.path(s.pts));
}
/* Zwei gleiche Punkte hintereinander — beim Aufsetzen des Stifts der
   Normalfall, und die Stelle, an der eine Tangente durch Null teilt. */
const doppelt = { pts: [[10, 10], [10, 10], [20, 12], [20, 12]], halb: [1, 1, 1, 1] };
p('Doppelte Punkte (Aufsetzen) brechen nichts',
  feder(doppelt).d() === G.outline(doppelt.pts, doppelt.halb));

console.log('\n2 · Sie ist schneller — gemessen, nicht behauptet');

const mess = { pts: [] as number[][], halb: [] as number[] };
for (let i = 0; i < 600; i++) {
  mess.pts.push([100 + i * 0.7 + Math.sin(i / 9) * 14, 300 + Math.cos(i / 7) * 26]);
  mess.halb.push(1.2);
}
let t0 = performance.now();
for (let i = 2; i <= 600; i++) G.outline(mess.pts.slice(0, i), mess.halb.slice(0, i));
const alt = performance.now() - t0;
t0 = performance.now();
const fm = new S.Feder();
for (let i = 0; i < 600; i++) { fm.punkt(mess.pts[i]!, mess.halb[i]!); if (i) fm.d(); }
const neu = performance.now() - t0;
console.log(`     alt ${alt.toFixed(1)} ms · neu ${neu.toFixed(1)} ms · ${(alt / neu).toFixed(1)}×`);
p('Ein Strich mit 600 Punkten kostet mindestens dreimal weniger',
  neu * 3 < alt, `alt ${alt.toFixed(1)} ms, neu ${neu.toFixed(1)} ms`);

/* Der letzte Schritt allein — das ist, was am Ende eines langen Satzes zählt. */
const einzeln = (fn: () => void, n: number): number => {
  fn(); const t = performance.now();
  for (let i = 0; i < n; i++) fn();
  return (performance.now() - t) / n;
};
const altEinzeln = einzeln(() => G.outline(mess.pts, mess.halb), 200);
const neuEinzeln = einzeln(() => fm.d(), 800);
console.log(`     je Ereignis: alt ${(altEinzeln * 1000).toFixed(0)} µs · neu ${(neuEinzeln * 1000).toFixed(0)} µs`);
p('Am Ende eines 600-Punkte-Strichs kostet ein Bild mindestens dreimal weniger',
  neuEinzeln * 3 < altEinzeln, `${(altEinzeln * 1000).toFixed(0)} µs → ${(neuEinzeln * 1000).toFixed(0)} µs`);

console.log('\n3 · Der Glätter: ruhig bei stehender Hand, wach im Zug');

let s2 = 7;
const rausch = (): number => { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff - 0.5; };
const wackel = (a: number[][]): number => {
  let summe = 0;
  for (let i = 2; i < a.length; i++) {
    summe += Math.hypot(a[i]![0]! - 2 * a[i - 1]![0]! + a[i - 2]![0]!,
                        a[i]![1]! - 2 * a[i - 1]![1]! + a[i - 2]![1]!);
  }
  return summe / Math.max(1, a.length - 2);
};
const roh: number[][] = [], sanft: number[][] = [];
const gl = S.glaetter([0, 0]);
for (let i = 0; i < 300; i++) {
  const q: [number, number] = [i * 0.05 + rausch() * 0.8, rausch() * 0.8];
  roh.push(q); sanft.push(gl(q, 16));
}
const vorher = wackel(roh), nachher = wackel(sanft);
console.log(`     Zittern ${vorher.toFixed(3)} px → ${nachher.toFixed(3)} px je Schritt`);
p('Das Zittern der stehenden Hand wird mindestens dreimal kleiner',
  nachher * 3 < vorher, `${vorher.toFixed(3)} → ${nachher.toFixed(3)}`);

const gl2 = S.glaetter([0, 0]);
let rueck = 0;
for (let i = 1; i <= 40; i++) {
  const q: [number, number] = [i * 12, 0];
  const w = gl2(q, 16);
  if (i > 10) rueck = Math.max(rueck, Math.hypot(q[0] - w[0]!, q[1] - w[1]!));
}
console.log(`     Rückstand im Zug (12 px je Schritt): ${rueck.toFixed(2)} px`);
p('Im schnellen Zug bleibt der Strich am Stift (unter 5 px Rückstand)',
  rueck < 5, `${rueck.toFixed(2)} px`);

const gl3 = S.glaetter([100, 200]);
const erster = gl3([100, 200], 16);
p('Der Aufsetzpunkt geht unverändert durch',
  Math.abs(erster[0]! - 100) < 1e-9 && Math.abs(erster[1]! - 200) < 1e-9);

/* DER DRUCK: der Median wirft den Ausreisser weg und laesst die Rampe stehen.
   Der erste Anlauf war hier ein gleitendes Mittel — `test343` wurde davon rot,
   weil der Fueller nicht mehr anschwoll. Genau diese zwei Eigenschaften sind
   der Unterschied. */
const dgA = S.druckGlaetter(0.4);
const mitAusreisser = [0.4, 0.42, 0.99, 0.41, 0.43].map((v: number) => dgA(v));
p('Ein einzelner Ausreisser im Druck verschwindet',
  Math.max(...mitAusreisser) < 0.6, JSON.stringify(mitAusreisser));
const dgB = S.druckGlaetter(0.15);
const rampe = [0.15, 0.35, 0.55, 0.75, 0.95];
const durch = rampe.map((v: number) => dgB(v));
p('Eine steigende Rampe kommt unveraendert durch — der Fueller schwillt an',
  durch.every((v: number, i: number) => Math.abs(v - (rampe[Math.max(0, i - 1)] as number)) < 1e-9),
  JSON.stringify(durch));

console.log('\n4 · Die Vorhersage schweigt, wo sie raten müsste');

p('Gerader Zug: sie sagt etwas', S.vorhersage([[0, 0], [10, 0], [20, 0]]).length === 2);
p('Kehrtwende: sie schweigt', S.vorhersage([[0, 0], [10, 0], [2, 0]]).length === 0);
p('Zu wenig bekannt: sie schweigt', S.vorhersage([[0, 0], [1, 0]]).length === 0);
p('Stehender Stift: sie schweigt', S.vorhersage([[0, 0], [10, 0], [10.1, 0]]).length === 0);
const weit = S.vorhersage([[0, 0], [400, 0], [800, 0]]);
p('Ein sehr schneller Zug wird gedeckelt (höchstens VORHER_PX)',
  weit.length === 2 && Math.abs(weit[1]![0]! - 800) <= S.VORHER_PX + 0.01,
  JSON.stringify(weit));
/* Die Zeit MUSS herein: derselbe Zug bei 60 Hz darf keinen doppelt so
   langen Schwanz bekommen wie bei 120 Hz. */
const schnell = S.vorhersage([[0, 0], [10, 0], [20, 0]], S.VORHER_MS, 8);
const langsam = S.vorhersage([[0, 0], [10, 0], [20, 0]], S.VORHER_MS, 16);
p('Der Vorlauf rechnet in Millisekunden, nicht in Punkten',
  langsam[1]![0]! < schnell[1]![0]!,
  `8 ms → ${schnell[1]![0]}, 16 ms → ${langsam[1]![0]}`);

console.log('\n5 · Die Vorhersage geht nie in die Daten');

const fn = new S.Feder();
[[0, 0], [10, 0], [20, 0]].forEach(q => fn.punkt(q as any, 1));
const echt = JSON.stringify(fn.punkte());
const dOhne = fn.d();
fn.nass([[30, 0], [40, 0]] as any, [1, 1]);
p('Der nasse Schwanz verlängert das Bild', fn.d() !== dOhne && fn.d().length > 0);
p('… aber nicht die gespeicherten Punkte', JSON.stringify(fn.punkte()) === echt);
p('… und nicht ihre Zahl', fn.laenge() === 3);
fn.punkt([25, 0] as any, 1);
p('Der nächste echte Punkt wirft den Schwanz weg',
  fn.laenge() === 4 && fn.d() === G.outline(fn.punkte(), fn.breiten()),
  fn.punkte().length + ' Punkte');

console.log('\n6 · Der Bereich ist wirklich verdrahtet');

const ohneWorte = (x: string): string => x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const js = ohneWorte(fs.readFileSync(path.join(WURZEL, 'quell/bereiche/pdf/marken.js'), 'utf-8'));
p('Der Strich wird von einer Feder geführt', /new\s+InkStroke\.Feder\(\)/.test(js));
p('Gezeichnet wird je Bild, nicht je Ereignis', /requestAnimationFrame/.test(js));
p('… und ein bestelltes Bild wird beim Absetzen abgesagt', /cancelAnimationFrame/.test(js));
p('Der Glätter läuft mit', /InkStroke\.glaetter\(/.test(js) && /InkStroke\.druckGlaetter\(/.test(js));
p('Die Vorhersage kommt vom Browser, wo es sie gibt', /getPredictedEvents/.test(js));
p('… und sonst aus dem Kern', /InkStroke\.vorhersage\(/.test(js));
p('Die Vorhersage geht nur ins Bild (feder.nass), nie in running.pts',
  /feder\.nass\(/.test(js) && !/running\.pts\.push\([^)]*vorher/i.test(js));
p('Der Strich steht in der Ladeliste des Dienstes',
  fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf-8').includes('/quell/core/ink/stroke.js'));
p('… und im index.html',
  fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf-8').includes('quell/core/ink/stroke.js'));
p('Die Einzeldatei trägt den Kern mit',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf-8').includes('InkStroke'));

console.log('\n7 · Auf der echten Seite entsteht ein Strich');

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', (e: Error) => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' && typeof App !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1000);
const blattId = await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  const s2 = Store.addPage(null, { text: 'Zeichnen' });
  const b = Store.addBlock(s2.id, 'blatt', { text: '', papier: 'kariert' });
  App.oeffne(s2.id);
  return b.id as string;
});
await seite.waitForTimeout(900);

p('InkStroke ist auf der Seite geladen',
  await seite.evaluate(() => typeof (globalThis as any).InkStroke?.Feder === 'function'));
p('Das Blatt hat eine Zeichenfläche', !!(await seite.$('.blatt-marken')), 'Block ' + String(blattId));

await seite.click('.blatt-werk [data-wz="stift"]');
const kasten = await seite.locator('.blatt-marken').boundingBox();
if (kasten) {
  /* Ein Zug mit vierzig Schritten — lang genug, dass ein vorhergesagter
     Schwanz auffiele, wenn er mitgespeichert würde. */
  const x0 = kasten.x + 60, y0 = kasten.y + 120;
  await seite.mouse.move(x0, y0);
  await seite.mouse.down();
  for (let i = 1; i <= 40; i++) await seite.mouse.move(x0 + i * 6, y0 + Math.sin(i / 4) * 22);
  const letzterX = x0 + 40 * 6;
  await seite.mouse.up();
  await seite.waitForTimeout(300);

  const m = await seite.evaluate((id: string) => {
    const b = Store.getBlock(id);
    const marken = (b?.marken || []) as any[];
    const letzte = marken[marken.length - 1];
    const knoten = document.querySelector(`.blatt-marken [data-sid="${letzte?.id}"]`);
    const kiste = (knoten as SVGGraphicsElement | null)?.getBoundingClientRect();
    return { anzahl: marken.length, art: letzte?.art || '', pts: (letzte?.pts || []) as number[][],
             rechts: kiste ? kiste.right : 0 };
  }, String(blattId));

  p('Ein Strich ist entstanden', m.anzahl >= 1 && m.art === 'stift',
    JSON.stringify({ n: m.anzahl, art: m.art }));
  p('Er hat mehr als zwei Punkte — der Zug ist wirklich abgetastet',
    m.pts.length > 2, String(m.pts.length) + ' Punkte');
  /* DER WICHTIGSTE PUNKT DIESES ABSCHNITTS: der gezeichnete Strich darf
     nicht über den Zeiger hinausragen. Ein mitgespeicherter Vorhersage-
     Schwanz wäre genau hier zu sehen — und nur hier. */
  p('Der Strich endet am Zeiger, nicht dahinter (keine gespeicherte Vorhersage)',
    m.rechts > 0 && m.rechts <= letzterX + 14,
    `rechts ${m.rechts.toFixed(1)} px, Zeiger ${letzterX.toFixed(1)} px`);
  p('Jeder Punkt ist eine Zahl', m.pts.every(q => Number.isFinite(q[0]) && Number.isFinite(q[1])));

  /* ---- DIE ZITTERPROBE AUF DER ECHTEN SEITE ----------------------------
   * Zweimal DERSELBE zittrige Zug: einmal mit ausgehängtem Glätter, einmal
   * mit. Gemessen wird, wie viele Punkte am Ende im Block stehen. Ohne
   * Glätter landet jedes Zittern als eigener Punkt im Papier — das ist
   * mehr Daten, mehr Rechnung bei jedem Neuzeichnen, und man SIEHT es
   * (bilder/e376-glaetter-vergleich.png).
   * -------------------------------------------------------------------- */
  const zittern = async (y0: number): Promise<number> => {
    let saat = 4711;
    const rausch = (): number => { saat = (saat * 1103515245 + 12345) & 0x7fffffff; return saat / 0x7fffffff - 0.5; };
    const x0 = kasten.x + 60;
    await seite.mouse.move(x0, kasten.y + y0);
    await seite.mouse.down();
    for (let i = 1; i <= 130; i++)
      await seite.mouse.move(x0 + i * 2.2 + rausch() * 2.4, kasten.y + y0 + Math.sin(i / 16) * 10 + rausch() * 2.4);
    await seite.mouse.up();
    await seite.waitForTimeout(150);
    return await seite.evaluate((id: string) => {
      const b = Store.getBlock(id);
      const marken = (b?.marken || []) as any[];
      return (marken[marken.length - 1]?.pts || []).length as number;
    }, String(blattId));
  };
  await seite.evaluate(() => {
    (globalThis as any).__echt = (globalThis as any).InkStroke.glaetter;
    (globalThis as any).InkStroke.glaetter = () => (q: number[]) => q;
  });
  const ohne = await zittern(320);
  await seite.evaluate(() => { (globalThis as any).InkStroke.glaetter = (globalThis as any).__echt; });
  const mit = await zittern(440);
  console.log(`     Punkte im Block: ohne Glätter ${ohne} · mit ${mit}`);
  p('Der Glätter halbiert die Punkte eines zittrigen Zugs mindestens',
    ohne > 0 && mit > 0 && mit * 2 <= ohne, `ohne ${ohne}, mit ${mit}`);
  p('… und wirft dabei nicht den ganzen Strich weg', mit >= 4, String(mit));
} else p('Die Zeichenfläche hat ein Mass', false);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
