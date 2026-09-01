"use strict";
/* ============================================================================
 * core/jobs/zeitplan.ts — wann ein Auftrag laufen DARF
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/jobs/zeitplan.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/jobs/zeitplan.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WOFÜR ES SIE GIBT (L103 Punkt 5).
 *
 * Die Auftragsmaschine kann seit E286 lange Arbeit überleben. Was sie nicht
 * konnte, ist WARTEN WOLLEN. Ein Auftrag lief, sobald er dran war — und für
 * ein OCR über achtzig Seiten oder einen Embedding-Lauf ist „sobald er dran
 * ist" die falsche Antwort. Die richtige heisst: heute Nacht. Oder: wenn das
 * Gerät am Strom hängt. Oder: nicht über die Mobilfunkkarte.
 *
 * Hier stehen NUR die Regeln, wie in `modell.ts` nebenan. Keine Uhr, kein
 * `navigator`, keine Ablage — die Lage kommt als Zahl und als drei Wahrheits-
 * werte herein. Wer eine Regel prüfen will, die auf die echte Uhr wartet,
 * prüft sie eben nicht.
 *
 * ─── DIE WICHTIGSTE ENTSCHEIDUNG: UNBEKANNT HEISST JA ────────────────────────
 *
 * `navigator.getBattery()` gibt es in Firefox und Safari nicht.
 * `navigator.connection` gibt es in Safari und Firefox nicht. Auf genau
 * diesen Geräten wüsste Redion nie, ob der Strom hängt oder die Verbindung
 * kostet.
 *
 * Ein Auftrag, der auf eine Auskunft wartet, die nie kommt, läuft NIE. E323
 * hat denselben Satz schon für `navigator.locks` geschrieben, und er gilt
 * hier genauso: doppelte Last ist unschön, ein Auftrag, der nie läuft, ist
 * Datenverlust auf Raten.
 *
 * Also: `null` heisst JA. Und der Grundsatz steht nicht nur hier, sondern
 * auch in dem Satz, den der Mensch liest — wer „nur am Strom" einschaltet
 * und es passiert nichts dergleichen, soll erfahren, warum.
 *
 * ─── WARUM „NUR IM WLAN" HIER NICHT SO HEISST ───────────────────────────────
 *
 * `navigator.connection.type === 'wifi'` gibt es fast nirgends. Was messbar
 * ist, sind zwei andere Dinge: `saveData` (der Mensch hat den Datensparmodus
 * eingeschaltet) und `type === 'cellular'`.
 *
 * `effectiveType` wäre die dritte Versuchung und ist eine Falle: sie misst
 * GESCHWINDIGKEIT, nicht KOSTEN. Ein langsames WLAN im Keller sähe damit aus
 * wie ein Mobilfunkvertrag, und der Auftrag wartete auf etwas, das nie
 * eintritt. Die Bedingung heisst deshalb, was sie misst: nicht über eine
 * TEURE Verbindung.
 * ==========================================================================*/
const Zeitplan = (() => {
    const MINUTEN_AM_TAG = 24 * 60;
    const ganzeMinute = (wert) => {
        const n = Number(wert);
        if (!Number.isFinite(n))
            return null;
        const m = Math.floor(n);
        if (m < 0 || m >= MINUTEN_AM_TAG)
            return null;
        return m;
    };
    /** „22:00" aus 1320. Leer, wenn die Zahl keine Tagesminute ist. */
    const uhr = (minute) => {
        const m = ganzeMinute(minute);
        if (m === null)
            return '';
        return String(Math.floor(m / 60)).padStart(2, '0') + ':' +
            String(m % 60).padStart(2, '0');
    };
    /**
     * Liegt `minute` im Fenster von…bis?
     *
     * ÜBER MITTERNACHT ist der eigentliche Fall. 22:00 bis 06:00 ist das
     * Fenster, das jemand meint, wenn er „nachts" sagt, und es ist genau das,
     * bei dem `von <= minute && minute < bis` falsch antwortet. Also zwei
     * Lesarten, und welche gilt, entscheidet die Reihenfolge der beiden Werte.
     *
     * Das Ende ist AUSSCHLIESSEND: 22:00–06:00 endet um 05:59, nicht um 06:00.
     * Sonst gehörte die Minute 06:00 gleichzeitig zum Fenster 22–06 und zum
     * Fenster 06–08.
     */
    const imFenster = (von, bis, minute) => {
        const a = ganzeMinute(von), b = ganzeMinute(bis), m = ganzeMinute(minute);
        if (a === null || b === null || m === null)
            return true;
        /* GLEICH HEISST KEIN FENSTER, und das ist eine Entscheidung, keine
           Nachlässigkeit: „von 22:00 bis 22:00" liesse sich als null Minuten
           lesen (der Auftrag läuft nie) oder als volle 24 Stunden (er läuft
           immer). Beides ist vertretbar — und weil es das ist, darf man nicht
           raten. Ein Auftrag, der nie läuft, ist der teurere Irrtum (§46), also
           gilt die harmlose Lesart. `satz()` sagt es dem Menschen dazu. */
        if (a === b)
            return true;
        if (a < b)
            return m >= a && m < b;
        /* Über Mitternacht: alles ab `von` ODER alles vor `bis`. */
        return m >= a || m < b;
    };
    /** Wünscht sich dieser Auftrag überhaupt etwas? */
    const hatBedingung = (b) => {
        if (!b || typeof b !== 'object')
            return false;
        const x = b;
        if (x.amStrom === true || x.nichtTeuer === true)
            return true;
        const a = ganzeMinute(x.vonMinute), z = ganzeMinute(x.bisMinute);
        return a !== null && z !== null && a !== z;
    };
    /**
     * Darf dieser Auftrag JETZT laufen — und wenn nein, warum nicht?
     *
     * Der Grund ist ein ganzer Satz für einen Menschen, kein Bezeichner. Er
     * landet im Auftragsfenster (E322), und dort ist er der Unterschied
     * zwischen „wartet" (wartet worauf?) und einer Auskunft.
     *
     * OHNE BEDINGUNG IST ER LEER. Das ist die Gegenprobe zu sich selbst: ein
     * Grund, der immer dasteht, wird nicht gelesen — dieselbe Falle, in die
     * E284, E286, E288, E289 und E290 gelaufen sind.
     */
    const darf = (b, lage) => {
        if (!hatBedingung(b))
            return { ok: true, grund: '' };
        const x = b;
        const von = ganzeMinute(x.vonMinute), bis = ganzeMinute(x.bisMinute);
        if (von !== null && bis !== null && von !== bis &&
            !imFenster(von, bis, lage.minute)) {
            /* „läuft erst …" und nicht „wartet auf …": im Fenster steht der Satz
               dort, wo sonst das blosse Wort „wartet" steht — „wartet wartet auf"
               wäre doppelt. Und er beantwortet die Frage, die man wirklich hat. */
            return { ok: false,
                grund: 'läuft erst zwischen ' + uhr(von) + ' und ' + uhr(bis) };
        }
        /* `=== false` und nicht `!lage.laedt`: `null` heisst unbekannt und
           erlaubt (siehe Kopf). `!null` wäre `true` und hielte den Auftrag auf
           jedem Firefox für immer an. */
        if (x.amStrom === true && lage.laedt === false) {
            return { ok: false, grund: 'läuft erst, wenn das Gerät am Strom hängt' };
        }
        if (x.nichtTeuer === true && lage.teuer === true) {
            return { ok: false, grund: 'läuft erst über eine Verbindung, die nichts kostet' };
        }
        return { ok: true, grund: '' };
    };
    /**
     * Was sich dieser Auftrag wünscht, als Satz.
     *
     * Für die Einstellungen und für das Fenster, SOLANGE er läuft — dann ist
     * `darf().grund` leer und trotzdem soll erkennbar sein, dass er eine
     * Bedingung hat. Ohne Bedingung: leer.
     */
    const satz = (b) => {
        if (!hatBedingung(b))
            return '';
        const x = b;
        const teile = [];
        const von = ganzeMinute(x.vonMinute), bis = ganzeMinute(x.bisMinute);
        /* „von … bis …" und nicht „zwischen … und …": mit zwei Wünschen stünde
           sonst „zwischen 22:00 und 06:00 und nur am Strom" da — zwei „und" in
           einer Zeile, die Verschiedenes trennen. Auf dem Bild gesehen (§55.1),
           nicht in einer Prüfung. */
        if (von !== null && bis !== null && von !== bis) {
            teile.push('von ' + uhr(von) + ' bis ' + uhr(bis));
        }
        if (x.amStrom === true)
            teile.push('nur am Strom');
        if (x.nichtTeuer === true)
            teile.push('nicht über eine teure Verbindung');
        if (teile.length < 2)
            return teile[0] || '';
        return teile.slice(0, -1).join(', ') + ' und ' + teile[teile.length - 1];
    };
    /**
     * Aus einer Bedingung das machen, was gespeichert wird.
     *
     * Rohes Zeug kommt aus den Einstellungen und aus alten Sicherungen. Was
     * hier herausfällt, ist entweder eine saubere Bedingung oder `null` —
     * und `null` heisst „keine", nicht „kaputte". Ein Auftrag mit einer
     * unlesbaren Bedingung soll laufen, nicht liegenbleiben (§46).
     */
    const sauber = (roh) => {
        if (!roh || typeof roh !== 'object')
            return null;
        const x = roh;
        const aus = {};
        const von = ganzeMinute(x.vonMinute), bis = ganzeMinute(x.bisMinute);
        if (von !== null && bis !== null && von !== bis) {
            aus.vonMinute = von;
            aus.bisMinute = bis;
        }
        if (x.amStrom === true)
            aus.amStrom = true;
        if (x.nichtTeuer === true)
            aus.nichtTeuer = true;
        return hatBedingung(aus) ? aus : null;
    };
    return { darf, imFenster, hatBedingung, satz, uhr, sauber, MINUTEN_AM_TAG };
})();
window.Zeitplan = Zeitplan;
