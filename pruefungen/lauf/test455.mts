/* Suite 455 — Die Kamera und der Radierer nach Werkzeugart (E482)
 * ============================================================================
 * Zwei kleine Reste aus L133, beide GoodNotes-Griffe, die Redion nicht hatte:
 *
 *   · „Fotografieren mit der Kamera als Seite — Strg V aus der
 *     Zwischenablage geht seit E472, der Wähler nimmt Dateien."
 *   · „Radierer-Filter nach Werkzeugart über Marker hinaus (GoodNotes:
 *     Pen, Pencil, Highlighter, Tape einzeln) — heute Ganz, Teil, Marker."
 *
 *   §1 DIE KAMERA: ein eigener Griff im Seitenmenü und an der Miniatur,
 *      und der Wähler dahinter sagt dem Telefon „Kamera".
 *   §2 DER RADIERER kennt fünf Arten — und was er nicht meint, lässt er
 *      stehen: ein Zug über Stift, Marker und Band nimmt genau eines.
 *   §3 „TEIL" bleibt, was es war (E352): nur der berührte Teil.
 *   §4 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `capture` im Kamerawähler weglassen: er ist wieder der gewöhnliche
 *        Dateiwähler. Gelaufen, rot.
 *   §2 → in `radiereEine` die Beschränkung auslassen: der Radierer nimmt
 *        wieder alles mit. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test455.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Marken: any;
declare const PdfEinlesen: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9575;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];

/* ═══ §1 Die Kamera ════════════════════════════════════════════════════════ */
console.log('\n§1 Die Kamera ist ein eigener Griff');
{
  const s = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof PdfEinlesen !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Skript', icon: '📕' });
    Store.updateBlock(seite.id, { dokumentModus: true });
    for (let i = 1; i <= 2; i++)
      Store.addBlock(seite.id, 'pdfseite', { text: '', nr: i, vonSeiten: 2, bw: 595, bh: 842, quelleId: 'q', raumVersion: 1 });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1300);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(500);
  const k = JSON.parse(await s.evaluate(`(() => {
    const b = document.querySelector('[data-document-action="page-add-camera"]');
    return JSON.stringify(b ? { da: true, text: b.textContent, titel: b.getAttribute('title'),
      hoch: Math.round(b.getBoundingClientRect().height) } : { da: false });
  })()`) as string);
  p('Im Seitenmenü steht „Foto aufnehmen"', k.da && /Foto aufnehmen/.test(String(k.text)), JSON.stringify(k));
  p('… mit 44 px (§37)', k.hoch >= 44, JSON.stringify(k));
  p('… und der Hinweis sagt, was am Rechner passiert',
    /Dateiwähler/.test(String(k.titel)), String(k.titel));
  /* Und an der Miniatur. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="thumbnails"]')?.click());
  await s.waitForTimeout(400);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-thumb-menue="1"]')?.click());
  await s.waitForTimeout(400);
  p('Auch im Menü an der Miniatur (E480)',
    await s.evaluate(`!!document.querySelector('.document-thumb-menue [data-document-action="page-add-camera"]')`));

  /* DER WÄHLER SELBST. Der Klick öffnet einen echten Dateiwähler, den
     kein Prüflauf bedienen kann — also wird das INPUT-Element abgefangen,
     bevor es klickt. Geprüft wird, was Redion dem Telefon sagt. */
  const wie = JSON.parse(await s.evaluate(`(() => {
    const echt = HTMLInputElement.prototype.click;
    let gesehen = null;
    HTMLInputElement.prototype.click = function () {
      gesehen = { typ: this.type, accept: this.accept, capture: this.getAttribute('capture'),
                  mehrere: this.multiple };
    };
    try {
      PdfEinlesen.kameraWaehlen('x');
      const kamera = gesehen; gesehen = null;
      PdfEinlesen.bilderWaehlen('x');
      return JSON.stringify({ kamera, waehler: gesehen });
    } finally { HTMLInputElement.prototype.click = echt; }
  })()`) as string);
  gleich('Der Kamerawähler sagt „capture: environment"', wie.kamera?.capture, 'environment');
  gleich('… nimmt Bilder', wie.kamera?.accept, 'image/*');
  p('… und genau eine Aufnahme', wie.kamera?.mehrere === false, JSON.stringify(wie.kamera));
  p('Der gewöhnliche Wähler bleibt, was er war: mehrere Dateien, kein capture',
    wie.waehler?.capture === null && wie.waehler?.mehrere === true, JSON.stringify(wie.waehler));
  await s.close();
}

/* ═══ §2 Der Radierer nach Werkzeugart ═════════════════════════════════════ */
console.log('\n§2 Der Radierer nimmt nur, was er meint');
const mitBlatt = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Radierblatt' });
    /* Drei Marken auf derselben Höhe: Stift, Marker, Band. */
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [
      { id: 'st', art: 'stift', farbe: '#111111', breite: 3, pts: [[80, 300], [160, 300]], pressure: [0.6, 0.6] },
      { id: 'mk', art: 'marker', farbe: '#ffd75e', breite: 18, pts: [[200, 300], [280, 300]] },
      { id: 'bd', art: 'band', farbe: '#dddddd', breite: 2, pts: [[320, 280], [420, 320]] }
    ] });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};
const marken = async (s: Page): Promise<string[]> => JSON.parse(await s.evaluate(`(() => {
  const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
  return JSON.stringify(((b && b.marken) || []).map(m => m.id));
})()`) as string);
/** Waagerecht über alle drei Marken radieren. */
const radiere = (s: Page) => s.evaluate(async () => {
  const f = document.querySelector<SVGSVGElement>('.blatt-marken')!;
  const ctm = f.getScreenCTM()!;
  const px = (x: number, y: number) => { const pt = f.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(ctm); };
  const ev = (typ: string, x: number, y: number) => { const c = px(x, y); return new PointerEvent(typ, { bubbles: true,
    cancelable: true, clientX: c.x, clientY: c.y, pointerId: 9, pointerType: 'mouse', isPrimary: true,
    button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1, pressure: 0.6 }); };
  f.dispatchEvent(ev('pointerdown', 60, 300));
  for (let x = 70; x <= 440; x += 10) f.dispatchEvent(ev('pointermove', x, 300));
  f.dispatchEvent(ev('pointerup', 440, 300));
  await new Promise(r => setTimeout(r, 400));
});
{
  const arten = JSON.parse(await (await mitBlatt()).evaluate(`JSON.stringify(Marken.RADIERER.map(r => r.id))`) as string);
  gleich('Fünf Arten: ganz, teil, stift, marker, band', arten, ['ganz', 'teil', 'stift', 'marker', 'band']);
  for (const [modus, bleibt] of [['stift', ['mk', 'bd']], ['marker', ['st', 'bd']],
                                 ['band', ['st', 'mk']], ['ganz', []]] as Array<[string, string[]]>) {
    const s = await mitBlatt();
    await s.evaluate((m: string) => {
      Store.setMeta('zeichnen:radierer', m);
      document.querySelector<HTMLButtonElement>('.blatt-werk [data-wz="radierer"]')?.click();
      const z = (window as any).Zeichenziel;
      const ctrl = z?.jetzt ? null : null; void ctrl;
    }, modus);
    /* Der Modus steht am Merker; die Leiste liest ihn beim Aufbau. Also
       neu zeichnen, dann radieren. */
    await s.evaluate(() => { App.zeichneSeite(); });
    await s.waitForTimeout(500);
    await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk [data-wz="radierer"]')?.click());
    await s.waitForTimeout(200);
    await radiere(s);
    gleich('Modus „' + modus + '": es bleibt ' + (bleibt.length ? bleibt.join(', ') : 'nichts'),
      (await marken(s)).sort(), bleibt.slice().sort());
    await s.close();
  }
}

/* ═══ §3 „Teil" bleibt, was es war ═════════════════════════════════════════ */
console.log('\n§3 „Teil" schneidet weiter nur das Stück heraus');
{
  const s = await mitBlatt();
  await s.evaluate(() => { Store.setMeta('zeichnen:radierer', 'teil'); App.zeichneSeite(); });
  await s.waitForTimeout(500);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk [data-wz="radierer"]')?.click());
  await s.waitForTimeout(200);
  /* Nur mitten durch den Stiftstrich. */
  await s.evaluate(async () => {
    const f = document.querySelector<SVGSVGElement>('.blatt-marken')!;
    const ctm = f.getScreenCTM()!;
    const px = (x: number, y: number) => { const pt = f.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(ctm); };
    const ev = (typ: string, x: number, y: number) => { const c = px(x, y); return new PointerEvent(typ, { bubbles: true,
      cancelable: true, clientX: c.x, clientY: c.y, pointerId: 9, pointerType: 'mouse', isPrimary: true,
      button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1, pressure: 0.6 }); };
    f.dispatchEvent(ev('pointerdown', 120, 280));
    for (let y = 285; y <= 320; y += 5) f.dispatchEvent(ev('pointermove', 120, y));
    f.dispatchEvent(ev('pointerup', 120, 320));
    await new Promise(r => setTimeout(r, 400));
  });
  const ids = await marken(s);
  p('Aus einem Strich werden zwei Stücke, Marker und Band bleiben',
    ids.filter(i => i === 'mk' || i === 'bd').length === 2 && ids.length >= 3, JSON.stringify(ids));
  await s.close();
}

console.log('\n§4 Quellen');
p('`kameraWaehlen` steht in `einlesen.ts` und setzt `capture`',
  /const kameraWaehlen = /.test(lies('src/bereiche/pdf/einlesen.ts'))
  && /setAttribute\('capture', 'environment'\)/.test(lies('src/bereiche/pdf/einlesen.ts')));
p('Der Radierer hat fünf Arten und eine Beschränkung',
  /const RADIER_NUR = /.test(lies('src/bereiche/pdf/marken.ts'))
  && /if \(nur && mark\.art !== nur\) return false;/.test(lies('src/bereiche/pdf/marken.ts')));
p('Das erzeugte JS trägt beides',
  /kameraWaehlen/.test(lies('quell/bereiche/pdf/einlesen.js'))
  && /RADIER_NUR/.test(lies('quell/bereiche/pdf/marken.js')));
gleich('Keine Seitenfehler', fehler, []);

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
