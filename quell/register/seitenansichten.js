"use strict";
/* ============================================================================
 * register/seitenansichten.ts — der Katalog der drei Blicke auf EINE Seite
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/seitenansichten.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/register/seitenansichten.js`; `pruefungen/lauf/test105.mts`
 * meldet es vorher.
 * ----------------------------------------------------------------------------
 * Redur, 26. September 2026, mit einem Bild von AFFiNEs Kopfzeile: „bei der
 * affine haben wir das es wechsel die ansichten und ich will dort auch die
 * beide und plus von unsere aktuelle stand also mit cover usw also dort
 * 3 bereiche" — und danach, als die Frage geklärt war: „ich will die 2 von
 * affine 1:1 haben auch alles komplett wie es aussehn … und noch eine 3 für
 * die aktuelle Redion damit wir es auch haben; die 3 ist von uns erfunden".
 *
 * NACHGELESEN, BEVOR GEBAUT WURDE (`doku/karte/thema-ansichten.md`): AFFiNE
 * hat GENAU ZWEI Modi — `page` und `edgeless` —, und es sind zwei Ansichten
 * DESSELBEN Dokuments, nicht zwei Dokumente. Was oft für einen dritten
 * gehalten wird, ist keiner: Präsentation ist ein Werkzeug der Fläche,
 * Journal eine Eigenschaft, „All docs" eine Liste.
 *
 * WARUM NICHT `Ansichten` UND WARUM NICHT `ansicht`. Beide Namen sind hier
 * längst vergeben, und das ist genau der Fall, vor dem §8 warnt:
 *
 *     `Ansichten`              der Dienst der DATENBANK-Ansichten
 *                              (`bereiche/datenbanken/ansichten/dienst.ts:13`,
 *                              global seit :894)
 *     `Register.ansichten`     der Katalog der zwölf Datenbankansichten
 *     `FORMEN.ansicht`         die Form eines Eintrags im Fach `views`
 *                              (`kern/ablage/formen.ts:119`)
 *
 * Ein zweiter Katalog unter demselben Namen liefe mit dem ersten auseinander,
 * und niemand sähe, welcher gilt. Deshalb `Register.seitenansichten` — und am
 * Block das Feld `seitenAnsicht`, nicht `ansicht`.
 *
 * WAS HIER NICHT STEHT: was eine Ansicht ZEICHNET. Ein Register beschreibt,
 * es zeichnet nicht (`register/formeln.ts`, Z.17). Der Umschalter steht in
 * `schale/aufbau/seitenansicht.ts`, die Leinwand in
 * `schale/aufbau/seitenflaeche.ts`, der Seitenkopf bleibt in `kopfleiste.ts`.
 * ==========================================================================*/
window.Register = window.Register || {};
Register.seitenansichten = (() => {
    /* Die Reihenfolge ist die des Umschalters, und sie ist AFFiNEs: zuerst die
       Seite, dann die Fläche. Unsere eigene steht hinten — nicht, weil sie
       weniger wert ist, sondern weil die zwei vorderen zusammengehören und ein
       Fremdkörper zwischen ihnen die Ordnung zerschlägt. */
    const ARTEN = [
        {
            id: 'seite', name: 'Seite',
            titel: 'Seite — schlank wie AFFiNEs `page`: Symbol, Titel, Text. Kein Cover, keine Werkzeugzeile.',
            zeichen: 'page', herkunft: 'affine'
        },
        {
            id: 'flaeche', name: 'Fläche',
            titel: 'Fläche — die Leinwand wie AFFiNEs `edgeless`: Punktraster, der Seitentext als Kasten darauf, schieben und zoomen.',
            zeichen: 'grid', herkunft: 'affine'
        },
        {
            id: 'redion', name: 'Redion',
            titel: 'Redion — unsere eigene: Cover, Symbol, Titel und die Werkzeugzeile. Das, was Redion immer gezeigt hat.',
            zeichen: 'image', herkunft: 'redion'
        }
    ];
    /* DIE VORGABE IST DIE UNSERE, UND DAS IST EINE DATENREGEL (§9).
       Ein Seitenblock OHNE das Feld ist nicht kaputt, sondern von gestern — und
       er muss genau das sehen, was er immer gesehen hat. Dasselbe Muster wie
       `raumVersion` beim Whiteboard (E686) und wie `dokumentModus === undefined`
       beim ersten Einlesen einer PDF. Wer diese Zeile auf 'seite' stellt,
       nimmt jeder bestehenden Seite ihr Cover, ohne ein Byte zu ändern. */
    const VORGABE = 'redion';
    const holen = (id) => ARTEN.find(a => a.id === id) ?? null;
    const ids = () => ARTEN.map(a => a.id);
    return { ARTEN, VORGABE, holen, ids };
})();
