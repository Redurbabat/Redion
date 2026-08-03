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

  const ausl = await p.evaluate(() => Datenbank.AUSLOESER.map(a => a[0]));
  console.log('   Auslöser:', JSON.stringify(ausl));
  ok('Sechs Notion-Auslöser plus zwei Zeitauslöser', ausl.length === 8);
  ok('Eintrag bearbeitet dabei', ausl.includes('zeile-geaendert'));
  ok('Eintrag verschwindet dabei', ausl.includes('zeile-weg'));
  ok('Formularantwort dabei', ausl.includes('formular-neu'));

  const lauf = await p.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Auslösertest' });
    const db = Store.addDatabase(s.id, 'Sachen', {
      title: { name: 'Was', type: 'title' },
      n: { name: 'Zähler', type: 'number' },
      t: { name: 'Notiz', type: 'text' }
    }, 'table');
    const c = Store.getCollection(db.collectionId);

    const protokoll = [];
    const altToast = UI.toast;
    UI.toast = (x) => { protokoll.push(x); altToast(x); };

    c.automationen = [
      { id: 'a1', name: 'bearbeitet', an: true, wenn: { art: 'zeile-geaendert' },
        bedingungen: [], dann: [{ art: 'melden', text: 'BEARBEITET' }] },
      { id: 'a2', name: 'weg', an: true, wenn: { art: 'zeile-weg' },
        bedingungen: [], dann: [{ art: 'melden', text: 'WEG' }] },
      { id: 'a3', name: 'formular', an: true, wenn: { art: 'formular-neu' },
        bedingungen: [], dann: [{ art: 'melden', text: 'FORMULAR' }] }
    ];
    Store.updateCollection(c.id, { automationen: c.automationen });

    const r = Store.addRow(c.id, { n: 1 });
    Store.updateBlock(r.id, { text: 'Eins' });
    await new Promise(x => setTimeout(x, 200));

    Store.setProp(r.id, 't', 'irgendwas');
    await new Promise(x => setTimeout(x, 300));
    const nachEdit = protokoll.slice();

    Store.trashBlock(r.id);
    await new Promise(x => setTimeout(x, 300));
    const nachWeg = protokoll.slice();

    UI.toast = altToast;
    return { nachEdit, nachWeg, collId: c.id, seite: s.id };
  });
  console.log('   Meldungen:', JSON.stringify(lauf.nachWeg));
  ok('Bearbeiten löst aus', lauf.nachEdit.some(x => x.includes('BEARBEITET')));
  ok('Löschen löst aus', lauf.nachWeg.some(x => x.includes('WEG')));

  /* Formular */
  const form = await p.evaluate(async (d) => {
    const c = Store.getCollection(d.collId);
    const v = Store.addView(c.id, 'form', 'Formular');
    const protokoll = [];
    const alt = UI.toast; UI.toast = (x) => { protokoll.push(x); alt(x); };
    const seite = Store.getBlock(d.seite);
    const dbBlock = Store.childrenOf(seite.id).find(b => b.type === 'database');
    Store.updateBlock(dbBlock.id, { aktiveView: v.id });
    App.oeffne(d.seite);
    await new Promise(x => setTimeout(x, 700));
    document.querySelector('.form-feld[data-k="title"] input').value = 'Aus dem Formular';
    document.querySelector('.form-fuss [data-a="senden"]').click();
    await new Promise(x => setTimeout(x, 500));
    UI.toast = alt;
    return protokoll;
  }, lauf);
  console.log('   Formular:', JSON.stringify(form));
  ok('Formularantwort löst aus', form.some(x => x.includes('FORMULAR')));

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
