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
 *
 * Regel 2 stand hier von Anfang an — und der Code hielt sich nicht daran.
 * Passte die Sorte nicht und griff keine der vier Rettungen, setzte `heile`
 * die Vorgabe ein und der alte Wert war fort. Bei jedem Start, still.
 *
 * Seit E72 gilt sie wirklich. Was nichts trägt (`''`, `0`, `false`, `[]`,
 * `{}`), darf die Vorgabe bekommen — dabei geht nichts verloren. Was etwas
 * trägt, wandert nach `unlesbar` im selben Satz: die Oberfläche bekommt die
 * Vorgabe und läuft, der Inhalt bleibt und wandert durch `.redion` mit.
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
   * Sorte; passt sie nicht, wird versucht, den Wert umzuformen — und wenn
   * das nicht geht, tritt die Vorgabe an seine Stelle, während er selbst
   * unter `unlesbar` liegen bleibt. Hier stand „wird der Wert ersetzt", und
   * das war die Wahrheit über den Code, aber nicht über die Absicht: der
   * Kopf dieser Datei versprach drei Bildschirme weiter oben das Gegenteil.
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

  /**
   * Trägt dieser Wert etwas? `''`, `0`, `false`, `[]` und `{}` tun es nicht —
   * sie sind die Leere in einer falschen Verpackung, und die darf durch die
   * Vorgabe ersetzt werden, ohne dass jemand etwas verliert.
   */
  const traegtInhalt = (v: unknown): boolean => {
    if (v === null || v === undefined || v === '' || v === 0 || v === false) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v as object).length > 0;
    return true;
  };

  /**
   * Beiseitelegen statt wegwerfen.
   *
   * Ein Wert, den keine der Rettungen versteht, ist nicht wertlos — er ist
   * nur nicht in der Form, die Redion kennt. Ein Import aus einem anderen
   * Werkzeug kann `text` als Objekt liefern; das ist der Text des Menschen,
   * bloss anders verpackt. Ihn durch `''` zu ersetzen heisst, ihn zu
   * löschen — still, bei jedem Start.
   *
   * Deshalb wandert er nach `unlesbar`. Die Oberfläche bekommt die Vorgabe
   * und läuft; der Inhalt bleibt im Satz, wandert durch `.redion` mit und
   * lässt sich später ansehen. Regel 1 dieser Datei sorgt dafür, dass ihn
   * niemand wieder wegräumt: unbekannte Felder bleiben stehen.
   */
  const beiseite = (satz: Satz, feld: string, wert: unknown): void => {
    const bisher = satz['unlesbar'];
    const kiste: Record<string, unknown> =
      (bisher && typeof bisher === 'object' && !Array.isArray(bisher))
        ? bisher as Record<string, unknown> : {};
    kiste[feld] = wert;
    satz['unlesbar'] = kiste;
  };

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
        else if (traegtInhalt(v)) {
          /* Hier stand `raus[name] = regel.vorgabe()` ohne Wenn und Aber —
             und damit die einzige Zeile dieser Datei, die gegen ihre eigene
             Regel 2 verstiess. Ein `text`, das ein Objekt war, wurde bei
             JEDEM Start zu `''`; ein `props` mit allen Zeilenwerten zu `{}`;
             ein `schema` mit allen Spalten ebenso. Gemeldet wurde es als
             `Reporter.info` — also gar nicht. */
          beiseite(raus, name, v);
          raus[name] = regel.vorgabe();
          geheilt.push(name + ' war unlesbar und liegt jetzt unter „unlesbar"');
          continue;
        }
        else raus[name] = regel.vorgabe();
        geheilt.push(name + ' hatte die falsche Art');
      }
    }

    /* Kinder, die es nicht mehr gibt, sind kein Inhalt, sondern ein Loch:
       die Oberfläche zeichnet dann eine leere Zeile ohne Erklärung.
       Sie aus `content` zu nehmen ist deshalb richtig — sie ERSATZLOS zu
       streichen war es nicht.

       „Gibt es nicht" heisst hier nämlich nur: steht gerade nicht im
       Speicher. Das trifft auch einen Block, den ein Abgleich noch nicht
       herübergeholt hat. Kommt er später an, war die Verbindung zu seinem
       Elternteil trotzdem schon weg — endgültig, denn `heile` ändert den
       Satz an Ort und Stelle, und der nächste `flush` schreibt ihn so
       hinaus. Deshalb liegen die Kennungen jetzt daneben, statt fort zu
       sein. */
    if (formName === 'block' && Array.isArray(raus['content']) &&
        typeof Store !== 'undefined' && Store.cache) {
      const fehlend = raus['content'].filter((id: string) => !Store.cache.blocks[id]);
      if (fehlend.length) {
        raus['content'] = raus['content'].filter((id: string) => !!Store.cache.blocks[id]);
        beiseite(raus, 'contentFehlt', fehlend);
        geheilt.push(fehlend.length + ' Kinder gab es nicht mehr');
      }
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
