"use strict";
/* ============================================================================
 * schale/bedienung/zustand.ts — die eine Sprache für „läuft, fertig, Fehler"
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/zustand.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Ein Upload, eine Sicherung, ein Druckauftrag, ein Abgleich und
 * eine KI-Anfrage haben denselben Lebenslauf: sie warten, sie laufen, sie
 * sind fertig — oder sie scheitern oder werden abgebrochen. Bis hierher
 * hatte jede Stelle dafür eigene Wörter, eigene Klassen und eigene Farben:
 * `.laeuft` mit `.hs-kreisel` auf dem Start-Bildschirm, `zustand: 'wartet'`
 * in der Dateiablage, „Sichern …" hier und „wird geschrieben" dort.
 *
 * Dieses Bauteil legt die SECHS Arten einmal fest — mit Zeichen und
 * Standardsatz — und gibt eine kleine Pille dafür her. Die Werte sind
 * deutsch, weil drei davon ('wartet' | 'laeuft' | 'fertig') so in der
 * Dateiablage GESPEICHERT sind (`src/bereiche/dateien/ablage.ts`). Ein
 * Feldname, der in IndexedDB liegt, ist Daten und kein Name (§53.3).
 *
 * EIN ZUSTAND IST NIE NUR FARBE (§38). Jede Art trägt ein Zeichen UND einen
 * Text. Wer Rot und Grün nicht unterscheidet, liest „!" gegen „✓"; wer gar
 * nicht sieht, hört den Text — die Pille ist `role="status"`, und der
 * Wechsel wird gemeldet.
 *
 * WAS ES NICHT IST. Kein Fortschrittsbalken und kein Knopf. Der Knopf,
 * der eine Aktion auslöst und dabei seinen Verlauf zeigt, ist
 * `zustandsknopf.ts` — und der holt sich Zeichen und Sätze von hier.
 * ==========================================================================*/
const Zustand = (() => {
    /* DIE ZEICHEN SIND TEXT, KEINE BILDER. Ein Kreis, der sich füllt, ein
       Haken, ein Ausrufezeichen: das versteht jede Schrift und jeder
       Vorleser braucht es nicht — die Pille sagt den Text selbst. */
    const ARTEN = {
        bereit: { zeichen: '○', text: 'Bereit' },
        wartet: { zeichen: '…', text: 'Wartet' },
        laeuft: { zeichen: '◐', text: 'Läuft …' },
        fertig: { zeichen: '✓', text: 'Fertig' },
        fehler: { zeichen: '!', text: 'Fehler' },
        abgebrochen: { zeichen: '✕', text: 'Abgebrochen' }
    };
    const ist = (wert) => typeof wert === 'string' && Object.prototype.hasOwnProperty.call(ARTEN, wert);
    const zeichen = (art) => ARTEN[art].zeichen;
    const text = (art) => ARTEN[art].text;
    /**
     * Ein Element auf eine Art stellen. Funktioniert für jede Pille aus
     * `pille()` — und für jedes andere Element mit denselben zwei Kindern.
     * Eine unbekannte Art wird zu 'fehler' mit dem Wort selbst als Text:
     * lieber ein sichtbares Fragezeichen als eine stille Pille.
     */
    const setzen = (element, art, eigenerText) => {
        const sicher = ist(art) ? art : 'fehler';
        element.dataset['zustand'] = sicher;
        const z = element.querySelector('.ru-zustand-zeichen');
        const t = element.querySelector('.ru-zustand-text');
        if (z)
            z.textContent = ARTEN[sicher].zeichen;
        if (t)
            t.textContent = eigenerText ?? (ist(art) ? ARTEN[sicher].text : String(art));
    };
    /**
     * Die Pille: `<span class="ru-zustand" role="status" data-zustand="…">`
     * mit Zeichen (aria-hidden) und Text. `role="status"` ist eine höfliche
     * Live-Region — der Wechsel wird vorgelesen, ohne zu unterbrechen.
     */
    const pille = (auftrag) => {
        const el = document.createElement('span');
        el.className = 'ru-zustand';
        el.setAttribute('role', 'status');
        const z = document.createElement('span');
        z.className = 'ru-zustand-zeichen';
        z.setAttribute('aria-hidden', 'true');
        const t = document.createElement('span');
        t.className = 'ru-zustand-text';
        el.append(z, t);
        setzen(el, auftrag.art, auftrag.text);
        return el;
    };
    return { ARTEN, ist, zeichen, text, pille, setzen };
})();
window.Zustand = Zustand;
