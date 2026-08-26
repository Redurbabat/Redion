"use strict";
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
window.Register = window.Register || {};
Register.elektroformeln = (() => {
    const KAPITEL = [
        ['grund', 'Grundformeln', 'Ω'],
        ['reihe', 'Reihenschaltung', '⎓'],
        ['parallel', 'Parallelschaltung', '⑂'],
        ['leistung', 'Leistung und Energie', 'W'],
        ['leiter', 'Leiter und Widerstand', '▬'],
        ['waerme', 'Elektrowärme', '🌡'],
        ['quelle', 'Spannungsquellen', '⎔'],
        ['konden', 'Kondensator', '⊣⊢'],
        ['wechsel', 'Wechselstrom', '∿'],
        ['dreh', 'Drehstrom', '⌇'],
        ['trafo', 'Transformator', '⊙'],
        ['motor', 'Motor', 'M'],
        ['licht', 'Lichttechnik', '☀'],
        ['kompen', 'Kompensation', 'φ'],
        ['messen', 'Messtechnik', '⊕'],
        ['magnet', 'Magnetische Grössen', '🧲'],
        ['fall', 'Spannungsfall', '↘'],
        ['antenne', 'Antenne und Pegel', '📡']
    ];
    /* Hilfen, damit die Liste lesbar bleibt. */
    const g = (zeichen, name, einheit, was) => was === undefined ? { zeichen, name, einheit } : { zeichen, name, einheit, was };
    const WURZEL = Math.sqrt;
    const PI = Math.PI;
    const EINGEBAUT = [
        /* ---- Grundformeln ---------------------------------------------------- */
        {
            id: 'ohm', kapitel: 'grund', schreibweise: 'U = R · I',
            groessen: [g('U', 'Spannung', 'V', 'Wie stark die Ladung getrieben wird'),
                g('R', 'Widerstand', 'Ω', 'Wie sehr sich der Leiter wehrt'),
                g('I', 'Strom', 'A', 'Wie viel Ladung je Sekunde fliesst')],
            loese: {
                U: v => v.R * v.I,
                R: v => v.U / v.I,
                I: v => v.U / v.R
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
            loese: { P: v => v.U * v.I, U: v => v.P / v.I, I: v => v.P / v.U },
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
            loese: { P: v => (v.U * v.U) / v.R, U: v => WURZEL(v.P * v.R), R: v => (v.U * v.U) / v.P },
            erklaerung: 'Wenn der Strom unbekannt ist, aber Spannung und Widerstand da sind.'
        },
        {
            id: 'leistung-ir', kapitel: 'leistung', schreibweise: 'P = I² · R',
            groessen: [g('P', 'Leistung', 'W'), g('I', 'Strom', 'A'), g('R', 'Widerstand', 'Ω')],
            loese: { P: v => v.I * v.I * v.R, I: v => WURZEL(v.P / v.R), R: v => v.P / (v.I * v.I) },
            erklaerung: 'Die Verlustleistung in einer Leitung — sie wächst im QUADRAT mit dem Strom.'
        },
        {
            id: 'arbeit', kapitel: 'leistung', schreibweise: 'W = P · t',
            groessen: [g('W', 'Arbeit', 'Wh'), g('P', 'Leistung', 'W'), g('t', 'Zeit', 'h')],
            loese: { W: v => v.P * v.t, P: v => v.W / v.t, t: v => v.W / v.P },
            erklaerung: 'Was über die Zeit zusammenkommt. Der Zähler misst genau das.'
        },
        {
            id: 'kosten', kapitel: 'leistung', schreibweise: 'K = k · W',
            groessen: [g('K', 'Kosten', 'CHF'), g('k', 'Preis je kWh', 'CHF/kWh'),
                g('W', 'Energie', 'kWh')],
            loese: { K: v => v.k * v.W, k: v => v.K / v.W, W: v => v.K / v.k },
            erklaerung: 'Was der Verbrauch kostet.'
        },
        /* ---- Messtechnik (Kapitel 4 des Heftes) ------------------------------
           Die Messbereicherweiterung ist das Stück Messtechnik, das man im
           Beruf wirklich rechnet: ein Messwerk verträgt Milliampere, gemessen
           werden sollen Ampere. Der Rest ist Ohm. */
        {
            id: 'mess-vorwiderstand', kapitel: 'messen', schreibweise: 'R_V = (n − 1) · R_m',
            groessen: [g('R_V', 'Vorwiderstand', 'Ω', 'Kommt VOR das Messwerk, in Reihe'),
                g('n', 'Faktor der Messbereicherweiterung', '', 'Wie oft grösser der neue Bereich ist'),
                g('R_m', 'Messwerkwiderstand', 'Ω')],
            loese: {
                R_V: v => (v.n - 1) * v.R_m,
                n: v => v.R_V / v.R_m + 1,
                R_m: v => v.R_V / (v.n - 1)
            },
            weg: {
                R_V: (v, e) => [`R_V = (n − 1) · R_m`,
                    `R_V = (${v.n} − 1) · ${v.R_m} Ω`, `R_V = ${e} Ω`]
            },
            erklaerung: 'Ein Voltmeter misst mehr, wenn ein Widerstand in Reihe davor liegt. ' +
                'Der Rest der Spannung fällt an ihm ab.'
        },
        {
            id: 'mess-vorwiderstand-u', kapitel: 'messen',
            schreibweise: 'R_V = R_m · (U − U_m) / U_m',
            groessen: [g('R_V', 'Vorwiderstand', 'Ω'), g('R_m', 'Messwerkwiderstand', 'Ω'),
                g('U', 'erweiterter Messbereich', 'V'),
                g('U_m', 'Messwerkspannung bei Vollausschlag', 'V')],
            loese: {
                R_V: v => v.R_m * (v.U - v.U_m) / v.U_m,
                R_m: v => v.R_V * v.U_m / (v.U - v.U_m),
                U: v => v.U_m * (1 + v.R_V / v.R_m),
                U_m: v => v.U / (1 + v.R_V / v.R_m)
            },
            erklaerung: 'Dieselbe Sache aus den Spannungen statt aus dem Faktor.'
        },
        {
            id: 'mess-faktor-v', kapitel: 'messen', schreibweise: 'n = U / U_m',
            groessen: [g('n', 'Faktor der Messbereicherweiterung', ''),
                g('U', 'erweiterter Messbereich', 'V'),
                g('U_m', 'Messwerkspannung bei Vollausschlag', 'V')],
            loese: { n: v => v.U / v.U_m, U: v => v.n * v.U_m, U_m: v => v.U / v.n },
            erklaerung: 'Um wie viel der Bereich wächst.'
        },
        {
            id: 'mess-shunt', kapitel: 'messen', schreibweise: 'R_p = R_m / (n − 1)',
            groessen: [g('R_p', 'Parallelwiderstand (Shunt)', 'Ω', 'Liegt PARALLEL zum Messwerk'),
                g('R_m', 'Messwerkwiderstand', 'Ω'),
                g('n', 'Faktor der Messbereicherweiterung', '')],
            loese: {
                R_p: v => v.R_m / (v.n - 1),
                R_m: v => v.R_p * (v.n - 1),
                n: v => v.R_m / v.R_p + 1
            },
            weg: {
                R_p: (v, e) => [`R_p = R_m ÷ (n − 1)`,
                    `R_p = ${v.R_m} Ω ÷ (${v.n} − 1)`, `R_p = ${e} Ω`]
            },
            erklaerung: 'Ein Amperemeter misst mehr, wenn ein Widerstand PARALLEL liegt. ' +
                'Der Rest des Stroms geht an ihm vorbei — der Shunt.'
        },
        {
            id: 'mess-shunt-i', kapitel: 'messen',
            schreibweise: 'R_p = R_m · I_m / (I − I_m)',
            groessen: [g('R_p', 'Parallelwiderstand (Shunt)', 'Ω'),
                g('R_m', 'Messwerkwiderstand', 'Ω'),
                g('I_m', 'Messwerkstromstärke bei Vollausschlag', 'A'),
                g('I', 'erweiterter Messbereich', 'A')],
            loese: {
                R_p: v => v.R_m * v.I_m / (v.I - v.I_m),
                R_m: v => v.R_p * (v.I - v.I_m) / v.I_m,
                I: v => v.I_m * (1 + v.R_m / v.R_p),
                I_m: v => v.I / (1 + v.R_m / v.R_p)
            },
            erklaerung: 'Derselbe Shunt aus den Strömen statt aus dem Faktor.'
        },
        {
            id: 'mess-faktor-a', kapitel: 'messen', schreibweise: 'n = I / I_m',
            groessen: [g('n', 'Faktor der Messbereicherweiterung', ''),
                g('I', 'erweiterter Messbereich', 'A'),
                g('I_m', 'Messwerkstromstärke bei Vollausschlag', 'A')],
            loese: { n: v => v.I / v.I_m, I: v => v.n * v.I_m, I_m: v => v.I / v.n },
            erklaerung: 'Um wie viel der Strombereich wächst.'
        },
        {
            id: 'mess-spannungsfehler', kapitel: 'messen', schreibweise: 'R = U / I − R_A',
            groessen: [g('R', 'Verbraucherwiderstand', 'Ω'), g('U', 'gemessene Spannung', 'V'),
                g('I', 'gemessene Stromstärke', 'A'),
                g('R_A', 'Innenwiderstand des A-Meters', 'Ω')],
            loese: {
                R: v => v.U / v.I - v.R_A,
                U: v => (v.R + v.R_A) * v.I,
                I: v => v.U / (v.R + v.R_A),
                R_A: v => v.U / v.I - v.R
            },
            annahme: 'Spannungsfehlerschaltung: das Voltmeter misst über Verbraucher UND ' +
                'Amperemeter. Geeignet für HOCHOHMIGE Verbraucher — dort fällt am A-Meter kaum etwas ab.',
            erklaerung: 'Das Amperemeter liegt im Messkreis und hat selbst einen Widerstand. ' +
                'Wer ihn nicht abzieht, misst den Verbraucher zu gross.'
        },
        {
            id: 'mess-stromfehler', kapitel: 'messen', schreibweise: 'R = U / (I − I_V)',
            groessen: [g('R', 'Verbraucherwiderstand', 'Ω'), g('U', 'gemessene Spannung', 'V'),
                g('I', 'gemessene Stromstärke', 'A'),
                g('I_V', 'Strom durch das V-Meter', 'A')],
            loese: {
                R: v => v.U / (v.I - v.I_V),
                U: v => v.R * (v.I - v.I_V),
                I: v => v.U / v.R + v.I_V,
                I_V: v => v.I - v.U / v.R
            },
            annahme: 'Stromfehlerschaltung: das Amperemeter misst den Strom durch Verbraucher ' +
                'UND Voltmeter. Geeignet für NIEDEROHMIGE Verbraucher.',
            erklaerung: 'Das Voltmeter zieht selbst Strom. Wer ihn nicht abzieht, misst den ' +
                'Verbraucherwiderstand zu klein.'
        },
        {
            id: 'mess-vmeter-strom', kapitel: 'messen', schreibweise: 'I_V = U / R_V',
            groessen: [g('I_V', 'Strom durch das V-Meter', 'A'), g('U', 'gemessene Spannung', 'V'),
                g('R_V', 'Innenwiderstand des V-Meters', 'Ω')],
            loese: { I_V: v => v.U / v.R_V, U: v => v.I_V * v.R_V, R_V: v => v.U / v.I_V },
            erklaerung: 'Was das Voltmeter selbst zieht — der Fehler der Stromfehlerschaltung.'
        },
        {
            id: 'mess-anzeigefehler', kapitel: 'messen', schreibweise: 'AF_abs = MB · k / 100',
            groessen: [g('AF_abs', 'absoluter Anzeigefehler', '', 'In der Einheit des Messwerts'),
                g('MB', 'Messbereich (Skalenendwert)', ''),
                g('k', 'Genauigkeitsklasse', '', 'Steht auf dem Gerät: 1,5 heisst 1,5 %')],
            loese: {
                AF_abs: v => v.MB * v.k / 100,
                MB: v => v.AF_abs * 100 / v.k,
                k: v => v.AF_abs * 100 / v.MB
            },
            erklaerung: 'Der absolute Anzeigefehler ist über die GANZE Skala gleich gross — ' +
                'er hängt am Messbereich, nicht am Messwert.'
        },
        {
            id: 'mess-anzeigefehler-prozent', kapitel: 'messen',
            schreibweise: 'AF_% = MB · k / MW',
            groessen: [g('AF_%', 'relativer Anzeigefehler', '%'),
                g('MB', 'Messbereich (Skalenendwert)', ''),
                g('k', 'Genauigkeitsklasse', ''),
                g('MW', 'Messwert', '')],
            loese: {
                'AF_%': v => v.MB * v.k / v.MW,
                MB: v => v['AF_%'] * v.MW / v.k,
                k: v => v['AF_%'] * v.MW / v.MB,
                MW: v => v.MB * v.k / v['AF_%']
            },
            erklaerung: 'Der relative Fehler ist im UNTEREN Teil der Skala am grössten. ' +
                'Deshalb misst man möglichst im oberen Drittel des Bereichs.'
        },
        {
            id: 'mess-innenwiderstand', kapitel: 'messen', schreibweise: 'R_m = MB · r_k',
            groessen: [g('R_m', 'Innenwiderstand des V-Meters', 'Ω'),
                g('MB', 'Messbereich', 'V'),
                g('r_k', 'Kennwiderstand', 'Ω/V', 'Steht auf dem Gerät, z. B. 5 kΩ/V')],
            loese: { R_m: v => v.MB * v.r_k, MB: v => v.R_m / v.r_k, r_k: v => v.R_m / v.MB },
            erklaerung: 'Wie hochohmig ein analoges Voltmeter im gewählten Bereich ist.'
        },
        /* ---- Magnetische Grössen (Kapitel 9 des Heftes) ---------------------- */
        {
            id: 'magnet-durchflutung', kapitel: 'magnet', schreibweise: 'Θ = I · N',
            groessen: [g('Θ', 'Durchflutung', 'A'), g('I', 'Strom', 'A'),
                g('N', 'Windungszahl', '')],
            loese: { 'Θ': v => v.I * v.N, I: v => v['Θ'] / v.N, N: v => v['Θ'] / v.I },
            erklaerung: 'Was das Magnetfeld antreibt. Zehn Windungen mit einem Ampere ' +
                'wirken wie eine Windung mit zehn.'
        },
        {
            id: 'magnet-feldstaerke', kapitel: 'magnet', schreibweise: 'H = I · N / l_m',
            groessen: [g('H', 'Feldstärke', 'A/m'), g('I', 'Strom', 'A'),
                g('N', 'Windungszahl', ''),
                g('l_m', 'mittlere Feldlinienlänge', 'm')],
            loese: {
                H: v => v.I * v.N / v.l_m,
                I: v => v.H * v.l_m / v.N,
                N: v => v.H * v.l_m / v.I,
                l_m: v => v.I * v.N / v.H
            },
            erklaerung: 'Die Durchflutung auf die Länge verteilt.'
        },
        {
            id: 'magnet-flussdichte', kapitel: 'magnet', schreibweise: 'B = μ₀ · μ_r · H',
            groessen: [g('B', 'Flussdichte', 'T', 'Tesla — 1 T = 1 Vs/m²'),
                g('μ_r', 'relative Permeabilität', '', 'Luft ≈ 1, Eisen bis mehrere tausend'),
                g('H', 'Feldstärke', 'A/m')],
            loese: {
                B: v => 1.257e-6 * v['μ_r'] * v.H,
                'μ_r': v => v.B / (1.257e-6 * v.H),
                H: v => v.B / (1.257e-6 * v['μ_r'])
            },
            annahme: 'Mit der Feldkonstanten μ₀ = 1,257 · 10⁻⁶ Vs/Am.',
            erklaerung: 'Wie dicht das Feld im Material wird. Eisen bündelt es tausendfach.'
        },
        {
            id: 'magnet-fluss', kapitel: 'magnet', schreibweise: 'Φ = B · A',
            groessen: [g('Φ', 'magnetischer Fluss', 'Wb', 'Weber — 1 Wb = 1 Vs'),
                g('B', 'Flussdichte', 'T'), g('A', 'Polfläche', 'm²')],
            loese: { 'Φ': v => v.B * v.A, B: v => v['Φ'] / v.A, A: v => v['Φ'] / v.B },
            erklaerung: 'Der ganze Fluss durch die Fläche.'
        },
        {
            id: 'magnet-widerstand', kapitel: 'magnet',
            schreibweise: 'R_m = l_m / (μ₀ · μ_r · A)',
            groessen: [g('R_m', 'magnetischer Widerstand', 'A/Vs'),
                g('l_m', 'mittlere Feldlinienlänge', 'm'),
                g('μ_r', 'relative Permeabilität', ''),
                g('A', 'Polfläche', 'm²')],
            loese: {
                R_m: v => v.l_m / (1.257e-6 * v['μ_r'] * v.A),
                l_m: v => v.R_m * 1.257e-6 * v['μ_r'] * v.A,
                'μ_r': v => v.l_m / (1.257e-6 * v.R_m * v.A),
                A: v => v.l_m / (1.257e-6 * v['μ_r'] * v.R_m)
            },
            annahme: 'Mit der Feldkonstanten μ₀ = 1,257 · 10⁻⁶ Vs/Am.',
            erklaerung: 'Das Gegenstück zum elektrischen Widerstand: derselbe Bau, ' +
                'Länge durch Leitfähigkeit mal Fläche.'
        },
        {
            id: 'magnet-selbstinduktion', kapitel: 'magnet', schreibweise: 'u_i = L · ΔI / Δt',
            groessen: [g('u_i', 'Selbstinduktionsspannung', 'V', 'Ihr Vorzeichen ist negativ — sie wirkt entgegen'),
                g('L', 'Induktivität', 'H'),
                g('ΔI', 'Stromänderung', 'A'),
                g('Δt', 'Zeitspanne', 's')],
            loese: {
                u_i: v => v.L * v['ΔI'] / v['Δt'],
                L: v => v.u_i * v['Δt'] / v['ΔI'],
                'ΔI': v => v.u_i * v['Δt'] / v.L,
                'Δt': v => v.L * v['ΔI'] / v.u_i
            },
            annahme: 'Der Betrag. Das Minuszeichen der Lenzschen Regel sagt die RICHTUNG: ' +
                'die Spannung wirkt der Änderung entgegen.',
            erklaerung: 'Warum eine Spule beim Ausschalten Funken zieht — und warum eine ' +
                'Freilaufdiode danebengehört.'
        },
        /* ---- Spannungsfall und Leistungsverlust (Kapitel 15 des Heftes) ------
           DER ENTSCHEIDENDE PUNKT STEHT IN DEN FORMELN, NICHT DANEBEN: bei
           Gleich- und Wechselstrom zählt die Leitung ZWEIMAL — hin und zurück.
           Bei Drehstrom nur einmal. Wer das verwechselt, rechnet den halben oder
           den doppelten Spannungsfall. */
        {
            id: 'fall-leitungswiderstand', kapitel: 'fall',
            schreibweise: 'R_Ltg = ρ · 2 · l / A',
            groessen: [g('R_Ltg', 'Leitungswiderstand', 'Ω', 'Hin- UND Rückleiter zusammen'),
                g('ρ', 'spezifischer Widerstand', 'Ω·mm²/m', 'Kupfer 0,0175'),
                g('l', 'Leitungslänge', 'm', 'Einfache Länge — die 2 steht schon in der Formel'),
                g('A', 'Leiterquerschnitt', 'mm²')],
            loese: {
                R_Ltg: v => v['ρ'] * 2 * v.l / v.A,
                'ρ': v => v.R_Ltg * v.A / (2 * v.l),
                l: v => v.R_Ltg * v.A / (2 * v['ρ']),
                A: v => v['ρ'] * 2 * v.l / v.R_Ltg
            },
            weg: {
                R_Ltg: (v, e) => [`R_Ltg = ρ · 2 · l ÷ A`,
                    `R_Ltg = ${v['ρ']} · 2 · ${v.l} m ÷ ${v.A} mm²`,
                    `R_Ltg = ${e} Ω`],
                A: (v, e) => [`A = ρ · 2 · l ÷ R_Ltg`,
                    `A = ${v['ρ']} · 2 · ${v.l} m ÷ ${v.R_Ltg} Ω`,
                    `A = ${e} mm²`]
            },
            annahme: 'Für Gleichstrom und einphasigen Wechselstrom. Bei Drehstrom zählt die ' +
                'Länge nur EINFACH — dafür gibt es die eigene Formel.',
            erklaerung: 'Der Strom muss hin und zurück. Deshalb die 2 — der häufigste Fehler ' +
                'beim Querschnitt ist, sie zu vergessen.'
        },
        {
            id: 'fall-leitungswiderstand-dreh', kapitel: 'fall',
            schreibweise: 'R_Ltg = ρ · l / A',
            groessen: [g('R_Ltg', 'Leitungswiderstand', 'Ω', 'Je Aussenleiter'),
                g('ρ', 'spezifischer Widerstand', 'Ω·mm²/m'),
                g('l', 'Leitungslänge', 'm'),
                g('A', 'Leiterquerschnitt', 'mm²')],
            loese: {
                R_Ltg: v => v['ρ'] * v.l / v.A,
                'ρ': v => v.R_Ltg * v.A / v.l,
                l: v => v.R_Ltg * v.A / v['ρ'],
                A: v => v['ρ'] * v.l / v.R_Ltg
            },
            annahme: 'Für Drehstrom. Bei symmetrischer Last fliesst über den Neutralleiter ' +
                'nichts zurück — deshalb zählt die Länge nur einfach.',
            erklaerung: 'Beim Drehstrom gibt es keinen Rückleiter im selben Sinn.'
        },
        {
            id: 'fall-gleich', kapitel: 'fall', schreibweise: 'ΔU = I · R_Ltg',
            groessen: [g('ΔU', 'Spannungsfall', 'V'), g('I', 'Strom', 'A'),
                g('R_Ltg', 'Leitungswiderstand', 'Ω')],
            loese: {
                'ΔU': v => v.I * v.R_Ltg,
                I: v => v['ΔU'] / v.R_Ltg,
                R_Ltg: v => v['ΔU'] / v.I
            },
            annahme: 'Gleichstrom, oder Wechselstrom mit rein ohmscher Last.',
            erklaerung: 'Ohm auf der Leitung. Was hier verlorengeht, kommt beim Verbraucher nicht an.'
        },
        {
            id: 'fall-wechsel', kapitel: 'fall', schreibweise: 'ΔU = I · R_Ltg · cos φ',
            groessen: [g('ΔU', 'Spannungsfall', 'V'), g('I', 'Strom', 'A'),
                g('R_Ltg', 'Leitungswiderstand', 'Ω'),
                g('cosφ', 'Leistungsfaktor', '')],
            loese: {
                'ΔU': v => v.I * v.R_Ltg * v['cosφ'],
                I: v => v['ΔU'] / (v.R_Ltg * v['cosφ']),
                R_Ltg: v => v['ΔU'] / (v.I * v['cosφ']),
                'cosφ': v => v['ΔU'] / (v.I * v.R_Ltg)
            },
            erklaerung: 'Beim Wechselstrom zählt nur der Wirkanteil des Stroms für den ' +
                'ohmschen Spannungsfall.'
        },
        {
            id: 'fall-dreh', kapitel: 'fall', schreibweise: 'ΔU = √3 · I · R_Ltg · cos φ',
            groessen: [g('ΔU', 'Spannungsfall', 'V', 'Zwischen den Aussenleitern'),
                g('I', 'Strom', 'A'), g('R_Ltg', 'Leitungswiderstand', 'Ω'),
                g('cosφ', 'Leistungsfaktor', '')],
            loese: {
                'ΔU': v => WURZEL(3) * v.I * v.R_Ltg * v['cosφ'],
                I: v => v['ΔU'] / (WURZEL(3) * v.R_Ltg * v['cosφ']),
                R_Ltg: v => v['ΔU'] / (WURZEL(3) * v.I * v['cosφ']),
                'cosφ': v => v['ΔU'] / (WURZEL(3) * v.I * v.R_Ltg)
            },
            erklaerung: 'Der Spannungsfall zwischen zwei Aussenleitern — daher die Wurzel aus 3.'
        },
        {
            id: 'fall-prozent', kapitel: 'fall', schreibweise: 'Δu = ΔU / U · 100 %',
            groessen: [g('Δu', 'Spannungsfall prozentual', '%'),
                g('ΔU', 'Spannungsfall', 'V'),
                g('U', 'Netzspannung', 'V')],
            loese: {
                'Δu': v => v['ΔU'] / v.U * 100,
                'ΔU': v => v['Δu'] * v.U / 100,
                U: v => v['ΔU'] * 100 / v['Δu']
            },
            erklaerung: 'Die Zahl, nach der die Installation beurteilt wird — nicht die Volt, ' +
                'sondern ihr Anteil an der Netzspannung.'
        },
        {
            id: 'fall-verlust', kapitel: 'fall', schreibweise: 'P_V = I² · R_Ltg',
            groessen: [g('P_V', 'Verlustleistung der Leitung', 'W'),
                g('I', 'Strom', 'A'), g('R_Ltg', 'Leitungswiderstand', 'Ω')],
            loese: {
                P_V: v => v.I * v.I * v.R_Ltg,
                I: v => WURZEL(v.P_V / v.R_Ltg),
                R_Ltg: v => v.P_V / (v.I * v.I)
            },
            erklaerung: 'Die Leitung wird warm. Doppelter Strom heisst VIERFACHER Verlust.'
        },
        {
            id: 'fall-verlust-dreh', kapitel: 'fall', schreibweise: 'P_V = 3 · I² · R_Ltg',
            groessen: [g('P_V', 'Verlustleistung der Leitung', 'W'),
                g('I', 'Strom je Aussenleiter', 'A'),
                g('R_Ltg', 'Leitungswiderstand je Aussenleiter', 'Ω')],
            loese: {
                P_V: v => 3 * v.I * v.I * v.R_Ltg,
                I: v => WURZEL(v.P_V / (3 * v.R_Ltg)),
                R_Ltg: v => v.P_V / (3 * v.I * v.I)
            },
            erklaerung: 'Drei Aussenleiter, jeder mit seinem Verlust.'
        },
        {
            id: 'fall-verlust-prozent', kapitel: 'fall',
            schreibweise: 'P_V% = P_V / P · 100 %',
            groessen: [g('P_V%', 'Verlustleistung prozentual', '%'),
                g('P_V', 'Verlustleistung der Leitung', 'W'),
                g('P', 'Nennleistung des Verbrauchers', 'W')],
            loese: {
                'P_V%': v => v.P_V / v.P * 100,
                P_V: v => v['P_V%'] * v.P / 100,
                P: v => v.P_V * 100 / v['P_V%']
            },
            erklaerung: 'Wie viel von der Leistung unterwegs verlorengeht.'
        },
        {
            id: 'wirkungsgrad', kapitel: 'leistung', schreibweise: 'η = P_ab / P_zu',
            groessen: [g('η', 'Wirkungsgrad', '', 'Zwischen 0 und 1 — mal 100 gibt Prozent'),
                g('P_ab', 'abgegebene Leistung', 'W'),
                g('P_zu', 'zugeführte Leistung', 'W')],
            loese: {
                'η': v => v.P_ab / v.P_zu,
                P_ab: v => v['η'] * v.P_zu,
                P_zu: v => v.P_ab / v['η']
            },
            erklaerung: 'Was hinten herauskommt, geteilt durch das, was vorn hineingeht. Nie über 1.'
        },
        /* ---- Reihenschaltung ------------------------------------------------- */
        {
            id: 'reihe-r', kapitel: 'reihe', schreibweise: 'R = R₁ + R₂ + … + Rₙ',
            groessen: [g('R', 'Gesamtwiderstand', 'Ω'), g('R₁', 'Widerstand 1', 'Ω'),
                g('R₂', 'Widerstand 2', 'Ω')],
            loese: {
                R: v => v['R₁'] + v['R₂'],
                'R₁': v => v.R - v['R₂'],
                'R₂': v => v.R - v['R₁']
            },
            weg: { R: (v, e) => [`R = R₁ + R₂`, `R = ${v['R₁']} Ω + ${v['R₂']} Ω`, `R = ${e} Ω`] },
            erklaerung: 'In Reihe addieren sich die Widerstände. Der Strom ist überall gleich.'
        },
        {
            id: 'reihe-teiler', kapitel: 'reihe', schreibweise: 'U₁ / U₂ = R₁ / R₂',
            groessen: [g('U₁', 'Teilspannung 1', 'V'), g('U₂', 'Teilspannung 2', 'V'),
                g('R₁', 'Widerstand 1', 'Ω'), g('R₂', 'Widerstand 2', 'Ω')],
            loese: {
                'U₁': v => v['U₂'] * v['R₁'] / v['R₂'],
                'U₂': v => v['U₁'] * v['R₂'] / v['R₁'],
                'R₁': v => v['R₂'] * v['U₁'] / v['U₂'],
                'R₂': v => v['R₁'] * v['U₂'] / v['U₁']
            },
            erklaerung: 'Die Spannungen verhalten sich wie die Widerstände — der Spannungsteiler.'
        },
        {
            id: 'spannungsteiler', kapitel: 'reihe', schreibweise: 'U₂ = U · R₂ / (R₁ + R₂)',
            groessen: [g('U₂', 'Teilspannung', 'V'), g('U', 'Gesamtspannung', 'V'),
                g('R₁', 'Widerstand 1', 'Ω'), g('R₂', 'Widerstand 2', 'Ω')],
            loese: {
                'U₂': v => v.U * v['R₂'] / (v['R₁'] + v['R₂']),
                U: v => v['U₂'] * (v['R₁'] + v['R₂']) / v['R₂'],
                'R₂': v => v['R₁'] * v['U₂'] / (v.U - v['U₂']),
                'R₁': v => v['R₂'] * (v.U - v['U₂']) / v['U₂']
            },
            weg: {
                'U₂': (v, e) => [`U₂ = U · R₂ ÷ (R₁ + R₂)`,
                    `U₂ = ${v.U} V · ${v['R₂']} Ω ÷ (${v['R₁']} Ω + ${v['R₂']} Ω)`,
                    `U₂ = ${v.U} V · ${v['R₂']} ÷ ${v['R₁'] + v['R₂']}`,
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
                R: v => (v['R₁'] * v['R₂']) / (v['R₁'] + v['R₂']),
                'R₁': v => (v.R * v['R₂']) / (v['R₂'] - v.R),
                'R₂': v => (v.R * v['R₁']) / (v['R₁'] - v.R)
            },
            weg: {
                R: (v, e) => [`R = (R₁ · R₂) ÷ (R₁ + R₂)`,
                    `R = (${v['R₁']} · ${v['R₂']}) ÷ (${v['R₁']} + ${v['R₂']})`,
                    `R = ${v['R₁'] * v['R₂']} ÷ ${v['R₁'] + v['R₂']}`,
                    `R = ${e} Ω`]
            },
            erklaerung: 'Die Faustformel für ZWEI parallele Widerstände. Für mehr gilt die Kehrwertformel.'
        },
        {
            id: 'parallel-i', kapitel: 'parallel', schreibweise: 'I = I₁ + I₂ + … + Iₙ',
            groessen: [g('I', 'Gesamtstrom', 'A'), g('I₁', 'Teilstrom 1', 'A'), g('I₂', 'Teilstrom 2', 'A')],
            loese: {
                I: v => v['I₁'] + v['I₂'],
                'I₁': v => v.I - v['I₂'],
                'I₂': v => v.I - v['I₁']
            },
            erklaerung: 'Parallel addieren sich die Ströme. Die Spannung ist überall gleich.'
        },
        {
            id: 'stromteiler', kapitel: 'parallel', schreibweise: 'I₁ / I₂ = R₂ / R₁',
            groessen: [g('I₁', 'Teilstrom 1', 'A'), g('I₂', 'Teilstrom 2', 'A'),
                g('R₁', 'Widerstand 1', 'Ω'), g('R₂', 'Widerstand 2', 'Ω')],
            loese: {
                'I₁': v => v['I₂'] * v['R₂'] / v['R₁'],
                'I₂': v => v['I₁'] * v['R₁'] / v['R₂'],
                'R₁': v => v['R₂'] * v['I₂'] / v['I₁'],
                'R₂': v => v['R₁'] * v['I₁'] / v['I₂']
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
                R: v => v['ρ'] * v.l / v.A,
                'ρ': v => v.R * v.A / v.l,
                l: v => v.R * v.A / v['ρ'],
                A: v => v['ρ'] * v.l / v.R
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
                'R₉': v => v['R₂₀'] * (1 + v['α'] * v['Δϑ']),
                'R₂₀': v => v['R₉'] / (1 + v['α'] * v['Δϑ']),
                'Δϑ': v => (v['R₉'] / v['R₂₀'] - 1) / v['α'],
                'α': v => (v['R₉'] / v['R₂₀'] - 1) / v['Δϑ']
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
                Q: v => v.m * v.c * v['Δϑ'],
                m: v => v.Q / (v.c * v['Δϑ']),
                c: v => v.Q / (v.m * v['Δϑ']),
                'Δϑ': v => v.Q / (v.m * v.c)
            },
            erklaerung: 'Was es kostet, etwas zu erwärmen — unabhängig davon, womit.'
        },
        {
            id: 'waerme-elektrisch', kapitel: 'waerme', schreibweise: 'P · t · η = m · c · Δϑ',
            groessen: [g('P', 'Leistung', 'W'), g('t', 'Zeit', 's'), g('η', 'Wirkungsgrad', ''),
                g('m', 'Masse', 'kg'), g('c', 'Wärmekapazität', 'J/(kg·K)'),
                g('Δϑ', 'Temperaturänderung', 'K')],
            loese: {
                t: v => (v.m * v.c * v['Δϑ']) / (v.P * v['η']),
                P: v => (v.m * v.c * v['Δϑ']) / (v.t * v['η']),
                'Δϑ': v => (v.P * v.t * v['η']) / (v.m * v.c),
                m: v => (v.P * v.t * v['η']) / (v.c * v['Δϑ']),
                'η': v => (v.m * v.c * v['Δϑ']) / (v.P * v.t),
                c: v => (v.P * v.t * v['η']) / (v.m * v['Δϑ'])
            },
            erklaerung: 'Der Boiler: elektrische Energie mal Wirkungsgrad ergibt die Wärme im Wasser.'
        },
        /* ---- Spannungsquellen ------------------------------------------------ */
        {
            id: 'klemmenspannung', kapitel: 'quelle', schreibweise: 'U = U₀ − Rᵢ · I',
            groessen: [g('U', 'Klemmenspannung', 'V'), g('U₀', 'Leerlaufspannung', 'V'),
                g('Rᵢ', 'Innenwiderstand', 'Ω'), g('I', 'Strom', 'A')],
            loese: {
                U: v => v['U₀'] - v['Rᵢ'] * v.I,
                'U₀': v => v.U + v['Rᵢ'] * v.I,
                'Rᵢ': v => (v['U₀'] - v.U) / v.I,
                I: v => (v['U₀'] - v.U) / v['Rᵢ']
            },
            erklaerung: 'Unter Last bricht die Spannung ein — um genau den Anteil am Innenwiderstand.'
        },
        {
            id: 'quellstrom', kapitel: 'quelle', schreibweise: 'I = U₀ / (Rᵢ + R_L)',
            groessen: [g('I', 'Strom', 'A'), g('U₀', 'Leerlaufspannung', 'V'),
                g('Rᵢ', 'Innenwiderstand', 'Ω'), g('R_L', 'Lastwiderstand', 'Ω')],
            loese: {
                I: v => v['U₀'] / (v['Rᵢ'] + v.R_L),
                'U₀': v => v.I * (v['Rᵢ'] + v.R_L),
                R_L: v => v['U₀'] / v.I - v['Rᵢ'],
                'Rᵢ': v => v['U₀'] / v.I - v.R_L
            },
            erklaerung: 'Der Strom im geschlossenen Kreis, mit dem Innenwiderstand in Reihe.'
        },
        /* ---- Kondensator ----------------------------------------------------- */
        {
            id: 'kondensator-parallel', kapitel: 'konden', schreibweise: 'C = C₁ + C₂ + … + Cₙ',
            groessen: [g('C', 'Gesamtkapazität', 'µF'), g('C₁', 'Kapazität 1', 'µF'),
                g('C₂', 'Kapazität 2', 'µF')],
            loese: {
                C: v => v['C₁'] + v['C₂'],
                'C₁': v => v.C - v['C₂'],
                'C₂': v => v.C - v['C₁']
            },
            erklaerung: 'Bei Kondensatoren ist es UMGEKEHRT: parallel addieren sie sich.'
        },
        {
            id: 'kondensator-reihe', kapitel: 'konden', schreibweise: 'C = (C₁ · C₂) / (C₁ + C₂)',
            groessen: [g('C', 'Gesamtkapazität', 'µF'), g('C₁', 'Kapazität 1', 'µF'),
                g('C₂', 'Kapazität 2', 'µF')],
            loese: {
                C: v => (v['C₁'] * v['C₂']) / (v['C₁'] + v['C₂']),
                'C₁': v => (v.C * v['C₂']) / (v['C₂'] - v.C),
                'C₂': v => (v.C * v['C₁']) / (v['C₁'] - v.C)
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
                C: v => v['ε₀'] * v['εᵣ'] * v.A / v.d,
                A: v => v.C * v.d / (v['ε₀'] * v['εᵣ']),
                d: v => v['ε₀'] * v['εᵣ'] * v.A / v.C,
                'εᵣ': v => v.C * v.d / (v['ε₀'] * v.A)
            },
            erklaerung: 'Grosse Fläche und kleiner Abstand geben viel Kapazität.'
        },
        /* ---- Wechselstrom ---------------------------------------------------- */
        {
            id: 'scheitelwert', kapitel: 'wechsel', schreibweise: 'û = √2 · U',
            groessen: [g('û', 'Scheitelwert', 'V', 'Die höchste Spitze der Sinuskurve'),
                g('U', 'Effektivwert', 'V', 'Der Wert, den das Messgerät anzeigt')],
            loese: { 'û': v => WURZEL(2) * v.U, U: v => v['û'] / WURZEL(2) },
            weg: {
                'û': (v, e) => [`û = √2 · U`, `û = 1,414 · ${v.U} V`, `û = ${e} V`],
                U: (v, e) => [`U = û ÷ √2`, `U = ${v['û']} V ÷ 1,414`, `U = ${e} V`]
            },
            erklaerung: '230 V aus der Steckdose sind der Effektivwert — die Spitze liegt bei 325 V.'
        },
        {
            id: 'periodendauer', kapitel: 'wechsel', schreibweise: 'T = 1 / f',
            groessen: [g('T', 'Periodendauer', 's'), g('f', 'Frequenz', 'Hz')],
            loese: { T: v => 1 / v.f, f: v => 1 / v.T },
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
                X_L: v => 2 * PI * v.f * v.L,
                f: v => v.X_L / (2 * PI * v.L),
                L: v => v.X_L / (2 * PI * v.f)
            },
            erklaerung: 'Eine Spule bremst Wechselstrom — und zwar umso mehr, je höher die Frequenz.'
        },
        {
            id: 'blindwiderstand-c', kapitel: 'wechsel', schreibweise: 'X_C = 1 / (2 · π · f · C)',
            groessen: [g('X_C', 'kapazitiver Blindwiderstand', 'Ω'), g('f', 'Frequenz', 'Hz'),
                g('C', 'Kapazität', 'F')],
            loese: {
                X_C: v => 1 / (2 * PI * v.f * v.C),
                f: v => 1 / (2 * PI * v.X_C * v.C),
                C: v => 1 / (2 * PI * v.f * v.X_C)
            },
            erklaerung: 'Ein Kondensator lässt hohe Frequenzen durch und sperrt Gleichstrom ganz.'
        },
        {
            id: 'impedanz', kapitel: 'wechsel', schreibweise: 'Z = U / I',
            groessen: [g('Z', 'Scheinwiderstand', 'Ω'), g('U', 'Spannung', 'V'), g('I', 'Strom', 'A')],
            loese: { Z: v => v.U / v.I, U: v => v.Z * v.I, I: v => v.U / v.Z },
            erklaerung: 'Das ohmsche Gesetz für Wechselstrom — Wirk- und Blindanteil zusammen.'
        },
        {
            id: 'impedanz-reihe', kapitel: 'wechsel', schreibweise: 'Z = √(R² + X²)',
            groessen: [g('Z', 'Scheinwiderstand', 'Ω'), g('R', 'Wirkwiderstand', 'Ω'),
                g('X', 'Blindwiderstand', 'Ω')],
            loese: {
                Z: v => WURZEL(v.R * v.R + v.X * v.X),
                R: v => WURZEL(v.Z * v.Z - v.X * v.X),
                X: v => WURZEL(v.Z * v.Z - v.R * v.R)
            },
            weg: {
                Z: (v, e) => [`Z = √(R² + X²)`,
                    `Z = √(${v.R}² + ${v.X}²)`,
                    `Z = √(${v.R * v.R} + ${v.X * v.X})`,
                    `Z = ${e} Ω`]
            },
            erklaerung: 'In Reihe addieren sich Wirk- und Blindwiderstand nach Pythagoras, nicht direkt.'
        },
        {
            id: 'kreisfrequenz', kapitel: 'wechsel', schreibweise: 'ω = 2 · π · f',
            groessen: [g('ω', 'Kreisfrequenz', '1/s'), g('f', 'Frequenz', 'Hz')],
            loese: { 'ω': v => 2 * PI * v.f, f: v => v['ω'] / (2 * PI) },
            erklaerung: 'Bei 50 Hz sind das 314 1/s — die Zahl, die in jeder ' +
                'Wechselstromrechnung wieder auftaucht.'
        },
        {
            id: 'momentanwert', kapitel: 'wechsel', schreibweise: 'u = û · sin α',
            groessen: [g('u', 'Momentanwert der Spannung', 'V', 'Der Wert GERADE JETZT'),
                g('û', 'Scheitelwert', 'V'),
                g('α', 'Phasenwinkel', '°')],
            loese: {
                u: v => v['û'] * Math.sin(v['α'] * PI / 180),
                'û': v => v.u / Math.sin(v['α'] * PI / 180),
                'α': v => Math.asin(v.u / v['û']) * 180 / PI
            },
            erklaerung: 'Die Sinuslinie in einer Zeile. Bei 90° steht der Scheitel, bei 0° und 180° die Null.'
        },
        {
            id: 'impedanz-reihe-rlc', kapitel: 'wechsel',
            schreibweise: 'Z = √(R² + (X_L − X_C)²)',
            groessen: [g('Z', 'Scheinwiderstand', 'Ω'), g('R', 'Wirkwiderstand', 'Ω'),
                g('X_L', 'induktiver Blindwiderstand', 'Ω'),
                g('X_C', 'kapazitiver Blindwiderstand', 'Ω')],
            loese: {
                Z: v => WURZEL(v.R * v.R + (v.X_L - v.X_C) * (v.X_L - v.X_C)),
                R: v => WURZEL(v.Z * v.Z - (v.X_L - v.X_C) * (v.X_L - v.X_C))
            },
            mehrdeutig: ['X_L', 'X_C'],
            annahme: 'Reihenschaltung. Die beiden Blindwiderstände heben sich gegenseitig ' +
                'auf — deshalb die DIFFERENZ und nicht die Summe. Nach X_L oder X_C ' +
                'lässt sich nicht auflösen: aus Z, R und dem anderen Blindwiderstand ' +
                'folgt nur der BETRAG der Differenz, nicht ihr Vorzeichen. Die ' +
                'Schaltung kann induktiv oder kapazitiv überwiegen, und beides passt ' +
                'zur selben Impedanz.',
            erklaerung: 'Spule und Kondensator wirken gegeneinander. Sind sie gleich gross, ' +
                'bleibt nur R übrig — das ist Resonanz.'
        },
        {
            id: 'cosphi-reihe', kapitel: 'wechsel', schreibweise: 'cos φ = R / Z',
            groessen: [g('cosφ', 'Leistungsfaktor', ''), g('R', 'Wirkwiderstand', 'Ω'),
                g('Z', 'Scheinwiderstand', 'Ω')],
            loese: {
                'cosφ': v => v.R / v.Z,
                R: v => v['cosφ'] * v.Z,
                Z: v => v.R / v['cosφ']
            },
            annahme: 'Gilt für die REIHENSCHALTUNG. Bei der Parallelschaltung ist es ' +
                'umgekehrt: cos φ = Z / R.',
            erklaerung: 'Der Leistungsfaktor aus dem Widerstandsdreieck.'
        },
        {
            id: 'impedanz-parallel', kapitel: 'wechsel',
            schreibweise: 'Z = 1 / √(1/R² + 1/X²)',
            groessen: [g('Z', 'Scheinwiderstand', 'Ω'), g('R', 'Wirkwiderstand', 'Ω'),
                g('X', 'Blindwiderstand', 'Ω')],
            loese: {
                Z: v => 1 / WURZEL(1 / (v.R * v.R) + 1 / (v.X * v.X)),
                R: v => 1 / WURZEL(1 / (v.Z * v.Z) - 1 / (v.X * v.X)),
                X: v => 1 / WURZEL(1 / (v.Z * v.Z) - 1 / (v.R * v.R))
            },
            annahme: 'Parallelschaltung. Hier addieren sich die LEITWERTE, nicht die Widerstände.',
            erklaerung: 'Bei der Parallelschaltung ist der Scheinwiderstand KLEINER als jeder ' +
                'einzelne — genau umgekehrt zur Reihe.'
        },
        {
            id: 'cosphi-parallel', kapitel: 'wechsel', schreibweise: 'cos φ = Z / R',
            groessen: [g('cosφ', 'Leistungsfaktor', ''), g('Z', 'Scheinwiderstand', 'Ω'),
                g('R', 'Wirkwiderstand', 'Ω')],
            loese: {
                'cosφ': v => v.Z / v.R,
                Z: v => v['cosφ'] * v.R,
                R: v => v.Z / v['cosφ']
            },
            annahme: 'Gilt für die PARALLELSCHALTUNG. Bei der Reihenschaltung ist es ' +
                'umgekehrt: cos φ = R / Z.',
            erklaerung: 'Der häufigste Verwechslungsfehler im ganzen Kapitel: Reihe und ' +
                'Parallel haben dieselben Buchstaben und die umgekehrte Formel.'
        },
        {
            id: 'resonanzfrequenz', kapitel: 'wechsel',
            schreibweise: 'f_r = 1 / (2 · π · √(L · C))',
            groessen: [g('f_r', 'Resonanzfrequenz', 'Hz'), g('L', 'Induktivität', 'H'),
                g('C', 'Kapazität', 'F')],
            loese: {
                f_r: v => 1 / (2 * PI * WURZEL(v.L * v.C)),
                L: v => 1 / (4 * PI * PI * v.f_r * v.f_r * v.C),
                C: v => 1 / (4 * PI * PI * v.f_r * v.f_r * v.L)
            },
            erklaerung: 'Bei dieser Frequenz sind X_L und X_C gleich gross. Dann ist Z = R ' +
                'und cos φ = 1 — die Schaltung verhält sich rein ohmsch.'
        },
        {
            id: 'spannung-reihe-ac', kapitel: 'wechsel', schreibweise: 'U = √(U_w² + U_b²)',
            groessen: [g('U', 'Gesamtspannung', 'V'), g('U_w', 'Wirkspannung', 'V'),
                g('U_b', 'Blindspannung', 'V')],
            loese: {
                U: v => WURZEL(v.U_w * v.U_w + v.U_b * v.U_b),
                U_w: v => WURZEL(v.U * v.U - v.U_b * v.U_b),
                U_b: v => WURZEL(v.U * v.U - v.U_w * v.U_w)
            },
            annahme: 'Reihenschaltung. Die Teilspannungen addieren sich NICHT einfach — ' +
                'sie stehen senkrecht aufeinander.',
            erklaerung: 'Warum 60 V plus 80 V hier 100 V ergeben und nicht 140.'
        },
        {
            id: 'strom-parallel-ac', kapitel: 'wechsel', schreibweise: 'I = √(I_w² + I_b²)',
            groessen: [g('I', 'Gesamtstrom', 'A'), g('I_w', 'Wirkstrom', 'A'),
                g('I_b', 'Blindstrom', 'A')],
            loese: {
                I: v => WURZEL(v.I_w * v.I_w + v.I_b * v.I_b),
                I_w: v => WURZEL(v.I * v.I - v.I_b * v.I_b),
                I_b: v => WURZEL(v.I * v.I - v.I_w * v.I_w)
            },
            annahme: 'Parallelschaltung. Das Gegenstück zur Spannung bei der Reihe.',
            erklaerung: 'Bei der Parallelschaltung teilen sich die Ströme so auf, wie sich ' +
                'bei der Reihe die Spannungen aufteilen.'
        },
        {
            id: 'scheinleitwert', kapitel: 'wechsel', schreibweise: 'Y = 1 / Z',
            groessen: [g('Y', 'Scheinleitwert', 'S'), g('Z', 'Scheinwiderstand', 'Ω')],
            loese: { Y: v => 1 / v.Z, Z: v => 1 / v.Y },
            erklaerung: 'Bei Parallelschaltungen rechnet es sich mit Leitwerten leichter — ' +
                'sie addieren sich einfach.'
        },
        {
            id: 'scheinleistung-z', kapitel: 'wechsel', schreibweise: 'S = U² / Z',
            groessen: [g('S', 'Scheinleistung', 'VA'), g('U', 'Spannung', 'V'),
                g('Z', 'Scheinwiderstand', 'Ω')],
            loese: {
                S: v => v.U * v.U / v.Z,
                U: v => WURZEL(v.S * v.Z),
                Z: v => v.U * v.U / v.S
            },
            erklaerung: 'Wenn der Strom unbekannt ist, aber Spannung und Impedanz da sind.'
        },
        {
            id: 'cosphi-leistung', kapitel: 'wechsel', schreibweise: 'cos φ = P / S',
            groessen: [g('cosφ', 'Leistungsfaktor', ''), g('P', 'Wirkleistung', 'W'),
                g('S', 'Scheinleistung', 'VA')],
            loese: {
                'cosφ': v => v.P / v.S,
                P: v => v['cosφ'] * v.S,
                S: v => v.P / v['cosφ']
            },
            erklaerung: 'Der Leistungsfaktor aus dem Leistungsdreieck — dieselbe Zahl wie ' +
                'aus dem Widerstandsdreieck, anderer Weg.'
        },
        {
            id: 'sinphi-leistung', kapitel: 'wechsel', schreibweise: 'sin φ = Q / S',
            groessen: [g('sinφ', 'Blindfaktor', ''), g('Q', 'Blindleistung', 'var'),
                g('S', 'Scheinleistung', 'VA')],
            loese: {
                'sinφ': v => v.Q / v.S,
                Q: v => v['sinφ'] * v.S,
                S: v => v.Q / v['sinφ']
            },
            erklaerung: 'Wie viel von der Scheinleistung blind ist.'
        },
        {
            id: 'wirkleistung-dreieck', kapitel: 'wechsel', schreibweise: 'P = √(S² − Q²)',
            groessen: [g('P', 'Wirkleistung', 'W'), g('S', 'Scheinleistung', 'VA'),
                g('Q', 'Blindleistung', 'var')],
            loese: {
                P: v => WURZEL(v.S * v.S - v.Q * v.Q),
                S: v => WURZEL(v.P * v.P + v.Q * v.Q),
                Q: v => WURZEL(v.S * v.S - v.P * v.P)
            },
            erklaerung: 'Das Leistungsdreieck von der anderen Seite: was wirklich arbeitet.'
        },
        {
            id: 'scheinleistung', kapitel: 'wechsel', schreibweise: 'S = U · I',
            groessen: [g('S', 'Scheinleistung', 'VA'), g('U', 'Spannung', 'V'), g('I', 'Strom', 'A')],
            loese: { S: v => v.U * v.I, U: v => v.S / v.I, I: v => v.S / v.U },
            erklaerung: 'Was die Leitung tragen muss — auch der Teil, der keine Arbeit leistet.'
        },
        {
            id: 'wirkleistung-cos', kapitel: 'wechsel', schreibweise: 'P = U · I · cos φ',
            groessen: [g('P', 'Wirkleistung', 'W'), g('U', 'Spannung', 'V'), g('I', 'Strom', 'A'),
                g('cosφ', 'Leistungsfaktor', '', 'Zwischen 0 und 1')],
            loese: {
                P: v => v.U * v.I * v['cosφ'],
                U: v => v.P / (v.I * v['cosφ']),
                I: v => v.P / (v.U * v['cosφ']),
                'cosφ': v => v.P / (v.U * v.I)
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
                Q: v => v.U * v.I * v['sinφ'],
                U: v => v.Q / (v.I * v['sinφ']),
                I: v => v.Q / (v.U * v['sinφ']),
                'sinφ': v => v.Q / (v.U * v.I)
            },
            erklaerung: 'Pendelt zwischen Netz und Verbraucher hin und her, ohne Arbeit zu leisten.'
        },
        {
            id: 'leistungsdreieck', kapitel: 'wechsel', schreibweise: 'S = √(P² + Q²)',
            groessen: [g('S', 'Scheinleistung', 'VA'), g('P', 'Wirkleistung', 'W'),
                g('Q', 'Blindleistung', 'var')],
            loese: {
                S: v => WURZEL(v.P * v.P + v.Q * v.Q),
                P: v => WURZEL(v.S * v.S - v.Q * v.Q),
                Q: v => WURZEL(v.S * v.S - v.P * v.P)
            },
            erklaerung: 'Das Leistungsdreieck. Auch hier gilt Pythagoras.'
        },
        /* ---- Drehstrom ------------------------------------------------------- */
        {
            id: 'dreh-schein', kapitel: 'dreh', schreibweise: 'S = √3 · U · I',
            groessen: [g('S', 'Scheinleistung', 'VA'), g('U', 'Aussenleiterspannung', 'V'),
                g('I', 'Aussenleiterstrom', 'A')],
            loese: {
                S: v => WURZEL(3) * v.U * v.I,
                U: v => v.S / (WURZEL(3) * v.I),
                I: v => v.S / (WURZEL(3) * v.U)
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
                P: v => WURZEL(3) * v.U * v.I * v['cosφ'],
                I: v => v.P / (WURZEL(3) * v.U * v['cosφ']),
                U: v => v.P / (WURZEL(3) * v.I * v['cosφ']),
                'cosφ': v => v.P / (WURZEL(3) * v.U * v.I)
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
            loese: { U: v => WURZEL(3) * v.U_Str, U_Str: v => v.U / WURZEL(3) },
            erklaerung: 'Sternschaltung: 400 V zwischen den Aussenleitern, 230 V am einzelnen Strang.'
        },
        {
            id: 'dreieck', kapitel: 'dreh', schreibweise: 'U = U_Str  ·  I = √3 · I_Str',
            groessen: [g('I', 'Aussenleiterstrom', 'A'), g('I_Str', 'Strangstrom', 'A')],
            loese: { I: v => WURZEL(3) * v.I_Str, I_Str: v => v.I / WURZEL(3) },
            erklaerung: 'Dreieckschaltung: volle Spannung am Strang, dafür teilt sich der Strom auf.'
        },
        /* ---- Transformator --------------------------------------------------- */
        {
            id: 'stern-spannung', kapitel: 'dreh', schreibweise: 'U_Str = U / √3',
            groessen: [g('U_Str', 'Strangspannung', 'V', 'Über einem einzelnen Wicklungsstrang'),
                g('U', 'Aussenleiterspannung', 'V', 'Zwischen zwei Aussenleitern')],
            loese: { U_Str: v => v.U / WURZEL(3), U: v => WURZEL(3) * v.U_Str },
            annahme: 'Sternschaltung. Der Strom ist in beiden gleich: I = I_Str.',
            erklaerung: 'Im Stern liegt an jedem Strang nur 230 V, obwohl zwischen den ' +
                'Aussenleitern 400 V stehen.'
        },
        {
            id: 'stern-strang', kapitel: 'dreh', schreibweise: 'U_Str = I · Z',
            groessen: [g('U_Str', 'Strangspannung', 'V'), g('I', 'Aussenleiterstrom', 'A'),
                g('Z', 'Strangimpedanz', 'Ω')],
            loese: { U_Str: v => v.I * v.Z, I: v => v.U_Str / v.Z, Z: v => v.U_Str / v.I },
            annahme: 'Sternschaltung, wo Strangstrom und Aussenleiterstrom gleich sind. ' +
                'Bei reiner Wirklast ist Z = R.',
            erklaerung: 'Ohm am einzelnen Strang.'
        },
        {
            id: 'dreieck-strom', kapitel: 'dreh', schreibweise: 'I_Str = I / √3',
            groessen: [g('I_Str', 'Strangstrom', 'A', 'Durch einen einzelnen Wicklungsstrang'),
                g('I', 'Aussenleiterstrom', 'A')],
            loese: { I_Str: v => v.I / WURZEL(3), I: v => WURZEL(3) * v.I_Str },
            annahme: 'Dreieckschaltung. Die Spannung ist in beiden gleich: U = U_Str.',
            erklaerung: 'Im Dreieck ist es umgekehrt zum Stern: die Spannung ist gleich, ' +
                'der Strom teilt sich.'
        },
        {
            id: 'dreieck-strang', kapitel: 'dreh', schreibweise: 'I_Str = U / Z',
            groessen: [g('I_Str', 'Strangstrom', 'A'), g('U', 'Aussenleiterspannung', 'V'),
                g('Z', 'Strangimpedanz', 'Ω')],
            loese: { I_Str: v => v.U / v.Z, U: v => v.I_Str * v.Z, Z: v => v.U / v.I_Str },
            annahme: 'Dreieckschaltung, wo Strangspannung und Aussenleiterspannung gleich ' +
                'sind. Bei reiner Wirklast ist Z = R.',
            erklaerung: 'Ohm am einzelnen Strang — im Dreieck mit der vollen Aussenleiterspannung.'
        },
        {
            id: 'dreh-blindleistung', kapitel: 'dreh',
            schreibweise: 'Q = √3 · U · I · sin φ',
            groessen: [g('Q', 'Blindleistung', 'var'), g('U', 'Aussenleiterspannung', 'V'),
                g('I', 'Aussenleiterstrom', 'A'), g('sinφ', 'Blindfaktor', '')],
            loese: {
                Q: v => WURZEL(3) * v.U * v.I * v['sinφ'],
                U: v => v.Q / (WURZEL(3) * v.I * v['sinφ']),
                I: v => v.Q / (WURZEL(3) * v.U * v['sinφ']),
                'sinφ': v => v.Q / (WURZEL(3) * v.U * v.I)
            },
            erklaerung: 'Das Gegenstück zur Wirkleistung im Drehstrom.'
        },
        {
            id: 'stern-scheinleistung', kapitel: 'dreh', schreibweise: 'S_Y = U² / Z',
            groessen: [g('S_Y', 'Scheinleistung im Stern', 'VA'),
                g('U', 'Aussenleiterspannung', 'V'), g('Z', 'Strangimpedanz', 'Ω')],
            loese: {
                S_Y: v => v.U * v.U / v.Z,
                U: v => WURZEL(v.S_Y * v.Z),
                Z: v => v.U * v.U / v.S_Y
            },
            annahme: 'Sternschaltung, symmetrische Last.',
            erklaerung: 'Die Leistung aus Spannung und Strangimpedanz, ohne Umweg über den Strom.'
        },
        {
            id: 'dreieck-scheinleistung', kapitel: 'dreh', schreibweise: 'S_Δ = 3 · U² / Z',
            groessen: [g('S_Δ', 'Scheinleistung im Dreieck', 'VA'),
                g('U', 'Aussenleiterspannung', 'V'), g('Z', 'Strangimpedanz', 'Ω')],
            loese: {
                'S_Δ': v => 3 * v.U * v.U / v.Z,
                U: v => WURZEL(v['S_Δ'] * v.Z / 3),
                Z: v => 3 * v.U * v.U / v['S_Δ']
            },
            annahme: 'Dreieckschaltung, symmetrische Last.',
            erklaerung: 'DREIMAL so viel wie im Stern — bei derselben Last und derselben ' +
                'Netzspannung. Genau deshalb läuft ein Motor im Dreieck mit voller Leistung ' +
                'und im Stern nur mit einem Drittel.'
        },
        {
            id: 'stern-dreieck-vergleich', kapitel: 'dreh', schreibweise: 'P_Δ = 3 · P_Y',
            groessen: [g('P_Δ', 'Leistung im Dreieck', 'W'),
                g('P_Y', 'Leistung im Stern', 'W')],
            loese: { 'P_Δ': v => 3 * v.P_Y, P_Y: v => v['P_Δ'] / 3 },
            annahme: 'Gleiche Last, gleiches Netz. Für die Ströme gilt dasselbe: I_Δ = 3 · I_Y.',
            erklaerung: 'Der Grund für die Stern-Dreieck-Anlaufschaltung: im Stern zieht der ' +
                'Motor beim Anlauf nur ein Drittel.'
        },
        {
            id: 'dreh-wirkleistung-q', kapitel: 'dreh', schreibweise: 'P = Q / tan φ',
            groessen: [g('P', 'Wirkleistung', 'W'), g('Q', 'Blindleistung', 'var'),
                g('tanφ', 'Verhältnis Blind zu Wirk', '')],
            loese: {
                P: v => v.Q / v['tanφ'],
                Q: v => v.P * v['tanφ'],
                'tanφ': v => v.Q / v.P
            },
            erklaerung: 'Der Tangens ist Blindleistung durch Wirkleistung — die Zahl, mit der ' +
                'die Kompensation rechnet.'
        },
        {
            id: 'trafo-uebersetzung', kapitel: 'trafo', schreibweise: 'U₁ / U₂ = N₁ / N₂ = ü',
            groessen: [g('U₁', 'Spannung primär', 'V'), g('U₂', 'Spannung sekundär', 'V'),
                g('N₁', 'Windungen primär', ''), g('N₂', 'Windungen sekundär', '')],
            loese: {
                'U₁': v => v['U₂'] * v['N₁'] / v['N₂'],
                'U₂': v => v['U₁'] * v['N₂'] / v['N₁'],
                'N₁': v => v['N₂'] * v['U₁'] / v['U₂'],
                'N₂': v => v['N₁'] * v['U₂'] / v['U₁']
            },
            annahme: 'Gilt für den verlustfreien Transformator.',
            erklaerung: 'Die Spannungen verhalten sich wie die Windungszahlen.'
        },
        {
            id: 'trafo-strom', kapitel: 'trafo', schreibweise: 'I₁ / I₂ = U₂ / U₁ = N₂ / N₁',
            groessen: [g('I₁', 'Strom primär', 'A'), g('I₂', 'Strom sekundär', 'A'),
                g('U₁', 'Spannung primär', 'V'), g('U₂', 'Spannung sekundär', 'V')],
            loese: {
                'I₁': v => v['I₂'] * v['U₂'] / v['U₁'],
                'I₂': v => v['I₁'] * v['U₁'] / v['U₂'],
                'U₁': v => v['U₂'] * v['I₂'] / v['I₁'],
                'U₂': v => v['U₁'] * v['I₁'] / v['I₂']
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
                n_s: v => v.f * 60 / v.p,
                f: v => v.n_s * v.p / 60,
                p: v => v.f * 60 / v.n_s
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
                s: v => (v.n_s - v.n) / v.n_s * 100,
                n: v => v.n_s * (1 - v.s / 100),
                n_s: v => v.n / (1 - v.s / 100)
            },
            erklaerung: 'Wie weit der Läufer dem Drehfeld nachhinkt. Ohne Schlupf kein Drehmoment.'
        },
        {
            id: 'motorleistung', kapitel: 'motor', schreibweise: 'P = M · 2 · π · n',
            groessen: [g('P', 'mechanische Leistung', 'W'), g('M', 'Drehmoment', 'Nm'),
                g('n', 'Drehzahl', '1/s')],
            loese: {
                P: v => v.M * 2 * PI * v.n,
                M: v => v.P / (2 * PI * v.n),
                n: v => v.P / (2 * PI * v.M)
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
                P: v => v.m * v.g * v.h / v.t,
                m: v => v.P * v.t / (v.g * v.h),
                h: v => v.P * v.t / (v.m * v.g),
                t: v => v.m * v.g * v.h / v.P
            },
            erklaerung: 'Was ein Aufzug oder eine Winde an Leistung braucht.'
        },
        /* ---- Lichttechnik ---------------------------------------------------- */
        {
            id: 'motor-polpaare', kapitel: 'motor', schreibweise: 'p = f · 60 / n_s',
            groessen: [g('p', 'Anzahl Polpaare', ''), g('f', 'Frequenz', 'Hz'),
                g('n_s', 'Drehfelddrehzahl', '1/min')],
            loese: {
                p: v => v.f * 60 / v.n_s,
                f: v => v.p * v.n_s / 60,
                n_s: v => v.f * 60 / v.p
            },
            annahme: 'Die Drehfelddrehzahl heisst auch Synchrondrehzahl.',
            erklaerung: 'Bei 50 Hz: ein Polpaar gibt 3000 1/min, zwei geben 1500, drei geben 1000.'
        },
        {
            id: 'motor-laeuferdrehzahl', kapitel: 'motor',
            schreibweise: 'n = n_s · (100 % − s) / 100 %',
            groessen: [g('n', 'Läuferdrehzahl', '1/min', 'Was die Welle wirklich dreht'),
                g('n_s', 'Drehfelddrehzahl', '1/min'),
                g('s', 'Schlupf', '%')],
            loese: {
                n: v => v.n_s * (100 - v.s) / 100,
                n_s: v => v.n * 100 / (100 - v.s),
                s: v => (v.n_s - v.n) * 100 / v.n_s
            },
            erklaerung: 'Ein Asynchronmotor läuft immer etwas langsamer als das Drehfeld — ' +
                'ohne diesen Unterschied gäbe es keinen Läuferstrom und kein Drehmoment.'
        },
        {
            id: 'motor-aufnahme-dreh', kapitel: 'motor',
            schreibweise: 'P₁ = √3 · U · I · cos φ',
            groessen: [g('P₁', 'aufgenommene elektrische Leistung', 'W'),
                g('U', 'Aussenleiterspannung', 'V'), g('I', 'Aussenleiterstrom', 'A'),
                g('cosφ', 'Wirkleistungsfaktor', '')],
            loese: {
                'P₁': v => WURZEL(3) * v.U * v.I * v['cosφ'],
                U: v => v['P₁'] / (WURZEL(3) * v.I * v['cosφ']),
                I: v => v['P₁'] / (WURZEL(3) * v.U * v['cosφ']),
                'cosφ': v => v['P₁'] / (WURZEL(3) * v.U * v.I)
            },
            annahme: 'Drehstrommotor. Auf dem Leistungsschild steht P₂ — die ABGEGEBENE ' +
                'mechanische Leistung, nicht diese.',
            erklaerung: 'Was der Motor aus dem Netz zieht. Der häufigste Fehler ist, die ' +
                'Schildleistung dafür zu halten.'
        },
        {
            id: 'motor-abgabe', kapitel: 'motor', schreibweise: 'P₂ = P₁ · η',
            groessen: [g('P₂', 'abgegebene mechanische Leistung', 'W', 'Das, was auf dem Schild steht'),
                g('P₁', 'aufgenommene elektrische Leistung', 'W'),
                g('η', 'Wirkungsgrad', '')],
            loese: {
                'P₂': v => v['P₁'] * v['η'],
                'P₁': v => v['P₂'] / v['η'],
                'η': v => v['P₂'] / v['P₁']
            },
            erklaerung: 'Der Unterschied wird Wärme. Bei einem guten Motor sind das unter 10 %.'
        },
        {
            id: 'motor-aufnahme-wechsel', kapitel: 'motor',
            schreibweise: 'P₁ = U · I · cos φ',
            groessen: [g('P₁', 'aufgenommene elektrische Leistung', 'W'),
                g('U', 'Spannung', 'V'), g('I', 'Strom', 'A'),
                g('cosφ', 'Wirkleistungsfaktor', '')],
            loese: {
                'P₁': v => v.U * v.I * v['cosφ'],
                U: v => v['P₁'] / (v.I * v['cosφ']),
                I: v => v['P₁'] / (v.U * v['cosφ']),
                'cosφ': v => v['P₁'] / (v.U * v.I)
            },
            annahme: 'Wechselstrommotor — einphasig, ohne die Wurzel aus 3.',
            erklaerung: 'Bohrmaschine, Handkreissäge: alles, was am gewöhnlichen Stecker hängt.'
        },
        {
            id: 'hubarbeit', kapitel: 'motor', schreibweise: 'W₂ = m · g · h',
            groessen: [g('W₂', 'mechanische Arbeit', 'Nm', '1 Nm = 1 Ws'),
                g('m', 'Masse', 'kg'),
                g('g', 'Fallbeschleunigung', 'm/s²'),
                g('h', 'Hubhöhe', 'm')],
            loese: {
                'W₂': v => v.m * 9.81 * v.h,
                m: v => v['W₂'] / (9.81 * v.h),
                h: v => v['W₂'] / (9.81 * v.m)
            },
            annahme: 'Mit g = 9,81 m/s².',
            erklaerung: 'Was ein Aufzug oder eine Seilwinde an Arbeit leistet.'
        },
        {
            id: 'hubzeit', kapitel: 'motor', schreibweise: 't = W₂ / P₂',
            groessen: [g('t', 'Hubzeit', 's'), g('W₂', 'mechanische Arbeit', 'Nm'),
                g('P₂', 'mechanische Leistung', 'W')],
            loese: {
                t: v => v['W₂'] / v['P₂'],
                'W₂': v => v.t * v['P₂'],
                'P₂': v => v['W₂'] / v.t
            },
            erklaerung: 'Wie lange die Winde für die Last braucht. 1 W = 1 Nm/s.'
        },
        {
            id: 'beleuchtungsstaerke', kapitel: 'licht', schreibweise: 'E = Φ / A',
            groessen: [g('E', 'Beleuchtungsstärke', 'lx'), g('Φ', 'Lichtstrom', 'lm'),
                g('A', 'Fläche', 'm²')],
            loese: {
                E: v => v['Φ'] / v.A,
                'Φ': v => v.E * v.A,
                A: v => v['Φ'] / v.E
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
                n: v => v.E * v.A * v.p / (v['Φ_L'] * v['η_B']),
                E: v => v.n * v['Φ_L'] * v['η_B'] / (v.A * v.p),
                A: v => v.n * v['Φ_L'] * v['η_B'] / (v.E * v.p),
                'Φ_L': v => v.E * v.A * v.p / (v.n * v['η_B']),
                p: v => v.n * v['Φ_L'] * v['η_B'] / (v.E * v.A),
                'η_B': v => v.E * v.A * v.p / (v.n * v['Φ_L'])
            },
            annahme: 'Der Betriebswirkungsgrad hängt vom Raum ab und wird angenommen.',
            erklaerung: 'Wie viele Leuchten ein Raum braucht — aufgerundet, nie abgerundet.'
        },
        {
            id: 'lichtausbeute', kapitel: 'licht', schreibweise: 'η = Φ_L / P_L',
            groessen: [g('η', 'Lichtausbeute', 'lm/W'), g('Φ_L', 'Lichtstrom', 'lm'),
                g('P_L', 'Leistung', 'W')],
            loese: {
                'η': v => v['Φ_L'] / v.P_L,
                'Φ_L': v => v['η'] * v.P_L,
                P_L: v => v['Φ_L'] / v['η']
            },
            erklaerung: 'Wie viel Licht je Watt. LED etwa 100 lm/W, Glühlampe etwa 12.'
        },
        {
            id: 'abstandsgesetz', kapitel: 'licht', schreibweise: 'E₂ = E₁ · (r₁ / r₂)²',
            groessen: [g('E₂', 'Beleuchtungsstärke neu', 'lx'), g('E₁', 'Beleuchtungsstärke alt', 'lx'),
                g('r₁', 'Abstand alt', 'm'), g('r₂', 'Abstand neu', 'm')],
            loese: {
                'E₂': v => v['E₁'] * (v['r₁'] / v['r₂']) * (v['r₁'] / v['r₂']),
                'E₁': v => v['E₂'] * (v['r₂'] / v['r₁']) * (v['r₂'] / v['r₁']),
                'r₂': v => v['r₁'] * WURZEL(v['E₁'] / v['E₂']),
                'r₁': v => v['r₂'] * WURZEL(v['E₂'] / v['E₁'])
            },
            annahme: 'Gilt für eine punktförmige Lichtquelle.',
            erklaerung: 'Doppelter Abstand heisst nur noch ein Viertel Licht.'
        },
        /* ---- Antenneninstallation (Kapitel 16 des Heftes) --------------------
           Der Grund, warum hier LOGARITHMEN stehen: eine Antennenanlage hat
           Verstärker und Dämpfungen hintereinander, und deren Faktoren müsste
           man multiplizieren. In Dezibel ADDIERT man sie stattdessen — und
           Addieren geht im Kopf. */
        {
            id: 'verstaerkungsfaktor-u', kapitel: 'antenne', schreibweise: 'V_U = U₂ / U₁',
            groessen: [g('V_U', 'Spannungsverstärkungsfaktor', ''),
                g('U₂', 'Ausgangsspannung', 'V'), g('U₁', 'Eingangsspannung', 'V')],
            loese: {
                V_U: v => v['U₂'] / v['U₁'],
                'U₂': v => v.V_U * v['U₁'],
                'U₁': v => v['U₂'] / v.V_U
            },
            erklaerung: 'Wie oft grösser die Spannung hinter dem Verstärker ist.'
        },
        {
            id: 'daempfungsfaktor-u', kapitel: 'antenne', schreibweise: 'D_U = U₁ / U₂',
            groessen: [g('D_U', 'Spannungsdämpfungsfaktor', ''),
                g('U₁', 'Eingangsspannung', 'V'), g('U₂', 'Ausgangsspannung', 'V')],
            loese: {
                D_U: v => v['U₁'] / v['U₂'],
                'U₁': v => v.D_U * v['U₂'],
                'U₂': v => v['U₁'] / v.D_U
            },
            erklaerung: 'Dasselbe umgekehrt — was ein Kabel oder ein Verteiler wegnimmt.'
        },
        {
            id: 'verstaerkungsmass-u', kapitel: 'antenne',
            schreibweise: 'G_U = 20 · log(U₂ / U₁)',
            groessen: [g('G_U', 'Spannungsverstärkungsmass', 'dB'),
                g('U₂', 'Ausgangsspannung', 'V'), g('U₁', 'Eingangsspannung', 'V')],
            loese: {
                G_U: v => 20 * Math.log10(v['U₂'] / v['U₁']),
                'U₂': v => v['U₁'] * Math.pow(10, v.G_U / 20),
                'U₁': v => v['U₂'] / Math.pow(10, v.G_U / 20)
            },
            annahme: 'Bei SPANNUNGEN steht die 20 vor dem Logarithmus, bei LEISTUNGEN ' +
                'die 10 — weil die Leistung mit dem Quadrat der Spannung geht.',
            erklaerung: 'Verstärkung in Dezibel. 6 dB heissen ungefähr doppelte Spannung, ' +
                '20 dB heissen zehnfache.'
        },
        {
            id: 'daempfungsmass-u', kapitel: 'antenne',
            schreibweise: 'A_U = 20 · log(U₁ / U₂)',
            groessen: [g('A_U', 'Spannungsdämpfungsmass', 'dB'),
                g('U₁', 'Eingangsspannung', 'V'), g('U₂', 'Ausgangsspannung', 'V')],
            loese: {
                A_U: v => 20 * Math.log10(v['U₁'] / v['U₂']),
                'U₁': v => v['U₂'] * Math.pow(10, v.A_U / 20),
                'U₂': v => v['U₁'] / Math.pow(10, v.A_U / 20)
            },
            erklaerung: 'Dämpfung in Dezibel. Ein langes Kabel dämpft, ein Verteiler auch — ' +
                'und beide zusammen: einfach addieren.'
        },
        {
            id: 'verstaerkungsmass-p', kapitel: 'antenne',
            schreibweise: 'G_P = 10 · log(P₂ / P₁)',
            groessen: [g('G_P', 'Leistungsverstärkungsmass', 'dB'),
                g('P₂', 'abgegebene Leistung', 'W'), g('P₁', 'aufgenommene Leistung', 'W')],
            loese: {
                G_P: v => 10 * Math.log10(v['P₂'] / v['P₁']),
                'P₂': v => v['P₁'] * Math.pow(10, v.G_P / 10),
                'P₁': v => v['P₂'] / Math.pow(10, v.G_P / 10)
            },
            annahme: 'Bei LEISTUNGEN steht die 10 vor dem Logarithmus, bei Spannungen die 20.',
            erklaerung: '3 dB heissen doppelte Leistung, 10 dB heissen zehnfache.'
        },
        {
            id: 'spannungspegel', kapitel: 'antenne', schreibweise: 'L_U = 20 · log(U / U₀)',
            groessen: [g('L_U', 'Spannungspegel', 'dBµV'), g('U', 'Spannung', 'µV'),
                g('U₀', 'Bezugsspannung', 'µV', 'Fest 1 µV — daher die Einheit dBµV')],
            loese: {
                L_U: v => 20 * Math.log10(v.U / v['U₀']),
                U: v => v['U₀'] * Math.pow(10, v.L_U / 20),
                'U₀': v => v.U / Math.pow(10, v.L_U / 20)
            },
            annahme: 'Bezugsspannung 1 µV. Deshalb heisst die Einheit dBµV und nicht dB.',
            erklaerung: 'Der Pegel an der Antennendose. In der Schweiz liegen die Sollwerte ' +
                'je nach Dienst etwa zwischen 60 und 80 dBµV.'
        },
        {
            id: 'gesamtdaempfung', kapitel: 'antenne', schreibweise: 'A_ges = A₁ + A₂ + A₃',
            groessen: [g('A_ges', 'Gesamtdämpfungsmass', 'dB'),
                g('A₁', 'Einzeldämpfung 1', 'dB'),
                g('A₂', 'Einzeldämpfung 2', 'dB'),
                g('A₃', 'Einzeldämpfung 3', 'dB')],
            loese: {
                A_ges: v => v['A₁'] + v['A₂'] + v['A₃'],
                'A₁': v => v.A_ges - v['A₂'] - v['A₃'],
                'A₂': v => v.A_ges - v['A₁'] - v['A₃'],
                'A₃': v => v.A_ges - v['A₁'] - v['A₂']
            },
            annahme: 'Wer weniger als drei Glieder hat, setzt für die übrigen 0 ein.',
            erklaerung: 'DAS ist der Grund für Dezibel: Dämpfungen hintereinander werden ' +
                'addiert statt multipliziert.'
        },
        /* ---- Kompensation ---------------------------------------------------- */
        {
            id: 'kompensation-q', kapitel: 'kompen', schreibweise: 'Q_C = P · (tan φ₁ − tan φ₂)',
            groessen: [g('Q_C', 'Kondensatorleistung', 'var'), g('P', 'Wirkleistung', 'W'),
                g('tanφ₁', 'tan φ vorher', ''), g('tanφ₂', 'tan φ nachher', '')],
            loese: {
                Q_C: v => v.P * (v['tanφ₁'] - v['tanφ₂']),
                P: v => v.Q_C / (v['tanφ₁'] - v['tanφ₂']),
                'tanφ₁': v => v.Q_C / v.P + v['tanφ₂'],
                'tanφ₂': v => v['tanφ₁'] - v.Q_C / v.P
            },
            erklaerung: 'Wie viel Kondensatorleistung nötig ist, um den cos φ zu verbessern.'
        },
        {
            id: 'kompensation-c', kapitel: 'kompen', schreibweise: 'C = Q_C / (2 · π · f · U²)',
            groessen: [g('C', 'Kapazität', 'F'), g('Q_C', 'Kondensatorleistung', 'var'),
                g('f', 'Frequenz', 'Hz'), g('U', 'Spannung', 'V')],
            loese: {
                C: v => v.Q_C / (2 * PI * v.f * v.U * v.U),
                Q_C: v => v.C * 2 * PI * v.f * v.U * v.U,
                U: v => WURZEL(v.Q_C / (2 * PI * v.f * v.C)),
                f: v => v.Q_C / (2 * PI * v.C * v.U * v.U)
            },
            erklaerung: 'Aus der Blindleistung die Kapazität des Kondensators.'
        }
    ];
    const LISTE = EINGEBAUT.slice();
    const alle = () => LISTE;
    const holen = (id) => LISTE.find(f => f.id === id) || null;
    const imKapitel = (k) => LISTE.filter(f => f.kapitel === k);
    const kapitel = () => KAPITEL.slice();
    const kapitelName = (id) => (KAPITEL.find(k => k[0] === id) || [id, id, ''])[1];
    /** Eine eigene Formel anmelden — für spätere Erweiterungen. */
    const melde = (f) => {
        if (!f || !f.id || LISTE.some(x => x.id === f.id))
            return false;
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
    const suche = (q) => {
        const s = String(q || '').trim().toLowerCase();
        if (!s)
            return LISTE;
        return LISTE.filter(f => f.schreibweise.toLowerCase().includes(s) ||
            f.erklaerung.toLowerCase().includes(s) ||
            kapitelName(f.kapitel).toLowerCase().includes(s) ||
            f.groessen.some(x => x.zeichen.toLowerCase().includes(s) ||
                x.name.toLowerCase().includes(s) ||
                (x.was || '').toLowerCase().includes(s)));
    };
    /** Nach welchen Grössen lässt sich diese Formel auflösen? */
    const loesbarNach = (id) => {
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
    const rechne = (id, gesucht, werte) => {
        const f = holen(id);
        if (!f)
            return { ok: false, fehler: 'Diese Formel gibt es nicht.' };
        const auf = f.loese[gesucht];
        if (!auf)
            return { ok: false, fehler: `Nach ${gesucht} lässt sich diese Formel nicht auflösen. Möglich: ` +
                    Object.keys(f.loese).join(', ') + '.' };
        /* Erst nachsehen, ob alles da ist — sonst rechnet man mit undefined
           und bekommt NaN, ohne zu wissen, welche Zahl fehlte. */
        const gebraucht = f.groessen.map(x => x.zeichen).filter(x => x !== gesucht);
        const fehlend = gebraucht.filter(x => werte[x] === undefined || werte[x] === null || !isFinite(Number(werte[x])));
        if (fehlend.length)
            return { ok: false, fehler: 'Es fehlt noch: ' + fehlend.join(', ') + '.' };
        const zahlen = {};
        Object.keys(werte).forEach(k => { zahlen[k] = Number(werte[k]); });
        let wert;
        try {
            wert = auf(zahlen);
        }
        catch {
            return { ok: false, fehler: 'Das lässt sich mit diesen Werten nicht rechnen.' };
        }
        if (!isFinite(wert))
            return { ok: false, fehler: 'Das ergibt keine Zahl — vermutlich wird durch null geteilt.' };
        const einheit = (f.groessen.find(x => x.zeichen === gesucht) || { einheit: '' }).einheit;
        const weg = f.weg && f.weg[gesucht]
            ? f.weg[gesucht](zahlen, Math.round(wert * 10000) / 10000)
            : [f.schreibweise, `${gesucht} = ${Math.round(wert * 10000) / 10000} ${einheit}`.trim()];
        return { ok: true, wert, einheit, weg };
    };
    return { KAPITEL, alle, holen, imKapitel, kapitel, kapitelName, suche,
        loesbarNach, rechne, melde };
})();
