/* Das Abschnittsmenü in der Seitenleiste und die vier Bereiche am Telefon */
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

  /* DAS WILLKOMMEN WEGRÄUMEN — hier misst kein Erstbesucher.
     Seit E55 legt sich beim allerersten Öffnen ein Blatt über den ganzen
     Bildschirm. Das ist dort richtig und hier im Weg: es deckte die
     Pillenleiste ab, und die Meldung dazu lautete „die Leiste ist nicht
     anklickbar" — richtig gemessen, falsch verstanden. */
  const willkommenWeg = async () => {
    await p.evaluate(() => {
      Store.setMeta('rundgangGesehen', true);
      document.getElementById('rg-willkommen')?.remove();
      /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
         über alles und fängt Klicks ab (E132). */
      document.querySelector('.produkt-onboarding-lage')?.remove();
      document.getElementById('rg-einladung')?.remove();
    });
  };
  await willkommenWeg();

  /* --- 1 · Jeder Abschnitt hat drei Punkte ------------------------------ */
  const kopf = await p.evaluate(async () => {
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 350));
    const s = [...document.querySelectorAll<HTMLElement>('#tree .side-section')];
    return { anzahl: s.length,
             mitPunkten: s.filter(x =>
               [...x.querySelectorAll<HTMLElement>('button')].some(y => y.textContent === '⋯')).length,
             namen: s.map(x => x.querySelector<HTMLElement>('span')?.textContent.replace(/[›⌄]/g, '').trim()) };
  });
  pruef('Es gibt Abschnitte',        Number(kopf.anzahl ?? -1) > 3, true);
  pruef('Jeder hat ein ⋯',           kopf.mitPunkten, kopf.anzahl);
  pruef('Darunter „Besprechungen"',  (kopf.namen ?? '').includes('Besprechungen'), true);

  /* --- 2 · Das Menü selbst ---------------------------------------------- */
  const menue = await p.evaluate(async () => {
    document.querySelectorAll<HTMLElement>('.menu').forEach(m => m.remove());
    const abschnitt = [...document.querySelectorAll<HTMLElement>('#tree .side-section')]
      .find(x => x.querySelector<HTMLElement>('span')?.textContent.includes('Werkzeuge'));
    abschnitt?.querySelector<HTMLElement>('button:last-child')?.click();
    await new Promise(r => setTimeout(r, 250));
    const m = document.querySelector('.menu');
    if (!m) throw new Error('.menu ist nicht da — der Lauf misst sonst nichts.');
    const eintraege = [...m.querySelectorAll<HTMLElement>('button')].map(x => x.dataset.a);
    const r = m.getBoundingClientRect();
    return { da: !!m, eintraege, imBild: r.right <= innerWidth + 1 && r.left >= -1,
             texte: [...m.querySelectorAll<HTMLElement>('button')].map(x => x.textContent) };
  });
  pruef('Das Menü öffnet sich',   menue.da, true);
  pruef('Sieben Einträge',        menue.eintraege,
        ['klappen', 'alleZu', 'alleAuf', 'hoch', 'runter', 'aus', 'anpassen']);
  pruef('Es bleibt im Bild',      menue.imBild, true);
  pruef('Und sagt, was es tut',   menue.texte.every(t => t && t.length > 4), true);

  /* --- 3 · Zuklappen und aufklappen ------------------------------------- */
  const klappen = await p.evaluate(async () => {
    const auf = () => (Store.getMeta('sidebarZu', []) || []).length;
    document?.querySelector<HTMLElement>('.menu [data-a="alleZu"]')?.click();
    await new Promise(r => setTimeout(r, 350));
    const alleZu = auf();
    const pfeile = [...document.querySelectorAll<HTMLElement>('#tree .ss-pfeil')].map(x => x.textContent);

    /* Wieder öffnen */
    const abschnitt = [...document.querySelectorAll<HTMLElement>('#tree .side-section')][0];
    abschnitt?.querySelector<HTMLElement>('button:last-child')?.click();
    await new Promise(r => setTimeout(r, 250));
    document?.querySelector<HTMLElement>('.menu [data-a="alleAuf"]')?.click();
    await new Promise(r => setTimeout(r, 350));
    return { alleZu, nachher: auf(),
             alleZugeklappt: pfeile.length > 0 && pfeile.every(x => x === '›') };
  });
  pruef('Alle zuklappen merkt sich das', Number(klappen.alleZu ?? -1) > 3, true);
  pruef('Und die Pfeile drehen sich',    klappen.alleZugeklappt, true);
  pruef('Alle aufklappen räumt wieder auf', klappen.nachher, 0);

  /* --- 4 · Einen einzelnen Abschnitt zuklappen -------------------------- */
  const einzeln = await p.evaluate(async () => {
    document.querySelectorAll<HTMLElement>('.menu').forEach(m => m.remove());
    const abschnitt = [...document.querySelectorAll<HTMLElement>('#tree .side-section')]
      .find(x => x.querySelector<HTMLElement>('span')?.textContent.includes('Kürzlich'));
    abschnitt?.querySelector<HTMLElement>('button:last-child')?.click();
    await new Promise(r => setTimeout(r, 250));
    const text = document.querySelector<HTMLElement>('.menu [data-a="klappen"]')?.textContent;
    document?.querySelector<HTMLElement>('.menu [data-a="klappen"]')?.click();
    await new Promise(r => setTimeout(r, 350));
    const zu = (Store.getMeta('sidebarZu', []) || []);
    /* Nochmal öffnen — jetzt muss dort „Aufklappen" stehen */
    const a2 = [...document.querySelectorAll<HTMLElement>('#tree .side-section')]
      .find(x => x.querySelector<HTMLElement>('span')?.textContent.includes('Kürzlich'));
    a2?.querySelector<HTMLElement>('button:last-child')?.click();
    await new Promise(r => setTimeout(r, 250));
    const text2 = document.querySelector<HTMLElement>('.menu [data-a="klappen"]')?.textContent;
    document?.querySelector<HTMLElement>('.menu [data-a="klappen"]')?.click();
    await new Promise(r => setTimeout(r, 300));
    return { text, zu: (zu ?? '').includes('Kürzlich verwendet'), text2,
             wiederOffen: !(Store.getMeta('sidebarZu', []) || []).includes('Kürzlich verwendet') };
  });
  pruef('Zuerst steht dort Zuklappen', einzeln.text?.includes('Zuklappen'), true);
  pruef('Danach ist er zu',            einzeln.zu, true);
  pruef('Und der Eintrag heisst Aufklappen', einzeln.text2?.includes('Aufklappen'), true);
  pruef('Der zweite Klick öffnet wieder',    einzeln.wiederOffen, true);

  /* --- 5 · Umsortieren --------------------------------------------------- */
  const schieben = await p.evaluate(async () => {
    document.querySelectorAll<HTMLElement>('.menu').forEach(m => m.remove());
    Store.setMeta('sidebarFolge', null);
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 300));

    /* Der erste Abschnitt darf nicht weiter nach oben */
    const ersteId = 'werkzeuge';
    const abschnitt = [...document.querySelectorAll<HTMLElement>('#tree .side-section')]
      .find(x => x.querySelector<HTMLElement>('span')?.textContent.includes('Werkzeuge'));
    abschnitt?.querySelector<HTMLElement>('button:last-child')?.click();
    await new Promise(r => setTimeout(r, 250));
    const hochAus = document.querySelector<HTMLInputElement>('.menu [data-a="hoch"]')?.disabled;
    document?.querySelector<HTMLElement>('.menu [data-a="runter"]')?.click();
    await new Promise(r => setTimeout(r, 350));
    const folge = Store.getMeta('sidebarFolge', []);
    return { hochAus, ersterJetzt: folge[0], zweiter: folge[1], ersteId };
  });
  pruef('Ganz oben ist „hoch" aus', schieben.hochAus, true);
  pruef('Runter tauscht die Reihenfolge', schieben.zweiter, schieben.ersteId);

  /* --- 6 · Ausblenden ---------------------------------------------------- */
  const ausblenden = await p.evaluate(async () => {
    document.querySelectorAll<HTMLElement>('.menu').forEach(m => m.remove());
    Store.setMeta('sidebarAus', []);
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 300));
    const vorher = [...document.querySelectorAll<HTMLElement>('#tree .side-section')].length;
    const abschnitt = [...document.querySelectorAll<HTMLElement>('#tree .side-section')]
      .find(x => x.querySelector<HTMLElement>('span')?.textContent.includes('Besprechungen'));
    if (!abschnitt) return { fehlt: true };
    abschnitt?.querySelector<HTMLElement>('button:last-child')?.click();
    await new Promise(r => setTimeout(r, 250));
    document?.querySelector<HTMLElement>('.menu [data-a="aus"]')?.click();
    await new Promise(r => setTimeout(r, 400));
    const nachher = [...document.querySelectorAll<HTMLElement>('#tree .side-section')].length;
    const gemerkt = (Store.getMeta('sidebarAus', []) || []).includes('bespr');
    Store.setMeta('sidebarAus', []);
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 300));
    return { vorher, nachher, gemerkt,
             zurueck: [...document.querySelectorAll<HTMLElement>('#tree .side-section')].length };
  });
  pruef('Ein Abschnitt verschwindet', ausblenden.nachher, Number(ausblenden.vorher ?? 0) - 1);
  pruef('Und das wird gemerkt',       ausblenden.gemerkt, true);
  pruef('Zurücksetzen bringt ihn wieder', ausblenden.zurueck, ausblenden.vorher);

  /* --- 7 · Weg zur Anpassliste ------------------------------------------ */
  const anpassen = await p.evaluate(async () => {
    document.querySelectorAll<HTMLElement>('.menu').forEach(m => m.remove());
    const abschnitt = [...document.querySelectorAll<HTMLElement>('#tree .side-section')][0];
    abschnitt?.querySelector<HTMLElement>('button:last-child')?.click();
    await new Promise(r => setTimeout(r, 250));
    document?.querySelector<HTMLElement>('.menu [data-a="anpassen"]')?.click();
    await new Promise(r => setTimeout(r, 400));
    const zeilen = document.querySelectorAll('#tree .side-item.anpass').length;
    /* wieder raus */
    App.abschnitteAnpassen && App.abschnitteAnpassen();
    await new Promise(r => setTimeout(r, 300));
    return zeilen;
  });
  /* Acht Abschnitte, dazu „Reihenfolge zurücksetzen" und „Fertig" */
  pruef('Das Menü führt in den Anpassmodus', anpassen, 10);

  /* --- 8 · Das Menü schliesst sich beim Klick daneben -------------------- */
  const zu = await p.evaluate(async () => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    document.querySelectorAll<HTMLElement>('.menu').forEach(m => m.remove());
    App.zeichneBaum();
    await new Promise(r => setTimeout(r, 300));
    const abschnitt = [...document.querySelectorAll<HTMLElement>('#tree .side-section')][0];
    abschnitt?.querySelector<HTMLElement>('button:last-child')?.click();
    await new Promise(r => setTimeout(r, 250));
    const offen = !!document.querySelector('.menu');
    /* mousedown UND click, wie ein echter Zeiger: seit das ⋯-Menü über
       `Menue.menu` läuft (test155), schliesst es auf mousedown daneben —
       so wie jedes Modulmenü. Das nackte click-Ereignis hier war eine
       Simulation, die kein Gerät je erzeugt. */
    musselement('#page').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    musselement('#page').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise(r => setTimeout(r, 250));
    return { offen, danach: !document.querySelector('.menu') };
  });
  pruef('Es geht auf',   zu.offen, true);
  pruef('Und wieder zu', zu.danach, true);

  /* --- 9 · Am Telefon: die vier Bereiche --------------------------------- */
  const handy = await b.newPage({ viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true });
  const fehler2: any[] = [];
  handy.on('pageerror', e => fehler2.push('JS: ' + e.message));
  await handy.goto('file://' + WURZEL + '/index.html');
  await handy.waitForTimeout(1900);
  /* Auch hier: kein Erstbesucher, also kein Willkommen (E55). */
  await handy.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });

  /* SEIT DEM UMBAU NACH DER VORLAGE stehen die Bereiche oben als Pillen.
     Die Fragen sind dieselben geblieben — nur die letzte ist eine andere
     geworden, und das ist der Kern der neuen Leiste: die Namen stehen NICHT
     alle da, sondern nur der eine, bei dem man gerade ist. */
  const leiste = await handy.evaluate(() => {
    const l = document.getElementById('handy-oben');
    if (!l) throw new Error('handy-oben ist nicht da — der Lauf misst sonst nichts.');
    const sicht = (el: Element | null) => !!el && getComputedStyle(el).display !== 'none';
    return { sichtbar: getComputedStyle(l).display !== 'none',
             ids: [...l.querySelectorAll<HTMLElement>('button')].map(x => x.id),
             beschriftung: [...l.querySelectorAll<HTMLElement>('b')].map(x => x.textContent),
             markiert: [...l.querySelectorAll<HTMLElement>('button.an')].map(x => x.id),
             nameSichtbar: [...l.querySelectorAll<HTMLElement>('button')]
               .filter(b => sicht(b.querySelector('b'))).map(b => b.id),
             punkt: !!l.querySelector('.hl-punkt') };
  }) as any;
  pruef('Die Leiste steht am Telefon', leiste.sichtbar, true);
  /* Seit E38: „Seiten" statt „Chats". Der Platz oben gehört dem, was man
     täglich sucht; die KI steht unten in der Leiste und im R-Blatt. */
  /* SEIT E132 SIND ES FÜNF BEREICHE, und drei heissen anders: die
     Produktwelten benennen `hl-start` in „Heute", `hl-seiten` in
     „Seiten" (der Titel bleibt „Workspace") und `hl-bespr` in „Plan" um und
     stellen „Lernen" davor. Dieselben Tasten, dieselben Ziele, andere
     Namen. */
  pruef('Konto und fünf Bereiche', leiste.ids,
        ['hl-konto', 'hl-lernen', 'hl-start', 'hl-seiten', 'hl-bespr', 'hl-mehr']);
  pruef('Jeder hat seinen Namen dabei', leiste.beschriftung,
        ['Lernen', 'Heute', 'Seiten', 'Plan', 'Mehr']);
  pruef('Start ist markiert', leiste.markiert, ['hl-start']);
  /* DAS IST DIE REGEL, DIE DEN PLATZ MACHT. Stünden alle vier Namen da,
     bliebe für den Inhalt nichts; stünde keiner da, müsste man raten. */
  pruef('Nur der markierte zeigt seinen Namen', leiste.nameSichtbar, ['hl-start']);
  pruef('Mehr hat einen Punktplatz', leiste.punkt, true);

  /* Umschalten markiert richtig */
  const wechsel = await handy.evaluate(async () => {
    const raus = [];
    for (const id of ['hl-seiten', 'hl-bespr', 'hl-start']) {
      document.getElementById(id)?.click();
      await new Promise(r => setTimeout(r, 450));
      raus.push([id, [...document.querySelectorAll<HTMLElement>('#handy-oben button.an')].map(x => x.id)]);
    }
    if ((window as any).PWA && PWA.schubladeZu) PWA.schubladeZu();
    await new Promise(r => setTimeout(r, 300));
    return raus;
  });
  wechsel.forEach(([id, markiert]) =>
    pruef('Nach dem Tippen auf ' + id + ' ist genau der markiert', markiert, [id]));

  /* Die Schublade deckt die Leiste nicht zu */
  const deckung = await handy.evaluate(async () => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    musselement('#hl-seiten').click();
    await new Promise(r => setTimeout(r, 500));
    /* DIE RICHTUNG HAT SICH ZWEIMAL GEDREHT. Erst lag die Leiste unten und
       die Schublade musste ÜBER ihr enden. Dann lagen die Pillen oben und
       die Schublade begann darunter. Seit E38 gibt es hier gar keine
       Schublade mehr — „Seiten" zeichnet auf die Bühne, und gemessen wird
       deshalb der Inhalt selbst.

       DIE FRAGE IST DIESELBE GEBLIEBEN, und nur sie zählt: deckt der
       Inhalt die Navigation zu? Eine Leiste, die vom Inhalt verdeckt wird,
       ist eine Sackgasse. Der Titel der Ansicht ist das oberste sichtbare
       Stück Inhalt — liegt er unter der Leiste, liegt alles darunter. */
    const l = musselement('#handy-oben').getBoundingClientRect();
    const titel = document.querySelector<HTMLElement>('#page h1');
    const t = titel ? titel.getBoundingClientRect() : null;
    const oben = document.elementFromPoint(l.left + l.width * 0.7, l.top + l.height / 2);
    if ((window as any).PWA && PWA.schubladeZu) PWA.schubladeZu();
    await new Promise(r => setTimeout(r, 300));
    return { inhaltBeginntDarunter: !!t && Math.round(t.top) >= Math.round(l.bottom) - 2,
             titelText: (titel?.textContent ?? '').trim(),
             obenLiegt: !!(oben && oben.closest('#handy-oben')) };
  });
  /* „Seiten" heisst jetzt „🧱 Workspace" (E132). */
  pruef('Der Seitenbereich ist wirklich offen', deckung.titelText, '🧱 Workspace');
  pruef('Sein Inhalt beginnt unter der Leiste', deckung.inhaltBeginntDarunter, true);
  pruef('Und die Leiste ist anklickbar',                deckung.obenLiegt, true);

  /* Suchen und Neu sind in die Kopfzeile gewandert */
  const kopfzeile = await handy.evaluate(() => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    const ids = [...document.querySelectorAll<HTMLElement>('#topbar button')]
      .filter(b => getComputedStyle(b).display !== 'none').map(b => b.id);
    const t = musselement('#topbar').getBoundingClientRect();
    return { ids, ueberlauf: musselement('#topbar').scrollWidth - Math.round(t.width) };
  });
  /* SUCHEN UND NEU SIND NACH UNTEN GEWANDERT — dorthin, wo der Daumen
     hinkommt. In der Kopfzeile stehen sie deshalb nicht mehr; sie hat nur
     noch, was zur geöffneten Seite gehört. */
  pruef('Suchen steht nicht mehr in der Kopfzeile',
        (kopfzeile.ids ?? '').includes('btn-suche-handy'), false);
  pruef('Die Kopfzeile läuft nicht über', Number(kopfzeile.ueberlauf ?? -1) <= 1, true);
  const untenDa = await handy.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#handy-unten button')].map(b => b.id)) as string[];
  pruef('Suchen steht unten', untenDa.includes('hu-suche'), true);
  pruef('Neu ebenso',         untenDa.includes('hu-neu'), true);

  const werkzeuge = await handy.evaluate(async () => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    musselement('#hu-suche').click();
    await new Promise(r => setTimeout(r, 400));
    const sucheDa = !!document.querySelector('.overlay');
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    const vorher = Store.rootPages().length;
    /* SEIT E45 FRAGT DER STIFT ERST, WAS ENTSTEHEN SOLL — Seite,
       Datenbank, Tabelle, Aufgabe, Karteikarte, Datei oder Vorlage. Vorher
       legte er sofort eine leere Seite an, was in einem von acht Fällen
       richtig war. Diese Prüfung tippt jetzt wie ein Mensch: erst den
       Stift, dann „Neue Seite". */
    musselement('#hu-neu').click();
    await new Promise(r => setTimeout(r, 500));
    const blattDa = !!document.querySelector('.menu.blatt [data-neu="seite"]');
    document.querySelector<HTMLElement>('.menu.blatt [data-neu="seite"]')?.click();
    await new Promise(r => setTimeout(r, 700));
    return { sucheDa, blattDa, mehr: Store.rootPages().length > vorher,
             zu: document.querySelectorAll('.menu, .menu-grund').length === 0 };
  });
  pruef('Der Lupenknopf öffnet die Suche', werkzeuge.sucheDa, true);
  pruef('Der Stift fragt erst, was entstehen soll', werkzeuge.blattDa, true);
  pruef('… und „Neue Seite" legt eine an', werkzeuge.mehr, true);
  pruef('… und das Blatt ist danach zu',   werkzeuge.zu, true);

  /* Am PC ist von den beiden nichts zu sehen */
  const amPC = await p.evaluate(() => [...document.querySelectorAll<HTMLElement>('.nur-handy')]
    .map(x => getComputedStyle(x).display));
  pruef('Am PC bleiben sie verborgen', amPC.every(d => d === 'none'), true);

  /* Am Telefon hat auch die Seitenleiste ihre Abschnittsmenüs */
  const menueHandy = await handy.evaluate(async () => {
    /* Ein Element, das dasein MUSS. Fehlt es, misst der Lauf nichts mehr —
       dann ist eine Meldung mit dem Selektor besser als „Cannot read
       properties of null" zwanzig Zeilen weiter. */
    const musselement = (sel: string): HTMLElement => {
      const x = document.querySelector<HTMLElement>(sel);
      if (!x) throw new Error(sel + ' ist nicht da.');
      return x;
    };
    /* Zurueck auf Start — im Chat-Bereich zeigt die Leiste die Agenten,
       nicht die Abschnitte. Das ist so gewollt. */
    musselement('#hl-start').click();
    await new Promise(r => setTimeout(r, 450));
    if ((window as any).PWA && PWA.schubladeAuf) PWA.schubladeAuf();
    await new Promise(r => setTimeout(r, 450));
    document.querySelectorAll<HTMLElement>('.menu').forEach(m => m.remove());
    const abschnitt = [...document.querySelectorAll<HTMLElement>('#tree .side-section')][0];
    if (!abschnitt) return { fehlt: true };
    abschnitt?.querySelector<HTMLElement>('button:last-child')?.click();
    await new Promise(r => setTimeout(r, 300));
    const m = document.querySelector('.menu');
    const r = m ? m.getBoundingClientRect() : null;
    const raus = r ? (r.right > innerWidth + 1 || r.left < -1) : true;
    document.querySelectorAll<HTMLElement>('.menu').forEach(x => x.remove());
    if ((window as any).PWA && PWA.schubladeZu) PWA.schubladeZu();
    return { da: !!m, raus };
  });
  pruef('Das Abschnittsmenü geht auch am Telefon', menueHandy.da, true);
  pruef('Und passt ins Bild',                      menueHandy.raus, false);

  /* --- 10 · Nach dem Neustart ------------------------------------------- */
  await p.evaluate(async () => {
    Store.setMeta('sidebarZu', ['Meine Apps']);
    Store.setMeta('sidebarFolge', ['apps', 'werkzeuge']);
    await Store.flush();
  });
  await p.reload();
  await p.waitForTimeout(2000);
  /* Nach dem Neuladen ist die Einrichtung der Hauptwelten wieder da —
     sie erscheint 300 ms nach dem Start und fängt Klicks ab (E132). */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
  });
  await willkommenWeg();
  const nach = await p.evaluate(() => ({
    zu: Store.getMeta('sidebarZu', []),
    folge: (Store.getMeta('sidebarFolge', []) || [])[0],
    erster: ([...document.querySelectorAll<HTMLElement>('#tree .side-section')][0]
      ?.querySelector('span')?.textContent ?? '').replace(/[›⌄]/g, '').trim()
  }));
  pruef('Zugeklappt überlebt den Neustart', nach.zu, ['Meine Apps']);
  pruef('Die Reihenfolge auch',             nach.folge, 'apps');
  pruef('Und zeigt sich in der Leiste',     nach.erster, 'Meine Apps');

  console.log(`\n${ok}/${ok + bad} bestanden`);
  const alle = [...fehler, ...fehler2];
  console.log(alle.length ? 'JS-Fehler:\n' + alle.join('\n') : 'Keine JS-Fehler.');
  await b.close();
  process.exit(bad || alle.length ? 1 : 0);
})();
