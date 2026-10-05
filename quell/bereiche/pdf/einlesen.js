"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/pdf/einlesen.ts (npm run bauen:ts). */
const PdfEinlesen = (() => {
    const OHNE_FRAGE = 30;
    const PDF_KOPF = [0x25, 0x50, 0x44, 0x46, 0x2d];
    const alsSeiten = async (datei, elternId, vorgabe) => {
        if (typeof PdfLeser === 'undefined')
            throw new Error('Der PDF-Leser ist nicht geladen.');
        const kopf = new Uint8Array(await datei.slice(0, PDF_KOPF.length).arrayBuffer());
        if (PDF_KOPF.some((b, i) => kopf[i] !== b))
            throw new Error('Das ist keine PDF-Datei.');
        const presse = typeof Lader !== 'undefined'
            ? Lader.schweben({ art: 'presse', text: '„' + datei.name + '" wird gelesen …' })
            : null;
        const melder = presse ? null : UI.toast('„' + datei.name + '" wird gelesen …', 120000);
        const sageAn = (t) => {
            if (melder)
                melder.textContent = t;
            presse?.setzen({ text: t });
        };
        const wegMelden = () => {
            melder?.remove();
            presse?.entfernen();
        };
        let griff = null;
        let quelle;
        try {
            quelle = await Dateien.ablegen(datei, { blockId: elternId });
        }
        catch (e) {
            wegMelden();
            throw e;
        }
        const nurAnhaengen = async (warum) => {
            const b = Store.addBlock(elternId, 'file', {
                text: datei.name, dateiId: quelle.id, typ: datei.type
            });
            try {
                await Store.dateiPut({ ...quelle, blockId: b.id });
            }
            catch { }
            App.zeichneSeite();
            UI.toast('„' + datei.name + '" ' + warum);
            return { seiten: 0, quelle, block: b.id };
        };
        try {
            const bytes = new Uint8Array(await datei.arrayBuffer());
            griff = await PdfLeser.oeffne(bytes, async (nochmal) => {
                if (typeof Dialog === 'undefined')
                    return null;
                sageAn('„' + datei.name + '" ist geschützt.');
                return await Dialog.frage(nochmal ? 'Das Passwort stimmte nicht — noch einmal'
                    : 'Passwort für „' + datei.name + '"', '', 'passwort');
            });
            const gesamt = griff.seiten;
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
            const anordnung = vorgabe && vorgabe.anStelle ? 'untereinander'
                : vorgabe && vorgabe.anordnung ? vorgabe.anordnung
                    : typeof Dialog !== 'undefined'
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
                wegMelden();
                return nurAnhaengen('liegt als Anhang auf der Seite.');
            }
            if (!(vorgabe && (vorgabe.anordnung || vorgabe.anStelle)))
                Store.setMeta('pdfAnordnung', anordnung);
            const daneben = anordnung === 'nebeneinander';
            let bis = gesamt;
            if (gesamt > OHNE_FRAGE) {
                const antwort = vorgabe && vorgabe.ueberGrenze ? vorgabe.ueberGrenze
                    : typeof Dialog !== 'undefined'
                        ? await Dialog.wahl({
                            titel: datei.name,
                            text: 'Dieses Dokument hat ' + gesamt + ' Seiten.\n\n' +
                                'Jede Seite wird als Bild vorbereitet, damit du darauf ' +
                                'schreiben kannst. Das kostet Zeit und Platz — bis zu ' +
                                Math.max(1, Math.round(gesamt * 0.3)) + ' MB und etwa ' +
                                Math.max(1, Math.round(gesamt * 0.35)) + ' Sekunden.\n\n' +
                                'In die Sicherung kommen diese Bilder nicht; sie lassen ' +
                                'sich jederzeit aus dem Original zurückholen.',
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
                    wegMelden();
                    return nurAnhaengen('liegt als Anhang auf der Seite.');
                }
                bis = antwort === 'erste' ? OHNE_FRAGE : gesamt;
            }
            const gemacht = [];
            let stelle = vorgabe && vorgabe.anStelle ? vorgabe.anStelle.index : -1;
            for (let n = 1; n <= bis; n++) {
                sageAn('Seite ' + n + ' von ' + bis + ' …');
                const geo = await griff.geometrie(n);
                const bild = await griff.alsBild(n);
                let wohin = vorgabe && vorgabe.anStelle ? vorgabe.anStelle.elternId : elternId;
                let nachher = () => { };
                if (daneben) {
                    const sp = Store.addBlock(elternId, 'columns', { text: '', spalten: 2 });
                    const links = Store.addBlock(sp.id, 'spalte', { text: '' });
                    const rechts = Store.addBlock(sp.id, 'spalte', { text: '' });
                    wohin = links.id;
                    nachher = () => {
                        const blatt = Store.addBlock(rechts.id, 'blatt', {
                            text: '', blattBreite: geo.bw, blattHoehe: geo.bh,
                            raumVersion: SheetSpace.RAUM_VERSION
                        });
                        Store.addBlock(blatt.id, 'text', { text: '' });
                    };
                }
                const seitenText = await griff.text(n);
                const seitenVerweise = await griff.verweise(n);
                const b = Store.addBlock(wohin, 'pdfseite', {
                    text: '', suchtext: seitenText, nr: n, vonSeiten: gesamt,
                    bw: geo.bw, bh: geo.bh, dreh: geo.dreh,
                    quelleId: quelle.id, raumVersion: SheetSpace.RAUM_VERSION,
                    herkunft: 'quelle',
                    verweise: Array.isArray(seitenVerweise) ? seitenVerweise : []
                }, stelle >= 0 ? stelle++ : -1);
                nachher();
                const satz = await Dateien.ablegen(new File([bild], datei.name.replace(/\.pdf$/i, '') + '-s' + n + '.webp', { type: 'image/webp' }), { blockId: b.id, abgeleitet: true });
                Store.updateBlock(b.id, { bildDateiId: satz.id });
                gemacht.push(b.id);
                await new Promise(r => setTimeout(r, 0));
            }
            wegMelden();
            let anhang = '';
            if (bis > 0) {
                try {
                    const a = Store.addBlock(elternId, 'file', {
                        text: datei.name, dateiId: quelle.id, typ: datei.type,
                        groesse: datei.size, original: true
                    }, 0);
                    anhang = a.id;
                    await Store.dateiPut({ ...quelle, blockId: a.id });
                }
                catch { }
            }
            const zielSeite = typeof Links !== 'undefined' ? Links.seiteVon(elternId) : null;
            if (bis > 0 && !daneben && zielSeite && zielSeite.dokumentModus === undefined)
                Store.updateBlock(zielSeite.id, { dokumentModus: true });
            const OHNE_NAMEN = ['', 'Ohne Titel', 'Neue Seite'];
            if (bis > 0 && zielSeite && OHNE_NAMEN.includes(String(zielSeite.text || '').trim())) {
                const titel = datei.name.replace(/\.[^.]+$/, '').trim();
                if (titel)
                    Store.updateBlock(zielSeite.id, { text: titel });
            }
            App.zeichneSeite();
            UI.toast(bis + ' von ' + gesamt + ' Seiten aus „' + datei.name + '" vorbereitet');
            return { seiten: bis, gesamt, quelle, bloecke: gemacht, anhang };
        }
        catch (e) {
            wegMelden();
            const text = e instanceof Error ? e.message : String(e);
            const warum = /password|encrypt/i.test(text)
                ? 'bleibt ohne Passwort zu — sie liegt als Anhang auf der Seite.'
                : 'liess sich nicht als Seiten lesen (' + text +
                    ') — sie liegt als Anhang auf der Seite.';
            return await nurAnhaengen(warum);
        }
        finally {
            if (griff)
                griff.schliessen();
        }
    };
    const ohneBild = async (quelleId) => {
        const kandidaten = Object.values(Store.cache.blocks)
            .filter(b => b && b.alive !== false && b.type === 'pdfseite' &&
            b.quelleId === quelleId)
            .sort((a, b) => (Number(a.nr) || 0) - (Number(b.nr) || 0));
        const offen = [];
        for (const b of kandidaten) {
            if (!b.bildDateiId) {
                offen.push(b);
                continue;
            }
            const satz = await Store.dateiHolen(b.bildDateiId);
            if (!satz || satz.zustand !== 'fertig')
                offen.push(b);
        }
        return offen;
    };
    const AUFTRAG_ART = 'pdf-bilder';
    const auftragsId = (quelleId) => 'pdfbild-' + quelleId;
    const AUFTRAG_VERWEISE = 'pdf-verweise';
    const verweisAuftragsId = (quelleId) => 'pdfverweise-' + quelleId;
    const ohneVerweise = (quelleId) => Object.values(Store.cache.blocks)
        .filter(b => b && b.alive !== false && b.type === 'pdfseite' &&
        b.quelleId === quelleId && !Array.isArray(b.verweise))
        .sort((a, b) => (Number(a.nr) || 0) - (Number(b.nr) || 0));
    const MAX_VERSUCHE = 1;
    const bilderLaeufer = async (auftrag, hilfe) => {
        const quelleId = String(auftrag?.eingabe?.quelleId || '');
        if (!quelleId)
            throw new Error('Dem Auftrag fehlt die Kennung des Originals.');
        const offen = await ohneBild(quelleId);
        if (!offen.length)
            return { seiten: 0, grund: 'nichts offen' };
        const roh = await Dateien.alsBlob(quelleId);
        if (!roh) {
            throw new Error('Das Original fehlt in diesem Bestand — zieh die PDF-Datei ' +
                'noch einmal herein.');
        }
        const satzQuelle = await Store.dateiHolen(quelleId);
        const name = String(satzQuelle?.name || 'dem Original');
        let griff = null;
        let fertig = 0;
        try {
            griff = await PdfLeser.oeffne(new Uint8Array(await roh.arrayBuffer()));
            for (const b of offen) {
                if (hilfe.abgebrochen())
                    break;
                const n = Number(b.nr) || 1;
                if (n > griff.seiten)
                    continue;
                const bild = await griff.alsBild(n, Number(b.bildBreite) || undefined);
                const satz = await Dateien.ablegen(new File([bild], 'seite-' + n + '.webp', { type: 'image/webp' }), { blockId: b.id, abgeleitet: true });
                const nach = { bildDateiId: satz.id };
                if (!b.suchtext)
                    nach.suchtext = await griff.text(n);
                Store.updateBlock(b.id, nach);
                fertig++;
                await hilfe.schritt({ quelleId, fertig }, '„' + name + '": Seite ' + n + ' von ' +
                    (Number(b.vonSeiten) || griff.seiten));
                await new Promise(r => setTimeout(r, 0));
            }
            return { seiten: fertig, quelleId };
        }
        finally {
            if (griff)
                griff.schliessen();
        }
    };
    const verweiseLaeufer = async (auftrag, hilfe) => {
        const quelleId = String(auftrag?.eingabe?.quelleId || '');
        if (!quelleId)
            throw new Error('Dem Auftrag fehlt die Kennung des Originals.');
        const offen = ohneVerweise(quelleId);
        if (!offen.length)
            return { seiten: 0, grund: 'nichts offen' };
        const roh = await Dateien.alsBlob(quelleId);
        if (!roh)
            throw new Error('Das Original fehlt in diesem Bestand — die Verweise ' +
                'kommen zurück, sobald die PDF-Datei wieder da ist.');
        const satzQuelle = await Store.dateiHolen(quelleId);
        const name = String(satzQuelle?.name || 'dem Original');
        let griff = null;
        let fertig = 0;
        try {
            griff = await PdfLeser.oeffne(new Uint8Array(await roh.arrayBuffer()));
            for (const b of offen) {
                if (hilfe.abgebrochen())
                    break;
                const n = Number(b.nr) || 1;
                const liste = n > griff.seiten ? [] : await griff.verweise(n);
                Store.updateBlock(b.id, { verweise: Array.isArray(liste) ? liste : [] });
                fertig++;
                await hilfe.schritt({ quelleId, fertig }, '„' + name + '": Verweise werden nachgetragen — Seite ' + n + ' von ' +
                    (Number(b.vonSeiten) || griff.seiten));
                await new Promise(r => setTimeout(r, 0));
            }
            await Store.flush();
            return { seiten: fertig, quelleId };
        }
        finally {
            if (griff)
                griff.schliessen();
        }
    };
    const verweiseNachtragen = async (quelleId) => {
        if (typeof Auftraege === 'undefined' || !Auftraege.anlegen)
            return { auftrag: null, grund: 'ohne Maschine' };
        if (!quelleId)
            return { auftrag: null, grund: 'ohne Quelle' };
        const offen = ohneVerweise(quelleId);
        if (!offen.length)
            return { auftrag: null, seiten: 0, grund: 'nichts offen' };
        const satzQuelle = await Store.dateiHolen(quelleId);
        if (!satzQuelle || satzQuelle.zustand !== 'fertig')
            return { auftrag: null, grund: 'ohne Original' };
        const id = verweisAuftragsId(quelleId);
        const schon = await Auftraege.einer(id);
        if (schon && !JobModell.beendet(schon))
            return { auftrag: schon, schon: true };
        const auftrag = await Auftraege.anlegen(AUFTRAG_VERWEISE, { quelleId }, {
            id, schritte: offen.length, maxVersuche: MAX_VERSUCHE,
            text: '„' + String(satzQuelle.name || 'dem Original') + '": Verweise werden nachgetragen'
        });
        return { auftrag, seiten: offen.length };
    };
    if (typeof Auftraege !== 'undefined' && Auftraege.anmelden) {
        Auftraege.anmelden(AUFTRAG_ART, bilderLaeufer, 'Seitenbilder zurückholen');
        Auftraege.anmelden(AUFTRAG_VERWEISE, verweiseLaeufer, 'Verweise nachtragen');
    }
    const ZEICHEN_ABSTAND_MS = 1500;
    let zuletztGezeichnet = 0;
    const beiAuftragEreignis = (name, daten) => {
        if (!daten || daten.art !== AUFTRAG_ART)
            return;
        const zeichne = () => {
            if (typeof App !== 'undefined' && App.zeichneSeite)
                App.zeichneSeite();
            zuletztGezeichnet = Date.now();
        };
        if (name === 'auftrag.schritt') {
            if (Date.now() - zuletztGezeichnet < ZEICHEN_ABSTAND_MS)
                return;
            if (!document.querySelector('.pdfs, .pdfs-bild'))
                return;
            zeichne();
            return;
        }
        if (name === 'auftrag.beendet' || name === 'auftrag.fehler') {
            zeichne();
            if (daten.fehler)
                UI.toast(String(daten.fehler));
        }
    };
    if (typeof Ereignisse !== 'undefined' && Ereignisse.horche) {
        Ereignisse.horche(ARTEN.auftragSchritt, (d) => beiAuftragEreignis('auftrag.schritt', d));
        Ereignisse.horche(ARTEN.auftragBeendet, (d) => beiAuftragEreignis('auftrag.beendet', d));
        Ereignisse.horche(ARTEN.auftragFehler, (d) => beiAuftragEreignis('auftrag.fehler', d));
    }
    const neuBerechnen = async (quelleId) => {
        if (typeof Auftraege === 'undefined') {
            UI.toast('Die Auftragsmaschine steht nicht — Seitenbilder lassen sich ' +
                'gerade nicht zurückholen.');
            return { auftrag: null, grund: 'ohne Maschine' };
        }
        const offen = await ohneBild(quelleId);
        if (!offen.length)
            return { auftrag: null, seiten: 0, grund: 'nichts offen' };
        const id = auftragsId(quelleId);
        const schon = await Auftraege.einer(id);
        if (schon && !JobModell.beendet(schon))
            return { auftrag: schon, schon: true };
        const satzQuelle = await Store.dateiHolen(quelleId);
        const name = String(satzQuelle?.name || 'dem Original');
        const auftrag = await Auftraege.anlegen(AUFTRAG_ART, { quelleId }, {
            id, schritte: offen.length, maxVersuche: MAX_VERSUCHE,
            text: '„' + name + '": Seitenbilder werden zurückgeholt'
        });
        return { auftrag, seiten: offen.length };
    };
    const BREITE_MAX = 3308;
    const schaerfer = async (block) => {
        if (!block || block.type !== 'pdfseite')
            return { ok: false, grund: 'keine PDF-Seite' };
        if (!block.quelleId)
            return { ok: false, grund: 'Ohne das Original lässt sich nichts neu rechnen.' };
        const jetzt = Number(block.bildBreite) || PdfLeser.BREITE_PX;
        if (jetzt >= BREITE_MAX)
            return { ok: false, grund: 'Diese Seite ist schon so fein gerechnet, ' +
                    'wie Redion es anbietet.' };
        const ziel = Math.min(BREITE_MAX, jetzt * 2);
        const roh = await Dateien.alsBlob(block.quelleId);
        if (!roh)
            return { ok: false, grund: 'Das Original fehlt in diesem Bestand — zieh ' +
                    'die PDF-Datei noch einmal herein.' };
        const melder = UI.toast('Seite wird feiner gerechnet …', 120000);
        let griff = null;
        try {
            griff = await PdfLeser.oeffne(new Uint8Array(await roh.arrayBuffer()));
            const n = Number(block.nr) || 1;
            if (n > griff.seiten)
                return { ok: false, grund: 'Diese Seite gibt es im Original nicht.' };
            const bild = await griff.alsBild(n, ziel);
            const satz = await Dateien.ablegen(new File([bild], 'seite-' + n + '-' + ziel + '.webp', { type: 'image/webp' }), { blockId: block.id, abgeleitet: true });
            const alt = block.bildDateiId;
            Store.updateBlock(block.id, { bildDateiId: satz.id, bildBreite: ziel });
            if (alt && alt !== satz.id) {
                try {
                    await Dateien.weg(alt);
                }
                catch { }
            }
            melder.remove();
            App.zeichneSeite();
            UI.toast('Seite ' + n + ' ist jetzt bei ' +
                Math.round(ziel * 72 / (Number(block.bw) || 595.28)) + ' dpi');
            return { ok: true, breite: ziel };
        }
        catch (e) {
            melder.remove();
            const grund = e instanceof Error ? e.message : String(e);
            UI.toast('Die Seite liess sich nicht feiner rechnen: ' + grund);
            return { ok: false, grund };
        }
        finally {
            if (griff)
                griff.schliessen();
        }
    };
    const waehlen = async (elternId, vorgabe) => {
        const ziel = elternId || (typeof App !== 'undefined' ? App.aktuelleSeite() : '');
        if (!ziel) {
            UI.toast('Erst eine Seite öffnen — dorthin kommen die PDF-Seiten.');
            return null;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf,.pdf';
        input.multiple = true;
        input.style.display = 'none';
        document.body.appendChild(input);
        return new Promise(fertig => {
            let entschieden = false;
            const auf = async () => {
                if (entschieden)
                    return;
                entschieden = true;
                const dateien = input.files ? Array.from(input.files) : [];
                input.remove();
                if (!dateien.length) {
                    fertig(null);
                    return;
                }
                try {
                    let ergebnis = await alsSeiten(dateien[0], ziel, vorgabe);
                    for (let k = 1; k < dateien.length; k++) {
                        const wie = vorgabe && vorgabe.anordnung ? vorgabe.anordnung
                            : String(Store.getMeta('pdfAnordnung', 'untereinander'));
                        ergebnis = await alsSeiten(dateien[k], ziel, { ...(vorgabe || {}), anordnung: wie, ueberGrenze: (vorgabe && vorgabe.ueberGrenze) || 'alle' });
                    }
                    fertig(ergebnis);
                }
                catch (e) {
                    UI.toast('Die PDF liess sich nicht einlesen: ' +
                        (e instanceof Error ? e.message : String(e)));
                    fertig(null);
                }
            };
            input.addEventListener('change', () => { void auf(); });
            input.addEventListener('cancel', () => {
                if (entschieden)
                    return;
                entschieden = true;
                input.remove();
                fertig(null);
            });
            input.click();
        });
    };
    const BILD_KANTE_MAX = 2480;
    const bildMass = (blob) => new Promise((ok, nein) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { URL.revokeObjectURL(url); ok({ w: img.naturalWidth, h: img.naturalHeight }); };
        img.onerror = () => { URL.revokeObjectURL(url); nein(new Error('Das Bild liess sich nicht lesen.')); };
        img.src = url;
    });
    const bildVerkleinern = async (datei) => {
        const { w, h } = await bildMass(datei);
        if (!w || !h)
            throw new Error('Das Bild hat keine Masse.');
        if (Math.max(w, h) <= BILD_KANTE_MAX)
            return { blob: datei, w, h };
        const f = BILD_KANTE_MAX / Math.max(w, h);
        const zw = Math.max(1, Math.round(w * f)), zh = Math.max(1, Math.round(h * f));
        const url = URL.createObjectURL(datei);
        try {
            const img = await new Promise((ok, nein) => {
                const i = new Image();
                i.onload = () => ok(i);
                i.onerror = () => nein(new Error('Das Bild liess sich nicht lesen.'));
                i.src = url;
            });
            const leinwand = document.createElement('canvas');
            leinwand.width = zw;
            leinwand.height = zh;
            const stift = leinwand.getContext('2d');
            if (!stift)
                throw new Error('Der Browser gibt keine Zeichenfläche her.');
            stift.drawImage(img, 0, 0, zw, zh);
            const blob = await new Promise(fertig => leinwand.toBlob(b => fertig(b), 'image/webp', 0.85));
            leinwand.width = 0;
            leinwand.height = 0;
            if (!blob)
                throw new Error('Das Bild liess sich nicht verkleinern.');
            return { blob, w: zw, h: zh };
        }
        finally {
            URL.revokeObjectURL(url);
        }
    };
    const bilderAlsSeiten = async (dateien, elternId, anStelle) => {
        const bilder = Array.from(dateien).filter(d => /^image\//i.test(d.type));
        if (!bilder.length) {
            UI.toast('Keine Bilddatei dabei — es gehen PNG, JPG, WebP, GIF.');
            return [];
        }
        const wohin = anStelle ? anStelle.elternId : elternId;
        let stelle = anStelle ? anStelle.index : -1;
        const ids = [];
        for (let k = 0; k < bilder.length; k++) {
            const datei = bilder[k];
            try {
                const { blob, w, h } = await bildVerkleinern(datei);
                const bw = SheetSpace.A4_BREITE;
                const bh = SheetSpace.rund(bw * h / w);
                const b = Store.addBlock(wohin, 'pdfseite', {
                    text: '', nr: k + 1, vonSeiten: bilder.length, bw, bh,
                    raumVersion: SheetSpace.RAUM_VERSION, herkunft: 'bild', bildName: datei.name
                }, stelle >= 0 ? stelle++ : -1);
                const name = blob === datei ? datei.name : datei.name.replace(/\.[a-z0-9]+$/i, '') + '.webp';
                const satz = await Dateien.ablegen(new File([blob], name, { type: blob.type || datei.type }), { blockId: b.id, abgeleitet: false });
                Store.updateBlock(b.id, { bildDateiId: satz.id, bildBreite: w });
                ids.push(b.id);
            }
            catch (e) {
                UI.toast('„' + datei.name + '" liess sich nicht als Seite ablegen: ' + (e instanceof Error ? e.message : String(e)));
            }
            await new Promise(r => setTimeout(r, 0));
        }
        await Store.flush();
        if (ids.length)
            UI.toast(ids.length === 1 ? 'Ein Bild ist jetzt eine Seite' : ids.length + ' Bilder sind jetzt Seiten');
        return ids;
    };
    const bilderWaehlen = (elternId, anStelle) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.style.display = 'none';
        document.body.appendChild(input);
        return new Promise(fertig => {
            let entschieden = false;
            input.addEventListener('change', () => {
                if (entschieden)
                    return;
                entschieden = true;
                const dateien = input.files ? Array.from(input.files) : [];
                input.remove();
                if (!dateien.length) {
                    fertig([]);
                    return;
                }
                bilderAlsSeiten(dateien, elternId, anStelle).then(fertig, () => fertig([]));
            });
            input.addEventListener('cancel', () => { if (entschieden)
                return; entschieden = true; input.remove(); fertig([]); });
            input.click();
        });
    };
    const kameraWaehlen = (elternId, anStelle) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture', 'environment');
        input.style.display = 'none';
        document.body.appendChild(input);
        return new Promise(fertig => {
            let entschieden = false;
            input.addEventListener('change', () => {
                if (entschieden)
                    return;
                entschieden = true;
                const dateien = input.files ? Array.from(input.files) : [];
                input.remove();
                if (!dateien.length) {
                    fertig([]);
                    return;
                }
                bilderAlsSeiten(dateien, elternId, anStelle).then(fertig, () => fertig([]));
            });
            input.addEventListener('cancel', () => { if (entschieden)
                return; entschieden = true; input.remove(); fertig([]); });
            input.click();
        });
    };
    return { alsSeiten, waehlen, neuBerechnen, ohneBild, schaerfer, bilderAlsSeiten, bilderWaehlen, kameraWaehlen,
        verweiseNachtragen, ohneVerweise, AUFTRAG_VERWEISE, BREITE_MAX, OHNE_FRAGE, BILD_KANTE_MAX };
})();
window.PdfEinlesen = PdfEinlesen;
