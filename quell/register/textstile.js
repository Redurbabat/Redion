"use strict";
/* ============================================================================
 * register/textstile.ts — Schriftgrössen und Schriftarten
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/textstile.ts`.
 * ----------------------------------------------------------------------------
 * EIN Katalog für alle Stellen der Oberfläche (§8, Regel 3). Wer eine Grösse
 * oder eine Schrift hinzufügt, trägt sie hier ein — und sie erscheint im
 * Blockmenü, im Blatt und überall sonst, ohne dass jemand eine zweite Liste
 * pflegen muss. Zwei Listen für dieselbe Frage laufen auseinander, und die
 * vergessene ist immer die, die der Nutzer sieht.
 *
 * WARUM KENNUNGEN UND KEINE WERTE. Was gespeichert wird, ist `'gross'` und
 * `'serif'` — nicht `1.25em` und nicht `Georgia, serif`. Zwei Gründe:
 *
 *   Sicherheit   Ein freier Wert aus den Daten landete sonst in einem
 *                style-Feld. `farbe: "red;background:url(…)"` ist kein
 *                erfundener Fall (§19). Kennungen werden zu CSS-KLASSEN,
 *                und was nicht im Katalog steht, wird verworfen.
 *   Änderbarkeit Wird die Schrift später eine andere, ändert sich eine
 *                Zeile CSS — nicht jeder gespeicherte Block.
 *
 * WARUM JE BLOCK UND NICHT MITTEN IM SATZ. Der Editor liest den Text mit
 * `ct.textContent` zurück (editor.ts, `bindeEditor`). Jede Auszeichnung
 * innerhalb einer Zeile wäre beim nächsten Tastendruck weg — gemessen, nicht
 * vermutet. Inline-Formate brauchen zuerst eine Rückübersetzung DOM → Text,
 * und die ist eine eigene Entscheidung mit eigenem Prüflauf.
 * ==========================================================================*/
const Textstile = (() => {
    /* [Kennung, Name für Menschen] — die Werte stehen im CSS als `.tg-…`. */
    const GROESSEN = [
        ['normal', 'Normal'],
        ['klein', 'Klein'],
        ['gross', 'Gross'],
        ['sehrgross', 'Sehr gross'],
        ['riesig', 'Riesig']
    ];
    /* Nur Schriften, die auf jedem Gerät vorhanden sind — eine mitgelieferte
       Schriftdatei wäre ein Anhang in jeder weitergegebenen Einzeldatei. */
    const SCHRIFTEN = [
        ['standard', 'Standard'],
        ['serif', 'Serifen'],
        ['mono', 'Schreibmaschine'],
        ['hand', 'Handschrift'],
        ['schmal', 'Schmal']
    ];
    const kennungen = (liste) => liste.map(x => x[0]);
    /** Steht diese Kennung im Katalog? Alles andere wird verworfen. */
    const gueltigeGroesse = (wert) => kennungen(GROESSEN).includes(String(wert));
    const gueltigeSchrift = (wert) => kennungen(SCHRIFTEN).includes(String(wert));
    /**
     * Die CSS-Klassen für einen Blockstil. `normal` und `standard` bekommen
     * keine Klasse — der Standard soll ohne Zutun gelten, auch wenn das CSS
     * später einmal anders aussieht.
     */
    const klassen = (stil) => {
        const s = (stil || {});
        const raus = [];
        if (gueltigeGroesse(s.groesse) && s.groesse !== 'normal')
            raus.push('tg-' + s.groesse);
        if (gueltigeSchrift(s.schrift) && s.schrift !== 'standard')
            raus.push('ts-' + s.schrift);
        return raus;
    };
    return { GROESSEN, SCHRIFTEN, gueltigeGroesse, gueltigeSchrift, klassen };
})();
window.Textstile = Textstile;
