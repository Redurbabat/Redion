/* ============================================================================
 * kern/ablage/umzuege.js — wie die Ablage über die Zeit gewachsen ist
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/ablage/umzuege.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/ablage/umzuege.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * IndexedDB kennt eine Fassungsnummer. Steigt sie, läuft `onupgradeneeded`,
 * und dort werden neue Fächer angelegt. Das steht in `indexdb.js` und muss
 * dort stehen — der Browser ruft es genau einmal, mitten im Öffnen.
 *
 * Was dort **nicht** hingehört, ist die Erklärung: warum es das Fach gibt,
 * was vorher fehlte, und was passiert, wenn jemand mit einer alten Fassung
 * dieselbe Datenbank öffnet. Das steht hier.
 *
 * Und ein zweiter Teil, der ohne diese Datei nirgends stünde: **Umzüge im
 * Inhalt.** Ein neues Fach legt der Browser an. Ein Feld, das früher anders
 * hiess, muss jemand umschreiben — einmal, beim ersten Start nach dem
 * Wechsel, und nie wieder.
 *
 * Die Regel für jeden Inhaltsumzug hier:
 *
 *   · Er läuft **einmal** und merkt sich das.
 *   · Er ist **wiederholbar** — zweimal laufen darf nichts kaputtmachen.
 *   · Er wirft **nichts weg**, sondern ergänzt. Das alte Feld bleibt, bis
 *     zwei Fassungen später niemand mehr davon liest.
 * ==========================================================================*/

/** Eine Fassung der Ablage: welche Fächer sie brachte und warum. */
type AblageFassung = { nr: number; was: string; faecher: string[]; warum: string };

/**
 * Ein Umzug im Inhalt. `lauf` gibt zurück, wie viele Sätze er angefasst hat
 * — die Zahl steht später im Bericht und ist das Einzige, woran man sieht,
 * ob der Umzug etwas zu tun hatte.
 */
type Inhaltsumzug = { id: string; was: string; warum: string; lauf: () => number };

const Umzuege = (() => {

  /* ========================================================================
   * 1 · DIE FASSUNGEN DER ABLAGE
   * ======================================================================*/

  const FASSUNGEN: AblageFassung[] = [
    { nr: 1, was: 'Die vier Grundfächer',
      faecher: ['blocks', 'collections', 'views', 'meta'],
      warum: 'Blöcke, Sammlungen, Ansichten, Einstellungen — mehr braucht ' +
             'das Datenmodell nicht. Alles andere ist eine Sicht darauf.' },

    { nr: 2, was: 'Versionsverlauf',
      faecher: ['versions'],
      warum: 'Alte Fassungen einer Seite. Liegen bewusst neben dem Cache: ' +
             'sie werden erst geholt, wenn jemand den Verlauf öffnet — sonst ' +
             'trüge man bei jedem Start den ganzen Verlauf im Arbeitsspeicher.' },

    { nr: 3, was: 'Dateien in Stücken',
      faecher: ['dateien', 'stuecke'],
      warum: 'Eine Data-URL liegt vollständig im Arbeitsspeicher und wird beim ' +
             'Kodieren um ein Drittel grösser. Bei 12 MB war Schluss. Blobs in ' +
             'Stücken zu je 1 MB gehen bis 500 MB.' },

    { nr: 4, was: 'Der letzte gemeinsame Stand',
      faecher: ['basis'],
      warum: 'Ohne ihn kann ein Abgleich nur „meins oder deins" und muss eine ' +
             'Seite wegwerfen. Mit ihm weiss er, wer was geändert hat.' },

    { nr: 5, was: 'Vorberechnete Werte',
      faecher: ['vorrat'],
      warum: 'Formeln und Rollups einmal rechnen und behalten. Ein Beschleuniger, ' +
             'kein Inhalt: wer ihn wegwirft, verliert nichts ausser Zeit.' }
  ];

  /* Die letzte Fassung — und die Liste ist nie leer, sonst gäbe es keine
     Ablage. `?.nr ?? 0` schreibt genau das hin, statt es anzunehmen. */
  const JETZIGE = FASSUNGEN[FASSUNGEN.length - 1]?.nr ?? 0;

  /** Alle Fächer, die es geben muss. */
  const faecher = (): string[] => FASSUNGEN.flatMap(f => f.faecher);

  /** Was kam zwischen zwei Fassungen dazu? */
  const zwischen = (von: number, nach: number): AblageFassung[] =>
    FASSUNGEN.filter(f => f.nr > von && f.nr <= nach);

  /**
   * Der Satz, der im Fehlerfall zählt.
   * Eine ältere Fassung der App kann eine neuere Datenbank **nicht** öffnen —
   * IndexedDB verweigert das, und das ist richtig so. Ohne diesen Hinweis
   * sieht man nur eine App, die nicht startet.
   */
  const hinweisZuAlt = (dbFassung: number | string): string =>
    'Diese Ablage wurde von einer neueren Fassung von Redion angelegt ' +
    '(Fassung ' + dbFassung + ', diese App kennt ' + JETZIGE + '). ' +
    'Öffne die neuere Fassung, oder lege über „Sichern" eine Datei an und ' +
    'spiele sie dort wieder ein.';

  /* ========================================================================
   * 2 · UMZÜGE IM INHALT
   * ------------------------------------------------------------------------
   * Jeder Eintrag: eine Kennung, ein Satz, und eine Funktion, die einmal
   * über den Bestand läuft. Sie muss zweimal laufen können, ohne zu schaden.
   * ======================================================================*/

  const INHALT: Inhaltsumzug[] = [
    {
      id: 'zeitstempel-an-sammlungen',
      was: 'Sammlungen und Ansichten bekommen einen Zeitstempel',
      warum: 'Ohne ihn galt eine Schemaänderung dem Abgleich als nie geschehen: ' +
             'eine neue Spalte kam auf dem zweiten Gerät nie an. Die Zeilen ' +
             'wanderten, ihre Spalten nicht.',
      lauf: () => {
        let n = 0;
        Object.values<any>(Store.cache.collections).forEach(c => {
          if (!c.edited) { c.edited = c.created || Store.now(); n++; }
        });
        Object.values<any>(Store.cache.views).forEach(v => {
          if (!v.edited) { v.edited = v.created || Store.now(); n++; }
        });
        return n;
      }
    },
    {
      id: 'alive-ergaenzen',
      was: 'Blöcke ohne „alive" gelten als lebendig',
      warum: 'Ein fehlendes Feld ist kein „gelöscht". Frühe Sicherungen haben ' +
             'es nicht mitgeschrieben; ohne diesen Umzug verschwänden die ' +
             'Seiten daraus beim Einspielen.',
      lauf: () => {
        let n = 0;
        Object.values<any>(Store.cache.blocks).forEach(b => {
          if (b.alive === undefined) { b.alive = true; n++; }
        });
        return n;
      }
    }
  ];

  const GEMERKT = 'umzuegeGelaufen';

  const gelaufen = (): string[] => (typeof Store !== 'undefined')
    ? (Store.getMeta(GEMERKT, []) || []) : [];

  /** Was ein Durchlauf angefasst hat — ein Eintrag je gelaufenem Umzug. */
  type Berichtszeile = { id: string; was: string; saetze: number };

  /** Alle offenen Inhaltsumzüge laufen lassen. */
  const laufen = (): { gelaufen: Berichtszeile[]; geaendert: number } => {
    if (typeof Store === 'undefined' || !Store.cache) return { gelaufen: [], geaendert: 0 };
    const schon = new Set(gelaufen());
    const neu: string[] = [], bericht: Berichtszeile[] = [];
    let geaendert = 0;

    INHALT.forEach(u => {
      if (schon.has(u.id)) return;
      let n = 0;
      try { n = u.lauf() || 0; }
      catch (e) {
        const grund = e instanceof Error ? e.message : String(e);
        if (typeof Reporter !== 'undefined') Reporter.error('Umzug ' + u.id, grund, e);
        return;                     /* nicht als gelaufen merken — beim nächsten Start nochmal */
      }
      geaendert += n;
      neu.push(u.id);
      bericht.push({ id: u.id, was: u.was, saetze: n });
    });

    if (neu.length) {
      Store.setMeta(GEMERKT, [...schon, ...neu]);
      if (typeof Reporter !== 'undefined')
        Reporter.info('Umzuege', neu.length + ' Umzug/Umzüge gelaufen, ' +
                    geaendert + ' Sätze ergänzt', bericht);
    }
    return { gelaufen: bericht, geaendert };
  };

  /** Für die Fehlersuche: alles noch einmal laufen lassen. */
  const zuruecksetzen = () => { if (typeof Store !== 'undefined') Store.setMeta(GEMERKT, []); };

  return { FASSUNGEN, JETZIGE, INHALT, faecher, zwischen, hinweisZuAlt,
           laufen, gelaufen, zuruecksetzen };
})();

(window as any).Umzuege = Umzuege;
