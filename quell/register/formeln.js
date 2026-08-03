/* ============================================================================
 * register/formeln.js — jede Formelfunktion mit Namen und Bedeutung
 * ----------------------------------------------------------------------------
 * Die Formel-Maschine kennt ihre Funktionen — als Tabelle von Namen zu Code.
 * Was sie nicht kennt, ist, was sie **bedeuten**: welche Argumente, welche
 * Gruppe, ein Beispiel, ob Notion sie auch hat.
 *
 * Genau das braucht die Oberfläche: der Formeleditor listet sie, die Hilfe
 * erklärt sie, die Vervollständigung schlägt sie vor. Bisher stand das
 * verstreut — und lief mit jeder neuen Funktion weiter auseinander.
 *
 * Hier steht die Beschreibung. Der Code bleibt in der Maschine; ein Register
 * beschreibt, es rechnet nicht.
 *
 * Der Prüflauf vergleicht beide Listen: eine Funktion ohne Beschreibung
 * findet niemand, eine Beschreibung ohne Funktion ist ein Versprechen, das
 * beim Tippen bricht.
 * ==========================================================================*/

window.Register = window.Register || {};

Register.formeln = (() => {

  /* Gruppen in der Reihenfolge, in der sie im Editor stehen. */
  const GRUPPEN = ['Text', 'Zahlen', 'Datum', 'Logik', 'Listen',
                   'Zeilen', 'Fremde Datenbanken', 'Personen', 'Sonstiges'];

  /* Nur die Funktionen, die über Notion hinausgehen oder Erklärung brauchen,
     stehen hier ausgeschrieben. Alles andere holt sich das Register aus der
     Maschine — eine Liste, die man doppelt pflegen muss, wird nicht gepflegt. */
  const BESCHRIEBEN = [
    { name: 'random',        gruppe: 'Zahlen', args: '()',
      was: 'Zufallszahl zwischen 0 und 1', notion: false,
      beispiel: 'round(random() * 6) + 1' },
    { name: 'randomBetween', gruppe: 'Zahlen', args: '(a, b)',
      was: 'Ganze Zufallszahl von a bis b', notion: false,
      beispiel: 'randomBetween(1, 6)' },

    { name: 'rowNumber',     gruppe: 'Zeilen', args: '()',
      was: 'Die wievielte Zeile ist das in dieser Ansicht?', notion: false,
      beispiel: 'rowNumber()' },
    { name: 'previous',      gruppe: 'Zeilen', args: '(spalte)',
      was: 'Derselbe Wert in der Zeile davor', notion: false,
      beispiel: 'prop("Stand") - previous("Stand")' },
    { name: 'next',          gruppe: 'Zeilen', args: '(spalte)',
      was: 'Derselbe Wert in der Zeile danach', notion: false },
    { name: 'runningSum',    gruppe: 'Zeilen', args: '(spalte)',
      was: 'Laufende Summe bis hier — der Kontostand', notion: false,
      beispiel: 'runningSum("Betrag")' },
    { name: 'rank',          gruppe: 'Zeilen', args: '(spalte)',
      was: 'Rang in der Bestenliste, grösster Wert = 1', notion: false },
    { name: 'percentOfTotal',gruppe: 'Zeilen', args: '(spalte)',
      was: 'Anteil am Gesamtwert der Ansicht', notion: false },
    { name: 'delta',         gruppe: 'Zeilen', args: '(spalte)',
      was: 'Unterschied zur Zeile davor', notion: false },

    { name: 'countWhere',    gruppe: 'Fremde Datenbanken', args: '(db, bedingung)',
      was: 'Zeilen einer anderen Datenbank zählen — ohne Verknüpfung', notion: false,
      beispiel: 'countWhere("Rechnungen", current.prop("Kunde") == prop("Name"))' },
    { name: 'sumWhere',      gruppe: 'Fremde Datenbanken', args: '(db, bedingung, wert)',
      was: 'Werte einer anderen Datenbank summieren', notion: false },
    { name: 'findRows',      gruppe: 'Fremde Datenbanken', args: '(db, bedingung)',
      was: 'Zeilen einer anderen Datenbank als Liste holen', notion: false },

    { name: 'businessDaysBetween', gruppe: 'Datum', args: '(a, b)',
      was: 'Werktage zwischen zwei Daten — ohne Wochenende', notion: false },
    { name: 'addBusinessDays',     gruppe: 'Datum', args: '(d, n)',
      was: 'n Werktage dazuzählen', notion: false },
    { name: 'convertTimezone',     gruppe: 'Datum', args: '(d, von, nach)',
      was: 'Zeitzone umrechnen', notion: false },

    { name: 'reduce',  gruppe: 'Listen', args: '(liste, start, ausdruck)',
      was: 'Eine Liste zu einem Wert zusammenfalten', notion: false },
    { name: 'groupBy', gruppe: 'Listen', args: '(liste, ausdruck)',
      was: 'Eine Liste nach einem Schlüssel gruppieren', notion: false },
    { name: 'sortBy',  gruppe: 'Listen', args: '(liste, ausdruck)',
      was: 'Eine Liste nach einem Schlüssel sortieren', notion: false },

    { name: 'xor',     gruppe: 'Logik', args: '(a, b)',
      was: 'Entweder-oder, aber nicht beides', notion: false },
    { name: 'boolean', gruppe: 'Logik', args: '(x)',
      was: 'Irgendetwas in wahr/falsch verwandeln', notion: false }
  ];

  const LISTE = BESCHRIEBEN.slice();

  const melde = (eintrag) => {
    if (!eintrag || !eintrag.name) return false;
    if (LISTE.some(x => x.name === eintrag.name)) return false;
    LISTE.push(eintrag);
    return true;
  };

  /** Welche Namen kennt die Maschine wirklich? */
  const ausDerMaschine = () => {
    try {
      if (typeof Formula === 'undefined' || !Formula.namen) return [];
      return Formula.namen();
    } catch { return []; }
  };

  /**
   * Alle Funktionen — beschriebene zuerst, dann alles Weitere aus der
   * Maschine mit dem, was bekannt ist.
   */
  const alle = () => {
    const beschrieben = new Set(LISTE.map(x => x.name.toLowerCase()));
    const rest = ausDerMaschine()
      .filter(n => !beschrieben.has(String(n).toLowerCase()))
      .map(n => ({ name: n, gruppe: 'Sonstiges', args: '(…)', was: '', notion: true }));
    return [...LISTE, ...rest];
  };

  const eines = (name) => alle().find(x => x.name.toLowerCase() === String(name).toLowerCase()) || null;
  const inGruppe = (g) => alle().filter(x => x.gruppe === g);

  /** Was ausserhalb von Notion geht — das ist die Liste, die zählt. */
  const ueberNotionHinaus = () => alle().filter(x => x.notion === false);

  const suche = (text) => {
    const t = String(text || '').toLowerCase();
    if (!t) return alle();
    return alle().filter(x => x.name.toLowerCase().startsWith(t) ||
                              (x.was || '').toLowerCase().includes(t));
  };

  /**
   * Der Vergleich, der beide Listen ehrlich hält.
   * @returns {{ohneBeschreibung:Array, ohneFunktion:Array}}
   */
  const abgleich = () => {
    const inMaschine = new Set(ausDerMaschine().map(n => String(n).toLowerCase()));
    return {
      ohneBeschreibung: [...inMaschine].filter(n => !LISTE.some(x => x.name.toLowerCase() === n)),
      ohneFunktion: LISTE.map(x => x.name).filter(n => !inMaschine.has(n.toLowerCase()))
    };
  };

  return { GRUPPEN, alle, eines, inGruppe, ueberNotionHinaus, suche, abgleich, melde,
           anzahl: () => alle().length };
})();
