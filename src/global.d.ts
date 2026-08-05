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

/**
 * Die Bestandspflege. `reporter.ts` reicht Fehler dorthin weiter — aber nur,
 * wenn es sie gibt: sie liegt unter `quell/bereiche/`, wird später geladen
 * und fehlt in Prüfläufen, die nur den Kern hochfahren. Deshalb steht an der
 * Aufrufstelle ein `typeof`-Wächter und hier ein `any`.
 *
 * `Melder` stand bis zum Umzug hier. Er ist jetzt `reporter.ts` und braucht
 * keine Zusage mehr — genau der Zweck dieser Liste.
 */

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

/**
 * Das Ein- und Ausgeben aus `quell/bereiche/dateien/ausgeben.js`.
 *
 * Wichtig ist hier `alsExcel(blaetter, name)`: eine echte .xlsx entsteht dort
 * bereits samt ZIP, CRC32 und den vier Beipackzetteln, die das Format
 * verlangt. Der Tabellenblock reicht seine Zeilen dorthin weiter, statt das
 * ein zweites Mal zu schreiben — zwei ZIP-Schreiber pflegt man einmal und
 * vergisst den anderen.
 */


/**
 * Die App-Schale aus `quell/schale/aufbau/schale.js`.
 *
 * Braucht hier nur, wer im Browser darauf wartet, dass sie fertig gestartet
 * ist — die Prüfläufe und `bilder.mts` tun genau das. Wie `Store` ist sie
 * ein gewöhnliches `const` auf oberster Ebene und steht **nicht** auf
 * `window`; wer `window.App` schreibt, bekommt `undefined`.
 */


/**
 * Das Einlesen aus `quell/bereiche/dateien/einlesen.js`.
 *
 * `xlsxLesen(puffer)` gibt `[{ name, zeilen }]` zurück — eine echte .xlsx
 * wird dort samt ZIP, gemeinsamen Texten und Blattnamen auseinandergenommen.
 * Der Tabellenblock liest darüber ein, statt einen zweiten ZIP-Leser zu
 * schreiben.
 */

/**
 * Die Datenbanklogik aus `quell/bereiche/datenbanken/dienst.js`.
 *
 * `Datenbank.wert(row, key, coll)` liest den Wert einer Zelle — mit allem,
 * was dazugehört: Titel aus `row.text`, gerechnete Spalten, Verknüpfungen,
 * laufende Nummern. Die Rasteransicht liest darüber und nicht direkt aus
 * `row.props`; sonst zeigte sie bei jeder zweiten Spaltenart etwas anderes
 * als die gewöhnliche Tabellenansicht daneben.
 */

/* ============================================================================
 * DIE ÜBRIGEN MODULE AUS `quell/`
 * ----------------------------------------------------------------------------
 * ERZEUGT — die Liste stammt aus dem Quelltext selbst und nicht aus dem
 * Gedächtnis: jedes `window.X = …` und jedes `const X = (() => {` auf
 * oberster Ebene steht hier, ausser dem, was schon eine `.ts`-Quelle hat und
 * sich damit selbst erklärt.
 *
 * ─── WOZU DIESE LISTE DA IST, UND WOZU NICHT ────────────────────────────────
 *
 * Sie ist **die Startbahn für die TypeScript-Migration**, nicht ihr Ziel.
 *
 * Gemessen an drei echten Dateien kostet ein Umzug nach `.ts` unter dieser
 * strengen Einstellung **einen Typfehler je 4,4 Zeilen**. Bei 76 550 Zeilen
 * in 218 Dateien sind das rund siebzehntausend. Und jeder dritte davon war
 * schlicht „Cannot find name X": ein globaler Name, den TypeScript nicht
 * kannte.
 *
 * Diese Datei erledigt alle auf einmal. Sie macht jede einzelne der 218
 * Migrationen billiger — und zwar bevor die erste beginnt.
 *
 * ─── WARUM `any`, UND WARUM DAS HIER RICHTIG IST ────────────────────────────
 *
 * `CLAUDE.md` §52 erlaubt `any` an genau einer Stelle: **an der Grenze zum
 * alten Code**, nicht innerhalb einer migrierten Datei. Das hier IST diese
 * Grenze. Über ein Modul, das noch JavaScript ist, weiss TypeScript wirklich
 * nichts — und etwas anderes zu behaupten wäre schlimmer als `any`: es sähe
 * nach Typsicherheit aus und wäre keine.
 *
 * ─── UND DESHALB SOLL DIESE LISTE SCHRUMPFEN ────────────────────────────────
 *
 * Jeder Eintrag, der hier verschwindet, ist ein Modul, das umgezogen ist und
 * seine Typen selbst mitbringt. Die Liste ist dasselbe wie
 * `pruefungen/js-bestand.json`, nur von der anderen Seite gesehen: eine
 * Fortschrittsanzeige, die nur kleiner werden darf.
 * ==========================================================================*/


/**
 * Der Sammelpunkt `Register` aus `quell/register/*.js`.
 *
 * Er ist kein Modul, sondern eine Ablage: jede Registerdatei hängt ihren
 * Teil daran (`Register.ansichten`, `Register.bloecke`, `Register.formeln`).
 * Deshalb steht er hier und verschwindet auch nicht, wenn eine einzelne
 * Registerdatei umzieht — er gehört keiner von ihnen.
 *
 * `umzug.mts` lässt Namen dieser Bauart deshalb ausdrücklich stehen: wer
 * `(window as any).X = (window as any).X || {}` schreibt, legt den Namen
 * nicht an, sondern schliesst sich ihm an.
 */
declare const Register: any;
