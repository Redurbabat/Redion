/* ============================================================================
 * kern/ablage/formen.js — welche Form ein Satz hat, und wie er wieder heil wird
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/ablage/formen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/ablage/formen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Bisher stand nirgends aufgeschrieben, wie ein Block aussieht. Er sah so
 * aus, wie `addBlock` ihn gebaut hatte — und wenn ein Import, eine alte
 * Sicherung oder ein Abgleich etwas anderes lieferte, merkte man es erst,
 * wenn die Oberfläche über `b.content.length` stolperte.
 *
 * Hier steht die Form einmal. Und dazu das Wichtigere: **wie ein kaputter
 * Satz wieder heil wird.** Das ist der Unterschied zwischen einer App, die
 * bei einer fehlenden Eigenschaft weiss ist, und einer, die den Satz
 * repariert und weitermacht.
 *
 * Zwei Regeln, an die sich `heile` hält:
 *
 *   1. **Nie etwas wegwerfen, was aussieht wie Inhalt.** Unbekannte Felder
 *      bleiben stehen. Ein Feld, das eine spätere Fassung eingeführt hat,
 *      darf eine ältere nicht löschen — sonst frisst der ältere Rechner die
 *      Arbeit des neueren auf.
 *   2. **Nur ergänzen, was fehlt.** Ein vorhandener Wert wird nie ersetzt,
 *      auch wenn er komisch aussieht. Reparieren heisst auffüllen, nicht
 *      überschreiben.
 * ==========================================================================*/

/**
 * Die Sorten, die eine Form kennt.
 *
 * `'text?'` ist eine eigene Sorte und keine Nachlässigkeit: `parentId` ist
 * beim obersten Block wirklich `null`, und das ist kein Mangel, sondern die
 * Aussage „hängt an nichts".
 */
type Formart = 'text' | 'text?' | 'zahl' | 'ja/nein' | 'liste' | 'objekt' | 'zeit';

/** Eine Regel für ein Feld: welche Sorte, ob Pflicht, und was sonst hinein soll. */
type Feldregel = { art: Formart; pflicht?: boolean; vorgabe: () => unknown };

/** Eine Form: welche Tabelle, welche Felder, und was nur für Seiten gilt. */
type Form = {
  tabelle?: string;
  felder: Record<string, Feldregel>;
  wennSeite?: Record<string, Feldregel>;
};

/**
 * Ein Satz aus der Ablage. `any` an den Werten ist die Grenze zum alten Code
 * (CLAUDE.md §52) — diese Datei prüft Sätze, sie kennt sie nicht.
 */
type Satz = Record<string, any>;

/** Was an einem Satz nicht stimmt. `ist` steht dabei, sonst rät man. */
type Mangel = { feld: string; was: string; ist: unknown };

const Formen = (() => {

  const jetzt = (): string => new Date().toISOString();
  const kennung = (): string => (typeof Ids !== 'undefined')
    ? Ids.long()
    : (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

  /* ========================================================================
   * 1 · DIE FORMEN
   * ------------------------------------------------------------------------
   * `pflicht` muss da sein und ist reparierbar. `art` ist die erwartete
   * Sorte; passt sie nicht, wird der Wert ersetzt und das gemeldet.
   * ======================================================================*/

  const FORMEN: Record<string, Form> = {

    block: {
      tabelle: 'blocks',
      felder: {
        id:          { art: 'text',   pflicht: true,  vorgabe: kennung },
        type:        { art: 'text',   pflicht: true,  vorgabe: () => 'text' },
        text:        { art: 'text',   pflicht: true,  vorgabe: () => '' },
        content:     { art: 'liste',  pflicht: true,  vorgabe: () => [] },
        parentId:    { art: 'text?',  pflicht: false, vorgabe: () => null },
        parentTable: { art: 'text',   pflicht: true,  vorgabe: () => 'block' },
        created:     { art: 'zeit',   pflicht: true,  vorgabe: jetzt },
        edited:      { art: 'zeit',   pflicht: true,  vorgabe: jetzt },
        alive:       { art: 'ja/nein',pflicht: true,  vorgabe: () => true },
        color:       { art: 'text',   pflicht: false, vorgabe: () => '' }
      },
      /* Nur für Seiten und Zeilen — ein Absatz braucht kein Symbol. */
      wennSeite: {
        icon:  { art: 'text',   vorgabe: () => '' },
        props: { art: 'objekt', vorgabe: () => ({}) }
      }
    },

    sammlung: {
      tabelle: 'collections',
      felder: {
        id:      { art: 'text',   pflicht: true,  vorgabe: kennung },
        name:    { art: 'text',   pflicht: true,  vorgabe: () => 'Ohne Namen' },
        schema:  { art: 'objekt', pflicht: true,  vorgabe: () => ({}) },
        viewIds: { art: 'liste',  pflicht: true,  vorgabe: () => [] },
        created: { art: 'zeit',   pflicht: false, vorgabe: jetzt }
      }
    },

    ansicht: {
      tabelle: 'views',
      felder: {
        id:           { art: 'text',   pflicht: true, vorgabe: kennung },
        collectionId: { art: 'text',   pflicht: true, vorgabe: () => '' },
        layout:       { art: 'text',   pflicht: true, vorgabe: () => 'table' },
        name:         { art: 'text',   pflicht: true, vorgabe: () => 'Tabelle' },
        filters:      { art: 'objekt', pflicht: false, vorgabe: () => ({ operator: 'and', rules: [] }) },
        sorts:        { art: 'liste',  pflicht: false, vorgabe: () => [] },
        hidden:       { art: 'liste',  pflicht: false, vorgabe: () => [] }
      }
    },

    spalte: {
      /* Keine eigene Tabelle — steht im Schema einer Sammlung. */
      felder: {
        name: { art: 'text', pflicht: true, vorgabe: () => 'Ohne Namen' },
        type: { art: 'text', pflicht: true, vorgabe: () => 'text' }
      }
    }
  };

  /* ========================================================================
   * 2 · PRÜFEN
   * ======================================================================*/

  const passt = (wert: unknown, art: Formart | string): boolean => {
    switch (art) {
      case 'text':    return typeof wert === 'string';
      case 'text?':   return wert === null || wert === undefined || typeof wert === 'string';
      case 'zahl':    return typeof wert === 'number' && isFinite(wert);
      case 'ja/nein': return typeof wert === 'boolean';
      case 'liste':   return Array.isArray(wert);
      case 'objekt':  return wert !== null && typeof wert === 'object' && !Array.isArray(wert);
      case 'zeit':    return typeof wert === 'string' && !isNaN(new Date(wert).getTime());
      default:        return true;
    }
  };

  const felderVon = (formName: string, satz?: Satz | null): Record<string, Feldregel> => {
    const f = FORMEN[formName];
    if (!f) return {};
    const raus: Record<string, Feldregel> = Object.assign({}, f.felder);
    if (formName === 'block' && satz && satz['type'] === 'page')
      Object.assign(raus, f.wennSeite);
    return raus;
  };

  /** Was stimmt an diesem Satz nicht? Eine leere Liste heisst: nichts. */
  const maengel = (formName: string, satz: unknown): Mangel[] => {
    const raus: Mangel[] = [];
    if (!satz || typeof satz !== 'object') return [{ feld: '(satz)', was: 'kein Objekt', ist: satz }];
    const s = satz as Satz;
    const felder = felderVon(formName, s);
    for (const [name, regel] of Object.entries(felder)) {
      const v = s[name];
      if (v === undefined || v === null) {
        if (regel.pflicht) raus.push({ feld: name, was: 'fehlt', ist: v });
        continue;
      }
      if (!passt(v, regel.art)) raus.push({ feld: name, was: 'falsche Art, erwartet ' + regel.art, ist: v });
    }
    return raus;
  };

  const heil = (formName: string, satz: unknown): boolean =>
    maengel(formName, satz).length === 0;

  /* ========================================================================
   * 3 · HEILEN
   * ======================================================================*/

  /** Einen Satz wieder in Form bringen — und sagen, was dabei ergänzt wurde. */
  const heile = (formName: string, satz: unknown): { satz: Satz; geheilt: string[] } => {
    const geheilt: string[] = [];
    const raus: Satz = (satz && typeof satz === 'object') ? satz as Satz : {};
    const felder = felderVon(formName, raus);

    for (const [name, regel] of Object.entries(felder)) {
      const v = raus[name];
      if (v === undefined || v === null) {
        if (!regel.pflicht && !('vorgabe' in regel)) continue;
        if (regel.art === 'text?' && !regel.pflicht) continue;
        raus[name] = regel.vorgabe();
        geheilt.push(name + ' fehlte');
        continue;
      }
      if (!passt(v, regel.art)) {
        /* Ein falscher Typ lässt sich manchmal retten, statt ihn wegzuwerfen. */
        if (regel.art === 'liste' && typeof v === 'string' && v)      raus[name] = [v];
        else if (regel.art === 'text' && typeof v === 'number')       raus[name] = String(v);
        else if (regel.art === 'ja/nein')                             raus[name] = !!v;
        else if (regel.art === 'zeit' && typeof v === 'number')       raus[name] = new Date(v).toISOString();
        else                                                          raus[name] = regel.vorgabe();
        geheilt.push(name + ' hatte die falsche Art');
      }
    }

    /* Kinder, die es nicht mehr gibt, sind kein Inhalt, sondern ein Loch:
       die Oberfläche zeichnet dann eine leere Zeile ohne Erklärung. */
    if (formName === 'block' && Array.isArray(raus['content']) &&
        typeof Store !== 'undefined' && Store.cache) {
      const vorher = raus['content'].length;
      raus['content'] = raus['content'].filter((id: string) => !!Store.cache.blocks[id]);
      if (raus['content'].length !== vorher)
        geheilt.push((vorher - raus['content'].length) + ' Kinder gab es nicht mehr');
    }

    return { satz: raus, geheilt };
  };

  /* ========================================================================
   * 4 · DER GANZE BESTAND
   * ------------------------------------------------------------------------
   * Läuft beim Laden. Was sich reparieren lässt, wird repariert; was nicht,
   * steht im Bericht. Bewusst still im Normalfall — es soll niemand jeden
   * Start eine Meldung wegklicken, nur weil ein Feld ergänzt wurde.
   * ======================================================================*/

  /** Der Befund über den ganzen Bestand. */
  type Bestandsbericht = {
    geprueft: number; geheilt: number;
    kaputt: { id: string; form: string; maengel: Mangel[] }[];
    stellen: Record<string, number>;
  };

  const zustand = (heilen = false): Bestandsbericht | null => {
    if (typeof Store === 'undefined' || !Store.cache) return null;
    const bericht: Bestandsbericht = { geprueft: 0, geheilt: 0, kaputt: [], stellen: {} };

    const durch = (formName: string, karte: Record<string, Satz>): void => {
      for (const id of Object.keys(karte)) {
        bericht.geprueft++;
        const satz = karte[id];
        if (heilen) {
          const r = heile(formName, satz);
          if (r.geheilt.length) {
            bericht.geheilt++;
            r.geheilt.forEach(g => { bericht.stellen[g] = (bericht.stellen[g] || 0) + 1; });
          }
        } else {
          const m = maengel(formName, satz);
          if (m.length) bericht.kaputt.push({ id, form: formName, maengel: m });
        }
      }
    };

    durch('block',    Store.cache.blocks);
    durch('sammlung', Store.cache.collections);
    durch('ansicht',  Store.cache.views);
    return bericht;
  };

  return { FORMEN, passt, maengel, heil, heile, zustand, felderVon };
})();

(window as any).Formen = Formen;
