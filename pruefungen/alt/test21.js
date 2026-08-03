const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED|ERR_/.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  /* ---------------------------------------------------------------
   * 1) Formeln lesen durch Verknüpfungen
   * -------------------------------------------------------------*/
  const rel = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Formeltest' });

    const posten = Store.addDatabase(s.id, 'Posten', {
      title: { name: 'Posten', type: 'title' },
      s0:    { name: 'Kosten', type: 'number' },
      s1:    { name: 'Bezahlt', type: 'checkbox' }
    }, 'table');

    const proj = Store.addDatabase(s.id, 'Projekte', {
      title: { name: 'Projekt', type: 'title' }
    }, 'table');

    /* Verknüpfung Projekte -> Posten */
    const pc = Store.getCollection(proj.collectionId);
    pc.schema.s0 = { name: 'Posten', type: 'relation', ziel: posten.collectionId };
    pc.schema.s1 = { name: 'Summe', type: 'formula',
                     formula: 'map(prop("Posten"), current.prop("Kosten")).sum()' };
    pc.schema.s2 = { name: 'Namen', type: 'formula',
                     formula: 'join(prop("Posten"), " + ")' };
    pc.schema.s3 = { name: 'Offen', type: 'formula',
                     formula: 'filter(prop("Posten"), not(current.prop("Bezahlt"))).length()' };
    pc.schema.s4 = { name: 'Teuerste', type: 'formula',
                     formula: 'map(prop("Posten"), current.prop("Kosten")).max()' };
    Store.updateCollection(pc.id, { schema: pc.schema });

    const a = Store.addRow(posten.collectionId, { s0: 100, s1: true });
    Store.updateBlock(a.id, { text: 'Kabel' });
    const c = Store.addRow(posten.collectionId, { s0: 250, s1: false });
    Store.updateBlock(c.id, { text: 'Montage' });
    const d = Store.addRow(posten.collectionId, { s0: 40, s1: false });
    Store.updateBlock(d.id, { text: 'Kleinteile' });

    const pr = Store.addRow(proj.collectionId, { s0: [a.id, c.id, d.id] });
    Store.updateBlock(pr.id, { text: 'Umbau' });

    const w = (k) => Datenbank.wert(Store.getBlock(pr.id), k, Store.getCollection(pc.id));
    return { summe: w('s1'), namen: w('s2'), offen: w('s3'), max: w('s4') };
  });
  console.log('   Relation-Formeln:', JSON.stringify(rel));
  ok('Formel: Summe durch Verknüpfung', rel.summe === 390);
  ok('Formel: Titel statt IDs', rel.namen === 'Kabel + Montage + Kleinteile');
  ok('Formel: filter über Verknüpfung', rel.offen === 2);
  ok('Formel: max über Verknüpfung', rel.max === 250);

  /* Formel, die sich im Kreis dreht, darf die App nicht aufhängen */
  const kreis = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Projekte');
    c.schema.s5 = { name: 'Kreis', type: 'formula', formula: 'prop("Kreis") + 1' };
    Store.updateCollection(c.id, { schema: c.schema });
    const r = Store.rowsOf(c.id)[0];
    return String(Datenbank.wert(r, 's5', c));
  });
  console.log('   Kreis:', kreis);
  ok('Formel: Kreis wird abgefangen', /Kreis|⚠/.test(kreis));

  /* ---------------------------------------------------------------
   * 2) Wiederkehrende Vorlagen
   * -------------------------------------------------------------*/
  const wdh = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Journaltest' });
    const db = Store.addDatabase(s.id, 'Journal', {
      title: { name: 'Eintrag', type: 'title' },
      s0:    { name: 'Datum', type: 'date' }
    }, 'table');
    const c = Store.getCollection(db.collectionId);
    c.vorlagen = [{
      name: 'Tagesnotiz', icon: '📓',
      titel: 'Notiz {datum}',
      props: { s0: 'heute' },
      inhalt: [],
      wdh: { art: 'taeglich', tag: null, stunde: 0, zuletzt: null }
    }];
    Store.updateCollection(c.id, { vorlagen: c.vorlagen });

    Datenbank.vorlagenLaufen();
    const nach1 = Store.rowsOf(c.id).length;
    Datenbank.vorlagenLaufen();          /* zweimal am selben Tag = nur einmal */
    const nach2 = Store.rowsOf(c.id).length;
    const z = Store.rowsOf(c.id)[0];
    const heute = new Date();
    const iso = heute.getFullYear() + '-' +
                String(heute.getMonth()+1).padStart(2,'0') + '-' +
                String(heute.getDate()).padStart(2,'0');
    return { nach1, nach2, titel: z && z.text, datum: z && z.props.s0, iso,
             gemerkt: c.vorlagen[0].wdh.zuletzt };
  });
  console.log('   Wiederholung:', JSON.stringify(wdh));
  ok('Vorlage: legt sich selbst an', wdh.nach1 === 1);
  ok('Vorlage: nur einmal je Tag', wdh.nach2 === 1);
  ok('Vorlage: {datum} ersetzt', /^Notiz \d{1,2}\.\d{1,2}\.\d{4}$/.test(wdh.titel || ''));
  ok('Vorlage: heute wird zum Datum', wdh.datum === wdh.iso);

  /* ---------------------------------------------------------------
   * 3) Wiederkehrende Aufgabe beim Abschliessen
   * -------------------------------------------------------------*/
  const auf = await p.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Aufgabentest' });
    const db = Store.addDatabase(s.id, 'Pflichten', {
      title: { name: 'Aufgabe', type: 'title' },
      s0:    { name: 'Fällig', type: 'date' },
      s1:    { name: 'Status', type: 'select', optionen: ['Offen','Erledigt'] }
    }, 'table');
    const c = Store.getCollection(db.collectionId);
    c.automationen = [{
      id: 'w1', name: 'Wiederkehrend', an: true,
      wenn: { art: 'prop-wert', key: 's1', wert: 'Erledigt' },
      bedingungen: [],
      dann: [{ art: 'wiederholen', key: 's0', text: '1 Woche' }]
    }];
    Store.updateCollection(c.id, { automationen: c.automationen });

    const r = Store.addRow(c.id, { s0: '2026-08-03', s1: 'Offen' });
    Store.updateBlock(r.id, { text: 'Müll rausbringen' });

    Store.setProp(r.id, 's1', 'Erledigt');
    await new Promise(x => setTimeout(x, 400));

    const zeilen = Store.rowsOf(c.id);
    const neu = zeilen.find(z => z.id !== r.id);
    return { anzahl: zeilen.length, titel: neu && neu.text,
             datum: neu && neu.props.s0, status: neu && neu.props.s1,
             altStatus: Store.getBlock(r.id).props.s1 };
  });
  console.log('   Wiederkehrende Aufgabe:', JSON.stringify(auf));
  ok('Aufgabe: nächster Termin entsteht', auf.anzahl === 2);
  ok('Aufgabe: Titel bleibt', auf.titel === 'Müll rausbringen');
  ok('Aufgabe: eine Woche weiter', auf.datum === '2026-08-10');
  ok('Aufgabe: neuer Eintrag ist offen', auf.status === '');
  ok('Aufgabe: alter bleibt erledigt', auf.altStatus === 'Erledigt');

  /* Verschiedene Takte */
  const takte = await p.evaluate(() => ({
    tag:     Datenbank.naechstesDatum('2026-08-03', '3 Tage'),
    monat:   Datenbank.naechstesDatum('2026-08-31', '1 Monat'),
    jahr:    Datenbank.naechstesDatum('2026-02-28', '1 Jahr'),
    werktag: Datenbank.naechstesDatum('2026-08-07', '1 Werktag')   /* Freitag -> Montag */
  }));
  console.log('   Takte:', JSON.stringify(takte));
  ok('Takt: Tage', takte.tag === '2026-08-06');
  ok('Takt: Monat', takte.monat.startsWith('2026-09'));
  ok('Takt: Jahr', takte.jahr === '2027-02-28');
  ok('Takt: Werktag springt übers Wochenende', takte.werktag === '2026-08-10');

  /* ---------------------------------------------------------------
   * 4) Knopf ändert Einträge einer anderen Datenbank
   * -------------------------------------------------------------*/
  const knopf = await p.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Knopftest' });
    const db = Store.addDatabase(s.id, 'Inbox', {
      title: { name: 'Sache', type: 'title' },
      s0:    { name: 'Status', type: 'select', optionen: ['Neu','Archiv'] }
    }, 'table');
    const c = Store.getCollection(db.collectionId);
    ['A','B','C'].forEach((n, i) => {
      const r = Store.addRow(c.id, { s0: i === 2 ? 'Archiv' : 'Neu' });
      Store.updateBlock(r.id, { text: n });
    });

    const n = Datenbank.fremdSetzen({
      ziel: c.id, zielKey: 's0', wert: 'Archiv',
      filterKey: 's0', filterOp: 'ist', filterWert: 'Neu'
    }, null, null);
    await new Promise(x => setTimeout(x, 200));
    return { geaendert: n, alle: Store.rowsOf(c.id).map(z => z.props.s0).join(',') };
  });
  console.log('   Knopf:', JSON.stringify(knopf));
  ok('Knopf: nur gefilterte Einträge', knopf.geaendert === 2);
  ok('Knopf: alle stehen auf Archiv', knopf.alle === 'Archiv,Archiv,Archiv');

  /* Nach dem Neuladen muss alles noch da sein */
  await p.evaluate(() => Store.flush());
  await p.waitForTimeout(600);
  await p.reload();
  await p.waitForTimeout(1600);
  const nachher = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Projekte');
    const r = Store.rowsOf(c.id)[0];
    const j = Object.values(Store.cache.collections).find(x => x.name === 'Journal');
    return { summe: Datenbank.wert(r, 's1', c), vorlage: (j.vorlagen || []).length };
  });
  ok('Alles überlebt das Neuladen', nachher.summe === 390 && nachher.vorlage === 1);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
