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

  /* ==========================================================================
   * DIE DEUTSCHEN EXCEL-NAMEN
   * --------------------------------------------------------------------------
   * Nachgemessen (`doku/EXCEL-IN-REDION-RECHERCHE.md`): 37 der 63 Funktionen
   * des Excel-Startpakets liefen längst — aber keine unter ihrem deutschen
   * Namen. Wer `SUMME(1; 2; 3)` tippte, bekam „Unbekannte Funktion".
   *
   * Die Namen selbst hängen in `formeln/laufzeit.js` an denselben Funktionen
   * wie ihre englischen Geschwister. Hier stehen sie, damit die **Suche im
   * Formeleditor** sie findet — sonst gäbe es sie und niemand entdeckte sie.
   * Das ist derselbe Gedanke wie bei den 129 Funktionen ohne Beschreibung:
   * eine Funktion, die niemand findet, ist fast wie nicht vorhanden.
   *
   * `notion: false` stimmt hier wörtlich — Notion kennt keine deutschen
   * Funktionsnamen. Das ist einer der Punkte, an denen Redion mehr kann.
   *
   * MIN, MAX und ABS brauchen in `laufzeit.js` keinen Eintrag — sie heissen
   * in beiden Sprachen gleich. Beschrieben werden sie hier trotzdem: sie
   * standen bis dahin unbeschrieben unter „Sonstiges", und wer aus Excel
   * kommt, sucht genau nach ihnen.
   * ======================================================================== */
  const DEUTSCH = [
    /* --- Zahlen ---------------------------------------------------------- */
    { name: 'SUMME',       gruppe: 'Zahlen', args: '(a; b; …)',   notion: false,
      was: 'Alles zusammenzählen — wie in Excel', beispiel: 'SUMME(1; 2; 3)' },
    { name: 'MIN',         gruppe: 'Zahlen', args: '(a; b; …)',   notion: true,
      was: 'Der kleinste Wert', beispiel: 'MIN(3; 1; 2)' },
    { name: 'MAX',         gruppe: 'Zahlen', args: '(a; b; …)',   notion: true,
      was: 'Der grösste Wert', beispiel: 'MAX(3; 1; 2)' },
    { name: 'ABS',         gruppe: 'Zahlen', args: '(zahl)',      notion: true,
      was: 'Der Betrag — ohne Vorzeichen', beispiel: 'ABS(0 - 7)' },
    { name: 'MITTELWERT',  gruppe: 'Zahlen', args: '(a; b; …)',   notion: false,
      was: 'Der Durchschnitt der Werte', beispiel: 'MITTELWERT(2; 4; 6)' },
    { name: 'WURZEL',      gruppe: 'Zahlen', args: '(zahl)',      notion: false,
      was: 'Die Quadratwurzel', beispiel: 'WURZEL(16)' },
    { name: 'REST',        gruppe: 'Zahlen', args: '(zahl; teiler)', notion: false,
      was: 'Was bei der Division übrig bleibt', beispiel: 'REST(7; 3)' },
    { name: 'RUNDEN',      gruppe: 'Zahlen', args: '(zahl)',      notion: false,
      was: 'Kaufmännisch runden', beispiel: 'RUNDEN(2,6)' },
    { name: 'ABRUNDEN',    gruppe: 'Zahlen', args: '(zahl)',      notion: false,
      was: 'Immer nach unten', beispiel: 'ABRUNDEN(2,9)' },
    { name: 'AUFRUNDEN',   gruppe: 'Zahlen', args: '(zahl)',      notion: false,
      was: 'Immer nach oben', beispiel: 'AUFRUNDEN(2,1)' },

    /* --- Logik ----------------------------------------------------------- */
    { name: 'WENN',        gruppe: 'Logik', args: '(prüfung; dann; sonst)', notion: false,
      was: 'Die Wenn-Dann-Sonst-Frage', beispiel: 'WENN(Betrag > 100; "gross"; "klein")' },
    { name: 'WENNS',       gruppe: 'Logik', args: '(p1; w1; p2; w2; …)', notion: false,
      was: 'Mehrere Fälle nacheinander prüfen' },
    { name: 'UND',         gruppe: 'Logik', args: '(a; b; …)',    notion: false,
      was: 'Wahr, wenn alles wahr ist' },
    { name: 'ODER',        gruppe: 'Logik', args: '(a; b; …)',    notion: false,
      was: 'Wahr, wenn mindestens eines wahr ist' },
    { name: 'NICHT',       gruppe: 'Logik', args: '(a)',          notion: false,
      was: 'Dreht wahr und falsch um' },

    /* --- Datum ----------------------------------------------------------- */
    { name: 'HEUTE',         gruppe: 'Datum', args: '()',         notion: false,
      was: 'Das heutige Datum' },
    { name: 'JETZT',         gruppe: 'Datum', args: '()',         notion: false,
      was: 'Datum und Uhrzeit gerade eben' },
    { name: 'DATUM',         gruppe: 'Datum', args: '(text)',     notion: false,
      was: 'Aus Text ein Datum machen' },
    { name: 'JAHR',          gruppe: 'Datum', args: '(datum)',    notion: false,
      was: 'Die Jahreszahl' },
    { name: 'MONAT',         gruppe: 'Datum', args: '(datum)',    notion: false,
      was: 'Die Monatszahl' },
    { name: 'TAG',           gruppe: 'Datum', args: '(datum)',    notion: false,
      was: 'Der Tag im Monat' },
    { name: 'KALENDERWOCHE', gruppe: 'Datum', args: '(datum)',    notion: false,
      was: 'Die Kalenderwoche' },

    /* --- Text ------------------------------------------------------------ */
    { name: 'LÄNGE',         gruppe: 'Text', args: '(text)',      notion: false,
      was: 'Wie viele Zeichen?' },
    { name: 'TEIL',          gruppe: 'Text', args: '(text; von; bis)', notion: false,
      was: 'Ein Stück aus dem Text herausschneiden', beispiel: 'TEIL("Redion"; 0; 3)' },
    { name: 'GLÄTTEN',       gruppe: 'Text', args: '(text)',      notion: false,
      was: 'Leerzeichen vorn und hinten weg' },
    { name: 'GROSS',         gruppe: 'Text', args: '(text)',      notion: false,
      was: 'Alles in Grossbuchstaben' },
    { name: 'KLEIN',         gruppe: 'Text', args: '(text)',      notion: false,
      was: 'Alles in Kleinbuchstaben' },
    { name: 'WECHSELN',      gruppe: 'Text', args: '(text; alt; neu)', notion: false,
      was: 'Jedes Vorkommen ersetzen' },
    { name: 'ERSETZEN',      gruppe: 'Text', args: '(text; alt; neu)', notion: false,
      was: 'Das erste Vorkommen ersetzen' },
    { name: 'TEXT',          gruppe: 'Text', args: '(wert)',      notion: false,
      was: 'Irgendetwas als Text darstellen' },
    { name: 'WERT',          gruppe: 'Text', args: '(text)',      notion: false,
      was: 'Aus Text eine Zahl machen', beispiel: 'WERT("42") + 1' },
    { name: 'TEXTKETTE',     gruppe: 'Text', args: '(a; b; …)',   notion: false,
      was: 'Texte aneinanderhängen' },
    { name: 'TEXTVERKETTEN', gruppe: 'Text', args: '(liste; trenner)', notion: false,
      was: 'Eine Liste mit einem Trenner verbinden' },

    /* --- Information ----------------------------------------------------- */
    { name: 'ISTLEER',   gruppe: 'Logik', args: '(wert)',         notion: false,
      was: 'Ist da nichts drin?' },

    /* --- Suchen und Verweisen -------------------------------------------- */
    { name: 'VERGLEICH', gruppe: 'Listen', args: '(liste; wert)', notion: false,
      was: 'An welcher Stelle steht der Wert?' },
    { name: 'SORTIEREN', gruppe: 'Listen', args: '(liste)',       notion: false,
      was: 'Eine Liste sortieren' },
    { name: 'EINDEUTIG', gruppe: 'Listen', args: '(liste)',       notion: false,
      was: 'Doppelte Werte entfernen' }
  ];

  const LISTE = BESCHRIEBEN.concat(DEUTSCH);

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
