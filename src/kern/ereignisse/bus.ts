/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/ereignisse/bus.ts (npm run bauen:ts). */
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
 * Bewusst klein gehalten — vier Funktionen, und seit E362 ihre
 * asynchronen Zwillinge (L102 Punkt 4):
 *
 *      horche(name, fn, {nachreichen})  zuhören, gibt eine Abmeldefunktion
 *                                       zurück; mit `nachreichen` bekommt
 *                                       ein spät Angemeldeter die letzte
 *                                       Meldung sofort nachgereicht
 *      einmal(name, fn)     einmal zuhören, dann von selbst abmelden
 *      melde(name, daten)   sagen, dass etwas geschehen ist
 *      frage(name, daten)   fragen und die Antworten einsammeln — SYNCHRON:
 *                           wer eine Promise zurückgibt, wird gemeldet
 *                           und nicht gezählt (siehe frageAsync)
 *      meldeAsync(name, daten)  wie melde, wartet aber die Zuhörer ab und
 *                           meldet, was dabei scheitert
 *      frageAsync(name, daten)  wie frage, wartet aber jede Antwort ab —
 *                           in der Reihenfolge der Anmeldung
 *      darf(name, daten) / darfAsync  ein Veto: fragt, und ein einziges
 *                           `false` heisst Nein
 *      schonGemeldet(name)  ob (und womit) ein Ereignis schon gemeldet wurde
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

  /* DIE LETZTE MELDUNG JE NAME (E362): wer sich nach dem Ereignis anmeldet,
     kann sie sich nachreichen lassen. Der Fall ist nicht erfunden — das
     Menüband horchte auf `ablageGeladen`, und die Ablage war beim Anmelden
     längst geladen: ein Zuhörer, der nie etwas hört, sieht aus wie einer,
     der nichts zu tun hat. */
  const gemeldet = new Map<string, unknown>();

  const istVersprechen = (wert: unknown): wert is Promise<unknown> =>
    !!wert && (typeof wert === 'object' || typeof wert === 'function') &&
    typeof (wert as { then?: unknown }).then === 'function';

  /* Ein kaputtes Modul hält die anderen nicht auf — aber still bleibt es
     auch nicht. Derselbe Weg für synchrone Würfe, abgelehnte Promises und
     die falsche Antwortart. */
  const fehlerMelden = (art: string, name: string, e: unknown): void => {
    console.error(art + ' „' + name + '": ' + (e instanceof Error ? e.message : String(e)), e);
    if (typeof Pflege !== 'undefined' && Pflege.fehlerMerken)
      try { Pflege.fehlerMerken(e, art + ' ' + name); } catch {}
  };

  /* Die letzten Meldungen — nur für die Fehlersuche, nicht für die Logik. */
  const MAX_SPUR = 200;
  const spur: Spureintrag[] = [];
  let mitschnitt = false;

  /**
   * Auf ein Ereignis hören.
   * Gibt das Abmelden zurück — immer aufheben.
   */
  const horche = (name: string, fn: unknown, opt?: { nachreichen?: boolean }): Abmelden => {
    if (typeof fn !== 'function') return () => {};
    const f = fn as Zuhoerer;
    let s = zuhoerer.get(name);
    if (!s) { s = new Set<Zuhoerer>(); zuhoerer.set(name, s); }
    s.add(f);
    /* Nachreichen: die letzte Meldung sofort, mit demselben Fehlerweg wie
       eine frische. Eine abgelehnte Promise wird gemeldet, nicht verloren. */
    if (opt && opt.nachreichen && gemeldet.has(name)) {
      try {
        const r = f(gemeldet.get(name));
        if (istVersprechen(r)) r.then(undefined, e => fehlerMelden('Ereignis', name, e));
      } catch (e) { fehlerMelden('Ereignis', name, e); }
    }
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
    gemeldet.set(name, daten);
    const s = zuhoerer.get(name);
    if (!s || !s.size) return 0;
    let n = 0;
    /* Über eine Kopie laufen: ein Zuhörer darf sich beim Zuhören abmelden. */
    [...s].forEach(fn => {
      try {
        const r = fn(daten); n++;
        /* Ein asynchroner Zuhörer darf hier zuhören — nur sein Scheitern
           darf nicht als „unhandled rejection" in der Konsole versanden. */
        if (istVersprechen(r)) r.then(undefined, e => fehlerMelden('Ereignis', name, e));
      } catch (e) { fehlerMelden('Ereignis', name, e); }
    });
    return n;
  };

  /**
   * Wie `melde`, aber es wartet: erst wenn jeder Zuhörer fertig ist — auch
   * die asynchronen —, geht es weiter. Zurück kommt, wie viele ohne Fehler
   * fertig wurden; was scheiterte, ist gemeldet.
   */
  const meldeAsync = async (name: string, daten?: unknown): Promise<number> => {
    notieren(name, daten);
    gemeldet.set(name, daten);
    const s = zuhoerer.get(name);
    if (!s || !s.size) return 0;
    const laufend = [...s].map(fn => {
      try { return Promise.resolve(fn(daten)); }
      catch (e) { return Promise.reject(e); }
    });
    const ergebnisse = await Promise.allSettled(laufend);
    let n = 0;
    ergebnisse.forEach(erg => {
      if (erg.status === 'fulfilled') n++;
      else fehlerMelden('Ereignis', name, erg.reason);
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
        /* EINE PROMISE IST KEINE ANTWORT (E362, L102 Punkt 4): vorher lag
           sie als rohes Objekt in der Liste, und wer die Liste las, rechnete
           mit einem Wert, der keiner war — still falsch. Jetzt wird sie
           gemeldet und NICHT gezählt; wer asynchron antwortet, gehört zu
           `frageAsync`. Ihr Scheitern versandet nicht. */
        if (istVersprechen(a)) {
          a.then(undefined, () => { /* gemeldet ist die falsche Art, nicht der Wert */ });
          fehlerMelden('Frage', name, new Error('ein Zuhörer antwortet asynchron — dafür gibt es frageAsync'));
          return;
        }
        if (a !== undefined && a !== null) raus.push(a);
      } catch (e) { fehlerMelden('Frage', name, e); }
    });
    return raus;
  };

  /**
   * Wie `frage`, aber jede Antwort wird abgewartet — synchrone wie
   * asynchrone —, und die Liste steht in der REIHENFOLGE DER ANMELDUNG,
   * nicht in der des Eintreffens. Was scheitert, ist gemeldet und fehlt.
   */
  const frageAsync = async (name: string, daten?: unknown): Promise<unknown[]> => {
    notieren(name, daten);
    const s = zuhoerer.get(name);
    if (!s || !s.size) return [];
    const laufend = [...s].map(fn => {
      try { return Promise.resolve(fn(daten)); }
      catch (e) { return Promise.reject(e); }
    });
    const ergebnisse = await Promise.allSettled(laufend);
    const raus: unknown[] = [];
    ergebnisse.forEach(erg => {
      if (erg.status === 'rejected') { fehlerMelden('Frage', name, erg.reason); return; }
      if (erg.value !== undefined && erg.value !== null) raus.push(erg.value);
    });
    return raus;
  };

  /** Ein Veto: gefragt wird wie bei `frage`, und ein einziges `false` heisst Nein. */
  const darf = (name: string, daten?: unknown): boolean => !frage(name, daten).includes(false);
  const darfAsync = async (name: string, daten?: unknown): Promise<boolean> =>
    !(await frageAsync(name, daten)).includes(false);

  /** Wurde `name` schon gemeldet — und womit? */
  const schonGemeldet = (name: string): { da: boolean; daten: unknown } =>
    ({ da: gemeldet.has(name), daten: gemeldet.get(name) });

  /** Wer hört gerade worauf? Für die Fehlersuche und die Übersicht. */
  const uebersicht = (): { name: string; zuhoerer: number }[] =>
    [...zuhoerer.entries()]
      .map(([name, s]) => ({ name, zuhoerer: s.size }))
      .sort((a, b) => a.name.localeCompare(b.name));

  const mitschneiden = (an: unknown): void => { mitschnitt = !!an; if (!an) spur.length = 0; };
  const letzte = (n = 50): Spureintrag[] => spur.slice(-n);

  /** Alles vergessen — nur für Prüfläufe. */
  const leeren = (): void => { zuhoerer.clear(); spur.length = 0; gemeldet.clear(); };

  return { horche, einmal, melde, frage, meldeAsync, frageAsync, darf, darfAsync, schonGemeldet,
           uebersicht, mitschneiden, letzte, leeren, anzahl: () => zuhoerer.size };
})();

(window as any).Ereignisse = Ereignisse;
