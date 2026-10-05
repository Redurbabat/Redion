"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/fremd/pdfjs/laden.ts (npm run bauen:ts). */
const PdfFremd = (() => {
    let versprechen = null;
    const bytes = (b64) => {
        const roh = atob(b64);
        const u = new Uint8Array(new ArrayBuffer(roh.length));
        for (let i = 0; i < roh.length; i++)
            u[i] = roh.charCodeAt(i);
        return u;
    };
    const entpacke = async (b64) => {
        const strom = new Blob([bytes(b64)]).stream()
            .pipeThrough(new DecompressionStream('gzip'));
        return new Uint8Array(await new Response(strom).arrayBuffer());
    };
    const bytesHolen = () => new Promise((ja, nein) => {
        if (typeof PDFJS_EINGEPACKT !== 'undefined') {
            ja();
            return;
        }
        if (typeof document === 'undefined') {
            nein(new Error('Die PDF-Bibliothek lässt sich hier nicht nachladen.'));
            return;
        }
        const s = document.createElement('script');
        s.src = 'quell/fremd/pdfjs/daten.js';
        s.addEventListener('load', () => {
            if (typeof PDFJS_EINGEPACKT === 'undefined') {
                nein(new Error('quell/fremd/pdfjs/daten.js wurde geladen, ist aber leer.'));
            }
            else
                ja();
        });
        s.addEventListener('error', () => nein(new Error('Die PDF-Bibliothek fehlt — quell/fremd/pdfjs/daten.js liess sich nicht laden.')));
        document.head.appendChild(s);
    });
    const laden = () => {
        if (versprechen)
            return versprechen;
        versprechen = (async () => {
            await bytesHolen();
            if (typeof PDFJS_EINGEPACKT === 'undefined')
                throw new Error('Die PDF-Bibliothek fehlt — quell/fremd/pdfjs/daten.js wird nicht geladen.');
            if (typeof DecompressionStream === 'undefined')
                throw new Error('Dieser Browser kann kein gzip auspacken — PDF-Seiten gehen hier nicht.');
            const lib = await entpacke(PDFJS_EINGEPACKT.LIB);
            const wk = await entpacke(PDFJS_EINGEPACKT.WORKER);
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
