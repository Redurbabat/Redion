const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pruef = []; const ok = (n, x) => pruef.push([n, !!x]);
  const f = [];
  const p = await b.newPage({ viewport: { width: 428, height: 926 } });
  p.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1900);

  await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Claude Probe', icon: '🧪' });
    Store.addBlock(s.id, 'h2', { text: 'Ueberschrift 2 Test' });
    Store.addBlock(s.id, 'text', { text: 'Normaler Text zum Zählen der Wörter hier.' });
    App.oeffne(s.id);
  });
  await p.waitForTimeout(800);

  /* ================================================================== *
   * 1) LEISTE AM UNTEREN RAND
   * ================================================================== */
  const leiste = await p.evaluate(() => {
    const l = document.getElementById('handy-leiste');
    const r = l.getBoundingClientRect();
    return { sichtbar: getComputedStyle(l).display !== 'none',
             untenBuendig: Math.round(r.bottom) >= 926,
             breite: Math.round(r.width),
             knoepfe: [...l.querySelectorAll('button')].map(x => x.id),
             pille: l.querySelector('#hl-ki')?.textContent };
  });
  console.log('   Untere Leiste:', JSON.stringify(leiste));
  ok('Die untere Leiste erscheint auf dem Telefon', leiste.sichtbar && leiste.untenBuendig);
  ok('Sie geht über die volle Breite', leiste.breite === 428);
  ok('Start, Chats, KI, Termine, Eingang',
     leiste.knoepfe.join(',') === 'hl-start,hl-chat,hl-ki,hl-bespr,hl-inbox', leiste.knoepfe.join(','));
  ok('Die Pille ist die KI', /KI/.test(leiste.pille || ''), leiste.pille);

  await p.click('#hl-ki');
  await p.waitForTimeout(600);
  ok('Die Pille öffnet die KI', await p.evaluate(() =>
    document.getElementById('ai').classList.contains('open')));
  await p.evaluate(() => App.kiPanel(false));
  await p.waitForTimeout(600);      /* das KI-Fenster deckt am Telefon alles zu */

  await p.click('#btn-neu-handy');
  await p.waitForTimeout(700);
  ok('Der Stift in der Kopfzeile legt eine neue Seite an', await p.evaluate(() =>
    Store.rootPages().length >= 2 && !!document.getElementById('title')));

  /* Die vier Bereiche schalten wirklich um und markieren sich.
     Erst den Cursor aus dem Titel nehmen: waehrend man schreibt, geht die
     untere Leiste absichtlich weg, damit sie die Tastatur nicht verdeckt. */
  await p.evaluate(() => { document.activeElement && document.activeElement.blur();
                           document.body.classList.remove('schreibt'); });
  await p.waitForTimeout(400);
  await p.click('#hl-chat');
  await p.waitForTimeout(500);
  ok('Der Chat-Bereich markiert sich', await p.evaluate(() =>
    document.getElementById('hl-chat').classList.contains('an')));
  await p.click('#hl-bespr');
  await p.waitForTimeout(500);
  ok('Besprechungen ebenso', await p.evaluate(() =>
    document.getElementById('hl-bespr').classList.contains('an') &&
    !document.getElementById('hl-chat').classList.contains('an')));
  await p.click('#hl-start');
  await p.waitForTimeout(500);
  ok('Und zurück auf Start', await p.evaluate(() =>
    document.getElementById('hl-start').classList.contains('an')));
  await p.evaluate(() => { if (window.PWA && PWA.schubladeZu) PWA.schubladeZu(); });
  await p.waitForTimeout(300);

  await p.evaluate(() => App.oeffne(Store.rootPages().find(x => x.text === 'Claude Probe').id));
  await p.waitForTimeout(600);

  /* ================================================================== *
   * 2) AKTIONEN-BLATT MIT KARTEN
   * ================================================================== */
  await p.evaluate(() => App.seitenMenue(document.getElementById('btn-page-menu'),
                                          Store.getBlock(App.aktuelleSeite())));
  await p.waitForTimeout(700);

  const aktionen = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    return {
      titel: m.querySelector('.blatt-titel')?.textContent,
      karten: m.querySelectorAll('.blatt-karte').length,
      trennlinien: m.querySelectorAll('hr').length,
      rot: [...m.querySelectorAll('.rot')].map(x => x.textContent.trim()),
      schalter: m.querySelectorAll('.mschalter').length,
      fuss: m.querySelector('.menu-fuss')?.textContent,
      kacheln: !!m.querySelector('.schrift-kacheln')
    };
  });
  console.log('   Aktionen:', JSON.stringify(aktionen));
  ok('Das Blatt heisst „Aktionen"', aktionen.titel === 'Aktionen');
  ok('Die Einträge stehen in Karten', aktionen.karten >= 5);
  ok('Keine nackten Trennlinien mehr', aktionen.trennlinien === 0);
  ok('Papierkorb steht in Rot', aktionen.rot.some(x => /Papierkorb/.test(x)));
  ok('Vier Schalter', aktionen.schalter === 4);
  ok('Schriftkacheln und Wortzahl bleiben',
     aktionen.kacheln && /Wortzahl/.test(aktionen.fuss || ''));

  /* Pfadnavigation aus- und einschalten */
  await p.evaluate(() => {
    [...document.querySelectorAll('.menu button[data-a]')]
      .find(x => x.textContent.includes('Pfadnavigation')).click();
  });
  await p.waitForTimeout(600);
  const pfadAus = await p.evaluate(() => ({
    gespeichert: Store.getBlock(App.aktuelleSeite()).pfad,
    krume: document.getElementById('crumb').querySelectorAll('a').length
  }));
  console.log('   Pfad aus:', JSON.stringify(pfadAus));
  ok('Pfadnavigation lässt sich abschalten', pfadAus.gespeichert === false && pfadAus.krume === 1);

  await p.evaluate(() => {
    [...document.querySelectorAll('.menu button[data-a]')]
      .find(x => x.textContent.includes('Pfadnavigation')).click();
  });
  await p.waitForTimeout(500);
  ok('Und wieder an', await p.evaluate(() =>
    Store.getBlock(App.aktuelleSeite()).pfad === true));

  ok('Offline-Zeile steht im Menü', await p.evaluate(() =>
    [...document.querySelectorAll('.menu button[data-a]')].some(x => /Offline verfügbar/.test(x.textContent))));

  await p.evaluate(() => document.querySelectorAll('.menu,.menu-grund').forEach(x => x.remove()));

  /* ================================================================== *
   * 3) SEITEN-COVER
   * ================================================================== */
  await p.evaluate(() => App.coverWaehlen(Store.getBlock(App.aktuelleSeite())));
  await p.waitForTimeout(700);
  const cover = await p.evaluate(() => {
    const c = document.querySelector('.cover-blatt');
    const r = c.getBoundingClientRect();
    return { links: c.querySelector('.cb-links')?.textContent,
             titel: c.querySelector('.cb-kopf b')?.textContent,
             rechts: c.querySelector('.cb-rechts')?.textContent,
             reiter: [...c.querySelectorAll('.cb-reiter button')].map(x => x.textContent),
             gruppen: [...c.querySelectorAll('.cb-grp')].map(x => x.textContent),
             kacheln: c.querySelectorAll('.cover-gitter button').length,
             untenBuendig: Math.round(r.bottom) >= 920, breite: Math.round(r.width) };
  });
  console.log('   Cover:', JSON.stringify(cover));
  ok('Kopf: Entfernen · Seiten-Cover · Schliessen',
     cover.links === 'Entfernen' && cover.titel === 'Seiten-Cover' && cover.rechts === 'Schliessen');
  ok('Drei Reiter', cover.reiter.join(',') === 'Galerie,Hochladen,Link');
  ok('Gruppen mit Überschriften', cover.gruppen.length === 3 &&
     /Farbe und Gradient/.test(cover.gruppen[0]));
  ok('Genug Kacheln zur Auswahl', cover.kacheln >= 20);
  ok('Auf dem Telefon fährt es von unten hoch', cover.untenBuendig && cover.breite === 428);

  await p.evaluate(() => document.querySelector('.cb-reiter [data-r="link"]').click());
  await p.waitForTimeout(400);
  ok('Der Reiter „Link" hat ein Feld', await p.evaluate(() => !!document.getElementById('cb-link')));

  await p.evaluate(() => document.querySelector('.cb-reiter [data-r="galerie"]').click());
  await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('.cover-gitter button').click());
  await p.waitForTimeout(600);
  const gesetzt = await p.evaluate(() => ({
    cover: Store.getBlock(App.aktuelleSeite()).cover,
    zu: !document.querySelector('.cover-blatt'),
    sichtbar: !!document.querySelector('.cover')
  }));
  console.log('   Cover gesetzt:', JSON.stringify(gesetzt));
  ok('Ein Klick setzt das Cover und schliesst', !!gesetzt.cover && gesetzt.zu && gesetzt.sichtbar);

  /* ================================================================== *
   * 4) POSTEINGANG
   * ================================================================== */
  await p.evaluate(() => Ansichten.posteingang());
  await p.waitForTimeout(700);
  const pe = await p.evaluate(() => ({
    gross: document.querySelector('.pe-gross')?.textContent,
    klein: document.querySelector('.pe-klein')?.textContent,
    link: document.querySelector('.pe-link')?.textContent,
    ico: !!document.querySelector('.pe-ico')
  }));
  console.log('   Posteingang:', JSON.stringify(pe));
  ok('„Du bist auf dem neuesten Stand!"', pe.gross === 'Du bist auf dem neuesten Stand!');
  ok('Mit Erklärung darunter', /@-Erwähnungen/.test(pe.klein || '') && pe.ico);
  ok('Und „Filter ändern"', pe.link === 'Filter ändern');

  await p.evaluate(() => document.querySelector('.pe-link').click());
  await p.waitForTimeout(600);
  const filter = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    const r = { eintraege: [...m.querySelectorAll('[data-x]')].map(x => x.textContent.trim()),
                blatt: m.classList.contains('blatt'), titel: m.querySelector('.blatt-titel')?.textContent };
    document.querySelectorAll('.menu,.menu-grund').forEach(x => x.remove());
    return r;
  });
  console.log('   Filter:', JSON.stringify(filter));
  ok('Der Filter bietet drei Quellen', filter.eintraege.length === 3);
  ok('Als Blatt mit Titel', filter.blatt && filter.titel === 'Filter');

  /* ================================================================== *
   * 5) ABSCHNITTE ZUKLAPPEN
   * ================================================================== */
  await p.evaluate(() => { PWA.schubladeAuf && PWA.schubladeAuf(); });
  await p.waitForTimeout(500);
  const vorher = await p.evaluate(() => ({
    pfeile: document.querySelectorAll('.ss-pfeil').length,
    sichtbar: [...document.querySelectorAll('#tree > *')].filter(x => x.style.display !== 'none').length
  }));
  await p.evaluate(() => {
    const k = [...document.querySelectorAll('.side-section span')].find(x => x.textContent.startsWith('Werkzeuge'));
    k.click();
  });
  await p.waitForTimeout(700);
  const nachher = await p.evaluate(() => ({
    zu: (Store.getMeta('sidebarZu', []) || []).includes('Werkzeuge'),
    versteckt: [...document.querySelectorAll('#tree > *')].filter(x => x.style.display === 'none').length,
    pfeil: [...document.querySelectorAll('.side-section span')]
      .find(x => x.textContent.startsWith('Werkzeuge'))?.textContent
  }));
  console.log('   Abschnitte:', JSON.stringify({ vorher, nachher }));
  ok('Jeder Abschnitt hat einen Pfeil', vorher.pfeile >= 5);
  ok('Klick klappt ihn zu', nachher.zu && nachher.versteckt >= 1);
  ok('Der Pfeil dreht sich', /›/.test(nachher.pfeil || ''));

  await p.evaluate(() => {
    const k = [...document.querySelectorAll('.side-section span')].find(x => x.textContent.startsWith('Werkzeuge'));
    k.click();
  });
  await p.waitForTimeout(600);
  ok('Nochmal klicken klappt ihn auf', await p.evaluate(() =>
    !(Store.getMeta('sidebarZu', []) || []).includes('Werkzeuge')));

  /* ================================================================== *
   * 6) CHATVERLAUF NACH MONATEN
   * ================================================================== */
  await p.evaluate(() => {
    const t = Date.now();
    Store.setMeta('chats', [
      { id: 'a', titel: 'Heutiger Chat', verlauf: [], wann: new Date(t).toISOString() },
      { id: 'b', titel: 'Seite komplett erklären', verlauf: [],
        wann: new Date(t - 95 * 86400000).toISOString() },
      { id: 'c', titel: 'Habit-Tracking System', verlauf: [],
        wann: new Date(t - 125 * 86400000).toISOString() }
    ]);
    App.reiterWechseln('chat');
  });
  await p.waitForTimeout(700);
  const chats = await p.evaluate(() => ({
    gruppen: [...document.querySelectorAll('.side-section span')].map(x => x.textContent.replace(/[⌄›]/g, '').trim()),
    wann: [...document.querySelectorAll('.kc-wann')].map(x => x.textContent)
  }));
  console.log('   Chats:', JSON.stringify(chats));
  ok('Alte Chats stehen unter ihrem Monat',
     chats.gruppen.some(x => /^(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) \d{4}$/.test(x)));
  ok('Heute bleibt Heute', chats.gruppen.includes('Heute'));
  ok('Unter jedem Chat steht, wie lange es her ist',
     chats.wann.some(x => /vor \d+ Monaten/.test(x)));

  /* ================================================================== *
   * 7) BESPRECHUNGEN
   * ================================================================== */
  await p.evaluate(() => App.reiterWechseln('bespr'));
  await p.waitForTimeout(600);
  ok('Der Eintrag heisst „Neue Meeting-Notiz"', await p.evaluate(() =>
    /Neue Meeting-Notiz/.test(document.getElementById('tree').textContent)));

  /* ================================================================== *
   * 8) AM RECHNER UNVERÄNDERT
   * ================================================================== */
  await p.setViewportSize({ width: 1400, height: 900 });
  await p.waitForTimeout(700);
  const rechner = await p.evaluate(() => {
    App.reiterWechseln('start');
    return { leiste: getComputedStyle(document.getElementById('handy-leiste')).display,
             polster: getComputedStyle(document.getElementById('scroll')).paddingBottom };
  });
  console.log('   Am Rechner:', JSON.stringify(rechner));
  ok('Die untere Leiste ist am Rechner weg', rechner.leiste === 'none');

  await p.evaluate(() => App.seitenMenue(document.getElementById('btn-page-menu'),
                                          Store.getBlock(Store.rootPages()[0].id)));
  await p.waitForTimeout(600);
  const rMenu = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    const x = { blatt: m.classList.contains('blatt'),
                karten: m.querySelectorAll('.blatt-karte').length,
                hrs: m.querySelectorAll('hr').length };
    document.querySelectorAll('.menu').forEach(y => y.remove());
    return x;
  });
  console.log('   Menü am Rechner:', JSON.stringify(rMenu));
  ok('Am Rechner bleibt es die flache Liste',
     !rMenu.blatt && rMenu.karten === 0 && rMenu.hrs >= 3);

  /* Nach dem Neuladen */
  await p.reload();
  await p.waitForTimeout(1900);
  ok('Der Cover bleibt', await p.evaluate(() =>
    Object.values(Store.cache.blocks).some(b2 => b2.cover)));
  ok('Zugeklappte Abschnitte bleiben gemerkt', await p.evaluate(() =>
    Array.isArray(Store.getMeta('sidebarZu', []))));

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
