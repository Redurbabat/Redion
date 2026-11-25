/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/ereignisse/arten.ts (npm run bauen:ts). */
/* ============================================================================
 * kern/ereignisse/arten.js — die Namen, auf die man horchen kann
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/ereignisse/arten.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/ereignisse/arten.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Ein Bus ohne Namensliste ist eine Sammlung von Tippfehlern. Wer auf
 * `'seite.geaendert'` horcht, während der andere `'seite.geandert'` meldet,
 * bekommt nie einen Fehler — nur nie ein Ereignis. Das ist die unangenehmste
 * Sorte Fehler: sie sieht aus wie „das Modul tut nichts".
 *
 * Deshalb stehen die Namen hier, und man schreibt `ARTEN.seiteGeaendert`
 * statt der Zeichenkette. Ein Tippfehler ist dann sofort `undefined` und
 * fällt auf.
 *
 * Der Aufbau der Namen ist bewusst gleichförmig:
 *
 *      <gegenstand>.<was geschah>
 *
 * In der **Vergangenheit**, weil ein Ereignis eine Aussage ist und kein
 * Auftrag: `seite.angelegt`, nicht `seite.anlegen`. Wer etwas anfordern
 * will, stellt eine Frage (`frage`) oder ruft den Dienst direkt.
 * ==========================================================================*/

const ARTEN = Object.freeze({

  /* --- App --------------------------------------------------------------- */
  appStartet:        'app.startet',
  appSteht:          'app.steht',
  appSchliesst:      'app.schliesst',

  /* --- Seiten ------------------------------------------------------------ */
  seiteAngelegt:     'seite.angelegt',
  seiteGeaendert:    'seite.geaendert',
  seiteGeoeffnet:    'seite.geoeffnet',
  seiteVerschoben:   'seite.verschoben',
  seiteInPapierkorb: 'seite.papierkorb',
  seiteZurueck:      'seite.zurueckgeholt',
  seiteEndgueltigWeg:'seite.endgueltig-weg',
  /* Eine FRAGE vor dem Verschlüsseln (E364): was soll die Seite mitnehmen,
     solange ihre Kinder noch lesbar sind? Das Regal antwortet „heftArt". */
  seiteWirdGesperrt: 'seite.wird-gesperrt',

  /* --- Blöcke ------------------------------------------------------------ */
  blockAngelegt:     'block.angelegt',
  blockGeaendert:    'block.geaendert',
  blockGeloescht:    'block.geloescht',
  blockUmgewandelt:  'block.umgewandelt',
  auswahlGeaendert:  'auswahl.geaendert',

  /* --- Datenbanken ------------------------------------------------------- */
  datenbankAngelegt: 'datenbank.angelegt',
  schemaGeaendert:   'datenbank.schema-geaendert',
  zeileAngelegt:     'zeile.angelegt',
  zeileGeaendert:    'zeile.geaendert',
  zeileGeloescht:    'zeile.geloescht',
  ansichtGeaendert:  'ansicht.geaendert',
  filterGeaendert:   'ansicht.filter-geaendert',

  /* --- Ablage ------------------------------------------------------------ */
  ablageGeladen:     'ablage.geladen',
  ablageGeschrieben: 'ablage.geschrieben',
  ablageGesperrt:    'ablage.gesperrt',

  /* --- Abgleich ---------------------------------------------------------- */
  abgleichStartet:   'abgleich.startet',
  abgleichFertig:    'abgleich.fertig',
  abgleichFehler:    'abgleich.fehler',
  konfliktGefunden:  'abgleich.konflikt',
  konfliktGeloest:   'abgleich.konflikt-geloest',

  /* --- Konto und Rechte -------------------------------------------------- */
  angemeldet:        'konto.angemeldet',
  abgemeldet:        'konto.abgemeldet',
  rechteGeaendert:   'konto.rechte-geaendert',

  /* --- Suche ------------------------------------------------------------- */
  sucheGestellt:     'suche.gestellt',
  indexAufgebaut:    'suche.index-aufgebaut',
  /* Die Quellen der KI wurden umgeschaltet (E724). EIN Schreiber
     (`Kontext.quelleUmschalten`), viele Leser: die Schalter im KI-Fenster,
     das Schild am Prompt, die Einstellungen. Vorher schrieben zwei, und der
     zweite vergass `aria-pressed`. */
  kiQuellenGeaendert: 'ki.quellen-geaendert',

  /* --- Oberfläche -------------------------------------------------------- */
  themaGewechselt:   'oberflaeche.thema',
  seitenleisteAuf:   'oberflaeche.seitenleiste',
  hinweisGezeigt:    'oberflaeche.hinweis',

  /* --- Fragen — hier wird eine Antwort erwartet -------------------------- */
  frageNavigation:   'frage.navigation',       /* was gehört in die Seitenleiste? */
  frageBefehle:      'frage.befehle',          /* was gehört in die Befehlspalette? */
  frageSeitenMenue:  'frage.seitenmenue',      /* was gehört ins Menü dieser Seite? */
  frageZeilenMenue:  'frage.zeilenmenue',
  frageDateiExport:  'frage.datei-export',    /* kann die Datei gespeichert werden? */
  frageBefund:       'frage.befund'            /* was gehört in den Gesundheitsbericht? */,

  /* --- Aufträge (E429) ---------------------------------------------------
     Diese fünf gab es seit der Auftragsmaschine, aber nur als rohe
     Zeichenketten an neunzehn Stellen. Ein Tippfehler wäre still gewesen:
     `horche('auftrag.beended')` wartet für immer, und ein Zuhörer, der
     nichts hört, sieht aus wie ein Ereignis, das nicht eingetreten ist. */
  auftragAngelegt:        'auftrag.angelegt',
  auftragBeginnt:         'auftrag.beginnt',
  auftragSchritt:         'auftrag.schritt',
  auftragBeendet:         'auftrag.beendet',
  auftragFehler:          'auftrag.fehler',
  auftragWiederaufgenommen: 'auftrag.wiederaufgenommen',

  /* --- Einstellungen ----------------------------------------------------- */
  einstellungGeaendert:   'einstellung.geaendert'
});

/** Eine der Zeichenketten oben — nicht irgendeine. */
type EreignisArt = (typeof ARTEN)[keyof typeof ARTEN];

/**
 * Gibt es diesen Namen? Für Prüfläufe und die Fehlersuche.
 *
 * Der Rückgabewert ist ein Typwächter: wer `if (artKennt(x))` schreibt, hat
 * danach kein `string` mehr in der Hand, sondern eine der Arten. Das ist
 * genau die Zusage, um derentwillen diese Datei existiert.
 */
const artKennt = (name: unknown): name is EreignisArt =>
  Object.values(ARTEN).some(a => a === name);

(window as any).ARTEN = ARTEN;
(window as any).artKennt = artKennt;
