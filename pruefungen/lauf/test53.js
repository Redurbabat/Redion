/* Bedingung an einzelnen Aktionen, mehrstufige Rollups, Formel-Rückgabetyp */
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

  /* --- Bedingung an einer einzelnen Aktion ------------------------------ */
  const auto = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Automationstest' });
    const db = Store.addDatabase(s.id, 'Tickets', {
      title:  { name: 'Titel',    type: 'title' },
      stufe:  { name: 'Dringend', type: 'select',
                options: [{ name: 'Hoch', color: 'red' }, { name: 'Klein', color: 'gray' }] },
      status: { name: 'Status',   type: 'select',
                options: [{ name: 'Neu', color: 'gray' }, { name: 'Eilig', color: 'red' },
                          { name: 'Normal', color: 'blue' }] },
      notiz:  { name: 'Notiz',    type: 'text' }
    });
    const c = Store.getCollection(db.collectionId);
    /* Wenn ein Ticket angelegt wird:
         · ist es dringend → Status Eilig
         · ist es nicht dringend → Status Normal   (dieselbe Bedingung, umgekehrt)
         · immer → Notiz setzen */
    c.automationen = [{
      id: 'a1', name: 'Einsortieren', an: true,
      wenn: { art: 'zeile-neu' }, bedingungen: [],
      dann: [
        { art: 'setze-prop', key: 'status', wert: 'Eilig',
          wenn: { key: 'stufe', op: 'ist', wert: 'Hoch' } },
        { art: 'setze-prop', key: 'status', wert: 'Normal',
          wenn: { key: 'stufe', op: 'ist', wert: 'Hoch', umkehren: true } },
        { art: 'setze-prop', key: 'notiz', wert: 'eingegangen' }
      ]
    }];
    Store.updateCollection(c.id, { automationen: c.automationen });

    const hoch  = Store.addRow(c.id, { title: 'Server aus', stufe: 'Hoch' });
    const klein = Store.addRow(c.id, { title: 'Tippfehler', stufe: 'Klein' });
    await new Promise(r => setTimeout(r, 400));
    return { coll: c.id, seite: s.id,
             hoch:  Store.getBlock(hoch.id).props,
             klein: Store.getBlock(klein.id).props };
  });
  pruef('Dringendes wird Eilig',        auto.hoch.status, 'Eilig');
  pruef('Nicht dringendes wird Normal', auto.klein.status, 'Normal');
  pruef('Die Aktion ohne Bedingung läuft immer (1)', auto.hoch.notiz, 'eingegangen');
  pruef('Die Aktion ohne Bedingung läuft immer (2)', auto.klein.notiz, 'eingegangen');

  /* --- Mehrstufige Rollups --------------------------------------------- */
  const rollup = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Rollups' });
    /* Drei Ebenen: Firma → Projekt → Aufgabe */
    const dbA = Store.addDatabase(s.id, 'Aufgaben3', {
      title: { name: 'Aufgabe', type: 'title' },
      std:   { name: 'Stunden', type: 'number' }
    });
    const A = Store.getCollection(dbA.collectionId);

    const dbP = Store.addDatabase(s.id, 'Projekte3', {
      title: { name: 'Projekt', type: 'title' },
      auf:   { name: 'Aufgaben', type: 'relation', ziel: A.id },
      summe: { name: 'Stunden gesamt', type: 'rollup',
               relation: 'auf', zielKey: 'std', rollup: 'Summe' }
    });
    const P = Store.getCollection(dbP.collectionId);

    const dbF = Store.addDatabase(s.id, 'Firmen3', {
      title: { name: 'Firma', type: 'title' },
      proj:  { name: 'Projekte', type: 'relation', ziel: P.id },
      summe: { name: 'Stunden gesamt', type: 'rollup',
               relation: 'proj', zielKey: 'summe', rollup: 'Summe' }
    });
    const F = Store.getCollection(dbF.collectionId);

    const a1 = Store.addRow(A.id, { title: 'A1', std: 3 });
    const a2 = Store.addRow(A.id, { title: 'A2', std: 5 });
    const a3 = Store.addRow(A.id, { title: 'A3', std: 2 });
    const p1 = Store.addRow(P.id, { title: 'P1', auf: [a1.id, a2.id] });
    const p2 = Store.addRow(P.id, { title: 'P2', auf: [a3.id] });
    const f1 = Store.addRow(F.id, { title: 'F1', proj: [p1.id, p2.id] });
    await new Promise(r => setTimeout(r, 250));

    return {
      p1: Datenbank.wert(Store.getBlock(p1.id), 'summe', P),
      p2: Datenbank.wert(Store.getBlock(p2.id), 'summe', P),
      f1: Datenbank.wert(Store.getBlock(f1.id), 'summe', F),
      collF: F.id, f1id: f1.id
    };
  });
  pruef('Erste Ebene: 3 + 5 = 8',   rollup.p1, 8);
  pruef('Erste Ebene: 2',           rollup.p2, 2);
  pruef('Zweite Ebene: 8 + 2 = 10', rollup.f1, 10);

  /* Änderung ganz unten schlägt bis oben durch */
  const durch = await p.evaluate(async (r) => {
    const A = Object.values(Store.cache.collections).find(c => c.name === 'Aufgaben3');
    const a1 = Store.rowsOf(A.id).find(x => x.text === 'A1');
    Store.setProp(a1.id, 'std', 10);
    await new Promise(x => setTimeout(x, 200));
    const F = Store.getCollection(r.collF);
    return Datenbank.wert(Store.getBlock(r.f1id), 'summe', F);
  }, rollup);
  pruef('Änderung unten wirkt oben: 10 + 5 + 2 = 17', durch, 17);

  /* --- Formel-Rückgabetyp ---------------------------------------------- */
  const typen = await p.evaluate(() => ({
    zahl:    Datenbank.typName(42),
    komma:   Datenbank.typName(1.5),
    text:    Datenbank.typName('Hallo'),
    boolean: Datenbank.typName(true),
    datum:   Datenbank.typName(new Date()),
    liste:   Datenbank.typName([1, 2, 3]),
    einer:   Datenbank.typName(['x']),
    leer:    Datenbank.typName(''),
    nichts:  Datenbank.typName(null)
  }));
  pruef('Ganze Zahl erkannt',  typen.zahl, 'Zahl (ganz)');
  pruef('Kommazahl erkannt',   typen.komma, 'Zahl');
  pruef('Text mit Länge',      typen.text, 'Text (5 Zeichen)');
  pruef('Ja/Nein erkannt',     typen.boolean, 'Ja/Nein');
  pruef('Datum erkannt',       typen.datum, 'Datum');
  pruef('Liste mit Anzahl',    typen.liste, 'Liste mit 3 Einträgen');
  pruef('Einzahl bei einem',   typen.einer, 'Liste mit 1 Eintrag');
  pruef('Leer erkannt',        typen.leer, 'leer');
  pruef('Nichts erkannt',      typen.nichts, 'leer');

  /* Im Editor sichtbar */
  const editor = await p.evaluate(async () => {
    const P = Object.values(Store.cache.collections).find(c => c.name === 'Projekte3');
    P.schema.test = { name: 'Test', type: 'formula', formula: 'prop("Projekt") + "!"' };
    Store.updateCollection(P.id, { schema: P.schema });
    Datenbank.formelEditor(P, 'test');
    await new Promise(r => setTimeout(r, 350));
    const t = document.querySelector('#fxout').textContent;
    document.querySelector('.overlay')?.remove();
    return t;
  });
  pruef('Editor nennt den Typ',    editor.includes('Text ('), true);
  pruef('Editor zeigt das Beispiel', editor.includes('P1!'), true);

  /* Kaputte Formel bleibt eine Warnung */
  const kaputt = await p.evaluate(async () => {
    const P = Object.values(Store.cache.collections).find(c => c.name === 'Projekte3');
    P.schema.test2 = { name: 'Kaputt', type: 'formula', formula: 'prop("Projekt" +' };
    Store.updateCollection(P.id, { schema: P.schema });
    Datenbank.formelEditor(P, 'test2');
    await new Promise(r => setTimeout(r, 350));
    const t = document.querySelector('#fxout').textContent;
    document.querySelector('.overlay')?.remove();
    return t.startsWith('⚠');
  });
  pruef('Kaputte Formel bleibt Warnung', kaputt, true);

  /* --- Der Automationsbauer zeigt das Bedingungsfeld -------------------- */
  const bauer = await p.evaluate(async (a) => {
    const c = Store.getCollection(a.coll);
    Datenbank.automationenMenue(document.body, c, null, null);
    await new Promise(r => setTimeout(r, 250));
    document.querySelector('[data-a="neu"]').click();
    await new Promise(r => setTimeout(r, 300));
    const kasten = !!document.querySelector('#adwenn');
    const versteckt = document.querySelector('#adwenn2').style.display;
    document.querySelector('#adwenn').checked = true;
    document.querySelector('#adwenn').dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const sichtbar = document.querySelector('#adwenn2').style.display;
    const ops = document.querySelectorAll('#adwo option').length;
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    return { kasten, versteckt, sichtbar, ops };
  }, auto);
  pruef('Bedingungsfeld im Bauer',  bauer.kasten, true);
  pruef('Erst versteckt',           bauer.versteckt, 'none');
  pruef('Nach dem Anhaken sichtbar', bauer.sichtbar, 'flex');
  pruef('Bedingungen zur Auswahl',   bauer.ops > 2, true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
