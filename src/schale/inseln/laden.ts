/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/inseln/laden.ts (npm run bauen:ts). */
/* ============================================================================
 * schale/inseln/laden.ts — React und die Inseln erst holen, wenn es sie braucht
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/inseln/laden.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/schale/inseln/laden.js`.
 * ----------------------------------------------------------------------------
 * WARUM ES DIESE DATEI GIBT (E699)
 *
 * Redur, 27. September 2026: „du kannst react nutzen keien problem". React
 * und die Touch-Kit-Inseln sind zusammen rund 78 KB über die Leitung
 * (gzip: react.js 69, islands.js 4, islands.css 5). Der Start hat unter der
 * Decke von `test388` §5 (2850 KB, E688) noch knapp 90 KB Luft — und diese
 * Luft ist für Redions eigene Arbeit da, nicht für eine Bibliothek, die beim
 * Start niemand sieht. Also kommt React NICHT beim Start, sondern:
 *
 *   BEIM ERSTEN GEBRAUCH  `Inseln.bereit()` holt alles und liefert
 *                         `RedionIslands`. Zweimal fragen holt einmal.
 *   IM LEERLAUF DANACH    `vorwaermen()`, sobald der Browser nach dem Laden
 *                         nichts zu tun hat — damit die erste Insel nicht auf
 *                         das Auswerten von React warten muss. Aber nur, wo
 *                         das Holen NICHTS über die Leitung kostet (siehe
 *                         `darfVorwaermen`).
 *
 * DAS MUSTER IST NICHT NEU: pdf.js (E389, `src/fremd/pdfjs/laden.ts`) und die
 * Chronik (E613, `src/bereiche/chronik/laden.ts`) werden genau so geholt.
 * Dieselben drei Dinge dürfen dabei nicht brechen, und alle drei prüft
 * `test579`:
 *
 *   §6  EIN `<script>`-ELEMENT UND KEIN `fetch`. Per Doppelklick
 *       (`file://`) scheitert `fetch` an der Herkunftsprüfung, ein
 *       eingehängtes Skript nicht. Und kein `type="module"`: Module laufen
 *       unter `file://` gar nicht.
 *
 *   §29 DIE EINZELDATEI HAT KEINEN ORDNER. `bauen.mts` setzt die Bytes an der
 *       Marke `inseln-daten` in drei `<script type="text/plain">` — das
 *       wertet der Browser NICHT aus. Erst `bereit()` macht daraus Skripte
 *       (über Blob-Adressen, wie pdf.js) und ein Stilblatt. So startet auch
 *       die Einzeldatei ohne React, und dieselben Bytes laufen erst, wenn
 *       sie gebraucht werden.
 *
 *   §28 OFFLINE BLEIBT ES OFFLINE. Alle drei Dateien stehen im GRUNDSTOCK
 *       von `sw.ts`. Der Dienst legt sie beim ersten Besuch im Hintergrund
 *       ab; das Nachladen bedient danach der Zwischenspeicher.
 *
 * WAS DIESE DATEI NICHT TUT: eine Insel einhängen. Sie holt nur. Wo eine
 * Insel steht, entscheidet die Stelle der Schale, die sie ersetzt — mit
 * `(await Inseln.bereit()).mount(element, 'name', props)`.
 * ==========================================================================*/

const Inseln = (() => {

  /** Die Dateien, in der Reihenfolge, in der sie laufen müssen. */
  const REACT = 'quell/fremd/react/react.js';
  const INSELN = 'quell/islands/islands.js';
  const STIL = 'quell/islands/islands.css';

  /** Die Kennungen der Behälter, die `bauen.mts` in die Einzeldatei setzt. */
  const BEHAELTER = {
    react: 'inseln-react',
    inseln: 'inseln-js',
    stil: 'inseln-stil'
  } as const;

  let versprechen: Promise<RedionIslandsApi> | null = null;

  /**
   * Stand die Seite beim Laden schon unter einem Dienst-Arbeiter? Gelesen
   * JETZT, beim Auswerten dieser Datei — also bevor `pwa.ts` einen anmeldet.
   * Beim ersten Besuch ist das `null`, und genau dann soll nichts
   * vorgewärmt werden (siehe `darfVorwaermen`).
   */
  const unterDienst = typeof navigator !== 'undefined' &&
    !!navigator.serviceWorker?.controller;

  /** Der Behälter in der Einzeldatei — oder nichts (Ordnerbetrieb). */
  const behaelter = (id: string): string | null => {
    const el = document.getElementById(id);
    return el && el.getAttribute('type') === 'text/plain' ? el.textContent : null;
  };

  const inEinzeldatei = (): boolean => behaelter(BEHAELTER.react) !== null;

  /** Ein Skript einhängen und auf sein Ende warten. `src` ist ein Pfad oder eine Blob-Adresse. */
  const skript = (src: string, was: string): Promise<void> => new Promise((ja, nein) => {
    const s = document.createElement('script');
    s.src = src;
    /* `data-insel-datei`, nicht `data-insel`: das trägt ein ELEMENT, an dem
       eine Insel steht (main.tsx). Zwei Dinge, zwei Namen. */
    s.dataset['inselDatei'] = was;
    s.addEventListener('load', () => ja());
    /* Ein gescheitertes Skript geht wieder aus dem Kopf: der nächste Versuch
       hängt ein neues ein, und halbe Reste gibt es keine (test579 §11). */
    s.addEventListener('error', () => {
      s.remove();
      nein(new Error('Die Inseln fehlen — ' + was + ' liess sich nicht laden.'));
    });
    document.head.appendChild(s);
  });

  /**
   * Ein Behälter der Einzeldatei als Skript: dieselben Bytes wie im Ordner,
   * über eine Blob-Adresse — dasselbe, was pdf.js dort tut (E389). Die
   * Adresse wird nach dem Laden wieder freigegeben.
   */
  const skriptAusBehaelter = async (id: string, was: string): Promise<void> => {
    const text = behaelter(id);
    if (text === null) throw new Error('Die Inseln fehlen — der Behälter ' + id + ' ist leer.');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
    try { await skript(url, was); } finally { URL.revokeObjectURL(url); }
  };

  /**
   * Das Stilblatt — IMMER als `<link>`, auch in der Einzeldatei. Dort zeigt
   * es auf eine Blob-Adresse mit den Bytes aus dem Behälter; ein
   * eingehängtes `<style>` wäre ein Stilblock aus TypeScript, und den
   * verbietet `test412` mit gutem Grund (E418: Stil gehört in eine Datei).
   * Die Blob-Adresse bleibt stehen, solange die Seite lebt: ein Stilblatt
   * darf der Browser neu lesen wollen.
   *
   * SCHEITERT ES, GEHT DAS `<link>` WIEDER. Hier stand es danach weiter im
   * Kopf, und die erste Zeile unten fand es beim nächsten Versuch und sagte
   * „schon da" — die Insel hing dann ohne ihr Blatt (ein Knopf von 24 statt
   * 44 px, durchsichtig). Gefunden bei der Durchsicht von E699, `test579`
   * §11. Das Versprechen oben in `bereit` („beim nächsten Versuch soll es
   * wieder gehen") gilt jetzt auch für das Blatt.
   */
  const stilblatt = (): Promise<void> => {
    if (document.querySelector('link[data-insel-datei="stil"]')) return Promise.resolve();
    const text = behaelter(BEHAELTER.stil);
    return new Promise((ja, nein) => {
      const l = document.createElement('link');
      const blob = text !== null ? URL.createObjectURL(new Blob([text], { type: 'text/css' })) : null;
      l.rel = 'stylesheet';
      l.href = blob ?? STIL;
      l.dataset['inselDatei'] = 'stil';
      l.addEventListener('load', () => ja());
      l.addEventListener('error', () => {
        l.remove();
        if (blob) URL.revokeObjectURL(blob);
        nein(new Error('Die Inseln fehlen — ' + STIL + ' liess sich nicht laden.'));
      });
      document.head.appendChild(l);
    });
  };

  /** Steht schon alles? (Zweiter Aufruf, oder jemand hat vorgewärmt.) */
  const geladen = (): boolean => typeof window.RedionIslands !== 'undefined';

  /**
   * React, die Inseln und ihr Stil — einmal, dann behalten. Das VERSPRECHEN
   * wird behalten, nicht das Ergebnis: zwei gleichzeitige Aufrufe warten auf
   * dasselbe Laden, statt es zweimal zu starten.
   */
  const bereit = (): Promise<RedionIslandsApi> => {
    if (versprechen) return versprechen;
    versprechen = (async () => {
      const einzel = inEinzeldatei();
      await stilblatt();
      if (typeof window.RedionReact === 'undefined') {
        if (einzel) await skriptAusBehaelter(BEHAELTER.react, REACT);
        else await skript(REACT, REACT);
      }
      if (typeof window.RedionReact === 'undefined')
        throw new Error('Die Inseln fehlen — ' + REACT + ' wurde geladen, ist aber leer.');
      if (!geladen()) {
        if (einzel) await skriptAusBehaelter(BEHAELTER.inseln, INSELN);
        else await skript(INSELN, INSELN);
      }
      const api = window.RedionIslands;
      if (!api) throw new Error('Die Inseln fehlen — ' + INSELN + ' wurde geladen, ist aber leer.');
      return api;
    })();
    /* Ein gescheitertes Versprechen nicht für immer behalten: beim nächsten
       Versuch soll es wieder gehen (Netz zurück, Datei nachgelegt). */
    versprechen.catch(() => { versprechen = null; });
    return versprechen;
  };

  /**
   * DARF VORGEWÄRMT WERDEN? Nur, wo das Holen nichts über die Leitung kostet:
   *
   *   file://            von der Platte — Ordner wie Einzeldatei
   *   Einzeldatei        die Bytes stehen schon in der Seite
   *   unter dem Dienst   die Dateien kommen aus seinem Zwischenspeicher
   *
   * Beim ERSTEN Besuch über das Netz steht noch kein Dienst: dort wärmt
   * nichts vor, und `test388` misst den Start weiter ohne React. Der Dienst
   * legt die Dateien dann im Hintergrund ab (GRUNDSTOCK), und ab dem
   * zweiten Besuch gilt die dritte Zeile.
   */
  const darfVorwaermen = (): boolean =>
    location.protocol === 'file:' || inEinzeldatei() || unterDienst;

  /**
   * Im Leerlauf nach dem Laden holen — ohne etwas einzuhängen. Fehler werden
   * gemeldet, nicht geworfen: ein gescheitertes Vorwärmen ist kein Absturz,
   * der erste echte Gebrauch versucht es noch einmal.
   */
  const vorwaermen = (): void => {
    if (geladen() || !darfVorwaermen()) return;
    bereit().catch((e: unknown) => {
      if (typeof Reporter !== 'undefined')
        Reporter.warn('Inseln', 'Vorwärmen gescheitert: ' + (e instanceof Error ? e.message : String(e)));
    });
  };

  /* FEHLER AUS DEN INSELN kommen als Ereignis (`main.tsx`, `report`). Hier
     werden sie zu dem, was jeder Fehler in Redion ist: ein Eintrag bei
     `Reporter`, der ihn an die Fehlerliste von `Pflege` weitergibt (§7).
     `preventDefault` sagt der Insel: angekommen — sonst meldet sie selbst. */
  const fehlerAnnehmen = (e: Event): void => {
    const d = (e as CustomEvent<{ insel?: string; fehler?: unknown }>).detail;
    const f = d?.fehler;
    if (typeof Reporter === 'undefined') return;
    e.preventDefault();
    Reporter.error('Insel ' + String(d?.insel ?? '?'), f instanceof Error ? f.message : String(f), f);
  };
  if (typeof window !== 'undefined') window.addEventListener('redion-insel-fehler', fehlerAnnehmen);

  /* Nach dem LADEN, nicht beim Start: der Start bleibt, was er war. Und dann
     erst im Leerlauf — Safari kennt `requestIdleCallback` nicht, dort
     wartet ein gewöhnlicher Zeitgeber ab. */
  const imLeerlauf = (): void => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(vorwaermen, { timeout: 4000 });
    else setTimeout(vorwaermen, 1500);
  };
  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') imLeerlauf();
    else window.addEventListener('load', imLeerlauf, { once: true });
  }

  return { bereit, geladen, vorwaermen, darfVorwaermen };
})();

/* `Object.assign` statt `(window as any)`: dieselbe Wirkung, ohne `any` (§52.7). */
Object.assign(window, { Inseln });
