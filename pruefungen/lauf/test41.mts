/* Wiederkehrende Automationen, Variablen und die drei neuen Aktionen. */
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  const f: any[] = [];
  p.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(3600);

  const pruef: any[] = []; const ok = (n: any, x: any, z?: any) => pruef.push([n, !!x, z]);

  /* --- Die Takt-Marken rechnen richtig -------------------------------- */
  const marken = await p.evaluate(() => {
    const m = (takt: any, uhr: any, iso: any) => Datenbank.taktMarke(takt, uhr, new Date(iso), undefined);
    return {
      stuendlich:  m('stuendlich', '09:00', '2026-08-02T14:37'),
      taeglichVor: m('taeglich', '09:00', '2026-08-02T08:00'),  /* noch nicht 9 Uhr → gestern */
      taeglichNach:m('taeglich', '09:00', '2026-08-02T10:00'),
      werktagsSo:  m('werktags', '09:00', '2026-08-02T10:00'),  /* Sonntag */
      werktagsMo:  m('werktags', '09:00', '2026-08-03T10:00'),
      monatlich:   m('monatlich', '09:00', '2026-08-15T10:00'),
      quartal:     m('quartal', '09:00', '2026-08-15T10:00'),
      jaehrlich:   m('jaehrlich', '09:00', '2026-08-15T10:00'),
      woche:       m('woechentlich', '09:00', '2026-08-05T10:00')
    };
  });
  console.log('   Marken:', JSON.stringify(marken));
  ok('Stündlich zählt die Stunde', marken.stuendlich === '2026-08-02T14', marken.stuendlich);
  ok('Vor der Uhrzeit gilt noch der Vortag', marken.taeglichVor === '2026-08-01', marken.taeglichVor);
  ok('Nach der Uhrzeit gilt heute', marken.taeglichNach === '2026-08-02', marken.taeglichNach);
  ok('Am Sonntag läuft „an Werktagen" nicht', marken.werktagsSo === null, String(marken.werktagsSo));
  ok('Am Montag schon', marken.werktagsMo === '2026-08-03', marken.werktagsMo);
  ok('Monatlich zählt den Monat', marken.monatlich === '2026-08', marken.monatlich);
  ok('Vierteljährlich zählt das Quartal', marken.quartal === '2026-Q3', marken.quartal);
  ok('Jährlich zählt das Jahr', marken.jaehrlich === '2026', marken.jaehrlich);
  ok('Wöchentlich zählt die Kalenderwoche', /^2026-KW\d\d$/.test(marken.woche ?? ''), marken.woche);

  /* --- Eine wiederkehrende Automation läuft genau einmal je Takt ------- */
  const lauf = await p.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Automationsprobe', icon: '⚡' });
    const { collectionId } = Store.addDatabase(s.id, 'Aufgaben', {
      title: { name: 'Name',   type: 'title'  },
      zahl:  { name: 'Zähler', type: 'number' }
    }, 'table');
    const coll = Store.getCollection(collectionId);
    const zk = Object.keys(coll.schema).find(k => coll.schema[k].name === 'Zähler') ?? '';
    ['A', 'B'].forEach(t => { const r = Store.addRow(collectionId, {});
      Store.updateBlock(r.id, { text: t, props: { [zk]: 0 } }); });

    coll.automationen = [{
      id: 'wdh1', name: 'Täglich zählen', an: true,
      wenn: { art: 'wiederkehrend', takt: 'stuendlich', uhr: '00:00' },
      bedingungen: [], dann: [{ art: 'zaehler', key: zk }]
    }];
    Store.updateCollection(coll.id, { automationen: coll.automationen });

    Datenbank.wiederkehrendeAutomationen();
    await new Promise(r => setTimeout(r, 120));
    const nach1 = Store.rowsOf(collectionId).map(r => (r.props || {})[zk]);
    Datenbank.wiederkehrendeAutomationen();      /* zweiter Aufruf im selben Takt */
    await new Promise(r => setTimeout(r, 120));
    const nach2 = Store.rowsOf(collectionId).map(r => (r.props || {})[zk]);
    const marke = Store.getCollection(collectionId).automationen[0].zuletzt;
    return { nach1, nach2, marke, collectionId, zk };
  });
  console.log('   Lauf:', JSON.stringify(lauf));
  ok('Die Automation läuft für jede Zeile', lauf.nach1.join(',') === '1,1', lauf.nach1.join(','));
  ok('Im selben Takt läuft sie kein zweites Mal', lauf.nach2.join(',') === '1,1', lauf.nach2.join(','));
  ok('Der Takt wird gemerkt', !!lauf.marke, String(lauf.marke));

  /* --- Ab- und Enddatum werden beachtet -------------------------------- */
  const grenzen = await p.evaluate(async (cid) => {
    const coll = Store.getCollection(cid);
    const zk = Object.keys(coll.schema).find(k => coll.schema[k].name === 'Zähler') ?? '';
    const morgen = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    coll.automationen = [{
      id: 'wdh2', name: 'Erst ab morgen', an: true,
      wenn: { art: 'wiederkehrend', takt: 'stuendlich', uhr: '00:00', ab: morgen },
      bedingungen: [], dann: [{ art: 'zaehler', key: zk }]
    }];
    Store.updateCollection(cid, { automationen: coll.automationen });
    Datenbank.wiederkehrendeAutomationen();
    await new Promise(r => setTimeout(r, 120));
    return Store.rowsOf(cid).map(r => (r.props || {})[zk]);
  }, lauf.collectionId);
  ok('Vor dem Startdatum läuft nichts', grenzen.join(',') === '1,1', grenzen.join(','));

  /* --- Variablen stehen späteren Aktionen zur Verfügung ---------------- */
  const varTest = await p.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Variablenprobe', icon: '🔤' });
    const { collectionId } = Store.addDatabase(s.id, 'Rechnungen', {
      title:  { name: 'Name',   type: 'title'  },
      betrag: { name: 'Betrag', type: 'number' },
      note:   { name: 'Notiz',  type: 'text'   }
    }, 'table');
    const c = Store.getCollection(collectionId);
    const bk = Object.keys(c.schema).find(k => c.schema[k].name === 'Betrag') ?? '';
    const nk = Object.keys(c.schema).find(k => c.schema[k].name === 'Notiz') ?? '';
    const r = Store.addRow(collectionId, {});
    Store.updateBlock(r.id, { text: 'R1', props: { [bk]: 250 } });

    c.automationen = [{
      id: 'v1', name: 'Mit Variablen', an: true,
      wenn: { art: 'prop-wert', key: bk, wert: '250' },
      bedingungen: [],
      dann: [
        { art: 'variablen', vars: [
            { name: 'mwst',  formel: 'roundTo(prop("Betrag") * 0.081, 2)' },
            { name: 'stufe', formel: 'if(prop("Betrag") > 100, "gross", "klein")' } ] },
        { art: 'setze-prop', key: nk, wert: 'MwSt {{mwst}} — {{stufe}}' }
      ]
    }];
    Store.updateCollection(collectionId, { automationen: c.automationen });
    Store.setProp(r.id, bk, 250);
    await new Promise(x => setTimeout(x, 300));
    return Store.getBlock(r.id).props[nk];
  });
  ok('Variablen landen in der nächsten Aktion', varTest === 'MwSt 20.25 — gross', String(varTest));

  /* --- Seite in einer anderen Datenbank anlegen ------------------------ */
  const neueZeile = await p.evaluate(async () => {
    const s = Store.addPage(null, { text: 'Anlegeprobe', icon: '➕' });
    const ziel = Store.addDatabase(s.id, 'Protokoll', {
      title: { name: 'Name', type: 'title' },
      txt:   { name: 'Text', type: 'text'  }
    }, 'table');
    const quelle = Store.addDatabase(s.id, 'Ereignisse', {
      title: { name: 'Name',   type: 'title' },
      st:    { name: 'Status', type: 'text'  }
    }, 'table');
    const qc = Store.getCollection(quelle.collectionId);
    const zc = Store.getCollection(ziel.collectionId);
    const sk = Object.keys(qc.schema).find(k => qc.schema[k].name === 'Status') ?? '';
    const tk = Object.keys(zc.schema).find(k => zc.schema[k].name === 'Text') ?? '';

    qc.automationen = [{
      id: 'nz1', name: 'Protokollieren', an: true,
      wenn: { art: 'prop-wert', key: sk, wert: 'fertig' },
      bedingungen: [],
      dann: [{ art: 'neue-zeile', zielDb: ziel.collectionId,
               titel: 'Erledigt: {titel}', felder: [{ key: tk, wert: 'am {datum}' }] }]
    }];
    Store.updateCollection(quelle.collectionId, { automationen: qc.automationen });

    const r = Store.addRow(quelle.collectionId, {});
    Store.updateBlock(r.id, { text: 'Ereignis 1' });
    Store.setProp(r.id, sk, 'fertig');
    await new Promise(x => setTimeout(x, 300));
    const zeilen = Store.rowsOf(ziel.collectionId);
    return { anzahl: zeilen.length, titel: zeilen[0] && zeilen[0].text,
             text: zeilen[0] && zeilen[0].props[tk] };
  });
  console.log('   Neue Zeile:', JSON.stringify(neueZeile));
  ok('„Seite anlegen in" legt eine Zeile an', neueZeile.anzahl === 1);
  ok('Der Titel nimmt {titel} auf', neueZeile.titel === 'Erledigt: Ereignis 1', String(neueZeile.titel));
  ok('Die Eigenschaft nimmt {datum} auf', /^am \d/.test(String(neueZeile.text)), String(neueZeile.text));

  /* --- Benachrichtigung landet im Posteingang -------------------------- */
  const meldung = await p.evaluate(async () => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    const s = Store.addPage(null, { text: 'Meldeprobe', icon: '🔔' });
    const { collectionId } = Store.addDatabase(s.id, 'Fristen', {
      title: { name: 'Name',   type: 'title' },
      st:    { name: 'Status', type: 'text'  }
    }, 'table');
    const c = Store.getCollection(collectionId);
    const sk = Object.keys(c.schema).find(k => c.schema[k].name === 'Status') ?? '';
    c.automationen = [{
      id: 'b1', name: 'Melden', an: true,
      wenn: { art: 'prop-wert', key: sk, wert: 'überfällig' },
      bedingungen: [], dann: [{ art: 'benachricht', text: '{titel} ist überfällig' }]
    }];
    Store.updateCollection(collectionId, { automationen: c.automationen });
    const r = Store.addRow(collectionId, {});
    Store.updateBlock(r.id, { text: 'Steuererklärung' });
    Store.setProp(r.id, sk, 'überfällig');
    await new Promise(x => setTimeout(x, 300));
    const m = Werkzeuge.meldungen();
    Ansichten.posteingang();
    await new Promise(x => setTimeout(x, 300));
    return { anzahl: m.length, text: m[0] && m[0].text, seite: m[0] && m[0].seite === r.id,
             imPosteingang: musselement('#page').textContent.includes('Steuererklärung ist überfällig') };
  });
  console.log('   Meldung:', JSON.stringify(meldung));
  ok('Die Benachrichtigung wird gespeichert', meldung.anzahl === 1);
  ok('Mit dem richtigen Text', meldung.text === 'Steuererklärung ist überfällig', String(meldung.text));
  ok('Und zeigt auf die Zeile', meldung.seite);
  ok('Sie steht im Posteingang', meldung.imPosteingang);

  /* --- Auslöser und Aktionen sind im Menü wählbar ---------------------- */
  const listen = await p.evaluate(() => ({
    ausloeser: Datenbank.AUSLOESER.map(x => x[0]),
    aktionen:  Datenbank.AKTIONEN.map(x => x[0]),
    takte:     Datenbank.TAKTE.length
  }));
  ok('Der wiederkehrende Auslöser steht im Menü', (listen.ausloeser ?? '').includes('wiederkehrend'));
  ok('Die vier neuen Aktionen stehen im Menü',
     ['variablen','neue-zeile','benachricht','mail'].every(x => (listen.aktionen ?? '').includes(x)),
     listen.aktionen.length + ' Aktionen');
  ok('Acht Takte zur Auswahl', listen.takte === 8, listen.takte + '');

  console.log('\n=== AUTOMATIONEN ===');
  pruef.forEach(([n, x, z]) => console.log((x ? '✅ ' : '❌ ') + n + (x || z === undefined ? '' : '   → ' + z)));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
  /* EIN RÜCKGABEWERT. Ohne ihn endet der Lauf mit 0, auch wenn oben ein ❌
     steht — und der Orchestrator meldete das jahrelang als „bestanden"
     (E56). Seit dem 8. August liest er die Ausgabe mit; die ehrliche
     Auskunft gehört trotzdem hierher, denn wer den Lauf einzeln startet,
     sieht nur den Rückgabewert. */
  process.exit(pruef.some((x: any) => !x[1]) ? 1 : 0);
})();
