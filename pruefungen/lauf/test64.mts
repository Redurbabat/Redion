/* Sechs neue Auslöser, 24 benannte Bedingungen und die Zeitzone im Zeitplan */
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

  /* --- Die Listen sind vollständig ------------------------------------- */
  const listen = await p.evaluate(() => ({
    ausloeser: Datenbank.AUSLOESER.length,
    aktionen:  Datenbank.AKTIONEN.length,
    bedingungen: Datenbank.BEDINGUNGEN.length,
    ohneDoppel: new Set(Datenbank.BEDINGUNGEN.map(x => x[0])).size,
    ausloeserOhneDoppel: new Set(Datenbank.AUSLOESER.map(x => x[0])).size,
    alleMitText: Datenbank.BEDINGUNGEN.every(x => x[1] && x[1].length > 5)
  }));
  pruef('Fünfzehn Auslöser',    listen.ausloeser, 15);
  pruef('Neunzehn Aktionen',    listen.aktionen, 19);
  pruef('Vierundzwanzig Bedingungen', listen.bedingungen, 24);
  pruef('Keine doppelten Bedingungen', listen.ohneDoppel, 24);
  pruef('Keine doppelten Auslöser',    listen.ausloeserOhneDoppel, 15);
  pruef('Jede Bedingung hat einen Satz', listen.alleMitText, true);

  /* --- Aufbau: eine Datenbank zum Spielen -------------------------------- */
  const auf = await p.evaluate(() => {
    const s = Store.addBlock(null, 'page', { text: 'Auslösertest' });
    const db = Store.addDatabase(s.id, 'Vorgänge', {
      title:  { name: 'Titel',  type: 'title' },
      st:     { name: 'Status', type: 'select', options: ['Offen', 'In Arbeit', 'Fertig'] },
      zahl:   { name: 'Zahl',   type: 'number' },
      notiz:  { name: 'Notiz',  type: 'text' },
      faellig:{ name: 'Fällig', type: 'date' },
      akten:  { name: 'Akten',  type: 'files' }
    });
    const c = Store.getCollection(db.collectionId);
    /* Eine Ansicht, die nur Fertiges zeigt */
    const fertig = Store.addView(c.id, 'table', 'Nur Fertig');
    if (!fertig) throw new Error('fertig ist nicht da — der Lauf misst sonst nichts.');
    Store.updateView(fertig.id, { limit: 0,
      filters: { operator: 'and', rules: [{ key: 'st', op: 'ist', wert: 'Fertig' }] } });
    const z = Store.addRow(c.id, { title: 'Erster Vorgang', st: 'Offen', zahl: 5 });
    return { seite: s.id, coll: c.id, ansicht: fertig.id, zeile: z.id, view: db.viewId };
  });

  /* --- 1 · Ansicht rein / raus ------------------------------------------ */
  const grenze = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [
      { id: 'r1', name: 'Rein', an: true,
        wenn: { art: 'ansicht-rein', ansicht: x.ansicht },
        dann: [{ art: 'setze-prop', key: 'notiz', wert: 'hereingekommen' }] },
      { id: 'r2', name: 'Raus', an: true,
        wenn: { art: 'ansicht-raus', ansicht: x.ansicht },
        dann: [{ art: 'setze-prop', key: 'notiz', wert: 'herausgefallen' }] }
    ];
    Store.updateCollection(c.id, { automationen: c.automationen });

    Store.setProp(x.zeile, 'st', 'Fertig');
    await new Promise(r => setTimeout(r, 500));
    const rein = Store.getBlock(x.zeile).props.notiz;

    Store.setProp(x.zeile, 'st', 'Offen');
    await new Promise(r => setTimeout(r, 500));
    const raus = Store.getBlock(x.zeile).props.notiz;

    /* Eine Änderung, die die Grenze nicht überschreitet, darf nichts tun */
    Store.setProp(x.zeile, 'notiz', 'unberührt');
    Store.setProp(x.zeile, 'zahl', 9);
    await new Promise(r => setTimeout(r, 500));
    const ruhig = Store.getBlock(x.zeile).props.notiz;
    return { rein, raus, ruhig };
  }, auf);
  pruef('Eintritt in die Ansicht löst aus',  grenze.rein, 'hereingekommen');
  pruef('Austritt löst das Gegenstück aus',  grenze.raus, 'herausgefallen');
  pruef('Ohne Grenzübertritt passiert nichts', grenze.ruhig, 'unberührt');

  /* --- 2 · Kommentar und Erwähnung -------------------------------------- */
  const komm = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [
      { id: 'k1', name: 'Kommentar', an: true, wenn: { art: 'kommentar-neu' },
        dann: [{ art: 'zaehler', key: 'zahl' }] },
      { id: 'k2', name: 'Erwähnung', an: true, wenn: { art: 'erwaehnung' },
        dann: [{ art: 'setze-prop', key: 'notiz', wert: 'jemand gemeint' }] }
    ];
    Store.updateCollection(c.id, { automationen: c.automationen });
    Store.setProp(x.zeile, 'zahl', 0);
    Store.setProp(x.zeile, 'notiz', '');
    await new Promise(r => setTimeout(r, 300));

    /* Ein schlichter Kommentar */
    Store.updateBlock(x.zeile, { kommentare: [
      { id: 'c1', text: 'Ohne alles', autor: 'Ich', zeit: Store.now() }] });
    await new Promise(r => setTimeout(r, 500));
    const nachEins = { zahl: Store.getBlock(x.zeile).props.zahl,
                       notiz: Store.getBlock(x.zeile).props.notiz };

    /* Und einer mit Erwähnung */
    Store.updateBlock(x.zeile, { kommentare: [
      { id: 'c1', text: 'Ohne alles', autor: 'Ich', zeit: Store.now() },
      { id: 'c2', text: 'Schau mal @Redur', autor: 'Ich', zeit: Store.now() }] });
    await new Promise(r => setTimeout(r, 500));
    const nachZwei = { zahl: Store.getBlock(x.zeile).props.zahl,
                       notiz: Store.getBlock(x.zeile).props.notiz };
    return { nachEins, nachZwei };
  }, auf);
  pruef('Kommentar zählt hoch',            komm.nachEins.zahl, 1);
  pruef('Ohne @ keine Erwähnung',          komm.nachEins.notiz, '');
  pruef('Zweiter Kommentar zählt weiter',  komm.nachZwei.zahl, 2);
  pruef('Mit @ greift die Erwähnung',      komm.nachZwei.notiz, 'jemand gemeint');

  /* --- 3 · Datei angehängt ---------------------------------------------- */
  const datei = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [{ id: 'd1', name: 'Datei', an: true,
      wenn: { art: 'datei-neu', key: 'akten' },
      dann: [{ art: 'setze-prop', key: 'notiz', wert: 'Akte da' }] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    Store.setProp(x.zeile, 'notiz', '');
    await new Promise(r => setTimeout(r, 250));
    Store.setProp(x.zeile, 'akten', [{ name: 'plan.pdf', url: 'data:,x' }]);
    await new Promise(r => setTimeout(r, 500));
    const drauf = Store.getBlock(x.zeile).props.notiz;
    /* Eine Datei wegnehmen darf nicht auslösen */
    Store.setProp(x.zeile, 'notiz', '');
    Store.setProp(x.zeile, 'akten', []);
    await new Promise(r => setTimeout(r, 500));
    return { drauf, weg: Store.getBlock(x.zeile).props.notiz };
  }, auf);
  pruef('Angehängte Datei löst aus', datei.drauf, 'Akte da');
  pruef('Entfernen löst nicht aus',  datei.weg, '');

  /* --- 4 · Aus dem Papierkorb zurück ------------------------------------ */
  const zurueck = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [{ id: 'z1', name: 'Zurück', an: true,
      wenn: { art: 'zeile-zurueck' },
      dann: [{ art: 'setze-prop', key: 'notiz', wert: 'wieder da' }] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    const z = Store.addRow(c.id, { title: 'Fällt weg', notiz: '' });
    await new Promise(r => setTimeout(r, 300));
    Store.trashBlock(z.id);
    await new Promise(r => setTimeout(r, 250));
    Store.restoreBlock(z.id);
    await new Promise(r => setTimeout(r, 500));
    return { notiz: Store.getBlock(z.id).props.notiz, lebt: Store.getBlock(z.id).alive };
  }, auf);
  pruef('Wiederherstellen löst aus', zurueck.notiz, 'wieder da');
  pruef('Und der Eintrag lebt',      zurueck.lebt, true);

  /* --- 5 · Die Bedingungen einzeln durchprüfen -------------------------- */
  const bed = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [];
    Store.updateCollection(c.id, { automationen: [] });
    const z = Store.getBlock(x.zeile);
    Store.setProp(z.id, 'zahl', 10);
    Store.setProp(z.id, 'notiz', 'Hallo Welt');
    Store.setProp(z.id, 'faellig', '2020-01-01');
    await new Promise(r => setTimeout(r, 300));
    const r = Store.getBlock(z.id);
    const t = (b: any, ctx?: any) => Datenbank.bedingungTrifft(b, r, c, ctx || {});
    const jetzt = new Date();
    const wt = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][jetzt.getDay()];
    return {
      wertLeer:      t({ art: 'wert-leer', key: 'akten' }),
      wertNichtLeer: t({ art: 'wert-leer', key: 'notiz' }),
      gefuellt:      t({ art: 'wert-gefuellt', key: 'notiz' }),
      warLeer:       t({ art: 'war-leer' }, { alterWert: '' }),
      warNichtLeer:  t({ art: 'war-leer' }, { alterWert: 'x' }),
      anders:        t({ art: 'wirklich-anders', key: 'notiz' }, { alterWert: 'anders' }),
      gleich:        t({ art: 'wirklich-anders', key: 'notiz' }, { alterWert: 'Hallo Welt' }),
      gewachsen:     t({ art: 'wert-gewachsen', key: 'zahl' }, { alterWert: 3 }),
      nichtGewachsen:t({ art: 'wert-gewachsen', key: 'zahl' }, { alterWert: 30 }),
      gefallen:      t({ art: 'wert-gefallen', key: 'zahl' }, { alterWert: 30 }),
      istGenau:      t({ art: 'wert-ist', key: 'notiz', wert: 'Hallo Welt' }),
      istNicht:      t({ art: 'wert-ist', key: 'notiz', wert: 'Etwas' }),
      enthaelt:      t({ art: 'wert-enthaelt', key: 'notiz', wert: 'hallo' }),
      groesser:      t({ art: 'wert-groesser', key: 'zahl', wert: 5 }),
      kleiner:       t({ art: 'wert-kleiner', key: 'zahl', wert: 5 }),
      jung:          t({ art: 'zeile-jung', wert: 2 }),
      alt:           t({ art: 'zeile-alt', wert: 2 }),
      gesperrt:      t({ art: 'zeile-gesperrt' }),
      inhalt:        t({ art: 'zeile-inhalt' }),
      kommentare:    t({ art: 'zeile-kommentare' }),
      archiviert:    t({ art: 'zeile-archiviert' }),
      formelWahr:    t({ art: 'formel-wahr', wert: 'prop("Zahl") > 5' }),
      formelFalsch:  t({ art: 'formel-wahr', wert: 'prop("Zahl") > 500' }),
      inAnsicht:     t({ art: 'in-ansicht', wert: x.ansicht }),
      werktag:       t({ art: 'heute-werktag' }),
      wochenende:    t({ art: 'heute-wochenende' }),
      wochentag:     t({ art: 'wochentag', wert: wt }),
      falscherTag:   t({ art: 'wochentag', wert: 'Nixtag' }),
      spanneWeit:    t({ art: 'uhrzeit-zwischen', von: '00:00', bis: '23:59' }),
      spanneEng:     t({ art: 'uhrzeit-zwischen', von: '03:00', bis: '03:01' }),
      vergangen:     t({ art: 'datum-vergangen', key: 'faellig' }),
      hoechstens:    t({ art: 'hoechstens', wert: 3 },
                       { automation: { verlauf: [{ wann: new Date().toISOString() }] } }),
      hoechstensVoll:t({ art: 'hoechstens', wert: 1 },
                       { automation: { verlauf: [{ wann: new Date().toISOString() }] } }),
      unbekannt:     t({ art: 'gibtesnicht' })
    };
  }, auf);
  pruef('wert-leer bei leerer Spalte',        bed.wertLeer, true);
  pruef('wert-leer bei gefüllter Spalte',     bed.wertNichtLeer, false);
  pruef('wert-gefuellt',                      bed.gefuellt, true);
  pruef('war-leer erkennt den alten Wert',    bed.warLeer, true);
  pruef('war-leer bei altem Inhalt',          bed.warNichtLeer, false);
  pruef('wirklich-anders bei echter Änderung', bed.anders, true);
  pruef('wirklich-anders bei gleichem Wert',  bed.gleich, false);
  pruef('wert-gewachsen',                     bed.gewachsen, true);
  pruef('wert-gewachsen bei kleinerem Wert',  bed.nichtGewachsen, false);
  pruef('wert-gefallen',                      bed.gefallen, true);
  pruef('wert-ist genau',                     bed.istGenau, true);
  pruef('wert-ist bei anderem Wert',          bed.istNicht, false);
  pruef('wert-enthaelt achtet nicht auf Gross/Klein', bed.enthaelt, true);
  pruef('wert-groesser',                      bed.groesser, true);
  pruef('wert-kleiner bei grösserem Wert',    bed.kleiner, false);
  pruef('zeile-jung bei frischer Zeile',      bed.jung, true);
  pruef('zeile-alt bei frischer Zeile',       bed.alt, false);
  pruef('zeile-gesperrt bei offener Zeile',   bed.gesperrt, false);
  pruef('zeile-inhalt bei leerer Seite',      bed.inhalt, false);
  pruef('zeile-kommentare findet die zwei',   bed.kommentare, true);
  pruef('zeile-archiviert bei aktiver Zeile', bed.archiviert, false);
  pruef('formel-wahr rechnet',                bed.formelWahr, true);
  pruef('formel-wahr bei falscher Aussage',   bed.formelFalsch, false);
  pruef('in-ansicht bei Zeile ausserhalb',    bed.inAnsicht, false);
  pruef('Werktag und Wochenende schliessen sich aus',
        bed.werktag !== bed.wochenende, true);
  pruef('wochentag trifft heute',             bed.wochentag, true);
  pruef('wochentag bei Unsinn',               bed.falscherTag, false);
  pruef('uhrzeit-zwischen über den ganzen Tag', bed.spanneWeit, true);
  pruef('datum-vergangen bei 2020',           bed.vergangen, true);
  pruef('hoechstens 3 bei einem Lauf',        bed.hoechstens, true);
  pruef('hoechstens 1 bei einem Lauf',        bed.hoechstensVoll, false);
  pruef('Unbekannte Bedingung blockiert nicht', bed.unbekannt, true);

  /* --- 6 · Bedingungen wirken in einer echten Automation ---------------- */
  const echt = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [{ id: 'b1', name: 'Nur beim ersten Mal', an: true,
      wenn: { art: 'prop-geaendert', key: 'st' },
      bedingungen: [{ art: 'war-leer', key: 'st' }],
      dann: [{ art: 'setze-prop', key: 'notiz', wert: 'zum ersten Mal gesetzt' }] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    const z = Store.addRow(c.id, { title: 'Frisch', notiz: '' });
    await new Promise(r => setTimeout(r, 300));
    Store.setProp(z.id, 'st', 'Offen');            /* vorher leer → greift */
    await new Promise(r => setTimeout(r, 500));
    const erst = Store.getBlock(z.id).props.notiz;
    Store.setProp(z.id, 'notiz', '');
    await new Promise(r => setTimeout(r, 250));
    Store.setProp(z.id, 'st', 'Fertig');           /* vorher gefüllt → nicht */
    await new Promise(r => setTimeout(r, 500));
    return { erst, zweit: Store.getBlock(z.id).props.notiz };
  }, auf);
  pruef('Bedingung „war leer" lässt den ersten Lauf durch', echt.erst, 'zum ersten Mal gesetzt');
  pruef('Und hält den zweiten auf',                         echt.zweit, '');

  /* --- 7 · Zeitzonen ----------------------------------------------------- */
  const zonen = await p.evaluate(() => {
    /* 2026-08-02, 23:30 UTC → in Tokio schon der 3. August, 08:30 */
    const t = new Date(Date.UTC(2026, 7, 2, 23, 30));
    const tokio  = Datenbank.inZone(t, 'Asia/Tokyo');
    const nyc    = Datenbank.inZone(t, 'America/New_York');
    const utc    = Datenbank.inZone(t, 'UTC');
    /* Sommerzeit: im Januar ist Zürich UTC+1, im Juli UTC+2 */
    const winter = Datenbank.inZone(new Date(Date.UTC(2026, 0, 15, 12, 0)), 'Europe/Zurich');
    const sommer = Datenbank.inZone(new Date(Date.UTC(2026, 6, 15, 12, 0)), 'Europe/Zurich');
    return {
      tokioTag: tokio.getDate(), tokioStunde: tokio.getHours(),
      nycTag: nyc.getDate(),     nycStunde: nyc.getHours(),
      utcStunde: utc.getHours(),
      winterStunde: winter.getHours(), sommerStunde: sommer.getHours(),
      unbekannt: Datenbank.inZone(t, 'Gibt/EsNicht').getTime() === t.getTime(),
      zonenListe: Datenbank.ZONEN().length > 10,
      eigene: typeof Datenbank.eigeneZone() === 'string'
    };
  });
  pruef('Tokio ist schon der nächste Tag', zonen.tokioTag, 3);
  pruef('Und zwar 08:30 Uhr',              zonen.tokioStunde, 8);
  pruef('New York ist noch der Vortag',    zonen.nycTag, 2);
  pruef('Dort ist es 19 Uhr',              zonen.nycStunde, 19);
  pruef('UTC bleibt 23 Uhr',               zonen.utcStunde, 23);
  pruef('Zürich im Winter: 13 Uhr',        zonen.winterStunde, 13);
  pruef('Zürich im Sommer: 14 Uhr',        zonen.sommerStunde, 14);
  pruef('Unbekannte Zone fällt auf die Gerätezeit zurück', zonen.unbekannt, true);
  pruef('Es gibt eine Zonenliste',         zonen.zonenListe, true);
  pruef('Und die eigene Zone ist bekannt', zonen.eigene, true);

  /* Die Taktmarke rechnet in der gewählten Zone */
  const marken = await p.evaluate(() => {
    /* 22:00 UTC am 2. August, fällig ist täglich um 20:00.
       Tokio: dort ist es der 3. um 07:00 — vor 20:00, also zählt der 2.
       New York: dort ist es der 2. um 18:00 — vor 20:00, also zählt der 1.
       UTC: 22:00 ist nach 20:00, also zählt der 2. */
    const t = new Date(Date.UTC(2026, 7, 2, 22, 0));
    return {
      tokio:  Datenbank.taktMarke('taeglich', '20:00', t, 'Asia/Tokyo'),
      nyc:    Datenbank.taktMarke('taeglich', '20:00', t, 'America/New_York'),
      utc:    Datenbank.taktMarke('taeglich', '20:00', t, 'UTC'),
      stunde: Datenbank.taktMarke('stuendlich', '', t, 'Asia/Tokyo'),
      /* Am Wochenende gibt es keine Werktagsmarke */
      wochenende: Datenbank.taktMarke('werktags', '09:00',
                    new Date(Date.UTC(2026, 7, 1, 12, 0)), 'UTC')
    };
  });
  pruef('Tokio-Marke ist der 2. August',   marken.tokio, '2026-08-02');
  pruef('New York ist noch beim 1.',       marken.nyc, '2026-08-01');
  pruef('UTC-Marke ist der 2.',            marken.utc, '2026-08-02');
  pruef('Stundenmarke trägt die Ortsstunde', marken.stunde, '2026-08-03T07');
  pruef('Samstag hat keine Werktagsmarke', marken.wochenende, null);

  /* Eine wiederkehrende Automation mit Zone läuft genau einmal je Takt.
     ---------------------------------------------------------------------
     HIER STAND EINE FLOCKE, die genau einmal pro Stunde zuschlug: der Takt
     ist `stuendlich`, die Marke also `JJJJ-MM-TTThh`. Fiel der Stundenwechsel
     zwischen die beiden Aufrufe, war die Marke eine andere — die Automation
     lief zu Recht ein zweites Mal, und die Prüfung meldete einen Fehler, den
     es nicht gab. Ein Lauf um 12:59:59 war rot, derselbe Lauf um 12:30 grün.

     Geprüft wird jetzt die Regel selbst: **ein Lauf je Marke.** Wechselt die
     Marke unterwegs, sind zwei Läufe richtig — und die Prüfung sagt das,
     statt zu scheitern. */
  const wdh = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [{ id: 'w1', name: 'Jeden Tag', an: true,
      wenn: { art: 'wiederkehrend', takt: 'stuendlich', uhr: '00:00', zone: 'UTC' },
      dann: [{ art: 'zaehler', key: 'zahl' }] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    Store.rowsOf(c.id).forEach(z => Store.setProp(z.id, 'zahl', 0));
    await new Promise(r => setTimeout(r, 400));
    const markeVorher = Datenbank.taktMarke('stuendlich', '00:00', new Date(), 'UTC');
    Datenbank.wiederkehrendeAutomationen();
    await new Promise(r => setTimeout(r, 500));
    const nach1 = Store.rowsOf(c.id)[0].props.zahl;
    Datenbank.wiederkehrendeAutomationen();      /* derselbe Takt — nichts */
    await new Promise(r => setTimeout(r, 400));
    const nach2 = Store.rowsOf(c.id)[0].props.zahl;
    const markeNachher = Datenbank.taktMarke('stuendlich', '00:00', new Date(), 'UTC');
    const marke = Store.getCollection(c.id).automationen[0].zuletzt;
    return { nach1, nach2, marke, mitZone: /@UTC$/.test(marke || ''),
             stundeGewechselt: markeVorher !== markeNachher };
  }, auf);
  pruef('Wiederkehrend läuft einmal',    wdh.nach1, 1);
  pruef('Und im selben Takt kein zweites Mal', wdh.nach2,
        wdh.stundeGewechselt ? 2 : 1);
  pruef('Die Marke trägt die Zone',      wdh.mitZone, true);

  /* --- 8 · Der Dialog zeigt alles Neue ---------------------------------- */
  const dialog = await p.evaluate(async (x) => {
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    const c = Store.getCollection(x.coll);
    const v = Store.getView(x.view);
    const blk = Object.values(Store.cache.blocks)
      .find(y => y.type === 'database' && y.collectionId === c.id);
    Datenbank.automationenMenue(document.body, c, v, blk);
    await new Promise(r => setTimeout(r, 300));
    document?.querySelector<HTMLElement>('[data-a="neu"]')?.click();
    await new Promise(r => setTimeout(r, 350));
    const aw  = document.querySelector<HTMLSelectElement>('#aw');
    if (!aw) throw new Error('#aw ist nicht da — der Lauf misst sonst nichts.');
    const opt = [...aw.options].map(o => o.value);
    /* Wiederkehrend zeigt die Zeitzone */
    aw.value = 'wiederkehrend';
    aw.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 150));
    const zoneDa = !!document.querySelector('#azz') &&
                   document.querySelector<HTMLElement>('#azp')?.style.display !== 'none';
    const zonenAnzahl = document.querySelector<HTMLSelectElement>('#azz')?.options.length;
    /* Ansicht-rein zeigt die Ansichtsauswahl */
    aw.value = 'ansicht-rein';
    aw.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 150));
    const ansichtDa = document.querySelector<HTMLElement>('#aavl')?.style.display !== 'none';
    /* Die Bedingungsliste ist da und gruppiert */
    const bs = document.querySelector<HTMLInputElement>('#abda');
    if (!bs) throw new Error('#abda ist nicht da — der Lauf misst sonst nichts.');
    const gruppen = bs.querySelectorAll('optgroup').length;
    const anzahl = bs.querySelectorAll('option').length;
    /* Eine benannte Bedingung wählen und die Felder prüfen */
    bs.value = 'uhrzeit-zwischen';
    bs.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(r => setTimeout(r, 150));
    const zeitFelder = document.querySelector<HTMLElement>('#abdz1')?.style.display !== 'none' &&
                       document.querySelector<HTMLElement>('#abdw')?.style.display === 'none';
    document?.querySelector<HTMLElement>('[data-a="bedingung"]')?.click();
    await new Promise(r => setTimeout(r, 150));
    const liste = document.querySelector<HTMLElement>('#abdl')?.textContent;
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return { opt, zoneDa, zonenAnzahl, ansichtDa, gruppen, anzahl, zeitFelder, liste };
  }, auf);
  pruef('Alle 15 Auslöser im Dialog',      dialog.opt.length, 15);
  pruef('Ansicht-rein ist dabei',          (dialog.opt ?? '').includes('ansicht-rein'), true);
  pruef('Zeitzone erscheint beim Zeitplan', dialog.zoneDa, true);
  pruef('Mit einer echten Zonenliste',     Number(dialog.zonenAnzahl ?? -1) > 10, true);
  pruef('Ansichtsauswahl erscheint',       dialog.ansichtDa, true);
  pruef('Bedingungen in drei Gruppen',     dialog.gruppen, 3);
  pruef('24 Bedingungen plus Filterregel', dialog.anzahl, 25);
  pruef('Die Zeitspanne zeigt zwei Uhren', dialog.zeitFelder, true);
  pruef('Die gewählte Bedingung steht als Satz da',
        dialog.liste?.includes('zwischen'), true);

  /* --- 9 · Die KI kennt die neuen Bausteine ------------------------------ */
  const ki = await p.evaluate((x) => {
    const c = Store.getCollection(x.coll);
    return {
      guteBedingung: KiBau.pruefeAutomation({
        name: 'Test', wenn: { art: 'ansicht-rein', ansicht: x.ansicht },
        bedingungen: [{ art: 'war-leer', key: 'st' }],
        dann: [{ art: 'setze-prop', key: 'notiz', wert: 'x' }] }, c),
      schlechteBedingung: KiBau.pruefeAutomation({
        name: 'Test', wenn: { art: 'zeile-neu' },
        bedingungen: [{ art: 'ausgedacht' }],
        dann: [{ art: 'melden', text: 'x' }] }, c),
      text: Datenbank.bedingungText({ art: 'zeile-alt', wert: 7 })
    };
  }, auf);
  pruef('Neue Auslöser und Bedingungen gehen durch', ki.guteBedingung, []);
  pruef('Erfundene Bedingung wird gemeldet',
        ki.schlechteBedingung.some((x: any) => (x ?? '').includes('ausgedacht')), true);
  pruef('Bedingungstext setzt die Zahl ein', ki.text, 'Der Eintrag ist älter als 7 Tage');

  /* --- 10 · Alte Automationen laufen unverändert weiter ------------------ */
  const alt = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [{ id: 'a1', name: 'Alte Art', an: true,
      wenn: { art: 'prop-wert', key: 'st', wert: 'Fertig' },
      bedingungen: [{ key: 'zahl', op: 'größer als', wert: 3 }],   /* Filterregel */
      dann: [{ art: 'setze-prop', key: 'notiz', wert: 'alt greift' }] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    const z = Store.addRow(c.id, { title: 'Altmodisch', zahl: 10, notiz: '' });
    await new Promise(r => setTimeout(r, 300));
    Store.setProp(z.id, 'st', 'Fertig');
    await new Promise(r => setTimeout(r, 500));
    const mit = Store.getBlock(z.id).props.notiz;
    const z2 = Store.addRow(c.id, { title: 'Zu klein', zahl: 1, notiz: '' });
    await new Promise(r => setTimeout(r, 250));
    Store.setProp(z2.id, 'st', 'Fertig');
    await new Promise(r => setTimeout(r, 500));
    return { mit, ohne: Store.getBlock(z2.id).props.notiz };
  }, auf);
  pruef('Alte Filterregel greift weiter', alt.mit, 'alt greift');
  pruef('Und hält auf, was sie soll',     alt.ohne, '');

  /* --- 11 · Nach dem Neustart ist alles noch da -------------------------- */
  await p.evaluate(() => Store.flush());
  await p.reload();
  await p.waitForTimeout(2000);
  const nach = await p.evaluate((x) => {
    const c = Store.getCollection(x.coll);
    return { auto: (c.automationen || []).length,
             bedingung: (c.automationen[0].bedingungen || [])[0],
             gezeichnet: !!document.getElementById('page')?.textContent };
  }, auf);
  pruef('Automationen überleben den Neustart', nach.auto, 1);
  pruef('Samt Bedingung',                      nach.bedingung.op, 'größer als');
  pruef('Und die Seite steht',                 nach.gezeichnet, true);

  /* --- 12 · Am Telefon --------------------------------------------------- */
  const handy = await b.newPage({ viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true });
  const fehler2: any[] = [];
  handy.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await handy.goto('file://' + WURZEL + '/index.html');
  await handy.waitForTimeout(1800);
  const amHandy = await handy.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Handy' });
    const db = Store.addDatabase(s.id, 'Klein', { title: { name: 'T', type: 'title' } });
    const c = Store.getCollection(db.collectionId);
    const blk = Object.values(Store.cache.blocks)
      .find(y => y.type === 'database' && y.collectionId === c.id);
    Datenbank.automationenMenue(document.body, c, Store.getView(db.viewId), blk);
    await new Promise(r => setTimeout(r, 300));
    document?.querySelector<HTMLElement>('[data-a="neu"]')?.click();
    await new Promise(r => setTimeout(r, 350));
    const f = (document.querySelector('.overlay .finder') ?? document.body).getBoundingClientRect();
    const raus = f.right > innerWidth + 1 || f.left < -1;
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return raus;
  });
  pruef('Der Automationsdialog passt aufs Telefon', amHandy, false);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  const alle = [...fehler, ...fehler2];
  console.log(alle.length ? 'JS-Fehler:\n' + alle.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || alle.length ? 1 : 0);
})();
