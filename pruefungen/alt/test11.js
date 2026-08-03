const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED/.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);
  const esc=async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(200);};

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  // Datenbank-Tabelle: Auswahl
  ok('Auswahlspalte da', await p.locator('table.grid th.th-aus').count() === 1);
  ok('Zeilennummern', await p.locator('.zeilen-nr').count() >= 3);
  await p.locator('table.grid tbody tr').first().hover();
  await p.locator('input.zeilen-aus').first().check({ force: true });
  await p.waitForTimeout(400);
  ok('Sammelleiste erscheint', await p.locator('#sammelleiste').count() === 1);
  await p.locator('table.grid tbody tr').nth(1).hover();
  await p.locator('input.zeilen-aus').nth(1).check({ force: true });
  await p.waitForTimeout(300);
  ok('Zähler zeigt 2', (await p.locator('#sammelleiste b').textContent()) === '2');
  await p.click('#sammelleiste [data-a="dup"]');
  await p.waitForTimeout(700);
  ok('Sammel-Duplizieren', await p.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    return Store.rowsOf(c.id).filter(r => (r.text||'').includes('(Kopie)')).length === 2;
  }));

  // Spalte fixieren im Menü
  await p.locator('table.grid th').nth(2).click();
  await p.waitForTimeout(350);
  ok('Spalte fixieren im Menü', await p.locator('.menu button[data-a="fix"]').count() === 1);
  await p.click('.menu button[data-a="fix"]');
  await p.waitForTimeout(500);
  ok('Spalte ist fixiert', await p.locator('table.grid th.fixiert').count() === 1);

  // Einfache Tabelle mit Griffen
  const ct = p.locator('#page .b-text .ct').last();
  await ct.click(); await p.keyboard.press('End');
  await p.keyboard.type('/Einfache');
  await p.waitForTimeout(400);
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  ok('Einfache Tabelle da', await p.locator('table.stab').count() === 1);
  await p.locator('table.stab td, table.stab th').nth(1).hover();
  await p.waitForTimeout(300);
  ok('Griffe erscheinen', await p.locator('.stab-griff.da').count() === 2);
  await p.click('.stab-griff.x');
  await p.waitForTimeout(350);
  const spm = await p.locator('.menu button[data-a]').count();
  ok('Spaltenmenü (' + spm + ' Einträge)', spm >= 7);
  await p.click('.menu button[data-a="rechts"]');
  await p.waitForTimeout(600);
  ok('Spalte eingefügt (4 statt 3)', await p.evaluate(() => {
    const b2 = Object.values(Store.cache.blocks).find(x => x.type === 'table');
    return b2.rows[0].length === 4;
  }));
  await p.locator('table.stab td').nth(4).hover();
  await p.waitForTimeout(250);
  await p.click('.stab-griff.y');
  await p.waitForTimeout(350);
  const zem = await p.locator('.menu button[data-a]').count();
  ok('Zeilenmenü (' + zem + ' Einträge)', zem >= 8);
  await p.click('.menu button[data-a="unten"]');
  await p.waitForTimeout(600);
  ok('Zeile eingefügt (4 statt 3)', await p.evaluate(() => {
    const b2 = Object.values(Store.cache.blocks).find(x => x.type === 'table');
    return b2.rows.length === 4;
  }));

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(f.length ? 'FEHLER:\n'+[...new Set(f)].slice(0,6).join('\n') : 'Keine JS-Fehler.');
})();
