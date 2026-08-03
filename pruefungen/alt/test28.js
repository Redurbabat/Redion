const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED|ERR_/i.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  /* --- Kopfzeile --------------------------------------------------------- */
  const kopf = await p.evaluate(() =>
    [...document.querySelectorAll('#topbar button')].map(x => x.id));
  console.log('   Kopfzeile:', JSON.stringify(kopf));
  ok('Link-Knopf in der Kopfzeile', kopf.includes('btn-link'));
  ok('Schloss in der Kopfzeile', kopf.includes('btn-lock'));
  ok('Blitz in der Kopfzeile', kopf.includes('btn-auto'));
  ok('Kopfzeile hat mindestens elf Elemente', kopf.length >= 11);

  /* --- Sperren ----------------------------------------------------------- */
  const seite = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Sperrtest' });
    Store.addBlock(s.id, 'text', { text: 'Hier steht etwas' });
    Store.addBlock(s.id, 'columns', {});
    App.oeffne(s.id);
    return s.id;
  });
  await p.waitForTimeout(700);

  const vorher = await p.evaluate(() => ({
    schloss: document.getElementById('btn-lock').textContent,
    titel: document.getElementById('title').contentEditable,
    text: document.querySelector('.blk.b-text .ct')?.contentEditable
  }));
  await p.click('#btn-lock');
  await p.waitForTimeout(600);
  const nachher = await p.evaluate(() => ({
    schloss: document.getElementById('btn-lock').textContent,
    titel: document.getElementById('title').contentEditable,
    text: document.querySelector('.blk.b-text .ct')?.contentEditable,
    hinweis: !!document.body.textContent.includes('gesperrt')
  }));
  console.log('   Sperren:', JSON.stringify({ vorher, nachher }));
  ok('Schloss war offen', vorher.schloss === '🔓' && vorher.titel === 'true');
  ok('Klick sperrt die Seite', nachher.schloss === '🔒' && nachher.titel === 'false');
  ok('Blöcke sind dann nur lesbar', nachher.text === 'false');
  ok('Hinweis erscheint', nachher.hinweis);

  await p.click('#btn-lock');
  await p.waitForTimeout(500);
  ok('Nochmal klicken entsperrt',
     await p.evaluate(() => document.getElementById('btn-lock').textContent === '🔓'));

  /* --- Blitz nur bei Datenbanken ----------------------------------------- */
  const blitzOhne = await p.evaluate(() =>
    document.getElementById('btn-auto').style.display);
  const mitDb = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Mit Datenbank' });
    Store.addDatabase(s.id, 'Sachen', null, 'table');
    App.oeffne(s.id);
    return s.id;
  });
  await p.waitForTimeout(700);
  const blitzMit = await p.evaluate(() => document.getElementById('btn-auto').style.display);
  console.log('   Blitz:', JSON.stringify({ ohne: blitzOhne, mit: blitzMit }));
  ok('Blitz versteckt sich ohne Datenbank', blitzOhne === 'none');
  ok('Blitz erscheint mit Datenbank', blitzMit === '');

  await p.click('#btn-auto');
  await p.waitForTimeout(600);
  const autoOffen = await p.evaluate(() => {
    const t = document.body.textContent;
    const da = t.includes('Automationen');
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    return da;
  });
  ok('Blitz öffnet die Automationen', autoOffen);

  /* --- Spalten auf schmalem Bildschirm ------------------------------------ */
  await p.evaluate((id) => App.oeffne(id), seite);
  await p.waitForTimeout(600);
  const breit = await p.evaluate(() => {
    const el = document.querySelector('.spalten-block');
    return el ? getComputedStyle(el).gridTemplateColumns.split(' ').length : 0;
  });
  await p.setViewportSize({ width: 560, height: 900 });
  await p.waitForTimeout(500);
  const schmal = await p.evaluate(() => {
    const el = document.querySelector('.spalten-block');
    return {
      spalten: el ? getComputedStyle(el).gridTemplateColumns.split(' ').length : 0,
      griffe: getComputedStyle(document.querySelector('.blk > .handles')).display,
      mehrfachAus: Mehrfach.schmal()
    };
  });
  console.log('   Spalten:', JSON.stringify({ breit, schmal }));
  ok('Am breiten Bildschirm zwei Spalten', breit === 2);
  ok('Am schmalen Bildschirm gestapelt', schmal.spalten === 1);
  ok('Blockgriffe verschwinden mobil', schmal.griffe === 'none');
  ok('Mehrfachauswahl ist mobil aus', schmal.mehrfachAus === true);

  const keineMehrfach = await p.evaluate(() => {
    const ids = [...document.querySelectorAll('.blk')].map(x => x.dataset.bid);
    Mehrfach.leeren();
    Mehrfach.waehle(ids[0]);
    Mehrfach.waehle(ids[1], true);      /* dazu — darf mobil nichts tun */
    return Mehrfach.ids().length;
  });
  ok('Mobil bleibt es bei einem Block', keineMehrfach === 1);

  await p.setViewportSize({ width: 1500, height: 950 });
  await p.waitForTimeout(400);
  const wiederBreit = await p.evaluate(() => {
    const ids = [...document.querySelectorAll('.blk')].map(x => x.dataset.bid);
    Mehrfach.leeren();
    Mehrfach.waehle(ids[0]);
    Mehrfach.waehle(ids[1], true);
    const n = Mehrfach.ids().length;
    Mehrfach.leeren();
    return n;
  });
  ok('Am Rechner geht Mehrfachauswahl wieder', wiederBreit === 2);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
