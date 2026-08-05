"use strict";
/* ============================================================================
 * kern/zustand/verlauf.js — Rückgängig und Wiederholen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/zustand/verlauf.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/zustand/verlauf.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js.
 *
 * ─── WIE ES ARBEITET ────────────────────────────────────────────────────────
 *
 * Zwei Stapel und eine ganze Seite je Schritt. Das ist grob — ein Editor, der
 * einzelne Zeichen zurücknimmt, führt Buch über Änderungen, nicht über
 * Zustände. Dafür ist es unbestechlich: was zurückkommt, ist die Seite, wie
 * sie war, und nicht die Seite, wie eine Kette von Rücknahmen sie meint.
 *
 * Deshalb der Zaun bei 700 ms und der Deckel bei 60 Schritten. Ohne den Zaun
 * hätte jeder Tastendruck seinen eigenen Stapeleintrag, und sechzig Schritte
 * zurück wären sechzig Buchstaben.
 *
 * `sperre` verhindert das Naheliegende: Zurücknehmen schreibt in den Speicher,
 * der Speicher ruft `merke`, und das Zurückgenommene stünde sofort wieder als
 * Schritt im Stapel.
 * ==========================================================================*/
const Verlauf = (() => {
    const zurueckStapel = [];
    const vorStapel = [];
    const MAX = 60;
    let letzte = 0;
    let sperre = false;
    const momentaufnahme = () => {
        const id = App.aktuelleSeite();
        if (!id)
            return null;
        const p = Store.getBlock(id);
        if (!p || p.locked)
            return null;
        return { pageId: id, daten: Store.baum(id) };
    };
    /** Vor einer Änderung aufrufen. Häuft nicht bei jedem Tastendruck an. */
    const merke = (erzwingen = false) => {
        if (sperre)
            return;
        const jetzt = Date.now();
        if (!erzwingen && jetzt - letzte < 700)
            return;
        const m = momentaufnahme();
        if (!m)
            return;
        letzte = jetzt;
        zurueckStapel.push(m);
        if (zurueckStapel.length > MAX)
            zurueckStapel.shift();
        vorStapel.length = 0;
    };
    const anwenden = (m) => {
        sperre = true;
        const p = Store.getBlock(m.pageId);
        if (!p) {
            sperre = false;
            return;
        }
        Store.kinderLeeren(m.pageId);
        (m.daten.kinder || []).forEach((k) => Store.baumEinfuegen(k, m.pageId));
        Store.updateBlock(m.pageId, { text: m.daten.text, icon: m.daten.icon });
        if (App.aktuelleSeite() !== m.pageId)
            App.oeffne(m.pageId);
        else {
            App.zeichneSeite();
            App.zeichneBaum();
        }
        sperre = false;
    };
    /* ------------------------------------------------------------------------
     * `pop()` gibt `VerlaufAufnahme | undefined`, und zwar zu Recht: die Länge
     * eine Zeile weiter oben zu prüfen und dann zu ziehen sind zwei Schritte,
     * zwischen denen theoretisch etwas passieren kann. Vorher stand hier
     * `anwenden(m)` ohne Nachsehen — und `anwenden` griff sofort auf
     * `m.pageId` zu. Die Prüfung kostet eine Zeile.
     * ----------------------------------------------------------------------*/
    const zurueck = () => {
        const m = zurueckStapel.pop();
        if (!m) {
            UI.toast('Nichts mehr rückgängig zu machen');
            return;
        }
        const jetzt = momentaufnahme();
        if (jetzt)
            vorStapel.push(jetzt);
        anwenden(m);
        UI.toast('Rückgängig');
    };
    const vor = () => {
        const m = vorStapel.pop();
        if (!m) {
            UI.toast('Nichts zu wiederholen');
            return;
        }
        const jetzt = momentaufnahme();
        if (jetzt)
            zurueckStapel.push(jetzt);
        anwenden(m);
        UI.toast('Wiederholt');
    };
    /** Hängt sich an die Speicherfunktionen, damit jede Änderung erfasst wird. */
    const start = () => {
        ['updateBlock', 'addBlock', 'trashBlock', 'purgeBlock', 'setProp', 'addDatabase', 'addRow']
            .forEach(name => {
            const original = Store[name];
            Store[name] = function (...args) {
                merke(false);
                return original.apply(Store, args);
            };
        });
    };
    return {
        start, merke, zurueck, vor,
        leeren: () => { zurueckStapel.length = 0; vorStapel.length = 0; }
    };
})();
window.Verlauf = Verlauf;
