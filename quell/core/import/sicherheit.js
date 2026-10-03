"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/import/sicherheit.ts (npm run bauen:ts). */
const ImportSicherheit = (() => {
    const GEFAEHRLICH = ['__proto__', 'constructor', 'prototype'];
    const istGefaehrlich = (schluessel) => GEFAEHRLICH.indexOf(schluessel) !== -1;
    const leererFund = () => ({ entfernt: 0, wege: [], zuTief: false });
    const MAX_TIEFE = 100;
    const MAX_WEGE = 20;
    const entgiften = (roh, fund) => {
        let ergebnis = undefined;
        const stapel = [
            { quelle: roh, setzen: (w) => { ergebnis = w; }, tiefe: 0, weg: '' }
        ];
        while (stapel.length) {
            const a = stapel.pop();
            const q = a.quelle;
            if (q === null || typeof q !== 'object') {
                a.setzen(q);
                continue;
            }
            if (a.tiefe >= MAX_TIEFE) {
                fund.zuTief = true;
                a.setzen(null);
                continue;
            }
            if (Array.isArray(q)) {
                const neu = new Array(q.length);
                a.setzen(neu);
                for (let i = 0; i < q.length; i++) {
                    stapel.push({
                        quelle: q[i],
                        setzen: (w) => { neu[i] = w; },
                        tiefe: a.tiefe + 1,
                        weg: a.weg + '[' + i + ']'
                    });
                }
                continue;
            }
            const neu = Object.create(null);
            a.setzen(neu);
            for (const k of Object.keys(q)) {
                if (istGefaehrlich(k)) {
                    fund.entfernt++;
                    if (fund.wege.length < MAX_WEGE) {
                        fund.wege.push((a.weg ? a.weg + '.' : '') + k);
                    }
                    continue;
                }
                stapel.push({
                    quelle: q[k],
                    setzen: (w) => { neu[k] = w; },
                    tiefe: a.tiefe + 1,
                    weg: a.weg ? a.weg + '.' + k : k
                });
            }
        }
        return ergebnis;
    };
    const verzeichnis = (roh, fund) => {
        const f = fund || leererFund();
        const sauber = entgiften(roh, f);
        if (sauber === null || typeof sauber !== 'object' || Array.isArray(sauber)) {
            return Object.create(null);
        }
        return sauber;
    };
    const lesen = (text) => {
        let roh;
        try {
            roh = JSON.parse(text);
        }
        catch {
            throw new Error('Die Datei ist keine gültige Sicherung — sie lässt sich ' +
                'nicht als JSON lesen. Vielleicht ist es eine .redion-Datei? ' +
                'Die gehört in „Sicherung einspielen" und nicht hierher.');
        }
        const fund = leererFund();
        const wert = entgiften(roh, fund);
        return { wert, fund };
    };
    const satz = (fund) => {
        if (!fund.entfernt && !fund.zuTief)
            return '';
        const teile = [];
        if (fund.entfernt) {
            teile.push(fund.entfernt === 1
                ? 'Ein gefährlicher Schlüssel wurde aus der Sicherung entfernt'
                : fund.entfernt + ' gefährliche Schlüssel wurden aus der Sicherung entfernt');
            if (fund.wege.length) {
                teile.push('(' + fund.wege.slice(0, 5).join(', ') +
                    (fund.entfernt > 5 ? ' …' : '') + ')');
            }
        }
        if (fund.zuTief) {
            teile.push('Ein Teil der Datei war tiefer verschachtelt als ' + MAX_TIEFE +
                ' Ebenen und wurde ausgelassen.');
        }
        return teile.join(' ') + '.';
    };
    return {
        lesen, entgiften, verzeichnis, leererFund, satz,
        istGefaehrlich, GEFAEHRLICH, MAX_TIEFE
    };
})();
window.ImportSicherheit = ImportSicherheit;
