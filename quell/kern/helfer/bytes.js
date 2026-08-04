/* ============================================================================
 * kern/helfer/bytes.js — Bytes nach Base64 und zurück
 * ----------------------------------------------------------------------------
 * Zwei Handgriffe, die für sich genommen langweilig sind und an drei Stellen
 * dieselbe Falle aufgestellt hatten:
 *
 *   alsB64(buf)   Bytes → Base64-Zeichenkette
 *   ausB64(text)  Base64-Zeichenkette → Bytes
 *
 * DIE FALLE. Die naheliegende Fassung lautet
 *
 *     btoa(String.fromCharCode(...new Uint8Array(buf)))
 *
 * und ist für kleine Puffer richtig. Der Spread reicht jedes einzelne Byte
 * als eigenen Aufruf-Parameter weiter; ab etwa 128 000 Bytes ist der
 * Aufrufstapel voll und der Browser wirft `Maximum call stack size exceeded`.
 *
 * Das war kein Randfall. Diese Fassung stand in der verschlüsselten
 * Sicherung, in der Seitensperre und im Abgleich — also genau dort, wo etwas
 * verschlüsselt wird, und damit genau dort, wo die Datenmenge gross ist. Wer
 * genug Notizen hatte, dass sich das Sichern lohnt, konnte nicht sichern. Die
 * Meldung sprach dabei von Aufrufstapeln und nicht von Grössen, sodass auch
 * niemand darauf kam, woran es lag.
 *
 * WARUM HIER UND NICHT DREIMAL. Dreimal dieselbe kleine Funktion ist genau
 * das Muster, an dem sich dieses Projekt immer wieder verschluckt: an einer
 * Stelle repariert, an der Nachbarstelle nicht. Eine Fassung, ein Ort.
 * `pruefungen/lauf/test87.mjs` hält fest, dass keine vierte entsteht.
 * ==========================================================================*/

const Bytes = (() => {

  /* Weit unter jeder Browsergrenze und gross genug, dass die Schleife nicht
     ins Gewicht fällt: bei 4 MB sind das 128 Durchläufe. */
  const SCHEIBE = 32768;

  /**
   * Bytes als Base64.
   * @param {ArrayBuffer|Uint8Array} buf
   * @returns {string}
   */
  const alsB64 = (buf) => {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += SCHEIBE)
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + SCHEIBE));
    return btoa(s);
  };

  /**
   * Base64 zurück in Bytes.
   *
   * `Uint8Array.from` mit einer Abbildung hat das Stapelproblem nicht — es
   * ruft die Funktion je Zeichen auf, statt alle Zeichen auf einmal zu
   * übergeben. Diese Richtung war deshalb nie kaputt und bleibt, wie sie war.
   *
   * @param {string} text
   * @returns {Uint8Array}
   */
  const ausB64 = (text) => Uint8Array.from(atob(String(text)), c => c.charCodeAt(0));

  return { alsB64, ausB64, SCHEIBE };
})();

window.Bytes = Bytes;
