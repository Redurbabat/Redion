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

  const galerie = await p.evaluate(() => Galerie.VORLAGEN
    ? Galerie.VORLAGEN.map(v => v.id) : null);
  console.log('   Galerie:', JSON.stringify(galerie));

  /* --- Musik ------------------------------------------------------------ */
  const musik = await p.evaluate(() => {
    const seite = Galerie.bauen ? Galerie.bauen('musik') : null;
    const songs = Object.values(Store.cache.collections).find(c => c.name === 'Song-Bibliothek');
    const pls   = Object.values(Store.cache.collections).find(c => c.name === 'Playlists');
    if (!songs) return null;
    const zeilen = Store.rowsOf(songs.id);
    const ansichten = songs.viewIds.map(id => {
      const v = Store.getView(id);
      return { name: v.name, layout: v.layout, groupBy: v.groupBy };
    });
    const eine = Store.rowsOf(pls.id).find(r => r.text.includes('Gym'));
    return {
      spalten: Object.keys(songs.schema).length,
      genreTyp: songs.schema.genre.type,
      genreOptionen: songs.schema.genre.options.length,
      stimmungen: songs.schema.st.options.map(o => o.name),
      songs: zeilen.length,
      genreEines: zeilen[0].props.genre,
      ansichten,
      plSpalten: Object.keys(pls.schema).length,
      plSchnitt: Datenbank.wert(eine, 'schnitt', pls)
    };
  });
  console.log('   Musik:', JSON.stringify(musik));
  ok('Song-Bibliothek hat elf Spalten', musik.spalten === 11);
  ok('Genre ist Mehrfachauswahl mit neun Optionen',
     musik.genreTyp === 'multi' && musik.genreOptionen === 9);
  ok('Fünf Stimmungen', musik.stimmungen.length === 5 && musik.stimmungen[0] === '🔥 Power');
  ok('Songs mit mehreren Genres', Array.isArray(musik.genreEines) && musik.genreEines.length === 2);
  ok('Vier Ansichten', musik.ansichten.length === 4);
  ok('Board gruppiert nach Stimmung',
     musik.ansichten.some(a => a.layout === 'board' && a.groupBy === 'st'));
  ok('Galerie und Liste dabei',
     musik.ansichten.some(a => a.layout === 'gallery') && musik.ansichten.some(a => a.layout === 'list'));
  ok('Playlists rechnen Minuten je Song', Math.abs(musik.plSchnitt - 4.8) < 0.05);

  /* --- Analyse ----------------------------------------------------------- */
  const analyse = await p.evaluate(() => {
    Galerie.bauen('analyse');
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Täglicher Check-in');
    const zeilen = Store.rowsOf(c.id);
    const di = zeilen.find(r => r.text === 'Dienstag');
    const mo = zeilen.find(r => r.text === 'Montag');
    const sa = zeilen.find(r => r.text === 'Samstag');
    const seite = Object.values(Store.cache.blocks).find(x => x.text === 'Persönliche Analyse');
    const bloecke = Store.childrenOf(seite.id).map(x => x.type);
    return {
      spalten: Object.keys(c.schema).length,
      tage: zeilen.length,
      diScore: Datenbank.wert(di, 'score', c),
      diBewertung: Datenbank.wert(di, 'bewertung', c),
      moScore: Datenbank.wert(mo, 'score', c),
      moBewertung: Datenbank.wert(mo, 'bewertung', c),
      saScore: Datenbank.wert(sa, 'score', c),
      wochentag: Datenbank.wert(di, 'wt', c),
      ansichten: c.viewIds.length,
      bloecke,
      zitate: bloecke.filter(t => t === 'quote').length,
      callouts: bloecke.filter(t => t === 'callout').length
    };
  });
  console.log('   Analyse:', JSON.stringify(analyse));
  ok('Check-in hat 16 Spalten', analyse.spalten === 16);
  ok('Sieben Beispieltage', analyse.tage === 7);
  ok('Dienstag hat Score 4', analyse.diScore === 4);
  ok('Score 4 gibt Top-Tag', analyse.diBewertung === '🔥 Top-Tag');
  ok('Montag hat Score 3', analyse.moScore === 3);
  ok('Score 3 gibt Guter Tag', analyse.moBewertung === '👍 Guter Tag');
  ok('Wochentag wird berechnet', /^[A-ZÄÖÜ]/.test(String(analyse.wochentag)));
  ok('Zwei Ansichten', analyse.ansichten === 2);
  ok('Zwei Zitate mit den Zusammenhängen', analyse.zitate === 2);
  ok('Zwei Callouts: Hinweis und Vorschlag', analyse.callouts === 2);

  /* --- Fitness-OS mit zwölf Ansichten ------------------------------------ */
  const fit = await p.evaluate(() => {
    Galerie.bauen('fitness');
    const seite = Object.values(Store.cache.blocks).find(x => x.text === 'Fitness-OS');
    const colls = Store.childrenOf(seite.id)
      .filter(b => b.type === 'database')
      .map(b => Store.getCollection(b.collectionId))
      .filter(Boolean);
    const eigene = [];
    colls.forEach(c => c.viewIds.forEach((id, i) => {
      const v = Store.getView(id);
      if (i === 0) return;                    /* die erste ist die Standardansicht */
      eigene.push({ db: c.name, name: v.name, layout: v.layout,
                    filter: (v.filters?.rules || []).length,
                    sort: (v.sorts || []).length,
                    gruppe: v.groupBy || '' });
    }));
    return { dbs: colls.length, zusatz: eigene.length, liste: eigene };
  });
  console.log('   Fitness:', JSON.stringify(fit.liste.map(x => x.db + '/' + x.name + ' (' + x.layout + ')')));
  ok('Zehn Datenbanken', fit.dbs === 10);
  ok('Zwölf zusätzliche Ansichten', fit.zusatz === 12);
  ok('Mehrere Ansichten haben einen Filter', fit.liste.filter(x => x.filter > 0).length >= 5);
  ok('Boards sind gruppiert', fit.liste.filter(x => x.layout === 'board' && x.gruppe).length === 2);
  ok('Kalender, Zeitstrahl und Diagramme dabei',
     fit.liste.some(x => x.layout === 'calendar') &&
     fit.liste.some(x => x.layout === 'timeline') &&
     fit.liste.filter(x => x.layout === 'chart').length === 3);

  /* --- Ansichten funktionieren wirklich ---------------------------------- */
  const zeigen = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Satz-Protokoll');
    const v = c.viewIds.map(id => Store.getView(id)).find(x => x.name === 'Harte Sätze');
    const alle = Store.rowsOf(c.id).length;
    const durch = Store.rowsOf(c.id).filter(r => Datenbank.gruppeTrifftZu(r, v.filters, c)).length;
    return { alle, durch };
  });
  console.log('   Filter Harte Sätze:', JSON.stringify(zeigen));
  ok('Filter Harte Sätze wirkt', zeigen.durch < zeigen.alle && zeigen.durch >= 1);

  await p.evaluate(() => Store.flush());
  await p.waitForTimeout(700);
  await p.reload();
  await p.waitForTimeout(1600);
  const nach = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Song-Bibliothek');
    return c ? c.viewIds.length : 0;
  });
  ok('Überlebt das Neuladen', nach === 4);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
