/* Prüft, was in dieser Runde an Filtern, Berechnungen und Gruppen dazukam. */
const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const f = [];
  p.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1800);

  const pruef = []; const ok = (n, x, z) => pruef.push([n, !!x, z]);

  /* --- Filterlisten je Typ ------------------------------------------- */
  const ops = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Filterprobe', icon: '🔎' });
    const { collectionId } = Store.addDatabase(s.id, 'Kontakte', {
      title: { name: 'Name',    type: 'title'  },
      web:   { name: 'Web',     type: 'url'    },
      mail:  { name: 'Mail',    type: 'email'  },
      tel:   { name: 'Telefon', type: 'phone'  },
      wann:  { name: 'Wann',    type: 'date'   },
      nr:    { name: 'Nummer',  type: 'uid'    },
      rup:   { name: 'Rollup',  type: 'rollup' }
    }, 'table');
    const coll = Store.getCollection(collectionId);
    /* Über die Oberfläche: welche Bedingungen bietet das Filtermenü an? */
    const liste = (typ) => {
      const k = Object.keys(coll.schema).find(x => coll.schema[x].type === typ);
      return Datenbank.OPERATOREN[coll.schema[k].type];
    };
    return { collectionId, url: liste('url'), email: liste('email'), phone: liste('phone'),
             uid: liste('uid'), rollup: liste('rollup'), date: liste('date') };
  });

  const acht = ['enthält','enthält nicht','ist','ist nicht','beginnt mit','endet mit','ist leer','ist nicht leer'];
  ok('URL hat alle acht Textbedingungen wie Notion',
     acht.every(x => ops.url.includes(x)), ops.url.length + ' Stück');
  ok('E-Mail ebenso', acht.every(x => ops.email.includes(x)), ops.email.length + ' Stück');
  ok('Telefon ebenso', acht.every(x => ops.phone.includes(x)), ops.phone.length + ' Stück');
  ok('Laufende Nummer hat alle sechs Zahlenvergleiche',
     ['ist gleich','ist nicht gleich','größer als','kleiner als','größer oder gleich','kleiner oder gleich']
       .every(x => ops.uid.includes(x)), ops.uid.length + ' Stück');
  ok('Laufende Nummer hat wie in Notion KEINE Leer-Bedingung',
     !ops.uid.includes('ist leer'));
  ok('Rollup filtert auch mit ≥, ≤, vor und nach',
     ['größer oder gleich','kleiner oder gleich','ist vor','ist nach'].every(x => ops.rollup.includes(x)),
     ops.rollup.length + ' Stück');
  ok('Datum kennt jetzt auch Jahr und nächsten Monat',
     ['ist letztes Jahr','ist dieses Jahr','ist nächstes Jahr','ist nächster Monat']
       .every(x => ops.date.includes(x)), ops.date.length + ' Stück');

  /* --- Filter wirken auch wirklich ------------------------------------ */
  const wirkt = await p.evaluate((cid) => {
    const coll = Store.getCollection(cid);
    const view = Object.values(Store.cache.views).find(v => v.collectionId === cid);
    const wk = Object.keys(coll.schema).find(k => coll.schema[k].type === 'url');
    const dk = Object.keys(coll.schema).find(k => coll.schema[k].type === 'date');
    const jahr = new Date().getFullYear();
    const daten = [
      ['Alpha',  'https://alpha.example',  jahr + '-06-01'],
      ['Beta',   'https://beta.example',  (jahr - 1) + '-06-01'],
      ['Gamma',  'http://gamma.test',     (jahr + 1) + '-06-01']
    ];
    daten.forEach(([t, u, d]) => {
      const r = Store.addRow(cid, {});
      Store.updateBlock(r.id, { text: t, props: { [wk]: u, [dk]: d } });
    });
    const zaehl = (key, op, wert) => {
      Store.updateView(view.id, { filters: { operator: 'and', rules: [{ key, op, wert }] } });
      return Datenbank.zeilen(Store.getCollection(cid), Store.getView(view.id)).map(r => r.text);
    };
    const erg = {
      beginnt: zaehl(wk, 'beginnt mit', 'https'),
      endet:   zaehl(wk, 'endet mit', '.test'),
      istNicht:zaehl(wk, 'ist nicht', 'http://gamma.test'),
      diesJahr:zaehl(dk, 'ist dieses Jahr', ''),
      letztJ:  zaehl(dk, 'ist letztes Jahr', ''),
      naechstJ:zaehl(dk, 'ist nächstes Jahr', '')
    };
    Store.updateView(view.id, { filters: { operator: 'and', rules: [] } });
    return erg;
  }, ops.collectionId);

  ok('„beginnt mit" siebt richtig', wirkt.beginnt.join(',') === 'Alpha,Beta', wirkt.beginnt.join(','));
  ok('„endet mit" siebt richtig', wirkt.endet.join(',') === 'Gamma', wirkt.endet.join(','));
  ok('„ist nicht" siebt richtig', wirkt.istNicht.join(',') === 'Alpha,Beta', wirkt.istNicht.join(','));
  ok('„ist dieses Jahr"', wirkt.diesJahr.join(',') === 'Alpha', wirkt.diesJahr.join(','));
  ok('„ist letztes Jahr"', wirkt.letztJ.join(',') === 'Beta', wirkt.letztJ.join(','));
  ok('„ist nächstes Jahr"', wirkt.naechstJ.join(',') === 'Gamma', wirkt.naechstJ.join(','));

  /* --- Alle 21 Berechnungsarten --------------------------------------- */
  const rechnen = await p.evaluate(() => {
    const R = Datenbank.RECHNUNGEN;
    return { alle: R.alle.length, number: R.number.length, checkbox: R.checkbox.length, date: R.date.length,
             namen: [...R.alle, ...R.number, ...R.checkbox, ...R.date] };
  });
  ok('21 Berechnungsarten insgesamt',
     rechnen.namen.length === 22, rechnen.namen.length + ' inklusive „—"');
  ok('Die 16 aus Notions Hilfe sind alle dabei',
     ['Anzahl alle','Werte zählen','Eindeutige zählen','Leere zählen','Gefüllte zählen','Prozent leer',
      'Prozent gefüllt','Frühestes Datum','Spätestes Datum','Zeitspanne','Summe','Durchschnitt','Median',
      'Minimum','Maximum','Spanne'].every(x => rechnen.namen.includes(x)));
  ok('Dazu Original zeigen und die vier Kontrollkästchen-Arten',
     ['Original zeigen','Aktivierte zählen','Nicht aktivierte zählen','Prozent aktiviert','Prozent nicht aktiviert']
       .every(x => rechnen.namen.includes(x)));

  /* --- Gruppen sortieren ---------------------------------------------- */
  const gruppen = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Gruppenprobe', icon: '⊞' });
    const { collectionId } = Store.addDatabase(s.id, 'Aufgaben', {
      title: { name: 'Name', type: 'title' },
      st:    { name: 'Status', type: 'select', options: [
        { name: 'Zebra', color: 'gray' }, { name: 'Anton', color: 'blue' }, { name: 'Mitte', color: 'green' }
      ] }
    }, 'board');
    const coll = Store.getCollection(collectionId);
    const sk = Object.keys(coll.schema).find(k => coll.schema[k].type === 'select');
    const setze = (t, v) => { const r = Store.addRow(collectionId, {});
                              Store.updateBlock(r.id, { text: t, props: { [sk]: v } }); };
    setze('a', 'Zebra'); setze('b', 'Zebra'); setze('c', 'Zebra');
    setze('d', 'Anton');
    setze('e', 'Mitte'); setze('f', 'Mitte');

    const view = Object.values(Store.cache.views).find(v => v.collectionId === collectionId);
    Store.updateView(view.id, { groupBy: sk, layout: 'board' });
    App.oeffne(s.id);

    const kopfzeilen = () => [...document.querySelectorAll('.board .col h4 .tag')].map(x => x.textContent);
    const mit = (art) => { Store.updateView(view.id, { gruppeSort: art }); App.zeichneSeite(); return kopfzeilen(); };
    return { manuell: mit('manuell'), az: mit('alphabetisch'), za: mit('alphabetisch-ab'),
             viele: mit('anzahl'), wenige: mit('anzahl-auf') };
  });
  await p.waitForTimeout(300);

  ok('Manuell = Reihenfolge der Optionen', gruppen.manuell.join(',') === 'Zebra,Anton,Mitte', gruppen.manuell.join(','));
  ok('Alphabetisch A → Z', gruppen.az.join(',') === 'Anton,Mitte,Zebra', gruppen.az.join(','));
  ok('Alphabetisch Z → A', gruppen.za.join(',') === 'Zebra,Mitte,Anton', gruppen.za.join(','));
  ok('Nach Anzahl, meiste zuerst', gruppen.viele.join(',') === 'Zebra,Mitte,Anton', gruppen.viele.join(','));
  ok('Nach Anzahl, wenigste zuerst', gruppen.wenige.join(',') === 'Anton,Mitte,Zebra', gruppen.wenige.join(','));

  /* --- Der Menüeintrag ist da ----------------------------------------- */
  const menue = await p.evaluate(() => {
    const btn = document.querySelector('.db-kopf-menu, [data-a="dbmenu"], .db-titel');
    /* Direkt die Funktion aufrufen, wie sie das Kopfmenü baut */
    const coll = Object.values(Store.cache.collections).find(c => c.name === 'Aufgaben');
    const view = Object.values(Store.cache.views).find(v => v.collectionId === coll.id);
    Datenbank.dbMenue(document.body, coll, view, Store.getBlock(App.aktuelleSeite()));
    const txt = [...document.querySelectorAll('.menu button[data-a]')].map(x => x.textContent);
    document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
    return txt;
  }).catch(() => []);
  ok('„Gruppen sortieren" steht im Datenbankmenü',
     menue.some(x => x.includes('Gruppen sortieren')), menue.length + ' Einträge');

  console.log('\n=== FILTER, RECHNEN, GRUPPEN ===');
  pruef.forEach(([n, x, z]) => console.log((x ? '✅ ' : '❌ ') + n + (x || z === undefined ? '' : '   → ' + z)));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
