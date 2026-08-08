/* Zeitstrahl mit Zoom + Pfeilen, Board-Bahnen, gruppierte Tabelle, Kartenbild */
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 950 } });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1400);
  /* KEIN ERSTBESUCHER — das Willkommen wegräumen (E55).
     Seit §11 legt sich beim allerersten Öffnen ein Blatt über den ganzen
     Bildschirm. Für den, der Redion zum ersten Mal sieht, ist das richtig;
     hier misst niemand zum ersten Mal, und Playwright wartet dann
     sechzig Sekunden darauf, dass ein Knopf darunter anklickbar wird. */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });

  const erg = await p.evaluate(async () => {
    const out: Record<string, any> = {};
    /* --- Testdaten anlegen --------------------------------------------- */
    const seite = Store.addBlock(null, 'page', { text: 'Zeitplan-Test' });
    const db = Store.addDatabase(seite.id, 'Aufgaben', {
      title:  { name: 'Aufgabe', type: 'title' },
      start:  { name: 'Start',   type: 'date' },
      ende:   { name: 'Ende',    type: 'date' },
      team:   { name: 'Team',    type: 'select', options: [
                 { name: 'Bau', color: 'blue' }, { name: 'Plan', color: 'green' } ] },
      status: { name: 'Status',  type: 'select', options: [
                 { name: 'Offen', color: 'gray' }, { name: 'Fertig', color: 'green' } ] },
      kosten: { name: 'Kosten',  type: 'number' },
      vor:    { name: 'Hängt ab von', type: 'relation', ziel: null }
    }, 'timeline');
    const coll = Store.getCollection(db.collectionId);
    /* Selbstverknüpfung */
    coll.schema.vor.ziel = coll.id;
    Store.updateCollection(coll.id, { schema: coll.schema });

    const a = Store.addRow(coll.id, { title: 'Fundament', start: '2026-03-01', ende: '2026-03-10',
                                      team: 'Bau', status: 'Fertig', kosten: 1000 });
    const b2 = Store.addRow(coll.id, { title: 'Mauern', start: '2026-03-12', ende: '2026-03-25',
                                       team: 'Bau', status: 'Offen', kosten: 2500, vor: [a.id] });
    Store.addRow(coll.id, { title: 'Dach', start: '2026-04-02', ende: '2026-04-20',
                                       team: 'Bau', status: 'Offen', kosten: 4000, vor: [b2.id] });
    Store.addRow(coll.id, { title: 'Genehmigung', start: '2026-02-10', ende: '2026-02-20',
                            team: 'Plan', status: 'Fertig', kosten: 300 });
    Store.updateView(db.viewId, { startKey: 'start', endeKey: 'ende', abhKey: 'vor' });
    out.viewId = db.viewId; out.collId = coll.id; out.seite = seite.id;
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 500));

    /* --- 1. Zeitstrahl --------------------------------------------------- */
    out.zoomKnoepfe = document.querySelectorAll('.zs-zoom button').length;
    out.balken      = document.querySelectorAll('.zs-balken').length;
    out.namen       = document.querySelectorAll('.zs-name').length;
    out.pfeile      = document.querySelectorAll('.zs-pfeile path[marker-end]').length;
    out.aktiveStufe = (document.querySelector('.zs-zoom button.an') || {}).textContent;
    out.griffe      = document.querySelectorAll('.zs-griff').length;
    return out;
  });

  /* Zoom auf Tag umschalten */
  await p.click('.zs-zoom button[data-zoom="tag"]');
  await p.waitForTimeout(400);
  const nachZoom = await p.evaluate(() => ({
    aktiv:  (document.querySelector('.zs-zoom button.an') || {}).textContent,
    breite: Math.round((document.querySelector('.zs-flaeche') ?? document.body).getBoundingClientRect().width),
    kopf:   document.querySelectorAll('.zs-kopf span').length
  }));
  await p.click('.zs-zoom button[data-zoom="monat"]');
  await p.waitForTimeout(300);
  const nachMonat = await p.evaluate(() =>
    Math.round((document.querySelector('.zs-flaeche') ?? document.body).getBoundingClientRect().width));

  /* Balken verschieben */
  const vorher = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Aufgaben');
    return Store.rowsOf(c.id).find(r => r.text === 'Dach')?.props.start;
  });
  const box = await p.evaluate(() => {
    const b = [...document.querySelectorAll<HTMLElement>('.zs-balken')].find(x => (x.textContent ?? '').includes('Dach'));
    if (!b) throw new Error('b ist nicht da — der Lauf misst sonst nichts.');
    const r = b.getBoundingClientRect();
    return { x: r.left + 8, y: r.top + 12 };
  });
  await p.mouse.move(box.x, box.y);
  await p.mouse.down();
  await p.mouse.move(box.x + 25, box.y, { steps: 6 });
  await p.mouse.up();
  await p.waitForTimeout(500);
  const nachher = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Aufgaben');
    return Store.rowsOf(c.id).find(r => r.text === 'Dach')?.props.start;
  });

  /* --- 2. Board mit Bahnen --------------------------------------------- */
  const board = await p.evaluate(async () => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Aufgaben');
    const v = Object.values(Store.cache.views).find(x => x.collectionId === c.id);
    Store.updateView(v.id, { layout: 'board', groupBy: 'status', bahnKey: 'team' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 400));
    return {
      bahnen:  document.querySelectorAll('.bahn').length,
      koepfe:  [...document.querySelectorAll<HTMLElement>('.bahn-kopf b')].map(x => x.textContent),
      boards:  document.querySelectorAll('.bahn .board').length,
      karten:  document.querySelectorAll('.bahn .card').length
    };
  });

  /* --- 3. Gruppierte Tabelle mit Summe ---------------------------------- */
  const gruppen = await p.evaluate(async () => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Aufgaben');
    const v = Object.values(Store.cache.views).find(x => x.collectionId === c.id);
    Store.updateView(v.id, { layout: 'table', bahnKey: '', groupBy: 'team',
                             calc: { kosten: 'Summe' } });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 400));
    return {
      gruppen: document.querySelectorAll('.tg').length,
      titel:   [...document.querySelectorAll<HTMLElement>('.tg-kopf .tag')].map(x => x.textContent),
      summen:  [...document.querySelectorAll<HTMLElement>('.tg-summe')].map(x => (x.textContent ?? '').trim()),
      tabellen: document.querySelectorAll('.tg-inhalt table').length
    };
  });

  /* Nach Datum gruppieren, Zeitabschnitt Monat */
  const nachDatum = await p.evaluate(async () => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Aufgaben');
    const v = Object.values(Store.cache.views).find(x => x.collectionId === c.id);
    Store.updateView(v.id, { groupBy: 'start', gruppeZeit: 'monat' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 350));
    const monate = [...document.querySelectorAll<HTMLElement>('.tg-kopf .tag')].map(x => x.textContent);
    Store.updateView(v.id, { gruppeZeit: 'quartal' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 350));
    const quartale = [...document.querySelectorAll<HTMLElement>('.tg-kopf .tag')].map(x => x.textContent);
    return { monate, quartale };
  });

  /* Gruppe zuklappen */
  await p.click('.tg-kopf');
  await p.waitForTimeout(350);
  const zugeklappt = await p.evaluate(() =>
    ({ pfeil: document.querySelector<HTMLElement>('.tg-pfeil')?.textContent,
       inhalte: document.querySelectorAll('.tg-inhalt').length }));

  console.log(JSON.stringify({
    zeitstrahl: erg, nachZoom, monatBreite: nachMonat,
    schieben: { vorher, nachher, geaendert: vorher !== nachher },
    board, gruppen, nachDatum, zugeklappt, fehler
  }, null, 1));
  await b.close();
  /* EIN RÜCKGABEWERT. Dieser Lauf hat keine Punkteliste — er druckt seine
     Messwerte als JSON. Was er melden kann, sind die JS-Fehler der Seite:
     ein Zeitstrahl, der beim Zoomen wirft, ist ein kaputter Zeitstrahl,
     auch wenn die Zahlen darunter plausibel aussehen. */
  process.exit(fehler.length ? 1 : 0);
})();
