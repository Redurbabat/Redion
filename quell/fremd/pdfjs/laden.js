"use strict";
/* ============================================================================
 * fremd/pdfjs/laden.ts — die Bibliothek auspacken und bereitstellen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/fremd/pdfjs/laden.ts`.
 * ----------------------------------------------------------------------------
 * Diese Datei ist REDION-CODE, kein fremder. Sie liegt neben `daten.js` — dem
 * Behälter mit den eingepackten Bytes von pdf.js — und tut genau zwei Dinge:
 * auspacken und einmal merken.
 *
 * DIE TRENNUNG IST DER PUNKT. Fremde Bytes stehen in `daten.js` und in
 * `pruefungen/fremd-bestand.json`, wo sie nachgerechnet werden. Was Redion
 * selbst schreibt, steht hier — in TypeScript, mit Kommentaren, unter §54.4
 * wie jede andere Datei. Eine handgeschriebene `.js` mit fremden Bytes darin
 * wäre beides gleichzeitig und keins davon prüfbar.
 *
 * ERST BEIM GEBRAUCH. Wer nie ein PDF öffnet, soll keine 1,7 MB entpacken.
 * `laden()` tut es einmal und behält das Versprechen — nicht das Ergebnis:
 * zwei gleichzeitige Aufrufe warten dann auf dasselbe Auspacken statt es
 * zweimal zu starten.
 * ==========================================================================*/
const PdfFremd = (() => {
    let versprechen = null;
    /** Base64 zu Bytes. `atob` gibt Zeichen, kein Feld — also von Hand. */
    const bytes = (b64) => {
        const roh = atob(b64);
        const u = new Uint8Array(new ArrayBuffer(roh.length));
        for (let i = 0; i < roh.length; i++)
            u[i] = roh.charCodeAt(i);
        return u;
    };
    /** Ein gzip-Paket auspacken — dieselbe Technik, mit der Redion ZIP liest. */
    const entpacke = async (b64) => {
        const strom = new Blob([bytes(b64)]).stream()
            .pipeThrough(new DecompressionStream('gzip'));
        return new Uint8Array(await new Response(strom).arrayBuffer());
    };
    /** Einmal auspacken, dann behalten. Gibt das pdf.js-Modul zurück. */
    const laden = () => {
        if (versprechen)
            return versprechen;
        versprechen = (async () => {
            if (typeof PDFJS_EINGEPACKT === 'undefined')
                throw new Error('Die PDF-Bibliothek fehlt — quell/fremd/pdfjs/daten.js wird nicht geladen.');
            if (typeof DecompressionStream === 'undefined')
                throw new Error('Dieser Browser kann kein gzip auspacken — PDF-Seiten gehen hier nicht.');
            const lib = await entpacke(PDFJS_EINGEPACKT.LIB);
            const wk = await entpacke(PDFJS_EINGEPACKT.WORKER);
            /* Blob-Adressen statt Dateien: nur so läuft es auch in der
               Einzeldatei über `file://`, wo es kein Verzeichnis gibt. */
            const libUrl = URL.createObjectURL(new Blob([lib], { type: 'text/javascript' }));
            const wkUrl = URL.createObjectURL(new Blob([wk], { type: 'text/javascript' }));
            const modul = await import(libUrl);
            modul.GlobalWorkerOptions.workerSrc = wkUrl;
            return modul;
        })();
        return versprechen;
    };
    return { laden, entpacke, bytes };
})();
window.PdfFremd = PdfFremd;
