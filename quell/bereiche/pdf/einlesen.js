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
        try {
            /* Das Original zuerst — es ist das, was zählt. Geht danach etwas
               schief, hat der Mensch trotzdem seine Datei. */
            const quelle = await Dateien.ablegen(datei, { blockId: elternId });
            const bytes = new Uint8Array(await datei.arrayBuffer());
            griff = await PdfLeser.oeffne(bytes);
            const gesamt = griff.seiten;
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
                    if (melder && melder.remove)
                        melder.remove();
                    UI.toast('„' + datei.name + '" ist als Anhang abgelegt.');
                    return { seiten: 0, quelle };
                }
                bis = antwort === 'erste' ? OHNE_FRAGE : gesamt;
            }
            const gemacht = [];
            for (let n = 1; n <= bis; n++) {
                sageAn('Seite ' + n + ' von ' + bis + ' …');
                const geo = await griff.geometrie(n);
                const bild = await griff.alsBild(n);
                const b = Store.addBlock(elternId, 'pdfseite', { text: '' });
                const satz = await Dateien.ablegen(new File([bild], datei.name.replace(/\.pdf$/i, '') + '-s' + n + '.webp', { type: 'image/webp' }), { blockId: b.id, abgeleitet: true });
                Store.updateBlock(b.id, {
                    nr: n, vonSeiten: gesamt, bw: geo.bw, bh: geo.bh, dreh: geo.dreh,
                    bildDateiId: satz.id, quelleId: quelle.id,
                    raumVersion: SheetSpace.RAUM_VERSION
                });
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
            if (melder && melder.remove)
                melder.remove();
            const text = e instanceof Error ? e.message : String(e);
            /* Verschlüsselte Dateien sind der häufigste Fall — und der einzige,
               bei dem eine allgemeine Meldung ratlos machen würde. */
            UI.toast(/password|encrypt/i.test(text)
                ? '„' + datei.name + '" ist mit einem Passwort geschützt. Redion kann sie nicht öffnen.'
                : '„' + datei.name + '" liess sich nicht lesen: ' + text);
            throw e;
        }
        finally {
            if (griff)
                griff.schliessen();
        }
    };
    return { alsSeiten, OHNE_FRAGE };
})();
window.PdfEinlesen = PdfEinlesen;
