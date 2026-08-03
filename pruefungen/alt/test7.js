const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const fehler = [];
  page.on('pageerror', e => fehler.push('PAGEERROR: '+e.message));
  page.on('console', m => { if (m.type()==='error' && !/11434|CONNECTION_REFUSED/.test(m.text())) fehler.push('CONSOLE: '+m.text()); });
  const pruef = []; const ok=(n,b)=>pruef.push([n,!!b]);
  const esc = async()=>{await page.keyboard.press('Escape');await page.waitForTimeout(250);};

  await page.goto('file://' + WURZEL + '/index.html');
  await page.waitForTimeout(1400);

  // Toggle-Überschrift
  let ct = page.locator('#page .b-text .ct').last();
  await ct.click(); await page.keyboard.press('End');
  await page.keyboard.type('/toggle h2');
  await page.waitForTimeout(450);
  ok('Toggle-Überschrift im Menü', await page.locator('.menu button[data-t="toggle-h2"]').count() === 1);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  ok('Klapp-Pfeil an der Überschrift', await page.locator('.b-h2 .kopf-mk').count() >= 1);

  // Strg+Enter hakt Aufgabe ab
  await page.locator('#page .b-todo .ct').first().click();
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(500);
  ok('Strg+Enter hakt ab', await page.locator('#page .b-todo.done').count() === 1);

  // Seitenleiste ziehen
  const vorher = await page.evaluate(() => document.getElementById('sidebar').getBoundingClientRect().width);
  const g = await page.locator('#side-griff').boundingBox();
  await page.mouse.move(g.x + 3, g.y + 300);
  await page.mouse.down();
  await page.mouse.move(g.x + 90, g.y + 300, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const nachher = await page.evaluate(() => document.getElementById('sidebar').getBoundingClientRect().width);
  ok('Seitenleiste breiter gezogen (' + vorher + ' → ' + nachher + ')', nachher > vorher + 40);

  // Spaltenbreite ziehen
  const th = await page.locator('table.grid th').nth(1).boundingBox();
  const b0 = th.width;
  await page.mouse.move(th.x + th.width - 1, th.y + th.height / 2);
  await page.mouse.down();
  await page.mouse.move(th.x + th.width + 70, th.y + th.height / 2, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const b1 = (await page.locator('table.grid th').nth(1).boundingBox()).width;
  ok('Spalte breiter gezogen (' + Math.round(b0) + ' → ' + Math.round(b1) + ')', b1 > b0 + 30);

  // Unterelement
  await page.locator('table.grid tbody tr').first().click({ button: 'right' });
  await page.waitForTimeout(400);
  await page.click('.menu button[data-a="unter"]');
  await page.waitForTimeout(600);
  ok('Unterelement eingerückt', await page.locator('table.grid tr.unterzeile').count() === 1);

  // CSV einlesen
  const fs = require('fs');
  fs.writeFileSync('/tmp/test-import.csv', 'Aufgabe,Notiz\nAus CSV eins,alpha\nAus CSV zwei,beta\n');
  await page.click('.db-tools button[data-a="menu"]');
  await page.waitForTimeout(350);
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.click('.menu button[data-a="csvin"]')
  ]);
  await chooser.setFiles('/tmp/test-import.csv');
  await page.waitForTimeout(900);
  ok('CSV eingelesen', await page.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    return Store.rowsOf(c.id).filter(r => (r.text||'').startsWith('Aus CSV')).length === 2;
  }));
  ok('CSV-Spalte angelegt', await page.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    return Object.values(c.schema).some(d => d.name === 'Notiz');
  }));

  // Seitenaufrufe
  const aufrufe = await page.evaluate(() => Store.getBlock(App.aktuelleSeite()).aufrufe || 0);
  ok('Seitenaufrufe gezählt (' + aufrufe + ')', aufrufe >= 1);

  // Befehlspalette: Vollständigkeit
  await page.keyboard.press('Control+Shift+P');
  await page.waitForTimeout(450);
  const anz = await page.locator('.overlay .res button').count();
  ok('Befehlspalette (' + anz + ' Befehle)', anz >= 60);
  await esc();

  await browser.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,b])=>{console.log((b?'✅':'❌')+' '+n); if(b)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(fehler.length ? '\nFEHLER:\n' + [...new Set(fehler)].slice(0,8).join('\n') : 'Keine JS-Fehler.');
})();
