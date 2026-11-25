/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/gfx/toolbar.ts (npm run bauen:ts). */
/* ============================================================================
 * core/gfx/toolbar.ts — EINE Werkzeugleiste für alle Flächen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/gfx/toolbar.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/core/gfx/toolbar.js`; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Der dritte Bewohner des GFX-Kerns, nach dem Verlauf (`history.ts`, E687) und
 * dem Raum (`core/sheet/space.ts`). Redur, 25. September 2026, mit einem Bild
 * von AFFiNEs Edgeless-Leiste: „ich will so was haben wie die affine" —
 * „integriere alles zusammen".
 *
 * WAS DAS BAUTEIL IST: ein Zeichner für Leisten. Es bekommt Werkzeuge und
 * Aktionen als Daten, baut daraus Knöpfe, hält fest, welches Werkzeug gewählt
 * ist, öffnet Untermenüs und führt die Tastatur. Mehr nicht.
 *
 * WAS ES NICHT IST — und das ist der Grund, warum es hier liegen darf (§5):
 * Es kennt keine Fläche. Kein `wb-`, kein `gk-`, kein `sp-`, kein `blatt-`,
 * kein `Store`, kein `Register`, kein `App`. Was ein Werkzeug TUT, weiss nur
 * die Fläche, die es ausführt; dieses Bauteil ruft dafür einen Rückruf. Und
 * die Strichzeichen füllt der AUFRUFER ein (`Register.symbole.fuelle`) — der
 * Kern schreibt nur `data-sym` an die Stelle, an der eines hingehört.
 * `test572 §1` liest das gebaute JavaScript und hält das fest.
 *
 * ── DREI ENTSCHEIDUNGEN, DIE MAN IM BILD SIEHT ─────────────────────────────
 *
 * 1 · ZWEI KAPSELN IN EINEM SOCKEL. Gemessen: ein Whiteboard-Kasten auf einer
 *     gewöhnlichen Seite ist 708 px breit (`#page` mit `max-width:900` und
 *     96 px Rand). Zwölf Werkzeuge, acht Farben, vier Zoomknöpfe und vier
 *     Aktionen passen dort in EINE Kapsel nicht — gerechnet 714 px bei 708.
 *     Also trägt die linke Kapsel die Werkzeuge, die rechte Zoom, Verlauf und
 *     „…". Das ist zugleich AFFiNEs Aufteilung, dort nur als zweite Pille
 *     links unten.
 *
 * 2 · DIE LEISTE ROLLT, SIE BLÄTTERT NICHT. AFFiNE blättert die rechte Gruppe
 *     mit ‹ ›. Redion hat für schmale Fenster schon eine Antwort, und zwar
 *     eine erprobte: die Studioleiste rollt waagrecht (E356, `test393` hält
 *     die Verlaufsknöpfe dabei am Rand fest). Zwei Antworten auf dieselbe
 *     Frage wären eine zu viel (§8). Blättern kann in Bogen 5e dazukommen,
 *     wenn es jemand vermisst.
 *
 * 3 · KEIN `position:fixed`. Die Leiste sitzt IM Kasten ihrer Fläche und
 *     rollt mit der Seite. Eine feste Leiste läge am Telefon unter
 *     `#handy-oben` (z-index 401, `bausteine.css:1729`) — und §37 verlangt
 *     ohnehin, dass eine Werkzeugleiste nicht verdeckt, was sie bedient.
 * ==========================================================================*/

const GfxToolbar = (() => {

  /** Ein Werkzeug, wie die Leiste es braucht. Strukturell dasselbe wie ein
   *  Eintrag aus `Register.werkzeuge` — aber hier eigens beschrieben, damit
   *  der Kern kein Register braucht, um übersetzt zu werden (§5). */
  interface Werkzeug {
    id: string; name: string; titel: string; sym: string; zeichen: string;
    gruppe: 'quick' | 'senior';
    haelt?: boolean;
  }

  /** Eine Aktion ist ein Knopf ohne Zustand: Rückgängig, Zoom, „…". */
  interface Aktion {
    id: string; name: string; titel?: string; sym: string;
    /** `true` = öffnet ein Untermenü statt sofort zu wirken. */
    menue?: boolean;
    gesperrt?: boolean;
    /** In welche Kapsel: 'werkzeuge' (links) oder 'neben' (rechts, Vorgabe). */
    kapsel?: 'werkzeuge' | 'neben';
  }

  interface Optionen {
    werkzeuge: Werkzeug[];
    aktionen?: Aktion[];
    /** Welches Werkzeug am Anfang gewählt ist. */
    aktiv?: string;
    /** Zusatzklasse an der Wurzel — so behalten alte Wächter ihren Wähler
     *  (`.wb-tools`), obwohl die Leiste neu gebaut ist. */
    klasse?: string;
    /** Eigene Knoten für die rechte Kapsel, an ihrer Stelle in der Liste
     *  der Aktionen: Schlüssel ist die Kennung, VOR der sie stehen. */
    zusatz?: Record<string, Node>;
    /** Der Inhalt eines Untermenüs — die Fläche baut ihn, der Kern zeigt ihn. */
    menue?: (id: string) => Node | null;
    aufWerkzeug?: (id: string) => void;
    aufAktion?: (id: string) => void;
    /** Was für Vorleser über der ganzen Leiste steht (§38). */
    beschriftung?: string;
    galerie?: {
      schnell: string[];
      karten: { id: string; knoepfe: string[] }[];
      werkzeugMenues?: Record<string, string[]>;
      edgeless: { zusatz: string[] };
    };
  }

  const esc = (wert: unknown): string => String(wert ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const erstelle = (o: Optionen) => {
    const werkzeuge = (o.werkzeuge || []).filter(w => w && w.id);
    const aktionen = (o.aktionen || []).filter(a => a && a.id);
    let aktiv = o.aktiv || werkzeuge[0]?.id || '';
    let offenesMenue: string | null = null;

    const wurzel = document.createElement('div');
    wurzel.className = 'gfx-tb-sockel' + (o.klasse ? ' ' + o.klasse : '');

    /* DER ROLLER IST EINE EIGENE EBENE, und das ist kein Schmuck.
       Erster Anlauf: der Sockel selbst rollte (overflow-x:auto). Das Menue lag
       darin — und CSS macht aus `overflow-x:auto` mit `overflow-y:visible`
       beidseitig `auto`: das Menue war GEMESSEN an der richtigen Stelle
       (148 x 80 px ueber dem Knopf, im Kasten) und auf dem Bild trotzdem nicht
       da, weil der Sockel es abschnitt. Gefunden hat das nicht der Waechter,
       sondern das Bild (§55.1). Jetzt rollt eine Ebene tiefer, und das Menue
       haengt am Sockel darueber. */
    const roller = document.createElement('div');
    roller.className = 'gfx-tb-roller';

    const leiste = document.createElement('div');
    leiste.className = 'gfx-tb gfx-tb-haupt';
    leiste.setAttribute('role', 'toolbar');
    leiste.setAttribute('aria-label', o.beschriftung || 'Werkzeuge');

    const neben = document.createElement('div');
    neben.className = 'gfx-tb gfx-tb-neben';

    /** Ein Knopf: Strichzeichen aus `data-sym`, Name für den Vorleser (§38).
     *  Das Textzeichen bleibt als Rückfall darin, falls kein Symbol da ist —
     *  ein leerer Knopf wäre schlimmer als ein Emoji. */
    const knopf = (teil: { id: string; name: string; titel?: string; sym: string; zeichen?: string },
                   art: 'wz' | 'a', menue = false): HTMLButtonElement => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset[art === 'wz' ? 'wz' : 'a'] = teil.id;
      if (menue) { b.dataset.menue = teil.id; b.setAttribute('aria-expanded', 'false'); }
      b.title = teil.titel || teil.name;
      b.setAttribute('aria-label', teil.name);
      b.tabIndex = -1;
      b.innerHTML = teil.sym
        ? `<span class="zeichen" data-sym="${esc(teil.sym)}" aria-hidden="true"></span>`
        : `<span class="zeichen" aria-hidden="true">${esc(teil.zeichen ?? '')}</span>`;
      return b;
    };

    /* --- Die Werkzeuge: quick links, senior rechts, ein Strich dazwischen --- */
    const quick = werkzeuge.filter(w => w.gruppe === 'quick');
    const senior = werkzeuge.filter(w => w.gruppe !== 'quick');
    const gruppe = (klasse: string): HTMLElement => {
      const g = document.createElement('div');
      g.className = 'gfx-tb-gruppe ' + klasse;
      return g;
    };
    const trenner = (): HTMLElement => {
      const t = document.createElement('span');
      t.className = 'gfx-tb-trenn';
      t.setAttribute('aria-hidden', 'true');
      return t;
    };
    const gQuick = gruppe('gfx-tb-quick');
    for (const w of quick) {
      const b = knopf(w, 'wz');
      b.setAttribute('aria-pressed', String(w.id === aktiv));
      if (w.id === aktiv) b.classList.add('on');
      gQuick.append(b);
    }
    const gSenior = gruppe('gfx-tb-senior');
    for (const w of senior) {
      const b = knopf(w, 'wz');
      b.setAttribute('aria-pressed', String(w.id === aktiv));
      if (w.id === aktiv) b.classList.add('on');
      gSenior.append(b);
    }
    if (quick.length) leiste.append(gQuick);
    if (quick.length && senior.length) leiste.append(trenner());
    if (senior.length) leiste.append(gSenior);

    /* --- Die Aktionen ------------------------------------------------------ */
    const inWerkzeuge = aktionen.filter(a => a.kapsel === 'werkzeuge');
    const inNeben = aktionen.filter(a => a.kapsel !== 'werkzeuge');
    const setzeAktionen = (liste: Aktion[], ziel: HTMLElement): void => {
      for (const a of liste) {
        const vor = o.zusatz?.[a.id];
        if (vor) ziel.append(vor);
        const b = knopf(a, 'a', a.menue === true);
        if (a.gesperrt) b.disabled = true;
        ziel.append(b);
      }
    };
    if (inWerkzeuge.length) { leiste.append(trenner()); setzeAktionen(inWerkzeuge, leiste); }
    setzeAktionen(inNeben, neben);

    roller.append(leiste);
    if (neben.childNodes.length) roller.append(neben);
    wurzel.append(roller);

    /* Die Galerie verwendet dieselben Knöpfe und Rückrufe wie die normale
       Leiste. In den Menüs eingehängte Werkzeuge behalten ihre Kennung. */
    const menueGruppen = new Map<string, HTMLElement>();
    const vorrat = document.createElement('div');
    vorrat.hidden = true;
    let galerieMessen: ResizeObserver | undefined;
    if (o.galerie) {
      wurzel.classList.add('gfx-tb-galerie', 'gfx-tb-edgeless');
      const knoepfe = new Map([...roller.querySelectorAll<HTMLButtonElement>('button')].map(b =>
        [b.dataset.wz || b.dataset.a, b]));
      const einhaengen = (el: HTMLElement, ids: string[]): void => {
        for (const id of ids) {
          const b = knoepfe.get(id);
          if (b) { el.append(b); knoepfe.delete(id); }
        }
      };
      leiste.replaceChildren();
      const schnell = gruppe('gfx-tb-schnell');
      einhaengen(schnell, o.galerie.schnell);
      const zusatz = gruppe('gfx-tb gfx-tb-edgeless-zusatz');
      zusatz.setAttribute('role', 'group');
      zusatz.setAttribute('aria-label', 'Redion-Werkzeuge');
      einhaengen(zusatz, o.galerie.edgeless.zusatz);
      if (zusatz.childElementCount) roller.append(zusatz);

      const festerStreifen = document.createElement('div');
      festerStreifen.className = 'gfx-tb-kartenfenster';
      const karten = gruppe('gfx-tb-karten');
      for (const { id, knoepfe: ids } of o.galerie.karten) {
        const karte = gruppe('gfx-tb-karte');
        karte.dataset.karte = id;
        einhaengen(karte, ids);
        const vorschau = karte.querySelector<HTMLElement>('.zeichen');
        if (vorschau && (id === 'notiz' || id === 'formen')) {
          delete vorschau.dataset.sym;
          const teile = id === 'notiz' ? ['link', 'text', 'heading'] : ['rect', 'ellipse', 'triangle'];
          for (const teil of teile) {
            const grafik = document.createElement('span');
            grafik.dataset.vorschau = teil;
            vorschau.append(grafik);
          }
        }
        if (karte.childElementCount) karten.append(karte);
      }
      festerStreifen.append(karten);
      const galeriekarten = Array.from(karten.children) as HTMLElement[];
      let kartenStart = 0;
      let kartenProSeite = 3;
      for (const [id, ids] of Object.entries(o.galerie.werkzeugMenues ?? {})) {
        const zeile = gruppe('gfx-tb-menuewerkzeuge');
        einhaengen(zeile, ids);
        menueGruppen.set(id, zeile);
        vorrat.append(zeile);
      }
      wurzel.append(vorrat);
      for (const b of knoepfe.values()) if (!neben.contains(b)) neben.append(b);
      if (neben.childElementCount && !neben.parentElement) roller.append(neben);

      const blatt = (name: string, zeichen: string, richtung: number): HTMLButtonElement => {
        const b = document.createElement('button');
        b.type = 'button';
        b.tabIndex = -1;
        b.className = 'gfx-tb-blatt';
        b.dataset.richtung = richtung < 0 ? 'links' : 'rechts';
        b.title = name;
        b.setAttribute('aria-label', name);
        const symbol = document.createElement('span');
        symbol.textContent = zeichen;
        symbol.setAttribute('aria-hidden', 'true');
        b.append(symbol);
        b.addEventListener('click', () => {
          if (b.getAttribute('aria-disabled') === 'true') return;
          menueZu();
          kartenStart += kartenProSeite * richtung;
          blattstand();
          haltPruefen();
        });
        return b;
      };
      const zurueck = blatt('Vorherige Werkzeuge', '‹', -1);
      const weiter = blatt('Weitere Werkzeuge', '›', 1);
      const blattstand = (): void => {
        if (festerStreifen.clientWidth > 0) {
          kartenProSeite = Math.max(1, Math.floor(festerStreifen.clientWidth / 96));
        }
        const letzterStart = Math.max(0, galeriekarten.length - kartenProSeite);
        kartenStart = Math.max(0, Math.min(kartenStart, letzterStart));
        for (const [index, karte] of galeriekarten.entries()) {
          karte.hidden = index < kartenStart || index >= kartenStart + kartenProSeite;
        }
        zurueck.setAttribute('aria-disabled', String(kartenStart === 0));
        weiter.setAttribute('aria-disabled', String(kartenStart === letzterStart));
      };
      leiste.append(schnell, trenner(), zurueck, festerStreifen, weiter);
      galerieMessen = new ResizeObserver(() => {
        blattstand();
        haltPruefen();
      });
      galerieMessen.observe(festerStreifen);
      blattstand();
    }

    /* --- Das Untermenü ------------------------------------------------------
       Es klappt NACH OBEN auf. Nach unten wäre es ausserhalb des Kastens —
       die Leiste sitzt schon an dessen unterem Rand —, und am Telefon läge es
       hinter der unteren Leiste der Schale. */
    const menueZu = (): void => {
      const gruppe = offenesMenue ? menueGruppen.get(offenesMenue) : undefined;
      if (gruppe) {
        for (const knopf of gruppe.querySelectorAll('button')) knopf.tabIndex = -1;
        vorrat.append(gruppe);
      }
      wurzel.querySelector('.gfx-tb-menue')?.remove();
      wurzel.querySelectorAll('[data-menue]').forEach(b => b.setAttribute('aria-expanded', 'false'));
      offenesMenue = null;
    };
    const menueAuf = (id: string, ausloeser: HTMLElement, fokus = false): void => {
      const inhalt = o.menue?.(id);
      const gruppe = menueGruppen.get(id);
      if (!inhalt && !gruppe) return;
      menueZu();
      const m = document.createElement('div');
      m.className = 'gfx-tb-menue';
      m.setAttribute('role', 'group');
      if (gruppe) {
        for (const knopf of gruppe.querySelectorAll('button')) knopf.tabIndex = 0;
        m.append(gruppe);
      }
      if (inhalt) m.append(inhalt);
      wurzel.append(m);
      offenesMenue = id;
      ausloeser.setAttribute('aria-expanded', 'true');
      /* Waagrecht am Auslöser ausrichten und in den Kasten klemmen. */
      const wr = wurzel.getBoundingClientRect(), ar = ausloeser.getBoundingClientRect();
      const mb = m.getBoundingClientRect();
      const links = Math.max(0, Math.min(wr.width - mb.width, ar.left - wr.left + ar.width / 2 - mb.width / 2));
      m.style.left = Math.round(links) + 'px';
      if (fokus) m.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
    };

    /* --- Klicks ------------------------------------------------------------ */
    const beiKlick = (e: Event): void => {
      const ziel = e.target as HTMLElement | null;
      if (!ziel) return;
      const mn = ziel.closest<HTMLElement>('[data-menue]');
      if (mn && wurzel.contains(mn)) {
        const id = mn.dataset.menue ?? '';
        if (offenesMenue === id) menueZu(); else menueAuf(id, mn, e instanceof MouseEvent && e.detail === 0);
        return;
      }
      const wz = ziel.closest<HTMLElement>('[data-wz]');
      if (wz && wurzel.contains(wz)) {
        const ursprung = wz.closest('.gfx-tb-menue') && offenesMenue;
        menueZu();
        const id = wz.dataset.wz ?? '';
        const teil = werkzeuge.find(w => w.id === id);
        if (teil?.haelt !== false) setzeWerkzeug(id);
        o.aufWerkzeug?.(id);
        if (ursprung) wurzel.querySelector<HTMLElement>(`[data-menue="${CSS.escape(ursprung)}"]`)?.focus();
        return;
      }
      const ak = ziel.closest<HTMLElement>('[data-a]');
      if (ak && wurzel.contains(ak)) {
        const id = ak.dataset.a ?? '';
        /* Ein Klick IM Untermenü schliesst es — er hat ja gewirkt. */
        if (ziel.closest('.gfx-tb-menue')) menueZu();
        o.aufAktion?.(id);
      }
    };
    wurzel.addEventListener('click', beiKlick);

    /* --- Tastatur: EIN Tabstopp, Pfeile führen (§38) ------------------------
       Dieselbe Regel wie in der Studioleiste (`marken.ts`, „roving tabindex"):
       die Leiste ist EIN Halt beim Tabben, drinnen bewegen Pfeile. Sonst
       braucht man dreissig Tabs, um an der Leiste vorbeizukommen. */
    const alleKnoepfe = (): HTMLButtonElement[] =>
      [...wurzel.querySelectorAll<HTMLButtonElement>('button')].filter(b => !b.closest('.gfx-tb-menue'));
    const knoepfe = (): HTMLButtonElement[] =>
      alleKnoepfe().filter(b => !b.disabled && b.offsetParent !== null);
    /* DER HALT ENTSTEHT AUCH, WENN DIE LEISTE NOCH NICHT IM DOKUMENT HÄNGT
       (E722). Bis zum 6. Oktober lief diese Zeile am Ende von `erstelle`,
       bevor ein Aufrufer die Wurzel einhängte — `offsetParent` ist dort für
       jeden Knopf `null`, die Liste war leer, und kein Knopf bekam
       `tabIndex 0`. Gemessen: null Halte in beiden Leisten, eine Tab-Runde
       von 60 Tasten erreichte keinen; erst ein MAUSKLICK auf ein Werkzeug
       setzte einen. Ist nichts gelegt, zählt deshalb jeder freie Knopf —
       und alle anderen gehen auf −1, damit es nie zwei Halte gibt. */
    const tabstoppSetzen = (): void => {
      const alle = alleKnoepfe();
      const gelegt = knoepfe();
      const liste = gelegt.length ? gelegt : alle.filter(b => !b.disabled);
      const gewaehlt = liste.find(b => b.dataset.wz === aktiv) ?? liste[0];
      for (const b of alle) b.tabIndex = b === gewaehlt ? 0 : -1;
    };
    /** Stimmt der Halt noch? Er geht verloren, wenn sein Knopf gesperrt oder
     *  ausgeblendet wird — dann rückt er auf einen freien nach. */
    const haltPruefen = (): void => {
      const liste = knoepfe();
      if (liste.length && !liste.some(b => b.tabIndex === 0)) tabstoppSetzen();
    };
    const beiTaste = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && offenesMenue) {
        /* Lag der Fokus IM Menü, ginge er mit ihm verloren — er kehrt zum
           Knopf zurück, der es geöffnet hat (§38, E302). */
        const imMenue = !!(document.activeElement && wurzel.querySelector('.gfx-tb-menue')?.contains(document.activeElement));
        const ausloeser = wurzel.querySelector<HTMLElement>(`[data-menue="${CSS.escape(offenesMenue)}"]`);
        menueZu(); e.stopPropagation(); e.preventDefault();
        if (imMenue) ausloeser?.focus();
        return;
      }
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
      const liste = knoepfe();
      const jetzt = liste.indexOf(document.activeElement as HTMLButtonElement);
      if (jetzt < 0) return;
      e.preventDefault();
      const naechster = e.key === 'Home' ? 0
        : e.key === 'End' ? liste.length - 1
        : e.key === 'ArrowRight' ? (jetzt + 1) % liste.length
        : (jetzt - 1 + liste.length) % liste.length;
      const b = liste[naechster];
      if (!b) return;
      for (const x of liste) x.tabIndex = x === b ? 0 : -1;
      b.focus();
    };
    wurzel.addEventListener('keydown', beiTaste);
    /* Beim ersten Fokus und nach jedem Umhängen (die Fläche hängt Leisten in
       ihren Schacht und wieder heraus, E722) wird der Halt nachgesehen. */
    wurzel.addEventListener('focusin', haltPruefen);

    /* Ein Klick irgendwo sonst schliesst das Menü. Ein Menü, das offen bleibt,
       während man weiterzeichnet, verdeckt genau das, was man gerade tut. */
    const beiAussen = (e: Event): void => {
      if (!offenesMenue) return;
      const z = e.target as Node | null;
      if (z && !wurzel.contains(z)) menueZu();
    };
    document.addEventListener('pointerdown', beiAussen, true);

    /* --- Was die Fläche von aussen darf ------------------------------------ */
    const setzeWerkzeug = (id: string): void => {
      aktiv = id;
      wurzel.querySelectorAll<HTMLElement>('[data-wz]').forEach(b => {
        const an = b.dataset.wz === id;
        b.classList.toggle('on', an);
        b.setAttribute('aria-pressed', String(an));
      });
      tabstoppSetzen();
    };
    const setzeGesperrt = (id: string, ja: boolean): void => {
      const b = wurzel.querySelector<HTMLButtonElement>(`[data-a="${CSS.escape(id)}"]`);
      if (!b) return;
      b.disabled = ja;
      if (ja && b.tabIndex === 0) tabstoppSetzen();
    };
    const zerstoere = (): void => {
      galerieMessen?.disconnect();
      document.removeEventListener('pointerdown', beiAussen, true);
      wurzel.remove();
    };

    tabstoppSetzen();
    /* Nach dem ersten Bild, wenn der Aufrufer die Leiste eingehängt hat: liegt
       der Halt auf einem Knopf, den man nicht sieht, rückt er nach. */
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(haltPruefen);

    return {
      element: wurzel,
      setzeWerkzeug,
      setzeGesperrt,
      schliesse: menueZu,
      istOffen: (): string | null => offenesMenue,
      zerstoere
    };
  };

  return { erstelle };
})();

(window as any).GfxToolbar = GfxToolbar;
