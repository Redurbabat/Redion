"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/text/inline.ts (npm run bauen:ts). */
const Inline = (() => {
    const MUSTER = [
        [/^`([^`]+)`/, m => ({ text: m[1], code: true })],
        [/^\*\*([\s\S]+?)\*\*/, m => ({ text: m[1], fett: true })],
        [/^__([\s\S]+?)__/, m => ({ text: m[1], fett: true })],
        [/^~~([\s\S]+?)~~/, m => ({ text: m[1], durch: true })],
        [/^\*([^*\n]+)\*/, m => ({ text: m[1], kursiv: true })],
        [/^_([^_\n]+)_/, m => ({ text: m[1], kursiv: true })],
        [/^\[\[([^\]|]+)\|([^\]]+)\]\]/, m => ({ text: m[2], ziel: m[1] })],
        [/^\[\[([^\]|]+)\]\]/, m => ({ text: m[1], ziel: m[1] })],
        [/^\[([^\]]*)\]\(([^)]*)\)/, m => ({ text: m[1], ziel: m[2] })]
    ];
    const lesen = (roh) => {
        const text = String(roh ?? '');
        if (!text)
            return [];
        const raus = [];
        let rest = text;
        let klar = '';
        const klarWeg = () => { if (klar) {
            raus.push({ text: klar });
            klar = '';
        } };
        while (rest) {
            let getroffen = false;
            for (const [re, bau] of MUSTER) {
                const m = re.exec(rest);
                if (!m || !m[0])
                    continue;
                klarWeg();
                raus.push(bau(m));
                rest = rest.slice(m[0].length);
                getroffen = true;
                break;
            }
            if (!getroffen) {
                klar += rest[0];
                rest = rest.slice(1);
            }
        }
        klarWeg();
        return raus;
    };
    const schreiben = (laeufe) => (laeufe || []).map(l => {
        let t = String(l?.text ?? '');
        if (!t)
            return '';
        if (l.code)
            return '`' + t + '`';
        if (l.durch)
            t = '~~' + t + '~~';
        if (l.fett)
            t = '**' + t + '**';
        if (l.kursiv)
            t = '*' + t + '*';
        if (l.ziel) {
            t = l.ziel === t ? '[[' + t + ']]' : '[' + t + '](' + l.ziel + ')';
        }
        return t;
    }).join('');
    const nurText = (roh) => lesen(roh).map(l => l.text).join('');
    return { lesen, schreiben, nurText, MUSTER };
})();
window.Inline = Inline;
