/* Suite 639 — ein unbekanntes Bauteil verschwindet nicht still (E775)
 * ============================================================================
 * Gefunden am 9. November 2026 auf dem Bild des Treppenhaus-Plans: drei
 * Teile im Plan, die Fusszeile sagte „3 Teile", gezeichnet waren zwei. Das
 * dritte trug `zeichen: 'quelle'` — ein Zeichen, das diese Fassung nicht
 * kennt (ein Plan aus einer anderen Fassung, eine Vorlage, ein Import).
 * `Schaltplan.alsSvg` fragte das Register, bekam nichts und liess das Teil
 * weg: kein Bild, nichts zum Antippen, nichts zum Verschieben oder Löschen.
 *
 * §18 [hart]: „Unbekannte Blocktypen nicht löschen — sie sind Daten eines
 * Nutzers, der eine neuere Fassung hatte." Für ein Bauteil gilt dasselbe,
 * und UNSICHTBAR ist der erste Schritt zum Löschen: wer es nicht sieht,
 * räumt den Plan auf und wundert sich, warum „3 Teile" steht.
 *
 *   §1 Das Teil steht da: eine Gruppe `.sp-teil.sp-unbekannt` mit sichtbarer
 *      Fläche, einem Fragezeichen, dem Namen des Zeichens und einem Titel,
 *      der sagt, was los ist. Das BMK steht daneben wie bei jedem Teil.
 *   §2 Es ist ein Teil wie jedes andere: antippen wählt es, die Pfeiltaste
 *      verschiebt es um ein Raster, und im gespeicherten Plan steht danach
 *      dasselbe Zeichen, dieselben Nummern und Werte — nichts geht verloren.
 *   §3 Strom einschalten wirft nichts, und das Teil bleibt gezeichnet.
 *   §4 Das gespeicherte Bild (`alsSvg` ohne Raster) trägt das Teil auch.
 *   §5 Ein bekanntes Zeichen bekommt KEINEN Platzhalter (keine Verwechslung).
 *
 * Gegen c38df473b rot: §1 findet keine Gruppe für `q`, §2 kann nichts
 * antippen, §4 fehlt `data-id="q"`.
 *
 *   node pruefungen/lauf/test639.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any; declare const App: any; declare const Schaltplan: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const INDEX = pathToFileURL(path.join(WURZEL, 'index.html')).href;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1300, height: 860 } });
const s = await ktx.newPage();
s.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
await s.goto(INDEX);
await s.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild, null, { timeout: 30000 });

const bid: string = await s.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 99);
  Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
  const sp = Store.addPage(null, { text: 'Plan 639', icon: '⚡' });
  const b = Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan: { art: 'stromlauf-aufgeloest', breite: 800, hoehe: 500,
    teile: [
      { id: 'q', zeichen: 'quelle', x: 120, y: 250, drehung: 0, bmk: 'G1', nummern: { a: '7' }, werte: { U: 230 } },
      { id: 's1', zeichen: 'schliesser', x: 340, y: 250, drehung: 0, bmk: 'S1', nummern: {}, werte: {} },
      { id: 'h1', zeichen: 'lampe', x: 560, y: 250, drehung: 0, bmk: 'H1', nummern: {}, werte: {} }],
    leitungen: [], texte: [], ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }] } });
  await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
  await new Promise(f => setTimeout(f, 900));
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  return b.id;
});
await s.waitForSelector('.sp-wrap svg.sp-flaeche');
await s.locator('.sp-wrap').first().scrollIntoViewIfNeeded();
await s.waitForTimeout(300);

/* ══ §1 ════════════════════════════════════════════════════════════════════ */
console.log('\n§1 Das unbekannte Teil steht da');
const bild = await s.evaluate(() => {
  const g = document.querySelector<SVGGElement>('.sp-wrap .sp-teil[data-id="q"]');
  if (!g) return null;
  const r = g.getBoundingClientRect();
  return { klasse: g.getAttribute('class'), w: r.width, h: r.height, x: r.left + r.width / 2, y: r.top + r.height / 2,
           text: g.textContent || '', titel: g.querySelector('title')?.textContent || '' };
});
p('Es gibt eine Gruppe für das Teil „q"', !!bild);
p('… mit der Marke `sp-unbekannt`', !!bild && /\bsp-unbekannt\b/.test(bild.klasse || ''), bild?.klasse || '');
p('… und einer sichtbaren Fläche (≥ 16 × 16 px)', !!bild && bild.w >= 16 && bild.h >= 16, JSON.stringify(bild && [bild.w, bild.h]));
p('… mit Fragezeichen und dem Namen des Zeichens', !!bild && bild.text.includes('?') && bild.text.includes('quelle'), bild?.text || '');
p('… und das BMK steht dabei', !!bild && bild.text.includes('G1'), bild?.text || '');
p('Der Titel sagt, was los ist', !!bild && /unbekannt/i.test(bild.titel) && /erhalten/i.test(bild.titel), bild?.titel || '');

/* ══ §2 ════════════════════════════════════════════════════════════════════ */
console.log('\n§2 Ein Teil wie jedes andere');
if (bild) { await s.mouse.click(bild.x, bild.y); await s.waitForTimeout(350); }
p('Antippen wählt es', await s.locator('.sp-wrap .sp-teil.sp-gewaehlt[data-id="q"]').count() === 1);
await s.evaluate(() => document.querySelector<HTMLElement>('.sp-wrap')!.focus());
await s.keyboard.press('ArrowRight');
await s.waitForTimeout(250);
await s.evaluate(() => Store.flush());
const gespeichert = await s.evaluate((b: string) => Store.getBlock(b).plan.teile.find((t: any) => t.id === 'q'), bid);
gleich('Die Pfeiltaste verschiebt es um ein Raster', gespeichert && [gespeichert.x, gespeichert.y], [130, 250]);
gleich('… und Zeichen, Nummern und Werte bleiben, wie sie waren',
  gespeichert && [gespeichert.zeichen, gespeichert.nummern, gespeichert.werte], ['quelle', { a: '7' }, { U: 230 }]);
gleich('Im Plan stehen weiter drei Teile', await s.evaluate((b: string) => Store.getBlock(b).plan.teile.length, bid), 3);

/* ══ §3 ════════════════════════════════════════════════════════════════════ */
console.log('\n§3 Strom');
const vorher = fehler.length;
await s.locator('.sp-wrap button[data-a="simulation"]').first().click();
await s.waitForTimeout(400);
gleich('Strom einschalten wirft nichts', fehler.slice(vorher), []);
p('… und das Teil bleibt gezeichnet', await s.locator('.sp-wrap .sp-teil.sp-unbekannt[data-id="q"]').count() === 1);
await s.locator('.sp-wrap button[data-a="simulation"]').first().click();
await s.waitForTimeout(250);

/* ══ §4 ════════════════════════════════════════════════════════════════════ */
console.log('\n§4 Das gespeicherte Bild');
const svg = await s.evaluate((b: string) => Schaltplan.alsSvg(Schaltplan.lesen(Store.getBlock(b)), { raster: false, anschluesse: false }), bid);
p('`alsSvg` trägt das Teil `q`', /data-id="q"/.test(svg));

/* ══ §5 ════════════════════════════════════════════════════════════════════ */
console.log('\n§5 Bekannte Zeichen');
gleich('Nur das unbekannte Teil trägt den Platzhalter',
  await s.locator('.sp-wrap .sp-teil.sp-unbekannt').evaluateAll(l => l.map(e => e.getAttribute('data-id'))), ['q']);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
process.exit(weg ? 1 : 0);
