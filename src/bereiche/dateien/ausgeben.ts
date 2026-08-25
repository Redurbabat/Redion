/* ============================================================================
 * austausch.js — Word, Excel und fremde Werkzeuge
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/dateien/ausgeben.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/dateien/ausgeben.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notion gibt Seiten als PDF, HTML, Markdown und CSV aus — Word und Excel
 * fehlen, und beim Einlesen kennt es nur eine Handvoll Quellen.
 *
 * Hier steht beides:
 *
 *   AUSGEBEN  · .docx — eine echte Word-Datei, ohne fremde Pakete
 *             · .xlsx — eine echte Excel-Mappe, eine Tabelle je Ansicht
 *
 *   EINLESEN  · Asana (CSV)        — Abschnitte werden Status, Notizen Seiten
 *   EINLESEN  · Apple Notes (Ordner)— je HTML-Datei eine Seite, Ordner bleiben
 *   EINLESEN  · Trello (JSON)      — Listen werden Status, Karten Zeilen
 *             · Evernote (.enex)   — jede Notiz eine Seite
 *             · Obsidian (Ordner)  — [[Wikilinks]] werden echte Verweise
 *             · Notion-Export (ZIP)— Markdown und CSV daraus
 *             · Asana / Jira (CSV) — über die vorhandene CSV-Einleseroutine
 *
 * Word- und Excel-Dateien sind ZIP-Archive mit XML darin. Zum Schreiben
 * braucht es nur einen einfachen ZIP-Packer — der steht ganz oben.
 * ==========================================================================*/

const Austausch = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: string) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  /* ========================================================================
   * 1. ZIP SCHREIBEN
   * ------------------------------------------------------------------------
   * Ohne Komprimierung (Methode 0). Word und Excel lesen das anstandslos,
   * und der Code bleibt kurz genug, um ihn zu überblicken.
   * ======================================================================*/
  let crcTafel: any = null;
  const crc32 = (daten: any) => {
    if (!crcTafel) {
      crcTafel = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        crcTafel[n] = c >>> 0;
      }
    }
    let c = 0xFFFFFFFF;
    for (let i = 0; i < daten.length; i++) c = crcTafel[(c ^ daten[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  };

  /**
   * Dieselbe Prüfsumme, aber häppchenweise — für einen Blob, der nicht in den
   * Arbeitsspeicher passt.
   *
   * WARUM ES DAS BRAUCHT. `crc32` will alle Bytes auf einmal. Bei einem Video
   * von 500 MB heisst das 500 MB im Arbeitsspeicher, nur um eine Zahl
   * auszurechnen — auf einem Telefon der sichere Absturz. Ein Blob liegt beim
   * Browser auf der Platte; wer ihn scheibchenweise liest, braucht nie mehr
   * als eine Scheibe.
   *
   * Die Prüfsumme ist ihrer Natur nach fortlaufend, das kommt uns entgegen:
   * Byte für Byte, ohne zu wissen, wie viele noch kommen.
   */
  const SCHEIBE = 1024 * 1024;
  const crc32Strom = async (blob: any, beiFortschritt: any) => {
    if (!crcTafel) crc32(new Uint8Array(0));       /* Tafel einmal bauen */
    let c = 0xFFFFFFFF;
    for (let von = 0; von < blob.size; von += SCHEIBE) {
      const bis = Math.min(von + SCHEIBE, blob.size);
      const teil = new Uint8Array(await blob.slice(von, bis).arrayBuffer());
      for (let i = 0; i < teil.length; i++)
        c = (crcTafel[(c ^ (teil[i] ?? 0)) & 0xFF] ?? 0) ^ (c >>> 8);
      if (beiFortschritt) beiFortschritt(bis / blob.size);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  };

  /* ------------------------------------------------------------------------
   * DIE DREI GRENZEN — und warum sie seit dem 6. August keine mehr sind
   * ------------------------------------------------------------------------
   * Ein ZIP der alten Bauart zählt Grössen und Versätze in 32 Bit, die Zahl
   * der Einträge sogar nur in 16:
   *
   *     eine einzelne Datei     4 GB        (32 Bit)
   *     das ganze Archiv        4 GB        (32 Bit)
   *     die Anzahl der Einträge 65 535      (16 Bit)
   *
   * Bis heute brach der Packer an allen dreien ehrlich ab. Das war richtig
   * gegenüber der Alternative — ein Archiv zu schreiben, das erst beim
   * Auspacken auffällt —, aber es war keine Sicherung. Und die Meldung riet
   * „sichere die Anhänge in zwei Schritten", während es diesen zweiten
   * Schritt in Redion gar nicht gibt: jeder Weg mündet in dasselbe eine
   * Archiv mit allen Anhängen. Wer 5 GB Fotos hatte, konnte nicht sichern.
   *
   * Deshalb jetzt ZIP64 (E39). Es ist kein grösseres Feld, sondern ein
   * Zusatz: an den Stellen, die überlaufen, steht der Platzhalter
   * 0xFFFFFFFF, und die echte Zahl liegt in 64 Bit daneben.
   *
   * NUR WENN NÖTIG. Ein Archiv unter den Grenzen wird byteweise geschrieben
   * wie bisher — sonst könnte eine ältere Redion-Fassung die neuen
   * Sicherungen nicht mehr lesen, und alte Werkzeuge auch nicht. Die
   * Referenz macht es genauso: Pythons `zipfile` setzt die Platzhalter
   * einzeln, dort wo sie gebraucht werden, und sonst nirgends.
   * ----------------------------------------------------------------------*/
  const ZIP_GRENZE = 0xFFFFFFFF;
  const ZIP_EINTRAEGE = 65535;

  /* DIE SCHWELLEN SIND ABSENKBAR, und das ist kein Schlupfloch, sondern die
     einzige Art, diesen Code zu prüfen. Ein Prüflauf kann keine 4 GB
     schreiben — wohl aber dieselbe Verzweigung bei 40 Byte nehmen. Ein
     ZIP64 mit kleinen Dateien ist ein vollkommen gültiges ZIP64; `unzip`
     und Pythons `zipfile` lesen es, und genau das prüft `test103`.
     Im Betrieb bleiben die Werte, wie das Format sie vorschreibt. */
  const grenzen = { bytes: ZIP_GRENZE, eintraege: ZIP_EINTRAEGE };

  /**
   * @param dateien [{ name, inhalt }] — inhalt als Zeichenkette, Uint8Array
   *                oder **Blob**. Ein Blob wird nie ganz eingelesen: seine
   *                Prüfsumme entsteht scheibchenweise, und in das Archiv
   *                wandert er als Blob, den der Browser selbst verwaltet.
   * @param {(name:string, anteil:number)=>void} [beiFortschritt]
   * @returns {Promise<Blob>}
   */
  const zipSchreiben = async (dateien: any, beiFortschritt?: any) => {
    const enc = new TextEncoder();
    const teile = [];
    const verzeichnis = [];
    let versatz = 0;
    /* Ob dieses Archiv ZIP64 wird, entscheidet sich erst unterwegs — beim
       ersten Eintrag, der überläuft. Gemerkt wird es hier, weil der
       Schlusssatz am Ende davon abhängt. */
    let braucht64 = dateien.length > grenzen.eintraege;

    const schreibe32 = (a: any, i: number, w: any) => { a[i] = w & 255; a[i+1] = (w>>>8) & 255; a[i+2] = (w>>>16) & 255; a[i+3] = (w>>>24) & 255; };
    const schreibe16 = (a: any, i: number, w: any) => { a[i] = w & 255; a[i+1] = (w>>>8) & 255; };
    /* ACHT BYTE, UND NICHT ÜBER `>>>`. Die Bit-Schieber von JavaScript
       rechnen in 32 Bit — `4294967296 >>> 0` ist 0, nicht 2^32. Wer die
       obere Hälfte so gewinnen will, schreibt lautlos Null in genau das
       Feld, das den Überlauf abfangen soll. Deshalb geteilt, nicht
       geschoben. Bis 2^53 ist das exakt, und darüber gibt es keine Blobs. */
    const schreibe64 = (a: any, i: number, w: number) => {
      const unten = w >>> 0;
      const oben  = Math.floor(w / 4294967296);
      schreibe32(a, i, unten);
      schreibe32(a, i + 4, oben);
    };

    for (const d of dateien) {
      const name = enc.encode(d.name);
      const istBlob = typeof Blob !== 'undefined' && d.inhalt instanceof Blob;
      const inhalt = istBlob ? d.inhalt
                   : typeof d.inhalt === 'string' ? enc.encode(d.inhalt)
                   : d.inhalt;
      const laenge = istBlob ? inhalt.size : inhalt.length;

      const summe = istBlob
        ? await crc32Strom(inhalt, (a: any) => beiFortschritt && beiFortschritt(d.name, a))
        : crc32(inhalt);

      /* Drei Entscheidungen, jede für sich. Eine grosse Datei zwingt den
         lokalen Kopf ins ZIP64; ein weit hinten liegender Eintrag nur den
         Verzeichniseintrag. Beides zusammen kommt vor, keines bedingt das
         andere. */
      const grosseDatei = laenge > grenzen.bytes;
      const weitHinten  = versatz > grenzen.bytes;
      if (grosseDatei || weitHinten) braucht64 = true;

      /* Der lokale Kopf trägt sein Zusatzfeld nur wegen der GRÖSSE. Der
         Versatz steht hier gar nicht — der Kopf IST ja an dieser Stelle. */
      const lokalExtra = grosseDatei ? 20 : 0;
      const kopf = new Uint8Array(30 + name.length + lokalExtra);
      schreibe32(kopf, 0, 0x04034b50);
      schreibe16(kopf, 4, grosseDatei ? 45 : 20);  /* benötigte Fassung */
      schreibe16(kopf, 6, 0);          /* Flags             */
      schreibe16(kopf, 8, 0);          /* Methode: gespeichert */
      schreibe16(kopf, 10, 0);         /* Uhrzeit           */
      schreibe16(kopf, 12, 0x21);      /* Datum: 1. Jan 1980 */
      schreibe32(kopf, 14, summe);
      schreibe32(kopf, 18, grosseDatei ? ZIP_GRENZE : laenge);
      schreibe32(kopf, 22, grosseDatei ? ZIP_GRENZE : laenge);
      schreibe16(kopf, 26, name.length);
      schreibe16(kopf, 28, lokalExtra);
      kopf.set(name, 30);
      if (grosseDatei) {
        const e = 30 + name.length;
        schreibe16(kopf, e, 0x0001);   /* Kennung des ZIP64-Zusatzfelds */
        schreibe16(kopf, e + 2, 16);   /* zwei Zahlen zu acht Byte      */
        schreibe64(kopf, e + 4, laenge);       /* roh     */
        schreibe64(kopf, e + 12, laenge);      /* gepackt */
      }
      teile.push(kopf, inhalt);

      /* IM VERZEICHNIS STEHEN NUR DIE FELDER IM ZUSATZ, DIE ÜBERLAUFEN —
         und zwar in dieser festen Reihenfolge: roh, gepackt, Versatz. Wer
         eines davon vorsorglich mitschreibt, obwohl daneben die echte Zahl
         steht, verschiebt alle folgenden. Abgelesen an `zipfile`, nicht
         geraten: dort steht dieselbe Kette von drei `if`. */
      const zusatz: number[] = [];
      if (grosseDatei) { zusatz.push(laenge, laenge); }
      if (weitHinten)  { zusatz.push(versatz); }
      const vzExtra = zusatz.length ? 4 + 8 * zusatz.length : 0;

      const eintrag = new Uint8Array(46 + name.length + vzExtra);
      schreibe32(eintrag, 0, 0x02014b50);
      schreibe16(eintrag, 4, 20);
      schreibe16(eintrag, 6, (grosseDatei || weitHinten) ? 45 : 20);
      schreibe16(eintrag, 8, 0);
      schreibe16(eintrag, 10, 0);
      schreibe16(eintrag, 12, 0);
      schreibe16(eintrag, 14, 0x21);
      schreibe32(eintrag, 16, summe);
      schreibe32(eintrag, 20, grosseDatei ? ZIP_GRENZE : laenge);
      schreibe32(eintrag, 24, grosseDatei ? ZIP_GRENZE : laenge);
      schreibe16(eintrag, 28, name.length);
      schreibe16(eintrag, 30, vzExtra);
      schreibe32(eintrag, 42, weitHinten ? ZIP_GRENZE : versatz);
      eintrag.set(name, 46);
      if (vzExtra) {
        const e = 46 + name.length;
        schreibe16(eintrag, e, 0x0001);
        schreibe16(eintrag, e + 2, 8 * zusatz.length);
        zusatz.forEach((w, k) => schreibe64(eintrag, e + 4 + 8 * k, w));
      }
      verzeichnis.push(eintrag);

      versatz += kopf.length + laenge;
    }

    const vzGroesse = verzeichnis.reduce((n, e) => n + e.length, 0);
    /* Auch der Schlusssatz zählt in 32 Bit. Liegt das Verzeichnis jenseits
       der Grenze oder ist es selbst zu gross, wird das Archiv hier ZIP64,
       selbst wenn jeder einzelne Eintrag darunter blieb. */
    if (versatz > grenzen.bytes || vzGroesse > grenzen.bytes) braucht64 = true;

    /* ------------------------------------------------------------------ *
     * DER SCHLUSS — zwei zusätzliche Sätze, wenn ZIP64 nötig ist
     * ------------------------------------------------------------------ *
     * Zuerst der ZIP64-Schlusssatz mit den echten Zahlen (56 Byte), dann
     * ein Wegweiser darauf (20 Byte), dann der alte Schlusssatz mit
     * Platzhaltern. Die Reihenfolge ist nicht frei: jeder Leser sucht
     * zuerst den alten Satz am Dateiende und findet den Wegweiser genau
     * 20 Byte davor. Anders herum wäre er unauffindbar.
     * ------------------------------------------------------------------ */
    const schluss: Uint8Array[] = [];
    if (braucht64) {
      const z64 = new Uint8Array(56);
      schreibe32(z64, 0, 0x06064b50);
      schreibe64(z64, 4, 44);          /* Grösse ab hier: 56 − 12 */
      schreibe16(z64, 12, 45);         /* erzeugt von  */
      schreibe16(z64, 14, 45);         /* benötigt     */
      schreibe32(z64, 16, 0);          /* Datenträger  */
      schreibe32(z64, 20, 0);
      schreibe64(z64, 24, dateien.length);
      schreibe64(z64, 32, dateien.length);
      schreibe64(z64, 40, vzGroesse);
      schreibe64(z64, 48, versatz);
      schluss.push(z64);

      const weg = new Uint8Array(20);
      schreibe32(weg, 0, 0x07064b50);
      schreibe32(weg, 4, 0);
      schreibe64(weg, 8, versatz + vzGroesse);   /* wo der ZIP64-Satz liegt */
      schreibe32(weg, 16, 1);
      schluss.push(weg);
    }

    /* Im alten Schlusssatz steht ab jetzt der Platzhalter, wo die echte
       Zahl nicht mehr hineinpasst — und nur dort. `Math.min` statt einer
       Fallunterscheidung: 0xFFFF ist gleichzeitig der Platzhalter UND die
       grösste Zahl, die das Feld fassen kann. Ein Archiv mit genau 65 535
       Einträgen schreibt deshalb dieselbe Zahl wie eines mit 70 000 — und
       genau darum darf ein Leser ZIP64 nie am Platzhalter erkennen,
       sondern nur am Wegweiser. */
    const ende = new Uint8Array(22);
    schreibe32(ende, 0, 0x06054b50);
    schreibe16(ende, 8,  Math.min(dateien.length, 0xFFFF));
    schreibe16(ende, 10, Math.min(dateien.length, 0xFFFF));
    schreibe32(ende, 12, Math.min(vzGroesse, ZIP_GRENZE));
    schreibe32(ende, 16, Math.min(versatz, ZIP_GRENZE));

    return new Blob([...teile, ...verzeichnis, ...schluss, ende],
                    { type: 'application/zip' });
  };

  const laden = (blob: any, name: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  };

  /* ========================================================================
   * 2. WORD SCHREIBEN
   * ======================================================================*/
  const W_STIL = {
    h1: 'Heading1', h2: 'Heading2', h3: 'Heading3',
    'toggle-h1': 'Heading1', 'toggle-h2': 'Heading2', 'toggle-h3': 'Heading3',
    quote: 'Quote', code: 'Code'
  };

  /** Ein Absatz in Word-XML. */
  const wAbsatz = (text: string, stil?: any, aufzaehlung?: any) =>
    '<w:p>' +
      '<w:pPr>' +
        (stil ? `<w:pStyle w:val="${stil}"/>` : '') +
        (aufzaehlung ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '') +
      '</w:pPr>' +
      (text ? `<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r>` : '') +
    '</w:p>';

  const wTabelle = (zeilen: any) =>
    '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/>' +
    '<w:tblW w:w="5000" w:type="pct"/><w:tblBorders>' +
    ['top','left','bottom','right','insideH','insideV'].map(s =>
      `<w:${s} w:val="single" w:sz="4" w:color="CCCCCC"/>`).join('') +
    '</w:tblBorders></w:tblPr>' +
    zeilen.map((z: any, i: any) => '<w:tr>' + z.map((c: any) =>
      '<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>' +
      `<w:p><w:pPr>${i === 0 ? '<w:rPr><w:b/></w:rPr>' : ''}</w:pPr>` +
      `<w:r>${i === 0 ? '<w:rPr><w:b/></w:rPr>' : ''}` +
      `<w:t xml:space="preserve">${esc(c)}</w:t></w:r></w:p></w:tc>`).join('') +
      '</w:tr>').join('') +
    '</w:tbl>';

  /** Alle Blöcke einer Seite als Word-Inhalt. */
  const wortInhalt = (seite: any) => {
    const raus: any[] = [];
    const lauf = (id: string, tiefe: number) => {
      Store.childrenOf(id).forEach((b: any) => {
        const t = b.text || '';
        if (b.type === 'database' && b.collectionId) {
          const c = Store.getCollection(b.collectionId);
          if (c) {
            const keys = Object.keys(c.schema);
            const kopf = keys.map(k => c.schema[k].name);
            const zeilen = Store.rowsOf(c.id).filter((r: any) => !r.archiviert).map((r: any) =>
              keys.map(k => {
                const v = Datenbank.wert(r, k, c);
                return Array.isArray(v) ? v.map(x => (x && x.name) || x).join(', ')
                                        : Formula.anzeige(v);
              }));
            raus.push(wAbsatz(c.name || 'Datenbank', 'Heading2'));
            raus.push(wTabelle([kopf, ...zeilen]));
          }
          return;
        }
        if (b.type === 'table' && b.rows) {
          raus.push(wTabelle(b.rows));
          return;
        }
        if (b.type === 'divider') { raus.push(wAbsatz('', null)); return; }
        if (b.type === 'image')   { raus.push(wAbsatz('[Bild' + (b.caption ? ': ' + b.caption : '') + ']', null)); return; }
        const stil = (W_STIL as Record<string, string>)[b.type] || null;
        const punkt = ['bullet','todo','number'].includes(b.type);
        const vorne = b.type === 'todo' ? (b.checked ? '☑ ' : '☐ ')
                    : b.type === 'number' ? '' : '';
        raus.push(wAbsatz('  '.repeat(tiefe) + vorne + t, stil, punkt));
        if (Store.childrenOf(b.id).length) lauf(b.id, tiefe + 1);
      });
    };
    lauf(seite.id, 0);
    return raus.join('');
  };

  const alsWord = async (seite: any) => {
    const inhalt =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:body>' +
        wAbsatz(seite.text || 'Ohne Titel', 'Title') +
        wortInhalt(seite) +
        '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
        '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>' +
      '</w:body></w:document>';

    const stile =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:docDefaults><w:rPrDefault><w:rPr>' +
        '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/>' +
      '</w:rPr></w:rPrDefault></w:docDefaults>' +
      [['Title', 'Titel', 56, true], ['Heading1', 'Überschrift 1', 36, true],
       ['Heading2', 'Überschrift 2', 30, true], ['Heading3', 'Überschrift 3', 26, true],
       ['Quote', 'Zitat', 22, false], ['Code', 'Code', 20, false]].map(([id, name, gr, fett]) =>
        `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/>` +
        '<w:pPr><w:spacing w:before="180" w:after="90"/>' +
        (id === 'Quote' ? '<w:ind w:left="454"/>' : '') + '</w:pPr>' +
        `<w:rPr>${fett ? '<w:b/>' : ''}<w:sz w:val="${gr}"/>` +
        (id === 'Code' ? '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>' : '') +
        (id === 'Quote' ? '<w:i/><w:color w:val="666666"/>' : '') +
        '</w:rPr></w:style>').join('') +
      '<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style>' +
      '</w:styles>';

    const nummern =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      '<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0">' +
        '<w:numFmt w:val="bullet"/><w:lvlText w:val="•"/>' +
        '<w:pPr><w:ind w:left="454" w:hanging="284"/></w:pPr>' +
      '</w:lvl></w:abstractNum>' +
      '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>';

    const dateien = [
      { name: '[Content_Types].xml', inhalt:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
        '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
        '</Types>' },
      { name: '_rels/.rels', inhalt:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
        '</Relationships>' },
      { name: 'word/_rels/document.xml.rels', inhalt:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
        '</Relationships>' },
      { name: 'word/document.xml',  inhalt },
      { name: 'word/styles.xml',    inhalt: stile },
      { name: 'word/numbering.xml', inhalt: nummern }
    ];

    const blob = await zipSchreiben(dateien);
    laden(blob, (seite.text || 'Seite').replace(/[\\/:*?"<>|]/g, '-') + '.docx');
    return blob;
  };

  /* ========================================================================
   * 3. EXCEL SCHREIBEN
   * ======================================================================*/
  const spaltenName = (n: number) => {
    let s = '';
    n++;
    while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
    return s;
  };

  /* XLSX speichert Funktionsnamen invariant auf Englisch, auch wenn Excel
     selbst sie auf Deutsch anzeigt. Redions Maschine versteht beide
     Richtungen; für den fremden Leser werden die gebräuchlichen deutschen
     Namen beim Schreiben normalisiert. Unbekannte Namen bleiben erhalten,
     zusammen mit dem berechneten Wert. */
  const EXCEL_FUNKTION: Record<string, string> = {
    summe: 'SUM', mittelwert: 'AVERAGE', wurzel: 'SQRT', rest: 'MOD',
    runden: 'ROUND', abrunden: 'ROUNDDOWN', aufrunden: 'ROUNDUP',
    produkt: 'PRODUCT', anzahl: 'COUNT', anzahl2: 'COUNTA', potenz: 'POWER',
    ganzzahl: 'INT', wenn: 'IF', wenns: 'IFS', wennfehler: 'IFERROR',
    istfehler: 'ISERROR', und: 'AND', oder: 'OR', nicht: 'NOT',
    'zählenwenn': 'COUNTIF', 'zählenwenns': 'COUNTIFS',
    summewenn: 'SUMIF', summewenns: 'SUMIFS',
    mittelwertwenn: 'AVERAGEIF', mittelwertwenns: 'AVERAGEIFS',
    sverweis: 'VLOOKUP', wverweis: 'HLOOKUP', xverweis: 'XLOOKUP'
  };

  /** Ein Zeichen nur ausserhalb von Zeichenketten austauschen. */
  const ausserhalb = (text: string, von: string, zu: string): string => {
    let raus = '', zitat = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i] ?? '';
      if (c === '"') {
        raus += c;
        if (text[i + 1] === '"') { raus += '"'; i++; }
        else zitat = !zitat;
      } else raus += (!zitat && c === von) ? zu : c;
    }
    return raus;
  };

  /** Nur die freien Teile einer Formel ändern; Text in "..." bleibt exakt. */
  const formelAussen = (text: string, aendere: (teil: string) => string): string => {
    let raus = '', frei = '', i = 0;
    const freiLeeren = () => { raus += aendere(frei); frei = ''; };
    while (i < text.length) {
      const c = text[i] ?? '';
      if (c !== '"') { frei += c; i++; continue; }
      freiLeeren();
      raus += c; i++;
      while (i < text.length) {
        const innen = text[i] ?? '';
        raus += innen; i++;
        if (innen !== '"') continue;
        if (text[i] === '"') { raus += '"'; i++; continue; }
        break;
      }
    }
    freiLeeren();
    return raus;
  };

  const formelFuerExcel = (roh: unknown): string => {
    let f = String(roh ?? '').trim().replace(/^=/, '');
    f = formelAussen(f, teil => teil.replace(
      /([A-Za-zÄÖÜäöüß][A-Za-z0-9_ÄÖÜäöüß.]*)\s*(?=\()/g,
      n => EXCEL_FUNKTION[n.toLowerCase()] || n));
    return ausserhalb(f, ';', ',');
  };

  /* ODF setzt Zellbezüge in eckige Klammern. Diese kleine Abbildung deckt
     genau das Modell ab, das Redion selbst rechnet: A1 und A1:B9. Fremde
     ODS-Sonderformen werden beim Einlesen im Verlustbericht genannt. */
  const formelFuerOds = (roh: unknown): string => {
    const marken: string[] = [];
    let f = ausserhalb(formelFuerExcel(roh), ',', ';');
    f = formelAussen(f, teil => {
      let frei = teil.replace(/(\$?[A-Z]{1,3}\$?\d+):(\$?[A-Z]{1,3}\$?\d+)/g,
        (_, a, b) => {
          marken.push(`[.${a}:.${b}]`); return `@@r${marken.length - 1}@@`;
        });
      frei = frei.replace(/\$?[A-Z]{1,3}\$?\d+/g, a => {
        marken.push(`[.${a}]`); return `@@r${marken.length - 1}@@`;
      });
      return frei;
    });
    return f.replace(/@@r(\d+)@@/g, (_, i) => marken[+i] || '');
  };

  /** Eine Tabelle als Blatt-XML. Zahlen bleiben Zahlen.
   *
   * `stilIx` ist je Zelle der Verweis in die cellXfs der styles.xml —
   * 0 heisst ungestaltet. OHNE `stilIx` gilt das alte Verhalten der
   * Datenbank-Ausgänge: Zeile 1 ist die Kopfzeile, immer Text und fett.
   * MIT `stilIx` (der Tabellenblock, E94) ist Zeile 1 gewöhnliche
   * Nutzerdaten — dort entscheidet allein der Zellstil. */
  const blattXml = (zeilen: any, stilIx?: number[][], formeln?: (string | null)[][]) =>
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetData>' +
    zeilen.map((z: any, r: any) =>
      `<row r="${r + 1}">` + z.map((c: any, s: any) => {
        const bezug = spaltenName(s) + (r + 1);
        const ix = (stilIx && stilIx[r] && stilIx[r][s]) || 0;
        const kopf = !stilIx && r === 0;
        const formel = formeln && formeln[r] && formeln[r][s];
        const zahl = typeof c === 'number'
          ? isFinite(c)
          : c !== '' && c !== null && c !== undefined && !isNaN(Number(String(c).replace(',', '.')));
        if (formel) {
          const f = esc(formelFuerExcel(formel));
          if (typeof c === 'number' && isFinite(c))
            return `<c r="${bezug}"${ix ? ` s="${ix}"` : ''}><f>${f}</f><v>${c}</v></c>`;
          if (typeof c === 'boolean')
            return `<c r="${bezug}" t="b"${ix ? ` s="${ix}"` : ''}><f>${f}</f><v>${c ? 1 : 0}</v></c>`;
          return `<c r="${bezug}" t="str"${ix ? ` s="${ix}"` : ''}><f>${f}</f><v>${esc(c)}</v></c>`;
        }
        if (!kopf && zahl) {
          const n = typeof c === 'number' ? c : Number(String(c).replace(',', '.'));
          return `<c r="${bezug}"${ix ? ` s="${ix}"` : ''}><v>${n}</v></c>`;
        }
        return `<c r="${bezug}" t="inlineStr"${kopf ? ' s="1"' : (ix ? ` s="${ix}"` : '')}>` +
               `<is><t xml:space="preserve">${esc(c)}</t></is></c>`;
      }).join('') + '</row>').join('') +
    '</sheetData></worksheet>';

  /**
   * @param blaetter [{ name, zeilen }]
   */
  /* ==========================================================================
   * ODS SCHREIBEN
   * --------------------------------------------------------------------------
   * Die Gegenrichtung zu `odsLesen`. Vier Dateien reichen für ein ODS, das
   * LibreOffice, OpenOffice, Excel und Google Sheets öffnen:
   *
   *   mimetype              muss ZUERST im Archiv stehen und UNKOMPRIMIERT
   *   META-INF/manifest.xml das Verzeichnis
   *   content.xml           die Tabellen
   *   styles.xml            leer, aber verlangt
   *
   * DIE ERSTE ZEILE IST EINE FALLE. Die Norm verlangt, dass `mimetype` der
   * erste Eintrag ist und ohne Kompression gespeichert wird — daran erkennen
   * manche Programme das Format, noch bevor sie das Verzeichnis lesen. Der
   * ZIP-Schreiber hier legt ohnehin alles „gespeichert" ab, damit ist die
   * zweite Hälfte erfüllt; die erste erledigt die Reihenfolge unten.
   *
   * ZAHLEN BLEIBEN ZAHLEN. Eine Zelle bekommt `office:value-type="float"`
   * samt `office:value`, wenn der Wert eine Zahl ist. Ohne das steht in
   * LibreOffice überall Text, die Summe ist 0 und Sortieren sortiert
   * alphabetisch — `100` vor `20`. Das war beim CSV-Import derselbe Fehler.
   * ========================================================================*/

  /* Zellstile für den ODS-Ausgang (E95) — das Gegenstück zu `stilSammlung`:
     gleiche Kombis werden je EINMAL als automatic-styles angelegt, jede
     Zelle trägt nur den Namen. Ohne Stile bleibt content.xml die alte. */
  const odsStilSammlung = (blaetter: any) => {
    const datenStile: string[] = [];
    const datenIx = new Map<string, string>();
    const zellStile: string[] = [];
    const zellIx = new Map<string, string>();

    const datenStil = (art: string, stellen: number | undefined, waehrung: string): string => {
      const key = art + '|' + (stellen ?? '') + '|' + (art === 'waehrung' ? waehrung : '');
      const da = datenIx.get(key);
      if (da) return da;
      const name = (art === 'prozent' ? 'np' : 'nw') + (datenStile.length + 1);
      if (art === 'prozent')
        datenStile.push(`<number:percentage-style style:name="${name}">` +
          `<number:number number:decimal-places="${stellen ?? 0}" number:min-integer-digits="1"/>` +
          '<number:text> %</number:text></number:percentage-style>');
      else
        datenStile.push(`<number:currency-style style:name="${name}">` +
          `<number:number number:decimal-places="${stellen ?? 2}" number:min-integer-digits="1" number:grouping="true"/>` +
          `<number:text> </number:text><number:currency-symbol>${esc(waehrung)}</number:currency-symbol>` +
          '</number:currency-style>');
      datenIx.set(key, name);
      return name;
    };

    const kombi = (stil: any): string => {
      if (!stil) return '';
      const fett = !!stil.fett, kursiv = !!stil.kursiv;
      const aus = stil.ausrichtung === 'links' ? 'start'
                : stil.ausrichtung === 'mitte' ? 'center'
                : stil.ausrichtung === 'rechts' ? 'end' : '';
      const art = (stil.format && stil.format.art) || '';
      const stellen = stil.format && typeof stil.format.stellen === 'number'
        ? stil.format.stellen : undefined;
      const waehrung = (stil.format && stil.format.waehrung) || 'CHF';
      const key = (fett ? 'f' : '') + (kursiv ? 'k' : '') + '|' + aus + '|' +
                  art + '|' + (stellen ?? '') + '|' + (art === 'waehrung' ? waehrung : '');
      if (key === '||||') return '';
      const bekannt = zellIx.get(key);
      if (bekannt) return bekannt;
      const daten = (art === 'prozent' || art === 'waehrung')
        ? datenStil(art, stellen, waehrung) : '';
      const name = 'ce' + (zellStile.length + 1);
      zellStile.push(`<style:style style:name="${name}" style:family="table-cell"` +
        (daten ? ` style:data-style-name="${daten}"` : '') + '>' +
        (fett || kursiv
          ? '<style:text-properties' + (fett ? ' fo:font-weight="bold"' : '') +
            (kursiv ? ' fo:font-style="italic"' : '') + '/>'
          : '') +
        (aus ? `<style:paragraph-properties fo:text-align="${aus}"/>` : '') +
        '</style:style>');
      zellIx.set(key, name);
      return name;
    };

    const je = (blaetter || []).map((b: any) =>
      (b.stile || []).length
        ? b.stile.map((zeile: any[]) => zeile.map((st: any) => kombi(st)))
        : null);

    const xml = (datenStile.length || zellStile.length)
      ? '<office:automatic-styles>' + datenStile.join('') + zellStile.join('') +
        '</office:automatic-styles>'
      : '';
    return { xml, je };
  };

  const odsZelle = (w: any, anzeige?: string, stilName?: string, formel?: string | null): string => {
    const stilA = stilName ? ` table:style-name="${stilName}"` : '';
    const formelA = formel ? ` table:formula="of:=${esc(formelFuerOds(formel))}"` : '';
    const leer = w === null || w === undefined || w === '';
    if (leer && !formel) return `<table:table-cell${stilA}/>`;
    const zahl = typeof w === 'number' ? (isFinite(w) ? w : null)
               : (typeof w === 'string' && w.trim() !== '' && Number.isFinite(Number(w))
                  ? Number(w) : null);
    if (zahl !== null)
      return `<table:table-cell${stilA}${formelA} office:value-type="float" office:value="${zahl}">` +
             `<text:p>${esc(String(anzeige ?? w))}</text:p></table:table-cell>`;
    return `<table:table-cell${stilA}${formelA} office:value-type="string">` +
           String(w ?? '').split('\n').map(z => `<text:p>${esc(z)}</text:p>`).join('') +
           '</table:table-cell>';
  };

  const odsBlatt = (b: any, stilJe?: (string | null)[][]): string => {
    const zeilen: any[][] = b.zeilen || [];
    const anzeigen: any[][] = b.anzeigen || [];
    const formeln: (string | null)[][] = b.formeln || [];
    const breite = zeilen.reduce((m, z) => Math.max(m, (z || []).length), 0);
    return `<table:table table:name="${esc(String(b.name || 'Blatt'))}">` +
      `<table:table-column table:number-columns-repeated="${Math.max(1, breite)}"/>` +
      zeilen.map((z, r) => '<table:table-row>' +
        Array.from({ length: breite }, (_, i) =>
          odsZelle((z || [])[i],
                   anzeigen[r] ? anzeigen[r][i] : undefined,
                   (stilJe && stilJe[r] && stilJe[r][i]) || undefined,
                   (formeln[r] && formeln[r][i]) || undefined)).join('') +
        '</table:table-row>').join('') +
      '</table:table>';
  };

  const alsOds = async (blaetter: any, dateiname?: string) => {
    const NS =
      ' xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"' +
      ' xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"' +
      ' xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"' +
      ' xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"' +
      ' xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"' +
      ' xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"';

    const stile = odsStilSammlung(blaetter);

    const dateien = [
      /* ZUERST und unkomprimiert — siehe oben. */
      { name: 'mimetype', inhalt: 'application/vnd.oasis.opendocument.spreadsheet' },
      { name: 'META-INF/manifest.xml', inhalt:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" ' +
        'manifest:version="1.2">' +
        '<manifest:file-entry manifest:full-path="/" ' +
        'manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>' +
        '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>' +
        '<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>' +
        '</manifest:manifest>' },
      { name: 'styles.xml', inhalt:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        `<office:document-styles${NS} office:version="1.2"/>` },
      { name: 'content.xml', inhalt:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        `<office:document-content${NS} office:version="1.2">` +
        stile.xml +
        '<office:body><office:spreadsheet>' +
        (blaetter || []).map((b: any, i: number) => odsBlatt(b, stile.je[i] || undefined)).join('') +
        '</office:spreadsheet></office:body></office:document-content>' }
    ];

    const blob = await zipSchreiben(dateien);
    laden(blob, (dateiname || 'Redion') + '.ods');
    return blob;
  };

  /**
   * Eine Datenbank als ODS — ein Blatt je Ansicht, wie bei Excel.
   *
   * DIE ZELLEN WERDEN GENAUSO GELESEN WIE DORT. Der erste Versuch hatte
   * hier `Werkzeuge.zelleAlsText` stehen — eine Funktion, die es nicht
   * gibt. Der Übersetzer hat es gemeldet, bevor irgendetwas lief; ohne ihn
   * wäre jede Zelle „undefined" gewesen und die Datei sähe trotzdem
   * vollständig aus.
   */
  const datenbankAlsOds = (coll: any) => {
    const ansichten = Object.values<any>(Store.cache.views).filter(v => v.collectionId === coll.id);
    const keys = Object.keys(coll.schema);
    const kopf = keys.map(k => coll.schema[k].name);
    const zeilenVon = (view: any) => {
      const rows = view ? Datenbank.zeilen(coll, view) : Store.rowsOf(coll.id);
      return rows.map((r: any) => keys.map(k => {
        const v = Datenbank.wert(r, k, coll);
        if (Array.isArray(v)) return v.map(x => (x && x.name) || x).join(', ');
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        return v === null || v === undefined ? '' : String(Formula.anzeige(v));
      }));
    };
    const blaetter = ansichten.length
      ? ansichten.map(v => ({ name: v.name || 'Ansicht', zeilen: [kopf, ...zeilenVon(v)] }))
      : [{ name: coll.name, zeilen: [kopf, ...zeilenVon(null)] }];
    return alsOds(blaetter, (coll.name || 'Datenbank').replace(/[\\/:*?"<>|]/g, '-'));
  };

  /* Aus den Zellstilen aller Blätter eine styles.xml bauen (E94). Gleiche
     Kombis (fett/kursiv × Ausrichtung × Zahlenformat) werden je EINMAL
     angelegt; jede Zelle bekommt nur den Verweis. Ohne Stile entsteht
     byte-gleich die alte Datei: zwei Schriften, zwei Verweise, Kopf fett. */
  const stilSammlung = (blaetter: any) => {
    const fonts = ['<font><sz val="11"/><name val="Calibri"/></font>',
                   '<font><b/><sz val="11"/><name val="Calibri"/></font>'];
    const fontIx = new Map<string, number>([['', 0], ['f', 1]]);
    const numFmts: string[] = [];
    const fmtIx = new Map<string, number>();
    const xfs = ['<xf xfId="0"/>', '<xf fontId="1" applyFont="1" xfId="0"/>'];
    const xfIx = new Map<string, number>();
    let naechsteFmtId = 164;             /* ab hier beginnen eigene Formate */

    const kombi = (stil: any): number => {
      if (!stil) return 0;
      const fett = !!stil.fett, kursiv = !!stil.kursiv;
      const aus = stil.ausrichtung === 'links' ? 'left'
                : stil.ausrichtung === 'mitte' ? 'center'
                : stil.ausrichtung === 'rechts' ? 'right' : '';
      const art = (stil.format && stil.format.art) || '';
      const stellen = stil.format && typeof stil.format.stellen === 'number'
        ? stil.format.stellen : undefined;
      const waehrung = (stil.format && stil.format.waehrung) || 'CHF';
      const key = (fett ? 'f' : '') + (kursiv ? 'k' : '') + '|' + aus + '|' +
                  art + '|' + (stellen ?? '') + '|' + (art === 'waehrung' ? waehrung : '');
      if (key === '||||') return 0;
      const bekannt = xfIx.get(key);
      if (bekannt !== undefined) return bekannt;

      const fKey = (fett ? 'f' : '') + (kursiv ? 'k' : '');
      let fId = fontIx.get(fKey);
      if (fId === undefined) {
        fId = fonts.length;
        fonts.push('<font>' + (fett ? '<b/>' : '') + (kursiv ? '<i/>' : '') +
                   '<sz val="11"/><name val="Calibri"/></font>');
        fontIx.set(fKey, fId);
      }

      let fmtId = 0;
      if (art === 'prozent' || art === 'waehrung') {
        /* Die Prozent-Semantik passt: Redion speichert 0.15 und ZEIGT
           „15 %" — genau Excels 0%. Beim Geld gehört der Name in
           Anführungszeichen, sonst liest Excel das C von CHF als Datum. */
        const code = art === 'prozent'
          ? (stellen ? '0.' + '0'.repeat(stellen) + '%' : '0%')
          : '#,##0' + (stellen === 0 ? '' : '.' + '0'.repeat(stellen ?? 2)) +
            '\\ "' + waehrung + '"';
        let id = fmtIx.get(code);
        if (id === undefined) {
          id = naechsteFmtId++;
          numFmts.push(`<numFmt numFmtId="${id}" formatCode="${esc(code)}"/>`);
          fmtIx.set(code, id);
        }
        fmtId = id;
      }

      const ix = xfs.length;
      const attrs = 'xfId="0"' +
        (fId ? ` fontId="${fId}" applyFont="1"` : '') +
        (fmtId ? ` numFmtId="${fmtId}" applyNumberFormat="1"` : '');
      xfs.push(aus
        ? `<xf ${attrs} applyAlignment="1"><alignment horizontal="${aus}"/></xf>`
        : `<xf ${attrs}/>`);
      xfIx.set(key, ix);
      return ix;
    };

    const je = blaetter.map((b: any) =>
      (b.stile || []).length
        ? b.stile.map((zeile: any[]) => zeile.map((st: any) => kombi(st)))
        : null);

    const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      (numFmts.length ? `<numFmts count="${numFmts.length}">` + numFmts.join('') + '</numFmts>' : '') +
      `<fonts count="${fonts.length}">` + fonts.join('') + '</fonts>' +
      '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
      '<borders count="1"><border/></borders>' +
      '<cellStyleXfs count="1"><xf/></cellStyleXfs>' +
      `<cellXfs count="${xfs.length}">` + xfs.join('') + '</cellXfs>' +
      '</styleSheet>';
    return { xml, je };
  };

  const alsExcel = async (blaetter: any, dateiname: any) => {
    const sicher = (n: number, i: number) => String(n || ('Blatt' + (i + 1)))
      .replace(/[\\/:*?[\]]/g, ' ').slice(0, 31) || ('Blatt' + (i + 1));

    const stile = stilSammlung(blaetter);

    const dateien = [
      { name: '[Content_Types].xml', inhalt:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        blaetter.map((_: any, i: any) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ` +
          'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') +
        '</Types>' },
      { name: '_rels/.rels', inhalt:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>' },
      { name: 'xl/workbook.xml', inhalt:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
        blaetter.map((b: any, i: any) =>
          `<sheet name="${esc(sicher(b.name, i))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('') +
        '</sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', inhalt:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        blaetter.map((_: any, i: any) =>
          `<Relationship Id="rId${i + 1}" ` +
          'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
          `Target="worksheets/sheet${i + 1}.xml"/>`).join('') +
        `<Relationship Id="rId${blaetter.length + 1}" ` +
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" ' +
        'Target="styles.xml"/>' +
        '</Relationships>' },
      { name: 'xl/styles.xml', inhalt: stile.xml }
    ].concat(blaetter.map((b: any, i: any) =>
      ({ name: `xl/worksheets/sheet${i + 1}.xml`,
         inhalt: blattXml(b.zeilen, stile.je[i] || undefined, b.formeln || undefined) })));

    const blob = await zipSchreiben(dateien);
    laden(blob, (dateiname || 'Redion') + '.xlsx');
    return blob;
  };

  /** Eine Datenbank als Excel-Mappe: ein Blatt je Ansicht. */
  const datenbankAlsExcel = (coll: any) => {
    const ansichten = Object.values<any>(Store.cache.views).filter(v => v.collectionId === coll.id);
    const keys = Object.keys(coll.schema);
    const kopf = keys.map(k => coll.schema[k].name);
    const zeilenVon = (view: any) => {
      const rows = view ? Datenbank.zeilen(coll, view) : Store.rowsOf(coll.id);
      return rows.map((r: any) => keys.map(k => {
        const v = Datenbank.wert(r, k, coll);
        if (Array.isArray(v)) return v.map(x => (x && x.name) || x).join(', ');
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        return v === null || v === undefined ? '' : String(Formula.anzeige(v));
      }));
    };
    const blaetter = ansichten.length
      ? ansichten.map(v => ({ name: v.name || 'Ansicht', zeilen: [kopf, ...zeilenVon(v)] }))
      : [{ name: coll.name, zeilen: [kopf, ...zeilenVon(null)] }];
    return alsExcel(blaetter, (coll.name || 'Datenbank').replace(/[\\/:*?"<>|]/g, '-'));
  };

  /** Alle Datenbanken auf einmal — ein Blatt je Datenbank. */
  const allesAlsExcel = () => {
    const dbs = Object.values<any>(Store.cache.collections);
    if (!dbs.length) { UI.toast('Es gibt noch keine Datenbank'); return null; }
    const blaetter = dbs.map(c => {
      const keys = Object.keys(c.schema);
      return { name: c.name || 'Datenbank',
               zeilen: [keys.map(k => c.schema[k].name),
                 ...Store.rowsOf(c.id).map((r: any) => keys.map(k => {
                   const v = Datenbank.wert(r, k, c);
                   return Array.isArray(v) ? v.map(x => (x && x.name) || x).join(', ')
                                           : String(Formula.anzeige(v) ?? '');
                 }))] };
    });
    return alsExcel(blaetter, 'Redion-Datenbanken');
  };

  /* ========================================================================
   * 4. EINLESEN
   * ======================================================================*/

  /* --- Trello ------------------------------------------------------------
   * Der JSON-Export eines Boards: lists sind die Spalten, cards die Karten,
   * labels werden zu einer Mehrfachauswahl.
   * --------------------------------------------------------------------- */
  const ausTrello = (text: string, zielSeite: any) => {
    const d = JSON.parse(text);
    if (!d || !Array.isArray(d.cards)) throw new Error('Das sieht nicht nach einem Trello-Export aus');

    const listen = new Map((d.lists || []).map((l: any) => [l.id, l.name]));
    const farben: Record<string, string> = { green:'green', yellow:'yellow', orange:'orange', red:'red',
                     purple:'purple', blue:'blue', sky:'blue', lime:'green',
                     pink:'pink', black:'gray' };
    const labels = [...new Map((d.labels || []).map((l: any) =>
      [l.name || l.color, { name: l.name || l.color, color: farben[l.color] || 'gray' }])).values()];

    const seite = Store.addBlock(zielSeite || null, 'page', { text: d.name || 'Trello-Board' });
    const db = Store.addDatabase(seite.id, d.name || 'Karten', {
      title:  { name: 'Karte',   type: 'title' },
      liste:  { name: 'Liste',   type: 'status',
                options: [...listen.values()].map((n, i) => ({ name: n, color: ['gray','blue','green','orange','purple'][i % 5] })) },
      labels: { name: 'Etiketten', type: 'multi', options: labels },
      faellig:{ name: 'Fällig',  type: 'date' },
      fertig: { name: 'Erledigt', type: 'checkbox' },
      link:   { name: 'Trello',  type: 'url' }
    }, 'board');
    const coll = Store.getCollection(db.collectionId);
    Store.updateView(db.viewId, { groupBy: 'liste' });

    let n = 0;
    (d.cards || []).forEach((c: any) => {
      if (c.closed) return;
      const zeile = Store.addRow(coll.id, {
        title:  c.name || 'Ohne Titel',
        liste:  listen.get(c.idList) || '',
        labels: (c.labels || []).map((l: any) => l.name || l.color),
        faellig: c.due ? String(c.due).slice(0, 10) : '',
        fertig: !!c.dueComplete,
        link:   c.shortUrl || ''
      });
      n++;
      /* Beschreibung und Checklisten kommen in die Zeilenseite */
      if (c.desc) Werkzeuge.ausMarkdown(zeile, c.desc);
      const punkte = (d.checklists || []).filter((cl: any) => cl.idCard === c.id);
      punkte.forEach((cl: any) => {
        Store.addBlock(zeile.id, 'h3', { text: cl.name || 'Checkliste' });
        (cl.checkItems || []).sort((a: any, b: any) => (a.pos || 0) - (b.pos || 0)).forEach((it: any) =>
          Store.addBlock(zeile.id, 'todo', { text: it.name, checked: it.state === 'complete' }));
      });
    });
    return { seite, hinweis: n + ' Karten aus ' + listen.size + ' Listen übernommen' };
  };

  /* --- HTML in Markdown, einmal fuer alle -------------------------------
   * Evernote (ENML) und Apple Notes liefern beide HTML, und beide brauchen
   * daraus dieselben Bloecke. Diese Funktion stand frueher IN `ausEvernote`;
   * Apple Notes haette sie kopiert, und dann waere sie zweimal dagewesen —
   * genau die Sorte doppelte Wahrheit, die L34 beschreibt.
   *
   * ABGEHAKTES bleibt abgehakt: Apple Notes schreibt Checklisten als
   * `<li>` mit einem Datenattribut oder einem vorangestellten Kaestchen.
   * Beides wird zu `- [ ]` / `- [x]`, und `ausMarkdown` macht daraus
   * echte Aufgabenbloecke statt Strichlisten mit einem Kaestchen im Text.
   * --------------------------------------------------------------------- */
  const HAKEN_AN = /^\s*(?:\u2611|\u2612|\u2714|\u2713|\[x\]|\[X\])\s*/;
  const HAKEN_AUS = /^\s*(?:\u2610|\[\s?\])\s*/;

  const htmlZuMarkdown = (html: string): string => {
    const roh = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
    if (!roh.body) return '';
    return [...roh.body.querySelectorAll('div, p, li, h1, h2, h3')]
      .map(el => {
        let t = (el.textContent || '').trim();
        if (!t) return '';
        if (el.tagName === 'H1') return '# ' + t;
        if (el.tagName === 'H2') return '## ' + t;
        if (el.tagName === 'H3') return '### ' + t;
        if (el.tagName === 'LI') {
          /* Apple Notes kennt drei Schreibweisen fuer denselben Haken. */
          const attr = el.getAttribute('data-apple-checklist-item')
                    || el.getAttribute('data-checked') || '';
          if (HAKEN_AN.test(t))  return '- [x] ' + t.replace(HAKEN_AN, '');
          if (HAKEN_AUS.test(t)) return '- [ ] ' + t.replace(HAKEN_AUS, '');
          if (attr) return (attr === 'true' || attr === 'checked' ? '- [x] ' : '- [ ] ') + t;
          return '- ' + t;
        }
        return t;
      }).filter(Boolean).join('\n\n');
  };

  /* --- Evernote (.enex) --------------------------------------------------
   * Eine XML-Datei mit <note>-Einträgen. Der Inhalt steckt in ENML, das
   * nah genug an HTML ist, um es über den HTML-Weg einzulesen.
   * --------------------------------------------------------------------- */
  const ausEvernote = (text: string, zielSeite: any) => {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    const notizen = [...doc.querySelectorAll('note')];
    if (!notizen.length) throw new Error('Keine Notizen in dieser Datei gefunden');

    const wurzel = Store.addBlock(zielSeite || null, 'page', { text: 'Aus Evernote' });
    notizen.forEach(n => {
      const titel = (n.querySelector('title') || {}).textContent || 'Ohne Titel';
      const inhalt = (n.querySelector('content') || {}).textContent || '';
      const seite = Store.addBlock(wurzel.id, 'page', { text: titel });
      const md = htmlZuMarkdown(inhalt);
      if (md) Werkzeuge.ausMarkdown(seite, md);
      const tags = [...n.querySelectorAll('tag')].map(t => t.textContent);
      if (tags.length) Store.updateBlock(seite.id, { tags });
    });
    Store.updateBlock(wurzel.id, { aufgeklappt: true });
    return { seite: wurzel, hinweis: notizen.length + ' Notizen übernommen' };
  };

  /* --- Obsidian / Markdown-Vault ----------------------------------------
   * Jede Seite bleibt eine normale Redion-Seite. Frontmatter trägt nur die
   * stabilen Anker für den nächsten Roundtrip; es entsteht kein zweites
   * Seitenmodell. Wikilinks bleiben Wikilinks und werden vom gemeinsamen
   * `Links`-Resolver gelesen, statt destruktiv in `#id`-Links umzuwandeln.
   * --------------------------------------------------------------------- */

  interface VaultFrontmatter {
    redionId: string;
    redionPath: string;
    redionTitle: string;
    aliases: string[];
  }

  interface VaultImportEntry {
    file: any;
    path: string;
    stem: string;
    folder: string;
    title: string;
    body: string;
    meta: VaultFrontmatter;
    page: any | null;
    conflict: string;
    authoritative: boolean;
  }

  const normalizeVaultKey = (value: unknown): string => String(value ?? '')
    .normalize('NFKC').replace(/\\/g, '/').replace(/^\.\//, '')
    .replace(/^\/+|\/+$/g, '')
    .split('/').map(segment => segment.trim().replace(/\s+/g, ' ')).filter(Boolean)
    .join('/').toLocaleLowerCase('de');

  const WINDOWS_RESERVED = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

  /** Pfade aus fremden Dateien dürfen den gewählten Vault nie verlassen. */
  const safeVaultPath = (value: unknown, allowText = false): string | null => {
    const raw = String(value ?? '').normalize('NFKC').replace(/\\/g, '/').trim();
    if (!raw || raw.length > 1024 || raw.startsWith('/') || /^[A-Za-z]:/.test(raw) ||
        /[<>:"|?*\u0000-\u001F]/.test(raw)) return null;
    const parts = raw.split('/');
    if (parts.some(part => !part || part === '.' || part === '..' || part.length > 240 ||
        WINDOWS_RESERVED.test(part))) return null;
    if (!allowText && !/\.(?:md|markdown)$/i.test(parts[parts.length - 1] || '')) return null;
    if (allowText && !/\.(?:md|markdown|txt)$/i.test(parts[parts.length - 1] || '')) return null;
    return parts.join('/');
  };

  const safeDeclaredVaultPath = (value: unknown): string => {
    const raw = String(value ?? '').normalize('NFKC').replace(/\\/g, '/').trim();
    if (!raw) return '';
    /* Die angehaengte Endung ist nur der Validierungsrahmen und wird danach
       wieder entfernt. Eine echte Seite namens `Foo.md` bleibt dadurch
       `Foo.md` statt unbemerkt zu `Foo` zu kollabieren. */
    const safe = safeVaultPath(raw + '.md');
    return safe ? safe.slice(0, -3) : '';
  };

  const yamlValue = (raw: string): string => {
    const value = raw.trim();
    if (!value) return '';
    if (value.startsWith('"') && value.endsWith('"')) {
      try { const parsed = JSON.parse(value); return typeof parsed === 'string' ? parsed : ''; }
      catch { return value.slice(1, -1); }
    }
    if (value.startsWith("'") && value.endsWith("'"))
      return value.slice(1, -1).replace(/''/g, "'");
    return value.replace(/\s+#.*$/, '').trim();
  };

  const yamlAliases = (raw: string): string[] => {
    const value = raw.trim();
    if (!value) return [];
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(item => String(item ?? ''));
      } catch { /* Einfache YAML-Liste ohne JSON-Anführungszeichen folgt. */ }
      return value.slice(1, -1).split(',').map(yamlValue);
    }
    return [yamlValue(value)];
  };

  const cleanAliases = (values: unknown[], title = ''): string[] => {
    const seen = new Set<string>(), out: string[] = [];
    const titleKey = String(title).trim().toLocaleLowerCase('de');
    for (const raw of values || []) {
      const alias = String(raw ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').slice(0, 120);
      const key = alias.toLocaleLowerCase('de');
      if (!key || key === titleKey || seen.has(key)) continue;
      seen.add(key); out.push(alias);
    }
    return out;
  };

  const parseVaultFrontmatter = (text: string): { meta: VaultFrontmatter; body: string } => {
    const empty: VaultFrontmatter = { redionId: '', redionPath: '', redionTitle: '', aliases: [] };
    const normalized = String(text ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    if (!normalized.startsWith('---\n')) return { meta: empty, body: normalized };
    let end = normalized.indexOf('\n---\n', 4);
    let bodyStart = end + 5;
    if (end < 0 && normalized.endsWith('\n---')) {
      end = normalized.length - 4; bodyStart = normalized.length;
    }
    if (end < 0) return { meta: empty, body: normalized };
    const lines = normalized.slice(4, end).split('\n');
    const meta: VaultFrontmatter = { ...empty };
    let listKey = '';
    for (const line of lines) {
      const list = line.match(/^\s+-\s+(.*)$/);
      if (list && listKey === 'aliases') { meta.aliases.push(yamlValue(list[1] || '')); continue; }
      const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!field) { listKey = ''; continue; }
      const key = String(field[1] || '').toLocaleLowerCase('de');
      const value = field[2] || '';
      listKey = key;
      if (key === 'redion-id') meta.redionId = yamlValue(value);
      if (key === 'redion-path') meta.redionPath = yamlValue(value);
      if (key === 'redion-title') meta.redionTitle = yamlValue(value);
      if (key === 'aliases') meta.aliases.push(...yamlAliases(value));
    }
    meta.aliases = cleanAliases(meta.aliases);
    return { meta, body: normalized.slice(bodyStart) };
  };

  const yamlQuoted = (value: unknown): string => JSON.stringify(String(value ?? ''));

  const vaultFrontmatter = (page: any, path: string): string => {
    const aliases = cleanAliases(Array.isArray(page.aliases) ? page.aliases : [], page.text);
    return [
      '---',
      'redion-id: ' + yamlQuoted(page.id),
      'redion-path: ' + yamlQuoted(path),
      'redion-title: ' + yamlQuoted(String(page.text || 'Ohne Titel').replace(/[\r\n]+/g, ' ')),
      ...(aliases.length ? ['aliases:', ...aliases.map(alias => '  - ' + yamlQuoted(alias))] : ['aliases: []']),
      '---'
    ].join('\n');
  };

  const safeVaultSegment = (value: unknown): string => {
    let segment = String(value || 'Ohne Titel').normalize('NFKC')
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/[. ]+$/g, '').slice(0, 80);
    if (!segment) segment = 'Ohne Titel';
    if (WINDOWS_RESERVED.test(segment)) segment = '_' + segment;
    return segment;
  };

  const vaultDarf = (recht: string, seiteId?: string | null): boolean => {
    if (typeof Konten === 'undefined' || typeof Konten.darf !== 'function') return true;
    if (seiteId) return Konten.darf(recht, seiteId);
    /* Eine Wurzeloperation hat absichtlich keine Seite. `Konten.darf` wuerde
       ohne ID auf die gerade sichtbare Seite ausweichen; massgeblich ist hier
       stattdessen die aktive Kontorolle selbst. */
    const konto = typeof Konten.aktiv === 'function' ? Konten.aktiv() : null;
    const rolle = typeof Konten.rolle === 'function' ? Konten.rolle(konto?.rolle || 'voll') : null;
    return !rolle || (rolle.darf || []).includes(recht);
  };

  /** Plant erst alle Namen, damit gleiche Geschwister keinen Pfad teilen. */
  const planVaultPaths = (erlaubt: (page: any) => boolean = () => true): Map<string, string> => {
    const paths = new Map<string, string>(), visited = new Set<string>();
    const walk = (pages: any[], parentPath: string, namespace?: Set<string>): void => {
      const used = namespace || new Set<string>();
      pages.forEach(page => {
        if (!page?.id || visited.has(page.id)) return;
        visited.add(page.id);
        const children = Store.childrenOf(page.id)
          .filter((child: any) => child.type === 'page' && child.parentTable !== 'collection');
        /* Eine explizit freigegebene Unterseite darf exportierbar sein, ohne
           dass dadurch ihr gesperrter Elterninhalt mit hinausgeht. */
        if (!erlaubt(page)) { walk(children, parentPath, used); return; }
        const base = safeVaultSegment(page.text);
        let segment = base, key = segment.toLocaleLowerCase('de');
        if (used.has(key)) {
          segment = `${base} · ${String(page.id).slice(0, 8)}`;
          key = segment.toLocaleLowerCase('de');
          let suffix = 2;
          while (used.has(key)) {
            segment = `${base} · ${String(page.id).slice(0, 8)} · ${suffix++}`;
            key = segment.toLocaleLowerCase('de');
          }
        }
        used.add(key);
        const path = parentPath ? parentPath + '/' + segment : segment;
        paths.set(page.id, path);
        walk(children, path);
      });
    };
    walk(Store.rootPages(), '');
    return paths;
  };

  const vaultMarkdown = (page: any, path: string, paths: Map<string, string>): string => {
    let body = Werkzeuge.alsMarkdown(page);
    /* `alsMarkdown` bewahrt Unterseiten als Platzhalter. Eine fuer diesen
       Export nicht freigegebene Kindseite darf dabei weder ID noch Titel in
       der Datei des erlaubten Elternteils verraten. */
    body = body.split('\n').filter((line: string) => {
      const marker = line.trim().match(/^<!--(?:db|wb|chart|tab|blk):([A-Za-z0-9_-]+)-->/);
      if (!marker?.[1]) return true;
      const target = Store.getBlock(marker[1]);
      return !(target?.type === 'page' && !paths.has(target.id));
    }).join('\n');
    /* Alte Obsidian-Importe haben Wikilinks als #id-Links gespeichert. Beim
       neuen Export werden sie, soweit das Ziel noch existiert, repariert. */
    body = body.replace(/\[([^\]\n]+)\]\(#([0-9a-f-]{6,64})\)/gi,
      (whole: string, label: string, id: string) => {
        const target = Store.getBlock(id);
        if (!target || target.type !== 'page' || !target.alive) return whole;
        const targetPath = paths.get(target.id);
        if (!targetPath) return whole;
        return `[[${targetPath}${label === target.text ? '' : '|' + label}]]`;
      });
    /* Auch zwei gleichnamige Seiten bleiben im Vault verlinkbar. Normale
       eindeutige Links bekommen den stabilen Pfad; bei einem vom Exporter
       erzeugten Unterseiten-Link kennt die Elternseite das Ziel selbst dann,
       wenn der blosse Titel global mehrdeutig ist. */
    body = body.replace(/\[\[([^\[\]\n|]{1,240})(?:\|([^\]\n]{1,240}))?\]\]/g,
      (whole: string, rawTarget: string, rawLabel: string) => {
        const suffixAt = String(rawTarget).search(/[#^]/);
        const suffix = suffixAt >= 0 ? String(rawTarget).slice(suffixAt) : '';
        const targetName = suffixAt >= 0 ? String(rawTarget).slice(0, suffixAt) : String(rawTarget);
        let target = typeof Links !== 'undefined' ? Links.loeseSeitenverweis(targetName).page : null;
        if (!target) {
          const children = Store.childrenOf(page.id).filter((child: any) => child.type === 'page' &&
            String(child.text || '').trim().toLocaleLowerCase('de') ===
              targetName.trim().toLocaleLowerCase('de'));
          if (children.length === 1) target = children[0];
        }
        const targetPath = target && paths.get(target.id);
        if (!targetPath) return whole;
        const label = String(rawLabel || (targetPath !== targetName ? target.text || targetName : '')).trim();
        return `[[${targetPath}${suffix}${label ? '|' + label : ''}]]`;
      });
    return vaultFrontmatter(page, path) + '\n# ' + (page.text || 'Ohne Titel') +
      (body ? '\n\n' + body : '') + '\n';
  };

  /** Vollständiger Obsidian-Vault als ZIP; die Oberfläche kann diese API anbinden. */
  const alsObsidianVault = async (dateiname = 'Redion-Obsidian'): Promise<Blob> => {
    const paths = planVaultPaths(page => vaultDarf('teilen', page.id));
    const files = [...paths.entries()].map(([id, path]) => ({
      name: path + '.md', inhalt: vaultMarkdown(Store.getBlock(id), path, paths)
    }));
    const blob = await zipSchreiben(files);
    laden(blob, safeVaultSegment(dateiname) + '.zip');
    return blob;
  };

  const validRedionId = (value: unknown): string => {
    const id = String(value ?? '').trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      ? id : '';
  };

  const movePage = (page: any, parentId: string | null): boolean => {
    if (!page || page.parentId === parentId) return true;
    let current = Store.getBlock(parentId), guard = 0;
    while (current && guard++ < 80) {
      if (current.id === page.id) return false;
      current = current.parentId ? Store.getBlock(current.parentId) : null;
    }
    const oldParent = Store.getBlock(page.parentId);
    const newParent = Store.getBlock(parentId);
    if (!vaultDarf('bearbeiten', page.id) ||
        !(oldParent ? vaultDarf('bearbeiten', oldParent.id) : vaultDarf('bearbeiten')) ||
        !(newParent ? vaultDarf('bearbeiten', newParent.id) : vaultDarf('bearbeiten')))
      return false;
    if (oldParent) Store.updateBlock(oldParent.id, {
      content: (oldParent.content || []).filter((id: string) => id !== page.id)
    });
    Store.updateBlock(page.id, { parentId, parentTable: 'block' });
    const parent = newParent;
    if (parent && !(parent.content || []).includes(page.id))
      Store.updateBlock(parent.id, { content: [...(parent.content || []), page.id], aufgeklappt: true });
    return true;
  };

  /**
   * Zwei Durchgänge: erst Identitäten/Pfade anlegen, danach Inhalte lesen.
   * So bleiben Wikilinks vorwärts wie rückwärts erhalten. Titel werden nie
   * als Import-Schlüssel benutzt; gleiche Titel dürfen nebeneinander leben.
   */
  const ausMarkdownOrdner = async (dateien: any, zielSeite: any) => {
    const allFiles = Array.from<any>(dateien || []);
    const firstRelative = String(allFiles.find(file => file.webkitRelativePath)?.webkitRelativePath || '')
      .replace(/\\/g, '/');
    const vaultName = safeVaultSegment(firstRelative.split('/')[0] || 'Obsidian');
    let conflicts = 0, unsafe = 0, reused = 0, created = 0, links = 0, aliasConflicts = 0;
    /* Vor dem Anlegen der Importwurzel: diese Pfade entsprechen genau einem
       vorherigen Export und sind deshalb ein zulässiger Rückfall ohne ID. */
    const existingPlannedPaths = planVaultPaths();

    const entries = (await Promise.all(allFiles.map(async file => {
      const rawRelative = String(file.webkitRelativePath || file.name || '').replace(/\\/g, '/');
      const withoutRoot = file.webkitRelativePath ? rawRelative.split('/').slice(1).join('/') : rawRelative;
      const path = safeVaultPath(withoutRoot, true);
      if (!path) { unsafe++; return null; }
      const parsed = parseVaultFrontmatter(await file.text());
      if (parsed.meta.redionId && !validRedionId(parsed.meta.redionId)) {
        parsed.meta.redionId = ''; unsafe++;
      }
      const declaredPath = safeDeclaredVaultPath(parsed.meta.redionPath);
      if (parsed.meta.redionPath && !declaredPath) unsafe++;
      parsed.meta.redionPath = declaredPath;
      const stem = path.replace(/\.(?:md|markdown|txt)$/i, '');
      const parts = stem.split('/');
      const fileTitle = parts.pop() || 'Ohne Titel';
      const declaredFileTitle = parsed.meta.redionPath.split('/').pop() || '';
      const renamedInVault = !!declaredFileTitle &&
        normalizeVaultKey(fileTitle) !== normalizeVaultKey(declaredFileTitle);
      const title = String(renamedInVault ? fileTitle : (parsed.meta.redionTitle || fileTitle))
        .normalize('NFKC').replace(/[\r\n]+/g, ' ').trim().slice(0, 500) || fileTitle;
      return {
        file, path, stem, folder: parts.join('/'), title,
        body: parsed.body, meta: parsed.meta, page: null, conflict: '', authoritative: false
      } as VaultImportEntry;
    }))).filter(Boolean) as VaultImportEntry[];

    if (!entries.length)
      return { seite: null, hinweis: 'Keine sichere Markdown-Datei zum Importieren gefunden.' };

    const eigeneMetadaten = entries.filter(entry => !!entry.meta.redionPath).length;
    if (eigeneMetadaten > 0 && eigeneMetadaten < entries.length) {
      /* Nie halb als eigener Roundtrip und halb als fremder Vault arbeiten:
         sonst wuerden stabile Seiten bereits verschoben, waehrend ihr
         ID-Schutz fuer denselben Lauf abgeschaltet ist. */
      return { seite: null,
        hinweis: 'Import abgebrochen: Redion-Vault und fremde Markdown-Dateien sind gemischt. Bitte getrennt auswählen.' };
    }
    const isRedionVault = eigeneMetadaten === entries.length;

    /* Doppelbelegte Dateien/IDs werden sichtbar getrennt angelegt statt in
       eine zufällige Seite zusammenzufallen. */
    const pathClaims = new Map<string, VaultImportEntry[]>();
    const idClaims = new Map<string, VaultImportEntry[]>();
    entries.forEach(entry => {
      const pathKey = normalizeVaultKey(entry.stem);
      pathClaims.set(pathKey, [...(pathClaims.get(pathKey) || []), entry]);
      const id = validRedionId(entry.meta.redionId);
      if (id) idClaims.set(id.toLowerCase(), [...(idClaims.get(id.toLowerCase()) || []), entry]);
    });
    [...pathClaims.values(), ...idClaims.values()].filter(list => list.length > 1).forEach(list => {
      list.forEach(entry => { if (!entry.conflict) { entry.conflict = 'doppelte Identität'; conflicts++; } });
    });

    /* `redion-path` kennzeichnet den eigenen Export auch dann noch, wenn ein
       Werkzeug die optionale ID entfernt hat — genau dafür existiert der
       Pfad-Rückfall. */
    const targetPage = zielSeite ? Store.getBlock(zielSeite) : null;
    if ((targetPage && !vaultDarf('bearbeiten', targetPage.id)) ||
        (!targetPage && !vaultDarf('bearbeiten'))) {
      return { seite: null, hinweis: 'Für dieses Importziel fehlt die Bearbeitungsberechtigung.' };
    }
    const topParentId = targetPage?.type === 'page' && targetPage.alive ? targetPage.id : null;
    let root: any = null;
    if (!isRedionVault) {
      /* Ein fremder Vault hat keine stabile Identitaet. Derselbe lokale
         Ordnername ist kein Beweis, dass es derselbe Bestand ist; jeder Lauf
         bekommt daher eine eigene Wurzel statt alte Notizen zu ueberschreiben. */
      root = Store.addBlock(topParentId, 'page', {
        text: 'Aus Obsidian · ' + vaultName, icon: '🔮',
        obsidianVaultRoot: true, obsidianVaultName: vaultName
      });
    }

    const folderIds = new Map<string, string>();
    if (root) folderIds.set('', root.id);
    const folderFor = (path: string): string => {
      const known = folderIds.get(path);
      if (known) return known;
      const parts = path.split('/');
      const name = parts.pop() || 'Ordner';
      const parentId = folderFor(parts.join('/'));
      const candidates = Object.values<any>(Store.cache.blocks).filter(page => page?.alive &&
        page.type === 'page' && page.parentTable !== 'collection' &&
        page.obsidianVaultName === vaultName && page.obsidianVaultRootId === root?.id &&
        normalizeVaultKey(page.obsidianFolderPath) === normalizeVaultKey(path));
      let folder: any;
      if (candidates.length === 1) { folder = candidates[0]; movePage(folder, parentId); }
      else {
        if (candidates.length > 1) conflicts++;
        folder = Store.addBlock(parentId, 'page', { text: name, icon: '📁',
          obsidianFolderPath: path, obsidianVaultName: vaultName,
          obsidianVaultRootId: root?.id || '' });
      }
      Store.updateBlock(folder.id, { text: name, icon: '📁',
        obsidianFolderPath: path, obsidianVaultName: vaultName,
        obsidianVaultRootId: root?.id || '' });
      folderIds.set(path, folder.id);
      return folder.id;
    };

    const existingPages = () => Object.values<any>(Store.cache.blocks).filter(page => page?.alive &&
      page.type === 'page' && page.parentTable !== 'collection' && !page.obsidianVaultRoot &&
      vaultDarf('bearbeiten', page.id));
    const pathCandidates = (storedKeys: string[], exportedKeys: string[]): any[] => {
      const wantedStored = new Set(storedKeys.map(normalizeVaultKey).filter(Boolean));
      const wantedExported = new Set(exportedKeys.map(normalizeVaultKey).filter(Boolean));
      const found = new Map<string, any>();
      existingPages().forEach(page => {
        if ((page.obsidianVaultName === vaultName &&
             page.obsidianVaultRootId === (root?.id || '') &&
             (wantedStored.has(normalizeVaultKey(page.obsidianPath)) ||
              wantedStored.has(normalizeVaultKey(page.obsidianDeclaredPath)))) ||
            wantedExported.has(normalizeVaultKey(existingPlannedPaths.get(page.id)))) found.set(page.id, page);
      });
      return [...found.values()];
    };

    const uniqueEntryByPath = new Map<string, VaultImportEntry>();
    pathClaims.forEach((list, key) => { if (list.length === 1 && list[0]) uniqueEntryByPath.set(key, list[0]); });
    const orderedEntries = [...entries].sort((a, b) =>
      a.stem.split('/').length - b.stem.split('/').length || a.stem.localeCompare(b.stem, 'de'));

    /* PASS 1: Identität, Alias und Hierarchie. Elternpfade stehen wegen der
       Sortierung bereits fest, bevor ihre Kinder verschoben werden. */
    for (const entry of orderedEntries) {
      const parentEntry = entry.folder ? uniqueEntryByPath.get(normalizeVaultKey(entry.folder)) : null;
      let parentId = isRedionVault
        ? (parentEntry?.authoritative ? parentEntry.page?.id : topParentId)
        : folderFor(entry.folder);
      const missingParent = isRedionVault && !!entry.folder && !parentEntry?.authoritative;
      const claimedTwice = !!entry.conflict;
      const wantedId = claimedTwice ? '' : validRedionId(entry.meta.redionId);
      const byId = wantedId ? Store.getBlock(wantedId) : null;
      /* Den berechneten Redion-Pfad nur mit ausdrücklich exportiertem
         `redion-path` vergleichen. Eine fremde `Foo.md` darf nicht bloss
         wegen ihres Namens eine vorhandene lokale Seite Foo überschreiben. */
      const paths = claimedTwice ? [] : pathCandidates(
        [entry.meta.redionPath], [entry.meta.redionPath]);
      let page: any = null;

      if (byId && (byId.type !== 'page' || !byId.alive || byId.parentTable === 'collection')) {
        entry.conflict = 'redion-id gehört zu einem anderen Datensatz'; conflicts++;
      } else if (byId && !vaultDarf('bearbeiten', byId.id)) {
        entry.conflict = 'redion-id gehört zu einer nicht bearbeitbaren Seite'; conflicts++;
      } else if (byId && paths.length === 1 && paths[0]?.id === byId.id) {
        /* Nur beide stabilen Anker gemeinsam erlauben ein destruktives
           Update. Eine passende ID ODER ein passender Pfad allein kann aus
           einer fremden Datei kopiert sein und erzeugt deshalb eine
           getrennte Konfliktseite. */
        page = byId; entry.authoritative = true; reused++;
      } else if (byId) {
        entry.conflict = paths.length
          ? 'redion-id und redion-path zeigen nicht eindeutig auf dieselbe Seite'
          : 'redion-id hat keinen bestätigenden redion-path';
        conflicts++;
      } else if (wantedId && paths.length) {
        entry.conflict = 'redion-id ist neu, redion-path aber schon belegt'; conflicts++;
      } else if (!wantedId && paths.length) {
        entry.conflict = paths.length > 1
          ? 'redion-path ist mehrdeutig'
          : 'redion-path ohne bestätigende redion-id';
        conflicts++;
      }

      /* Bei einem Teil-Vault fehlt die Eltern-Datei. Eine bestätigte lokale
         Seite bleibt dann an ihrem bisherigen Ort; sie wird nie bloss wegen
         einer unvollständigen Dateiauswahl an die Wurzel verschoben. */
      if (missingParent && page) parentId = page.parentId || null;

      /* Konflikte werden nicht gemergt. Eine neue Seite erhält bewusst eine
         neue ID; beide Fassungen bleiben erhalten und der Hinweis zählt sie. */
      if (!page) {
        const patch: Record<string, any> = { text: entry.title };
        if (!entry.conflict && wantedId && !Store.getBlock(wantedId)) patch.id = wantedId;
        page = Store.addBlock(parentId, 'page', patch);
        entry.authoritative = !entry.conflict;
        created++;
      } else if (!movePage(page, parentId)) {
        entry.conflict = 'Seite konnte wegen Hierarchie oder Rechten nicht verschoben werden'; conflicts++;
        page = Store.addBlock(parentId, 'page', { text: entry.title }); created++;
        entry.authoritative = false;
      }

      if (missingParent && !entry.conflict) {
        entry.conflict = 'Elterndatei fehlt; vorhandene Hierarchie wurde beibehalten';
        conflicts++;
      }

      const aliases = cleanAliases(entry.meta.aliases, entry.title);
      Store.updateBlock(page.id, {
        text: entry.title, aliases, obsidianPath: entry.stem,
        obsidianDeclaredPath: entry.meta.redionPath || '', obsidianVaultName: vaultName,
        obsidianVaultRootId: root?.id || ''
      });
      entry.page = page;
    }

    /* PASS 2: Erst jetzt sind auch Vorwärtslinks und Aliase bekannt. */
    for (const entry of orderedEntries) {
      if (!entry.page) continue;
      if (!vaultDarf('bearbeiten', entry.page.id)) { conflicts++; continue; }
      let body = entry.body;
      const firstHeading = body.match(/^#\s+([^\n]+)\n+/);
      if (firstHeading && String(firstHeading[1] || '').trim().toLocaleLowerCase('de') ===
          entry.title.trim().toLocaleLowerCase('de')) body = body.slice(firstHeading[0].length);
      Werkzeuge.ausMarkdown(entry.page, body,
        isRedionVault ? { preserveOpaqueIds: true } : undefined);
      for (const match of body.matchAll(/\[\[([^\[\]\n|]{1,240})(?:\|[^\]\n]*)?\]\]/g)) {
        if (typeof Links !== 'undefined' && Links.loeseSeitenverweis(match[1] || '').status === 'eindeutig') links++;
      }
    }

    if (typeof Links !== 'undefined') {
      const collided = new Set<string>();
      entries.forEach(entry => (entry.page?.aliases || []).forEach((alias: string) => {
        if (Links.loeseSeitenverweis(alias).status === 'mehrdeutig')
          collided.add(alias.toLocaleLowerCase('de'));
      }));
      aliasConflicts = collided.size;
    }

    if (root) Store.updateBlock(root.id, { aufgeklappt: true });
    const firstPage = root || orderedEntries.find(entry => !entry.folder)?.page || orderedEntries[0]?.page || null;
    const folderCount = isRedionVault
      ? new Set(entries.map(entry => entry.folder).filter(Boolean)).size
      : Math.max(0, folderIds.size - 1);
    return { seite: firstPage,
      hinweis: `${entries.length} Notizen (${created} neu, ${reused} wiedererkannt), ` +
        `${folderCount} Ordner, ${links} eindeutige Wikilinks` +
        (conflicts ? ` · ${conflicts} Konflikte getrennt behalten` : '') +
        (aliasConflicts ? ` · ${aliasConflicts} mehrdeutige Aliase markiert` : '') +
        (unsafe ? ` · ${unsafe} unsichere/ungeeignete Pfade übersprungen` : '') };
  };

  /* --- Notion-Export (ZIP) -----------------------------------------------
   * Notions eigener Export: Markdown-Dateien und CSV-Dateien, die Ordner
   * bilden die Seitenhierarchie. Die langen IDs im Dateinamen fliegen raus.
   * --------------------------------------------------------------------- */
  const ausNotionZip = async (puffer: any, zielSeite: any) => {
    const zip = await Einlesen.zipLesen(puffer);
    const wurzel = Store.addBlock(zielSeite || null, 'page', { text: 'Aus Notion' });
    const ordner = new Map([['', wurzel.id]]);
    const saeubern = (n: unknown) => String(n).replace(/\s+[0-9a-f]{32}(?=$|\.)/i, '').trim();

    /* Wie oben: der Pfad ist ein Text, keine Liste. */
    const ordnerFuer = (pfad: string): string => {
      const da = ordner.get(pfad);
      if (da !== undefined) return da;
      const teile = pfad.split('/');
      const name = saeubern(teile.pop() ?? 'Ordner');
      const eltern = ordnerFuer(teile.join('/'));
      const s = Store.addBlock(eltern, 'page', { text: name });
      ordner.set(pfad, s.id);
      return s.id;
    };

    /* Ein Notion-Export enthält die BILDER der Seiten als Dateien neben dem
       Markdown. Bis heute las dieser Import .md, .csv und .json — und liess
       alles andere STUMM fallen: zwölf Bilder weg, und der Hinweis sagte
       „8 Seiten übernommen", als wäre nichts. Jetzt werden bekannte Medien
       als echte Dateien abgelegt (mit Stücken, wie jeder Upload), und was
       wirklich niemand kennt, wird wenigstens GEZÄHLT und genannt. */
    const MEDIEN: Record<string, { typ: string; block: string }> = {
      png:  { typ: 'image/png',       block: 'image' },
      jpg:  { typ: 'image/jpeg',      block: 'image' },
      jpeg: { typ: 'image/jpeg',      block: 'image' },
      gif:  { typ: 'image/gif',       block: 'image' },
      webp: { typ: 'image/webp',      block: 'image' },
      svg:  { typ: 'image/svg+xml',   block: 'image' },
      pdf:  { typ: 'application/pdf', block: 'file' },
      mp4:  { typ: 'video/mp4',       block: 'video' },
      webm: { typ: 'video/webm',      block: 'video' },
      mp3:  { typ: 'audio/mpeg',      block: 'file' },
      wav:  { typ: 'audio/wav',       block: 'file' }
    };

    let seiten = 0, tabellen = 0, jsonWerte = 0, formeln = 0, anhaenge = 0;
    const ausgelassen: string[] = [];
    for (const name of zip.namen) {
      if (name.endsWith('/')) continue;
      const teile = name.split('/');
      const datei = teile.pop();
      const eltern = ordnerFuer(teile.join('/'));

      if (/\.md$/i.test(datei)) {
        const text = await zip.text(name);
        const s = Store.addBlock(eltern, 'page', { text: saeubern(datei.replace(/\.md$/i, '')) });
        /* Notion setzt den Titel als erste Zeile mit # — die fliegt raus. */
        Werkzeuge.ausMarkdown(s, text.replace(/^#\s+.*\n+/, ''));
        seiten++;
      } else if (/\.csv$/i.test(datei)) {
        const text = await zip.text(name);
        const s = Store.addBlock(eltern, 'page', { text: saeubern(datei.replace(/\.csv$/i, '')) });
        Einlesen.alsDatenbank(s.id, saeubern(datei.replace(/\.csv$/i, '')), Datenbank.csvZerlegen(text));
        tabellen++;
      } else if (/\.json$/i.test(datei)) {
        /* --- Notions Rohform ------------------------------------------
         * Wer den Export über die API zieht, bekommt JSON statt CSV: dort
         * stehen die Werte verschachtelt ([["80"]]) und die Formeln als
         * Baum. Genau das liest NotionFormat.
         * ------------------------------------------------------------- */
        try {
          const roh = JSON.parse(await zip.text(name));
          const erg = ausNotionJson(roh, eltern, saeubern(datei.replace(/\.json$/i, '')));
          jsonWerte += erg.werte;
          formeln   += erg.formeln;
          tabellen  += erg.tabellen;
        } catch { /* keine Notion-Struktur — dann eben nicht */ }
      } else {
        const endung = (datei.split('.').pop() || '').toLowerCase();
        const art = MEDIEN[endung];
        if (!art) { ausgelassen.push('.' + (endung || '?')); continue; }
        try {
          const bytes = await zip.holen(name);
          if (!bytes) { ausgelassen.push('.' + endung); continue; }
          const b = Store.addBlock(eltern, art.block, { text: saeubern(datei) });
          const satz = await Dateien.ablegen(
            new File([bytes], saeubern(datei), { type: art.typ }), { blockId: b.id });
          /* Nur die Kennung — siehe E98. */
          await Dateien.adresse(satz.id);
          Store.updateBlock(b.id, { dateiId: satz.id, typ: art.typ });
          anhaenge++;
        } catch {
          /* Ein kaputter Anhang bricht nicht den ganzen Import — aber er
             verschwindet auch nicht wortlos. */
          ausgelassen.push('.' + endung);
        }
      }
    }
    Store.updateBlock(wurzel.id, { aufgeklappt: true });
    return { seite: wurzel,
             hinweis: seiten + ' Seiten und ' + tabellen + ' Tabellen übernommen' +
               (anhaenge ? ', ' + anhaenge + ' Anhänge dabei' : '') +
               (jsonWerte ? ', ' + jsonWerte + ' verschachtelte Werte flachgelegt' : '') +
               (formeln ? ', ' + formeln + ' Formeln übersetzt' : '') +
               (ausgelassen.length ? ' — ' + ausgelassen.length + ' Datei(en) nicht übernommen (' +
                 [...new Set(ausgelassen)].join(', ') + ')' : '') };
  };

  /**
   * Eine Notion-Sammlung aus der Rohform.
   * Erwartet { name, schema:{ key:{name,type,formula?} }, rows:[{ props }] }
   * — genau so, wie Notions interne Antwort sie liefert.
   */
  const ausNotionJson = (roh: any, elternId: any, ersatzName: any) => {
    if (!roh || typeof roh !== 'object') return { werte: 0, formeln: 0, tabellen: 0 };
    const sammlungen = Array.isArray(roh) ? roh
      : (roh.collections ? Object.values<any>(roh.collections) : [roh]);
    let werte = 0, formeln = 0, tabellen = 0;

    sammlungen.forEach(c => {
      if (!c || !c.schema) return;
      const schema: Record<string, any> = {};
      Object.entries<any>(c.schema).forEach(([k, d]) => {
        const s: Record<string, any> = { name: (Array.isArray(d.name) ? NotionFormat.wertLesen(d.name) : d.name) || k,
                    type: d.type || 'text' };
        /* Formel als Baum → unser Text */
        if (d.formula) {
          const t = NotionFormat.formelAusNotion(d.formula);
          if (t) { s.formula = t; s.type = 'formula'; formeln++; }
        }
        if (Array.isArray(d.options))
          s.options = d.options.map((o: any) => (o && o.value) || String(o));
        schema[k] = s;
      });
      if (!Object.values<any>(schema).some(s => s.type === 'title')) {
        const ersteKey = Object.keys(schema)[0] || 'title';
        schema[ersteKey] = { ...(schema[ersteKey] || { name: 'Name' }), type: 'title' };
      }

      const name = (Array.isArray(c.name) ? NotionFormat.wertLesen(c.name) : c.name) ||
                   ersatzName || 'Aus Notion';
      const seite = Store.addBlock(elternId, 'page', { text: name });
      const db = Store.addDatabase(seite.id, name, schema);
      tabellen++;

      (c.rows || c.entries || []).forEach((r: any) => {
        const props = NotionFormat.zeileLesen(r.properties || r.props || r, schema);
        werte += Object.keys(props).length;
        const titelKey = Object.keys(schema).find(k => schema[k].type === 'title');
        const zeile = Store.addRow(db.collectionId, props);
        if (titelKey && props[titelKey] !== undefined)
          Store.updateBlock(zeile.id, { text: String(props[titelKey]) });
      });
    });
    return { werte, formeln, tabellen };
  };

  /* --- Asana (.csv) ------------------------------------------------------
   * Asana schreibt seinen Export als CSV mit festen Spaltennamen. Der
   * allgemeine CSV-Weg liest das auch — aber er liest ALLES als Text:
   *
   *     Section/Column  ->  Text          statt  Status (und Gruppierung)
   *     Due Date        ->  Text          statt  Datum
   *     Tags            ->  Text          statt  Mehrfachauswahl
   *     Completed At    ->  Text          statt  Haken
   *     Notes           ->  eine Zelle mit vier Absaetzen darin
   *
   * Das Letzte ist das Schlimmste: die Beschreibung einer Aufgabe landet in
   * einer Tabellenzelle, wo man sie nicht lesen und nicht gliedern kann.
   * Hier wird sie zum Seiteninhalt, wo sie hingehört.
   *
   * WAS NICHT ERKANNT WIRD, GEHT TROTZDEM MIT. Asana hängt eigene Felder
   * als weitere Spalten an, und die heissen bei jedem anders. Sie werden
   * als Textspalten übernommen — lieber eine Spalte zu viel als ein
   * verlorenes Feld.
   * --------------------------------------------------------------------- */

  /** Was Asana schreibt -> was Redion daraus macht. */
  const ASANA_FELDER: Array<[RegExp, string, string, string]> = [
    /* Muster auf den Spaltennamen | Schlüssel | Anzeigename | Typ */
    [/^name$|^task name$/i,          'title',    'Aufgabe',     'title'],
    [/^section\/column$|^section$/i, 'abschnitt','Abschnitt',   'status'],
    [/^assignee$/i,                  'wer',      'Zuständig',  'text'],
    [/^due date$/i,                  'faellig',  'Fällig',     'date'],
    [/^start date$/i,                'beginn',   'Beginn',      'date'],
    [/^tags$/i,                      'tags',     'Etiketten',   'multi'],
    [/^projects$/i,                  'projekt',  'Projekt',     'text'],
    [/^parent task$/i,               'ueber',    'Gehört zu',  'text'],
    [/^priority$/i,                  'prio',     'Priorität',  'select'],
  ];
  /* Diese vier werden gelesen, aber NICHT zu Spalten: `Notes` wird der
     Seiteninhalt, `Completed At` wird der Haken, die beiden Kennungen
     interessieren niemanden mehr, sobald die Daten hier sind. */
  const ASANA_STUMM = /^notes$|^completed at$|^task id$|^assignee email$|^created at$|^last modified$/i;

  /** Ein Wert wie „a, b, c" wird zur Liste — Asana trennt Etiketten so. */
  const asanaListe = (v: string): string[] =>
    String(v ?? '').split(/\s*,\s*/).map(x => x.trim()).filter(Boolean);

  const ausAsana = (text: string, zielSeite: any, name?: string) => {
    const zeilen = (typeof Csv !== 'undefined')
      ? Csv.zerlege(text).filter((z: string[]) => z.some(x => String(x).trim()))
      : csvZerlegenNot(text);
    if (zeilen.length < 2) throw new Error('Die Datei enthält keine Zeilen');

    const kopf = (zeilen[0] ?? []).map((x: unknown) => String(x ?? '').replace(/^﻿/, '').trim());
    const saetze = zeilen.slice(1);

    /* Erkennt Asana daran, dass „Name" ODER „Task Name" dasteht. Ohne das
       wäre jede beliebige CSV ein Asana-Export, und die Zuordnung unten
       würde raten statt lesen. */
    const titelSpalte = kopf.findIndex(k => /^name$|^task name$/i.test(k));
    if (titelSpalte < 0) throw new Error('Das sieht nicht nach einem Asana-Export aus — die Spalte „Name" fehlt');

    /* Welche Spalte der Datei wird was. */
    type Zuordnung = { i: number; key: string; typ: string };
    const zuordnung: Zuordnung[] = [];
    const schema: Record<string, any> = {};
    let eigene = 0;

    kopf.forEach((spaltenName, i) => {
      if (!spaltenName) return;
      if (ASANA_STUMM.test(spaltenName)) return;
      const treffer = ASANA_FELDER.find(([muster]) => muster.test(spaltenName));
      if (treffer) {
        const [, key, anzeige, typ] = treffer;
        if (schema[key]) return;                 /* zweimal dieselbe Spalte: die erste gewinnt */
        schema[key] = { name: anzeige, type: typ };
        zuordnung.push({ i, key, typ });
      } else {
        /* Ein eigenes Feld von Asana. Der Schlüssel darf nicht rein
           numerisch sein — siehe E96/E172. */
        const key = 'a' + eigene++;
        schema[key] = { name: spaltenName, type: 'text' };
        zuordnung.push({ i, key, typ: 'text' });
      }
    });

    /* Der Haken kommt aus `Completed At`: dort steht ein Datum, wenn die
       Aufgabe fertig ist, und nichts, wenn nicht. */
    const fertigSpalte = kopf.findIndex(k => /^completed at$/i.test(k));
    if (fertigSpalte >= 0) schema['fertig'] = { name: 'Erledigt', type: 'checkbox' };
    const notizSpalte = kopf.findIndex(k => /^notes$/i.test(k));

    /* Die Auswahlspalten brauchen ihre Werte, bevor die erste Zeile da ist —
       sonst steht die Zeile auf einer Option, die es nicht gibt. */
    const werteVon = (i: number) => saetze.map((z: string[]) => String(z[i] ?? '').trim());
    const FARBEN = ['gray', 'blue', 'green', 'orange', 'purple', 'pink', 'red', 'yellow'];
    zuordnung.forEach(z => {
      if (z.typ !== 'status' && z.typ !== 'select' && z.typ !== 'multi') return;
      const roh = werteVon(z.i);
      const alle = z.typ === 'multi'
        ? [...new Set(roh.flatMap(asanaListe))]
        : [...new Set(roh.filter(Boolean))];
      schema[z.key].options = alle.map((n, k) => ({ name: n, color: FARBEN[k % FARBEN.length] }));
    });

    const titel = name || 'Aus Asana';
    const seite = Store.addBlock(zielSeite || null, 'page', { text: titel, icon: '✓' });
    const hatAbschnitt = !!schema['abschnitt'];
    const db = Store.addDatabase(seite.id, titel, schema, hatAbschnitt ? 'board' : 'table');
    if (hatAbschnitt) Store.updateView(db.viewId, { groupBy: 'abschnitt' });

    let n = 0, mitText = 0;
    saetze.forEach((z: string[]) => {
      const props: Record<string, any> = {};
      zuordnung.forEach(zu => {
        const roh = String(z[zu.i] ?? '').trim();
        if (zu.key === 'title') { props['title'] = roh || 'Ohne Titel'; return; }
        if (!roh) return;
        props[zu.key] = zu.typ === 'multi' ? asanaListe(roh)
                      : zu.typ === 'date'  ? roh.slice(0, 10)
                      : roh;
      });
      if (fertigSpalte >= 0) props['fertig'] = !!String(z[fertigSpalte] ?? '').trim();
      if (props['title'] === undefined) props['title'] = 'Ohne Titel';

      const zeile = Store.addRow(db.collectionId, props);
      n++;
      /* Die Beschreibung wird Seiteninhalt, nicht Zellinhalt. */
      const notiz = notizSpalte >= 0 ? String(z[notizSpalte] ?? '').trim() : '';
      if (notiz) { Werkzeuge.ausMarkdown(zeile, notiz); mitText++; }
    });

    return { seite, hinweis: n + ' Aufgaben übernommen, ' + mitText + ' mit Beschreibung' };
  };

  /* Der Not-Zerleger, falls `core/spreadsheet/csv.js` fehlt. Er trennt nur
     bei Komma; das ist schlechter als `Csv.zerlege`, aber besser als nichts,
     und es macht `ausAsana` nicht von einer zweiten Datei abhängig. */
  const csvZerlegenNot = (text: string): string[][] => {
    const raus: string[][] = [];
    let feld = '', zeile: string[] = [], inAnf = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inAnf) {
        if (c === '"' && text[i + 1] === '"') { feld += '"'; i++; }
        else if (c === '"') inAnf = false;
        else feld += c;
      } else if (c === '"') inAnf = true;
      else if (c === ',') { zeile.push(feld); feld = ''; }
      else if (c === '\n') { zeile.push(feld); raus.push(zeile); zeile = []; feld = ''; }
      else if (c !== '\r') feld += c;
    }
    if (feld || zeile.length) { zeile.push(feld); raus.push(zeile); }
    return raus.filter(z => z.some(x => String(x).trim()));
  };

  /* --- Apple Notes (Ordner mit .html) ------------------------------------
   * Apple Notes kann nicht selbst in einem Rutsch exportieren; die üblichen
   * Wege liefern einen ORDNER mit einer HTML-Datei je Notiz, und die Ordner
   * der App werden zu Unterordnern. Beides wird hier abgebildet:
   *
   *     Notizen/Rezepte/Brot.html   ->  Seite „Rezepte" > Seite „Brot"
   *
   * Der Titel kommt aus `<title>`, aus der ersten Überschrift oder aus dem
   * Dateinamen — in dieser Reihenfolge, weil die ersten beiden Umlaute und
   * Satzzeichen behalten, die der Dateiname verloren hat.
   * --------------------------------------------------------------------- */
  const ausAppleNotes = async (dateien: any[], zielSeite: any) => {
    const htmls = dateien.filter(d => /\.html?$/i.test(d.name || ''));
    if (!htmls.length) throw new Error('Keine .html-Dateien in diesem Ordner');

    const wurzel = Store.addBlock(zielSeite || null, 'page', { text: 'Aus Apple Notes', icon: '📒' });
    /* Ordnerpfad -> Seite. Wird beim ersten Bedarf angelegt, damit ein leerer
       Ordner keine leere Seite hinterlaesst. */
    const ordner = new Map<string, any>();
    const ordnerSeite = (pfad: string): any => {
      if (!pfad) return wurzel;
      const da = ordner.get(pfad);
      if (da) return da;
      const teile = pfad.split('/');
      const letzter = teile[teile.length - 1] || pfad;
      const eltern = ordnerSeite(teile.slice(0, -1).join('/'));
      const s = Store.addBlock(eltern.id, 'page', { text: letzter, icon: '📁' });
      ordner.set(pfad, s);
      return s;
    };

    let n = 0;
    for (const d of htmls) {
      const roh = await d.text();
      const doc = new DOMParser().parseFromString(roh, 'text/html');
      const ausDatei = String(d.name || '').replace(/\.html?$/i, '');
      const titel = (doc.querySelector('title')?.textContent || '').trim()
                 || (doc.querySelector('h1, h2')?.textContent || '').trim()
                 || ausDatei;

      /* Der Pfad OHNE das oberste Verzeichnis: das ist der Name des
         gewählten Ordners und steht schon als Wurzelseite da. */
      const voll = String(d.webkitRelativePath || d.name || '');
      const teile = voll.split('/').slice(1, -1);
      const seite = Store.addBlock(ordnerSeite(teile.join('/')).id, 'page', { text: titel });

      /* Die Überschrift, die schon der Titel ist, nicht noch einmal. */
      const erste = doc.querySelector('h1, h2');
      if (erste && (erste.textContent || '').trim() === titel) erste.remove();
      const md = htmlZuMarkdown(doc.body ? doc.body.innerHTML : roh);
      if (md) Werkzeuge.ausMarkdown(seite, md);
      n++;
    }
    Store.updateBlock(wurzel.id, { aufgeklappt: true });
    return { seite: wurzel, hinweis: n + ' Notizen aus ' + (ordner.size || 1) + ' Ordnern übernommen' };
  };

  /* ========================================================================
   * 5. DAS FENSTER
   * ======================================================================*/
  const QUELLEN = [
    ['trello',   '📋', 'Trello',       'Das JSON eines Boards — Listen werden Status, Karten Zeilen', '.json'],
    ['evernote', '🐘', 'Evernote',     'Eine .enex-Datei — jede Notiz wird eine Seite', '.enex,.xml'],
    ['obsidian', '🔮', 'Obsidian',     'Ein ganzer Ordner mit .md-Dateien, Wikilinks werden aufgelöst', 'ordner'],
    ['notion',   '📓', 'Notion-Export','Das ZIP aus Notions eigenem Export', '.zip'],
    ['asana',    '🗒', 'Asana',         'Der CSV-Export — Abschnitte werden Status, Notizen werden Seiten', '.csv'],
    ['apple',    '📒', 'Apple Notes',   'Der Ordner mit den HTML-Dateien — Unterordner bleiben Unterordner', 'ordner'],
    ['csv',      '📊', 'Jira, Monday, sonstige CSV', 'Irgendeine Tabelle — wird zur Datenbank', '.csv'],
    ['markdown', '📄', 'Einzelne Dateien',
     'Markdown, Text, CSV, Word, Excel, OpenDocument, EPUB',
     '.md,.txt,.csv,.docx,.xlsx,.ods,.epub']
  ];

  const dialog = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(660px,95vw)">' +
        '<div class="fh">⭱ Aus einem anderen Werkzeug übernehmen' +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="ax-liste">' + QUELLEN.map(([id, ic, n, t]) =>
          `<button data-q="${id}"><span class="ax-ico">${ic}</span>` +
          `<span class="ax-text"><b>${n}</b><span>${t}</span></span></button>`).join('') + '</div>' +
        '<div class="ax-hinweis">Alles bleibt auf diesem Gerät — die Dateien werden hier ' +
        'gelesen und nirgendwohin geschickt.</div>' +
        '<div class="fbtns"><button data-a="zu">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    /* DIE LISTE ROLLT, UND MAN SOLL DAS SEHEN (E183). Mit acht Quellen passt
       sie am Rechner um 28 px nicht mehr, am Telefon um 127. Erreichbar war
       die letzte immer — sichtbar war nur, dass sie keine Beschreibung hat.
       Dieselbe Antwort wie an der Tabelle: eine weiche Kante, kein Hinweis. */
    if (typeof Rollrand !== 'undefined')
      Rollrand.binde(o.querySelector<HTMLElement>('.ax-liste'), { achse: 'hoch' });

    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const q = elVon(e)?.closest<HTMLElement>('[data-q]');
      if (!q) return;
      const art = q.dataset.q;
      const quelle = QUELLEN.find(x => x[0] === art);
      o.remove();
      /* Ohne passende Quelle gibt es nichts zu öffnen. Vorher las die Zeile
         darunter `quelle[4]` ungeprüft. */
      if (!quelle) return;

      const inp = document.createElement('input');
      inp.type = 'file';
      if (quelle[4] === 'ordner') { inp.webkitdirectory = true; inp.multiple = true; }
      else { inp.accept = quelle[4] ?? ''; inp.multiple = art === 'markdown'; }

      inp.addEventListener('change', async () => {
        const dateien = Array.from(inp.files ?? []);
        if (!dateien.length) return;
        UI.toast('Wird eingelesen …');
        try {
          let erg: any = null;
          const erste = dateien[0];
          if (!erste) return;
          if (art === 'obsidian') erg = await ausMarkdownOrdner(dateien, null);
          else if (art === 'trello')   erg = ausTrello(await erste.text(), null);
          else if (art === 'evernote') erg = ausEvernote(await erste.text(), null);
          else if (art === 'notion')   erg = await ausNotionZip(await erste.arrayBuffer(), null);
          else if (art === 'apple')    erg = await ausAppleNotes(dateien, null);
          else if (art === 'asana')
            erg = ausAsana(await erste.text(), null, erste.name.replace(/\.csv$/i, ''));
          else if (art === 'csv') {
            const text = await erste.text();
            const s = Store.addBlock(null, 'page', { text: erste.name.replace(/\.csv$/i, '') });
            Einlesen.alsDatenbank(s.id, erste.name.replace(/\.csv$/i, ''), Datenbank.csvZerlegen(text));
            erg = { seite: s, hinweis: 'CSV als Datenbank übernommen' };
          } else {
            for (const f of dateien) erg = await Einlesen.datei(f) || erg;
          }
          App.zeichneBaum();
          if (erg && erg.seite) App.oeffne(erg.seite.id);
          UI.toast('✅ ' + ((erg && erg.hinweis) || 'Eingelesen'));
        } catch (err) {
          UI.toast('⛔ ' + (err instanceof Error ? err.message : String(err)));
          if (typeof Pflege !== 'undefined') Pflege.fehlerMerken(err, 'Einlesen ' + art);
        }
      });
      inp.click();
    });
  };

  return { zipSchreiben, crc32, laden, alsWord, alsExcel, datenbankAlsExcel,
           allesAlsExcel, alsOds, datenbankAlsOds, odsBlatt, blattXml, spaltenName, wortInhalt,
           ausTrello, ausEvernote, ausAsana, ausAppleNotes, htmlZuMarkdown,
           ausMarkdownOrdner, alsObsidianVault, ausNotionZip, ausNotionJson,
           dialog, QUELLEN,
           /* Nur für Prüfläufe — siehe die Erklärung bei `grenzen`. Wer sie
              im Betrieb verstellt, schreibt ZIP64, wo es keines braucht:
              gültig, aber ohne Not unlesbar für alte Werkzeuge. */
           grenzen };
})();

(window as any).Austausch = Austausch;
