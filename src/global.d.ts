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
declare const Melder: any;
