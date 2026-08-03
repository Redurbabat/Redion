/* Die sechs neuen Automationsaktionen */
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

  const anzahl = await p.evaluate(() => ({
    aktionen: Datenbank.AKTIONEN.length,
    namen: Datenbank.AKTIONEN.map(a => a[0])
  }));
  pruef('19 Aktionen zur Wahl', anzahl.aktionen, 19);
  pruef('Archivieren dabei',    anzahl.namen.includes('archivieren'), true);
  pruef('Kommentar dabei',      anzahl.namen.includes('kommentar'), true);
  pruef('Zurückstellen dabei',  anzahl.namen.includes('zurueckstellen'), true);

  const bau = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Aktionstest' });
    const db = Store.addDatabase(s.id, 'Vorgänge', {
      title:  { name: 'Vorgang', type: 'title' },
      status: { name: 'Status',  type: 'select',
                options: [{ name: 'Offen', color: 'gray' }, { name: 'Fertig', color: 'green' }] },
      notiz:  { name: 'Notiz',   type: 'text' }
    });
    const c = Store.getCollection(db.collectionId);
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 400));
    return { coll: c.id, seite: s.id };
  });

  const lauf = async (aktion, vorbereiten) => p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [{ id: 'a', name: 'Test', an: true,
      wenn: { art: 'prop-wert', key: 'status', wert: 'Fertig' },
      bedingungen: [], dann: [x.aktion] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    const z = Store.addRow(c.id, { title: x.titel, status: 'Offen', notiz: 'etwas' });
    await new Promise(r => setTimeout(r, 200));
    Store.setProp(z.id, 'status', 'Fertig');
    await new Promise(r => setTimeout(r, 500));
    const nachher = Store.getBlock(z.id);
    return { id: z.id, archiviert: !!nachher.archiviert, lebt: nachher.alive !== false,
             notiz: nachher.props.notiz,
             kommentare: (nachher.kommentare || []).map(k => k.text),
             zurueck: !!nachher.zurueckBis,
             zeilen: Store.rowsOf(x.coll).filter(r => r.alive !== false).map(r => r.text) };
  }, { ...bau, ...vorbereiten, aktion });

  /* Archivieren */
  const arch = await lauf({ art: 'archivieren' }, { titel: 'Archivmich' });
  pruef('Archivieren setzt das Kennzeichen', arch.archiviert, true);
  pruef('Die Zeile bleibt bestehen',         arch.lebt, true);

  /* Löschen */
  const weg = await lauf({ art: 'loeschen' }, { titel: 'Weg damit' });
  pruef('Löschen legt in den Papierkorb', weg.lebt, false);
  pruef('Und die Zeile ist nicht mehr in der Liste',
        weg.zeilen.includes('Weg damit'), false);

  /* Leeren */
  const leer = await lauf({ art: 'leeren', key: 'notiz' }, { titel: 'Leermich' });
  pruef('Leeren räumt die Eigenschaft', leer.notiz, '');

  /* Duplizieren */
  const dup = await lauf({ art: 'duplizieren' }, { titel: 'Zwilling' });
  pruef('Duplizieren legt eine Kopie an',
        dup.zeilen.filter(t => t && t.startsWith('Zwilling')).length, 2);
  pruef('Die Kopie ist als solche erkennbar',
        dup.zeilen.some(t => t === 'Zwilling (Kopie)'), true);

  /* Kommentar */
  const komm = await lauf({ art: 'kommentar', text: 'Erledigt: {titel}' }, { titel: 'Sprechmich' });
  pruef('Kommentar wurde angehängt', komm.kommentare, ['Erledigt: Sprechmich']);

  /* Zurückstellen */
  const spaet = await lauf({ art: 'zurueckstellen', text: '7', wert: '7' }, { titel: 'Spaeter' });
  pruef('Zurückstellen vermerkt am Block', spaet.zurueck, true);
  const inListe = await p.evaluate((x) => Plan.liste().some(e => e.id === x), spaet.id);
  pruef('Und steht in der Liste',          inListe, true);

  /* --- Der Bauer zeigt die passenden Felder ---------------------------- */
  const bauer = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    Datenbank.automationenMenue(document.body, c, null, null);
    await new Promise(r => setTimeout(r, 250));
    document.querySelector('[data-a="neu"]').click();
    await new Promise(r => setTimeout(r, 300));
    const sel = document.querySelector('#ad');
    const optionen = sel.options.length;
    const sichtbar = (a) => {
      sel.value = a;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { key: document.querySelector('#adk').style.display !== 'none',
               wert: document.querySelector('#adw').style.display !== 'none',
               platz: document.querySelector('#adv').placeholder };
    };
    const erg = { optionen,
                  leeren: sichtbar('leeren'),
                  kommentar: sichtbar('kommentar'),
                  zurueck: sichtbar('zurueckstellen'),
                  archiv: sichtbar('archivieren') };
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    return erg;
  }, bau);
  pruef('19 Aktionen im Bauer',            bauer.optionen, 19);
  pruef('Leeren fragt nach der Spalte',    bauer.leeren.key, true);
  pruef('Leeren fragt nach keinem Wert',   bauer.leeren.wert, false);
  pruef('Kommentar fragt nach dem Text',   bauer.kommentar.wert, true);
  pruef('Mit passendem Platzhalter',       bauer.kommentar.platz.includes('Kommentars'), true);
  pruef('Zurückstellen fragt nach Tagen',  bauer.zurueck.platz.includes('Tagen'), true);
  pruef('Archivieren braucht nichts',
        bauer.archiv.key === false && bauer.archiv.wert === false, true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
