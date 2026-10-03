/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/elektro/skizzen.ts (npm run bauen:ts). */
/* ============================================================================
 * bereiche/elektro/skizzen.ts — die Bilder im Formelbuch, selbst gezeichnet
 * ----------------------------------------------------------------------------
 * WARUM SELBST ZEICHNEN UND NICHT ABFOTOGRAFIEREN
 *
 * Ein gedrucktes Formelbuch lebt von seinen Skizzen. Neben `U = R · I` steht
 * ein Stromkreis, neben `Z = √(R² + X²)` ein Dreieck, neben dem
 * Spannungsteiler zwei Widerstände mit einem Abgriff dazwischen. Ohne diese
 * Bilder ist eine Formelsammlung eine Liste; mit ihnen ist sie ein Lehrmittel.
 *
 * Redion zeichnet sie SELBST. Nicht aus Vorsicht allein — obwohl der Satz und
 * die Zeichnungen eines gekauften Buchs fremdes Werk sind und bleiben —,
 * sondern weil selbst gezeichnete Bilder etwas können, was ein Scan nie kann:
 *
 *   · Sie sind Vektoren. Sie werden mit dem Fenster gross und bleiben scharf.
 *   · Sie folgen dem Farbschema. Hell und dunkel, ohne zweiten Satz Bilder.
 *   · Sie kommen aus DENSELBEN Fachzeichen wie der Schaltplan-Editor. Was
 *     im Buch steht, lässt sich im Editor genauso hinsetzen — dasselbe
 *     Symbol, dieselben Anschlussnummern.
 *   · Sie kosten fast nichts. Neunzig Bilder als PNG wären ein Vielfaches
 *     der ganzen App.
 *
 * ZWEI SORTEN, UND DER UNTERSCHIED IST WICHTIG
 *
 *   SCHALTBILDER entstehen aus einem echten `Schaltplan`-Plan und werden von
 *   `Schaltplan.alsSvg` gezeichnet. Kein zweiter Zeichner, keine zweite
 *   Symbolsammlung: wird morgen das Widerstandssymbol geändert, ändert es
 *   sich hier mit.
 *
 *   DIAGRAMME — Dreiecke, Kennlinien, Kurven — sind eigenes SVG. Für sie gibt
 *   es keine Fachzeichen, und ein Zeigerdreieck aus Bauteilen zu bauen wäre
 *   ein Umweg über drei Ecken.
 *
 * KEINE ZAHL WIRD HIER GERECHNET. Die Skizze zeigt die GESTALT einer
 * Schaltung, nicht ihr Ergebnis. Wer rechnen will, tippt die Formel darunter
 * an — dort steht der Rechner, und dort kommt die Zahl aus
 * `Register.elektroformeln` und nicht aus einer zweiten, stillen Quelle.
 * ==========================================================================*/

const Elektroskizzen = (() => {

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  type Ort = { x: number; y: number };
  /** Ein Anschluss: das Bauteil und die Nummer daran. */
  type Klemme = [any, string];

  /* ------------------------------------------------------------------------
   * 1. SCHALTBILDER — über den echten Schaltplan-Zeichner
   * ------------------------------------------------------------------------
   * Die Werkzeuge sind so geschnitten, dass eine Skizze so gelesen wird, wie
   * ein Mensch sie zeichnen würde: „Quelle links, Widerstand rechts, oben
   * herum verbinden." Wer stattdessen Punktkoordinaten hinschreibt, hat beim
   * ersten verschobenen Bauteil zehn falsche Zahlen.
   * ----------------------------------------------------------------------*/

  type Werkzeug = {
    /** Ein Bauteil setzen. `x`/`y` ist die linke obere Ecke des Zeichens. */
    teil: (zeichen: string, bmk: string, x: number, y: number, drehung?: number) => any;
    /** Wo ein Anschluss wirklich liegt — nach Drehung und Spiegelung. */
    an: (teil: any, nr: string) => Ort;
    /** Anschluss an Anschluss, mit Knickpunkten dazwischen. */
    draht: (a: any, aNr: string, b: any, bNr: string, ...knicke: Ort[]) => void;
    /**
     * Zwei Anschlüsse über einen WAAGRECHTEN Steg auf Höhe `y` verbinden:
     * hoch (oder runter) zum Steg, hinüber, wieder herunter.
     */
    steg: (a: any, aNr: string, b: any, bNr: string, y: number) => void;
    /**
     * Eine Sammelleitung auf Höhe `y` durch mehrere Anschlüsse — genau das,
     * was eine Parallelschaltung im Buch ist.
     */
    sammel: (y: number, ...klemmen: Klemme[]) => void;
    /** Eine Leitung, die AN einem Anschluss beginnt und frei weiterläuft. */
    ab: (teil: any, nr: string, ...punkte: Ort[]) => void;
    /** Eine freie Leitung ohne Bauteilenden. */
    linie: (...punkte: Ort[]) => void;
    /** Beschriftung. `x` ist der linke Rand des Textes. */
    text: (t: string, x: number, y: number) => void;
  };

  const planSvg = (breite: number, hoehe: number,
                   bauen: (w: Werkzeug) => void): string => {
    if (typeof Schaltplan === 'undefined') return '';
    const plan = Schaltplan.neuerPlan('stromlauf-aufgeloest');
    plan.breite = breite; plan.hoehe = hoehe;
    plan.teile = []; plan.leitungen = []; plan.texte = [];
    let z = 0;
    const w: Werkzeug = {
      teil: (zeichen, bmk, x, y, drehung = 0) => {
        const t = { id: 't' + (++z), zeichen, x, y, drehung, gespiegelt: false,
                    bmk, nummern: {}, gruppe: '', ebene: 'plan' };
        plan.teile.push(t);
        return t;
      },
      an: (teil, nr) => {
        const a = (Schaltplan.anschluesseVon(teil) as any[])
          .find(x => String(x.nr) === nr);
        /* Ein fehlender Anschluss wäre ein Tippfehler in der Skizze, kein
           Laufzeitfall — aber ein Absturz im Formelbuch wäre schlimmer als
           eine Leitung, die in der Bauteilmitte beginnt. Der Prüflauf sucht
           genau danach. */
        return a ? { x: a.x, y: a.y } : { x: teil.x, y: teil.y };
      },
      draht: (a, aNr, b, bNr, ...knicke) => {
        plan.leitungen.push({
          id: 'l' + (++z), ebene: 'plan',
          punkte: [w.an(a, aNr), ...knicke, w.an(b, bNr)],
          vonTeil: a.id, vonNr: aNr, nachTeil: b.id, nachNr: bNr
        });
      },
      steg: (a, aNr, b, bNr, y) => {
        const p = w.an(a, aNr), q = w.an(b, bNr);
        w.draht(a, aNr, b, bNr, { x: p.x, y }, { x: q.x, y });
      },
      sammel: (y, ...klemmen) => {
        if (klemmen.length < 2) return;
        const orte = klemmen.map(([t, nr]) => w.an(t, nr));
        const xs = orte.map(o => o.x);
        w.linie({ x: Math.min(...xs), y }, { x: Math.max(...xs), y });
        klemmen.forEach(([t, nr], i) => {
          const o = orte[i]!;
          /* Liegt der Anschluss SCHON auf der Sammelhöhe, gibt es keinen
             Stummel — eine Leitung von einem Punkt zu demselben Punkt ist
             keine, und der Prüflauf hält das zu Recht für einen Fehler. */
          if (Math.abs(o.y - y) < 0.5) return;
          plan.leitungen.push({
            id: 'l' + (++z), ebene: 'plan',
            punkte: [o, { x: o.x, y }],
            vonTeil: t.id, vonNr: nr
          });
        });
      },
      ab: (teil, nr, ...punkte) => {
        plan.leitungen.push({
          id: 'l' + (++z), ebene: 'plan',
          punkte: [w.an(teil, nr), ...punkte],
          vonTeil: teil.id, vonNr: nr
        });
      },
      linie: (...punkte) => {
        plan.leitungen.push({ id: 'l' + (++z), ebene: 'plan', punkte });
      },
      text: (t, x, y) => {
        plan.texte.push({ id: 'x' + (++z), x, y, t, ebene: 'plan' });
      }
    };
    bauen(w);
    return Schaltplan.alsSvg(plan, { raster: false, anschluesse: false, bmk: true });
  };

  /* ------------------------------------------------------------------------
   * 2. DIAGRAMME — eigenes SVG
   * ------------------------------------------------------------------------
   * Farben kommen aus den Stil-Variablen, damit hell und dunkel ohne einen
   * zweiten Satz Bilder auskommen (§39).
   * ----------------------------------------------------------------------*/

  const STRICH = 'var(--text)';
  const BETONT = 'var(--accent)';
  const BLASS  = 'var(--text-faint)';

  const svg = (breite: number, hoehe: number, inhalt: string): string =>
    `<svg class="sk-bild" viewBox="0 0 ${breite} ${hoehe}" ` +
    `preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">` +
    `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${inhalt}</g></svg>`;

  const lin = (x1: number, y1: number, x2: number, y2: number,
               farbe = STRICH, breit = 1.6): string =>
    `<path d="M${x1},${y1} L${x2},${y2}" stroke="${farbe}" stroke-width="${breit}"/>`;

  const strichel = (x1: number, y1: number, x2: number, y2: number): string =>
    `<path d="M${x1},${y1} L${x2},${y2}" stroke="${BLASS}" stroke-width="1" ` +
    `stroke-dasharray="4 3"/>`;

  const pfeil = (x1: number, y1: number, x2: number, y2: number,
                 farbe = STRICH, breit = 1.6): string => {
    const dx = x2 - x1, dy = y2 - y1;
    const l = Math.hypot(dx, dy) || 1;
    const ex = dx / l, ey = dy / l;
    const s = 7;
    const p1x = x2 - ex * s - ey * s * 0.45, p1y = y2 - ey * s + ex * s * 0.45;
    const p2x = x2 - ex * s + ey * s * 0.45, p2y = y2 - ey * s - ex * s * 0.45;
    return lin(x1, y1, x2, y2, farbe, breit) +
      `<path d="M${x2},${y2} L${p1x.toFixed(1)},${p1y.toFixed(1)} ` +
      `L${p2x.toFixed(1)},${p2y.toFixed(1)} Z" fill="${farbe}" stroke="none"/>`;
  };

  /**
   * `X_L` wird zu X mit tiefgestelltem L — wie im Schaltplan-Zeichner, aus
   * demselben Grund und mit derselben Reihenfolge: erst escapen, dann
   * auszeichnen (§19).
   */
  /* WELCHE ZEICHEN TIEFGESTELLT WERDEN, und warum die alte Liste zu kurz war.
   *
   * Hier stand `[A-Za-zÄÖÜäöüß0-9]`. Das ist die deutsche Tastatur, nicht die
   * Physik. Im Heft steht `R_ϑ` (Widerstand bei der Temperatur ϑ), `S_Δ`
   * (Scheinleistung in Dreieckschaltung) und `AF_%` (relativer Anzeigefehler)
   * — 42 Stellen, an denen der Unterstrich als Unterstrich stehen blieb.
   *
   * Ein sichtbarer Unterstrich in einer Formel ist kein Schönheitsfehler: er
   * sieht aus wie ein Zeichen der Formel. `R_ϑ` liest sich als „R Unterstrich
   * Theta", und es gibt keine solche Grösse.
   *
   * `\p{L}` nimmt jeden Buchstaben JEDER Schrift, `\p{N}` jede Ziffer, und
   * `%` steht ausdrücklich dabei, weil es keins von beidem ist. Was nicht
   * dazugehört — Leerzeichen, Klammern, Rechenzeichen — beendet die
   * Tiefstellung weiterhin. Und weil `esc` VORHER läuft, kann durch die
   * Erweiterung kein Zeichen hereinkommen, das vorher draussen war.
   *
   * Dieselbe Zeile steht in `schaltplan.ts`, `skizzen.ts` und
   * `formelheft.ts`. test244 vergleicht die drei — auseinanderlaufen ist
   * genau der Weg, auf dem dieser Fehler entstanden ist.
   */
  const tief = (wert: unknown): string =>
    esc(wert).replace(/_([\p{L}\p{N}%]+)/gu,
      '<tspan baseline-shift="sub" font-size="0.72em">$1</tspan>');

  const txt = (t: string, x: number, y: number,
               anker: 'start' | 'middle' | 'end' = 'middle',
               farbe = STRICH, groesse = 13): string =>
    `<text x="${x}" y="${y}" text-anchor="${anker}" fill="${farbe}" stroke="none" ` +
    `font-size="${groesse}" font-style="italic">${tief(t)}</text>`;

  /** Achsenkreuz mit Beschriftung an den Spitzen. */
  const achsen = (x0: number, y0: number, breite: number, hoehe: number,
                  wLabel: string, hLabel: string): string =>
    pfeil(x0, y0, x0 + breite, y0, BLASS, 1.3) +
    pfeil(x0, y0, x0, y0 - hoehe, BLASS, 1.3) +
    txt(wLabel, x0 + breite, y0 + 17, 'end', BLASS, 12) +
    txt(hLabel, x0 - 7, y0 - hoehe + 5, 'end', BLASS, 12);

  /** Ein rechtwinkliges Dreieck mit drei Beschriftungen — S/P/Q und Z/R/X. */
  const dreieck = (unten: string, rechts: string, schraeg: string): string =>
    svg(300, 175,
      pfeil(50, 135, 230, 135, STRICH, 2) +
      pfeil(230, 135, 230, 48, STRICH, 2) +
      pfeil(50, 135, 230, 48, BETONT, 2.4) +
      `<path d="M50,135 A38,38 0 0,0 87,123" stroke="${BLASS}" stroke-width="1.2"/>` +
      txt(unten, 140, 156, 'middle', STRICH) +
      txt(rechts, 246, 96, 'start', STRICH) +
      txt(schraeg, 128, 82, 'middle', BETONT) +
      txt('φ', 77, 129, 'middle', BLASS, 12));

  /* ------------------------------------------------------------------------
   * 3. DIE SKIZZEN
   * ------------------------------------------------------------------------
   * Der Schlüssel ist die Abschnittskennung aus `Register.elektroformeln`.
   * Ein Abschnitt ohne Eintrag bekommt kein Bild — das ist eine Lücke, kein
   * Fehler, und sie fällt beim Durchblättern auf.
   * ----------------------------------------------------------------------*/

  const SKIZZEN: Record<string, () => string> = {

    /* --- Seite 4 · Grundlagen Elektrotechnik ---------------------------- */

    'g-ohm': () => planSvg(300, 190, w => {
      const g = w.teil('gleichspannung', 'G', 40, 60);
      const r = w.teil('widerstand', 'R', 210, 60);
      w.steg(g, '+', r, '1', 25);
      w.steg(g, '−', r, '2', 160);
      w.text('U', 145, 20);
      w.text('I', 145, 180);
    }),

    'g-leiter': () => svg(300, 165,
      `<path d="M60,50 L240,50 L240,110 L60,110 Z" stroke="${STRICH}" stroke-width="1.6"/>` +
      `<ellipse cx="60" cy="80" rx="12" ry="30" stroke="${STRICH}" stroke-width="1.6" ` +
      `fill="var(--bg-hover)"/>` +
      `<ellipse cx="240" cy="80" rx="12" ry="30" stroke="${STRICH}" stroke-width="1.6" fill="none"/>` +
      pfeil(150, 136, 240, 136, BETONT, 1.4) + pfeil(150, 136, 60, 136, BETONT, 1.4) +
      txt('l', 150, 156, 'middle', BETONT) +
      txt('A', 38, 84, 'end', BETONT) +
      txt('ρ', 150, 86, 'middle', BLASS)),

    'g-temperatur': () => svg(300, 165,
      achsen(45, 132, 215, 105, 'ϑ', 'R') +
      lin(45, 108, 250, 46, BETONT, 2) +
      strichel(45, 108, 250, 108) + strichel(250, 46, 250, 108) +
      txt('R₂₀', 39, 112, 'end', BLASS, 12) +
      txt('ΔR', 258, 80, 'start', BETONT, 12) +
      txt('Δϑ', 148, 126, 'middle', BLASS, 12)),

    /* --- Seite 5 · Schaltungen von Widerständen ------------------------- */

    's-reihe': () => planSvg(320, 310, w => {
      const g  = w.teil('gleichspannung', 'G', 30, 115);
      const r1 = w.teil('widerstand', 'R1', 220, 30);
      const r2 = w.teil('widerstand', 'R2', 220, 105);
      const r3 = w.teil('widerstand', 'R3', 220, 180);
      w.steg(g, '+', r1, '1', 22);
      w.draht(r1, '2', r2, '1');
      w.draht(r2, '2', r3, '1');
      w.steg(r3, '2', g, '−', 278);
      w.text('U', 120, 18);
      w.text('I', 120, 296);
    }),

    's-parallel': () => planSvg(410, 215, w => {
      const g  = w.teil('gleichspannung', 'G', 20, 70);
      const r1 = w.teil('widerstand', 'R1', 140, 70);
      const r2 = w.teil('widerstand', 'R2', 240, 70);
      const r3 = w.teil('widerstand', 'R3', 340, 70);
      w.sammel(28, [g, '+'], [r1, '1'], [r2, '1'], [r3, '1']);
      w.sammel(188, [g, '−'], [r1, '2'], [r2, '2'], [r3, '2']);
      w.text('U', 88, 24);
      w.text('I', 88, 205);
      w.text('I₁', 166, 62);
      w.text('I₂', 266, 62);
      w.text('I₃', 366, 62);
    }),

    /* --- Seite 6 · Spannungsteiler und Brücke --------------------------- */

    's-teiler': () => planSvg(300, 265, w => {
      const g  = w.teil('gleichspannung', 'G', 20, 90);
      const r1 = w.teil('widerstand', 'R1', 170, 30);
      const r2 = w.teil('widerstand', 'R2', 170, 150);
      /* Der obere Steg lag auf y = 15 und das `U` darüber auf y = 11 — und
         eine 13 px hohe Grossbuchstabenzeile braucht über ihrer Grundlinie
         etwa 14. Das `U` stand also mit dem Kopf ausserhalb des Blattes und
         war oben abgeschnitten. Steg und Beschriftung rücken 7 px nach
         unten; die Bauteile bleiben, wo sie sind. */
      w.steg(g, '+', r1, '1', 22);
      w.draht(r1, '2', r2, '1');
      w.steg(r2, '2', g, '−', 248);
      /* Der Abgriff: zwischen den beiden Widerständen heraus und unten
         heraus — dazwischen steht U₂. */
      w.linie({ x: 190, y: 120 }, { x: 265, y: 120 });
      w.linie({ x: 190, y: 248 }, { x: 265, y: 248 });
      w.text('U', 92, 18);
      w.text('U₂', 272, 188);
    }),

    's-bruecke': () => planSvg(370, 300, w => {
      const g  = w.teil('gleichspannung', 'G', 20, 110);
      const rx = w.teil('widerstand', 'Rx', 140, 40);
      const r2 = w.teil('widerstand', 'R2', 140, 180);
      const r3 = w.teil('widerstand', 'R3', 290, 40);
      const r4 = w.teil('widerstand', 'R4', 290, 180);
      const v  = w.teil('voltmeter', 'UB', 200, 110);
      w.sammel(20, [g, '+'], [rx, '1'], [r3, '1']);
      w.draht(rx, '2', r2, '1');
      w.draht(r3, '2', r4, '1');
      w.sammel(280, [g, '−'], [r2, '2'], [r4, '2']);
      w.draht(v, '+', rx, '2', { x: 160, y: 140 });
      w.draht(v, '−', r3, '2', { x: 310, y: 140 });
      w.text('U', 90, 16);
    }),

    /* --- Seite 7 · Messtechnik ------------------------------------------ */

    'm-vmeter': () => planSvg(390, 170, w => {
      /* Vorwiderstand in REIHE zum Messwerk: was zu viel ist, fällt an ihm ab. */
      const rv = w.teil('widerstand', 'Rv', 130, 30, 90);
      const v  = w.teil('voltmeter', 'V', 230, 30);
      w.ab(rv, '2', { x: 30, y: 60 });
      w.draht(rv, '1', v, '+');
      w.ab(v, '−', { x: 360, y: 60 });
      w.text('U_V', 132, 26);
      w.text('U_m', 244, 26);
      w.text('U', 190, 148);
      w.linie({ x: 30, y: 60 }, { x: 30, y: 120 });
      w.linie({ x: 360, y: 60 }, { x: 360, y: 120 });
      w.linie({ x: 30, y: 120 }, { x: 360, y: 120 });
    }),

    'm-ameter': () => planSvg(390, 210, w => {
      /* Shunt PARALLEL zum Messwerk: was zu viel ist, fliesst daran vorbei. */
      const a  = w.teil('amperemeter', 'A', 160, 30);
      const rp = w.teil('widerstand', 'Rp', 190, 130, 90);
      w.ab(a, '+', { x: 40, y: 60 });
      w.ab(a, '−', { x: 350, y: 60 });
      w.ab(rp, '2', { x: 110, y: 160 }, { x: 110, y: 60 });
      w.ab(rp, '1', { x: 290, y: 160 }, { x: 290, y: 60 });
      w.text('I', 44, 50);
      w.text('I_m', 172, 24);
      w.text('I_p', 186, 200);
    }),

    'm-spannungsfehler': () => planSvg(400, 215, w => {
      /* A vor V: das Amperemeter misst nur den Verbraucherstrom, aber die
         Spannung enthält den Abfall am Amperemeter. */
      const g = w.teil('gleichspannung', 'G', 20, 75);
      const a = w.teil('amperemeter', 'A', 110, 5);
      const v = w.teil('voltmeter', 'V', 210, 75);
      const r = w.teil('widerstand', 'R', 340, 75);
      w.draht(g, '+', a, '+', { x: 50, y: 35 });
      w.draht(a, '−', r, '1', { x: 360, y: 35 });
      w.steg(g, '−', r, '2', 195);
      w.draht(v, '+', a, '−', { x: 190, y: 105 }, { x: 190, y: 35 });
      w.linie({ x: 270, y: 105 }, { x: 360, y: 105 });
      w.text('U_A', 122, 70);
      w.text('U_R', 288, 70);
    }),

    'm-stromfehler': () => planSvg(400, 215, w => {
      /* V vor A: das Voltmeter misst nur die Verbraucherspannung, aber der
         Strom enthält den Strom durch das Voltmeter. */
      const g = w.teil('gleichspannung', 'G', 20, 75);
      const v = w.teil('voltmeter', 'V', 100, 5);
      const a = w.teil('amperemeter', 'A', 220, 5);
      const r = w.teil('widerstand', 'R', 340, 75);
      w.draht(g, '+', v, '+', { x: 50, y: 35 });
      w.draht(v, '−', a, '+');
      w.draht(a, '−', r, '1', { x: 360, y: 35 });
      w.steg(g, '−', r, '2', 195);
      w.linie({ x: 160, y: 35 }, { x: 160, y: 120 });
      w.linie({ x: 160, y: 120 }, { x: 360, y: 120 });
      w.text('I_V', 166, 100);
      w.text('I_R', 286, 70);
    }),

    /* --- Seite 8 · Leistung --------------------------------------------- */

    'a-gleich': () => planSvg(390, 215, w => {
      const g = w.teil('gleichspannung', 'G', 20, 75);
      const a = w.teil('amperemeter', 'A', 120, 5);
      const v = w.teil('voltmeter', 'V', 230, 75);
      const r = w.teil('widerstand', 'R', 330, 75);
      w.draht(g, '+', a, '+', { x: 50, y: 35 });
      w.draht(a, '−', r, '1', { x: 350, y: 35 });
      w.steg(g, '−', r, '2', 195);
      w.draht(v, '+', a, '−', { x: 210, y: 105 }, { x: 210, y: 35 });
      w.linie({ x: 290, y: 105 }, { x: 350, y: 105 });
    }),

    'a-wechsel': () => dreieck('P', 'Q', 'S'),

    /* --- Seite 9 · Wirkungsgrad und Wärme -------------------------------- */

    'a-wirkungsgrad': () => svg(320, 155,
      `<rect x="112" y="48" width="96" height="58" rx="6" stroke="${STRICH}" ` +
      `stroke-width="1.6" fill="var(--bg-hover)"/>` +
      pfeil(22, 77, 108, 77, BETONT, 2.4) +
      pfeil(212, 77, 292, 77, BETONT, 1.8) +
      pfeil(160, 46, 160, 14, BLASS, 1.6) +
      txt('P₁', 62, 68, 'middle', BETONT) +
      txt('P₂', 254, 68, 'middle', BETONT) +
      txt('P_v', 170, 28, 'start', BLASS, 12) +
      txt('η', 160, 84, 'middle', STRICH, 16) +
      txt('P₁ = P₂ + P_v', 160, 140, 'middle', BLASS, 12)),

    'a-waerme': () => svg(280, 196,
      `<path d="M72,72 L188,72 L188,132 Q188,144 176,144 L84,144 Q72,144 72,132 Z" ` +
      `fill="var(--bg-hover)" stroke="none"/>` +
      `<path d="M72,48 L72,132 Q72,144 84,144 L176,144 Q188,144 188,132 L188,48" ` +
      `stroke="${STRICH}" stroke-width="1.8"/>` +
      `<path d="M58,154 L202,154" stroke="${STRICH}" stroke-width="3"/>` +
      lin(130, 154, 130, 170, STRICH, 1.6) +
      lin(152, 32, 152, 100, BETONT, 2.2) +
      `<circle cx="152" cy="106" r="6" fill="${BETONT}" stroke="none"/>` +
      txt('m, c', 106, 116, 'middle', STRICH, 12) +
      txt('Δϑ', 166, 36, 'start', BETONT, 12) +
      txt('Q', 130, 180, 'middle', BLASS, 12)),

    /* --- Seite 11 · Batterien ------------------------------------------- */

    'b-innen': () => planSvg(390, 250, w => {
      /* Der Innenwiderstand steckt IN der Quelle — darum der gestrichelte
         Kasten im Buch. Hier steht er sichtbar daneben, denn genau das ist
         der Denkfehler, den die Formel auflöst: man misst ihn nie direkt. */
      const g  = w.teil('gleichspannung', 'U0', 40, 110);
      const ri = w.teil('widerstand', 'Ri', 50, 30);
      const rl = w.teil('widerstand', 'RL', 300, 110);
      w.draht(g, '+', ri, '2');
      /* Wie beim Spannungsteiler: das `I` sass auf y = 12 und stiess mit
         seinem Kopf über die Blattkante. Steg und Beschriftung 6 px tiefer. */
      w.steg(ri, '1', rl, '1', 22);
      w.steg(g, '−', rl, '2', 230);
      w.text('U', 190, 160);
      w.text('I', 190, 18);
      w.text('U_Ri', 100, 62);
    }),

    /* 270 statt 250 breit: das Betriebsmittelkennzeichen „RL" steht 6 px
       rechts neben dem Widerstand, und der endet bei 230. Mit 250 lag die
       Beschriftung des rechten Bauteils ausserhalb des Blattes. */
    'b-reihe': () => planSvg(270, 310, w => {
      const b1 = w.teil('batterie', 'G1', 50, 15);
      const b2 = w.teil('batterie', 'G2', 50, 105);
      const b3 = w.teil('batterie', 'G3', 50, 195);
      const r  = w.teil('widerstand', 'RL', 190, 105);
      w.draht(b1, '−', b2, '+');
      w.draht(b2, '−', b3, '+');
      w.steg(b1, '+', r, '1', 6);
      w.steg(b3, '−', r, '2', 290);
      w.text('U₀', 118, 160);
      w.text('U₀₁', 22, 60);
    }),

    'b-parallel': () => planSvg(390, 225, w => {
      const b1 = w.teil('batterie', 'G1', 40, 75);
      const b2 = w.teil('batterie', 'G2', 120, 75);
      const b3 = w.teil('batterie', 'G3', 200, 75);
      const r  = w.teil('widerstand', 'RL', 320, 75);
      w.sammel(30, [b1, '+'], [b2, '+'], [b3, '+'], [r, '1']);
      w.sammel(200, [b1, '−'], [b2, '−'], [b3, '−'], [r, '2']);
      w.text('I₁', 66, 70);
      w.text('I', 270, 24);
    }),

    /* --- Seite 12 · Kondensator ----------------------------------------- */

    'c-parallel': () => planSvg(410, 215, w => {
      const g  = w.teil('gleichspannung', 'G', 20, 70);
      const c1 = w.teil('kondensator', 'C1', 140, 70);
      const c2 = w.teil('kondensator', 'C2', 240, 70);
      const c3 = w.teil('kondensator', 'C3', 340, 70);
      w.sammel(28, [g, '+'], [c1, '1'], [c2, '1'], [c3, '1']);
      w.sammel(188, [g, '−'], [c1, '2'], [c2, '2'], [c3, '2']);
      w.text('U', 88, 24);
    }),

    'c-reihe': () => planSvg(300, 310, w => {
      const g  = w.teil('gleichspannung', 'G', 20, 115);
      const c1 = w.teil('kondensator', 'C1', 210, 30);
      const c2 = w.teil('kondensator', 'C2', 210, 105);
      const c3 = w.teil('kondensator', 'C3', 210, 180);
      w.steg(g, '+', c1, '1', 22);
      w.draht(c1, '2', c2, '1');
      w.draht(c2, '2', c3, '1');
      w.steg(c3, '2', g, '−', 278);
      w.text('U', 115, 18);
    }),

    'c-laden': () => planSvg(390, 230, w => {
      /* Schalter und Widerstand liegen WAAGRECHT in der oberen Leitung —
         so wie man einen Ladekreis zeichnet, wenn man ihn erklärt. Gedreht
         wandern die Anschlüsse mit; `w.an` weiss davon, die Skizze muss es
         nicht wissen. */
      const g = w.teil('gleichspannung', 'G', 20, 90);
      const s = w.teil('schliesser', 'S1', 130, 20, 90);
      const r = w.teil('widerstand', 'R', 240, 20, 90);
      const c = w.teil('kondensator', 'C', 330, 90);
      w.draht(g, '+', s, '4', { x: 50, y: 50 });
      w.draht(s, '3', r, '2');
      w.draht(r, '1', c, '1', { x: 350, y: 50 });
      w.steg(g, '−', c, '2', 200);
      w.text('U_C', 250, 140);
    }),

    /* --- Seite 13 · Magnetische Grössen --------------------------------- */

    'mag-feld': () => svg(300, 180,
      /* Der Kern als geschlossener Rahmen, die Wicklung UM den linken
         Schenkel: vier Bögen, die links davon herausstehen. Lagen sie
         daneben statt darum, sah es aus wie eine Spule neben einem Kasten
         — und genau so sah es aus, bis jemand hingesehen hat. */
      `<rect x="72" y="40" width="168" height="96" rx="4" stroke="${STRICH}" ` +
      `stroke-width="2" fill="none"/>` +
      `<rect x="98" y="66" width="116" height="44" rx="3" stroke="${STRICH}" ` +
      `stroke-width="2" fill="none"/>` +
      [0, 1, 2, 3].map(i =>
        `<path d="M85,${52 + i * 20} A11,10 0 1,0 85,${72 + i * 20}" ` +
        `stroke="${BETONT}" stroke-width="2" fill="none"/>`).join('') +
      pfeil(150, 32, 200, 32, BETONT, 1.5) +
      txt('Φ', 208, 36, 'start', BETONT, 12) +
      txt('N · I', 40, 32, 'start', BETONT, 12) +
      txt('l_m', 156, 160, 'middle', BLASS, 12) +
      txt('A', 250, 92, 'start', BLASS, 12)),

    /* --- Seite 13 · Wechselstrom-Grundlagen ------------------------------ */

    'w-frequenz': () => {
      const links = 46, rechts = 275, mitte = 92, hoch = 58;
      let d = `M${links},${mitte}`;
      for (let i = 1; i <= 120; i++) {
        const x = links + (rechts - links) * i / 120;
        const y = mitte - hoch * Math.sin(2 * Math.PI * i / 60);
        d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
      }
      return svg(300, 175,
        pfeil(links, mitte, rechts + 16, mitte, BLASS, 1.3) +
        pfeil(links, mitte, links, mitte - hoch - 22, BLASS, 1.3) +
        `<path d="${d}" stroke="${BETONT}" stroke-width="2" fill="none"/>` +
        `<path d="M${links},${mitte - hoch} L${rechts},${mitte - hoch}" ` +
        `stroke="${STRICH}" stroke-width="1" stroke-dasharray="5 4"/>` +
        `<path d="M${links},${(mitte - hoch * 0.707).toFixed(1)} ` +
        `L${rechts},${(mitte - hoch * 0.707).toFixed(1)}" ` +
        `stroke="${STRICH}" stroke-width="1" stroke-dasharray="2 3"/>` +
        txt('û', links - 7, mitte - hoch + 5, 'end', STRICH, 12) +
        txt('U', links - 7, mitte - hoch * 0.707 + 5, 'end', STRICH, 12) +
        txt('T', links + (rechts - links) / 4, mitte + 22, 'middle', BLASS, 12) +
        txt('t', rechts + 14, mitte + 20, 'end', BLASS, 12));
    },


    /* --- Seite 13 · die drei Bild-Abschnitte des Magnetkapitels ---------
     * Das Heft hat hier drei Überschriften OHNE Formeln — sie erklären mit
     * Bildern. Ohne Zeichnung stünde in Redion eine Überschrift über nichts,
     * und die Seite wäre gerade dort dünn, wo das Heft anschaulich wird.
     * -------------------------------------------------------------------*/

    's13-ummagnetisierungskennlinien': () => {
      /* Eine echte Hystereseschleife, nicht ein Blatt.
       *
       * Der erste Versuch änderte nur die Kontrollpunkte einer Linse — und
       * die breite sah aus wie die schmale. Damit war das Bild wertlos: es
       * zeigt ZWEI Kurven, und ihr Unterschied IST die Aussage.
       *
       * Jetzt bestimmt `hc` die Koerzitivfeldstärke — wie weit man das Feld
       * umkehren muss, bis der Werkstoff seine Magnetisierung aufgibt. Beim
       * Dauermagneten weit, beim Trafokern fast nicht. Die eingeschlossene
       * FLÄCHE ist die Verlustarbeit je Ummagnetisierung; darum will man im
       * Kern die schmale.
       */
      const schleife = (cx: number, hc: number): string => {
        const cy = 88, hx = 50, by = 40;
        const d =
          `M${cx - hx},${cy + by} ` +
          `C${cx - hc * 2},${cy + by} ${cx - hc},${cy + by * 0.2} ${cx - hc},${cy} ` +
          `C${cx - hc},${cy - by * 0.8} ${cx + hx * 0.4},${cy - by} ${cx + hx},${cy - by} ` +
          `C${cx + hc * 2},${cy - by} ${cx + hc},${cy - by * 0.2} ${cx + hc},${cy} ` +
          `C${cx + hc},${cy + by * 0.8} ${cx - hx * 0.4},${cy + by} ${cx - hx},${cy + by} Z`;
        return `<path d="${d}" stroke="${BETONT}" stroke-width="2.1" fill="none"/>`;
      };
      const kreuz = (cx: number): string =>
        pfeil(cx - 62, 88, cx + 62, 88, BLASS, 1.2) +
        pfeil(cx, 142, cx, 34, BLASS, 1.2) +
        txt('B', cx - 8, 42, 'end', BLASS, 11) +
        txt('H', cx + 60, 104, 'end', BLASS, 11);
      return svg(340, 180,
        kreuz(86) + schleife(86, 24) +
        kreuz(254) + schleife(254, 5) +
        txt('hartmagnetisch', 86, 170, 'middle', STRICH, 11) +
        txt('weichmagnetisch', 254, 170, 'middle', STRICH, 11));
    },

    's13-magnetfelder-bei-spulen': () => {
      /* Feldlinien um eine Spule im Längsschnitt: innen dicht und gerade,
       * aussen weit ausholend und geschlossen. Dass sie GESCHLOSSEN sind,
       * ist der ganze Unterschied zum elektrischen Feld.
       *
       * Beim Hinsehen fielen drei Dinge auf, die kein Prüflauf sehen kann:
       *
       *  · Das `I` stand über einer Stelle, an der gar keine Leitung war.
       *    Eine Beschriftung ohne Gegenstand ist schlimmer als keine.
       *  · Nur der Nordpol war benannt. Eine Spule hat zwei Pole, und der
       *    Südpol ist der, an dem die Linien wieder hineingehen — genau die
       *    Aussage, die das Bild machen soll.
       *  · Der gerade Teil der Feldlinie wurde zweimal übereinander
       *    gezeichnet, weil beide Linien ihn im selben `d` mitführten.
       */
      const wick = [0, 1, 2, 3, 4].map(i =>
        `<path d="M${116 + i * 22},72 A14,14 0 1,1 ${116 + i * 22},108" ` +
        `stroke="${STRICH}" stroke-width="2" fill="none"/>`).join('');
      /* Der gerade Teil liegt innen und gehört beiden Linien — einmal. */
      const kern = `<path d="M120,90 L218,90" stroke="${BETONT}" ` +
        `stroke-width="1.5" fill="none"/>`;
      const bogen = (dy: number): string =>
        `<path d="M218,90 C${262 + dy},90 ${262 + dy},${52 - dy} 169,${52 - dy} ` +
        `C${76 - dy},${52 - dy} ${76 - dy},90 120,90" stroke="${BETONT}" ` +
        `stroke-width="1.5" fill="none"/>`;
      return svg(340, 196,
        bogen(0) + bogen(14) + kern +
        wick +
        /* Zuleitungen, damit das `I` etwas hat, woran es steht. */
        lin(116, 108, 116, 152, STRICH, 1.6) +
        pfeil(64, 152, 116, 152, STRICH, 1.6) +
        lin(204, 108, 204, 152, STRICH, 1.6) +
        lin(204, 152, 256, 152, STRICH, 1.6) +
        pfeil(146, 90, 184, 90, BETONT, 1.8) +
        txt('I', 60, 148, 'end', STRICH, 12) +
        txt('Φ', 169, 30, 'middle', BETONT, 12) +
        txt('S', 112, 80, 'end', STRICH, 12) +
        txt('N', 226, 80, 'start', STRICH, 12) +
        txt('Die Feldlinien sind geschlossen.', 170, 184, 'middle', BLASS, 11));
    },

    's13-kraefte-auf-strom-durchflossene': () => {
      /* Ein Leiter im Feld zwischen Nord und Süd: Strom in die Zeichenebene
         (das ⊗), Feld von oben nach unten, Kraft nach rechts. Die drei
         stehen senkrecht aufeinander — das ist die ganze Aussage. */
      const feldpfeil = (x: number): string => pfeil(x, 52, x, 128, BLASS, 1.3);
      return svg(320, 190,
        `<rect x="60" y="30" width="200" height="22" rx="3" stroke="${STRICH}" ` +
        `stroke-width="1.6" fill="var(--bg-hover)"/>` +
        `<rect x="60" y="128" width="200" height="22" rx="3" stroke="${STRICH}" ` +
        `stroke-width="1.6" fill="var(--bg-hover)"/>` +
        txt('N', 160, 47, 'middle', STRICH, 13) +
        txt('S', 160, 145, 'middle', STRICH, 13) +
        [90, 130, 210, 250].map(feldpfeil).join('') +
        `<circle cx="160" cy="90" r="13" stroke="${BETONT}" stroke-width="2" fill="none"/>` +
        lin(151, 81, 169, 99, BETONT, 2) + lin(169, 81, 151, 99, BETONT, 2) +
        pfeil(178, 90, 240, 90, BETONT, 2.2) +
        txt('I', 160, 118, 'middle', BETONT, 12) +
        txt('F', 248, 86, 'start', BETONT, 13) +
        txt('B', 84, 96, 'end', BLASS, 12) +
        txt('F = B · I · l', 160, 180, 'middle', BLASS, 11));
    },

    /* --- Seite 14/15 · Wechselstromwiderstände --------------------------- */

    'wx-induktiv': () => planSvg(280, 200, w => {
      const g = w.teil('wechselspannung', 'G', 30, 70);
      const l = w.teil('spule-induktivitaet', 'L', 200, 70);
      w.steg(g, 'L', l, '1', 28);
      w.steg(g, 'N', l, '2', 172);
      w.text('U_L', 122, 24);
      w.text('X_L', 236, 105);
    }),

    'wx-kapazitiv': () => planSvg(280, 200, w => {
      const g = w.teil('wechselspannung', 'G', 30, 70);
      const c = w.teil('kondensator', 'C', 200, 70);
      w.steg(g, 'L', c, '1', 28);
      w.steg(g, 'N', c, '2', 172);
      w.text('U_C', 122, 24);
      w.text('X_C', 236, 105);
    }),

    'wx-reihe': () => dreieck('R', 'X', 'Z'),

    'wx-reihe-rlc': () => planSvg(300, 330, w => {
      const g = w.teil('wechselspannung', 'G', 20, 130);
      const r = w.teil('widerstand', 'R', 210, 35);
      const l = w.teil('spule-induktivitaet', 'L', 210, 105);
      const c = w.teil('kondensator', 'C', 210, 185);
      w.steg(g, 'L', r, '1', 24);
      w.draht(r, '2', l, '1');
      w.draht(l, '2', c, '1');
      w.steg(c, '2', g, 'N', 296);
      w.text('U', 118, 18);
      w.text('I', 118, 314);
    }),

    'wx-parallel': () => planSvg(380, 220, w => {
      const g = w.teil('wechselspannung', 'G', 20, 75);
      const r = w.teil('widerstand', 'R', 180, 75);
      const l = w.teil('spule-induktivitaet', 'L', 290, 75);
      w.sammel(30, [g, 'L'], [r, '1'], [l, '1']);
      w.sammel(192, [g, 'N'], [r, '2'], [l, '2']);
      w.text('I_w', 206, 68);
      w.text('I_b', 316, 68);
      w.text('U', 88, 26);
    }),

    'wx-resonanz': () => svg(300, 175,
      achsen(48, 134, 212, 108, 'f', 'X') +
      lin(52, 132, 240, 44, BETONT, 2) +
      `<path d="M58,44 Q76,112 112,124 T242,131" stroke="${STRICH}" stroke-width="2" ` +
      `fill="none"/>` +
      `<circle cx="124" cy="98" r="4.5" fill="var(--accent)" stroke="none"/>` +
      strichel(124, 98, 124, 134) +
      txt('X_L', 246, 48, 'start', BETONT, 12) +
      txt('X_C', 66, 40, 'start', STRICH, 12) +
      txt('f_r', 124, 152, 'middle', BLASS, 12)),

    /* --- Seite 16 · Drehstrom ------------------------------------------- */

    'd-stern': () => svg(300, 215,
      lin(150, 112, 150, 44, STRICH, 2) +
      lin(150, 112, 92, 170, STRICH, 2) +
      lin(150, 112, 208, 170, STRICH, 2) +
      `<circle cx="150" cy="112" r="4.5" fill="${STRICH}" stroke="none"/>` +
      lin(150, 44, 150, 20, BETONT, 2) +
      lin(92, 170, 72, 190, BETONT, 2) +
      lin(208, 170, 228, 190, BETONT, 2) +
      lin(150, 112, 272, 112, BLASS, 1.4) +
      txt('L1', 150, 16, 'middle', BETONT, 12) +
      txt('L2', 62, 202, 'middle', BETONT, 12) +
      txt('L3', 238, 202, 'middle', BETONT, 12) +
      txt('N', 280, 116, 'start', BLASS, 12) +
      txt('U_Str', 118, 82, 'end', STRICH, 12) +
      txt('U', 196, 78, 'start', BLASS, 12)),

    'd-dreieck': () => svg(300, 215,
      lin(150, 46, 74, 168, STRICH, 2) +
      lin(74, 168, 226, 168, STRICH, 2) +
      lin(226, 168, 150, 46, STRICH, 2) +
      lin(150, 46, 150, 22, BETONT, 2) +
      lin(74, 168, 54, 188, BETONT, 2) +
      lin(226, 168, 246, 188, BETONT, 2) +
      txt('L1', 150, 18, 'middle', BETONT, 12) +
      txt('L2', 46, 200, 'middle', BETONT, 12) +
      txt('L3', 254, 200, 'middle', BETONT, 12) +
      txt('I_Str', 104, 102, 'end', STRICH, 12) +
      txt('I', 150, 194, 'middle', BLASS, 12)),

    /* --- Seite 18 · Transformator --------------------------------------- */

    't-einphasen': () => planSvg(350, 215, w => {
      const t = w.teil('transformator', 'T1', 140, 70);
      w.draht(t, '1U', t, '1V', { x: 55, y: 70 }, { x: 55, y: 140 });
      w.draht(t, '2U', t, '2V', { x: 300, y: 70 }, { x: 300, y: 140 });
      /* Die Beschriftungen unter die Schleifen, nicht hinein — dort lagen
         sie auf der Wicklung und liessen beide schlechter lesen. */
      w.text('U₁, N₁', 34, 172);
      w.text('U₂, N₂', 258, 172);
    }),

    /* --- Seite 19 · Motoren --------------------------------------------- */

    'mo-dreh': () => planSvg(340, 215, w => {
      /* Hier stand `draht(m,'U1', m,'U1', …)` — eine Leitung von einem
         Anschluss zu DEMSELBEN Anschluss. Sie lief hin und wieder zurück,
         und im Bild sah das aus wie drei Diagonalen quer durch den Motor.
         Eine Leitung, die frei endet, ist `ab` und nicht `draht`. */
      const m = w.teil('motor-drehstrom', 'M1', 140, 95);
      w.ab(m, 'U1', { x: 150, y: 40 }, { x: 45, y: 40 });
      w.ab(m, 'V1', { x: 170, y: 62 }, { x: 45, y: 62 });
      w.ab(m, 'W1', { x: 190, y: 84 }, { x: 45, y: 84 });
      w.text('L1', 16, 44);
      w.text('L2', 16, 66);
      w.text('L3', 16, 88);
      /* Hier stand noch ein freies `M` rechts neben dem Motor. Das Zeichen
         trägt sein `M` und sein `3 ~` bereits im Kreis, und das Betriebs-
         mittelkennzeichen `M1` schreibt der Planzeichner daneben. Ein
         drittes M erklärte nichts und stand nur im Weg. */
    }),

    /* --- Seite 20 · Spannungsfall ---------------------------------------- */

    's20-gleichstromleitung': () => {
      /* NEU GEZEICHNET, weil das alte Bild drei Dinge falsch machte.
       *
       *  · `ΔU` stand unter dem Bild und zeigte auf nichts. Der Spannungs-
       *    fall entsteht AUF der Leitung, also gehört er an die Leitung.
       *  · Die Länge `l` lag als gestrichelte Linie INNERHALB des Kastens
       *    und war kürzer als die Leitung, die sie messen soll.
       *  · `I` und `l` standen beide frei in derselben kursiven Schrift, in
       *    der sie derselbe Strich sind. Jetzt sagt die Form, was gemeint
       *    ist: ein Pfeil in Flussrichtung ist ein Strom, ein Doppelpfeil
       *    zwischen zwei Grenzen ist ein Mass.
       *
       * Die Grössen kommen aus dem Register des Abschnitts: U₁ am Netz,
       * U₂ am Verbraucher, ΔU dazwischen. Und weil `R_Ltg = ρ · 2 · l / A`
       * rechnet, zeigt der Rückleiter seinen Strom mit: `l` ist die einfache
       * Länge, gezählt wird zweimal.
       */
      const HIN = 54, ZURUECK = 134, LINKS = 46, RECHTS = 252;
      /* Ein Mass: Doppelpfeil zwischen zwei Grenzstrichen. */
      const mass = (x1: number, x2: number, y: number): string =>
        strichel(x1, y - 8, x1, y + 6) + strichel(x2, y - 8, x2, y + 6) +
        pfeil(x1, y, x2, y, BLASS, 1.2) + pfeil(x2, y, x1, y, BLASS, 1.2);
      return svg(340, 210,
        /* Die beiden Leiter und der Verbraucher am Ende. */
        lin(LINKS, HIN, RECHTS, HIN, STRICH, 2) +
        lin(LINKS, ZURUECK, RECHTS, ZURUECK, STRICH, 2) +
        `<rect x="${RECHTS}" y="${HIN}" width="46" height="${ZURUECK - HIN}" ` +
        `stroke="${STRICH}" stroke-width="1.8" fill="var(--bg-hover)"/>` +
        /* Netzspannung links, als Pfeil zwischen den Leitern. */
        pfeil(LINKS, ZURUECK, LINKS, HIN, BETONT, 2.2) +
        txt('U₁', LINKS - 8, 98, 'end', BETONT, 12) +
        /* Verbraucherspannung rechts, vor dem Kasten. */
        pfeil(RECHTS - 12, ZURUECK, RECHTS - 12, HIN, BETONT, 1.8) +
        txt('U₂', RECHTS - 18, 98, 'end', BETONT, 12) +
        /* Der Strom: hin oben, zurück unten. */
        pfeil(92, HIN - 12, 196, HIN - 12, BETONT, 1.5) +
        txt('I', 144, HIN - 20, 'middle', BETONT, 12) +
        pfeil(196, ZURUECK + 14, 92, ZURUECK + 14, BETONT, 1.5) +
        /* Der Spannungsfall LÄNGS der Leitung, nicht darunter. */
        pfeil(LINKS + 14, HIN + 18, RECHTS - 14, HIN + 18, STRICH, 1.4) +
        txt('ΔU', 150, HIN + 34, 'middle', STRICH, 12) +
        /* Und die einfache Leitungslänge als Mass. */
        mass(LINKS, RECHTS, 176) +
        txt('l', 149, 196, 'middle', BLASS, 12));
    },

    /* --- Seite 21 · Antenne ---------------------------------------------- */

    'an-mass': () => svg(330, 155,
      `<path d="M42,46 L42,106 L78,76 Z" stroke="${STRICH}" stroke-width="1.8" ` +
      `fill="var(--bg-hover)"/>` +
      lin(78, 76, 132, 76, STRICH, 1.8) +
      `<rect x="132" y="56" width="58" height="40" rx="4" stroke="${STRICH}" ` +
      `stroke-width="1.8" fill="none"/>` +
      lin(190, 76, 244, 76, STRICH, 1.8) +
      `<path d="M244,46 L244,106 L280,76 Z" stroke="${STRICH}" stroke-width="1.8" ` +
      `fill="var(--bg-hover)"/>` +
      txt('U₁', 48, 128, 'middle', BETONT, 12) +
      txt('U₂', 262, 128, 'middle', BETONT, 12) +
      txt('dB', 161, 81, 'middle', STRICH, 12)),


    /* --- Seite 4 · Stromdichte ------------------------------------------ */

    'g-stromdichte': () => svg(300, 165,
      `<path d="M70,55 L230,55 L230,105 L70,105 Z" stroke="${STRICH}" stroke-width="1.6"/>` +
      `<ellipse cx="70" cy="80" rx="11" ry="25" stroke="${BETONT}" stroke-width="2" ` +
      `fill="var(--bg-hover)"/>` +
      `<ellipse cx="230" cy="80" rx="11" ry="25" stroke="${STRICH}" stroke-width="1.6" ` +
      `fill="none"/>` +
      pfeil(110, 80, 200, 80, BETONT, 2) +
      txt('I', 155, 74, 'middle', BETONT) +
      txt('A', 48, 84, 'end', BETONT) +
      txt('J = I / A', 150, 142, 'middle', BLASS, 12)),

    /* --- Seite 23 · Gleichrichter ---------------------------------------- */

    'gr-einweg': () => planSvg(420, 230, w => {
      const g = w.teil('wechselspannung', 'G', 20, 85);
      const d = w.teil('diode', 'V1', 150, 20, 90);
      const c = w.teil('kondensator', 'C', 260, 85);
      const r = w.teil('widerstand', 'RL', 350, 85);
      w.draht(g, 'L', d, 'A', { x: 50, y: 55 });
      w.draht(d, 'K', c, '1', { x: 280, y: 55 });
      w.steg(c, '1', r, '1', 55);
      w.steg(g, 'N', c, '2', 200);
      w.steg(c, '2', r, '2', 200);
      w.text('U₁', 60, 30);
      w.text('U₂', 306, 130);
    }),

    'gr-bruecke': () => planSvg(420, 300, w => {
      /* Die Grätzschaltung: vier Dioden im Quadrat, die Wechselspannung an
         der einen Diagonale, die Gleichspannung an der anderen. */
      const g  = w.teil('wechselspannung', 'G', 20, 115);
      const d1 = w.teil('diode', 'V1', 140, 40, 90);
      const d2 = w.teil('diode', 'V2', 240, 40, 90);
      const d3 = w.teil('diode', 'V3', 140, 190, 90);
      const d4 = w.teil('diode', 'V4', 240, 190, 90);
      const c  = w.teil('kondensator', 'C', 340, 115);
      w.sammel(20, [d1, 'K'], [d2, 'K'], [c, '1']);
      w.sammel(280, [d3, 'A'], [d4, 'A'], [c, '2']);
      w.draht(g, 'L', d1, 'A', { x: 50, y: 150 }, { x: 130, y: 150 });
      w.ab(d3, 'K', { x: 130, y: 150 });
      w.draht(g, 'N', d2, 'A', { x: 50, y: 262 }, { x: 300, y: 262 },
              { x: 300, y: 150 }, { x: 230, y: 150 });
      w.ab(d4, 'K', { x: 230, y: 150 });
      w.text('U₁', 60, 90);
      w.text('U₂', 384, 160);
    }),

    /* --- Seite 24 · Elektronische Schaltungen ---------------------------- */

    'el-diode': () => planSvg(360, 240, w => {
      const g  = w.teil('gleichspannung', 'U1', 20, 90);
      const rv = w.teil('widerstand', 'Rv', 150, 20, 90);
      const d  = w.teil('led', 'V1', 280, 85);
      w.draht(g, '+', rv, '2', { x: 50, y: 50 });
      w.draht(rv, '1', d, 'A', { x: 300, y: 50 });
      w.steg(g, '−', d, 'K', 215);
      w.text('U_V', 158, 40);
      w.text('U_F', 244, 130);
      w.text('I_F', 100, 208);
    }),

    'el-zener': () => planSvg(410, 250, w => {
      const g  = w.teil('gleichspannung', 'U1', 20, 95);
      const rv = w.teil('widerstand', 'Rv', 140, 20, 90);
      const z  = w.teil('zenerdiode', 'V1', 250, 95);
      const rl = w.teil('widerstand', 'RL', 340, 95);
      w.draht(g, '+', rv, '2', { x: 50, y: 50 });
      w.sammel(50, [rv, '1'], [z, 'K'], [rl, '1']);
      w.sammel(225, [g, '−'], [z, 'A'], [rl, '2']);
      w.text('U_V', 148, 40);
      w.text('U_Z', 204, 140);
      w.text('U_L', 300, 140);
      w.text('I_Z', 290, 92);
    }),

    'el-transistor': () => planSvg(360, 280, w => {
      const g  = w.teil('gleichspannung', 'Ub', 20, 105);
      const rl = w.teil('widerstand', 'RL', 260, 30);
      const t  = w.teil('transistor-npn', 'V1', 250, 140);
      const rv = w.teil('widerstand', 'Rv', 130, 140, 90);
      w.draht(g, '+', rl, '1', { x: 50, y: 18 }, { x: 280, y: 18 });
      w.draht(rl, '2', t, 'C');
      w.steg(g, '−', t, 'E', 260);
      w.draht(rv, '1', t, 'B');
      w.ab(rv, '2', { x: 40, y: 170 }, { x: 40, y: 230 });
      w.text('U_L', 300, 70);
      w.text('U_CE', 300, 190);
      w.text('U₁', 46, 200);
      w.text('I_B', 150, 132);
    }),

    /* --- Seite 27 · Drahtlängen von Spulen ------------------------------- */

    'sp-einlagig': () => {
      /* Ein Schnitt durch die Spule: der Kern in der Mitte, oben und unten
         je eine Reihe Drahtquerschnitte. */
      const draht = (x: number, y: number): string =>
        `<circle cx="${x}" cy="${y}" r="6" stroke="${BETONT}" stroke-width="1.4" ` +
        `fill="var(--bg-hover)"/>`;
      const reihe = (y: number): string =>
        Array.from({ length: 14 }, (_, i) => draht(70 + i * 12.5, y)).join('');
      return svg(320, 190,
        `<rect x="58" y="66" width="204" height="46" stroke="${STRICH}" ` +
        `stroke-width="1.6" fill="none"/>` +
        reihe(58) + reihe(120) +
        strichel(50, 89, 280, 89) +
        /* d₂ misst von Draht zu Draht, d₁ den Kern dazwischen — jedes mit
           eigenem Doppelpfeil. Vorher hatte nur d₂ einen; d₁ und d_m
           standen als zwei Beschriftungen übereinander in der Mitte und
           berührten sich fast. */
        pfeil(292, 52, 292, 126, BLASS, 1.2) + pfeil(292, 126, 292, 52, BLASS, 1.2) +
        txt('d₂', 302, 92, 'start', BLASS, 12) +
        pfeil(96, 66, 96, 112, BLASS, 1.2) + pfeil(96, 112, 96, 66, BLASS, 1.2) +
        /* Beide Beschriftungen weg von der Strichlinie: auf ihr sahen sie
           durchgestrichen aus. d₁ nach unten in den Kern, d_m darüber —
           und weit genug, dass die Tiefstellung von d_m die Linie nicht
           mehr berührt. */
        txt('d₁', 104, 106, 'start', BLASS, 12) +
        txt('d_m', 196, 79, 'middle', BETONT, 12) +
        pfeil(70, 158, 245, 158, BLASS, 1.2) + pfeil(245, 158, 70, 158, BLASS, 1.2) +
        txt('b', 158, 178, 'middle', BLASS, 12) +
        /* Der Drahtdurchmesser braucht eine Linie zu dem Draht, den er
           meint — sonst schwebt das `d` über dem Bild und könnte alles
           bedeuten. */
        lin(70, 52, 84, 38, BETONT, 1.2) +
        txt('d', 88, 36, 'start', BETONT, 12));
    },

    'sp-mehrlagig': () => {
      const draht = (x: number, y: number): string =>
        `<circle cx="${x}" cy="${y}" r="5.5" stroke="${BETONT}" stroke-width="1.3" ` +
        `fill="var(--bg-hover)"/>`;
      const block = (y0: number): string =>
        [0, 1, 2].map(l =>
          Array.from({ length: 13 }, (_, i) => draht(72 + i * 12, y0 + l * 11)).join('')
        ).join('');
      /* 334 × 210 statt 320 × 200: das `d₂` rechts und das `b` unten standen
         je einen Punkt über der Kante. Ein Punkt ist unsichtbar — aber ein
         Blatt, das seinen Inhalt gerade so nicht fasst, hat beim nächsten
         Zeichen keinen Platz mehr. (Beim ersten Anlauf habe ich dafür den
         einlagigen Zwilling verbreitert — der lief nie hinaus. Die Zahlen
         320 × 200 gehören diesem hier.) */
      return svg(334, 210,
        `<rect x="60" y="82" width="200" height="36" stroke="${STRICH}" ` +
        `stroke-width="1.6" fill="none"/>` +
        block(48) + block(126) +
        strichel(48, 100, 286, 100) +
        /* Derselbe Umbau wie beim einlagigen Zwilling: d₁ bekommt einen
           eigenen Doppelpfeil über den Kern, und beide Beschriftungen
           rücken von der Strichlinie weg. */
        pfeil(296, 44, 296, 156, BLASS, 1.2) + pfeil(296, 156, 296, 44, BLASS, 1.2) +
        txt('d₂', 306, 104, 'start', BLASS, 12) +
        pfeil(96, 82, 96, 118, BLASS, 1.2) + pfeil(96, 118, 96, 82, BLASS, 1.2) +
        txt('d₁', 104, 114, 'start', BLASS, 12) +
        txt('d_m', 196, 92, 'middle', BETONT, 12) +
        pfeil(72, 180, 216, 180, BLASS, 1.2) + pfeil(216, 180, 72, 180, BLASS, 1.2) +
        txt('b', 144, 197, 'middle', BLASS, 12) +
        txt('N₂ Lagen', 40, 36, 'start', BETONT, 12));
    },


    /* --- Seite 23 · Elektronische Bauelemente ---------------------------
     * Das Heft zeigt hier zwölf Bauteile, jedes mit seinem Zeichen und
     * seiner Kennlinie. Genau dafür gibt es das Fachzeichen-Register: das
     * Symbol kommt von dort, die Kennlinie daneben ist eigenes SVG.
     *
     * Die Kennlinie ist der eigentliche Inhalt der Seite. Das Zeichen sagt,
     * WIE das Bauteil heisst; die Kennlinie sagt, WAS es tut — und bei PTC
     * und NTC ist das der einzige Unterschied.
     * -------------------------------------------------------------------*/

    /** Ein Bauteil links, seine Kennlinie rechts. */
    ...(() => {
      /**
       * `mitte` entscheidet über das Achsenkreuz, und das ist keine
       * Geschmacksfrage:
       *
       *   false — der Ursprung sitzt unten links. Für Kennlinien, die nur
       *           im ersten Quadranten leben: R über ϑ, R über E.
       *   true  — der Ursprung sitzt in der MITTE. Für Strom über Spannung
       *           bei Bauteilen, die auch rückwärts etwas tun. Ohne den
       *           dritten Quadranten sieht die Z-Diode aus wie eine Diode,
       *           und genau der Unterschied ist ihr Zweck.
       */
      const bauteil = (zeichen: string, kurve: string, wLabel: string,
                       hLabel: string, mitte = false): (() => string) => () => {
        const sym = (typeof Register !== 'undefined' && Register.fachzeichen)
          ? Register.fachzeichen.alsSvg(zeichen, { strich: 1.8 }) : '';
        const kreuz = mitte
          ? pfeil(20, 74, 178, 74, BLASS, 1.3) + pfeil(100, 142, 100, 12, BLASS, 1.3) +
            txt(wLabel, 176, 90, 'end', BLASS, 11) + txt(hLabel, 92, 20, 'end', BLASS, 11)
          : achsen(30, 118, 142, 96, wLabel, hLabel);
        return `<div class="sk-paar">` +
          `<div class="sk-zeichen">${sym}</div>` +
          svg(190, 150, kreuz + kurve) +
          `</div>`;
      };

      /* Ursprung unten links (30,118), nach rechts oben. */
      const steigend = `<path d="M36,112 C70,110 96,96 118,66 C134,44 146,36 164,32" ` +
                       `stroke="${BETONT}" stroke-width="2.2" fill="none"/>`;
      const fallend  = `<path d="M36,34 C58,66 76,94 104,106 C126,114 146,116 164,117" ` +
                       `stroke="${BETONT}" stroke-width="2.2" fill="none"/>`;

      /* Ursprung in der Mitte (100,74). */
      /* Diode: vorwärts ab der Schwelle steil, rückwärts fast nichts. */
      const diodeKurve = `<path d="M26,73 L112,73 C120,72 124,56 128,26" ` +
                         `stroke="${BETONT}" stroke-width="2.2" fill="none"/>`;
      /* Z-Diode: vorwärts wie eine Diode, RÜCKWÄRTS ab U_Z ebenso steil —
         das ist der Unterschied, und er ist der Grund für das Bauteil. */
      const zenerKurve = `<path d="M112,73 C120,72 124,56 128,26" stroke="${BETONT}" ` +
                         `stroke-width="2.2" fill="none"/>` +
                         `<path d="M112,75 L48,75 C42,76 40,92 38,124" stroke="${BETONT}" ` +
                         `stroke-width="2.2" fill="none"/>` +
                         strichel(48, 74, 48, 124) +
                         txt('U_Z', 46, 138, 'middle', BLASS, 11);
      /* Punktsymmetrisch: in beide Richtungen dasselbe. */
      const beidseitig = `<path d="M100,74 C112,72 120,56 126,24" stroke="${BETONT}" ` +
                         `stroke-width="2.2" fill="none"/>` +
                         `<path d="M100,74 C88,76 80,92 74,124" stroke="${BETONT}" ` +
                         `stroke-width="2.2" fill="none"/>`;
      /* Ein Kennlinienfeld: je Steuerstrom eine Kurve. */
      const schar = [0, 1, 2, 3].map(i =>
        `<path d="M36,${106 - i * 19} C50,${106 - i * 19} 56,${92 - i * 19} ` +
        `64,${88 - i * 19} C94,${84 - i * 19} 132,${82 - i * 19} 164,${80 - i * 19}" ` +
        `stroke="${BETONT}" stroke-width="1.7" fill="none"/>`).join('');

      return {
        's23-ptc-oder-kaltleiter':  bauteil('ptc',  steigend, 'ϑ', 'R'),
        's23-ntc-oder-heissleiter': bauteil('ntc',  fallend,  'ϑ', 'R'),
        's23-vdr':                  bauteil('vdr',  beidseitig, 'U', 'I', true),
        's23-ldr':                  bauteil('ldr',  fallend,  'E', 'R'),
        's23-diode':                bauteil('diode', diodeKurve, 'U', 'I', true),
        's23-zenerdiode':           bauteil('zenerdiode', zenerKurve, 'U', 'I', true),
        's23-led-leuchtdiode':      bauteil('led', diodeKurve, 'U_F', 'I_F', true),
        's23-optokoppler':          bauteil('optokoppler', schar, 'U_CE', 'I_C'),
        's23-npn-transistor':       bauteil('transistor-npn', schar, 'U_CE', 'I_C'),
        's23-pnp-transistor':       bauteil('transistor-pnp', schar, 'U_CE', 'I_C'),
        's23-thyristor':            bauteil('thyristor', diodeKurve, 'U', 'I', true),
        's23-triac':                bauteil('triac', beidseitig, 'U', 'I', true)
      };
    })(),

    /* --- Seite 17 · Neutralleiterstrom ----------------------------------- */

    's17-neutralleiterstrom-bei-unsymmetr': () => svg(320, 210,
      /* Drei Strangströme als Zeiger im 120-Grad-Stern; bei GLEICHER Last
         heben sie sich auf und der Neutralleiter führt nichts. Sind sie
         verschieden lang, bleibt eine Summe übrig — und genau die fliesst
         durch den Neutralleiter. */
      pfeil(150, 110, 150, 34, BETONT, 2.2) +
      pfeil(150, 110, 84, 156, BETONT, 2.2) +
      pfeil(150, 110, 202, 148, BETONT, 2.2) +
      pfeil(150, 110, 196, 76, STRICH, 2.6) +
      txt('I_L1', 150, 26, 'middle', BETONT, 12) +
      txt('I_L2', 74, 172, 'middle', BETONT, 12) +
      txt('I_L3', 212, 164, 'middle', BETONT, 12) +
      txt('I_N', 204, 66, 'start', STRICH, 12) +
      txt('Bei gleicher Last ist I_N = 0.', 160, 198, 'middle', BLASS, 11)),

    /* --- Seite 22 · Beleuchtung ------------------------------------------ */

    'l-abstand': () => svg(300, 195,
      `<path d="M120,26 L180,26 L194,48 L106,48 Z" stroke="${STRICH}" stroke-width="1.8" ` +
      `fill="var(--bg-hover)"/>` +
      lin(106, 48, 42, 152, BETONT, 1.4) +
      lin(194, 48, 258, 152, BETONT, 1.4) +
      lin(42, 152, 258, 152, STRICH, 2) +
      strichel(150, 48, 150, 152) +
      txt('r', 158, 104, 'start', BLASS, 12) +
      txt('Φ', 150, 20, 'middle', BETONT, 12) +
      txt('A', 150, 174, 'middle', BLASS, 12))
  };

  /* ------------------------------------------------------------------------
   * 4. ZUGRIFF
   * ----------------------------------------------------------------------*/

  /** Gibt es zu diesem Abschnitt eine Skizze? */
  const hat = (abschnitt: string): boolean =>
    Object.prototype.hasOwnProperty.call(SKIZZEN, abschnitt);

  /**
   * Die Skizze zu einem Abschnitt. Leere Zeichenkette heisst „gibt es nicht" —
   * und das ist eine Antwort, kein Fehler: das Buch wird Abschnitt für
   * Abschnitt bebildert, und ein Abschnitt ohne Bild soll trotzdem lesbar
   * sein.
   */
  const zu = (abschnitt: string): string => {
    const bauen = SKIZZEN[abschnitt];
    if (!bauen) return '';
    try {
      return bauen();
    } catch (e) {
      /* Eine kaputte Skizze darf die Seite nicht mitreissen. Sie fehlt dann
         eben — sichtbar, aber ohne Schaden. */
      console.warn('Skizze ' + abschnitt + ' liess sich nicht zeichnen:', e);
      return '';
    }
  };

  /** Welche Abschnitte bebildert sind — für den Prüflauf und die Doku. */
  const alle = (): string[] => Object.keys(SKIZZEN).sort();

  return { hat, zu, alle };
})();

/* Im Browser sichtbar machen — das Formelheft und der Prüflauf greifen darauf zu. */
(globalThis as any).Elektroskizzen = Elektroskizzen;
