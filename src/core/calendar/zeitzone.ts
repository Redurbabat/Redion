/* ============================================================================
 * core/calendar/zeitzone.ts — eine Wandzeit in einer fremden Zone verstehen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/calendar/zeitzone.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/calendar/zeitzone.js`. Wer das .js bearbeitet, verliert
 * die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es.
 * ----------------------------------------------------------------------------
 * WOFÜR ES SIE GIBT (L106 Punkt 5).
 *
 * Eine ICS-Zeile sieht so aus:
 *
 *     DTSTART;TZID=America/New_York:20260907T080000
 *
 * Bis hierher las Redion daraus `2026-09-07T08:00` und zeigte 8 Uhr an. Für
 * jemanden in Berlin ist dieser Termin aber um 14 Uhr. SECHS STUNDEN FALSCH,
 * ohne ein Wort.
 *
 * L106 nannte das „bewusst so", mit einem guten Grund: „eine halbe
 * Zeitzonenrechnung ist schlimmer als keine". Der Grund gilt — nur ist die
 * GANZE Rechnung seit Jahren im Browser eingebaut. `Intl.DateTimeFormat`
 * kennt die vollständige IANA-Datenbank samt aller Sommerzeit-Umstellungen,
 * rückwirkend und im Voraus. Es braucht keine Bibliothek (§6) und keine
 * Tabelle, die veraltet.
 *
 * ─── DER TRICK, UND WARUM ER ZWEIMAL RECHNET ────────────────────────────────
 *
 * `Intl` kann eine Richtung: Augenblick → Wandzeit in Zone Z. Gebraucht wird
 * die andere: Wandzeit in Z → Augenblick. Die Umkehrung geht so:
 *
 *   1 · Die Wandzeit einmal so nehmen, als wäre sie UTC. Das ist um genau
 *       den Versatz daneben.
 *   2 · Den Versatz an diesem Punkt messen und abziehen.
 *   3 · NOCH EINMAL messen. Denn der Versatz gilt für den Punkt, an dem man
 *       gemessen hat — und wenn der Abzug über eine Zeitumstellung geführt
 *       hat, ist er dort ein anderer.
 *
 * Ohne Schritt 3 wäre jede Nacht einer Umstellung eine Stunde falsch. Genau
 * die halbe Rechnung, vor der L106 gewarnt hat.
 *
 * ─── WAS ES NICHT KANN, UND DAS WIRD GESAGT ─────────────────────────────────
 *
 * Zwei Stunden im Jahr gibt es keine eindeutige Antwort, und das liegt nicht
 * am Verfahren, sondern an der Welt:
 *
 *   · Bei der Umstellung nach vorn EXISTIERT die Stunde nicht. 2:30 gibt es
 *     an diesem Tag nicht.
 *   · Bei der Umstellung zurück gibt es sie ZWEIMAL.
 *
 * Beide Fälle liefern hier eine der beiden vertretbaren Antworten statt gar
 * keiner. Ein Termin, der wegen einer mehrdeutigen Stunde verschwindet, wäre
 * schlimmer (§46).
 *
 * Und die dritte Grenze ist die wichtigste in der Praxis: OUTLOOK schreibt
 * `TZID=W. Europe Standard Time`. Das ist ein Windows-Name und steht in
 * keiner IANA-Datenbank; `Intl` lehnt ihn ab. Übersetzt wird er NICHT — eine
 * Tabelle mit hundert Windows-Namen wäre genau die halbe Lösung, die veraltet
 * und die niemand pflegt. Stattdessen bleibt die Zeit, wie sie in der Datei
 * steht, und Redion SAGT, dass es die Zone nicht kennt (§35).
 * ==========================================================================*/

const Zeitzone = (() => {

  /** Was `Intl` schon einmal beantwortet hat. Zonen ändern sich nicht. */
  const bekannt = new Map<string, boolean>();

  /**
   * Kennt dieser Browser diese Zone?
   *
   * `Intl` WIRFT bei einem unbekannten Namen, statt etwas zurückzugeben —
   * gemessen, nicht angenommen: `W. Europe Standard Time` wirft
   * „Invalid time zone specified".
   */
  const kennt = (zone: unknown): boolean => {
    const z = String(zone || '').trim();
    if (!z) return false;
    const gemerkt = bekannt.get(z);
    if (gemerkt !== undefined) return gemerkt;
    let ja = false;
    try { new Intl.DateTimeFormat('en-US', { timeZone: z }); ja = true; }
    catch { ja = false; }
    bekannt.set(z, ja);
    return ja;
  };

  const formate = new Map<string, Intl.DateTimeFormat>();
  const format = (zone: string): Intl.DateTimeFormat | null => {
    const da = formate.get(zone);
    if (da) return da;
    try {
      const f = new Intl.DateTimeFormat('en-US', {
        timeZone: zone, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      formate.set(zone, f);
      return f;
    } catch { return null; }
  };

  /**
   * Wie viele Minuten geht diese Zone der Weltzeit voraus — an DIESEM
   * Augenblick? Berlin im Winter: +60. Berlin im Sommer: +120. New York:
   * −300 bzw. −240.
   */
  const versatz = (zone: string, augenblick: number): number | null => {
    const f = format(zone);
    if (!f || !Number.isFinite(augenblick)) return null;
    const teile: Record<string, string> = {};
    for (const t of f.formatToParts(new Date(augenblick)))
      if (t.type !== 'literal') teile[t.type] = t.value;
    const j = Number(teile.year), mo = Number(teile.month), tg = Number(teile.day);
    /* `hour` kann „24" sein — `hour12:false` schreibt Mitternacht so. */
    const st = Number(teile.hour) % 24;
    const mi = Number(teile.minute), se = Number(teile.second);
    if (![j, mo, tg, st, mi, se].every(Number.isFinite)) return null;
    const alsWaereUtc = Date.UTC(j, mo - 1, tg, st, mi, se);
    /* Auf die Minute runden: Sekunden sind gleich, aber Gleitkomma ist es
       nicht immer, und Zonen mit Sekunden-Versatz gibt es seit 1900 nicht. */
    return Math.round((alsWaereUtc - Math.floor(augenblick / 1000) * 1000) / 60000);
  };

  /**
   * Eine Wandzeit in einer Zone → der Augenblick (ms seit 1970).
   *
   * Zweimal gerechnet, siehe Kopf. `null`, wenn die Zone unbekannt ist —
   * dann soll der Aufrufer die Zeit lassen, wie sie ist, und es sagen.
   */
  const alsAugenblick = (
    jahr: number, monat: number, tag: number,
    stunde: number, minute: number, zone: string
  ): number | null => {
    if (!kennt(zone)) return null;
    const wand = Date.UTC(jahr, monat - 1, tag, stunde, minute, 0);
    if (!Number.isFinite(wand)) return null;
    const erste = versatz(zone, wand);
    if (erste === null) return null;
    const kandidat = wand - erste * 60000;
    /* DER ZWEITE DURCHGANG. Ohne ihn ist jede Nacht einer Umstellung um
       eine Stunde daneben — siehe Kopf. */
    const zweite = versatz(zone, kandidat);
    if (zweite === null || zweite === erste) return kandidat;
    return wand - zweite * 60000;
  };

  /**
   * Und was Redion davon braucht: eine Wandzeit in einer fremden Zone als
   * ORTSZEIT dieses Geräts, im Format `2026-09-07T14:00`.
   *
   * `null` heisst „diese Zone kenne ich nicht" — nicht „Fehler". Der
   * Aufrufer behält dann, was in der Datei steht.
   */
  const alsOrtszeit = (
    jahr: number, monat: number, tag: number,
    stunde: number, minute: number, zone: string
  ): string | null => {
    const t = alsAugenblick(jahr, monat, tag, stunde, minute, zone);
    if (t === null) return null;
    const d = new Date(t);
    const p2 = (n: number) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
           'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  };

  return { kennt, versatz, alsAugenblick, alsOrtszeit };
})();

(window as any).Zeitzone = Zeitzone;
