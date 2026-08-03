const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pruef = []; const ok=(n,x)=>pruef.push([n,!!x]);

  // 1. Speicher gesperrt (wie in einer abgeschotteten Vorschau)
  const p1 = await b.newPage({ viewport: { width: 1300, height: 850 } });
  const f1 = [];
  p1.on('pageerror', e => f1.push(e.message));
  await p1.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { get() { throw new DOMException('nicht erlaubt', 'SecurityError'); } });
  });
  await p1.goto('file://' + WURZEL + '/notizen-einzeldatei.html');
  await p1.waitForTimeout(2000);
  ok('Ohne Speicher: Warnstreifen da', await p1.locator('.banner.warn').count() === 1);
  ok('Ohne Speicher: Seite trotzdem gezeichnet', await p1.locator('#page .blk').count() > 5);
  await p1.click('[data-wz="lernen"]');
  await p1.waitForTimeout(600);
  ok('Ohne Speicher: Knöpfe reagieren', await p1.locator('.overlay').count() === 1);
  await p1.keyboard.press('Escape');
  await p1.waitForTimeout(200);
  await p1.locator('#page .b-text .ct').first().click();
  await p1.keyboard.type(' Test');
  await p1.waitForTimeout(400);
  ok('Ohne Speicher: Tippen geht', (await p1.locator('#page .b-text .ct').first().textContent()).includes('Test'));
  await p1.close();

  // 2. index.html ohne js-Ordner
  const fs = require('fs');
  fs.mkdirSync('/tmp/kaputt', { recursive: true });
  fs.copyFileSync(WURZEL + '/index.html', '/tmp/kaputt/index.html');
  fs.copyFileSync(WURZEL + '/app.css', '/tmp/kaputt/app.css');
  const p2 = await b.newPage();
  await p2.goto('file:///tmp/kaputt/index.html');
  await p2.waitForTimeout(2200);
  ok('Ohne js-Ordner: klare Meldung', await p2.locator('.banner.fehler').count() === 1);
  await p2.close();

  // 3. Normalbetrieb weiterhin
  const p3 = await b.newPage({ viewport: { width: 1300, height: 850 } });
  const f3 = [];
  p3.on('pageerror', e => f3.push(e.message));
  p3.on('console', m => { if (m.type()==='error' && !/11434|CONNECTION_REFUSED/.test(m.text())) f3.push(m.text()); });
  await p3.goto('file://' + WURZEL + '/notizen-einzeldatei.html');
  await p3.waitForTimeout(1800);
  ok('Normal: kein Warnstreifen', await p3.locator('.banner').count() === 0);
  ok('Normal: Seite da', await p3.locator('#page .blk').count() > 5);
  ok('Normal: keine Fehler', f3.length === 0);
  await p3.close();

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  if (f1.length) console.log('Meldungen ohne Speicher:', [...new Set(f1)].slice(0,3).join(' | '));
})();
