/* ============================================================================
 * kern/helfer/melder.js — was schiefgeht, soll auffindbar sein
 * ----------------------------------------------------------------------------
 * `console.log` ist bequem und genau einmal falsch: es ist weg, sobald das
 * Fenster zu ist. Wenn jemand sagt „gestern ging etwas nicht", steht nichts
 * mehr da.
 *
 * Deshalb sammelt der Melder alles im Speicher — und schreibt es nur dann in
 * die Konsole, wenn es wirklich zählt. Bei Bedarf lässt sich der Verlauf als
 * Datei ausgeben und einer Meldung beilegen.
 *
 * Vier Stufen. Der Unterschied ist nicht die Lautstärke, sondern die Frage,
 * ob jemand etwas tun muss:
 *
 *   spur     nur für die Fehlersuche, im Betrieb aus
 *   info     ist geschehen, niemand muss handeln
 *   warnung  ist schiefgegangen, die App hat sich selbst geholfen
 *   fehler   ist schiefgegangen, jemand muss hinsehen
 *
 * Bewusst kein Versand nach draussen. Ein Melder, der still Daten
 * verschickt, ist kein Melder, sondern eine Wanze.
 * ==========================================================================*/

const Melder = (() => {

  const STUFEN = ['spur', 'info', 'warnung', 'fehler'];
  const MAX = 500;

  const verlauf = [];
  let stufe = 'info';           /* alles ab hier wird gesammelt */
  let konsole = 'warnung';      /* alles ab hier steht auch in der Konsole */

  const rang = (s) => STUFEN.indexOf(s);

  const zeit = () => new Date().toISOString();

  const schreibe = (s, wo, text, daten) => {
    if (rang(s) < rang(stufe)) return;

    const eintrag = { stufe: s, wo: String(wo || ''), text: String(text || ''),
                      daten, wann: zeit() };
    verlauf.push(eintrag);
    if (verlauf.length > MAX) verlauf.shift();

    if (rang(s) >= rang(konsole)) {
      const zeile = '[' + wo + '] ' + text;
      if (s === 'fehler') console.error(zeile, daten !== undefined ? daten : '');
      else if (s === 'warnung') console.warn(zeile, daten !== undefined ? daten : '');
      else console.log(zeile, daten !== undefined ? daten : '');
    }

    /* Fehler wandern zusätzlich in die Fehlerliste der Bestandspflege —
       dort sucht ein Mensch, nicht in der Konsole. */
    if (s === 'fehler' && typeof Pflege !== 'undefined' && Pflege.fehlerMerken) {
      try { Pflege.fehlerMerken(new Error(text), String(wo || '')); } catch {}
    }
    return eintrag;
  };

  const spur    = (wo, text, daten) => schreibe('spur', wo, text, daten);
  const info    = (wo, text, daten) => schreibe('info', wo, text, daten);
  const warnung = (wo, text, daten) => schreibe('warnung', wo, text, daten);
  const fehler  = (wo, text, daten) => schreibe('fehler', wo, text, daten);

  /**
   * Eine Funktion einpacken: läuft sie auf einen Fehler, wird er gemeldet
   * statt geschluckt — und die App läuft weiter.
   */
  const behuetet = (wo, fn, ersatz = undefined) => (...a) => {
    try { return fn(...a); }
    catch (e) { fehler(wo, e && e.message ? e.message : String(e), e); return ersatz; }
  };

  /** Wie lange hat das gedauert? Wird als Spur gemeldet, nicht als Lärm. */
  const misst = (wo, fn) => {
    const t0 = performance.now();
    try { return fn(); }
    finally { spur(wo, 'dauerte ' + Math.round(performance.now() - t0) + ' ms'); }
  };

  const alles = (nurAb) => nurAb
    ? verlauf.filter(e => rang(e.stufe) >= rang(nurAb))
    : verlauf.slice();

  const zahlen = () => {
    const z = { spur: 0, info: 0, warnung: 0, fehler: 0 };
    verlauf.forEach(e => { z[e.stufe]++; });
    return z;
  };

  const alsText = () => verlauf
    .map(e => e.wann + '  ' + e.stufe.padEnd(8) + '[' + e.wo + '] ' + e.text)
    .join('\n');

  const leeren = () => { verlauf.length = 0; };

  const stufeSetzen = (s) => { if (STUFEN.includes(s)) stufe = s; return stufe; };
  const konsoleSetzen = (s) => { if (STUFEN.includes(s) || s === 'aus') konsole = s; return konsole; };

  return { STUFEN, spur, info, warnung, fehler, behuetet, misst,
           alles, zahlen, alsText, leeren, stufeSetzen, konsoleSetzen,
           stufe: () => stufe, konsole: () => konsole };
})();

window.Melder = Melder;
