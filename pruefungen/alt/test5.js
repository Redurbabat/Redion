const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const f = [];
  p.on('pageerror', e => f.push(e.message));
  p.on('console', m => { if (m.type()==='error' && !/11434|CONNECTION_REFUSED/.test(m.text())) f.push(m.text()); });
  await p.goto('file://' + WURZEL + '/notizen-einzeldatei.html');
  await p.waitForTimeout(1600);
  console.log('Titel da:', await p.locator('#title').count());
  console.log('Blöcke:', await p.locator('#page .blk').count());
  console.log('Werkzeuge:', await p.locator('[data-wz]').count());
  console.log('Fehler:', f.length ? f.join(' | ') : 'keine');
  await b.close();
})();
