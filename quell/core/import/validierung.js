"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/import/validierung.ts (npm run bauen:ts). */
const ImportValidierung = (() => {
    const FAECHER = ['blocks', 'collections', 'views', 'meta', 'versions'];
    const zahl = (w) => (typeof w === 'number' && Number.isFinite(w)) ? w : 0;
    const istVerzeichnis = (w) => !!w && typeof w === 'object' && !Array.isArray(w);
    const pruefen = (d, jetzige) => {
        const punkte = [];
        const zahlen = {};
        if (!istVerzeichnis(d)) {
            return {
                taugt: false, fassung: 0, exportiert: '', fehlt: [], zahlen,
                punkte: [{ stufe: 'fehler',
                        text: 'Die Datei enthält kein Objekt — eine Sicherung dieser ' +
                            'App beginnt immer mit einem Objekt.' }]
            };
        }
        const o = d;
        if (!istVerzeichnis(o['blocks'])) {
            return {
                taugt: false, fassung: zahl(o['version']),
                exportiert: String(o['exportiert'] ?? ''), fehlt: [], zahlen,
                punkte: [{ stufe: 'fehler',
                        text: 'Das sieht nicht nach einer Sicherung dieser App aus — ' +
                            'es fehlt das Fach „blocks".' }]
            };
        }
        for (const f of FAECHER) {
            const w = o[f];
            if (f === 'versions') {
                zahlen[f] = Array.isArray(w) ? w.length : 0;
                if (w !== undefined && !Array.isArray(w)) {
                    punkte.push({ stufe: 'warnen',
                        text: 'Das Fach „versions" ist keine Liste und wird ausgelassen.' });
                }
            }
            else {
                zahlen[f] = istVerzeichnis(w) ? Object.keys(w).length : 0;
                if (w !== undefined && !istVerzeichnis(w)) {
                    punkte.push({ stufe: 'warnen',
                        text: 'Das Fach „' + f + '" ist kein Verzeichnis und wird ausgelassen.' });
                }
            }
        }
        const fassung = zahl(o['version']);
        if (!fassung) {
            punkte.push({ stufe: 'hinweis',
                text: 'Die Sicherung nennt keine Formatfassung. Sie ist vermutlich ' +
                    'älter als die Fassungszählung — das ist kein Problem, ' +
                    'nur nicht überprüfbar.' });
        }
        else if (fassung > jetzige) {
            punkte.push({ stufe: 'warnen',
                text: 'Diese Sicherung stammt aus einer NEUEREN Redion-Fassung ' +
                    '(' + fassung + ' gegen ' + jetzige + ' hier). Was sie an ' +
                    'Neuem enthält, kennt dieses Gerät nicht und geht beim ' +
                    'Einspielen verloren. Besser zuerst Redion aktualisieren.' });
        }
        else if (fassung < jetzige) {
            punkte.push({ stufe: 'hinweis',
                text: 'Ältere Formatfassung (' + fassung + ' gegen ' + jetzige +
                    '). Die Umzüge laufen beim Einspielen mit.' });
        }
        const fehltRoh = o['fehlt'];
        const fehlt = Array.isArray(fehltRoh)
            ? fehltRoh.map(x => String(x)).filter(x => x)
            : [];
        if (fehlt.length) {
            punkte.push({ stufe: 'hinweis',
                text: 'Die Sicherung sagt selbst, dass sie Folgendes auslässt: ' +
                    fehlt.join(', ') + '.' });
        }
        if (zahlen['blocks'] === 0) {
            punkte.push({ stufe: 'warnen',
                text: 'Diese Sicherung enthält keine einzige Seite. Mit ' +
                    '„Ersetzen" eingespielt bliebe nichts übrig.' });
        }
        return {
            taugt: true, fassung,
            exportiert: String(o['exportiert'] ?? ''),
            fehlt, zahlen, punkte
        };
    };
    const brauchtRueckfrage = (b) => b.punkte.some(p => p.stufe === 'fehler' || p.stufe === 'warnen');
    const saetze = (b, stufe) => b.punkte.filter(p => !stufe || p.stufe === stufe).map(p => p.text);
    return { pruefen, brauchtRueckfrage, saetze, FAECHER };
})();
window.ImportValidierung = ImportValidierung;
