"use strict";
/* ============================================================================
 * bereiche/spreadsheet/ansicht.ts — der Tabellenblock, wie man ihn sieht
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/spreadsheet/ansicht.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/bereiche/spreadsheet/ansicht.js`. Wer das .js
 * bearbeitet, verliert die Änderung beim nächsten Bauen;
 * `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Das Rechnen steht in `core/spreadsheet/engine.ts` und weiss nichts von
 * einem Bildschirm. Diese Datei weiss nichts vom Rechnen. Das ist die Regel
 * aus `AUFGABEN.md` A4, und hier ist sie von Anfang an eingehalten statt
 * hinterher hergestellt.
 *
 * Die Gestaltungsentscheidungen stehen in `DESIGN-TABELLE.md`, die Farben
 * und Masse in `quell/schale/stil/tabelle.css`.
 *
 * ─── WARUM NICHT ALLE ZELLEN GEZEICHNET WERDEN ──────────────────────────────
 *
 * Ein Blatt hat 50 × 20 Zellen, das wären tausend Knoten — noch tragbar.
 * Sobald jemand eine CSV mit fünftausend Zeilen einliest, sind es
 * hunderttausend, und der Tab steht. Gezeichnet wird deshalb nur, was zu
 * sehen ist: die Zeilen liegen absolut in einem Platzhalter voller Höhe, und
 * beim Rollen wird neu bestückt.
 *
 * ─── DIE DREI STELLEN, AN DENEN SO ETWAS SCHIEFGEHT ─────────────────────────
 *
 * **1 · Der Rahmen der Auswahl darf das Raster nicht verschieben.** Deshalb
 * liegt er innen (`inset box-shadow`). Ein `border` wäre zwei Pixel breit und
 * die ganze Tabelle zuckte bei jedem Klick.
 *
 * **2 · Beim Neuzeichnen darf die Auswahl nicht verlorengehen.** Sie steht
 * deshalb hier oben und nicht im DOM: das DOM wird weggeworfen und neu
 * gebaut, die Auswahl überlebt es.
 *
 * **3 · Das blosse ÖFFNEN einer Seite darf nichts speichern.** Der erste
 * Entwurf rief nach dem ersten Rechnen `Store.updateBlock` — und damit stand
 * beim reinen Ansehen einer Seite ein neues `edited`-Datum in der Ablage, ein
 * Schritt im Rückgängig-Stapel und ein Schreibvorgang. Beim Abgleich ist das
 * kein Schönheitsfehler: das Gerät, auf dem jemand nur nachgesehen hat, gilt
 * als das neuere und überschreibt die echte Änderung vom anderen. Gespeichert
 * wird deshalb nur, wenn sich der Inhalt wirklich unterscheidet.
 *
 * SPRACHE. Namen englisch, Erklärungen deutsch — E27. Neu, also TypeScript
 * von Anfang an — E28.
 * ==========================================================================*/
const SpreadsheetView = (() => {
    const kern = () => (typeof Spreadsheet !== 'undefined') ? Spreadsheet : null;
    const refs = () => (typeof CellRefs !== 'undefined') ? CellRefs : null;
    const ZH = 32; /* Zeilenhöhe — muss zu --tbl-zh in tabelle.css passen */
    const ZH_HANDY = 40;
    const SB = 110; /* Spaltenbreite, Vorgabe — --tbl-sb */
    const SB_MIN = 48;
    const PUFFER = 6; /* Zeilen über und unter dem Sichtfenster */
    const amTelefon = () => typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(max-width: 760px)').matches : false;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    /* ==========================================================================
     * ANZEIGE EINES WERTES
     * ------------------------------------------------------------------------
     * Was in der Zelle steht, ist nicht immer, was gespeichert ist: eine Zahl
     * bekommt Schweizer Schreibweise, ein Datum ein Format, ein Fehlerwert
     * bleibt wie er ist.
     *
     * Wahrheitswerte heissen WAHR und FALSCH und nicht ✅ und ☐ wie in der
     * Datenbank. In einer Tabelle sind sie ein Wert, mit dem gerechnet wird —
     * ein Kästchen sähe aus wie etwas zum Anklicken.
     * ========================================================================*/
    const zeigeWert = (wert, format) => {
        if (wert === null || wert === undefined || wert === '')
            return '';
        if (typeof wert === 'string' && wert.startsWith('#'))
            return wert; /* Fehlerwert */
        if (wert instanceof Date)
            return wert.toLocaleDateString('de-CH');
        if (typeof wert === 'boolean')
            return wert ? 'WAHR' : 'FALSCH';
        if (typeof wert === 'number') {
            if (!isFinite(wert))
                return '#ZAHL!';
            const art = format && format.art;
            const stellen = format && typeof format.stellen === 'number' ? format.stellen : undefined;
            if (art === 'prozent')
                return (wert * 100).toLocaleString('de-CH', {
                    minimumFractionDigits: stellen ?? 0, maximumFractionDigits: stellen ?? 1
                }) + ' %';
            if (art === 'waehrung')
                return wert.toLocaleString('de-CH', {
                    minimumFractionDigits: stellen ?? 2, maximumFractionDigits: stellen ?? 2
                }) +
                    ' ' + ((format && format.waehrung) || 'CHF');
            if (stellen !== undefined)
                return wert.toLocaleString('de-CH', {
                    minimumFractionDigits: stellen, maximumFractionDigits: stellen
                });
            return wert.toLocaleString('de-CH', { maximumFractionDigits: 10 });
        }
        return String(wert);
    };
    const istFehler = (wert) => typeof wert === 'string' && /^#[A-Z/0-9]+[!?]$/.test(wert);
    /* ==========================================================================
     * WAS EIN FEHLERWERT HEISST
     * ------------------------------------------------------------------------
     * `#NAME?` allein ist keine Meldung, sondern ein Rätsel — und zwar eines,
     * das Tabellenprogramme seit dreissig Jahren aufgeben. Die Fusszeile
     * beantwortet die drei Fragen, die eine Meldung beantworten muss: was ist
     * passiert, warum zählt es, was kann ich tun.
     * ========================================================================*/
    const FEHLER_TEXT = {
        '#NAME?': 'Diese Funktion kennt Redion nicht. Tippe = und die ersten Buchstaben — ' +
            'dann steht die richtige Schreibweise da.',
        '#BEZUG!': 'Ein Bezug zeigt ins Leere. Meist wurde die Zeile oder Spalte gelöscht, ' +
            'oder zwei Zellen lesen sich im Kreis.',
        '#WERT!': 'Die Formel liess sich nicht lesen. Meist fehlt eine Klammer oder ein ' +
            'Semikolon zwischen zwei Werten.',
        '#ZAHL!': 'Das Ergebnis ist keine Zahl mehr — zu gross, zu klein, oder die Wurzel ' +
            'aus einer negativen Zahl.'
    };
    const erklaere = (wert) => (typeof wert === 'string' && FEHLER_TEXT[wert]) || '';
    /** Drei Striche als Zeichen für die Ausrichtung — ohne fremdes Symbolpaket. */
    const strichIcon = (art) => {
        const kurz = art === 'links' ? 'x="1"' : art === 'rechts' ? 'x="5"' : 'x="3"';
        return '<svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true" fill="currentColor">' +
            '<rect x="1" y="1" width="12" height="1.6" rx=".8"/>' +
            '<rect ' + kurz + ' y="5.2" width="8" height="1.6" rx=".8"/>' +
            '<rect x="1" y="9.4" width="12" height="1.6" rx=".8"/></svg>';
    };
    /* ==========================================================================
     * DER BLOCK
     * ========================================================================*/
    const zeichne = (block) => {
        const K = kern(), R = refs();
        const w = document.createElement('div');
        w.className = 'tbl';
        if (!K || !R) {
            w.textContent = 'Der Tabellenkern ist nicht geladen.';
            return w;
        }
        /* --- Die Daten ------------------------------------------------------
           Ein Block ohne Mappe bekommt eine. Nichts wird überschrieben: gibt es
           schon eine, wird sie benutzt, wie sie ist. */
        const hatteMappe = !!(block.mappe && block.mappe.blaetter && block.mappe.blaetter.length);
        if (!hatteMappe)
            block.mappe = K.neueMappe(block.text || 'Tabelle');
        const blatt = block.mappe.blaetter[0];
        if (!blatt.breiten)
            blatt.breiten = {};
        /* Die Auswahl lebt hier, nicht im DOM — sie überlebt jedes Neuzeichnen. */
        let gewaehlt = 'A1';
        let anker = 'A1'; /* für die Bereichsauswahl */
        /* Beim Ziehen am Anfasser: wohin der Zeiger gerade zeigt. Nur das —
           ob überhaupt gezogen wird, steht in den Zuhörern, die `beimZiehen`
           auf- und wieder abbaut, und nicht noch einmal in einer Fahne hier. */
        let fuellZiel = null;
        let zirkel = [];
        /* ----------------------------------------------------------------------
         * WIE BREIT EINE SPALTE AM TELEFON SEIN MUSS — gemessen, nicht geschätzt.
         *
         * `redion-mobile-ux` nennt zwei Zahlen, und zusammen ergeben sie eine
         * dritte: mindestens 88 px breit, und mindestens 16 px Schrift. Bei
         * 16 px ist `1’450.00 CHF` neunundneunzig Pixel breit, dazu zweimal
         * sieben Pixel Innenabstand und eine Linie — macht 114. In eine 110 px
         * breite Spalte passt das nicht, und der Block tat genau das Richtige:
         * er schrieb `###`.
         *
         * Auf dem Bildschirm hiess das: in einem Haushaltsplan stand bei JEDEM
         * Betrag `###`. Die Regel war richtig, die Spalte zu schmal.
         *
         * Also 128 px am Telefon statt 110, und die Untergrenze 112 statt 88 —
         * 88 stammt aus einer Welt mit kleinerer Schrift. Die Folge ist, dass
         * zweieinhalb Spalten ins Bild passen statt drei. Das ist richtig so:
         * waagerecht rollen ist am Telefon vorgesehen, `###` nicht.
         * --------------------------------------------------------------------*/
        const handy = amTelefon();
        const vorgabeBreite = handy ? 128 : SB;
        const minBreite = handy ? 112 : SB_MIN;
        const breiteVon = (s) => Math.max(minBreite, Number(blatt.breiten[s]) || vorgabeBreite);
        const zh = handy ? ZH_HANDY : ZH;
        /* ======================================================================
         * SPEICHERN — und zwar nur, wenn es etwas zu speichern gibt
         * --------------------------------------------------------------------
         * Siehe Punkt 3 im Kopf. `geaendert` steht bewusst NICHT im Vergleich:
         * sonst unterschiede sich der Stand bei jedem Rechnen von sich selbst,
         * und die Prüfung wäre keine.
         * ====================================================================*/
        const standVon = () => JSON.stringify(blatt);
        let letzterStand = hatteMappe ? standVon() : '';
        const sichere = () => {
            const jetzt = standVon();
            if (jetzt === letzterStand)
                return false;
            letzterStand = jetzt;
            block.mappe.geaendert = new Date().toISOString();
            if (typeof Store !== 'undefined' && Store.updateBlock)
                Store.updateBlock(block.id, { mappe: block.mappe });
            return true;
        };
        /* --- Bearbeitungszeile ---------------------------------------------- */
        const kopf = document.createElement('div');
        kopf.className = 'tbl-kopf';
        const adresse = document.createElement('div');
        adresse.className = 'tbl-adresse';
        const fx = document.createElement('div');
        fx.className = 'tbl-fx';
        fx.textContent = 'fx';
        /* IN WELCHER FORMELWELT MAN STEHT. Redion hat zwei: die der Datenbank
           (`prop("Preis") * 1.081`) und die der Tabelle (`=B2*1,081`). Beide
           laufen durch dieselbe Maschine, sehen aber verschieden aus — und wer
           das nicht weiss, tippt hier die falsche und versteht die Meldung
           nicht. Ein Wort im Titel kostet nichts und beantwortet es. */
        fx.title = 'Tabellenformel — beginnt mit =, Zellen heissen A1, Bereiche A1:A9';
        const eingabe = document.createElement('input');
        eingabe.className = 'tbl-eingabe';
        eingabe.setAttribute('aria-label', 'Inhalt der ausgewählten Zelle');
        eingabe.placeholder = 'Wert oder =Formel';
        const werkzeuge = document.createElement('div');
        werkzeuge.className = 'tbl-werkzeuge';
        /* ------------------------------------------------------------------
         * ELF KNÖPFE AM RECHNER, ZWEI AM TELEFON.
         *
         * Gemessen, nicht geschätzt: 48 px Adresse + 30 px fx + elf Knöpfe zu
         * 34 px sind über 410 px. Auf einem iPhone mit 390 px hiess das
         * zweierlei, und beides war schlimm — das Eingabefeld wurde auf null
         * Pixel gequetscht, und die letzten Knöpfe standen ausserhalb des
         * Bildes. Darunter der ⋯-Knopf, also der ganze Weg zu „Als Excel
         * speichern". Eine Funktion, die man am Telefon nicht erreicht, gibt es
         * am Telefon nicht.
         *
         * Die Lösung ist nicht, dieselben elf Knöpfe kleiner zu machen — 38 px
         * sind unter den 44, die ein Finger braucht. Sondern: **Format** öffnet
         * ein Blatt von unten mit allem, was gestaltet, und **⋯** den Rest. Zwei
         * grosse Ziele statt elf kleiner.
         * ----------------------------------------------------------------*/
        const AUSRICHTUNG = '<button data-a="links" title="Linksbündig" aria-label="Linksbündig">' + strichIcon('links') + '</button>' +
            '<button data-a="mitte" title="Zentriert" aria-label="Zentriert">' + strichIcon('mitte') + '</button>' +
            '<button data-a="rechts" title="Rechtsbündig" aria-label="Rechtsbündig">' + strichIcon('rechts') + '</button>';
        werkzeuge.innerHTML = handy
            ? '<button data-a="format" title="Format" aria-label="Format">Format</button>' +
                '<button data-a="mehr" title="Mehr" aria-label="Weitere Befehle">⋯</button>'
            : '<button data-a="fett" title="Fett" aria-label="Fett"><b>F</b></button>' +
                '<button data-a="kursiv" title="Kursiv" aria-label="Kursiv"><i>K</i></button>' +
                /* DREI STRICHE STATT ⟨ ≡ ⟩. Die Klammern sahen auf dem Bildschirm aus
                   wie „(" und „)" — ein Knopf, dessen Bedeutung man raten muss, ist
                   keiner. Drei Linien unterschiedlicher Länge sind das Zeichen für
                   Ausrichtung in jedem Programm, das es gibt. */
                AUSRICHTUNG +
                '<button data-a="waehrung" title="Währung" aria-label="Währung">CHF</button>' +
                '<button data-a="prozent" title="Prozent" aria-label="Prozent">%</button>' +
                '<button data-a="zeile" title="Zeile anhängen" aria-label="Zeile anhängen">+↓</button>' +
                '<button data-a="spalte" title="Spalte anhängen" aria-label="Spalte anhängen">+→</button>' +
                '<button data-a="mehr" title="Mehr" aria-label="Weitere Befehle">⋯</button>';
        kopf.append(adresse, fx, eingabe, werkzeuge);
        /* --- Rollfeld -------------------------------------------------------- */
        const feld = document.createElement('div');
        feld.className = 'tbl-feld';
        feld.tabIndex = 0;
        feld.setAttribute('role', 'grid');
        feld.setAttribute('aria-label', 'Tabelle ' + (blatt.name || ''));
        const spaltenKopf = document.createElement('div');
        spaltenKopf.className = 'tbl-spalten';
        const koerper = document.createElement('div');
        koerper.className = 'tbl-koerper';
        feld.append(spaltenKopf, koerper);
        const fuss = document.createElement('div');
        fuss.className = 'tbl-fuss';
        w.append(kopf, feld, fuss);
        /* ======================================================================
         * ZEICHNEN
         * ====================================================================*/
        const bereich = () => {
            const a = R.lies(anker), b = R.lies(gewaehlt);
            if (!a || !b)
                return null;
            return {
                vonZ: Math.min(a.zeile, b.zeile), bisZ: Math.max(a.zeile, b.zeile),
                vonS: Math.min(a.spalte, b.spalte), bisS: Math.max(a.spalte, b.spalte)
            };
        };
        /* Was der Anfasser gerade überstreicht — die Vorschau beim Ziehen. */
        const fuellBereich = () => {
            const b = bereich();
            if (!b || !fuellZiel)
                return null;
            if (fuellZiel.z > b.bisZ)
                return { vonZ: b.bisZ + 1, bisZ: fuellZiel.z, vonS: b.vonS, bisS: b.bisS };
            if (fuellZiel.s > b.bisS)
                return { vonZ: b.vonZ, bisZ: b.bisZ, vonS: b.bisS + 1, bisS: fuellZiel.s };
            return null;
        };
        const spaltenZeichnen = () => {
            const b = bereich();
            spaltenKopf.innerHTML = '';
            const ecke = document.createElement('div');
            ecke.className = 'tbl-ecke';
            ecke.title = 'Alles auswählen';
            spaltenKopf.appendChild(ecke);
            for (let s = 0; s < blatt.spalten; s++) {
                const d = document.createElement('div');
                d.className = 'tbl-sp' + (b && s >= b.vonS && s <= b.bisS ? ' aktiv' : '');
                d.style.flex = '0 0 ' + breiteVon(s) + 'px';
                d.dataset.s = String(s);
                d.textContent = R.spalteZuText(s);
                /* Der Griff zum Breiterziehen — 6 px am rechten Rand. */
                const griff = document.createElement('span');
                griff.className = 'tbl-griff';
                griff.dataset.griff = String(s);
                d.appendChild(griff);
                spaltenKopf.appendChild(d);
            }
        };
        /* Nur das Sichtbare. Der Platzhalter trägt die volle Höhe, damit die
           Rolleiste stimmt. */
        const koerperZeichnen = () => {
            koerper.style.height = (blatt.zeilen * zh) + 'px';
            const oben = Math.max(0, Math.floor(feld.scrollTop / zh) - PUFFER);
            const sichtbar = Math.ceil(feld.clientHeight / zh) + PUFFER * 2;
            const unten = Math.min(blatt.zeilen, oben + sichtbar);
            const b = bereich();
            const fb = fuellBereich();
            koerper.innerHTML = '';
            for (let z = oben; z < unten; z++) {
                const zeile = document.createElement('div');
                zeile.className = 'tbl-zeile';
                zeile.style.top = (z * zh) + 'px';
                const nr = document.createElement('div');
                nr.className = 'tbl-zn' + (b && z >= b.vonZ && z <= b.bisZ ? ' aktiv' : '');
                nr.dataset.z = String(z);
                nr.textContent = String(z + 1);
                zeile.appendChild(nr);
                for (let s = 0; s < blatt.spalten; s++) {
                    const a = R.schreibe(z, s);
                    const zelle = blatt.zellen[a];
                    const wert = zelle ? zelle.wert : '';
                    const stil = (zelle && zelle.stil) || {};
                    const d = document.createElement('div');
                    const klassen = ['tbl-z'];
                    const imB = !!(b && z >= b.vonZ && z <= b.bisZ && s >= b.vonS && s <= b.bisS);
                    /* Der Anfasser sitzt an der letzten Zelle des Bereichs, nicht an
                       der aktiven — sonst zöge man von der falschen Ecke. */
                    const istEcke = !!(b && z === b.bisZ && s === b.bisS);
                    if (a === gewaehlt)
                        klassen.push('gewaehlt');
                    else if (imB)
                        klassen.push('imBereich');
                    if (istEcke)
                        klassen.push('ecke');
                    if (fb && z >= fb.vonZ && z <= fb.bisZ && s >= fb.vonS && s <= fb.bisS)
                        klassen.push('fuellvorschau');
                    if (zelle && zelle.formel)
                        klassen.push('formel');
                    if (istFehler(wert))
                        klassen.push('fehler');
                    else if (typeof wert === 'number')
                        klassen.push('zahl');
                    if (stil.fett)
                        klassen.push('fett');
                    if (stil.kursiv)
                        klassen.push('kursiv');
                    if (stil.ausrichtung)
                        klassen.push(stil.ausrichtung);
                    d.className = klassen.join(' ');
                    d.style.flex = '0 0 ' + breiteVon(s) + 'px';
                    const voll = zeigeWert(wert, stil.format);
                    const passend = passendMachen(voll, wert, s, stil);
                    if (passend.klasse)
                        d.className += passend.klasse;
                    if (passend.titel)
                        d.title = passend.titel;
                    d.dataset.a = a;
                    d.setAttribute('role', 'gridcell');
                    /* Vorgelesen wird IMMER der volle Wert — die Kürzung ist eine
                       Sache des Platzes auf dem Bildschirm, nicht des Inhalts. */
                    d.setAttribute('aria-label', a + (wert === '' ? ' leer' : ': ' + voll));
                    d.textContent = passend.text;
                    zeile.appendChild(d);
                }
                koerper.appendChild(zeile);
            }
        };
        /* ----------------------------------------------------------------------
         * ### STATT EINER FALSCHEN ZAHL
         * ----------------------------------------------------------------------
         * DER GEFÄHRLICHSTE FEHLER, DEN DIESER BLOCK HATTE — und er sah aus wie
         * ein Schönheitsfehler. Eine Zahl steht rechtsbündig; passt sie nicht in
         * die Spalte, schneidet der Browser sie VORNE ab. Aus `634.2166666667`
         * wurde auf dem Bildschirm `34.2166666667`, und das ist keine
         * abgeschnittene Zahl mehr, sondern **eine andere Zahl**. Sie sieht
         * vollständig aus, sie ist plausibel, und niemand rechnet nach.
         *
         * Excel macht seit dreissig Jahren `####` daraus, und zwar genau
         * deswegen. Lieber sichtbar nichts zeigen als unsichtbar etwas Falsches.
         *
         * Gemessen wird in EINEM Durchgang nach dem Bauen: erst alle Knoten
         * setzen, dann alle lesen. Abwechselnd schreiben und messen zwänge den
         * Browser zu einem Umbruch je Zelle.
         * --------------------------------------------------------------------*/
        /* ----------------------------------------------------------------------
         * PASST DIE ZAHL IN DIE SPALTE?
         * ----------------------------------------------------------------------
         * DER GEFÄHRLICHSTE FEHLER, DEN DIESER BLOCK HATTE — und er sah aus wie
         * ein Schönheitsfehler. Eine Zahl steht rechtsbündig; passt sie nicht in
         * die Spalte, schneidet der Browser sie VORNE ab. Aus `634.2166666667`
         * wurde auf dem Bildschirm `34.2166666667`, und das ist keine
         * abgeschnittene Zahl mehr, sondern **eine andere Zahl**. Sie sieht
         * vollständig aus, sie ist plausibel, und niemand rechnet nach.
         *
         * ─── DER ERSTE VERSUCH MASS DAS FALSCHE ────────────────────────────────
         *
         * Er verglich `scrollWidth` mit `clientWidth`. Gemessen ergab das für
         * eine 21-stellige Zahl in einer 109 px breiten Zelle: 109 gegen 109.
         * Der Grund ist Flexbox — der Text ist ein anonymes Flex-Element und
         * wird GESTAUCHT statt überzustehen. Es gibt also gar keinen
         * überstehenden Inhalt zu messen; abgeschnitten wird trotzdem.
         *
         * Eine Prüfung, die immer „passt schon" sagt, ist keine Prüfung.
         *
         * ─── JETZT WIRD DIE SCHRIFT GEMESSEN ───────────────────────────────────
         *
         * Über eine Leinwand: `measureText` braucht kein DOM, erzwingt keinen
         * Umbruch und kostet nichts. Und es geschieht BEIM BAUEN der Zelle statt
         * hinterher — kein zweiter Durchgang, kein Zurücklesen des Layouts.
         *
         * Passt die Zahl nicht, wird sie erst KÜRZER GESCHRIEBEN, nicht sofort
         * verworfen: `98.1166666667` ist keine Zahl, die nicht passt, sondern
         * eine, die zu genau dasteht. Erst wenn nicht einmal die Vorkommastellen
         * hineingehen, steht `###` da — so wie in Excel, und aus demselben
         * Grund: der Mensch will die Grössenordnung sehen.
         * --------------------------------------------------------------------*/
        const STUFEN = [6, 4, 2, 1, 0];
        let messer = null;
        let schriftBasis = '14px sans-serif';
        /* Die Kurzschreibweise von CSS verlangt diese Reihenfolge: Stil, Gewicht,
           Grösse, Familie. Anders herum nimmt die Leinwand die Angabe nicht an
           und misst still mit der Vorgabeschrift weiter. */
        const schriftFuer = (stil) => ((stil && stil.kursiv) ? 'italic ' : '') +
            ((stil && stil.fett) ? '700 ' : '') + schriftBasis;
        const breiteDesTextes = (text, stil) => {
            if (!messer) {
                const leinwand = document.createElement('canvas');
                messer = leinwand.getContext('2d');
            }
            if (!messer)
                return 0;
            messer.font = schriftFuer(stil);
            return messer.measureText(text).width;
        };
        /**
         * Der Text, der wirklich in der Zelle stehen darf.
         * Gibt zusätzlich zurück, ob gekürzt oder ganz aufgegeben wurde.
         */
        const passendMachen = (text, wert, spalte, stil) => {
            const platz = breiteVon(spalte) - 15; /* 2 × 7 px Innenabstand + Linie */
            /* Zwei Pixel Luft: `measureText` kennt `tabular-nums` nicht und liegt
               um Haaresbreite daneben. Lieber einmal zu viel anzeigen als eine
               Zahl grundlos verstümmeln. */
            if (typeof wert !== 'number' || breiteDesTextes(text, stil) <= platz + 2)
                return { text, klasse: '', titel: '' };
            const voll = text;
            if (!(stil && stil.format && stil.format.art)) {
                for (const stellen of STUFEN) {
                    const kurz = wert.toLocaleString('de-CH', {
                        minimumFractionDigits: 0, maximumFractionDigits: stellen
                    });
                    if (breiteDesTextes(kurz, stil) <= platz + 2)
                        return { text: kurz, klasse: ' gekuerzt', titel: voll };
                }
            }
            return { text: '###', klasse: ' zuEng',
                titel: voll + ' — die Spalte ist zu schmal. Ziehe sie breiter.' };
        };
        const fussZeichnen = () => {
            const b = bereich();
            let zahlen = 0, summe = 0, kleinste = Infinity, groesste = -Infinity;
            if (b) {
                for (let z = b.vonZ; z <= b.bisZ; z++)
                    for (let s = b.vonS; s <= b.bisS; s++) {
                        const zelle = blatt.zellen[R.schreibe(z, s)];
                        if (zelle && typeof zelle.wert === 'number' && isFinite(zelle.wert)) {
                            zahlen++;
                            summe += zelle.wert;
                            if (zelle.wert < kleinste)
                                kleinste = zelle.wert;
                            if (zelle.wert > groesste)
                                groesste = zelle.wert;
                        }
                    }
            }
            const gefuellt = Object.keys(blatt.zellen).length;
            fuss.innerHTML = '';
            const teil = (text, klasse = '') => {
                const s = document.createElement('span');
                if (klasse)
                    s.className = klasse;
                s.innerHTML = text;
                fuss.appendChild(s);
            };
            /* DER LEERE ZUSTAND. Ein Raster ohne einen Wert erklärt sich nicht von
               selbst — wer noch nie eine Formel getippt hat, weiss nicht, dass sie
               mit `=` anfängt. Das steht leise in der Fusszeile und nicht als
               Kasten über dem Raster: ein Kasten müsste weggeklickt werden, und
               beim zweiten Mal ist er nur noch im Weg. */
            if (!gefuellt) {
                teil('Tippe einen Wert — oder <code>=SUMME(A1:A5)</code> für eine Formel.', 'tbl-tipp');
                return;
            }
            const feldNamen = b && (b.vonZ !== b.bisZ || b.vonS !== b.bisS)
                ? R.schreibe(b.vonZ, b.vonS) + ':' + R.schreibe(b.bisZ, b.bisS) : gewaehlt;
            teil('<b>' + esc(feldNamen) + '</b>');
            if (zahlen > 1) {
                teil('Summe <b>' + esc(zeigeWert(summe)) + '</b>');
                teil('Mittel <b>' + esc(zeigeWert(Math.round((summe / zahlen) * 1000) / 1000)) + '</b>');
                teil('Kleinste <b>' + esc(zeigeWert(kleinste)) + '</b>');
                teil('Grösste <b>' + esc(zeigeWert(groesste)) + '</b>');
                teil('Anzahl <b>' + zahlen + '</b>');
            }
            teil(gefuellt + ' gefüllt');
            /* Steht in der gewählten Zelle ein Fehlerwert, sagt die Fusszeile, was
               er heisst. Ohne das steht dort `#NAME?` und sonst nichts. */
            const aktiv = blatt.zellen[gewaehlt];
            const erklaerung = erklaere(aktiv && aktiv.wert);
            if (erklaerung)
                teil('<b>' + esc(aktiv.wert) + '</b> ' + esc(erklaerung), 'tbl-erklaerung');
            if (zirkel.length)
                teil('Zirkelbezug: ' + esc(zirkel.slice(0, 6).join(', ')) +
                    (zirkel.length > 6 ? ' …' : ''), 'tbl-warnung');
        };
        const kopfZeichnen = () => {
            adresse.textContent = gewaehlt;
            if (document.activeElement !== eingabe)
                eingabe.value = K.eingabe(blatt, gewaehlt);
            const zelle = blatt.zellen[gewaehlt];
            const stil = (zelle && zelle.stil) || {};
            werkzeuge.querySelectorAll('button').forEach((b) => {
                const a = b.dataset.a || '';
                const an = (a === 'fett' && stil.fett) || (a === 'kursiv' && stil.kursiv) ||
                    (a === stil.ausrichtung) ||
                    (a === 'waehrung' && stil.format && stil.format.art === 'waehrung') ||
                    (a === 'prozent' && stil.format && stil.format.art === 'prozent');
                b.classList.toggle('on', !!an);
            });
        };
        const alles = () => { spaltenZeichnen(); koerperZeichnen(); fussZeichnen(); kopfZeichnen(); };
        const rechneUndZeichne = () => {
            const erg = K.rechne(blatt);
            zirkel = erg.zirkel || [];
            sichere();
            alles();
        };
        /* ======================================================================
         * BEDIENEN
         * ====================================================================*/
        const waehle = (a, mitAnker = false) => {
            if (!R.gueltig(a))
                return;
            gewaehlt = a;
            if (!mitAnker)
                anker = a;
            alles();
            /* Ins Sichtfeld rollen — sonst wandert die Auswahl aus dem Bild. */
            const l = R.lies(a);
            if (l) {
                const oben = l.zeile * zh, unten = oben + zh;
                if (oben < feld.scrollTop)
                    feld.scrollTop = oben;
                else if (unten > feld.scrollTop + feld.clientHeight)
                    feld.scrollTop = unten - feld.clientHeight;
            }
        };
        const waehleBereich = (vonZ, vonS, bisZ, bisS) => {
            anker = R.schreibe(vonZ, vonS);
            gewaehlt = R.schreibe(bisZ, bisS);
            alles();
        };
        const uebernimm = (text) => {
            K.setze(blatt, gewaehlt, text);
            rechneUndZeichne();
        };
        /* Ein echtes Eingabefeld über der Zelle — kein contenteditable. Es
           verhält sich wie überall sonst: Auswahl, Einfügen, Rückgängig. */
        const bearbeite = (start) => {
            const d = koerper.querySelector('[data-a="' + gewaehlt + '"]');
            if (!d)
                return;
            const feldchen = document.createElement('input');
            feldchen.value = start !== undefined ? start : K.eingabe(blatt, gewaehlt);
            feldchen.setAttribute('aria-label', 'Zelle ' + gewaehlt);
            d.appendChild(feldchen);
            feldchen.focus();
            if (start === undefined)
                feldchen.select();
            /* DIE TASTATUR BELEGT AM TELEFON DEN HALBEN BILDSCHIRM. Steht die
               Zelle in der unteren Hälfte, tippt man ab jetzt blind. Also erst
               einmal in die Mitte rollen — die Browser tun das teils selbst, aber
               nicht alle und nicht zuverlässig, und „teils" reicht hier nicht. */
            if (handy && d.scrollIntoView)
                setTimeout(() => d.scrollIntoView({ block: 'center', inline: 'nearest' }), 50);
            let beendet = false;
            const schliesse = (nehmen, dann) => {
                if (beendet)
                    return;
                beendet = true;
                const wert = feldchen.value;
                feldchen.remove();
                if (nehmen)
                    uebernimm(wert);
                else
                    alles();
                feld.focus();
                if (dann)
                    dann();
            };
            feldchen.addEventListener('keydown', (e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                    e.preventDefault();
                    schliesse(true, () => waehle(R.versetzt(gewaehlt, 1, 0) || gewaehlt));
                }
                else if (e.key === 'Tab') {
                    e.preventDefault();
                    schliesse(true, () => waehle(R.versetzt(gewaehlt, 0, 1) || gewaehlt));
                }
                else if (e.key === 'Escape') {
                    e.preventDefault();
                    schliesse(false);
                }
            });
            feldchen.addEventListener('blur', () => schliesse(true));
        };
        /* ======================================================================
         * ZIEHEN — Auswahl, Ausfüllen, Spaltenbreite
         * --------------------------------------------------------------------
         * ALLE DREI HÄNGEN SICH NUR SOLANGE ANS DOKUMENT, WIE SIE ZIEHEN.
         *
         * Der erste Entwurf hatte ein festes `document.addEventListener('mouseup')`
         * pro Block. `App.zeichneSeite()` läuft aber bei jeder Kleinigkeit —
         * Häkchen setzen, Block aufklappen, Farbe wechseln — und jedes Mal
         * entstand ein Zuhörer mehr, der nie wieder ging. Nach einer Stunde
         * Arbeit an einer Seite hingen Hunderte daran. Nichts stürzt dabei ab;
         * die App wird nur langsam, und niemand weiss wovon.
         * ====================================================================*/
        const beimZiehen = (bewegen, fertig) => {
            const auf = (e) => { bewegen(e); };
            const ab = () => {
                document.removeEventListener('mousemove', auf);
                document.removeEventListener('mouseup', ab);
                fertig();
            };
            document.addEventListener('mousemove', auf);
            document.addEventListener('mouseup', ab);
        };
        const zelleUnter = (e) => {
            const el = document.elementFromPoint(e.clientX, e.clientY);
            const z = el && el.closest ? el.closest('.tbl-z') : null;
            if (!z || !z.dataset.a)
                return null;
            const l = R.lies(z.dataset.a);
            return l ? { z: l.zeile, s: l.spalte } : null;
        };
        /* --- Maus im Raster --------------------------------------------------- */
        koerper.addEventListener('mousedown', (e) => {
            const ziel = e.target;
            const z = ziel.closest('.tbl-z');
            /* Der Anfasser: die unteren rechten 10 × 10 Pixel der Eckzelle. */
            if (z && z.classList.contains('ecke')) {
                const r = z.getBoundingClientRect();
                if (e.clientX > r.right - 10 && e.clientY > r.bottom - 10) {
                    e.preventDefault();
                    fuellZiel = null;
                    beimZiehen((ev) => { const p = zelleUnter(ev); if (p) {
                        fuellZiel = p;
                        koerperZeichnen();
                    } }, () => {
                        const b = bereich(), fz = fuellZiel;
                        fuellZiel = null;
                        if (b && fz && (fz.z > b.bisZ || fz.s > b.bisS)) {
                            K.fuelle(blatt, b, Math.max(fz.z, b.bisZ), Math.max(fz.s, b.bisS));
                            gewaehlt = R.schreibe(Math.max(fz.z, b.bisZ), Math.max(fz.s, b.bisS));
                            rechneUndZeichne();
                        }
                        else
                            alles();
                    });
                    return;
                }
            }
            if (!z || !z.dataset.a)
                return;
            waehle(z.dataset.a, e.shiftKey);
            feld.focus();
            beimZiehen((ev) => { const p = zelleUnter(ev); if (p)
                waehle(R.schreibe(p.z, p.s), true); }, () => { });
        });
        koerper.addEventListener('dblclick', (e) => {
            const z = e.target.closest('.tbl-z');
            if (z && z.dataset.a) {
                waehle(z.dataset.a);
                bearbeite();
            }
        });
        feld.addEventListener('scroll', () => koerperZeichnen());
        /* DER FOKUS DES RASTERS. `DESIGN-TABELLE.md` sagt: der Auswahlrahmen ist
           zugleich der Fokusring. Ein zweiter, 2 px starker Rahmen um das ganze
           Raster stritt sichtbar mit ihm — auf dem Bildschirm zog sich eine
           blaue Linie am rechten Rand entlang, und man wusste nicht, was sie
           bedeutet. Also färbt sich stattdessen der Rahmen des Blocks: leise,
           eindeutig, und ohne dem Auswahlrahmen die Aufmerksamkeit zu nehmen.
    
           Als Klasse und nicht über `:has()`, damit es auch dort gilt, wo `:has`
           fehlt — ein Fokuszeichen, das mancherorts ausfällt, ist keines. */
        feld.addEventListener('focus', () => w.classList.add('imFokus'));
        feld.addEventListener('blur', () => w.classList.remove('imFokus'));
        /* --- Zeilen- und Spaltenköpfe ---------------------------------------- */
        koerper.addEventListener('click', (e) => {
            const nr = e.target.closest('.tbl-zn');
            if (!nr || nr.dataset.z === undefined)
                return;
            const z = Number(nr.dataset.z);
            waehleBereich(z, 0, z, blatt.spalten - 1);
            feld.focus();
        });
        spaltenKopf.addEventListener('mousedown', (e) => {
            const ziel = e.target;
            /* Breite ziehen */
            if (ziel.dataset && ziel.dataset.griff !== undefined) {
                e.preventDefault();
                const s = Number(ziel.dataset.griff);
                const startX = e.clientX;
                const startB = breiteVon(s);
                beimZiehen((ev) => {
                    blatt.breiten[s] = Math.max(SB_MIN, Math.round(startB + (ev.clientX - startX)));
                    spaltenZeichnen();
                    koerperZeichnen();
                }, () => { sichere(); });
                return;
            }
            const sp = ziel.closest('.tbl-sp');
            if (sp && sp.dataset.s !== undefined) {
                const s = Number(sp.dataset.s);
                waehleBereich(0, s, blatt.zeilen - 1, s);
                feld.focus();
                return;
            }
            if (ziel.closest('.tbl-ecke')) {
                waehleBereich(0, 0, blatt.zeilen - 1, blatt.spalten - 1);
                feld.focus();
            }
        });
        /* ======================================================================
         * DAS KONTEXTMENÜ AN DEN KÖPFEN
         * --------------------------------------------------------------------
         * Zeile einfügen und löschen, Spalte einfügen und löschen, sortieren.
         * `Menue.menu` macht daraus am Telefon von allein ein Blatt, das von
         * unten hochfährt — deshalb steht hier keine einzige Zeile für Touch.
         * ====================================================================*/
        const menuFuer = (art, index, x, y) => {
            if (typeof Menue === 'undefined')
                return;
            const was = art === 'zeile' ? 'Zeile' : 'Spalte';
            const name = art === 'zeile' ? String(index + 1) : R.spalteZuText(index);
            const html = `<button data-a="vor"><span class="mi">⬆</span>${was} davor einfügen</button>` +
                `<button data-a="nach"><span class="mi">⬇</span>${was} danach einfügen</button>` +
                '<hr>' +
                (art === 'spalte'
                    ? '<button data-a="auf"><span class="mi">↑</span>Aufsteigend sortieren</button>' +
                        '<button data-a="abv"><span class="mi">↓</span>Absteigend sortieren</button><hr>'
                    : '') +
                `<button data-a="del"><span class="mi">🗑</span>${was} ${esc(name)} löschen</button>`;
            const m = Menue.menu(html, x, y, { titel: was + ' ' + name });
            m.addEventListener('click', (ev) => {
                const b = ev.target.closest('button');
                if (!b || !b.dataset.a)
                    return;
                const a = b.dataset.a;
                m.remove();
                document.querySelectorAll('.menu-grund').forEach(g => g.remove());
                if (a === 'vor' || a === 'nach') {
                    const bei = a === 'vor' ? index : index + 1;
                    if (art === 'zeile')
                        K.zeileEinfuegen(blatt, bei);
                    else
                        K.spalteEinfuegen(blatt, bei);
                }
                else if (a === 'del') {
                    if (art === 'zeile') {
                        if (blatt.zeilen <= 1)
                            return;
                        K.zeileLoeschen(blatt, index);
                    }
                    else {
                        if (blatt.spalten <= 1)
                            return;
                        K.spalteLoeschen(blatt, index);
                        /* Die Breiten rücken mit — sonst trägt die neue Spalte C
                           plötzlich die Breite der gelöschten. */
                        const neu = {};
                        Object.keys(blatt.breiten).forEach(k => {
                            const s = Number(k);
                            if (s < index)
                                neu[s] = blatt.breiten[k];
                            else if (s > index)
                                neu[s - 1] = blatt.breiten[k];
                        });
                        blatt.breiten = neu;
                    }
                }
                else if (a === 'auf' || a === 'abv') {
                    K.sortiere(blatt, index, 0, blatt.zeilen - 1, a === 'auf');
                }
                rechneUndZeichne();
            });
        };
        const aufKopfMenue = (e) => {
            const ziel = e.target;
            const nr = ziel.closest('.tbl-zn');
            const sp = ziel.closest('.tbl-sp');
            if (nr && nr.dataset.z !== undefined) {
                e.preventDefault();
                menuFuer('zeile', Number(nr.dataset.z), e.clientX, e.clientY);
            }
            else if (sp && sp.dataset.s !== undefined) {
                e.preventDefault();
                menuFuer('spalte', Number(sp.dataset.s), e.clientX, e.clientY);
            }
        };
        koerper.addEventListener('contextmenu', aufKopfMenue);
        spaltenKopf.addEventListener('contextmenu', aufKopfMenue);
        /* Am Telefon gibt es keine rechte Maustaste: ein langer Druck tut es. */
        let druckUhr = 0;
        const langerDruck = (e) => {
            const t = e.touches[0];
            if (!t)
                return;
            const x = t.clientX, y = t.clientY;
            const ziel = e.target;
            druckUhr = window.setTimeout(() => {
                const nr = ziel.closest('.tbl-zn');
                const sp = ziel.closest('.tbl-sp');
                if (nr && nr.dataset.z !== undefined)
                    menuFuer('zeile', Number(nr.dataset.z), x, y);
                else if (sp && sp.dataset.s !== undefined)
                    menuFuer('spalte', Number(sp.dataset.s), x, y);
            }, 500);
        };
        const druckWeg = () => { if (druckUhr) {
            clearTimeout(druckUhr);
            druckUhr = 0;
        } };
        [koerper, spaltenKopf].forEach(el => {
            el.addEventListener('touchstart', langerDruck, { passive: true });
            el.addEventListener('touchend', druckWeg);
            el.addEventListener('touchmove', druckWeg, { passive: true });
        });
        /* ======================================================================
         * TASTATUR
         * --------------------------------------------------------------------
         * Die Tabelle ist EIN Tabstopp. Wer hineinspringt, bewegt sich mit den
         * Pfeilen darin — sich durch tausend Zellen zu tabben wäre keine
         * Bedienbarkeit, sondern eine Strafe.
         * ====================================================================*/
        feld.addEventListener('keydown', (e) => {
            const k = e.key;
            const mit = e.shiftKey;
            const strg = e.ctrlKey || e.metaKey;
            const springe = (dz, ds) => {
                const ziel = R.versetzt(gewaehlt, dz, ds);
                if (ziel) {
                    e.preventDefault();
                    waehle(ziel, mit);
                }
            };
            if (strg && (k === 'a' || k === 'A')) {
                e.preventDefault();
                return waehleBereich(0, 0, blatt.zeilen - 1, blatt.spalten - 1);
            }
            if (k === 'ArrowUp')
                return springe(-1, 0);
            if (k === 'ArrowDown')
                return springe(1, 0);
            if (k === 'ArrowLeft')
                return springe(0, -1);
            if (k === 'ArrowRight')
                return springe(0, 1);
            if (k === 'PageDown') {
                e.preventDefault();
                const l = R.lies(gewaehlt);
                return waehle(R.schreibe(Math.min(blatt.zeilen - 1, (l ? l.zeile : 0) + 20), l ? l.spalte : 0), mit);
            }
            if (k === 'PageUp') {
                e.preventDefault();
                const l = R.lies(gewaehlt);
                return waehle(R.schreibe(Math.max(0, (l ? l.zeile : 0) - 20), l ? l.spalte : 0), mit);
            }
            if (k === 'Tab') {
                e.preventDefault();
                return waehle(R.versetzt(gewaehlt, 0, mit ? -1 : 1) || gewaehlt);
            }
            if (k === 'Enter') {
                e.preventDefault();
                return bearbeite();
            }
            if (k === 'F2') {
                e.preventDefault();
                return bearbeite();
            }
            if (k === 'Delete' || k === 'Backspace') {
                e.preventDefault();
                const b = bereich();
                if (b)
                    for (let z = b.vonZ; z <= b.bisZ; z++)
                        for (let s = b.vonS; s <= b.bisS; s++)
                            K.setze(blatt, R.schreibe(z, s), '');
                return rechneUndZeichne();
            }
            if (k === 'Home') {
                e.preventDefault();
                const l = R.lies(gewaehlt);
                return waehle(R.schreibe(strg ? 0 : (l ? l.zeile : 0), 0), mit);
            }
            if (k === 'End') {
                e.preventDefault();
                const l = R.lies(gewaehlt);
                return waehle(R.schreibe(strg ? blatt.zeilen - 1 : (l ? l.zeile : 0), blatt.spalten - 1), mit);
            }
            /* Ein sichtbares Zeichen fängt das Bearbeiten an — wie in Excel. */
            if (k.length === 1 && !strg && !e.altKey) {
                e.preventDefault();
                return bearbeite(k);
            }
        });
        /* --- Kopieren und Einfügen -------------------------------------------
           Über die Zwischenablage als Tabulatortext: so versteht Excel es, und
           Excel versteht uns. Das ist der Weg, auf dem Daten wirklich wandern. */
        feld.addEventListener('copy', (e) => {
            const b = bereich();
            if (!b || !e.clipboardData)
                return;
            const zeilen = [];
            for (let z = b.vonZ; z <= b.bisZ; z++) {
                const sp = [];
                for (let s = b.vonS; s <= b.bisS; s++)
                    sp.push(K.eingabe(blatt, R.schreibe(z, s)));
                zeilen.push(sp.join('\t'));
            }
            e.clipboardData.setData('text/plain', zeilen.join('\n'));
            e.preventDefault();
        });
        feld.addEventListener('paste', (e) => {
            if (!e.clipboardData)
                return;
            const text = e.clipboardData.getData('text/plain');
            if (!text)
                return;
            e.preventDefault();
            const start = R.lies(gewaehlt);
            if (!start)
                return;
            const zeilen = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
            zeilen.forEach((zeile, dz) => {
                zeile.split('\t').forEach((wert, ds) => {
                    /* Das Blatt wächst mit dem, was hineinkommt — sonst fällt der
                       Rest der Zwischenablage lautlos weg. */
                    if (start.zeile + dz + 1 > blatt.zeilen)
                        blatt.zeilen = start.zeile + dz + 1;
                    if (start.spalte + ds + 1 > blatt.spalten)
                        blatt.spalten = start.spalte + ds + 1;
                    K.setze(blatt, R.schreibe(start.zeile + dz, start.spalte + ds), wert);
                });
            });
            rechneUndZeichne();
        });
        /* --- Bearbeitungszeile ------------------------------------------------ */
        eingabe.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                uebernimm(eingabe.value);
                feld.focus();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                kopfZeichnen();
                feld.focus();
            }
        });
        eingabe.addEventListener('blur', () => {
            if (eingabe.value !== K.eingabe(blatt, gewaehlt))
                uebernimm(eingabe.value);
        });
        /* ======================================================================
         * AUSGEBEN
         * --------------------------------------------------------------------
         * Excel und CSV, und beides über das, was `dateien/ausgeben.js` schon
         * kann. Eine zweite ZIP-Schreiberei für xlsx wäre die Sorte Arbeit, die
         * man zweimal pflegt und einmal vergisst.
         * ====================================================================*/
        const alsZeilen = () => {
            const raus = [];
            let letzteVolle = 0;
            for (let z = 0; z < blatt.zeilen; z++) {
                const eine = [];
                let etwasDrin = false;
                for (let s = 0; s < blatt.spalten; s++) {
                    const zelle = blatt.zellen[R.schreibe(z, s)];
                    const wert = zelle ? zelle.wert : '';
                    const t = zeigeWert(wert, zelle && zelle.stil && zelle.stil.format);
                    if (t !== '')
                        etwasDrin = true;
                    eine.push(t);
                }
                raus.push(eine);
                if (etwasDrin)
                    letzteVolle = raus.length;
            }
            /* Ein Blatt hat 50 Zeilen, gefüllt sind meist zehn. Die vierzig leeren
               gehören nicht in die Datei — eine CSV mit vierzig leeren Zeilen am
               Ende sieht in jedem anderen Programm nach einem Fehler aus. */
            return raus.slice(0, letzteVolle);
        };
        const alsCsv = () => alsZeilen().map(z => z.map(v => /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v).join(';')).join('\r\n');
        const gibAus = (art) => {
            const name = (blatt.name || block.mappe.name || 'Tabelle').replace(/[\\/:*?"<>|]/g, '-');
            if (art === 'xlsx') {
                if (typeof Austausch === 'undefined')
                    return;
                Austausch.alsExcel([{ name: blatt.name || 'Tabelle', zeilen: alsZeilen() }], name);
                return;
            }
            /* CSV mit Semikolon und BOM: so öffnet Excel im deutschen Sprachraum
               die Datei richtig, statt alles in eine Spalte zu legen. */
            const blob = new Blob(['﻿' + alsCsv()], { type: 'text/csv;charset=utf-8' });
            if (typeof Austausch !== 'undefined' && Austausch.laden)
                Austausch.laden(blob, name + '.csv');
            else {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = name + '.csv';
                a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 1000);
            }
        };
        /* Eine Stelle für beides: die Leiste am Rechner und das Blatt am
           Telefon rufen dasselbe auf. Zwei Kopien liefen auseinander, und die
           am Telefon wäre die vergessene. */
        const stilSetzen = (a) => {
            const ber = bereich();
            if (!ber)
                return;
            if (a === 'fuellRunter' || a === 'fuellRechts') {
                const runter = a === 'fuellRunter';
                const bisZ = runter ? Math.min(blatt.zeilen - 1, ber.bisZ + 10) : ber.bisZ;
                const bisS = runter ? ber.bisS : Math.min(blatt.spalten - 1, ber.bisS + 5);
                K.fuelle(blatt, ber, bisZ, bisS);
                gewaehlt = R.schreibe(bisZ, bisS);
                return rechneUndZeichne();
            }
            for (let z = ber.vonZ; z <= ber.bisZ; z++)
                for (let s = ber.vonS; s <= ber.bisS; s++) {
                    const adr = R.schreibe(z, s);
                    /* Eine leere Zelle bekommt erst dann einen Eintrag, wenn sie einen
                       Stil trägt — sonst füllt sich das Blatt mit Nichts und die
                       Sicherung wächst ohne Inhalt. */
                    const zelle = blatt.zellen[adr] || (blatt.zellen[adr] = { wert: '' });
                    zelle.stil = zelle.stil || {};
                    if (a === 'fett')
                        zelle.stil.fett = !zelle.stil.fett;
                    if (a === 'kursiv')
                        zelle.stil.kursiv = !zelle.stil.kursiv;
                    if (a === 'links' || a === 'mitte' || a === 'rechts')
                        zelle.stil.ausrichtung = zelle.stil.ausrichtung === a ? undefined : a;
                    if (a === 'waehrung')
                        zelle.stil.format = (zelle.stil.format && zelle.stil.format.art === 'waehrung')
                            ? undefined : { art: 'waehrung', stellen: 2, waehrung: 'CHF' };
                    if (a === 'prozent')
                        zelle.stil.format = (zelle.stil.format && zelle.stil.format.art === 'prozent')
                            ? undefined : { art: 'prozent', stellen: 1 };
                }
            rechneUndZeichne();
        };
        /* --- Werkzeuge -------------------------------------------------------- */
        werkzeuge.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (!b || !b.dataset.a)
                return;
            const a = b.dataset.a;
            if (a === 'zeile') {
                blatt.zeilen += 1;
                rechneUndZeichne();
                return;
            }
            if (a === 'spalte') {
                blatt.spalten += 1;
                rechneUndZeichne();
                return;
            }
            /* DAS FORMAT-BLATT AM TELEFON. Dieselben Befehle wie oben am Rechner,
               nur als Blatt von unten — dort, wo der Daumen hinkommt. `Menue.menu`
               macht daraus von allein eines. */
            if (a === 'format') {
                if (typeof Menue === 'undefined')
                    return;
                const zelle = blatt.zellen[gewaehlt];
                const stil = (zelle && zelle.stil) || {};
                const an = (bedingung) => bedingung ? ' ✓' : '';
                const m = Menue.menu('<button data-a="fett"><span class="mi"><b>F</b></span>Fett' + an(stil.fett) + '</button>' +
                    '<button data-a="kursiv"><span class="mi"><i>K</i></span>Kursiv' + an(stil.kursiv) + '</button><hr>' +
                    '<button data-a="links"><span class="mi">' + strichIcon('links') + '</span>Linksbündig' + an(stil.ausrichtung === 'links') + '</button>' +
                    '<button data-a="mitte"><span class="mi">' + strichIcon('mitte') + '</span>Zentriert' + an(stil.ausrichtung === 'mitte') + '</button>' +
                    '<button data-a="rechts"><span class="mi">' + strichIcon('rechts') + '</span>Rechtsbündig' + an(stil.ausrichtung === 'rechts') + '</button><hr>' +
                    '<button data-a="waehrung"><span class="mi">CHF</span>Währung' + an(stil.format && stil.format.art === 'waehrung') + '</button>' +
                    '<button data-a="prozent"><span class="mi">%</span>Prozent' + an(stil.format && stil.format.art === 'prozent') + '</button><hr>' +
                    '<button data-a="fuellRunter"><span class="mi">⬇</span>Nach unten ausfüllen</button>' +
                    '<button data-a="fuellRechts"><span class="mi">➡</span>Nach rechts ausfüllen</button>', 0, innerHeight, { titel: 'Format · ' + gewaehlt });
                m.addEventListener('click', (ev) => {
                    const t = ev.target.closest('button');
                    if (!t || !t.dataset.a)
                        return;
                    m.remove();
                    document.querySelectorAll('.menu-grund').forEach(g => g.remove());
                    stilSetzen(t.dataset.a);
                });
                return;
            }
            if (a === 'mehr') {
                if (typeof Menue === 'undefined')
                    return;
                const r = b.getBoundingClientRect();
                const m = Menue.menu('<button data-a="xlsx"><span class="mi">📊</span>Als Excel speichern</button>' +
                    '<button data-a="csv"><span class="mi">📄</span>Als CSV speichern</button><hr>' +
                    '<button data-a="zeilen"><span class="mi">⬇</span>20 Zeilen anhängen</button>' +
                    '<button data-a="spalten"><span class="mi">➡</span>5 Spalten anhängen</button><hr>' +
                    '<button data-a="breiten"><span class="mi">↔</span>Spaltenbreiten zurücksetzen</button>', r.left, r.bottom + 4, { titel: 'Tabelle' });
                m.addEventListener('click', (ev) => {
                    const t = ev.target.closest('button');
                    if (!t || !t.dataset.a)
                        return;
                    m.remove();
                    document.querySelectorAll('.menu-grund').forEach(g => g.remove());
                    if (t.dataset.a === 'xlsx')
                        return gibAus('xlsx');
                    if (t.dataset.a === 'csv')
                        return gibAus('csv');
                    if (t.dataset.a === 'zeilen')
                        blatt.zeilen += 20;
                    if (t.dataset.a === 'spalten')
                        blatt.spalten += 5;
                    if (t.dataset.a === 'breiten')
                        blatt.breiten = {};
                    rechneUndZeichne();
                });
                return;
            }
            stilSetzen(a);
        });
        /* --- Erster Aufbau ---------------------------------------------------- */
        rechneUndZeichne();
        /* EINMAL NACH DEM EINHÄNGEN, aus zwei Gründen auf einmal:
           · Erst dann steht die Höhe fest — sonst stünde nur die erste Zeile da.
           · Erst dann steht die wirkliche Schrift fest. Vorher gäbe
             `getComputedStyle` die des Dokuments zurück, und die Breitenmessung
             läge daneben — mal zu grosszügig, mal zu streng. */
        setTimeout(() => {
            const eine = koerper.querySelector('.tbl-z');
            if (eine) {
                const g = getComputedStyle(eine);
                schriftBasis = g.fontSize + ' ' + g.fontFamily;
            }
            koerperZeichnen();
        }, 0);
        return w;
    };
    return { zeichne, zeigeWert, istFehler };
})();
window.SpreadsheetView = SpreadsheetView;
