/* Statusübergänge in den Prüfregeln */
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

  const bau = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Übergänge' });
    const db = Store.addDatabase(s.id, 'Anträge', {
      title:  { name: 'Antrag', type: 'title' },
      status: { name: 'Stand',  type: 'status', options: [
        { name: 'Entwurf',    color: 'gray' },
        { name: 'Eingereicht',color: 'blue' },
        { name: 'Genehmigt',  color: 'green' },
        { name: 'Abgelehnt',  color: 'red' } ] }
    });
    const c = Store.getCollection(db.collectionId);
    /* Erlaubt: Entwurf → Eingereicht; Eingereicht → Genehmigt oder Abgelehnt.
       Nicht erlaubt: Entwurf → Genehmigt (man kann sich nicht selbst genehmigen). */
    c.schema.status.uebergaenge = {
      'Entwurf':     ['Eingereicht'],
      'Eingereicht': ['Genehmigt', 'Abgelehnt']
    };
    Store.updateCollection(c.id, { schema: c.schema });
    const z = Store.addRow(c.id, { title: 'Urlaub', status: 'Entwurf' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 450));
    return { coll: c.id, zeile: z.id, seite: s.id };
  });

  const regeln = await p.evaluate((x) => {
    const c = Store.getCollection(x.coll);
    return { hatRegeln: Datenbank.hatRegeln(c.schema.status) };
  }, bau);
  pruef('Übergänge zählen als Regel', regeln.hatRegeln, true);

  /* Erlaubter Schritt */
  const gut1 = await p.evaluate(async (x) => {
    Store.setProp(x.zeile, 'status', 'Eingereicht');
    await new Promise(r => setTimeout(r, 150));
    return Store.getBlock(x.zeile).props.status;
  }, bau);
  pruef('Entwurf → Eingereicht geht durch', gut1, 'Eingereicht');

  /* Erlaubter zweiter Schritt */
  const gut2 = await p.evaluate(async (x) => {
    Store.setProp(x.zeile, 'status', 'Genehmigt');
    await new Promise(r => setTimeout(r, 150));
    return Store.getBlock(x.zeile).props.status;
  }, bau);
  pruef('Eingereicht → Genehmigt geht durch', gut2, 'Genehmigt');

  /* Verbotener Sprung */
  const schlecht = await p.evaluate(async (x) => {
    Store.setProp(x.zeile, 'status', 'Entwurf');   /* zurück auf Anfang */
    await new Promise(r => setTimeout(r, 120));
    const zwischen = Store.getBlock(x.zeile).props.status;
    Store.setProp(x.zeile, 'status', 'Genehmigt'); /* verboten */
    await new Promise(r => setTimeout(r, 150));
    return { zwischen, danach: Store.getBlock(x.zeile).props.status };
  }, bau);
  pruef('Genehmigt → Entwurf ist frei (kein Eintrag = alles erlaubt)',
        schlecht.zwischen, 'Entwurf');
  pruef('Entwurf → Genehmigt wird abgelehnt', schlecht.danach, 'Entwurf');

  /* Die Meldung erklärt, was erlaubt wäre */
  const meldung = await p.evaluate((x) => {
    const c = Store.getCollection(x.coll);
    const z = Store.getBlock(x.zeile);
    return Datenbank.pruefeWert(c, 'status', z, 'Genehmigt').fehler;
  }, bau);
  pruef('Meldung nennt den erlaubten Weg', (meldung ?? '').includes('Eingereicht'), true);
  pruef('Meldung nennt den Ausgangswert',  (meldung ?? '').includes('Entwurf'), true);

  /* Ein neuer Eintrag darf jeden Startwert haben */
  const neu = await p.evaluate(async (x) => {
    const z = Store.addRow(x.coll, { title: 'Direkt genehmigt', status: 'Genehmigt' });
    await new Promise(r => setTimeout(r, 150));
    return Store.getBlock(z.id).props.status;
  }, bau);
  pruef('Neue Zeile darf jeden Startwert haben', neu, 'Genehmigt');

  /* --- Der Dialog zeigt die Übergänge ---------------------------------- */
  const dialog = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    Datenbank.regelnDialog(c, 'status');
    await new Promise(r => setTimeout(r, 350));
    const zeilen = document.querySelectorAll('.ue-zeile').length;
    const kaestchen = document.querySelectorAll('[data-von]').length;
    const angehakt = document.querySelectorAll('[data-von]:checked').length;
    return { zeilen, kaestchen, angehakt };
  }, bau);
  pruef('Vier Zeilen, eine je Wert', dialog.zeilen, 4);
  pruef('Je drei Ziele = zwölf Kästchen', dialog.kaestchen, 12);
  pruef('Drei sind angehakt', dialog.angehakt, 3);

  /* Ändern und speichern */
  const gespeichert = await p.evaluate(async (x) => {
    /* Entwurf darf jetzt auch direkt abgelehnt werden */
    const cb = document.querySelector<HTMLInputElement>('[data-von="Entwurf"][data-nach="Abgelehnt"]');
    if (!cb) throw new Error('[data-von="Entwurf"][data-nach="Abgelehnt"] ist nicht da — der Lauf misst sonst nichts.');
    cb.checked = true;
    document?.querySelector<HTMLElement>('[data-a="ok"]')?.click();
    await new Promise(r => setTimeout(r, 350));
    const c = Store.getCollection(x.coll);
    return c.schema.status.uebergaenge;
  }, bau);
  pruef('Neue Erlaubnis gespeichert',
        (gespeichert['Entwurf'] || []).sort(), ['Abgelehnt', 'Eingereicht']);

  const jetztErlaubt = await p.evaluate(async (x) => {
    const z = Store.rowsOf(x.coll).find(r => r.text === 'Urlaub');
    Store.setProp(z.id, 'status', 'Abgelehnt');
    await new Promise(r => setTimeout(r, 150));
    return Store.getBlock(z.id).props.status;
  }, bau);
  pruef('Der neue Weg geht jetzt durch', jetztErlaubt, 'Abgelehnt');

  /* Regeln entfernen */
  const entfernt = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    Datenbank.regelnDialog(c, 'status');
    await new Promise(r => setTimeout(r, 300));
    document?.querySelector<HTMLElement>('[data-a="weg"]')?.click();
    await new Promise(r => setTimeout(r, 300));
    const c2 = Store.getCollection(x.coll);
    return { uebergaenge: c2.schema.status.uebergaenge,
             regeln: Datenbank.hatRegeln(c2.schema.status) };
  }, bau);
  pruef('Übergänge entfernt',      entfernt.uebergaenge, undefined);
  pruef('Keine Regeln mehr',       entfernt.regeln, false);

  const wiederFrei = await p.evaluate(async (x) => {
    const z = Store.rowsOf(x.coll).find(r => r.text === 'Urlaub');
    Store.setProp(z.id, 'status', 'Genehmigt');
    await new Promise(r => setTimeout(r, 150));
    return Store.getBlock(z.id).props.status;
  }, bau);
  pruef('Ohne Regel ist wieder alles erlaubt', wiederFrei, 'Genehmigt');

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
