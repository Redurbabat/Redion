/* Die Schnittstelle unter /v1/ — in Notions Form, im Browser beantwortet */
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

  /* --- 0 · Aufbau: eine Seite und eine Datenbank ------------------------- */
  const auf = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'API-Probe' });
    Store.addBlock(s.id, 'text', { text: 'Erster Absatz' });
    Store.addBlock(s.id, 'h2',   { text: 'Eine Überschrift' });
    Store.addBlock(s.id, 'todo', { text: 'Offen', checked: false });
    const db = Store.addDatabase(s.id, 'Aufgaben', {
      title: { name: 'Titel',  type: 'title' },
      st:    { name: 'Status', type: 'select', options: ['Offen', 'Fertig'] },
      zahl:  { name: 'Zahl',   type: 'number' },
      wann:  { name: 'Wann',   type: 'date' },
      haken: { name: 'Haken',  type: 'checkbox' },
      viele: { name: 'Viele',  type: 'multi' },
      netz:  { name: 'Netz',   type: 'url' },
      rechne:{ name: 'Doppelt',type: 'formula', formula: 'prop("Zahl") * 2' }
    });
    const c = Store.getCollection(db.collectionId);
    ['Eins', 'Zwei', 'Drei'].forEach((t, i) => {
      const z = Store.addRow(c.id, { st: i === 2 ? 'Fertig' : 'Offen', zahl: (i + 1) * 10,
                                     wann: '2026-08-0' + (i + 1), haken: i === 0,
                                     viele: ['A', 'B'].slice(0, i + 1),
                                     netz: 'https://redion.ch/' + t });
      Store.updateBlock(z.id, { text: t });
    });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 500));
    Api.tokenNeu();
    return { seite: s.id, coll: c.id, token: Api.tokenHolen(),
             zeilen: Store.rowsOf(c.id).map(z => z.id) };
  }) as any;
  /* Was aus `Api.anfrage` zurückkommt: ein Status und ein Körper. WELCHE
     Felder der Körper trägt, hängt an der Adresse — bei `/v1/users/me` ein
     Konto, bei einem Fehler `code` und `message`. Deshalb steht hier ein
     offener Satz und keine Aufzählung: eine Aufzählung wäre entweder
     unvollständig oder eine Abschrift des Servers, die mit ihm auseinander
     läuft. */
  type ApiAntwort = { status: number; body: Record<string, any> };


  const ruf = (m: any, pfad: any, k: any, kopf: any): Promise<ApiAntwort> => p.evaluate(([m2, pfad2, k2, kopf2]) =>
    Api.anfrage(m2, pfad2, k2, kopf2), [m, pfad, k || {}, kopf]);

  const gut = (extra?: any) => Object.assign({ 'notion-version': '2022-06-28',
    authorization: 'Bearer ' + auf.token }, extra || {});

  /* --- 1 · Fassung und Token -------------------------------------------- */
  const ohneFassung = await ruf('GET', '/v1/users/me', {}, { authorization: 'Bearer ' + auf.token });
  pruef('Ohne Fassung: 400',            ohneFassung.status, 400);
  pruef('Mit dem Code missing_version', ohneFassung.body?.code, 'missing_version');
  pruef('Und einer Nachricht dazu',     (ohneFassung.body?.message ?? '').includes('Notion-Version'), true);
  pruef('Als Fehlerobjekt',             ohneFassung.body?.object, 'error');
  pruef('Mit einer Anfrage-Nummer',     typeof ohneFassung.body?.request_id, 'string');

  const falsch = await ruf('GET', '/v1/users/me', {},
    { 'notion-version': '2022-06-28', authorization: 'Bearer falsch' });
  pruef('Falsches Token: 401',   falsch.status, 401);
  pruef('Code unauthorized',     falsch.body?.code, 'unauthorized');

  const ohneToken = await ruf('GET', '/v1/users/me', {}, { 'notion-version': '2022-06-28' });
  pruef('Ganz ohne Token: 401',  ohneToken.status, 401);

  /* --- 2 · Nutzer --------------------------------------------------------- */
  const ich = await ruf('GET', '/v1/users/me', {}, gut());
  pruef('users/me antwortet',    ich.status, 200);
  pruef('Als Nutzerobjekt',      ich.body?.object, 'user');
  const alle = await ruf('GET', '/v1/users', {}, gut());
  pruef('users gibt eine Liste', alle.body?.object, 'list');
  pruef('Mit genau einem',       alle.body?.results.length, 1);

  /* --- 3 · Eine Seite lesen ---------------------------------------------- */
  const seite = await ruf('GET', '/v1/pages/' + auf.seite, {}, gut());
  pruef('Seite gefunden',         seite.status, 200);
  pruef('Objekt heisst page',     seite.body?.object, 'page');
  pruef('Mit der richtigen ID',   seite.body?.id, auf.seite);
  pruef('Der Titel steht drin',
        seite.body?.properties.title.title[0].plain_text, 'API-Probe');
  pruef('Elternteil ist der Arbeitsbereich', seite.body?.parent.type, 'workspace');
  pruef('Nicht archiviert',       seite.body?.archived, false);

  const weg = await ruf('GET', '/v1/pages/gibtesnicht', {}, gut());
  pruef('Unbekannte Seite: 404',  weg.status, 404);
  pruef('Code object_not_found',  weg.body?.code, 'object_not_found');

  /* --- 4 · Eine Zeile mit allen Typen ------------------------------------ */
  const zeile = await ruf('GET', '/v1/pages/' + auf.zeilen[0], {}, gut());
  const pr = zeile.body?.properties;
  pruef('Zeile gefunden',        zeile.status, 200);
  pruef('Elternteil ist die Datenbank', zeile.body?.parent.database_id, auf.coll);
  pruef('Titel als title',       pr.title.type, 'title');
  pruef('Mit dem Text',          pr.title.title[0].plain_text, 'Eins');
  pruef('Auswahl als select',    pr.st.select, { name: 'Offen' });
  pruef('Zahl als Zahl',         pr.zahl.number, 10);
  pruef('Datum als date',        pr.wann.date, { start: '2026-08-01', end: null, time_zone: null });
  pruef('Haken als checkbox',    pr.haken.checkbox, true);
  pruef('Mehrfach als multi_select', pr.viele.multi_select, [{ name: 'A' }]);
  pruef('URL als url',           pr.netz.url, 'https://redion.ch/Eins');
  pruef('Formel mit Typ und Wert', pr.rechne.formula, { type: 'number', number: 20 });

  /* Einen einzelnen Wert abrufen */
  const einzeln = await ruf('GET', '/v1/pages/' + auf.zeilen[0] + '/properties/zahl', {}, gut());
  pruef('Einzelner Wert: 200',      einzeln.status, 200);
  pruef('Als property_item',        einzeln.body?.object, 'property_item');
  pruef('Mit dem Wert',             einzeln.body?.number, 10);
  const einzelnWeg = await ruf('GET', '/v1/pages/' + auf.zeilen[0] + '/properties/nixda', {}, gut());
  pruef('Unbekannte Eigenschaft: 404', einzelnWeg.status, 404);

  /* --- 5 · Eine Seite anlegen und ändern --------------------------------- */
  const neu = await ruf('POST', '/v1/pages', {
    parent: { page_id: auf.seite },
    properties: { title: { title: [{ text: { content: 'Von der API' } }] } },
    icon: { emoji: '🔌' },
    children: [
      { object: 'block', type: 'paragraph',
        paragraph: { rich_text: [{ text: { content: 'Auch der Inhalt kommt mit.' } }] } },
      { object: 'block', type: 'to_do',
        to_do: { rich_text: [{ text: { content: 'Noch offen' } }], checked: false } }
    ]
  }, gut());
  pruef('Seite angelegt',   neu.status, 200);
  pruef('Mit dem Titel',    neu.body?.properties.title.title[0].plain_text, 'Von der API');
  pruef('Und dem Symbol',   neu.body?.icon.emoji, '🔌');

  const kinder = await ruf('GET', '/v1/blocks/' + neu.body?.id + '/children', {}, gut());
  pruef('Zwei Kindblöcke',  kinder.body?.results.length, 2);
  pruef('Der erste ist ein Absatz', kinder.body?.results[0].type, 'paragraph');
  pruef('Mit dem Text',
        kinder.body?.results[0].paragraph.rich_text[0].plain_text, 'Auch der Inhalt kommt mit.');
  pruef('Der zweite eine Aufgabe',  kinder.body?.results[1].type, 'to_do');
  pruef('Noch nicht abgehakt',      kinder.body?.results[1].to_do.checked, false);

  const geaendert = await ruf('PATCH', '/v1/pages/' + neu.body?.id, {
    properties: { title: { title: [{ text: { content: 'Umbenannt' } }] } }
  }, gut());
  pruef('Umbenennen geht', geaendert.body?.properties.title.title[0].plain_text, 'Umbenannt');

  /* --- 6 · Eine Zeile über die API anlegen ------------------------------- */
  const neueZeile = await ruf('POST', '/v1/pages', {
    parent: { database_id: auf.coll },
    properties: {
      Titel:  { title: [{ text: { content: 'Vier' } }] },
      Status: { select: { name: 'Fertig' } },
      Zahl:   { number: 40 },
      Haken:  { checkbox: true },
      Viele:  { multi_select: [{ name: 'C' }] }
    }
  }, gut());
  pruef('Zeile angelegt',       neueZeile.status, 200);
  pruef('Mit dem Titel',        neueZeile.body?.properties.title.title[0].plain_text, 'Vier');
  pruef('Und dem Status',       neueZeile.body?.properties.st.select.name, 'Fertig');
  pruef('Die Formel rechnet mit', neueZeile.body?.properties.rechne.formula.number, 80);

  const angekommen = await p.evaluate((x) => {
    const z = Store.rowsOf(x.coll).find(y => y.text === 'Vier');
    return { text: z.text, st: z.props.st, zahl: z.props.zahl, haken: z.props.haken };
  }, auf);
  pruef('Die Zeile steht wirklich im Speicher',
        angekommen, { text: 'Vier', st: 'Fertig', zahl: 40, haken: true });

  /* --- 7 · Abfragen mit Filter und Sortierung ---------------------------- */
  const abfrage = await ruf('POST', '/v1/databases/' + auf.coll + '/query', {
    filter: { property: 'Status', select: { equals: 'Offen' } }
  }, gut());
  pruef('Abfrage antwortet',   abfrage.status, 200);
  pruef('Als Liste',           abfrage.body?.object, 'list');
  pruef('Zwei Treffer',        abfrage.body?.results.length, 2);
  pruef('Beide sind offen',
        abfrage.body?.results.every((r: any) => r.properties.st.select.name === 'Offen'), true);
  pruef('Nichts mehr danach',  abfrage.body?.has_more, false);

  const undFilter = await ruf('POST', '/v1/databases/' + auf.coll + '/query', {
    filter: { and: [ { property: 'Status', select: { equals: 'Offen' } },
                     { property: 'Zahl',   number: { greater_than: 15 } } ] }
  }, gut());
  pruef('UND-Filter greift',   undFilter.body?.results.length, 1);
  pruef('Und trifft den richtigen',
        undFilter.body?.results[0].properties.title.title[0].plain_text, 'Zwei');

  const oderFilter = await ruf('POST', '/v1/databases/' + auf.coll + '/query', {
    filter: { or: [ { property: 'Zahl', number: { equals: 10 } },
                    { property: 'Zahl', number: { equals: 40 } } ] }
  }, gut());
  pruef('ODER-Filter greift',  oderFilter.body?.results.length, 2);

  const sortiert = await ruf('POST', '/v1/databases/' + auf.coll + '/query', {
    sorts: [{ property: 'Zahl', direction: 'descending' }]
  }, gut());
  pruef('Absteigend sortiert',
        sortiert.body?.results.map((r: any) => r.properties.zahl.number), [40, 30, 20, 10]);

  const seitenweise = await ruf('POST', '/v1/databases/' + auf.coll + '/query',
    { page_size: 2, sorts: [{ property: 'Zahl', direction: 'ascending' }] }, gut());
  pruef('Zwei je Seite',       seitenweise.body?.results.length, 2);
  pruef('Es geht weiter',      seitenweise.body?.has_more, true);
  pruef('Mit einem Zeiger',    typeof seitenweise.body?.next_cursor, 'string');

  const zweiteSeite = await ruf('POST', '/v1/databases/' + auf.coll + '/query',
    { page_size: 2, start_cursor: seitenweise.body?.next_cursor,
      sorts: [{ property: 'Zahl', direction: 'ascending' }] }, gut());
  pruef('Die zweite Seite kommt', zweiteSeite.body?.results.length, 2);
  pruef('Und ist dann zu Ende',   zweiteSeite.body?.has_more, false);
  pruef('Ohne Überschneidung',
        zweiteSeite.body?.results.map((r: any) => r.properties.zahl.number), [30, 40]);

  /* --- 8 · Die Datenbank selbst ------------------------------------------ */
  const db = await ruf('GET', '/v1/databases/' + auf.coll, {}, gut()) as any;
  pruef('Datenbank gefunden',   db.status, 200);
  pruef('Objekt heisst database', db.body?.object, 'database');
  pruef('Mit dem Namen',        db.body?.title[0].plain_text, 'Aufgaben');
  pruef('Acht Eigenschaften',   Object.keys(db.body?.properties).length, 8);
  pruef('Die Auswahl hat Optionen',
        db.body?.properties.st.select.options.map((o: any) => o.name), ['Offen', 'Fertig']);
  pruef('Die Formel steht als Ausdruck',
        db.body?.properties.rechne.formula.expression, 'prop("Zahl") * 2');

  const dbNeu = await ruf('POST', '/v1/databases', {
    parent: { page_id: auf.seite },
    title: [{ text: { content: 'Über die API gebaut' } }],
    properties: { Name: { title: {} }, Menge: { number: {} },
                  Sorte: { select: { options: [{ name: 'X' }, { name: 'Y' }] } } }
  }, gut());
  pruef('Datenbank angelegt',   dbNeu.status, 200);
  pruef('Mit dem Namen',        dbNeu.body?.title[0].plain_text, 'Über die API gebaut');
  pruef('Drei Eigenschaften',   Object.keys(dbNeu.body?.properties).length, 3);

  /* --- 9 · Blöcke -------------------------------------------------------- */
  const bloecke = await ruf('GET', '/v1/blocks/' + auf.seite + '/children', {}, gut());
  pruef('Kindblöcke der Seite', bloecke.status, 200);
  const typen = bloecke.body?.results.map((x: any) => x.type);
  pruef('Absatz, Überschrift, Aufgabe dabei',
        ['paragraph', 'heading_2', 'to_do'].every(t => (typen ?? '').includes(t)), true);
  pruef('Die Datenbank als child_database', (typen ?? '').includes('child_database'), true);

  const einBlock = bloecke.body?.results.find((x: any) => x.type === 'heading_2');
  const geholt = await ruf('GET', '/v1/blocks/' + einBlock.id, {}, gut());
  pruef('Einzelner Block',      geholt.body?.id, einBlock.id);
  pruef('Mit seinem Text',      geholt.body?.heading_2.rich_text[0].plain_text, 'Eine Überschrift');

  const blockNeu = await ruf('PATCH', '/v1/blocks/' + auf.seite + '/children', {
    children: [{ object: 'block', type: 'quote',
                 quote: { rich_text: [{ text: { content: 'Angehängt' } }] } }]
  }, gut());
  pruef('Angehängt',            blockNeu.status, 200);
  pruef('Als Zitat',            blockNeu.body?.results[0].type, 'quote');

  const blockGeaendert = await ruf('PATCH', '/v1/blocks/' + einBlock.id, {
    type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Anders' } }] }
  }, gut());
  pruef('Block geändert',       blockGeaendert.body?.heading_2.rich_text[0].plain_text, 'Anders');

  const blockWeg = await ruf('DELETE', '/v1/blocks/' + einBlock.id, {}, gut());
  pruef('Block gelöscht',       blockWeg.body?.archived, true);
  pruef('Und wirklich weg', await p.evaluate((id) =>
    Store.getBlock(id).alive === false, einBlock.id), true);

  /* --- 10 · Suchen -------------------------------------------------------- */
  const suche = await ruf('POST', '/v1/search', { query: 'Aufgaben' }, gut());
  pruef('Suche antwortet',   suche.status, 200);
  pruef('Findet die Datenbank',
        suche.body?.results.some((r: any) => r.object === 'database'), true);

  const nurSeiten = await ruf('POST', '/v1/search',
    { query: '', filter: { property: 'object', value: 'page' } }, gut());
  pruef('Nur Seiten',
        nurSeiten.body?.results.every((r: any) => r.object === 'page'), true);

  const nurDbs = await ruf('POST', '/v1/search',
    { query: '', filter: { property: 'object', value: 'database' } }, gut());
  pruef('Nur Datenbanken',
        nurDbs.body?.results.every((r: any) => r.object === 'database'), true);

  /* --- 11 · Kommentare ---------------------------------------------------- */
  const kommNeu = await ruf('POST', '/v1/comments', {
    parent: { page_id: auf.zeilen[0] },
    rich_text: [{ text: { content: 'Ein Kommentar von aussen' } }]
  }, gut());
  pruef('Kommentar geschrieben', kommNeu.status, 200);
  pruef('Als comment',           kommNeu.body?.object, 'comment');

  const kommListe = await ruf('GET', '/v1/comments', { block_id: auf.zeilen[0] }, gut());
  pruef('Und wieder lesbar',     kommListe.body?.results.length, 1);
  pruef('Mit dem Text',
        kommListe.body?.results[0].rich_text[0].plain_text, 'Ein Kommentar von aussen');

  /* --- 12 · Unbekanntes --------------------------------------------------- */
  const unbekannt = await ruf('GET', '/v1/gibtsnicht', {}, gut());
  pruef('Unbekannter Pfad: 404', unbekannt.status, 404);
  const falscheMethode = await ruf('DELETE', '/v1/pages/' + auf.seite, {}, gut());
  pruef('Falsche Methode: 405',  falscheMethode.status, 405);

  /* --- 13 · Das Fenster ---------------------------------------------------- */
  const fenster = await p.evaluate(async () => {
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    document.getElementById('rg-einladung')?.remove();   /* traegt auch ein data-a="los" */
    Api.dialog();
    await new Promise(r => setTimeout(r, 300));
    const o = document.querySelector('.overlay');
    if (!o) throw new Error('.overlay ist nicht da — der Lauf misst sonst nichts.');
    const tokenSichtbar = o.querySelector<HTMLInputElement>('#api-token')?.value.startsWith('redion_');
    o?.querySelector<HTMLElement>('[data-a="los"]')?.click();
    await new Promise(r => setTimeout(r, 250));
    const antwort = o.querySelector<HTMLElement>('#api-aus')?.textContent;
    /* Ein Beispiel einsetzen */
    o?.querySelector<HTMLElement>('[data-bsp="1"]')?.click();
    await new Promise(r => setTimeout(r, 120));
    const pfad = o.querySelector<HTMLInputElement>('#api-p')?.value;
    o?.querySelector<HTMLElement>('[data-a="los"]')?.click();
    await new Promise(r => setTimeout(r, 250));
    const zweite = o.querySelector<HTMLElement>('#api-aus')?.textContent;
    /* Ein kaputter Körper wird gemeldet */
    const _ziel292 = o.querySelector<HTMLInputElement>('#api-k');
    if (!_ziel292) throw new Error('#api-k ist nicht da — der Lauf misst sonst nichts.');
    _ziel292.value = 'kein json';
    o?.querySelector<HTMLElement>('[data-a="los"]')?.click();
    await new Promise(r => setTimeout(r, 200));
    const meckert = o.querySelector<HTMLElement>('#api-aus')?.textContent;
    const breit = (o.querySelector('.finder') ?? document.body).getBoundingClientRect();
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return { tokenSichtbar, antwort, pfad, zweite, meckert,
             passt: breit.right <= innerWidth + 1 };
  });
  pruef('Das Token steht im Fenster', fenster.tokenSichtbar, true);
  pruef('Die erste Antwort ist 200',  fenster.antwort?.startsWith('HTTP 200'), true);
  pruef('Das Beispiel setzt den Pfad', fenster.pfad, '/v1/search');
  pruef('Und liefert eine Liste',      fenster.zweite?.includes('"object": "list"'), true);
  pruef('Kaputtes JSON wird gemeldet', fenster.meckert?.includes('kein gültiges JSON'), true);
  pruef('Das Fenster passt',           fenster.passt, true);

  /* --- 14 · Token zurückziehen -------------------------------------------- */
  const nachRuecknahme = await p.evaluate(() => {
    Api.tokenWeg();
    const r = Api.anfrage('GET', '/v1/users/me', {},
      { 'notion-version': '2022-06-28', authorization: 'Bearer irgendwas' });
    const t = Api.tokenNeu();
    return { status: r.status, code: (r.body as Record<string, any>)?.code,
             neuesToken: t.startsWith('redion_') };
  });
  pruef('Ohne Token kommt 401',        nachRuecknahme.status, 401);
  pruef('Mit einem klaren Hinweis',    nachRuecknahme.code, 'unauthorized');
  pruef('Ein neues Token entsteht',    nachRuecknahme.neuesToken, true);

  /* --- 15 · Über die Befehlspalette --------------------------------------- */
  const palette = await p.evaluate(async () => {
    Werkzeuge.palette();
    await new Promise(r => setTimeout(r, 250));
    const inp = document.querySelector<HTMLInputElement>('#cq');
    if (!inp) throw new Error('#cq ist nicht da — der Lauf misst sonst nichts.');
    inp.value = 'Schnittstelle';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    const t = (document.querySelector('#cr button') || {}).textContent || '';
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return (t ?? '').includes('Schnittstelle');
  });
  pruef('In der Befehlspalette', palette, true);

  /* --- 16 · Nach dem Neustart bleibt das Token ---------------------------- */
  const vorher = await p.evaluate(async () => { await Store.flush(); return Api.tokenHolen(); });
  await p.reload();
  await p.waitForTimeout(2000);
  const nachher = await p.evaluate(() => Api.tokenHolen());
  pruef('Das Token überlebt den Neustart', nachher, vorher);

  /* --- 17 · Am Telefon ----------------------------------------------------- */
  const handy = await b.newPage({ viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true });
  const fehler2: any[] = [];
  handy.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await handy.goto('file://' + WURZEL + '/index.html');
  await handy.waitForTimeout(1800);
  const amHandy = await handy.evaluate(async () => {
    Api.dialog();
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
