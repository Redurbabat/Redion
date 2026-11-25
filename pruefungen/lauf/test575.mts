/* Suite 575 — Auf der Fläche zeichnen, mit EINEM Formenzeichner (E693, L219)
 * ============================================================================
 * Redur, 26. September 2026: „weiter" — nachdem L220 geschlossen war und in
 * L219 stand, was der Fläche noch fehlt: darauf zeichnen.
 *
 * DIE ZWEI HÄLFTEN DIESES LAUFS, und die erste ist die wichtigere:
 *
 *   1. EIN Zeichner für Formen, nicht zwei (§8). Das Whiteboard hat seinen
 *      seit E138; die Seitenfläche bekommt jetzt auch einen. Zwei Fassungen
 *      derselben Zeichnung laufen auseinander — und man sieht es erst, wenn
 *      ein Pfeil auf der einen Fläche eine Spitze hat und auf der anderen
 *      nicht. Also zieht der Zeichner in den Kern (`core/gfx/shapes.ts`),
 *      und BEIDE Flächen lesen daraus. Dasselbe Muster wie `GfxHistory`
 *      (E687) und `GfxToolbar` (E689).
 *
 *   2. Und dann kann man auf der Seitenfläche wirklich zeichnen: Stift,
 *      Linie, Pfeil, Rechteck, Ellipse, Radierer — mit demselben
 *      Formenformat wie das Whiteboard (`shapes`, dokumentiert in
 *      `doku/REDION-FORMAT.md`), damit eine Sicherung nicht zwei Formate
 *      kennen muss.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   §1  Den Kern gibt es, und er kennt keine Fläche: keine `wb-`, `gk-`,
 *       `sp-`, `pg-fl-`-Namen, kein `Store`, kein `Register`.
 *   §2  Beide Flächen zeichnen dieselbe Form ZEICHENGLEICH — gemessen am
 *       `d` des Pfades, nicht am Augenschein.
 *   §3  Der Stift zieht einen Strich, und er steht als `shapes` am
 *       Seitenblock, mit `raumVersion` (E686-Muster).
 *   §4  Linie, Pfeil, Rechteck und Ellipse entstehen mit demselben Format
 *       wie im Whiteboard.
 *   §5  Der Radierer nimmt GENAU eine Form weg, nicht die Nachbarn.
 *   §6  Strg+Z nimmt den letzten Strich zurück — und nicht den Block
 *       darunter (E682).
 *   §6b … und nicht das eingebettete Whiteboard, auch wenn es selbst einen
 *       Schritt zurücknehmen könnte; im Whiteboard nimmt Strg+Z nur dort
 *       zurück, nicht auf der Fläche (E722).
 *   §7  Die Zeichnung überlebt das Neuöffnen der Seite.
 *   §8  Die Tinte liegt UNTER den Kästen: im Kasten trifft der Finger den
 *       Text, nicht die Zeichnung.
 *   §9  Am Telefon misst jedes Werkzeug 44 px, und der Finger zeichnet.
 *   §10 Nichts geht verloren: der Text der Seite ist unverändert.
 *   §11 Wer die letzte Form wegradiert, hat KEINE Zeichnung — kein leeres
 *       `shapes`, keine `raumVersion` ohne Formen (§9).
 *
 * GEGEN DEN STAND VON E692 ist alles rot: es gibt weder den Kern noch die
 * Tinte.
 *
 *   node pruefungen/alle.mts 575
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)} soll ${JSON.stringify(soll)}`);

/* ==========================================================================
 * §1 · Der Kern kennt keine Fläche — ohne Browser, wie test571
 * --------------------------------------------------------------------------
 * `nurCode` streicht Kommentare und Zeichenketten, bevor gesucht wird. Ohne
 * das meldet der Lauf den eigenen Kopfkommentar als Verstoss — genau das ist
 * `test572` beim ersten Anlauf passiert (E689).
 * ======================================================================== */
console.log('\n1 · Der Kern kennt keine Fläche');
const KERN = path.join(WURZEL, 'src/core/gfx/shapes.ts');
p('Es gibt `src/core/gfx/shapes.ts`', fs.existsSync(KERN), KERN);
const quelle = fs.existsSync(KERN) ? fs.readFileSync(KERN, 'utf8') : '';
const nurCode = (t: string) => t
  .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
  .replace(/'(?:[^'\\]|\\.)*'/g, "''").replace(/"(?:[^"\\]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');
const code = nurCode(quelle);
for (const wort of ['wb-', 'gk-', 'sp-', 'pg-fl', 'Store', 'Register', 'App', 'Dateien'])
  p(`Der Kern nennt „${wort}" nicht`, !code.includes(wort),
    'gefunden in ' + (code.split('\n').findIndex(z => z.includes(wort)) + 1));
p('Und er gibt etwas heraus', /GfxShapes\s*=/.test(quelle) || /zeichne/.test(code));

/* --- Der Rest braucht die echte App -------------------------------------- */
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
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;
const browser = await chromium.launch();

const TEXT = 'Der Text der Seite bleibt, was er ist';
const bauen = async (breite: number, hoehe: number) => {
  const pg = await browser.newPage({
    viewport: { width: breite, height: hoehe }, hasTouch: breite <= 760 });
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pg.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
  const ids = await pg.evaluate(async (text: string) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
    const s = Store.addPage(null, { text: 'Zeichnen', seitenAnsicht: 'flaeche' });
    const b = Store.addBlock(s.id, 'text', { text });
    await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
    return { seite: s.id, block: b.id };
  }, TEXT);
  await pg.waitForTimeout(300);
  return { pg, ids };
};

const { pg, ids } = await bauen(1400, 950);
const formen = () => pg.evaluate((id: string) =>
  JSON.parse(JSON.stringify((Store.getBlock(id) as any)?.shapes ?? null)), ids.seite);

/** Ein Strich mit der Maus, in Bildschirmpunkten auf der Fläche. */
const ziehen = async (von: [number, number], nach: [number, number], schritte = 6) => {
  const k = await pg.evaluate(() => {
    const f = document.querySelector('.pg-flaeche')!.getBoundingClientRect();
    return { x: f.left, y: f.top };
  });
  await pg.mouse.move(k.x + von[0], k.y + von[1]);
  await pg.mouse.down();
  await pg.mouse.move(k.x + nach[0], k.y + nach[1], { steps: schritte });
  await pg.mouse.up();
  await pg.waitForTimeout(250);
};

const werkzeug = async (id: string) => {
  await pg.evaluate((w: string) => {
    document.querySelector<HTMLElement>(`.pg-flaeche .gfx-tb-sockel [data-wz="${w}"]`)?.click();
  }, id);
  await pg.waitForTimeout(200);
};

/* ==========================================================================
 * §2 · Beide Flächen zeichnen dieselbe Form gleich
 * ======================================================================== */
console.log('\n2 · Ein Zeichner für beide Flächen');
const gleichGezeichnet = await pg.evaluate(() => {
  const G = (window as any).GfxShapes;
  if (!G || typeof G.zeichne !== 'function') return { da: false };
  const form = { id: 'x1', art: 'stift', pts: [[0, 0], [10, 10], [20, 0]], farbe: '#e03e3e' };
  const a = G.zeichne(form, { pfeilMarke: 'pa' });
  const b = G.zeichne(form, { pfeilMarke: 'pb' });
  const pfadVon = (el: any): string => {
    const pfad = el?.tagName === 'path' ? el : el?.querySelector?.('path:last-of-type');
    return pfad?.getAttribute('d') ?? '';
  };
  return { da: true, a: pfadVon(a), b: pfadVon(b), gleich: pfadVon(a) === pfadVon(b) };
});
p('`GfxShapes.zeichne` gibt es', gleichGezeichnet.da === true);
p('Und derselbe Strich kommt zeichengleich heraus', gleichGezeichnet.gleich === true,
  JSON.stringify(gleichGezeichnet));
p('Der Pfad ist nicht leer', (gleichGezeichnet.a ?? '').length > 4, gleichGezeichnet.a ?? '');

/* ==========================================================================
 * §3 · Der Stift zieht einen Strich
 * ======================================================================== */
console.log('\n3 · Der Stift');
p('Es gibt ein Stift-Werkzeug auf der Fläche',
  await pg.evaluate(() => !!document.querySelector('.pg-flaeche .gfx-tb-sockel [data-wz="stift"]')));
await werkzeug('stift');
await ziehen([120, 300], [320, 420]);
const nachStrich = await formen();
p('Nach dem Strich steht `shapes` am Seitenblock',
  Array.isArray(nachStrich) && nachStrich.length === 1, JSON.stringify(nachStrich));
gleich('Und es ist ein Stiftstrich',
  Array.isArray(nachStrich) ? nachStrich[0]?.art : null, 'stift');
p('Mit mehr als zwei Punkten',
  Array.isArray(nachStrich) && (nachStrich[0]?.pts?.length ?? 0) >= 2,
  String(nachStrich?.[0]?.pts?.length));
p('Die Deutung der Zahlen steht dabei (`raumVersion`, E686)',
  await pg.evaluate((id: string) => (Store.getBlock(id) as any)?.raumVersion === 1, ids.seite));

/* ==========================================================================
 * §4 · Die vier anderen Formen
 * ======================================================================== */
console.log('\n4 · Linie, Pfeil, Rechteck, Ellipse');
for (const [wz, y] of [['linie', 480], ['pfeil', 540], ['rechteck', 600], ['ellipse', 660]] as [string, number][]) {
  await werkzeug(wz);
  await ziehen([120, y], [300, y + 40], 3);
}
const alleFormen = await formen();
gleich('Fünf Formen liegen auf der Fläche',
  Array.isArray(alleFormen) ? alleFormen.length : 0, 5);
gleich('Und zwar in dieser Reihenfolge',
  Array.isArray(alleFormen) ? alleFormen.map((s: any) => s.art) : null,
  ['stift', 'linie', 'pfeil', 'rechteck', 'ellipse']);
p('Die Kästen haben x, y, w, h — dasselbe Format wie im Whiteboard',
  Array.isArray(alleFormen) && alleFormen.slice(1).every((s: any) =>
    ['x', 'y', 'w', 'h'].every(k => typeof s[k] === 'number')),
  JSON.stringify(alleFormen?.[3]));

/* ==========================================================================
 * §4b · Tinte und Kasten teilen EINEN transform
 * --------------------------------------------------------------------------
 * Das ist die Bedingung, die L219 aufgeschrieben hat, bevor eine Zeile
 * entstand: die Tinte liegt IN derselben bewegten Ebene wie die Kaesten.
 * Laege sie daneben, braeuchte es eine zweite Umrechnung — und genau daran
 * ist es zweimal schiefgegangen (E623, E686). Gemessen wird nicht der
 * Quelltext, sondern die Bewegung: beim Zoomen muss die Tinte denselben
 * Faktor mitmachen wie der Kasten.
 * ======================================================================== */
console.log('\n4b · Tinte und Kasten bewegen sich gemeinsam');
const vorZoom = await pg.evaluate(() => {
  const t = document.querySelector('.pg-fl-tinte [data-sid]')?.getBoundingClientRect();
  const k = document.querySelector('.pg-fl-notiz')?.getBoundingClientRect();
  return t && k ? { t: { x: t.left, y: t.top, w: t.width }, k: { x: k.left, y: k.top, w: k.width } } : null;
});
await pg.evaluate(() => {
  document.querySelector<HTMLElement>('.pg-flaeche .gfx-tb-sockel [data-a="kleiner"]')?.click();
});
await pg.waitForTimeout(300);
const nachZoom = await pg.evaluate(() => {
  const t = document.querySelector('.pg-fl-tinte [data-sid]')?.getBoundingClientRect();
  const k = document.querySelector('.pg-fl-notiz')?.getBoundingClientRect();
  return t && k ? { t: { x: t.left, y: t.top, w: t.width }, k: { x: k.left, y: k.top, w: k.width } } : null;
});
p('Vor und nach dem Zoomen ist beides messbar', !!vorZoom && !!nachZoom);
if (vorZoom && nachZoom) {
  const faktorTinte = nachZoom.t.w / (vorZoom.t.w || 1);
  const faktorKasten = nachZoom.k.w / (vorZoom.k.w || 1);
  p('Die Tinte schrumpft um denselben Faktor wie der Kasten',
    Math.abs(faktorTinte - faktorKasten) < 0.02,
    `Tinte ×${faktorTinte.toFixed(3)} · Kasten ×${faktorKasten.toFixed(3)}`);
  p('Und sie ist wirklich kleiner geworden — sonst misst der Abschnitt nichts',
    faktorTinte < 0.95, String(faktorTinte.toFixed(3)));
}
await pg.evaluate(() => {
  document.querySelector<HTMLElement>('.pg-flaeche .gfx-tb-sockel [data-a="groesser"]')?.click();
});
await pg.waitForTimeout(300);

/* ==========================================================================
 * §4c · „Ins Bild holen" holt auch die Tinte
 * --------------------------------------------------------------------------
 * Zweimal in zwei Boegen hat das BILD dieselbe Luecke gezeigt (§55.1): erst
 * rechnete der Knopf nur mit dem Seitenkasten und liess die herausgezogenen
 * Bloecke draussen (E691), dann nur mit den Kaesten und liess die Formen
 * draussen. Diese Zusage haelt beides.
 * ======================================================================== */
console.log('\n4c · Ins Bild holen mit Tinte');
await pg.evaluate(() => {
  const s = (Store.getBlock(document.querySelector('.pg-flaeche') ? '' : '') as any);
  void s;
});
await pg.evaluate((id: string) => {
  const b: any = Store.getBlock(id);
  const formen = Array.isArray(b?.shapes) ? b.shapes.slice() : [];
  formen.push({ id: 'weit', art: 'rechteck', x: 2200, y: 1500, w: 200, h: 120, farbe: '#4dab9a' });
  Store.updateBlock(id, { shapes: formen });
  App.zeichneSeite();
}, ids.seite);
await pg.waitForTimeout(500);
await pg.evaluate(() => {
  document.querySelector<HTMLElement>('.pg-flaeche .gfx-tb-sockel [data-a="passend"]')?.click();
});
await pg.waitForTimeout(450);
const allesDrin = await pg.evaluate(() => {
  const f = document.querySelector('.pg-flaeche')!.getBoundingClientRect();
  const draussen = [...document.querySelectorAll('.pg-fl-tinte [data-sid]')].filter(el => {
    const r = (el as SVGGraphicsElement).getBoundingClientRect();
    return r.width > 0 && (r.left < f.left - 2 || r.right > f.right + 2 || r.bottom > f.bottom + 2);
  });
  return { formen: document.querySelectorAll('.pg-fl-tinte [data-sid]').length, draussen: draussen.length };
});
p('Es liegen Formen auf der Fläche', allesDrin.formen > 0, String(allesDrin.formen));
p('Nach „Ins Bild" liegt keine davon ausserhalb',
  allesDrin.draussen === 0, `${allesDrin.draussen} draussen`);
await pg.evaluate((id: string) => {
  const b: any = Store.getBlock(id);
  Store.updateBlock(id, { shapes: (b?.shapes ?? []).filter((x: any) => x.id !== 'weit') });
  App.zeichneSeite();
}, ids.seite);
await pg.waitForTimeout(450);

/* ==========================================================================
 * §5 · Der Radierer nimmt GENAU eine Form
 * ======================================================================== */
console.log('\n5 · Der Radierer');
await werkzeug('radierer');
/* DIE STELLE WIRD GEMESSEN, NICHT ANGENOMMEN. Der erste Anlauf radierte auf
   einem festen Bildschirmpunkt — und §4c hatte den Ausschnitt inzwischen
   verschoben, also lag dort nichts mehr. Ein Prüflauf, der eine Stelle
   auswendig kennt, misst ab der nächsten Änderung etwas anderes. */
const stiftBox = await pg.evaluate((id: string) => {
  const el = document.querySelector(`.pg-fl-tinte [data-sid="${id}"]`);
  const r = el?.getBoundingClientRect();
  return r ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null;
}, (await formen())?.[0]?.id ?? '');
p('Der Stiftstrich ist auf dem Bild zu finden', !!stiftBox, JSON.stringify(stiftBox));
if (stiftBox) {
  await pg.mouse.move(stiftBox.x, stiftBox.y);
  await pg.mouse.down();
  await pg.mouse.move(stiftBox.x + 6, stiftBox.y + 6, { steps: 2 });
  await pg.mouse.up();
  await pg.waitForTimeout(300);
}
const nachRadieren = await formen();
gleich('Eine Form weniger', Array.isArray(nachRadieren) ? nachRadieren.length : -1, 4);
p('Und zwar der Stiftstrich, nicht ein Nachbar',
  Array.isArray(nachRadieren) && !nachRadieren.some((s: any) => s.art === 'stift'),
  JSON.stringify(nachRadieren?.map((s: any) => s.art)));

/* ==========================================================================
 * §6 · Strg+Z gehört der Fläche (E682)
 * ======================================================================== */
console.log('\n6 · Zurück');
await pg.evaluate(() => {
  document.querySelector<HTMLElement>('.pg-flaeche')?.focus();
});
await pg.keyboard.press('Control+z');
await pg.waitForTimeout(400);
const nachZurueck = await formen();
gleich('Strg+Z holt die radierte Form zurück',
  Array.isArray(nachZurueck) ? nachZurueck.length : -1, 5);
p('Und der Block der Seite hat seine Kennung behalten (E682)',
  await pg.evaluate((id: string) => !!Store.getBlock(id), ids.block));

/* ==========================================================================
 * §7 · Die Zeichnung überlebt das Neuöffnen
 * ======================================================================== */
console.log('\n7 · Neu öffnen');
await pg.evaluate((id: string) => { App.oeffne(id); }, ids.seite);
await pg.waitForTimeout(600);
const nachOeffnen = await pg.evaluate(() => ({
  imSpeicher: null,
  gezeichnet: document.querySelectorAll('.pg-fl-tinte [data-sid]').length
}));
p('Die Formen sind nach dem Neuöffnen wieder gezeichnet',
  nachOeffnen.gezeichnet >= 5, String(nachOeffnen.gezeichnet));

/* ==========================================================================
 * §8 · Die Tinte liegt UNTER den Kästen
 * --------------------------------------------------------------------------
 * Gemessen mit `elementFromPoint`, nicht nach Augenschein — derselbe Griff,
 * den `test572 §9` gelernt hat: eine Lage, die gemessen richtig liegt, kann
 * auf dem Bildschirm trotzdem im Weg sein.
 * ======================================================================== */
console.log('\n8 · Tinte unter dem Text');
const imKasten = await pg.evaluate(() => {
  const k = document.querySelector('.pg-fl-notiz[data-fl-seite] .pg-fl-koerper .blk');
  if (!k) return { da: false };
  const r = k.getBoundingClientRect();
  const el = document.elementFromPoint(Math.round(r.left + 20), Math.round(r.top + r.height / 2));
  return { da: true, imText: !!el?.closest('.pg-fl-notiz'), tag: el?.tagName ?? '?' };
});
p('Im Kasten trifft der Finger den Text, nicht die Tinte',
  imKasten.da === true && imKasten.imText === true, JSON.stringify(imKasten));

/* ==========================================================================
 * §10 · Nichts geht verloren
 * ======================================================================== */
console.log('\n10 · Nichts geht verloren');
gleich('Der Text der Seite ist unverändert',
  await pg.evaluate((id: string) => Store.getBlock(id)?.text ?? null, ids.block), TEXT);

/* ==========================================================================
 * §6b · Strg+Z gehört der Fläche — und nicht dem eingebetteten Whiteboard
 *       (E722). Und umgekehrt.
 * --------------------------------------------------------------------------
 * Gemessen am 6. Oktober gegen 1bfaca53: EIN Strg+Z im Whiteboard, das im
 * Seitenkasten liegt, nahm dort zurück UND auf der Fläche — die Fläche horchte
 * eine Ebene höher und fragte nicht, ob die Taste schon genommen war (die
 * Regel aus E682 stand in der Schale, nicht in der Fläche).
 * ======================================================================== */
console.log('\n6b · Strg+Z im eingebetteten Whiteboard');
const zwei = await pg.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Mit Skizze', seitenAnsicht: 'flaeche' });
  const w = Store.addBlock(s.id, 'whiteboard', { text: 'Skizze', hoehe: 260 });
  await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 900));
  return { seite: s.id, wb: w.id };
});
const zahl6 = (id: string) => pg.evaluate((i: string) =>
  ((Store.getBlock(i) as any)?.shapes ?? []).length as number, id);
const frei6 = await pg.evaluate(() => {
  const f = document.querySelector('.pg-flaeche')!.getBoundingClientRect();
  const frei = (x: number, y: number) => { const el = document.elementFromPoint(x, y);
    return !!el && !!el.closest('.pg-flaeche') && !el.closest('.pg-fl-notiz') && !el.closest('.gfx-tb-sockel'); };
  for (let y = f.top + 30; y < f.bottom - 140; y += 23)
    for (let x = f.left + 30; x < f.right - 110; x += 37)
      if (frei(x, y) && frei(x + 70, y + 50)) return { x: Math.round(x), y: Math.round(y) };
  return null;
});
p('Es gibt eine freie Stelle auf der Fläche (Vorbedingung)', !!frei6);
const zug6 = async (x: number, y: number) => {
  await pg.mouse.move(x, y); await pg.mouse.down();
  await pg.mouse.move(x + 60, y + 40, { steps: 5 }); await pg.mouse.up();
  await pg.waitForTimeout(250);
};
if (frei6) {
  await pg.mouse.click(frei6.x, frei6.y);
  await pg.evaluate(() => document.querySelector<HTMLElement>('.pg-flaeche > .gfx-tb-sockel [data-wz="rechteck"]')?.click());
  await zug6(frei6.x, frei6.y);
}
const wbBox = await pg.evaluate(() => {
  const r = document.querySelector('.pg-flaeche .wb-flaeche')?.getBoundingClientRect();
  return r ? { x: Math.round(r.left + r.width * 0.4), y: Math.round(r.top + r.height * 0.3) } : null;
});
if (wbBox) await zug6(wbBox.x, wbBox.y);
gleich('Fläche und Whiteboard tragen je eine Form (Vorbedingung)',
  [await zahl6(zwei.seite), await zahl6(zwei.wb)], [1, 1]);
await pg.keyboard.press('Control+z');
await pg.waitForTimeout(300);
gleich('Strg+Z im Whiteboard nimmt nur dort zurück — die Fläche behält ihre Form',
  [await zahl6(zwei.seite), await zahl6(zwei.wb)], [1, 0]);
/* Ein zweiter Strich im Whiteboard (Durchsicht E722): ohne ihn war sein
   Verlauf leer, und ein Strg+Z der Fläche, das fälschlich auch beim
   Whiteboard ankäme, hätte dort nichts zurücknehmen können — [0, 0] wäre
   so oder so herausgekommen (§55.2). */
if (wbBox) await zug6(wbBox.x + 20, wbBox.y + 50);
gleich('Das Whiteboard trägt wieder einen rücknehmbaren Strich (Vorbedingung)',
  [await zahl6(zwei.seite), await zahl6(zwei.wb)], [1, 1]);
if (frei6) await pg.mouse.click(frei6.x + 20, frei6.y + 60);
await pg.evaluate(() => document.querySelector<HTMLElement>('.pg-flaeche')?.focus());
await pg.keyboard.press('Control+z');
await pg.waitForTimeout(300);
gleich('Strg+Z auf der Fläche nimmt nur die Fläche zurück — das Whiteboard behält seinen Strich',
  [await zahl6(zwei.seite), await zahl6(zwei.wb)], [0, 1]);
await pg.close();

/* ==========================================================================
 * §9 · Am Telefon (§37)
 * ======================================================================== */
console.log('\n9 · Am Telefon');
const { pg: handy, ids: ids2 } = await bauen(390, 844);
const masse = await handy.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.pg-flaeche :is(.gfx-tb-schnell,.gfx-tb-karte,.gfx-tb-edgeless-zusatz) button')]
    .filter(b => b.offsetParent !== null)
    .map(b => { const r = b.getBoundingClientRect();
      return { id: b.dataset['wz'] ?? b.dataset['a'] ?? '?', w: Math.round(r.width), h: Math.round(r.height) }; }));
p('Die Fläche hat Werkzeuge am Telefon', masse.length >= 6, String(masse.length));
p('Und jedes misst 44 px (§37)', masse.every(m => m.w >= 44 && m.h >= 44),
  masse.filter(m => m.w < 44 || m.h < 44).map(m => `${m.id} ${m.w}×${m.h}`).join(' · '));
const handyDock = handy.locator('.pg-flaeche .gfx-tb-edgeless');
const handyStift = handyDock.getByRole('button', { name: 'Stift', exact: true });
const zusatzBox = await handyDock.locator('.gfx-tb-edgeless-zusatz').boundingBox();
const verlaufBox = await handyDock.locator('.gfx-tb-neben').boundingBox();
p('Der Blitz verdeckt auf schmaler Fläche keine Verlaufswerkzeuge',
  !!zusatzBox && !!verlaufBox && zusatzBox.x + zusatzBox.width <= verlaufBox.x);
if (!await handyStift.isVisible()) {
  await handyDock.getByRole('button', { name: 'Weitere Werkzeuge', exact: true }).click();
}
await handyStift.click();
await handy.waitForTimeout(200);
const k2 = await handy.evaluate(() => {
  const f = document.querySelector('.pg-flaeche')!.getBoundingClientRect();
  return { x: Math.round(f.left + 40), y: Math.round(f.top + 120) };
});
await handy.touchscreen.tap(k2.x, k2.y);
await handy.waitForTimeout(150);
await handy.evaluate(([x, y]: number[]) => {
  const f = document.querySelector('.pg-flaeche') as HTMLElement;
  const schick = (art: string, px: number, py: number) => f.dispatchEvent(
    new PointerEvent(art, { bubbles: true, cancelable: true, pointerId: 7,
                            pointerType: 'touch', clientX: px, clientY: py, isPrimary: true }));
  schick('pointerdown', x as number, y as number);
  for (let i = 1; i <= 6; i++) schick('pointermove', (x as number) + i * 12, (y as number) + i * 8);
  schick('pointerup', (x as number) + 72, (y as number) + 48);
}, [k2.x, k2.y]);
await handy.waitForTimeout(400);
p('Der Finger zeichnet',
  await handy.evaluate(() => document.querySelectorAll('.pg-fl-tinte [data-sid]').length > 0));

/* ==========================================================================
 * §11 · Keine leere Liste stehen lassen
 * --------------------------------------------------------------------------
 * `shapes: []` in einer Sicherung behauptet, hier sei einmal etwas gewesen,
 * und `raumVersion` ohne Formen deutet einen Raum, den niemand benutzt. Wer
 * die letzte Form wegradiert, hat KEINE Zeichnung — nicht eine leere (§9,
 * doku/REDION-FORMAT.md). Dieselbe Regel wie bei `flaecheOrt` (E691).
 * ======================================================================== */
console.log('\n11 · Die letzte Form weg');
await handy.evaluate(() => {
  document.querySelector<HTMLElement>('.pg-flaeche .gfx-tb-sockel [data-wz="radierer"]')?.click();
});
await handy.waitForTimeout(200);
/* Die Stelle wird GEMESSEN, nicht angenommen — dieselbe Lehre wie in §5. */
const strichBox = await handy.evaluate(() => {
  const el = document.querySelector('.pg-fl-tinte [data-sid]');
  const r = el?.getBoundingClientRect();
  return r ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null;
});
p('Der Strich ist am Telefon zu finden', !!strichBox, JSON.stringify(strichBox));
if (strichBox) {
  await handy.evaluate(([x, y]: number[]) => {
    const f = document.querySelector('.pg-flaeche') as HTMLElement;
    const schick = (art: string, px: number, py: number) => f.dispatchEvent(
      new PointerEvent(art, { bubbles: true, cancelable: true, pointerId: 8,
                              pointerType: 'touch', clientX: px, clientY: py, isPrimary: true }));
    schick('pointerdown', x as number, y as number);
    schick('pointermove', (x as number) + 5, (y as number) + 5);
    schick('pointerup', (x as number) + 5, (y as number) + 5);
  }, [strichBox.x, strichBox.y]);
  await handy.waitForTimeout(400);
}
const leerDanach = await handy.evaluate((id: string) => {
  const b = Store.getBlock(id) as any;
  return { hatShapes: 'shapes' in (b ?? {}), hatRaum: 'raumVersion' in (b ?? {}) };
}, ids2.seite);
p('Kein leeres `shapes` bleibt stehen', leerDanach.hatShapes === false,
  JSON.stringify(leerDanach));
p('Und keine `raumVersion` ohne Formen', leerDanach.hatRaum === false,
  JSON.stringify(leerDanach));

/* ==========================================================================
 * §12 · Auswahl, Haftnotiz und gekoppelte Pfeile
 * ======================================================================== */
console.log('\n12 · Formen auswählen, verbinden und bearbeiten');
const { pg: plan } = await bauen(1280, 900);
const planId = await plan.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Zwei verbundene Formen', seitenAnsicht: 'flaeche', raumVersion: 1, shapes: [
    { id: 'links', art: 'rechteck', x: 120, y: 300, w: 100, h: 70, farbe: '#529cca' },
    { id: 'rechts', art: 'rechteck', x: 490, y: 360, w: 105, h: 75, farbe: '#e03e3e' }
  ] });
  Store.addBlock(s.id, 'text', { text: 'Seiteninhalt bleibt neben der Zeichnung erhalten.' });
  await Store.flush();
  App.zeichneBaum(); App.oeffne(s.id);
  return s.id;
});
const planFlaeche = plan.locator('.pg-flaeche');
await planFlaeche.locator('[data-sid="links"]').waitFor();
const planDaten = () => plan.evaluate((id: string) => Store.getBlock(id)?.shapes, planId);
const mittelpunkt = async (id: string) => {
  const r = await planFlaeche.locator(`[data-sid="${id}"]`).boundingBox();
  if (!r) throw Error('Form ohne sichtbaren Rahmen: ' + id);
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
};
const waehleWerkzeug = async (id: string) => {
  if (id === 'zeiger') await planFlaeche.getByRole('button', { name: 'Zeiger und Hand', exact: true }).press('Enter');
  await planFlaeche.locator(`[data-wz="${id}"]`).click();
};
await waehleWerkzeug('verbindung');
const ln = await mittelpunkt('links'), re = await mittelpunkt('rechts');
await plan.mouse.click(ln.x, ln.y);
await plan.mouse.click(re.x, re.y);
let stand = await planDaten() ?? [];
const link = stand.find((s: any) => s.art === 'verbindung');
p('Zwei Klicks speichern eine Verbindung mit den vorhandenen Form-IDs', link?.von === 'links' && link?.nach === 'rechts');
const wegPfeil = () => planFlaeche.locator(`path[data-sid="${link?.id}"]`).getAttribute('d');
const vorherPfeil = link ? await wegPfeil() : null;

await waehleWerkzeug('zeiger');
await plan.mouse.click(ln.x, ln.y);
await plan.keyboard.down('Shift');
await plan.mouse.click(re.x, re.y);
await plan.keyboard.up('Shift');
gleich('Umschalt-Klick zeichnet zwei Auswahlrahmen', await planFlaeche.locator('.pg-fl-formauswahl rect').count(), 2);
await plan.mouse.move(ln.x, ln.y);
await plan.mouse.down();
await plan.mouse.move(ln.x + 36, ln.y + 18, { steps: 6 });
await plan.waitForTimeout(50);
const vorschau = link ? await wegPfeil() : null;
p('Der Pfeil folgt noch vor dem Loslassen', !!vorschau && vorschau !== vorherPfeil);
stand = await planDaten() ?? [];
gleich('Ein laufender Zug bleibt aus der Speicherung', stand.slice(0, 2).map((s: any) => s.x), [120, 490]);
await plan.mouse.up();
stand = await planDaten() ?? [];
gleich('Beim Loslassen wandern beide Formen um denselben Versatz', stand.slice(0, 2).map((s: any) => [s.x, s.y]),
  [[156, 318], [526, 378]]);
await planFlaeche.focus();
await plan.keyboard.press('Control+z');
stand = await planDaten() ?? [];
gleich('Ein Rückgängig setzt beide Formen zurück', stand.slice(0, 2).map((s: any) => s.x), [120, 490]);
await plan.keyboard.press('Control+Shift+z');
stand = await planDaten() ?? [];
gleich('Ein Wiederholen verschiebt wieder beide Formen', stand.slice(0, 2).map((s: any) => s.x), [156, 526]);

const bewegtLinks = await mittelpunkt('links');
await plan.mouse.move(bewegtLinks.x, bewegtLinks.y);
await plan.mouse.down();
await plan.mouse.move(bewegtLinks.x + 52, bewegtLinks.y - 14, { steps: 4 });
await plan.keyboard.press('Escape');
await plan.mouse.up();
stand = await planDaten() ?? [];
gleich('Escape verwirft die Vorschau ohne Positionsänderung', stand.slice(0, 2).map((s: any) => s.x), [156, 526]);

const beschriftetLinks = await mittelpunkt('links');
await plan.mouse.click(beschriftetLinks.x, beschriftetLinks.y);
await plan.keyboard.press('ArrowRight');
stand = await planDaten() ?? [];
gleich('Die Pfeiltaste verschiebt nur die ausgewählte Form', stand.slice(0, 2).map((s: any) => s.x), [157, 526]);
await plan.keyboard.press('Control+z');
await planFlaeche.locator('[data-a="beschriften"]').click();
const etikett = plan.getByRole('textbox').filter({ visible: true }).last();
await etikett.fill('Quelle');
await etikett.press('Enter');
await plan.waitForFunction((id: string) => Store.getBlock(id)?.shapes?.some((s: any) => s.id === 'links' && s.text === 'Quelle'), planId);
p('Das Beschriften ändert den vorhandenen Rechteckblock', await planFlaeche.getByText('Quelle', { exact: true }).count() === 1);

await waehleWerkzeug('notiz');
const brett = await planFlaeche.boundingBox();
if (!brett) throw Error('Keine sichtbare Fläche');
await plan.mouse.click(brett.x + 175, brett.y + 470);
const eingabe = plan.getByRole('textbox').filter({ visible: true }).last();
await eingabe.fill('Recherche und Rückfragen');
await eingabe.press('Enter');
await plan.waitForFunction((id: string) => Store.getBlock(id)?.shapes?.some((s: any) => s.text === 'Recherche und Rückfragen'), planId);
stand = await planDaten() ?? [];
p('Eine Haftnotiz liegt mit ihrer Beschriftung in derselben Liste', stand.some((s: any) =>
  s.art === 'notiz' && s.text === 'Recherche und Rückfragen'));

await plan.evaluate(() => Store.flush());
await plan.reload();
await plan.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
await plan.evaluate((id: string) => App.oeffne(id), planId);
await planFlaeche.locator('[data-sid="links"]').waitFor();
stand = await planDaten() ?? [];
p('Verbindung und Haftnotiz überleben das Neuöffnen', stand.some((s: any) =>
  s.art === 'verbindung' && s.von === 'links' && s.nach === 'rechts') &&
  stand.some((s: any) => s.art === 'notiz' && s.text === 'Recherche und Rückfragen'));
const mobilId = await handy.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Form auf dem Telefon', seitenAnsicht: 'flaeche', raumVersion: 1, shapes: [
    { id: 'touchform', art: 'rechteck', x: 60, y: 320, w: 100, h: 72, farbe: '#529cca' }
  ] });
  await Store.flush();
  App.zeichneBaum(); App.oeffne(s.id);
  return s.id;
});
await handy.waitForFunction(() => document.getElementById('ru-vorhang')?.hidden === true);
const mobilForm = handy.locator('.pg-flaeche [data-sid="touchform"]');
const mobilBox = await mobilForm.boundingBox();
if (!mobilBox) throw Error('Keine Form für die Touch-Prüfung');
const mobilZoom = await handy.locator('.pg-fl-sicht').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a);
const touch = await handy.context().newCDPSession(handy);
const mx = mobilBox.x + mobilBox.width / 2, my = mobilBox.y + mobilBox.height / 2;
await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{x: mx, y: my}] });
await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{x: mx + 24, y: my + 12}] });
await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await touch.detach();
const mobilDanach = await handy.evaluate((id: string) => Store.getBlock(id)?.shapes?.[0], mobilId);
p('Die Form folgt dem Touch-Zug auf dem 390-Pixel-Bildschirm', !!mobilDanach &&
  Math.abs((mobilDanach.x - 60) * mobilZoom - 24) <= 1 && Math.abs((mobilDanach.y - 320) * mobilZoom - 12) <= 1,
  JSON.stringify({ mobilZoom, mobilDanach }));
const bildordner = process.env.REDION_FLAECHE_BILDER;
if (bildordner) {
  await plan.waitForFunction(() => document.getElementById('ru-vorhang')?.hidden === true);
  fs.mkdirSync(bildordner, { recursive: true });
  await plan.screenshot({ path: path.join(bildordner, 'flaeche-windows.png') });
  await handy.screenshot({ path: path.join(bildordner, 'flaeche-mobil.png') });
}

console.log('\n13 · Grössenänderung von Formen und Verbindungen');
const linksJetzt = await mittelpunkt('links');
await plan.mouse.click(linksJetzt.x, linksJetzt.y);
const groessenStart = JSON.stringify(await planDaten());
gleich('Eine gewählte Form hat vier Eckgriffe', await planFlaeche.locator('[data-skaliergriff]').count(), 4);
const griffOrt = () => planFlaeche.locator('[data-skaliergriff]').evaluateAll(griffe => {
  for (const griff of griffe) {
    const r = griff.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const ziel = document.elementFromPoint(x, y);
    if (ziel && griff.contains(ziel)) {
      const ecke = griff.getAttribute('data-skaliergriff') ?? '';
      return { x, y, sx: ecke.endsWith('rechts') ? 1 : -1, sy: ecke.startsWith('unten') ? 1 : -1 };
    }
  }
  throw Error('Kein Eckgriff liegt frei auf der Fläche');
});
const pfeilVorGroesse = await wegPfeil();
const g1 = await griffOrt();
await plan.mouse.move(g1.x, g1.y);
await plan.mouse.down();
await plan.mouse.move(g1.x + 34 * g1.sx, g1.y + 24 * g1.sy, { steps: 7 });
await plan.waitForFunction(() => document.querySelector('.pg-fl-formauswahl')?.getAttribute('transform')?.includes('scale('));
p('Beim Skalieren folgen verbundene Pfeile der Vorschau', (await wegPfeil()) !== pfeilVorGroesse);
gleich('Die Grössenvorschau bleibt bis zum Loslassen ausserhalb der Speicherung', JSON.stringify(await planDaten()), groessenStart);
await plan.mouse.up();
const standNeu = await planDaten() ?? [];
const alt = JSON.parse(groessenStart).find((f: any) => f.id === 'links');
const neu = standNeu.find((f: any) => f.id === 'links');
p('Gespeicherte Form wächst am Griff und die gegenüberliegende Ecke bleibt fest',
  neu?.w > alt.w && neu?.h > alt.h &&
  Math.abs((g1.sx < 0 ? neu.x + neu.w : neu.x) - (g1.sx < 0 ? alt.x + alt.w : alt.x)) < 0.02 &&
  Math.abs((g1.sy < 0 ? neu.y + neu.h : neu.y) - (g1.sy < 0 ? alt.y + alt.h : alt.y)) < 0.02);
await plan.keyboard.press('Control+z');
gleich('Rückgängig stellt Form und Verbindung in einem Schritt wieder her', JSON.stringify(await planDaten()), groessenStart);

const g2 = await griffOrt();
await plan.mouse.move(g2.x, g2.y);
await plan.mouse.down();
await plan.mouse.move(g2.x + 42 * g2.sx, g2.y + 17 * g2.sy, { steps: 5 });
await plan.keyboard.press('Escape');
await plan.mouse.up();
gleich('Escape verwirft die laufende Grössenänderung', JSON.stringify(await planDaten()), groessenStart);
gleich('Escape setzt den verbundenen Pfeil zurück', await wegPfeil(), pfeilVorGroesse);

const g3 = await griffOrt();
await plan.keyboard.down('Shift');
await plan.mouse.move(g3.x,g3.y);
await plan.mouse.down();
await plan.mouse.move(g3.x+44*g3.sx,g3.y+12*g3.sy,{steps:5});
await plan.mouse.up();
await plan.keyboard.up('Shift');
const proportional = (await planDaten())?.find((f: any) => f.id === 'links');
p('Umschalt hält das Seitenverhältnis beim Ziehen', proportional?.w > alt.w &&
  Math.abs(proportional.w / proportional.h - alt.w / alt.h) < .005);
await plan.keyboard.press('Control+z');

await planFlaeche.getByRole('button',{name:'Grösse ändern',exact:true}).press('Enter');
await plan.locator('#fq').fill('128 × 96');
await plan.locator('#fq').press('Enter');
const genau = (await planDaten())?.find((f: any) => f.id === 'links');
gleich('Tastaturbefehl setzt Breite und Höhe genau', [genau?.w, genau?.h], [128, 96]);
await planFlaeche.focus();
await plan.keyboard.press('Control+z');
gleich('Nach Rückgängig sind auch die eingegebenen Masse wiederhergestellt', JSON.stringify(await planDaten()), groessenStart);
await plan.keyboard.press('Delete');
stand = await planDaten() ?? [];
p('Beim Löschen einer Form verschwindet ihre Verbindung mit', !stand.some((s: any) => s.id === 'links' || s.art === 'verbindung'));
console.log('\n14 · Werkzeuggalerie und Elektro');
const kartenAufDerFlaeche = () => planFlaeche.locator('[data-karte]:visible').evaluateAll(karten =>
  karten.map(karte => (karte as HTMLElement).dataset.karte).join(','));
const zeiger = planFlaeche.getByRole('button', { name: 'Zeiger und Hand', exact: true });
const zeigerVor = await zeiger.boundingBox();
gleich('Die ersten drei Edgeless-Vorschauen', await kartenAufDerFlaeche(), 'notiz,stifte,formen');
await planFlaeche.getByRole('button', { name: 'Weitere Werkzeuge', exact: true }).click();
gleich('Die letzte Kartengruppe enthält Formen, Gedankenkarte und Vorlagen',
  await kartenAufDerFlaeche(), 'formen,diagramme,vorlagen');
gleich('Die Schnellwerkzeuge bleiben am selben Platz', (await zeiger.boundingBox())?.x, zeigerVor?.x);
await zeiger.click();
gleich('Der Zeiger wechselt mit einem Klick zur Hand', await planFlaeche.getAttribute('data-wz'), 'hand');
await zeiger.click();
gleich('Der nächste Klick wechselt zurück zur Auswahl', await planFlaeche.getAttribute('data-wz'), 'zeiger');
await zeiger.press('Enter');
p('Enter öffnet die beschrifteten Zeigermodi',
  await planFlaeche.getByRole('button', { name: 'Hand', exact: true }).isVisible());
await plan.keyboard.press('Escape');
const rahmen = planFlaeche.getByRole('button', { name: 'Rahmen', exact: true });
await rahmen.click();
await planFlaeche.getByRole('button', { name: 'Rechteckrahmen zeichnen', exact: true }).click();
gleich('Das Rahmenmenü aktiviert den Rechteckrahmen', await planFlaeche.getAttribute('data-wz'), 'rechteck');
const linkKnopf = planFlaeche.getByRole('button', { name: 'Link', exact: true });
await linkKnopf.click();
await planFlaeche.getByRole('button', { name: 'Weblink einfügen', exact: true }).click();
await plan.locator('#fq').fill('https://example.com/elektro');
await plan.locator('#fq').press('Enter');
await plan.waitForFunction((id: string) =>
  Store.childrenOf(id).some((b: any) => b.type === 'bookmark' && !!b.flaecheOrt), planId);
p('Ein Weblink liegt als Lesezeichen auf der Fläche', await plan.evaluate((id: string) =>
  Store.childrenOf(id).some((b: any) => b.type === 'bookmark' && b.src === 'https://example.com/elektro' && !!b.flaecheOrt), planId));
const formenKnopf = planFlaeche.getByRole('button', { name: 'Formen', exact: true });
await formenKnopf.click();
const formenMenue = planFlaeche.locator('.gfx-tb-menue');
p('Formen öffnet eine Palette über der Werkzeugleiste', await formenMenue.isVisible() &&
  await formenMenue.getByRole('button', { name: 'Ellipse', exact: true }).count() === 1 &&
  await formenMenue.locator('[data-c]').count() >= 8);
await formenMenue.getByRole('button', { name: 'Ellipse', exact: true }).click();
gleich('Die Palette stellt das echte Ellipsenwerkzeug ein', await planFlaeche.getAttribute('data-wz'), 'ellipse');
console.log('\n15 · Werkzeugvorschauen auf die Fläche ziehen');
const ablage = await planFlaeche.evaluate(el => {
  const r = el.getBoundingClientRect();
  for (const fx of [.76, .86, .65]) {
    for (const fy of [.30, .42, .55]) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy;
      const hit = document.elementFromPoint(x, y);
      if (hit && el.contains(hit) && !hit.closest('.pg-fl-notiz,.gfx-tb-sockel')) return { x, y };
    }
  }
  throw Error('Kein freier Ablagepunkt für das Werkzeug');
});
const dreieckVorschau = planFlaeche.locator('[data-karte="formen"] [data-vorschau="triangle"]');
const griffpunkt = async () => {
  await dreieckVorschau.hover();
  return dreieckVorschau.evaluate(el => {
    const r = el.getBoundingClientRect();
    for (let y = r.top + 3; y < r.bottom - 2; y += 4) {
      for (let x = r.left + 3; x < r.right - 2; x += 5) {
        if (document.elementFromPoint(x, y) === el) return { x, y };
      }
    }
    throw Error('Der Griff des Dreiecks ist verdeckt');
  });
};
const vorAblage = (await planDaten())?.length || 0;
const griff = await griffpunkt();
await plan.mouse.move(griff.x, griff.y);
await plan.mouse.down();
await plan.mouse.move(ablage.x, ablage.y, { steps: 8 });
p('Gezogenes Dreieck zeigt eine Vorschau und speichert vor dem Loslassen nichts',
  await planFlaeche.locator('.pg-fl-dock-vorschau polygon, polygon.pg-fl-dock-vorschau').count() === 1 &&
  (await planDaten())?.length === vorAblage);
await plan.mouse.up();
const abgelegtDreieck = [...((await planDaten()) || [])].reverse().find((f: any) => f.art === 'dreieck');
p('Am Ablagepunkt liegt ein echtes, ausgewähltes Dreieck', !!abgelegtDreieck &&
  await planFlaeche.locator('polygon[data-sid="' + abgelegtDreieck.id + '"]').count() === 1 &&
  await planFlaeche.locator('.pg-fl-formauswahl rect').count() === 1);
await plan.keyboard.press('Control+z');
gleich('Eine Rückgängig-Aktion entfernt die Ablage', (await planDaten())?.length, vorAblage);
const zweiterGriff = await griffpunkt();
await plan.mouse.move(zweiterGriff.x, zweiterGriff.y);
await plan.mouse.down();
await plan.mouse.move(ablage.x, ablage.y, { steps: 5 });
await plan.keyboard.press('Escape');
await plan.mouse.up();
p('Escape verwirft den Zug samt Vorschau', (await planDaten())?.length === vorAblage &&
  await planFlaeche.locator('.pg-fl-dock-vorschau').count() === 0);

const haftkarte = planFlaeche.getByRole('button', { name: 'Haftnotiz', exact: true });
if (!await haftkarte.isVisible()) await planFlaeche.getByRole('button', { name: 'Vorherige Werkzeuge', exact: true }).click();
const notizAblage = await planFlaeche.evaluate((el, ort) => {
  for (const dy of [120, -120, 80, -80]) {
    const punkt = { x: ort.x, y: ort.y + dy };
    const ziel = document.elementFromPoint(punkt.x, punkt.y);
    if (ziel && el.contains(ziel) && !ziel.closest('.pg-fl-notiz,.gfx-tb-sockel')) return punkt;
  }
  throw Error('Kein freier zweiter Ablagepunkt');
}, ablage);
const haftbox = await haftkarte.boundingBox();
if (!haftbox) throw Error('Keine Haftnotizkarte sichtbar');
await plan.mouse.move(haftbox.x + haftbox.width / 2, haftbox.y + haftbox.height / 2);
await plan.mouse.down();
await plan.mouse.move(notizAblage.x, notizAblage.y, { steps: 8 });
await plan.mouse.up();
await plan.locator('#fq').fill('Notiz aus dem Dock');
await plan.locator('#fq').press('Enter');
p('Die abgelegte Haftnotiz ist beschriftet und verwendet den vorhandenen Seitenspeicher',
  (await planDaten())?.some((f: any) => f.art === 'notiz' && f.text === 'Notiz aus dem Dock') === true);

const letzterGriff = await griffpunkt();
await plan.mouse.move(letzterGriff.x, letzterGriff.y);
await plan.mouse.down();
await plan.mouse.move(ablage.x, ablage.y, { steps: 8 });
await plan.mouse.up();
const vorRahmen = (await planDaten()) || [];
const ziele = vorRahmen.filter((f: any) => f.art === 'dreieck' || f.text === 'Notiz aus dem Dock');
await zeiger.press('Enter');
await planFlaeche.getByRole('button', { name: 'Rahmenauswahl', exact: true }).click();
gleich('Der Zeigermenü-Befehl aktiviert die Rahmenauswahl', await planFlaeche.getAttribute('data-wz'), 'rahmenwahl');
const boxen = await Promise.all(ziele.map((f: any) => planFlaeche.locator('[data-sid="' + f.id + '"]').first().boundingBox()));
if (boxen.length !== 2 || boxen.some(box => !box)) throw Error('Zwei sichtbare Ziele für die Rahmenauswahl erwartet');
const sichtbar = boxen.filter((box): box is NonNullable<typeof box> => !!box);
const ecken = await planFlaeche.evaluate((el, boxen) => {
  const l = Math.min(...boxen.map(b => b.x)) - 12;
  const o = Math.min(...boxen.map(b => b.y)) - 12;
  const r = Math.max(...boxen.map(b => b.x + b.width)) + 12;
  const u = Math.max(...boxen.map(b => b.y + b.height)) + 12;
  const punkte = [[l, o], [r, o], [l, u], [r, u]];
  const index = punkte.findIndex(([x, y]) => {
    const ziel = document.elementFromPoint(x!, y!);
    return !!ziel && el.contains(ziel) && !ziel.closest('.pg-fl-notiz,.gfx-tb-sockel');
  });
  if (index < 0) throw Error('Kein freier Ansatzpunkt um die beiden Formen');
  return { start: punkte[index]!, ende: punkte[3 - index]! };
}, sichtbar);
await plan.mouse.move(ecken.start[0]!, ecken.start[1]!);
await plan.mouse.down();
await plan.mouse.move(ecken.ende[0]!, ecken.ende[1]!, { steps: 6 });
p('Rahmenauswahl zeigt ein temporäres Auswahlrechteck', await planFlaeche.locator('.pg-fl-rahmenwahl').count() === 1);
await plan.mouse.up();
const anzahlRahmen = await planFlaeche.locator('.pg-fl-formauswahl rect').count();
const datenNachRahmen = await planDaten();
const datenUnveraendert = JSON.stringify(datenNachRahmen) === JSON.stringify(vorRahmen);
p('Rahmenauswahl erfasst beide Elemente und ändert ihre gespeicherten Daten nicht',
  anzahlRahmen >= 2 && datenUnveraendert,
  `Ausgewählte Formen: ${anzahlRahmen}, Daten unverändert: ${datenUnveraendert}`);
if (anzahlRahmen < 2) throw Error('Die Rahmenauswahl enthält weniger als zwei Formen.');

const erstMasse = ziele.map((f: any) => ({ id:f.id, w:f.w, h:f.h }));
await planFlaeche.getByRole('button', { name:'Grösse ändern', exact:true }).press('Enter');
await plan.locator('#fq').fill('260 × 290');
await plan.locator('#fq').press('Enter');
const groesserStand = await planDaten() || [];
const skaliert = erstMasse.map((alt: { id: string; w: number; h: number }) =>
  ({ alt, neu: groesserStand.find((s: any) => s.id === alt.id) }));
const erster = skaliert[0], zweiter = skaliert[1];
p('Eine gemeinsame Grössenänderung skaliert beide Formen gleichmässig und behält ihre IDs',
  !!erster?.neu && !!zweiter?.neu &&
  Math.abs(erster.neu.w / erster.alt.w - zweiter.neu.w / zweiter.alt.w) < 0.002 &&
  Math.abs(erster.neu.h / erster.alt.h - zweiter.neu.h / zweiter.alt.h) < 0.002);


const blitz = planFlaeche.getByRole('button', { name: 'Elektro', exact: true });
await blitz.click();
const elMenue = planFlaeche.locator('.gfx-tb-menue');
const elektroNamen = await elMenue.getByRole('button').allTextContents();
p('Der Blitz enthält die vorhandenen Elektro-Wege', ['Rechner','Formelheft','Formeldreieck','Sinuskurve',
  'Üben','Prüfung','Arbeitsplatz','Schaltplan und Simulation'].every(name => elektroNamen.includes(name)), elektroNamen.join(', '));
const bilder = process.env.REDION_FLAECHE_BILDER;
if (bilder) await plan.screenshot({ path: path.join(bilder, 'flaeche-elektro.png') });
await elMenue.getByRole('button', { name: 'Schaltplan und Simulation', exact: true }).click();
p('Elektro legt einen Schaltplan auf der geöffneten Fläche an', await plan.evaluate((id: string) =>
  Store.childrenOf(id).some((b: any) => b.type === 'schaltplan' && !!b.flaecheOrt), planId));
await plan.close();

await handy.close();

await browser.close();
server.close();
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
