"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/einstellung/schalter.ts (npm run bauen:ts). */
const Schalter = (() => {
    const VORGABE = {
        abgleich: {
            an: true,
            was: 'Abgleich über einen eigenen Server',
            grund: 'Fertig, geprüft mit zwei Geräten. Ohne Server tut er nichts.'
        },
        spaltenrechte: {
            an: true,
            was: 'Rechte bis auf die einzelne Spalte',
            grund: 'Fertig. Greift nur bei geteilten Seiten — verschlüsselte kann ' +
                'der Server nicht filtern.'
        },
        vorrat: {
            an: true,
            was: 'Vorberechnete Formelwerte',
            grund: 'Fertig. Von selbst nirgends an; lohnt sich erst ab vielen Zeilen.'
        },
        pruefsaetze: {
            an: true,
            was: 'Prüfsätze für Formeln und Automationen',
            grund: 'Fertig.'
        },
        probelauf: {
            an: true,
            was: 'Probelauf vor grossen Änderungen',
            grund: 'Fertig.'
        },
        ereignisbus: {
            an: false,
            was: 'Module reden nur noch über den Ereignisbus',
            grund: 'Der Bus steht, aber die Module rufen sich noch direkt. ' +
                'Solange beides läuft, wäre doppelte Arbeit die Folge.',
            ziel: 'An, sobald die Bereiche umgestellt sind'
        },
        sprachen: {
            an: false,
            was: 'Oberfläche auf Englisch umschaltbar',
            grund: 'Die Texte sind noch nicht vollständig ausgelagert. Halb ' +
                'übersetzt ist schlechter als gar nicht.',
            ziel: 'An, wenn die Oberflächentexte durch sind'
        }
    };
    const SCHLUESSEL = 'schalter';
    const eigene = () => (typeof Store !== 'undefined')
        ? (Store.getMeta(SCHLUESSEL, {}) || {}) : {};
    const an = (name) => {
        const e = eigene();
        if (name in e)
            return !!e[name];
        return !!VORGABE[name]?.an;
    };
    const setze = (name, wert) => {
        if (!VORGABE[name])
            return false;
        const e = eigene();
        e[name] = !!wert;
        if (typeof Store !== 'undefined')
            Store.setMeta(SCHLUESSEL, e);
        if (typeof Reporter !== 'undefined')
            Reporter.info('Schalter', name + ' ist jetzt ' + (wert ? 'an' : 'aus'));
        return true;
    };
    const zuruecksetzen = (name) => {
        const e = eigene();
        if (name)
            delete e[name];
        else
            Object.keys(e).forEach(k => delete e[k]);
        if (typeof Store !== 'undefined')
            Store.setMeta(SCHLUESSEL, e);
    };
    const alle = () => Object.entries(VORGABE).map(([name, s]) => ({
        name, ...s, jetzt: an(name), eigen: name in eigene()
    }));
    const wenn = (name, fn, sonst) => an(name) ? fn() : (sonst ? sonst() : undefined);
    return { VORGABE, an, setze, zuruecksetzen, alle, wenn };
})();
window.Schalter = Schalter;
