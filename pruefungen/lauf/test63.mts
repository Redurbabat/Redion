/* Die beiden neuen Vorlagen: Bauplan und Redaktionsplan */
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
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1600);

  const galerie = await p.evaluate(() => ({
    anzahl: Galerie.VORLAGEN.length,
    namen: Galerie.VORLAGEN.map(v => v.name)
  }));
  pruef('Elf Vorlagen in der Galerie', galerie.anzahl, 11);
  pruef('Bauplan dabei',       (galerie.namen ?? '').includes('Bauplan'), true);
  pruef('Redaktionsplan dabei', (galerie.namen ?? '').includes('Redaktionsplan'), true);
  pruef('Ausbildung dabei',     (galerie.namen ?? '').includes('Ausbildung'), true);

  /* --- Bauplan --------------------------------------------------------- */
  const bau = await p.evaluate(async () => {
    const seite = Galerie.VORLAGEN.find(v => v.id === 'bauplan')?.bauen();
    if (!seite) throw new Error('seite fehlt — der Lauf misst sonst nichts.');
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 700));
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Bauaufgaben');
    const views = Object.values(Store.cache.views).filter(v => v.collectionId === c.id);
    const zeilen = Store.rowsOf(c.id);
    return {
      seite: seite.id, coll: c.id,
      zeilen: zeilen.length,
      ansichten: views.map(v => v.name).sort(),
      selbstverknuepft: c.schema.vor.ziel === c.id,
      uebergaenge: c.schema.st.uebergaenge,
      mitVorgaenger: zeilen.filter(z => (z.props.vor || []).length).length,
      kosten: zeilen.reduce((n, z) => n + (Number(z.props.kosten) || 0), 0)
    };
  });
  pruef('Zwölf Aufgaben',        bau.zeilen, 12);
  pruef('Sechs Ansichten',       bau.ansichten.length, 6);
  pruef('Zeitstrahl dabei',      (bau.ansichten ?? '').includes('Zeitstrahl'), true);
  pruef('Board mit Bahnen dabei', (bau.ansichten ?? '').includes('Board mit Bahnen'), true);
  pruef('Kreuztabelle dabei',    (bau.ansichten ?? '').includes('Kosten je Gewerk'), true);
  pruef('Selbstverknüpfung steht', bau.selbstverknuepft, true);
  pruef('Elf haben einen Vorgänger', bau.mitVorgaenger, 11);
  pruef('Statusübergänge gesetzt', bau.uebergaenge['Offen'], ['In Arbeit']);
  pruef('Kosten summieren sich',  bau.kosten, 220000);

  /* Der Zeitstrahl zeichnet Pfeile */
  const zs = await p.evaluate(async (x) => {
    const v = Object.values(Store.cache.views)
      .find(y => y.collectionId === x.coll && y.name === 'Zeitstrahl');
    const blk = Object.values(Store.cache.blocks)
      .find(y => y.type === 'database' && y.collectionId === x.coll);
    Store.updateBlock(blk.id, { aktiveView: v.id });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 600));
    return { balken: document.querySelectorAll('.zs-balken').length,
             pfeile: document.querySelectorAll('.zs-pfeile path[marker-end]').length,
             namen: document.querySelectorAll('.zs-name').length };
  }, bau);
  pruef('Zwölf Balken im Zeitstrahl', zs.balken, 12);
  pruef('Elf Abhängigkeitspfeile',    zs.pfeile, 11);
  pruef('Namensspalte gefüllt',       zs.namen, 12);

  /* Das Board hat Bahnen */
  const board = await p.evaluate(async (x) => {
    const v = Object.values(Store.cache.views)
      .find(y => y.collectionId === x.coll && y.name === 'Board mit Bahnen');
    const blk = Object.values(Store.cache.blocks)
      .find(y => y.type === 'database' && y.collectionId === x.coll);
    Store.updateBlock(blk.id, { aktiveView: v.id });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 600));
    return { bahnen: document.querySelectorAll('.bahn').length,
             karten: document.querySelectorAll('.bahn .card').length };
  }, bau);
  pruef('Vier Bahnen (Gewerke)', board.bahnen, 4);
  pruef('Alle zwölf Karten verteilt', board.karten, 12);

  /* Die Kreuztabelle rechnet */
  const pivot = await p.evaluate(async (x) => {
    const v = Object.values(Store.cache.views)
      .find(y => y.collectionId === x.coll && y.name === 'Kosten je Gewerk');
    const blk = Object.values(Store.cache.blocks)
      .find(y => y.type === 'database' && y.collectionId === x.coll);
    Store.updateBlock(blk.id, { aktiveView: v.id });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 600));
    return { zeilen: document.querySelectorAll('.pivot tbody tr').length,
             klickbar: document.querySelectorAll('.pivot td.pv-klick').length,
             gesamt: (document.querySelector('.pivot .pv-fuss .pv-summe') || {}).textContent };
  }, bau);
  pruef('Vier Gewerke plus Gesamtzeile', pivot.zeilen, 5);
  pruef('Zellen sind anklickbar',        Number(pivot.klickbar ?? -1) > 3, true);
  pruef('Gesamtsumme stimmt',            pivot.gesamt?.replace(/\s/g, ''), '220000');

  /* Statusübergang greift wirklich */
  const uebergang = await p.evaluate(async (x) => {
    const z = Store.rowsOf(x.coll).find(y => y.text === 'Baugrube');   /* Fertig */
    Store.setProp(z.id, 'st', 'Offen');
    await new Promise(r => setTimeout(r, 250));
    const verboten = Store.getBlock(z.id).props.st;
    Store.setProp(z.id, 'st', 'In Arbeit');
    await new Promise(r => setTimeout(r, 250));
    const erlaubt = Store.getBlock(z.id).props.st;
    return { verboten, erlaubt };
  }, bau);
  pruef('Von Fertig direkt auf Offen geht nicht', uebergang.verboten, 'Fertig');
  pruef('Über „In Arbeit" geht es aber',          uebergang.erlaubt, 'In Arbeit');

  /* --- Redaktionsplan --------------------------------------------------- */
  const red = await p.evaluate(async () => {
    const seite = Galerie.VORLAGEN.find(v => v.id === 'redaktion')?.bauen();
    if (!seite) throw new Error('seite fehlt — der Lauf misst sonst nichts.');
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 700));
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Beiträge');
    const views = Object.values(Store.cache.views).filter(v => v.collectionId === c.id);
    const z = Store.rowsOf(c.id).find(y => y.text === 'Warum Notion langsam wird');
    return { seite: seite.id, coll: c.id,
             zeilen: Store.rowsOf(c.id).length,
             ansichten: views.map(v => v.name).sort(),
             automationen: (c.automationen || []).length,
             tempo: String(Datenbank.wert(z, 'tempo', c)),
             formular: views.find(v => v.layout === 'form') };
  });
  pruef('Fünf Beiträge',            red.zeilen, 5);
  pruef('Drei Ansichten',           red.ansichten.length, 3);
  pruef('Formular dabei',           (red.ansichten ?? '').includes('Ideen einreichen'), true);
  pruef('Eine Automation',          red.automationen, 1);
  pruef('Tempoformel rechnet',      /\d+ \/ Tag/.test(red.tempo ?? ''), true);
  pruef('Formular mit Danke-Seite', red.formular.formDankTitel, 'Notiert!');
  pruef('Titel ist Pflicht',        red.formular.pflicht, ['title']);

  /* Die Automation stempelt beim Umstellen */
  const stempel = await p.evaluate(async (x) => {
    const z = Store.rowsOf(x.coll).find(y => y.text === 'Formeln, die keiner kennt');
    Store.setProp(z.id, 'st', 'In Arbeit');
    await new Promise(r => setTimeout(r, 600));
    const n = Store.getBlock(z.id);
    return { start: n.props.start, kommentar: (n.kommentare || []).map((k: any) => k.text) };
  }, red);
  pruef('Beginndatum wurde gesetzt', !!stempel.start, true);
  pruef('Und ein Kommentar geschrieben',
        stempel.kommentar, ['Angefangen: Formeln, die keiner kennt']);

  /* --- Beide Seiten zeichnen am Telefon --------------------------------- */
  const handy = await b.newPage({ viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true });
  const fehler2: any[] = [];
  handy.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await handy.goto('file://' + WURZEL + '/index.html');
  await handy.waitForTimeout(1800);
  const amHandy = await handy.evaluate(async () => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    const raus = [];
    for (const id of ['bauplan', 'redaktion']) {
      const s = Galerie.VORLAGEN.find(v => v.id === id)?.bauen();
      if (!s) throw new Error('s fehlt — der Lauf misst sonst nichts.');
      App.oeffne(s.id);
      await new Promise(r => setTimeout(r, 700));
      raus.push([id, document.documentElement.scrollWidth - innerWidth,
                 musselement('#page').textContent.length]);
    }
    return raus;
  });
  amHandy.forEach(([id, ueber, laenge]) => {
    pruef('Am Telefon ohne Überlauf: ' + id, Number(ueber ?? -1) <= 1, true);
    pruef('… und mit Inhalt: ' + id, Number(laenge ?? -1) > 50, true);
  });

  console.log(`\n${ok}/${ok + bad} bestanden`);
  const alle = [...fehler, ...fehler2];
  console.log(alle.length ? 'JS-Fehler:\n' + alle.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || alle.length ? 1 : 0);
})();
