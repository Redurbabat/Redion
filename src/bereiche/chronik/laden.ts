/* ============================================================================
 * chronik/laden.ts — die Chronik erst holen, wenn jemand sie öffnet
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/chronik/laden.ts`.
 * ----------------------------------------------------------------------------
 * WARUM ES DIESE DATEI GIBT (E613)
 *
 * `chronik/daten.js` ist die Projektchronik als JSON-Literal: 182 KB roh,
 * 54 KB über die Leitung. Bis zum 16. September 2026 stand sie als
 * gewöhnliches `<script src>` in `index.html` und wurde bei JEDEM Start
 * geholt — für einen Bildschirm, der hinter einem Zugangscode liegt und den
 * fast niemand öffnet.
 *
 * Gemessen (gzip Stufe 6 über alles, was `index.html` lädt):
 *
 *     5. September   207 Dateien   2169 KB
 *     16. September  232 Dateien   2682 KB    Decke in test388 §5: 2300
 *
 * Von den 512 KB Zuwachs sind 54 diese eine Datei — der grösste einzelne
 * Posten, der KEINE Arbeit am Produkt ist.
 *
 * DAS MUSTER IST NICHT NEU. E389 hat pdf.js (527 KB) genau so vom Startweg
 * genommen; `src/fremd/pdfjs/laden.ts` ist die Vorlage. Diese Datei ist die
 * einfachere Schwester davon: kein gzip, kein Auspacken, nur ein Skript
 * einhängen und das Versprechen behalten.
 *
 * DREI DINGE, DIE DABEI NICHT BRECHEN DÜRFEN — alle drei geprüft:
 *
 *   §6  EIN `<script>`-ELEMENT UND KEIN `fetch`. Redion muss sich per
 *       Doppelklick öffnen lassen; unter `file://` scheitert `fetch` an der
 *       Herkunftsprüfung, ein eingehängtes Skript nicht.
 *
 *   §29 IN DER EINZELDATEI GIBT ES NICHTS ZU HOLEN. `bauen.mts` setzt alle
 *       Skripte ein, `ChronikDaten` steht dort also schon da, und `laden()`
 *       kehrt sofort zurück.
 *
 *   §28 OFFLINE BLEIBT ES OFFLINE. `daten.js` steht weiterhin im GRUNDSTOCK
 *       von `sw.ts` — der GRUNDSTOCK ist die Ablage, nicht die Startliste.
 *       Das Nachladen bedient dann der Zwischenspeicher, nicht das Netz.
 * ==========================================================================*/

const ChronikLaden = (() => {

  let versprechen: Promise<void> | null = null;

  /** Steht die Chronik schon im Fenster? (Einzeldatei, zweiter Aufruf.) */
  const da = (): boolean => (window as any).ChronikDaten !== undefined;

  /**
   * Einmal holen, dann behalten — und zwar das VERSPRECHEN, nicht das
   * Ergebnis: zwei gleichzeitige Aufrufe warten dann auf dasselbe Laden,
   * statt es zweimal zu starten.
   */
  const laden = (): Promise<void> => {
    if (da()) return Promise.resolve();
    if (versprechen) return versprechen;
    versprechen = new Promise<void>((ja, nein) => {
      if (typeof document === 'undefined') {
        nein(new Error('Die Chronik lässt sich hier nicht nachladen.')); return;
      }
      const s = document.createElement('script');
      s.src = 'quell/bereiche/chronik/daten.js';
      s.addEventListener('load', () => {
        if (!da()) nein(new Error(
          'quell/bereiche/chronik/daten.js wurde geladen, ist aber leer.'));
        else ja();
      });
      s.addEventListener('error', () => nein(new Error(
        'Die Chronik fehlt — quell/bereiche/chronik/daten.js liess sich nicht laden.')));
      document.head.appendChild(s);
    });
    /* Ein gescheitertes Versprechen nicht für immer behalten: beim nächsten
       Versuch soll es wieder gehen, wenn das Netz wieder da ist. */
    versprechen.catch(() => { versprechen = null; });
    return versprechen;
  };

  return { laden, da };
})();

(window as any).ChronikLaden = ChronikLaden;
