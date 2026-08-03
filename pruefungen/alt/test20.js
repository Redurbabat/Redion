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

  // Excel
  const [w1] = await Promise.all([
    p.waitForEvent('filechooser'),
    p.evaluate(() => Werkzeuge.dateienLesen())
  ]);
  await w1.setFiles('/tmp/test-tabelle.xlsx');
  await p.waitForTimeout(2500);
  const xlsx = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Aufgaben');
    if (!c) return null;
    const zeilen = Store.rowsOf(c.id);
    return { spalten: Object.keys(c.schema).length, zeilen: zeilen.length,
             ersteZeile: zeilen[0]?.text,
             aufwandTyp: Object.values(c.schema).find(d => d.name === 'Aufwand')?.type,
             datumTyp: Object.values(c.schema).find(d => d.name === 'Fällig')?.type,
             zweitesBlatt: !!Object.values(Store.cache.collections).find(x => x.name === 'Notizen') };
  });
  console.log('   Excel:', JSON.stringify(xlsx));
  ok('Excel: Datenbank angelegt', xlsx && xlsx.spalten === 4 && xlsx.zeilen === 3);
  ok('Excel: erste Zeile stimmt', xlsx && xlsx.ersteZeile === 'Angebot schreiben');
  ok('Excel: Zahlenspalte erkannt', xlsx && xlsx.aufwandTyp === 'number');
  ok('Excel: Datumsspalte erkannt', xlsx && xlsx.datumTyp === 'date');
  ok('Excel: zweites Blatt auch', xlsx && xlsx.zweitesBlatt);

  // Word
  const [w2] = await Promise.all([
    p.waitForEvent('filechooser'),
    p.evaluate(() => Werkzeuge.dateienLesen())
  ]);
  await w2.setFiles('/tmp/test-dokument.docx');
  await p.waitForTimeout(2200);
  const docx = await p.evaluate(() => {
    const s = Links.seiteMitTitel('test-dokument');
    if (!s) return null;
    const k = Store.childrenOf(s.id);
    return { anzahl: k.length, typen: k.map(x => x.type).join(','),
             h1: k.find(x => x.type === 'h1')?.text,
             tabelle: k.find(x => x.type === 'table')?.rows?.length };
  });
  console.log('   Word:', JSON.stringify(docx));
  ok('Word: Seite angelegt', docx && docx.anzahl >= 5);
  ok('Word: Überschrift erkannt', docx && docx.h1 === 'Projektbericht');
  ok('Word: Aufzählung erkannt', docx && docx.typen.includes('bullet'));
  ok('Word: Tabelle übernommen', docx && docx.tabelle === 2);

  // EPUB
  const [w3] = await Promise.all([
    p.waitForEvent('filechooser'),
    p.evaluate(() => Werkzeuge.dateienLesen())
  ]);
  await w3.setFiles('/tmp/test-buch.epub');
  await p.waitForTimeout(2200);
  const epub = await p.evaluate(() => {
    const s = Links.seiteMitTitel('Mein Testbuch');
    if (!s) return null;
    const kap = Store.childrenOf(s.id).filter(x => x.type === 'page');
    return { wiki: !!s.wiki, kapitel: kap.length, ersterTitel: kap[0]?.text,
             inhalt: kap[0] ? Store.childrenOf(kap[0].id).map(x => x.text).join(' ') : '' };
  });
  console.log('   EPUB:', JSON.stringify(epub));
  ok('EPUB: Buch als Wiki', epub && epub.wiki);
  ok('EPUB: zwei Kapitel', epub && epub.kapitel === 2);
  ok('EPUB: Kapiteltitel', epub && epub.ersterTitel === 'Erstes Kapitel');
  ok('EPUB: Text übernommen', epub && epub.inhalt.includes('Dienstag'));

  // Nach Neuladen erhalten
  await p.evaluate(() => Store.flush());
  await p.waitForTimeout(700);
  await p.reload();
  await p.waitForTimeout(1600);
  ok('Alles überlebt das Neuladen', await p.evaluate(() =>
    !!Links.seiteMitTitel('Mein Testbuch') && !!Links.seiteMitTitel('test-dokument')));

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(f.length ? 'FEHLER:\n'+[...new Set(f)].slice(0,6).join('\n') : 'Keine JS-Fehler.');
})();
