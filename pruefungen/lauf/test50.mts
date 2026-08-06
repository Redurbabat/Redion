/* Tempo: Formelspeicher, fensterweises Zeichnen, Suchregister, Messung */
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
  const p = await b.newPage({ viewport: { width: 1300, height: 900 } });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  /* --- Grosse Datenbank bauen ------------------------------------------ */
  const bau = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Viele Zeilen' });
    const db = Store.addDatabase(s.id, 'Posten', {
      title: { name: 'Name',   type: 'title' },
      menge: { name: 'Menge',  type: 'number' },
      preis: { name: 'Preis',  type: 'number' },
      summe: { name: 'Summe',  type: 'formula',
               formula: 'prop("Menge") * prop("Preis")' },
      text:  { name: 'Notiz',  type: 'formula',
               formula: 'if(prop("Menge") > 100, "viel", "wenig") + " von " + prop("Name")' }
    });
    const c = Store.getCollection(db.collectionId);
    for (let i = 0; i < 200; i++)
      Store.addRow(c.id, { title: 'Posten ' + i, menge: i, preis: 2 });
    Store.updateView(db.viewId, { limit: 0 });   /* alle Zeilen zeigen */
    return { seite: s.id, coll: c.id, view: db.viewId };
  });

  /* --- Formelspeicher --------------------------------------------------- */
  const speicher = await p.evaluate((bau2) => {
    Tempo.leeren();
    const c = Store.getCollection(bau2.coll);
    const zeilen = Store.rowsOf(c.id);
    /* Erste Runde: alles muss gerechnet werden */
    const t0 = performance.now();
    zeilen.forEach(r => { Datenbank.wert(r, 'summe', c); Datenbank.wert(r, 'text', c); });
    const ersteRunde = performance.now() - t0;
    const nachErst = { ...Tempo.zahlen };
    /* Zweite Runde: alles kommt aus dem Speicher */
    const t1 = performance.now();
    zeilen.forEach(r => { Datenbank.wert(r, 'summe', c); Datenbank.wert(r, 'text', c); });
    const zweiteRunde = performance.now() - t1;
    const nachZweit = { ...Tempo.zahlen };
    return { ersteRunde, zweiteRunde,
             gerechnetErst: nachErst.gerechnet, gerechnetZweit: nachZweit.gerechnet,
             treffer: nachZweit.treffer, groesse: Tempo.speicherGroesse(),
             wert: Datenbank.wert(zeilen[50], 'summe', c) };
  }, bau);
  pruef('Erste Runde rechnet 400 Formeln', speicher.gerechnetErst, 400);
  pruef('Zweite Runde rechnet nichts neu', speicher.gerechnetZweit, 400);
  pruef('400 Treffer aus dem Speicher',    speicher.treffer, 400);
  pruef('Speicher hält 400 Einträge',      speicher.groesse, 400);
  pruef('Zweite Runde ist schneller',      speicher.zweiteRunde < speicher.ersteRunde, true);
  pruef('Der Wert stimmt trotzdem',        speicher.wert, 100);

  /* Änderung muss den Speicher verwerfen */
  const nachAenderung = await p.evaluate(async (bau2) => {
    const c = Store.getCollection(bau2.coll);
    const zeile = Store.rowsOf(c.id)[50];
    Store.setProp(zeile.id, 'preis', 10);
    await new Promise(r => setTimeout(r, 60));
    const vorher = Tempo.zahlen.gerechnet;
    const neu = Datenbank.wert(Store.getBlock(zeile.id), 'summe', c);
    return { neu, gerechnetMehr: Tempo.zahlen.gerechnet - vorher, groesse: Tempo.speicherGroesse() };
  }, bau);
  pruef('Nach der Änderung stimmt der Wert', nachAenderung.neu, 500);
  pruef('Es wurde neu gerechnet',            nachAenderung.gerechnetMehr, 1);

  /* Speicher abschaltbar */
  const ohne = await p.evaluate((bau2) => {
    Tempo.leeren();
    Tempo.cacheSetzen(false);
    const c = Store.getCollection(bau2.coll);
    const r = Store.rowsOf(c.id)[0];
    Datenbank.wert(r, 'summe', c);
    Datenbank.wert(r, 'summe', c);
    const g = Tempo.zahlen.gerechnet;
    Tempo.cacheSetzen(true);
    return g;
  }, bau);
  pruef('Ohne Speicher wird jedes Mal gerechnet', ohne, 2);

  /* --- Fensterweises Zeichnen ------------------------------------------ */
  const fenster = await p.evaluate(async (bau2) => {
    App.oeffne(bau2.seite);
    await new Promise(r => setTimeout(r, 900));
    const t = document.querySelector<HTMLTableElement>('.grid');
    if (!t) throw new Error('.grid ist nicht da — der Lauf misst sonst nichts.');
    const alle = (t.tBodies[0]?.rows ?? []).length;
    const sichtbar = [...(t.tBodies[0]?.rows ?? [])].filter(r => r.style.display !== 'none').length;
    const luft = t.querySelectorAll('tr.vs-luft').length;
    return { alle, sichtbar, luft,
             hoeheUnten: t.querySelector<HTMLElement>('tr.vs-luft:last-child td')?.style.height };
  }, bau);
  pruef('Zwei Luftzeilen eingefügt',   fenster.luft, 2);
  pruef('Nicht alle Zeilen sichtbar',  fenster.sichtbar < fenster.alle, true);
  pruef('Aber einige schon',           Number(fenster.sichtbar ?? -1) > 20, true);
  pruef('Untere Luft hat eine Höhe',   /\d+px/.test(fenster.hoeheUnten ?? ''), true);

  /* Scrollen blendet weiter unten liegende Zeilen ein */
  const nachScroll = await p.evaluate(async () => {
    const s = document.getElementById('scroll');
    if (!s) throw new Error('scroll ist nicht da — der Lauf misst sonst nichts.');
    const vorher = [...document.querySelectorAll<HTMLElement>('.grid tbody tr')]
      .findIndex(r => r.style.display !== 'none' && r.dataset.rid);
    s.scrollTop = 2500;
    s.dispatchEvent(new Event('scroll'));
    await new Promise(r => setTimeout(r, 250));
    const nachher = [...document.querySelectorAll<HTMLElement>('.grid tbody tr')]
      .findIndex(r => r.style.display !== 'none' && r.dataset.rid);
    return { vorher, nachher };
  });
  pruef('Nach dem Scrollen beginnt das Fenster später',
        nachScroll.nachher > nachScroll.vorher, true);

  /* Abschaltbar */
  const ohneFenster = await p.evaluate(async (_bau2) => {
    Store.setMeta('tempoFenster', false);
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 700));
    const t = document.querySelector<HTMLTableElement>('.grid');
    if (!t) throw new Error('t ist nicht da — der Lauf misst sonst nichts.');
    const versteckt = [...(t.tBodies[0]?.rows ?? [])].filter(r => r.style.display === 'none').length;
    Store.setMeta('tempoFenster', true);
    return versteckt;
  }, bau);
  pruef('Abgeschaltet ist nichts versteckt', ohneFenster, 0);

  /* --- Suchregister ----------------------------------------------------- */
  const register = await p.evaluate(() => {
    const gebaut = Tempo.bauen();
    const treffer = Tempo.finde('posten');
    const teil = Tempo.finde('poste');
    const nix = Tempo.finde('gibtesnicht');
    const zuKurz = Tempo.finde('a');
    return { woerter: gebaut.woerter, ms: gebaut.ms,
             treffer: treffer.length, teil: teil.length,
             nix: nix.length, zuKurz: zuKurz.length };
  });
  pruef('Register kennt viele Wörter', Number(register.woerter ?? -1) > 50, true);
  pruef('Register ist schnell gebaut', Number(register.ms ?? -1) < 500, true);
  pruef('Alle 200 Posten gefunden',    Number(register.treffer ?? -1) >= 200, true);
  pruef('Wortanfang findet auch',      Number(register.teil ?? -1) >= 200, true);
  pruef('Unbekanntes Wort: nichts',    register.nix, 0);
  pruef('Ein Buchstabe: nichts',       register.zuKurz, 0);

  /* Register wird nach einer Änderung neu gebaut */
  const neuGebaut = await p.evaluate(async () => {
    Store.addBlock(null, 'page', { text: 'Zauberwort Xylophon' });
    await new Promise(r => setTimeout(r, 60));
    return Tempo.finde('xylophon').length;
  });
  pruef('Neuer Text sofort im Register', neuGebaut, 1);

  /* --- Anzeige und Dialog ---------------------------------------------- */
  const anzeige = await p.evaluate(async () => {
    Tempo.anzeigeAn(true);
    await new Promise(r => setTimeout(r, 200));
    const el = document.getElementById('tempo-anzeige');
    const text = el ? el.textContent : '';
    Tempo.anzeigeAn(false);
    return { da: !!el, text, weg: !document.getElementById('tempo-anzeige') };
  });
  pruef('Anzeige lässt sich einblenden', anzeige.da, true);
  pruef('Anzeige nennt Formeln',         (anzeige.text ?? '').includes('Formeln'), true);
  pruef('Anzeige lässt sich ausblenden', anzeige.weg, true);

  await p.evaluate(() => Tempo.dialog());
  await p.waitForTimeout(300);
  const dialog = await p.evaluate(() => ({
    karten: document.querySelectorAll('.tp-k').length,
    teuerste: document.querySelectorAll('.tp-z').length,
    schalter: document.querySelectorAll('.tp-schalter').length,
    ersteFormel: (document.querySelector('.tp-z span') || {}).textContent
  }));
  pruef('Vier Kennzahlen',        dialog.karten, 4);
  pruef('Teuerste Formeln gelistet', Number(dialog.teuerste ?? -1) >= 2, true);
  pruef('Drei Schalter',          dialog.schalter, 3);
  pruef('Die teuerste ist aus Posten', (dialog.ersteFormel || '').includes('Posten'), true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
