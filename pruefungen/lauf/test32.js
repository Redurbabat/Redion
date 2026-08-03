const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED|ERR_/i.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1700);

  /* ===============================================================
   * 1) Menüs mit Suchfeld — Notions Muster
   * =============================================================*/
  const seite = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Vergleichstest' });
    Store.addBlock(s.id, 'h1', { text: 'Erster Abschnitt' });
    Store.addBlock(s.id, 'text', { text: 'Etwas Text mit mehreren Wörtern darin.' });
    Store.addBlock(s.id, 'h2', { text: 'Zweiter Abschnitt' });
    Store.addBlock(s.id, 'text', { text: 'Noch mehr Text hier.' });
    Store.addBlock(s.id, 'h2', { text: 'Dritter Abschnitt' });
    Store.addBlock(s.id, 'h3', { text: 'Ein Unterpunkt' });
    App.oeffne(s.id);
    return s.id;
  });
  await p.waitForTimeout(700);

  await p.click('#btn-page-menu');
  await p.waitForTimeout(400);
  const seitenmenue = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) return null;
    return {
      suche: !!m.querySelector('.menu-suche input'),
      platzhalter: m.querySelector('.menu-suche input')?.placeholder,
      kacheln: m.querySelectorAll('.schrift-kacheln button').length,
      fuss: m.querySelector('.menu-fuss')?.textContent || '',
      inhaltKopieren: !!m.querySelector('[data-a="inhalt"]'),
      mitKi: !!m.querySelector('[data-a="mitki"]'),
      knoepfe: m.querySelectorAll('.menu-liste button').length
    };
  });
  console.log('   Seitenmenü:', JSON.stringify(seitenmenue));
  ok('Seitenmenü hat ein Suchfeld', seitenmenue.suche &&
     /Suchaktionen/.test(seitenmenue.platzhalter));
  ok('Drei Schrift-Kacheln statt Untermenü', seitenmenue.kacheln === 3);
  ok('Fusszeile mit Wortzahl', /Wortzahl:\s*\d+/.test(seitenmenue.fuss));
  ok('Fusszeile mit letzter Änderung', /Zuletzt bearbeitet/.test(seitenmenue.fuss));
  ok('Seiteninhalte kopieren dabei', seitenmenue.inhaltKopieren);
  ok('Mit KI verwenden dabei', seitenmenue.mitKi);

  /* Suchen filtert wirklich */
  await p.fill('.menu-suche input', 'papier');
  await p.waitForTimeout(300);
  const gefiltert = await p.evaluate(() => {
    const sichtbar = [...document.querySelectorAll('.menu-liste button')]
      .filter(b => b.style.display !== 'none');
    return { anzahl: sichtbar.length, texte: sichtbar.map(b => b.textContent.trim()).slice(0, 3),
             markiert: !!document.querySelector('.menu-liste button.jetzt') };
  });
  console.log('   Gefiltert:', JSON.stringify(gefiltert));
  ok('Suche filtert die Einträge', gefiltert.anzahl >= 1 && gefiltert.anzahl <= 4);
  ok('Treffer enthält Papierkorb', gefiltert.texte.some(t => /Papierkorb/i.test(t)));
  ok('Erster Treffer ist markiert', gefiltert.markiert);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);

  /* ===============================================================
   * 2) Inhalts-Streifen am rechten Rand
   * =============================================================*/
  const toc = await p.evaluate(() => {
    const d = document.getElementById('rand-toc');
    if (!d) return null;
    return { striche: d.querySelectorAll('button').length,
             klassen: [...d.querySelectorAll('button')].map(x => x.className).join(','),
             titel: [...d.querySelectorAll('button')].map(x => x.title) };
  });
  console.log('   Streifen:', JSON.stringify(toc));
  ok('Inhalts-Streifen erscheint', toc && toc.striche === 4);
  ok('Striche nach Ebene unterschiedlich',
     /rt-h1/.test(toc.klassen) && /rt-h2/.test(toc.klassen) && /rt-h3/.test(toc.klassen));
  ok('Überschrift steht im Titel', toc.titel.includes('Erster Abschnitt'));

  const wenig = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Kurz' });
    Store.addBlock(s.id, 'h1', { text: 'Nur eine' });
    App.oeffne(s.id);
    return true;
  });
  await p.waitForTimeout(600);
  ok('Bei wenigen Überschriften kein Streifen',
     await p.evaluate(() => !document.getElementById('rand-toc')));
  await p.evaluate(id => App.oeffne(id), seite);
  await p.waitForTimeout(500);

  /* ===============================================================
   * 3) Datenbank: elf Ansichten, Dashboard, Layout-Leiste
   * =============================================================*/
  const db = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Datenbanktest' });
    const d = Store.addDatabase(s.id, 'Aufträge', {
      title: { name: 'Auftrag', type: 'title' },
      st: { name: 'Status', type: 'status', options: [
        { name: 'Offen', color: 'blue' }, { name: 'Läuft', color: 'yellow' },
        { name: 'Fertig', color: 'green' }] },
      pr: { name: 'Preis', type: 'number' },
      dt: { name: 'Termin', type: 'date' }
    }, 'table');
    const c = Store.getCollection(d.collectionId);
    const morgen = new Date(); morgen.setDate(morgen.getDate() + 2);
    [['Dach decken','Offen',4200,morgen.toISOString().slice(0,10)],
     ['Fenster tauschen','Läuft',1800,''],
     ['Boden verlegen','Fertig',900,''],
     ['Wand streichen','Offen',350,'']].forEach(([t,st,pr,dt]) => {
      const r = Store.addRow(c.id, { st, pr, dt });
      Store.updateBlock(r.id, { text: t });
    });
    App.oeffne(s.id);
    return { seite: s.id, coll: c.id, view: c.viewIds[0],
             block: Store.childrenOf(s.id).find(x => x.type === 'database').id };
  });
  await p.waitForTimeout(800);

  const layouts = await p.evaluate(() => Datenbank.LAYOUTS.map(l => l[0]));
  console.log('   Layouts:', JSON.stringify(layouts));
  ok('Zwölf Ansichtstypen', layouts.length === 12);
  ok('Dashboard ist dabei', layouts.includes('dashboard'));

  const dash = await p.evaluate((d) => {
    Store.updateView(d.view, { layout: 'dashboard' });
    App.zeichneSeite();
    return true;
  }, db);
  await p.waitForTimeout(700);
  const dashInhalt = await p.evaluate(() => {
    const w = document.querySelector('.dash');
    if (!w) return null;
    return {
      zahlen: [...w.querySelectorAll('.dash-karte')].map(x =>
        x.querySelector('.dz-wert').textContent + ' — ' + x.querySelector('.dz-name').textContent),
      balken: w.querySelectorAll('.dash-balken').length,
      bloecke: [...w.querySelectorAll('.dash-block h4')].map(h => h.textContent),
      zeilen: w.querySelectorAll('.dash-zeile').length
    };
  });
  console.log('   Dashboard:', JSON.stringify(dashInhalt));
  ok('Dashboard zeigt Kennzahlen', dashInhalt && dashInhalt.zahlen.length >= 2);
  ok('Anzahl stimmt', dashInhalt.zahlen.some(z => z.startsWith('4 — Einträge')));
  ok('Summe wird gerechnet', dashInhalt.zahlen.some(z => /7250|7.250/.test(z)));
  ok('Verteilung als Balken', dashInhalt.balken === 3);
  ok('Zuletzt geändert dabei', dashInhalt.bloecke.some(t => /Zuletzt geändert/.test(t)));
  ok('Nächste Termine dabei', dashInhalt.bloecke.some(t => /Als Nächstes/.test(t)));

  /* Layout-Leiste */
  await p.evaluate((d) => {
    Store.updateView(d.view, { layout: 'table' });
    App.zeichneSeite();
    Datenbank.layoutPanel(Store.getCollection(d.coll), Store.getView(d.view),
                          Store.getBlock(d.block));
  }, db);
  await p.waitForTimeout(500);
  const leiste = await p.evaluate(() => {
    const d = document.querySelector('.db-leiste');
    if (!d) return null;
    return { kacheln: d.querySelectorAll('.dl-kacheln button').length,
             schalter: [...d.querySelectorAll('.dl-zeile .dl-text b')].map(x => x.textContent),
             aktiv: d.querySelector('.dl-kacheln button.on')?.textContent };
  });
  console.log('   Layout-Leiste:', JSON.stringify(leiste));
  ok('Layout-Leiste mit zwölf Kacheln', leiste && leiste.kacheln === 12);
  ok('Tabelle ist markiert', /Tabelle/.test(leiste.aktiv || ''));
  ok('Titel der Datenquelle anzeigen', leiste.schalter.some(t => /Titel der Datenquelle/.test(t)));
  ok('Vertikale Linien anzeigen', leiste.schalter.some(t => /Vertikale Linien/.test(t)));
  ok('Seiten-Icon anzeigen', leiste.schalter.some(t => /Seiten-Icon/.test(t)));
  ok('Ladelimit einstellbar', leiste.schalter.some(t => /Ladelimit/.test(t)));

  await p.evaluate(() => document.querySelector('.db-leiste [data-a="zu"]')?.click());
  await p.waitForTimeout(300);

  /* ===============================================================
   * 4) Bedingte Farbe
   * =============================================================*/
  const farben = await p.evaluate((d) => {
    Store.updateView(d.view, { farbregeln: [
      { key: 'st', op: 'ist', wert: 'Fertig', farbe: 'green', an: true },
      { key: 'pr', op: 'größer als', wert: '2000', farbe: 'red', an: true }
    ]});
    App.zeichneSeite();
    const c = Store.getCollection(d.coll);
    const v = Store.getView(d.view);
    return Store.rowsOf(c.id).map(r => r.text + ':' + (Datenbank.farbeFuerZeile(r, v, c) || '—'));
  }, db);
  await p.waitForTimeout(500);
  console.log('   Farbregeln:', JSON.stringify(farben));
  ok('Fertig wird grün', farben.some(x => /Boden verlegen:green/.test(x)));
  ok('Teuer wird rot', farben.some(x => /Dach decken:red/.test(x)));
  ok('Ohne Treffer keine Farbe', farben.some(x => /Wand streichen:—/.test(x)));

  const gefaerbt = await p.evaluate(() =>
    document.querySelectorAll('tr.farbzeile').length);
  ok('Gefärbte Zeilen erscheinen in der Tabelle', gefaerbt === 2);

  /* ===============================================================
   * 5) Typ-Auswahl mit Suche und zwei Spalten
   * =============================================================*/
  await p.evaluate((d) => {
    const th = document.querySelector('.grid thead th:nth-child(3)');
    Datenbank.typMenue(th || document.body, Store.getCollection(d.coll), 'st');
  }, db);
  await p.waitForTimeout(400);
  const typmenue = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    return { suche: !!m?.querySelector('.menu-suche input'),
             gitter: m?.querySelectorAll('.typ-gitter').length,
             gruppen: [...(m?.querySelectorAll('.menu-liste .grp') || [])].map(x => x.textContent),
             typen: m?.querySelectorAll('.typ-gitter button').length,
             markiert: m?.querySelector('.typ-gitter button.on')?.textContent };
  });
  console.log('   Typmenü:', JSON.stringify(typmenue));
  ok('Typ-Auswahl hat Suchfeld', typmenue.suche);
  ok('KI-Autofill steht oben', typmenue.gruppen[0] === 'KI-Autofill');
  ok('Typen in fünf Gruppen', typmenue.gruppen.length === 5);
  ok('Verbindungen ist die letzte Gruppe', typmenue.gruppen[4] === 'Verbindungen');
  ok('34 wählbare Typen — Titel bleibt draussen', typmenue.typen === 34);
  ok('Aktueller Typ ist markiert', /Status/.test(typmenue.markiert || ''));

  await p.fill('.menu-suche input', 'datum');
  await p.waitForTimeout(300);
  const typGefiltert = await p.evaluate(() => {
    const sichtbar = [...document.querySelectorAll('.typ-gitter button')]
      .filter(b => b.style.display !== 'none');
    const gruppen = [...document.querySelectorAll('.menu-liste .grp')]
      .filter(g => g.style.display !== 'none').length;
    return { anzahl: sichtbar.length, text: sichtbar.map(b => b.textContent).join(','), gruppen };
  });
  console.log('   Typ gefiltert:', JSON.stringify(typGefiltert));
  ok('Suche findet den Datumstyp', /Datum/.test(typGefiltert.text));
  ok('Leere Gruppen werden ausgeblendet', typGefiltert.gruppen < 4);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);

  /* ===============================================================
   * 6) Slash-Menü nach Notion
   * =============================================================*/
  await p.evaluate(id => App.oeffne(id), seite);
  await p.waitForTimeout(600);
  await p.evaluate(() => Store.setMeta('slash:zuletzt', ['callout', 'todo']));
  const ct = await p.$('.blk.b-text .ct');
  await ct.click();
  await p.keyboard.press('End');
  await p.keyboard.type('/');
  await p.waitForTimeout(400);
  const slash = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) return null;
    return { fuss: m.querySelector('.sl-fuss')?.textContent,
             ersteGruppe: m.querySelector('.grp')?.textContent,
             gruppeHint: !!m.querySelector('.sl-gruppe'),
             empfohlen: [...m.querySelectorAll('.grp')][0]?.textContent === 'Empfohlen',
             ersteKnoepfe: [...m.querySelectorAll('button[data-t]')].slice(0, 2)
               .map(x => x.dataset.t) };
  });
  console.log('   Slash:', JSON.stringify(slash));
  ok('Slash-Menü hat Empfohlen oben', slash.empfohlen);
  ok('Zuletzt benutzte stehen dort', slash.ersteKnoepfe.join(',') === 'callout,todo');
  ok('Kategorie steht neben dem Namen', slash.gruppeHint);
  ok('Fusszeile mit esc', /Menü schliessen/.test(slash.fuss) && /esc/.test(slash.fuss));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);

  /* ===============================================================
   * 7) Seitenleiste: Agenten, Kürzlich, Besprechungen
   * =============================================================*/
  const seitenleiste = await p.evaluate(() => {
    App.zeichneBaum();
    const t = document.getElementById('tree');
    return { abschnitte: [...t.querySelectorAll('.side-abschnitt, .abschnitt, .grp')]
               .map(x => x.textContent.trim()).filter(Boolean),
             agentKnopf: !!t.querySelector('[data-agent]'),
             kuerzlich: t.querySelectorAll('[data-kv]').length,
             besprechung: !!t.querySelector('[data-bes]'),
             text: t.textContent };
  });
  console.log('   Seitenleiste:', JSON.stringify({ agent: seitenleiste.agentKnopf,
    kuerzlich: seitenleiste.kuerzlich, bes: seitenleiste.besprechung }));
  ok('Agenten-Abschnitt in der Seitenleiste', seitenleiste.agentKnopf &&
     /Agenten/.test(seitenleiste.text));
  ok('Kürzlich verwendet zeigt Seiten', seitenleiste.kuerzlich >= 2);
  ok('Besprechungen-Abschnitt da', seitenleiste.besprechung &&
     /Besprechungen/.test(seitenleiste.text));

  /* ===============================================================
   * 8) Einstellungen in Gruppen
   * =============================================================*/
  const einst = await p.evaluate(() => {
    Einstellungen.oeffne();
    const nav = document.querySelector('.einst-nav');
    return { gruppen: [...nav.querySelectorAll('.einst-grp')].map(x => x.textContent),
             bereiche: nav.querySelectorAll('button[data-b]').length,
             mcp: !!nav.querySelector('[data-b="mcp"]'),
             emoji: !!nav.querySelector('[data-b="emoji"]'),
             oeff: !!nav.querySelector('[data-b="oeffentlich"]') };
  });
  console.log('   Einstellungen:', JSON.stringify(einst));
  ok('Einstellungen in Abschnitten', einst.gruppen.length === 3);
  ok('Abschnitt Funktionen dabei', einst.gruppen.includes('Funktionen'));
  ok('MCP als eigener Bereich', einst.mcp);
  ok('Emoji als eigener Bereich', einst.emoji);
  ok('Öffentliche Seiten als Bereich', einst.oeff);
  ok('19 Bereiche', einst.bereiche === 19);

  const emojiBereich = await p.evaluate(() => {
    document.querySelector('[data-b="emoji"]').click();
    return document.getElementById('ei').textContent;
  });
  ok('Emoji-Bereich erklärt sich', /Eigene Bilder als Symbol/.test(emojiBereich));
  await p.evaluate(() => document.querySelector('.einst-zu')?.click());
  await p.waitForTimeout(300);

  /* ===============================================================
   * 9) Neuladen
   * =============================================================*/
  await p.evaluate(() => Store.flush());
  await p.waitForTimeout(700);
  await p.reload();
  await p.waitForTimeout(1700);
  const nach = await p.evaluate((d) => {
    const v = Store.getView(d.view);
    return { farbregeln: (v.farbregeln || []).length,
             kuerzlich: (Store.getMeta('kuerzlich', []) || []).length,
             slash: (Store.getMeta('slash:zuletzt', []) || []).length };
  }, db);
  console.log('   Nach dem Neuladen:', JSON.stringify(nach));
  ok('Farbregeln überleben', nach.farbregeln === 2);
  ok('Kürzlich verwendet überlebt', nach.kuerzlich >= 2);
  ok('Slash-Verlauf überlebt', nach.slash >= 2);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
