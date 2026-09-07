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
            const seitenNr = objekt();
            text('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + breite + ' ' + hoehe + '] ' +
                '/Resources << /XObject << /Im0 ' + bildNr + ' 0 R >> /ProcSet [/PDF /ImageC] >> ' +
                '/Contents ' + inhaltNr + ' 0 R >>\n');
            objektEnde();
            seitenObjekte.push(seitenNr);
            return true;
        };
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
