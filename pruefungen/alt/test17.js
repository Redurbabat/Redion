const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED/.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  // Ein paar Seiten anlegen für die Suche
  await p.evaluate(() => {
    const a = Store.addPage(null, { text: 'Reisen', icon: '✈️' });
    const k = Store.addPage(a.id, { text: 'Japan Notizen' });
    Store.addBlock(k.id, 'text', { text: 'Kyoto im Herbst, Tempel und Ahornblätter.' });
    Store.addBlock(k.id, 'h2', { text: 'Packliste' });
    App.zeichneBaum();
  });
  await p.waitForTimeout(500);

  await p.keyboard.press('Control+p');
  await p.waitForTimeout(500);
  ok('Suchfenster mit Filtern', await p.locator('.such-filter select').count() === 4);
  await p.fill('#q', 'kyoto');
  await p.waitForTimeout(600);
  ok('Inhaltstreffer gefunden', await p.locator('#res button').count() >= 1);
  ok('Pfad wird angezeigt', (await p.locator('#res .pfad').first().textContent()).includes('Reisen'));
  ok('Vorschau rechts gefüllt', (await p.locator('#vorschau').textContent()).includes('Japan'));
  ok('Vorschau zeigt Überschrift', await p.locator('#vorschau .vs-h2').count() >= 1);

  // Filter „nur Titel" schliesst den Inhaltstreffer aus
  await p.selectOption('#f-wo', 'titel');
  await p.waitForTimeout(500);
  ok('Filter „nur Titel" greift', await p.locator('#res button').count() === 0);
  await p.selectOption('#f-wo', 'alles');
  await p.fill('#q', 'japan');
  await p.waitForTimeout(500);
  const mitOrt = await p.locator('#res button').count();
  await p.selectOption('#f-ort', await p.evaluate(() => Links.seiteMitTitel('Willkommen').id));
  await p.waitForTimeout(500);
  ok('Ortsfilter greift (' + mitOrt + ' → ' + await p.locator('#res button').count() + ')',
     await p.locator('#res button').count() < mitOrt);
  await p.keyboard.press('Escape');

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(f.length ? 'FEHLER:\n'+[...new Set(f)].slice(0,6).join('\n') : 'Keine JS-Fehler.');
})();
