/* ============================================================================
 * kern/ablage/formen.js — welche Form ein Satz hat, und wie er wieder heil wird
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

const Formen = (() => {

  const jetzt = () => new Date().toISOString();
  const kennung = () => (typeof Ids !== 'undefined')
    ? Ids.long()
    : (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));

  /* ========================================================================
   * 1 · DIE FORMEN
   * ------------------------------------------------------------------------
   * `pflicht` muss da sein und ist reparierbar. `art` ist die erwartete
   * Sorte; passt sie nicht, wird der Wert ersetzt und das gemeldet.
   * ======================================================================*/

  const FORMEN = {

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

  const passt = (wert, art) => {
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

  const felderVon = (formName, satz) => {
    const f = FORMEN[formName];
    if (!f) return {};
    const raus = Object.assign({}, f.felder);
    if (formName === 'block' && satz && satz.type === 'page')
      Object.assign(raus, f.wennSeite);
    return raus;
  };

  /**
   * Was stimmt an diesem Satz nicht?
   * @returns {Array<{feld, was, ist}>}
   */
  const maengel = (formName, satz) => {
    const raus = [];
    if (!satz || typeof satz !== 'object') return [{ feld: '(satz)', was: 'kein Objekt', ist: satz }];
    const felder = felderVon(formName, satz);
    for (const [name, regel] of Object.entries(felder)) {
      const v = satz[name];
      if (v === undefined || v === null) {
        if (regel.pflicht) raus.push({ feld: name, was: 'fehlt', ist: v });
        continue;
      }
      if (!passt(v, regel.art)) raus.push({ feld: name, was: 'falsche Art, erwartet ' + regel.art, ist: v });
    }
    return raus;
  };

  const heil = (formName, satz) => maengel(formName, satz).length === 0;

  /* ========================================================================
   * 3 · HEILEN
   * ======================================================================*/

  /**
   * Einen Satz wieder in Form bringen.
   *
   * @returns {{satz:Object, geheilt:Array<string>}}
   */
  const heile = (formName, satz) => {
    const geheilt = [];
    const raus = (satz && typeof satz === 'object') ? satz : {};
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
    if (formName === 'block' && Array.isArray(raus.content) &&
        typeof Store !== 'undefined' && Store.cache) {
      const vorher = raus.content.length;
      raus.content = raus.content.filter(id => !!Store.cache.blocks[id]);
      if (raus.content.length !== vorher)
        geheilt.push((vorher - raus.content.length) + ' Kinder gab es nicht mehr');
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

  const zustand = (heilen = false) => {
    if (typeof Store === 'undefined' || !Store.cache) return null;
    const bericht = { geprueft: 0, geheilt: 0, kaputt: [], stellen: {} };

    const durch = (formName, karte) => {
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

window.Formen = Formen;
