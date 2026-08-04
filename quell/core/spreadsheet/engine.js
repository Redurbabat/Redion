"use strict";
/* ============================================================================
 * core/spreadsheet/engine.ts — der Tabellenkern, ohne Oberfläche
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/spreadsheet/engine.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/core/spreadsheet/engine.js`. Wer das .js bearbeitet,
 * verliert die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mjs`
 * meldet es vorher.
 * ----------------------------------------------------------------------------
 * Rechnen, Abhängigkeiten, Zirkelbezüge. Kein DOM, kein `document` — das ist
 * der Punkt: dieser Kern lässt sich in Node prüfen, in Sekunden statt in
 * Minuten, und ein Fehler darin fällt auf, bevor irgendeine Oberfläche
 * existiert.
 *
 * ─── DIE ENTSCHEIDUNG, DIE ALLES ANDERE TRÄGT ───────────────────────────────
 *
 * Es gibt **keine zweite Formelmaschine.** Eine Tabellenformel wird in die
 * Sprache übersetzt, die `formeln/laufzeit.js` seit jeher spricht:
 *
 *     =SUMME(A1:A3)   →   SUMME(prop("A1"), prop("A2"), prop("A3"))
 *     =A1*2           →   prop("A1")*2
 *
 * `prop()` ist der Zugriff auf eine Spalte einer Datenbankzeile; hier ist es
 * der Zugriff auf eine Zelle. Dieselbe Maschine, ein anderer Nachschlager.
 *
 * Warum nicht die Maschine erweitern: weil dann jede bestehende
 * Datenbankformel durch neuen Code liefe. 158 Funktionen, 262 Einträge, ein
 * Zerleger, an dem heute alles hängt — die Sorte Änderung, deren Schaden man
 * erst Wochen später sieht. Übersetzen kostet dreissig Zeilen und kann
 * nichts kaputtmachen, was es schon gibt.
 *
 * ─── WAS DIESER KERN AN FEHLERWERTEN KANN, UND WAS NICHT ────────────────────
 *
 * `src/core/types/spreadsheet.ts` erlaubt einer Zelle Excel-Fehlerwerte
 * (`CellValue` schliesst `FormulaErrorCode` ein). Erzeugt werden sie hier
 * aber nur, wo dieser Kern es **selbst sicher weiss**:
 *
 *     #BEZUG!   Zirkelbezug · ungültige Adresse · zu grosser Bereich
 *     #NAME?    unbekannte Funktion
 *     #WERT!    die Formel liess sich nicht zerlegen
 *
 * **`#DIV/0!` und `#ZAHL!` gibt es noch nicht**, und das ist mit Absicht
 * hier festgehalten statt vorgetäuscht. Die Laufzeit rechnet abwehrend:
 * `1/0` ergibt 0, `WURZEL(-1)` ergibt 0 — sie *meldet* nichts, also kann
 * dieser Kern nichts weiterreichen. Dafür bräuchte `laufzeit.js` einen
 * `FormulaErrorMode` (der Typ steht schon da), und das ist ein eigener
 * Schritt an einer Datei, die 158 Funktionen trägt.
 *
 * Ein halber Fehlerwert wäre schlimmer als keiner: er sähe aus wie Excel und
 * wäre es an der nächsten Zelle nicht mehr.
 *
 * SPRACHE. Namen englisch, Erklärungen deutsch — E27. Neu und damit von
 * Anfang an TypeScript — E28.
 * ==========================================================================*/
const Spreadsheet = (() => {
    /* --- Was von aussen gebraucht wird -------------------------------------
       `typeof` statt `self.`: `Formula` ist ein gewöhnliches `const` auf
       oberster Ebene und steht nicht auf `window`. Wer hier `self.Formula`
       prüfte, bekäme immer `undefined` und stünde vor einem Kern, der
       wortlos nichts rechnet. */
    const maschine = () => (typeof Formula !== 'undefined') ? Formula : null;
    const adressen = () => (typeof CellRefs !== 'undefined') ? CellRefs : null;
    /* ==========================================================================
     * 1 · EINE FORMEL ÜBERSETZEN
     * --------------------------------------------------------------------------
     * IN EINEM DURCHGANG, und das ist keine Sparsamkeit, sondern die Lehre aus
     * dem ersten Versuch. Der lief dreimal über die Formel: Zeichenketten
     * wegmaskieren, Bereiche ausschreiben, Einzelbezüge ersetzen. Zwei Fehler
     * auf einmal:
     *
     *   · Der dritte Durchgang traf das `A1` **im Ergebnis des zweiten** und
     *     machte aus `prop("A1")` ein `prop("prop("A1")")`.
     *   · Der Platzhalter für eine Zeichenkette sah selbst wie eine Zelle aus
     *     (`TXT0` — drei Buchstaben, eine Ziffer) und wurde mitersetzt.
     *
     * Ein einziger regulärer Ausdruck mit drei Zweigen hat beides nicht: was
     * ein Zweig zurückgibt, wird nicht noch einmal angesehen, und
     * Zeichenketten sind ein Zweig statt eines Verstecks.
     * ========================================================================*/
    /**
     * Drei Zweige, und die Reihenfolge darin entscheidet:
     *
     *   1. Zeichenkette — zuerst, damit `="A1 ist leer"` nichts nachschlägt
     *   2. Bereich `A1:C3` — vor dem Einzelbezug, sonst frisst der das `A1`
     *   3. Einzelbezug `A1`, nicht gefolgt von `(` — das wäre ein Funktionsname
     *
     * Ein Bereich hat **kein Leerzeichen um den Doppelpunkt.** Das ist eine
     * Entscheidung: die Formelsprache kennt auch `bedingung ? a : b`, und dort
     * steht ebenfalls ein Doppelpunkt. In einer Tabelle ist der Bereich die
     * erwartete Bedeutung, und Excel schreibt ihn nie mit Leerzeichen.
     *
     * ─── WARUM HIER KEIN `\b` MEHR STEHT ────────────────────────────────────
     *
     * Es stand eines, und es hat das Dollarzeichen abgeschnitten. `\b` verlangt
     * eine Wortgrenze — `$` ist kein Wortzeichen, also passte die Grenze nicht
     * VOR das `$`, sondern erst dahinter. Aus `=$A$1` wurde deshalb:
     *
     *     $A$1  →  $prop("A1")        ← das führende $ blieb einfach stehen
     *
     * Ein `$` mitten in der Formel, das die Laufzeit nicht kennt. Feste Bezüge
     * haben also nie funktioniert, und beim Ausfüllen war es schlimmer als ein
     * Absturz: `$A$1` wanderte mit, obwohl es genau das nicht sollte — eine
     * ganze Spalte rechnete still gegen die falsche Zelle.
     *
     * Der Rückblick statt `\b` leistet dasselbe für Buchstaben und schliesst
     * das `$` mit ein. Und er hält weiterhin die wissenschaftliche Schreibweise
     * heraus: in `2e6` steht vor dem `e` eine Ziffer.
     */
    const ADRESSE = '\\$?[A-Za-z]{1,3}\\$?[0-9]{1,7}';
    const NICHT_DAVOR = '(?<![A-Za-z0-9_$.])';
    const TEILE = new RegExp([
        '("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')',
        '(' + NICHT_DAVOR + ADRESSE + ':' + ADRESSE + ')',
        '(' + NICHT_DAVOR + ADRESSE + '\\b(?!\\s*\\())'
    ].join('|'), 'g');
    const ohneDollar = (s) => s.replace(/\$/g, '').toUpperCase();
    /**
     * Aus einer Tabellenformel eine Formel für `laufzeit.js` machen.
     *
     * Gibt zusätzlich die gelesenen Adressen zurück — daraus entsteht der
     * Abhängigkeitsgraph. Sie hier einzusammeln statt später noch einmal zu
     * suchen ist nicht Bequemlichkeit: zwei Stellen, die dieselbe Formel
     * zerlegen, laufen auseinander, und dann rechnet die Tabelle etwas
     * anderes, als der Graph glaubt.
     */
    const uebersetze = (formel) => {
        const roh = String(formel ?? '').trim().replace(/^=/, '');
        if (!roh)
            return { quelle: '', liest: [], fehler: null };
        const A = adressen();
        if (!A)
            return { quelle: '', liest: [], fehler: 'CellRefs fehlt' };
        const liest = [];
        let fehler = null;
        const quelle = roh.replace(TEILE, (ganz, text, bereich, zelle) => {
            if (text !== undefined)
                return text; /* 1 · unangetastet */
            if (bereich !== undefined) { /* 2 · ausschreiben */
                const sauber = bereich.split(':').map(ohneDollar).join(':');
                const erg = A.zellenIn(sauber);
                if (erg.zuGross) {
                    fehler = 'Der Bereich ' + sauber + ' ist zu gross';
                    return ganz;
                }
                if (!erg.adressen.length) {
                    fehler = 'Der Bereich ' + sauber + ' ergibt keine Zellen';
                    return ganz;
                }
                erg.adressen.forEach((a) => liest.push(a));
                return erg.adressen.map((a) => 'prop("' + a + '")').join(', ');
            }
            const sauber = ohneDollar(zelle); /* 3 · einzelne Zelle */
            if (!A.gueltig(sauber))
                return ganz;
            liest.push(sauber);
            return 'prop("' + sauber + '")';
        });
        return { quelle, liest: [...new Set(liest)], fehler };
    };
    /* ==========================================================================
     * 2 · DER ABHÄNGIGKEITSGRAPH
     * ========================================================================*/
    /** Aus den Zellen eines Blattes den Graphen bauen. */
    const graphVon = (zellen) => {
        const liest = {};
        const gelesenVon = {};
        for (const adresse of Object.keys(zellen || {})) {
            const zelle = zellen[adresse];
            if (!zelle || !zelle.formel)
                continue;
            const { liest: quellen } = uebersetze(zelle.formel);
            liest[adresse] = quellen;
            for (const q of quellen)
                (gelesenVon[q] = gelesenVon[q] || []).push(adresse);
        }
        return { liest, gelesenVon };
    };
    /**
     * Welche Zellen liegen in einem Kreis?
     *
     * Tiefensuche mit drei Zuständen — weiss (ungesehen), grau (gerade auf dem
     * Weg), schwarz (fertig). Trifft der Weg auf Grau, ist der Kreis
     * gefunden.
     *
     * WARUM DIE LISTE UND NICHT NUR EIN JA. „Irgendwo ist ein Zirkelbezug" ist
     * keine Hilfe — in einer Tabelle mit dreihundert Formeln sucht man dann
     * von Hand. Zurück kommen die Adressen, die wirklich im Kreis liegen.
     */
    const zirkel = (liest) => {
        const grau = new Set();
        const schwarz = new Set();
        const gefunden = new Set();
        const weg = [];
        const geh = (adresse) => {
            if (schwarz.has(adresse))
                return;
            if (grau.has(adresse)) {
                /* Alles ab dem ersten Auftreten im Weg gehört zum Kreis. */
                const ab = weg.indexOf(adresse);
                if (ab >= 0)
                    weg.slice(ab).forEach(a => gefunden.add(a));
                return;
            }
            grau.add(adresse);
            weg.push(adresse);
            for (const naechste of liest[adresse] || [])
                geh(naechste);
            weg.pop();
            grau.delete(adresse);
            schwarz.add(adresse);
        };
        for (const adresse of Object.keys(liest))
            geh(adresse);
        return [...gefunden].sort();
    };
    /**
     * Die Reihenfolge, in der gerechnet werden muss: was gelesen wird, zuerst.
     *
     * Zellen im Kreis fallen heraus — sie bekommen `#BEZUG!` und werden nicht
     * gerechnet. Ohne das läuft die Tiefensuche endlos, und der Tab steht.
     */
    const reihenfolge = (liest, imKreis) => {
        const fertig = new Set();
        const raus = [];
        const geh = (adresse) => {
            if (fertig.has(adresse) || imKreis.has(adresse))
                return;
            fertig.add(adresse);
            for (const naechste of liest[adresse] || [])
                geh(naechste);
            if (liest[adresse])
                raus.push(adresse);
        };
        for (const adresse of Object.keys(liest))
            geh(adresse);
        return raus;
    };
    /* ==========================================================================
     * 3 · RECHNEN
     * ========================================================================*/
    /** Aus einer Fehlermeldung der Laufzeit den passenden Excel-Wert machen. */
    const alsFehlerwert = (satz) => {
        const s = String(satz ?? '');
        if (/Unbekannte Funktion/i.test(s))
            return '#NAME?';
        return '#WERT!';
    };
    /**
     * Ein Blatt neu rechnen. Verändert die Zellen an Ort und Stelle und sagt,
     * was sich geändert hat.
     */
    const rechne = (blatt) => {
        const t0 = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() : 0;
        const F = maschine();
        if (!F)
            return { geaendert: [], zirkel: [], dauer: 0, fehler: 'Formula fehlt' };
        if (!blatt || !blatt.zellen)
            return { geaendert: [], zirkel: [], dauer: 0, fehler: 'Kein Blatt' };
        const zellen = blatt.zellen;
        const { liest } = graphVon(zellen);
        const imKreis = zirkel(liest);
        const kreisMenge = new Set(imKreis);
        const geaendert = [];
        /* Zellen im Kreis zuerst — damit alles, was sie liest, den Fehlerwert
           sieht und nicht einen alten Wert von gestern. */
        for (const adresse of imKreis) {
            const zelle = zellen[adresse];
            if (!zelle)
                continue;
            if (zelle.wert !== '#BEZUG!') {
                zelle.wert = '#BEZUG!';
                geaendert.push(adresse);
            }
        }
        /* Der Nachschlager: eine Adresse, ein Zellwert. Eine leere Zelle ist
           nicht `undefined`, sondern 0 — sonst ergäbe `=SUMME(A1:A9)` über einer
           halb gefüllten Spalte nichts statt der Summe der gefüllten. */
        const hole = (name) => {
            const zelle = zellen[String(name).toUpperCase()];
            if (!zelle)
                return 0;
            return zelle.wert === undefined || zelle.wert === null ? 0 : zelle.wert;
        };
        for (const adresse of reihenfolge(liest, kreisMenge)) {
            const zelle = zellen[adresse];
            if (!zelle || !zelle.formel)
                continue;
            const { quelle, fehler } = uebersetze(zelle.formel);
            let neu;
            if (fehler)
                neu = '#BEZUG!';
            else {
                const e = F.run(quelle, hole);
                neu = e.ok ? e.wert : alsFehlerwert(e.fehler);
            }
            if (zelle.wert !== neu) {
                zelle.wert = neu;
                geaendert.push(adresse);
            }
        }
        const dauer = ((typeof performance !== 'undefined' && performance.now)
            ? performance.now() : 0) - t0;
        return { geaendert, zirkel: imKreis, dauer: Math.round(dauer), fehler: null };
    };
    /* ==========================================================================
     * 4 · BLÄTTER UND MAPPEN
     * ========================================================================*/
    const kennung = () => (typeof Ids !== 'undefined') ? Ids.short(8)
        : 'x' + Math.random().toString(36).slice(2, 10);
    const neuesBlatt = (name = 'Tabelle 1', zeilen = 50, spalten = 20) => ({
        id: kennung(), name: String(name), zellen: {},
        zeilen: Math.max(1, zeilen), spalten: Math.max(1, spalten)
    });
    const neueMappe = (name = 'Neue Tabelle') => {
        const blatt = neuesBlatt();
        return { id: kennung(), name: String(name), blaetter: [blatt], aktiv: blatt.id,
            erstellt: new Date().toISOString(), geaendert: new Date().toISOString() };
    };
    /**
     * Eine Zelle setzen. Beginnt der Wert mit `=`, ist es eine Formel.
     *
     * Zahlen werden erkannt, damit `12` eine Zahl wird und nicht der Text
     * „12" — sonst rechnet `=SUMME(A1:A2)` mit Text und ergibt 0. Das deutsche
     * Komma zählt dabei mit: wer `1,5` tippt, meint eineinhalb.
     *
     * DREI DINGE, DIE EINE TABELLE KÖNNEN MUSS UND DIE HIER GEFEHLT HABEN:
     *
     * **Leeren wirft die Gestaltung nicht weg.** `delete blatt.zellen[a]` hat
     * mit dem Inhalt auch Fett, Ausrichtung und Währung gelöscht. Wer eine
     * Spalte formatiert, die Zahlen probeweise löscht und neu tippt, stand
     * wieder am Anfang. Excel trennt beides, und zwar aus genau diesem Grund.
     *
     * **WAHR und FALSCH sind Wahrheitswerte**, keine Wörter. Sonst ergibt
     * `=WENN(A1; …)` über einem getippten „WAHR" immer den Sonst-Zweig, und
     * niemand sieht warum.
     *
     * **Ein führendes `'` erzwingt Text.** Postleitzahl `'0815`, Telefonnummer,
     * Artikelnummer — überall dort, wo die führende Null zum Wert gehört.
     */
    const setze = (blatt, adresse, eingabe) => {
        const A = adressen();
        if (!blatt || !A)
            return null;
        const a = String(adresse ?? '').toUpperCase();
        if (!A.gueltig(a))
            return null;
        const roh = eingabe === null || eingabe === undefined ? '' : String(eingabe);
        const vorher = blatt.zellen[a] || {};
        if (roh === '') {
            /* Inhalt weg, Gestaltung bleibt — und nur wenn auch keine Gestaltung
               da ist, verschwindet der Eintrag ganz. Sonst füllte sich das Blatt
               mit leeren Zellen, und die Sicherung wüchse ohne einen Inhalt. */
            const stil = vorher.stil;
            if (stil && Object.keys(stil).length) {
                blatt.zellen[a] = { wert: '', stil };
                return blatt.zellen[a];
            }
            delete blatt.zellen[a];
            return null;
        }
        if (roh.startsWith('=')) {
            blatt.zellen[a] = { ...vorher, formel: roh, wert: vorher.wert ?? '' };
            return blatt.zellen[a];
        }
        const neu = { ...vorher };
        delete neu.formel;
        if (roh.startsWith("'")) { /* erzwungener Text */
            neu.wert = roh.slice(1);
            neu.text = true;
        }
        else {
            delete neu.text;
            const oben = roh.trim().toUpperCase();
            if (oben === 'WAHR' || oben === 'TRUE')
                neu.wert = true;
            else if (oben === 'FALSCH' || oben === 'FALSE')
                neu.wert = false;
            else {
                const alsZahl = roh.trim().replace(',', '.');
                const zahl = /^-?\d+(\.\d+)?$/.test(alsZahl) ? Number(alsZahl) : null;
                neu.wert = zahl === null ? roh : zahl;
            }
        }
        blatt.zellen[a] = neu;
        return blatt.zellen[a];
    };
    /* ==========================================================================
     * 5 · BEZÜGE VERSCHIEBEN
     * --------------------------------------------------------------------------
     * Eine Funktion, zwei Anwender — und deshalb steht sie hier und nicht
     * zweimal in der Oberfläche:
     *
     *   · **Ausfüllen.** Wer `=A1+B1` aus C1 nach C2 zieht, erwartet `=A2+B2`.
     *     Das ist der ganze Sinn eines relativen Bezugs.
     *   · **Zeile oder Spalte einfügen und löschen.** Wird über Zeile 5 etwas
     *     eingeschoben, muss `=SUMME(A1:A9)` zu `=SUMME(A1:A10)` werden. Sonst
     *     rechnet die Tabelle ab dem Einfügen still falsch — und das ist die
     *     schlimmste Sorte Fehler, die eine Tabelle haben kann: sie sieht
     *     weiterhin richtig aus.
     *
     * `$` HEISST NUR BEIM AUSFÜLLEN ETWAS. Beim Einfügen einer Zeile wandert
     * auch `$A$1` mit — es zeigt weiterhin auf dieselbe Zelle, und die ist
     * jetzt woanders. Excel macht es genauso, und wer es anders macht, bekommt
     * beim ersten Einfügen falsche Summen.
     *
     * Fällt ein Bezug beim Löschen weg, wird die ganze Formel `=#BEZUG!` —
     * nicht heimlich eine Zelle daneben. Ein sichtbarer Fehler ist ein Fehler,
     * den jemand behebt.
     * ========================================================================*/
    /** Eine Adresse mit ihren `$`-Marken zerlegt. */
    const teileAdresse = (roh) => {
        const m = String(roh).match(/^(\$?)([A-Za-z]{1,3})(\$?)([0-9]{1,7})$/);
        if (!m)
            return null;
        return { absS: m[1] === '$', spalte: String(m[2]).toUpperCase(),
            absZ: m[3] === '$', zeile: Number(m[4]) };
    };
    const KAPUTT = '#BEZUG!';
    /**
     * Der gemeinsame Weg: jede Adresse in der Formel durch `wandle` schicken.
     * Gibt `wandle` `null` zurück, ist die ganze Formel hin.
     */
    const bezuegeUm = (formel, wandle) => {
        const roh = String(formel ?? '');
        if (!roh.startsWith('='))
            return roh;
        let kaputt = false;
        const eine = (stueck) => {
            const t = teileAdresse(stueck);
            if (!t)
                return stueck;
            const raus = wandle(t);
            if (raus === null) {
                kaputt = true;
                return KAPUTT;
            }
            return raus;
        };
        const neu = roh.slice(1).replace(TEILE, (_ganz, text, bereich, zelle) => {
            if (text !== undefined)
                return text;
            if (bereich !== undefined)
                return bereich.split(':').map(eine).join(':');
            return eine(zelle);
        });
        return kaputt ? '=' + KAPUTT : '=' + neu;
    };
    /** Relativ verschieben — für das Ausfüllen. `$` bleibt stehen. */
    const verschiebe = (formel, dz, ds) => bezuegeUm(formel, (t) => {
        const A = adressen();
        if (!A)
            return null;
        const spalte = t.absS ? A.textZuSpalte(t.spalte) : A.textZuSpalte(t.spalte) + ds;
        const zeile = t.absZ ? t.zeile - 1 : t.zeile - 1 + dz;
        if (spalte < 0 || zeile < 0)
            return null;
        const txt = A.spalteZuText(spalte);
        if (!txt)
            return null;
        return (t.absS ? '$' : '') + txt + (t.absZ ? '$' : '') + (zeile + 1);
    });
    /**
     * Nach einem Einfügen oder Löschen nachziehen.
     *
     * @param art    'zeile' oder 'spalte'
     * @param bei    ab welchem Index (0-basiert)
     * @param anzahl positiv = eingefügt, negativ = gelöscht
     */
    const bezuegeNachEingriff = (formel, art, bei, anzahl) => bezuegeUm(formel, (t) => {
        const A = adressen();
        if (!A)
            return null;
        let spalte = A.textZuSpalte(t.spalte);
        let zeile = t.zeile - 1;
        if (spalte < 0 || zeile < 0)
            return null;
        const wert = art === 'zeile' ? zeile : spalte;
        let neu = wert;
        if (anzahl > 0) {
            if (wert >= bei)
                neu = wert + anzahl;
        }
        else {
            const weg = -anzahl;
            if (wert >= bei && wert < bei + weg)
                return null; /* stand in der gelöschten Zeile */
            if (wert >= bei + weg)
                neu = wert - weg;
        }
        if (art === 'zeile')
            zeile = neu;
        else
            spalte = neu;
        const txt = A.spalteZuText(spalte);
        if (!txt || zeile < 0)
            return null;
        return (t.absS ? '$' : '') + txt + (t.absZ ? '$' : '') + (zeile + 1);
    });
    /* ==========================================================================
     * 6 · ZEILEN UND SPALTEN
     * --------------------------------------------------------------------------
     * Die Zellen eines Blattes liegen unter ihrer Adresse — beim Einfügen muss
     * also jede betroffene Zelle umziehen, und zwar **von hinten nach vorn**.
     * Andersherum überschreibt der Umzug von Zeile 5 die Zeile 6, bevor die
     * selbst umgezogen ist. Ein Fehler, den man erst bei drei Zeilen bemerkt.
     * ========================================================================*/
    const eingriff = (blatt, art, bei, anzahl) => {
        const A = adressen();
        if (!blatt || !blatt.zellen || !A || !anzahl)
            return false;
        const weg = anzahl < 0 ? -anzahl : 0;
        const alt = blatt.zellen;
        const neu = {};
        for (const adresse of Object.keys(alt)) {
            const l = A.lies(adresse);
            if (!l)
                continue;
            let z = l.zeile, s = l.spalte;
            const wert = art === 'zeile' ? z : s;
            if (weg) {
                if (wert >= bei && wert < bei + weg)
                    continue; /* fällt weg */
                if (wert >= bei + weg) {
                    if (art === 'zeile')
                        z -= weg;
                    else
                        s -= weg;
                }
            }
            else if (wert >= bei) {
                if (art === 'zeile')
                    z += anzahl;
                else
                    s += anzahl;
            }
            /* JEDE Formel wird nachgezogen, auch die einer Zelle, die selbst
               stehen bleibt: `=A9` in B1 muss nach dem Einfügen `=A10` heissen,
               obwohl B1 sich nicht bewegt hat. */
            const zelle = alt[adresse];
            if (zelle && zelle.formel)
                zelle.formel = bezuegeNachEingriff(zelle.formel, art, bei, anzahl);
            neu[A.schreibe(z, s)] = zelle;
        }
        blatt.zellen = neu;
        if (art === 'zeile')
            blatt.zeilen = Math.max(1, (blatt.zeilen || 0) + anzahl);
        else
            blatt.spalten = Math.max(1, (blatt.spalten || 0) + anzahl);
        return true;
    };
    const zeileEinfuegen = (blatt, bei, anzahl = 1) => eingriff(blatt, 'zeile', bei, Math.max(1, anzahl));
    const zeileLoeschen = (blatt, bei, anzahl = 1) => eingriff(blatt, 'zeile', bei, -Math.max(1, anzahl));
    const spalteEinfuegen = (blatt, bei, anzahl = 1) => eingriff(blatt, 'spalte', bei, Math.max(1, anzahl));
    const spalteLoeschen = (blatt, bei, anzahl = 1) => eingriff(blatt, 'spalte', bei, -Math.max(1, anzahl));
    /* ==========================================================================
     * 7 · AUSFÜLLEN
     * --------------------------------------------------------------------------
     * Der Anfasser unten rechts an der Auswahl verspricht das. Ein Anfasser,
     * der nichts tut, ist schlimmer als keiner — deshalb steht das hier und
     * nicht auf der Liste für später.
     *
     * Drei Fälle, in dieser Reihenfolge:
     *   1. **Formel** — mitverschoben (`=A1` wird `=A2`)
     *   2. **Zwei Zahlen oder mehr** — die Schrittweite fortgesetzt: 2, 4 → 6, 8
     *   3. **Alles andere** — wiederholt
     *
     * Bei Fall 2 zählt der Abstand des LETZTEN Paars. `1, 2, 4` füllt mit 6, 8 —
     * eine Tabelle rät keine Potenzreihe.
     */
    const fuelle = (blatt, von, bisZeile, bisSpalte) => {
        const A = adressen();
        if (!blatt || !A)
            return 0;
        const runter = bisZeile > von.bisZ;
        const rechts = bisSpalte > von.bisS;
        if (!runter && !rechts)
            return 0;
        const quelle = [];
        let gefuellt = 0;
        const eineReihe = (fest, laenge, alsZeile, vonI, bisI, zielBis) => {
            quelle.length = 0;
            for (let i = vonI; i <= bisI; i++)
                quelle.push(alsZeile ? A.schreibe(i, fest) : A.schreibe(fest, i));
            /* Die Zahlenreihe, falls es eine ist. */
            const zahlen = quelle.map(a => {
                const zelle = blatt.zellen[a];
                return zelle && typeof zelle.wert === 'number' && !zelle.formel ? zelle.wert : null;
            });
            const alleZahlen = zahlen.length > 1 && zahlen.every(z => z !== null);
            const schritt = alleZahlen
                ? zahlen[zahlen.length - 1] - zahlen[zahlen.length - 2] : 0;
            for (let i = bisI + 1; i <= zielBis; i++) {
                const ziel = alsZeile ? A.schreibe(i, fest) : A.schreibe(fest, i);
                const abstand = i - bisI;
                const vorbild = quelle[(abstand - 1) % laenge] || '';
                const zelleV = blatt.zellen[vorbild];
                if (alleZahlen) {
                    blatt.zellen[ziel] = { ...(zelleV || {}),
                        wert: zahlen[zahlen.length - 1] + schritt * abstand };
                    delete blatt.zellen[ziel].formel;
                }
                else if (zelleV && zelleV.formel) {
                    const dz = alsZeile ? i - A.lies(vorbild).zeile : 0;
                    const ds = alsZeile ? 0 : i - A.lies(vorbild).spalte;
                    blatt.zellen[ziel] = { ...zelleV, formel: verschiebe(zelleV.formel, dz, ds) };
                }
                else if (zelleV) {
                    blatt.zellen[ziel] = { ...zelleV };
                }
                else {
                    delete blatt.zellen[ziel];
                }
                gefuellt++;
            }
        };
        if (runter) {
            const laenge = von.bisZ - von.vonZ + 1;
            for (let s = von.vonS; s <= von.bisS; s++)
                eineReihe(s, laenge, true, von.vonZ, von.bisZ, bisZeile);
            if (bisZeile + 1 > (blatt.zeilen || 0))
                blatt.zeilen = bisZeile + 1;
        }
        if (rechts) {
            const laenge = von.bisS - von.vonS + 1;
            for (let z = von.vonZ; z <= von.bisZ; z++)
                eineReihe(z, laenge, false, von.vonS, von.bisS, bisSpalte);
            if (bisSpalte + 1 > (blatt.spalten || 0))
                blatt.spalten = bisSpalte + 1;
        }
        return gefuellt;
    };
    /* ==========================================================================
     * 8 · SORTIEREN
     * --------------------------------------------------------------------------
     * Nach einer Spalte, über einen Zeilenbereich. Formeln wandern **nicht**
     * mit angepassten Bezügen — eine sortierte Formel zeigt danach auf ihre
     * neue Nachbarschaft, und das ist auch in Excel so. Wer Formeln sortiert,
     * weiss meist selbst nicht, was er erwartet; wer Zahlen sortiert, schon.
     * ========================================================================*/
    const sortiere = (blatt, spalte, vonZ, bisZ, ab = true) => {
        const A = adressen();
        if (!blatt || !A || bisZ <= vonZ)
            return false;
        const breite = blatt.spalten || 0;
        const zeilen = [];
        for (let z = vonZ; z <= bisZ; z++) {
            const eine = [];
            for (let s = 0; s < breite; s++)
                eine.push(blatt.zellen[A.schreibe(z, s)] || null);
            zeilen.push(eine);
        }
        const schluessel = (r) => (r[spalte] ? r[spalte].wert : '');
        zeilen.sort((x, y) => {
            const a = schluessel(x), b = schluessel(y);
            const leerA = a === '' || a === null || a === undefined;
            const leerB = b === '' || b === null || b === undefined;
            if (leerA && leerB)
                return 0;
            if (leerA)
                return 1; /* Leeres immer nach unten */
            if (leerB)
                return -1;
            if (typeof a === 'number' && typeof b === 'number')
                return ab ? a - b : b - a;
            const va = String(a), vb = String(b);
            return ab ? va.localeCompare(vb, 'de') : vb.localeCompare(va, 'de');
        });
        zeilen.forEach((eine, i) => {
            const z = vonZ + i;
            for (let s = 0; s < breite; s++) {
                const ziel = A.schreibe(z, s);
                if (eine[s])
                    blatt.zellen[ziel] = eine[s];
                else
                    delete blatt.zellen[ziel];
            }
        });
        return true;
    };
    /** Was in der Zelle steht — für die Anzeige. */
    const wert = (blatt, adresse) => {
        const zelle = blatt && blatt.zellen ? blatt.zellen[String(adresse ?? '').toUpperCase()] : null;
        return zelle ? zelle.wert : '';
    };
    /** Was der Mensch getippt hat — für die Bearbeitungszeile. */
    const eingabe = (blatt, adresse) => {
        const zelle = blatt && blatt.zellen ? blatt.zellen[String(adresse ?? '').toUpperCase()] : null;
        if (!zelle)
            return '';
        if (zelle.formel)
            return String(zelle.formel);
        return zelle.wert === undefined || zelle.wert === null ? '' : String(zelle.wert);
    };
    return { uebersetze, graphVon, zirkel, reihenfolge, rechne,
        neuesBlatt, neueMappe, setze, wert, eingabe, alsFehlerwert,
        verschiebe, bezuegeNachEingriff,
        zeileEinfuegen, zeileLoeschen, spalteEinfuegen, spalteLoeschen,
        fuelle, sortiere };
})();
window.Spreadsheet = Spreadsheet;
