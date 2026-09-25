/* Suite 568 — Strg+Z gehört der Fläche, die es genommen hat (E682, L212)
 * ============================================================================
 * GEMESSEN AM 25. SEPTEMBER 2026, beim Plattform-Audit (doku/REDION-PLATTFORM-
 * AUDIT.md, 2.4): Strg+Z im Schaltplan setzte ein eben gesetztes Teil NICHT
 * zurück, meldete aber „Rückgängig", zeichnete den Block neu und gab ihm eine
 * neue Kennung. Auf dem Blatt ging ein Strich — und der alte Block war weg.
 *
 * DER GRUND steht in drei Dateien: `Planflaeche` (planflaeche.ts) und `Marken`
 * (marken.ts) nehmen die Taste mit `preventDefault()`, aber die Taste läuft
 * weiter bis zum Dokument, wo die Schale (schale.ts, `tasten()`) bei jedem
 * Strg+Z `Verlauf.zurueck()` ruft — ohne zu fragen, ob jemand die Taste schon
 * genommen hat. Der Seitenverlauf leert dann die Seite (`purgeBlock` je Kind)
 * und setzt sie mit frischen Kennungen wieder ein (`baumEinfuegen`).
 *
 * DIE REGEL, die dieser Lauf hält: Eine Taste, die ein Block schon genommen
 * hat (`defaultPrevented`), nimmt die Schale nicht noch einmal. Und jede
 * Fläche mit eigenem Verlauf nimmt sie — auch das Whiteboard, das bis E682
 * gar keine Taste hatte.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Schaltplan: Teil setzen, Strg+Z → das Teil ist weg, der Block steht
 *      noch (dasselbe Element, dieselbe Kennung), kein „Rückgängig"-Toast der
 *      Seite.
 *   2  Blatt: zwei Striche, Strg+Z → ein Strich weg, der Block lebt, dieselbe
 *      Kennung, dieselbe Zeichenschicht.
 *   3  Whiteboard: Rechteck ziehen, Strg+Z → weg; Strg+Umschalt+Z → wieder da;
 *      Kennung gleich. (Vorher: keine Taste, die Seite sprang.)
 *   4  Gedankenkarte: Tab legt ein Kind an, Strg+Z nimmt es — das war schon
 *      richtig (stopPropagation) und bleibt es.
 *   5  Und wo KEIN Block die Taste nimmt — ein Textblock — nimmt die Schale
 *      sie weiterhin: der Seitenverlauf geht einen Schritt zurück und sagt es.
 *
 * GEGEN DEN ALTEN STAND (a196b65) rot in §1 bis §3: Kennungen wechseln,
 * Elemente werden ersetzt, im Schaltplan bleibt das Teil stehen.
 * ==========================================================================*/
import { chromium } from 'playwright';
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
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];

/** Eine frische Seite mit einem Block; gibt Seiten- und Blockkennung zurück. */
const seiteMit = async (typ: string, patch: Record<string, unknown>) => {
  const ktx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push(e.message));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pg.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
  const ids = await pg.evaluate(async ([typ, patch]: [string, Record<string, unknown>]) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
    const s = Store.addPage(null, { text: 'Strg+Z · ' + typ });
    const b = Store.addBlock(s.id, typ, patch);
    if (typ === 'blatt') Store.addBlock(b.id, 'text', { text: '' });
    await Store.flush();
    App.zeichneBaum(); App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
    return { seite: s.id, block: b.id };
  }, [typ, patch] as [string, Record<string, unknown>]);
  return { ktx, pg, ...ids };
};

/** Der Block dieses Typs auf der offenen Seite, wie ihn die Ablage jetzt kennt. */
const stand = (pg: any, typ: string, wurzel: string) => pg.evaluate(([typ, wurzel]: [string, string]) => {
  const seite = App.aktuelleSeite();
  const b = (Store.childrenOf(seite) as any[]).find(k => k.type === typ);
  const el = document.querySelector<HTMLElement>(wurzel);
  return {
    id: b?.id ?? null,
    marke: el?.dataset.probe ?? null,
    toasts: [...document.querySelectorAll('.toast, #toast, .ui-toast')].map(t => t.textContent?.trim() ?? '').filter(Boolean),
    block: b ? JSON.parse(JSON.stringify(b)) : null,
  };
}, [typ, wurzel] as [string, string]);
const markiere = (pg: any, wurzel: string) => pg.evaluate((w: string) => {
  const el = document.querySelector<HTMLElement>(w); if (el) el.dataset.probe = 'alt';
}, wurzel);
const strgZ = (pg: any, ziel: string, shift = false) => pg.evaluate(([ziel, shift]: [string, boolean]) => {
  const el = document.querySelector<HTMLElement>(ziel);
  if (!el) throw new Error('Ziel fehlt: ' + ziel);
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: shift, bubbles: true, cancelable: true }));
}, [ziel, shift] as [string, boolean]);
const keinSeitenToast = (toasts: string[]) => !toasts.some(t => /Rückgängig|Wiederholt/.test(t));

try {
  /* ── §1 Schaltplan ─────────────────────────────────────────────────────── */
  console.log('\n1 · Schaltplan: die Taste bleibt beim Plan');
  {
    const { pg, ktx, block } = await seiteMit('schaltplan', { text: 'Probe' });
    await pg.evaluate((id: string) => {
      const plan = Schaltplan.neuerPlan('stromlauf-aufgeloest');
      const T = (zeichen: string, x: number, y: number, bmk: string) =>
        ({ id: Schaltplan.uid(), zeichen, x, y, drehung: 0, gespiegelt: false, bmk, nummern: {}, gruppe: '', ebene: 'plan' });
      plan.teile = [T('taster-oeffner', 100, 100, 'S0'), T('spule', 100, 300, 'K1')];
      Store.updateBlock(id, { plan });
      App.zeichneSeite();
    }, block);
    await pg.waitForSelector('.sp-flaeche');
    await pg.waitForTimeout(300);
    await markiere(pg, '.sp-wrap');
    await pg.click('.sp-sym');
    const box = await pg.locator('.sp-flaeche').boundingBox();
    await pg.mouse.click(box!.x + box!.width * 0.7, box!.y + box!.height * 0.6);
    await pg.waitForTimeout(150);
    const gesetzt = await stand(pg, 'schaltplan', '.sp-wrap');
    p('Ein drittes Teil steht im Plan', gesetzt.block?.plan?.teile?.length === 3, 'teile=' + gesetzt.block?.plan?.teile?.length);
    await pg.waitForTimeout(800);                      // der Zaun des Seitenverlaufs ist 700 ms
    await strgZ(pg, '.sp-wrap');
    await pg.waitForTimeout(400);
    const danach = await stand(pg, 'schaltplan', '.sp-wrap');
    const dom = await pg.evaluate(() => document.querySelectorAll('.sp-teil').length);
    p('Strg+Z nimmt das Teil zurück (Ablage)', danach.block?.plan?.teile?.length === 2, 'teile=' + danach.block?.plan?.teile?.length);
    p('… und auf dem Bildschirm', dom === 2, 'sp-teil=' + dom);
    p('Der Block behält seine Kennung', danach.id === block, `${block} → ${danach.id}`);
    p('Der Block wurde nicht neu gezeichnet', danach.marke === 'alt', 'Marke=' + danach.marke);
    p('Kein Seitenverlauf-Toast', keinSeitenToast(danach.toasts), JSON.stringify(danach.toasts));
    await ktx.close();
  }

  /* ── §2 Blatt ──────────────────────────────────────────────────────────── */
  console.log('\n2 · Blatt: ein Strich geht, der Block bleibt');
  {
    const { pg, ktx, block } = await seiteMit('blatt', { text: '', papier: 'blanko' });
    await pg.waitForSelector('.blatt-marken');
    await pg.click('.blatt-werk [data-wz="stift"]');
    await pg.waitForTimeout(150);
    await markiere(pg, '.blatt-marken');
    const zug = (punkte: Array<[number, number]>) => pg.evaluate(async (punkte: Array<[number, number]>) => {
      const svg = document.querySelector<SVGSVGElement>('.blatt-marken')!;
      const ctm = svg.getScreenCTM()!;
      const zu = (x: number, y: number) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const c = pt.matrixTransform(ctm); return { clientX: c.x, clientY: c.y }; };
      const ev = (typ: string, x: number, y: number) => new PointerEvent(typ, { ...zu(x, y), pointerType: 'mouse', pressure: typ === 'pointerup' ? 0 : 0.5, isPrimary: true, button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1, pointerId: 7, bubbles: true, cancelable: true });
      svg.dispatchEvent(ev('pointerdown', punkte[0]![0], punkte[0]![1]));
      for (let i = 1; i < punkte.length; i++) svg.dispatchEvent(ev('pointermove', punkte[i]![0], punkte[i]![1]));
      const e = punkte[punkte.length - 1]!; svg.dispatchEvent(ev('pointerup', e[0], e[1]));
      await new Promise(f => setTimeout(f, 150));
    }, punkte);
    await zug([[100, 100], [140, 130], [180, 160], [220, 200]]);
    await pg.waitForTimeout(800);
    await zug([[100, 300], [160, 300], [220, 300]]);
    const vor = await stand(pg, 'blatt', '.blatt-marken');
    p('Zwei Striche liegen auf dem Blatt', vor.block?.marken?.length === 2, 'marken=' + vor.block?.marken?.length);
    await pg.waitForTimeout(800);
    await strgZ(pg, '.blatt-marken');
    await pg.waitForTimeout(400);
    const danach = await stand(pg, 'blatt', '.blatt-marken');
    const lebt = await pg.evaluate((id: string) => !!Store.getBlock(id), block);
    p('Strg+Z nimmt genau einen Strich', danach.block?.marken?.length === 1, 'marken=' + danach.block?.marken?.length);
    p('Der alte Block lebt noch', lebt);
    p('Der Block behält seine Kennung', danach.id === block, `${block} → ${danach.id}`);
    p('Die Zeichenschicht wurde nicht ersetzt', danach.marke === 'alt', 'Marke=' + danach.marke);
    p('Kein Seitenverlauf-Toast', keinSeitenToast(danach.toasts), JSON.stringify(danach.toasts));
    await ktx.close();
  }

  /* ── §3 Whiteboard ─────────────────────────────────────────────────────── */
  console.log('\n3 · Whiteboard: bekommt die Taste — und sie bleibt bei ihm');
  {
    const { pg, ktx, block } = await seiteMit('whiteboard', { shapes: [] });
    await pg.waitForSelector('.wb-flaeche');
    await markiere(pg, '.wb');
    await pg.click('.wb-tools [data-wz="rechteck"]');
    const box = await pg.locator('.wb-flaeche').boundingBox();
    await pg.mouse.move(box!.x + 200, box!.y + 120);
    await pg.mouse.down();
    await pg.mouse.move(box!.x + 320, box!.y + 200, { steps: 6 });
    await pg.mouse.up();
    await pg.waitForTimeout(150);
    const vor = await stand(pg, 'whiteboard', '.wb');
    p('Ein Rechteck liegt auf der Fläche', vor.block?.shapes?.length === 1, 'shapes=' + vor.block?.shapes?.length);
    await pg.waitForTimeout(800);
    await strgZ(pg, '.wb');
    await pg.waitForTimeout(400);
    const danach = await stand(pg, 'whiteboard', '.wb');
    p('Strg+Z nimmt das Rechteck', danach.block?.shapes?.length === 0, 'shapes=' + danach.block?.shapes?.length);
    p('Der Block behält seine Kennung', danach.id === block, `${block} → ${danach.id}`);
    p('Der Block wurde nicht neu gezeichnet', danach.marke === 'alt', 'Marke=' + danach.marke);
    p('Kein Seitenverlauf-Toast', keinSeitenToast(danach.toasts), JSON.stringify(danach.toasts));
    await strgZ(pg, '.wb', true);
    await pg.waitForTimeout(300);
    const wieder = await stand(pg, 'whiteboard', '.wb');
    p('Strg+Umschalt+Z holt es zurück', wieder.block?.shapes?.length === 1, 'shapes=' + wieder.block?.shapes?.length);
    await ktx.close();
  }

  /* ── §4 Gedankenkarte ──────────────────────────────────────────────────── */
  console.log('\n4 · Gedankenkarte: war richtig, bleibt richtig');
  {
    const { pg, ktx, block } = await seiteMit('mindmap', {});
    await pg.waitForSelector('.gk-buehne');
    await pg.evaluate(() => document.querySelector<HTMLElement>('.gk-buehne')?.focus());
    await pg.keyboard.press('Tab');
    await pg.waitForTimeout(150);
    await pg.keyboard.type('Kind');
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(200);
    const vor = await stand(pg, 'mindmap', '.gk-buehne');
    p('Tab legt ein Kind an', vor.block?.karte?.knoten?.length === 2, 'knoten=' + vor.block?.karte?.knoten?.length);
    await pg.waitForTimeout(800);
    /* Zwei Schritte, weil die Karte zwei gemerkt hat: das Anlegen und den
       Text. Der erste Strg+Z nimmt „Kind" weg, der zweite den Knoten. */
    await strgZ(pg, '.gk-buehne');
    await pg.waitForTimeout(250);
    const halb = await stand(pg, 'mindmap', '.gk-buehne');
    p('Der erste Strg+Z nimmt den Text', halb.block?.karte?.knoten?.length === 2 && halb.block?.karte?.knoten?.[1]?.text === '',
      JSON.stringify(halb.block?.karte?.knoten?.map((k: any) => k.text)));
    await strgZ(pg, '.gk-buehne');
    await pg.waitForTimeout(400);
    const danach = await stand(pg, 'mindmap', '.gk-buehne');
    p('Der zweite nimmt das Kind', danach.block?.karte?.knoten?.length === 1, 'knoten=' + danach.block?.karte?.knoten?.length);
    p('Der Block behält seine Kennung', danach.id === block, `${block} → ${danach.id}`);
    p('Kein Seitenverlauf-Toast', keinSeitenToast(danach.toasts), JSON.stringify(danach.toasts));
    await ktx.close();
  }

  /* ── §5 Textblock: die Schale darf weiter ─────────────────────────────── */
  console.log('\n5 · Wo kein Block die Taste nimmt, nimmt sie die Schale');
  {
    const { pg, ktx, block } = await seiteMit('text', { text: 'Eins' });
    await pg.waitForTimeout(800);
    await pg.evaluate((id: string) => { Store.updateBlock(id, { text: 'Zwei' }); }, block);
    await pg.waitForTimeout(800);
    await pg.evaluate((id: string) => { Store.updateBlock(id, { text: 'Drei' }); }, block);
    await pg.waitForTimeout(800);
    await pg.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); });
    await pg.keyboard.press('Control+z');
    await pg.waitForTimeout(500);
    const danach = await stand(pg, 'text', 'body');
    p('Der Seitenverlauf geht einen Schritt zurück', danach.block?.text === 'Zwei', 'text=' + JSON.stringify(danach.block?.text));
    p('… und sagt es', danach.toasts.some(t => /Rückgängig/.test(t)), JSON.stringify(danach.toasts));
    await ktx.close();
  }

  p('Keine Fehler im Browser', fehler.length === 0, fehler.slice(0, 3).join(' | '));
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
