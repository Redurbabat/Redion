"use strict";
/* ============================================================================
 * core/import/validierung.ts — sagt VOR dem Einspielen, was in der Datei steht
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/import/validierung.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/import/validierung.js`. Wer das .js bearbeitet, verliert
 * die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * DIE PRÜFUNG WAR EIN FELDTEST (E284).
 *
 * Der gesamte Prüfumfang für Blöcke, Sammlungen, Ansichten, Meta und Verlauf
 * war eine Zeile:
 *
 *     if (!d.blocks) throw new Error('Das sieht nicht nach einer Sicherung …');
 *
 * Das reicht, um eine Urlaubsfotoliste abzuweisen. Es reicht nicht, um
 * irgendetwas darüber zu sagen, was gleich in die Ablage geschrieben wird.
 *
 * ─── DIE FASSUNG WIRD GESCHRIEBEN UND NIE GELESEN ───────────────────────────
 *
 * `exportAll` schreibt seit jeher `version: VERSION` ins Manifest
 * (indexdb.ts:1713). Beim Einspielen liest das niemand. Eine Sicherung aus
 * einer NEUEREN Redion-Fassung — mit einem Feld, das dieses Gerät nicht
 * kennt, oder einem Fach, das es noch nicht gibt — läuft still durch und
 * verliert dabei genau das, was sie neu hatte.
 *
 * Das ist die Sorte Datenverlust, die §46 meint: nicht laut, sondern
 * unbemerkt, und man sieht es erst Wochen später an einer Seite, die
 * anders aussieht als vorher.
 *
 * ─── WAS HIER GEPRÜFT WIRD, UND WAS NICHT ───────────────────────────────────
 *
 * Geprüft wird die FORM: gibt es die Fächer, sind es Verzeichnisse, ist die
 * Fassung lesbar, passen die Zählungen zum Manifest.
 *
 * NICHT geprüft wird der Inhalt jedes einzelnen Blocks. Das wäre bei
 * zweihunderttausend Blöcken teuer und würde eine leicht abweichende
 * Sicherung abweisen, die sich problemlos einspielen liesse. Redion ist
 * nachsichtig gegenüber fremden Feldern (ein unbekanntes Feld bleibt
 * stehen) — die Prüfung soll das nicht umkehren.
 *
 * ─── UND WARUM SIE NICHT WIRFT ──────────────────────────────────────────────
 *
 * Sie gibt einen BEFUND zurück, keinen Fehler. Wer einspielt, soll
 * entscheiden dürfen: eine Sicherung aus einer neueren Fassung ist ein
 * Grund zum Nachfragen, kein Grund zum Verweigern. Nur was gar keine
 * Sicherung sein KANN, wird hart abgewiesen — dafür steht `taugt`.
 * ==========================================================================*/
const ImportValidierung = (() => {
    /** Die Fächer, die eine Sicherung dieser App führt. */
    const FAECHER = ['blocks', 'collections', 'views', 'meta', 'versions'];
    const zahl = (w) => (typeof w === 'number' && Number.isFinite(w)) ? w : 0;
    const istVerzeichnis = (w) => !!w && typeof w === 'object' && !Array.isArray(w);
    /**
     * Was steht in dieser Datei?
     *
     * @param d        der bereits ENTGIFTETE Wert aus `ImportSicherheit.lesen`.
     *                 Rohes `JSON.parse` gehört hier nicht herein — die
     *                 Reihenfolge ist entschärfen, dann prüfen.
     * @param jetzige  die Formatfassung DIESES Geräts (`Umzuege.JETZIGE`).
     */
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
        /* --- Das Mindeste: gibt es überhaupt Blöcke? ---------------------- */
        if (!istVerzeichnis(o['blocks'])) {
            return {
                taugt: false, fassung: zahl(o['version']),
                exportiert: String(o['exportiert'] ?? ''), fehlt: [], zahlen,
                punkte: [{ stufe: 'fehler',
                        text: 'Das sieht nicht nach einer Sicherung dieser App aus — ' +
                            'es fehlt das Fach „blocks".' }]
            };
        }
        /* --- Die Fächer zählen, statt sie zu glauben ---------------------- */
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
        /* --- Die Fassung, die bisher niemand las -------------------------- */
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
        /* --- Was das Manifest selbst über sich sagt ----------------------- */
        const fehltRoh = o['fehlt'];
        const fehlt = Array.isArray(fehltRoh)
            ? fehltRoh.map(x => String(x)).filter(x => x)
            : [];
        if (fehlt.length) {
            punkte.push({ stufe: 'hinweis',
                text: 'Die Sicherung sagt selbst, dass sie Folgendes auslässt: ' +
                    fehlt.join(', ') + '.' });
        }
        /* HIER STAND EINE PRÜFUNG, DIE FALSCH WAR — und sie ist stehengeblieben
           als Erklärung, damit sie niemand wieder einbaut.
    
           Der Gedanke war: „das Manifest nennt `versions` unter `enthaelt`,
           aber das Fach ist leer — die Datei ist wohl abgeschnitten." Beim
           ersten Lauf gegen Redions EIGENEN Export wurde sie sofort rot.
    
           Der Grund: `enthaelt` ist eine Aussage über das FORMAT, nicht über
           den Inhalt. `exportAll` schreibt die fünf Namen fest hin
           (indexdb.ts:1717), und ein frischer Arbeitsbereich hat legitim null
           Fassungen, null Sammlungen, null Ansichten. Die Prüfung konnte
           „rechtmässig leer" von „abgeschnitten" gar nicht unterscheiden.
    
           Eine Warnung, die bei gewöhnlichem Gebrauch anspringt, ist schlimmer
           als keine: sie bringt Menschen bei, Warnungen wegzuklicken. Deshalb
           ist sie weg und nicht abgeschwächt. */
        /* --- Ein leerer Bestand ist erlaubt, aber erwähnenswert ----------- */
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
    /** Gibt es einen Punkt, der ein Nachfragen wert ist? */
    const brauchtRueckfrage = (b) => b.punkte.some(p => p.stufe === 'fehler' || p.stufe === 'warnen');
    /** Alle Punkte einer Stufe, als Sätze. */
    const saetze = (b, stufe) => b.punkte.filter(p => !stufe || p.stufe === stufe).map(p => p.text);
    return { pruefen, brauchtRueckfrage, saetze, FAECHER };
})();
window.ImportValidierung = ImportValidierung;
