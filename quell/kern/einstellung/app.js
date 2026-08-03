/* ============================================================================
 * kern/einstellung/app.js — was diese Fassung ist und wo sie läuft
 * ----------------------------------------------------------------------------
 * Drei Fragen, die in jeder Fehlermeldung auftauchen und die vorher niemand
 * beantworten konnte:
 *
 *   Welche Fassung ist das?
 *   Läuft sie von der Festplatte, von einem Server oder als eine Datei?
 *   Was ist hier überhaupt möglich — gibt es Speicher, Netz, Zwischenablage?
 *
 * Ohne diese Antworten heisst jede Rückmeldung „bei mir geht es nicht", und
 * die Suche fängt bei null an.
 *
 * Alles hier wird **gemessen**, nicht angenommen. Ein `try` um jede Prüfung,
 * denn genau die Umgebungen, in denen etwas fehlt, sind auch die, in denen
 * schon das Nachfragen einen Fehler wirft.
 * ==========================================================================*/

const AppEinstellung = (() => {

  const FASSUNG = '2026.08.03';
  const NAME = 'Redion';

  /* --- Wo läuft das? ------------------------------------------------------ */

  const herkunft = () => {
    try {
      const p = location.protocol;
      if (p === 'file:') return 'festplatte';
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
        return 'eigener-rechner';
      return 'netz';
    } catch { return 'unbekannt'; }
  };

  /** Läuft die App als eine einzige Datei? Dann gibt es keinen Server. */
  const einzeldatei = () => {
    try { return herkunft() === 'festplatte' &&
                 document.querySelectorAll('script[src]').length === 0; }
    catch { return false; }
  };

  const alsApp = () => {
    try {
      return window.matchMedia('(display-mode: standalone)').matches ||
             navigator.standalone === true;
    } catch { return false; }
  };

  const amTelefon = () => {
    try { return window.innerWidth < (typeof KONSTANTEN !== 'undefined'
            ? KONSTANTEN.TELEFON_BREITE : 768); }
    catch { return false; }
  };

  /* --- Was geht hier? ----------------------------------------------------- */

  const kann = () => {
    const p = (fn) => { try { return !!fn(); } catch { return false; } };
    return {
      speicher:      p(() => self.indexedDB),
      dateien:       p(() => window.File && window.FileReader && window.Blob),
      zwischenlage:  p(() => navigator.clipboard && navigator.clipboard.writeText),
      arbeiter:      p(() => 'serviceWorker' in navigator),
      krypto:        p(() => self.crypto && crypto.subtle),
      netz:          p(() => navigator.onLine),
      benachrichten: p(() => 'Notification' in window),
      teilen:        p(() => navigator.share),
      sprache:       p(() => navigator.language) ? navigator.language : 'de'
    };
  };

  /**
   * Eine Zeile, die in jede Fehlermeldung gehört.
   * Bewusst ohne alles, was jemanden wiedererkennbar macht — kein
   * Nutzername, keine Kennung, keine Adresse.
   */
  const steckbrief = () => {
    const k = kann();
    return [
      NAME + ' ' + FASSUNG,
      'läuft: ' + herkunft() + (einzeldatei() ? ' (Einzeldatei)' : '') + (alsApp() ? ' (als App)' : ''),
      'Ablage: ' + (typeof Umzuege !== 'undefined' ? 'Fassung ' + Umzuege.JETZIGE : '?'),
      'Speicher: ' + (k.speicher ? 'ja' : 'nein') +
        ' · Krypto: ' + (k.krypto ? 'ja' : 'nein') +
        ' · Netz: ' + (k.netz ? 'ja' : 'nein'),
      'Fenster: ' + (() => { try { return innerWidth + '×' + innerHeight; } catch { return '?'; } })()
    ].join('\n');
  };

  /**
   * Wie viel Platz ist noch da? Kommt aus dem Browser, nicht geschätzt.
   * @returns {Promise<{benutzt:number, frei:number, anteil:number}|null>}
   */
  const platz = async () => {
    try {
      if (!navigator.storage || !navigator.storage.estimate) return null;
      const e = await navigator.storage.estimate();
      return { benutzt: e.usage || 0, frei: (e.quota || 0) - (e.usage || 0),
               anteil: e.quota ? (e.usage / e.quota) : 0 };
    } catch { return null; }
  };

  /**
   * Bittet den Browser, den Speicher nicht bei Platznot wegzuräumen.
   * Ohne das kann ein Browser die Daten löschen, wenn die Platte voll wird —
   * still, ohne zu fragen.
   */
  const speicherSichern = async () => {
    try {
      if (!navigator.storage || !navigator.storage.persist) return false;
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    } catch { return false; }
  };

  return { NAME, FASSUNG, herkunft, einzeldatei, alsApp, amTelefon,
           kann, steckbrief, platz, speicherSichern };
})();

window.AppEinstellung = AppEinstellung;
