const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pruef = []; const ok = (n, x) => pruef.push([n, !!x]);
  const f = [];

  /* ================================================================== *
   * TEIL A — AUF DEM TELEFON (iPhone 13 Pro Max: 428 × 926)
   * ================================================================== */
  const p = await b.newPage({ viewport: { width: 428, height: 926 } });
  p.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1800);

  const db = await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Claude Probe', icon: '🧪' });
    const { collectionId } = Store.addDatabase(s.id, 'Song-Bibliothek', {
      name: { name: 'Name', type: 'title' },
      jahr: { name: 'Jahr', type: 'number' }
    }, 'table');
    const r = Store.addRow(collectionId, {});
    Store.updateBlock(r.id, { text: 'Testzeile 1', props: { jahr: 2026 } });
    App.oeffne(s.id);
    return collectionId;
  });
  await p.waitForTimeout(800);

  /* --- Das Ansichtsmenü wird zum Blatt ------------------------------- */
  await p.evaluate(() => document.querySelector('.db-tab.on').click());
  await p.waitForTimeout(700);

  const blatt = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) return null;
    const r = m.getBoundingClientRect();
    return {
      istBlatt: m.classList.contains('blatt'),
      aufgefahren: m.classList.contains('auf'),
      links: Math.round(r.left), breite: Math.round(r.width),
      untenBuendig: Math.round(r.bottom) >= 926,
      griff: !!m.querySelector('.blatt-griff'),
      titel: m.querySelector('.blatt-titel')?.textContent,
      grund: !!document.querySelector('.menu-grund'),
      ueberlauf: m.scrollWidth <= m.clientWidth + 1
    };
  });
  console.log('   Blatt:', JSON.stringify(blatt));
  ok('Auf dem Telefon fährt ein Blatt hoch', blatt.istBlatt && blatt.aufgefahren);
  ok('Es sitzt bündig unten über die volle Breite',
     blatt.links === 0 && blatt.breite === 428 && blatt.untenBuendig);
  ok('Mit Griff und Titel „Einstellungen"', blatt.griff && blatt.titel === 'Einstellungen');
  ok('Ein dunkler Grund liegt darunter', blatt.grund);
  ok('Nichts läuft seitlich heraus', blatt.ueberlauf);

  /* --- Kopfkarte mit Name und ⓘ -------------------------------------- */
  const karte = await p.evaluate(() => {
    const k = document.querySelector('.av-karte');
    if (!k) return null;
    const kinder = [...k.children].map(c => ({ tag: c.tagName, w: Math.round(c.getBoundingClientRect().width) }));
    return { da: true, name: k.querySelector('.av-name')?.value,
             info: !!k.querySelector('.av-info'), kinder,
             vorDerSuche: !!(k.compareDocumentPosition(document.querySelector('.menu-suche')) & 4) };
  });
  console.log('   Kopfkarte:', JSON.stringify(karte));
  ok('Die Kopfkarte trägt den Ansichtsnamen', karte && karte.name === 'Tabelle');
  ok('Mit Symbol links und ⓘ rechts', karte.kinder.length === 3 && karte.info);
  ok('Das Namensfeld nimmt den Platz ein', karte.kinder[1].w > 200);
  ok('Die Karte steht über dem Suchfeld', karte.vorDerSuche);

  /* --- Alle Einträge aus dem Bild ------------------------------------ */
  const eintraege = await p.evaluate(() =>
    [...document.querySelectorAll('.menu button[data-a]')].map(x => x.textContent.trim()));
  const hat = (t) => eintraege.some(x => x.includes(t));
  console.log('   Einträge:', eintraege.length);
  ok('Layout, Sichtbarkeit, Filter, Sortierung, Gruppieren, Bedingte Farbe',
     hat('Layout') && hat('Sichtbarkeit von Eigenschaften') && hat('Filter') &&
     hat('Sortierung') && hat('Gruppieren') && hat('Bedingte Farbe'));
  ok('Link zur Ansicht kopieren', hat('Link zur Ansicht kopieren'));
  ok('Quelle, Eigenschaften bearbeiten, Automatisierungen, KI-Autofill',
     hat('Quelle') && hat('Eigenschaften bearbeiten') && hat('Automatisierungen') && hat('KI-Autofill'));
  ok('Weitere Einstellungen', hat('Weitere Einstellungen'));
  ok('Als ganze Seite öffnen', hat('Als ganze Seite öffnen'));
  ok('Datenquellen verwalten und Datenbank sperren',
     hat('Datenquellen verwalten') && hat('Datenbank sperren'));

  /* --- Umbenennen in der Kopfkarte ----------------------------------- */
  await p.fill('.av-name', 'Alle Songs');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  ok('Umbenennen in der Kopfkarte wirkt', await p.evaluate(() =>
    Object.values(Store.cache.views).some(v => v.name === 'Alle Songs')));

  /* --- Grund schliesst das Blatt ------------------------------------- */
  await p.evaluate(() => document.querySelector('.db-tab.on').click());
  await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('.menu-grund').click());
  await p.waitForTimeout(400);
  ok('Tippen auf den Grund schliesst das Blatt', await p.evaluate(() =>
    !document.querySelector('.menu') && !document.querySelector('.menu-grund')));

  /* --- Als ganze Seite öffnen ---------------------------------------- */
  await p.evaluate(() => document.querySelector('.db-tab.on').click());
  await p.waitForTimeout(600);
  await p.evaluate(() => {
    [...document.querySelectorAll('.menu button[data-a]')]
      .find(x => x.textContent.includes('Als ganze Seite öffnen')).click();
  });
  await p.waitForTimeout(800);
  /* Auch in der Vollseite gilt: am Telefon Karten, ausser man will die Tabelle */
  await p.evaluate(() => {
    Object.values(Store.cache.views).forEach(v => Store.updateView(v.id, { handyTabelle: true }));
    App.zeichneSeite();
  });
  await p.waitForTimeout(600);
  const voll = await p.evaluate(() => ({
    kopf: document.querySelector('.db-vollkopf')?.textContent,
    krume: document.getElementById('crumb')?.textContent,
    tabelle: !!document.querySelector('.db table'),
    zeilen: document.querySelectorAll('tbody tr').length
  }));
  console.log('   Ganze Seite:', JSON.stringify(voll));
  ok('Die Datenbank füllt die Seite allein', /Song-Bibliothek/.test(voll.kopf || '') && voll.tabelle);
  ok('Die Krume nennt die Datenbank', /Song-Bibliothek/.test(voll.krume || ''));
  ok('Die Zeilen sind da', voll.zeilen >= 1);

  /* --- Weitere Blätter ----------------------------------------------- */
  /* Am Telefon zeigt eine Tabelle jetzt Karten. Für die Spaltenprüfung
     schalten wir ausdrücklich auf die echte Tabelle um. */
  await p.evaluate(() => {
    App.oeffne(Store.rootPages().find(x => x.text === 'Claude Probe').id);
    Object.values(Store.cache.views).forEach(v => Store.updateView(v.id, { handyTabelle: true }));
    App.zeichneSeite();
  });
  await p.waitForTimeout(900);
  await p.evaluate(() => {
    const th = [...document.querySelectorAll('th')].find(x => x.textContent.includes('Jahr'));
    th.click();
  });
  await p.waitForTimeout(600);
  const spalteBlatt = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    const r = { blatt: m.classList.contains('blatt'), breite: Math.round(m.getBoundingClientRect().width),
                kopf: !!m.querySelector('.sp-kopf'),
                infoBreite: Math.round(m.querySelector('.sp-info')?.getBoundingClientRect().width || 0),
                nameBreite: Math.round(m.querySelector('.sp-name')?.getBoundingClientRect().width || 0) };
    document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
    return r;
  });
  console.log('   Spaltenblatt:', JSON.stringify(spalteBlatt));
  ok('Auch das Spaltenmenü wird zum Blatt', spalteBlatt.blatt && spalteBlatt.breite === 428);
  ok('Sein Kopf sitzt richtig', spalteBlatt.kopf && spalteBlatt.infoBreite <= 30 && spalteBlatt.nameBreite > 150);

  /* --- Seitenmenü als Blatt ------------------------------------------ */
  await p.evaluate(() => {
    App.seitenMenue(document.getElementById('btn-page-menu'),
                    Store.getBlock(App.aktuelleSeite()));
  });
  await p.waitForTimeout(600);
  const seiteBlatt = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    const r = { blatt: m.classList.contains('blatt'),
                schalter: m.querySelectorAll('.mschalter').length,
                kacheln: m.querySelectorAll('[data-schrift]').length };
    document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
    return r;
  });
  console.log('   Seitenmenü mobil:', JSON.stringify(seiteBlatt));
  ok('Das Seitenmenü ist mobil ebenfalls ein Blatt', seiteBlatt.blatt);
  ok('Schalter und Schriftkacheln bleiben erhalten',
     seiteBlatt.schalter === 4 && seiteBlatt.kacheln === 3);

  /* --- Werkzeugleiste der Datenbank passt aufs Telefon ---------------- */
  const leiste = await p.evaluate(() => {
    const t = document.querySelector('.db-tools');
    return { ueberlauf: t.scrollWidth - t.clientWidth,
             knoepfe: t.querySelectorAll('button').length };
  });
  console.log('   Werkzeugleiste:', JSON.stringify(leiste));
  ok('Die Werkzeugleiste läuft nicht über', leiste.ueberlauf <= 2);

  /* ================================================================== *
   * TEIL B — AM RECHNER BLEIBT ALLES BEIM ALTEN
   * ================================================================== */
  await p.setViewportSize({ width: 1400, height: 900 });
  await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('.db-tab.on').click());
  await p.waitForTimeout(600);
  const amRechner = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    const r = m.getBoundingClientRect();
    const x = { blatt: m.classList.contains('blatt'), grund: !!document.querySelector('.menu-grund'),
                breite: Math.round(r.width), karte: !!m.querySelector('.av-karte') };
    document.querySelectorAll('.menu').forEach(y => y.remove());
    return x;
  });
  console.log('   Am Rechner:', JSON.stringify(amRechner));
  ok('Am Rechner bleibt es ein Menü', !amRechner.blatt && !amRechner.grund);
  ok('Und behält seine Breite', amRechner.breite >= 250 && amRechner.breite <= 340);
  ok('Die Kopfkarte ist auch dort da', amRechner.karte);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
