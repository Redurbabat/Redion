/* Erweiterungen: eigene Formeln, Befehle, Knöpfe — und ihre Grenzen */
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

  /* --- Vier Beispiele sind mitgeliefert --------------------------------- */
  const bsp = await p.evaluate(() => ({
    anzahl: Erweiterung.BEISPIELE.length,
    namen: Erweiterung.BEISPIELE.map(x => x.name)
  }));
  pruef('Vier Beispiele dabei', bsp.anzahl, 4);
  pruef('Römische Zahlen dabei', (bsp.namen ?? '').includes('Römische Zahlen'), true);

  /* --- Eine eigene Formelfunktion --------------------------------------- */
  const formel = await p.evaluate(async () => {
    Store.setMeta('erweiterungen', [{
      name: 'Römisch', kurz: 'Test', an: true,
      code: Erweiterung.BEISPIELE.find(x => x.name === 'Römische Zahlen')?.code
    }]);
    Erweiterung.alleLaufen();
    await new Promise(r => setTimeout(r, 150));
    return {
      angemeldet: Object.keys(Erweiterung.angemeldet.formeln),
      /* `roemisch` gibt es beim Übersetzen NICHT — die Erweiterung trägt sie
       zur Laufzeit nach, und ob das gelingt, ist die Frage dieses Laufs.
       Die Tabelle wird deshalb hier als offen gelesen. */
    inFormula: typeof (Formula.F as Record<string, any>)['roemisch'],
      rechnet: Formula.run('roemisch(2026)', () => null),
      klein: Formula.run('roemisch(4)', () => null)
    };
  });
  pruef('Formel angemeldet',       formel.angemeldet, ['roemisch']);
  pruef('In der Formelmaschine',   formel.inFormula, 'function');
  pruef('2026 wird MMXXVI',        formel.rechnet.wert, 'MMXXVI');
  pruef('4 wird IV',               formel.klein.wert, 'IV');

  /* In einer echten Datenbankspalte */
  const inDb = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Erweiterungstest' });
    const db = Store.addDatabase(s.id, 'Jahre', {
      title: { name: 'Ereignis', type: 'title' },
      jahr:  { name: 'Jahr',     type: 'number' },
      rom:   { name: 'Römisch',  type: 'formula', formula: 'roemisch(prop("Jahr"))' }
    });
    const c = Store.getCollection(db.collectionId);
    const z = Store.addRow(c.id, { title: 'Jetzt', jahr: 2026 });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 400));
    return { wert: Datenbank.wert(Store.getBlock(z.id), 'rom', c), seite: s.id, coll: c.id };
  });
  pruef('Eigene Formel wirkt in der Spalte', inDb.wert, 'MMXXVI');

  /* --- Ein eigener Knopf ------------------------------------------------ */
  const knopf = await p.evaluate(async () => {
    Store.setMeta('erweiterungen', [{
      name: 'Zähler', kurz: 'Test', an: true,
      code: "Redion.knopf('Seiten zählen', '🔢', () => " +
            "{ Redion.schreibe.seite('Gezählt: ' + Redion.daten.seiten().length); });"
    }]);
    Erweiterung.alleLaufen();
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 350));
    return { angemeldet: Erweiterung.angemeldet.knoepfe.length,
             imBaum: document.querySelectorAll('#erw-knoepfe [data-erw]').length,
             titel: (document.querySelector('#erw-knoepfe [data-erw] span:nth-child(2)') || {}).textContent };
  });
  pruef('Knopf angemeldet',       knopf.angemeldet, 1);
  pruef('Knopf in der Leiste',    knopf.imBaum, 1);
  pruef('Mit dem richtigen Namen', knopf.titel, 'Seiten zählen');

  await p.evaluate(() => document.querySelector<HTMLElement>('#erw-knoepfe [data-erw]')?.click());
  await p.waitForTimeout(350);
  const gezaehlt = await p.evaluate(() =>
    Object.values(Store.cache.blocks).filter(b => (b.text || '').startsWith('Gezählt: ')).length);
  pruef('Knopf liest die Seiten und legt eine an', gezaehlt, 1);

  /* --- Ein eigener Befehl in der Palette -------------------------------- */
  const befehl = await p.evaluate(async () => {
    Store.setMeta('erweiterungen', [{
      name: 'Notiz', kurz: 'Test', an: true,
      code: "Redion.befehl('Schnelle Testnotiz', 'legt eine Seite an', () => " +
            "{ Redion.oeffne(Redion.schreibe.seite('Von der Erweiterung')); });"
    }]);
    Erweiterung.alleLaufen();
    Werkzeuge.palette();
    await new Promise(r => setTimeout(r, 300));
    const inp = document.querySelector<HTMLInputElement>('#cq');
    if (!inp) throw new Error('#cq ist nicht da — der Lauf misst sonst nichts.');
    inp.value = 'Testnotiz';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 200));
    const erster = document.querySelector<HTMLElement>('#cr button');
    const text = erster ? (erster.textContent ?? '').trim() : '';
    if (erster) erster.click();
    await new Promise(r => setTimeout(r, 300));
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    const neu = Object.values(Store.cache.blocks).find(b => b.text === 'Von der Erweiterung');
    return { text, seite: neu ? neu.text : null };
  });
  pruef('Befehl steht in der Palette', (befehl.text ?? '').includes('Schnelle Testnotiz'), true);
  pruef('Und legt die Seite an',       befehl.seite, 'Von der Erweiterung');

  /* --- Schreiben in eine Datenbank -------------------------------------- */
  const schreibt = await p.evaluate(async (x) => {
    Store.setMeta('erweiterungen', [{
      name: 'Füller', kurz: 'Test', an: true,
      code: "Redion.knopf('Zeile anlegen', '➕', () => {" +
            "  const db = Redion.daten.datenbanken().find(d => d.name === 'Jahre');" +
            "  Redion.schreibe.zeile(db.id, { Ereignis: 'Aus der Erweiterung', Jahr: 1999 });" +
            "});"
    }]);
    Erweiterung.alleLaufen();
    Erweiterung.angemeldet.knoepfe[0]?.fn();
    await new Promise(r => setTimeout(r, 250));
    const c = Store.getCollection(x.coll);
    const z = Store.rowsOf(c.id).find(r => r.text === 'Aus der Erweiterung');
    return { titel: z ? z.text : null, jahr: z ? z.props.jahr : null };
  }, inDb);
  pruef('Zeile über die Erweiterung angelegt', schreibt.titel, 'Aus der Erweiterung');
  pruef('Mit dem richtigen Wert',              schreibt.jahr, 1999);

  /* --- Grenzen: kein Zugriff auf window oder Store ---------------------- */
  const grenzen = await p.evaluate(() => {
    /* Die Erweiterung schreibt, was sie sieht, in eine Seite — anders käme
       nichts heraus, denn window ist für sie leer. */
    const r1 = Erweiterung.einzeln({ name: 'Abgeschirmt', an: true,
      code: "Redion.schreibe.seite('SCHIRM ' + [typeof Store, typeof window, typeof fetch, " +
            "typeof document, typeof localStorage, typeof globalThis, typeof Worker].join(','));" });
    Erweiterung.einzeln({ name: 'Prüfen', an: true,
      code: "Redion.schreibe.seite('NAME ' + (typeof Redion) + ' ' + Redion.name);" });
    const r3 = Erweiterung.einzeln({ name: 'Kaputt', an: true, code: "das ist kein js ((" });
    const finde = (v: any) => (Object.values(Store.cache.blocks)
      .find(b => (b.text || '').startsWith(v)) || {}).text || '';
    return { schirm: finde('SCHIRM ').slice(7), lief: r1.ok,
             nurRedion: finde('NAME '), kaputt: r3.ok, fehler: r3.fehler };
  });
  pruef('Store, window, fetch und Co. sind abgeschirmt',
        grenzen.schirm, 'undefined,undefined,undefined,undefined,undefined,undefined,undefined');
  pruef('Redion kommt mit seinem Namen an',  grenzen.nurRedion, 'NAME object Prüfen');
  pruef('Kaputter Code läuft nicht',         grenzen.kaputt, false);
  pruef('… und nennt den Grund',             typeof grenzen.fehler, 'string');

  /* --- Abschalten ------------------------------------------------------- */
  const aus = await p.evaluate(async () => {
    Store.setMeta('erweiterungen', [{
      name: 'Aus', kurz: '', an: false,
      code: "Redion.knopf('Sollte nicht da sein', '❌', () => {});"
    }]);
    Erweiterung.alleLaufen();
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 300));
    return { knoepfe: Erweiterung.angemeldet.knoepfe.length,
             imBaum: document.querySelectorAll('#erw-knoepfe [data-erw]').length };
  });
  pruef('Abgeschaltete meldet nichts an', aus.knoepfe, 0);
  pruef('Und steht nicht in der Leiste',  aus.imBaum, 0);

  /* --- Das Fenster ------------------------------------------------------ */
  await p.evaluate(() => Erweiterung.dialog());
  await p.waitForTimeout(350);
  const dialog = await p.evaluate(() => ({
    eintraege: document.querySelectorAll('.ew-z').length,
    beispiele: document.querySelectorAll('[data-bsp]').length,
    api: document.querySelectorAll('.ew-api div').length,
    schalter: document.querySelectorAll('.ew-z .schalter').length
  }));
  pruef('Ein Eintrag in der Liste', dialog.eintraege, 1);
  pruef('Vier Beispiele zur Wahl',  dialog.beispiele, 4);
  pruef('15 Schnittstellenzeilen',  dialog.api, 15);
  pruef('Mit Schalter zum Aus- und Anschalten', dialog.schalter, 1);

  /* Probelauf im Codefenster */
  await p.evaluate(() => document.querySelector<HTMLElement>('[data-bsp="0"]')?.click());
  await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector<HTMLElement>('[data-a="probe"]')?.click());
  await p.waitForTimeout(400);
  const probe = await p.evaluate(() => {
    const el = document.querySelector('#ew-p');
    if (!el) throw new Error('#ew-p ist nicht da — der Lauf misst sonst nichts.');
    return { klasse: el.className, text: el.textContent };
  });
  pruef('Probelauf meldet Erfolg', (probe.klasse ?? '').includes('gut'), true);
  pruef('Und zählt, was angemeldet wurde', (probe.text ?? '').includes('Knöpfe'), true);

  /* Kaputter Code wird beim Einbauen abgefangen */
  const kaputtEin = await p.evaluate(async () => {
    const _el442 = document.querySelector<HTMLInputElement>('#ew-c');
    if (!_el442) throw new Error('#ew-c ist nicht da — der Lauf misst sonst nichts.');
    _el442.value = 'function ( kaputt';
    document?.querySelector<HTMLElement>('[data-a="ok"]')?.click();
    await new Promise(r => setTimeout(r, 250));
    const el = document.querySelector('#ew-p');
    const nochOffen = !!document.querySelector('#ew-c');
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return { klasse: el ? el.className : '', nochOffen };
  });
  pruef('Kaputter Code wird abgewiesen', (kaputtEin.klasse ?? '').includes('schlecht'), true);
  pruef('Das Fenster bleibt offen',      kaputtEin.nochOffen, true);

  /* --- Nach dem Neustart weiter da -------------------------------------- */
  await p.evaluate(async () => {
    Store.setMeta('erweiterungen', [{
      name: 'Römisch', kurz: 'bleibt', an: true,
      code: Erweiterung.BEISPIELE.find(x => x.name === 'Römische Zahlen')?.code }]);
    await Store.flush();
  });
  await p.reload();
  await p.waitForTimeout(1800);
  /* Nach dem Neuladen ist die Einrichtung der Hauptwelten wieder da —
     sie erscheint 300 ms nach dem Start und fängt Klicks ab (E132). */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
  });
  const nachNeustart = await p.evaluate(() => ({
    anzahl: Erweiterung.liste().length,
    formel: Formula.run('roemisch(9)', () => null).wert
  }));
  pruef('Erweiterung überlebt den Neustart', nachNeustart.anzahl, 1);
  pruef('Und ihre Formel rechnet weiter',    nachNeustart.formel, 'IX');

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
