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
  /* KEIN ERSTBESUCHER — das Willkommen wegräumen (E55).
     Seit §11 legt sich beim allerersten Öffnen ein Blatt über den ganzen
     Bildschirm. Für den, der Redion zum ersten Mal sieht, ist das richtig;
     hier misst niemand zum ersten Mal, und Playwright wartet dann
     sechzig Sekunden darauf, dass ein Knopf darunter anklickbar wird. */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
       über alles und fängt Klicks ab (E132). */
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });

  await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Claude Probe', icon: '🧪' });
    Store.addBlock(s.id, 'h2', { text: 'Ueberschrift 2 Test' });
    Store.addBlock(s.id, 'text', { text: 'Normaler Text zum Zählen der Wörter hier.' });
    App.oeffne(s.id);
  });
  await p.waitForTimeout(800);

  /* ================================================================== *
   * 1) DIE FÜNF WEGE UNTEN, SUCHE UND KI OBEN RECHTS
   * ------------------------------------------------------------------
   * ZWEIMAL UMGEZOGEN, UND DIE PRÜFUNG JEDES MAL MIT.
   *
   * Zuerst lagen die Bereiche unten in einer Leiste mit fünf Feldern.
   * Dann standen sie oben als Pillen, und unten die drei Dinge, die man
   * von überall will: suchen, KI fragen, schreiben.
   *
   * Seit E236 stehen sie wieder unten — aber anders als beim ersten Mal:
   * Zeichen und Name ÜBEREINANDER, deshalb passen fünf Namen nebeneinander
   * statt einem. Redur: „dann unten sollte max 4-5 Sachen sein."
   *
   * Was aus den sechs Kreisen wurde:
   *     R (Arbeitsbereich)  → rechts in die Menüleiste (`mb-konto`)
   *     Seiten (Workspace)  → ins Mehr-Blatt
   * Und neu dazu: „Dokumente" — das Regal, wo Redion jetzt öffnet.
   *
   * Die schwebende Leiste (Suche · KI · Neu) gibt es nicht mehr: zwei
   * Leisten am unteren Rand wären eine zu viel. Suche und KI stehen rechts
   * in der Menüleiste, „Neu" ist der „+ Neu"-Knopf im Regal.
   *
   * Die Fragen sind dieselben geblieben. Nur die Stellen, an denen die
   * Antworten stehen, sind neu.
   * ================================================================== */
  const leiste = await p.evaluate(() => {
    const o = document.getElementById('handy-oben');
    if (!o) throw new Error('handy-oben ist nicht da — der Lauf misst sonst nichts.');
    const mb = document.getElementById('menueband');
    if (!mb) throw new Error('menueband ist nicht da — der Lauf misst sonst nichts.');
    const ro = o.getBoundingClientRect();
    return { sichtbar: getComputedStyle(o).display !== 'none',
             untenBuendig: Math.round(ro.bottom) >= 926,
             breite: Math.round(ro.width),
             knoepfe: [...o.querySelectorAll<HTMLElement>('button')].map(x => x.id),
             rechtsOben: [...mb.querySelectorAll<HTMLElement>('.mb-rechts > button')]
               .map(x => x.id).filter(Boolean),
             /* Die alte schwebende Leiste darf nicht heimlich zurückkommen. */
             schwebendWeg: !document.getElementById('handy-unten') };
  }) as any;
  console.log('   Wegeleiste:', JSON.stringify(leiste));
  ok('Die Wegeleiste steht unten auf dem Telefon', leiste.sichtbar && leiste.untenBuendig);
  ok('Sie geht über die volle Breite', leiste.breite === 428);
  /* FÜNF, und die Reihenfolge steht ausgeschrieben und nicht als Zahl —
     sie ist der Punkt, nicht die Anzahl. */
  ok('Dokumente, Heute, Lernen, Termine, Mehr',
     leiste.knoepfe.join(',') === 'hl-dok,hl-start,hl-lernen,hl-bespr,hl-mehr',
     leiste.knoepfe.join(','));
  ok('Suche, KI und Konto stehen oben rechts',
     ['mb-suche', 'mb-ki', 'mb-konto'].every(id => leiste.rechtsOben.includes(id)),
     leiste.rechtsOben.join(','));
  ok('Die schwebende Leiste ist weg', leiste.schwebendWeg);

  /* JEDER WEG TRÄGT SEINEN NAMEN — und das ist der Gewinn des Umzugs.
     Oben trug ihn nur der aktive, weil Zeichen und Wort nebeneinander
     standen und fünf Namen die Leiste gesprengt hätten. Untereinander
     passen sie. §38: wo man steht, darf nicht nur die Farbe sagen. */
  const namen = await p.evaluate(() => {
    const sicht = (el: Element | null) =>
      !!el && getComputedStyle(el).display !== 'none';
    const alle = [...document.querySelectorAll('#handy-oben > button b')];
    return {
      alleMitNamen: alle.length === 5 && alle.every(b => sicht(b)),
      aktivFetter: (() => {
        const an = document.querySelector('#handy-oben > button.an b');
        const aus = document.querySelector('#handy-oben > button:not(.an) b');
        if (!an || !aus) return false;
        return Number(getComputedStyle(an).fontWeight) >
               Number(getComputedStyle(aus).fontWeight);
      })()
    };
  }) as any;
  ok('Alle fünf Wege tragen ihren Namen', namen.alleMitNamen);
  ok('Der aktive steht fetter da — nicht nur farbig (§38)', namen.aktivFetter);

  await p.evaluate(() => document.getElementById('mb-ki')?.click());

  await p.waitForTimeout(600);
  ok('Der Funke oben rechts öffnet die KI', await p.evaluate(() =>
    document.querySelector<HTMLElement>('#ai')?.classList.contains('open')));
  await p.evaluate(() => App.kiPanel(false));
  await p.waitForTimeout(600);      /* das KI-Fenster deckt am Telefon alles zu */

  /* SEIT E45 FRAGT DER STIFT ERST, WAS ENTSTEHEN SOLL. Vorher legte er
     sofort eine leere Seite an — richtig in einem von acht Fällen.

     Diese Prüfung stand danach zwei Tage auf Grün, ohne noch etwas zu
     prüfen: sie zählte `rootPages().length >= 2`, und so viele gab es aus
     den Schritten davor längst. Das Blatt blieb offen, und der nächste
     Klick lief in seinen Hintergrund — der deckt den ganzen Bildschirm.
     Genau daran ist der Lauf dann gescheitert, drei Zeilen später und
     ohne erkennbaren Zusammenhang.

     Eine Prüfung, die grün bleibt, wenn sich das Verhalten ändert, ist
     schlimmer als keine: sie behauptet, jemand habe hingesehen. */
  const seitenVorher = await p.evaluate(() => Store.rootPages().length);
  /* DER STIFT HIESS `hu-neu` UND STAND IN DER SCHWEBENDEN LEISTE.
     Seit E236 gibt es die nicht mehr; dasselbe Blatt öffnet der grosse
     „+ Neu"-Knopf im Regal. Dass DER Knopf es öffnet, prüft test114 §12
     — hier geht es um das Blatt selbst und darum, dass es wirklich etwas
     anlegt. */
  await p.evaluate(() => App.erstellenBlatt());
  await p.waitForTimeout(700);
  ok('„+ Neu" öffnet das Blatt „Neu erstellen"', await p.evaluate(() =>
    !!document.querySelector('.menu.blatt [data-neu="seite"]')));
  await p.click('.menu.blatt [data-neu="seite"]');
  await p.waitForTimeout(800);
  ok('… und „Neue Seite" legt wirklich eine an', await p.evaluate((v) =>
    Store.rootPages().length > v && !!document.getElementById('title'), seitenVorher));
  ok('… und das Blatt ist danach zu', await p.evaluate(() =>
    document.querySelectorAll('.menu, .menu-grund').length === 0));

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
  /* „Seiten" (Workspace) hat seit E236 keinen Weg mehr in der Leiste — er
     steht im Mehr-Blatt. An seine Stelle trat „Dokumente", das Regal, wo
     Redion jetzt öffnet. Geprüft wird derselbe Satz wie vorher: markiert
     sich der angetippte Weg? */
  await p.click('#hl-dok');
  await p.waitForTimeout(600);
  ok('Der Dokumentenbereich markiert sich', await p.evaluate(() =>
    document.querySelector<HTMLElement>('#hl-dok')?.classList.contains('an')));
  await p.click('#hl-bespr');
  await p.waitForTimeout(500);
  ok('Besprechungen ebenso', await p.evaluate(() =>
    document.querySelector<HTMLElement>('#hl-bespr')?.classList.contains('an') &&
    !document.querySelector<HTMLElement>('#hl-dok')?.classList.contains('an')));
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
  await p.evaluate(() => {
    PWA.schubladeAuf && PWA.schubladeAuf();
    /* SEIT E211 SIND VIER ABSCHNITTE AB WERK AUS — links die Bereiche,
       oben die Werkzeuge. Weg sind sie nicht; dieser Punkt handelt davon,
       dass sich ein Abschnitt ZUKLAPPEN lässt, und dafür muss er da sein.
       Es muss VOR der Messung stehen: `vorher` zählt die Pfeile, und die
       erste Fassung schaltete erst danach ein — vier statt fünf. */
    Store.setMeta('sidebarAn', ['werkzeuge', 'agenten', 'bespr', 'kuerzlich']);
    App.zeichneBaum();
  });
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
             /* Die schwebende Leiste gibt es seit E236 nicht mehr — geprüft
                wird jetzt, dass sie auch nicht heimlich zurückkommt. */
             untenWeg: !document.getElementById('handy-unten'),
             polster: getComputedStyle(musselement('#scroll')).paddingBottom };
  });
  console.log('   Am Rechner:', JSON.stringify(rechner));
  /* Die Gegenprobe: was fürs Telefon gebaut wurde, darf am Rechner nicht
     auftauchen. Dort gibt es die Seitenleiste, und zwei Navigationen
     nebeneinander wären eine zu viel. */
  ok('Die Wegeleiste ist am Rechner weg', rechner.oben === 'none');
  ok('Und die alte schwebende Leiste gibt es nirgends mehr', rechner.untenWeg);

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
  /* Nach dem Neuladen ist die Einrichtung der Hauptwelten wieder da —
     sie erscheint 300 ms nach dem Start und fängt Klicks ab (E132). */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
  });
  ok('Der Cover bleibt', await p.evaluate(() =>
    Object.values(Store.cache.blocks).some(b2 => b2.cover)));
  ok('Zugeklappte Abschnitte bleiben gemerkt', await p.evaluate(() =>
    Array.isArray(Store.getMeta('sidebarZu', []))));

  /* ================================================================== *
   * EIN ARBEITSBEREICH, EIN ZEICHEN (E236)
   * ------------------------------------------------------------------ *
   * `mb-konto` rechts in der Menüleiste ist die dritte Stelle, die das
   * Zeichen des Arbeitsbereichs zeigt. Sie stand mit der Vorgabe „R" da,
   * während alle anderen „N" sagen — bei einem Arbeitsbereich ohne
   * eigenes Zeichen wären das zwei Buchstaben für dieselbe Sache. Und die
   * Auffrischung beim Ändern suchte nur INNERHALB von `#btn-settings`.
   *
   * Geprüft wird nicht, WELCHES Zeichen dasteht, sondern dass überall
   * dasselbe steht — vorher und nach dem Ändern. Das ist die Aussage; die
   * Vorgabe selbst darf sich ändern.
   * ================================================================== */
  const zeichenVorher = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.ws-icon')]
      .map(x => (x.textContent || '').trim()));
  ok('Es gibt überhaupt mehrere Stellen mit dem Zeichen',
     zeichenVorher.length >= 2, zeichenVorher.join(','));
  ok('Und alle zeigen dasselbe',
     new Set(zeichenVorher).size === 1, zeichenVorher.join(','));

  /* Und beim Ändern gehen alle mit — über das echte Feld, nicht über
     `setMeta`: die Auffrischung hängt am Feld, nicht am Speicher. */
  await p.evaluate(() => { Einstellungen.oeffne('arbeitsplatz'); });
  await p.waitForTimeout(700);
  const feld = await p.$('[data-set="arbeitsIcon"]');
  ok('Das Feld für das Zeichen ist da', !!feld);
  if (feld) {
    await feld.fill('\u{1F98A}');
    await p.waitForTimeout(500);
    const zeichenNachher = await p.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.ws-icon')]
        .map(x => (x.textContent || '').trim()));
    ok('Nach dem Ändern zeigen wieder alle dasselbe',
       zeichenNachher.length >= 2 && new Set(zeichenNachher).size === 1 &&
       zeichenNachher[0] === '\u{1F98A}', zeichenNachher.join(','));
  }

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x, z]: any[]) => console.log((x ? '✅ ' : '❌ ') + n +
    (!x && z !== undefined ? '   ist=' + JSON.stringify(z) : '')));
  console.log('\n' + pruef.filter((x: any) => x[1]).length + '/' + pruef.length + ' bestanden');
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
