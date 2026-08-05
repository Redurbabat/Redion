const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f = []; p.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });
  const pruef = []; const ok = (n, x) => pruef.push([n, !!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1600);

  /* ================================================================== *
   * 1) SEITENLEISTE — Abschnitt „Meine Apps"
   * ================================================================== */
  const apps = await p.evaluate(() =>
    [...document.querySelectorAll('.apps-block [data-app]')].map(x => x.textContent.replace(/[⌄›]/g, '')));
  console.log('   Meine Apps:', JSON.stringify(apps));
  ok('Abschnitt Meine Apps hat neun Einträge', apps.length >= 9);
  ok('Bibliothek dabei', apps.some(x => x.includes('Bibliothek')));
  ok('Meine Aufgaben dabei', apps.some(x => x.includes('Meine Aufgaben')));
  ok('Marktplatz dabei', apps.some(x => x.includes('Marktplatz')));
  ok('Papierkorb dabei', apps.some(x => x.includes('Papierkorb')));
  ok('Abschnittsüberschrift steht darüber', await p.evaluate(() =>
    [...document.querySelectorAll('.side-section span')].some(x => x.textContent.startsWith('Meine Apps'))));

  /* ================================================================== *
   * 2) BIBLIOTHEK
   * ================================================================== */
  await p.evaluate(() => {
    const a = Store.addPage(null, { text: 'Bibliothekstest A' });
    const c = Store.addPage(null, { text: 'Bibliothekstest B' });
    Store.updateBlock(c.id, { favorite: true });
    App.oeffne(a.id);
  });
  await p.waitForTimeout(500);

  await p.click('[data-app="bib"]');
  await p.waitForTimeout(600);

  const bib = await p.evaluate(() => ({
    titel: document.querySelector('.bib-titel')?.textContent,
    reiter: [...document.querySelectorAll('.bib-reiter button')].map(x => x.textContent.trim()),
    spalten: [...document.querySelectorAll('.bib-kopfzeile [data-s]')].map(x => x.textContent.replace(/[↑↓]/g, '').trim()),
    zeilen: document.querySelectorAll('.bib-zeile[data-id]').length,
    krume: document.getElementById('crumb')?.textContent,
    hatQuelle: !!document.querySelector('.bib-quelle'),
    hatPerson: !!document.querySelector('.bib-kreis'),
    fuss: document.querySelector('.bib-fuss')?.textContent
  }));
  console.log('   Bibliothek:', JSON.stringify(bib));
  ok('Bibliothek trägt ihren Titel', bib.titel === 'Bibliothek');
  ok('Vier Reiter plus „mehr"', bib.reiter.length === 5 && /mehr/.test(bib.reiter[4]));
  ok('Reiter heissen wie bei Notion',
     bib.reiter[0].includes('Kürzlich verwendet') && bib.reiter[1].includes('Favoriten') &&
     bib.reiter[2].includes('Geteilt') && bib.reiter[3].includes('Privat'));
  ok('Vier Spalten wie im Bild',
     bib.spalten.length === 4 && bib.spalten[0].includes('Seitenbezeichnung') &&
     bib.spalten[1].includes('Erstellt von') && bib.spalten[2].includes('Quelle'));
  ok('Zeilen erscheinen', bib.zeilen >= 2);
  ok('Quelle wird gezeigt', bib.hatQuelle);
  ok('Person wird gezeigt', bib.hatPerson);
  ok('Krume nennt die Bibliothek', /Bibliothek/.test(bib.krume || ''));
  ok('Fusszeile zählt', /Seiten?/.test(bib.fuss || ''));

  /* Reiter Favoriten */
  await p.click('.bib-reiter [data-r="favoriten"]');
  await p.waitForTimeout(400);
  const favs = await p.evaluate(() =>
    [...document.querySelectorAll('.bib-zeile[data-id] .bib-txt')].map(x => x.textContent.replace(/[⌄›]/g, '')));
  console.log('   Favoriten:', JSON.stringify(favs));
  ok('Favoritenreiter filtert', favs.length >= 1 && favs.every(x => x.includes('B')));

  /* Sortieren durch Kopfklick */
  await p.click('.bib-reiter [data-r="alle"]').catch(() => {});
  await p.evaluate(() => { document.querySelector('.bib-mehr')?.click(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => {
    const b2 = [...document.querySelectorAll('.overlay button[data-x], .menu button[data-x]')]
      .find(x => x.dataset.x === 'alle');
    b2?.click();
  });
  await p.waitForTimeout(400);
  await p.click('.bib-kopfzeile [data-s="name"]');
  await p.waitForTimeout(400);
  const sortiert = await p.evaluate(() => ({
    pfeil: !!document.querySelector('.bib-kopfzeile [data-s="name"] em'),
    erste: document.querySelector('.bib-zeile[data-id] .bib-txt')?.textContent
  }));
  console.log('   Sortiert:', JSON.stringify(sortiert));
  ok('Klick auf den Spaltenkopf sortiert', sortiert.pfeil);

  /* Zeile öffnen */
  await p.evaluate(() => document.querySelector('.bib-zeile[data-id]').click());
  await p.waitForTimeout(500);
  ok('Klick öffnet die Seite', await p.evaluate(() =>
    !!document.getElementById('title') && !document.querySelector('.bib-titel')));

  /* ================================================================== *
   * 3) MEINE AUFGABEN
   * ================================================================== */
  await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Aufgabenquelle' });
    const { collectionId } = Store.addDatabase(s.id, 'Sprint', {
      name:   { name: 'Name', type: 'title' },
      wer:    { name: 'Zuständig', type: 'person' },
      fertig: { name: 'Fertig', type: 'checkbox' },
      wann:   { name: 'Frist', type: 'date' }
    }, 'table');
    const wer = (Konten.aktiv() || {}).name || 'Ich';
    const a = Store.addRow(collectionId, {});
    Store.updateBlock(a.id, { text: 'Fenster putzen', props: { wer, fertig: false, wann: '2026-08-10' } });
    const b2 = Store.addRow(collectionId, {});
    Store.updateBlock(b2.id, { text: 'Rechnung zahlen', props: { wer, fertig: true, wann: '2026-08-01' } });
    const c2 = Store.addRow(collectionId, {});
    Store.updateBlock(c2.id, { text: 'Fremde Aufgabe', props: { wer: 'Jemand anderes', fertig: false } });
  });
  await p.waitForTimeout(400);
  await p.click('[data-app="aufgaben"]');
  await p.waitForTimeout(600);

  const auf = await p.evaluate(() => ({
    titel: document.querySelector('.bib-titel')?.textContent,
    zeilen: [...document.querySelectorAll('.auf-zeile')].map(x => x.querySelector('.auf-titel').textContent),
    gruppen: [...document.querySelectorAll('.auf-grp')].map(x => x.textContent.trim()),
    fertige: document.querySelectorAll('.auf-zeile.fertig').length,
    dbs: [...document.querySelectorAll('.auf-db')].map(x => x.textContent.replace(/[⌄›]/g, ''))
  }));
  console.log('   Meine Aufgaben:', JSON.stringify(auf));
  ok('Seite heisst Meine Aufgaben', auf.titel === 'Meine Aufgaben');
  ok('Nur meine Aufgaben stehen da',
     auf.zeilen.includes('Fenster putzen') && auf.zeilen.includes('Rechnung zahlen') &&
     !auf.zeilen.includes('Fremde Aufgabe'));
  ok('Offen und Erledigt sind getrennt',
     auf.gruppen.some(x => x.startsWith('Offen')) && auf.gruppen.some(x => x.startsWith('Erledigt')));
  ok('Erledigtes ist durchgestrichen', auf.fertige === 1);
  ok('Die Datenbank steht dabei', /Sprint/.test(auf.dbs.join(' ')));

  /* Abhaken direkt in der Liste */
  await p.evaluate(() => {
    const z = [...document.querySelectorAll('.auf-zeile')]
      .find(x => x.querySelector('.auf-titel').textContent === 'Fenster putzen');
    z.querySelector('.auf-haken').click();
  });
  await p.waitForTimeout(500);
  ok('Haken in der Liste wirkt', await p.evaluate(() =>
    document.querySelectorAll('.auf-zeile.fertig').length === 2));

  /* Werkzeugzeile der Aufgabenseite: Filtern, Sortieren, Suchen */
  const awz = await p.evaluate(() =>
    [...document.querySelectorAll('.bib-werkzeuge button')].map(x => x.dataset.a));
  console.log('   Aufgaben-Werkzeuge:', JSON.stringify(awz));
  ok('Vier Werkzeuge plus Neue Aufgabe',
     ['afilter', 'asort', 'asuche', 'quellen', 'neu'].every(x => awz.includes(x)));

  await p.click('[data-a="afilter"]'); await p.waitForTimeout(350);
  await p.evaluate(() => document.querySelector('.menu button[data-x="offen"]').click());
  await p.waitForTimeout(500);
  const nurOffen = await p.evaluate(() => ({
    zeilen: document.querySelectorAll('.auf-zeile').length,
    fertige: document.querySelectorAll('.auf-zeile.fertig').length,
    knopfAn: !!document.querySelector('[data-a="afilter"].an')
  }));
  console.log('   Nur offene:', JSON.stringify(nurOffen));
  ok('Filter zeigt nur offene Aufgaben', nurOffen.fertige === 0 && nurOffen.zeilen > 0);
  ok('Der Filterknopf ist markiert', nurOffen.knopfAn);
  await p.click('[data-a="afilter"]'); await p.waitForTimeout(350);
  await p.evaluate(() => document.querySelector('.menu button[data-x="alle"]').click());
  await p.waitForTimeout(400);

  await p.click('[data-a="asuche"]'); await p.waitForTimeout(400);
  await p.fill('#auf-suche', 'Fenster'); await p.waitForTimeout(500);
  const gesucht = await p.evaluate(() =>
    [...document.querySelectorAll('.auf-titel')].map(x => x.textContent.replace(/[⌄›]/g, '')));
  console.log('   Aufgabensuche:', JSON.stringify(gesucht));
  ok('Suche auf der Aufgabenseite filtert',
     gesucht.length === 1 && gesucht[0] === 'Fenster putzen');
  await p.click('[data-a="asuchzu"]'); await p.waitForTimeout(400);

  /* Quellen einstellen */
  await p.click('[data-a="quellen"]');
  await p.waitForTimeout(400);
  const quellen = await p.evaluate(() => {
    const t = document.body.textContent;
    const n = document.querySelectorAll('.overlay [data-c]').length;
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    return { da: t.includes('Aufgabenquellen'), n };
  });
  console.log('   Quellen:', JSON.stringify(quellen));
  ok('Aufgabenquellen lassen sich einstellen', quellen.da && quellen.n >= 1);

  /* ================================================================== *
   * 4) PAPIERKORB — Suche, Filter, Zeilenwerkzeuge
   * ================================================================== */
  await p.evaluate(() => {
    const x = Store.addPage(null, { text: 'Weggeworfen Alpha' });
    const y = Store.addPage(null, { text: 'Weggeworfen Beta' });
    Store.trashBlock(x.id); Store.trashBlock(y.id);
    App.papierkorb();
  });
  await p.waitForTimeout(500);

  const pk = await p.evaluate(() => ({
    suchfeld: document.getElementById('pk-suche')?.placeholder,
    chips: [...document.querySelectorAll('.pk-chip')].map(x => x.textContent.replace('⌄', '').trim()),
    zeilen: document.querySelectorAll('.pk-res button[data-id]').length,
    zurueck: document.querySelectorAll('.pk-tat[data-a="restore"]').length,
    weg: document.querySelectorAll('.pk-tat[data-a="purge"]').length,
    hinweis: document.querySelector('.pk-hint')?.textContent
  }));
  console.log('   Papierkorb:', JSON.stringify(pk));
  ok('Suchfeld wie bei Notion', /Seiten im Papierkorb suchen/.test(pk.suchfeld || ''));
  ok('Drei Filterknöpfe', pk.chips.length === 3 &&
     pk.chips[0].includes('Zuletzt bearbeitet von') && pk.chips[1].includes('In'));
  ok('Beide gelöschten Seiten sind da', pk.zeilen >= 2);
  ok('Je Zeile Pfeil und Eimer', pk.zurueck >= 2 && pk.weg >= 2);
  ok('Hinweis auf die dreissig Tage', /30 Tage/.test(pk.hinweis || ''));

  await p.fill('#pk-suche', 'Alpha');
  await p.waitForTimeout(500);
  const gefunden = await p.evaluate(() =>
    [...document.querySelectorAll('.pk-res button[data-id]')].map(x => x.textContent.replace(/[⌄›]/g, '')));
  console.log('   Suche im Papierkorb:', JSON.stringify(gefunden.map(x => x.slice(0, 22))));
  ok('Suche filtert', gefunden.length === 1 && gefunden[0].includes('Alpha'));

  await p.evaluate(() => document.querySelector('.pk-tat[data-a="restore"]').click());
  await p.waitForTimeout(500);
  const nachher = await p.evaluate(() => {
    const n = Store.trashed().length;
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    return n;
  });
  ok('Pfeil holt zurück', nachher === 1);

  /* ================================================================== *
   * 5) SPALTENMENÜ — Kopf, Gruppe, Berechnen, Links/Rechts einfügen
   * ================================================================== */
  const dbSeite = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Spaltentest' });
    const { collectionId } = Store.addDatabase(s.id, 'Zeug', {
      name: { name: 'Name', type: 'title' },
      zahl: { name: 'Zahl', type: 'number' },
      art:  { name: 'Art', type: 'select', options: [{ name: 'A', color: 'blue' }, { name: 'B', color: 'red' }] }
    }, 'table');
    [['Eins', 10, 'A'], ['Zwei', 20, 'B'], ['Drei', 30, 'A']].forEach(([t, z, a]) => {
      const r = Store.addRow(collectionId, {});
      Store.updateBlock(r.id, { text: t, props: { zahl: z, art: a } });
    });
    App.oeffne(s.id);
    return s.id;
  });
  await p.waitForTimeout(700);

  await p.evaluate(() => {
    const th = [...document.querySelectorAll('th')].find(x => x.textContent.includes('Zahl'));
    th.click();
  });
  await p.waitForTimeout(500);

  const spm = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    return {
      kopfIcon: !!m.querySelector('.sp-icon'),
      namensfeld: m.querySelector('.sp-name')?.value,
      platzhalter: m.querySelector('.sp-name')?.placeholder,
      info: !!m.querySelector('.sp-info'),
      eintraege: [...m.querySelectorAll('button[data-a]')].map(x => x.textContent.trim())
    };
  });
  console.log('   Spaltenmenü:', JSON.stringify(spm.eintraege));
  ok('Kopf hat ein Symbol', spm.kopfIcon);
  ok('Kopf hat das Namensfeld', spm.namensfeld === 'Zahl');
  ok('Platzhalter wie bei Notion', /Eigenschaftsnamen eingeben/.test(spm.platzhalter || ''));
  ok('Kopf hat das ⓘ', spm.info);
  ok('Gruppe steht im Menü', spm.eintraege.some(x => x.includes('Gruppe')));
  ok('Berechnen steht im Menü', spm.eintraege.some(x => x.includes('Berechnen')));
  ok('Links einfügen steht im Menü', spm.eintraege.some(x => x.includes('Links einfügen')));
  ok('Rechts einfügen steht im Menü', spm.eintraege.some(x => x.includes('Rechts einfügen')));
  ok('Typ ändern zeigt den jetzigen Typ', spm.eintraege.some(x => /Typ ändern.*Zahl/.test(x)));

  /* Name direkt im Kopf ändern */
  await p.fill('.menu .sp-name', 'Menge');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  ok('Name im Kopf umbenennen wirkt', await p.evaluate(() =>
    [...document.querySelectorAll('th')].some(x => x.textContent.includes('Menge'))));

  /* Gruppieren über das Spaltenmenü */
  await p.evaluate(() => {
    const th = [...document.querySelectorAll('th')].find(x => x.textContent.includes('Art'));
    th.click();
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.menu button[data-a="gruppe"]').click());
  await p.waitForTimeout(700);
  const grp = await p.evaluate(() => {
    const v = Object.values(Store.cache.views).find(x => x.groupBy);
    return { groupBy: v ? v.groupBy : '', ueberschriften: document.querySelectorAll('.gruppe-kopf, .grp-kopf, .db-gruppe').length };
  });
  console.log('   Gruppe:', JSON.stringify(grp));
  ok('Gruppe schaltet die Gruppierung ein', !!grp.groupBy);

  /* wieder aus */
  await p.evaluate(() => {
    const th = [...document.querySelectorAll('th')].find(x => x.textContent.includes('Art'));
    th.click();
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.menu button[data-a="gruppe"]').click());
  await p.waitForTimeout(600);
  ok('Nochmal klicken hebt die Gruppierung auf', await p.evaluate(() =>
    !Object.values(Store.cache.views).some(x => x.groupBy)));

  /* Rechts einfügen */
  const vorher = await p.evaluate(() =>
    Object.keys(Object.values(Store.cache.collections).find(c => c.name === 'Zeug').schema));
  /* ERST DAS ALTE MENÜ WEG, DANN DAS NEUE ÖFFNEN.
     Hier stand nur `th.click()` und danach 400 ms Warten. Im vollen Lauf ist
     der Rechner langsamer: das Menü der Spalte „Art" von der Gruppierung
     darüber stand dann noch offen, und `.menu button[data-a="neurechts"]`
     traf DIESES. Die neue Spalte landete rechts von „Art" statt rechts von
     „Menge" — und die Prüfung zur Position wurde rot, obwohl am Einfügen
     nichts falsch war. Genau dieses Bild kam in Lauf 18.

     Jetzt wird das alte Menü entfernt, das neue abgewartet, und erst dann
     geklickt. Keine feste Frist mehr, die unter Last zu kurz ist. */
  await p.evaluate(() => {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    const th = [...document.querySelectorAll('th')].find(x => x.textContent.includes('Menge'));
    th.click();
  });
  const menueKam = await p.waitForFunction(
    () => !!document.querySelector('.menu button[data-a="neurechts"]'),
    null, { timeout: 8000 }).then(() => true).catch(() => false);
  ok('Das Spaltenmenü von „Menge" ist offen', menueKam);
  await p.evaluate(() => document.querySelector('.menu button[data-a="neurechts"]')?.click());
  await p.waitForTimeout(500);
  const typen = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    return { suche: !!m.querySelector('.menu-suche input'),
             gruppen: [...m.querySelectorAll('.grp')].map(x => x.textContent.replace(/[⌄›]/g, '')),
             knoepfe: m.querySelectorAll('button[data-t]').length };
  });
  console.log('   Typwahl beim Einfügen:', JSON.stringify(typen.gruppen), typen.knoepfe);
  ok('Einfügen fragt nach dem Typ, mit Suche', typen.suche && typen.knoepfe >= 25);
  ok('Verbindungen sind eine eigene Gruppe', typen.gruppen.includes('Verbindungen'));

  p.once('dialog', d => d.accept('Neu'));
  await p.evaluate(() => document.querySelector('.menu button[data-t="text"]').click());
  /* Die 500 ms bleiben — sie sind hier nicht nur eine Wartezeit, sondern
     lassen das vorige Fenster verschwinden. Wer sie durch ein
     `waitForSelector('.overlay input')` ERSETZT, trifft genau dieses alte
     Fenster und füllt das falsche Feld; der Lauf war damit auch einzeln rot.

     Dahinter kommt ein Netz für den langsamen Rechner: ist das neue Fenster
     nach 500 ms noch nicht da, wird gewartet statt aufgegeben. Ohne das
     greift der Notnagel `p.once('dialog', …)`, die Spalte heisst „Neu", und
     genau eine Prüfung scheitert — die nach der Position —, während die
     nächste („eine Spalte mehr") grün bleibt. Ein Fehlerbild, das nach einem
     Fehler im Code aussieht und keiner ist.

     UND GENAU DAS IST IM VOLLEN LAUF TROTZDEM PASSIERT. Bei 82 Läufen
     hintereinander ist der Rechner langsamer als bei einem; die acht
     Sekunden reichten einmal nicht. Einzeln nachgefahren: 76 von 76.

     Der Notnagel bleibt — ohne ihn hinge der Lauf. Was dazukommt, ist die
     WAHRHEIT DARÜBER: kam das Fenster nicht, sagt der Lauf das, statt eine
     Prüfung über die Spaltenfolge scheitern zu lassen, die mit der
     Spaltenfolge nichts zu tun hat. Ein Prüflauf, der über die Ursache lügt,
     kostet mehr Zeit als einer, der schweigt. */
  await p.waitForTimeout(500);
  const fensterKam = await p.waitForFunction(
    () => !!document.querySelector('.overlay input'), null, { timeout: 8000 })
    .then(() => true).catch(() => false);
  if (!fensterKam)
    console.log('   ⚠ Das Fenster für den Spaltennamen kam nach 8,5 s nicht. ' +
                'Der Rechner war zu langsam, nicht der Code — die zwei ' +
                'Prüfungen zur Spaltenfolge werden übersprungen.');
  ok('Das Fenster für den Spaltennamen kommt', fensterKam);
  await p.evaluate(() => {
    const i = document.querySelector('.overlay input');
    if (i) { i.value = 'Dazwischen'; document.querySelector('.overlay [data-a="ok"]').click(); }
  });
  /* Warten, bis die Spalte wirklich im Schema steht — nicht 700 ms lang
     hoffen. Genau daran ist diese Prüfung im vollen Lauf zweimal gescheitert:
     einzeln 77/77, unter Last rot. Der Code war nie das Problem, nur die
     feste Frist. Bleibt sie aus, sagt die Meldung unten warum. */
  const spalteKam = await p.waitForFunction(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Zeug');
    return !!c && Object.keys(c.schema).some(k => c.schema[k].name === 'Dazwischen');
  }, null, { timeout: 8000 }).then(() => true).catch(() => false);
  if (fensterKam && !spalteKam)
    console.log('   ⚠ Die Spalte „Dazwischen" stand nach 8 s nicht im Schema. ' +
                'Läuft der ganze Satz parallel, ist der Rechner zu langsam — ' +
                'einzeln kommt sie.');
  const nachOrder = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Zeug');
    return Object.keys(c.schema).map(k => c.schema[k].name);
  });
  console.log('   Spaltenfolge:', JSON.stringify(nachOrder));
  if (fensterKam && spalteKam) {
    ok('Neue Spalte steht direkt rechts daneben',
       nachOrder.indexOf('Dazwischen') === nachOrder.indexOf('Menge') + 1);
    ok('Es gibt jetzt eine Spalte mehr', nachOrder.length === vorher.length + 1);
  }

  /* Eigenes Symbol für die Spalte */
  await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Zeug');
    const k = Object.keys(c.schema).find(k2 => c.schema[k2].name === 'Menge');
    c.schema[k].icon = '🍎';
    Store.updateCollection(c.id, { schema: c.schema });
    App.zeichneSeite();
  });
  await p.waitForTimeout(500);
  ok('Eigenes Spaltensymbol wird gezeigt', await p.evaluate(() =>
    [...document.querySelectorAll('th')].some(x => x.textContent.includes('🍎'))));

  /* ================================================================== *
   * 6) DATENQUELLEN JE ANSICHT
   * ================================================================== */
  await p.evaluate(() => {
    const s = Store.getBlock(App.aktuelleSeite());
    const { collectionId } = Store.addDatabase(s.id, 'Zweite Quelle', {
      name: { name: 'Name', type: 'title' }
    }, 'table');
    const r = Store.addRow(collectionId, {});
    Store.updateBlock(r.id, { text: 'Aus der zweiten Quelle' });
  });
  await p.waitForTimeout(400);

  const quellenTest = await p.evaluate(() => {
    const coll = Object.values(Store.cache.collections).find(c => c.name === 'Zeug');
    const zwei = Object.values(Store.cache.collections).find(c => c.name === 'Zweite Quelle');
    const view = Object.values(Store.cache.views).find(v => v.collectionId === coll.id);
    const vorher = Datenbank.zeilenGesamt(coll, view);
    Store.updateView(view.id, { extraDbs: [{ collectionId: zwei.id, an: true }] });
    const nachher = Datenbank.zeilenGesamt(coll, Store.cache.views[view.id]);
    return { vorher, nachher };
  });
  console.log('   Zwei Quellen:', JSON.stringify(quellenTest));
  ok('Zweite Datenquelle bringt ihre Zeilen mit',
     quellenTest.nachher === quellenTest.vorher + 1);

  await p.evaluate(() => {
    const coll = Object.values(Store.cache.collections).find(c => c.name === 'Zeug');
    const view = Object.values(Store.cache.views).find(v => v.collectionId === coll.id);
    Store.updateView(view.id, { extraDbs: [] });
    App.zeichneSeite();
  });
  await p.waitForTimeout(400);

  /* ================================================================== *
   * 7) FELDER AUS VERBINDUNGEN
   * ================================================================== */
  const dienst = await p.evaluate(() => {
    const coll = Object.values(Store.cache.collections).find(c => c.name === 'Zeug');
    coll.schema.gd = { name: 'Entwurf', type: 'gdrive' };
    Store.updateCollection(coll.id, { schema: coll.schema });
    const r = Store.rowsOf(coll.id)[0];
    Store.setProp(r.id, 'gd', { url: 'https://drive.google.com/file/d/ABC123/view',
                                titel: 'Konzept.pdf', zusatz: 'pdf' });
    App.zeichneSeite();
    return true;
  });
  await p.waitForTimeout(600);
  const chip = await p.evaluate(() => {
    const c = document.querySelector('.dienst-chip');
    return c ? { text: c.textContent, href: c.getAttribute('href'), ziel: c.getAttribute('target') } : null;
  });
  console.log('   Verbindungsfeld:', JSON.stringify(chip));
  ok('Google-Drive-Feld wird als Verknüpfung gezeigt',
     chip && chip.text.includes('Konzept.pdf') && chip.href.includes('drive.google.com'));
  ok('Die Verknüpfung geht in einen neuen Tab', chip && chip.ziel === '_blank');
  ok('Alle vier Dienstfelder sind wählbar', await p.evaluate(() =>
    ['gdrive', 'figma', 'githubpr', 'zendesk'].every(t => Datenbank.TYPEN.some(x => x.id === t))));

  /* ================================================================== *
   * 8) SEITENMENÜ — Übersetzen, Vorschläge, Benachrichtigungen, Verbindungen
   * ================================================================== */
  await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Menütest' });
    Store.addBlock(s.id, 'text', { text: 'Ein Satz zum Übersetzen.' });
    App.oeffne(s.id);
  });
  await p.waitForTimeout(600);
  await p.click('#btn-page-menu');
  await p.waitForTimeout(500);

  const sm = await p.evaluate(() =>
    [...document.querySelectorAll('.menu button[data-a]')].map(x => x.textContent.trim()));
  console.log('   Seitenmenü:', JSON.stringify(sm.filter(x =>
    /Übersetzen|vorschlagen|Rückgängig|Updates|Benachrichtigungen|Verbindungen/.test(x))));
  ok('Änderungen vorschlagen steht im Menü', sm.some(x => x.includes('Änderungen vorschlagen')));
  ok('Übersetzen steht im Menü', sm.some(x => x.includes('Übersetzen')));
  ok('Rückgängig machen steht im Menü', sm.some(x => x.includes('Rückgängig machen')));
  ok('Updates und Analysen steht im Menü', sm.some(x => x.includes('Updates und Analysen')));
  ok('Benachrichtigungen steht im Menü', sm.some(x => x.includes('Benachrichtigungen')));
  ok('Verbindungen steht im Menü', sm.some(x => x.includes('Verbindungen')));

  /* Übersetzen zeigt Sprachen */
  await p.evaluate(() => document.querySelector('.menu button[data-a="uebersetzen"]').click());
  await p.waitForTimeout(500);
  const spr = await p.evaluate(() => {
    const m = [...document.querySelectorAll('.menu')].pop();
    const r = { n: m.querySelectorAll('button[data-s]').length,
                suche: !!m.querySelector('.menu-suche input'),
                erste: m.querySelector('button[data-s]')?.textContent };
    document.querySelectorAll('.menu').forEach(x => x.remove());
    return r;
  });
  console.log('   Sprachen:', JSON.stringify(spr));
  ok('Übersetzen bietet Sprachen mit Suche', spr.n >= 12 && spr.suche);

  /* Benachrichtigungen umstellen */
  await p.click('#btn-page-menu'); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.menu button[data-a="benach"]').click());
  await p.waitForTimeout(400);
  await p.evaluate(() => {
    const m = [...document.querySelectorAll('.menu')].pop();
    m.querySelector('button[data-b="erwaehnungen"]').click();
  });
  await p.waitForTimeout(500);
  ok('Benachrichtigung lässt sich umstellen', await p.evaluate(() =>
    Store.getBlock(App.aktuelleSeite()).benachrichtigung === 'erwaehnungen'));

  /* Vorschlagsmodus */
  await p.evaluate(() => document.querySelectorAll('.menu,.overlay').forEach(x => x.remove()));
  await p.click('#btn-page-menu'); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.menu button[data-a="vorschlag"]').click());
  await p.waitForTimeout(600);
  const banner = await p.evaluate(() => ({
    da: !!document.getElementById('banner'),
    text: document.getElementById('banner')?.textContent,
    an: Store.getBlock(App.aktuelleSeite()).vorschlagModus
  }));
  console.log('   Vorschlagsmodus:', JSON.stringify(banner));
  ok('Vorschlagsmodus lässt sich einschalten', banner.an && banner.da);
  ok('Der Balken erklärt, was passiert', /Vorschlag/.test(banner.text || ''));

  /* Text ändern → Vorschlag entsteht */
  await p.evaluate(() => {
    const ct = document.querySelector('.blk.b-text .ct');
    ct.focus();
    ct.dispatchEvent(new Event('focusin', { bubbles: true }));
    ct.textContent = 'Ein ganz anderer Satz.';
    ct.dispatchEvent(new Event('input', { bubbles: true }));
    ct.dispatchEvent(new Event('focusout', { bubbles: true }));
  });
  await p.waitForTimeout(600);
  const vor = await p.evaluate(() => (Store.getBlock(App.aktuelleSeite()).vorschlaege || []));
  console.log('   Vorschläge:', JSON.stringify(vor.map(v => [v.alt, v.neu])));
  ok('Die Änderung wird als Vorschlag festgehalten',
     vor.length === 1 && vor[0].alt === 'Ein Satz zum Übersetzen.' &&
     vor[0].neu === 'Ein ganz anderer Satz.');

  /* Vorschlag verwerfen setzt zurück */
  await p.evaluate(() => App.seitenMenue(document.getElementById('btn-page-menu'),
                                          Store.getBlock(App.aktuelleSeite())));
  await p.waitForTimeout(400);
  const hatEintrag = await p.evaluate(() =>
    !!document.querySelector('.menu button[data-a="vorschlaege"]'));
  ok('„Vorschläge ansehen" erscheint im Menü', hatEintrag);
  await p.evaluate(() => document.querySelector('.menu button[data-a="vorschlaege"]').click());
  await p.waitForTimeout(500);
  const liste = await p.evaluate(() => ({
    alt: document.querySelector('.vor-alt')?.textContent,
    neu: document.querySelector('.vor-neu')?.textContent,
    knoepfe: [...document.querySelectorAll('.vor-tat button')].map(x => x.textContent.replace(/[⌄›]/g, ''))
  }));
  console.log('   Vorschlagsliste:', JSON.stringify(liste));
  ok('Alt und Neu stehen nebeneinander',
     /Übersetzen/.test(liste.alt || '') && /anderer Satz/.test(liste.neu || ''));
  ok('Annehmen und Verwerfen sind da',
     liste.knoepfe.includes('Annehmen') && liste.knoepfe.includes('Verwerfen'));

  await p.evaluate(() => document.querySelector('.vor-tat button[data-weg]').click());
  await p.waitForTimeout(600);
  const zurueck = await p.evaluate(() => {
    const s = Store.getBlock(App.aktuelleSeite());
    const t = Store.childrenOf(s.id).find(b => b.type === 'text');
    document.querySelectorAll('.overlay,.menu').forEach(x => x.remove());
    return { text: t.text, offen: (s.vorschlaege || []).length };
  });
  console.log('   Nach Verwerfen:', JSON.stringify(zurueck));
  ok('Verwerfen holt den alten Text zurück',
     zurueck.text === 'Ein Satz zum Übersetzen.' && zurueck.offen === 0);

  /* ================================================================== *
   * 9) NACH DEM NEULADEN
   * ================================================================== */
  await p.reload();
  await p.waitForTimeout(1800);
  const danach = await p.evaluate(() => ({
    apps: document.querySelectorAll('.apps-block [data-app]').length,
    zeug: !!Object.values(Store.cache.collections).find(c => c.name === 'Zeug'),
    spalte: (() => {
      const c = Object.values(Store.cache.collections).find(x => x.name === 'Zeug');
      return c ? Object.values(c.schema).map(d => d.name) : [];
    })(),
    symbol: (() => {
      const c = Object.values(Store.cache.collections).find(x => x.name === 'Zeug');
      return c ? Object.values(c.schema).some(d => d.icon === '🍎') : false;
    })(),
    aufgaben: typeof Bibliothek !== 'undefined' && Bibliothek.meineAufgaben().length
  }));
  console.log('   Nach Neuladen:', JSON.stringify(danach));
  ok('Meine Apps überlebt das Neuladen', danach.apps >= 9);
  ok('Die eingefügte Spalte bleibt', danach.spalte.includes('Dazwischen'));
  ok('Das Spaltensymbol bleibt', danach.symbol);
  ok('Aufgaben werden wieder gefunden', danach.aufgaben >= 2);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 10).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
