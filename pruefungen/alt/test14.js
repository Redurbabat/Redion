const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED/.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);
  const esc=async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(250);};

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  // Zeilenvorlagen
  await p.click('.db-tools button[data-a="new-menu"]');
  await p.waitForTimeout(400);
  ok('Vorlagenmenü am Neu-Knopf', await p.locator('.menu button[data-a="neu"]').count() === 1);
  await esc();
  const vorlage = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    const z = Store.rowsOf(c.id)[0];
    c.vorlagen = [{ name: 'Standardaufgabe', icon: '🧩',
                    props: JSON.parse(JSON.stringify(z.props||{})), titel: 'Aus Vorlage', inhalt: [] }];
    Store.updateCollection(c.id, { vorlagen: c.vorlagen });
    App.zeichneSeite();
    return c.id;
  });
  await p.waitForTimeout(400);
  await p.click('.db-tools button[data-a="new-menu"]');
  await p.waitForTimeout(400);
  ok('Vorlage im Menü', await p.locator('.menu button[data-v="0"]').count() === 1);
  await p.click('.menu button[data-v="0"]');
  await p.waitForTimeout(600);
  ok('Eintrag aus Vorlage', await p.evaluate((cid) =>
    Store.rowsOf(cid).some(r => r.text === 'Aus Vorlage'), vorlage));

  // Knopf mit mehreren Aktionen
  const knopf = await p.evaluate(() => {
    const s = App.aktuelleSeite();
    const b2 = Store.addBlock(s, 'button', {
      text: 'Tagesstart', bestaetigen: false,
      aktionen: [
        { art: 'block', blockTyp: 'todo', blockText: 'Wasser trinken' },
        { art: 'block', blockTyp: 'todo', blockText: 'Sport machen' },
        { art: 'meldung', text: 'Guten Start!' }
      ]
    });
    App.zeichneSeite();
    return b2.id;
  });
  await p.waitForTimeout(500);
  const vorher = await p.locator('#page .b-todo').count();
  await p.click('.knopf');
  await p.waitForTimeout(800);
  const nachher = await p.locator('#page .b-todo').count();
  ok('Knopf führt 2 Blöcke aus (' + vorher + ' → ' + nachher + ')', nachher === vorher + 2);

  // Automation mit Zähler
  const zaehler = await p.evaluate(async () => {
    const c = Object.values(Store.cache.collections)[0];
    c.schema.cnt = { name: 'Zähler', type: 'number' };
    c.automationen = [{ id:'a1', name:'Zählen', an:true,
      wenn:{ art:'prop-geaendert', key: Object.keys(c.schema).find(k=>c.schema[k].type==='status') },
      dann:[{ art:'zaehler', key:'cnt' }] }];
    Store.updateCollection(c.id, { schema: c.schema, automationen: c.automationen });
    const r = Store.rowsOf(c.id)[0];
    Store.setProp(r.id, c.automationen[0].wenn.key, 'Offen');
    await new Promise(x => setTimeout(x, 350));
    Store.setProp(r.id, c.automationen[0].wenn.key, 'Erledigt');
    await new Promise(x => setTimeout(x, 350));
    return Store.getBlock(r.id).props.cnt;
  });
  ok('Automation zählt hoch (' + zaehler + ')', zaehler >= 2);

  // Papierkorb-Frist
  const geraeumt = await p.evaluate(() => {
    Store.setMeta('papierkorbTage', 30);
    const alt = Store.addPage(null, { text: 'Uralt' });
    Store.trashBlock(alt.id);
    const b2 = Store.getBlock(alt.id);
    b2.trashedAt = new Date(Date.now() - 40 * 86400000).toISOString();
    const vorher = Store.trashed().length;
    Werkzeuge.papierkorbAufraeumen();
    return { vorher, nachher: Store.trashed().length };
  });
  ok('Alter Papierkorb wird geleert (' + geraeumt.vorher + ' → ' + geraeumt.nachher + ')',
     geraeumt.nachher < geraeumt.vorher);

  // Einstellung dazu vorhanden
  await p.keyboard.press('Control+,');
  await p.waitForTimeout(500);
  await p.click('.einst-nav button[data-b="speicher"]');
  await p.waitForTimeout(350);
  ok('Frist in den Einstellungen', await p.locator('[data-set="papierkorbTage"]').count() === 1);
  await esc();

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(f.length ? 'FEHLER:\n'+[...new Set(f)].slice(0,6).join('\n') : 'Keine JS-Fehler.');
})();
