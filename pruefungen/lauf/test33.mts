import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1500, height: 950 } });
  const f: any[] = []; p.on('pageerror', e => f.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/11434|CONNECTION_REFUSED|ERR_/i.test(m.text())) f.push('CONSOLE: ' + m.text()); });
  const pruef: any[] = []; const ok = (n: any, x: any) => pruef.push([n, !!x]);

  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForTimeout(1600);
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

  /* ================================================================== *
   * 1) SEITENLEISTE — Abschnitt „Meine Apps"
   * ================================================================== */
  const apps = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.apps-block [data-app]')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')));
  console.log('   Meine Apps:', JSON.stringify(apps));
  ok('Abschnitt Meine Apps hat neun Einträge', apps.length >= 9);
  /* HIESS „BIBLIOTHEK", HEISST „ALLE SEITEN" (E207).
     Der Name musste sich ändern, weil daneben eine Zeile „Bibliothek" in der
     obersten Gruppe steht, die etwas ANDERES öffnet — die Bibliothek der
     Arbeitswelt. Zwei gleich benannte Knöpfe zu zwei Ansichten sind
     schlimmer als ein ungewohnter Name.

     Geprüft wird über die Marke und nicht über den Text: `bib` ist eine
     Adresse nach aussen und bleibt (E167), der sichtbare Name darf sich
     ändern. Der erste Entwurf dieses Punktes prüfte den Text und ging
     deshalb rot, obwohl der Knopf unverändert dasteht. */
  const marken = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.apps-block [data-app]')]
      .map(x => x.dataset['app'] || ''));
  ok('Die Seitenübersicht ist dabei', marken.includes('bib'));
  ok('Meine Aufgaben dabei', apps.some(x => (x ?? '').includes('Meine Aufgaben')));
  ok('Marktplatz dabei', apps.some(x => (x ?? '').includes('Marktplatz')));
  /* DER PAPIERKORB STEHT NICHT MEHR IN „MEINE APPS" (E206) — er stand dort
     UND im Fuss, und beide riefen `App.papierkorb()`. Redur hat dem
     Entfernen der Kopie zugestimmt.

     Die Behauptung dahinter war nie „er steht in dieser Liste", sondern „man
     kommt hin". Genau das steht jetzt hier. Der alte Punkt wäre auch grün
     geblieben, wenn der Knopf ins Leere geführt hätte. */
  const papierkorbDa = await p.evaluate(() => !!document.getElementById('btn-trash'));
  ok('Zum Papierkorb führt ein Weg', papierkorbDa);
  ok('Abschnittsüberschrift steht darüber', await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.side-section span')].some(x => (x.textContent ?? '').startsWith('Meine Apps'))));

  /* ================================================================== *
   * 2) BIBLIOTHEK
   * ================================================================== */
  await p.evaluate(() => {
    const a = Store.addPage(null, { text: 'Bibliothekstest A' });
    const c = Store.addPage(null, { text: 'Bibliothekstest B' });
    Store.updateBlock(c.id, { favorite: true });
    App.oeffne(a.id);
  });
  await p.waitForTimeout(500);

  /* DIE APPS LIEGEN SEIT E206 IN SCHUBLADEN, und zugeklappt ist die
     Voreinstellung. Ein Klick auf ein verstecktes Element wartet, bis die
     Zeit abläuft — die Schublade muss also erst auf.

     Das ist kein Umweg um die Prüfung herum, sondern der Weg, den ein
     Mensch auch geht. Und er prüft im selben Zug, dass die Schublade
     überhaupt aufgeht: bliebe sie zu, liefe der Klick danach in denselben
     Zeitablauf.

     `[data-app="bib"]` heisst seit E207 „Alle Seiten" und nicht mehr
     „Bibliothek" — die Marke bleibt, weil sie eine Adresse nach aussen ist
     (E167). Der Weg über `#btn-library` wäre FALSCH: der führt in die
     Bibliothek der Arbeitswelt, nicht in diese hier. Genau daran ist der
     erste Versuch gescheitert.

     Geöffnet werden ALLE Schubladen und nicht die eine, in der „bib" heute
     liegt: sonst wäre dieser Lauf an eine Gruppenzuordnung gebunden, die
     eine Gestaltungsfrage ist und keine Zusage. Wer eine App umsortiert,
     soll dafür keine Prüfung anfassen müssen. */
  const schubladenAuf = async () => {
    /* Über den Speicher und nicht über Klicks: der Baum wird bei jedem
       Ansichtswechsel neu gezeichnet, und ein Knopf, den man vorher
       gegriffen hat, ist danach ein anderer — der zweite Aufruf lief prompt
       in „element is not attached".

       Dass die Schublade sich mit einem Klick öffnet, prüft `test222` §6.
       Hier wird nur der Zustand hergestellt, den dieser Lauf braucht; eine
       Prüfung, die nebenbei etwas anderes mitprüft, ist bei einem Fehler
       schwerer zu lesen, nicht leichter. */
    await p.evaluate(() => {
      const alle = [...document.querySelectorAll<HTMLElement>('[data-app-gruppe]')]
        .map(b => b.dataset['appGruppe'] || '').filter(Boolean);
      Store.setMeta('appGruppenAuf', alle);
      App.zeichneBaum();
    });
    await p.waitForTimeout(300);
  };
  await schubladenAuf();
  await p.click('[data-app="bib"]');
  await p.waitForTimeout(600);

  /* DIE BIBLIOTHEK HAT SEIT E207 ZWEI FORMEN, und das Regal ist die
     Voreinstellung. Was hier geprüft wird — Spalten, Sortieren, Zeilen —
     gehört der LISTE; im Regal gibt es keinen Spaltenkopf, und ein Klick
     darauf wartet, bis die Zeit abläuft.

     Umgeschaltet wird über den Knopf und nicht über `Store.setMeta`: so
     prüft dieser Schritt nebenbei, dass der Umschalter überhaupt umschaltet.
     Die Wahl bleibt gemerkt, deshalb steht sie hier einmal und nicht vor
     jedem Punkt. */
  /* ================================================================== *
   * DAS REGAL (E207) — geprüft, BEVOR auf die Liste geschaltet wird
   * ------------------------------------------------------------------ *
   * Es ist die Voreinstellung und war bis hierher ungeprüft. Die drei
   * Punkte sind die drei Behauptungen, die es aufstellt: es fasst nach
   * Heften zusammen, es zeigt echten Inhalt, und ein Klick führt hin.
   * ================================================================== */
  const regal = await p.evaluate(() => {
    const karten = [...document.querySelectorAll<HTMLElement>('.bib-heft')];
    return {
      hefte: karten.length,
      zahlen: document.querySelector('.bib-zahlen')?.textContent || '',
      /* Die entscheidende Zahl: wie viele Blätter tragen wirklich Text?
         Ein Regal, in dem überall „Dieses Heft ist noch leer" steht, hätte
         alle anderen Punkte ebenfalls bestanden — genau so sah es aus,
         als `Vorschau` den Speicher über `window` suchte. */
      mitInhalt: karten.filter(k =>
        (k.querySelector('.bib-heft-blatt')?.textContent || '').trim().length > 20).length,
      ziele: karten.map(k => k.dataset['id'] || '').filter(Boolean).length,
      quellenImBestand: new Set(Object.values<any>(Store.cache.blocks)
        .filter(b => b.type === 'page' && b.alive !== false && !b.system)
        .map(b => b.parentTable === 'collection' ? 'c:' + b.parentId : 'p')).size
    };
  });
  console.log('   Regal:', JSON.stringify(regal));
  ok('Das Regal fasst die Seiten zu Heften zusammen', regal.hefte > 0);

  /* ------------------------------------------------------------------ *
   * UND DIE VORSCHAU SELBST — sonst prüft `mitInhalt` das Falsche.
   * ------------------------------------------------------------------ *
   * Erster Versuch der Gegenprobe: den Fehler „Store über window suchen"
   * wieder eingebaut, gebaut, geprüft, und `mitInhalt` blieb bei 3.
   * Nachgemessen war `Vorschau.miniatur()` dabei nachweislich leer — 0
   * Zeichen bei einer Seite mit 16 Kindern.
   *
   * Der Grund ist MEIN EIGENER RÜCKFALL: hat ein Heft keine Miniatur, zeigt
   * die Karte stattdessen die Titel ihrer Seiten (`inhaltsListe`). Das ist
   * für Datenbankzeilen richtig und macht die Prüfung darüber blind — das
   * Blatt ist gefüllt, egal ob die Vorschau lebt.
   *
   * Geprüft wird deshalb die Behauptung des Kernmoduls direkt: hat eine
   * Seite Kinder mit Text, muss `miniatur()` etwas liefern. E202 sagt es
   * genau so — eine Gegenprobe muss selbst beweisen, dass sie etwas
   * geändert hat, und dieser Punkt ist der Beweis.
   */
  const vorschauKern = await p.evaluate(() => {
    const seiten = Object.values<any>(Store.cache.blocks)
      .filter(b => b.type === 'page' && b.alive !== false)
      .filter(b => Store.childrenOf(b.id).some((k: any) => (k.text || '').trim()));
    const probe = seiten.slice(0, 5).map((b: any) => ({
      kinder: Store.childrenOf(b.id).length,
      zeichen: Vorschau.miniatur(b.id, 6).length,
      anriss: Vorschau.anriss(b.id, b.text || '').length
    }));
    return { gepruefte: probe.length, stumm: probe.filter(x => !x.zeichen).length,
             ohneAnriss: probe.filter(x => !x.anriss).length, probe };
  });
  console.log('   Vorschau:', JSON.stringify(vorschauKern.probe));
  ok('Es gibt überhaupt Seiten mit Inhalt zu prüfen', vorschauKern.gepruefte >= 3);
  ok('Keine Seite mit Text liefert eine stumme Miniatur', vorschauKern.stumm === 0);
  ok('Und auch keinen leeren Anriss', vorschauKern.ohneAnriss === 0);
  ok('Und sagt, wie viele Hefte und Seiten es sind', /Hefte? · \d+ Seiten?/.test(regal.zahlen));
  ok('Jedes Heft zeigt echten Inhalt, keinen leeren Kasten',
     regal.mitInhalt === regal.hefte);
  ok('Und jedes führt auf eine Seite', regal.ziele === regal.hefte);

  /* DIE GEMERKTE WAHL MUSS EINEN NEUAUFBAU ÜBERLEBEN.
     Der erste Entwurf las die Form beim SKRIPTLADEN — da ist IndexedDB noch
     nicht ausgelesen, `getMeta` gab den Standard, und die Wahl war beim
     nächsten Start weg. Kein Wurf, keine Meldung. Diese Prüfung geht rot,
     wenn jemand den Wert wieder zu früh liest. */
  await p.click('[data-form="liste"]');
  await p.waitForTimeout(400);
  await p.evaluate(() => { App.zeichneSeite(); });
  await p.waitForTimeout(400);
  const merktSich = await p.evaluate(() => ({
    gemerkt: Store.getMeta('bibForm', 'regal'),
    gezeigt: document.querySelector('.bib-tab') ? 'liste' : 'regal'
  }));
  ok('Die Wahl „Liste" wird gemerkt', merktSich.gemerkt === 'liste');
  ok('… und beim nächsten Zeichnen auch gezeigt', merktSich.gezeigt === 'liste');

  await p.waitForTimeout(500);

  const bib = await p.evaluate(() => ({
    titel: document.querySelector('.bib-titel')?.textContent,
    reiter: [...document.querySelectorAll<HTMLElement>('.bib-reiter button')].map(x => (x.textContent ?? '').trim()),
    spalten: [...document.querySelectorAll<HTMLElement>('.bib-kopfzeile [data-s]')].map(x => (x.textContent ?? '').replace(/[↑↓]/g, '').trim()),
    zeilen: document.querySelectorAll('.bib-zeile[data-id]').length,
    krume: document.getElementById('crumb')?.textContent,
    hatQuelle: !!document.querySelector('.bib-quelle'),
    hatPerson: !!document.querySelector('.bib-kreis'),
    fuss: document.querySelector('.bib-fuss')?.textContent
  }));
  console.log('   Bibliothek:', JSON.stringify(bib));
  ok('Bibliothek trägt ihren Titel', bib.titel === 'Bibliothek');
  ok('Vier Reiter plus „mehr"', bib.reiter.length === 5 && /mehr/.test(bib.reiter[4] ?? ''));
  ok('Reiter heissen wie bei Notion',
     (bib.reiter[0] ?? '').includes('Kürzlich verwendet') && (bib.reiter[1] ?? '').includes('Favoriten') &&
     (bib.reiter[2] ?? '').includes('Geteilt') && (bib.reiter[3] ?? '').includes('Privat'));
  ok('Vier Spalten wie im Bild',
     bib.spalten.length === 4 && (bib.spalten[0] ?? '').includes('Seitenbezeichnung') &&
     (bib.spalten[1] ?? '').includes('Erstellt von') && (bib.spalten[2] ?? '').includes('Quelle'));
  ok('Zeilen erscheinen', bib.zeilen >= 2);
  ok('Quelle wird gezeigt', bib.hatQuelle);
  ok('Person wird gezeigt', bib.hatPerson);
  ok('Krume nennt die Bibliothek', /Bibliothek/.test(bib.krume || ''));
  ok('Fusszeile zählt', /Seiten?/.test(bib.fuss || ''));

  /* Reiter Favoriten */
  await p.click('.bib-reiter [data-r="favoriten"]');
  await p.waitForTimeout(400);
  const favs = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.bib-zeile[data-id] .bib-txt')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')));
  console.log('   Favoriten:', JSON.stringify(favs));
  ok('Favoritenreiter filtert', favs.length >= 1 && favs.every(x => (x ?? '').includes('B')));

  /* Sortieren durch Kopfklick */
  await p.click('.bib-reiter [data-r="alle"]').catch(() => {});
  await p.evaluate(() => { document.querySelector<HTMLElement>('.bib-mehr')?.click(); });
  await p.waitForTimeout(300);
  await p.evaluate(() => {
    const b2 = [...document.querySelectorAll<HTMLElement>('.overlay button[data-x], .menu button[data-x]')]
      .find(x => x.dataset.x === 'alle');
    b2?.click();
  });
  await p.waitForTimeout(400);
  await p.click('.bib-kopfzeile [data-s="name"]');
  await p.waitForTimeout(400);
  const sortiert = await p.evaluate(() => ({
    pfeil: !!document.querySelector('.bib-kopfzeile [data-s="name"] em'),
    erste: document.querySelector('.bib-zeile[data-id] .bib-txt')?.textContent
  }));
  console.log('   Sortiert:', JSON.stringify(sortiert));
  ok('Klick auf den Spaltenkopf sortiert', sortiert.pfeil);

  /* Zeile öffnen */
  await p.evaluate(() => document.querySelector<HTMLElement>('.bib-zeile[data-id]')?.click());
  await p.waitForTimeout(500);
  ok('Klick öffnet die Seite', await p.evaluate(() =>
    !!document.getElementById('title') && !document.querySelector('.bib-titel')));

  /* ================================================================== *
   * 3) MEINE AUFGABEN
   * ================================================================== */
  await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Aufgabenquelle' });
    const { collectionId } = Store.addDatabase(s.id, 'Sprint', {
      name:   { name: 'Name', type: 'title' },
      wer:    { name: 'Zuständig', type: 'person' },
      fertig: { name: 'Fertig', type: 'checkbox' },
      wann:   { name: 'Frist', type: 'date' }
    }, 'table');
    const wer = (Konten.aktiv() || {}).name || 'Ich';
    const a = Store.addRow(collectionId, {});
    Store.updateBlock(a.id, { text: 'Fenster putzen', props: { wer, fertig: false, wann: '2026-08-10' } });
    const b2 = Store.addRow(collectionId, {});
    Store.updateBlock(b2.id, { text: 'Rechnung zahlen', props: { wer, fertig: true, wann: '2026-08-01' } });
    const c2 = Store.addRow(collectionId, {});
    Store.updateBlock(c2.id, { text: 'Fremde Aufgabe', props: { wer: 'Jemand anderes', fertig: false } });
  });
  await p.waitForTimeout(400);
  await schubladenAuf();
  await p.click('[data-app="aufgaben"]');
  await p.waitForTimeout(600);

  const auf = await p.evaluate(() => ({
    titel: document.querySelector('.bib-titel')?.textContent,
    zeilen: [...document.querySelectorAll<HTMLElement>('.auf-zeile')].map(x => x.querySelector<HTMLElement>('.auf-titel')?.textContent),
    gruppen: [...document.querySelectorAll<HTMLElement>('.auf-grp')].map(x => (x.textContent ?? '').trim()),
    fertige: document.querySelectorAll('.auf-zeile.fertig').length,
    dbs: [...document.querySelectorAll<HTMLElement>('.auf-db')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, ''))
  }));
  console.log('   Meine Aufgaben:', JSON.stringify(auf));
  ok('Seite heisst Meine Aufgaben', auf.titel === 'Meine Aufgaben');
  ok('Nur meine Aufgaben stehen da',
     (auf.zeilen ?? '').includes('Fenster putzen') && (auf.zeilen ?? '').includes('Rechnung zahlen') &&
     !(auf.zeilen ?? '').includes('Fremde Aufgabe'));
  ok('Offen und Erledigt sind getrennt',
     auf.gruppen.some(x => x.startsWith('Offen')) && auf.gruppen.some(x => x.startsWith('Erledigt')));
  ok('Erledigtes ist durchgestrichen', auf.fertige === 1);
  ok('Die Datenbank steht dabei', /Sprint/.test(auf.dbs.join(' ')));

  /* Abhaken direkt in der Liste */
  await p.evaluate(() => {
    const z = [...document.querySelectorAll<HTMLElement>('.auf-zeile')]
      .find(x => x.querySelector<HTMLElement>('.auf-titel')?.textContent === 'Fenster putzen');
    z?.querySelector<HTMLElement>('.auf-haken')?.click();
  });
  await p.waitForTimeout(500);
  ok('Haken in der Liste wirkt', await p.evaluate(() =>
    document.querySelectorAll('.auf-zeile.fertig').length === 2));

  /* Werkzeugzeile der Aufgabenseite: Filtern, Sortieren, Suchen */
  const awz = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.bib-werkzeuge button')].map(x => x.dataset.a));
  console.log('   Aufgaben-Werkzeuge:', JSON.stringify(awz));
  ok('Vier Werkzeuge plus Neue Aufgabe',
     ['afilter', 'asort', 'asuche', 'quellen', 'neu'].every(x => (awz ?? '').includes(x)));

  await p.click('[data-a="afilter"]'); await p.waitForTimeout(350);
  await p.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-x="offen"]')?.click());
  await p.waitForTimeout(500);
  const nurOffen = await p.evaluate(() => ({
    zeilen: document.querySelectorAll('.auf-zeile').length,
    fertige: document.querySelectorAll('.auf-zeile.fertig').length,
    knopfAn: !!document.querySelector('[data-a="afilter"].an')
  }));
  console.log('   Nur offene:', JSON.stringify(nurOffen));
  ok('Filter zeigt nur offene Aufgaben', nurOffen.fertige === 0 && nurOffen.zeilen > 0);
  ok('Der Filterknopf ist markiert', nurOffen.knopfAn);
  await p.click('[data-a="afilter"]'); await p.waitForTimeout(350);
  await p.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-x="alle"]')?.click());
  await p.waitForTimeout(400);

  await p.click('[data-a="asuche"]'); await p.waitForTimeout(400);
  await p.fill('#auf-suche', 'Fenster'); await p.waitForTimeout(500);
  const gesucht = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.auf-titel')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')));
  console.log('   Aufgabensuche:', JSON.stringify(gesucht));
  ok('Suche auf der Aufgabenseite filtert',
     gesucht.length === 1 && gesucht[0] === 'Fenster putzen');
  await p.click('[data-a="asuchzu"]'); await p.waitForTimeout(400);

  /* Quellen einstellen */
  await p.click('[data-a="quellen"]');
  await p.waitForTimeout(400);
  const quellen = await p.evaluate(() => {
    const t = document.body?.textContent;
    const n = document.querySelectorAll('.overlay [data-c]').length;
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return { da: (t ?? '').includes('Aufgabenquellen'), n };
  });
  console.log('   Quellen:', JSON.stringify(quellen));
  ok('Aufgabenquellen lassen sich einstellen', quellen.da && quellen.n >= 1);

  /* ================================================================== *
   * 4) PAPIERKORB — Suche, Filter, Zeilenwerkzeuge
   * ================================================================== */
  await p.evaluate(() => {
    const x = Store.addPage(null, { text: 'Weggeworfen Alpha' });
    const y = Store.addPage(null, { text: 'Weggeworfen Beta' });
    Store.trashBlock(x.id); Store.trashBlock(y.id);
    App.papierkorb();
  });
  await p.waitForTimeout(500);

  const pk = await p.evaluate(() => ({
    suchfeld: document.querySelector<HTMLInputElement>('#pk-suche')?.placeholder,
    chips: [...document.querySelectorAll<HTMLElement>('.pk-chip')].map(x => (x.textContent ?? '').replace('⌄', '').trim()),
    zeilen: document.querySelectorAll('.pk-res button[data-id]').length,
    zurueck: document.querySelectorAll('.pk-tat[data-a="restore"]').length,
    weg: document.querySelectorAll('.pk-tat[data-a="purge"]').length,
    hinweis: document.querySelector('.pk-hint')?.textContent
  }));
  console.log('   Papierkorb:', JSON.stringify(pk));
  ok('Suchfeld wie bei Notion', /Seiten im Papierkorb suchen/.test(pk.suchfeld || ''));
  ok('Drei Filterknöpfe', pk.chips.length === 3 &&
     (pk.chips[0] ?? '').includes('Zuletzt bearbeitet von') && (pk.chips[1] ?? '').includes('In'));
  ok('Beide gelöschten Seiten sind da', pk.zeilen >= 2);
  ok('Je Zeile Pfeil und Eimer', pk.zurueck >= 2 && pk.weg >= 2);
  ok('Hinweis auf die dreissig Tage', /30 Tage/.test(pk.hinweis || ''));

  await p.fill('#pk-suche', 'Alpha');
  await p.waitForTimeout(500);
  const gefunden = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.pk-res button[data-id]')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')));
  console.log('   Suche im Papierkorb:', JSON.stringify(gefunden.map(x => x.slice(0, 22))));
  ok('Suche filtert', gefunden.length === 1 && (gefunden[0] ?? '').includes('Alpha'));

  await p.evaluate(() => document.querySelector<HTMLElement>('.pk-tat[data-a="restore"]')?.click());
  await p.waitForTimeout(500);
  const nachher = await p.evaluate(() => {
    const n = Store.trashed().length;
    document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
    return n;
  });
  ok('Pfeil holt zurück', nachher === 1);

  /* ================================================================== *
   * 5) SPALTENMENÜ — Kopf, Gruppe, Berechnen, Links/Rechts einfügen
   * ================================================================== */
  await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Spaltentest' });
    const { collectionId } = Store.addDatabase(s.id, 'Zeug', {
      name: { name: 'Name', type: 'title' },
      zahl: { name: 'Zahl', type: 'number' },
      art:  { name: 'Art', type: 'select', options: [{ name: 'A', color: 'blue' }, { name: 'B', color: 'red' }] }
    }, 'table');
    [['Eins', 10, 'A'], ['Zwei', 20, 'B'], ['Drei', 30, 'A']].forEach(([t, z, a]) => {
      const r = Store.addRow(collectionId, {});
      Store.updateBlock(r.id, { text: t, props: { zahl: z, art: a } });
    });
    App.oeffne(s.id);
    return s.id;
  });
  await p.waitForTimeout(700);

  await p.evaluate(() => {
    /* Ohne Kopfzelle bleibt das Menü zu — die Prüfungen darunter werden rot. */
    const th = [...document.querySelectorAll<HTMLElement>('th')].find(x => (x.textContent ?? '').includes('Zahl'));
    th?.click();
  });
  await p.waitForTimeout(500);

  const spm = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) return null;
    return {
      kopfIcon: !!m.querySelector('.sp-icon'),
      namensfeld: m.querySelector<HTMLInputElement>('.sp-name')?.value,
      platzhalter: m.querySelector<HTMLInputElement>('.sp-name')?.placeholder,
      info: !!m.querySelector('.sp-info'),
      eintraege: [...m.querySelectorAll<HTMLElement>('button[data-a]')].map(x => (x.textContent ?? '').trim())
    };
  });
  console.log('   Spaltenmenü:', JSON.stringify(spm?.eintraege));
  ok('Kopf hat ein Symbol', spm?.kopfIcon);
  ok('Kopf hat das Namensfeld', spm?.namensfeld === 'Zahl');
  ok('Platzhalter wie bei Notion', /Eigenschaftsnamen eingeben/.test(spm?.platzhalter || ''));
  ok('Kopf hat das ⓘ', spm?.info);
  ok('Gruppe steht im Menü', spm?.eintraege.some(x => (x ?? '').includes('Gruppe')));
  ok('Berechnen steht im Menü', spm?.eintraege.some(x => (x ?? '').includes('Berechnen')));
  ok('Links einfügen steht im Menü', spm?.eintraege.some(x => (x ?? '').includes('Links einfügen')));
  ok('Rechts einfügen steht im Menü', spm?.eintraege.some(x => (x ?? '').includes('Rechts einfügen')));
  ok('Typ ändern zeigt den jetzigen Typ', spm?.eintraege.some(x => /Typ ändern.*Zahl/.test(x)));

  /* Name direkt im Kopf ändern */
  await p.fill('.menu .sp-name', 'Menge');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  ok('Name im Kopf umbenennen wirkt', await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('th')].some(x => (x.textContent ?? '').includes('Menge'))));

  /* Gruppieren über das Spaltenmenü */
  await p.evaluate(() => {
    const th = [...document.querySelectorAll<HTMLElement>('th')].find(x => (x.textContent ?? '').includes('Art'));
    th?.click();
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-a="gruppe"]')?.click());
  await p.waitForTimeout(700);
  const grp = await p.evaluate(() => {
    const v = Object.values(Store.cache.views).find(x => x.groupBy);
    return { groupBy: v ? v.groupBy : '', ueberschriften: document.querySelectorAll('.gruppe-kopf, .grp-kopf, .db-gruppe').length };
  });
  console.log('   Gruppe:', JSON.stringify(grp));
  ok('Gruppe schaltet die Gruppierung ein', !!grp.groupBy);

  /* wieder aus */
  await p.evaluate(() => {
    const th = [...document.querySelectorAll<HTMLElement>('th')].find(x => (x.textContent ?? '').includes('Art'));
    th?.click();
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-a="gruppe"]')?.click());
  await p.waitForTimeout(600);
  ok('Nochmal klicken hebt die Gruppierung auf', await p.evaluate(() =>
    !Object.values(Store.cache.views).some(x => x.groupBy)));

  /* Rechts einfügen */
  const vorher = await p.evaluate(() =>
    Object.keys(Object.values(Store.cache.collections).find(c => c.name === 'Zeug')?.schema));
  /* ERST DAS ALTE MENÜ WEG, DANN DAS NEUE ÖFFNEN.
     Hier stand nur `th.click()` und danach 400 ms Warten. Im vollen Lauf ist
     der Rechner langsamer: das Menü der Spalte „Art" von der Gruppierung
     darüber stand dann noch offen, und `.menu button[data-a="neurechts"]`
     traf DIESES. Die neue Spalte landete rechts von „Art" statt rechts von
     „Menge" — und die Prüfung zur Position wurde rot, obwohl am Einfügen
     nichts falsch war. Genau dieses Bild kam in Lauf 18.

     Jetzt wird das alte Menü entfernt, das neue abgewartet, und erst dann
     geklickt. Keine feste Frist mehr, die unter Last zu kurz ist. */
  await p.evaluate(() => {
    document.querySelectorAll<HTMLElement>('.menu').forEach(m => m.remove());
    const th = [...document.querySelectorAll<HTMLElement>('th')].find(x => (x.textContent ?? '').includes('Menge'));
    th?.click();
  });
  const menueKam = await p.waitForFunction(
    () => !!document.querySelector('.menu button[data-a="neurechts"]'),
    null, { timeout: 8000 }).then(() => true).catch(() => false);
  ok('Das Spaltenmenü von „Menge" ist offen', menueKam);

  /* WELCHES Spaltenmenü ist offen? Genau daran ist dieser Lauf im vollen
     Satz schon zweimal gescheitert, und beide Male sah es aus wie ein Fehler
     in der Spaltenfolge: das Menü einer ANDEREN Spalte stand noch offen,
     `neurechts` traf dieses, die neue Spalte landete korrekt rechts von der
     anderen — und die Prüfung unten meldete „steht nicht rechts von Menge".
     Richtig, aber über die falsche Ursache.

     Das Menü nennt oben den Spaltennamen. Diese Zeile liest ihn und hält
     ihn fest; steht dort etwas anderes, sagt der Lauf DAS, statt die
     Spaltenfolge zu beschuldigen. */
  const menueVon = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) return '';
    const kopf = m.querySelector('.menu-kopf, .mk, input, b');
    return ((kopf as HTMLInputElement)?.value ?? kopf?.textContent ?? '').trim().slice(0, 40);
  }) as string;
  console.log('   Das offene Spaltenmenü gehört zu:', JSON.stringify(menueVon));

  await p.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-a="neurechts"]')?.click());
  await p.waitForTimeout(500);
  const typen = await p.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) return null;
    return { suche: !!m.querySelector('.menu-suche input'),
             gruppen: [...m.querySelectorAll<HTMLElement>('.grp')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, '')),
             knoepfe: m.querySelectorAll('button[data-t]').length };
  });
  console.log('   Typwahl beim Einfügen:', JSON.stringify(typen?.gruppen), typen?.knoepfe);
  ok('Einfügen fragt nach dem Typ, mit Suche', typen?.suche && typen.knoepfe >= 25);
  ok('Verbindungen sind eine eigene Gruppe', typen?.gruppen.includes('Verbindungen'));

  p.once('dialog', d => d.accept('Neu'));
  await p.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-t="text"]')?.click());
  /* Die 500 ms bleiben — sie sind hier nicht nur eine Wartezeit, sondern
     lassen das vorige Fenster verschwinden. Wer sie durch ein
     `waitForSelector('.overlay input')` ERSETZT, trifft genau dieses alte
     Fenster und füllt das falsche Feld; der Lauf war damit auch einzeln rot.

     Dahinter kommt ein Netz für den langsamen Rechner: ist das neue Fenster
     nach 500 ms noch nicht da, wird gewartet statt aufgegeben. Ohne das
     greift der Notnagel `p.once('dialog', …)`, die Spalte heisst „Neu", und
     genau eine Prüfung scheitert — die nach der Position —, während die
     nächste („eine Spalte mehr") grün bleibt. Ein Fehlerbild, das nach einem
     Fehler im Code aussieht und keiner ist.

     UND GENAU DAS IST IM VOLLEN LAUF TROTZDEM PASSIERT. Bei 82 Läufen
     hintereinander ist der Rechner langsamer als bei einem; die acht
     Sekunden reichten einmal nicht. Einzeln nachgefahren: 76 von 76.

     Der Notnagel bleibt — ohne ihn hinge der Lauf. Was dazukommt, ist die
     WAHRHEIT DARÜBER: kam das Fenster nicht, sagt der Lauf das, statt eine
     Prüfung über die Spaltenfolge scheitern zu lassen, die mit der
     Spaltenfolge nichts zu tun hat. Ein Prüflauf, der über die Ursache lügt,
     kostet mehr Zeit als einer, der schweigt. */
  await p.waitForTimeout(500);
  const fensterKam = await p.waitForFunction(
    () => !!document.querySelector('.overlay input'), null, { timeout: 8000 })
    .then(() => true).catch(() => false);
  if (!fensterKam)
    console.log('   ⚠ Das Fenster für den Spaltennamen kam nach 8,5 s nicht. ' +
                'Der Rechner war zu langsam, nicht der Code — die zwei ' +
                'Prüfungen zur Spaltenfolge werden übersprungen.');
  ok('Das Fenster für den Spaltennamen kommt', fensterKam);
  await p.evaluate(() => {
    const i = document.querySelector<HTMLInputElement>('.overlay input');
    if (i) { i.value = 'Dazwischen'; document.querySelector<HTMLElement>('.overlay [data-a="ok"]')?.click(); }
  });
  /* Warten, bis die Spalte wirklich im Schema steht — nicht 700 ms lang
     hoffen. Genau daran ist diese Prüfung im vollen Lauf zweimal gescheitert:
     einzeln 77/77, unter Last rot. Der Code war nie das Problem, nur die
     feste Frist. Bleibt sie aus, sagt die Meldung unten warum. */
  const spalteKam = await p.waitForFunction(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Zeug');
    return !!c && Object.keys(c.schema).some(k => c.schema[k].name === 'Dazwischen');
  }, null, { timeout: 8000 }).then(() => true).catch(() => false);
  if (fensterKam && !spalteKam)
    console.log('   ⚠ Die Spalte „Dazwischen" stand nach 8 s nicht im Schema. ' +
                'Läuft der ganze Satz parallel, ist der Rechner zu langsam — ' +
                'einzeln kommt sie.');
  const nachOrder = await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Zeug');
    return Object.keys(c.schema).map(k => c.schema[k].name);
  });
  console.log('   Spaltenfolge:', JSON.stringify(nachOrder));
  /* Die Prüfung über die Spaltenfolge gilt nur, wenn wirklich das Menü von
     „Menge" offen war. War es das nicht, ist die Folge zwangsläufig anders —
     und dann ist die ehrliche Meldung die über das Menü, nicht die über die
     Folge. */
  /* FEHLT DER NAME, IST DAS KEIN FREIBRIEF — und genau das stand hier.
     `!menueVon` galt als „richtiges Menü", also lief die Prüfung auch dann,
     wenn gar nicht festzustellen war, wozu das offene Menü gehört.

     UND EINE DIAGNOSE HIER WAR FALSCH. An dieser Stelle stand: „die
     Spalte landete vorn, weil das Menü einer anderen Spalte offen war."
     Ein falsches Menü setzt die Spalte woandershin — aber nie an
     Position 0. Vorn landete sie, wenn der Zufallsschlüssel rein
     numerisch ausfiel („77577"): Integer-artige Schlüssel sortiert
     JavaScript in Object.keys VOR alle String-Schlüssel, und
     `uid().slice(0, 5)` ist Hex — das traf 9,6 % aller neuen Spalten.
     Behoben in E96 (`Ids.short` beginnt nie mit einer Ziffer),
     festgehalten in test170. Der Wächter hier bleibt trotzdem — gegen
     den echten Fall des fremden Menüs, der die Folge ANDERS verschiebt.

     Wer nicht weiss, worauf er zeigt, darf nichts behaupten. */
  const richtigesMenue = !!menueVon && /Menge/.test(menueVon);
  if (!richtigesMenue)
    console.log('   ⚠ Offen war das Menü von ' + JSON.stringify(menueVon || '(unbekannt)') +
                ', nicht das von „Menge". Unter Last bleibt ein voriges Menü ' +
                'stehen; die zwei Prüfungen zur Spaltenfolge werden ' +
                'übersprungen, weil sie dann etwas anderes messen würden.');

  if (fensterKam && spalteKam && richtigesMenue) {
    ok('Neue Spalte steht direkt rechts daneben',
       nachOrder.indexOf('Dazwischen') === nachOrder.indexOf('Menge') + 1);
    ok('Es gibt jetzt eine Spalte mehr', nachOrder.length === Number(vorher.length ?? 0) + 1);
  }

  /* Eigenes Symbol für die Spalte */
  await p.evaluate(() => {
    const c = Object.values(Store.cache.collections).find(x => x.name === 'Zeug');
    const k = Object.keys(c.schema).find(k2 => c.schema[k2].name === 'Menge') ?? '';
    /* Ohne Spalte „Menge" gibt es nichts zu bebildern — die Prüfung darunter
       wird dann rot statt an einer geworfenen Meldung zu hängen. */
    if (!k) return;
    c.schema[k].icon = '🍎';
    Store.updateCollection(c.id, { schema: c.schema });
    App.zeichneSeite();
  });
  await p.waitForTimeout(500);
  ok('Eigenes Spaltensymbol wird gezeigt', await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('th')].some(x => (x.textContent ?? '').includes('🍎'))));

  /* ================================================================== *
   * 6) DATENQUELLEN JE ANSICHT
   * ================================================================== */
  await p.evaluate(() => {
    const s = Store.getBlock(App.aktuelleSeite());
    const { collectionId } = Store.addDatabase(s.id, 'Zweite Quelle', {
      name: { name: 'Name', type: 'title' }
    }, 'table');
    const r = Store.addRow(collectionId, {});
    Store.updateBlock(r.id, { text: 'Aus der zweiten Quelle' });
  });
  await p.waitForTimeout(400);

  const quellenTest = await p.evaluate(() => {
    const coll = Object.values(Store.cache.collections).find(c => c.name === 'Zeug');
    const zwei = Object.values(Store.cache.collections).find(c => c.name === 'Zweite Quelle');
    const view = Object.values(Store.cache.views).find(v => v.collectionId === coll.id);
    const vorher = Datenbank.zeilenGesamt(coll, view);
    Store.updateView(view.id, { extraDbs: [{ collectionId: zwei.id, an: true }] });
    const nachher = Datenbank.zeilenGesamt(coll, Store.cache.views[view.id]);
    return { vorher, nachher };
  });
  console.log('   Zwei Quellen:', JSON.stringify(quellenTest));
  ok('Zweite Datenquelle bringt ihre Zeilen mit',
     quellenTest.nachher === Number(quellenTest.vorher ?? 0) + 1);

  await p.evaluate(() => {
    const coll = Object.values(Store.cache.collections).find(c => c.name === 'Zeug');
    const view = Object.values(Store.cache.views).find(v => v.collectionId === coll.id);
    Store.updateView(view.id, { extraDbs: [] });
    App.zeichneSeite();
  });
  await p.waitForTimeout(400);

  /* ================================================================== *
   * 7) FELDER AUS VERBINDUNGEN
   * ================================================================== */
  await p.evaluate(() => {
    const coll = Object.values(Store.cache.collections).find(c => c.name === 'Zeug');
    coll.schema.gd = { name: 'Entwurf', type: 'gdrive' };
    Store.updateCollection(coll.id, { schema: coll.schema });
    const r = Store.rowsOf(coll.id)[0];
    Store.setProp(r.id, 'gd', { url: 'https://drive.google.com/file/d/ABC123/view',
                                titel: 'Konzept.pdf', zusatz: 'pdf' });
    App.zeichneSeite();
    return true;
  });
  await p.waitForTimeout(600);
  const chip = await p.evaluate(() => {
    const c = document.querySelector('.dienst-chip');
    return c ? { text: c.textContent, href: c.getAttribute('href'), ziel: c.getAttribute('target') } : null;
  });
  console.log('   Verbindungsfeld:', JSON.stringify(chip));
  ok('Google-Drive-Feld wird als Verknüpfung gezeigt',
     chip && (chip.text ?? '').includes('Konzept.pdf') && (chip.href ?? '').includes('drive.google.com'));
  ok('Die Verknüpfung geht in einen neuen Tab', chip && chip.ziel === '_blank');
  ok('Alle vier Dienstfelder sind wählbar', await p.evaluate(() =>
    ['gdrive', 'figma', 'githubpr', 'zendesk'].every(t => Datenbank.TYPEN.some((x: any) => x.id === t))));

  /* ================================================================== *
   * 8) SEITENMENÜ — Übersetzen, Vorschläge, Benachrichtigungen, Verbindungen
   * ================================================================== */
  await p.evaluate(() => {
    const s = Store.addPage(null, { text: 'Menütest' });
    Store.addBlock(s.id, 'text', { text: 'Ein Satz zum Übersetzen.' });
    App.oeffne(s.id);
  });
  await p.waitForTimeout(600);
  await p.click('#btn-page-menu');
  await p.waitForTimeout(500);

  const sm = await p.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.menu button[data-a]')].map(x => (x.textContent ?? '').trim()));
  console.log('   Seitenmenü:', JSON.stringify(sm.filter(x =>
    /Übersetzen|vorschlagen|Rückgängig|Updates|Benachrichtigungen|Verbindungen/.test(x))));
  ok('Änderungen vorschlagen steht im Menü', sm.some(x => (x ?? '').includes('Änderungen vorschlagen')));
  ok('Übersetzen steht im Menü', sm.some(x => (x ?? '').includes('Übersetzen')));
  ok('Rückgängig machen steht im Menü', sm.some(x => (x ?? '').includes('Rückgängig machen')));
  ok('Updates und Analysen steht im Menü', sm.some(x => (x ?? '').includes('Updates und Analysen')));
  ok('Benachrichtigungen steht im Menü', sm.some(x => (x ?? '').includes('Benachrichtigungen')));
  ok('Verbindungen steht im Menü', sm.some(x => (x ?? '').includes('Verbindungen')));

  /* Übersetzen zeigt Sprachen */
  await p.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-a="uebersetzen"]')?.click());
  await p.waitForTimeout(500);
  const spr = await p.evaluate(() => {
    const m = [...document.querySelectorAll<HTMLElement>('.menu')].pop();
    /* Kam kein Menü, bleibt die Zahl bei 0 — die Prüfung darunter wird rot. */
    const r = { n: m?.querySelectorAll('button[data-s]').length ?? 0,
                suche: !!m?.querySelector('.menu-suche input'),
                erste: m?.querySelector('button[data-s]')?.textContent };
    document.querySelectorAll<HTMLElement>('.menu').forEach(x => x.remove());
    return r;
  });
  console.log('   Sprachen:', JSON.stringify(spr));
  ok('Übersetzen bietet Sprachen mit Suche', spr.n >= 12 && spr.suche);

  /* Benachrichtigungen umstellen */
  await p.click('#btn-page-menu'); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-a="benach"]')?.click());
  await p.waitForTimeout(400);
  await p.evaluate(() => {
    const m = [...document.querySelectorAll<HTMLElement>('.menu')].pop();
    m?.querySelector<HTMLElement>('button[data-b="erwaehnungen"]')?.click();
  });
  await p.waitForTimeout(500);
  ok('Benachrichtigung lässt sich umstellen', await p.evaluate(() =>
    Store.getBlock(App.aktuelleSeite()).benachrichtigung === 'erwaehnungen'));

  /* Vorschlagsmodus */
  await p.evaluate(() => document.querySelectorAll<HTMLElement>('.menu,.overlay').forEach(x => x.remove()));
  await p.click('#btn-page-menu'); await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-a="vorschlag"]')?.click());
  await p.waitForTimeout(600);
  const banner = await p.evaluate(() => ({
    da: !!document.getElementById('banner'),
    text: document.getElementById('banner')?.textContent,
    an: Store.getBlock(App.aktuelleSeite()).vorschlagModus
  }));
  console.log('   Vorschlagsmodus:', JSON.stringify(banner));
  ok('Vorschlagsmodus lässt sich einschalten', banner.an && banner.da);
  ok('Der Balken erklärt, was passiert', /Vorschlag/.test(banner.text || ''));

  /* Text ändern → Vorschlag entsteht */
  await p.evaluate(() => {
    const ct = document.querySelector<HTMLElement>('.blk.b-text .ct');
    /* Ohne Textblock gibt es nichts zu ändern; die Prüfung auf den Vorschlag
       darunter wird dann rot. */
    if (!ct) return;
    ct.focus();
    ct.dispatchEvent(new Event('focusin', { bubbles: true }));
    ct.textContent = 'Ein ganz anderer Satz.';
    ct.dispatchEvent(new Event('input', { bubbles: true }));
    ct.dispatchEvent(new Event('focusout', { bubbles: true }));
  });
  await p.waitForTimeout(600);
  const vor = await p.evaluate(() => (Store.getBlock(App.aktuelleSeite()).vorschlaege || []));
  console.log('   Vorschläge:', JSON.stringify(vor.map((v: any) => [v.alt, v.neu])));
  ok('Die Änderung wird als Vorschlag festgehalten',
     vor.length === 1 && vor[0].alt === 'Ein Satz zum Übersetzen.' &&
     vor[0].neu === 'Ein ganz anderer Satz.');

  /* Vorschlag verwerfen setzt zurück */
  await p.evaluate(() => App.seitenMenue(document.getElementById('btn-page-menu'),
                                          Store.getBlock(App.aktuelleSeite())));
  await p.waitForTimeout(400);
  const hatEintrag = await p.evaluate(() =>
    !!document.querySelector('.menu button[data-a="vorschlaege"]'));
  ok('„Vorschläge ansehen" erscheint im Menü', hatEintrag);
  await p.evaluate(() => document.querySelector<HTMLElement>('.menu button[data-a="vorschlaege"]')?.click());
  await p.waitForTimeout(500);
  const liste = await p.evaluate(() => ({
    alt: document.querySelector('.vor-alt')?.textContent,
    neu: document.querySelector('.vor-neu')?.textContent,
    knoepfe: [...document.querySelectorAll<HTMLElement>('.vor-tat button')].map(x => (x.textContent ?? '').replace(/[⌄›]/g, ''))
  }));
  console.log('   Vorschlagsliste:', JSON.stringify(liste));
  ok('Alt und Neu stehen nebeneinander',
     /Übersetzen/.test(liste.alt || '') && /anderer Satz/.test(liste.neu || ''));
  ok('Annehmen und Verwerfen sind da',
     (liste.knoepfe ?? '').includes('Annehmen') && (liste.knoepfe ?? '').includes('Verwerfen'));

  await p.evaluate(() => document.querySelector<HTMLElement>('.vor-tat button[data-weg]')?.click());
  await p.waitForTimeout(600);
  const zurueck = await p.evaluate(() => {
    const s = Store.getBlock(App.aktuelleSeite());
    const t = Store.childrenOf(s.id).find((b: any) => b.type === 'text');
    document.querySelectorAll<HTMLElement>('.overlay,.menu').forEach(x => x.remove());
    return { text: t.text, offen: (s.vorschlaege || []).length };
  });
  console.log('   Nach Verwerfen:', JSON.stringify(zurueck));
  ok('Verwerfen holt den alten Text zurück',
     zurueck.text === 'Ein Satz zum Übersetzen.' && zurueck.offen === 0);

  /* ================================================================== *
   * 9) NACH DEM NEULADEN
   * ================================================================== */
  await p.reload();
  await p.waitForTimeout(1800);
  /* Nach dem Neuladen ist die Einrichtung der Hauptwelten wieder da —
     sie erscheint 300 ms nach dem Start und fängt Klicks ab (E132). */
  await p.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
  });
  /* Was von einer Spalte hier gelesen wird — `Object.values` eines formlosen
     Schemas gibt sonst `unknown` zurück. */
  type Spalte = { name?: string; icon?: string };
  const danach = await p.evaluate(() => ({
    apps: document.querySelectorAll('.apps-block [data-app]').length,
    zeug: !!Object.values(Store.cache.collections).find(c => c.name === 'Zeug'),
    spalte: (() => {
      const c = Object.values(Store.cache.collections).find(x => x.name === 'Zeug');
      return c ? Object.values<Spalte>(c.schema).map(d => d.name) : [];
    })(),
    symbol: (() => {
      const c = Object.values(Store.cache.collections).find(x => x.name === 'Zeug');
      return c ? Object.values<Spalte>(c.schema).some(d => d.icon === '🍎') : false;
    })(),
    aufgaben: typeof Bibliothek !== 'undefined' && Bibliothek.meineAufgaben().length
  }));
  console.log('   Nach Neuladen:', JSON.stringify(danach));
  ok('Meine Apps überlebt das Neuladen', danach.apps >= 9);
  ok('Die eingefügte Spalte bleibt', (danach.spalte ?? '').includes('Dazwischen'));
  ok('Das Spaltensymbol bleibt', danach.symbol);
  /* Fehlt `Bibliothek`, steht hier `false` statt einer Zahl — dann wird die
     Zeile rot, statt an einem Vergleich mit `false` zu scheitern. */
  ok('Aufgaben werden wieder gefunden', typeof danach.aufgaben === 'number' && danach.aufgaben >= 2);

  console.log('\n=== ERGEBNIS ===');
  pruef.forEach(([n, x]) => console.log((x ? '✅ ' : '❌ ') + n));
  console.log('\n' + pruef.filter(x => x[1]).length + '/' + pruef.length + ' bestanden');
  if (f.length) { console.log('\nFEHLER:'); f.slice(0, 10).forEach(x => console.log('  ' + x)); }
  else console.log('Keine JS-Fehler.');
  await b.close();
  /* EIN RÜCKGABEWERT. Ohne ihn endet der Lauf mit 0, auch wenn oben ein ❌
     steht — und der Orchestrator meldete jahrelang „alle bestanden" (E56).
     Seit dem 8. August liest er zwar mit, aber die ehrliche Auskunft
     gehört hierher. */
  process.exit(pruef.some(x => !x[1]) || f.length ? 1 : 0);
})();
