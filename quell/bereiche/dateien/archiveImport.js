"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/dateien/archiveImport.ts (npm run bauen:ts). */
const ArchivImport = (() => {
    const TEXT = /\.(md|markdown|txt)$/i;
    const HTML = /\.(html?|htm)$/i;
    const TABELLE = /\.(csv|tsv)$/i;
    const OFFICE = /\.(xlsx|xlsm|ods|docx|pptx|ppsx|pptm|ppsm|epub)$/i;
    const BILD = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;
    const STEUER = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(31) +
        String.fromCharCode(127) + ']', 'g');
    const BOM = new RegExp('^' + String.fromCharCode(0xFEFF));
    const MIME = {
        pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp',
        avif: 'image/avif', txt: 'text/plain', md: 'text/markdown', markdown: 'text/markdown',
        csv: 'text/csv', tsv: 'text/tab-separated-values', html: 'text/html', htm: 'text/html',
        mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav',
        zip: 'application/zip', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ppsx: 'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ods: 'application/vnd.oasis.opendocument.spreadsheet', epub: 'application/epub+zip'
    };
    const mimeVon = (name) => MIME[(name.toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] ?? ''] ?? '';
    const segmente = (roh) => {
        const teile = String(roh).replace(/\\/g, '/').split('/').filter(t => t.length > 0);
        if (!teile.length)
            return null;
        for (const t of teile)
            if (t === '.' || t === '..')
                return null;
        return teile;
    };
    const istBeiwerk = (teile) => teile.some(t => t === '__MACOSX') ||
        /^(\.DS_Store|Thumbs\.db|desktop\.ini|\.directory)$/i.test(teile[teile.length - 1] ?? '') ||
        /^\._/.test(teile[teile.length - 1] ?? '');
    const sauber = (segment) => {
        const s = String(segment).normalize('NFKC')
            .replace(STEUER, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
        return s || 'Ohne Namen';
    };
    const stammVon = (dateiName) => {
        const stamm = dateiName.replace(/\.[^.]+$/, '');
        return sauber(stamm || dateiName);
    };
    const geschwister = (elternId) => (elternId ? Store.childrenOf(elternId) : Store.rootPages())
        .filter((k) => k && k.alive !== false && k.type === 'page');
    const fachFuer = (elternId, name) => {
        const da = geschwister(elternId).find((k) => !k.system && k.heftArt === 'fach' && String(k.text || '') === name);
        if (da)
            return { id: da.id, neu: false };
        const p = Store.addPage(elternId, { text: name, icon: '🗂', heftArt: 'fach' });
        return { id: p.id, neu: true };
    };
    const freierTitel = (elternId, wunsch) => {
        const da = new Set(geschwister(elternId).map((k) => String(k.text || '')));
        if (!da.has(wunsch))
            return wunsch;
        for (let n = 2; n < 1000; n++) {
            const t = wunsch + ' (' + n + ')';
            if (!da.has(t))
                return t;
        }
        return wunsch + ' (' + Date.now() + ')';
    };
    const dateiAlsDokument = async (datei, elternId, opt = {}) => {
        const name = datei.name || 'Datei';
        const lower = name.toLowerCase();
        if (typeof Dateien !== 'undefined' && Dateien.GRENZE && datei.size > Dateien.GRENZE)
            throw new Error('ist grösser als ' + Dateien.groesseText(Dateien.GRENZE) + ' — so viel hält der Browser nicht.');
        if (/\.pdf$/i.test(lower) && typeof PdfEinlesen !== 'undefined' && PdfEinlesen.alsSeiten) {
            const seite = Store.addPage(elternId, { text: freierTitel(elternId, stammVon(name)), icon: '📕' });
            await PdfEinlesen.alsSeiten(datei, seite.id, { anordnung: opt.anordnung || 'untereinander', ueberGrenze: 'alle' });
            return { art: 'pdf', seiteId: seite.id };
        }
        if (OFFICE.test(lower) && typeof Einlesen !== 'undefined' && Einlesen.datei) {
            const erg = await Einlesen.datei(datei, elternId ?? undefined);
            if (erg)
                return { art: 'seite', seiteId: erg.seite ? erg.seite.id : null };
        }
        if (TEXT.test(lower)) {
            const p = Store.addPage(elternId, { text: freierTitel(elternId, stammVon(name)), icon: '📄' });
            Werkzeuge.ausMarkdown(p, await datei.text());
            return { art: 'seite', seiteId: p.id };
        }
        if (HTML.test(lower)) {
            const p = Store.addPage(elternId, { text: freierTitel(elternId, stammVon(name)), icon: '🌐' });
            Werkzeuge.ausHtml(p.id, await datei.text());
            return { art: 'seite', seiteId: p.id };
        }
        if (TABELLE.test(lower) && typeof Datenbank !== 'undefined' && Einlesen.alsDatenbank) {
            const titel = freierTitel(elternId, stammVon(name));
            const p = Store.addPage(elternId, { text: titel, icon: '📊' });
            const zeilen = Datenbank.csvZerlegen((await datei.text()).replace(BOM, ''));
            Einlesen.alsDatenbank(p.id, titel, zeilen);
            return { art: 'seite', seiteId: p.id };
        }
        const istBild = BILD.test(lower);
        const seite = Store.addPage(elternId, { text: freierTitel(elternId, stammVon(name)), icon: istBild ? '🖼' : '📎' });
        const block = Store.addBlock(seite.id, istBild ? 'image' : 'file', istBild ? { caption: name } : { text: name, groesse: datei.size });
        const satz = await Dateien.ablegen(datei, { blockId: block.id, name });
        if (istBild)
            await Dateien.adresse(satz.id);
        Store.updateBlock(block.id, { dateiId: satz.id, typ: datei.type || mimeVon(name) });
        return { art: istBild ? 'bild' : 'anhang', seiteId: seite.id };
    };
    const hinweisText = (e, zipName) => {
        const stuecke = [];
        if (e.pdfs)
            stuecke.push(e.pdfs + (e.pdfs === 1 ? ' PDF' : ' PDFs'));
        if (e.bilder)
            stuecke.push(e.bilder + (e.bilder === 1 ? ' Bild' : ' Bilder'));
        if (e.seiten)
            stuecke.push(e.seiten + (e.seiten === 1 ? ' Seite' : ' Seiten'));
        if (e.anhaenge)
            stuecke.push(e.anhaenge + (e.anhaenge === 1 ? ' Datei' : ' Dateien'));
        let s = '„' + zipName + '": ' + (stuecke.length ? stuecke.join(', ') : 'nichts Lesbares') +
            ' in ' + e.faecher + (e.faecher === 1 ? ' Fach' : ' Fächern');
        if (e.unveraendert)
            s += ' · ' + e.unveraendert + ' schon da (unverändert)';
        if (e.uebersprungen.length)
            s += ' · ' + e.uebersprungen.length + ' übersprungen';
        if (e.fehler.length)
            s += ' · ' + e.fehler.length + ' mit Fehler';
        return s;
    };
    const ansichtAuffrischen = (wurzelId) => {
        const ort = typeof App !== 'undefined' && App.schauplatz ? App.schauplatz() : '';
        const N = globalThis.Notebook;
        const ziel = wurzelId && typeof Store !== 'undefined' && Store.getBlock
            && Store.getBlock(wurzelId) ? String(wurzelId) : null;
        if (ziel && typeof Bibliothek !== 'undefined' && Bibliothek.oeffne) {
            Bibliothek.oeffne(ziel);
        }
        else if (ort === 'bibliothek' && typeof Bibliothek !== 'undefined')
            Bibliothek.oeffne();
        else if (ort === 'notizhefte' && N && N.oeffnen)
            N.oeffnen();
        else if (typeof App !== 'undefined') {
            App.zeichneSeite();
        }
        if (typeof App !== 'undefined' && App.zeichneBaum)
            App.zeichneBaum();
    };
    const planen = (zip, zipName) => {
        const gueltig = [];
        const uebersprungen = [];
        for (const name of zip.namen) {
            if (name.endsWith('/'))
                continue;
            const teile = segmente(name);
            if (!teile) {
                uebersprungen.push(name + ' (unsicherer Pfad)');
                continue;
            }
            if (istBeiwerk(teile))
                continue;
            gueltig.push({ name, teile });
        }
        const oberste = new Set(gueltig.map(e => e.teile[0]));
        const allesInEinem = gueltig.length > 0 && oberste.size === 1 &&
            gueltig.every(e => e.teile.length >= 2);
        const wurzelName = allesInEinem
            ? sauber([...oberste][0])
            : sauber((zipName || 'Archiv').replace(/\.zip$/i, ''));
        return { gueltig, allesInEinem, wurzelName, uebersprungen };
    };
    const umfang = async (blob, zipName) => {
        if (typeof Einlesen === 'undefined' || !Einlesen.zipLesenAusBlob)
            return 0;
        return planen(await Einlesen.zipLesenAusBlob(blob), zipName).gueltig.length;
    };
    const ERFAHRUNG_SCHLUESSEL = 'importErfahrung';
    const leeresMessbuch = () => ({ jeArt: {}, pdf: { seiten: 0, bytes: 0, ms: 0 } });
    const buchen = (buch, art, ms, pdf) => {
        if (!buch)
            return;
        const e = buch.jeArt[art] || (buch.jeArt[art] = { dateien: 0, ms: 0 });
        e.dateien += 1;
        if (pdf && pdf.seiten > 0) {
            const jeSeiteRoh = ms / pdf.seiten;
            buch.pdf.seiten += pdf.seiten;
            buch.pdf.bytes += pdf.bytes;
            buch.pdf.ms += ms;
            e.ms += Math.max(0, ms - jeSeiteRoh * pdf.seiten);
        }
        else {
            e.ms += ms;
        }
    };
    const erfahrungLesen = () => {
        if (typeof Schaetzer === 'undefined')
            return null;
        try {
            return Schaetzer.ausAblage(Store.getMeta(ERFAHRUNG_SCHLUESSEL, null));
        }
        catch {
            return Schaetzer.frisch();
        }
    };
    const posten = (zip, gueltig) => {
        if (typeof Schaetzer === 'undefined')
            return [];
        const groesse = (name) => {
            try {
                const e = zip && typeof zip.eintrag === 'function' ? zip.eintrag(name) : null;
                return Math.max(0, Number(e?.groesse ?? 0) || 0);
            }
            catch {
                return 0;
            }
        };
        return gueltig.map(e => ({ art: Schaetzer.artVon(e.name), bytes: groesse(e.name) }));
    };
    const schaetzung = async (blob, zipName) => {
        if (typeof Schaetzer === 'undefined' || typeof Einlesen === 'undefined' ||
            !Einlesen.zipLesenAusBlob)
            return null;
        try {
            const zip = await Einlesen.zipLesenAusBlob(blob);
            const plan = planen(zip, zipName);
            const s = Schaetzer.schaetze(posten(zip, plan.gueltig), erfahrungLesen());
            return { ...s, satz: Schaetzer.satz(s) };
        }
        catch {
            return null;
        }
    };
    const lernen = (gemessen) => {
        if (typeof Schaetzer === 'undefined')
            return;
        try {
            Store.setMeta(ERFAHRUNG_SCHLUESSEL, Schaetzer.lerne(erfahrungLesen(), gemessen));
        }
        catch { }
    };
    const importZip = async (datei, zielId, opt = {}) => {
        if (typeof Einlesen === 'undefined' || !Einlesen.zipLesenAusBlob)
            throw new Error('Der ZIP-Leser ist nicht geladen.');
        const zip = await Einlesen.zipLesenAusBlob(datei);
        const ergebnis = {
            wurzelId: null, faecher: 0, dokumente: 0, pdfs: 0, bilder: 0, seiten: 0, anhaenge: 0,
            unveraendert: 0, uebersprungen: [], fehler: [], hinweis: ''
        };
        const plan = planen(zip, datei.name || 'Archiv');
        const gueltig = plan.gueltig;
        const allesInEinem = plan.allesInEinem;
        const abBei = Math.max(0, Number(opt.abBei) || 0);
        if (!abBei)
            ergebnis.uebersprungen.push(...plan.uebersprungen);
        const vorgabe = opt.wurzelVorgabe ? Store.getBlock(opt.wurzelVorgabe) : null;
        const wurzel = vorgabe && vorgabe.alive !== false
            ? { id: String(opt.wurzelVorgabe), neu: false }
            : fachFuer(zielId, plan.wurzelName);
        ergebnis.wurzelId = wurzel.id;
        ergebnis.faecher = wurzel.neu ? 1 : 0;
        const faecher = new Map([['', wurzel.id]]);
        const fachAusPfad = (teile) => {
            const schluessel = teile.join('/');
            const da = faecher.get(schluessel);
            if (da)
                return da;
            const eltern = fachAusPfad(teile.slice(0, -1));
            const f = fachFuer(eltern, sauber(teile[teile.length - 1]));
            if (f.neu)
                ergebnis.faecher++;
            faecher.set(schluessel, f.id);
            return f.id;
        };
        const buch = leeresMessbuch();
        const melder = !opt.still && !opt.beiSchritt && typeof UI !== 'undefined' && UI.toast
            ? UI.toast('„' + datei.name + '" wird entpackt …', 600000) : null;
        let nr = abBei;
        const einenEintrag = async (e, dateiName, rel) => {
            const roh = zip.groesse ? Number(zip.groesse(e.name)) : -1;
            if (typeof Dateien !== 'undefined' && Dateien.GRENZE && roh > Dateien.GRENZE) {
                ergebnis.uebersprungen.push(dateiName + ' (grösser als ' + Dateien.groesseText(Dateien.GRENZE) + ')');
                return;
            }
            const details = zip.eintrag ? zip.eintrag(e.name) : null;
            if (details && details.verschluesselt) {
                ergebnis.uebersprungen.push(dateiName + ' (verschlüsselt — Redion kann das nicht lesen)');
                return;
            }
            const elternId = fachAusPfad(rel.slice(0, -1));
            const kennung = details && Number.isFinite(Number(details.crc)) && roh >= 0
                ? 'zip:' + dateiName + '|' + roh + '|' + ZipDetails.crc32Hex(Number(details.crc)) : '';
            if (kennung && geschwister(elternId).some((k) => String(k.importKennung || '') === kennung)) {
                ergebnis.unveraendert++;
                return;
            }
            const blob = await zip.alsBlob(e.name);
            if (!blob) {
                ergebnis.uebersprungen.push(dateiName + ' (nicht lesbar)');
                return;
            }
            const f = new File([blob], dateiName, { type: mimeVon(dateiName) });
            const t0 = (typeof performance !== 'undefined' ? performance.now() : 0);
            const erg = await dateiAlsDokument(f, elternId, opt);
            const gebraucht = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
            if (erg.art === 'pdf') {
                const kinder = erg.seiteId ? Store.childrenOf(erg.seiteId) : [];
                const seiten = kinder.filter((k) => k && k.type === 'pdfseite').length;
                buchen(buch, 'pdf', gebraucht, { seiten, bytes: Math.max(0, roh > 0 ? roh : blob.size) });
            }
            else {
                buchen(buch, typeof Schaetzer !== 'undefined' ? Schaetzer.artVon(dateiName) : 'sonst', gebraucht);
            }
            if (kennung && erg.seiteId)
                Store.updateBlock(erg.seiteId, { importKennung: kennung });
            ergebnis.dokumente++;
            if (erg.art === 'pdf')
                ergebnis.pdfs++;
            else if (erg.art === 'bild')
                ergebnis.bilder++;
            else if (erg.art === 'seite')
                ergebnis.seiten++;
            else
                ergebnis.anhaenge++;
        };
        for (const e of gueltig.slice(abBei)) {
            nr++;
            if (opt.abgebrochen && opt.abgebrochen()) {
                ergebnis.abgebrochen = true;
                nr--;
                break;
            }
            const rel = allesInEinem ? e.teile.slice(1) : e.teile;
            const dateiName = rel[rel.length - 1];
            if (melder && melder.textContent !== undefined)
                melder.textContent = '„' + datei.name + '": Datei ' + nr + ' von ' + gueltig.length + ' — ' + dateiName;
            try {
                await einenEintrag(e, dateiName, rel);
            }
            catch (err) {
                const text = err instanceof Error ? err.message : String(err);
                if (/beschädigt/.test(text))
                    ergebnis.uebersprungen.push(dateiName + ' (beschädigt — die Prüfsumme stimmt nicht)');
                else
                    ergebnis.fehler.push(dateiName + ': ' + text);
            }
            if (opt.beiSchritt)
                await opt.beiSchritt({
                    index: nr, wurzelId: ergebnis.wurzelId,
                    zahlen: { faecher: ergebnis.faecher, dokumente: ergebnis.dokumente,
                        pdfs: ergebnis.pdfs, bilder: ergebnis.bilder, seiten: ergebnis.seiten,
                        anhaenge: ergebnis.anhaenge, unveraendert: ergebnis.unveraendert },
                    uebersprungen: ergebnis.uebersprungen.slice(-MERKGRENZE),
                    fehler: ergebnis.fehler.slice(-MERKGRENZE)
                }, dateiName + ' (' + nr + ' von ' + gueltig.length + ')');
            await new Promise(f => setTimeout(f, 0));
        }
        if (melder && melder.remove)
            melder.remove();
        ergebnis.hinweis = hinweisText(ergebnis, datei.name || 'Archiv');
        if (!ergebnis.abgebrochen && ergebnis.dokumente > 0)
            lernen(buch);
        if (!opt.still && !opt.beiSchritt) {
            if (typeof UI !== 'undefined' && UI.toast)
                UI.toast(ergebnis.hinweis, 9000);
            ansichtAuffrischen(ergebnis.wurzelId || null);
        }
        return ergebnis;
    };
    const AUFTRAG_ART = 'zip-import';
    const MERKGRENZE = 50;
    const leereZahlen = () => ({ faecher: 0, dokumente: 0, pdfs: 0, bilder: 0, seiten: 0, anhaenge: 0, unveraendert: 0 });
    const zipLaeufer = async (auftrag, hilfe) => {
        const ein = auftrag && auftrag.eingabe ? auftrag.eingabe : {};
        const dateiId = String(ein.dateiId || '');
        const zipName = String(ein.zipName || 'Archiv.zip');
        if (!dateiId)
            throw new Error('Dem Auftrag fehlt die Kennung der ZIP.');
        if (typeof Dateien === 'undefined' || !Dateien.alsBlob)
            throw new Error('Die Dateiablage steht nicht.');
        const blob = await Dateien.alsBlob(dateiId);
        if (!blob)
            throw new Error('Die Arbeitskopie der ZIP ist nicht mehr da — bitte noch einmal einlesen.');
        const stand = auftrag.stand && typeof auftrag.stand === 'object' ? auftrag.stand : null;
        const erg = await importZip(new File([blob], zipName, { type: 'application/zip' }), ein.zielId ? String(ein.zielId) : null, { anordnung: ein.anordnung, still: true,
            abBei: Math.max(0, Number(stand?.index) || 0),
            wurzelVorgabe: stand?.wurzelId ? String(stand.wurzelId) : null,
            beiSchritt: (s, text) => hilfe.schritt(s, text),
            abgebrochen: () => hilfe.abgebrochen() });
        const vorher = stand?.zahlen || leereZahlen();
        const gesamt = {
            faecher: vorher.faecher + erg.faecher, dokumente: vorher.dokumente + erg.dokumente,
            pdfs: vorher.pdfs + erg.pdfs, bilder: vorher.bilder + erg.bilder,
            seiten: vorher.seiten + erg.seiten, anhaenge: vorher.anhaenge + erg.anhaenge,
            unveraendert: vorher.unveraendert + erg.unveraendert
        };
        const ganz = { ...erg, ...gesamt, wurzelId: erg.wurzelId,
            uebersprungen: [...(stand?.uebersprungen || []), ...erg.uebersprungen].slice(-MERKGRENZE),
            fehler: [...(stand?.fehler || []), ...erg.fehler].slice(-MERKGRENZE), hinweis: '' };
        ganz.hinweis = hinweisText(ganz, zipName);
        if (!erg.abgebrochen && typeof Dateien.weg === 'function') {
            try {
                await Dateien.weg(dateiId);
            }
            catch { }
        }
        return { ...ganz, abgebrochen: !!erg.abgebrochen, dateiId };
    };
    if (typeof Auftraege !== 'undefined' && Auftraege.anmelden)
        Auftraege.anmelden(AUFTRAG_ART, zipLaeufer, 'ZIP entpacken');
    if (typeof Ereignisse !== 'undefined' && Ereignisse.horche) {
        try {
            Ereignisse.horche(ARTEN.auftragBeendet, (d) => {
                if (!d || d.art !== AUFTRAG_ART)
                    return;
                if (d.zustand !== 'fertig') {
                    ansichtAuffrischen();
                    return;
                }
                const holen = (typeof Auftraege !== 'undefined' && Auftraege.einer)
                    ? Auftraege.einer(String(d.id)) : null;
                Promise.resolve(holen).then((a) => {
                    const wurzel = a && a.stand && a.stand.wurzelId ? String(a.stand.wurzelId) : null;
                    ansichtAuffrischen(wurzel);
                }).catch(() => ansichtAuffrischen());
            });
        }
        catch { }
    }
    const alsAuftrag = async (datei, zielId = null, opt = {}) => {
        const name = datei.name || 'Archiv.zip';
        if (typeof Auftraege === 'undefined' || !Auftraege.anlegen ||
            typeof Dateien === 'undefined' || !Dateien.ablegen) {
            if (typeof UI !== 'undefined' && UI.toast)
                UI.toast('„' + name + '" wird hier im Fenster entpackt — bitte offen lassen.', 6000);
            return { auftrag: null, grund: 'ohne Maschine', ergebnis: await importZip(datei, zielId, opt) };
        }
        if (Dateien.GRENZE && datei.size > Dateien.GRENZE) {
            if (typeof UI !== 'undefined' && UI.toast)
                UI.toast('„' + name + '" ist grösser als ' + Dateien.groesseText(Dateien.GRENZE) +
                    ' — sie wird hier im Fenster entpackt, bitte offen lassen.', 8000);
            return { auftrag: null, grund: 'zu gross', ergebnis: await importZip(datei, zielId, opt) };
        }
        const vorab = await schaetzung(datei, name);
        const schritte = await umfang(datei, name);
        if (!schritte) {
            const ergebnis = await importZip(datei, zielId, opt);
            return { auftrag: null, grund: 'nichts Lesbares', ergebnis };
        }
        const satz = await Dateien.ablegen(datei, { name, abgeleitet: true });
        const auftrag = await Auftraege.anlegen(AUFTRAG_ART, { dateiId: satz.id, zipName: name, zielId: zielId || null,
            anordnung: opt.anordnung || 'untereinander',
            schaetzungMs: vorab && vorab.ms ? vorab.ms : 0 }, { schritte, text: '„' + name + '" wird entpackt' });
        if (!opt.still && typeof UI !== 'undefined' && UI.toast) {
            const zeit = vorab && vorab.satz ? ' · ' + vorab.satz : '';
            UI.toast('„' + name + '": ' + schritte + (schritte === 1 ? ' Datei' : ' Dateien') + zeit +
                ' — läuft im Hintergrund weiter, auch wenn du weggehst.', zeit ? 9000 : 7000);
        }
        return { auftrag, schaetzung: vorab };
    };
    const waehlen = (zielId = null) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip,application/zip,application/x-zip-compressed';
        input.style.display = 'none';
        document.body.appendChild(input);
        return new Promise(fertig => {
            let entschieden = false;
            const auf = async () => {
                if (entschieden)
                    return;
                entschieden = true;
                const f = input.files?.[0];
                input.remove();
                if (!f) {
                    fertig(null);
                    return;
                }
                try {
                    fertig(await alsAuftrag(f, zielId));
                }
                catch (e) {
                    if (typeof UI !== 'undefined')
                        UI.toast('Die ZIP liess sich nicht entpacken: ' +
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
    return { importZip, alsAuftrag, zipLaeufer, umfang, planen, AUFTRAG_ART, dateiAlsDokument, waehlen,
        ansichtAuffrischen, segmente, istBeiwerk, sauber,
        schaetzung, lernen, erfahrungLesen, ERFAHRUNG_SCHLUESSEL };
})();
window.ArchivImport = ArchivImport;
