/* Notions interne Befehle: set, update, listAfter, listBefore, listRemove
   und die drei Endpunkte loadPageChunk, queryCollection, submitTransaction */
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
  await p.waitForTimeout(1700);

  const auf = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Transaktionsprobe' });
    const k = ['A', 'B', 'C', 'D'].map(t => Store.addBlock(s.id, 'text', { text: t }).id);
    const db = Store.addDatabase(s.id, 'Sachen', {
      title: { name: 'Titel', type: 'title' },
      st:    { name: 'Status', type: 'select', options: ['Offen', 'Fertig'] },
      zahl:  { name: 'Zahl',  type: 'number' }
    });
    const c = Store.getCollection(db.collectionId);
    ['Eins', 'Zwei', 'Drei'].forEach((t, i) => {
      const z = Store.addRow(c.id, { st: i ? 'Fertig' : 'Offen', zahl: i + 1 });
      Store.updateBlock(z.id, { text: t });
    });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    return { seite: s.id, kinder: k, coll: c.id, view: db.viewId,
             token: Api.tokenNeu(), zeilen: Store.rowsOf(c.id).map(z => z.id) };
  });

  (ops: any, opt: any) => p.evaluate(([o, t]) => Transaktion.ausfuehren(o, t), [ops, opt || {}]);

  /* --- 1 · set ----------------------------------------------------------- */
  const gesetzt = await p.evaluate(async (x) => {
    const erg = Transaktion.ausfuehren([
      { id: x.seite, table: 'block', path: ['text'], command: 'set', args: 'Neu benannt' }
    ]);
    await new Promise(r => setTimeout(r, 200));
    return { erg, text: Store.getBlock(x.seite).text };
  }, auf);
  pruef('set geht durch',       gesetzt.erg.ok, true);
  pruef('Ein Befehl ausgeführt', gesetzt.erg.ausgefuehrt, 1);
  pruef('Und der Text steht',   gesetzt.text, 'Neu benannt');

  /* set tief im Objekt, mit Notions Pfadnamen */
  const tief = await p.evaluate(async (x) => {
    const erg = Transaktion.ausfuehren([
      { id: x.zeilen[0], table: 'block', path: ['properties', 'zahl'],
        command: 'set', args: 99 }
    ]);
    await new Promise(r => setTimeout(r, 200));
    return { erg, wert: Store.getBlock(x.zeilen[0]).props.zahl };
  }, auf);
  pruef('properties wird zu props übersetzt', tief.erg.ok, true);
  pruef('Und der Wert kommt an',              tief.wert, 99);

  /* --- 2 · update -------------------------------------------------------- */
  const aktualisiert = await p.evaluate(async (x) => {
    const vorher = { ...Store.getBlock(x.zeilen[1]).props };
    const erg = Transaktion.ausfuehren([
      { id: x.zeilen[1], table: 'block', path: ['properties'],
        command: 'update', args: { st: 'Offen' } }
    ]);
    await new Promise(r => setTimeout(r, 200));
    const nachher = Store.getBlock(x.zeilen[1]).props;
    return { erg, vorher, st: nachher.st, zahl: nachher.zahl };
  }, auf);
  pruef('update geht durch',         aktualisiert.erg.ok, true);
  pruef('Das neue Feld steht',       aktualisiert.st, 'Offen');
  pruef('Und das alte bleibt daneben', aktualisiert.zahl, aktualisiert.vorher.zahl);

  /* update auf oberster Ebene */
  const obenAuf = await p.evaluate(async (x) => {
    Transaktion.ausfuehren([
      { id: x.kinder[0], table: 'block', path: [], command: 'update',
        args: { text: 'Direkt geändert', color: 'blue' } }
    ]);
    await new Promise(r => setTimeout(r, 200));
    const bl = Store.getBlock(x.kinder[0] ?? '');
    return { text: bl.text, farbe: bl.color };
  }, auf);
  pruef('update ohne Pfad trifft den Satz', obenAuf.text, 'Direkt geändert');
  pruef('Und setzt auch das zweite Feld',   obenAuf.farbe, 'blue');

  /* --- 3 · listAfter, listBefore, listRemove ----------------------------- */
  const listen = await p.evaluate(async (x) => {
    const folge = () => Store.getBlock(x.seite).content
      .filter((id: string) => (x.kinder ?? '').includes(id))
      .map((id: string) => x.kinder.indexOf(id));

    const start = folge();
    /* Den ersten ganz nach hinten */
    Transaktion.ausfuehren([
      { id: x.seite, table: 'block', path: ['content'], command: 'listAfter',
        args: { id: x.kinder[0], after: x.kinder[3] } }
    ]);
    await new Promise(r => setTimeout(r, 150));
    const nachAfter = folge();

    /* Den letzten wieder ganz nach vorne */
    Transaktion.ausfuehren([
      { id: x.seite, table: 'block', path: ['content'], command: 'listBefore',
        args: { id: x.kinder[3], before: x.kinder[1] } }
    ]);
    await new Promise(r => setTimeout(r, 150));
    const nachBefore = folge();

    /* Einen herausnehmen */
    Transaktion.ausfuehren([
      { id: x.seite, table: 'block', path: ['content'], command: 'listRemove',
        args: { id: x.kinder[2] } }
    ]);
    await new Promise(r => setTimeout(r, 150));
    const nachRemove = folge();

    /* Ohne Anker: ans Ende bzw. an den Anfang */
    Transaktion.ausfuehren([
      { id: x.seite, table: 'block', path: ['content'], command: 'listAfter',
        args: { id: x.kinder[2] } }
    ]);
    await new Promise(r => setTimeout(r, 150));
    const wiederDrin = folge();

    /* Etwas herausnehmen, das nicht drin ist */
    const schief = Transaktion.ausfuehren([
      { id: x.seite, table: 'block', path: ['content'], command: 'listRemove',
        args: { id: 'stehtnichtdrin' } }
    ]);
    return { start, nachAfter, nachBefore, nachRemove, wiederDrin,
             schief: schief.ok, meldung: (schief.fehler[0] || {}).fehler };
  }, auf);
  pruef('Am Anfang in Reihe',      listen.start, [0, 1, 2, 3]);
  pruef('listAfter schiebt hinten hin', listen.nachAfter, [1, 2, 3, 0]);
  pruef('listBefore holt nach vorne',   listen.nachBefore, [3, 1, 2, 0]);
  pruef('listRemove nimmt heraus',      listen.nachRemove, [3, 1, 0]);
  pruef('listAfter ohne Anker hängt an', listen.wiederDrin, [3, 1, 0, 2]);
  pruef('Was nicht drin ist, geht nicht raus', listen.schief, false);
  pruef('Und wird gemeldet',
        (listen.meldung || '').includes('Steht nicht in der Liste'), true);

  /* --- 4 · Alles oder nichts --------------------------------------------- */
  const alleOderKeins = await p.evaluate(async (x) => {
    const vorher = Store.getBlock(x.seite).text;
    const erg = Transaktion.ausfuehren([
      { id: x.seite, table: 'block', path: ['text'], command: 'set', args: 'Kommt nicht an' },
      { id: 'gibtesnicht', table: 'block', path: ['text'], command: 'set', args: 'X' }
    ]);
    await new Promise(r => setTimeout(r, 250));
    return { erg, vorher, nachher: Store.getBlock(x.seite).text };
  }, auf);
  pruef('Die Transaktion scheitert',    alleOderKeins.erg.ok, false);
  pruef('Nichts wurde ausgeführt',      alleOderKeins.erg.ausgefuehrt, 0);
  pruef('Der alte Stand ist wieder da', alleOderKeins.nachher, alleOderKeins.vorher);
  pruef('Und es steht dabei, warum',
        (alleOderKeins.erg.hinweis || '').includes('ganz durch oder gar nicht'), true);

  /* Mit weiterMachen läuft der Rest trotzdem */
  const trotzdem = await p.evaluate(async (x) => {
    const erg = Transaktion.ausfuehren([
      { id: 'gibtesnicht', table: 'block', path: ['text'], command: 'set', args: 'X' },
      { id: x.seite, table: 'block', path: ['text'], command: 'set', args: 'Doch angekommen' }
    ], { weiterMachen: true });
    await new Promise(r => setTimeout(r, 200));
    return { erg, text: Store.getBlock(x.seite).text };
  }, auf);
  pruef('Mit weiterMachen: einer geht durch', trotzdem.erg.ausgefuehrt, 1);
  pruef('Und einer wird gemeldet',            trotzdem.erg.fehler.length, 1);
  pruef('Der zweite ist angekommen',          trotzdem.text, 'Doch angekommen');

  /* --- 5 · Unsinn -------------------------------------------------------- */
  const unsinn = await p.evaluate((x) => ({
    tabelle: Transaktion.befehlAusfuehren(
      { id: x.seite, table: 'gibtsnicht', path: ['text'], command: 'set', args: 'x' }),
    befehl: Transaktion.befehlAusfuehren(
      { id: x.seite, table: 'block', path: ['text'], command: 'zaubern', args: 'x' }),
    ohnePfad: Transaktion.befehlAusfuehren(
      { id: x.seite, table: 'block', path: [], command: 'set', args: 'x' }),
    leer: Transaktion.ausfuehren([])
  }), auf);
  pruef('Unbekannte Tabelle wird gemeldet',
        unsinn.tabelle.fehler?.includes('Unbekannte Tabelle'), true);
  pruef('Unbekannter Befehl auch',
        unsinn.befehl.fehler?.includes('Unbekannter Befehl'), true);
  pruef('set ohne Pfad geht nicht',   unsinn.ohnePfad.ok, false);
  pruef('Leere Liste ist in Ordnung', unsinn.leer.ok, true);

  /* --- 6 · Sammlungen und Ansichten -------------------------------------- */
  const andereTabellen = await p.evaluate(async (x) => {
    Transaktion.ausfuehren([
      { id: x.coll, table: 'collection', path: ['name'], command: 'set', args: 'Umbenannt' },
      { id: x.view, table: 'collection_view', path: ['name'], command: 'set', args: 'Andere Sicht' }
    ]);
    await new Promise(r => setTimeout(r, 200));
    return { coll: Store.getCollection(x.coll).name,
             view: Store.getView(x.view).name };
  }, auf);
  pruef('Eine Sammlung lässt sich ändern', andereTabellen.coll, 'Umbenannt');
  pruef('Eine Ansicht auch',               andereTabellen.view, 'Andere Sicht');

  /* --- 7 · Bausteine ----------------------------------------------------- */
  const bausteine = await p.evaluate((x) => ({
    setze:    Transaktion.setze(x.seite, ['text'], 'Y'),
    aendere:  Transaktion.aendere(x.seite, ['properties'], { a: 1 }),
    dahinter: Transaktion.dahinter(x.seite, ['content'], 'b1', 'b2'),
    davor:    Transaktion.davor(x.seite, ['content'], 'b1'),
    heraus:   Transaktion.heraus(x.seite, ['content'], 'b1')
  }), auf);
  pruef('setze baut set',        bausteine.setze.command, 'set');
  pruef('aendere baut update',   bausteine.aendere.command, 'update');
  pruef('dahinter mit Anker',    bausteine.dahinter.args, { id: 'b1', after: 'b2' });
  pruef('davor ohne Anker',      bausteine.davor.args, { id: 'b1' });
  pruef('heraus baut listRemove', bausteine.heraus.command, 'listRemove');

  /* --- 8 · loadPageChunk -------------------------------------------------- */
  const chunk = await p.evaluate((x) => Transaktion.loadPageChunk({ pageId: x.seite }), auf);
  pruef('loadPageChunk: 200',       chunk.status, 200);
  pruef('Es gibt eine recordMap',   typeof chunk.body?.recordMap, 'object');
  pruef('Die Seite selbst ist dabei', !!chunk.body?.recordMap?.block[auf.seite], true);
  pruef('Im Umschlag mit Rolle',
        chunk.body?.recordMap?.block[auf.seite].role, 'editor');
  pruef('Mit Notions Titelform',
        Array.isArray(chunk.body?.recordMap?.block[auf.seite].value.properties.title), true);
  pruef('Die Sammlung ist dabei',   !!chunk.body?.recordMap?.collection[auf.coll], true);
  pruef('Und die Ansicht',          !!chunk.body?.recordMap?.collection_view[auf.view], true);
  pruef('Auch die Zeilen',
        auf.zeilen.every(z => !!chunk.body?.recordMap?.block[z]), true);

  const chunkWeg = await p.evaluate(() => Transaktion.loadPageChunk({ pageId: 'nixda' }));
  pruef('Unbekannte Seite: 404',    chunkWeg.status, 404);
  pruef('Mit Notions Fehlernamen',  chunkWeg.body?.name, 'ObjectNotFound');

  const chunkKurz = await p.evaluate((x) =>
    Transaktion.loadPageChunk({ pageId: x.seite, limit: 2 }), auf);
  pruef('Die Grenze wird eingehalten',
        Object.keys(chunkKurz.body?.recordMap?.block ?? {}).length, 2);
  pruef('Und das wird gesagt',      chunkKurz.body?.isTaggedForLoad, true);

  /* --- 9 · queryCollection ------------------------------------------------ */
  const abfrage = await p.evaluate((x) =>
    Transaktion.queryCollection({ collectionId: x.coll }), auf);
  pruef('queryCollection: 200',   abfrage.status, 200);
  pruef('Vom Typ table',          abfrage.body?.result?.type, 'table');
  pruef('Drei Zeilen',            abfrage.body?.result?.blockIds.length, 3);
  pruef('Mit der Gesamtzahl',     abfrage.body?.result?.total, 3);
  pruef('Die Daten stehen in der recordMap',
        Object.keys(abfrage.body?.recordMap?.block ?? {}).length, 3);

  const gefiltert = await p.evaluate(async (x) => {
    Store.updateView(x.view, { filters: { operator: 'and',
      rules: [{ key: 'st', op: 'ist', wert: 'Fertig' }] } });
    await new Promise(r => setTimeout(r, 200));
    return Transaktion.queryCollection({ collectionId: x.coll, collectionViewId: x.view });
  }, auf);
  pruef('Der Filter der Ansicht greift', gefiltert.body?.result?.total, 1);

  const gesucht = await p.evaluate((x) => Transaktion.queryCollection(
    { collectionId: x.coll, loader: { searchQuery: 'ein' } }), auf);
  pruef('Auch die Suche greift', gesucht.body?.result?.total, 1);

  const abfrageWeg = await p.evaluate(() =>
    Transaktion.queryCollection({ collectionId: 'nixda' }));
  pruef('Unbekannte Sammlung: 404', abfrageWeg.status, 404);

  /* --- 10 · submitTransaction --------------------------------------------- */
  const eingereicht = await p.evaluate(async (x) => {
    const erg = Transaktion.submitTransaction({
      requestId: 'abc',
      transactions: [{ id: 't1', operations: [
        { id: x.seite, table: 'block', path: ['text'], command: 'set', args: 'Eingereicht' }
      ] }]
    });
    await new Promise(r => setTimeout(r, 200));
    return { erg, text: Store.getBlock(x.seite).text };
  }, auf);
  pruef('submitTransaction: 200', eingereicht.erg.status, 200);
  pruef('Und die Änderung greift', eingereicht.text, 'Eingereicht');

  const leerEingereicht = await p.evaluate(() => Transaktion.submitTransaction({}));
  pruef('Ohne Operationen: 400',  leerEingereicht.status, 400);
  pruef('Mit Notions Fehlernamen', leerEingereicht.body?.name, 'ValidationError');

  const schiefEingereicht = await p.evaluate(() => Transaktion.submitTransaction(
    { operations: [{ id: 'nixda', table: 'block', path: ['text'], command: 'set', args: 'x' }] }));
  pruef('Ein kaputter Befehl: 400', schiefEingereicht.status, 400);
  pruef('Und der Grund steht dabei',
        (schiefEingereicht.body?.message || '').includes('Kein Datensatz'), true);

  /* --- 11 · Der Weg über die Adresse -------------------------------------- */
  const ueberAdresse = await p.evaluate(async (x) => {
    const kopf = { authorization: 'Bearer ' + x.token };
    return {
      chunk: Transaktion.anfrage('POST', '/api/v3/loadPageChunk', { pageId: x.seite }, kopf).status,
      query: Transaktion.anfrage('POST', '/api/v3/queryCollection', { collectionId: x.coll }, kopf).status,
      fanout: Transaktion.anfrage('POST', '/api/v3/saveTransactionsFanout',
        { operations: [{ id: x.seite, table: 'block', path: ['text'],
                         command: 'set', args: 'Über Fanout' }] }, kopf).status,
      ohneToken: Transaktion.anfrage('POST', '/api/v3/loadPageChunk', { pageId: x.seite }, {}).status,
      falscheMethode: Transaktion.anfrage('GET', '/api/v3/loadPageChunk', {}, kopf).status,
      unbekannt: Transaktion.anfrage('POST', '/api/v3/gibtsnicht', {}, kopf).status,
      text: Store.getBlock(x.seite).text
    };
  }, auf);
  pruef('loadPageChunk über die Adresse',   ueberAdresse.chunk, 200);
  pruef('queryCollection ebenso',           ueberAdresse.query, 200);
  pruef('saveTransactionsFanout auch',      ueberAdresse.fanout, 200);
  pruef('Und die Änderung kam an',          ueberAdresse.text, 'Über Fanout');
  pruef('Ohne Token: 401',                  ueberAdresse.ohneToken, 401);
  pruef('GET geht nicht: 405',              ueberAdresse.falscheMethode, 405);
  pruef('Unbekannte Adresse: 404',          ueberAdresse.unbekannt, 404);

  /* --- 12 · Noch einmal abspielen ----------------------------------------- */
  const nochmal = await p.evaluate(async (x) => {
    Transaktion.ausfuehren([
      { id: x.seite, table: 'block', path: ['text'], command: 'set', args: 'Erste Fassung' }
    ]);
    await new Promise(r => setTimeout(r, 150));
    Transaktion.ausfuehren([
      { id: x.seite, table: 'block', path: ['text'], command: 'set', args: 'Zweite Fassung' }
    ]);
    await new Promise(r => setTimeout(r, 150));
    const jetzt = Store.getBlock(x.seite).text;
    /* Die vorletzte noch einmal — das ist „Erste Fassung" */
    const erg = Transaktion.abspielen(1);
    await new Promise(r => setTimeout(r, 200));
    return { jetzt, erg: erg.ok, danach: Store.getBlock(x.seite).text,
             gemerkt: Transaktion.verlauf.length };
  }, auf);
  pruef('Zuletzt die zweite Fassung', nochmal.jetzt, 'Zweite Fassung');
  pruef('Abspielen geht',             nochmal.erg, true);
  pruef('Und bringt die erste zurück', nochmal.danach, 'Erste Fassung');
  pruef('Der Verlauf wächst',         Number(nochmal.gemerkt ?? -1) > 2, true);
  pruef('Ein Abspielen ins Leere geht schief', await p.evaluate(() =>
    Transaktion.abspielen(999).ok), false);

  /* --- 13 · Eine Transaktion ist ein Schritt beim Rückgängigmachen -------- */
  const rueckgaengig = await p.evaluate(async (_x) => {
    const s = Store.addBlock(null, 'page', { text: 'Rückgängig' });
    const a = Store.addBlock(s.id, 'text', { text: 'Eins' });
    const c = Store.addBlock(s.id, 'text', { text: 'Zwei' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    /* Bis E684 wurde der Teilbaum beim Rueckgaengigmachen neu aufgebaut und
       die Bloecke bekamen neue IDs — deshalb vergleicht dieser Lauf den Text.
       Seit E684 bleiben die Kennungen (test569 haelt das); der Vergleich
       ueber den Text bleibt richtig und wird nicht angefasst. */
    const texte = () => Store.childrenOf(s.id).map((y: any) => y.text);
    Transaktion.ausfuehren([
      { id: a.id, table: 'block', path: ['text'], command: 'set', args: 'X' },
      { id: c.id, table: 'block', path: ['text'], command: 'set', args: 'Y' }
    ]);
    await new Promise(r => setTimeout(r, 400));
    const mitten = texte();
    Verlauf.zurueck();
    await new Promise(r => setTimeout(r, 600));
    return { mitten, danach: texte() };
  }, auf);
  pruef('Beide Befehle greifen',  rueckgaengig.mitten, ['X', 'Y']);
  pruef('Ein Rückgängig holt beide zurück', rueckgaengig.danach, ['Eins', 'Zwei']);

  /* --- 14 · Das Fenster ---------------------------------------------------- */
  const fenster = await p.evaluate(async (x) => {
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    document.getElementById('rg-einladung')?.remove();
    App.oeffne(x.seite);
    await new Promise(r => setTimeout(r, 400));
    Transaktion.dialog();
    await new Promise(r => setTimeout(r, 300));
    const o = document.querySelector('.overlay');
    if (!o) throw new Error('.overlay ist nicht da — der Lauf misst sonst nichts.');
    o?.querySelector<HTMLElement>('[data-bsp="titel"]')?.click();
    await new Promise(r => setTimeout(r, 120));
    const ops = o.querySelector<HTMLInputElement>('#tx-ops')?.value;
    o?.querySelector<HTMLElement>('[data-a="los"]')?.click();
    await new Promise(r => setTimeout(r, 350));
    const gut = o.querySelector<HTMLElement>('#tx-aus')?.textContent;

    o?.querySelector<HTMLElement>('[data-bsp="kaputt"]')?.click();
    await new Promise(r => setTimeout(r, 120));
    o?.querySelector<HTMLElement>('[data-a="los"]')?.click();
    await new Promise(r => setTimeout(r, 350));
    const schlecht = o.querySelector<HTMLElement>('#tx-aus')?.textContent;

    o?.querySelector<HTMLElement>('[data-a="chunk"]')?.click();
    await new Promise(r => setTimeout(r, 250));
    const chunkText = o.querySelector<HTMLElement>('#tx-aus')?.textContent;

    const _ziel480 = o.querySelector<HTMLInputElement>('#tx-ops');

    if (!_ziel480) throw new Error('#tx-ops ist nicht da — der Lauf misst sonst nichts.');

    _ziel480.value = 'kein json';
    o?.querySelector<HTMLElement>('[data-a="los"]')?.click();
    await new Promise(r => setTimeout(r, 200));
    const meckert = o.querySelector<HTMLElement>('#tx-aus')?.textContent;
    const breit = (o.querySelector('.finder') ?? document.body).getBoundingClientRect();
    document.querySelectorAll<HTMLElement>('.overlay').forEach(y => y.remove());
    return { ops, gut, schlecht, chunkText, meckert, passt: breit.right <= innerWidth + 1 };
  }, auf);
  pruef('Das Beispiel setzt Operationen ein', fenster.ops?.includes('"command": "set"'), true);
  pruef('Es meldet Erfolg',        fenster.gut?.startsWith('✅'), true);
  pruef('Und beim kaputten Fehlschlag', fenster.schlecht?.startsWith('⛔'), true);
  pruef('loadPageChunk zeigt die recordMap', fenster.chunkText?.includes('recordMap'), true);
  pruef('Kaputtes JSON wird gemeldet', fenster.meckert?.includes('kein gültiges JSON'), true);
  pruef('Das Fenster passt',       fenster.passt, true);

  /* --- 15 · In der Befehlspalette ------------------------------------------ */
  const palette = await p.evaluate(async () => {
    Werkzeuge.palette();
    await new Promise(r => setTimeout(r, 250));
    const inp = document.querySelector<HTMLInputElement>('#cq');
    if (!inp) throw new Error('#cq ist nicht da — der Lauf misst sonst nichts.');
    inp.value = 'Interne Befehle';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const t = (document.querySelector('#cr button') || {}).textContent || '';
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return (t ?? '').includes('Interne Befehle');
  });
  pruef('In der Befehlspalette zu finden', palette, true);

  /* --- 16 · Am Telefon ------------------------------------------------------ */
  const handy = await b.newPage({ viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true });
  const fehler2: any[] = [];
  handy.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await handy.goto('file://' + WURZEL + '/index.html');
  await handy.waitForTimeout(1800);
  const amHandy = await handy.evaluate(async () => {
    Transaktion.dialog();
    await new Promise(r => setTimeout(r, 300));
    const f = (document.querySelector('.overlay .finder') ?? document.body).getBoundingClientRect();
    const raus = f.right > innerWidth + 1 || f.left < -1;
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return raus;
  });
  pruef('Auch am Telefon passt es', amHandy, false);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  const alleF = [...fehler, ...fehler2];
  console.log(alleF.length ? 'JS-Fehler:\n' + alleF.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || alleF.length ? 1 : 0);
})();
