const WURZEL = require('path').resolve(__dirname, '../..');
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f=[]; p.on('pageerror',e=>f.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/11434|CONNECTION_REFUSED|ERR_/i.test(m.text()))f.push('CONSOLE: '+m.text());});
  const pruef=[]; const ok=(n,x)=>pruef.push([n,!!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1600);

  /* ---------------------------------------------------------------
   * 1) Kontext-Schicht und Suche
   * -------------------------------------------------------------*/
  const bau = await p.evaluate(() => {
    const a = Store.addPage(null, { text: 'Fitnessziel August 2026' });
    Store.addBlock(a.id, 'text', { text: 'Ich will bis Dezember zehn Kilo abnehmen und stärker werden.' });
    Store.addBlock(a.id, 'bullet', { text: 'Dreimal pro Woche ins Gym' });

    const c = Store.addPage(null, { text: 'Deutsch-Lernplan B2' });
    Store.addBlock(c.id, 'text', { text: 'Jeden Tag zwanzig Vokabeln wiederholen.' });

    const d = Store.addPage(null, { text: 'Kochrezepte' });
    Store.addBlock(d.id, 'text', { text: 'Zwiebeln anbraten, Tomaten dazu, salzen.' });

    const e = Store.addPage(null, { text: 'Aufgabenliste' });
    const db = Store.addDatabase(e.id, 'Meine Aufgaben 2', {
      title: { name: 'Aufgabe', type: 'title' },
      st: { name: 'Status', type: 'status', options: [
        { name: 'Offen', color: 'blue' }, { name: 'Erledigt', color: 'green' }] }
    }, 'table');
    const cc = Store.getCollection(db.collectionId);
    [['Bewerbung schreiben', 'Offen'], ['App-Idee skizzieren', 'Erledigt']]
      .forEach(([t, st]) => {
        const r = Store.addRow(cc.id, { st });
        Store.updateBlock(r.id, { text: t });
      });

    const ix = Kontext.bauen();
    return { anzahl: ix.anzahl, fitness: a.id, rezept: d.id };
  });
  console.log('   Index:', bau.anzahl, 'Einträge');
  ok('Index umfasst Seiten und Datenbankzeilen', bau.anzahl >= 6);

  const suche = await p.evaluate(() => {
    const T = (q) => Kontext.finden(q, { anzahl: 4 }).map(x => x.titel);
    return {
      wortwoertlich: T('Fitnessziel'),
      semantisch:    T('Was war mein Trainingsziel?'),
      andereWorte:   T('Sport und abnehmen'),
      aufgaben:      T('Welche Aufgaben sind offen?'),
      unsinn:        T('Quantenchromodynamik Kernfusion')
    };
  });
  console.log('   Suche:', JSON.stringify(suche));
  ok('Wörtliche Suche findet die Seite', suche.wortwoertlich[0] === 'Fitnessziel August 2026');
  ok('Andere Wortform findet sie auch', suche.semantisch.includes('Fitnessziel August 2026'));
  ok('Verwandte Wörter finden sie auch', suche.andereWorte.includes('Fitnessziel August 2026'));
  ok('Datenbankzeile wird gefunden', suche.aufgaben.some(t => /Bewerbung|Aufgabe/.test(t)));
  ok('Unsinn findet nichts', suche.unsinn.length === 0);

  /* Ausschnitt statt ganzer Seite */
  const schnitt = await p.evaluate(() => {
    const t = Kontext.finden('abnehmen Kilo', { anzahl: 1 })[0];
    return t ? Kontext.ausschnitt(t, 'abnehmen Kilo', 200) : '';
  });
  console.log('   Ausschnitt:', JSON.stringify(schnitt).slice(0, 140));
  ok('Ausschnitt trifft die richtige Stelle', /Kilo|abnehmen/i.test(schnitt));

  /* ---------------------------------------------------------------
   * 2) Berechtigungsschicht
   * -------------------------------------------------------------*/
  const rechte = await p.evaluate((d) => {
    const k = Konten.anlegen({ name: 'Gast', mail: 'gast@example.org', rolleId: 'lesen' });
    Konten.anmelden(k.id);
    Konten.setzeFreigabe(d.rezept, k.id, 'kein');
    const ohne = Kontext.finden('Zwiebeln Tomaten', { anzahl: 5 }).map(x => x.titel);
    const darfLesen = Konten.darf('lesen', d.rezept);
    const darfSchreiben = Konten.darf('bearbeiten', d.fitness);
    Konten.setzeFreigabe(d.rezept, k.id, 'voll');
    const mit = Kontext.finden('Zwiebeln Tomaten', { anzahl: 5 }).map(x => x.titel);
    /* zurück auf das eigene Konto */
    Store.setMeta('kontoAktiv', '');
    return { ohne, mit, darfLesen, darfSchreiben,
             rollen: Konten.ROLLEN.map(r => r.id) };
  }, bau);
  console.log('   Rechte:', JSON.stringify(rechte));
  ok('Gesperrte Seite fällt aus der Suche', !rechte.ohne.includes('Kochrezepte'));
  ok('Freigegebene Seite ist wieder da', rechte.mit.includes('Kochrezepte'));
  ok('Kein Leserecht wird erkannt', rechte.darfLesen === false);
  ok('Leserolle darf nicht bearbeiten', rechte.darfSchreiben === false);
  ok('Fünf Rollen', rechte.rollen.length === 5 &&
     rechte.rollen.join(',') === 'voll,edit,komm,lesen,kein');

  /* ---------------------------------------------------------------
   * 3) Quellen ein- und ausschalten
   * -------------------------------------------------------------*/
  const quellen = await p.evaluate(() => {
    Kontext.quelleSetzen('datenbanken', false);
    const ohneDb = Kontext.finden('Bewerbung', { anzahl: 5 }).length;
    Kontext.quelleSetzen('datenbanken', true);
    const mitDb = Kontext.finden('Bewerbung', { anzahl: 5 }).length;
    Kontext.quelleSetzen('arbeitsbereich', false);
    const ohneSeiten = Kontext.finden('Fitnessziel', { anzahl: 5 })
      .filter(x => x.art === 'seite').length;
    Kontext.quelleSetzen('arbeitsbereich', true);
    return { ohneDb, mitDb, ohneSeiten, schalter: Object.keys(Kontext.quellen()).length };
  });
  console.log('   Quellen:', JSON.stringify(quellen));
  ok('Datenbanken lassen sich ausschalten', quellen.ohneDb === 0 && quellen.mitDb > 0);
  ok('Seiten lassen sich ausschalten', quellen.ohneSeiten === 0);
  ok('Fünf Quellen-Schalter', quellen.schalter === 5);

  const schalterSichtbar = await p.evaluate(() => {
    App.kiPanel(true);
    return document.querySelectorAll('.ki-quellschalter button').length;
  });
  ok('Schalter stehen im KI-Bereich', schalterSichtbar === 5);

  /* ---------------------------------------------------------------
   * 4) Der fertige Kontext mit Quellenliste
   * -------------------------------------------------------------*/
  const fertig = await p.evaluate((d) => {
    App.oeffne(d.fitness);
    const k = Kontext.bauenFuerFrage('Was ist mein Trainingsziel?', { anzahl: 4 });
    return { laenge: k.text.length, quellen: k.quellen.map(q => q.titel),
             arten: k.quellen.map(q => q.art), leer: k.leer };
  }, bau);
  console.log('   Kontext:', JSON.stringify(fertig));
  ok('Kontext ist nicht leer', !fertig.leer && fertig.laenge > 40);
  ok('Die offene Seite steht drin', fertig.quellen.includes('Fitnessziel August 2026'));
  ok('Quellen haben eine Art', fertig.arten.some(a => /Seite|Eintrag/.test(a)));

  /* ---------------------------------------------------------------
   * 5) Agent — Werkzeuge, Rechte, Guthaben
   * -------------------------------------------------------------*/
  const agent = await p.evaluate(async () => {
    const typen = Agent.TYPEN.map(t => t.id);
    const wz = Object.keys(Agent.WERKZEUGE);
    const such = await Agent.WERKZEUGE.suchen.lauf({ frage: 'Fitnessziel' });
    const anlegen = await Agent.WERKZEUGE.seiteAnlegen.lauf(
      { titel: 'Vom Agenten', bloecke: [{ typ: 'h1', text: 'Kopf' }, { typ: 'text', text: 'Inhalt' }] },
      { ids: [] });
    const da = Object.values(Store.cache.blocks).find(b => b.text === 'Vom Agenten');
    return { typen, wz, such: such.slice(0, 60), anlegen,
             seiteDa: !!da, kinder: da ? Store.childrenOf(da.id).length : 0 };
  });
  console.log('   Agent:', JSON.stringify({ typen: agent.typen, wz: agent.wz.length }));
  ok('Vier Agententypen', agent.typen.length === 4 &&
     agent.typen.join(',') === 'assistent,recherche,redakteur,bau');
  ok('Werkzeugkatalog gefüllt', agent.wz.length >= 11);
  ok('Werkzeug suchen liefert Treffer', /Fitness/i.test(agent.such));
  ok('Werkzeug seiteAnlegen legt wirklich an', agent.seiteDa && agent.kinder === 2);

  /* ---------------------------------------------------------------
   * 6) Workers laufen abgeschottet
   * -------------------------------------------------------------*/
  const wk = await p.evaluate(async () => {
    const gut = await Agent.workerLaufen(
      { name: 'summe', code: Agent.WORKER_BEISPIEL }, { werte: [2, 4, 6] });
    let fehler = '';
    try {
      await Agent.workerLaufen({ name: 'kaputt', code: 'return nichtDa.x;' }, {});
    } catch (e) { fehler = e.message; }
    let keinZugriff = '';
    try {
      keinZugriff = String(await Agent.workerLaufen(
        { name: 'spion', code: 'return typeof document;' }, {}));
    } catch (e) { keinZugriff = 'Fehler'; }
    return { gut, fehler, keinZugriff };
  });
  console.log('   Worker:', JSON.stringify(wk));
  ok('Worker rechnet', wk.gut && wk.gut.summe === 12 && wk.gut.schnitt === 4);
  ok('Fehler im Worker wird gemeldet', /nichtDa|not defined/i.test(wk.fehler));
  ok('Worker kommt nicht an die Seite', wk.keinZugriff === 'undefined');

  /* ---------------------------------------------------------------
   * 7) Schreibassistent
   * -------------------------------------------------------------*/
  const schreib = await p.evaluate(() => {
    const b = KI.SCHREIB_BEFEHLE.map(x => x.id);
    const vorher = Store.childrenOf(App.aktuelleSeite()).length;
    KI.alsBloeckeEinfuegen(
      '# Überschrift\n- Punkt eins\n- Punkt zwei\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n> Zitat');
    const kinder = Store.childrenOf(App.aktuelleSeite());
    return { befehle: b, neu: kinder.length - vorher,
             typen: kinder.slice(vorher).map(k => k.type) };
  });
  console.log('   Schreiben:', JSON.stringify(schreib));
  ok('16 Schreibbefehle', schreib.befehle.length === 16);
  ok('Ton-Befehle dabei', schreib.befehle.filter(x => x.startsWith('ton-')).length === 3);
  ok('Markdown wird zu echten Blöcken',
     schreib.typen.join(',') === 'h1,bullet,bullet,table,quote');

  /* ---------------------------------------------------------------
   * 8) MCP
   * -------------------------------------------------------------*/
  const mcp = await p.evaluate(async () => {
    const katalog = MCP.eigenerKatalog();
    const init = await MCP.beantworten({ jsonrpc: '2.0', id: 1, method: 'initialize' });
    const liste = await MCP.beantworten({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    const ruf = await MCP.beantworten({ jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'notizen_suchen', arguments: { frage: 'Fitnessziel' } } });
    const res = await MCP.beantworten({ jsonrpc: '2.0', id: 4, method: 'resources/list' });
    const nix = await MCP.beantworten({ jsonrpc: '2.0', id: 5, method: 'gibtsNicht' });

    Store.setMeta('mcp:freigabe', ['localhost']);
    const frei1 = MCP.istFrei('http://localhost:3000/mcp');
    const frei2 = MCP.istFrei('https://fremd.example.org/mcp');
    Store.setMeta('mcp:freigabe', []);

    Store.setMeta('mcp:eigenAus', ['seiteAnlegen']);
    const kleiner = MCP.eigenerKatalog().length;
    Store.setMeta('mcp:eigenAus', []);

    return { katalog: katalog.length, init: init.result?.serverInfo?.name,
             version: init.result?.protocolVersion,
             tools: liste.result?.tools?.length,
             ruf: (ruf.result?.content?.[0]?.text || '').slice(0, 40),
             res: res.result?.resources?.length, fehler: nix.error?.code,
             frei1, frei2, kleiner, vorher: katalog.length };
  });
  console.log('   MCP:', JSON.stringify(mcp));
  ok('MCP beantwortet initialize', mcp.init === 'Notizen' && mcp.version === MCPV());
  ok('MCP listet Werkzeuge', mcp.tools >= 11);
  ok('MCP ruft ein Werkzeug auf', /Fitness/i.test(mcp.ruf));
  ok('MCP listet Seiten als Ressourcen', mcp.res >= 4);
  ok('Unbekannte Methode gibt einen Fehlercode', mcp.fehler === -32601);
  ok('Freigabeliste sperrt fremde Server', mcp.frei1 === true && mcp.frei2 === false);
  ok('Einzelne Werkzeuge abschaltbar', mcp.kleiner === mcp.vorher - 1);

  function MCPV() { return '2024-11-05'; }

  /* ---------------------------------------------------------------
   * 9) Besprechungsnotizen
   * -------------------------------------------------------------*/
  const meet = await p.evaluate(() => {
    const t = Meeting.transkriptText([{ sek: 0, text: 'Wir starten.' }, { sek: 65, text: 'Ende.' }]);
    const seite = Meeting.seiteAnlegen({
      titel: 'Wochenrunde',
      zusammenfassung: ['Launch verschoben', 'Budget bleibt'],
      entscheidungen: ['Launch geht auf September'],
      aufgaben: [{ was: 'Presse informieren', wer: 'Red', bis: '2026-08-20' }],
      themen: ['Launch'], beteiligte: ['Red', 'Anna']
    }, t, 65, null);
    const kinder = Store.childrenOf(seite.id).map(k => k.type);
    const db = Object.values(Store.cache.collections)
      .find(c => c.name === 'Aufgaben aus Besprechungen');
    return { zeit: Meeting.zeitText(65), transkript: t, typen: kinder,
             todos: kinder.filter(x => x === 'todo').length,
             zitate: kinder.filter(x => x === 'quote').length,
             dbZeilen: db ? Store.rowsOf(db.id).length : 0,
             kannHoeren: typeof Meeting.kannZuhoeren() === 'boolean' };
  });
  console.log('   Besprechung:', JSON.stringify(meet).slice(0, 260));
  ok('Zeitstempel stimmen', meet.zeit === '01:05' && meet.transkript.includes('[01:05]'));
  ok('Seite bekommt Aufgaben als Kästchen', meet.todos === 1);
  ok('Entscheidungen werden Zitate', meet.zitate === 1);
  ok('Aufgaben landen auch in der Datenbank', meet.dbZeilen === 1);

  /* ---------------------------------------------------------------
   * 10) Alles überlebt das Neuladen
   * -------------------------------------------------------------*/
  await p.evaluate(() => Store.flush());
  await p.waitForTimeout(700);
  await p.reload();
  await p.waitForTimeout(1800);
  const nach = await p.evaluate(() => ({
    index: Kontext.holen(true).anzahl,
    treffer: Kontext.finden('Trainingsziel', { anzahl: 3 }).length,
    konten: Konten.alle().length,
    quellen: Object.keys(Kontext.quellen()).length
  }));
  console.log('   Nach dem Neuladen:', JSON.stringify(nach));
  ok('Index baut sich neu auf', nach.index >= 6 && nach.treffer >= 1);
  ok('Konten überleben', nach.konten >= 1);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
