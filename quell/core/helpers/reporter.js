"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/helpers/reporter.ts (npm run bauen:ts). */
const Reporter = (() => {
    const LEVELS = ['spur', 'info', 'warnung', 'fehler'];
    const MAX = 500;
    const history = [];
    let level = 'info';
    let consoleLevel = 'warnung';
    const rank = (s) => LEVELS.indexOf(s);
    const stamp = () => new Date().toISOString();
    const write = (s, where, text, data) => {
        if (rank(s) < rank(level))
            return undefined;
        const entry = { stufe: s, wo: String(where || ''), text: String(text || ''),
            daten: data, wann: stamp() };
        history.push(entry);
        if (history.length > MAX)
            history.shift();
        if (rank(s) >= rank(consoleLevel)) {
            const line = '[' + where + '] ' + text;
            if (s === 'fehler')
                console.error(line, data !== undefined ? data : '');
            else if (s === 'warnung')
                console.warn(line, data !== undefined ? data : '');
            else
                console.log(line, data !== undefined ? data : '');
        }
        if (s === 'fehler' && typeof Pflege !== 'undefined' && Pflege.fehlerMerken) {
            try {
                Pflege.fehlerMerken(new Error(String(text || '')), String(where || ''));
            }
            catch { }
        }
        return entry;
    };
    const trace = (where, text, data) => write('spur', where, text, data);
    const info = (where, text, data) => write('info', where, text, data);
    const warn = (where, text, data) => write('warnung', where, text, data);
    const error = (where, text, data) => write('fehler', where, text, data);
    const guarded = (where, fn, fallback = undefined) => (...a) => {
        try {
            return fn(...a);
        }
        catch (e) {
            const m = (e && typeof e === 'object' && 'message' in e) ? String(e.message) : String(e);
            error(where, m, e);
            return fallback;
        }
    };
    const measure = (where, fn) => {
        const t0 = performance.now();
        try {
            return fn();
        }
        finally {
            trace(where, 'dauerte ' + Math.round(performance.now() - t0) + ' ms');
        }
    };
    const all = (fromLevel) => fromLevel
        ? history.filter(e => rank(e.stufe) >= rank(fromLevel))
        : history.slice();
    const counts = () => {
        const z = { spur: 0, info: 0, warnung: 0, fehler: 0 };
        history.forEach(e => { z[e.stufe] = (z[e.stufe] ?? 0) + 1; });
        return z;
    };
    const toText = () => history
        .map(e => e.wann + '  ' + e.stufe.padEnd(8) + '[' + e.wo + '] ' + e.text)
        .join('\n');
    const clear = () => { history.length = 0; };
    const setLevel = (s) => { if (LEVELS.includes(s))
        level = s; return level; };
    const setConsoleLevel = (s) => {
        if (LEVELS.includes(s) || s === 'aus')
            consoleLevel = s;
        return consoleLevel;
    };
    return { LEVELS, trace, info, warn, error, guarded, measure,
        all, counts, toText, clear, setLevel, setConsoleLevel,
        level: () => level, consoleLevel: () => consoleLevel };
})();
window.Reporter = Reporter;
