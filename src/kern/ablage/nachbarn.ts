/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/ablage/nachbarn.ts (npm run bauen:ts). */
/* ============================================================================
 * kern/ablage/nachbarn.js — der Draht zwischen zwei offenen Fenstern
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/ablage/nachbarn.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/ablage/nachbarn.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WAS ES TUT. Es sagt den anderen Fenstern derselben App, dass sich in der
 * Ablage etwas geändert hat, und hört zu, wenn sie dasselbe sagen. Mehr
 * nicht: es kennt weder Blöcke noch Seiten und öffnet keine Datenbank. Was
 * mit einer Nachricht geschieht, entscheidet `indexdb.js`.
 *
 * WARUM ES DAS GEBEN MUSS. Zwei Tabs mit Redion teilen sich **eine**
 * IndexedDB, aber jeder hält seinen eigenen Zwischenspeicher im
 * Arbeitsspeicher — gefüllt einmal beim Laden und danach nie wieder
 * nachgesehen. Was daraus folgte:
 *
 *   Tab A ändert eine Seite. Tab B weiss davon nichts und hat die alte
 *   Fassung noch im Speicher. Sobald B irgendetwas an dieser Seite tut,
 *   schreibt es seinen alten Stand darüber. **Die Änderung aus A ist weg,
 *   ohne Meldung, ohne Konflikt, ohne Spur.**
 *
 * Das ist der letzte Satz des Auftrags, wörtlich: Nutzer verlieren ihre Daten
 * unbemerkt. Und es braucht kein Missgeschick dafür — zwei Tabs offen zu
 * haben ist der Normalfall.
 *
 * DER WEG. `BroadcastChannel` — dieselbe Herkunft, derselbe Browser, kein
 * Server, keine Erlaubnis nötig. Wo es ihn nicht gibt (ältere Browser), tritt
 * ein Ereignis auf `localStorage` an seine Stelle; das ist älter als das Web
 * selbst und funktioniert überall.
 *
 * WAS ES BEWUSST NICHT TUT. Es führt nichts zusammen. Wenn zwei Menschen
 * gleichzeitig **denselben Absatz** tippen, gewinnt der spätere Schreibvorgang
 * — wie in jedem Editor ohne Server. Worum es hier geht, ist der andere Fall,
 * der häufigere und der stille: zwei Fenster, zwei verschiedene Seiten, und
 * eines wirft die Arbeit des anderen weg, weil es sie nie gesehen hat.
 *
 * AUS EINER DATEI HERAUS (`file://`) hat jedes Fenster eine eigene Herkunft.
 * Dann gibt es keinen Kanal — und es braucht auch keinen, weil sich die
 * Fenster dort auch keine Ablage teilen. `offen()` sagt, woran man ist.
 * ==========================================================================*/

/**
 * Was ein Fenster dem anderen zuruft. `von` und `wann` setzt `sende` selbst;
 * alles Weitere gehört dem Absender — `[k: string]: unknown` ist hier keine
 * Bequemlichkeit, sondern die Sache: der Kanal transportiert, er liest nicht.
 */
type Nachbarnachricht = { von?: string; wann?: number; [k: string]: unknown };
type NachbarHoerer = (nachricht: Nachbarnachricht) => void;

const Nachbarn = (() => {

  const KANAL = 'redion-fenster';
  const FALLBACK = 'redion-fenster-notnagel';

  /* Die eigene Kennung. Ohne sie hörte jedes Fenster seine eigenen Rufe und
     läse jede eigene Änderung sofort wieder von der Platte zurück — eine
     Schleife, die nichts kaputtmacht und alles langsam. */
  const meine = 'f' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  let kanal: BroadcastChannel | null = null;
  let ueberSpeicher = false;
  const hoerer = new Set<NachbarHoerer>();

  const austeilen = (nachricht: unknown): void => {
    const n = nachricht as Nachbarnachricht | null;
    if (!n || n.von === meine) return;
    hoerer.forEach(fn => { try { fn(n); } catch (err) {
      if (typeof Reporter !== 'undefined') Reporter.error('nachbarn', 'Ein Zuhörer ist gestolpert', err);
    } });
  };

  const start = (): boolean => {
    if (kanal || ueberSpeicher) return true;          /* zweimal starten ist harmlos */
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        kanal = new BroadcastChannel(KANAL);
        kanal.onmessage = (e) => austeilen(e.data);
        return true;
      }
    } catch { kanal = null; }

    /* Der Notnagel. `storage` feuert nur in den ANDEREN Fenstern — genau
       das, was hier gebraucht wird. Der Zeitstempel im Wert sorgt dafür,
       dass zwei gleiche Nachrichten hintereinander auch zwei Ereignisse
       auslösen; ohne ihn schriebe man denselben Wert und nichts geschähe. */
    try {
      if (typeof localStorage === 'undefined') return false;
      addEventListener('storage', (e) => {
        if (e.key !== FALLBACK || !e.newValue) return;
        try { austeilen(JSON.parse(e.newValue)); } catch {}
      });
      ueberSpeicher = true;
      return true;
    } catch { return false; }
  };

  const sende = (nachricht: Nachbarnachricht | null | undefined): boolean => {
    if (!nachricht) return false;
    const voll = Object.assign({ von: meine, wann: Date.now() }, nachricht);
    try {
      if (kanal) { kanal.postMessage(voll); return true; }
      if (ueberSpeicher) { localStorage.setItem(FALLBACK, JSON.stringify(voll)); return true; }
    } catch (err) {
      /* Kein stiller Fehlschlag: ein Kanal, der nicht mehr sendet, heisst,
         dass zwei Fenster wieder blind nebeneinander schreiben. Das gehört
         gemeldet, auch wenn es nichts sofort kaputtmacht. */
      if (typeof Reporter !== 'undefined')
        Reporter.warn('nachbarn', 'Die anderen Fenster sind nicht erreichbar', err);
    }
    return false;
  };

  const beiNachricht = (fn: NachbarHoerer): (() => void) => {
    hoerer.add(fn);
    return () => { hoerer.delete(fn); };
  };

  const schliessen = (): void => {
    try { if (kanal) kanal.close(); } catch {}
    kanal = null; ueberSpeicher = false; hoerer.clear();
  };

  return {
    start, sende, beiNachricht, schliessen,
    kennung: () => meine,
    offen:   () => !!kanal || ueberSpeicher,
    weg:     () => (kanal ? 'kanal' : ueberSpeicher ? 'speicher' : 'keiner')
  };
})();

(window as any).Nachbarn = Nachbarn;
