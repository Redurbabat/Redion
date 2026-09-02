/* Suite 349 — Bild aufs Blatt: ein Foto als Marke, verschieb- und skalierbar (E357)
 * ============================================================================
 * L115 Punkt 6: ein Foto aufs Blatt legen ging nur als Bildblock NEBEN dem
 * Blatt. GoodNotes legt es aufs Papier — und man schiebt und zieht es wie
 * jeden Strich. Jetzt ist ein Bild eine Marke der Art `bild`, die Datei
 * liegt in der Ablage (Stücke, kein Data-URL), das Blatt ist ihr Block.
 *
 *   1 · DAS WERKZEUG „Bild" öffnet den Dateiwähler; das Bild landet mittig,
 *       halb so breit wie das Blatt, im Seitenverhältnis der Datei.
 *   2 · DANACH ist es gewählt, und das Werkzeug ist die Auswahl.
 *   3 · GERENDERT wird ein <image> mit der Adresse aus der Ablage; die Datei
 *       gehört zum Blatt.
 *   4 · BEWEGEN UND SKALIEREN wie jede Marke (E353).
 *   5 · KOPIEREN teilt die Datei, LÖSCHEN der Kopie lässt das Original.
 *   6 · FEHLT DIE DATEI, steht ein Platzhalter — kein leerer Fleck, kein Fehler.
 *   7 · DER DRUCKWEG zeichnet das Bild mit der gemerkten Adresse.
 *   8 · AM TELEFON ist der Knopf ein Fingerknopf.
 *   9 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test349.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Marken: any; declare const Dateien: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9353;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/** Ein echtes PNG, 40 × 30, einfarbig — geschrieben mit zlib, ohne Bibliothek. */
const png = (w: number, h: number, rgb: [number, number, number]): Buffer => {
  const crcTab = Array.from({ length: 256 }, (_v, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf: Buffer): number => { let c = 0xffffffff; for (const b of buf) c = crcTab[(c ^ b) & 0xff]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (typ: string, daten: Buffer): Buffer => {
    const len = Buffer.alloc(4); len.writeUInt32BE(daten.length);
    const kopf = Buffer.concat([Buffer.from(typ, 'ascii'), daten]);
    const summe = Buffer.alloc(4); summe.writeUInt32BE(crc(kopf));
    return Buffer.concat([len, kopf, summe]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const zeilen: Buffer[] = [];
  for (let y = 0; y < h; y++) { const z = Buffer.alloc(1 + w * 3); for (let x = 0; x < w; x++) { z[1 + x * 3] = rgb[0]; z[2 + x * 3] = rgb[1]; z[3 + x * 3] = rgb[2]; } zeilen.push(z); }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(zeilen))), chunk('IEND', Buffer.alloc(0))]);
};
fs.mkdirSync(path.join(WURZEL, 'bilder'), { recursive: true });
const BILD = path.join(WURZEL, 'bilder', 'test349-foto.png');
fs.writeFileSync(BILD, png(40, 30, [200, 60, 40]));

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
    const s = Store.addPage(null, { text: 'Bildprobe', icon: '🖼' });
    const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'blanko' });
    Store.addBlock(b.id, 'text', { text: '' });
    await Store.flush();
    App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    return b.id as string;
  });
  return { ktx, pg, blattId };
};

const marken = (pg: Seite, blattId: string) => pg.evaluate((id: string) =>
  (((Store.getBlock(id) || {}).marken || []) as any[]).map(m => ({
    id: String(m.id), art: String(m.art), dateiId: m.dateiId ?? null,
    pts: Array.isArray(m.pts) ? m.pts.map((q: number[]) => q.map((v: number) => Math.round(v * 10) / 10)) : []
  })), blattId);
const bildKnoten = (pg: Seite) => pg.evaluate(() => {
  const g = document.querySelector<SVGGElement>('.blatt-marken g[data-ink-art="bild"]');
  const img = g?.querySelector('image');
  return g ? { sid: g.getAttribute('data-sid'), href: img?.getAttribute('href') ?? null,
    w: Number(img?.getAttribute('width')), h: Number(img?.getAttribute('height')),
    fehlt: !!g.querySelector('.blatt-bild-fehlt') } : null;
});
const blattMass = (pg: Seite) => pg.evaluate(() => {
  const s = document.querySelector<SVGSVGElement>('.blatt-marken')!;
  return { w: s.viewBox.baseVal.width, h: s.viewBox.baseVal.height };
});
const auswahl = (pg: Seite) => pg.evaluate(() => ({
  rahmen: document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen').length,
  tool: document.querySelector('.blatt-marken')?.getAttribute('data-tool') ?? null
}));
const einfuegen = async (pg: Seite): Promise<void> => {
  const [chooser] = await Promise.all([
    pg.waitForEvent('filechooser', { timeout: 8000 }),
    pg.click('.blatt-werk [data-wz="bild"]')
  ]);
  await chooser.setFiles(BILD);
  await pg.waitForTimeout(1200);
};
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
const taste = (pg: Seite, key: string, strg = false) => pg.evaluate(([key, strg]: [string, boolean]) => {
  document.querySelector<SVGSVGElement>('.blatt-marken')!.dispatchEvent(new KeyboardEvent('keydown', { key, ctrlKey: strg, bubbles: true, cancelable: true }));
}, [key, strg] as [string, boolean]);

/* ======================================================================== */
console.log('\n1 · Das Werkzeug „Bild" öffnet den Dateiwähler; das Bild landet mittig im Seitenverhältnis');
const { ktx, pg, blattId } = await kontext(false);
p('Die Leiste hat das Werkzeug „Bild"', await pg.$('.blatt-werk [data-wz="bild"]') !== null);
await einfuegen(pg);
let m = await marken(pg, blattId);
gleich('Eine Marke der Art bild', m.map(x => x.art), ['bild']);
p('… mit einer Dateikennung', !!m[0]?.dateiId && String(m[0].dateiId).length >= 6, JSON.stringify(m[0]?.dateiId));
const mass = await blattMass(pg);
const b0 = m[0]!.pts;
const bw = b0[1]![0]! - b0[0]![0]!, bh = b0[1]![1]! - b0[0]![1]!;
p('Halb so breit wie das Blatt', Math.abs(bw - mass.w / 2) < 2, `${bw} von ${mass.w}`);
p('Im Seitenverhältnis 4:3 der Datei', Math.abs(bw / bh - 4 / 3) < 0.03, `${bw} × ${bh}`);
p('Mittig auf dem Blatt', Math.abs((b0[0]![0]! + b0[1]![0]!) / 2 - mass.w / 2) < 2 && Math.abs((b0[0]![1]! + b0[1]![1]!) / 2 - mass.h / 2) < 2, JSON.stringify(b0));

/* ======================================================================== */
console.log('\n2 · Danach ist es gewählt, und das Werkzeug ist die Auswahl');
gleich('Ein Rahmen, Werkzeug Auswahl', await auswahl(pg), { rahmen: 1, tool: 'select' });
gleich('Auch die Leiste sagt Auswahl', await pg.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-wz].on')?.dataset.wz), 'select');

/* ======================================================================== */
console.log('\n3 · Gerendert wird ein <image> mit der Adresse aus der Ablage; die Datei gehört zum Blatt');
const k = await bildKnoten(pg);
p('Ein <g data-ink-art="bild"> mit <image href="blob:…">', !!k && k.sid === m[0]!.id && typeof k.href === 'string' && k.href.startsWith('blob:'), JSON.stringify(k));
p('… so gross wie die Marke', !!k && Math.abs(k.w - bw) < 0.5 && Math.abs(k.h - bh) < 0.5, JSON.stringify(k));
gleich('Die Datei ist über die Ablage erreichbar', await pg.evaluate(async (id: string) => typeof (await Dateien.adresse(id)) === 'string', m[0]!.dateiId), true);
gleich('… und gehört zum Blatt (blockId)', await pg.evaluate(async ([dateiId, blatt]: [string, string]) => {
  const satz = await Store.dateiHolen(dateiId);
  return satz ? satz.blockId === blatt : 'kein Satz';
}, [m[0]!.dateiId, blattId] as [string, string]), true);

/* ======================================================================== */
console.log('\n4 · Bewegen und Skalieren wie jede Marke');
const mitte: [number, number] = [(b0[0]![0]! + b0[1]![0]!) / 2, (b0[0]![1]! + b0[1]![1]!) / 2];
await zug(pg, [mitte, [mitte[0] + 30, mitte[1] + 20], [mitte[0] + 60, mitte[1] + 40]], 'g[data-ink-art="bild"]');
m = await marken(pg, blattId);
gleich('Um 60 und 40 verschoben', [Math.round(m[0]!.pts[0]![0]! - b0[0]![0]!), Math.round(m[0]!.pts[0]![1]! - b0[0]![1]!)], [60, 40]);
const kasten = await pg.evaluate(() => { const k = document.querySelector('.blatt-marken .blatt-auswahlkasten')!;
  return { x: Number(k.getAttribute('x')), y: Number(k.getAttribute('y')), w: Number(k.getAttribute('width')), h: Number(k.getAttribute('height')) }; });
await zug(pg, [[kasten.x + kasten.w, kasten.y + kasten.h], [kasten.x + kasten.w + 50, kasten.y + kasten.h + 30], [kasten.x + kasten.w + 100, kasten.y + kasten.h + 60]], '[data-griff="se"]');
const nachher = (await marken(pg, blattId))[0]!.pts;
p('Der Griff macht das Bild grösser', (nachher[1]![0]! - nachher[0]![0]!) > bw * 1.2, JSON.stringify(nachher));
p('… und hält das Seitenverhältnis (ein Foto verzerrt sich nicht, wie in GoodNotes)',
  Math.abs((nachher[1]![0]! - nachher[0]![0]!) / (nachher[1]![1]! - nachher[0]![1]!) - 4 / 3) < 0.03, JSON.stringify(nachher));
gleich('Das <image> folgt', await pg.evaluate(() => Math.round(Number(document.querySelector('.blatt-marken g[data-ink-art="bild"] image')?.getAttribute('width')))),
  Math.round(nachher[1]![0]! - nachher[0]![0]!));
await pg.click('.blatt-werk [data-act="undo"]');
await pg.click('.blatt-werk [data-act="undo"]');
gleich('Zweimal Zurück: wieder am Platz und in der Grösse', (await marken(pg, blattId))[0]!.pts, b0);
/* Der Radierer gilt der Tinte: ein Tipp aufs Bild und ein Zug darüber lassen es stehen. */
await pg.click('.blatt-werk [data-wz="radierer"]');
await zug(pg, [mitte, [mitte[0] + 20, mitte[1] + 10], [mitte[0] + 40, mitte[1] + 20]], 'g[data-ink-art="bild"]');
gleich('Der Radierer lässt das Bild stehen (wie in GoodNotes: er gilt der Tinte)', (await marken(pg, blattId)).length, 1);
await pg.click('.blatt-werk [data-wz="select"]');
await zug(pg, [mitte], 'g[data-ink-art="bild"]');
gleich('… und ein Tipp mit der Auswahl wählt es wieder', (await auswahl(pg)).rahmen, 1);

/* ======================================================================== */
console.log('\n5 · Kopieren teilt die Datei, Löschen der Kopie lässt das Original');
await taste(pg, 'c', true);
await taste(pg, 'v', true);
m = await marken(pg, blattId);
gleich('Zwei Bildmarken mit derselben Datei', [m.length, m[0]!.dateiId === m[1]!.dateiId, m[0]!.id !== m[1]!.id], [2, true, true]);
gleich('Zwei <image> in der Schicht', await pg.evaluate(() => document.querySelectorAll('.blatt-marken g[data-ink-art="bild"] image').length), 2);
await pg.click('.blatt-werk [data-act="delete"]');
m = await marken(pg, blattId);
gleich('Die Kopie ist weg, das Original da', m.length, 1);
gleich('… und seine Datei auch', await pg.evaluate(async (id: string) => typeof (await Dateien.adresse(id)) === 'string', m[0]!.dateiId), true);

/* ======================================================================== */
console.log('\n6 · Fehlt die Datei, steht ein Platzhalter');
await pg.evaluate(async (id: string) => {
  const b = Store.getBlock(id);
  Store.updateBlock(id, { marken: [...(b.marken || []), { id: 'weg-349', art: 'bild', dateiId: 'gibt-es-nicht-349', pts: [[20, 20], [120, 95]] }] });
  App.zeichneSeite?.();
  await new Promise(f => setTimeout(f, 800));
}, blattId);
const fehlt = await pg.evaluate(() => {
  const g = document.querySelector<SVGGElement>('.blatt-marken g[data-sid="weg-349"]');
  return g ? { platzhalter: !!g.querySelector('.blatt-bild-fehlt'), href: g.querySelector('image')?.getAttribute('href') ?? null } : null;
});
gleich('Ein gestrichelter Platzhalter statt eines leeren Flecks', fehlt?.platzhalter, true);
p('… und kein href, das ins Leere zeigt', !!fehlt && !fehlt.href, JSON.stringify(fehlt));
p('Die Marke bleibt in den Daten (nichts wird stillschweigend gelöscht)', (await marken(pg, blattId)).some(x => x.id === 'weg-349'));

/* ======================================================================== */
console.log('\n7 · Der Druckweg zeichnet das Bild mit der gemerkten Adresse');
const druck = await pg.evaluate((id: string) => {
  const mark = (Store.getBlock(id).marken as any[]).find(x => x.art === 'bild' && x.id !== 'weg-349');
  const node = Marken.zeichneMarke(mark);
  const html = node ? node.outerHTML : '';
  return { hatImage: /<image/.test(html), hatBlob: /href="blob:/.test(html) };
}, blattId);
gleich('zeichneMarke liefert synchron ein <image> mit blob-Adresse', druck, { hatImage: true, hatBlob: true });
p('Der Druckweg geht durch zeichneMarke (werkzeuge.js)', /markenAlsSvg[\s\S]{0,600}Marken\.zeichneMarke/.test(fs.readFileSync(path.join(WURZEL, 'quell/bereiche/wissen/werkzeuge.js'), 'utf-8')));

/* ======================================================================== */
console.log('\n8 · Am Telefon ist der Knopf ein Fingerknopf');
const { ktx: ktxH, pg: pgH } = await kontext(true);
const masse = await pgH.evaluate(() => {
  const k = document.querySelector<HTMLElement>('.blatt-werk [data-wz="bild"]');
  const r = k?.getBoundingClientRect();
  return r ? { w: Math.round(r.width), h: Math.round(r.height) } : null;
});
p('Der Bild-Knopf ist mindestens 44 × 44', !!masse && masse.w >= 44 && masse.h >= 44, JSON.stringify(masse));
await ktxH.close();

/* ======================================================================== */
console.log('\n9 · Keine Seitenfehler');
await ktx.close();
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
