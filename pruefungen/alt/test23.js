const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED|ERR_|nominatim/i.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  /* --- 1) Eigenschaftstypen ------------------------------------------- */
  const typen = await p.evaluate(() => ({
    anzahl: Datenbank.TYPEN.length,
    ids: Datenbank.TYPEN.map(t => t.id),
    rollups: Datenbank.ROLLUP_ARTEN.length
  }));
  console.log('   Typen:', typen.anzahl, '| Rollup-Arten:', typen.rollups);
  ok('29 Eigenschaftstypen', typen.anzahl === 29);
  ok('Erstellt von dabei', typen.ids.includes('createdBy'));
  ok('Ort dabei', typen.ids.includes('place'));
  ok('Prüfung dabei', typen.ids.includes('verify'));
  ok('Zeitspanne dabei', typen.ids.includes('duration'));
  ok('21 Berechnungsarten', typen.rollups === 21);

  /* --- 2) Berechnungen ------------------------------------------------- */
  const rech = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Rechentest' });
    const db = Store.addDatabase(s.id, 'Zahlen', {
      title: { name: 'Sache', type: 'title' },
      n:  { name: 'Zahl', type: 'number' },
      c:  { name: 'Haken', type: 'checkbox' },
      d:  { name: 'Tag', type: 'date' }
    }, 'table');
    const c = Store.getCollection(db.collectionId);
    [[10, true, '2026-01-01'], [20, false, '2026-01-11'], [30, true, ''], ['', false, '2026-02-10']]
      .forEach(([n, h, t], i) => {
        const r = Store.addRow(c.id, { n, c: h, d: t });
        Store.updateBlock(r.id, { text: 'Zeile ' + (i + 1) });
      });
    const rows = Store.rowsOf(c.id);
    const R = (art, k) => String(Datenbank.rechne(art, rows, k, c));
    return {
      anzahl: R('Anzahl alle', 'n'), werte: R('Werte zählen', 'n'),
      leer: R('Leere zählen', 'n'), pleer: R('Prozent leer', 'n'),
      pvoll: R('Prozent gefüllt', 'n'),
      summe: R('Summe', 'n'), schnitt: R('Durchschnitt', 'n'),
      median: R('Median', 'n'), spanne: R('Spanne', 'n'),
      eindeutig: R('Eindeutige zählen', 'n'),
      hakenAn: R('Aktivierte zählen', 'c'), hakenAus: R('Nicht aktivierte zählen', 'c'),
      pAn: R('Prozent aktiviert', 'c'), pAus: R('Prozent nicht aktiviert', 'c'),
      frueh: R('Frühestes Datum', 'd'), spaet: R('Spätestes Datum', 'd'),
      zeitspanne: R('Zeitspanne', 'd'),
      original: R('Original zeigen', 'n'),
      collId: c.id
    };
  });
  console.log('   Rechnen:', JSON.stringify(rech));
  ok('Summe', rech.summe === '60');
  ok('Durchschnitt', rech.schnitt === '20');
  ok('Median', rech.median === '20');
  ok('Spanne', rech.spanne === '20');
  ok('Leere zählen', rech.leer === '1');
  ok('Prozent leer', rech.pleer === '25 %');
  ok('Prozent gefüllt', rech.pvoll === '75 %');
  ok('Aktivierte zählen', rech.hakenAn === '2');
  ok('Prozent aktiviert', rech.pAn === '50 %');
  ok('Prozent nicht aktiviert', rech.pAus === '50 %');
  ok('Frühestes Datum', rech.frueh === '1.1.2026');
  ok('Spätestes Datum', rech.spaet === '10.2.2026');
  ok('Zeitspanne in Tagen', rech.zeitspanne === '40 Tage');
  ok('Original zeigen', rech.original === '10, 20, 30');

  /* --- 3) Rollup nutzt dieselben Arten --------------------------------- */
  const roll = await p.evaluate((collId) => {
    const s = Store.addPage(null, { text: 'Rolluptest' });
    const db = Store.addDatabase(s.id, 'Oben', { title: { name: 'Kopf', type: 'title' } }, 'table');
    const c = Store.getCollection(db.collectionId);
    c.schema.r  = { name: 'Zeilen', type: 'relation', ziel: collId };
    c.schema.p1 = { name: 'Prozent leer', type: 'rollup', relation: 'r', zielKey: 'n', rollup: 'Prozent leer' };
    c.schema.p2 = { name: 'Zeitspanne', type: 'rollup', relation: 'r', zielKey: 'd', rollup: 'Zeitspanne' };
    c.schema.p3 = { name: 'Prozent nicht aktiviert', type: 'rollup', relation: 'r', zielKey: 'c',
                    rollup: 'Prozent nicht aktiviert' };
    Store.updateCollection(c.id, { schema: c.schema });
    const alle = Store.rowsOf(collId).map(x => x.id);
    const r = Store.addRow(c.id, { r: alle });
    Store.updateBlock(r.id, { text: 'Alles' });
    const w = (k) => String(Datenbank.wert(Store.getBlock(r.id), k, Store.getCollection(c.id)));
    return { p1: w('p1'), p2: w('p2'), p3: w('p3') };
  }, rech.collId);
  console.log('   Rollup:', JSON.stringify(roll));
  ok('Rollup: Prozent leer', roll.p1 === '25 %');
  ok('Rollup: Zeitspanne', roll.p2 === '40 Tage');
  ok('Rollup: Prozent nicht aktiviert', roll.p3 === '50 %');

  /* --- 4) Neue Typen im Einsatz ---------------------------------------- */
  const neu = await p.evaluate(() => {
    Store.setMeta('nutzer', 'Red');
    const s = Store.addPage(null, { text: 'Typentest' });
    const db = Store.addDatabase(s.id, 'Termine', {
      title: { name: 'Was', type: 'title' },
      a: { name: 'Dauer', type: 'duration' },
      b: { name: 'Ort', type: 'place' },
      c: { name: 'Prüfung', type: 'verify' },
      d: { name: 'Von', type: 'createdBy' }
    }, 'table');
    const c = Store.getCollection(db.collectionId);
    const r = Store.addRow(c.id, {
      a: 95,
      b: { name: 'Zürich HB', lat: 47.3779, lon: 8.5403 },
      c: { stand: 'ok', wer: 'Red', wann: Store.now(), bis: '' }
    });
    Store.updateBlock(r.id, { text: 'Sitzung' });
    const abg = Store.addRow(c.id, { c: { stand: 'ok', wer: 'Red', bis: '2020-01-01' } });
    Store.updateBlock(abg.id, { text: 'Alt' });
    const z = (k, row) => Datenbank.zelle(row || Store.getBlock(r.id), k, c);
    const F = (op, key) => Store.rowsOf(c.id)
      .filter(x => Datenbank.gruppeTrifftZu(x, { operator: 'and', rules: [{ key, op, wert: '' }] }, c)).length;
    return {
      dauer: z('a'), ort: z('b'), pruef: z('c'), von: z('d'),
      abgelaufen: z('c', Store.getBlock(abg.id)),
      erstelltVon: Datenbank.wert(Store.getBlock(r.id), 'd', c),
      fGeprueft: F('ist geprüft', 'c'), fAbgelaufen: F('ist abgelaufen', 'c'),
      lesen: [Datenbank.dauerLesen('1h30'), Datenbank.dauerLesen('90'),
              Datenbank.dauerLesen('1:30'), Datenbank.dauerLesen('2 Stunden')]
    };
  });
  console.log('   Neue Typen:', JSON.stringify(neu));
  ok('Zeitspanne zeigt 1 h 35 min', neu.dauer.includes('1 h 35 min'));
  ok('Zeitspanne liest alle Schreibweisen', JSON.stringify(neu.lesen) === '[90,90,90,120]');
  ok('Ort verlinkt auf OpenStreetMap', neu.ort.includes('openstreetmap.org') && neu.ort.includes('Zürich HB'));
  ok('Prüfung zeigt geprüft', neu.pruef.includes('geprüft') && neu.pruef.includes('bg-green'));
  ok('Abgelaufene Prüfung erkannt', neu.abgelaufen.includes('abgelaufen'));
  ok('Erstellt von trägt den Namen', neu.erstelltVon === 'Red' && neu.von.includes('Red'));
  ok('Filter ist geprüft', neu.fGeprueft === 1);
  ok('Filter ist abgelaufen', neu.fAbgelaufen === 1);

  /* --- 5) Neuladen ------------------------------------------------------ */
  await p.evaluate(() => Store.flush());
  await p.waitForTimeout(600);
  await p.reload();
  await p.waitForTimeout(1600);
  const nach = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Termine');
    const r = Store.rowsOf(c.id).find(x => x.text === 'Sitzung');
    return { dauer: Datenbank.wert(r, 'a', c), ort: (Datenbank.wert(r, 'b', c) || {}).name };
  });
  ok('Überlebt das Neuladen', nach.dauer === 95 && nach.ort === 'Zürich HB');

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
