/* ============================================================================
 * schale/aufbau/menueband.js — das Menüband zeichnen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/menueband.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/schale/aufbau/menueband.js`. Wer das .js bearbeitet, verliert
 * die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * WAS HIER STEHT UND WAS NICHT
 *
 * Hier steht das AUSSEHEN. Was im Band steht, steht in
 * `register/menueband.ts`. Diese Datei kennt keinen einzigen Knopf beim
 * Namen — sie fragt das Register und zeichnet, was kommt. Deshalb muss
 * niemand hierher, der einen Eintrag hinzufügt.
 *
 * DER AUFBAU
 *
 *     <div id="menueband">
 *       <div class="mb-reiter">   R · Datei · <div class="mb-tabs" role=tablist>
 *                                 Gehen · Start · Einfügen · … </div> · ⌕ ✦ K ⌄
 *       <div class="mb-band">     die Gruppen des gewählten Reiters
 *
 * Der gewählte Reiter und „zugeklappt oder nicht" stehen in `meta` und
 * überleben deshalb einen Neustart. Wer einmal auf „Elektro" steht, will
 * beim nächsten Öffnen nicht wieder bei „Start" anfangen.
 *
 * WARUM DAS BAND ZUKLAPPBAR IST
 *
 * Es kostet Platz, und Platz ist auf einem Laptop knapp. Ein Band, das man
 * nicht loswird, ist auf einem 13-Zoll-Bildschirm eine Zumutung — auf dem
 * Telefon erst recht. Zugeklappt bleibt die Reiterzeile stehen: man sieht,
 * dass es das Band gibt, und ist einen Klick davon entfernt.
 *
 * TASTATUR (§38)
 *
 * Die Reiterliste ist eine echte `tablist`: Pfeiltasten wandern, Pos1 und
 * Ende springen, und nur der gewählte Reiter ist in der Tabulator-Reihenfolge.
 * Das ist nicht Zierde — ohne das ist ein Menüband mit acht Reitern für
 * jeden, der nicht mit der Maus arbeitet, eine Sackgasse.
 *
 * Die `tablist` ist seit E272 Phase G der INNERE Kasten `.mb-tabs` und
 * nicht mehr die ganze Zeile: neben den Reitern stehen dort die Marke,
 * „Datei", Suche, KI, Konto und der Klapp-Pfeil, und keines davon ist ein
 * Reiter. Eine Liste, die etwas anderes enthält als das, was sie ansagt,
 * ist für ein Vorleseprogramm schlimmer als gar keine.
 * ==========================================================================*/

const Menueband = (() => {

  /* Wo im Baum es hängt. `index.html` legt den Kasten an; hier wird er nur
     gefüllt. So kann `bauen.mts` die Einzeldatei bauen, ohne zu wissen,
     dass es das Band gibt. */
  const WURZEL = 'menueband';

  const merkeReiter = 'bandReiter';

  /* ZWEI ERINNERUNGEN, NICHT EINE.
     Erst gab es nur `bandZu`. Dann fand die Prüfung: wer das Band auf einer
     SEITE aufklappt, hatte es auch auf „Heute" offen — die Wahl von einem
     Ort galt am anderen, und die ortsabhängige Vorgabe war damit ausser
     Kraft. Eine Startansicht mit 137 px Knöpfen darüber ist genau das, was
     die Vorgabe verhindern sollte. */
  const merkeZuSeite = 'bandZu';        // der alte Name bleibt der alte Name
  const merkeZuWelt = 'bandZu:welt';

  const meta = (name: string, standard: any): any => {
    if (typeof Store === 'undefined' || typeof Store.getMeta !== 'function') return standard;
    try { return Store.getMeta(name, standard); } catch { return standard; }
  };
  const setzeMeta = (name: string, wert: any): void => {
    if (typeof Store === 'undefined' || typeof Store.setMeta !== 'function') return;
    try { Store.setMeta(name, wert); } catch { /* ohne Ablage bleibt es bei dieser Sitzung */ }
  };

  /* Der Zustand wird BEIM ZEICHNEN gelesen und nicht beim Laden der Datei.
     Beim Laden ist IndexedDB noch nicht offen, und die gemerkte Wahl käme
     nie zurück — genau das ist der Bibliothek passiert (E207). */
  const reiterJetzt = (): string => String(meta(merkeReiter, 'start') || 'start');

  /**
   * Zugeklappt oder nicht — und am Telefon ist die VORGABE zugeklappt.
   *
   * Gemessen: Kopfzeile 54 px plus Band 138 px heisst, dass die Seite auf
   * einem 844 px hohen Bildschirm erst bei y=274 anfängt. Ein Drittel des
   * Bildschirms für Knöpfe, bevor ein Wort des eigenen Textes zu sehen ist,
   * ist keine Notiz-App mehr. Die Reiterzeile bleibt stehen; ein Tipp
   * darauf klappt auf, und die Wahl wird gemerkt.
   */
  /* SEIT E236 NICHT MEHR GEBRAUCHT und trotzdem hier: der Absatz darüber
     ist die Begründung dafür, dass die Leiste zugeklappt beginnt — und
     seit E236 gilt sie überall, nicht nur am Telefon. Die Funktion selbst
     wäre nur noch ein toter Name; sie fällt weg, der Grund bleibt stehen. */

  /**
   * Ist gerade eine Seite offen — oder eine Sonderansicht?
   *
   * Gemessen wird am DOM und nicht an `App.aktuelleSeite()`: dessen Kennung
   * bleibt beim Wechsel zurück auf „Heute" auf der zuletzt geöffneten Seite
   * stehen. Ein Zustand, der veralten kann, ist als Grundlage für „was zeige
   * ich" schlechter als das, was wirklich auf dem Schirm steht.
   *
   * DER TEST WAR ZUERST FALSCH. Er fragte, ob `#page` die Klasse
   * `produkt-welt` trägt — und die Bibliothek trägt sie nicht, sondern
   * `wide`. Das Band stand dort also offen, mit einem Reiter „Einfügen", der
   * nichts einzufügen hatte. Gesehen auf einem Bildschirmfoto, gemessen
   * danach über vier Ansichten:
   *
   *     Start (Heute)   produkt-welt lernwelt     kein #title
   *     echte Seite     (keine Klasse)            #title, Symbol, Werkzeuge
   *     Bibliothek      wide                      kein #title
   *     Arbeitswelt     wide produkt-welt …       kein #title
   *
   * `#title` ist das einzige, das genau bei der echten Seite steht — und es
   * ist auch der richtige BEGRIFF: eine Seite hat einen Titel, in den man
   * schreibt. Eine Übersicht hat keinen.
   *
   * Nicht die Blöcke zählen: eine frisch angelegte Seite hat null davon und
   * ist trotzdem eine Seite.
   */
  const seiteOffen = (): boolean => !!document.getElementById('title');

  /**
   * Zugeklappt oder nicht.
   *
   * Die VORGABE hängt vom Ort ab, die WAHL nicht. Am Telefon und auf einer
   * Sonderansicht ist das Band zunächst zu; wer es einmal aufklappt, behält
   * es offen.
   *
   * Der Grund ist gemessen: aufgeklappt begann die Seite am Telefon erst bei
   * y=274 von 844, und auf der Heute-Ansicht rutschte der Startknopf auf
   * y=1105 in einem 1000 px hohen Fenster (test217). Ein Menüband über einer
   * Startansicht kann ohnehin fast nichts — „Einfügen" und „Zeichnen"
   * brauchen eine Seite, in die geschrieben wird.
   */
  /** Welche Erinnerung gilt hier — die der Seite oder die der Startansicht? */
  const merkeZu = (): string => seiteOffen() ? merkeZuSeite : merkeZuWelt;

  /* ZUGEKLAPPT IST JETZT ÜBERALL DIE VORGABE (E236).
     Vorher hing sie am Ort: am Telefon zu, am Rechner offen. Gemessen mit
     offener Seite auf 1200 px war die offene Leiste 221 px hoch — ein
     Viertel des Fensters, bevor der erste Buchstabe der Seite kommt.

     Redur: „ganz oben so wie MacBook … aber es sollte nicht so viel Platz
     nehmen." Ein Menü am Rechner steht auch nicht offen da; es klappt auf,
     wenn man es braucht. Zugeklappt sind es 35 px.

     Am RECHNER bleibt die Wahl gemerkt: wer aufklappt, behält es offen —
     je Seite und je Startansicht getrennt, wie bisher. */
  const amTelefon = (): boolean => {
    try { return window.matchMedia('(max-width: 760px)').matches; }
    catch { return false; }
  };
  /* AM TELEFON WIRD „OFFEN" NICHT MEHR GEMERKT (E240).
     Redur hat vier Fotos seines iPhones geschickt: das Band stand offen
     über Termine, Lernen, Heute UND einer offenen Seite — 371 px von 844,
     dauerhaft. Der Weg dahin ist ein einziger Reitertipp: er schrieb
     `bandZu:welt=false`, und dieser EINE Schlüssel gilt für alle
     Startansichten, über jedes Neuladen hinweg. Wer keinen Befehl wählte
     und den Pfeil nicht fand, behielt das halbe Bild belegt — für immer.

     Am Telefon ist das Band deshalb ein MENÜ und kein Arbeitszustand:
     Aufklappen zeigt es JETZT (nur als Klasse im Baum, nie im Speicher),
     jede Neuzeichnung beginnt zu, ein Tipp daneben schliesst es. Am
     Rechner ist Platz; dort bleibt der Merker. */
  const zugeklappt = (): boolean => amTelefon() || meta(merkeZu(), true) === true;
  /** Das Band JETZT zeigen oder verbergen, ohne den Speicher anzufassen. */
  const fluechtig = (zu: boolean): void => {
    const w = document.getElementById(WURZEL);
    if (!w) return;
    /* `zeichne()` spart sich das Befüllen, wenn zugeklappt — und am Telefon
       IST es beim Zeichnen immer zugeklappt. Wer hier öffnet, muss also
       nachfüllen, sonst zeigt er ein leeres Band: gemessen 14 px hoch,
       nur das Polster. (`bandFuellen` steht weiter unten im Modul; beim
       ersten Aufruf hier existiert es längst — Klick kommt nach Aufbau.) */
    if (!zu) {
      const band = w.querySelector<HTMLElement>('.mb-band');
      if (band && !band.childElementCount) {
        bandFuellen(band, reiterJetzt());
        if (Register?.symbole?.fuelle) {
          try { Register.symbole.fuelle(band); } catch { /* ohne Zeichen bleibt der Name */ }
        }
      }
    }
    w.classList.toggle('ist-zu', zu);
  };

  /* ======================================================================== *
   * EIN KNOPF
   * ======================================================================== */

  /**
   * Zeichen oder Buchstabe?
   *
   * Das Register liefert bei einem Werkzeug einen Namen aus
   * `register/symbole.ts` („calendar"), bei einer Blockart aber das Zeichen
   * selbst („H₁", „•", „B").
   *
   * Der erste Entwurf unterschied sie mit `/^[a-zA-Z]+$/` — „nur Buchstaben,
   * also ein Symbolname". Damit wurden „B", „I" und „S" für Fett, Kursiv und
   * Durchgestrichen zu Symbolnamen, die es nicht gibt, und die drei Knöpfe
   * standen ohne jedes Zeichen da. Das Auge hat es sofort gesehen, keine
   * Prüfung hätte es gemeldet (§55.1).
   *
   * Jetzt wird gefragt statt geraten: `Register.symbole.hat(name)`.
   */
  const zeichenIn = (wo: HTMLElement, zeichen: string): void => {
    if (Register?.symbole?.hat?.(zeichen)) {
      const s = document.createElement('span');
      s.dataset['sym'] = zeichen;
      wo.appendChild(s);
      return;
    }
    const s = document.createElement('span');
    s.className = 'mb-glyph';
    s.textContent = zeichen;
    /* Aus der Vorlesereihe raus: der Name steht daneben im Klartext, und
       „H tiefgestellt eins" zweimal zu hören hilft niemandem (§38). */
    s.setAttribute('aria-hidden', 'true');
    wo.appendChild(s);
  };

  const knopf = (e: any): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    /* `an()` markiert den Knopf als GEWÄHLT — beim Zeichnen ist das das
       aktive Werkzeug. Ein Werkzeugkasten, in dem nichts markiert ist,
       zwingt zum Ausprobieren; einer, in dem das Falsche markiert ist, ist
       schlimmer. Beides war da, bis E212 den Zustand in den Kern gelegt hat. */
    let gewaehlt = false;
    if (typeof e.an === 'function') { try { gewaehlt = e.an() === true; } catch { gewaehlt = false; } }
    b.className = 'mb-knopf' + (e.gross ? ' ist-gross' : '') + (gewaehlt ? ' ist-an' : '');
    if (gewaehlt) b.setAttribute('aria-pressed', 'true');
    else if (typeof e.an === 'function') b.setAttribute('aria-pressed', 'false');
    b.dataset['band'] = String(e.id);
    /* `textContent` und nie `innerHTML`: die Namen kommen aus Registern, aber
       ein Bereich darf über `melde()` eigene beisteuern, und dann stünde hier
       fremder Text (§19). */
    /* EINE PROBE STATT EINES ZEICHENS.
       Farbe und Strichstärke lassen sich nicht als Symbolname sagen. Ein
       graues Zeichen mit dem Wort „Blau" darunter wäre die Farbe nur
       behauptet — und ein Strich, der überall gleich dick aussieht, sagt
       über die Stärke gar nichts.

       Der NAME bleibt trotzdem darunter stehen (§38): wer Farben nicht
       unterscheiden kann, liest „Rot" und „Blau". */
    if (e.probe && (e.probe.farbe || e.probe.dicke)) {
      const pr = document.createElement('span');
      pr.className = 'mb-probe';
      if (e.probe.farbe) {
        pr.classList.add('ist-farbe');
        pr.style.background = String(e.probe.farbe);
      } else {
        pr.classList.add('ist-strich');
        const bar = document.createElement('i');
        /* DOPPELT SO DICK WIE DER ECHTE STRICH — UND WARUM DAS EHRLICH IST.

           Erst stand hier die wahre Stärke mit `Math.max(2, …)` als Boden,
           wie an der Leiste unter der Fläche. Gemessen wurden daraus
           2,0 / 2,5 / 6,5 px: der Boden zog 1,2 auf 2 hoch und liess
           zwischen „Dünn" und „Mittel" einen halben Pixel übrig. Auf dem
           dreifach vergrösserten Bild waren beide noch immer kaum
           auseinanderzuhalten — bei 100 % gar nicht.

           Der Boden weg reichte nicht: 1,2 gegen 2,4 px sind gemessen 6,4
           gegen 8,0 Bildpunkte Tinte, ein Viertel Unterschied. Zwei Proben,
           die gleich aussehen, helfen bei der Wahl nicht.

           Also der doppelte Massstab. Das VERHÄLTNIS bleibt genau erhalten
           (1 : 2 : 4), nur die absolute Grösse ist nicht mehr wörtlich —
           eine Probe ist eine Probe und kein Lineal. Wer den echten Strich
           sehen will, zieht ihn: dort steht er in seiner wahren Stärke. */
        bar.style.height = Math.max(2, Number(e.probe.dicke) * 2) + 'px';
        pr.appendChild(bar);
      }
      b.appendChild(pr);
    } else {
      zeichenIn(b, String(e.zeichen || '▫'));
    }
    const t = document.createElement('span');
    t.className = 'mb-name';
    t.textContent = String(e.name || '');
    b.appendChild(t);
    /* DAS TASTENKÜRZEL STEHT IM TOOLTIP UND NICHT AM KNOPF.
       Es stand darunter, und weil nur die Hälfte der Knöpfe eines hat, war
       die Reihe ungleich hoch — „Nummerierte Liste · Ctrl+Shift+6" wurde
       vierzeilig und zog alles daneben mit. Word macht es genauso: das
       Kürzel erscheint, wenn man stehen bleibt. */
    /* Der Hinweis ist der ganze Satz — für die Maus als `title`, für
       Vorleseprogramme als Beschriftung. Ohne ihn wäre ein Knopf mit dem
       Zeichen „•" für ein Vorleseprogramm namenlos. */
    const satz = String(e.hinweis || e.name || '') +
      (e.kurz ? '  (' + String(e.kurz) + ')' : '');
    if (satz) { b.title = satz; b.setAttribute('aria-label', satz); }
    return b;
  };

  /* ======================================================================== *
   * DAS BAND
   * ======================================================================== */

  const gruppeZeichnen = (g: { gruppe: string; eintraege: any[] }): HTMLElement => {
    const kasten = document.createElement('div');
    kasten.className = 'mb-gruppe';
    kasten.dataset['gruppe'] = g.gruppe;

    const reihe = document.createElement('div');
    reihe.className = 'mb-reihe';
    g.eintraege.forEach(e => reihe.appendChild(knopf(e)));

    /* Die Überschrift steht UNTER den Knöpfen, wie in Textprogrammen üblich.
       Sie ist klein und leise: sie ordnet, sie ruft nicht. Die Form kommt
       aus dem Kicker-Baustein (anatomie.css, E260); .mb-gruppe-titel behält
       nur die Band-Abweichungen. */
    const titel = document.createElement('div');
    titel.className = 'kicker mb-gruppe-titel';
    titel.textContent = g.gruppe;

    kasten.append(reihe, titel);
    return kasten;
  };

  /** Das Band unter der Reiterzeile neu füllen. */
  const bandFuellen = (band: HTMLElement, reiter: string): void => {
    band.replaceChildren();
    const gruppen = Register?.menueband?.inReiter?.(reiter) || [];
    if (!gruppen.length) {
      /* Ein leerer Reiter kommt vor — `zeigen()` kann alles weggefiltert
         haben, etwa in der Einzeldatei. Dann steht da ein Satz und nicht
         eine leere Fläche, die aussieht wie ein Fehler. */
      const leer = document.createElement('div');
      leer.className = 'mb-leer';
      leer.textContent = 'Hier ist gerade nichts verfügbar.';
      band.appendChild(leer);
      return;
    }
    gruppen.forEach((g: any, i: number) => {
      if (i) {
        const strich = document.createElement('div');
        strich.className = 'mb-trenner';
        strich.setAttribute('aria-hidden', 'true');
        band.appendChild(strich);
      }
      band.appendChild(gruppeZeichnen(g));
    });

    /* DAS „•••" GEHÖRT ZUM BAND, NICHT ZUR REITERZEILE (E272).
       Es zeigt, was in DIESEM Reiter nicht hineinpasste — ein zweiter Reiter
       hat einen anderen Überlauf. Stünde es oben, sähe es aus wie ein
       Befehl der ganzen App.

       Es steht immer im Baum und ist nur `hidden`, solange nichts überläuft.
       Es beim Bedarf zu erzeugen hiesse, es bei jeder Fensterbreite neu
       einzuhängen — und `ueberlaufLayout` müsste dabei messen, was es
       gerade selbst verändert. */
    const mehr = document.createElement('button');
    mehr.type = 'button';
    mehr.className = 'mb-mehr';
    mehr.dataset['band'] = '__mehr';
    mehr.hidden = true;
    mehr.setAttribute('aria-haspopup', 'dialog');
    mehr.setAttribute('aria-label', 'Weitere Befehle');
    mehr.title = 'Weitere Befehle';
    const punkte = document.createElement('span');
    punkte.dataset['sym'] = 'dots';
    mehr.appendChild(punkte);
    band.appendChild(mehr);
  };

  /* ======================================================================== *
   * DER ÜBERLAUF — höchstens fünfzehn auf einmal (E272)
   * ------------------------------------------------------------------------
   * Das Band stand bis E272 in bis zu ZWEI ZEILEN und war dann 223 px hoch.
   * „Einfügen" mit seinen 69 Knöpfen brauchte bei jeder Fensterbreite zwei.
   * Der Auftrag will EINE Zeile von 58 px — und alles, was nicht hineinpasst,
   * hinter einem „•••" desselben Reiters.
   *
   * DIE REGEL HAT ZWEI TEILE, und der zweite ist der wichtigere:
   *
   *   1. Höchstens 15 Befehle je Reiter sind sichtbar. Das ist eine feste
   *      Zahl aus dem Entwurf und keine Messung: mehr als fünfzehn Dinge
   *      nebeneinander liest niemand mehr, er sucht sie.
   *   2. Auch von den ersten fünfzehn wandern weitere ins „•••", solange die
   *      Zeile überläuft. Bei einem schmalen Fenster bleiben eben acht.
   *
   * VERSTECKT WIRD VON RECHTS, und die Reihenfolge im „•••" ist wieder die
   * des Registers. Wer „Fett" gewohnt ist, findet es beim schmalen Fenster
   * an derselben Stelle in der Liste — nur eben in der Liste.
   *
   * WAS HIER NICHT PASSIERT: schrumpfen. Kein Knopf wird schmaler, keine
   * Beschriftung kleiner. §23 des Auftrags ist da eindeutig, und der Entwurf
   * selbst ist an dieser Stelle auf 8,5 px gerutscht — erklärtermassen ein
   * Fehler. Wenn es eng wird, verschwindet ein BEFEHL, nicht ein Buchstabe.
   * ======================================================================== */

  const HOECHSTENS = 15;

  /** Was gerade im „•••" liegt — in Registerreihenfolge. */
  let imUeberlauf: any[] = [];

  const ueberlaufLayout = (): void => {
    const wurzel = document.getElementById(WURZEL);
    if (!wurzel || wurzel.classList.contains('ist-zu')) return;
    /* Am Telefon ist das Band ein Menü und darf rollen — dort gibt es
       keinen Überlauf, sondern eine Liste (E240). */
    if (amTelefon()) return;
    const band = wurzel.querySelector<HTMLElement>('.mb-band');
    const mehr = wurzel.querySelector<HTMLElement>('.mb-mehr');
    if (!band || !mehr) return;

    const knoepfe = [...band.querySelectorAll<HTMLElement>('.mb-knopf[data-band]')];
    const gruppen = [...band.querySelectorAll<HTMLElement>('.mb-gruppe')];
    const trenner = [...band.querySelectorAll<HTMLElement>('.mb-trenner')];

    /* Erst alles zeigen — sonst misst der zweite Durchgang gegen den
       Zustand des ersten und versteckt bei jeder Grössenänderung mehr. */
    knoepfe.forEach(k => { k.hidden = false; });
    gruppen.forEach(g => { g.hidden = false; });
    trenner.forEach(t => { t.hidden = false; });
    mehr.hidden = true;
    imUeberlauf = [];

    const versteckt: number[] = [];
    const verstecke = (i: number): void => {
      const k = knoepfe[i];
      if (!k || k.hidden) return;
      k.hidden = true;
      versteckt.push(i);
      /* Eine Gruppe ohne sichtbaren Knopf verschwindet mit ihrer
         Überschrift — sonst bliebe ein Titel über nichts stehen. */
      const g = k.closest<HTMLElement>('.mb-gruppe');
      if (g && !g.querySelector('.mb-knopf[data-band]:not([hidden])')) g.hidden = true;
    };

    /* WIE MISST MAN "PASST NICHT MEHR"? NICHT MIT scrollWidth.
     *
     * Der Entwurf tut es so, und in einem einzelnen Dokument geht das auch.
     * Hier nicht, und der Grund kostete zwei Anlaeufe:
     *
     *   `scrollWidth` wird NIE KLEINER als `clientWidth`. Sobald der Inhalt
     *   passt, sind beide gleich. Ein Vergleich "scrollWidth > clientWidth
     *   minus Platz fuers Mehr-Zeichen" ist damit fuer immer wahr — der Lauf
     *   verbarg erst einen Knopf zu wenig (gemessen 1058 gegen 1040) und
     *   nach der "Berichtigung" alle vierzehn.
     *
     *   Dazu kommt `margin-left:auto` am Mehr-Knopf: ein Element, das den
     *   freien Platz aufsaugt, macht `scrollWidth` und `clientWidth` erst
     *   recht gleich. Beides zusammen ergibt eine Messung, die immer
     *   dasselbe sagt, egal was auf dem Bild steht.
     *
     * Gemessen wird deshalb die RECHTE KANTE DES LETZTEN SICHTBAREN KNOPFES
     * gegen die innere rechte Kante des Bandes, abzueglich des Platzes fuer
     * den Mehr-Knopf. Das ist eine Zahl ueber das, was man sieht, und keine
     * ueber einen Kasten, der sich selbst begrenzt.
     *
     * Damit das ueberhaupt messbar IST, duerfen die Knoepfe nicht gestaucht
     * werden — `flex: 0 0 auto` an Gruppe und Knopf. Genau diese Falle
     * beschreibt CLAUDE.md 55.2 am Tabellenblock: ein Flex-Kind wird
     * gequetscht statt ueberzustehen, und dann misst man 109 gegen 109.
     */
    const PLATZ_MEHR = 34;

    const passtNoch = (abzug: number): boolean => {
      const sichtbar = knoepfe.filter(k => !k.hidden);
      const letzte = sichtbar[sichtbar.length - 1];
      if (!letzte) return true;
      const stil = getComputedStyle(band);
      const rechts = band.getBoundingClientRect().right
        - (parseFloat(stil.paddingRight) || 0)
        - (parseFloat(stil.borderRightWidth) || 0);
      /* Ein Punkt Nachsicht: Unterpixelbreiten machen aus "passt genau"
         sonst "passt nicht", und das Band verloere bei jeder Neuzeichnung
         einen weiteren Knopf. */
      return letzte.getBoundingClientRect().right <= rechts - abzug + 1;
    };

    /* Teil 1: alles ab Nummer 16 — ohne zu messen, das ist die feste Regel.
     *
     * EINE FARBE IST KEIN BEFEHL. Der Reiter „Zeichnen" hat fünf Farben und
     * drei Strichstärken; sie unter die fünfzehn zu zählen hiesse, dass beim
     * Zeichnen entweder die Werkzeuge oder die Farben verschwinden. Beides
     * braucht die Hand gleichzeitig.
     *
     * Die Regel des Auftrags heisst „höchstens 15 BEFEHLE". Eine Farbwahl
     * ist eine Einstellung des laufenden Werkzeugs, kein eigener Befehl —
     * sie trägt deshalb eine `probe` statt eines Zeichens und zählt hier
     * nicht mit. Am Platz muss sie sich trotzdem messen lassen: Teil 2 geht
     * über ALLE Knöpfe. */
    const istProbe = (k: HTMLElement): boolean => !!k.querySelector('.mb-probe');
    const zaehlbar = knoepfe.filter(k => !istProbe(k));
    for (let n = zaehlbar.length - 1; n >= HOECHSTENS; n--) {
      const k = zaehlbar[n];
      if (k) verstecke(knoepfe.indexOf(k));
    }

    /* Teil 2: und weiter von rechts, solange es nicht passt. Der Abzug fuer
       den Mehr-Knopf gilt, sobald ueberhaupt etwas verborgen ist — dann wird
       er ja gebraucht. */
    for (let i = Math.min(HOECHSTENS, knoepfe.length) - 1; i >= 0; i--) {
      if (passtNoch(versteckt.length ? PLATZ_MEHR : 0)) break;
      verstecke(i);
    }
    /* Und ein letzter Blick: hat Teil 1 etwas verborgen, ohne dass Teil 2
       je gemessen haette, kann der Platz fuer den Mehr-Knopf noch fehlen. */
    for (let i = Math.min(HOECHSTENS, knoepfe.length) - 1;
         i >= 0 && versteckt.length && !passtNoch(PLATZ_MEHR); i--) verstecke(i);

    /* Leere Gruppen und ihre Trenner aufräumen — auch die aus Teil 1. */
    gruppen.forEach(g => {
      if (!g.querySelector('.mb-knopf[data-band]:not([hidden])')) g.hidden = true;
    });
    /* Ein Trenner vor einer verborgenen Gruppe hinge in der Luft. */
    trenner.forEach(t => {
      const naechste = t.nextElementSibling as HTMLElement | null;
      if (!naechste || naechste.hidden) t.hidden = true;
    });

    if (!versteckt.length) return;

    /* Die Liste fürs „•••" — in Registerreihenfolge, nicht in der
       Reihenfolge des Versteckens (die läuft von rechts nach links). */
    imUeberlauf = versteckt
      .sort((a, b) => a - b)
      .map(i => {
        const k = knoepfe[i];
        const id = k?.dataset['band'] || '';
        const gruppe = k?.closest<HTMLElement>('.mb-gruppe')?.dataset['gruppe'] || '';
        const eintrag = Register?.menueband?.eines?.(id);
        return eintrag ? { ...eintrag, gruppe: eintrag.gruppe || gruppe } : null;
      })
      .filter(Boolean);

    mehr.hidden = false;
    mehr.setAttribute('aria-label', imUeberlauf.length + ' weitere Befehle');
    mehr.title = imUeberlauf.length + ' weitere Befehle';
  };

  /* Nach jedem Zeichnen und bei jeder Grössenänderung — aber erst, wenn die
     Zeichen eingesetzt sind. Ohne `requestAnimationFrame` misst der Lauf
     gegen Knöpfe ohne SVG, die schmaler sind: derselbe Fehler, den der
     Kommentar bei `scrollIntoView` weiter unten beschreibt. */
  const ueberlaufBald = (): void => {
    try { requestAnimationFrame(() => ueberlaufLayout()); }
    catch { ueberlaufLayout(); }
  };

  let messUhr: any = null;
  const beobachten = (): void => {
    try {
      const b = new ResizeObserver(() => {
        if (messUhr) clearTimeout(messUhr);
        messUhr = setTimeout(ueberlaufBald, 70);
      });
      const w = document.getElementById(WURZEL);
      if (w) b.observe(w);
    } catch { /* ohne ResizeObserver misst nur das Zeichnen */ }
  };

  /* ======================================================================== *
   * DIE MEHR-LADE — was nicht ins Band passte
   * ------------------------------------------------------------------------
   * Ein Blatt, das von rechts unter dem „•••" aufgeht. Es ist ein Dialog:
   * Esc schliesst, der Fokus bleibt darin, und beim Schliessen geht er
   * dorthin zurück, wo er herkam (§38).
   * ======================================================================== */

  const ladeSchliessen = (): void => {
    const lade = document.getElementById('mb-mehr-lade');
    if (!lade) return;
    lade.remove();
    const mehr = document.querySelector<HTMLElement>('.mb-mehr');
    try { mehr?.focus(); } catch { /* dann eben nicht */ }
  };

  const ladeOeffnen = (): void => {
    if (document.getElementById('mb-mehr-lade')) { ladeSchliessen(); return; }
    if (!imUeberlauf.length) return;

    const lade = document.createElement('div');
    lade.id = 'mb-mehr-lade';
    lade.setAttribute('role', 'dialog');
    lade.setAttribute('aria-modal', 'false');
    lade.setAttribute('aria-label', 'Weitere Befehle');

    const kopf = document.createElement('div');
    kopf.className = 'mbl-kopf';
    const reiterName = (Register?.menueband?.reiter?.() || [])
      .find((r: any) => r.id === reiterJetzt())?.name || '';
    kopf.textContent = reiterName ? 'Weitere Befehle — ' + reiterName : 'Weitere Befehle';
    lade.appendChild(kopf);

    let letzteGruppe = '';
    imUeberlauf.forEach(e => {
      if (e.gruppe && e.gruppe !== letzteGruppe) {
        letzteGruppe = e.gruppe;
        const t = document.createElement('div');
        t.className = 'kicker mbl-gruppe';
        t.textContent = e.gruppe;
        lade.appendChild(t);
      }
      const z = document.createElement('button');
      z.type = 'button';
      z.className = 'mbl-zeile';
      z.dataset['band'] = String(e.id);
      zeichenIn(z, String(e.zeichen || 'dots'));
      const name = document.createElement('span');
      name.className = 'mbl-name';
      name.textContent = String(e.name || e.id);
      z.appendChild(name);
      if (e.kurz) {
        const k = document.createElement('span');
        k.className = 'mbl-kurz';
        k.textContent = String(e.kurz);
        z.appendChild(k);
      }
      if (e.hinweis) z.title = String(e.hinweis);
      lade.appendChild(z);
    });

    const wurzel = document.getElementById(WURZEL);
    (wurzel || document.body).appendChild(lade);
    if (Register?.symbole?.fuelle) {
      try { Register.symbole.fuelle(lade); } catch { /* ohne Zeichen bleibt der Name */ }
    }

    /* Der Fokus geht hinein, nicht daneben. */
    try { lade.querySelector<HTMLElement>('.mbl-zeile')?.focus(); } catch { /* egal */ }

    /* Esc schliesst; Tabulator bleibt drin (§38). */
    lade.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') { ev.stopPropagation(); ladeSchliessen(); return; }
      if (ev.key !== 'Tab') return;
      const drin = [...lade.querySelectorAll<HTMLElement>('button')];
      if (!drin.length) return;
      const erste = drin[0]!, letzte = drin[drin.length - 1]!;
      if (ev.shiftKey && document.activeElement === erste) { ev.preventDefault(); letzte.focus(); }
      else if (!ev.shiftKey && document.activeElement === letzte) { ev.preventDefault(); erste.focus(); }
    });
  };

  /* ======================================================================== *
   * ZEICHNEN
   * ======================================================================== */

  let gebunden = false;
  let beobachtet = false;

  const zeichne = (): void => {
    const wurzel = document.getElementById(WURZEL);
    if (!wurzel) return;

    const reiter = Register?.menueband?.reiter?.() || [];
    if (!reiter.length) {
      /* Ohne Register kein Band. Es zu verstecken ist richtiger, als eine
         leere Leiste stehen zu lassen, die Platz kostet und nichts kann. */
      wurzel.hidden = true;
      wurzel.replaceChildren();
      return;
    }

    /* ÜBER EINER STARTANSICHT GANZ WEG (E219).
       Der Grund steht schon zwei Absätze weiter oben, bei `zugeklappt`:
       „Ein Menüband über einer Startansicht kann ohnehin fast nichts —
       Einfügen und Zeichnen brauchen eine Seite, in die geschrieben wird."
       Zugeklappt bleiben davon trotzdem sechs Reiter und ein Pfeil stehen,
       also sieben anklickbare Dinge, die alle dasselbe sagen: nicht jetzt.
       Die ruhige Fassung nimmt den Gedanken zu Ende. Sobald eine Seite
       offen ist, ist das Band wieder da — zugeklappt, wie bisher. */
    /* E219 IST HIER ZURÜCKGENOMMEN (E236).
       Der Absatz darüber hat recht, solange die Leiste UNTER der Kopfzeile
       sass: „sieben anklickbare Dinge, die alle dasselbe sagen: nicht
       jetzt." Der Fehler war aber nicht die Leiste, sondern ihr Inhalt —
       drei ihrer sechs Reiter schreiben in eine Seite und können ohne
       eine gar nichts.

       Genau das steht jetzt im Register (`BRAUCHT_SEITE`), und damit
       räumt sich die Leiste selbst auf: ohne offene Seite bleiben die
       Reiter, die etwas können. `reiter()` zeigt nur, was belegt ist —
       aus sechs Reitern werden drei, statt aus einer Leiste keine.

       Und sie soll bleiben, weil Redur sie ganz oben haben will, wie an
       einem Rechner: „ganz oben so wie MacBook … aber es sollte nicht so
       viel Platz nehmen." Zugeklappt sind das 30 px. */
    void seiteOffen;
    wurzel.hidden = false;

    let gewaehlt = reiterJetzt();
    if (!reiter.some((r: any) => r.id === gewaehlt)) gewaehlt = String(reiter[0].id);
    const zu = zugeklappt();
    wurzel.classList.toggle('ist-zu', zu);

    wurzel.replaceChildren();

    /* ── die Reiterzeile ── */
    const zeile = document.createElement('div');
    zeile.className = 'mb-reiter';

    /* DIE `tablist` IST NICHT MEHR DIE GANZE ZEILE (E272 Phase G).
       In der Zeile stehen inzwischen Dinge, die keine Reiter SIND: die
       Marke, der Knopf „Datei", Suche, KI, Konto, der Klapp-Pfeil. Eine
       `role="tablist"` verspricht einem Vorleseprogramm, dass ihre Kinder
       Reiter sind — „Datei" darin wäre entweder eine Lüge (`role="tab"`
       für etwas, das eine Fläche öffnet) oder ein namenloses Fremdstück.

       Die Reiter bekommen deshalb ihren eigenen Kasten. Das kostet eine
       Zeile CSS und macht die Zusage wieder wahr; `test272 §13` misst
       nach, dass in der Liste NUR Reiter stehen. */
    const reiterliste = document.createElement('div');
    reiterliste.className = 'mb-tabs';
    reiterliste.setAttribute('role', 'tablist');
    reiterliste.setAttribute('aria-label', 'Menüband');

    /* HIER STAND DIE MARKE GANZ LINKS (E272 bis E456).
       Ein Buchstabe des Arbeitsbereichs, „damit die Zeile links nicht kahl
       beginnt". Seit dem Studio (E440) trägt die Zeile darüber die eine
       Marke der App — „R redion STUDIO" — und Redur will genau eine:
       „nur das sollte hier bleiben." Ein zweites Zeichen darunter war ab
       da kein Schmuck mehr, sondern ein zweites Logo. `test384` hält
       fest, dass es weg bleibt. */

    /* ── „DATEI" — KEIN REITER, SONDERN EINE FLÄCHE (E272 Phase G) ──────
       Die acht Reiter zeigen Befehle für das, was offen ist. „Datei"
       wirkt auf das Ganze: sichern, drucken, weitergeben, Konto,
       Einstellungen. Es öffnet deshalb eine eigene Fläche (`backstage.ts`)
       und trägt `aria-haspopup="dialog"` statt `role="tab"`.

       AB 761 PX. Am Telefon führt derselbe Weg über das R-Blatt
       (`App.arbeitsbereich()` → Sichern, Importieren, Papierkorb,
       Tastenkürzel, Einstellungen) — E240 hat die Zeile dort bewusst
       schlank gehalten, und eine zweite Vollfläche daneben wäre die
       Doppelung, die E206 gerade weggeräumt hat. Versteckt wird er im
       Stil, nicht hier: `matchMedia` beim Zeichnen hiesse, dass ein
       gedrehtes Tablet den Knopf erst beim nächsten Neuzeichnen bekommt. */
    const datei = document.createElement('button');
    datei.type = 'button';
    datei.id = 'mb-datei';
    datei.className = 'mb-datei';
    datei.textContent = 'Datei';
    datei.setAttribute('aria-haspopup', 'dialog');
    datei.title = 'Datei — sichern, drucken, weitergeben, Einstellungen';
    datei.addEventListener('click', () => {
      try { (window as any).Backstage?.schalten?.(); }
      catch { /* ohne die Fläche bleibt die Zeile stehen */ }
    });
    zeile.appendChild(datei);

    reiter.forEach((r: any) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mb-reiter-knopf';
      b.dataset['mbReiter'] = String(r.id);
      b.setAttribute('role', 'tab');
      const aktiv = r.id === gewaehlt;
      b.setAttribute('aria-selected', aktiv ? 'true' : 'false');
      /* Nur der gewählte Reiter ist in der Tabulator-Reihenfolge; innerhalb
         der Zeile wandert man mit den Pfeiltasten. So ist das Band mit einem
         Tabulatorschlag hinter sich gelassen und nicht mit sechsen. */
      b.tabIndex = aktiv ? 0 : -1;
      if (aktiv) b.classList.add('ist-an');
      zeichenIn(b, String(r.zeichen || 'dots'));
      const t = document.createElement('span');
      t.textContent = String(r.name || r.id);
      b.appendChild(t);
      reiterliste.appendChild(b);
    });
    zeile.appendChild(reiterliste);

    const platz = document.createElement('div');
    platz.className = 'mb-platz';
    zeile.appendChild(platz);

    /* ── RECHTS: SUCHE, KI, KONTO (E236) ────────────────────────────────
       Sie standen am Telefon in einer eigenen schwebenden Leiste unten —
       zusammen mit „Neu". Seit die Navigation dort hinwandert (Teil 5),
       wären das zwei Leisten übereinander am unteren Rand.

       An einem Rechner steht genau das rechts in der Menüleiste, und dort
       stehen sie jetzt auch: gleiche Zeile, gleiche Höhe, kein zusätzlicher
       Platz. „Neu" braucht hier keinen Knopf mehr — es steht als „+ Neu"
       im Regal und im Mehr-Blatt.

       DIE ZIELE SIND DIESELBEN FUNKTIONEN wie vorher, nicht neue: ein
       zweiter Weg zu einer zweiten Suche wäre der Fehler, den E160 schon
       einmal gemacht hat. */
    const RECHTS: [string, string, string, () => void][] = [
      ['mb-suche', 'search',  'Suchen (Strg + P)',
        () => { try { App.suche(); } catch { /* ohne Suche bleibt die Leiste */ } }],
      ['mb-ki',    'sparkle', 'Lokale KI (Strg + J)',
        () => { try { App.kiPanel(true); } catch { /* ohne KI bleibt die Leiste */ } }],
      /* NICHT `PWA.schubladeAuf` — das ist die Seitenleiste des Rechners,
         und E38 hat den Weg am Telefon ausdrücklich davon weggeführt.
         `App.arbeitsbereich()` trifft die Unterscheidung an EINER Stelle:
         am Telefon das R-Blatt, am Rechner die Schublade. */
      ['mb-konto', '',        'Arbeitsbereich',
        () => { try { App.arbeitsbereich(); }
                catch { /* ohne Arbeitsbereich bleibt die Leiste */ } }]
    ];
    const rechts = document.createElement('div');
    rechts.className = 'mb-rechts';

    /* ── DIE GLOCKE (E251, zweiter Anlauf) ──────────────────────────────
       Der erste Anlauf hängte sie an die Kopfzeile — und drei Wächter
       wurden rot: test40 führt die sechs Seitenknöpfe NAMENTLICH, test248
       zählt das Budget, test245 mass die Suche aus der Mitte gerückt.
       Die Wächter hatten recht, nicht die Glocke: die Kopfzeile gehört
       der SEITE (Teilen, Verlauf, Sperren — alles Dinge über dieses eine
       Dokument), Ungelesenes gehört der APP. Die App-Zeile ist die
       Menüleiste, und rechts stehen dort schon Suche, KI und
       Arbeitsbereich — die Glocke ist deren vierter Nachbar.

       SIE ERSCHEINT ERST MIT UNGELESENEM. Eine dauerhaft sichtbare stumme
       Glocke sagte nichts und kostete einen Platz in einer Zeile, die am
       Telefon ohnehin rollt. Ohne Meldungen ist sie `hidden` — dasselbe
       Prinzip wie der Punkt an der unteren Leiste des Telefons. Die Zahl
       ist nur Bild; die Wörter stehen im aria-label (§38). */
    const glocke = document.createElement('button');
    glocke.type = 'button';
    glocke.id = 'mb-glocke';
    glocke.className = 'mb-rechts-knopf';
    glocke.hidden = true;
    glocke.setAttribute('aria-label', 'Posteingang');
    glocke.title = 'Posteingang';
    const glockenZeichen = document.createElement('span');
    glockenZeichen.dataset['sym'] = 'bell';
    glocke.appendChild(glockenZeichen);
    const glockenZahl = document.createElement('b');
    glockenZahl.className = 'glocke-zahl';
    glockenZahl.hidden = true;
    glockenZahl.setAttribute('aria-hidden', 'true');
    glocke.appendChild(glockenZahl);
    glocke.addEventListener('click', () => {
      try { Ansichten.posteingang(); }
      catch { /* ohne Posteingang bleibt die Leiste */ }
    });
    rechts.appendChild(glocke);

    /* ── WAS GERADE LÄUFT (L103 Punkt 3, E322) ──────────────────────────
       Dieselbe Regel wie bei der Glocke daneben: ohne offene Aufträge ist
       der Knopf `hidden`. Ein dauerhaftes „0 Aufträge" wäre die Anzeige,
       die immer anzeigt und deshalb nicht gelesen wird.

       Die Zahl erscheint erst ab ZWEI. Bei einem einzigen Auftrag sagt das
       kreisende Zeichen schon alles, und eine „1" daneben ist Schmuck. */
    const arbeit = document.createElement('button');
    arbeit.type = 'button';
    arbeit.id = 'mb-auftraege';
    arbeit.className = 'mb-rechts-knopf mb-arbeit';
    arbeit.hidden = true;
    arbeit.setAttribute('aria-label', 'Was gerade läuft');
    arbeit.title = 'Was gerade läuft';
    const arbeitZeichen = document.createElement('i');
    arbeitZeichen.className = 'arb-kreisel';
    arbeitZeichen.setAttribute('aria-hidden', 'true');
    arbeit.appendChild(arbeitZeichen);
    const arbeitZahl = document.createElement('b');
    arbeitZahl.className = 'glocke-zahl';
    arbeitZahl.hidden = true;
    arbeitZahl.setAttribute('aria-hidden', 'true');
    arbeit.appendChild(arbeitZahl);
    arbeit.addEventListener('click', () => {
      try { AuftragsAnzeige.oeffnen(); } catch { /* ohne Anzeige bleibt die Leiste */ }
    });
    rechts.appendChild(arbeit);
    /* Anmelden ist gegen Mehrfachaufruf gesichert; auffrischen muss NACH
       jedem Aufbau sein, weil die Leiste bei jedem Reiterwechsel neu
       entsteht und ein frisch gebauter Knopf sonst bis zum nächsten
       Schritt versteckt bliebe. */
    try { AuftragsAnzeige.anmelden(); void AuftragsAnzeige.knopfFrisch(); }
    catch { /* ohne Auftragsmaschine bleibt die Leiste */ }

    RECHTS.forEach(([id, zeichen, titel, tun]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.id = id;
      b.className = 'mb-rechts-knopf' + (zeichen ? '' : ' mb-konto');
      b.title = titel;
      b.setAttribute('aria-label', titel);
      if (zeichen) {
        const z = document.createElement('span');
        z.dataset['sym'] = zeichen;
        b.appendChild(z);
      } else {
        /* DAS KONTO TRÄGT EIN SYMBOL, KEINEN BUCHSTABEN (E456).
           Bis dahin stand hier das Zeichen des Arbeitsbereichs in einem
           farbigen Kreis — und wirkte neben der Studio-Marke wie ein
           zweites Logo. Redur: „nur das sollte hier bleiben." Das Zeichen
           des Arbeitsbereichs lebt weiter in der Schublade und in den
           Einstellungen (`.ws-icon`, `kopfzeileAuffrischen`); hier steht
           das Symbol für „Arbeitsbereich", so wie Suche und KI ihre
           Symbole tragen. Der Statuspunkt darunter bleibt. */
        const z = document.createElement('span');
        z.dataset['sym'] = 'workspace';
        b.appendChild(z);
        /* DER STATUSPUNKT (E251). Wer angemeldet ist, sieht am
           Arbeitsbereichs-Knopf, ob der Abgleich gut steht, läuft oder
           hakt — abgemeldet ist der Punkt weg, denn „kein Konto" ist kein
           Zustand, den man überwachen müsste. Der Punkt ist nur Farbe;
           die Wörter stehen im title und aria-label (§38). Gemalt wird er
           von `wolkeFrisch` unten, aus dem gemerkten Stand — die Leiste
           wird bei jedem Reiterwechsel neu gebaut, und ein Punkt, der
           dann bis zur nächsten Änderung leer bliebe, wäre ein Anzeiger,
           der meistens lügt. */
        const punkt = document.createElement('i');
        punkt.className = 'wolke-punkt';
        punkt.hidden = true;
        punkt.setAttribute('aria-hidden', 'true');
        b.appendChild(punkt);
      }
      b.addEventListener('click', tun);
      rechts.appendChild(b);
    });
    zeile.appendChild(rechts);
    /* Der Klapp-Pfeil kommt gleich darunter und gehört DAZU: beide kleben
       am rechten Rand, und zwei Dinge, die an derselben Stelle kleben,
       liegen übereinander. Im ersten Bild war der Pfeil deshalb weg.
       Er steht als erstes in der Gruppe, weil er zur Reiterzeile gehört
       und nicht zu Suche/KI/Konto. */

    /* ── auf- und zuklappen ── */
    const klapp = document.createElement('button');
    klapp.type = 'button';
    klapp.className = 'mb-klapp';
    klapp.dataset['band'] = '__klapp';
    klapp.setAttribute('aria-expanded', zu ? 'false' : 'true');
    klapp.title = zu ? 'Menüband aufklappen' : 'Menüband zuklappen';
    klapp.setAttribute('aria-label', klapp.title);
    /* EIN WORT, WENN SONST NICHTS MEHR DASTEHT (Auftrag 01).
       Sobald die ruhige Fassung die Reiter ausblendet, steht der Pfeil
       allein an der rechten Kante — und ein Pfeil ohne Nachbarn ist eine
       Zierde, die niemand anklickt. Beim Hinsehen war das die ernsteste
       der drei Fragen aus §55. Also bekommt er ein Wort.

       Es steht IMMER im Baum und wird nur vom CSS gezeigt, genau in dem
       Zustand, in dem die Reiter fehlen — kein zweiter Zustand in
       JavaScript, den man mitpflegen müsste. Solange die Reiter dastehen,
       wäre das Wort Doppelung und bleibt weg. */
    const wort = document.createElement('span');
    wort.className = 'mb-klapp-wort';
    wort.textContent = 'Werkzeuge';
    klapp.appendChild(wort);
    const pfeil = document.createElement('span');
    /* Immer dasselbe Zeichen; die Richtung macht das CSS über eine Drehung
       (`#menueband:not(.ist-zu) .mb-klapp svg`). Zwei verschiedene Zeichen
       hätten beim Umschalten gesprungen statt sich zu drehen. */
    pfeil.dataset['sym'] = 'chevronD';
    klapp.appendChild(pfeil);
    rechts.insertBefore(klapp, rechts.firstChild);

    wurzel.appendChild(zeile);

    /* ── das Band ── */
    const band = document.createElement('div');
    band.className = 'mb-band';
    band.setAttribute('role', 'tabpanel');
    band.setAttribute('aria-label', 'Menüband: ' + gewaehlt);
    if (!zu) bandFuellen(band, gewaehlt);
    wurzel.appendChild(band);

    /* Die Zeichen nachtragen — dasselbe `fuelle`, das die Seitenleiste nutzt.
       (Der erste Entwurf rief `Marken.schicht`; das ist die MARKIERUNGS-
        schicht über einer PDF-Seite und hat mit Symbolen nichts zu tun.
        Der Typprüfer hat es gefunden: sie nimmt vier Argumente.) */
    if (Register?.symbole?.fuelle) {
      try { Register.symbole.fuelle(wurzel); } catch { /* ohne Zeichen bleibt der Name */ }
    }

    /* DER GEWÄHLTE REITER MUSS IM BILD SEIN.

       Am Telefon passen vier von sechs Reitern nebeneinander. Wählt man
       „Elektro", zeigt das Band dessen Knöpfe — aber der Reiter selbst stand
       ausserhalb, und man sah nicht, wo man ist. Auf dem Bild wirkte
       „Zeichnen" wie der aktive.

       ES STEHT HIER UNTEN UND NICHT WEITER OBEN. Der erste Versuch rollte
       direkt nach dem Bauen der Zeile — da sind die Zeichen noch nicht
       eingesetzt, die Knöpfe also schmaler, und gemessen blieb der Reiter
       bei x=379 von 390 stehen. Erst nach `symbole.fuelle` hat die Zeile
       ihre wirkliche Breite.

       `inline:'nearest'` und nicht `'center'`: rollt nur, wenn nötig.
       `block:'nearest'` verhindert, dass die SEITE mitrollt — ohne das
       springt der Text darunter, was hier niemand will. */
    const an = wurzel.querySelector<HTMLElement>('.mb-reiter-knopf.ist-an');
    if (an) {
      try { an.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }
      catch { /* alte Browser rollen eben nicht */ }
    }

    if (!gebunden) { binde(wurzel); gebunden = true; }

    /* WIE HOCH IST DER FESTE KOPF? — für alle, die darunter mittig stehen.

       Die Randleiste mit dem Inhaltsverzeichnis (`#rand-toc`) hängt an
       `main` und steht dort auf `top:50%`. Solange über dem Text nur die
       54 px hohe Kopfzeile standen, ging das auf. Jetzt stehen 138 px
       Menüband dazwischen, und bei vierzehn Überschriften ragte die
       Randleiste bis y=156 hinauf — 36 px INS BAND HINEIN. Auf dem Bild
       liefen die Striche über die Knopfreihe (§55.1).

       Die Höhe ist nicht auszurechnen: das Band hat eine oder zwei Zeilen,
       ist zugeklappt oder offen, und am Telefon ganz anders. Wer sie
       braucht, soll sie erfragen können — deshalb steht sie hier als
       Zahl an `main`, gesetzt von dem, der sie kennt. */
    const heim = wurzel.parentElement;
    /* MIT der Kopfzeile, nicht nur mit der eigenen Unterkante (E257).
       Seit E236 steht die Menüleiste ÜBER der Kopfzeile — wer hier nur
       sich selbst misst, sagt der Randleiste (#rand-toc), der feste Kopf
       ende bei 35 px. Bei einer Seite mit vielen Überschriften wuchs die
       Leiste bis an diese Marke und lag über den Seitenknöpfen: zweimal
       fing sie im vollen Lauf den Klick auf „Seitenoptionen" ab, je nach
       dem, wie viele Überschriften beim Messen schon gezeichnet waren.
       Mit der Kopfzeile in der Rechnung kann die Oberkante der Leiste
       rechnerisch nie mehr über ihr liegen. */
    if (heim) {
      const kopf = document.getElementById('topbar');
      const bis = Math.max(wurzel.offsetTop + wurzel.offsetHeight,
        kopf ? kopf.offsetTop + kopf.offsetHeight : 0);
      heim.style.setProperty('--inhalt-oben', bis + 'px');
    }

    /* Frisch gebaute Knöpfe kennen ihren Stand noch nicht. */
    glockeFrisch();
    wolkeFrisch();

    /* Und zuletzt: was passt in eine Zeile? Eine offene Mehr-Lade gehört
       zum vorigen Reiter und wäre nach dem Wechsel eine Liste zu etwas,
       das nicht mehr gilt. */
    ladeSchliessen();
    ueberlaufBald();
    if (!beobachtet) { beobachten(); beobachtet = true; }
  };

  /* ======================================================================== *
   * ANFASSEN
   * ======================================================================== */

  /**
   * Ein Lauscher an der WURZEL und nicht an den Knöpfen.
   *
   * Das Band wird bei jedem Reiterwechsel neu gebaut. Lauscher an den
   * Knöpfen müssten jedes Mal neu gesetzt werden, und der erste vergessene
   * Fall wäre ein Knopf, der still nichts tut — genau das ist im
   * Elektro-Dialog passiert, als fünf Knöpfe aus der Reihe umzogen (E209).
   */
  const binde = (wurzel: HTMLElement): void => {
    wurzel.addEventListener('click', ereignis => {
      const ziel = ereignis.target instanceof Element ? ereignis.target : null;
      if (!ziel) return;

      const reiterKnopf = ziel.closest<HTMLElement>('[data-mb-reiter]');
      if (reiterKnopf) {
        const id = reiterKnopf.dataset['mbReiter'] || 'start';
        /* EIN KLICK AUF DEN SCHON GEWÄHLTEN REITER KLAPPT NICHT ZU.
           Der erste Entwurf tat genau das — „der schnellste Weg zu mehr
           Platz". In der Prüfung fiel auf, was das heisst: wer auf „Start"
           klickt, während „Start" offen ist, sieht plötzlich gar nichts
           mehr. Das ist keine Abkürzung, das ist eine Überraschung. Zum
           Zuklappen gibt es den Pfeil rechts, und er sagt auch, was er tut.

           Ist das Band zu, klappt jeder Reiterklick es auf — das ist die
           erwartete Richtung: man will dorthin, nicht weg. */
        setzeMeta(merkeReiter, id);
        if (amTelefon()) { zeichne(); fluechtig(false); return; }
        if (zugeklappt()) setzeMeta(merkeZu(), false);
        zeichne();
        return;
      }

      const band = ziel.closest<HTMLElement>('[data-band]');
      if (!band) return;
      const id = band.dataset['band'] || '';
      if (id === '__mehr') { ladeOeffnen(); return; }
      if (id === '__klapp') {
        if (amTelefon()) {
          const w = document.getElementById(WURZEL);
          fluechtig(!w?.classList.contains('ist-zu'));
          return;
        }
        setzeMeta(merkeZu(), !zugeklappt());
        sichtbarSetzen(!zugeklappt()); zeichne(); return;
      }

      const eintrag = Register?.menueband?.eines?.(id);
      if (!eintrag) return;
      /* Kam der Klick aus der Mehr-Lade, geht sie zu — eine Lade, die nach
         der Wahl offen bleibt, verdeckt genau das, was man gerade ausgelöst
         hat. Vor `tun()`, damit ein Dialog darüber liegt und nicht darunter. */
      if (ziel.closest('#mb-mehr-lade')) ladeSchliessen();
      /* Ein Eintrag, der wirft, darf nicht das ganze Band mitreissen. Die
         Meldung gehört dem Menschen, nicht nur der Konsole. */
      try { eintrag.tun(); }
      catch (fehler: unknown) {
        const satz = fehler instanceof Error ? fehler.message : String(fehler);
        if (typeof UI !== 'undefined' && typeof UI.toast === 'function') UI.toast(satz);
      }
      /* Die Wahl ist getroffen — am Telefon schliesst das Menü. Bisher
         sah das nur so aus: „Journal" öffnete eine Seite, damit wechselte
         `merkeZu()` auf den Seiten-Schlüssel, und DER stand noch auf zu.
         Ein Befehl, der die Ansicht nicht wechselt („Fett"), liess das
         Band stehen. Jetzt ist es eine Regel und kein Zufall. */
      if (amTelefon()) fluechtig(true);
    });

    /* EIN TIPP DANEBEN SCHLIESST — nur am Telefon, wo das offene Band ein
       Menü ist. Das deckt auch jeden Bereichswechsel ab: die fünf Wege
       unten liegen ausserhalb der Wurzel. `pointerdown` statt `click`,
       damit das Band schon zu ist, wenn der Tipp sein eigentliches Ziel
       erreicht — sonst tippte man erst das Band weg und dann noch einmal. */
    document.addEventListener('pointerdown', ereignis => {
      if (!amTelefon()) return;
      const w = document.getElementById(WURZEL);
      if (!w || w.classList.contains('ist-zu')) return;
      const ziel = ereignis.target instanceof Element ? ereignis.target : null;
      if (ziel && w.contains(ziel)) return;
      fluechtig(true);
    });

    /* Pfeiltasten in der Reiterzeile (§38). */
    wurzel.addEventListener('keydown', ereignis => {
      const ziel = ereignis.target instanceof Element ? ereignis.target : null;
      const jetzt = ziel?.closest<HTMLElement>('[data-mb-reiter]');
      if (!jetzt) return;
      const alle = [...wurzel.querySelectorAll<HTMLElement>('[data-mb-reiter]')];
      const i = alle.indexOf(jetzt);
      if (i < 0) return;
      let zu = -1;
      if (ereignis.key === 'ArrowRight') zu = (i + 1) % alle.length;
      if (ereignis.key === 'ArrowLeft') zu = (i - 1 + alle.length) % alle.length;
      if (ereignis.key === 'Home') zu = 0;
      if (ereignis.key === 'End') zu = alle.length - 1;
      if (zu < 0) return;
      ereignis.preventDefault();
      const ziel2 = alle[zu];
      if (!ziel2) return;
      setzeMeta(merkeReiter, ziel2.dataset['mbReiter'] || 'start');
      if (amTelefon()) { zeichne(); fluechtig(false); }
      else { setzeMeta(merkeZu(), false); zeichne(); }
      document.querySelector<HTMLElement>(
        `#${WURZEL} [data-mb-reiter="${ziel2.dataset['mbReiter']}"]`)?.focus();
    });
  };

  /* ======================================================================== *
   * GLOCKE UND STATUSPUNKT AUFFRISCHEN (E251)
   * ------------------------------------------------------------------------
   * Beide Funktionen suchen ihre Knöpfe bei JEDEM Aufruf neu. Die Leiste
   * wird bei jedem Reiterwechsel neu gebaut; ein beim ersten Zeichnen
   * gefangener Verweis zeigte danach auf einen Knopf, der nicht mehr im
   * Baum hängt — die Glocke sähe frisch aus und wäre es nicht.
   * Die Horcher stehen in `start()` und werden EINMAL gesetzt: ein Horcher
   * je Zeichnen wäre nach zehn Reiterwechseln ein Chor.
   * ======================================================================== */

  const glockeFrisch = (): void => {
    const glocke = document.getElementById('mb-glocke');
    if (!glocke) return;
    let offen = 0;
    try {
      offen = (typeof Werkzeuge !== 'undefined' && Werkzeuge.meldungen
        ? Werkzeuge.meldungen() : [])
        .filter((m: any) => !m.gelesen).length;
    } catch { /* ohne Posteingang bleibt die Glocke versteckt */ }
    glocke.hidden = !offen;
    const zahl = glocke.querySelector<HTMLElement>('.glocke-zahl');
    if (zahl) {
      zahl.textContent = offen > 99 ? '99+' : String(offen);
      zahl.hidden = !offen;
    }
    const wort = offen ? 'Posteingang, ' + offen + ' ungelesen' : 'Posteingang';
    glocke.setAttribute('aria-label', wort);
    glocke.title = wort;
  };

  /* Der letzte gemeldete Wolke-Stand. `Wolke.beiAenderung` ruft nur bei
     ÄNDERUNGEN — ein frisch gebauter Punkt muss den Stand von davor kennen,
     sonst zeigt er bis zum nächsten Takt nichts. */
  let wolkeStand: any = null;

  const wolkeFrisch = (): void => {
    const konto = document.getElementById('mb-konto');
    const punkt = konto?.querySelector<HTMLElement>('.wolke-punkt');
    if (!konto || !punkt) return;
    const z = wolkeStand;
    if (!z || !z.angemeldet) {
      punkt.hidden = true;
      konto.title = 'Arbeitsbereich';
      konto.setAttribute('aria-label', 'Arbeitsbereich');
      return;
    }
    const schlecht = String(z.fehler || z.fehlerDateien || '');
    punkt.hidden = false;
    /* VIER Zustände seit L76. Es waren drei, und mit offener Frage zeigte
       der Punkt „ist-gut" und „Letzter Abgleich 14:03" — beides von vor
       dem Einspielen, beides nicht mehr wahr. Der Abgleich steht ja.
       Die Farbe allein sagt es nicht (§38): der Grund steht im `title` und
       im `aria-label`, wie bei den anderen drei auch. */
    punkt.className = 'wolke-punkt ' +
      (schlecht ? 'ist-fehler' : z.frage ? 'ist-frage'
                : z.laeuft ? 'ist-laeuft' : 'ist-gut');
    const name = z.konto && z.konto.name ? String(z.konto.name) : 'angemeldet';
    const stand = schlecht ? 'Abgleichfehler: ' + schlecht
      : z.frage ? 'Abgleich wartet auf eine Entscheidung (Mehr → Wolke)'
      : z.laeuft ? 'Abgleich läuft'
      : z.letzter ? 'Letzter Abgleich ' + String(z.letzter).slice(11, 16)
      : 'noch kein Abgleich';
    /* Der Knopf öffnet weiterhin den Arbeitsbereich — das aria-label darf
       nichts anderes versprechen. Der Wolke-Stand steht DAHINTER, als
       Auskunft, nicht als Ziel; der Weg zum Wolke-Dialog steht unter
       „Mehr → Wolke". */
    konto.title = 'Arbeitsbereich · ' + name + ' · ' + stand;
    konto.setAttribute('aria-label', 'Arbeitsbereich — Konto ' + name + ', ' + stand);
  };

  /* ======================================================================== *
   * START
   * ======================================================================== */

  /* Der Ort ändert sich, ohne dass jemand es meldet.
     Es gibt kein Ereignis „Sonderansicht verlassen" — `seiteGeoeffnet` feuert
     beim Öffnen einer Seite, aber nicht beim Wechsel zurück auf „Heute".
     Ein Beobachter am `#page` sieht beides.

     Er zeichnet NUR bei einem Wechsel und nicht bei jeder Blockänderung:
     `App.zeichneSeite()` läuft bei jedem Tastendruck, und ein Menüband, das
     dabei jedesmal neu gebaut wird, kostet ohne Gegenwert. */
  let warOffen: boolean | null = null;
  const beobachte = (): void => {
    const wo = document.getElementById('page');
    if (!wo || typeof MutationObserver === 'undefined') return;
    warOffen = seiteOffen();
    /* `subtree` ist nötig, seit der Test am `#title` hängt: der liegt IN
       `#page`, und ein Wechsel der Kindliste allein sieht ihn nicht immer. */
    new MutationObserver(() => {
      const jetzt = seiteOffen();
      if (jetzt === warOffen) return;
      warOffen = jetzt;
      zeichne();
    }).observe(wo, { attributes: true, attributeFilter: ['class'],
                     childList: true, subtree: true });
  };

  const start = (): void => {
    zeichne();
    beobachte();
    /* NEU ZEICHNEN, WENN EINE ZEICHENFLÄCHE AUFTAUCHT ODER GEHT (E212).

       Die Werkzeuge im Reiter „Zeichnen" hängen an `Zeichenziel.da()`.
       Ohne diesen Horcher wären sie beim ersten Öffnen einer Seite mit
       Blatt unsichtbar und kämen erst beim nächsten Reiterwechsel — ein
       Knopf, der da ist und nicht erscheint, ist derselbe Fehler wie einer,
       der erscheint und nichts tut. */
    if (typeof Zeichenziel !== 'undefined' && typeof Zeichenziel.horche === 'function') {
      try { Zeichenziel.horche(() => zeichne()); } catch { /* dann eben nicht */ }
    }

    /* NEU ZEICHNEN, WENN DAS VOLLBILD KIPPT (E283 / L85 Punkt 1).

       Der Vollbild-Knopf zeigt seinen Zustand über `an()`, und `an()` wird
       nur beim Zeichnen gelesen. Ohne diesen Horcher stimmte er genau so
       lange, wie NIEMAND das Vollbild anders verlässt als über ihn — und
       Escape ist der übliche Weg. Der Knopf stünde danach auf „AN" über
       einem Fenster mit Adressleiste.

       `fullscreenchange` feuert bei BEIDEN Richtungen und auch dann, wenn
       der Browser das Vollbild von sich aus beendet (Wechsel des Reiters,
       ein Videoabspieler, der es an sich zieht). Genau deshalb hängt der
       Horcher hier und nicht in `App.vollbild()`. */
    document.addEventListener('fullscreenchange', () => zeichne());
    /* Nach dem Laden der Ablage noch einmal.

       GEMESSEN GREIFT DAS NICHT: `Menueband.start()` steht in `App.start()`
       nach den Bereichen, und da ist IndexedDB längst offen — der gemerkte
       Reiter kommt schon beim ersten Zeichnen zurück. Beim Gegenbeweis zu
       test247 §7 blieb der Punkt grün, als diese Zeile entfernt wurde.

       Sie bleibt trotzdem: `zeichne()` ist wiederholbar und kostet nichts,
       und wenn die Startreihenfolge sich einmal ändert, ist der Unterschied
       ein Band, das den gemerkten Reiter vergisst — ein Fehler, den niemand
       meldet, weil er wie eine Vorgabe aussieht. */
    /* DER NAME WAR FALSCH (E362, gefunden beim Bau von L102 Punkt 4): hier
       stand die Zeichenkette 'ablageGeladen', gemeldet wird aber
       `ARTEN.ablageGeladen` = 'ablage.geladen'. Der Zuhörer hat also nie
       etwas gehört — genau der Fehler, vor dem arten.ts warnt, und genau
       der, den der Absatz darüber „von niemandem gemeldet" nennt. Jetzt der
       Name aus dem Register, und mit `nachreichen`: ist die Ablage beim
       Anmelden längst geladen, kommt die Meldung sofort — der Grund, warum
       die Zeile „gemessen nicht griff", war nicht nur die Reihenfolge. */
    if (typeof Ereignisse !== 'undefined' && typeof Ereignisse.horche === 'function') {
      const name = typeof ARTEN !== 'undefined' && ARTEN.ablageGeladen ? ARTEN.ablageGeladen : 'ablage.geladen';
      try { Ereignisse.horche(name, () => zeichne(), { nachreichen: true }); } catch { /* dann eben nicht */ }
    }

    /* GLOCKE UND STATUSPUNKT (E251) — die Horcher, einmal.
       `redion:meldungen` feuert bei jeder neuen, gelesenen oder geleerten
       Meldung (werkzeuge.ts schickt es); der Ereignisbus statt eines
       direkten Aufrufs, weil ein Bereich die Schale nicht kennen darf
       (Regel 1). `Wolke.beiAenderung` meldet Anmelden, Abgleich und
       Fehler — der Stand wird gemerkt, gemalt wird aus `wolkeFrisch`. */
    document.addEventListener('redion:meldungen', glockeFrisch);
    glockeFrisch();
    if (typeof Wolke !== 'undefined' && typeof Wolke.beiAenderung === 'function') {
      try {
        Wolke.beiAenderung((z: any) => { wolkeStand = z; wolkeFrisch(); });
      } catch { /* ohne Wolke bleibt der Punkt versteckt */ }
    }
  };

  /** Von aussen: das Band auf einen Reiter stellen. */
  const zeige = (reiter: string): void => {
    sichtbarSetzen(true);
    setzeMeta(merkeReiter, reiter);
    if (amTelefon()) { zeichne(); fluechtig(false); return; }
    setzeMeta(merkeZu(), false);
    zeichne();
  };

  const sichtbarSetzen = (an: boolean): void => {
    document.body.dataset.studioTools = an ? 'offen' : 'zu';
    const knopf = document.getElementById('studio-tools');
    const name = an ? 'Werkzeuge ausblenden' : 'Werkzeuge einblenden';
    knopf?.setAttribute('aria-expanded', String(an));
    knopf?.setAttribute('aria-label', name);
    if (knopf) knopf.title = name;
  };
  const aufklappen = (): void => { zeige(reiterJetzt()); };
  const schliessen = (): void => { fluechtig(true); sichtbarSetzen(false); };

  return { start, zeichne, zeige, aufklappen, schliessen, WURZEL };
})();

(window as any).Menueband = Menueband;
