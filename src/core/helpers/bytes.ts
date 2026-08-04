/* ============================================================================
 * core/helpers/bytes.ts — Bytes nach Base64 und zurück
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/helpers/bytes.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/helpers/bytes.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * Zwei Handgriffe, die für sich genommen langweilig sind und an drei Stellen
 * dieselbe Falle aufgestellt hatten:
 *
 *   toBase64(buf)    Bytes → Base64-Zeichenkette
 *   fromBase64(text) Base64-Zeichenkette → Bytes
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
 *
 * ─── SPRACHE ────────────────────────────────────────────────────────────────
 *
 * Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27. Der
 * Modulname war schon englisch und bleibt `Bytes`; nur die drei Namen darin
 * ziehen nach:
 *
 *   alsB64 → toBase64      ausB64 → fromBase64      SCHEIBE → CHUNK
 *
 * Gemessen sechs Aufrufe in drei Dateien (`krypto.js`, `maschine.js`,
 * `werkzeuge.js`) und zwei in `test104.mjs` — der Fall „im Rahmen einer
 * geplanten Migration", nicht die verbotene Massenumbenennung.
 * ==========================================================================*/

const Bytes = (() => {

  /* Weit unter jeder Browsergrenze und gross genug, dass die Schleife nicht
     ins Gewicht fällt: bei 4 MB sind das 128 Durchläufe. */
  const CHUNK = 32768;

  /**
   * Bytes als Base64.
   *
   * `apply` statt Spread: es übergibt die Scheibe als ein Argument-Array,
   * und die Scheibe ist klein genug, dass der Stapel es trägt. Der Spread
   * täte dasselbe für kleine Puffer und bräche bei grossen — genau der
   * Unterschied, um den es hier geht.
   */
  const toBase64 = (buf: ArrayBuffer | Uint8Array): string => {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i += CHUNK)
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
    return btoa(s);
  };

  /**
   * Base64 zurück in Bytes.
   *
   * `Uint8Array.from` mit einer Abbildung hat das Stapelproblem nicht — es
   * ruft die Funktion je Zeichen auf, statt alle Zeichen auf einmal zu
   * übergeben. Diese Richtung war deshalb nie kaputt und bleibt, wie sie war.
   */
  const fromBase64 = (text: unknown): Uint8Array =>
    Uint8Array.from(atob(String(text)), c => c.charCodeAt(0));

  return { toBase64, fromBase64, CHUNK };
})();

(window as any).Bytes = Bytes;
