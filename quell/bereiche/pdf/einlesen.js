"use strict";
/* ============================================================================
 * bereiche/pdf/einlesen.ts — ein PDF wird zu Seiten
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/pdf/einlesen.ts`.
 * ----------------------------------------------------------------------------
 * Der Weg vom Dokument zu beschreibbaren Seiten, mit vier Regeln:
 *
 *   Das Original bleibt   Es wird als Anhang abgelegt, Byte für Byte, und
 *                         nie überschrieben.
 *   Eine Seite zur Zeit   Nie zwei Leinwände gleichzeitig im Speicher. Eine
 *                         A4-Seite kostet gerastert rund neun Megabyte; bei
 *                         fünfzig Seiten gleichzeitig gibt jedes Telefon auf.
 *   Sichtbarer Fortschritt Ein Skript mit achtzig Seiten braucht Zeit. Wer
 *                         nicht sieht, dass etwas geschieht, drückt noch
 *                         einmal.
 *   Abgeleitet ist abgeleitet  Seitenbilder tragen `abgeleitet: true`. Sie
 *                         gehören nicht in jede Sicherung und nicht in jeden
 *                         Abgleich — sie entstehen in Sekunden neu.
 *
 *   Nichts verschwindet lautlos  Klappt das Lesen nicht — kaputt, mit
 *                         Passwort geschützt, oder der Mensch bricht ab —
 *                         hängt die Datei trotzdem SICHTBAR an der Seite.
 *                         Bytes ablegen und keinen Block bauen hiesse: der
 *                         Mensch zieht etwas herein und sieht nichts (E104).
 *
 * SEIT E104 GIBT ES ZWEI ANORDNUNGEN. Redur hatte es so beschrieben: „wenn
 * ich die pdf hochlade sollte ich neben es … so leeren a4 blatt haben die
 * ich direk dort schreiben kann". Also kann jede Seite ein Notizblatt neben
 * sich bekommen — genauso hoch und breit wie sie selbst, damit links und
 * rechts auf einer Linie liegen.
 *
 *   untereinander    Seite, Seite, Seite. Wie bisher.
 *   nebeneinander    je Seite: columns → spalte(Seite) + spalte(Blatt)
 *
 * GEFRAGT WIRD JEDES MAL, nicht einmal und dann heimlich gemerkt. Die
 * zuletzt gewählte Anordnung steht nur vorn — ein gemerkter Zustand, den
 * man nirgends sieht und nirgends ändert, ist genau die Sorte Falle, die
 * man erst beim dritten PDF bemerkt.
 * ==========================================================================*/
const PdfEinlesen = (() => {
    /* Ab hier wird nicht mehr ungefragt alles gerastert. Achtzig Seiten sind
       rund fünfzehn Megabyte Bilder — das soll ein Mensch entscheiden. */
    const OHNE_FRAGE = 30;
    const alsSeiten = async (datei, elternId) => {
        if (typeof PdfLeser === 'undefined')
            throw new Error('Der PDF-Leser ist nicht geladen.');
        const melder = UI.toast('„' + datei.name + '" wird gelesen …', 120000);
        const sageAn = (t) => {
            if (melder && melder.textContent !== undefined)
                melder.textContent = t;
        };
        let griff = null;
        /* DAS ORIGINAL ZUERST — es ist das, was zählt. Geht danach etwas schief,
           hat der Mensch trotzdem seine Datei. Geht schon DAS schief, fliegt der
           Fehler nach oben: dann hat noch nichts stattgefunden, und der
           gewöhnliche Anhang-Weg in `werkzeuge.ts` übernimmt von vorn.
           Ausserhalb des grossen `try`, damit `quelle` auch im `catch` da ist. */
        let quelle;
        try {
            quelle = await Dateien.ablegen(datei, { blockId: elternId });
        }
        catch (e) {
            melder.remove();
            throw e;
        }
        /**
         * Der Rückfall: die Datei hängt SICHTBAR an der Seite, als gewöhnlicher
         * Anhang. Gebraucht wird er, wenn das Lesen scheitert oder der Mensch
         * abbricht.
         *
         * VORHER GAB ES IHN NICHT, und das war ein stiller Verlust: die Bytes
         * lagen in der Ablage, ein Block dazu entstand nie. Wer ein kaputtes PDF
         * hereinzog, sah eine Meldung und danach eine leere Seite. `test173`
         * fiel darüber — mit einem 20 MB grossen „PDF", das keines war. Ein
         * Hinweistext ist kein Ersatz für etwas, das man anklicken kann.
         */
        const nurAnhaengen = async (warum) => {
            const b = Store.addBlock(elternId, 'file', {
                text: datei.name, dateiId: quelle.id, typ: datei.type
            });
            /* Der Datei-Satz zeigt jetzt auf DIESEN Block statt auf die Seite —
               sonst überlebte er das Löschen des Anhangs (E99). */
            try {
                await Store.dateiPut({ ...quelle, blockId: b.id });
            }
            catch { /* der Satz bleibt dann an der Seite; kein Verlust */ }
            App.zeichneSeite();
            UI.toast('„' + datei.name + '" ' + warum);
            return { seiten: 0, quelle, block: b.id };
        };
        try {
            const bytes = new Uint8Array(await datei.arrayBuffer());
            griff = await PdfLeser.oeffne(bytes);
            const gesamt = griff.seiten;
            /* ---- Anordnung ---------------------------------------------------- */
            const zuletzt = String(Store.getMeta('pdfAnordnung', 'nebeneinander'));
            const knopfSeite = {
                id: 'nebeneinander', text: 'Seite und Notizblatt nebeneinander',
                hinweis: 'Links die Seite, rechts ein leeres Blatt zum Schreiben und ' +
                    'Malen — genauso hoch. Am Telefon liegt das Blatt darunter.'
            };
            const knopfNur = {
                id: 'untereinander', text: 'Nur die Seiten',
                hinweis: 'Seite für Seite untereinander. Schreiben und malen kannst ' +
                    'du auch direkt darauf.'
            };
            const anordnung = typeof Dialog !== 'undefined'
                ? await Dialog.wahl({
                    titel: datei.name,
                    text: 'Wie soll „' + datei.name + '" auf der Seite liegen?',
                    knoepfe: [
                        ...(zuletzt === 'untereinander' ? [knopfNur, knopfSeite]
                            : [knopfSeite, knopfNur]),
                        { id: '', text: 'Abbrechen',
                            hinweis: 'Die Datei bleibt als Anhang liegen' }
                    ]
                })
                : zuletzt;
            if (!anordnung) {
                melder.remove();
                return nurAnhaengen('liegt als Anhang auf der Seite.');
            }
            Store.setMeta('pdfAnordnung', anordnung);
            const daneben = anordnung === 'nebeneinander';
            let bis = gesamt;
            if (gesamt > OHNE_FRAGE) {
                const antwort = typeof Dialog !== 'undefined'
                    ? await Dialog.wahl({
                        titel: datei.name,
                        text: 'Dieses Dokument hat ' + gesamt + ' Seiten.\n\n' +
                            'Jede Seite wird als Bild vorbereitet, damit du darauf ' +
                            'schreiben kannst. Das kostet Zeit und Platz — ungefähr ' +
                            Math.round(gesamt * 0.2) + ' MB.',
                        knoepfe: [
                            { id: 'alle', text: 'Alle ' + gesamt + ' Seiten vorbereiten',
                                hinweis: 'Dauert am längsten, dafür ist alles fertig' },
                            { id: 'erste', text: 'Nur die ersten ' + OHNE_FRAGE,
                                hinweis: 'Der Rest bleibt als Anhang erhalten' },
                            { id: '', text: 'Abbrechen', hinweis: 'Nur das Original wird angehängt' }
                        ]
                    })
                    : 'alle';
                if (!antwort) {
                    melder.remove();
                    return nurAnhaengen('liegt als Anhang auf der Seite.');
                }
                bis = antwort === 'erste' ? OHNE_FRAGE : gesamt;
            }
            const gemacht = [];
            for (let n = 1; n <= bis; n++) {
                sageAn('Seite ' + n + ' von ' + bis + ' …');
                const geo = await griff.geometrie(n);
                const bild = await griff.alsBild(n);
                /* Nebeneinander: ein Spaltenblock je Seite, mit derselben Hülle wie
                   die von Hand angelegten Spalten (E102) — columns → spalte →
                   Inhalt. Eine eigene Bauform wäre eine zweite Wahrheit über
                   dasselbe Ding. */
                let wohin = elternId;
                let nachher = () => { };
                if (daneben) {
                    const sp = Store.addBlock(elternId, 'columns', { text: '', spalten: 2 });
                    const links = Store.addBlock(sp.id, 'spalte', { text: '' });
                    const rechts = Store.addBlock(sp.id, 'spalte', { text: '' });
                    wohin = links.id;
                    nachher = () => {
                        /* Das Notizblatt bekommt die MASSE DER SEITE, nicht A4. Ein
                           querformatiges PDF neben einem hochkanten Blatt sähe aus wie
                           ein Fehler, und die Zeilen links und rechts lägen nie auf
                           einer Höhe. */
                        const blatt = Store.addBlock(rechts.id, 'blatt', {
                            text: '', blattBreite: geo.bw, blattHoehe: geo.bh,
                            raumVersion: SheetSpace.RAUM_VERSION
                        });
                        Store.addBlock(blatt.id, 'text', { text: '' });
                    };
                }
                /* Die SEITE zuerst, das Blatt danach. Bei achtzig Seiten sieht man
                   beim Einlesen zu, und ein Spaltenblock mit leerem linken Fach ist
                   für den Bruchteil einer Sekunde ein Bild von einem Fehler.
        
                   UND DIE SEITE WEISS GLEICH, WER SIE IST. Vorher entstand sie leer
                   und bekam Nummer, Masse und Herkunft erst nach dem Ablegen des
                   Bildes nachgereicht. Dazwischen lag ein Block ohne alles — für ein
                   paar Millisekunden je Seite, aber lang genug, dass zwei Prüfläufe
                   genau dort hineinlasen und `nr: null` fanden. Ein Zustand, der
                   nicht vorkommen kann, muss auch nicht behandelt werden.
                   Nur `bildDateiId` bleibt ein Nachtrag: die Ablage braucht die
                   Block-Kennung, die es vorher noch nicht gibt. Diese eine Lücke
                   kennt der Zeichner und schreibt „Seite wird vorbereitet …" hin. */
                const b = Store.addBlock(wohin, 'pdfseite', {
                    text: '', nr: n, vonSeiten: gesamt,
                    bw: geo.bw, bh: geo.bh, dreh: geo.dreh,
                    quelleId: quelle.id, raumVersion: SheetSpace.RAUM_VERSION
                });
                nachher();
                const satz = await Dateien.ablegen(new File([bild], datei.name.replace(/\.pdf$/i, '') + '-s' + n + '.webp', { type: 'image/webp' }), { blockId: b.id, abgeleitet: true });
                Store.updateBlock(b.id, { bildDateiId: satz.id });
                gemacht.push(b.id);
                /* Dem Browser Luft lassen — sonst steht die Oberfläche still. */
                await new Promise(r => setTimeout(r, 0));
            }
            if (melder && melder.remove)
                melder.remove();
            App.zeichneSeite();
            UI.toast(bis + ' von ' + gesamt + ' Seiten aus „' + datei.name + '" vorbereitet');
            return { seiten: bis, gesamt, quelle, bloecke: gemacht };
        }
        catch (e) {
            melder.remove();
            const text = e instanceof Error ? e.message : String(e);
            /* Verschlüsselte Dateien sind der häufigste Fall — und der einzige,
               bei dem eine allgemeine Meldung ratlos machen würde. */
            const warum = /password|encrypt/i.test(text)
                ? 'ist mit einem Passwort geschützt — sie liegt als Anhang auf der Seite.'
                : 'liess sich nicht als Seiten lesen (' + text +
                    ') — sie liegt als Anhang auf der Seite.';
            /* NICHT weiterwerfen: die Datei ist da und sichtbar. Ein Fehler, der
               nach oben geht, obwohl unten alles aufgeräumt ist, führt nur dazu,
               dass jemand oben noch einmal dasselbe versucht. */
            return await nurAnhaengen(warum);
        }
        finally {
            if (griff)
                griff.schliessen();
        }
    };
    return { alsSeiten, OHNE_FRAGE };
})();
window.PdfEinlesen = PdfEinlesen;
