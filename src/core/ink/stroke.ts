/* ============================================================================
 * core/ink/stroke.js — der nasse Strich: waechst, glaettet, sagt voraus
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/ink/stroke.ts`. `npm run bauen:ts` schreibt
 * daraus diese Datei.
 * ==========================================================================*/

/* ===========================================================================
 * WAS DAS IST (E376) — DER NASSE STRICH
 * ===========================================================================
 *
 * Redurs Satz war: „stift verbessern wie goodnotes solte es sein flüssiger".
 * Vor dem Bauen wurde gemessen (§36), und die Messung war eindeutig:
 *
 *   Ein Fueller-Strich mit 600 Punkten kostete 484,7 ms allein an Geometrie,
 *   weil die App bei JEDEM Zeigerereignis den GANZEN Umriss neu rechnete.
 *   Am Ende des Strichs kostete ein einzelnes Ereignis 0,774 ms und erzeugte
 *   eine `d`-Zeichenkette von rund 17 kB. Ueber den Strich hinweg waren das
 *   10,2 MB Zeichenketten — fuer EINEN Strich.
 *
 * Das ist die Unfluessigkeit: sie WAECHST mit dem Strich. Der Anfang eines
 * Satzes laeuft, das Ende haengt. Genau so beschreibt man den Unterschied zu
 * GoodNotes.
 *
 * DIE ANTWORT SIND VIER STUECKE, und drei davon rechnen hier, ohne Uhr,
 * ohne Ablage, ohne DOM:
 *
 *   1. `Feder`      — der Umriss waechst, statt neu zu entstehen. Je Punkt
 *                     eine feste Menge Arbeit statt einer wachsenden.
 *   2. `glaetter`   — ein Filter, dessen Staerke von der Geschwindigkeit
 *                     abhaengt: langsam stark (das Zittern verschwindet),
 *                     schnell schwach (der Strich bleibt am Stift).
 *   3. `vorhersage` — der nasse Schwanz, der bis zur Spitze reicht. Er wird
 *                     GEZEICHNET, aber NIE GESPEICHERT.
 *
 * Das vierte Stueck steht im Bereich (`bereiche/pdf/marken.ts`): je Bild ein
 * Neuzeichnen statt je Ereignis (`requestAnimationFrame`).
 *
 * WARUM `Feder` DASSELBE ERGIBT WIE `InkGeometry.outline`
 * ------------------------------------------------------
 * Weil es geprueft wird, nicht weil es behauptet wird. `test366` legt beide
 * Wege ueber hunderte zufaellige Striche nebeneinander und vergleicht die
 * `d`-Zeichenkette ZEICHEN FUER ZEICHEN. Ein Umriss, der „ungefaehr gleich"
 * aussieht, waere schlimmer als keiner: der nasse Strich saehe anders aus als
 * der trockene, und beim Absetzen des Stifts spraenge die Form.
 *
 * DIE VORHERSAGE DARF NIE IN DIE DATEN
 * ------------------------------------
 * Ein vorhergesagter Punkt ist eine Vermutung ueber die naechsten Millisekunden.
 * Landet er in `marken`, ist er fuer immer da — und jeder Strich endet mit
 * einem Ueberschuss, den niemand gezeichnet hat. Deshalb kennt `Feder` zwei
 * getrennte Wege: `punkt()` schreibt in den Strich, `nass()` nur ins Bild.
 * ===========================================================================*/

type StrokePoint = [number, number];

const InkStroke = (() => {

  /* --------------------------------------------------------------------- *
   * Rundung und Zahlen — WOERTLICH wie in `InkGeometry`.
   * Eine eigene Rundung waere der sichere Weg zu einem Umriss, der um ein
   * Hundertstel abweicht und beim Absetzen sichtbar springt.
   * --------------------------------------------------------------------- */
  const r2 = (v: number): number => Math.round(v * 100) / 100;
  const endlich = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  /* Der Mittelpunkt zweier Punkte, gerundet wie in `seite()`. */
  const mitte = (a: StrokePoint, b: StrokePoint): StrokePoint => [
    Math.round((a[0] + b[0]) * 50) / 100,
    Math.round((a[1] + b[1]) * 50) / 100
  ];

  const qStueck = (a: StrokePoint, b: StrokePoint): string => {
    const m = mitte(a, b);
    return ` Q${a[0]} ${a[1]} ${m[0]} ${m[1]}`;
  };

  /* ===================================================================== *
   * 1 · DIE FEDER — ein Umriss, der waechst
   * ===================================================================== *
   *
   * `InkGeometry.outline` rechnet den Versatz eines Punktes i aus seinen
   * NACHBARN i-1 und i+1. Damit steht der Versatz von Punkt i erst fest,
   * wenn Punkt i+1 da ist — und das Bogenstueck zwischen i und i+1 erst,
   * wenn i+2 da ist. Die Feder haelt genau diese zwei Punkte Rueckstand
   * offen und friert alles davor ein.
   *
   * Was je Punkt anfaellt: zwei Wurzeln, zwei Zeichenketten, zwei Anhaenge.
   * Was NICHT mehr anfaellt: der ganze Strich.
   * --------------------------------------------------------------------- */
  class Feder {
    /* Die Mittellinie — dieselben Punkte, die auch gespeichert werden. */
    private pts: StrokePoint[] = [];
    private halb: number[] = [];
    /* Die beiden Konturen. `links`/`rechts` werden nur fuer die letzten
       zwei Punkte noch angefasst; alles davor steht fest. */
    private links: StrokePoint[] = [];
    private rechts: StrokePoint[] = [];
    /* Die eingefrorenen Bogenstuecke. `linksFest[i]` ist das Stueck, das
       `seite(links)` fuer den Index i erzeugt; `rechtsFest[j]` das Stueck,
       das `seite(rueck)` fuer den Ruecklauf bei `rechts[j]` erzeugt. */
    private linksFest: string[] = [];
    private rechtsFest: string[] = [];
    /* Bis wohin ist eingefroren (ausschliesslich). */
    private fest = 0;
    /* Der nasse Schwanz: gezeichnet, nie gespeichert. */
    private nassPts: StrokePoint[] = [];
    private nassHalb: number[] = [];

    /** Wie viele echte Punkte im Strich stehen. */
    laenge(): number { return this.pts.length; }

    /** Die Mittellinie, wie sie gespeichert wird — ohne den nassen Schwanz. */
    punkte(): StrokePoint[] { return this.pts.map(p => [p[0], p[1]] as StrokePoint); }

    /** Die halben Breiten, in derselben Reihenfolge. */
    breiten(): number[] { return this.halb.slice(); }

    /**
     * Ein echter Punkt. `halb` ist die halbe Strichbreite an dieser Stelle —
     * dieselbe Zahl, die `zeichneMarke` fuer den trockenen Strich rechnet.
     */
    punkt(p: StrokePoint, halb: number): void {
      this.pts.push([endlich(p[0]), endlich(p[1])]);
      this.halb.push(Math.max(0.15, Number.isFinite(halb) ? halb : 1));
      this.nassPts.length = 0;
      this.nassHalb.length = 0;
      this.nachziehen();
    }

    /**
     * Der nasse Schwanz — die Vorhersage. Ersetzt bei jedem Aufruf den
     * vorigen und geht NIE in `punkte()` ein.
     */
    nass(pts: StrokePoint[], halb: number[]): void {
      this.nassPts = pts.map(p => [endlich(p[0]), endlich(p[1])] as StrokePoint);
      this.nassHalb = this.nassPts.map((_p, i) =>
        Math.max(0.15, Number.isFinite(halb[i] as number) ? Number(halb[i]) : (this.halb[this.halb.length - 1] ?? 1)));
    }

    /**
     * Der SVG-Pfad des Umrisses. Zeichengleich mit
     * `InkGeometry.outline(punkte(), breiten())`, solange kein nasser
     * Schwanz gesetzt ist.
     */
    d(): string {
      const pts = this.nassPts.length ? this.pts.concat(this.nassPts) : this.pts;
      const halb = this.nassHalb.length ? this.halb.concat(this.nassHalb) : this.halb;
      const n = pts.length;
      if (n < 2) return '';
      /* Die Kontur der Punkte, die noch nicht feststehen (hoechstens ein
         paar), wird hier frisch gerechnet — der Rest steht schon. */
      const links: StrokePoint[] = this.links.slice(0, Math.max(0, n - 2));
      const rechts: StrokePoint[] = this.rechts.slice(0, Math.max(0, n - 2));
      for (let i = links.length; i < n; i++) {
        const paar = versatz(pts, halb, i, n);
        links.push(paar[0]);
        rechts.push(paar[1]);
      }
      /* Die eingefrorenen Stuecke gelten nur, solange kein nasser Schwanz
         die letzten Punkte verschiebt — und er verschiebt hoechstens die
         letzten zwei, weshalb `fest` nie weiter reicht als n-2. */
      const grenze = Math.min(this.fest, Math.max(0, n - 2));
      let linksTeil = this.linksFest.slice(0, grenze).join('');
      for (let i = Math.max(1, grenze); i <= n - 2; i++) linksTeil += qStueck(links[i]!, links[i + 1]!);
      if (n === 2) linksTeil = ` L${links[1]![0]} ${links[1]![1]}`;
      else linksTeil += ` L${links[n - 1]![0]} ${links[n - 1]![1]}`;

      /* Der Ruecklauf laeuft von hinten nach vorn: das Stueck bei `rechts[j]`
         zeigt auf `rechts[j-1]`, und die Reihenfolge ist absteigend. */
      let rechtsTeil = '';
      if (n === 2) {
        rechtsTeil = ` L${rechts[0]![0]} ${rechts[0]![1]}`;
      } else {
        const spaet: string[] = [];
        for (let j = n - 2; j >= Math.max(1, grenze); j--) spaet.push(qStueck(rechts[j]!, rechts[j - 1]!));
        rechtsTeil = spaet.join('') + this.rechtsFest.slice(1, Math.max(1, grenze)).reverse().join('') +
          ` L${rechts[0]![0]} ${rechts[0]![1]}`;
      }

      const anfang = halbAn(halb, 0);
      const ende = halbAn(halb, n - 1);
      return `M${links[0]![0]} ${links[0]![1]}` + linksTeil +
        ` A${r2(ende)} ${r2(ende)} 0 0 1 ${rechts[n - 1]![0]} ${rechts[n - 1]![1]}` +
        rechtsTeil +
        ` A${r2(anfang)} ${r2(anfang)} 0 0 1 ${links[0]![0]} ${links[0]![1]} Z`;
    }

    /**
     * Der geglaettete Mittellinien-Pfad — fuer Kugelschreiber und Marker,
     * die als Strich (`stroke`) und nicht als Flaeche gezeichnet werden.
     * Zeichengleich mit `InkGeometry.path(punkte())`.
     */
    linie(): string {
      const pts = this.nassPts.length ? this.pts.concat(this.nassPts) : this.pts;
      const n = pts.length;
      if (!n) return '';
      if (n === 1) return `M${pts[0]![0]} ${pts[0]![1]}`;
      if (n === 2) return `M${pts[0]![0]} ${pts[0]![1]} L${pts[1]![0]} ${pts[1]![1]}`;
      const grenze = Math.min(this.linieFest.length, Math.max(0, n - 2));
      let aus = `M${pts[0]![0]} ${pts[0]![1]}` + this.linieFest.slice(0, grenze).join('');
      for (let i = Math.max(1, grenze); i < n - 1; i++) aus += qStueck(pts[i]!, pts[i + 1]!);
      return aus + ` L${pts[n - 1]![0]} ${pts[n - 1]![1]}`;
    }

    private linieFest: string[] = [];

    /* Alles einfrieren, was durch den neuen Punkt endgueltig geworden ist. */
    private nachziehen(): void {
      const n = this.pts.length;
      /* Die Kontur von Punkt i braucht i-1 und i+1; sie steht fest, sobald
         i+1 existiert — also fuer alle i <= n-2. */
      for (let i = this.links.length; i <= n - 2; i++) {
        const paar = versatz(this.pts, this.halb, i, n);
        this.links[i] = paar[0];
        this.rechts[i] = paar[1];
      }
      /* Ein Bogenstueck bei i braucht die Kontur von i und i+1. */
      for (let i = Math.max(1, this.fest); i <= n - 3; i++) {
        this.linksFest[i] = qStueck(this.links[i]!, this.links[i + 1]!);
        this.rechtsFest[i] = qStueck(this.rechts[i]!, this.rechts[i - 1]!);
      }
      this.fest = Math.max(this.fest, Math.max(0, n - 2));
      for (let i = Math.max(1, this.linieFest.length); i <= n - 3; i++) {
        this.linieFest[i] = qStueck(this.pts[i]!, this.pts[i + 1]!);
      }
      if (this.linieFest.length < Math.max(0, n - 2)) this.linieFest.length = Math.max(0, n - 2);
    }
  }

  const halbAn = (halb: number[], i: number): number => {
    const w = Number(halb[Math.min(i, halb.length - 1)]);
    return Math.max(0.15, Number.isFinite(w) ? w : 1);
  };

  /** Die zwei Konturpunkte zu einem Mittellinienpunkt — Rechnung wie `outline`. */
  const versatz = (pts: StrokePoint[], halb: number[], i: number, n: number): [StrokePoint, StrokePoint] => {
    const prev = pts[Math.max(0, i - 1)]!;
    const next = pts[Math.min(n - 1, i + 1)]!;
    let tx = next[0] - prev[0];
    let ty = next[1] - prev[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len; ty /= len;
    const w = halbAn(halb, i);
    return [
      [r2(pts[i]![0] - ty * w), r2(pts[i]![1] + tx * w)],
      [r2(pts[i]![0] + ty * w), r2(pts[i]![1] - tx * w)]
    ];
  };

  /* ===================================================================== *
   * 2 · DER GLAETTER — stark, wo die Hand zittert; schwach, wo sie eilt
   * ===================================================================== *
   *
   * Ein fester Filter kann nur eines von beidem: entweder er nimmt das
   * Zittern weg und der Strich haengt hinter dem Stift, oder er bleibt am
   * Stift und jedes Zittern steht im Papier. Deshalb haengt die Staerke an
   * der Geschwindigkeit.
   *
   * Die drei Zahlen sind gemessen, nicht geraten — `test366` faehrt ein
   * Zittersignal (0,4 px bei 60 Hz) und einen schnellen Zug hindurch und
   * haelt beides fest: das Zittern muss deutlich kleiner werden, der
   * Rueckstand beim schnellen Zug klein bleiben.
   * --------------------------------------------------------------------- */
  const ALPHA_LANGSAM = 0.28;   /* bei stehender Hand: viel mitteln */
  const ALPHA_SCHNELL = 0.92;   /* im Zug: fast unveraendert durchlassen */
  const TEMPO_VOLL = 1.1;       /* px je ms, ab hier gilt ALPHA_SCHNELL */
  /* WORAN DIE DREI ZAHLEN GEMESSEN WURDEN (E504): an 60 Hz, also 16 ms je
     Punkt. Sie stehen unveraendert da — diese Zahl sagt nur, WOBEI sie
     galten, und macht sie damit auf jede andere Rate uebertragbar. */
  const MESS_MS = 16;

  type Glaetter = {
    /** Naechster Punkt herein, geglaetteter Punkt heraus. `dt` in ms. */
    (p: StrokePoint, dt: number): StrokePoint;
  };

  /**
   * Ein Glaetter mit Gedaechtnis. Der erste Punkt geht unveraendert durch —
   * ein Strich, der nicht dort beginnt, wo der Stift aufsetzte, ist falsch.
   */
  const glaetter = (start: StrokePoint): Glaetter => {
    let x = endlich(start[0]);
    let y = endlich(start[1]);
    /* DAS TEMPO IST DAS DER HAND, nicht das des Rueckstands (E504).
       Hier stand `|p − x| / ms` — der Abstand zum GEGLAETTETEN Punkt. Der
       ist selbst ein Ergebnis des Filters, und damit hing die Filterstaerke
       wieder an der Abtastrate: bei 240 Hz meldete derselbe Zug ein
       doppelt so hohes „Tempo" wie bei 60 Hz, weil der Rueckstand kleiner
       war, das `dt` aber viermal kleiner. Gemessen von Punkt zu Punkt der
       EINGABE ist es die Geschwindigkeit, die die Hand wirklich hat. */
    let vx = endlich(start[0]);
    let vy = endlich(start[1]);
    return (p: StrokePoint, dt: number): StrokePoint => {
      const px = endlich(p[0]), py = endlich(p[1]);
      const ms = Math.max(1, Number.isFinite(dt) ? dt : 16);
      const tempo = Math.hypot(px - vx, py - vy) / ms;
      vx = px; vy = py;
      const teil = Math.min(1, tempo / TEMPO_VOLL);
      const gemessen = ALPHA_LANGSAM + (ALPHA_SCHNELL - ALPHA_LANGSAM) * teil;
      /* ── ZEIT, NICHT MESSUNGEN (E504) ────────────────────────────────────
       * Bis hierher wurde `gemessen` unmittelbar angewandt — ein fester
       * Anteil JE PUNKT. Das Tempo war schon zeitnormiert, die Wirkung
       * nicht, und das ist genau der Fehler, den das Stift-Dossier auf
       * Seite 8 beschreibt: „Muss pro Geraet und Samplingrate abgestimmt
       * werden; falsche Parameter verzerren Schrift."
       *
       * Die Zeitkonstante eines solchen Filters ist tau = dt·(1−a)/a. Bei
       * festem `a` SCHRUMPFT sie mit der Abtastrate: derselbe Filter ist
       * auf einem 240-Hz-Stift viermal schwaecher als auf dem 60-Hz-Geraet,
       * an dem die drei Zahlen oben gemessen wurden. Nachgemessen in
       * `test472` §1, VOR der Reparatur: derselbe Zug verzoegerte bei
       * 60 Hz um 3,467 px, bei 120 Hz um 1,734 und bei 240 Hz um 0,867 —
       * halbiert und geviertelt, genau mit der Rate. Und das Restzittern
       * je Millisekunde war bei 240 Hz FUENFMAL groesser.
       *
       * Jetzt wird aus dem gemessenen Anteil erst eine Zeitkonstante und
       * daraus der Anteil fuer DIESES `dt` — die Form des 1-Euro-Filters,
       * a = 1/(1 + tau/dt). Bei 16 ms kommt Zeichen fuer Zeichen dasselbe
       * heraus wie vorher (a = a_gemessen), also aendert sich am Geraet,
       * an dem gemessen wurde, nichts. `test366` haelt genau das fest.
       * ------------------------------------------------------------------ */
      const tau = MESS_MS * (1 - gemessen) / gemessen;
      const alpha = ms / (ms + tau);
      x += (px - x) * alpha;
      y += (py - y) * alpha;
      return [x, y];
    };
  };

  /**
   * DER DRUCK BRAUCHT EIN ANDERES WERKZEUG ALS DER ORT — und das war der
   * teuerste Irrtum dieses Bogens.
   *
   * Zuerst stand hier derselbe Filter wie fuer den Ort: ein fester Anteil
   * (0,35) je Punkt. `test343` wurde davon rot, und zu Recht: ein Bogen von
   * 13 Punkten, der von 0,15 auf 0,95 steigt und zurueckfaellt, kam
   * abgeflacht heraus. Der Fueller schwoll nicht mehr an — genau das, was
   * E351 gebaut hatte, war weg.
   *
   * Was hier gebraucht wird, ist kein Mittel, sondern ein MITTLERER WERT:
   * der Median von drei aufeinanderfolgenden Messungen. Er wirft einen
   * einzelnen Ausreisser weg (das ist, was ein zappelnder Sensor liefert)
   * und laesst eine steigende Reihe UNVERAENDERT durch (das ist, was eine
   * druckende Hand liefert). Beides ist geprueft, nicht behauptet.
   *
   * Der Preis ist ein Punkt Verzoegerung. Der ist die Sache wert.
   */
  const druckGlaetter = (start: number): ((p: number) => number) => {
    const drei: number[] = [Number.isFinite(start) ? start : 0.5];
    return (p: number): number => {
      drei.push(Number.isFinite(p) ? p : (drei[drei.length - 1] as number));
      if (drei.length > 3) drei.shift();
      if (drei.length < 3) return Math.round((drei[drei.length - 1] as number) * 1000) / 1000;
      const sortiert = drei.slice().sort((a, b) => a - b);
      return Math.round((sortiert[1] as number) * 1000) / 1000;
    };
  };

  /* ===================================================================== *
   * 3 · DIE VORHERSAGE — der nasse Schwanz bis zur Spitze
   * ===================================================================== *
   *
   * Zwischen der Bewegung der Hand und dem Bild auf dem Glas liegen immer
   * ein paar Millisekunden. GoodNotes fuellt sie, indem es ein Stueck
   * weiterzeichnet, als ginge es so weiter. Das ist eine Vermutung, und
   * Vermutungen gehoeren gedeckelt:
   *
   *   · hoechstens `VORHER_MS` weit,
   *   · hoechstens `VORHER_PX` lang,
   *   · und bei einer Richtungsaenderung gar nicht — beim Kehren wuerde
   *     der Schwanz nach aussen schiessen und ein Haekchen malen, das
   *     niemand gezogen hat.
   * --------------------------------------------------------------------- */
  const VORHER_MS = 14;         /* etwa ein Bild bei 72 Hz */
  const VORHER_PX = 26;
  const KEHRE = 0.55;           /* cos der groessten erlaubten Richtungsaenderung */

  /**
   * Ein bis zwei Punkte, die den Strich zur Stiftspitze verlaengern.
   * Leer, wenn zu wenig bekannt ist oder die Richtung gerade kippt.
   *
   * `abstand` ist die gemessene Zeit zwischen den letzten zwei Punkten. Sie
   * MUSS herein: ohne sie waere die Vorhersage in Punkten gerechnet statt in
   * Millisekunden, und derselbe Vorlauf waere bei 60 Hz doppelt so lang wie
   * bei 120 Hz — gemessen 17,5 px statt 8,8 px bei gleichem Zug.
   */
  const vorhersage = (pts: StrokePoint[], ms: number = VORHER_MS, abstand: number = 8): StrokePoint[] => {
    const n = Array.isArray(pts) ? pts.length : 0;
    if (n < 3) return [];
    const a = pts[n - 3]!, b = pts[n - 2]!, c = pts[n - 1]!;
    const v1x = b[0] - a[0], v1y = b[1] - a[1];
    const v2x = c[0] - b[0], v2y = c[1] - b[1];
    const l1 = Math.hypot(v1x, v1y), l2 = Math.hypot(v2x, v2y);
    if (l2 < 0.3) return [];
    /* Kippt die Richtung, wird nicht geraten. */
    if (l1 > 0.3 && (v1x * v2x + v1y * v2y) / (l1 * l2) < KEHRE) return [];
    const dt = Math.max(1, Number.isFinite(abstand) ? abstand : 8);
    const weit = Math.min(VORHER_PX, l2 * Math.max(0, Math.min(3, ms / dt)));
    if (weit < 0.4) return [];
    const ux = v2x / l2, uy = v2y / l2;
    /* Zwei Punkte, der zweite gedaempft — so laeuft der Schwanz aus,
       statt in einer Spitze zu enden. */
    return [
      [r2(c[0] + ux * weit * 0.6), r2(c[1] + uy * weit * 0.6)],
      [r2(c[0] + ux * weit), r2(c[1] + uy * weit)]
    ];
  };

  return { Feder, glaetter, druckGlaetter, vorhersage,
           ALPHA_LANGSAM, ALPHA_SCHNELL, TEMPO_VOLL,
           VORHER_MS, VORHER_PX, KEHRE };
})();

(globalThis as any).InkStroke = InkStroke;
