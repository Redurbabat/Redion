"use strict";
/* ============================================================================
 * register/formeln.js — jede Formelfunktion mit Namen und Bedeutung
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/formeln.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/formeln.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
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
        { name: 'random', gruppe: 'Zahlen', args: '()',
            was: 'Zufallszahl zwischen 0 und 1', notion: false,
            beispiel: 'round(random() * 6) + 1' },
        { name: 'randomBetween', gruppe: 'Zahlen', args: '(a, b)',
            was: 'Ganze Zufallszahl von a bis b', notion: false,
            beispiel: 'randomBetween(1, 6)' },
        { name: 'rowNumber', gruppe: 'Zeilen', args: '()',
            was: 'Die wievielte Zeile ist das in dieser Ansicht?', notion: false,
            beispiel: 'rowNumber()' },
        { name: 'previous', gruppe: 'Zeilen', args: '(spalte)',
            was: 'Derselbe Wert in der Zeile davor', notion: false,
            beispiel: 'prop("Stand") - previous("Stand")' },
        { name: 'next', gruppe: 'Zeilen', args: '(spalte)',
            was: 'Derselbe Wert in der Zeile danach', notion: false },
        { name: 'runningSum', gruppe: 'Zeilen', args: '(spalte)',
            was: 'Laufende Summe bis hier — der Kontostand', notion: false,
            beispiel: 'runningSum("Betrag")' },
        { name: 'rank', gruppe: 'Zeilen', args: '(spalte)',
            was: 'Rang in der Bestenliste, grösster Wert = 1', notion: false },
        { name: 'percentOfTotal', gruppe: 'Zeilen', args: '(spalte)',
            was: 'Anteil am Gesamtwert der Ansicht', notion: false },
        { name: 'delta', gruppe: 'Zeilen', args: '(spalte)',
            was: 'Unterschied zur Zeile davor', notion: false },
        { name: 'countWhere', gruppe: 'Fremde Datenbanken', args: '(db, bedingung)',
            was: 'Zeilen einer anderen Datenbank zählen — ohne Verknüpfung', notion: false,
            beispiel: 'countWhere("Rechnungen", current.prop("Kunde") == prop("Name"))' },
        { name: 'sumWhere', gruppe: 'Fremde Datenbanken', args: '(db, bedingung, wert)',
            was: 'Werte einer anderen Datenbank summieren', notion: false },
        { name: 'findRows', gruppe: 'Fremde Datenbanken', args: '(db, bedingung)',
            was: 'Zeilen einer anderen Datenbank als Liste holen', notion: false },
        { name: 'businessDaysBetween', gruppe: 'Datum', args: '(a, b)',
            was: 'Werktage zwischen zwei Daten — ohne Wochenende', notion: false },
        { name: 'addBusinessDays', gruppe: 'Datum', args: '(d, n)',
            was: 'n Werktage dazuzählen', notion: false },
        { name: 'convertTimezone', gruppe: 'Datum', args: '(d, von, nach)',
            was: 'Zeitzone umrechnen', notion: false },
        { name: 'reduce', gruppe: 'Listen', args: '(liste, start, ausdruck)',
            was: 'Eine Liste zu einem Wert zusammenfalten', notion: false },
        { name: 'groupBy', gruppe: 'Listen', args: '(liste, ausdruck)',
            was: 'Eine Liste nach einem Schlüssel gruppieren', notion: false },
        { name: 'sortBy', gruppe: 'Listen', args: '(liste, ausdruck)',
            was: 'Eine Liste nach einem Schlüssel sortieren', notion: false },
        { name: 'xor', gruppe: 'Logik', args: '(a, b)',
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
        { name: 'SUMME', gruppe: 'Zahlen', args: '(a; b; …)', notion: false,
            was: 'Alles zusammenzählen — wie in Excel', beispiel: 'SUMME(1; 2; 3)' },
        { name: 'MIN', gruppe: 'Zahlen', args: '(a; b; …)', notion: true,
            was: 'Der kleinste Wert', beispiel: 'MIN(3; 1; 2)' },
        { name: 'MAX', gruppe: 'Zahlen', args: '(a; b; …)', notion: true,
            was: 'Der grösste Wert', beispiel: 'MAX(3; 1; 2)' },
        { name: 'ABS', gruppe: 'Zahlen', args: '(zahl)', notion: true,
            was: 'Der Betrag — ohne Vorzeichen', beispiel: 'ABS(0 - 7)' },
        { name: 'MITTELWERT', gruppe: 'Zahlen', args: '(a; b; …)', notion: false,
            was: 'Der Durchschnitt der Werte', beispiel: 'MITTELWERT(2; 4; 6)' },
        { name: 'WURZEL', gruppe: 'Zahlen', args: '(zahl)', notion: false,
            was: 'Die Quadratwurzel', beispiel: 'WURZEL(16)' },
        { name: 'REST', gruppe: 'Zahlen', args: '(zahl; teiler)', notion: false,
            was: 'Rest der Division — das Vorzeichen folgt dem Teiler',
            beispiel: 'REST(-7; 3) → 2' },
        { name: 'RUNDEN', gruppe: 'Zahlen', args: '(zahl)', notion: false,
            was: 'Runden — die Hälfte von der Null weg, wie in Excel',
            beispiel: 'RUNDEN(-2,5) → -3' },
        /* ABRUNDEN und AUFRUNDEN runden zur Null hin und von der Null weg — wie
           in Excel, nicht wie floor/ceil. Bei negativen Zahlen ist das ein
           Unterschied: ABRUNDEN(-2,5) ist -2, floor(-2,5) ist -3. Wer immer nach
           unten will, nimmt GANZZAHL. */
        { name: 'ABRUNDEN', gruppe: 'Zahlen', args: '(zahl)', notion: false,
            was: 'Zur Null hin runden', beispiel: 'ABRUNDEN(-2,5) → -2' },
        { name: 'AUFRUNDEN', gruppe: 'Zahlen', args: '(zahl)', notion: false,
            was: 'Von der Null weg runden', beispiel: 'AUFRUNDEN(-2,1) → -3' },
        { name: 'GANZZAHL', gruppe: 'Zahlen', args: '(zahl)', notion: false,
            was: 'Immer nach unten — auch bei negativen Zahlen',
            beispiel: 'GANZZAHL(-2,5) → -3' },
        { name: 'PRODUKT', gruppe: 'Zahlen', args: '(a; b; …)', notion: false,
            was: 'Alles miteinander malnehmen', beispiel: 'PRODUKT(2; 3; 4)' },
        { name: 'ANZAHL', gruppe: 'Zahlen', args: '(a; b; …)', notion: false,
            was: 'Wie viele davon sind Zahlen?', beispiel: 'ANZAHL(1; "x"; 3) → 2' },
        { name: 'ANZAHL2', gruppe: 'Zahlen', args: '(a; b; …)', notion: false,
            was: 'Wie viele davon sind nicht leer?' },
        { name: 'POTENZ', gruppe: 'Zahlen', args: '(zahl; hoch)', notion: false,
            was: 'Hoch rechnen', beispiel: 'POTENZ(2; 10) → 1024' },
        /* --- Logik ----------------------------------------------------------- */
        { name: 'WENN', gruppe: 'Logik', args: '(prüfung; dann; sonst)', notion: false,
            was: 'Die Wenn-Dann-Sonst-Frage', beispiel: 'WENN(Betrag > 100; "gross"; "klein")' },
        { name: 'WENNS', gruppe: 'Logik', args: '(p1; w1; p2; w2; …)', notion: false,
            was: 'Mehrere Fälle nacheinander prüfen' },
        { name: 'UND', gruppe: 'Logik', args: '(a; b; …)', notion: false,
            was: 'Wahr, wenn alles wahr ist' },
        { name: 'ODER', gruppe: 'Logik', args: '(a; b; …)', notion: false,
            was: 'Wahr, wenn mindestens eines wahr ist' },
        { name: 'NICHT', gruppe: 'Logik', args: '(a)', notion: false,
            was: 'Dreht wahr und falsch um' },
        /* --- Datum ----------------------------------------------------------- */
        { name: 'HEUTE', gruppe: 'Datum', args: '()', notion: false,
            was: 'Das heutige Datum' },
        { name: 'JETZT', gruppe: 'Datum', args: '()', notion: false,
            was: 'Datum und Uhrzeit gerade eben' },
        { name: 'DATUM', gruppe: 'Datum', args: '(jahr; monat; tag)', notion: false,
            was: 'Aus Jahr, Monat und Tag ein Datum bauen',
            beispiel: 'DATUM(2026; 8; 4)' },
        { name: 'JAHR', gruppe: 'Datum', args: '(datum)', notion: false,
            was: 'Die Jahreszahl' },
        { name: 'MONAT', gruppe: 'Datum', args: '(datum)', notion: false,
            was: 'Die Monatszahl' },
        { name: 'TAG', gruppe: 'Datum', args: '(datum)', notion: false,
            was: 'Der Tag im Monat — nicht der Wochentag, dafür gibt es WOCHENTAG',
            beispiel: 'TAG("2026-08-04") → 4' },
        { name: 'KALENDERWOCHE', gruppe: 'Datum', args: '(datum)', notion: false,
            was: 'Die Kalenderwoche' },
        { name: 'ZEIT', gruppe: 'Datum', args: '(std; min; sek)', notion: false,
            was: 'Eine Uhrzeit bauen', beispiel: 'ZEIT(9; 30; 0) → 09:30:00' },
        { name: 'WOCHENTAG', gruppe: 'Datum', args: '(datum)', notion: false,
            was: 'Der Wochentag als Zahl — Sonntag ist 1, wie in Excel',
            beispiel: 'WOCHENTAG("2026-08-04") → 3 (Dienstag)' },
        /* --- Text ------------------------------------------------------------ */
        { name: 'LÄNGE', gruppe: 'Text', args: '(text)', notion: false,
            was: 'Wie viele Zeichen?' },
        { name: 'LINKS', gruppe: 'Text', args: '(text; anzahl)', notion: false,
            was: 'Die ersten Zeichen', beispiel: 'LINKS("Redion"; 3) → Red' },
        { name: 'RECHTS', gruppe: 'Text', args: '(text; anzahl)', notion: false,
            was: 'Die letzten Zeichen', beispiel: 'RECHTS("Redion"; 3) → ion' },
        { name: 'SÄUBERN', gruppe: 'Text', args: '(text)', notion: false,
            was: 'Steuerzeichen entfernen — das, was man nicht sieht' },
        { name: 'SUCHEN', gruppe: 'Text', args: '(was; worin)', notion: false,
            was: 'An welcher Stelle steht es? Gross und Klein egal. 0 = nicht da',
            beispiel: 'SUCHEN("di"; "Redion") → 3' },
        { name: 'FINDEN', gruppe: 'Text', args: '(was; worin)', notion: false,
            was: 'Wie SUCHEN, aber Gross und Klein zählen' },
        { name: 'TEIL', gruppe: 'Text', args: '(text; ab; anzahl)', notion: false,
            was: 'Ein Stück herausschneiden — ab Zeichen n, so viele Zeichen',
            beispiel: 'TEIL("Redion"; 2; 3) → edi' },
        { name: 'GLÄTTEN', gruppe: 'Text', args: '(text)', notion: false,
            was: 'Leerzeichen vorn und hinten weg' },
        { name: 'GROSS', gruppe: 'Text', args: '(text)', notion: false,
            was: 'Alles in Grossbuchstaben' },
        { name: 'KLEIN', gruppe: 'Text', args: '(text)', notion: false,
            was: 'Alles in Kleinbuchstaben' },
        { name: 'WECHSELN', gruppe: 'Text', args: '(text; alt; neu)', notion: false,
            was: 'Jedes Vorkommen ersetzen — der Suchtext gilt wörtlich',
            beispiel: 'WECHSELN("a.b.c"; "."; "-") → a-b-c' },
        { name: 'ERSETZEN', gruppe: 'Text', args: '(text; ab; anzahl; neu)', notion: false,
            was: 'Nach Stelle und Anzahl ersetzen',
            beispiel: 'ERSETZEN("Redion"; 1; 3; "XX") → XXion' },
        { name: 'TEXT', gruppe: 'Text', args: '(wert; muster)', notion: false,
            was: 'Eine Zahl mit Muster darstellen — 0.00, #,##0, 0%',
            beispiel: 'TEXT(1234,5; "0.00") → 1234.50' },
        { name: 'WERT', gruppe: 'Text', args: '(text)', notion: false,
            was: 'Aus Text eine Zahl machen', beispiel: 'WERT("42") + 1' },
        { name: 'TEXTKETTE', gruppe: 'Text', args: '(a; b; …)', notion: false,
            was: 'Texte aneinanderhängen — concat() ist für Listen, nicht dafür',
            beispiel: 'TEXTKETTE("a"; "b") → ab' },
        { name: 'TEXTVERKETTEN', gruppe: 'Text', args: '(trenner; a; b; …)', notion: false,
            was: 'Mit einem Trenner verbinden — der Trenner steht vorn, wie in Excel',
            beispiel: 'TEXTVERKETTEN("-"; "a"; "b") → a-b' },
        /* --- Information ----------------------------------------------------- */
        { name: 'ISTLEER', gruppe: 'Logik', args: '(wert)', notion: false,
            was: 'Ist da nichts drin?' },
        { name: 'ISTZAHL', gruppe: 'Logik', args: '(wert)', notion: false,
            was: 'Ist das wirklich eine Zahl? „42" als Text ist keine' },
        { name: 'ISTTEXT', gruppe: 'Logik', args: '(wert)', notion: false,
            was: 'Ist das Text?' },
        /* --- Suchen und Verweisen -------------------------------------------- */
        { name: 'VERGLEICH', gruppe: 'Listen', args: '(wert; liste)', notion: false,
            was: 'An welcher Stelle steht der Wert? Ab 1 gezählt, 0 = nicht da',
            beispiel: 'VERGLEICH("Genf"; ["Bern"; "Genf"]) → 2' },
        { name: 'ZÄHLENWENN', gruppe: 'Listen', args: '(liste; bedingung)', notion: false,
            was: 'Zählen, was passt — Bedingung wie in Excel: ">100", "Z*"',
            beispiel: 'ZÄHLENWENN(Betrag; ">100")' },
        { name: 'ZÄHLENWENNS', gruppe: 'Listen', args: '(l1; b1; l2; b2; …)', notion: false,
            was: 'Zählen, wo alle Bedingungen passen' },
        { name: 'SUMMEWENN', gruppe: 'Listen', args: '(liste; bedingung; summenliste)', notion: false,
            was: 'Summieren, was passt — ohne dritte Liste wird die geprüfte summiert',
            beispiel: 'SUMMEWENN(Ort; "Bern"; Betrag)' },
        { name: 'SUMMEWENNS', gruppe: 'Listen', args: '(summenliste; l1; b1; …)', notion: false,
            was: 'Summieren, wo alle Bedingungen passen — Summenliste zuerst' },
        { name: 'MITTELWERTWENN', gruppe: 'Listen', args: '(liste; bedingung; werteliste)', notion: false,
            was: 'Durchschnitt dessen, was passt — ohne Treffer 0' },
        { name: 'MITTELWERTWENNS', gruppe: 'Listen', args: '(werteliste; l1; b1; …)', notion: false,
            was: 'Durchschnitt, wo alle Bedingungen passen' },
        { name: 'SVERWEIS', gruppe: 'Listen', args: '(wert; matrix; spalte)', notion: false,
            was: 'In der ersten Spalte suchen, aus einer anderen holen',
            beispiel: 'SVERWEIS("A2"; Artikel; 2)' },
        { name: 'WVERWEIS', gruppe: 'Listen', args: '(wert; matrix; zeile)', notion: false,
            was: 'Wie SVERWEIS, aber quer: in der ersten Zeile suchen' },
        { name: 'XVERWEIS', gruppe: 'Listen', args: '(wert; suchliste; ergebnisliste; sonst)', notion: false,
            was: 'Zwei getrennte Listen — kein Zählen von Spalten mehr',
            beispiel: 'XVERWEIS("Genf"; Orte; Betraege; "unbekannt")' },
        { name: 'INDEX', gruppe: 'Listen', args: '(matrix; zeile; spalte)', notion: false,
            was: 'Die Zelle an dieser Stelle — ab 1 gezählt' },
        { name: 'FILTER', gruppe: 'Listen', args: '(liste; bedingung)', notion: false,
            was: 'Nur die Einträge, die passen', beispiel: 'FILTER(Betrag; current > 100)' },
        { name: 'SORTIEREN', gruppe: 'Listen', args: '(liste)', notion: false,
            was: 'Eine Liste sortieren' },
        { name: 'EINDEUTIG', gruppe: 'Listen', args: '(liste)', notion: false,
            was: 'Doppelte Werte entfernen' }
    ];
    /* ==========================================================================
     * DIE MASCHINE, BESCHRIEBEN
     * --------------------------------------------------------------------------
     * `LUECKEN.md` L9 führte das lange als Lücke: 169 Namen, die die Maschine
     * kann und über die niemand einen Satz sagt. Gefunden wurden sie nicht
     * beim Lesen, sondern von `abgleich()` — der Vergleich, den es hier seit
     * jeher gibt, hat sie all die Zeit korrekt gemeldet.
     *
     * DER FRÜHERE GRUND, SIE WEGZULASSEN, STAND ZWEI ABSÄTZE WEITER OBEN:
     * „eine Liste, die man doppelt pflegen muss, wird nicht gepflegt." Das
     * stimmt — solange niemand nachsieht. `test122` sieht jetzt nach: es
     * verlangt, dass `abgleich()` in BEIDE Richtungen leer bleibt. Eine
     * Funktion ohne Satz macht den Lauf rot, ein Satz ohne Funktion auch.
     * Damit ist die Doppelpflege nicht mehr eine Frage der Sorgfalt.
     *
     * JEDER SATZ IST AM QUELLTEXT GEMESSEN, nicht aus dem Namen geraten —
     * und wo die Maschine etwas anderes tut, als der Name vermuten lässt,
     * steht genau das da. `date()` gibt den Tag im Monat, nicht das Datum.
     * `sort()` sortiert als Text, also steht 10 vor 9. `divide()` durch null
     * ergibt 0 und keinen Fehler. Wer das nicht weiss, rechnet falsch und
     * merkt es nicht.
     * ========================================================================*/
    const KERN = [
        /* --- Logik ------------------------------------------------------------ */
        { name: 'and', gruppe: 'Logik', args: '(a, b, …)', notion: true,
            was: 'Wahr, wenn alle wahr sind' },
        { name: 'or', gruppe: 'Logik', args: '(a, b, …)', notion: true,
            was: 'Wahr, wenn mindestens eines wahr ist' },
        { name: 'not', gruppe: 'Logik', args: '(a)', notion: true,
            was: 'Dreht wahr und falsch um' },
        { name: 'if', gruppe: 'Logik', args: '(bedingung, dann, sonst)', notion: true,
            was: 'Wählt zwischen zwei Werten' },
        { name: 'ifs', gruppe: 'Logik', args: '(b1, w1, b2, w2, …, sonst)', notion: true,
            was: 'Mehrere Bedingungen der Reihe nach; das letzte einzelne Argument ist der Rest' },
        { name: 'empty', gruppe: 'Logik', args: '(wert)', notion: true,
            was: 'Wahr, wenn der Wert leer ist' },
        { name: 'equal', gruppe: 'Logik', args: '(a, b)', notion: true,
            was: 'Wahr, wenn beide genau gleich sind' },
        { name: 'unequal', gruppe: 'Logik', args: '(a, b)', notion: true,
            was: 'Wahr, wenn beide verschieden sind' },
        /* --- Zahlen ----------------------------------------------------------- */
        { name: 'add', gruppe: 'Zahlen', args: '(a, b)', notion: true, was: 'Addiert zwei Zahlen' },
        { name: 'subtract', gruppe: 'Zahlen', args: '(a, b)', notion: true, was: 'Zieht b von a ab' },
        { name: 'multiply', gruppe: 'Zahlen', args: '(a, b)', notion: true, was: 'Multipliziert zwei Zahlen' },
        { name: 'divide', gruppe: 'Zahlen', args: '(a, b)', notion: true,
            was: 'Teilt a durch b. Durch null ergibt 0 und keinen Fehler' },
        { name: 'mod', gruppe: 'Zahlen', args: '(a, b)', notion: true,
            was: 'Rest der Division. Durch null ergibt 0' },
        { name: 'pow', gruppe: 'Zahlen', args: '(a, b)', notion: true, was: 'a hoch b' },
        { name: 'round', gruppe: 'Zahlen', args: '(zahl, [stellen])', notion: true,
            was: 'Rundet kaufmännisch, wahlweise auf Nachkommastellen' },
        { name: 'floor', gruppe: 'Zahlen', args: '(zahl)', notion: true, was: 'Rundet ab' },
        { name: 'ceil', gruppe: 'Zahlen', args: '(zahl)', notion: true, was: 'Rundet auf' },
        { name: 'sqrt', gruppe: 'Zahlen', args: '(zahl)', notion: true,
            was: 'Quadratwurzel. Aus einer negativen Zahl wird 0' },
        { name: 'cbrt', gruppe: 'Zahlen', args: '(zahl)', notion: false, was: 'Dritte Wurzel' },
        { name: 'exp', gruppe: 'Zahlen', args: '(zahl)', notion: true, was: 'e hoch zahl' },
        { name: 'ln', gruppe: 'Zahlen', args: '(zahl)', notion: true,
            was: 'Natürlicher Logarithmus. Für 0 und negative Zahlen 0' },
        { name: 'log10', gruppe: 'Zahlen', args: '(zahl)', notion: true,
            was: 'Zehnerlogarithmus. Für 0 und negative Zahlen 0' },
        { name: 'log2', gruppe: 'Zahlen', args: '(zahl)', notion: true,
            was: 'Zweierlogarithmus. Für 0 und negative Zahlen 0' },
        { name: 'sign', gruppe: 'Zahlen', args: '(zahl)', notion: true,
            was: 'Vorzeichen: -1, 0 oder 1' },
        { name: 'sum', gruppe: 'Zahlen', args: '(a, b, … oder liste)', notion: true,
            was: 'Summe; Listen werden mitgerechnet', beispiel: 'sum(prop("Preis"), 5)' },
        { name: 'mean', gruppe: 'Zahlen', args: '(a, b, … oder liste)', notion: true,
            was: 'Durchschnitt; ohne Werte 0' },
        { name: 'median', gruppe: 'Zahlen', args: '(a, b, … oder liste)', notion: true,
            was: 'Der mittlere Wert der Grösse nach' },
        { name: 'pi', gruppe: 'Zahlen', args: '()', notion: true, was: 'Die Kreiszahl 3,14159…' },
        { name: 'e', gruppe: 'Zahlen', args: '()', notion: true, was: 'Die eulersche Zahl 2,71828…' },
        { name: 'tonumber', gruppe: 'Zahlen', args: '(wert)', notion: true,
            was: 'Macht aus Text eine Zahl; geht das nicht, 0' },
        { name: 'product', gruppe: 'Zahlen', args: '(a, b, …)', notion: false,
            was: 'Alles miteinander multipliziert' },
        { name: 'count', gruppe: 'Zahlen', args: '(a, b, …)', notion: false,
            was: 'Zählt nur die Zahlen darunter' },
        { name: 'counta', gruppe: 'Zahlen', args: '(a, b, …)', notion: false,
            was: 'Zählt alles, was nicht leer ist' },
        { name: 'power', gruppe: 'Zahlen', args: '(a, b)', notion: false, was: 'a hoch b, wie in Excel' },
        { name: 'rounddown', gruppe: 'Zahlen', args: '(zahl)', notion: false,
            was: 'Schneidet die Nachkommastellen ab, zur Null hin' },
        { name: 'roundup', gruppe: 'Zahlen', args: '(zahl)', notion: false,
            was: 'Rundet von der Null weg auf' },
        { name: 'int', gruppe: 'Zahlen', args: '(zahl)', notion: false,
            was: 'Rundet immer ab — bei negativen Zahlen also weg von der Null' },
        { name: 'clamp', gruppe: 'Zahlen', args: '(zahl, min, max)', notion: false,
            was: 'Hält eine Zahl zwischen zwei Grenzen' },
        { name: 'roundto', gruppe: 'Zahlen', args: '(zahl, stellen)', notion: false,
            was: 'Rundet auf so viele Nachkommastellen' },
        { name: 'stddev', gruppe: 'Zahlen', args: '(liste)', notion: false,
            was: 'Standardabweichung' },
        { name: 'variance', gruppe: 'Zahlen', args: '(liste)', notion: false,
            was: 'Varianz — das Quadrat der Standardabweichung' },
        { name: 'percentile', gruppe: 'Zahlen', args: '(liste, anteil)', notion: false,
            was: 'Der Wert, unter dem dieser Anteil liegt', beispiel: 'percentile(werte, 0.9)' },
        { name: 'excelmod', gruppe: 'Zahlen', args: '(a, b)', notion: false,
            was: 'Rest wie in Excel: das Vorzeichen richtet sich nach dem Teiler' },
        { name: 'excelround', gruppe: 'Zahlen', args: '(zahl, stellen)', notion: false,
            was: 'Rundet wie Excel — die Hälfte immer von der Null weg' },
        { name: 'formatnumber', gruppe: 'Zahlen', args: '(zahl, [format])', notion: false,
            was: 'Zahl als Text, mit Tausendertrennung' },
        /* --- Text ------------------------------------------------------------- */
        { name: 'format', gruppe: 'Text', args: '(wert)', notion: true,
            was: 'Macht aus allem Text' },
        { name: 'length', gruppe: 'Text', args: '(text oder liste)', notion: true,
            was: 'Zeichen im Text — oder Einträge in einer Liste' },
        { name: 'substring', gruppe: 'Text', args: '(text, von, [bis])', notion: true,
            was: 'Ein Stück heraus, von null an gezählt' },
        { name: 'contains', gruppe: 'Text', args: '(text, teil)', notion: true,
            was: 'Steckt das darin? Geht auch mit Listen' },
        { name: 'includes', gruppe: 'Text', args: '(text, teil)', notion: true,
            was: 'Dasselbe wie contains' },
        { name: 'test', gruppe: 'Text', args: '(text, muster)', notion: true,
            was: 'Passt der Text auf den regulären Ausdruck?' },
        { name: 'match', gruppe: 'Text', args: '(text, muster)', notion: true,
            was: 'Alle Treffer als Liste; ohne Treffer leer' },
        { name: 'replace', gruppe: 'Text', args: '(text, muster, neu)', notion: true,
            was: 'Ersetzt den ersten Treffer' },
        { name: 'replaceall', gruppe: 'Text', args: '(text, muster, neu)', notion: true,
            was: 'Ersetzt alle Treffer' },
        { name: 'lower', gruppe: 'Text', args: '(text)', notion: true, was: 'Alles klein' },
        { name: 'upper', gruppe: 'Text', args: '(text)', notion: true, was: 'Alles gross' },
        { name: 'trim', gruppe: 'Text', args: '(text)', notion: true,
            was: 'Leerzeichen vorn und hinten weg' },
        { name: 'split', gruppe: 'Text', args: '(text, trenner)', notion: true,
            was: 'Zerlegt Text in eine Liste' },
        { name: 'repeat', gruppe: 'Text', args: '(text, anzahl)', notion: true,
            was: 'Wiederholt den Text; höchstens 500-mal' },
        { name: 'join', gruppe: 'Text', args: '(liste, [trenner])', notion: true,
            was: 'Fügt eine Liste zu Text; ohne Angabe mit Komma und Leerzeichen' },
        { name: 'padstart', gruppe: 'Text', args: '(text, laenge, [zeichen])', notion: false,
            was: 'Füllt vorn auf, bis die Länge stimmt', beispiel: 'padstart("7", 3, "0")' },
        { name: 'padend', gruppe: 'Text', args: '(text, laenge, [zeichen])', notion: false,
            was: 'Füllt hinten auf' },
        { name: 'startswith', gruppe: 'Text', args: '(text, anfang)', notion: false,
            was: 'Fängt der Text damit an?' },
        { name: 'endswith', gruppe: 'Text', args: '(text, ende)', notion: false,
            was: 'Hört der Text damit auf?' },
        { name: 'capitalize', gruppe: 'Text', args: '(text)', notion: false,
            was: 'Erster Buchstabe gross, der Rest bleibt' },
        { name: 'titlecase', gruppe: 'Text', args: '(text)', notion: false,
            was: 'Jedes Wort gross, der Rest klein' },
        { name: 'slug', gruppe: 'Text', args: '(text)', notion: false,
            was: 'Für Adressen und Dateinamen', beispiel: 'slug("Mein Titel!") → mein-titel' },
        { name: 'initials', gruppe: 'Text', args: '(text)', notion: false,
            was: 'Die Anfangsbuchstaben aller Wörter' },
        { name: 'wordcount', gruppe: 'Text', args: '(text)', notion: false, was: 'Zählt die Wörter' },
        { name: 'truncate', gruppe: 'Text', args: '(text, laenge)', notion: false,
            was: 'Kürzt und setzt drei Punkte' },
        { name: 'left', gruppe: 'Text', args: '(text, [anzahl])', notion: false,
            was: 'Die ersten Zeichen' },
        { name: 'right', gruppe: 'Text', args: '(text, [anzahl])', notion: false,
            was: 'Die letzten Zeichen' },
        { name: 'mid', gruppe: 'Text', args: '(text, start, anzahl)', notion: false,
            was: 'Ein Stück heraus, ab Zeichen 1 gezählt wie in Excel' },
        { name: 'clean', gruppe: 'Text', args: '(text)', notion: false,
            was: 'Wirft Steuerzeichen heraus' },
        { name: 'search', gruppe: 'Text', args: '(suche, text)', notion: false,
            was: 'An welcher Stelle steht es? Ab 1 gezählt, 0 wenn nicht gefunden' },
        { name: 'findtext', gruppe: 'Text', args: '(suche, text)', notion: false,
            was: 'Wie search, aber achtet auf Gross und Klein' },
        { name: 'concattext', gruppe: 'Text', args: '(a, b, …)', notion: false,
            was: 'Hängt alles ohne Trenner aneinander' },
        { name: 'textjoin', gruppe: 'Text', args: '(trenner, leereWeglassen, …)', notion: false,
            was: 'Fügt mit Trenner zusammen, wahlweise ohne die leeren' },
        { name: 'replaceat', gruppe: 'Text', args: '(text, start, anzahl, neu)', notion: false,
            was: 'Ersetzt ein Stück an einer Stelle' },
        { name: 'substitute', gruppe: 'Text', args: '(text, alt, neu, [welches])', notion: false,
            was: 'Ersetzt Text durch Text — ohne reguläre Ausdrücke' },
        { name: 'matchpos', gruppe: 'Text', args: '(suche, liste, [art])', notion: false,
            was: 'Die Stelle in der Liste, ab 1 gezählt' },
        { name: 'textformat', gruppe: 'Text', args: '(wert, format)', notion: false,
            was: 'Zahl oder Datum nach Muster als Text' },
        /* --- Listen ------------------------------------------------------------ */
        { name: 'at', gruppe: 'Listen', args: '(liste, stelle)', notion: true,
            was: 'Der Eintrag an dieser Stelle, ab null gezählt' },
        { name: 'first', gruppe: 'Listen', args: '(liste oder text)', notion: true,
            was: 'Der erste Eintrag — bei Text das erste Zeichen' },
        { name: 'last', gruppe: 'Listen', args: '(liste oder text)', notion: true,
            was: 'Der letzte Eintrag — bei Text das letzte Zeichen' },
        { name: 'slice', gruppe: 'Listen', args: '(liste, von, [bis])', notion: true,
            was: 'Ein Stück der Liste' },
        { name: 'concat', gruppe: 'Listen', args: '(liste, liste, …)', notion: true,
            was: 'Hängt Listen aneinander' },
        { name: 'reverse', gruppe: 'Listen', args: '(liste)', notion: true,
            was: 'Dreht die Reihenfolge um' },
        { name: 'unique', gruppe: 'Listen', args: '(liste)', notion: true,
            was: 'Wirft Doppelte heraus' },
        { name: 'sort', gruppe: 'Listen', args: '(liste)', notion: true,
            was: 'Sortiert als Text — 10 steht damit vor 9' },
        { name: 'flat', gruppe: 'Listen', args: '(liste)', notion: true,
            was: 'Macht aus Listen in Listen eine Liste' },
        { name: 'map', gruppe: 'Listen', args: '(liste, ausdruck)', notion: true,
            was: 'Rechnet für jeden Eintrag; der Eintrag heisst current',
            beispiel: 'map(preise, current * 1.08)' },
        { name: 'find', gruppe: 'Listen', args: '(liste, bedingung)', notion: true,
            was: 'Der erste Eintrag, auf den die Bedingung passt' },
        { name: 'findindex', gruppe: 'Listen', args: '(liste, bedingung)', notion: true,
            was: 'Die Stelle des ersten Treffers, ab null; ohne Treffer -1' },
        { name: 'some', gruppe: 'Listen', args: '(liste, bedingung)', notion: true,
            was: 'Passt sie auf mindestens einen?' },
        { name: 'every', gruppe: 'Listen', args: '(liste, bedingung)', notion: true,
            was: 'Passt sie auf alle?' },
        { name: 'randomitem', gruppe: 'Listen', args: '(liste)', notion: false,
            was: 'Ein zufälliger Eintrag' },
        { name: 'shuffle', gruppe: 'Listen', args: '(liste)', notion: false,
            was: 'Mischt die Reihenfolge' },
        { name: 'groupkey', gruppe: 'Listen', args: '(gruppe)', notion: false,
            was: 'Der Wert, nach dem gruppiert wurde — nur in einer Gruppe' },
        { name: 'groupitems', gruppe: 'Listen', args: '(gruppe)', notion: false,
            was: 'Die Einträge dieser Gruppe' },
        { name: 'groupcount', gruppe: 'Listen', args: '(gruppe)', notion: false,
            was: 'Wie viele Einträge die Gruppe hat' },
        { name: 'let', gruppe: 'Listen', args: '(name, wert, ausdruck)', notion: true,
            was: 'Gibt einem Zwischenergebnis einen Namen' },
        { name: 'lets', gruppe: 'Listen', args: '(n1, w1, n2, w2, …, ausdruck)', notion: true,
            was: 'Mehrere Namen auf einmal; spätere dürfen frühere benutzen' },
        /* --- Datum -------------------------------------------------------------- */
        { name: 'now', gruppe: 'Datum', args: '()', notion: true, was: 'Jetzt, mit Uhrzeit' },
        { name: 'today', gruppe: 'Datum', args: '()', notion: true, was: 'Heute, um null Uhr' },
        { name: 'daterange', gruppe: 'Datum', args: '(von, bis)', notion: true,
            was: 'Ein Zeitraum aus zwei Daten' },
        { name: 'datestart', gruppe: 'Datum', args: '(zeitraum)', notion: true,
            was: 'Der Anfang eines Zeitraums' },
        { name: 'dateend', gruppe: 'Datum', args: '(zeitraum)', notion: true,
            was: 'Das Ende eines Zeitraums' },
        { name: 'dateadd', gruppe: 'Datum', args: '(datum, anzahl, einheit)', notion: true,
            was: 'Zeit dazu', beispiel: 'dateadd(now(), 2, "weeks")' },
        { name: 'datesubtract', gruppe: 'Datum', args: '(datum, anzahl, einheit)', notion: true,
            was: 'Zeit weg' },
        { name: 'datebetween', gruppe: 'Datum', args: '(a, b, einheit)', notion: true,
            was: 'Abstand zwischen zwei Daten in dieser Einheit' },
        { name: 'timestamp', gruppe: 'Datum', args: '(datum)', notion: true,
            was: 'Millisekunden seit 1970' },
        { name: 'fromtimestamp', gruppe: 'Datum', args: '(zahl)', notion: true,
            was: 'Aus Millisekunden wieder ein Datum' },
        { name: 'parsedate', gruppe: 'Datum', args: '(text)', notion: true,
            was: 'Liest ein Datum aus Text' },
        { name: 'year', gruppe: 'Datum', args: '(datum)', notion: true, was: 'Die Jahreszahl' },
        { name: 'month', gruppe: 'Datum', args: '(datum)', notion: true,
            was: 'Der Monat, 1 bis 12' },
        { name: 'date', gruppe: 'Datum', args: '(datum)', notion: true,
            was: 'Der Tag im Monat, 1 bis 31 — nicht das Datum selbst' },
        { name: 'day', gruppe: 'Datum', args: '(datum)', notion: true,
            was: 'Der Wochentag, Montag ist 1 und Sonntag 7' },
        { name: 'hour', gruppe: 'Datum', args: '(datum)', notion: true, was: 'Die Stunde' },
        { name: 'minute', gruppe: 'Datum', args: '(datum)', notion: true, was: 'Die Minute' },
        { name: 'week', gruppe: 'Datum', args: '(datum)', notion: false,
            was: 'Die Kalenderwoche nach ISO' },
        { name: 'weekday', gruppe: 'Datum', args: '(datum, [art])', notion: false,
            was: 'Der Wochentag nach Excel-Zählung' },
        { name: 'time', gruppe: 'Datum', args: '(stunde, minute, sekunde)', notion: false,
            was: 'Eine Uhrzeit als Anteil eines Tages' },
        { name: 'datefromparts', gruppe: 'Datum', args: '(jahr, monat, tag)', notion: false,
            was: 'Baut ein Datum aus drei Zahlen' },
        { name: 'isweekend', gruppe: 'Datum', args: '(datum)', notion: false,
            was: 'Samstag oder Sonntag?' },
        { name: 'isworkday', gruppe: 'Datum', args: '(datum)', notion: false,
            was: 'Montag bis Freitag?' },
        { name: 'startofday', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Null Uhr desselben Tages' },
        { name: 'endofday', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Die letzte Millisekunde des Tages' },
        { name: 'startofweek', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Der Montag dieser Woche' },
        { name: 'endofweek', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Der Sonntag dieser Woche' },
        { name: 'startofmonth', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Der Erste des Monats' },
        { name: 'endofmonth', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Der letzte Tag des Monats' },
        { name: 'startofquarter', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Der erste Tag des Quartals' },
        { name: 'endofquarter', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Der letzte Tag des Quartals' },
        { name: 'startofyear', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Der 1. Januar' },
        { name: 'endofyear', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Der 31. Dezember' },
        { name: 'quarter', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Das Quartal, 1 bis 4' },
        { name: 'daysinmonth', gruppe: 'Datum', args: '(datum)', notion: false,
            was: 'Wie viele Tage dieser Monat hat' },
        { name: 'isleapyear', gruppe: 'Datum', args: '(datum)', notion: false, was: 'Schaltjahr?' },
        { name: 'timezoneoffset', gruppe: 'Datum', args: '(datum, [zone])', notion: false,
            was: 'Der Abstand zur Weltzeit in Minuten' },
        { name: 'formatdate', gruppe: 'Datum', args: '(datum, format)', notion: true,
            was: 'Datum als Text nach Muster', beispiel: 'formatdate(now(), "DD.MM.YYYY")' },
        /* --- Zeilen und Spalten ------------------------------------------------- */
        { name: 'prop', gruppe: 'Zeilen', args: '(spalte)', notion: true,
            was: 'Der Wert dieser Spalte in dieser Zeile', beispiel: 'prop("Preis") * 1.08' },
        { name: 'runningcount', gruppe: 'Zeilen', args: '()', notion: false,
            was: 'Die wievielte Zeile das ist, ab 1 — nur in einer Datenbankspalte' },
        { name: 'runningmax', gruppe: 'Zeilen', args: '(spalte)', notion: false,
            was: 'Der grösste Wert bis hierher' },
        { name: 'runningmin', gruppe: 'Zeilen', args: '(spalte)', notion: false,
            was: 'Der kleinste Wert bis hierher' },
        { name: 'total', gruppe: 'Zeilen', args: '(spalte)', notion: false,
            was: 'Die Summe der ganzen Spalte, in jeder Zeile dieselbe' },
        { name: 'average', gruppe: 'Zeilen', args: '(spalte)', notion: false,
            was: 'Der Durchschnitt der ganzen Spalte' },
        { name: 'rowcount', gruppe: 'Zeilen', args: '()', notion: false,
            was: 'Wie viele Zeilen die Ansicht hat' },
        /* --- Fremde Datenbanken -------------------------------------------------- */
        { name: 'firstwhere', gruppe: 'Fremde Datenbanken', args: '(datenbank, bedingung)', notion: false,
            was: 'Die erste Zeile, auf die es passt; current ist die Zeile' },
        { name: 'lastwhere', gruppe: 'Fremde Datenbanken', args: '(datenbank, bedingung)', notion: false,
            was: 'Die letzte passende Zeile' },
        { name: 'maxwhere', gruppe: 'Fremde Datenbanken', args: '(datenbank, bedingung, wert)', notion: false,
            was: 'Der grösste Wert unter den passenden Zeilen' },
        { name: 'minwhere', gruppe: 'Fremde Datenbanken', args: '(datenbank, bedingung, wert)', notion: false,
            was: 'Der kleinste Wert unter den passenden Zeilen' },
        { name: 'countif', gruppe: 'Fremde Datenbanken', args: '(liste, bedingung)', notion: false,
            was: 'Zählt, worauf die Bedingung passt', beispiel: 'countif(werte, ">100")' },
        { name: 'countifs', gruppe: 'Fremde Datenbanken', args: '(liste1, bed1, liste2, bed2, …)', notion: false,
            was: 'Zählt, wo alle Bedingungen passen' },
        { name: 'sumif', gruppe: 'Fremde Datenbanken', args: '(liste, bedingung, [summe])', notion: false,
            was: 'Summiert, worauf die Bedingung passt' },
        { name: 'sumifs', gruppe: 'Fremde Datenbanken', args: '(summe, liste1, bed1, …)', notion: false,
            was: 'Summiert, wo alle Bedingungen passen' },
        { name: 'averageif', gruppe: 'Fremde Datenbanken', args: '(liste, bedingung, [werte])', notion: false,
            was: 'Durchschnitt der passenden Werte' },
        { name: 'averageifs', gruppe: 'Fremde Datenbanken', args: '(werte, liste1, bed1, …)', notion: false,
            was: 'Durchschnitt, wo alle Bedingungen passen' },
        { name: 'vlookup', gruppe: 'Fremde Datenbanken', args: '(suche, bereich, spalte, [genau])', notion: false,
            was: 'Sucht senkrecht und gibt den Wert aus der Spalte daneben' },
        { name: 'hlookup', gruppe: 'Fremde Datenbanken', args: '(suche, bereich, zeile, [genau])', notion: false,
            was: 'Sucht waagerecht' },
        { name: 'xlookup', gruppe: 'Fremde Datenbanken', args: '(suche, wo, was, [sonst])', notion: false,
            was: 'Sucht in einer Liste und gibt den Wert aus einer anderen' },
        /* --- Information und Darstellung ----------------------------------------- */
        { name: 'isnumber', gruppe: 'Sonstiges', args: '(wert)', notion: false, was: 'Ist das eine Zahl?' },
        { name: 'istext', gruppe: 'Sonstiges', args: '(wert)', notion: false, was: 'Ist das Text?' },
        { name: 'style', gruppe: 'Sonstiges', args: '(text, …)', notion: true,
            was: 'Zeichnet Text aus; die Auszeichnung entsteht erst beim Anzeigen' },
        { name: 'unstyle', gruppe: 'Sonstiges', args: '(text)', notion: true,
            was: 'Nimmt die Auszeichnung wieder weg' },
        { name: 'link', gruppe: 'Sonstiges', args: '(text, adresse)', notion: true,
            was: 'Macht aus Text einen Verweis' },
        { name: 'id', gruppe: 'Sonstiges', args: '()', notion: true,
            was: 'Die Kennung der Zeile — gibt heute immer leer zurück' },
        { name: 'name', gruppe: 'Personen', args: '(person)', notion: true, was: 'Der Name einer Person' },
        { name: 'email', gruppe: 'Personen', args: '(person)', notion: true,
            was: 'Die Adresse einer Person' }
    ];
    const LISTE = BESCHRIEBEN.concat(DEUTSCH, KERN);
    const melde = (eintrag) => {
        const e = eintrag;
        if (!e || !e.name)
            return false;
        if (LISTE.some(x => x.name === e.name))
            return false;
        LISTE.push(e);
        return true;
    };
    /** Welche Namen kennt die Maschine wirklich? */
    const ausDerMaschine = () => {
        try {
            if (typeof Formula === 'undefined' || !Formula.namen)
                return [];
            return Formula.namen();
        }
        catch {
            return [];
        }
    };
    /**
     * Alle Funktionen — beschriebene zuerst, dann alles Weitere aus der
     * Maschine mit dem, was bekannt ist.
     */
    const alle = () => {
        const beschrieben = new Set(LISTE.map(x => x.name.toLowerCase()));
        const rest = ausDerMaschine()
            .filter((n) => !beschrieben.has(String(n).toLowerCase()))
            .map((n) => ({ name: n, gruppe: 'Sonstiges', args: '(…)', was: '', notion: true }));
        return [...LISTE, ...rest];
    };
    const eines = (name) => alle().find(x => x.name.toLowerCase() === String(name).toLowerCase()) || null;
    const inGruppe = (g) => alle().filter(x => x.gruppe === g);
    /** Was ausserhalb von Notion geht — das ist die Liste, die zählt. */
    const ueberNotionHinaus = () => alle().filter(x => x.notion === false);
    const suche = (text) => {
        const t = String(text || '').toLowerCase();
        if (!t)
            return alle();
        return alle().filter(x => x.name.toLowerCase().startsWith(t) ||
            (x.was || '').toLowerCase().includes(t));
    };
    /**
     * Der Vergleich, der beide Listen ehrlich hält.
     * @returns {{ohneBeschreibung:Array, ohneFunktion:Array}}
     */
    const abgleich = () => {
        const inMaschine = new Set(ausDerMaschine().map((n) => String(n).toLowerCase()));
        return {
            ohneBeschreibung: [...inMaschine].filter(n => !LISTE.some(x => x.name.toLowerCase() === n)),
            ohneFunktion: LISTE.map(x => x.name).filter(n => !inMaschine.has(n.toLowerCase()))
        };
    };
    return { GRUPPEN, alle, eines, inGruppe, ueberNotionHinaus, suche, abgleich, melde,
        anzahl: () => alle().length };
})();
