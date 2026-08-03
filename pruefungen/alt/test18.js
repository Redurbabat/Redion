const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED|tile.openstreetmap|nominatim|ERR_/.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);
  const esc=async()=>{await p.keyboard.press('Escape');await p.waitForTimeout(250);};

  // Netzwerk abfangen: keine echten Anfragen im Test
  await p.route('**tile.openstreetmap.org/**', r => r.abort());
  await p.route('**nominatim.openstreetmap.org/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json',
                body: JSON.stringify([{ lat: '48.1372', lon: '11.5755', display_name: 'München' }]) }));
  await p.route('**de.wikipedia.org/**', r =>
    r.fulfill({ status: 200, contentType: 'application/json',
                body: JSON.stringify({ title:'Notion', extract:'Notion ist eine Software für Notizen.',
                                       content_urls:{ desktop:{ page:'https://de.wikipedia.org/wiki/Notion' } } }) }));
  await p.route('**hooks.test/**', r => r.fulfill({ status: 200, body: 'ok' }));

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  // Schlüsselbereich
  await p.keyboard.press('Control+,');
  await p.waitForTimeout(500);
  ok('19 Bereiche in den Einstellungen', await p.locator('.einst-nav button[data-b]').count() === 19);
  await p.click('.einst-nav button[data-b="schluessel"]');
  await p.waitForTimeout(400);
  ok('Schlüsselbereich offen', await p.locator('[data-set^="api:"]').count() >= 8);
  ok('Kostenlos-Kennzeichen', await p.locator('.ez-text .frei').count() >= 3);
  await p.fill('[data-set="api:groq"]', 'testschluessel-123');
  await p.waitForTimeout(400);
  ok('Schlüssel wird gespeichert', await p.evaluate(() => Store.getMeta('api:groq') === 'testschluessel-123'));
  await esc();

  // Wolkenmodelle erscheinen im Modellmenü
  await p.click('#btn-ai');
  await p.waitForTimeout(400);
  await p.click('.model-btn');
  await p.waitForTimeout(700);
  const wolke = await p.locator('.menu button[data-q="wolke"]').count();
  ok('Wolkenmodelle im Menü (' + wolke + ')', wolke === 3);
  ok('Schlüssel-Eintrag im Menü', await p.locator('.menu button[data-q="schluessel"]').count() === 1);
  await esc();

  // Kartenansicht
  await p.evaluate(() => {
    const c = Object.values(Store.cache.collections)[0];
    c.schema.ort = { name: 'Ort', type: 'text' };
    Store.updateCollection(c.id, { schema: c.schema });
    Store.rowsOf(c.id).forEach((r, i) => Store.setProp(r.id, 'ort', ['München','Berlin','Hamburg'][i] || 'Köln'));
    App.zeichneSeite();
  });
  await p.waitForTimeout(500);
  await p.locator('.db-tab', { hasText: '+' }).first().click();
  await p.waitForTimeout(350);
  ok('Elf Ansichtstypen', await p.locator('.menu button[data-l]').count() === 11);
  await p.click('.menu button[data-l="map"]');
  await p.waitForTimeout(800);
  ok('Karte gezeichnet', await p.locator('.karte').count() === 1);
  ok('Kacheln angefordert', await p.locator('.karte .kachel').count() > 0);
  ok('Nachschlagen angeboten', await p.locator('.karte-kopf [data-a="suchen"]').count() === 1);
  await p.click('.karte-kopf [data-a="suchen"]');
  await p.waitForTimeout(4500);
  const nadeln = await p.locator('.nadel').count();
  ok('Nadeln gesetzt (' + nadeln + ')', nadeln >= 1);

  // Verknüpfte Ansicht
  await p.evaluate(() => {
    const s = Links.seiteMitTitel('Willkommen');
    App.oeffne(s.id);
  });
  await p.waitForTimeout(500);
  const linked = await p.evaluate(() => {
    const s = App.aktuelleSeite();
    const c = Object.values(Store.cache.collections)[0];
    const v = Store.addView(c.id, 'board', 'Verknüpft');
    const b2 = Store.addBlock(s, 'linkeddb', { collectionId: c.id, aktiveView: v.id, verknuepft: true });
    App.zeichneSeite();
    return { block: b2.id, coll: c.id };
  });
  await p.waitForTimeout(700);
  ok('Verknüpfte Ansicht zeigt Daten', await p.locator('.linked-kopf').count() === 1);
  ok('Zwei Datenbankblöcke, eine Sammlung', await p.evaluate(() =>
    Object.values(Store.cache.blocks).filter(b => b.type === 'database' || b.type === 'linkeddb').length === 2 &&
    Object.keys(Store.cache.collections).length === 1));
  await p.evaluate((d) => { Store.trashBlock(d.block); Store.purgeBlock(d.block); App.zeichneSeite(); }, linked);
  await p.waitForTimeout(500);
  ok('Löschen der Verknüpfung lässt die Daten stehen',
     await p.evaluate(() => Object.keys(Store.cache.collections).length === 1));

  // Wikipedia
  await p.evaluate(() => KI.nachschlagen('Notion'));
  await p.waitForTimeout(900);
  ok('Wikipedia-Antwort im Chat', (await p.locator('#chat .msg.a').last().textContent()).includes('Software'));
  ok('Einfügen-Knopf da', await p.locator('#chat [data-a="ein"]').count() === 1);
  await p.click('#chat [data-a="ein"]');
  await p.waitForTimeout(600);
  ok('Zitat eingefügt', await p.locator('#page .b-quote').count() >= 1);

  // Webhook-Aktion
  const hook = await p.evaluate(async () => {
    const c = Object.values(Store.cache.collections)[0];
    c.automationen = [{ id:'w1', name:'Hook', an:true,
      wenn:{ art:'zeile-neu' }, dann:[{ art:'webhook', text:'https://hooks.test/abc' }] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    let gerufen = false;
    const alt = window.fetch;
    window.fetch = (u, o) => { if (String(u).includes('hooks.test')) gerufen = true; return alt(u, o); };
    Store.addRow(c.id, {});
    await new Promise(r => setTimeout(r, 500));
    window.fetch = alt;
    return gerufen;
  });
  ok('Webhook wird ausgelöst', hook === true);

  await b.close();
  console.log('\n=== ERGEBNIS ===');
  let gut=0; pruef.forEach(([n,x])=>{console.log((x?'✅':'❌')+' '+n); if(x)gut++;});
  console.log(`\n${gut}/${pruef.length} bestanden`);
  console.log(f.length ? 'FEHLER:\n'+[...new Set(f)].slice(0,6).join('\n') : 'Keine JS-Fehler.');
})();
