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
     */
    const TEILE = new RegExp([
        '("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')',
        '(\\$?[A-Za-z]{1,3}\\$?[0-9]{1,7}:\\$?[A-Za-z]{1,3}\\$?[0-9]{1,7})',
        '(\\b\\$?[A-Za-z]{1,3}\\$?[0-9]{1,7}\\b(?!\\s*\\())'
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
            delete blatt.zellen[a];
            return null;
        }
        if (roh.startsWith('=')) {
            blatt.zellen[a] = { ...vorher, formel: roh, wert: vorher.wert ?? '' };
        }
        else {
            const alsZahl = roh.trim().replace(',', '.');
            const zahl = /^-?\d+(\.\d+)?$/.test(alsZahl) ? Number(alsZahl) : null;
            const neu = { ...vorher, wert: zahl === null ? roh : zahl };
            delete neu.formel;
            blatt.zellen[a] = neu;
        }
        return blatt.zellen[a];
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
        neuesBlatt, neueMappe, setze, wert, eingabe, alsFehlerwert };
})();
window.Spreadsheet = Spreadsheet;
