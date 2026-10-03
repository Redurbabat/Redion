/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/gfx/history.ts (npm run bauen:ts). */
/* ============================================================================
 * core/gfx/history.ts — der Abbild-Verlauf einer Fläche
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/gfx/history.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/core/gfx/history.js`; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * EIN STAPEL, DEN ES VIERMAL GAB (E687, Audit E681 D1).
 *
 * Whiteboard, Gedankenkarte und Planfläche hielten je einen eigenen
 * Rückgängig-Stapel — zwei Listen aus JSON-Abbildern, eine feste Tiefe
 * (40, 40, 60), `merken` schiebt und kappt und leert das Wiederholen,
 * `zurueck` und `vor` tauschen. Whiteboard und Gedankenkarte hatten ihn
 * Zeile für Zeile gleich; die Planfläche denselben Gedanken mit anderen
 * Namen. Das ist §8 in klein: drei Kataloge derselben Regel, und wer die
 * Regel ändert, ändert sie an einer Stelle und vergisst zwei.
 *
 * WAS DIESER KERN IST — UND WAS NICHT.
 *
 *   · Er kennt weder DOM noch Ablage. Er bekommt Abbilder als Zeichenketten
 *     und gibt sie zurück; was ein Abbild ist (die Formen, die Karte, der
 *     Plan), weiss allein die Fläche. Deshalb lässt er sich in Node prüfen,
 *     ohne einen Browser zu starten (test571, wie test366 für den Strich).
 *   · Er ist NICHT der Seitenverlauf (`kern/zustand/verlauf.ts`): der merkt
 *     sich ganze Seitenbäume mit Zaun und Deckel und läuft über die Ablage.
 *     Dieser hier lebt im Speicher einer offenen Fläche und stirbt mit ihr —
 *     bewusst (E144): ein Abbild einer vollen Fläche hat Kilobytes, und ein
 *     Block, der seine Schrittfolge mitspeichert, wäre ein aufgeblähter
 *     Block.
 *   · Er ist NICHT der Marken-Verlauf (`pdf/marken.ts`, E378): der hält
 *     flache Abbilder mit Vergleich vor dem Merken und hundert Schritten.
 *     Dieselbe Aufgabe, bessere Fassung — sie kommt hierher, wenn ein
 *     Bogen sie mit ihrem Wächter (test345 ff.) umzieht, nicht vorher.
 *
 * DIE REGEL, wörtlich aus den drei Kopien:
 *
 *   merken(abbild)   legt das Abbild VOR einer Änderung oben auf den
 *                    Zurück-Stapel, wirft über der Tiefe das älteste weg und
 *                    leert den Vor-Stapel — ein neuer Schritt macht das
 *                    Wiederholen ungültig.
 *   zurueck(jetzt)   nimmt das oberste Abbild vom Zurück-Stapel und legt
 *                    `jetzt` auf den Vor-Stapel; `null`, wenn nichts da ist.
 *   vor(jetzt)       dasselbe in die andere Richtung.
 *   letztenVerwerfen() nimmt den obersten Zurück-Schritt weg, ohne das
 *                    Wiederholen anzurühren — für den Kritzler, der gleich
 *                    wieder entfernt wird (E144): sonst läge ein Abbild auf
 *                    dem Stapel, das denselben Stand beschreibt, und „↶"
 *                    täte einmal scheinbar nichts.
 *
 * Der Vor-Stapel hat keine Kappe — er kann nie tiefer werden als der
 * Zurück-Stapel, aus dem er sich füllt.
 * ==========================================================================*/

const GfxHistory = (() => {
  type Abbild = string;

  /** Der Verlauf EINER Fläche; `tiefe` ist die Zahl der Schritte zurück. */
  const erstelle = (tiefe = 40) => {
    // 0 und Minus sind KEINE Bitte um die Vorgabe: wer 0 sagt, bekommt 1 —
    // nur was gar keine Zahl ist (undefined, NaN) fällt auf 40 zurück.
    const roh = Number(tiefe);
    const schritte = Math.max(1, Math.floor(Number.isFinite(roh) ? roh : 40));
    const zurueckStapel: Abbild[] = [];
    const vorStapel: Abbild[] = [];

    const merken = (abbild: Abbild): void => {
      zurueckStapel.push(abbild);
      if (zurueckStapel.length > schritte) zurueckStapel.shift();
      vorStapel.length = 0;
    };
    const zurueck = (jetzt: Abbild): Abbild | null => {
      const vorher = zurueckStapel.pop();
      if (vorher === undefined) return null;
      vorStapel.push(jetzt);
      return vorher;
    };
    const vor = (jetzt: Abbild): Abbild | null => {
      const naechster = vorStapel.pop();
      if (naechster === undefined) return null;
      zurueckStapel.push(jetzt);
      return naechster;
    };
    const letztenVerwerfen = (): void => { zurueckStapel.pop(); };
    const leeren = (): void => { zurueckStapel.length = 0; vorStapel.length = 0; };
    const kannZurueck = (): boolean => zurueckStapel.length > 0;
    const kannVor = (): boolean => vorStapel.length > 0;
    /** Für Prüfläufe und Anzeigen: wie viele Schritte in jede Richtung. */
    const stand = (): { zurueck: number; vor: number; tiefe: number } =>
      ({ zurueck: zurueckStapel.length, vor: vorStapel.length, tiefe: schritte });

    return { merken, zurueck, vor, letztenVerwerfen, leeren, kannZurueck, kannVor, stand };
  };

  return { erstelle };
})();

(window as any).GfxHistory = GfxHistory;
