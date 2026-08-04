/* ============================================================================
 * src/global.d.ts — die Typen, die migrierte Dateien ohne `import` brauchen
 * ----------------------------------------------------------------------------
 * WARUM NICHT EINFACH IMPORTIEREN. Die App lädt Skripte über `<script src>`
 * und muss von `file://` starten. Eine Datei mit `import`/`export` würde als
 * ES-Modul ausgegeben und liefe dort nicht — deshalb steht in
 * `tsconfig.bauen.json` `module: none`, und deshalb dürfen migrierte Dateien
 * keine Importzeile haben.
 *
 * Was sie an Typen brauchen, steht darum hier: eine Datei ohne `import` und
 * ohne `export` gilt als globales Skript, und alles darin ist überall
 * sichtbar.
 *
 * WAS HIER NICHT HINEINGEHÖRT. Die Typen aus `src/core/types/` bleiben, wo
 * sie sind — sie werden von TypeScript-Code benutzt, der selbst nichts
 * ausgibt. Hier stehen nur die Namen, die eine **migrierte** Datei braucht,
 * und die Zusagen über das, was noch in `quell/` liegt.
 * ==========================================================================*/

/** Eine Kennung, wie `Kennungen.lang()` sie erzeugt. */
type ID = string;

/** Ein Zeitpunkt als ISO-Zeichenkette, so wie `Store.now()` ihn schreibt. */
type ISODateTime = string;

/**
 * Die Module aus `quell/`, die noch nicht migriert sind.
 *
 * Sie stehen hier als `any`, und das ist die ehrliche Angabe: über sie ist
 * an dieser Stelle wirklich nichts bekannt. `CLAUDE.md` §52 nennt genau das
 * als den einen erlaubten Gebrauch von `any` — an der Grenze zum alten Code,
 * nicht innerhalb einer migrierten Datei.
 *
 * Jeder Eintrag, der von hier verschwindet, ist eine Datei, die umgezogen
 * ist. Die Liste ist also das Gegenteil einer Sammelstelle: sie soll
 * schrumpfen.
 */
declare const Store: any;

/**
 * Die Bestandspflege. `reporter.ts` reicht Fehler dorthin weiter — aber nur,
 * wenn es sie gibt: sie liegt unter `quell/bereiche/`, wird später geladen
 * und fehlt in Prüfläufen, die nur den Kern hochfahren. Deshalb steht an der
 * Aufrufstelle ein `typeof`-Wächter und hier ein `any`.
 *
 * `Melder` stand bis zum Umzug hier. Er ist jetzt `reporter.ts` und braucht
 * keine Zusage mehr — genau der Zweck dieser Liste.
 */
declare const Pflege: any;

/**
 * Die Formelmaschine aus `quell/bereiche/datenbanken/formeln/laufzeit.js`.
 *
 * Der Tabellenkern rechnet mit ihr, statt eine zweite zu bauen: eine
 * Zellformel wird in ihre Sprache übersetzt (`=A1*2` → `prop("A1")*2`) und
 * an sie weitergereicht. Was sie annimmt und zurückgibt, steht getypt in
 * `src/core/types/formula.ts` — hier steht `any`, weil die Datei selbst noch
 * JavaScript ist und dieser Eintrag verschwindet, sobald sie umzieht.
 *
 * Sie wird nach dem Tabellenkern geladen, deshalb der `typeof`-Wächter an
 * der Aufrufstelle.
 */
declare const Formula: any;

/**
 * Die Menüs aus `quell/schale/ueberlagerung/menue.js`.
 *
 * `Menue.menu(html, x, y, opt)` öffnet ein Menü und macht daraus **am
 * Telefon von allein ein Blatt, das von unten hochfährt** — mit Wischen zum
 * Schliessen und Einträgen in Karten. Deshalb geht der Tabellenblock für
 * seine Kopfmenüs hierüber und schreibt keine eigene Touch-Bedienung: die
 * gäbe es dann zweimal, und die zweite wäre die schlechtere.
 */
declare const Menue: any;

/**
 * Das Ein- und Ausgeben aus `quell/bereiche/dateien/ausgeben.js`.
 *
 * Wichtig ist hier `alsExcel(blaetter, name)`: eine echte .xlsx entsteht dort
 * bereits samt ZIP, CRC32 und den vier Beipackzetteln, die das Format
 * verlangt. Der Tabellenblock reicht seine Zeilen dorthin weiter, statt das
 * ein zweites Mal zu schreiben — zwei ZIP-Schreiber pflegt man einmal und
 * vergisst den anderen.
 */
declare const Austausch: any;


/**
 * Die App-Schale aus `quell/schale/aufbau/schale.js`.
 *
 * Braucht hier nur, wer im Browser darauf wartet, dass sie fertig gestartet
 * ist — die Prüfläufe und `bilder.mts` tun genau das. Wie `Store` ist sie
 * ein gewöhnliches `const` auf oberster Ebene und steht **nicht** auf
 * `window`; wer `window.App` schreibt, bekommt `undefined`.
 */
declare const App: any;


/**
 * Das Einlesen aus `quell/bereiche/dateien/einlesen.js`.
 *
 * `xlsxLesen(puffer)` gibt `[{ name, zeilen }]` zurück — eine echte .xlsx
 * wird dort samt ZIP, gemeinsamen Texten und Blattnamen auseinandergenommen.
 * Der Tabellenblock liest darüber ein, statt einen zweiten ZIP-Leser zu
 * schreiben.
 */
declare const Einlesen: any;

/**
 * Die Dialoge aus `quell/schale/ueberlagerung/dialog.js`.
 *
 * `Dialog.wahl({ titel, text, knoepfe })` gibt die Kennung des gewählten
 * Knopfes zurück, `''` beim Abbruch — Abbrechen ist dort bewusst keine
 * Antwort, sondern das Gegenteil einer. Der Tabellenblock fragt damit vor
 * dem Einlesen, weil Einlesen vorhandene Zellen überschreibt.
 */
declare const Dialog: any;

/**
 * Die kleinen Rückmeldungen aus `quell/schale/ueberlagerung/ui.js`.
 *
 * `UI.toast(text)` — eine kurze Meldung, die von selbst verschwindet. Für
 * Erfolg und für alles, was der Mensch wissen soll, ohne dass er etwas
 * entscheiden muss. Wie `Store` ein gewöhnliches `const` auf oberster Ebene
 * und nicht auf `window`; deshalb der `typeof`-Wächter an der Aufrufstelle.
 */
declare const UI: any;
