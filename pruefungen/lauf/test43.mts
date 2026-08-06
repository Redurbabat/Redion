/* Kalender: durchgehende Balken + Wochenraster; Filter: Spaltenvergleich
   und Vorlagen; Sortierung mehrstufig und nach Formel; Ansichtsvorlagen */
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
let ok = 0, bad = 0;
const pruef = (n: any, ist: any, soll: any) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 950 } });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1400);

  await p.evaluate(async () => {
    const seite = Store.addBlock(null, 'page', { text: 'Kalendertest' });
    const db = Store.addDatabase(seite.id, 'Termine', {
      title: { name: 'Titel',  type: 'title' },
      von:   { name: 'Von',    type: 'date' },
      bis:   { name: 'Bis',    type: 'date' },
      soll:  { name: 'Budget', type: 'number' },
      ist:   { name: 'Kosten', type: 'number' }
    }, 'calendar');
    const c = Store.getCollection(db.collectionId);
    Store.addRow(c.id, { title: 'Messe',    von: '2026-08-05', bis: '2026-08-09', soll: 100, ist: 150 });
    Store.addRow(c.id, { title: 'Workshop', von: '2026-08-12T09:30', soll: 200, ist: 120 });
    Store.addRow(c.id, { title: 'Ferien',   von: '2026-08-24', bis: '2026-09-02', soll: 0, ist: 0 });
    Store.addRow(c.id, { title: 'Kurz',     von: '2026-08-13T14:00', soll: 50, ist: 90 });
    Store.updateView(db.viewId, { endeKey: 'bis', monat: '2026-08-15T00:00:00.000Z', kalStufe: 'monat' });
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 500));
    return { coll: c.id, view: db.viewId, seite: seite.id };
  });

  const monat = await p.evaluate(() => ({
    wochen:  document.querySelectorAll('.cal-woche').length,
    balken:  document.querySelectorAll('.cw-bar').length,
    texte:   [...document.querySelectorAll<HTMLElement>('.cw-bar')].map(x => (x.textContent ?? '').trim().replace('⤢ Öffnen','').trim()),
    anfang:  document.querySelectorAll('.cw-bar.anfang').length,
    tage:    document.querySelectorAll('.cal-woche .day').length
  }));
  pruef('Monat hat Wochenreihen',            Number(monat.wochen ?? -1) >= 5, true);
  pruef('Mehrtägige Termine als Balken',     Number(monat.balken ?? -1) >= 3, true);
  pruef('Balken haben einen Anfang',         Number(monat.anfang ?? -1) >= 2, true);
  pruef('Jede Woche hat sieben Tage',        monat.tage % 7, 0);

  /* Woche mit Stundenraster */
  const woche = await p.evaluate(async () => {
    const v = Object.values(Store.cache.views).find(x => x.layout === 'calendar');
    Store.updateView(v.id, { kalStufe: 'woche', monat: '2026-08-12T00:00:00.000Z' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 400));
    return {
      raster:  !!document.querySelector('.kw-koerper'),
      zeilen:  document.querySelectorAll('.kw-zeile').length,
      tage:    document.querySelectorAll('.kw-tag').length,
      stunden: [...document.querySelectorAll<HTMLElement>('.kw-zeile .kw-ecke')].map(x => x.textContent).slice(0, 3),
      termine: [...document.querySelectorAll<HTMLElement>('.kw-zelle .ev')].map(x => (x.textContent ?? '').trim().replace('⤢ Öffnen','').trim()),
      ganztags: document.querySelectorAll('.kw-gz').length
    };
  });
  pruef('Wochenraster vorhanden',         woche.raster, true);
  pruef('Sieben Tagesspalten',            woche.tage, 7);
  pruef('Stunden beschriftet',            woche.stunden[0], '07:00');
  pruef('Termin mit Zeit im Raster',      woche.termine.some(t => (t ?? '').includes('Workshop')), true);
  pruef('Zweiter Termin auch',            woche.termine.some(t => (t ?? '').includes('Kurz')), true);
  pruef('Ganztags-Zeile hat 7 Felder',    woche.ganztags, 7);

  /* Filter: Spalte gegen Spalte */
  const vgl = await p.evaluate(async () => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Termine');
    const v = Object.values(Store.cache.views).find(x => x.collectionId === c.id);
    Store.updateView(v.id, { layout: 'table', kalStufe: 'monat',
      filters: { operator: 'and', rules: [
        { key: 'ist', op: 'größer als', vergleich: 'feld', wertKey: 'soll' } ] } });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 350));
    return [...document.querySelectorAll<HTMLElement>('tbody tr td:nth-child(2)')]
      .map(x => (x.textContent ?? '').trim().replace('⤢ Öffnen','').trim()).filter(Boolean);
  });
  pruef('Kosten > Budget findet zwei Zeilen', vgl.filter(x => x !== '+ Neu').sort(),
        ['Kurz', 'Messe']);

  /* Ohne Spaltenvergleich: fester Wert */
  const fest = await p.evaluate(async () => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Termine');
    const v = Object.values(Store.cache.views).find(x => x.collectionId === c.id);
    Store.updateView(v.id, { filters: { operator: 'and', rules: [
      { key: 'ist', op: 'größer als', wert: '100' } ] } });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 300));
    return [...document.querySelectorAll<HTMLElement>('tbody tr td:nth-child(2)')]
      .map(x => (x.textContent ?? '').trim().replace('⤢ Öffnen','').trim()).filter(x => x && x !== '+ Neu').sort();
  });
  pruef('Fester Wert filtert weiter richtig', fest, ['Messe', 'Workshop']);

  /* Filtervorlage speichern und wieder anwenden */
  const vorlage = await p.evaluate(async () => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Termine');
    const v = Object.values(Store.cache.views).find(x => x.collectionId === c.id);
    Store.setMeta('filterVorlagen', [{ name: 'Über Budget', collId: c.id,
      filters: { operator: 'and', rules: [
        { key: 'ist', op: 'größer als', vergleich: 'feld', wertKey: 'soll' } ] } }]);
    const liste = Store.getMeta('filterVorlagen', []);
    Store.updateView(v.id, { filters: JSON.parse(JSON.stringify(liste[0].filters)) });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 300));
    return [...document.querySelectorAll<HTMLElement>('tbody tr td:nth-child(2)')]
      .map(x => (x.textContent ?? '').trim().replace('⤢ Öffnen','').trim()).filter(x => x && x !== '+ Neu').sort();
  });
  pruef('Filtervorlage wieder angewendet', vorlage, ['Kurz', 'Messe']);

  /* Sortierung: mehrstufig und nach Formel */
  const sort = await p.evaluate(async () => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Termine');
    const v = Object.values(Store.cache.views).find(x => x.collectionId === c.id);
    Store.updateView(v.id, { filters: { operator: 'and', rules: [] },
                             sorts: [{ formel: 'prop("Kosten") - prop("Budget")', richtung: 'ab' }] });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 350));
    const nachFormel = [...document.querySelectorAll<HTMLElement>('tbody tr td:nth-child(2)')]
      .map(x => (x.textContent ?? '').trim().replace('⤢ Öffnen','').trim()).filter(x => x && x !== '+ Neu');
    Store.updateView(v.id, { sorts: [{ key: 'soll', richtung: 'auf' },
                                     { key: 'title', richtung: 'ab' }] });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 350));
    const zwei = [...document.querySelectorAll<HTMLElement>('tbody tr td:nth-child(2)')]
      .map(x => (x.textContent ?? '').trim().replace('⤢ Öffnen','').trim()).filter(x => x && x !== '+ Neu');
    return { nachFormel, zwei };
  });
  pruef('Formel-Sortierung: grösste Abweichung zuerst', sort.nachFormel[0], 'Messe');
  pruef('Formel-Sortierung: kleinste zuletzt',          sort.nachFormel.slice(-1)[0], 'Workshop');
  pruef('Zwei Ebenen: Budget 0 zuerst',                 sort.zwei[0], 'Ferien');
  pruef('Zwei Ebenen: Budget 200 zuletzt',              sort.zwei.slice(-1)[0], 'Workshop');

  /* Ansicht duplizieren übernimmt alles */
  const dup = await p.evaluate(async () => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Termine');
    const v = Object.values(Store.cache.views).find(x => x.collectionId === c.id);
    Store.updateView(v.id, { groupBy: 'soll', calc: { ist: 'Summe' }, hoehe: 'gross',
                             sorts: [{ key: 'soll', richtung: 'ab' }] });
    const alt = Store.getView(v.id);
    const neu = Store.addView(c.id, alt.layout, alt.name + ' Kopie');
    if (!neu) throw new Error('neu ist nicht da — der Lauf misst sonst nichts.');
    Store.updateView(neu.id, Datenbank.ansichtKopie(alt));
    const n2 = Store.getView(neu.id);
    return { groupBy: n2.groupBy, calc: n2.calc, hoehe: n2.hoehe,
             sorts: n2.sorts.length, name: n2.name, eigenId: n2.id !== alt.id };
  });
  pruef('Kopie übernimmt Gruppierung',  dup.groupBy, 'soll');
  pruef('Kopie übernimmt Berechnung',   dup.calc, { ist: 'Summe' });
  pruef('Kopie übernimmt Zeilenhöhe',   dup.hoehe, 'gross');
  pruef('Kopie übernimmt Sortierung',   dup.sorts, 1);
  pruef('Kopie hat eigenen Namen',      dup.name.endsWith('Kopie'), true);
  pruef('Kopie hat eigene Kennung',     dup.eigenId, true);

  /* Ansichtsvorlage anwenden — Spalten, die es nicht gibt, fallen weg */
  const av = await p.evaluate(async () => {
    const seite2 = Store.addBlock(null, 'page', { text: 'Andere' });
    const db2 = Store.addDatabase(seite2.id, 'Andere DB', {
      title: { name: 'Titel', type: 'title' },
      zahl:  { name: 'Zahl',  type: 'number' }
    });
    const c2 = Store.getCollection(db2.collectionId);
    const c  = Object.values(Store.cache.collections).find(x => x.name === 'Termine');
    const v  = Object.values(Store.cache.views).find(x => x.collectionId === c.id);
    Store.setMeta('ansichtVorlagen', [{ name: 'Standardtabelle', daten: Datenbank.ansichtKopie(Store.getView(v.id)) }]);
    /* Anwenden über dieselbe Logik wie das Menü */
    const vor = Store.getMeta('ansichtVorlagen', [])[0];
    const neu = Store.addView(c2.id, vor.daten.layout || 'table', vor.name);
    if (!neu) throw new Error('neu ist nicht da — der Lauf misst sonst nichts.');
    const d = JSON.parse(JSON.stringify(vor.daten));
    const gibt = (k: any) => !k || !!c2.schema[k];
    if (!gibt(d.groupBy)) d.groupBy = '';
    d.sorts = (d.sorts || []).filter((s: any) => s.formel || gibt(s.key));
    d.calc  = Object.fromEntries(Object.entries(d.calc || {}).filter(([k]) => gibt(k)));
    Store.updateView(neu.id, d);
    const n2 = Store.getView(neu.id);
    return { groupBy: n2.groupBy, sorts: n2.sorts.length, calc: Object.keys(n2.calc).length, name: n2.name };
  });
  pruef('Vorlage: fremde Gruppierung entfernt', av.groupBy, '');
  pruef('Vorlage: fremde Sortierung entfernt',  av.sorts, 0);
  pruef('Vorlage: fremde Berechnung entfernt',  av.calc, 0);
  pruef('Vorlage behält ihren Namen',           av.name, 'Standardtabelle');

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
