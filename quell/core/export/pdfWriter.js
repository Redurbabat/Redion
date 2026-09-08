"use strict";
/* ============================================================================
 * core/export/pdfWriter.ts — ein PDF aus fertigen Seitenbildern schreiben
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/export/pdfWriter.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/export/pdfWriter.js`.
 * ----------------------------------------------------------------------------
 * WOZU (L133, E488). „Ganzes Dokument als PDF mit Marken" war der letzte
 * Punkt unter „Import und Export", und die Lücke sagte dazu: „braucht einen
 * PDF-Schreiber". Hier ist er.
 *
 * WARUM SELBST GESCHRIEBEN. Eine Bibliothek dafür wiegt ein Vielfaches der
 * hundertfünfzig Zeilen, die es braucht, und sie käme als Abhängigkeit in
 * eine App, die per Doppelklick startet (§6, §47). Redion schreibt seinen
 * ZIP-Container aus demselben Grund selbst (E38).
 *
 * WAS ER KANN, UND WAS NICHT. Er setzt fertige BILDER auf Seiten — je Seite
 * eines. Kein Text, keine Schriften, keine Vektoren: das PDF ist die
 * Abbildung dessen, was auf dem Bildschirm steht, mit allen Marken darauf.
 * Der Text der ursprünglichen PDF ist darin nicht mehr durchsuchbar. Das
 * ist eine echte Grenze und steht in `LUECKEN.md`; wer den Text braucht,
 * behält das Original — Redion fasst es ohnehin nie an (E106).
 *
 * WIE ER MIT DEM SPEICHER UMGEHT (§9, §36). Die Bildbytes werden NIE
 * gelesen. Sie kommen als `Blob` herein, und nur ihre `size` geht in die
 * Rechnung; am Ende setzt `new Blob([...])` die Teile zusammen, und der
 * Browser darf sie auf die Platte auslagern. Ein Dokument mit hundert
 * Seiten kostet damit so viel Arbeitsspeicher wie eines mit einer.
 *
 * DER AUFBAU, den er schreibt — die kleinste Form, die jeder Leser kennt:
 *
 *     %PDF-1.4
 *     1  Catalog          → Pages
 *     2  Pages            → Kids [ ... ], Count N
 *     je Seite drei Objekte:
 *       Page              → MediaBox, Resources /Im0, Contents
 *       Contents (Strom)  → „q  W 0 0 H 0 0 cm  /Im0 Do  Q"
 *       Image (Strom)     → DCTDecode, also das JPEG unverändert
 *     xref-Tabelle, trailer, startxref, %%EOF
 *
 * WARUM JPEG. `DCTDecode` nimmt die JPEG-Bytes, wie sie sind — das PDF
 * trägt die Datei unverändert. PNG bräuchte `FlateDecode` mit Prädiktoren
 * und ein Umschreiben jedes Bildes; das wäre der Punkt, an dem die Bytes
 * doch durch den Arbeitsspeicher müssten.
 * ==========================================================================*/
const PdfWriter = (() => {
    const roh = new TextEncoder();
    /**
     * Die Länge eines Teils in BYTES.
     *
     * Nicht in Zeichen: die xref-Tabelle nennt Byte-Abstände, und ein
     * einziges falsch gezähltes Zeichen macht das ganze Dokument unlesbar.
     * Deshalb wird jeder Text durch `TextEncoder` geschickt, bevor er zählt.
     */
    const laenge = (teil) => teil instanceof Blob ? teil.size : teil.byteLength;
    /**
     * Ein Schreiber, dem man Seite für Seite gibt.
     *
     * Der Weg über einen Bau statt einer einzigen Funktion ist Absicht: die
     * Seitenbilder entstehen nacheinander und asynchron (jedes ist eine
     * Leinwand, ein `toBlob` und womöglich ein Bild aus der Ablage). Wer erst
     * alle sammeln müsste, hielte sie auch alle gleichzeitig.
     */
    const neu = () => {
        const teile = [];
        /* Die Stelle jedes Objekts im fertigen Strom — `stellen[n]` gehört zum
           Objekt mit der Nummer n.
    
           DREI PLÄTZE STEHEN VORNE FEST, und das ist keine Zierde:
             0  gibt es nicht — PDF zählt ab 1, die Null ist der Kopf der
                freien Liste in der xref-Tabelle.
             1  der Katalog, 2 der Seitenbaum. Beide werden erst am ENDE
                geschrieben (sie brauchen die Nummern aller Seiten), aber ihre
                Nummern müssen von Anfang an vergeben sein: jede Seite zeigt
                mit „/Parent 2 0 R" auf den Baum.
    
           Ohne diese Reservierung bekam das erste Bild die Nummer 1 — und der
           Katalog überschrieb es am Ende. `test460` hat es gefunden: das PDF
           ging auf, die Seitenmasse stimmten, und das Bild fehlte, weil
           „/Im0 1 0 R" auf den Katalog zeigte. Ein Fehler, den nur das
           Zurücklesen sieht (§13). */
        const stellen = [0, 0, 0];
        let bisher = 0;
        let fertig = false;
        const seitenObjekte = [];
        const dazu = (teil) => { teile.push(teil); bisher += laenge(teil); };
        const text = (s) => dazu(roh.encode(s));
        /** Ein Objekt anfangen: Nummer vergeben, Stelle merken, Kopf schreiben. */
        const objekt = () => {
            const nr = stellen.length;
            stellen.push(bisher);
            text(nr + ' 0 obj\n');
            return nr;
        };
        const objektEnde = () => { text('endobj\n'); };
        text('%PDF-1.4\n');
        /* Vier Bytes über 127 gleich hinter dem Kopf. Der Kommentar sagt jedem
           Werkzeug, das die Datei weiterreicht: das hier ist BINÄR, nicht Text.
           Ohne ihn machen manche Übertragungswege aus \r\n ein \n und zerlegen
           die Bilder. Er steht so in der PDF-Spezifikation. */
        dazu(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
        /**
         * Eine Seite anhängen.
         *
         * Gibt `false` zurück, wenn das Bild leer ist oder die Masse unsinnig
         * sind — statt eine Seite zu schreiben, die kein Leser öffnen kann.
         */
        const seite = (auftrag) => {
            if (fertig)
                return false;
            const { bild, pixelBreite, pixelHoehe } = auftrag;
            const breite = Math.round(auftrag.breite), hoehe = Math.round(auftrag.hoehe);
            if (!(bild instanceof Blob) || bild.size < 1)
                return false;
            if (!(pixelBreite > 0) || !(pixelHoehe > 0) || !(breite > 0) || !(hoehe > 0))
                return false;
            /* DAS BILD. `DCTDecode` heisst: die folgenden Bytes SIND ein JPEG.
               `/ColorSpace /DeviceRGB` stimmt für alles, was eine Leinwand
               ausgibt; ein Graustufen-JPEG von aussen wäre hier falsch, und
               genau deshalb nimmt dieser Schreiber nur, was Redion selbst malt. */
            const bildNr = objekt();
            text('<< /Type /XObject /Subtype /Image /Width ' + Math.round(pixelBreite) +
                ' /Height ' + Math.round(pixelHoehe) +
                ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' +
                bild.size + ' >>\nstream\n');
            dazu(bild);
            text('\nendstream\n');
            objektEnde();
            /* DER INHALT DER SEITE: das Bild einmal, auf die ganze Seite gelegt.
               `cm` setzt die Matrix — Breite, 0, 0, Höhe, x, y —, `Do` zeichnet.
               `q`/`Q` klammern das ein, damit nichts davon nach aussen wirkt. */
            const strom = 'q\n' + breite + ' 0 0 ' + hoehe + ' 0 0 cm\n/Im0 Do\nQ\n';
            const stromBytes = roh.encode(strom);
            const inhaltNr = objekt();
            text('<< /Length ' + stromBytes.byteLength + ' >>\nstream\n');
            dazu(stromBytes);
            text('endstream\n');
            objektEnde();
            /* ══ DIE ANNOTATIONEN (E506) ══════════════════════════════════════
               Je Marke ein Aussehen (Form-XObject) und eine Ink-Annotation. Sie
               werden VOR der Seite geschrieben, weil die Seite ihre Nummern
               braucht — dasselbe Muster wie beim Bild darüber. */
            const annots = [];
            for (const marke of (auftrag.marken || [])) {
                const nr = annotation(marke, hoehe);
                if (nr)
                    annots.push(nr);
            }
            const seitenNr = objekt();
            text('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + breite + ' ' + hoehe + '] ' +
                '/Resources << /XObject << /Im0 ' + bildNr + ' 0 R >> /ProcSet [/PDF /ImageC] >> ' +
                '/Contents ' + inhaltNr + ' 0 R' +
                (annots.length ? ' /Annots [' + annots.map(n => n + ' 0 R').join(' ') + ']' : '') +
                ' >>\n');
            objektEnde();
            seitenObjekte.push(seitenNr);
            return true;
        };
        /* ── EINE ZAHL, WIE PDF SIE MAG ──────────────────────────────────────
           Zwei Nachkommastellen, kein Exponent, kein `-0`. `String(0.1+0.2)`
           gibt `0.30000000000000004`, und dreissig solcher Zahlen je Strich
           machen aus einem Kilobyte zwanzig. */
        const z = (v) => {
            const n = Math.round((Number(v) || 0) * 100) / 100;
            return Object.is(n, -0) ? '0' : String(n);
        };
        /** Ein Punkt der SEITE (y nach unten) in den Default User Space (y nach oben). */
        const hoch = (q, hoehe) => [q[0], hoehe - q[1]];
        /**
         * Eine Marke als `/Ink`-Annotation mit eigenem Erscheinungsbild.
         *
         * DAS AUSSEHEN IST EIN FORM-XOBJECT, dessen `/BBox` GENAU dem `/Rect`
         * der Annotation entspricht. Dann ist die Abbildung von Formraum auf
         * Annotationsraum die Einheitsmatrix, und man darf im Strom mit den
         * echten Seitenkoordinaten rechnen. Jede andere Wahl braucht eine
         * `/Matrix` und wird beim ersten Verschieben der Annotation krumm.
         *
         * Gibt `0` zurück, wenn nichts zu zeichnen ist — dann steht auch keine
         * leere Annotation in der Seite.
         */
        const annotation = (marke, hoehe) => {
            const striche = (marke.striche || []).filter(s => Array.isArray(s) && s.length >= 2);
            if (!striche.length)
                return 0;
            const breite = Math.max(0.1, Number(marke.breite) || 1);
            const deck = Math.max(0, Math.min(1, marke.deckkraft === undefined ? 1 : marke.deckkraft));
            const [r, g, b] = marke.farbe;
            /* Der Kasten: alles, was gezeichnet wird, plus die halbe Breite —
               eine Annotation, deren `/Rect` den eigenen Strich abschneidet,
               wird in manchen Lesern abgeschnitten gezeigt. */
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            const merken = (q) => {
                if (q[0] < x0)
                    x0 = q[0];
                if (q[0] > x1)
                    x1 = q[0];
                if (q[1] < y0)
                    y0 = q[1];
                if (q[1] > y1)
                    y1 = q[1];
            };
            striche.forEach(s => s.forEach(q => merken(hoch(q, hoehe))));
            (marke.kontur || []).forEach(k => (k || []).forEach(q => merken(hoch(q, hoehe))));
            if (!Number.isFinite(x0))
                return 0;
            const rand = breite / 2 + 1;
            x0 -= rand;
            y0 -= rand;
            x1 += rand;
            y1 += rand;
            /* DER STROM DES AUSSEHENS. Eine Kontur wird GEFUELLT (variable
               Breite, der Druck bleibt sichtbar); ein Strich ohne Kontur wird
               GESTRICHEN, mit runden Enden und Ecken. */
            let strom = 'q\n';
            if (deck < 1)
                strom += '/GS0 gs\n';
            strom += z(r) + ' ' + z(g) + ' ' + z(b) + ' rg\n'
                + z(r) + ' ' + z(g) + ' ' + z(b) + ' RG\n'
                + z(breite) + ' w 1 J 1 j\n';
            let gefuellt = false, gestrichen = false;
            striche.forEach((strich, i) => {
                const kontur = (marke.kontur || [])[i];
                const zug = (kontur && kontur.length >= 3) ? kontur : strich;
                const gefuelltJetzt = !!(kontur && kontur.length >= 3);
                const punkte = zug.map(q => hoch(q, hoehe));
                strom += z(punkte[0][0]) + ' ' + z(punkte[0][1]) + ' m\n';
                for (let k = 1; k < punkte.length; k++)
                    strom += z(punkte[k][0]) + ' ' + z(punkte[k][1]) + ' l\n';
                if (gefuelltJetzt) {
                    strom += 'h f\n';
                    gefuellt = true;
                }
                else {
                    strom += 'S\n';
                    gestrichen = true;
                }
            });
            strom += 'Q\n';
            void gefuellt;
            void gestrichen;
            const stromBytes = roh.encode(strom);
            const formNr = objekt();
            text('<< /Type /XObject /Subtype /Form /FormType 1 /BBox ['
                + z(x0) + ' ' + z(y0) + ' ' + z(x1) + ' ' + z(y1) + '] '
                + '/Resources << /ProcSet [/PDF]'
                + (deck < 1
                    ? ' /ExtGState << /GS0 << /Type /ExtGState /ca ' + z(deck)
                        + ' /CA ' + z(deck) + ' /BM /Multiply >> >>'
                    : '')
                + ' >> /Length ' + stromBytes.byteLength + ' >>\nstream\n');
            dazu(stromBytes);
            text('endstream\n');
            objektEnde();
            const listen = striche.map(s => '[' + s.map(q => {
                const h = hoch(q, hoehe);
                return z(h[0]) + ' ' + z(h[1]);
            }).join(' ') + ']').join(' ');
            const annotNr = objekt();
            /* `/F 4` ist das Druck-Kennzeichen: ohne es lassen manche Leser die
               Annotation beim Ausdrucken weg — und eine Handschrift, die auf dem
               Papier fehlt, ist der schlimmste Fall dieses ganzen Weges. */
            text('<< /Type /Annot /Subtype /Ink /F 4 '
                + '/Rect [' + z(x0) + ' ' + z(y0) + ' ' + z(x1) + ' ' + z(y1) + '] '
                + '/InkList [' + listen + '] '
                + '/C [' + z(r) + ' ' + z(g) + ' ' + z(b) + '] '
                + (deck < 1 ? '/CA ' + z(deck) + ' ' : '')
                + '/BS << /Type /Border /W ' + z(breite) + ' /S /S >> '
                + '/T (Redion) '
                + '/Contents (' + klammerFrei(marke.name || 'Handschrift') + ') '
                + '/AP << /N ' + formNr + ' 0 R >> >>\n');
            objektEnde();
            return annotNr;
        };
        /** Klammern und Backslash in einer PDF-Zeichenkette müssen entwertet
            werden — sonst endet die Zeichenkette mitten im Wort. */
        const klammerFrei = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        /**
         * Das Dokument schliessen und als Blob herausgeben.
         *
         * Katalog und Seitenbaum stehen ans ENDE, nicht an den Anfang: sie
         * brauchen die Nummern aller Seiten, und die stehen erst hier fest.
         * PDF ist es gleich, wo ein Objekt liegt — die xref-Tabelle sagt es.
         * Nur die NUMMERN 1 und 2 sind fest, weil jede Seite auf „2 0 R" zeigt.
         */
        const schliessen = () => {
            if (fertig)
                return new Blob(teile, { type: 'application/pdf' });
            fertig = true;
            /* Die zwei festen Nummern nachtragen. `stellen[1]` und `stellen[2]`
               sind noch nicht vergeben — der Katalog ist Objekt 1, der Seitenbaum
               Objekt 2, und beide werden jetzt an ihrer wirklichen Stelle
               geschrieben. */
            stellen[1] = bisher;
            text('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
            stellen[2] = bisher;
            text('2 0 obj\n<< /Type /Pages /Kids [' +
                seitenObjekte.map(n => n + ' 0 R').join(' ') +
                '] /Count ' + seitenObjekte.length + ' >>\nendobj\n');
            /* DIE XREF-TABELLE. Jede Zeile ist GENAU zwanzig Bytes lang — zehn
               Ziffern, ein Leerzeichen, fünf Ziffern, ein Leerzeichen, ein
               Buchstabe, zwei Zeichen Zeilenende. Ein Leser rechnet die Stelle
               einer Zeile aus, statt sie zu suchen; eine Zeile mit neunzehn
               Bytes verschiebt alles danach. */
            const xrefStelle = bisher;
            const anzahl = stellen.length;
            let tabelle = 'xref\n0 ' + anzahl + '\n0000000000 65535 f \n';
            for (let n = 1; n < anzahl; n++)
                tabelle += String(stellen[n] ?? 0).padStart(10, '0') + ' 00000 n \n';
            text(tabelle);
            text('trailer\n<< /Size ' + anzahl + ' /Root 1 0 R >>\nstartxref\n' + xrefStelle + '\n%%EOF\n');
            return new Blob(teile, { type: 'application/pdf' });
        };
        return { seite, schliessen, seiten: () => seitenObjekte.length };
    };
    return { neu };
})();
window.PdfWriter = PdfWriter;
