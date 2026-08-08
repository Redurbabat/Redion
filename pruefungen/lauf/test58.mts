/* Formular-Danke-Seite, Webhook-Anmeldung, Eingänge von aussen */
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

  /* Eine kleine Quelle vortäuschen, aus der geholt wird */
  await p.route('**/quelle.json', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ daten: { eintraege: [
      { Titel: 'Von aussen A', Status: 'Offen', Menge: 3 },
      { Titel: 'Von aussen B', Status: 'Fertig', Menge: 7 }
    ] } })
  }));
  await p.route('**/kaputt.json', route => route.fulfill({ status: 500, body: 'nein' }));

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1500);

  /* --- Formular mit Danke-Seite ---------------------------------------- */
  const bau = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Anmeldung' });
    const db = Store.addDatabase(s.id, 'Anmeldungen', {
      title: { name: 'Name',  type: 'title' },
      mail:  { name: 'Mail',  type: 'email' },
      wunsch:{ name: 'Wunsch',type: 'text' }
    }, 'form');
    const c = Store.getCollection(db.collectionId);
    Store.updateView(db.viewId, { pflicht: ['title'],
                                  formDankTitel: 'Danke fürs Mitmachen!',
                                  formDankText: 'Wir melden uns.' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    return { seite: s.id, coll: c.id, view: db.viewId };
  });

  const formular = await p.evaluate(() => ({
    felder: document.querySelectorAll('.form-feld').length,
    knoepfe: [...document.querySelectorAll<HTMLElement>('.form-fuss button')].map(x => x.textContent),
    zahl: (document.querySelector('.form-zahl') || {}).textContent
  }));
  pruef('Drei Felder im Formular',   formular.felder, 3);
  pruef('Danke-Seite einstellbar',   (formular.knoepfe ?? '').includes('Danke-Seite'), true);
  pruef('Knopftext einstellbar',     (formular.knoepfe ?? '').includes('Knopftext'), true);
  pruef('Link kopierbar',            formular.knoepfe.some(x => (x ?? '').includes('Link')), true);
  pruef('Zähler nennt beide Zahlen', formular.zahl?.includes('über das Formular'), true);

  /* Pflichtfeld leer → nicht abschicken */
  await p.evaluate(() => document.querySelector<HTMLElement>('[data-a="senden"]')?.click());
  await p.waitForTimeout(300);
  const leer = await p.evaluate(() => ({ danke: !!document.querySelector('.form-danke'),
                                         zeilen: Store.rowsOf(
                                           Object.values(Store.cache.collections)
                                             .find(c => c.name === 'Anmeldungen')?.id).length }));
  pruef('Ohne Pflichtfeld keine Danke-Seite', leer.danke, false);
  pruef('Und keine Zeile angelegt',           leer.zeilen, 0);

  /* Ausfüllen und abschicken */
  await p.evaluate(() => {
    const felder = document.querySelectorAll('.form-feld [data-k]');
    const _f0 = felder[0];
    if (!_f0) throw new Error('felder[0] fehlt — der Lauf misst sonst nichts.');
    (_f0 as HTMLInputElement).value = 'Redur';
    const _f1 = felder[1];
    if (!_f1) throw new Error('felder[1] fehlt — der Lauf misst sonst nichts.');
    (_f1 as HTMLInputElement).value = 'red@beispiel.ch';
    document?.querySelector<HTMLElement>('[data-a="senden"]')?.click();
  });
  await p.waitForTimeout(450);
  const danke = await p.evaluate((x) => ({
    seite: !!document.querySelector('.form-danke'),
    titel: (document.querySelector('.fd-gross') || {}).textContent,
    text:  (document.querySelector('.fd-text') || {}).textContent,
    zahl:  (document.querySelector('.fd-zahl') || {}).textContent,
    knoepfe: [...document.querySelectorAll<HTMLElement>('.fd-knoepfe button')].map(y => y.textContent),
    zeilen: Store.rowsOf(x.coll).map(r => r.text),
    gezaehlt: Store.getView(x.view).formAnzahl
  }), bau);
  pruef('Danke-Seite erscheint',      danke.seite, true);
  pruef('Mit eigenem Titel',          danke.titel, 'Danke fürs Mitmachen!');
  pruef('Mit eigenem Text',           danke.text, 'Wir melden uns.');
  pruef('Zeile wurde angelegt',       danke.zeilen, ['Redur']);
  pruef('Zähler steht auf 1',         danke.gezaehlt, 1);
  pruef('Zähler auch im Text',        danke.zahl?.includes('1 Antwort'), true);
  pruef('Noch eine Antwort möglich',  danke.knoepfe.some(x => (x ?? '').includes('Noch eine')), true);

  await p.evaluate(() => document.querySelector<HTMLElement>('[data-a="nochmal"]')?.click());
  await p.waitForTimeout(400);
  const wieder = await p.evaluate(() => !!document.querySelector('.form-fuss'));
  pruef('„Noch eine Antwort" zeigt das Formular wieder', wieder, true);

  /* --- Webhook-Anmeldung ------------------------------------------------ */
  const auth = await p.evaluate(() => {
    Store.setMeta('webhookAuthArt', 'bearer');
    Store.setMeta('api:webhookAuth', 'geheim123');
    return { art: Store.getMeta('webhookAuthArt'), wert: Store.getMeta('api:webhookAuth') };
  });
  pruef('Anmeldeart gespeichert', auth.art, 'bearer');

  const kopfzeilen: any[] = [];
  await p.route('**/hook-test', route => {
    kopfzeilen.push(route.request().headers()['authorization'] || '');
    route.fulfill({ status: 200, body: 'ok' });
  });
  await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [{ id: 'w1', name: 'Hook', an: true, wenn: { art: 'zeile-neu' },
                        bedingungen: [], dann: [{ art: 'webhook', text: 'https://test.local/hook-test' }] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    Store.addRow(c.id, { title: 'Löst den Hook aus' });
    await new Promise(r => setTimeout(r, 900));
  }, bau);
  pruef('Webhook mit Bearer-Schlüssel geschickt',
        kopfzeilen.some(h => h === 'Bearer geheim123'), true);

  /* --- Und wenn der Webhook ablehnt? ------------------------------------
     `KI.holen` wirft bei 401 nicht — es gibt die Antwort zurück. Wer nur
     `.then(… geschickt)` schreibt, meldet Erfolg, und im Laufverlauf steht
     ✓, obwohl nie etwas ankam. Beides muss ehrlich werden: kein
     Erfolgstoast, und der Verlaufseintrag kippt auf ⚠ (A1/A2, E76). */
  await p.route('**/hook-401', route => route.fulfill({ status: 401, body: 'nein' }));
  const abgelehnt = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [{ id: 'w2', name: 'Kaputter Hook', an: true, wenn: { art: 'zeile-neu' },
                        bedingungen: [], dann: [{ art: 'webhook', text: 'https://test.local/hook-401' }] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    Store.addRow(c.id, { title: 'Löst den kaputten Hook aus' });
    /* Der Fehler kommt NACH notieren() an — der Eintrag entsteht mit ✓ und
       muss danach auf ⚠ gedreht werden. Kurz warten, dann nachsehen. */
    await new Promise(r => setTimeout(r, 1200));
    const frisch = Store.getCollection(x.coll);
    const eintrag = ((frisch.automationen || []).find((a: any) => a.id === 'w2') || {}).verlauf?.[0];
    return { fehler: eintrag?.fehler || '', aktionen: eintrag?.aktionen || [] };
  }, bau);
  pruef('Der Verlaufseintrag trägt den Fehler nach',
        /401/.test(abgelehnt.fehler), true);

  /* --- Eingänge von aussen --------------------------------------------- */
  const eingang = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Eingangstest' });
    const db = Store.addDatabase(s.id, 'Auftraege', {
      title:  { name: 'Titel',  type: 'title' },
      status: { name: 'Status', type: 'select',
                options: [{ name: 'Offen', color: 'gray' }, { name: 'Fertig', color: 'green' }] },
      menge:  { name: 'Menge',  type: 'number' }
    });
    const c = Store.getCollection(db.collectionId);
    return { coll: c.id, seite: s.id };
  });

  /* Von Hand einwerfen */
  const wurf = await p.evaluate((x) => {
    const r = Eingang.uebernehmen({ db: x.coll, zuordnung: {}, automatisch: true },
      '{"Titel":"Handeinwurf","Status":"Offen","Menge":5}');
    const z = Store.rowsOf(x.coll)[0];
    return { r, titel: z.text, status: z.props.status, menge: z.props.menge };
  }, eingang);
  pruef('Eine Zeile eingeworfen',   wurf.r.neu, 1);
  pruef('Titel übernommen',         wurf.titel, 'Handeinwurf');
  pruef('Auswahl übernommen',       wurf.status, 'Offen');
  pruef('Zahl als Zahl übernommen', wurf.menge, 5);

  /* Liste auf einmal */
  const stapel = await p.evaluate((x) => {
    const r = Eingang.uebernehmen({ db: x.coll, zuordnung: {}, automatisch: true },
      '[{"Titel":"Eins"},{"Titel":"Zwei"}]');
    return { r, anzahl: Store.rowsOf(x.coll).length };
  }, eingang);
  pruef('Zwei auf einmal', stapel.r.neu, 2);
  pruef('Jetzt drei Zeilen', stapel.anzahl, 3);

  /* Doppelte fernhalten */
  const doppelt = await p.evaluate((x) => {
    const r = Eingang.uebernehmen({ db: x.coll, zuordnung: {}, automatisch: true,
                                    schluessel: 'title' }, '{"Titel":"Eins"}');
    return { r, anzahl: Store.rowsOf(x.coll).length };
  }, eingang);
  pruef('Doppelter wird übersprungen', doppelt.r.uebersprungen, 1);
  pruef('Keine neue Zeile',            doppelt.anzahl, 3);

  /* Abholen von einer Adresse, mit Pfad */
  const geholt = await p.evaluate(async (x) => {
    const e = { id: 'e1', name: 'Shop', db: x.coll, url: 'https://test.local/quelle.json',
                takt: 'aus', an: true, zuordnung: {}, automatisch: true,
                pfad: 'daten.eintraege', schluessel: 'title' };
    Store.setMeta('eingaenge', [e]);
    const r = await Eingang.holen(e);
    return { r, titel: Store.rowsOf(x.coll).map(z => z.text).sort(),
             zuletzt: !!(Eingang.liste()[0] || {}).zuletzt };
  }, eingang);
  pruef('Zwei von aussen geholt',   geholt.r.neu, 2);
  pruef('Beide angelegt',           (geholt.titel ?? '').includes('Von aussen A'), true);
  pruef('Zeitpunkt gemerkt',        geholt.zuletzt, true);

  /* Zweites Abholen legt nichts doppelt an */
  const nochmal = await p.evaluate(async () => {
    const r = await Eingang.holen(Eingang.liste()[0]);
    return r;
  });
  pruef('Beim zweiten Mal nichts neu', nochmal.neu, 0);
  pruef('Beide übersprungen',          nochmal.uebersprungen, 2);

  /* Kaputte Quelle */
  const kaputt = await p.evaluate(async (x) => {
    const r = await Eingang.holen({ id: 'e2', db: x.coll, url: 'https://test.local/kaputt.json',
                                    zuordnung: {}, automatisch: true });
    return r;
  }, eingang);
  pruef('Fehlerhafte Antwort wird gemeldet', typeof kaputt.fehler, 'string');

  /* Zuordnung fremder Feldnamen */
  const zuordnung = await p.evaluate((x) => {
    const r = Eingang.uebernehmen({ db: x.coll, automatisch: false,
      zuordnung: { subject: 'title', qty: 'menge' } },
      '{"subject":"Aus dem Fremdsystem","qty":42,"egal":"wird nicht übernommen"}');
    const z = Store.rowsOf(x.coll).find(y => y.text === 'Aus dem Fremdsystem');
    return { r, menge: z ? z.props.menge : null, status: z ? z.props.status : 'x' };
  }, eingang);
  pruef('Fremder Feldname zugeordnet', zuordnung.menge, 42);
  pruef('Nicht zugeordnetes bleibt aus', zuordnung.status, undefined);

  /* Automation läuft bei einem Eingang mit */
  const mitAuto = await p.evaluate(async (x) => {
    const c = Store.getCollection(x.coll);
    c.automationen = [{ id: 'a9', name: 'Stempel', an: true,
      wenn: { art: 'formular-neu' }, bedingungen: [],
      dann: [{ art: 'setze-prop', key: 'status', wert: 'Fertig' }] }];
    Store.updateCollection(c.id, { automationen: c.automationen });
    Eingang.uebernehmen({ db: x.coll, zuordnung: {}, automatisch: true },
      '{"Titel":"Mit Automation"}');
    await new Promise(r => setTimeout(r, 500));
    const z = Store.rowsOf(x.coll).find(y => y.text === 'Mit Automation');
    return z.props.status;
  }, eingang);
  pruef('Automation läuft beim Eingang mit', mitAuto, 'Fertig');

  /* Aus der Adresse */
  const ausAdresse = await p.evaluate(async (_x) => {
    location.hash = '#neu=Auftraege&titel=Aus+der+Adresse&Menge=9';
    const z = Eingang.ausAdresse();
    await new Promise(r => setTimeout(r, 200));
    return z ? { titel: z.text, menge: Store.getBlock(z.id).props.menge } : null;
  }, eingang);
  /* `ausDerAdresse` gibt `null`, wenn die Adresse nichts hergibt — genau das
     ist der Fall, den die zwei Zeilen darunter ausschliessen sollen. Ohne
     diese Prüfung stünde dort `null.titel` und der Lauf stürbe, statt rot
     zu werden. */
  if (!ausAdresse) throw new Error('Eingang.ausAdresse() hat nichts geliefert.');
  pruef('Adresse legt eine Zeile an', ausAdresse.titel, 'Aus der Adresse');
  pruef('Mit dem Wert aus der Adresse', ausAdresse.menge, 9);

  /* --- Das Fenster ------------------------------------------------------ */
  await p.evaluate(() => Eingang.dialog());
  await p.waitForTimeout(350);
  const dialog = await p.evaluate(() => ({
    eintraege: document.querySelectorAll('.eg-z').length,
    wurf: !!document.querySelector('#eg-json'),
    beispiel: (document.querySelector('.eg-adresse code') || {}).textContent,
    knoepfe: [...document.querySelectorAll<HTMLElement>('.fbtns button')].map(x => x.textContent)
  }));
  pruef('Ein Eingang gelistet',      dialog.eintraege, 1);
  pruef('Einwurffeld vorhanden',     dialog.wurf, true);
  pruef('Beispiel-Link zeigt #neu=', dialog.beispiel?.includes('#neu='), true);
  pruef('Alle abholen möglich',      dialog.knoepfe.some(x => (x ?? '').includes('Alle jetzt')), true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
