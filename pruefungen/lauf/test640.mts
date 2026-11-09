/* Suite 640 — der Plan füllt die Fläche (E776)
 * ============================================================================
 * Redur, 9. November 2026: „ich will das du redion auf eine andere levell
 * bringst … die schaltplan teil ist die erstel prioieritet". Das Bild vom
 * Telefon im Vollbild zeigte, woran es zuerst liegt: ein Plan von
 * 800 × 500 stand winzig in der Mitte (ein Bauteil rund 20 px), darüber und
 * darunter je rund 350 px leere, rasterlose Fläche. Die Ansicht zeigte
 * immer das ganze BLATT, nie das, was darauf steht.
 *
 *   §1 Rechner 1300 × 860 (die Windows-App): beim Öffnen füllt der belegte
 *      Bereich die Fläche in der knappen Richtung zu mindestens 75 %, und
 *      er steht in der Mitte.
 *   §2 Telefon 390 × 844 im Vollbild: dasselbe; die Lampe misst mindestens
 *      26 px (vorher 19), und das Raster deckt die Fläche — kein Band ohne
 *      Raster, das höher wäre als 15 % der Fläche.
 *   §3 Telefon in der Seite: der belegte Bereich füllt die Breite.
 *   §4 Wer selbst zoomt, behält seinen Zoom, auch wenn das Fenster seine
 *      Grösse ändert; „Einpassen" passt danach wieder ein, und ein
 *      Fensterwechsel ohne eigenen Zoom passt neu ein.
 *   §5 Ins Vollbild und zurück passt neu ein (der Kasten ändert sich).
 *   §6 Ein leerer Plan zeigt das ganze Blatt bei 100 % — wie vorher.
 *   §7 In der eingepassten Ansicht gehört das Rad der Seite (sie rollt); erst
 *      nach eigenem Zoom verschiebt es den Plan (E762, test625 §2h).
 *   §8 Einpassen baut das Bild nicht neu (dasselbe `<svg>`).
 *
 * Gegen c38df473b rot: §1 und §2 messen das ganze Blatt (Füllung unter
 * 60 %, Lampe 19 px), und oberhalb und unterhalb des Blatts ist kein Raster.
 *
 *   node pruefungen/lauf/test640.mts
 * ==========================================================================*/
import { chromium, type Page } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any; declare const App: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];

const TEILE = [
  { id: 's1', zeichen: 'schliesser', x: 340, y: 250, drehung: 0, bmk: 'S1', nummern: {}, werte: {} },
  { id: 'h1', zeichen: 'lampe', x: 560, y: 250, drehung: 0, bmk: 'H1', nummern: {}, werte: {} },
  { id: 'f1', zeichen: 'lampe', x: 120, y: 250, drehung: 0, bmk: 'E1', nummern: {}, werte: {} }];

const aufmachen = async (o: { handy?: boolean; leer?: boolean }): Promise<Page> => {
  const ktx = await browser.newContext(o.handy
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1300, height: 860 } });
  const s = await ktx.newPage();
  s.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
  await s.goto(INDEX);
  await s.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild, null, { timeout: 30000 });
  await s.evaluate(async ([teile, leer]) => {
    Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 99);
    Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
    const sp = Store.addPage(null, { text: 'Plan 640', icon: '⚡' });
    Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan: { art: 'stromlauf-aufgeloest', breite: 800, hoehe: 500,
      teile: leer ? [] : teile, leitungen: [], texte: [], ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }] } });
    await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  }, [TEILE, !!o.leer] as const);
  await s.waitForSelector('.sp-wrap svg.sp-flaeche');
  await s.locator('.sp-wrap').first().scrollIntoViewIfNeeded();
  await s.waitForTimeout(400);
  return s;
};

type Mass = { stufe: { l: number; t: number; w: number; h: number }; inhalt: { l: number; t: number; w: number; h: number };
  lampe: number; rasterOben: number; rasterUnten: number; zoom: string; viewBox: string };
const messe = (s: Page): Promise<Mass> => s.evaluate(() => {
  const w = [...document.querySelectorAll<HTMLElement>('.sp-wrap')].pop()!;
  const svg = w.querySelector<SVGSVGElement>('svg.sp-flaeche')!;
  const b = w.querySelector<HTMLElement>('.sp-buehne')!.getBoundingClientRect();
  const sv = svg.getBoundingClientRect();
  /* Die Fläche: das Innere der Bühne (ohne ihren Innenabstand), geschnitten mit dem SVG. */
  const stil = getComputedStyle(w.querySelector<HTMLElement>('.sp-buehne')!);
  const l = Math.max(b.left + parseFloat(stil.paddingLeft), sv.left), t = Math.max(b.top + parseFloat(stil.paddingTop), sv.top);
  const r = Math.min(b.right - parseFloat(stil.paddingRight), b.right), u = Math.min(b.bottom - parseFloat(stil.paddingBottom), b.bottom);
  let il = Infinity, it = Infinity, ir = -Infinity, iu = -Infinity;
  w.querySelectorAll('.sp-teil').forEach(g => {
    const q = g.getBoundingClientRect();
    il = Math.min(il, q.left); it = Math.min(it, q.top); ir = Math.max(ir, q.right); iu = Math.max(iu, q.bottom);
  });
  const lampe = w.querySelector('.sp-teil[data-id="h1"]')?.getBoundingClientRect().width ?? 0;
  /* Wie weit reicht das Raster nach oben und unten (alle Muster-Flächen zusammen)? */
  let ro = Infinity, ru = -Infinity;
  w.querySelectorAll('rect[fill="url(#sp-raster)"]').forEach(x => {
    const q = x.getBoundingClientRect(); ro = Math.min(ro, q.top); ru = Math.max(ru, q.bottom);
  });
  return { stufe: { l, t, w: r - l, h: u - t }, inhalt: { l: il, t: it, w: ir - il, h: iu - it }, lampe,
           rasterOben: Math.max(0, ro - t), rasterUnten: Math.max(0, u - ru),
           zoom: w.querySelector('.sp-zoomwert')?.textContent || '', viewBox: svg.getAttribute('viewBox') || '' };
});
const fuellung = (m: Mass): number => Math.max(m.inhalt.w / m.stufe.w, m.inhalt.h / m.stufe.h);
const mitte = (m: Mass): number => Math.max(
  Math.abs((m.inhalt.l + m.inhalt.w / 2) - (m.stufe.l + m.stufe.w / 2)) / m.stufe.w,
  Math.abs((m.inhalt.t + m.inhalt.h / 2) - (m.stufe.t + m.stufe.h / 2)) / m.stufe.h);
const kurz = (m: Mass): string => JSON.stringify({ f: +fuellung(m).toFixed(2), stufe: m.stufe, inhalt: m.inhalt, lampe: +m.lampe.toFixed(1), zoom: m.zoom });

/* ══ §1 ════════════════════════════════════════════════════════════════════ */
console.log('\n§1 Rechner 1300 × 860');
const A = await aufmachen({});
const a1 = await messe(A);
p('Der belegte Bereich füllt die Fläche zu ≥ 75 % (knappe Richtung)', fuellung(a1) >= 0.75, kurz(a1));
p('… und steht in der Mitte (Abweichung ≤ 8 %)', mitte(a1) <= 0.08, String(mitte(a1).toFixed(3)));
p('… und nichts ragt hinaus', a1.inhalt.l >= a1.stufe.l - 1 && a1.inhalt.l + a1.inhalt.w <= a1.stufe.l + a1.stufe.w + 1 &&
  a1.inhalt.t >= a1.stufe.t - 1 && a1.inhalt.t + a1.inhalt.h <= a1.stufe.t + a1.stufe.h + 1, kurz(a1));

/* ══ §8 (hier, weil es dieselbe Seite ist) ═════════════════════════════════ */
await A.evaluate(() => { (window as any).__svg640 = document.querySelector('.sp-wrap svg.sp-flaeche'); });

/* ══ §7 ════════════════════════════════════════════════════════════════════ */
console.log('\n§7 Das Rad in der eingepassten Ansicht');
const radNimmt = (s: Page): Promise<boolean> => s.evaluate(() => {
  const b = document.querySelector<HTMLElement>('.sp-wrap .sp-buehne')!.querySelector('svg')!;
  const r = b.getBoundingClientRect();
  const e = new WheelEvent('wheel', { deltaY: 100, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true });
  b.dispatchEvent(e);
  return e.defaultPrevented;
});
p('Eingepasst: das Rad wird nicht abgefangen (die Seite rollt)', !(await radNimmt(A)));

/* ══ §4 ════════════════════════════════════════════════════════════════════ */
console.log('\n§4 Eigener Zoom bleibt');
await A.locator('.sp-wrap [data-a="zoom-plus"]').last().click();
await A.waitForTimeout(200);
const a2 = await messe(A);
p('Nach eigenem Zoom gehört das Rad dem Plan', await radNimmt(A));
await A.setViewportSize({ width: 1100, height: 800 });
await A.waitForTimeout(500);
const a3 = await messe(A);
p('Fenster kleiner: der eigene Zoom bleibt (dieselbe Zahl)', a3.zoom === a2.zoom, `${a2.zoom} → ${a3.zoom}`);
await A.locator('.sp-wrap [data-a="zoom-alles"]').last().click();
await A.waitForTimeout(250);
const a4 = await messe(A);
p('„Einpassen" passt wieder ein (≥ 75 %)', fuellung(a4) >= 0.75 && mitte(a4) <= 0.08, kurz(a4));
p('… und das Rad gehört wieder der Seite', !(await radNimmt(A)));
await A.setViewportSize({ width: 1300, height: 860 });
await A.waitForTimeout(500);
const a5 = await messe(A);
p('Ohne eigenen Zoom passt ein Fensterwechsel neu ein (≥ 75 %, Mitte)', fuellung(a5) >= 0.75 && mitte(a5) <= 0.08, kurz(a5));

/* ══ §8 ════════════════════════════════════════════════════════════════════ */
console.log('\n§8 Kein Neubau');
p('Einpassen und Fensterwechsel bauen das SVG nicht neu',
  await A.evaluate(() => (window as any).__svg640 === document.querySelector('.sp-wrap svg.sp-flaeche')));

/* ══ §5 ════════════════════════════════════════════════════════════════════ */
console.log('\n§5 Vollbild');
await A.locator('.sp-wrap [data-a="vollbild"]').last().click();
await A.waitForTimeout(600);
const a6 = await messe(A);
p('Im Vollbild passt die Ansicht neu ein (≥ 75 %, Mitte)', fuellung(a6) >= 0.75 && mitte(a6) <= 0.08, kurz(a6));
p('… und die Fläche ist grösser als in der Seite', a6.stufe.w * a6.stufe.h > a5.stufe.w * a5.stufe.h, kurz(a6));
await A.keyboard.press('Escape');
await A.waitForTimeout(500);

/* ══ §2 ════════════════════════════════════════════════════════════════════ */
console.log('\n§2 Telefon 390 × 844 im Vollbild');
const T = await aufmachen({ handy: true });
const t0 = await messe(T);
await T.locator('.sp-wrap [data-a="vollbild"]').last().click();
await T.waitForTimeout(700);
const t1 = await messe(T);
p('Der belegte Bereich füllt die Fläche zu ≥ 75 %', fuellung(t1) >= 0.75, kurz(t1));
p('… und steht in der Mitte', mitte(t1) <= 0.08, String(mitte(t1).toFixed(3)));
p('Die Lampe misst mindestens 26 px', t1.lampe >= 26, String(t1.lampe));
p('Kein Band ohne Raster über 15 % der Höhe (oben)', t1.rasterOben <= 0.15 * t1.stufe.h, `${t1.rasterOben.toFixed(0)} von ${t1.stufe.h.toFixed(0)}`);
p('… und unten', t1.rasterUnten <= 0.15 * t1.stufe.h, `${t1.rasterUnten.toFixed(0)} von ${t1.stufe.h.toFixed(0)}`);

/* ══ §3 ════════════════════════════════════════════════════════════════════ */
console.log('\n§3 Telefon in der Seite');
p('In der Seite füllt der belegte Bereich die Breite (≥ 75 %)', fuellung(t0) >= 0.75, kurz(t0));
p('… und auch dort deckt das Raster die Fläche', t0.rasterOben <= 0.15 * t0.stufe.h && t0.rasterUnten <= 0.15 * t0.stufe.h,
  `${t0.rasterOben.toFixed(0)} / ${t0.rasterUnten.toFixed(0)} von ${t0.stufe.h.toFixed(0)}`);

/* ══ §6 ════════════════════════════════════════════════════════════════════ */
console.log('\n§6 Ein leerer Plan');
const L = await aufmachen({ leer: true });
const l1 = await messe(L);
p('Ein leerer Plan steht bei 100 % und zeigt das ganze Blatt', /^100\s*%$/.test(l1.zoom) && l1.viewBox === '0 0 800 500', `${l1.zoom} · ${l1.viewBox}`);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
process.exit(weg ? 1 : 0);
