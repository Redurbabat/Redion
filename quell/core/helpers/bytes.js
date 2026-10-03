"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/helpers/bytes.ts (npm run bauen:ts). */
const Bytes = (() => {
    const CHUNK = 32768;
    const toBase64 = (buf) => {
        const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
        let s = '';
        for (let i = 0; i < bytes.length; i += CHUNK)
            s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
        return btoa(s);
    };
    const fromBase64 = (text) => Uint8Array.from(atob(String(text)), c => c.charCodeAt(0));
    return { toBase64, fromBase64, CHUNK };
})();
window.Bytes = Bytes;
