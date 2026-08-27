"use strict";
/* ============================================================================
 * ruhig.js — die Schale zeigt fünf Wege statt zweiunddreissig
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/ruhig.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/aufbau/ruhig.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WARUM ES DAS GIBT. Nachgemessen an der laufenden App bei 1440 × 900,
 * gezählt wurde alles Anklickbare in Seitenleiste, Kopfzeile und Menüband:
 *
 *     Startbild        Seitenleiste 32 + Kopfzeile 13 + Menüband  7  =  52
 *     offene Seite     Seitenleiste 34 + Kopfzeile 12 + Menüband 21  =  67
 *
 * Zweiundfünfzig Knöpfe, bevor ein Wort geschrieben ist. Der Bestand selbst
 * ist in Ordnung — 37 Bereiche, 108 Befehle, 78 Blockarten, 14 Module. Das
 * Problem ist, dass drei Leisten übereinander versuchen, alles gleichzeitig
 * anzubieten (E218).
 *
 * WIE ES ARBEITET, UND WAS ES AUSDRÜCKLICH NICHT TUT. Es entfernt nichts.
 * Kein Knopf wird aus dem Baum genommen, keine Handlung abgemeldet, keine
 * zweite Liste angelegt. Ein Datenattribut am `body` sagt, was gerade zu
 * sehen ist:
 *
 *     data-ruhig="an"     die fünf Wege plus „Mehr"
 *     data-ruhig="offen"  alles, an genau derselben Stelle wie vorher
 *     data-ruhig="aus"    die Leiste, wie sie vor E219 war
 *
 * Zwischen „an" und „offen" liegt nur eine CSS-Regel. Das ist Absicht:
 * ein aufklappendes „Mehr", das eine EIGENE Liste zeichnete, wäre ein
 * zweiter Katalog neben dem Register (Paragraph 8) — und der erste, der
 * still auseinanderläuft, sobald jemand einen Eintrag ergänzt.
 *
 * WER ENTSCHEIDET. `Store.getMeta('ruhig', true)`. Von Haus aus an; wer die
 * alte Leiste will, schaltet in den Einstellungen zurück, und der Zustand
 * überlebt den Neustart wie jede andere Einstellung auch.
 * ==========================================================================*/
const Ruhig = (() => {
    /** Ist die ruhige Fassung eingeschaltet? Ohne gespeicherten Wert: ja. */
    const an = () => Store.getMeta('ruhig', true) !== false;
    /* Ob „Mehr" gerade offen ist, gehört NICHT in den Speicher: es ist keine
       Einstellung, sondern ein Zustand dieses Augenblicks. Wer die App neu
       öffnet, will die ruhige Leiste sehen, nicht die von vorhin ausgeklappte. */
    let offen = false;
    /** Setzt das Attribut, an dem das Stilblatt hängt. Sonst nichts. */
    const anwenden = () => {
        const b = document.body;
        if (!b)
            return;
        b.dataset['ruhig'] = an() ? (offen ? 'offen' : 'an') : 'aus';
        const knopf = document.getElementById('btn-mehr');
        if (knopf) {
            knopf.setAttribute('aria-expanded', String(an() && offen));
            /* Der Name sagt, was der Klick TUT, nicht wo man ist. „Mehr" und
               „Weniger" sind beides Handlungen; ein Knopf, der „Offen" hiesse,
               wäre eine Zustandsanzeige mit Klickfläche. */
            const text = knopf.querySelector('.sl-mehr-text');
            if (text)
                text.textContent = (an() && offen) ? 'Weniger' : 'Mehr';
        }
    };
    /** „Mehr" auf und zu. Ohne ruhige Fassung gibt es nichts umzuschalten. */
    const schalten = () => {
        if (!an())
            return;
        offen = !offen;
        anwenden();
    };
    /** Ruhige Fassung ein oder aus. `undefined` heisst umschalten. */
    const setzen = (wert) => {
        const neu = wert === undefined ? !an() : wert;
        Store.setMeta('ruhig', neu);
        /* Beim Abschalten das aufgeklappte „Mehr" mit zurücknehmen — sonst
           stünde nach dem nächsten Einschalten alles offen da. */
        if (!neu)
            offen = false;
        anwenden();
        return neu;
    };
    /**
     * Einmal beim Start. `binde` hängt den Schalter an und setzt das Attribut;
     * beides ist gutmütig, wenn es den Knopf noch nicht gibt (Einzeldatei,
     * Prüfläufe, ein halb aufgebautes Fenster).
     */
    const binde = () => {
        const knopf = document.getElementById('btn-mehr');
        if (knopf && !knopf.dataset['gebunden']) {
            knopf.dataset['gebunden'] = 'ja';
            knopf.addEventListener('click', schalten);
        }
        anwenden();
    };
    return { an, offen: () => offen, anwenden, schalten, setzen, binde };
})();
window.Ruhig = Ruhig;
