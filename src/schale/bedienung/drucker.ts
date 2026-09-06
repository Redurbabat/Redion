/* ============================================================================
 * schale/bedienung/drucker.ts — die Drucker-Karte: was der Druckauftrag tut
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/drucker.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. „Drucken oder als PDF" (bereiche/wissen/werkzeuge.ts, `drucken`)
 * sammelt erst die Seitenbilder aus der Ablage, setzt dann die Seite als
 * HTML in einen Druckrahmen und ruft den Druckdialog des Browsers. Bei
 * achtzig PDF-Seiten dauert das Sammeln Sekunden — und bis hierher zeigte
 * in dieser Zeit NICHTS, dass etwas geschieht. Wer nichts sieht, drückt
 * noch einmal (so steht es im Kopf von pdf/einlesen.ts, und es gilt hier
 * genauso).
 *
 * WOHER. Uiverse-Eintrag Nr. 28 „Printer Process Card" von spotift_5948
 * (UI-Reserve, E440; das Original liegt unverändert unter
 * quell/entwicklung/ui-reserve/komponenten/28-printer-process-card/).
 * Das Original lässt einen Drucker in einer Schleife von 6,4 s ein Blatt
 * einziehen, bedrucken und ausgeben — und schreibt dazu „Ready, Feeding,
 * Printing, Ejecting, Done" AUS EINEM ZEITGEBER. Genau das darf die
 * Redion-Fassung nicht (Katalog: „nur echter Zustand"): hier kommt jeder
 * Zustand aus dem Ablauf, der ihn auslöst, und kein Wort steht da, das
 * nicht gerade wahr ist (E458).
 *
 * SECHS ZUSTÄNDE, und woher jeder kommt:
 *
 *     bereit       die Karte steht, noch läuft nichts
 *     vorbereiten  `bilderSammeln()` läuft — Seitenbilder aus der Ablage
 *     rendern      `seiteAlsHtml()` und der Druckrahmen werden gebaut
 *     speichern    der Druckdialog des Browsers ist offen (Drucker oder PDF)
 *     fertig       der Dialog ist zu — `print()` ist zurückgekehrt
 *     fehler       davor flog ein Fehler; sein Satz steht auf der Karte
 *
 * Das Blatt bewegt sich nur in `vorbereiten` und `rendern` — solange
 * wirklich gearbeitet wird. In `speichern` und `fertig` liegt es bedruckt
 * im Fach, in `fehler` steckt es halb im Schlitz, ohne Druck. Die Lampe
 * wechselt die Farbe, aber nie allein (§38): Zeichen und Satz sagen es
 * daneben, und die Karte ist `role="status"` — der Wechsel wird
 * vorgelesen, ohne zu unterbrechen. Wer keine Bewegung will
 * (`prefers-reduced-motion`), sieht das Blatt still liegen; der Satz sagt
 * es ohnehin.
 *
 * WAS ES NICHT IST. Kein Fortschrittsbalken: der Druckweg kennt keinen
 * Anteil nach aussen, und ein erfundener Prozentwert wäre eine Behauptung.
 * Und kein Knopf — der Knopf, der Drucken auslöst, bleibt, wo er ist.
 * ==========================================================================*/

type DruckerZustand = 'bereit' | 'vorbereiten' | 'rendern' | 'speichern' | 'fertig' | 'fehler';

interface DruckerGriff {
  element: HTMLElement;
  /** Auf einen Zustand stellen; `text` ersetzt den Standardsatz. */
  setzen: (zustand: DruckerZustand, text?: string) => void;
  zustand: () => DruckerZustand;
  /** Die Karte wegnehmen — sofort, oder nach `nachMs` Millisekunden. */
  entfernen: (nachMs?: number) => void;
}

const Drucker = (() => {

  /* KURZ, weil die Karte 190 px breit ist: „Die Seiten werden gesetzt …"
     brach auf dem Bild in zwei Zeilen, das Zeichen stand allein am Rand.
     Bis 22 Zeichen passt ein Satz in eine Zeile; ein Fehlersatz darf
     länger sein und bricht dann als Fliesstext um. */
  const SAETZE: Record<DruckerZustand, string> = {
    bereit:      'Bereit',
    vorbereiten: 'Seitenbilder sammeln …',
    rendern:     'Seiten setzen …',
    speichern:   'Drucken oder als PDF …',
    fertig:      'Fertig',
    fehler:      'Nicht gedruckt'
  };

  /* Das Zeichen kommt aus zustand.ts, damit es EINE Sprache bleibt (E441):
     „…" wartet, „◐" läuft, „✓" fertig, „!" Fehler. Fehlt das Bauteil
     (Ladereihenfolge), stehen dieselben Zeichen hier als Rückfall. */
  const ZEICHEN_ART: Record<DruckerZustand, ZustandArt> = {
    bereit: 'bereit', vorbereiten: 'wartet', rendern: 'laeuft',
    speichern: 'laeuft', fertig: 'fertig', fehler: 'fehler'
  };
  const RUECKFALL: Record<ZustandArt, string> = {
    bereit: '○', wartet: '…', laeuft: '◐', fertig: '✓', fehler: '!', abgebrochen: '✕'
  };
  const zeichenFuer = (zustand: DruckerZustand): string => {
    const art = ZEICHEN_ART[zustand];
    return typeof Zustand !== 'undefined' && Zustand.zeichen ? Zustand.zeichen(art) : RUECKFALL[art];
  };

  const ist = (wert: unknown): wert is DruckerZustand =>
    typeof wert === 'string' && Object.prototype.hasOwnProperty.call(SAETZE, wert);

  const el = (tag: string, klasse: string, eltern?: Element): HTMLElement => {
    const e = document.createElement(tag);
    e.className = klasse;
    if (eltern) eltern.append(e);
    return e;
  };

  /** Die Bühne: das Blatt hinter dem Gerät, das Gerät davor. Alles Bild. */
  const buehne = (): HTMLElement => {
    const b = el('div', 'ru-drucker-buehne');
    b.setAttribute('aria-hidden', 'true');
    const gruppe = el('div', 'ru-drucker-blattgruppe', b);
    el('i', 'ru-drucker-blattschatten', gruppe);
    const blatt = el('div', 'ru-drucker-blatt', gruppe);
    for (let i = 0; i < 8; i++)
      el('i', 'ru-drucker-tinte', blatt).style.setProperty('--ru-schritt', String(i));
    const geraet = el('div', 'ru-drucker-geraet', b);
    el('i', 'ru-drucker-umschatten', geraet);
    el('i', 'ru-drucker-deckel-innen', el('div', 'ru-drucker-deckel', geraet));
    const koerper = el('div', 'ru-drucker-koerper', geraet);
    el('i', 'ru-drucker-schlitz', koerper);
    const feld = el('div', 'ru-drucker-feld', koerper);
    el('i', 'ru-drucker-feld-gross', feld);
    el('i', 'ru-drucker-feld-klein', feld);
    const knoepfe = el('div', 'ru-drucker-knoepfe', koerper);
    for (let i = 0; i < 3; i++) el('i', 'ru-drucker-knopf', knoepfe);
    const lampe = el('div', 'ru-drucker-lampe', koerper);
    el('i', 'ru-drucker-led', lampe);
    el('i', 'ru-drucker-schein', lampe);
    const lueftung = el('div', 'ru-drucker-lueftung', koerper);
    for (let i = 0; i < 4; i++) el('i', 'ru-drucker-lamelle', lueftung);
    el('i', 'ru-drucker-fach-innen', el('div', 'ru-drucker-fach', koerper));
    el('i', 'ru-drucker-marke', koerper);
    return b;
  };

  /**
   * Die Karte bauen. `<div class="ru-drucker" role="status" data-zustand>`
   * mit Bühne (aria-hidden) und Satz (Zeichen aria-hidden, Text). Sie
   * hängt noch nirgends — `zeigen()` stellt sie schwebend auf die Seite.
   */
  const bauen = (): DruckerGriff => {
    const karte = el('div', 'ru-drucker');
    karte.setAttribute('role', 'status');
    karte.append(buehne());
    const status = el('p', 'ru-drucker-status', karte);
    const zeichen = el('span', 'ru-drucker-zeichen', status);
    zeichen.setAttribute('aria-hidden', 'true');
    const text = el('span', 'ru-drucker-text', status);
    let jetzt: DruckerZustand = 'bereit';
    let wecker = 0;

    const setzen = (zustand: DruckerZustand, eigenerText?: string): void => {
      /* Ein unbekanntes Wort wird zu 'fehler' MIT dem Wort als Satz: lieber
         ein sichtbares Fragezeichen als eine stille Karte (wie zustand.ts). */
      jetzt = ist(zustand) ? zustand : 'fehler';
      karte.dataset['zustand'] = jetzt;
      zeichen.textContent = zeichenFuer(jetzt);
      text.textContent = eigenerText ?? (ist(zustand) ? SAETZE[jetzt] : String(zustand));
    };
    const entfernen = (nachMs = 0): void => {
      window.clearTimeout(wecker);
      if (nachMs > 0) { wecker = window.setTimeout(() => karte.remove(), nachMs); return; }
      karte.remove();
    };
    setzen('bereit');
    return { element: karte, setzen, zustand: () => jetzt, entfernen };
  };

  /**
   * Die Karte schwebend über der Seite zeigen — unten rechts, am Telefon
   * über der Leiste. Es gibt höchstens EINE: wer zweimal druckt, bevor die
   * erste weg ist, bekommt eine frische Karte und keine zwei übereinander.
   */
  const zeigen = (): DruckerGriff => {
    document.querySelectorAll('.ru-drucker.ru-drucker-schwebt').forEach(alt => alt.remove());
    const griff = bauen();
    griff.element.classList.add('ru-drucker-schwebt');
    document.body.append(griff.element);
    return griff;
  };

  return { SAETZE, ist, bauen, zeigen };
})();

(window as any).Drucker = Drucker;
