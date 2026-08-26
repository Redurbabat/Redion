"use strict";
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
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const planSvg = (breite, hoehe, bauen) => {
        if (typeof Schaltplan === 'undefined')
            return '';
        const plan = Schaltplan.neuerPlan('stromlauf-aufgeloest');
        plan.breite = breite;
        plan.hoehe = hoehe;
        plan.teile = [];
        plan.leitungen = [];
        plan.texte = [];
        let z = 0;
        const w = {
            teil: (zeichen, bmk, x, y, drehung = 0) => {
                const t = { id: 't' + (++z), zeichen, x, y, drehung, gespiegelt: false,
                    bmk, nummern: {}, gruppe: '', ebene: 'plan' };
                plan.teile.push(t);
                return t;
            },
            an: (teil, nr) => {
                const a = Schaltplan.anschluesseVon(teil)
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
                if (klemmen.length < 2)
                    return;
                const orte = klemmen.map(([t, nr]) => w.an(t, nr));
                const xs = orte.map(o => o.x);
                w.linie({ x: Math.min(...xs), y }, { x: Math.max(...xs), y });
                klemmen.forEach(([t, nr], i) => {
                    const o = orte[i];
                    /* Liegt der Anschluss SCHON auf der Sammelhöhe, gibt es keinen
                       Stummel — eine Leitung von einem Punkt zu demselben Punkt ist
                       keine, und der Prüflauf hält das zu Recht für einen Fehler. */
                    if (Math.abs(o.y - y) < 0.5)
                        return;
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
    const BLASS = 'var(--text-faint)';
    const svg = (breite, hoehe, inhalt) => `<svg class="sk-bild" viewBox="0 0 ${breite} ${hoehe}" ` +
        `preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">` +
        `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${inhalt}</g></svg>`;
    const lin = (x1, y1, x2, y2, farbe = STRICH, breit = 1.6) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${farbe}" stroke-width="${breit}"/>`;
    const strichel = (x1, y1, x2, y2) => `<path d="M${x1},${y1} L${x2},${y2}" stroke="${BLASS}" stroke-width="1" ` +
        `stroke-dasharray="4 3"/>`;
    const pfeil = (x1, y1, x2, y2, farbe = STRICH, breit = 1.6) => {
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
    const tief = (wert) => esc(wert).replace(/_([A-Za-zÄÖÜäöüß0-9]+)/g, '<tspan baseline-shift="sub" font-size="0.72em">$1</tspan>');
    const txt = (t, x, y, anker = 'middle', farbe = STRICH, groesse = 13) => `<text x="${x}" y="${y}" text-anchor="${anker}" fill="${farbe}" stroke="none" ` +
        `font-size="${groesse}" font-style="italic">${tief(t)}</text>`;
    /** Achsenkreuz mit Beschriftung an den Spitzen. */
    const achsen = (x0, y0, breite, hoehe, wLabel, hLabel) => pfeil(x0, y0, x0 + breite, y0, BLASS, 1.3) +
        pfeil(x0, y0, x0, y0 - hoehe, BLASS, 1.3) +
        txt(wLabel, x0 + breite, y0 + 17, 'end', BLASS, 12) +
        txt(hLabel, x0 - 7, y0 - hoehe + 5, 'end', BLASS, 12);
    /** Ein rechtwinkliges Dreieck mit drei Beschriftungen — S/P/Q und Z/R/X. */
    const dreieck = (unten, rechts, schraeg) => svg(300, 175, pfeil(50, 135, 230, 135, STRICH, 2) +
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
    const SKIZZEN = {
        /* --- Seite 4 · Grundlagen Elektrotechnik ---------------------------- */
        'g-ohm': () => planSvg(300, 190, w => {
            const g = w.teil('gleichspannung', 'G', 40, 60);
            const r = w.teil('widerstand', 'R', 210, 60);
            w.steg(g, '+', r, '1', 25);
            w.steg(g, '−', r, '2', 160);
            w.text('U', 145, 20);
            w.text('I', 145, 180);
        }),
        'g-leiter': () => svg(300, 165, `<path d="M60,50 L240,50 L240,110 L60,110 Z" stroke="${STRICH}" stroke-width="1.6"/>` +
            `<ellipse cx="60" cy="80" rx="12" ry="30" stroke="${STRICH}" stroke-width="1.6" ` +
            `fill="var(--bg-hover)"/>` +
            `<ellipse cx="240" cy="80" rx="12" ry="30" stroke="${STRICH}" stroke-width="1.6" fill="none"/>` +
            pfeil(150, 136, 240, 136, BETONT, 1.4) + pfeil(150, 136, 60, 136, BETONT, 1.4) +
            txt('l', 150, 156, 'middle', BETONT) +
            txt('A', 38, 84, 'end', BETONT) +
            txt('ρ', 150, 86, 'middle', BLASS)),
        'g-temperatur': () => svg(300, 165, achsen(45, 132, 215, 105, 'ϑ', 'R') +
            lin(45, 108, 250, 46, BETONT, 2) +
            strichel(45, 108, 250, 108) + strichel(250, 46, 250, 108) +
            txt('R₂₀', 39, 112, 'end', BLASS, 12) +
            txt('ΔR', 258, 80, 'start', BETONT, 12) +
            txt('Δϑ', 148, 126, 'middle', BLASS, 12)),
        /* --- Seite 5 · Schaltungen von Widerständen ------------------------- */
        's-reihe': () => planSvg(320, 310, w => {
            const g = w.teil('gleichspannung', 'G', 30, 115);
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
            const g = w.teil('gleichspannung', 'G', 20, 70);
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
            const g = w.teil('gleichspannung', 'G', 20, 90);
            const r1 = w.teil('widerstand', 'R1', 170, 30);
            const r2 = w.teil('widerstand', 'R2', 170, 150);
            w.steg(g, '+', r1, '1', 15);
            w.draht(r1, '2', r2, '1');
            w.steg(r2, '2', g, '−', 248);
            /* Der Abgriff: zwischen den beiden Widerständen heraus und unten
               heraus — dazwischen steht U₂. */
            w.linie({ x: 190, y: 120 }, { x: 265, y: 120 });
            w.linie({ x: 190, y: 248 }, { x: 265, y: 248 });
            w.text('U', 92, 11);
            w.text('U₂', 272, 188);
        }),
        's-bruecke': () => planSvg(370, 300, w => {
            const g = w.teil('gleichspannung', 'G', 20, 110);
            const rx = w.teil('widerstand', 'Rx', 140, 40);
            const r2 = w.teil('widerstand', 'R2', 140, 180);
            const r3 = w.teil('widerstand', 'R3', 290, 40);
            const r4 = w.teil('widerstand', 'R4', 290, 180);
            const v = w.teil('voltmeter', 'UB', 200, 110);
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
            const v = w.teil('voltmeter', 'V', 230, 30);
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
            const a = w.teil('amperemeter', 'A', 160, 30);
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
        'a-wirkungsgrad': () => svg(320, 155, `<rect x="112" y="48" width="96" height="58" rx="6" stroke="${STRICH}" ` +
            `stroke-width="1.6" fill="var(--bg-hover)"/>` +
            pfeil(22, 77, 108, 77, BETONT, 2.4) +
            pfeil(212, 77, 292, 77, BETONT, 1.8) +
            pfeil(160, 46, 160, 14, BLASS, 1.6) +
            txt('P₁', 62, 68, 'middle', BETONT) +
            txt('P₂', 254, 68, 'middle', BETONT) +
            txt('P_v', 170, 28, 'start', BLASS, 12) +
            txt('η', 160, 84, 'middle', STRICH, 16) +
            txt('P₁ = P₂ + P_v', 160, 140, 'middle', BLASS, 12)),
        'a-waerme': () => svg(280, 196, `<path d="M72,72 L188,72 L188,132 Q188,144 176,144 L84,144 Q72,144 72,132 Z" ` +
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
            const g = w.teil('gleichspannung', 'U0', 40, 110);
            const ri = w.teil('widerstand', 'Ri', 50, 30);
            const rl = w.teil('widerstand', 'RL', 300, 110);
            w.draht(g, '+', ri, '2');
            w.steg(ri, '1', rl, '1', 16);
            w.steg(g, '−', rl, '2', 230);
            w.text('U', 190, 160);
            w.text('I', 190, 12);
            w.text('U_Ri', 100, 62);
        }),
        'b-reihe': () => planSvg(250, 310, w => {
            const b1 = w.teil('batterie', 'G1', 50, 15);
            const b2 = w.teil('batterie', 'G2', 50, 105);
            const b3 = w.teil('batterie', 'G3', 50, 195);
            const r = w.teil('widerstand', 'RL', 190, 105);
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
            const r = w.teil('widerstand', 'RL', 320, 75);
            w.sammel(30, [b1, '+'], [b2, '+'], [b3, '+'], [r, '1']);
            w.sammel(200, [b1, '−'], [b2, '−'], [b3, '−'], [r, '2']);
            w.text('I₁', 66, 70);
            w.text('I', 270, 24);
        }),
        /* --- Seite 12 · Kondensator ----------------------------------------- */
        'c-parallel': () => planSvg(410, 215, w => {
            const g = w.teil('gleichspannung', 'G', 20, 70);
            const c1 = w.teil('kondensator', 'C1', 140, 70);
            const c2 = w.teil('kondensator', 'C2', 240, 70);
            const c3 = w.teil('kondensator', 'C3', 340, 70);
            w.sammel(28, [g, '+'], [c1, '1'], [c2, '1'], [c3, '1']);
            w.sammel(188, [g, '−'], [c1, '2'], [c2, '2'], [c3, '2']);
            w.text('U', 88, 24);
        }),
        'c-reihe': () => planSvg(300, 310, w => {
            const g = w.teil('gleichspannung', 'G', 20, 115);
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
            [0, 1, 2, 3].map(i => `<path d="M85,${52 + i * 20} A11,10 0 1,0 85,${72 + i * 20}" ` +
                `stroke="${BETONT}" stroke-width="2" fill="none"/>`).join('') +
            pfeil(150, 32, 200, 32, BETONT, 1.5) +
            txt('Φ', 208, 36, 'start', BETONT, 12) +
            txt('N · I', 40, 32, 'start', BETONT, 12) +
            txt('l_m', 156, 160, 'middle', BLASS, 12) +
            txt('A', 250, 92, 'start', BLASS, 12)),
        /* --- Seite 13 · Wechselstrom-Grundlagen ------------------------------ */
        'w-effektiv': () => {
            const links = 46, rechts = 275, mitte = 92, hoch = 58;
            let d = `M${links},${mitte}`;
            for (let i = 1; i <= 120; i++) {
                const x = links + (rechts - links) * i / 120;
                const y = mitte - hoch * Math.sin(2 * Math.PI * i / 60);
                d += ` L${x.toFixed(1)},${y.toFixed(1)}`;
            }
            return svg(300, 175, pfeil(links, mitte, rechts + 16, mitte, BLASS, 1.3) +
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
        'wx-resonanz': () => svg(300, 175, achsen(48, 134, 212, 108, 'f', 'X') +
            lin(52, 132, 240, 44, BETONT, 2) +
            `<path d="M58,44 Q76,112 112,124 T242,131" stroke="${STRICH}" stroke-width="2" ` +
            `fill="none"/>` +
            `<circle cx="124" cy="98" r="4.5" fill="var(--accent)" stroke="none"/>` +
            strichel(124, 98, 124, 134) +
            txt('X_L', 246, 48, 'start', BETONT, 12) +
            txt('X_C', 66, 40, 'start', STRICH, 12) +
            txt('f_r', 124, 152, 'middle', BLASS, 12)),
        /* --- Seite 16 · Drehstrom ------------------------------------------- */
        'd-stern': () => svg(300, 215, lin(150, 112, 150, 44, STRICH, 2) +
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
        'd-dreieck': () => svg(300, 215, lin(150, 46, 74, 168, STRICH, 2) +
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
            w.text('M', 238, 142);
        }),
        /* --- Seite 20 · Spannungsfall ---------------------------------------- */
        'sf-leitung': () => svg(330, 180, lin(28, 52, 252, 52, STRICH, 2) +
            lin(28, 124, 252, 124, STRICH, 2) +
            `<rect x="252" y="52" width="42" height="72" stroke="${STRICH}" stroke-width="1.8" ` +
            `fill="var(--bg-hover)"/>` +
            lin(28, 52, 28, 124, BETONT, 2.4) +
            pfeil(70, 42, 150, 42, BETONT, 1.4) +
            txt('I', 110, 36, 'middle', BETONT, 12) +
            strichel(70, 88, 220, 88) +
            txt('l', 145, 84, 'middle', BLASS, 12) +
            txt('ΔU', 150, 154, 'middle', STRICH, 12) +
            txt('U', 18, 92, 'end', BETONT, 12)),
        /* --- Seite 21 · Antenne ---------------------------------------------- */
        'an-mass': () => svg(330, 155, `<path d="M42,46 L42,106 L78,76 Z" stroke="${STRICH}" stroke-width="1.8" ` +
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
        'g-stromdichte': () => svg(300, 165, `<path d="M70,55 L230,55 L230,105 L70,105 Z" stroke="${STRICH}" stroke-width="1.6"/>` +
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
            const g = w.teil('wechselspannung', 'G', 20, 115);
            const d1 = w.teil('diode', 'V1', 140, 40, 90);
            const d2 = w.teil('diode', 'V2', 240, 40, 90);
            const d3 = w.teil('diode', 'V3', 140, 190, 90);
            const d4 = w.teil('diode', 'V4', 240, 190, 90);
            const c = w.teil('kondensator', 'C', 340, 115);
            w.sammel(20, [d1, 'K'], [d2, 'K'], [c, '1']);
            w.sammel(280, [d3, 'A'], [d4, 'A'], [c, '2']);
            w.draht(g, 'L', d1, 'A', { x: 50, y: 150 }, { x: 130, y: 150 });
            w.ab(d3, 'K', { x: 130, y: 150 });
            w.draht(g, 'N', d2, 'A', { x: 50, y: 262 }, { x: 300, y: 262 }, { x: 300, y: 150 }, { x: 230, y: 150 });
            w.ab(d4, 'K', { x: 230, y: 150 });
            w.text('U₁', 60, 90);
            w.text('U₂', 384, 160);
        }),
        /* --- Seite 24 · Elektronische Schaltungen ---------------------------- */
        'el-diode': () => planSvg(360, 240, w => {
            const g = w.teil('gleichspannung', 'U1', 20, 90);
            const rv = w.teil('widerstand', 'Rv', 150, 20, 90);
            const d = w.teil('led', 'V1', 280, 85);
            w.draht(g, '+', rv, '2', { x: 50, y: 50 });
            w.draht(rv, '1', d, 'A', { x: 300, y: 50 });
            w.steg(g, '−', d, 'K', 215);
            w.text('U_V', 158, 40);
            w.text('U_F', 244, 130);
            w.text('I_F', 100, 208);
        }),
        'el-zener': () => planSvg(410, 250, w => {
            const g = w.teil('gleichspannung', 'U1', 20, 95);
            const rv = w.teil('widerstand', 'Rv', 140, 20, 90);
            const z = w.teil('zenerdiode', 'V1', 250, 95);
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
            const g = w.teil('gleichspannung', 'Ub', 20, 105);
            const rl = w.teil('widerstand', 'RL', 260, 30);
            const t = w.teil('transistor-npn', 'V1', 250, 140);
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
            const draht = (x, y) => `<circle cx="${x}" cy="${y}" r="6" stroke="${BETONT}" stroke-width="1.4" ` +
                `fill="var(--bg-hover)"/>`;
            const reihe = (y) => Array.from({ length: 14 }, (_, i) => draht(70 + i * 12.5, y)).join('');
            return svg(320, 190, `<rect x="58" y="66" width="204" height="46" stroke="${STRICH}" ` +
                `stroke-width="1.6" fill="none"/>` +
                reihe(58) + reihe(120) +
                strichel(50, 89, 280, 89) +
                pfeil(292, 52, 292, 126, BLASS, 1.2) + pfeil(292, 126, 292, 52, BLASS, 1.2) +
                txt('d₂', 302, 92, 'start', BLASS, 12) +
                txt('d₁', 150, 100, 'middle', BLASS, 12) +
                txt('d_m', 150, 82, 'middle', BETONT, 12) +
                pfeil(70, 158, 245, 158, BLASS, 1.2) + pfeil(245, 158, 70, 158, BLASS, 1.2) +
                txt('b', 158, 178, 'middle', BLASS, 12) +
                txt('d', 62, 40, 'middle', BETONT, 12));
        },
        'sp-mehrlagig': () => {
            const draht = (x, y) => `<circle cx="${x}" cy="${y}" r="5.5" stroke="${BETONT}" stroke-width="1.3" ` +
                `fill="var(--bg-hover)"/>`;
            const block = (y0) => [0, 1, 2].map(l => Array.from({ length: 13 }, (_, i) => draht(72 + i * 12, y0 + l * 11)).join('')).join('');
            return svg(320, 200, `<rect x="60" y="82" width="200" height="36" stroke="${STRICH}" ` +
                `stroke-width="1.6" fill="none"/>` +
                block(48) + block(126) +
                strichel(48, 100, 286, 100) +
                pfeil(296, 44, 296, 156, BLASS, 1.2) + pfeil(296, 156, 296, 44, BLASS, 1.2) +
                txt('d₂', 306, 104, 'start', BLASS, 12) +
                txt('d₁', 150, 112, 'middle', BLASS, 12) +
                txt('d_m', 150, 94, 'middle', BETONT, 12) +
                pfeil(72, 180, 216, 180, BLASS, 1.2) + pfeil(216, 180, 72, 180, BLASS, 1.2) +
                txt('b', 144, 197, 'middle', BLASS, 12) +
                txt('N₂ Lagen', 40, 36, 'start', BETONT, 12));
        },
        /* --- Seite 22 · Beleuchtung ------------------------------------------ */
        'l-abstand': () => svg(300, 195, `<path d="M120,26 L180,26 L194,48 L106,48 Z" stroke="${STRICH}" stroke-width="1.8" ` +
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
    const hat = (abschnitt) => Object.prototype.hasOwnProperty.call(SKIZZEN, abschnitt);
    /**
     * Die Skizze zu einem Abschnitt. Leere Zeichenkette heisst „gibt es nicht" —
     * und das ist eine Antwort, kein Fehler: das Buch wird Abschnitt für
     * Abschnitt bebildert, und ein Abschnitt ohne Bild soll trotzdem lesbar
     * sein.
     */
    const zu = (abschnitt) => {
        const bauen = SKIZZEN[abschnitt];
        if (!bauen)
            return '';
        try {
            return bauen();
        }
        catch (e) {
            /* Eine kaputte Skizze darf die Seite nicht mitreissen. Sie fehlt dann
               eben — sichtbar, aber ohne Schaden. */
            console.warn('Skizze ' + abschnitt + ' liess sich nicht zeichnen:', e);
            return '';
        }
    };
    /** Welche Abschnitte bebildert sind — für den Prüflauf und die Doku. */
    const alle = () => Object.keys(SKIZZEN).sort();
    return { hat, zu, alle };
})();
/* Im Browser sichtbar machen — das Formelheft und der Prüflauf greifen darauf zu. */
globalThis.Elektroskizzen = Elektroskizzen;
