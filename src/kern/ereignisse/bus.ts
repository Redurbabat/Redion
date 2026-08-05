/* ============================================================================
 * kern/ereignisse.js — der Bus statt der Direktaufrufe
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/ereignisse/bus.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/ereignisse/bus.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Die Regel, die diesen Aufbau trägt, lautet: **ein Modul ruft kein anderes
 * Modul.** Braucht es etwas von drüben, sagt es Bescheid und wartet, ob
 * jemand zuhört.
 *
 * Warum das zählt: vorher rief der Kalender die Datenbank, die Datenbank die
 * Schale, die Schale die KI. Jede dieser Linien ist einzeln vernünftig, und
 * zusammen ergeben sie ein Knäuel, in dem man eine Datei nicht mehr anfassen
 * kann, ohne drei andere zu lesen. Ein Bus macht daraus einen Stern: jeder
 * redet mit der Mitte, keiner mit dem Nachbarn.
 *
 * Bewusst klein gehalten — vier Funktionen:
 *
 *      horche(name, fn)     zuhören, gibt eine Abmeldefunktion zurück
 *      einmal(name, fn)     einmal zuhören, dann von selbst abmelden
 *      melde(name, daten)   sagen, dass etwas geschehen ist
 *      frage(name, daten)   fragen und die Antworten einsammeln
 *
 * `melde` ist eine Aussage („die Seite wurde gespeichert"), `frage` eine
 * Frage („was gehört in die Seitenleiste?"). Der Unterschied ist wichtig:
 * eine Aussage darf niemanden interessieren, eine Frage will Antworten.
 *
 * Ein Zuhörer, der einen Fehler wirft, reisst die anderen nicht mit. Sonst
 * wäre ein kaputtes Modul genug, um die ganze App anzuhalten — und der
 * Fehler stünde nirgends.
 * ==========================================================================*/

/** Ein Zuhörer. Was er zurückgibt, zählt nur bei `frage`. */
type Zuhoerer = (daten?: unknown) => unknown;

/** Aufheben und aufrufen — sonst hört ein geschlossenes Fenster ewig weiter. */
type Abmelden = () => void;

/** Ein Eintrag der Mitschrift. Nur für die Fehlersuche. */
type Spureintrag = { name: string; daten: unknown; wann: number };

const Ereignisse = (() => {

  /* name -> Set von Zuhörern */
  const zuhoerer = new Map<string, Set<Zuhoerer>>();

  /* Die letzten Meldungen — nur für die Fehlersuche, nicht für die Logik. */
  const MAX_SPUR = 200;
  const spur: Spureintrag[] = [];
  let mitschnitt = false;

  /**
   * Auf ein Ereignis hören.
   * Gibt das Abmelden zurück — immer aufheben.
   */
  const horche = (name: string, fn: unknown): Abmelden => {
    if (typeof fn !== 'function') return () => {};
    const f = fn as Zuhoerer;
    let s = zuhoerer.get(name);
    if (!s) { s = new Set<Zuhoerer>(); zuhoerer.set(name, s); }
    s.add(f);
    return () => { zuhoerer.get(name)?.delete(f); };
  };

  /** Einmal hören, dann von selbst abmelden. */
  const einmal = (name: string, fn: Zuhoerer): Abmelden => {
    const ab = horche(name, (daten?: unknown) => { ab(); return fn(daten); });
    return ab;
  };

  const notieren = (name: string, daten: unknown): void => {
    if (!mitschnitt) return;
    spur.push({ name, daten, wann: Date.now() });
    if (spur.length > MAX_SPUR) spur.shift();
  };

  /**
   * Etwas ist geschehen. Interessiert es niemanden, ist das kein Fehler.
   * Gibt zurück, wie viele zugehört haben.
   */
  const melde = (name: string, daten?: unknown): number => {
    notieren(name, daten);
    const s = zuhoerer.get(name);
    if (!s || !s.size) return 0;
    let n = 0;
    /* Über eine Kopie laufen: ein Zuhörer darf sich beim Zuhören abmelden. */
    [...s].forEach(fn => {
      try { fn(daten); n++; }
      catch (e) {
        /* Ein kaputtes Modul hält die anderen nicht auf — aber still bleibt
           es auch nicht. */
        console.error('Ereignis „' + name + '": ' +
                      (e instanceof Error ? e.message : String(e)), e);
        if (typeof Pflege !== 'undefined' && Pflege.fehlerMerken)
          try { Pflege.fehlerMerken(e, 'Ereignis ' + name); } catch {}
      }
    });
    return n;
  };

  /**
   * Eine Frage in die Runde. Jede Antwort kommt in die Liste, `undefined`
   * und `null` fallen heraus — wer nichts beizutragen hat, sagt nichts.
   */
  const frage = (name: string, daten?: unknown): unknown[] => {
    notieren(name, daten);
    const s = zuhoerer.get(name);
    if (!s || !s.size) return [];
    const raus: unknown[] = [];
    [...s].forEach(fn => {
      try {
        const a = fn(daten);
        if (a !== undefined && a !== null) raus.push(a);
      } catch (e) {
        console.error('Frage „' + name + '": ' +
                      (e instanceof Error ? e.message : String(e)), e);
      }
    });
    return raus;
  };

  /** Wer hört gerade worauf? Für die Fehlersuche und die Übersicht. */
  const uebersicht = (): { name: string; zuhoerer: number }[] =>
    [...zuhoerer.entries()]
      .map(([name, s]) => ({ name, zuhoerer: s.size }))
      .sort((a, b) => a.name.localeCompare(b.name));

  const mitschneiden = (an: unknown): void => { mitschnitt = !!an; if (!an) spur.length = 0; };
  const letzte = (n = 50): Spureintrag[] => spur.slice(-n);

  /** Alles vergessen — nur für Prüfläufe. */
  const leeren = (): void => { zuhoerer.clear(); spur.length = 0; };

  return { horche, einmal, melde, frage, uebersicht, mitschneiden, letzte, leeren,
           anzahl: () => zuhoerer.size };
})();

(window as any).Ereignisse = Ereignisse;
