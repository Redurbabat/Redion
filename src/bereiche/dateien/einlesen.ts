/* ============================================================================
 * import.js — Excel, Word und EPUB einlesen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/dateien/einlesen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/dateien/einlesen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Alle drei Formate sind im Kern dasselbe: ein ZIP-Archiv voller XML-Dateien.
 * Deshalb steht hier zuerst ein kleiner ZIP-Leser, der ohne fremdes Paket
 * auskommt — das Entpacken übernimmt der Browser selbst über
 * DecompressionStream. Danach wird das XML gelesen und in Blöcke übersetzt.
 *
 *   .xlsx   →  eine Datenbank je Tabellenblatt
 *   .docx   →  Überschriften, Absätze, Listen und Tabellen
 *   .epub   →  ein Kapitel je Unterseite
 *
 * Kostenlos, offline, ohne Abhängigkeit.
 * ==========================================================================*/

const Einlesen = (() => {

  /* ========================================================================
   * DER ZIP-LESER
   * ------------------------------------------------------------------------
   * Ein ZIP endet mit dem „End of Central Directory". Von dort steht, wo das
   * Inhaltsverzeichnis liegt; darin steht zu jeder Datei, wo ihre Daten
   * beginnen. Mehr braucht es nicht.
   * ======================================================================*/

  /* ------------------------------------------------------------------------
   * ZIP64 — seit dem 6. August gelesen statt abgelehnt (E39)
   * ------------------------------------------------------------------------
   * Über 65 535 Einträgen oder 4 GB schreiben Werkzeuge ZIP64. Im alten
   * Schlusssatz stehen dann Platzhalter (0xFFFF, 0xFFFFFFFF); die echten
   * Zahlen liegen in einem eigenen Satz davor.
   *
   * DREI STUFEN, und es lohnt sich, sie auseinanderzuhalten:
   *
   *   1. Ungeprüft war das der schlimmste Fall, den es gibt: `blob.slice`
   *      auf einen Versatz von 0xFFFFFFFF gibt einen leeren Ausschnitt, die
   *      Schleife läuft nullmal — **null Dateien und kein Fehler**. Wer eine
   *      Sicherung mit 70 000 Anhängen einspielte, sah „0 Anhänge".
   *   2. Dann eine ehrliche Ablehnung. Besser, aber keine Sicherung.
   *   3. Jetzt gelesen. Redion schreibt solche Archive selbst, seit die
   *      4-GB-Grenze gefallen ist — ein Packer, dessen Leser nicht
   *      mitkommt, schriebe Sicherungen, die niemand zurückholen kann.
   *
   * WARUM AM WEGWEISER UND NICHT AN DEN PLATZHALTERN. Ein gewöhnliches
   * Archiv mit genau 65 535 Einträgen schreibt ebenfalls 0xFFFF in das
   * Anzahlfeld, ohne ZIP64 zu sein. Der Wegweiser (0x07064b50) steht
   * dagegen nur dort, wo wirklich ZIP64 vorliegt — und immer genau 20 Byte
   * vor dem Schlusssatz.
   *
   * UND ZIP64 IST NICHT ALLES-ODER-NICHTS. Pythons `zipfile` schreibt bei
   * einer einzelnen grossen Datei die Platzhalter nur in den lokalen Kopf
   * und lässt Verzeichnis und Schlusssatz gewöhnlich — nachgemessen am
   * 6. August. Solche Archive las Redion schon immer richtig, weil es die
   * Längen aus dem Verzeichnis nimmt. Deshalb wird hier jedes Feld einzeln
   * angesehen und nicht das Archiv als Ganzes eingeordnet.
   * ----------------------------------------------------------------------*/
  const istZip64 = (d: DataView, eocd: number): boolean =>
    eocd >= 20 && d.getUint32(eocd - 20, true) === 0x07064b50;

  /* Acht Byte lesen. `getBigUint64` gäbe ein BigInt, und damit rechnet
     `blob.slice` nicht — also gleich als Zahl. Bis 2^53 ist das exakt; ein
     Archiv jenseits von acht Petabyte gibt es nicht. */
  const lies64 = (d: DataView, i: number): number =>
    d.getUint32(i, true) + d.getUint32(i + 4, true) * 4294967296;

  /**
   * Die echten Zahlen aus dem ZIP64-Zusatzfeld eines Verzeichniseintrags.
   *
   * DIE REIHENFOLGE IST FEST und die Anwesenheit bedingt: roh, gepackt,
   * Versatz — jede Zahl steht nur dann da, wenn das zugehörige 32-Bit-Feld
   * den Platzhalter trägt. Wer stattdessen alle drei erwartet, liest ab der
   * ersten fehlenden Zahl alles verschoben und bekommt Werte, die fast
   * stimmen. Abgelesen an Pythons `zipfile._decodeExtra`, nicht geraten.
   */
  const zip64Zusatz = (
    d: DataView, extraStart: number, extraLaenge: number,
    roh: number, gepackt: number, versatz: number
  ): { roh: number; gepackt: number; versatz: number } => {
    let e = extraStart;
    const ende = extraStart + extraLaenge;
    while (e + 4 <= ende) {
      const kennung = d.getUint16(e, true);
      const laenge  = d.getUint16(e + 2, true);
      if (kennung === 0x0001) {
        let f = e + 4;
        const rest = () => f + 8 <= e + 4 + laenge;
        if (roh     === 0xFFFFFFFF && rest()) { roh     = lies64(d, f); f += 8; }
        if (gepackt === 0xFFFFFFFF && rest()) { gepackt = lies64(d, f); f += 8; }
        if (versatz === 0xFFFFFFFF && rest()) { versatz = lies64(d, f); f += 8; }
        break;
      }
      e += 4 + laenge;
    }
    return { roh, gepackt, versatz };
  };

  const ZIP64_KAPUTT =
    'Dieses Archiv nennt sich ZIP64, aber sein ZIP64-Schlusssatz fehlt oder ' +
    'ist beschädigt. Ohne ihn stünden im alten Schlusssatz nur Platzhalter, ' +
    'und Redion läse aus einem Archiv voller Dateien null Dateien heraus — ' +
    'ohne das zu merken. Lieber diese Meldung.';

  /**
   * Anzahl, Grösse und Ort des Verzeichnisses — aus dem ZIP64-Schlusssatz,
   * wenn es einen gibt, sonst aus dem alten.
   *
   * `z64Satz` ist der ZIP64-Schlusssatz, falls der Aufrufer ihn getrennt
   * holen musste: beim Lesen aus einem Blob deckt `d` nur ein Fenster am
   * Dateiende ab, und bei einem langen Archivkommentar liegt der Satz
   * davor.
   *
   * WARUM HIER GEWORFEN WIRD UND NICHT AUSGEWICHEN. Der erste Entwurf
   * nahm bei einem unlesbaren ZIP64-Satz „ersatzweise" die Zahlen aus dem
   * alten Schlusssatz. Das ist die schlechteste aller Möglichkeiten: dort
   * stehen dann 0xFFFFFFFF, `blob.slice` gibt einen leeren Ausschnitt, und
   * heraus kommen **null Dateien und kein Fehler**. Genau der Fall, gegen
   * den dieser Code einmal geschrieben wurde — beim Umbau auf ZIP64 wäre
   * er beinahe zurückgekehrt. Gefunden hat ihn der eigene Prüflauf.
   */
  const schlussLesen = (d: DataView, eocd: number, z64Satz?: DataView | null) => {
    const anzahl  = d.getUint16(eocd + 10, true);
    const groesse = d.getUint32(eocd + 12, true);
    const start   = d.getUint32(eocd + 16, true);
    if (!istZip64(d, eocd)) return { anzahl, groesse, start, zip64: false };

    const s = z64Satz;
    if (!s || s.byteLength < 56 || s.getUint32(0, true) !== 0x06064b50)
      throw new Error(ZIP64_KAPUTT);
    return { anzahl: lies64(s, 32), groesse: lies64(s, 40),
             start: lies64(s, 48), zip64: true };
  };

  /** Wo der ZIP64-Schlusssatz liegt — absolut, laut Wegweiser. */
  const z64Ort = (d: DataView, eocd: number): number => lies64(d, eocd - 20 + 8);

  /* Ein Archiv, das N Einträge ankündigt und keinen einzigen liefert, ist
     kaputt — und schweigend leer zurückzugeben ist der Fehler, der Leuten
     ihre Anhänge kostet. Diese eine Zeile fängt jede Sorte davon ab. */
  const vollzaehlig = (versprochen: number, gefunden: number): void => {
    if (versprochen > 0 && gefunden === 0)
      throw new Error('Dieses Archiv kündigt ' + versprochen + ' Einträge an, ' +
        'hat aber keinen einzigen an der angegebenen Stelle. Es ist ' +
        'beschädigt oder unvollständig — Redion spielt lieber nichts ein, ' +
        'als so zu tun, als wäre es leer gewesen.');
  };

  const zipLesen = async (puffer: ArrayBuffer): Promise<any> => {
    const d = new DataView(puffer);
    const bytes = new Uint8Array(puffer);

    /* Das Ende des Inhaltsverzeichnisses suchen — höchstens 65 KB Kommentar */
    let eocd = -1;
    for (let i = d.byteLength - 22; i >= Math.max(0, d.byteLength - 65558); i--) {
      if (d.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Das ist kein gültiges ZIP-Archiv.');

    /* Hier liegt das ganze Archiv im Speicher, der ZIP64-Satz also auch —
       er wird nur ausgeschnitten, damit `schlussLesen` beide Wege gleich
       behandeln kann. */
    const z64 = istZip64(d, eocd) ? (() => {
      const o = z64Ort(d, eocd);
      return (o >= 0 && o + 56 <= d.byteLength)
        ? new DataView(puffer, o, 56) : null;
    })() : null;
    const schluss = schlussLesen(d, eocd, z64);
    const anzahl = schluss.anzahl;
    let zeiger = schluss.start;

    const dateien = new Map();

    for (let n = 0; n < anzahl; n++) {
      if (d.getUint32(zeiger, true) !== 0x02014b50) break;
      const methode   = d.getUint16(zeiger + 10, true);
      /* Flags und Prüfsumme standen hier immer — gelesen wurden sie nie (E363). */
      const flags     = d.getUint16(zeiger + 8, true);
      const crc       = d.getUint32(zeiger + 16, true);
      const nameLaenge= d.getUint16(zeiger + 28, true);
      const extra     = d.getUint16(zeiger + 30, true);
      const kommentar = d.getUint16(zeiger + 32, true);
      const name = ZipDetails.nameDecodieren(bytes.subarray(zeiger + 46, zeiger + 46 + nameLaenge), flags);

      /* Erst die 32-Bit-Felder, dann die echten Zahlen aus dem Zusatz —
         aber nur für die Felder, die den Platzhalter tragen. */
      const echt = zip64Zusatz(d, zeiger + 46 + nameLaenge, extra,
                               d.getUint32(zeiger + 24, true),
                               d.getUint32(zeiger + 20, true),
                               d.getUint32(zeiger + 42, true));
      const gepackt = echt.gepackt;
      const offset  = echt.versatz;

      /* Am lokalen Kopf stehen die tatsächlichen Längen der Zusatzfelder */
      const lokalName  = d.getUint16(offset + 26, true);
      const lokalExtra = d.getUint16(offset + 28, true);
      const start = offset + 30 + lokalName + lokalExtra;
      const roh = bytes.subarray(start, start + gepackt);

      dateien.set(name, { methode, roh, flags, crc, groesse: echt.roh });
      zeiger += 46 + nameLaenge + extra + kommentar;
    }
    vollzaehlig(anzahl, dateien.size);

    /* Entpacken übernimmt der Browser — und DANACH wird nachgerechnet (E363):
       ein Eintrag, dessen Bytes nicht zur Prüfsumme passen, ist beschädigt
       und kommt nicht als Datei heraus. Ein verschlüsselter kommt gar nicht
       erst in den Entpacker. */
    const holen = async (name: string): Promise<Uint8Array | null> => {
      const e = dateien.get(name);
      if (!e) return null;
      if (ZipDetails.istVerschluesselt(e.flags))
        throw new Error('„' + name + '" ist verschlüsselt — Redion kann keine verschlüsselten ZIP-Einträge lesen.');
      let ergebnis: Uint8Array;
      if (e.methode === 0) ergebnis = new Uint8Array(e.roh);
      else {
        if (e.methode !== 8) throw new Error('Diese Packmethode kennt der Browser nicht.');
        if (!self.DecompressionStream) throw new Error('Dieser Browser kann kein ZIP entpacken.');
        const strom = new Blob([e.roh]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        ergebnis = new Uint8Array(await new Response(strom).arrayBuffer());
      }
      if (ZipDetails.crc32(ergebnis) !== (e.crc >>> 0))
        throw new Error('„' + name + '" ist beschädigt — die Prüfsumme stimmt nicht.');
      return ergebnis;
    };
    const eintrag = (name: string): any => {
      const e = dateien.get(name);
      return e ? { methode: e.methode, groesse: e.groesse, crc: e.crc >>> 0, flags: e.flags,
                   verschluesselt: ZipDetails.istVerschluesselt(e.flags) } : null;
    };

    const text = async (name: string): Promise<string | null> => {
      const b = await holen(name);
      return b ? new TextDecoder().decode(b) : null;
    };

    /**
     * DIE BYTES, WIE SIE IM ARCHIV STEHEN — ungepackt gelassen.
     *
     * `holen` entpackt immer. Für eine Rundreise ist das falsch: wer eine
     * `.docx` öffnet, EINEN Eintrag ändert und den Rest zurückschreiben
     * will, müsste sonst jeden fremden Eintrag entpacken und neu ablegen.
     * Der Schreiber packt nicht (Methode 0), aus einer 40-KB-Vorlage würde
     * damit eine 300-KB-Datei — gültig, aber ohne Not aufgebläht, und
     * jedes eingebettete Bild läge unkomprimiert darin.
     *
     * Hier kommen die Bytes deshalb unberührt heraus, mit allem, was der
     * Schreiber braucht, um sie wieder einzusetzen: Methode, Prüfsumme,
     * Rohgrösse. Es wird NICHT nachgerechnet — die Bytes werden ja nicht
     * gelesen, sondern weitergereicht; die Prüfsumme des Originals bleibt
     * gültig, solange die Bytes gleich bleiben.
     *
     * Verschlüsselte Einträge kommen auch hier nicht heraus: sie ohne
     * Schlüssel weiterzureichen ergäbe ein Archiv, das niemand öffnen kann.
     */
    const rohBytes = (name: string): any => {
      const e = dateien.get(name);
      if (!e) return null;
      if (ZipDetails.istVerschluesselt(e.flags))
        throw new Error('„' + name + '" ist verschlüsselt — Redion kann ihn nicht weiterreichen.');
      return { methode: e.methode, roh: new Uint8Array(e.roh), crc: e.crc >>> 0,
               groesse: e.groesse, gepackt: e.roh.length };
    };

    return { namen: [...dateien.keys()], holen, text, eintrag, rohBytes };
  };

  /**
   * Dasselbe für ein Archiv, das nicht in den Arbeitsspeicher passt.
   *
   * WARUM ES BEIDE GIBT. `zipLesen` bekommt einen ArrayBuffer — das ganze
   * Archiv liegt dann im Speicher. Für eine Word-Datei ist das richtig und
   * einfach. Für eine Redion-Sicherung mit einem Video darin ist es das
   * Ende: `await datei.arrayBuffer()` auf ein halbes Gigabyte bringt ein
   * Telefon zu Fall.
   *
   * Ein ZIP kommt einem dabei entgegen. Sein Inhaltsverzeichnis steht am
   * ENDE; man liest die letzten paar Kilobyte, weiss danach, wo jeder
   * Eintrag anfängt und wie lang er ist — und holt sich nur den, den man
   * gerade braucht. `blob.slice` schneidet, ohne zu lesen.
   *
   * Zurück kommt deshalb ein **Blob** je Eintrag und kein Byte-Feld: wer ihn
   * weiterreicht, ohne ihn anzusehen, hat ihn nie im Speicher gehabt.
   */
  const zipLesenAusBlob = async (blob: Blob): Promise<any> => {
    const fensterStart = Math.max(0, blob.size - 65558);
    const ende = new DataView(await blob.slice(fensterStart).arrayBuffer());

    let eocd = -1;
    for (let i = ende.byteLength - 22; i >= 0; i--)
      if (ende.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('Das ist kein gültiges ZIP-Archiv.');

    /* DEN ZIP64-SATZ HOLT SICH DIESER WEG SELBST, per absolutem Versatz aus
       dem Blob. Ihn aus dem Fenster zu schneiden wäre naheliegend und in
       den meisten Fällen richtig — aber bei einem langen Archivkommentar
       liegt er davor, und dann läse man an einer beliebigen Stelle nach.
       Ein `slice` kostet nichts; eine Sicherung, die daran scheitert,
       kostet alles. */
    const z64 = istZip64(ende, eocd)
      ? await (async () => {
          const o = z64Ort(ende, eocd);
          if (o < 0 || o + 56 > blob.size) return null;
          return new DataView(await blob.slice(o, o + 56).arrayBuffer());
        })()
      : null;
    const schluss = schlussLesen(ende, eocd, z64);
    const anzahl = schluss.anzahl;
    const vzGroesse = schluss.groesse;
    const vzStart = schluss.start;

    const vz = new DataView(await blob.slice(vzStart, vzStart + vzGroesse).arrayBuffer());
    const vzBytes = new Uint8Array(vz.buffer);
    const dateien = new Map();
    let zeiger = 0;

    for (let n = 0; n < anzahl; n++) {
      if (zeiger + 46 > vz.byteLength || vz.getUint32(zeiger, true) !== 0x02014b50) break;
      const methode    = vz.getUint16(zeiger + 10, true);
      const flags      = vz.getUint16(zeiger + 8, true);
      const crc        = vz.getUint32(zeiger + 16, true);
      const nameLaenge = vz.getUint16(zeiger + 28, true);
      const extra      = vz.getUint16(zeiger + 30, true);
      const kommentar  = vz.getUint16(zeiger + 32, true);
      const name = ZipDetails.nameDecodieren(vzBytes.subarray(zeiger + 46, zeiger + 46 + nameLaenge), flags);
      const echt = zip64Zusatz(vz, zeiger + 46 + nameLaenge, extra,
                               vz.getUint32(zeiger + 24, true),
                               vz.getUint32(zeiger + 20, true),
                               vz.getUint32(zeiger + 42, true));
      dateien.set(name, { methode, gepackt: echt.gepackt, roh: echt.roh, offset: echt.versatz, flags, crc });
      zeiger += 46 + nameLaenge + extra + kommentar;
    }
    vollzaehlig(anzahl, dateien.size);

    /* Die Längen der Zusatzfelder stehen am lokalen Kopf noch einmal, und
       zwar oft anders als im Verzeichnis. Wer das Verzeichnis glaubt, liest
       um ein paar Byte verschoben — und bekommt Daten, die fast stimmen. */
    /* DIE PRÜFSUMME SCHEIBCHENWEISE (E363): ein Blob liegt beim Browser,
       nicht im Arbeitsspeicher — geprüft wird er in Stücken von einem
       Megabyte, wie der Schreiber ihn rechnet. Ein beschädigter Eintrag
       kam vorher als vollständige Datei heraus, still. */
    const SCHEIBE = 1024 * 1024;
    const pruefsumme = async (name: string, b: Blob, soll: number): Promise<void> => {
      let z = ZipDetails.crc32Start();
      for (let von = 0; von < b.size; von += SCHEIBE)
        z = ZipDetails.crc32Weiter(z, new Uint8Array(await b.slice(von, Math.min(von + SCHEIBE, b.size)).arrayBuffer()));
      if (ZipDetails.crc32Fertig(z) !== (soll >>> 0))
        throw new Error('„' + name + '" ist beschädigt — die Prüfsumme stimmt nicht.');
    };
    const alsBlob = async (name: string): Promise<Blob | null> => {
      const e = dateien.get(name);
      if (!e) return null;
      if (ZipDetails.istVerschluesselt(e.flags))
        throw new Error('„' + name + '" ist verschlüsselt — Redion kann keine verschlüsselten ZIP-Einträge lesen.');
      const k = new DataView(await blob.slice(e.offset, e.offset + 30).arrayBuffer());
      const lokalName  = k.getUint16(26, true);
      const lokalExtra = k.getUint16(28, true);
      const start = e.offset + 30 + lokalName + lokalExtra;
      const roh = blob.slice(start, start + e.gepackt);
      let ergebnis: Blob;
      if (e.methode === 0) ergebnis = roh;
      else {
        if (e.methode !== 8) throw new Error('Diese Packmethode kennt der Browser nicht.');
        if (!self.DecompressionStream) throw new Error('Dieser Browser kann kein ZIP entpacken.');
        const strom = roh.stream().pipeThrough(new DecompressionStream('deflate-raw'));
        ergebnis = await new Response(strom).blob();
      }
      await pruefsumme(name, ergebnis, e.crc);
      return ergebnis;
    };

    const holen = async (name: string): Promise<Uint8Array | null> => {
      const b = await alsBlob(name);
      return b ? new Uint8Array(await b.arrayBuffer()) : null;
    };
    const text = async (name: string): Promise<string | null> => {
      const b = await alsBlob(name);
      return b ? await b.text() : null;
    };

    /* DIE ROHGRÖSSE VOR DEM ENTPACKEN (E350). Sie steht im Verzeichnis; wer
       sie kennt, schickt einen Eintrag, der 1 KB gepackt und 10 GB roh ist,
       gar nicht erst durch den Entpacker. -1 heisst: unbekannt. */
    const groesse = (name: string): number => {
      const e = dateien.get(name);
      return e && Number.isFinite(Number(e.roh)) ? Number(e.roh) : -1;
    };

    /** Was das Verzeichnis über einen Eintrag sagt — vor dem ersten Byte (E363). */
    const eintrag = (name: string): any => {
      const e = dateien.get(name);
      return e ? { methode: e.methode, groesse: Number(e.roh), gepackt: Number(e.gepackt), crc: e.crc >>> 0,
                   flags: e.flags, verschluesselt: ZipDetails.istVerschluesselt(e.flags) } : null;
    };

    /**
     * Dasselbe Durchreichen wie in `zipLesen`, nur als Blob — hier liegt das
     * Archiv nicht im Speicher, und ein Video als `Uint8Array` wäre genau
     * der Sturz, den dieser Leser vermeidet. Der Schreiber nimmt Blobs
     * ohnehin entgegen, ohne sie ganz zu laden.
     */
    const rohBytes = async (name: string): Promise<any> => {
      const e = dateien.get(name);
      if (!e) return null;
      if (ZipDetails.istVerschluesselt(e.flags))
        throw new Error('„' + name + '" ist verschlüsselt — Redion kann ihn nicht weiterreichen.');
      const k = new DataView(await blob.slice(e.offset, e.offset + 30).arrayBuffer());
      const start = e.offset + 30 + k.getUint16(26, true) + k.getUint16(28, true);
      return { methode: e.methode, roh: blob.slice(start, start + e.gepackt), crc: e.crc >>> 0,
               groesse: Number(e.roh), gepackt: Number(e.gepackt) };
    };

    return { namen: [...dateien.keys()], alsBlob, holen, text, groesse, eintrag, rohBytes };
  };

  const xml = (t: string): Document => new DOMParser().parseFromString(t, 'application/xml');

  /* ========================================================================
   * EXCEL
   * ------------------------------------------------------------------------
   * Zellen stehen in sheet1.xml, Texte meist ausgelagert in sharedStrings.xml.
   * Die Spaltenbuchstaben werden in Nummern zurückgerechnet, damit leere
   * Zellen nicht die Reihenfolge verschieben.
   * ======================================================================*/
  const spalteZuNummer = (bezug: string): number => {
    const m = String(bezug).match(/^([A-Z]+)/);
    if (!m) return 0;
    let n = 0;
    for (const c of m[1] ?? '') n = n * 26 + (c.charCodeAt(0) - 64);
    return n - 1;
  };

  type TabellenVerluste = {
    formelnOhneAusdruck: number;
    kommentare: number;
    bedingteFormatierungen: number;
    bilder: number;
    diagramme: number;
    makros: number;
    zellformate: number;
    verbundeneZellen: number;
  };

  type TabellenImportBericht = {
    formeln: number;
    ausgelassen: TabellenVerluste;
  };

  const neuerTabellenBericht = (): TabellenImportBericht => ({
    formeln: 0,
    ausgelassen: {
      formelnOhneAusdruck: 0, kommentare: 0, bedingteFormatierungen: 0,
      bilder: 0, diagramme: 0, makros: 0, zellformate: 0,
      verbundeneZellen: 0
    }
  });

  const berichtAn = (blaetter: any[], bericht: TabellenImportBericht): any[] => {
    (blaetter as any).bericht = bericht;
    return blaetter;
  };

  /** Nutzertext für die Vorschau vor der ersten Mutation. */
  const tabellenBerichtText = (bericht: TabellenImportBericht | null | undefined): string => {
    if (!bericht) return '';
    const namen: Record<string, string> = {
      formelnOhneAusdruck: 'Formeln ohne Redion-kompatiblen Ausdruck',
      kommentare: 'Zellkommentare',
      bedingteFormatierungen: 'bedingte Formatierungen',
      bilder: 'Bilder', diagramme: 'Diagramme', makros: 'Makros',
      zellformate: 'nicht unterstützte Zellformate',
      verbundeneZellen: 'verbundene Zellen'
    };
    const verloren = Object.entries(bericht.ausgelassen || {})
      .filter(([, n]) => Number(n) > 0)
      .map(([k, n]) => `${n} ${namen[k] || k}`);
    const teile: string[] = [];
    if (bericht.formeln) teile.push(`${bericht.formeln} Formeln werden als Formeln übernommen`);
    if (verloren.length) teile.push('Nicht übernommen: ' + verloren.join(' · '));
    return teile.join('\n');
  };

  /** Ziel eines OPC-Bezugs relativ zur Quelldatei normalisieren. */
  const paketZiel = (quelle: string, ziel: string): string => {
    if (ziel.startsWith('/')) return ziel.replace(/^\/+/, '');
    const teile = quelle.split('/');
    teile.pop();
    for (const t of ziel.replace(/\\/g, '/').split('/')) {
      if (!t || t === '.') continue;
      if (t === '..') teile.pop(); else teile.push(t);
    }
    return teile.join('/');
  };

  /** ODF-Zellbezüge zurück in Redions A1-Schreibweise. */
  const formelAussen = (text: string, aendere: (teil: string) => string): string => {
    let raus = '', frei = '', i = 0;
    const freiLeeren = () => { raus += aendere(frei); frei = ''; };
    while (i < text.length) {
      const c = text[i] ?? '';
      if (c !== '"') { frei += c; i++; continue; }
      freiLeeren(); raus += c; i++;
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

  const formelAusOds = (roh: unknown): string | null => {
    let f = String(roh ?? '').trim();
    if (!f) return null;
    f = f.replace(/^[A-Za-z0-9_-]+:=/, '');
    f = formelAussen(f, teil => teil
      .replace(/\[\.(\$?[A-Z]{1,3}\$?\d+):\.(\$?[A-Z]{1,3}\$?\d+)\]/g, '$1:$2')
      .replace(/\[\.(\$?[A-Z]{1,3}\$?\d+)\]/g, '$1'));
    /* Blatt-, Datei- und Matrixbezüge in eckigen Klammern gehören nicht zu
       Redions Formelmodell. Den zwischengespeicherten Wert behalten wir,
       aber behaupten im Bericht nicht, der Ausdruck sei übernommen. */
    if (formelAussen(f, teil => /[\[\]]/.test(teil) ? '[' : '').includes('[')) return null;
    return '=' + f.replace(/^=/, '');
  };

  /* ==========================================================================
   * ODS — das Tabellenformat von LibreOffice und OpenOffice
   * --------------------------------------------------------------------------
   * WARUM ÜBERHAUPT. Wer keine Excel-Lizenz hat, speichert in .ods — das ist
   * der Normalfall auf einem Linux-Rechner und in vielen Schulen und
   * Verwaltungen. Eine Tabellen-App, die dieses Format nicht lesen kann,
   * sagt solchen Leuten: hol dir erst Excel.
   *
   * WIE ES GEBAUT IST. Ein ODS ist ein ZIP mit `content.xml` darin. Die
   * Tabellen stehen als `<table:table>`, die Zeilen als `<table:table-row>`,
   * die Zellen als `<table:table-cell>`.
   *
   * ZWEI DINGE, DIE MAN LEICHT ÜBERSIEHT UND DIE ALLES VERSCHIEBEN:
   *
   *   1. WIEDERHOLUNGEN. Steht in zehn Zellen nebeneinander dasselbe — oder
   *      nichts —, schreibt LibreOffice EINE Zelle mit
   *      `table:number-columns-repeated="10"`. Wer das ignoriert, bekommt
   *      eine Tabelle, in der ab der ersten Lücke jede Spalte verrutscht
   *      ist. Dasselbe für Zeilen.
   *
   *   2. DER SCHWANZ. Am Ende jedes Blattes stehen oft tausend leere Zeilen
   *      mit einer einzigen Wiederholungsangabe — „ab hier ist bis Zeile
   *      1048576 nichts". Wer die ausrollt, baut eine Million leerer Zeilen
   *      und friert den Browser ein. Deshalb wird die Wiederholung gedeckelt
   *      und am Schluss abgeschnitten, was leer ist.
   *
   * DER WERT steht als Zahl in `office:value` und als Text in `<text:p>`.
   * Genommen wird die Zahl, wenn es eine gibt — sonst käme aus „1.450,50"
   * beim Rechnen nichts heraus.
   * ========================================================================*/

  const ODS_MAX_WIEDERHOLUNG = 1024;

  const odsLesen = async (puffer: ArrayBuffer): Promise<any[]> => {
    const zip = await zipLesen(puffer);
    const bericht = neuerTabellenBericht();
    const text = await zip.text('content.xml');
    if (!text) throw new Error('Diese .ods-Datei hat keine content.xml — ' +
                               'entweder ist sie beschädigt oder es ist keine.');
    const doc = xml(text);
    bericht.ausgelassen.bilder = zip.namen.filter((n: string) => /^Pictures\/.+/.test(n)).length;
    bericht.ausgelassen.diagramme = doc.getElementsByTagName('draw:object').length;
    bericht.ausgelassen.makros = zip.namen.filter((n: string) => /^(Basic|Scripts)\//.test(n)).length;
    bericht.ausgelassen.kommentare = doc.getElementsByTagName('office:annotation').length;
    bericht.ausgelassen.bedingteFormatierungen = doc.getElementsByTagName('style:map').length;
    bericht.ausgelassen.verbundeneZellen = [...doc.getElementsByTagName('table:table-cell')]
      .filter(c => +(c.getAttribute('table:number-columns-spanned') || 1) > 1 ||
                   +(c.getAttribute('table:number-rows-spanned') || 1) > 1).length;

    /* Die Zellstile (E97) aus den automatic-styles — übernommen wird, was
       Redion kennt: fett, kursiv, Ausrichtung, Prozent, Währung. */
    const zellStil = new Map<string, any>();
    const zellStilVerlust = new Set<string>();
    {
      const daten = new Map<string, any>();
      for (const n of [...doc.getElementsByTagName('number:percentage-style')]) {
        const dp = +(n.getElementsByTagName('number:number')[0]
          ?.getAttribute('number:decimal-places') || 0);
        daten.set(n.getAttribute('style:name') || '', { art: 'prozent', stellen: dp });
      }
      for (const n of [...doc.getElementsByTagName('number:currency-style')]) {
        const dp = +(n.getElementsByTagName('number:number')[0]
          ?.getAttribute('number:decimal-places') || 0);
        const sym = (n.getElementsByTagName('number:currency-symbol')[0]
          ?.textContent || 'CHF').trim();
        daten.set(n.getAttribute('style:name') || '',
          { art: 'waehrung', stellen: dp, waehrung: sym });
      }
      for (const s of [...doc.getElementsByTagName('style:style')]) {
        if (s.getAttribute('style:family') !== 'table-cell') continue;
        const stilName = s.getAttribute('style:name') || '';
        const st: any = {};
        const schrift = s.getElementsByTagName('style:text-properties')[0];
        if (schrift?.getAttribute('fo:font-weight') === 'bold') st.fett = true;
        if (schrift?.getAttribute('fo:font-style') === 'italic') st.kursiv = true;
        const absatz = s.getElementsByTagName('style:paragraph-properties')[0];
        const quer = absatz?.getAttribute('fo:text-align') || '';
        if (quer === 'start' || quer === 'left') st.ausrichtung = 'links';
        if (quer === 'center') st.ausrichtung = 'mitte';
        if (quer === 'end' || quer === 'right') st.ausrichtung = 'rechts';
        const dsn = s.getAttribute('style:data-style-name');
        if (dsn && daten.has(dsn)) st.format = daten.get(dsn);
        if (Object.keys(st).length) zellStil.set(stilName, st);
        const zellEig = s.getElementsByTagName('style:table-cell-properties')[0];
        if ((schrift && [...schrift.attributes].some(a =>
              !['fo:font-weight', 'fo:font-style'].includes(a.name))) ||
            (zellEig && zellEig.attributes.length) ||
            (absatz && [...absatz.attributes].some(a => a.name !== 'fo:text-align')) ||
            (dsn && !daten.has(dsn))) zellStilVerlust.add(stilName);
      }
    }

    /* `getElementsByTagName` mit dem vollen Namen: `querySelectorAll` kommt
       mit dem Doppelpunkt im Namensraum nicht zurecht. */
    const tabellen = [...doc.getElementsByTagName('table:table')];
    const blaetter: any[] = [];

    for (const tab of tabellen) {
      const name = tab.getAttribute('table:name') || 'Blatt';
      const zeilen: any[][] = [];
      const stile: any[][] = [];
      const formeln: (string | null)[][] = [];

      for (const row of [...tab.getElementsByTagName('table:table-row')]) {
        const wieOft = Math.min(
          Number(row.getAttribute('table:number-rows-repeated') || 1) || 1,
          ODS_MAX_WIEDERHOLUNG);
        const werte: any[] = [];
        const stilWerte: any[] = [];
        const formelWerte: (string | null)[] = [];

        for (const c of [...row.getElementsByTagName('table:table-cell')]) {
          const malSo = Math.min(
            Number(c.getAttribute('table:number-columns-repeated') || 1) || 1,
            ODS_MAX_WIEDERHOLUNG);
          const zahl = c.getAttribute('office:value');
          const absatzIstKommentar = (p: Element): boolean => {
            let el = p.parentElement;
            while (el && el !== c) {
              if (el.localName === 'annotation' || el.tagName === 'office:annotation') return true;
              el = el.parentElement;
            }
            return false;
          };
          const wert = zahl !== null && zahl !== ''
            ? Number(zahl)
            : [...c.getElementsByTagName('text:p')]
                .filter(p => !absatzIstKommentar(p))
                .map(x => x.textContent ?? '').join('\n');
          const stName = c.getAttribute('table:style-name');
          const st = stName ? (zellStil.get(stName) ?? null) : null;
          const formelAttribut = c.getAttribute('table:formula');
          const formel = formelAttribut ? formelAusOds(formelAttribut) : null;
          const vorkommen = malSo * wieOft;
          if (formelAttribut) {
            if (formel) bericht.formeln += vorkommen;
            else bericht.ausgelassen.formelnOhneAusdruck += vorkommen;
          }
          if (stName && zellStilVerlust.has(stName))
            bericht.ausgelassen.zellformate += vorkommen;
          for (let i = 0; i < malSo; i++) {
            werte.push(wert); stilWerte.push(st); formelWerte.push(formel);
          }
        }

        /* Rechts abschneiden, was leer ist — sonst schleppt jede Zeile die
           ausgerollten Wiederholungen mit. Die Stile laufen synchron. */
        while (werte.length && (werte[werte.length - 1] === '' ||
                                werte[werte.length - 1] === undefined) &&
               !formelWerte[werte.length - 1] && !stilWerte[werte.length - 1]) werte.pop();
        stilWerte.length = werte.length;
        formelWerte.length = werte.length;
        for (let i = 0; i < wieOft; i++) {
          zeilen.push([...werte]); stile.push([...stilWerte]); formeln.push([...formelWerte]);
        }
      }

      /* Und unten dasselbe. */
      while (zeilen.length && !(zeilen[zeilen.length - 1] ?? []).length) zeilen.pop();
      stile.length = zeilen.length;
      formeln.length = zeilen.length;
      blaetter.push({ name, zeilen, stile, formeln });
    }
    return berichtAn(blaetter, bericht);
  };

  const xlsxLesen = async (puffer: ArrayBuffer): Promise<any[]> => {
    const zip = await zipLesen(puffer);
    const bericht = neuerTabellenBericht();
    bericht.ausgelassen.bilder = zip.namen.filter((n: string) => /^xl\/media\/.+/.test(n)).length;
    bericht.ausgelassen.diagramme = zip.namen.filter((n: string) => /^xl\/charts\/.+\.xml$/i.test(n)).length;
    bericht.ausgelassen.makros = zip.namen.filter((n: string) => /vbaProject\.bin$/i.test(n)).length;
    for (const name of zip.namen.filter((n: string) => /^xl\/comments\d*\.xml$/i.test(n))) {
      const kommentarText = await zip.text(name);
      if (kommentarText) bericht.ausgelassen.kommentare += xml(kommentarText).querySelectorAll('comment').length;
    }

    /* Gemeinsame Texte */
    const stText = await zip.text('xl/sharedStrings.xml');
    const gemeinsam: string[] = [];
    if (stText) {
      xml(stText).querySelectorAll('si').forEach(si => {
        gemeinsam.push([...si.querySelectorAll('t')].map(t => t.textContent ?? '').join(''));
      });
    }

    /* Die Zellstile (E97): cellXfs verweisen auf Schriften und
       Zahlenformate. Übernommen wird, was Redion selbst kennt —
       fett, kursiv, Ausrichtung, Prozent, Währung. Der Rest der
       styles.xml (Farben, Rahmen, Füllungen) bleibt bewusst liegen. */
    const stilText = await zip.text('xl/styles.xml');
    let xfListe: any[] = [];
    let xfVerlust: boolean[] = [];
    if (stilText) {
      const sdoc = xml(stilText);
      const schriften = [...sdoc.querySelectorAll('fonts > font')].map(f => ({
        fett: !!f.querySelector('b'), kursiv: !!f.querySelector('i')
      }));
      const eigene = new Map<string, string>();
      sdoc.querySelectorAll('numFmts > numFmt').forEach(n =>
        eigene.set(n.getAttribute('numFmtId') || '', n.getAttribute('formatCode') || ''));
      const formatVon = (id: number): any => {
        if (!id) return undefined;
        /* 9 und 10 sind Excels eingebaute Prozentformate. */
        if (id === 9) return { art: 'prozent', stellen: 0 };
        if (id === 10) return { art: 'prozent', stellen: 2 };
        const code = eigene.get(String(id)) || '';
        if (!code) return undefined;
        if (code.includes('%')) {
          const m = /0\.(0+)%/.exec(code);
          return { art: 'prozent', stellen: m && m[1] ? m[1].length : 0 };
        }
        const w = /"([^"]+)"/.exec(code);
        if (w && w[1]) {
          const m = /0\.(0+)/.exec(code);
          return { art: 'waehrung', stellen: m && m[1] ? m[1].length : 0,
                   waehrung: w[1].trim() };
        }
        return undefined;
      };
      xfListe = [...sdoc.querySelectorAll('cellXfs > xf')].map(x => {
        const schrift = schriften[+(x.getAttribute('fontId') || 0)] ||
                        { fett: false, kursiv: false };
        const quer = x.querySelector('alignment')?.getAttribute('horizontal') || '';
        const aus = quer === 'left' ? 'links' : quer === 'center' ? 'mitte'
                  : quer === 'right' ? 'rechts' : undefined;
        const format = formatVon(+(x.getAttribute('numFmtId') || 0));
        const st: any = {};
        if (schrift.fett) st.fett = true;
        if (schrift.kursiv) st.kursiv = true;
        if (aus) st.ausrichtung = aus;
        if (format) st.format = format;
        return Object.keys(st).length ? st : null;
      });
      xfVerlust = [...sdoc.querySelectorAll('cellXfs > xf')].map(x => {
        const numFmtId = +(x.getAttribute('numFmtId') || 0);
        const originalFont = sdoc.querySelectorAll('fonts > font')[+(x.getAttribute('fontId') || 0)];
        const ausrichtung = x.querySelector('alignment');
        const unbekannteAusrichtung = !!ausrichtung && [...ausrichtung.attributes]
          .some(a => a.name !== 'horizontal');
        const unbekannteSchrift = !!originalFont && !!originalFont.querySelector('color,u,strike,vertAlign');
        return +(x.getAttribute('fillId') || 0) > 0 ||
               +(x.getAttribute('borderId') || 0) > 0 ||
               !!x.querySelector('protection') || unbekannteAusrichtung ||
               unbekannteSchrift || (!!numFmtId && !formatVon(numFmtId));
      });
    }

    /* Blattnamen UND ihre echten OPC-Beziehungen aus der Mappe. `sheet1.xml`
       muss nicht Blatt 1 sein; fremde Schreiber dürfen beliebige Dateinamen
       und Relationship-Reihenfolgen verwenden. Die alte numerische Sortierung
       konnte deshalb Namen und Inhalt vertauschen. */
    const wbText = await zip.text('xl/workbook.xml');
    const meta: { name: string; id: string }[] = [];
    if (wbText) xml(wbText).querySelectorAll('sheet').forEach(s => meta.push({
      name: s.getAttribute('name') || '',
      id: s.getAttribute('r:id') ||
          s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || ''
    }));
    const beziehungen = new Map<string, string>();
    const relText = await zip.text('xl/_rels/workbook.xml.rels');
    if (relText) xml(relText).querySelectorAll('Relationship').forEach(r => {
      if (r.getAttribute('TargetMode') === 'External') return;
      const id = r.getAttribute('Id') || '';
      const ziel = r.getAttribute('Target') || '';
      if (id && ziel) beziehungen.set(id, paketZiel('xl/workbook.xml', ziel));
    });

    /* Jedes Blatt einlesen */
    const blaetter = [];
    const rueckfall = zip.namen.filter((n: any) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
      .sort((a: any, b: any) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));
    const blattDateien = meta.length
      ? meta.map((m, i) => ({ name: m.name || ('Blatt ' + (i + 1)),
                             datei: beziehungen.get(m.id) || rueckfall[i] || '' }))
            .filter(x => !!x.datei && zip.namen.includes(x.datei))
      : rueckfall.map((datei: string, i: number) => ({ name: 'Blatt ' + (i + 1), datei }));

    for (let i = 0; i < blattDateien.length; i++) {
      const quelle = blattDateien[i]!;
      const t = await zip.text(quelle.datei);
      if (!t) continue;
      const doc = xml(t);
      const zeilen: any[][] = [];
      const stile: any[][] = [];
      const formeln: (string | null)[][] = [];
      bericht.ausgelassen.bedingteFormatierungen += doc.querySelectorAll('conditionalFormatting').length;
      bericht.ausgelassen.verbundeneZellen += doc.querySelectorAll('mergeCell').length;

      doc.querySelectorAll('row').forEach(row => {
        const werte = [];
        const stilWerte: any[] = [];
        const formelWerte: (string | null)[] = [];
        row.querySelectorAll('c').forEach(c => {
          const spalte = spalteZuNummer(c.getAttribute('r') || '');
          const typ = c.getAttribute('t');
          let wert = '';
          if (typ === 's') {
            const idx = +(c.querySelector('v')?.textContent || -1);
            wert = gemeinsam[idx] ?? '';
          } else if (typ === 'inlineStr') {
            wert = [...c.querySelectorAll('t')].map(x => x.textContent).join('');
          } else {
            wert = c.querySelector('v')?.textContent || '';
          }
          werte[spalte] = wert;
          const sIx = c.getAttribute('s');
          stilWerte[spalte] = sIx !== null ? (xfListe[+sIx] ?? null) : null;
          if (sIx !== null && xfVerlust[+sIx]) bericht.ausgelassen.zellformate++;
          const f = c.querySelector('f');
          if (f) {
            const ausdruck = (f.textContent || '').trim();
            formelWerte[spalte] = ausdruck ? '=' + ausdruck : null;
            if (ausdruck) bericht.formeln++;
            else bericht.ausgelassen.formelnOhneAusdruck++;
          } else formelWerte[spalte] = null;
        });
        for (let k = 0; k < werte.length; k++) {
          if (werte[k] === undefined) werte[k] = '';
          if (stilWerte[k] === undefined) stilWerte[k] = null;
          if (formelWerte[k] === undefined) formelWerte[k] = null;
        }
        stile.push(stilWerte);
        formeln.push(formelWerte);
        zeilen.push(werte);
      });

      blaetter.push({ name: quelle.name, zeilen, stile, formeln });
    }
    return berichtAn(blaetter, bericht);
  };

  /* ========================================================================
   * WORD
   * ======================================================================*/
  /**
   * EIN ABSATZ MIT SEINER AUSZEICHNUNG (L72 Teil 2, E315).
   *
   * Hier stand `[...getElementsByTagName('w:t')].map(…).join('')` — nur der
   * Text. Fett und kursiv standen in `w:rPr` daneben und wurden
   * weggeworfen; wer eine Word-Datei einlas, bekam eine graue Wand.
   *
   * Gelesen wird je LAUF, und zurückgeschrieben über denselben Kern, den
   * der Export benutzt (`core/text/inline.ts`). Damit passen die beiden
   * Richtungen zusammen — das ist der ganze Grund, warum der Kern
   * überhaupt einer ist.
   *
   * `w:tab` und `w:br` sind keine Läufe, sondern Zeichen: ohne sie klebt
   * das Wort davor am Wort danach.
   */
  const absatzText = (absatz: any): string => {
    const laeufe: any[] = [];
    for (const r of absatz.getElementsByTagName('w:r')) {
      const eig = r.getElementsByTagName('w:rPr')[0];
      /* `w:b w:val="0"` heisst AUSDRÜCKLICH nicht fett — Word schreibt das,
         wenn eine Vorlage fett ist und ein Lauf es zurücknimmt. */
      const an = (name: string): boolean => {
        const e = eig?.getElementsByTagName('w:' + name)[0];
        if (!e) return false;
        const v = e.getAttribute('w:val');
        return v !== '0' && v !== 'false' && v !== 'none';
      };
      let text = '';
      for (const kind of r.children) {
        if (kind.tagName === 'w:t') text += kind.textContent || '';
        else if (kind.tagName === 'w:tab') text += '\t';
        else if (kind.tagName === 'w:br') text += ' ';
      }
      if (!text) continue;
      /* FESTE BREITE IST AUCH EINE AUSZEICHNUNG. Der Export schreibt für
         `code` ein `w:rFonts w:ascii="Consolas"`; wer sie hier nicht
         zurückliest, verliert sie beim Rundlauf — und die beiden
         Richtungen laufen genau da auseinander, wo der gemeinsame Kern sie
         zusammenhalten sollte.
         Erkannt wird die FAMILIE, nicht der eine Name: eine Word-Datei aus
         fremder Hand schreibt „Courier New" oder „Consolas", nicht das,
         was Redion schreibt. */
      const schrift = String(eig?.getElementsByTagName('w:rFonts')[0]
        ?.getAttribute('w:ascii') || '');
      const fest = /consol|courier|mono|menlo|liberation mono/i.test(schrift);
      laeufe.push({ text, fett: an('b'), kursiv: an('i'), durch: an('strike'),
                    code: fest });
    }
    /* Gleich ausgezeichnete Nachbarn zusammenlegen: Word zerschneidet einen
       Satz gern in fünf Läufe, und `**a****b**` wäre daraus geworden. */
    const glatt: any[] = [];
    for (const l of laeufe) {
      const vor = glatt[glatt.length - 1];
      if (vor && vor.fett === l.fett && vor.kursiv === l.kursiv &&
          vor.durch === l.durch && vor.code === l.code)
        vor.text += l.text;
      else glatt.push({ ...l });
    }
    return Inline.schreiben(glatt).trim();
  };

  const docxLesen = async (puffer: ArrayBuffer): Promise<any> => {
    const zip = await zipLesen(puffer);
    const t = await zip.text('word/document.xml');
    if (!t) throw new Error('In dieser Datei steckt kein Word-Dokument.');
    const doc = xml(t);
    const bloecke = [];

    const koerper = doc.getElementsByTagName('w:body')[0] || doc.documentElement;

    for (const knoten of koerper.children) {
      const tag = knoten.tagName;

      if (tag === 'w:p') {
        const text = absatzText(knoten);
        const stil = knoten.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || '';
        const nummeriert = knoten.getElementsByTagName('w:numPr').length > 0;
        if (!text) continue;

        if (/^Heading1|^berschrift1|^Title/i.test(stil.replace(/\s/g, ''))) bloecke.push({ typ: 'h1', text });
        else if (/^Heading2|^berschrift2/i.test(stil.replace(/\s/g, ''))) bloecke.push({ typ: 'h2', text });
        else if (/^Heading[3-6]|^berschrift[3-6]/i.test(stil.replace(/\s/g, ''))) bloecke.push({ typ: 'h3', text });
        else if (/Quote|Zitat/i.test(stil)) bloecke.push({ typ: 'quote', text });
        else if (/ListNumber|ListeNummer|NummerierteListe/i.test(stil.replace(/\s/g, ''))) bloecke.push({ typ: 'number', text });
        else if (nummeriert || /List|Liste|Aufz/i.test(stil)) bloecke.push({ typ: 'bullet', text });
        else bloecke.push({ typ: 'text', text });
      }

      if (tag === 'w:tbl') {
        const zeilen = [];
        for (const tr of knoten.getElementsByTagName('w:tr')) {
          const zelle = [];
          for (const tc of tr.getElementsByTagName('w:tc')) {
            zelle.push([...tc.getElementsByTagName('w:t')].map(x => x.textContent).join('').trim());
          }
          if (zelle.length) zeilen.push(zelle);
        }
        if (zeilen.length) bloecke.push({ typ: 'table', rows: zeilen });
      }
    }
    return bloecke;
  };

  /* ========================================================================
   * POWERPOINT (.pptx)
   * ------------------------------------------------------------------------
   * EINE FOLIE IST EIN `blatt`-BLOCK. Kein neuer Blocktyp: das A4-Blatt
   * trägt bereits `blattBreite`/`blattHoehe` und die Zeichenschicht
   * `Marken` (E103) — und damit Textkästen mit Schrift und Rahmen, Bilder
   * mit eigener Datei, Verschieben, Drehen, Sperren und hundert Schritte
   * rückgängig. Eine zweite Maschine für dieselbe Frage wäre der zweite
   * Katalog aus §8, und der zweite ist immer der schlechtere.
   *
   * DAS MASS. PowerPoint rechnet in EMU (English Metric Units), 914400 je
   * Zoll. Redions Marken rechnen in Blattpunkten, 72 je Zoll. Das sind
   * genau 12700 EMU je Punkt — eine ganze Zahl, kein Rundungsfehler.
   * Schriftgrade stehen in Hundertstelpunkten (`sz="2800"` = 28 pt).
   *
   * WAS HIER NICHT PASSIERT. Es wird nichts gerendert und nichts geraten:
   * gelesen werden die Formen, die im Folien-XML wirklich stehen. Was eine
   * Folie vom Layout oder vom Master ERBT — Hintergründe, Platzhaltertexte,
   * Fusszeilen — steht dort nicht und kommt hier deshalb auch nicht an. Das
   * ist als Lücke eingetragen, nicht stillschweigend weggelassen.
   * ======================================================================*/

  /** EMU → Blattpunkte. 914400 EMU je Zoll, 72 Punkte je Zoll. */
  const emuZuPunkt = (wert: unknown): number =>
    Math.round((Number(wert) || 0) / 12700 * 100) / 100;

  /** Die Beziehungen einer Teildatei: r:id → Ziel, schon aufgelöst. */
  const relsLesen = async (zip: any, teil: string): Promise<Record<string, string>> => {
    const schraeg = teil.lastIndexOf('/');
    const ordner = schraeg < 0 ? '' : teil.slice(0, schraeg);
    const pfad = (ordner ? ordner + '/' : '') + '_rels/' +
                 teil.slice(schraeg + 1) + '.rels';
    const t = await zip.text(pfad);
    const karte: Record<string, string> = {};
    if (!t) return karte;
    for (const r of xml(t).getElementsByTagName('Relationship')) {
      const id = r.getAttribute('Id');
      let ziel = r.getAttribute('Target') || '';
      if (!id || !ziel) continue;
      /* Ziele stehen relativ zur Teildatei. `../media/bild1.png` von
         `ppt/slides/` aus ist `ppt/media/bild1.png`. Ohne das Auflösen
         fände der Leser kein einziges Bild. */
      if (!ziel.startsWith('/')) {
        const teile = (ordner ? ordner.split('/') : []);
        for (const stueck of ziel.split('/')) {
          if (stueck === '..') teile.pop();
          else if (stueck !== '.') teile.push(stueck);
        }
        ziel = teile.join('/');
      } else ziel = ziel.slice(1);
      karte[id] = ziel;
    }
    return karte;
  };

  /** Der Text einer Form: Absätze, Läufe, und der harte Umbruch `a:br`. */
  const formText = (txBody: Element): string => {
    const zeilen: string[] = [];
    for (const absatz of txBody.getElementsByTagName('a:p')) {
      let zeile = '';
      for (const kind of absatz.children) {
        if (kind.tagName === 'a:r') zeile += kind.getElementsByTagName('a:t')[0]?.textContent || '';
        else if (kind.tagName === 'a:br') zeile += '\n';
        else if (kind.tagName === 'a:fld') zeile += kind.getElementsByTagName('a:t')[0]?.textContent || '';
      }
      zeilen.push(zeile);
    }
    /* Leerzeilen am Ende weg — PowerPoint hängt gern einen leeren Absatz an,
       und der macht aus einem Titel einen Kasten mit Loch darunter. */
    while (zeilen.length && !zeilen[zeilen.length - 1]?.trim()) zeilen.pop();
    return zeilen.join('\n');
  };

  /** Lage und Grösse einer Form, in Blattpunkten. `null`, wenn sie fehlen. */
  const formLage = (form: Element): { x: number; y: number; w: number; h: number } | null => {
    const xfrm = form.getElementsByTagName('a:xfrm')[0];
    if (!xfrm) return null;
    const off = xfrm.getElementsByTagName('a:off')[0];
    const ext = xfrm.getElementsByTagName('a:ext')[0];
    if (!off || !ext) return null;
    return { x: emuZuPunkt(off.getAttribute('x')), y: emuZuPunkt(off.getAttribute('y')),
             w: emuZuPunkt(ext.getAttribute('cx')), h: emuZuPunkt(ext.getAttribute('cy')) };
  };

  /**
   * DIE KLICKSCHRITTE EINER FOLIE — und was sie aufdecken.
   *
   * An Redurs Lehrunterlage gemessen: zehn der 27 Folien tragen `p:timing`,
   * zusammen 22 Klickschritte, und ALLE Effekte sind `presetClass="exit"`
   * mit `filter="dissolve"`. Das ist das Muster jeder Übungsfolie: die
   * Antwort steht längst auf der Folie, ein deckendes Rechteck liegt
   * darüber, und der Klick löst das Rechteck auf.
   *
   * Wer diese Rechtecke nicht mitliest, zeigt die Folie mit ALLEN ANTWORTEN
   * OFFEN — und merkt es nicht, weil die Folie vollständig aussieht. Genau
   * das ist in der ersten Fassung passiert (E541): Formen ohne Text wurden
   * übersprungen, und die Abdeckungen haben keinen.
   *
   * Zurück kommt: Form-Kennung → Nummer des Klicks, bei dem sie verschwindet.
   */
  const klickschritte = (doc: Document): Map<string, number> => {
    const karte = new Map<string, number>();
    const zeit = doc.getElementsByTagName('p:timing')[0];
    if (!zeit) return karte;
    let schritt = 0;
    /* Jeder `p:par` mit `nodeType="clickEffect"` ist EIN Klick. Verschachtelt
       sind sie tief; gezählt wird in Dokumentordnung, und das ist die
       Reihenfolge, in der auch PowerPoint sie abarbeitet. */
    for (const knoten of zeit.getElementsByTagName('p:cTn')) {
      if (knoten.getAttribute('nodeType') !== 'clickEffect') continue;
      schritt++;
      for (const ziel of knoten.getElementsByTagName('p:spTgt')) {
        const id = ziel.getAttribute('spid');
        if (id && !karte.has(id)) karte.set(id, schritt);
      }
    }
    return karte;
  };

  /**
   * Die Füllfarbe einer Form.
   *
   * ERST DER VERLAUF, DANN DIE FESTE FARBE. An Redurs Datei gemessen: die
   * Abdeckungen sind KEINE einfarbigen Rechtecke, sondern ein Verlauf
   * weiss → #FFCC00 in der Mitte → weiss, senkrecht (`a:lin ang="5400000"`).
   * Die `a:solidFill`, die daneben steht, gehört der Umrisslinie.
   *
   * Der erste Versuch las nur `a:solidFill` und traf die richtige Farbe
   * bloss durch den Rückfall — das ist kein Lesen, das ist Glück. Jetzt
   * kommt die Farbe aus dem KRÄFTIGSTEN Stopp des Verlaufs, also dem, der
   * nicht die Hintergrundfarbe ist.
   *
   * Der Verlauf selbst wird nicht nachgebaut: Redions Abdeckband ist eine
   * Fläche in einer Farbe. Was dabei verlorengeht, ist Optik an einem
   * Deckel, den man wegtippt — steht als Lücke in L153.
   */
  const formFarbe = (form: Element): string => {
    const verlauf = form.getElementsByTagName('a:gradFill')[0];
    if (verlauf) {
      /* Der mittlere Stopp ist bei einem Deckel die Farbe; die äusseren
         sind das Papier. Fällt die Wahl schwer, gewinnt der erste echte
         RGB-Wert — ein `schemeClr` ist ohne Thema ohnehin nicht auflösbar. */
      const stopps = [...verlauf.getElementsByTagName('a:gs')];
      const mitte = stopps.find(g => g.getAttribute('pos') === '50000') || null;
      const rgbMitte = mitte?.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val');
      if (rgbMitte) return '#' + rgbMitte;
      for (const g of stopps) {
        const w = g.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val');
        if (w) return '#' + w;
      }
    }
    const voll = form.getElementsByTagName('a:solidFill')[0];
    const rgb = voll?.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val');
    return rgb ? '#' + rgb : '';
  };

  /**
   * Eine `.pptx` lesen. Zurück kommen Folien mit ihren Objekten — noch ohne
   * Kennungen und ohne abgelegte Bilder; das macht `datei()`, weil erst dort
   * feststeht, an welchem Block eine Bilddatei hängt.
   */
  const pptxLesen = async (puffer: ArrayBuffer): Promise<any> => {
    const zip = await zipLesen(puffer);
    const praesT = await zip.text('ppt/presentation.xml');
    if (!praesT) throw new Error('In dieser Datei steckt keine PowerPoint-Präsentation.');
    const praes = xml(praesT);

    /* Das Folienmass. Fehlt es, gilt 16:9 in der Vorgabe von PowerPoint —
       12192000 × 6858000 EMU, also 960 × 540 pt. */
    const sz = praes.getElementsByTagName('p:sldSz')[0];
    const breite = emuZuPunkt(sz?.getAttribute('cx')) || 960;
    const hoehe  = emuZuPunkt(sz?.getAttribute('cy')) || 540;

    /* DIE REIHENFOLGE STEHT IN `sldIdLst`, NICHT IN DEN DATEINAMEN.
       `slide10.xml` kommt in der Zeichensortierung vor `slide2.xml`, und
       eine Präsentation, deren Folien in falscher Ordnung erscheinen, ist
       schlimmer als eine, die gar nicht aufgeht. */
    const praesRels = await relsLesen(zip, 'ppt/presentation.xml');
    const pfade: string[] = [];
    for (const eintrag of praes.getElementsByTagName('p:sldId')) {
      const rid = eintrag.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')
               || eintrag.getAttribute('r:id') || '';
      const ziel = praesRels[rid];
      if (ziel) pfade.push(ziel);
    }
    if (!pfade.length) throw new Error('Diese Präsentation nennt keine Folien.');

    const folien = [];
    for (const pfad of pfade) {
      const t = await zip.text(pfad);
      if (!t) continue;
      const doc = xml(t);
      const rels = await relsLesen(zip, pfad);
      const baum = doc.getElementsByTagName('p:spTree')[0];
      const schritte = klickschritte(doc);
      const objekte: any[] = [];
      let titel = '';

      for (const form of (baum ? baum.children : [])) {
        /* ── Textkasten ──────────────────────────────────────────────── */
        if (form.tagName === 'p:sp') {
          const txBody = form.getElementsByTagName('p:txBody')[0];
          const text = txBody ? formText(txBody) : '';
          const lage = formLage(form);

          /* ── EINE ABDECKUNG ──────────────────────────────────────────
             Kein Text, eine feste Füllung, und ein Klick lässt sie
             verschwinden: das ist ein Deckel über der Antwort. Redion hat
             dafür die Abdeck-Marke (E266) — zugedeckt gespeichert,
             antippen deckt auf, und der Speicher wird dabei nie
             angefasst. Dieselbe Sache, schon gebaut. */
          const sid = form.getElementsByTagName('p:cNvPr')[0]?.getAttribute('id') || '';
          const schritt = sid ? schritte.get(sid) : undefined;
          if (!text.trim() && schritt && lage && lage.w > 0 && lage.h > 0) {
            objekte.push({ art: 'abdeck', schritt, farbe: formFarbe(form) || '#ffcc00',
              x: lage.x, y: lage.y, w: lage.w, h: lage.h });
            continue;
          }
          if (!text.trim()) continue;
          /* Der erste Lauf bestimmt Schriftgrad und Fett für den Kasten.
             Redions Textmarke hat EINEN Grad je Kasten; ein Kasten mit
             gemischten Graden käme also vereinfacht an. Das ist eine Lücke
             und steht so in LUECKEN.md. */
          const rPr = txBody?.getElementsByTagName('a:rPr')[0];
          const sz2 = Number(rPr?.getAttribute('sz'));
          /* Ist es der Titel? PowerPoint sagt es über den Platzhaltertyp. */
          const ph = form.getElementsByTagName('p:ph')[0];
          const istTitel = /^(ctr)?[Tt]itle$/.test(ph?.getAttribute('type') || '');
          if (istTitel && !titel) titel = text.split('\n')[0] || '';
          objekte.push({ art: 'text', text,
            x: lage ? lage.x : breite * 0.08, y: lage ? lage.y : hoehe * 0.1,
            breiteBox: lage && lage.w > 0 ? lage.w : breite * 0.84,
            fontSize: Number.isFinite(sz2) && sz2 > 0 ? Math.round(sz2 / 100) : (istTitel ? 40 : 20),
            fett: rPr?.getAttribute('b') === '1' });
          continue;
        }

        /* ── Bild ─────────────────────────────────────────────────────── */
        if (form.tagName === 'p:pic') {
          const blip = form.getElementsByTagName('a:blip')[0];
          const rid = blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed')
                   || blip?.getAttribute('r:embed') || '';
          const ziel = rels[rid];
          if (!ziel) continue;
          const bytes = await zip.holen(ziel);
          if (!bytes) continue;
          const lage = formLage(form);
          /* `pfad` ist der Schlüssel zum Sparen: an einer echten Datei
             gemessen kam ein Logo 27-mal vor, einmal je Folie. Ohne ihn
             entstünden 27 Dateisätze mit denselben Bytes. */
          objekte.push({ art: 'bild', pfad: ziel, name: ziel.slice(ziel.lastIndexOf('/') + 1),
            bytes,
            x: lage ? lage.x : breite * 0.2, y: lage ? lage.y : hoehe * 0.2,
            w: lage && lage.w > 0 ? lage.w : breite * 0.4,
            h: lage && lage.h > 0 ? lage.h : hoehe * 0.4 });
        }
      }
      /* KEIN PLATZHALTER, TROTZDEM EIN TITEL. An Redurs echter Datei
         gemessen: 27 Folien, NULL `p:ph`-Elemente. Die Erkennung über den
         Platzhaltertyp konnte dort nie greifen — PowerPoint schreibt ihn
         nur, wenn die Form aus einem Layout stammt.
         Also der Weg, den auch ein Mensch geht: von oben nach unten lesen.
         Welcher der Kandidaten wirklich die Überschrift ist, entscheidet
         sich aber erst, wenn ALLE Folien gelesen sind — siehe unten. */
      const kandidaten = objekte
        .filter(o => o.art === 'text' && String(o.text).trim())
        .sort((a, b) => a.y - b.y)
        .map(o => String(o.text).split('\n')[0]!.trim())
        .filter(z => z && z.length <= 80);
      folien.push({ titel, objekte, kandidaten });
    }
    /* ══ WELCHER KASTEN IST DIE ÜBERSCHRIFT? ═══════════════════════════
       Der oberste allein genügt nicht. An Redurs Datei gemessen: dort
       steht ganz oben auf JEDER der 27 Folien „Band 1 / Auflage 2021" —
       eine Kopfzeile, keine Überschrift. Genau das liesse sich nicht
       erraten, aber sehr wohl abzählen: was auf mehr als einem Drittel
       der Folien wortgleich wiederkehrt, ist eine Kopf- oder Fusszeile.
       Der erste Kandidat, der das NICHT tut, ist der Titel. */
    const haeufig = new Map<string, number>();
    for (const f of folien)
      for (const z of new Set(f.kandidaten as string[]))
        haeufig.set(z, (haeufig.get(z) || 0) + 1);
    const decke = Math.max(2, Math.ceil(folien.length / 3));
    for (const f of folien) {
      if (f.titel) continue;
      f.titel = (f.kandidaten as string[]).find(z => (haeufig.get(z) || 0) < decke) || '';
    }
    return { breite, hoehe, folien };
  };

  /* ========================================================================
   * EPUB
   * ======================================================================*/
  const epubLesen = async (puffer: ArrayBuffer): Promise<any> => {
    const zip = await zipLesen(puffer);

    const container = await zip.text('META-INF/container.xml');
    let opfPfad = null;
    if (container) opfPfad = xml(container).querySelector('rootfile')?.getAttribute('full-path');
    if (!opfPfad) opfPfad = zip.namen.find((n: any) => n.endsWith('.opf'));
    if (!opfPfad) throw new Error('Das sieht nicht nach einem EPUB aus.');

    const opf = xml(await zip.text(opfPfad));
    const ordner = opfPfad.includes('/') ? opfPfad.slice(0, opfPfad.lastIndexOf('/') + 1) : '';
    const titel = opf.querySelector('title')?.textContent || 'Buch';

    /* Reihenfolge steht im spine, die Dateien im manifest */
    const karte: Record<string, string | null> = {};
    opf.querySelectorAll('manifest > item').forEach(it =>
      { const id = it.getAttribute('id'); if (id) karte[id] = it.getAttribute('href'); });

    const kapitel = [];
    for (const ref of opf.querySelectorAll('spine > itemref')) {
      const href = karte[ref.getAttribute('idref') ?? ''];
      if (!href) continue;
      const inhalt = await zip.text(ordner + href.split('#')[0]);
      if (!inhalt) continue;
      const doc = new DOMParser().parseFromString(inhalt, 'text/html');
      const kTitel: string = doc.querySelector('h1,h2,title')?.textContent?.trim() ||
                     ('Kapitel ' + (kapitel.length + 1));
      kapitel.push({ titel: kTitel, html: doc.body ? doc.body.innerHTML : inhalt });
    }
    return { titel, kapitel };
  };

  /* ========================================================================
   * IN DIE APP ÜBERNEHMEN
   * ======================================================================*/

  /** Eine Tabelle als Datenbank anlegen — erste Zeile ist die Kopfzeile. */
  const alsDatenbank = (seiteId: string, name: string, zeilen: any[][]): any => {
    const brauchbar = zeilen.filter((z: any) => z.some((x: any) => String(x).trim()));
    if (brauchbar.length < 2) return null;

    const kopf = (brauchbar[0] ?? []).map((x: any, i: any) => String(x).trim() || 'Spalte ' + (i + 1));
    const schema: Record<string, any> = { title: { name: kopf[0], type: 'title' } };
    const karte = ['title'];

    /* Typ raten: alles Zahlen? dann Zahl. Sieht aus wie Datum? dann Datum. */
    kopf.slice(1).forEach((n: any, i: any) => {
      const spalte = brauchbar.slice(1).map((z: any) => String(z[i + 1] ?? '').trim()).filter(Boolean);
      const alleZahlen = spalte.length && spalte.every((v: any) => /^-?[\d.,]+$/.test(v));
      const alleDaten  = spalte.length && spalte.every((v: any) => /^\d{4}-\d{2}-\d{2}/.test(v));
      const k = 's' + i;
      schema[k] = { name: n, type: alleDaten ? 'date' : alleZahlen ? 'number' : 'text' };
      karte.push(k);
    });

    const { collectionId } = Store.addDatabase(seiteId, name, schema, 'table');
    brauchbar.slice(1).forEach((z: any) => {
      const props: Record<string, any> = {};
      karte.forEach((k, i) => {
        if (k === 'title') return;
        let v = z[i] ?? '';
        if (schema[k].type === 'number') v = parseFloat(String(v).replace(',', '.')) || 0;
        props[k] = v;
      });
      const r = Store.addRow(collectionId, props);
      Store.updateBlock(r.id, { text: String(z[0] ?? '') || 'Ohne Titel' });
    });
    return collectionId;
  };

  /**
   * DAS ORIGINAL ZUERST — dieselbe Reihenfolge wie beim PDF
   * (`bereiche/pdf/einlesen.ts:105`), und aus demselben Grund.
   *
   * WAS HIER VORHER FEHLTE: `datei()` las die Bytes in einen Puffer, schrieb
   * Blöcke und liess die Datei fallen. Nach dem Einlesen hielt Redion nur
   * das Umwandlungsergebnis; der einzige Weg zurück zur Word- oder
   * Tabellendatei war die Platte des Nutzers. Und die Umwandlung ist
   * verlustbehaftet — Bilder, Kopfzeilen, Fussnoten, Spalten, Schriftgrade
   * bleiben zurück. Wer die Datei danach von der Platte löschte, hatte sie
   * verloren, ohne dass irgendwo stand, dass etwas fehlt.
   *
   * Office war die EINZIGE Gruppe, die an diesem Weg vorbeilief: der PDF-Weg
   * legt ab, der Anhang-Weg in `archiveImport.ts:204` legt ab, hier nicht.
   *
   * Schlägt das Ablegen fehl, fliegt der Fehler nach oben und es hat noch
   * nichts stattgefunden — dann übernimmt der gewöhnliche Anhang-Weg.
   */
  const originalSichern = async (f: File, elternId?: string): Promise<any> =>
    Dateien.ablegen(f, { blockId: elternId });

  /**
   * Der sichtbare Anhang auf die abgelegte Quelle, an Stelle 0 der neuen
   * Seite — vor dem Umgewandelten, damit man ihn findet.
   *
   * Der Dateisatz zeigt danach auf DIESEN Block. Ohne das überlebte er das
   * Löschen des Anhangs (E99, derselbe Fund wie beim PDF).
   */
  const originalAnhaengen = async (seiteId: string, f: File, quelle: any): Promise<void> => {
    try {
      const a = Store.addBlock(seiteId, 'file', {
        text: f.name, dateiId: quelle.id, typ: f.type,
        groesse: f.size, original: true }, 0);
      await Store.dateiPut({ ...quelle, blockId: a.id });
    } catch { /* ohne Anhang bleibt wenigstens das Umgewandelte */ }
  };

  /** Eine Datei einlesen — erkennt das Format an der Endung. */
  const datei = async (f: File, elternId?: string): Promise<any> => {
    const name = f.name.toLowerCase();
    /* Nur für die Formate, die dieser Weg wirklich umwandelt. Alles andere
       fällt unten auf `null` und geht den Anhang-Weg, der ohnehin ablegt. */
    const wandelbar = /\.(xlsx|xlsm|ods|docx|pptx|ppsx|pptm|ppsm|epub)$/.test(name);
    const quelle = wandelbar ? await originalSichern(f, elternId) : null;
    const puffer = await f.arrayBuffer();

    if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) {
      const blaetter = await xlsxLesen(puffer);
      if (!blaetter.length) throw new Error('Keine Tabellenblätter gefunden.');
      const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📊' });
      let n = 0;
      blaetter.forEach(b => {
        Store.addBlock(seite.id, 'h2', { text: b.name });
        if (alsDatenbank(seite.id, b.name, b.zeilen)) n++;
        else Store.addBlock(seite.id, 'text', { text: '(Blatt „' + b.name + '" war leer)' });
      });
      if (quelle) await originalAnhaengen(seite.id, f, quelle);
      return { seite, hinweis: n + ' von ' + blaetter.length + ' Blättern als Datenbank angelegt'
        + (quelle ? ' · das Original liegt als Anhang dabei' : '') };
    }

    /* Dieselbe Behandlung wie .xlsx: ein Blatt wird eine Datenbank. Wer eine
       Tabelle einliest, will damit rechnen und filtern können — nicht ein
       Bild davon. */
    if (name.endsWith('.ods')) {
      const blaetter = await odsLesen(puffer);
      if (!blaetter.length) throw new Error('Keine Tabellenblätter gefunden.');
      const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📊' });
      let n = 0;
      blaetter.forEach(b => {
        Store.addBlock(seite.id, 'h2', { text: b.name });
        if (alsDatenbank(seite.id, b.name, b.zeilen)) n++;
        else Store.addBlock(seite.id, 'text', { text: '(Blatt „' + b.name + '" war leer)' });
      });
      if (quelle) await originalAnhaengen(seite.id, f, quelle);
      return { seite, hinweis: n + ' von ' + blaetter.length + ' Blättern als Datenbank angelegt'
        + (quelle ? ' · das Original liegt als Anhang dabei' : '') };
    }

    if (name.endsWith('.docx')) {
      const bloecke = await docxLesen(puffer);
      const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📄' });
      bloecke.forEach((b: any) => {
        if (b.typ === 'table') Store.addBlock(seite.id, 'table', { rows: b.rows, kopfZeile: true });
        else Store.addBlock(seite.id, b.typ, { text: b.text });
      });
      if (quelle) await originalAnhaengen(seite.id, f, quelle);
      /* „übernommen", nicht „eingelesen": die Umwandlung lässt Bilder,
         Kopfzeilen, Fussnoten und Spalten zurück (siehe docxLesen). Der
         Satz sagt deshalb auch, wo das Vollständige liegt. */
      return { seite, hinweis: bloecke.length + ' Absätze übernommen'
        + (quelle ? ' · das Original liegt unverändert als Anhang dabei' : '') };
    }

    /* `.ppsx` ist dasselbe Paket wie `.pptx`, nur als Bildschirm-
       präsentation gespeichert; `.pptm`/`.ppsm` dasselbe mit Makros. Alle
       vier tragen `ppt/presentation.xml`, und der Leser sieht ohnehin in
       die Datei statt auf den Namen. Gefunden an einer echten Datei von
       Redur: `.ppsx` lief vorher stumm in den Anhang-Zweig. */
    if (/\.(pptx|ppsx|pptm|ppsm)$/.test(name)) {
      const p = await pptxLesen(puffer);
      const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📽️' });
      if (quelle) await originalAnhaengen(seite.id, f, quelle);

      /* Eine Folie = ein `blatt`-Block mit Folienmass. Die Objekte werden
         Marken auf DERSELBEN Zeichenschicht, die auch PDF-Seite und
         A4-Blatt benutzen — also sofort verschiebbar, drehbar und
         rückgängig zu machen. */
      let mitBild = 0, mitDeckel = 0;
      /* Pfad im Paket → Kennung des abgelegten Satzes. Gemessen an einer
         echten Präsentation: 108 Bildvorkommen, aber nur 36 verschiedene
         Bilder. Ohne diese Karte lägen 108 Dateisätze im Speicher, davon
         72 als reine Verdopplung (§9: keine Daten ohne Not vermehren). */
      const schonAbgelegt = new Map<string, string>();
      for (const [nr, folie] of p.folien.entries()) {
        const block = Store.addBlock(seite.id, 'blatt', {
          text: folie.titel || ('Folie ' + (nr + 1)),
          blattBreite: p.breite, blattHoehe: p.hoehe, papier: 'blanko' });
        const marken: any[] = [];
        for (const o of folie.objekte) {
          const id = 'm' + Math.random().toString(36).slice(2, 10);
          if (o.art === 'text') {
            marken.push({ id, art: 'text', point: [o.x, o.y], breiteBox: o.breiteBox,
              text: o.text, fontSize: o.fontSize, fett: !!o.fett });
            continue;
          }
          if (o.art === 'abdeck') {
            /* `schritt` reist mit, auch wenn heute noch jede Abdeckung für
               sich angetippt wird. Ohne die Zahl wäre die Reihenfolge, in
               der die Folie gedacht war, verloren — und sie steht nur in
               der Quelldatei. */
            marken.push({ id, art: 'abdeck', farbe: o.farbe, schritt: o.schritt,
              pts: [[o.x, o.y], [o.x + o.w, o.y + o.h]] });
            continue;
          }
          /* Das Bild bekommt einen eigenen Dateisatz, der an DIESEM Block
             hängt — dieselbe Ordnung wie beim PDF-Anhang (E99). */
          try {
            let dateiId = schonAbgelegt.get(o.pfad) || '';
            if (!dateiId) {
              const satz = await Dateien.ablegen(new Blob([o.bytes]), { blockId: block.id, name: o.name });
              dateiId = String(satz?.id || '');
              if (dateiId) schonAbgelegt.set(o.pfad, dateiId);
            }
            if (dateiId) {
              marken.push({ id, art: 'bild', dateiId,
                pts: [[o.x, o.y], [o.x + o.w, o.y + o.h]] });
              mitBild++;
            }
          } catch { /* ohne das Bild bleibt die Folie stehen */ }
        }
        mitDeckel += marken.filter((m: any) => m.art === 'abdeck').length;
        if (marken.length) Store.updateBlock(block.id, { marken });
      }
      return { seite, hinweis: p.folien.length + ' Folien übernommen'
        + (mitBild ? ', ' + mitBild + ' Bilder aus ' + schonAbgelegt.size + ' Dateien' : '')
        + (mitDeckel ? ', ' + mitDeckel + ' Antworten zugedeckt' : '')
        + (quelle ? ' · das Original liegt unverändert als Anhang dabei' : '') };
    }

    if (name.endsWith('.epub')) {
      const buch = await epubLesen(puffer);
      const seite = Store.addPage(elternId, { text: buch.titel, icon: '📚', wiki: true });
      buch.kapitel.forEach((k: any) => {
        const kap = Store.addPage(seite.id, { text: k.titel, icon: '📖' });
        Werkzeuge.ausHtml(kap.id, k.html);
      });
      Store.updateBlock(seite.id, { aufgeklappt: true });
      if (quelle) await originalAnhaengen(seite.id, f, quelle);
      return { seite, hinweis: buch.kapitel.length + ' Kapitel als Unterseiten angelegt'
        + (quelle ? ' · das Original liegt als Anhang dabei' : '') };
    }

    return null;
  };

  return { zipLesen, zipLesenAusBlob, xlsxLesen, odsLesen, tabellenBerichtText,
           docxLesen, epubLesen,
           alsDatenbank, datei };
})();

(window as any).Einlesen = Einlesen;
