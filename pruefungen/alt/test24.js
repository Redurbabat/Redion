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

  const seite = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Formulartest' });
    const db = Store.addDatabase(s.id, 'Anmeldung', {
      title: { name: 'Name',   type: 'title' },
      t: { name: 'Bemerkung',  type: 'text' },
      n: { name: 'Anzahl',     type: 'number' },
      s: { name: 'Menü',       type: 'select', options: [{name:'Fleisch',color:'red'},{name:'Vegi',color:'green'}] },
      m: { name: 'Extras',     type: 'multi',  options: [{name:'Salat',color:'green'},{name:'Suppe',color:'yellow'},{name:'Kuchen',color:'pink'}] },
      st:{ name: 'Stand',      type: 'status', options: [{name:'Neu',color:'gray'},{name:'Fix',color:'blue'}] },
      d: { name: 'Datum',      type: 'date' },
      pe:{ name: 'Betreuer',   type: 'person' },
      fi:{ name: 'Anhang',     type: 'files' },
      c: { name: 'Zusage',     type: 'checkbox' },
      u: { name: 'Webseite',   type: 'url' },
      e: { name: 'E-Mail',     type: 'email' },
      ph:{ name: 'Telefon',    type: 'phone' },
      du:{ name: 'Dauer',      type: 'duration' },
      fx:{ name: 'Rechnung',   type: 'formula', formula: 'prop("Anzahl") * 2' },
      bt:{ name: 'Knopf',      type: 'button' }
    }, 'form');
    return s.id;
  });
  await p.evaluate(id => App.oeffne(id), seite);
  await p.waitForTimeout(800);

  const felder = await p.evaluate(() => {
    const b = document.querySelector('.form-felder');
    return [...b.querySelectorAll('.form-feld')].map(f => {
      const k = f.dataset.k;
      const el = f.querySelector('[data-k]:not(datalist)');
      return { k, tag: el.tagName.toLowerCase(), typ: el.type || '',
               klasse: el.className || '' };
    });
  });
  console.log('   Felder:', JSON.stringify(felder));
  const hat = (k, tag, typ) => felder.some(x => x.k === k && x.tag === tag && (!typ || x.typ === typ));
  ok('Kurze Antwort für den Titel', hat('title', 'input', 'text'));
  ok('Lange Antwort als Textfeld', hat('t', 'textarea'));
  ok('Zahl', hat('n', 'input', 'number'));
  ok('Einfachauswahl', hat('s', 'select'));
  ok('Mehrfachauswahl als Kästchen', felder.some(x => x.k === 'm' && x.klasse === 'form-mehr'));
  ok('Status', hat('st', 'select'));
  ok('Datum', hat('d', 'input', 'date'));
  ok('Person mit Vorschlagsliste', hat('pe', 'input', 'text'));
  ok('Dateien', hat('fi', 'input', 'file'));
  ok('Kontrollkästchen', hat('c', 'input', 'checkbox'));
  ok('URL', hat('u', 'input', 'url'));
  ok('E-Mail', hat('e', 'input', 'email'));
  ok('Telefon', hat('ph', 'input', 'tel'));
  ok('13 Fragetypen im Formular', felder.length >= 13);
  ok('Formel und Knopf tauchen nicht auf',
     !felder.some(x => x.k === 'fx') && !felder.some(x => x.k === 'bt'));

  /* Ausfüllen und abschicken */
  await p.fill('.form-feld[data-k="title"] input', 'Anna Muster');
  await p.fill('.form-feld[data-k="t"] textarea', 'Kommt mit zwei Kindern.\nBraucht einen Hochstuhl.');
  await p.fill('.form-feld[data-k="n"] input', '3');
  await p.selectOption('.form-feld[data-k="s"] select', 'Vegi');
  await p.check('.form-feld[data-k="m"] input[data-o="Salat"]');
  await p.check('.form-feld[data-k="m"] input[data-o="Kuchen"]');
  await p.fill('.form-feld[data-k="d"] input', '2026-09-15');
  await p.fill('.form-feld[data-k="pe"] input', 'Red');
  await p.check('.form-feld[data-k="c"] input');
  await p.fill('.form-feld[data-k="u"] input', 'https://example.org');
  await p.fill('.form-feld[data-k="e"] input', 'anna@example.org');
  await p.fill('.form-feld[data-k="ph"] input', '+41 79 000 00 00');
  await p.fill('.form-feld[data-k="du"] input', '1h30');
  await p.click('.form-fuss [data-a="senden"]');
  await p.waitForTimeout(700);

  const eintrag = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Anmeldung');
    const r = Store.rowsOf(c.id)[0];
    return { titel: r.text, props: r.props, rechnung: Datenbank.wert(r, 'fx', c) };
  });
  console.log('   Eintrag:', JSON.stringify(eintrag));
  ok('Titel übernommen', eintrag.titel === 'Anna Muster');
  ok('Langer Text mit Zeilenumbruch', String(eintrag.props.t).includes('Hochstuhl'));
  ok('Auswahl übernommen', eintrag.props.s === 'Vegi');
  ok('Mehrfachauswahl als Liste', JSON.stringify(eintrag.props.m) === '["Salat","Kuchen"]');
  ok('Kästchen übernommen', eintrag.props.c === true);
  ok('Zeitspanne umgerechnet', eintrag.props.du === 90);
  ok('Formel rechnet mit', String(eintrag.rechnung) === '6');

  /* Pflichtfeld blockt */
  const pflicht = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Anmeldung');
    const v = Store.getView(c.viewIds[0]);
    Store.updateView(v.id, { pflicht: ['m'] });
    App.zeichneSeite();
    return true;
  });
  await p.waitForTimeout(500);
  const vorher = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Anmeldung');
    return Store.rowsOf(c.id).length;
  });
  await p.fill('.form-feld[data-k="title"] input', 'Ohne Extras');
  await p.click('.form-fuss [data-a="senden"]');
  await p.waitForTimeout(500);
  const nachher = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Anmeldung');
    return Store.rowsOf(c.id).length;
  });
  ok('Pflicht-Mehrfachauswahl blockt das Absenden', vorher === nachher);

  await p.check('.form-feld[data-k="m"] input[data-o="Suppe"]');
  await p.click('.form-fuss [data-a="senden"]');
  await p.waitForTimeout(500);
  const danach = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Anmeldung');
    const r = Store.rowsOf(c.id).find(x => x.text === 'Ohne Extras');
    return { anzahl: Store.rowsOf(c.id).length, m: r && r.props.m };
  });
  ok('Mit Antwort geht es durch', danach.anzahl === vorher + 1 &&
     JSON.stringify(danach.m) === '["Suppe"]');

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
