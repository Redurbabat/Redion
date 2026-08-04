/* ============================================================================
 * kern/einstellung/schalter.js — Funktionen ein- und ausschalten
 * ----------------------------------------------------------------------------
 * Ein Schalter ist kein Ersatz für eine Einstellung. Der Unterschied:
 *
 *   Eine **Einstellung** gehört dem Menschen. Er entscheidet, ob die
 *   Seitenleiste offen ist, und die Antwort ist beides Mal richtig.
 *
 *   Ein **Schalter** gehört der Entwicklung. Er beantwortet die Frage
 *   „ist dieser Teil fertig genug, um ihn allen zu zeigen?" — und die
 *   richtige Antwort ändert sich mit der Zeit.
 *
 * Wozu das gut ist: eine halbfertige Funktion kann im Bestand liegen, ohne
 * jemanden zu stören. Man muss sie nicht in einem Zweig verstecken, wo sie
 * beim nächsten Umbau still kaputtgeht.
 *
 * Jeder Schalter hier hat einen **Grund** und ein **Ziel**. Ein Schalter
 * ohne Ablaufdatum bleibt ewig, und dann hat man zwei Programme in einem.
 * ==========================================================================*/

const Schalter = (() => {

  const VORGABE = {
    /* --- an, weil fertig und geprüft ------------------------------------ */
    abgleich: {
      an: true,
      was: 'Abgleich über einen eigenen Server',
      grund: 'Fertig, geprüft mit zwei Geräten. Ohne Server tut er nichts.'
    },
    spaltenrechte: {
      an: true,
      was: 'Rechte bis auf die einzelne Spalte',
      grund: 'Fertig. Greift nur bei geteilten Seiten — verschlüsselte kann ' +
             'der Server nicht filtern.'
    },
    vorrat: {
      an: true,
      was: 'Vorberechnete Formelwerte',
      grund: 'Fertig. Von selbst nirgends an; lohnt sich erst ab vielen Zeilen.'
    },
    pruefsaetze: {
      an: true,
      was: 'Prüfsätze für Formeln und Automationen',
      grund: 'Fertig.'
    },
    probelauf: {
      an: true,
      was: 'Probelauf vor grossen Änderungen',
      grund: 'Fertig.'
    },

    /* --- aus, mit Ziel --------------------------------------------------- */
    ereignisbus: {
      an: false,
      was: 'Module reden nur noch über den Ereignisbus',
      grund: 'Der Bus steht, aber die Module rufen sich noch direkt. ' +
             'Solange beides läuft, wäre doppelte Arbeit die Folge.',
      ziel: 'An, sobald die Bereiche umgestellt sind'
    },
    sprachen: {
      an: false,
      was: 'Oberfläche auf Englisch umschaltbar',
      grund: 'Die Texte sind noch nicht vollständig ausgelagert. Halb ' +
             'übersetzt ist schlechter als gar nicht.',
      ziel: 'An, wenn die Oberflächentexte durch sind'
    }
  };

  const SCHLUESSEL = 'schalter';

  /** Was der Mensch von Hand umgestellt hat — überschreibt die Vorgabe. */
  const eigene = () => (typeof Store !== 'undefined')
    ? (Store.getMeta(SCHLUESSEL, {}) || {}) : {};

  /**
   * Ist dieser Teil an?
   * Unbekannter Name → false. Ein Tippfehler soll nichts einschalten.
   */
  const an = (name) => {
    const e = eigene();
    if (name in e) return !!e[name];
    return !!(VORGABE[name] && VORGABE[name].an);
  };

  const setze = (name, wert) => {
    if (!VORGABE[name]) return false;
    const e = eigene();
    e[name] = !!wert;
    if (typeof Store !== 'undefined') Store.setMeta(SCHLUESSEL, e);
    if (typeof Reporter !== 'undefined')
      Reporter.info('Schalter', name + ' ist jetzt ' + (wert ? 'an' : 'aus'));
    return true;
  };

  const zuruecksetzen = (name) => {
    const e = eigene();
    if (name) delete e[name]; else Object.keys(e).forEach(k => delete e[k]);
    if (typeof Store !== 'undefined') Store.setMeta(SCHLUESSEL, e);
  };

  /** Alle Schalter mit ihrem jetzigen Stand — für die Einstellungen. */
  const alle = () => Object.entries(VORGABE).map(([name, s]) => ({
    name, ...s, jetzt: an(name), eigen: name in eigene()
  }));

  /**
   * Nur ausführen, wenn der Schalter an ist.
   * Spart das `if` an jeder Aufrufstelle und macht in der Datei sichtbar,
   * woran ein Teil hängt.
   */
  const wenn = (name, fn, sonst) => an(name) ? fn() : (sonst ? sonst() : undefined);

  return { VORGABE, an, setze, zuruecksetzen, alle, wenn };
})();

window.Schalter = Schalter;
