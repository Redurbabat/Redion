/* Suite 352 — Text wie GoodNotes: Kasten mit Umbruch, Schriftart, Grösse, Fett, Rahmen (E360)
 * ============================================================================
 * L115 Punkt 6, die Text-Hälfte: die `text`-Marke stand einzeilig, ohne
 * Schriftwahl, Grösse und Rahmen, nur dort, wo getippt wurde. Jetzt ist ein
 * Text ein KASTEN (`breiteBox`), dessen Zeilen `InkGeometry.textLayout`
 * rechnet — deterministisch, ohne DOM —, mit Schriftart, Stufen, Fett und
 * Rahmen aus der Leiste; alte einzeilige Marken bleiben, wie sie waren.
 *
 *   1 · DER TIPP fragt mehrzeilig; der Text wird ein Kasten mit Zeilen.
 *   2 · DIE LEISTE: Schriftart, A−/A+, Fett, Rahmen — der nächste Text
 *       trägt es.
 *   3 · MIT AUSWAHL gilt es der Auswahl — ein Schritt im Verlauf.
 *   4 · DER GRIFF zieht den Kasten breiter, die Zeilen folgen.
 *   5 · ALTE MARKEN ohne Kasten bleiben einzeilig.
 *   6 · DER DRUCKWEG bekommt dieselben Zeilen.
 *   7 · AM TELEFON: Fingerknöpfe, nur beim Text und bei der Auswahl.
 *   8 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test352.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Marken: any; declare const InkGeometry: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9361;

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
type Seite = import('playwright').Page;

const kontext = async (handy = false) => {
  const ktx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1280, height: 900 },
    isMobile: handy, hasTouch: handy, deviceScaleFactor: 1
  });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForTimeout(2800);
  const blattId = await pg.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const s = Store.addPage(null, { text: 'Textprobe', icon: '🔤' });
    const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'blanko' });
    Store.addBlock(b.id, 'text', { text: '' });
    await Store.flush();
    App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    return b.id as string;
  });
  return { ktx, pg, blattId };
};

const textMarken = (pg: Seite, blattId: string) => pg.evaluate((id: string) =>
  (((Store.getBlock(id) || {}).marken || []) as any[]).filter(m => m.art === 'text').map(m => ({
    id: String(m.id), text: String(m.text ?? ''), fontSize: Number(m.fontSize),
    breiteBox: m.breiteBox === undefined ? null : Math.round(Number(m.breiteBox) * 10) / 10,
    schrift: m.schrift ?? null, fett: !!m.fett, rahmen: !!m.rahmen,
    point: Array.isArray(m.point) ? m.point.map((v: number) => Math.round(v * 10) / 10) : null
  })), blattId);
const textKnoten = (pg: Seite, sid: string) => pg.evaluate((sid: string) => {
  const k = document.querySelector<SVGElement>(`.blatt-marken [data-sid="${sid}"]`);
  if (!k) return null;
  const t = k.tagName === 'text' ? k : k.querySelector('text');
  const rahmen = k.querySelector('rect.blatt-textrahmen');
  return { tag: k.tagName, tspans: k.querySelectorAll('tspan').length,
    familie: t?.getAttribute('font-family') ?? '', gewicht: t?.getAttribute('font-weight') ?? '',
    groesse: Number(t?.getAttribute('font-size')), rahmen: !!rahmen,
    rahmenBreite: rahmen ? Number(rahmen.getAttribute('width')) : null,
    inhalt: t?.textContent ?? '' };
}, sid);
const blattMass = (pg: Seite) => pg.evaluate(() => {
  const s = document.querySelector<SVGSVGElement>('.blatt-marken')!;
  return { w: s.viewBox.baseVal.width, h: s.viewBox.baseVal.height };
});
const auswahl = (pg: Seite) => pg.evaluate(() => {
  const r = document.querySelector<SVGRectElement>('.blatt-marken .blatt-auswahlrahmen');
  return { rahmen: document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen').length,
    hoehe: r ? Number(r.getAttribute('height')) : 0,
    tool: document.querySelector('.blatt-marken')?.getAttribute('data-tool') ?? null };
});
const zug = (pg: Seite, punkte: Array<[number, number]>, ziel = '') =>
  pg.evaluate(async ([punkte, ziel]: [Array<[number, number]>, string]) => {
    const svg = document.querySelector<SVGSVGElement>('.blatt-marken')!;
    const ctm = svg.getScreenCTM()!;
    const zu = (x: number, y: number) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm); return { clientX: c.x, clientY: c.y }; };
    const ev = (typ: string, x: number, y: number) => new PointerEvent(typ, { ...zu(x, y), pointerType: 'mouse', isPrimary: true,
      button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1, pointerId: 7, bubbles: true, cancelable: true });
    const start = ziel ? svg.querySelector(ziel)! : svg;
    start.dispatchEvent(ev('pointerdown', punkte[0]![0], punkte[0]![1]));
    for (let i = 1; i < punkte.length; i++) svg.dispatchEvent(ev('pointermove', punkte[i]![0], punkte[i]![1]));
    const e = punkte[punkte.length - 1]!;
    svg.dispatchEvent(ev('pointerup', e[0], e[1]));
    await new Promise(f => setTimeout(f, 120));
  }, [punkte, ziel] as [Array<[number, number]>, string]);
const werkzeug = (pg: Seite, wz: string) => pg.click(`.blatt-werk [data-wz="${wz}"]`);
/** Mit dem Text-Werkzeug tippen, in das Schreibfeld auf dem Blatt tippen, fertig.
 *  Seit E597 gibt es kein Fenster mehr dazwischen (Redurs OneNote-Satz):
 *  der Tipp legt das Feld genau dorthin, wo der Text stehen wird. */
const textSetzen = async (pg: Seite, x: number, y: number, text: string): Promise<void> => {
  await werkzeug(pg, 'text');
  await zug(pg, [[x, y]]);
  await pg.waitForSelector('.blatt-schreiber', { timeout: 5000 });
  await pg.fill('.blatt-schreiber', text);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(250);
};
const knopfMass = (pg: Seite, wahl: string) => pg.evaluate((wahl: string) => {
  const k = document.querySelector<HTMLElement>(`.blatt-werk ${wahl}`);
  if (!k) return null;
  const r = k.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), sichtbar: getComputedStyle(k).display !== 'none' };
}, wahl);

const LANG = 'Der Strom fliesst vom Pluspol zum Minuspol, sagt die technische Stromrichtung.\nZweite Zeile, kurz.';

/* ── 1 ────────────────────────────────────────────────────────────────── */
console.log('\n1 · Der Tipp fragt mehrzeilig; der Text wird ein Kasten mit Zeilen');
const { ktx, pg, blattId } = await kontext();
const mass = await blattMass(pg);
await textSetzen(pg, 60, 120, LANG);
let m = await textMarken(pg, blattId);
gleich('Eine Textmarke', m.length, 1);
const erste = m[0]!;
p('… mit einem Kasten von 40 % der Blattbreite', Math.abs((erste.breiteBox ?? 0) - Math.round(mass.w * 0.4)) <= 1,
  `${erste.breiteBox} bei ${mass.w}`);
gleich('… an der getippten Stelle (linke obere Ecke)', erste.point, [60, 120]);
p('… mit dem Text samt Zeilenumbruch', erste.text === LANG, JSON.stringify(erste.text));
gleich('… in der Vorgabe: 16 px, Standard, nicht fett, kein Rahmen',
  [erste.fontSize, erste.schrift, erste.fett, erste.rahmen], [16, 'standard', false, false]);
let k = await textKnoten(pg, erste.id);
p('Gezeichnet als Gruppe mit mindestens drei tspan-Zeilen (der Satz bricht um)',
  k?.tag === 'g' && (k?.tspans ?? 0) >= 3, JSON.stringify(k));
const layoutZeilen = await pg.evaluate((mark: any) => InkGeometry.textLayout(mark)?.lines ?? null, erste);
p('… und es sind genau die Zeilen, die InkGeometry.textLayout rechnet',
  Array.isArray(layoutZeilen) && layoutZeilen.length === k?.tspans, JSON.stringify(layoutZeilen));
const zeilenMass = await pg.evaluate((mark: any) => {
  const l = InkGeometry.textLayout(mark);
  return l ? { innen: l.width - l.pad * 2, breitest: Math.max(...l.lines.map((z: string) =>
    InkGeometry.textWidth(z, l.fontSize, l.family, l.bold))) } : null;
}, erste);
p('Keine Zeile ist breiter als der Kasten innen (nach derselben Rechnung)',
  !!zeilenMass && zeilenMass.breitest <= zeilenMass.innen, JSON.stringify(zeilenMass));
p('… und kein Wort ging verloren oder kam doppelt',
  Array.isArray(layoutZeilen) && (layoutZeilen as string[]).join(' ').replace(/\s+/g, ' ') ===
    LANG.replace(/\n/g, ' ').replace(/\s+/g, ' '), JSON.stringify(layoutZeilen));

/* ── 2 ────────────────────────────────────────────────────────────────── */
console.log('\n2 · Die Leiste: Schriftart, A−/A+, Fett, Rahmen — der nächste Text trägt es');
const gruppe = await pg.evaluate(() =>
  /* OHNE DEN TRENNER (E568): seit die Gruppen am Rechner einen Strich
     voreinander haben, trägt auch er `data-gruppe="schrift"` — er kommt
     und geht mit der Gruppe, genau dafür ist er so gebaut. Gezählt
     werden hier aber die BEDIENTEILE, und ein Strich ist keines. */
  [...document.querySelectorAll<HTMLElement>('.blatt-werk [data-gruppe="schrift"]:not(.blatt-trenn)')]
    .map(k => ({ act: k.dataset['act'], sichtbar: getComputedStyle(k).display !== 'none' })));
/* SECHS seit E560 — die Ausrichtung ist dazugekommen. Die Liste bleibt
   vollständig aufgezählt und nicht auf eine Anzahl verkürzt: sie soll rot
   werden, wenn ein Knopf verschwindet ODER einer unangekündigt dazukommt. */
gleich('Sechs Knöpfe der Gruppe „schrift", beim Text-Werkzeug alle sichtbar',
  gruppe, [['schriftart', true], ['kleiner', true], ['groesser', true], ['fett', true],
           ['rahmen', true], ['ausricht', true]]
    .map(([act, sichtbar]) => ({ act, sichtbar })));
await pg.click('.blatt-werk [data-act="schriftart"]');
gleich('Schriftart antippen: Standard → Serifen', await pg.getAttribute('.blatt-werk [data-act="schriftart"]', 'data-schrift'), 'serif');
await pg.click('.blatt-werk [data-act="groesser"]');
await pg.click('.blatt-werk [data-act="fett"]');
await pg.click('.blatt-werk [data-act="rahmen"]');
gleich('Fett und Rahmen sind gedrückt', await pg.evaluate(() => [
  document.querySelector('.blatt-werk [data-act="fett"]')?.getAttribute('aria-pressed'),
  document.querySelector('.blatt-werk [data-act="rahmen"]')?.getAttribute('aria-pressed')]), ['true', 'true']);
/* `ausricht` seit E560 — es wird mitgemerkt wie Familie, Grad, Fett und
   Rahmen, und steht hier ausdrücklich statt still durchzurutschen. */
gleich('… und gemerkt (zeichnen:schrift)', await pg.evaluate(() => Store.getMeta('zeichnen:schrift')),
  { familie: 'serif', groesse: 20, fett: true, rahmen: true, ausricht: 'links' });
await textSetzen(pg, 60, 420, 'Merksatz');
m = await textMarken(pg, blattId);
const zweite = m.find(x => x.text === 'Merksatz')!;
gleich('Der nächste Text trägt Serifen, 20 px, fett, Rahmen',
  [zweite?.schrift, zweite?.fontSize, zweite?.fett, zweite?.rahmen], ['serif', 20, true, true]);
k = await textKnoten(pg, zweite.id);
p('… und ist so gezeichnet: Georgia, 700, ein Rahmen-Rechteck in Kastenbreite',
  !!k && /Georgia/.test(k.familie) && k.gewicht === '700' && k.rahmen && k.rahmenBreite === zweite.breiteBox,
  JSON.stringify(k));

/* ── 3 ────────────────────────────────────────────────────────────────── */
console.log('\n3 · Mit Auswahl gilt es der Auswahl — ein Schritt im Verlauf');
await werkzeug(pg, 'select');
await zug(pg, [[80, 140]], `[data-sid="${erste.id}"]`);
gleich('Der erste Text ist gewählt', (await auswahl(pg)).rahmen, 1);
const vorher = await textKnoten(pg, erste.id);
const zeilenVorher = vorher?.tspans ?? 0;
const hoeheVorher = (await auswahl(pg)).hoehe;
await pg.click('.blatt-werk [data-act="groesser"]');
m = await textMarken(pg, blattId);
gleich('A+ mit Auswahl: der erste Text geht von 16 auf 20 px', m.find(x => x.id === erste.id)?.fontSize, 20);
k = await textKnoten(pg, erste.id);
/* HIER STAND „bricht in mehr Zeilen um", und das war ein Hilfsmass.
   Seit E562 wird die Textbreite exakt gemessen statt geschätzt; dieser Satz
   umbricht schon bei 16 px in fünf Zeilen und bei 20 px wieder in fünf.
   Die Zeilenzahl SÄTTIGT — der Kasten wird trotzdem höher, und das ist die
   Eigenschaft, um die es geht. Sie wird jetzt unmittelbar gemessen statt
   über einen Stellvertreter, der bei einem anderen Text zufällig stimmt. */
p('… und wird höher — der Kasten wächst mit dem Grad',
  (await auswahl(pg)).hoehe > hoeheVorher,
  `${(await auswahl(pg)).hoehe} nach ${hoeheVorher} (Zeilen: ${k?.tspans} nach ${zeilenVorher})`);
p('… der Auswahlrahmen wächst mit', (await auswahl(pg)).hoehe > 0 && (await auswahl(pg)).hoehe >= (k?.tspans ?? 0) * 20 * 1.25,
  String((await auswahl(pg)).hoehe));
await pg.click('.blatt-werk [data-act="undo"]');
m = await textMarken(pg, blattId);
gleich('Zurück: wieder 16 px', m.find(x => x.id === erste.id)?.fontSize, 16);
gleich('Die Auswahl steht noch', (await auswahl(pg)).rahmen, 1);
await pg.click('.blatt-werk [data-act="schriftart"]');
m = await textMarken(pg, blattId);
gleich('Schriftart mit Auswahl: der erste Text wird Schreibmaschine (Serifen → Mono)',
  m.find(x => x.id === erste.id)?.schrift, 'mono');
p('… gezeichnet mit einem Monospace-Stapel', /monospace/.test((await textKnoten(pg, erste.id))?.familie ?? ''));

/* ── 4 ────────────────────────────────────────────────────────────────── */
console.log('\n4 · Der Griff zieht den Kasten breiter, die Zeilen folgen');
const vorGriff = m.find(x => x.id === erste.id)!;
const zeilenVorGriff = (await textKnoten(pg, erste.id))?.tspans ?? 0;
const kasten = await pg.evaluate(() => {
  const r = document.querySelector<SVGRectElement>('.blatt-marken .blatt-auswahlkasten');
  return r ? { x: Number(r.getAttribute('x')), y: Number(r.getAttribute('y')),
    w: Number(r.getAttribute('width')), h: Number(r.getAttribute('height')) } : null;
});
p('Ein Auswahlkasten mit Griffen', !!kasten);
if (kasten) {
  const se: [number, number] = [kasten.x + kasten.w, kasten.y + kasten.h];
  await zug(pg, [se, [se[0] + 60, se[1]], [se[0] + 120, se[1]]], '.blatt-griff-feld[data-griff="se"]');
  m = await textMarken(pg, blattId);
  const nachGriff = m.find(x => x.id === erste.id)!;
  p('Der Kasten ist rund 40 % breiter', (nachGriff.breiteBox ?? 0) > (vorGriff.breiteBox ?? 0) * 1.3,
    `${nachGriff.breiteBox} nach ${vorGriff.breiteBox}`);
  p('… die Schrift wächst mit dem Mittel (zwischen 16 und 20 px)', nachGriff.fontSize > 16 && nachGriff.fontSize < 20,
    String(nachGriff.fontSize));
  k = await textKnoten(pg, erste.id);
  p('… und die Zeilen sind nicht mehr geworden', (k?.tspans ?? 99) <= zeilenVorGriff, `${k?.tspans} nach ${zeilenVorGriff}`);
  await pg.click('.blatt-werk [data-act="undo"]');
  gleich('Zurück: die alte Breite', (await textMarken(pg, blattId)).find(x => x.id === erste.id)?.breiteBox, vorGriff.breiteBox);
}

/* ── 5 ────────────────────────────────────────────────────────────────── */
console.log('\n5 · Alte Marken ohne Kasten bleiben einzeilig');
await pg.evaluate((id: string) => {
  const b = Store.getBlock(id);
  Store.updateBlock(id, { marken: [...(b.marken || []),
    { id: 'alt-352', art: 'text', point: [100, 700], text: 'Alt\nZeile', fontSize: 18, farbe: '#111111' }] });
  App.zeichneSeite?.();
}, blattId);
await pg.waitForTimeout(700);
k = await textKnoten(pg, 'alt-352');
gleich('Die alte Marke ist ein einzelnes <text> ohne Kasten', k?.tag, 'text');
gleich('… mit dem Zeilenumbruch als Leerzeichen, wie seit E100', k?.inhalt, 'Alt Zeile');
gleich('… keine tspan-Zeilen', k?.tspans, 0);
p('… und ihr Kasten in den Daten ist keiner (breiteBox fehlt)',
  (await textMarken(pg, blattId)).find(x => x.id === 'alt-352')?.breiteBox === null);

/* ── 6 ────────────────────────────────────────────────────────────────── */
console.log('\n6 · Der Druckweg bekommt dieselben Zeilen');
const druck = await pg.evaluate((id: string) => {
  const marken = (Store.getBlock(id).marken || []) as any[];
  const kasten = marken.find(m => m.art === 'text' && m.breiteBox && m.rahmen);
  const html = kasten ? Marken.zeichneMarke(kasten)?.outerHTML ?? '' : '';
  return { tspans: (html.match(/<tspan/g) || []).length, rahmen: /blatt-textrahmen/.test(html), georgia: /Georgia/.test(html) };
}, blattId);
p('zeichneMarke liefert die Gruppe mit tspan-Zeilen, Rahmen und Schriftstapel',
  druck.tspans >= 1 && druck.rahmen && druck.georgia, JSON.stringify(druck));
const druckQ = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/wissen/werkzeuge.js'), 'utf8');
p('Der Druckweg geht durch zeichneMarke (werkzeuge.js)', druckQ.includes('Marken.zeichneMarke(m)'));
await ktx.close();

/* ── 7 ────────────────────────────────────────────────────────────────── */
console.log('\n7 · Am Telefon: Fingerknöpfe, nur beim Text und bei der Auswahl');
const handy = await kontext(true);
await werkzeug(handy.pg, 'text');
await handy.pg.waitForTimeout(300);
const gross = await knopfMass(handy.pg, '[data-act="groesser"]');
p('A+ ist beim Text ein Fingerknopf (≥ 44 × 44)', !!gross && gross.sichtbar && gross.w >= 44 && gross.h >= 44, JSON.stringify(gross));
await werkzeug(handy.pg, 'stift');
await handy.pg.waitForTimeout(300);
const beimStift = await knopfMass(handy.pg, '[data-act="schriftart"]');
p('… beim Stift ist die Gruppe weg', !!beimStift && !beimStift.sichtbar, JSON.stringify(beimStift));
await werkzeug(handy.pg, 'select');
await handy.pg.waitForTimeout(300);
const beiAuswahl = await knopfMass(handy.pg, '[data-act="fett"]');
p('… bei der Auswahl da (man färbt und schreibt Gewähltes um)', !!beiAuswahl && beiAuswahl.sichtbar, JSON.stringify(beiAuswahl));
await handy.ktx.close();

/* ── 8 ────────────────────────────────────────────────────────────────── */
console.log('\n8 · Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
