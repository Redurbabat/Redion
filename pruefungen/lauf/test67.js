/* Das Abschnittsmenü in der Seitenleiste und die vier Bereiche am Telefon */
const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
let ok = 0, bad = 0;
const pruef = (n, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1700);

  /* --- 1 · Jeder Abschnitt hat drei Punkte ------------------------------ */
  const kopf = await p.evaluate(async () => {
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 350));
    const s = [...document.querySelectorAll('#tree .side-section')];
    return { anzahl: s.length,
             mitPunkten: s.filter(x =>
               [...x.querySelectorAll('button')].some(y => y.textContent === '⋯')).length,
             namen: s.map(x => x.querySelector('span').textContent.replace(/[›⌄]/g, '').trim()) };
  });
  pruef('Es gibt Abschnitte',        kopf.anzahl > 3, true);
  pruef('Jeder hat ein ⋯',           kopf.mitPunkten, kopf.anzahl);
  pruef('Darunter „Besprechungen"',  kopf.namen.includes('Besprechungen'), true);

  /* --- 2 · Das Menü selbst ---------------------------------------------- */
  const menue = await p.evaluate(async () => {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    const abschnitt = [...document.querySelectorAll('#tree .side-section')]
      .find(x => x.querySelector('span').textContent.includes('Werkzeuge'));
    abschnitt.querySelector('button:last-child').click();
    await new Promise(r => setTimeout(r, 250));
    const m = document.querySelector('.menu');
    const eintraege = [...m.querySelectorAll('button')].map(x => x.dataset.a);
    const r = m.getBoundingClientRect();
    return { da: !!m, eintraege, imBild: r.right <= innerWidth + 1 && r.left >= -1,
             texte: [...m.querySelectorAll('button')].map(x => x.textContent) };
  });
  pruef('Das Menü öffnet sich',   menue.da, true);
  pruef('Sieben Einträge',        menue.eintraege,
        ['klappen', 'alleZu', 'alleAuf', 'hoch', 'runter', 'aus', 'anpassen']);
  pruef('Es bleibt im Bild',      menue.imBild, true);
  pruef('Und sagt, was es tut',   menue.texte.every(t => t && t.length > 4), true);

  /* --- 3 · Zuklappen und aufklappen ------------------------------------- */
  const klappen = await p.evaluate(async () => {
    const auf = () => (Store.getMeta('sidebarZu', []) || []).length;
    document.querySelector('.menu [data-a="alleZu"]').click();
    await new Promise(r => setTimeout(r, 350));
    const alleZu = auf();
    const pfeile = [...document.querySelectorAll('#tree .ss-pfeil')].map(x => x.textContent);

    /* Wieder öffnen */
    const abschnitt = [...document.querySelectorAll('#tree .side-section')][0];
    abschnitt.querySelector('button:last-child').click();
    await new Promise(r => setTimeout(r, 250));
    document.querySelector('.menu [data-a="alleAuf"]').click();
    await new Promise(r => setTimeout(r, 350));
    return { alleZu, nachher: auf(),
             alleZugeklappt: pfeile.length > 0 && pfeile.every(x => x === '›') };
  });
  pruef('Alle zuklappen merkt sich das', klappen.alleZu > 3, true);
  pruef('Und die Pfeile drehen sich',    klappen.alleZugeklappt, true);
  pruef('Alle aufklappen räumt wieder auf', klappen.nachher, 0);

  /* --- 4 · Einen einzelnen Abschnitt zuklappen -------------------------- */
  const einzeln = await p.evaluate(async () => {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    const abschnitt = [...document.querySelectorAll('#tree .side-section')]
      .find(x => x.querySelector('span').textContent.includes('Kürzlich'));
    abschnitt.querySelector('button:last-child').click();
    await new Promise(r => setTimeout(r, 250));
    const text = document.querySelector('.menu [data-a="klappen"]').textContent;
    document.querySelector('.menu [data-a="klappen"]').click();
    await new Promise(r => setTimeout(r, 350));
    const zu = (Store.getMeta('sidebarZu', []) || []);
    /* Nochmal öffnen — jetzt muss dort „Aufklappen" stehen */
    const a2 = [...document.querySelectorAll('#tree .side-section')]
      .find(x => x.querySelector('span').textContent.includes('Kürzlich'));
    a2.querySelector('button:last-child').click();
    await new Promise(r => setTimeout(r, 250));
    const text2 = document.querySelector('.menu [data-a="klappen"]').textContent;
    document.querySelector('.menu [data-a="klappen"]').click();
    await new Promise(r => setTimeout(r, 300));
    return { text, zu: zu.includes('Kürzlich verwendet'), text2,
             wiederOffen: !(Store.getMeta('sidebarZu', []) || []).includes('Kürzlich verwendet') };
  });
  pruef('Zuerst steht dort Zuklappen', einzeln.text.includes('Zuklappen'), true);
  pruef('Danach ist er zu',            einzeln.zu, true);
  pruef('Und der Eintrag heisst Aufklappen', einzeln.text2.includes('Aufklappen'), true);
  pruef('Der zweite Klick öffnet wieder',    einzeln.wiederOffen, true);

  /* --- 5 · Umsortieren --------------------------------------------------- */
  const schieben = await p.evaluate(async () => {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    Store.setMeta('sidebarFolge', null);
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 300));

    /* Der erste Abschnitt darf nicht weiter nach oben */
    const ersteId = 'werkzeuge';
    const abschnitt = [...document.querySelectorAll('#tree .side-section')]
      .find(x => x.querySelector('span').textContent.includes('Werkzeuge'));
    abschnitt.querySelector('button:last-child').click();
    await new Promise(r => setTimeout(r, 250));
    const hochAus = document.querySelector('.menu [data-a="hoch"]').disabled;
    document.querySelector('.menu [data-a="runter"]').click();
    await new Promise(r => setTimeout(r, 350));
    const folge = Store.getMeta('sidebarFolge', []);
    return { hochAus, ersterJetzt: folge[0], zweiter: folge[1], ersteId };
  });
  pruef('Ganz oben ist „hoch" aus', schieben.hochAus, true);
  pruef('Runter tauscht die Reihenfolge', schieben.zweiter, schieben.ersteId);

  /* --- 6 · Ausblenden ---------------------------------------------------- */
  const ausblenden = await p.evaluate(async () => {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    Store.setMeta('sidebarAus', []);
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 300));
    const vorher = [...document.querySelectorAll('#tree .side-section')].length;
    const abschnitt = [...document.querySelectorAll('#tree .side-section')]
      .find(x => x.querySelector('span').textContent.includes('Besprechungen'));
    if (!abschnitt) return { fehlt: true };
    abschnitt.querySelector('button:last-child').click();
    await new Promise(r => setTimeout(r, 250));
    document.querySelector('.menu [data-a="aus"]').click();
    await new Promise(r => setTimeout(r, 400));
    const nachher = [...document.querySelectorAll('#tree .side-section')].length;
    const gemerkt = (Store.getMeta('sidebarAus', []) || []).includes('bespr');
    Store.setMeta('sidebarAus', []);
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 300));
    return { vorher, nachher, gemerkt,
             zurueck: [...document.querySelectorAll('#tree .side-section')].length };
  });
  pruef('Ein Abschnitt verschwindet', ausblenden.nachher, ausblenden.vorher - 1);
  pruef('Und das wird gemerkt',       ausblenden.gemerkt, true);
  pruef('Zurücksetzen bringt ihn wieder', ausblenden.zurueck, ausblenden.vorher);

  /* --- 7 · Weg zur Anpassliste ------------------------------------------ */
  const anpassen = await p.evaluate(async () => {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    const abschnitt = [...document.querySelectorAll('#tree .side-section')][0];
    abschnitt.querySelector('button:last-child').click();
    await new Promise(r => setTimeout(r, 250));
    document.querySelector('.menu [data-a="anpassen"]').click();
    await new Promise(r => setTimeout(r, 400));
    const zeilen = document.querySelectorAll('#tree .side-item.anpass').length;
    /* wieder raus */
    App.abschnitteAnpassen && App.abschnitteAnpassen();
    await new Promise(r => setTimeout(r, 300));
    return zeilen;
  });
  /* Acht Abschnitte, dazu „Reihenfolge zurücksetzen" und „Fertig" */
  pruef('Das Menü führt in den Anpassmodus', anpassen, 10);

  /* --- 8 · Das Menü schliesst sich beim Klick daneben -------------------- */
  const zu = await p.evaluate(async () => {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 300));
    const abschnitt = [...document.querySelectorAll('#tree .side-section')][0];
    abschnitt.querySelector('button:last-child').click();
    await new Promise(r => setTimeout(r, 250));
    const offen = !!document.querySelector('.menu');
    document.getElementById('page').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    return { offen, danach: !document.querySelector('.menu') };
  });
  pruef('Es geht auf',   zu.offen, true);
  pruef('Und wieder zu', zu.danach, true);

  /* --- 9 · Am Telefon: die vier Bereiche --------------------------------- */
  const handy = await b.newPage({ viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true });
  const fehler2 = [];
  handy.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await handy.goto('file://' + WURZEL + '/index.html');
  await handy.waitForTimeout(1900);

  const leiste = await handy.evaluate(() => {
    const l = document.getElementById('handy-leiste');
    return { sichtbar: getComputedStyle(l).display !== 'none',
             ids: [...l.querySelectorAll('button')].map(x => x.id),
             beschriftung: [...l.querySelectorAll('b')].map(x => x.textContent),
             markiert: [...l.querySelectorAll('button.an')].map(x => x.id),
             punkt: !!l.querySelector('.hl-punkt') };
  });
  pruef('Die Leiste steht am Telefon', leiste.sichtbar, true);
  pruef('Fünf Felder',      leiste.ids,
        ['hl-start', 'hl-chat', 'hl-ki', 'hl-bespr', 'hl-inbox']);
  pruef('Mit Beschriftung', leiste.beschriftung,
        ['Start', 'Chats', 'KI', 'Termine', 'Eingang']);
  pruef('Start ist markiert', leiste.markiert, ['hl-start']);
  pruef('Der Posteingang hat einen Punktplatz', leiste.punkt, true);

  /* Umschalten markiert richtig */
  const wechsel = await handy.evaluate(async () => {
    const raus = [];
    for (const id of ['hl-chat', 'hl-bespr', 'hl-start']) {
      document.getElementById(id).click();
      await new Promise(r => setTimeout(r, 450));
      raus.push([id, [...document.querySelectorAll('#handy-leiste button.an')].map(x => x.id)]);
    }
    if (window.PWA && PWA.schubladeZu) PWA.schubladeZu();
    await new Promise(r => setTimeout(r, 300));
    return raus;
  });
  wechsel.forEach(([id, markiert]) =>
    pruef('Nach dem Tippen auf ' + id + ' ist genau der markiert', markiert, [id]));

  /* Die Schublade deckt die Leiste nicht zu */
  const deckung = await handy.evaluate(async () => {
    document.getElementById('hl-chat').click();
    await new Promise(r => setTimeout(r, 500));
    const l = document.getElementById('handy-leiste').getBoundingClientRect();
    const s = document.getElementById('sidebar').getBoundingClientRect();
    const oben = document.elementFromPoint(l.left + l.width * 0.7, l.top + l.height / 2);
    if (window.PWA && PWA.schubladeZu) PWA.schubladeZu();
    await new Promise(r => setTimeout(r, 300));
    return { schubladeEndetDarueber: Math.round(s.bottom) <= Math.round(l.top) + 2,
             obenLiegt: !!(oben && oben.closest('#handy-leiste')) };
  });
  pruef('Die Schublade endet über der Leiste', deckung.schubladeEndetDarueber, true);
  pruef('Und die Leiste ist anklickbar',       deckung.obenLiegt, true);

  /* Suchen und Neu sind in die Kopfzeile gewandert */
  const kopfzeile = await handy.evaluate(() => {
    const ids = [...document.querySelectorAll('#topbar button')]
      .filter(b => getComputedStyle(b).display !== 'none').map(b => b.id);
    const t = document.getElementById('topbar').getBoundingClientRect();
    return { ids, ueberlauf: document.getElementById('topbar').scrollWidth - Math.round(t.width) };
  });
  pruef('Suchen steht in der Kopfzeile', kopfzeile.ids.includes('btn-suche-handy'), true);
  pruef('Neu ebenso',                    kopfzeile.ids.includes('btn-neu-handy'), true);
  pruef('Die Kopfzeile läuft nicht über', kopfzeile.ueberlauf <= 1, true);

  const werkzeuge = await handy.evaluate(async () => {
    document.getElementById('btn-suche-handy').click();
    await new Promise(r => setTimeout(r, 400));
    const sucheDa = !!document.querySelector('.overlay');
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const vorher = Store.rootPages().length;
    document.getElementById('btn-neu-handy').click();
    await new Promise(r => setTimeout(r, 600));
    return { sucheDa, mehr: Store.rootPages().length > vorher };
  });
  pruef('Der Lupenknopf öffnet die Suche', werkzeuge.sucheDa, true);
  pruef('Der Stift legt eine Seite an',    werkzeuge.mehr, true);

  /* Am PC ist von den beiden nichts zu sehen */
  const amPC = await p.evaluate(() => [...document.querySelectorAll('.nur-handy')]
    .map(x => getComputedStyle(x).display));
  pruef('Am PC bleiben sie verborgen', amPC.every(d => d === 'none'), true);

  /* Am Telefon hat auch die Seitenleiste ihre Abschnittsmenüs */
  const menueHandy = await handy.evaluate(async () => {
    /* Zurueck auf Start — im Chat-Bereich zeigt die Leiste die Agenten,
       nicht die Abschnitte. Das ist so gewollt. */
    document.getElementById('hl-start').click();
    await new Promise(r => setTimeout(r, 450));
    if (window.PWA && PWA.schubladeAuf) PWA.schubladeAuf();
    await new Promise(r => setTimeout(r, 450));
    document.querySelectorAll('.menu').forEach(m => m.remove());
    const abschnitt = [...document.querySelectorAll('#tree .side-section')][0];
    if (!abschnitt) return { fehlt: true };
    abschnitt.querySelector('button:last-child').click();
    await new Promise(r => setTimeout(r, 300));
    const m = document.querySelector('.menu');
    const r = m ? m.getBoundingClientRect() : null;
    const raus = r ? (r.right > innerWidth + 1 || r.left < -1) : true;
    document.querySelectorAll('.menu').forEach(x => x.remove());
    if (window.PWA && PWA.schubladeZu) PWA.schubladeZu();
    return { da: !!m, raus };
  });
  pruef('Das Abschnittsmenü geht auch am Telefon', menueHandy.da, true);
  pruef('Und passt ins Bild',                      menueHandy.raus, false);

  /* --- 10 · Nach dem Neustart ------------------------------------------- */
  await p.evaluate(async () => {
    Store.setMeta('sidebarZu', ['Meine Apps']);
    Store.setMeta('sidebarFolge', ['apps', 'werkzeuge']);
    await Store.flush();
  });
  await p.reload();
  await p.waitForTimeout(2000);
  const nach = await p.evaluate(() => ({
    zu: Store.getMeta('sidebarZu', []),
    folge: (Store.getMeta('sidebarFolge', []) || [])[0],
    erster: [...document.querySelectorAll('#tree .side-section')][0]
      ?.querySelector('span').textContent.replace(/[›⌄]/g, '').trim()
  }));
  pruef('Zugeklappt überlebt den Neustart', nach.zu, ['Meine Apps']);
  pruef('Die Reihenfolge auch',             nach.folge, 'apps');
  pruef('Und zeigt sich in der Leiste',     nach.erster, 'Meine Apps');

  console.log(`\n${ok}/${ok + bad} bestanden`);
  const alle = [...fehler, ...fehler2];
  console.log(alle.length ? 'JS-Fehler:\n' + alle.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || alle.length ? 1 : 0);
})();
