/* Suite 463 — Präsentieren mit Laserpointer (E493)
 * ============================================================================
 * L133 führte GoodNotes' Presentation Mode unter „was Redion nicht haben
 * wird — ausserhalb des PDF-Teils". Redur am 7. September: „schau wie ist es
 * bei GoodNotes und mache genau 1:1 so, ich will dass alles gemacht wird."
 * Er ist NICHT ausserhalb des PDF-Teils — er ist das Zeigen des Dokuments,
 * und er braucht weder Server noch Konto.
 *
 *   §1 DER MODUS: nur die Seite, keine Leisten, eine Seite ganz.
 *   §2 DER LASERPOINTER ZEIGT UND SCHREIBT NICHT — das ist der ganze
 *      Unterschied, und er wird an den Marken gemessen, nicht am Bild.
 *   §3 BLÄTTERN mit dem Zeiger: links zurück, rechts weiter — und wer
 *      ZIEHT, blättert nicht.
 *   §4 DIE TASTEN eines Vortragspults: Pfeile, Leertaste, Bild auf/ab,
 *      Pos1/Ende, Escape.
 *   §5 BEENDEN stellt alles zurück, auch die Einstellungen des Nutzers.
 *   §6 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `data-document-zeigen` nicht setzen: die Leisten bleiben stehen.
 *        Gelaufen, rot.
 *   §2 → die Zeigefläche weglassen: der Zeiger geht durch, und aus dem
 *        Zeigen wird ein Strich. Gelaufen, rot.
 *   §3 → die Abfrage „mehr als acht Pixel gezogen" weglassen: jedes Zeigen
 *        blättert eine Seite um. Gelaufen, rot.
 *   §4 → den Tastenzweig vor den übrigen entfernen: Escape schliesst
 *        irgendetwas anderes, die Präsentation bleibt. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test463.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9583;
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

/** Ein Dokument mit drei Seiten, im Studio geöffnet. */
const mitDrei = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Schulung', icon: '⚡' });
    for (let i = 1; i <= 3; i++)
      Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
        raumVersion: 1, marken: [] });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1200);
  return s;
};

const an = async (s: Page): Promise<void> => {
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="praesentieren"]')?.click());
  await s.waitForTimeout(700);
};
const seitenNr = (s: Page) => s.evaluate(`(document.querySelector('.document-position') || {}).textContent || ''`);
const markenZahl = (s: Page) => s.evaluate(`(() => {
  const b = Object.values(Store.cache.blocks).filter(x => x.type === 'blatt' && x.alive);
  return b.reduce((n, x) => n + ((x.marken || []).length), 0);
})()`);

/* ═══ §1 Der Modus ═════════════════════════════════════════════════════════ */
console.log('\n§1 Nur die Seite');
{
  const s = await mitDrei();
  const knopf = JSON.parse(await s.evaluate(`(() => {
    const b = document.querySelector('[data-document-action="praesentieren"]');
    const d = document.querySelector('[data-document-action="print"]');
    const h = (e) => e ? Math.round(e.getBoundingClientRect().height) : 0;
    return JSON.stringify({ da: !!b, text: b ? b.textContent : '',
      hoch: h(b), nachbar: h(d) });
  })()`) as string);
  p('Der Knopf steht im Kopf', knopf.da && /Präsentieren/.test(String(knopf.text)), JSON.stringify(knopf));
  /* SO HOCH WIE SEIN NACHBAR, und die Zahl steht nicht hier: die Kopfleiste
     des Studios misst am Rechner 36 px (nachgemessen), am Telefon 44 —
     dieselbe Rechnung wie bei den Farbsätzen (E486). Eine feste Zahl wäre
     eine zweite Wahrheit neben dem Stilblatt. */
  gleich('… so hoch wie „Drucken" daneben', knopf.hoch, knopf.nachbar);
  await an(s);
  const zu = JSON.parse(await s.evaluate(`(() => {
    const w = document.querySelector('.document-workspace');
    const sichtbar = (sel) => { const e = document.querySelector(sel);
      return !!e && e.getBoundingClientRect().height > 0; };
    return JSON.stringify({
      marke: w.dataset.documentZeigen || '',
      flaeche: !!document.querySelector('.document-zeigen-flaeche'),
      kopf: sichtbar('.document-topbar'),
      werkzeuge: sichtbar('.document-drawingbar'),
      stiftleiste: sichtbar('.blatt-reihe'),
      seiten: [...document.querySelectorAll('.document-stage')]
        .filter(e => e.getBoundingClientRect().height > 0).length,
      raus: !!document.querySelector('.document-zeigen-raus') });
  })()`) as string);
  gleich('Die Ansicht ist markiert', zu.marke, 'an');
  p('Die Zeigefläche liegt über dem Papier', zu.flaeche, JSON.stringify(zu));
  gleich('Der Kopf ist weg', zu.kopf, false);
  gleich('Die Werkzeugleiste ist weg', zu.werkzeuge, false);
  gleich('Die Stiftleiste am Blatt ist weg', zu.stiftleiste, false);
  gleich('Genau EINE Seite steht da', zu.seiten, 1);
  p('Und ein Weg hinaus', zu.raus, JSON.stringify(zu));
  /* Die ganze Seite muss ins Bild passen — ein Vortrag zeigt keine
     angeschnittene Folie. Gemessen, nicht angesehen. */
  const passt = JSON.parse(await s.evaluate(`(() => {
    const b = document.querySelector('.document-stage[data-aktiv]').getBoundingClientRect();
    const m = document.querySelector('.document-center').getBoundingClientRect();
    return JSON.stringify({ seite: Math.round(b.height), raum: Math.round(m.height) });
  })()`) as string);
  p('Die ganze Seite passt in die Höhe', passt.seite <= passt.raum, JSON.stringify(passt));
  await s.close();

  /* UND AM TELEFON MISST ER 44 px (§37) — dort trifft ihn ein Finger. */
  const t = await browser.newPage({ viewport: { width: 390, height: 844 } });
  t.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await t.goto(`http://localhost:${PORT}/index.html`);
  await t.waitForFunction("typeof App !== 'undefined'");
  await t.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    const seite = Store.addPage(null, { text: 'Schulung', icon: '⚡' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: [] });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await t.waitForSelector('.document-workspace', { timeout: 15000 });
  await t.waitForTimeout(1200);
  /* AM TELEFON STEHT ER IN DER ANSICHTSKLAPPE, nicht im Kopf — dort ist
     kein Platz mehr (gemessen: fünf Knöpfe à 44 px lassen dem Titel 70 px,
     `test285` verlangt hundert). Also erst die Klappe öffnen. */
  await t.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="view"]')?.click());
  await t.waitForTimeout(400);
  const amHandy = JSON.parse(await t.evaluate(`(() => {
    const oben = document.querySelector('.document-topbar [data-document-action="praesentieren"]');
    const klappe = document.querySelector('.document-commandbar [data-document-action="praesentieren"]');
    const sichtbar = (e) => !!e && e.getBoundingClientRect().height > 0;
    const r = klappe ? klappe.getBoundingClientRect() : null;
    const titel = document.querySelector('.document-title');
    return JSON.stringify({ obenSichtbar: sichtbar(oben), klappeSichtbar: sichtbar(klappe),
      hoch: r ? Math.round(r.height) : 0,
      name: klappe ? klappe.getAttribute('aria-label') : '',
      titelBreit: titel ? Math.round(titel.getBoundingClientRect().width) : -1 });
  })()`) as string);
  gleich('Im Kopf steht er am Telefon NICHT', amHandy.obenSichtbar, false);
  p('… sondern in der Ansichtsklappe', amHandy.klappeSichtbar, JSON.stringify(amHandy));
  p('… mit 44 px (§37)', amHandy.hoch >= 44, JSON.stringify(amHandy));
  p('… und mit einem Namen (§38)', /Vollbild/.test(String(amHandy.name)), String(amHandy.name));
  /* Und der Titel behält seine hundert Pixel — das ist die Zusage aus
     `test285`, hier noch einmal an der Stelle, die sie gebrochen hatte. */
  p('Der Titel behält seinen Platz (test285)', amHandy.titelBreit >= 100, JSON.stringify(amHandy));
  await t.close();
}

/* ═══ §2 Der Laserpointer ══════════════════════════════════════════════════ */
console.log('\n§2 Er zeigt und schreibt nicht');
{
  const s = await mitDrei();
  await an(s);
  const vorher = await markenZahl(s);
  const laser = JSON.parse(await s.evaluate(`(() => {
    const f = document.querySelector('.document-zeigen-flaeche');
    const r = f.getBoundingClientRect();
    const ev = (typ, x, y, tasten) => f.dispatchEvent(new PointerEvent(typ, { bubbles: true,
      clientX: x, clientY: y, pointerId: 3, buttons: tasten, pointerType: 'mouse' }));
    ev('pointerdown', r.left + 200, r.top + 200, 1);
    for (let i = 0; i < 20; i++) ev('pointermove', r.left + 200 + i * 8, r.top + 200 + i * 4, 1);
    const punkt = document.querySelector('.document-laser');
    return JSON.stringify({ da: !!punkt, an: punkt ? punkt.classList.contains('an') : false,
      links: punkt ? Math.round(parseFloat(punkt.style.left)) : -1,
      oben: punkt ? Math.round(parseFloat(punkt.style.top)) : -1 });
  })()`) as string);
  p('Ein Punkt entsteht', laser.da && laser.an, JSON.stringify(laser));
  p('… und folgt dem Zeiger', laser.links > 300 && laser.oben > 250, JSON.stringify(laser));
  await s.evaluate(() => {
    const f = document.querySelector<HTMLElement>('.document-zeigen-flaeche')!;
    const r = f.getBoundingClientRect();
    f.dispatchEvent(new PointerEvent('pointerup', { bubbles: true,
      clientX: r.left + 352, clientY: r.top + 276, pointerId: 3, buttons: 0, pointerType: 'mouse' }));
  });
  await s.waitForTimeout(1100);
  gleich('Nach dem Loslassen verglimmt er',
    await s.evaluate(`(() => { const p = document.querySelector('.document-laser');
      return p ? p.classList.contains('an') : 'weg'; })()`), false);
  /* DER PUNKT DER GANZEN ÜBUNG: keine einzige Marke ist entstanden. */
  gleich('Keine Marke ist entstanden — er ZEIGT', await markenZahl(s), vorher);
  await s.close();
}

/* ═══ §3 Blättern mit dem Zeiger ═══════════════════════════════════════════ */
console.log('\n§3 Tippen blättert, Ziehen nicht');
{
  const s = await mitDrei();
  await an(s);
  const tipp = (teil: number) => s.evaluate((t: number) => {
    const f = document.querySelector<HTMLElement>('.document-zeigen-flaeche')!;
    const r = f.getBoundingClientRect();
    const x = r.left + r.width * t, y = r.top + r.height / 2;
    const ev = (typ: string, tasten: number) => f.dispatchEvent(new PointerEvent(typ, {
      bubbles: true, clientX: x, clientY: y, pointerId: 4, buttons: tasten, pointerType: 'mouse' }));
    ev('pointerdown', 1); ev('pointerup', 0);
  }, teil);
  await tipp(0.8); await s.waitForTimeout(400);
  p('Rechts tippen blättert vor', /2\s*\/\s*3/.test(String(await seitenNr(s))), String(await seitenNr(s)));
  await tipp(0.1); await s.waitForTimeout(400);
  p('Links tippen blättert zurück', /1\s*\/\s*3/.test(String(await seitenNr(s))), String(await seitenNr(s)));
  /* Und wer zieht, zeigt — und blättert NICHT. */
  await s.evaluate(() => {
    const f = document.querySelector<HTMLElement>('.document-zeigen-flaeche')!;
    const r = f.getBoundingClientRect();
    const ev = (typ: string, x: number, tasten: number) => f.dispatchEvent(new PointerEvent(typ, {
      bubbles: true, clientX: x, clientY: r.top + r.height / 2, pointerId: 5, buttons: tasten, pointerType: 'mouse' }));
    ev('pointerdown', r.left + r.width * 0.8, 1);
    ev('pointermove', r.left + r.width * 0.8 + 60, 1);
    ev('pointerup', r.left + r.width * 0.8 + 60, 0);
  });
  await s.waitForTimeout(400);
  p('Ziehen zeigt und blättert nicht', /1\s*\/\s*3/.test(String(await seitenNr(s))), String(await seitenNr(s)));
  await s.close();
}

/* ═══ §4 Die Tasten ════════════════════════════════════════════════════════ */
console.log('\n§4 Die Tasten eines Vortragspults');
{
  const s = await mitDrei();
  await an(s);
  const taste = async (k: string) => {
    await s.evaluate((key: string) => {
      document.querySelector('.document-workspace')!
        .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    }, k);
    await s.waitForTimeout(350);
  };
  await taste('ArrowRight');
  p('Pfeil rechts: weiter', /2\s*\/\s*3/.test(String(await seitenNr(s))), String(await seitenNr(s)));
  await taste(' ');
  p('Leertaste: weiter', /3\s*\/\s*3/.test(String(await seitenNr(s))), String(await seitenNr(s)));
  await taste('ArrowLeft');
  p('Pfeil links: zurück', /2\s*\/\s*3/.test(String(await seitenNr(s))), String(await seitenNr(s)));
  await taste('Home');
  p('Pos1: an den Anfang', /1\s*\/\s*3/.test(String(await seitenNr(s))), String(await seitenNr(s)));
  await taste('End');
  p('Ende: ans Ende', /3\s*\/\s*3/.test(String(await seitenNr(s))), String(await seitenNr(s)));
  await taste('Escape');
  gleich('Escape beendet', await s.evaluate(`!!document.querySelector('.document-zeigen-flaeche')`), false);
  await s.close();
}

/* ═══ §5 Beenden stellt zurück ═════════════════════════════════════════════ */
console.log('\n§5 Danach ist alles wieder da');
{
  const s = await mitDrei();
  /* Der Nutzer hat den Inspector offen und die Werkzeuge zu. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(400);
  const vorher = await s.evaluate(`(() => {
    const w = document.querySelector('.document-workspace');
    return JSON.stringify({ werkzeuge: w.dataset.documentTools, panel: !!document.querySelector('.document-panel') });
  })()`);
  await an(s);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.document-zeigen-raus')?.click());
  await s.waitForTimeout(700);
  const nachher = await s.evaluate(`(() => {
    const w = document.querySelector('.document-workspace');
    return JSON.stringify({ werkzeuge: w.dataset.documentTools, panel: !!document.querySelector('.document-panel') });
  })()`);
  gleich('Der Zustand ist derselbe wie vorher', nachher, vorher);
  gleich('Die Marke ist weg',
    await s.evaluate(`document.querySelector('.document-workspace').dataset.documentZeigen || ''`), '');
  gleich('Die Zeigefläche ist weg',
    await s.evaluate(`!!document.querySelector('.document-zeigen-flaeche')`), false);
  gleich('Der Kopf steht wieder da',
    await s.evaluate(`document.querySelector('.document-topbar').getBoundingClientRect().height > 0`), true);
  await s.close();
}

/* ═══ §6 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Quellen');
{
  const q = lies('src/bereiche/pdf/document-mode.ts');
  p('Der Modus steht da', /const zeigenAn = /.test(q) && /const zeigenAus = /.test(q));
  p('Der Laserpointer ist ein Punkt über dem Papier, keine Marke',
    /document-laser/.test(q) && !/art: 'laser'/.test(q));
  p('Getippt wird geblättert, gezogen gezeigt', /tippVon\[0\]/.test(q));
  p('Das Vollbild wird nie gemerkt, sondern gelesen',
    /fullscreenchange/.test(q) && /App\.vollbildAn\?\.\(\)/.test(q));
  p('Das Stilblatt blendet die Leisten aus',
    /data-document-zeigen="an"\]\s*:is\(\.blatt-reihe/.test(lies('quell/schale/stil/pdf-studio.css')));
  p('Das erzeugte JS trägt es', /document-zeigen-flaeche/.test(lies('quell/bereiche/pdf/document-mode.js')));
  gleich('Keine Seitenfehler', fehler, []);
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
