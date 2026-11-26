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
import { IOS_LAYOUT_CSS, IOS_PHONE_POLISH_CSS, IOS_DOCUMENT_POLISH_CSS, IOS_DRAWING_POLISH_CSS } from './native-layout.mts';

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

test('iPhone premium polish overrides existing Today typography and keeps actions tappable', async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page = await context.newPage();
    await page.goto(indexUrl,{waitUntil:'domcontentloaded'});
    await page.addStyleTag({content:IOS_LAYOUT_CSS + IOS_PHONE_POLISH_CSS});
    const result=await page.evaluate(() => {
      document.body.dataset.schale='premium';
      delete document.body.dataset.uiShell;
      delete document.documentElement.dataset.schema;
      const root=document.querySelector('#page')!;
      root.className='lernwelt';
      root.innerHTML='<div class="lw-today"><section class="lw-hero lw-hero-compact"><div><p>Heute</p><h2>Guten Abend.</h2></div><div class="lw-goal"><button><span>0 / 20</span><small>Lernziel heute</small></button><progress max="100" value="0"></progress></div></section><section class="lw-next-step"><span class="lw-next-icon"></span><div><h2>22 Karten für heute</h2></div><div class="lw-actions"><button>Lernen starten</button><button>Lernplan ansehen</button></div></section></div>';
      // Measure in the same JS task: the real application's asynchronous
      // startup can replace #page between two independent Playwright calls.
      const el=root.querySelector('.lw-hero-compact')!;
      const heading=el.querySelector('h2')!;
      const button=el.querySelector('button')!;
      return {font:getComputedStyle(heading).fontFamily,height:button.getBoundingClientRect().height,padding:getComputedStyle(el).paddingTop};
    });
    assert.match(result.font,/-apple-system/);
    assert.equal(result.padding,'12px');
    assert.ok(result.height>=44);
    await context.close();
  } finally {await browser.close();}
});

test('iPhone library stays compact with long names and accessible actions', async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page = await context.newPage();
    await page.goto(indexUrl,{waitUntil:'domcontentloaded'});
    await page.addStyleTag({content:IOS_LAYOUT_CSS + IOS_PHONE_POLISH_CSS});
    const result=await page.evaluate(() => {
      document.body.dataset.schale='premium';
      delete document.body.dataset.uiShell;
      delete document.documentElement.dataset.schema;
      const root=document.querySelector('#page')!;
      root.innerHTML='<div class="bib" data-bib-bereich="dokumente"><header class="bib-dkopf"><h1>Dokumente</h1><div class="bib-workspace-actions"><button class="bib-neu">Neue Seite</button><button class="bib-studio-import">PDF importieren</button></div></header><div class="bib-gitter"><div class="bib-deckel"><div class="bib-deckel-name"><b>ArbeitssicherheitundChemiefürElektroberufe</b></div></div><div class="bib-deckel">Notizen</div></div></div>';
      const head=root.querySelector('.bib-dkopf')!;
      const grid=root.querySelector('.bib-gitter')!;
      return {padding:getComputedStyle(head).paddingTop,
        cols:getComputedStyle(grid).gridTemplateColumns,
        heights:[...head.querySelectorAll('button')].map(b=>b.getBoundingClientRect().height)};
    });
    assert.equal(result.padding,'14px');
    assert.notEqual(result.cols,'none');
    assert.ok(result.heights.every(h=>h>=44));
    await context.close();
  } finally {await browser.close();}
});

test('iPhone settings and search stay within the visible keyboard viewport', async () => {
  const browser = await chromium.launch({headless:true});
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    await page.goto(indexUrl,{waitUntil:'domcontentloaded'});
    await page.addStyleTag({content:IOS_LAYOUT_CSS+IOS_PHONE_POLISH_CSS});
    const result=await page.evaluate(()=>{
      document.documentElement.style.setProperty('--visual-height','420px');
      document.documentElement.style.setProperty('--visual-bottom','424px');
      const wrap=document.createElement('div');
      wrap.className='overlay';
      wrap.innerHTML='<div class="einst-fenster" data-blick="liste"><nav class="einst-nav"><input class="einst-suche"><div class="einst-karte"><button>Darstellung</button></div></nav></div>';
      document.body.append(wrap);
      const settings=wrap.querySelector('.einst-fenster')!;
      const button=wrap.querySelector('button')!;
      const input=wrap.querySelector('input')!;
      const dimensions={settings:settings.getBoundingClientRect().height,button:button.getBoundingClientRect().height,input:input.getBoundingClientRect().height};
      wrap.innerHTML='<div class="finder such"><input id="q"><div class="such-koerper"><div class="res"></div></div></div>';
      const finder=wrap.querySelector('.finder')!;
      return {...dimensions,searchMax:getComputedStyle(finder).maxHeight};
    });
    assert.ok(result.settings<=420);
    assert.ok(result.button>=48);
    assert.ok(result.input>=48);
    assert.equal(result.searchMax,'404px');
    await context.close();
  } finally {await browser.close();}
});

for (const viewport of [{width:390,height:844},{width:844,height:390}]) {
  test('iPhone PDF controls remain reachable at '+viewport.width+'x'+viewport.height, async () => {
    const browser=await chromium.launch({headless:true});
    try {
      const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
      const page=await context.newPage();
      await page.goto(indexUrl,{waitUntil:'domcontentloaded'});
      await page.addStyleTag({content:IOS_LAYOUT_CSS+IOS_PHONE_POLISH_CSS+IOS_DOCUMENT_POLISH_CSS});
      const result=await page.evaluate(()=>{
        document.body.dataset.dokument='an';
        document.documentElement.style.setProperty('--visual-height','300px');
        const studio=document.createElement('section');
        studio.className='document-studio';
        studio.dataset.documentView='open';
        studio.innerHTML='<div class="document-topbar"><button aria-label="Zurück">‹</button><div class="document-title"><span class="document-title-name">Arbeitssicherheit und Chemie für Elektroberufe</span></div></div><div class="document-commandbar"><div class="document-pagination"><button class="document-position">Seite 1/10</button></div></div><div class="document-findbar"><input type="search"><button>✕</button></div>';
        document.body.append(studio);
        const top=studio.querySelector('.document-topbar button')!;
        const menu=studio.querySelector('.document-commandbar')!;
        const search=studio.querySelector('.document-findbar input')!;
        return {coarse:matchMedia('(pointer:coarse)').matches,topHeight:getComputedStyle(top).minHeight,menuMax:getComputedStyle(menu).maxHeight,inputFont:getComputedStyle(search).fontSize};
      });
      assert.equal(result.coarse,true);
      assert.equal(result.topHeight,'44px');
      assert.equal(result.menuMax,'196px');
      assert.equal(result.inputFont,'16px');
      await context.close();
    } finally {await browser.close();}
  });
}

test('iPhone drawing menu and inspector remain bounded by visible viewport', async () => {
  const browser=await chromium.launch({headless:true});
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    await page.goto(indexUrl,{waitUntil:'domcontentloaded'});
    await page.addStyleTag({content:IOS_DRAWING_POLISH_CSS});
    const result=await page.evaluate(()=>{
      document.documentElement.style.setProperty('--visual-height','320px');
      const root=document.createElement('div');
      root.innerHTML='<div class="gfx-tb-edgeless"><div class="gfx-tb-menue"><div class="gfx-tb-menuewerkzeuge"><button>Stift</button></div></div></div><div class="gfx-inspector"><button>Ebene</button></div>';
      document.body.append(root);
      const menu=root.querySelector('.gfx-tb-menue')!;
      const inspector=root.querySelector('.gfx-inspector')!;
      const button=menu.querySelector('button')!;
      return {menuMax:getComputedStyle(menu).maxHeight,inspectorMax:getComputedStyle(inspector).maxHeight,buttonMin:getComputedStyle(button).minHeight};
    });
    assert.equal(result.menuMax,'150px');
    assert.equal(result.inspectorMax,'240px');
    assert.equal(result.buttonMin,'44px');
    await context.close();
  } finally {await browser.close();}
});
