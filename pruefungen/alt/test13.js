const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED/.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);
  const esc=async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(250);};

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  // Filter-Editor
  await p.click('.db-tools button[data-a="filter"]');
  await p.waitForTimeout(500);
  ok('Filter-Editor offen', await p.locator('.filter-baum').count() === 1);
  await p.click('[data-a="regel"]');
  await p.waitForTimeout(400);
  ok('Regel angelegt', await p.locator('.fr-zeile').count() === 1);
  await p.click('[data-a="gruppe"]');
  await p.waitForTimeout(400);
  ok('Gruppe angelegt', await p.locator('.fg[data-tiefe="1"]').count() === 1);
  ok('Regeln gesamt 2', await p.locator('.fr-zeile').count() === 2);
  await p.click('.fg[data-tiefe="1"] [data-add-regel]');
  await p.waitForTimeout(400);
  ok('Regel in der Gruppe', await p.locator('.fg[data-tiefe="1"] .fr-zeile').count() === 2);
  const opText = await p.locator('.fg-wurzel .fg-op').textContent();
  await p.click('.fg-wurzel .fg-op');
  await p.waitForTimeout(400);
  ok('UND/ODER umschaltbar (' + opText + ' → ' + await p.locator('.fg-wurzel .fg-op').textContent() + ')',
     (await p.locator('.fg-wurzel .fg-op').textContent()) !== opText);
  await esc();
  await p.waitForTimeout(400);
  ok('Filterzahl in der Leiste', (await p.locator('.db-tools button[data-a="filter"]').textContent()).includes('(3)'));

  // Relative Datumsfilter vorhanden
  const ops = await p.evaluate(() => Datenbank.OPERATOREN.date);
  ok('Relative Datumsfilter (' + ops.length + ')', ops.includes('ist in den letzten 7 Tagen') && ops.includes('ist letzte Woche'));

  // Verschachtelte Auswertung
  const test = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    const r = Store.rowsOf(c.id)[0];
    const st = Object.keys(c.schema).find(k => c.schema[k].type === 'status');
    const gruppe = { operator: 'and', rules: [
      { key: st, op: 'ist nicht', wert: 'Erledigt' },
      { operator: 'or', rules: [
        { key: st, op: 'ist', wert: 'In Arbeit' },
        { key: st, op: 'ist', wert: 'Offen' }
      ]}
    ]};
    return Datenbank.gruppeTrifftZu(r, gruppe, c);
  });
  ok('Verschachtelte Filtergruppe wertet aus', test === true);

  // Wechselseitige Verknüpfung
  const wechsel = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    const seite = App.aktuelleSeite();
    const { collectionId } = Store.addDatabase(seite, 'Projekte', {
      title: { name: 'Projekt', type: 'title' }
    }, 'table');
    const proj = Store.addRow(collectionId, {}); Store.updateBlock(proj.id, { text: 'Website' });
    // Verknüpfung mit Gegenrichtung von Hand einrichten
    const gk = Store.uid().slice(0,5);
    const ziel = Store.getCollection(collectionId);
    ziel.schema[gk] = { name: 'Aufgaben', type: 'relation', ziel: c.id, gegen: 'rel', limit: 0 };
    Store.updateCollection(ziel.id, { schema: ziel.schema });
    c.schema.rel = { name: 'Projekt', type: 'relation', ziel: collectionId, gegen: gk, limit: 1 };
    Store.updateCollection(c.id, { schema: c.schema });

    const auf = Store.rowsOf(c.id)[0];
    Datenbank.relationSetzen(auf, 'rel', c, [proj.id]);
    return {
      hin: (Store.getBlock(auf.id).props.rel || []).length,
      zurueck: (Store.getBlock(proj.id).props[gk] || []).includes(auf.id)
    };
  });
  ok('Verknüpfung gesetzt', wechsel.hin === 1);
  ok('Gegenrichtung trägt sich ein', wechsel.zurueck === true);

  // Kennzahl-Diagramm
  await p.evaluate(() => {
    const s = App.aktuelleSeite();
    Store.addBlock(s, 'chart', { text: 'Umsatz', chartTyp: 'kpi', daten: 'Jan: 100\nFeb: 150' });
    App.zeichneSeite();
  });
  await p.waitForTimeout(600);
  ok('Kennzahl-Diagramm zeichnet', await p.locator('.chart-svg text').first().textContent().then(t => t === '250'));

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(f.length ? 'FEHLER:\n'+[...new Set(f)].slice(0,6).join('\n') : 'Keine JS-Fehler.');
})();
