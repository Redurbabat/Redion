/* Aussehen: Farbschemata, Akzent, Schrift, Layout, Tastenkürzel umbelegen */
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

  const anfang = await p.evaluate(() => ({
    schemata: Aussehen.SCHEMATA.length,
    schriften: Aussehen.SCHRIFTEN.length,
    kuerzel: Aussehen.KUERZEL.length,
    theme: document.documentElement.dataset.theme
  }));
  pruef('Acht Farbschemata',     anfang.schemata, 8);
  pruef('Fünf Schriften',        anfang.schriften, 5);
  pruef('22 registrierte Kürzel', anfang.kuerzel, 22);

  /* Schema wechseln */
  const nacht = await p.evaluate(() => {
    Aussehen.setzen({ schema: 'nacht' });
    const w = getComputedStyle(document.documentElement);
    return { bg: w.getPropertyValue('--bg').trim(),
             akzent: w.getPropertyValue('--accent').trim(),
             theme: document.documentElement.dataset.theme };
  });
  pruef('Mitternacht setzt den Hintergrund', nacht.bg, '#0f1117');
  pruef('Mitternacht setzt den Akzent',      nacht.akzent, '#6c8cff');
  pruef('Mitternacht ist dunkel',            nacht.theme, 'dark');

  const sand = await p.evaluate(() => {
    Aussehen.setzen({ schema: 'sand' });
    const w = getComputedStyle(document.documentElement);
    return { bg: w.getPropertyValue('--bg').trim(), theme: document.documentElement.dataset.theme };
  });
  pruef('Sand setzt den hellen Hintergrund', sand.bg, '#faf6ef');
  pruef('Sand ist hell',                     sand.theme, 'light');

  /* Zurück auf Standard darf keine Reste lassen */
  const zurueck = await p.evaluate(() => {
    Aussehen.setzen({ schema: 'standard', akzent: '' });
    const w = getComputedStyle(document.documentElement);
    return { bg: w.getPropertyValue('--bg').trim(), akzent: w.getPropertyValue('--accent').trim() };
  });
  /* DIE WERTE VON NOCTURNE (E44), nicht mehr Notions #191919/#2eaadc.
     Und sie kommen jetzt aus dem STILBLATT, nicht aus `SCHEMATA`: das
     Standardschema setzt `akzent: ''`, damit Hell- und Dunkelmodus je
     eigene Akzente haben können — ein Inline-Stil auf `<html>` hätte
     beide überschrieben und war genau der Grund, warum die neue Farbe
     zwar im Blatt stand, aber nie auf dem Bildschirm. */
  pruef('Standard hat wieder seinen Hintergrund', zurueck.bg, '#141414');
  pruef('Standard hat wieder seinen Akzent',      zurueck.akzent, '#f97316');

  /* Eigene Akzentfarbe */
  const akzent = await p.evaluate(() => {
    Aussehen.setzen({ akzent: '#e06a94' });
    return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  });
  pruef('Eigene Akzentfarbe gilt', akzent, '#e06a94');

  /* Schrift, Grösse, Abstand, Breite */
  const schrift = await p.evaluate(() => {
    Aussehen.setzen({ schrift: 'serif', groesse: 120, abstand: 'weit', breite: 'schmal' });
    return {
      font: getComputedStyle(document.documentElement).getPropertyValue('--font').trim().slice(0, 9),
      groesse: document.body?.style.fontSize,
      abstand: document.body?.dataset.abstand,
      breite: document.body?.dataset.breite
    };
  });
  pruef('Serifenschrift gesetzt', schrift.font, 'Lyon-Text');
  pruef('Grösse auf 120 %',       schrift.groesse, '120%');
  pruef('Zeilenabstand weit',     schrift.abstand, 'weit');
  pruef('Seite schmal',           schrift.breite, 'schmal');

  const breiteMess = await p.evaluate(async () => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    const s = Store.addBlock(null, 'page', { text: 'Messseite' });
    Store.addBlock(s.id, 'text', { text: 'Inhalt' });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 350));
    const schmal = musselement('#page').getBoundingClientRect().width;
    Aussehen.setzen({ breite: 'breit' });
    await new Promise(r => setTimeout(r, 150));
    const breit = musselement('#page').getBoundingClientRect().width;
    return { schmal: Math.round(schmal), breit: Math.round(breit) };
  });
  pruef('Breit ist wirklich breiter', breiteMess.breit > breiteMess.schmal, true);

  /* Einstellungen überleben den Neustart */
  await p.evaluate(async () => { await Store.flush(); });
  await p.reload();
  await p.waitForTimeout(1600);
  const nachNeustart = await p.evaluate(() => ({
    akzent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    groesse: document.body?.style.fontSize,
    schrift: Aussehen.einstellung().schrift
  }));
  pruef('Akzent nach dem Neustart',  nachNeustart.akzent, '#e06a94');
  pruef('Grösse nach dem Neustart',  nachNeustart.groesse, '120%');
  pruef('Schrift nach dem Neustart', nachNeustart.schrift, 'serif');

  /* --- Tastenkürzel ---------------------------------------------------- */
  const tasten = await p.evaluate(() => {
    const machEv = (o: any) => new KeyboardEvent('keydown', o);
    return {
      standard: Aussehen.kuerzelVon('suche'),
      alsText:  Aussehen.alsText(machEv({ key: 'k', ctrlKey: true })),
      alsText2: Aussehen.alsText(machEv({ key: 'S', ctrlKey: true, shiftKey: true })),
      trifft:   Aussehen.ist('suche', machEv({ key: 'k', ctrlKey: true })),
      trifftNicht: Aussehen.ist('suche', machEv({ key: 'j', ctrlKey: true }))
    };
  });
  pruef('Standardkürzel für Suchen', tasten.standard, 'Ctrl+K');
  pruef('Ereignis wird zu Ctrl+K',   tasten.alsText, 'Ctrl+K');
  pruef('Mit Shift richtig',         tasten.alsText2, 'Ctrl+Shift+S');
  pruef('Treffer erkannt',           tasten.trifft, true);
  pruef('Falsche Taste erkannt',     tasten.trifftNicht, false);

  const umbelegt = await p.evaluate(() => {
    Store.setMeta('kuerzel', { suche: 'Ctrl+Shift+F' });
    return {
      neu: Aussehen.kuerzelVon('suche'),
      alt: Aussehen.ist('suche', new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })),
      jetzt: Aussehen.ist('suche', new KeyboardEvent('keydown', { key: 'F', ctrlKey: true, shiftKey: true }))
    };
  });
  pruef('Kürzel umbelegt',          umbelegt.neu, 'Ctrl+Shift+F');
  pruef('Altes Kürzel gilt nicht mehr', umbelegt.alt, false);
  pruef('Neues Kürzel greift',      umbelegt.jetzt, true);

  /* --- Dialog ---------------------------------------------------------- */
  await p.evaluate(() => Aussehen.dialog());
  await p.waitForTimeout(300);
  const dialog = await p.evaluate(() => ({
    reiter: document.querySelectorAll('.au-reiter button').length,
    karten: document.querySelectorAll('.au-karte').length,
    akzente: document.querySelectorAll('.au-akzente button[data-akz]').length
  }));
  pruef('Drei Reiter im Dialog', dialog.reiter, 3);
  pruef('Acht Schemakarten',     dialog.karten, 8);
  pruef('Akzentfarben zur Wahl', Number(dialog.akzente ?? -1) >= 8, true);

  await p.click('.au-reiter button[data-r="tasten"]');
  await p.waitForTimeout(250);
  const tastenReiter = await p.evaluate(() => ({
    zeilen: document.querySelectorAll('.au-t').length,
    erwartet: Aussehen.umbelegbar().length,
    geaendert: document.querySelectorAll('.au-t button.geaendert').length
  }));
  pruef('Alle umbelegbaren Kürzel gelistet', tastenReiter.zeilen, tastenReiter.erwartet);
  pruef('Geändertes ist markiert',     tastenReiter.geaendert, 1);

  /* Ein Kürzel neu belegen — mit echten Tastendrücken */
  await p.evaluate(() => document.querySelector<HTMLElement>('.au-t button[data-k="neu"]')?.click());
  await p.waitForTimeout(150);
  await p.keyboard.press('Control+Shift+Y');
  await p.waitForTimeout(300);
  const neuBelegt = await p.evaluate(() => Aussehen.kuerzelVon('neu'));
  pruef('Neu belegt über die Tastatur', neuBelegt, 'Ctrl+Shift+Y');

  /* Doppelbelegung wird abgelehnt */
  await p.evaluate(() => document.querySelector<HTMLElement>('.au-t button[data-k="ki"]')?.click());
  await p.waitForTimeout(150);
  await p.keyboard.press('Control+Shift+Y');
  await p.waitForTimeout(300);
  const doppelt = await p.evaluate(() => Aussehen.kuerzelVon('ki'));
  pruef('Doppelbelegung abgelehnt', doppelt, 'Ctrl+J');

  /* Zurücksetzen */
  await p.evaluate(() => document.querySelector<HTMLElement>('[data-a="zurueck"]')?.click());
  await p.waitForTimeout(300);
  const reset = await p.evaluate(() => ({
    suche: Aussehen.kuerzelVon('suche'),
    akzent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    groesse: document.body?.style.fontSize
  }));
  pruef('Kürzel zurückgesetzt', reset.suche, 'Ctrl+K');
  pruef('Akzent zurückgesetzt', reset.akzent, '#f97316');   /* Nocturne, E44 */
  pruef('Grösse zurückgesetzt', reset.groesse, '100%');

  /* --- Wirkt ein umbelegtes Kürzel auch wirklich? ---------------------- */
  await p.evaluate(() => {
    document?.querySelector<HTMLElement>('.overlay [data-a="zu"]')?.click();
    Store.setMeta('kuerzel', { suche: 'Ctrl+Shift+F' });
  });
  await p.waitForTimeout(200);
  await p.keyboard.press('Control+Shift+F');
  await p.waitForTimeout(400);
  const suchtJetzt = await p.evaluate(() => !!document.querySelector('.finder.such'));
  pruef('Umbelegtes Kürzel öffnet die Suche', suchtJetzt, true);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(250);

  await p.keyboard.press('Control+k');
  await p.waitForTimeout(400);
  const altesTot = await p.evaluate(() => !!document.querySelector('.finder.such'));
  pruef('Das alte Kürzel tut nichts mehr', altesTot, false);
  await p.evaluate(() => Store.setMeta('kuerzel', {}));

  console.log(`\n${ok}/${ok + bad} bestanden`);
  console.log(fehler.length ? 'JS-Fehler:\n' + fehler.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad ? 1 : 0);
})();
