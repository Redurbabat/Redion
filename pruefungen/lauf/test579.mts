/* Suite 579 — Die React-Inseln im Browser: per Doppelklick, allein, offline (E699)
 * ============================================================================
 * `test578` liest die Dateien. Diese Suite öffnet die App und sieht nach, ob
 * die Grundlage aus E699 trägt — auf allen drei Wegen, auf denen Redion
 * startet (§6, §28, §29):
 *
 *   index.html per Doppelklick (file://)       §1–§8
 *   redion-einzeldatei.html allein im Ordner   §9
 *   über das Netz, dann ohne Netz (Dienst)     §10, §11
 *
 *   §1  Der Start holt kein React.
 *   §2  Im Leerlauf danach wird vorgewärmt — und dabei NICHTS eingehängt.
 *   §3  Die Probe-Insel: Redions Farben, Props hinein, Rückrufe hinaus.
 *   §4  Hell und dunkel folgen Redions Schalter.
 *   §5  Das Schema „Touch Kit" in „Aussehen" — und je Grundton gemerkt.
 *   §6  Ruhige Darstellung und „weniger Bewegung" beruhigen auch das Kit.
 *   §7  Aufräumen: die Schale entfernt ein Element, die Wurzel geht mit.
 *   §8  Eine Insel, die stolpert, bleibt nicht still (§7).
 *   §9  Die Einzeldatei allein: dieselben Bytes, kein Netz, kein React beim Start.
 *   §10 Offline über den Dienst-Arbeiter.
 *   §11 Scheitert das Laden einmal, geht es beim nächsten Mal — samt Blatt.
 *
 * Bei der Durchsicht von E699 dazugekommen: in §5 „Weiss auf Rot" in allen
 * zehn Schemata (das Rot des dunklen Kits ist für dunkle Schrift gemacht),
 * und §11 (ein gescheitertes Stilblatt blieb im Kopf und sperrte den
 * nächsten Versuch). Beide zuerst rot eingecheckt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Sie WAR es: rot eingecheckt (commit „test579 (rot)"), bevor es Lader,
 * Bündel und Schema gab. Dazu drei Gegenproben im Lauf: eine Farbe, die das
 * Kit ohne Brücke hätte, eine Anfrage, die beim Start verboten wäre, und
 * ein Fehler, den die Grenze fangen muss.
 *
 * Eigener Port 9650 (test400 prüft, dass ihn niemand sonst hat).
 *
 *   node pruefungen/lauf/test579.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Browser, BrowserContext, Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any, Aussehen: any, Inseln: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9650;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/* ── Der Server für §10: gewöhnlich, ohne gzip, mit dem Dienst im Bereich ── */
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

/* ── Was beim LADEN da war, schreibt die Seite selbst auf ────────────────
   Ein Zuhörer, der VOR allen Skripten der Seite angemeldet wird, läuft beim
   `load` als erster. Von aussen gefragt käme die Antwort zu spät: der
   Leerlauf nach dem Laden kann schon begonnen haben. */
const BEIM_LADEN = `
  addEventListener('load', () => {
    window.__t579 = {
      react: typeof window.RedionReact,
      inseln: typeof window.RedionIslands,
      skripte: [...document.querySelectorAll('script[src]')].map(s => s.src)
        .filter(s => /fremd\\/react|islands\\//.test(s)).length,
      zeit: Date.now(),
      uiTheme: document.documentElement.getAttribute('data-ui-theme')
    };
  });`;

const fehlerVon = (seite: Page): string[] => {
  const f: string[] = [];
  seite.on('pageerror', e => f.push(e.message.slice(0, 200)));
  return f;
};

const bereitMachen = async (seite: Page): Promise<void> => {
  await seite.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined" && ' +
    '(document.getElementById("tree")?.children.length || 0) > 0', null, { timeout: 30000 });
  await seite.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,#rg-willkommen,#rg-einladung,.produkt-onboarding-lage')
      .forEach(e => e.remove());
  });
};

/** Eine Farbe so, wie der Browser sie für `var(--name)` ausrechnet. */
const farbe = (seite: Page, marke: string): Promise<string> => seite.evaluate((m: string) => {
  const d = document.createElement('div');
  d.style.color = 'var(' + m + ')';
  document.body.appendChild(d);
  const c = getComputedStyle(d).color;
  d.remove();
  return c;
}, marke);

type Probe = { knopf: { bg: string; fg: string; hoehe: number; schrift: string; name: string } | null;
               schalter: { an: boolean; bahn: string; name: string } | null;
               wurzeln: number; html: string | null; rootSchema: string; htmlSchema: string };
const probeLesen = (seite: Page, id: string): Promise<Probe> => seite.evaluate((hostId: string) => {
  const host = document.getElementById(hostId);
  const knopf = host?.querySelector<HTMLElement>('.ui-touch-button') ?? null;
  const input = host?.querySelector<HTMLInputElement>('input[role="switch"]') ?? null;
  const bahn = host?.querySelector<HTMLElement>('.ui-touch-toggle-track') ?? null;
  const root = host?.querySelector<HTMLElement>('.ui-touch-root') ?? null;
  return {
    knopf: knopf ? { bg: getComputedStyle(knopf).backgroundColor, fg: getComputedStyle(knopf).color,
                     hoehe: knopf.getBoundingClientRect().height, schrift: getComputedStyle(knopf).fontFamily,
                     name: (knopf.textContent || '').trim() } : null,
    schalter: input && bahn ? { an: input.checked, bahn: getComputedStyle(bahn).backgroundColor,
                                name: (input.closest('label')?.textContent || '').trim() } : null,
    wurzeln: host?.querySelectorAll('.ui-touch-root').length ?? -1,
    html: document.documentElement.getAttribute('data-ui-theme'),
    rootSchema: root ? getComputedStyle(root).colorScheme : '(keine Wurzel)',
    htmlSchema: getComputedStyle(document.documentElement).colorScheme
  };
}, id);

/** Eine Probe-Insel an ein neues Element hängen; Rückrufe zählen in window.__probe. */
const probeHaengen = (seite: Page, id: string, extra: Record<string, unknown> = {}): Promise<string | null> =>
  seite.evaluate(async ({ hostId, mehr }: { hostId: string; mehr: Record<string, unknown> }) => {
    try {
      const api = await Inseln.bereit();
      const host = document.createElement('div');
      host.id = hostId;
      host.style.padding = '16px';
      document.body.appendChild(host);
      (window as any).__probe = { druck: 0, schalter: [] as boolean[] };
      const w = (window as any).__probe;
      api.mount(host, 'probe', { label: 'Speichern', toggleLabel: 'Automatisch sichern', checked: false,
        onPress: () => { w.druck++; }, onToggle: (an: boolean) => { w.schalter.push(an); }, ...mehr });
      await new Promise(f => setTimeout(f, 250));
      return null;
    } catch (e) { return String(e instanceof Error ? e.message : e); }
  }, { hostId: id, mehr: extra });

const browser: Browser = await chromium.launch();
const alleFehler: string[] = [];

/* ==========================================================================
 * §1 · Der Start holt kein React — index.html per Doppelklick
 * ======================================================================== */
console.log('\n§1 · Der Start holt kein React (index.html über file://)');

const k1: BrowserContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await k1.addInitScript(BEIM_LADEN);
const s1 = await k1.newPage();
const f1 = fehlerVon(s1);
/* WAS GEHOLT WURDE, VON AUSSEN MITGESCHRIEBEN. Die Zeitmessung des Browsers
   (`performance.getEntriesByType('resource')`) führt unter file:// KEINEN
   Eintrag — der erste Entwurf dieser Suite mass damit und war blind; die
   Gegenprobe unten hat es gezeigt. Jetzt: jede Anfrage mit Uhrzeit, und die
   Seite schreibt die Uhrzeit ihres `load` dazu. */
const geholt1: Array<{ url: string; t: number }> = [];
s1.on('request', r => geholt1.push({ url: r.url(), t: Date.now() }));
await s1.goto(pathToFileURL(path.join(WURZEL, 'index.html')).href, { waitUntil: 'load' });
await bereitMachen(s1);
const beimLaden = await s1.evaluate(() => (window as any).__t579);
p('Die Seite hat beim Laden mitgeschrieben', !!beimLaden, JSON.stringify(beimLaden));
gleich('Beim Laden: kein React, keine Inseln', [beimLaden?.react, beimLaden?.inseln], ['undefined', 'undefined']);
const vorLaden = geholt1.filter(g => g.t <= Number(beimLaden?.zeit ?? 0));
gleich('… kein Skript dafür eingehängt, keine Datei dafür geholt',
  [beimLaden?.skripte, vorLaden.filter(g => /fremd\/react|islands\//.test(g.url)).map(g => g.url)], [0, []]);
gleich('… und kein data-ui-theme am Wurzelelement', beimLaden?.uiTheme, null);
/* Über `window` gefragt, nicht über den nackten Namen: fehlt der Lader,
   wäre `typeof Inseln?.bereit` ein ReferenceError statt eines roten Punkts. */
const laderDa = await s1.evaluate(() => typeof (window as any).Inseln?.bereit === 'function');
p('Der Lader ist da (`Inseln.bereit`)', laderDa);
/* Gegenprobe: die Messung sieht eine geholte Datei, wenn es eine gibt. */
p('Gegenprobe: die Messung sieht, was beim Start geholt wurde (quell/start.js)',
  vorLaden.some(g => /quell\/start\.js$/.test(g.url)), `${vorLaden.length} Anfragen vor dem Laden`);
if (!laderDa) {
  /* Ohne Lader hinge jeder weitere Schritt an einem ReferenceError. Die
     Suite soll rot SAGEN, nicht abstürzen. */
  console.log('\n  Ohne Lader können §2–§10 nicht laufen — Abbruch nach §1.');
  await browser.close();
  server.close();
  console.log(`\n${ok} bestanden, ${weg} durchgefallen (Abbruch nach §1)`);
  process.exit(1);
}

/* ==========================================================================
 * §2 · Vorwärmen im Leerlauf — ohne etwas einzuhängen
 * ======================================================================== */
console.log('\n§2 · Im Leerlauf nach dem Laden vorgewärmt — und nichts eingehängt');

let vorgewaermt = true;
try { await s1.waitForFunction('typeof window.RedionIslands !== "undefined"', null, { timeout: 8000 }); }
catch { vorgewaermt = false; }
p('Von der Platte (file://) wird im Leerlauf vorgewärmt', vorgewaermt);
const nachWaermen = await s1.evaluate(() => ({
  react: typeof (window as any).RedionReact,
  wurzeln: document.querySelectorAll('.ui-touch-root').length,
  inseln: document.querySelectorAll('[data-insel]').length,
  uiTheme: document.documentElement.getAttribute('data-ui-theme'),
  stil: document.querySelectorAll('[data-insel-datei="stil"]').length
}));
gleich('Vorwärmen hängt NICHTS ein: keine Wurzel, keine Insel, kein data-ui-theme',
  [nachWaermen.wurzeln, nachWaermen.inseln, nachWaermen.uiTheme], [0, 0, null]);
gleich('… React ist ausgewertet, das Stilblatt einmal da', [nachWaermen.react, nachWaermen.stil], ['object', 1]);

/* ==========================================================================
 * §3 · Die Probe-Insel: Redions Farben, Props hinein, Rückrufe hinaus
 * ======================================================================== */
console.log('\n§3 · Die Probe-Insel trägt Redions Farben und hält den Vertrag');

await s1.evaluate(() => Aussehen.setzen({ schema: 'standard', akzent: '' }));
const fehlerHaengen = await probeHaengen(s1, 't579-a');
p('Die Probe hängt ohne Fehler', fehlerHaengen === null, String(fehlerHaengen));
let pr = await probeLesen(s1, 't579-a');
const akzentDunkel = await farbe(s1, '--accent');
gleich('Der Knopf trägt Redions Akzent (dunkel)', pr.knopf?.bg, akzentDunkel);
gleich('… und Redions Schrift auf dem Akzent', pr.knopf?.fg, await farbe(s1, '--auf-accent'));
p('Gegenprobe: ohne Brücke wäre es der Akzent des Kits, nicht Redions',
  akzentDunkel !== 'rgb(163, 157, 255)' && akzentDunkel !== 'rgb(83, 69, 224)', akzentDunkel);
p('Der Knopf ist mindestens 44 px hoch (§37)', (pr.knopf?.hoehe ?? 0) >= 44, String(pr.knopf?.hoehe));
const redionSchrift = await s1.evaluate(() => {
  const d = document.createElement('div'); d.style.fontFamily = 'var(--font)';
  document.body.appendChild(d); const f = getComputedStyle(d).fontFamily; d.remove(); return f;
});
gleich('… in Redions Schrift (--font)', pr.knopf?.schrift, redionSchrift);
gleich('Knopf und Schalter haben ihre Namen (§38)', [pr.knopf?.name, pr.schalter?.name],
  ['Speichern', 'Automatisch sichern']);
gleich('Eine Wurzel, und das Wurzelelement bekommt data-ui-theme="dark"', [pr.wurzeln, pr.html], [1, 'dark']);
gleich('color-scheme: an der Insel dunkel, am Wurzelelement unverändert', [pr.rootSchema, pr.htmlSchema], ['dark', 'normal']);

/* Props hinein, Rückrufe hinaus. */
await s1.click('#t579-a .ui-touch-toggle');
await s1.waitForTimeout(150);
const nachTipp = await s1.evaluate(() => ({ w: (window as any).__probe.schalter.slice(),
  an: (document.querySelector('#t579-a input[role="switch"]') as HTMLInputElement).checked }));
gleich('Ein Tipp auf den Schalter ruft onToggle(true) …', nachTipp.w, [true]);
gleich('… und er springt NICHT von selbst um — Redion entscheidet', nachTipp.an, false);
await s1.evaluate(() => {
  const w = (window as any).__probe;
  (window as any).RedionIslands.update(document.getElementById('t579-a'), {
    label: 'Speichern', toggleLabel: 'Automatisch sichern', checked: true,
    onPress: () => { w.druck++; }, onToggle: (an: boolean) => { w.schalter.push(an); } });
});
/* Den Zeiger WEG vom Schalter: sonst misst die Zeile unten die Farbe beim
   Überfahren (das Kit mischt dann Schrift hinein) — beim ersten Lauf war
   genau das rot. */
await s1.mouse.move(2, 2);
await s1.waitForTimeout(700);
pr = await probeLesen(s1, 't579-a');
gleich('Nach update({ checked: true }) steht er an', pr.schalter?.an, true);
gleich('… in Redions Erfolgsfarbe', pr.schalter?.bahn, await farbe(s1, '--erfolg'));
await s1.click('#t579-a .ui-touch-button');
gleich('Ein Tipp auf den Knopf ruft onPress', await s1.evaluate(() => (window as any).__probe.druck), 1);
await s1.evaluate(() => (window as any).RedionIslands.mount(document.getElementById('t579-a'), 'probe', { label: 'Noch einmal' }));
await s1.waitForTimeout(150);
pr = await probeLesen(s1, 't579-a');
gleich('mount zweimal: dieselbe Wurzel, neue Props', [pr.wurzeln, pr.knopf?.name], [1, 'Noch einmal']);
const unbekannt = await s1.evaluate(() => {
  try { (window as any).RedionIslands.mount(document.body, 'gibt-es-nicht', {}); return 'kein Fehler'; }
  catch (e) { return String(e instanceof Error ? e.message : e); }
});
p('Eine unbekannte Insel ist ein lauter Fehler, kein stiller', /unbekannte Insel/.test(unbekannt), unbekannt);

/* ==========================================================================
 * §4 · Hell und dunkel folgen Redions Schalter
 * ======================================================================== */
console.log('\n§4 · Hell und dunkel folgen Redion');

await s1.evaluate(() => Aussehen.setzen({ schema: 'hell', akzent: '' }));
await s1.waitForTimeout(200);
pr = await probeLesen(s1, 't579-a');
const akzentHell = await farbe(s1, '--accent');
gleich('Schema „Hell": data-ui-theme folgt', pr.html, 'light');
gleich('… die Insel ist hell (color-scheme)', pr.rootSchema, 'light');
gleich('… und der Knopf trägt den hellen Akzent', pr.knopf?.bg, akzentHell);
p('… der wirklich ein anderer ist als der dunkle', akzentHell !== akzentDunkel, akzentHell + ' / ' + akzentDunkel);
await s1.evaluate(() => Aussehen.setzen({ schema: 'wald', akzent: '' }));
await s1.waitForTimeout(200);
pr = await probeLesen(s1, 't579-a');
gleich('Ein anderes Schema („Wald") erreicht die Insel ohne eine Zeile Inselcode',
  [pr.html, pr.knopf?.bg], ['dark', await farbe(s1, '--accent')]);

/* ==========================================================================
 * §5 · Das Schema „Touch Kit" in „Aussehen"
 * ======================================================================== */
console.log('\n§5 · Das Schema „Touch Kit" — hell und dunkel, je Grundton gemerkt');

/* WEISS AUF ROT (Durchsicht von E699). Redion malt an mehreren Stellen
   WEISS auf `--gefahr`: die Zahl an der Glocke (`.glocke-zahl`), der
   Gefahrknopf unter dem Zeiger (`.rb.gefahr:hover`), die Marke am
   Buchdeckel. Das Rot des Kits im Dunkeln ist ein helles Rosa (#ff7088),
   gedacht für DUNKLE Schrift darauf — Weiss hätte dort 2,65 : 1. Kein Schema
   darf das schlechter machen als Redions eigenes Dunkel („Standard",
   3,76 : 1). Gemessen an einem echten Element mit Redions Stil, nicht an der
   Marke. */
const weissAufRot = await s1.evaluate(() => {
  const hell = (c: string): number => {
    const [r, g, b] = (c.match(/\d+(\.\d+)?/g) ?? []).map(Number).map(v => {
      const x = (v ?? 0) / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
  };
  const kontrast = (a: string, b: string): number => {
    const x = hell(a), y = hell(b);
    return Math.round((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) * 100) / 100;
  };
  const vorher = Aussehen.einstellung().schema;
  const aus: Record<string, number> = {};
  for (const sch of Aussehen.SCHEMATA as Array<{ id: string }>) {
    Aussehen.setzen({ schema: sch.id, akzent: '' });
    const z = document.createElement('i');
    z.className = 'glocke-zahl';
    z.textContent = '3';
    document.body.appendChild(z);
    const cs = getComputedStyle(z);
    aus[sch.id] = kontrast(cs.color, cs.backgroundColor);
    z.remove();
  }
  Aussehen.setzen({ schema: vorher, akzent: '' });
  return aus;
});
const rotBoden = weissAufRot['standard'] ?? 0;
const rotSchlechter = Object.entries(weissAufRot).filter(([, k]) => k < rotBoden).map(([s, k]) => s + ' ' + k);
p('Kein Schema macht Weiss auf Rot schlechter als Redions eigenes Dunkel (Glocke, Gefahrknopf)',
  rotBoden >= 3.5 && Object.keys(weissAufRot).length === 10 && rotSchlechter.length === 0,
  `Standard ${rotBoden} : 1; darunter: ${rotSchlechter.join(', ') || '—'}`);

await s1.evaluate(() => Aussehen.setzen({ schema: 'touchkit-dunkel', akzent: '' }));
await s1.waitForTimeout(200);
pr = await probeLesen(s1, 't579-a');
gleich('„Touch Kit dunkel": dunkler Grund, schwarze Fläche wie im Kit',
  [await s1.evaluate(() => document.documentElement.dataset['theme']), await farbe(s1, '--bg')],
  ['dark', 'rgb(0, 0, 0)']);
gleich('… der Knopf im Violett des Kits, mit dunkler Schrift darauf', [pr.knopf?.bg, pr.knopf?.fg],
  ['rgb(163, 157, 255)', 'rgb(11, 10, 26)']);
await s1.evaluate(() => Aussehen.setzen({ schema: 'touchkit-hell', akzent: '' }));
await s1.waitForTimeout(200);
pr = await probeLesen(s1, 't579-a');
gleich('„Touch Kit hell": heller Grund, das Grau des Kits', [pr.html, await farbe(s1, '--bg')],
  ['light', 'rgb(243, 242, 248)']);
gleich('… der Knopf im Violett des Kits, weiss beschriftet', [pr.knopf?.bg, pr.knopf?.fg],
  ['rgb(83, 69, 224)', 'rgb(255, 255, 255)']);

/* Die Karten im Dialog — und die Staffelei merkt sich je Grundton, was dort
   zuletzt galt, genau wie bei den anderen acht. */
await s1.evaluate(() => { Store.setMeta('studio:schema-dark', 'standard'); Aussehen.dialog(); });
await s1.waitForTimeout(500);
const karten = await s1.evaluate(() => [...document.querySelectorAll('.au-karte .au-name')].map(e => e.textContent));
gleich('Der Dialog zeigt zehn Karten, die zwei neuen zuletzt', karten.slice(-2), ['Touch Kit hell', 'Touch Kit dunkel']);
gleich('… zehn insgesamt', karten.length, 10);
p('Die gewählte Karte ist „Touch Kit hell"',
  await s1.evaluate(() => document.querySelector('.au-karte.an .au-name')?.textContent === 'Touch Kit hell'));
const staffelei = async (): Promise<string> => {
  await s1.evaluate(() => document.querySelector<HTMLElement>('#au-staffelei button, #au-staffelei [role="switch"]')?.click());
  await s1.waitForTimeout(400);
  return s1.evaluate(() => Aussehen.einstellung().schema);
};
gleich('Staffelei nach dunkel: der gemerkte dunkle Grundton (Standard)', await staffelei(), 'standard');
await s1.evaluate(() => document.querySelector<HTMLElement>('.au-karte[data-s="touchkit-dunkel"]')?.click());
await s1.waitForTimeout(300);
gleich('„Touch Kit dunkel" gewählt', await s1.evaluate(() => Aussehen.einstellung().schema), 'touchkit-dunkel');
gleich('Staffelei nach hell: zurück zu „Touch Kit hell" — gemerkt je Grundton', await staffelei(), 'touchkit-hell');
gleich('Staffelei nach dunkel: „Touch Kit dunkel"', await staffelei(), 'touchkit-dunkel');
await s1.evaluate(() => { document.querySelectorAll('.overlay').forEach(o => o.remove()); Aussehen.setzen({ schema: 'standard', akzent: '' }); });

/* ==========================================================================
 * §6 · Ruhig heisst ruhig — auch im Kit
 * ======================================================================== */
console.log('\n§6 · Ruhige Darstellung und „weniger Bewegung"');

const bewegung = (seite: Page, id: string) => seite.evaluate((hostId: string) => {
  const k = document.querySelector<HTMLElement>('#' + hostId + ' .ui-touch-button')!;
  const n = document.querySelector<HTMLElement>('#' + hostId + ' .ui-touch-toggle-knob')!;
  const c = getComputedStyle(k), d = getComputedStyle(n);
  return { knopf: c.transitionProperty + ' ' + c.transitionDuration,
           knauf: d.transitionProperty + ' ' + d.transitionDuration, knaufSichtbar: d.visibility };
}, id);
const vorher = await bewegung(s1, 't579-a');
p('Ohne Einstellung federt der Knopf (die Feder des Kits, E699)', /transform/.test(vorher.knopf), vorher.knopf);
await s1.evaluate(() => { document.body.dataset['bewegung'] = 'ruhig'; });
const ruhig = await bewegung(s1, 't579-a');
gleich('body[data-bewegung="ruhig"]: Knopf und Knauf ohne Übergang', [ruhig.knopf, ruhig.knauf],
  ['none 0s', 'none 0s']);
await s1.evaluate(() => { document.body.dataset['bewegung'] = 'normal'; });

const k6 = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const s6 = await k6.newPage();
const f6 = fehlerVon(s6);
await s6.goto(pathToFileURL(path.join(WURZEL, 'index.html')).href);
await bereitMachen(s6);
await probeHaengen(s6, 't579-r');
const reduziert = await bewegung(s6, 't579-r');
p('„Weniger Bewegung" im System: der Knopf federt nicht mehr (kein transform im Übergang)',
  !/transform/.test(reduziert.knopf), reduziert.knopf);
gleich('… und der Knauf wandert nicht, er blendet (das Kit tauscht ihn aus)', reduziert.knaufSichtbar, 'hidden');
alleFehler.push(...f6);
await k6.close();

/* ==========================================================================
 * §7 · Aufräumen
 * ======================================================================== */
console.log('\n§7 · Die Schale entfernt ein Element — die Wurzel geht mit');

await s1.evaluate(() => { document.getElementById('t579-a')?.remove(); });
await s1.waitForTimeout(150);
const nachEntfernen = await s1.evaluate(() => ({
  html: document.documentElement.getAttribute('data-ui-theme'),
  update: (() => { const h = document.createElement('div');
    try { (window as any).RedionIslands.update(h, {}); return 'kein Fehler'; }
    catch (e) { return String(e instanceof Error ? e.message : e); } })()
}));
gleich('Letzte Insel weg (von aussen entfernt): kein data-ui-theme mehr', nachEntfernen.html, null);
p('update ohne Insel ist ein Fehler, keine Stille', /keine Insel/.test(nachEntfernen.update), nachEntfernen.update);
await probeHaengen(s1, 't579-b');
const aufgeraeumt = await s1.evaluate(() => {
  const h = document.getElementById('t579-b')!;
  const vor = { kinder: h.childElementCount, attr: h.getAttribute('data-insel') };
  (window as any).RedionIslands.unmount(h);
  (window as any).RedionIslands.unmount(h);   /* zweimal ist einmal */
  return { vor, nach: { kinder: h.childElementCount, attr: h.getAttribute('data-insel'),
                        html: document.documentElement.getAttribute('data-ui-theme') } };
});
gleich('Vor unmount: ein Kind, data-insel="probe"', aufgeraeumt.vor, { kinder: 1, attr: 'probe' });
gleich('Nach unmount (zweimal): leer, ohne Attribut, ohne data-ui-theme', aufgeraeumt.nach,
  { kinder: 0, attr: null, html: null });

/* ==========================================================================
 * §8 · Eine Insel, die stolpert, bleibt nicht still
 * ======================================================================== */
console.log('\n§8 · Die Fehlergrenze fängt, zeigt und meldet');

const vorFehler = f1.length;
await probeHaengen(s1, 't579-f', { throwOnRender: true });
await s1.waitForTimeout(300);
const grenze = await s1.evaluate(() => ({
  satz: document.querySelector('#t579-f [data-insel-fehler][role="alert"]')?.textContent ?? null,
  liste: (Store.getMeta('fehlerliste', []) || []).slice(0, 3).map((f: { text: string; wo: string }) => f.wo + ': ' + f.text),
  melder: (window as any).Reporter.all('fehler').slice(-3).map((e: { wo: string; text: string }) => e.wo + ': ' + e.text)
}));
p('An der Stelle der Insel steht ein Satz (role="alert")', /liess sich nicht zeichnen/.test(String(grenze.satz)), String(grenze.satz));
/* DER ERSTE ENTWURF MELDETE ÜBER `reportError` — und in der Fehlerliste
   stand „Script error.": unter file:// ist jede Datei ihr eigener Ursprung,
   und der Browser schwärzt die Meldung für `window.onerror`. Seitdem geht
   der Fehler als Ereignis an den Lader und von dort an `Reporter`. */
p('… und der Fehler steht in Redions Fehlerliste (Erste Hilfe), MIT seinem Text',
  grenze.liste.some((t: string) => /Insel „probe": Probe-Insel: absichtlicher Fehler/.test(t)), JSON.stringify(grenze.liste));
p('… über Redions Melder (`Reporter.error`)',
  grenze.melder.some((t: string) => /^Insel probe: .*absichtlicher Fehler/.test(t)), JSON.stringify(grenze.melder));
gleich('… und nicht als unbehandelter Fehler — er ist ja behandelt', f1.slice(vorFehler), []);
await probeHaengen(s1, 't579-g');
p('Die App läuft weiter: eine zweite Insel hängt danach sauber',
  (await probeLesen(s1, 't579-g')).knopf?.name === 'Speichern');
alleFehler.push(...f1);
await k1.close();

/* ==========================================================================
 * §9 · Die Einzeldatei, allein im Ordner
 * ======================================================================== */
console.log('\n§9 · redion-einzeldatei.html allein: kein React beim Start, kein Netz');

const ALLEIN = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-t579-'));
fs.copyFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), path.join(ALLEIN, 'redion-einzeldatei.html'));
const k9 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await k9.addInitScript(BEIM_LADEN);
const s9 = await k9.newPage();
const f9 = fehlerVon(s9);
const geholt9: string[] = [];
s9.on('request', r => geholt9.push(r.url()));
await s9.goto(pathToFileURL(path.join(ALLEIN, 'redion-einzeldatei.html')).href, { waitUntil: 'load' });
await bereitMachen(s9);
const b9 = await s9.evaluate(() => (window as any).__t579);
gleich('Beim Laden: kein React, keine Inseln', [b9?.react, b9?.inseln], ['undefined', 'undefined']);
gleich('Die drei Behälter stehen da, als text/plain',
  await s9.evaluate(() => ['inseln-react', 'inseln-js', 'inseln-stil']
    .map(id => document.getElementById(id)?.getAttribute('type'))), ['text/plain', 'text/plain', 'text/plain']);
const f9Haengen = await probeHaengen(s9, 't579-e');
p('Inseln.bereit() und die Probe gehen auch hier', f9Haengen === null, String(f9Haengen));
const pr9 = await probeLesen(s9, 't579-e');
gleich('… mit Redions Akzent', pr9.knopf?.bg, await farbe(s9, '--accent'));
/* DAS BLATT DER INSELN WIRKT AUCH HIER — ALS ANGENOMMENES (E714, Durchsicht).
   Seit E714 hängt `Inseln.bereit()` in der Einzeldatei kein Blob-`<link>`
   mehr ein (test492: dort steht keines), sondern reiht die Bytes aus
   `inseln-stil` in `document.adoptedStyleSheets` ein. Der Akzent oben zeigt
   die Brücke; dass das Blatt selbst wirkt, zeigt die Grösse — ohne Blatt
   ist der Knopf 24 statt 44 px (§11). Und ein zweites `bereit()` reiht das
   Blatt kein zweites Mal ein. */
p('… MIT ihrem Blatt: der Knopf ist mindestens 44 px hoch', (pr9.knopf?.hoehe ?? 0) >= 44,
  String(pr9.knopf?.hoehe));
const blatt9 = await s9.evaluate(async () => {
  await Inseln.bereit();
  return {
    angenommen: document.adoptedStyleSheets
      .filter(s => [...s.cssRules].some(r => r.cssText.includes('ui-touch-root'))).length,
    links: document.querySelectorAll('link[rel="stylesheet"]').length };
});
gleich('… als angenommenes Blatt, genau eines, auch nach einem zweiten bereit() — kein <link>',
  blatt9, { angenommen: 1, links: 0 });
gleich('Kein einziger Zugriff auf eine Datei daneben (nur die Seite selbst und Blob-Adressen)',
  geholt9.filter(u => !u.startsWith('blob:') && !u.startsWith('data:') && !/redion-einzeldatei\.html$/.test(u))
    .map(u => u.split('/').slice(-3).join('/')), []);
alleFehler.push(...f9);
await k9.close();
fs.rmSync(ALLEIN, { recursive: true, force: true });

/* ==========================================================================
 * §10 · Offline über den Dienst-Arbeiter
 * ======================================================================== */
console.log('\n§10 · Über das Netz, dann ohne: der GRUNDSTOCK trägt die Inseln');

const k10 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await k10.addInitScript(BEIM_LADEN);
const s10 = await k10.newPage();
const f10 = fehlerVon(s10);
const geholt10: string[] = [];
s10.on('request', r => geholt10.push(r.url()));
await s10.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await bereitMachen(s10);
await s10.waitForTimeout(4000);
gleich('Erster Besuch über das Netz: die Seite holt kein React — auch nicht im Leerlauf',
  geholt10.filter(u => /fremd\/react|islands\//.test(u)).map(u => u.split('/').pop()), []);
const dienst = await s10.evaluate(async () => {
  const reg = await Promise.race([navigator.serviceWorker.ready, new Promise(f => setTimeout(() => f(null), 8000))]);
  return !!reg;
});
p('Der Dienst-Arbeiter ist angemeldet', dienst);
await s10.reload({ waitUntil: 'load' });
await bereitMachen(s10);
p('Beim zweiten Besuch steuert er die Seite', await s10.evaluate(() => !!navigator.serviceWorker.controller));
let warm10 = true;
try { await s10.waitForFunction('typeof window.RedionIslands !== "undefined"', null, { timeout: 8000 }); }
catch { warm10 = false; }
p('… und JETZT wird vorgewärmt — die Bytes kommen aus seinem Speicher', warm10);
await k10.setOffline(true);
await s10.reload({ waitUntil: 'load' });
await bereitMachen(s10);
p('Ohne Netz startet die App', await s10.evaluate(() => typeof Store !== 'undefined'));
const f10Haengen = await probeHaengen(s10, 't579-o');
p('Ohne Netz: Inseln.bereit() und die Probe gehen', f10Haengen === null, String(f10Haengen));
gleich('… mit Redions Akzent', (await probeLesen(s10, 't579-o')).knopf?.bg, await farbe(s10, '--accent'));
await k10.setOffline(false);
alleFehler.push(...f10);
await k10.close();

/* ==========================================================================
 * §11 · Scheitert das Laden einmal, geht es beim nächsten Mal (Durchsicht)
 * --------------------------------------------------------------------------
 * `laden.ts` verspricht: „Ein gescheitertes Versprechen nicht für immer
 * behalten: beim nächsten Versuch soll es wieder gehen (Netz zurück, Datei
 * nachgelegt)." Für die Skripte hielt das. Für das STILBLATT nicht: das
 * gescheiterte `<link>` blieb im Kopf stehen, `stilblatt()` fand es beim
 * nächsten Versuch und meldete sofort „fertig" — die Insel hing dann OHNE
 * ihr Blatt: ein Knopf von 24 statt 44 px, durchsichtig. Gefunden bei der
 * Durchsicht von E699. Über das Netz, ohne Dienst (der hätte die Dateien im
 * Speicher), jede Anfrage einmal abgewiesen, dann wieder durchgelassen.
 * ======================================================================== */
console.log('\n§11 · Scheitert das Laden einmal, geht es beim nächsten Mal — auch das Stilblatt');

const k11 = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
const s11 = await k11.newPage();
const f11 = fehlerVon(s11);
const gesperrt = new Set<string>(['islands.css']);
await s11.route(/\/quell\/(islands\/islands\.css|fremd\/react\/react\.js)$/, r =>
  gesperrt.has(r.request().url().split('/').pop() ?? '') ? r.abort('internetdisconnected') : r.continue());
await s11.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
await bereitMachen(s11);
const versuch11 = (): Promise<string | null> => s11.evaluate(() => Inseln.bereit().then(
  () => null, (e: unknown) => String(e instanceof Error ? e.message : e)));
const reste11 = (): Promise<{ stil: number; skripte: number }> => s11.evaluate(() => ({
  stil: document.querySelectorAll('link[data-insel-datei]').length,
  skripte: document.querySelectorAll('script[data-insel-datei]').length }));
const erst11 = await versuch11();
p('Das Stilblatt fehlt: bereit() sagt es laut', /islands\.css/.test(String(erst11)), String(erst11));
gleich('… und lässt kein halbes Stilblatt im Kopf stehen', await reste11(), { stil: 0, skripte: 0 });
gesperrt.clear();
gesperrt.add('react.js');
const zweit11 = await versuch11();
p('React fehlt: bereit() sagt auch das', /react\.js/.test(String(zweit11)), String(zweit11));
gleich('… das Stilblatt steht jetzt, das gescheiterte Skript nicht', await reste11(), { stil: 1, skripte: 0 });
gesperrt.clear();
const f11Haengen = await probeHaengen(s11, 't579-w');
p('Beim dritten Versuch, mit Netz: Inseln.bereit() und die Probe gehen', f11Haengen === null, String(f11Haengen));
const pr11 = await probeLesen(s11, 't579-w');
p('… MIT ihrem Blatt: der Knopf ist mindestens 44 px hoch', (pr11.knopf?.hoehe ?? 0) >= 44,
  String(pr11.knopf?.hoehe));
gleich('… und trägt Redions Akzent', pr11.knopf?.bg, await farbe(s11, '--accent'));
gleich('… und im Kopf steht genau ein Stilblatt der Inseln', (await reste11()).stil, 1);
alleFehler.push(...f11);
await k11.close();

console.log('');
gleich('Keine unerwarteten Fehler auf den Seiten', alleFehler.slice(0, 5), []);

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
