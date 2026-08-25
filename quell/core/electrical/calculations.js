"use strict";
/* ============================================================================
 * core/electrical/calculations.ts — reine, normfreie Elektrotechnik-Rechnung
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/electrical/calculations.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/core/electrical/calculations.js`.
 * ----------------------------------------------------------------------------
 * Dieser Kern kennt weder DOM noch Redion-Daten. Er rechnet Definitionen und
 * algebraische Umstellungen. Schutzorgane, Leiterquerschnitte, Spannungsfall-
 * Grenzen und regionale Normregeln gehoeren ausdruecklich nicht hierher (E128).
 * ==========================================================================*/
const ElectricalCalculations = (() => {
    const number = (value, label, zero = true) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed))
            return { ok: false, error: label + ' muss eine endliche Zahl sein.' };
        if (zero ? parsed < 0 : parsed <= 0)
            return { ok: false, error: label + (zero ? ' darf nicht negativ sein.' : ' muss grösser als null sein.') };
        return parsed;
    };
    const error = (...values) => values.find(value => typeof value !== 'number') || null;
    const result = (value, unit, formula, assumptions = []) => Number.isFinite(value)
        ? { ok: true, value, unit, formula, assumptions, warnings: [] }
        : { ok: false, error: 'Das Ergebnis ist nicht endlich.' };
    const voltage = (currentA, resistanceOhm) => {
        const i = number(currentA, 'Strom'), r = number(resistanceOhm, 'Widerstand');
        return error(i, r) || result(i * r, 'V', 'U = I · R');
    };
    const current = (voltageV, resistanceOhm) => {
        const u = number(voltageV, 'Spannung'), r = number(resistanceOhm, 'Widerstand', false);
        return error(u, r) || result(u / r, 'A', 'I = U / R');
    };
    const resistance = (voltageV, currentA) => {
        const u = number(voltageV, 'Spannung'), i = number(currentA, 'Strom', false);
        return error(u, i) || result(u / i, 'Ω', 'R = U / I');
    };
    const power = (voltageV, currentA) => {
        const u = number(voltageV, 'Spannung'), i = number(currentA, 'Strom');
        return error(u, i) || result(u * i, 'W', 'P = U · I', ['Gleichstrom oder rein ohmsche Wirkleistung; kein cos φ und keine Blindleistung.']);
    };
    const powerFromCurrent = (currentA, resistanceOhm) => {
        const i = number(currentA, 'Strom'), r = number(resistanceOhm, 'Widerstand');
        return error(i, r) || result(i ** 2 * r, 'W', 'P = I² · R', ['Rein ohmsche Last.']);
    };
    const energy = (powerW, hours) => {
        const p = number(powerW, 'Leistung'), h = number(hours, 'Zeit');
        return error(p, h) || result(p * h / 1000, 'kWh', 'E = P · t / 1000');
    };
    const cost = (energyKWh, pricePerKWh) => {
        const e = number(energyKWh, 'Energie'), p = number(pricePerKWh, 'Preis');
        return error(e, p) || result(e * p, 'Geldeinheiten', 'Kosten = E · Preis', ['Währung und Tarif werden vom Benutzer festgelegt; Grundgebühren sind nicht enthalten.']);
    };
    const list = (raw) => {
        const values = Array.isArray(raw) ? raw : String(raw ?? '').split(/[;,\s]+/).filter(Boolean);
        const parsed = values.map(Number);
        if (!parsed.length || parsed.some(value => !Number.isFinite(value) || value <= 0))
            return { ok: false, error: 'Widerstände als positive Zahlen, getrennt mit Komma, eingeben.' };
        if (parsed.length > 200)
            return { ok: false, error: 'Höchstens 200 Werte auf einmal.' };
        return parsed;
    };
    const series = (raw) => {
        const values = list(raw);
        if (!Array.isArray(values))
            return values;
        return result(values.reduce((sum, value) => sum + value, 0), 'Ω', 'Rges = R₁ + … + Rₙ');
    };
    const parallel = (raw) => {
        const values = list(raw);
        if (!Array.isArray(values))
            return values;
        return result(1 / values.reduce((sum, value) => sum + 1 / value, 0), 'Ω', '1 / Rges = 1 / R₁ + … + 1 / Rₙ');
    };
    return { voltage, current, resistance, power, powerFromCurrent, energy, cost, series, parallel };
})();
window.ElectricalCalculations = ElectricalCalculations;
