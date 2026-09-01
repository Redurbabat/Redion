/* ============================================================================
 * core/learning/fsrs.ts — der freie Wiederholungsplaner (FSRS 4.5)
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/learning/fsrs.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/learning/fsrs.js`.
 * ----------------------------------------------------------------------------
 * REIN: kennt weder Uhr noch Ablage noch DOM. Die verstrichene Zeit kommt als
 * Zahl herein, das Ergebnis geht als Zahl hinaus. Damit lässt sich jede
 * Behauptung darüber ohne Browser prüfen — und das ist bei einem Verfahren,
 * das über Monate wirkt, der einzige Weg, es überhaupt zu prüfen.
 *
 * WARUM ÜBERHAUPT EIN ZWEITES VERFAHREN
 *
 * SM-2 (Anki, Redion bis heute) kennt zwei Zahlen je Karte: einen Abstand und
 * eine „Leichtigkeit". Es weiss nicht, wie WAHRSCHEINLICH man eine Karte
 * gerade noch kann — es rechnet einen Abstand fort und hofft. Wer eine Karte
 * nach drei Monaten wiedersieht und sie kann, bekommt denselben Zuschlag wie
 * jemand, der sie nach drei Tagen konnte.
 *
 * FSRS führt drei Zahlen: STABILITÄT (nach wie vielen Tagen ist die
 * Erinnerung auf 90 % gefallen), SCHWIERIGKEIT (wie zäh ist diese Karte für
 * diesen Menschen) und daraus die ABRUFBARKEIT zu jedem Zeitpunkt. Der
 * nächste Termin ist dann keine Fortschreibung, sondern eine Antwort auf die
 * Frage: wann fällt die Erinnerung unter das, was ich noch will?
 *
 * VON HAND UND NICHT ALS PAKET (§6). `ts-fsrs` wäre eine Abhängigkeit für
 * siebzehn Gewichte und zwei Dutzend Zeilen Rechnung. Die Formeln stehen
 * offen; die Rechnung steht hier.
 *
 * WAS HIER NICHT PASSIERT: eine Umstellung. SM-2 bleibt die Vorgabe, und eine
 * Karte wechselt das Verfahren nur, wenn ein Mensch es sagt. Der Grund steht
 * in ENTSCHEIDUNGEN.md — ein Verfahren, das rückwirkend alle Termine
 * verschiebt, ist genau die Sorte Änderung, die man erst merkt, wenn die
 * Prüfung schon vorbei ist.
 * ==========================================================================*/

const Fsrs = (() => {

  /* Die siebzehn Gewichte von FSRS 4.5. Sie stammen aus der Anpassung an
     rund siebzig Millionen Wiederholungen und sind die Vorgabe, solange
     niemand eigene rechnet. Wer sie ändert, ändert jeden künftigen Termin —
     deshalb stehen sie an genau einer Stelle. */
  const W: readonly number[] = [
    0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.0310,
    1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.5870, 0.2272, 2.8755
  ];

  /* Die Vergessenskurve. `DECAY` und `FACTOR` gehören zusammen: FACTOR ist so
     gewählt, dass R nach genau S Tagen auf 0,9 steht. Das ist die Definition
     von Stabilität, und sie steht hier, weil sie sonst nirgends steht. */
  const DECAY = -0.5;
  const FACTOR = 19 / 81;

  /** Eine Note: 1 nochmal, 2 schwer, 3 gut, 4 leicht. */
  type Note = 1 | 2 | 3 | 4;

  /** Was Redion je Karte führt, wenn sie nach FSRS läuft. */
  type Stand = {
    stabilitaet: number;   /* in Tagen */
    schwierigkeit: number; /* 1 bis 10 */
  };

  const grenze = (x: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, x));

  /**
   * Wie wahrscheinlich ist die Erinnerung nach `tage` Tagen noch da?
   * Bei `tage === stabilitaet` kommt 0,9 heraus — das ist die Definition.
   */
  const abrufbarkeit = (tage: number, stabilitaet: number): number => {
    const s = Math.max(0.01, stabilitaet);
    return Math.pow(1 + FACTOR * Math.max(0, tage) / s, DECAY);
  };

  /**
   * Nach wie vielen Tagen fällt die Erinnerung auf `ziel`?
   * Die Umkehrung von `abrufbarkeit`, und damit der nächste Termin.
   */
  const abstand = (stabilitaet: number, ziel = 0.9): number => {
    const z = grenze(ziel, 0.7, 0.99);
    return (stabilitaet / FACTOR) * (Math.pow(z, 1 / DECAY) - 1);
  };

  /**
   * Der Stand nach der ALLERERSTEN Antwort auf eine Karte.
   *
   * DIE SCHWIERIGKEIT WIRD LINEAR GERECHNET, und das ist kein Detail: FSRS 5
   * nimmt an dieser Stelle `w4 - e^(w5*(G-1)) + 1`, FSRS 4.5 die Gerade
   * `w4 - (G-3)*w5`. Die zwei Formeln gehören zu ZWEI VERSCHIEDENEN
   * GEWICHTSSÄTZEN — 4.5 hat siebzehn Gewichte, 5 hat neunzehn.
   *
   * Der erste Entwurf hier hat die Formel von 5 mit den Gewichten von 4.5
   * gemischt. Nachgerechnet ergab das für „gut" und „leicht" beide Male den
   * Anschlag 1: 5,16 - e^2,46 + 1 = -5,5. Jede neue Karte wäre als
   * kinderleicht eingestuft worden, und ihre Abstände wären sofort
   * auseinandergelaufen. Aufgefallen ist es an §3 des Prüflaufs — an einer
   * Behauptung über die REIHENFOLGE, nicht über eine Zahl.
   */
  const ersterStand = (note: Note): Stand => ({
    stabilitaet: Math.max(0.1, W[note - 1] ?? 1),
    schwierigkeit: grenze((W[4] ?? 5) - (note - 3) * (W[5] ?? 1), 1, 10)
  });

  /** Die Schwierigkeit wandert langsam zur Schwierigkeit einer „leichten". */
  const neueSchwierigkeit = (alt: number, note: Note): number => {
    const linear = alt - (W[6] ?? 1) * (note - 3);
    /* Dämpfung: nahe 10 bewegt sich fast nichts mehr, nahe 1 viel. Ohne sie
       liefe eine Karte nach ein paar schweren Antworten an den Anschlag und
       käme nie zurück. */
    const gedaempft = alt + (linear - alt) * (10 - alt) / 9;
    const zurueck = ersterStand(4).schwierigkeit;
    return grenze((W[7] ?? 0) * zurueck + (1 - (W[7] ?? 0)) * gedaempft, 1, 10);
  };

  /** Die Stabilität, wenn die Karte GEKONNT wurde (Note 2, 3 oder 4). */
  const stabilitaetNachKoennen = (s: number, d: number, r: number, note: Note): number => {
    const schwerBremse = note === 2 ? (W[15] ?? 1) : 1;
    const leichtBonus  = note === 4 ? (W[16] ?? 1) : 1;
    const zuwachs = Math.exp(W[8] ?? 0) * (11 - d) * Math.pow(s, -(W[9] ?? 0)) *
                    (Math.exp((W[10] ?? 0) * (1 - r)) - 1) * schwerBremse * leichtBonus;
    return Math.max(0.1, s * (1 + zuwachs));
  };

  /**
   * Die Stabilität nach einem FEHLER.
   *
   * Sie fällt, aber nicht auf null: was einmal gesessen hat, sitzt beim
   * zweiten Mal schneller wieder. Und sie kann nie ÜBER der alten liegen —
   * ein Fehler darf einen Termin nicht nach hinten schieben.
   */
  const stabilitaetNachFehler = (s: number, d: number, r: number): number => {
    const neu = (W[11] ?? 0) * Math.pow(d, -(W[12] ?? 0)) *
                (Math.pow(s + 1, W[13] ?? 0) - 1) * Math.exp((W[14] ?? 0) * (1 - r));
    return grenze(neu, 0.1, s);
  };

  /**
   * Eine Antwort verrechnen.
   *
   * @param stand  was bisher galt, oder `null` für die erste Antwort
   * @param note   1 nochmal, 2 schwer, 3 gut, 4 leicht
   * @param tage   wie viele Tage seit der letzten Antwort vergangen sind
   * @param ziel   welche Abrufbarkeit beim nächsten Termin gelten soll
   */
  const antworten = (stand: Stand | null, note: Note, tage: number, ziel = 0.9): {
    stand: Stand; abstandTage: number; abrufbarkeitVorher: number; fehler: boolean;
  } => {
    if (!stand) {
      const s = ersterStand(note);
      return { stand: s, abstandTage: Math.max(0, abstand(s.stabilitaet, ziel)),
               abrufbarkeitVorher: 1, fehler: note === 1 };
    }
    const r = abrufbarkeit(tage, stand.stabilitaet);
    const d = neueSchwierigkeit(stand.schwierigkeit, note);
    const s = note === 1
      ? stabilitaetNachFehler(stand.stabilitaet, stand.schwierigkeit, r)
      : stabilitaetNachKoennen(stand.stabilitaet, stand.schwierigkeit, r, note);
    return { stand: { stabilitaet: s, schwierigkeit: d },
             abstandTage: Math.max(0, abstand(s, ziel)),
             abrufbarkeitVorher: r, fehler: note === 1 };
  };

  /**
   * Aus einem SM-2-Stand einen FSRS-Stand schätzen — für den Übergang.
   *
   * SCHÄTZEN UND NICHT RECHNEN, und das gehört dazugesagt: SM-2 führt keine
   * Stabilität, es gibt keine verlustfreie Umrechnung. Der letzte Abstand ist
   * der beste Anhaltspunkt, den es gibt (er WAR ja ein Abstand, bei dem die
   * Karte noch sass), und die Leichtigkeit sagt grob, wie zäh sie war.
   *
   * Deshalb ist das kein stiller Schritt: wer umstellt, bekommt es gesagt,
   * und im Protokoll steht `algorithm: 'fsrs'` ab genau dieser Antwort.
   */
  const ausSm2 = (intervall: number, ease: number): Stand => ({
    stabilitaet: Math.max(0.1, Number(intervall) || 1),
    /* Zwei Punkte legen die Gerade fest, und beide sind bekannt: ease 2,5 ist
       SM-2s Vorgabe und heisst „durchschnittlich" — das ist FSRS-Schwierigkeit
       5, die Mitte. ease 1,3 ist SM-2s Anschlag nach unten und heisst „so zäh
       wie es geht" — das ist 10.

       Der erste Entwurf schrieb `11 - ease * 3,5`. Nachgerechnet ergab das
       für eine ganz gewöhnliche Karte mit ease 2,5 die Schwierigkeit 2,25 —
       also „fast geschenkt", und ihre Abstände wären sofort auseinander-
       gelaufen. Zwei bekannte Punkte auszurechnen ist billiger, als es
       hinterher zu merken. */
    schwierigkeit: grenze(10 - ((Number(ease) || 2.5) - 1.3) * (5 / 1.2), 1, 10)
  });

  return { W, DECAY, FACTOR, abrufbarkeit, abstand, ersterStand,
           neueSchwierigkeit, antworten, ausSm2 };
})();

(globalThis as any).Fsrs = Fsrs;
