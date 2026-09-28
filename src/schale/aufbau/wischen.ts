/* ============================================================================
 * schale/aufbau/wischen.ts — mit dem Daumen zwischen den Bereichen
 * ----------------------------------------------------------------------------
 * Redur, 9. September, mit einem Bild der Apple-TV-Leiste:
 *
 *   „das ich zwischen bereichen mit maus so wenn ich draus von links nach
 *    rechst oder umketerk dort gehe … jetzt ist bei redion nur wenn man
 *    klick kann man wechseln"
 *
 * WAS DIESE DATEI WEISS: dass es unten eine Leiste mit Reitern gibt, und
 * sonst nichts. Sie ruft keinen Bereich auf, sie kennt keinen Namen eines
 * Bildschirms — sie sucht den nächsten Knopf und DRÜCKT IHN. Damit gilt für
 * das Wischen automatisch alles, was für das Tippen gilt: dieselbe
 * Schublade schliesst sich, dieselbe Pille wandert, dieselbe Markierung
 * stimmt. Ein zweiter Weg mit eigener Logik wäre ein zweiter Katalog (§8),
 * und der läuft mit dem ersten auseinander.
 *
 * DIE FÜNF DINGE, DIE EIN WISCHEN NICHT SEIN DARF
 *
 *   1. Ein Rollen. Wer waagerecht rollt — eine Tabelle, ein Bilderband, die
 *      Zeichenfläche —, will rollen und nicht den Bereich wechseln. Deshalb
 *      wird der Baum nach oben abgesucht, ob unter dem Finger etwas liegt,
 *      das waagerecht rollen KANN.
 *   2. Ein Strich. Beim Zeichnen (`body.schreibt`) und im offenen Dokument
 *      ist die ganze Fläche eine Leinwand.
 *   3. Ein Zurück. Die äusseren 24 px sind am iPhone die Systemgeste; wer
 *      dort anfängt, meint den Browser und nicht Redion.
 *   4. Ein Zoomen. Zwei Finger sind nie ein Wischen.
 *   5. Ein Tippen, das verrutscht. Deshalb 70 px Weg, und der Weg muss
 *      deutlicher waagerecht als senkrecht sein.
 *
 * UND EIN WISCHEN IST KEIN ERSATZ. Getippt werden kann weiter; die Geste
 * kommt dazu (§38: keine Auskunft, die es nur über die Geste gibt).
 * ==========================================================================*/

const Wischen = (() => {

  /** Wie weit der Finger gehen muss, damit es zählt. */
  const WEG = 70;
  /** Ab hier gilt die Geste als waagerecht und nicht als Rollen. */
  const FANG = 12;
  /** Der Rand, an dem das Betriebssystem selbst zuhört. */
  const RANDTABU = 24;
  /** Wie weit der Inhalt beim Ziehen mitgeht — gedämpft, damit es sich
   *  nach Widerstand anfühlt und nicht nach Wegrutschen. */
  const ZUG = 0.32, ZUG_MAX = 46;
  /** Und wenn es in dieser Richtung keinen Bereich mehr gibt: die Wand. */
  const ZUG_WAND = 0.10, ZUG_WAND_MAX = 16;

  const leiste = (): HTMLElement | null => document.getElementById('handy-oben');

  /** Die Reiter in der Reihenfolge, in der sie dastehen. */
  const reiter = (): HTMLElement[] => {
    const l = leiste();
    if (!l) return [];
    return Array.from(l.querySelectorAll<HTMLElement>('button[role="tab"]'));
  };

  /**
   * Ist die Leiste überhaupt da? Am Rechner steht sie auf `display:none`,
   * im offenen Dokument ebenfalls — dann gibt es nichts zu wechseln.
   *
   * HIER STAND `!!l.offsetParent`, UND DAS WAR IMMER FALSCH. `offsetParent`
   * ist bei einem Element mit `position:fixed` grundsätzlich `null`, ganz
   * gleich ob es sichtbar ist — und die Leiste IST fixiert. Die Geste hat
   * damit nie ausgelöst, und zwar völlig lautlos: kein Fehler, keine
   * Meldung, nur nichts. Gemessen mit vier Wischbewegungen, die alle auf
   * demselben Reiter endeten.
   *
   * Das gemessene Rechteck sagt beides auf einmal: `display:none` ergibt
   * 0 × 0, alles andere die echte Grösse.
   */
  const leisteDa = (): boolean => {
    const l = leiste();
    if (!l) return false;
    const r = l.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  /**
   * Welcher Reiter ist gerade an? −1, wenn keiner — das ist der Normalfall
   * im Kompass und im Posteingang, und dann wird nicht gewischt: es gäbe
   * keinen Ort, von dem aus „der nächste" etwas bedeutet.
   */
  const jetzt = (): number => reiter().findIndex(b => b.classList.contains('an'));

  /**
   * Der Nachbar in dieser Richtung, oder nichts.
   *
   * KEIN UMLAUF. Von „Mehr" nach rechts kommt nicht wieder „Dokumente" —
   * eine Liste, die hinten wieder vorn anfängt, nimmt der Geste ihre einzige
   * Auskunft darüber, wo man ist.
   */
  const nachbar = (schritt: number): HTMLElement | null => {
    const alle = reiter();
    const i = jetzt();
    if (i < 0) return null;
    return alle[i + schritt] ?? null;
  };

  /** Rollt dieses Element waagerecht — oder eines darüber? */
  const rolltWaagerecht = (start: Element | null): boolean => {
    let el: Element | null = start;
    for (let tiefe = 0; el && tiefe < 24; tiefe++, el = el.parentElement) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.dataset.keinWisch !== undefined) return true;
      if (el.scrollWidth > el.clientWidth + 2) {
        const wie = getComputedStyle(el).overflowX;
        if (wie === 'auto' || wie === 'scroll') return true;
      }
    }
    return false;
  };

  /** Liegt etwas über allem — ein Blatt, ein Fenster, eine Schublade? */
  const etwasOffen = (): boolean =>
    !!document.querySelector('.overlay, dialog[open], .finder, #r-blatt.auf');

  /** Darf hier überhaupt gewischt werden? */
  const darf = (ziel: EventTarget | null, x: number): boolean => {
    if (!leisteDa()) return false;
    const k = document.body.classList;
    if (k.contains('schreibt')) return false;
    if (document.body.dataset.dokument === 'an') return false;
    if (etwasOffen()) return false;
    if (x < RANDTABU || x > innerWidth - RANDTABU) return false;
    const el = ziel instanceof Element ? ziel : null;
    if (el?.closest('#handy-oben')) return false;
    if (rolltWaagerecht(el)) return false;
    return true;
  };

  /* ------------------------------------------------------------------------
   * Die Geste selbst
   * ----------------------------------------------------------------------*/
  /**
   * Was die letzte Geste war — für Prüfläufe und für die Fehlersuche.
   *
   * Ohne das ist eine Geste, die nicht auslöst, eine schwarze Kiste: es gibt
   * keinen Fehler, keine Meldung, nur nichts. Genau daran sind bei dieser
   * Datei zwei Fehler hintereinander lange unentdeckt geblieben (siehe
   * `leisteDa` und `ende`). Hier steht danach, WORAN es lag.
   */
  let letzte: {
    dx: number; dy: number; dauer: number;
    gefangen: boolean; grund: string;
  } | null = null;

  /**
   * NACH DEM WISCHEN KOMMT NOCH EIN KLICK — und der muss geschluckt werden.
   *
   * Der Browser erzeugt aus `pointerdown` … `pointerup` zusätzlich ein
   * `click`-Ereignis, und zwar auf dem gemeinsamen Vorfahren von Anfang und
   * Ende. Wer über eine Liste wischt, drückt damit die Zeile, über der er
   * angefangen hat.
   *
   * GEMESSEN, und zwar von `test484 §3`: im Mehr-Blatt nach links gewischt —
   * die Geste tat richtig nichts (ganz rechts ist Schluss), und der Klick
   * danach öffnete „Dokumente". Ein Wischen, das etwas öffnet, das man nicht
   * angetippt hat, ist schlimmer als eines, das nichts tut.
   *
   * NICHT BEI JEDER GESTE. Ab 12 px gilt eine Bewegung als waagerecht; ein
   * Tipp, der um 15 px verrutscht, ist aber immer noch ein Tipp und soll
   * wirken. Geschluckt wird erst ab 40 px — dann hat niemand mehr getippt.
   *
   * UND NICHT AUF DER LEISTE. Der Wechsel selbst läuft über `ziel.click()`,
   * und der ginge sonst mit demselben Riegel unter.
   */
  const SCHLUCK_AB = 40;
  let schlucken = false;

  /**
   * DER BROWSER ZIEHT SONST DEN TEXT MIT.
   *
   * Liegt eine Auswahl unter dem Zeiger — und die entsteht schon beim
   * vorherigen Ziehen über Text —, dann macht Chromium aus dem nächsten
   * Ziehen ein Text-Ziehen: `dragstart` feuert, und danach kommt KEIN
   * `pointerup` mehr. Die Geste stirbt lautlos mitten drin.
   *
   * GEMESSEN mit einer Spur über `pointerdown`, `dragstart` und
   * `pointerup`: drei Wischbewegungen hintereinander ergaben
   * `down · up · down · up · down · dragstart` — die dritte hatte kein
   * Ende. Am Telefon fällt das kaum auf, mit der Maus bei jedem zweiten
   * Wischen.
   *
   * `preventDefault` nimmt dem Zug den Anfang; die Zeigerereignisse laufen
   * danach normal weiter. Nur solange eine Geste läuft — wer eine Datei
   * oder einen Block ziehen will, soll das weiter können.
   */
  addEventListener('dragstart', (e: Event) => {
    if (zeiger !== -1) e.preventDefault();
  }, true);

  addEventListener('click', (e: Event) => {
    if (!schlucken) return;
    const el = e.target instanceof Element ? e.target : null;
    if (el?.closest('#handy-oben')) return;
    e.stopPropagation();
    e.preventDefault();
  }, true);

  let zeiger = -1;                       /* die Kennung des Fingers, −1 = keiner */
  let x0 = 0, y0 = 0, t0 = 0;
  let gefangen = false;                  /* schon als waagerecht erkannt? */

  const buehne = (): HTMLElement | null => document.getElementById('scroll');

  /** Wer weniger Bewegung will, bekommt weniger Bewegung (§38). */
  const ruhig = (): boolean => {
    /* Das System ODER „Ruhige Darstellung" (E702). */
    try { return AppEinstellung.wenigBewegung(); }
    catch { return false; }
  };

  const schieben = (dx: number): void => {
    const b = buehne();
    if (!b || ruhig()) return;
    /* Beim Ziehen folgt die Fläche dem Finger OHNE Übergang — ein Übergang
       liefe der Hand hinterher. Erst beim Loslassen wird er eingeschaltet,
       damit das Zurückschnellen weich ist. */
    b.style.transition = 'none';
    const wand = !nachbar(dx < 0 ? 1 : -1);
    const f = wand ? ZUG_WAND : ZUG;
    const max = wand ? ZUG_WAND_MAX : ZUG_MAX;
    const weit = Math.max(-max, Math.min(max, dx * f));
    b.style.transform = `translateX(${weit.toFixed(1)}px)`;
  };

  const loslassen = (): void => {
    const b = buehne();
    if (b && b.style.transform) {
      b.style.transition = 'transform .22s var(--ease-standard, ease)';
      b.style.transform = '';
      setTimeout(() => { b.style.transition = ''; }, 260);
    }
    zeiger = -1; gefangen = false;
  };

  /**
   * Den Wechsel spielen: der Inhalt kommt von der Seite herein, aus der
   * Richtung, in die gewischt wurde. Das ist der ganze Unterschied zwischen
   * „es ist etwas anderes da" und „ich bin woanders hingegangen".
   */
  const einblenden = (nachLinks: boolean): void => {
    const b = buehne();
    if (!b || ruhig()) return;
    b.classList.remove('wisch-links', 'wisch-rechts');
    /* Neu zeichnen erzwingen, sonst startet dieselbe Bewegung nicht noch
       einmal, wenn zweimal in dieselbe Richtung gewischt wird. */
    void b.offsetWidth;
    const klasse = nachLinks ? 'wisch-links' : 'wisch-rechts';
    b.classList.add(klasse);
    /* Weg, wenn sie fertig ist — die sanfte Feder braucht 796 ms (E702). */
    const fertig = (e?: AnimationEvent): void => {
      if (e && (e.target !== b || !/^wisch-rein/.test(e.animationName))) return;
      b.removeEventListener('animationend', fertig);
      b.removeEventListener('animationcancel', fertig);
      if (b.classList.contains(klasse)) b.classList.remove('wisch-links', 'wisch-rechts');
    };
    b.addEventListener('animationend', fertig);
    b.addEventListener('animationcancel', fertig);
    setTimeout(() => fertig(), 1200);
  };

  /** EIN ORTSWECHSEL, EINE ANKUNFT (E702): getippt wie gewischt, aus der
   *  Richtung des neuen Reiters; derselbe oder keiner → keine. */
  const ankunft = (vonIndex: number, nachIndex: number): void => {
    if (vonIndex < 0 || nachIndex < 0 || vonIndex === nachIndex) return;
    einblenden(nachIndex > vonIndex);
  };

  const starten = (): void => {
    if (!document.body) return;

    addEventListener('pointerdown', (e: PointerEvent) => {
      /* Der Stift zeichnet, er wischt nicht. */
      if (e.pointerType === 'pen') return;
      if (zeiger !== -1) { zeiger = -1; return; }   /* zweiter Finger: aus */
      if (!darf(e.target, e.clientX)) return;
      zeiger = e.pointerId; x0 = e.clientX; y0 = e.clientY;
      t0 = e.timeStamp; gefangen = false;
    }, { passive: true });

    addEventListener('pointermove', (e: PointerEvent) => {
      if (e.pointerId !== zeiger) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      if (!gefangen) {
        if (Math.abs(dy) > Math.abs(dx)) { zeiger = -1; return; }  /* rollt */
        if (Math.abs(dx) < FANG) return;
        gefangen = true;
      }
      schieben(dx);
    }, { passive: true });

    const ende = (e: PointerEvent): void => {
      if (e.pointerId !== zeiger) return;
      const dx = e.clientX - x0, dy = e.clientY - y0;
      const dauer = e.timeStamp - t0;
      /* ERST MERKEN, DANN LOSLASSEN. `loslassen()` setzt `gefangen` zurück —
         es räumt ja die Geste weg. Wer danach `gefangen` liest, liest immer
         `false` und verwirft jedes Wischen. Genau das tat diese Funktion:
         die Geste lief sauber durch, wurde erkannt, verschob die Fläche —
         und verwarf sich in der letzten Zeile selbst. Vier Wischbewegungen
         endeten alle auf demselben Reiter, ohne einen einzigen Fehler. */
      const war = gefangen;
      loslassen();
      if (war && Math.abs(dx) >= SCHLUCK_AB) {
        schlucken = true;
        /* Genau ein Bild lang. Der Klick des Browsers folgt unmittelbar auf
           `pointerup`; alles Spätere ist wieder ein echter Tipp. */
        setTimeout(() => { schlucken = false; }, 0);
      }
      const merke = (grund: string): void => {
        letzte = { dx: Math.round(dx), dy: Math.round(dy), dauer: Math.round(dauer),
                   gefangen: war, grund };
      };
      if (!war) { merke('nicht waagerecht'); return; }
      if (Math.abs(dx) < WEG) { merke('zu kurz'); return; }
      if (Math.abs(dx) < Math.abs(dy) * 1.8) { merke('zu schräg'); return; }
      if (dauer > 900) { merke('zu langsam'); return; }
      const ziel = nachbar(dx < 0 ? 1 : -1);
      if (!ziel) { merke('kein Nachbar'); return; }
      merke('gewechselt');
      /* die Ankunft spielt der Reiterwechsel selbst (`ankunft`, E702) */
      ziel.click();
    };
    addEventListener('pointerup', ende, { passive: true });
    addEventListener('pointercancel', () => loslassen(), { passive: true });
  };

  /* `reiter`, `nachbar` und `darf` stehen mit im Rückgabewert, damit ein
     Prüflauf sie einzeln befragen kann, ohne einen Finger zu erfinden. */
  return { starten, reiter, nachbar, darf, jetzt, einblenden, ankunft, letzte: () => letzte };
})();

(window as any).Wischen = Wischen;
