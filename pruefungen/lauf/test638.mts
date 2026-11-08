/* Suite 638 – Touch-Flaechen fuer Schaltplan-Palette und Kontextleiste.
 *
 * Dieser Test laedt das echte Stilblatt, nicht kopierte CSS-Regeln.
 * Browser-Emulation: 320 und 390 px, coarse touch und Desktop-Pointer.
 *
 *   node pruefungen/lauf/test638.mts
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const css = path.join(root, 'quell/schale/stil/schaltatelier.css');

const html = `<!doctype html>
<html lang="de"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0">
  <main class="sp-wrap" style="width:100%;min-height:400px;position:relative">
    <section class="sp-palette sp-pal-kompakt" style="position:relative">
      <div class="sp-pal-header-actions">
        <button type="button" data-p-compact>Kompakt</button>
        <button type="button" class="sp-pal-schliessen">×</button>
      </div>
    </section>
    <div class="sp-kontextleiste">
      <span class="sp-kontext-titel">Auswahl</span>
      <button>1</button><button>2</button><button>3</button>
      <button>4</button><button>5</button><button>6</button>
    </div>
  </main>
</body></html>`;

const browser = await chromium.launch();
try {
  for (const breite of [320, 390]) {
    await test(`Touch ${breite}px: alle kritischen Ziele mindestens 44 CSS-Pixel`, async () => {
      const context = await browser.newContext({
        viewport: { width: breite, height: 760 }, isMobile: true, hasTouch: true
      });
      try {
        const page = await context.newPage();
        await page.setContent(html);
        await page.addStyleTag({ path: css });
        const mass = await page.evaluate(() => {
          const q = (s: string) => document.querySelector<HTMLElement>(s)!;
          const m = (s: string) => {
            const r = q(s).getBoundingClientRect();
            return { width: r.width, height: r.height };
          };
          const bar = q('.sp-kontextleiste');
          const b = bar.getBoundingClientRect();
          return {
            coarse: matchMedia('(hover: none) and (pointer: coarse)').matches,
            close: m('.sp-pal-schliessen'),
            compact: m('[data-p-compact]'),
            actions: [...bar.querySelectorAll('button')].map(el => {
              const r = el.getBoundingClientRect();
              return { width: r.width, height: r.height };
            }),
            bar: {
              left: b.left, right: b.right, client: bar.clientWidth,
              scroll: bar.scrollWidth,
              overflow: getComputedStyle(bar).overflowX
            }
          };
        });
        assert.equal(mass.coarse, true, 'Der Browser muss Touch mit coarse pointer emulieren');
        for (const [name, value] of [['Schliessen', mass.close], ['Kompakt', mass.compact]] as const) {
          assert.ok(value.width >= 44 && value.height >= 44,
            `${name}: ${value.width}x${value.height}px`);
        }
        for (const [i, value] of mass.actions.entries()) {
          assert.ok(value.width >= 44 && value.height >= 44,
            `Kontextaktion ${i + 1}: ${value.width}x${value.height}px`);
        }
        assert.ok(mass.bar.left >= -1 && mass.bar.right <= breite + 1,
          `Kontextleiste muss im ${breite}px-Viewport bleiben`);
        assert.equal(mass.bar.overflow, 'auto',
          'Touch-Kontextleiste muss bei Bedarf horizontal scrollen koennen');
        /* 320 px erzwingen Ueberlauf; bei 390 px passen die Aktionen
           je nach Schriftmetrik bereits hinein. Nicht Scroll-Ueberlauf
           verlangen, wenn keiner notwendig ist. */
        if (breite === 320) assert.ok(mass.bar.scroll > mass.bar.client,
          'Bei 320 px muss die letzte Aktion durch Scrollen erreichbar sein');
        const letzteAktion = await page.evaluate(() => {
          const bar = document.querySelector<HTMLElement>('.sp-kontextleiste')!;
          bar.scrollLeft = bar.scrollWidth;
          const ende = bar.querySelector('button:last-child')!.getBoundingClientRect();
          const rand = bar.getBoundingClientRect();
          return ende.left >= rand.left - 1 && ende.right <= rand.right + 1;
        });
        assert.ok(letzteAktion, 'Die letzte Kontextaktion muss erreichbar sein');
        // Auch die normale (nicht kompakte) Palette braucht grosse Ziele.
        await page.locator('.sp-palette').evaluate(el => el.classList.remove('sp-pal-kompakt'));
        const normal = await page.locator('[data-p-compact]').boundingBox();
        assert.ok(normal && normal.width >= 44 && normal.height >= 44,
          'Umschalter in normaler Palette ebenfalls mindestens 44px');
      } finally {
        await context.close();
      }
    });
  }
  await test('Desktop: Touch-only-Regel greift bei feinem Mauszeiger nicht', async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 760 }, isMobile: false, hasTouch: false
    });
    try {
      const page = await context.newPage();
      await page.setContent(html);
      await page.addStyleTag({ path: css });
      const state = await page.evaluate(() => ({
        coarse: matchMedia('(hover: none) and (pointer: coarse)').matches,
        close: document.querySelector('.sp-pal-schliessen')!.getBoundingClientRect().width
      }));
      assert.equal(state.coarse, false);
      assert.ok(state.close < 44, 'Kompakte Desktop-Palette behält ihre bisherige Dichte');
    } finally {
      await context.close();
    }
  });
} finally {
  await browser.close();
}
