/* ============================================================================
 * core/spreadsheet/csv.ts — CSV lesen und schreiben, ohne Bildschirm
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/spreadsheet/csv.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/spreadsheet/csv.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * ─── WARUM ES DEN VORHANDENEN ZERLEGER NICHT TUT ────────────────────────────
 *
 * `Datenbank.csvZerlegen` gibt es seit langem, und für Datenbanken ist er
 * richtig. Für eine Tabelle hat er zwei Eigenschaften, die dort **Daten
 * zerstören**:
 *
 * **1 · Er trennt bei Komma UND Semikolon UND Tabulator, gleichzeitig.**
 * Für eine englische Datei geht das gut. Eine deutsche oder Schweizer Datei
 * benutzt das Semikolon zum Trennen und das Komma als Dezimalzeichen:
 *
 *     Miete;1450,50;Januar
 *
 * Der alte Zerleger macht daraus fünf Felder statt drei, und aus `1450,50`
 * werden `1450` und `50`. Der Betrag ist weg, und es sieht nicht nach einem
 * Fehler aus — es sieht nach zwei Spalten mehr aus.
 *
 * Hier wird das Trennzeichen deshalb **erkannt** und dann nur dieses eine
 * benutzt. Gezählt wird ausserhalb von Anführungszeichen, sonst gewinnt ein
 * Komma in `"Meier, Hans"` gegen das echte Trennzeichen.
 *
 * **2 · Er wirft leere Zeilen weg.** In einer Datenbank ist eine leere Zeile
 * nichts. In einer Tabelle ist sie eine Zeile: alles darunter rutscht um eins
 * hoch, und jede Formel, die auf `A12` zeigte, meint danach etwas anderes.
 *
 * ─── UND WARUM ES HIER STEHT UND NICHT IN DER ANSICHT ───────────────────────
 *
 * Weil es sich so in Node prüfen lässt — in Millisekunden, ohne Chromium. Ein
 * Zerleger ist die Sorte Code, bei der die Fehler in den Randfällen sitzen:
 * Anführungszeichen im Anführungszeichen, Zeilenumbruch im Feld, BOM am
 * Anfang, `\r\n` gegen `\n`. Genau die will man in einer Schleife durchgehen
 * können, nicht durch Anklicken.
 *
 * SPRACHE. Namen englisch, Erklärungen deutsch — E27. Neu, also TypeScript
 * von Anfang an — E28.
 * ==========================================================================*/

const Csv = (() => {

  /** Die drei, die als Trennzeichen vorkommen — in dieser Rangfolge bei Gleichstand. */
  const KANDIDATEN = [';', '\t', ','];

  /**
   * Welches Zeichen trennt hier die Felder?
   *
   * Gezählt wird über die ersten Zeilen und **ausserhalb von
   * Anführungszeichen**. Ein Komma in `"Meier, Hans"` ist kein Trennzeichen,
   * und wer das mitzählt, entscheidet sich bei einer Datei mit vielen Namen
   * regelmässig falsch.
   *
   * Bei Gleichstand gewinnt das Semikolon: eine Datei, in der beide gleich
   * oft vorkommen, ist fast immer eine deutsche mit Dezimalkommas.
   */
  const erkenneTrenner = (text: string): string => {
    const probe = String(text ?? '').replace(/^﻿/, '').split('\n').slice(0, 20).join('\n');
    const zahl: Record<string, number> = { ';': 0, '\t': 0, ',': 0 };
    let inAnf = false;
    for (let i = 0; i < probe.length; i++) {
      const c = probe[i] as string;
      if (c === '"') {
        if (inAnf && probe[i + 1] === '"') { i++; continue; }
        inAnf = !inAnf;
        continue;
      }
      if (!inAnf && c in zahl) zahl[c] = (zahl[c] || 0) + 1;
    }
    let beste = KANDIDATEN[0] as string;
    for (const k of KANDIDATEN) if ((zahl[k] || 0) > (zahl[beste] || 0)) beste = k;
    /* Kommt keines vor, ist es eine einspaltige Datei. Dann ist die Wahl
       gleichgültig — aber sie muss getroffen sein, sonst spaltet gar nichts. */
    return (zahl[beste] || 0) > 0 ? beste : ';';
  };

  /**
   * CSV nach Zeilen und Feldern.
   *
   * @param trenner  wenn nicht angegeben, wird es erkannt
   *
   * Was hier bewusst NICHT geschieht: leere Zeilen wegwerfen, Felder
   * beschneiden, Zahlen umwandeln. Das sind Entscheidungen über den Inhalt,
   * und die trifft, wer die Datei einliest — nicht der Zerleger.
   */
  const zerlege = (text: unknown, trenner?: string): string[][] => {
    /* Das BOM muss weg, sonst heisst die erste Spalte `﻿Name` und
       passt zu keinem Vergleich — der Klassiker bei Dateien aus Excel. */
    const roh = String(text ?? '').replace(/^﻿/, '');
    if (!roh) return [];
    const t = trenner || erkenneTrenner(roh);

    const zeilen: string[][] = [];
    let zeile: string[] = [];
    let feld = '';
    let inAnf = false;

    for (let i = 0; i < roh.length; i++) {
      const c = roh[i] as string;

      if (inAnf) {
        if (c === '"' && roh[i + 1] === '"') { feld += '"'; i++; }
        else if (c === '"') inAnf = false;
        else feld += c;                       /* auch Zeilenumbrüche im Feld */
        continue;
      }

      if (c === '"') { inAnf = true; continue; }
      if (c === t) { zeile.push(feld); feld = ''; continue; }
      if (c === '\n') { zeile.push(feld); zeilen.push(zeile); zeile = []; feld = ''; continue; }
      if (c === '\r') continue;               /* \r\n und \r — beides */
      feld += c;
    }

    /* Die letzte Zeile hat meist keinen Umbruch hinter sich. Sie geht sonst
       verloren, und zwar genau die mit den Summen darin. */
    if (feld !== '' || zeile.length) { zeile.push(feld); zeilen.push(zeile); }

    /* Leere Zeilen am ENDE fallen weg — die entstehen durch den Umbruch der
       letzten Datenzeile. Leere Zeilen MITTENDRIN bleiben: dort sind sie
       Inhalt, und ohne sie stimmt jede Adresse darunter nicht mehr. */
    while (zeilen.length && (zeilen[zeilen.length - 1] as string[]).every(f => f === ''))
      zeilen.pop();

    return zeilen;
  };

  /**
   * Und zurück. Ein Feld bekommt Anführungszeichen, sobald es das Trennzeichen,
   * ein Anführungszeichen oder einen Zeilenumbruch enthält — sonst zerfällt es
   * beim nächsten Einlesen.
   */
  const schreibe = (zeilen: unknown[][], trenner = ';'): string =>
    (zeilen || []).map(zeile => (zeile || []).map(wert => {
      const s = wert === null || wert === undefined ? '' : String(wert);
      return (s.includes(trenner) || s.includes('"') || /[\r\n]/.test(s))
        ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(trenner)).join('\r\n');

  /**
   * Mit BOM davor — und das ist kein Aberglaube.
   *
   * Ohne die drei Bytes öffnet Excel im deutschen Sprachraum eine UTF-8-Datei
   * als Windows-1252: aus `Müller` wird `MÃ¼ller`, aus `1’450` wird
   * `1â€™450`. Die Datei ist in Ordnung, das Bild nicht — und geraten wird
   * dann am falschen Ende.
   */
  const mitBom = (text: string): string => '﻿' + String(text ?? '');

  return { erkenneTrenner, zerlege, schreibe, mitBom };
})();

(window as any).Csv = Csv;
