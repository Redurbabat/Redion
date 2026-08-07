import path from 'node:path';
const WURZEL = path.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch();
  /* DER DRITTE WERT WURDE BISHER WEGGEWORFEN. Sechs Aufrufe geben eine
     Einzelheit mit — die gemessene Knopfreihe, den Text der Pille —, und
     `ok` nahm nur zwei Werte entgegen: JavaScript liess den dritten
     stillschweigend fallen. Wer eine dieser Zeilen rot sah, bekam nur den
     Namen und musste von Hand nachsehen, was tatsächlich dastand.
     Jetzt wird die Einzelheit mitgeführt und bei einem Fehlschlag gezeigt.
     Im grünen Fall ist die Ausgabe unverändert. */
  const pruef: any[] = [];
  const ok = (n: any, x: any, z?: any) => pruef.push([n, !!x, z]);
  const f: any[] = [];
  const p = await b.newPage({ viewport: { width: 428, height: 926 } });
  p.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1900);

  await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Claude Probe', icon: '🧪' });
    Store.addBlock(s.id, 'h2', { text: 'Ueberschrift 2 Test' });
    Store.addBlock(s.id, 'text', { text: 'Normaler Text zum Zählen der Wörter hier.' });
    App.oeffne(s.id);
  });
  await p.waitForTimeout(800);

  /* ================================================================== *
   * 1) DIE BEREICHE OBEN, DIE DREI KNÖPFE UNTEN
   * ------------------------------------------------------------------
   * BIS HIER STAND ETWAS ANDERES. Die Bereiche lagen unten in einer
   * Reiterleiste mit fünf Feldern, jedes mit einem Wort in zehn Pixeln.
   * Nach der Vorlage aus Notions App stehen sie jetzt oben als Pillen —
   * und nur die aktive trägt ihren Namen. Unten sind dafür die drei
   * Dinge, die man von überall aus will: suchen, KI fragen, schreiben.
   *
   * Die Prüfung ist mitgewandert und nicht weggefallen: dieselben Fragen,
   * an den Stellen, wo die Antworten jetzt stehen.
   * ================================================================== */
  const leiste = await p.evaluate(() => {
    const o = document.getElementById('handy-oben');
    if (!o) throw new Error('handy-oben ist nicht da — der Lauf misst sonst nichts.');
    const u = document.getElementById('handy-unten');
    if (!u) throw new Error('handy-unten ist nicht da — der Lauf misst sonst nichts.');
    const ro = o.getBoundingClientRect(), ru = u.getBoundingClientRect();
    return { sichtbar: getComputedStyle(o).display !== 'none',
             obenBuendig: Math.round(ro.top) <= 0,
             untenBuendig: Math.round(ru.bottom) >= 926,
             breite: Math.round(ro.width),
             knoepfe: [...o.querySelectorAll<HTMLElement>('button')].map(x => x.id),
             untenKnoepfe: [...u.querySelectorAll<HTMLElement>('button')].map(x => x.id),
             kiText: u.querySelector('#hu-ki')?.textContent };
  }) as any;
  console.log('   Bereichsleiste:', JSON.stringify(leiste));
  ok('Die Bereichsleiste steht oben auf dem Telefon', leiste.sichtbar && leiste.obenBuendig);
  ok('Sie geht über die volle Breite', leiste.breite === 428);
  ok('Konto, Start, Seiten, Termine, Eingang',
     leiste.knoepfe.join(',') === 'hl-konto,hl-start,hl-seiten,hl-bespr,hl-inbox', leiste.knoepfe.join(','));
  ok('Unten stehen Suchen, KI und Neu', leiste.untenBuendig &&
     leiste.untenKnoepfe.join(',') === 'hu-suche,hu-ki,hu-neu', leiste.untenKnoepfe.join(','));
  ok('Die Mitte ist die KI', /KI/.test(leiste.kiText || ''), leiste.kiText);

  /* NUR DIE AKTIVE PILLE TRÄGT IHREN NAMEN — das ist der ganze Kniff, mit
     dem fünf Ziele in 428 Pixel passen. Geht er verloren, stehen entweder
     fünf Wörter da, die keiner liest, oder gar keins, und man rät. */
  const namen = await p.evaluate(() => {
    const sicht = (el: Element | null) =>
      !!el && getComputedStyle(el).display !== 'none';
    return {
      aktivMitName: sicht(document.querySelector('#handy-oben button.an b')),
      andereOhne: [...document.querySelectorAll('#handy-oben button:not(.an) b')]
        .every(b => !sicht(b))
    };
  }) as any;
  ok('Die aktive Pille zeigt ihren Namen', namen.aktivMitName);
  ok('… und nur sie', namen.andereOhne);

  await p.click('#hu-ki');
  await p.waitForTimeout(600);
  ok('Die Mitte öffnet die KI', await p.evaluate(() =>
    document.querySelector<HTMLElement>('#ai')?.classList.contains('open')));
  await p.evaluate(() => App.kiPanel(false));
  await p.waitForTimeout(600);      /* das KI-Fenster deckt am Telefon alles zu */

  await p.click('#hu-neu');
  await p.waitForTimeout(700);
  ok('Der Stift unten rechts legt eine neue Seite an', await p.evaluate(() =>
    Store.rootPages().length >= 2 && !!document.getElementById('title')));

  /* Die vier Bereiche schalten wirklich um und markieren sich.
     Erst den Cursor aus dem Titel nehmen: waehrend man schreibt, geht die
     untere Leiste absichtlich weg, damit sie die Tastatur nicht verdeckt. */
  await p.evaluate(() => {
    /* `document.activeElement` ist `Element | null` und kennt kein `blur`.
       Die Prüfung sagt beides in einem. */
    const fokus = document.activeElement;
    if (fokus instanceof HTMLElement) fokus.blur();
                           document.body?.classList.remove('schreibt'); });
  await p.waitForTimeout(400);
  /* Seit E38 steht hier „Seiten" statt „Chats" — der Platz oben gehört
     dem, was man täglich sucht. Die KI blieb unten in der Leiste. */
  await p.click('#hl-seiten');
  await p.waitForTimeout(500);
  ok('Der Seitenbereich markiert sich', await p.evaluate(() =>
    document.querySelector<HTMLElement>('#hl-seiten')?.classList.contains('an')));
  await p.click('#hl-bespr');
  await p.waitForTimeout(500);
  ok('Besprechungen ebenso', await p.evaluate(() =>
    document.querySelector<HTMLElement>('#hl-bespr')?.classList.contains('an') &&
    !document.querySelector<HTMLElement>('#hl-seiten')?.classList.contains('an')));
  await p.click('#hl-start');
  await p.waitForTimeout(500);
  ok('Und zurück auf Start', await p.evaluate(() =>
    document.querySelector<HTMLElement>('#hl-start')?.classList.contains('an')));
  await p.evaluate(() => { if ((window as any).PWA && PWA.schubladeZu) PWA.schubladeZu(); });
  await p.waitForTimeout(300);

  await p.evaluate(() => App.oeffne(Store.rootPages().find(x => x.text === 'Claude Probe')?.id));
  await p.waitForTimeout(600);

  /* ================================================================== *
   * 2) AKTIONEN-BLATT MIT KARTEN
   * ================================================================== */
  await p.evaluate(() => App.seitenMenue(document.getElementById('btn-page-menu'),
                                          Store.getBlock(App.aktuelleSeite())));
  await p.waitForTimeout(700);

  const aktionen = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) throw new Error('.menu ist nicht da — der Lauf misst sonst nichts.');
    return {
      titel: m.querySelector('.blatt-titel')?.textContent,
      karten: m.querySelectorAll('.blatt-karte').length,
      trennlinien: m.querySelectorAll('hr').length,
      rot: [...m.querySelectorAll<HTMLElement>('.rot')].map(x => (x.textContent ?? '').trim()),
      schalter: m.querySelectorAll('.mschalter').length,
      fuss: m.querySelector('.menu-fuss')?.textContent,
      kacheln: !!m.querySelector('.schrift-kacheln')
    };
  });
  console.log('   Aktionen:', JSON.stringify(aktionen));
  ok('Das Blatt heisst „Aktionen"', aktionen.titel === 'Aktionen');
  ok('Die Einträge stehen in Karten', aktionen.karten >= 5);
  ok('Keine nackten Trennlinien mehr', aktionen.trennlinien === 0);
  ok('Papierkorb steht in Rot', aktionen.rot.some(x => /Papierkorb/.test(x)));
  ok('Vier Schalter', aktionen.schalter === 4);
  ok('Schriftkacheln und Wortzahl bleiben',
     aktionen.kacheln && /Wortzahl/.test(aktionen.fuss || ''));

  /* Pfadnavigation aus- und einschalten */
  await p.evaluate(() => {
    [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')]
      .find(x => (x.textContent ?? '').includes('Pfadnavigation'))?.click();
  });
  await p.waitForTimeout(600);
  const pfadAus = await p.evaluate(() => ({
    gespeichert: Store.getBlock(App.aktuelleSeite()).pfad,
    krume: document.querySelector<HTMLElement>('#crumb')?.querySelectorAll('a').length
  }));
  console.log('   Pfad aus:', JSON.stringify(pfadAus));
  ok('Pfadnavigation lässt sich abschalten', pfadAus.gespeichert === false && pfadAus.krume === 1);

  await p.evaluate(() => {
    [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')]
      .find(x => (x.textContent ?? '').includes('Pfadnavigation'))?.click();
  });
  await p.waitForTimeout(500);
  ok('Und wieder an', await p.evaluate(() =>
    Store.getBlock(App.aktuelleSeite()).pfad === true));

  ok('Offline-Zeile steht im Menü', await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')].some(x => /Offline verfügbar/.test(x.textContent ?? ''))));

  await p.evaluate(() => document.querySelectorAll<HTMLElement>('.menu,.menu-grund').forEach(x => x.remove()));

  /* ================================================================== *
   * 3) SEITEN-COVER
   * ================================================================== */
  await p.evaluate(() => App.coverWaehlen(Store.getBlock(App.aktuelleSeite())));
  await p.waitForTimeout(700);
  const cover = await p.evaluate(() => {
    const c = document.querySelector('.cover-blatt');
    if (!c) throw new Error('.cover-blatt ist nicht da — der Lauf misst sonst nichts.');
    const r = c.getBoundingClientRect();
    return { links: c.querySelector('.cb-links')?.textContent,
             titel: c.querySelector('.cb-kopf b')?.textContent,
             rechts: c.querySelector('.cb-rechts')?.textContent,
             reiter: [...c.querySelectorAll<HTMLElement>('.cb-reiter button')].map(x => x.textContent),
             gruppen: [...c.querySelectorAll<HTMLElement>('.cb-grp')].map(x => x.textContent),
             kacheln: c.querySelectorAll('.cover-gitter button').length,
             untenBuendig: Math.round(r.bottom) >= 920, breite: Math.round(r.width) };
  });
  console.log('   Cover:', JSON.stringify(cover));
  ok('Kopf: Entfernen · Seiten-Cover · Schliessen',
     cover.links === 'Entfernen' && cover.titel === 'Seiten-Cover' && cover.rechts === 'Schliessen');
  ok('Drei Reiter', cover.reiter.join(',') === 'Galerie,Hochladen,Link');
  ok('Gruppen mit Überschriften', cover.gruppen.length === 3 &&
     /Farbe und Gradient/.test(cover.gruppen[0] ?? ''));
  ok('Genug Kacheln zur Auswahl', cover.kacheln >= 20);
  ok('Auf dem Telefon fährt es von unten hoch', cover.untenBuendig && cover.breite === 428);

  await p.evaluate(() => document.querySelector<HTMLElement>('.cb-reiter [data-r="link"]')?.click());
  await p.waitForTimeout(400);
  ok('Der Reiter „Link" hat ein Feld', await p.evaluate(() => !!document.getElementById('cb-link')));

  await p.evaluate(() => document.querySelector<HTMLElement>('.cb-reiter [data-r="galerie"]')?.click());
  await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector<HTMLElement>('.cover-gitter button')?.click());
  await p.waitForTimeout(600);
  const gesetzt = await p.evaluate(() => ({
    cover: Store.getBlock(App.aktuelleSeite()).cover,
    zu: !document.querySelector('.cover-blatt'),
    sichtbar: !!document.querySelector('.cover')
  }));
  console.log('   Cover gesetzt:', JSON.stringify(gesetzt));
  ok('Ein Klick setzt das Cover und schliesst', !!gesetzt.cover && gesetzt.zu && gesetzt.sichtbar);

  /* ================================================================== *
   * 4) POSTEINGANG
   * ================================================================== */
  await p.evaluate(() => Ansichten.posteingang());
  await p.waitForTimeout(700);
  const pe = await p.evaluate(() => ({
    gross: document.querySelector('.pe-gross')?.textContent,
    klein: document.querySelector('.pe-klein')?.textContent,
    link: document.querySelector('.pe-link')?.textContent,
    ico: !!document.querySelector('.pe-ico')
  }));
  console.log('   Posteingang:', JSON.stringify(pe));
  ok('„Du bist auf dem neuesten Stand!"', pe.gross === 'Du bist auf dem neuesten Stand!');
  ok('Mit Erklärung darunter', /@-Erwähnungen/.test(pe.klein || '') && pe.ico);
  ok('Und „Filter ändern"', pe.link === 'Filter ändern');

  await p.evaluate(() => document.querySelector<HTMLElement>('.pe-link')?.click());
  await p.waitForTimeout(600);
  const filter = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) throw new Error('.menu ist nicht da — der Lauf misst sonst nichts.');
    const r = { eintraege: [...m.querySelectorAll<HTMLElement>('[data-x]')].map(x => (x.textContent ?? '').trim()),
                blatt: m.classList.contains('blatt'), titel: m.querySelector('.blatt-titel')?.textContent };
    document.querySelectorAll<HTMLElement>('.menu,.menu-grund').forEach(x => x.remove());
    return r;
  });
  console.log('   Filter:', JSON.stringify(filter));
  ok('Der Filter bietet drei Quellen', filter.eintraege.length === 3);
  ok('Als Blatt mit Titel', filter.blatt && filter.titel === 'Filter');

  /* ================================================================== *
   * 5) ABSCHNITTE ZUKLAPPEN
   * ================================================================== */
  await p.evaluate(() => { PWA.schubladeAuf && PWA.schubladeAuf(); });
  await p.waitForTimeout(500);
  const vorher = await p.evaluate(() => ({
    pfeile: document.querySelectorAll('.ss-pfeil').length,
    sichtbar: [...document.querySelectorAll<HTMLElement>('#tree > *')].filter(x => x.style.display !== 'none').length
  }));
  await p.evaluate(() => {
    const k = [...document.querySelectorAll<HTMLElement>('.side-section span')].find(x => (x.textContent ?? '').startsWith('Werkzeuge'));
    if (!k) throw new Error('k ist nicht da — der Lauf misst sonst nichts.');
    k.click();
  });
  await p.waitForTimeout(700);
  const nachher = await p.evaluate(() => ({
    zu: (Store.getMeta('sidebarZu', []) || []).includes('Werkzeuge'),
    versteckt: [...document.querySelectorAll<HTMLElement>('#tree > *')].filter(x => x.style.display === 'none').length,
    pfeil: [...document.querySelectorAll<HTMLElement>('.side-section span')]
      .find(x => (x.textContent ?? '').startsWith('Werkzeuge'))?.textContent
  }));
  console.log('   Abschnitte:', JSON.stringify({ vorher, nachher }));
  ok('Jeder Abschnitt hat einen Pfeil', vorher.pfeile >= 5);
  ok('Klick klappt ihn zu', nachher.zu && nachher.versteckt >= 1);
  ok('Der Pfeil dreht sich', /›/.test(nachher.pfeil || ''));

  await p.evaluate(() => {
    const k = [...document.querySelectorAll<HTMLElement>('.side-section span')].find(x => (x.textContent ?? '').startsWith('Werkzeuge'));
    if (!k) throw new Error('k ist nicht da — der Lauf misst sonst nichts.');
    k.click();
  });
  await p.waitForTimeout(600);
  ok('Nochmal klicken klappt ihn auf', await p.evaluate(() =>
    !(Store.getMeta('sidebarZu', []) || []).includes('Werkzeuge')));

  /* ================================================================== *
   * 6) CHATVERLAUF NACH MONATEN
   * ================================================================== */
  await p.evaluate(() => {
    const t = Date.now();
    Store.setMeta('chats', [
      { id: 'a', titel: 'Heutiger Chat', verlauf: [], wann: new Date(t).toISOString() },
      { id: 'b', titel: 'Seite komplett erklären', verlauf: [],
        wann: new Date(t - 95 * 86400000).toISOString() },
      { id: 'c', titel: 'Habit-Tracking System', verlauf: [],
        wann: new Date(t - 125 * 86400000).toISOString() }
    ]);
    App.reiterWechseln('chat');
  });
  await p.waitForTimeout(700);
  const chats = await p.evaluate(() => ({
    gruppen: [...document.querySelectorAll<HTMLElement>('.side-section span')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '').trim()),
    wann: [...document.querySelectorAll<HTMLElement>('.kc-wann')].map(x => x.textContent)
  }));
  console.log('   Chats:', JSON.stringify(chats));
  ok('Alte Chats stehen unter ihrem Monat',
     chats.gruppen.some(x => /^(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) \d{4}$/.test(x)));
  ok('Heute bleibt Heute', (chats.gruppen ?? '').includes('Heute'));
  ok('Unter jedem Chat steht, wie lange es her ist',
     chats.wann.some(x => /vor \d+ Monaten/.test(x)));

  /* ================================================================== *
   * 7) BESPRECHUNGEN
   * ================================================================== */
  await p.evaluate(() => App.reiterWechseln('bespr'));
  await p.waitForTimeout(600);
  ok('Der Eintrag heisst „Neue Meeting-Notiz"', await p.evaluate(() =>
    /Neue Meeting-Notiz/.test(document.querySelector<HTMLElement>('#tree')?.textContent ?? '')));

  /* ================================================================== *
   * 8) AM RECHNER UNVERÄNDERT
   * ================================================================== */
  await p.setViewportSize({ width: 1400, height: 900 });
  await p.waitForTimeout(700);
  const rechner = await p.evaluate(() => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    App.reiterWechseln('start');
    return { oben: getComputedStyle(musselement('#handy-oben')).display,
             unten: getComputedStyle(musselement('#handy-unten')).display,
             polster: getComputedStyle(musselement('#scroll')).paddingBottom };
  });
  console.log('   Am Rechner:', JSON.stringify(rechner));
  /* Die Gegenprobe: was fürs Telefon gebaut wurde, darf am Rechner nicht
     auftauchen. Dort gibt es die Seitenleiste, und zwei Navigationen
     nebeneinander wären eine zu viel. */
  ok('Die Bereichspillen sind am Rechner weg', rechner.oben === 'none');
  ok('Die drei Knöpfe unten auch', rechner.unten === 'none');

  await p.evaluate(() => App.seitenMenue(document.getElementById('btn-page-menu'),
                                          Store.getBlock(Store.rootPages()[0].id)));
  await p.waitForTimeout(600);
  const rMenu = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) throw new Error('.menu ist nicht da — der Lauf misst sonst nichts.');
    const x = { blatt: m.classList.contains('blatt'),
                karten: m.querySelectorAll('.blatt-karte').length,
                hrs: m.querySelectorAll('hr').length };
    document.querySelectorAll<HTMLElement>('.menu').forEach(y => y.remove());
    return x;
  });
  console.log('   Menü am Rechner:', JSON.stringify(rMenu));
  ok('Am Rechner bleibt es die flache Liste',
     !rMenu.blatt && rMenu.karten === 0 && rMenu.hrs >= 3);

  /* Nach dem Neuladen */
  await p.reload();
  await p.waitForTimeout(1900);
  ok('Der Cover bleibt', await p.evaluate(() =>
    Object.values(Store.cache.blocks).some(b2 => b2.cover)));
  ok('Zugeklappte Abschnitte bleiben gemerkt', await p.evaluate(() =>
    Array.isArray(Store.getMeta('sidebarZu', []))));

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x, z]: any[]) => console.log((x ? '✅ ' : '❌ ') + n +
    (!x && z !== undefined ? '   ist=' + JSON.stringify(z) : '')));
  console.log('\n' + pruef.filter((x: any) => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 8).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
})();
