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
  /* Auf welche Breite eine Seite gezeichnet wird. 1654 px sind bei A4 rund
     140 dpi: gut genug zum Lesen und Beschreiben, klein genug, dass eine
     Seite nicht ein halbes Megabyte kostet. */
  const BREITE_PX = 1654;

  /** Zahl auf zwei Stellen — Punkte sind fein genug. */
  const rund = (n: number): number => Math.round(n * 100) / 100;

  /**
   * Ein PDF öffnen. Gibt einen Griff zurück, der Seitenzahl, Geometrie und
   * Seitenbilder liefert. Der Griff hält das Dokument offen; `schliessen`
   * gibt es frei.
   */
  const oeffne = async (daten: ArrayBuffer | Uint8Array) => {
    const pdfjs = await (window as any).PdfFremd.laden();
    /* `isEvalSupported: false` fest verdrahtet: pdf.js wertet sonst
       Typ-4-Funktionen über `new Function` aus, und das verbietet §19. */
    const doc = await pdfjs.getDocument({
      data: daten, isEvalSupported: false, disableAutoFetch: true
    }).promise;

    /** Breite, Höhe und Drehung EINER Seite, in Punkten. */
    const geometrie = async (nr: number) => {
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
    const alsBild = async (nr: number, breitePx = BREITE_PX): Promise<Blob> => {
      const seite = await doc.getPage(nr);
      const eins = seite.getViewport({ scale: 1 });
      const sicht = seite.getViewport({ scale: breitePx / eins.width });
      const leinwand = document.createElement('canvas');
      leinwand.width = Math.round(sicht.width);
      leinwand.height = Math.round(sicht.height);
      const stift = leinwand.getContext('2d');
      if (!stift) throw new Error('Der Browser gibt keine Zeichenfläche her.');
      await seite.render({ canvasContext: stift, viewport: sicht }).promise;
      const blob: Blob | null = await new Promise(fertig =>
        leinwand.toBlob(b => fertig(b), 'image/webp', 0.82));
      leinwand.width = 0; leinwand.height = 0;
      if (!blob) throw new Error('Die Seite liess sich nicht in ein Bild verwandeln.');
      return blob;
    };

    const schliessen = () => { try { doc.destroy(); } catch { /* egal */ } };

    return { seiten: doc.numPages as number, geometrie, alsBild, schliessen };
  };

  return { oeffne, BREITE_PX };
})();

(window as any).PdfLeser = PdfLeser;
