/* ============================================================================
 * kern/einstellung/konstanten.js — Zahlen, die an mehr als einer Stelle gelten
 * ----------------------------------------------------------------------------
 * Eine Zahl, die zweimal im Code steht, ist eine Zahl, die irgendwann
 * auseinanderläuft. Die Ablage schreibt nach 400 ms, der Editor wartet 400 ms
 * mit dem Speichern — und wenn jemand das eine ändert und das andere nicht,
 * entsteht ein Fehler, den niemand einer Zahl ansieht.
 *
 * Hier steht jede solche Zahl einmal, mit dem Grund daneben. Der Grund ist
 * der eigentliche Inhalt dieser Datei: eine Grenze ohne Begründung wird beim
 * nächsten Ärger einfach hochgesetzt, und dann ist sie keine Grenze mehr.
 *
 * Was hier **nicht** hingehört: alles, was ein Mensch einstellen kann. Das
 * steht in den Einstellungen und liegt im Bestand.
 * ==========================================================================*/

const KONSTANTEN = Object.freeze({

  /* --- Wer wir sind ------------------------------------------------------ */
  NAME:            'Redion',
  ABLAGE_NAME:     'notizen',      /* Der Name der IndexedDB. Nicht ändern —
                                      sonst sind alle bestehenden Daten weg. */

  /* --- Schreiben --------------------------------------------------------- */
  SCHREIB_PAUSE_MS: 400,           /* Erst schreiben, wenn 400 ms Ruhe war.
                                      Kürzer heisst mehr Schreibvorgänge beim
                                      Tippen, länger heisst mehr Verlust bei
                                      einem Absturz. 400 ms ist der Punkt,
                                      an dem ein Mensch eine Pause macht. */

  /* --- Grenzen der Ablage ------------------------------------------------ */
  DATEI_MAX:        500 * 1024 * 1024,  /* 500 MB je Datei */
  STUECK:           1024 * 1024,        /* Stückgrösse beim Hochladen */
  KLEIN:            256 * 1024,         /* Darunter ohne Stückelung — der
                                           Apparat kostet mehr als er spart */
  VERSIONEN_MAX:    200,                /* Fassungen je Seite */

  /* --- Abgleich ---------------------------------------------------------- */
  ABGLEICH_TAKT_MS: 120000,        /* Alle zwei Minuten. Bei zwei Geräten sind
                                      das rund 1500 Anfragen am Tag — ein
                                      Sechzigstel der kostenlosen Grenze. */
  ABGLEICH_RUNDE:   300,           /* Sätze je Anfrage. Der Server nimmt 500;
                                      300 lassen Luft für grosse Seiten. */
  ABGLEICH_RUNDEN:  40,            /* Höchstens so viele Runden am Stück —
                                      eine Schleife, die nie endet, ist
                                      schlimmer als ein unvollständiger
                                      Abgleich. */
  SITZUNG_TAGE:     30,

  /* --- Rechnen ----------------------------------------------------------- */
  FORMEL_TIEFE:     12,            /* Notion hört bei 15 Ebenen auf. Hier
                                      genügen 12, um eine Endlosschleife zu
                                      erkennen, bevor der Tab steht. */
  VORRAT_LOHNT_AB:  120,           /* Unter 120 Zeilen kostet das Verwalten
                                      vorberechneter Werte mehr, als das
                                      Rechnen spart. */
  MERGE_MAX_WORTE:  4000,          /* Wortweises Zusammenführen kostet
                                      Länge × Länge. Darüber lieber ehrlich
                                      einen Konflikt melden als einfrieren. */

  /* --- Oberfläche -------------------------------------------------------- */
  HINWEIS_MS:       2600,          /* Wie lange ein Hinweis stehen bleibt */
  FENSTERWEISE_AB:  200,           /* Ab so vielen Zeilen wird nur gezeichnet,
                                      was man sehen kann */
  TELEFON_BREITE:   768,           /* Darunter gilt die Handy-Oberfläche */
  SUCHE_MAX:        200,           /* Treffer je Suche — mehr liest niemand */

  /* --- Aufräumen --------------------------------------------------------- */
  PAPIERKORB_TAGE:  30,            /* Voreinstellung; einstellbar */
  PROTOKOLL_MAX:    2000,
  KONFLIKTE_MAX:    200,
  MELDER_MAX:       500
});

window.KONSTANTEN = KONSTANTEN;
