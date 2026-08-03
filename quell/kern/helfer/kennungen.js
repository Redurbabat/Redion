/* ============================================================================
 * kern/helfer/kennungen.js — Kennungen erzeugen und lesen
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
 *   lang()     UUID — für alles, was gespeichert wird. Kollisionsfrei genug,
 *              dass zwei Geräte ohne Absprache Kennungen vergeben dürfen.
 *   kurz(n)    für Spaltenschlüssel und Ähnliches, wo die Kennung im JSON
 *              tausendfach vorkommt und Länge wirklich Platz kostet.
 *   lesbar()   für Codes, die ein Mensch abtippt — ohne 0/O und 1/I/l.
 * ==========================================================================*/

const Kennungen = (() => {

  /** Die volle Form. Wird gespeichert, wandert im Abgleich, steht in Links. */
  const lang = () => (self.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : zufallHex(8) + '-' + zufallHex(4) + '-4' + zufallHex(3) + '-' +
      '89ab'[Math.floor(Math.random() * 4)] + zufallHex(3) + '-' + zufallHex(12);

  function zufallHex(n) {
    if (self.crypto && crypto.getRandomValues) {
      const a = new Uint8Array(Math.ceil(n / 2));
      crypto.getRandomValues(a);
      return [...a].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, n);
    }
    let s = '';
    while (s.length < n) s += Math.random().toString(16).slice(2);
    return s.slice(0, n);
  }

  /** Kurz, aber immer noch zufällig. Für Spaltenschlüssel. */
  const kurz = (n = 5) => lang().replace(/-/g, '').slice(0, n);

  /* Ohne 0/O und 1/I/L — die verwechselt jeder beim Abtippen. */
  const ZEICHEN = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  /** Ein Code zum Vorlesen und Eintippen, z. B. „K7M2-QW9F". */
  const lesbar = (laenge = 8, block = 4) => {
    let s = '';
    for (let i = 0; i < laenge; i++) {
      s += ZEICHEN[Math.floor(Math.random() * ZEICHEN.length)];
      if (block && (i + 1) % block === 0 && i + 1 < laenge) s += '-';
    }
    return s;
  };

  /* --- Notions Schreibweisen ---------------------------------------------
     Die Schnittstelle bekommt Kennungen mal mit, mal ohne Striche. Beides
     meint dasselbe, und beides muss verglichen werden können. */

  const ohneStriche = (id) => String(id || '').replace(/-/g, '');

  const mitStrichen = (id) => {
    const s = ohneStriche(id);
    if (s.length !== 32) return String(id || '');
    return s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-' +
           s.slice(16, 20) + '-' + s.slice(20);
  };

  const gleich = (a, b) => ohneStriche(a).toLowerCase() === ohneStriche(b).toLowerCase();

  /** Sieht das überhaupt nach einer Kennung aus? */
  const gueltig = (id) => /^[0-9a-f]{32}$/i.test(ohneStriche(id));

  /** Die Kennung aus einer Adresse herausschneiden. */
  const ausAdresse = (text) => {
    const t = String(text || '');
    const m = t.match(/[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i);
    return m ? mitStrichen(m[0]) : '';
  };

  return { lang, kurz, lesbar, ohneStriche, mitStrichen, gleich, gueltig, ausAdresse };
})();

window.Kennungen = Kennungen;
