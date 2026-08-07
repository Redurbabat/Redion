"use strict";
/* ============================================================================
 * import.js — Excel, Word und EPUB einlesen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/dateien/einlesen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/dateien/einlesen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Alle drei Formate sind im Kern dasselbe: ein ZIP-Archiv voller XML-Dateien.
 * Deshalb steht hier zuerst ein kleiner ZIP-Leser, der ohne fremdes Paket
 * auskommt — das Entpacken übernimmt der Browser selbst über
 * DecompressionStream. Danach wird das XML gelesen und in Blöcke übersetzt.
 *
 *   .xlsx   →  eine Datenbank je Tabellenblatt
 *   .docx   →  Überschriften, Absätze, Listen und Tabellen
 *   .epub   →  ein Kapitel je Unterseite
 *
 * Kostenlos, offline, ohne Abhängigkeit.
 * ==========================================================================*/
const Einlesen = (() => {
    /* ========================================================================
     * DER ZIP-LESER
     * ------------------------------------------------------------------------
     * Ein ZIP endet mit dem „End of Central Directory". Von dort steht, wo das
     * Inhaltsverzeichnis liegt; darin steht zu jeder Datei, wo ihre Daten
     * beginnen. Mehr braucht es nicht.
     * ======================================================================*/
    /* ------------------------------------------------------------------------
     * ZIP64 — seit dem 6. August gelesen statt abgelehnt (E39)
     * ------------------------------------------------------------------------
     * Über 65 535 Einträgen oder 4 GB schreiben Werkzeuge ZIP64. Im alten
     * Schlusssatz stehen dann Platzhalter (0xFFFF, 0xFFFFFFFF); die echten
     * Zahlen liegen in einem eigenen Satz davor.
     *
     * DREI STUFEN, und es lohnt sich, sie auseinanderzuhalten:
     *
     *   1. Ungeprüft war das der schlimmste Fall, den es gibt: `blob.slice`
     *      auf einen Versatz von 0xFFFFFFFF gibt einen leeren Ausschnitt, die
     *      Schleife läuft nullmal — **null Dateien und kein Fehler**. Wer eine
     *      Sicherung mit 70 000 Anhängen einspielte, sah „0 Anhänge".
     *   2. Dann eine ehrliche Ablehnung. Besser, aber keine Sicherung.
     *   3. Jetzt gelesen. Redion schreibt solche Archive selbst, seit die
     *      4-GB-Grenze gefallen ist — ein Packer, dessen Leser nicht
     *      mitkommt, schriebe Sicherungen, die niemand zurückholen kann.
     *
     * WARUM AM WEGWEISER UND NICHT AN DEN PLATZHALTERN. Ein gewöhnliches
     * Archiv mit genau 65 535 Einträgen schreibt ebenfalls 0xFFFF in das
     * Anzahlfeld, ohne ZIP64 zu sein. Der Wegweiser (0x07064b50) steht
     * dagegen nur dort, wo wirklich ZIP64 vorliegt — und immer genau 20 Byte
     * vor dem Schlusssatz.
     *
     * UND ZIP64 IST NICHT ALLES-ODER-NICHTS. Pythons `zipfile` schreibt bei
     * einer einzelnen grossen Datei die Platzhalter nur in den lokalen Kopf
     * und lässt Verzeichnis und Schlusssatz gewöhnlich — nachgemessen am
     * 6. August. Solche Archive las Redion schon immer richtig, weil es die
     * Längen aus dem Verzeichnis nimmt. Deshalb wird hier jedes Feld einzeln
     * angesehen und nicht das Archiv als Ganzes eingeordnet.
     * ----------------------------------------------------------------------*/
    const istZip64 = (d, eocd) => eocd >= 20 && d.getUint32(eocd - 20, true) === 0x07064b50;
    /* Acht Byte lesen. `getBigUint64` gäbe ein BigInt, und damit rechnet
       `blob.slice` nicht — also gleich als Zahl. Bis 2^53 ist das exakt; ein
       Archiv jenseits von acht Petabyte gibt es nicht. */
    const lies64 = (d, i) => d.getUint32(i, true) + d.getUint32(i + 4, true) * 4294967296;
    /**
     * Die echten Zahlen aus dem ZIP64-Zusatzfeld eines Verzeichniseintrags.
     *
     * DIE REIHENFOLGE IST FEST und die Anwesenheit bedingt: roh, gepackt,
     * Versatz — jede Zahl steht nur dann da, wenn das zugehörige 32-Bit-Feld
     * den Platzhalter trägt. Wer stattdessen alle drei erwartet, liest ab der
     * ersten fehlenden Zahl alles verschoben und bekommt Werte, die fast
     * stimmen. Abgelesen an Pythons `zipfile._decodeExtra`, nicht geraten.
     */
    const zip64Zusatz = (d, extraStart, extraLaenge, roh, gepackt, versatz) => {
        let e = extraStart;
        const ende = extraStart + extraLaenge;
        while (e + 4 <= ende) {
            const kennung = d.getUint16(e, true);
            const laenge = d.getUint16(e + 2, true);
            if (kennung === 0x0001) {
                let f = e + 4;
                const rest = () => f + 8 <= e + 4 + laenge;
                if (roh === 0xFFFFFFFF && rest()) {
                    roh = lies64(d, f);
                    f += 8;
                }
                if (gepackt === 0xFFFFFFFF && rest()) {
                    gepackt = lies64(d, f);
                    f += 8;
                }
                if (versatz === 0xFFFFFFFF && rest()) {
                    versatz = lies64(d, f);
                    f += 8;
                }
                break;
            }
            e += 4 + laenge;
        }
        return { roh, gepackt, versatz };
    };
    const ZIP64_KAPUTT = 'Dieses Archiv nennt sich ZIP64, aber sein ZIP64-Schlusssatz fehlt oder ' +
        'ist beschädigt. Ohne ihn stünden im alten Schlusssatz nur Platzhalter, ' +
        'und Redion läse aus einem Archiv voller Dateien null Dateien heraus — ' +
        'ohne das zu merken. Lieber diese Meldung.';
    /**
     * Anzahl, Grösse und Ort des Verzeichnisses — aus dem ZIP64-Schlusssatz,
     * wenn es einen gibt, sonst aus dem alten.
     *
     * `z64Satz` ist der ZIP64-Schlusssatz, falls der Aufrufer ihn getrennt
     * holen musste: beim Lesen aus einem Blob deckt `d` nur ein Fenster am
     * Dateiende ab, und bei einem langen Archivkommentar liegt der Satz
     * davor.
     *
     * WARUM HIER GEWORFEN WIRD UND NICHT AUSGEWICHEN. Der erste Entwurf
     * nahm bei einem unlesbaren ZIP64-Satz „ersatzweise" die Zahlen aus dem
     * alten Schlusssatz. Das ist die schlechteste aller Möglichkeiten: dort
     * stehen dann 0xFFFFFFFF, `blob.slice` gibt einen leeren Ausschnitt, und
     * heraus kommen **null Dateien und kein Fehler**. Genau der Fall, gegen
     * den dieser Code einmal geschrieben wurde — beim Umbau auf ZIP64 wäre
     * er beinahe zurückgekehrt. Gefunden hat ihn der eigene Prüflauf.
     */
    const schlussLesen = (d, eocd, z64Satz) => {
        const anzahl = d.getUint16(eocd + 10, true);
        const groesse = d.getUint32(eocd + 12, true);
        const start = d.getUint32(eocd + 16, true);
        if (!istZip64(d, eocd))
            return { anzahl, groesse, start, zip64: false };
        const s = z64Satz;
        if (!s || s.byteLength < 56 || s.getUint32(0, true) !== 0x06064b50)
            throw new Error(ZIP64_KAPUTT);
        return { anzahl: lies64(s, 32), groesse: lies64(s, 40),
            start: lies64(s, 48), zip64: true };
    };
    /** Wo der ZIP64-Schlusssatz liegt — absolut, laut Wegweiser. */
    const z64Ort = (d, eocd) => lies64(d, eocd - 20 + 8);
    /* Ein Archiv, das N Einträge ankündigt und keinen einzigen liefert, ist
       kaputt — und schweigend leer zurückzugeben ist der Fehler, der Leuten
       ihre Anhänge kostet. Diese eine Zeile fängt jede Sorte davon ab. */
    const vollzaehlig = (versprochen, gefunden) => {
        if (versprochen > 0 && gefunden === 0)
            throw new Error('Dieses Archiv kündigt ' + versprochen + ' Einträge an, ' +
                'hat aber keinen einzigen an der angegebenen Stelle. Es ist ' +
                'beschädigt oder unvollständig — Redion spielt lieber nichts ein, ' +
                'als so zu tun, als wäre es leer gewesen.');
    };
    const zipLesen = async (puffer) => {
        const d = new DataView(puffer);
        const bytes = new Uint8Array(puffer);
        /* Das Ende des Inhaltsverzeichnisses suchen — höchstens 65 KB Kommentar */
        let eocd = -1;
        for (let i = d.byteLength - 22; i >= Math.max(0, d.byteLength - 65558); i--) {
            if (d.getUint32(i, true) === 0x06054b50) {
                eocd = i;
                break;
            }
        }
        if (eocd < 0)
            throw new Error('Das ist kein gültiges ZIP-Archiv.');
        /* Hier liegt das ganze Archiv im Speicher, der ZIP64-Satz also auch —
           er wird nur ausgeschnitten, damit `schlussLesen` beide Wege gleich
           behandeln kann. */
        const z64 = istZip64(d, eocd) ? (() => {
            const o = z64Ort(d, eocd);
            return (o >= 0 && o + 56 <= d.byteLength)
                ? new DataView(puffer, o, 56) : null;
        })() : null;
        const schluss = schlussLesen(d, eocd, z64);
        const anzahl = schluss.anzahl;
        let zeiger = schluss.start;
        const dateien = new Map();
        for (let n = 0; n < anzahl; n++) {
            if (d.getUint32(zeiger, true) !== 0x02014b50)
                break;
            const methode = d.getUint16(zeiger + 10, true);
            const nameLaenge = d.getUint16(zeiger + 28, true);
            const extra = d.getUint16(zeiger + 30, true);
            const kommentar = d.getUint16(zeiger + 32, true);
            const name = new TextDecoder().decode(bytes.subarray(zeiger + 46, zeiger + 46 + nameLaenge));
            /* Erst die 32-Bit-Felder, dann die echten Zahlen aus dem Zusatz —
               aber nur für die Felder, die den Platzhalter tragen. */
            const echt = zip64Zusatz(d, zeiger + 46 + nameLaenge, extra, d.getUint32(zeiger + 24, true), d.getUint32(zeiger + 20, true), d.getUint32(zeiger + 42, true));
            const gepackt = echt.gepackt;
            const offset = echt.versatz;
            /* Am lokalen Kopf stehen die tatsächlichen Längen der Zusatzfelder */
            const lokalName = d.getUint16(offset + 26, true);
            const lokalExtra = d.getUint16(offset + 28, true);
            const start = offset + 30 + lokalName + lokalExtra;
            const roh = bytes.subarray(start, start + gepackt);
            dateien.set(name, { methode, roh });
            zeiger += 46 + nameLaenge + extra + kommentar;
        }
        vollzaehlig(anzahl, dateien.size);
        /* Entpacken übernimmt der Browser */
        const holen = async (name) => {
            const e = dateien.get(name);
            if (!e)
                return null;
            if (e.methode === 0)
                return new Uint8Array(e.roh);
            if (e.methode !== 8)
                throw new Error('Diese Packmethode kennt der Browser nicht.');
            if (!self.DecompressionStream)
                throw new Error('Dieser Browser kann kein ZIP entpacken.');
            const strom = new Blob([e.roh]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
            return new Uint8Array(await new Response(strom).arrayBuffer());
        };
        const text = async (name) => {
            const b = await holen(name);
            return b ? new TextDecoder().decode(b) : null;
        };
        return { namen: [...dateien.keys()], holen, text };
    };
    /**
     * Dasselbe für ein Archiv, das nicht in den Arbeitsspeicher passt.
     *
     * WARUM ES BEIDE GIBT. `zipLesen` bekommt einen ArrayBuffer — das ganze
     * Archiv liegt dann im Speicher. Für eine Word-Datei ist das richtig und
     * einfach. Für eine Redion-Sicherung mit einem Video darin ist es das
     * Ende: `await datei.arrayBuffer()` auf ein halbes Gigabyte bringt ein
     * Telefon zu Fall.
     *
     * Ein ZIP kommt einem dabei entgegen. Sein Inhaltsverzeichnis steht am
     * ENDE; man liest die letzten paar Kilobyte, weiss danach, wo jeder
     * Eintrag anfängt und wie lang er ist — und holt sich nur den, den man
     * gerade braucht. `blob.slice` schneidet, ohne zu lesen.
     *
     * Zurück kommt deshalb ein **Blob** je Eintrag und kein Byte-Feld: wer ihn
     * weiterreicht, ohne ihn anzusehen, hat ihn nie im Speicher gehabt.
     */
    const zipLesenAusBlob = async (blob) => {
        const fensterStart = Math.max(0, blob.size - 65558);
        const ende = new DataView(await blob.slice(fensterStart).arrayBuffer());
        let eocd = -1;
        for (let i = ende.byteLength - 22; i >= 0; i--)
            if (ende.getUint32(i, true) === 0x06054b50) {
                eocd = i;
                break;
            }
        if (eocd < 0)
            throw new Error('Das ist kein gültiges ZIP-Archiv.');
        /* DEN ZIP64-SATZ HOLT SICH DIESER WEG SELBST, per absolutem Versatz aus
           dem Blob. Ihn aus dem Fenster zu schneiden wäre naheliegend und in
           den meisten Fällen richtig — aber bei einem langen Archivkommentar
           liegt er davor, und dann läse man an einer beliebigen Stelle nach.
           Ein `slice` kostet nichts; eine Sicherung, die daran scheitert,
           kostet alles. */
        const z64 = istZip64(ende, eocd)
            ? await (async () => {
                const o = z64Ort(ende, eocd);
                if (o < 0 || o + 56 > blob.size)
                    return null;
                return new DataView(await blob.slice(o, o + 56).arrayBuffer());
            })()
            : null;
        const schluss = schlussLesen(ende, eocd, z64);
        const anzahl = schluss.anzahl;
        const vzGroesse = schluss.groesse;
        const vzStart = schluss.start;
        const vz = new DataView(await blob.slice(vzStart, vzStart + vzGroesse).arrayBuffer());
        const vzBytes = new Uint8Array(vz.buffer);
        const dateien = new Map();
        let zeiger = 0;
        for (let n = 0; n < anzahl; n++) {
            if (zeiger + 46 > vz.byteLength || vz.getUint32(zeiger, true) !== 0x02014b50)
                break;
            const methode = vz.getUint16(zeiger + 10, true);
            const nameLaenge = vz.getUint16(zeiger + 28, true);
            const extra = vz.getUint16(zeiger + 30, true);
            const kommentar = vz.getUint16(zeiger + 32, true);
            const name = new TextDecoder().decode(vzBytes.subarray(zeiger + 46, zeiger + 46 + nameLaenge));
            const echt = zip64Zusatz(vz, zeiger + 46 + nameLaenge, extra, vz.getUint32(zeiger + 24, true), vz.getUint32(zeiger + 20, true), vz.getUint32(zeiger + 42, true));
            dateien.set(name, { methode, gepackt: echt.gepackt, offset: echt.versatz });
            zeiger += 46 + nameLaenge + extra + kommentar;
        }
        vollzaehlig(anzahl, dateien.size);
        /* Die Längen der Zusatzfelder stehen am lokalen Kopf noch einmal, und
           zwar oft anders als im Verzeichnis. Wer das Verzeichnis glaubt, liest
           um ein paar Byte verschoben — und bekommt Daten, die fast stimmen. */
        const alsBlob = async (name) => {
            const e = dateien.get(name);
            if (!e)
                return null;
            const k = new DataView(await blob.slice(e.offset, e.offset + 30).arrayBuffer());
            const lokalName = k.getUint16(26, true);
            const lokalExtra = k.getUint16(28, true);
            const start = e.offset + 30 + lokalName + lokalExtra;
            const roh = blob.slice(start, start + e.gepackt);
            if (e.methode === 0)
                return roh;
            if (e.methode !== 8)
                throw new Error('Diese Packmethode kennt der Browser nicht.');
            if (!self.DecompressionStream)
                throw new Error('Dieser Browser kann kein ZIP entpacken.');
            const strom = roh.stream().pipeThrough(new DecompressionStream('deflate-raw'));
            return await new Response(strom).blob();
        };
        const holen = async (name) => {
            const b = await alsBlob(name);
            return b ? new Uint8Array(await b.arrayBuffer()) : null;
        };
        const text = async (name) => {
            const b = await alsBlob(name);
            return b ? await b.text() : null;
        };
        return { namen: [...dateien.keys()], alsBlob, holen, text };
    };
    const xml = (t) => new DOMParser().parseFromString(t, 'application/xml');
    /* ========================================================================
     * EXCEL
     * ------------------------------------------------------------------------
     * Zellen stehen in sheet1.xml, Texte meist ausgelagert in sharedStrings.xml.
     * Die Spaltenbuchstaben werden in Nummern zurückgerechnet, damit leere
     * Zellen nicht die Reihenfolge verschieben.
     * ======================================================================*/
    const spalteZuNummer = (bezug) => {
        const m = String(bezug).match(/^([A-Z]+)/);
        if (!m)
            return 0;
        let n = 0;
        for (const c of m[1] ?? '')
            n = n * 26 + (c.charCodeAt(0) - 64);
        return n - 1;
    };
    /* ==========================================================================
     * ODS — das Tabellenformat von LibreOffice und OpenOffice
     * --------------------------------------------------------------------------
     * WARUM ÜBERHAUPT. Wer keine Excel-Lizenz hat, speichert in .ods — das ist
     * der Normalfall auf einem Linux-Rechner und in vielen Schulen und
     * Verwaltungen. Eine Tabellen-App, die dieses Format nicht lesen kann,
     * sagt solchen Leuten: hol dir erst Excel.
     *
     * WIE ES GEBAUT IST. Ein ODS ist ein ZIP mit `content.xml` darin. Die
     * Tabellen stehen als `<table:table>`, die Zeilen als `<table:table-row>`,
     * die Zellen als `<table:table-cell>`.
     *
     * ZWEI DINGE, DIE MAN LEICHT ÜBERSIEHT UND DIE ALLES VERSCHIEBEN:
     *
     *   1. WIEDERHOLUNGEN. Steht in zehn Zellen nebeneinander dasselbe — oder
     *      nichts —, schreibt LibreOffice EINE Zelle mit
     *      `table:number-columns-repeated="10"`. Wer das ignoriert, bekommt
     *      eine Tabelle, in der ab der ersten Lücke jede Spalte verrutscht
     *      ist. Dasselbe für Zeilen.
     *
     *   2. DER SCHWANZ. Am Ende jedes Blattes stehen oft tausend leere Zeilen
     *      mit einer einzigen Wiederholungsangabe — „ab hier ist bis Zeile
     *      1048576 nichts". Wer die ausrollt, baut eine Million leerer Zeilen
     *      und friert den Browser ein. Deshalb wird die Wiederholung gedeckelt
     *      und am Schluss abgeschnitten, was leer ist.
     *
     * DER WERT steht als Zahl in `office:value` und als Text in `<text:p>`.
     * Genommen wird die Zahl, wenn es eine gibt — sonst käme aus „1.450,50"
     * beim Rechnen nichts heraus.
     * ========================================================================*/
    const ODS_MAX_WIEDERHOLUNG = 1024;
    const odsLesen = async (puffer) => {
        const zip = await zipLesen(puffer);
        const text = await zip.text('content.xml');
        if (!text)
            throw new Error('Diese .ods-Datei hat keine content.xml — ' +
                'entweder ist sie beschädigt oder es ist keine.');
        const doc = xml(text);
        /* `getElementsByTagName` mit dem vollen Namen: `querySelectorAll` kommt
           mit dem Doppelpunkt im Namensraum nicht zurecht. */
        const tabellen = [...doc.getElementsByTagName('table:table')];
        const blaetter = [];
        for (const tab of tabellen) {
            const name = tab.getAttribute('table:name') || 'Blatt';
            const zeilen = [];
            for (const row of [...tab.getElementsByTagName('table:table-row')]) {
                const wieOft = Math.min(Number(row.getAttribute('table:number-rows-repeated') || 1) || 1, ODS_MAX_WIEDERHOLUNG);
                const werte = [];
                for (const c of [...row.getElementsByTagName('table:table-cell')]) {
                    const malSo = Math.min(Number(c.getAttribute('table:number-columns-repeated') || 1) || 1, ODS_MAX_WIEDERHOLUNG);
                    const zahl = c.getAttribute('office:value');
                    const wert = zahl !== null && zahl !== ''
                        ? Number(zahl)
                        : [...c.getElementsByTagName('text:p')].map(x => x.textContent ?? '').join('\n');
                    for (let i = 0; i < malSo; i++)
                        werte.push(wert);
                }
                /* Rechts abschneiden, was leer ist — sonst schleppt jede Zeile die
                   ausgerollten Wiederholungen mit. */
                while (werte.length && (werte[werte.length - 1] === '' ||
                    werte[werte.length - 1] === undefined))
                    werte.pop();
                for (let i = 0; i < wieOft; i++)
                    zeilen.push([...werte]);
            }
            /* Und unten dasselbe. */
            while (zeilen.length && !(zeilen[zeilen.length - 1] ?? []).length)
                zeilen.pop();
            blaetter.push({ name, zeilen });
        }
        return blaetter;
    };
    const xlsxLesen = async (puffer) => {
        const zip = await zipLesen(puffer);
        /* Gemeinsame Texte */
        const stText = await zip.text('xl/sharedStrings.xml');
        const gemeinsam = [];
        if (stText) {
            xml(stText).querySelectorAll('si').forEach(si => {
                gemeinsam.push([...si.querySelectorAll('t')].map(t => t.textContent ?? '').join(''));
            });
        }
        /* Blattnamen aus der Mappe */
        const wbText = await zip.text('xl/workbook.xml');
        const namen = [];
        if (wbText)
            xml(wbText).querySelectorAll('sheet').forEach(s => namen.push(s.getAttribute('name')));
        /* Jedes Blatt einlesen */
        const blaetter = [];
        const blattDateien = zip.namen.filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
            .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));
        for (let i = 0; i < blattDateien.length; i++) {
            const t = await zip.text(blattDateien[i]);
            if (!t)
                continue;
            const doc = xml(t);
            const zeilen = [];
            doc.querySelectorAll('row').forEach(row => {
                const werte = [];
                row.querySelectorAll('c').forEach(c => {
                    const spalte = spalteZuNummer(c.getAttribute('r') || '');
                    const typ = c.getAttribute('t');
                    let wert = '';
                    if (typ === 's') {
                        const idx = +(c.querySelector('v')?.textContent || -1);
                        wert = gemeinsam[idx] ?? '';
                    }
                    else if (typ === 'inlineStr') {
                        wert = [...c.querySelectorAll('t')].map(x => x.textContent).join('');
                    }
                    else {
                        wert = c.querySelector('v')?.textContent || '';
                    }
                    werte[spalte] = wert;
                });
                for (let k = 0; k < werte.length; k++)
                    if (werte[k] === undefined)
                        werte[k] = '';
                zeilen.push(werte);
            });
            blaetter.push({ name: namen[i] || ('Blatt ' + (i + 1)), zeilen });
        }
        return blaetter;
    };
    /* ========================================================================
     * WORD
     * ======================================================================*/
    const docxLesen = async (puffer) => {
        const zip = await zipLesen(puffer);
        const t = await zip.text('word/document.xml');
        if (!t)
            throw new Error('In dieser Datei steckt kein Word-Dokument.');
        const doc = xml(t);
        const bloecke = [];
        const koerper = doc.getElementsByTagName('w:body')[0] || doc.documentElement;
        for (const knoten of koerper.children) {
            const tag = knoten.tagName;
            if (tag === 'w:p') {
                const text = [...knoten.getElementsByTagName('w:t')].map(x => x.textContent).join('').trim();
                const stil = knoten.getElementsByTagName('w:pStyle')[0]?.getAttribute('w:val') || '';
                const nummeriert = knoten.getElementsByTagName('w:numPr').length > 0;
                if (!text)
                    continue;
                if (/^Heading1|^berschrift1|^Title/i.test(stil.replace(/\s/g, '')))
                    bloecke.push({ typ: 'h1', text });
                else if (/^Heading2|^berschrift2/i.test(stil.replace(/\s/g, '')))
                    bloecke.push({ typ: 'h2', text });
                else if (/^Heading[3-6]|^berschrift[3-6]/i.test(stil.replace(/\s/g, '')))
                    bloecke.push({ typ: 'h3', text });
                else if (/Quote|Zitat/i.test(stil))
                    bloecke.push({ typ: 'quote', text });
                else if (/ListNumber|ListeNummer|NummerierteListe/i.test(stil.replace(/\s/g, '')))
                    bloecke.push({ typ: 'number', text });
                else if (nummeriert || /List|Liste|Aufz/i.test(stil))
                    bloecke.push({ typ: 'bullet', text });
                else
                    bloecke.push({ typ: 'text', text });
            }
            if (tag === 'w:tbl') {
                const zeilen = [];
                for (const tr of knoten.getElementsByTagName('w:tr')) {
                    const zelle = [];
                    for (const tc of tr.getElementsByTagName('w:tc')) {
                        zelle.push([...tc.getElementsByTagName('w:t')].map(x => x.textContent).join('').trim());
                    }
                    if (zelle.length)
                        zeilen.push(zelle);
                }
                if (zeilen.length)
                    bloecke.push({ typ: 'table', rows: zeilen });
            }
        }
        return bloecke;
    };
    /* ========================================================================
     * EPUB
     * ======================================================================*/
    const epubLesen = async (puffer) => {
        const zip = await zipLesen(puffer);
        const container = await zip.text('META-INF/container.xml');
        let opfPfad = null;
        if (container)
            opfPfad = xml(container).querySelector('rootfile')?.getAttribute('full-path');
        if (!opfPfad)
            opfPfad = zip.namen.find((n) => n.endsWith('.opf'));
        if (!opfPfad)
            throw new Error('Das sieht nicht nach einem EPUB aus.');
        const opf = xml(await zip.text(opfPfad));
        const ordner = opfPfad.includes('/') ? opfPfad.slice(0, opfPfad.lastIndexOf('/') + 1) : '';
        const titel = opf.querySelector('title')?.textContent || 'Buch';
        /* Reihenfolge steht im spine, die Dateien im manifest */
        const karte = {};
        opf.querySelectorAll('manifest > item').forEach(it => { const id = it.getAttribute('id'); if (id)
            karte[id] = it.getAttribute('href'); });
        const kapitel = [];
        for (const ref of opf.querySelectorAll('spine > itemref')) {
            const href = karte[ref.getAttribute('idref') ?? ''];
            if (!href)
                continue;
            const inhalt = await zip.text(ordner + href.split('#')[0]);
            if (!inhalt)
                continue;
            const doc = new DOMParser().parseFromString(inhalt, 'text/html');
            const kTitel = doc.querySelector('h1,h2,title')?.textContent?.trim() ||
                ('Kapitel ' + (kapitel.length + 1));
            kapitel.push({ titel: kTitel, html: doc.body ? doc.body.innerHTML : inhalt });
        }
        return { titel, kapitel };
    };
    /* ========================================================================
     * IN DIE APP ÜBERNEHMEN
     * ======================================================================*/
    /** Eine Tabelle als Datenbank anlegen — erste Zeile ist die Kopfzeile. */
    const alsDatenbank = (seiteId, name, zeilen) => {
        const brauchbar = zeilen.filter((z) => z.some((x) => String(x).trim()));
        if (brauchbar.length < 2)
            return null;
        const kopf = (brauchbar[0] ?? []).map((x, i) => String(x).trim() || 'Spalte ' + (i + 1));
        const schema = { title: { name: kopf[0], type: 'title' } };
        const karte = ['title'];
        /* Typ raten: alles Zahlen? dann Zahl. Sieht aus wie Datum? dann Datum. */
        kopf.slice(1).forEach((n, i) => {
            const spalte = brauchbar.slice(1).map((z) => String(z[i + 1] ?? '').trim()).filter(Boolean);
            const alleZahlen = spalte.length && spalte.every((v) => /^-?[\d.,]+$/.test(v));
            const alleDaten = spalte.length && spalte.every((v) => /^\d{4}-\d{2}-\d{2}/.test(v));
            const k = 's' + i;
            schema[k] = { name: n, type: alleDaten ? 'date' : alleZahlen ? 'number' : 'text' };
            karte.push(k);
        });
        const { collectionId } = Store.addDatabase(seiteId, name, schema, 'table');
        brauchbar.slice(1).forEach((z) => {
            const props = {};
            karte.forEach((k, i) => {
                if (k === 'title')
                    return;
                let v = z[i] ?? '';
                if (schema[k].type === 'number')
                    v = parseFloat(String(v).replace(',', '.')) || 0;
                props[k] = v;
            });
            const r = Store.addRow(collectionId, props);
            Store.updateBlock(r.id, { text: String(z[0] ?? '') || 'Ohne Titel' });
        });
        return collectionId;
    };
    /** Eine Datei einlesen — erkennt das Format an der Endung. */
    const datei = async (f, elternId) => {
        const name = f.name.toLowerCase();
        const puffer = await f.arrayBuffer();
        if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) {
            const blaetter = await xlsxLesen(puffer);
            if (!blaetter.length)
                throw new Error('Keine Tabellenblätter gefunden.');
            const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📊' });
            let n = 0;
            blaetter.forEach(b => {
                Store.addBlock(seite.id, 'h2', { text: b.name });
                if (alsDatenbank(seite.id, b.name, b.zeilen))
                    n++;
                else
                    Store.addBlock(seite.id, 'text', { text: '(Blatt „' + b.name + '" war leer)' });
            });
            return { seite, hinweis: n + ' von ' + blaetter.length + ' Blättern als Datenbank angelegt' };
        }
        /* Dieselbe Behandlung wie .xlsx: ein Blatt wird eine Datenbank. Wer eine
           Tabelle einliest, will damit rechnen und filtern können — nicht ein
           Bild davon. */
        if (name.endsWith('.ods')) {
            const blaetter = await odsLesen(puffer);
            if (!blaetter.length)
                throw new Error('Keine Tabellenblätter gefunden.');
            const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📊' });
            let n = 0;
            blaetter.forEach(b => {
                Store.addBlock(seite.id, 'h2', { text: b.name });
                if (alsDatenbank(seite.id, b.name, b.zeilen))
                    n++;
                else
                    Store.addBlock(seite.id, 'text', { text: '(Blatt „' + b.name + '" war leer)' });
            });
            return { seite, hinweis: n + ' von ' + blaetter.length + ' Blättern als Datenbank angelegt' };
        }
        if (name.endsWith('.docx')) {
            const bloecke = await docxLesen(puffer);
            const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📄' });
            bloecke.forEach((b) => {
                if (b.typ === 'table')
                    Store.addBlock(seite.id, 'table', { rows: b.rows, kopfZeile: true });
                else
                    Store.addBlock(seite.id, b.typ, { text: b.text });
            });
            return { seite, hinweis: bloecke.length + ' Absätze übernommen' };
        }
        if (name.endsWith('.epub')) {
            const buch = await epubLesen(puffer);
            const seite = Store.addPage(elternId, { text: buch.titel, icon: '📚', wiki: true });
            buch.kapitel.forEach((k) => {
                const kap = Store.addPage(seite.id, { text: k.titel, icon: '📖' });
                Werkzeuge.ausHtml(kap.id, k.html);
            });
            Store.updateBlock(seite.id, { aufgeklappt: true });
            return { seite, hinweis: buch.kapitel.length + ' Kapitel als Unterseiten angelegt' };
        }
        return null;
    };
    return { zipLesen, zipLesenAusBlob, xlsxLesen, odsLesen, docxLesen, epubLesen,
        alsDatenbank, datei };
})();
window.Einlesen = Einlesen;
