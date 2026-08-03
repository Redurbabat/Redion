/* Härtetest: Randfälle und Dinge, die kaputtgehen könnten */
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
  await p.waitForTimeout(1600);

  /* --- Leere Datenbank in allen Ansichten ------------------------------ */
  const leer = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Leertest' });
    const db = Store.addDatabase(s.id, 'Nichts', { title: { name: 'X', type: 'title' } });
    App.oeffne(s.id);
    const raus = [];
    for (const l of ['table','board','timeline','calendar','gallery','list',
                     'chart','pivot','dashboard','feed','form','map']) {
      Store.updateView(db.viewId, { layout: l });
      try {
        App.zeichneSeite();
        await new Promise(r => setTimeout(r, 200));
        raus.push([l, 'ok']);
      } catch (e) { raus.push([l, e.message]); }
    }
    return { raus, view: db.viewId, coll: db.collectionId, seite: s.id };
  });
  leer.raus.forEach(([l, r]) => pruef('Leere Datenbank als ' + l, r, 'ok'));

  /* --- Kaputte Verweise ------------------------------------------------ */
  const kaputt = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    /* Verknüpfung auf eine Datenbank, die es nicht gibt */
    c.schema.rel = { name: 'Weg', type: 'relation', ziel: 'gibtesnicht' };
    c.schema.roll = { name: 'Rollup', type: 'rollup', relation: 'rel', zielKey: 'title', rollup: 'Summe' };
    c.schema.form = { name: 'Formel', type: 'formula', formula: 'prop("Gibt es nicht") + 1' };
    Store.updateCollection(c.id, { schema: c.schema });
    const z = Store.addRow(c.id, { title: 'Eine Zeile', rel: ['auchweg'] });
    Store.updateView(x.view, { layout: 'table' });
    let fehler2 = null;
    try {
      App.zeichneSeite();
      await new Promise(r => setTimeout(r, 350));
    } catch (e) { fehler2 = e.message; }
    return { fehler2,
             rollup: String(Datenbank.wert(Store.getBlock(z.id), 'roll', c)).slice(0, 3),
             formel: String(Datenbank.wert(Store.getBlock(z.id), 'form', c)),
             gezeichnet: !!document.querySelector('.grid') };
  }, leer);
  pruef('Kaputte Verweise werfen nichts um', kaputt.fehler2, null);
  pruef('Rollup ohne Ziel meldet sich',      kaputt.rollup, '⚠ Z');
  /* Eine unbekannte Spalte rechnet als „leer" — wie in Notion. Gemeldet
     wird sie dort, wo es hilft: im Formeleditor. */
  pruef('Unbekannte Spalte rechnet als leer', kaputt.formel, '1');
  pruef('Die Tabelle steht trotzdem',        kaputt.gezeichnet, true);

  const editorWarnt = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    Datenbank.formelEditor(c, 'form');
    await new Promise(r => setTimeout(r, 350));
    const t = document.querySelector('#fxout').textContent;
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    return t;
  }, leer);
  pruef('Der Editor nennt die unbekannte Spalte',
        editorWarnt.includes('Gibt es nicht'), true);
  pruef('Und erklärt, was dann passiert',
        editorWarnt.includes('leer'), true);

  /* --- Sehr lange Texte ------------------------------------------------ */
  const lang = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Langtest' });
    const text = 'Wort '.repeat(6000);
    Store.addBlock(s.id, 'text', { text });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 400));
    const t0 = performance.now();
    const d = Vergleich.wortDiff(text, text.replace('Wort', 'Anders'));
    return { ms: Math.round(performance.now() - t0), teile: d.length,
             ueberlauf: document.documentElement.scrollWidth - innerWidth };
  });
  pruef('Riesiger Wortvergleich bleibt schnell', lang.ms < 3000, true);
  pruef('Und liefert etwas',                     lang.teile > 0, true);
  pruef('Langer Text läuft nicht seitlich raus', lang.ueberlauf <= 1, true);

  /* --- Kreisverweise --------------------------------------------------- */
  const kreis = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Kreis' });
    const db = Store.addDatabase(s.id, 'Kreisdb', {
      title: { name: 'Name', type: 'title' },
      a: { name: 'A', type: 'formula', formula: 'prop("B") + 1' },
      b: { name: 'B', type: 'formula', formula: 'prop("A") + 1' }
    });
    const c = Store.getCollection(db.collectionId);
    const z = Store.addRow(c.id, { title: 'Dreht sich' });
    let fehler2 = null;
    let wert = null;
    try { wert = String(Datenbank.wert(Store.getBlock(z.id), 'a', c)); }
    catch (e) { fehler2 = e.message; }
    return { wert: (wert || '').slice(0, 1), fehler2 };
  });
  pruef('Kreisformel wird abgefangen', kreis.wert, '⚠');
  pruef('Und wirft keine Ausnahme',    kreis.fehler2, null);

  /* --- Erweiterung, die abstürzt --------------------------------------- */
  const absturz = await p.evaluate(() => {
    const r = Erweiterung.einzeln({ name: 'Bumm', an: true,
      code: "Redion.knopf('Bumm', '💥', () => { null.x; });" });
    let fehler2 = null;
    try { Erweiterung.angemeldet.knoepfe[0].fn(); } catch (e) { fehler2 = e.message; }
    return { geladen: r.ok, beimKlick: fehler2 };
  });
  pruef('Erweiterung lädt trotz Fehler im Knopf', absturz.geladen, true);

  /* --- Eingang mit Unsinn ---------------------------------------------- */
  const unsinn = await p.evaluate((x) => ({
    keinJson: Eingang.uebernehmen({ db: x.coll, zuordnung: {} }, 'das ist kein json'),
    leer:     Eingang.uebernehmen({ db: x.coll, zuordnung: {} }, '{}'),
    nullwert: Eingang.uebernehmen({ db: x.coll, zuordnung: {} }, 'null'),
    falscheDb: Eingang.uebernehmen({ db: 'gibtesnicht', zuordnung: {} }, '{"a":1}')
  }), leer);
  pruef('Kein JSON wird gemeldet',      unsinn.keinJson.fehler, 'Kein JSON');
  pruef('Leeres Objekt legt eine Zeile an', unsinn.leer.neu, 1);
  pruef('null legt nichts an',          unsinn.nullwert.neu, 0);
  pruef('Falsche Datenbank legt nichts an', unsinn.falscheDb.neu, 0);

  /* --- Formel-Speicher unter Last -------------------------------------- */
  const last = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Last' });
    const db = Store.addDatabase(s.id, 'Viele', {
      title: { name: 'T', type: 'title' },
      n:     { name: 'N', type: 'number' },
      f:     { name: 'F', type: 'formula', formula: 'prop("N") * 2 + length(prop("T"))' }
    });
    const c = Store.getCollection(db.collectionId);
    for (let i = 0; i < 400; i++) Store.addRow(c.id, { title: 'Z' + i, n: i });
    Tempo.leeren();
    const t0 = performance.now();
    Store.rowsOf(c.id).forEach(r => Datenbank.wert(r, 'f', c));
    const erst = performance.now() - t0;
    const t1 = performance.now();
    Store.rowsOf(c.id).forEach(r => Datenbank.wert(r, 'f', c));
    const zweit = performance.now() - t1;
    return { erst: Math.round(erst), zweit: Math.round(zweit),
             gerechnet: Tempo.zahlen.gerechnet, treffer: Tempo.zahlen.treffer,
             wert: Datenbank.wert(Store.rowsOf(c.id)[10], 'f', c) };
  });
  pruef('400 Formeln beim ersten Mal', last.gerechnet, 400);
  pruef('Beim zweiten Mal alles aus dem Speicher', last.treffer, 400);
  pruef('Und deutlich schneller', last.zweit <= last.erst, true);
  pruef('Der Wert stimmt', last.wert, 23);   /* 10*2 + Länge von „Z10" */

  /* --- Zwei Fenster gleichzeitig: Reiter und Teilung -------------------- */
  const gleichzeitig = await p.evaluate(async () => {
    const a = Store.addBlock(null, 'page', { text: 'Erste' });
    const c = Store.addBlock(null, 'page', { text: 'Zweite' });
    App.oeffne(a.id);
    await new Promise(r => setTimeout(r, 250));
    Fenster.neuerReiter(c.id);
    await new Promise(r => setTimeout(r, 250));
    Fenster.teilen(a.id, 'quer');
    await new Promise(r => setTimeout(r, 350));
    const ok2 = { reiter: Fenster.reiter().length, geteilt: !!document.getElementById('teil'),
                  titel: (document.querySelector('.teil-inhalt .seiten-titel') || {}).textContent };
    Fenster.teilenAus();
    await new Promise(r => setTimeout(r, 200));
    return { ...ok2, danach: !document.getElementById('teil') };
  });
  pruef('Reiter und Teilung vertragen sich', gleichzeitig.geteilt, true);
  pruef('Die rechte Seite zeigt das Richtige', gleichzeitig.titel, 'Erste');
  pruef('Und lässt sich wieder schliessen',    gleichzeitig.danach, true);

  /* --- Alles neu zeichnen, oft hintereinander -------------------------- */
  const oft = await p.evaluate(async () => {
    let fehler2 = null;
    const t0 = performance.now();
    try {
      for (let i = 0; i < 25; i++) { App.zeichneSeite(); App.zeichneBaum(); }
    } catch (e) { fehler2 = e.message; }
    return { ms: Math.round(performance.now() - t0), fehler2 };
  });
  pruef('25× neu zeichnen ohne Fehler', oft.fehler2, null);
  pruef('Und in vertretbarer Zeit',     oft.ms < 8000, true);

  /* --- Speicher wirklich leeren und neu laden -------------------------- */
  const nachLeeren = await p.evaluate(async () => {
    await Store.flush();
    return { bloecke: Object.keys(Store.cache.blocks).length > 10,
             sammlungen: Object.keys(Store.cache.collections).length > 2 };
  });
  pruef('Alles ist im Speicher gelandet', nachLeeren.bloecke && nachLeeren.sammlungen, true);

  await p.reload();
  await p.waitForTimeout(2000);
  const nachNeustart = await p.evaluate(() => ({
    bloecke: Object.keys(Store.cache.blocks).length,
    seite: !!document.getElementById('page').textContent
  }));
  pruef('Nach dem Neustart ist alles da', nachNeustart.bloecke > 10, true);
  pruef('Und eine Seite ist gezeichnet',  nachNeustart.seite, true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || fehler.length ? 1 : 0);
})();
