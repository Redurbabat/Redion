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

  // Automationen
  await p.click('.db-tools button[data-a="auto"]');
  await p.waitForTimeout(500);
  ok('Automations-Fenster', await p.locator('.finder .fh').first().textContent().then(t=>t.includes('Automationen')));
  await p.click('[data-a="neu"]');
  await p.waitForTimeout(500);
  ok('Bauformular offen', await p.locator('#aw').count() === 1);
  await p.selectOption('#aw', 'prop-wert');
  await p.waitForTimeout(200);
  const statusKey = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    return Object.keys(c.schema).find(k => c.schema[k].type === 'status');
  });
  await p.selectOption('#ak', statusKey);
  await p.fill('#av', 'Erledigt');
  await p.selectOption('#ad', 'melden');
  await p.waitForTimeout(200);
  await p.fill('#adv', 'Aufgabe fertig!');
  await p.click('[data-a="ok"]');
  await p.waitForTimeout(600);
  ok('Automation gespeichert', await p.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    return (c.automationen||[]).length === 1;
  }));

  // Automation auslösen
  const geloest = await p.evaluate(async (key) => {
    const c = Object.values(Store.cache.collections)[0];
    const r = Store.rowsOf(c.id)[0];
    let gemeldet = '';
    const altToast = UI.toast;
    UI.toast = (t) => { gemeldet = t; altToast(t); };
    Store.setProp(r.id, key, 'Erledigt');
    await new Promise(r2 => setTimeout(r2, 300));
    UI.toast = altToast;
    return gemeldet;
  }, statusKey);
  ok('Automation läuft (' + geloest + ')', geloest.includes('Aufgabe fertig'));

  // Wiki
  await p.evaluate(() => {
    const p2 = Store.addPage(null, { text: 'Handbuch', icon: '📚' });
    Store.addPage(p2.id, { text: 'Erste Schritte' });
    Store.addPage(p2.id, { text: 'Fragen und Antworten' });
    Store.updateBlock(p2.id, { wiki: true });
    App.zeichneBaum(); App.oeffne(p2.id);
  });
  await p.waitForTimeout(700);
  ok('Wiki-Verzeichnis', await p.locator('.wiki-tab tr[data-id]').count() === 2);
  await p.click('.w-pruef');
  await p.waitForTimeout(500);
  ok('Seite als geprüft markiert', await p.locator('.w-pruef.ja').count() === 1);

  // Teilen
  await p.click('#btn-teilen');
  await p.waitForTimeout(400);
  const tm = await p.locator('.menu button[data-a]').count();
  ok('Teilen-Menü (' + tm + ' Wege)', tm >= 7);
  await esc();

  // Alles zusammen: keine Fehler
  await p.keyboard.press('Control+Shift+P');
  await p.waitForTimeout(400);
  ok('Befehlspalette weiterhin', await p.locator('.overlay .res button').count() > 50);
  await esc();

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(f.length ? 'FEHLER:\n'+[...new Set(f)].slice(0,6).join('\n') : 'Keine JS-Fehler.');
})();
