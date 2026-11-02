/* Suite 634 — Ein und Aus ist wieder „▶ Strom", und das Live-Stromlabor (E772, E773)
 * ============================================================================
 * Redur am 1. November 2026: „Alle Funktionen 1:1, sauber gebaut" — dazu
 * gehört das Labor mit Uhr, Tempo 0,25× bis 4×, Pause und Zurücksetzen
 * (E772). Den RED-MGT-Glasschalter, der damals an Stelle von „▶ Strom" kam,
 * hat er am 2. November zurückgenommen: „Für ein-aus sollte wie früher sein,
 * damals war besser" (E773).
 *
 *   §1 Ein und Aus ist ein <button> „▶ Strom" / „◼ Strom" mit aria-pressed
 *      und `data-a="simulation"`, so hoch wie „Bereiche" daneben; Klick und
 *      Enter schalten, der Fokus bleibt am Knopf.
 *   §2 Das Labor erscheint nur mit Strom. Seine Uhr läuft mit einem
 *      Zeitrelais, 4× schneller als 1×, steht in der Pause still und fängt
 *      nach „Reset" bei null an. Ohne Zeitrelais zeigt sie „—" und es läuft
 *      kein Takt (E528, test630 §3).
 *   §3 Der Knopf trägt wieder Hebel und Glühfaden aus motion.ts (E535), und
 *      sein Zustand folgt dem Strom.
 *   §4 Vom Glasschalter ist nichts übrig: kein `.red-mgt-` im Plan, keine
 *      Regel dafür in den Stilblättern, kein Knopf „⤢ 1:1".
 *
 * Gegen den Stand von E772 (5901e351f) rot: dort ist der Strom eine
 * Checkbox im Glasschalter, und `motion.ts` lässt den Hebel weg.
 *
 *   node pruefungen/lauf/test634.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];
const ktx = await browser.newContext({ viewport: { width: 1300, height: 860 } });
const s = await ktx.newPage();
s.on('pageerror', e => fehler.push(e.message.slice(0, 160)));
await s.goto(INDEX);
await s.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild, null, { timeout: 30000 });
const oeffne = async (mitZeit: boolean): Promise<void> => {
  await s.evaluate(async (mitZeit: boolean) => {
    Store.setMeta('rundgangGesehen', true); Store.setMeta('neuerungenGesehen', 99);
    Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10));
    const sp = Store.addPage(null, { text: 'Plan 634', icon: '⚡' });
    Store.addBlock(sp.id, 'schaltplan', { text: 'Plan', plan: { art: 'stromlauf-aufgeloest', breite: 800, hoehe: 600,
      teile: [{ id: 'k1', zeichen: mitZeit ? 'spule-anzugsverzoegert' : 'lampe', x: 300, y: 300, drehung: 0, bmk: 'K1', nummern: {}, werte: { T: 30 } }],
      leitungen: [], texte: [], ebenen: [{ id: 'plan', name: 'Plan', farbe: 'var(--text)', sichtbar: true }] } });
    await Store.flush(); App.zeichneBaum(); App.oeffne(sp.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  }, mitZeit);
  await s.waitForSelector('.sp-wrap button[data-a="simulation"]');
};
const schalter = () => s.locator('.sp-wrap button[data-a="simulation"]').first();
const laborOffen = () => s.evaluate(() => !(document.querySelector('.sp-wrap .sp-live-labor') as HTMLElement | null)?.hidden);
const uhr = async (): Promise<number> => {
  const t = await s.evaluate(() => document.querySelector('.sp-wrap [data-labor-uhr]')?.textContent ?? '');
  return t.includes('s') ? Number(t.replace(/[^0-9.]/g, '')) : NaN;
};

/* ══ §1 ════════════════════════════════════════════════════════════════════ */
console.log('\n§1 Der Knopf „▶ Strom"');
await oeffne(true);
gleich('Genau ein <button> mit data-a="simulation"', await s.locator('.sp-wrap [data-a="simulation"]').evaluateAll(l => l.map(e => e.tagName)), ['BUTTON']);
gleich('Aus: „▶ Strom", aria-pressed false', [(await schalter().innerText()).trim(), await schalter().getAttribute('aria-pressed')], ['▶ Strom', 'false']);
const knopf = await schalter().boundingBox();
const nachbar = await s.locator('.sp-wrap [data-a="bereiche"]').boundingBox();
p('So hoch wie „Bereiche" daneben', !!knopf && !!nachbar && Math.abs(knopf.height - nachbar.height) <= 1, JSON.stringify([knopf?.height, nachbar?.height]));
gleich('Vor dem Strom kein Labor', await laborOffen(), false);
await schalter().click();
await s.waitForTimeout(250);
gleich('Klick: „◼ Strom", aria-pressed true, Labor da', [(await schalter().innerText()).trim(), await schalter().getAttribute('aria-pressed'), await laborOffen()], ['◼ Strom', 'true', true]);
await schalter().focus();
await s.keyboard.press('Enter');
await s.waitForTimeout(250);
gleich('Enter: wieder aus, und der Fokus bleibt am Knopf', [await schalter().getAttribute('aria-pressed'),
  await s.evaluate(() => document.activeElement?.getAttribute('data-a'))], ['false', 'simulation']);

/* ══ §2 ════════════════════════════════════════════════════════════════════ */
console.log('\n§2 Das Labor');
await schalter().click();
await s.waitForTimeout(700);
const u1 = await uhr();
p('Mit Zeitrelais läuft die Uhr', u1 > 0.2, String(u1));
await s.locator('.sp-wrap [data-labor-aktion="reset"]').click();
await s.waitForTimeout(80);
p('„Reset" fängt bei null an', (await uhr()) < 0.25, String(await uhr()));
await s.locator('.sp-wrap [data-labor-tempo]').selectOption('4');
const a4 = await uhr(); await s.waitForTimeout(1000); const b4 = await uhr();
await s.locator('.sp-wrap [data-labor-tempo]').selectOption('1');
const a1 = await uhr(); await s.waitForTimeout(1000); const b1 = await uhr();
p('4× läuft mindestens dreimal so schnell wie 1×', (b4 - a4) > 3 * (b1 - a1) && (b1 - a1) > 0.5,
  `4×: ${(b4 - a4).toFixed(2)} s · 1×: ${(b1 - a1).toFixed(2)} s`);
await s.locator('.sp-wrap [data-labor-aktion="pause"]').click();
const ap = await uhr(); await s.waitForTimeout(600); const bp = await uhr();
gleich('In der Pause steht die Uhr', bp, ap);
gleich('… und der Knopf sagt es', await s.locator('.sp-wrap [data-labor-aktion="pause"]').getAttribute('aria-pressed'), 'true');
await schalter().click();
await oeffne(false);
await schalter().click();
await s.waitForTimeout(400);
gleich('Ohne Zeitrelais zeigt die Uhr „—"', await s.evaluate(() => document.querySelector('.sp-wrap [data-labor-uhr]')?.textContent), '—');

/* ══ §3 ════════════════════════════════════════════════════════════════════ */
console.log('\n§3 Hebel und Glühfaden (E535)');
await schalter().click();
await s.waitForTimeout(400);
const hebel = () => schalter().evaluate((k: Element) => [!!k.querySelector('.rmo-hebel'), k.getAttribute('data-rmo-state')]);
gleich('Aus: der Hebel ist da, Zustand „aus"', await hebel(), [true, 'aus']);
await schalter().click();
await s.waitForTimeout(400);
gleich('Ein: Zustand „an"', await hebel(), [true, 'an']);
await schalter().click();
await s.waitForTimeout(200);

/* ══ §4 ════════════════════════════════════════════════════════════════════ */
console.log('\n§4 Vom Glasschalter ist nichts übrig');
gleich('Kein .red-mgt- im Plan', await s.locator('.sp-wrap [class*="red-mgt-"]').count(), 0);
gleich('Keine Regel für .red-mgt- in den Stilblättern', await s.evaluate(() => {
  let n = 0;
  const geh = (regeln: CSSRuleList): void => { for (const r of Array.from(regeln)) {
    if ((r as CSSStyleRule).selectorText?.includes('red-mgt')) n++;
    if ((r as CSSGroupingRule).cssRules) geh((r as CSSGroupingRule).cssRules);
  } };
  for (const sh of Array.from(document.styleSheets)) { try { geh(sh.cssRules); } catch { /* fremdes Blatt */ } }
  return n;
}), 0);
gleich('Kein Knopf „⤢ 1:1" in Kopf und Palette', await s.locator('.sp-wrap [data-a="original-schalter"], .sp-wrap [data-p-original]').count(), 0);

gleich('Keine Fehler', fehler, []);
await browser.close();
console.log(`\n${ok} bestanden, ${weg} nicht bestanden`);
process.exit(weg ? 1 : 0);
