/* Startzeit, Speicher und Verhalten bei viel Inhalt */
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
  const b = await chromium.launch({ args: ['--js-flags=--expose-gc'] });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));

  const t0 = Date.now();
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForFunction(() => typeof App !== 'undefined' && document.getElementById('page'));
  const bisApp = Date.now() - t0;
  await p.waitForTimeout(1800);
  pruef('App steht in unter 5 Sekunden', bisApp < 5000, true);
  console.log('   Bis die App steht: ' + bisApp + ' ms');

  const anfang = await p.evaluate(() => ({
    speicher: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) : null,
    module: Object.keys(window).filter(k => /^[A-Z]/.test(k) && typeof (window as any)[k] === 'object').length
  }));
  console.log('   Speicher am Anfang: ' + anfang.speicher + ' MB');
  pruef('Unter 120 MB am Anfang', anfang.speicher === null || Number(anfang.speicher ?? -1) < 120, true);

  /* Viel Inhalt anlegen: 40 Seiten, eine Datenbank mit 800 Zeilen */
  const gebaut = await p.evaluate(async () => {
    const t = performance.now();
    for (let i = 0; i < 40; i++) {
      const s = Store.addBlock(null, 'page', { text: 'Seite ' + i });
      for (let j = 0; j < 8; j++) Store.addBlock(s.id, 'text', { text: 'Absatz ' + j });
    }
    const s = Store.addBlock(null, 'page', { text: 'Viel' });
    const db = Store.addDatabase(s.id, 'Gross', {
      title: { name: 'T', type: 'title' }, n: { name: 'N', type: 'number' },
      st: { name: 'S', type: 'select', options: ['A', 'B', 'C'] },
      f: { name: 'F', type: 'formula', formula: 'prop("N") * 2 + length(prop("T"))' } });
    const c = Store.getCollection(db.collectionId);
    for (let i = 0; i < 800; i++)
      Store.addRow(c.id, { title: 'Z' + i, n: i, st: ['A','B','C'][i % 3] });
    Store.updateView(db.viewId, { limit: 0 });
    return { ms: Math.round(performance.now() - t), seite: s.id, coll: c.id, view: db.viewId };
  });
  console.log('   Aufbau (40 Seiten + 800 Zeilen): ' + gebaut.ms + ' ms');
  pruef('Der Aufbau dauert unter 20 Sekunden', Number(gebaut.ms ?? -1) < 20000, true);

  const zeichnen = await p.evaluate(async (x) => {
    const t = performance.now();
    App.oeffne(x.seite);
    await new Promise(r => setTimeout(r, 1200));
    const ms = Math.round(performance.now() - t);
    return { ms, zeilen: document.querySelectorAll('.grid tbody tr').length,
             speicher: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) : null };
  }, gebaut);
  console.log('   800 Zeilen zeichnen: ' + zeichnen.ms + ' ms, Speicher ' + zeichnen.speicher + ' MB');
  pruef('800 Zeilen in unter 6 Sekunden', Number(zeichnen.ms ?? -1) < 6000, true);
  /* 800 Datenzeilen plus die Zeile zum Anlegen und die Gruppenzeilen */
  pruef('Alle 800 Zeilen sind da',        Number(zeichnen.zeilen ?? -1) >= 800, true);
  pruef('Speicher bleibt unter 350 MB',
        zeichnen.speicher === null || Number(zeichnen.speicher ?? -1) < 350, true);

  /* Der Baum in der Seitenleiste mit 40 Seiten */
  const baum = await p.evaluate(async () => {
    const t = performance.now();
    for (let i = 0; i < 10; i++) App.zeichneBaum();
    return Math.round(performance.now() - t);
  });
  console.log('   Seitenleiste 10× zeichnen: ' + baum + ' ms');
  pruef('Der Baum bleibt flott', baum < 4000, true);

  /* Suche über alles */
  const suche = await p.evaluate(async () => {
    const t = performance.now();
    const treffer = Store.search('Absatz');
    /* Nur die selbst angelegten Seiten zählen — die Wissensseiten der App
       enthalten das Wort inzwischen auch. */
    const eigene = treffer.filter(x => /^Seite \d+$/.test((x.page && x.page.text) || ''));
    return { ms: Math.round(performance.now() - t), anzahl: eigene.length,
             gesamt: treffer.length };
  });
  console.log('   Suche über alles: ' + suche.ms + ' ms, ' + suche.anzahl + ' Treffer');
  pruef('Die Suche antwortet unter 2 Sekunden', Number(suche.ms ?? -1) < 2000, true);
  /* Store.search liefert Seiten, nicht einzelne Bloecke — 40 Seiten
     enthalten das Wort, das ist die richtige Zahl. */
  pruef('Und findet die vierzig Seiten',        suche.anzahl, 40);

  /* Neustart mit vielen Daten */
  await p.evaluate(() => Store.flush());
  await p.waitForTimeout(1500);
  const t2 = Date.now();
  await p.reload();
  await p.waitForFunction(() => typeof Store !== 'undefined' &&
    Object.keys(Store.cache.blocks).length > 500, null, { timeout: 25000 });
  const nachLaden = Date.now() - t2;
  console.log('   Neustart mit ~1200 Blöcken: ' + nachLaden + ' ms');
  pruef('Neustart in unter 15 Sekunden', nachLaden < 15000, true);

  await p.waitForTimeout(1500);
  const danach = await p.evaluate(() => ({
    bloecke: Object.keys(Store.cache.blocks).length,
    seite: !!document.getElementById('page')?.textContent,
    speicher: (performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) : null
  }));
  console.log('   Nach dem Neustart: ' + danach.bloecke + ' Blöcke, ' + danach.speicher + ' MB');
  pruef('Alle Blöcke sind wieder da', Number(danach.bloecke ?? -1) > 1100, true);
  pruef('Und eine Seite steht',       danach.seite, true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || fehler.length ? 1 : 0);
})();
