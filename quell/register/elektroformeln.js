"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/elektroformeln.ts (npm run bauen:ts). */
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
        ['akku', 'Akkumulator und Batterie', '▮'],
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
        ['antenne', 'Antenne und Pegel', '📡'],
        ['gleichrichter', 'Gleichrichter', '⇉'],
        ['elektronik', 'Elektronische Schaltungen', '▷'],
        ['spulen', 'Drahtlängen von Spulen', '◎']
    ];
    const g = (zeichen, name, einheit, was) => was === undefined ? { zeichen, name, einheit } : { zeichen, name, einheit, was };
    const BUCHKAPITEL = [
        [1, 'Grundformeln Quickie'],
        [2, 'Grundlagen Elektrotechnik'],
        [3, 'Schaltungen von Widerständen'],
        [4, 'Messtechnik'],
        [5, 'Elektrische Energie, Leistung, Wirkungsgrad'],
        [6, 'Kompensation der Blindleistung'],
        [7, 'Chemische Spannungsquellen (Batterien)'],
        [8, 'Kondensator'],
        [9, 'Magnetische Grössen'],
        [10, 'Grundlagen der Wechselstromtechnik'],
        [11, 'Wechselstromwiderstände'],
        [12, 'Dreiphasenwechselstrom (Drehstrom)'],
        [13, 'Transformatoren'],
        [14, 'Motoren'],
        [15, 'Spannungsfall und Leistungsverlust'],
        [16, 'Antenneninstallation'],
        [17, 'Beleuchtungstechnik'],
        [18, 'Elektronische Bauelemente'],
        [19, 'Gleichrichter'],
        [20, 'Elektronische Schaltungen'],
        [21, 'Logische Verknüpfungen'],
        [22, 'Mathematik'],
        [23, 'Drahtlängen von Spulen'],
        [24, 'Physik'],
        [25, 'Wichtige Konstanten'],
        [26, 'Beziehungen zwischen Einheiten'],
        [27, 'Zehnerpotenzen und Einheitsvorsätze'],
        [28, 'Werkstoffwerte'],
        [29, 'Grössen und Einheiten'],
    ];
    const LETZTE_SEITE = 36;
    const ABSCHNITTE = [
        {
            id: 's02-widerstaende', seite: 2, buch: 1,
            titel: 'Widerstände',
            groessen: [],
            zeilen: [
                { f: 'Allgemeines: R = U / I', id: 'ohm' },
                { f: 'Allgemeines: R = ρ · l / A', id: 'leiterwiderstand' },
                { f: 'Allgemeines: R = U² / P', id: 'leistung-ur' },
                { f: 'Allgemeines: R = P / I²', id: 'leistung-ir' },
                { f: 'Reihenschaltung: R = R₁ + R₂ + R₃ + … + Rₙ', id: 'reihe-r' },
                { f: 'Reihenschaltung: U = U₁ + U₂ + U₃ + … + Uₙ' },
                { f: 'Reihenschaltung: U₁ / U₂ = R₁ / R₂', id: 'reihe-teiler' },
                { f: 'Parallelschaltung: 1 / R = 1/R₁ + 1/R₂ + 1/R₃ + … + 1/Rₙ' },
                { f: 'Parallelschaltung: I = I₁ + I₂ + I₃ + … + Iₙ', id: 'parallel-i' },
                { f: 'Parallelschaltung: I₁ / I₂ = R₂ / R₁', id: 'stromteiler' },
                { f: 'Parallelschaltung: R = 1 / (1/R₁ + 1/R₂ + 1/R₃ + … + 1/Rₙ)' },
                { f: 'Parallelschaltung: R = (R₁ · R₂) / (R₁ + R₂)', id: 'parallel-r2' },
                { f: 'Temperatureinfluss: ΔR = R₂₀ · α · Δϑ' },
                { f: 'Temperatureinfluss: R_ϑ = R₂₀ · (1 + α · Δϑ)', id: 'temperatur' }
            ]
        },
        {
            id: 's02-leistung', seite: 2, buch: 1,
            titel: 'Leistung (ohmsch und mechanisch)',
            groessen: [],
            zeilen: [
                { f: 'P = U · I', id: 'leistung-ui' },
                { f: 'P = U² / R', id: 'leistung-ur' },
                { f: 'P = I² · R', id: 'leistung-ir' },
                { f: 'P = (n · 3600 s/h) / (t · C_Z)' },
                { f: 'η = P_ab / P_zu', id: 'wirkungsgrad' },
                { f: 'P₂ = P₁ · (U₂ / U₁)²' },
                { f: 'P = (F · s) / t' },
                { f: 'P = (m · g · h) / t', id: 'hubleistung' },
                { f: 'P = M · 2 · π · n', id: 'motorleistung' }
            ]
        },
        {
            id: 's02-energie-arbeit-kosten', seite: 2, buch: 1,
            titel: 'Energie, Arbeit, Kosten',
            groessen: [],
            zeilen: [
                { f: 'W = P · t', id: 'arbeit' },
                { f: 'K = k · W', id: 'kosten' },
                { f: 'W = F · s' },
                { f: 'W = m · g · h' },
                { f: 'η = W_ab / W_zu' }
            ]
        },
        {
            id: 's02-elektrowaerme', seite: 2, buch: 1,
            titel: 'Elektrowärme',
            groessen: [],
            zeilen: [
                { f: 'P · t · η = m · c · Δϑ', id: 'waerme-elektrisch' },
                { f: 'W · η = Q' },
                { f: 'Q = m · c · Δϑ', id: 'waermemenge' }
            ]
        },
        {
            id: 's02-spannungsquellen', seite: 2, buch: 1,
            titel: 'Spannungsquellen',
            groessen: [],
            zeilen: [
                { f: 'U = U₀ − U_Ri', id: 'quelle-innerer-abfall' },
                { f: 'U_Ri = Rᵢ · I' },
                { f: 'I = U₀ / (Rᵢ + R_L)', id: 'quellstrom' },
                { f: 'Reihenschaltung: U₀ = n · U₀₁', id: 'elemente-reihe-spannung' },
                { f: 'Reihenschaltung: Rᵢ = n · Rᵢ₁', id: 'elemente-reihe-widerstand' },
                { f: 'Parallelschaltung: U₀ = U₀₁' },
                { f: 'Parallelschaltung: Rᵢ = Rᵢ₁ / n', id: 'elemente-parallel-widerstand' }
            ]
        },
        {
            id: 's02-kondensator', seite: 2, buch: 1,
            titel: 'Kondensator',
            groessen: [],
            zeilen: [
                { f: 'Parallelschaltung: C = C₁ + C₂ + C₃ + … + Cₙ', id: 'kondensator-parallel' },
                { f: 'Reihenschaltung: C = 1 / (1/C₁ + 1/C₂ + 1/C₃ + … + 1/Cₙ)' },
                { f: 'Plattenkondensator: C = ε₀ · εᵣ · A / l', id: 'plattenkondensator' }
            ]
        },
        {
            id: 's02-kompensation', seite: 2, buch: 1,
            titel: 'Kompensation',
            groessen: [],
            zeilen: [
                { f: 'Q_C = P · (tan φ₁ − tan φ₂)', id: 'kompensation-q' },
                { f: 'X_C = U² / Q_C' },
                { f: 'C = 1 / (2 · π · f · X_C)', id: 'blindwiderstand-c' },
                { f: 'C = Q_C / (2 · π · f · U²)', id: 'kompensation-c' }
            ]
        },
        {
            id: 's03-wechselstrom', seite: 3, buch: 1,
            titel: 'Wechselstrom',
            groessen: [],
            zeilen: [
                { f: 'û = √2 · U', id: 'scheitelwert' },
                { f: 'u = û · sin α', id: 'momentanwert' },
                { f: 'T = 1 / f', id: 'periodendauer' },
                { f: 'Z = U / I', id: 'impedanz' },
                { f: 'X_L = 2 · π · f · L', id: 'blindwiderstand-l' },
                { f: 'X_C = 1 / (2 · π · f · C)', id: 'blindwiderstand-c' },
                { f: 'S = U · I', id: 'scheinleistung' },
                { f: 'S = U² / Z', id: 'scheinleistung-z' },
                { f: 'cos φ = P / S', id: 'cosphi-leistung' },
                { f: 'sin φ = Q / S', id: 'sinphi-leistung' },
                { f: 'P = U · I · cos φ', id: 'wirkleistung-cos' },
                { f: 'P = S · cos φ' },
                { f: 'P = √(S² − Q²)', id: 'wirkleistung-dreieck' },
                { f: 'Q = U · I · sin φ', id: 'blindleistung' },
                { f: 'Q = S · sin φ' },
                { f: 'Q = √(S² − P²)' },
                { f: 'Reihenschaltung: Z = √(R² + X²)', id: 'impedanz-reihe' },
                { f: 'Reihenschaltung: Z = √(R² + (X_L − X_C)²)', id: 'impedanz-reihe-rlc' },
                { f: 'Reihenschaltung: cos φ = R / Z', id: 'cosphi-reihe' },
                { f: 'Reihenschaltung: U = √(U_w² + U_b²)', id: 'spannung-reihe-ac' },
                { f: 'Reihenschaltung: U = √(U_w² + (U_bL − U_bC)²)' },
                { f: 'Reihenschaltung: sin φ = X / Z' },
                { f: 'Parallelschaltung: Z = 1 / √(1/R² + 1/X²)', id: 'impedanz-parallel' },
                { f: 'Parallelschaltung: Z = 1 / √(1/R² + (1/X_L − 1/X_C)²)', id: 'impedanz-reihe-rlc' },
                { f: 'Parallelschaltung: cos φ = Z / R', id: 'cosphi-parallel' },
                { f: 'Parallelschaltung: I = √(I_w² + I_b²)', id: 'strom-parallel-ac' },
                { f: 'Parallelschaltung: I = √(I_w² + (I_bL − I_bC)²)' },
                { f: 'Parallelschaltung: sin φ = Z / X' }
            ]
        },
        {
            id: 's03-drehstrom', seite: 3, buch: 1,
            titel: 'Drehstrom',
            groessen: [],
            zeilen: [
                { f: 'S = √3 · U · I', id: 'dreh-schein' },
                { f: 'P = √3 · U · I · cos φ', id: 'dreh-wirk' },
                { f: 'Q = √3 · U · I · sin φ', id: 'dreh-blindleistung' },
                { f: 'P = √(S² − Q²)', id: 'wirkleistung-dreieck' },
                { f: 'Sternschaltung: U = √3 · U_Str' },
                { f: 'Sternschaltung: I = I_Str' },
                { f: 'Sternschaltung: S_Y = U² / Z', id: 'stern-scheinleistung' },
                { f: 'Dreieckschaltung: U = U_Str' },
                { f: 'Dreieckschaltung: I = √3 · I_Str' },
                { f: 'Dreieckschaltung: S_Δ = 3 · U² / Z', id: 'dreieck-scheinleistung' }
            ]
        },
        {
            id: 's03-lichttechnik', seite: 3, buch: 1,
            titel: 'Lichttechnik',
            groessen: [],
            zeilen: [
                { f: 'Anzahl Leuchten: n = (E · A · p) / (Φ_L · η_B)', id: 'leuchtenzahl' },
                { f: 'Beleuchtungsstärke: E = Φ_N / A = (n · Φ_L · η_B) / A', id: 'beleuchtungsstaerke' },
                { f: 'η = Φ_L / P_L', id: 'lichtausbeute' },
                { f: 'Φ_N = Φ · η_B', id: 'nutzlichtstrom' },
                { f: 'η_B = η_LB · η_R', id: 'betriebswirkungsgrad' },
                { f: 'Punktförmige Lichtquelle: E₂ ≈ E₁ · (r₁ / r₂)²', id: 'abstandsgesetz' },
                { f: 'Bandförmige Lichtquelle: E₂ ≈ E₁ · r₁ / r₂', id: 'abstandsgesetz-band' }
            ]
        },
        {
            id: 's03-transformator', seite: 3, buch: 1,
            titel: 'Transformator (verlustfrei)',
            groessen: [],
            zeilen: [
                { f: 'U₁ / U₂ = N₁ / N₂ = ü', id: 'trafo-uebersetzung' },
                { f: 'I₁ / I₂ = U₂ / U₁ = N₂ / N₁', id: 'trafo-strom' },
                { f: 'S_N = U₂ · I₂' },
                { f: 'S = √3 · U₂ · I₂' }
            ]
        },
        {
            id: 's03-motor', seite: 3, buch: 1,
            titel: 'Motor',
            groessen: [],
            zeilen: [
                { f: 'n_S = (f · 60 s/min) / p', id: 'synchrondrehzahl' },
                { f: 's = ((n_S − n) / n_S) · 100%' }
            ]
        },
        {
            id: 'g-ohm', seite: 4, buch: 2,
            titel: 'Ohmsches Gesetz',
            groessen: [g('U', 'Spannung', 'V'), g('I', 'Stromstärke', 'A'), g('R', 'Widerstand', 'Ω')],
            zeilen: [
                { f: 'I = U / R', id: 'ohm' },
                { f: 'U = R · I', id: 'ohm' },
                { f: 'R = U / I', id: 'ohm' }
            ]
        },
        {
            id: 'g-leiter', seite: 4, buch: 2,
            titel: 'Leiterwiderstand',
            groessen: [g('R', 'Leiterwiderstand', 'Ω'), g('A', 'Leiterquerschnitt', 'mm²'), g('d', 'Leiterdurchmesser', 'mm'), g('l', 'Leiterlänge', 'm'), g('ρ', 'spez. Widerstand', 'Ω·mm²/m'), g('γ', 'Leitfähigkeit', 'm/(Ω·mm²)')],
            zeilen: [
                { f: 'R = ρ · l / A', id: 'leiterwiderstand' },
                { f: 'ρ = R · A / l', id: 'leiterwiderstand' },
                { f: 'l = R · A / ρ', id: 'leiterwiderstand' },
                { f: 'd = √(4 · A / π)', id: 'leiterquerschnitt-d' },
                { f: 'A = ρ · l / R', id: 'leiterwiderstand' },
                { f: 'A = d² · π / 4', id: 'leiterquerschnitt-d' },
                { f: 'ρ = 1 / γ', id: 'leitfaehigkeit' },
                { f: 'γ = 1 / ρ', id: 'leitfaehigkeit' }
            ]
        },
        {
            id: 'g-leitwert', seite: 4, buch: 2,
            titel: 'Widerstand und Leitwert',
            groessen: [g('G', 'Leitwert', 'S'), g('R', 'Leiterwiderstand', 'Ω')],
            zeilen: [
                { f: 'G = 1 / R', id: 'leitwert' },
                { f: 'R = 1 / G', id: 'leitwert' },
                { f: '1 S = 1 / Ω' }
            ]
        },
        {
            id: 'g-stromdichte', seite: 4, buch: 2,
            titel: 'Stromdichte',
            groessen: [g('J', 'Stromdichte', 'A/mm²'), g('I', 'Stromstärke', 'A'), g('A', 'Leiterquerschnitt', 'mm²')],
            zeilen: [
                { f: 'J = I / A', id: 'stromdichte' },
                { f: 'I = J · A', id: 'stromdichte' },
                { f: 'A = I / J', id: 'stromdichte' }
            ]
        },
        {
            id: 'g-temperatur', seite: 4, buch: 2,
            titel: 'Widerstand und Temperatur',
            groessen: [g('R₂₀', 'Widerstand bei der Temperatur 20 °C', 'Ω'), g('R_ϑ', 'Widerstand bei der Temperatur ϑ', 'Ω'), g('ΔR', 'Widerstanddifferenz', 'Ω'), g('Δϑ', 'Temperaturdifferenz', 'K'), g('ϑ', 'Endtemperatur', '°C'), g('α', 'Temperaturkoeffizient', '1/K')],
            zeilen: [
                { f: 'ΔR = R₂₀ · α · Δϑ' },
                { f: 'α = ΔR / (R₂₀ · Δϑ)' },
                { f: 'R_ϑ = R₂₀ + ΔR' },
                { f: 'R_ϑ = R₂₀ · (1 + α · Δϑ)', id: 'temperatur' },
                { f: 'R₂₀ = ΔR / (α · Δϑ)' },
                { f: 'R₂₀ = R_ϑ / (1 + α · Δϑ)' },
                { f: 'Δϑ = ΔR / (R₂₀ · α)' },
                { f: 'Δϑ = (R_ϑ − R₂₀) / (R₂₀ · α)' },
                { f: 'Δϑ = ϑ − 20 °C' }
            ],
            tabelle: [
                ['Temperaturkoeffizient α', '', ''],
                ['Kupfer', '0,0039', '1/K'],
                ['Aluminium', '0,004', '1/K'],
                ['Wolfram', '0,0046', '1/K']
            ]
        },
        {
            id: 's-reihe', seite: 5, buch: 3,
            titel: 'Reihenschaltung',
            groessen: [g('R', 'Gesamtwiderstand', 'Ω'), g('R₁, R₂, R₃', 'Einzelwiderstände', 'Ω'), g('U', 'Gesamtspannung', 'V'), g('U₁, U₂, U₃', 'Einzelspannungen', 'V'), g('I', 'Stromstärke', 'A')],
            zeilen: [
                { f: 'I = U / (R₁ + R₂ + R₃)' },
                { f: 'U₁ = I · R₁' },
                { f: 'R = R₁ + R₂ + R₃', id: 'reihe-r' },
                { f: 'U = U₁ + U₂ + U₃' },
                { f: 'R₁ = R − R₂ − R₃' },
                { f: 'U₁ = U − U₂ − U₃' },
                { f: 'R = n · R₁' }
            ]
        },
        {
            id: 's05-maschenregel', seite: 5, buch: 3,
            titel: 'Maschenregel',
            groessen: [g('U₀₁, U₀₂', 'Erzeugerspannungen', 'V'), g('U₁, U₂, U₃', 'Verbraucherspannungen', 'V')],
            zeilen: [
                { f: 'ΣU_Erzeuger = ΣU_Verbraucher' },
                { f: 'U₀₁ + U₀₂ = U₁ + U₂ + U₃' },
                { f: 'U₀₁ = U₁ + U₂ + U₃ − U₀₂' },
                { f: 'U₁ = U₀₁ + U₀₂ − U₂ − U₃' }
            ]
        },
        {
            id: 's-parallel', seite: 5, buch: 3,
            titel: 'Parallelschaltung',
            groessen: [g('R', 'Gesamtwiderstand', 'Ω'), g('R₁, R₂, R₃', 'Einzelwiderstände', 'Ω'), g('I', 'Gesamtstrom', 'A'), g('I₁, I₂, I₃', 'Einzelströme', 'A'), g('U', 'Spannung', 'V')],
            zeilen: [
                { f: 'I = I₁ + I₂ + I₃', id: 'parallel-i' },
                { f: 'I₁ = I − I₂ − I₃' },
                { f: 'R = 1 / (1/R₁ + 1/R₂ + 1/R₃)' },
                { f: 'R₁ = 1 / (1/R − 1/R₂ − 1/R₃)' },
                { f: 'R = (R₁ · R₂) / (R₁ + R₂)', id: 'parallel-r2' },
                { f: 'R₁ = (R₂ · R) / (R₂ − R)', id: 'parallel-r2' },
                { f: 'R = R₁ / n' }
            ]
        },
        {
            id: 's05-knotenregel', seite: 5, buch: 3,
            titel: 'Knotenregel',
            groessen: [g('I₁, I₂', 'zufliessende Ströme', 'A'), g('I₃, I₄, I₅', 'abfliessende Ströme', 'A')],
            zeilen: [
                { f: 'ΣI_zufliessend = ΣI_abfliessend' },
                { f: 'I₁ + I₂ = I₃ + I₄ + I₅' },
                { f: 'I₁ = I₃ + I₄ + I₅ − I₂' },
                { f: 'I₃ = I₁ + I₂ − I₄ − I₅' }
            ]
        },
        {
            id: 's05-gemischte-widerstandsschaltungen', seite: 5, buch: 3,
            titel: 'Gemischte Widerstandsschaltungen',
            groessen: [],
            zeilen: [
                { f: 'R = R₁ · (R₂ + R₃) / (R₁ + R₂ + R₃)' },
                { f: 'R = R₁ + (R₂ · R₃) / (R₂ + R₃)' }
            ]
        },
        {
            id: 's-teiler', seite: 6, buch: 3,
            titel: 'Unbelasteter Spannungsteiler',
            groessen: [g('U', 'Gesamtspannung', 'V'), g('U₂', 'Teilspannung', 'V'), g('R', 'Gesamtwiderstand', 'Ω'), g('R₁, R₂', 'Teilwiderstände', 'Ω'), g('I', 'Stromstärke', 'A')],
            zeilen: [
                { f: 'I = U / (R₁ + R₂)' },
                { f: 'I = U₂ / R₂' },
                { f: 'U₂ = (U · R₂) / (R₁ + R₂)', id: 'spannungsteiler' },
                { f: 'U₂ = I · R₂' },
                { f: 'R₂ = (U₂ · R₁) / (U − U₂)', id: 'spannungsteiler' },
                { f: 'R₂ = U₂ / I' }
            ]
        },
        {
            id: 's-teiler-last', seite: 6, buch: 3,
            titel: 'Belasteter Spannungsteiler',
            groessen: [g('I', 'Gesamtstrom', 'A'), g('I₂, I₃', 'Teilströme', 'A'), g('U', 'Gesamtspannung', 'V'), g('U₂', 'Teilspannung', 'V'), g('R', 'Gesamtwiderstand', 'Ω'), g('R₁, R₂, R₃', 'Teilwiderstände', 'Ω')],
            zeilen: [
                { f: 'U₂ = (U · R₂₃) / (R₁ + R₂₃)', id: 'spannungsteiler-belastet' },
                { f: 'U₂ = I · R₂₃' },
                { f: 'U = (U₂ · (R₁ + R₂₃)) / R₂₃', id: 'spannungsteiler-belastet' },
                { f: 'I = U / (R₁ + R₂₃)' },
                { f: 'I = I₂ + I₃', id: 'parallel-i' },
                { f: 'I₂ = I − I₃' },
                { f: 'I₃ = I − I₂' },
                { f: 'I₂ = U₂ / R₂' },
                { f: 'I₃ = U₂ / R₃' },
                { f: 'R₂₃ = (R₂ · R₃) / (R₂ + R₃)' }
            ]
        },
        {
            id: 's-bruecke', seite: 6, buch: 3,
            titel: 'Brückenschaltung',
            groessen: [g('U_B', 'Brückenspannung', 'V'), g('R_X', 'gesuchter Widerstand', 'Ω'), g('R₂, R₃, R₄', 'Teilwiderstände', 'Ω')],
            zeilen: [
                { f: 'R_X / R₂ = R₃ / R₄' },
                { f: 'R_X = R₂ · R₃ / R₄', id: 'bruecke' }
            ]
        },
        {
            id: 'm-digital', seite: 6, buch: 4,
            titel: 'Digitale Messgeräte',
            groessen: [g('MW', 'angezeigter Messwert', ''), g('k', 'Genauigkeitsklasse', '%'), g('z', 'Anzeige Unsicherheit der letzten Anzeigestelle', 'Digit'), g('a', 'Auflösung, Stellenwert der letzten Anzeigestelle', ''), g('AF_abs', 'absoluter Anzeigefehler', ''), g('AF_%', 'prozentualer oder relativer Anzeigefehler', '%')],
            zeilen: [
                { f: 'AF_abs = (MW · k) / 100 + z · a', id: 'digital-anzeigefehler' },
                { f: 'AF_% = (AF_abs · 100%) / MW' }
            ]
        },
        {
            id: 's06-messgeraetekategorien', seite: 6, buch: 4,
            titel: 'Messgerätekategorien',
            groessen: [],
            zeilen: [],
            tabelle: [
                ['Kategorie', 'Bedeutung'],
                ['CAT I', 'Messungen an Stromkreisen, die keine direkte Verbindung zum Netz haben.'],
                ['CAT II', 'Messungen an Stromkreisen, die eine direkte Verbindung mittels Stecker mit dem Niederspannungsnetz haben.'],
                ['CAT III', 'Messungen innerhalb der Gebäudeinstallation.'],
                ['CAT IV', 'Messungen an der Quelle der Niederspannungsinstallation.']
            ]
        },
        {
            id: 'm-vmeter', seite: 7, buch: 2,
            titel: 'Messbereicherweiterung von V-Metern',
            groessen: [g('U', 'erweiterter Messbereich', 'V'), g('Uₘ', 'Messwerkspannung bei Vollausschlag', 'V'), g('Rₘ', 'Messwerkwiderstand', 'Ω'), g('R_V', 'Vorwiderstand', 'Ω'), g('Iₘ', 'Messwerkstromstärke bei Vollausschlag', 'A'), g('n', 'Faktor der Messbereichserweiterung', '')],
            zeilen: [
                { f: 'R_V = (n − 1) · Rₘ', id: 'mess-vorwiderstand' },
                { f: 'R_V = Rₘ · (U − Uₘ) / Uₘ', id: 'mess-vorwiderstand-u' },
                { f: 'Rₘ = Uₘ / Iₘ' },
                { f: 'Iₘ = Uₘ / Rₘ' },
                { f: 'U_V = U − Uₘ' },
                { f: 'U = Uₘ + U_V' },
                { f: 'n = U / Uₘ', id: 'mess-faktor-v' },
                { f: 'U = Uₘ · (1 + R_V / Rₘ)', id: 'mess-vorwiderstand-u' }
            ]
        },
        {
            id: 'm-ameter', seite: 7, buch: 2,
            titel: 'Messbereicherweiterung von A-Metern',
            groessen: [g('I', 'erweiterter Messbereich', 'A'), g('Iₘ', 'Messwerkstromstärke bei Vollausschlag', 'A'), g('Rₘ', 'Messwerkwiderstand', 'Ω'), g('Rₚ', 'Parallelwiderstand (Shunt)', 'Ω'), g('Uₘ', 'Messwerkspannung bei Vollausschlag', 'V'), g('n', 'Faktor der Messbereichserweiterung', '')],
            zeilen: [
                { f: 'Rₚ = Rₘ / (n − 1)', id: 'mess-shunt' },
                { f: 'Rₚ = Rₘ · Iₘ / (I − Iₘ)', id: 'mess-shunt-i' },
                { f: 'Rₘ = Uₘ / Iₘ' },
                { f: 'Uₘ = Iₘ · Rₘ' },
                { f: 'Iₚ = I − Iₘ' },
                { f: 'I = Iₘ + Iₚ', id: 'mess-faktor-a' },
                { f: 'n = I / Iₘ', id: 'mess-faktor-a' },
                { f: 'I = Iₘ · (1 + Rₘ / Rₚ)' }
            ]
        },
        {
            id: 'm-spannungsfehler', seite: 7, buch: 2,
            titel: 'Spannungsfehlerschaltung',
            groessen: [g('I', 'gemessene Stromstärke', 'A'), g('U', 'gemessene Spannung', 'V'), g('U_A', 'Spannung am A-Meter', 'V'), g('U_R', 'Verbraucherspannung', 'V'), g('R_A', 'Innenwiderstand A-Meter', 'Ω'), g('R', 'Verbraucherwiderstand', 'Ω')],
            zeilen: [
                { f: 'U_R = U − I · R_A' },
                { f: 'U_A = I · R_A' },
                { f: 'R = U / I − R_A', id: 'mess-spannungsfehler' },
                { f: 'R = (U − U_A) / I' }
            ]
        },
        {
            id: 'm-stromfehler', seite: 7, buch: 2,
            titel: 'Stromfehlerschaltung',
            groessen: [g('I', 'gemessene Stromstärke', 'A'), g('U', 'gemessene Spannung', 'V'), g('I_V', 'Strom durch das V-Meter', 'A'), g('I_R', 'Verbraucherstrom', 'A'), g('R_V', 'Innenwiderstand V-Meter', 'Ω'), g('R', 'Verbraucherwiderstand', 'Ω')],
            zeilen: [
                { f: 'I_R = I − U / R_V' },
                { f: 'I_V = U / R_V', id: 'mess-vmeter-strom' },
                { f: 'R = U / (I − I_V)', id: 'mess-stromfehler' }
            ]
        },
        {
            id: 'm-analog', seite: 7, buch: 2,
            titel: 'Analoge Messgeräte',
            groessen: [g('MW', 'Messwert', ''), g('MB', 'Messbereich (Skalenendwert)', ''), g('Rₘ', 'Messwerkwiderstand', 'Ω'), g('rₖ', 'Kennwiderstand', 'Ω/V'), g('k', 'Genauigkeitsklasse', ''), g('AF_abs', 'absoluter Anzeigefehler', ''), g('AF_%', 'prozentualer oder relativer Anzeigefehler', '%')],
            zeilen: [
                { f: 'AF_abs = MB · k / 100', id: 'mess-anzeigefehler' },
                { f: 'AF_% = AF_abs · 100% / MW' },
                { f: 'AF_% = MB · k / MW', id: 'mess-anzeigefehler-prozent' },
                { f: 'Rₘ = MB · rₖ', id: 'mess-innenwiderstand' }
            ],
            tabelle: [
                ['Symbol', 'Bedeutung'],
                ['Stern', 'Prüfspannung 500 V'],
                ['Stern mit 2', 'Prüfspannung 2 kV'],
                ['Dreieck mit Ausrufezeichen', 'Achtung! Gebrauchsanweisung beachten.'],
                ['senkrechter Strich auf Grundlinie', 'senkrechte Gebrauchslage'],
                ['waagrechte Winkelklammer', 'waagrechte Gebrauchslage'],
                ['Winkel mit 60°', 'schräge Gebrauchslage'],
                ['Drehspul-Zeichen', 'Drehspulmesswerk (nur für Gleichstrom)'],
                ['Dreheisen-Zeichen', 'Dreheisenmesswerk (für Gleich- und Wechselstrom)'],
                ['elektrodynamisches Zeichen', 'Elektrodynamisches Messwerk (für Gleich- und Wechselstrom)']
            ]
        },
        {
            id: 'a-arbeit', seite: 8, buch: 5,
            titel: 'Elektrische Arbeit (Energie) und Energiekosten',
            groessen: [g('W', 'Arbeit (Energie)', 'Ws, kWh'), g('P', 'Leistung', 'W, kW'), g('t', 'Zeit', 's, h'), g('U', 'Spannung', 'V'), g('I', 'Stromstärke', 'A'), g('K', 'Energiekosten', 'Fr'), g('k', 'Preis / kWh', 'Fr/kWh'), g('t', 'Zeit', 'h')],
            zeilen: [
                { f: 'W = U · I · t' },
                { f: 'W = P · t', id: 'arbeit' },
                { f: 'U = W / (I · t)' },
                { f: 'P = W / t', id: 'arbeit' },
                { f: 'I = W / (U · t)' },
                { f: 't = W / P', id: 'arbeit' },
                { f: 't = W / (U · I)' },
                { f: 't = K / (P · k)' },
                { f: 'K = W · k', id: 'kosten' },
                { f: 'K = P · t · k' }
            ],
            tabelle: [
                ['1 kWh = 3\'600 kWs'],
                ['1 kWh = 3\'600\'000 Ws'],
                ['1 Ws = 1 J = 1 Nm']
            ]
        },
        {
            id: 'a-gleich', seite: 8, buch: 5,
            titel: 'Gleichstromleistung',
            groessen: [g('P', 'Leistung', 'W'), g('U', 'Spannung', 'V'), g('I', 'Stromstärke', 'A'), g('R', 'Verbraucherwiderstand', 'Ω')],
            zeilen: [
                { f: 'P = U · I', id: 'leistung-ui' },
                { f: 'P = U² / R', id: 'leistung-ur' },
                { f: 'P = I² · R', id: 'leistung-ir' },
                { f: 'U = P / I', id: 'leistung-ui' },
                { f: 'U = √(P · R)', id: 'leistung-ur' },
                { f: 'I = P / U', id: 'leistung-ui' },
                { f: 'I = √(P / R)', id: 'leistung-ir' },
                { f: 'R = U² / P', id: 'leistung-ur' },
                { f: 'R = P / I²', id: 'leistung-ir' }
            ]
        },
        {
            id: 'a-wechsel', seite: 8, buch: 5,
            titel: 'Wechselstromleistung',
            groessen: [g('U', 'Spannung', 'V'), g('I', 'Stromstärke', 'A'), g('S', 'Scheinleistung', 'VA'), g('P', 'Wirkleistung', 'W'), g('Q', 'Blindleistung', 'var'), g('φ', 'Phasenverschiebungswinkel', '°'), g('cos φ', 'Wirkleistungsfaktor', ''), g('sin φ', 'Blindleistungsfaktor', '')],
            zeilen: [
                { f: 'S = U · I', id: 'scheinleistung' },
                { f: 'S = √(P² + Q²)', id: 'leistungsdreieck' },
                { f: 'P = U · I · cos φ', id: 'wirkleistung-cos' },
                { f: 'P = √(S² − Q²)', id: 'wirkleistung-dreieck' },
                { f: 'Q = U · I · sin φ', id: 'blindleistung' },
                { f: 'Q = √(S² − P²)', id: 'wirkleistung-dreieck' },
                { f: 'cos φ = P / S', id: 'cosphi-leistung' },
                { f: 'sin φ = Q / S', id: 'sinphi-leistung' },
                { f: 'S = P / cos φ' },
                { f: 'S = Q / sin φ' },
                { f: 'P = Q / tan φ', id: 'dreh-wirkleistung-q' },
                { f: 'Q = P · tan φ' },
                { f: 'U = S / I', id: 'scheinleistung' },
                { f: 'U = P / (I · cos φ)' },
                { f: 'I = S / U', id: 'scheinleistung' },
                { f: 'I = P / (U · cos φ)' }
            ]
        },
        {
            id: 's08-leistung-bei-aenderung-der-spann', seite: 8, buch: 5,
            titel: 'Leistung bei Änderung der Spannung',
            groessen: [g('P₁', 'Leistung bei der Spannung U₁', ''), g('P₂', 'Leistung bei der Spannung U₂', '')],
            zeilen: [
                { f: 'P₂ = P₁ · (U₂ / U₁)²' },
                { f: 'U₂ = U₁ · √(P₂ / P₁)' }
            ]
        },
        {
            id: 's08-leistung-bei-aenderung-der-strom', seite: 8, buch: 5,
            titel: 'Leistung bei Änderung der Stromstärke',
            groessen: [g('P₁', 'Leistung bei der Stromstärke I₁', ''), g('P₂', 'Leistung bei der Stromstärke I₂', '')],
            zeilen: [
                { f: 'P₂ = P₁ · (I₂ / I₁)²' },
                { f: 'I₂ = I₁ · √(P₂ / P₁)' }
            ]
        },
        {
            id: 's09-leistungsbestimmung-mit-dem-zaeh', seite: 9, buch: 5,
            titel: 'Leistungsbestimmung mit dem Zähler',
            groessen: [g('P', 'Leistung', 'kW'), g('C_Z', 'Zählerkonstante', '1/kWh'), g('n', 'Anzahl Ankerumdrehungen oder Impulse in der Zeit t', ''), g('t', 'Zeit', 's')],
            zeilen: [
                { f: 'P = n · 3600 s/h / (t · C_Z)' },
                { f: 't = n · 3600 s/h / (P · C_Z)' },
                { f: 'C_Z = n · 3600 s/h / (P · t)' },
                { f: 'n = C_Z · P · t / 3600 s/h' }
            ]
        },
        {
            id: 'a-wirkungsgrad', seite: 9, buch: 5,
            titel: 'Wirkungsgrad',
            groessen: [g('P₁', 'zugeführte Leistung', 'W'), g('P₂', 'abgegebene Leistung', 'W'), g('P_V', 'Verlustleistung', 'W'), g('η', 'Wirkungsgrad', ''), g('W₁', 'zugeführte Energie', 'Wh'), g('W₂', 'abgegebene Arbeit', 'Wh'), g('W_V', 'Energieverlust', 'Wh')],
            zeilen: [
                { f: 'η = P₂ / P₁', id: 'motor-abgabe' },
                { f: 'P₁ = P₂ / η', id: 'motor-abgabe' },
                { f: 'P_V = P₁ − P₂' },
                { f: 'P₂ = P₁ · η', id: 'motor-abgabe' },
                { f: 'η = W₂ / W₁' },
                { f: 'W₁ = W₂ / η' },
                { f: 'W_V = W₁ − W₂' },
                { f: 'W₂ = W₁ · η' }
            ]
        },
        {
            id: 's09-gesamtwirkungsgrad', seite: 9, buch: 5,
            titel: 'Gesamtwirkungsgrad',
            groessen: [g('η', 'Gesamtwirkungsgrad', ''), g('η₁, η₂', 'Einzelwirkungsgrade', '')],
            zeilen: [
                { f: 'η = P₃ / P₁' },
                { f: 'η = η₁ · η₂ ···' }
            ]
        },
        {
            id: 'a-waerme', seite: 9, buch: 5,
            titel: 'Elektrowärme',
            groessen: [g('W', 'elektrische Energie', 'kWh'), g('P', 'elektrische Leistung', 'kW'), g('η', 'Wirkungsgrad', ''), g('t', 'Aufheizzeit', 's'), g('Q', 'Nutzwärme (Energie)', 'kJ'), g('m', 'Masse', 'kg'), g('Δϑ', 'Temperaturänderung', 'K'), g('c', 'spez. Wärmekapazität', 'kJ/(kg·K)')],
            zeilen: [
                { f: 'Q = W · η · 3600 s/h' },
                { f: 'P · t · η = m · c · Δϑ', id: 'waerme-elektrisch' },
                { f: 'W = m · c · Δϑ / (η · 3600 s/h)' },
                { f: 'Q = m · c · Δϑ', id: 'waermemenge' },
                { f: 'P = m · c · Δϑ / (t · η)' },
                { f: 'm = P · t · η / (c · Δϑ)' },
                { f: 't = m · c · Δϑ / (P · η)' },
                { f: 'c = P · t · η / (m · Δϑ)' },
                { f: 'η = m · c · Δϑ / (P · t)' },
                { f: 'Δϑ = P · t · η / (m · c)' },
                { f: 'c = 4,19 kJ/(kg·K)' }
            ]
        },
        {
            id: 'k-blind', seite: 10, buch: 6,
            titel: 'Kompensation der Blindleistung',
            groessen: [g('U', 'Spannung', 'V'), g('I', 'Stromstärke', 'A'), g('f', 'Frequenz', 'Hz'), g('S', 'Scheinleistung', 'VA'), g('P', 'Wirkleistung', 'W'), g('Q_L', 'induktive Blindleistung', 'var'), g('Q_C', 'kapazitive Blindleistung zur Kompensation', 'var'), g('φ', 'Phasenverschiebungswinkel', '°'), g('cos φ₁', 'Wirkleistungsfaktor vor der Kompensation', ''), g('cos φ₂', 'Wirkleistungsfaktor nach der Kompensation', ''), g('X_C', 'kapazitiver Blindwiderstand', 'Ω'), g('C', 'Kapazität des Kompensationskondensators', 'F')],
            zeilen: [
                { f: 'P = U · I · cos φ₁' },
                { f: 'Q_C = P · (tan φ₁ − tan φ₂)', id: 'kompensation-q' },
                { f: 'C = Q_C / (2 · π · f · U²)', id: 'kompensation-c' },
                { f: 'C = 1 / (2 · π · f · X_C)', id: 'blindwiderstand-c' },
                { f: 'X_C = U² / Q_C' },
                { f: 'tan φ₂ = (Q_L − Q_C) / P = (P · tan φ₁ − Q_C) / P' },
                { f: 'S₂ = P / cos φ₂' },
                { f: 'I₂ = P / (U · cos φ₂)' }
            ]
        },
        {
            id: 's10-im-drehstromnetz', seite: 10, buch: 6,
            titel: 'Im Drehstromnetz',
            groessen: [g('Q_C', 'kapazitive Blindleistung', 'var'), g('Q_C1', 'kapazitive Blindleistung pro Strang', 'var'), g('X_C1', 'kapazitiver Blindwiderstand pro Strang', 'Ω'), g('C₁', 'Kapazität eines einzelnen Kondensators', 'F')],
            zeilen: [
                { f: 'P = √3 · U · I · cos φ₁' },
                { f: 'Q_C = P · (tan φ₁ − tan φ₂)', id: 'kompensation-q' },
                { f: 'Q_C1 = Q_C / 3' },
                { f: 'C₁ = Q_C1 / (2 · π · f · U²)' },
                { f: 'X_C1 = U² / Q_C1' },
                { f: 'C₁ = 1 / (2 · π · f · X_C1)' }
            ]
        },
        {
            id: 'b-kapazitaet', seite: 11, buch: 7,
            titel: 'Kapazität von Akkumulatoren',
            groessen: [g('U_L', 'Ladespannung', 'V'), g('U_E', 'Entladespannung', 'V'), g('I_L', 'Ladestrom', 'A'), g('I_E', 'Entladestrom', 'A'), g('Q_L', 'Ladekapazität', 'Ah'), g('Q_E', 'Entladekapazität', 'Ah'), g('W_L', 'Ladeenergie', 'Wh'), g('W_E', 'Entladeenergie', 'Wh'), g('t_L', 'Ladezeit', 'h'), g('t_E', 'Entladezeit', 'h'), g('η_Ah', 'Ladungswirkungsgrad', ''), g('η_Wh', 'Energiewirkungsgrad', '')],
            zeilen: [
                { f: 'Q_L = I_L · t_L', id: 'akku-ladekapazitaet' },
                { f: 'Q_E = I_E · t_E', id: 'akku-entladekapazitaet' },
                { f: 'I_L = Q_L / t_L', id: 'akku-ladekapazitaet' },
                { f: 'I_E = Q_E / t_E', id: 'akku-entladekapazitaet' },
                { f: 't_L = Q_L / I_L', id: 'akku-ladekapazitaet' },
                { f: 't_E = Q_E / I_E', id: 'akku-entladekapazitaet' },
                { f: 'W_L = Q_L · U_L', id: 'akku-ladeenergie' },
                { f: 'W_E = Q_E · U_E', id: 'akku-entladeenergie' },
                { f: 'η_Ah = Q_E / Q_L', id: 'akku-ladungswirkungsgrad' },
                { f: 'η_Wh = W_E / W_L', id: 'akku-energiewirkungsgrad' },
                { f: 'Q_E = Q_L · η_Ah', id: 'akku-ladungswirkungsgrad' },
                { f: 'W_E = W_L · η_Wh', id: 'akku-energiewirkungsgrad' }
            ]
        },
        {
            id: 'b-innen', seite: 11, buch: 7,
            titel: 'Einfluss des Innenwiderstandes',
            groessen: [g('U₀', 'Leerlaufspannung', 'V'), g('U_Ri', 'Spannungsabfall an Rᵢ', 'V'), g('U', 'Klemmenspannung', 'V'), g('I', 'Laststrom', 'A'), g('I_KS', 'Kurzschlussstrom', 'A'), g('Rᵢ', 'Innenwiderstand', 'Ω'), g('R_L', 'Lastwiderstand', 'Ω')],
            zeilen: [
                { f: 'I = U₀ / (R_L + Rᵢ)', id: 'quellstrom' },
                { f: 'Rᵢ = (U₀ − U) / I', id: 'klemmenspannung' },
                { f: 'U_Ri = I · Rᵢ' },
                { f: 'U_Ri = U₀ − U', id: 'quelle-innerer-abfall' },
                { f: 'U = I · R_L' },
                { f: 'U = U₀ − I · Rᵢ', id: 'klemmenspannung' },
                { f: 'U = U₀', id: 'quelle-innerer-abfall' },
                { f: 'I = 0', id: 'klemmenspannung' },
                { f: 'U = 0', id: 'quelle-innerer-abfall' },
                { f: 'I_KS = U₀ / Rᵢ', id: 'quelle-kurzschlussstrom' }
            ]
        },
        {
            id: 'b-reihe', seite: 11, buch: 7,
            titel: 'Reihenschaltung (Elemente mit gleichen Nennwerten)',
            groessen: [g('U₀', 'gesamte Leerlaufspannung', 'V'), g('U₀₁', 'U₀ eines Elements', 'V'), g('U', 'Klemmenspannung', 'V'), g('I', 'Laststrom', 'A'), g('Rᵢ', 'gesamter Innenwiderstand', 'Ω'), g('Rᵢ₁', 'Rᵢ eines Elements', 'Ω'), g('R_L', 'Lastwiderstand', 'Ω'), g('n', 'Anzahl Elemente', ''), g('Q', 'Ladung', 'Ah')],
            zeilen: [
                { f: 'U₀ = n · U₀₁', id: 'elemente-reihe-spannung' },
                { f: 'U₀₁ = U₀ / n', id: 'elemente-reihe-spannung' },
                { f: 'n = U₀ / U₀₁', id: 'elemente-reihe-spannung' },
                { f: 'n = Rᵢ / Rᵢ₁', id: 'elemente-reihe-widerstand' },
                { f: 'Rᵢ = n · Rᵢ₁', id: 'elemente-reihe-widerstand' },
                { f: 'Rᵢ₁ = Rᵢ / n', id: 'elemente-reihe-widerstand' },
                { f: 'I = U₀ / (R_L + Rᵢ)', id: 'quellstrom' },
                { f: 'U = U₀ − I · Rᵢ', id: 'klemmenspannung' },
                { f: 'Q_Gesamtschaltung = Q_Einzelelement' }
            ]
        },
        {
            id: 'b-parallel', seite: 11, buch: 7,
            titel: 'Parallelschaltung (Elemente mit gleichen Nennwerten)',
            groessen: [g('U₀', 'gesamte Leerlaufspannung', 'V'), g('U₀₁', 'U₀ eines Elements', 'V'), g('U', 'Klemmenspannung', 'V'), g('I', 'Laststrom', 'A'), g('I₁', 'Strom eines Elements', 'A'), g('Rᵢ', 'gesamter Innenwiderstand', 'Ω'), g('Rᵢ₁', 'Rᵢ eines Elements', 'Ω'), g('R_L', 'Lastwiderstand', 'Ω'), g('n', 'Anzahl Elemente', ''), g('Q', 'gesamter Ladung', 'Ah')],
            zeilen: [
                { f: 'U₀ = U₀₁' },
                { f: 'n = I / I₁', id: 'elemente-parallel-strom' },
                { f: 'n = Rᵢ₁ / Rᵢ', id: 'elemente-parallel-widerstand' },
                { f: 'Rᵢ = Rᵢ₁ / n', id: 'elemente-parallel-widerstand' },
                { f: 'Rᵢ₁ = n · Rᵢ', id: 'elemente-parallel-widerstand' },
                { f: 'I = n · I₁', id: 'elemente-parallel-strom' },
                { f: 'I₁ = I / n', id: 'elemente-parallel-strom' },
                { f: 'I = U₀ / (R_L + Rᵢ)', id: 'quellstrom' },
                { f: 'U = U₀ − I · Rᵢ', id: 'klemmenspannung' },
                { f: 'Q_Parallelschaltung = n · Q_Einzelelement' }
            ]
        },
        {
            id: 'c-kapazitaet', seite: 12, buch: 8,
            titel: 'Kapazität (Plattenkondensator)',
            groessen: [g('C', 'Kapazität', 'As/V = F'), g('U', 'Spannung am Kondensator', 'V'), g('Q', 'gespeicherte Ladung', 'As = C'), g('W', 'gespeicherte Energie', 'Ws = J'), g('ε₀', 'elektr. Feldkonstante', 'As/Vm'), g('εᵣ', 'Dielektrizitätszahl', ''), g('A', 'Plattenfläche', 'm²'), g('l', 'Plattenabstand', 'm'), g('E', 'elektrische Feldstärke', 'V/m')],
            zeilen: [
                { f: 'C = ε₀ · εᵣ · A / l', id: 'plattenkondensator' },
                { f: 'C = Q / U', id: 'kondensator-ladung' },
                { f: 'l = ε₀ · εᵣ · A / C', id: 'plattenkondensator' },
                { f: 'A = C · l / (ε₀ · εᵣ)', id: 'plattenkondensator' },
                { f: 'Q = C · U', id: 'kondensator-ladung' },
                { f: 'Q = I · t' },
                { f: 'W = 1/2 · C · U²', id: 'kondensator-energie' },
                { f: 'U = √(2 · W / C)', id: 'kondensator-ladung' },
                { f: 'E = U / l', id: 'feldstaerke-kondensator' },
                { f: 'ε₀ = 8,85 · 10⁻¹² As/Vm = 8,85 · 10⁻⁶ µF/m' }
            ]
        },
        {
            id: 'c-parallel', seite: 12, buch: 8,
            titel: 'Parallelschaltung',
            groessen: [g('C', 'Gesamtkapazität', 'F'), g('C₁, C₂, C₃', 'Einzelkapazitäten', 'F'), g('Q', 'Gesamtladung', 'As = C'), g('Q₁, Q₂, Q₃', 'Einzelladungen', 'As = C')],
            zeilen: [
                { f: 'C = C₁ + C₂ + C₃', id: 'kondensator-parallel' },
                { f: 'C₁ = C − C₂ − C₃' },
                { f: 'Q = Q₁ + Q₂ + Q₃' },
                { f: 'C = n · C₁', id: 'kondensator-gleiche' },
                { f: 'n = C / C₁', id: 'kondensator-gleiche' }
            ]
        },
        {
            id: 'c-reihe', seite: 12, buch: 8,
            titel: 'Reihenschaltung',
            groessen: [g('C', 'Gesamtkapazität', 'F'), g('C₁, C₂, C₃', 'Einzelkapazitäten', 'F'), g('Q', 'Gesamtladung', 'As = C'), g('Q₁, Q₂, Q₃', 'Einzelladungen', 'As = C')],
            zeilen: [
                { f: 'C = 1 / (1/C₁ + 1/C₂ + 1/C₃)' },
                { f: 'Q = Q₁ = Q₂ = Q₃' },
                { f: 'C = (C₁ · C₂) / (C₁ + C₂)', id: 'kondensator-reihe' },
                { f: 'C₁ = (C₂ · C) / (C₂ − C)', id: 'kondensator-reihe' },
                { f: 'C = C₁ / n', id: 'kondensator-gleiche' },
                { f: 'n = C₁ / C', id: 'kondensator-gleiche' }
            ]
        },
        {
            id: 'c-laden', seite: 12, buch: 8,
            titel: 'Laden und Entladen',
            groessen: [g('C', 'Kapazität', 'F'), g('R', 'Widerstand', 'Ω'), g('τ', 'Zeitkonstante', 's'), g('t', 'Lade- bzw. Entladezeit', 's'), g('I₀', 'Anfangswert von Lade- und Entladestrom', 'A')],
            zeilen: [
                { f: 'τ = R · C', id: 'zeitkonstante' },
                { f: 't = 5 · τ', id: 'ladezeit' },
                { f: 'R = τ / C', id: 'zeitkonstante' },
                { f: 'τ = t / 5', id: 'ladezeit' },
                { f: 'C = τ / R', id: 'zeitkonstante' },
                { f: 'I₀ = U / R', id: 'ladestrom-anfang' }
            ]
        },
        {
            id: 'mag-feld', seite: 13, buch: 9,
            titel: 'Feldstärke und Flussdichte',
            groessen: [g('I', 'Stromstärke', 'A'), g('N', 'Windungszahl', ''), g('lₘ', 'mittlere Feldlinienlänge', 'm'), g('A', 'Polfläche', 'm²'), g('Θ', 'Durchflutung', 'A'), g('H', 'Feldstärke', 'A/m'), g('Φ', 'magnetischer Fluss', 'Vs = Wb'), g('B', 'Flussdichte', 'Vs/m² = T'), g('Rₘ', 'magnetischer Widerstand', 'A/Vs'), g('µ', 'Permeabilität', 'Vs/Am'), g('µ₀', 'Feldkonstante', 'Vs/Am'), g('µᵣ', 'relative Permeabilität', '')],
            zeilen: [
                { f: 'Θ = I · N', id: 'magnet-durchflutung' },
                { f: 'H = (I · N) / lₘ', id: 'magnet-feldstaerke' },
                { f: 'lₘ = (I · N) / H', id: 'magnet-feldstaerke' },
                { f: 'I = (H · lₘ) / N', id: 'magnet-feldstaerke' },
                { f: 'N = (H · lₘ) / I', id: 'magnet-feldstaerke' },
                { f: 'B = µ₀ · µᵣ · H', id: 'magnet-flussdichte' },
                { f: 'H = B / (µ₀ · µᵣ)' },
                { f: 'B = Φ / A', id: 'magnet-fluss' },
                { f: 'Φ = B · A', id: 'magnet-fluss' },
                { f: 'Rₘ = lₘ / (µ₀ · µᵣ · A)', id: 'magnet-widerstand' },
                { f: 'Φ = (I · N) / Rₘ' },
                { f: 'µ = µ₀ · µᵣ' },
                { f: 'µ₀ = 1,257 · 10⁻⁶ Vs/Am' }
            ]
        },
        {
            id: 'mag-induktion', seite: 13, buch: 9,
            titel: 'Selbstinduktion',
            groessen: [],
            zeilen: [
                { f: 'uᵢ = −L · ΔI / Δt', id: 'magnet-selbstinduktion' }
            ]
        },
        {
            id: 's13-ummagnetisierungskennlinien', seite: 13, buch: 9,
            titel: 'Ummagnetisierungskennlinien (Hysteresekurve)',
            groessen: [],
            zeilen: []
        },
        {
            id: 's13-magnetfelder-bei-spulen', seite: 13, buch: 9,
            titel: 'Magnetfelder bei Spulen',
            groessen: [],
            zeilen: []
        },
        {
            id: 's13-kraefte-auf-strom-durchflossene', seite: 13, buch: 9,
            titel: 'Kräfte auf Strom durchflossene Leiter',
            groessen: [],
            zeilen: []
        },
        {
            id: 'w-frequenz', seite: 13, buch: 10,
            titel: 'Frequenz, Momentanwert, Spitzenwert, Effektivwert',
            groessen: [g('T', 'Periodendauer', 's'), g('f', 'Frequenz', 'Hz'), g('ω', 'Kreisfrequenz', '1/s'), g('α', 'Phasenwinkel', '°'), g('u', 'Momentanwert Spannung', 'V'), g('û', 'Scheitelwert Spannung', 'V'), g('U', 'Effektivwert Spannung', 'V'), g('i', 'Momentanwert Strom', 'A'), g('î', 'Scheitelwert Strom', 'A'), g('I', 'Effektivwert Strom', 'A')],
            zeilen: [
                { f: 'f = 1 / T', id: 'periodendauer' },
                { f: 'T = 1 / f', id: 'periodendauer' },
                { f: 'ω = 2 · π · f', id: 'kreisfrequenz' },
                { f: 'f = ω / (2 · π)', id: 'kreisfrequenz' },
                { f: 'α = ω · t' },
                { f: 'U = û / √2' },
                { f: 'I = î / √2' },
                { f: 'û = U · √2' },
                { f: 'î = I · √2' },
                { f: 'u = û · sin α', id: 'momentanwert' },
                { f: 'i = î · sin α' },
                { f: '90° = π/2 rad' },
                { f: '180° = π rad' },
                { f: '360° = 2π rad' },
                { f: 'f = 50 Hz', id: 'periodendauer' },
                { f: 'T = 20 ms' },
                { f: 'ω = 314 1/s' }
            ]
        },
        {
            id: 'wx-induktiv', seite: 14, buch: 11,
            titel: 'Induktiver Blindwiderstand (Induktive Reaktanz)',
            groessen: [g('f', 'Frequenz', 'Hz'), g('L', 'Induktivität', 'Vs/A = H'), g('X_L', 'induktiver Blindwiderstand', 'Ω')],
            zeilen: [
                { f: 'X_L = U_L / I' },
                { f: 'X_L = 2 · π · f · L', id: 'blindwiderstand-l' },
                { f: 'L = X_L / (2 · π · f)', id: 'blindwiderstand-l' },
                { f: 'f = X_L / (2 · π · L)', id: 'blindwiderstand-l' }
            ]
        },
        {
            id: 'wx-kapazitiv', seite: 14, buch: 11,
            titel: 'Kapazitiver Blindwiderstand (Kapazitive Reaktanz)',
            groessen: [g('f', 'Frequenz', 'Hz'), g('C', 'Kapazität', 'As/V = F'), g('X_C', 'kapazitiver Blindwiderstand', 'Ω')],
            zeilen: [
                { f: 'X_C = U_C / I' },
                { f: 'X_C = 1 / (2 · π · f · C)', id: 'blindwiderstand-c' },
                { f: 'C = 1 / (2 · π · f · X_C)', id: 'blindwiderstand-c' },
                { f: 'f = 1 / (2 · π · C · X_C)', id: 'blindwiderstand-c' }
            ]
        },
        {
            id: 'wx-reihe', seite: 14, buch: 11,
            titel: 'Reihenschaltung von Wirk- und Blindwiderstand',
            groessen: [g('I', 'Stromstärke', 'A'), g('U', 'Gesamtspannung', 'V'), g('U_w', 'Wirkspannung', 'V'), g('U_bL', 'induktive Blindspannung', 'V'), g('U_bC', 'kapazitive Blindspannung', 'V'), g('R', 'Wirkwiderstand', 'Ω'), g('X_L', 'induktiver Blindwiderstand', 'Ω'), g('X_C', 'kapazitiver Blindwiderstand', 'Ω'), g('Z', 'Scheinwiderstand (Impedanz)', 'Ω'), g('φ', 'Phasenverschiebungswinkel', '°')],
            zeilen: [
                { f: 'I = U / Z', id: 'impedanz' },
                { f: 'Z = U / I', id: 'impedanz' },
                { f: 'Z = √(R² + X²)', id: 'impedanz-reihe' },
                { f: 'Z = R / cos φ' },
                { f: 'Z = X / sin φ' },
                { f: 'R = √(Z² − X²)', id: 'impedanz-reihe' },
                { f: 'X = √(Z² − R²)', id: 'impedanz-reihe' },
                { f: 'R = Z · cos φ' },
                { f: 'X = Z · sin φ' },
                { f: 'cos φ = R / Z', id: 'cosphi-reihe' },
                { f: 'sin φ = X / Z' },
                { f: 'U = I · Z', id: 'impedanz' },
                { f: 'U = √(U_w² + U_b²)', id: 'spannung-reihe-ac' },
                { f: 'U_w = √(U² − U_b²)', id: 'spannung-reihe-ac' },
                { f: 'U_b = √(U² − U_w²)', id: 'spannung-reihe-ac' },
                { f: 'U_w = U · cos φ' },
                { f: 'U_b = U · sin φ' }
            ]
        },
        {
            id: 'wx-reihe-rlc', seite: 14, buch: 11,
            titel: 'Reihenschaltung von R, X_L und X_C',
            groessen: [g('I', 'Stromstärke', 'A'), g('U', 'Gesamtspannung', 'V'), g('U_w', 'Wirkspannung', 'V'), g('U_bL', 'induktive Blindspannung', 'V'), g('U_bC', 'kapazitive Blindspannung', 'V'), g('R', 'Wirkwiderstand', 'Ω'), g('X_L', 'induktiver Blindwiderstand', 'Ω'), g('X_C', 'kapazitiver Blindwiderstand', 'Ω'), g('Z', 'Scheinwiderstand (Impedanz)', 'Ω'), g('φ', 'Phasenverschiebungswinkel', '°')],
            zeilen: [
                { f: 'Z = √(R² + (X_L − X_C)²)', id: 'impedanz-reihe-rlc' },
                { f: 'Z = U / I', id: 'impedanz' },
                { f: 'cos φ = R / Z', id: 'cosphi-reihe' },
                { f: 'Z = R / cos φ' },
                { f: 'R = √(Z² − (X_L − X_C)²)', id: 'impedanz-reihe-rlc' },
                { f: 'R = Z · cos φ' },
                { f: 'U = √(U_w² + (U_bL − U_bC)²)' },
                { f: 'U = I · Z', id: 'impedanz' },
                { f: 'U_w = U · cos φ' },
                { f: 'U_w = I · R' },
                { f: 'U_bL = I · X_L' },
                { f: 'U_bC = I · X_C' }
            ]
        },
        {
            id: 'wx-parallel', seite: 15, buch: 11,
            titel: 'Parallelschaltung von Wirk- und Blindwiderstand',
            groessen: [g('U', 'Spannung', 'V'), g('I', 'Gesamtstrom', 'A'), g('I_w', 'Wirkstrom', 'A'), g('I_bL', 'induktiver Blindstrom', 'A'), g('I_bC', 'kapazitiver Blindstrom', 'A'), g('R', 'Wirkwiderstand', 'Ω'), g('X_L', 'induktiver Blindwiderstand', 'Ω'), g('X_C', 'kapazitiver Blindwiderstand', 'Ω'), g('Z', 'Scheinwiderstand (Impedanz)', 'Ω'), g('φ', 'Phasenverschiebungswinkel', '°'), g('Y', 'Scheinleitwert', 'S'), g('G', 'Wirkleitwert', 'S'), g('B', 'Blindleitwert', 'S')],
            zeilen: [
                { f: 'Z = U / I', id: 'impedanz' },
                { f: 'Z = 1 / √(1/R² + 1/X²)', id: 'impedanz-parallel' },
                { f: 'Z = R · cos φ' },
                { f: 'Z = X · sin φ' },
                { f: 'R = Z / cos φ' },
                { f: 'X = Z / sin φ' },
                { f: 'cos φ = Z / R', id: 'cosphi-parallel' },
                { f: 'sin φ = Z / X' },
                { f: 'I = U / Z', id: 'impedanz' },
                { f: 'I = √(I_w² + I_b²)', id: 'strom-parallel-ac' },
                { f: 'I_w = √(I² − I_b²)', id: 'strom-parallel-ac' },
                { f: 'I_b = √(I² − I_w²)', id: 'strom-parallel-ac' },
                { f: 'I_w = U / R' },
                { f: 'I_b = U / X' },
                { f: 'I_w = I · cos φ' },
                { f: 'I_b = I · sin φ' },
                { f: 'Y = 1 / Z', id: 'scheinleitwert' },
                { f: 'G = 1 / R', id: 'leitwert' },
                { f: 'B = 1 / X' }
            ]
        },
        {
            id: 's15-parallelschaltung-von-r-x-l-und', seite: 15, buch: 11,
            titel: 'Parallelschaltung von R, X_L und X_C',
            groessen: [g('U', 'Spannung', 'V'), g('I', 'Gesamtstrom', 'A'), g('I_w', 'Wirkstrom', 'A'), g('I_bL', 'induktiver Blindstrom', 'A'), g('I_bC', 'kapazitiver Blindstrom', 'A'), g('R', 'Wirkwiderstand', 'Ω'), g('X_L', 'induktiver Blindwiderstand', 'Ω'), g('X_C', 'kapazitiver Blindwiderstand', 'Ω'), g('Z', 'Scheinwiderstand (Impedanz)', 'Ω'), g('φ', 'Phasenverschiebungswinkel', '°'), g('Y', 'Scheinleitwert', 'S'), g('G', 'Wirkleitwert', 'S'), g('B', 'Blindleitwert', 'S')],
            zeilen: [
                { f: 'Z = 1 / √(1/R² + (1/X_L − 1/X_C)²)', id: 'impedanz-reihe-rlc' },
                { f: 'Z = U / I', id: 'impedanz' },
                { f: 'cos φ = Z / R', id: 'cosphi-parallel' },
                { f: 'Z = R · cos φ' },
                { f: 'R = U / I_w' },
                { f: 'R = Z / cos φ' },
                { f: 'X_L = U / I_bL' },
                { f: 'X_C = U / I_bC' },
                { f: 'I = √(I_w² + (I_bL − I_bC)²)' },
                { f: 'I = U / Z', id: 'impedanz' },
                { f: 'I_w = I · cos φ' },
                { f: 'I_w = U / R' },
                { f: 'I_bL = U / X_L' },
                { f: 'I_bC = U / X_C' },
                { f: 'Y = 1 / Z', id: 'scheinleitwert' },
                { f: 'G = 1 / R', id: 'leitwert' },
                { f: 'B = 1 / X' }
            ]
        },
        {
            id: 'wx-resonanz', seite: 15, buch: 11,
            titel: 'Resonanz',
            groessen: [g('f', 'Frequenz', 'Hz'), g('L', 'Induktivität', 'H'), g('C', 'Kapazität', 'F'), g('R', 'Wirkwiderstand', 'Ω'), g('X_L', 'induktiver Blindwiderstand', 'Ω'), g('X_C', 'kapazitiver Blindwiderstand', 'Ω')],
            zeilen: [
                { f: 'fᵣ = 1 / (2 · π · √(L · C))', id: 'resonanzfrequenz' },
                { f: 'X_L = X_C' },
                { f: 'Z = R' },
                { f: 'cos φ = 1' }
            ]
        },
        {
            id: 'd-stern', seite: 16, buch: 12,
            titel: 'Spannungen und Ströme bei Sternschaltung',
            groessen: [g('U', 'Aussenleiterspannung', 'V'), g('U_Str', 'Strangspannung', 'V'), g('I', 'Aussenleiterstrom', 'A'), g('I_Str', 'Strangstrom', 'A'), g('Z', 'Strangimpedanz (Scheinwiderstand)', 'Ω')],
            zeilen: [
                { f: 'U_Str = U / √3', id: 'stern-spannung' },
                { f: 'I = I_Str' },
                { f: 'U = √3 · U_Str', id: 'stern' },
                { f: 'I = U_Str / Z', id: 'stern-strang' },
                { f: 'U_Str = I · Z', id: 'stern-strang' },
                { f: 'Z = U_Str / I', id: 'stern-strang' }
            ]
        },
        {
            id: 'd-dreieck', seite: 16, buch: 12,
            titel: 'Spannungen und Ströme bei Dreieckschaltung',
            groessen: [g('U', 'Aussenleiterspannung', 'V'), g('U_Str', 'Strangspannung', 'V'), g('I', 'Aussenleiterstrom', 'A'), g('I_Str', 'Strangstrom', 'A'), g('Z', 'Strangimpedanz (Scheinwiderstand)', 'Ω')],
            zeilen: [
                { f: 'I_Str = I / √3', id: 'dreieck-strom' },
                { f: 'U = U_Str' },
                { f: 'I = √3 · I_Str', id: 'dreieck' },
                { f: 'U = I_Str · Z', id: 'dreieck-strang' },
                { f: 'I_Str = U / Z', id: 'dreieck-strang' },
                { f: 'Z = U / I_Str', id: 'dreieck-strang' }
            ]
        },
        {
            id: 'd-leistung', seite: 16, buch: 12,
            titel: 'Leistung bei Stern- und Dreieckschaltung',
            groessen: [g('U', 'Aussenleiterspannung', 'V'), g('I', 'Aussenleiterstrom', 'A'), g('Z', 'Strangimpedanz (Scheinwiderstand)', 'Ω')],
            zeilen: [
                { f: 'S = √3 · U · I', id: 'dreh-schein' },
                { f: 'S = √(P² + Q²)', id: 'leistungsdreieck' },
                { f: 'S = P / cos φ' },
                { f: 'S = Q / sin φ' },
                { f: 'cos φ = P / S', id: 'cosphi-leistung' },
                { f: 'sin φ = Q / S', id: 'sinphi-leistung' },
                { f: 'U = S / (√3 · I)', id: 'dreh-schein' },
                { f: 'I = S / (√3 · U)', id: 'dreh-schein' },
                { f: 'S_Y = U² / Z', id: 'stern-scheinleistung' },
                { f: 'S_Δ = 3 · U² / Z', id: 'dreieck-scheinleistung' }
            ]
        },
        {
            id: 's16-wirkleistung-p', seite: 16, buch: 12,
            titel: 'Wirkleistung P',
            groessen: [],
            zeilen: [
                { f: 'P = √3 · U · I · cos φ', id: 'dreh-wirk' },
                { f: 'P = S · cos φ' },
                { f: 'P = √(S² − Q²)', id: 'wirkleistung-dreieck' },
                { f: 'P = Q / tan φ', id: 'dreh-wirkleistung-q' },
                { f: 'U = P / (√3 · I · cos φ)' },
                { f: 'I = P / (√3 · U · cos φ)' },
                { f: 'P_Y = U² / R' },
                { f: 'P_Δ = 3 · U² / R' }
            ]
        },
        {
            id: 's16-blindleistung-q', seite: 16, buch: 12,
            titel: 'Blindleistung Q',
            groessen: [],
            zeilen: [
                { f: 'Q = √3 · U · I · sin φ', id: 'dreh-blindleistung' },
                { f: 'Q = S · sin φ' },
                { f: 'Q = √(S² − P²)' },
                { f: 'Q = P · tan φ' }
            ]
        },
        {
            id: 's16-vergleich-y-bei-gleicher-last', seite: 16, buch: 12,
            titel: 'Vergleich Δ ←→ Y bei gleicher Last',
            groessen: [],
            zeilen: [
                { f: 'P_Δ = 3 · P_Y', id: 'stern-dreieck-vergleich' },
                { f: 'S_Δ = 3 · S_Y' },
                { f: 'I_Δ = 3 · I_Y' }
            ]
        },
        {
            id: 's17-sternschaltung-mit-aussenleiter', seite: 17, buch: 12,
            titel: 'Sternschaltung mit Aussenleiter- oder Strangunterbruch',
            groessen: [g('U', 'Aussenleiterspannung', 'V'), g('U_Str', 'Strangspannung', 'V'), g('I₁, I₂, I₃', 'Aussenleiterströme', 'A'), g('I_N', 'Neutralleiterstrom', 'A'), g('R', 'Strangwiderstände', 'Ω'), g('P', 'Gesamtleistung', 'W')],
            zeilen: [
                { f: 'I₁ = I₃ = U / (2 · R)' },
                { f: 'U_Str = U / 2' },
                { f: 'P = U · I₁' },
                { f: 'P = U² / (2 · R)', id: 'leistung-ur' },
                { f: 'I_N = I₁ = I₃ = U / (√3 · R)' },
                { f: 'U_Str = U / √3', id: 'stern-spannung' },
                { f: 'P = 2 · U / √3 · I₁' },
                { f: 'P = 2/3 · U² / R', id: 'leistung-ur' }
            ]
        },
        {
            id: 's17-neutralleiterstrom-bei-unsymmetr', seite: 17, buch: 12,
            titel: 'Neutralleiterstrom bei unsymmetrischer Belastung',
            groessen: [],
            zeilen: []
        },
        {
            id: 's17-dreieckschaltung-mit-unterbruech', seite: 17, buch: 12,
            titel: 'Dreieckschaltung mit Unterbrüchen',
            groessen: [g('U', 'Aussenleiterspannung', 'V'), g('I₁, I₂, I₃', 'Aussenleiterströme', 'A'), g('R', 'Strangwiderstände', 'Ω'), g('P', 'Gesamtleistung', 'W')],
            zeilen: [
                { f: 'I₁ = I₃ = 3/2 · U / R' },
                { f: 'I₂ = 0' },
                { f: 'P = U · I₁' },
                { f: 'P = 3/2 · U² / R', id: 'leistung-ur' },
                { f: 'I₁ = I₃ = U / R' },
                { f: 'I₂ = √3 · I₁' },
                { f: 'P = 2 · U · I₁' },
                { f: 'P = 2 · U² / R', id: 'leistung-ur' }
            ]
        },
        {
            id: 't-einphasen', seite: 18, buch: 13,
            titel: 'Einphasentransformatoren',
            groessen: [g('U₁', 'Primärspannung', 'V'), g('U₂', 'Sekundärspannung', 'V'), g('I₁', 'Primärstrom', 'A'), g('I₂', 'Sekundärstrom', 'A'), g('N₁', 'Primärwindungszahl', ''), g('N₂', 'Sekundärwindungszahl', ''), g('Z₂', 'Lastimpedanz', 'Ω'), g('ü', 'Übersetzungsverhältnis', ''), g('S', 'Nennleistung', 'VA'), g('U_2N', 'Sekundärnennspannung', 'V'), g('I_2N', 'Sekundärnennstrom', 'A'), g('P₁', 'Primärwirkleistung', 'W'), g('P₂', 'Sekundärwirkleistung', 'W'), g('P_Cu', 'Kupferverluste', 'W'), g('P_Fe', 'Eisenverluste', 'W'), g('cos φ₂', 'Wirkleistungsfaktor von Z₂', ''), g('η', 'Wirkungsgrad', ''), g('Φ', 'magnetischer Fluss', 'Vs = Wb')],
            zeilen: [
                { f: 'ü = U₁ / U₂ = N₁ / N₂ = I₂ / I₁' },
                { f: 'U₁ = U₂ · N₁ / N₂', id: 'trafo-uebersetzung' },
                { f: 'U₂ = U₁ · N₂ / N₁', id: 'trafo-uebersetzung' },
                { f: 'U₁ = U₂ · I₂ / I₁', id: 'trafo-strom' },
                { f: 'U₂ = U₁ · I₁ / I₂', id: 'trafo-strom' },
                { f: 'I₁ = I₂ · N₂ / N₁' },
                { f: 'I₂ = I₁ · N₁ / N₂' },
                { f: 'N₁ = N₂ · U₁ / U₂', id: 'trafo-uebersetzung' },
                { f: 'N₂ = N₁ · U₂ / U₁', id: 'trafo-uebersetzung' },
                { f: 'S_N = U_2N · I_2N', id: 'trafo-nennleistung' },
                { f: 'P₂ = U₂ · I₂ · cos φ₂' },
                { f: 'P₂ = P₁ · η', id: 'motor-abgabe' },
                { f: 'P₁ = P₂ / η', id: 'motor-abgabe' },
                { f: 'η = P₂ / P₁ = P₂ / (P₂ + P_Cu + P_Fe)', id: 'trafo-wirkungsgrad' },
                { f: 'uᵢ = −N · ΔΦ / Δt', id: 'trafo-induzierte-spannung' }
            ]
        },
        {
            id: 't-spar', seite: 18, buch: 13,
            titel: 'Spartransformatoren',
            groessen: [g('S_B', 'Bauleistung', 'VA'), g('S_D', 'Durchgangsleistung', 'VA')],
            zeilen: [
                { f: 'ü = U₁ / U₂ = N₁ / N₂ = I₂ / I₁' },
                { f: 'S_D = U_2N · I_2N' },
                { f: 'Für U₁ > U₂: S_B = S_D · (U₁ − U₂) / U₁', id: 'spartrafo-bauleistung' },
                { f: 'Für U₁ < U₂: S_B = S_D · (U₂ − U₁) / U₂', id: 'spartrafo-bauleistung' }
            ]
        },
        {
            id: 't-dreh', seite: 18, buch: 13,
            titel: 'Drehstromtransformatoren',
            groessen: [g('S_N', 'Nennleistung', 'VA'), g('U_2N', 'Sekundärnennspannung', 'V'), g('I_2N', 'Sekundärnennstrom', 'A'), g('U₁', 'Aussenleiterspannung Eingangsseite', 'V'), g('U₂', 'Aussenleiterspannung Ausgangsseite', 'V'), g('N₁', 'Windungszahl einer Eingangswicklung', ''), g('N₂', 'Windungszahl einer Ausgangswicklung', '')],
            zeilen: [
                { f: 'S_N = √3 · U_2N · I_2N', id: 'trafo-nennleistung-dreh' },
                { f: 'Yy0, Yy6, Dd0, Dd6: U₁ / U₂ = N₁ / N₂' },
                { f: 'Dy5, Dy11: U₁ / U₂ = N₁ / (√3 · N₂)' },
                { f: 'Yd5, Yd11: U₁ / U₂ = (√3 · N₁) / N₂' },
                { f: 'Yz5, Yz11: U₁ / U₂ = (2 · N₁) / (√3 · N₂)' },
                { f: 'Dz0, Dz6: U₁ / U₂ = (2 · N₁) / (3 · N₂)' }
            ],
            tabelle: [
                ['Schaltgruppe', 'Übersetzung'],
                ['Yy0, Yy6, Dd0, Dd6', 'U₁ / U₂ = N₁ / N₂'],
                ['Dy5, Dy11', 'U₁ / U₂ = N₁ / (√3 · N₂)'],
                ['Yd5, Yd11', 'U₁ / U₂ = (√3 · N₁) / N₂'],
                ['Yz5, Yz11', 'U₁ / U₂ = (2 · N₁) / (√3 · N₂)'],
                ['Dz0, Dz6', 'U₁ / U₂ = (2 · N₁) / (3 · N₂)']
            ]
        },
        {
            id: 'mo-schlupf', seite: 19, buch: 14,
            titel: 'Drehzahl und Schlupf bei Asynchronmotoren',
            groessen: [g('f', 'Frequenz', 'Hz'), g('p', 'Anzahl Polpaare', ''), g('nₛ', 'Drehfelddrehzahl (Synchrondrehzahl)', '1/min'), g('n', 'Läuferdrehzahl', '1/min'), g('s', 'Schlupf', '%')],
            zeilen: [
                { f: 'nₛ = (f · 60 s/min) / p', id: 'synchrondrehzahl' },
                { f: 'p = (f · 60 s/min) / nₛ', id: 'motor-polpaare' },
                { f: 'f = (p · nₛ) / 60 s/min' },
                { f: 's = ((nₛ − n) / nₛ) · 100%', id: 'schlupf' },
                { f: 'n = nₛ · (100% − s) / 100%', id: 'motor-laeuferdrehzahl' }
            ]
        },
        {
            id: 'mo-dreh', seite: 19, buch: 14,
            titel: 'Drehstrommotoren',
            groessen: [g('U', 'Aussenleiterspannung', 'V'), g('I', 'Aussenleiterstrom', 'A'), g('cos φ', 'Wirkleistungsfaktor', ''), g('P₁', 'elektrische Wirkleistung', 'W'), g('P₂', 'mechanische Leistung', 'W'), g('η', 'Wirkungsgrad', ''), g('P_Δ', 'P₁ bei Dreieckschaltung', 'W'), g('P_Y', 'P₁ bei Sternschaltung', 'W')],
            zeilen: [
                { f: 'P₁ = √3 · U · I · cos φ', id: 'motor-aufnahme-dreh' },
                { f: 'P₁ = P₂ / η', id: 'motor-abgabe' },
                { f: 'P₂ = P₁ · η', id: 'motor-abgabe' },
                { f: 'η = P₂ / P₁', id: 'motor-abgabe' },
                { f: 'I = P₁ / (√3 · U · cos φ)' },
                { f: 'cos φ = P₁ / (√3 · U · I)' },
                { f: 'P_Δ = 3 · P_Y', id: 'stern-dreieck-vergleich' },
                { f: 'P_Y = P_Δ / 3' }
            ]
        },
        {
            id: 's19-seilwinde', seite: 19, buch: 14,
            titel: 'Seilwinde',
            groessen: [g('W₂', 'mechanische Arbeit', 'Nm'), g('P₂', 'mechanische Leistung', 'W'), g('m', 'Masse', 'kg'), g('h', 'Hubhöhe', 'm'), g('t', 'Hubzeit', 's'), g('g', 'Fallbeschleunigung', 'm/s²')],
            zeilen: [
                { f: 'g = 9,81 m/s²' },
                { f: 'W₂ = m · g · h', id: 'hubarbeit' },
                { f: 'W₂ = P₂ · t', id: 'hubzeit' },
                { f: 'P₂ = (m · g · h) / t' },
                { f: 'P₂ = W₂ / t', id: 'hubzeit' },
                { f: 't = (m · g · h) / P₂' },
                { f: 't = W₂ / P₂', id: 'hubzeit' },
                { f: 'm = (P₂ · t) / (g · h)' },
                { f: 'h = (P₂ · t) / (m · g)' },
                { f: '1 Nm = 1 Ws' },
                { f: '1 W = 1 Nm/s' }
            ]
        },
        {
            id: 'mo-wechsel', seite: 19, buch: 14,
            titel: 'Wechselstrommotoren',
            groessen: [g('U', 'Spannung', 'V'), g('I', 'Stromstärke', 'A'), g('cos φ', 'Wirkleistungsfaktor', ''), g('P₁', 'elektrische Wirkleistung', 'W'), g('P₂', 'mechanische Leistung', 'W'), g('η', 'Wirkungsgrad', '')],
            zeilen: [
                { f: 'P₁ = U · I · cos φ', id: 'motor-aufnahme-wechsel' },
                { f: 'P₁ = P₂ / η', id: 'motor-abgabe' },
                { f: 'P₂ = P₁ · η', id: 'motor-abgabe' },
                { f: 'η = P₂ / P₁', id: 'motor-abgabe' },
                { f: 'I = P₁ / (U · cos φ)' },
                { f: 'cos φ = P₁ / (U · I)' }
            ]
        },
        {
            id: 's19-gleichstrommotoren', seite: 19, buch: 14,
            titel: 'Gleichstrommotoren',
            groessen: [g('U', 'Spannung', 'V'), g('I', 'Stromstärke', 'A'), g('P₁', 'elektrische Leistung', 'W'), g('P₂', 'mechanische Leistung', 'W'), g('η', 'Wirkungsgrad', '')],
            zeilen: [
                { f: 'P₁ = U · I' },
                { f: 'P₁ = P₂ / η', id: 'motor-abgabe' },
                { f: 'P₂ = P₁ · η', id: 'motor-abgabe' },
                { f: 'η = P₂ / P₁', id: 'motor-abgabe' },
                { f: 'I = P₁ / U' },
                { f: 'U = P₁ / I' }
            ]
        },
        {
            id: 's20-gleichstromleitung', seite: 20, buch: 15,
            titel: 'Gleichstromleitung',
            groessen: [g('U₁', 'Netzspannung', 'V'), g('U₂', 'Verbraucherspannung', 'V'), g('ΔU', 'Spannungsfall', 'V'), g('Δu', 'Spannungsfall prozentual', '%'), g('R_Ltg', 'Leitungswiderstand', 'Ω'), g('R₂', 'Verbraucherwiderstand', 'Ω'), g('I', 'Stromstärke', 'A'), g('l', 'Leitungslänge', 'm'), g('A', 'Leiterquerschnitt', 'mm²'), g('ρ', 'spez. Widerstand', 'Ω·mm²/m'), g('P₂', 'Leistung am Verbraucher', 'W'), g('P_V', 'Verlustleistung der Leitung', 'W'), g('P_V%', 'Verlustleistung prozentual', '%'), g('P', 'Nennleistung Verbraucher', 'W')],
            zeilen: [
                { f: 'ΔU = I · R_Ltg', id: 'fall-gleich' },
                { f: 'ΔU = U₁ − U₂' },
                { f: 'Δu = ΔU / U₁ · 100%' },
                { f: 'U₂ = U₁ − ΔU' },
                { f: 'U₂ = I · R₂' },
                { f: 'R_Ltg = (ρ · 2 · l) / A', id: 'fall-leitungswiderstand' },
                { f: 'I = U₁ / (R_Ltg + R₂)' },
                { f: 'P₂ = I² · R₂' },
                { f: 'P₂ = U₂ · I' },
                { f: 'P_V = I² · R_Ltg', id: 'fall-verlust' },
                { f: 'P_V% = P_V / P · 100%', id: 'fall-verlust-prozent' }
            ]
        },
        {
            id: 's20-wechselstromleitung', seite: 20, buch: 15,
            titel: 'Wechselstromleitung',
            groessen: [g('U', 'Netzspannung', 'V'), g('ΔU', 'Spannungsfall', 'V'), g('Δu', 'Spannungsfall prozentual', '%'), g('R_Ltg', 'Leitungswiderstand', 'Ω'), g('I', 'Stromstärke', 'A'), g('l', 'Leitungslänge', 'm'), g('A', 'Leiterquerschnitt', 'mm²'), g('ρ', 'spez. Widerstand', 'Ω·mm²/m'), g('P_V', 'Verlustleistung der Leitung', 'W'), g('P_V%', 'Verlustleistung prozentual', '%'), g('P', 'Nennleistung Verbraucher', 'W')],
            zeilen: [
                { f: 'R_Ltg = (ρ · 2 · l) / A', id: 'fall-leitungswiderstand' },
                { f: 'ΔU = I · R_Ltg · cos φ', id: 'fall-wechsel' },
                { f: 'ΔU = P / U · R_Ltg' },
                { f: 'Δu = ΔU / U · 100%', id: 'fall-prozent' },
                { f: 'P_V = I² · R_Ltg', id: 'fall-verlust' },
                { f: 'P_V% = P_V / P · 100%', id: 'fall-verlust-prozent' }
            ]
        },
        {
            id: 's20-drehstromleitung', seite: 20, buch: 15,
            titel: 'Drehstromleitung',
            groessen: [g('U', 'Netzspannung', 'V'), g('ΔU', 'Spannungsfall', 'V'), g('Δu', 'Spannungsfall prozentual', '%'), g('R_Ltg', 'Leitungswiderstand', 'Ω'), g('I', 'Stromstärke', 'A'), g('l', 'Leitungslänge', 'm'), g('A', 'Leiterquerschnitt', 'mm²'), g('ρ', 'spez. Widerstand', 'Ω·mm²/m'), g('P_V', 'Verlustleistung der Leitung', 'W'), g('P_V%', 'Verlustleistung prozentual', '%'), g('P', 'Nennleistung Verbraucher', 'W')],
            zeilen: [
                { f: 'R_Ltg = (ρ · l) / A', id: 'fall-leitungswiderstand-dreh' },
                { f: 'ΔU = √3 · I · R_Ltg · cos φ', id: 'fall-dreh' },
                { f: 'ΔU = P / U · R_Ltg' },
                { f: 'Δu = ΔU / U · 100%', id: 'fall-prozent' },
                { f: 'P_V = 3 · I² · R_Ltg', id: 'fall-verlust-dreh' },
                { f: 'P_V% = P_V / P · 100%', id: 'fall-verlust-prozent' }
            ]
        },
        {
            id: 'an-faktor', seite: 21, buch: 16,
            titel: 'Verstärkungsfaktor, Dämpfungsfaktor',
            groessen: [g('V_U', 'Spannungsverstärkungsfaktor', ''), g('U₁', 'Eingangsspannung', 'V'), g('U₂', 'Ausgangsspannung', 'V'), g('V_P', 'Leistungsverstärkungsfaktor', ''), g('P₁', 'aufgenommene Leistung', 'W'), g('P₂', 'abgegebene Leistung', 'W'), g('D_U', 'Spannungsdämpfungsfaktor', ''), g('D_P', 'Leistungsdämpfungsfaktor', '')],
            zeilen: [
                { f: 'V_U = U₂ / U₁', id: 'verstaerkungsfaktor-u' },
                { f: 'V_P = P₂ / P₁' },
                { f: 'D_U = U₁ / U₂', id: 'daempfungsfaktor-u' },
                { f: 'D_P = P₁ / P₂' }
            ]
        },
        {
            id: 'an-mass', seite: 21, buch: 16,
            titel: 'Verstärkungsmass, Dämpfungsmass',
            groessen: [g('A_U', 'Spannungsdämpfungsmass', 'dB'), g('U₁', 'Eingangsspannung', 'V'), g('U₂', 'Ausgangsspannung', 'V'), g('A_P', 'Leistungsdämpfungsmass', 'dB'), g('P₁', 'aufgenommene Leistung', 'W'), g('P₂', 'abgegebene Leistung', 'W'), g('G_U', 'Spannungsverstärkungsmass', 'dB'), g('G_P', 'Leistungsverstärkungsmass', 'dB'), g('A_ges', 'Gesamtdämpfungsmass', 'dB'), g('A₁, A₂, A₃', 'Einzeldämpfungsmasse', 'dB')],
            zeilen: [
                { f: 'A_U = 20 · log (U₁ / U₂)', id: 'daempfungsmass-u' },
                { f: 'A_P = 10 · log (P₁ / P₂)' },
                { f: 'G_U = 20 · log (U₂ / U₁)', id: 'verstaerkungsmass-u' },
                { f: 'G_P = 10 · log (P₂ / P₁)', id: 'verstaerkungsmass-p' },
                { f: 'A_ges = A₁ + A₂ + A₃ + ···', id: 'gesamtdaempfung' }
            ]
        },
        {
            id: 'an-pegel', seite: 21, buch: 16,
            titel: 'Pegel',
            groessen: [g('L_U', 'Spannungspegel', 'dBµV'), g('U', 'Spannung', 'µV'), g('U₀', 'Bezugsspannung', '1µV'), g('L_P', 'Leistungspegel', 'dBmW'), g('P', 'Leistung', 'mW'), g('P₀', 'Bezugsleistung', '1mW')],
            zeilen: [
                { f: 'L_U = 20 · log (U / U₀)', id: 'spannungspegel' },
                { f: 'L_P = 10 · log (P / P₀)' }
            ]
        },
        {
            id: 'l-ausbeute', seite: 22, buch: 17,
            titel: 'Lichtausbeute',
            groessen: [g('P', 'elektrische Leistung', 'W'), g('Φ_L', 'Lichtstrom einer Leuchte', 'lm'), g('η', 'Lichtausbeute', 'lm/W')],
            zeilen: [
                { f: 'Φ_L = P · η' },
                { f: 'η = Φ_L / P' },
                { f: 'P = Φ_L / η' }
            ]
        },
        {
            id: 'l-staerke', seite: 22, buch: 17,
            titel: 'Beleuchtungsstärke',
            groessen: [g('n', 'Anzahl Leuchten', ''), g('Φ_L', 'Lichtstrom einer Leuchte', 'lm'), g('Φ', 'gesamter Lichtstrom', 'lm'), g('Φ_N', 'Nutzlichtstrom', 'lm'), g('E', 'Beleuchtungsstärke', 'lx'), g('A', 'beleuchtete Fläche', 'm²'), g('η_B', 'Beleuchtungswirkungsgrad', ''), g('η_LB', 'Leuchtenwirkungsgrad', ''), g('η_R', 'Raumwirkungsgrad', '')],
            zeilen: [
                { f: 'Φ = n · Φ_L', id: 'gesamtlichtstrom' },
                { f: 'Φ_L = Φ / n', id: 'gesamtlichtstrom' },
                { f: 'Φ = Φ_N / η_B', id: 'nutzlichtstrom' },
                { f: 'Φ = (E · A) / η_B' },
                { f: 'Φ_N = Φ · η_B', id: 'nutzlichtstrom' },
                { f: 'Φ_N = E · A', id: 'beleuchtungsstaerke' },
                { f: 'E = Φ_N / A', id: 'beleuchtungsstaerke' },
                { f: 'E = (n · Φ_L · η_B) / A' },
                { f: 'η_B = η_LB · η_R', id: 'betriebswirkungsgrad' },
                { f: 'η_B = Φ_N / Φ', id: 'nutzlichtstrom' }
            ]
        },
        {
            id: 'l-anlage', seite: 22, buch: 17,
            titel: 'Berechnung einer Beleuchtungsanlage',
            groessen: [g('E', 'Beleuchtungsstärke', 'lx'), g('Φ', 'gesamter Lichtstrom', 'lm'), g('Φ_L', 'Lichtstrom einer Leuchte', 'lm'), g('n', 'Anzahl Leuchten', ''), g('A', 'beleuchtete Fläche', 'm²'), g('η_B', 'Beleuchtungswirkungsgrad', ''), g('p', 'Planungsfaktor', ''), g('WF', 'Wartungsfaktor', '')],
            zeilen: [
                { f: 'E = (n · Φ_L · η_B) / (A · p)', id: 'leuchtenzahl' },
                { f: 'n = (E · A · p) / (Φ_L · η_B)', id: 'leuchtenzahl' },
                { f: 'η_B = (E · A · p) / (n · Φ_L)', id: 'leuchtenzahl' },
                { f: 'Φ = (E · A · p) / η_B' },
                { f: 'p = 1 / WF', id: 'planungsfaktor' }
            ],
            tabelle: [
                ['Verschmutzung', 'normal', 'erhöht'],
                ['Planungsfaktor p', '1,25', '1,43'],
                ['Wartungsfaktor WF', '0,8', '0,7']
            ]
        },
        {
            id: 'l-abstand', seite: 22, buch: 17,
            titel: 'Beleuchtungsstärke abhängig vom Leuchtenabstand',
            groessen: [g('E₁', 'Beleuchtungsstärke bei r₁', 'lx'), g('E₂', 'Beleuchtungsstärke bei r₂', 'lx'), g('r₁', 'Beleuchtungsabstand 1', 'm'), g('r₂', 'Beleuchtungsabstand 2', 'm')],
            zeilen: [
                { f: 'E₁ ≈ E₂ · r₂ / r₁', id: 'abstandsgesetz' },
                { f: 'E₂ ≈ E₁ · r₁ / r₂', id: 'abstandsgesetz-band' },
                { f: 'r₁ ≈ r₂ · E₂ / E₁', id: 'abstandsgesetz' },
                { f: 'r₂ ≈ r₁ · E₁ / E₂', id: 'abstandsgesetz' },
                { f: 'E₁ ≈ E₂ · (r₂ / r₁)²', id: 'abstandsgesetz' },
                { f: 'E₂ ≈ E₁ · (r₁ / r₂)²', id: 'abstandsgesetz' },
                { f: 'r₁ ≈ r₂ · √(E₂ / E₁)', id: 'abstandsgesetz' },
                { f: 'r₂ ≈ r₁ · √(E₁ / E₂)', id: 'abstandsgesetz' }
            ]
        },
        {
            id: 'l-lichtstaerke', seite: 22, buch: 17,
            titel: 'Lichtstärke',
            groessen: [g('I_V', 'Lichtstärke', 'cd = lm/sr'), g('Φ', 'Lichtstrom', 'lm'), g('Ω', 'Raumwinkel', 'sr (Steradiant)')],
            zeilen: [
                { f: 'I_V = Φ / Ω', id: 'lichtstaerke' },
                { f: 'Φ = I_V · Ω', id: 'lichtstaerke' }
            ]
        },
        {
            id: 'l-leuchtdichte', seite: 22, buch: 17,
            titel: 'Leuchtdichte',
            groessen: [g('L_V', 'Leuchtdichte', 'cd/m²'), g('I_V', 'Lichtstärke', 'cd'), g('A', 'beleuchtete Fläche', 'm²')],
            zeilen: [
                { f: 'L_V = I_V / A', id: 'leuchtdichte' },
                { f: 'I_V = L_V · A', id: 'leuchtdichte' }
            ]
        },
        {
            id: 's23-ptc-oder-kaltleiter', seite: 23, buch: 18,
            titel: 'PTC oder Kaltleiter',
            groessen: [],
            zeilen: []
        },
        {
            id: 's23-ntc-oder-heissleiter', seite: 23, buch: 18,
            titel: 'NTC oder Heissleiter',
            groessen: [],
            zeilen: []
        },
        {
            id: 's23-vdr', seite: 23, buch: 18,
            titel: 'VDR',
            groessen: [],
            zeilen: []
        },
        {
            id: 's23-ldr', seite: 23, buch: 18,
            titel: 'LDR',
            groessen: [],
            zeilen: []
        },
        {
            id: 's23-diode', seite: 23, buch: 18,
            titel: 'Diode',
            groessen: [],
            zeilen: []
        },
        {
            id: 's23-zenerdiode', seite: 23, buch: 18,
            titel: 'Zenerdiode',
            groessen: [],
            zeilen: []
        },
        {
            id: 's23-led-leuchtdiode', seite: 23, buch: 18,
            titel: 'LED Leuchtdiode',
            groessen: [],
            zeilen: []
        },
        {
            id: 's23-optokoppler', seite: 23, buch: 18,
            titel: 'Optokoppler',
            groessen: [],
            zeilen: []
        },
        {
            id: 's23-npn-transistor', seite: 23, buch: 18,
            titel: 'NPN Transistor',
            groessen: [],
            zeilen: []
        },
        {
            id: 's23-pnp-transistor', seite: 23, buch: 18,
            titel: 'PNP Transistor',
            groessen: [],
            zeilen: []
        },
        {
            id: 's23-thyristor', seite: 23, buch: 18,
            titel: 'Thyristor',
            groessen: [],
            zeilen: []
        },
        {
            id: 's23-triac', seite: 23, buch: 18,
            titel: 'Triac',
            groessen: [],
            zeilen: []
        },
        {
            id: 'gr-einweg', seite: 23, buch: 19,
            titel: 'Einweg-Schaltung',
            groessen: [g('U₁, I₁', 'Effektivwerte', ''), g('U₂, I₂', 'Arithm. Mittelwerte', '')],
            zeilen: [
                { f: 'ohne C: U₂ ≈ 0,45 · U₁', id: 'gleich-einweg-u' },
                { f: 'ohne C: I₂ ≈ 0,64 · I₁', id: 'gleich-einweg-i' },
                { f: 'mit C (Welligkeit 5%): U₂ ≈ 1,18 · U₁', id: 'gleich-einweg-u-c' },
                { f: 'mit C (Welligkeit 5%): I₂ ≈ 0,48 · I₁', id: 'gleich-einweg-i-c' }
            ]
        },
        {
            id: 'gr-mittel', seite: 23, buch: 19,
            titel: 'Mittelpunkt-Schaltung',
            groessen: [g('U₁, I₁', 'Effektivwerte', ''), g('U₂, I₂', 'Arithm. Mittelwerte', '')],
            zeilen: [
                { f: 'ohne C: U₂ ≈ 0,9 · U₁', id: 'gleich-mittel-u' },
                { f: 'ohne C: I₂ ≈ 1,26 · I₁', id: 'gleich-mittel-i' },
                { f: 'mit C (Welligkeit 5%): U₂ ≈ 1,27 · U₁', id: 'gleich-mittel-u-c' },
                { f: 'mit C (Welligkeit 5%): I₂ ≈ 0,9 · I₁', id: 'gleich-mittel-i-c' }
            ]
        },
        {
            id: 'gr-bruecke', seite: 23, buch: 19,
            titel: 'Brücken-Schaltung (Grätzschaltung)',
            groessen: [g('U₁, I₁', 'Effektivwerte', ''), g('U₂, I₂', 'Arithm. Mittelwerte', '')],
            zeilen: [
                { f: 'ohne C: U₂ ≈ 0,9 · U₁', id: 'gleich-bruecke-u' },
                { f: 'ohne C: I₂ ≈ 1,0 · I₁', id: 'gleich-bruecke-i' },
                { f: 'mit C (Welligkeit 5%): U₂ ≈ 1,27 · U₁', id: 'gleich-bruecke-u-c' },
                { f: 'mit C (Welligkeit 5%): I₂ ≈ 0,64 · I₁', id: 'gleich-bruecke-i-c' }
            ]
        },
        {
            id: 'gr-dreh', seite: 23, buch: 19,
            titel: 'Drehstrom-Brückenschaltung',
            groessen: [g('U₁, I₁', 'Effektivwerte', ''), g('U₂, I₂', 'Arithm. Mittelwerte', '')],
            zeilen: [
                { f: 'ohne C: U₂ ≈ 1,3 · U₁₂', id: 'gleich-dreh-u' },
                { f: 'ohne C: I₂ ≈ 1,2 · I₁', id: 'gleich-dreh-i' },
                { f: 'mit C (Welligkeit 5%): U₂ ≈ 1,3 · U₁₂', id: 'gleich-dreh-u' },
                { f: 'mit C (Welligkeit 5%): I₂ ≈ 1,2 · I₁', id: 'gleich-dreh-i' }
            ]
        },
        {
            id: 'el-diode', seite: 24, buch: 20,
            titel: 'Diodenschaltung (Leuchtdioden)',
            groessen: [g('U₁', 'Eingangsspannung', 'V'), g('U_F', 'Durchlassspannung', 'V'), g('U_V', 'Spannung an R_V', 'A'), g('I_F', 'Durchlassstrom', 'A'), g('R_V', 'Vorwiderstand', 'Ω'), g('P_V', 'Leistung von R_V', 'W'), g('P_D', 'Leistung der Diode', 'W')],
            zeilen: [
                { f: 'U_V = U₁ − U_F', id: 'diode-spannung-rv' },
                { f: 'I_F = (U₁ − U_F) / R_V', id: 'diode-vorwiderstand' },
                { f: 'R_V = (U₁ − U_F) / I_F', id: 'diode-vorwiderstand' },
                { f: 'P_V = U_V · I_F', id: 'diode-leistung-rv' },
                { f: 'P_D = U_F · I_F', id: 'diode-leistung' },
                { f: 'Si Diode: U_F ≈ 0.7 V', id: 'diode-spannung-rv' },
                { f: 'Leuchtdiode: U_F je nach Farbe: rot ≈ 1.7 V, grün ≈ 2.1 V, blau ≈ 2.9 V' }
            ]
        },
        {
            id: 'el-zener', seite: 24, buch: 20,
            titel: 'Spannungsbegrenzung mit Z-Diode',
            groessen: [g('U₁', 'Eingangsspannung', 'V'), g('U_L', 'Lastspannung', 'V'), g('U_V', 'Spannung an R_V', 'V'), g('U_Z', 'Zenerspannung', 'V'), g('I₁', 'Gesamtstrom', 'A'), g('I_L', 'Laststrom', 'A'), g('I_Z', 'Zenerstrom', 'A'), g('R_V', 'Vorwiderstand', 'Ω'), g('R_L', 'Lastwiderstand', 'Ω')],
            zeilen: [
                { f: 'U_L = U_Z' },
                { f: 'U_V = U₁ − U_Z' },
                { f: 'I₁ = (U₁ − U_Z) / R_V', id: 'zener-vorwiderstand' },
                { f: 'I_L = U_L / R_L', id: 'zener-laststrom' },
                { f: 'I_Z = I₁ − I_L', id: 'zener-strom' },
                { f: 'R_V = (U₁ − U_Z) / I₁', id: 'zener-vorwiderstand' }
            ]
        },
        {
            id: 'el-transistor', seite: 24, buch: 20,
            titel: 'Transistor',
            groessen: [g('U_b', 'Betriebsspannung', 'V'), g('U₁', 'Eingangsspannung', 'V'), g('U_L', 'Lastspannung', 'V'), g('U_CE', 'Kollektor-Emitter Spannung', 'V'), g('U_BE', 'Basis-Emitter Spannung', 'V'), g('I_C', 'Kollektorstrom, Laststrom', 'A'), g('I_B', 'Basisstrom', 'A'), g('R_V', 'Basisvorwiderstand', 'Ω'), g('R_L', 'Lastwiderstand', 'Ω'), g('B', 'Stromverstärkung', ''), g('ü', 'Übersteuerungsfaktor (ü = 2…5)', '')],
            zeilen: [
                { f: 'Transistor als Schalter, Ausgeschaltet: U_BE = 0 V' },
                { f: 'Transistor als Schalter, Ausgeschaltet: I_B = 0 A', id: 'transistor-basisvorwiderstand' },
                { f: 'Transistor als Schalter, Ausgeschaltet: U_L = 0 V', id: 'transistor-kollektorstrom' },
                { f: 'Transistor als Schalter, Ausgeschaltet: I_C = 0 A', id: 'transistor-basisstrom' },
                { f: 'Transistor als Schalter, Ausgeschaltet: U_CE = U_b', id: 'transistor-ce' },
                { f: 'Transistor als Schalter, Eingeschaltet: U_BE ≈ 0,7 V' },
                { f: 'Transistor als Schalter, Eingeschaltet: I_C = U_L / R_L', id: 'transistor-kollektorstrom' },
                { f: 'Transistor als Schalter, Eingeschaltet: U_CE ≈ 0 V', id: 'transistor-ce' },
                { f: 'Transistor als Schalter, Eingeschaltet: I_B = ü · I_C / B', id: 'transistor-uebersteuerung' },
                { f: 'Transistor als Schalter, Eingeschaltet: U₁ = I_B · R_V + 0,7 V', id: 'transistor-basisvorwiderstand' },
                { f: 'Transistor als Schalter, Eingeschaltet: I_B = (U₁ − 0,7 V) / R_V', id: 'transistor-basisvorwiderstand' },
                { f: 'Transistor als Schalter, Eingeschaltet: U_L ≈ U_b', id: 'transistor-ce' },
                { f: 'Transistor als Schalter, Eingeschaltet: R_V = (U₁ − 0,7 V) / I_B', id: 'transistor-basisvorwiderstand' },
                { f: 'Transistor als Schalter, Eingeschaltet: U_L = I_C · R_L', id: 'transistor-kollektorstrom' },
                { f: 'Transistor als Schalter, Eingeschaltet: R_L = U_L / I_C', id: 'transistor-kollektorstrom' },
                { f: 'Transistor als Verstärker: U_BE ≈ 0,7 V' },
                { f: 'Transistor als Verstärker: I_B = (U₁ − U_BE) / R_V' },
                { f: 'Transistor als Verstärker: U_L = I_C · R_L', id: 'transistor-kollektorstrom' },
                { f: 'Transistor als Verstärker: I_B = I_C / B', id: 'transistor-basisstrom' },
                { f: 'Transistor als Verstärker: U_CE = U_b − U_L', id: 'transistor-ce' },
                { f: 'Transistor als Verstärker: I_C = B · I_B', id: 'transistor-basisstrom' }
            ]
        },
        {
            id: 's25-nicht-verknuepfung', seite: 25, buch: 21,
            titel: 'NICHT-Verknüpfung (NOT)',
            groessen: [],
            zeilen: [
                { f: 'A = Y̅' }
            ],
            tabelle: [
                ['A', 'Y'],
                ['0', '1'],
                ['1', '0']
            ]
        },
        {
            id: 's25-und-verknuepfung', seite: 25, buch: 21,
            titel: 'UND-Verknüpfung (AND)',
            groessen: [],
            zeilen: [
                { f: 'A ∧ B = Y' }
            ],
            tabelle: [
                ['B', 'A', 'Y'],
                ['0', '0', '0'],
                ['0', '1', '0'],
                ['1', '0', '0'],
                ['1', '1', '1']
            ]
        },
        {
            id: 's25-nicht-und-verknuepfung', seite: 25, buch: 21,
            titel: 'NICHT-UND-Verknüpfung (NAND)',
            groessen: [],
            zeilen: [
                { f: 'A̅∧̅B̅ = Y' }
            ],
            tabelle: [
                ['B', 'A', 'Y'],
                ['0', '0', '1'],
                ['0', '1', '1'],
                ['1', '0', '1'],
                ['1', '1', '0']
            ]
        },
        {
            id: 's25-oder-verknuepfung', seite: 25, buch: 21,
            titel: 'ODER-Verknüpfung (OR)',
            groessen: [],
            zeilen: [
                { f: 'A ∨ B = Y' }
            ],
            tabelle: [
                ['B', 'A', 'Y'],
                ['0', '0', '0'],
                ['0', '1', '1'],
                ['1', '0', '1'],
                ['1', '1', '1']
            ]
        },
        {
            id: 's25-nicht-oder-verknuepfung', seite: 25, buch: 21,
            titel: 'NICHT-ODER-Verknüpfung (NOR)',
            groessen: [],
            zeilen: [
                { f: 'A̅∨̅B̅ = Y' }
            ],
            tabelle: [
                ['B', 'A', 'Y'],
                ['0', '0', '1'],
                ['0', '1', '0'],
                ['1', '0', '0'],
                ['1', '1', '0']
            ]
        },
        {
            id: 's25-antivalenz-verknuepfung', seite: 25, buch: 21,
            titel: 'Antivalenz-Verknüpfung (XOR)',
            groessen: [],
            zeilen: [
                { f: '(A ∧ B̅) ∨ (A̅ ∧ B) = Y' }
            ],
            tabelle: [
                ['B', 'A', 'Y'],
                ['0', '0', '0'],
                ['0', '1', '1'],
                ['1', '0', '1'],
                ['1', '1', '0']
            ]
        },
        {
            id: 's25-aequivalenz-verknuepfung', seite: 25, buch: 21,
            titel: 'Äquivalenz-Verknüpfung (XNOR)',
            groessen: [],
            zeilen: [
                { f: '(A ∧ B) ∨ (A̅ ∧ B̅) = Y' }
            ],
            tabelle: [
                ['B', 'A', 'Y'],
                ['0', '0', '1'],
                ['0', '1', '0'],
                ['1', '0', '0'],
                ['1', '1', '1']
            ]
        },
        {
            id: 's25-prozentrechnen', seite: 25, buch: 22,
            titel: 'Prozentrechnen',
            groessen: [g('p', 'Prozentsatz', '%'), g('G', 'Grundwert (entspricht 100 %)', ''), g('W', 'Prozentwert (Teil vom Grundwert)', '')],
            zeilen: [
                { f: 'p = W / G · 100 %' },
                { f: 'W = p · G / 100 %' },
                { f: 'G = W / p · 100 %' }
            ]
        },
        {
            id: 's25-pythagoras', seite: 25, buch: 22,
            titel: 'Pythagoras',
            groessen: [],
            zeilen: [
                { f: 'c² = a² + b²' },
                { f: 'c = √(a² + b²)' },
                { f: 'a = √(c² − b²)' },
                { f: 'b = √(c² − a²)' }
            ]
        },
        {
            id: 's25-trigonometrie', seite: 25, buch: 22,
            titel: 'Trigonometrie',
            groessen: [g('H', 'Hypotenuse', ''), g('AK', 'Ankathete, an α anliegend', ''), g('GK', 'Gegenkathete, α gegenüberliegend', '')],
            zeilen: [
                { f: 'sin α = GK / H' },
                { f: 'cos α = AK / H' },
                { f: 'tan α = GK / AK' },
                { f: 'α = sin⁻¹(GK / H)' },
                { f: 'α = cos⁻¹(AK / H)' },
                { f: 'H = GK / sin α' },
                { f: 'H = AK / cos α' },
                { f: 'GK = H · sin α' },
                { f: 'GK = AK · tan α' },
                { f: 'AK = H · cos α' },
                { f: 'AK = GK / tan α' }
            ]
        },
        {
            id: 's26-quadrat', seite: 26, buch: 1,
            titel: 'Quadrat',
            groessen: [g('A', 'Fläche', ''), g('a', 'Seitenlänge', ''), g('u', 'Umfang', ''), g('e', 'Eckmass', '')],
            zeilen: [
                { f: 'A = a²' },
                { f: 'u = 4 · a' },
                { f: 'a = √A' },
                { f: 'e = √2 · a' }
            ]
        },
        {
            id: 's26-rechteck', seite: 26, buch: 1,
            titel: 'Rechteck',
            groessen: [g('A', 'Fläche', ''), g('a', 'Länge', ''), g('b', 'Breite', ''), g('u', 'Umfang', ''), g('e', 'Eckmass', '')],
            zeilen: [
                { f: 'A = a · b' },
                { f: 'u = 2 · (a + b)' },
                { f: 'a = A / b' },
                { f: 'b = A / a' },
                { f: 'e = √(a² + b²)' }
            ]
        },
        {
            id: 's26-parallelogramm', seite: 26, buch: 1,
            titel: 'Parallelogramm',
            groessen: [g('A', 'Fläche', ''), g('a', 'Länge', ''), g('b', 'Breite', ''), g('c', 'Seitenlänge', ''), g('u', 'Umfang', '')],
            zeilen: [
                { f: 'A = a · b' },
                { f: 'u = 2 · (a + c)' },
                { f: 'a = A / b' },
                { f: 'b = A / a' }
            ]
        },
        {
            id: 's26-dreieck', seite: 26, buch: 1,
            titel: 'Dreieck',
            groessen: [g('A', 'Fläche', ''), g('a, b', 'Seitenlängen', ''), g('g', 'Grundlinie', ''), g('h', 'Höhe', ''), g('u', 'Umfang', '')],
            zeilen: [
                { f: 'A = (g · h) / 2' },
                { f: 'u = a + b + g' },
                { f: 'g = (2 · A) / h' },
                { f: 'h = (2 · A) / g' }
            ]
        },
        {
            id: 's26-trapez', seite: 26, buch: 1,
            titel: 'Trapez',
            groessen: [g('A', 'Fläche', ''), g('a₁', 'grosse Länge', ''), g('a₂', 'kleine Länge', ''), g('m', 'mittlere Länge', ''), g('b', 'Breite', ''), g('c, d', 'Seitenlängen', '')],
            zeilen: [
                { f: 'A = m · b' },
                { f: 'u = a₁ + a₂ + c + d' },
                { f: 'm = A / b' },
                { f: 'm = (a₁ + a₂) / 2' },
                { f: 'b = A / m' }
            ]
        },
        {
            id: 's26-kreis', seite: 26, buch: 1,
            titel: 'Kreis',
            groessen: [g('A', 'Fläche', ''), g('d', 'Durchmesser', ''), g('u', 'Umfang', '')],
            zeilen: [
                { f: 'A = (d² · π) / 4', id: 'leiterquerschnitt-d' },
                { f: 'A = r² · π' },
                { f: 'u = d · π' },
                { f: 'u = 2 · r · π' },
                { f: 'd = u / π' },
                { f: 'd = √(4 · A / π)' },
                { f: 'r = √(A / π)' }
            ]
        },
        {
            id: 's26-kreisring', seite: 26, buch: 1,
            titel: 'Kreisring',
            groessen: [g('A', 'Fläche', ''), g('D', 'Aussendurchmesser', ''), g('d', 'Innendurchmesser', ''), g('dₘ', 'mittlerer Durchmesser', ''), g('b', 'Kreisring Breite', ''), g('uₘ', 'mittlerer Umfang', '')],
            zeilen: [
                { f: 'A = π/4 · (D² − d²)' },
                { f: 'uₘ = dₘ · π' },
                { f: 'dₘ = (D + d) / 2' },
                { f: 'b = (D − d) / 2' },
                { f: 'dₘ = d + b' },
                { f: 'dₘ = D − b' }
            ]
        },
        {
            id: 's27-wuerfel', seite: 27, buch: 22,
            titel: 'Würfel',
            groessen: [g('V', 'Volumen', ''), g('A', 'Grundfläche', ''), g('O', 'Oberfläche', ''), g('a', 'Kantenlängen', ''), g('d', 'Raumdiagonale', '')],
            zeilen: [
                { f: 'V = a³' },
                { f: 'V = A · a' },
                { f: 'a = V / A' },
                { f: 'A = V / a' },
                { f: 'O = 6 · a²' },
                { f: 'd = √3 · a' }
            ]
        },
        {
            id: 's27-prisma', seite: 27, buch: 22,
            titel: 'Prisma',
            groessen: [g('V', 'Volumen', ''), g('A', 'Grundfläche', ''), g('O', 'Oberfläche', ''), g('a', 'Länge', ''), g('b', 'Breite', ''), g('h', 'Höhe', ''), g('d', 'Raumdiagonale', '')],
            zeilen: [
                { f: 'V = a · b · h' },
                { f: 'V = A · h' },
                { f: 'h = V / A' },
                { f: 'A = V / h' },
                { f: 'O = 2 · (a · b + a · h + b · h)' },
                { f: 'd = √(a² + b² + h²)' }
            ]
        },
        {
            id: 's27-zylinder', seite: 27, buch: 22,
            titel: 'Zylinder',
            groessen: [g('V', 'Volumen', ''), g('A', 'Grundfläche', ''), g('O', 'Oberfläche', ''), g('h', 'Höhe', ''), g('d', 'Durchmesser', '')],
            zeilen: [
                { f: 'V = (d² · π / 4) · h' },
                { f: 'V = A · h' },
                { f: 'h = V / A' },
                { f: 'A = V / h' },
                { f: 'O = d · π · h + (d² · π / 2)' }
            ]
        },
        {
            id: 's27-kegel', seite: 27, buch: 22,
            titel: 'Kegel',
            groessen: [g('V', 'Volumen', ''), g('A', 'Grundfläche', ''), g('O', 'Oberfläche', ''), g('h', 'Höhe', ''), g('a', 'Länge der Mantellinie', ''), g('d', 'Durchmesser', '')],
            zeilen: [
                { f: 'V = (π / 12) · d² · h' },
                { f: 'V = (A · h) / 3' },
                { f: 'h = (3 · V) / A' },
                { f: 'A = (3 · V) / h' },
                { f: 'O = (d / 2) · π · ((d / 2) + a)' },
                { f: 'a = √(h² + d² / 4)' }
            ]
        },
        {
            id: 's27-kugel', seite: 27, buch: 22,
            titel: 'Kugel',
            groessen: [g('V', 'Volumen', ''), g('O', 'Oberfläche', ''), g('d', 'Durchmesser', '')],
            zeilen: [
                { f: 'V = (d³ · π) / 6' },
                { f: 'O = d² · π' }
            ]
        },
        {
            id: 'sp-einlagig', seite: 27, buch: 23,
            titel: 'einlagige Spulen',
            groessen: [g('l', 'Drahtlänge', ''), g('d', 'Drahtdurchmesser', ''), g('d₁', 'Innendurchmesser', ''), g('d₂', 'Aussendurchmesser', ''), g('dₘ', 'mittlerer Durchmesser', ''), g('b', 'Spulenbreite', '')],
            zeilen: [
                { f: 'l = dₘ · π · N', id: 'spule-drahtlaenge' },
                { f: 'N = b / d', id: 'spule-windungen' },
                { f: 'dₘ = d₁ + d', id: 'spule-mittel-einlagig' },
                { f: 'dₘ = d₂ − d' }
            ]
        },
        {
            id: 'sp-mehrlagig', seite: 27, buch: 23,
            titel: 'mehrlagige Spulen',
            groessen: [g('N', 'Windungszahl total', ''), g('N₁', 'Windungen pro Lage', ''), g('N₂', 'Anzahl Lagen', '')],
            zeilen: [
                { f: 'l = dₘ · π · N', id: 'spule-drahtlaenge' },
                { f: 'dₘ = (d₁ + d₂) / 2', id: 'spule-mittel-mehrlagig' },
                { f: 'N = N₁ · N₂', id: 'spule-windungen-total' },
                { f: 'N₁ = b / d' },
                { f: 'N₂ = (d₂ − d₁) / (2 · d)', id: 'spule-lagen' }
            ]
        },
        {
            id: 's28-si-basiseinheiten', seite: 28, buch: 24,
            titel: 'SI-Basiseinheiten',
            groessen: [g('s (l, b, h)', 'Strecke, Länge', '1m'), g('m', 'Masse', '1kg'), g('t', 'Zeit', '1s'), g('T (ϑ)', 'Temperatur', '1K (1°C)'), g('I', 'Stromstärke', '1A'), g('Iᵥ', 'Lichtstärke', '1cd'), g('n', 'Stoffmenge', '1mol')],
            zeilen: [],
            tabelle: [
                ['Grösse', 'Formelzeichen', 'Einheit', 'Einheitenname'],
                ['Strecke, Länge', 's (l, b, h)', '1m', 'Meter'],
                ['Masse', 'm', '1kg', 'Kilogramm'],
                ['Zeit', 't', '1s', 'Sekunde'],
                ['Temperatur', 'T (ϑ)', '1K (1°C)', 'Kelvin'],
                ['Stromstärke', 'I', '1A', 'Ampere'],
                ['Lichtstärke', 'Iᵥ', '1cd', 'Candela'],
                ['Stoffmenge', 'n', '1mol', 'Mol']
            ]
        },
        {
            id: 's28-gleichfoermige-geradlinige-beweg', seite: 28, buch: 24,
            titel: 'Gleichförmige, geradlinige Bewegung',
            groessen: [g('v', 'Geschwindigkeit', 'm/s, km/h'), g('s', 'Weg', 'm, km'), g('t', 'Zeit', 's, h')],
            zeilen: [
                { f: 'v = s / t' },
                { f: 't = s / v' },
                { f: 's = v · t' },
                { f: '1 m/s = 3.6 km/h' }
            ]
        },
        {
            id: 's28-gleichmaessig-beschleunigte-bewe', seite: 28, buch: 24,
            titel: 'Gleichmässig beschleunigte Bewegung',
            groessen: [g('a', 'Beschleunigung', 'm/s²'), g('g', 'Fallbeschleunigung', 'm/s²'), g('v', 'Geschwindigkeit', 'm/s'), g('t', 'Beschleunigungszeit', 's'), g('s', 'Beschleunigungsweg', 'm')],
            zeilen: [
                { f: 'a = v / t' },
                { f: 'a = v² / (2 · s)' },
                { f: 'a = 2 · s / t²' },
                { f: 'v = a · t' },
                { f: 'v = 2 · s / t' },
                { f: 'v = √(2 · a · s)' },
                { f: 't = v / a' },
                { f: 't = 2 · s / v' },
                { f: 't = √(2 · s / a)' },
                { f: 's = v · t / 2' },
                { f: 's = v² / (2 · a)' },
                { f: 's = a · t² / 2' },
                { f: 'g = 9.81 m/s²' }
            ]
        },
        {
            id: 's28-beschleunigung-mit-anfangsgeschw', seite: 28, buch: 24,
            titel: 'Beschleunigung mit Anfangsgeschwindigkeit',
            groessen: [g('a', 'Beschleunigung', 'm/s²'), g('v', 'Geschwindigkeit', 'm/s'), g('t', 'Beschleunigungszeit', 's'), g('s', 'Beschleunigungsweg', 'm')],
            zeilen: [
                { f: 'v = v₀ + a · t' },
                { f: 'v = √(v₀² + 2 · a · s)' },
                { f: 's = (v₀ + v) · t / 2' },
                { f: 's = v₀ · t + a · t² / 2' },
                { f: 't = (v − v₀) / a' },
                { f: 't = 2 · s / (v₀ + v)' },
                { f: 'a = (v − v₀) / t' },
                { f: 'a = (v² − v₀²) / (2 · s)' }
            ]
        },
        {
            id: 's29-gleichfoermige-drehbewegung', seite: 29, buch: 24,
            titel: 'Gleichförmige Drehbewegung',
            groessen: [g('v', 'Umfangsgeschwindigkeit', 'm/s'), g('d', 'Durchmesser', 'm'), g('n', 'Drehzahl', '1/s'), g('N', 'Anzahl Umdrehungen', ''), g('t', 'Zeit', 's')],
            zeilen: [
                { f: 'v = d · π · n' },
                { f: 'v = d · π · N / t' },
                { f: 'd = v / (n · π)' },
                { f: 'n = v / (d · π)' },
                { f: '1 1/s = 60 1/min' }
            ]
        },
        {
            id: 's29-riemenuebersetzung', seite: 29, buch: 24,
            titel: 'Riemenübersetzung',
            groessen: [g('v', 'Umfangsgeschwindigkeit', 'm/s'), g('d', 'Durchmesser', 'm'), g('n', 'Drehzahl', '1/s'), g('i', 'Übersetzung', '')],
            zeilen: [
                { f: 'v₁ = v₂' },
                { f: 'd₁ · n₁ = d₂ · n₂' },
                { f: 'i = n₁ / n₂ = d₂ / d₁' },
                { f: 'd₁ = d₂ · n₂ / n₁' },
                { f: 'd₂ = d₁ · n₁ / n₂' },
                { f: 'n₁ = n₂ · d₂ / d₁' },
                { f: 'n₂ = n₁ · d₁ / d₂' },
                { f: '1 1/s = 60 1/min' }
            ]
        },
        {
            id: 's29-volumen-masse-dichte', seite: 29, buch: 24,
            titel: 'Volumen, Masse, Dichte',
            groessen: [g('V', 'Volumen', 'dm³, l'), g('m', 'Masse', 'kg'), g('ρ', 'Dichte', 'kg/dm³')],
            zeilen: [
                { f: 'ρ = m / V' },
                { f: 'V = m / ρ' },
                { f: 'm = V · ρ' }
            ],
            tabelle: [
                ['Wasser:', ''],
                ['1 dm³ = 1 l', '→ m = 1 kg'],
                ['1 m³ = 1\'000 l', '→ m = 1\'000 kg']
            ]
        },
        {
            id: 's29-gewichtskraft-beschleunigungskra', seite: 29, buch: 24,
            titel: 'Gewichtskraft, Beschleunigungskraft',
            groessen: [g('m', 'Masse', 'kg'), g('F', 'Beschleunigungskraft', 'N'), g('a', 'Beschleunigung', 'm/s²'), g('F_G', 'Gewichtskraft', 'N'), g('g', 'Fallbeschleunigung', 'm/s²')],
            zeilen: [
                { f: 'F = m · a' },
                { f: 'F_G = m · g' },
                { f: 'm = F / a' },
                { f: 'm = F / g' },
                { f: 'a = F / m' },
                { f: 'g = F_G / m' },
                { f: 'g = 9,81 m/s²' }
            ]
        },
        {
            id: 'p-arbeit', seite: 29, buch: 24,
            titel: 'Arbeit, Energie',
            groessen: [g('W', 'Arbeit, Energie', 'Nm, J, Ws'), g('F₁', 'Kraft in Wegrichtung', 'N'), g('s', 'Weg', 'm'), g('m', 'Masse', 'kg'), g('h', 'Höhe (Weg)', 'm'), g('g', 'Fallbeschleunigung', 'm/s²'), g('v', 'Geschwindigkeit', 'm/s')],
            zeilen: [
                { f: 'W = F₁ · s' },
                { f: 'F₁ = F · cos α' },
                { f: 's = W / F₁' },
                { f: 'F₁ = W / s' },
                { f: '1 Nm = 1 J = 1 Ws' },
                { f: 'W = m · g · h' },
                { f: 'h = W / (m · g)', id: 'hubarbeit' },
                { f: 'm = W / (g · h)', id: 'hubarbeit' },
                { f: 'W = m · v² / 2' },
                { f: 'v = √(2 · W / m)' },
                { f: 'm = 2 · W / v²' },
                { f: 'F₁ = m · g' }
            ]
        },
        {
            id: 'p-leistung', seite: 30, buch: 24,
            titel: 'Leistung',
            groessen: [g('P', 'Leistung', 'W'), g('W', 'Arbeit', 'Nm, J, Ws'), g('t', 'Zeit', 's'), g('F₁', 'Kraft in Wegrichtung', 'N'), g('s', 'Weg', 'm'), g('v', 'Geschwindigkeit', 'm/s')],
            zeilen: [
                { f: 'F₁ = F · cos α' },
                { f: 'P = W / t', id: 'hubleistung' },
                { f: 'P = F₁ · s / t' },
                { f: 'W = P · t', id: 'arbeit' },
                { f: 'P = F₁ · v' },
                { f: 't = W / P', id: 'hubleistung' },
                { f: 't = F₁ · s / P' },
                { f: 'F₁ = P / v' },
                { f: 'F₁ = P · t / s' }
            ]
        },
        {
            id: 'p-drehmoment', seite: 30, buch: 24,
            titel: 'Leistung aus Drehmoment und Drehzahl',
            groessen: [g('P', 'Leistung', 'W'), g('M', 'Drehmoment', 'Nm'), g('n', 'Drehzahl', '1/s'), g('F', 'Kraft', 'N'), g('d', 'Durchmesser', 'm')],
            zeilen: [
                { f: 'P = F · d · π · n' },
                { f: 'P = M · 2 · π · n', id: 'motorleistung' },
                { f: 'F = P / (d · π · n)' },
                { f: 'M = P / (2 · π · n)', id: 'motorleistung' },
                { f: 'n = P / (F · d · π)' },
                { f: 'n = P / (2 · π · M)', id: 'motorleistung' },
                { f: '1 1/s = 60 1/min' }
            ]
        },
        {
            id: 's30-wirkungsgrad', seite: 30, buch: 24,
            titel: 'Wirkungsgrad',
            groessen: [g('P_zu', 'zugeführte Leistung', 'W, kW'), g('P_ab', 'abgegebene Leistung', 'W, kW'), g('W_zu', 'zugeführte Arbeit', 'Nm, J, Ws'), g('W_ab', 'abgegebene Arbeit', 'Nm, J, Ws'), g('η', 'Wirkungsgrad', ''), g('η₁, η₂', 'Einzelwirkungsgrade', '')],
            zeilen: [
                { f: 'η = P_ab / P_zu', id: 'wirkungsgrad' },
                { f: 'η = W_ab / W_zu' },
                { f: 'P_ab = P_zu · η', id: 'wirkungsgrad' },
                { f: 'P_zu = P_ab / η', id: 'wirkungsgrad' },
                { f: 'W_ab = W_zu · η' },
                { f: 'W_zu = W_ab / η' },
                { f: 'Gesamtwirkungsgrad: η = η₁ · η₂ ⋯' }
            ]
        },
        {
            id: 's30-waermemenge', seite: 30, buch: 24,
            titel: 'Wärmemenge',
            groessen: [g('Q', 'zugeführte Wärmemenge', 'kJ'), g('m', 'Masse', 'kg'), g('ϑ', 'Temperatur', '°C'), g('T', 'absolute Temperatur', 'K'), g('Δϑ', 'Temperaturdifferenz', 'K'), g('c', 'spez. Wärmekapazität', '')],
            zeilen: [
                { f: 'Q = m · c · Δϑ', id: 'waermemenge' },
                { f: 'm = Q / (c · Δϑ)' },
                { f: 'Δϑ = Q / (m · c)' },
                { f: 'c = Q / (m · Δϑ)' },
                { f: 'Δϑ = ϑ₂ − ϑ₁ = T₂ − T₁' },
                { f: 'c_Wasser = 4,19 kJ/(kg·K)' }
            ]
        },
        {
            id: 's30-mischtemperatur', seite: 30, buch: 24,
            titel: 'Mischtemperatur',
            groessen: [g('ϑ', 'Mischtemperatur', '°C')],
            zeilen: [
                { f: 'm₁ · c₁ · ϑ₁ + m₂ · c₂ · ϑ₂ = (m₁ · c₁ + m₂ · c₂) · ϑ' },
                { f: 'ϑ = (m₁ · c₁ · ϑ₁ + m₂ · c₂ · ϑ₂) / (m₁ · c₁ + m₂ · c₂)' },
                { f: 'ϑ = (m₁ · ϑ₁ + m₂ · ϑ₂) / (m₁ + m₂)' },
                { f: 'ϑ₂ = ((m₁ + m₂) · ϑ − m₁ · ϑ₁) / m₂' },
                { f: 'm₂ = m₁ · (ϑ − ϑ₁) / (ϑ₂ − ϑ)' }
            ]
        },
        {
            id: 's31-laengenausdehnung', seite: 31, buch: 2,
            titel: 'Längenausdehnung',
            groessen: [g('Δl', 'Längenausdehnung', 'm'), g('Δϑ', 'Temperaturdifferenz', 'K'), g('α', 'Längenausdehnungszahl', '1/K')],
            zeilen: [
                { f: 'Δl = l₁ · α · Δϑ' },
                { f: 'l₂ = l₁ · (1 + α · Δϑ)' },
                { f: 'l₁ = Δl / (α · Δϑ)' },
                { f: 'Δϑ = Δl / (l₁ · α)' }
            ]
        },
        {
            id: 's31-volumenausdehnung', seite: 31, buch: 2,
            titel: 'Volumenausdehnung',
            groessen: [g('ΔV', 'Volumenausdehnung', 'm³, dm³'), g('Δϑ', 'Temperaturdifferenz', 'K'), g('γ', 'Volumenausdehnungszahl', '1/K'), g('α', 'Längenausdehnungszahl', '1/K')],
            zeilen: [
                { f: 'ΔV = V₁ · γ · Δϑ' },
                { f: 'V₂ = V₁ · (1 + γ · Δϑ)' },
                { f: 'V₁ = ΔV / (γ · Δϑ)' },
                { f: 'Δϑ = ΔV / (V₁ · γ)' },
                { f: 'γ ≈ 3 · α' }
            ]
        },
        {
            id: 's31-drehmoment', seite: 31, buch: 2,
            titel: 'Drehmoment',
            groessen: [g('M', 'Drehmoment', 'Nm'), g('F', 'Kraft', 'N'), g('l', 'wirksame Hebellänge', 'm')],
            zeilen: [
                { f: 'M = F · l' },
                { f: 'F = M / l' },
                { f: 'l = M / F' }
            ]
        },
        {
            id: 's31-einseitiger-hebel-zweiseitiger-h', seite: 31, buch: 2,
            titel: 'Einseitiger Hebel, Zweiseitiger Hebel',
            groessen: [g('F₁, F₂', 'Kräfte am Hebel', 'N'), g('l₁, l₂', 'wirksame Hebellängen', 'm')],
            zeilen: [
                { f: 'F₁ · l₁ = F₂ · l₂' },
                { f: 'F₁ = (F₂ · l₂) / l₁' },
                { f: 'F₂ = (F₁ · l₁) / l₂' },
                { f: 'l₁ = (F₂ · l₂) / F₁' },
                { f: 'l₂ = (F₁ · l₁) / F₂' }
            ]
        },
        {
            id: 's31-auflagedruck-druck-in-fluessigke', seite: 31, buch: 2,
            titel: 'Auflagedruck , Druck in Flüssigkeiten und Gasen',
            groessen: [g('p', 'Druck', 'N/m², Pa, bar'), g('F', 'Kraft', 'N'), g('A', 'Fläche', 'm²')],
            zeilen: [
                { f: 'p = F / A' },
                { f: 'A = F / p' },
                { f: 'F = p · A' },
                { f: '1 N/m² = 1 Pa' },
                { f: '1 bar = 100\'000 Pa = 10 N/cm²' }
            ]
        },
        {
            id: 's31-druckuebersetzung', seite: 31, buch: 2,
            titel: 'Druckübersetzung',
            groessen: [g('p₁, p₂', 'Druck', 'N/m², Pa, bar'), g('F₁, F₂', 'Kraft', 'N'), g('A₁, A₂', 'Fläche', 'm², cm²')],
            zeilen: [
                { f: 'p₁ = F₁ / A₁' },
                { f: 'p₁ = p₂' },
                { f: 'p₂ = F₂ / A₂' },
                { f: 'F₁ = (F₂ · A₁) / A₂' },
                { f: 'F₂ = (F₁ · A₂) / A₁' },
                { f: 'A₁ = (F₁ · A₂) / F₂' },
                { f: 'A₂ = (F₂ · A₁) / F₁' }
            ]
        },
        {
            id: 's32-wichtige-konstanten', seite: 32, buch: 25,
            titel: 'Wichtige Konstanten',
            groessen: [g('ε₀', 'elektrische Feldkonstante', 'As/Vm'), g('µ₀', 'magnetische Feldkonstante', 'Vs/Am'), g('g', 'örtliche Fallbeschleunigung', 'm/s²'), g('T₀', 'absoluter Nullpunkt', 'K'), g('c', 'Lichtgeschwindigkeit', 'km/s')],
            zeilen: [
                { f: 'ε₀ = 8.854 · 10⁻¹² As/Vm' },
                { f: 'µ₀ = 1.257 · 10⁻⁶ Vs/Am' },
                { f: 'g = 9.81 m/s²' },
                { f: 'T₀ = 0 K = −273.15 °C' },
                { f: 'c = 299\'792 km/s' }
            ],
            tabelle: [
                ['Konstante', 'Zeichen', 'Wert'],
                ['elektrische Feldkonstante', 'ε₀', '8.854 · 10⁻¹² As/Vm'],
                ['magnetische Feldkonstante', 'µ₀', '1.257 · 10⁻⁶ Vs/Am'],
                ['örtliche Fallbeschleunigung', 'g', '9.81 m/s²'],
                ['absoluter Nullpunkt', 'T₀', '0 K = −273.15 °C'],
                ['Lichtgeschwindigkeit', 'c', '299\'792 km/s']
            ]
        },
        {
            id: 's32-flaechen', seite: 32, buch: 26,
            titel: 'Flächen:',
            groessen: [],
            zeilen: [
                { f: '1 m² = 100 dm² = 10 000 cm² = 1 000 000 mm²' },
                { f: '0,01 m² = 1 dm² = 100 cm² = 10 000 mm²' },
                { f: '0,000 1 m² = 0,01 dm² = 1 cm² = 100 mm²' },
                { f: '0,000 001 m² = 0,000 1 dm² = 0,01 cm² = 1 mm²' }
            ],
            tabelle: [
                ['m²', 'dm²', 'cm²', 'mm²'],
                ['1 m²', '100 dm²', '10 000 cm²', '1 000 000 mm²'],
                ['0,01 m²', '1 dm²', '100 cm²', '10 000 mm²'],
                ['0,000 1 m²', '0,01 dm²', '1 cm²', '100 mm²'],
                ['0,000 001 m²', '0,000 1 dm²', '0,01 cm²', '1 mm²']
            ]
        },
        {
            id: 's32-volumen', seite: 32, buch: 26,
            titel: 'Volumen:',
            groessen: [],
            zeilen: [
                { f: '1 m³ = 1 000 dm³ = 1 000 000 cm³ = 1 000 000 000 mm³ = 1 000 l' },
                { f: '0,001 m³ = 1 dm³ = 1\'000 cm³ = 1 000 000 mm³ = 1 l' },
                { f: '0,000 001 m³ = 0,001 dm³ = 1 cm³ = 1 000 mm³ = 0,001 l' },
                { f: '0,000 000 001 m³ = 0,000 001 dm³ = 0,001 cm³ = 1 mm³ = 0,000 001 l' }
            ],
            tabelle: [
                ['m³', 'dm³', 'cm³', 'mm³', 'l'],
                ['1 m³', '1 000 dm³', '1 000 000 cm³', '1 000 000 000 mm³', '1 000 l'],
                ['0,001 m³', '1 dm³', '1\'000 cm³', '1 000 000 mm³', '1 l'],
                ['0,000 001 m³', '0,001 dm³', '1 cm³', '1 000 mm³', '0,001 l'],
                ['0,000 000 001 m³', '0,000 001 dm³', '0,001 cm³', '1 mm³', '0,000 001 l']
            ]
        },
        {
            id: 's32-zeit', seite: 32, buch: 26,
            titel: 'Zeit:',
            groessen: [],
            zeilen: [
                { f: '1 h = 60 min = 3\'600 s' },
                { f: '1/60 h = 1 min = 60 s' },
                { f: '1/3\'600 h = 1/60 min = 1 s' }
            ],
            tabelle: [
                ['h', 'min', 's'],
                ['1 h', '60 min', '3\'600 s'],
                ['1/60 h', '1 min', '60 s'],
                ['1/3\'600 h', '1/60 min', '1 s']
            ]
        },
        {
            id: 's32-arbeit-energie', seite: 32, buch: 26,
            titel: 'Arbeit, Energie:',
            groessen: [],
            zeilen: [
                { f: '1 J = 1 Ws = 1 Nm' },
                { f: '1 kWh = 3\'600\'000 Ws' }
            ]
        },
        {
            id: 's32-leistung', seite: 32, buch: 26,
            titel: 'Leistung:',
            groessen: [],
            zeilen: [
                { f: '1 W = 1 J/s = 1 Nm/s' }
            ]
        },
        {
            id: 's32-dichte', seite: 32, buch: 26,
            titel: 'Dichte:',
            groessen: [],
            zeilen: [
                { f: '1 kg/dm³ = 1 g/cm³' }
            ]
        },
        {
            id: 's32-zehnerpotenzen-und-einheitenvors', seite: 32, buch: 27,
            titel: 'Zehnerpotenzen und Einheitenvorsätze',
            groessen: [g('T', 'Tera', ''), g('G', 'Giga', ''), g('M', 'Mega', ''), g('k', 'kilo', ''), g('m', 'milli', ''), g('µ', 'mikro', ''), g('n', 'nano', ''), g('p', 'pico', ''), g('h', 'hekto', ''), g('da', 'deka', ''), g('d', 'dezi', ''), g('c', 'centi', '')],
            zeilen: [
                { f: '1k · 1m = 1' },
                { f: '1M · 1µ = 1' },
                { f: '1 / 1k = 1m' },
                { f: '1 / 1m = 1k' },
                { f: '1 / 1M = 1µ' },
                { f: '1 / 1µ = 1M' }
            ],
            tabelle: [
                ['Dezimalwert', 'Zehnerpotenz', 'Symbol', 'Name', 'Beispiele'],
                ['1\'000\'000\'000\'000', '10¹²', 'T', 'Tera', 'TJ, TWh'],
                ['1\'000\'000\'000', '10⁹', 'G', 'Giga', 'GHz, GW'],
                ['1\'000\'000', '10⁶', 'M', 'Mega', 'MW, MΩ'],
                ['1\'000', '10³', 'k', 'kilo', 'kg, kV'],
                ['1', '10⁰', '', '', ''],
                ['0,001', '10⁻³', 'm', 'milli', 'mA, mm'],
                ['0,000 001', '10⁻⁶', 'µ', 'mikro', 'µm, µF'],
                ['0,000 000 001', '10⁻⁹', 'n', 'nano', 'ns, nm'],
                ['0,000 000 000 001', '10⁻¹²', 'p', 'pico', 'pF'],
                ['100', '10²', 'h', 'hekto', 'hPa'],
                ['10', '10¹', 'da', 'deka', ''],
                ['1', '10⁰', '', '', ''],
                ['0,1', '10⁻¹', 'd', 'dezi', 'dl'],
                ['0,01', '10⁻²', 'c', 'centi', 'cm']
            ]
        },
        {
            id: 's33-werkstoffwerte', seite: 33, buch: 28,
            titel: 'Werkstoffwerte',
            groessen: [g('ρ', 'spezifischer Widerstand', 'Ω·mm²/m'), g('γ', 'elektrische Leitfähigkeit', 'm/(Ω·mm²)'), g('α', 'Temperaturkoeffizient', '1/K'), g('c', 'spez. Wärmekapazität', 'kJ/(kg·K)'), g('ρ', 'Dichte', 'kg/dm³')],
            zeilen: [],
            tabelle: [
                ['Stoff', 'Kurzzeichen', 'spezifischer Widerstand ρ in Ω·mm²/m', 'elektrische Leitfähigkeit γ in m/(Ω·mm²)', 'Temperaturkoeffizient α in 1/K', 'spez. Wärmekapazität c in kJ/(kg·K)', 'Dichte ρ in kg/dm³'],
                ['Aluminium', 'Al', '0,0278', '36', '0,004', '0,921', '2,7'],
                ['Blei', 'Pb', '0,208', '4,8', '0,00422', '0,13', '11,34'],
                ['Chrom', 'Cr', '0,130', '6,7', '–', '0,452', '7,19'],
                ['Eisen (rein)', 'Fe', '0,1', '10', '0,00657', '0,461', '7,87'],
                ['Gold', 'Au', '0,022', '45,7', '0,00398', '0,130', '19,3'],
                ['Kohle', '–', '100', '0,01', '−0,0005', '0,5', '2,0'],
                ['Kupfer', 'Cu', '0,0175', '57', '0,0039', '0,389', '8,9'],
                ['Platin', 'Pt', '0,098', '10,2', '0,0038', '0,134', '21,5'],
                ['Quecksilber', 'Hg', '0,9406', '1,063', '0,0009', '0,138', '13,5'],
                ['Silber', 'Ag', '0,0167', '60', '0,0041', '0,234', '10,5'],
                ['Wolfram', 'W', '0,055', '18,2', '0,0046', '0,142', '19,3'],
                ['Konstantan', 'CuNi 44', '0,49', '2,04', '0,00004', '0,410', '8,9'],
                ['Manganin', 'MgNi 12', '0,43', '2,33', '0,00001', '0,406', '8,4'],
                ['Wasser', 'H₂O', '–', '–', '–', '4,19', '1']
            ]
        },
        {
            id: 's33-elektrochemische-spannungsreihe', seite: 33, buch: 28,
            titel: 'Elektrochemische Spannungsreihe',
            groessen: [],
            zeilen: [],
            tabelle: [
                ['Stoff', 'Kurzzeichen', 'Spannung'],
                ['Gold', 'Au', '+ 1,40 V'],
                ['Platin', 'Pt', '+ 1,20 V'],
                ['Quecksilber', 'Hg', '+ 0,85 V'],
                ['Silber', 'Ag', '+ 0,80 V'],
                ['Kohle', 'C', '+ 0,74 V'],
                ['Kupfer', 'Cu', '+ 0,35 V'],
                ['Wasserstoff', 'H₂', '0,00 V'],
                ['Blei', 'Pb', '- 0,13 V'],
                ['Zinn', 'Sn', '- 0,14 V'],
                ['Nickel', 'Ni', '- 0,49 V'],
                ['Kadmium', 'Cd', '- 0,40 V'],
                ['Eisen', 'Fe', '- 0,44 V'],
                ['Chrom', 'Cr', '- 0,76 V'],
                ['Zink', 'Zn', '- 0,76 V'],
                ['Aluminium', 'Al', '- 1,66 V'],
                ['Magnesium', 'Mg', '- 2,38 V'],
                ['Natrium', 'Na', '- 2,71 V'],
                ['Kalzium', 'Ca', '- 2,76 V'],
                ['Kalium', 'K', '- 2,92 V'],
                ['Lithium', 'Li', '- 3,05 V']
            ]
        },
        {
            id: 's33-dielektrizitaetszahlen', seite: 33, buch: 28,
            titel: 'Dielektrizitätszahlen (Relative Permitivität) εᵣ',
            groessen: [g('εᵣ', 'Dielektrizitätszahl (Relative Permitivität)', '')],
            zeilen: [],
            tabelle: [
                ['Stoff', 'εᵣ'],
                ['Vakuum ≈ Luft', '1'],
                ['Polypropylen', '2,1'],
                ['Polyethylen', '2,4'],
                ['Polystyrol (Styropor)', '1,03'],
                ['Polytetrafluorethylen (Teflon)', '2'],
                ['Papier', '1…4'],
                ['Glimmer', '6…8'],
                ['Porzellan', '2…6'],
                ['Glas', '6…8'],
                ['Aluminiumoxid', '7']
            ]
        },
        {
            id: 's34-grundgroessen', seite: 34, buch: 29,
            titel: 'Grundgrössen',
            groessen: [g('Q', 'Ladung', 'C = As'), g('U', 'Spannung', 'V'), g('I', 'Stromstärke', 'A'), g('J', 'Stromdichte', 'A/mm²'), g('T', 'Periodendauer', 's'), g('f', 'Frequenz', 'Hz = 1/s'), g('ω', 'Kreisfrequenz', '1/s'), g('φ', 'Phasenverschiebungswinkel', '°')],
            zeilen: [
                { f: 'C = As' },
                { f: 'Hz = 1/s' }
            ],
            tabelle: [
                ['Formelzeichen', 'Grösse', 'Einheitenname', 'Einheitenzeichen'],
                ['Q', 'Ladung', 'Coulomb', 'C = As'],
                ['U', 'Spannung', 'Volt', 'V'],
                ['I', 'Stromstärke', 'Ampere', 'A'],
                ['J', 'Stromdichte', 'Ampere pro mm²', 'A/mm²'],
                ['T', 'Periodendauer', 'Sekunde', 's'],
                ['f', 'Frequenz', 'Hertz', 'Hz = 1/s'],
                ['ω', 'Kreisfrequenz', '1 / Sekund', '1/s'],
                ['φ', 'Phasenverschiebungswinkel', 'Grad', '°']
            ]
        },
        {
            id: 's34-widerstand-leitwert', seite: 34, buch: 29,
            titel: 'Widerstand, Leitwert',
            groessen: [g('R', 'Widerstand, Wirkwiderstand', 'Ω'), g('X_L', 'induktiver Blindwiderstand', 'Ω'), g('X_C', 'kapazitiver Blindwiderstand', 'Ω'), g('Z', 'Scheinwiderstand, Impedanz', 'Ω'), g('G', 'Leitwert, Wirkleitwert', 'S'), g('B_L', 'induktiver Blindleitwert', 'S'), g('B_C', 'kapazitiver Blindleitwert', 'S'), g('Y', 'Scheinleitwert', 'S'), g('ρ', 'spezifischer Widerstand', 'Ω · mm²/m'), g('γ', 'Leitfähigkeit', 'm/(Ω · mm²)'), g('α', 'Temperaturkoeffizient', '1/K')],
            zeilen: [],
            tabelle: [
                ['Formelzeichen', 'Grösse', 'Einheitenname', 'Einheitenzeichen'],
                ['R', 'Widerstand / Wirkwiderstand', 'Ohm', 'Ω'],
                ['X_L', 'induktiver Blindwiderstand', 'Ohm', 'Ω'],
                ['X_C', 'kapazitiver Blindwiderstand', 'Ohm', 'Ω'],
                ['Z', 'Scheinwiderstand / Impedanz', 'Ohm', 'Ω'],
                ['G', 'Leitwert / Wirkleitwert', 'Siemens', 'S'],
                ['B_L', 'induktiver Blindleitwert', 'Siemens', 'S'],
                ['B_C', 'kapazitiver Blindleitwert', 'Siemens', 'S'],
                ['Y', 'Scheinleitwert', 'Siemens', 'S'],
                ['ρ', 'spezifischer Widerstand', '', 'Ω · mm²/m'],
                ['γ', 'Leitfähigkeit', '', 'm/(Ω · mm²)'],
                ['α', 'Temperaturkoeffizient', '', '1/K']
            ]
        },
        {
            id: 's34-elektrisches-feld-kondensator-ma', seite: 34, buch: 29,
            titel: 'Elektrisches Feld, Kondensator, Magnetismus',
            groessen: [g('C', 'Kondensator-Kapazität', 'F = As/V'), g('ε₀', 'elektrische Feldkonstante', 'As/(Vm) = F/m'), g('εᵣ', 'Dielektrizitätszahl', 'reine Zahl'), g('τ', 'Zeitkonstante', 's'), g('L', 'Induktivität', 'H = Vs/A'), g('µ₀', 'magnetische Feldkonstante', 'Vs/(Am)'), g('µᵣ', 'relative Permeabilität', 'reine Zahl')],
            zeilen: [
                { f: 'F = As/V' },
                { f: 'As/(Vm) = F/m' },
                { f: 'H = Vs/A' }
            ],
            tabelle: [
                ['Formelzeichen', 'Grösse', 'Einheitenname', 'Einheitenzeichen'],
                ['C', 'Kondensator-Kapazität', 'Farad', 'F = As/V'],
                ['ε₀', 'elektrische Feldkonstante', '', 'As/(Vm) = F/m'],
                ['εᵣ', 'Dielektrizitätszahl', '', 'reine Zahl'],
                ['τ', 'Zeitkonstante', 'Sekunde', 's'],
                ['L', 'Induktivität', 'Henry', 'H = Vs/A'],
                ['µ₀', 'magnetische Feldkonstante', '', 'Vs/(Am)'],
                ['µᵣ', 'relative Permeabilität', '', 'reine Zahl']
            ]
        },
        {
            id: 's34-leistung-arbeit-energie-waermeen', seite: 34, buch: 29,
            titel: 'Leistung, Arbeit, Energie, Wärmeenergie',
            groessen: [g('Δϑ', 'Temperaturdifferenz', 'K'), g('c', 'spezifische Wärmekapazität', 'kJ/(kg · K)'), g('Q', 'Wärmeenergie', 'J'), g('W', 'elektrische Arbeit, Energie', 'Ws'), g('W', 'mechan. Arbeit, Energie', 'Nm'), g('S', 'Scheinleistung', 'VA'), g('P', 'Wirkleistung', 'W'), g('Q', 'Blindleistung', 'var')],
            zeilen: [],
            tabelle: [
                ['Formelzeichen', 'Grösse', 'Einheitenname', 'Einheitenzeichen'],
                ['Δϑ', 'Temperaturdifferenz', 'Kelvin', 'K'],
                ['c', 'spezifische Wärmekapazität', '', 'kJ/(kg · K)'],
                ['Q', 'Wärmeenergie', 'Joule', 'J'],
                ['W', 'elektrische Arbeit, Energie', 'Wattsekunde', 'Ws'],
                ['W', 'mechan. Arbeit, Energie', 'Newtonmeter', 'Nm'],
                ['S', 'Scheinleistung', 'Voltampere', 'VA'],
                ['P', 'Wirkleistung', 'Watt', 'W'],
                ['Q', 'Blindleistung', 'Voltampere reaktiv', 'var']
            ]
        },
        {
            id: 's34-beleuchtungstechnik', seite: 34, buch: 29,
            titel: 'Beleuchtungstechnik',
            groessen: [g('Φ', 'Lichtstrom', 'lm'), g('E', 'Beleuchtungsstärke', 'lx'), g('η', 'Lichtausbeute', 'lm/W'), g('η_B', 'Beleuchtungswirkungsgrad', 'reine Zahl'), g('η_LB', 'Leuchtenwirkungsgrad', 'reine Zahl'), g('η_R', 'Raumwirkungsgrad', 'reine Zahl'), g('p', 'Planungsfaktor', 'reine Zahl'), g('r', 'Beleuchtungsabstand', 'm'), g('I_V', 'Lichtstärke', 'cd'), g('L_V', 'Leuchtdichte', 'cd/m²'), g('λ', 'Wellenlänge', 'nm')],
            zeilen: [],
            tabelle: [
                ['Formelzeichen', 'Grösse', 'Einheitenname', 'Einheitenzeichen'],
                ['Φ', 'Lichtstrom', 'Lumen', 'lm'],
                ['E', 'Beleuchtungsstärke', 'Lux', 'lx'],
                ['η', 'Lichtausbeute', 'Lumen / Watt', 'lm/W'],
                ['η_B', 'Beleuchtungswirkungsgrad', '', 'reine Zahl'],
                ['η_LB', 'Leuchtenwirkungsgrad', '', 'reine Zahl'],
                ['η_R', 'Raumwirkungsgrad', '', 'reine Zahl'],
                ['p', 'Planungsfaktor', '', 'reine Zahl'],
                ['r', 'Beleuchtungsabstand', 'Meter', 'm'],
                ['I_V', 'Lichtstärke', 'Candela', 'cd'],
                ['L_V', 'Leuchtdichte', 'Candela pro m²', 'cd/m²'],
                ['λ', 'Wellenlänge', '', 'nm']
            ]
        }
    ];
    const WURZEL = Math.sqrt;
    const PI = Math.PI;
    const EINGEBAUT = [
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
        {
            id: 'spannungsteiler-belastet', kapitel: 'parallel',
            schreibweise: 'U₂ = U · R₂₃ / (R₁ + R₂₃)',
            groessen: [g('U₂', 'Teilspannung', 'V'), g('U', 'Gesamtspannung', 'V'),
                g('R₂₃', 'Ersatzwiderstand aus R₂ und R₃', 'Ω', 'R₂ parallel zur Last R₃ — erst zusammenfassen, dann teilen'),
                g('R₁', 'oberer Teilwiderstand', 'Ω')],
            loese: {
                'U₂': v => v.U * v['R₂₃'] / (v['R₁'] + v['R₂₃']),
                U: v => v['U₂'] * (v['R₁'] + v['R₂₃']) / v['R₂₃'],
                'R₂₃': v => v['U₂'] * v['R₁'] / (v.U - v['U₂']),
                'R₁': v => v['R₂₃'] * (v.U - v['U₂']) / v['U₂']
            },
            annahme: 'Belasteter Spannungsteiler. R₂₃ ist R₂ parallel zur Last R₃ — die ' +
                'Parallelschaltungsformel steht als eigene Formel bereit.',
            erklaerung: 'Sobald am Abgriff eine Last hängt, bricht die Teilspannung ein. ' +
                'Wer mit dem unbelasteten Teiler rechnet, bekommt zu viel heraus.'
        },
        {
            id: 'bruecke', kapitel: 'parallel', schreibweise: 'R_X = R₂ · R₃ / R₄',
            groessen: [g('R_X', 'gesuchter Widerstand', 'Ω'),
                g('R₂', 'Teilwiderstand', 'Ω'), g('R₃', 'Teilwiderstand', 'Ω'),
                g('R₄', 'Teilwiderstand', 'Ω')],
            loese: {
                R_X: v => v['R₂'] * v['R₃'] / v['R₄'],
                'R₂': v => v.R_X * v['R₄'] / v['R₃'],
                'R₃': v => v.R_X * v['R₄'] / v['R₂'],
                'R₄': v => v['R₂'] * v['R₃'] / v.R_X
            },
            annahme: 'Gilt für die ABGEGLICHENE Brücke, also wenn die Brückenspannung ' +
                'U_B = 0 V ist. Nur dann gilt R_X/R₂ = R₃/R₄.',
            erklaerung: 'Die Wheatstone-Brücke misst einen Widerstand, ohne Strom oder ' +
                'Spannung zu kennen — man gleicht ab, bis das Messgerät in der Mitte null zeigt.'
        },
        {
            id: 'digital-anzeigefehler', kapitel: 'messen',
            schreibweise: 'AF_abs = MW · k / 100 + z · a',
            groessen: [g('AF_abs', 'absoluter Anzeigefehler', ''),
                g('MW', 'angezeigter Messwert', ''),
                g('k', 'Genauigkeitsklasse', '%'),
                g('z', 'Unsicherheit der letzten Stelle', 'Digit'),
                g('a', 'Stellenwert der letzten Anzeigestelle', '')],
            loese: {
                AF_abs: v => v.MW * v.k / 100 + v.z * v.a,
                MW: v => (v.AF_abs - v.z * v.a) * 100 / v.k,
                k: v => (v.AF_abs - v.z * v.a) * 100 / v.MW,
                z: v => (v.AF_abs - v.MW * v.k / 100) / v.a,
                a: v => (v.AF_abs - v.MW * v.k / 100) / v.z
            },
            annahme: 'DIGITALES Messgerät. Beim analogen hängt der Fehler am Messbereich, ' +
                'beim digitalen am angezeigten WERT — plus den Digits der letzten Stelle.',
            erklaerung: 'Ein Digitalgerät irrt sich zweimal: um einen Anteil des Messwerts ' +
                'und um ein paar Schritte der letzten Ziffer. Beides zählt zusammen.'
        },
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
            id: 'temperatur', kapitel: 'leiter', schreibweise: 'R_ϑ = R₂₀ · (1 + α · Δϑ)',
            groessen: [g('R_ϑ', 'Widerstand warm', 'Ω'), g('R₂₀', 'Widerstand bei 20 °C', 'Ω'),
                g('α', 'Temperaturbeiwert', '1/K', 'Kupfer 0,0039'),
                g('Δϑ', 'Temperaturänderung', 'K')],
            loese: {
                'R_ϑ': v => v['R₂₀'] * (1 + v['α'] * v['Δϑ']),
                'R₂₀': v => v['R_ϑ'] / (1 + v['α'] * v['Δϑ']),
                'Δϑ': v => (v['R_ϑ'] / v['R₂₀'] - 1) / v['α'],
                'α': v => (v['R_ϑ'] / v['R₂₀'] - 1) / v['Δϑ']
            },
            annahme: 'α gilt für den Bereich, in dem der Zusammenhang linear ist.',
            erklaerung: 'Metall wird bei Wärme hochohmiger. Deshalb zieht ein kalter Motor mehr Strom.'
        },
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
        {
            id: 'quelle-innerer-abfall', kapitel: 'quelle', schreibweise: 'U_Ri = U₀ − U',
            groessen: [g('U_Ri', 'Spannungsabfall am Innenwiderstand', 'V'),
                g('U₀', 'Leerlaufspannung', 'V'), g('U', 'Klemmenspannung', 'V')],
            loese: {
                U_Ri: v => v['U₀'] - v.U,
                'U₀': v => v.U + v.U_Ri,
                U: v => v['U₀'] - v.U_Ri
            },
            erklaerung: 'Was an den Klemmen fehlt, ist im Inneren geblieben. Die Differenz ist messbar, der Innenwiderstand selbst nicht.'
        },
        {
            id: 'quelle-kurzschlussstrom', kapitel: 'quelle', schreibweise: 'I_KS = U₀ / Rᵢ',
            groessen: [g('I_KS', 'Kurzschlussstrom', 'A'), g('U₀', 'Leerlaufspannung', 'V'),
                g('Rᵢ', 'Innenwiderstand', 'Ω')],
            loese: {
                I_KS: v => v['U₀'] / v['Rᵢ'],
                'U₀': v => v.I_KS * v['Rᵢ'],
                'Rᵢ': v => v['U₀'] / v.I_KS
            },
            erklaerung: 'Sind die Klemmen kurzgeschlossen, begrenzt nur noch der Innenwiderstand. Bei einem Autoakku sind das mehrere hundert Ampere — und darum ist der Kurzschluss dort gefährlich, nicht bloss ärgerlich.'
        },
        {
            id: 'elemente-reihe-spannung', kapitel: 'quelle', schreibweise: 'U₀ = n · U₀₁',
            groessen: [g('U₀', 'gesamte Leerlaufspannung', 'V'), g('n', 'Anzahl Elemente', ''),
                g('U₀₁', 'Leerlaufspannung eines Elements', 'V')],
            loese: {
                'U₀': v => v.n * v['U₀₁'],
                n: v => v['U₀'] / v['U₀₁'],
                'U₀₁': v => v['U₀'] / v.n
            },
            erklaerung: 'In Reihe addieren sich die Spannungen. Sechs Zellen zu 2 V ergeben die 12 V der Autobatterie.'
        },
        {
            id: 'elemente-reihe-widerstand', kapitel: 'quelle', schreibweise: 'Rᵢ = n · Rᵢ₁',
            groessen: [g('Rᵢ', 'gesamter Innenwiderstand', 'Ω'), g('n', 'Anzahl Elemente', ''),
                g('Rᵢ₁', 'Innenwiderstand eines Elements', 'Ω')],
            loese: {
                'Rᵢ': v => v.n * v['Rᵢ₁'],
                n: v => v['Rᵢ'] / v['Rᵢ₁'],
                'Rᵢ₁': v => v['Rᵢ'] / v.n
            },
            erklaerung: 'Mit der Spannung wächst auch der Innenwiderstand — die Zellen liegen ja hintereinander.'
        },
        {
            id: 'elemente-parallel-widerstand', kapitel: 'quelle', schreibweise: 'Rᵢ = Rᵢ₁ / n',
            groessen: [g('Rᵢ', 'gesamter Innenwiderstand', 'Ω'),
                g('Rᵢ₁', 'Innenwiderstand eines Elements', 'Ω'),
                g('n', 'Anzahl Elemente', '')],
            loese: {
                'Rᵢ': v => v['Rᵢ₁'] / v.n,
                'Rᵢ₁': v => v['Rᵢ'] * v.n,
                n: v => v['Rᵢ₁'] / v['Rᵢ']
            },
            erklaerung: 'Parallel bleibt die Spannung, aber der Innenwiderstand sinkt. Darum werden Zellen parallel geschaltet, wenn viel Strom gebraucht wird.'
        },
        {
            id: 'elemente-parallel-strom', kapitel: 'quelle', schreibweise: 'I = n · I₁',
            groessen: [g('I', 'Laststrom', 'A'), g('n', 'Anzahl Elemente', ''),
                g('I₁', 'Strom eines Elements', 'A')],
            loese: {
                I: v => v.n * v['I₁'],
                n: v => v.I / v['I₁'],
                'I₁': v => v.I / v.n
            },
            erklaerung: 'Bei gleichen Elementen teilt sich der Laststrom zu gleichen Teilen auf. Sind sie ungleich, stimmt das nicht mehr — und die stärkere Zelle lädt die schwächere.'
        },
        {
            id: 'akku-ladekapazitaet', kapitel: 'akku', schreibweise: 'Q_L = I_L · t_L',
            groessen: [g('Q_L', 'Ladekapazität', 'Ah'), g('I_L', 'Ladestrom', 'A'),
                g('t_L', 'Ladezeit', 'h')],
            loese: {
                Q_L: v => v.I_L * v.t_L,
                I_L: v => v.Q_L / v.t_L,
                t_L: v => v.Q_L / v.I_L
            },
            erklaerung: 'Ladung ist Strom mal Zeit. Beim Akku wird in Stunden gerechnet, nicht in Sekunden — darum Ah und nicht As.'
        },
        {
            id: 'akku-entladekapazitaet', kapitel: 'akku', schreibweise: 'Q_E = I_E · t_E',
            groessen: [g('Q_E', 'Entladekapazität', 'Ah'), g('I_E', 'Entladestrom', 'A'),
                g('t_E', 'Entladezeit', 'h')],
            loese: {
                Q_E: v => v.I_E * v.t_E,
                I_E: v => v.Q_E / v.t_E,
                t_E: v => v.Q_E / v.I_E
            },
            erklaerung: 'Dieselbe Rechnung in der anderen Richtung. Sie kommt nie ganz auf die Ladekapazität heraus.'
        },
        {
            id: 'akku-ladeenergie', kapitel: 'akku', schreibweise: 'W_L = Q_L · U_L',
            groessen: [g('W_L', 'Ladeenergie', 'Wh'), g('Q_L', 'Ladekapazität', 'Ah'),
                g('U_L', 'Ladespannung', 'V')],
            loese: {
                W_L: v => v.Q_L * v.U_L,
                Q_L: v => v.W_L / v.U_L,
                U_L: v => v.W_L / v.Q_L
            },
            erklaerung: 'Aus Ladung wird Energie, sobald die Spannung dazukommt: Ah mal V ergibt Wh.'
        },
        {
            id: 'akku-entladeenergie', kapitel: 'akku', schreibweise: 'W_E = Q_E · U_E',
            groessen: [g('W_E', 'Entladeenergie', 'Wh'), g('Q_E', 'Entladekapazität', 'Ah'),
                g('U_E', 'Entladespannung', 'V')],
            loese: {
                W_E: v => v.Q_E * v.U_E,
                Q_E: v => v.W_E / v.U_E,
                U_E: v => v.W_E / v.Q_E
            },
            erklaerung: 'Was der Akku wirklich abgibt. Die Entladespannung liegt unter der Ladespannung, und darum ist W_E kleiner als W_L.'
        },
        {
            id: 'akku-ladungswirkungsgrad', kapitel: 'akku', schreibweise: 'η_Ah = Q_E / Q_L',
            groessen: [g('η_Ah', 'Ladungswirkungsgrad', ''), g('Q_E', 'Entladekapazität', 'Ah'),
                g('Q_L', 'Ladekapazität', 'Ah')],
            loese: {
                'η_Ah': v => v.Q_E / v.Q_L,
                Q_E: v => v.Q_L * v['η_Ah'],
                Q_L: v => v.Q_E / v['η_Ah']
            },
            erklaerung: 'Wie viel Ladung wieder herauskommt. Immer unter eins — ein Teil geht in Wärme und Nebenreaktionen.'
        },
        {
            id: 'akku-energiewirkungsgrad', kapitel: 'akku', schreibweise: 'η_Wh = W_E / W_L',
            groessen: [g('η_Wh', 'Energiewirkungsgrad', ''), g('W_E', 'Entladeenergie', 'Wh'),
                g('W_L', 'Ladeenergie', 'Wh')],
            loese: {
                'η_Wh': v => v.W_E / v.W_L,
                W_E: v => v.W_L * v['η_Wh'],
                W_L: v => v.W_E / v['η_Wh']
            },
            erklaerung: 'Der schlechtere der beiden Wirkungsgrade — weil die Entladespannung tiefer liegt als die Ladespannung, geht neben der Ladung auch noch Spannung verloren.'
        },
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
            id: 'plattenkondensator', kapitel: 'konden', schreibweise: 'C = ε₀ · εᵣ · A / l',
            groessen: [g('C', 'Kapazität', 'F'),
                g('ε₀', 'elektrische Feldkonstante', 'F/m', 'fest: 8,854·10⁻¹²'),
                g('εᵣ', 'Dielektrizitätszahl', '', 'Luft 1, Papier ≈ 2,3'),
                g('A', 'Plattenfläche', 'm²'), g('l', 'Plattenabstand', 'm')],
            loese: {
                C: v => v['ε₀'] * v['εᵣ'] * v.A / v.l,
                A: v => v.C * v.l / (v['ε₀'] * v['εᵣ']),
                l: v => v['ε₀'] * v['εᵣ'] * v.A / v.C,
                'εᵣ': v => v.C * v.l / (v['ε₀'] * v.A)
            },
            erklaerung: 'Grosse Fläche und kleiner Abstand geben viel Kapazität.'
        },
        {
            id: 'kondensator-ladung', kapitel: 'konden', schreibweise: 'Q = C · U',
            groessen: [g('Q', 'gespeicherte Ladung', 'As'), g('C', 'Kapazität', 'F'),
                g('U', 'Spannung am Kondensator', 'V')],
            loese: { Q: v => v.C * v.U, C: v => v.Q / v.U, U: v => v.Q / v.C },
            erklaerung: 'Was ein Kondensator fasst. 1 As = 1 Coulomb.'
        },
        {
            id: 'kondensator-energie', kapitel: 'konden', schreibweise: 'W = ½ · C · U²',
            groessen: [g('W', 'gespeicherte Energie', 'Ws'), g('C', 'Kapazität', 'F'),
                g('U', 'Spannung am Kondensator', 'V')],
            loese: {
                W: v => 0.5 * v.C * v.U * v.U,
                C: v => 2 * v.W / (v.U * v.U),
                U: v => WURZEL(2 * v.W / v.C)
            },
            erklaerung: 'Die Energie wächst im QUADRAT der Spannung — deshalb ist ein ' +
                'geladener Kondensator auch nach dem Ausschalten gefährlich.'
        },
        {
            id: 'feldstaerke-kondensator', kapitel: 'konden', schreibweise: 'E = U / l',
            groessen: [g('E', 'elektrische Feldstärke', 'V/m'),
                g('U', 'Spannung am Kondensator', 'V'),
                g('l', 'Plattenabstand', 'm')],
            loese: { E: v => v.U / v.l, U: v => v.E * v.l, l: v => v.U / v.E },
            erklaerung: 'Wie stark das Feld zwischen den Platten ist. Wird sie zu gross, ' +
                'schlägt es durch.'
        },
        {
            id: 'zeitkonstante', kapitel: 'konden', schreibweise: 'τ = R · C',
            groessen: [g('τ', 'Zeitkonstante', 's'), g('R', 'Widerstand', 'Ω'),
                g('C', 'Kapazität', 'F')],
            loese: { 'τ': v => v.R * v.C, R: v => v['τ'] / v.C, C: v => v['τ'] / v.R },
            erklaerung: 'Nach einer Zeitkonstanten ist der Kondensator auf 63 % geladen — ' +
                'oder beim Entladen auf 37 % gefallen.'
        },
        {
            id: 'ladezeit', kapitel: 'konden', schreibweise: 't = 5 · τ',
            groessen: [g('t', 'Lade- bzw. Entladezeit', 's', 'Bis praktisch fertig'),
                g('τ', 'Zeitkonstante', 's')],
            loese: { t: v => 5 * v['τ'], 'τ': v => v.t / 5 },
            annahme: 'Nach fünf Zeitkonstanten sind über 99 % erreicht. Ganz fertig wird ' +
                'ein Kondensator theoretisch nie — praktisch gilt er hier als geladen.',
            erklaerung: 'Die Faustregel, mit der man rechnet.'
        },
        {
            id: 'ladestrom-anfang', kapitel: 'konden', schreibweise: 'I₀ = U / R',
            groessen: [g('I₀', 'Anfangswert des Lade- oder Entladestroms', 'A'),
                g('U', 'Spannung', 'V'), g('R', 'Widerstand', 'Ω')],
            loese: { 'I₀': v => v.U / v.R, U: v => v['I₀'] * v.R, R: v => v.U / v['I₀'] },
            erklaerung: 'Im ersten Augenblick ist der Kondensator noch leer und wirkt wie ' +
                'ein Kurzschluss — nur der Widerstand begrenzt den Strom.'
        },
        {
            id: 'kondensator-gleiche', kapitel: 'konden', schreibweise: 'C = n · C₁',
            groessen: [g('C', 'Gesamtkapazität', 'F'), g('n', 'Anzahl Kondensatoren', ''),
                g('C₁', 'Kapazität eines einzelnen', 'F')],
            loese: { C: v => v.n * v['C₁'], n: v => v.C / v['C₁'], 'C₁': v => v.C / v.n },
            annahme: 'PARALLELSCHALTUNG von n GLEICHEN Kondensatoren. In Reihe geschaltet ' +
                'gilt umgekehrt C = C₁ / n.',
            erklaerung: 'Beim Kondensator ist es genau andersherum als beim Widerstand: ' +
                'parallel addieren sich die Kapazitäten.'
        },
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
        {
            id: 'trafo-nennleistung', kapitel: 'trafo', schreibweise: 'S_N = U₂N · I₂N',
            groessen: [g('S_N', 'Nennleistung', 'VA'),
                g('U₂N', 'Sekundärnennspannung', 'V'),
                g('I₂N', 'Sekundärnennstrom', 'A')],
            loese: {
                S_N: v => v['U₂N'] * v['I₂N'],
                'U₂N': v => v.S_N / v['I₂N'],
                'I₂N': v => v.S_N / v['U₂N']
            },
            annahme: 'Einphasentransformator. Beim Drehstromtransformator kommt die ' +
                'Wurzel aus 3 dazu — dafür gibt es die eigene Formel.',
            erklaerung: 'Was auf dem Typenschild steht: SCHEINleistung in VA, nicht ' +
                'Wirkleistung in W. Wie viel davon Wirkleistung wird, hängt an der Last.'
        },
        {
            id: 'trafo-nennleistung-dreh', kapitel: 'trafo',
            schreibweise: 'S_N = √3 · U₂N · I₂N',
            groessen: [g('S_N', 'Nennleistung', 'VA'),
                g('U₂N', 'Sekundärnennspannung', 'V', 'Aussenleiterspannung'),
                g('I₂N', 'Sekundärnennstrom', 'A')],
            loese: {
                S_N: v => WURZEL(3) * v['U₂N'] * v['I₂N'],
                'U₂N': v => v.S_N / (WURZEL(3) * v['I₂N']),
                'I₂N': v => v.S_N / (WURZEL(3) * v['U₂N'])
            },
            annahme: 'Drehstromtransformator.',
            erklaerung: 'Dasselbe für den Drehstromtransformator.'
        },
        {
            id: 'trafo-wirkungsgrad', kapitel: 'trafo',
            schreibweise: 'η = P₂ / (P₂ + P_Cu + P_Fe)',
            groessen: [g('η', 'Wirkungsgrad', ''),
                g('P₂', 'Sekundärwirkleistung', 'W'),
                g('P_Cu', 'Kupferverluste', 'W', 'In den Wicklungen — steigen mit dem Strom'),
                g('P_Fe', 'Eisenverluste', 'W', 'Im Kern — bleiben auch im Leerlauf')],
            loese: {
                'η': v => v['P₂'] / (v['P₂'] + v.P_Cu + v.P_Fe),
                'P₂': v => v['η'] * (v.P_Cu + v.P_Fe) / (1 - v['η']),
                P_Cu: v => v['P₂'] / v['η'] - v['P₂'] - v.P_Fe,
                P_Fe: v => v['P₂'] / v['η'] - v['P₂'] - v.P_Cu
            },
            erklaerung: 'Ein Transformator hat zwei Sorten Verluste. Die Eisenverluste ' +
                'entstehen auch dann, wenn nichts angeschlossen ist — deshalb lohnt es sich, ' +
                'einen unbenutzten Trafo vom Netz zu nehmen.'
        },
        {
            id: 'trafo-induzierte-spannung', kapitel: 'trafo',
            schreibweise: 'u_i = N · ΔΦ / Δt',
            groessen: [g('u_i', 'induzierte Spannung', 'V'),
                g('N', 'Windungszahl', ''),
                g('ΔΦ', 'Flussänderung', 'Wb'),
                g('Δt', 'Zeitspanne', 's')],
            loese: {
                u_i: v => v.N * v['ΔΦ'] / v['Δt'],
                N: v => v.u_i * v['Δt'] / v['ΔΦ'],
                'ΔΦ': v => v.u_i * v['Δt'] / v.N,
                'Δt': v => v.N * v['ΔΦ'] / v.u_i
            },
            annahme: 'Der Betrag. Das Minuszeichen sagt die RICHTUNG — die induzierte ' +
                'Spannung wirkt der Änderung entgegen.',
            erklaerung: 'Warum ein Transformator nur mit Wechselstrom funktioniert: ohne ' +
                'ÄNDERUNG des Flusses wird nichts induziert.'
        },
        {
            id: 'spartrafo-bauleistung', kapitel: 'trafo',
            schreibweise: 'S_B = S_D · (U₁ − U₂) / U₁',
            groessen: [g('S_B', 'Bauleistung', 'VA', 'Wonach der Trafo dimensioniert wird'),
                g('S_D', 'Durchgangsleistung', 'VA', 'Was durchgereicht wird — die Nennleistung'),
                g('U₁', 'Primärspannung', 'V'),
                g('U₂', 'Sekundärspannung', 'V')],
            loese: {
                S_B: v => v.S_D * (v['U₁'] - v['U₂']) / v['U₁'],
                S_D: v => v.S_B * v['U₁'] / (v['U₁'] - v['U₂']),
                'U₁': v => v['U₂'] / (1 - v.S_B / v.S_D),
                'U₂': v => v['U₁'] * (1 - v.S_B / v.S_D)
            },
            annahme: 'Spartransformator mit U₁ > U₂. Für U₁ < U₂ steht (U₂ − U₁) / U₂ ' +
                'im Zähler — die andere Formel.',
            erklaerung: 'DAS ist der Vorteil des Spartransformators: er muss nur für den ' +
                'UNTERSCHIED gebaut werden, nicht für die ganze Leistung. Bei 400 V auf 380 V ' +
                'ist die Bauleistung nur ein Zwanzigstel der Durchgangsleistung.'
        },
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
            id: 'beleuchtungsstaerke', kapitel: 'licht', schreibweise: 'E = Φ_N / A',
            groessen: [g('E', 'Beleuchtungsstärke', 'lx'),
                g('Φ_N', 'Nutzlichtstrom', 'lm', 'was nach allen Verlusten auf der Fläche ankommt'),
                g('A', 'Fläche', 'm²')],
            loese: {
                E: v => v['Φ_N'] / v.A,
                'Φ_N': v => v.E * v.A,
                A: v => v['Φ_N'] / v.E
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
        {
            id: 'gesamtlichtstrom', kapitel: 'licht', schreibweise: 'Φ = n · Φ_L',
            groessen: [g('Φ', 'gesamter Lichtstrom', 'lm'),
                g('n', 'Anzahl Leuchten', ''),
                g('Φ_L', 'Lichtstrom einer Leuchte', 'lm')],
            loese: {
                'Φ': v => v.n * v['Φ_L'],
                n: v => v['Φ'] / v['Φ_L'],
                'Φ_L': v => v['Φ'] / v.n
            },
            erklaerung: 'Alle Leuchten zusammen.'
        },
        {
            id: 'nutzlichtstrom', kapitel: 'licht', schreibweise: 'Φ_N = Φ · η_B',
            groessen: [g('Φ_N', 'Nutzlichtstrom', 'lm', 'Was unten auf der Fläche ankommt'),
                g('Φ', 'gesamter Lichtstrom', 'lm'),
                g('η_B', 'Beleuchtungswirkungsgrad', '')],
            loese: {
                'Φ_N': v => v['Φ'] * v['η_B'],
                'Φ': v => v['Φ_N'] / v['η_B'],
                'η_B': v => v['Φ_N'] / v['Φ']
            },
            erklaerung: 'Ein Teil des Lichts verschwindet an Decke und Wänden. Nur der ' +
                'Rest zählt für die Beleuchtungsstärke.'
        },
        {
            id: 'betriebswirkungsgrad', kapitel: 'licht', schreibweise: 'η_B = η_LB · η_R',
            groessen: [g('η_B', 'Beleuchtungswirkungsgrad', ''),
                g('η_LB', 'Leuchtenwirkungsgrad', '', 'Wie viel die Leuchte selbst durchlässt'),
                g('η_R', 'Raumwirkungsgrad', '', 'Wie hell Wände und Decke sind')],
            loese: {
                'η_B': v => v['η_LB'] * v['η_R'],
                'η_LB': v => v['η_B'] / v['η_R'],
                'η_R': v => v['η_B'] / v['η_LB']
            },
            erklaerung: 'Der Beleuchtungswirkungsgrad hat zwei Ursachen: die Leuchte und ' +
                'der Raum. Ein weisser Raum bringt spürbar mehr als ein dunkler.'
        },
        {
            id: 'planungsfaktor', kapitel: 'licht', schreibweise: 'p = 1 / WF',
            groessen: [g('p', 'Planungsfaktor', '', 'Normal 1,25, bei erhöhter Verschmutzung 1,43'),
                g('WF', 'Wartungsfaktor', '', 'Normal 0,8, bei erhöhter Verschmutzung 0,7')],
            loese: { p: v => 1 / v.WF, WF: v => 1 / v.p },
            erklaerung: 'Lampen altern und Leuchten verschmutzen. Deshalb wird von Anfang ' +
                'an mehr geplant, als am ersten Tag nötig wäre.'
        },
        {
            id: 'lichtstaerke', kapitel: 'licht', schreibweise: 'I_V = Φ / Ω',
            groessen: [g('I_V', 'Lichtstärke', 'cd', 'Candela — 1 cd = 1 lm/sr'),
                g('Φ', 'Lichtstrom', 'lm'),
                g('Ω', 'Raumwinkel', 'sr', 'Steradiant')],
            loese: {
                I_V: v => v['Φ'] / v['Ω'],
                'Φ': v => v.I_V * v['Ω'],
                'Ω': v => v['Φ'] / v.I_V
            },
            erklaerung: 'Wie viel Licht in eine bestimmte RICHTUNG geht. Ein Spot hat ' +
                'dieselbe Leistung wie eine Kugellampe, aber viel mehr Lichtstärke.'
        },
        {
            id: 'leuchtdichte', kapitel: 'licht', schreibweise: 'L_V = I_V / A',
            groessen: [g('L_V', 'Leuchtdichte', 'cd/m²'),
                g('I_V', 'Lichtstärke', 'cd'),
                g('A', 'leuchtende Fläche', 'm²')],
            loese: {
                L_V: v => v.I_V / v.A,
                I_V: v => v.L_V * v.A,
                A: v => v.I_V / v.L_V
            },
            erklaerung: 'Was das Auge als Helligkeit empfindet — und woran Blendung hängt. ' +
                'Eine kleine helle Fläche blendet mehr als eine grosse mit demselben Licht.'
        },
        {
            id: 'abstandsgesetz-band', kapitel: 'licht', schreibweise: 'E₂ = E₁ · r₁ / r₂',
            groessen: [g('E₂', 'Beleuchtungsstärke neu', 'lx'),
                g('E₁', 'Beleuchtungsstärke alt', 'lx'),
                g('r₁', 'Abstand alt', 'm'), g('r₂', 'Abstand neu', 'm')],
            loese: {
                'E₂': v => v['E₁'] * v['r₁'] / v['r₂'],
                'E₁': v => v['E₂'] * v['r₂'] / v['r₁'],
                'r₁': v => v['E₂'] * v['r₂'] / v['E₁'],
                'r₂': v => v['E₁'] * v['r₁'] / v['E₂']
            },
            annahme: 'Gilt für eine BANDFÖRMIGE Lichtquelle, etwa eine lange Lichtleiste. ' +
                'Bei einer punktförmigen geht es mit dem QUADRAT — dafür gibt es die ' +
                'eigene Formel.',
            erklaerung: 'Eine Lichtleiste verliert langsamer mit dem Abstand als ein Punkt: ' +
                'doppelter Abstand heisst hier die HÄLFTE, nicht ein Viertel.'
        },
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
        },
        {
            id: 'leitwert', kapitel: 'leiter',
            schreibweise: 'G = 1 / R',
            groessen: [g('G', 'Leitwert', 'S', 'Wie gut etwas leitet — der Kehrwert des Widerstands'),
                g('R', 'Widerstand', 'Ω')],
            loese: { G: v => 1 / v.R, R: v => 1 / v.G },
            erklaerung: 'Derselbe Sachverhalt von der anderen Seite: 1 S ist 1/Ω. Bei Parallelschaltungen rechnet es sich damit ohne Doppelbruch.'
        },
        {
            id: 'stromdichte', kapitel: 'leiter',
            schreibweise: 'J = I / A',
            groessen: [g('J', 'Stromdichte', 'A/mm²'), g('I', 'Stromstärke', 'A'),
                g('A', 'Leiterquerschnitt', 'mm²')],
            loese: {
                J: v => v.I / v.A,
                I: v => v.J * v.A,
                A: v => v.I / v.J
            },
            erklaerung: 'Wie viel Strom sich durch einen Quadratmillimeter drängt. Sie entscheidet über die Erwärmung — nicht der Strom allein.'
        },
        {
            id: 'leiterquerschnitt-d', kapitel: 'leiter',
            schreibweise: 'A = d² · π / 4',
            groessen: [g('A', 'Leiterquerschnitt', 'mm²'), g('d', 'Leiterdurchmesser', 'mm')],
            loese: {
                A: v => v.d * v.d * PI / 4,
                d: v => WURZEL(4 * v.A / PI)
            },
            erklaerung: 'Am Draht misst man den Durchmesser, gerechnet wird mit der Fläche. Der Faktor ist π/4 und nicht π.'
        },
        {
            id: 'leitfaehigkeit', kapitel: 'leiter',
            schreibweise: 'γ = 1 / ρ',
            groessen: [g('γ', 'Leitfähigkeit', 'm/(Ω·mm²)'),
                g('ρ', 'spezifischer Widerstand', 'Ω·mm²/m')],
            loese: { 'γ': v => 1 / v['ρ'], 'ρ': v => 1 / v['γ'] },
            erklaerung: 'Kupfer hat 56, Aluminium 36. Manche Tabellen geben das eine, manche das andere — hier ist der Weg dazwischen.'
        },
        {
            id: 'gleich-einweg-u', kapitel: 'gleichrichter',
            schreibweise: 'U₂ ≈ 0,45 · U₁',
            groessen: [g('U₂', 'Gleichspannung (Mittelwert)', 'V'),
                g('U₁', 'Wechselspannung (Effektivwert)', 'V')],
            loese: { 'U₂': v => 0.45 * v['U₁'], 'U₁': v => v['U₂'] / 0.45 },
            annahme: 'Ohne Ladekondensator, sinusförmige Spannung.',
            erklaerung: 'Eine Diode lässt nur die halbe Welle durch. Aus 230 V werden rund 104 V — und die Hälfte der Zeit fliesst gar nichts.'
        },
        {
            id: 'gleich-einweg-i', kapitel: 'gleichrichter',
            schreibweise: 'I₂ ≈ 0,64 · I₁',
            groessen: [g('I₂', 'Gleichstrom (Mittelwert)', 'A'),
                g('I₁', 'Wechselstrom (Effektivwert)', 'A')],
            loese: { 'I₂': v => 0.64 * v['I₁'], 'I₁': v => v['I₂'] / 0.64 },
            annahme: 'Ohne Ladekondensator, sinusförmige Spannung.',
            erklaerung: 'Der Strommittelwert der Einweggleichrichtung.'
        },
        {
            id: 'gleich-einweg-u-c', kapitel: 'gleichrichter',
            schreibweise: 'U₂ ≈ 1,18 · U₁',
            groessen: [g('U₂', 'Gleichspannung mit Ladekondensator', 'V'),
                g('U₁', 'Wechselspannung (Effektivwert)', 'V')],
            loese: { 'U₂': v => 1.18 * v['U₁'], 'U₁': v => v['U₂'] / 1.18 },
            annahme: 'Mit Ladekondensator, Welligkeit 5 %.',
            erklaerung: 'Mit Kondensator lädt sich der Ausgang auf den Scheitelwert — aus 0,45 wird 1,18, also mehr als das Doppelte.'
        },
        {
            id: 'gleich-einweg-i-c', kapitel: 'gleichrichter',
            schreibweise: 'I₂ ≈ 0,48 · I₁',
            groessen: [g('I₂', 'Gleichstrom mit Ladekondensator', 'A'),
                g('I₁', 'Wechselstrom (Effektivwert)', 'A')],
            loese: { 'I₂': v => 0.48 * v['I₁'], 'I₁': v => v['I₂'] / 0.48 },
            annahme: 'Mit Ladekondensator, Welligkeit 5 %.',
            erklaerung: 'Der Kondensator wird in kurzen Stromspitzen nachgeladen; der Effektivwert im Wechselstromkreis steigt.'
        },
        {
            id: 'gleich-mittel-u', kapitel: 'gleichrichter',
            schreibweise: 'U₂ ≈ 0,9 · U₁',
            groessen: [g('U₂', 'Gleichspannung (Mittelwert)', 'V'),
                g('U₁', 'Wechselspannung (Effektivwert)', 'V')],
            loese: { 'U₂': v => 0.9 * v['U₁'], 'U₁': v => v['U₂'] / 0.9 },
            annahme: 'Ohne Ladekondensator, sinusförmige Spannung.',
            erklaerung: 'Zwei Dioden an einer Mittelanzapfung nutzen beide Halbwellen: doppelt so viel wie die Einwegschaltung.'
        },
        {
            id: 'gleich-mittel-i', kapitel: 'gleichrichter',
            schreibweise: 'I₂ ≈ 1,26 · I₁',
            groessen: [g('I₂', 'Gleichstrom (Mittelwert)', 'A'),
                g('I₁', 'Wechselstrom (Effektivwert)', 'A')],
            loese: { 'I₂': v => 1.26 * v['I₁'], 'I₁': v => v['I₂'] / 1.26 },
            annahme: 'Ohne Ladekondensator, sinusförmige Spannung.',
            erklaerung: 'Der Gleichstrom ist grösser als der Strangstrom — jede Wicklungshälfte führt nur die halbe Zeit.'
        },
        {
            id: 'gleich-mittel-u-c', kapitel: 'gleichrichter',
            schreibweise: 'U₂ ≈ 1,27 · U₁',
            groessen: [g('U₂', 'Gleichspannung mit Ladekondensator', 'V'),
                g('U₁', 'Wechselspannung (Effektivwert)', 'V')],
            loese: { 'U₂': v => 1.27 * v['U₁'], 'U₁': v => v['U₂'] / 1.27 },
            annahme: 'Mit Ladekondensator, Welligkeit 5 %.',
            erklaerung: 'Fast der Scheitelwert: √2 sind 1,414, und bei 5 % Welligkeit bleiben davon 1,27.'
        },
        {
            id: 'gleich-mittel-i-c', kapitel: 'gleichrichter',
            schreibweise: 'I₂ ≈ 0,9 · I₁',
            groessen: [g('I₂', 'Gleichstrom mit Ladekondensator', 'A'),
                g('I₁', 'Wechselstrom (Effektivwert)', 'A')],
            loese: { 'I₂': v => 0.9 * v['I₁'], 'I₁': v => v['I₂'] / 0.9 },
            annahme: 'Mit Ladekondensator, Welligkeit 5 %.',
            erklaerung: 'Der Strommittelwert der Mittelpunktschaltung mit Kondensator.'
        },
        {
            id: 'gleich-bruecke-u', kapitel: 'gleichrichter',
            schreibweise: 'U₂ ≈ 0,9 · U₁',
            groessen: [g('U₂', 'Gleichspannung (Mittelwert)', 'V'),
                g('U₁', 'Wechselspannung (Effektivwert)', 'V')],
            loese: { 'U₂': v => 0.9 * v['U₁'], 'U₁': v => v['U₂'] / 0.9 },
            annahme: 'Ohne Ladekondensator, sinusförmige Spannung.',
            erklaerung: 'Die Grätzschaltung nutzt beide Halbwellen ohne Mittelanzapfung — vier Dioden statt zwei, dafür der ganze Trafo.'
        },
        {
            id: 'gleich-bruecke-i', kapitel: 'gleichrichter',
            schreibweise: 'I₂ ≈ 1,0 · I₁',
            groessen: [g('I₂', 'Gleichstrom (Mittelwert)', 'A'),
                g('I₁', 'Wechselstrom (Effektivwert)', 'A')],
            loese: { 'I₂': v => v['I₁'], 'I₁': v => v['I₂'] },
            annahme: 'Ohne Ladekondensator, sinusförmige Spannung.',
            erklaerung: 'Hier sind beide gleich gross: die ganze Wicklung führt die ganze Zeit Strom.'
        },
        {
            id: 'gleich-bruecke-u-c', kapitel: 'gleichrichter',
            schreibweise: 'U₂ ≈ 1,27 · U₁',
            groessen: [g('U₂', 'Gleichspannung mit Ladekondensator', 'V'),
                g('U₁', 'Wechselspannung (Effektivwert)', 'V')],
            loese: { 'U₂': v => 1.27 * v['U₁'], 'U₁': v => v['U₂'] / 1.27 },
            annahme: 'Mit Ladekondensator, Welligkeit 5 %.',
            erklaerung: 'Das übliche Netzteil: 12 V Trafospannung geben rund 15 V Gleichspannung — wer mit 12 rechnet, liegt daneben.'
        },
        {
            id: 'gleich-bruecke-i-c', kapitel: 'gleichrichter',
            schreibweise: 'I₂ ≈ 0,64 · I₁',
            groessen: [g('I₂', 'Gleichstrom mit Ladekondensator', 'A'),
                g('I₁', 'Wechselstrom (Effektivwert)', 'A')],
            loese: { 'I₂': v => 0.64 * v['I₁'], 'I₁': v => v['I₂'] / 0.64 },
            annahme: 'Mit Ladekondensator, Welligkeit 5 %.',
            erklaerung: 'Der Trafo muss mehr Strom liefern, als hinten herauskommt — daran scheitern zu knapp gewählte Trafos.'
        },
        {
            id: 'gleich-dreh-u', kapitel: 'gleichrichter',
            schreibweise: 'U₂ ≈ 1,3 · U₁₂',
            groessen: [g('U₂', 'Gleichspannung', 'V'),
                g('U₁₂', 'Aussenleiterspannung (Effektivwert)', 'V')],
            loese: { 'U₂': v => 1.3 * v['U₁₂'], 'U₁₂': v => v['U₂'] / 1.3 },
            annahme: 'Gilt mit und ohne Ladekondensator — die Welligkeit ist ohnehin klein.',
            erklaerung: 'Sechs Dioden an drei Aussenleitern: die Spannung wird so glatt, dass ein Kondensator kaum noch etwas ändert.'
        },
        {
            id: 'gleich-dreh-i', kapitel: 'gleichrichter',
            schreibweise: 'I₂ ≈ 1,2 · I₁',
            groessen: [g('I₂', 'Gleichstrom', 'A'), g('I₁', 'Aussenleiterstrom (Effektivwert)', 'A')],
            loese: { 'I₂': v => 1.2 * v['I₁'], 'I₁': v => v['I₂'] / 1.2 },
            annahme: 'Gilt mit und ohne Ladekondensator.',
            erklaerung: 'Der Strommittelwert der Drehstrom-Brückenschaltung.'
        },
        {
            id: 'diode-vorwiderstand', kapitel: 'elektronik',
            schreibweise: 'R_V = (U₁ − U_F) / I_F',
            groessen: [g('R_V', 'Vorwiderstand', 'Ω'), g('U₁', 'Eingangsspannung', 'V'),
                g('U_F', 'Durchlassspannung', 'V'), g('I_F', 'Durchlassstrom', 'A')],
            loese: {
                R_V: v => (v['U₁'] - v.U_F) / v.I_F,
                'U₁': v => v.U_F + v.R_V * v.I_F,
                U_F: v => v['U₁'] - v.R_V * v.I_F,
                I_F: v => (v['U₁'] - v.U_F) / v.R_V
            },
            annahme: 'Silizium-Diode rund 0,7 V; Leuchtdiode je nach Farbe: rot ≈ 1,7 V, grün ≈ 2,1 V, blau ≈ 2,9 V.',
            erklaerung: 'Eine Diode hat keinen Widerstand, den man einstellt — sie hat eine feste Durchlassspannung. Was übrig bleibt, muss der Vorwiderstand aufnehmen, und der bestimmt den Strom.'
        },
        {
            id: 'diode-spannung-rv', kapitel: 'elektronik',
            schreibweise: 'U_V = U₁ − U_F',
            groessen: [g('U_V', 'Spannung am Vorwiderstand', 'V'),
                g('U₁', 'Eingangsspannung', 'V'), g('U_F', 'Durchlassspannung', 'V')],
            loese: {
                U_V: v => v['U₁'] - v.U_F,
                'U₁': v => v.U_V + v.U_F,
                U_F: v => v['U₁'] - v.U_V
            },
            erklaerung: 'Die Maschenregel an der einfachsten Schaltung, die es gibt.'
        },
        {
            id: 'diode-leistung-rv', kapitel: 'elektronik',
            schreibweise: 'P_V = U_V · I_F',
            groessen: [g('P_V', 'Leistung am Vorwiderstand', 'W'),
                g('U_V', 'Spannung am Vorwiderstand', 'V'), g('I_F', 'Durchlassstrom', 'A')],
            loese: {
                P_V: v => v.U_V * v.I_F,
                U_V: v => v.P_V / v.I_F,
                I_F: v => v.P_V / v.U_V
            },
            erklaerung: 'Wonach der Widerstand ausgesucht wird. Ein 1/4-W-Typ an 12 V und 20 mA reicht — an 230 V nicht mehr.'
        },
        {
            id: 'diode-leistung', kapitel: 'elektronik',
            schreibweise: 'P_D = U_F · I_F',
            groessen: [g('P_D', 'Leistung der Diode', 'W'), g('U_F', 'Durchlassspannung', 'V'),
                g('I_F', 'Durchlassstrom', 'A')],
            loese: {
                P_D: v => v.U_F * v.I_F,
                U_F: v => v.P_D / v.I_F,
                I_F: v => v.P_D / v.U_F
            },
            erklaerung: 'Was in der Diode selbst zu Wärme wird.'
        },
        {
            id: 'zener-vorwiderstand', kapitel: 'elektronik',
            schreibweise: 'R_V = (U₁ − U_Z) / I₁',
            groessen: [g('R_V', 'Vorwiderstand', 'Ω'), g('U₁', 'Eingangsspannung', 'V'),
                g('U_Z', 'Zenerspannung', 'V'), g('I₁', 'Gesamtstrom', 'A')],
            loese: {
                R_V: v => (v['U₁'] - v.U_Z) / v['I₁'],
                'U₁': v => v.U_Z + v.R_V * v['I₁'],
                U_Z: v => v['U₁'] - v.R_V * v['I₁'],
                'I₁': v => (v['U₁'] - v.U_Z) / v.R_V
            },
            erklaerung: 'Die Z-Diode hält die Spannung; der Vorwiderstand nimmt den Rest auf und begrenzt den Strom.'
        },
        {
            id: 'zener-laststrom', kapitel: 'elektronik',
            schreibweise: 'I_L = U_L / R_L',
            groessen: [g('I_L', 'Laststrom', 'A'), g('U_L', 'Lastspannung', 'V'),
                g('R_L', 'Lastwiderstand', 'Ω')],
            loese: {
                I_L: v => v.U_L / v.R_L,
                U_L: v => v.I_L * v.R_L,
                R_L: v => v.U_L / v.I_L
            },
            annahme: 'Die Lastspannung ist die Zenerspannung — dafür ist die Schaltung da.',
            erklaerung: 'Das ohmsche Gesetz an der Last. Steht hier eigens, weil U_L die Zenerspannung IST.'
        },
        {
            id: 'zener-strom', kapitel: 'elektronik',
            schreibweise: 'I_Z = I₁ − I_L',
            groessen: [g('I_Z', 'Zenerstrom', 'A'), g('I₁', 'Gesamtstrom', 'A'),
                g('I_L', 'Laststrom', 'A')],
            loese: {
                I_Z: v => v['I₁'] - v.I_L,
                'I₁': v => v.I_Z + v.I_L,
                I_L: v => v['I₁'] - v.I_Z
            },
            erklaerung: 'Was die Last nicht nimmt, nimmt die Z-Diode. Fällt die Last weg, geht ALLES durch die Diode — daran sterben sie.'
        },
        {
            id: 'transistor-basisvorwiderstand', kapitel: 'elektronik',
            schreibweise: 'R_V = (U₁ − 0,7 V) / I_B',
            groessen: [g('R_V', 'Basisvorwiderstand', 'Ω'), g('U₁', 'Eingangsspannung', 'V'),
                g('I_B', 'Basisstrom', 'A')],
            loese: {
                R_V: v => (v['U₁'] - 0.7) / v.I_B,
                'U₁': v => 0.7 + v.R_V * v.I_B,
                I_B: v => (v['U₁'] - 0.7) / v.R_V
            },
            annahme: 'U_BE ist bei Silizium rund 0,7 V und ändert sich kaum.',
            erklaerung: 'Die Basis-Emitter-Strecke ist eine Diode. Die 0,7 V fallen dort ab, egal wie hoch die Eingangsspannung ist.'
        },
        {
            id: 'transistor-basisstrom', kapitel: 'elektronik',
            schreibweise: 'I_B = I_C / B',
            groessen: [g('I_B', 'Basisstrom', 'A'), g('I_C', 'Kollektorstrom', 'A'),
                g('B', 'Stromverstärkung', '')],
            loese: {
                I_B: v => v.I_C / v.B,
                I_C: v => v.I_B * v.B,
                B: v => v.I_C / v.I_B
            },
            erklaerung: 'Ein kleiner Basisstrom steuert einen grossen Kollektorstrom. B liegt je nach Typ zwischen 100 und 500.'
        },
        {
            id: 'transistor-uebersteuerung', kapitel: 'elektronik',
            schreibweise: 'I_B = ü · I_C / B',
            groessen: [g('I_B', 'Basisstrom', 'A'), g('ü', 'Übersteuerungsfaktor', ''),
                g('I_C', 'Kollektorstrom', 'A'), g('B', 'Stromverstärkung', '')],
            loese: {
                I_B: v => v['ü'] * v.I_C / v.B,
                'ü': v => v.I_B * v.B / v.I_C,
                I_C: v => v.I_B * v.B / v['ü'],
                B: v => v['ü'] * v.I_C / v.I_B
            },
            annahme: 'ü liegt beim Schalten zwischen 2 und 5.',
            erklaerung: 'Als SCHALTER bekommt der Transistor mehr Basisstrom als nötig — sonst bleibt er im linearen Bereich hängen und wird heiss.'
        },
        {
            id: 'transistor-kollektorstrom', kapitel: 'elektronik',
            schreibweise: 'I_C = U_L / R_L',
            groessen: [g('I_C', 'Kollektorstrom', 'A'), g('U_L', 'Lastspannung', 'V'),
                g('R_L', 'Lastwiderstand', 'Ω')],
            loese: {
                I_C: v => v.U_L / v.R_L,
                U_L: v => v.I_C * v.R_L,
                R_L: v => v.U_L / v.I_C
            },
            erklaerung: 'Der Kollektorstrom ist der Laststrom — im durchgeschalteten Zustand liegt fast die ganze Betriebsspannung an der Last.'
        },
        {
            id: 'transistor-ce', kapitel: 'elektronik',
            schreibweise: 'U_CE = U_b − U_L',
            groessen: [g('U_CE', 'Kollektor-Emitter-Spannung', 'V'),
                g('U_b', 'Betriebsspannung', 'V'), g('U_L', 'Lastspannung', 'V')],
            loese: {
                U_CE: v => v.U_b - v.U_L,
                U_b: v => v.U_CE + v.U_L,
                U_L: v => v.U_b - v.U_CE
            },
            erklaerung: 'Was am Transistor übrig bleibt. Beim Schalten sind das fast 0 V — und darum bleibt er kühl.'
        },
        {
            id: 'spule-drahtlaenge', kapitel: 'spulen',
            schreibweise: 'l = d_m · π · N',
            groessen: [g('l', 'Drahtlänge', 'm'), g('d_m', 'mittlerer Durchmesser', 'm'),
                g('N', 'Windungszahl', '')],
            loese: {
                l: v => v.d_m * PI * v.N,
                d_m: v => v.l / (PI * v.N),
                N: v => v.l / (PI * v.d_m)
            },
            erklaerung: 'Jede Windung ist ein Kreis. Wie viel Draht auf eine Spule geht, ist die Summe dieser Kreise.'
        },
        {
            id: 'spule-windungen', kapitel: 'spulen',
            schreibweise: 'N = b / d',
            groessen: [g('N', 'Windungszahl', ''), g('b', 'Spulenbreite', 'mm'),
                g('d', 'Drahtdurchmesser', 'mm')],
            loese: {
                N: v => v.b / v.d,
                b: v => v.N * v.d,
                d: v => v.b / v.N
            },
            annahme: 'Einlagig und dicht gewickelt — jede Windung liegt neben der vorigen.',
            erklaerung: 'Wie viele Windungen nebeneinander passen: die Breite geteilt durch die Drahtdicke.'
        },
        {
            id: 'spule-mittel-einlagig', kapitel: 'spulen',
            schreibweise: 'd_m = d₁ + d',
            groessen: [g('d_m', 'mittlerer Durchmesser', 'mm'),
                g('d₁', 'Innendurchmesser', 'mm'), g('d', 'Drahtdurchmesser', 'mm')],
            loese: {
                d_m: v => v['d₁'] + v.d,
                'd₁': v => v.d_m - v.d,
                d: v => v.d_m - v['d₁']
            },
            erklaerung: 'Die Drahtmitte liegt einen halben Drahtdurchmesser über dem Kern — auf beiden Seiten, also einen ganzen im Durchmesser.'
        },
        {
            id: 'spule-mittel-mehrlagig', kapitel: 'spulen',
            schreibweise: 'd_m = (d₁ + d₂) / 2',
            groessen: [g('d_m', 'mittlerer Durchmesser', 'mm'),
                g('d₁', 'Innendurchmesser', 'mm'), g('d₂', 'Aussendurchmesser', 'mm')],
            loese: {
                d_m: v => (v['d₁'] + v['d₂']) / 2,
                'd₁': v => 2 * v.d_m - v['d₂'],
                'd₂': v => 2 * v.d_m - v['d₁']
            },
            erklaerung: 'Bei mehreren Lagen liegt die mittlere Windung in der Mitte zwischen innen und aussen.'
        },
        {
            id: 'spule-windungen-total', kapitel: 'spulen',
            schreibweise: 'N = N₁ · N₂',
            groessen: [g('N', 'Windungszahl gesamt', ''), g('N₁', 'Windungen je Lage', ''),
                g('N₂', 'Anzahl Lagen', '')],
            loese: {
                N: v => v['N₁'] * v['N₂'],
                'N₁': v => v.N / v['N₂'],
                'N₂': v => v.N / v['N₁']
            },
            erklaerung: 'Windungen je Lage mal Lagen.'
        },
        {
            id: 'spule-lagen', kapitel: 'spulen',
            schreibweise: 'N₂ = (d₂ − d₁) / (2 · d)',
            groessen: [g('N₂', 'Anzahl Lagen', ''), g('d₂', 'Aussendurchmesser', 'mm'),
                g('d₁', 'Innendurchmesser', 'mm'), g('d', 'Drahtdurchmesser', 'mm')],
            loese: {
                'N₂': v => (v['d₂'] - v['d₁']) / (2 * v.d),
                'd₂': v => v['d₁'] + 2 * v.d * v['N₂'],
                'd₁': v => v['d₂'] - 2 * v.d * v['N₂'],
                d: v => (v['d₂'] - v['d₁']) / (2 * v['N₂'])
            },
            erklaerung: 'Der Wickel wächst nach aussen — aber der Durchmesser wächst je Lage um ZWEI Drahtdicken, oben und unten.'
        },
    ];
    const LISTE = EINGEBAUT.slice();
    const alle = () => LISTE;
    const holen = (id) => LISTE.find(f => f.id === id) || null;
    const imKapitel = (k) => LISTE.filter(f => f.kapitel === k);
    const kapitel = () => KAPITEL.slice();
    const kapitelName = (id) => (KAPITEL.find(k => k[0] === id) || [id, id, ''])[1];
    const abschnitte = () => ABSCHNITTE.map(a => ({ ...a }));
    const abschnitt = (id) => {
        const a = ABSCHNITTE.find(x => x.id === id);
        return a ? { ...a } : undefined;
    };
    const buchkapitel = () => BUCHKAPITEL.slice();
    const buchkapitelName = (nr) => (BUCHKAPITEL.find(k => k[0] === nr) || [nr, ''])[1];
    const letzteSeite = () => LETZTE_SEITE;
    const aufSeite = (nr) => ABSCHNITTE.filter(a => a.seite === nr)
        .map(a => ({ abschnitt: { ...a }, zeilen: (a.zeilen || []).map(z => ({ ...z })) }));
    const seitenMitInhalt = () => [...new Set(ABSCHNITTE.map(a => a.seite))].sort((a, b) => a - b);
    const seitenVon = (formelId) => [...new Set(ABSCHNITTE
            .filter(a => (a.zeilen || []).some(z => z.id === formelId))
            .map(a => a.seite))].sort((x, y) => x - y);
    const seiteVon = (formelId) => {
        const f = LISTE.find(x => x.id === formelId);
        if (!f)
            return 0;
        const a = ABSCHNITTE.find(x => (x.zeilen || []).some(z => z.id === formelId));
        return a ? a.seite : 0;
    };
    const melde = (f) => {
        if (!f || !f.id || LISTE.some(x => x.id === f.id))
            return false;
        LISTE.push(f);
        return true;
    };
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
    const loesbarNach = (id) => {
        const f = holen(id);
        return f ? Object.keys(f.loese) : [];
    };
    const rechne = (id, gesucht, werte) => {
        const f = holen(id);
        if (!f)
            return { ok: false, fehler: 'Diese Formel gibt es nicht.' };
        const auf = f.loese[gesucht];
        if (!auf)
            return { ok: false, fehler: `Nach ${gesucht} lässt sich diese Formel nicht auflösen. Möglich: ` +
                    Object.keys(f.loese).join(', ') + '.' };
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
        loesbarNach, rechne, melde,
        BUCHKAPITEL, ABSCHNITTE, abschnitte, abschnitt, buchkapitel,
        buchkapitelName, letzteSeite, aufSeite, seitenMitInhalt, seiteVon, seitenVon };
})();
