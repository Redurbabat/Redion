/* Suite 657 — Die Knöpfe im Kopf der Bibliothek zeigen ihr ganzes Wort (E819)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Am Telefon (390 px) stand im Kopf der Bibliothek
 * „+ PDF öffne" — das „n" lag hinter dem Rand des Knopfs, und `overflow:
 * hidden` aus `studio.css` (der Lichtstreif) schnitt es ab. Gesehen am
 * 25. November 2026 im BILD (§55.1). Der Grund: die Atelier-Haut (PR #220)
 * legt die drei Knöpfe am Telefon in ein Raster mit GLEICH breiten Spalten
 * (`repeat(auto-fit, minmax(…, 1fr))`); drei Drittel von 330 px sind 97 px,
 * „+ PDF öffnen" braucht rund 110.
 *
 *   §1 GANZES WORT. Bei 320, 360, 390 und 430 px: in jedem Knopf der Zeile
 *      endet der Text innerhalb des Innenrands (Text gemessen über einen
 *      Bereich, nicht über `scrollWidth` — der misst bei Flex nichts, §55.2).
 *   §2 TREFFBAR UND IM BILD. Jeder Knopf ist ≥ 44 px hoch (§37) und liegt
 *      ganz im Fenster.
 *
 * ─── KANN DIESER LAUF ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja: gegen den Stand mit dem Raster ist §1 bei 390 px rot („PDF öffnen"
 * 13 px über dem Innenrand).
 *
 * Er lädt über file://, damit `test400` keinen neuen Port zählt.
 *
 *   node pruefungen/lauf/test657.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

declare const Store: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
try {
  for (const breite of [320, 360, 390, 430]) {
    console.log(`\n§1/§2 bei ${breite} px`);
    const ctx = await browser.newContext({ viewport: { width: breite, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    const seite = await ctx.newPage();
    await seite.goto(pathToFileURL(path.join(WURZEL, 'index.html')).href);
    await seite.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache, null, { timeout: 30000 });
    await seite.waitForTimeout(1200);
    await seite.evaluate(() => {
      document.querySelectorAll('[role=dialog],.overlay').forEach(e => e.remove());
      document.querySelectorAll('[inert]').forEach(e => e.removeAttribute('inert'));
    });
    await seite.waitForTimeout(300);
    const knoepfe = await seite.evaluate(() => [...document.querySelectorAll<HTMLElement>('.bib-workspace-actions button')]
      .filter(k => k.offsetParent).map(k => {
        const rg = document.createRange(); rg.selectNodeContents(k);
        const t = rg.getBoundingClientRect(); const b = k.getBoundingClientRect(); const cs = getComputedStyle(k);
        return { name: (k.textContent || k.getAttribute('aria-label') || '').trim(),
          ueber: t.right - (b.right - parseFloat(cs.paddingRight)), links: b.left, rechts: b.right, hoehe: b.height };
      }));
    p('Knöpfe im Kopf gefunden', knoepfe.length >= 2, String(knoepfe.length));
    for (const k of knoepfe) {
      p(`„${k.name}" zeigt das ganze Wort`, k.ueber <= 0.5, `${k.ueber.toFixed(1)} px über dem Innenrand`);
      p(`„${k.name}" ist ≥ 44 px hoch und im Bild`, k.hoehe >= 43.5 && k.links >= -0.5 && k.rechts <= breite + 0.5,
        `${k.hoehe.toFixed(0)} px hoch, ${k.links.toFixed(0)}…${k.rechts.toFixed(0)}`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
