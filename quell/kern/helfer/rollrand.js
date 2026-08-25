"use strict";
/* ============================================================================
 * rollrand.js — Wo ein Rollfeld angeschnitten ist, soll man das sehen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/helfer/rollrand.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/kern/helfer/rollrand.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * DER GRUND, WARUM ES DIESE DATEI GIBT
 *
 * Am Telefon, 390 px breit, stand im Tabellenblock:
 *
 *     Spalte B          Spalte C
 *     1'450.00 CHF      1'45
 *     2'199.70 CHF      2'18
 *
 * Rechts ist nichts kaputt — dort geht die Tabelle weiter, und die Zelle C2
 * enthält sehr wohl `1'450.00 CHF`. Abgeschnitten hat sie der BILDRAND.
 *
 * Und genau das ist gefährlich, weil die Kante SCHARF ist. Eine scharfe
 * Kante liest sich als Ende der Zahl: `1'45` ist eine gültige Zahl, nur eine
 * andere. Für eine zu enge Zelle gibt es seit jeher `###` — die Zelle weiss,
 * dass ihr Inhalt nicht passt. Am Bildrand weiss das niemand: die Zelle ist
 * breit genug, nur der Bildschirm ist es nicht.
 *
 * Das ist derselbe Fund wie in CLAUDE.md §55.2, eine Ebene höher. Dort war es
 * `634.2166666667`, das als `34.2166666667` dastand.
 *
 * DIE ANTWORT ist keine Warnung und kein Hinweistext, sondern eine WEICHE
 * KANTE. Der letzte Streifen verläuft ins Nichts, und damit liest das Auge
 * „hier geht es weiter" statt „hier hört die Zahl auf". Es kostet keine
 * Zeile Text, keinen Platz und keinen Klick.
 *
 * WARUM ÜBER `mask-image` UND NICHT ÜBER EIN AUFGELEGTES ELEMENT. Ein
 * Pseudo-Element im Rollfeld rollt MIT dem Inhalt und wäre nach dem ersten
 * Wisch weg. Eine Maske gilt dem Kasten des Elements, nicht seinem Inhalt —
 * sie bleibt am Rand stehen, egal wie weit gerollt wurde. Und sie braucht
 * keine Geometrie: kein Ausmessen von Kopf- und Fusszeile, das beim nächsten
 * Umbau schiefgeht.
 * ==========================================================================*/
const Rollrand = (() => {
    /**
     * Wie viel Spielraum, bevor eine Seite als „geht weiter" gilt.
     *
     * Nicht null: Browser rechnen `scrollWidth` und `clientWidth` bei
     * gebrochenen Zoomstufen um Bruchteile eines Pixels auseinander. Bei null
     * flackerte die Kante dann an einem Rollfeld, an dem gar nichts zu rollen
     * ist.
     */
    const SPIEL = 2;
    /** Die Wörter je Achse: [vor dem sichtbaren Teil, danach]. */
    const WORTE = {
        quer: ['links', 'rechts'],
        hoch: ['oben', 'unten']
    };
    const schreibe = (ziel, art, achse, davor, danach) => {
        const [a, b] = WORTE[achse];
        if (art === 'mehr') {
            const wert = davor && danach ? 'beides' : danach ? b : davor ? a : 'nein';
            if (ziel.dataset['mehr'] !== wert)
                ziel.dataset['mehr'] = wert;
            return;
        }
        const wert = [davor ? a : '', danach ? b : ''].filter(Boolean).join(' ');
        /* Nur schreiben, wenn sich etwas ändert — ein Attribut bei jedem
           Rollereignis neu zu setzen lässt den Zeichner unnötig arbeiten. */
        if (wert) {
            if (ziel.dataset['rand'] !== wert)
                ziel.dataset['rand'] = wert;
        }
        else if (ziel.dataset['rand'] !== undefined)
            delete ziel.dataset['rand'];
    };
    /** Setzt `data-rand` bzw. `data-mehr` nach dem aktuellen Rollstand. */
    const pruefe = (feld, wahl = {}) => {
        const achse = wahl.achse || 'quer';
        const hoch = achse === 'hoch';
        const stand = hoch ? feld.scrollTop : feld.scrollLeft;
        const sicht = hoch ? feld.clientHeight : feld.clientWidth;
        const ganz = hoch ? feld.scrollHeight : feld.scrollWidth;
        schreibe(wahl.an || feld, wahl.art || 'rand', achse, stand > SPIEL, stand + sicht < ganz - SPIEL);
    };
    /**
     * Ein Rollfeld beobachten. Gibt eine Funktion zurück, die das wieder
     * löst — gebraucht wird sie bisher nicht, aber ein Beobachter ohne
     * Abmeldung ist ein Leck, das man erst bemerkt, wenn es zu spät ist.
     */
    const binde = (feld, wahl = {}) => {
        if (!feld)
            return () => { };
        const nachsehen = () => pruefe(feld, wahl);
        feld.addEventListener('scroll', nachsehen, { passive: true });
        /* Die Breite ändert sich auch ohne Rollen: das Fenster dreht sich, eine
           Spalte wird breiter gezogen, die Seitenleiste klappt ein. Ohne diesen
           Beobachter bliebe die Kante stehen, wo sie beim ersten Zeichnen war. */
        let beobachter = null;
        if (typeof ResizeObserver !== 'undefined') {
            beobachter = new ResizeObserver(nachsehen);
            beobachter.observe(feld);
            /* Auch der Inhalt zählt — eine neue Spalte macht `scrollWidth` grösser,
               beim Hochen eine neue Zeile `scrollHeight`, ohne dass sich am Feld
               selbst etwas ändert. */
            const inhalt = feld.firstElementChild;
            if (inhalt)
                beobachter.observe(inhalt);
        }
        /* Beim ersten Mal steht die Breite noch nicht fest: das Feld ist gerade
           erst im Dokument, und der Zeichner war noch nicht dran. */
        nachsehen();
        requestAnimationFrame(nachsehen);
        return () => {
            feld.removeEventListener('scroll', nachsehen);
            beobachter?.disconnect();
        };
    };
    return { binde, pruefe, SPIEL };
})();
window.Rollrand = Rollrand;
