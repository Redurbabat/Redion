/* Das gemeinsame Protokoll: was wann von wem geschehen ist */
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
  await p.waitForTimeout(1800);

  /* --- 1 · Der Start selbst steht schon drin ----------------------------- */
  const start = await p.evaluate(() => ({
    anzahl: Protokoll.alle().length,
    erster: (Protokoll.alle()[0] || {}).art,
    text: (Protokoll.alle()[0] || {}).text,
    arten: Protokoll.ARTEN.length
  }));
  pruef('Es ist schon etwas aufgezeichnet', start.anzahl >= 1, true);
  pruef('Nämlich das Öffnen',   start.text, 'Redion geöffnet');
  pruef('Achtzehn Ereignisarten', start.arten, 18);

  /* --- 2 · Seiten anlegen, wegwerfen, zurückholen ------------------------ */
  const seiten = await p.evaluate(async () => {
    Protokoll.leeren();
    const s = Store.addBlock(null, 'page', { text: 'Protokollprobe' });
    Store.addBlock(s.id, 'text', { text: 'Ein Absatz' });      /* soll NICHT zählen */
    await new Promise(r => setTimeout(r, 200));
    Store.trashBlock(s.id);
    await new Promise(r => setTimeout(r, 150));
    Store.restoreBlock(s.id);
    await new Promise(r => setTimeout(r, 200));
    const liste = Protokoll.alle();
    return { arten: liste.map(e => e.art), texte: liste.map(e => e.text), id: s.id };
  });
  pruef('Drei Ereignisse, in dieser Reihenfolge',
        seiten.arten, ['seite-zurueck', 'seite-weg', 'seite-neu']);
  pruef('Ein Absatz zählt nicht mit',
        seiten.texte.some(t => t.includes('Ein Absatz')), false);
  pruef('Der Seitenname steht dabei',
        seiten.texte[2], 'Seite „Protokollprobe" angelegt');

  /* Endgültig löschen */
  const endgueltig = await p.evaluate(async (id) => {
    Protokoll.leeren();
    Store.trashBlock(id);
    Store.purgeBlock(id);
    await new Promise(r => setTimeout(r, 250));
    return Protokoll.alle().map(e => e.art);
  }, seiten.id);
  pruef('Endgültiges Löschen wird vermerkt',
        endgueltig.includes('seite-endgueltig'), true);

  /* --- 3 · Datenbanken, Zeilen, Spalten ---------------------------------- */
  const daten = await p.evaluate(async () => {
    Protokoll.leeren();
    const s = Store.addBlock(null, 'page', { text: 'Datenprobe' });
    const db = Store.addDatabase(s.id, 'Kram', {
      title: { name: 'Titel', type: 'title' },
      a: { name: 'A', type: 'text' }
    });
    const c = Store.getCollection(db.collectionId);
    await new Promise(r => setTimeout(r, 200));
    Store.addRow(c.id, { title: 'Erste' });
    await new Promise(r => setTimeout(r, 150));
    /* Eine Spalte dazu */
    Store.updateCollection(c.id, { schema: { ...c.schema,
      neu: { name: 'Neu', type: 'number' } } });
    await new Promise(r => setTimeout(r, 250));
    const liste = Protokoll.alle();
    return { arten: liste.map(e => e.art), texte: liste.map(e => e.text),
             seite: s.id, coll: c.id };
  });
  pruef('Datenbank angelegt vermerkt', daten.arten.includes('db-neu'), true);
  pruef('Zeile angelegt vermerkt',     daten.arten.includes('zeile-neu'), true);
  pruef('Spaltenänderung vermerkt',    daten.arten.includes('spalte'), true);
  pruef('Mit der Zahl im Satz',
        daten.texte.some(t => t.includes('1 Spalte(n) dazu')), true);

  /* --- 4 · Automation ---------------------------------------------------- */
  const automation = await p.evaluate(async (x) => {
    Protokoll.leeren();
    const c = Store.getCollection(x.coll);
    c.automationen = [{ id: 'a1', name: 'Stempel', an: true,
      wenn: { art: 'prop-wert', key: 'a', wert: 'los' },
      dann: [{ art: 'melden', text: 'Gelaufen' }] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    const z = Store.rowsOf(c.id)[0];
    Store.setProp(z.id, 'a', 'los');
    await new Promise(r => setTimeout(r, 600));
    const liste = Protokoll.gefiltert({ art: 'automation' });
    return { anzahl: liste.length, text: (liste[0] || {}).text, wie: (liste[0] || {}).wie };
  }, daten);
  pruef('Der Automationslauf steht im Protokoll', automation.anzahl, 1);
  pruef('Mit dem Namen der Automation',
        automation.text.includes('Stempel'), true);
  pruef('Und für welche Zeile',
        (automation.wie || '').includes('Erste'), true);

  /* --- 5 · Rechteänderung ------------------------------------------------ */
  const rechte = await p.evaluate(async (x) => {
    Protokoll.leeren();
    Konten.setzeFreigabe(x.seite, '*', 'lesen');
    await new Promise(r => setTimeout(r, 200));
    Konten.setzeFreigabe(x.seite, '*', 'edit');
    await new Promise(r => setTimeout(r, 200));
    /* Dasselbe nochmal setzen darf nichts vermerken */
    Konten.setzeFreigabe(x.seite, '*', 'edit');
    await new Promise(r => setTimeout(r, 200));
    const liste = Protokoll.gefiltert({ art: 'rechte' });
    return { anzahl: liste.length, texte: liste.map(e => e.text) };
  }, daten);
  pruef('Zwei Rechteänderungen',      rechte.anzahl, 2);
  pruef('Mit Vorher und Nachher',
        rechte.texte[0].includes('Lesen → Bearbeiten'), true);
  pruef('Beim ersten Mal aus dem Nichts',
        rechte.texte[1].includes('nichts → Lesen'), true);

  /* --- 6 · Über die Schnittstelle ---------------------------------------- */
  const ueberApi = await p.evaluate(async (x) => {
    Protokoll.leeren();
    const token = Api.tokenNeu();
    const kopf = { 'notion-version': '2022-06-28', authorization: 'Bearer ' + token };
    Api.anfrage('GET', '/v1/pages/' + x.seite, {}, kopf);          /* lesen: nicht */
    Api.anfrage('POST', '/v1/databases/' + x.coll + '/query', {}, kopf);  /* auch nicht */
    Api.anfrage('PATCH', '/v1/pages/' + x.seite,
      { properties: { title: { title: [{ text: { content: 'Über die API' } }] } } }, kopf);
    await new Promise(r => setTimeout(r, 300));
    const liste = Protokoll.gefiltert({ art: 'api' });
    return { anzahl: liste.length, text: (liste[0] || {}).text };
  }, daten);
  pruef('Nur der schreibende Zugriff steht drin', ueberApi.anzahl, 1);
  pruef('Mit Methode und Pfad',
        ueberApi.text.startsWith('PATCH /v1/pages/'), true);

  /* --- 7 · Transaktion ---------------------------------------------------- */
  const transaktion = await p.evaluate(async (x) => {
    Protokoll.leeren();
    Transaktion.ausfuehren([
      { id: x.seite, table: 'block', path: ['text'], command: 'set', args: 'Neu' },
      { id: x.seite, table: 'block', path: [], command: 'update', args: { color: 'red' } }
    ]);
    await new Promise(r => setTimeout(r, 300));
    const liste = Protokoll.gefiltert({ art: 'transaktion' });
    return { anzahl: liste.length, text: (liste[0] || {}).text, wie: (liste[0] || {}).wie };
  }, daten);
  pruef('Die Transaktion steht drin', transaktion.anzahl, 1);
  pruef('Mit der Zahl der Befehle',   transaktion.text, '2 Befehle ausgeführt');
  pruef('Und welche es waren',        transaktion.wie, 'set, update');

  /* --- 8 · Filtern und Zählen -------------------------------------------- */
  const filtern = await p.evaluate(async () => {
    Protokoll.leeren();
    for (let i = 0; i < 5; i++)
      Protokoll.notieren('export', 'Ausgabe ' + i, { wer: i % 2 ? 'Anna' : 'Ben' });
    Protokoll.notieren('import', 'Etwas eingelesen', { wer: 'Anna' });
    await new Promise(r => setTimeout(r, 150));
    return {
      alle: Protokoll.alle().length,
      nurExport: Protokoll.gefiltert({ art: 'export' }).length,
      nurAnna: Protokoll.gefiltert({ wer: 'Anna' }).length,
      gesucht: Protokoll.gefiltert({ suche: 'Ausgabe 3' }).length,
      beides: Protokoll.gefiltert({ art: 'export', wer: 'Ben' }).length,
      zahlen: Protokoll.zahlen()
    };
  });
  pruef('Sechs Einträge',        filtern.alle, 6);
  pruef('Fünf davon Ausgaben',   filtern.nurExport, 5);
  pruef('Drei von Anna',         filtern.nurAnna, 3);
  pruef('Die Suche findet einen', filtern.gesucht, 1);
  pruef('Zwei Filter zusammen',  filtern.beides, 3);
  pruef('Die Zählung stimmt',    filtern.zahlen.gesamt, 6);
  pruef('Nach Art gezählt',      filtern.zahlen.nachArt.export, 5);
  pruef('Nach Person gezählt',   filtern.zahlen.nachWer.Anna, 3);

  /* --- 9 · Die Grenze ----------------------------------------------------- */
  const grenze = await p.evaluate(async () => {
    Protokoll.leeren();
    for (let i = 0; i < 2100; i++) Protokoll.notieren('sonstiges', 'Nummer ' + i);
    return { anzahl: Protokoll.alle().length,
             neuestes: Protokoll.alle()[0].text,
             aeltestes: Protokoll.alle()[Protokoll.alle().length - 1].text };
  });
  pruef('Höchstens 2000 Einträge',   grenze.anzahl, 2000);
  pruef('Das Neueste steht oben',    grenze.neuestes, 'Nummer 2099');
  pruef('Das Älteste ist gefallen',  grenze.aeltestes, 'Nummer 100');

  /* --- 10 · Abschaltbar ---------------------------------------------------- */
  const aus = await p.evaluate(async () => {
    Protokoll.leeren();
    Store.setMeta('protokollAus', true);
    Protokoll.notieren('sonstiges', 'Sollte nicht ankommen');
    const s = Store.addBlock(null, 'page', { text: 'Auch nicht' });
    await new Promise(r => setTimeout(r, 200));
    const stumm = Protokoll.alle().length;
    Store.setMeta('protokollAus', false);
    Protokoll.notieren('sonstiges', 'Jetzt schon');
    return { stumm, danach: Protokoll.alle().length };
  });
  pruef('Ausgeschaltet zeichnet es nichts auf', aus.stumm, 0);
  pruef('Wieder an geht es weiter',             aus.danach, 1);

  /* --- 11 · CSV ------------------------------------------------------------ */
  const csv = await p.evaluate(() => {
    Protokoll.leeren();
    Protokoll.notieren('export', 'Mit "Anführungszeichen" drin', { wer: 'Ben' });
    Protokoll.notieren('ki', 'Zweite Zeile');
    const t = Protokoll.alsCsv(Protokoll.alle());
    return { zeilen: t.split('\n').length, kopf: t.split('\n')[0],
             maskiert: t.includes('""Anführungszeichen""') };
  });
  pruef('Kopfzeile und zwei Zeilen', csv.zeilen, 3);
  pruef('Mit den richtigen Spalten',
        csv.kopf, '"Wann";"Art";"Was";"Wer";"Objekt"');
  pruef('Anführungszeichen werden verdoppelt', csv.maskiert, true);

  /* --- 12 · Zeitangaben ---------------------------------------------------- */
  const zeiten = await p.evaluate(() => {
    const jetzt = new Date();
    const gestern = new Date(jetzt.getTime() - 86400000);
    const vorlang = new Date(jetzt.getTime() - 8 * 86400000);
    return { heute: Protokoll.wannText(jetzt.toISOString()),
             gestern: Protokoll.wannText(gestern.toISOString()),
             lang: Protokoll.wannText(vorlang.toISOString()),
             unsinn: Protokoll.wannText('keine zeit') };
  });
  pruef('Heute steht als Heute da',    zeiten.heute.startsWith('Heute '), true);
  pruef('Gestern als Gestern',         zeiten.gestern.startsWith('Gestern '), true);
  pruef('Älteres mit Datum',           /^\d\d\.\d\d\./.test(zeiten.lang), true);
  pruef('Unsinn stürzt nicht ab',      zeiten.unsinn, 'keine zeit');

  /* --- 13 · Das Fenster ----------------------------------------------------- */
  const fenster = await p.evaluate(async (x) => {
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    Protokoll.leeren();
    Protokoll.notieren('seite-neu', 'Eine Seite', { seite: x.seite, wer: 'Anna' });
    Protokoll.notieren('ki', 'KI gefragt', { wer: 'Ben' });
    Protokoll.notieren('export', 'Etwas ausgegeben', { wer: 'Anna' });
    Protokoll.dialog();
    await new Promise(r => setTimeout(r, 350));
    const o = document.querySelector('.overlay');
    const zeilen = o.querySelectorAll('.pr-zeile').length;
    const zahl = o.querySelector('#pr-zahl').textContent;
    const hinweis = o.querySelector('#pr-hinweis').textContent;

    /* Nach Art filtern */
    const sel = o.querySelector('#pr-art');
    sel.value = 'ki';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const nurKi = o.querySelectorAll('.pr-zeile').length;

    /* Nach Person */
    sel.value = '';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    const wer = o.querySelector('#pr-wer');
    const namen = [...wer.options].map(x2 => x2.value);
    wer.value = 'Anna';
    wer.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const nurAnna = o.querySelectorAll('.pr-zeile').length;

    /* Suchen */
    wer.value = '';
    wer.dispatchEvent(new Event('change', { bubbles: true }));
    const s = o.querySelector('#pr-suche');
    s.value = 'ausgegeben';
    s.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const gesucht = o.querySelectorAll('.pr-zeile').length;

    /* Filter zuruecksetzen, sonst zaehlt man nur den Suchtreffer */
    s.value = '';
    s.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const klickbar = o.querySelectorAll('.pr-zeile[data-seite]').length;
    const breit = o.querySelector('.finder').getBoundingClientRect();
    document.querySelectorAll('.overlay').forEach(y => y.remove());
    return { zeilen, zahl, hinweis, nurKi, namen, nurAnna, gesucht, klickbar,
             passt: breit.right <= innerWidth + 1 };
  }, daten);
  pruef('Drei Zeilen im Fenster',    fenster.zeilen, 3);
  pruef('Der Zähler stimmt',         fenster.zahl, '3');
  pruef('Es sagt, wo es steht',
        fenster.hinweis.includes('nicht auf einem Server'), true);
  pruef('Und dass Angesehenes nicht zählt',
        fenster.hinweis.includes('Angesehene Seiten'), true);
  pruef('Nach Art gefiltert bleibt eine', fenster.nurKi, 1);
  pruef('Die Personen stehen zur Wahl',   fenster.namen.includes('Anna'), true);
  pruef('Nach Person gefiltert bleiben zwei', fenster.nurAnna, 2);
  pruef('Die Suche findet eine',          fenster.gesucht, 1);
  pruef('Nur mit Seite ist es anklickbar', fenster.klickbar, 1);
  pruef('Das Fenster passt',              fenster.passt, true);

  /* --- 14 · Ein Klick springt zur Seite -------------------------------------- */
  const sprung = await p.evaluate(async (x) => {
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    App.oeffne(Store.rootPages()[0].id);
    await new Promise(r => setTimeout(r, 350));
    Protokoll.leeren();
    Protokoll.notieren('seite-neu', 'Datenprobe', { seite: x.seite });
    Protokoll.dialog();
    await new Promise(r => setTimeout(r, 300));
    document.querySelector('.pr-zeile[data-seite]').click();
    await new Promise(r => setTimeout(r, 450));
    return { seite: App.aktuelleSeite(), zu: !document.querySelector('.overlay') };
  }, daten);
  pruef('Der Klick öffnet die Seite', sprung.seite, daten.seite);
  pruef('Und schliesst das Fenster',  sprung.zu, true);

  /* --- 15 · Überlebt den Neustart -------------------------------------------- */
  await p.evaluate(async () => {
    Protokoll.leeren();
    Protokoll.notieren('sonstiges', 'Vor dem Neustart');
    await new Promise(r => setTimeout(r, 1000));
    await Store.flush();
  });
  await p.reload();
  await p.waitForTimeout(2200);
  const nach = await p.evaluate(() => ({
    texte: Protokoll.alle().map(e => e.text),
    anzahl: Protokoll.alle().length
  }));
  pruef('Der alte Eintrag ist noch da',
        nach.texte.includes('Vor dem Neustart'), true);
  pruef('Und der Start ist dazugekommen',
        nach.texte.includes('Redion geöffnet'), true);

  /* --- 16 · In der Befehlspalette --------------------------------------------- */
  const palette = await p.evaluate(async () => {
    Werkzeuge.palette();
    await new Promise(r => setTimeout(r, 250));
    const inp = document.querySelector('#cq');
    inp.value = 'Protokoll';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const t = (document.querySelector('#cr button') || {}).textContent || '';
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    return t.includes('Protokoll');
  });
  pruef('In der Befehlspalette', palette, true);

  /* --- 17 · Am Telefon --------------------------------------------------------- */
  const handy = await b.newPage({ viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true });
  const fehler2 = [];
  handy.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await handy.goto('file://' + WURZEL + '/index.html');
  await handy.waitForTimeout(1900);
  const amHandy = await handy.evaluate(async () => {
    for (let i = 0; i < 20; i++)
      Protokoll.notieren('sonstiges', 'Ein etwas längerer Satz, Nummer ' + i);
    Protokoll.dialog();
    await new Promise(r => setTimeout(r, 350));
    const f = document.querySelector('.overlay .finder').getBoundingClientRect();
    const raus = f.right > innerWidth + 1 || f.left < -1;
    const ueberlauf = document.documentElement.scrollWidth - innerWidth;
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    return { raus, ueberlauf };
  });
  pruef('Auch am Telefon passt es', amHandy.raus, false);
  pruef('Nichts läuft seitlich raus', amHandy.ueberlauf <= 1, true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  const alleF = [...fehler, ...fehler2];
  console.log(alleF.length ? 'JS-Fehler:\n' + alleF.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || alleF.length ? 1 : 0);
})();
