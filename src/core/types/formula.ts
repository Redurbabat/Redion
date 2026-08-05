/* ============================================================================
 * src/core/types/formula.ts — was der Formelauswerter annimmt und zurückgibt
 * ----------------------------------------------------------------------------
 * SPRACHE. Namen englisch, Erklärungen deutsch — `ENTSCHEIDUNGEN.md` E27.
 *
 * ─── GEMESSEN, NICHT ERWARTET ───────────────────────────────────────────────
 *
 * Diese Datei beschreibt `quell/bereiche/datenbanken/formeln/laufzeit.js` so,
 * wie es sich **wirklich** verhält. Jeder Typ hier ist an der laufenden
 * Maschine abgelesen worden (E21: Kataloge werden befragt, nicht erinnert).
 * Das ist keine Förmlichkeit — beim Messen kamen drei Fehler heraus, die
 * niemand vermutet hatte: das Semikolon als Trennzeichen gab es nicht, `2e6`
 * ergab 2, und `check('')` widersprach `run('')`.
 *
 * Wer diese Datei ändert, misst vorher. Ein Typ, der eine schönere
 * Wirklichkeit beschreibt als die vorhandene, ist eine falsche Behauptung —
 * dieselbe Klasse wie die vier erfundenen Feldnamen aus `5f6396ec`.
 * ==========================================================================*/

/* ===========================================================================
 * 1 · WAS EINE FORMEL IST
 * ========================================================================= */

/** Der Text, den ein Mensch tippt: `SUMME(1; 2; 3)` oder `prop("Betrag") * 2`. */
export type FormulaText = string;

/**
 * Ein Funktionsname, immer kleingeschrieben nachgeschlagen.
 *
 * `SUMME`, `Summe` und `summe` treffen dieselbe Funktion — die Maschine
 * schreibt vor dem Nachschlagen klein. Deshalb steht hier `string` und nicht
 * eine Aufzählung: die Liste lebt in `laufzeit.js` und im Register, und eine
 * zweite Liste hier wäre die dritte Stelle, an der dasselbe steht.
 */
export type FormulaName = string;

/* ===========================================================================
 * 2 · WELCHE WERTE VORKOMMEN
 * ---------------------------------------------------------------------------
 * Gemessen mit `Formula.run(...)` über die Grundfälle. Herausgekommen sind
 * genau diese sechs Möglichkeiten:
 *
 *   number      1 + 2                        → 3
 *   string      "hallo", und die leere Formel → ''
 *   boolean     1 > 0                        → true
 *   Date        Datumsfunktionen
 *   Array       [1, 2, 3]                    → number[]  (auch gemischt)
 *   undefined   prop("gibtsnicht")           → undefined
 *
 * `null` kommt aus `evaluate` heraus, wenn ein Knoten nichts ergibt, und ist
 * deshalb mit aufgeführt.
 * ========================================================================= */

/** Ein einzelner Wert, wie ihn eine Formel liefert oder verlangt. */
export type FormulaScalar = number | string | boolean | Date | null | undefined;

/** Was `run().wert` sein kann — Skalare und Listen davon. */
export type FormulaValue = FormulaScalar | FormulaValue[];

/** Ein Argument beim Aufruf. Dieselbe Menge wie ein Wert. */
export type FormulaArgument = FormulaValue;

/* ===========================================================================
 * 3 · DAS ERGEBNIS
 * ---------------------------------------------------------------------------
 * `run()` wirft nicht. Es gibt bei jedem Ausgang ein Objekt zurück, und die
 * Felder heissen `ok`, `wert`, `fehler` — deutsch, weil sie so in `quell/`
 * stehen und ein Feldname, der nicht dem gespeicherten entspricht, keine
 * Übersetzung ist, sondern eine falsche Behauptung (E27, zweite Grenze).
 *
 * Gemessen: bei `ok: false` ist `wert` immer `''` — nicht `undefined`, nicht
 * der halbe Wert. Wer also `wert` ohne Blick auf `ok` benutzt, bekommt eine
 * leere Zeichenkette statt eines Fehlers. Das ist der Grund, warum `ok`
 * zuerst gelesen gehört.
 * ========================================================================= */

/** Der Ausgang einer geglückten Auswertung. */
export interface FormulaOk {
  ok: true;
  wert: FormulaValue;
  /** Steht nur bei `ok: false`. */
  fehler?: undefined;
}

/** Der Ausgang einer gescheiterten Auswertung. */
export interface FormulaFailed {
  ok: false;
  /** Gemessen: immer `''`. */
  wert: '';
  /** Ein Satz für Menschen: „`)` erwartet", „Unbekannte Funktion: foo()". */
  fehler: string;
}

export type FormulaResult = FormulaOk | FormulaFailed;

/** Was `check()` zurückgibt — dieselbe Form ohne Wert. */
export type FormulaCheck = { ok: true; fehler?: undefined }
                         | { ok: false; fehler: string };

/* ===========================================================================
 * 4 · WIE DIE LAUFZEIT MIT UNSINN UMGEHT
 * ---------------------------------------------------------------------------
 * DAS IST DIE WICHTIGSTE STELLE DIESER DATEI, und sie beschreibt eine
 * Entscheidung, die noch offen ist.
 *
 * Redion rechnet heute **abwehrend**. Gemessen:
 *
 *   1 / 0          → 0        WURZEL(-1)   → 0
 *   0 / 0          → 0        WERT("abc")  → 0
 *   "a" * 2        → 0        sqrt("abc")  → 0
 *   INDEX([1;2;3]; 99)        → ''
 *   SVERWEIS ohne Treffer     → ''
 *
 * Excel rechnet stattdessen mit Fehlerwerten: `#DIV/0!`, `#WERT!`, `#ZAHL!`,
 * `#NV`. Beides hat sein Recht. Abwehrend heisst: eine Spalte rechnet
 * weiter, auch wenn eine Zeile Unsinn enthält — und niemand sieht, dass sie
 * es tut. Mit Fehlerwerten heisst: man sieht es sofort, und jede Formel, die
 * darauf nicht vorbereitet ist, bricht.
 *
 * **Heute gibt es hier keine Fehlerwerte.** Nachgemessen: keiner der sieben
 * Excel-Fehlerwerte kommt in irgendeinem Ergebnis vor.
 *
 * `FormulaErrorCode` steht trotzdem schon hier — aber als **eigener Typ**,
 * nicht als Teil von `FormulaValue`. Damit lässt sich der Spreadsheet-Block
 * später mit Excel-Fehlerwerten bauen, ohne dass eine einzige bestehende
 * Datenbankformel ihr Verhalten ändert. Sobald `FormulaErrorCode` in
 * `FormulaValue` stünde, müsste jeder Aufrufer damit rechnen — und genau das
 * ist die Änderung, die niemand beschlossen hat.
 * ========================================================================= */

/** Die Excel-Fehlerwerte. Noch nicht in Gebrauch — siehe oben. */
export type FormulaErrorCode =
  | '#DIV/0!'   /* Teilung durch null */
  | '#WERT!'    /* falscher Typ, z. B. Text wo eine Zahl hingehört */
  | '#ZAHL!'    /* rechnerisch unmöglich, z. B. WURZEL(-1) */
  | '#NV'       /* nicht vorhanden — SVERWEIS ohne Treffer */
  | '#NAME?'    /* unbekannter Funktions- oder Bereichsname */
  | '#BEZUG!'   /* Verweis ins Leere */
  | '#NULL!';   /* leere Schnittmenge zweier Bereiche */

/**
 * Wie eine Formel mit Unsinn umgeht. Der Vertrag, nicht die Vorliebe.
 *
 *   'abwehrend'   0 oder '' statt eines Fehlers — was Redions Datenbanken
 *                 heute tun, und was sie weiter tun sollen: bestehende
 *                 Spalten dürfen ihr Ergebnis nicht ändern.
 *   'excel'       ein `FormulaErrorCode` — vorgesehen für den
 *                 Spreadsheet-Block, wo Menschen Excel erwarten.
 */
export type FormulaErrorMode = 'abwehrend' | 'excel';

/* ===========================================================================
 * 5 · DER ZUSAMMENHANG, IN DEM GERECHNET WIRD
 * ---------------------------------------------------------------------------
 * `run(src, propFn, fremdFn, umgebung)` — die Namen stammen aus `laufzeit.js`
 * und bleiben, damit der Typ die Aufrufstelle beschreibt und nicht eine
 * schönere Fassung davon.
 * ========================================================================= */

/** Liefert den Wert einer Spalte der aktuellen Zeile. */
export type PropLookup = (name: string) => FormulaValue;

/** Liefert den Wert einer Spalte einer verknüpften Zeile. */
export type ForeignLookup = (element: unknown, name: string) => FormulaValue;

/**
 * Was eine Formel über ihre Zeile weiss.
 *
 * Fehlt das, scheitern `rowNumber`, `previous`, `runningSum`, `rank` und
 * Geschwister mit „Das geht nur in einer Datenbankspalte" — ein Satz, der
 * sagt, was zu tun ist. Vier der 41 Beispiele im Formeleditor brauchen genau
 * das, und `test106` lässt ihnen diesen einen Fehler durchgehen.
 */
export interface FormulaRowContext {
  index: () => number;
  anzahl: () => number;
  spalte: (name: string) => FormulaValue[];
}

/** Was eine Formel über andere Datenbanken weiss. */
export type FormulaDbLookup = (name: string) => unknown[];

export interface FormulaEnvironment {
  zeile?: FormulaRowContext;
  db?: FormulaDbLookup;
}

/* ===========================================================================
 * 6 · EINE FUNKTION IM KATALOG
 * ---------------------------------------------------------------------------
 * So steht ein Eintrag in `quell/register/formeln.js`. Gemessen: 262
 * Einträge, davon 41 mit Beispiel.
 *
 * `beispiel` ist keine Zierde, sondern eine Zusage: `test106` Abschnitt 6
 * lässt jedes Beispiel wirklich rechnen. Von 41 liefen einmal 30 nicht.
 * ========================================================================= */

export interface FormulaCatalogEntry {
  name: FormulaName;
  /** Die Gruppe im Formeleditor: 'Text', 'Zahlen', 'Datum', 'Logik' … */
  gruppe: string;
  /** Die Signatur, wie sie angezeigt wird: `(a; b; …)`. */
  args: string;
  /**
   * Ein Satz, was die Funktion tut — **freiwillig, und das ist ein Befund.**
   *
   * Gemessen: `register/formeln.js` bringt 82 beschriebene Einträge mit.
   * `laufzeit.js` meldet danach weitere **180** an, damit die Suche im
   * Formeleditor sie überhaupt findet — und die haben keinen Satz. 262
   * Einträge, 180 davon stumm.
   *
   * Der Typ sagt das, statt es schöner darzustellen: `was` ist optional.
   * Hier steht der Grund, warum das nicht so bleiben soll — `LUECKEN.md` L9
   * führt es als offenen Punkt. Eine Funktion ohne Satz findet man in der
   * Liste, aber man weiss nicht, wofür sie da ist; das ist die halbe
   * Sichtbarkeit.
   */
  was?: string;
  /** Kann Notion das auch? Bei den deutschen Excel-Namen: nein. */
  notion?: boolean;
  /** Muss laufen — siehe oben. */
  beispiel?: FormulaText;
}

/**
 * Ein deutscher Excel-Name und die interne Funktion, auf die er zeigt.
 *
 * ACHTUNG, DIE TEURE STELLE. Ein Zweitname lässt sich nur daraufhin prüfen,
 * ob er **fehlt** — nicht, ob er auf die **falsche** Funktion zeigt: dann
 * rechnen beide Seiten dasselbe Verkehrte, und jeder Vergleich ist
 * zufrieden. So kamen elf falsche Zuordnungen durch. Gefunden hat sie erst
 * eine Prüfung gegen feste erwartete Werte (`test106` Abschnitt 4e).
 */
export interface FormulaAlias {
  /** Wie ein Mensch aus Excel es tippt: `SUMME`. */
  deutsch: FormulaName;
  /** Worauf es intern zeigt: `sum`. */
  intern: FormulaName;
}
