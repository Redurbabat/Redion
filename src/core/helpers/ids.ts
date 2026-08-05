/* ============================================================================
 * core/helpers/ids.ts — Kennungen erzeugen und lesen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/helpers/ids.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/helpers/ids.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * Eine Kennung ist das Einzige an einem Satz, das sich nie ändern darf. Der
 * Titel wird umbenannt, der Ort verschoben, der Inhalt ersetzt — die Kennung
 * bleibt, sonst reisst jeder Verweis darauf.
 *
 * Deshalb steht sie hier und nicht in fünf Dateien verstreut. Vorher stand
 * derselbe Dreizeiler an drei Stellen; wenn eine davon nachgezogen wird und
 * die anderen nicht, entstehen zwei Sorten Kennungen im selben Bestand.
 *
 * Drei Formen, jede mit einem Grund:
 *
 *   long()      UUID — für alles, was gespeichert wird. Kollisionsfrei genug,
 *               dass zwei Geräte ohne Absprache Kennungen vergeben dürfen.
 *   short(n)    für Spaltenschlüssel und Ähnliches, wo die Kennung im JSON
 *               tausendfach vorkommt und Länge wirklich Platz kostet.
 *   readable()  für Codes, die ein Mensch abtippt — ohne 0/O und 1/I/l.
 *
 * ─── SPRACHE ────────────────────────────────────────────────────────────────
 *
 * Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27. Diese Datei
 * ist die erste, bei der auch die **öffentliche** Schnittstelle umgestellt
 * wurde: aus `Kennungen.lang()` wurde `Ids.long()`.
 *
 * Das war vertretbar, weil es gemessen nur fünfzehn Aufrufe in drei Dateien
 * waren — nicht die verbotene Massenumbenennung, sondern der Fall „im Rahmen
 * einer geplanten Migration". Bei einem Modul mit hundert Aufrufern wäre die
 * Antwort eine andere gewesen.
 * ==========================================================================*/

const Ids = (() => {

  function randomHex(n: number): string {
    if (self.crypto && crypto.getRandomValues) {
      const a = new Uint8Array(Math.ceil(n / 2));
      crypto.getRandomValues(a);
      return [...a].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, n);
    }
    let s = '';
    while (s.length < n) s += Math.random().toString(16).slice(2);
    return s.slice(0, n);
  }

  /** Die volle Form. Wird gespeichert, wandert im Abgleich, steht in Links. */
  const long = (): ID => (self.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : randomHex(8) + '-' + randomHex(4) + '-4' + randomHex(3) + '-' +
      /* Die Variante-Ziffer einer UUID4 ist 8, 9, a oder b — nicht beliebig.
         `?? '8'` steht dort nur, weil `noUncheckedIndexedAccess` bei jedem
         Indexzugriff `undefined` für möglich hält; hier kann es das nicht. */
      ('89ab'[Math.floor(Math.random() * 4)] ?? '8') +
      randomHex(3) + '-' + randomHex(12);

  /** Kurz, aber immer noch zufällig. Für Spaltenschlüssel. */
  const short = (n = 5): string => long().replace(/-/g, '').slice(0, n);

  /* Ohne 0/O und 1/I/L — die verwechselt jeder beim Abtippen. */
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  /** Ein Code zum Vorlesen und Eintippen, z. B. „K7M2-QW9F". */
  const readable = (length = 8, group = 4): string => {
    let s = '';
    for (let i = 0; i < length; i++) {
      s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)] ?? 'A';
      if (group && (i + 1) % group === 0 && i + 1 < length) s += '-';
    }
    return s;
  };

  /* --- Notions Schreibweisen ---------------------------------------------
     Die Schnittstelle bekommt Kennungen mal mit, mal ohne Striche. Beides
     meint dasselbe, und beides muss verglichen werden können. */

  const withoutDashes = (id: unknown): string => String(id || '').replace(/-/g, '');

  const withDashes = (id: unknown): string => {
    const s = withoutDashes(id);
    if (s.length !== 32) return String(id || '');
    return s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-' +
           s.slice(16, 20) + '-' + s.slice(20);
  };

  const equal = (a: unknown, b: unknown): boolean =>
    withoutDashes(a).toLowerCase() === withoutDashes(b).toLowerCase();

  /** Sieht das überhaupt nach einer Kennung aus? */
  const isValid = (id: unknown): boolean => /^[0-9a-f]{32}$/i.test(withoutDashes(id));

  /** Die Kennung aus einer Adresse herausschneiden. */
  const fromUrl = (text: unknown): string => {
    const t = String(text || '');
    const m = t.match(/[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i);
    return m ? withDashes(m[0]) : '';
  };

  return { long, short, readable, withoutDashes, withDashes, equal, isValid, fromUrl };
})();

(window as any).Ids = Ids;
