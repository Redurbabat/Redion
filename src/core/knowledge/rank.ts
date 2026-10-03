/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/knowledge/rank.ts (npm run bauen:ts). */
/* ============================================================================
 * core/knowledge/rank.ts — welche Seiten das Netz trägt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/knowledge/rank.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/knowledge/rank.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WAS BISHER DA WAR, UND WAS NICHT (E285).
 *
 * Redions Wissensgraph ist reich: fünf Knotenarten, vier Kantenarten,
 * Rückverweise, unverlinkte Erwähnungen, Alias-Auflösung. Was er nicht
 * hatte, ist eine Aussage darüber, welcher Knoten WICHTIG ist.
 *
 * `analyzeKnowledgeGraph` zählt Kanten (`verweise.ts:709`) und nennt die
 * Zwölf mit den meisten „Naben". Das ist der Grad, und der Grad ist eine
 * schwache Auskunft: eine Seite, auf die zwanzig Wegwerfnotizen zeigen,
 * steht damit über einer, auf die drei zentrale Seiten zeigen.
 *
 * PageRank beantwortet genau diese Frage anders: nicht „wie viele zeigen
 * her", sondern „wie wichtig sind die, die herzeigen". Die Wichtigkeit
 * ergibt sich aus sich selbst, und man rechnet sie aus, indem man das
 * Verteilen so lange wiederholt, bis sich nichts mehr ändert.
 *
 * ─── DER FEHLER, DEN DIE NAIVE FASSUNG MACHT ────────────────────────────────
 *
 * DREI VON VIER KANTENARTEN SIND GAR NICHT GERICHTET.
 *
 * `addEdge` in `verweise.ts:533` normalisiert:
 *
 *     const undirected = kind !== 'link';
 *     const first  = undirected && source > target ? target : source;
 *     const second = undirected && source > target ? source : target;
 *
 * Bei `relation`, `tag` und `tree` ist `source` also schlicht die
 * lexikalisch kleinere Kennung. Wer diese Kanten als gerichtet nimmt,
 * rechnet eine Rangfolge aus, die davon abhängt, wie die Zufallskennungen
 * ausfallen. Das Ergebnis sähe vollkommen plausibel aus und wäre Unsinn —
 * die schlimmste Sorte Fehler.
 *
 * Deshalb sagt der Aufrufer AUSDRÜCKLICH, welche Arten eine Richtung
 * tragen. Eine Vorgabe gibt es, aber sie steht als Wert da und nicht als
 * Annahme im Code.
 *
 * ─── UND DER ZWEITE: SACKGASSEN VERSCHLUCKEN GEWICHT ────────────────────────
 *
 * Ein Knoten ohne ausgehende Kante („dangling node") hat nichts, wohin er
 * sein Gewicht weitergeben könnte. Wer das nicht behandelt, verliert in
 * jeder Runde Masse; nach dreissig Runden ist die Summe nicht mehr 1,
 * sondern 0,4, und die Zahlen sind untereinander nicht mehr vergleichbar.
 *
 * In Redion ist das kein Randfall, sondern der Normalfall: jede Seite ohne
 * ausgehenden Link ist eine Sackgasse, und das sind die meisten.
 *
 * Ihr Gewicht wird deshalb gleichmässig auf ALLE verteilt — so, als führe
 * von ihnen eine Kante zu jedem. Die Prüfung misst genau das: die Summe
 * muss 1 bleiben. Das ist die eine Eigenschaft, die einen kaputten
 * PageRank zuverlässig verrät.
 *
 * ─── WAS DIESE DATEI NICHT TUT ──────────────────────────────────────────────
 *
 * Sie speichert nichts. Kein Fach, kein Meta-Schlüssel, keine zweite
 * Datenbank. Sie bekommt Knoten und Kanten, sie gibt Zahlen zurück. Der
 * Rang ist ABGELEITET und jederzeit neu ausrechenbar — genau wie Redurs
 * Regel für die Vorschaubilder.
 *
 * Sie kennt auch keinen Bereich. `verweise.ts` reicht seinen Graph hinein;
 * dass es Seiten, Zeilen und Entscheidungen gibt, erfährt sie nur als
 * Zeichenkette in `kind`.
 * ==========================================================================*/

const KnowledgeRank = (() => {

  /** Ein Knoten, so viel wie der Rang davon braucht. */
  type Node = {
    id: string;
    /** 'page' | 'row' | 'decision' | 'source' | 'tag' — hier nur ein Wort. */
    kind?: string;
    /** ISO-Zeit der letzten Bearbeitung, für die Frische. */
    edited?: string;
    favorite?: boolean;
  };

  /** Eine Kante. Ob sie eine Richtung TRÄGT, sagt `gerichtet` unten. */
  type Edge = { source: string; target: string; kind?: string };

  type Optionen = {
    /**
     * Welche Kantenarten wirklich eine Richtung tragen.
     *
     * Alles, was NICHT hier steht, wird in beide Richtungen gerechnet.
     * Vorgabe `['link']` — das ist Redions Wahrheit (siehe Kopf), aber sie
     * steht als Wert da und nicht als Annahme im Rechenweg.
     */
    gerichtet?: string[];
    /**
     * Wie stark eine Kantenart zählt. Fehlt eine Art, zählt sie 1.
     *
     * Vorgabe: ein ausdrücklicher Link wiegt mehr als eine Baumkante, denn
     * die Baumkante entsteht schon dadurch, dass eine Seite irgendwo
     * abgelegt wurde. Ein Tag verbindet alles mit allem und wiegt am
     * wenigsten.
     */
    gewicht?: Record<string, number>;
    /** Dämpfung. 0,85 ist der Wert aus der ursprünglichen Arbeit. */
    daempfung?: number;
    /** Obergrenze der Runden — die Rechnung hört vorher auf, wenn sie kann. */
    runden?: number;
    /** Ab welcher Änderung es genug ist (Summe der Beträge). */
    toleranz?: number;
    /** Welche Knotenarten gar nicht mitgerechnet werden. */
    ohne?: string[];
  };

  const VORGABE_GEWICHT: Record<string, number> = {
    link: 1.0, relation: 0.8, tree: 0.5, tag: 0.3
  };

  type Rang = {
    id: string;
    /** Der reine PageRank. Alle zusammen ergeben 1. */
    rang: number;
    /** Platz in der Rangfolge, 1 = höchster. */
    platz: number;
  };

  type Ergebnis = {
    liste: Rang[];
    /** Nach Kennung, für den schnellen Zugriff. */
    nachId: Record<string, number>;
    /** Wie viele Runden wirklich gelaufen sind. */
    runden: number;
    /** Wie gross die letzte Änderung war — sagt, ob es konvergiert ist. */
    rest: number;
    /** Die Summe. Muss 1 sein; alles andere ist ein Fehler im Rechenweg. */
    summe: number;
    /** Wie viele Knoten keine ausgehende Kante hatten. */
    sackgassen: number;
  };

  /**
   * Der Rang jedes Knotens.
   *
   * @param nodes  alle Knoten. Doppelte Kennungen gewinnen zuletzt.
   * @param edges  alle Kanten. Kanten auf unbekannte Knoten fallen weg.
   */
  const rank = (nodes: Node[], edges: Edge[], opt: Optionen = {}): Ergebnis => {
    const gerichtet = new Set(opt.gerichtet || ['link']);
    const gewicht = opt.gewicht || VORGABE_GEWICHT;
    const d = typeof opt.daempfung === 'number' ? opt.daempfung : 0.85;
    const maxRunden = opt.runden || 100;
    const toleranz = typeof opt.toleranz === 'number' ? opt.toleranz : 1e-8;
    const ohne = new Set(opt.ohne || []);

    /* --- Knoten auf Zahlen abbilden ---------------------------------------
       Maps mit Zeichenketten-Schlüsseln in einer Schleife, die millionenfach
       läuft, sind der teuerste Teil. Einmal umschreiben, danach nur noch
       Zahlen. */
    const ids: string[] = [];
    const index = new Map<string, number>();
    for (const n of nodes) {
      if (!n || !n.id) continue;
      if (n.kind && ohne.has(n.kind)) continue;
      if (index.has(n.id)) continue;
      index.set(n.id, ids.length);
      ids.push(n.id);
    }
    const N = ids.length;
    if (!N) {
      return { liste: [], nachId: Object.create(null), runden: 0,
               rest: 0, summe: 0, sackgassen: 0 };
    }

    /* --- Kanten in eine gerichtete Form bringen ---------------------------
       Eine ungerichtete Kante wird zu ZWEI gerichteten. Das ist nicht
       dasselbe wie „Richtung ignorieren": das Gewicht fliesst dann wirklich
       in beide Richtungen, und ein Knoten mit einer einzigen ungerichteten
       Kante ist keine Sackgasse mehr. */
    const vonListe: number[][] = new Array(N);
    const gewListe: number[][] = new Array(N);
    for (let i = 0; i < N; i++) { vonListe[i] = []; gewListe[i] = []; }

    const lege = (a: number, b: number, w: number): void => {
      vonListe[a]!.push(b);
      gewListe[a]!.push(w);
    };

    for (const e of edges) {
      if (!e) continue;
      const a = index.get(e.source);
      const b = index.get(e.target);
      if (a === undefined || b === undefined || a === b) continue;
      const art = e.kind || '';
      const w = typeof gewicht[art] === 'number' ? gewicht[art]! : 1;
      if (w <= 0) continue;
      lege(a, b, w);
      if (!gerichtet.has(art)) lege(b, a, w);
    }

    /* Die Summe der ausgehenden Gewichte je Knoten — einmal, nicht je Runde. */
    const ausSumme = new Float64Array(N);
    let sackgassen = 0;
    for (let i = 0; i < N; i++) {
      let s = 0;
      const g = gewListe[i]!;
      for (let k = 0; k < g.length; k++) s += g[k]!;
      ausSumme[i] = s;
      if (s === 0) sackgassen++;
    }

    /* --- Die Iteration ---------------------------------------------------- */
    let r = new Float64Array(N);
    let neu = new Float64Array(N);
    r.fill(1 / N);

    let runden = 0;
    let rest = 0;
    for (; runden < maxRunden; runden++) {
      /* Was die Sackgassen halten, wird gleichmässig verteilt — sonst
         verschwindet es, und die Summe fällt unter 1. */
      let hAngig = 0;
      for (let i = 0; i < N; i++) if (ausSumme[i] === 0) hAngig += r[i]!;

      const grund = (1 - d) / N + (d * hAngig) / N;
      neu.fill(grund);

      for (let i = 0; i < N; i++) {
        const s = ausSumme[i]!;
        if (s === 0) continue;
        const anteil = (d * r[i]!) / s;
        const ziel = vonListe[i]!;
        const g = gewListe[i]!;
        for (let k = 0; k < ziel.length; k++) {
          /* `noUncheckedIndexedAccess` verlangt die Zwischenvariable: bei
             `neu[ziel[k]!] += …` hält TypeScript das Ziel für vielleicht
             `undefined`, obwohl `Float64Array` immer eine Zahl gibt. */
          const j = ziel[k]!;
          neu[j] = neu[j]! + anteil * g[k]!;
        }
      }

      rest = 0;
      for (let i = 0; i < N; i++) rest += Math.abs(neu[i]! - r[i]!);

      const tausch = r; r = neu; neu = tausch;
      if (rest < toleranz) { runden++; break; }
    }

    /* --- Ausgeben --------------------------------------------------------- */
    let summe = 0;
    for (let i = 0; i < N; i++) summe += r[i]!;

    const liste: Rang[] = new Array(N);
    for (let i = 0; i < N; i++) liste[i] = { id: ids[i]!, rang: r[i]!, platz: 0 };
    /* Bei gleichem Rang nach Kennung, damit die Reihenfolge zwischen zwei
       Läufen dieselbe ist. Ein Wissensrang, der sich beim Neuladen
       umsortiert, sieht aus wie ein Fehler. */
    liste.sort((a, b) => b.rang - a.rang || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    const nachId: Record<string, number> = Object.create(null);
    for (let i = 0; i < liste.length; i++) {
      liste[i]!.platz = i + 1;
      nachId[liste[i]!.id] = liste[i]!.rang;
    }

    return { liste, nachId, runden, rest, summe, sackgassen };
  };

  /* ==========================================================================
   * VOM RANG ZUR ZAHL, DIE MAN HINSCHREIBEN KANN
   * ------------------------------------------------------------------------
   * Der reine PageRank ist eine winzige Zahl (bei tausend Knoten um 0,001)
   * und sagt einem Menschen nichts. Was er sehen soll, ist eine Ordnung von
   * 0 bis 100.
   *
   * Das ist NICHT dasselbe wie der Rang mal hunderttausend. Zwei Dinge
   * kommen hinzu, und beide sind Meinung und nicht Mathematik — deshalb
   * stehen sie in einer eigenen Funktion, die man weglassen kann:
   *
   *   FRISCHE   Etwas, das gestern bearbeitet wurde, ist für heute
   *             wichtiger als dasselbe von vor zwei Jahren. Der Zuschlag
   *             fällt über ein halbes Jahr auf null.
   *   STERN     Was jemand ausdrücklich markiert hat, sticht die Rechnung.
   *             Der Mensch weiss mehr über seine Absicht als der Graph.
   *
   * Bewusst NICHT dabei: die Knotenart. Eine Entscheidung ist nicht per se
   * wichtiger als eine Seite — das hängt vom Menschen ab, nicht vom Typ.
   * Wer es anders will, reicht `artGewicht` herein.
   * ======================================================================*/

  type PunktOptionen = {
    /** Wie stark die Frische zuschlägt, 0 = gar nicht. Vorgabe 0,25. */
    frische?: number;
    /** Über wie viele Tage die Frische auf null fällt. Vorgabe 180. */
    frischeTage?: number;
    /** Zuschlag für einen Stern, 0 = gar nicht. Vorgabe 0,15. */
    stern?: number;
    /** Faktor je Knotenart. Fehlt eine Art, zählt sie 1. */
    artGewicht?: Record<string, number>;
    /** Der Bezugszeitpunkt. Ohne Angabe: jetzt. */
    jetzt?: number;
  };

  type Punkt = { id: string; punkte: number; platz: number; rang: number };

  /**
   * Aus dem Rang eine Zahl von 0 bis 100.
   *
   * Der Höchste bekommt immer 100 — die Zahl ist ein VERGLEICH innerhalb
   * dieses Bestands, keine absolute Note. Bei einem einzigen Knoten ist das
   * ebenso richtig wie bei zehntausend.
   *
   * Die Wurzel dazwischen ist Absicht: PageRank ist extrem schief verteilt,
   * und eine gerade Umrechnung gäbe dem Zweitplatzierten 8 von 100. Mit der
   * Wurzel wird aus der Rangfolge etwas, das man lesen kann.
   */
  const punkte = (erg: Ergebnis, nodes: Node[], opt: PunktOptionen = {}): Punkt[] => {
    const frischeStaerke = typeof opt.frische === 'number' ? opt.frische : 0.25;
    const frischeTage = opt.frischeTage || 180;
    const sternStaerke = typeof opt.stern === 'number' ? opt.stern : 0.15;
    const artGewicht = opt.artGewicht || {};
    const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();

    const info = new Map<string, Node>();
    for (const n of nodes) if (n && n.id) info.set(n.id, n);

    const roh: Array<{ id: string; wert: number; rang: number }> = [];
    for (const r of erg.liste) {
      const n = info.get(r.id);
      /* Die Wurzel macht aus der schiefen Verteilung eine lesbare. */
      let wert = Math.sqrt(Math.max(0, r.rang));

      if (n) {
        if (frischeStaerke > 0 && n.edited) {
          const t = Date.parse(n.edited);
          if (Number.isFinite(t)) {
            const tage = (jetzt - t) / 86400000;
            /* Linear auf null über `frischeTage`; älter gibt nichts, aber
               zieht auch nichts ab. Ein Zuschlag, der negativ werden kann,
               wäre eine Bestrafung für Bestand — und Bestand ist der Sinn
               eines Wissensspeichers. */
            const frisch = Math.max(0, 1 - Math.max(0, tage) / frischeTage);
            wert *= (1 + frischeStaerke * frisch);
          }
        }
        if (sternStaerke > 0 && n.favorite) wert *= (1 + sternStaerke);
        if (n.kind && typeof artGewicht[n.kind] === 'number') {
          wert *= artGewicht[n.kind]!;
        }
      }
      roh.push({ id: r.id, wert, rang: r.rang });
    }

    const hoechst = roh.reduce((m, x) => Math.max(m, x.wert), 0);
    roh.sort((a, b) => b.wert - a.wert || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    return roh.map((x, i) => ({
      id: x.id,
      punkte: hoechst > 0 ? Math.round((x.wert / hoechst) * 100) : 0,
      platz: i + 1,
      rang: x.rang
    }));
  };

  return { rank, punkte, VORGABE_GEWICHT };
})();

(window as any).KnowledgeRank = KnowledgeRank;
