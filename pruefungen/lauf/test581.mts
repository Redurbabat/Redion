/* Suite 581 — Flüssige Bewegung: die Federn des Touch Kits in Redions eigener Schale (E702)
 * ============================================================================
 * Redur, 27. September 2026, ca. 16:45 UTC: „ich will das es flüssigere
 * animationen … haben". Um 21:45 im Fragebogen zu Redions eigenen Teilen:
 * „Wie im UI-Kit (Empfohlen)" — Knöpfe sinken beim Drücken ein und federn
 * zurück, Blätter und Menüs kommen weich an, Seitenwechsel gleiten ohne
 * Nachschwingen. Und um 22:10: „bessere übergagnge besssere efeckten …
 * ohne eine funktione löschen".
 *
 * Was diese Suite hält — jede Zusage an dem, was der Browser WIRKLICH tut:
 *
 *   §1 Die fünf Federn stehen in grund.css: Zeichen für Zeichen die des
 *      Kits, mit Rückfall für Safari vor 17.2, und still unter „weniger
 *      Bewegung".
 *   §2 Eine Rechnung an zwei Orten: `RedionSpring` (spring.ts) rechnet wie
 *      das Kit — auf einem Gitter nachgerechnet, Bit für Bit —, und die
 *      Kurven in grund.css sind genau, was beide daraus errechnen. Beim
 *      Start da, im Ordner wie in der Einzeldatei, ohne React.
 *   §3 Jeder Knopf sinkt ein und federt zurück — auch beim schnellen
 *      Tippen, bei dem `:active` auf dem iPhone nie gemalt wird; eigene
 *      Druckbilder (Redurs Vorlagen) bleiben unangetastet. An der unteren
 *      Leiste sinkt, wie in der Tab-Leiste des Kits, nur das Zeichen — der
 *      Reiter nicht noch einmal (seit dem Zusammenführen mit E706).
 *   §4 Schalter wie im Kit: der Griff dehnt sich unter dem Finger und
 *      federt hinüber; kein Verlauf dreht sich endlos im Ruhezustand.
 *   §5 Blätter von unten: vom Rand herein, der Grund blendet auf, das Blatt
 *      folgt dem Finger, geht weggewischt oder mit einem Tipp daneben MIT
 *      Abgang — und Escape und die Wahl eines Eintrags bleiben sofort
 *      (E302, und die Prüfläufe, die das seit Monaten halten).
 *   §6 Ein Ortswechsel, eine Ankunft: Tippen unten wie Wischen, aus der
 *      richtigen Richtung, gleitend ohne Nachschwingen — und nicht zwei
 *      Bewegungen zugleich. In den Einstellungen am Telefon ebenso.
 *   §7 „Ruhige Darstellung" hält wirklich alles an: auch `::after`, auch
 *      die Bewegungen aus JavaScript, auch die Inseln (data-ui-motion).
 *   §8 Nur transform und opacity: kein `transition: all`, und die
 *      ersetzten `:active`-Regeln tragen kein zweites Einsinken mehr.
 *   §9 Eine Federsprache: kein TypeScript der App schreibt eine eigene
 *      Kurve (`cubic-bezier(`) — Zusammenführen der zweiten Welle.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Sie WAR es: rot eingecheckt (commit „test581 (rot)") gegen den Stand
 * 515451f, bevor es Marken, Übertragung, Druckfeder und Blattgeste gab.
 * Dazu Gegenproben im Lauf selbst: eine verbogene Kurve, eine andere Feder
 * im Gitter, eine eingeschmuggelte `:active`-Skalierung, ein `transition:
 * all`.
 *
 * Kein Port: alles über file:// (Doppelklick) — test400 hat nichts zu
 * verteilen.
 *
 *   node pruefungen/lauf/test581.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { BrowserContext, CDPSession, Page } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

declare const App: any, Store: any, UI: any, Einstellungen: any, Dialog: any, AppEinstellung: any;
declare const RedionSpring: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)?.slice(0, 300)}, soll ${JSON.stringify(soll)?.slice(0, 300)}`);
const da = (f: string): boolean => fs.existsSync(path.join(WURZEL, f));
const lies = (f: string): string => da(f) ? fs.readFileSync(path.join(WURZEL, f), 'utf8') : '';
const ohneKommentare = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

const FEDERN = [
  ['druck', 'press'], ['knapp', 'snappy'], ['sanft', 'smooth'],
  ['lebhaft', 'bouncy'], ['weich', 'gentle'],
] as const;

/* ==========================================================================
 * §1 · Die fünf Federn stehen in grund.css
 * ======================================================================== */
console.log('\n§1 · Die fünf Federn des Kits stehen in grund.css — Zeichen für Zeichen, mit Rückfall');

const grund = ohneKommentare(lies('quell/schale/stil/grund.css'));
const kitMarken = ohneKommentare(lies('fremd/touch/motion-tokens.css'));
const wert = (css: string, name: string): string | null => {
  const m = new RegExp('(?:^|[;{\\s])' + name.replace(/-/g, '\\-') + '\\s*:\\s*([^;]+);').exec(css);
  return m ? (m[1] ?? '').trim().replace(/\s+/g, ' ') : null;
};
/* Der Rückfall steht im :root-Block, die Kurve im @supports-Block. */
const supportsBlock = /@supports\s*\(\s*transition-timing-function\s*:\s*linear\(\s*0\s*,\s*1\s*\)\s*\)\s*\{([\s\S]*?)\n\}/.exec(grund)?.[1] ?? '';
p('grund.css hat einen @supports-Block für linear() (Rückfall für Safari vor 17.2)', supportsBlock.length > 0);
const rootOhneSupports = grund.replace(supportsBlock, '');
for (const [redion, kit] of FEDERN) {
  const kurve = wert(supportsBlock, '--feder-' + redion);
  gleich(`--feder-${redion} ist die Kurve des Kits (--ui-spring-${kit})`, kurve, wert(kitMarken, '--ui-spring-' + kit));
  gleich(`--feder-${redion}-dauer ist die Dauer des Kits`, wert(rootOhneSupports, '--feder-' + redion + '-dauer'),
    wert(kitMarken, '--ui-spring-' + kit + '-duration'));
  gleich(`… und ohne linear() fällt --feder-${redion} auf --ease-enter zurück`,
    wert(rootOhneSupports, '--feder-' + redion), 'var(--ease-enter)');
}
{
  /* Gegenprobe: eine Kurve, in der eine Zahl verbogen ist, fällt auf. */
  const echt = wert(supportsBlock, '--feder-druck') ?? '';
  p('Gegenprobe: eine verbogene Zahl in einer Kurve fällt auf',
    echt.length > 0 && echt.replace('1.0457', '1.0458') !== wert(kitMarken, '--ui-spring-press'));
}
/* Unter „weniger Bewegung" stehen die Dauern auf 1 ms — auch für den, der in
   JavaScript damit rechnet. */
const reduziert = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*:root\s*\{([\s\S]*?)\}/.exec(grund)?.[1] ?? '';
gleich('Unter „weniger Bewegung" stehen alle fünf Dauern auf 1ms',
  FEDERN.map(([r]) => wert(reduziert, '--feder-' + r + '-dauer')), FEDERN.map(() => '1ms'));

/* ==========================================================================
 * §2 · Eine Rechnung an zwei Orten
 * --------------------------------------------------------------------------
 * `spring.ts` ist eine ÜBERTRAGUNG aus dem Kit, nicht das Kit selbst. Damit
 * die zwei nicht auseinanderlaufen (§8), rechnet diese Suite beide nach: die
 * Dateien des Kits werden mit TypeScript übersetzt und in einer Nachbildung
 * ausgewertet, `spring.js` ebenso — und auf einem Gitter aus Federn,
 * Anfangsorten, Tempi und Zeiten muss GENAU dasselbe herauskommen.
 * ======================================================================== */
console.log('\n§2 · Eine Rechnung an zwei Orten: RedionSpring rechnet wie das Kit');

const SPRING_JS = 'quell/schale/bedienung/spring.js';
p('spring.ts ist die Quelle, spring.js ist erzeugt',
  da('src/schale/bedienung/spring.ts') && /ERZEUGT/.test(lies(SPRING_JS)));
const html = lies('index.html');
p('index.html lädt spring.js — klassisch, mit defer, beim Start',
  html.includes('<script src="quell/schale/bedienung/spring.js" defer></script>'));
p('… und der GRUNDSTOCK kennt es (§28)', lies('src/dienst/sw.ts').includes("'./quell/schale/bedienung/spring.js'"));

const require = createRequire(import.meta.url);
let ts: any = null;
try { ts = require(path.join(WURZEL, 'node_modules', 'typescript')); } catch { ts = null; }
const kitModul = (datei: string, geladen: Record<string, any>): any => {
  const quelle = lies('fremd/touch/' + datei);
  const js = ts.transpileModule(quelle, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} as any };
  const kontext = vm.createContext({ module, exports: module.exports, Math, Number, String, RangeError, Set,
    require: (n: string) => { const k = geladen[n]; if (!k) throw new Error('unbekannt: ' + n); return k; } });
  vm.runInContext(js, kontext, { filename: datei });
  return module.exports;
};
let kit: any = null, redion: any = null;
if (ts) {
  const spring = kitModul('motion/spring.ts', {});
  kit = {
    ...spring,
    ...kitModul('motion/presets.ts', { './spring': spring }),
    ...kitModul('gesture/velocity.ts', {}),
    ...kitModul('gesture/rubberband.ts', {}),
  };
}
if (da(SPRING_JS)) {
  const fenster: Record<string, unknown> = { Math, Number, String, RangeError, getComputedStyle: () => { throw new Error('keine Seite'); } };
  fenster['window'] = fenster;
  const kontext = vm.createContext(fenster);
  try { vm.runInContext(lies(SPRING_JS) + '\n;globalThis.__rs = RedionSpring;', kontext, { filename: SPRING_JS }); redion = (fenster as any).__rs; }
  catch (e: unknown) { console.log('    (spring.js: ' + (e instanceof Error ? e.message : String(e)) + ')'); }
}
p('Das Kit lässt sich übersetzen und auswerten', !!kit?.solveSpring && !!kit?.springPresets);
p('spring.js lässt sich auswerten und legt RedionSpring an', !!redion?.solve);

if (kit && redion) {
  gleich('Dieselben fünf Voreinstellungen, dieselben Zahlen', redion.PRESETS, kit.springPresets);
  const namen = ['press', 'snappy', 'smooth', 'bouncy', 'gentle'] as const;
  gleich('fromPerceptual: dieselben Federn', namen.map(n => redion.preset(n)), namen.map(n => kit.springPreset(n)));
  /* Das Gitter: jede Feder, drei Wege, drei Tempi, 31 Zeitpunkte. */
  let abweichungen = 0, punkte = 0;
  const federn = [...namen.map(n => kit.springPreset(n)), { stiffness: 400, damping: 40, mass: 1 }, { stiffness: 200, damping: 60, mass: 1.5 }];
  for (const f of federn)
    for (const [von, nach] of [[0, 1], [140, 0], [-30, 12]] as const)
      for (const v0 of [0, 800, -1500])
        for (let i = 0; i <= 30; i++) {
          const t = i * 0.025;
          const a = kit.solveSpring(f, von, nach, v0)(t), b = redion.solve(f, von, nach, v0)(t);
          punkte++;
          if (a.value !== b.value || a.velocity !== b.velocity) abweichungen++;
        }
  gleich(`solve: ${punkte} Punkte (Feder × Weg × Tempo × Zeit), Bit für Bit gleich`, abweichungen, 0);
  gleich('settle: gleiche Ruhezeiten', federn.map(f => redion.settle(f, 0, 1, 0)), federn.map(f => kit.settleDuration(f, 0, 1, 0)));
  const kurven = namen.map(n => redion.toLinearEasing(redion.preset(n)));
  gleich('toLinearEasing: dieselben Kurven wie das Kit', kurven, namen.map(n => kit.springToLinearEasing(kit.springPreset(n))));
  gleich('… und genau die Kurven in grund.css', kurven.map(k => k.easing),
    FEDERN.map(([r]) => wert(supportsBlock, '--feder-' + r)));
  gleich('… mit genau den Dauern in grund.css', kurven.map(k => Math.round(k.duration * 1000) + 'ms'),
    FEDERN.map(([r]) => wert(rootOhneSupports, '--feder-' + r + '-dauer')));
  /* Das Tempo aus Fingerproben, und das Gummiband. */
  const reihe: Array<[number, number]> = [[0, 0], [4, 16], [11, 33], [25, 50], [48, 66], [70, 83], [90, 100], [96, 116]];
  const tk = kit.createVelocityTracker(), tr = redion.velocityTracker();
  const vk: number[] = [], vr: number[] = [];
  for (const [w, z] of reihe) { tk.add(w, z); tr.add(w, z); vk.push(tk.velocity(z)); vr.push(tr.velocity(z)); }
  vk.push(tk.velocity(260)); vr.push(tr.velocity(260));
  gleich('velocityTracker: dieselben Tempi (auch 0 nach einer Pause)', vr, vk);
  const gummi = [[-80, 400], [30, 600], [0, 10], [200, 0]].map(([o, d]) => [redion.rubberband(o, d), kit.rubberband(o, d)]);
  p('rubberband: dieselben Werte', gummi.every(([a, b]) => a === b), JSON.stringify(gummi));
  gleich('rubberbandClamp: dieselben Werte',
    [[-50, 0, 100, 300], [150, 0, 100, 300], [40, 0, 100, 300]].map(([v, a, b, d]) => redion.rubberbandClamp(v, a, b, d)),
    [[-50, 0, 100, 300], [150, 0, 100, 300], [40, 0, 100, 300]].map(([v, a, b, d]) => kit.rubberbandClamp(v, a, b, d)));
  /* Gegenprobe: eine andere Feder im Gitter muss auffallen. */
  const anders = { ...kit.springPreset('press'), damping: kit.springPreset('press').damping * 1.001 };
  p('Gegenprobe: eine um ein Promille andere Dämpfung fällt auf',
    kit.solveSpring(kit.springPreset('press'), 0, 1, 0)(0.1).value !== redion.solve(anders, 0, 1, 0)(0.1).value);
  /* Redions Zusatz: Stützpunkte für element.animate() — Anfang, Ende, Tempo. */
  const bahn = redion.sample(redion.preset('snappy'), 120, 0, -900);
  p('sample: die Bahn beginnt am Anfang und endet genau am Ziel',
    bahn.values[0] === 120 && bahn.values[bahn.values.length - 1] === 0 && bahn.duration > 100 && bahn.duration < 1200,
    JSON.stringify({ n: bahn.values.length, d: bahn.duration }));
}

/* §9 · EINE FEDERSPRACHE IM QUELLTEXT (Zusammenführen der zweiten Welle,
   5. Oktober 2026). E702 hat die Federn des Kits zur einen Bewegung gemacht;
   die zweite Welle brachte eine handgemachte Kurve zurück (E711, „Alle
   gelesen": `cubic-bezier(.5,0,.2,1)` über 460 ms). Hier gezählt: kein
   TypeScript der App (die Inseln ausgenommen, sie tragen die Federn des
   Kits selbst) schreibt `cubic-bezier(` in eine Zeichenkette. In Kommentaren
   darf es stehen — dort erklärt es, was einmal war. */
console.log('\n§9 · Eine Federsprache: keine handgemachte Kurve im TypeScript der App');
{
  const alleTs = (d: string): string[] => fs.readdirSync(path.join(WURZEL, d), { withFileTypes: true }).flatMap(e => {
    const f = path.join(d, e.name);
    return e.isDirectory() ? (e.name === 'islands' ? [] : alleTs(f)) : (/\.ts$/.test(e.name) ? [f] : []);
  });
  const handgemacht = alleTs('src').flatMap(f => lies(f).split('\n')
    .map((z, i) => ({ z, i }))
    .filter(({ z }) => /['"]cubic-bezier\(/.test(z))
    .map(({ i }) => f.split(path.sep).join('/') + ':' + (i + 1)));
  p('Keine eigene Kurve: jede Bewegung im TypeScript fährt eine Feder (RedionSpring)',
    handgemacht.length === 0, JSON.stringify(handgemacht));
}

/* ==========================================================================
 * Ab hier im Browser.
 * ======================================================================== */
const browser = await chromium.launch();
const fehler: string[] = [];
type Offen = { ctx: BrowserContext; s: Page; cdp: CDPSession };
const oeffne = async (opt: { handy?: boolean; reduce?: boolean; datei?: string } = {}): Promise<Offen> => {
  const ctx = await browser.newContext({
    viewport: opt.handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    ...(opt.handy ? { hasTouch: true, isMobile: true, deviceScaleFactor: 2 } : {}),
    reducedMotion: opt.reduce ? 'reduce' : 'no-preference'
  });
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push(String(e).slice(0, 200)));
  /* Was beim START da ist — im Augenblick von DOMContentLoaded, bevor der
     Lader im Leerlauf React von der Platte vorwärmt (E699, erlaubt). */
  await s.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const w = window as any;
      w.__beimStart = { spring: typeof w.RedionSpring !== 'undefined' || typeof (globalThis as any).RedionSpring !== 'undefined',
                        react: typeof w.RedionReact !== 'undefined' };
    });
  });
  await s.goto(pathToFileURL(path.join(WURZEL, opt.datei ?? 'index.html')).href);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    document.querySelectorAll('.overlay').forEach(o => o.remove());
  });
  await s.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(s);
  return { ctx, s, cdp };
};
const finger = {
  ab: (cdp: CDPSession, x: number, y: number) => cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }),
  zu: (cdp: CDPSession, x: number, y: number) => cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }),
  auf: (cdp: CDPSession) => cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }),
};
/** Der Klick soll bei den Proben nichts auslösen — gemessen wird nur die Rückmeldung. */
const klicksSchlucken = (s: Page, an: boolean) => s.evaluate((an: boolean) => {
  const w = window as any;
  if (!w.__schluck) w.__schluck = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
  if (an) document.addEventListener('click', w.__schluck, true);
  else document.removeEventListener('click', w.__schluck, true);
}, an);
const mitte = (s: Page, sel: string) => s.evaluate((sel: string) => {
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) return null;
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, b: r.width };
}, sel);
const breite = (s: Page, sel: string) => s.evaluate((sel: string) =>
  document.querySelector<HTMLElement>(sel)?.getBoundingClientRect().width ?? -1, sel);

/* ==========================================================================
 * §2b · Beim Start da — im Ordner und in der Einzeldatei, ohne React
 * ======================================================================== */
{
  const o = await oeffne();
  const ordner = await o.s.evaluate(() => ({
    da: typeof RedionSpring !== 'undefined' && typeof RedionSpring.solve === 'function' && (window as any).__beimStart?.spring === true,
    react: (window as any).__beimStart?.react !== false,
    kurve: (typeof RedionSpring !== 'undefined') ? RedionSpring.token('press').easing.slice(0, 7) : '',
    wenig: typeof AppEinstellung?.wenigBewegung === 'function'
  }));
  p('Im Ordner (Doppelklick): RedionSpring ist beim Start da — ohne React', ordner.da && !ordner.react, JSON.stringify(ordner));
  gleich('… und liest die Druckfeder aus grund.css (linear())', ordner.kurve, 'linear(');
  p('AppEinstellung.wenigBewegung() gibt es — EINE Frage für OS und „Ruhige Darstellung"', ordner.wenig);
  await o.ctx.close();
  if (da('redion-einzeldatei.html')) {
    const e = await oeffne({ datei: 'redion-einzeldatei.html' });
    const einzel = await e.s.evaluate(() => typeof RedionSpring !== 'undefined' && typeof RedionSpring.solve === 'function');
    p('In der Einzeldatei ebenso', einzel);
    await e.ctx.close();
  }
}

/* ==========================================================================
 * §3 · Jeder Knopf sinkt ein und federt zurück
 * ======================================================================== */
console.log('\n§3 · Jeder Knopf sinkt ein und federt zurück — auch beim schnellen Tippen');
{
  const o = await oeffne({ handy: true });
  const { s, cdp } = o;
  await klicksSchlucken(s, true);
  /* Proben aus dem Dokumente-Bildschirm, der Menüleiste, der unteren Leiste
     und den Einstellungen: vorher antworteten die meisten GAR NICHT. */
  const proben = ['.bib-neu', '.bib-studio-import', '.bib-ort', '#mb-suche', '#hl-bespr', '#hl-mehr'];
  /* DIE UNTERE LEISTE IST EINE TAB-LEISTE WIE IM KIT (E706): dort sinkt das
     ZEICHEN (0,9, `SelectionFlow.druecke`), nicht der ganze Reiter — und
     nicht beides. Beim Zusammenführen von E702 und E706 sanken beide: der
     Reiter auf 0,96 und darin das Zeichen auf 0,9. Gemessen wird deshalb an
     einem Reiter das Zeichen, und der Reiter selbst muss stehen bleiben. */
  const REITER = ['#hl-bespr', '#hl-mehr'];
  const was = (sel: string): string => REITER.includes(sel) ? sel + ' .ho-z' : sel;
  const ergebnis: Array<{ sel: string; rest: number; gedrueckt: number; danach: number;
    kurve: { easing: string; bilder: number; hoechster: number }; reiter: number }> = [];
  for (const sel of proben) {
    const m = await mitte(s, sel);
    if (!m) { ergebnis.push({ sel, rest: -1, gedrueckt: -1, danach: -1, kurve: { easing: '', bilder: 0, hoechster: 0 }, reiter: -1 }); continue; }
    await s.waitForTimeout(150);
    const rest = await breite(s, was(sel));
    const reiterRest = await breite(s, sel);
    await finger.ab(cdp, m.x, m.y);
    await s.waitForTimeout(140);
    const gedrueckt = await breite(s, was(sel));
    const reiter = (await breite(s, sel)) / reiterRest;
    await finger.auf(cdp);
    await s.waitForTimeout(60);
    /* Gesucht wird die Bewegung auf `scale` — daneben laufen am selben
       Knopf oft Übergänge der Farbe, und die haben ihre eigene Kurve. */
    const kurve = await s.evaluate((sel: string) => {
      const a = document.querySelector<HTMLElement>(sel)?.getAnimations().find(x => x.playState === 'running' &&
        ((x.effect as KeyframeEffect | null)?.getKeyframes() ?? []).some(k => 'scale' in k));
      const werte = a ? ((a.effect as KeyframeEffect | null)?.getKeyframes() ?? []).map(k => parseFloat(String(k['scale'] ?? '1'))) : [];
      return { easing: a ? String(a.effect?.getTiming().easing ?? '') : '', bilder: werte.length,
               hoechster: werte.length ? Math.max(...werte) : 0 };
    }, was(sel));
    await s.waitForTimeout(800);
    ergebnis.push({ sel, rest, gedrueckt, danach: await breite(s, was(sel)), kurve, reiter });
  }
  const sinkt = ergebnis.filter(e => e.rest > 0 && e.gedrueckt / e.rest <= 0.99);
  gleich('Alle sechs Proben sinken unter dem Finger ein (≤ 99 % Breite; an einem Reiter das Zeichen)', sinkt.map(e => e.sel), proben);
  p('… und keine zu tief (≥ 95 %, das Zeichen eines Reiters ≥ 85 % wie im Kit): ein Einsinken, kein Sprung',
    ergebnis.every(e => e.rest <= 0 || e.gedrueckt / e.rest >= (REITER.includes(e.sel) ? 0.85 : 0.95)),
    ergebnis.map(e => `${e.sel} ${(e.gedrueckt / e.rest).toFixed(3)}`).join(' · '));
  gleich('An der unteren Leiste sinkt nur das Zeichen — der Reiter nicht noch einmal (≥ 99,5 %)',
    ergebnis.filter(e => REITER.includes(e.sel) && e.reiter < 0.995).map(e => `${e.sel} ${e.reiter.toFixed(3)}`), []);
  gleich('Sie kommen ganz zurück', ergebnis.filter(e => e.rest > 0 && Math.abs(e.danach - e.rest) > 0.5).map(e => e.sel), []);
  /* Die Druckfeder des Kits hat zwei Gestalten: press.ts gibt sie als
     `linear()`-Kurve, `SelectionFlow` rechnet dieselbe Feder (RedionSpring,
     E702) Bild für Bild aus. Beide müssen über 1 hinaus zurückfedern. */
  gleich('Das Loslassen fährt die Druckfeder des Kits (linear() oder ihre Bahn, mit Rückprall)',
    ergebnis.filter(e => !/^linear\(/.test(e.kurve.easing) && !(e.kurve.bilder >= 20 && e.kurve.hoechster > 1.002))
      .map(e => e.sel), []);

  /* DER SCHNELLE TIPP. Auf dem iPhone wird `:active` bei einem kurzen Tipp
     oft gar nicht gemalt — Finger ab und auf, bevor ein Bild entsteht. Die
     Druckfeder hält das Eingesunkene mindestens 80 ms. Gemessen wird Bild
     für Bild, was der Browser wirklich malt. */
  const schnell = await (async () => {
    const m = await mitte(s, '.bib-ort');
    if (!m) return null;
    await s.waitForTimeout(300);
    await s.evaluate(() => {
      const w = window as any; w.__min = 1; const el = document.querySelector<HTMLElement>('.bib-ort')!;
      const rest = el.getBoundingClientRect().width; const bis = performance.now() + 500;
      const schau = () => { w.__min = Math.min(w.__min, el.getBoundingClientRect().width / rest); if (performance.now() < bis) requestAnimationFrame(schau); };
      requestAnimationFrame(schau);
    });
    await finger.ab(cdp, m.x, m.y);
    await finger.auf(cdp);
    await s.waitForTimeout(600);
    return await s.evaluate(() => (window as any).__min as number);
  })();
  p('Ein schneller Tipp (ab und auf ohne Pause) malt das Einsinken trotzdem', schnell !== null && schnell < 0.995, String(schnell));

  /* EIN ABGESCHALTETER KNOPF DRÜCKT SICH NICHT (grund.css, §15): er sähe
     sonst aus, als hätte er reagiert. „Zurück" ist beim Start abgeschaltet. */
  const aus = await s.evaluate(() => {
    const b = document.querySelector<HTMLButtonElement>('#btn-back');
    if (!b) return null;
    const alt = b.disabled; b.disabled = true;
    const r = b.getBoundingClientRect();
    return { alt, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width };
  });
  if (aus && aus.w > 0) {
    await finger.ab(cdp, aus.x, aus.y);
    await s.waitForTimeout(140);
    const w = await breite(s, '#btn-back');
    const zustand = await s.evaluate(() => document.querySelector('#btn-back')!.hasAttribute('data-gedrueckt'));
    await finger.auf(cdp);
    p('Ein abgeschalteter Knopf („Zurück" beim Start) sinkt nicht ein und gilt nicht als gedrückt',
      Math.abs(w - aus.w) < 0.1 && !zustand, `${aus.w} → ${w}, data-gedrueckt ${zustand}`);
    await s.evaluate((alt: boolean) => { document.querySelector<HTMLButtonElement>('#btn-back')!.disabled = alt; }, aus.alt);
  }

  /* EIGENE DRUCKBILDER BLEIBEN. Redurs Vorlagen (motion.css) drücken den
     Hauptknopf eines Dialogs 2 px hinunter; ein zweites Einsinken obendrauf
     wäre doppelt. */
  await s.evaluate(() => {
    const f = document.createElement('div'); f.className = 'fbtns'; f.id = 'probe-fbtns';
    f.innerHTML = '<button class="prim" id="probe-prim">Speichern</button>';
    f.style.cssText = 'position:fixed;left:40px;top:300px;z-index:9999';
    document.body.append(f);
  });
  await s.waitForTimeout(300);
  const prim = await mitte(s, '#probe-prim');
  if (prim) {
    await finger.ab(cdp, prim.x, prim.y);
    await s.waitForTimeout(140);
    const skala = await s.evaluate(() => getComputedStyle(document.getElementById('probe-prim')!).scale);
    await finger.auf(cdp);
    p('Ein Knopf mit eigenem Druckbild (.fbtns .prim) bekommt kein zweites Einsinken', skala === 'none' || skala === '1', skala);
  }
  await s.evaluate(() => document.getElementById('probe-fbtns')?.remove());

  /* RUHIGE DARSTELLUNG: kein Einsinken als Bewegung — aber der Zustand ist
     trotzdem zu sehen (data-gedrueckt), damit der Finger eine Antwort hat. */
  await s.evaluate(() => Einstellungen.S('bewegung', 'ruhig'));
  const r = await mitte(s, '.bib-ort');
  if (r) {
    await finger.ab(cdp, r.x, r.y);
    await s.waitForTimeout(140);
    const ruhig = await s.evaluate(() => {
      const el = document.querySelector<HTMLElement>('.bib-ort')!;
      return { skala: getComputedStyle(el).scale, laeuft: el.getAnimations().filter(a => a.playState === 'running').length,
               zustand: el.hasAttribute('data-gedrueckt') };
    });
    await finger.auf(cdp);
    p('Unter „Ruhige Darstellung": kein Einsinken, keine laufende Bewegung', (ruhig.skala === 'none' || ruhig.skala === '1') && ruhig.laeuft === 0, JSON.stringify(ruhig));
    p('… aber der gedrückte Zustand ist trotzdem da (data-gedrueckt)', ruhig.zustand);
  }
  await s.evaluate(() => Einstellungen.S('bewegung', 'normal'));
  await klicksSchlucken(s, false);
  await o.ctx.close();
}

/* ==========================================================================
 * §4 · Schalter wie im Kit
 * ======================================================================== */
console.log('\n§4 · Schalter wie im Kit: der Griff dehnt sich, federt hinüber, nichts dreht endlos');
{
  const o = await oeffne({ handy: true });
  const { s, cdp } = o;
  await s.evaluate(() => { Einstellungen.S('seiteZu', true); Einstellungen.oeffne('allgemein'); });
  await s.waitForTimeout(700);
  const SEL = '.schalter[data-toggle="seiteZu"]';
  const ruhe = await s.evaluate(() => {
    const endlos = document.getAnimations().filter(a => {
      const z = (a.effect as KeyframeEffect | null)?.target;
      return z instanceof Element && z.closest('.schalter') && a.effect?.getTiming().iterations === Infinity && a.playState === 'running';
    });
    return { an: document.querySelectorAll('.schalter.an').length, endlos: endlos.length };
  });
  p('Es gibt einen eingeschalteten Schalter', ruhe.an >= 1, String(ruhe.an));
  /* Der 7-s-Kreisel aus E462 (einstellungen.css) läuft im Betrieb schon
     seit E535 nicht mehr — motion.css legt „eine kurze Zustandsbewegung"
     darüber. Diese Zeile hält, dass es so bleibt, auch im Stilblatt selbst
     (§8 liest es). */
  gleich('Im Ruhezustand dreht sich in keinem Schalter etwas endlos', ruhe.endlos, 0);
  const knopf = await mitte(s, SEL);
  if (knopf) {
    await s.waitForTimeout(200);
    const griffVor = await breite(s, SEL + ' > i');
    await finger.ab(cdp, knopf.x, knopf.y);
    await s.waitForTimeout(160);
    const griffGedrueckt = await breite(s, SEL + ' > i');
    await finger.auf(cdp);
    await s.waitForTimeout(60);
    const bahn = await s.evaluate((sel: string) => {
      const i = document.querySelector<HTMLElement>(sel + ' > i')!;
      const st = getComputedStyle(i);
      const laeuft = i.getAnimations().map(a => ({ was: (a as any).transitionProperty ?? '', kurve: String(a.effect?.getTiming().easing ?? '') }));
      return { props: st.transitionProperty, kurven: st.transitionTimingFunction, laeuft,
               an: document.querySelector(sel)!.classList.contains('an') };
    }, SEL);
    await s.waitForTimeout(900);
    const griffDanach = await breite(s, SEL + ' > i');
    p('Unter dem Finger dehnt sich der Griff (≥ 110 % Breite, wie im Kit 27 → 32 px)', griffGedrueckt / griffVor >= 1.1,
      `${griffVor.toFixed(1)} → ${griffGedrueckt.toFixed(1)}`);
    p('Losgelassen wandert er auf der knappen Feder hinüber (translate, linear())',
      /translate/.test(bahn.props) && /linear\(/.test(bahn.kurven), `${bahn.props} | ${bahn.kurven.slice(0, 80)}`);
    p('… und der Schalter hat wirklich umgeschaltet', bahn.an === false, JSON.stringify(bahn.an));
    p('Danach hat der Griff wieder seine Breite', Math.abs(griffDanach - griffVor) < 0.5, `${griffVor} / ${griffDanach}`);
    /* Wieder an: jetzt dreht der Verlauf EINMAL mit — Bewegung, die einen
       Zustand sagt, statt Bewegung im Ruhezustand (motion.css, E535). Und er
       dreht sich UM SEINE MITTE: bis E702 verlor die Drehung das
       `translate(-50%,-50%)`, das den Kreis mittig hält — der Verlauf glitt
       0,65 s lang zur Ecke und sprang dann zurück. Gemessen wird der
       Versatz des ::before mitten in der Drehung. */
    await finger.ab(cdp, knopf.x, knopf.y); await s.waitForTimeout(40); await finger.auf(cdp);
    await s.waitForTimeout(120);
    const verlauf = await s.evaluate((sel: string) => {
      const el = document.querySelector(sel)!;
      const vor = document.getAnimations().filter(a => (a.effect as any)?.target === el && (a.effect as any)?.pseudoElement === '::before');
      const st = getComputedStyle(el, '::before');
      const m = st.transform === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(st.transform);
      return { n: vor.length, endlos: vor.some(a => a.effect?.getTiming().iterations === Infinity),
               an: el.classList.contains('an'), x: m.m41, y: m.m42, halb: -parseFloat(st.width) / 2 };
    }, SEL);
    p('Beim Einschalten dreht der Verlauf einmal mit — endlich, nicht endlos', verlauf.an && verlauf.n >= 1 && !verlauf.endlos, JSON.stringify(verlauf));
    p('… und zwar um seine Mitte (Versatz bleibt −50 %, kein Gleiten zur Ecke)',
      Math.abs(verlauf.x - verlauf.halb) < 1.5 && Math.abs(verlauf.y - verlauf.halb) < 1.5,
      `${verlauf.x.toFixed(1)}, ${verlauf.y.toFixed(1)} statt ${verlauf.halb.toFixed(1)}`);
  }
  await o.ctx.close();
}

/* ==========================================================================
 * §5 · Blätter von unten
 * ======================================================================== */
console.log('\n§5 · Blätter von unten: vom Rand, dem Finger nach, weggewischt — mit Abgang');
{
  const o = await oeffne({ handy: true });
  const { s, cdp } = o;
  const MENU = '<button data-a="a">Umbenennen</button><button data-a="b">Duplizieren</button>' +
               '<button data-a="c">Verschieben</button><hr><button data-a="del">Löschen</button>';
  /* Geöffnet, und im ERSTEN Bild danach gemessen: wo steht das Blatt, wie
     dunkel ist der Grund? */
  const auf = () => s.evaluate((html: string) => new Promise<{ y: number; h: number; grund: number }>(fertig => {
    UI.menu(html, 20, 20, { titel: 'Seite' });
    requestAnimationFrame(() => {
      const m = document.querySelector<HTMLElement>('.menu')!;
      const t = getComputedStyle(m).transform;
      fertig({ y: t === 'none' ? 0 : new DOMMatrixReadOnly(t).m42, h: m.offsetHeight,
               grund: Number(getComputedStyle(document.querySelector('.menu-grund')!).opacity) });
    });
  }), MENU);
  const versatz = () => s.evaluate(() => {
    const m = document.querySelector<HTMLElement>('.menu');
    if (!m) return null;
    const t = getComputedStyle(m).transform;
    return { y: t === 'none' ? 0 : new DOMMatrixReadOnly(t).m42, grund: Number(getComputedStyle(document.querySelector('.menu-grund')!).opacity) };
  });
  const offen = () => s.evaluate(() => ({ menu: !!document.querySelector('.menu'), grund: !!document.querySelector('.menu-grund') }));

  const erstes = await auf();
  p('Im ersten Bild steht das Blatt noch unten (≥ 50 % seiner Höhe unter der Ruhelage)',
    erstes.y >= 0.5 * erstes.h, JSON.stringify(erstes));
  p('… und der dunkle Grund blendet auf, statt in einem Bild da zu sein', erstes.grund < 0.9, String(erstes.grund));
  await s.waitForTimeout(1000);
  const ruhe = await versatz();
  p('Nach der Ankunft liegt es auf dem Rand, der Grund ganz da', !!ruhe && Math.abs(ruhe.y) < 1 && ruhe.grund > 0.99, JSON.stringify(ruhe));
  const kurve = await s.evaluate(() => {
    UI.menu('<button>Eins</button>', 0, 0, { titel: 'X' });
    const a = document.querySelector('.menu')!.getAnimations()[0];
    return a ? String(a.effect?.getTiming().easing ?? '') + ' | ' + ((a as any).animationName ?? '') : '';
  });
  p('Es kommt auf der sanften Feder (linear(), ohne Nachschwingen — wie die Aktionsblätter des Kits)',
    /^linear\(/.test(kurve) && !/\b1\.\d*[1-9]/.test(kurve.split('|')[0] ?? ''), kurve.slice(0, 90));
  await s.evaluate(() => document.querySelectorAll('.menu, .menu-grund').forEach(m => m.remove()));

  /* DEM FINGER NACH. */
  await auf(); await s.waitForTimeout(1000);
  const griff = await s.evaluate(() => { const r = document.querySelector('.menu .blatt-titel')!.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await finger.ab(cdp, griff.x, griff.y);
  for (let d = 10; d <= 60; d += 10) { await finger.zu(cdp, griff.x, griff.y + d); await s.waitForTimeout(16); }
  await s.waitForTimeout(50);
  const gezogen = await versatz();
  p('Gezogen um 60 px folgt das Blatt dem Finger (60 ± 3 px)', !!gezogen && Math.abs(gezogen.y - 60) <= 3, JSON.stringify(gezogen));
  p('… und der Grund wird heller', !!gezogen && gezogen.grund < 1, JSON.stringify(gezogen));
  for (let d = 50; d >= 30; d -= 10) { await finger.zu(cdp, griff.x, griff.y + d); await s.waitForTimeout(40); }
  await s.waitForTimeout(150);
  await finger.auf(cdp);
  await s.waitForTimeout(900);
  const zurueck = await versatz();
  p('Bei 30 px losgelassen federt es zurück und bleibt offen', !!zurueck && Math.abs(zurueck.y) < 1 && zurueck.grund > 0.99, JSON.stringify(zurueck));
  /* Nach oben: ein Gummiband, kein Losreissen. */
  await finger.ab(cdp, griff.x, griff.y);
  for (let d = 10; d <= 80; d += 10) { await finger.zu(cdp, griff.x, griff.y - d); await s.waitForTimeout(16); }
  const oben = await versatz();
  await finger.auf(cdp);
  p('Nach oben gezogen gibt es nur widerwillig nach (Gummiband: 0 > y > −40)', !!oben && oben.y < -0.5 && oben.y > -40, JSON.stringify(oben));
  await s.waitForTimeout(900);
  /* Weggewischt: MIT Abgang. */
  await finger.ab(cdp, griff.x, griff.y);
  for (let d = 20; d <= 160; d += 20) { await finger.zu(cdp, griff.x, griff.y + d); await s.waitForTimeout(16); }
  await finger.auf(cdp);
  await s.waitForTimeout(30);
  const imAbgang = await s.evaluate(() => {
    const m = document.querySelector<HTMLElement>('.menu');
    return { da: !!m, laeuft: m ? m.getAnimations().filter(a => a.playState === 'running').length : 0 };
  });
  p('Weggewischt geht es mit einer Bewegung (gleich danach noch da, und es läuft etwas)', imAbgang.da && imAbgang.laeuft >= 1, JSON.stringify(imAbgang));
  await s.waitForTimeout(700);
  gleich('… und ist danach restlos weg — Blatt UND Grund (keine unsichtbare Wand)', await offen(), { menu: false, grund: false });

  /* Tipp auf den Grund: ebenfalls mit Abgang. */
  await auf(); await s.waitForTimeout(1000);
  await s.evaluate(() => (document.querySelector('.menu-grund') as HTMLElement).click());
  await s.waitForTimeout(30);
  const grundTipp = await s.evaluate(() => {
    const m = document.querySelector<HTMLElement>('.menu');
    return { da: !!m, laeuft: m ? m.getAnimations().filter(a => a.playState === 'running').length : 0 };
  });
  p('Ein Tipp auf den Grund schliesst mit Abgang', grundTipp.da && grundTipp.laeuft >= 1, JSON.stringify(grundTipp));
  await s.waitForTimeout(700);
  gleich('… und danach ist alles weg', await offen(), { menu: false, grund: false });

  /* Der Vertrag bleibt: Escape und die Wahl eines Eintrags schliessen SOFORT. */
  await auf(); await s.waitForTimeout(400);
  const esc = await s.evaluate(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return { menu: !!document.querySelector('.menu'), grund: !!document.querySelector('.menu-grund') };
  });
  gleich('Escape schliesst sofort, wie E302 es verlangt', esc, { menu: false, grund: false });
  await auf(); await s.waitForTimeout(400);
  /* „Sofort" heisst: im selben Takt, vor dem nächsten Bild. Den Grund nimmt
     der Wächter (ein MutationObserver) mit — der meldet sich nach dem
     laufenden Skript, noch bevor gemalt wird. Darum wird nach EINER
     Mikroaufgabe gefragt, nicht nach einem Bild und nicht nach einer Zeit. */
  const wahl = await s.evaluate(async () => {
    const m = document.querySelector('.menu')!;
    m.addEventListener('click', () => m.remove(), { once: true });
    (m.querySelector('[data-a="b"]') as HTMLElement).click();
    await new Promise<void>(r => queueMicrotask(r));
    return { menu: !!document.querySelector('.menu'), grund: !!document.querySelector('.menu-grund') };
  });
  gleich('Die Wahl eines Eintrags schliesst sofort — Blatt und Grund, vor dem nächsten Bild', wahl, { menu: false, grund: false });

  /* Ruhig: ohne Bewegung. */
  await s.evaluate(() => Einstellungen.S('bewegung', 'ruhig'));
  await auf(); await s.waitForTimeout(100);
  const ruhig = await s.evaluate(() => {
    (document.querySelector('.menu-grund') as HTMLElement).click();
    return { menu: !!document.querySelector('.menu'), grund: !!document.querySelector('.menu-grund') };
  });
  gleich('Unter „Ruhige Darstellung" schliesst der Tipp auf den Grund sofort', ruhig, { menu: false, grund: false });
  await s.evaluate(() => Einstellungen.S('bewegung', 'normal'));
  await o.ctx.close();
}

/* ==========================================================================
 * §6 · Ein Ortswechsel, eine Ankunft
 * ======================================================================== */
console.log('\n§6 · Ein Ortswechsel, eine Ankunft: aus der richtigen Richtung, gleitend, allein');
{
  const o = await oeffne({ handy: true });
  const { s } = o;
  await s.evaluate(() => (document.getElementById('hl-dok') as HTMLElement).click());
  await s.waitForTimeout(900);
  const wechsel = (id: string) => s.evaluate((id: string) => new Promise<any>(fertig => {
    (document.getElementById(id) as HTMLElement).click();
    const bis = performance.now() + 260; const gesehen = new Set<string>(); let kurve = ''; const andere = new Set<string>();
    const schau = () => {
      const sc = document.getElementById('scroll')!;
      for (const a of sc.getAnimations({ subtree: true })) {
        if (a.playState !== 'running') continue;
        const z = (a.effect as KeyframeEffect | null)?.target as Element | null;
        const name = (a as any).animationName ?? '(waapi)';
        /* Eine CSS-Animation trägt ihre Kurve an den Schlüsselbildern, nicht
           an der Zeitangabe (die sagt dort immer `linear`). */
        if (z === sc && /^wisch-rein/.test(name)) { gesehen.add(name); kurve = String((a.effect as KeyframeEffect).getKeyframes()[0]?.easing ?? ''); }
        else if (/ansicht-herein|studio-arrive|\(waapi\)/.test(name)) andere.add(name + '@' + (z?.className || z?.tagName || ''));
      }
      if (performance.now() < bis) requestAnimationFrame(schau);
      else fertig({ gesehen: [...gesehen], kurve, andere: [...andere] });
    };
    requestAnimationFrame(schau);
  }), id);
  const nachRechts = await wechsel('hl-bespr');
  gleich('Unten „Termine" getippt (rechts von „Dokumente"): der Inhalt kommt von rechts', nachRechts.gesehen, ['wisch-rein-links']);
  p('… auf der sanften Feder (linear(), ohne Nachschwingen)', /^linear\(/.test(nachRechts.kurve) && !/\b1\.\d*[1-9]/.test(nachRechts.kurve), nachRechts.kurve.slice(0, 80));
  gleich('… und keine zweite Bewegung zugleich (kein Aufsteigen, keine Studio-Ankunft)', nachRechts.andere, []);
  await s.waitForTimeout(900);
  const nachLinks = await wechsel('hl-dok');
  gleich('Zurück zu „Dokumente": von links', nachLinks.gesehen, ['wisch-rein-rechts']);
  gleich('… wieder allein', nachLinks.andere, []);
  await s.waitForTimeout(900);
  const gleicherOrt = await wechsel('hl-dok');
  gleich('Derselbe Reiter noch einmal: keine Ankunft (nichts hat sich bewegt)', gleicherOrt.gesehen, []);

  /* Die Einstellungen am Telefon: Liste → Bereich schiebt, zurück ebenso. */
  await s.evaluate(() => Einstellungen.oeffne());
  await s.waitForTimeout(600);
  const push = await s.evaluate(() => new Promise<any>(fertig => {
    (document.querySelector('.einst-nav button[data-b="allgemein"]') as HTMLElement).click();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const inh = document.querySelector('.einst-inhalt')!;
      fertig(inh.getAnimations().map(a => (a as any).animationName ?? '(waapi)'));
    }));
  }));
  gleich('Einstellungen: ein Bereich schiebt sich von rechts herein', push, ['wisch-rein-links']);
  await s.waitForTimeout(900);
  const pop = await s.evaluate(() => new Promise<any>(fertig => {
    (document.querySelector('[data-a="liste"]') as HTMLElement).click();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const nav = document.querySelector('.einst-nav')!;
      fertig(nav.getAnimations().map(a => (a as any).animationName ?? '(waapi)'));
    }));
  }));
  gleich('… und „Zurück" bringt die Liste von links', pop, ['wisch-rein-rechts']);
  await o.ctx.close();
}

/* ==========================================================================
 * §7 · „Ruhige Darstellung" hält alles an
 * ======================================================================== */
console.log('\n§7 · „Ruhige Darstellung" hält alles an — ::after, JavaScript, Inseln');
{
  const o = await oeffne({ handy: true });
  const { s } = o;
  await s.evaluate(() => Einstellungen.S('bewegung', 'ruhig'));
  await s.waitForTimeout(200);
  const kopf = await s.evaluate(() => ({ ui: document.documentElement.getAttribute('data-ui-motion'),
                                         frage: typeof AppEinstellung?.wenigBewegung === 'function' ? AppEinstellung.wenigBewegung() : null }));
  gleich('Ruhig spiegelt sich für die Inseln: <html data-ui-motion="reduce">', kopf.ui, 'reduce');
  gleich('AppEinstellung.wenigBewegung() sagt ja', kopf.frage, true);
  const laeuft = async (was: string, tun: () => Promise<unknown>): Promise<string[]> => {
    await tun();
    await s.waitForTimeout(90);
    return s.evaluate(() => document.getAnimations()
      .filter(a => a.playState === 'running')
      .filter(a => { const d = Number(a.effect?.getTiming().duration ?? 0); return d > 20 || a.effect?.getTiming().iterations === Infinity; })
      .map(a => ((a as any).animationName ?? (a as any).transitionProperty ?? '(waapi)') + '@' +
        (((a.effect as KeyframeEffect | null)?.target as Element | null)?.id || ((a.effect as KeyframeEffect | null)?.target as Element | null)?.className || '?'))
    ).then(l => l.map(x => was + ': ' + String(x).slice(0, 80)));
  };
  const alles: string[] = [];
  alles.push(...await laeuft('Heute', () => s.evaluate(() => (document.getElementById('hl-start') as HTMLElement).click())));
  await s.waitForTimeout(600);
  alles.push(...await laeuft('Dokumente', () => s.evaluate(() => (document.getElementById('hl-dok') as HTMLElement).click())));
  await s.waitForTimeout(600);
  alles.push(...await laeuft('Termine', () => s.evaluate(() => (document.getElementById('hl-bespr') as HTMLElement).click())));
  await s.waitForTimeout(600);
  alles.push(...await laeuft('Menü', () => s.evaluate(() => UI.menu('<button>Eins</button><button>Zwei</button>', 10, 10, { titel: 'Probe' }))));
  await s.evaluate(() => document.querySelectorAll('.menu, .menu-grund').forEach(m => m.remove()));
  alles.push(...await laeuft('Dialog', () => s.evaluate(() => { void Dialog.frage('Wie soll es heissen?', 'Probe'); })));
  await s.evaluate(() => document.querySelectorAll('.overlay').forEach(m => m.remove()));
  alles.push(...await laeuft('Meldung', () => s.evaluate(() => UI.toast('Gespeichert'))));
  gleich('Nach Reiterwechseln, Menü, Dialog und Meldung läuft NICHTS (> 20 ms oder endlos)', alles, []);
  const nachher = await s.evaluate(() => {
    const t = document.createElement('div'); t.className = 'probe-nach'; document.body.append(t);
    const st = document.createElement('style');
    st.textContent = '.probe-nach::after{content:"";display:block;transition:opacity 400ms;animation:probe-dreh 2s infinite}@keyframes probe-dreh{to{opacity:.5}}';
    document.head.append(st);
    const w = getComputedStyle(t, '::after');
    const r = { uebergang: w.transitionDuration, animation: w.animationName };
    t.remove(); st.remove();
    return r;
  });
  p('Auch ::after steht still (die Sperre deckte bisher nur * und ::before)',
    nachher.animation === 'none' && /^0s$/.test(nachher.uebergang), JSON.stringify(nachher));
  await s.evaluate(() => Einstellungen.S('bewegung', 'normal'));
  gleich('Wieder normal: das Etikett geht', await s.evaluate(() => document.documentElement.getAttribute('data-ui-motion')), null);
  await o.ctx.close();
}

/* ==========================================================================
 * §8 · Nur transform und opacity
 * ======================================================================== */
console.log('\n§8 · Nur transform und opacity — kein `transition: all`, kein zweites Einsinken');
{
  const STIL = path.join(WURZEL, 'quell/schale/stil');
  const blaetter = fs.readdirSync(STIL).filter(f => f.endsWith('.css'));
  const alle: string[] = [];
  const aktivSkaliert: string[] = [];
  for (const f of blaetter) {
    const css = ohneKommentare(fs.readFileSync(path.join(STIL, f), 'utf8'));
    for (const m of css.matchAll(/transition\s*:\s*all\b/g)) alle.push(f + ':' + (css.slice(0, m.index).split('\n').length));
    for (const m of css.matchAll(/([^{}]*:active[^{}]*)\{([^{}]*)\}/g)) {
      const sel = (m[1] ?? '').trim().replace(/\s+/g, ' ');
      if (/(^|;|\s)transform\s*:\s*scale\(/.test(m[2] ?? '')) aktivSkaliert.push(f + ': ' + sel.slice(0, 90));
    }
  }
  gleich('Kein `transition: all` in quell/schale/stil (UI-Kit: „Avoid transition: all")', alle, []);
  /* DIE ERSETZTEN REGELN. Das Einsinken macht jetzt die Druckfeder
     (press.ts) auf der eigenen Eigenschaft `scale`. Eine alte
     `:active{transform:scale(…)}` daneben liesse den Knopf doppelt
     einsinken. Was hier noch steht, sind Redurs eigene Druckbilder aus
     motion.css (E528–E537) und Bilder INNERHALB eines Knopfes — press.ts
     lässt genau diese aus (OWN_PRESS); die Liste darf nur schrumpfen. */
  const ERLAUBT = [
    'motion.css: #ai .ai-leiste button:active',
    'motion.css: #ai #ai-senden:active',
    'motion.css: body button:active > [data-rmo~="toggle"].mschalter',
    'bausteine.css: .ru-staff:active .ru-staff-rahmen',
  ];
  gleich('Keine `:active{transform:scale(…)}` mehr ausser den benannten eigenen Druckbildern',
    aktivSkaliert.filter(a => !ERLAUBT.includes(a)), []);
  p('Kein Schalter-Verlauf dreht im Stilblatt endlos (einstellungen.css, E462 → E702)',
    !/ez-schalter-dreh[^;}]*infinite/.test(ohneKommentare(lies('quell/schale/stil/einstellungen.css'))));
  const pressTs = lies('src/schale/bedienung/press.ts');
  p('press.ts lässt die eigenen Druckbilder aus (OWN_PRESS nennt sie)',
    ['#ai .ai-leiste button', '#ai-senden', '.fbtns button.prim', '[data-rmo~="glass"]', '.rmo-transport button', '.ru-staff', '.bib-deckel', '.rmo-recent-card', '.ru-funkel']
      .every(s => pressTs.includes(s)));
  /* Gegenproben: ein eingeschmuggeltes `transition:all` und eine neue
     `:active`-Skalierung würden gefunden. */
  p('Gegenprobe: `transition: all` würde gefunden', /transition\s*:\s*all\b/.test('.x{transition: all .2s}'));
  const probe = '.neu:active{ transform:scale(.9) }';
  p('Gegenprobe: eine neue `:active`-Skalierung würde gefunden',
    [...probe.matchAll(/([^{}]*:active[^{}]*)\{([^{}]*)\}/g)].some(m => /(^|;|\s)transform\s*:\s*scale\(/.test(m[2] ?? '')));
}

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
await browser.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
