/* KI baut: Vorschlagsdialog, Vergleich, Prüfung von Formel, Automation, Filter.
   Die KI selbst wird ersetzt — geprüft wird, was Redion daraus macht. */
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
  await p.waitForTimeout(1400);

  /* --- Antwort auspacken ------------------------------------------------ */
  const packen = await p.evaluate(() => ({
    zaun:   KiBau.ohneZaun('Hier bitte:\n```js\nprop("A") + 1\n```'),
    json1:  KiBau.jsonAus('```json\n{"a":1}\n```'),
    json2:  KiBau.jsonAus('Klar! {"name":"x","dann":[{"art":"melden"}]} — passt das?'),
    json3:  KiBau.jsonAus('gar kein json'),
    text:   KiBau.jsonAus('{"t":"ein } in Anführungszeichen","n":2}')
  }));
  pruef('Zäune werden entfernt',        packen.zaun, 'prop("A") + 1');
  pruef('JSON mit Zaun gelesen',        packen.json1, { a: 1 });
  pruef('JSON aus Fliesstext gefischt', packen.json2.name, 'x');
  pruef('Kein JSON gibt null',          packen.json3, null);
  pruef('Klammer im Text stört nicht',  packen.text.n, 2);

  /* --- Zeilenvergleich -------------------------------------------------- */
  const diff = await p.evaluate(() =>
    KiBau.zeilenDiff('eins\nzwei\ndrei', 'eins\nZWEI\ndrei'));
  pruef('Vergleich: erste Zeile gleich', diff[0][0], 'gleich');
  pruef('Vergleich findet eine Änderung',
        diff.filter(d => d[0] !== 'gleich').map(d => d[1]).sort(), ['ZWEI', 'zwei']);

  /* --- Testdaten -------------------------------------------------------- */
  const bau = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'KI-Test' });
    const db = Store.addDatabase(s.id, 'Aufgaben', {
      title:  { name: 'Aufgabe', type: 'title' },
      faellig:{ name: 'Fällig',  type: 'date' },
      status: { name: 'Status',  type: 'select',
                options: [{ name: 'Offen', color: 'gray' }, { name: 'Fertig', color: 'green' }] },
      punkte: { name: 'Punkte',  type: 'number' }
    });
    const c = Store.getCollection(db.collectionId);
    Store.addRow(c.id, { title: 'Erste',  faellig: '2026-08-10', status: 'Offen',  punkte: 3 });
    Store.addRow(c.id, { title: 'Zweite', faellig: '2026-07-01', status: 'Fertig', punkte: 8 });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 400));
    return { coll: c.id, view: db.viewId };
  });

  /* --- Automation prüfen ------------------------------------------------ */
  const autoPruef = await p.evaluate((cid) => {
    const c = Store.getCollection(cid);
    return {
      gut: KiBau.pruefeAutomation({
        name: 'Abschluss', wenn: { art: 'prop-wert', key: 'status', wert: 'Fertig' },
        dann: [{ art: 'setze-prop', key: 'faellig', wert: 'heute' }] }, c),
      falscherAusloeser: KiBau.pruefeAutomation({
        wenn: { art: 'gibt-es-nicht' }, dann: [{ art: 'melden', text: 'hi' }] }, c),
      falscheSpalte: KiBau.pruefeAutomation({
        wenn: { art: 'prop-wert', key: 'quatsch' },
        dann: [{ art: 'setze-prop', key: 'status', wert: 'x' }] }, c),
      ohneAktion: KiBau.pruefeAutomation({ wenn: { art: 'zeile-neu' }, dann: [] }, c),
      kaputt: KiBau.pruefeAutomation(null, c),
      worte: KiBau.automationInWorten({
        name: 'Abschluss', wenn: { art: 'prop-wert', key: 'status', wert: 'Fertig' },
        dann: [{ art: 'setze-prop', key: 'faellig', wert: 'heute' }] }, c)
    };
  }, bau.coll);
  pruef('Gute Automation ohne Beanstandung', autoPruef.gut, []);
  pruef('Erfundener Auslöser wird bemängelt',
        autoPruef.falscherAusloeser.some((x: any) => (x ?? '').includes('gibt-es-nicht')), true);
  pruef('Erfundene Spalte wird bemängelt',
        autoPruef.falscheSpalte.some((x: any) => (x ?? '').includes('quatsch')), true);
  pruef('Automation ohne Aktion wird bemängelt',
        autoPruef.ohneAktion.some((x: any) => (x ?? '').includes('dann')), true);
  pruef('Kaputte Antwort wird abgefangen', autoPruef.kaputt.length, 1);
  pruef('Automation in Worten nennt die Spaltennamen',
        (autoPruef.worte ?? '').includes('Status') && (autoPruef.worte ?? '').includes('Fällig'), true);

  /* --- Filter prüfen ---------------------------------------------------- */
  const filterPruef = await p.evaluate((cid) => {
    const c = Store.getCollection(cid);
    return {
      gut: KiBau.pruefeFilter({ operator: 'and',
        rules: [{ key: 'status', op: 'ist', wert: 'Offen' }] }, c),
      falscherOp: KiBau.pruefeFilter({ operator: 'and',
        rules: [{ key: 'punkte', op: 'beginnt mit', wert: '3' }] }, c),
      falscheSpalte: KiBau.pruefeFilter({ operator: 'and',
        rules: [{ key: 'nixda', op: 'ist', wert: 'x' }] }, c),
      gruppe: KiBau.pruefeFilter({ operator: 'and', rules: [
        { operator: 'or', rules: [{ key: 'status', op: 'ist', wert: 'Offen' },
                                  { key: 'punkte', op: 'größer als', wert: '5' }] } ] }, c),
      worte: KiBau.filterInWorten({ operator: 'and', rules: [
        { key: 'status', op: 'ist', wert: 'Offen' },
        { key: 'punkte', op: 'größer als', wert: '5' } ] }, c)
    };
  }, bau.coll);
  pruef('Guter Filter ohne Beanstandung',  filterPruef.gut, []);
  pruef('Falsche Bedingung wird bemängelt',
        filterPruef.falscherOp.some((x: any) => (x ?? '').includes('beginnt mit')), true);
  pruef('Unbekannte Spalte wird bemängelt',
        filterPruef.falscheSpalte.some((x: any) => (x ?? '').includes('nixda')), true);
  pruef('Verschachtelte Gruppe geht durch', filterPruef.gruppe, []);
  pruef('Filter in Worten mit UND',         (filterPruef.worte ?? '').includes('UND'), true);

  /* --- Vorschlagsdialog: Übernehmen und Verwerfen ----------------------- */
  const dialog = await p.evaluate(async () => {
    let genommen = null;
    KiBau.vorschlag({
      titel: 'Probe', alt: 'alt()', neu: 'neu()',
      probe: 'Ergebnis: <b>42</b>', inOrdnung: true,
      uebernehmen: () => { genommen = 'ja'; },
      nochmal: () => {}
    });
    await new Promise(r => setTimeout(r, 200));
    const da = {
      offen:  !!document.querySelector('.kb-diff'),
      weg:    [...document.querySelectorAll<HTMLElement>('.kb-weg code')].map(x => x.textContent),
      neu:    [...document.querySelectorAll<HTMLElement>('.kb-neu code')].map(x => x.textContent),
      probeGut: !!document.querySelector('.kb-probe.gut'),
      knopfAn: !document.querySelector<HTMLInputElement>('[data-a="ok"]')?.disabled
    };
    document?.querySelector<HTMLElement>('[data-a="ok"]')?.click();
    await new Promise(r => setTimeout(r, 150));
    return { ...da, genommen, zu: !document.querySelector('.kb-diff') };
  });
  pruef('Dialog zeigt den Vergleich', dialog.offen, true);
  pruef('Alte Zeile rot markiert',    dialog.weg, ['alt()']);
  pruef('Neue Zeile grün markiert',   dialog.neu, ['neu()']);
  pruef('Probe grün',                 dialog.probeGut, true);
  pruef('Übernehmen ist anklickbar',  dialog.knopfAn, true);
  pruef('Übernehmen wurde ausgeführt',dialog.genommen, 'ja');
  pruef('Dialog schliesst danach',    dialog.zu, true);

  /* Bei einer schlechten Probe bleibt Übernehmen gesperrt */
  const gesperrt = await p.evaluate(async () => {
    let genommen = null;
    KiBau.vorschlag({ titel: 'Kaputt', alt: '', neu: 'quatsch(', probe: '⛔ geht nicht',
                      inOrdnung: false, uebernehmen: () => { genommen = 'ja'; } });
    await new Promise(r => setTimeout(r, 200));
    const knopf = document.querySelector<HTMLInputElement>('[data-a="ok"]');
    if (!knopf) throw new Error('[data-a="ok"] ist nicht da — der Lauf misst sonst nichts.');
    const gesp = knopf.disabled;
    knopf.click();
    await new Promise(r => setTimeout(r, 150));
    const nochOffen = !!document.querySelector('.kb-diff');
    document?.querySelector<HTMLElement>('[data-a="zu"]')?.click();
    return { gesp, genommen, nochOffen };
  });
  pruef('Übernehmen ist gesperrt',      gesperrt.gesp, true);
  pruef('Klick bewirkt nichts',         gesperrt.genommen, null);
  pruef('Dialog bleibt offen',          gesperrt.nochOffen, true);

  /* --- Ohne KI wird nichts geschrieben ---------------------------------- */
  const ohneKi = await p.evaluate(async (cid) => {
    const c = Store.getCollection(cid);
    const vorher = (c.automationen || []).length;
    await KiBau.automationSchreiben(c);
    await new Promise(r => setTimeout(r, 250));
    return { kiDa: KiBau.kiDa(), nachher: (Store.getCollection(cid).automationen || []).length, vorher };
  }, bau.coll);
  pruef('Ohne KI meldet sich kiDa als false', ohneKi.kiDa, false);
  pruef('Ohne KI wird nichts angelegt', ohneKi.nachher, ohneKi.vorher);

  /* --- Der ganze Weg mit vorgetäuschter KI ------------------------------ */
  const lauf = await p.evaluate(async (cid) => {
    const c = Store.getCollection(cid);
    const echt = KI.frageKurz;
    KI.frageKurz = async () => '```\ndateBetween(prop("Fällig"), today(), "days")\n```';
    KI.zustand.bereit = true;
    let uebernommen = null;
    await KiBau.formelLauf(c, 'x', '', 'Tage bis fällig', (f: any) => { uebernommen = f; });
    await new Promise(r => setTimeout(r, 250));
    const sicht = {
      probe:  (document.querySelector('.kb-probe') || {}).textContent,
      gut:    !!document.querySelector('.kb-probe.gut'),
      neu:    [...document.querySelectorAll<HTMLElement>('.kb-neu code')].map(x => x.textContent)
    };
    document?.querySelector<HTMLElement>('[data-a="ok"]')?.click();
    await new Promise(r => setTimeout(r, 150));
    KI.frageKurz = echt; KI.zustand.bereit = false;
    return { ...sicht, uebernommen };
  }, bau.coll);
  pruef('Formel wurde ausgepackt', lauf.neu, ['dateBetween(prop("Fällig"), today(), "days")']);
  pruef('Probe rechnete durch',    lauf.gut, true);
  pruef('Probe nennt die Zeile',   lauf.probe?.includes('Erste'), true);
  pruef('Formel übernommen',       lauf.uebernommen, 'dateBetween(prop("Fällig"), today(), "days")');

  /* Kaputte Formel von der KI wird nicht übernommen */
  const kaputt = await p.evaluate(async (cid) => {
    const c = Store.getCollection(cid);
    const echt = KI.frageKurz;
    KI.frageKurz = async () => 'prop("Fällig" + ';
    KI.zustand.bereit = true;
    let uebernommen = null;
    await KiBau.formelLauf(c, 'x', '', 'quatsch', (f: any) => { uebernommen = f; });
    await new Promise(r => setTimeout(r, 250));
    const gesp = document.querySelector<HTMLInputElement>('[data-a="ok"]')?.disabled;
    const schlecht = !!document.querySelector('.kb-probe.schlecht');
    document?.querySelector<HTMLElement>('[data-a="zu"]')?.click();
    KI.frageKurz = echt; KI.zustand.bereit = false;
    return { gesp, schlecht, uebernommen };
  }, bau.coll);
  pruef('Kaputte Formel: Probe rot',      kaputt.schlecht, true);
  pruef('Kaputte Formel: gesperrt',       kaputt.gesp, true);
  pruef('Kaputte Formel: nichts übernommen', kaputt.uebernommen, null);

  /* Automation über die KI, mit Prüfung und Anlegen */
  const autoLauf = await p.evaluate(async (cid) => {
    const c = Store.getCollection(cid);
    const echt = KI.frageKurz;
    KI.frageKurz = async () => JSON.stringify({
      name: 'Fertig stempeln',
      wenn: { art: 'prop-wert', key: 'status', wert: 'Fertig' },
      dann: [{ art: 'setze-prop', key: 'faellig', wert: 'heute' }] });
    KI.zustand.bereit = true;
    await KiBau.automationLauf(c, 'Wenn fertig, Datum auf heute');
    await new Promise(r => setTimeout(r, 250));
    const gut = !!document.querySelector('.kb-probe.gut');
    document?.querySelector<HTMLElement>('[data-a="ok"]')?.click();
    await new Promise(r => setTimeout(r, 250));
    KI.frageKurz = echt; KI.zustand.bereit = false;
    const a = (Store.getCollection(cid).automationen || [])[0];
    return { gut, name: a && a.name, an: a && a.an, aktion: a && a.dann[0].art };
  }, bau.coll);
  pruef('Automation: Probe grün',       autoLauf.gut, true);
  pruef('Automation angelegt',          autoLauf.name, 'Fertig stempeln');
  pruef('Automation ist noch aus',      autoLauf.an, false);
  pruef('Aktion richtig übernommen',    autoLauf.aktion, 'setze-prop');

  /* Filter über die KI */
  const filterLauf = await p.evaluate(async (bau2) => {
    const c = Store.getCollection(bau2.coll);
    const v = Store.getView(bau2.view);
    const echt = KI.frageKurz;
    KI.frageKurz = async () => JSON.stringify({ operator: 'and',
      rules: [{ key: 'status', op: 'ist', wert: 'Offen' }] });
    KI.zustand.bereit = true;
    await KiBau.filterLauf(c, v, 'nur offene');
    await new Promise(r => setTimeout(r, 250));
    const probe = (document.querySelector('.kb-probe') || {}).textContent;
    document?.querySelector<HTMLElement>('[data-a="ok"]')?.click();
    await new Promise(r => setTimeout(r, 300));
    KI.frageKurz = echt; KI.zustand.bereit = false;
    return { probe, regeln: Store.getView(bau2.view).filters.rules.length,
             zeilen: document.querySelectorAll('tbody tr[data-rid]').length };
  }, bau);
  pruef('Filter: Probe zählt die Treffer', filterLauf.probe?.includes('1 von 2'), true);
  pruef('Filter übernommen',               filterLauf.regeln, 1);
  pruef('Tabelle zeigt nur noch eine Zeile', filterLauf.zeilen, 1);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
