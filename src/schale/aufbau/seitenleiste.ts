/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/seitenleiste.ts (npm run bauen:ts). */
/* ============================================================================
 * schale/aufbau/seitenleiste.js — die linke Leiste, für sich allein
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/seitenleiste.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/aufbau/seitenleiste.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Sie lag bis hierher mitten in `schale.js`, zwischen Routing, Seitenmenü,
 * Suche und Start. Das ist die Datei, in der alles zusammenläuft — und genau
 * deshalb war sie der falsche Ort: wer an der Seitenleiste etwas ändern
 * wollte, musste 2600 Zeilen aufmachen und hoffen, die richtige Stelle zu
 * treffen.
 *
 * Hier steht jetzt alles, was die Leiste ausmacht, und sonst nichts:
 *
 *   ABSCHNITTE          welche es gibt, ein- und ausblendbar wie bei Notion
 *   die Reihenfolge     umsortierbar — Notion kann das nicht
 *   das Auf- und Zuklappen, je Abschnitt gemerkt
 *   die Reiter          Start · Chat · Besprechungen, am PC und am Telefon
 *   zeichne()           der Baum: Werkzeuge, Agenten, Kürzlich, Favoriten,
 *                       Bereiche, Privat, Meine Apps und was das Register
 *                       beisteuert
 *
 * WAS DARAN LEICHT SCHIEFGEHT
 *
 * 1. `ordne`, das `setTimeout(…, 0)` am Ende von `zeichne` und `abschnitt()`
 *    gehören zusammen. Die ersten beiden arbeiten auf dem **fertigen** DOM und
 *    lesen den Namen aus `span.firstChild.textContent` — also aus genau der
 *    Form, die `abschnitt()` erzeugt. Wer eines davon ändert, ändert alle
 *    drei, sonst bricht die Sortierung still.
 *
 * 2. Diese Datei ruft `App` nicht. Was sie von dort braucht, bekommt sie über
 *    `binde({ … })` gereicht — einmal in `App.start()`, vor dem ersten
 *    Zeichnen. Das ist kein Selbstzweck: solange die Leiste `App` kennt und
 *    `App` die Leiste, lässt sich keines von beiden allein prüfen.
 *
 * 3. `App.zeichneBaum` bleibt als Name bestehen — er steht an über fünfzig
 *    Stellen im Projekt. Er reicht nur noch hierher weiter, genau wie `UI` es
 *    für `Menue`, `Hinweis` und `Dialog` tut.
 * ==========================================================================*/

const Seitenleiste = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  /* Eigenes `esc` statt eingespeistem — so hält es auch `aufbau/reiter.js`.
     Drei Zeilen doppelt sind billiger als eine Abhängigkeit mehr. */
  const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ------------------------------------------------------------------------
   * WAS VON AUSSEN KOMMT
   * Sieben Dinge braucht die Leiste, die ihr nicht gehören: das Öffnen einer
   * Seite, die aktuelle Seite, die Listen „Kürzlich" und „Kommende Termine",
   * das Seitenmenü, die Suche und den Papierkorb. Sie kommen über `binde`.
   *
   * Fehlt eines, sagt der Fehler, was fehlt und wohin es gehört. Ein
   * `undefined is not a function` mitten im Zeichnen hätte niemandem gesagt,
   * dass jemand `binde` vergessen hat.
   * ----------------------------------------------------------------------*/
  let gebunden: Record<string, any> = {};

  const braucht = (name: string) => (...args: any[]) => {
    const fn = gebunden[name];
    if (typeof fn !== 'function') {
      throw new Error('Die Seitenleiste wurde ohne „' + name + '" gebunden. ' +
        'Seitenleiste.binde({ … }) gehört an den Anfang von App.start(), vor das erste Zeichnen.');
    }
    return fn(...args);
  };

  const binde = (teile: any) => { gebunden = Object.assign({}, gebunden, teile || {}); };

  const oeffne          = braucht('oeffne');
  const aktuelleSeite   = braucht('aktuelleSeite');
  const kuerzlich       = braucht('kuerzlich');
  const kommendeTermine = braucht('kommendeTermine');
  const seitenMenue     = braucht('seitenMenue');
  const suche           = braucht('suche');
  /* `papierkorb` stand hier, solange die Apps-Kette ihn selbst aufrief. Der
     Registereintrag ruft jetzt `App.papierkorb()`; die durchgereichte
     Fassung wäre eine zweite Adresse für dieselbe Handlung (E166).
     `binde` nimmt den Schlüssel weiterhin entgegen — er schadet nicht, und
     ein Bereich, der ihn morgen wieder braucht, holt ihn mit `braucht`. */

  /* ========================================================================
   * SEITENLEISTE
   * ======================================================================*/
  /* --------------------------------------------------------------------- *
   * ABSCHNITTE DER SEITENLEISTE
   * Notion lässt jeden Abschnitt einzeln ausblenden („Abschnitte anpassen").
   * Hier steht, welche es gibt; was aus ist, merkt sich der Speicher.
   * --------------------------------------------------------------------- */
  const ABSCHNITTE = [
    ['werkzeuge', 'Werkzeuge'],
    ['agenten',   'Agenten'],
    ['bespr',     'Besprechungen'],
    ['kuerzlich', 'Kürzlich verwendet'],
    ['favoriten', 'Favoriten'],
    ['bereiche',  'Bereiche'],
    ['privat',    'Privat'],
    ['apps',      'Meine Apps']
  ];

  /**
   * Die Schubladen in „Meine Apps" (E206).
   *
   * Kennung, Name, Zeichen. Die Reihenfolge hier ist die Reihenfolge auf dem
   * Bildschirm; die Reihenfolge INNERHALB einer Schublade steht als `rang`
   * am Registereintrag.
   *
   * Wer eine fünfte Gruppe braucht, trägt sie hier ein und setzt `gruppe`
   * am Eintrag. Wer nur einen Eintrag anmeldet und keine Gruppe nennt,
   * bekommt „Sonstiges" — die Zeile geht nicht verloren, und niemand muss
   * zwei Stellen pflegen.
   */
  const APP_GRUPPEN: Array<[string, string, string]> = [
    ['planen',     'Planen',         'calendar'],
    ['daten',      'Daten',          'database'],
    ['einrichten', 'Einrichten',     'settings'],
    ['hilfe',      'Hilfe & Pflege', 'help']
  ];

  /**
   * Ist dieser Abschnitt eingeschaltet?
   *
   * `vorgabe` ist neu (E210). Bisher war alles an, was nicht ausdrücklich in
   * `sidebarAus` stand — und für die Werkzeuge soll es umgekehrt sein: sie
   * stehen jetzt im Menüband, hier also aus, bis jemand sie zurückholt.
   *
   * Wichtig ist der Unterschied zwischen „nie etwas gesagt" und „ausdrücklich
   * abgeschaltet". `sidebarAn` merkt sich das Einschalten; wer den Abschnitt
   * früher abgeschaltet hatte, findet ihn nicht plötzlich wieder da.
   */
  /* Welche Abschnitte sind von Haus aus an? Alle ausser diesem einen — die
     Werkzeuge stehen seit E210 im Menüband. Wächst die Liste, wächst sie
     hier und nicht verstreut an drei Stellen. */
  /* E211: drei weitere. Bei „agenten" und „bespr" war der Abschnitt im Baum
     ohnehin eine Doppelung — die Seitenleiste hat oben schon Reiter dafür.
     „kuerzlich" führt jetzt über das Menüband in die Bibliothek, wo es
     Vorschauen statt einer Namensliste gibt. */
  const VORGABE_AUS = ['werkzeuge', 'agenten', 'bespr', 'kuerzlich'];
  const VORGABE_AN = (id: string) => !VORGABE_AUS.includes(id);

  const abschnittAn = (id: string, vorgabe = true) => {
    const aus = Store.getMeta('sidebarAus', []) || [];
    if (aus.includes(id)) return false;
    if (vorgabe) return true;
    return (Store.getMeta('sidebarAn', []) || []).includes(id);
  };

  /** Die Abschnitte in der selbst gewählten Reihenfolge. Notion lässt sie
      nur ein- und ausblenden, nicht umsortieren. */
  const abschnitteGeordnet = () => {
    const folge = Store.getMeta('sidebarFolge', null);
    if (!Array.isArray(folge) || !folge.length) return ABSCHNITTE;
    const nach: any[] = [];
    folge.forEach(id => { const a = ABSCHNITTE.find(x => x[0] === id); if (a) nach.push(a); });
    ABSCHNITTE.forEach(a => { if (!nach.includes(a)) nach.push(a); });
    return nach;
  };

  const abschnittSchieben = (id: string, richtung: any) => {
    const folge = abschnitteGeordnet().map(x => x[0]);
    const i = folge.indexOf(id);
    const j = i + richtung;
    if (i < 0 || j < 0 || j >= folge.length) return;
    [folge[i], folge[j]] = [folge[j], folge[i]];
    Store.setMeta('sidebarFolge', folge);
    zeichneBaum();
  };

  /**
   * Einen Abschnitt ein- oder ausschalten.
   *
   * Seit E210 gibt es zwei Listen und nicht mehr eine. `sidebarAus` sagt
   * „ausdrücklich weg", `sidebarAn` sagt „ausdrücklich her" — die zweite
   * braucht es für Abschnitte, deren VORGABE aus ist. „Werkzeuge" ist der
   * erste davon: die sieben Zeilen stehen jetzt im Menüband.
   *
   * Ohne die zweite Liste wäre „Werkzeuge einblenden" ein Knopf, der aus
   * `sidebarAus` etwas entfernt, das gar nicht drinsteht — er hätte
   * ausgesehen, als täte er etwas, und nichts wäre passiert.
   */
  const abschnittSchalten = (id: string) => {
    const aus: string[] = Store.getMeta('sidebarAus', []) || [];
    const an: string[] = Store.getMeta('sidebarAn', []) || [];
    if (abschnittAn(id, VORGABE_AN(id))) {
      /* jetzt an → ausschalten */
      Store.setMeta('sidebarAn', an.filter(x => x !== id));
      if (!aus.includes(id)) Store.setMeta('sidebarAus', [...aus, id]);
    } else {
      /* jetzt aus → einschalten */
      Store.setMeta('sidebarAus', aus.filter(x => x !== id));
      if (!an.includes(id)) Store.setMeta('sidebarAn', [...an, id]);
    }
    zeichneBaum();
  };

  let anpassModus = false;

  const abschnitteAnpassen = () => {
    anpassModus = !anpassModus;
    zeichneBaum();
  };

  const tabNamen = () => Store.getMeta('tabNamen', true) !== false;

  const zeichneReiter = () => {
    const leiste = document.getElementById('side-reiter');
    if (!leiste) return;
    leiste.classList.toggle('ohne-namen', !tabNamen());
    /* WELCHER REITER LEUCHTET, HÄNGT AM BAUM DARUNTER — nicht daran, wo
       man gerade ist. Die drei Reiter der Seitenleiste sind kein Ortsschild,
       sondern ein Umschalter: `zeichneBaum()` zeigt für `chat` die Agenten,
       für `bespr` die Besprechungen und SONST den Seitenbaum.
       `reiter` trägt aber auch die Werte der Wegeleiste am Telefon —
       `dokumente`, `lernen`, `mehr`. Stand einer davon, leuchtete hier gar
       nichts, während der Seitenbaum darunter stand: drei Reiter, keiner
       an, und der mittlere Kasten zeigt trotzdem den Baum des ersten.
       Seit E236 fällt das jedem sofort auf, weil Redion mit dem Regal
       ÖFFNET und `dokumente` damit der erste Wert überhaupt ist.
       Das ist NICHT der Rückfall auf „Start", den `handyLeiste()` weiter
       unten ausdrücklich nicht macht. Dort lautet die Frage „wo bin ich?",
       und darauf ist „Start" eine falsche Antwort. Hier lautet sie „welcher
       Baum steht da?", und darauf ist „der Seitenbaum" die richtige. */
    const baumReiter = (reiter === 'chat' || reiter === 'bespr') ? reiter : 'start';
    leiste.querySelectorAll<HTMLElement>('.sr').forEach(b => {
      const hier = b.dataset.reiter === baumReiter;
      b.classList.toggle('on', hier);
      /* Die Klasse `on` färbt den Reiter. Ein Vorleseprogramm sieht keine
         Farbe — für es ist `aria-current` der einzige Unterschied zwischen
         „Start" und „Start, aktuelle Seite". Ohne die Zeile klingen alle
         fünf Reiter gleich. */
      if (hier) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    /* Die untere Leiste am Telefon zeigt dieselben Bereiche — sie muss
       mitgehen, sonst stimmt an einem der beiden Orte die Markierung nicht. */
    if (typeof handyLeiste === 'function') handyLeiste();
  };

  let reiter = 'start';

  /* Beim allerersten Setzen darf die Pille nicht gleiten. Sonst schiebt
     sie sich beim Öffnen der App von der linken Kante herein — eine
     Bewegung ohne Anlass, und die liest sich als Fehler. */
  let pilleGesetzt = false;

  /**
   * DIE GLEITENDE PILLE UNTER DEN REITERN.
   *
   * Sie ist der Hintergrund der aktiven Pille, aber als eigenes Feld: statt
   * an einer Stelle zu verschwinden und an der nächsten aufzutauchen,
   * wandert sie hinüber. Das Auge folgt der Bewegung und ist beim Ankommen
   * schon dort — ein Sprung dagegen muss erst wieder gesucht werden.
   *
   * ZWEI DINGE, DIE HIER LEICHT SCHIEFGEHEN:
   *
   *   1. GEMESSEN WIRD NACH DEM SETZEN VON `.an`. Die aktive Pille zeigt
   *      als einzige ihre Beschriftung und ist deshalb breiter als vorher.
   *      Wer vorher misst, bekommt die alte Breite und die Pille endet
   *      einen Zentimeter zu kurz.
   *
   *   2. DIE LEISTE ROLLT SEITWÄRTS. `offsetLeft` zählt vom Anfang des
   *      Inhalts, nicht vom Bildrand — und genau das wird gebraucht: die
   *      Pille liegt IN der rollenden Leiste und rollt mit. Wer hier
   *      `getBoundingClientRect()` nähme, hätte die Pille an der richtigen
   *      Stelle des Bildschirms und an der falschen des Inhalts.
   */
  /* HIER STANDEN ZWEI UHREN (E646). `fahrtUhr` nahm die Dehnung nach 190 ms
     zurück, `glasUhr` die Brechung nach 430 ms — zwei Zahlen, die raten
     mussten, wann die Bewegung vorbei ist. Jetzt weiss die Bewegung es
     selbst: `SelectionFlow` hält seinen Lauf, und `.faehrt` fällt, wenn die
     Feder ausgelaufen ist. Eine Uhr, die neben einer Animation herläuft, ist
     immer eine Vermutung über deren Ende. */

  const pilleSchieben = (l: HTMLElement, aktiv: HTMLElement | null) => {
    const pille = l.querySelector<HTMLElement>('#ho-pille');
    if (!pille) return;

    /* DAS GLAS BRAUCHT SEINEN FILTER. Er hängt einmal am Ende von `<body>`
       (`linse.ts`, nach dem Muster der Textur aus E462). Ohne ihn bleibt
       die Fläche stehen, wie sie vorher war — die Regel im Stilblatt ist
       so gebaut, dass nur die Brechung wegfällt, nicht die Hervorhebung. */
    if (typeof Linse !== 'undefined') Linse.sicherstellen();

    /* DIE PILLE LÄSST SICH GREIFEN (E706, Redur 27.09. ca. 21:47: „ich will das
       du auch das ¨berla nutze will wo es nötig ich also beim stift übergangen
       usw") — das Material der Tab-Leiste des Kits, in `SelectionFlow.ziehbar`.
       Losgelassen auf einem anderen Weg wird DESSEN Knopf geklickt, genau
       einmal — derselbe Weg wie beim Tippen. Rollen und `aria-selected` bleiben. */
    if (typeof SelectionFlow !== 'undefined' && !l.dataset['ziehbar']) {
      SelectionFlow.ziehbar({
        reihe: l, flaeche: pille, hub: 1.1,
        optionen: () => Array.from(l.querySelectorAll<HTMLElement>(':scope > button[role="tab"]')),
        gewaehlt: () => l.querySelector<HTMLElement>(':scope > button[aria-selected="true"]'),
        zeichen: k => k.querySelector<HTMLElement>('.ho-z'),
        waehle: k => k.click(),
        zurueck: (k, f) => {
          if (k) SelectionFlow.folge(f, k.offsetLeft, true, false);
          else handyLeiste();
        },
        /* HINAUF GEHT ES ZUR ZIELLEISTE (E749, Redur 13.10., 01:08 UTC: „die
           neu dock nur wenn ich mit hand nach oven so zi eht kommt das doet
           aber beim klicken nicht"). EINE Gestenmaschine: `ziehbar` übergibt,
           sobald der Finger über die Oberkante steigt. Ohne das Modul fehlt
           die Angabe, und alles bleibt, wie es war. */
        ...(typeof TabShelf !== 'undefined'
          ? { hinauf: { nimm: (k: HTMLElement, wie: 'hoch' | 'aus-zug', x: number, y: number) => TabShelf.nimm(k, wie, x, y) } }
          : {})
      });
    }

    /* „Mehr" und „Kompass" haben oben keinen Reiter (E42). Dann gehört
       auch keine Pille irgendwohin — sie bleibt, wo sie war, und
       verschwindet. Sie an den Anfang zu schieben wäre eine Aussage, und
       zwar eine falsche. */
    if (!aktiv) { pille.style.opacity = '0'; return; }

    const x = aktiv.offsetLeft;
    const b = aktiv.offsetWidth;
    const y = aktiv.offsetTop;
    if (!b) return;                      /* Leiste unsichtbar — am Rechner */

    if (!pilleGesetzt) pille.classList.add('stumm');

    /* ══════════════════════════════════════════════════════════════════════
     * DIE FLÄCHE WANDERT — UND ZWAR AUCH DANN, WENN DER HAUPTFADEN ARBEITET
     * (E646, aus Redurs Aufnahme vom 20. September, 10:12 Uhr)
     * ----------------------------------------------------------------------
     * Hier stand eine Rechnung, die `--dehnung` setzte und die Bewegung dem
     * Stilblatt überliess (`transition: transform, width`). Am Rechner sah
     * das richtig aus — 16 bis 21 Zwischenorte je Wechsel. Auf dem Telefon
     * kam davon NICHTS an: Redurs Aufnahme zeigt viermal einen einzigen
     * Bildsprung über 190 bis 210 Pixel.
     *
     * Der Grund ist nicht die Kurve, sondern der Faden. Ein Wechsel auf
     * „Heute" oder „Lernen" baut einen ganzen Bildschirm neu auf; eine
     * CSS-Transition, die `width` mitanimiert, läuft dabei auf demselben
     * Faden und kommt nicht voran. Gemessen mit gedrosselter Rechenleistung:
     *
     *     Drossel 1×   16 Orte      Drossel 4×   7 Orte      Drossel 8×   5 Orte
     *
     * Die Bewegung gehört deshalb auf den Compositor, und dorthin kommt sie
     * nur über `transform` allein. `SelectionFlow` rechnet die Federbahn
     * einmal aus und übergibt sie als Keyframes; die Breite wird gesetzt,
     * nicht bewegt. Dass sie dabei gleich bleiben DARF, ist kein Zufall:
     * `flex:1 1 0` gibt allen fünf Wegen dieselbe Breite (gemessen 70 px bei
     * 390 px Fensterbreite). `test541` misst das nach, damit aus der
     * Voraussetzung keine stille Annahme wird.
     * ══════════════════════════════════════════════════════════════════════ */
    const vorher = Number(pille.dataset['x'] ?? NaN);
    const wegJetzt = Number.isFinite(vorher) ? Math.abs(x - vorher) : 0;
    pille.dataset['x'] = String(x);

    /* NUR ZWISCHEN NACHBARN WIRD GEDEHNT (E641, Redurs Entscheidung).
       `recipes/shape-stretch-compress.md`: „Disable deformation for
       long-distance navigation." Gemessen wird in Reiterbreiten, damit die
       Regel auch bei anderen Massen gilt. */
    const nachbar = wegJetzt > 1 && wegJetzt / Math.max(1, b) <= 1.35;

    pille.style.width = b + 'px';
    pille.style.top = y + 'px';
    pille.style.opacity = '1';

    /* OHNE DAS MODUL BLEIBT DIE ALTE ANTWORT STEHEN. Ein Browser, der die
       Datei nicht geladen hat, bekommt die Fläche gesetzt statt bewegt —
       das ist weniger schön und keineswegs kaputt (§38: der aktive Reiter
       bleibt markiert). */
    if (typeof SelectionFlow === 'undefined') {
      pille.style.transform = `translateX(${x}px)`;
    } else {
      SelectionFlow.folge(pille, x, nachbar, !pilleGesetzt || pille.classList.contains('stumm'));
    }

    if (!pilleGesetzt) {
      /* Die Sperre erst im nächsten Bild lösen, sonst gilt sie für die
         eben gesetzten Werte schon nicht mehr. */
      pilleGesetzt = true;
      requestAnimationFrame(() => requestAnimationFrame(() =>
        pille.classList.remove('stumm')));
    }

    /* Steht der neue Reiter halb ausserhalb, ihn hereinholen. Bei 390 px
       passen die fünf Wege nicht alle ins Bild; ohne das tippt man auf
       „Mehr" und sieht danach nicht, dass man dort ist. */
    const links = x - l.scrollLeft;
    if (links < 0 || links + b > l.clientWidth) {
      const ruhig = AppEinstellung.wenigBewegung();       /* System oder „Ruhig" (E702) */
      l.scrollTo({ left: Math.max(0, x - 16), behavior: ruhig ? 'auto' : 'smooth' });
    }
  };

  /**
   * Die untere Leiste am Telefon markieren und den Punkt am Posteingang
   * setzen. Wird bei jedem Wechsel und nach jedem Zeichnen aufgerufen —
   * eine Leiste, die nicht zeigt, wo man ist, ist nur eine Knopfreihe.
   */
  /* ==========================================================================
   * WO MAN IST — ÜBER DAS EREIGNIS, NICHT ÜBER `App` (E274)
   * --------------------------------------------------------------------------
   * `test87 §3` führt diese Datei namentlich: die Zeichner rufen `App` nicht,
   * sie bekommen ihre Griffe über `binde({…})`. Für den Schauplatz braucht es
   * aber gar keinen Griff — die Schale ruft ihn seit E272 Phase E aus:
   * `redion:schauplatz` trägt den Bezeichner im `detail`. Genau so hört auch
   * die Kontextkante zu.
   * ========================================================================*/
  let schauplatzJetzt = 'leer';
  try {
    addEventListener('redion:schauplatz', (e: any) => {
      schauplatzJetzt = String(e?.detail || 'leer');
      handyLeiste();
    });
  } catch { /* ohne Ereignisse bleibt der Rest */ }

  /* Schauplatz → Knopf unten. Was hier fehlt, hat unten KEINEN Knopf. */
  const ORT_ZU_KNOPF: Record<string, string> = {
    heute: 'hl-start', lernen: 'hl-lernen',
    bibliothek: 'hl-dok', notizhefte: 'hl-dok',
    kalender: 'hl-bespr', mehr: 'hl-mehr'
  };

  /* Orte, die es WIRKLICH gibt und die unten trotzdem keinen Knopf haben.
     Sie stehen ausdrücklich da, statt „alles andere" zu heissen: `seite`
     und `leer` sind auch nicht in `ORT_ZU_KNOPF`, sollen aber weiter dem
     Reiter folgen — wer ein Dokument öffnet, kam aus „Dokumente", und die
     Pille soll dort stehenbleiben. */
  const ORTE_OHNE_KNOPF = ['posteingang', 'kompass', 'workspace',
                           'aufgaben', 'papierkorb', 'elektro'];

  /* ══ EIN ZIEL DARF VORAUSGESCHICKT WERDEN (E648) ═══════════════════════
   * `vorauf` ist die Kennung des Knopfes, auf den gleich gewechselt wird —
   * bevor der Bildschirm dahinter steht.
   *
   * WARUM ES DAS BRAUCHT. `dockWechsel` in `schale.ts` (Redurs #109) will
   * genau das: erst die Fläche losschicken, dann den Bildschirm bauen. Nur
   * ging der Griff ins Leere. Seit E274 sticht der SCHAUPLATZ den Reiter,
   * und der Schauplatz ändert sich erst, wenn die neue Ansicht wirklich
   * aufgebaut ist. Ein `handyLeiste()` davor liest also noch den alten Ort
   * und lässt die Fläche stehen, wo sie steht.
   *
   * GEMESSEN, nicht vermutet: `test541` §3 las nach 60 ms „17 → 17" — die
   * Fläche war nach einem Sechzehntel der Federdauer noch keinen Pixel
   * gewandert.
   *
   * E274 wird damit nicht zurückgenommen. Der Schauplatz bleibt die
   * Wahrheit; `vorauf` ist eine ANSAGE für ein einziges Bild, und der
   * nächste Ruf (aus `redion:schauplatz`) setzt sie gerade, falls die
   * Ansage nicht eingetreten ist. */
  const handyLeiste = (vorauf?: string) => {
    const l = document.getElementById('handy-oben');
    if (!l) return;
    /* `chat` hat oben keinen Reiter mehr (E38) — die Zeile bleibt trotzdem
       stehen, damit die Seitenleiste am Rechner weiterhin ihren Chat-Reiter
       kennt; sie findet dann eben keinen Knopf zum Hervorheben. */
    /* SEIT E236 STEHT SIE UNTEN UND HAT FÜNF WEGE.
       „Seiten"/„Workspace" hat dort keinen Knopf mehr — der Weg steht im
       Mehr-Blatt. Er FEHLT hier deshalb absichtlich: der Absatz weiter
       unten erklärt, warum kein Rückfall auf „Start" stattfindet, und
       genau das gilt hier auch. Wer im Workspace ist, soll unten nirgends
       markiert sein statt an der falschen Stelle. */
    const karte: Record<string, string> = {
      dokumente: 'hl-dok', bibliothek: 'hl-dok',
      start: 'hl-start', lernen: 'hl-lernen',
      bespr: 'hl-bespr', mehr: 'hl-mehr'
    };
    l.querySelectorAll('button[role="tab"]').forEach(b => {
      b.classList.remove('an');
      /* `aria-selected` gehört zu `role="tab"` wie das Ziel zum Verweis.
         Ohne die Angabe meldet ein Vorleseprogramm vier gleichrangige
         Reiter und verschweigt, auf welchem man steht — die Auskunft
         steckte einzig in der Farbe der Pille (CLAUDE.md §38: keine
         Information nur über Farbe). */
      b.setAttribute('aria-selected', 'false');
    });
    /* KEIN RÜCKFALL AUF „START". Hier stand `karte[reiter] || 'hl-start'`,
       und das war eine Behauptung: „Mehr" und „Kompass" haben oben keinen
       Reiter, also leuchtete beim Öffnen die Start-Pille — man stand im
       Kompass, und oben stand „Start". Wer nirgends in der Reiterleiste
       ist, soll dort auch nirgends markiert sein. */
    /* DER SCHAUPLATZ STICHT DEN REITER (E274).
       Gemessen war: „Mehr → Posteingang" liess unten „Heute" leuchten, und
       der Kompass ebenso. Der Grund stand zwei Funktionen weiter unten —
       `reiterWechseln('inbox')` setzt `reiter` danach auf `'start'` zurück,
       und die Leiste las nur den Reiter.

       Der Absatz darüber wollte schon damals das Richtige („wer nirgends in
       der Reiterleiste ist, soll dort auch nirgends markiert sein"); es gab
       nur nichts, woran man das hätte erkennen können. Seit E273 gibt es
       das: `App.schauplatz()` sagt seit den sechs umgestellten Bildschirmen
       auf JEDEM Bildschirm die Wahrheit. */
    const id = vorauf
      ?? ORT_ZU_KNOPF[schauplatzJetzt]
      ?? (ORTE_OHNE_KNOPF.includes(schauplatzJetzt) ? undefined : karte[reiter]);
    const aktiv = id ? document.getElementById(id) : null;
    if (aktiv) { aktiv.classList.add('an'); aktiv.setAttribute('aria-selected', 'true'); }
    pilleSchieben(l, aktiv);

    /* EIN PUNKT, WENN IM POSTEINGANG ETWAS UNGELESENES LIEGT — und ein
       Satz dazu. Der Punkt ist rot, klein und leer: für ein
       Vorleseprogramm ist er nichts. Wer die App hört statt sie zu sehen,
       erfuhr nie, dass etwas anliegt.

       Der Punkt wird deshalb versteckt (er ist Bild, kein Inhalt) und die
       Zahl wandert in den Namen des Knopfes: „Mehr, 3 ungelesen". Der
       Titel bleibt der schlichte, damit die Maus-Blase kurz bleibt.

       DER ZWEITE PUNKT IST GEGANGEN. „Seiten" trug auch einen — ein Rest
       aus der Zeit, als der Reiter „Chats" hiess (E38). Angezeigt wurde er
       nie, weil nur der erste gefundene Punkt gesetzt wurde; er hätte
       ungelesene Nachrichten an einem Ort gemeldet, an dem keine liegen.
       Der Posteingang steht seit E42 unter „Mehr", und dort steht auch
       der Punkt. */
    l.querySelectorAll<HTMLElement>('.hl-punkt').forEach(pt => {
      pt.setAttribute('aria-hidden', 'true');
      const knopf = pt.closest<HTMLElement>('button');
      let offen = 0;
      try { offen = (Werkzeuge.meldungen ? Werkzeuge.meldungen() : [])
                      .filter((m: any) => !m.gelesen).length; } catch {}
      pt.hidden = !offen;
      if (!knopf) return;
      const name = knopf.getAttribute('title') || '';
      if (offen) knopf.setAttribute('aria-label', `${name}, ${offen} ungelesen`);
      else knopf.removeAttribute('aria-label');
    });
  };

  const reiterWechseln = (id: string) => {
    reiter = id;
    zeichneReiter();
    if (id === 'suche') { suche(); reiter = 'start'; zeichneReiter(); return; }
    if (id === 'inbox') { Ansichten.posteingang(); reiter = 'start'; zeichneReiter(); zeichneBaum(); return; }
    zeichneBaum();
  };

  const zeichneBaum = (): void => {
    const baum = document.getElementById('tree');
    /* Ohne den Baumkasten gibt es nichts zu zeichnen. Vorher stand hier
       ungeprüft `baum.innerHTML = ''` — beim Zeichnen vor dem Aufbau der
       Schale warf das und die ganze Seitenleiste blieb leer. */
    if (!baum) return;
    const altAufraeumen = (baum as any).__seitenFensterAufraeumen;
    if (typeof altAufraeumen === 'function') altAufraeumen();
    baum.innerHTML = '';
    zeichneReiter();

    /* Der Chat-Reiter ersetzt den Baum durch Agenten und Verlauf */
    if (reiter === 'chat')  { KI.seitenleiste(baum); return; }
    if (reiter === 'bespr') { Meeting.seitenleiste(baum); return; }

    /* Anpassmodus: jeder Abschnitt bekommt ein Auge */
    if (anpassModus) {
      const kopf = document.createElement('div');
      kopf.className = 'side-section';
      kopf.innerHTML = '<span>Abschnitte anpassen</span>';
      baum.appendChild(kopf);
      const geordnet = abschnitteGeordnet();
      geordnet.forEach(([id, name], nr) => {
        const z = document.createElement('button');
        z.className = 'side-item anpass' + (abschnittAn(id) ? '' : ' aus');
        z.innerHTML = `<span>${abschnittAn(id) ? '👁' : '🚫'}</span><span>${name}</span>` +
          '<span class="anpass-pfeile">' +
            (nr > 0 ? '<i data-hoch="1" title="nach oben">⌃</i>' : '') +
            (nr < geordnet.length - 1 ? '<i data-runter="1" title="nach unten">⌄</i>' : '') +
          '</span>';
        z.addEventListener('click', (ev) => {
          const ziel = elVon(ev);
          if (ziel?.closest('[data-hoch]'))   { ev.stopPropagation(); abschnittSchieben(id, -1); return; }
          if (ziel?.closest('[data-runter]')) { ev.stopPropagation(); abschnittSchieben(id, 1); return; }
          abschnittSchalten(id);
        });
        baum.appendChild(z);
      });
      const zurueck = document.createElement('button');
      zurueck.className = 'side-item anpass';
      zurueck.innerHTML = '<span>↺</span><span>Reihenfolge zurücksetzen</span>';
      zurueck.addEventListener('click', () => {
        Store.setMeta('sidebarFolge', null);
        zeichneBaum();
        UI.toast('Reihenfolge zurückgesetzt');
      });
      baum.appendChild(zurueck);
      const nam = document.createElement('button');
      nam.className = 'side-item anpass';
      nam.innerHTML = `<span>🏷</span><span>Tab-Namen ${tabNamen() ? 'ausblenden' : 'einblenden'}</span>`;
      nam.addEventListener('click', () => {
        Store.setMeta('tabNamen', !tabNamen());
        zeichneBaum();
      });
      baum.appendChild(nam);

      const fertig = document.createElement('button');
      fertig.className = 'anpass-fertig';
      fertig.textContent = 'Erledigt';
      fertig.addEventListener('click', () => { anpassModus = false; zeichneBaum(); });
      baum.appendChild(fertig);
      return;
    }

    /* DIE WERKZEUGE SIND NACH OBEN GEZOGEN (E210).

       Sieben Zeilen standen hier — Journal, Schnellnotizen, Vorlagen, Graph,
       Schlagwörter, Karteikarten, Umsetzungsstand. Redur wollte die
       Seitenleiste kürzer und die Werkzeuge im Menüband; sie stehen jetzt
       dort unter „Werkzeuge", mit denselben Handlungen.

       NICHTS IST WEG. Die Liste ist nicht gelöscht, sondern umgezogen: sie
       steht in `register/menueband.ts` und ist von dort aus dieselbe Wahrheit
       für beide Ansichten. Wer den Abschnitt lieber hier hätte, schaltet ihn
       über `sidebarAus` wieder ein — dann zeichnet die Seitenleiste ihn aus
       demselben Register, und die zwei Wege können nicht auseinanderlaufen.

       Die Vorgabe ist AUS, und zwar nur die Vorgabe: wer den Abschnitt
       früher ausdrücklich abgeschaltet hatte, behält seine Wahl. */
    if (abschnittAn('werkzeuge', VORGABE_AN('werkzeuge'))) {
    const wz = document.createElement('div');
    wz.className = 'wz-block';
    /* Eine eigene Kennung. `wz-block` ist eine LAYOUT-Klasse und wird von
       fünf weiteren Stellen benutzt (Erweiterungen, Besprechung, KI …) — wer
       danach sucht, findet die halbe Seitenleiste. Die Prüfung ist genau
       darauf hereingefallen und meldete 36 Werkzeuge statt sieben. */
    wz.dataset['abschnitt'] = 'werkzeuge';
    const eintraege = (Register?.menueband?.inReiter?.('werkzeuge') || [])
      .flatMap((g: any) => g.eintraege || []);
    eintraege.forEach((e: any) => {
      const b = document.createElement('button');
      b.className = 'side-item';
      b.dataset['band'] = String(e.id);
      b.title = String(e.hinweis || e.name || '') + (e.kurz ? '  (' + e.kurz + ')' : '');
      const zeichen = document.createElement('span');
      zeichen.dataset['sym'] = String(e.zeichen || 'dots');
      const name = document.createElement('span');
      name.textContent = String(e.name || '');
      b.append(zeichen, name);
      if (e.id === 'w-lernen') { const k = document.createElement('span');
        k.className = 'k'; k.id = 'lz'; b.appendChild(k); }
      wz.appendChild(b);
    });
    wz.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('[data-band]');
      if (!b) return;
      const eintrag = Register?.menueband?.eines?.(b.dataset['band'] || '');
      if (eintrag) eintrag.tun();
    });
    baum.appendChild(abschnitt('Werkzeuge'));
    baum.appendChild(wz);

    const faellig = Werkzeuge.faellig().length;
    const lz = wz.querySelector('#lz');
    if (lz && faellig) lz.textContent = String(faellig);
    }

    /* Agenten — wie in Notions Seitenleiste */
    if (abschnittAn('agenten', VORGABE_AN('agenten'))) {
    const agenten = Agent.eigene();
    baum.appendChild(abschnitt('Agenten', () => Agent.eigenerDialog()));
    const ag = document.createElement('div');
    ag.className = 'wz-block';
    ag.innerHTML = agenten.slice(0, 6).map((a: any) =>
      `<button class="side-item" data-agent="${esc(a.id)}"><span>${a.icon || '🤖'}</span>` +
      `<span>${esc(a.name)}</span></button>`).join('') +
      '<button class="side-item" data-agent="+"><span>＋</span><span>Neuer Agent</span></button>';
    ag.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('[data-agent]');
      if (!b) return;
      if (b.dataset.agent === '+') Agent.eigenerDialog();
      else Agent.panel('');
    });
    baum.appendChild(ag);
    }

    /* Besprechungen */
    if (abschnittAn('bespr', VORGABE_AN('bespr'))) {
    const bes = document.createElement('div');
    bes.className = 'wz-block';
    const naechste = kommendeTermine(3);
    bes.innerHTML =
      (naechste.length
        ? naechste.map((t: any) => `<button class="side-item" data-termin="${t.id}">` +
            `<span>📌</span><span>${esc(t.text)}</span>` +
            `<span class="k">${esc(t.wann)}</span></button>`).join('')
        : '<div class="side-leer">Keine bevorstehenden Ereignisse</div>') +
      '<button class="side-item" data-bes="neu"><span>🎙</span><span>Neue Besprechungsnotiz</span></button>';
    bes.addEventListener('click', e => {
      const t = elVon(e)?.closest<HTMLElement>('[data-termin]');
      if (t) { oeffne(t.dataset.termin); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-bes="neu"]')) Meeting.panel();
    });
    baum.appendChild(abschnitt('Besprechungen'));
    baum.appendChild(bes);
    }

    /* Kürzlich verwendet */
    const letzte = abschnittAn('kuerzlich', VORGABE_AN('kuerzlich')) ? kuerzlich() : [];
    if (letzte.length) {
      baum.appendChild(abschnitt('Kürzlich verwendet'));
      const kv = document.createElement('div');
      kv.className = 'wz-block';
      kv.innerHTML = letzte.map((p2: any) =>
        `<button class="side-item" data-kv="${p2.id}"><span>${p2.icon || '📄'}</span>` +
        `<span>${esc(p2.text || 'Ohne Titel')}</span></button>`).join('');
      kv.addEventListener('click', e => {
        const b = elVon(e)?.closest<HTMLElement>('[data-kv]');
        if (b) oeffne(b.dataset.kv);
      });
      baum.appendChild(kv);
    }

    /* Favoriten */
    const favs = abschnittAn('favoriten') ? Store.favorites() : [];
    if (favs.length) {
      baum.appendChild(abschnitt('Favoriten'));
      favs.forEach((p: any) => baum.appendChild(zeile(p, 0)));
    }

    /* Bereiche (bei Notion: Teamspaces) */
    const bereiche = abschnittAn('bereiche') ? (Store.getMeta('bereiche', []) || []) : [];
    bereiche.forEach((b: any) => {
      const drin = Store.rootPages().filter((p: any) => p.bereich === b.id && !p.system && !p.archiviert);
      baum.appendChild(abschnitt(b.icon + ' ' + b.name, () => {
        const p = Store.addPage(null, { text: '', bereich: b.id });
        zeichneBaum(); oeffne(p.id);
        setTimeout(() => document.getElementById('title')?.focus(), 60);
      }));
      if (!drin.length) {
        const leer = document.createElement('div');
        leer.style.cssText = 'padding:6px 14px; font-size:12.5px; color:var(--text-faint)';
        leer.textContent = 'Noch leer';
        baum.appendChild(leer);
      }
      seitenAnhaengen(baum, drin);
    });

    /* Privat */
    if (abschnittAn('privat')) {
    const kopf = abschnitt('Privat', () => {
      const p = Store.addPage(null, { text: '' });
      zeichneBaum();
      oeffne(p.id);
      setTimeout(() => document.getElementById('title')?.focus(), 60);
    });
    baum.appendChild(kopf);

    const seiten = Store.rootPages().filter((p: any) => !p.system && !p.bereich && !p.archiviert);
    if (!seiten.length) {
      const leer = document.createElement('div');
      leer.style.cssText = 'padding:8px 14px; font-size:13px; color:var(--text-faint)';
      leer.textContent = 'Noch keine Seiten';
      baum.appendChild(leer);
    }
    seitenAnhaengen(baum, seiten);

    /* Systemseiten (Journal, Vorlagen, Schnellnotizen) getrennt unten */
    const sys = Store.rootPages().filter((p: any) => p.system);
    if (sys.length) {
      baum.appendChild(abschnitt('Angelegt von den Werkzeugen'));
      seitenAnhaengen(baum, sys);
    }
    }

    /* Meine Apps — bei Notion steht hier „Notion-Apps" ganz unten */
    if (!abschnittAn('apps')) return;
    /* `data-ruhig="chrome"` heisst: das hier ist Gerüst, keine eigene Seite.
       Die ruhige Fassung blendet Gerüst aus und lässt Eigenes stehen (E219).
       Der Unterschied ist nicht kosmetisch: „Privat" und „Kürzlich" tragen,
       was Redur selbst geschrieben hat — das versteckt man nicht. */
    const appKopf = abschnitt('Meine Apps', null, () => abschnitteAnpassen());
    appKopf.dataset['ruhig'] = 'chrome';
    baum.appendChild(appKopf);
    /* AUS DEM REGISTER, NICHT AUS ZWEI LISTEN (L58, E166).
       Hier standen die zwanzig Apps als Datentabelle und darunter eine Kette
       aus zwanzig `if (a === '…')`. Zwei Listen für dieselben zwanzig Dinge:
       wer eine hinzufügte, musste an beide denken, und wer eine umbenannte,
       an eine. Dieselbe Lage, die E160 eine Gruppe weiter oben aufgelöst hat.

       `esc` ist Pflicht, auch wenn heute nur eingebaute Einträge kommen:
       `melde` steht jedem Bereich offen, und ein Erweiterungsname ist
       Nutzertext (CLAUDE.md §19). */
    const apps = document.createElement('div');
    apps.className = 'wz-block apps-block';
    apps.dataset['ruhig'] = 'chrome';
    const appliste = (typeof Register !== 'undefined' && Register.navigation)
      ? Register.navigation.anPlatz('apps') : [];

    /* VIER GRUPPEN STATT ZWANZIG ZEILEN (E206).
       Redur am 26. August: „Links habe ich so viel Bereiche, reduziere es."
       Zwanzig gleichrangige Zeilen untereinander sind keine Liste, sondern
       eine Wand — man liest sie nicht, man sucht darin. Und weil sie ganz
       unten steht, scrollt man an allem anderen vorbei, um sie zu sehen.

       Gelöscht wird dabei nichts: jede App bleibt, sie steht nur in einer
       Schublade. Zu ist die Voreinstellung, aufgeklappt merkt sich der
       Speicher — wer „Einrichten" offen lässt, findet es offen wieder.

       Ein Eintrag ohne `gruppe` fällt nicht heraus, sondern landet unter
       „Sonstiges". Eine Erweiterung, die sich über `melde` anhängt, kennt
       diese Gruppennamen nicht und darf trotzdem erscheinen. */
    const offeneGruppen = (): string[] => {
      const g = Store.getMeta('appGruppenAuf', []);
      return Array.isArray(g) ? g : [];
    };
    const gruppeAuf = (id: string) => offeneGruppen().includes(id);
    const gruppeSchalten = (id: string) => {
      const auf = offeneGruppen();
      Store.setMeta('appGruppenAuf', auf.includes(id) ? auf.filter(x => x !== id) : [...auf, id]);
      zeichneBaum();
    };

    const inGruppe = (id: string) => appliste.filter((x: any) =>
      id === 'sonstiges' ? !APP_GRUPPEN.some(([g]) => g === x.gruppe) : x.gruppe === id);

    /* „Sonstiges" steht ausdrücklich in derselben Form wie die vier echten
       Gruppen, damit die Schleife eine Schleife bleibt und keine Sonderzeile
       darunter braucht. */
    const alleGruppen: Array<[string, string, string]> =
      [...APP_GRUPPEN, ['sonstiges', 'Sonstiges', 'dots']];
    apps.innerHTML = alleGruppen
      .map(([id, name, zeichen]) => {
        const drin = inGruppe(id);
        if (!drin.length) return '';
        const auf = gruppeAuf(id);
        return `<button class="side-item app-gruppe${auf ? ' auf' : ''}" data-app-gruppe="${esc(id)}"` +
          ` aria-expanded="${auf ? 'true' : 'false'}">` +
          `<span data-sym="${esc(zeichen)}" aria-hidden="true"></span>` +
          `<span>${esc(name)}</span>` +
          `<span class="k">${drin.length}</span>` +
          `<span class="app-pfeil" data-sym="chevronD" aria-hidden="true"></span></button>` +
          `<div class="app-unter"${auf ? '' : ' hidden'}>` + drin.map((x: any) =>
            `<button class="side-item" data-app="${esc(x.marke || x.id)}" title="${esc(x.hinweis || x.name)}">` +
            `<span>${esc(x.icon || '•')}</span><span>${esc(x.name)}</span></button>`
          ).join('') + '</div>';
      }).join('');

    apps.addEventListener('click', e => {
      const g = elVon(e)?.closest<HTMLElement>('[data-app-gruppe]');
      if (g?.dataset.appGruppe) { gruppeSchalten(g.dataset.appGruppe); return; }
    });
    /* Zugeklappte Abschnitte: alles bis zur nächsten Überschrift verstecken */
    setTimeout(() => {
      let versteckt = false;
      [...baum.children].forEach(el => {
        if (el.classList.contains('side-section')) {
          versteckt = abschnittZu(el.querySelector('span')?.firstChild?.textContent || '');
          el.classList.toggle('zu', versteckt);
          return;
        }
        if (el instanceof HTMLElement) el.style.display = versteckt ? 'none' : '';
      });
    }, 0);

    /* Die Handlung steht am Eintrag. Ein Fehler darin darf die Leiste nicht
       mitreissen — er gehört in den Reporter, wie beim Anhängepunkt unten. */
    apps.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('[data-app]');
      if (!b) return;
      const eintrag = appliste.find((x: any) => (x.marke || x.id) === b.dataset.app);
      if (!eintrag?.tun) return;
      try { eintrag.tun(); }
      catch (fehler: unknown) {
        if (typeof Reporter !== 'undefined')
          Reporter.error('Seitenleiste', String(b.dataset.app) + ': ' +
            (fehler instanceof Error ? fehler.message : String(fehler)), fehler);
      }
    });
    baum.appendChild(apps);

    /* --- Was das Register beisteuert -------------------------------------
       Ein Bereich, der einen Eintrag in der Seitenleiste braucht, meldet ihn
       in register/navigation.js an — statt hier eine Zeile einzufügen. Sonst
       ist diese Datei die eine Stelle, die jeder anfassen muss, und ihre
       Reihenfolge hängt davon ab, wer zuletzt geladen wurde.

       `anPlatz` filtert selbst über `zeigen()`: ein Eintrag, der etwas
       verspricht, das ohne Konto nicht geht, kommt gar nicht erst mit. */
    if (typeof Register !== 'undefined' && Register.navigation) {
      const dazu = Register.navigation.anPlatz('unten').filter((x: any) => x.tun && x.vonAussen);
      if (dazu.length) {
        const kasten = document.createElement('div');
        dazu.forEach((x: any) => {
          const z = document.createElement('button');
          z.className = 'side-item';
          z.innerHTML = `<span>${esc(x.icon || '•')}</span><span>${esc(x.name)}</span>`;
          z.addEventListener('click', () => {
            try { x.tun(); }
            catch (e: unknown) {
              if (typeof Reporter !== 'undefined')
                Reporter.error('Seitenleiste', e instanceof Error ? e.message : String(e), e);
            }
          });
          kasten.appendChild(z);
        });
        baum.appendChild(kasten);
      }
    }

    /* Die selbst gewählte Reihenfolge der Abschnitte anwenden */
    abschnitteOrdnen(baum);
    /* Erweiterungsknöpfe wieder anhängen — zeichneBaum leert den Baum */
    if (typeof Erweiterung !== 'undefined' && Erweiterung.knoepfeAnhaengen) Erweiterung.knoepfeAnhaengen();
    /* UND ZULETZT DIE ZEICHEN (E200). `zeichneBaum` leert den Baum und baut
       ihn neu; die `<span data-sym>` darin sind danach wieder leer. Der Ruf
       beim Start füllt nur, was zu diesem Zeitpunkt schon dasteht — alles
       Spätere muss sich selbst darum kümmern.
       Nur der Baum, nicht das ganze Dokument: was ausserhalb liegt, ist
       schon gefüllt, und ein zweiter Durchlauf darüber kostet bei jedem
       Neuzeichnen der Seitenleiste Zeit für nichts (§73). */
    if (typeof Register !== 'undefined' && (Register as any).symbole) {
      (Register as any).symbole.fuelle(baum);
    }
  };

  /**
   * Ordnet die fertig gezeichneten Abschnitte um.
   * Ein Abschnitt ist seine Überschrift plus alles bis zur nächsten. Was vor
   * der ersten Überschrift steht, gehört zu „Werkzeuge".
   */
  const abschnitteOrdnen = (baum: any) => {
    const folge = Store.getMeta('sidebarFolge', null);
    if (!Array.isArray(folge) || !folge.length) return;

    const nachName: Record<string, string> = {};
    ABSCHNITTE.forEach(([id, name]) => { if (name && id) nachName[name] = id; });

    type Teil = { id: string; nodes: Element[] };
    const teile: Teil[] = [];
    let jetzt: Teil = { id: 'werkzeuge', nodes: [] };
    [...baum.children].forEach(el => {
      if (el.classList.contains('side-section')) {
        const name = (el.querySelector('span')?.firstChild?.textContent || '').trim();
        if (jetzt.nodes.length) teile.push(jetzt);
        jetzt = { id: nachName[name] || ('x-' + name), nodes: [el] };
        return;
      }
      jetzt.nodes.push(el);
    });
    if (jetzt.nodes.length) teile.push(jetzt);
    if (teile.length < 2) return;

    const rang = (id: string) => {
      const i = folge.indexOf(id);
      return i < 0 ? 500 : i;
    };
    teile.sort((a, b) => rang(a.id) - rang(b.id));
    teile.forEach(t => t.nodes.forEach(n => baum.appendChild(n)));
  };

  /** Welche Abschnitte sind zugeklappt? Notion merkt sich das je Abschnitt. */
  const abschnittZu = (name: string) => (Store.getMeta('sidebarZu', []) || []).includes(name);

  const abschnittKlappen = (name: string) => {
    const zu = Store.getMeta('sidebarZu', []) || [];
    Store.setMeta('sidebarZu', zu.includes(name) ? zu.filter((x: any) => x !== name) : [...zu, name]);
    zeichneBaum();
  };

  /** Vom sichtbaren Namen zurück auf den Schlüssel in ABSCHNITTE. */
  const abschnittId = (name: any) => (ABSCHNITTE.find(([, n]) => n === name) || [])[0] || null;

  /**
   * Das ⋯-Menü eines Abschnitts. Was hier steht, muss auch etwas tun —
   * ein Menüpunkt, der nur da ist, damit es ihn gibt, ist schlimmer als
   * gar keiner.
   */
  const abschnittMenue = (anker: any, name: string) => {
    document.querySelectorAll('.menu').forEach(m => m.remove());
    const id = abschnittId(name);
    const zu = abschnittZu(name);
    const folge = abschnitteGeordnet().map(x => x[0]);
    const i = id ? folge.indexOf(id) : -1;

    /* Über `Menue.menu`, nicht von Hand: von Hand gebaut wurde dieses Menü
       am Telefon NIE zum Blatt — es stand als Rechner-Kästchen mitten auf
       dem kleinen Bildschirm, ohne Wischgeste, ohne Karten. Das Modul kann
       das alles; man muss es nur benutzen (§8-Gedanke, auf Menüs gewandt). */
    const r = anker.getBoundingClientRect();
    const m = Menue.menu(
      `<button data-a="klappen"><span class="mi">${zu ? '⌄' : '›'}</span>` +
        `${zu ? 'Aufklappen' : 'Zuklappen'}</button>` +
      '<button data-a="alleZu"><span class="mi">⌃</span>Alle Abschnitte zuklappen</button>' +
      '<button data-a="alleAuf"><span class="mi">⌄</span>Alle aufklappen</button>' +
      (id ? '<hr>' +
        `<button data-a="hoch"${i <= 0 ? ' disabled' : ''}><span class="mi">↑</span>Weiter nach oben</button>` +
        `<button data-a="runter"${i < 0 || i >= folge.length - 1 ? ' disabled' : ''}>` +
          '<span class="mi">↓</span>Weiter nach unten</button>' +
        '<button data-a="aus"><span class="mi">🚫</span>Diesen Abschnitt ausblenden</button>' : '') +
      '<hr>' +
      '<button data-a="anpassen"><span class="mi">⚙</span>Abschnitte anpassen</button>',
      Math.min(r.left, innerWidth - 230), r.bottom + 4, { titel: name });
    m.style.minWidth = '210px';

    m.addEventListener('click', (e) => {
      const b = elVon(e)?.closest<HTMLElement>('[data-a]');
      if (!b || (b as HTMLButtonElement).disabled) return;
      const a = b.dataset.a;
      /* Beides weg — am Telefon steht hinter dem Blatt der dunkle Grund,
         und ein Grund ohne Blatt wäre eine unsichtbare Wand vor der App. */
      document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
      if (a === 'klappen') abschnittKlappen(name);
      if (a === 'alleZu')  { Store.setMeta('sidebarZu', ABSCHNITTE.map(x => x[1])); zeichneBaum(); }
      if (a === 'alleAuf') { Store.setMeta('sidebarZu', []); zeichneBaum(); }
      /* Ohne Kennung gibt es den Abschnitt in der Reihenfolge nicht — dann
         tun diese drei Punkte auch nichts. */
      if (!id) return;
      if (a === 'hoch')    abschnittSchieben(id, -1);
      if (a === 'runter')  abschnittSchieben(id, 1);
      if (a === 'aus')     { abschnittSchalten(id); UI.toast(name + ' ausgeblendet'); }
      if (a === 'anpassen') abschnitteAnpassen();
    });
    /* Das Schliessen von aussen übernimmt das Modul: am Rechner der
       mousedown daneben, am Telefon der Grund und die Wischgeste. Der
       once-Klick-Schliesser, der hier stand, hätte am Telefon das Blatt
       entfernt und den Grund stehen lassen — eine unsichtbare Wand. */
  };

  const abschnitt = (name: string, beiPlus?: any, beiZahnrad?: any) => {
    const d = document.createElement('div');
    d.className = 'side-section';
    /* Chevron zum Auf- und Zuklappen — wie in Notions Telefon-App */
    d.innerHTML = `<span>${name}<i class="ss-pfeil">${abschnittZu(name) ? '›' : '⌄'}</i></span>`;
    d.querySelector('span')?.addEventListener('click', () => abschnittKlappen(name));
    if (beiZahnrad) {
      const z = document.createElement('button');
      z.textContent = '⚙';
      z.title = 'Abschnitte anpassen';
      z.addEventListener('click', beiZahnrad);
      d.appendChild(z);
    }
    if (beiPlus) {
      const b = document.createElement('button');
      b.textContent = '+';
      b.title = 'Neue Seite';
      b.addEventListener('click', beiPlus);
      d.appendChild(b);
    }
    /* --- Das Drei-Punkte-Menü des Abschnitts -------------------------
     * Bisher gab es zum Abschnitt nur den Pfeil und das Plus; alles
     * andere — ausblenden, umsortieren — lag im Anpassmodus versteckt.
     * Notion hat an jedem Abschnitt ein eigenes ⋯. Das holt es nach und
     * legt gleich das dazu, was hier wirklich nützlich ist: alles
     * zuklappen, und ein Weg zur Anpassliste.
     * ---------------------------------------------------------------- */
    const punkte = document.createElement('button');
    punkte.textContent = '⋯';
    punkte.title = 'Mehr zu diesem Abschnitt';
    punkte.addEventListener('click', (e) => {
      e.stopPropagation();
      abschnittMenue(punkte, name);
    });
    d.appendChild(punkte);
    return d;
  };

  let gemesseneZeilenHoehe = 30;
  const FENSTER_SCHWELLE = 240;
  const FENSTER_PUFFER = 12;

  /** Sichtbare Seitenhierarchie als flache Folge. Nur aufgeklappte Kinder
      gehören hinein — genau dieselbe Regel wie beim bisherigen rekursiven
      Zeichnen. */
  const sichtbareSeiten = (wurzeln: any[]): any[] => {
    const raus: any[] = [];
    const nimm = (p: any, tiefe: number): void => {
      raus.push({ p, tiefe });
      if (!p.aufgeklappt) return;
      Store.childrenOf(p.id)
        .filter((k: any) => k.type === 'page' && !k.archiviert)
        .forEach((k: any) => nimm(k, tiefe + 1));
    };
    wurzeln.forEach(p => nimm(p, 0));
    return raus;
  };

  /**
   * Ein echter Fenster-Renderer für grosse Seitenlisten. Der Scrollbereich
   * bleibt so hoch wie die vollständige Liste; im DOM stehen nur die Zeilen
   * im Bild plus zwölf darüber und darunter. Die Höhe wird an einer echten
   * `.row` gemessen und nicht aus dem CSS abgeschrieben.
   */
  const seitenAnhaengen = (baum: HTMLElement, wurzeln: any[]): void => {
    const liste = sichtbareSeiten(wurzeln);
    if (liste.length <= FENSTER_SCHWELLE) {
      wurzeln.forEach(p => baum.appendChild(zeile(p, 0)));
      return;
    }

    const rahmen = document.createElement('div');
    rahmen.className = 'seiten-fenster';
    rahmen.setAttribute('role', 'list');
    rahmen.setAttribute('aria-label', `${liste.length} Seiten`);
    rahmen.style.cssText = `position:relative;height:${liste.length * gemesseneZeilenHoehe}px`;
    baum.appendChild(rahmen);
    let letzterVon = -1, letzterBis = -1;

    const zeichnen = (erzwingen = false): void => {
      if (!rahmen.isConnected || rahmen.style.display === 'none') return;
      const relativ = baum.scrollTop - rahmen.offsetTop;
      const von = Math.max(0, Math.floor(relativ / gemesseneZeilenHoehe) - FENSTER_PUFFER);
      const bis = Math.min(liste.length, Math.max(von,
        Math.ceil((relativ + baum.clientHeight) / gemesseneZeilenHoehe) + FENSTER_PUFFER));
      if (!erzwingen && von === letzterVon && bis === letzterBis) return;
      letzterVon = von; letzterBis = bis;
      rahmen.replaceChildren();
      for (let i = von; i < bis; i++) {
        const x = liste[i];
        if (!x) continue;
        const z = zeile(x.p, x.tiefe, true);
        z.setAttribute('role', 'listitem');
        z.setAttribute('aria-posinset', String(i + 1));
        z.setAttribute('aria-setsize', String(liste.length));
        z.style.cssText = `position:absolute;left:0;right:0;top:${i * gemesseneZeilenHoehe}px`;
        rahmen.appendChild(z);
      }
    };

    zeichnen(true);
    requestAnimationFrame(() => {
      if (!rahmen.isConnected) return;
      const h = rahmen.querySelector<HTMLElement>('.row')?.getBoundingClientRect().height || 0;
      if (h > 10 && Math.abs(h - gemesseneZeilenHoehe) > 0.25) {
        gemesseneZeilenHoehe = h;
        rahmen.style.height = liste.length * h + 'px';
        zeichnen(true);
      }
    });
    const beiScroll = () => zeichnen();
    baum.addEventListener('scroll', beiScroll, { passive: true });
    const bisher = (baum as any).__seitenFensterAufraeumen;
    (baum as any).__seitenFensterAufraeumen = () => {
      if (typeof bisher === 'function') bisher();
      baum.removeEventListener('scroll', beiScroll);
    };
  };

  const zeile = (p: any, tiefe: number, flach = false) => {
    const w = document.createElement('div');
    if (flach && tiefe) w.style.marginLeft = tiefe * 14 + 'px';
    const r = document.createElement('div');
    r.className = 'row' + (p.id === aktuelleSeite() ? ' on' : '');
    r.draggable = true;
    /* DIE ORDNERFARBE IN DER SEITENLEISTE (E672) — als schmaler Rücken
       links, wie am Deckel. Nur bekannte Kennungen (`Farben.kennung`). */
    const zeilenFarbe = typeof Farben !== 'undefined' && Farben.kennung ? Farben.kennung(p.color) : '';
    if (zeilenFarbe) {
      r.dataset['farbe'] = zeilenFarbe;
      r.style.setProperty('--zeilen-farbe', 'var(--c-' + zeilenFarbe + ')');
    }

    const kinder = Store.childrenOf(p.id).filter((k: any) => k.type === 'page' && !k.archiviert);
    const offen = !!p.aufgeklappt;

    const tw = document.createElement('div');
    tw.className = 'tw';
    tw.textContent = kinder.length ? (offen ? '▾' : '▸') : '';
    tw.addEventListener('click', e => {
      e.stopPropagation();
      if (!kinder.length) return;
      Store.updateBlock(p.id, { aufgeklappt: !offen });
      zeichneBaum();
    });

    const ico = document.createElement('div');
    ico.className = 'ico';
    ico.textContent = p.icon || '📄';

    const nm = document.createElement('div');
    nm.className = 'nm';
    nm.textContent = p.text || 'Ohne Titel';
    if (p.locked) nm.textContent = '🔒 ' + nm.textContent;

    const act = document.createElement('div');
    act.className = 'act';
    const plus = document.createElement('button');
    plus.textContent = '+';
    plus.title = 'Unterseite';
    plus.addEventListener('click', e => {
      e.stopPropagation();
      const k = Store.addPage(p.id, { text: '' });
      Store.updateBlock(p.id, { aufgeklappt: true });
      zeichneBaum();
      oeffne(k.id);
      setTimeout(() => document.getElementById('title')?.focus(), 60);
    });
    const mehr = document.createElement('button');
    mehr.textContent = '⋯';
    /* EIN NAME FÜR DAS ⋯ (E721). Es hiess für den Vorleser nur „⋯" — bei
       vierzig Zeilen vierzig gleiche Knöpfe. Jetzt sagt es, wessen
       Aktionen es öffnet; `title` zeigt dasselbe der Maus. */
    const zeilenName = p.text || 'Ohne Titel';
    mehr.setAttribute('aria-label', 'Aktionen für „' + zeilenName + '“');
    mehr.setAttribute('aria-haspopup', 'menu');
    mehr.title = 'Aktionen für „' + zeilenName + '“';
    mehr.addEventListener('click', e => { e.stopPropagation(); seitenMenue(mehr, p); });
    act.appendChild(plus);
    act.appendChild(mehr);

    r.append(tw, ico, nm, act);
    r.addEventListener('click', () => oeffne(p.id));
    /* RECHTSKLICK AUF DIE ZEILE = IHR ⋯ (E721). Dieselbe Liste, nicht eine
       zweite: das Seitenmenü. Umschalt lässt das Menü des Browsers durch —
       dieselbe Hintertür wie im Editor. Die Zeilen bleiben ohne Tabstopp
       (die Liste ist virtuell); mit der Tastatur führt der Weg über das ⋯. */
    r.addEventListener('contextmenu', e => {
      if (e.shiftKey) return;
      e.preventDefault();
      seitenMenue(mehr, p);
    });

    /* Seiten in der Leiste umhängen */
    r.addEventListener('dragstart', e => { e.dataTransfer?.setData('text/seite', p.id); });
    r.addEventListener('dragover', e => { e.preventDefault(); r.classList.add('drop'); });
    r.addEventListener('dragleave', () => r.classList.remove('drop'));
    r.addEventListener('drop', e => {
      e.preventDefault(); r.classList.remove('drop');
      const quelle = e.dataTransfer?.getData('text/seite') ?? '';
      if (quelle && quelle !== p.id) {
        const q = Store.getBlock(quelle);
        if (q) Werkzeuge.verschiebe(q, p.id);
      }
    });

    w.appendChild(r);

    if (!flach && offen && kinder.length) {
      const k = document.createElement('div');
      k.className = 'kids';
      kinder.forEach((kid: any) => k.appendChild(zeile(kid, tiefe + 1)));
      w.appendChild(k);
    }
    return w;
  };

  /* ------------------------------------------------------------------------
   * Die öffentliche Fläche. `zeichne` heisst hier so, wie es heisst — der
   * alte Name `zeichneBaum` lebt in `App` weiter und reicht hierher.
   * `reiter()` liest, `reiter('chat')` setzt; es zeichnet dabei bewusst
   * nicht, weil die Aufrufstellen das schon selbst tun.
   * ----------------------------------------------------------------------*/
  return {
    binde,
    zeichne: zeichneBaum,
    zeichneReiter,
    handyLeiste,
    reiterWechseln,
    reiter: (id?: string) => { if (id !== undefined) reiter = id; return reiter; },
    ABSCHNITTE,
    abschnittAn,
    abschnittSchalten,
    abschnitteAnpassen,
    abschnitteGeordnet,
    abschnittMenue
  };
})();

(window as any).Seitenleiste = Seitenleiste;
