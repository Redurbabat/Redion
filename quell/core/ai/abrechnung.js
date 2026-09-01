"use strict";
/* ============================================================================
 * core/ai/abrechnung.ts — die WIRKLICHE Tokenzahl aus dem Antwortstrom
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/ai/abrechnung.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/ai/abrechnung.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * DAS BUCH FÜHRTE SCHÄTZUNGEN, OBWOHL DIE ZAHL MITKAM (L104, E319).
 *
 * Jeder Anbieter schickt am Ende, wie viele Token es wirklich waren. Der
 * Strom-Leser in `bereiche/ki/dienst.ts` suchte in jedem Ereignis nach
 * `delta.content` und warf alles andere weg — auch die Abrechnung.
 *
 * Verbucht wurde deshalb die SCHÄTZUNG, und die greift mit 3,6 Zeichen je
 * Token bewusst zu hoch. Für eine Bremse ist das die harmlose Richtung; für
 * die Frage „was habe ich diesen Monat wirklich ausgegeben" ist es die
 * falsche.
 *
 * ─── ZWEI DIALEKTE, EINE ANTWORT ────────────────────────────────────────────
 *
 * OpenAI-artig (Groq, OpenRouter, Gemini, OpenAI): ein LETZTES Ereignis mit
 * leerem `choices` und
 *
 *     usage: { prompt_tokens, completion_tokens }
 *
 * Anthropic: ZWEI Ereignisse, und das ist der Grund für `zusammen()` —
 *
 *     message_start  → message.usage.input_tokens
 *     message_delta  → usage.output_tokens
 *
 * ─── WARUM NICHT JEDER ANBIETER GEFRAGT WIRD ────────────────────────────────
 *
 * OpenAI-artige Server schicken die Abrechnung beim Streamen nur, wenn man
 * `stream_options: { include_usage: true }` mitschickt. Das darf NICHT an
 * jeden gehen: „Eigener Server" ist eine Adresse, die der Mensch einträgt —
 * LM Studio, llama.cpp, ein Proxy —, und ein Server, der unbekannte Felder
 * ablehnt, würde daran mit einem 400 scheitern. Eine kaputte Antwort gegen
 * eine genauere Zahl zu tauschen wäre ein schlechtes Geschäft (§46).
 *
 * Deshalb `WILL_ABRECHNUNG`: die vier Anbieter, deren Adresse in Redion
 * steht und von denen bekannt ist, dass sie das Feld verstehen. Anthropic
 * braucht es nicht, es schickt ungefragt. Und wo nichts kommt, bleibt die
 * Schätzung — als Schätzung gekennzeichnet, nicht als Messung getarnt.
 * ==========================================================================*/
const KiAbrechnung = (() => {
    /**
     * Die Anbieter, die `stream_options` bekommen dürfen.
     *
     * NICHT dabei: `anthropic` (schickt ungefragt) und `eigen` (fremde
     * Adresse, unbekannte Verträglichkeit — siehe Kopf).
     */
    const WILL_ABRECHNUNG = ['groq', 'openrouter', 'gemini', 'openai'];
    /** Bekommt dieser Anbieter `stream_options: { include_usage: true }`? */
    const willAbrechnung = (anbieterId) => WILL_ABRECHNUNG.indexOf(String(anbieterId || '')) >= 0;
    const zahl = (w) => (typeof w === 'number' && Number.isFinite(w) && w >= 0) ? w : undefined;
    /**
     * Ein einzelnes Ereignis lesen. Gibt `null`, wenn keine Abrechnung
     * darinsteht — das ist der Normalfall, denn die allermeisten Ereignisse
     * sind Textstücke.
     *
     * @param d            das geparste Ereignis
     * @param istAnthropic welcher Dialect gesprochen wird
     */
    const ausEreignis = (d, istAnthropic) => {
        if (!d || typeof d !== 'object')
            return null;
        if (istAnthropic) {
            /* `message_start` trägt die Eingabe, `message_delta` die Ausgabe.
               Geprüft wird auf das FELD und nicht auf den Ereignistyp: manche
               Vermittler lassen `type` weg, die Zahl steht trotzdem da. */
            const start = d.message && d.message.usage;
            const ein = zahl(start && start.input_tokens);
            const aus = zahl((d.usage && d.usage.output_tokens) ??
                (start && start.output_tokens));
            if (ein === undefined && aus === undefined)
                return null;
            const erg = {};
            if (ein !== undefined)
                erg.ein = ein;
            if (aus !== undefined)
                erg.aus = aus;
            return erg;
        }
        const u = d.usage;
        if (!u || typeof u !== 'object')
            return null;
        const ein = zahl(u.prompt_tokens);
        const aus = zahl(u.completion_tokens);
        if (ein === undefined && aus === undefined)
            return null;
        const erg = {};
        if (ein !== undefined)
            erg.ein = ein;
        if (aus !== undefined)
            erg.aus = aus;
        return erg;
    };
    /**
     * Zwei Teilabrechnungen zusammenlegen.
     *
     * DER GRÖSSERE WERT GEWINNT, nicht der spätere. Anthropic schickt in
     * `message_delta` bei manchen Modellen die Eingabe ein zweites Mal — und
     * gelegentlich als 0. Ein „später gewinnt" machte aus 4000 Eingabetoken
     * stillschweigend null, und das Buch wäre danach zu niedrig statt zu hoch.
     * Falsch in die andere Richtung ist nicht besser.
     */
    const zusammen = (bisher, neu) => {
        if (!bisher)
            return neu;
        if (!neu)
            return bisher;
        const erg = {};
        const ein = Math.max(bisher.ein ?? 0, neu.ein ?? 0);
        const aus = Math.max(bisher.aus ?? 0, neu.aus ?? 0);
        if (bisher.ein !== undefined || neu.ein !== undefined)
            erg.ein = ein;
        if (bisher.aus !== undefined || neu.aus !== undefined)
            erg.aus = aus;
        return erg;
    };
    /** Taugt das Gelesene, um eine Schätzung zu ersetzen? */
    const vollstaendig = (a) => !!a && a.ein !== undefined && a.aus !== undefined;
    /**
     * Wie weit die Schätzung danebenlag, in Prozent der gezählten Menge.
     *
     * Für die Anzeige gedacht und bewusst gerundet: „22 % zu hoch" sagt einem
     * Menschen mehr als „1,2183". Ohne gezählte Menge gibt es nichts zu
     * vergleichen — dann 0, und wer 0 anzeigt, zeigt nichts an.
     */
    const abweichung = (geschaetzt, gezaehlt) => {
        if (!Number.isFinite(geschaetzt) || !Number.isFinite(gezaehlt) || gezaehlt <= 0)
            return 0;
        return Math.round(((geschaetzt - gezaehlt) / gezaehlt) * 100);
    };
    /**
     * Ein Satz für den Menschen — oder LEER, wenn es nichts zu sagen gibt.
     *
     * Leer ist der Normalfall und soll es sein: eine Zeile, die bei jeder
     * Abrechnung erscheint, wird nach dem zweiten Mal nicht mehr gelesen.
     * Gesagt wird nur, was auffällt — und auffällig ist erst ein Zehntel
     * daneben.
     */
    const satz = (geschaetzt, gezaehlt) => {
        const p = abweichung(geschaetzt, gezaehlt);
        if (Math.abs(p) < 10)
            return '';
        return p > 0
            ? 'Die Schätzung lag ' + p + ' % zu hoch.'
            : 'Die Schätzung lag ' + (-p) + ' % zu niedrig.';
    };
    return { WILL_ABRECHNUNG, willAbrechnung, ausEreignis, zusammen,
        vollstaendig, abweichung, satz };
})();
window.KiAbrechnung = KiAbrechnung;
