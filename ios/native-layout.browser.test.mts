/*
 * Native iPhone CSS against the real Redion HTML and shipped stylesheet order.
 * Chromium approximates mobile WebKit layout. It does NOT prove SwiftUI or
 * a physical iPhone. No credentials, user files or cloud operations.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { IOS_LAYOUT_CSS } from './native-layout.mts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexUrl = pathToFileURL(path.join(root, 'index.html')).href;

for (const width of [390, 428]) {
  test('Native iPhone-Layout bei ' + width + 'pt: Kopf, Aktionen, Termine', async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({
        viewport: { width, height: 844 },
        deviceScaleFactor: 3, isMobile: true, hasTouch: true,
        reducedMotion: 'reduce'
      });
      const page = await context.newPage();
      await page.goto(indexUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#main > #topbar', { state: 'attached' });
      assert.equal(await page.evaluate(() => matchMedia('(pointer:coarse)').matches), true);

      // Emulate a nonzero notch/padding before iOS inserts its later CSS.
      await page.addStyleTag({ content: '#topbar{padding-top:47px;height:97px}' });
      await page.addStyleTag({ content: IOS_LAYOUT_CSS });

      const head = await page.locator('#main > #topbar').evaluate(el => {
        const s=getComputedStyle(el);
        const button=el.querySelector('.top-btn');
        return {
          top:s.paddingTop, height:s.height, minButton:button ? getComputedStyle(button).minHeight : '',
          width:document.documentElement.scrollWidth, viewport:innerWidth
        };
      });
      assert.equal(head.top, '0px', 'Keine doppelte Notch-Safe-Area.');
      assert.equal(head.height, '50px', 'Kompakter iPhone-Kopf.');
      assert.ok(parseFloat(head.minButton) >= 44, 'Touch-Ziel muss >= 44pt sein.');
      assert.ok(head.width <= head.viewport + 1, 'Keine horizontale Seitenueberbreite.');

      // Use exactly Redion's existing .home and .home-karten selectors.
      await page.evaluate(() => {
        const root=document.querySelector('#page');
        if (!root) throw Error('Redion Seite fehlt');
        root.innerHTML='<div class="home"><h1>Termine</h1><div class="home-karten">' +
          '<button class="hk"><b>Kalender</b><span>Alle Termine</span></button>' +
          '<button class="hk"><b>Kalender verbinden</b><span>Kalender einrichten</span></button>' +
          '<button class="hk"><b>Besprechung</b><span>Notizen</span></button></div></div>';
      });
      const cards = await page.locator('#page .home-karten .hk').evaluateAll(items =>
        items.map(el => { const r=el.getBoundingClientRect();
          return { x:r.x,y:r.y,width:r.width,height:r.height };
        })
      );
      assert.equal(cards.length, 3);
      assert.ok(cards.every(c=>c.width>260), 'Die Kartentexte bleiben lesbar.');
      assert.ok(cards[1]!.y>=cards[0]!.y+cards[0]!.height-1,
        'Terminkarten muessen untereinander stehen.');
      assert.ok(cards[2]!.y>=cards[1]!.y+cards[1]!.height-1);
      await context.close();
    } finally { await browser.close(); }
  });
}

test('Tablet/Desktop bekommt keine iPhone-Safe-Area-Korrektur', async () => {
  const browser=await chromium.launch({headless:true});
  try {
    const context=await browser.newContext({
      viewport:{width:820,height:1024},isMobile:true,hasTouch:true
    });
    const page=await context.newPage();
    await page.goto(indexUrl,{waitUntil:'domcontentloaded'});
    await page.addStyleTag({content:IOS_LAYOUT_CSS});
    const height=await page.locator('#main > #topbar').evaluate(el=>getComputedStyle(el).height);
    assert.notEqual(height,'50px','Die 760px-Grenze muss respektiert werden.');
    await context.close();
  } finally {await browser.close();}
});
