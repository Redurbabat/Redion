/* ============================================================================
 * kern/helfer/datum.js — Zeit, ohne Bibliothek
 * ----------------------------------------------------------------------------
 * Datumsrechnen ist die Stelle, an der stille Fehler entstehen. Drei Fallen
 * kommen immer wieder, und alle drei sind hier einmal richtig gelöst:
 *
 *   1. **Zeitzonen.** `new Date('2026-08-03')` ist Mitternacht UTC, nicht
 *      Mitternacht hier. Wer damit rechnet, verschiebt in halb Europa den
 *      Tag um eins. Deshalb wird ein reines Datum immer als lokaler Tag
 *      gelesen.
 *   2. **Sommerzeit.** „24 Stunden dazu" ist nicht „ein Tag dazu". Zweimal
 *      im Jahr hat ein Tag 23 oder 25 Stunden. Deshalb wird über
 *      `setDate` gerechnet und nicht über Millisekunden.
 *   3. **Monatsenden.** 31. Januar plus einen Monat ist nicht der
 *      31. Februar. Hier kommt der 28. heraus, nicht der 3. März.
 *
 * Alles arbeitet mit echten `Date`-Objekten. Zeichenketten kommen nur an
 * den Rändern vor — beim Speichern und beim Anzeigen.
 * ==========================================================================*/

const Datum = (() => {

  const MS_TAG = 86400000;

  /* --- Lesen -------------------------------------------------------------- */

  /**
   * Irgendetwas in ein Datum verwandeln — oder null.
   * Ein reines Datum (2026-08-03) wird als **lokaler** Tag gelesen, nicht
   * als UTC-Mitternacht. Das ist der häufigste Zeitzonenfehler überhaupt.
   */
  const lies = (x) => {
    if (x instanceof Date) return isNaN(x) ? null : x;
    if (typeof x === 'number') return new Date(x);
    const s = String(x || '').trim();
    if (!s) return null;
    const rein = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (rein) return new Date(+rein[1], +rein[2] - 1, +rein[3]);
    const d = new Date(s);
    return isNaN(d) ? null : d;
  };

  const istDatum = (x) => lies(x) !== null;

  /* --- Schreiben ---------------------------------------------------------- */

  const zwei = (n) => String(n).padStart(2, '0');

  /** ISO mit Zeit — die Form, in der gespeichert wird. */
  const alsText = (d) => (lies(d) || new Date()).toISOString();

  /** Nur der Tag, in lokaler Zeit: 2026-08-03. */
  const alsTag = (d) => {
    const x = lies(d);
    if (!x) return '';
    return x.getFullYear() + '-' + zwei(x.getMonth() + 1) + '-' + zwei(x.getDate());
  };

  /* --- Runden ------------------------------------------------------------- */

  const tagAnfang = (d) => { const x = lies(d); if (!x) return null;
    const y = new Date(x); y.setHours(0, 0, 0, 0); return y; };

  const tagEnde = (d) => { const x = lies(d); if (!x) return null;
    const y = new Date(x); y.setHours(23, 59, 59, 999); return y; };

  const wochenAnfang = (d, montags = true) => {
    const x = tagAnfang(d); if (!x) return null;
    const tag = x.getDay();                       /* 0 = Sonntag */
    const zurueck = montags ? (tag === 0 ? 6 : tag - 1) : tag;
    x.setDate(x.getDate() - zurueck);
    return x;
  };

  const monatsAnfang = (d) => { const x = tagAnfang(d); if (!x) return null;
    x.setDate(1); return x; };

  const monatsEnde = (d) => { const x = monatsAnfang(d); if (!x) return null;
    x.setMonth(x.getMonth() + 1); x.setDate(0); x.setHours(23, 59, 59, 999); return x; };

  const jahresAnfang = (d) => { const x = tagAnfang(d); if (!x) return null;
    x.setMonth(0, 1); return x; };

  /* --- Rechnen ------------------------------------------------------------ */

  /**
   * Tage dazuzählen — über setDate, nicht über Millisekunden.
   * Sonst geht bei der Zeitumstellung ein Tag verloren oder es kommt einer
   * dazu, und zwar genau zweimal im Jahr, was niemand reproduzieren kann.
   */
  const plusTage = (d, n) => { const x = lies(d); if (!x) return null;
    const y = new Date(x); y.setDate(y.getDate() + Number(n || 0)); return y; };

  /**
   * Monate dazuzählen, mit Klemmung ans Monatsende.
   * 31. Januar plus ein Monat ist der 28. Februar, nicht der 3. März.
   */
  const plusMonate = (d, n) => {
    const x = lies(d); if (!x) return null;
    const tag = x.getDate();
    const y = new Date(x);
    y.setDate(1);
    y.setMonth(y.getMonth() + Number(n || 0));
    const letzter = new Date(y.getFullYear(), y.getMonth() + 1, 0).getDate();
    y.setDate(Math.min(tag, letzter));
    return y;
  };

  /** Ganze Tage dazwischen — über die Tagesgrenzen, nicht über die Stunden. */
  const tageZwischen = (a, b) => {
    const x = tagAnfang(a), y = tagAnfang(b);
    if (!x || !y) return 0;
    return Math.round((y - x) / MS_TAG);
  };

  /* --- Werktage -----------------------------------------------------------
     Notion kennt keine Werktage. Hier zählen sie, weil fast jede Frist in
     Werktagen gemeint ist und niemand das von Hand ausrechnen will. */

  const istWochenende = (d) => { const x = lies(d); if (!x) return false;
    const t = x.getDay(); return t === 0 || t === 6; };

  const werktageZwischen = (a, b) => {
    let x = tagAnfang(a), y = tagAnfang(b);
    if (!x || !y) return 0;
    const rueckwaerts = x > y;
    if (rueckwaerts) { const h = x; x = y; y = h; }
    let n = 0;
    const lauf = new Date(x);
    while (lauf < y) { lauf.setDate(lauf.getDate() + 1); if (!istWochenende(lauf)) n++; }
    return rueckwaerts ? -n : n;
  };

  const plusWerktage = (d, n) => {
    let x = tagAnfang(d); if (!x) return null;
    let uebrig = Math.abs(Number(n) || 0);
    const schritt = (Number(n) || 0) < 0 ? -1 : 1;
    while (uebrig > 0) {
      x = plusTage(x, schritt);
      if (!istWochenende(x)) uebrig--;
    }
    return x;
  };

  /* --- Kalenderwoche nach ISO --------------------------------------------
     Nicht „die wievielte Woche im Jahr", sondern die Regel, nach der der
     Rest Europas zählt: Woche 1 ist die mit dem ersten Donnerstag. */

  const kalenderwoche = (d) => {
    const x = tagAnfang(d); if (!x) return 0;
    const t = new Date(x);
    t.setDate(t.getDate() + 4 - (t.getDay() || 7));
    const jahresStart = new Date(t.getFullYear(), 0, 1);
    return Math.ceil(((t - jahresStart) / MS_TAG + 1) / 7);
  };

  /* --- Für Menschen -------------------------------------------------------- */

  const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
                      'Donnerstag', 'Freitag', 'Samstag'];
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
                  'August', 'September', 'Oktober', 'November', 'Dezember'];

  /** „vor 3 Minuten", „gestern", „am 3. August" — je nach Abstand. */
  const vorText = (d, jetzt = new Date()) => {
    const x = lies(d); if (!x) return '';
    const sek = Math.round((jetzt - x) / 1000);
    if (Math.abs(sek) < 45)  return 'gerade eben';
    const min = Math.round(sek / 60);
    if (Math.abs(min) < 60)  return min > 0 ? 'vor ' + min + ' Minuten' : 'in ' + -min + ' Minuten';
    const std = Math.round(min / 60);
    if (Math.abs(std) < 24)  return std > 0 ? 'vor ' + std + ' Stunden' : 'in ' + -std + ' Stunden';
    const tage = tageZwischen(x, jetzt);
    if (tage === 1)  return 'gestern';
    if (tage === -1) return 'morgen';
    if (Math.abs(tage) < 7) return tage > 0 ? 'vor ' + tage + ' Tagen' : 'in ' + -tage + ' Tagen';
    return 'am ' + x.getDate() + '. ' + MONATE[x.getMonth()] +
           (x.getFullYear() !== jetzt.getFullYear() ? ' ' + x.getFullYear() : '');
  };

  return { MS_TAG, WOCHENTAGE, MONATE,
           lies, istDatum, alsText, alsTag,
           tagAnfang, tagEnde, wochenAnfang, monatsAnfang, monatsEnde, jahresAnfang,
           plusTage, plusMonate, tageZwischen,
           istWochenende, werktageZwischen, plusWerktage,
           kalenderwoche, vorText };
})();

window.Datum = Datum;
