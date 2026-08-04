/* ============================================================================
 * core/helpers/date.ts — Zeit, ohne Bibliothek
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/helpers/date.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/helpers/date.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es
 * vorher.
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
 *
 * ─── SPRACHE ────────────────────────────────────────────────────────────────
 *
 * Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27. Auch die
 * öffentliche Schnittstelle ist umgestellt: aus `Datum.lies()` wurde
 * `Dates.parse()`.
 *
 * Das war erlaubt, weil es gemessen **ein** Aufruf in Produktivcode war
 * (`quell/kern/sicherheit/pruefen.js`) und neun in `test85.mjs` — nicht die
 * verbotene Massenumbenennung, sondern der Fall „im Rahmen einer geplanten
 * Migration". Die Zuordnung, falls jemand die alte Fassung sucht:
 *
 *   lies → parse                istDatum → isDate
 *   alsText → toISO             alsTag → toDay
 *   tagAnfang → startOfDay      tagEnde → endOfDay
 *   wochenAnfang → startOfWeek  monatsAnfang → startOfMonth
 *   monatsEnde → endOfMonth     jahresAnfang → startOfYear
 *   plusTage → addDays          plusMonate → addMonths
 *   tageZwischen → daysBetween  istWochenende → isWeekend
 *   werktageZwischen → businessDaysBetween
 *   plusWerktage → addBusinessDays
 *   kalenderwoche → isoWeek     vorText → relativeText
 *   MS_TAG → MS_DAY   WOCHENTAGE → WEEKDAYS   MONATE → MONTHS
 *
 * **Die Werte bleiben deutsch.** `WEEKDAYS` und `MONTHS` enthalten weiter
 * „Sonntag" und „Januar", und `relativeText` sagt weiter „gestern". Das sind
 * Texte, die ein Mensch liest — E27 stellt nur Namen um, nie Inhalte.
 * ==========================================================================*/

const Dates = (() => {

  const MS_DAY = 86400000;

  /* --- Lesen -------------------------------------------------------------- */

  /**
   * Irgendetwas in ein Datum verwandeln — oder null.
   * Ein reines Datum (2026-08-03) wird als **lokaler** Tag gelesen, nicht
   * als UTC-Mitternacht. Das ist der häufigste Zeitzonenfehler überhaupt.
   */
  const parse = (x: unknown): Date | null => {
    /* `isNaN(date)` in der alten Fassung war dasselbe wie `isNaN(getTime())`
       — eine Date wird über valueOf zur Zahl. Hier steht es ausgeschrieben,
       weil TypeScript die stille Umwandlung zu Recht nicht mitmacht. */
    if (x instanceof Date) return isNaN(x.getTime()) ? null : x;
    if (typeof x === 'number') return new Date(x);
    const s = String(x || '').trim();
    if (!s) return null;
    const rein = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (rein) return new Date(Number(rein[1]), Number(rein[2]) - 1, Number(rein[3]));
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const isDate = (x: unknown): boolean => parse(x) !== null;

  /* --- Schreiben ---------------------------------------------------------- */

  const two = (n: number): string => String(n).padStart(2, '0');

  /** ISO mit Zeit — die Form, in der gespeichert wird. */
  const toISO = (d: unknown): string => (parse(d) || new Date()).toISOString();

  /** Nur der Tag, in lokaler Zeit: 2026-08-03. */
  const toDay = (d: unknown): string => {
    const x = parse(d);
    if (!x) return '';
    return x.getFullYear() + '-' + two(x.getMonth() + 1) + '-' + two(x.getDate());
  };

  /* --- Runden ------------------------------------------------------------- */

  const startOfDay = (d: unknown): Date | null => { const x = parse(d); if (!x) return null;
    const y = new Date(x); y.setHours(0, 0, 0, 0); return y; };

  const endOfDay = (d: unknown): Date | null => { const x = parse(d); if (!x) return null;
    const y = new Date(x); y.setHours(23, 59, 59, 999); return y; };

  const startOfWeek = (d: unknown, mondays = true): Date | null => {
    const x = startOfDay(d); if (!x) return null;
    const day = x.getDay();                       /* 0 = Sonntag */
    const back = mondays ? (day === 0 ? 6 : day - 1) : day;
    x.setDate(x.getDate() - back);
    return x;
  };

  const startOfMonth = (d: unknown): Date | null => { const x = startOfDay(d); if (!x) return null;
    x.setDate(1); return x; };

  const endOfMonth = (d: unknown): Date | null => { const x = startOfMonth(d); if (!x) return null;
    x.setMonth(x.getMonth() + 1); x.setDate(0); x.setHours(23, 59, 59, 999); return x; };

  const startOfYear = (d: unknown): Date | null => { const x = startOfDay(d); if (!x) return null;
    x.setMonth(0, 1); return x; };

  /* --- Rechnen ------------------------------------------------------------ */

  /**
   * Tage dazuzählen — über setDate, nicht über Millisekunden.
   * Sonst geht bei der Zeitumstellung ein Tag verloren oder es kommt einer
   * dazu, und zwar genau zweimal im Jahr, was niemand reproduzieren kann.
   */
  const addDays = (d: unknown, n: unknown): Date | null => { const x = parse(d); if (!x) return null;
    const y = new Date(x); y.setDate(y.getDate() + Number(n || 0)); return y; };

  /**
   * Monate dazuzählen, mit Klemmung ans Monatsende.
   * 31. Januar plus ein Monat ist der 28. Februar, nicht der 3. März.
   */
  const addMonths = (d: unknown, n: unknown): Date | null => {
    const x = parse(d); if (!x) return null;
    const day = x.getDate();
    const y = new Date(x);
    y.setDate(1);
    y.setMonth(y.getMonth() + Number(n || 0));
    const last = new Date(y.getFullYear(), y.getMonth() + 1, 0).getDate();
    y.setDate(Math.min(day, last));
    return y;
  };

  /** Ganze Tage dazwischen — über die Tagesgrenzen, nicht über die Stunden. */
  const daysBetween = (a: unknown, b: unknown): number => {
    const x = startOfDay(a), y = startOfDay(b);
    if (!x || !y) return 0;
    return Math.round((y.getTime() - x.getTime()) / MS_DAY);
  };

  /* --- Werktage -----------------------------------------------------------
     Notion kennt keine Werktage. Hier zählen sie, weil fast jede Frist in
     Werktagen gemeint ist und niemand das von Hand ausrechnen will. */

  const isWeekend = (d: unknown): boolean => { const x = parse(d); if (!x) return false;
    const t = x.getDay(); return t === 0 || t === 6; };

  const businessDaysBetween = (a: unknown, b: unknown): number => {
    let x = startOfDay(a), y = startOfDay(b);
    if (!x || !y) return 0;
    const backwards = x > y;
    if (backwards) { const h = x; x = y; y = h; }
    let n = 0;
    const run = new Date(x);
    while (run < y) { run.setDate(run.getDate() + 1); if (!isWeekend(run)) n++; }
    return backwards ? -n : n;
  };

  const addBusinessDays = (d: unknown, n: unknown): Date | null => {
    let x = startOfDay(d); if (!x) return null;
    let left = Math.abs(Number(n) || 0);
    const step = (Number(n) || 0) < 0 ? -1 : 1;
    while (left > 0) {
      x = addDays(x, step);
      if (!x) return null;          /* kann hier nicht eintreten — addDays
                                       bekommt ein gültiges Datum. Steht da,
                                       weil der Typ es zulässt und ein `!`
                                       eine Behauptung wäre statt einer
                                       Prüfung. */
      if (!isWeekend(x)) left--;
    }
    return x;
  };

  /* --- Kalenderwoche nach ISO --------------------------------------------
     Nicht „die wievielte Woche im Jahr", sondern die Regel, nach der der
     Rest Europas zählt: Woche 1 ist die mit dem ersten Donnerstag. */

  const isoWeek = (d: unknown): number => {
    const x = startOfDay(d); if (!x) return 0;
    const t = new Date(x);
    t.setDate(t.getDate() + 4 - (t.getDay() || 7));
    const yearStart = new Date(t.getFullYear(), 0, 1);
    return Math.ceil(((t.getTime() - yearStart.getTime()) / MS_DAY + 1) / 7);
  };

  /* --- Für Menschen --------------------------------------------------------
     Die Namen sind englisch, die Inhalte deutsch. Das ist kein Versehen: was
     hier drinsteht, liest ein Mensch (E27). */

  const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch',
                    'Donnerstag', 'Freitag', 'Samstag'];
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
                  'August', 'September', 'Oktober', 'November', 'Dezember'];

  /** „vor 3 Minuten", „gestern", „am 3. August" — je nach Abstand. */
  const relativeText = (d: unknown, now: Date = new Date()): string => {
    const x = parse(d); if (!x) return '';
    const sec = Math.round((now.getTime() - x.getTime()) / 1000);
    if (Math.abs(sec) < 45)  return 'gerade eben';
    const min = Math.round(sec / 60);
    if (Math.abs(min) < 60)  return min > 0 ? 'vor ' + min + ' Minuten' : 'in ' + -min + ' Minuten';
    const hrs = Math.round(min / 60);
    if (Math.abs(hrs) < 24)  return hrs > 0 ? 'vor ' + hrs + ' Stunden' : 'in ' + -hrs + ' Stunden';
    const days = daysBetween(x, now);
    if (days === 1)  return 'gestern';
    if (days === -1) return 'morgen';
    if (Math.abs(days) < 7) return days > 0 ? 'vor ' + days + ' Tagen' : 'in ' + -days + ' Tagen';
    /* `?? ''` nur wegen `noUncheckedIndexedAccess` — getMonth() liefert 0–11,
       und MONTHS hat zwölf Einträge. Treffen kann es nicht. */
    return 'am ' + x.getDate() + '. ' + (MONTHS[x.getMonth()] ?? '') +
           (x.getFullYear() !== now.getFullYear() ? ' ' + x.getFullYear() : '');
  };

  return { MS_DAY, WEEKDAYS, MONTHS,
           parse, isDate, toISO, toDay,
           startOfDay, endOfDay, startOfWeek, startOfMonth, endOfMonth, startOfYear,
           addDays, addMonths, daysBetween,
           isWeekend, businessDaysBetween, addBusinessDays,
           isoWeek, relativeText };
})();

(window as any).Dates = Dates;
