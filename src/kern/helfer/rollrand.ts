/* ============================================================================
 * rollrand.js — Wo ein Rollfeld angeschnitten ist, soll man das sehen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/helfer/rollrand.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/kern/helfer/rollrand.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * DER GRUND, WARUM ES DIESE DATEI GIBT
 *
 * Am Telefon, 390 px breit, stand im Tabellenblock:
 *
 *     Spalte B          Spalte C
 *     1'450.00 CHF      1'45
 *     2'199.70 CHF      2'18
 *
 * Rechts ist nichts kaputt — dort geht die Tabelle weiter, und die Zelle C2
 * enthält sehr wohl `1'450.00 CHF`. Abgeschnitten hat sie der BILDRAND.
 *
 * Und genau das ist gefährlich, weil die Kante SCHARF ist. Eine scharfe
 * Kante liest sich als Ende der Zahl: `1'45` ist eine gültige Zahl, nur eine
 * andere. Für eine zu enge Zelle gibt es seit jeher `###` — die Zelle weiss,
 * dass ihr Inhalt nicht passt. Am Bildrand weiss das niemand: die Zelle ist
 * breit genug, nur der Bildschirm ist es nicht.
 *
 * Das ist derselbe Fund wie in CLAUDE.md §55.2, eine Ebene höher. Dort war es
 * `634.2166666667`, das als `34.2166666667` dastand.
 *
 * DIE ANTWORT ist keine Warnung und kein Hinweistext, sondern eine WEICHE
 * KANTE. Der letzte Streifen verläuft ins Nichts, und damit liest das Auge
 * „hier geht es weiter" statt „hier hört die Zahl auf". Es kostet keine
 * Zeile Text, keinen Platz und keinen Klick.
 *
 * WARUM ÜBER `mask-image` UND NICHT ÜBER EIN AUFGELEGTES ELEMENT. Ein
 * Pseudo-Element im Rollfeld rollt MIT dem Inhalt und wäre nach dem ersten
 * Wisch weg. Eine Maske gilt dem Kasten des Elements, nicht seinem Inhalt —
 * sie bleibt am Rand stehen, egal wie weit gerollt wurde. Und sie braucht
 * keine Geometrie: kein Ausmessen von Kopf- und Fusszeile, das beim nächsten
 * Umbau schiefgeht.
 * ==========================================================================*/

const Rollrand = (() => {

  /**
   * Wie viel Spielraum, bevor eine Seite als „geht weiter" gilt.
   *
   * Nicht null: Browser rechnen `scrollWidth` und `clientWidth` bei
   * gebrochenen Zoomstufen um Bruchteile eines Pixels auseinander. Bei null
   * flackerte die Kante dann an einem Rollfeld, an dem gar nichts zu rollen
   * ist.
   */
  const SPIEL = 2;

  /**
   * ZWEI ANTWORTEN, EINE MESSUNG.
   *
   * Gezeichnet wird an zwei Sorten Rollfeld, und beide brauchen dieselbe
   * Rechnung, aber ein anderes Wort dafür:
   *
   *     art 'rand'   data-rand="links rechts"      Tabellen
   *     art 'mehr'   data-mehr="beides|rechts|…"   Knopfleisten
   *
   * Der Unterschied ist nur, WO der Verlauf liegt. Bei den Tabellen ist es
   * eine Maske auf dem Feld selbst; bei den Knopfleisten ein Streifen an der
   * Kante, damit die Knöpfe voll deckend bleiben und nur der letzte am Rand
   * ausläuft.
   *
   * KEIN SCHATTEN. Hier stand einmal, für die Knopfleisten gehöre ein
   * Schatten an die Kante. Nachgesehen am 25. August: `rgba(0,0,0,.34)` über
   * `#1a1a1a` ist kein Schatten, und „Meine Fehler" endete trotz grüner
   * Prüfung mitten im Wort an einer scharfen Kante (E159). Ein Verlauf endet
   * in der Fläche, auf der er liegt, und trägt deshalb in beiden Themen.
   *
   * `data-mehr` hat immer einen Wert, auch „nein" — so steht in den beiden
   * bereits gebauten Fassungen (E141, E151), und die CSS und die Prüfläufe
   * test210/test217 lesen ihn so. `data-rand` verschwindet stattdessen,
   * wenn nichts anzuzeigen ist. Beide Verträge bleiben, wie sie sind; hier
   * wird nur die dreifach abgeschriebene Rechnung zusammengelegt.
   */
  type Art = 'rand' | 'mehr';

  /**
   * QUER ODER HOCH.
   *
   * Bis E183 mass diese Datei nur die Waagerechte — Tabellen und
   * Knopfleisten rollen zur Seite. Das Einlesefenster rollt nach UNTEN, und
   * der Fund war derselbe wie bei der Tabelle: die achte Quelle stand 28 px
   * unter der Kante, ihre Beschreibung war weg, und nichts sagte es.
   *
   * Es wäre leicht gewesen, dafür eine zweite kleine Rechnung neben diese zu
   * schreiben. Genau das ist L34 — ein Wert an zwei Stellen, nichts erzwingt
   * Gleichheit. Also misst dieselbe Funktion beide Achsen, und `quer` bleibt
   * die Vorgabe, damit sich für keinen der sechs bisherigen Aufrufer etwas
   * ändert.
   *
   * Die WÖRTER sind je Achse andere, weil sie in der CSS stehen und dort
   * etwas bedeuten: `links rechts` beim Queren, `oben unten` beim Hochen.
   */
  type Achse = 'quer' | 'hoch';

  /** Wohin, und in welcher Sprache. `an` ist nötig, weil die
      Markierungsleiste im PDF das Merkmal an ihrem ELTERNTEIL trägt: gerollt
      wird `.blatt-tools`, den Schatten zeichnet `.blatt-reihe`. */
  type Wahl = { art?: Art; an?: HTMLElement | null; achse?: Achse };

  /** Die Wörter je Achse: [vor dem sichtbaren Teil, danach]. */
  const WORTE: Record<Achse, [string, string]> = {
    quer: ['links', 'rechts'],
    hoch: ['oben',  'unten']
  };

  const schreibe = (ziel: HTMLElement, art: Art, achse: Achse,
                    davor: boolean, danach: boolean): void => {
    const [a, b] = WORTE[achse];
    if (art === 'mehr') {
      const wert = davor && danach ? 'beides' : danach ? b : davor ? a : 'nein';
      if (ziel.dataset['mehr'] !== wert) ziel.dataset['mehr'] = wert;
      return;
    }
    const wert = [davor ? a : '', danach ? b : ''].filter(Boolean).join(' ');
    /* Nur schreiben, wenn sich etwas ändert — ein Attribut bei jedem
       Rollereignis neu zu setzen lässt den Zeichner unnötig arbeiten. */
    if (wert) { if (ziel.dataset['rand'] !== wert) ziel.dataset['rand'] = wert; }
    else if (ziel.dataset['rand'] !== undefined) delete ziel.dataset['rand'];
  };

  /** Setzt `data-rand` bzw. `data-mehr` nach dem aktuellen Rollstand. */
  const pruefe = (feld: HTMLElement, wahl: Wahl = {}): void => {
    const achse = wahl.achse || 'quer';
    const hoch  = achse === 'hoch';
    const stand = hoch ? feld.scrollTop    : feld.scrollLeft;
    const sicht = hoch ? feld.clientHeight : feld.clientWidth;
    const ganz  = hoch ? feld.scrollHeight : feld.scrollWidth;
    schreibe(wahl.an || feld, wahl.art || 'rand', achse,
             stand > SPIEL, stand + sicht < ganz - SPIEL);
  };

  /**
   * Ein Rollfeld beobachten. Gibt eine Funktion zurück, die das wieder
   * löst — gebraucht wird sie bisher nicht, aber ein Beobachter ohne
   * Abmeldung ist ein Leck, das man erst bemerkt, wenn es zu spät ist.
   */
  const binde = (feld: HTMLElement | null, wahl: Wahl = {}): (() => void) => {
    if (!feld) return () => {};
    const nachsehen = () => pruefe(feld, wahl);
    feld.addEventListener('scroll', nachsehen, { passive: true });

    /* Die Breite ändert sich auch ohne Rollen: das Fenster dreht sich, eine
       Spalte wird breiter gezogen, die Seitenleiste klappt ein. Ohne diesen
       Beobachter bliebe die Kante stehen, wo sie beim ersten Zeichnen war. */
    let beobachter: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      beobachter = new ResizeObserver(nachsehen);
      beobachter.observe(feld);
      /* Auch der Inhalt zählt — eine neue Spalte macht `scrollWidth` grösser,
         beim Hochen eine neue Zeile `scrollHeight`, ohne dass sich am Feld
         selbst etwas ändert. */
      const inhalt = feld.firstElementChild;
      if (inhalt) beobachter.observe(inhalt);
    }

    /* Beim ersten Mal steht die Breite noch nicht fest: das Feld ist gerade
       erst im Dokument, und der Zeichner war noch nicht dran. */
    nachsehen();
    requestAnimationFrame(nachsehen);

    return () => {
      feld.removeEventListener('scroll', nachsehen);
      beobachter?.disconnect();
    };
  };

  /**
   * Rollt `feld` so weit, dass `stueck` GANZ darin steht.
   *
   * WOZU. Eine Leiste, die rollt, zeigt nach dem Zeichnen ihren Anfang —
   * nicht das, was gerade gewählt ist. Solange alles hineinpasste, fiel das
   * nie auf. Seit die Reiterzeile der Lernwelt am Telefon mit der
   * Krumenzeile verschmilzt (E235), passt es nicht mehr: man tippt auf
   * „Prüfungen", der Reiter wird der aktive — und steht halb ausserhalb
   * der Karte.
   *
   * WARUM NICHT `scrollIntoView`. Das rollt ALLE Vorfahren mit, auch
   * `#scroll` — die Seite spränge bei jedem Reiterwechsel nach oben oder
   * unten. Hier wird nur das eine Feld gerollt.
   *
   * `rand` ist kein Zierabstand: die Kante blendet den Inhalt über die
   * letzten Punkte aus. Ein Reiter, der bündig am Rand endet, steht zwar
   * drin und ist trotzdem halb durchsichtig.
   */
  const zeige = (feld: HTMLElement | null, stueck: HTMLElement | null,
                 wahl: Wahl & { rand?: number } = {}): void => {
    if (!feld || !stueck) return;
    const hoch = (wahl.achse || 'quer') === 'hoch';
    const rand = wahl.rand ?? 12;
    const f = feld.getBoundingClientRect();
    const s = stueck.getBoundingClientRect();
    const anfangF = hoch ? f.top : f.left;
    const endeF   = hoch ? f.bottom : f.right;
    const anfangS = hoch ? s.top : s.left;
    const endeS   = hoch ? s.bottom : s.right;
    /* Passt das Stück ohnehin nicht ins Feld, gewinnt sein Anfang: lieber
       den Anfang eines langen Namens lesen als seine Mitte. */
    let schub = 0;
    if (endeS - anfangS > endeF - anfangF) schub = anfangS - anfangF - rand;
    else if (anfangS < anfangF + rand)     schub = anfangS - anfangF - rand;
    else if (endeS > endeF - rand)         schub = endeS - endeF + rand;
    if (!schub) return;
    if (hoch) feld.scrollTop += schub; else feld.scrollLeft += schub;
    pruefe(feld, wahl);
  };

  return { binde, pruefe, zeige, SPIEL };
})();

(window as any).Rollrand = Rollrand;
