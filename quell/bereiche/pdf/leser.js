"use strict";
/* ============================================================================
 * bereiche/pdf/leser.ts — die einzige Datei, die pdf.js kennt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/pdf/leser.ts`.
 * ----------------------------------------------------------------------------
 * pdf.js kommt als UMWANDLER herein, nicht als Betrachter. Ein PDF wird
 * EINMAL in Seitenbilder verwandelt; danach ist jede Seite ein Bild mit einer
 * Zeichenschicht darüber — etwas, das Redion ohne eine fremde Zeile anzeigen,
 * beschreiben, zoomen, sichern und ausgeben kann.
 *
 * WARUM DIESE STELLUNG IM ABLAUF DIE EIGENTLICHE ENTSCHEIDUNG IST. Läge die
 * Bibliothek dauerhaft im Anzeigeweg, hinge jede angesehene Seite, jede Marke
 * und jede Zoomstufe an ihr. So läuft sie einmal je Dokument — und fiele sie
 * später wieder heraus (Lizenz, Sicherheit, Grösse), funktionierten alle
 * vorhandenen Mappen weiter; nur der Import neuer PDFs bräche. Die
 * Abhängigkeit ist damit umkehrbar, und das ist bei der ersten fremden
 * Bibliothek eines Projekts mit null Laufzeitabhängigkeiten der Punkt, an
 * dem alles hängt.
 *
 * DAS ORIGINAL BLEIBT DAS ORIGINAL. Es wird als Anhang abgelegt, Byte für
 * Byte. Zurückgeschrieben wird nie — Anmerkungen liegen daneben in Redion.
 * ==========================================================================*/
const PdfLeser = (() => {
    /* Auf welche Breite eine Seite gezeichnet wird. 1654 px sind bei A4
       genau 200 dpi (1654 × 72 / 595,28) — Scan-Qualität: gut genug zum Lesen,
       zum Beschreiben und zum Hineinzoomen, klein genug, dass eine Seite nicht
       ein halbes Megabyte kostet.
       Hier stand bis E107 „rund 140 dpi". Das war schlicht falsch gerechnet,
       und die Zahl hatte sich in E103, in AUFGABEN.md und in LUECKEN.md
       fortgepflanzt, wo sie eine Lücke begründete, die es so nicht gibt. */
    const BREITE_PX = 1654;
    /* Wie viel Text je Seite höchstens mitgeschrieben wird. Siehe `text()`. */
    const TEXT_MAX = 8000;
    /** Zahl auf zwei Stellen — Punkte sind fein genug. */
    const rund = (n) => Math.round(n * 100) / 100;
    /**
     * Ein PDF öffnen. Gibt einen Griff zurück, der Seitenzahl, Geometrie und
     * Seitenbilder liefert. Der Griff hält das Dokument offen; `schliessen`
     * gibt es frei.
     */
    /**
     * Ein PDF öffnen.
     *
     * `frage` wird gerufen, wenn die Datei ein Passwort verlangt — einmal für
     * die erste Eingabe und noch einmal für jede falsche. Gibt sie `null`
     * zurück, bleibt die Datei zu.
     *
     * DAS PASSWORT WIRD NIRGENDS ABGELEGT. Es geht von der Tastatur in
     * `updatePassword` und ist danach weg: nicht in den Block, nicht in die
     * Ablage, nicht in die Sicherung. Ein Schlüssel, den man aufbewahrt,
     * schützt nichts mehr (§19, E110).
     */
    const oeffne = async (daten, frage) => {
        const pdfjs = await window.PdfFremd.laden();
        /* `isEvalSupported: false` fest verdrahtet: pdf.js wertet sonst
           Typ-4-Funktionen über `new Function` aus, und das verbietet §19. */
        const auftrag = pdfjs.getDocument({
            data: daten, isEvalSupported: false, disableAutoFetch: true
        });
        if (frage) {
            /* `grund === 2` heisst „das war falsch" — pdf.js ruft dann noch
               einmal. Ohne diese Unterscheidung fragte Redion beim zweiten Mal
               mit demselben Satz und der Mensch wüsste nicht, ob er sich vertippt
               hat oder ob gar nichts ankam. */
            auftrag.onPassword = (weiter, grund) => {
                frage(grund === 2).then(pw => {
                    if (pw === null) {
                        try {
                            auftrag.destroy();
                        }
                        catch { /* egal */ }
                        return;
                    }
                    weiter(pw);
                });
            };
        }
        const doc = await auftrag.promise;
        /** Breite, Höhe und Drehung EINER Seite, in Punkten. */
        const geometrie = async (nr) => {
            const seite = await doc.getPage(nr);
            const sicht = seite.getViewport({ scale: 1 });
            return { bw: rund(sicht.width), bh: rund(sicht.height), dreh: seite.rotate || 0 };
        };
        /**
         * Eine Seite als Bild. WebP, weil es bei Text und Linien deutlich
         * kleiner ausfällt als PNG und schärfer bleibt als JPEG.
         *
         * Die Leinwand wird danach auf 0×0 gesetzt: eine A4-Seite bei 1654 px
         * belegt rund neun Megabyte im Bildspeicher, und bei fünfzig Seiten
         * hintereinander wäre das der Grund, warum das Telefon aufgibt.
         */
        const alsBild = async (nr, breitePx = BREITE_PX) => {
            const seite = await doc.getPage(nr);
            const eins = seite.getViewport({ scale: 1 });
            const sicht = seite.getViewport({ scale: breitePx / eins.width });
            const leinwand = document.createElement('canvas');
            leinwand.width = Math.round(sicht.width);
            leinwand.height = Math.round(sicht.height);
            const stift = leinwand.getContext('2d');
            if (!stift)
                throw new Error('Der Browser gibt keine Zeichenfläche her.');
            await seite.render({ canvasContext: stift, viewport: sicht }).promise;
            const blob = await new Promise(fertig => leinwand.toBlob(b => fertig(b), 'image/webp', 0.82));
            leinwand.width = 0;
            leinwand.height = 0;
            if (!blob)
                throw new Error('Die Seite liess sich nicht in ein Bild verwandeln.');
            return blob;
        };
        /**
         * Der Text EINER Seite, wie er im PDF steht.
         *
         * DAS IST DER GRUND, WARUM pdf.js MEHR KANN ALS BILDER MALEN. Ein
         * gerastertes Seitenbild ist für die Suche stumm: darin steht nichts,
         * was sich finden liesse. Die Textebene liegt aber ohnehin im Dokument,
         * und beim Einlesen ist die Bibliothek gerade da. Danach wird sie nicht
         * mehr gebraucht — der Text steht am Block, und die Suche findet ihn
         * ohne eine fremde Zeile (E107).
         *
         * GEKÜRZT WIRD BEI 8000 ZEICHEN. Eine dicht bedruckte A4-Seite hat rund
         * 3000; 8000 lassen Luft und decken zugleich den Fall ab, dass ein
         * Dokument seinen ganzen Text in eine einzige Seite legt. Ohne Grenze
         * wäre der Bestand einer 500-Seiten-Datei um mehrere Megabyte gewachsen
         * — und die stehen, anders als die Bilder, in JEDER Sicherung.
         */
        const text = async (nr) => {
            try {
                const seite = await doc.getPage(nr);
                const inhalt = await seite.getTextContent();
                const stuecke = (inhalt.items || [])
                    .map((i) => (typeof i.str === 'string' ? i.str : ''))
                    .filter(Boolean);
                /* Zeilenenden kennt die Textebene als `hasEOL`; ohne sie klebten
                   „Aufgabe 1" und „Aufgabe 2" zu „Aufgabe 1Aufgabe 2" zusammen. */
                let roh = '';
                (inhalt.items || []).forEach((i) => {
                    if (typeof i.str === 'string')
                        roh += i.str;
                    if (i.hasEOL)
                        roh += '\n';
                });
                if (!roh.trim())
                    roh = stuecke.join(' ');
                return roh.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
                    .trim().slice(0, TEXT_MAX);
            }
            catch {
                /* Eine Seite ohne Textebene ist ein Bild — kein Fehler, nur stumm. */
                return '';
            }
        };
        const schliessen = () => { try {
            doc.destroy();
        }
        catch { /* egal */ } };
        return { seiten: doc.numPages, geometrie, alsBild, text, schliessen };
    };
    return { oeffne, BREITE_PX, TEXT_MAX };
})();
window.PdfLeser = PdfLeser;
