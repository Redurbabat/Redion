"use strict";
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
 *       <div class="mb-reiter">   Start · Einfügen · Zeichnen · …
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
 * Die Reiterzeile ist eine echte `tablist`: Pfeiltasten wandern, Pos1 und
 * Ende springen, und nur der gewählte Reiter ist in der Tabulator-Reihenfolge.
 * Das ist nicht Zierde — ohne das ist ein Menüband mit sechs Reitern für
 * jeden, der nicht mit der Maus arbeitet, eine Sackgasse.
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
    const merkeZuSeite = 'bandZu'; // der alte Name bleibt der alte Name
    const merkeZuWelt = 'bandZu:welt';
    const meta = (name, standard) => {
        if (typeof Store === 'undefined' || typeof Store.getMeta !== 'function')
            return standard;
        try {
            return Store.getMeta(name, standard);
        }
        catch {
            return standard;
        }
    };
    const setzeMeta = (name, wert) => {
        if (typeof Store === 'undefined' || typeof Store.setMeta !== 'function')
            return;
        try {
            Store.setMeta(name, wert);
        }
        catch { /* ohne Ablage bleibt es bei dieser Sitzung */ }
    };
    /* Der Zustand wird BEIM ZEICHNEN gelesen und nicht beim Laden der Datei.
       Beim Laden ist IndexedDB noch nicht offen, und die gemerkte Wahl käme
       nie zurück — genau das ist der Bibliothek passiert (E207). */
    const reiterJetzt = () => String(meta(merkeReiter, 'start') || 'start');
    /**
     * Zugeklappt oder nicht — und am Telefon ist die VORGABE zugeklappt.
     *
     * Gemessen: Kopfzeile 54 px plus Band 138 px heisst, dass die Seite auf
     * einem 844 px hohen Bildschirm erst bei y=274 anfängt. Ein Drittel des
     * Bildschirms für Knöpfe, bevor ein Wort des eigenen Textes zu sehen ist,
     * ist keine Notiz-App mehr. Die Reiterzeile bleibt stehen; ein Tipp
     * darauf klappt auf, und die Wahl wird gemerkt.
     */
    const amTelefon = () => {
        try {
            return AppEinstellung.amTelefon() === true;
        }
        catch {
            return window.innerWidth <= 760;
        }
    };
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
    const seiteOffen = () => !!document.getElementById('title');
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
    const merkeZu = () => seiteOffen() ? merkeZuSeite : merkeZuWelt;
    const zugeklappt = () => meta(merkeZu(), amTelefon() || !seiteOffen()) === true;
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
    const zeichenIn = (wo, zeichen) => {
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
    const knopf = (e) => {
        const b = document.createElement('button');
        b.type = 'button';
        /* `an()` markiert den Knopf als GEWÄHLT — beim Zeichnen ist das das
           aktive Werkzeug. Ein Werkzeugkasten, in dem nichts markiert ist,
           zwingt zum Ausprobieren; einer, in dem das Falsche markiert ist, ist
           schlimmer. Beides war da, bis E212 den Zustand in den Kern gelegt hat. */
        let gewaehlt = false;
        if (typeof e.an === 'function') {
            try {
                gewaehlt = e.an() === true;
            }
            catch {
                gewaehlt = false;
            }
        }
        b.className = 'mb-knopf' + (e.gross ? ' ist-gross' : '') + (gewaehlt ? ' ist-an' : '');
        if (gewaehlt)
            b.setAttribute('aria-pressed', 'true');
        else if (typeof e.an === 'function')
            b.setAttribute('aria-pressed', 'false');
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
            }
            else {
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
        }
        else {
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
        if (satz) {
            b.title = satz;
            b.setAttribute('aria-label', satz);
        }
        return b;
    };
    /* ======================================================================== *
     * DAS BAND
     * ======================================================================== */
    const gruppeZeichnen = (g) => {
        const kasten = document.createElement('div');
        kasten.className = 'mb-gruppe';
        kasten.dataset['gruppe'] = g.gruppe;
        const reihe = document.createElement('div');
        reihe.className = 'mb-reihe';
        g.eintraege.forEach(e => reihe.appendChild(knopf(e)));
        /* Die Überschrift steht UNTER den Knöpfen, wie in Textprogrammen üblich.
           Sie ist klein und leise: sie ordnet, sie ruft nicht. */
        const titel = document.createElement('div');
        titel.className = 'mb-gruppe-titel';
        titel.textContent = g.gruppe;
        kasten.append(reihe, titel);
        return kasten;
    };
    /** Das Band unter der Reiterzeile neu füllen. */
    const bandFuellen = (band, reiter) => {
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
        gruppen.forEach((g, i) => {
            if (i) {
                const strich = document.createElement('div');
                strich.className = 'mb-trenner';
                strich.setAttribute('aria-hidden', 'true');
                band.appendChild(strich);
            }
            band.appendChild(gruppeZeichnen(g));
        });
    };
    /* ======================================================================== *
     * ZEICHNEN
     * ======================================================================== */
    let gebunden = false;
    const zeichne = () => {
        const wurzel = document.getElementById(WURZEL);
        if (!wurzel)
            return;
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
        if (typeof Ruhig !== 'undefined' && Ruhig.an() && !seiteOffen()) {
            wurzel.hidden = true;
            wurzel.replaceChildren();
            return;
        }
        wurzel.hidden = false;
        let gewaehlt = reiterJetzt();
        if (!reiter.some((r) => r.id === gewaehlt))
            gewaehlt = String(reiter[0].id);
        const zu = zugeklappt();
        wurzel.classList.toggle('ist-zu', zu);
        wurzel.replaceChildren();
        /* ── die Reiterzeile ── */
        const zeile = document.createElement('div');
        zeile.className = 'mb-reiter';
        zeile.setAttribute('role', 'tablist');
        zeile.setAttribute('aria-label', 'Menüband');
        reiter.forEach((r) => {
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
            if (aktiv)
                b.classList.add('ist-an');
            zeichenIn(b, String(r.zeichen || 'dots'));
            const t = document.createElement('span');
            t.textContent = String(r.name || r.id);
            b.appendChild(t);
            zeile.appendChild(b);
        });
        const platz = document.createElement('div');
        platz.className = 'mb-platz';
        zeile.appendChild(platz);
        /* ── auf- und zuklappen ── */
        const klapp = document.createElement('button');
        klapp.type = 'button';
        klapp.className = 'mb-klapp';
        klapp.dataset['band'] = '__klapp';
        klapp.setAttribute('aria-expanded', zu ? 'false' : 'true');
        klapp.title = zu ? 'Menüband aufklappen' : 'Menüband zuklappen';
        klapp.setAttribute('aria-label', klapp.title);
        const pfeil = document.createElement('span');
        /* Immer dasselbe Zeichen; die Richtung macht das CSS über eine Drehung
           (`#menueband:not(.ist-zu) .mb-klapp svg`). Zwei verschiedene Zeichen
           hätten beim Umschalten gesprungen statt sich zu drehen. */
        pfeil.dataset['sym'] = 'chevronD';
        klapp.appendChild(pfeil);
        zeile.appendChild(klapp);
        wurzel.appendChild(zeile);
        /* ── das Band ── */
        const band = document.createElement('div');
        band.className = 'mb-band';
        band.setAttribute('role', 'tabpanel');
        band.setAttribute('aria-label', 'Menüband: ' + gewaehlt);
        if (!zu)
            bandFuellen(band, gewaehlt);
        wurzel.appendChild(band);
        /* Die Zeichen nachtragen — dasselbe `fuelle`, das die Seitenleiste nutzt.
           (Der erste Entwurf rief `Marken.schicht`; das ist die MARKIERUNGS-
            schicht über einer PDF-Seite und hat mit Symbolen nichts zu tun.
            Der Typprüfer hat es gefunden: sie nimmt vier Argumente.) */
        if (Register?.symbole?.fuelle) {
            try {
                Register.symbole.fuelle(wurzel);
            }
            catch { /* ohne Zeichen bleibt der Name */ }
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
        const an = wurzel.querySelector('.mb-reiter-knopf.ist-an');
        if (an) {
            try {
                an.scrollIntoView({ inline: 'nearest', block: 'nearest' });
            }
            catch { /* alte Browser rollen eben nicht */ }
        }
        if (!gebunden) {
            binde(wurzel);
            gebunden = true;
        }
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
        if (heim)
            heim.style.setProperty('--inhalt-oben', (wurzel.offsetTop + wurzel.offsetHeight) + 'px');
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
    const binde = (wurzel) => {
        wurzel.addEventListener('click', ereignis => {
            const ziel = ereignis.target instanceof Element ? ereignis.target : null;
            if (!ziel)
                return;
            const reiterKnopf = ziel.closest('[data-mb-reiter]');
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
                if (zugeklappt())
                    setzeMeta(merkeZu(), false);
                zeichne();
                return;
            }
            const band = ziel.closest('[data-band]');
            if (!band)
                return;
            const id = band.dataset['band'] || '';
            if (id === '__klapp') {
                setzeMeta(merkeZu(), !zugeklappt());
                zeichne();
                return;
            }
            const eintrag = Register?.menueband?.eines?.(id);
            if (!eintrag)
                return;
            /* Ein Eintrag, der wirft, darf nicht das ganze Band mitreissen. Die
               Meldung gehört dem Menschen, nicht nur der Konsole. */
            try {
                eintrag.tun();
            }
            catch (fehler) {
                const satz = fehler instanceof Error ? fehler.message : String(fehler);
                if (typeof UI !== 'undefined' && typeof UI.toast === 'function')
                    UI.toast(satz);
            }
        });
        /* Pfeiltasten in der Reiterzeile (§38). */
        wurzel.addEventListener('keydown', ereignis => {
            const ziel = ereignis.target instanceof Element ? ereignis.target : null;
            const jetzt = ziel?.closest('[data-mb-reiter]');
            if (!jetzt)
                return;
            const alle = [...wurzel.querySelectorAll('[data-mb-reiter]')];
            const i = alle.indexOf(jetzt);
            if (i < 0)
                return;
            let zu = -1;
            if (ereignis.key === 'ArrowRight')
                zu = (i + 1) % alle.length;
            if (ereignis.key === 'ArrowLeft')
                zu = (i - 1 + alle.length) % alle.length;
            if (ereignis.key === 'Home')
                zu = 0;
            if (ereignis.key === 'End')
                zu = alle.length - 1;
            if (zu < 0)
                return;
            ereignis.preventDefault();
            const ziel2 = alle[zu];
            if (!ziel2)
                return;
            setzeMeta(merkeReiter, ziel2.dataset['mbReiter'] || 'start');
            setzeMeta(merkeZu(), false);
            zeichne();
            document.querySelector(`#${WURZEL} [data-mb-reiter="${ziel2.dataset['mbReiter']}"]`)?.focus();
        });
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
    let warOffen = null;
    const beobachte = () => {
        const wo = document.getElementById('page');
        if (!wo || typeof MutationObserver === 'undefined')
            return;
        warOffen = seiteOffen();
        /* `subtree` ist nötig, seit der Test am `#title` hängt: der liegt IN
           `#page`, und ein Wechsel der Kindliste allein sieht ihn nicht immer. */
        new MutationObserver(() => {
            const jetzt = seiteOffen();
            if (jetzt === warOffen)
                return;
            warOffen = jetzt;
            zeichne();
        }).observe(wo, { attributes: true, attributeFilter: ['class'],
            childList: true, subtree: true });
    };
    const start = () => {
        zeichne();
        beobachte();
        /* NEU ZEICHNEN, WENN EINE ZEICHENFLÄCHE AUFTAUCHT ODER GEHT (E212).
    
           Die Werkzeuge im Reiter „Zeichnen" hängen an `Zeichenziel.da()`.
           Ohne diesen Horcher wären sie beim ersten Öffnen einer Seite mit
           Blatt unsichtbar und kämen erst beim nächsten Reiterwechsel — ein
           Knopf, der da ist und nicht erscheint, ist derselbe Fehler wie einer,
           der erscheint und nichts tut. */
        if (typeof Zeichenziel !== 'undefined' && typeof Zeichenziel.horche === 'function') {
            try {
                Zeichenziel.horche(() => zeichne());
            }
            catch { /* dann eben nicht */ }
        }
        /* Nach dem Laden der Ablage noch einmal.
    
           GEMESSEN GREIFT DAS NICHT: `Menueband.start()` steht in `App.start()`
           nach den Bereichen, und da ist IndexedDB längst offen — der gemerkte
           Reiter kommt schon beim ersten Zeichnen zurück. Beim Gegenbeweis zu
           test247 §7 blieb der Punkt grün, als diese Zeile entfernt wurde.
    
           Sie bleibt trotzdem: `zeichne()` ist wiederholbar und kostet nichts,
           und wenn die Startreihenfolge sich einmal ändert, ist der Unterschied
           ein Band, das den gemerkten Reiter vergisst — ein Fehler, den niemand
           meldet, weil er wie eine Vorgabe aussieht. */
        if (typeof Ereignisse !== 'undefined' && typeof Ereignisse.horche === 'function') {
            try {
                Ereignisse.horche('ablageGeladen', () => zeichne());
            }
            catch { /* dann eben nicht */ }
        }
    };
    /** Von aussen: das Band auf einen Reiter stellen. */
    const zeige = (reiter) => {
        setzeMeta(merkeReiter, reiter);
        setzeMeta(merkeZu(), false);
        zeichne();
    };
    return { start, zeichne, zeige, WURZEL };
})();
window.Menueband = Menueband;
