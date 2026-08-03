const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const fehler = [];
  page.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type()==='error' && !/11434|CONNECTION_REFUSED/.test(m.text())) fehler.push('CONSOLE: '+m.text()); });
  const pruef = []; const ok = (n,b)=>pruef.push([n,!!b]);
  const esc = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); };

  await page.goto('file://' + WURZEL + '/index.html');
  await page.waitForTimeout(1400);

  ok('Datenbank da', await page.locator('.db').count() === 1);
  ok('Tabelle zeigt 3 Zeilen', await page.locator('table.grid tbody tr').count() === 4);

  // Side Peek
  await page.locator('table.grid td.tt .tt-t').first().click();
  await page.waitForTimeout(500);
  ok('Seitenvorschau offen', await page.locator('.peek').count() === 1);
  ok('Vorschau zeigt Eigenschaften', await page.locator('.peek-prop').count() >= 4);
  ok('Vorschau hat Titel', (await page.locator('.peek-titel').textContent()).length > 3);
  await page.click('.peek-kopf [data-a="zu"]');
  await page.waitForTimeout(300);

  // Rechtsklick-Menü
  await page.locator('table.grid tbody tr').first().click({ button: 'right' });
  await page.waitForTimeout(400);
  const zm = await page.locator('.menu button[data-a]').count();
  ok('Zeilenmenü (' + zm + ' Einträge)', zm >= 10);
  await esc();

  // Neue Ansicht: Zeitstrahl
  await page.locator('.db-tab', { hasText: '+' }).click();
  await page.waitForTimeout(350);
  ok('Ansichtsmenü hat 11 Typen', await page.locator('.menu button[data-l]').count() === 11);
  await page.click('.menu button[data-l="timeline"]');
  await page.waitForTimeout(600);
  ok('Zeitstrahl gezeichnet', await page.locator('.zs-balken').count() === 3);
  ok('Zeitstrahl-Kopf mit Monaten', await page.locator('.zs-kopf span').count() >= 1);

  // Diagrammansicht
  await page.locator('.db-tab', { hasText: '+' }).click();
  await page.waitForTimeout(350);
  await page.click('.menu button[data-l="chart"]');
  await page.waitForTimeout(600);
  ok('Diagrammansicht', await page.locator('.db-chart .chart-svg').count() === 1);
  ok('Diagramm-Legende', await page.locator('.db-chart .chart-legende span').count() >= 2);

  // Formularansicht
  await page.locator('.db-tab', { hasText: '+' }).click();
  await page.waitForTimeout(350);
  await page.click('.menu button[data-l="form"]');
  await page.waitForTimeout(600);
  ok('Formular gezeichnet', await page.locator('.db-form .form-feld').count() >= 3);
  await page.fill('.form-feld input[type="text"]', 'Aus dem Formular');
  await page.click('[data-a="senden"]');
  await page.waitForTimeout(600);
  ok('Formular legt Eintrag an', await page.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    return Store.rowsOf(c.id).some(r => r.text === 'Aus dem Formular');
  }));

  // Zurück zur Tabelle
  await page.locator('.db-tab', { hasText: 'Tabelle' }).first().click();
  await page.waitForTimeout(500);
  ok('Tabelle wieder da', await page.locator('table.grid').count() === 1);

  // Neue Eigenschaften: Verknüpfung, Rollup, laufende Nummer, KI
  const angelegt = await page.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    // Zweite Datenbank für die Verknüpfung
    const seite = App.aktuelleSeite();
    const { collectionId } = Store.addDatabase(seite, 'Projekte', {
      title: { name: 'Projekt', type: 'title' },
      bud: { name: 'Budget', type: 'number' }
    }, 'table');
    const p1 = Store.addRow(collectionId, { bud: 1000 }); Store.updateBlock(p1.id, { text: 'Website' });
    const p2 = Store.addRow(collectionId, { bud: 2500 }); Store.updateBlock(p2.id, { text: 'App' });

    c.schema.rel = { name: 'Projekt', type: 'relation', ziel: collectionId };
    c.schema.rol = { name: 'Budget gesamt', type: 'rollup', relation: 'rel', zielKey: 'bud', rollup: 'Summe' };
    c.schema.nr  = { name: 'Nummer', type: 'uid', praefix: 'AUF' };
    Store.updateCollection(c.id, { schema: c.schema });

    const zeilen = Store.rowsOf(c.id);
    Store.setProp(zeilen[0].id, 'rel', [p1.id, p2.id]);
    App.zeichneSeite();
    return { coll: c.id, erste: zeilen[0].id };
  });
  await page.waitForTimeout(700);
  ok('Verknüpfung als Chips', await page.locator('table.grid .tag.bg-blue').count() >= 2);
  const rollup = await page.evaluate((d) => {
    const c = Store.getCollection(d.coll);
    return Datenbank.wert(Store.getBlock(d.erste), 'rol', c);
  }, angelegt);
  ok('Rollup rechnet Summe (' + rollup + ')', rollup === 3500);
  const uid = await page.evaluate((d) => {
    const c = Store.getCollection(d.coll);
    return Datenbank.wert(Store.getBlock(d.erste), 'nr', c);
  }, angelegt);
  ok('Laufende Nummer (' + uid + ')', uid === 'AUF-1');

  // Spaltenmenü im vollen Umfang
  await page.locator('table.grid th').nth(2).click();
  await page.waitForTimeout(400);
  const sm = await page.locator('.menu button[data-a]').count();
  ok('Spaltenmenü (' + sm + ' Einträge)', sm >= 12);
  await esc();

  // Datenbankmenü
  await page.click('.db-tools button[data-a="menu"]');
  await page.waitForTimeout(400);
  const dm = await page.locator('.menu button[data-a]').count();
  ok('Datenbankmenü (' + dm + ' Einträge)', dm >= 12);
  await esc();

  // Optionen-Editor
  await page.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    Datenbank.formelEditor && null;
    const key = Object.keys(c.schema).find(k => c.schema[k].type === 'status');
    window.__key = key;
  });
  await page.locator('table.grid th').nth(2).click();
  await page.waitForTimeout(300);
  const hatOptionen = await page.locator('.menu button[data-a="optionen"]').count();
  ok('Optionen-Eintrag im Menü', hatOptionen === 1);
  if (hatOptionen) {
    await page.click('.menu button[data-a="optionen"]');
    await page.waitForTimeout(400);
    ok('Optionen-Editor zeigt Farben', await page.locator('.opt-farben button').count() >= 9);
    await esc();
  }

  // Persistenz
  await page.evaluate(() => Store.flush());
  await page.waitForTimeout(500);
  await page.reload();
  await page.waitForTimeout(1500);
  ok('Nach Neuladen: Ansichten erhalten', await page.locator('.db-tab').count() >= 5);

  await browser.close();
  console.log('\n=== ERGEBNIS ===');
  let gut = 0;
  pruef.forEach(([n,b])=>{console.log((b?'✅':'❌')+' '+n); if(b)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  if (fehler.length) { console.log('\n=== JS-FEHLER ==='); [...new Set(fehler)].slice(0,12).forEach(f=>console.log(f)); }
  else console.log('Keine JS-Fehler.');
})();
