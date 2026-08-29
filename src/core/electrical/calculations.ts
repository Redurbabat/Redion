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

type ElectricalResult = {
  ok: boolean; value?: number; unit?: string; formula?: string;
  assumptions?: string[]; warnings?: string[]; error?: string;
  /* Der Lösungsweg, wenn die Rechnung einen hat (E209). Die neun Rechnungen
     hier drunter haben keinen — sie sind je eine Formel, und ein Weg mit
     einem Schritt ist keiner. Das Feld steht trotzdem hier und nicht als
     Anbau in `bereiche/wissen/electrical.ts`: wer ein Ergebnis annimmt,
     soll am Typ sehen, dass ein Weg dabei sein kann. */
  weg?: RwWeg;
};

const ElectricalCalculations = (() => {
  const number = (value: unknown, label: string, zero = true): ElectricalResult | number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return { ok: false, error: label + ' muss eine endliche Zahl sein.' };
    if (zero ? parsed < 0 : parsed <= 0)
      return { ok: false, error: label + (zero ? ' darf nicht negativ sein.' : ' muss grösser als null sein.') };
    return parsed;
  };
  const error = (...values: Array<ElectricalResult | number>): ElectricalResult | null =>
    values.find(value => typeof value !== 'number') as ElectricalResult || null;
  const result = (value: number, unit: string, formula: string,
                  assumptions: string[] = []): ElectricalResult =>
    Number.isFinite(value)
      ? { ok: true, value, unit, formula, assumptions, warnings: [] }
      : { ok: false, error: 'Das Ergebnis ist nicht endlich.' };

  const voltage = (currentA: unknown, resistanceOhm: unknown): ElectricalResult => {
    const i = number(currentA, 'Strom'), r = number(resistanceOhm, 'Widerstand');
    return error(i, r) || result((i as number) * (r as number), 'V', 'U = I · R');
  };
  const current = (voltageV: unknown, resistanceOhm: unknown): ElectricalResult => {
    const u = number(voltageV, 'Spannung'), r = number(resistanceOhm, 'Widerstand', false);
    return error(u, r) || result((u as number) / (r as number), 'A', 'I = U / R');
  };
  const resistance = (voltageV: unknown, currentA: unknown): ElectricalResult => {
    const u = number(voltageV, 'Spannung'), i = number(currentA, 'Strom', false);
    return error(u, i) || result((u as number) / (i as number), 'Ω', 'R = U / I');
  };
  const power = (voltageV: unknown, currentA: unknown): ElectricalResult => {
    const u = number(voltageV, 'Spannung'), i = number(currentA, 'Strom');
    return error(u, i) || result((u as number) * (i as number), 'W', 'P = U · I',
      ['Gleichstrom oder rein ohmsche Wirkleistung; kein cos φ und keine Blindleistung.']);
  };
  const powerFromCurrent = (currentA: unknown, resistanceOhm: unknown): ElectricalResult => {
    const i = number(currentA, 'Strom'), r = number(resistanceOhm, 'Widerstand');
    return error(i, r) || result((i as number) ** 2 * (r as number), 'W', 'P = I² · R',
      ['Rein ohmsche Last.']);
  };
  const energy = (powerW: unknown, hours: unknown): ElectricalResult => {
    const p = number(powerW, 'Leistung'), h = number(hours, 'Zeit');
    return error(p, h) || result((p as number) * (h as number) / 1000, 'kWh', 'E = P · t / 1000');
  };
  const cost = (energyKWh: unknown, pricePerKWh: unknown): ElectricalResult => {
    const e = number(energyKWh, 'Energie'), p = number(pricePerKWh, 'Preis');
    return error(e, p) || result((e as number) * (p as number), 'Geldeinheiten', 'Kosten = E · Preis',
      ['Währung und Tarif werden vom Benutzer festgelegt; Grundgebühren sind nicht enthalten.']);
  };
  const list = (raw: unknown): ElectricalResult | number[] => {
    const values = Array.isArray(raw) ? raw : String(raw ?? '').split(/[;,\s]+/).filter(Boolean);
    const parsed = values.map(Number);
    if (!parsed.length || parsed.some(value => !Number.isFinite(value) || value <= 0))
      return { ok: false, error: 'Widerstände als positive Zahlen, getrennt mit Komma, eingeben.' };
    if (parsed.length > 200) return { ok: false, error: 'Höchstens 200 Werte auf einmal.' };
    return parsed;
  };
  const series = (raw: unknown): ElectricalResult => {
    const values = list(raw); if (!Array.isArray(values)) return values;
    return result(values.reduce((sum, value) => sum + value, 0), 'Ω', 'Rges = R₁ + … + Rₙ');
  };
  const parallel = (raw: unknown): ElectricalResult => {
    const values = list(raw); if (!Array.isArray(values)) return values;
    return result(1 / values.reduce((sum, value) => sum + 1 / value, 0), 'Ω',
      '1 / Rges = 1 / R₁ + … + 1 / Rₙ');
  };

  return { voltage, current, resistance, power, powerFromCurrent, energy, cost, series, parallel };
})();

(window as any).ElectricalCalculations = ElectricalCalculations;
