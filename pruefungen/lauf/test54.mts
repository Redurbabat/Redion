/* Schlusstest: alles Neue am iPhone-Format, dazu ein Rundgang ohne Fehler */
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
  const p = await b.newPage({ viewport: { width: 428, height: 926 },
                              isMobile: true, hasTouch: true,
                              deviceScaleFactor: 3 });
  const fehler: any[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1800);

  /* --- Nichts ragt seitlich heraus -------------------------------------- */
  const breit = await p.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    fenster: innerWidth,
    reiter: getComputedStyle(document.getElementById('reiterleiste') ||
                             document.createElement('div')).display
  }));
  pruef('Kein waagrechter Überlauf', breit.doc <= breit.fenster + 1, true);
  pruef('Reiterleiste am Telefon aus', breit.reiter, 'none');

  /* --- Daten anlegen ---------------------------------------------------- */
  const bau = await p.evaluate(async () => {
    const s = Store.addBlock(null, 'page', { text: 'Handytest' });
    const db = Store.addDatabase(s.id, 'Termine H', {
      title: { name: 'Titel', type: 'title' },
      von:   { name: 'Von',   type: 'date' },
      bis:   { name: 'Bis',   type: 'date' },
      team:  { name: 'Team',  type: 'select',
               options: [{ name: 'A', color: 'blue' }, { name: 'B', color: 'green' }] },
      wert:  { name: 'Wert',  type: 'number' }
    });
    const c = Store.getCollection(db.collectionId);
    Store.addRow(c.id, { title: 'Eins', von: '2026-08-05', bis: '2026-08-09', team: 'A', wert: 10 });
    Store.addRow(c.id, { title: 'Zwei', von: '2026-08-12', team: 'B', wert: 20 });
    Store.addRow(c.id, { title: 'Drei', von: '2026-08-20', bis: '2026-08-22', team: 'A', wert: 30 });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 600));
    return { seite: s.id, coll: c.id, view: db.viewId };
  });

  /* --- Jede neue Ansicht am Telefon zeichnen ---------------------------- */
  const layouts = ['table', 'board', 'timeline', 'calendar', 'gallery', 'list',
                   'chart', 'pivot', 'dashboard', 'feed', 'form'];
  for (const l of layouts) {
    const erg = await p.evaluate(async (x) => {
      Store.getView(x.view);
      const patch: Record<string, any> = { layout: x.l };
      if (x.l === 'board')   { patch.groupBy = 'team'; patch.bahnKey = ''; }
      if (x.l === 'timeline'){ patch.startKey = 'von'; patch.endeKey = 'bis'; }
      if (x.l === 'calendar'){ patch.dateKey = 'von'; patch.kalStufe = 'monat'; patch.monat = '2026-08-10T00:00:00.000Z'; }
      if (x.l === 'chart')   { patch.chartGruppe = 'team'; patch.chartWert = 'wert'; }
      if (x.l === 'pivot')   { patch.pivotZeile = 'team'; patch.pivotWert = 'wert'; patch.pivotArt = 'summe'; }
      Store.updateView(x.view, patch);
      App.zeichneSeite();
      await new Promise(r => setTimeout(r, 420));
      return { ueberlauf: document.documentElement.scrollWidth - innerWidth,
               inhalt: (document.getElementById('page') || {}).textContent?.length || 0 };
    }, { ...bau, l });
    pruef('Am Telefon ohne Überlauf: ' + l, Number(erg.ueberlauf ?? -1) <= 1, true);
    pruef('… und mit Inhalt: ' + l, Number(erg.inhalt ?? -1) > 20, true);
  }

  /* --- Wochenkalender am Telefon ---------------------------------------- */
  const woche = await p.evaluate(async (x) => {
    Store.updateView(x.view, { layout: 'calendar', kalStufe: 'woche',
                               monat: '2026-08-12T00:00:00.000Z' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 420));
    return { raster: !!document.querySelector('.kw-koerper'),
             tage: document.querySelectorAll('.kw-tag').length,
             ueberlauf: document.documentElement.scrollWidth - innerWidth };
  }, bau);
  pruef('Wochenraster auch am Telefon', woche.raster, true);
  pruef('Sieben Spalten',               woche.tage, 7);
  pruef('Ohne Überlauf',                Number(woche.ueberlauf ?? -1) <= 1, true);

  /* --- Zeitstrahl mit Zoom ---------------------------------------------- */
  const zs = await p.evaluate(async (x) => {
    Store.updateView(x.view, { layout: 'timeline', zoom: 'tag' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 420));
    return { zoom: document.querySelectorAll('.zs-zoom button').length,
             balken: document.querySelectorAll('.zs-balken').length,
             scrollbar: (() => { const s = document.querySelector('.zs-scroll');
               return s ? s.scrollWidth > s.clientWidth : false; })(),
             ueberlauf: document.documentElement.scrollWidth - innerWidth };
  }, bau);
  pruef('Zoomknöpfe am Telefon',        zs.zoom, 5);
  pruef('Balken gezeichnet',            zs.balken, 3);
  pruef('Zeitachse scrollt für sich',   zs.scrollbar, true);
  pruef('Seite selbst läuft nicht über', Number(zs.ueberlauf ?? -1) <= 1, true);

  /* --- Die neuen Fenster am Telefon ------------------------------------- */
  [];
  for (const [name, fn] of [
    ['Aussehen',        'Aussehen.dialog()'],
    ['Tempo',           'Tempo.dialog()'],
    ['Tagesplan',       'Plan.tagesplan()'],
    ['Wochenrückblick', 'Plan.wochenrueckblick()'],
    ['Zurückgestellt',  'Plan.uebersicht()'],
    ['Austausch',       'Austausch.dialog()'],
    ['Datenmodell',     'Schema.ansicht()'],
    ['Kennzahlen',      'Schema.tafel()']
  ]) {
    const erg = await p.evaluate(async (code) => {
      document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
      // eslint-disable-next-line no-eval
      eval(code ?? '');
      await new Promise(r => setTimeout(r, 350));
      const o = document.querySelector('.overlay .finder');
      const r = o ? o.getBoundingClientRect() : null;
      const raus = r ? (r.right > innerWidth + 1 || r.left < -1) : true;
      document.querySelectorAll<HTMLElement>('.overlay').forEach(x => x.remove());
      return { da: !!o, raus, breite: r ? Math.round(r.width) : 0 };
    }, fn);
    pruef('Fenster passt aufs Telefon: ' + name, erg.da && !erg.raus, true);
  }

  /* --- Bedienleiste unten und Schublade --------------------------------- */
  const unten = await p.evaluate(() => ({
    oben:  getComputedStyle(document.querySelector<HTMLElement>('#handy-oben') ?? document.body).display,
    unten: getComputedStyle(document.querySelector<HTMLElement>('#handy-unten') ?? document.body).display,
    bereiche: [...document.querySelectorAll<HTMLElement>('#handy-oben button')].map(x => x.id),
    aktionen: [...document.querySelectorAll<HTMLElement>('#handy-unten button')].map(x => x.id)
  }));
  pruef('Bereichsleiste oben sichtbar', unten.oben !== 'none', true);
  /* Sechs seit E132: „Lernen" ist mit den Produktwelten dazugekommen. */
  pruef('Konto und fünf Bereiche',      unten.bereiche.length, 6);
  pruef('Aktionsleiste unten sichtbar', unten.unten !== 'none', true);
  pruef('Suchen, KI und Neu',           unten.aktionen.length, 3);

  /* --- Ein Rundgang ohne Fehler ----------------------------------------- */
  const rundgang = await p.evaluate(async () => {
    const schritte: any[] = [];
    const tu = async (name: string, fn: any) => {
      try { await fn(); schritte.push([name, 'ok']); }
      catch (e: unknown) { schritte.push([name, (e instanceof Error ? e.message : String(e))]); }
      document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
      await new Promise(r => setTimeout(r, 120));
    };
    await tu('Suche',        () => App.suche());
    await tu('Palette',      () => Werkzeuge.palette());
    await tu('Tastenkürzel', () => Werkzeuge.tastenkuerzel());
    await tu('Papierkorb',   () => App.papierkorb());
    await tu('Einstellungen',() => App.einstellungen());
    await tu('Bibliothek',   () => Bibliothek.oeffne());
    await tu('Erste Hilfe',  () => Pflege.ersteHilfe());
    await tu('Verschlüsselung', () => Krypto.dialog());
    await tu('Wissen',       () => Wissen.oeffnen());
    await tu('Umsetzungsstand', () => Status.seiteAnlegen());
    return schritte;
  });
  rundgang.forEach(([n, r]) => pruef('Rundgang: ' + n, r, 'ok'));

  /* --- Am grossen Bildschirm dasselbe ----------------------------------- */
  const gross = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const fehler2: any[] = [];
  gross.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await gross.goto('file://' + WURZEL + '/index.html');
  await gross.waitForTimeout(1800);
  const pcRund = await gross.evaluate(async () => {
    const schritte: any[] = [];
    const tu = async (name: string, fn: any) => {
      try { await fn(); schritte.push([name, 'ok']); }
      catch (e: unknown) { schritte.push([name, (e instanceof Error ? e.message : String(e))]); }
      document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
      await new Promise(r => setTimeout(r, 120));
    };
    await tu('Aussehen',     () => Aussehen.dialog());
    await tu('Tempo',        () => Tempo.dialog());
    await tu('Tagesplan',    () => Plan.tagesplan());
    await tu('Wochenrückblick', () => Plan.wochenrueckblick());
    await tu('Austausch',    () => Austausch.dialog());
    await tu('Datenmodell',  () => Schema.ansicht());
    await tu('Kennzahlen',   () => Schema.tafel());
    await tu('Reiter',       () => Fenster.zeichnen());
    await tu('Wissen',       () => Wissen.oeffnen());
    return schritte;
  });
  pcRund.forEach(([n, r]) => pruef('Am PC: ' + n, r, 'ok'));

  const pcUeberlauf = await gross.evaluate(() =>
    document.documentElement.scrollWidth - innerWidth);
  pruef('Am PC kein Überlauf', pcUeberlauf <= 1, true);

  console.log(`\n${ok}/${ok + bad} bestanden`);
  const alle = [...fehler, ...fehler2];
  console.log(alle.length ? 'JS-Fehler:\n' + alle.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || alle.length ? 1 : 0);
})();
