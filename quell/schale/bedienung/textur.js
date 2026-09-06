"use strict";
/* ============================================================================
 * schale/bedienung/textur.ts — die eine Rauschtextur, genau einmal definiert
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/textur.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Redurs Vorgabe „island" legt zwei Rauschflächen übereinander und
 * treibt sie mit `brightness` auseinander — daraus wird eine weiche,
 * wolkige Fläche. Sie trägt keine Auskunft, und genau deshalb steht sie an
 * der EINEN Stelle in Redion, die auch keine trägt: dem Kopf des
 * Begrüssungsbildschirms. Seit E456 ist der bewusst markenlos.
 *
 * ÜBERALL SONST WÄRE SIE FALSCH. Eine Fläche, die nichts bedeutet, kostet
 * Aufmerksamkeit; auf einer Arbeitsfläche ist das ein Abzug, kein Zusatz
 * (§39, „Notion-artige Klarheit vor Effekten"). Der Willkommensschirm ist
 * die Ausnahme, weil man ihn genau einmal sieht.
 *
 * WARUM DIESE DATEI ÜBERHAUPT EXISTIERT — und nicht nur CSS: eine
 * Rauschtextur braucht `feTurbulence`, und das braucht einen
 * `<filter id="…">`. Das ist der ERSTE SVG-Filter im Produktivcode. E440
 * hat am KI-Funken gezeigt, was passiert, wenn mehrere Instanzen dieselbe
 * ID tragen: sie teilen sie sich. Für einen Lader war die Antwort „je
 * Instanz eine eigene ID" (E461). Für eine Textur ist die Antwort die
 * andere Hälfte derselben Regel: GENAU EINMAL global definieren und dann
 * referenzieren. Sie ist überall dieselbe; zwei davon wären zwei gleiche.
 *
 * Der Halter hängt versteckt am Ende von `<body>`, ist `aria-hidden`, hat
 * Höhe und Breite null und wird nur einmal gebaut.
 * ==========================================================================*/
const Textur = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const HALTER = 'ru-textur-halter';
    const FEIN = 'ru-textur-fein';
    const GROB = 'ru-textur-grob';
    const rauschen = (id, dichte, lagen, saat) => {
        const f = document.createElementNS(NS, 'filter');
        f.setAttribute('id', id);
        /* `userSpaceOnUse` mit fester Kachel: ohne das rechnet der Browser die
           Frequenz gegen die Elementgrösse, und dieselbe Textur sähe auf einem
           breiten Kopf anders aus als auf einem schmalen. */
        f.setAttribute('x', '0');
        f.setAttribute('y', '0');
        f.setAttribute('width', '100%');
        f.setAttribute('height', '100%');
        const t = document.createElementNS(NS, 'feTurbulence');
        t.setAttribute('type', 'fractalNoise');
        t.setAttribute('baseFrequency', dichte);
        t.setAttribute('numOctaves', lagen);
        t.setAttribute('seed', saat);
        t.setAttribute('stitchTiles', 'stitch');
        f.append(t);
        return f;
    };
    /** Den Halter anlegen, falls es ihn noch nicht gibt. Mehrfach rufen ist
     *  ausdrücklich erlaubt — der zweite Ruf tut nichts. */
    const sicherstellen = () => {
        if (document.getElementById(HALTER))
            return;
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('id', HALTER);
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        const defs = document.createElementNS(NS, 'defs');
        defs.append(rauschen(FEIN, '0.85', '3', '7'), rauschen(GROB, '0.24', '2', '19'));
        svg.append(defs);
        document.body.append(svg);
    };
    /**
     * Eine Textur in ein Element legen. Sie kommt als zwei absolute Lagen
     * DAVOR — der Inhalt des Wirts bleibt, wo er ist.
     *
     * Der Wirt braucht `position` ausser `static`; das setzt diese Funktion
     * nicht selbst, weil sie damit ein Layout ändern würde, das ihr nicht
     * gehört. Die CSS-Regel `.ru-textur-wirt` erledigt es.
     */
    const legen = (wirt) => {
        sicherstellen();
        if (wirt.querySelector(':scope > .ru-textur'))
            return;
        wirt.classList.add('ru-textur-wirt');
        for (const lage of ['ru-textur ru-textur-fein', 'ru-textur ru-textur-grob']) {
            const i = document.createElement('i');
            i.className = lage;
            i.setAttribute('aria-hidden', 'true');
            wirt.prepend(i);
        }
    };
    return { HALTER, FEIN, GROB, sicherstellen, legen };
})();
window.Textur = Textur;
