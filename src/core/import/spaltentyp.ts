/* ============================================================================
 * core/import/spaltentyp.ts — welche Sorte Spalte ist das?
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/import/spaltentyp.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/import/spaltentyp.js`. Wer das .js bearbeitet, verliert
 * die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * ─── WOZU ───────────────────────────────────────────────────────────────────
 *
 * Beim Einlesen einer CSV oder einer Excel-Mappe wurde bisher **jede** Spalte
 * als Text angelegt. Das sieht beim Ansehen richtig aus und ist es beim
 * Rechnen nicht:
 *
 *   · Eine Summe über einer Textspalte ergibt 0.
 *   · Sortieren sortiert alphabetisch — `100` kommt vor `20`.
 *   · Ein Filter „grösser als" hat nichts zu vergleichen.
 *
 * Der Mensch merkt das an der falschen Summe, nicht am Import. Also wird hier
 * geraten — aber vorsichtig, und mit einer klaren Regel dafür, wann geraten
 * werden darf.
 *
 * ─── DIE REGEL: LIEBER TEXT ALS FALSCH ──────────────────────────────────────
 *
 * Eine Spalte wird nur dann eine Zahlenspalte, wenn **jeder gefüllte Wert**
 * eine Zahl ist. Ein einziges `k. A.` in vierhundert Zeilen macht sie zur
 * Textspalte, und das ist richtig so: eine Zahlenspalte, die einen Wert
 * verschluckt, ist schlimmer als eine Textspalte, die keinen verschluckt.
 *
 * Leere Zellen zählen nicht mit. Eine Spalte, in der die Hälfte fehlt, ist
 * trotzdem eine Zahlenspalte, wenn die andere Hälfte nur aus Zahlen besteht.
 *
 * Und: **eine ganz leere Spalte bleibt Text.** Über nichts lässt sich nichts
 * sagen, und die freundlichste Antwort auf „keine Ahnung" ist die, die nichts
 * kaputtmacht.
 *
 * ─── DAS DEUTSCHE KOMMA ─────────────────────────────────────────────────────
 *
 * `1450,50` ist eineinhalbtausend, `1,450.50` ist dasselbe in englisch, und
 * `1.450,50` ist es auf deutsch mit Tausenderpunkt. Wer das nicht auflöst,
 * legt eine Textspalte an oder — schlimmer — liest `1.450,50` als `1.45`.
 *
 * SPRACHE. Namen englisch, Erklärungen deutsch — E27. Neu, also TypeScript
 * von Anfang an — E28.
 * ==========================================================================*/

const Spaltentyp = (() => {

  const leer = (v: unknown): boolean =>
    v === null || v === undefined || String(v).trim() === '';

  /**
   * Eine Zahl aus einem getippten Text — oder `null`.
   *
   * Erkennt beide Schreibweisen, und zwar am LETZTEN Trennzeichen: steht
   * hinter dem letzten Punkt oder Komma eine Gruppe von genau drei Ziffern
   * und gibt es davor ein anderes Trennzeichen, war es ein Tausendertrenner.
   */
  const alsZahl = (roh: unknown): number | null => {
    let t = String(roh ?? '').trim();
    if (!t) return null;

    /* Währungszeichen und Prozent gehören zur Schreibweise, nicht zur Zahl. */
    const prozent = /%\s*$/.test(t);
    t = t.replace(/^[^\d+\-.,]*/, '').replace(/[^\d]*$/, '');
    t = t.replace(/[ ’'’\s]/g, '');            /* 1'450 · 1 450 · 1 450 */
    if (!t) return null;

    const letztesKomma = t.lastIndexOf(',');
    const letzterPunkt = t.lastIndexOf('.');

    if (letztesKomma >= 0 && letzterPunkt >= 0) {
      /* Beide da: das hintere ist das Dezimalzeichen. */
      if (letztesKomma > letzterPunkt) t = t.replace(/\./g, '').replace(',', '.');
      else t = t.replace(/,/g, '');
    } else if (letztesKomma >= 0) {
      /* Nur Komma: Dezimalzeichen — ausser es trennt Dreiergruppen. */
      const nach = t.length - letztesKomma - 1;
      const mehrfach = (t.match(/,/g) || []).length > 1;
      t = (nach === 3 && mehrfach) ? t.replace(/,/g, '') : t.replace(',', '.');
    } else if (letzterPunkt >= 0) {
      const nach = t.length - letzterPunkt - 1;
      const mehrfach = (t.match(/\./g) || []).length > 1;
      if (nach === 3 && mehrfach) t = t.replace(/\./g, '');
    }

    if (!/^[+-]?\d*\.?\d+([eE][+-]?\d+)?$/.test(t)) return null;
    const n = Number(t);
    if (!isFinite(n)) return null;
    return prozent ? n / 100 : n;
  };

  /** Ein Datum aus einem getippten Text — oder `null`. */
  const alsDatum = (roh: unknown): Date | null => {
    const t = String(roh ?? '').trim();
    if (!t || t.length < 6) return null;

    /* 4.8.2026 · 04.08.2026 · 4/8/2026 — Tag zuerst, wie im deutschen Raum.
       Das ist eine Entscheidung: `3/4/2026` ist zweideutig, und die eine
       Lesart muss gewählt werden. Wer Amerikanisches einliest, bekommt bei
       Tagen über 12 automatisch das Richtige, weil `13` kein Monat ist. */
    const de = t.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if (de) {
      let tag = Number(de[1]), monat = Number(de[2]);
      if (monat > 12 && tag <= 12) { const h = tag; tag = monat; monat = h; }
      if (monat < 1 || monat > 12 || tag < 1 || tag > 31) return null;
      const d = new Date(Number(de[3]), monat - 1, tag);
      return isNaN(d.getTime()) ? null : d;
    }

    /* 2026-08-04 und ISO mit Uhrzeit. */
    if (/^\d{4}-\d{2}-\d{2}([T ]|$)/.test(t)) {
      const d = new Date(t);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const JA = ['ja', 'wahr', 'true', 'x', '1', '✓', 'yes'];
  const NEIN = ['nein', 'falsch', 'false', '', '0', 'no'];

  const alsJaNein = (roh: unknown): boolean | null => {
    const t = String(roh ?? '').trim().toLowerCase();
    if (JA.includes(t)) return true;
    if (NEIN.includes(t) && t !== '') return false;
    return null;
  };

  /**
   * Welche Sorte ist diese Spalte?
   *
   * @param werte  die Werte der Spalte, ohne Kopfzeile
   * @returns `{ typ, sicher, gefuellt, optionen }`
   *
   * `sicher` ist der Anteil der gefüllten Werte, die zum erkannten Typ
   * passen — bei allem ausser Text immer 1, weil sonst Text herauskäme. Die
   * Zahl steht trotzdem da: sie macht sichtbar, worauf die Entscheidung
   * beruht, und sie taugt für eine Anzeige beim Import.
   */
  const erkenne = (werte: unknown[]): {
    typ: string; sicher: number; gefuellt: number; optionen: string[];
  } => {
    const gefuellt = (werte || []).filter(v => !leer(v));
    if (!gefuellt.length) return { typ: 'text', sicher: 0, gefuellt: 0, optionen: [] };

    const alle = (pruef: (v: unknown) => unknown): boolean =>
      gefuellt.every(v => pruef(v) !== null);

    if (alle(alsJaNein)) return { typ: 'checkbox', sicher: 1, gefuellt: gefuellt.length, optionen: [] };
    if (alle(alsZahl))   return { typ: 'number',   sicher: 1, gefuellt: gefuellt.length, optionen: [] };
    if (alle(alsDatum))  return { typ: 'date',     sicher: 1, gefuellt: gefuellt.length, optionen: [] };

    /* AUSWAHL — aber nur, wenn es wirklich eine ist. Wenige verschiedene
       Werte, jeder mehrfach, und keiner davon lang. „Status" mit vier
       Ausprägungen über zweihundert Zeilen ist eine Auswahl; zweihundert
       verschiedene Kundennamen sind keine, auch wenn sich zwei doppeln. */
    const verschiedene = [...new Set(gefuellt.map(v => String(v).trim()))];
    const kurz = verschiedene.every(v => v.length <= 40);
    if (kurz && verschiedene.length > 1 && verschiedene.length <= 12 &&
        gefuellt.length >= verschiedene.length * 3)
      return { typ: 'select', sicher: verschiedene.length / gefuellt.length,
               gefuellt: gefuellt.length, optionen: verschiedene.sort() };

    const zahlen = gefuellt.filter(v => alsZahl(v) !== null).length;
    return { typ: 'text', sicher: 1 - (zahlen / gefuellt.length),
             gefuellt: gefuellt.length, optionen: [] };
  };

  /** Einen Text in den Wert der erkannten Sorte umwandeln. */
  const wandle = (roh: unknown, typ: string): any => {
    if (leer(roh)) return '';
    switch (typ) {
      case 'number':   { const n = alsZahl(roh); return n === null ? String(roh) : n; }
      case 'checkbox': { const b = alsJaNein(roh); return b === null ? false : b; }
      case 'date':     { const d = alsDatum(roh);
                         return d === null ? String(roh) : d.toISOString().slice(0, 10); }
      default:         return String(roh).trim();
    }
  };

  /** Was der Mensch beim Import lesen soll. */
  const NAMEN: Record<string, string> = {
    text: 'Text', number: 'Zahl', date: 'Datum', checkbox: 'Ja/Nein', select: 'Auswahl'
  };
  const name = (typ: string): string => NAMEN[typ] || typ;

  return { erkenne, wandle, name, alsZahl, alsDatum, alsJaNein };
})();

(window as any).Spaltentyp = Spaltentyp;
