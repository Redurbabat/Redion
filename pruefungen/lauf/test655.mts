/* Suite 655 — Das Dock ist EINE Kapsel, und das Zeichen steht ÜBER dem Wort (E813)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur am 24. November 2026: das untere Dock am
 * Telefon sei doppelt — „es soll wie das Original von iOS sein". Auf seinem
 * eigenen iPhone (Foto `bilder/redur-iphone-dock-18-13.png`) lagen die Zeichen
 * GROSS über den Wörtern: „Dok▢ente", „H▢te", „L▢rnen", „Te▢mine". Dazu
 * zwei Kanten und ein Strich über der Leiste.
 *
 *   §1 EINE KAPSEL. Unter der Leiste liegt genau EINE gemalte Fläche: kein
 *      sichtbares `::after` (der zweite Ring), höchstens EINE Innenlinie im
 *      `box-shadow` der Leiste. Die Linse existiert. Der Griffstrich
 *      `::before` bleibt — `test623` prüft ihn im Code (42 px); Redurs Wunsch
 *      gegen diesen Lauf ist in E813 als offener Punkt benannt.
 *   §2 ZEICHEN ÜBER WORT. Jeder der fünf Reiter: das Zeichen (SVG) liegt
 *      vollständig ÜBER dem Wort (`zeichen.bottom ≤ wort.top + 1`) und ist
 *      17–21 px gross — in Standard und Glass Wheel, hell und dunkel.
 *   §3 WEBKIT-ERSATZ. Redurs Safari zeigte das Zeichen über dem Wort. Hier
 *      wird das SVG so gestellt, als hätte es keine Grösse (`width:auto`
 *      mit `!important`); die Box des Zeichens muss trotzdem feste 24 px
 *      haben und über dem Wort enden. Gegen den Stand davor muss das ROT sein.
 *   §4 IN RUHE LESBAR. Der Name des aktiven Reiters hat ≥ 4,5 : 1 an den
 *      Bildpunkten, in beiden Schalen (wie test585 §2).
 *
 * ─── KANN DIESER LAUF ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja: §2 und §3 sind gegen den Stand vor E813 rot (das Zeichen ist dort so
 * hoch wie der SVG-Inhalt und überdeckt das Wort), §1 gegen die doppelte
 * Kante und den Griffstrich. Die Zahlen stehen in `messungen.md`.
 *
 *   node pruefungen/lauf/test655.mts
 * ==========================================================================*/
import { chromium, type Page } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
/* `listen(0)` statt einer festen Zahl (L205). */
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];

type Schale = 'standard' | 'glass';
const REITER = ['hl-dok', 'hl-start', 'hl-lernen', 'hl-bespr', 'hl-mehr'];

/* Telefon wie das iPhone 13: 390 × 844, Berührung, Retina. */
const aufmachen = async (schale: Schale, dunkel: boolean) => {
  const kontext = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    hasTouch: true, isMobile: true, colorScheme: dunkel ? 'dark' : 'light'
  });
  const pc = await kontext.newPage();
  pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 150)));
  await pc.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pc.waitForFunction('typeof App !== "undefined" && typeof Store !== "undefined" && !!document.querySelector("#page")');
  await pc.waitForTimeout(1600);
  await pc.evaluate(`(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu,[role=dialog]').forEach(e => e.remove());
    App.theme(${dunkel ? "'dark'" : "'light'"});
  })()`);
  if (schale === 'glass') {
    const gesetzt = await pc.evaluate(`typeof GlassWheel !== 'undefined' && GlassWheel.setMode('glass-wheel') === true`);
    if (!gesetzt) fehler.push('GlassWheel.setMode(glass-wheel) ging nicht');
    await pc.waitForTimeout(500);
  }
  await pc.evaluate(`document.getElementById('hl-dok')?.click()`);
  await pc.waitForTimeout(900);
  return { pc, zu: () => kontext.close() };
};

const stilVon = (pc: Page, sel: string, pseudo = '') => pc.evaluate(`(() => {
  const e = document.querySelector(${JSON.stringify(sel)});
  if (!e) return null;
  const s = getComputedStyle(e, ${JSON.stringify(pseudo)});
  return { content: s.content, bg: s.backgroundColor, bgImg: s.backgroundImage,
           opacity: s.opacity, shadow: s.boxShadow, border: s.borderTopWidth };
})()`) as Promise<{ content: string; bg: string; bgImg: string; opacity: string; shadow: string; border: string } | null>;

/* Ein Pseudo-Element malt etwas, wenn es Inhalt hat, eine Fläche oder einen
   Rand mit Farbe — und nicht unsichtbar ist. */
const malt = (s: { content: string; bg: string; bgImg: string; opacity: string; border: string } | null) => {
  if (!s) return false;
  if (s.content === 'none' || s.content === 'normal') return false;
  if (parseFloat(s.opacity) <= 0) return false;
  const flaeche = s.bgImg !== 'none' || (s.bg !== 'rgba(0, 0, 0, 0)' && s.bg !== 'transparent');
  return flaeche || parseFloat(s.border) > 0;
};

const innenlinien = (shadow: string) => (shadow.match(/inset/g) ?? []).length;

const kontrastDesAktivenWorts = async (pc: Page) => {
  const k = await pc.evaluate(`(() => {
    const b = document.querySelector('#handy-oben > button[aria-selected="true"] b');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  })()`) as { x: number; y: number; w: number; h: number } | null;
  if (!k || k.w < 4 || k.h < 4) return null;
  const bild = await pc.screenshot({ clip: { x: k.x, y: k.y, width: k.w, height: k.h } });
  return pc.evaluate(`(async () => {
    const img = new Image();
    img.src = 'data:image/png;base64,${bild.toString('base64')}';
    await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const lin = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = [];
    for (let i = 0; i < d.length; i += 4) L.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
    L.sort(function (a, b) { return a - b; });
    const lo = L[Math.floor(L.length * 0.005)], hi = L[Math.floor(L.length * 0.995)];
    return Math.round((hi + 0.05) / (lo + 0.05) * 100) / 100;
  })()`) as Promise<number>;
};

/* Lage jedes Reiters: Zeichen (SVG) und Wort. */
const lagen = (pc: Page) => pc.evaluate(`(() => {
  return ${JSON.stringify(REITER)}.map(id => {
    const k = document.getElementById(id);
    if (!k) return null;
    const z = k.querySelector('.ho-z');
    const svg = z ? z.querySelector('svg') : null;
    const w = k.querySelector('b');
    if (!z || !svg || !w) return { id, fehlt: true };
    /* Grösse aus dem Layout (offsetHeight), nicht aus dem Rahmen: der aktive
       Reiter wird per transform vergrössert, und der Rahmen zählte das mit. */
    const sr = svg.getBoundingClientRect(), wr = w.getBoundingClientRect();
    return { id, boxH: z.offsetHeight, svgH: sr.height, svgB: sr.bottom, svgW: sr.width, wortT: wr.top };
  });
})()`) as Promise<({ id: string; fehlt?: boolean; boxH: number; svgH: number; svgB: number; svgW: number; wortT: number } | null)[]>;

const pruefeLagen = async (pc: Page, name: string, zusatz: string) => {
  const liste = await lagen(pc);
  const alle = liste.every(x => x && !x.fehlt);
  p(`${name}: alle fünf Reiter haben Zeichen und Wort ${zusatz}`, alle, JSON.stringify(liste));
  if (!alle) return;
  for (const x of liste as NonNullable<typeof liste[number]>[]) {
    p(`${name}: ${x.id} · Zeichen liegt über dem Wort (Zeichen ${x.svgB.toFixed(1)} ≤ Wort ${x.wortT.toFixed(1)} + 1)`,
      x.svgB <= x.wortT + 1, `Zeichen-Unterkante ${x.svgB.toFixed(1)} · Wort-Oberkante ${x.wortT.toFixed(1)}`);
    p(`${name}: ${x.id} · Zeichen 17–21 px (gemessen ${x.svgH.toFixed(1)} × ${x.svgW.toFixed(1)})`,
      x.svgH >= 17 && x.svgH <= 21 && x.svgW >= 17 && x.svgW <= 21, `${x.svgW.toFixed(1)} × ${x.svgH.toFixed(1)}`);
    p(`${name}: ${x.id} · Zeichen-Box fest und ≤ 25 px hoch`, x.boxH <= 25, `Box ${x.boxH.toFixed(1)} px`);
  }
};

const SCHALEN: Schale[] = ['standard', 'glass'];
for (const dunkel of [false, true]) {
  for (const schale of SCHALEN) {
    const wort = `${schale === 'glass' ? 'Glass Wheel' : 'Standard'} · ${dunkel ? 'dunkel' : 'hell'}`;
    console.log(`\n══ ${wort} ══`);
    const a = await aufmachen(schale, dunkel);

    console.log(`§1 Eine Kapsel (${wort})`);
    const kapsel = await stilVon(a.pc, '#handy-oben', '::after');
    p(`${wort}: kein sichtbares Pseudo-Element an der Kapsel (zweiter Ring weg)`, !malt(kapsel),
      JSON.stringify(kapsel));
    const schatten = await stilVon(a.pc, '#handy-oben');
    p(`${wort}: höchstens EINE Innenlinie im Schatten der Kapsel`, innenlinien(schatten?.shadow ?? '') <= 1,
      `${innenlinien(schatten?.shadow ?? '')} inset · ${schatten?.shadow ?? ''}`);
    const linse = await stilVon(a.pc, '#handy-oben #ho-pille');
    p(`${wort}: die Linse über dem aktiven Reiter existiert`, !!linse, JSON.stringify(linse));

    console.log(`§2 Zeichen über Wort (${wort})`);
    await pruefeLagen(a.pc, wort, 'in Ruhe');

    console.log(`§3 WebKit-Ersatz: das SVG ohne Grösse (${wort})`);
    await a.pc.addStyleTag({ content: '#handy-oben .ho-z svg{width:auto!important;height:auto!important}' });
    /* Dazu die Grössenattribute des eingesetzten SVG weg — so stand es in der
       Zeile, die Safari nicht verstanden hat (`alsSvg`: width/height="19"). */
    await a.pc.evaluate(`document.querySelectorAll('#handy-oben .ho-z svg').forEach(s => { s.removeAttribute('width'); s.removeAttribute('height'); })`);
    await a.pc.waitForTimeout(150);
    /* Der Zuschnitt ist die eigentliche Sicherung: ein SVG, das größer
       gezeichnet wird, malt NICHT mehr über das Wort. Vor E813 war die Box
       unbegrenzt (`overflow: visible`) — das ist rot. */
    const zugeschnitten = await a.pc.evaluate(`[...document.querySelectorAll('#handy-oben > button .ho-z')].map(z => getComputedStyle(z).overflow)`) as string[];
    p(`${wort}: jedes Zeichen schneidet sein SVG auf der Box ab (overflow: hidden)`,
      zugeschnitten.length === 5 && zugeschnitten.every(o => o === 'hidden'), zugeschnitten.join(' '));
    const liste = await lagen(a.pc);
    const boxen = liste.filter(x => x && !x.fehlt) as NonNullable<typeof liste[number]>[];
    p(`${wort}: ohne SVG-Grösse bleibt die Zeichen-Box über dem Wort (fest, ≤ 25 px, Unterkante ≤ Wort + 1)`,
      boxen.length === 5 && boxen.every(x => x.boxH <= 25 && x.svgB <= x.wortT + 1),
      boxen.map(x => `${x.id} Box ${x.boxH.toFixed(1)} · Unterkante ${x.svgB.toFixed(1)} / Wort ${x.wortT.toFixed(1)}`).join(' · '));

    console.log(`§4 In Ruhe lesbar (${wort})`);
    await a.pc.evaluate(`document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('width:auto!important')) s.remove(); })`);
    await a.pc.waitForTimeout(150);
    const wert = await kontrastDesAktivenWorts(a.pc);
    p(`${wort}: „Dokumente" unter der Linse mit mindestens 4,5 : 1 (gemessen ${wert} : 1)`,
      wert !== null && wert >= 4.5, String(wert));

    await a.zu();
  }
}

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
await browser.close();
server.close();
process.exit(weg === 0 ? 0 : 1);
