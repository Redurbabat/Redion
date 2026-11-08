/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/planflaeche.ts (npm run bauen:ts). */
/* ============================================================================
 * bereiche/bloecke/arten/planflaeche.ts — den Schaltplan bedienen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/bloecke/arten/planflaeche.ts`.
 * ----------------------------------------------------------------------------
 * WARUM ZWEI DATEIEN
 *
 * `schaltplan.ts` weiss, WAS ein Plan ist und wie er aussieht — Modell und
 * Bild, ohne ein einziges Ereignis. Diese Datei weiss, wie man ihn BEDIENT.
 * Die Trennung ist dieselbe wie im Editor (rendern / tastatur / auswahl) und
 * hat einen handfesten Nutzen: die Prüfläufe können einen Plan rechnen und
 * zeichnen lassen, ohne je einen Zeiger zu bewegen.
 *
 * ALLES GEHT ÜBER `aendere`. Jede Änderung am Plan läuft durch diese eine
 * Funktion, und sie tut drei Dinge in fester Reihenfolge: den Plan in den
 * Block schreiben, neu zeichnen, den Verlauf merken. Wer irgendwo daneben
 * direkt an `plan.teile` schraubt, verliert das Rückgängig — und merkt es
 * erst, wenn jemand es braucht.
 * ==========================================================================*/

const Planflaeche = (() => {

  const esc = Schaltplan.esc;

  /* --- Zwei kleine Rechenhelfer aus Redurs ZIP (E770) --------------------
   * In der ZIP standen sie als handgeschriebenes JavaScript unter
   * `bereiche/elektro/` (§54) und wurden über `window` gerufen (§5 Regel 1).
   * Hier sind sie getypt und gehören der Planfläche selbst: das Labor
   * liest nur, was `Stromfluss` schon gerechnet hat, das Studio sucht im
   * Register — keines schreibt Plandaten.
   * --------------------------------------------------------------------- */
  type ZeitEintrag = { zeit: number; ausgang: boolean };
  type ZeitAnzeige = { id: string; bmk: string; art: string; gesamt: number; rest: number;
                       fortschritt: number; aktiv: boolean; phase: string };
  const Labor = {
    TEMPI: [0.25, 0.5, 1, 2, 4] as const,
    tempo(wert: unknown): number {
      const v = Number(wert);
      return (Labor.TEMPI as readonly number[]).includes(v) ? v : 1;
    },
    zeitAnzeigen(plan: any, relais: Record<string, ZeitEintrag>, spulen: Record<string, boolean>): ZeitAnzeige[] {
      const teile: any[] = Array.isArray(plan?.teile) ? plan.teile : [];
      return teile.filter(t => t && (t.zeichen === 'spule-anzugsverzoegert' || t.zeichen === 'spule-abfallverzoegert'))
        .map(t => {
          const s: Partial<ZeitEintrag> = (t.bmk && relais[t.bmk]) || {};
          const T = Number.isFinite(t.werte?.T) ? Math.max(0, Math.min(3600, Number(t.werte.T))) : 3;
          const gesamt = T * 1000;
          const laufend = !!spulen[t.bmk];
          const istEin = t.zeichen === 'spule-anzugsverzoegert';
          const zeit = Number.isFinite(s.zeit) ? Math.max(0, Math.min(gesamt, Number(s.zeit))) : 0;
          const aktiv = !!s.ausgang;
          const rest = istEin ? (laufend ? gesamt - zeit : gesamt) : (!laufend && aktiv ? zeit : 0);
          const fortschritt = gesamt > 0
            ? Math.max(0, Math.min(1, istEin ? zeit / gesamt : (laufend ? 1 : (aktiv ? zeit / gesamt : 0))))
            : (aktiv ? 1 : 0);
          const phase = istEin ? (laufend ? (aktiv ? 'Geschaltet' : 'Einschaltverzögerung') : 'Ruhelage')
            : (laufend ? 'Spule aktiv' : (aktiv ? 'Ausschaltverzögerung' : 'Ruhelage'));
          return { id: String(t.id || ''), bmk: String(t.bmk || 'K?'), art: istEin ? 'EIN' : 'AUS',
                   gesamt, rest, fortschritt, aktiv, phase };
        });
    },
    statistik(plan: any, r: any, spulen: Record<string, boolean>):
        { gueltig: boolean; lampen: number; relais: number; leitungen: number; strom: number } {
      const teile: any[] = Array.isArray(plan?.teile) ? plan.teile : [];
      if (!r || !r.ok) return { gueltig: false, lampen: 0, relais: 0, leitungen: 0, strom: 0 };
      const werte = r.werte || {};
      const lampen = teile.filter(t => /^(lampe|signalleuchte|ch-kontrolllampe)$/.test(t.zeichen) &&
        werte[t.id] && Number(werte[t.id].helligkeit) > 0.01).length;
      const aktive = new Set(teile.filter(t => /^(spule|spule-anzugsverzoegert|spule-abfallverzoegert)$/.test(t.zeichen) &&
        t.bmk && spulen[t.bmk]).map(t => t.bmk));
      const netzStrom = r.netzStrom || {};
      const leitungen = Object.values(r.leitungNetz || {}).filter(n =>
        typeof n === 'number' && Number(netzStrom[n]) > 1e-9).length;
      return { gueltig: true, lampen, relais: aktive.size, leitungen,
               strom: Number.isFinite(r.maxStrom) ? Math.max(0, r.maxStrom) : 0 };
    }
  };
  /* Die zwei Fragen an die Simulation, die Zeichnung UND Schalter stellen —
     vorher an beiden Stellen abgeschrieben, jetzt an einer (E770, test537:
     die Zahl der Griffe in den Bereich elektro wächst nicht). */
  const schaltart = (zeichen: string) =>
    ({ st: Stromfluss.stellungenVon(zeichen), vh: Stromfluss.verhalten(zeichen) });
  /** Die eine Rechnung — für die Simulation und für die offenen Klemmen
      im Prüfzentrum (E747/E771), damit beide dieselbe Antwort lesen. */
  const stromRechnung = (plan: any, stellungen: Record<string, number>, spulen: Record<string, boolean>,
                         zeit?: Record<string, boolean>) => Stromfluss.rechne(plan, stellungen, spulen, zeit);
  /** Ein Strom als Text, wie überall in Redion (Fusszeile und Labor). */
  const stromText = (wert: number): string => Stromfluss.zeige(wert, 'A');
  const StudioHilfe = {
    text: (v: unknown): string => String(v ?? '').toLocaleLowerCase('de').normalize('NFKD').replace(/[̀-ͯ]/g, ''),
    leseLetzte(roh: unknown): string[] {
      return Array.isArray(roh)
        ? [...new Set(roh.filter((x): x is string => typeof x === 'string' && x.length < 90))].slice(0, 8) : [];
    },
    merkeLetzte(roh: unknown, id: string): string[] {
      return id && id.length < 90 ? [id, ...StudioHilfe.leseLetzte(roh).filter(x => x !== id)].slice(0, 8)
        : StudioHilfe.leseLetzte(roh);
    },
    suche(liste: any[], wort = '', gruppe = 'alle', limit = 36): any[] {
      if (!Array.isArray(liste)) return [];
      const frage = StudioHilfe.text(wort).trim().slice(0, 90);
      const grenze = Number.isInteger(limit) && limit >= 0 ? Math.min(limit, 120) : 36;
      return liste.filter(s => s && typeof s.id === 'string' && typeof s.name === 'string' &&
        (gruppe === 'alle' || s.gruppe === gruppe)).map((s, i) => {
        const name = StudioHilfe.text(s.name), id = StudioHilfe.text(s.id), erkl = StudioHilfe.text(s.erklaerung);
        const rang = !frage ? 0 : id === frage || name === frage ? 0 : name.startsWith(frage) ? 1 :
          id.startsWith(frage) ? 2 : name.includes(frage) ? 3 : id.includes(frage) ? 4 : erkl.includes(frage) ? 5 : 99;
        return { s, i, rang };
      }).filter(x => x.rang < 99).sort((a, b) => a.rang - b.rang || a.i - b.i).slice(0, grenze).map(x => x.s);
    },
    ueberblick(plan: any, holeSymbol: (id: string) => any):
        { teile: number; leitungen: number; texte: number; gruppen: { gruppe: string; anzahl: number }[]; doppelteKennzeichen: string[] } {
      const teile: any[] = Array.isArray(plan?.teile) ? plan.teile : [];
      const gruppen = new Map<string, number>(), bmk = new Map<string, number>();
      for (const t of teile) {
        const g = String(holeSymbol(t?.zeichen)?.gruppe || t?.zeichen || 'Unbekannt').split('-')[0] || 'Unbekannt';
        gruppen.set(g, (gruppen.get(g) || 0) + 1);
        const k = String(t?.bmk || '').trim();
        if (k) bmk.set(k, (bmk.get(k) || 0) + 1);
      }
      return { teile: teile.length,
        leitungen: Array.isArray(plan?.leitungen) ? plan.leitungen.length : 0,
        texte: Array.isArray(plan?.texte) ? plan.texte.length : 0,
        gruppen: [...gruppen].map(([gruppe, anzahl]) => ({ gruppe, anzahl }))
          .sort((a, b) => b.anzahl - a.anzahl || a.gruppe.localeCompare(b.gruppe)),
        doppelteKennzeichen: [...bmk].filter(([, n]) => n > 1).map(([k]) => k) };
    }
  };

  type Werkzeug = 'zeigen' | 'leitung' | 'text' | 'radieren' | 'schiene';
  type Punkt = { x: number; y: number };

  /** Was gerade am Bildschirm passiert — nichts davon gehört in den Block. */
  type Zustand = {
    block: any;
    plan: any;
    werkzeug: Werkzeug;
    auswahl: Set<string>;
    /** Das Symbol, das als Nächstes gesetzt wird (aus der Palette gewählt). */
    gewaehltesZeichen: string;
    /** Läuft gerade ein Zug? Solange ja, ändert nur er den Plan (`aendere`). */
    zieht: null | {
      /* `strecke`, `radieren`, `schiene` und `schwenk` kamen mit E762:
         eine Strecke einer Leitung quer schieben, wischend radieren, eine
         Schiene zeichnen, die Ansicht verschieben (mittlere Taste,
         Leertaste). */
      art: 'teil' | 'leitung' | 'rahmen' | 'strecke' | 'radieren' | 'schiene' | 'schwenk';
      /** Der Zeiger, der zieht — Maus, Finger oder Stift. Nur seine
          Bewegungen und sein Loslassen zählen (ein zweiter Finger nicht). */
      zeiger: number;
      startX: number; startY: number;
      /** Ausgangslagen aller mitgezogenen Teile. */
      ausgang: Map<string, { x: number; y: number }>;
      /** Beim Leitungziehen: der Anfangspunkt. */
      von?: { x: number; y: number; teil?: string; nr?: string };
      /** Beim Ziehen eines Teils: was VOR der ersten Bewegung feststand —
          welche Klemme jedes Leitungsende meint (E738), die Punkte und was
          jede Leitung berührt (E746). Jede Bewegung rechnet von hier aus. */
      vorher?: ReturnType<typeof Schaltplan.vorherMerken>;
      /** Wo die gezogenen Teile beim letzten Bild standen („x,y;x,y") — ist
          seither nichts über ein Raster gewandert, gibt es nichts zu rechnen. */
      lage?: string;
      /** Der Plan beim Anfassen (E762) — der Rückgängig-Schritt eines Zugs,
          der den Plan unterwegs schon ändert (Strecke, Radierer). */
      abzugStart?: string;
      /** Beim Schieben einer Strecke: welche Leitung, welche Strecke, wie sie liegt. */
      strecke?: { lid: string; i: number; waag: boolean; d: number };
      /** Beim Radieren: was der Kreis berührt hat, wo er zuletzt war, ob er wanderte. */
      weg?: Set<string>;
      letzter?: Punkt;
      gewandert?: boolean;
      /** Beim Verschieben der Ansicht: der letzte Bildschirmpunkt. */
      schirm?: Punkt;
      /** Beim Leitungziehen: das Ende der letzten Vorschau („x,y"). */
      vorschauEnde?: string;
    };
    /** Rückgängig und Wiederholen — der Abbild-Verlauf aus dem Kern (E687), 60 Schritte. */
    verlauf: ReturnType<typeof GfxHistory.erstelle>;
    zeigeAnschluesse: boolean;
    zeigeNummern: boolean;
    zeigeRaster: boolean;

    /* --- Die Ansicht (E762) -------------------------------------------------
     * Zoom und Lage gehören dem Bildschirm, nicht dem Block: wer den Plan
     * morgen öffnet, sieht ihn ganz, wie er gezeichnet ist. `zoom` 1 mit
     * Lage 0,0 ist genau das Bild von vor E762 (viewBox = das Blatt). */
    ansicht: { zoom: number; x: number; y: number };
    /** Steht die Fläche im Vollbild? */
    voll: boolean;
    /** Der Radierer (E762): alles oder nur Leiter, und wie gross der Kreis ist (px am Bildschirm). */
    radierModus: 'alles' | 'leiter';
    radierGroesse: number;
    /** Welche Schiene das Werkzeug „Schiene" zeichnet. */
    schieneArt: string;
    /** Wird die Leertaste gehalten? Dann verschiebt Ziehen die Ansicht. */
    leertaste: boolean;

    /* --- Die Simulation (Punkte 13, 14, 30) ---------------------------------
     * Nichts davon gehört in den Block. Eine Schalterstellung ist kein Teil
     * der ZEICHNUNG, sondern des Ausprobierens: wer den Plan morgen wieder
     * öffnet, will ihn so sehen, wie er gezeichnet ist, und nicht mit dem
     * Licht an, das gestern jemand angelassen hat. Der Plan bleibt damit
     * auch in der Sicherung das, was er ist — ein Plan.
     * --------------------------------------------------------------------- */
    /** Läuft die Simulation gerade? */
    simulation: boolean;
    /** Teil-Kennung → Nummer der Schalterstellung. */
    stellungen: Record<string, number>;
    /** Welche Spulen angezogen haben — das Gedächtnis für die Selbsthaltung. */
    spulenStand: Record<string, boolean>;
    /** Das letzte Rechenergebnis, für Zeichnung und Meldungen. */
    ergebnis: any;
  };

  /* ------------------------------------------------------------------------
   * DIE PALETTE (Punkte 5, 6, 12)
   * ------------------------------------------------------------------------
   * Links stehen die Symbole, nach Gruppen. Welche Gruppe oben steht, sagt
   * die Planart: wer einen Installationsplan zeichnet, will Schalter und
   * Steckdosen zuerst und nicht Halbleiter.
   *
   * FAVORITEN (Punkt 6) liegen in `Store.meta` und nicht im Plan — sie
   * gehören dem Menschen, nicht dem Dokument. Wer zwei Pläne öffnet, hat in
   * beiden dieselben Favoriten, und ein Plan, den man weitergibt, nimmt die
   * eigenen Gewohnheiten nicht mit.
   * ----------------------------------------------------------------------*/
  const FAVORITEN = 'elektro:favoriten';

  const favoriten = (): string[] => {
    const roh = (typeof Store !== 'undefined') ? Store.getMeta(FAVORITEN, []) : [];
    return Array.isArray(roh) ? roh.map(String) : [];
  };
  const favoritUmschalten = (id: string): boolean => {
    const liste = favoriten();
    const i = liste.indexOf(id);
    if (i >= 0) liste.splice(i, 1); else liste.push(id);
    if (typeof Store !== 'undefined') Store.setMeta(FAVORITEN, liste);
    return i < 0;
  };

  /** Die Symbolbibliothek benutzt ausschliesslich die vorhandenen Fachzeichen.
   * Filter und Vorlieben sind UI-Zustand, niemals Teil von block.plan. */
  const paletteHtml = (planArt: string, suche = '', filter = 'alle', aktiv = ''): string => {
    if (typeof Register === 'undefined' || !Register.fachzeichen) return '';
    const art = Schaltplan.artVon(planArt);
    const alleGruppen = Register.fachzeichen.gruppen() as Array<[string, string, string]>;
    const sortiert = [
      ...art.gruppen.map(g => alleGruppen.find(x => x[0] === g)).filter(Boolean),
      ...alleGruppen.filter(x => !art.gruppen.includes(x[0]))
    ] as Array<[string, string, string]>;
    const q = suche.trim().toLocaleLowerCase('de');
    const passt = (z: any): boolean => !q || [z.name, z.id, z.erklaerung, z.kennbuchstabe]
      .some(w => String(w || '').toLocaleLowerCase('de').includes(q));
    const fav = favoriten();
    const letzte = ((typeof Store !== 'undefined')
      ? Store.getMeta('redion:elektro:letzte:v1', []) : []) as unknown;
    const zuletzt = Array.isArray(letzte) ? letzte.filter((id: unknown): id is string => typeof id === 'string').slice(0, 8) : [];
    const schon = new Set<string>();
    const karte = (z: any): string => {
      schon.add(z.id);
      const favorit = fav.includes(z.id);
      return `<div class="sp-zeichenkarte${z.id === aktiv ? ' ist-gewaehlt' : ''}">` +
        `<button type="button" class="sp-sym${favorit ? ' sp-fav' : ''}${z.id === aktiv ? ' an' : ''}" data-sym="${esc(z.id)}" ` +
        `title="${esc(z.name)} — ${esc(z.erklaerung)}" aria-label="${esc(z.name)} platzieren" aria-pressed="${z.id === aktiv}">` +
        `<span class="sp-sym-bild" aria-hidden="true">${Register.fachzeichen.alsSvg(z.id, { strich: 2 })}</span>` +
        `<span class="sp-sym-name">${esc(z.name)}</span>` +
        `<span class="sp-sym-code">${esc(z.kennbuchstabe || z.id)}</span></button>` +
        `<button type="button" class="sp-favorit${favorit ? ' an' : ''}" data-p-fav="${esc(z.id)}" ` +
        `aria-label="${favorit ? 'Favorit entfernen:' : 'Zu Favoriten hinzufügen:'} ${esc(z.name)}" ` +
        `aria-pressed="${favorit}" title="${favorit ? 'Aus Favoriten entfernen' : 'Als Favorit speichern'}">${favorit ? '★' : '☆'}</button></div>`;
    };
    const abschnitt = (name: string, zeichen: any[]): string => zeichen.length ?
      `<section class="sp-zeichenabschnitt"><h4 class="sp-grp">${esc(name)}<span>${zeichen.length}</span></h4>` +
      `<div class="sp-syms">${zeichen.map(karte).join('')}</div></section>` : '';
    const hole = (ids: string[]): any[] => ids.map(id => Register.fachzeichen.holen(id)).filter(Boolean).filter(passt);
    const teile = [] as string[];
    if (filter === 'favoriten') {
      teile.push(abschnitt('★ Meine Favoriten', hole(fav)));
    } else if (filter === 'zuletzt') {
      teile.push(abschnitt('Zuletzt verwendet', hole(zuletzt)));
    } else if (filter !== 'alle') {
      const g = alleGruppen.find(x => x[0] === filter);
      if (g) teile.push(abschnitt(g[2] + ' ' + g[1], (Register.fachzeichen.inGruppe(g[0]) as any[]).filter(passt)));
    } else {
      const favorisiert = hole(fav);
      if (!q && favorisiert.length) teile.push(abschnitt('★ Favoriten', favorisiert));
      const neu = hole(zuletzt).filter(z => !schon.has(z.id));
      if (!q && neu.length) teile.push(abschnitt('Zuletzt verwendet', neu));
      sortiert.forEach(g => {
        const zeichen = (Register.fachzeichen.inGruppe(g[0]) as any[]).filter(passt)
          .filter(z => !schon.has(z.id));
        if (zeichen.length) teile.push(abschnitt(g[2] + ' ' + g[1], zeichen));
      });
    }
    return teile.filter(Boolean).join('') ||
      '<div class="sp-pal-leer"><strong>Keine Schaltzeichen gefunden</strong><p>Suche ändern oder eine andere Kategorie wählen.</p></div>';
  };

  /* ------------------------------------------------------------------------
   * DIE FLÄCHE
   * ----------------------------------------------------------------------*/

  /** Bildschirmpunkt in Plankoordinaten — mit Raster (Punkt 22).
   *
   *  EINE UMRECHNUNG, ÜBER DIE MATRIX DES SVG (E762, wie E686 am Whiteboard).
   *  Bis hier stand der Kasten des SVG geteilt durch die Planbreite — das
   *  stimmt nur, solange die viewBox das ganze Blatt ist. Mit Zoom, Lage und
   *  Vollbild (in dem das Blatt mittig im Kasten steht) nicht mehr. Die
   *  Matrix kennt viewBox, Lage im Kasten und jede Verschiebung; Treffen,
   *  Einrasten und Leitungziehen rechnen damit bei jedem Zoom gleich. */
  const ortAus = (svg: SVGSVGElement, e: { clientX: number; clientY: number }, plan: any,
                  ohneRaster = false): { x: number; y: number } => {
    const m = svg.getScreenCTM();
    let x: number, y: number;
    if (m) {
      const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      x = q.x; y = q.y;
    } else {
      const r = svg.getBoundingClientRect();
      x = (e.clientX - r.left) * plan.breite / (r.width || 1);
      y = (e.clientY - r.top) * plan.hoehe / (r.height || 1);
    }
    return ohneRaster ? { x, y } : { x: Schaltplan.rasten(x), y: Schaltplan.rasten(y) };
  };

  /** Anschlussfang in Bildschirm-Pixeln statt festen Plankoordinaten.
   * Dadurch bleibt die Trefferzone beim Zoomen und auf Retina-Displays
   * ungefähr gleich gross. Bei ungültiger Matrix gilt der alte Radius. */
  const anschlussFangRadius = (svg: SVGSVGElement, pointerType?: string): number => {
    const matrix = svg.getScreenCTM();
    if (!matrix) return 14;
    const scale = Math.hypot(matrix.a, matrix.b);
    if (!Number.isFinite(scale) || scale <= 0) return 14;
    const pixel = pointerType === 'touch' ? 24 : 12;
    return Math.min(42, Math.max(3, pixel / scale));
  };

  /* Der Radierer gehört dem Menschen, nicht dem Plan — wie die Favoriten
     (oben) und wie der Radierer im PDF (`zeichnen:radierer`, E352/E576). */
  const RADIERER = 'elektro:radierer';
  const RADIER_GROESSEN: Array<[number, string]> = [[8, 'klein'], [16, 'mittel'], [28, 'gross']];
  const radiererLesen = (): { modus: 'alles' | 'leiter'; groesse: number } => {
    const roh = (typeof Store !== 'undefined') ? Store.getMeta(RADIERER, null) : null;
    const modus = roh && roh.modus === 'leiter' ? 'leiter' : 'alles';
    const g = roh ? Number(roh.groesse) : 16;
    return { modus, groesse: RADIER_GROESSEN.some(x => x[0] === g) ? g : 16 };
  };

  /**
   * Die interaktive Fläche für einen Block.
   *
   * Gibt das fertige Element zurück. Alles, was der Editor davon wissen muss,
   * ist: hier reinstecken, fertig.
   */
  const zeichne = (block: any): HTMLElement => {
    const wurzel = document.createElement('div');
    wurzel.className = 'sp-wrap';

    let batterieOffen = !!(block && block.plan && block.plan.batterieUebung);

    /* Die Relais-Werkstatt (E769): offen, wenn der Plan aus einer alten Relais-

       Datei stammt; ihr Code kommt erst beim ersten Öffnen (`relaisLaden`). */

    let relaisOffen = !!(block && block.plan && block.plan.relaisLegacy);

    let relais: { aktualisiere: () => void } | null = null;
    let batterie: { aktualisiere: () => void; stromAn: () => boolean;
      stromSetzen: (an: boolean) => void; ausZeichnung: () => boolean } | null = null;
    let studioOffen = false; /* das Studio ersetzt die Palette, es verdoppelt sie nicht */
    let paletteOffen = false; // Die Zeichenfläche erhält beim Öffnen die volle Breite
    let paletteGruppe = 'alle';
    let paletteSuche = '';
    let paletteKompakt = window.matchMedia('(max-width: 850px)').matches;
    let merkwahl: { werkzeug: Werkzeug; zeichen: string } | null = null;
    let planFokus = false;
    let studioTab: 'einsetzen' | 'eigenschaften' | 'status' = 'eigenschaften';
    let studioSuchtext = '';
    let studioGruppe = 'alle';
    let studioLetzte: string[] = [];
    let pruefungOffen = false;
    let pruefAnsicht: 'diagnose' | 'bauteile' | 'netze' = 'diagnose';
    let pruefSuche = '';
    /* Reine Ansichts-/Simulationswerte, nie Bestandteil von block.plan. */
    let laborTempo = 1;
    /** Die schnelle Eigenschaftenkarte ist eine Ansichts-Funktion, keine Plan-Datenbank. */
    let karteId = '';
    let teilKlickStart: {id: string; x: number; y: number; schicht: boolean} | null = null;
    const z: Zustand = {
      block,
      plan: Schaltplan.lesen(block),
      werkzeug: 'zeigen',
      auswahl: new Set<string>(),
      gewaehltesZeichen: '',
      zieht: null,
      verlauf: GfxHistory.erstelle(60),
      zeigeAnschluesse: true,
      zeigeNummern: false,
      zeigeRaster: true,
      ansicht: { zoom: 1, x: 0, y: 0 },
      voll: false,
      radierModus: radiererLesen().modus,
      radierGroesse: radiererLesen().groesse,
      schieneArt: 'L1',
      leertaste: false,
      simulation: false,
      stellungen: {},
      spulenStand: {},
      ergebnis: null
    };

    /* --- Speichern, zeichnen, merken — in dieser Reihenfolge -------------- */
    const abzug = (): string => JSON.stringify(z.plan);

    const aendere = (was: () => void, merken = true, vorherAbzug?: string): void => {
      /* WÄHREND EINES ZUGS ÄNDERT NUR DER ZUG DEN PLAN (E746, zweite
         Durchsicht). Die Bilder eines Zugs rechnen nur die billigen Wege,
         und die zapfen an manchen Lagen an. Was hier während eines Zugs
         durchging — „r", „h", Entf, eine Pfeiltaste, ein Knopf —, nahm
         dieses Zwischenbild als Stand von vorher, speicherte es und merkte
         es als Rückgängig-Schritt: zweimal „h" mit der Maus unten, und das
         zweite Strg+Z brachte {E1:X2 F1:N F1:N2 G2:N} zurück, ohne ein Wort
         (test611 §13). Deshalb tut `aendere` während eines Zugs nichts; der
         Zug selbst speichert beim Loslassen, nachdem `zugEnde` ihn beendet
         hat — mit der vollen Suche. Escape bricht ihn ab. */
      if (z.zieht) return;
      /* `vorherAbzug`: ein Zug, der den Plan unterwegs schon geändert hat
         (Strecke, Radierer — E762), gibt den Stand beim Anfassen mit. Sonst
         merkte der Verlauf das Ende des Zugs als „vorher", und Strg+Z täte
         nichts. */
      const vorher = merken ? (vorherAbzug ?? abzug()) : '';
      was();
      if (z.plan.relaisLegacy && vorher &&
          JSON.stringify({teile:z.plan.teile, leitungen:z.plan.leitungen, texte:z.plan.texte}) !==
          JSON.stringify((() => { const p=JSON.parse(vorher); return {
            teile:p.teile, leitungen:p.leitungen, texte:p.texte }; })()))
        z.plan.relaisLegacy.bearbeitet = true;
      /* EINE KOPIE IN DIE ABLAGE, NICHT DEN PLAN DER FLÄCHE. `updateBlock`
         übernimmt, was es bekommt, als Verweis: bis zur zweiten Durchsicht
         war der Plan in der Ablage danach DASSELBE Objekt wie `z.plan`, und
         jede Bewegung eines Zugs schrieb ihr Zwischenbild mitten in die
         Ablage — gemessen: T1 gedreht, gleich danach F1 gezogen, und die
         nächste Schreibpause legte das angezapfte Zwischenbild in die
         IndexedDB, ohne dass jemand eine Taste drückte. Dasselbe sah jeder,
         der die Ablage las: Sicherung, Duplizieren, ein anderes Fenster. */
      const kopie = JSON.parse(abzug());
      if (typeof Store !== 'undefined' && block && block.id)
        Store.updateBlock(block.id, { plan: kopie });
      else if (block) block.plan = kopie;
      if (merken) z.verlauf.merken(vorher);
      male();
    };

    /* Rückgängig und Wiederholen legen den jetzigen Stand auf den anderen
       Stapel, BEVOR `aendere` gefragt wird — mitten in einem Zug wäre das
       das Zwischenbild (Strg+Z im Zug, und Umschalt+Strg+Z holte es
       zurück). Also auch hier: nicht während eines Zugs. */
    const zurueck = (): void => {
      if (z.zieht) return;
      const vorher = z.verlauf.zurueck(abzug());
      if (vorher === null) return;
      z.plan = JSON.parse(vorher);
      aendere(() => {}, false);
    };
    const vorwaerts = (): void => {
      if (z.zieht) return;
      const naechster = z.verlauf.vor(abzug());
      if (naechster === null) return;
      z.plan = JSON.parse(naechster);
      aendere(() => {}, false);
    };

    /* --- Aufbau ---------------------------------------------------------- */
    const kopf = document.createElement('div');
    kopf.className = 'sp-kopf';
    const labor = document.createElement('section');
    labor.className = 'sp-live-labor';
    labor.setAttribute('aria-label', 'Live-Stromlabor – Strom, Relais und Zeit');
    labor.hidden = true;
    const batteriePanel = document.createElement('section');
    batteriePanel.className = 'sp-batterie-fach';
    batteriePanel.setAttribute('aria-label', 'Batterieanlagen und Übungen');
    batteriePanel.hidden = !batterieOffen;
    const relaisPanel = document.createElement('section');
    relaisPanel.className = 'sp-batterie-fach sp-relais-fach';
    relaisPanel.setAttribute('aria-label', 'Relais-Werkstatt und Import');
    relaisPanel.hidden = !relaisOffen;
    const pruefPanel = document.createElement('section');
    pruefPanel.className = 'sp-pruef-fach sp-batterie-fach';
    pruefPanel.setAttribute('aria-label', 'Schaltplan-Prüfzentrum und Stückliste');
    pruefPanel.hidden = true;
    const studioPanel = document.createElement('aside');
    studioPanel.className = 'sp-studio';
    studioPanel.setAttribute('aria-label', 'Elektro Studio – Bauteile, Eigenschaften und Übersicht');
    studioPanel.hidden = !studioOffen;
    const palette = document.createElement('div');
    palette.className = 'sp-palette';
    const buehne = document.createElement('div');
    buehne.className = 'sp-buehne';
    const fuss = document.createElement('div');
    fuss.className = 'sp-fuss';

    /* Die Zeichnung steht in der Leinwand, die Zoomknöpfe im Fuss (E762):
       `buehneMalen` ersetzt nur die Leinwand, `fussMalen` nur den Inhalt
       neben den Knöpfen — die Knöpfe bleiben. Sie liegen NICHT über der
       Fläche: dort deckten sie die rechte obere Ecke des Plans zu (gemessen:
       der Rahmen um H1 in test611 §14 fing auf dem Zoom an, §37 „Die
       Werkzeugleiste darf nicht verdecken, was sie bedient"). */
    const leinwand = document.createElement('div');
    leinwand.className = 'sp-leinwand';
    buehne.appendChild(leinwand);
    const schnellkarte = document.createElement('aside');
    schnellkarte.className = 'sp-schnellkarte';
    schnellkarte.setAttribute('aria-label', 'Bauteil direkt bearbeiten');
    schnellkarte.hidden = true;
    buehne.appendChild(schnellkarte);
    /* Die Kontextleiste bleibt ausserhalb der ersetzten SVG-Leinwand.
     * Aktionen verwenden dieselben vorhandenen aendere-/Undo-Funktionen wie der
     * Fuss. Sie ist kein zweiter Editor und speichert keinen zusätzlichen Zustand. */
    const kontextleiste = document.createElement('div');
    kontextleiste.className = 'sp-kontextleiste';
    kontextleiste.setAttribute('role', 'toolbar');
    kontextleiste.setAttribute('aria-label', 'Ausgewählte Bauteile bearbeiten');
    kontextleiste.hidden = true;
    buehne.appendChild(kontextleiste);
    const zoomleiste = document.createElement('div');
    zoomleiste.className = 'sp-zoom';
    zoomleiste.setAttribute('role', 'group');
    zoomleiste.setAttribute('aria-label', 'Zoom');
    zoomleiste.innerHTML =
      `<button type="button" data-a="zoom-minus" title="Verkleinern (−)" aria-label="Verkleinern">−</button>` +
      `<span class="sp-zoomwert" aria-live="polite">100 %</span>` +
      `<button type="button" data-a="zoom-plus" title="Vergrössern (+)" aria-label="Vergrössern">+</button>` +
      `<button type="button" data-a="zoom-alles" title="Alles zeigen (0)" aria-label="Alles zeigen">⤢</button>`;

    const koerper = document.createElement('div');
    koerper.className = 'sp-koerper';
    koerper.appendChild(palette);
    koerper.appendChild(buehne);
    koerper.appendChild(studioPanel);
    const fussInhalt = document.createElement('div');
    fussInhalt.className = 'sp-fuss-inhalt';
    fuss.appendChild(fussInhalt);
    fuss.appendChild(zoomleiste);
    wurzel.appendChild(kopf);
    wurzel.appendChild(labor);
    // Die Zeichenfläche ist das Hauptwerkzeug. Übungs- und Prüffächer
    // bleiben echte Redion-Module, verdrängen aber nicht mehr den Plan.
    wurzel.appendChild(koerper);
    wurzel.appendChild(fuss);
    wurzel.appendChild(batteriePanel);
    wurzel.appendChild(relaisPanel);
    wurzel.appendChild(pruefPanel);
    const fachSchliessen = document.createElement('button');
    fachSchliessen.type = 'button';
    fachSchliessen.className = 'sp-fach-schliessen';
    fachSchliessen.textContent = '✕ Schliessen';
    fachSchliessen.setAttribute('aria-label', 'Elektro-Zusatzfach schliessen');
    fachSchliessen.hidden = true;
    wurzel.appendChild(fachSchliessen);
    fachSchliessen.addEventListener('click', () => {
      batterieOffen = false; relaisOffen = false; pruefungOffen = false;
      batteriePanel.hidden = true; relaisPanel.hidden = true; pruefPanel.hidden = true;
      kopfMalen();
      wurzel.querySelector<HTMLElement>('.sp-buehne')?.focus({ preventScroll: true });
    });
    const fachStatus = (): void => {
      fachSchliessen.hidden = !(batterieOffen || relaisOffen || pruefungOffen);
      wurzel.classList.toggle('sp-fach-offen', !fachSchliessen.hidden);
    };

    /* --- Der Kopf: Planart, Werkzeuge, Ansicht --------------------------- */
    const kopfMalen = (): void => {
      const art = Schaltplan.artVon(z.plan.art);
      fachStatus();
      kopf.innerHTML =
        `<select class="sp-art" aria-label="Planart">` +
        (Schaltplan.ARTEN as any[]).map(a =>
          `<option value="${esc(a.id)}"${a.id === z.plan.art ? ' selected' : ''}>` +
          `${esc(a.name)}</option>`).join('') + '</select>' +
        `<span class="sp-arterkl">${esc(art.erklaerung)}</span>` +
        `<span class="sp-werkzeuge">` +
        ([['zeigen', '↖', 'Auswählen und verschieben'],
          ['leitung', '⌐', 'Leitung ziehen'],
          ['text', 'T', 'Beschriftung setzen'],
          /* E762: L1, L2, L3, N und PE selbst zeichnen. */
          ['schiene', '☰', 'Schiene zeichnen — L1, L2, L3, N, PE'],
          ['radieren', '⌫', 'Radieren — über die Fläche wischen']] as Array<[Werkzeug, string, string]>).map(([id, ic, t]) =>
          `<button class="sp-wz${z.werkzeug === id ? ' an' : ''}" data-wz="${id}" ` +
          `title="${esc(t)}" aria-label="${esc(t)}" aria-pressed="${z.werkzeug === id}">${ic}</button>`).join('') +
        `<span class="sp-dock-trenner" aria-hidden="true"></span>` +
        `<button type="button" class="sp-palette-knopf${paletteOffen ? ' an' : ''}" data-a="palette-toggle" aria-label="Bauteilpalette öffnen oder schliessen" aria-expanded="${paletteOffen}" title="Bauteile ausklappen und direkt auf die Zeichnung ziehen">▦ <span>Bauteile</span></button>` +
        `<button type="button" class="sp-dock-fit" data-a="zoom-alles" title="Gesamten Schaltplan anzeigen (0)" aria-label="Gesamten Schaltplan anzeigen">⤢</button>` +
        `</span>` +
        `<span class="sp-rechts">` +
        /* Nur im Stromlaufplan: im Installationsplan (Grundriss) gibt es
           keine Sammelschienen. */
        (z.plan.art.startsWith('stromlauf')
          ? `<button class="sp-netz" data-a="netz" ` +
            `title="Netz (L1 und N mit Quelle) oder eine fertige Beispielschaltung einfügen — bereit zum Simulieren" ` +
            `aria-label="Netz oder Beispielschaltung einfügen">⚡ Schaltung</button>`
          : '') +
        `<button type="button" class="sp-netz sp-bereiche" data-a="bereiche" title="Relais, Batterien, Prüfzentrum, Studio, Formelheft und Vorlagen öffnen" aria-haspopup="menu">✦ Bereiche ▾</button>` +
        /* EIN UND AUS (E773): wieder der Knopf „▶ Strom" / „◼ Strom", wie vor
           E772. Redur am 2. November 2026: „Für ein-aus sollte wie früher
           sein, damals war besser." Hebel und Glühfaden setzt motion.ts
           (E535) an `.sp-start`; der Text bleibt echter Text. Was E772 dazu
           gebracht hat, bleibt: ein ungeprüfter Relais-Import sperrt den
           Strom und sagt im Titel, warum; eingeschaltet geht das Labor auf. */
        `<button type="button" class="sp-start${z.simulation || (z.plan.batterieUebung && batterie?.stromAn()) ? ' an' : ''}${z.plan.relaisLegacy && !z.plan.relaisLegacy.verifiziert ? ' sp-strom-ungeprueft' : ''}" ` +
        `data-a="simulation" ` +
        `title="${z.plan.batterieUebung ? (batterie?.stromAn() ? 'Batteriestrom ausschalten' : 'Batterieschaltung einschalten und U, R, I messen') :
          z.plan.relaisLegacy && !z.plan.relaisLegacy.verifiziert ?
          'Original-Verdrahtung ungeprüft: in der Relais-Werkstatt zuerst prüfen und freigeben.' :
          z.simulation ? 'Simulation anhalten' : 'Strom fliessen lassen'}" ` +
        `aria-pressed="${!!(z.simulation || (z.plan.batterieUebung && batterie?.stromAn()))}" ` +
        `aria-label="${z.simulation || (z.plan.batterieUebung && batterie?.stromAn()) ? 'Strom ausschalten' : 'Strom einschalten'}">` +
        `${z.simulation || (z.plan.batterieUebung && batterie?.stromAn()) ? '◼' : '▶'} Strom</button>` +
        `<button data-a="zurueck" title="Rückgängig" aria-label="Rückgängig"${z.verlauf.kannZurueck() ? '' : ' disabled'}>↶</button>` +
        `<button data-a="vorwaerts" title="Wiederholen" aria-label="Wiederholen"${z.verlauf.kannVor() ? '' : ' disabled'}>↷</button>` +
        `<button data-a="mehr" title="Mehr" aria-label="Mehr">…</button>` +
        /* Vollbild (E762): im Vollbild steht an derselben Stelle ein
           Schliessknopf mit 44 px, auch am Rechner — er ist der sichtbare
           Rückweg neben Escape. */
        (z.voll
          ? `<button class="sp-vollzu" data-a="vollbild-zu" title="Vollbild beenden (Esc)" aria-label="Vollbild beenden">✕</button>`
          : `<button data-a="vollbild" title="Vollbild (F)" aria-label="Vollbild">⛶</button>`) +
        `</span>`;
    };

    /* --- Der Fuss: Ebenen und Auswahl ------------------------------------ */
    /**
     * Was die Simulation zu sagen hat. Ein Fehler steht allein — wenn nichts
     * gerechnet werden konnte, sind Warnungen darunter nur Lärm. Sonst
     * kommen zuerst die Warnungen (die kann man beheben) und dann die
     * Annahmen (die muss man nur wissen).
     */
    const meldungHtml = (): string => {
      const e = z.ergebnis;
      if (!e) return '';
      if (!e.ok) return `<span class="sp-meldung fehler">⚠ ${esc(e.fehler)}</span>`;
      const teile: string[] = [];
      (e.warnungen || []).slice(0, 3).forEach((x: string) =>
        teile.push(`<span class="sp-meldung warnung">⚠ ${esc(x)}</span>`));
      if ((e.warnungen || []).length > 3)
        teile.push(`<span class="sp-meldung warnung">… und ${e.warnungen.length - 3} weitere</span>`);
      if (!teile.length && (e.annahmen || []).length)
        teile.push(`<span class="sp-meldung annahme" title="${esc((e.annahmen as string[]).join(' '))}">` +
          `ⓘ ${e.annahmen.length} Annahme${e.annahmen.length === 1 ? '' : 'n'} — antippen für den Wortlaut</span>`);
      if (!teile.length) teile.push(`<span class="sp-meldung gut">✓ Die Schaltung rechnet.</span>`);
      return teile.join('');
    };

    /* Das Live-Stromlabor (E772) zeigt ausschliesslich Werte aus der
     * vorhandenen Stromfluss-Rechnung. Es rechnet nichts neu und speichert
     * nichts im Plan. Seine Uhr ist die Uhr der Zeitrelais (E768): sie zählt
     * nur, wenn der Plan ein Zeitrelais hat — ohne läuft kein Takt (E528,
     * test630 §3), und die Uhr zeigt „—". */
    const laborZeit = (): string => zeitspulen().length
      ? (zeitStand.laufzeit / 1000).toFixed(1) + ' s' : '—';
    const laborAktualisieren = (): void => {
      if (!z.simulation) return;
      const daten = Labor.statistik(z.plan, z.ergebnis, z.spulenStand);
      const anzeige = labor.querySelector<HTMLElement>('[data-labor-status]');
      if (anzeige) anzeige.textContent = daten.gueltig
        ? `${daten.lampen} Lampen · ${daten.relais} Relais · ${daten.leitungen} durchflossene Leitungen`
        : 'Noch kein gültiger Stromkreis';
      const strom = labor.querySelector<HTMLElement>('[data-labor-strom]');
      if (strom) strom.textContent = daten.gueltig ? stromText(daten.strom) : '—';
      const uhr = labor.querySelector<HTMLElement>('[data-labor-uhr]');
      if (uhr) uhr.textContent = laborZeit();
      const zeiten = Labor.zeitAnzeigen(z.plan, zeitStand.relais, z.spulenStand);
      zeiten.slice(0, 8).forEach(zeit => {
        const element = labor.querySelector<HTMLElement>(`[data-labor-zeitid="${CSS.escape(zeit.id)}"]`);
        if (!element) return;
        const bar = element.querySelector<HTMLElement>('[data-labor-balken]');
        if (bar) bar.style.width = Math.round(zeit.fortschritt * 100) + '%';
        const phase = element.querySelector<HTMLElement>('[data-labor-phase]');
        if (phase) phase.textContent = `${zeit.phase} · ${Math.max(0, zeit.rest / 1000).toFixed(1)} s`;
        element.classList.toggle('sp-labor-zeitaktiv', zeit.aktiv);
      });
    };
    const laborMalen = (): void => {
      labor.hidden = !z.simulation;
      wurzel.classList.toggle('sp-labor-pause', !!(z.simulation && zeitStand.pause));
      wurzel.style.setProperty('--sp-labor-tempo', String(laborTempo));
      if (!z.simulation) { labor.replaceChildren(); return; }
      const pausiert = zeitStand.pause;
      const zeiten = Labor.zeitAnzeigen(z.plan, zeitStand.relais, z.spulenStand);
      labor.innerHTML = `<div class="sp-labor-kopf">` +
        `<span class="sp-labor-zeichen" aria-hidden="true">⚡</span>` +
        `<strong>Live-Stromlabor</strong>` +
        `<span class="sp-labor-lauf"${pausiert ? ' data-pause="true"' : ''}>${pausiert ? '⏸ Pausiert' : '● Aktiv'}</span>` +
        `<span class="sp-labor-mess" data-labor-status></span>` +
        `<span class="sp-labor-mess">I<sub>max</sub> <b data-labor-strom>—</b></span>` +
        `<span class="sp-labor-uhr" title="Simulationszeit — sie läuft, sobald der Plan ein Zeitrelais hat" data-labor-uhr>—</span>` +
        `<label class="sp-labor-tempo">Tempo <select data-labor-tempo aria-label="Simulationsgeschwindigkeit">` +
        [0.25,0.5,1,2,4].map(t => `<option value="${t}"${t === laborTempo ? ' selected' : ''}>${t}×</option>`).join('') +
        `</select></label>` +
        `<button type="button" class="sp-labor-aktion" data-labor-aktion="pause" aria-pressed="${pausiert}" title="Simulation pausieren oder fortsetzen">${pausiert ? '▶ Weiter' : '⏸ Pause'}</button>` +
        `<button type="button" class="sp-labor-aktion" data-labor-aktion="reset" title="Simulationsuhr, Schalter und Relais zurücksetzen">↺ Reset</button>` +
        `</div>` +
        (zeiten.length ? `<div class="sp-labor-zeitliste" aria-label="Zeitrelais-Fortschritt">` +
          zeiten.slice(0,8).map(u =>
            `<div class="sp-labor-zeit" data-labor-zeitid="${esc(u.id)}">` +
              `<strong>${esc(u.bmk)}</strong><small>${esc(u.art)} · ${Math.round(u.gesamt)/1000} s</small>` +
              `<span class="sp-labor-balken"><i data-labor-balken></i></span>` +
              `<span data-labor-phase></span></div>`).join('') +
          (zeiten.length > 8 ? `<small>+${zeiten.length-8} weitere Zeitrelais</small>` : '') +
          `</div>` : '');
      laborAktualisieren();
    };
    labor.addEventListener('change', event => {
      const ziel = event.target as HTMLSelectElement;
      if (!ziel.matches('[data-labor-tempo]')) return;
      laborTempo = Labor.tempo(ziel.value);
      zeitLetzter = performance.now();
      wurzel.style.setProperty('--sp-labor-tempo', String(laborTempo));
    });
    labor.addEventListener('click', event => {
      const knopf = (event.target as Element).closest<HTMLElement>('[data-labor-aktion]');
      if (!knopf || !z.simulation) return;
      if (knopf.dataset.laborAktion === 'pause') {
        zeitStand.pause = !zeitStand.pause;
        zeitLetzter = performance.now();
      } else if (knopf.dataset.laborAktion === 'reset') {
        z.stellungen = {}; z.spulenStand = {};
        zeitStarten();
        male(); return;
      }
      laborMalen();
    });

    const fussMalen = (): void => {
      if (z.simulation) {
        const e = z.ergebnis;
        const leuchtet = e && e.ok
          ? Object.keys(e.werte).filter(k => (e.werte[k].helligkeit || 0) > 0.01).length : 0;
        fussInhalt.innerHTML =
          `<span class="sp-simzahlen">` +
          (e && e.ok
            ? `${leuchtet} ${leuchtet === 1 ? 'leuchtet' : 'leuchten'} · ` +
              `grösster Strom ${esc(stromText(e.maxStrom))}` +
              (e.durchgaenge > 1 ? ` · ${e.durchgaenge} Durchgänge` : '')
            : 'Noch kein gültiger Stromkreis') + `</span>` +
          `<span class="sp-sim-status ${e && e.ok && e.maxStrom > 0.000001 ? 'fliesst' : 'offen'}" role="status">` +
          (e && e.ok && e.maxStrom > 0.000001 ? '● Strom fließt' : '○ Kein Stromfluss – Quelle, Leitungen und Schalter prüfen') + `</span>` +
          `<button type="button" class="sp-sim-back" data-a="zurueck-zeichnen" title="Simulation stoppen und zum Zeichnen zurückkehren">✎ Weiterzeichnen</button>` +
          meldungHtml() +
          `<span class="sp-simhinweis">Auf einen Schalter tippen zum Schalten` +
          `<button data-a="ruhelage" title="Alle Schalter in die Ruhelage">Ruhelage</button></span>`;
        return;
      }
      const gewaehlt = z.auswahl.size;
      /* Das Werkzeug bringt seine Wahl mit (E762): der Radierer seine Art
         und Grösse wie im PDF, die Schiene ihren Leiter. */
      const knopfAn = (an: boolean): string => ` aria-pressed="${an}"${an ? ' class="an"' : ''}`;
      const werkzeugWahl = z.werkzeug === 'radieren'
        ? `<span class="sp-wahl" role="group" aria-label="Radierer">` +
          `<button type="button" data-radiermodus="alles"${knopfAn(z.radierModus === 'alles')} title="Radiert, was der Kreis berührt: Leitungen, Teile, Texte">Alles</button>` +
          `<button type="button" data-radiermodus="leiter"${knopfAn(z.radierModus === 'leiter')} title="Radiert nur Leitungen — kein Teil">Nur Leiter</button>` +
          RADIER_GROESSEN.map(([g, name]) =>
            `<button type="button" class="sp-radiergroesse" data-radiergroesse="${g}"${knopfAn(z.radierGroesse === g)} ` +
            `title="Radierer ${name}" aria-label="Radierer ${name}" style="--kreis:${Math.round(g * 0.7 + 4)}px"><i aria-hidden="true"></i></button>`).join('') +
          `</span><span class="sp-hinweis">Über die Fläche wischen — mit Maus, Finger oder Stift. Ein Tipp radiert eine Leitung.</span>`
        : z.werkzeug === 'schiene'
          ? `<span class="sp-wahl" role="group" aria-label="Schiene">` +
            (Schaltplan.SCHIENEN as string[]).map(k =>
              `<button type="button" data-schiene="${k}"${knopfAn(z.schieneArt === k)}>${k}</button>`).join('') +
            `</span><span class="sp-hinweis">Ziehen, um ${esc(z.schieneArt)} als gerade Schiene zu zeichnen — Teile hängen daran wie am Netz.</span>`
          : '';
      fussInhalt.innerHTML = werkzeugWahl ? werkzeugWahl +
        `<span class="sp-zahlen">${z.plan.teile.length} Teile · ${z.plan.leitungen.length} Leitungen</span>` :
        `<span class="sp-ebenen">` + (z.plan.ebenen as any[]).map(e =>
          `<button class="sp-ebene${e.sichtbar ? ' an' : ''}" data-ebene="${esc(e.id)}" ` +
          `title="${e.sichtbar ? 'Ausblenden' : 'Einblenden'}: ${esc(e.name)}">` +
          `<i style="background:${esc(e.farbe)}"></i>${esc(e.name)}</button>`).join('') + '</span>' +
        (gewaehlt
          ? `<span class="sp-auswahl">${gewaehlt} gewählt` +
            `<button data-a="drehen" title="Drehen (R)">↻</button>` +
            `<button data-a="spiegeln" title="Spiegeln (H)">⇄</button>` +
            `<button data-a="doppeln" title="Duplizieren (Strg D)">⧉</button>` +
            `<button data-a="gruppieren" title="Gruppieren (Strg G)">⬚</button>` +
            `<button data-a="loeschen" title="Löschen (Entf)">✕</button></span>`
          : `<span class="sp-hinweis">${esc(z.gewaehltesZeichen
              ? 'Auf die Fläche tippen, um „' +
                (Register.fachzeichen.holen(z.gewaehltesZeichen) || { name: '?' }).name + '" zu setzen'
              : 'Bauteil mit Maus, Finger oder Stift direkt aus der Palette ziehen')}</span>`) +
        `<span class="sp-zahlen">${z.plan.teile.length} Teile · ${z.plan.leitungen.length} Leitungen</span>` +
        `<span class="sp-quick-help">B: Palette · /: Suche · P: Stromtest · 1–5: Werkzeuge</span>`;
    };

    const paletteInfokarte = (id = z.gewaehltesZeichen): void => {
      const kasten = palette.querySelector<HTMLElement>('.sp-pal-inspektor');
      if (!kasten) return;
      const sym = id ? Register.fachzeichen.holen(id) : null;
      if (!sym) {
        kasten.innerHTML = '<span class="sp-pal-info-icon" aria-hidden="true">⌁</span>' +
          '<div><strong>Ein Zeichen auswählen</strong><small>Antippen zum Platzieren oder auf den Plan ziehen.</small></div>';
        return;
      }
      const pins = (sym.anschluesse || []).map((a: any) => a.nr).join(' · ');
      kasten.innerHTML = `<span class="sp-pal-info-icon" aria-hidden="true">${Register.fachzeichen.alsSvg(sym.id, {strich: 2})}</span>` +
        `<div><strong>${esc(sym.name)}</strong><small>${esc(sym.erklaerung)}</small>` +
        (pins ? `<span class="sp-pal-klemmen">Anschlüsse: ${esc(pins)}</span>` : '') + '</div>';
    };
    const paletteTrefferMalen = (): void => {
      const liste = palette.querySelector<HTMLElement>('.sp-liste');
      if (!liste) return;
      liste.innerHTML = paletteHtml(z.plan.art, paletteSuche, paletteGruppe, z.gewaehltesZeichen);
      const n = liste.querySelectorAll('[data-sym]').length;
      const counter = palette.querySelector<HTMLElement>('.sp-pal-count');
      if (counter) counter.textContent = `${n} Schaltzeichen`;
      paletteInfokarte();
    };
    const paletteMalen = (suche = paletteSuche): void => {
      paletteSuche = suche;
      const gruppen = Register.fachzeichen.gruppen() as Array<[string, string, string]>;
      const filter = ([['alle', 'Alle', ''], ['favoriten', 'Favoriten', '★'], ['zuletzt', 'Zuletzt', '◷']] as Array<[string,string,string]>)
        .concat(gruppen.map(g => [g[0], g[1], g[2]] as [string,string,string]));
      palette.innerHTML =
        '<div class="sp-pal-kopf"><div><span class="sp-pal-eyebrow">ELEKTRO • BIBLIOTHEK</span>' +
        '<h3>Schaltzeichen <span class="sp-pal-kopf-punkt" aria-hidden="true">✦</span></h3>' +
        '<p>Finden. Anfassen. Platzieren.</p></div>' +
        '<div class="sp-pal-header-actions"><button type="button" data-p-compact aria-pressed="' + String(paletteKompakt) + '" aria-label="Kompakte Schaltzeichenpalette umschalten" title="Kompakte Ansicht umschalten">' + (paletteKompakt ? '▣ Groß' : '▤ Klein') + '</button>' +
        '<button type="button" data-p-close class="sp-pal-schliessen" aria-label="Schaltzeichen-Bibliothek schliessen" title="Schliessen">×</button></div></div>' +
        `<label class="sp-suche"><span class="sp-suche-titel">Symbol finden</span>` +
        `<input type="search" placeholder="z. B. Schliesser, Relais, Lampe …" ` +
        `value="${esc(suche)}" aria-label="Schaltzeichen suchen" autocomplete="off" spellcheck="false"></label>` +
        `<div class="sp-pal-filter" role="group" aria-label="Schaltzeichen-Kategorien">` +
        filter.map(([id, name, icon]) => `<button type="button" data-p-filter="${esc(id)}" ` +
          `class="sp-pal-chip${paletteGruppe === id ? ' an' : ''}" aria-pressed="${paletteGruppe === id}" ` +
          `title="${esc(name)}">${icon ? `<span aria-hidden="true">${esc(icon)}</span>` : ''}${esc(name)}</button>`).join('') +
        `</div><div class="sp-pal-ergebnis"><span class="sp-pal-count" role="status" aria-live="polite"></span>` +
        '<span>★ Favorit speichern</span></div>' +
        '<div class="sp-liste" aria-label="Schaltzeichen und Gruppen"></div>' +
        '<div class="sp-pal-inspektor" aria-label="Information zum Schaltzeichen"></div>';
      palette.classList.toggle('sp-pal-kompakt', paletteKompakt);
      paletteTrefferMalen();
    };

    /* --- Die Simulation rechnen (Punkte 13, 14, 30) ----------------------
     * Einmal je Zeichnung, und nur wenn sie läuft. Das Ergebnis wandert in
     * `z.ergebnis` und von dort in die Zeichnung UND in die Meldezeile —
     * zwei Anzeigen aus einer Rechnung. Zwei Rechnungen würden irgendwann
     * verschiedene Dinge behaupten.
     * --------------------------------------------------------------------- */
    /* --- Zeitrelais mit echter Zeit (E768, aus Redurs ZIP) ----------------
     * Eine anzugsverzögerte Spule schliesst ihre Kontakte erst, wenn sie T
     * Sekunden ununterbrochen Spannung hatte; eine abfallverzögerte hält sie
     * T Sekunden nach dem Abschalten noch. Die Zeit zählt NUR, solange die
     * Simulation läuft und der Plan eine Zeitspule hat (E528: keine Schleife
     * im Leerlauf) — ein Takt von 100 ms, kein Neuzeichnen je Bild, und ein
     * Schritt höchstens 250 ms (ein Hintergrund-Tab springt nicht um
     * Minuten). Der Zustand lebt nur hier, nie in `block.plan`.
     * --------------------------------------------------------------------- */
    type ZeitStand = { relais: Record<string, ZeitEintrag>;
                       ausgaenge: Record<string, boolean>;
                       /* E772: die Uhr des Labors und seine Pause */
                       laufzeit: number; pause: boolean };
    const ZEITSPULEN = new Set(['spule-anzugsverzoegert', 'spule-abfallverzoegert']);
    const zeitspulen = (): any[] => (z.plan.teile as any[]).filter(t => ZEITSPULEN.has(t.zeichen) && t.bmk);
    let zeitStand: ZeitStand = { relais: {}, ausgaenge: {}, laufzeit: 0, pause: false };
    let zeitTakt: ReturnType<typeof setInterval> | null = null;
    let zeitLetzter = 0;
    /** Ein Schritt um `deltaMs`; true, wenn ein Zeitausgang umgeschaltet hat. */
    const zeitSchritt = (spulen: Record<string, boolean>, deltaMs: number): boolean => {
      let anders = false;
      zeitspulen().forEach(t => {
        const T = Number.isFinite(t.werte?.T) ? Number(t.werte.T) : 3;
        const dauer = Math.max(0, Math.min(3600, T)) * 1000;
        const an = !!spulen[t.bmk];
        const r = zeitStand.relais[t.bmk] ?? { zeit: 0, ausgang: false };
        if (t.zeichen === 'spule-anzugsverzoegert') {
          r.zeit = an ? Math.min(dauer, r.zeit + deltaMs) : 0;
          r.ausgang = an && r.zeit >= dauer;
        } else if (an) { r.zeit = dauer; r.ausgang = true; }
        else { r.zeit = Math.max(0, r.zeit - deltaMs); r.ausgang = r.zeit > 0; }
        zeitStand.relais[t.bmk] = r;
        if (zeitStand.ausgaenge[t.bmk] !== r.ausgang) anders = true;
        zeitStand.ausgaenge[t.bmk] = r.ausgang;
      });
      return anders;
    };
    const zeitAnhalten = (): void => { if (zeitTakt) clearInterval(zeitTakt); zeitTakt = null; };
    const zeitTick = (): void => {
      if (!wurzel.isConnected || !z.simulation) { zeitAnhalten(); return; }
      const jetzt = performance.now();
      /* E772: das Tempo des Labors streckt den Schritt (0,25× bis 4×), die
         Pause hält ihn an. Gedeckelt wird VOR dem Strecken. */
      const delta = Math.max(0, Math.min(250, jetzt - zeitLetzter)) * laborTempo;
      zeitLetzter = jetzt;
      if (zeitStand.pause) return;
      zeitStand.laufzeit += delta;
      if (z.ergebnis && z.ergebnis.ok && zeitSchritt(z.ergebnis.spulen, delta)) {
        rechnen(); buehneMalen(); fussMalen();
      }
      laborAktualisieren();
    };
    const zeitStarten = (): void => {
      zeitAnhalten();
      zeitStand = { relais: {}, ausgaenge: {}, laufzeit: 0, pause: false };
      if (!z.simulation || !zeitspulen().length) return;
      zeitLetzter = performance.now();
      zeitTakt = setInterval(zeitTick, 100);
    };

    const rechnen = (): void => {
      if (!z.simulation || typeof Stromfluss === 'undefined') { z.ergebnis = null; return; }
      const mitZeit = zeitspulen().length > 0;
      /* Was ohne Wartezeit umschaltet (abfallverzögert an, anzugsverzögert
         aus), schaltet sofort — höchstens zwei Nachrechnungen. */
      for (let runde = 0; runde < 3; runde++) {
        z.ergebnis = stromRechnung(z.plan, z.stellungen, z.spulenStand,
          mitZeit ? zeitStand.ausgaenge : undefined);
        if (z.ergebnis && z.ergebnis.ok) z.spulenStand = z.ergebnis.spulen;
        if (!mitZeit || !z.ergebnis?.ok || !zeitSchritt(z.ergebnis.spulen, 0)) break;
      }
    };

    const buehneMalen = (): void => {
      const e = z.ergebnis;
      const opt: any = {
        raster: z.zeigeRaster,
        anschluesse: z.simulation ? false : z.zeigeAnschluesse,
        nummern: z.zeigeNummern,
        auswahl: z.simulation ? new Set<string>() : z.auswahl
      };
      /* `strom` wird nur GESETZT, wenn gerechnet wurde — nicht auf undefined.
         Ein gesetztes undefined ist bei `exactOptionalPropertyTypes` etwas
         anderes als ein fehlendes Feld, und der Unterschied ist hier auch
         inhaltlich richtig: „keine Simulation" und „Simulation ohne Ergebnis"
         sollen dasselbe Bild geben. */
      if (e && e.ok) opt.strom = {
        netzStrom: e.netzStrom, leitungNetz: e.leitungNetz,
        werte: e.werte, teilwerte: e.teilwerte, maxStrom: e.maxStrom
      };
      /* `werte` bringt die Richtung schon mit — sie steht an jedem Messwert
         (E731). Hier ist deshalb nichts weiterzureichen ausser dem, was
         ohnehin durchgeht. */
      leinwand.innerHTML = Schaltplan.alsSvg(z.plan, opt);
      ansichtAnwenden();
      buehne.classList.toggle('sp-laeuft', z.simulation);
      if (!z.simulation) return;
      /* Schaltbare Bauteile bekommen den Zeigefinger und eine Ansage, was ein
         Tippen tut. Ohne das ist die Simulation ein Bild: hübsch und ohne
         die eine Frage, die zählt — „was passiert, wenn ich schalte?" */
      /* Zustand wird nur bei einer echten Neuberechnung oder Schalteraktion
       * auf SVG-Gruppen übertragen, nicht 60× pro Sekunde. Die Normsymbole
       * behalten ihre Form; Farbe und Licht stehen zusätzlich am Element. */
      if (e && e.ok) (z.plan.teile as any[]).forEach(t => {
        const grp = buehne.querySelector<SVGGElement>(`g[data-id="${CSS.escape(t.id)}"]`);
        if (!grp) return;
        const spule = /^(spule|spule-anzugsverzoegert|spule-abfallverzoegert)$/.test(t.zeichen);
        const kontakt = /^(schuetz-schliesser|schuetz-oeffner)$/.test(t.zeichen);
        const lampe = /^(lampe|signalleuchte|ch-kontrolllampe)$/.test(t.zeichen);
        if (spule || kontakt) {
          const aktiv = !!z.spulenStand[t.bmk] || !!zeitStand.ausgaenge[t.bmk];
          grp.classList.toggle('sp-labor-relais-an', aktiv);
          grp.classList.toggle('sp-labor-relais-aus', !aktiv);
          grp.setAttribute('data-labor-zustand', aktiv ? 'angezogen' : 'ruhelage');
        }
        if (lampe) {
          const hell = Number(e.werte?.[t.id]?.helligkeit) || 0;
          grp.classList.toggle('sp-labor-lampe-an', hell > 0.01);
          grp.style.setProperty('--sp-labor-hell', String(Math.max(0, Math.min(1, hell))));
        }
      });
      (z.plan.teile as any[]).forEach(t => {
        const { st, vh } = schaltart(t.zeichen);
        if (st.length < 2) return;
        if (vh && vh.folgtSpule) return;          /* die schaltet die Spule */
        const g = buehne.querySelector(`[data-id="${CSS.escape(t.id)}"]`);
        if (!g) return;
        g.classList.add('sp-schaltbar');
        const jetzt = st[Math.max(0, Math.min(st.length - 1, z.stellungen[t.id] || 0))];
        const titel = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        titel.textContent = `${t.bmk || ''} ${jetzt ? jetzt.name : ''} — tippen zum Schalten`.trim();
        g.appendChild(titel);
      });
    };

    const kontextMalen = (): void => {
      /* Die Schnellkarte gehört zur Auswahl: ohne sie geht sie zu (Escape, 1–5). */
      if (karteId && !z.auswahl.has(karteId)) karteSchliessen();
      const ausgewaehlt = [...z.auswahl].filter(id =>
        (z.plan.teile as any[]).some(t => t.id === id) ||
        (z.plan.leitungen as any[]).some(l => l.id === id));
      kontextleiste.hidden = !!z.simulation || !ausgewaehlt.length;
      if (kontextleiste.hidden) { kontextleiste.replaceChildren(); return; }
      const teil = (z.plan.teile as any[]).find(t => t.id === ausgewaehlt[0]);
      const titel = ausgewaehlt.length > 1 ? `${ausgewaehlt.length} ausgewählt` :
        String(teil?.beschriftung || teil?.bmk ||
          (teil ? Register.fachzeichen.holen(teil.zeichen)?.name : 'Leitung') || 'Auswahl');
      kontextleiste.innerHTML =
        `<span class="sp-kontext-titel" title="${esc(titel)}">${esc(titel)}</span>` +
        `<button type="button" data-kontext="eigenschaften" title="Eigenschaften bearbeiten" aria-label="Eigenschaften der Auswahl öffnen">✎ <span>Bearbeiten</span></button>` +
        `<button type="button" data-kontext="drehen" title="Drehen (R)" aria-label="Drehen">↻</button>` +
        `<button type="button" data-kontext="spiegeln" title="Spiegeln (H)" aria-label="Spiegeln">⇄</button>` +
        `<button type="button" data-kontext="doppeln" title="Duplizieren (Strg+D)" aria-label="Duplizieren">⧉</button>` +
        `<button type="button" data-kontext="loeschen" title="Löschen (Entf)" aria-label="Löschen">✕</button>` +
        `<button type="button" data-kontext="abwahl" title="Auswahl aufheben" aria-label="Auswahl aufheben">×</button>`;
    };
    const male = (): void => { if (z.simulation && karteId) karteSchliessen();
      rechnen(); kopfMalen(); buehneMalen(); fussMalen(); laborMalen(); kontextMalen();
      if (batterie && !batteriePanel.hidden) batterie.aktualisiere();
      if (relais && !relaisPanel.hidden) relais.aktualisiere();
      if (pruefungOffen) pruefMalen();
      if (studioOffen) studioMalen(); };


    /* --- Die Ansicht: Zoom und Lage (E762) ---------------------------------
     * Gezoomt wird über die viewBox, nicht über ein neues Bild: das SVG
     * bleibt dasselbe Element, und `ortAus` rechnet über seine Matrix. Bei
     * Zoom 1 und Lage 0,0 ist die viewBox das ganze Blatt — Zeichen für
     * Zeichen das Bild von vor E762 (test625 §0). */
    const ZOOM_MIN = 0.25, ZOOM_MAX = 8;
    const svgJetzt = (): SVGSVGElement | null => leinwand.querySelector('svg.sp-flaeche');
    const ansichtAnwenden = (): void => {
      const svg = svgJetzt();
      const { zoom, x, y } = z.ansicht;
      const B = Number(z.plan.breite) || 800, H = Number(z.plan.hoehe) || 700;
      if (svg) svg.setAttribute('viewBox', (zoom === 1 && x === 0 && y === 0)
        ? `0 0 ${B} ${H}`
        : `${+x.toFixed(3)} ${+y.toFixed(3)} ${+(B / zoom).toFixed(3)} ${+(H / zoom).toFixed(3)}`);
      const wert = zoomleiste.querySelector('.sp-zoomwert');
      if (wert) wert.textContent = Math.round(zoom * 100) + ' %';
    };
    /** Wie das Blatt bei Zoom 1 im Kasten des SVG steht: Massstab und linke obere Ecke. */
    const schirm = (): { s1: number; cx: number; cy: number } => {
      const svg = svgJetzt();
      const B = Number(z.plan.breite) || 800, H = Number(z.plan.hoehe) || 700;
      if (!svg) return { s1: 1, cx: 0, cy: 0 };
      const r = svg.getBoundingClientRect();
      const s1 = Math.min(r.width / B, r.height / H) || 1;
      return { s1, cx: r.left + (r.width - B * s1) / 2, cy: r.top + (r.height - H * s1) / 2 };
    };
    const planAm = (sx: number, sy: number): Punkt => {
      const g = schirm(), k = g.s1 * z.ansicht.zoom;
      return { x: z.ansicht.x + (sx - g.cx) / k, y: z.ansicht.y + (sy - g.cy) / k };
    };
    /** Zoom setzen, sodass der Planpunkt `P` am Bildschirmpunkt (sx, sy) steht. */
    const zoomSetzen = (zoom: number, P: Punkt, sx: number, sy: number): void => {
      const zz = Math.round(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) * 1000) / 1000;
      const g = schirm(), k = g.s1 * zz;
      z.ansicht = { zoom: zz, x: P.x - (sx - g.cx) / k, y: P.y - (sy - g.cy) / k };
      if (zz === 1 && Math.abs(z.ansicht.x) < 0.5 && Math.abs(z.ansicht.y) < 0.5) z.ansicht = { zoom: 1, x: 0, y: 0 };
      ansichtAnwenden();
    };
    const zoomUm = (faktor: number, sx?: number, sy?: number): void => {
      const svg = svgJetzt();
      if (!svg) return;
      if (sx === undefined || sy === undefined) {
        const r = svg.getBoundingClientRect();
        sx = r.left + r.width / 2; sy = r.top + r.height / 2;
      }
      zoomSetzen(z.ansicht.zoom * faktor, planAm(sx, sy), sx, sy);
    };
    const allesZeigen = (): void => { z.ansicht = { zoom: 1, x: 0, y: 0 }; ansichtAnwenden(); };
    const schwenken = (dx: number, dy: number): void => {
      const g = schirm(), k = g.s1 * z.ansicht.zoom;
      z.ansicht = { zoom: z.ansicht.zoom, x: z.ansicht.x - dx / k, y: z.ansicht.y - dy / k };
      ansichtAnwenden();
    };
    zoomleiste.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'zoom-plus') zoomUm(1.25);
      else if (b.dataset.a === 'zoom-minus') zoomUm(0.8);
      else if (b.dataset.a === 'zoom-alles') allesZeigen();
    });

    /* --- Das Prüfzentrum (E771): prüfen, hinspringen, Stückliste und Netze ausgeben.
     * Reine, reproduzierbare Analyse; Änderungen laufen durch `aendere`.
     * Keine neue Netzgeometrie: Stromfluss.netze liefert die elektrischen Netze. */
    /* Der Kern kommt erst, wenn jemand das Prüfzentrum öffnet — wie die
       Relais-Werkstatt (E769); in der Einzeldatei steht er schon da. */
    const pruefLaden = (): Promise<void> => {
      const w = window as any;
      if (w.Planpruefung) return Promise.resolve();
      if (w.__pruefLaden) return w.__pruefLaden as Promise<void>;
      const v = new Promise<void>((ja, nein) => {
        const s = document.createElement('script');
        s.src = 'quell/bereiche/bloecke/arten/schaltplan-pruefung.js';
        s.addEventListener('load', () => ja());
        s.addEventListener('error', () => nein(new Error('Das Prüfzentrum liess sich nicht laden.')));
        document.head.appendChild(s);
      });
      w.__pruefLaden = v;
      v.catch(() => { w.__pruefLaden = null; });
      return v;
    };
    const pruefDaten = (): any => (window as any).Planpruefung.analysieren(z.plan, {
      anschluesseVon: (t: any) => Schaltplan.anschluesseVon(t),
      holeSymbol: (id: string) => Register.fachzeichen.holen(id),
      netze: (plan: any) => Stromfluss.netze(plan),
      /* E747: dieselben Sätze wie die Fusszeile, aus derselben Rechnung. */
      offeneKlemmen: (plan: any) => {
        const r = stromRechnung(plan, {}, {});
        return ((r && r.warnungen) || []).filter((w: string) => / hängt an keiner Leitung\.$/.test(w));
      }
    });
    const pruefMalen = (): void => {
      if (!pruefungOffen) return;
      if (!(window as any).Planpruefung) {
        pruefPanel.innerHTML = '<p class="sp-bat-hinweis" role="status">Das Prüfzentrum wird geladen …</p>';
        pruefLaden().then(() => { if (pruefungOffen && wurzel.isConnected) pruefMalen(); })
          .catch((err: Error) => { pruefPanel.innerHTML = '<p class="sp-bat-hinweis" role="alert">' + esc(err.message) + '</p>'; });
        return;
      }
      const r = pruefDaten();
      const tasten = (['diagnose', 'bauteile', 'netze'] as const).map((id, i) =>
        `<button type="button" data-p-tab="${id}" aria-pressed="${pruefAnsicht === id}"` +
        ` class="${pruefAnsicht === id ? 'an' : ''}">${['Prüfpunkte', 'Stückliste', 'Netze'][i]}</button>`).join('');
      const kopf = `<div class="sp-pruef-titel"><div><strong>Schaltplan-Prüfzentrum</strong>` +
        `<p>Hinweise zur Zeichnung – keine elektrische Sicherheitsabnahme.</p></div>` +
        `<button type="button" data-p-a="schliessen" aria-label="Prüfzentrum schliessen">✕</button></div>` +
        `<div class="sp-pruef-kennzahlen" aria-live="polite">` +
        `<span>${r.statistik.teile} Bauteile</span><span>${r.statistik.leitungen} Leitungen</span>` +
        `<span>${r.statistik.netze} Netze</span><span>${r.zaehler.fehler} Fehler</span>` +
        `<span>${r.zaehler.warnung} Warnungen</span><span>${r.zaehler.hinweis} Hinweise</span></div>` +
        `<div class="sp-pruef-tabs" role="group" aria-label="Prüfzentrum Ansichten">${tasten}</div>`;
      let liste = '';
      if (pruefAnsicht === 'diagnose') {
        liste = r.punkte.length ? r.punkte.slice(0, 250).map((eintrag: any, i: number) =>
          `<button type="button" class="sp-pruef-zeile" data-p-id="${esc(eintrag.id)}" data-p-index="${i}"` +
          ` data-suche="${esc((eintrag.text + ' ' + eintrag.id).toLocaleLowerCase('de'))}"` +
          ` title="Im Schaltplan auswählen"><span class="sp-pruef-stufe ${esc(eintrag.stufe)}">${esc(eintrag.stufe)}</span>` +
          `<span>${esc(eintrag.text)}</span></button>`).join('') :
          '<p class="sp-pruef-leer">Keine Auffälligkeiten in den geprüften Strukturregeln.</p>';
        if (r.punkte.length > 250) liste += `<p>${r.punkte.length - 250} weitere Hinweise im Textbericht.</p>`;
      } else if (pruefAnsicht === 'bauteile') {
        liste = r.bauteile.map((b: any) =>
          `<button type="button" title="Bauteile dieses Typs auswählen" class="sp-pruef-bestand" data-p-typ="${esc(b.zeichen)}"` +
          ` data-suche="${esc((b.name + ' ' + b.zeichen + ' ' + b.kennzeichen.join(' ')).toLocaleLowerCase('de'))}">` +
          `<b>${esc(b.name)}</b><span>${b.anzahl} ×</span><small>${esc(b.kennzeichen.join(', ') || b.zeichen)}</small></button>`).join('') ||
          '<p class="sp-pruef-leer">Noch keine Bauteile im Plan.</p>';
      } else {
        liste = r.netze.map((n: any) =>
          `<button type="button" title="Netz im Plan auswählen" class="sp-pruef-bestand" data-p-netz="${n.nummer}"` +
          ` data-suche="${esc(('N'+n.nummer+' '+n.klemmen.map((k:any)=>k.teil+' '+k.nr).join(' ')).toLocaleLowerCase('de'))}">` +
          `<b>Netz ${n.nummer + 1}</b><span>${n.leitungen.length} Leiter</span>` +
          `<small>${esc(n.klemmen.map((k: any) => `${k.teil}:${k.nr}`).join(', ') || 'Keine Bauteilklemme')}</small></button>`).join('') ||
          '<p class="sp-pruef-leer">Keine elektrischen Netze vorhanden.</p>';
      }
      pruefPanel.innerHTML = kopf + `<div class="sp-pruef-werkzeuge">` +
        `<label>Filtern<input type="search" class="sp-pruef-suche" value="${esc(pruefSuche)}" placeholder="Kennzeichen, Typ, Fundstelle …" /></label>` +
        `<button type="button" data-p-a="export">${pruefAnsicht === 'diagnose' ? 'Bericht TXT' : 'Export CSV'}</button>` +
        `<button type="button" data-p-a="aufraeumen" title="Redundante Zwischenpunkte entfernen – Anschlusspunkte bleiben erhalten">Leitungen aufräumen</button>` +
        `</div><div class="sp-pruef-liste">${liste}</div>`;
      pruefFiltern();
    };
    const pruefFiltern = (): void => {
      const wort = pruefSuche.trim().toLocaleLowerCase('de');
      pruefPanel.querySelectorAll<HTMLElement>('[data-suche]').forEach(el => {
        el.hidden = !!wort && !(el.dataset.suche || '').includes(wort);
      });
    };
    const pruefFokussieren = (eintrag: any): void => {
      if (z.zieht || !eintrag?.id) return;
      const teil = (z.plan.teile as any[]).find(t => t.id === eintrag.id);
      const leitung = (z.plan.leitungen as any[]).find(l => l.id === eintrag.id);
      const t = (z.plan.texte as any[]).find(t => t.id === eintrag.id);
      const p = Number.isFinite(eintrag.x) && Number.isFinite(eintrag.y)
        ? {x: eintrag.x, y: eintrag.y}
        : teil || t || (leitung && leitung.punkte?.[0]);
      if (!p) return;
      z.auswahl.clear(); z.auswahl.add(eintrag.id);
      z.werkzeug = 'zeigen'; z.gewaehltesZeichen = '';
      const zoom = Math.max(1.5, z.ansicht.zoom);
      z.ansicht = {zoom: Math.min(3, zoom),
        x: p.x - z.plan.breite / (2 * Math.min(3, zoom)),
        y: p.y - z.plan.hoehe / (2 * Math.min(3, zoom))};
      male();
      wurzel.focus({preventScroll:true});
    };
    const pruefMehrfach = (ids: string[]): void => {
      if (z.zieht || !ids.length) return;
      z.auswahl = new Set(ids); z.werkzeug = 'zeigen'; z.gewaehltesZeichen = '';
      const punkte: Punkt[] = [];
      (z.plan.teile as any[]).forEach(t => { if (z.auswahl.has(t.id)) punkte.push({x:t.x,y:t.y}); });
      (z.plan.leitungen as any[]).forEach(l => { if (z.auswahl.has(l.id)) punkte.push(...l.punkte); });
      if (punkte.length) {
        const links=Math.min(...punkte.map(p=>p.x)), rechts=Math.max(...punkte.map(p=>p.x));
        const oben=Math.min(...punkte.map(p=>p.y)), unten=Math.max(...punkte.map(p=>p.y));
        const zoom=Math.max(.25,Math.min(3,z.plan.breite / (rechts-links+120),z.plan.hoehe/(unten-oben+120)));
        z.ansicht={zoom,x:(links+rechts)/2-z.plan.breite/(2*zoom),
                        y:(oben+unten)/2-z.plan.hoehe/(2*zoom)};
      }
      male(); wurzel.focus({preventScroll:true});
    };
    const pruefHerunterladen = (text: string, datei: string, mime: string): void => {
      if (z.zieht) { UI.toast('Erst den laufenden Zug beenden.'); return; }
      const blob = new Blob([text], {type:mime});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download=datei; a.click();
      setTimeout(()=>URL.revokeObjectURL(url),4000);
    };
    pruefPanel.addEventListener('input', e => {
      const el = e.target as HTMLInputElement;
      if (!el.classList.contains('sp-pruef-suche')) return;
      pruefSuche = el.value; pruefFiltern();
    });
    pruefPanel.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-p-tab],[data-p-a],[data-p-id],[data-p-typ],[data-p-netz]');
      if (!b) return;
      if (b.dataset.pTab) { pruefAnsicht = b.dataset.pTab as typeof pruefAnsicht; pruefMalen(); return; }
      if (b.dataset.pTyp) {
        const ids=(z.plan.teile as any[]).filter(t=>t.zeichen===b.dataset.pTyp).map(t=>t.id);
        pruefMehrfach(ids); return;
      }
      if (b.dataset.pNetz !== undefined) {
        const n=pruefDaten().netze.find((n:any)=>String(n.nummer)===b.dataset.pNetz);
        if (n) pruefMehrfach([...new Set([...n.leitungen,...n.klemmen.map((k:any)=>k.teil)])] as string[]);
        return;
      }
      if (b.dataset.pId) {
        const r = pruefDaten();
        const eintrag = r.punkte[Number(b.dataset.pIndex)];
        if (eintrag?.id === b.dataset.pId) pruefFokussieren(eintrag);
        return;
      }
      if (b.dataset.pA === 'schliessen') { pruefungOffen = false; pruefPanel.hidden = true; kopfMalen(); return; }
      if (b.dataset.pA === 'export') {
        const r=pruefDaten(), P=(window as any).Planpruefung;
        const daten=pruefAnsicht==='diagnose' ? P.berichtText(r) :
          pruefAnsicht==='bauteile' ? P.bauteileCsv(r) : P.netzeCsv(r);
        pruefHerunterladen(daten, pruefAnsicht==='diagnose' ? 'Redion-Schaltplan-Pruefbericht.txt' :
          pruefAnsicht==='bauteile' ? 'Redion-Stueckliste.csv' : 'Redion-Netzliste.csv',
          pruefAnsicht==='diagnose' ? 'text/plain;charset=utf-8' : 'text/csv;charset=utf-8');
        return;
      }
      if (b.dataset.pA === 'aufraeumen') {
        if (z.zieht) return;
        const P=(window as any).Planpruefung;
        const kopie=JSON.parse(JSON.stringify(z.plan));
        const ergebnis=P.vereinfachen(kopie,(t:any)=>Schaltplan.anschluesseVon(t));
        if (!ergebnis.entfernt) { UI.toast('Keine sicher entfernbaren Zwischenpunkte gefunden.'); return; }
        aendere(() => { z.plan.leitungen = kopie.leitungen; });
        UI.toast(`${ergebnis.entfernt} überflüssige Zwischenpunkte entfernt – mit Rückgängig umkehrbar.`);
      }
    });

    /* --- Ein Bild während eines Zugs, ohne das SVG neu zu bauen (E762) -------
     * Bis hier rief jede Bewegung eines Zugs `buehneMalen` — das ganze SVG
     * als Text, geparst, ersetzt, bei jedem Raster. Jetzt rückt ein Zug nur,
     * was sich bewegt: die `transform` der gezogenen Teile, das `d` jeder
     * Leitung, deren Weg (oder deren Lücke an einer Kreuzung) sich ändert,
     * und die Verbindungspunkte. Gemessen in messungen.md (§111). */
    const teilweiseMalen = (teilIds: Iterable<string>): void => {
      const svg = svgJetzt();
      if (!svg) return;
      for (const id of teilIds) {
        const t = teilVon(id);
        const g = svg.querySelector(`.sp-teil[data-id="${CSS.escape(id)}"]`);
        if (t && g) g.setAttribute('transform', `translate(${t.x} ${t.y})`);
      }
      const luecken = Schaltplan.kreuzungen(z.plan);
      const nachId = new Map<string, any>((z.plan.leitungen as any[]).map(l => [l.id, l]));
      svg.querySelectorAll<SVGPathElement>('path.sp-leitung').forEach(el => {
        const l = nachId.get(el.dataset.id || '');
        if (!l) return;
        const d = Schaltplan.leitungPfad(l, luecken);
        if (el.getAttribute('d') !== d) el.setAttribute('d', d);
      });
      svg.querySelectorAll('.sp-knoten').forEach(c => c.remove());
      const knoten = (Schaltplan.verbindungspunkte(z.plan) as Punkt[]).map(q =>
        `<circle class="sp-knoten" cx="${q.x}" cy="${q.y}" r="4" fill="currentColor"/>`).join('');
      const vor = svg.querySelector('.sp-teil, .sp-text, .sp-vorschau');
      if (knoten) { if (vor) vor.insertAdjacentHTML('beforebegin', knoten); else svg.insertAdjacentHTML('beforeend', knoten); }
    };
    /** Die Vorschau eines Zugs (Leitung, Rahmen, Schiene, Radierkreis) — eine
     *  Gruppe obenauf, deren Inhalt jede Bewegung ersetzt; das SVG bleibt. */
    const vorschau = (html: string): void => {
      const svg = svgJetzt();
      if (!svg) return;
      let g = svg.querySelector('g.sp-vorschau');
      if (!g) { svg.insertAdjacentHTML('beforeend', '<g class="sp-vorschau"></g>'); g = svg.querySelector('g.sp-vorschau'); }
      if (g) g.innerHTML = html;
    };

    /* --- Symbol setzen (Punkt 12) ---------------------------------------- */
    const setzeSymbol = (id: string, x: number, y: number): string | null => {
      if (!id || z.simulation || z.zieht || !Register.fachzeichen.holen(id)) return null;
      const neu = Schaltplan.uid();
      aendere(() => {
        z.plan.teile.push({
          id: neu, zeichen: id,
          x: Schaltplan.rasten(x), y: Schaltplan.rasten(y),
          drehung: 0, gespiegelt: false,
          bmk: Schaltplan.naechstesBmk(z.plan, id),
          nummern: {}, gruppe: '',
          ebene: aktiveEbene()
        });
      });
      /* Die bestehende Zeichenfläche erhält genau EIN gespeichertes Teil.
         Die optische Rückmeldung berührt weder Plan noch Undo-Verlauf. */
      const g = svgJetzt()?.querySelector<SVGGElement>(`.sp-teil[data-id="${CSS.escape(neu)}"]`);
      if (g) g.classList.add('sp-frisch-eingesetzt');
      return neu;
    };

    /* --- Das Netz: L1 und N als Sammelschienen (E262) ---------------------
     * Redur: „füge dort alle Leitungen wie L1 und N ein, damit ich direkt
     * testen kann." Ein aufgelöster Stromlaufplan beginnt im Lehrmittel
     * immer gleich: L1 als Schiene oben, N als Schiene unten, dazwischen
     * die Zweige. Der Knopf zeichnet genau das — und hängt die Schienen an
     * eine Wechselspannungsquelle links, damit die Simulation sofort
     * rechnen kann. Die Schienen sind gewöhnliche Leitungen: wer einen
     * Zweig darauf ENDEN lässt, ist verbunden (die Simulation zapft
     * Sammelschienen ausdrücklich an, simulation.ts, netzInfo). PE kommt
     * bewusst nicht mit: ohne Fehlerfall führte er nichts und stünde nur
     * als toter Strich im Bild. */
    const netzSchonDa = (): boolean =>
      (z.plan.texte as any[]).some(t => t && t.t === 'L1') ||
      (z.plan.teile as any[]).some(t => t && t.zeichen === 'wechselspannung');

    /** Netz oder ein Beispiel aus dem Kern einfügen (Schaltplan.beispielBauen). */
    const schaltungEinfuegen = (id: string): void => {
      if (netzSchonDa()) {
        UI.toast('Das Netz steht schon — für ein neues Beispiel zuerst „… → Plan leeren".');
        return;
      }
      if (id === 'netz') {
        aendere(() => { Schaltplan.netzBauen(z.plan, aktiveEbene()); });
        return;
      }
      const beispiel = (Schaltplan.BEISPIELE as any[]).find(x => x.id === id);
      aendere(() => { Schaltplan.beispielBauen(z.plan, id, aktiveEbene()); });
      /* Der Hinweis nur, wenn das Beispiel wirklich steht: während eines Zugs
         verweigert `aendere`, und „Strom drücken, dann auf S1 tippen" über
         einem Plan ohne S1 wäre eine Zusage ohne Inhalt (E746, dritte
         Durchsicht; test611 §14). */
      if (beispiel && !z.zieht) UI.toast(beispiel.hinweis);
    };

    /** Eine selbst gespeicherte Vorlage einsetzen — mit FRISCHEN Kennungen.
     *  Die Vorlage trägt die Kennungen des Plans, aus dem sie ausgeschnitten
     *  wurde; zweimal eingesetzt wären es doppelte, und die Auswahl fasste
     *  beide zugleich an. */
    const vorlageEinsetzen = (v: any): void => {
      if (z.zieht) return; // keine Einfuegung in einen noch offenen Mauszug
      const teile = (Array.isArray(v?.teile) ? v.teile : []) as any[];
      const leitungen = (Array.isArray(v?.leitungen) ? v.leitungen : []) as any[];
      if (!teile.length) { UI.toast('Diese Vorlage enthaelt keine Bauteile.'); return; }

      /* Der Versatz 120/80 setzte jede Kopie auf die vorige. Suche stattdessen
         die erste freie Rasterposition, ohne vorhandene Zeichen zu ueberdecken.
         Die Symbolmasse stammen aus demselben Register wie der Auswahlrahmen. */
      const r = Register.fachzeichen.RASTER;
      const rand = r;
      const rahmen = (t: any, dx = 0, dy = 0) => {
        const m = Register.fachzeichen.masse(t.zeichen, Number(t.drehung) || 0);
        return { l: Number(t.x) + dx, o: Number(t.y) + dy,
          r: Number(t.x) + dx + m.w, u: Number(t.y) + dy + m.h };
      };
      const belegt = (z.plan.teile as any[]).map(t => rahmen(t));
      /* Leitungsstrecken duerfen nicht quer durch fremde Bauteile laufen.
         Liang-Barsky prueft die echte Strecke gegen ein Rechteck; nur
         Begrenzungskaesten der Leitung zu vergleichen wuerde insbesondere
         bei diagonalen Alt-Vorlagen falsche Treffer erzeugen. */
      const streckeTrifft = (a: Punkt, b: Punkt, f: ReturnType<typeof rahmen>): boolean => {
        const dx = b.x - a.x, dy = b.y - a.y;
        const p = [-dx, dx, -dy, dy];
        const q = [a.x - f.l, f.r - a.x, a.y - f.o, f.u - a.y];
        let ein = 0, aus = 1;
        for (let i = 0; i < 4; i++) {
          const pi = p[i]!, qi = q[i]!;
          if (pi === 0) { if (qi < 0) return false; continue; }
          const t = qi / pi;
          if (pi < 0) ein = Math.max(ein, t);
          else aus = Math.min(aus, t);
          if (ein > aus) return false;
        }
        return true;
      };
      const passt = (dx: number, dy: number): boolean => {
        const teilePassen = teile.every(t => {
          const a = rahmen(t, dx, dy);
          return Number.isFinite(a.l) && Number.isFinite(a.o) &&
            Number.isFinite(a.r) && Number.isFinite(a.u) &&
            a.l >= rand && a.o >= rand &&
            a.r <= z.plan.breite - rand && a.u <= z.plan.hoehe - rand &&
            belegt.every(b => a.r + rand <= b.l || b.r + rand <= a.l ||
                              a.u + rand <= b.o || b.u + rand <= a.o);
        });
        /* Auch die Leitungen muessen auf das Blatt passen. Bei teilweise
           gespeicherten Vorlagen liegen deren Punkte oft ausserhalb des
           Bauteilrahmens. Nur die Bauteile zu pruefen reicht nicht: eine
           eingeklebte Leitung koennte sonst ausserhalb des SVG enden. */
        return teilePassen && leitungen.every(l => {
          const punkte: Punkt[] = (Array.isArray(l.punkte) ? l.punkte : [])
            .map((p: any) => ({ x: Number(p.x) + dx, y: Number(p.y) + dy }));
          if (!punkte.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) &&
              p.x >= rand && p.y >= rand &&
              p.x <= z.plan.breite - rand && p.y <= z.plan.hoehe - rand)) return false;
          /* Ein kleiner Abstand verhindert, dass die Simulation fremde
             Anschlussklemmen beim Einsetzen unbeabsichtigt anzapft. */
          const abstand = Math.min(6, rand);
          for (let i = 1; i < punkte.length; i++)
            for (const b of belegt) {
              const feld = { l: b.l - abstand, o: b.o - abstand,
                r: b.r + abstand, u: b.u + abstand };
              if (streckeTrifft(punkte[i - 1]!, punkte[i]!, feld)) return false;
            }
          /* Auch schon gezeichnete Leitungen duerfen nicht deckungsgleich
             ueberlagert werden: optisch waere es ein Draht, elektrisch
             aber eine unbeabsichtigte Verbindung. Nur echte Ueberlappung
             blockiert; eine Kreuzung ohne Knoten darf bestehen bleiben. */
          if (punkte.length >= 2 && Schaltplan.ueberlappt(punkte, z.plan.leitungen))
            return false;
          return true;
        });
      };
      const schritt = Math.max(r * 4, 40);
      let versatz: { x: number; y: number } | null = null;
      /* Erster Einsatz behaelt seine bisherige Lage; weitere suchen ein
         freies Feld. Der zweite Durchlauf erlaubt auch die linke Blatthaelfte. */
      if (passt(120, 80)) versatz = { x: 120, y: 80 };
      for (let y = r * 2; !versatz && y < z.plan.hoehe; y += schritt)
        for (let x = r * 2; !versatz && x < z.plan.breite; x += schritt)
          if (passt(x, y)) versatz = { x, y };
      if (!versatz) {
        UI.toast('Kein freier Platz fuer diese Vorlage. Bitte erst Platz schaffen.');
        return;
      }
      const { x: dx, y: dy } = versatz;
      const ebene = aktiveEbene();
      aendere(() => {
        const neuId = new Map<string, string>();
        const gruppen = new Map<string, string>();
        teile.forEach(t => {
          const id = Schaltplan.uid();
          neuId.set(String(t.id), id);
          const gruppe = String(t.gruppe || '');
          if (gruppe && !gruppen.has(gruppe)) gruppen.set(gruppe, Schaltplan.uid());
          z.plan.teile.push({ ...t, id, x: Number(t.x) + dx, y: Number(t.y) + dy,
            bmk: Schaltplan.naechstesBmk(z.plan, t.zeichen),
            gruppe: gruppe ? gruppen.get(gruppe) : '', ebene,
            nummern: { ...(t.nummern || {}) } });
        });
        leitungen.forEach(l => {
          const neu: any = { ...l, id: Schaltplan.uid(), ebene,
            punkte: (Array.isArray(l.punkte) ? l.punkte : [])
              .map((p: any) => ({ x: Number(p.x) + dx, y: Number(p.y) + dy })) };
          /* Nur Anschluesse an mitkopierte Bauteile duerfen ueberleben.
             Der alte Fallback auf l.vonTeil/l.nachTeil schuf baumelnde
             Referenzen auf Teile des Ursprungsplans. */
          delete neu.vonTeil; delete neu.vonNr;
          delete neu.nachTeil; delete neu.nachNr;
          const von = neuId.get(String(l.vonTeil));
          const nach = neuId.get(String(l.nachTeil));
          if (von) { neu.vonTeil = von; neu.vonNr = l.vonNr; }
          if (nach) { neu.nachTeil = nach; neu.nachNr = l.nachNr; }
          if (neu.punkte.length >= 2) z.plan.leitungen.push(neu);
        });
      });
    };

    /** Das Menü hinter „⚡ Schaltung": Netz, Beispiele, eigene Vorlagen.
     *  Die eigenen liessen sich bisher nur SPEICHERN, nirgends einsetzen —
     *  ein Weg ins Leere (§47), hier endet er. */
    const schaltungMenue = (anker: HTMLElement): void => {
      const r = anker.getBoundingClientRect();
      const eigene = ((Store.getMeta(VORLAGEN, []) || []) as any[])
        .filter(v => !v.art || v.art === z.plan.art);
      const m = UI.menu(
        '<button data-s="netz">Netz — L1 und N mit Quelle</button>' +
        '<hr>' +
        (Schaltplan.BEISPIELE as any[]).map(b =>
          `<button data-s="${esc(b.id)}">${esc(b.name)}</button>`).join('') +
        (eigene.length
          ? '<hr>' + eigene.map((v, i) =>
              `<button data-v="${i}">Vorlage: ${esc(v.name)}</button>`).join('')
          : ''),
        r.left - 120, r.bottom + 6);
      m.addEventListener('click', e => {
        const b = (e.target as Element).closest<HTMLElement>('[data-s],[data-v]');
        if (!b) return;
        m.remove();
        if (b.dataset.s) return schaltungEinfuegen(b.dataset.s);
        const v = eigene[Number(b.dataset.v)];
        if (v) vorlageEinsetzen(v);
      });
    };

    /* Auf welche Ebene wird gezeichnet: die oberste sichtbare, die nicht
       „plan" ist, sonst „plan". So landet eine Lösung auf der Lösungsebene,
       ohne dass jemand vorher etwas umstellen muss. */
    const aktiveEbene = (): string => {
      const e = (z.plan.ebenen as any[]).filter(x => x.sichtbar);
      const nurAufgabe = e.length === 1 && e[0].id !== 'plan';
      return nurAufgabe ? e[0].id : 'plan';
    };

    /* --- Auswahl (Punkt 24) ---------------------------------------------- */
    const inRahmen = (a: { x: number; y: number }, b: { x: number; y: number }): string[] => {
      const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
      const y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
      const raus: string[] = [];
      (z.plan.teile as any[]).forEach(t => {
        const m = Register.fachzeichen.masse(t.zeichen, t.drehung);
        if (t.x >= x1 && t.y >= y1 && t.x + m.w <= x2 && t.y + m.h <= y2) raus.push(t.id);
      });
      (z.plan.leitungen as any[]).forEach(l => {
        if (l.punkte.every((p: any) => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2))
          raus.push(l.id);
      });
      /* Texte auch (E762): sonst dreht eine Gruppe ohne ihre Beschriftung. */
      (z.plan.texte as any[]).forEach(t => {
        if (t.x >= x1 && t.x <= x2 && t.y >= y1 && t.y <= y2) raus.push(t.id);
      });
      return raus;
    };

    const teilVon = (id: string): any =>
      (z.plan.teile as any[]).find(t => t.id === id);

    /* --- Nachziehen (E738, E746) --------------------------------------------
       Was vor einer Lageänderung feststeht — welche Klemme jedes Leitungsende
       meint (E738: gefragt, solange Leitung und Teil noch zueinander passen),
       die Punkte und was jede Leitung berührt —, und danach EINE Stelle, die
       die Leitungen nachzieht: `Schaltplan.nachziehen`. Sie führt nur neu, was
       an einem bewegten Teil hängt, und nimmt keinen Weg, der etwas berührt,
       was die Leitung vorher nicht berührte (L253 Punkt 4). Bis E746 stand
       hier `leitungenNachziehen`, und das führte beim Drehen, Spiegeln und
       Ziehen ALLE Leitungen des Plans als Winkel neu: nach dem Drehen des FI
       lief b2 5 px neben N2 vorbei, und N und N2 waren ein Netz. */
    type Bericht = ReturnType<typeof Schaltplan.nachziehen>;
    type Aenderungen = ReturnType<typeof Schaltplan.veraendert>;
    type Vorher = ReturnType<typeof Schaltplan.vorherMerken>;

    /* Was eine Lageänderung an der Schaltung geändert hat, soll der Mensch
       wissen — eine stille Änderung der Schaltung ist genau das, wogegen das
       Nachziehen gebaut ist (§35: eine bekannte Lücke ist besser als ein
       stiller Fehler; §51). Zwei Fälle:
         · eine Leitung liess sich nicht so führen, dass sie genau dasselbe
           berührt wie vorher (Stufe 2 oder 3);
         · die eigene Klemme eines bewegten Teils liegt jetzt auf einer
           fremden Leitung oder Klemme, oder nicht mehr (`veraendert`) — das
           verhindert die Fläche nicht, denn vielleicht ist es gewollt, aber
           sie sagt es, und zwar WAS: „R1:1 berührt jetzt die Leitung
           E1:X2–E2:X1". */
    const bmk = (tid: string): string => {
      const t = teilVon(tid);
      return String((t && t.bmk) || tid);
    };
    /** „Teil:Nr" als Betriebsmittelkennzeichen und Klemme, z. B. „R1:1". */
    const klemmeName = (k: string): string => {
      const i = k.lastIndexOf(':');
      return i < 0 ? k : bmk(k.slice(0, i)) + k.slice(i);
    };
    const leitungName = (lid: string, vorher: Vorher): string => {
      const l = (z.plan.leitungen as any[]).find(x => x.id === lid);
      if (!l) return 'eine Leitung';
      const k = vorher.klemmen.get(lid);
      const a = l.vonTeil ? bmk(l.vonTeil) + ':' + (k?.von ?? l.vonNr) : '';
      const b = l.nachTeil ? bmk(l.nachTeil) + ':' + (k?.nach ?? l.nachNr) : '';
      return a && b ? `die Leitung ${a}–${b}` : (a || b) ? `die Leitung an ${a || b}` : 'eine freie Leitung';
    };
    const melde = (was: string, bericht: Bericht | undefined, aenderungen: Aenderungen | undefined,
                   vorher: Vorher | undefined): void => {
      if (typeof UI === 'undefined') return;
      const stufe = !!bericht && bericht.some(b => b.stufe >= 2);
      const liste = aenderungen || [];
      if (!stufe && !liste.length) return;
      const saetze = vorher ? liste.map(a => {
        if (a.art === 'klemme') return a.jetzt
          ? `${klemmeName(a.klemme)} berührt jetzt ${leitungName(a.leitung, vorher)}`
          : `${klemmeName(a.klemme)} berührt ${leitungName(a.leitung, vorher)} nicht mehr`;
        if (a.art === 'leitung') return a.jetzt
          ? `${leitungName(a.leitung, vorher)} berührt jetzt ${leitungName(a.andere, vorher)}`
          : `${leitungName(a.leitung, vorher)} berührt ${leitungName(a.andere, vorher)} nicht mehr`;
        return a.jetzt
          ? `${klemmeName(a.klemme)} liegt jetzt auf ${klemmeName(a.andere)} (ohne Leitung nicht verbunden)`
          : `${klemmeName(a.klemme)} liegt nicht mehr auf ${klemmeName(a.andere)}`;
      }) : [];
      const was3 = saetze.slice(0, 3).join('; ') + (saetze.length > 3 ? ` und ${saetze.length - 3} weitere` : '');
      const verbunden = liste.some(a => a.art !== 'aufeinander');
      UI.toast(stufe
        ? 'Eine Leitung liess sich nicht so nachziehen, dass sie genau dasselbe berührt wie vorher — bitte die Verbindungen prüfen' + (was3 ? ': ' + was3 + '.' : '.')
        : `Nach dem ${was}: ${was3} — ` + (verbunden ? 'die Verbindungen haben sich geändert, bitte prüfen.' : 'bitte prüfen.'),
        6000);
    };

    /** Die Kennungen der ausgewählten TEILE (Leitungen und Texte drehen nicht). */
    const auswahlTeile = (): any[] => [...z.auswahl].map(teilVon).filter(Boolean);

    /* --- Verschieben (Punkt 25), mit mitziehenden Leitungen -------------- */
    const verschiebe = (dx: number, dy: number): { bericht: Bericht; aenderungen: Aenderungen; vorher: Vorher } => {
      const vorher = Schaltplan.vorherMerken(z.plan);
      const teile: string[] = [];
      const eigene = new Set<string>();
      z.auswahl.forEach(id => {
        const t = teilVon(id);
        if (t) { t.x = Schaltplan.rasten(t.x + dx); t.y = Schaltplan.rasten(t.y + dy); teile.push(id); return; }
        const l = (z.plan.leitungen as any[]).find(x => x.id === id);
        if (l) {
          l.punkte = l.punkte.map((p: any) =>
            ({ x: Schaltplan.rasten(p.x + dx), y: Schaltplan.rasten(p.y + dy) }));
          eigene.add(id);
        }
      });
      /* Eine Leitung, die selbst mitgeschoben wurde, gehört dem Menschen: nur
         ihr Ende rückt auf die Klemme eines mitgeschobenen Teils (23), wie
         bisher — Teil und Leitung sind um denselben Schritt gewandert. */
      (z.plan.leitungen as any[]).forEach(l => {
        if (!eigene.has(l.id)) return;
        const ziel = vorher.klemmen.get(l.id);
        if (l.vonTeil && z.auswahl.has(l.vonTeil)) {
          const t = teilVon(l.vonTeil);
          const o = t && Schaltplan.anschlussOrt(t, ziel?.von ?? l.vonNr);
          if (o && l.punkte[0]) l.punkte[0] = o;
        }
        if (l.nachTeil && z.auswahl.has(l.nachTeil)) {
          const t = teilVon(l.nachTeil);
          const o = t && Schaltplan.anschlussOrt(t, ziel?.nach ?? l.nachNr);
          if (o && l.punkte.length) l.punkte[l.punkte.length - 1] = o;
        }
      });
      /* Alle anderen, die an einem geschobenen Teil hängen, zieht dieselbe
         Stelle nach wie beim Drehen. Ein Ende NEBEN seiner Klemme an einem
         Teil, das stehen bleibt, rückt die Pfeiltaste nicht — das tat sie nie. */
      const bericht = Schaltplan.nachziehen(z.plan, vorher, teile, { ohne: eigene });
      return { bericht, aenderungen: Schaltplan.veraendert(z.plan, vorher), vorher };
    };

    /* --- Drehen (26), spiegeln (27), doppeln (28), gruppieren (29) -------
       ALLES DREHT ALS GRUPPE (E762, Redur: „ich sollte alles umdrehen
       können"). Ist mehr als ein Ding gewählt — Teile, Leitungen, Texte —,
       dreht und spiegelt die ganze Auswahl um ihre Mitte
       (`Schaltplan.gruppeUmformen`). Ein einzelnes Teil dreht wie bisher an
       seinem Ort; das ist dieselbe Drehung um dieselbe Mitte, nur ohne den
       Umweg über das Raster (test611 misst sie so). */
    const leitungVon = (id: string): any => (z.plan.leitungen as any[]).find(l => l.id === id);
    const textVon = (id: string): any => (z.plan.texte as any[]).find(x => x.id === id);
    const alsGruppe = (): boolean => {
      const ids = [...z.auswahl].filter(id => teilVon(id) || leitungVon(id) || textVon(id));
      return ids.length > 1 || (ids.length === 1 && !teilVon(ids[0]!));
    };
    const gruppeUmformen = (art: 'drehen' | 'spiegeln'): void => aendere(() => {
      const r = Schaltplan.gruppeUmformen(z.plan, z.auswahl, art);
      melde(art === 'drehen' ? 'Drehen' : 'Spiegeln', r.bericht, Schaltplan.veraendert(z.plan, r.vorher), r.vorher);
    });
    const planDrehen = (): void => aendere(() => {
      const r = Schaltplan.planDrehen(z.plan);
      z.ansicht = { zoom: 1, x: 0, y: 0 };
      melde('Drehen', r.bericht, Schaltplan.veraendert(z.plan, r.vorher), r.vorher);
    });
    const drehen = (): void => alsGruppe() ? gruppeUmformen('drehen') : aendere(() => {
      const vorher = Schaltplan.vorherMerken(z.plan);
      const teile = auswahlTeile();
      teile.forEach(t => { t.drehung = ((t.drehung || 0) + 90) % 360; });
      if (teile.length) {
        const bericht = Schaltplan.nachziehen(z.plan, vorher, teile.map(t => t.id), { heilen: true });
        melde('Drehen', bericht, Schaltplan.veraendert(z.plan, vorher), vorher);
      }
    });
    const spiegeln = (): void => alsGruppe() ? gruppeUmformen('spiegeln') : aendere(() => {
      const vorher = Schaltplan.vorherMerken(z.plan);
      const teile = auswahlTeile();
      teile.forEach(t => { t.gespiegelt = !t.gespiegelt; });
      if (teile.length) {
        const bericht = Schaltplan.nachziehen(z.plan, vorher, teile.map(t => t.id), { heilen: true });
        melde('Spiegeln', bericht, Schaltplan.veraendert(z.plan, vorher), vorher);
      }
    });
    const doppeln = (): void => aendere(() => {
      const neu: string[] = [];
      const versatz = Register.fachzeichen.RASTER * 2;
      z.auswahl.forEach(id => {
        const t = teilVon(id);
        if (!t) return;
        const k = { ...t, id: Schaltplan.uid(), x: t.x + versatz, y: t.y + versatz,
                    nummern: { ...t.nummern },
                    bmk: Schaltplan.naechstesBmk(z.plan, t.zeichen) };
        z.plan.teile.push(k);
        neu.push(k.id);
      });
      z.auswahl = new Set(neu);
    });
    const gruppieren = (): void => aendere(() => {
      const teile = [...z.auswahl].map(teilVon).filter(Boolean);
      if (teile.length < 2) return;
      /* Schon alle in derselben Gruppe? Dann heisst der Knopf „auflösen". */
      const erste = teile[0].gruppe;
      const zusammen = erste && teile.every((t: any) => t.gruppe === erste);
      const g = zusammen ? '' : Schaltplan.uid();
      teile.forEach((t: any) => { t.gruppe = g; });
    });
    const loeschen = (): void => aendere(() => {
      z.plan.teile = (z.plan.teile as any[]).filter(t => !z.auswahl.has(t.id));
      z.plan.leitungen = (z.plan.leitungen as any[]).filter(l => !z.auswahl.has(l.id));
      z.plan.texte = (z.plan.texte as any[]).filter(x => !z.auswahl.has(x.id));
      z.auswahl.clear();
    });

    /* Wer ein Teil einer Gruppe anfasst, fasst die ganze Gruppe an (29). */
    const mitGruppe = (id: string): string[] => {
      const t = teilVon(id);
      if (!t || !t.gruppe) return [id];
      return (z.plan.teile as any[]).filter(x => x.gruppe === t.gruppe).map(x => x.id);
    };

    /* --- Schalten, solange die Simulation läuft (Punkt 14) ---------------
     * Ein Tipp geht durch die Stellungen der Reihe nach. Beim Ausschalter
     * sind das zwei, beim Gruppenschalter vier — und weil die Namen aus dem
     * Verhalten kommen, steht in der Anzeige „Gruppe 1+2" und nicht „Stufe 2".
     *
     * Der Zustand wird NICHT gespeichert. Das ist Absicht, nicht Vergesslich-
     * keit: siehe die Begründung am Zustandstyp.
     * --------------------------------------------------------------------- */
    const schalte = (teilId: string): boolean => {
      if (typeof Stromfluss === 'undefined') return false;
      const t = teilVon(teilId);
      if (!t) return false;
      const { st, vh } = schaltart(t.zeichen);
      if (st.length < 2) return false;
      if (vh && vh.folgtSpule) {
        /* Einen Schützkontakt kann man nicht von Hand zuhalten. Wer es
           versucht, soll wissen warum — sonst sucht er den Fehler in der
           Zeichnung. */
        UI.toast(`${t.bmk || 'Dieser Kontakt'} wird von der Spule geschaltet, nicht von Hand.`);
        return true;
      }
      const jetzt = z.stellungen[teilId] || 0;
      z.stellungen[teilId] = (jetzt + 1) % st.length;
      male();
      return true;
    };

    /* Ein Teil ist ein `[data-id]` IM SVG — und nur dort. Der Editor hängt
       an JEDEN Block-Kasten `data-id = block.type` (editor.ts, render):
       von der leeren Fläche aus wanderte `closest('[data-id]')` am SVG
       vorbei bis zum Kasten und hielt jeden Klick für „Teil ‚schaltplan'
       angeklickt". Einfügen, Radieren und das Schalten in der Simulation
       gingen im Seiten-Editor darum ins Leere — vom ersten Tag an, denn
       kein Prüflauf hat je echt geklickt, alle haben über Store gesät
       (E261, gefunden von Redur mit der Maus). */
    const teilAm = (ziel: Element): HTMLElement | null =>
      ziel.closest('svg [data-id]') as HTMLElement | null;

    /* Für die Doppeltipp-Erkennung unten: welcher Teil, wie eben. */
    let letzterTipp = { id: '', zeit: 0 };

    /* --- Ein Zug endet immer, und nur einer läuft (E746, zweite Durchsicht) -
       Ein Zug gehört EINEM Zeiger und endet, wenn dieser loslässt oder
       abbricht — wo auch immer auf der Seite. Bis zur zweiten Durchsicht
       horchte nur die Bühne: der Zeigerfang am SVG geht mit dem ersten
       neuen Bild verloren (`buehneMalen` ersetzt das SVG), und losgelassen
       über der Palette kam das `pointerup` nie an. Der Zug blieb liegen, sein
       Zwischenbild in `z.plan`, und die nächste Handlung speicherte es
       (test611 §13). Und er endet, sobald irgendein Zeiger irgendwo
       aufsetzt: ein zweiter Finger fing bisher einen NEUEN Zug an, nahm das
       Zwischenbild des ersten als „vorher" und liess den ersten liegen.
       Beendet wird ein Zug mit Teilen immer richtig — mit der vollen Suche
       (`teilzugSichern`), nie mit einem Zwischenbild. Die Horcher am
       Dokument hängen nur, solange ein Zug läuft. */
    type Zug = NonNullable<Zustand['zieht']>;
    const zugBeginnen = (zug: Zug): void => {
      z.zieht = zug;
      document.addEventListener('pointerdown', zugUnterbrechen, true);
      document.addEventListener('pointerup', zugEnde, true);
      document.addEventListener('pointercancel', zugEnde, true);
      document.addEventListener('keydown', zugTaste, true);
    };
    const zugLoesen = (): void => {
      z.zieht = null;
      document.removeEventListener('pointerdown', zugUnterbrechen, true);
      document.removeEventListener('pointerup', zugEnde, true);
      document.removeEventListener('pointercancel', zugEnde, true);
      document.removeEventListener('keydown', zugTaste, true);
    };

    /* --- Tasten im Zug, am Dokument gehorcht (E746, dritte Durchsicht) -----
       Mit der Maus steht der Fokus während eines Zugs NICHT auf der Fläche:
       das Anfassen zeichnet sie neu (`male`), der Knoten unter dem Zeiger
       ist danach ein anderer, und der Browser setzt den Fokus beim
       `mousedown` auf die Seite (`body`), weil er an einem Knoten ausserhalb
       des Dokuments keinen fokussierbaren Vorfahren findet. Der Horcher an
       der Wurzel hörte darum mit echter Maus und echter Tastatur nichts:
       Escape brach weder einen Zug mit Teilen noch einen Rahmen ab, und
       Strg+Z nahm der Seitenverlauf (E682) — er baute die Seite neu, und
       der Zug war still verworfen (test611 §14). Deshalb horcht ein Zug auf
       die Tasten so, wie er auf das Loslassen horcht: am Dokument, in der
       Aufnahmephase, nur solange er läuft.
         · Escape bricht den Zug ab. Ist aber ein Menü oder Fenster offen
           (dieselbe Liste wie im gemeinsamen Escape-Griff der Schale),
           schliesst dieser Druck zuerst das — ein Druck, ein Fenster (E711);
           der nächste bricht ab.
         · Rückgängig und Wiederholen (Strg+Z, Umschalt+Strg+Z, Strg+Y, mit
           Cmd ebenso) tun nichts — weder an der Fläche (`zurueck` und
           `vorwaerts` verweigern im Zug ohnehin) noch am Seitenverlauf, der
           die Fläche abhängen und den Zug verwerfen würde. Der Zug läuft
           weiter und wird beim Loslassen gespeichert wie sonst. Auch in
           einem Textfeld: wer die Maus hält, hat den Zug in der Hand.
       Die übrigen Tasten gehen während eines Mauszugs dorthin, wo der Fokus
       steht — auf die Seite, wo „r", „h" und Entf nichts tun und die Pfeile
       sie rollen (L253 Punkt 9). */
    const OFFENES_FENSTER = '.menu, .overlay, dialog[open], .iblatt, #r-blatt.auf';
    const zugTaste = (e: KeyboardEvent): void => {
      if (!z.zieht) return;
      if (e.key === 'Escape') {
        if (document.querySelector(OFFENES_FENSTER)) return;
        e.preventDefault();
        e.stopPropagation();
        zugAbbrechen();
        return;
      }
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === 'z' || (k === 'y' && !e.shiftKey))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    /** Einen Zug mit Teilen sichern — der einzige Weg, auf dem ein Zug in die
     *  Ablage kommt. `z.zieht` ist dabei schon leer, sonst verweigerte
     *  `aendere`. */
    const teilzugSichern = (zug: Zug): void => {
      const bewegt = zug.ausgang.size &&
        [...zug.ausgang].some(([id, a]) => {
          const t = teilVon(id);
          return t && (t.x !== a.x || t.y !== a.y);
        });
      if (!bewegt) {
        const tip = teilKlickStart;
        teilKlickStart = null;
        male();
        if (tip && !tip.schicht) karteOeffnen(tip.id);
        return;
      }
      teilKlickStart = null;
      karteSchliessen();
      /* Erst jetzt die volle Suche, einmal, vom Anfassen aus — die
         Zwischenbilder rechneten nur die billigen Wege, und eines davon
         darf nie gespeichert werden. Sie läuft VOR `aendere`: der
         Rückgängig-Schritt, den `aendere` merkt, ist der Stand vor
         SEINEM Schritt, und ein Zwischenbild darf auch dort nicht
         hinein (zum Rückgängig nach einem Zug: L253 Punkt 8). */
      const vorher = zug.vorher ?? Schaltplan.vorherMerken(z.plan);
      const bericht = Schaltplan.nachziehen(z.plan, vorher, [...zug.ausgang.keys()],
        { heilen: true, vonVorn: true });
      aendere(() => { /* geschoben und nachgezogen — nur sichern */ });
      melde('Ziehen', bericht, Schaltplan.veraendert(z.plan, vorher), vorher);
    };

    /** Ein Zeiger setzt auf, während ein Zug läuft — ein zweiter Finger, oder
     *  derselbe, dessen Loslassen nie ankam. Der Zug endet hier: mit Teilen
     *  gesichert wie beim Loslassen; ein Rahmen oder eine Leitung, deren Ende
     *  niemand gezeigt hat, verfällt. Ist die Fläche nicht mehr im Dokument
     *  (die Seite wurde neu gezeichnet), wird nichts mehr gespeichert — sie
     *  zeigt dann, was die Ablage hält. */
    const zugUnterbrechen = (): void => {
      const zug = z.zieht;
      if (!zug) return;
      zugLoesen();
      if (!wurzel.isConnected) return;
      if (zug.art === 'teil') teilzugSichern(zug);
      else if (zug.art === 'strecke') streckeSichern(zug);
      else if (zug.art === 'radieren') radierenSichern(zug, false);
      else male();
    };

    /** Escape im Zug: zurück auf den Stand beim Anfassen — die Lagen aus
     *  `ausgang`, die Punkte aus `vorher`. Nichts gespeichert, kein
     *  Rückgängig-Schritt; der Zug hat nie stattgefunden. */
    const zugAbbrechen = (): void => {
      const zug = z.zieht;
      if (!zug) return;
      zugLoesen();
      if (zug.art === 'teil' || zug.art === 'strecke') {
        zug.ausgang.forEach((a, id) => {
          const t = teilVon(id);
          if (t) { t.x = a.x; t.y = a.y; }
        });
        const punkte = zug.vorher ? zug.vorher.punkte : null;
        if (punkte) (z.plan.leitungen as any[]).forEach(l => {
          const alt = punkte.get(l.id);
          if (alt) l.punkte = alt.map(q => ({ x: q.x, y: q.y }));
        });
      }
      if (zug.art === 'schwenk') return;
      male();
    };

    /* --- Eine Strecke sichern (E762) -------------------------------------- */
    const streckeSichern = (zug: Zug): void => {
      if (zug.abzugStart === undefined || zug.abzugStart === abzug()) { male(); return; }
      aendere(() => { /* geschoben und geprüft — nur sichern */ }, true, zug.abzugStart);
    };

    /* --- Der Radierer (E762, wie im PDF: E352, E576) ------------------------
     * Redur: „ich sollte wie beim löschen von pdf dort auch so haben entweder
     * mir finger oder masud oder stift oder nur eienzeäne leiter". Ein Kreis
     * folgt dem Zeiger — Maus, Finger, Stift —, und was er berührt, wird
     * markiert und beim Loslassen in EINEM Schritt gelöscht (ein Strg+Z holt
     * den ganzen Wisch zurück). „Nur Leiter" löscht nie ein Teil. Ein Tipp
     * ohne Wisch löscht genau EIN Ding: die nächste Leitung unter dem Kreis
     * (oder, bei „Alles", das Teil unter dem Zeiger). Eine gelöschte Leitung
     * trennt nur sich selbst — die anderen behalten ihre Punkte. */
    const radius = (): number => {
      const g = schirm();
      return z.radierGroesse / ((g.s1 || 1) * z.ansicht.zoom);
    };
    const abstandZuStrecke = (q: Punkt, a: Punkt, b: Punkt): number => {
      const dx = b.x - a.x, dy = b.y - a.y, L = dx * dx + dy * dy;
      const t = L ? Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.y - a.y) * dy) / L)) : 0;
      return Math.hypot(q.x - (a.x + t * dx), q.y - (a.y + t * dy));
    };
    const abstandZuKasten = (q: Punkt, k: { x1: number; y1: number; x2: number; y2: number }): number =>
      Math.hypot(Math.max(k.x1 - q.x, 0, q.x - k.x2), Math.max(k.y1 - q.y, 0, q.y - k.y2));
    const teilKasten = (t: any): { x1: number; y1: number; x2: number; y2: number } => {
      const zc = Register.fachzeichen.holen(t.zeichen);
      const m = Register.fachzeichen.masse(t.zeichen, t.drehung);
      const cx = t.x + (zc ? zc.w : 0) / 2, cy = t.y + (zc ? zc.h : 0) / 2;
      return { x1: cx - m.w / 2, y1: cy - m.h / 2, x2: cx + m.w / 2, y2: cy + m.h / 2 };
    };
    const sichtbarAuf = (ebene: string): boolean => {
      const e = (z.plan.ebenen as any[]).find(x => x.id === ebene);
      return !e || e.sichtbar;
    };
    /** Was der Kreis um `q` berührt, mit Abstand — nur Sichtbares. */
    const radierTreffer = (q: Punkt, r: number): Array<{ id: string; d: number; art: 'leitung' | 'teil' | 'text' }> => {
      const raus: Array<{ id: string; d: number; art: 'leitung' | 'teil' | 'text' }> = [];
      (z.plan.leitungen as any[]).forEach(l => {
        if (!sichtbarAuf(l.ebene)) return;
        let d = Infinity;
        for (let i = 0; i + 1 < l.punkte.length; i++) d = Math.min(d, abstandZuStrecke(q, l.punkte[i], l.punkte[i + 1]));
        if (d <= r) raus.push({ id: l.id, d, art: 'leitung' });
      });
      if (z.radierModus === 'leiter') return raus;
      (z.plan.teile as any[]).forEach(t => {
        if (!sichtbarAuf(t.ebene)) return;
        const d = abstandZuKasten(q, teilKasten(t));
        if (d <= r) raus.push({ id: t.id, d, art: 'teil' });
      });
      (z.plan.texte as any[]).forEach(x => {
        if (!sichtbarAuf(x.ebene)) return;
        const d = abstandZuKasten(q, { x1: x.x - 2, y1: x.y - 12, x2: x.x + String(x.t).length * 7.5, y2: x.y + 3 });
        if (d <= r) raus.push({ id: x.id, d, art: 'text' });
      });
      return raus;
    };
    const radierMarken = (zug: Zug): void => {
      const svg = svgJetzt();
      if (!svg || !zug.weg) return;
      zug.weg.forEach(id => svg.querySelectorAll(`[data-id="${CSS.escape(id)}"]`).forEach(el => el.classList.add('sp-weg')));
    };
    /** Den Kreis von `von` nach `bis` wischen: alles dazwischen zählt. */
    const radierWisch = (zug: Zug, von: Punkt, bis: Punkt): void => {
      const r = radius();
      const n = Math.max(1, Math.ceil(Math.hypot(bis.x - von.x, bis.y - von.y) / Math.max(1, r / 2)));
      for (let k = 0; k <= n; k++) {
        const q = { x: von.x + (bis.x - von.x) * k / n, y: von.y + (bis.y - von.y) * k / n };
        radierTreffer(q, r).forEach(h => zug.weg!.add(h.id));
      }
      radierMarken(zug);
      vorschau(`<circle class="sp-radierkreis" cx="${+bis.x.toFixed(1)}" cy="${+bis.y.toFixed(1)}" r="${+r.toFixed(1)}"/>`);
    };
    const radierenSichern = (zug: Zug, tipp: boolean): void => {
      let weg = [...(zug.weg || [])];
      if (tipp && zug.letzter) {
        /* Ein Tipp: genau ein Ding. Bei „Alles" zuerst das Teil, in dessen
           Kasten der Zeiger liegt, sonst die nächste Leitung, sonst ein Text. */
        const h = radierTreffer(zug.letzter, radius());
        const teil = h.filter(x => x.art === 'teil' && x.d === 0)[0];
        const naechste = (art: string) => h.filter(x => x.art === art).sort((a, b) => a.d - b.d)[0];
        const eins = teil || naechste('leitung') || naechste('text');
        weg = eins ? [eins.id] : [];
      }
      if (!weg.length) { male(); return; }
      const raus = new Set(weg);
      aendere(() => {
        z.plan.teile = (z.plan.teile as any[]).filter(t => !raus.has(t.id));
        z.plan.leitungen = (z.plan.leitungen as any[]).filter(l => !raus.has(l.id));
        z.plan.texte = (z.plan.texte as any[]).filter(x => !raus.has(x.id));
        raus.forEach(id => z.auswahl.delete(id));
      }, true, zug.abzugStart);
    };

    /* --- Zwei Finger: zoomen und verschieben (E762) ------------------------
     * Ein Finger zeichnet, zwei Finger bewegen die Ansicht — wie in jeder
     * Karte. Setzt der zweite auf, endet der Zug des ersten (`zugUnterbrechen`,
     * wie seit E746), und bis der letzte Finger loslässt, zeichnet keiner. */
    const finger = new Map<number, Punkt>();
    let geste: null | { d0: number; P0: Punkt; zoom0: number } = null;
    const fingerMitte = (): Punkt => {
      const ps = [...finger.values()];
      return { x: (ps[0]!.x + ps[1]!.x) / 2, y: (ps[0]!.y + ps[1]!.y) / 2 };
    };
    const fingerAbstand = (): number => {
      const ps = [...finger.values()];
      return Math.hypot(ps[0]!.x - ps[1]!.x, ps[0]!.y - ps[1]!.y);
    };
    const fingerBewegt = (e: PointerEvent): void => {
      if (!finger.has(e.pointerId)) return;
      finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!geste || finger.size < 2) return;
      const m = fingerMitte();
      zoomSetzen(geste.zoom0 * fingerAbstand() / (geste.d0 || 1), geste.P0, m.x, m.y);
    };
    const fingerWeg = (e: PointerEvent): void => {
      if (!finger.delete(e.pointerId)) return;
      if (finger.size) return;
      geste = null;
      document.removeEventListener('pointermove', fingerBewegt, true);
      document.removeEventListener('pointerup', fingerWeg, true);
      document.removeEventListener('pointercancel', fingerWeg, true);
    };

    /* --- Ein-Gesten-Platzierung (E770) mit Maus, Finger und Stift ----
     * Ein Symbol aus Palette/Studio zum Blatt ziehen statt erst auswählen,
     * dann klicken. Der Zug gehört dem Pointer, nicht einem SVG-Knoten, der
     * bei einer Neuzeichnung ersetzt wird. Während des Zugs wird ausschliesslich
     * der CSS-Geist bewegt; erst beim Loslassen geschieht EIN `aendere`.
     * Tap/Klick auf eine Karte bleibt die barrierefreie bisherige Alternative. */
    type PlatzOrt = { x: number; y: number; sx: number; sy: number };
    type PlatzZug = { id: string; pointerId: number; startX: number; startY: number;
                      bewegt: boolean; art: string };
    let platzZug: PlatzZug | null = null;
    let platzGeist: HTMLElement | null = null;
    let platzGeistId = '';
    let platzBildFrame = 0;
    let platzKlickBlockBis = 0;
    let platzLetzteBild: { x: number; y: number; ok: boolean } | null = null;

    const geistEntfernen = (): void => {
      if (platzBildFrame) cancelAnimationFrame(platzBildFrame);
      platzBildFrame = 0; platzLetzteBild = null;
      platzGeist?.remove(); platzGeist = null; platzGeistId = '';
    };
    const platzOrt = (clientX: number, clientY: number): PlatzOrt | null => {
      const svg = svgJetzt();
      if (!svg || !wurzel.isConnected) return null;
      const unter = document.elementFromPoint(clientX, clientY);
      if (!unter || !leinwand.contains(unter)) return null;
      const roh = ortAus(svg, { clientX, clientY }, z.plan, true);
      if (roh.x < 0 || roh.y < 0 || roh.x > z.plan.breite || roh.y > z.plan.hoehe) return null;
      const p = ortAus(svg, { clientX, clientY }, z.plan);
      const m = svg.getScreenCTM();
      const bild = m ? new DOMPoint(p.x, p.y).matrixTransform(m) : null;
      return { x: p.x, y: p.y, sx: bild?.x ?? clientX, sy: bild?.y ?? clientY };
    };
    const platzGeistZeigen = (id: string, clientX: number, clientY: number): PlatzOrt | null => {
      const ort = platzOrt(clientX, clientY);
      if (!platzGeist || platzGeistId !== id) {
        geistEntfernen();
        platzGeist = document.createElement('div');
        platzGeist.className = 'sp-platziergeist';
        platzGeist.setAttribute('aria-hidden', 'true');
        const bild = document.createElement('div'); bild.className = 'sp-platziergeist-bild';
        bild.innerHTML = Register.fachzeichen.alsSvg(id, { strich: 2 });
        const name = document.createElement('span');
        name.textContent = Register.fachzeichen.holen(id)?.name || id;
        platzGeist.append(bild, name);
        document.body.appendChild(platzGeist);
        platzGeistId = id;
      }
      platzLetzteBild = { x: ort?.sx ?? clientX, y: ort?.sy ?? clientY, ok: !!ort };
      if (!platzBildFrame) platzBildFrame = requestAnimationFrame(() => {
        platzBildFrame = 0;
        const el = platzGeist, pos = platzLetzteBild;
        if (!el || !pos || !wurzel.isConnected) { geistEntfernen(); return; }
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;
        el.classList.toggle('sp-platziergeist-gueltig', pos.ok);
      });
      return ort;
    };
    const platzZugAbbrechen = (): void => {
      platzZug = null;
      document.removeEventListener('pointermove', platzZugBewegen, true);
      document.removeEventListener('pointerup', platzZugEnde, true);
      document.removeEventListener('pointercancel', platzZugCancel, true);
      document.removeEventListener('pointerdown', platzZugZweiterFinger, true);
      document.removeEventListener('keydown', platzZugEscape, true);
      geistEntfernen();
    };
    const platzZugZweiterFinger = (e: PointerEvent): void => {
      if (platzZug && e.pointerId !== platzZug.pointerId) platzZugAbbrechen();
    };
    const platzZugEscape = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.preventDefault(); e.stopPropagation(); platzZugAbbrechen();
    };
    const platzZugBewegen = (e: PointerEvent): void => {
      const zug = platzZug;
      if (!zug || e.pointerId !== zug.pointerId) return;
      if (!wurzel.isConnected) { platzZugAbbrechen(); return; }
      const strecke = Math.hypot(e.clientX - zug.startX, e.clientY - zug.startY);
      if (!zug.bewegt && strecke < (zug.art === 'touch' ? 10 : 6)) return;
      zug.bewegt = true;
      e.preventDefault();
      platzGeistZeigen(zug.id, e.clientX, e.clientY);
    };
    const platzZugCancel = (e: PointerEvent): void => {
      if (platzZug && e.pointerId === platzZug.pointerId) platzZugAbbrechen();
    };
    const platzZugEnde = (e: PointerEvent): void => {
      const zug = platzZug;
      if (!zug || zug.pointerId !== e.pointerId) return;
      const ort = zug.bewegt && !z.simulation && !z.zieht
        ? platzOrt(e.clientX, e.clientY) : null;
      platzZugAbbrechen();
      if (!zug.bewegt) return; // normaler Klick wählt weiterhin ein Symbol
      platzKlickBlockBis = Date.now() + 380; // synthetischen Klick nach Touch-Drag abfangen
      if (!ort || !wurzel.isConnected) return; // ausserhalb: niemals still speichern
      /* Die Karte wird nicht fest in den DOM verankert: der Rasterfang
         rechnet über dieselbe Matrix wie Leitungen und die normale Auswahl. */
      studioZeichenWahl(zug.id, false);
      const neu = setzeSymbol(zug.id, ort.x, ort.y);
      paletteMalen((palette.querySelector('input') as HTMLInputElement)?.value || '');
      if (neu) {
        const puls = document.createElement('div');
        puls.className = 'sp-platzierpuls'; puls.setAttribute('aria-hidden', 'true');
        puls.style.left = `${ort.sx}px`; puls.style.top = `${ort.sy}px`;
        document.body.appendChild(puls);
        puls.addEventListener('animationend', () => puls.remove(), { once: true });
        setTimeout(() => puls.remove(), 800); // reduzierte Bewegung: kein animationend
      }
    };
    const platzQuelle = (e: PointerEvent): void => {
      const ziel = e.target as Element;
      const b = ziel.closest<HTMLElement>('[data-st-symbol], [data-sym]');
      const id = b?.dataset.stSymbol || b?.dataset.sym;
      if (!id || e.button !== 0 || e.altKey || z.simulation || z.zieht || platzZug ||
          !Register.fachzeichen.holen(id)) return;
      platzZug = { id, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY,
                    bewegt: false, art: e.pointerType };
      document.addEventListener('pointermove', platzZugBewegen, { capture: true, passive: false });
      document.addEventListener('pointerup', platzZugEnde, true);
      document.addEventListener('pointercancel', platzZugCancel, true);
      document.addEventListener('pointerdown', platzZugZweiterFinger, true);
      document.addEventListener('keydown', platzZugEscape, true);
      /* Touch darf nicht zum Blättern des Fensters umgedeutet werden. Die
         übrige Seitenleiste kann weiterhin durch freie Flächen scrollen. */
      if (e.pointerType !== 'mouse') e.preventDefault();
    };
    palette.addEventListener('pointerdown', platzQuelle);
    studioPanel.addEventListener('pointerdown', platzQuelle);

    /* --- Einzelne Bauteile direkt bei der Auswahl bearbeiten -------
     * Der Karteninhalt wird aus dem aktuellen Plan gelesen, niemals als
     * zweites Bauteil gespeichert. Alle Änderungen laufen über aendere. */
    const karteSchliessen = (): void => {
      karteId = '';
      schnellkarte.hidden = true;
      schnellkarte.replaceChildren();
    };
    const istZeitspule = (t: any): boolean =>
      t.zeichen === 'spule-anzugsverzoegert' || t.zeichen === 'spule-abfallverzoegert';
    const spalteVon = (t: any): string =>
      (window as any).RelaisKern?.spaltenTitel?.(z.plan, t) || '';
    const karteMalen = (): void => {
      const t = karteId && teilVon(karteId);
      if (!t || z.simulation) { karteSchliessen(); return; }
      const sym = Register.fachzeichen.holen(t.zeichen);
      const original = spalteVon(t);
      const zeit = istZeitspule(t);
      schnellkarte.hidden = false;
      schnellkarte.innerHTML =
        `<div class="sp-schnellkarte-kopf"><div><b>${esc(sym?.name || t.zeichen)}</b>` +
        `<small>Bauteil · ${esc(t.bmk || 'ohne Kennzeichen')}</small></div>` +
        `<button type="button" data-sk="zu" aria-label="Eigenschaftenkarte schliessen">✕</button></div>` +
        `<form data-sk-form><label>Beschriftung` +
        `<input name="beschriftung" maxlength="120" autocomplete="off" placeholder="z. B. Hauptschütz, Alarm, Motor rechts" value="${esc(t.beschriftung || '')}"></label>` +
        `<label>Betriebsmittelkennzeichen` +
        `<input name="bmk" maxlength="40" autocomplete="off" value="${esc(t.bmk || '')}"></label>` +
        (zeit ? `<label>Verzögerung in Sekunden` +
          `<input type="number" min="0" max="3600" step="0.1" name="verzoegerung" value="${Number.isFinite(t.werte?.T) ? t.werte.T : 3}"></label>` : '') +
        (original ? `<div class="sp-schnellkarte-original"><small>Original-Spaltenüberschrift (${Number(t.legacySpalte) + 1}):</small>` +
          `<span>${esc(original)}</span><button type="button" data-sk="spalte">Als Beschriftung übernehmen</button>` +
          `<small>Die Zuordnung ist eine manuelle Entscheidung, keine bestätigte Originalverbindung.</small></div>` : '') +
        `<div class="sp-schnellkarte-aktionen"><button class="prim" type="submit">Speichern</button>` +
        `<button type="button" data-sk="details">Anschlüsse</button></div></form>` +
        `<p class="sp-schnellkarte-hilfe">Einmal antippen zum Bearbeiten · Zum Verschieben ziehen</p>`;
    };
    const karteOeffnen = (id: string): void => {
      if (!teilVon(id) || z.simulation) return;
      karteId = id;
      studioTab = 'eigenschaften';
      if (studioOffen) studioMalen();
      karteMalen();
    };
    schnellkarte.addEventListener('pointerdown', e => e.stopPropagation());
    schnellkarte.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-sk]');
      if (!b) return;
      const t = teilVon(karteId);
      if (b.dataset.sk === 'zu') { karteSchliessen(); return; }
      if (!t || z.simulation) return;
      if (b.dataset.sk === 'spalte') {
        const feld = schnellkarte.querySelector<HTMLInputElement>('[name="beschriftung"]');
        if (feld) { feld.value = spalteVon(t); feld.focus(); }
        return;
      }
      if (b.dataset.sk === 'details') { karteSchliessen(); teilDialog(t); }
    });
    schnellkarte.addEventListener('submit', e => {
      const form = (e.target as Element).closest<HTMLFormElement>('[data-sk-form]');
      if (!form) return;
      e.preventDefault();
      const t = teilVon(karteId);
      if (!t || z.simulation || z.zieht) return;
      const bmk = (form.elements.namedItem('bmk') as HTMLInputElement).value.trim().slice(0, 40);
      const beschriftung = (form.elements.namedItem('beschriftung') as HTMLInputElement).value.trim().slice(0, 120);
      const zeitFeld = form.elements.namedItem('verzoegerung') as HTMLInputElement | null;
      const sekunden = zeitFeld ? Number(zeitFeld.value) : null;
      if (zeitFeld && (!zeitFeld.value.trim() || !Number.isFinite(sekunden) || sekunden! < 0 || sekunden! > 3600)) {
        zeitFeld.setCustomValidity('Bitte 0 bis 3600 Sekunden eingeben.');
        zeitFeld.reportValidity(); return;
      }
      if (t.bmk !== bmk || (t.beschriftung || '') !== beschriftung ||
          (zeitFeld && (Number.isFinite(t.werte?.T) ? t.werte.T : 3) !== sekunden)) {
        aendere(() => {
          t.bmk = bmk;
          if (beschriftung) t.beschriftung = beschriftung;
          else delete t.beschriftung;
          if (zeitFeld) t.werte = { ...(t.werte || {}), T: sekunden };
        });
      }
      karteMalen();
    });

    /* Die Kontextleiste ist UI, keine gezeichnete Schaltung. */
    kontextleiste.addEventListener('pointerdown', e => e.stopPropagation());
    kontextleiste.addEventListener('click', e => {
      const knop = (e.target as Element).closest<HTMLElement>('[data-kontext]');
      if (!knop || z.simulation || z.zieht) return;
      const aktion = knop.dataset.kontext;
      if (aktion === 'abwahl') { z.auswahl.clear(); karteSchliessen(); male(); return; }
      if (aktion === 'eigenschaften') {
        studioOffen = true; studioTab = 'eigenschaften'; studioPanel.hidden = false;
        paletteOffen = false; palette.hidden = true;
        wurzel.classList.remove('sp-palette-offen');
        studioMalen(); kopfMalen(); return;
      }
      ({ drehen, spiegeln, doppeln, loeschen } as Record<string, () => void>)
        [aktion || '']?.();
    });

    /* --- Zeigerereignisse ------------------------------------------------ */
    buehne.addEventListener('pointerdown', e => {
      if ((e.target as Element).closest('.sp-schnellkarte,.sp-kontextleiste')) return;
      const svg = svgJetzt();
      if (!svg) return;
      if (e.pointerType === 'touch') {
        if (!finger.size) {
          document.addEventListener('pointermove', fingerBewegt, true);
          document.addEventListener('pointerup', fingerWeg, true);
          document.addEventListener('pointercancel', fingerWeg, true);
        }
        finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (finger.size === 2) {
          const m = fingerMitte();
          geste = { d0: fingerAbstand(), P0: planAm(m.x, m.y), zoom0: z.ansicht.zoom };
          return;
        }
      }
      if (geste || finger.size > 2) return;
      const ziel = e.target as Element;
      const roh = ortAus(svg, e, z.plan, true);
      const p = ortAus(svg, e, z.plan);

      /* Die Ansicht verschieben (E762): mittlere Taste, oder Leertaste und
         Ziehen. Das geht immer, auch in der Simulation. */
      if (e.button === 1 || (z.leertaste && e.button === 0)) {
        e.preventDefault();
        zugBeginnen({ art: 'schwenk', zeiger: e.pointerId, startX: 0, startY: 0, ausgang: new Map(),
                      schirm: { x: e.clientX, y: e.clientY } });
        svg.setPointerCapture(e.pointerId);
        return;
      }
      /* Das Radierende eines Stifts radiert, welches Werkzeug auch gewählt
         ist — wie im PDF (E352). */
      const stiftRadiert = e.pointerType === 'pen' && (e.button === 5 || (e.buttons & 32) !== 0);
      if (e.button !== 0 && !stiftRadiert) return;

      /* Läuft die Simulation, ist die Fläche kein Zeichenbrett mehr, sondern
         eine Schalttafel. Nichts wird verschoben, nichts gelöscht — man kann
         den Plan beim Ausprobieren nicht versehentlich kaputt machen. */
      if (z.simulation) {
        const g = teilAm(ziel);
        if (!g || !g.dataset.id) return;
        /* TASTER FEDERN ZURÜCK (E768): gedrückt nur, solange der Zeiger
           unten ist — wie in echt. Ein Schalter rastet weiter. */
        const teil = (z.plan.teile as any[]).find(t => t.id === g.dataset.id);
        if (teil && (teil.zeichen === 'taster-schliesser' || teil.zeichen === 'taster-oeffner')) {
          const id = String(teil.id);
          const los = (): void => {
            document.removeEventListener('pointerup', los, true);
            document.removeEventListener('pointercancel', los, true);
            if (z.simulation) { z.stellungen[id] = 0; male(); }
          };
          document.addEventListener('pointerup', los, true);
          document.addEventListener('pointercancel', los, true);
          z.stellungen[id] = 1; male();
          return;
        }
        schalte(g.dataset.id);
        return;
      }

      if (z.werkzeug === 'radieren' || stiftRadiert) {
        const zug: Zug = { art: 'radieren', zeiger: e.pointerId, startX: e.clientX, startY: e.clientY,
                           ausgang: new Map(), abzugStart: abzug(), weg: new Set(), letzter: roh, gewandert: false };
        zugBeginnen(zug);
        svg.setPointerCapture(e.pointerId);
        radierWisch(zug, roh, roh);
        return;
      }

      if (z.werkzeug === 'text') {
        void (async () => {
          const t = await UI.frage('Beschriftung', '');
          if (t) aendere(() => z.plan.texte.push({
            id: Schaltplan.uid(), x: p.x, y: p.y, t, ebene: aktiveEbene() }));
        })();
        return;
      }

      if (z.werkzeug === 'schiene') {
        zugBeginnen({ art: 'schiene', zeiger: e.pointerId, startX: p.x, startY: p.y, ausgang: new Map() });
        svg.setPointerCapture(e.pointerId);
        return;
      }

      if (z.werkzeug === 'leitung') {
        const fang = Schaltplan.fangeAnschluss(z.plan, roh, anschlussFangRadius(svg, e.pointerType));
        zugBeginnen({ art: 'leitung', zeiger: e.pointerId, startX: p.x, startY: p.y, ausgang: new Map(),
                      von: fang ? { x: fang.x, y: fang.y, teil: fang.teil, nr: fang.nr }
                                : { x: p.x, y: p.y } });
        svg.setPointerCapture(e.pointerId);
        return;
      }

      /* Werkzeug „zeigen" */
      const g = teilAm(ziel);
      if (!g || !g.dataset.id) {
        /* Auf leere Fläche: Symbol setzen, oder Rahmen aufziehen. */
        if (z.gewaehltesZeichen) {
          geistEntfernen();
          setzeSymbol(z.gewaehltesZeichen, p.x, p.y);
          return;
        }
        if (!e.shiftKey) { z.auswahl.clear(); karteSchliessen(); }
        zugBeginnen({ art: 'rahmen', zeiger: e.pointerId, startX: p.x, startY: p.y, ausgang: new Map() });
        svg.setPointerCapture(e.pointerId);
        male();
        return;
      }

      const id = g.dataset.id;

      /* LEITER SCHIEBEN (E762): wer eine Leitung an einer Strecke anfasst,
         wählt sie und zieht diese Strecke quer — die Enden bleiben auf ihren
         Klemmen, und wohin sie etwas Neues berühren würde, folgt sie nicht
         (`Schaltplan.streckeSchieben`). */
      const leitung = g.classList.contains('sp-leitung') ? leitungVon(id) : null;
      if (leitung) {
        if (e.shiftKey) { if (z.auswahl.has(id)) z.auswahl.delete(id); else z.auswahl.add(id); }
        else if (!z.auswahl.has(id)) z.auswahl = new Set([id]);
        let i = 0, best = Infinity;
        for (let k = 0; k + 1 < leitung.punkte.length; k++) {
          const d = abstandZuStrecke(roh, leitung.punkte[k], leitung.punkte[k + 1]);
          if (d < best) { best = d; i = k; }
        }
        const a = leitung.punkte[i], b = leitung.punkte[i + 1];
        if (a && b && (a.x === b.x || a.y === b.y)) {
          zugBeginnen({ art: 'strecke', zeiger: e.pointerId, startX: roh.x, startY: roh.y, ausgang: new Map(),
                        vorher: Schaltplan.vorherMerken(z.plan), abzugStart: abzug(),
                        strecke: { lid: id, i, waag: a.y === b.y, d: 0 } });
          svg.setPointerCapture(e.pointerId);
        }
        male();
        return;
      }

      /* Doppeltipp aufs Teil: sein Dialog (Betriebsmittel, Anschlüsse,
         Punkte 18/19). Von Hand erkannt, nicht über das native dblclick —
         das stirbt hier zweimal: der erste Klick wählt aus und zeichnet die
         Fläche neu, der zweite trifft einen NEUEN Knoten, und der Browser
         zählt Klicks nur auf demselben weiter. Und am Telefon gibt es gar
         kein dblclick. Gemessen mit test263 §2: null Ereignisse (E261). */
      const jetztMs = Date.now();
      if (letzterTipp.id === id && jetztMs - letzterTipp.zeit < 400) {
        letzterTipp = { id: '', zeit: 0 };
        const t = teilVon(id);
        if (t) { karteSchliessen(); teilDialog(t); return; }
      }
      letzterTipp = { id, zeit: jetztMs };

      const gruppe = mitGruppe(id);
      if (e.shiftKey) gruppe.forEach(x => z.auswahl.has(x) ? z.auswahl.delete(x) : z.auswahl.add(x));
      else if (!z.auswahl.has(id)) z.auswahl = new Set(gruppe);

      const ausgang = new Map<string, { x: number; y: number }>();
      z.auswahl.forEach(x => {
        const t = teilVon(x);
        if (t) ausgang.set(x, { x: t.x, y: t.y });
      });
      teilKlickStart = { id, x: e.clientX, y: e.clientY, schicht: e.shiftKey };
      zugBeginnen({ art: 'teil', zeiger: e.pointerId, startX: p.x, startY: p.y, ausgang,
                    vorher: Schaltplan.vorherMerken(z.plan),
                    lage: [...ausgang.values()].map(a => a.x + ',' + a.y).join(';') });
      svg.setPointerCapture(e.pointerId);
      male();
    });

    buehne.addEventListener('pointermove', e => {
      if (!z.zieht) {
        /* Maus und Hover-fähiger Stift: vor dem Klick schon sehen, wo die
           Komponente im Raster landet. Auf Touch erscheint die Vorschau
           erst beim direkten Ziehen aus der Palette. */
        if (!platzZug && e.pointerType !== 'touch' && !e.buttons &&
            !z.simulation && z.werkzeug === 'zeigen' && z.gewaehltesZeichen)
          platzGeistZeigen(z.gewaehltesZeichen, e.clientX, e.clientY);
        else if (!platzZug) geistEntfernen();
        return;
      }
      if (e.pointerId !== z.zieht.zeiger) return;
      const svg = svgJetzt();
      if (!svg) return;
      const zug = z.zieht;

      if (zug.art === 'schwenk') {
        const s0 = zug.schirm || { x: e.clientX, y: e.clientY };
        schwenken(e.clientX - s0.x, e.clientY - s0.y);
        zug.schirm = { x: e.clientX, y: e.clientY };
        return;
      }
      if (zug.art === 'radieren') {
        const roh = ortAus(svg, e, z.plan, true);
        if (Math.hypot(e.clientX - zug.startX, e.clientY - zug.startY) > 4) zug.gewandert = true;
        radierWisch(zug, zug.letzter || roh, roh);
        zug.letzter = roh;
        return;
      }
      if (zug.art === 'strecke' && zug.strecke && zug.vorher) {
        const roh = ortAus(svg, e, z.plan, true);
        const st = zug.strecke;
        const d = Schaltplan.rasten(st.waag ? roh.y - zug.startY : roh.x - zug.startX);
        if (d === st.d) return;
        const neu = Schaltplan.streckeSchieben(z.plan, zug.vorher, st.lid, st.i, d);
        if (!neu) return;           /* dorthin nicht — die letzte gute Lage bleibt */
        const l = leitungVon(st.lid);
        if (l) l.punkte = neu;
        st.d = d;
        teilweiseMalen([]);
        return;
      }

      const p = ortAus(svg, e, z.plan);

      if (zug.art === 'teil') {
        const dx = p.x - zug.startX, dy = p.y - zug.startY;
        zug.ausgang.forEach((a, id) => {
          const t = teilVon(id);
          if (t) { t.x = Schaltplan.rasten(a.x + dx); t.y = Schaltplan.rasten(a.y + dy); }
        });
        /* Steht jedes gezogene Teil noch auf demselben Raster wie beim
           letzten Bild, gibt es nichts zu rechnen und nichts neu zu zeichnen.
           (Eine Maus meldet viele Bewegungen je Raster.) */
        const lage = [...zug.ausgang.keys()].map(id => {
          const t = teilVon(id);
          return t ? t.x + ',' + t.y : '';
        }).join(';');
        if (lage === zug.lage) return;
        zug.lage = lage;
        /* Jede Bewegung rechnet vom Anfassen aus (`vonVorn`), nicht vom
           letzten Zwischenstand — sonst hinge der Weg davon ab, wie schnell
           die Maus war. Ist nichts über ein Raster gewandert, bleibt alles
           wie beim Anfassen. Und sie rechnet `schnell`: nur die billigen
           Wege, keine Z- und Hakenwege. Das ist ein Zwischenbild — die
           volle Suche läuft beim Loslassen, und nur sie wird gespeichert
           (`zugEnde`). Gemessen (messungen §103, F1 um 120 × 60 px in 60
           Bewegungen, CPU vierfach gedrosselt, drei Läufe): mit der vollen
           Suche je Bewegung im Median 23,9 bis 29,4 ms, höchstens 126,8 bis
           217,3 ms; billig 2,5 bis 2,8 ms, höchstens 13,2 ms. Und seit E762
           baut das Bild dabei das SVG nicht mehr neu (`teilweiseMalen`). */
        const gewandert = [...zug.ausgang].some(([id, a]) => {
          const t = teilVon(id);
          return t && (t.x !== a.x || t.y !== a.y);
        });
        const vorher = zug.vorher ?? (zug.vorher = Schaltplan.vorherMerken(z.plan));
        Schaltplan.nachziehen(z.plan, vorher, gewandert ? [...zug.ausgang.keys()] : [],
          { heilen: gewandert, vonVorn: true, schnell: true });
        teilweiseMalen(zug.ausgang.keys());
        return;
      }
      /* Vorschau beim Leitungziehen, beim Rahmen und bei der Schiene — ohne
         den Plan zu ändern, damit ein abgebrochener Zug nichts hinterlässt,
         und ohne das SVG neu zu bauen (E762). */
      if (zug.art === 'leitung' && zug.von) {
        const fang = Schaltplan.fangeAnschluss(z.plan, ortAus(svg, e, z.plan, true), anschlussFangRadius(svg, e.pointerType));
        const bis = fang ? { x: fang.x, y: fang.y } : p;
        const schluessel = bis.x + ',' + bis.y;
        if (schluessel === zug.vorschauEnde) return;
        zug.vorschauEnde = schluessel;
        const punkte = Schaltplan.leitungFuehren(z.plan, zug.von, bis,
          zug.von.teil ? { teil: zug.von.teil, nr: zug.von.nr ?? '' } : null,
          fang ? { teil: fang.teil, nr: fang.nr } : null, { schnell: true });
        const d = punkte.map((q: any, i: number) => (i ? 'L' : 'M') + q.x + ',' + q.y).join(' ');
        vorschau(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" ` +
          `stroke-dasharray="4 3" opacity=".7"/>` +
          (fang ? `<circle cx="${fang.x}" cy="${fang.y}" r="7" fill="none" ` +
                  `stroke="currentColor" stroke-width="2" opacity=".8"/>` : ''));
        return;
      }
      if (zug.art === 'schiene') {
        const b = schieneEnde({ x: zug.startX, y: zug.startY }, p);
        vorschau(`<path d="M${zug.startX},${zug.startY} L${b.x},${b.y}" fill="none" stroke="currentColor" ` +
          `stroke-width="3.5" stroke-dasharray="6 4" opacity=".75"/>` +
          `<text x="${zug.startX + 6}" y="${zug.startY - 8}" font-size="13" fill="currentColor" stroke="none">${esc(z.schieneArt)}</text>`);
        return;
      }
      if (zug.art === 'rahmen') {
        const x = Math.min(zug.startX, p.x), y = Math.min(zug.startY, p.y);
        vorschau(`<rect x="${x}" y="${y}" width="${Math.abs(p.x - zug.startX)}" ` +
          `height="${Math.abs(p.y - zug.startY)}" fill="currentColor" ` +
          `fill-opacity=".07" stroke="currentColor" stroke-dasharray="4 3"/>`);
      }
    });

    buehne.addEventListener('pointerleave', () => { if (!platzZug) geistEntfernen(); });

    /** Eine Schiene ist gerade: sie folgt der Richtung, in die mehr gezogen wurde. */
    const schieneEnde = (a: Punkt, p: Punkt): Punkt =>
      Math.abs(p.x - a.x) >= Math.abs(p.y - a.y) ? { x: p.x, y: a.y } : { x: a.x, y: p.y };

    /** Der ziehende Zeiger lässt los oder bricht ab (am Dokument gehorcht,
     *  solange der Zug läuft — siehe `zugBeginnen`). */
    const zugEnde = (e: PointerEvent): void => {
      if (!z.zieht || e.pointerId !== z.zieht.zeiger) return;
      const zug = z.zieht;
      zugLoesen();
      if (!wurzel.isConnected) return;
      const svg = svgJetzt();
      const p = svg ? ortAus(svg, e, z.plan) : { x: 0, y: 0 };

      if (zug.art === 'schwenk') return;
      if (zug.art === 'teil') {
        if (teilKlickStart && Math.hypot(e.clientX - teilKlickStart.x,
          e.clientY - teilKlickStart.y) > 9) teilKlickStart = null;
        teilzugSichern(zug); return;
      }
      if (zug.art === 'strecke') { streckeSichern(zug); return; }
      if (zug.art === 'radieren') { radierenSichern(zug, !zug.gewandert); return; }

      /* Ein Rahmen oder eine Leitung, losgelassen AUSSERHALB der Fläche,
         verfällt: ihr Ende läge irgendwo neben dem Plan. Bis zur zweiten
         Durchsicht kam so ein Loslassen gar nicht an (siehe oben). */
      /* Gefragt wird die STELLE, nicht das Ziel: der Zug hält den Zeiger am
         SVG fest (seit E762 wird es während des Zugs nicht mehr ersetzt),
         also ist `e.target` immer das SVG — auch über der Palette. */
      const unter = document.elementFromPoint(e.clientX, e.clientY);
      if (!unter || !buehne.contains(unter)) { male(); return; }

      if (zug.art === 'rahmen') {
        inRahmen({ x: zug.startX, y: zug.startY }, p).forEach(id => z.auswahl.add(id));
        male();
        return;
      }

      if (zug.art === 'schiene') {
        const a = { x: zug.startX, y: zug.startY };
        const b = schieneEnde(a, p);
        if (a.x === b.x && a.y === b.y) { male(); return; }
        const art = z.schieneArt;
        aendere(() => {
          const ebene = aktiveEbene();
          z.plan.leitungen.push({ id: Schaltplan.uid(), punkte: [a, b], ebene, schiene: art });
          /* Die Beschriftung am Anfang, auf dem Raster (`lesen` rastet Texte):
             links neben einer waagrechten Schiene, wenn dort Platz ist, sonst
             darüber; neben einer senkrechten rechts oben. */
          const waag = a.y === b.y;
          const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
          const R = Register.fachzeichen.RASTER;
          const ort = waag
            ? (x0 - 3 * R >= 0 ? { x: x0 - 3 * R, y: a.y } : { x: x0, y: a.y - R })
            : { x: a.x + R, y: y0 + R };
          z.plan.texte.push({ id: Schaltplan.uid(), x: ort.x, y: ort.y, t: art, ebene });
        });
        return;
      }

      if (zug.art === 'leitung' && zug.von) {
        // Kein SVG mehr: einen beendeten Zug nicht als neue Leitung speichern.
        if (!svg) { male(); return; }
        const fang = Schaltplan.fangeAnschluss(z.plan, ortAus(svg, e, z.plan, true), anschlussFangRadius(svg, e.pointerType));
        const bis = fang ? { x: fang.x, y: fang.y } : p;
        if (bis.x === zug.von.x && bis.y === zug.von.y) { male(); return; }
        /* Geführt, nicht nur gewinkelt (E762): der Weg berührt nur, was an
           seinen Enden gemeint ist, und läuft auf keiner anderen Leitung. */
        const punkte = Schaltplan.leitungFuehren(z.plan, { x: zug.von.x, y: zug.von.y }, bis,
          zug.von.teil ? { teil: zug.von.teil, nr: zug.von.nr ?? '' } : null,
          fang ? { teil: fang.teil, nr: fang.nr } : null);
        aendere(() => z.plan.leitungen.push({
          id: Schaltplan.uid(),
          punkte,
          ebene: aktiveEbene(),
          vonTeil: zug.von!.teil, vonNr: zug.von!.nr,
          nachTeil: fang ? fang.teil : undefined, nachNr: fang ? fang.nr : undefined
        }));
      }
    };

    /* Das Rad (E762): mit Strg oder ⌘ — und so meldet ein Trackpad auch das
       Auseinanderziehen zweier Finger — zoomt es um den Zeiger. Ohne Strg
       verschiebt es die Ansicht, aber nur, wenn es etwas zu verschieben gibt
       (gezoomt, verschoben oder im Vollbild): sonst rollt es die Seite wie
       bisher, und ein Plan mitten auf der Seite fängt das Rollen nicht ab. */
    const radGesehen = new WeakSet<Event>();
    const rad = (e: WheelEvent): void => {
      if (radGesehen.has(e) || !buehne.contains(e.target as Node)) return;
      radGesehen.add(e);
      if (!svgJetzt()) return;
      const schritt = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomUm(Math.exp(-e.deltaY * schritt * 0.0015), e.clientX, e.clientY);
        return;
      }
      const a = z.ansicht;
      if (!z.voll && a.zoom === 1 && !a.x && !a.y) return;
      e.preventDefault();
      const quer = e.shiftKey && !e.deltaX;
      schwenken(-(quer ? e.deltaY : e.deltaX) * schritt, -(quer ? 0 : e.deltaY) * schritt);
    };
    buehne.addEventListener('wheel', rad, { passive: false });
    /* Im Vollbild horcht das Rad zusätzlich am Dokument. Gemessen (test625
       §10, 1300 × 860): nach dem Umzug der Fläche an den `body` kam das erste
       Strg+Rad gar nicht bei ihr an — Chromium kennt die Stelle mit dem
       Horcher erst nach dem nächsten Neuzeichnen und rollte oder zoomte so
       lange am Horcher vorbei. Am Dokument gibt es diese Lücke nicht; das
       WeakSet sorgt dafür, dass ein Rad nur einmal zählt. */
    const vollRad = (e: WheelEvent): void => rad(e);
    /* NACH DEM WECHSEL IN DEN VOLLBILDMODUS NEU HORCHEN. Gemessen (test625
       §10, 1300 × 860, Chromium 141): nach `requestFullscreen` kam kein
       einziges Rad mehr bei der Seite an — weder an der Bühne noch am
       Dokument —, bis irgendein Horcher neu angemeldet wurde. Der Browser
       vergisst beim Wechsel offenbar, dass die Seite ein Rad haben will.
       Das Neu-Anmelden der eigenen (blockierenden) Horcher half NICHT; erst
       ein zusätzlicher passiver Horcher, NACH dem Wechsel angemeldet, brachte
       die Räder zurück (gemessen: rot ohne, grün mit, je zweimal). Er tut
       nichts und hängt nur, solange das Vollbild steht. */
    const leerRad = (): void => { /* nur angemeldet sein */ };
    const radNeuAnmelden = (): void => {
      buehne.removeEventListener('wheel', rad);
      buehne.addEventListener('wheel', rad, { passive: false });
      if (!z.voll) return;
      document.removeEventListener('wheel', vollRad, { capture: true } as EventListenerOptions);
      document.addEventListener('wheel', vollRad, { passive: false, capture: true });
      document.removeEventListener('wheel', leerRad, { capture: true } as EventListenerOptions);
      document.addEventListener('wheel', leerRad, { passive: true, capture: true });
    };
    /* Die mittlere Taste öffnet in manchen Browsern das Rollen per Maus —
       hier verschiebt sie die Ansicht. */
    buehne.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });

    /* --- Vollbild (E762) ----------------------------------------------------
     * Redur: „ich kann nicht es volmodu öfnne". Die Fläche legt sich über den
     * ganzen Bildschirm — als feste Ebene über der Seite (das geht überall,
     * auch am iPhone, das ein Element nicht in den Vollbildmodus lässt), und
     * wo der Browser es erlaubt (Rechner, die Windows-App), dazu der echte
     * Vollbildmodus des Fensters. Gebeten wird um das GANZE Dokument, nicht
     * um die Fläche: Menüs, Dialoge und Meldungen hängen am `body` und
     * blieben sonst unsichtbar hinter dem Vollbild. Dasselbe Element, derselbe
     * Zustand — nichts geht verloren; Escape und ✕ führen zurück.
     *
     * DIE FLÄCHE ZIEHT DAFÜR AN DEN `body` UM, und zurück an ihren Platz in
     * der Seite (ein Kommentar hält ihn frei). In der Seite fing ihr
     * `position:fixed` der Stapel der Schale ein: der Kopf der Seite
     * (`#topbar`) lag obenauf, gemessen am Telefon über dem Schliessknopf
     * und am Rechner über der oberen Kante (test625 §1l, §10). Am `body`
     * gilt ihr z-index gegen die ganze Seite. Zeichnet die Seite sich
     * inzwischen neu (der Platzhalter ist weg), geht die Fläche beim
     * Schliessen einfach — die Seite hat dann ihre eigene, und was hier
     * geändert wurde, steht längst im Block. */
    let vollPerApi = false;
    let platzhalter: Comment | null = null;
    const vollGeaendert = (): void => {
      if (!document.fullscreenElement && vollPerApi) { vollPerApi = false; vollAus(); }
    };
    const vollAn = (): void => {
      if (z.voll) return;
      z.voll = true;
      if (wurzel.parentNode && wurzel.parentNode !== document.body) {
        platzhalter = document.createComment('Schaltplan im Vollbild');
        wurzel.parentNode.insertBefore(platzhalter, wurzel);
        document.body.appendChild(wurzel);
      }
      document.addEventListener('wheel', vollRad, { passive: false, capture: true });
      wurzel.classList.add('sp-voll');
      const d = document.documentElement as any;
      if (!document.fullscreenElement && typeof d.requestFullscreen === 'function') {
        try {
          Promise.resolve(d.requestFullscreen({ navigationUI: 'hide' })).then(() => {
            if (!z.voll) { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); return; }
            vollPerApi = true;
            document.addEventListener('fullscreenchange', vollGeaendert);
            radNeuAnmelden();
            /* Der Wechsel dauert; wann er fertig ist, meldet nicht jeder
               Browser gleich (ein `resize` gibt es nur, wenn das Fenster
               wirklich wächst). Deshalb noch zweimal danach. */
            for (const ms of [250, 800]) setTimeout(radNeuAnmelden, ms);
          }).catch(() => { /* nicht erlaubt — die feste Ebene genügt */ });
        } catch { /* ebenso */ }
      }
      kopfMalen();
      ansichtAnwenden();
      wurzel.focus({ preventScroll: true });
    };
    const vollAus = (): void => {
      if (!z.voll) return;
      z.voll = false;
      wurzel.classList.remove('sp-voll');
      if (platzhalter) {
        if (platzhalter.isConnected && platzhalter.parentNode) platzhalter.parentNode.replaceChild(wurzel, platzhalter);
        else wurzel.remove();
        platzhalter = null;
      }
      document.removeEventListener('fullscreenchange', vollGeaendert);
      document.removeEventListener('wheel', vollRad, { capture: true } as EventListenerOptions);
      document.removeEventListener('wheel', leerRad, { capture: true } as EventListenerOptions);
      if (vollPerApi && document.fullscreenElement) {
        void document.exitFullscreen().then(() => radNeuAnmelden()).catch(() => {});
      }
      vollPerApi = false;
      kopfMalen();
      ansichtAnwenden();
      if (wurzel.isConnected) wurzel.focus({ preventScroll: true });
    };

    /* KEIN dblclick-Horcher mehr: das Doppeltippen erkennt der
       pointerdown selbst (Begründung dort). Ein zweiter Horcher öffnete
       den Dialog doppelt, sobald der Browser doch ein dblclick baut. */

    /* --- Das Elektro Studio (E770) -------------------------------------------
     * Schnelle Bedienung ohne zweites Schaltplanmodell. Auswahl und Werte
     * kommen aus z.plan, Änderungen gehen ausnahmslos durch `aendere`.
     * Suche und Filter bleiben bei einem Bild-Neuaufbau erhalten. */
    const studioHelfer = (): typeof StudioHilfe => StudioHilfe;
    const studioLetzteLaden = (): string[] => {
      const roh = typeof Store !== 'undefined' ? Store.getMeta('redion:elektro:letzte:v1', []) : [];
      return studioHelfer()?.leseLetzte(roh) || [];
    };
    studioLetzte = studioLetzteLaden();
    const studioZeichenWahl = (id: string, neuZeichnen = true): void => {
      if (z.simulation || z.zieht || !Register.fachzeichen.holen(id)) return;
      z.werkzeug = 'zeigen';
      z.gewaehltesZeichen = id;
      z.auswahl.clear();
      studioLetzte = studioHelfer()?.merkeLetzte(studioLetzte, id) || [id];
      if (typeof Store !== 'undefined') Store.setMeta('redion:elektro:letzte:v1', studioLetzte);
      if (neuZeichnen) {
        paletteMalen((palette.querySelector('input') as HTMLInputElement)?.value || '');
        male();
      }
    };
    const studioMalen = (): void => {
      if (!studioOffen || studioPanel.hidden) return;
      const helper = studioHelfer();
      const symbols = Register.fachzeichen.alle() as any[];
      const gewaehlt = [...z.auswahl].map(id => (z.plan.teile as any[]).find(t => t.id === id)).filter(Boolean);
      const tabs = ([['einsetzen', 'Einfügen'], ['eigenschaften', 'Eigenschaften'], ['status', 'Übersicht']] as const)
        .map(([id, name]) => `<button type="button" data-st-tab="${id}" aria-pressed="${studioTab === id}" class="${studioTab === id ? 'an' : ''}">${name}</button>`).join('');
      let inhalt = '';
      if (studioTab === 'einsetzen') {
        const gefunden = helper?.suche(symbols, studioSuchtext, studioGruppe, 36) || [];
        const letzte = studioSuchtext || studioGruppe !== 'alle' ? [] : studioLetzte
          .map(id => Register.fachzeichen.holen(id)).filter(Boolean).slice(0, 8);
        const symbolKarte = (teil: any, art: string): string =>
          `<button type="button" class="sp-studio-symbol${z.gewaehltesZeichen === teil.id ? ' an' : ''}" data-st-symbol="${esc(teil.id)}" ` +
          `title="${esc(teil.name + ' – ' + (teil.erklaerung || ''))}" ${z.simulation ? 'disabled' : ''}>` +
          `<span class="sp-studio-bild" aria-hidden="true">${Register.fachzeichen.alsSvg(teil.id, {strich: 2})}</span>` +
          `<span>${esc(teil.name)}</span>${art === 'neu' ? '<small>Zuletzt</small>' : ''}</button>`;
        const gruppen = (Register.fachzeichen.gruppen() as Array<[string,string,string]>);
        inhalt = `<label class="sp-studio-suchfeld">Symbol suchen ` +
          `<input type="search" data-st-suche placeholder="z. B. Schliesser, Lampe …" value="${esc(studioSuchtext)}" autocomplete="off" ${z.simulation ? 'disabled' : ''}></label>` +
          `<label class="sp-studio-suchfeld">Kategorie <select data-st-gruppe ${z.simulation ? 'disabled' : ''}>` +
          `<option value="alle">Alle Bauteile</option>` +
          gruppen.map(g => `<option value="${esc(g[0])}"${studioGruppe === g[0] ? ' selected' : ''}>${esc(g[1])}</option>`).join('') +
          `</select></label>` +
          (letzte.length ? `<div class="sp-studio-letzte"><div class="sp-studio-untertitel">Zuletzt benutzt</div><div class="sp-studio-raster">${letzte.map((x: any) => symbolKarte(x, 'neu')).join('')}</div></div>` : '') +
          `<div class="sp-studio-untertitel sp-studio-treffer-zahl">${gefunden.length} Treffer${studioSuchtext ? ' für „' + esc(studioSuchtext) + '“' : ''}</div>` +
          `<div class="sp-studio-raster sp-studio-treffer">${gefunden.map((x: any) => symbolKarte(x, 'normal')).join('') || '<p>Kein Bauteil gefunden.</p>'}</div>` +
          `<p class="sp-studio-hilfe">Mit Maus, Finger oder Stift ein Bauteil anfassen und direkt auf den Plan ziehen. Oder antippen und anschliessend auf der Fläche platzieren. Alt + Klick links fügt ein Symbol zu Favoriten hinzu.</p>`;
      } else if (studioTab === 'eigenschaften') {
        if (z.simulation) inhalt = '<p class="sp-studio-hilfe">Simulation anhalten, um Bauteile zu bearbeiten.</p>';
        else if (gewaehlt.length === 1 && z.auswahl.size === 1) {
          const t = gewaehlt[0];
          const symbol = Register.fachzeichen.holen(t.zeichen);
          const infos = helper?.ueberblick(z.plan, (id: string) => Register.fachzeichen.holen(id)) || {};
          inhalt = `<div class="sp-studio-auswahl"><div class="sp-studio-bild">${Register.fachzeichen.alsSvg(t.zeichen, {strich: 2})}</div><div><strong>${esc(symbol?.name || t.zeichen)}</strong><small>${esc(t.id)}</small></div></div>` +
            `<form data-st-form><input type="hidden" name="teil" value="${esc(t.id)}">` +
            `<label>Betriebsmittelkennzeichen<input name="bmk" maxlength="40" value="${esc(t.bmk || '')}" placeholder="z. B. K1"></label>` +
            `<label>Beschriftung<input name="beschriftung" maxlength="120" value="${esc(t.beschriftung || '')}" placeholder="z. B. Hauptschütz"></label>` +
            (istZeitspule(t) ? `<label>Zeitrelais-Verzögerung (s)<input name="verzoegerung" type="number" step="0.1" min="0" max="3600" value="${Number.isFinite(t.werte?.T) ? t.werte.T : 3}"></label>` : '') +
            (spalteVon(t) ? `<p class="sp-studio-hilfe">Original-Spaltenüberschrift: <b>${esc(spalteVon(t))}</b> (nicht automatisch ein Bauteilname).</p>` : '') +
            `<p class="sp-studio-hilfe">Rasterposition: ${Number(t.x)} / ${Number(t.y)} · Drehung: ${Number(t.drehung) || 0}°</p>` +
            `<div class="sp-studio-actions"><button type="submit" class="prim">Eigenschaften speichern</button>` +
            `<button type="button" data-st-a="details">Anschlüsse …</button></div></form>` +
            `<div class="sp-studio-actions"><button type="button" data-st-a="drehen">↻ Drehen</button>` +
            `<button type="button" data-st-a="spiegeln">⇋ Spiegeln</button>` +
            `<button type="button" data-st-a="doppeln">⊕ Duplizieren</button></div>` +
            (infos.doppelteKennzeichen?.includes(String(t.bmk || '').trim()) ? '<p class="sp-studio-warn">Dieses Kennzeichen kommt mehrfach vor. Das kann für Relaiskontakte beabsichtigt sein – Zuordnung prüfen.</p>' : '');
        } else if (gewaehlt.length) {
          inhalt = `<p><b>${gewaehlt.length} Bauteile</b> ausgewählt</p>` +
            `<p class="sp-studio-hilfe">Gruppenweise drehen, spiegeln und duplizieren geht über die vorhandenen Werkzeuge.</p>` +
            `<div class="sp-studio-actions"><button data-st-a="drehen">↻ Drehen</button><button data-st-a="spiegeln">⇋ Spiegeln</button><button data-st-a="doppeln">⊕ Duplizieren</button></div>`;
        } else {
          inhalt = '<p class="sp-studio-hilfe">Ein Bauteil im Schaltplan auswählen. Hier kannst du es direkt beschriften, drehen und bearbeiten.</p>';
        }
      } else {
        const u = helper?.ueberblick(z.plan, (id: string) => Register.fachzeichen.holen(id)) || {teile: 0, leitungen: 0, texte: 0, gruppen: [], doppelteKennzeichen: []};
        inhalt = `<div class="sp-studio-kennzahlen"><div><strong>${u.teile}</strong><small>Bauteile</small></div>` +
          `<div><strong>${u.leitungen}</strong><small>Leitungen</small></div>` +
          `<div><strong>${u.texte}</strong><small>Texte</small></div></div>` +
          `<div class="sp-studio-untertitel">Verwendete Symbolgruppen</div>` +
          `<div class="sp-studio-gruppen">${u.gruppen.map((g: any) => `<span>${esc(g.gruppe)} <b>${g.anzahl}</b></span>`).join('') || 'Noch keine Bauteile'}</div>` +
          `<p class="sp-studio-hilfe">${u.doppelteKennzeichen.length ? `${u.doppelteKennzeichen.length} mehrfach verwendete Kennzeichen. Bei Spulen und Kontakten kann das richtig sein.` : 'Keine mehrfach verwendeten Betriebsmittelkennzeichen.'}</p>` +
          `<div class="sp-studio-actions"><button type="button" data-st-a="pruefen">✓ Prüfzentrum</button>` +
          `<button type="button" data-st-a="zoom">⤢ Plan zeigen</button></div>`;
      }
      studioPanel.innerHTML = `<div class="sp-studio-kopf"><div><b>Elektro Studio</b><small>Bauteile · Bearbeiten · Prüfen</small></div>` +
        `<button type="button" data-st-a="schliessen" aria-label="Elektro Studio schliessen">✕</button></div>` +
        `<div class="sp-studio-tabs" role="group" aria-label="Elektro Studio Bereiche">${tabs}</div>` +
        `<div class="sp-studio-inhalt">${inhalt}</div>`;
    };
    studioPanel.addEventListener('input', e => {
      const f = e.target as HTMLInputElement;
      if (!f.matches('[data-st-suche]')) return;
      studioSuchtext = f.value.slice(0, 90);
      const letzteElemente = studioPanel.querySelector<HTMLElement>('.sp-studio-letzte');
      if (letzteElemente) letzteElemente.hidden = !!studioSuchtext;
      /* Nicht die gesamte Fläche neu zeichnen: Cursor und Tastatureingabe
         bleiben im Suchfeld, nur Treffer werden aktualisiert. */
      const gefunden = studioHelfer()?.suche(Register.fachzeichen.alle(), studioSuchtext, studioGruppe, 36) || [];
      const raster = studioPanel.querySelector('.sp-studio-treffer');
      if (raster) raster.replaceChildren(...gefunden.map((x: any) => {
        const b = document.createElement('button'); b.type = 'button';
        b.className = 'sp-studio-symbol' + (z.gewaehltesZeichen === x.id ? ' an' : ''); b.dataset.stSymbol = x.id;
        b.title = x.name;
        const img = document.createElement('span'); img.className = 'sp-studio-bild';
        img.innerHTML = Register.fachzeichen.alsSvg(x.id, {strich:2});
        const t = document.createElement('span'); t.textContent = x.name;
        b.append(img,t); return b;
      }));
      const count = studioPanel.querySelector('.sp-studio-treffer-zahl');
      if (count) count.textContent = `${gefunden.length} Treffer`;
    });
    studioPanel.addEventListener('change', e => {
      const f = e.target as HTMLSelectElement;
      if (!f.matches('[data-st-gruppe]')) return;
      studioGruppe = f.value;
      studioMalen();
    });
    studioPanel.addEventListener('submit', e => {
      const form = (e.target as Element).closest<HTMLFormElement>('[data-st-form]');
      if (!form) return;
      e.preventDefault();
      if (z.simulation || z.zieht) return;
      const id = (form.querySelector('[name="teil"]') as HTMLInputElement)?.value;
      const bmk = (form.querySelector('[name="bmk"]') as HTMLInputElement)?.value.trim().slice(0, 40) || '';
      const beschriftung = (form.querySelector('[name="beschriftung"]') as HTMLInputElement)?.value.trim().slice(0, 120) || '';
      const zeitFeld = form.querySelector<HTMLInputElement>('[name="verzoegerung"]');
      const sekunden = zeitFeld ? Number(zeitFeld.value) : null;
      if (zeitFeld && (!zeitFeld.value.trim() || !Number.isFinite(sekunden) || sekunden! < 0 || sekunden! > 3600)) {
        zeitFeld.setCustomValidity('Bitte 0 bis 3600 Sekunden eingeben.');
        zeitFeld.reportValidity(); return;
      }
      const teil = (z.plan.teile as any[]).find(t => t.id === id);
      if (!teil || (teil.bmk === bmk && (teil.beschriftung || '') === beschriftung &&
          (!zeitFeld || (Number.isFinite(teil.werte?.T) ? teil.werte.T : 3) === sekunden))) return;
      aendere(() => {
        teil.bmk = bmk;
        if (beschriftung) teil.beschriftung = beschriftung;
        else delete teil.beschriftung;
        if (zeitFeld) teil.werte = { ...(teil.werte || {}), T: sekunden };
      });
      if (karteId === teil.id) karteMalen();
    });
    studioPanel.addEventListener('click', e => {
      if (Date.now() < platzKlickBlockBis) return;
      const b = (e.target as Element).closest<HTMLElement>('[data-st-tab],[data-st-a],[data-st-symbol]');
      if (!b) return;
      if (b.dataset.stTab) { studioTab = b.dataset.stTab as typeof studioTab; studioMalen(); return; }
      if (b.dataset.stSymbol) { studioZeichenWahl(b.dataset.stSymbol); return; }
      const a = b.dataset.stA;
      if (a === 'schliessen') { studioOffen = false; studioPanel.hidden = true; kopfMalen(); return; }
      if (z.zieht) return;
      if (a === 'pruefen') { pruefungOffen = true; pruefPanel.hidden = false; kopfMalen(); pruefMalen(); return; }
      if (a === 'zoom') { allesZeigen(); return; }
      if (z.simulation) return;
      if (a === 'details') {
        const t = (z.plan.teile as any[]).find(t => z.auswahl.has(t.id));
        if (t) teilDialog(t);
      }
      if (a === 'drehen') drehen();
      if (a === 'spiegeln') spiegeln();
      if (a === 'doppeln') doppeln();
    });

    /* --- Der Dialog am Teil ---------------------------------------------- */
    const teilDialog = (t: any): void => {
      const zeichen = Register.fachzeichen.holen(t.zeichen);
      if (!zeichen) return;
      const o = document.createElement('div');
      o.className = 'overlay';
      o.innerHTML =
        '<div class="finder" style="width:min(460px,94vw)">' +
        `<div class="fh">${esc(zeichen.name)}<button class="icon-btn" data-a="zu">✕</button></div>` +
        `<div class="sp-dialog">` +
        `<p class="sp-erkl">${esc(zeichen.erklaerung)}</p>` +
        `<label>Betriebsmittel<input id="sp-bmk" value="${esc(t.bmk)}" ` +
        `placeholder="${esc(zeichen.kennbuchstabe || 'K')}1"></label>` +
        `<label>Beschriftung<input id="sp-beschriftung" maxlength="120" value="${esc(t.beschriftung || '')}" ` +
        `placeholder="z. B. Hauptschütz"></label>` +
        (ZEITSPULEN.has(t.zeichen)
          ? `<label>Verzögerung T in Sekunden<input id="sp-zeit" type="number" min="0" max="3600" step="0.1" ` +
            `value="${Number.isFinite(t.werte?.T) ? Number(t.werte.T) : 3}"></label>` : '') +
        `<div class="sp-nrs"><span>Anschlussnummern</span>` +
        zeichen.anschluesse.map((a: any) =>
          `<label class="sp-nr"><i>${esc(a.nr)}</i>` +
          `<input data-nr="${esc(a.nr)}" value="${esc(t.nummern[a.nr] ?? a.nr)}"></label>`).join('') +
        `</div></div>` +
        '<div class="fbtns"><button data-a="zu">Abbrechen</button>' +
        '<button class="prim" data-a="ok">Übernehmen</button></div></div>';
      document.body.appendChild(o);
      const zu = () => o.remove();
      o.addEventListener('click', e => {
        const b = (e.target as Element).closest<HTMLElement>('[data-a]');
        if (e.target === o || (b && b.dataset.a === 'zu')) { zu(); return; }
        if (!b || b.dataset.a !== 'ok') return;
        const bmk = (o.querySelector('#sp-bmk') as HTMLInputElement).value.trim();
        const beschriftung = (o.querySelector('#sp-beschriftung') as HTMLInputElement).value.trim().slice(0, 120);
        const zeitFeld = o.querySelector<HTMLInputElement>('#sp-zeit');
        const sekunden = zeitFeld ? Number(zeitFeld.value) : 0;
        if (zeitFeld && (!zeitFeld.value.trim() || !Number.isFinite(sekunden) || sekunden < 0 || sekunden > 3600)) {
          zeitFeld.setCustomValidity('0 bis 3600 Sekunden eingeben.'); zeitFeld.reportValidity(); return;
        }
        const nummern: Record<string, string> = {};
        o.querySelectorAll<HTMLInputElement>('[data-nr]').forEach(f => {
          const vorgabe = f.dataset.nr || '';
          const wert = f.value.trim();
          if (wert && wert !== vorgabe) nummern[vorgabe] = wert;
        });
        zu();
        aendere(() => {
          t.bmk = bmk; t.nummern = nummern;
          /* E767: leer heisst „kein Feld", nicht ein leerer Text. */
          if (beschriftung) t.beschriftung = beschriftung; else delete t.beschriftung;
          if (zeitFeld) t.werte = { ...(t.werte || {}), T: sekunden };
        });
      });
      (o.querySelector('#sp-bmk') as HTMLInputElement)?.focus();
    };

    /* --- Das Formelheft (Punkt 61) ---------------------------------------
     * Redur hat es genau so beschrieben: „wenn ich zeichne und dort bei
     * einfügen Formelheft klicke, sollte das Formelheft dort kommen, und ich
     * kann es bewegen." Der Punkt ist das WÄHREND. Ein Nachschlagewerk, das
     * man erst öffnen und dann wieder schliessen muss, um weiterzuzeichnen,
     * ist keins — man merkt sich die Formel falsch und zeichnet weiter.
     *
     * Deshalb ist es ein schwebendes Fenster und kein Dialog: der Plan
     * bleibt darunter bedienbar, das Heft bleibt offen, und man kann in der
     * einen Hand die Formel und in der anderen den Schaltplan haben.
     * -------------------------------------------------------------------- */
    const heftOffen = (): boolean =>
      typeof Formelheft !== 'undefined' && Formelheft.offen();

    const heftUmschalten = (): void => {
      if (typeof Formelheft === 'undefined') {
        UI.toast('Das Formelheft ist nicht geladen.');
        return;
      }
      /* Beim Öffnen gleich das passende Kapitel: wer einen Motor gezeichnet
         hat, sucht Drehstrom, und wer eine Lampe gezeichnet hat, Leistung.
         Das erspart drei Klicks in genau dem Moment, in dem man sie am
         wenigsten machen will. */
      Formelheft.umschalten(kapitelZumPlan());
      kopfMalen();
    };

    /**
     * Welches Kapitel zum Plan passt — abgelesen an dem, was darin steht.
     *
     * Die Kennungen kommen aus `Register.elektroformeln.kapitel()` und werden
     * NICHT geraten: der erste Versuch schrieb hier „drehstrom", „steuerung"
     * und „installation", und keines der drei gibt es. Das Heft wäre stumm
     * beim vorgesehenen Kapitel gelandet, ohne dass irgendwo etwas kaputt
     * ausgesehen hätte.
     */
    const KAPITEL_ZU_ZEICHEN: Array<[string, string[]]> = [
      ['dreh',     ['motor-drehstrom', 'motorschutzschalter', 'thermorelais']],
      ['motor',    ['motor-wechselstrom', 'motor-gleichstrom']],
      ['trafo',    ['transformator']],
      ['konden',   ['kondensator', 'elko']],
      /* Eine Lampe im Stromlaufplan ist ein VERBRAUCHER. Zuerst stand sie
         hier bei „Lichttechnik", und das Heft öffnete beim Zeichnen eines
         gewöhnlichen Stromkreises die Beleuchtungsstärke — richtig geraten
         nach dem Symbol, falsch geraten nach der Frage. Lichttechnik gehört
         zum Bauplan, nicht zum Stromlauf. */
      ['leistung', ['lampe', 'signalleuchte', 'hupe', 'klingel', 'ch-kontrolllampe']],
      ['licht',    ['bp-leuchte', 'bp-einbauleuchte', 'bp-leuchtstelle']],
      ['quelle',   ['batterie', 'gleichspannung', 'generator']],
      ['wechsel',  ['spule-induktivitaet', 'wechselspannung']],
      ['leiter',   ['leitungsschutzschalter', 'sicherung', 'widerstand']]
    ];
    const kapitelZumPlan = (): string | undefined => {
      const zeichen = new Set((z.plan.teile as any[]).map(t => t.zeichen));
      for (const [kapitel, ausloeser] of KAPITEL_ZU_ZEICHEN)
        if (ausloeser.some(x => zeichen.has(x))) return kapitel;
      return undefined;
    };

    /**
     * Den Strom ein- und ausschalten.
     *
     * Beim Einschalten wird die Auswahl geleert und das Werkzeug auf „zeigen"
     * gestellt: sonst stünde noch der Radiergummi bereit, während die Fläche
     * schon eine Schalttafel ist. Beim Ausschalten fällt alles Gerechnete weg
     * — auch die Schalterstellungen, damit der Plan wieder so aussieht, wie er
     * gezeichnet ist und nicht wie er zuletzt bedient wurde.
     */
    /* --- Die Relais-Werkstatt, nachgeladen (E769) -------------------------
     * Drei Skripte, zusammen rund 70 KB, davon 60 KB Redurs Originaldateien:
     * sie kommen erst, wenn jemand das Fach öffnet — nicht beim Start
     * (test388). Ein <script> und kein fetch, weil Redion per Doppelklick
     * läuft (wie die Chronik, E613); in der Einzeldatei stehen sie schon da.
     * --------------------------------------------------------------------- */
    const relaisLaden = (): Promise<void> => {
      const w = window as any;
      if (w.RelaisWerkstatt && w.RelaisKern && w.RelaisVorlagen) return Promise.resolve();
      if (w.__relaisLaden) return w.__relaisLaden as Promise<void>;
      const eins = (datei: string): Promise<void> => new Promise((ja, nein) => {
        const s = document.createElement('script');
        s.src = 'quell/bereiche/bloecke/arten/' + datei;
        s.addEventListener('load', () => ja());
        s.addEventListener('error', () => nein(new Error(datei + ' liess sich nicht laden.')));
        document.head.appendChild(s);
      });
      const v: Promise<void> = eins('relais-kern.js').then(() => eins('relais-vorlagen.js'))
        .then(() => eins('relais-werkstatt.js'));
      w.__relaisLaden = v;
      v.catch(() => { w.__relaisLaden = null; });
      return v;
    };
    const relaisZeigen = (): void => {
      relaisPanel.hidden = !relaisOffen;
      if (!relaisOffen) return;
      if (relais) { relais.aktualisiere(); return; }
      relaisPanel.innerHTML = '<p class="sp-bat-hinweis" role="status">Die Relais-Werkstatt wird geladen …</p>';
      relaisLaden().then(() => {
        if (relais || !wurzel.isConnected) return;
        relais = (window as any).RelaisWerkstatt.erstelle({
          element: relaisPanel,
          holePlan: () => z.plan,
          aendere: (was: () => void) => aendere(was),
          setzePlan: (plan: any) => {
            z.plan = Schaltplan.lesen({ plan });
            z.auswahl.clear();
            z.simulation = false; z.stellungen = {}; z.spulenStand = {}; z.ergebnis = null;
            zeitAnhalten();
          }
        });
      }).catch((err: Error) => {
        relaisPanel.innerHTML = '<p class="sp-bat-hinweis" role="alert">' + esc(err.message) + '</p>';
      });
    };

    const simulationUmschalten = (): void => {
      /* E769: ein eingelesener Relais-Plan hat keine gesicherte Verdrahtung —
         erst nach der Freigabe in der Werkstatt wird gerechnet. */
      if (!z.simulation && z.plan.relaisLegacy && !z.plan.relaisLegacy.verifiziert) {
        relaisOffen = true; relaisZeigen(); kopfMalen();
        UI.toast('Die Verdrahtung dieser alten Relais-Datei ist nicht geprüft. Prüfe die Leitungen und gib sie in der Relais-Werkstatt frei.');
        return;
      }
      /* Batterien aus der normalen Bauteilpalette erhalten beim ersten
       * Einschalten eigene Ausgangsklemmen, ohne den Plan zu löschen.
       * Die Berechnung verwendet ausschliesslich die echte Netzliste. */
      if (!z.plan.batterieUebung && z.plan.teile.some((t: any) => t.zeichen === 'batterie')) {
        if (!batterie?.ausZeichnung()) return;
      }
      if (z.plan.batterieUebung) {
        batterieOffen = true;
        batteriePanel.hidden = false;
        if (batterie) batterie.stromSetzen(!batterie.stromAn());
        kopfMalen();
        return;
      }

      if (!z.simulation) merkwahl = { werkzeug: z.werkzeug, zeichen: z.gewaehltesZeichen };
      z.simulation = !z.simulation;

      z.auswahl.clear();
      if (z.simulation) { z.werkzeug = 'zeigen'; z.gewaehltesZeichen = ''; }
      else {
        z.stellungen = {}; z.spulenStand = {}; z.ergebnis = null;
        /* Nach dem Ausschalten steht wieder das Werkzeug von vorher bereit. */
        if (merkwahl) { z.werkzeug = merkwahl.werkzeug; z.gewaehltesZeichen = merkwahl.zeichen; merkwahl = null; }
      }
      zeitStarten();
      male();
      paletteMalen();
    };

    /* --- Kopf und Fuss bedienen ------------------------------------------ */
    kopf.addEventListener('change', e => {
      const s = (e.target as HTMLElement).closest('.sp-art') as HTMLSelectElement | null;
      if (!s) return;
      aendere(() => { z.plan.art = s.value; });
      paletteMalen();
    });
    kopf.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-wz],[data-a]');
      if (!b) return;
      if (b.dataset.wz) { z.werkzeug = b.dataset.wz as Werkzeug; z.auswahl.clear(); male(); return; }
      if (b.dataset.a === 'palette-toggle') {
        paletteOffen = !paletteOffen;
        if (paletteOffen && studioOffen) { studioOffen = false; studioPanel.hidden = true; }
        wurzel.classList.toggle('sp-palette-offen', paletteOffen);
        palette.hidden = !paletteOffen;
        kopfMalen(); return;
      }
      if (b.dataset.a === 'zoom-alles') return allesZeigen();
      if (b.dataset.a === 'bereiche') return bereicheMenue(b);
      if (b.dataset.a === 'plan-fokus') {
        planFokus = !planFokus;
        wurzel.classList.toggle('sp-plan-fokus', planFokus);
        geistEntfernen(); kopfMalen(); ansichtAnwenden();
        return;
      }
      if (b.dataset.a === 'elektro-studio') {
        studioOffen = !studioOffen; studioPanel.hidden = !studioOffen;
        if (studioOffen) { paletteOffen = false; palette.hidden = true; wurzel.classList.remove('sp-palette-offen'); studioTab = 'eigenschaften'; }
        kopfMalen(); if (studioOffen) studioMalen(); return;
      }
      if (b.dataset.a === 'pruefzentrum') {
        pruefungOffen = !pruefungOffen; pruefPanel.hidden = !pruefungOffen;
        kopfMalen(); if (pruefungOffen) pruefMalen(); return;
      }
      if (b.dataset.a === 'relais-werkstatt') { relaisOffen = !relaisOffen; relaisZeigen(); kopfMalen(); return; }
      if (b.dataset.a === 'netz') return schaltungMenue(b);
      if (b.dataset.a === 'batterie-labor') {
        batterieOffen = !batterieOffen;
        batteriePanel.hidden = !batterieOffen;
        kopfMalen();
        if (batterie) batterie.aktualisiere();
        return;
      }
      if (b.dataset.a === 'heft') return heftUmschalten();
      if (b.dataset.a === 'simulation') {
        const hadFocus = document.activeElement === b;
        simulationUmschalten();
        /* Das Neuzeichnen des Kopfs ersetzt den Knopf; der Fokus kehrt
           zurück, damit Enter oder Leertaste ein zweites Mal wirkt. */
        if (hadFocus) kopf.querySelector<HTMLElement>('[data-a="simulation"]')?.focus();
        return;
      }
      if (b.dataset.a === 'zurueck') return zurueck();
      if (b.dataset.a === 'vorwaerts') return vorwaerts();
      if (b.dataset.a === 'mehr') return mehrMenue(b);
      if (b.dataset.a === 'vollbild') return vollAn();
      if (b.dataset.a === 'vollbild-zu') return vollAus();
    });

    fuss.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-ebene],[data-a],[data-radiermodus],[data-radiergroesse],[data-schiene]');
      if (!b) return;
      /* Die Wahl des Radierers bleibt für das nächste Mal (wie im PDF). */
      if (b.dataset.radiermodus || b.dataset.radiergroesse) {
        if (b.dataset.radiermodus) z.radierModus = b.dataset.radiermodus === 'leiter' ? 'leiter' : 'alles';
        if (b.dataset.radiergroesse) z.radierGroesse = Number(b.dataset.radiergroesse) || 16;
        if (typeof Store !== 'undefined') Store.setMeta(RADIERER, { modus: z.radierModus, groesse: z.radierGroesse });
        fussMalen();
        return;
      }
      if (b.dataset.schiene) { z.schieneArt = b.dataset.schiene; fussMalen(); return; }
      if (b.dataset.ebene) {
        aendere(() => {
          const ebene = (z.plan.ebenen as any[]).find(x => x.id === b.dataset.ebene);
          if (ebene) ebene.sichtbar = !ebene.sichtbar;
        });
        return;
      }
      if (b.dataset.a === 'zurueck-zeichnen') { simulationUmschalten(); return; }
      if (b.dataset.a === 'ruhelage') {
        z.stellungen = {}; z.spulenStand = {}; zeitStarten(); male(); return;
      }
      if (b.classList.contains('annahme')) {
        const e = z.ergebnis;
        if (e && (e.annahmen || []).length)
          UI.banner('Wie gerechnet wird: ' +
            (e.annahmen as string[]).join(' · '), 'info');
        return;
      }
      ({ drehen, spiegeln, doppeln, gruppieren, loeschen } as Record<string, () => void>)
        [b.dataset.a || '']?.();
    });

    palette.addEventListener('click', e => {
      if (Date.now() < platzKlickBlockBis) return;
      const ziel = e.target as Element;
      const schliessen = ziel.closest<HTMLElement>('[data-p-close]');
      if (schliessen) {
        paletteOffen = false; palette.hidden = true;
        wurzel.classList.remove('sp-palette-offen');
        kopfMalen();
        kopf.querySelector<HTMLElement>('[data-a="palette-toggle"]')?.focus({ preventScroll: true });
        return;
      }
      const kompakt = ziel.closest<HTMLButtonElement>('[data-p-compact]');
      if (kompakt) {
        paletteKompakt = !paletteKompakt;
        palette.classList.toggle('sp-pal-kompakt', paletteKompakt);
        kompakt.setAttribute('aria-pressed', String(paletteKompakt));
        kompakt.textContent = paletteKompakt ? '▣ Groß' : '▤ Klein';
        kompakt.title = paletteKompakt ? 'Große Palette zeigen' : 'Kompakte Palette zeigen';
        return;
      }
      const filter = ziel.closest<HTMLElement>('[data-p-filter]');
      if (filter?.dataset.pFilter) {
        paletteGruppe = filter.dataset.pFilter;
        palette.querySelectorAll<HTMLElement>('[data-p-filter]').forEach(b => {
          const aktiv = b.dataset.pFilter === paletteGruppe;
          b.classList.toggle('an', aktiv);
          b.setAttribute('aria-pressed', String(aktiv));
        });
        paletteTrefferMalen();
        palette.querySelector<HTMLElement>('.sp-liste')?.scrollTo({ top: 0 });
        return;
      }
      const favorit = ziel.closest<HTMLElement>('[data-p-fav]');
      if (favorit?.dataset.pFav) {
        favoritUmschalten(favorit.dataset.pFav);
        paletteTrefferMalen();
        return;
      }
      const b = ziel.closest<HTMLElement>('[data-sym]');
      if (!b || !b.dataset.sym) return;
      if (e.altKey) {
        favoritUmschalten(b.dataset.sym);
        paletteTrefferMalen();
        return;
      }
      z.gewaehltesZeichen = z.gewaehltesZeichen === b.dataset.sym ? '' : b.dataset.sym;
      if (z.gewaehltesZeichen) {
        studioLetzte = studioHelfer()?.merkeLetzte(studioLetzte, z.gewaehltesZeichen) || studioLetzte;
        if (typeof Store !== 'undefined') Store.setMeta('redion:elektro:letzte:v1', studioLetzte);
      }
      palette.querySelectorAll<HTMLElement>('.sp-sym').forEach(x => {
        const an = x.dataset.sym === z.gewaehltesZeichen;
        x.classList.toggle('an', an);
        x.setAttribute('aria-pressed', String(an));
        x.closest('.sp-zeichenkarte')?.classList.toggle('ist-gewaehlt', an);
      });
      paletteInfokarte();
      /* Werkzeug wird nicht zurückgesetzt: beliebig oft klicken und platzieren. */
      fussMalen(); if (studioOffen) studioMalen();
    });
    palette.addEventListener('input', e => {
      const f = e.target as HTMLInputElement;
      if (!f.matches('.sp-suche input[type="search"]')) return;
      paletteSuche = f.value;
      paletteTrefferMalen();
    });
    palette.addEventListener('pointerover', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-sym]');
      if (b?.dataset.sym) paletteInfokarte(b.dataset.sym);
    });
    palette.addEventListener('focusin', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-sym]');
      if (b?.dataset.sym) paletteInfokarte(b.dataset.sym);
    });

    /* --- Tastatur --------------------------------------------------------- */
    wurzel.tabIndex = 0;
    /* DER FOKUS BLEIBT BEI DER FLÄCHE (E746, dritte Durchsicht). Ein Klick
       auf die Bühne zeichnet sie neu (Auswahl, Zug, Teil gesetzt), der
       Knoten unter dem Zeiger ist danach ein anderer, und der Browser setzt
       den Fokus beim `mousedown` auf die Seite statt auf die Fläche — stünde
       der Knoten noch, nähme die Fläche ihn (`tabIndex` 0). Danach kam keine
       echte Taste mehr hier an: „r" nach einem Klick auf ein Teil drehte
       nichts, und Strg+Z nahm der Seitenverlauf statt der Fläche (test611
       §14). Beim Loslassen über der Fläche holt sie den Fokus deshalb
       zurück — nur, wenn er auf der Seite gelandet ist (`body`), nie aus
       einem Feld, einem Knopf oder einem Dialog, und ohne zu rollen.
       OHNE RING, wie ein Fokus mit der Maus: einen Fokus aus dem Skript
       zeigt Chromium als `:focus-visible`, und `focus({ focusVisible:
       false })` kennt es nicht (Chromium 141, gemessen). Das Merkmal
       `data-zeigerfokus` nimmt den Ring weg (bausteine.css), bis der Fokus
       die Fläche verlässt; wer mit der Tabulatortaste kommt, sieht ihn
       (§38). */
    wurzel.addEventListener('pointerup', () => {
      const a = document.activeElement;
      if ((!a || a === document.body) && wurzel.isConnected) {
        wurzel.dataset.zeigerfokus = '';
        wurzel.focus({ preventScroll: true });
      }
    });
    wurzel.addEventListener('focusout', e => {
      if (e.target === wurzel) delete wurzel.dataset.zeigerfokus;
      if (z.leertaste) { z.leertaste = false; buehne.classList.remove('sp-greifen'); }
    });
    wurzel.addEventListener('keyup', e => {
      if (e.key === ' ') { z.leertaste = false; buehne.classList.remove('sp-greifen'); }
    });
    wurzel.addEventListener('keydown', e => {
      const inFeld = (e.target as HTMLElement).matches('input,textarea,select,[contenteditable], [contenteditable] *');
      if (inFeld) return;
      /* Während eines Zugs zählt von den Tasten nur Escape: es bricht den
         Zug ab — das tut `zugTaste` am Dokument (dritte Durchsicht), denn mit
         der Maus steht der Fokus im Zug gar nicht hier. Kommt Escape im Zug
         doch bis hierher, hat `zugTaste` es für ein offenes Menü
         durchgelassen; dann gehört es dem Menü. „r", „h", Entf, die Pfeile,
         Strg+D/G gehen weiter durch die Zweige unten und nehmen die Taste
         (`preventDefault`), aber `aendere` tut während eines Zugs nichts
         (E746, zweite Durchsicht — die Wahl und ihr Preis stehen dort). */
      if (e.key === 'Escape' && z.zieht) return;
      if (!e.ctrlKey && !e.metaKey && e.altKey && e.shiftKey && e.key.toLowerCase() === 'e') {
        // Alt+Umschalt+E: der Inspektor ersetzt die Bauteilpalette, statt sie zu duplizieren.
        e.preventDefault(); studioOffen = !studioOffen; studioPanel.hidden = !studioOffen;
        if (studioOffen) { paletteOffen = false; palette.hidden = true;
          wurzel.classList.remove('sp-palette-offen'); studioTab = 'eigenschaften'; }
        kopfMalen(); if (studioOffen) studioMalen(); return;
      }
      /* Ansicht (E762): Leertaste halten und ziehen verschiebt; F Vollbild;
         + − 0 zoomen. Die Leertaste rollt dabei die Seite nicht. */
      if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!z.leertaste) { z.leertaste = true; buehne.classList.add('sp-greifen'); }
        return;
      }
      if (!z.simulation && !e.altKey && !e.ctrlKey && !e.metaKey && e.key === '/' && !studioOffen) {
        e.preventDefault();
        if (!paletteOffen) { paletteOffen = true; palette.hidden = false; wurzel.classList.add('sp-palette-offen'); kopfMalen(); }
        palette.querySelector<HTMLInputElement>('.sp-suche input')?.focus();
        return;
      }
      if (!z.simulation && !e.altKey && !e.ctrlKey && !e.metaKey && e.key === '/' && studioOffen) {
        e.preventDefault(); studioTab = 'einsetzen'; studioMalen();
        (studioPanel.querySelector('[data-st-suche]') as HTMLInputElement)?.focus(); return;
      }
      if (!z.simulation && !e.altKey && !e.ctrlKey && !e.metaKey && /^[1-5]$/.test(e.key)) {
        e.preventDefault();
        z.werkzeug = ({'1':'zeigen','2':'leitung','3':'text','4':'schiene','5':'radieren'} as Record<string,Werkzeug>)[e.key]!;
        z.gewaehltesZeichen = ''; z.auswahl.clear();
        paletteMalen((palette.querySelector('input') as HTMLInputElement)?.value || '');
        male(); return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        if (e.key.toLowerCase() === 'p') { e.preventDefault(); simulationUmschalten(); return; }
        if (e.key.toLowerCase() === 'b') { e.preventDefault();
          if (z.simulation) { simulationUmschalten(); return; }
          if (!paletteOffen) { paletteOffen = true; palette.hidden = false; wurzel.classList.add('sp-palette-offen'); kopfMalen(); }
          else { paletteOffen = false; palette.hidden = true; wurzel.classList.remove('sp-palette-offen'); kopfMalen(); }
          return;
        }
        if (e.key === 'f' || e.key === 'F') { e.preventDefault(); return z.voll ? vollAus() : vollAn(); }
        if (e.key === '+' || e.key === '=') { e.preventDefault(); return zoomUm(1.25); }
        if (e.key === '-') { e.preventDefault(); return zoomUm(0.8); }
        if (e.key === '0') { e.preventDefault(); return allesZeigen(); }
      }
      const schritt = e.shiftKey ? Register.fachzeichen.RASTER * 5 : Register.fachzeichen.RASTER;
      const pfeile: Record<string, [number, number]> = {
        ArrowLeft: [-schritt, 0], ArrowRight: [schritt, 0],
        ArrowUp: [0, -schritt], ArrowDown: [0, schritt]
      };
      if (pfeile[e.key] && z.auswahl.size) {
        e.preventDefault();
        const [dx, dy] = pfeile[e.key]!;
        let folge: ReturnType<typeof verschiebe> | undefined;
        aendere(() => { folge = verschiebe(dx, dy); });
        if (folge) melde('Schieben', folge.bericht, folge.aenderungen, folge.vorher);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return loeschen(); }
      if (e.key === 'r' || e.key === 'R') { e.preventDefault(); return drehen(); }
      if (e.key === 'h' || e.key === 'H') { e.preventDefault(); return spiegeln(); }
      if (e.key === 'Escape') {
        /* Erst die Auswahl, dann das Vollbild — ein Druck, eine Sache (E711). */
        if (z.voll && !z.auswahl.size && !z.gewaehltesZeichen) { e.preventDefault(); vollAus(); return; }
        z.auswahl.clear(); z.gewaehltesZeichen = ''; male(); paletteMalen(); return;
      }
      if (!e.ctrlKey && !e.metaKey && e.altKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault(); pruefungOffen = !pruefungOffen; pruefPanel.hidden = !pruefungOffen;
        kopfMalen(); if (pruefungOffen) pruefMalen(); return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); return doppeln(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') { e.preventDefault(); return gruppieren(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        z.auswahl = new Set([...(z.plan.teile as any[]).map(t => t.id),
                             ...(z.plan.leitungen as any[]).map(l => l.id),
                             ...(z.plan.texte as any[]).map(x => x.id)]);
        male(); return;
      }
      /* Rückgängig und Wiederholen. Mit Umschalt meldet der Browser „Z",
         nicht „z" — bis zur dritten Durchsicht ging Umschalt+Strg+Z darum an
         der Fläche vorbei zum Seitenverlauf, ebenso Strg+Y, das hier gar
         nicht stand (test611 §14). Strg+Umschalt+Y gehört den Favoriten. */
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); return e.shiftKey ? vorwaerts() : zurueck(); }
      if ((e.ctrlKey || e.metaKey) && k === 'y' && !e.shiftKey) { e.preventDefault(); return vorwaerts(); }
    });

    /* Nur eine Oberfläche für alle Zusatzmodule. Diese bleiben
       real im Schaltplanblock und werden nicht als eigene App dupliziert. */
    const bereicheMenue = (anker: HTMLElement): void => {
      const r = anker.getBoundingClientRect();
      const m = UI.menu(
        `<button data-bereich="palette">${paletteOffen ? '✓ ' : ''}Bauteile &amp; Suche</button>` +
        `<button data-bereich="studio">${studioOffen ? '✓ ' : ''}Eigenschaften &amp; Studio</button>` +
        `<hr>` +
        `<button data-bereich="relais">${relaisOffen ? '✓ ' : ''}Relais &amp; alte .sch-Schaltungen</button>` +
        `<button data-bereich="batterien">${batterieOffen ? '✓ ' : ''}Batterielabor</button>` +
        `<button data-bereich="pruefung">${pruefungOffen ? '✓ ' : ''}Prüfzentrum &amp; Netzliste</button>` +
        `<button data-bereich="heft">${heftOffen() ? '✓ ' : ''}Formelheft</button>` +
        `<hr>` +

        `<button data-bereich="fokus">${planFokus ? '✓ ' : ''}Nur die Zeichenfläche</button>` +
        `<button data-bereich="voll">Grossansicht (F)</button>`,
        Math.max(8, r.left - 120), r.bottom + 8);
      m.addEventListener('click', e => {
        const b = (e.target as Element).closest<HTMLElement>('[data-bereich]');
        if (!b) return;
        m.remove();
        const was = b.dataset.bereich;
        if (was === 'palette') return kopf.querySelector<HTMLElement>('[data-a="palette-toggle"]')?.click();
        if (was === 'studio') return (() => {
          studioOffen = !studioOffen; studioPanel.hidden = !studioOffen;
          if (studioOffen) { paletteOffen = false; palette.hidden = true; wurzel.classList.remove('sp-palette-offen'); studioTab = 'eigenschaften'; studioMalen(); }
          kopfMalen();
        })();

        if (was === 'fokus') { planFokus = !planFokus; wurzel.classList.toggle('sp-plan-fokus', planFokus); kopfMalen(); ansichtAnwenden(); return; }
        if (was === 'voll') return vollAn();
        if (was === 'heft') return heftUmschalten();
        if (was === 'relais') {
          relaisOffen = !relaisOffen;
          if (relaisOffen) { pruefungOffen = false; batterieOffen = false; }
        } else if (was === 'batterien') {
          batterieOffen = !batterieOffen;
          if (batterieOffen) { pruefungOffen = false; relaisOffen = false; }
        } else if (was === 'pruefung') {
          pruefungOffen = !pruefungOffen;
          if (pruefungOffen) { relaisOffen = false; batterieOffen = false; }
        }
        relaisZeigen();
        batteriePanel.hidden = !batterieOffen;
        pruefPanel.hidden = !pruefungOffen;
        if (batterieOffen) batterie?.aktualisiere();
        if (pruefungOffen) pruefMalen();
        kopfMalen();
      });
    };

    /* --- Das Mehr-Menü ---------------------------------------------------- */
    const mehrMenue = (anker: HTMLElement): void => {
      const r = anker.getBoundingClientRect();
      const m = UI.menu(
        `<button data-m="raster">${z.zeigeRaster ? '✓ ' : ''}Raster zeigen</button>` +
        `<button data-m="anschluesse">${z.zeigeAnschluesse ? '✓ ' : ''}Anschlusspunkte zeigen</button>` +
        `<button data-m="nummern">${z.zeigeNummern ? '✓ ' : ''}Anschlussnummern zeigen</button>` +
        '<hr>' +
        '<button data-m="schienen">Stromschienen einzeichnen</button>' +
        '<button data-m="nummerieren">Alle neu durchnummerieren</button>' +
        '<button data-m="plandrehen">Ganzen Plan drehen (90°)</button>' +
        '<hr>' +
        '<button data-m="pruefzentrum">Prüfzentrum / Stückliste (Alt+Umschalt+P)</button>' +
        '<button data-m="vorlage">Als Vorlage speichern</button>' +
        '<button data-m="svg">Als Bild speichern (SVG)</button>' +
        '<button data-m="leeren" data-gefahr>Plan leeren</button>',
        r.left - 180, r.bottom + 6);
      m.addEventListener('click', e => {
        const b = (e.target as Element).closest<HTMLElement>('[data-m]');
        if (!b) return;
        m.remove();
        const was = b.dataset.m;
        if (was === 'pruefzentrum') { pruefungOffen = true; pruefPanel.hidden = false; kopfMalen(); pruefMalen(); return; }
        if (was === 'raster') { z.zeigeRaster = !z.zeigeRaster; return male(); }
        if (was === 'anschluesse') { z.zeigeAnschluesse = !z.zeigeAnschluesse; return male(); }
        if (was === 'nummern') { z.zeigeNummern = !z.zeigeNummern; return male(); }
        if (was === 'schienen') return aendere(() => Schaltplan.schienenBauen(z.plan));
        if (was === 'plandrehen') return planDrehen();
        if (was === 'nummerieren') return aendere(() => {
          /* Erst leeren, dann von vorn — sonst blieben Lücken bestehen. */
          (z.plan.teile as any[]).forEach(t => { t.bmk = ''; });
          (z.plan.teile as any[]).forEach(t => { t.bmk = Schaltplan.naechstesBmk(z.plan, t.zeichen); });
        });
        if (was === 'leeren') return aendere(() => {
          z.plan.teile = []; z.plan.leitungen = []; z.plan.texte = []; z.auswahl.clear();
        });
        if (was === 'vorlage') return vorlageSpeichern();
        if (was === 'svg') return alsBildSpeichern();
      });
    };

    /* --- Vorlagen (Punkt 30) --------------------------------------------- */
    const VORLAGEN = 'elektro:planvorlagen';
    const vorlageSpeichern = (): void => {
      /* Nicht während eines Zugs (E746, dritte Durchsicht): `z.plan` ist dann
         ein Zwischenbild, die billigen Wege, und die Vorlage nähme es mit.
         Erreichbar ist das mit der Tastatur — „…" hat den Fokus, Eingabe,
         während die Maus noch zieht (test611 §14). */
      if (z.zieht) { UI.toast('Erst loslassen — während eines Zugs wird keine Vorlage gespeichert.'); return; }
      void (async () => {
        const name = await UI.frage('Name der Vorlage', '');
        if (!name) return;
        const teile = z.auswahl.size
          ? (z.plan.teile as any[]).filter(t => z.auswahl.has(t.id))
          : z.plan.teile;
        if (!teile.length) { UI.toast('Nichts zu speichern'); return; }
        /* Relativ zur linken oberen Ecke, damit die Vorlage überall passt. */
        const x0 = Math.min(...teile.map((t: any) => t.x));
        const y0 = Math.min(...teile.map((t: any) => t.y));
        const liste = Store.getMeta(VORLAGEN, []) || [];
        liste.push({
          id: Schaltplan.uid(), name, art: z.plan.art,
          teile: teile.map((t: any) => ({ ...t, x: t.x - x0, y: t.y - y0 })),
          leitungen: (z.plan.leitungen as any[])
            .filter(l => !z.auswahl.size || z.auswahl.has(l.id))
            .map(l => ({ ...l, punkte: l.punkte.map((p: any) => ({ x: p.x - x0, y: p.y - y0 })) }))
        });
        Store.setMeta(VORLAGEN, liste);
        UI.toast('✅ Vorlage „' + name + '" gespeichert');
      })();
    };

    const alsBildSpeichern = (): void => {
      /* Ebenso: im Zug wäre das Bild ein Zwischenbild (siehe oben). */
      if (z.zieht) { UI.toast('Erst loslassen — während eines Zugs wird kein Bild gespeichert.'); return; }
      const svg = Schaltplan.alsSvg(z.plan, { raster: false, anschluesse: false });
      const blob = new Blob(
        ['<?xml version="1.0" encoding="UTF-8"?>' +
         svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ')],
        { type: 'image/svg+xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (Schaltplan.artVon(z.plan.art).name || 'Schaltplan') + '.svg';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };

    batterie = (window as any).BatterieAufgaben ? (window as any).BatterieAufgaben.erstelle({
      element: batteriePanel,
      nachStromwechsel: () => kopfMalen(),
      holePlan: () => z.plan,
      holeAuswahl: () => [...z.auswahl],
      aendere: (was: () => void) => aendere(was),
      setzePlan: (plan: any) => {
        z.plan = plan;
        z.auswahl.clear();
        z.werkzeug = 'leitung';
        z.gewaehltesZeichen = '';
        z.simulation = false;
        batterieOffen = true;
        batteriePanel.hidden = false;
      },
      nachPlanwechsel: () => paletteMalen()
    }) : null;
    palette.hidden = !paletteOffen;
    paletteMalen();
    male();
    if (relaisOffen) relaisZeigen();
    return wurzel;
  };

  return { zeichne, paletteHtml, favoriten, favoritUmschalten, ortAus };
})();

(window as any).Planflaeche = Planflaeche;
