/* ============================================================================
 * register/elektroformeln.js — die Formelsammlung, rechenbar
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/elektroformeln.ts`.
 * ----------------------------------------------------------------------------
 * WARUM EINE FORMELSAMMLUNG IM CODE UND NICHT ALS PDF
 *
 * Ein gescanntes Formelheft kann man ansehen. Mehr nicht: man kann nicht
 * suchen, nicht rechnen, keinen Wert einsetzen. Wer P aus U und I braucht,
 * blättert, findet die Zeile, tippt sie in den Taschenrechner ab und
 * verrechnet sich beim Abtippen.
 *
 * Hier steht jede Formel als DATEN: welche Grössen vorkommen, welche Einheit
 * jede hat, und wie man nach jeder einzelnen auflöst. Damit kann Redion
 * rechnen, suchen, den Weg zeigen und die Einheiten mitführen — und das
 * eigene Heft als PDF bleibt trotzdem daneben liegen (siehe `formelheft.ts`).
 *
 * DIE FORMELN SELBST GEHÖREN NIEMANDEM. `U = R · I` ist seit 1826 bekannt und
 * steht in jedem Lehrbuch. Was in einem Heft geschützt ist, ist die Auswahl,
 * die Anordnung und der Satz — und davon ist hier nichts übernommen: die
 * Reihenfolge folgt dem, was in der Ausbildung zuerst gebraucht wird.
 *
 * KEINE NORMATIVEN ENTSCHEIDUNGEN (E128). Hier steht keine Schutz- oder
 * Leiterdimensionierung, keine Verlegeart, keine Tabelle aus einer Norm.
 * Was hier steht, sind physikalische Zusammenhänge — und wo eine Annahme
 * nötig ist (etwa ρ für Kupfer), steht sie sichtbar dabei.
 * ==========================================================================*/

(window as any).Register = (window as any).Register || {};

Register.elektroformeln = (() => {

  /** Eine Grösse in einer Formel. */
  type Groesse = {
    /** Formelzeichen, wie es im Heft steht: U, I, R, P … */
    zeichen: string;
    name: string;
    einheit: string;
    /** Was die Grösse bedeutet — ein Satz, für den Lernmodus. */
    was?: string;
  };

  type Formel = {
    id: string;
    kapitel: string;
    /** Wie die Formel gelesen wird: „U = R · I" */
    schreibweise: string;
    /** Die Grössen in der Reihenfolge Ergebnis, dann Eingaben. */
    groessen: Groesse[];
    /**
     * Nach jeder Grösse auflösen. Der Schlüssel ist das Zeichen, das
     * gesucht wird; der Wert rechnet aus den übrigen.
     *
     * KEIN `eval`, KEIN Formelparser: gewöhnliche Funktionen. Eine
     * Formelsammlung, die Zeichenketten auswertet, wäre genau der Weg,
     * den CLAUDE.md §20 verbietet — und sie wäre langsamer und schlechter
     * prüfbar dazu.
     */
    loese: Record<string, (v: Record<string, number>) => number>;
    /** Der Rechenweg in Worten — für „Schritt für Schritt" (Punkt 66). */
    weg?: Record<string, (v: Record<string, number>, e: number) => string[]>;
    /** Eine Annahme, die der Mensch kennen muss, bevor er das Ergebnis glaubt. */
    annahme?: string;
    erklaerung: string;
  };

  const KAPITEL: Array<[string, string, string]> = [
    ['grund',     'Grundformeln',           'Ω'],
    ['reihe',     'Reihenschaltung',        '⎓'],
    ['parallel',  'Parallelschaltung',      '⑂'],
    ['leistung',  'Leistung und Energie',   'W'],
    ['leiter',    'Leiter und Widerstand',  '▬'],
    ['waerme',    'Elektrowärme',           '🌡'],
    ['quelle',    'Spannungsquellen',       '⎔'],
    ['konden',    'Kondensator',            '⊣⊢'],
    ['wechsel',   'Wechselstrom',           '∿'],
    ['dreh',      'Drehstrom',              '⌇'],
    ['trafo',     'Transformator',          '⊙'],
    ['motor',     'Motor',                  'M'],
    ['licht',     'Lichttechnik',           '☀'],
    ['kompen',    'Kompensation',           'φ']
  ];

  /* Hilfen, damit die Liste lesbar bleibt. */
  const g = (zeichen: string, name: string, einheit: string, was?: string): Groesse =>
    was === undefined ? { zeichen, name, einheit } : { zeichen, name, einheit, was };
  const WURZEL = Math.sqrt;
  const PI = Math.PI;

  const EINGEBAUT: Formel[] = [

    /* ---- Grundformeln ---------------------------------------------------- */
    {
      id: 'ohm', kapitel: 'grund', schreibweise: 'U = R · I',
      groessen: [g('U', 'Spannung', 'V', 'Wie stark die Ladung getrieben wird'),
                 g('R', 'Widerstand', 'Ω', 'Wie sehr sich der Leiter wehrt'),
                 g('I', 'Strom', 'A', 'Wie viel Ladung je Sekunde fliesst')],
      loese: {
        U: v => v.R! * v.I!,
        R: v => v.U! / v.I!,
        I: v => v.U! / v.R!
      },
      weg: {
        U: (v, e) => [`U = R · I`, `U = ${v.R} Ω · ${v.I} A`, `U = ${e} V`],
        R: (v, e) => [`R = U ÷ I`, `R = ${v.U} V ÷ ${v.I} A`, `R = ${e} Ω`],
        I: (v, e) => [`I = U ÷ R`, `I = ${v.U} V ÷ ${v.R} Ω`, `I = ${e} A`]
      },
      erklaerung: 'Das ohmsche Gesetz. Die eine Formel, aus der fast alles andere folgt.'
    },
    {
      id: 'leistung-ui', kapitel: 'leistung', schreibweise: 'P = U · I',
      groessen: [g('P', 'Leistung', 'W'), g('U', 'Spannung', 'V'), g('I', 'Strom', 'A')],
      loese: { P: v => v.U! * v.I!, U: v => v.P! / v.I!, I: v => v.P! / v.U! },
      weg: {
        P: (v, e) => [`P = U · I`, `P = ${v.U} V · ${v.I} A`, `P = ${e} W`],
        U: (v, e) => [`U = P ÷ I`, `U = ${v.P} W ÷ ${v.I} A`, `U = ${e} V`],
        I: (v, e) => [`I = P ÷ U`, `I = ${v.P} W ÷ ${v.U} V`, `I = ${e} A`]
      },
      erklaerung: 'Leistung ist Spannung mal Strom — was in jedem Moment umgesetzt wird.'
    },
    {
      id: 'leistung-ur', kapitel: 'leistung', schreibweise: 'P = U² / R',
      groessen: [g('P', 'Leistung', 'W'), g('U', 'Spannung', 'V'), g('R', 'Widerstand', 'Ω')],
      loese: { P: v => (v.U! * v.U!) / v.R!, U: v => WURZEL(v.P! * v.R!), R: v => (v.U! * v.U!) / v.P! },
      erklaerung: 'Wenn der Strom unbekannt ist, aber Spannung und Widerstand da sind.'
    },
    {
      id: 'leistung-ir', kapitel: 'leistung', schreibweise: 'P = I² · R',
      groessen: [g('P', 'Leistung', 'W'), g('I', 'Strom', 'A'), g('R', 'Widerstand', 'Ω')],
      loese: { P: v => v.I! * v.I! * v.R!, I: v => WURZEL(v.P! / v.R!), R: v => v.P! / (v.I! * v.I!) },
      erklaerung: 'Die Verlustleistung in einer Leitung — sie wächst im QUADRAT mit dem Strom.'
    },
    {
      id: 'arbeit', kapitel: 'leistung', schreibweise: 'W = P · t',
      groessen: [g('W', 'Arbeit', 'Wh'), g('P', 'Leistung', 'W'), g('t', 'Zeit', 'h')],
      loese: { W: v => v.P! * v.t!, P: v => v.W! / v.t!, t: v => v.W! / v.P! },
      erklaerung: 'Was über die Zeit zusammenkommt. Der Zähler misst genau das.'
    },
    {
      id: 'kosten', kapitel: 'leistung', schreibweise: 'K = k · W',
      groessen: [g('K', 'Kosten', 'CHF'), g('k', 'Preis je kWh', 'CHF/kWh'),
                 g('W', 'Energie', 'kWh')],
      loese: { K: v => v.k! * v.W!, k: v => v.K! / v.W!, W: v => v.K! / v.k! },
      erklaerung: 'Was der Verbrauch kostet.'
    },
    {
      id: 'wirkungsgrad', kapitel: 'leistung', schreibweise: 'η = P_ab / P_zu',
      groessen: [g('η', 'Wirkungsgrad', '', 'Zwischen 0 und 1 — mal 100 gibt Prozent'),
                 g('P_ab', 'abgegebene Leistung', 'W'),
                 g('P_zu', 'zugeführte Leistung', 'W')],
      loese: {
        'η': v => v.P_ab! / v.P_zu!,
        P_ab: v => v['η']! * v.P_zu!,
        P_zu: v => v.P_ab! / v['η']!
      },
      erklaerung: 'Was hinten herauskommt, geteilt durch das, was vorn hineingeht. Nie über 1.'
    },

    /* ---- Reihenschaltung ------------------------------------------------- */
    {
      id: 'reihe-r', kapitel: 'reihe', schreibweise: 'R = R₁ + R₂ + … + Rₙ',
      groessen: [g('R', 'Gesamtwiderstand', 'Ω'), g('R₁', 'Widerstand 1', 'Ω'),
                 g('R₂', 'Widerstand 2', 'Ω')],
      loese: {
        R: v => v['R₁']! + v['R₂']!,
        'R₁': v => v.R! - v['R₂']!,
        'R₂': v => v.R! - v['R₁']!
      },
      weg: { R: (v, e) => [`R = R₁ + R₂`, `R = ${v['R₁']} Ω + ${v['R₂']} Ω`, `R = ${e} Ω`] },
      erklaerung: 'In Reihe addieren sich die Widerstände. Der Strom ist überall gleich.'
    },
    {
      id: 'reihe-teiler', kapitel: 'reihe', schreibweise: 'U₁ / U₂ = R₁ / R₂',
      groessen: [g('U₁', 'Teilspannung 1', 'V'), g('U₂', 'Teilspannung 2', 'V'),
                 g('R₁', 'Widerstand 1', 'Ω'), g('R₂', 'Widerstand 2', 'Ω')],
      loese: {
        'U₁': v => v['U₂']! * v['R₁']! / v['R₂']!,
        'U₂': v => v['U₁']! * v['R₂']! / v['R₁']!,
        'R₁': v => v['R₂']! * v['U₁']! / v['U₂']!,
        'R₂': v => v['R₁']! * v['U₂']! / v['U₁']!
      },
      erklaerung: 'Die Spannungen verhalten sich wie die Widerstände — der Spannungsteiler.'
    },
    {
      id: 'spannungsteiler', kapitel: 'reihe', schreibweise: 'U₂ = U · R₂ / (R₁ + R₂)',
      groessen: [g('U₂', 'Teilspannung', 'V'), g('U', 'Gesamtspannung', 'V'),
                 g('R₁', 'Widerstand 1', 'Ω'), g('R₂', 'Widerstand 2', 'Ω')],
      loese: {
        'U₂': v => v.U! * v['R₂']! / (v['R₁']! + v['R₂']!),
        U: v => v['U₂']! * (v['R₁']! + v['R₂']!) / v['R₂']!,
        'R₂': v => v['R₁']! * v['U₂']! / (v.U! - v['U₂']!),
        'R₁': v => v['R₂']! * (v.U! - v['U₂']!) / v['U₂']!
      },
      weg: {
        'U₂': (v, e) => [`U₂ = U · R₂ ÷ (R₁ + R₂)`,
                         `U₂ = ${v.U} V · ${v['R₂']} Ω ÷ (${v['R₁']} Ω + ${v['R₂']} Ω)`,
                         `U₂ = ${v.U} V · ${v['R₂']} ÷ ${v['R₁']! + v['R₂']!}`,
                         `U₂ = ${e} V`]
      },
      erklaerung: 'Der belastungsfreie Spannungsteiler. Wer belastet, rechnet R₂ parallel zur Last.'
    },

    /* ---- Parallelschaltung ----------------------------------------------- */
    {
      id: 'parallel-r2', kapitel: 'parallel', schreibweise: 'R = (R₁ · R₂) / (R₁ + R₂)',
      groessen: [g('R', 'Gesamtwiderstand', 'Ω'), g('R₁', 'Widerstand 1', 'Ω'),
                 g('R₂', 'Widerstand 2', 'Ω')],
      loese: {
        R: v => (v['R₁']! * v['R₂']!) / (v['R₁']! + v['R₂']!),
        'R₁': v => (v.R! * v['R₂']!) / (v['R₂']! - v.R!),
        'R₂': v => (v.R! * v['R₁']!) / (v['R₁']! - v.R!)
      },
      weg: {
        R: (v, e) => [`R = (R₁ · R₂) ÷ (R₁ + R₂)`,
                      `R = (${v['R₁']} · ${v['R₂']}) ÷ (${v['R₁']} + ${v['R₂']})`,
                      `R = ${v['R₁']! * v['R₂']!} ÷ ${v['R₁']! + v['R₂']!}`,
                      `R = ${e} Ω`]
      },
      erklaerung: 'Die Faustformel für ZWEI parallele Widerstände. Für mehr gilt die Kehrwertformel.'
    },
    {
      id: 'parallel-i', kapitel: 'parallel', schreibweise: 'I = I₁ + I₂ + … + Iₙ',
      groessen: [g('I', 'Gesamtstrom', 'A'), g('I₁', 'Teilstrom 1', 'A'), g('I₂', 'Teilstrom 2', 'A')],
      loese: {
        I: v => v['I₁']! + v['I₂']!,
        'I₁': v => v.I! - v['I₂']!,
        'I₂': v => v.I! - v['I₁']!
      },
      erklaerung: 'Parallel addieren sich die Ströme. Die Spannung ist überall gleich.'
    },
    {
      id: 'stromteiler', kapitel: 'parallel', schreibweise: 'I₁ / I₂ = R₂ / R₁',
      groessen: [g('I₁', 'Teilstrom 1', 'A'), g('I₂', 'Teilstrom 2', 'A'),
                 g('R₁', 'Widerstand 1', 'Ω'), g('R₂', 'Widerstand 2', 'Ω')],
      loese: {
        'I₁': v => v['I₂']! * v['R₂']! / v['R₁']!,
        'I₂': v => v['I₁']! * v['R₁']! / v['R₂']!,
        'R₁': v => v['R₂']! * v['I₂']! / v['I₁']!,
        'R₂': v => v['R₁']! * v['I₁']! / v['I₂']!
      },
      erklaerung: 'UMGEKEHRT zum Spannungsteiler: durch den kleineren Widerstand fliesst mehr.'
    },

    /* ---- Leiter ---------------------------------------------------------- */
    {
      id: 'leiterwiderstand', kapitel: 'leiter', schreibweise: 'R = ρ · l / A',
      groessen: [g('R', 'Leiterwiderstand', 'Ω'),
                 g('ρ', 'spezifischer Widerstand', 'Ω·mm²/m', 'Kupfer 0,0178 · Aluminium 0,0286'),
                 g('l', 'Länge', 'm', 'Bei Hin- und Rückleiter die DOPPELTE Strecke'),
                 g('A', 'Querschnitt', 'mm²')],
      loese: {
        R: v => v['ρ']! * v.l! / v.A!,
        'ρ': v => v.R! * v.A! / v.l!,
        l: v => v.R! * v.A! / v['ρ']!,
        A: v => v['ρ']! * v.l! / v.R!
      },
      weg: {
        A: (v, e) => [`A = ρ · l ÷ R`,
                      `A = ${v['ρ']} · ${v.l} m ÷ ${v.R} Ω`,
                      `A = ${e} mm²`,
                      `→ den nächstgrösseren genormten Querschnitt wählen`]
      },
      annahme: 'ρ gilt bei 20 °C. Bei Hin- und Rückleiter ist l die doppelte Strecke.',
      erklaerung: 'Je länger und dünner, desto mehr Widerstand — und desto mehr Spannungsfall.'
    },
    {
      id: 'temperatur', kapitel: 'leiter', schreibweise: 'R₉ = R₂₀ · (1 + α · Δϑ)',
      groessen: [g('R₉', 'Widerstand warm', 'Ω'), g('R₂₀', 'Widerstand bei 20 °C', 'Ω'),
                 g('α', 'Temperaturbeiwert', '1/K', 'Kupfer 0,0039'),
                 g('Δϑ', 'Temperaturänderung', 'K')],
      loese: {
        'R₉': v => v['R₂₀']! * (1 + v['α']! * v['Δϑ']!),
        'R₂₀': v => v['R₉']! / (1 + v['α']! * v['Δϑ']!),
        'Δϑ': v => (v['R₉']! / v['R₂₀']! - 1) / v['α']!,
        'α': v => (v['R₉']! / v['R₂₀']! - 1) / v['Δϑ']!
      },
      annahme: 'α gilt für den Bereich, in dem der Zusammenhang linear ist.',
      erklaerung: 'Metall wird bei Wärme hochohmiger. Deshalb zieht ein kalter Motor mehr Strom.'
    },

    /* ---- Elektrowärme ---------------------------------------------------- */
    {
      id: 'waermemenge', kapitel: 'waerme', schreibweise: 'Q = m · c · Δϑ',
      groessen: [g('Q', 'Wärmemenge', 'J'), g('m', 'Masse', 'kg'),
                 g('c', 'spezifische Wärmekapazität', 'J/(kg·K)', 'Wasser 4186'),
                 g('Δϑ', 'Temperaturänderung', 'K')],
      loese: {
        Q: v => v.m! * v.c! * v['Δϑ']!,
        m: v => v.Q! / (v.c! * v['Δϑ']!),
        c: v => v.Q! / (v.m! * v['Δϑ']!),
        'Δϑ': v => v.Q! / (v.m! * v.c!)
      },
      erklaerung: 'Was es kostet, etwas zu erwärmen — unabhängig davon, womit.'
    },
    {
      id: 'waerme-elektrisch', kapitel: 'waerme', schreibweise: 'P · t · η = m · c · Δϑ',
      groessen: [g('P', 'Leistung', 'W'), g('t', 'Zeit', 's'), g('η', 'Wirkungsgrad', ''),
                 g('m', 'Masse', 'kg'), g('c', 'Wärmekapazität', 'J/(kg·K)'),
                 g('Δϑ', 'Temperaturänderung', 'K')],
      loese: {
        t: v => (v.m! * v.c! * v['Δϑ']!) / (v.P! * v['η']!),
        P: v => (v.m! * v.c! * v['Δϑ']!) / (v.t! * v['η']!),
        'Δϑ': v => (v.P! * v.t! * v['η']!) / (v.m! * v.c!),
        m: v => (v.P! * v.t! * v['η']!) / (v.c! * v['Δϑ']!),
        'η': v => (v.m! * v.c! * v['Δϑ']!) / (v.P! * v.t!),
        c: v => (v.P! * v.t! * v['η']!) / (v.m! * v['Δϑ']!)
      },
      erklaerung: 'Der Boiler: elektrische Energie mal Wirkungsgrad ergibt die Wärme im Wasser.'
    },

    /* ---- Spannungsquellen ------------------------------------------------ */
    {
      id: 'klemmenspannung', kapitel: 'quelle', schreibweise: 'U = U₀ − Rᵢ · I',
      groessen: [g('U', 'Klemmenspannung', 'V'), g('U₀', 'Leerlaufspannung', 'V'),
                 g('Rᵢ', 'Innenwiderstand', 'Ω'), g('I', 'Strom', 'A')],
      loese: {
        U: v => v['U₀']! - v['Rᵢ']! * v.I!,
        'U₀': v => v.U! + v['Rᵢ']! * v.I!,
        'Rᵢ': v => (v['U₀']! - v.U!) / v.I!,
        I: v => (v['U₀']! - v.U!) / v['Rᵢ']!
      },
      erklaerung: 'Unter Last bricht die Spannung ein — um genau den Anteil am Innenwiderstand.'
    },
    {
      id: 'quellstrom', kapitel: 'quelle', schreibweise: 'I = U₀ / (Rᵢ + R_L)',
      groessen: [g('I', 'Strom', 'A'), g('U₀', 'Leerlaufspannung', 'V'),
                 g('Rᵢ', 'Innenwiderstand', 'Ω'), g('R_L', 'Lastwiderstand', 'Ω')],
      loese: {
        I: v => v['U₀']! / (v['Rᵢ']! + v.R_L!),
        'U₀': v => v.I! * (v['Rᵢ']! + v.R_L!),
        R_L: v => v['U₀']! / v.I! - v['Rᵢ']!,
        'Rᵢ': v => v['U₀']! / v.I! - v.R_L!
      },
      erklaerung: 'Der Strom im geschlossenen Kreis, mit dem Innenwiderstand in Reihe.'
    },

    /* ---- Kondensator ----------------------------------------------------- */
    {
      id: 'kondensator-parallel', kapitel: 'konden', schreibweise: 'C = C₁ + C₂ + … + Cₙ',
      groessen: [g('C', 'Gesamtkapazität', 'µF'), g('C₁', 'Kapazität 1', 'µF'),
                 g('C₂', 'Kapazität 2', 'µF')],
      loese: {
        C: v => v['C₁']! + v['C₂']!,
        'C₁': v => v.C! - v['C₂']!,
        'C₂': v => v.C! - v['C₁']!
      },
      erklaerung: 'Bei Kondensatoren ist es UMGEKEHRT: parallel addieren sie sich.'
    },
    {
      id: 'kondensator-reihe', kapitel: 'konden', schreibweise: 'C = (C₁ · C₂) / (C₁ + C₂)',
      groessen: [g('C', 'Gesamtkapazität', 'µF'), g('C₁', 'Kapazität 1', 'µF'),
                 g('C₂', 'Kapazität 2', 'µF')],
      loese: {
        C: v => (v['C₁']! * v['C₂']!) / (v['C₁']! + v['C₂']!),
        'C₁': v => (v.C! * v['C₂']!) / (v['C₂']! - v.C!),
        'C₂': v => (v.C! * v['C₁']!) / (v['C₁']! - v.C!)
      },
      erklaerung: 'In Reihe wird die Gesamtkapazität kleiner als die kleinste einzelne.'
    },
    {
      id: 'plattenkondensator', kapitel: 'konden', schreibweise: 'C = ε₀ · εᵣ · A / d',
      groessen: [g('C', 'Kapazität', 'F'),
                 g('ε₀', 'elektrische Feldkonstante', 'F/m', 'fest: 8,854·10⁻¹²'),
                 g('εᵣ', 'Dielektrizitätszahl', '', 'Luft 1, Papier ≈ 2,3'),
                 g('A', 'Plattenfläche', 'm²'), g('d', 'Plattenabstand', 'm')],
      loese: {
        C: v => v['ε₀']! * v['εᵣ']! * v.A! / v.d!,
        A: v => v.C! * v.d! / (v['ε₀']! * v['εᵣ']!),
        d: v => v['ε₀']! * v['εᵣ']! * v.A! / v.C!,
        'εᵣ': v => v.C! * v.d! / (v['ε₀']! * v.A!)
      },
      erklaerung: 'Grosse Fläche und kleiner Abstand geben viel Kapazität.'
    },

    /* ---- Wechselstrom ---------------------------------------------------- */
    {
      id: 'scheitelwert', kapitel: 'wechsel', schreibweise: 'û = √2 · U',
      groessen: [g('û', 'Scheitelwert', 'V', 'Die höchste Spitze der Sinuskurve'),
                 g('U', 'Effektivwert', 'V', 'Der Wert, den das Messgerät anzeigt')],
      loese: { 'û': v => WURZEL(2) * v.U!, U: v => v['û']! / WURZEL(2) },
      weg: {
        'û': (v, e) => [`û = √2 · U`, `û = 1,414 · ${v.U} V`, `û = ${e} V`],
        U: (v, e) => [`U = û ÷ √2`, `U = ${v['û']} V ÷ 1,414`, `U = ${e} V`]
      },
      erklaerung: '230 V aus der Steckdose sind der Effektivwert — die Spitze liegt bei 325 V.'
    },
    {
      id: 'periodendauer', kapitel: 'wechsel', schreibweise: 'T = 1 / f',
      groessen: [g('T', 'Periodendauer', 's'), g('f', 'Frequenz', 'Hz')],
      loese: { T: v => 1 / v.f!, f: v => 1 / v.T! },
      weg: {
        T: (v, e) => [`T = 1 ÷ f`, `T = 1 ÷ ${v.f} Hz`, `T = ${e} s`],
        f: (v, e) => [`f = 1 ÷ T`, `f = 1 ÷ ${v.T} s`, `f = ${e} Hz`]
      },
      erklaerung: 'Bei 50 Hz dauert eine volle Schwingung 20 ms.'
    },
    {
      id: 'blindwiderstand-l', kapitel: 'wechsel', schreibweise: 'X_L = 2 · π · f · L',
      groessen: [g('X_L', 'induktiver Blindwiderstand', 'Ω'), g('f', 'Frequenz', 'Hz'),
                 g('L', 'Induktivität', 'H')],
      loese: {
        X_L: v => 2 * PI * v.f! * v.L!,
        f: v => v.X_L! / (2 * PI * v.L!),
        L: v => v.X_L! / (2 * PI * v.f!)
      },
      erklaerung: 'Eine Spule bremst Wechselstrom — und zwar umso mehr, je höher die Frequenz.'
    },
    {
      id: 'blindwiderstand-c', kapitel: 'wechsel', schreibweise: 'X_C = 1 / (2 · π · f · C)',
      groessen: [g('X_C', 'kapazitiver Blindwiderstand', 'Ω'), g('f', 'Frequenz', 'Hz'),
                 g('C', 'Kapazität', 'F')],
      loese: {
        X_C: v => 1 / (2 * PI * v.f! * v.C!),
        f: v => 1 / (2 * PI * v.X_C! * v.C!),
        C: v => 1 / (2 * PI * v.f! * v.X_C!)
      },
      erklaerung: 'Ein Kondensator lässt hohe Frequenzen durch und sperrt Gleichstrom ganz.'
    },
    {
      id: 'impedanz', kapitel: 'wechsel', schreibweise: 'Z = U / I',
      groessen: [g('Z', 'Scheinwiderstand', 'Ω'), g('U', 'Spannung', 'V'), g('I', 'Strom', 'A')],
      loese: { Z: v => v.U! / v.I!, U: v => v.Z! * v.I!, I: v => v.U! / v.Z! },
      erklaerung: 'Das ohmsche Gesetz für Wechselstrom — Wirk- und Blindanteil zusammen.'
    },
    {
      id: 'impedanz-reihe', kapitel: 'wechsel', schreibweise: 'Z = √(R² + X²)',
      groessen: [g('Z', 'Scheinwiderstand', 'Ω'), g('R', 'Wirkwiderstand', 'Ω'),
                 g('X', 'Blindwiderstand', 'Ω')],
      loese: {
        Z: v => WURZEL(v.R! * v.R! + v.X! * v.X!),
        R: v => WURZEL(v.Z! * v.Z! - v.X! * v.X!),
        X: v => WURZEL(v.Z! * v.Z! - v.R! * v.R!)
      },
      weg: {
        Z: (v, e) => [`Z = √(R² + X²)`,
                      `Z = √(${v.R}² + ${v.X}²)`,
                      `Z = √(${v.R! * v.R!} + ${v.X! * v.X!})`,
                      `Z = ${e} Ω`]
      },
      erklaerung: 'In Reihe addieren sich Wirk- und Blindwiderstand nach Pythagoras, nicht direkt.'
    },
    {
      id: 'scheinleistung', kapitel: 'wechsel', schreibweise: 'S = U · I',
      groessen: [g('S', 'Scheinleistung', 'VA'), g('U', 'Spannung', 'V'), g('I', 'Strom', 'A')],
      loese: { S: v => v.U! * v.I!, U: v => v.S! / v.I!, I: v => v.S! / v.U! },
      erklaerung: 'Was die Leitung tragen muss — auch der Teil, der keine Arbeit leistet.'
    },
    {
      id: 'wirkleistung-cos', kapitel: 'wechsel', schreibweise: 'P = U · I · cos φ',
      groessen: [g('P', 'Wirkleistung', 'W'), g('U', 'Spannung', 'V'), g('I', 'Strom', 'A'),
                 g('cosφ', 'Leistungsfaktor', '', 'Zwischen 0 und 1')],
      loese: {
        P: v => v.U! * v.I! * v['cosφ']!,
        U: v => v.P! / (v.I! * v['cosφ']!),
        I: v => v.P! / (v.U! * v['cosφ']!),
        'cosφ': v => v.P! / (v.U! * v.I!)
      },
      weg: {
        P: (v, e) => [`P = U · I · cos φ`,
                      `P = ${v.U} V · ${v.I} A · ${v['cosφ']}`, `P = ${e} W`]
      },
      erklaerung: 'Nur der Wirkanteil zählt für die Rechnung — cos φ sagt, wie gross er ist.'
    },
    {
      id: 'blindleistung', kapitel: 'wechsel', schreibweise: 'Q = U · I · sin φ',
      groessen: [g('Q', 'Blindleistung', 'var'), g('U', 'Spannung', 'V'), g('I', 'Strom', 'A'),
                 g('sinφ', 'Blindfaktor', '')],
      loese: {
        Q: v => v.U! * v.I! * v['sinφ']!,
        U: v => v.Q! / (v.I! * v['sinφ']!),
        I: v => v.Q! / (v.U! * v['sinφ']!),
        'sinφ': v => v.Q! / (v.U! * v.I!)
      },
      erklaerung: 'Pendelt zwischen Netz und Verbraucher hin und her, ohne Arbeit zu leisten.'
    },
    {
      id: 'leistungsdreieck', kapitel: 'wechsel', schreibweise: 'S = √(P² + Q²)',
      groessen: [g('S', 'Scheinleistung', 'VA'), g('P', 'Wirkleistung', 'W'),
                 g('Q', 'Blindleistung', 'var')],
      loese: {
        S: v => WURZEL(v.P! * v.P! + v.Q! * v.Q!),
        P: v => WURZEL(v.S! * v.S! - v.Q! * v.Q!),
        Q: v => WURZEL(v.S! * v.S! - v.P! * v.P!)
      },
      erklaerung: 'Das Leistungsdreieck. Auch hier gilt Pythagoras.'
    },

    /* ---- Drehstrom ------------------------------------------------------- */
    {
      id: 'dreh-schein', kapitel: 'dreh', schreibweise: 'S = √3 · U · I',
      groessen: [g('S', 'Scheinleistung', 'VA'), g('U', 'Aussenleiterspannung', 'V'),
                 g('I', 'Aussenleiterstrom', 'A')],
      loese: {
        S: v => WURZEL(3) * v.U! * v.I!,
        U: v => v.S! / (WURZEL(3) * v.I!),
        I: v => v.S! / (WURZEL(3) * v.U!)
      },
      weg: {
        S: (v, e) => [`S = √3 · U · I`, `S = 1,732 · ${v.U} V · ${v.I} A`, `S = ${e} VA`]
      },
      erklaerung: 'Beim Drehstrom kommt der Faktor √3 dazu — er stammt aus der 120°-Verschiebung.'
    },
    {
      id: 'dreh-wirk', kapitel: 'dreh', schreibweise: 'P = √3 · U · I · cos φ',
      groessen: [g('P', 'Wirkleistung', 'W'), g('U', 'Spannung', 'V'), g('I', 'Strom', 'A'),
                 g('cosφ', 'Leistungsfaktor', '')],
      loese: {
        P: v => WURZEL(3) * v.U! * v.I! * v['cosφ']!,
        I: v => v.P! / (WURZEL(3) * v.U! * v['cosφ']!),
        U: v => v.P! / (WURZEL(3) * v.I! * v['cosφ']!),
        'cosφ': v => v.P! / (WURZEL(3) * v.U! * v.I!)
      },
      weg: {
        I: (v, e) => [`I = P ÷ (√3 · U · cos φ)`,
                      `I = ${v.P} W ÷ (1,732 · ${v.U} V · ${v['cosφ']})`,
                      `I = ${e} A`]
      },
      erklaerung: 'Die wichtigste Formel am Motor: aus der Leistung den Strom für die Absicherung.'
    },
    {
      id: 'stern', kapitel: 'dreh', schreibweise: 'U = √3 · U_Str  ·  I = I_Str',
      groessen: [g('U', 'Aussenleiterspannung', 'V'), g('U_Str', 'Strangspannung', 'V')],
      loese: { U: v => WURZEL(3) * v.U_Str!, U_Str: v => v.U! / WURZEL(3) },
      erklaerung: 'Sternschaltung: 400 V zwischen den Aussenleitern, 230 V am einzelnen Strang.'
    },
    {
      id: 'dreieck', kapitel: 'dreh', schreibweise: 'U = U_Str  ·  I = √3 · I_Str',
      groessen: [g('I', 'Aussenleiterstrom', 'A'), g('I_Str', 'Strangstrom', 'A')],
      loese: { I: v => WURZEL(3) * v.I_Str!, I_Str: v => v.I! / WURZEL(3) },
      erklaerung: 'Dreieckschaltung: volle Spannung am Strang, dafür teilt sich der Strom auf.'
    },

    /* ---- Transformator --------------------------------------------------- */
    {
      id: 'trafo-uebersetzung', kapitel: 'trafo', schreibweise: 'U₁ / U₂ = N₁ / N₂ = ü',
      groessen: [g('U₁', 'Spannung primär', 'V'), g('U₂', 'Spannung sekundär', 'V'),
                 g('N₁', 'Windungen primär', ''), g('N₂', 'Windungen sekundär', '')],
      loese: {
        'U₁': v => v['U₂']! * v['N₁']! / v['N₂']!,
        'U₂': v => v['U₁']! * v['N₂']! / v['N₁']!,
        'N₁': v => v['N₂']! * v['U₁']! / v['U₂']!,
        'N₂': v => v['N₁']! * v['U₂']! / v['U₁']!
      },
      annahme: 'Gilt für den verlustfreien Transformator.',
      erklaerung: 'Die Spannungen verhalten sich wie die Windungszahlen.'
    },
    {
      id: 'trafo-strom', kapitel: 'trafo', schreibweise: 'I₁ / I₂ = U₂ / U₁ = N₂ / N₁',
      groessen: [g('I₁', 'Strom primär', 'A'), g('I₂', 'Strom sekundär', 'A'),
                 g('U₁', 'Spannung primär', 'V'), g('U₂', 'Spannung sekundär', 'V')],
      loese: {
        'I₁': v => v['I₂']! * v['U₂']! / v['U₁']!,
        'I₂': v => v['I₁']! * v['U₁']! / v['U₂']!,
        'U₁': v => v['U₂']! * v['I₂']! / v['I₁']!,
        'U₂': v => v['U₁']! * v['I₁']! / v['I₂']!
      },
      annahme: 'Gilt für den verlustfreien Transformator.',
      erklaerung: 'Der Strom geht UMGEKEHRT: mehr Spannung heisst weniger Strom.'
    },

    /* ---- Motor ----------------------------------------------------------- */
    {
      id: 'synchrondrehzahl', kapitel: 'motor', schreibweise: 'n_s = f · 60 / p',
      groessen: [g('n_s', 'Synchrondrehzahl', '1/min'), g('f', 'Frequenz', 'Hz'),
                 g('p', 'Polpaarzahl', '', '1 Polpaar = 3000/min bei 50 Hz')],
      loese: {
        n_s: v => v.f! * 60 / v.p!,
        f: v => v.n_s! * v.p! / 60,
        p: v => v.f! * 60 / v.n_s!
      },
      weg: {
        n_s: (v, e) => [`n_s = f · 60 ÷ p`, `n_s = ${v.f} Hz · 60 ÷ ${v.p}`, `n_s = ${e} 1/min`]
      },
      erklaerung: 'Die Drehzahl des Drehfelds. Der Läufer bleibt immer etwas dahinter.'
    },
    {
      id: 'schlupf', kapitel: 'motor', schreibweise: 's = (n_s − n) / n_s · 100 %',
      groessen: [g('s', 'Schlupf', '%'), g('n_s', 'Synchrondrehzahl', '1/min'),
                 g('n', 'Läuferdrehzahl', '1/min')],
      loese: {
        s: v => (v.n_s! - v.n!) / v.n_s! * 100,
        n: v => v.n_s! * (1 - v.s! / 100),
        n_s: v => v.n! / (1 - v.s! / 100)
      },
      erklaerung: 'Wie weit der Läufer dem Drehfeld nachhinkt. Ohne Schlupf kein Drehmoment.'
    },
    {
      id: 'motorleistung', kapitel: 'motor', schreibweise: 'P = M · 2 · π · n',
      groessen: [g('P', 'mechanische Leistung', 'W'), g('M', 'Drehmoment', 'Nm'),
                 g('n', 'Drehzahl', '1/s')],
      loese: {
        P: v => v.M! * 2 * PI * v.n!,
        M: v => v.P! / (2 * PI * v.n!),
        n: v => v.P! / (2 * PI * v.M!)
      },
      annahme: 'n in Umdrehungen je SEKUNDE — bei 1/min vorher durch 60 teilen.',
      erklaerung: 'Aus Drehmoment und Drehzahl die abgegebene Leistung an der Welle.'
    },
    {
      id: 'hubleistung', kapitel: 'motor', schreibweise: 'P = m · g · h / t',
      groessen: [g('P', 'Hubleistung', 'W'), g('m', 'Masse', 'kg'),
                 g('g', 'Fallbeschleunigung', 'm/s²', 'fest: 9,81'),
                 g('h', 'Höhe', 'm'), g('t', 'Zeit', 's')],
      loese: {
        P: v => v.m! * v.g! * v.h! / v.t!,
        m: v => v.P! * v.t! / (v.g! * v.h!),
        h: v => v.P! * v.t! / (v.m! * v.g!),
        t: v => v.m! * v.g! * v.h! / v.P!
      },
      erklaerung: 'Was ein Aufzug oder eine Winde an Leistung braucht.'
    },

    /* ---- Lichttechnik ---------------------------------------------------- */
    {
      id: 'beleuchtungsstaerke', kapitel: 'licht', schreibweise: 'E = Φ / A',
      groessen: [g('E', 'Beleuchtungsstärke', 'lx'), g('Φ', 'Lichtstrom', 'lm'),
                 g('A', 'Fläche', 'm²')],
      loese: {
        E: v => v['Φ']! / v.A!,
        'Φ': v => v.E! * v.A!,
        A: v => v['Φ']! / v.E!
      },
      erklaerung: 'Wie hell es auf der Fläche wird. Büro etwa 500 lx.'
    },
    {
      id: 'leuchtenzahl', kapitel: 'licht', schreibweise: 'n = E · A · p / (Φ_L · η_B)',
      groessen: [g('n', 'Anzahl Leuchten', ''), g('E', 'Beleuchtungsstärke', 'lx'),
                 g('A', 'Fläche', 'm²'), g('p', 'Planungsfaktor', '', 'Alterung und Schmutz, etwa 1,25'),
                 g('Φ_L', 'Lichtstrom je Leuchte', 'lm'),
                 g('η_B', 'Betriebswirkungsgrad', '')],
      loese: {
        n: v => v.E! * v.A! * v.p! / (v['Φ_L']! * v['η_B']!),
        E: v => v.n! * v['Φ_L']! * v['η_B']! / (v.A! * v.p!),
        A: v => v.n! * v['Φ_L']! * v['η_B']! / (v.E! * v.p!),
        'Φ_L': v => v.E! * v.A! * v.p! / (v.n! * v['η_B']!)
      },
      annahme: 'Der Betriebswirkungsgrad hängt vom Raum ab und wird angenommen.',
      erklaerung: 'Wie viele Leuchten ein Raum braucht — aufgerundet, nie abgerundet.'
    },
    {
      id: 'lichtausbeute', kapitel: 'licht', schreibweise: 'η = Φ_L / P_L',
      groessen: [g('η', 'Lichtausbeute', 'lm/W'), g('Φ_L', 'Lichtstrom', 'lm'),
                 g('P_L', 'Leistung', 'W')],
      loese: {
        'η': v => v['Φ_L']! / v.P_L!,
        'Φ_L': v => v['η']! * v.P_L!,
        P_L: v => v['Φ_L']! / v['η']!
      },
      erklaerung: 'Wie viel Licht je Watt. LED etwa 100 lm/W, Glühlampe etwa 12.'
    },
    {
      id: 'abstandsgesetz', kapitel: 'licht', schreibweise: 'E₂ = E₁ · (r₁ / r₂)²',
      groessen: [g('E₂', 'Beleuchtungsstärke neu', 'lx'), g('E₁', 'Beleuchtungsstärke alt', 'lx'),
                 g('r₁', 'Abstand alt', 'm'), g('r₂', 'Abstand neu', 'm')],
      loese: {
        'E₂': v => v['E₁']! * (v['r₁']! / v['r₂']!) * (v['r₁']! / v['r₂']!),
        'E₁': v => v['E₂']! * (v['r₂']! / v['r₁']!) * (v['r₂']! / v['r₁']!),
        'r₂': v => v['r₁']! * WURZEL(v['E₁']! / v['E₂']!)
      },
      annahme: 'Gilt für eine punktförmige Lichtquelle.',
      erklaerung: 'Doppelter Abstand heisst nur noch ein Viertel Licht.'
    },

    /* ---- Kompensation ---------------------------------------------------- */
    {
      id: 'kompensation-q', kapitel: 'kompen', schreibweise: 'Q_C = P · (tan φ₁ − tan φ₂)',
      groessen: [g('Q_C', 'Kondensatorleistung', 'var'), g('P', 'Wirkleistung', 'W'),
                 g('tanφ₁', 'tan φ vorher', ''), g('tanφ₂', 'tan φ nachher', '')],
      loese: {
        Q_C: v => v.P! * (v['tanφ₁']! - v['tanφ₂']!),
        P: v => v.Q_C! / (v['tanφ₁']! - v['tanφ₂']!)
      },
      erklaerung: 'Wie viel Kondensatorleistung nötig ist, um den cos φ zu verbessern.'
    },
    {
      id: 'kompensation-c', kapitel: 'kompen', schreibweise: 'C = Q_C / (2 · π · f · U²)',
      groessen: [g('C', 'Kapazität', 'F'), g('Q_C', 'Kondensatorleistung', 'var'),
                 g('f', 'Frequenz', 'Hz'), g('U', 'Spannung', 'V')],
      loese: {
        C: v => v.Q_C! / (2 * PI * v.f! * v.U! * v.U!),
        Q_C: v => v.C! * 2 * PI * v.f! * v.U! * v.U!,
        U: v => WURZEL(v.Q_C! / (2 * PI * v.f! * v.C!))
      },
      erklaerung: 'Aus der Blindleistung die Kapazität des Kondensators.'
    }
  ];

  const LISTE: Formel[] = EINGEBAUT.slice();

  const alle = (): Formel[] => LISTE;
  const holen = (id: string): Formel | null => LISTE.find(f => f.id === id) || null;
  const imKapitel = (k: string): Formel[] => LISTE.filter(f => f.kapitel === k);
  const kapitel = (): Array<[string, string, string]> => KAPITEL.slice();
  const kapitelName = (id: string): string =>
    (KAPITEL.find(k => k[0] === id) || [id, id, ''])[1];

  /** Eine eigene Formel anmelden — für spätere Erweiterungen. */
  const melde = (f: Formel): boolean => {
    if (!f || !f.id || LISTE.some(x => x.id === f.id)) return false;
    LISTE.push(f);
    return true;
  };

  /**
   * Suchen — über Zeichen, Namen, Kapitel und Erklärung.
   *
   * Wer „Strom" tippt, will alles finden, wo I vorkommt; wer „cos" tippt,
   * den Leistungsfaktor. Eine Suche nur über den Formelnamen fände beides
   * nicht, denn die Formeln haben gar keine Namen — sie haben Zeichen.
   */
  const suche = (q: string): Formel[] => {
    const s = String(q || '').trim().toLowerCase();
    if (!s) return LISTE;
    return LISTE.filter(f =>
      f.schreibweise.toLowerCase().includes(s) ||
      f.erklaerung.toLowerCase().includes(s) ||
      kapitelName(f.kapitel).toLowerCase().includes(s) ||
      f.groessen.some(x =>
        x.zeichen.toLowerCase().includes(s) ||
        x.name.toLowerCase().includes(s) ||
        (x.was || '').toLowerCase().includes(s)));
  };

  /** Nach welchen Grössen lässt sich diese Formel auflösen? */
  const loesbarNach = (id: string): string[] => {
    const f = holen(id);
    return f ? Object.keys(f.loese) : [];
  };

  /**
   * Rechnen.
   *
   * Gibt IMMER ein Ergebnis-Objekt zurück, nie eine Ausnahme: eine
   * Formelsammlung, die beim Teilen durch null wirft, reisst die Seite mit,
   * auf der sie eingeblendet ist. Was schiefging, steht als Text darin.
   */
  const rechne = (id: string, gesucht: string, werte: Record<string, number>):
      { ok: true; wert: number; einheit: string; weg: string[] } |
      { ok: false; fehler: string } => {
    const f = holen(id);
    if (!f) return { ok: false, fehler: 'Diese Formel gibt es nicht.' };
    const auf = f.loese[gesucht];
    if (!auf) return { ok: false, fehler:
      `Nach ${gesucht} lässt sich diese Formel nicht auflösen. Möglich: ` +
      Object.keys(f.loese).join(', ') + '.' };

    /* Erst nachsehen, ob alles da ist — sonst rechnet man mit undefined
       und bekommt NaN, ohne zu wissen, welche Zahl fehlte. */
    const gebraucht = f.groessen.map(x => x.zeichen).filter(x => x !== gesucht);
    const fehlend = gebraucht.filter(x =>
      werte[x] === undefined || werte[x] === null || !isFinite(Number(werte[x])));
    if (fehlend.length) return { ok: false, fehler:
      'Es fehlt noch: ' + fehlend.join(', ') + '.' };

    const zahlen: Record<string, number> = {};
    Object.keys(werte).forEach(k => { zahlen[k] = Number(werte[k]); });
    let wert: number;
    try { wert = auf(zahlen); }
    catch { return { ok: false, fehler: 'Das lässt sich mit diesen Werten nicht rechnen.' }; }

    if (!isFinite(wert)) return { ok: false, fehler:
      'Das ergibt keine Zahl — vermutlich wird durch null geteilt.' };

    const einheit = (f.groessen.find(x => x.zeichen === gesucht) || { einheit: '' }).einheit;
    const weg = f.weg && f.weg[gesucht]
      ? f.weg[gesucht]!(zahlen, Math.round(wert * 10000) / 10000)
      : [f.schreibweise, `${gesucht} = ${Math.round(wert * 10000) / 10000} ${einheit}`.trim()];
    return { ok: true, wert, einheit, weg };
  };

  return { KAPITEL, alle, holen, imKapitel, kapitel, kapitelName, suche,
           loesbarNach, rechne, melde };
})();
