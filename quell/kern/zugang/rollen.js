"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/zugang/rollen.ts (npm run bauen:ts). */
const Rollen = (() => {
    const ROLLEN = {
        voll: { rang: 5, name: 'Vollzugriff',
            darf: ['lesen', 'kommentieren', 'bearbeiten', 'teilen', 'loeschen', 'rechte'],
            satz: 'Darf alles, auch Rechte vergeben und löschen.' },
        edit: { rang: 4, name: 'Bearbeiten',
            darf: ['lesen', 'kommentieren', 'bearbeiten'],
            satz: 'Darf Inhalte ändern, aber keine Rechte vergeben.' },
        komm: { rang: 3, name: 'Kommentieren',
            darf: ['lesen', 'kommentieren'],
            satz: 'Darf mitlesen und kommentieren, aber nichts ändern.' },
        lesen: { rang: 2, name: 'Lesen',
            darf: ['lesen'],
            satz: 'Darf nur mitlesen.' },
        kein: { rang: 1, name: 'Kein Zugriff',
            darf: [],
            satz: 'Sieht diese Seite nicht — auch wenn er den Bereich darüber sieht.' }
    };
    const REIHE = ['voll', 'edit', 'komm', 'lesen', 'kein'];
    const TATEN = {
        lesen: 'ansehen',
        kommentieren: 'kommentieren',
        bearbeiten: 'ändern',
        teilen: 'weitergeben',
        loeschen: 'löschen',
        rechte: 'Rechte vergeben'
    };
    const zu = (rolle) => {
        const b = typeof rolle === 'string' ? ROLLEN[rolle] : undefined;
        return b ?? ROLLEN.kein;
    };
    const darf = (rolle, was) => zu(rolle).darf.some(t => t === was);
    const schwaechere = (a, b) => zu(a).rang <= zu(b).rang ? a : b;
    const staerkere = (a, b) => zu(a).rang >= zu(b).rang ? a : b;
    const name = (rolle) => zu(rolle).name;
    const satz = (rolle) => zu(rolle).satz;
    const warumNicht = (rolle, was) => {
        if (darf(rolle, was))
            return '';
        const noetig = REIHE.slice().reverse().find(r => darf(r, was));
        if (!noetig)
            return 'Das lässt sich hier gar nicht tun — keine Rolle erlaubt es.';
        return 'Dafür braucht es mindestens „' + name(noetig) + '". Du hast „' +
            name(rolle) + '".';
    };
    const zeigen = (was, rolle) => {
        if (rolle === undefined || rolle === null || rolle === '')
            return true;
        return darf(rolle, was);
    };
    return { ROLLEN, REIHE, TATEN, darf, schwaechere, staerkere,
        name, satz, warumNicht, zeigen };
})();
window.Rollen = Rollen;
