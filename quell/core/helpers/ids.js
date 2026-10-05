"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/helpers/ids.ts (npm run bauen:ts). */
const Ids = (() => {
    function randomHex(n) {
        if (self.crypto && crypto.getRandomValues) {
            const a = new Uint8Array(Math.ceil(n / 2));
            crypto.getRandomValues(a);
            return [...a].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, n);
        }
        let s = '';
        while (s.length < n)
            s += Math.random().toString(16).slice(2);
        return s.slice(0, n);
    }
    const long = () => (self.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : randomHex(8) + '-' + randomHex(4) + '-4' + randomHex(3) + '-' +
            ('89ab'[Math.floor(Math.random() * 4)] ?? '8') +
            randomHex(3) + '-' + randomHex(12);
    const short = (n = 5) => {
        const roh = long().replace(/-/g, '').slice(0, n);
        return /^[0-9]/.test(roh)
            ? ('abcdef'[roh.charCodeAt(0) % 6] ?? 'a') + roh.slice(1)
            : roh;
    };
    const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const readable = (length = 8, group = 4) => {
        let s = '';
        for (let i = 0; i < length; i++) {
            s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)] ?? 'A';
            if (group && (i + 1) % group === 0 && i + 1 < length)
                s += '-';
        }
        return s;
    };
    const withoutDashes = (id) => String(id || '').replace(/-/g, '');
    const withDashes = (id) => {
        const s = withoutDashes(id);
        if (s.length !== 32)
            return String(id || '');
        return s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-' +
            s.slice(16, 20) + '-' + s.slice(20);
    };
    const equal = (a, b) => withoutDashes(a).toLowerCase() === withoutDashes(b).toLowerCase();
    const isValid = (id) => /^[0-9a-f]{32}$/i.test(withoutDashes(id));
    const fromUrl = (text) => {
        const t = String(text || '');
        const m = t.match(/[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i);
        return m ? withDashes(m[0]) : '';
    };
    return { long, short, readable, withoutDashes, withDashes, equal, isValid, fromUrl };
})();
window.Ids = Ids;
