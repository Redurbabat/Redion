/* ============================================================================
 * core/helpers/plural.ts — eins ist eine andere Zahl als zwei
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/helpers/plural.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/helpers/plural.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * WARUM ES DIESE DATEI GIBT. In der Bibliothek stand unter jeder Seite mit
 * genau einem Kind „1 Einträge" (E231). Ärgerlich daran war nicht der Fehler,
 * sondern dass die Lösung 146 Zeilen tiefer in DERSELBEN Datei schon stand:
 *
 *     `${pdf.seiten} ${pdf.seiten === 1 ? 'Seite' : 'Seiten'}`
 *
 * Dreimal richtig, einmal vergessen. E231 hat daraus ein `zahlWort()` in
 * `bereiche/wissen/arbeitswelt.ts` gemacht — und damit war es an EINER
 * Stelle, aber in einem BEREICH. Nach §5 darf kein anderer Bereich es holen,
 * also schrieben elf weitere Dateien die Verzweigung weiter von Hand oder
 * gar nicht.
 *
 * Redur hat in E277 entschieden: der Helfer wandert hierher, und die
 * verbleibenden Meldungen werden NICHT in einem ungeprüften Rutsch
 * umgeschrieben (§45). Die Zahl steht in `LUECKEN.md` unter L67.
 *
 * ─── SPRACHE ────────────────────────────────────────────────────────────────
 * Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27, wie bei
 * `Dates` und `Ids`. Die WÖRTER, die hineingereicht werden, sind natürlich
 * deutsch: sie stehen auf dem Bildschirm.
 *
 * ─── WAS ER BEWUSST NICHT TUT ───────────────────────────────────────────────
 * Er beugt nicht. „1 Eintrag" und „7 Einträge" bekommt er, weil beide Wörter
 * hineingereicht werden — er RÄT sie nicht aus dem Singular. Deutsche
 * Mehrzahlbildung ist unregelmässig (Eintrag/Einträge, Alias/Aliasse,
 * Datum/Daten), und ein Helfer, der es meistens richtig rät, ist schlimmer
 * als einer, der fragt: man merkt die Ausnahme erst auf dem Bildschirm.
 * ==========================================================================*/

const Plural = (() => {

  /**
   * „1 Eintrag" · „7 Einträge" · „0 Einträge"
   *
   * Die Zahl steht vorne, das Wort passt sich an. Genau ein Leerzeichen
   * dazwischen.
   *
   * @param n        die Anzahl
   * @param one      das Wort bei genau eins
   * @param many     das Wort bei allem anderen
   * @param zero     wenn angegeben, der GANZE Text bei null — für „Keine
   *                 Einträge" statt „0 Einträge". Ohne Angabe gilt `many`
   *                 mit der Null davor; das ist die bisherige Form und
   *                 bleibt die Vorgabe, damit nichts sich still ändert.
   *
   * NULL IST MEHRZAHL, nicht Einzahl — „0 Einträge", nicht „0 Eintrag".
   * Das ist im Deutschen so und im Englischen auch; nur wenige Sprachen
   * machen es anders.
   *
   * MINUS EINS ZÄHLT ALS EINZAHL: „-1 Grad" und nicht „-1 Grade". Auch das
   * ist die deutsche Form. Gemessen wird deshalb der BETRAG.
   *
   * NICHTGANZE ZAHLEN sind immer Mehrzahl — „1,5 Stunden", nie „1,5 Stunde".
   * `1.0` ist ganz und zählt als eins.
   */
  const count = (n: number, one: string, many: string, zero?: string): string => {
    /* Kaputte Zahlen nicht durchreichen. `NaN` als „NaN Einträge" auf dem
       Bildschirm ist die Sorte Fehler, die aussieht wie ein Zufall, statt
       wie ein Fehler — und dann nicht gemeldet wird. */
    if (!Number.isFinite(n)) return `– ${many}`;
    if (n === 0 && zero !== undefined) return zero;
    return `${n} ${Math.abs(n) === 1 ? one : many}`;
  };

  /**
   * Nur das WORT, ohne Zahl davor — für Fälle, in denen die Zahl schon
   * woanders steht (in einer grossen Kachel etwa, mit dem Wort darunter).
   */
  const word = (n: number, one: string, many: string): string =>
    Number.isFinite(n) && Math.abs(n) === 1 ? one : many;

  return { count, word };
})();

(window as any).Plural = Plural;
