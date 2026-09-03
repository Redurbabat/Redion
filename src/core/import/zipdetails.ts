/* ============================================================================
 * core/import/zipdetails.js — was ein ZIP-Eintrag über sich sagt (E363)
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/import/zipdetails.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/import/zipdetails.js`. Wer das .js bearbeitet, verliert
 * die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * Drei Dinge, die der Leser (bereiche/dateien/einlesen.ts) bisher überging
 * (L114 Punkt 5), hier als reiner Kern ohne DOM und ohne Ablage:
 *
 *   · DIE PRÜFSUMME. Jeder Eintrag trägt eine CRC-32 seiner rohen Bytes.
 *     Wer sie nicht nachrechnet, nimmt einen beschädigten Eintrag als
 *     vollständiges Dokument an — still. Die Rechnung ist fortlaufend
 *     (`crc32Weiter`), damit ein Blob scheibchenweise geprüft werden kann,
 *     ohne je ganz im Arbeitsspeicher zu liegen.
 *   · DER NAME. Bit 11 der Flags sagt „UTF-8". Fehlt es, stammt der Name
 *     aus einem alten Windows-Packer und ist CP437 — „Übung" käme sonst mit
 *     Ersatzzeichen an. Gültiges UTF-8 ohne Bit wird trotzdem als UTF-8
 *     gelesen (viele Packer setzen das Bit nicht, schreiben aber UTF-8);
 *     erst was kein UTF-8 ist, wird CP437.
 *   · VERSCHLÜSSELT. Bit 0 der Flags. Redion kann das nicht lesen und
 *     sagt es, statt beim Entpacken mit einer allgemeinen Meldung zu
 *     scheitern.
 *
 * Der Schreiber (ausgeben.ts) nimmt dieselbe Prüfsumme; die Tafel steht
 * damit nur noch einmal.
 * ==========================================================================*/

const ZipDetails = (() => {
  const UTF8_BIT = 0x800;
  const VERSCHLUESSELT_BIT = 0x1;

  let tafel: Uint32Array | null = null;
  const crc32Tafel = (): Uint32Array => {
    if (tafel) return tafel;
    tafel = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      tafel[n] = c >>> 0;
    }
    return tafel;
  };
  /** Der Anfangswert einer fortlaufenden Rechnung. */
  const crc32Start = (): number => 0xFFFFFFFF;
  /** Ein Stück Bytes in die laufende Rechnung nehmen. */
  const crc32Weiter = (zwischen: number, bytes: Uint8Array): number => {
    const t = crc32Tafel();
    let c = zwischen >>> 0;
    for (let i = 0; i < bytes.length; i++) c = (t[(c ^ (bytes[i] ?? 0)) & 0xFF] ?? 0) ^ (c >>> 8);
    return c >>> 0;
  };
  /** Die Rechnung abschliessen. */
  const crc32Fertig = (zwischen: number): number => ((zwischen ^ 0xFFFFFFFF) >>> 0);
  /** Alles auf einmal — für Bytes, die ohnehin im Speicher liegen. */
  const crc32 = (bytes: Uint8Array): number => crc32Fertig(crc32Weiter(crc32Start(), bytes));
  const crc32Hex = (n: number): string => (n >>> 0).toString(16).padStart(8, '0');

  /* CP437 — die obere Hälfte (0x80–0xFF), in der Reihenfolge der Tabelle. */
  const CP437_OBEN =
    'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»' +
    '░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀' +
    'αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';
  const cp437 = (bytes: Uint8Array): string => {
    let s = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i] ?? 0;
      s += b < 0x80 ? String.fromCharCode(b) : (CP437_OBEN[b - 0x80] ?? '?');
    }
    return s;
  };

  /** Der Name eines Eintrags aus seinen Bytes und den Flags des Kopfs. */
  const nameDecodieren = (bytes: Uint8Array, flags: number): string => {
    if ((flags & UTF8_BIT) !== 0) return new TextDecoder('utf-8').decode(bytes);
    let nurAscii = true;
    for (let i = 0; i < bytes.length; i++) if ((bytes[i] ?? 0) >= 0x80) { nurAscii = false; break; }
    if (nurAscii) return new TextDecoder('utf-8').decode(bytes);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { return cp437(bytes); }
  };

  const istVerschluesselt = (flags: number): boolean => (flags & VERSCHLUESSELT_BIT) !== 0;

  return { UTF8_BIT, VERSCHLUESSELT_BIT, crc32Tafel, crc32Start, crc32Weiter, crc32Fertig, crc32, crc32Hex,
           cp437, nameDecodieren, istVerschluesselt };
})();

(window as any).ZipDetails = ZipDetails;
