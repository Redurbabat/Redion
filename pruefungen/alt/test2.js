const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 820 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push(e.message));
  // Direkt von der Festplatte, ohne Server — genau wie beim Doppelklick
  await p.goto('file://' + WURZEL + '/notizen-einzeldatei.html');
  await p.waitForTimeout(1800);
  const st = await p.evaluate(() => ({
    titel: document.getElementById('title')?.textContent,
    bloecke: document.querySelectorAll('.blk').length,
    zeilen: document.querySelectorAll('table.grid tbody tr').length
  }));
  console.log('Einzeldatei per file:// →', JSON.stringify(st));
  console.log('Fehler:', fehler.length ? fehler.join(' | ') : 'keine');
  await p.screenshot({ path: '/tmp/f6-einzeldatei.png' });
  await b.close();
})();
