/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/fremd/pdfjs/laden.ts (npm run bauen:ts). */
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

declare const PDFJS_EINGEPACKT: { LIB: string; WORKER: string };

const PdfFremd = (() => {
  let versprechen: Promise<any> | null = null;

  /* `Uint8Array` allein heisst seit TypeScript 5.7 `Uint8Array<ArrayBufferLike>`,
     und darin steckt auch `SharedArrayBuffer` — den nimmt ein `Blob` nicht.
     Der Unterbau wird deshalb ausdrücklich als `ArrayBuffer` angelegt, statt
     die Warnung mit `as any` wegzudrücken: sie hat recht. */
  type Bytes = Uint8Array<ArrayBuffer>;

  /** Base64 zu Bytes. `atob` gibt Zeichen, kein Feld — also von Hand. */
  const bytes = (b64: string): Bytes => {
    const roh = atob(b64);
    const u = new Uint8Array(new ArrayBuffer(roh.length));
    for (let i = 0; i < roh.length; i++) u[i] = roh.charCodeAt(i);
    return u;
  };

  /** Ein gzip-Paket auspacken — dieselbe Technik, mit der Redion ZIP liest. */
  const entpacke = async (b64: string): Promise<Bytes> => {
    const strom = new Blob([bytes(b64)]).stream()
      .pipeThrough(new DecompressionStream('gzip'));
    return new Uint8Array(await new Response(strom).arrayBuffer());
  };

  /** Einmal auspacken, dann behalten. Gibt das pdf.js-Modul zurück. */
  /**
   * DIE BYTES ERST HOLEN, WENN SIE GEBRAUCHT WERDEN (E389).
   *
   * `daten.js` ist 717 KB roh und 527 KB über die Leitung — der grösste
   * Einzelposten des ganzen Starts und ein Fünftel von allem. Bis zum
   * 4. September lud `index.html` sie mit einem gewöhnlichen `<script
   * src>`, also bei JEDEM Start, auch wenn nie eine PDF geöffnet wurde.
   * Gemessen mobil gedrosselt (4× CPU, Slow 4G): 2607 KB gesamt, und
   * davon gingen 527 auf diese eine Datei.
   *
   * EIN `<script>`-ELEMENT UND KEIN `fetch`. Redion muss sich per
   * Doppelklick öffnen lassen (§6) — unter `file://` scheitert `fetch`
   * an der Herkunftsprüfung, ein eingehängtes Skript nicht.
   *
   * IN DER EINZELDATEI GIBT ES NICHTS ZU HOLEN: dort setzt `bauen.mts`
   * die Bytes direkt ein, `PDFJS_EINGEPACKT` steht also schon da, und
   * diese Funktion kehrt sofort zurück.
   *
   * OFFLINE BLEIBT ES OFFLINE: `daten.js` steht weiterhin im GRUNDSTOCK
   * von `sw.ts`, wird also beim ersten Besuch im Hintergrund abgelegt.
   * Das Nachladen bedient dann der Zwischenspeicher, nicht das Netz.
   */
  const bytesHolen = (): Promise<void> => new Promise((ja, nein) => {
    if (typeof PDFJS_EINGEPACKT !== 'undefined') { ja(); return; }
    if (typeof document === 'undefined') {
      nein(new Error('Die PDF-Bibliothek lässt sich hier nicht nachladen.')); return;
    }
    const s = document.createElement('script');
    s.src = 'quell/fremd/pdfjs/daten.js';
    s.addEventListener('load', () => {
      if (typeof PDFJS_EINGEPACKT === 'undefined') {
        nein(new Error('quell/fremd/pdfjs/daten.js wurde geladen, ist aber leer.'));
      } else ja();
    });
    s.addEventListener('error', () => nein(new Error(
      'Die PDF-Bibliothek fehlt — quell/fremd/pdfjs/daten.js liess sich nicht laden.')));
    document.head.appendChild(s);
  });

  const laden = (): Promise<any> => {
    if (versprechen) return versprechen;
    versprechen = (async () => {
      await bytesHolen();
      if (typeof PDFJS_EINGEPACKT === 'undefined')
        throw new Error('Die PDF-Bibliothek fehlt — quell/fremd/pdfjs/daten.js wird nicht geladen.');
      if (typeof DecompressionStream === 'undefined')
        throw new Error('Dieser Browser kann kein gzip auspacken — PDF-Seiten gehen hier nicht.');

      const lib = await entpacke(PDFJS_EINGEPACKT.LIB);
      const wk  = await entpacke(PDFJS_EINGEPACKT.WORKER);
      /* Blob-Adressen statt Dateien: nur so läuft es auch in der
         Einzeldatei über `file://`, wo es kein Verzeichnis gibt. */
      const libUrl = URL.createObjectURL(new Blob([lib], { type: 'text/javascript' }));
      const wkUrl  = URL.createObjectURL(new Blob([wk],  { type: 'text/javascript' }));
      const modul = await import(libUrl);
      modul.GlobalWorkerOptions.workerSrc = wkUrl;
      return modul;
    })();
    return versprechen;
  };

  return { laden, entpacke, bytes };
})();

(window as any).PdfFremd = PdfFremd;
