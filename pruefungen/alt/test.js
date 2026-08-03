const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
const ok = [], bad = [];
const pruef = (was, gut) => (gut ? ok : bad).push(was);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));

  await p.goto('http://localhost:8765/index.html');
  await p.waitForTimeout(1200);

  // 1 Farben der Tags
  const farbe = await p.evaluate(() => {
    const t = [...document.querySelectorAll('.tag')].find(x => x.textContent === 'In Arbeit');
    return t ? getComputedStyle(t).backgroundColor : null;
  });
  pruef('Status-Tag hat eigene Farbe (' + farbe + ')', farbe && farbe !== 'rgb(69, 75, 78)');

  // 2 Slash-Menü
  const ct = await p.$('.blk.b-text .ct');
  await ct.click();
  await p.keyboard.type('/');
  await p.waitForTimeout(250);
  pruef('Slash-Menü öffnet', await p.$('.menu') !== null);
  await p.screenshot({ path: '/tmp/s2-slash.png' });

  // filtern
  await p.keyboard.type('kalend');
  await p.waitForTimeout(250);
  const gefiltert = await p.$$eval('.menu button[data-t]', bs => bs.map(x => x.textContent.trim()));
  pruef('Slash filtert (' + gefiltert.join(', ') + ')', gefiltert.some(x => x.includes('Kalender')));
  await p.keyboard.press('Escape');

  // 3 Markdown-Kürzel
  await ct.click();
  await p.keyboard.type('## ');
  await p.waitForTimeout(300);
  pruef('Markdown ## macht Überschrift 2', await p.$('.blk.b-h2') !== null);

  // 4 Enter erzeugt neuen Block
  const vorher = await p.$$eval('.blk', b => b.length);
  await p.keyboard.type('Test');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(300);
  const nachher = await p.$$eval('.blk', b => b.length);
  pruef('Enter erzeugt neuen Block (' + vorher + '→' + nachher + ')', nachher > vorher);

  // 5 Suche
  await p.keyboard.press('Control+p');
  await p.waitForTimeout(300);
  pruef('Suche öffnet mit Strg+P', await p.$('.finder') !== null);
  await p.keyboard.type('Willk');
  await p.waitForTimeout(400);
  const tr = await p.$$eval('#res button', b => b.length);
  pruef('Suche findet Treffer (' + tr + ')', tr > 0);
  await p.screenshot({ path: '/tmp/s3-suche.png' });
  await p.keyboard.press('Escape');

  // 6 Neue Ansicht: Board
  await p.click('.db-tabs .db-tab:last-child');   // + Knopf
  await p.waitForTimeout(250);
  await p.click('.menu button[data-l="board"]');
  await p.waitForTimeout(500);
  pruef('Board-Ansicht erscheint', await p.$('.board') !== null);
  const spalten = await p.$$eval('.col', c => c.length);
  pruef('Board hat Spalten (' + spalten + ')', spalten >= 3);
  await p.screenshot({ path: '/tmp/s4-board.png' });

  // 7 Kalender
  await p.click('.db-tabs .db-tab:last-child');
  await p.waitForTimeout(250);
  await p.click('.menu button[data-l="calendar"]');
  await p.waitForTimeout(500);
  pruef('Kalender-Ansicht erscheint', await p.$('.cal') !== null);
  const evs = await p.$$eval('.cal .ev', e => e.length);
  pruef('Kalender zeigt Einträge (' + evs + ')', evs > 0);
  await p.screenshot({ path: '/tmp/s5-kalender.png' });

  // 8 Zurück zur Tabelle + Filter
  await p.click('.db-tabs .db-tab:first-child');
  await p.waitForTimeout(400);
  pruef('Zurück zur Tabelle', await p.$('table.grid') !== null);

  // 9 Theme
  await p.keyboard.press('Control+Shift+l');
  await p.waitForTimeout(300);
  const th = await p.evaluate(() => document.documentElement.dataset.theme);
  pruef('Hell/Dunkel schaltet um (' + th + ')', th === 'light');
  await p.screenshot({ path: '/tmp/s6-hell.png' });
  await p.keyboard.press('Control+Shift+l');
  await p.waitForTimeout(200);

  // 10 KI-Panel
  await p.keyboard.press('Control+j');
  await p.waitForTimeout(400);
  pruef('KI-Panel öffnet mit Strg+J', await p.$('#ai.open') !== null);
  await p.click('#ai .model-btn');
  await p.waitForTimeout(1600);
  const modelle = await p.$$eval('.menu button[data-q="webllm"]', b => b.length);
  pruef('Modellauswahl zeigt WebLLM-Modelle (' + modelle + ')', modelle >= 6);
  await p.screenshot({ path: '/tmp/s7-ki.png' });
  await p.keyboard.press('Escape');

  // 11 Neue Seite
  await p.keyboard.press('Control+n');
  await p.waitForTimeout(500);
  const seiten = await p.$$eval('#tree .row', r => r.length);
  pruef('Neue Seite mit Strg+N (' + seiten + ' im Baum)', seiten >= 2);

  // 12 Speicherung übersteht Neuladen
  await p.evaluate(() => { const t = document.getElementById('title'); t.textContent = 'Persistenztest'; t.dispatchEvent(new Event('input',{bubbles:true})); });
  await p.waitForTimeout(900);
  await p.reload();
  await p.waitForTimeout(1400);
  const nachReload = await p.$$eval('#tree .row .nm', n => n.map(x => x.textContent));
  pruef('Daten überleben das Neuladen (' + nachReload.join(', ') + ')', nachReload.includes('Persistenztest'));
  await p.screenshot({ path: '/tmp/s8-nachreload.png' });

  console.log('\n=== BESTANDEN (' + ok.length + ') ===');
  ok.forEach(x => console.log('  ✓ ' + x));
  if (bad.length) { console.log('\n=== FEHLGESCHLAGEN (' + bad.length + ') ==='); bad.forEach(x => console.log('  ✗ ' + x)); }
  if (fehler.length) { console.log('\n=== JS-FEHLER ==='); [...new Set(fehler)].forEach(x => console.log('  ! ' + x)); }
  await b.close();
})();
