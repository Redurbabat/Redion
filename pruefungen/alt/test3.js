const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const fehler = [];
  page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_CONNECTION_REFUSED|11434/.test(m.text())) fehler.push('CONSOLE: ' + m.text()); });

  const pruef = [];
  const ok = (name, bed) => pruef.push([name, !!bed]);

  await page.goto('file://' + WURZEL + '/index.html');
  await page.waitForTimeout(1400);

  ok('Seite geladen', await page.locator('#title').count() > 0);
  ok('Sidebar Werkzeuge', await page.locator('[data-wz="journal"]').count() === 1);
  ok('Sidebar Befehle', await page.locator('#btn-cmd').count() === 1);
  ok('Topbar Stern', await page.locator('#btn-fav').count() === 1);
  ok('Karteikarte im Beispiel', await page.locator('.fkarte').count() >= 1);

  // Befehlspalette
  await page.keyboard.press('Control+Shift+P');
  await page.waitForTimeout(400);
  const cmdAnz = await page.locator('.overlay .res button').count();
  ok('Befehlspalette offen (' + cmdAnz + ' Befehle)', cmdAnz > 30);
  await page.keyboard.type('graph');
  await page.waitForTimeout(300);
  ok('Befehlssuche filtert', await page.locator('.overlay .res button').count() < cmdAnz);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // Journal
  await page.click('[data-wz="journal"]');
  await page.waitForTimeout(600);
  const titel = await page.locator('#title').textContent();
  ok('Journal angelegt (' + titel + ')', /\d{4}-\d{2}-\d{2}/.test(titel));

  // Schnellnotiz
  await page.click('[data-wz="memos"]');
  await page.waitForTimeout(400);
  await page.fill('#mt', 'Testnotiz mit #test');
  await page.click('#mb');
  await page.waitForTimeout(400);
  ok('Schnellnotiz gespeichert', await page.locator('.memo').count() === 1);
  ok('Heatmap gezeichnet', await page.locator('.heatmap i').count() === 84);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Tags
  await page.click('[data-wz="tags"]');
  await page.waitForTimeout(400);
  ok('Schlagwortregister zeigt #test', (await page.locator('.tagpill').allTextContents()).join(' ').includes('test'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Graph
  await page.click('[data-wz="graph"]');
  await page.waitForTimeout(800);
  ok('Graph gezeichnet', await page.locator('.graph-box canvas').count() === 1);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Wiki-Link anlegen
  await page.click('#btn-home');
  await page.waitForTimeout(400);
  ok('Startseite zeigt Gruss', (await page.locator('.home h1').textContent()).length > 3);
  ok('Startseite Karten', await page.locator('.hk').count() === 4);

  // Zurück zur Willkommensseite
  await page.click('#tree .row >> nth=0');
  await page.waitForTimeout(600);
  if (fehler.length) { console.log('FEHLER BIS HIER:'); fehler.forEach(f=>console.log(f)); }

  // Slash-Menü mit neuen Blöcken
  const letzterBlock = page.locator('#page .b-text .ct').last();
  await letzterBlock.click();
  await page.keyboard.press('End');
  await page.keyboard.type('/whiteboard');
  await page.waitForTimeout(400);
  const wbTreffer = await page.locator('.menu button[data-t="whiteboard"]').count();
  ok('Slash findet Whiteboard', wbTreffer === 1);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  ok('Whiteboard eingefügt', await page.locator('.wb-flaeche').count() === 1);

  // Auf dem Whiteboard zeichnen
  const box = await page.locator('.wb-flaeche').boundingBox();
  await page.mouse.move(box.x + 60, box.y + 60);
  await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + 120, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  ok('Auf Whiteboard gezeichnet', await page.locator('.wb-flaeche path[data-sid]').count() >= 1);

  // Diagramm
  const b2 = page.locator('#page .b-text .ct').last();
  await b2.click();
  await page.keyboard.type('/diagramm');
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  ok('Diagramm eingefügt', await page.locator('.chart').count() === 1);

  // Einfache Tabelle
  await page.locator('#page .blk .ct').last().click().catch(()=>{});
  await page.waitForTimeout(200);

  await browser.close();

  console.log('\n=== ERGEBNIS ===');
  let gut = 0;
  pruef.forEach(([n, b]) => { console.log((b ? '✅' : '❌') + ' ' + n); if (b) gut++; });
  console.log(`\n${gut}/${pruef.length} bestanden`);
  if (fehler.length) { console.log('\n=== FEHLER ==='); fehler.slice(0, 12).forEach(f => console.log(f)); }
  else console.log('Keine JS-Fehler.');
})();
