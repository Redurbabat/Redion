const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f = []; p.on('pageerror', e=>f.push('PAGEERROR: '+e.message));
  p.on('console', m=>{ if(m.type()==='error' && !/11434|CONNECTION_REFUSED/.test(m.text())) f.push('CONSOLE: '+m.text()); });
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);
  const esc=async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(250);};

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  await p.keyboard.press('Control+,');
  await p.waitForTimeout(600);
  ok('Einstellungen offen', await p.locator('.einst-fenster').count() === 1);
  ok('19 Bereiche in der Navigation', await p.locator('.einst-nav button[data-b]').count() === 19);

  // Alle Bereiche durchklicken
  const bereiche = await p.$$eval('.einst-nav button[data-b]', els => els.map(e => e.dataset.b));
  let zeilenGesamt = 0;
  for (const bb of bereiche) {
    await p.click(`.einst-nav button[data-b="${bb}"]`);
    await p.waitForTimeout(180);
    const n = await p.locator('.ez-zeile').count();
    const h = await p.locator('.einst-inhalt h2').count();
    zeilenGesamt += n;
    if (!h) f.push('Bereich ohne Überschrift: ' + bb);
  }
  ok('Alle Bereiche zeigen Inhalt (' + zeilenGesamt + ' Optionen)', zeilenGesamt >= 60);

  // Eine Einstellung ändern: Schriftgrösse
  await p.click('.einst-nav button[data-b="allgemein"]');
  await p.waitForTimeout(250);
  await p.selectOption('[data-set="schriftgroesse"]', 'gross');
  await p.waitForTimeout(400);
  ok('Schriftgrösse wirkt', await p.evaluate(() => document.body.dataset.schrift === 'gross'));

  // Schalter
  await p.click('[data-toggle="rechtschreib"]');
  await p.waitForTimeout(300);
  ok('Schalter merkt sich den Zustand', await p.evaluate(() => Store.getMeta('rechtschreib') === true));

  // Datumsformat wirkt in der Datenbank
  await p.selectOption('[data-set="datumsformat"]', 'JJJJ-MM-TT');
  await p.waitForTimeout(500);
  await esc();
  await p.waitForTimeout(400);
  const zellen = await p.$$eval('table.grid td', els => els.map(e => e.textContent));
  ok('Datumsformat JJJJ-MM-TT in der Tabelle', zellen.some(t => /^\d{4}-\d{2}-\d{2}$/.test(t.trim())));

  // Wochenstart wirkt im Kalender
  await p.keyboard.press('Control+,');
  await p.waitForTimeout(500);
  await p.click('.einst-nav button[data-b="allgemein"]');
  await p.waitForTimeout(250);
  await p.selectOption('[data-set="wochenstart"]', 'sonntag');
  await p.waitForTimeout(300);
  await esc();
  await p.locator('.db-tab', { hasText: '+' }).click();
  await p.waitForTimeout(300);
  await p.click('.menu button[data-l="calendar"]');
  await p.waitForTimeout(600);
  const ersterTag = await p.locator('.cal .dow').first().textContent();
  ok('Kalender beginnt am Sonntag (' + ersterTag + ')', ersterTag === 'So');

  // Bereich anlegen
  await p.evaluate(() => {
    Store.setMeta('bereiche', [{ id: 'b1', name: 'Arbeit', icon: '💼' }]);
    const s = Links.seiten()[0];
    Store.updateBlock(s.id, { bereich: 'b1' });
    App.zeichneBaum();
  });
  await p.waitForTimeout(500);
  const abschnitte = await p.$$eval('#tree .side-section span', els => els.map(e => e.textContent));
  ok('Bereich in der Seitenleiste (' + abschnitte.join(', ') + ')', abschnitte.some(t => t.includes('Arbeit')));

  // Arbeitsbereichsname
  await p.keyboard.press('Control+,');
  await p.waitForTimeout(500);
  await p.click('.einst-nav button[data-b="arbeitsplatz"]');
  await p.waitForTimeout(250);
  await p.fill('[data-set="arbeitsName"]', 'REDs Notizen');
  await p.waitForTimeout(400);
  ok('Name des Arbeitsbereichs übernommen',
     (await p.locator('#btn-settings span').nth(1).textContent()) === 'REDs Notizen');
  await esc();

  // Nach Neuladen erhalten
  await p.evaluate(() => Store.flush());
  await p.waitForTimeout(500);
  await p.reload();
  await p.waitForTimeout(1600);
  ok('Einstellungen überleben Neuladen',
     await p.evaluate(() => Store.getMeta('arbeitsName') === 'REDs Notizen' &&
                            document.body.dataset.schrift === 'gross'));

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(f.length ? 'FEHLER:\n'+[...new Set(f)].slice(0,8).join('\n') : 'Keine JS-Fehler.');
})();
