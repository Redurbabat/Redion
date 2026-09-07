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
  const rund = (n: number): number => Math.round(n * 100) / 100;

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
  const oeffne = async (
    daten: ArrayBuffer | Uint8Array,
    frage?: (nochmal: boolean) => Promise<string | null>
  ) => {
    const pdfjs = await (window as any).PdfFremd.laden();
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
      auftrag.onPassword = (weiter: (pw: string) => void, grund: number) => {
        frage(grund === 2).then(pw => {
          if (pw === null) { try { auftrag.destroy(); } catch { /* egal */ } return; }
          weiter(pw);
        });
      };
    }
    const doc = await auftrag.promise;

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
    const text = async (nr: number): Promise<string> => {
      try {
        const seite = await doc.getPage(nr);
        const inhalt = await seite.getTextContent();
        const stuecke = (inhalt.items || [])
          .map((i: any) => (typeof i.str === 'string' ? i.str : ''))
          .filter(Boolean);
        /* Zeilenenden kennt die Textebene als `hasEOL`; ohne sie klebten
           „Aufgabe 1" und „Aufgabe 2" zu „Aufgabe 1Aufgabe 2" zusammen. */
        let roh = '';
        (inhalt.items || []).forEach((i: any) => {
          if (typeof i.str === 'string') roh += i.str;
          if (i.hasEOL) roh += '\n';
        });
        if (!roh.trim()) roh = stuecke.join(' ');
        return roh.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
                  .trim().slice(0, TEXT_MAX);
      } catch {
        /* Eine Seite ohne Textebene ist ein Bild — kein Fehler, nur stumm. */
        return '';
      }
    };

    /* ══ TEXT MIT LAGE (E468) — fuer die Suche im Schreibstudio ═══════════
       Jedes Stueck der Textebene mit seinem Kasten in Blattpunkten, oben
       links wie die Marken (`convertToViewportPoint` der Sicht mit Massstab
       1 — dieselbe Grundlage wie `geometrie`, darum liegen Treffer und
       Marken im selben Raum). NICHT gespeichert: eine dichte Seite hat
       fuenfhundert Stuecke, und die stuenden in JEDER Sicherung (siehe
       TEXT_MAX oben). Gerechnet wird beim Suchen aus der Quelle, und der
       Aufrufer merkt es sich je Seite. */
    type Stueck = { s: string; x: number; y: number; w: number; h: number; eol: boolean };
    const textMitLage = async (nr: number): Promise<Stueck[]> => {
      try {
        const seite = await doc.getPage(nr);
        const sicht = seite.getViewport({ scale: 1 });
        const inhalt = await seite.getTextContent();
        const aus: Stueck[] = [];
        for (const i of (inhalt.items || []) as any[]) {
          if (typeof i.str !== 'string') continue;
          const t: number[] = Array.isArray(i.transform) ? i.transform : [1, 0, 0, 1, 0, 0];
          const h = Math.abs(Number(i.height) || Math.hypot(t[2] ?? 0, t[3] ?? 1)) || 0;
          const w = Math.abs(Number(i.width) || 0);
          /* Der Ursprung eines Stuecks ist seine Grundlinie links. */
          const [x, y] = sicht.convertToViewportPoint(t[4] ?? 0, t[5] ?? 0) as [number, number];
          aus.push({ s: i.str, x: rund(x), y: rund(y - h), w: rund(w), h: rund(h), eol: !!i.hasEOL });
        }
        return aus;
      } catch {
        return [];
      }
    };

    /* ══ DIE VERWEISE DER PDF (E468) ═══════════════════════════════════════
       Link-Anmerkungen der Seite: eine Adresse nach draussen (`url`) oder
       ein Ziel im Dokument (`seite`, 1-basiert). Kaesten in Blattpunkten.
       Was weder das eine noch das andere hat, faellt weg — ein Kasten ohne
       Ziel ist kein Verweis. Ob die Adresse harmlos ist, prueft der
       Aufrufer (§19, `Sanitize.url`); hier wird nur gelesen. */
    /** `zielY` ist der Abstand von der OBERKANTE der Zielseite in
     *  Blattpunkten — nur bei Zielen, die eine Stelle nennen (E481). */
    type Verweis = { x: number; y: number; w: number; h: number;
      url?: string; seite?: number; zielY?: number };
    const verweise = async (nr: number): Promise<Verweis[]> => {
      try {
        const seite = await doc.getPage(nr);
        const sicht = seite.getViewport({ scale: 1 });
        const liste = await seite.getAnnotations();
        const aus: Verweis[] = [];
        for (const a of (liste || []) as any[]) {
          if (!a || a.subtype !== 'Link' || !Array.isArray(a.rect) || a.rect.length < 4) continue;
          const [x1, y1] = sicht.convertToViewportPoint(a.rect[0], a.rect[1]) as [number, number];
          const [x2, y2] = sicht.convertToViewportPoint(a.rect[2], a.rect[3]) as [number, number];
          const eintrag: Verweis = { x: rund(Math.min(x1, x2)), y: rund(Math.min(y1, y2)),
            w: rund(Math.abs(x2 - x1)), h: rund(Math.abs(y2 - y1)) };
          if (typeof a.url === 'string' && a.url) eintrag.url = a.url;
          else if (a.dest) {
            const ziel = typeof a.dest === 'string' ? await doc.getDestination(a.dest) : a.dest;
            const ref = Array.isArray(ziel) ? ziel[0] : null;
            if (ref) {
              try {
                eintrag.seite = (await doc.getPageIndex(ref)) + 1;
                /* DIE STELLE AUF DER SEITE (E481). Ein PDF-Ziel nennt oft
                   nicht nur die Seite, sondern den Punkt darauf:

                     [ref, /XYZ, links, oben, zoom]   die genaue Stelle
                     [ref, /FitH, oben]               eine Hoehe
                     [ref, /FitR, l, u, r, o]         ein Rechteck

                   Bis E481 wurde davon nur die Seite genommen, und ein
                   Querverweis mitten in ein Kapitel landete an dessen
                   Anfang. Die Zahl steht im Raum der ZIELSEITE (unten
                   links, y nach oben) — gerechnet wird sie mit deren
                   eigenem Sichtfeld, nicht mit dem der Seite, auf der
                   der Verweis steht. */
                const art = ziel[1] && typeof ziel[1] === 'object' ? String(ziel[1].name || '') : '';
                const oben = art === 'XYZ' ? ziel[3]
                  : art === 'FitH' || art === 'FitBH' ? ziel[2]
                  : art === 'FitR' ? ziel[5] : null;
                if (typeof oben === 'number' && Number.isFinite(oben)) {
                  const zielSeite = await doc.getPage(eintrag.seite);
                  const zielSicht = zielSeite.getViewport({ scale: 1 });
                  const [, zy] = zielSicht.convertToViewportPoint(0, oben) as [number, number];
                  eintrag.zielY = rund(Math.max(0, zy));
                }
              } catch { /* kein Ziel */ }
            }
          }
          if (eintrag.url || eintrag.seite) aus.push(eintrag);
        }
        return aus;
      } catch {
        return [];
      }
    };

    const schliessen = () => { try { doc.destroy(); } catch { /* egal */ } };

    return { seiten: doc.numPages as number, geometrie, alsBild, text, textMitLage, verweise, schliessen };
  };

  return { oeffne, BREITE_PX, TEXT_MAX };
})();

(window as any).PdfLeser = PdfLeser;
