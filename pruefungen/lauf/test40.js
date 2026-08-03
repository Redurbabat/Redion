/* Die Oberfläche am Handy und am PC — gegen Notions Aufbau gemessen. */
const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch();
  const f = [];
  const pruef = []; const ok = (n, x, z) => pruef.push([n, !!x, z]);

  const bauePage = async (p) => {
    await p.goto('file://' + WURZEL + '/index.html');
    await p.waitForTimeout(1900);
    await p.evaluate(() => {
      const s = Store.addPage(null, { text: 'Layout-Probe', icon: '🎯' });
      Store.addBlock(s.id, 'h1',   { text: 'Überschrift' });
      Store.addBlock(s.id, 'text', { text: 'Ein Absatz mit Text.' });
      Store.addBlock(s.id, 'todo', { text: 'Eine Aufgabe' });
      const { collectionId } = Store.addDatabase(s.id, 'Beispiel', {
        title: { name: 'Name', type: 'title' },
        st:    { name: 'Status', type: 'select', options: [{ name: 'Offen', color: 'gray' }] }
      }, 'table');
      const r = Store.addRow(collectionId, {});
      Store.updateBlock(r.id, { text: 'Zeile 1' });
      App.oeffne(s.id);
    });
    await p.waitForTimeout(1000);
  };

  /* ================= TEIL A — iPhone 13 Pro Max ====================== */
  const t = await b.newPage({ viewport: { width: 428, height: 926 } });
  t.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  t.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });
  await bauePage(t);

  const handy = await t.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
    const tb = document.getElementById('topbar');
    return {
      mainLinks:  Math.round(r('#main').left),
      mainBreite: Math.round(r('#main').width),
      seiteBreite: Math.round(r('#page').width),
      seitenleistePos: getComputedStyle(document.getElementById('sidebar')).position,
      kopfKnoepfe: [...tb.querySelectorAll('button')].filter(x => x.offsetParent).map(x => x.id),
      kopfUeberlauf: tb.scrollWidth - tb.clientWidth,
      krume: document.getElementById('crumb').textContent.trim(),
      seitlicherUeberlauf: document.documentElement.scrollWidth - 428,
      untenLeiste: [...document.querySelectorAll('#handy-leiste button')].map(x => x.id),
      /* offsetParent ist bei position:fixed immer null — deshalb den
         berechneten Stil fragen. */
      untenSichtbar: getComputedStyle(document.getElementById('handy-leiste')).display !== 'none',
      griffeAus: getComputedStyle(document.querySelector('.blk > .handles')).display
    };
  });
  console.log('   Handy:', JSON.stringify(handy));

  ok('Der Inhalt beginnt ganz links — kein leerer Streifen', handy.mainLinks === 0, handy.mainLinks + ' px');
  ok('Er nimmt die volle Breite ein', handy.mainBreite === 428 && handy.seiteBreite === 428,
     handy.mainBreite + '/' + handy.seiteBreite);
  ok('Die Seitenleiste liegt fest über der Seite, nicht im Fluss',
     handy.seitenleistePos === 'fixed', handy.seitenleistePos);
  ok('Nichts läuft seitlich heraus', handy.seitlicherUeberlauf <= 0, handy.seitlicherUeberlauf + ' px');
  /* Seit die untere Leiste die vier Bereiche traegt, sind Suchen und Neu
     nach oben gewandert — sonst waeren sie am Telefon nur ueber die
     Schublade erreichbar. Alles Weitere liegt weiterhin im ⋯-Menue. */
  ok('Die Kopfzeile zeigt ☰, ‹, Suchen, Neu und ⋯',
     handy.kopfKnoepfe.join(',') === 'btn-menu,btn-back,btn-suche-handy,btn-neu-handy,btn-page-menu',
     handy.kopfKnoepfe.join(','));
  ok('Die Kopfzeile läuft nicht über', handy.kopfUeberlauf <= 0, handy.kopfUeberlauf + ' px');
  ok('Der Seitentitel steht in der Kopfzeile', /Layout-Probe/.test(handy.krume), handy.krume);
  ok('Unten steht die Reiterleiste mit fünf Feldern wie in Notions App',
     handy.untenSichtbar &&
     handy.untenLeiste.join(',') === 'hl-start,hl-chat,hl-ki,hl-bespr,hl-inbox',
     handy.untenLeiste.join(','));
  ok('Die Blockgriffe sind aus, wie in Notion am Handy', handy.griffeAus === 'none', handy.griffeAus);

  /* Was aus der Kopfzeile verschwunden ist, muss im ⋯-Menü stehen */
  await t.evaluate(() => {
    App.seitenMenue(document.getElementById('btn-page-menu'), Store.getBlock(App.aktuelleSeite()));
  });
  await t.waitForTimeout(500);
  const imMenue = await t.evaluate(() => {
    const txt = [...document.querySelectorAll('.menu button[data-a]')].map(x => x.textContent);
    const blatt = document.querySelector('.menu')?.classList.contains('blatt');
    document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
    return { txt, blatt };
  });
  const hat = (s) => imMenue.txt.some(x => x.includes(s));
  ok('Teilen, Versionsverlauf, Kommentare und Automationen stehen im ⋯-Menü',
     hat('Teilen') && hat('Versionsverlauf') && hat('Kommentare') && hat('Automationen'),
     imMenue.txt.length + ' Einträge');
  ok('Und das Menü ist am Handy ein Blatt von unten', imMenue.blatt);

  /* Die Schublade fährt auf und wieder zu */
  await t.click('#btn-menu');
  await t.waitForTimeout(400);
  const auf = await t.evaluate(() => ({
    offen: document.body.classList.contains('side-offen'),
    links: Math.round(document.getElementById('sidebar').getBoundingClientRect().left),
    schatten: !!document.getElementById('side-schatten')
  }));
  ok('☰ fährt die Seitenleiste über die Seite', auf.offen && auf.links === 0 && auf.schatten,
     JSON.stringify(auf));
  /* Zum Schliessen tippt man daneben — genau wie in Notion. Der ☰-Knopf
     liegt dann unter der Schublade und ist absichtlich nicht erreichbar. */
  await t.mouse.click(405, 500);   /* rechts neben der Schublade */
  await t.waitForTimeout(400);
  ok('Tippen daneben schliesst sie wieder', await t.evaluate(() =>
    !document.body.classList.contains('side-offen') && !document.getElementById('side-schatten')));

  /* ================= TEIL B — Windows-Desktop ======================== */
  const d = await b.newPage({ viewport: { width: 1400, height: 900 } });
  d.on('pageerror', e => f.push('PAGEERROR(PC): ' + e.message));
  await bauePage(d);

  const pc = await d.evaluate(() => {
    const tb = document.getElementById('topbar');
    const s = document.getElementById('sidebar');
    return {
      seitenleiste: Math.round(s.getBoundingClientRect().width),
      seitenleistePos: getComputedStyle(s).position,
      mainLinks: Math.round(document.getElementById('main').getBoundingClientRect().left),
      kopfKnoepfe: [...tb.querySelectorAll('button')].filter(x => x.offsetParent).map(x => x.id),
      untenAus: getComputedStyle(document.getElementById('handy-leiste')).display === 'none',
      griffe: !!document.querySelector('.blk > .handles'),
      dbLeiste: [...document.querySelectorAll('.db-tools button')].length,
      neuKnopf: !!document.querySelector('.db-tools .db-neu, .db-tools .primaer, .db-neu')
    };
  });
  console.log('   PC:', JSON.stringify(pc));

  ok('Am PC steht die Seitenleiste im Fluss und ist 260 px breit',
     pc.seitenleistePos === 'relative' && pc.seitenleiste === 260,
     pc.seitenleistePos + ' / ' + pc.seitenleiste);
  ok('Der Inhalt beginnt dahinter', pc.mainLinks === 260, pc.mainLinks + ' px');
  ok('Die Kopfzeile zeigt am PC alle Knöpfe', pc.kopfKnoepfe.length >= 10, pc.kopfKnoepfe.length + ' Stück');
  ok('Die Handy-Leiste unten ist am PC aus', pc.untenAus);
  ok('Die Blockgriffe sind am PC da', pc.griffe);
  ok('Die Datenbank-Werkzeugleiste ist vollständig', pc.dbLeiste >= 7, pc.dbLeiste + ' Knöpfe');

  console.log('\n=== OBERFLÄCHE PC UND HANDY ===');
  pruef.forEach(([n, x, z]) => console.log((x ? '✅ ' : '❌ ') + n + (x || z === undefined ? '' : '   → ' + z)));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
