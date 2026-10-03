"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/helpers/plural.ts (npm run bauen:ts). */
const Plural = (() => {
    const count = (n, one, many, zero) => {
        if (!Number.isFinite(n))
            return `– ${many}`;
        if (n === 0 && zero !== undefined)
            return zero;
        return `${n} ${Math.abs(n) === 1 ? one : many}`;
    };
    const word = (n, one, many) => Number.isFinite(n) && Math.abs(n) === 1 ? one : many;
    return { count, word };
})();
window.Plural = Plural;
