/* Suite 634 — Der RED-MGT-Glasschalter und das Live-Stromlabor (E772)
 * ============================================================================
 * Redur am 1. November 2026: „Alle Funktionen 1:1, sauber gebaut" — der
 * Glasschalter in seinem ORIGINAL-Aussehen an Stelle von „▶ Strom", und
 * das Labor mit Uhr, Tempo 0,25× bis 4×, Pause und Zurücksetzen. Das ersetzt
 * seine frühere Antwort „RED-MGT angepasst" (E772).
 *
 *   §1 Der Schalter ist eine echte Checkbox mit role="switch",
 *      `data-a="simulation"`, deutsch beschriftet („AUS"/„EIN"), mindestens
 *      44 px hoch; Klick und Leertaste schalten, der Fokus bleibt.
 *   §2 Das Labor erscheint nur mit Strom. Seine Uhr läuft mit einem
 *      Zeitrelais, 4× schneller als 1×, steht in der Pause still und fängt
 *      nach „Reset" bei null an. Ohne Zeitrelais zeigt sie „—" und es läuft
 *      kein Takt (E528, test630 §3).
 *   §3 Die Endlos-Lichtnaht läuft nur, wo Bewegung erwünscht ist: mit
 *      `prefers-reduced-motion` und mit „Ruhige Darstellung" steht sie.
 *   §4 Die 1:1-Ansicht zeigt den Schalter in Originalgrösse (330 × 180).
 *
 * Gegen den Stand vor E772 (a6472d3f7) rot: dort ist der Strom ein
 * <button> „▶ Strom", und es gibt kein Labor.
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
  await s.waitForSelector('.sp-wrap .red-mgt-input');
};
const schalter = () => s.locator('.sp-wrap .red-mgt-input[data-a="simulation"]').first();
const laborOffen = () => s.evaluate(() => !(document.querySelector('.sp-wrap .sp-live-labor') as HTMLElement | null)?.hidden);
const uhr = async (): Promise<number> => {
  const t = await s.evaluate(() => document.querySelector('.sp-wrap [data-labor-uhr]')?.textContent ?? '');
  return t.includes('s') ? Number(t.replace(/[^0-9.]/g, '')) : NaN;
};

/* ══ §1 ════════════════════════════════════════════════════════════════════ */
console.log('\n§1 Der Schalter');
await oeffne(true);
gleich('Kein alter <button> „▶ Strom" mehr', await s.locator('.sp-wrap button[data-a="simulation"]').count(), 0);
gleich('Eine Checkbox mit role="switch", aus', await schalter().evaluate((i: HTMLInputElement) =>
  [i.type, i.getAttribute('role'), i.getAttribute('aria-checked'), i.checked]), ['checkbox', 'switch', 'false', false]);
gleich('Die Wörter sind deutsch', await s.locator('.sp-wrap .red-mgt-state').allTextContents(), ['AUS', 'EIN']);
const gross = await s.locator('.sp-wrap .red-mgt-area.sp-start').boundingBox();
p('In der Leiste mindestens 44 px hoch (§37)', !!gross && gross.height >= 44, JSON.stringify(gross));
const zuvor = await s.locator('.sp-wrap [data-a="bereiche"]').boundingBox();
p('Das ausgefahrene Gehäuse liegt nicht über „Bereiche"', !!gross && !!zuvor &&
  await s.evaluate(([x, y]) => !document.elementFromPoint(x, y)?.closest('.red-mgt-area'), [zuvor!.x + zuvor!.width - 4, zuvor!.y + zuvor!.height / 2] as [number, number]));
gleich('Vor dem Strom kein Labor', await laborOffen(), false);
await schalter().click();
await s.waitForTimeout(250);
gleich('Klick: Strom ein, aria-checked, Labor da', [await schalter().getAttribute('aria-checked'), await laborOffen()], ['true', true]);
await schalter().focus();
await s.keyboard.press('Space');
await s.waitForTimeout(250);
gleich('Leertaste: wieder aus, und der Fokus bleibt am Schalter', [await schalter().getAttribute('aria-checked'),
  await s.evaluate(() => document.activeElement?.classList.contains('red-mgt-input'))], ['false', true]);

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
console.log('\n§3 Die Lichtnaht und weniger Bewegung');
await schalter().click();
await s.waitForTimeout(200);
const naht = () => s.evaluate(() => {
  const n = document.querySelector('.sp-wrap .red-mgt-line') as HTMLElement;
  const c = getComputedStyle(n);
  return c.animationName + ' ' + c.animationIterationCount;
});
gleich('Ausgeschaltet läuft die Lichtnaht endlos', await naht(), 'red-mgt-line infinite');
await s.emulateMedia({ reducedMotion: 'reduce' });
p('Mit „weniger Bewegung" steht sie', (await naht()).startsWith('none'), await naht());
await s.emulateMedia({ reducedMotion: 'no-preference' });
await s.evaluate(() => document.body.setAttribute('data-bewegung', 'ruhig'));
p('Mit „Ruhige Darstellung" steht sie auch', (await naht()).startsWith('none'), await naht());
await s.evaluate(() => document.body.removeAttribute('data-bewegung'));

/* ══ §4 ════════════════════════════════════════════════════════════════════ */
console.log('\n§4 Die 1:1-Ansicht');
await s.locator('.sp-wrap [data-a="original-schalter"]').click();
await s.waitForTimeout(300);
const voll = await s.locator('.sp-wrap .red-mgt-area.sp-start').boundingBox();
p('Der Schalter steht in Originalgrösse da (330 × 180)', !!voll && Math.round(voll.width) === 330 && Math.round(voll.height) === 180, JSON.stringify(voll));
await s.locator('.sp-wrap [data-a="original-schalter"]').click();

gleich('Keine Fehler', fehler, []);
await browser.close();
console.log(`\n${ok} bestanden, ${weg} nicht bestanden`);
process.exit(weg ? 1 : 0);
