/* Planen: Zurückstellen, Tagesplan, Wochenrückblick; Befehlspalette */
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
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const fehler = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  /* --- Aufgaben anlegen ------------------------------------------------ */
  const bau = await p.evaluate(async () => {
    const iso = (tage) => { const d = new Date(); d.setHours(0,0,0,0);
      d.setDate(d.getDate() + tage);
      const z = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); };

    /* Erst aufräumen: die Beispielinhalte der frischen App würden mitzählen */
    Store.rootPages().forEach(x => Store.trashBlock(x.id));
    Object.keys(Store.cache.collections).forEach(id => { delete Store.cache.collections[id]; });
    Object.values(Store.cache.blocks).forEach(x => { if (x.type === 'todo') x.alive = false; });

    const s = Store.addBlock(null, 'page', { text: 'Projekt' });
    Store.addBlock(s.id, 'todo', { text: 'Blockaufgabe offen', checked: false });
    Store.addBlock(s.id, 'todo', { text: 'Blockaufgabe fertig', checked: true,
                                   erledigtAm: new Date().toISOString() });

    const db = Store.addDatabase(s.id, 'Aufgaben', {
      title:  { name: 'Aufgabe', type: 'title' },
      status: { name: 'Status',  type: 'status', options: [
                 { name: 'Offen', color: 'gray' }, { name: 'Erledigt', color: 'green' } ] },
      wann:   { name: 'Fällig',  type: 'date' }
    });
    const c = Store.getCollection(db.collectionId);
    Store.addRow(c.id, { title: 'Heute fällig',   status: 'Offen',    wann: iso(0) });
    Store.addRow(c.id, { title: 'Gestern fällig', status: 'Offen',    wann: iso(-1) });
    Store.addRow(c.id, { title: 'Nächste Woche',  status: 'Offen',    wann: iso(6) });
    Store.addRow(c.id, { title: 'Ohne Datum',     status: 'Offen' });
    const fertig = Store.addRow(c.id, { title: 'Schon erledigt', status: 'Erledigt', wann: iso(-2) });
    Store.updateBlock(fertig.id, { erledigtAm: new Date().toISOString() });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 400));
    return { seite: s.id, coll: c.id };
  });

  /* --- Aufgaben einsammeln --------------------------------------------- */
  const gesammelt = await p.evaluate(() => {
    const a = Plan.aufgaben();
    return { gesamt: a.length,
             offen: a.filter(x => !x.fertig).length,
             fertig: a.filter(x => x.fertig).length,
             ausBlock: a.filter(x => x.art === 'block').length,
             ausDb: a.filter(x => x.art === 'zeile').length,
             namen: a.map(x => x.text).sort() };
  });
  pruef('Sieben Aufgaben gefunden',   gesammelt.gesamt, 7);
  pruef('Zwei aus Blöcken',           gesammelt.ausBlock, 2);
  pruef('Fünf aus der Datenbank',     gesammelt.ausDb, 5);
  pruef('Zwei sind erledigt',         gesammelt.fertig, 2);
  pruef('Fünf sind offen',            gesammelt.offen, 5);

  /* --- Tagesplan -------------------------------------------------------- */
  await p.evaluate(() => Plan.tagesplan());
  await p.waitForTimeout(350);
  const plan = await p.evaluate(() => ({
    karten: [...document.querySelectorAll('.wr-k b')].map(x => x.textContent),
    ueberschriften: [...document.querySelectorAll('.wr-titel')].map(x => x.textContent),
    zeilen: [...document.querySelectorAll('.wr-z span:nth-child(2)')].map(x => x.textContent),
    spaeterKnoepfe: document.querySelectorAll('.wr-spaeter').length
  }));
  pruef('Eine Aufgabe heute fällig',  plan.karten[0], '1');
  pruef('Eine überfällig',            plan.karten[1], '1');
  pruef('Schätzung wird gerechnet',   /^\d+h \d+m$/.test(plan.karten[2]), true);
  pruef('Überfälliges wird zuerst gezeigt',
        plan.ueberschriften[0], 'Überfällig');
  pruef('Die überfällige Aufgabe steht drin', plan.zeilen[0], 'Gestern fällig');
  pruef('Zurückstellen an jeder Zeile', plan.spaeterKnoepfe >= 3, true);

  /* --- Zurückstellen ---------------------------------------------------- */
  const spaeter = await p.evaluate(async () => {
    const a = Plan.aufgaben().find(x => x.text === 'Gestern fällig');
    const d = new Date(); d.setDate(d.getDate() + 3);
    Plan.zurueckstellen(a.id, d, 'Test');
    await new Promise(r => setTimeout(r, 150));
    return { liste: Plan.liste().length,
             amBlock: !!Store.getBlock(a.id).zurueckBis,
             faellig: Plan.faellige().length, id: a.id };
  });
  pruef('Eintrag in der Liste',   spaeter.liste, 1);
  pruef('Am Block vermerkt',      spaeter.amBlock, true);
  pruef('Noch nicht fällig',      spaeter.faellig, 0);

  /* Übersicht */
  await p.evaluate(() => { document.querySelector('.overlay [data-a="zu"]')?.click();
                           Plan.uebersicht(); });
  await p.waitForTimeout(300);
  const uebersicht = await p.evaluate(() => ({
    zeilen: document.querySelectorAll('.res [data-id]').length,
    text: (document.querySelector('.res .snip') || {}).textContent
  }));
  pruef('Übersicht zeigt den Eintrag', uebersicht.zeilen, 1);
  pruef('Mit Datum beschriftet',       uebersicht.text.startsWith('bis '), true);

  /* Wieder holen */
  await p.evaluate(() => document.querySelector('[data-holen]').click());
  await p.waitForTimeout(350);
  const geholt = await p.evaluate((s) => ({
    liste: Plan.liste().length,
    amBlock: Store.getBlock(s.id).zurueckBis
  }), spaeter);
  pruef('Nach dem Holen leer',     geholt.liste, 0);
  pruef('Vermerk am Block weg',    geholt.amBlock, null);

  /* Fälliges kommt von selbst zurück */
  const zurueck = await p.evaluate(async () => {
    const a = Plan.aufgaben().find(x => x.text === 'Ohne Datum');
    const vorbei = new Date(Date.now() - 60000);
    Plan.zurueckstellen(a.id, vorbei);
    await new Promise(r => setTimeout(r, 100));
    const vorher = Plan.faellige().length;
    const geholt2 = Plan.pruefen();
    return { vorher, geholt: geholt2, danach: Plan.liste().length,
             meldungen: (Werkzeuge.meldungen ? Werkzeuge.meldungen().length : 0) };
  });
  pruef('Fälliges wird erkannt',        zurueck.vorher, 1);
  pruef('Und wieder hochgeholt',        zurueck.geholt, 1);
  pruef('Liste danach leer',            zurueck.danach, 0);
  pruef('Meldung im Posteingang',       zurueck.meldungen >= 1, true);

  /* --- Wochenrückblick -------------------------------------------------- */
  await p.evaluate(() => { document.querySelector('.overlay [data-a="zu"]')?.click();
                           Plan.wochenrueckblick(); });
  await p.waitForTimeout(400);
  const woche = await p.evaluate(() => ({
    karten: [...document.querySelectorAll('.wr-k b')].map(x => x.textContent),
    balken: document.querySelectorAll('.wr-b').length,
    titel: [...document.querySelectorAll('.wr-titel')].map(x => x.textContent),
    erledigt: [...document.querySelectorAll('.wr-p.gut')].length
  }));
  pruef('Zwei erledigte diese Woche', woche.karten[0], '2');
  pruef('Sieben Balken',              woche.balken, 7);
  pruef('Balkenüberschrift da',       woche.titel.includes('Erledigt je Tag'), true);
  pruef('Erledigtes mit Haken',       woche.erledigt, 2);

  /* Woche davor hat andere Zahlen */
  await p.evaluate(() => document.querySelector('[data-v="-1"]').click());
  await p.waitForTimeout(400);
  const davor = await p.evaluate(() =>
    [...document.querySelectorAll('.wr-k b')].map(x => x.textContent)[0]);
  pruef('Woche davor: nichts erledigt', davor, '0');

  /* Als Seite anlegen */
  await p.evaluate(() => { document.querySelector('.overlay [data-a="zu"]')?.click();
                           Plan.wochenrueckblick(); });
  await p.waitForTimeout(350);
  await p.evaluate(() => document.querySelector('[data-a="seite"]').click());
  await p.waitForTimeout(500);
  const alsSeite = await p.evaluate(() => {
    const s = Store.getBlock(App.aktuelleSeite());
    return { titel: s.text,
             bloecke: Store.childrenOf(s.id).map(b => b.type),
             texte: Store.childrenOf(s.id).map(b => b.text) };
  });
  pruef('Seite mit Rückblick angelegt', alsSeite.titel.startsWith('Wochenrückblick'), true);
  pruef('Zahlen als Liste drin',        alsSeite.bloecke.includes('bullet'), true);
  pruef('Aufgaben als Kästchen',        alsSeite.bloecke.includes('todo'), true);

  /* --- Befehlspalette --------------------------------------------------- */
  const palette = await p.evaluate(async () => {
    Werkzeuge.palette();
    await new Promise(r => setTimeout(r, 250));
    const inp = document.querySelector('#cq');
    const tippen = async (t) => {
      inp.value = t;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 120));
      return [...document.querySelectorAll('#cr button')].map(x => x.textContent.trim());
    };
    const unscharf = await tippen('wchrck');       /* Wochenrückblick, ohne Vokale */
    const genau    = await tippen('Tagesplan');
    const seiten   = await tippen('Projekt');
    const gruppen  = [...document.querySelectorAll('#cr .grp')].map(x => x.textContent);
    document.querySelector('.overlay')?.remove();
    return { unscharf: unscharf[0], genau: genau[0], seiten, gruppen };
  });
  pruef('Unscharfe Suche findet den Wochenrückblick',
        (palette.unscharf || '').includes('Wochenrückblick'), true);
  pruef('Genaue Suche findet den Tagesplan',
        (palette.genau || '').includes('Tagesplan'), true);
  pruef('Seiten tauchen in der Palette auf',
        palette.seiten.some(x => x.includes('Projekt')), true);
  pruef('Gruppe „Seiten" vorhanden', palette.gruppen.includes('Seiten'), true);

  /* Häufig Benutztes steht oben */
  const gemerkt = await p.evaluate(async () => {
    Store.setMeta('paletteOft', { 'Tagesplan': 20 });
    Werkzeuge.palette();
    await new Promise(r => setTimeout(r, 250));
    const erste = document.querySelector('#cr button').textContent.trim();
    document.querySelector('.overlay')?.remove();
    return erste;
  });
  pruef('Oft Benutztes steht oben', gemerkt.includes('Tagesplan'), true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
