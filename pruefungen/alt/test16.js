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

  // Feed-Ansicht
  await p.locator('.db-tab', { hasText: '+' }).click();
  await p.waitForTimeout(350);
  ok('Elf Ansichtstypen', await p.locator('.menu button[data-l]').count() === 11);
  await p.click('.menu button[data-l="feed"]');
  await p.waitForTimeout(700);
  ok('Feed zeigt Einträge', await p.locator('.feed-eintrag').count() === 3);
  ok('Feed mit Datum', (await p.locator('.fe-kopf span').first().textContent()).length > 4);

  // Ring-Anzeige
  const ring = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    const k = Object.keys(c.schema).find(x => c.schema[x].type === 'formula');
    c.schema.zahl = { name: 'Punkte', type: 'number', anzeige: 'ring', max: 100 };
    Store.updateCollection(c.id, { schema: c.schema });
    Store.setProp(Store.rowsOf(c.id)[0].id, 'zahl', 72);
    App.zeichneSeite();
    return true;
  });
  await p.waitForTimeout(600);
  await p.locator('.db-tab', { hasText: 'Tabelle' }).first().click();
  await p.waitForTimeout(600);
  ok('Ring wird gezeichnet', await p.locator('.ring svg').count() >= 1);

  // Code mit Einfärbung
  await p.evaluate(() => {
    const s = App.aktuelleSeite();
    Store.addBlock(s, 'code', { lang: 'JavaScript',
      text: '// Beispiel\nconst summe = (a, b) => a + b;\nconsole.log("Ergebnis:", summe(2, 40));' });
    App.zeichneSeite();
  });
  await p.waitForTimeout(700);
  const codeHtml = await p.locator('.b-code .ct').last().innerHTML();
  ok('Schlüsselwörter eingefärbt', codeHtml.includes('c-schl'));
  ok('Text eingefärbt', codeHtml.includes('c-txt'));
  ok('Kommentar eingefärbt', codeHtml.includes('c-kom'));
  ok('Zahlen eingefärbt', codeHtml.includes('c-zahl'));

  // Formel-Funktionen aus Teil 7
  const formeln = await p.evaluate(() => {
    const t = (f) => { const r = Formula.run(f, () => null); return r.ok ? Formula.anzeige(r.wert) : 'FEHLER'; };
    return {
      bool: t('boolean(1)'),
      range: t('dateBetween(dateEnd(dateRange(now(), dateAdd(now(), 5, "days"))), dateStart(dateRange(now(), now())), "days")'),
      und: t('and(true, 5 > 3)')
    };
  });
  ok('boolean() läuft', formeln.bool !== 'FEHLER');
  ok('dateRange/Start/End laufen (' + formeln.range + ')', formeln.range === '5');

  // Timer-Knopf
  const timer = await p.evaluate(async () => {
    const s = App.aktuelleSeite();
    const b2 = Store.addBlock(s, 'button', { text: 'Training', aktionen: [{ art: 'timer', text: 'Trainingszeit' }] });
    App.zeichneSeite();
    return b2.id;
  });
  await p.waitForTimeout(500);
  await p.locator('.knopf').last().click();
  await p.waitForTimeout(600);
  ok('Timer gestartet', await p.evaluate((id) => !!Store.getBlock(id).timerStart, timer));
  await p.locator('.knopf').last().click();
  await p.waitForTimeout(700);
  ok('Timer gestoppt und notiert', await p.evaluate((id) => {
    const b2 = Store.getBlock(id);
    return !b2.timerStart && Store.childrenOf(b2.parentId).some(x => (x.text||'').includes('⏱'));
  }, timer));

  // Zeitauslöser
  const zeit = await p.evaluate(async () => {
    const c = Object.values(Store.cache.collections)[0];
    const dk = Object.keys(c.schema).find(k => c.schema[k].type === 'date');
    c.automationen = [{ id:'z1', name:'Vorwarnung', an:true,
      wenn:{ art:'zeit-vor', key: dk, wert:'2' },
      dann:[{ art:'setze-prop', key:'zahl', wert:'99' }] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    const r = Store.rowsOf(c.id)[0];
    const in2 = new Date(); in2.setDate(in2.getDate() + 2);
    Store.setProp(r.id, dk, in2.toISOString().slice(0,10));
    await new Promise(x => setTimeout(x, 300));
    Datenbank.zeitAutomationen();
    await new Promise(x => setTimeout(x, 400));
    return Store.getBlock(r.id).props.zahl;
  });
  ok('Zeitauslöser feuert 2 Tage vorher (' + zeit + ')', String(zeit) === '99');

  // Formular mit bedingter Logik
  const logik = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    const v = Store.addView(c.id, 'form', 'Formular');
    const st = Object.keys(c.schema).find(k => c.schema[k].type === 'status');
    const txt = Object.keys(c.schema).find(k => c.schema[k].type === 'text');
    Store.updateView(v.id, { logik: { [txt || 'zahl']: { key: st, wert: 'Erledigt' } } });
    const blk = Object.values(Store.cache.blocks).find(b => b.collectionId === c.id);
    Store.updateBlock(blk.id, { aktiveView: v.id });
    App.zeichneSeite();
    return true;
  });
  await p.waitForTimeout(800);
  ok('Formular zeigt bedingte Frage an', await p.locator('.form-feld[data-zeigt-wenn]').count() >= 1);
  const versteckt = await p.evaluate(() =>
    [...document.querySelectorAll('.form-feld[data-zeigt-wenn]')].every(f => f.style.display === 'none'));
  ok('Bedingte Frage ist zunächst verborgen', versteckt);

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(f.length ? 'FEHLER:\n'+[...new Set(f)].slice(0,6).join('\n') : 'Keine JS-Fehler.');
})();
