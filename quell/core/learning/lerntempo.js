"use strict";
/* ============================================================================
 * core/learning/lerntempo.ts — wie lange eine Karte WIRKLICH dauert
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/learning/lerntempo.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/learning/lerntempo.js`.
 * ----------------------------------------------------------------------------
 * REIN: keine Uhr, keine Ablage, kein DOM. Herein kommen Zeitpunkte als
 * Millisekunden, heraus kommt eine Dauer und die Zahl der Belege.
 *
 * ─── WARUM ES DIESE DATEI GIBT ──────────────────────────────────────────────
 *
 * Der Zeitbudget-Planer (E308) muss wissen, was „dreissig fällige Karten"
 * an Minuten kostet. Die bequeme Antwort wäre eine Konstante — „eine halbe
 * Minute je Karte" —, und sie wäre geraten. Bei Redur mit Elektro-Formeln
 * dauert eine Karte anders lang als bei jemandem mit Vokabeln.
 *
 * Gemessen werden kann es aber: `wissen/dienst.ts:183` schreibt zu JEDER
 * Antwort einen Zeitpunkt (`at`). Der Abstand zwischen zwei Antworten
 * DERSELBEN Sitzung ist die Zeit, die die zweite Karte gekostet hat.
 *
 * (`lernwelt.ts:873` liest `durationMs` und `dauerSekunden` — beide schreibt
 * niemand. Diese Datei nimmt deshalb den Weg über die Zeitpunkte, die es
 * wirklich gibt.)
 *
 * ─── WARUM MEDIAN UND NICHT MITTELWERT ──────────────────────────────────────
 *
 * Zwischen zwei Antworten liegt manchmal ein Telefonat. Ein einziger solcher
 * Abstand von vier Minuten hebt den Mittelwert von zwanzig Karten um zwölf
 * Sekunden je Karte. Der Median merkt es nicht einmal.
 *
 * ─── UND WARUM DIE BELEGE MITGELIEFERT WERDEN ───────────────────────────────
 *
 * Dieselbe Regel wie in `kompetenz.ts`: eine Zahl ohne ihre Grundlage ist
 * eine Behauptung. Aus drei Abständen lässt sich kein Tempo ableiten, und
 * wer es trotzdem anzeigt, verkauft Rauschen als Messung. `belege` sagt,
 * worauf die Zahl steht; unter `GENUG` heisst es ausdrücklich „geschätzt".
 * ==========================================================================*/
const Lerntempo = (() => {
    /** Grösser: dazwischen wurde die App weggelegt, das ist keine Kartendauer. */
    const PAUSE_MS = 5 * 60 * 1000;
    /** Kleiner: da wurde durchgeklickt, nicht gelesen. */
    const KURZ_MS = 1200;
    /** So viele Abstände braucht es, bevor die Zahl „gemessen" heissen darf. */
    const GENUG = 12;
    const median = (werte) => {
        if (!werte.length)
            return 0;
        const s = [...werte].sort((a, b) => a - b);
        const m = Math.floor(s.length / 2);
        return s.length % 2 ? s[m] : ((s[m - 1] + s[m]) / 2);
    };
    /**
     * Aus Antwortzeitpunkten die Dauer je Karte.
     *
     * @param zeiten   Zeitpunkte in Millisekunden, in beliebiger Reihenfolge.
     * @param vorgabe  Was gilt, solange es zu wenige Belege gibt (Sekunden).
     */
    const jeKarte = (zeiten, vorgabe = 30) => {
        const sortiert = (Array.isArray(zeiten) ? zeiten : [])
            .map(z => Number(z))
            .filter(z => Number.isFinite(z) && z > 0)
            .sort((a, b) => a - b);
        const abstaende = [];
        for (let i = 1; i < sortiert.length; i++) {
            const d = sortiert[i] - sortiert[i - 1];
            if (d >= KURZ_MS && d <= PAUSE_MS)
                abstaende.push(d);
        }
        const genug = abstaende.length >= GENUG;
        const sekunden = genug
            ? Math.round(median(abstaende) / 100) / 10
            : Math.max(1, Math.round(Number(vorgabe) || 30));
        return { sekunden, belege: abstaende.length, gemessen: genug };
    };
    /** Was `n` Karten kosten, in Minuten — mindestens eine. */
    const minutenFuer = (n, messung) => Math.max(1, Math.round((Math.max(0, Math.round(Number(n) || 0)) * messung.sekunden) / 60));
    /** Ein Satz, der die Grundlage mitsagt statt sie zu verschweigen. */
    const satz = (m) => m.gemessen
        ? 'gemessen aus ' + m.belege + ' Antworten'
        : 'geschätzt — erst ' + m.belege + ' von ' + GENUG + ' Messungen';
    return { jeKarte, minutenFuer, satz, PAUSE_MS, KURZ_MS, GENUG };
})();
window.Lerntempo = Lerntempo;
