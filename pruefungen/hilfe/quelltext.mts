/* ============================================================================
 * pruefungen/hilfe/quelltext.mts — Quelltext lesen, ohne die Prosa mitzulesen
 * ----------------------------------------------------------------------------
 * WARUM ES DIESE DATEI GIBT, UND ZWAR AUSGERECHNET JETZT.
 *
 * Drei Wächter durchsuchen den Quelltext nach einem Muster. Alle drei haben
 * am 19. September 2026 etwas gemeldet, das es nicht gab — und jedes Mal
 * stand der „Fund" in einem Kommentar, einer Zeichenkette oder in Prosa:
 *
 *   test537   meldete „bereiche/bloecke → FORMEN (bereiche/pdf)". Die
 *             Gedankenkarte hat ihre EIGENE Formenliste; der Katalog kannte
 *             die Schreibweise `const X: Typ = …` nicht (E629).
 *   test444   meldete eine Rechtefrage mit einem Objekt. Die Stelle ist ein
 *             KOMMENTAR in `marken.ts`, der über Rechte SPRICHT:
 *             „… für fehlende Rechte (`Konten.darf('bearbeiten',…)`)".
 *   test483   meldete einen Verweis auf `oeffentlich/icons/` in der
 *             Einzeldatei. Der „Verweis" ist ein Satz der Chronik ÜBER E525,
 *             eingebettet als Daten.
 *
 * Eine erfundene Meldung ist schlimmer als eine übersehene: die übersehene
 * kostet Wachsamkeit, die erfundene kostet Arbeit an etwas, das es nicht
 * gibt. Und drei falsche Meldungen in einem vollen Lauf erziehen dazu, Rot
 * zu überlesen — dann deckt der nächste echte Rückfall sich selbst zu.
 *
 * `nurCode` lag deshalb schon zweimal wortgleich im Baum (`test87:145` und
 * `test537:117`), mit dem Kommentar „wiederverwenden, nicht nachbauen (§8)"
 * über der zweiten Kopie. Eine Kopie mit diesem Satz darüber ist genau der
 * Katalog, den §8 verbietet. Hier ist die eine Stelle.
 * ==========================================================================*/

/**
 * Kommentare und Zeichenketten leeren, damit ein Muster nur noch echten Code
 * trifft.
 *
 * ZWEI EIGENHEITEN, beide teuer gelernt und deshalb hier festgehalten:
 *
 *   · `(^|[^:])` vor dem `//` lässt ein `https://` in Ruhe. Ohne diese
 *     Klammer verschluckt die Zeile den halben Rest der Datei.
 *   · SCHABLONEN (Backticks) bleiben absichtlich STEHEN. Was in `${…}`
 *     steht, ist echter Code. Der erste Versuch, sie mit einem regulären
 *     Ausdruck zu entfernen, „verschluckte 24 000 Zeichen aus schale.js" und
 *     liess eine Prüfung fehlschlagen, obwohl alles dastand. Ein Entferner,
 *     der mehr wegnimmt als er soll, macht eine Prüfung nicht strenger,
 *     sondern blind.
 */
export const nurCode = (text: string): string => text
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');

/**
 * Zusätzlich den INHALT der Schablonen leeren — die Schablone selbst bleibt.
 *
 * Nötig, sobald das gesuchte Wort auch ein deutsches Wort sein kann. `test87`
 * sucht `App.`, und „App" steht in keinem deutschen Satz; Bereichsnamen
 * dagegen schon: „öffne die Bibliothek." in einer Meldung innerhalb eines
 * Backticks sähe aus wie `Bibliothek.`. Gemessen macht das in `test537`
 * 88 Treffer Unterschied.
 */
export const ohneSchablonen = (text: string): string =>
  text.replace(/`(?:[^`\\]|\\.)*`/g, '``');

/**
 * Text UND Prosa heraus: für Wächter, deren Muster auch in einem Satz
 * vorkommen kann.
 */
export const nurEchterCode = (text: string): string => ohneSchablonen(nurCode(text));

/**
 * Wie `nurCode`, aber ZEILENTREU: jeder entfernte Kommentar hinterlässt so
 * viele Zeilenumbrüche, wie er hatte.
 *
 * Nötig für jeden Wächter, der die ZEILENNUMMER meldet. `nurCode` ersetzt
 * einen Blockkommentar durch ein einziges Leerzeichen — bei einem
 * zwanzigzeiligen Kommentar rutscht danach alles um neunzehn Zeilen hoch,
 * und die gemeldete Fundstelle zeigt auf eine unbeteiligte Zeile. Eine
 * falsche Zeilennummer ist die zweite Sorte erfundener Meldung: man sucht
 * an der genannten Stelle und findet nichts.
 */
export const nurCodeZeilentreu = (text: string): string => {
  const leeren = (stueck: string): string => stueck.replace(/[^\n]/g, ' ');
  return text
    .replace(/\/\*[\s\S]*?\*\//g, leeren)
    .replace(/(^|[^:])(\/\/[^\n]*)/g, (_m, vor: string, rest: string) => vor + leeren(rest))
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
};

/**
 * NUR die Kommentare heraus, zeilentreu — Zeichenketten bleiben STEHEN.
 *
 * GEFUNDEN IN DER GEGENPROBE, und ohne sie wäre es nicht aufgefallen.
 * `test444` sucht `Konten.darf('bearbeiten', page)` und verlangt dabei, dass
 * das erste Argument ein Wort in Anführungszeichen ist. Wer vorher die
 * Zeichenketten leert, macht aus `'bearbeiten'` ein `''` — und der Wächter
 * findet gar nichts mehr, auch keinen echten Verstoss. Er wurde grün, weil
 * er blind war.
 *
 * Wer nach einem Muster sucht, in dem eine Zeichenkette VORKOMMT, nimmt
 * diese Fassung. Wer nach einem Namen sucht, der auch in Prosa stehen kann,
 * nimmt `nurCode` oder `nurEchterCode`.
 */
export const ohneKommentare = (text: string): string => {
  const leeren = (stueck: string): string => stueck.replace(/[^\n]/g, ' ');
  return text
    .replace(/\/\*[\s\S]*?\*\//g, leeren)
    .replace(/(^|[^:])(\/\/[^\n]*)/g, (_m, vor: string, rest: string) => vor + leeren(rest));
};

/**
 * Steht diese Stelle INNERHALB einer Zeichenkette?
 *
 * Gezählt werden die unmaskierten Anführungszeichen links davon: eine
 * ungerade Zahl heisst „mittendrin".
 *
 * GEFUNDEN AM TAG DER REPARATUR SELBST. `src/bereiche/chronik/daten.ts` ist
 * erzeugt und trägt die Chronik als Daten — und die Chronik BESCHREIBT
 * inzwischen den Fehlalarm von `test444`, samt der Zeile, die ihn auslöste.
 * Damit klagte der Wächter den Satz an, der von ihm handelt.
 *
 * `ohneKommentare` kann das nicht fangen, denn die Zeichenketten müssen
 * stehen bleiben (siehe dort). Also wird nicht der Text verändert, sondern
 * die Fundstelle geprüft: ein Aufruf im Code steht nicht in einem String,
 * ein Zitat in erzeugten Daten schon.
 */
export const inZeichenkette = (zeile: string, stelle: number): boolean => {
  let doppelt = 0;
  for (let i = 0; i < stelle && i < zeile.length; i++) {
    const z = zeile[i];
    if (z === '\\') { i++; continue; }
    if (z === '"') doppelt++;
  }
  return doppelt % 2 === 1;
};
