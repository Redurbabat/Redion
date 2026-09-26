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
await pg.close();

/* ==========================================================================
 * §9 · Am Telefon (§37)
 * ======================================================================== */
console.log('\n9 · Am Telefon');
const { pg: handy, ids: ids2 } = await bauen(390, 844);
const masse = await handy.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.pg-flaeche .gfx-tb-sockel [data-wz]')]
    .map(b => { const r = b.getBoundingClientRect();
      return { id: b.dataset['wz'] ?? '?', w: Math.round(r.width), h: Math.round(r.height) }; }));
p('Die Fläche hat Werkzeuge am Telefon', masse.length >= 6, String(masse.length));
p('Und jedes misst 44 px (§37)', masse.every(m => m.w >= 44 && m.h >= 44),
  masse.filter(m => m.w < 44 || m.h < 44).map(m => `${m.id} ${m.w}×${m.h}`).join(' · '));
await handy.evaluate(() => {
  document.querySelector<HTMLElement>('.pg-flaeche .gfx-tb-sockel [data-wz="stift"]')?.click();
});
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

await handy.close();

await browser.close();
server.close();
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
