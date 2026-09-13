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
            /* Flags und Prüfsumme standen hier immer — gelesen wurden sie nie (E363). */
            const flags = d.getUint16(zeiger + 8, true);
            const crc = d.getUint32(zeiger + 16, true);
            const nameLaenge = d.getUint16(zeiger + 28, true);
            const extra = d.getUint16(zeiger + 30, true);
            const kommentar = d.getUint16(zeiger + 32, true);
            const name = ZipDetails.nameDecodieren(bytes.subarray(zeiger + 46, zeiger + 46 + nameLaenge), flags);
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
            dateien.set(name, { methode, roh, flags, crc, groesse: echt.roh });
            zeiger += 46 + nameLaenge + extra + kommentar;
        }
        vollzaehlig(anzahl, dateien.size);
        /* Entpacken übernimmt der Browser — und DANACH wird nachgerechnet (E363):
           ein Eintrag, dessen Bytes nicht zur Prüfsumme passen, ist beschädigt
           und kommt nicht als Datei heraus. Ein verschlüsselter kommt gar nicht
           erst in den Entpacker. */
        const holen = async (name) => {
            const e = dateien.get(name);
            if (!e)
                return null;
            if (ZipDetails.istVerschluesselt(e.flags))
                throw new Error('„' + name + '" ist verschlüsselt — Redion kann keine verschlüsselten ZIP-Einträge lesen.');
            let ergebnis;
            if (e.methode === 0)
                ergebnis = new Uint8Array(e.roh);
            else {
                if (e.methode !== 8)
                    throw new Error('Diese Packmethode kennt der Browser nicht.');
                if (!self.DecompressionStream)
                    throw new Error('Dieser Browser kann kein ZIP entpacken.');
                const strom = new Blob([e.roh]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
                ergebnis = new Uint8Array(await new Response(strom).arrayBuffer());
            }
            if (ZipDetails.crc32(ergebnis) !== (e.crc >>> 0))
                throw new Error('„' + name + '" ist beschädigt — die Prüfsumme stimmt nicht.');
            return ergebnis;
        };
        const eintrag = (name) => {
            const e = dateien.get(name);
            return e ? { methode: e.methode, groesse: e.groesse, crc: e.crc >>> 0, flags: e.flags,
                verschluesselt: ZipDetails.istVerschluesselt(e.flags) } : null;
        };
        const text = async (name) => {
            const b = await holen(name);
            return b ? new TextDecoder().decode(b) : null;
        };
        /**
         * DIE BYTES, WIE SIE IM ARCHIV STEHEN — ungepackt gelassen.
         *
         * `holen` entpackt immer. Für eine Rundreise ist das falsch: wer eine
         * `.docx` öffnet, EINEN Eintrag ändert und den Rest zurückschreiben
         * will, müsste sonst jeden fremden Eintrag entpacken und neu ablegen.
         * Der Schreiber packt nicht (Methode 0), aus einer 40-KB-Vorlage würde
         * damit eine 300-KB-Datei — gültig, aber ohne Not aufgebläht, und
         * jedes eingebettete Bild läge unkomprimiert darin.
         *
         * Hier kommen die Bytes deshalb unberührt heraus, mit allem, was der
         * Schreiber braucht, um sie wieder einzusetzen: Methode, Prüfsumme,
         * Rohgrösse. Es wird NICHT nachgerechnet — die Bytes werden ja nicht
         * gelesen, sondern weitergereicht; die Prüfsumme des Originals bleibt
         * gültig, solange die Bytes gleich bleiben.
         *
         * Verschlüsselte Einträge kommen auch hier nicht heraus: sie ohne
         * Schlüssel weiterzureichen ergäbe ein Archiv, das niemand öffnen kann.
         */
        const rohBytes = (name) => {
            const e = dateien.get(name);
            if (!e)
                return null;
            if (ZipDetails.istVerschluesselt(e.flags))
                throw new Error('„' + name + '" ist verschlüsselt — Redion kann ihn nicht weiterreichen.');
            return { methode: e.methode, roh: new Uint8Array(e.roh), crc: e.crc >>> 0,
                groesse: e.groesse, gepackt: e.roh.length };
        };
        return { namen: [...dateien.keys()], holen, text, eintrag, rohBytes };
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
            const flags = vz.getUint16(zeiger + 8, true);
            const crc = vz.getUint32(zeiger + 16, true);
            const nameLaenge = vz.getUint16(zeiger + 28, true);
            const extra = vz.getUint16(zeiger + 30, true);
            const kommentar = vz.getUint16(zeiger + 32, true);
            const name = ZipDetails.nameDecodieren(vzBytes.subarray(zeiger + 46, zeiger + 46 + nameLaenge), flags);
            const echt = zip64Zusatz(vz, zeiger + 46 + nameLaenge, extra, vz.getUint32(zeiger + 24, true), vz.getUint32(zeiger + 20, true), vz.getUint32(zeiger + 42, true));
            dateien.set(name, { methode, gepackt: echt.gepackt, roh: echt.roh, offset: echt.versatz, flags, crc });
            zeiger += 46 + nameLaenge + extra + kommentar;
        }
        vollzaehlig(anzahl, dateien.size);
        /* Die Längen der Zusatzfelder stehen am lokalen Kopf noch einmal, und
           zwar oft anders als im Verzeichnis. Wer das Verzeichnis glaubt, liest
           um ein paar Byte verschoben — und bekommt Daten, die fast stimmen. */
        /* DIE PRÜFSUMME SCHEIBCHENWEISE (E363): ein Blob liegt beim Browser,
           nicht im Arbeitsspeicher — geprüft wird er in Stücken von einem
           Megabyte, wie der Schreiber ihn rechnet. Ein beschädigter Eintrag
           kam vorher als vollständige Datei heraus, still. */
        const SCHEIBE = 1024 * 1024;
        const pruefsumme = async (name, b, soll) => {
            let z = ZipDetails.crc32Start();
            for (let von = 0; von < b.size; von += SCHEIBE)
                z = ZipDetails.crc32Weiter(z, new Uint8Array(await b.slice(von, Math.min(von + SCHEIBE, b.size)).arrayBuffer()));
            if (ZipDetails.crc32Fertig(z) !== (soll >>> 0))
                throw new Error('„' + name + '" ist beschädigt — die Prüfsumme stimmt nicht.');
        };
        const alsBlob = async (name) => {
            const e = dateien.get(name);
            if (!e)
                return null;
            if (ZipDetails.istVerschluesselt(e.flags))
                throw new Error('„' + name + '" ist verschlüsselt — Redion kann keine verschlüsselten ZIP-Einträge lesen.');
            const k = new DataView(await blob.slice(e.offset, e.offset + 30).arrayBuffer());
            const lokalName = k.getUint16(26, true);
            const lokalExtra = k.getUint16(28, true);
            const start = e.offset + 30 + lokalName + lokalExtra;
            const roh = blob.slice(start, start + e.gepackt);
            let ergebnis;
            if (e.methode === 0)
                ergebnis = roh;
            else {
                if (e.methode !== 8)
                    throw new Error('Diese Packmethode kennt der Browser nicht.');
                if (!self.DecompressionStream)
                    throw new Error('Dieser Browser kann kein ZIP entpacken.');
                const strom = roh.stream().pipeThrough(new DecompressionStream('deflate-raw'));
                ergebnis = await new Response(strom).blob();
            }
            await pruefsumme(name, ergebnis, e.crc);
            return ergebnis;
        };
        const holen = async (name) => {
            const b = await alsBlob(name);
            return b ? new Uint8Array(await b.arrayBuffer()) : null;
        };
        const text = async (name) => {
            const b = await alsBlob(name);
            return b ? await b.text() : null;
        };
        /* DIE ROHGRÖSSE VOR DEM ENTPACKEN (E350). Sie steht im Verzeichnis; wer
           sie kennt, schickt einen Eintrag, der 1 KB gepackt und 10 GB roh ist,
           gar nicht erst durch den Entpacker. -1 heisst: unbekannt. */
        const groesse = (name) => {
            const e = dateien.get(name);
            return e && Number.isFinite(Number(e.roh)) ? Number(e.roh) : -1;
        };
        /** Was das Verzeichnis über einen Eintrag sagt — vor dem ersten Byte (E363). */
        const eintrag = (name) => {
            const e = dateien.get(name);
            return e ? { methode: e.methode, groesse: Number(e.roh), gepackt: Number(e.gepackt), crc: e.crc >>> 0,
                flags: e.flags, verschluesselt: ZipDetails.istVerschluesselt(e.flags) } : null;
        };
        /**
         * Dasselbe Durchreichen wie in `zipLesen`, nur als Blob — hier liegt das
         * Archiv nicht im Speicher, und ein Video als `Uint8Array` wäre genau
         * der Sturz, den dieser Leser vermeidet. Der Schreiber nimmt Blobs
         * ohnehin entgegen, ohne sie ganz zu laden.
         */
        const rohBytes = async (name) => {
            const e = dateien.get(name);
            if (!e)
                return null;
            if (ZipDetails.istVerschluesselt(e.flags))
                throw new Error('„' + name + '" ist verschlüsselt — Redion kann ihn nicht weiterreichen.');
            const k = new DataView(await blob.slice(e.offset, e.offset + 30).arrayBuffer());
            const start = e.offset + 30 + k.getUint16(26, true) + k.getUint16(28, true);
            return { methode: e.methode, roh: blob.slice(start, start + e.gepackt), crc: e.crc >>> 0,
                groesse: Number(e.roh), gepackt: Number(e.gepackt) };
        };
        return { namen: [...dateien.keys()], alsBlob, holen, text, groesse, eintrag, rohBytes };
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
    const neuerTabellenBericht = () => ({
        formeln: 0,
        ausgelassen: {
            formelnOhneAusdruck: 0, kommentare: 0, bedingteFormatierungen: 0,
            bilder: 0, diagramme: 0, makros: 0, zellformate: 0,
            verbundeneZellen: 0
        }
    });
    const berichtAn = (blaetter, bericht) => {
        blaetter.bericht = bericht;
        return blaetter;
    };
    /** Nutzertext für die Vorschau vor der ersten Mutation. */
    const tabellenBerichtText = (bericht) => {
        if (!bericht)
            return '';
        const namen = {
            formelnOhneAusdruck: 'Formeln ohne Redion-kompatiblen Ausdruck',
            kommentare: 'Zellkommentare',
            bedingteFormatierungen: 'bedingte Formatierungen',
            bilder: 'Bilder', diagramme: 'Diagramme', makros: 'Makros',
            zellformate: 'nicht unterstützte Zellformate',
            verbundeneZellen: 'verbundene Zellen'
        };
        const verloren = Object.entries(bericht.ausgelassen || {})
            .filter(([, n]) => Number(n) > 0)
            .map(([k, n]) => `${n} ${namen[k] || k}`);
        const teile = [];
        if (bericht.formeln)
            teile.push(`${bericht.formeln} Formeln werden als Formeln übernommen`);
        if (verloren.length)
            teile.push('Nicht übernommen: ' + verloren.join(' · '));
        return teile.join('\n');
    };
    /** Ziel eines OPC-Bezugs relativ zur Quelldatei normalisieren. */
    const paketZiel = (quelle, ziel) => {
        if (ziel.startsWith('/'))
            return ziel.replace(/^\/+/, '');
        const teile = quelle.split('/');
        teile.pop();
        for (const t of ziel.replace(/\\/g, '/').split('/')) {
            if (!t || t === '.')
                continue;
            if (t === '..')
                teile.pop();
            else
                teile.push(t);
        }
        return teile.join('/');
    };
    /** ODF-Zellbezüge zurück in Redions A1-Schreibweise. */
    const formelAussen = (text, aendere) => {
        let raus = '', frei = '', i = 0;
        const freiLeeren = () => { raus += aendere(frei); frei = ''; };
        while (i < text.length) {
            const c = text[i] ?? '';
            if (c !== '"') {
                frei += c;
                i++;
                continue;
            }
            freiLeeren();
            raus += c;
            i++;
            while (i < text.length) {
                const innen = text[i] ?? '';
                raus += innen;
                i++;
                if (innen !== '"')
                    continue;
                if (text[i] === '"') {
                    raus += '"';
                    i++;
                    continue;
                }
                break;
            }
        }
        freiLeeren();
        return raus;
    };
    const formelAusOds = (roh) => {
        let f = String(roh ?? '').trim();
        if (!f)
            return null;
        f = f.replace(/^[A-Za-z0-9_-]+:=/, '');
        f = formelAussen(f, teil => teil
            .replace(/\[\.(\$?[A-Z]{1,3}\$?\d+):\.(\$?[A-Z]{1,3}\$?\d+)\]/g, '$1:$2')
            .replace(/\[\.(\$?[A-Z]{1,3}\$?\d+)\]/g, '$1'));
        /* Blatt-, Datei- und Matrixbezüge in eckigen Klammern gehören nicht zu
           Redions Formelmodell. Den zwischengespeicherten Wert behalten wir,
           aber behaupten im Bericht nicht, der Ausdruck sei übernommen. */
        if (formelAussen(f, teil => /[\[\]]/.test(teil) ? '[' : '').includes('['))
            return null;
        return '=' + f.replace(/^=/, '');
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
        const bericht = neuerTabellenBericht();
        const text = await zip.text('content.xml');
        if (!text)
            throw new Error('Diese .ods-Datei hat keine content.xml — ' +
                'entweder ist sie beschädigt oder es ist keine.');
        const doc = xml(text);
        bericht.ausgelassen.bilder = zip.namen.filter((n) => /^Pictures\/.+/.test(n)).length;
        bericht.ausgelassen.diagramme = doc.getElementsByTagName('draw:object').length;
        bericht.ausgelassen.makros = zip.namen.filter((n) => /^(Basic|Scripts)\//.test(n)).length;
        bericht.ausgelassen.kommentare = doc.getElementsByTagName('office:annotation').length;
        bericht.ausgelassen.bedingteFormatierungen = doc.getElementsByTagName('style:map').length;
        bericht.ausgelassen.verbundeneZellen = [...doc.getElementsByTagName('table:table-cell')]
            .filter(c => +(c.getAttribute('table:number-columns-spanned') || 1) > 1 ||
            +(c.getAttribute('table:number-rows-spanned') || 1) > 1).length;
        /* Die Zellstile (E97) aus den automatic-styles — übernommen wird, was
           Redion kennt: fett, kursiv, Ausrichtung, Prozent, Währung. */
        const zellStil = new Map();
        const zellStilVerlust = new Set();
        {
            const daten = new Map();
            for (const n of [...doc.getElementsByTagName('number:percentage-style')]) {
                const dp = +(n.getElementsByTagName('number:number')[0]
                    ?.getAttribute('number:decimal-places') || 0);
                daten.set(n.getAttribute('style:name') || '', { art: 'prozent', stellen: dp });
            }
            for (const n of [...doc.getElementsByTagName('number:currency-style')]) {
                const dp = +(n.getElementsByTagName('number:number')[0]
                    ?.getAttribute('number:decimal-places') || 0);
                const sym = (n.getElementsByTagName('number:currency-symbol')[0]
                    ?.textContent || 'CHF').trim();
                daten.set(n.getAttribute('style:name') || '', { art: 'waehrung', stellen: dp, waehrung: sym });
            }
            for (const s of [...doc.getElementsByTagName('style:style')]) {
                if (s.getAttribute('style:family') !== 'table-cell')
                    continue;
                const stilName = s.getAttribute('style:name') || '';
                const st = {};
                const schrift = s.getElementsByTagName('style:text-properties')[0];
                if (schrift?.getAttribute('fo:font-weight') === 'bold')
                    st.fett = true;
                if (schrift?.getAttribute('fo:font-style') === 'italic')
                    st.kursiv = true;
                const absatz = s.getElementsByTagName('style:paragraph-properties')[0];
                const quer = absatz?.getAttribute('fo:text-align') || '';
                if (quer === 'start' || quer === 'left')
                    st.ausrichtung = 'links';
                if (quer === 'center')
                    st.ausrichtung = 'mitte';
                if (quer === 'end' || quer === 'right')
                    st.ausrichtung = 'rechts';
                const dsn = s.getAttribute('style:data-style-name');
                if (dsn && daten.has(dsn))
                    st.format = daten.get(dsn);
                if (Object.keys(st).length)
                    zellStil.set(stilName, st);
                const zellEig = s.getElementsByTagName('style:table-cell-properties')[0];
                if ((schrift && [...schrift.attributes].some(a => !['fo:font-weight', 'fo:font-style'].includes(a.name))) ||
                    (zellEig && zellEig.attributes.length) ||
                    (absatz && [...absatz.attributes].some(a => a.name !== 'fo:text-align')) ||
                    (dsn && !daten.has(dsn)))
                    zellStilVerlust.add(stilName);
            }
        }
        /* `getElementsByTagName` mit dem vollen Namen: `querySelectorAll` kommt
           mit dem Doppelpunkt im Namensraum nicht zurecht. */
        const tabellen = [...doc.getElementsByTagName('table:table')];
        const blaetter = [];
        for (const tab of tabellen) {
            const name = tab.getAttribute('table:name') || 'Blatt';
            const zeilen = [];
            const stile = [];
            const formeln = [];
            for (const row of [...tab.getElementsByTagName('table:table-row')]) {
                const wieOft = Math.min(Number(row.getAttribute('table:number-rows-repeated') || 1) || 1, ODS_MAX_WIEDERHOLUNG);
                const werte = [];
                const stilWerte = [];
                const formelWerte = [];
                for (const c of [...row.getElementsByTagName('table:table-cell')]) {
                    const malSo = Math.min(Number(c.getAttribute('table:number-columns-repeated') || 1) || 1, ODS_MAX_WIEDERHOLUNG);
                    const zahl = c.getAttribute('office:value');
                    const absatzIstKommentar = (p) => {
                        let el = p.parentElement;
                        while (el && el !== c) {
                            if (el.localName === 'annotation' || el.tagName === 'office:annotation')
                                return true;
                            el = el.parentElement;
                        }
                        return false;
                    };
                    const wert = zahl !== null && zahl !== ''
                        ? Number(zahl)
                        : [...c.getElementsByTagName('text:p')]
                            .filter(p => !absatzIstKommentar(p))
                            .map(x => x.textContent ?? '').join('\n');
                    const stName = c.getAttribute('table:style-name');
                    const st = stName ? (zellStil.get(stName) ?? null) : null;
                    const formelAttribut = c.getAttribute('table:formula');
                    const formel = formelAttribut ? formelAusOds(formelAttribut) : null;
                    const vorkommen = malSo * wieOft;
                    if (formelAttribut) {
                        if (formel)
                            bericht.formeln += vorkommen;
                        else
                            bericht.ausgelassen.formelnOhneAusdruck += vorkommen;
                    }
                    if (stName && zellStilVerlust.has(stName))
                        bericht.ausgelassen.zellformate += vorkommen;
                    for (let i = 0; i < malSo; i++) {
                        werte.push(wert);
                        stilWerte.push(st);
                        formelWerte.push(formel);
                    }
                }
                /* Rechts abschneiden, was leer ist — sonst schleppt jede Zeile die
                   ausgerollten Wiederholungen mit. Die Stile laufen synchron. */
                while (werte.length && (werte[werte.length - 1] === '' ||
                    werte[werte.length - 1] === undefined) &&
                    !formelWerte[werte.length - 1] && !stilWerte[werte.length - 1])
                    werte.pop();
                stilWerte.length = werte.length;
                formelWerte.length = werte.length;
                for (let i = 0; i < wieOft; i++) {
                    zeilen.push([...werte]);
                    stile.push([...stilWerte]);
                    formeln.push([...formelWerte]);
                }
            }
            /* Und unten dasselbe. */
            while (zeilen.length && !(zeilen[zeilen.length - 1] ?? []).length)
                zeilen.pop();
            stile.length = zeilen.length;
            formeln.length = zeilen.length;
            blaetter.push({ name, zeilen, stile, formeln });
        }
        return berichtAn(blaetter, bericht);
    };
    const xlsxLesen = async (puffer) => {
        const zip = await zipLesen(puffer);
        const bericht = neuerTabellenBericht();
        bericht.ausgelassen.bilder = zip.namen.filter((n) => /^xl\/media\/.+/.test(n)).length;
        bericht.ausgelassen.diagramme = zip.namen.filter((n) => /^xl\/charts\/.+\.xml$/i.test(n)).length;
        bericht.ausgelassen.makros = zip.namen.filter((n) => /vbaProject\.bin$/i.test(n)).length;
        for (const name of zip.namen.filter((n) => /^xl\/comments\d*\.xml$/i.test(n))) {
            const kommentarText = await zip.text(name);
            if (kommentarText)
                bericht.ausgelassen.kommentare += xml(kommentarText).querySelectorAll('comment').length;
        }
        /* Gemeinsame Texte */
        const stText = await zip.text('xl/sharedStrings.xml');
        const gemeinsam = [];
        if (stText) {
            xml(stText).querySelectorAll('si').forEach(si => {
                gemeinsam.push([...si.querySelectorAll('t')].map(t => t.textContent ?? '').join(''));
            });
        }
        /* Die Zellstile (E97): cellXfs verweisen auf Schriften und
           Zahlenformate. Übernommen wird, was Redion selbst kennt —
           fett, kursiv, Ausrichtung, Prozent, Währung. Der Rest der
           styles.xml (Farben, Rahmen, Füllungen) bleibt bewusst liegen. */
        const stilText = await zip.text('xl/styles.xml');
        let xfListe = [];
        let xfVerlust = [];
        if (stilText) {
            const sdoc = xml(stilText);
            const schriften = [...sdoc.querySelectorAll('fonts > font')].map(f => ({
                fett: !!f.querySelector('b'), kursiv: !!f.querySelector('i')
            }));
            const eigene = new Map();
            sdoc.querySelectorAll('numFmts > numFmt').forEach(n => eigene.set(n.getAttribute('numFmtId') || '', n.getAttribute('formatCode') || ''));
            const formatVon = (id) => {
                if (!id)
                    return undefined;
                /* 9 und 10 sind Excels eingebaute Prozentformate. */
                if (id === 9)
                    return { art: 'prozent', stellen: 0 };
                if (id === 10)
                    return { art: 'prozent', stellen: 2 };
                const code = eigene.get(String(id)) || '';
                if (!code)
                    return undefined;
                if (code.includes('%')) {
                    const m = /0\.(0+)%/.exec(code);
                    return { art: 'prozent', stellen: m && m[1] ? m[1].length : 0 };
                }
                const w = /"([^"]+)"/.exec(code);
                if (w && w[1]) {
                    const m = /0\.(0+)/.exec(code);
                    return { art: 'waehrung', stellen: m && m[1] ? m[1].length : 0,
                        waehrung: w[1].trim() };
                }
                return undefined;
            };
            xfListe = [...sdoc.querySelectorAll('cellXfs > xf')].map(x => {
                const schrift = schriften[+(x.getAttribute('fontId') || 0)] ||
                    { fett: false, kursiv: false };
                const quer = x.querySelector('alignment')?.getAttribute('horizontal') || '';
                const aus = quer === 'left' ? 'links' : quer === 'center' ? 'mitte'
                    : quer === 'right' ? 'rechts' : undefined;
                const format = formatVon(+(x.getAttribute('numFmtId') || 0));
                const st = {};
                if (schrift.fett)
                    st.fett = true;
                if (schrift.kursiv)
                    st.kursiv = true;
                if (aus)
                    st.ausrichtung = aus;
                if (format)
                    st.format = format;
                return Object.keys(st).length ? st : null;
            });
            xfVerlust = [...sdoc.querySelectorAll('cellXfs > xf')].map(x => {
                const numFmtId = +(x.getAttribute('numFmtId') || 0);
                const originalFont = sdoc.querySelectorAll('fonts > font')[+(x.getAttribute('fontId') || 0)];
                const ausrichtung = x.querySelector('alignment');
                const unbekannteAusrichtung = !!ausrichtung && [...ausrichtung.attributes]
                    .some(a => a.name !== 'horizontal');
                const unbekannteSchrift = !!originalFont && !!originalFont.querySelector('color,u,strike,vertAlign');
                return +(x.getAttribute('fillId') || 0) > 0 ||
                    +(x.getAttribute('borderId') || 0) > 0 ||
                    !!x.querySelector('protection') || unbekannteAusrichtung ||
                    unbekannteSchrift || (!!numFmtId && !formatVon(numFmtId));
            });
        }
        /* Blattnamen UND ihre echten OPC-Beziehungen aus der Mappe. `sheet1.xml`
           muss nicht Blatt 1 sein; fremde Schreiber dürfen beliebige Dateinamen
           und Relationship-Reihenfolgen verwenden. Die alte numerische Sortierung
           konnte deshalb Namen und Inhalt vertauschen. */
        const wbText = await zip.text('xl/workbook.xml');
        const meta = [];
        if (wbText)
            xml(wbText).querySelectorAll('sheet').forEach(s => meta.push({
                name: s.getAttribute('name') || '',
                id: s.getAttribute('r:id') ||
                    s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || ''
            }));
        const beziehungen = new Map();
        const relText = await zip.text('xl/_rels/workbook.xml.rels');
        if (relText)
            xml(relText).querySelectorAll('Relationship').forEach(r => {
                if (r.getAttribute('TargetMode') === 'External')
                    return;
                const id = r.getAttribute('Id') || '';
                const ziel = r.getAttribute('Target') || '';
                if (id && ziel)
                    beziehungen.set(id, paketZiel('xl/workbook.xml', ziel));
            });
        /* Jedes Blatt einlesen */
        const blaetter = [];
        const rueckfall = zip.namen.filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
            .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));
        const blattDateien = meta.length
            ? meta.map((m, i) => ({ name: m.name || ('Blatt ' + (i + 1)),
                datei: beziehungen.get(m.id) || rueckfall[i] || '' }))
                .filter(x => !!x.datei && zip.namen.includes(x.datei))
            : rueckfall.map((datei, i) => ({ name: 'Blatt ' + (i + 1), datei }));
        for (let i = 0; i < blattDateien.length; i++) {
            const quelle = blattDateien[i];
            const t = await zip.text(quelle.datei);
            if (!t)
                continue;
            const doc = xml(t);
            const zeilen = [];
            const stile = [];
            const formeln = [];
            bericht.ausgelassen.bedingteFormatierungen += doc.querySelectorAll('conditionalFormatting').length;
            bericht.ausgelassen.verbundeneZellen += doc.querySelectorAll('mergeCell').length;
            doc.querySelectorAll('row').forEach(row => {
                const werte = [];
                const stilWerte = [];
                const formelWerte = [];
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
                    const sIx = c.getAttribute('s');
                    stilWerte[spalte] = sIx !== null ? (xfListe[+sIx] ?? null) : null;
                    if (sIx !== null && xfVerlust[+sIx])
                        bericht.ausgelassen.zellformate++;
                    const f = c.querySelector('f');
                    if (f) {
                        const ausdruck = (f.textContent || '').trim();
                        formelWerte[spalte] = ausdruck ? '=' + ausdruck : null;
                        if (ausdruck)
                            bericht.formeln++;
                        else
                            bericht.ausgelassen.formelnOhneAusdruck++;
                    }
                    else
                        formelWerte[spalte] = null;
                });
                for (let k = 0; k < werte.length; k++) {
                    if (werte[k] === undefined)
                        werte[k] = '';
                    if (stilWerte[k] === undefined)
                        stilWerte[k] = null;
                    if (formelWerte[k] === undefined)
                        formelWerte[k] = null;
                }
                stile.push(stilWerte);
                formeln.push(formelWerte);
                zeilen.push(werte);
            });
            blaetter.push({ name: quelle.name, zeilen, stile, formeln });
        }
        return berichtAn(blaetter, bericht);
    };
    /* ========================================================================
     * WORD
     * ======================================================================*/
    /**
     * EIN ABSATZ MIT SEINER AUSZEICHNUNG (L72 Teil 2, E315).
     *
     * Hier stand `[...getElementsByTagName('w:t')].map(…).join('')` — nur der
     * Text. Fett und kursiv standen in `w:rPr` daneben und wurden
     * weggeworfen; wer eine Word-Datei einlas, bekam eine graue Wand.
     *
     * Gelesen wird je LAUF, und zurückgeschrieben über denselben Kern, den
     * der Export benutzt (`core/text/inline.ts`). Damit passen die beiden
     * Richtungen zusammen — das ist der ganze Grund, warum der Kern
     * überhaupt einer ist.
     *
     * `w:tab` und `w:br` sind keine Läufe, sondern Zeichen: ohne sie klebt
     * das Wort davor am Wort danach.
     */
    const absatzText = (absatz) => {
        const laeufe = [];
        for (const r of absatz.getElementsByTagName('w:r')) {
            const eig = r.getElementsByTagName('w:rPr')[0];
            /* `w:b w:val="0"` heisst AUSDRÜCKLICH nicht fett — Word schreibt das,
               wenn eine Vorlage fett ist und ein Lauf es zurücknimmt. */
            const an = (name) => {
                const e = eig?.getElementsByTagName('w:' + name)[0];
                if (!e)
                    return false;
                const v = e.getAttribute('w:val');
                return v !== '0' && v !== 'false' && v !== 'none';
            };
            let text = '';
            for (const kind of r.children) {
                if (kind.tagName === 'w:t')
                    text += kind.textContent || '';
                else if (kind.tagName === 'w:tab')
                    text += '\t';
                else if (kind.tagName === 'w:br')
                    text += ' ';
            }
            if (!text)
                continue;
            /* FESTE BREITE IST AUCH EINE AUSZEICHNUNG. Der Export schreibt für
               `code` ein `w:rFonts w:ascii="Consolas"`; wer sie hier nicht
               zurückliest, verliert sie beim Rundlauf — und die beiden
               Richtungen laufen genau da auseinander, wo der gemeinsame Kern sie
               zusammenhalten sollte.
               Erkannt wird die FAMILIE, nicht der eine Name: eine Word-Datei aus
               fremder Hand schreibt „Courier New" oder „Consolas", nicht das,
               was Redion schreibt. */
            const schrift = String(eig?.getElementsByTagName('w:rFonts')[0]
                ?.getAttribute('w:ascii') || '');
            const fest = /consol|courier|mono|menlo|liberation mono/i.test(schrift);
            laeufe.push({ text, fett: an('b'), kursiv: an('i'), durch: an('strike'),
                code: fest });
        }
        /* Gleich ausgezeichnete Nachbarn zusammenlegen: Word zerschneidet einen
           Satz gern in fünf Läufe, und `**a****b**` wäre daraus geworden. */
        const glatt = [];
        for (const l of laeufe) {
            const vor = glatt[glatt.length - 1];
            if (vor && vor.fett === l.fett && vor.kursiv === l.kursiv &&
                vor.durch === l.durch && vor.code === l.code)
                vor.text += l.text;
            else
                glatt.push({ ...l });
        }
        return Inline.schreiben(glatt).trim();
    };
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
                const text = absatzText(knoten);
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
     * POWERPOINT (.pptx)
     * ------------------------------------------------------------------------
     * EINE FOLIE IST EIN `blatt`-BLOCK. Kein neuer Blocktyp: das A4-Blatt
     * trägt bereits `blattBreite`/`blattHoehe` und die Zeichenschicht
     * `Marken` (E103) — und damit Textkästen mit Schrift und Rahmen, Bilder
     * mit eigener Datei, Verschieben, Drehen, Sperren und hundert Schritte
     * rückgängig. Eine zweite Maschine für dieselbe Frage wäre der zweite
     * Katalog aus §8, und der zweite ist immer der schlechtere.
     *
     * DAS MASS. PowerPoint rechnet in EMU (English Metric Units), 914400 je
     * Zoll. Redions Marken rechnen in Blattpunkten, 72 je Zoll. Das sind
     * genau 12700 EMU je Punkt — eine ganze Zahl, kein Rundungsfehler.
     * Schriftgrade stehen in Hundertstelpunkten (`sz="2800"` = 28 pt).
     *
     * WAS HIER NICHT PASSIERT. Es wird nichts gerendert und nichts geraten:
     * gelesen werden die Formen, die im Folien-XML wirklich stehen. Was eine
     * Folie vom Layout oder vom Master ERBT — Hintergründe, Platzhaltertexte,
     * Fusszeilen — steht dort nicht und kommt hier deshalb auch nicht an. Das
     * ist als Lücke eingetragen, nicht stillschweigend weggelassen.
     * ======================================================================*/
    /** EMU → Blattpunkte. 914400 EMU je Zoll, 72 Punkte je Zoll. */
    const emuZuPunkt = (wert) => Math.round((Number(wert) || 0) / 12700 * 100) / 100;
    /** Die Beziehungen einer Teildatei: r:id → Ziel, schon aufgelöst. */
    const relsLesen = async (zip, teil) => {
        const schraeg = teil.lastIndexOf('/');
        const ordner = schraeg < 0 ? '' : teil.slice(0, schraeg);
        const pfad = (ordner ? ordner + '/' : '') + '_rels/' +
            teil.slice(schraeg + 1) + '.rels';
        const t = await zip.text(pfad);
        const karte = {};
        if (!t)
            return karte;
        for (const r of xml(t).getElementsByTagName('Relationship')) {
            const id = r.getAttribute('Id');
            let ziel = r.getAttribute('Target') || '';
            if (!id || !ziel)
                continue;
            /* Ziele stehen relativ zur Teildatei. `../media/bild1.png` von
               `ppt/slides/` aus ist `ppt/media/bild1.png`. Ohne das Auflösen
               fände der Leser kein einziges Bild. */
            if (!ziel.startsWith('/')) {
                const teile = (ordner ? ordner.split('/') : []);
                for (const stueck of ziel.split('/')) {
                    if (stueck === '..')
                        teile.pop();
                    else if (stueck !== '.')
                        teile.push(stueck);
                }
                ziel = teile.join('/');
            }
            else
                ziel = ziel.slice(1);
            karte[id] = ziel;
        }
        return karte;
    };
    /**
     * DER ERSTE LAUF EINES ABSATZES BESTIMMT SEIN FORMAT — nicht der erste
     * Lauf des ganzen KASTENS (E557).
     *
     * Hier stand `txBody.getElementsByTagName('a:rPr')[0]`, also der erste
     * Lauf der ersten Zeile, für alles. Gemessen an einer eigens gebauten
     * Datei: „klein"(12 pt) + „GROSS"(36 pt, fett, blau) kam als EINE Marke
     * „klein GROSS" in 12 pt normal an; ein roter Titel (`srgbClr CC0000`)
     * kam schwarz; drei Aufzählungsebenen kamen als flacher Block.
     *
     * INNERHALB eines Absatzes bleibt es beim ersten Lauf — Redions Textmarke
     * hat genau einen Grad, und das ist eine Lücke, keine Nachlässigkeit
     * (L151). Ein Absatz ist aber die Einheit, die ein Mensch als „Zeile mit
     * eigenem Aussehen" sieht, und die ist jetzt erreichbar.
     */
    const absaetzeLesen = (txBody) => {
        const raus = [];
        for (const absatz of txBody.getElementsByTagName('a:p')) {
            let text = '';
            for (const kind of absatz.children) {
                if (kind.tagName === 'a:r')
                    text += kind.getElementsByTagName('a:t')[0]?.textContent || '';
                else if (kind.tagName === 'a:br')
                    text += '\n';
                else if (kind.tagName === 'a:fld')
                    text += kind.getElementsByTagName('a:t')[0]?.textContent || '';
            }
            const pPr = [...absatz.children].find(k => k.tagName === 'a:pPr');
            /* Der erste ECHTE Lauf, nicht der erste `a:rPr` überhaupt: `a:pPr`
               trägt ein `a:defRPr`, und das ist nicht das Format des Textes. */
            const lauf = [...absatz.children].find(k => k.tagName === 'a:r');
            const rPr = lauf?.getElementsByTagName('a:rPr')[0];
            const sz = Number(rPr?.getAttribute('sz'));
            /* Die Farbe des Textes steht im LAUF, nicht in `p:spPr` — dort wäre
               es die Füllung der Form. `formFarbe` darf hier also nicht helfen. */
            const rgb = rPr?.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val') || '';
            /* `buNone` schlägt jedes geerbte Zeichen; `buAutoNum` bekommt einen
               Punkt, weil die echte Nummer erst aus der Absatzfolge käme — und
               eine falsche Nummer wäre schlimmer als ein neutrales Zeichen. */
            let zeichen = '';
            if (pPr && !pPr.getElementsByTagName('a:buNone')[0]) {
                const buChar = pPr.getElementsByTagName('a:buChar')[0]?.getAttribute('char');
                if (buChar)
                    zeichen = buChar;
                else if (pPr.getElementsByTagName('a:buAutoNum')[0])
                    zeichen = '·';
            }
            raus.push({ text,
                sz: Number.isFinite(sz) && sz > 0 ? Math.round(sz / 100) : 0,
                fett: rPr?.getAttribute('b') === '1',
                farbe: rgb ? '#' + rgb : '',
                lvl: Math.max(0, Math.min(8, Number(pPr?.getAttribute('lvl')) || 0)),
                zeichen });
        }
        /* Leerzeilen am Ende weg — PowerPoint hängt gern einen leeren Absatz an,
           und der macht aus einem Titel einen Kasten mit Loch darunter. */
        while (raus.length && !raus[raus.length - 1]?.text.trim())
            raus.pop();
        return raus;
    };
    /** Der ganze Text eines Kastens, für Titelsuche und Leerprüfung. */
    const formText = (txBody) => absaetzeLesen(txBody).map(a => a.text).join('\n');
    /** Lage und Grösse einer Form, in Blattpunkten. `null`, wenn sie fehlen. */
    const formLage = (form) => {
        const xfrm = form.getElementsByTagName('a:xfrm')[0];
        if (!xfrm)
            return null;
        const off = xfrm.getElementsByTagName('a:off')[0];
        const ext = xfrm.getElementsByTagName('a:ext')[0];
        if (!off || !ext)
            return null;
        return { x: emuZuPunkt(off.getAttribute('x')), y: emuZuPunkt(off.getAttribute('y')),
            w: emuZuPunkt(ext.getAttribute('cx')), h: emuZuPunkt(ext.getAttribute('cy')) };
    };
    /**
     * DIE KLICKSCHRITTE EINER FOLIE — und was sie aufdecken.
     *
     * An Redurs Lehrunterlage gemessen: zehn der 27 Folien tragen `p:timing`,
     * zusammen 22 Klickschritte, und ALLE Effekte sind `presetClass="exit"`
     * mit `filter="dissolve"`. Das ist das Muster jeder Übungsfolie: die
     * Antwort steht längst auf der Folie, ein deckendes Rechteck liegt
     * darüber, und der Klick löst das Rechteck auf.
     *
     * Wer diese Rechtecke nicht mitliest, zeigt die Folie mit ALLEN ANTWORTEN
     * OFFEN — und merkt es nicht, weil die Folie vollständig aussieht. Genau
     * das ist in der ersten Fassung passiert (E541): Formen ohne Text wurden
     * übersprungen, und die Abdeckungen haben keinen.
     *
     * Zurück kommt: Form-Kennung → Nummer des Klicks, bei dem sie verschwindet.
     */
    const klickschritte = (doc) => {
        const karte = new Map();
        const zeit = doc.getElementsByTagName('p:timing')[0];
        if (!zeit)
            return karte;
        let schritt = 0;
        /* Jeder `p:par` mit `nodeType="clickEffect"` ist EIN Klick. Verschachtelt
           sind sie tief; gezählt wird in Dokumentordnung, und das ist die
           Reihenfolge, in der auch PowerPoint sie abarbeitet. */
        for (const knoten of zeit.getElementsByTagName('p:cTn')) {
            if (knoten.getAttribute('nodeType') !== 'clickEffect')
                continue;
            schritt++;
            for (const ziel of knoten.getElementsByTagName('p:spTgt')) {
                const id = ziel.getAttribute('spid');
                if (id && !karte.has(id))
                    karte.set(id, schritt);
            }
        }
        return karte;
    };
    /**
     * Die Füllfarbe einer Form.
     *
     * ERST DER VERLAUF, DANN DIE FESTE FARBE. An Redurs Datei gemessen: die
     * Abdeckungen sind KEINE einfarbigen Rechtecke, sondern ein Verlauf
     * weiss → #FFCC00 in der Mitte → weiss, senkrecht (`a:lin ang="5400000"`).
     * Die `a:solidFill`, die daneben steht, gehört der Umrisslinie.
     *
     * Der erste Versuch las nur `a:solidFill` und traf die richtige Farbe
     * bloss durch den Rückfall — das ist kein Lesen, das ist Glück. Jetzt
     * kommt die Farbe aus dem KRÄFTIGSTEN Stopp des Verlaufs, also dem, der
     * nicht die Hintergrundfarbe ist.
     *
     * Sie bleibt als RÜCKFALL stehen, auch seit `formVerlauf` daneben den
     * ganzen Verlauf liest (E545): eine Abdeckung trägt IMMER eine feste
     * Farbe, und das SVG malt sie, wenn die Verlaufsvorlage fehlt. Ohne sie
     * wäre ein `fill="url(#…)"` ins Leere ein UNSICHTBARER Deckel — und ein
     * unsichtbarer Deckel ist eine offene Antwort.
     */
    const formFarbe = (form) => {
        const verlauf = form.getElementsByTagName('a:gradFill')[0];
        if (verlauf) {
            /* Der mittlere Stopp ist bei einem Deckel die Farbe; die äusseren
               sind das Papier. Fällt die Wahl schwer, gewinnt der erste echte
               RGB-Wert — ein `schemeClr` ist ohne Thema ohnehin nicht auflösbar. */
            const stopps = [...verlauf.getElementsByTagName('a:gs')];
            const mitte = stopps.find(g => g.getAttribute('pos') === '50000') || null;
            const rgbMitte = mitte?.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val');
            if (rgbMitte)
                return '#' + rgbMitte;
            for (const g of stopps) {
                const w = g.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val');
                if (w)
                    return '#' + w;
            }
        }
        const voll = form.getElementsByTagName('a:solidFill')[0];
        const rgb = voll?.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val');
        return rgb ? '#' + rgb : '';
    };
    /**
     * Der Schlüssel eines Platzhalters.
     *
     * PowerPoint unterscheidet sie über `type` UND `idx`, und beide können
     * fehlen. Ein fehlender `type` heisst „body", ein fehlender `idx` heisst
     * „0" — das steht so im Format, und ohne diese zwei Vorgaben fände ein
     * Titel seinen Platzhalter im Layout nicht wieder.
     */
    const phSchluessel = (ph) => {
        if (!ph)
            return '';
        const typ = ph.getAttribute('type') || 'body';
        const idx = ph.getAttribute('idx') || '0';
        /* `ctrTitle` und `title` sind für die Vererbung dasselbe: beide sind
           DER Titel der Folie, und ein Layout schreibt mal das eine, mal das
           andere. Ohne diese Zeile erbt eine zentrierte Titelfolie nichts. */
        const gleich = typ === 'ctrTitle' ? 'title' : typ;
        return gleich + '#' + idx;
    };
    /** Alle Platzhalter eines Layout- oder Master-XML, nach Schlüssel. */
    const vorgabenLesen = (doc) => {
        const karte = new Map();
        if (!doc)
            return karte;
        const baum = doc.getElementsByTagName('p:spTree')[0];
        for (const form of (baum ? baum.children : [])) {
            if (form.tagName !== 'p:sp')
                continue;
            const ph = form.getElementsByTagName('p:ph')[0];
            if (!ph)
                continue;
            const sz = Number(form.getElementsByTagName('a:defRPr')[0]?.getAttribute('sz'));
            karte.set(phSchluessel(ph), {
                lage: formLage(form),
                sz: Number.isFinite(sz) && sz > 0 ? Math.round(sz / 100) : 0,
            });
        }
        return karte;
    };
    /**
     * Die Hintergrundfarbe eines Folien-, Layout- oder Master-XML.
     *
     * NUR EINE VOLLE FARBE. Ein Verlauf, ein Bild oder eine Themenfarbe
     * (`schemeClr` — ohne `theme1.xml` gar nicht auflösbar) geben leer zurück,
     * und dann bleibt das Blatt weiss. Eine falsche Hintergrundfarbe wäre
     * schlimmer als gar keine: sie macht den Text unlesbar, und man sieht
     * nicht, woher sie kommt.
     */
    const hintergrund = (doc) => {
        if (!doc)
            return '';
        const bg = doc.getElementsByTagName('p:bg')[0];
        if (!bg)
            return '';
        /* `p:bgPr > a:solidFill > a:srgbClr`. Über `getElementsByTagName` geht
           auch ein `a:srgbClr` in einer Linie oder einem Effekt darunter mit —
           deshalb der Weg über die volle Füllung. */
        const voll = bg.getElementsByTagName('a:solidFill')[0];
        const rgb = voll?.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val');
        return rgb ? '#' + rgb : '';
    };
    /**
     * Welche Tinte auf diesem Grund lesbar ist — '' heisst „die gewohnte".
     *
     * Gerechnet wird der Kontrast nach WCAG, nicht nach Gefühl: die relative
     * Helligkeit beider Farben, und daraus (hell + 0,05) / (dunkel + 0,05).
     * Erst wenn Schwarz unter 4,5:1 fällt, wird auf Weiss gewechselt. Ein
     * Grund wie `#f8f8f5` ändert damit gar nichts.
     */
    const tinteFuer = (grund) => {
        const treffer = /^#([0-9a-fA-F]{6})$/.exec(grund);
        if (!treffer)
            return '';
        const roh = treffer[1];
        const kanal = (i) => {
            const v = parseInt(roh.slice(i * 2, i * 2 + 2), 16) / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        const helligkeit = 0.2126 * kanal(0) + 0.7152 * kanal(1) + 0.0722 * kanal(2);
        /* `#111111` — die Farbe, die eine Textmarke ohne eigene Farbe bekommt —
           hat die relative Helligkeit 0,005605. NACHGERECHNET, nicht geschätzt:
           meine erste Zahl hier war 0,005182 und damit falsch (P32 zum zweiten
           Mal). Die Schwelle liegt dadurch bei L < 0,2002, und das ist eine
           messbare Kante: `#767676` kippt (4,16:1), `#888888` nicht (5,33:1). */
        const schwarz = 0.005605;
        const gegenSchwarz = (helligkeit + 0.05) / (schwarz + 0.05);
        return gegenSchwarz < 4.5 ? '#ffffff' : '';
    };
    const formVerlauf = (form) => {
        const spPr = form.getElementsByTagName('p:spPr')[0];
        if (!spPr)
            return null;
        /* `[0]` über spPr statt über die Form: ein `a:gradFill` unter `a:ln`
           wäre die Linie, nicht die Füllung. Deshalb die direkten Kinder. */
        const verlauf = [...spPr.children].find(k => k.tagName === 'a:gradFill');
        if (!verlauf)
            return null;
        const stopps = [];
        for (const g of [...verlauf.getElementsByTagName('a:gs')]) {
            const rgb = g.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val');
            if (!rgb)
                continue; /* eine Themenfarbe — dann lieber gar nichts */
            const roh = String(g.getAttribute('pos') ?? '');
            /* `pos` steht in Tausendstel Prozent (0…100000); die neuere
               Schreibweise `50%` gibt es auch. Beides auf 0…1 bringen. */
            const anteil = roh.endsWith('%') ? Number(roh.slice(0, -1)) / 100
                : Number(roh) / 100000;
            if (!Number.isFinite(anteil))
                continue;
            stopps.push({ pos: Math.min(1, Math.max(0, anteil)), farbe: '#' + rgb });
        }
        /* Weniger als zwei Stopps sind kein Verlauf. Und wenn EINER der Stopps
           eine Themenfarbe war, fehlt er — dann ist der Verlauf unvollständig
           und die feste Farbe die ehrlichere Antwort. */
        if (stopps.length < 2 || stopps.length !== verlauf.getElementsByTagName('a:gs').length)
            return null;
        stopps.sort((a, b) => a.pos - b.pos);
        /* Der Winkel steht in 60000steln Grad, 0 = nach rechts, im
           Uhrzeigersinn. 5400000 sind 90°, also von oben nach unten. Ohne
           `a:lin` ist es kein linearer Verlauf, den wir nachbauen können. */
        const lin = [...verlauf.children].find(k => k.tagName === 'a:lin');
        if (!lin)
            return null;
        const winkel = Number(lin.getAttribute('ang')) || 0;
        return { stopps, winkel };
    };
    /**
     * Eine `.pptx` lesen. Zurück kommen Folien mit ihren Objekten — noch ohne
     * Kennungen und ohne abgelegte Bilder; das macht `datei()`, weil erst dort
     * feststeht, an welchem Block eine Bilddatei hängt.
     */
    const pptxLesen = async (puffer) => {
        const zip = await zipLesen(puffer);
        const praesT = await zip.text('ppt/presentation.xml');
        if (!praesT)
            throw new Error('In dieser Datei steckt keine PowerPoint-Präsentation.');
        const praes = xml(praesT);
        /* Das Folienmass. Fehlt es, gilt 16:9 in der Vorgabe von PowerPoint —
           12192000 × 6858000 EMU, also 960 × 540 pt. */
        const sz = praes.getElementsByTagName('p:sldSz')[0];
        const breite = emuZuPunkt(sz?.getAttribute('cx')) || 960;
        const hoehe = emuZuPunkt(sz?.getAttribute('cy')) || 540;
        /* DIE REIHENFOLGE STEHT IN `sldIdLst`, NICHT IN DEN DATEINAMEN.
           `slide10.xml` kommt in der Zeichensortierung vor `slide2.xml`, und
           eine Präsentation, deren Folien in falscher Ordnung erscheinen, ist
           schlimmer als eine, die gar nicht aufgeht. */
        const praesRels = await relsLesen(zip, 'ppt/presentation.xml');
        const pfade = [];
        for (const eintrag of praes.getElementsByTagName('p:sldId')) {
            const rid = eintrag.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')
                || eintrag.getAttribute('r:id') || '';
            const ziel = praesRels[rid];
            if (ziel)
                pfade.push(ziel);
        }
        if (!pfade.length)
            throw new Error('Diese Präsentation nennt keine Folien.');
        const folien = [];
        for (const pfad of pfade) {
            const t = await zip.text(pfad);
            if (!t)
                continue;
            const doc = xml(t);
            const rels = await relsLesen(zip, pfad);
            /* ── DIE ERBKETTE: Folie → Layout → Master (E558) ────────────────── */
            const holeXml = async (ziel) => {
                if (!ziel)
                    return null;
                try {
                    const t = await zip.text(ziel);
                    return t ? xml(t) : null;
                }
                catch {
                    return null;
                }
            };
            const layoutPfad = Object.entries(rels)
                .find(([, z]) => /slideLayouts\//.test(String(z)))?.[1] || '';
            const layoutDoc = await holeXml(String(layoutPfad));
            let masterDoc = null;
            if (layoutPfad) {
                const lRels = await relsLesen(zip, String(layoutPfad));
                const masterPfad = Object.entries(lRels)
                    .find(([, z]) => /slideMasters\//.test(String(z)))?.[1] || '';
                masterDoc = await holeXml(String(masterPfad));
            }
            /* Layout gewinnt gegen Master — deshalb wird der Master ZUERST
               eingetragen und vom Layout überschrieben. */
            const vorgaben = new Map([...vorgabenLesen(masterDoc), ...vorgabenLesen(layoutDoc)]);
            /* Und die Folie gewinnt gegen beide. */
            const grundfarbe = hintergrund(doc) || hintergrund(layoutDoc) || hintergrund(masterDoc);
            /* DIE TINTE MUSS AUF DEM GRUND LESBAR BLEIBEN (E558).
               Eine Textmarke ohne eigene Farbe zeichnet `#111111` — das war
               richtig, solange jedes Blatt weiss war. Mit einem geerbten dunklen
               Grund wäre es schwarz auf dunkelblau, also unsichtbar. PowerPoint
               hat dafür die Themenfarbe; die haben wir nicht. Was wir haben, ist
               der Kontrast, und der entscheidet: nur wenn Schwarz die Schwelle
               von 4,5:1 REISST (§38), bekommt der Absatz ausdrücklich Weiss.
               Ein Absatz mit eigener Farbe behält sie in jedem Fall. */
            const standardTinte = tinteFuer(grundfarbe);
            const baum = doc.getElementsByTagName('p:spTree')[0];
            const schritte = klickschritte(doc);
            const objekte = [];
            let titel = '';
            const abbilden = (l, ab) => {
                if (!l || !ab)
                    return l;
                return { x: ab.dx + l.x * ab.sx, y: ab.dy + l.y * ab.sy,
                    w: l.w * ab.sx, h: l.h * ab.sy };
            };
            /** Was weggelassen werden musste — je Art gezählt, für den Hinweis. */
            const weggelassen = new Map();
            const merkeWeg = (was) => void weggelassen.set(was, (weggelassen.get(was) || 0) + 1);
            const formenLesen = async (formen, ab, tiefe) => {
                for (const form of formen) {
                    /* ── Gruppe: hineingehen, statt sie zu übersehen (E555) ───────── */
                    if (form.tagName === 'p:grpSp') {
                        if (tiefe >= 8) {
                            merkeWeg('tief verschachtelte Gruppen');
                            continue;
                        }
                        const gp = form.getElementsByTagName('a:grpSpPr')[0];
                        const xf = gp?.getElementsByTagName('a:xfrm')[0];
                        const off = xf?.getElementsByTagName('a:off')[0];
                        const ext = xf?.getElementsByTagName('a:ext')[0];
                        const cOff = xf?.getElementsByTagName('a:chOff')[0];
                        const cExt = xf?.getElementsByTagName('a:chExt')[0];
                        let innen = ab;
                        if (off && ext && cOff && cExt) {
                            const ox = emuZuPunkt(off.getAttribute('x')), oy = emuZuPunkt(off.getAttribute('y'));
                            const cx = emuZuPunkt(ext.getAttribute('cx')), cy = emuZuPunkt(ext.getAttribute('cy'));
                            const kx = emuZuPunkt(cOff.getAttribute('x')), ky = emuZuPunkt(cOff.getAttribute('y'));
                            const kcx = emuZuPunkt(cExt.getAttribute('cx')), kcy = emuZuPunkt(cExt.getAttribute('cy'));
                            /* Null als Nenner heisst „keine Angabe" und nicht „unendlich". */
                            const sx = kcx > 0 ? cx / kcx : 1, sy = kcy > 0 ? cy / kcy : 1;
                            const eigen = { dx: ox - kx * sx, dy: oy - ky * sy, sx, sy };
                            innen = ab
                                ? { dx: ab.dx + eigen.dx * ab.sx, dy: ab.dy + eigen.dy * ab.sy,
                                    sx: eigen.sx * ab.sx, sy: eigen.sy * ab.sy }
                                : eigen;
                        }
                        await formenLesen(form.children, innen, tiefe + 1);
                        continue;
                    }
                    /* ── Tabelle und Diagramm: noch nicht, aber NICHT still (E555) ── */
                    if (form.tagName === 'p:graphicFrame') {
                        merkeWeg(form.getElementsByTagName('a:tbl').length ? 'Tabellen' : 'Diagramme');
                        continue;
                    }
                    /* ── Textkasten ──────────────────────────────────────────────── */
                    if (form.tagName === 'p:sp') {
                        const txBody = form.getElementsByTagName('p:txBody')[0];
                        const text = txBody ? formText(txBody) : '';
                        /* DURCH DIE ABBILDUNG DER GRUPPE (E555). Ausserhalb einer Gruppe
                           ist `ab` null und `abbilden` gibt die Lage unverändert zurück —
                           dieselbe Zeile trägt beide Fälle. */
                        /* UND WENN DIE FOLIE KEINE LAGE ANGIBT, ERBT SIE SIE (E558).
                           PowerPoint schreibt `a:xfrm` nur, wenn die Folie den Platzhalter
                           VERSCHOBEN hat. Ohne die Vererbung landete der Text auf einer
                           geratenen Stelle — `breite * 0.08`, `hoehe * 0.1` —, und das
                           sieht man sofort. */
                        const eigenePh = form.getElementsByTagName('p:ph')[0];
                        const geerbt = eigenePh ? vorgaben.get(phSchluessel(eigenePh)) : undefined;
                        const lage = abbilden(formLage(form) || geerbt?.lage || null, ab);
                        /* ── EINE ABDECKUNG ──────────────────────────────────────────
                           Kein Text, eine feste Füllung, und ein Klick lässt sie
                           verschwinden: das ist ein Deckel über der Antwort. Redion hat
                           dafür die Abdeck-Marke (E266) — zugedeckt gespeichert,
                           antippen deckt auf, und der Speicher wird dabei nie
                           angefasst. Dieselbe Sache, schon gebaut. */
                        const sid = form.getElementsByTagName('p:cNvPr')[0]?.getAttribute('id') || '';
                        const schritt = sid ? schritte.get(sid) : undefined;
                        if (!text.trim() && schritt && lage && lage.w > 0 && lage.h > 0) {
                            objekte.push({ art: 'abdeck', schritt, farbe: formFarbe(form) || '#ffcc00',
                                verlauf: formVerlauf(form),
                                x: lage.x, y: lage.y, w: lage.w, h: lage.h });
                            continue;
                        }
                        if (!text.trim()) {
                            /* EINE FORM OHNE TEXT UND OHNE KLICK. Sie kommt nicht an —
                               Redion hat für eine gefüllte PowerPoint-Form keine Marke, die
                               ihre Füllung UND ihren Umriss trüge. Aber sie verschwindet
                               nicht mehr schweigend (E555): gezählt wird sie nur, wenn sie
                               überhaupt eine Fläche hat, sonst zählte jeder unsichtbare
                               Platzhalter mit. */
                            if (lage && lage.w > 0 && lage.h > 0)
                                merkeWeg('gefüllte Formen');
                            continue;
                        }
                        /* Der erste Lauf bestimmt Schriftgrad und Fett für den Kasten.
                           Redions Textmarke hat EINEN Grad je Kasten; ein Kasten mit
                           gemischten Graden käme also vereinfacht an. Das ist eine Lücke
                           und steht so in LUECKEN.md. */
                        /* Ist es der Titel? PowerPoint sagt es über den Platzhaltertyp. */
                        const ph = eigenePh;
                        const istTitel = /^(ctr)?[Tt]itle$/.test(ph?.getAttribute('type') || '');
                        const absaetze = txBody ? absaetzeLesen(txBody) : [];
                        if (istTitel && !titel)
                            titel = absaetze[0]?.text.split('\n')[0] || '';
                        /* DER GRAD KOMMT AUS DEM LAYOUT, WENN DIE FOLIE KEINEN NENNT
                           (E558). Die feste 40/20 bleibt als letzter Rückfall — sie ist
                           geraten und war bis hierher die einzige Antwort. */
                        const grund = geerbt?.sz || (istTitel ? 40 : 20);
                        const kx = lage ? lage.x : breite * 0.08;
                        const ky = lage ? lage.y : hoehe * 0.1;
                        const kb = lage && lage.w > 0 ? lage.w : breite * 0.84;
                        /* ══ EINE MARKE JE ABSATZ — ABER NUR, WENN ES ETWAS BRINGT (E557)
                           Absätze, die sich in NICHTS unterscheiden, bleiben EINE Marke
                           mit `\n` dazwischen: genau wie bisher. Das ist der häufige Fall,
                           und für ihn ist eine Marke die bessere — wer den Textkasten im
                           Editor schiebt, schiebt dann den Kasten und nicht eine Zeile.
              
                           Aufgeteilt wird erst, wenn Grad, Gewicht, Farbe oder Ebene
                           auseinandergehen. Dann ist eine Marke schlicht falsch: sie hat
                           genau einen Grad, und der des ersten Absatzes gälte für alle.
              
                           DIE HÖHEN KOMMEN VOM ZEICHNER SELBST. `InkGeometry.textLayout`
                           ist dieselbe Rechnung, die das Blatt später benutzt — samt
                           Umbruch an `breiteBox`. Eine eigene Schätzung („Grad mal 1,25")
                           liefe bei jedem umbrechenden Absatz in den nächsten hinein. */
                        const gleichFormat = absaetze.length > 0 && absaetze.every(a => a.sz === absaetze[0].sz && a.fett === absaetze[0].fett
                            && a.farbe === absaetze[0].farbe && a.lvl === absaetze[0].lvl
                            && !a.zeichen === !absaetze[0].zeichen);
                        if (absaetze.length <= 1 || gleichFormat) {
                            const a = absaetze[0];
                            objekte.push({ art: 'text',
                                text: absaetze.map(z => (z.zeichen ? z.zeichen + ' ' : '') + z.text).join('\n'),
                                x: kx + a.lvl * Math.max(10, (a.sz || grund) * 0.9), y: ky,
                                breiteBox: Math.max(20, kb - a.lvl * Math.max(10, (a.sz || grund) * 0.9)),
                                fontSize: a.sz || grund, fett: a.fett,
                                ...((a.farbe || standardTinte) ? { farbe: a.farbe || standardTinte } : {}) });
                            continue;
                        }
                        let y = ky;
                        for (const a of absaetze) {
                            if (!a.text.trim()) {
                                /* Ein leerer Absatz in der Mitte ist eine Leerzeile, keine
                                   Marke — er bekommt seine Höhe und sonst nichts. */
                                y += (a.sz || grund) * 1.25;
                                continue;
                            }
                            const einzug = a.lvl * Math.max(10, (a.sz || grund) * 0.9);
                            const marke = { art: 'text',
                                text: (a.zeichen ? a.zeichen + ' ' : '') + a.text,
                                x: kx + einzug, y,
                                breiteBox: Math.max(20, kb - einzug),
                                fontSize: a.sz || grund, fett: a.fett,
                                ...((a.farbe || standardTinte) ? { farbe: a.farbe || standardTinte } : {}) };
                            objekte.push(marke);
                            /* Der Zeichner rechnet die Höhe, nicht ich. Fehlt er (halb
                               geladenes Fenster), bleibt die einfache Schätzung — dann
                               stehen die Absätze vielleicht eng, aber sie sind da. */
                            let h = (a.sz || grund) * 1.25;
                            try {
                                const l = InkGeometry.textLayout({ ...marke, point: [marke.x, y] });
                                if (l && l.height > 0)
                                    h = l.height;
                            }
                            catch { /* dann die Schätzung */ }
                            y += h;
                        }
                        continue;
                    }
                    /* ── Bild ─────────────────────────────────────────────────────── */
                    if (form.tagName === 'p:pic') {
                        const blip = form.getElementsByTagName('a:blip')[0];
                        const rid = blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed')
                            || blip?.getAttribute('r:embed') || '';
                        const ziel = rels[rid];
                        if (!ziel)
                            continue;
                        const bytes = await zip.holen(ziel);
                        if (!bytes)
                            continue;
                        const lage = abbilden(formLage(form), ab);
                        /* `pfad` ist der Schlüssel zum Sparen: an einer echten Datei
                           gemessen kam ein Logo 27-mal vor, einmal je Folie. Ohne ihn
                           entstünden 27 Dateisätze mit denselben Bytes. */
                        objekte.push({ art: 'bild', pfad: ziel, name: ziel.slice(ziel.lastIndexOf('/') + 1),
                            bytes,
                            x: lage ? lage.x : breite * 0.2, y: lage ? lage.y : hoehe * 0.2,
                            w: lage && lage.w > 0 ? lage.w : breite * 0.4,
                            h: lage && lage.h > 0 ? lage.h : hoehe * 0.4 });
                    }
                }
            };
            await formenLesen(baum ? baum.children : [], null, 0);
            /* KEIN PLATZHALTER, TROTZDEM EIN TITEL. An Redurs echter Datei
               gemessen: 27 Folien, NULL `p:ph`-Elemente. Die Erkennung über den
               Platzhaltertyp konnte dort nie greifen — PowerPoint schreibt ihn
               nur, wenn die Form aus einem Layout stammt.
               Also der Weg, den auch ein Mensch geht: von oben nach unten lesen.
               Welcher der Kandidaten wirklich die Überschrift ist, entscheidet
               sich aber erst, wenn ALLE Folien gelesen sind — siehe unten. */
            const kandidaten = objekte
                .filter(o => o.art === 'text' && String(o.text).trim())
                .sort((a, b) => a.y - b.y)
                .map(o => String(o.text).split('\n')[0].trim())
                .filter(z => z && z.length <= 80);
            folien.push({ titel, objekte, kandidaten, grundfarbe,
                weg: [...weggelassen.entries()] });
        }
        /* ══ WELCHER KASTEN IST DIE ÜBERSCHRIFT? ═══════════════════════════
           Der oberste allein genügt nicht. An Redurs Datei gemessen: dort
           steht ganz oben auf JEDER der 27 Folien „Band 1 / Auflage 2021" —
           eine Kopfzeile, keine Überschrift. Genau das liesse sich nicht
           erraten, aber sehr wohl abzählen: was auf mehr als einem Drittel
           der Folien wortgleich wiederkehrt, ist eine Kopf- oder Fusszeile.
           Der erste Kandidat, der das NICHT tut, ist der Titel. */
        const haeufig = new Map();
        for (const f of folien)
            for (const z of new Set(f.kandidaten))
                haeufig.set(z, (haeufig.get(z) || 0) + 1);
        const decke = Math.max(2, Math.ceil(folien.length / 3));
        for (const f of folien) {
            if (f.titel)
                continue;
            f.titel = f.kandidaten.find(z => (haeufig.get(z) || 0) < decke) || '';
        }
        return { breite, hoehe, folien };
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
    /**
     * DAS ORIGINAL ZUERST — dieselbe Reihenfolge wie beim PDF
     * (`bereiche/pdf/einlesen.ts:105`), und aus demselben Grund.
     *
     * WAS HIER VORHER FEHLTE: `datei()` las die Bytes in einen Puffer, schrieb
     * Blöcke und liess die Datei fallen. Nach dem Einlesen hielt Redion nur
     * das Umwandlungsergebnis; der einzige Weg zurück zur Word- oder
     * Tabellendatei war die Platte des Nutzers. Und die Umwandlung ist
     * verlustbehaftet — Bilder, Kopfzeilen, Fussnoten, Spalten, Schriftgrade
     * bleiben zurück. Wer die Datei danach von der Platte löschte, hatte sie
     * verloren, ohne dass irgendwo stand, dass etwas fehlt.
     *
     * Office war die EINZIGE Gruppe, die an diesem Weg vorbeilief: der PDF-Weg
     * legt ab, der Anhang-Weg in `archiveImport.ts:204` legt ab, hier nicht.
     *
     * Schlägt das Ablegen fehl, fliegt der Fehler nach oben und es hat noch
     * nichts stattgefunden — dann übernimmt der gewöhnliche Anhang-Weg.
     */
    const originalSichern = async (f, elternId) => Dateien.ablegen(f, { blockId: elternId });
    /**
     * Der sichtbare Anhang auf die abgelegte Quelle, an Stelle 0 der neuen
     * Seite — vor dem Umgewandelten, damit man ihn findet.
     *
     * Der Dateisatz zeigt danach auf DIESEN Block. Ohne das überlebte er das
     * Löschen des Anhangs (E99, derselbe Fund wie beim PDF).
     */
    const originalAnhaengen = async (seiteId, f, quelle) => {
        try {
            const a = Store.addBlock(seiteId, 'file', {
                text: f.name, dateiId: quelle.id, typ: f.type,
                groesse: f.size, original: true
            }, 0);
            await Store.dateiPut({ ...quelle, blockId: a.id });
        }
        catch { /* ohne Anhang bleibt wenigstens das Umgewandelte */ }
    };
    /** Eine Datei einlesen — erkennt das Format an der Endung. */
    const datei = async (f, elternId) => {
        const name = f.name.toLowerCase();
        /* Nur für die Formate, die dieser Weg wirklich umwandelt. Alles andere
           fällt unten auf `null` und geht den Anhang-Weg, der ohnehin ablegt. */
        const wandelbar = /\.(xlsx|xlsm|ods|docx|pptx|ppsx|pptm|ppsm|epub)$/.test(name);
        const quelle = wandelbar ? await originalSichern(f, elternId) : null;
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
            if (quelle)
                await originalAnhaengen(seite.id, f, quelle);
            return { seite, hinweis: n + ' von ' + blaetter.length + ' Blättern als Datenbank angelegt'
                    + (quelle ? ' · das Original liegt als Anhang dabei' : '') };
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
            if (quelle)
                await originalAnhaengen(seite.id, f, quelle);
            return { seite, hinweis: n + ' von ' + blaetter.length + ' Blättern als Datenbank angelegt'
                    + (quelle ? ' · das Original liegt als Anhang dabei' : '') };
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
            if (quelle)
                await originalAnhaengen(seite.id, f, quelle);
            /* „übernommen", nicht „eingelesen": die Umwandlung lässt Bilder,
               Kopfzeilen, Fussnoten und Spalten zurück (siehe docxLesen). Der
               Satz sagt deshalb auch, wo das Vollständige liegt. */
            return { seite, hinweis: bloecke.length + ' Absätze übernommen'
                    + (quelle ? ' · das Original liegt unverändert als Anhang dabei' : '') };
        }
        /* `.ppsx` ist dasselbe Paket wie `.pptx`, nur als Bildschirm-
           präsentation gespeichert; `.pptm`/`.ppsm` dasselbe mit Makros. Alle
           vier tragen `ppt/presentation.xml`, und der Leser sieht ohnehin in
           die Datei statt auf den Namen. Gefunden an einer echten Datei von
           Redur: `.ppsx` lief vorher stumm in den Anhang-Zweig. */
        if (/\.(pptx|ppsx|pptm|ppsm)$/.test(name)) {
            const p = await pptxLesen(puffer);
            const seite = Store.addPage(elternId, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📽️' });
            if (quelle)
                await originalAnhaengen(seite.id, f, quelle);
            /* UND GLEICH ALS FOLIENSATZ AUFSCHLAGEN (E546). Derselbe Fund wie E397:
               „ein Weg, der das Ding anlegt, aber nicht öffnet." Der Dokumentmodus
               kann Blatt-Blöcke längst — Miniaturleiste, eine Folie gross, die
               Werkzeuge daneben (`document-mode.ts`, `documentsIn` nimmt
               `pdfseite` UND `blatt`). Er sprang hier nur nicht an, weil
               `active()` die Flagge am Seitenblock verlangt und niemand sie setzte.
               Ohne sie stand die eingelesene Präsentation als Stapel Blätter
               untereinander, jedes mit eigener Werkzeugleiste.
               Die Seite ist frisch, also ist die Flagge immer `undefined` — die
               Bedingung des PDF-Wegs („nur beim ERSTEN Mal", `pdf/einlesen.ts`)
               ist hier von selbst erfüllt, und wer den Modus später verlässt,
               bleibt draussen. */
            Store.updateBlock(seite.id, { dokumentModus: true });
            /* Eine Folie = ein `blatt`-Block mit Folienmass. Die Objekte werden
               Marken auf DERSELBEN Zeichenschicht, die auch PDF-Seite und
               A4-Blatt benutzen — also sofort verschiebbar, drehbar und
               rückgängig zu machen. */
            let mitBild = 0, mitDeckel = 0;
            /* Pfad im Paket → Kennung des abgelegten Satzes. Gemessen an einer
               echten Präsentation: 108 Bildvorkommen, aber nur 36 verschiedene
               Bilder. Ohne diese Karte lägen 108 Dateisätze im Speicher, davon
               72 als reine Verdopplung (§9: keine Daten ohne Not vermehren). */
            const schonAbgelegt = new Map();
            for (const [nr, folie] of p.folien.entries()) {
                const block = Store.addBlock(seite.id, 'blatt', {
                    text: folie.titel || ('Folie ' + (nr + 1)),
                    blattBreite: p.breite, blattHoehe: p.hoehe, papier: 'blanko',
                    /* Nur wenn es eine gibt — ein leeres Feld an jedem Blatt wäre
                       Ballast, und `blatt.ts` fällt ohne es auf Weiss zurück (E558). */
                    ...(folie.grundfarbe ? { grundfarbe: folie.grundfarbe } : {})
                });
                const marken = [];
                for (const o of folie.objekte) {
                    const id = 'm' + Math.random().toString(36).slice(2, 10);
                    if (o.art === 'text') {
                        /* `farbe` nur, wenn es eine gibt (E557) — die Marke fällt sonst
                           auf `FARBEN[0]` zurück, und das ist richtig so.
            
                           HIER WAR DER FEHLER BEIM ERSTEN LAUF, und er ist derselbe wie
                           bei `verlauf` in E545, vier Zeilen tiefer: das Lesen war
                           fertig, die Farbe stand im Absatz — und diese Zeile baute die
                           Marke aus einer FESTEN Feldliste zusammen und liess sie
                           liegen. Grad und Fett kamen an, die Farbe nicht; der Prüflauf
                           zeigte „ist '', soll '#CC0000'".
            
                           Eine Feldliste, die aufzählt, vergisst beim nächsten Feld
                           wieder. Sie bleibt trotzdem: ein blindes Durchreichen des
                           ganzen Objekts nähme `x`/`y`/`w`/`h` mit in die Ablage. */
                        marken.push({ id, art: 'text', point: [o.x, o.y], breiteBox: o.breiteBox,
                            text: o.text, fontSize: o.fontSize, fett: !!o.fett,
                            ...(o.farbe ? { farbe: o.farbe } : {}) });
                        continue;
                    }
                    if (o.art === 'abdeck') {
                        /* `schritt` reist mit, auch wenn heute noch jede Abdeckung für
                           sich angetippt wird. Ohne die Zahl wäre die Reihenfolge, in
                           der die Folie gedacht war, verloren — und sie steht nur in
                           der Quelldatei. */
                        /* `verlauf` nur, wenn es einen gibt — ein `undefined` im Objekt
                           überlebt `JSON.stringify` ohnehin nicht, und ein `null` an
                           jeder von Hand gezogenen Abdeckung wäre nur Ballast. */
                        marken.push({ id, art: 'abdeck', farbe: o.farbe, schritt: o.schritt,
                            ...(o.verlauf ? { verlauf: o.verlauf } : {}),
                            pts: [[o.x, o.y], [o.x + o.w, o.y + o.h]] });
                        continue;
                    }
                    /* Das Bild bekommt einen eigenen Dateisatz, der an DIESEM Block
                       hängt — dieselbe Ordnung wie beim PDF-Anhang (E99). */
                    try {
                        let dateiId = schonAbgelegt.get(o.pfad) || '';
                        if (!dateiId) {
                            const satz = await Dateien.ablegen(new Blob([o.bytes]), { blockId: block.id, name: o.name });
                            dateiId = String(satz?.id || '');
                            if (dateiId)
                                schonAbgelegt.set(o.pfad, dateiId);
                        }
                        if (dateiId) {
                            marken.push({ id, art: 'bild', dateiId,
                                pts: [[o.x, o.y], [o.x + o.w, o.y + o.h]] });
                            mitBild++;
                        }
                    }
                    catch { /* ohne das Bild bleibt die Folie stehen */ }
                }
                mitDeckel += marken.filter((m) => m.art === 'abdeck').length;
                if (marken.length)
                    Store.updateBlock(block.id, { marken });
            }
            /* ══ WAS NICHT ANKAM, STEHT IM HINWEIS (E555) ══════════════════════
               Hier stand nur, was ANKAM: „27 Folien übernommen, 12 Bilder,
               8 Antworten zugedeckt". Das ist die gefährliche Hälfte einer
               Auskunft — §11 sagt es für die Sicherung („eine Sicherung, die nicht
               sagt, was sie auslässt, ist die gefährlichste Sorte"), und für einen
               Import gilt es genauso: die Folie SIEHT vollständig aus.
      
               Gezählt wird über alle Folien zusammen und je Art, in der
               Reihenfolge, in der es auffällt. Keine Zahl heisst: es fehlt
               nichts — dann steht auch nichts da. */
            const fehltGesamt = new Map();
            for (const f of p.folien)
                for (const [was, n] of (f.weg || []))
                    fehltGesamt.set(was, (fehltGesamt.get(was) || 0) + Number(n));
            const fehltText = [...fehltGesamt.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([was, n]) => n + ' ' + was)
                .join(', ');
            return { seite, hinweis: p.folien.length + ' Folien übernommen'
                    + (mitBild ? ', ' + mitBild + ' Bilder aus ' + schonAbgelegt.size + ' Dateien' : '')
                    + (mitDeckel ? ', ' + mitDeckel + ' Antworten zugedeckt' : '')
                    + (fehltText ? ' · NICHT übernommen: ' + fehltText : '')
                    + (quelle ? ' · das Original liegt unverändert als Anhang dabei' : '') };
        }
        if (name.endsWith('.epub')) {
            const buch = await epubLesen(puffer);
            const seite = Store.addPage(elternId, { text: buch.titel, icon: '📚', wiki: true });
            buch.kapitel.forEach((k) => {
                const kap = Store.addPage(seite.id, { text: k.titel, icon: '📖' });
                Werkzeuge.ausHtml(kap.id, k.html);
            });
            Store.updateBlock(seite.id, { aufgeklappt: true });
            if (quelle)
                await originalAnhaengen(seite.id, f, quelle);
            return { seite, hinweis: buch.kapitel.length + ' Kapitel als Unterseiten angelegt'
                    + (quelle ? ' · das Original liegt als Anhang dabei' : '') };
        }
        return null;
    };
    return { zipLesen, zipLesenAusBlob, xlsxLesen, odsLesen, tabellenBerichtText,
        docxLesen, epubLesen,
        alsDatenbank, datei };
})();
window.Einlesen = Einlesen;
