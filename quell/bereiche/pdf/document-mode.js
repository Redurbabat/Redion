"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/pdf/document-mode.ts (npm run bauen:ts). */
const DocumentMode = (() => {
    const states = new Map();
    const SEITEN_MERKER = 'dokSeite:';
    const gemerkteSeite = (pageId) => {
        const n = Number(Store.getMeta(SEITEN_MERKER + pageId));
        return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    };
    const seiteMerken = (pageId, index) => {
        if (Store.getMeta(SEITEN_MERKER + pageId) === index)
            return;
        Store.setMeta(SEITEN_MERKER + pageId, index);
    };
    const ZOOM_MERKER = 'dokZoom:';
    const gemerkterZoom = (pageId) => {
        const n = Number(Store.getMeta(ZOOM_MERKER + pageId));
        return Number.isFinite(n) && n >= 60 && n <= 180 ? Math.round(n) : 100;
    };
    const zoomMerken = (pageId, zoom) => {
        if (Store.getMeta(ZOOM_MERKER + pageId) === zoom)
            return;
        Store.setMeta(ZOOM_MERKER + pageId, zoom);
    };
    const LAUF_MERKER = 'dokLauf:';
    const gemerkterLauf = (pageId) => {
        const gemerkt = Store.getMeta(LAUF_MERKER + pageId);
        if (gemerkt === 'einzel')
            return true;
        if (gemerkt === 'rolle')
            return false;
        try {
            return typeof Folienvorlagen !== 'undefined' &&
                Folienvorlagen.istFoliensatz(pageId) === true;
        }
        catch {
            return false;
        }
    };
    const laufMerken = (pageId, einzeln) => {
        const wert = einzeln ? 'einzel' : 'rolle';
        if (Store.getMeta(LAUF_MERKER + pageId) === wert)
            return;
        Store.setMeta(LAUF_MERKER + pageId, wert);
    };
    const stateFor = (pageId) => {
        const known = states.get(pageId);
        if (known)
            return known;
        const created = { index: gemerkteSeite(pageId), zoom: gemerkterZoom(pageId), lupe: false, zoomVorher: 0,
            thumbnailsOpen: false, inspectorOpen: false,
            einzeln: gemerkterLauf(pageId),
            toolsOpen: Store.getMeta('dokWerkzeuge:' + pageId) !== false };
        states.set(pageId, created);
        return created;
    };
    const bildLaden = (url) => new Promise((ok, nein) => {
        const i = new Image();
        i.onload = () => ok(i);
        i.onerror = () => nein(new Error('Bild nicht lesbar'));
        i.src = url;
    });
    const seiteZeichnen = async (block, typ = 'image/png', guete = 0.92, nimm) => {
        if (!block)
            return null;
        const bw = Number(block.bw) || Number(block.blattBreite) || SheetSpace.A4_BREITE;
        const bh = Number(block.bh) || Number(block.blattHoehe) || SheetSpace.A4_HOEHE;
        const g = SheetSpace.gedrehtVon(block);
        const W = Math.round(bw * 2), H = Math.round(bh * 2);
        const quer = g === 90 || g === 270;
        const leinwand = document.createElement('canvas');
        leinwand.width = quer ? H : W;
        leinwand.height = quer ? W : H;
        const stift = leinwand.getContext('2d');
        if (!stift)
            return null;
        stift.fillStyle = '#ffffff';
        stift.fillRect(0, 0, leinwand.width, leinwand.height);
        stift.translate(leinwand.width / 2, leinwand.height / 2);
        stift.rotate(g * Math.PI / 180);
        stift.translate(-W / 2, -H / 2);
        if (block.bildDateiId && typeof Dateien !== 'undefined') {
            try {
                const url = await Dateien.adresse(String(block.bildDateiId));
                if (url)
                    stift.drawImage(await bildLaden(url), 0, 0, W, H);
            }
            catch { }
        }
        const alleMarken = Array.isArray(block.marken) ? block.marken : [];
        const marken = nimm ? alleMarken.filter(nimm) : alleMarken;
        if (marken.length && typeof Marken !== 'undefined') {
            const bildDaten = new Map();
            for (const m of marken) {
                const id = m && m.art === 'bild' ? String(m.dateiId || '') : '';
                if (!id || bildDaten.has(id) || typeof Dateien === 'undefined')
                    continue;
                try {
                    const url = await Dateien.adresse(id);
                    if (!url)
                        continue;
                    const roh = await (await fetch(url)).blob();
                    bildDaten.set(id, await new Promise((fertig, schief) => {
                        const leser = new FileReader();
                        leser.onload = () => fertig(String(leser.result));
                        leser.onerror = () => schief(new Error('lesen'));
                        leser.readAsDataURL(roh);
                    }));
                }
                catch { }
            }
            const att = (wert) => String(wert ?? '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const alsBildMarke = (m) => {
                const daten = bildDaten.get(String(m.dateiId || ''));
                if (!daten)
                    return null;
                const pts = InkGeometry.points(m.pts);
                if (pts.length < 2)
                    return null;
                const box = InkGeometry.rectangle(pts[0], pts[1]);
                const grad = InkGeometry.drehung(m);
                const dreh = grad ? ' transform="rotate(' + att(grad) + ' ' +
                    att(box.x + box.width / 2) + ' ' + att(box.y + box.height / 2) + ')"' : '';
                return '<image x="' + att(box.x) + '" y="' + att(box.y) + '" width="' + att(box.width) +
                    '" height="' + att(box.height) + '" preserveAspectRatio="none"' + dreh +
                    ' href="' + att(daten) + '"/>';
            };
            const innen = marken.map((m) => {
                try {
                    if (m && m.art === 'bild') {
                        const eigen = alsBildMarke(m);
                        if (eigen)
                            return eigen;
                    }
                    return Marken.zeichneMarke(m)?.outerHTML || '';
                }
                catch {
                    return '';
                }
            }).join('');
            const defs = typeof Marken.verlaufDefs === 'function'
                ? (Marken.verlaufDefs(marken)?.outerHTML || '') : '';
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + bw + ' ' + bh + '" width="' + W + '" height="' + H + '">' + defs + innen + '</svg>';
            const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
            try {
                stift.drawImage(await bildLaden(url), 0, 0, W, H);
            }
            catch { }
            finally {
                URL.revokeObjectURL(url);
            }
        }
        const pixelBreite = leinwand.width, pixelHoehe = leinwand.height;
        const blob = await new Promise(fertig => leinwand.toBlob(b => fertig(b), typ, guete));
        leinwand.width = 0;
        leinwand.height = 0;
        if (!blob)
            return null;
        return { blob, pixelBreite, pixelHoehe,
            breite: quer ? bh : bw, hoehe: quer ? bw : bh };
    };
    const seiteAlsBild = async (block) => (await seiteZeichnen(block))?.blob ?? null;
    const aufSeite = (marke, block) => {
        if (!marke)
            return null;
        const bw = Number(block?.bw) || Number(block?.blattBreite) || SheetSpace.A4_BREITE;
        const bh = Number(block?.bh) || Number(block?.blattHoehe) || SheetSpace.A4_HOEHE;
        const g = SheetSpace.gedrehtVon(block);
        const quer = g === 90 || g === 270;
        const pw = quer ? bh : bw, ph = quer ? bw : bh;
        const dreh = (q) => {
            const dx = (Number(q[0]) || 0) - bw / 2, dy = (Number(q[1]) || 0) - bh / 2;
            const rx = g === 90 ? -dy : g === 180 ? -dx : g === 270 ? dy : dx;
            const ry = g === 90 ? dx : g === 180 ? -dy : g === 270 ? -dx : dy;
            return [Math.round((pw / 2 + rx) * 100) / 100, Math.round((ph / 2 + ry) * 100) / 100];
        };
        return {
            striche: (marke.striche || []).map((s) => s.map(dreh)),
            kontur: (marke.kontur || []).map((k) => !k ? null
                : Array.isArray(k[0]?.[0]) ? k.map((v) => v.map(dreh)) : k.map(dreh)),
            farbe: marke.farbe, breite: marke.breite,
            deckkraft: marke.deckkraft, name: marke.name
        };
    };
    const alsPdf = async (seiten, melden) => {
        if (typeof PdfWriter === 'undefined' || !Array.isArray(seiten) || !seiten.length)
            return null;
        const schreiber = PdfWriter.neu();
        const kannAnnot = typeof Marken !== 'undefined' && !!Marken.annotierbar && !!Marken.alsAnnotation;
        for (let i = 0; i < seiten.length; i++) {
            if (melden && melden(i, seiten.length) === false)
                return null;
            const block = seiten[i];
            const roh = Array.isArray(block?.marken) ? block.marken : [];
            const annot = kannAnnot ? roh.filter((m) => Marken.annotierbar(m)) : [];
            const bild = await seiteZeichnen(block, 'image/jpeg', 0.88, annot.length ? (m) => !Marken.annotierbar(m) : undefined);
            if (!bild)
                continue;
            schreiber.seite({ bild: bild.blob, pixelBreite: bild.pixelBreite, pixelHoehe: bild.pixelHoehe,
                breite: bild.breite, hoehe: bild.hoehe,
                marken: annot.map((m) => aufSeite(Marken.alsAnnotation(m), block))
                    .filter(Boolean) });
        }
        if (!schreiber.seiten())
            return null;
        if (melden)
            melden(seiten.length, seiten.length);
        return schreiber.schliessen();
    };
    const dateiBlob = (id) => Dateien.alsBlob(id);
    const herunterladen = async (blob, name) => {
        const nativeDateien = globalThis.RedionNativeDateien;
        if (nativeDateien && typeof nativeDateien.speichern === 'function') {
            try {
                await nativeDateien.speichern(blob, name);
                return true;
            }
            catch (err) {
                UI.toast('Datei konnte nicht in iOS-Dateien gespeichert werden: ' +
                    (err instanceof Error ? err.message : String(err)));
                return false;
            }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 2000);
        return true;
    };
    const griffeSchliessen = () => {
        try {
            PdfLeser?.quellenSchliessen?.();
        }
        catch { }
    };
    let verweisHorcher = [];
    const verweisHorchenAus = () => {
        verweisHorcher.forEach(f => { try {
            f();
        }
        catch { } });
        verweisHorcher = [];
    };
    const nachtragAnstossen = (bloecke, neuMalen) => {
        if (typeof PdfEinlesen === 'undefined' || !PdfEinlesen.verweiseNachtragen)
            return;
        const quellen = new Set();
        bloecke.forEach(b => {
            if (b && b.type === 'pdfseite' && b.quelleId && !Array.isArray(b.verweise))
                quellen.add(String(b.quelleId));
        });
        if (!quellen.size)
            return;
        verweisHorchenAus();
        if (typeof Ereignisse !== 'undefined' && Ereignisse.horche) {
            const fertig = (d) => {
                if (!d || d.art !== PdfEinlesen.AUFTRAG_VERWEISE)
                    return;
                verweisHorchenAus();
                neuMalen();
            };
            verweisHorcher.push(Ereignisse.horche(ARTEN.auftragBeendet, fertig));
            verweisHorcher.push(Ereignisse.horche(ARTEN.auftragFehler, fertig));
        }
        quellen.forEach(id => { void PdfEinlesen.verweiseNachtragen(id); });
    };
    let sprungWunsch = null;
    const findBereich = () => {
        let w = false;
        try {
            w = Store.getMeta('dokFindAlle');
        }
        catch { }
        return w === true || w === 'dokumente' ? 'dokumente' : w === 'ueberall' ? 'ueberall' : 'dokument';
    };
    let findHaken = null;
    const findBereichMerken = (b) => {
        try {
            Store.setMeta('dokFindAlle', b === 'dokumente' ? true : b === 'ueberall' ? 'ueberall' : false);
        }
        catch { }
        if (findHaken && findHaken.lebt())
            findHaken.bereichZeigen(b);
    };
    const findenIn = async (seiteId, wort, o = {}) => {
        const h = findHaken;
        if (h && h.seiteId === seiteId && h.lebt())
            return h.suchen(String(wort || ''), o);
        if (!o.springen)
            return null;
        sprungWunsch = { seiteId, wort: String(wort || '') };
        App.oeffne(seiteId);
        return null;
    };
    const documentsIn = (page) => {
        if (!page?.id)
            return [];
        const found = [];
        const seen = new Set();
        const visit = (id, depth) => {
            if (depth > 8 || seen.has(id))
                return;
            seen.add(id);
            Store.childrenOf(id).forEach((block) => {
                if (!block || block.alive === false)
                    return;
                if (block.type === 'pdfseite' || block.type === 'blatt')
                    found.push(block);
                else if (block.type === 'columns' || block.type === 'columns3' || block.type === 'spalte')
                    visit(block.id, depth + 1);
            });
        };
        visit(page.id, 0);
        return found;
    };
    const FREMD_HOECHSTENS = 60;
    const FREMD_BLOECKE = 4000;
    const seiteZu = (block) => {
        let jetzt = block;
        for (let n = 0; jetzt && n < 10; n++) {
            const eltern = jetzt.parentId ? Store.getBlock(jetzt.parentId) : null;
            if (!eltern)
                return null;
            if (eltern.type === 'page')
                return eltern;
            jetzt = eltern;
        }
        return null;
    };
    const fundIm = (block, q) => {
        if (!block || !q)
            return '';
        if (block.type === 'pdfseite') {
            const text = String(block.suchtext || block.ocrText || '');
            return text.toLowerCase().includes(q) ? text : '';
        }
        for (const m of (Array.isArray(block.marken) ? block.marken : [])) {
            if ((m?.art === 'text' || m?.art === 'zettel') && String(m.text ?? '').toLowerCase().includes(q)) {
                return String(m.text);
            }
        }
        for (const kind of Store.childrenOf(block.id)) {
            if (String(kind?.text ?? '').toLowerCase().includes(q))
                return String(kind.text);
        }
        return '';
    };
    const stelleIn = (page, wort) => {
        const q = String(wort || '').trim().toLowerCase();
        if (q.length < 2 || !page)
            return null;
        const liste = documentsIn(page);
        for (let i = 0; i < liste.length; i++) {
            const fund = fundIm(liste[i], q);
            if (!fund)
                continue;
            const roh = fund.replace(/\s+/g, ' ');
            const wo = roh.toLowerCase().indexOf(q);
            const von = Math.max(0, wo - 30);
            const auszug = (von > 0 ? '… ' : '') + roh.slice(von, von + 90).trim()
                + (roh.length > von + 90 ? ' …' : '');
            return { blockId: String(liste[i].id), nr: i + 1, auszug };
        }
        return null;
    };
    const fremdeTreffer = (wort, ausser) => {
        const q = String(wort || '').trim().toLowerCase();
        if (q.length < 2)
            return { liste: [], mehr: false };
        const liste = [];
        let gesehen = 0;
        let mehr = false;
        const stelle = (text) => {
            const roh = String(text ?? '').replace(/\s+/g, ' ');
            const wo = roh.toLowerCase().indexOf(q);
            if (wo < 0)
                return roh.slice(0, 90);
            const von = Math.max(0, wo - 30);
            return (von > 0 ? '… ' : '') + roh.slice(von, von + 90).trim() + (roh.length > von + 90 ? ' …' : '');
        };
        for (const block of Object.values(Store.cache.blocks)) {
            if (liste.length >= FREMD_HOECHSTENS) {
                mehr = true;
                break;
            }
            if (++gesehen > FREMD_BLOECKE) {
                mehr = true;
                break;
            }
            if (!block || block.alive === false)
                continue;
            if (block.type !== 'pdfseite' && block.type !== 'blatt')
                continue;
            const seite = seiteZu(block);
            if (!seite || !seite.alive || seite.id === ausser)
                continue;
            if (typeof Konten !== 'undefined' && Konten.darf && !Konten.darf('lesen', seite.id))
                continue;
            const fund = fundIm(block, q);
            if (!fund)
                continue;
            liste.push({ seiteId: seite.id, blockId: block.id,
                name: String(seite.text || 'Ohne Titel'), icon: String(seite.icon || '📄'),
                nr: documentsIn(seite).findIndex(b => b.id === block.id) + 1,
                auszug: stelle(fund) });
        }
        liste.sort((a, b) => a.name.localeCompare(b.name) || a.nr - b.nr);
        return { liste, mehr };
    };
    const available = (page) => documentsIn(page).length > 0;
    const active = (page) => !!page?.dokumentModus && available(page);
    const select = (page, blockId) => {
        const index = documentsIn(page).findIndex(block => block.id === blockId);
        if (index < 0)
            return false;
        stateFor(page.id).index = index;
        seiteMerken(page.id, index);
        return true;
    };
    const toggle = (page, next) => {
        if (!page?.id || (!available(page) && next !== false))
            return;
        Store.updateBlock(page.id, { dokumentModus: next ?? !page.dokumentModus });
        App.zeichneSeite();
    };
    const seiteneditorOeffnen = (page, knopf, zielId, zielNr) => {
        if (!page?.id)
            return;
        if (knopf?.getAttribute('aria-busy') === 'true')
            return;
        knopf?.setAttribute('aria-busy', 'true');
        let lief = false;
        const weiter = () => {
            if (lief)
                return;
            lief = true;
            try {
                toggle(page, false);
            }
            catch (fehler) {
                console.error('[E717] Der Seiteneditor liess sich nicht öffnen', fehler);
                const grund = fehler instanceof Error ? fehler.message : String(fehler);
                try {
                    Store.updateBlock(page.id, { dokumentModus: true });
                    App.zeichneSeite();
                }
                catch (zweiter) {
                    console.error('[E717] Zurück ins Dokument ging auch nicht', zweiter);
                }
                UI.toast('Der Seiteneditor liess sich nicht öffnen: ' + grund, 8000);
                return;
            }
            finally {
                if (knopf?.isConnected)
                    knopf.removeAttribute('aria-busy');
            }
            if (zielNr <= 0 || !zielId)
                return;
            const rolle = document.getElementById('scroll');
            const ziel = document.querySelector('#page .blk[data-bid="' + (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(zielId) : zielId) + '"]');
            if (rolle && ziel)
                rolle.scrollTop += ziel.getBoundingClientRect().top - rolle.getBoundingClientRect().top - 8;
        };
        if (document.hidden || typeof requestAnimationFrame !== 'function') {
            setTimeout(weiter, 0);
            return;
        }
        requestAnimationFrame(() => { setTimeout(weiter, 0); });
        setTimeout(weiter, 250);
    };
    const sourceLabel = (documentBlock) => {
        if (documentBlock.type === 'pdfseite')
            return documentBlock.herkunft === 'bild'
                ? 'Bild' + (documentBlock.bildName ? ' · ' + String(documentBlock.bildName).slice(0, 40) : '')
                : 'PDF · Seite ' + (Number(documentBlock.nr) || 1);
        const eigen = String(documentBlock.text || '').trim();
        return eigen ? eigen.slice(0, 60) : 'A4-Blatt';
    };
    const linkedObjects = (page, documentBlock) => Object.values(Store.cache.blocks).filter(block => {
        if (!block?.alive || !block.sourceRef)
            return false;
        const source = block.sourceRef;
        return source.blockId === documentBlock.id ||
            (!source.blockId && source.pageId === page.id);
    });
    const escapeHtml = (wert) => String(wert ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const istFoliensatz = (page) => {
        try {
            return typeof Folienvorlagen !== 'undefined' &&
                Folienvorlagen.istFoliensatz(page?.id);
        }
        catch {
            return false;
        }
    };
    const wortEins = (page) => istFoliensatz(page) ? 'Folie' : 'Seite';
    const wortViele = (page) => istFoliensatz(page) ? 'Folien' : 'Seiten';
    const folienMenue = (knopf) => {
        const gruppen = (() => {
            try {
                return Register?.menueband?.inReiter?.('praesentation') || [];
            }
            catch {
                return [];
            }
        })();
        const eintraege = gruppen.flatMap((g) => g.eintraege || []);
        if (!eintraege.length) {
            UI.toast('Für diese Folien gibt es gerade nichts');
            return;
        }
        const kasten = knopf.getBoundingClientRect();
        const html = gruppen.map((g) => '<div class="grp">' + escapeHtml(String(g.gruppe || '')) + '</div>' +
            (g.eintraege || []).map((e) => `<button data-fm="${escapeHtml(String(e.id))}"` +
                (e.hinweis ? ` title="${escapeHtml(String(e.hinweis))}"` +
                    ` aria-label="${escapeHtml(String(e.name) + ' — ' + String(e.hinweis))}"` : '') +
                '>' + escapeHtml(String(e.name)) + '</button>').join('')).join('<hr>');
        const menue = UI.menu(html, kasten.left, kasten.bottom + 4);
        knopf.setAttribute('aria-expanded', 'true');
        menue.addEventListener('click', (ev) => {
            const ziel = ev.target?.closest('[data-fm]');
            if (!ziel)
                return;
            menue.remove();
            knopf.setAttribute('aria-expanded', 'false');
            const eintrag = eintraege.find((e) => String(e.id) === ziel.dataset['fm']);
            try {
                eintrag?.tun?.();
            }
            catch {
                UI.toast('Das ging gerade nicht');
            }
        });
    };
    const FOLIENBAND_REITER = ['praesentation', 'zeichnen', 'ansicht', 'verlauf',
        'ueberpruefen', 'hilfe'];
    const ZEICHEN_REITER = 'zeichnen';
    const BAND_AB = 900;
    const bandReiterVon = (pageId) => {
        const gemerkt = String(Store.getMeta('folienbandReiter:' + pageId, '') || '');
        return FOLIENBAND_REITER.includes(gemerkt) ? gemerkt : FOLIENBAND_REITER[0];
    };
    const folienbandBauen = (page, zeichenleiste) => {
        if (!istFoliensatz(page))
            return null;
        if (innerWidth < BAND_AB)
            return null;
        const inReiter = (id) => {
            try {
                return Register?.menueband?.inReiter?.(id) || [];
            }
            catch {
                return [];
            }
        };
        const offen = FOLIENBAND_REITER
            .map(id => ({ id, gruppen: id === ZEICHEN_REITER ? [] : inReiter(id) }))
            .filter(r => r.id === ZEICHEN_REITER
            ? !!zeichenleiste
            : r.gruppen.some((g) => (g.eintraege || []).length));
        if (!offen.length)
            return null;
        const namen = {};
        try {
            for (const r of (Register?.menueband?.REITER || []))
                namen[String(r.id)] = String(r.name);
        }
        catch { }
        const band = document.createElement('div');
        band.className = 'folienband';
        const reiterzeile = document.createElement('div');
        reiterzeile.className = 'folienband-reiter';
        reiterzeile.setAttribute('role', 'tablist');
        reiterzeile.setAttribute('aria-label', 'Folienband');
        const flaeche = document.createElement('div');
        flaeche.className = 'folienband-flaeche';
        flaeche.setAttribute('role', 'tabpanel');
        let aktiv = bandReiterVon(String(page?.id || ''));
        if (!offen.some(r => r.id === aktiv))
            aktiv = offen[0].id;
        const MERKE_ZU = 'folienbandZu';
        const ruhigAn = () => document.body.dataset['ruhig'] !== 'aus';
        let zu = ruhigAn() && Store.getMeta(MERKE_ZU, true) === true;
        const flaecheFuellen = () => {
            if (zeichenleiste) {
                zeichenleiste.hidden = aktiv !== ZEICHEN_REITER;
                zeichenleiste.setAttribute('aria-label', aktiv === ZEICHEN_REITER ? 'Zeichnen' : 'PDF bearbeiten');
            }
            flaeche.hidden = (aktiv === ZEICHEN_REITER && !!zeichenleiste) || zu;
            flaeche.replaceChildren();
            if (flaeche.hidden)
                return;
            const gruppen = (offen.find(r => r.id === aktiv)?.gruppen || [])
                .filter((g) => (g.eintraege || []).length);
            gruppen.forEach((g, i) => {
                if (i) {
                    const strich = document.createElement('div');
                    strich.className = 'folienband-trenner';
                    strich.setAttribute('aria-hidden', 'true');
                    flaeche.appendChild(strich);
                }
                try {
                    flaeche.appendChild(Menueband.gruppeZeichnen(g));
                }
                catch { }
            });
            if (Register?.symbole?.fuelle) {
                try {
                    Register.symbole.fuelle(flaeche);
                }
                catch { }
            }
            flaeche.setAttribute('aria-label', namen[aktiv] || aktiv);
        };
        const zuSetzen = (neu) => {
            zu = neu;
            try {
                Store.setMeta(MERKE_ZU, neu);
            }
            catch { }
            band.dataset['zu'] = neu ? 'an' : 'aus';
            reiterzeile.querySelectorAll('[data-fb-reiter]').forEach(x => x.setAttribute('aria-expanded', String(!neu)));
            const k = reiterzeile.querySelector('[data-fb-klapp]');
            if (k) {
                k.setAttribute('aria-expanded', String(!neu));
                k.title = neu ? 'Band aufklappen' : 'Band zuklappen';
                k.setAttribute('aria-label', k.title);
            }
            flaecheFuellen();
        };
        offen.forEach(r => {
            const t = document.createElement('button');
            t.type = 'button';
            t.className = 'folienband-reiter-knopf';
            t.dataset['fbReiter'] = r.id;
            t.setAttribute('role', 'tab');
            t.textContent = namen[r.id] || r.id;
            t.setAttribute('aria-selected', String(r.id === aktiv));
            t.setAttribute('aria-expanded', String(!zu));
            t.addEventListener('click', () => {
                if (r.id === aktiv) {
                    if (r.id !== ZEICHEN_REITER)
                        zuSetzen(!zu);
                    return;
                }
                aktiv = r.id;
                try {
                    Store.setMeta('folienbandReiter:' + String(page?.id || ''), aktiv);
                }
                catch { }
                reiterzeile.querySelectorAll('[data-fb-reiter]').forEach(x => x.setAttribute('aria-selected', String(x.dataset['fbReiter'] === aktiv)));
                if (r.id === ZEICHEN_REITER)
                    flaecheFuellen();
                else
                    zuSetzen(false);
            });
            reiterzeile.appendChild(t);
        });
        const klapp = document.createElement('button');
        klapp.type = 'button';
        klapp.className = 'folienband-klapp';
        klapp.dataset['fbKlapp'] = '1';
        klapp.textContent = '\u2304';
        klapp.addEventListener('click', () => zuSetzen(!zu));
        reiterzeile.appendChild(klapp);
        band.append(reiterzeile, flaeche);
        if (zeichenleiste)
            band.appendChild(zeichenleiste);
        band.dataset['zu'] = zu ? 'an' : 'aus';
        klapp.setAttribute('aria-expanded', String(!zu));
        klapp.title = zu ? 'Band aufklappen' : 'Band zuklappen';
        klapp.setAttribute('aria-label', klapp.title);
        flaecheFuellen();
        band.reiterWaehlen = (id) => {
            if (!offen.some(r => r.id === id) || aktiv === id)
                return;
            aktiv = id;
            try {
                Store.setMeta('folienbandReiter:' + String(page?.id || ''), aktiv);
            }
            catch { }
            reiterzeile.querySelectorAll('[data-fb-reiter]').forEach(x => x.setAttribute('aria-selected', String(x.dataset['fbReiter'] === aktiv)));
            flaecheFuellen();
        };
        return band;
    };
    const masseVon = (block) => ({
        bw: Number(block?.bw) || Number(block?.blattBreite) || SheetSpace.A4_BREITE,
        bh: Number(block?.bh) || Number(block?.blattHoehe) || SheetSpace.A4_HOEHE,
    });
    const markenVorschau = (block, mass) => {
        const marken = Array.isArray(block?.marken) ? block.marken : [];
        if (!marken.length || typeof Marken === 'undefined')
            return null;
        const bekannt = (m) => m?.art !== 'bild' ||
            (typeof Dateien !== 'undefined' && !!Dateien.adresseBekannt?.(m.dateiId));
        const raum = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        raum.setAttribute('class', 'document-thumbnail-marken');
        raum.setAttribute('viewBox', '0 0 ' + mass.bw + ' ' + mass.bh);
        raum.setAttribute('preserveAspectRatio', 'none');
        raum.setAttribute('aria-hidden', 'true');
        const defs = typeof Marken.verlaufDefs === 'function' ? Marken.verlaufDefs(marken) : null;
        if (defs)
            raum.appendChild(defs);
        let gezeichnet = 0;
        for (const marke of marken) {
            if (!bekannt(marke))
                continue;
            try {
                const knoten = Marken.zeichneMarke(marke);
                if (knoten) {
                    raum.appendChild(knoten);
                    gezeichnet++;
                }
            }
            catch { }
        }
        return gezeichnet ? raum : null;
    };
    const thumbnail = (documentBlock, index, selected) => {
        const zeile = document.createElement('div');
        zeile.className = 'document-thumb-zeile';
        zeile.dataset.documentThumbZeile = String(index);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'document-thumbnail' + (selected ? ' is-selected' : '');
        button.dataset.documentIndex = String(index);
        button.setAttribute('aria-label', sourceLabel(documentBlock) + ' öffnen');
        button.setAttribute('aria-current', selected ? 'page' : 'false');
        const preview = document.createElement('span');
        preview.className = 'document-thumbnail-preview';
        const mass = masseVon(documentBlock);
        if (mass.bw > 0 && mass.bh > 0)
            preview.style.aspectRatio = mass.bw + ' / ' + mass.bh;
        if (documentBlock.type === 'pdfseite' && documentBlock.bildDateiId && typeof Dateien !== 'undefined') {
            const image = document.createElement('img');
            image.alt = '';
            image.loading = 'lazy';
            image.dataset.documentThumbnailFile = documentBlock.bildDateiId;
            preview.appendChild(image);
        }
        else {
            const gemalt = markenVorschau(documentBlock, mass);
            if (gemalt)
                preview.appendChild(gemalt);
            else {
                const blank = document.createElement('span');
                blank.className = 'document-thumbnail-blank';
                blank.textContent = documentBlock.type === 'blatt' ? '✎' : documentBlock.herkunft === 'bild' ? '🖼' : 'PDF';
                preview.appendChild(blank);
            }
        }
        const label = document.createElement('span');
        label.className = 'document-thumbnail-label';
        label.textContent = (index + 1) + ' · ' + sourceLabel(documentBlock);
        const g = SheetSpace.gedrehtVon(documentBlock);
        if (g) {
            button.dataset.gedreht = String(g);
            preview.style.setProperty('--dreh', g + 'deg');
        }
        if (documentBlock.lesezeichen) {
            button.classList.add('hat-lesezeichen');
            const mark = document.createElement('span');
            mark.className = 'document-thumbnail-mark';
            mark.textContent = '🔖';
            mark.setAttribute('aria-label', 'Lesezeichen');
            preview.appendChild(mark);
        }
        button.append(preview, label);
        const menue = document.createElement('button');
        menue.type = 'button';
        menue.className = 'document-thumb-menue-knopf';
        menue.dataset.documentThumbMenue = String(index);
        menue.setAttribute('aria-haspopup', 'menu');
        menue.setAttribute('aria-expanded', 'false');
        menue.setAttribute('aria-label', sourceLabel(documentBlock) + ': Menü');
        menue.title = 'Was mit dieser Seite geschehen soll';
        menue.textContent = '⋯';
        zeile.append(button, menue);
        return zeile;
    };
    const activateVisibleThumbnails = (panel) => {
        let scheduled = false;
        const loadVisible = () => {
            scheduled = false;
            if (!panel.isConnected)
                return;
            const panelRect = panel.getBoundingClientRect();
            if (panelRect.width < 2 || panelRect.height < 2 ||
                panelRect.bottom <= 0 || panelRect.top >= window.innerHeight ||
                panelRect.right <= 0 || panelRect.left >= window.innerWidth)
                return;
            const top = Math.max(0, panelRect.top) - 220;
            const bottom = Math.min(window.innerHeight, panelRect.bottom) + 220;
            panel.querySelectorAll('img[data-document-thumbnail-file]').forEach(image => {
                if (image.src || image.dataset.loading === 'true')
                    return;
                const rect = image.getBoundingClientRect();
                if (rect.bottom < top || rect.top > bottom)
                    return;
                const fileId = image.dataset.documentThumbnailFile;
                if (!fileId)
                    return;
                const known = Dateien.adresseBekannt?.(fileId);
                if (known) {
                    image.src = known;
                    return;
                }
                image.dataset.loading = 'true';
                Dateien.adresse(fileId).then((url) => {
                    if (url && image.isConnected)
                        image.src = url;
                    delete image.dataset.loading;
                }).catch(() => { delete image.dataset.loading; });
            });
        };
        const schedule = () => {
            if (scheduled)
                return;
            scheduled = true;
            requestAnimationFrame(loadVisible);
        };
        panel.addEventListener('scroll', schedule, { passive: true });
        schedule();
    };
    const originalKnopf = (page, documentBlock) => {
        const originalBlock = Store.childrenOf(page.id)
            .find((b) => b && b.alive !== false && b.type === 'file' && b.dateiId &&
            (b.original || /\.pdf$/i.test(String(b.text || ''))));
        const quelleId = originalBlock?.dateiId || documentBlock?.quelleId || '';
        if (!quelleId)
            return null;
        const zeile = document.createElement('button');
        zeile.type = 'button';
        zeile.className = 'document-original';
        zeile.dataset.documentOriginal = String(quelleId);
        const zeichen = document.createElement('span');
        zeichen.className = 'do-zeichen';
        zeichen.textContent = '📕';
        const name = document.createElement('span');
        name.className = 'do-name';
        name.textContent = String(originalBlock?.text || 'Original-PDF');
        const wort = document.createElement('span');
        wort.className = 'do-wort';
        wort.textContent = 'Original öffnen';
        zeile.append(zeichen, name, wort);
        zeile.title = 'Die unveränderte PDF-Datei — darunter steht ihr Ausdruck.';
        return zeile;
    };
    const renderInspector = (container, page, documentBlock) => {
        const links = linkedObjects(page, documentBlock);
        const cards = links.filter(block => block.type === 'flashcard');
        const tasks = links.filter(block => block.type === 'todo');
        const notes = links.filter(block => block.type !== 'flashcard' && block.type !== 'todo');
        container.replaceChildren();
        const heading = document.createElement('div');
        heading.className = 'document-inspector-heading';
        const title = document.createElement('strong');
        title.textContent = 'Dokumentdetails';
        const close = document.createElement('button');
        close.type = 'button';
        close.dataset.documentAction = 'inspector-close';
        close.setAttribute('aria-label', 'Inspector schließen');
        close.textContent = '✕';
        heading.append(title, close);
        const source = document.createElement('div');
        source.className = 'document-inspector-source';
        source.textContent = sourceLabel(documentBlock) + ' · ' + (page.text || 'Ohne Titel');
        const actions = document.createElement('div');
        actions.className = 'document-inspector-actions';
        const makeAction = (action, label) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentAction = action;
            button.textContent = label;
            return button;
        };
        actions.append(makeAction('source-actions', '＋ Aus Inhalt'), makeAction('select-region', '⌗ Ausschnitt'), makeAction('recognize', '⌁ Erkennen'));
        if (stateFor(page.id).lupe) {
            for (const was of ['select-region', 'recognize']) {
                const knopf = actions.querySelector('[data-document-action="' + was + '"]');
                if (!knopf)
                    continue;
                knopf.disabled = true;
                knopf.setAttribute('aria-disabled', 'true');
                knopf.title = 'Ruht, solange das Zoom-Fenster offen ist — der Ausschnitt gilt der ganzen Seite.';
            }
        }
        const pdfKnopf = makeAction('export-pdf', '⬇ Als PDF sichern');
        pdfKnopf.className = 'document-import';
        pdfKnopf.title = 'Das ganze Dokument mit allen Marken als PDF speichern. '
            + 'Deine Handschrift wird zu echten Anmerkungen, die ein fremdes PDF-Programm '
            + 'anklicken, verschieben und löschen kann. Die Seite darunter wird ein Bild: '
            + 'ihr Text ist darin nicht mehr durchsuchbar, und Verweise sind keine Verweise '
            + 'mehr. Dein Original und deine Marken bleiben in Redion unverändert.';
        const importButton = makeAction('import', '＋ PDF hinzufügen');
        importButton.className = 'document-import';
        const mayEdit = !page.gesperrt && (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id));
        importButton.disabled = !mayEdit;
        importButton.title = mayEdit
            ? 'Eine weitere PDF in dieses Dokument einlesen'
            : 'Zum Hinzufügen brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.';
        const summary = document.createElement('div');
        summary.className = 'document-inspector-summary';
        [['🎴', 'Lernkarten', cards.length], ['☑', 'Aufgaben', tasks.length], ['¶', 'Notizen', notes.length]]
            .forEach(([icon, label, count]) => {
            const row = document.createElement('div');
            const left = document.createElement('span');
            left.textContent = String(icon) + ' ' + String(label);
            const number = document.createElement('b');
            number.textContent = String(count);
            row.append(left, number);
            summary.appendChild(row);
        });
        const list = document.createElement('div');
        list.className = 'document-inspector-list';
        links.slice(0, 24).forEach(block => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentOpen = block.id;
            const icon = block.type === 'flashcard' ? '🎴' : block.type === 'todo' ? '☑' : '¶';
            button.textContent = icon + ' ' + String(block.text || 'Ohne Text').replace(/::.*$/, '').slice(0, 90);
            list.appendChild(button);
        });
        if (!links.length) {
            const empty = document.createElement('p');
            empty.textContent = 'Deine Gedanken neben dem Papier. Wähle „Aus Inhalt“, um eine Notiz, Aufgabe oder Lernkarte mit dieser Seite zu verbinden.';
            list.appendChild(empty);
        }
        const randAn = Number(page.randBreite) > 0;
        const randKnopf = document.createElement('button');
        randKnopf.type = 'button';
        randKnopf.dataset.documentAction = 'rand';
        randKnopf.className = 'document-rand-knopf' + (randAn ? ' an' : '');
        randKnopf.textContent = '⇥ Randstreifen ' + (randAn ? 'aus' : 'an');
        randKnopf.setAttribute('aria-pressed', randAn ? 'true' : 'false');
        randKnopf.title = 'Ein Streifen zum Schreiben neben der Seite — für das ganze Dokument.';
        const laufKnopf = documentsIn(page).length > 1 ? (() => {
            const einzeln = gemerkterLauf(page.id);
            const knopf = document.createElement('button');
            knopf.type = 'button';
            knopf.dataset.documentAction = 'lauf';
            knopf.className = 'document-lauf-knopf' + (einzeln ? ' an' : '');
            knopf.textContent = einzeln ? '▤ Fortlaufend zeigen' : '▢ Einzelseite zeigen';
            knopf.setAttribute('aria-pressed', einzeln ? 'true' : 'false');
            knopf.title = einzeln
                ? 'Gerade steht eine Seite allein im Bild. Drücken zeigt wieder alle untereinander.'
                : 'Gerade stehen alle Seiten untereinander. Drücken zeigt nur die, auf der du bist.';
            return knopf;
        })() : null;
        const seiten = documentsIn(page);
        const seitenIndex = Math.max(0, seiten.findIndex(block => block.id === documentBlock.id));
        const darfSeiten = !page.gesperrt && (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id));
        const seite = document.createElement('div');
        seite.className = 'document-inspector-seite';
        const seiteTitel = document.createElement('h3');
        seiteTitel.className = 'document-section-title';
        const eins = wortEins(page), viele = wortViele(page);
        seiteTitel.textContent = eins + ' ' + (seitenIndex + 1) + ' von ' + seiten.length +
            (SheetSpace.gedrehtVon(documentBlock) ? ' · ' + SheetSpace.gedrehtVon(documentBlock) + '°' : '') +
            (documentBlock.lesezeichen ? ' · 🔖' : '');
        const knoepfe = document.createElement('div');
        knoepfe.className = 'document-seite-knoepfe';
        const seitenKnopf = (action, zeichen, wort, titel, an) => {
            const knopf = document.createElement('button');
            knopf.type = 'button';
            knopf.dataset.documentAction = action;
            const z = document.createElement('span');
            z.className = 'zeichen';
            z.setAttribute('aria-hidden', 'true');
            z.textContent = zeichen;
            const w = document.createElement('span');
            w.className = 'wort';
            w.textContent = wort;
            knopf.append(z, w);
            knopf.title = titel;
            knopf.disabled = !darfSeiten;
            if (typeof an === 'boolean') {
                knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
                knopf.classList.toggle('an', an);
            }
            return knopf;
        };
        knoepfe.append(seitenKnopf('page-add', '＋', eins + ' danach', 'Eine leere ' + eins + ' hinter dieser einfügen — mit dem Papier aus der Auswahl darunter'), seitenKnopf('page-duplicate', '⧉', 'Duplizieren', 'Diese ' + eins + ' mit allem darauf verdoppeln'), seitenKnopf('page-rotate', '⟳', 'Drehen', 'Diese ' + eins + ' um 90° im Uhrzeigersinn drehen'), seitenKnopf('page-up', '↑', 'Nach oben', 'Diese ' + eins + ' eine Stelle nach vorn'), seitenKnopf('page-down', '↓', 'Nach unten', 'Diese ' + eins + ' eine Stelle nach hinten'), seitenKnopf('page-bookmark', '🔖', 'Lesezeichen', documentBlock.lesezeichen ? 'Lesezeichen entfernen' : 'Diese ' + eins + ' mit einem Lesezeichen merken', !!documentBlock.lesezeichen), seitenKnopf('page-delete', '🗑', 'Löschen', 'Diese ' + eins + ' in den Papierkorb legen — von dort kommt sie zurück'), seitenKnopf('page-add-image', '🖼', 'Bild als ' + eins, 'Ein Foto, einen Scan oder eine Grafik als neue ' + eins + ' hinter dieser einfügen'), seitenKnopf('page-add-camera', '📷', 'Foto aufnehmen', 'Mit der Kamera eine neue ' + eins + ' hinter dieser aufnehmen — am Rechner ohne Kamera öffnet sich der Dateiwähler'), seitenKnopf('page-add-pdf', '📕', 'PDF hier einfügen', 'Die Seiten einer weiteren PDF hinter dieser ' + eins + ' einfügen'), seitenKnopf('page-export-image', '⬇', 'Als Bild sichern', 'Diese ' + eins + ' mit allem darauf als PNG speichern'), seitenKnopf('page-to-doc', '↗', 'In anderes Dokument', 'Diese ' + eins + ' mit allem darauf in ein anderes Dokument kopieren oder verschieben'), seitenKnopf('page-split', '⌸', 'In ' + viele + ' zerlegen', 'Dieses mehrseitige Blatt in einzelne A4-' + viele + ' zerlegen — danach greifen Drehen, Löschen und Verschieben je ' + eins));
        {
            const teilbar = documentBlock?.type === 'blatt'
                && SheetSpace.seiten(Number(documentBlock.blattHoehe) || SheetSpace.A4_HOEHE) > 1;
            const knopf = knoepfe.querySelector('[data-document-action="page-split"]');
            if (knopf && !teilbar) {
                knopf.disabled = true;
                knopf.setAttribute('aria-disabled', 'true');
                knopf.title = documentBlock?.type === 'blatt'
                    ? 'Dieses Blatt ist schon eine einzelne ' + wortEins(page) + '.'
                    : 'Nur ein mehrseitiges Blatt lässt sich zerlegen.';
            }
        }
        const sichernKnopf = knoepfe.querySelector('[data-document-action="page-export-image"]');
        if (sichernKnopf)
            sichernKnopf.disabled = false;
        const papierZeile = document.createElement('label');
        papierZeile.className = 'document-seite-papier';
        const papierWort = document.createElement('span');
        papierWort.textContent = 'Papier für neue Seiten';
        const papierWahl = document.createElement('select');
        papierWahl.dataset.documentPapier = '';
        papierWahl.setAttribute('aria-label', 'Papier für neue Seiten');
        const papiere = (typeof Blatt !== 'undefined' && Array.isArray(Blatt.PAPIERE)) ? Blatt.PAPIERE : [{ id: 'blanko', name: 'Blanko' }];
        const gemerkt = String(Store.getMeta('heft:papier', 'blanko'));
        papiere.forEach(p => {
            const o = document.createElement('option');
            o.value = p.id;
            o.textContent = p.name;
            if (p.id === gemerkt)
                o.selected = true;
            papierWahl.appendChild(o);
        });
        papierWahl.addEventListener('change', () => Store.setMeta('heft:papier', papierWahl.value));
        papierZeile.append(papierWort, papierWahl);
        seite.append(seiteTitel, knoepfe, papierZeile);
        const gemerkte = seiten.map((block, i) => ({ block, i })).filter(x => x.block.lesezeichen);
        if (gemerkte.length) {
            const liste = document.createElement('div');
            liste.className = 'document-lesezeichen';
            const kopf = document.createElement('strong');
            kopf.textContent = 'Lesezeichen';
            liste.appendChild(kopf);
            gemerkte.forEach(({ block, i }) => {
                const knopf = document.createElement('button');
                knopf.type = 'button';
                knopf.dataset.documentIndex = String(i);
                knopf.textContent = '🔖 Seite ' + (i + 1) + ' · ' + sourceLabel(block);
                if (i === seitenIndex)
                    knopf.setAttribute('aria-current', 'page');
                liste.appendChild(knopf);
            });
            seite.appendChild(liste);
        }
        const gesperrte = (Array.isArray(documentBlock.marken) ? documentBlock.marken : [])
            .map((mark, i) => ({ mark, i }))
            .filter((x) => !!x.mark?.gesperrt);
        if (gesperrte.length) {
            const liste = document.createElement('div');
            liste.className = 'document-gesperrt';
            const kopf = document.createElement('strong');
            kopf.textContent = 'Gesperrt auf dieser Seite (' + gesperrte.length + ')';
            liste.appendChild(kopf);
            gesperrte.forEach(({ mark }) => {
                const zeile = document.createElement('div');
                zeile.className = 'document-gesperrt-zeile';
                const was = document.createElement('span');
                was.className = 'document-gesperrt-was';
                const wort = typeof Marken !== 'undefined' ? Marken.artWort(mark.art) : String(mark.art || '');
                const zeichen = typeof Marken !== 'undefined' ? Marken.artZeichen(mark.art) : '•';
                const eigen = String(mark.text || '').replace(/\s+/g, ' ').trim();
                const stil = typeof Marken !== 'undefined' && mark.stil
                    ? (Marken.STIFTE.find((x) => x.id === mark.stil)?.name ?? '') : '';
                was.textContent = zeichen + ' ' + wort + (stil ? ' · ' + stil : '')
                    + (eigen ? ' · ' + eigen.slice(0, 40) : '');
                const auf = document.createElement('button');
                auf.type = 'button';
                auf.dataset.documentAction = 'mark-entsperren';
                auf.dataset.documentMarke = String(mark.id ?? '');
                auf.textContent = '🔓 Entsperren';
                auf.title = wort + ' entsperren — danach lässt sie sich wieder bewegen';
                auf.disabled = !darfSeiten;
                const zeigen = (an) => {
                    const sicher = String(mark.id ?? '').replace(/["\\]/g, '');
                    if (!sicher)
                        return;
                    document.querySelectorAll('.blatt-marken [data-sid="' + sicher + '"]')
                        .forEach(knoten => knoten.classList.toggle('ist-gezeigt', an));
                };
                zeile.addEventListener('mouseenter', () => zeigen(true));
                zeile.addEventListener('mouseleave', () => zeigen(false));
                auf.addEventListener('focus', () => zeigen(true));
                auf.addEventListener('blur', () => zeigen(false));
                zeile.append(was, auf);
                liste.appendChild(zeile);
            });
            if (gesperrte.length > 1) {
                const alle = document.createElement('button');
                alle.type = 'button';
                alle.className = 'document-gesperrt-alle';
                alle.dataset.documentAction = 'mark-entsperren';
                alle.dataset.documentMarke = '*';
                alle.textContent = '🔓 Alle ' + gesperrte.length + ' entsperren';
                alle.disabled = !darfSeiten;
                liste.appendChild(alle);
            }
            seite.appendChild(liste);
        }
        const original = originalKnopf(page, documentBlock);
        container.append(heading, source);
        if (original)
            container.appendChild(original);
        container.appendChild(seite);
        const linkedTitle = document.createElement('h3');
        linkedTitle.className = 'document-section-title';
        linkedTitle.textContent = 'Mit dieser Seite verbunden';
        const viewTitle = document.createElement('h3');
        viewTitle.className = 'document-section-title';
        viewTitle.textContent = 'Papier & Ansicht';
        const lupeAn = !!stateFor(page.id).lupe;
        const lupeKnopf = document.createElement('button');
        lupeKnopf.type = 'button';
        lupeKnopf.dataset.documentAction = 'lupe';
        lupeKnopf.className = 'document-lupe-knopf' + (lupeAn ? ' an' : '');
        lupeKnopf.textContent = lupeAn ? '🔍 Zoom-Fenster aus' : '🔍 Zoom-Fenster an';
        lupeKnopf.setAttribute('aria-pressed', lupeAn ? 'true' : 'false');
        lupeKnopf.title = 'Die Seite gross zum Kleinschreiben; unten die Übersicht mit dem Ausschnitt.';
        const datenZeile = document.createElement('div');
        datenZeile.className = 'document-inspector-daten';
        datenZeile.append(pdfKnopf, importButton);
        const originalId = original?.dataset.documentOriginal;
        if (originalId) {
            const kopie = makeAction('pdf-original-kopie', 'Originalseiten als PDF kopieren');
            kopie.className = 'document-import';
            kopie.dataset.pdfQuelle = originalId;
            const kombinieren = makeAction('pdf-original-kombinieren', 'PDF-Dateien zusammenführen');
            kombinieren.className = 'document-import';
            kombinieren.dataset.pdfQuelle = originalId;
            datenZeile.append(kopie, kombinieren);
        }
        const pdfHinweis = document.createElement('p');
        pdfHinweis.className = 'document-export-hinweis';
        pdfHinweis.textContent = 'Deine Handschrift wird eine echte Anmerkung — in jedem '
            + 'PDF-Programm anklickbar. Die Seite darunter wird ein Bild: ihr Text ist darin '
            + 'nicht mehr durchsuchbar. Original und Marken bleiben in Redion.';
        container.append(datenZeile, pdfHinweis, viewTitle, randKnopf, lupeKnopf);
        if (laufKnopf)
            container.appendChild(laufKnopf);
        container.append(linkedTitle, actions, summary, list);
    };
    const renderDocument = (container, block) => {
        container.replaceChildren();
        container.dataset.bid = block.id;
        container.appendChild(block.type === 'pdfseite' ? PdfSeite.zeichne(block) : Blatt.zeichne(block));
        const toolbar = container.querySelector('.blatt-werk');
        if (toolbar) {
            toolbar.setAttribute('role', 'toolbar');
            toolbar.setAttribute('aria-label', 'Schreiben, markieren und bearbeiten');
            toolbar.querySelectorAll('button').forEach(button => {
                button.type = 'button';
                if (!button.getAttribute('aria-label')) {
                    const label = button.querySelector('.wort')?.textContent?.trim() || button.title;
                    if (label)
                        button.setAttribute('aria-label', label);
                }
            });
            toolbar.addEventListener('keydown', event => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
                    return;
                const target = event.target instanceof Element ? event.target.closest('button') : null;
                if (!target)
                    return;
                const buttons = Array.from(toolbar.querySelectorAll('button'))
                    .filter(button => !button.disabled && button.getClientRects().length > 0);
                const index = buttons.indexOf(target);
                if (index < 0 || !buttons.length)
                    return;
                event.preventDefault();
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
                    : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
                buttons[next]?.focus();
                buttons[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            });
        }
    };
    const selectRegion = (paper, documentBlock, done) => {
        const leseflaeche = paper.closest('.blatt-flur') || paper;
        const warInert = leseflaeche.inert;
        leseflaeche.inert = false;
        paper.classList.add('document-selecting');
        const overlay = document.createElement('div');
        overlay.className = 'document-region-overlay';
        const box = document.createElement('div');
        box.className = 'document-region-box';
        overlay.appendChild(box);
        paper.appendChild(overlay);
        let start = null;
        let end = null;
        const point = (event) => {
            const rect = overlay.getBoundingClientRect();
            return {
                x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
                y: Math.max(0, Math.min(rect.height, event.clientY - rect.top))
            };
        };
        const draw = () => {
            if (!start || !end)
                return;
            const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
            const width = Math.abs(end.x - start.x), height = Math.abs(end.y - start.y);
            box.style.left = x + 'px';
            box.style.top = y + 'px';
            box.style.width = width + 'px';
            box.style.height = height + 'px';
        };
        const finish = (event) => {
            event.preventDefault();
            event.stopPropagation();
            end = point(event);
            draw();
            const rect = overlay.getBoundingClientRect();
            const width = Number(documentBlock.bw) || Number(documentBlock.blattBreite) || SheetSpace.A4_BREITE;
            const height = Number(documentBlock.bh) || Number(documentBlock.blattHoehe) || SheetSpace.A4_HOEHE;
            const x1 = Math.min(start?.x || 0, end.x), y1 = Math.min(start?.y || 0, end.y);
            const x2 = Math.max(start?.x || 0, end.x), y2 = Math.max(start?.y || 0, end.y);
            cleanup();
            if (x2 - x1 < 8 || y2 - y1 < 8 || !rect.width || !rect.height)
                return;
            done({
                x: x1 / rect.width * width,
                y: y1 / rect.height * height,
                width: (x2 - x1) / rect.width * width,
                height: (y2 - y1) / rect.height * height
            });
        };
        const move = (event) => {
            if (!start)
                return;
            event.preventDefault();
            event.stopPropagation();
            end = point(event);
            draw();
        };
        const down = (event) => {
            if (event.button !== 0)
                return;
            event.preventDefault();
            event.stopPropagation();
            start = point(event);
            end = start;
            draw();
            try {
                overlay.setPointerCapture(event.pointerId);
            }
            catch { }
        };
        const cleanup = () => {
            overlay.removeEventListener('pointerdown', down, true);
            overlay.removeEventListener('pointermove', move, true);
            overlay.removeEventListener('pointerup', finish, true);
            overlay.remove();
            paper.classList.remove('document-selecting');
            leseflaeche.inert = warInert;
            window.removeEventListener('keydown', escapeRegion, true);
        };
        const escapeRegion = (event) => {
            if (event.key !== 'Escape')
                return;
            event.preventDefault();
            event.stopPropagation();
            cleanup();
        };
        window.addEventListener('keydown', escapeRegion, true);
        overlay.addEventListener('pointercancel', cleanup, { once: true });
        overlay.addEventListener('pointerdown', down, true);
        overlay.addEventListener('pointermove', move, true);
        overlay.addEventListener('pointerup', finish, true);
    };
    const openSourceActions = (page, documentBlock, region) => {
        const learning = window.Learning;
        if (!learning?.sourceMenu) {
            UI.toast('Die Lernwerkzeuge sind noch nicht geladen.');
            return;
        }
        learning.sourceMenu(page, documentBlock, region || null);
    };
    let werkzeugDockAufraeumen;
    const dockFreigeben = () => { werkzeugDockAufraeumen?.(); werkzeugDockAufraeumen = undefined; };
    const render = (wrap, page) => {
        dockFreigeben();
        const documents = documentsIn(page);
        if (!documents.length)
            return false;
        const state = stateFor(page.id);
        state.index = Math.max(0, Math.min(state.index, documents.length - 1));
        const current = documents[state.index];
        if (!current)
            return false;
        griffeSchliessen();
        verweisHorchenAus();
        state.lupe = false;
        const workspace = document.createElement('section');
        workspace.className = 'document-workspace document-studio';
        workspace.dataset.pageId = page.id;
        workspace.dataset.documentTools = state.toolsOpen ? 'open' : 'closed';
        workspace.setAttribute('aria-label', 'Dokument: ' + (page.text || 'Ohne Titel'));
        const top = document.createElement('div');
        top.className = 'document-topbar';
        const topButton = (action, text, label, sym) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.documentAction = action;
            button.setAttribute('aria-label', label);
            button.title = label;
            if (sym)
                button.innerHTML = `<span data-sym="${sym}" aria-hidden="true"></span>`;
            else
                button.textContent = text;
            return button;
        };
        const zurueck = topButton('regal', '‹', 'Zurück zu den Dokumenten');
        zurueck.classList.add('document-zurueck');
        const zurueckWort = document.createElement('span');
        zurueckWort.className = 'dz-wort';
        zurueckWort.textContent = 'Dokumente';
        zurueck.append(zurueckWort);
        const thumbnailButton = topButton('thumbnails', '▤ ' + wortViele(page), wortViele(page) + 'übersicht öffnen');
        thumbnailButton.setAttribute('aria-expanded', String(state.thumbnailsOpen));
        const inspectorButton = topButton('inspector', 'Details', 'Notizen und Verknüpfungen öffnen');
        inspectorButton.setAttribute('aria-expanded', String(state.inspectorOpen));
        const navigation = document.createElement('div');
        navigation.className = 'document-navigation';
        navigation.append(zurueck, thumbnailButton);
        top.append(navigation);
        const position = document.createElement('button');
        position.type = 'button';
        position.className = 'document-position';
        position.dataset.documentAction = 'page-jump';
        position.textContent = wortEins(page) + ' ' + (state.index + 1) + '/' + documents.length;
        position.title = 'Direkt zu einer ' + wortEins(page).toLowerCase() + ' springen';
        position.setAttribute('aria-label', position.title);
        position.disabled = documents.length < 2;
        position.setAttribute('aria-live', 'polite');
        position.setAttribute('aria-atomic', 'true');
        const previousButton = topButton('previous', '‹', 'Vorherige Seite');
        const nextButton = topButton('next', '›', 'Nächste Seite');
        const pagination = document.createElement('div');
        pagination.className = 'document-pagination';
        pagination.setAttribute('role', 'group');
        pagination.setAttribute('aria-label', 'Im Dokument blättern');
        pagination.append(previousButton, position, nextButton);
        const zoom = document.createElement('input');
        zoom.type = 'range';
        zoom.min = '60';
        zoom.max = '180';
        zoom.step = '10';
        zoom.value = String(state.zoom);
        zoom.dataset.documentZoom = '';
        zoom.setAttribute('aria-label', 'Dokumentzoom');
        const zoomLabel = document.createElement('span');
        zoomLabel.className = 'document-zoom-label';
        zoomLabel.textContent = state.zoom + ' %';
        const zoomGroup = document.createElement('div');
        zoomGroup.className = 'document-zoom-group';
        zoomGroup.append(zoom, zoomLabel, topButton('fit', 'Anpassen', wortEins(page) + ' an die verfügbare Breite anpassen'));
        const titel = document.createElement('div');
        titel.className = 'document-title';
        titel.title = page.text || 'Ohne Titel';
        const titelName = document.createElement('span');
        titelName.className = 'document-title-name';
        titelName.textContent = page.text || 'Ohne Titel';
        const titelMeta = document.createElement('span');
        titelMeta.className = 'document-title-meta';
        const art = istFoliensatz(page) ? 'Präsentation'
            : documents.some((block) => block.type === 'pdfseite') ? 'PDF' : 'Notizheft';
        titelMeta.textContent = art + ' · ' + documents.length + ' ' +
            (documents.length === 1 ? wortEins(page) : wortViele(page));
        const titelFortschritt = document.createElement('progress');
        titelFortschritt.className = 'document-title-progress';
        titelFortschritt.max = documents.length;
        titelFortschritt.value = state.index + 1;
        titelFortschritt.hidden = documents.length <= 1;
        titelFortschritt.setAttribute('aria-label', 'Lesefortschritt im Dokument');
        titel.append(titelName, titelMeta, titelFortschritt);
        top.append(titel);
        if (page.gesperrt) {
            const schloss = document.createElement('span');
            schloss.className = 'document-locked';
            schloss.textContent = '🔏 Gesperrt';
            schloss.title = 'Diese Seite ist gegen Bearbeiten gesperrt. ' +
                'Über „Normale Seite" lässt sie sich wieder freigeben.';
            top.append(schloss);
        }
        const topActions = document.createElement('div');
        topActions.className = 'document-top-actions';
        const viewButton = topButton('view', '', 'Ansicht, Lesemodus und Zoom', 'eye');
        viewButton.className = 'document-view-button';
        viewButton.setAttribute('aria-expanded', 'false');
        const findButton = topButton('find', '', 'Im Dokument suchen (Strg F)', 'search');
        findButton.className = 'document-find-button';
        findButton.setAttribute('aria-expanded', 'false');
        const zeigenKnopf = topButton('praesentieren', '▶', 'Vollbild ohne Leisten — blättern mit Klick oder Pfeiltasten, zeigen mit gedrückter Maus');
        const zeigenWort = document.createElement('span');
        zeigenWort.className = 'dz-wort';
        zeigenWort.textContent = ' Präsentieren';
        zeigenKnopf.append(zeigenWort);
        const folienKnopf = topButton('folienmenue', '📽️ Folie', 'Neue Folie, Präsentieren, als PowerPoint sichern');
        folienKnopf.setAttribute('aria-haspopup', 'menu');
        folienKnopf.setAttribute('aria-expanded', 'false');
        folienKnopf.hidden = !istFoliensatz(page);
        const exitKnopf = topButton('exit', 'Seiteneditor', 'Seiteneditor — Dokumentmodus verlassen');
        const exitZeichen = document.createElement('span');
        exitZeichen.className = 'dz-zeichen';
        exitZeichen.dataset.sym = 'page';
        exitZeichen.setAttribute('aria-hidden', 'true');
        exitKnopf.prepend(exitZeichen);
        topActions.append(findButton, viewButton, inspectorButton, folienKnopf, zeigenKnopf, topButton('print', 'Drucken', 'Bearbeitete Fassung mit Notizen drucken'), exitKnopf);
        top.append(topActions);
        const commandbar = document.createElement('div');
        commandbar.className = 'document-commandbar';
        commandbar.setAttribute('aria-label', 'Dokumentansicht');
        commandbar.id = 'document-view-' + page.id;
        viewButton.setAttribute('aria-controls', commandbar.id);
        const modes = document.createElement('div');
        modes.className = 'document-mode-switch';
        modes.setAttribute('role', 'group');
        modes.setAttribute('aria-label', 'Lesen oder annotieren');
        const readButton = topButton('read', 'Lesen', 'Lesen — Zeichenwerkzeuge einklappen');
        const annotateButton = topButton('annotate', '✎ Annotieren', 'Annotieren — mit dem Stift auf der Seite schreiben');
        readButton.setAttribute('aria-pressed', String(!state.toolsOpen));
        annotateButton.setAttribute('aria-pressed', String(state.toolsOpen));
        const canAnnotate = !page.gesperrt && (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id));
        if (!canAnnotate) {
            state.toolsOpen = false;
            workspace.dataset.documentTools = 'closed';
            readButton.setAttribute('aria-pressed', 'true');
            annotateButton.setAttribute('aria-pressed', 'false');
        }
        annotateButton.disabled = !canAnnotate;
        if (!canAnnotate)
            annotateButton.title = 'Zum Annotieren brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.';
        modes.append(readButton, annotateButton);
        const findKlappe = topButton('find', '🔍 Suchen', 'Im Dokument suchen');
        findKlappe.className = 'document-find-klappe';
        const zeigenKlappe = topButton('praesentieren', '▶ Präsentieren', 'Vollbild ohne Leisten — blättern mit Tipp oder Pfeiltasten');
        zeigenKlappe.className = 'document-zeigen-klappe';
        const folienKlappe = topButton('folienmenue', '📽️ Folie', 'Folien: neue Folie, Liste, präsentieren, ausgeben');
        folienKlappe.className = 'document-folien-klappe';
        folienKlappe.setAttribute('aria-haspopup', 'menu');
        folienKlappe.hidden = !istFoliensatz(page);
        commandbar.append(modes, pagination, zoomGroup, findKlappe, zeigenKlappe, folienKlappe);
        let pdfZeigermodus = 'select';
        const pdfDockBlockOeffnen = (art) => {
            if (!canAnnotate)
                return;
            App.neueSeite();
            Ereignisse.frage(ARTEN.frageBlockAmEnde, { art });
        };
        const pdfDockMenue = (id) => {
            if (id === 'elektro') {
                const antwort = Ereignisse.frage(ARTEN.frageElektroMenue, {
                    schliessen: () => galerie?.schliesse(),
                    planOeffnen: () => pdfDockBlockOeffnen('schaltplan')
                }).find(x => x instanceof HTMLElement);
                return antwort ?? null;
            }
            const liste = document.createElement('div');
            liste.className = 'gfx-tb-liste gfx-tb-befehlsliste';
            const eintrag = (name, symbol, tun, gesperrt = false) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.disabled = gesperrt;
                const griff = document.createElement('span');
                griff.dataset.sym = symbol;
                griff.setAttribute('aria-hidden', 'true');
                b.append(griff, document.createTextNode(name));
                b.addEventListener('click', () => {
                    galerie?.schliesse();
                    tun();
                });
                liste.append(b);
            };
            const form = (kennzeichen, name, symbol) => {
                eintrag(name, symbol, () => {
                    inkWerkzeugWaehlen('formen');
                    inkToolbar()?.querySelector('[data-act="formart"][data-form="' + kennzeichen + '"]')?.click();
                    inkSync();
                }, !canAnnotate);
            };
            if (id === 'pdf-rahmen' || id === 'pdf-schnellmehr') {
                form('rectangle', 'Rechteck', 'formRect');
                form('ellipse', 'Ellipse', 'formEllipse');
            }
            if (id === 'pdf-verbinder' || id === 'pdf-schnellmehr') {
                form('line', 'Linie', 'formLine');
                form('arrow', 'Pfeil', 'formArrow');
                form('curve', 'Kurve', 'formCurve');
            }
            if (id === 'pdf-link' || id === 'pdf-schnellmehr') {
                const verweis = inkToolbar()?.querySelector('[data-act="verweis"]');
                eintrag('Auswahl verlinken', 'link', () => verweis?.click(), !canAnnotate || !verweis || verweis.disabled);
                eintrag('Dokumentlink kopieren', 'page', () => Register.aktionen.tun('link', page, { kontext: 'seite' }));
            }
            if (id === 'pdf-schnellmehr') {
                const objects = inkToolbar()?.querySelector('[data-act="objekte"]');
                eintrag('Ebenen, Gruppen und Ausrichten', 'grid', () => objects?.click(), !canAnnotate || !objects);
            }
            if (id === 'vorlagen') {
                eintrag('Textblock auf neuer Seite', 'inkText', () => pdfDockBlockOeffnen('text'), !canAnnotate);
                eintrag('Gedankenkarte auf neuer Seite', 'sparkle', () => pdfDockBlockOeffnen('mindmap'), !canAnnotate);
                eintrag('Whiteboard auf neuer Seite', 'grid', () => pdfDockBlockOeffnen('whiteboard'), !canAnnotate);
            }
            if (!liste.childElementCount)
                return null;
            Register.symbole.fuelle(liste);
            return liste;
        };
        const galerie = art === 'PDF'
            ? GfxToolbar.erstelle({
                klasse: 'document-pdf-dock',
                beschriftung: 'PDF bearbeiten',
                werkzeuge: Marken.WERKZEUGE,
                galerie: {
                    schnell: ['pdf-zeiger', 'pdf-rahmen', 'pdf-verbinder', 'pdf-link', 'pdf-schnellmehr'],
                    edgeless: { zusatz: ['pdf-objekte', 'elektro', 'pdf-werkzeuge'] },
                    karten: [
                        { id: 'notiz', knoepfe: ['zettel'] },
                        { id: 'stifte', knoepfe: ['stift', 'radierer'] },
                        { id: 'formen', knoepfe: ['formen'] },
                        { id: 'diagramme', knoepfe: ['diagramme'] },
                        { id: 'vorlagen', knoepfe: ['vorlagen'] }
                    ],
                    werkzeugMenues: {
                        'pdf-zeiger': ['select', 'schreiben'],
                        elektro: ['zeichen'],
                        'pdf-werkzeuge': ['marker', 'abdeck', 'text', 'textfix', 'elemente', 'bild', 'laser', 'ink-ruler', 'ink-options']
                    }
                },
                aktionen: [
                    { id: 'pdf-zeiger', name: 'Auswahl und Hand', sym: 'inkPointer', menue: true, kapsel: 'werkzeuge' },
                    { id: 'pdf-rahmen', name: 'Rahmenformen', sym: 'grid', menue: true, kapsel: 'werkzeuge' },
                    { id: 'pdf-verbinder', name: 'Linien und Pfeile', sym: 'inkConnector', menue: true, kapsel: 'werkzeuge' },
                    { id: 'pdf-link', name: 'Links', sym: 'link', menue: true, kapsel: 'werkzeuge' },
                    { id: 'elektro', name: 'Elektro', sym: 'bolt', menue: true, kapsel: 'werkzeuge' },
                    { id: 'pdf-schnellmehr', name: 'Weitere Schnellwerkzeuge', sym: 'dots', menue: true, kapsel: 'werkzeuge' },
                    { id: 'pdf-objekte', name: 'Objekte und Ebenen', sym: 'grid', kapsel: 'werkzeuge', gesperrt: !canAnnotate },
                    { id: 'diagramme', name: 'Gedankenkarte auf neuer Seite', sym: 'sparkle', kapsel: 'werkzeuge', gesperrt: !canAnnotate },
                    { id: 'vorlagen', name: 'Blockvorlagen', sym: 'table', menue: true, kapsel: 'werkzeuge' },
                    { id: 'pdf-werkzeuge', name: 'PDF-Werkzeuge', sym: 'dots', menue: true, kapsel: 'werkzeuge' },
                    { id: 'ink-options', name: 'Zeichenoptionen und Leiste einrichten', sym: 'dots', kapsel: 'werkzeuge' },
                    { id: 'ink-ruler', name: 'Lineal ein- oder ausblenden', sym: 'inkRuler', kapsel: 'werkzeuge' }
                ],
                menue: pdfDockMenue,
                aufAktion: id => {
                    if (id === 'diagramme')
                        pdfDockBlockOeffnen('mindmap');
                    if (id === 'pdf-objekte' && canAnnotate)
                        inkToolbar()?.querySelector('[data-act="objekte"]')?.click();
                }
            })
            : null;
        const drawingbar = galerie?.element ?? document.createElement('div');
        drawingbar.classList.add('document-drawingbar');
        if (galerie) {
            workspace.dataset.pdfGalerie = 'an';
            const zeiger = drawingbar.querySelector('[data-a="pdf-zeiger"]');
            zeiger?.addEventListener('click', (e) => {
                if (e.detail === 0 || !canAnnotate)
                    return;
                e.stopPropagation();
                galerie.schliesse();
                const aktiv = workspace.dataset.inkTool;
                inkWerkzeugWaehlen(aktiv === 'select' ? 'schreiben' : aktiv === 'schreiben' ? 'select' : pdfZeigermodus);
            });
            const kurz = {
                marker: 'Marker', abdeck: 'Abdecken', text: 'Text', textfix: 'Ändern',
                elemente: 'Elemente', bild: 'Bild', laser: 'Laser', 'ink-ruler': 'Lineal',
                'ink-options': 'Einrichten', select: 'Auswahl', schreiben: 'Hand', zeichen: 'Fachzeichen aufs PDF'
            };
            for (const knopf of drawingbar.querySelectorAll('[data-wz],[data-a]')) {
                const id = knopf.dataset.wz ?? knopf.dataset.a ?? '';
                if (knopf.dataset.wz)
                    knopf.dataset.documentTool = id;
                if (id === 'ink-options' || id === 'ink-ruler')
                    knopf.dataset.documentAction = id;
                if (kurz[id]) {
                    const name = document.createElement('span');
                    name.className = 'document-pdf-werkzeugname';
                    name.textContent = kurz[id];
                    knopf.append(name);
                }
            }
            werkzeugDockAufraeumen = galerie.zerstoere;
        }
        else {
            drawingbar.setAttribute('role', 'toolbar');
            drawingbar.setAttribute('aria-label', 'PDF bearbeiten');
            for (const { id, sym, name } of Marken.WERKZEUGE) {
                const knopf = document.createElement('button');
                knopf.type = 'button';
                knopf.dataset.documentTool = id;
                knopf.title = name;
                knopf.setAttribute('aria-label', name);
                const symbol = document.createElement('span');
                symbol.dataset.sym = sym;
                symbol.setAttribute('aria-hidden', 'true');
                knopf.append(symbol);
                drawingbar.append(knopf);
            }
        }
        const rulerButton = drawingbar.querySelector('[data-document-action="ink-ruler"]')
            ?? topButton('ink-ruler', '', 'Lineal ein- oder ausblenden', 'inkRuler');
        rulerButton.setAttribute('aria-pressed', 'false');
        const moreTools = drawingbar.querySelector('[data-document-action="ink-options"]')
            ?? topButton('ink-options', '···', 'Weitere Zeichenoptionen und Leiste einrichten');
        moreTools.setAttribute('aria-expanded', 'false');
        if (!galerie)
            drawingbar.append(rulerButton, moreTools);
        const history = document.createElement('div');
        history.className = 'document-ink-history';
        history.setAttribute('role', 'group');
        history.setAttribute('aria-label', 'Zeichenverlauf');
        history.append(topButton('ink-undo', '', 'Letzten Zeichenstrich rückgängig machen', 'undo'), topButton('ink-redo', '', 'Zeichenstrich wiederholen', 'redo'));
        const body = document.createElement('div');
        body.className = 'document-body' +
            (state.thumbnailsOpen ? ' with-thumbnails' : '') +
            (state.inspectorOpen ? ' with-inspector' : '');
        const thumbnails = document.createElement('aside');
        thumbnails.className = 'document-thumbnails' + (state.thumbnailsOpen ? ' is-open' : '');
        thumbnails.id = 'document-thumbnails-' + page.id;
        thumbnails.setAttribute('aria-label', wortViele(page) + 'übersicht');
        thumbnailButton.setAttribute('aria-controls', thumbnails.id);
        const thumbHeader = document.createElement('div');
        thumbHeader.className = 'document-panel-header';
        const thumbTitle = document.createElement('strong');
        thumbTitle.textContent = wortViele(page);
        const thumbClose = topButton('thumbnails-close', '✕', wortViele(page) + 'übersicht schließen');
        thumbHeader.append(thumbTitle, thumbClose);
        thumbnails.appendChild(thumbHeader);
        documents.forEach((block, index) => thumbnails.appendChild(thumbnail(block, index, index === state.index)));
        const center = document.createElement('main');
        center.className = 'document-center' + (state.einzeln ? ' ist-einzeln' : '');
        center.setAttribute('aria-label', 'Papierfläche');
        center.tabIndex = 0;
        const original = document.body.dataset['ruhig'] === 'aus'
            ? originalKnopf(page, current) : null;
        if (original) {
            original.classList.add('document-source-master');
            original.querySelector('.do-wort').textContent = 'Original · geschützt';
            center.appendChild(original);
            const copyLabel = document.createElement('div');
            copyLabel.className = 'document-copy-label';
            copyLabel.textContent = 'Arbeitskopie · hier schreiben und mit Notizen drucken';
            center.appendChild(copyLabel);
        }
        const jetzt = () => documents[Math.max(0, Math.min(state.index, documents.length - 1))] || current;
        const staende = [];
        const gezeichnet = new Set();
        let penTool = String(Store.getMeta('dokStift:' + page.id, 'stift'));
        let penColor = String(Store.getMeta('dokTinte:' + page.id, Marken.FARBEN[0]));
        let penWidth = Number(Store.getMeta('dokStrich:' + page.id, Marken.BREITEN[1]));
        const applyPen = (stand) => {
            if (!state.toolsOpen || !canAnnotate || !stand.isConnected)
                return;
            const toolbar = stand.querySelector('.blatt-werk');
            const key = Marken.WERKZEUGE.some(({ id }) => id === penTool) && penTool !== 'schreiben' ? penTool : 'stift';
            if (toolbar && toolbar.dataset.tool !== key)
                toolbar.querySelector('[data-wz="' + key + '"]')?.click();
            if (toolbar && !toolbar.dataset.documentPenReady) {
                toolbar.dataset.documentPenReady = 'true';
                Array.from(toolbar.querySelectorAll('[data-c]')).find(b => b.dataset.c === penColor)?.click();
                Array.from(toolbar.querySelectorAll('[data-b]')).find(b => Number(b.dataset.b) === penWidth)?.click();
            }
        };
        let treffer = [];
        let trefferNr = -1;
        let suchLauf = 0;
        const lageVon = (block) => (typeof PdfLeser !== 'undefined' && typeof PdfLeser.lageVonBlock === 'function')
            ? PdfLeser.lageVonBlock(block)
            : Promise.resolve([]);
        const norm = (s) => String(s || '').toLowerCase();
        const vereint = (k) => {
            const x0 = Math.min(...k.map(r => r.x)), y0 = Math.min(...k.map(r => r.y));
            return { x: x0, y: y0, w: Math.max(...k.map(r => r.x + r.w)) - x0, h: Math.max(...k.map(r => r.y + r.h)) - y0 };
        };
        const blattMasse = (block) => ({
            bw: Number(block.bw) || Number(block.blattBreite) || SheetSpace.A4_BREITE,
            bh: Number(block.bh) || Number(block.blattHoehe) || SheetSpace.A4_HOEHE
        });
        const trefferMalen = (nur) => {
            staende.forEach((stand, i) => {
                if (nur !== undefined && i !== nur)
                    return;
                stand.querySelectorAll('.document-trefferschicht').forEach(e => e.remove());
                const meine = treffer.map((t, n) => ({ t, n })).filter(x => x.t.index === i);
                stand.classList.toggle('hat-treffer', meine.length > 0);
                if (!meine.length || !gezeichnet.has(i))
                    return;
                const papier = stand.querySelector('.blatt-papier');
                const block = documents[i];
                if (!papier || !block)
                    return;
                const { bw, bh } = blattMasse(block);
                const schicht = document.createElement('div');
                schicht.className = 'document-trefferschicht';
                schicht.setAttribute('aria-hidden', 'true');
                meine.forEach(({ t, n }) => {
                    const el = document.createElement('span');
                    el.className = 'document-treffer' + (n === trefferNr ? ' ist-aktiv' : '');
                    el.dataset.treffer = String(n);
                    if (t.rect) {
                        el.style.left = (t.rect.x / bw * 100) + '%';
                        el.style.top = (t.rect.y / bh * 100) + '%';
                        el.style.width = (Math.max(t.rect.w, 4) / bw * 100) + '%';
                        el.style.height = (Math.max(t.rect.h, 4) / bh * 100) + '%';
                    }
                    else {
                        el.classList.add('ist-seite');
                    }
                    schicht.appendChild(el);
                });
                papier.appendChild(schicht);
            });
        };
        const verweiseLegen = (nur) => {
            staende.forEach((stand, k) => {
                if (nur !== undefined && k !== nur)
                    return;
                stand.querySelectorAll('.document-verweise').forEach(verweisLuft);
            });
        };
        const verweisLuft = (schicht) => {
            const ZIEL = 44;
            const kaesten = [...schicht.querySelectorAll('.document-verweis')]
                .map(el => ({ el, r: el.getBoundingClientRect() }));
            if (!kaesten.length)
                return;
            for (const a of kaesten) {
                if (!a.r.width && !a.r.height) {
                    a.el.style.removeProperty('--verweis-hoch');
                    a.el.style.removeProperty('--verweis-breit');
                    continue;
                }
                let hoch = Math.max(0, (ZIEL - a.r.height) / 2);
                let breit = Math.max(0, (ZIEL - a.r.width) / 2);
                for (const b of kaesten) {
                    if (b === a || (!b.r.width && !b.r.height))
                        continue;
                    const dx = Math.max(b.r.left - a.r.right, a.r.left - b.r.right, 0);
                    const dy = Math.max(b.r.top - a.r.bottom, a.r.top - b.r.bottom, 0);
                    if (!dx && !dy) {
                        hoch = 0;
                        breit = 0;
                        break;
                    }
                    if (dy)
                        hoch = Math.min(hoch, dy / 2);
                    if (dx)
                        breit = Math.min(breit, dx / 2);
                }
                a.el.style.setProperty('--verweis-hoch', Math.round(hoch) + 'px');
                a.el.style.setProperty('--verweis-breit', Math.round(breit) + 'px');
            }
        };
        const verweiseMalen = (i) => {
            const stand = staende[i];
            const block = documents[i];
            if (!stand || !block || block.type !== 'pdfseite' || !block.quelleId)
                return;
            const l = Promise.resolve(Array.isArray(block.verweise) ? block.verweise : []);
            void l.then((liste) => {
                if (!liste.length || !stand.isConnected)
                    return;
                const papier = stand.querySelector('.blatt-papier');
                if (!papier)
                    return;
                stand.querySelectorAll('.document-verweise').forEach(e => e.remove());
                const schicht = document.createElement('div');
                schicht.className = 'document-verweise';
                const { bw, bh } = blattMasse(block);
                liste.forEach((v) => {
                    let el;
                    if (v.url) {
                        const sicher = typeof Sanitize !== 'undefined' ? Sanitize.url(v.url) : '';
                        if (!sicher || !/^(https?:|mailto:)/i.test(sicher))
                            return;
                        const a = document.createElement('a');
                        a.href = sicher;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.title = sicher;
                        el = a;
                    }
                    else {
                        const ziel = documents.findIndex(b => b.quelleId === block.quelleId && Number(b.nr) === Number(v.seite));
                        if (ziel < 0)
                            return;
                        const k = document.createElement('button');
                        k.type = 'button';
                        k.dataset.documentIndex = String(ziel);
                        k.title = 'Zu Seite ' + (ziel + 1);
                        k.setAttribute('aria-label', 'Verweis zu Seite ' + (ziel + 1));
                        const zielBlock = documents[ziel];
                        const zielHoehe = zielBlock ? blattMasse(zielBlock).bh : bh;
                        if (typeof v.zielY === 'number' && Number.isFinite(v.zielY) && zielHoehe > 0)
                            k.dataset.documentStelle = String(Math.max(0, Math.min(1, v.zielY / zielHoehe)));
                        el = k;
                    }
                    el.classList.add('document-verweis');
                    el.style.left = (v.x / bw * 100) + '%';
                    el.style.top = (v.y / bh * 100) + '%';
                    el.style.width = (v.w / bw * 100) + '%';
                    el.style.height = (v.h / bh * 100) + '%';
                    schicht.appendChild(el);
                });
                if (!schicht.childElementCount)
                    return;
                papier.appendChild(schicht);
                verweiseLegen(i);
            });
        };
        const stillSetzen = (paper, still) => {
            const flur = paper.closest('.blatt-flur');
            if (flur)
                flur.inert = false;
            paper.inert = false;
            paper.querySelectorAll('.blatt-inhalt').forEach(inhalt => { inhalt.inert = still; });
        };
        const zeichneStand = (i) => {
            if (gezeichnet.has(i))
                return;
            const stand = staende[i];
            const block = documents[i];
            if (!stand || !block)
                return;
            gezeichnet.add(i);
            stand.style.removeProperty('height');
            renderDocument(stand, block);
            if (!state.toolsOpen)
                stand.querySelector('.blatt-werk [data-wz="schreiben"]')?.click();
            if (treffer.length)
                trefferMalen(i);
            verweiseMalen(i);
            stand.querySelectorAll('.blatt-papier').forEach(paper => {
                stillSetzen(paper, !state.toolsOpen);
            });
            requestAnimationFrame(() => applyPen(stand));
        };
        documents.forEach((block, i) => {
            const stand = document.createElement('div');
            stand.className = 'document-stage';
            stand.dataset.standNr = String(i);
            stand.addEventListener('pointerdown', event => {
                if (!(event.target instanceof Element) || event.target.closest('.blatt-reihe'))
                    return;
                state.index = i;
                seiteMerken(page.id, i);
                aktivMarkieren();
                applyPen(stand);
            }, true);
            const { bw, bh } = SheetSpace.masseVon(block);
            if (bw > 0 && bh > 0)
                stand.style.height = Math.round(Math.max(200, center.clientWidth - 36) * (bh / bw)) + 'px';
            staende.push(stand);
            center.appendChild(stand);
        });
        zeichneStand(Math.max(0, Math.min(state.index, documents.length - 1)));
        const inspector = document.createElement('aside');
        inspector.className = 'document-inspector' + (state.inspectorOpen ? ' is-open' : '');
        inspector.id = 'document-inspector-' + page.id;
        inspector.setAttribute('aria-label', 'Dokumentdetails und verknüpfte Inhalte');
        inspectorButton.setAttribute('aria-controls', inspector.id);
        renderInspector(inspector, page, current);
        body.append(thumbnails, center, inspector, history);
        const findbar = document.createElement('div');
        findbar.className = 'document-findbar';
        findbar.hidden = true;
        findbar.setAttribute('role', 'search');
        findbar.id = 'document-find-' + page.id;
        findButton.setAttribute('aria-controls', findbar.id);
        const findFeld = document.createElement('input');
        findFeld.type = 'search';
        findFeld.placeholder = 'Im Dokument suchen …';
        findFeld.setAttribute('aria-label', 'Im Dokument suchen');
        findFeld.dataset.documentFind = '';
        const findZahl = document.createElement('span');
        findZahl.className = 'document-find-zahl';
        findZahl.setAttribute('aria-live', 'polite');
        let findBereichJetzt = findBereich();
        const findBereichWahl = Segment.bauen({
            name: 'Wo suchen',
            wahlen: [
                { id: 'dokument', name: 'Dieses Dokument', zeichen: 'page' },
                { id: 'dokumente', name: 'Alle Dokumente', zeichen: 'pages' },
                { id: 'ueberall', name: 'Überall', zeichen: 'globe' }
            ],
            gewaehlt: findBereichJetzt,
            gewechselt: (id) => {
                findBereichJetzt = id === 'dokumente' ? 'dokumente' : id === 'ueberall' ? 'ueberall' : 'dokument';
                findBereichMerken(findBereichJetzt);
                fremdZeigen(findFeld.value);
                if (findBereichJetzt !== 'ueberall')
                    findFeld.focus();
            }
        });
        findBereichWahl.element.querySelectorAll('[data-seg-wahl]')
            .forEach(k => { k.title = (k.textContent || '').trim(); });
        const findBereichHuelle = document.createElement('div');
        findBereichHuelle.className = 'document-find-bereich';
        findBereichHuelle.append(findBereichWahl.element);
        findBereichWahl.element.addEventListener('click', ereignis => {
            const ziel = ereignis.target instanceof Element ? ereignis.target.closest('[data-seg-wahl="ueberall"]') : null;
            if (ziel)
                App.suche(findFeld.value, { bereich: 'ueberall' });
        });
        const findListe = document.createElement('div');
        findListe.className = 'document-find-liste';
        findListe.hidden = true;
        findbar.append(findFeld, findZahl, findBereichHuelle, topButton('find-previous', '‹', 'Voriger Treffer'), topButton('find-next', '›', 'Nächster Treffer'), topButton('find-close', '✕', 'Suche schließen'), findListe);
        let folienband = folienbandBauen(page, drawingbar);
        workspace.append(top, ...(folienband ? [folienband] : []), findbar, ...(folienband || galerie ? [] : [drawingbar]), commandbar, body, ...(galerie ? [drawingbar] : []));
        const folienbandNachziehen = () => {
            const soll = istFoliensatz(page) && innerWidth >= BAND_AB;
            const ist = !!folienband && folienband.isConnected;
            if (soll === ist)
                return;
            if (!soll) {
                drawingbar.hidden = false;
                drawingbar.setAttribute('aria-label', 'PDF bearbeiten');
                findbar.after(drawingbar);
                folienband?.remove();
                folienband = null;
                return;
            }
            folienband = folienbandBauen(page, drawingbar);
            if (folienband)
                top.after(folienband);
        };
        wrap.appendChild(workspace);
        if (!galerie && typeof Formelheft !== 'undefined') {
            const heft = document.createElement('button');
            heft.type = 'button';
            heft.dataset.documentAction = 'formelheft';
            heft.setAttribute('aria-label', 'Formelheft');
            heft.title = 'Mein eigenes Formelheft — liegt über der Seite; schieben und '
                + 'an der Ecke grösser ziehen';
            heft.setAttribute('aria-pressed', 'false');
            const heftZeichen = document.createElement('span');
            heftZeichen.dataset.sym = 'book';
            heftZeichen.setAttribute('aria-hidden', 'true');
            heft.appendChild(heftZeichen);
            drawingbar.querySelector('[data-document-tool="zeichen"]')?.after(heft);
            const heftSync = () => {
                if (!workspace.isConnected) {
                    Formelheft.vergiss(heftSync);
                    return;
                }
                heft.setAttribute('aria-pressed', String(!!Formelheft.offen()));
            };
            Formelheft.horche(heftSync);
            heftSync();
        }
        if (typeof Register !== 'undefined')
            Register.symbole.fuelle(drawingbar);
        if (typeof Register !== 'undefined') {
            try {
                Register.symbole.fuelle(top);
                Register.symbole.fuelle(history);
            }
            catch { }
        }
        const inkToolbar = () => staende[state.index]?.querySelector('.blatt-werk') || null;
        const inkFlaeche = () => inkToolbar();
        let beobachtet = null;
        const ordnungObserver = new MutationObserver(() => {
            if (!workspace.isConnected) {
                ordnungObserver.disconnect();
                return;
            }
            inkSync();
        });
        const ordnungBeobachten = () => {
            const source = inkFlaeche();
            if (!source || source === beobachtet)
                return;
            ordnungObserver.disconnect();
            ordnungObserver.observe(source, { childList: true });
            beobachtet = source;
        };
        const zeichenSpiegeln = (kopie, echt) => {
            if (!echt)
                return;
            const glyph = kopie.querySelector(':scope > [data-sym]');
            const sym = echt.querySelector('[data-sym]')?.dataset.sym || '';
            if (!glyph || !sym)
                return;
            const form = echt.dataset.form || '';
            if (glyph.dataset.sym === sym && (kopie.dataset.form || '') === form)
                return;
            glyph.dataset.sym = sym;
            if (form)
                kopie.dataset.form = form;
            else
                delete kopie.dataset.form;
            try {
                Register.symbole.fuelle(kopie);
            }
            catch { }
            const titel = echt.getAttribute('title');
            if (titel) {
                kopie.title = titel;
                kopie.setAttribute('aria-label', titel);
            }
        };
        const inkSync = () => {
            if (!workspace.isConnected) {
                Zeichenziel.vergiss(inkSync);
                return;
            }
            const source = inkToolbar();
            source?.dispatchEvent(new Event('ink-studio-ready'));
            const wunsch = Array.from(inkFlaeche()?.querySelectorAll(':scope > [data-wz]') || [])
                .map(real => drawingbar.querySelector(`[data-document-tool="${real.dataset.wz}"]`))
                .filter((button) => !!button);
            const jetzt = Array.from(drawingbar.querySelectorAll(':scope > [data-document-tool]'))
                .filter(button => wunsch.includes(button));
            if (!galerie && wunsch.some((button, index) => button !== jetzt[index])) {
                wunsch.forEach(button => drawingbar.insertBefore(button, rulerButton));
            }
            const realRuler = source?.querySelector('[data-act="lineal"]');
            rulerButton.disabled = !canAnnotate || !state.toolsOpen || !realRuler;
            rulerButton.setAttribute('aria-pressed', realRuler?.getAttribute('aria-pressed') || 'false');
            const werkzeug = source?.dataset.tool || 'schreiben';
            if (galerie && workspace.dataset.inkTool !== werkzeug) {
                const aktiverKnopf = source?.querySelector(':scope > [data-wz].on');
                galerie.setzeWerkzeug(aktiverKnopf?.dataset.wz ?? werkzeug);
            }
            workspace.dataset.inkTool = werkzeug;
            if (galerie && (werkzeug === 'select' || werkzeug === 'schreiben')) {
                pdfZeigermodus = werkzeug;
                const symbol = drawingbar.querySelector('[data-a="pdf-zeiger"] .zeichen');
                const zeichen = werkzeug === 'schreiben' ? 'inkHand' : 'inkPointer';
                if (symbol && symbol.dataset.sym !== zeichen) {
                    symbol.dataset.sym = zeichen;
                    Register.symbole.fuelle(symbol.parentElement);
                }
            }
            drawingbar.querySelectorAll('[data-document-tool]').forEach(button => {
                const real = source?.querySelector('[data-wz="' + button.dataset.documentTool + '"]');
                button.disabled = !canAnnotate || !state.toolsOpen || !real || real.disabled;
                button.setAttribute('aria-pressed', String(state.toolsOpen && real?.getAttribute('aria-pressed') === 'true'));
                zeichenSpiegeln(button, real);
            });
            for (const action of ['undo', 'redo']) {
                const real = source?.querySelector('[data-act="' + action + '"]');
                const button = history.querySelector('[data-document-action="ink-' + action + '"]');
                if (button)
                    button.disabled = !canAnnotate || !real || real.disabled;
            }
            ordnungBeobachten();
        };
        Zeichenziel.horche(inkSync);
        const inkObserver = new MutationObserver(() => {
            if (!workspace.isConnected) {
                inkObserver.disconnect();
                return;
            }
            inkSync();
        });
        inkObserver.observe(center, { subtree: true, attributes: true, attributeFilter: ['disabled', 'aria-pressed', 'data-tool'] });
        const hoeheSetzen = () => {
            if (!workspace.isConnected)
                return;
            const oben = Math.round(workspace.getBoundingClientRect().top);
            if (oben < 0 || oben >= window.innerHeight)
                return;
            workspace.style.height = Math.max(240, window.innerHeight - oben) + 'px';
        };
        let zeigenFlaeche = null;
        let laser = null;
        let laserWeg = null;
        const passen = () => {
            if (!workspace.isConnected)
                return;
            const raum = center.clientWidth;
            if (raum < 120)
                return;
            let breit = Math.round(Math.min(raum - 36, 980) * (state.zoom / 100));
            if (state.lupe) {
                const platz = center.clientHeight - 24;
                const masse = SheetSpace.masseVon(documents[state.index] || {});
                if (platz > 80 && masse.bh > 0)
                    breit = Math.round(Math.max(120, Math.min(breit, platz * masse.bw / masse.bh)));
            }
            if (zeigenFlaeche) {
                const platz = center.clientHeight - 36;
                const masse = SheetSpace.masseVon(documents[state.index] || {});
                breit = masse.bh > 0 && platz > 80
                    ? Math.round(Math.max(120, Math.min(raum - 36, platz * masse.bw / masse.bh)))
                    : Math.round(raum - 36);
            }
            center.style.setProperty('--doc-blatt', Math.max(120, breit) + 'px');
            platzhalterSetzen(Math.max(120, breit));
            verweiseLegen();
            if (state.lupe)
                requestAnimationFrame(lupeLegen);
        };
        const platzhalterSetzen = (breit) => {
            staende.forEach((stand, i) => {
                if (gezeichnet.has(i))
                    return;
                const block = documents[i];
                if (!block)
                    return;
                const { bw, bh } = SheetSpace.masseVon(block);
                if (bw > 0 && bh > 0)
                    stand.style.height = Math.round(breit * (bh / bw)) + 'px';
            });
            inkSync();
        };
        const beiGroesse = () => {
            if (!workspace.isConnected) {
                window.removeEventListener('resize', beiGroesse);
                return;
            }
            folienbandNachziehen();
            hoeheSetzen();
            passen();
            aktivMarkieren();
            nachziehen();
        };
        window.addEventListener('resize', beiGroesse, { passive: true });
        let springtZu = -1;
        let standGesetzt = false;
        const aktivMarkieren = () => {
            previousButton.disabled = state.index === 0;
            nextButton.disabled = state.index === documents.length - 1;
            position.setAttribute('aria-label', wortEins(page) + ' ' + (state.index + 1) +
                ' von ' + documents.length + ' — zu einer anderen ' +
                wortEins(page).toLowerCase() + ' springen');
            titelFortschritt.value = state.index + 1;
            titelFortschritt.setAttribute('aria-valuetext', wortEins(page) + ' ' +
                (state.index + 1) + ' von ' + documents.length);
            thumbnails.querySelectorAll('[data-document-index]').forEach(button => {
                if (Number(button.dataset.documentIndex) === state.index)
                    button.setAttribute('aria-current', 'page');
                else
                    button.removeAttribute('aria-current');
            });
            staende.forEach((stand, i) => {
                if (i === state.index)
                    stand.setAttribute('data-aktiv', '');
                else
                    stand.removeAttribute('data-aktiv');
            });
            inkSync();
        };
        const nachziehen = () => {
            if (!center.isConnected)
                return;
            if (!standGesetzt)
                return;
            if (state.einzeln) {
                springtZu = -1;
                zeichneStand(state.index);
                return;
            }
            const oben = center.scrollTop - center.clientHeight;
            const unten = center.scrollTop + 2 * center.clientHeight;
            let sichtbar = state.index;
            staende.forEach((stand, i) => {
                const y = stand.offsetTop, h = stand.offsetHeight;
                if (y + h >= oben && y <= unten)
                    zeichneStand(i);
                if (y <= center.scrollTop + center.clientHeight / 2 &&
                    y + h > center.scrollTop + center.clientHeight / 2)
                    sichtbar = i;
            });
            if (springtZu >= 0) {
                const ziel = staende[springtZu]?.offsetTop ?? 0;
                if (Math.abs(center.scrollTop - ziel) > 4)
                    return;
                springtZu = -1;
            }
            if (sichtbar !== state.index) {
                state.index = sichtbar;
                seiteMerken(page.id, sichtbar);
                aktivMarkieren();
                position.textContent = wortEins(page) + ' ' + (sichtbar + 1) + '/' + documents.length;
                thumbnails.querySelectorAll('.document-thumbnail.is-selected')
                    .forEach(el => el.classList.remove('is-selected'));
                thumbnails.querySelector('[data-document-index="' + sichtbar + '"]')
                    ?.classList.add('is-selected');
                if (state.inspectorOpen)
                    renderInspector(inspector, page, jetzt());
            }
        };
        let rollWartet = false;
        center.addEventListener('scroll', () => {
            if (rollWartet)
                return;
            rollWartet = true;
            requestAnimationFrame(() => { rollWartet = false; nachziehen(); });
        }, { passive: true });
        requestAnimationFrame(() => {
            hoeheSetzen();
            passen();
            if (state.index > 0 && staende[state.index])
                center.scrollTop = staende[state.index].offsetTop;
            aktivMarkieren();
            standGesetzt = true;
            nachziehen();
            thumbnails.querySelector('.document-thumbnail.is-selected')
                ?.scrollIntoView({ block: 'nearest' });
            activateVisibleThumbnails(thumbnails);
        });
        const laserZeigen = (x, y) => {
            if (!zeigenFlaeche)
                return;
            if (!laser) {
                laser = document.createElement('div');
                laser.className = 'document-laser';
                laser.setAttribute('aria-hidden', 'true');
                zeigenFlaeche.appendChild(laser);
            }
            const r = zeigenFlaeche.getBoundingClientRect();
            laser.style.left = (x - r.left) + 'px';
            laser.style.top = (y - r.top) + 'px';
            laser.classList.add('an');
            if (laserWeg)
                clearTimeout(laserWeg);
        };
        const laserLoeschen = () => {
            if (laserWeg)
                clearTimeout(laserWeg);
            laserWeg = setTimeout(() => { laser?.classList.remove('an'); }, 700);
        };
        const zeigenAn = async () => {
            if (zeigenFlaeche)
                return;
            workspace.dataset.documentZeigen = 'an';
            const flaeche = document.createElement('div');
            flaeche.className = 'document-zeigen-flaeche';
            flaeche.setAttribute('role', 'group');
            flaeche.setAttribute('aria-label', 'Präsentation — links zurück, rechts weiter');
            const raus = document.createElement('button');
            raus.type = 'button';
            raus.className = 'document-zeigen-raus';
            raus.dataset.documentAction = 'praesentieren-aus';
            raus.textContent = '✕ Präsentation beenden';
            flaeche.appendChild(raus);
            center.appendChild(flaeche);
            zeigenFlaeche = flaeche;
            const tippVon = [0, 0];
            flaeche.addEventListener('pointerdown', event => {
                tippVon[0] = event.clientX;
                tippVon[1] = event.clientY;
                if (event.target?.closest('.document-zeigen-raus'))
                    return;
                event.preventDefault();
                try {
                    flaeche.setPointerCapture?.(event.pointerId);
                }
                catch { }
                laserZeigen(event.clientX, event.clientY);
            });
            flaeche.addEventListener('pointermove', event => {
                if (event.buttons)
                    laserZeigen(event.clientX, event.clientY);
            });
            flaeche.addEventListener('pointerup', event => {
                if (event.target?.closest('.document-zeigen-raus'))
                    return;
                laserLoeschen();
                const r = flaeche.getBoundingClientRect();
                if (Math.hypot(event.clientX - tippVon[0], event.clientY - tippVon[1]) > 8)
                    return;
                const deckel = document.elementsFromPoint(event.clientX, event.clientY)
                    .map(el => el.closest?.('[data-ink-art="abdeck"]'))
                    .find(Boolean);
                if (deckel && !deckel.hasAttribute('data-auf')) {
                    deckel.setAttribute('data-auf', '1');
                    return;
                }
                springe(state.index + (event.clientX - r.left < r.width / 3 ? -1 : 1), false);
            });
            if (typeof App !== 'undefined' && App.vollbild) {
                try {
                    await App.vollbild(true);
                }
                catch { }
            }
            passen();
            raus.focus();
        };
        const zeigenAus = () => {
            if (!zeigenFlaeche)
                return;
            if (laserWeg)
                clearTimeout(laserWeg);
            laser = null;
            laserWeg = null;
            zeigenFlaeche.remove();
            zeigenFlaeche = null;
            delete workspace.dataset.documentZeigen;
            if (typeof App !== 'undefined' && App.vollbildAn?.()) {
                void App.vollbild(false);
            }
            passen();
        };
        const vollbildGewechselt = () => {
            if (!workspace.isConnected) {
                document.removeEventListener('fullscreenchange', vollbildGewechselt);
                return;
            }
            if (zeigenFlaeche && typeof App !== 'undefined' && App.vollbildAn && !App.vollbildAn())
                zeigenAus();
        };
        document.addEventListener('fullscreenchange', vollbildGewechselt);
        const springe = (i, weich = true) => {
            const nr = Math.max(0, Math.min(documents.length - 1, i));
            state.index = nr;
            seiteMerken(page.id, nr);
            zeichneStand(nr);
            aktivMarkieren();
            const stand = staende[nr];
            if (stand) {
                springtZu = nr;
                if (weich && !AppEinstellung.wenigBewegung() && typeof center.scrollTo === 'function')
                    center.scrollTo({ top: stand.offsetTop, behavior: 'smooth' });
                else
                    center.scrollTop = stand.offsetTop;
            }
            position.textContent = wortEins(page) + ' ' + (nr + 1) + '/' + documents.length;
            thumbnails.querySelectorAll('.document-thumbnail.is-selected')
                .forEach(el => el.classList.remove('is-selected'));
            thumbnails.querySelector('[data-document-index="' + nr + '"]')
                ?.classList.add('is-selected');
            if (state.lupe && lupeKnoten && documents[nr] && lupeKnoten !== lupePapierVon(staende[nr])) {
                lupeUmziehen(false);
                lupeX = 0;
                lupeY = 0;
                lupeUmziehen(true);
                requestAnimationFrame(lupeLegen);
            }
            if (state.inspectorOpen)
                renderInspector(inspector, page, jetzt());
            passen();
        };
        const rerender = () => App.zeichneSeite();
        const zahlZeigen = () => {
            if (!findFeld.value.trim() || findFeld.value.trim().length < 2) {
                findZahl.textContent = '';
                return;
            }
            findZahl.textContent = !treffer.length ? 'Nichts gefunden'
                : trefferNr < 0 ? treffer.length + (treffer.length === 1 ? ' Treffer' : ' Treffer')
                    : (trefferNr + 1) + '/' + treffer.length;
        };
        const suchen = async (wort) => {
            const q = norm(wort.trim());
            const lauf = ++suchLauf;
            treffer = [];
            trefferNr = -1;
            if (q.length < 2) {
                trefferMalen();
                zahlZeigen();
                return;
            }
            const neu = [];
            for (let i = 0; i < documents.length && neu.length < 500; i++) {
                const block = documents[i];
                if (!block)
                    continue;
                if (block.type === 'pdfseite') {
                    const stuecke = await lageVon(block);
                    if (lauf !== suchLauf)
                        return;
                    if (stuecke.length) {
                        let text = '';
                        const karte = [];
                        const anfang = [];
                        stuecke.forEach((s, k) => {
                            const teil = String(s.s);
                            anfang[k] = text.length;
                            for (let c = 0; c < teil.length; c++)
                                karte.push(k);
                            text += teil;
                            if (s.eol) {
                                text += '\n';
                                karte.push(-1);
                            }
                        });
                        const t = norm(text);
                        let von = 0;
                        while (neu.length < 500) {
                            von = t.indexOf(q, von);
                            if (von < 0)
                                break;
                            const bis = von + q.length;
                            const ks = new Set();
                            for (let c = von; c < bis; c++) {
                                const k = karte[c];
                                if (k !== undefined && k >= 0)
                                    ks.add(k);
                            }
                            const anteil = (text, bis2) => {
                                const ganz = InkGeometry.textWidth(text, 1);
                                if (!(ganz > 0))
                                    return bis2 / Math.max(1, text.length);
                                return Math.max(0, Math.min(1, InkGeometry.textWidth(text.slice(0, bis2), 1) / ganz));
                            };
                            const kaesten = [...ks].map(k => {
                                const st = stuecke[k];
                                if (!st)
                                    return null;
                                const text = String(st.s);
                                const len = Math.max(1, text.length);
                                const a = Math.max(0, von - (anfang[k] ?? 0)), z = Math.min(len, bis - (anfang[k] ?? 0));
                                const p1 = anteil(text, a), p2 = anteil(text, z);
                                return { x: st.x + st.w * p1, y: st.y, w: Math.max(2, st.w * (p2 - p1)), h: st.h };
                            }).filter((k) => !!k);
                            neu.push({ index: i, rect: kaesten.length ? vereint(kaesten) : null });
                            von = bis;
                        }
                        continue;
                    }
                    if (norm(block.suchtext).includes(q))
                        neu.push({ index: i, rect: null });
                }
                else {
                    let da = false;
                    for (const m of (Array.isArray(block.marken) ? block.marken : [])) {
                        if ((m.art === 'text' || m.art === 'zettel') && norm(m.text).includes(q)) {
                            const b = InkGeometry.bounds(m);
                            neu.push({ index: i, rect: { x: b.x, y: b.y, w: b.width, h: b.height } });
                            da = true;
                        }
                    }
                    if (!da && Store.childrenOf(block.id).some((k) => norm(k.text).includes(q)))
                        neu.push({ index: i, rect: null });
                }
            }
            if (lauf !== suchLauf)
                return;
            treffer = neu;
            trefferNr = -1;
            trefferMalen();
            zahlZeigen();
            fremdZeigen(wort);
        };
        const fremdZeigen = (wort) => {
            const q = String(wort || '').trim();
            if (findBereichJetzt === 'dokument' || q.length < 2) {
                findListe.hidden = true;
                findListe.textContent = '';
                return;
            }
            const { liste, mehr } = fremdeTreffer(q, page.id);
            findListe.textContent = '';
            if (!liste.length) {
                findListe.hidden = false;
                const leer = document.createElement('p');
                leer.className = 'document-find-leer';
                leer.textContent = 'In anderen Dokumenten: nichts gefunden.';
                findListe.appendChild(leer);
                return;
            }
            const kopf = document.createElement('p');
            kopf.className = 'document-find-kopf';
            kopf.textContent = liste.length + (liste.length === 1 ? ' Seite' : ' Seiten')
                + ' in anderen Dokumenten' + (mehr ? ' (es sind mehr — Begriff eingrenzen)' : '');
            findListe.appendChild(kopf);
            for (const t of liste) {
                const knopf = document.createElement('button');
                knopf.type = 'button';
                knopf.className = 'document-find-fund';
                knopf.dataset.documentFund = t.seiteId;
                knopf.dataset.documentFundBlock = t.blockId;
                knopf.title = t.name + ' — Seite ' + t.nr;
                const zeile = document.createElement('span');
                zeile.className = 'document-find-fund-zeile';
                zeile.textContent = t.icon + ' ' + t.name + ' · Seite ' + t.nr;
                const auszug = document.createElement('span');
                auszug.className = 'document-find-fund-text';
                auszug.textContent = t.auszug;
                knopf.append(zeile, auszug);
                findListe.appendChild(knopf);
            }
            findListe.hidden = false;
        };
        const zumFremden = (seiteId, blockId) => {
            const ziel = Store.getBlock(seiteId);
            if (!ziel) {
                UI.toast('Diese Seite gibt es nicht mehr.');
                return;
            }
            select(ziel, blockId);
            sprungWunsch = { seiteId, wort: findFeld.value };
            App.oeffne(seiteId);
        };
        const zumTreffer = (n) => {
            if (!treffer.length)
                return;
            trefferNr = ((n % treffer.length) + treffer.length) % treffer.length;
            const t = treffer[trefferNr];
            springe(t.index, false);
            trefferMalen();
            zahlZeigen();
            const el = staende[t.index]?.querySelector('.document-treffer.ist-aktiv');
            if (el && !el.classList.contains('ist-seite')) {
                const r = el.getBoundingClientRect(), c = center.getBoundingClientRect();
                center.scrollTop += (r.top - c.top) - c.height / 3;
            }
        };
        let suchTimer = null;
        findFeld.addEventListener('input', () => {
            if (suchTimer)
                clearTimeout(suchTimer);
            suchTimer = setTimeout(() => { void suchen(findFeld.value); }, 200);
        });
        findFeld.addEventListener('keydown', event => {
            if (event.key !== 'Enter')
                return;
            event.preventDefault();
            zumTreffer(trefferNr + (event.shiftKey ? -1 : 1));
        });
        const findbarSetzen = (an, fokus = true, selbstSuchen = true) => {
            findbar.hidden = !an;
            findButton.setAttribute('aria-expanded', String(an));
            findButton.classList.toggle('an', an);
            if (an) {
                if (workspace.dataset.documentView === 'open') {
                    workspace.dataset.documentView = 'closed';
                    viewButton.setAttribute('aria-expanded', 'false');
                }
                if (fokus)
                    findFeld.focus();
                if (selbstSuchen && findFeld.value.trim())
                    void suchen(findFeld.value);
            }
            else {
                suchLauf++;
                treffer = [];
                trefferNr = -1;
                trefferMalen();
                findZahl.textContent = '';
                findListe.hidden = true;
                findListe.textContent = '';
            }
        };
        const darfSeiten = () => !page.gesperrt && (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id));
        const stelleVon = (block) => {
            const eltern = block?.parentId ? Store.getBlock(block.parentId) : null;
            if (!eltern || !Array.isArray(eltern.content))
                return null;
            const index = eltern.content.indexOf(block.id);
            return index < 0 ? null : { eltern, index };
        };
        const neuMit = (blockId) => {
            const liste = documentsIn(page);
            const i = blockId ? liste.findIndex(block => block.id === blockId) : -1;
            state.index = Math.max(0, Math.min(liste.length - 1, i >= 0 ? i : state.index));
            seiteMerken(page.id, state.index);
            rerender();
        };
        const seiteEinfuegen = (wen) => {
            const block = wen || jetzt();
            const stelle = stelleVon(block);
            if (!stelle) {
                UI.toast('Diese Seite hat keinen Platz, an dem sich etwas einfügen liesse.');
                return;
            }
            const papier = String(Store.getMeta('heft:papier', 'blanko'));
            const neu = Store.addBlock(stelle.eltern.id, 'blatt', {
                text: '', papier, blattBreite: SheetSpace.A4_BREITE, blattHoehe: SheetSpace.A4_HOEHE,
                raumVersion: SheetSpace.RAUM_VERSION
            }, stelle.index + 1);
            Store.addBlock(neu.id, 'text', { text: '' });
            UI.toast('Leere Seite eingefügt');
            neuMit(neu.id);
        };
        const seiteDuplizieren = (wen) => {
            const block = wen || jetzt();
            const stelle = stelleVon(block);
            if (!stelle) {
                UI.toast('Diese Seite lässt sich hier nicht verdoppeln.');
                return;
            }
            const daten = Store.baum(block.id);
            if (!daten)
                return;
            delete daten.lesezeichen;
            const neu = Store.baumEinfuegen(daten, stelle.eltern.id, stelle.index + 1);
            if (!neu)
                return;
            seitenbildKopieren(block, neu.id);
            UI.toast(wortEins(page) + ' verdoppelt');
            neuMit(neu.id);
        };
        const seitenbildKopieren = (block, zielId) => {
            if (block.type === 'pdfseite' && block.bildDateiId && typeof Dateien !== 'undefined') {
                const alt = String(block.bildDateiId);
                void (async () => {
                    try {
                        const [blob, satz] = await Promise.all([dateiBlob(alt), Store.dateiHolen(alt)]);
                        if (!blob)
                            return;
                        const kopie = await Dateien.ablegen(new File([blob], String(satz?.name || 'seite.webp'), { type: blob.type || 'image/webp' }), { blockId: zielId, abgeleitet: satz ? !!satz.abgeleitet : block.herkunft !== 'bild' });
                        Store.updateBlock(zielId, { bildDateiId: kopie.id });
                    }
                    catch (e) {
                        UI.toast('Das Seitenbild liess sich nicht mitkopieren: ' + (e instanceof Error ? e.message : String(e)));
                    }
                })();
            }
        };
        const ZIELE_HOECHSTENS = 40;
        const andereDokumente = (ausser) => {
            const raus = [];
            const gesehen = new Set();
            let bloecke = 0;
            for (const block of Object.values(Store.cache.blocks)) {
                if (raus.length >= ZIELE_HOECHSTENS)
                    break;
                if (++bloecke > FREMD_BLOECKE)
                    break;
                if (!block || block.alive === false)
                    continue;
                if (block.type !== 'pdfseite' && block.type !== 'blatt')
                    continue;
                const seite = seiteZu(block);
                if (!seite || !seite.alive || seite.id === ausser || gesehen.has(seite.id))
                    continue;
                gesehen.add(seite.id);
                if (seite.gesperrt)
                    continue;
                if (typeof Konten !== 'undefined' && Konten.darf && !Konten.darf('bearbeiten', seite.id))
                    continue;
                raus.push({ id: seite.id, name: String(seite.text || 'Ohne Titel'),
                    icon: String(seite.icon || '📄'), seiten: documentsIn(seite).length });
            }
            raus.sort((a, b) => a.name.localeCompare(b.name));
            return raus;
        };
        const zielEltern = (zielSeite) => {
            const seiten = documentsIn(zielSeite);
            const letzte = seiten[seiten.length - 1];
            const eltern = letzte ? Store.getBlock(letzte.parentId) : null;
            return eltern || zielSeite;
        };
        const seiteInsDokument = async (wen) => {
            const block = wen || jetzt();
            if (!block)
                return;
            if (typeof Dialog === 'undefined') {
                UI.toast('Der Dialog ist gerade nicht da.');
                return;
            }
            const ziele = andereDokumente(page.id);
            if (!ziele.length) {
                UI.toast('Es gibt kein anderes Dokument, in das die Seite passen würde.');
                return;
            }
            const wohin = await Dialog.wahl({
                titel: 'In welches Dokument?',
                text: 'Die Seite kommt ans Ende des gewählten Dokuments — mit allem, was darauf steht.',
                knoepfe: ziele.map(z => ({ id: 'ziel:' + z.id, text: z.icon + ' ' + z.name,
                    hinweis: z.seiten === 1 ? 'eine Seite' : z.seiten + ' Seiten' }))
            });
            if (!wohin.startsWith('ziel:'))
                return;
            const zielSeite = Store.getBlock(wohin.slice(5));
            if (!zielSeite || zielSeite.alive === false) {
                UI.toast('Dieses Dokument gibt es nicht mehr.');
                return;
            }
            const liste = documentsIn(page);
            const letzte = liste.length < 2;
            const wie = await Dialog.wahl({
                titel: 'Kopieren oder verschieben?',
                text: letzte
                    ? 'Dies ist die einzige Seite dieses Dokuments — verschieben würde es leeren, darum geht hier nur kopieren.'
                    : 'Beim Verschieben ist die Seite hier weg; beim Kopieren bleibt sie stehen.',
                knoepfe: [
                    { id: 'kopieren', text: '⧉ Kopieren', hinweis: 'Die Seite steht danach in beiden Dokumenten' },
                    ...(letzte ? [] : [{ id: 'verschieben', text: '↗ Verschieben',
                            hinweis: 'Die Seite verlässt dieses Dokument' }])
                ]
            });
            if (wie !== 'kopieren' && wie !== 'verschieben')
                return;
            const ziel = zielEltern(zielSeite);
            if (wie === 'kopieren') {
                const daten = Store.baum(block.id);
                if (!daten) {
                    UI.toast('Diese Seite liess sich nicht lesen.');
                    return;
                }
                delete daten.lesezeichen;
                const neu = Store.baumEinfuegen(daten, ziel.id, -1);
                if (!neu) {
                    UI.toast('Die Kopie liess sich nicht anlegen.');
                    return;
                }
                seitenbildKopieren(block, neu.id);
                UI.toast(wortEins(page) + ' nach „' + String(zielSeite.text || 'Ohne Titel') + '" kopiert');
                return;
            }
            const stelle = stelleVon(block);
            if (!stelle) {
                UI.toast('Diese Seite hat keinen Platz, aus dem sie sich lösen liesse.');
                return;
            }
            Store.updateBlock(ziel.id, { content: [...(ziel.content || []), block.id] });
            Store.updateBlock(block.id, { parentId: ziel.id, parentTable: 'block' });
            Store.updateBlock(stelle.eltern.id, { content: (stelle.eltern.content || []).filter((id) => id !== block.id) });
            UI.toast(wortEins(page) + ' nach „' + String(zielSeite.text || 'Ohne Titel') + '" verschoben');
            const rest = documentsIn(page);
            neuMit(rest[Math.min(rest.length - 1, Math.max(0, stelle.index))]?.id || null);
        };
        const zerlegbar = (block) => {
            if (!block || block.type !== 'blatt')
                return 0;
            return SheetSpace.seiten(Number(block.blattHoehe) || SheetSpace.A4_HOEHE);
        };
        const seiteZerlegen = async (wen) => {
            const block = wen || jetzt();
            const anzahl = zerlegbar(block);
            if (anzahl < 2) {
                UI.toast(block?.type === 'blatt'
                    ? 'Dieses Blatt ist schon eine einzelne ' + wortEins(page) + '.'
                    : 'Nur ein mehrseitiges Blatt lässt sich in ' + wortViele(page) + ' zerlegen.');
                return;
            }
            const stelle = stelleVon(block);
            if (!stelle) {
                UI.toast('Dieses Blatt hat keinen Platz, an dem die Seiten stehen könnten.');
                return;
            }
            if (typeof Dialog === 'undefined')
                return;
            const A4 = SheetSpace.A4_HOEHE;
            const marken = Array.isArray(block.marken) ? block.marken : [];
            const faecher = Array.from({ length: anzahl }, () => []);
            let ueberGrenze = 0;
            for (const roh of marken) {
                const kopie = JSON.parse(JSON.stringify(roh));
                const kasten = InkGeometry.bounds(kopie);
                const mitte = kasten.y + kasten.height / 2;
                const nr = Math.max(0, Math.min(anzahl - 1, Math.floor(mitte / A4)));
                const oben = Math.floor(kasten.y / A4);
                const unten = Math.floor(Math.max(kasten.y, kasten.y + kasten.height - 0.01) / A4);
                if (oben !== unten)
                    ueberGrenze++;
                faecher[nr].push(InkGeometry.move(kopie, 0, -nr * A4));
            }
            const wahl = await Dialog.wahl({
                titel: 'Dieses Blatt in ' + anzahl + ' Seiten zerlegen?',
                text: 'Aus einem Blatt von ' + anzahl + ' Seiten werden ' + anzahl
                    + ' einzelne Blätter. Danach greifen Drehen, Löschen und Verschieben je Seite.'
                    + (ueberGrenze
                        ? ' ACHTUNG: ' + ueberGrenze + (ueberGrenze === 1 ? ' Marke läuft' : ' Marken laufen')
                            + ' über eine Seitengrenze. Sie kommen ganz auf EINE Seite und ragen dort über den Rand'
                            + ' hinaus — sichtbar ist der Überstand dann nicht mehr, verloren ist er nicht.'
                        : ' Keine Marke läuft über eine Seitengrenze.'),
                knoepfe: [
                    { id: 'ja', text: 'In ' + anzahl + ' Seiten zerlegen',
                        hinweis: ueberGrenze ? 'Mit dem Überstand, wie oben beschrieben' : 'Nichts geht dabei verloren' },
                    { id: 'nein', text: 'Abbrechen', hinweis: 'Das Blatt bleibt, wie es ist' }
                ]
            });
            if (wahl !== 'ja')
                return;
            for (let i = anzahl - 1; i >= 1; i--) {
                const neu = Store.addBlock(stelle.eltern.id, 'blatt', {
                    text: '', papier: block.papier || 'blanko',
                    blattBreite: Number(block.blattBreite) || SheetSpace.A4_BREITE,
                    blattHoehe: A4, raumVersion: SheetSpace.RAUM_VERSION,
                    marken: faecher[i]
                }, stelle.index + 1);
                Store.addBlock(neu.id, 'text', { text: '' });
            }
            Store.updateBlock(block.id, { blattHoehe: A4, marken: faecher[0] });
            UI.toast('In ' + anzahl + ' Seiten zerlegt'
                + (ueberGrenze ? ' — ' + ueberGrenze + ' mit Überstand' : ''));
            neuMit(block.id);
        };
        const seiteLoeschen = (wen) => {
            const block = wen || jetzt();
            const liste = documentsIn(page);
            if (liste.length < 2) {
                UI.toast('Die letzte Seite bleibt — lösche lieber das Dokument.');
                return;
            }
            const i = liste.findIndex(x => x.id === block.id);
            Store.trashBlock(block.id);
            UI.toast(wortEins(page) + ' im Papierkorb — von dort kommt sie zurück');
            const naechste = liste[Math.min(liste.length - 1, i + 1 < liste.length ? i + 1 : i - 1)];
            neuMit(naechste && naechste.id !== block.id ? naechste.id : null);
        };
        const seiteSchieben = (richtung, wen) => {
            const block = wen || jetzt();
            const stelle = stelleVon(block);
            if (!stelle)
                return;
            const inhalt = [...stelle.eltern.content];
            let ziel = stelle.index + richtung;
            while (ziel >= 0 && ziel < inhalt.length) {
                const kandidat = Store.getBlock(inhalt[ziel]);
                if (kandidat && kandidat.alive !== false && (kandidat.type === 'pdfseite' || kandidat.type === 'blatt'))
                    break;
                ziel += richtung;
            }
            if (ziel < 0 || ziel >= inhalt.length) {
                UI.toast(richtung < 0 ? 'Schon die erste Seite.' : 'Schon die letzte Seite.');
                return;
            }
            inhalt.splice(stelle.index, 1);
            inhalt.splice(ziel, 0, block.id);
            Store.updateBlock(stelle.eltern.id, { content: inhalt });
            neuMit(block.id);
        };
        const seiteAnStelle = (block, zielIndex) => {
            const liste = documentsIn(page);
            const von = liste.findIndex(b => b.id === block.id);
            if (von < 0 || zielIndex === von || zielIndex === von + 1)
                return false;
            const stelle = stelleVon(block);
            if (!stelle)
                return false;
            const nach = liste[zielIndex] || null;
            const nachbar = nach || liste[liste.length - 1] || block;
            const zielEltern = Store.getBlock(String(nachbar.parentId || '')) || stelle.eltern;
            if (zielEltern.id === stelle.eltern.id) {
                const inhalt = [...(stelle.eltern.content || [])];
                const raus = inhalt.indexOf(block.id);
                if (raus < 0)
                    return false;
                inhalt.splice(raus, 1);
                const ziel = nach ? inhalt.indexOf(nach.id) : -1;
                inhalt.splice(ziel < 0 ? inhalt.length : ziel, 0, block.id);
                Store.updateBlock(stelle.eltern.id, { content: inhalt });
            }
            else {
                const hin = [...(zielEltern.content || [])];
                const ziel = nach ? hin.indexOf(nach.id) : -1;
                hin.splice(ziel < 0 ? hin.length : ziel, 0, block.id);
                Store.updateBlock(zielEltern.id, { content: hin });
                Store.updateBlock(block.id, { parentId: zielEltern.id, parentTable: 'block' });
                Store.updateBlock(stelle.eltern.id, { content: (stelle.eltern.content || []).filter((id) => id !== block.id) });
            }
            UI.toast(wortEins(page) + ' verschoben');
            neuMit(block.id);
            return true;
        };
        let menueOffen = null;
        const menueSchliessen = () => {
            if (!menueOffen)
                return;
            const knopf = menueOffen.dataset.fuer
                ? thumbnails.querySelector('[data-document-thumb-menue="' + menueOffen.dataset.fuer + '"]')
                : null;
            knopf?.setAttribute('aria-expanded', 'false');
            menueOffen.remove();
            menueOffen = null;
        };
        const menueOeffnen = (knopf, index) => {
            const schonOffen = menueOffen?.dataset.fuer === String(index);
            menueSchliessen();
            if (schonOffen)
                return;
            const block = documents[index];
            if (!block)
                return;
            const kasten = document.createElement('div');
            kasten.className = 'document-thumb-menue';
            kasten.dataset.fuer = String(index);
            kasten.setAttribute('role', 'menu');
            kasten.setAttribute('aria-label', sourceLabel(block) + ': Menü');
            const eintrag = (tat, zeichen, text) => {
                const k = document.createElement('button');
                k.type = 'button';
                k.setAttribute('role', 'menuitem');
                k.dataset.documentAction = tat;
                k.dataset.documentZiel = String(index);
                k.innerHTML = '';
                const z = document.createElement('span');
                z.className = 'document-thumb-menue-zeichen';
                z.setAttribute('aria-hidden', 'true');
                z.textContent = zeichen;
                const t = document.createElement('span');
                t.textContent = text;
                k.append(z, t);
                kasten.appendChild(k);
            };
            eintrag('page-add', '＋', wortEins(page) + ' danach');
            eintrag('page-add-camera', '📷', 'Foto aufnehmen');
            eintrag('page-duplicate', '⧉', 'Duplizieren');
            eintrag('page-rotate', '⟳', 'Drehen');
            eintrag('page-up', '↑', 'Nach oben');
            eintrag('page-down', '↓', 'Nach unten');
            eintrag('page-bookmark', '🔖', block.lesezeichen ? 'Lesezeichen weg' : 'Lesezeichen');
            eintrag('page-export-image', '⬇', 'Als Bild sichern');
            eintrag('page-to-doc', '↗', 'In anderes Dokument');
            if (zerlegbar(block) > 1)
                eintrag('page-split', '⌸', 'In Seiten zerlegen');
            eintrag('page-delete', '🗑', 'Löschen');
            thumbnails.appendChild(kasten);
            const r = knopf.getBoundingClientRect(), s = thumbnails.getBoundingClientRect();
            const hoch = kasten.offsetHeight || 300, breit = kasten.offsetWidth || 200;
            let oben = r.top - s.top;
            if (oben + hoch > s.height - 8)
                oben = s.height - hoch - 8;
            let links = r.left - s.left;
            if (links + breit > s.width - 8)
                links = s.width - breit - 8;
            kasten.style.top = (Math.max(8, oben) + thumbnails.scrollTop) + 'px';
            kasten.style.left = (Math.max(6, links) + thumbnails.scrollLeft) + 'px';
            knopf.setAttribute('aria-expanded', 'true');
            menueOffen = kasten;
            kasten.querySelector('button')?.focus();
        };
        let zug = null;
        let marke = null;
        const markeWeg = () => { marke?.remove(); marke = null; };
        const zugEnde = () => {
            if (zug) {
                window.clearTimeout(zug.halten);
                zug.zeile.classList.remove('zieht');
            }
            zug = null;
            markeWeg();
            thumbnails.classList.remove('zieht-gerade');
        };
        const zielVon = (y) => {
            const zeilen = [...thumbnails.querySelectorAll('.document-thumb-zeile')];
            for (let i = 0; i < zeilen.length; i++) {
                const r = zeilen[i].getBoundingClientRect();
                if (y < r.top + r.height / 2)
                    return i;
            }
            return zeilen.length;
        };
        const markeLegen = (ziel) => {
            if (!marke) {
                marke = document.createElement('div');
                marke.className = 'document-thumb-marke';
                marke.setAttribute('aria-hidden', 'true');
                thumbnails.appendChild(marke);
            }
            const zeilen = [...thumbnails.querySelectorAll('.document-thumb-zeile')];
            const s = thumbnails.getBoundingClientRect();
            const vor = zeilen[ziel];
            const y = vor ? vor.getBoundingClientRect().top - s.top
                : (zeilen[zeilen.length - 1]?.getBoundingClientRect().bottom ?? s.top) - s.top;
            marke.style.top = (y + thumbnails.scrollTop) + 'px';
        };
        thumbnails.addEventListener('pointerdown', (event) => {
            const ziel = event.target;
            if (!ziel || ziel.closest('.document-thumb-menue, .document-thumb-menue-knopf'))
                return;
            const zeile = ziel.closest('.document-thumb-zeile');
            if (!zeile || !darfSeiten())
                return;
            const index = Number(zeile.dataset.documentThumbZeile);
            const block = documents[index];
            if (!block)
                return;
            zug = { id: block.id, index, x: event.clientX, y: event.clientY, zeile,
                bereit: event.pointerType === 'mouse', laeuft: false, halten: 0 };
            if (event.pointerType !== 'mouse') {
                zug.halten = window.setTimeout(() => {
                    if (!zug)
                        return;
                    zug.bereit = true;
                    zug.zeile.classList.add('bereit');
                    try {
                        navigator.vibrate?.(12);
                    }
                    catch { }
                }, 350);
            }
        });
        thumbnails.addEventListener('pointermove', (event) => {
            if (!zug)
                return;
            const weit = Math.hypot(event.clientX - zug.x, event.clientY - zug.y);
            if (!zug.bereit) {
                if (weit > 8)
                    zugEnde();
                return;
            }
            if (!zug.laeuft) {
                if (weit < 8)
                    return;
                zug.laeuft = true;
                zug.zeile.classList.add('zieht');
                thumbnails.classList.add('zieht-gerade');
                try {
                    thumbnails.setPointerCapture(event.pointerId);
                }
                catch { }
            }
            event.preventDefault();
            markeLegen(zielVon(event.clientY));
        });
        const zugLoslassen = (event) => {
            if (!zug)
                return;
            const lief = zug.laeuft;
            const block = Store.getBlock(zug.id);
            const ziel = zielVon(event.clientY);
            zugEnde();
            if (!lief || !block)
                return;
            menueSchliessen();
            seiteAnStelle(block, ziel);
        };
        thumbnails.addEventListener('pointerup', zugLoslassen);
        thumbnails.addEventListener('pointercancel', () => zugEnde());
        thumbnails.addEventListener('scroll', () => { menueSchliessen(); if (zug && !zug.laeuft)
            zugEnde(); });
        thumbnails.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape')
                return;
            if (zug) {
                zugEnde();
                event.stopPropagation();
                return;
            }
            if (menueOffen) {
                const fuer = menueOffen.dataset.fuer;
                menueSchliessen();
                thumbnails.querySelector('[data-document-thumb-menue="' + fuer + '"]')?.focus();
                event.stopPropagation();
            }
        });
        workspace.addEventListener('pointerdown', (event) => {
            if (!menueOffen)
                return;
            const z = event.target;
            if (z && z.closest('.document-thumb-menue, .document-thumb-menue-knopf'))
                return;
            menueSchliessen();
        }, true);
        const seiteDrehen = (wen) => {
            const block = wen || jetzt();
            const g = (SheetSpace.gedrehtVon(block) + 90) % 360;
            Store.updateBlock(block.id, { gedreht: g || 0 });
            UI.toast(g ? wortEins(page) + ' um ' + g + '° gedreht' : wortEins(page) + ' wieder aufrecht');
            neuMit(block.id);
        };
        const lesezeichenWechseln = (wen) => {
            const block = wen || jetzt();
            const an = !block.lesezeichen;
            Store.updateBlock(block.id, { lesezeichen: an });
            UI.toast(an ? '🔖 Lesezeichen gesetzt' : 'Lesezeichen entfernt');
            neuMit(block.id);
        };
        const toolsSetzen = (an) => {
            state.toolsOpen = an;
            Store.setMeta('dokWerkzeuge:' + page.id, an);
            workspace.dataset.documentTools = an ? 'open' : 'closed';
            if (!an && galerie) {
                galerie.schliesse();
                delete workspace.dataset.pdfZubehoer;
                workspace.dataset.inkOptions = 'closed';
                moreTools.setAttribute('aria-expanded', 'false');
            }
            readButton.setAttribute('aria-pressed', String(!an));
            annotateButton.setAttribute('aria-pressed', String(an));
            center.querySelectorAll('.blatt-papier').forEach(paper => {
                stillSetzen(paper, !an);
            });
            staende.forEach(stand => {
                if (!an)
                    stand.querySelector('.blatt-werk [data-wz="schreiben"]')?.click();
                else
                    applyPen(stand);
            });
            passen();
            inkSync();
        };
        const panelsSetzen = () => {
            body.classList.toggle('with-thumbnails', state.thumbnailsOpen);
            body.classList.toggle('with-inspector', state.inspectorOpen);
            thumbnails.classList.toggle('is-open', state.thumbnailsOpen);
            inspector.classList.toggle('is-open', state.inspectorOpen);
            thumbnailButton.setAttribute('aria-expanded', String(state.thumbnailsOpen));
            inspectorButton.setAttribute('aria-expanded', String(state.inspectorOpen));
            if (state.inspectorOpen)
                renderInspector(inspector, page, jetzt());
            if (state.thumbnailsOpen)
                activateVisibleThumbnails(thumbnails);
            passen();
        };
        workspace.addEventListener('paste', (event) => {
            const ziel = event.target;
            if (ziel && (ziel.closest('input, textarea, [contenteditable="true"]')))
                return;
            const dateien = Array.from(event.clipboardData?.files || []).filter(d => /^image\//i.test(d.type));
            if (!dateien.length)
                return;
            event.preventDefault();
            if (!darfSeiten()) {
                UI.toast('Zum Einfügen brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.');
                return;
            }
            const stelle = stelleVon(jetzt());
            void PdfEinlesen.bilderAlsSeiten(dateien, page.id, stelle ? { elternId: stelle.eltern.id, index: stelle.index + 1 } : undefined)
                .then((ids) => { if (ids.length)
                neuMit(ids[ids.length - 1] ?? null); });
        });
        workspace.addEventListener('keydown', event => {
            if (zeigenFlaeche) {
                if (event.key === 'Escape') {
                    zeigenAus();
                    event.stopPropagation();
                    return;
                }
                if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Spacebar'].includes(event.key)) {
                    event.preventDefault();
                    springe(state.index + 1, false);
                    return;
                }
                if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
                    event.preventDefault();
                    springe(state.index - 1, false);
                    return;
                }
                if (event.key === 'Home') {
                    event.preventDefault();
                    springe(0, false);
                    return;
                }
                if (event.key === 'End') {
                    event.preventDefault();
                    springe(documents.length - 1, false);
                    return;
                }
            }
            if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                event.stopPropagation();
                findbarSetzen(true);
                return;
            }
            if (event.key === 'Escape' && !findbar.hidden) {
                findbarSetzen(false);
                findButton.focus();
                event.stopPropagation();
                return;
            }
            if (event.key === 'Escape' && state.lupe) {
                lupeSetzen(false);
                event.stopPropagation();
                return;
            }
            if (event.key === 'Escape' && workspace.dataset.inkOptions === 'open') {
                workspace.dataset.inkOptions = 'closed';
                moreTools.setAttribute('aria-expanded', 'false');
                (drawingbar.querySelector('[data-a="pdf-werkzeuge"]') ?? moreTools).focus();
                event.stopPropagation();
                return;
            }
            if (event.key === 'Escape' && workspace.dataset.pdfZubehoer === 'an') {
                delete workspace.dataset.pdfZubehoer;
                event.stopPropagation();
                return;
            }
            if (event.key === 'Escape' && workspace.dataset.documentView === 'open') {
                workspace.dataset.documentView = 'closed';
                viewButton.setAttribute('aria-expanded', 'false');
                viewButton.focus();
                event.stopPropagation();
                return;
            }
            if (event.key === 'Escape' && (state.thumbnailsOpen || state.inspectorOpen)) {
                const returnTo = state.inspectorOpen ? inspectorButton : thumbnailButton;
                state.thumbnailsOpen = false;
                state.inspectorOpen = false;
                panelsSetzen();
                returnTo.focus();
                event.stopPropagation();
            }
            if (event.target === center && (event.key === 'PageDown' || event.key === 'PageUp')) {
                event.preventDefault();
                springe(state.index + (event.key === 'PageDown' ? 1 : -1));
            }
        });
        const inkWerkzeugWaehlen = (tool, anchor) => {
            if (!canAnnotate)
                return;
            if (galerie) {
                const zubehoer = !['schreiben', 'bild', 'elemente', 'laser'].includes(tool);
                const erneut = workspace.dataset.inkTool === tool && workspace.dataset.pdfZubehoer === 'an';
                if (zubehoer && !erneut)
                    workspace.dataset.pdfZubehoer = 'an';
                else
                    delete workspace.dataset.pdfZubehoer;
            }
            if (tool !== 'bild') {
                penTool = tool;
                Store.setMeta('dokStift:' + page.id, tool);
            }
            toolsSetzen(true);
            inkToolbar()?.querySelector('[data-wz="' + tool + '"]')?.click();
            if (tool === 'laser' || tool === 'elemente')
                inkToolbar()?.dispatchEvent(new CustomEvent('ink-panel', {
                    detail: { kind: tool, anchor }
                }));
            inkSync();
        };
        if (galerie)
            workspace.addEventListener('pointerdown', event => {
                if (event.target instanceof Element &&
                    !event.target.closest('.document-pdf-dock, .blatt-reihe'))
                    delete workspace.dataset.pdfZubehoer;
            });
        workspace.addEventListener('click', event => {
            const element = event.target instanceof Element ? event.target : null;
            const inkButton = element?.closest('.blatt-werk button');
            if (inkButton?.dataset.c) {
                penColor = inkButton.dataset.c;
                Store.setMeta('dokTinte:' + page.id, penColor);
            }
            if (inkButton?.dataset.b) {
                penWidth = Number(inkButton.dataset.b);
                Store.setMeta('dokStrich:' + page.id, penWidth);
            }
            if (inkButton?.dataset.wz && inkButton.dataset.wz !== 'bild') {
                penTool = inkButton.dataset.wz;
                Store.setMeta('dokStift:' + page.id, penTool);
            }
            const werkzeugknopf = element?.closest('[data-document-tool]');
            const tool = werkzeugknopf?.dataset.documentTool;
            if (tool) {
                inkWerkzeugWaehlen(tool, werkzeugknopf);
                return;
            }
            if (!element?.closest('.document-commandbar,[data-document-action="view"],.blatt-werk')) {
                workspace.dataset.documentView = 'closed';
                viewButton.setAttribute('aria-expanded', 'false');
            }
            const thumb = element?.closest('[data-document-index]');
            if (thumb?.dataset.documentIndex) {
                const nr = Number(thumb.dataset.documentIndex) || 0;
                springe(nr);
                const anteil = Number(thumb.dataset.documentStelle);
                if (Number.isFinite(anteil) && anteil > 0.02)
                    requestAnimationFrame(() => {
                        const stand = staende[nr];
                        if (!stand)
                            return;
                        center.scrollTop = stand.offsetTop + stand.offsetHeight * anteil - 24;
                    });
                return;
            }
            const original = element?.closest('[data-document-original]');
            if (original?.dataset.documentOriginal) {
                const id = original.dataset.documentOriginal;
                Dateien.adresse(id).then((url) => {
                    if (!url) {
                        UI.toast('Die Originaldatei ist nicht mehr in der Ablage.');
                        return;
                    }
                    window.open(url, '_blank', 'noopener');
                }).catch(() => UI.toast('Die Originaldatei liess sich nicht öffnen.'));
                return;
            }
            const open = element?.closest('[data-document-open]');
            if (open?.dataset.documentOpen) {
                const target = Store.getBlock(open.dataset.documentOpen);
                const sourcePage = target ? Links.seiteVon(target.id) : null;
                if (sourcePage) {
                    toggle(page, false);
                    App.oeffne(sourcePage.id);
                }
                return;
            }
            const fund = element?.closest('[data-document-fund]');
            if (fund?.dataset.documentFund) {
                zumFremden(fund.dataset.documentFund, String(fund.dataset.documentFundBlock || ''));
                return;
            }
            const menueKnopf = element?.closest('[data-document-thumb-menue]');
            if (menueKnopf) {
                if (!darfSeiten()) {
                    UI.toast('Zum Ändern der Seiten brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.');
                    return;
                }
                menueOeffnen(menueKnopf, Number(menueKnopf.dataset.documentThumbMenue));
                return;
            }
            const tatKnopf = element?.closest('[data-document-action]');
            const action = tatKnopf?.dataset.documentAction;
            const zielNr = Number(tatKnopf?.dataset.documentZiel ?? NaN);
            const zielSeite = Number.isInteger(zielNr) ? documents[zielNr] : undefined;
            if (zielSeite)
                menueSchliessen();
            if (!action)
                return;
            if (action === 'page-jump') {
                if (documents.length < 2 || position.disabled)
                    return;
                position.disabled = true;
                void (async () => {
                    try {
                        const antwort = await UI.frage('Zu welcher ' + wortEins(page) + ' springen? (1–' + documents.length + ')', String(state.index + 1));
                        if (antwort === null || !workspace.isConnected)
                            return;
                        const eingabe = String(antwort).trim();
                        const nummer = Number(eingabe);
                        if (!/^[0-9]+$/.test(eingabe) || !Number.isSafeInteger(nummer) ||
                            nummer < 1 || nummer > documents.length) {
                            UI.toast('Bitte eine ' + wortEins(page) + ' zwischen 1 und ' +
                                documents.length + ' eingeben.');
                            return;
                        }
                        springe(nummer - 1);
                    }
                    catch (err) {
                        UI.toast('Die Seite konnte nicht aufgerufen werden: ' +
                            (err instanceof Error ? err.message : String(err)));
                    }
                    finally {
                        position.disabled = false;
                    }
                })();
                return;
            }
            if (action === 'ink-ruler' && canAnnotate) {
                toolsSetzen(true);
                inkToolbar()?.querySelector('[data-act="lineal"]')?.click();
                inkSync();
                return;
            }
            if (action === 'folienmenue') {
                folienMenue(tatKnopf);
                return;
            }
            if (action === 'ink-options') {
                const open = workspace.dataset.inkOptions !== 'open';
                workspace.dataset.inkOptions = open ? 'open' : 'closed';
                moreTools.setAttribute('aria-expanded', String(open));
                if (canAnnotate)
                    toolsSetzen(true);
            }
            if ((action === 'ink-undo' || action === 'ink-redo') && canAnnotate) {
                inkToolbar()?.querySelector('[data-act="' + action.slice(4) + '"]')?.click();
                inkSync();
            }
            if (action === 'formelheft') {
                try {
                    Formelheft.umschalten();
                }
                catch { }
            }
            if (action === 'print') {
                const print = Register.menueband.eines('a-drucken');
                if (print?.tun)
                    print.tun();
                else
                    UI.toast('Drucken ist gerade nicht verfügbar.');
            }
            if (action === 'view') {
                const offen = workspace.dataset.documentView !== 'open';
                workspace.dataset.documentView = offen ? 'open' : 'closed';
                viewButton.setAttribute('aria-expanded', String(offen));
            }
            if (action === 'previous')
                springe(state.index - 1);
            if (action === 'next')
                springe(state.index + 1);
            if (action === 'find') {
                findbarSetzen(findbar.hidden);
                return;
            }
            if (action === 'lupe') {
                lupeSetzen(!state.lupe);
                return;
            }
            if (action === 'lupe-zu') {
                lupeSetzen(false);
                return;
            }
            if (action === 'lupe-hoch') {
                lupeRuecken(0, -1);
                return;
            }
            if (action === 'lupe-runter') {
                lupeRuecken(0, 1);
                return;
            }
            if (action === 'lupe-links') {
                lupeRuecken(-1, 0);
                return;
            }
            if (action === 'lupe-rechts') {
                lupeRuecken(1, 0);
                return;
            }
            if (action === 'lupe-weiter') {
                lupeWeiter();
                return;
            }
            if (action === 'page-export-image') {
                const block = zielSeite || jetzt();
                void seiteAlsBild(block).then(async (blob) => {
                    if (!blob) {
                        UI.toast('Die Seite liess sich nicht als Bild zeichnen.');
                        return;
                    }
                    const nr = documentsIn(page).findIndex(b => b.id === block.id) + 1;
                    const gespeichert = await herunterladen(blob, String(page.text || 'Seite').replace(/[\\/:*?"<>|]+/g, ' ').trim() + ' – Seite ' + nr + '.png');
                    if (gespeichert)
                        UI.toast(wortEins(page) + ' ' + nr + ' als PNG gesichert');
                }).catch(() => UI.toast('Die Seite liess sich nicht als Bild sichern.'));
                return;
            }
            if (action === 'praesentieren') {
                if (istFoliensatz(page) && typeof Werkzeuge !== 'undefined'
                    && typeof Werkzeuge.praesentation === 'function') {
                    try {
                        void Werkzeuge.praesentation(page);
                        return;
                    }
                    catch { }
                }
                void zeigenAn();
                return;
            }
            if (action === 'praesentieren-aus') {
                zeigenAus();
                return;
            }
            if (action === 'mark-entsperren') {
                if (!darfSeiten()) {
                    UI.toast('Zum Ändern brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.');
                    return;
                }
                const block = zielSeite || jetzt();
                const welche = String(tatKnopf?.dataset.documentMarke ?? '');
                const marken = Array.isArray(block?.marken) ? block.marken : [];
                let offen = 0;
                const neu = marken.map((mark) => {
                    if (!mark?.gesperrt)
                        return mark;
                    if (welche !== '*' && String(mark.id ?? '') !== welche)
                        return mark;
                    offen++;
                    const kopie = { ...mark };
                    delete kopie.gesperrt;
                    return kopie;
                });
                if (!offen) {
                    UI.toast('Diese Marke gibt es nicht mehr.');
                    return;
                }
                Store.updateBlock(block.id, { marken: neu });
                UI.toast(offen === 1 ? 'Entsperrt' : offen + ' Marken entsperrt');
                neuMit(block.id);
                return;
            }
            if (action === 'pdf-original-kopie' || action === 'pdf-original-kombinieren') {
                const knopf = tatKnopf;
                const quelle = knopf.dataset.pdfQuelle;
                if (!quelle || knopf.disabled)
                    return;
                const sichern = async (auswahl, drehung, weitere) => {
                    const datei = await dateiBlob(quelle);
                    if (!datei)
                        throw new Error('Die Originaldatei fehlt auf diesem Gerät.');
                    const blob = await PdfOriginal.zusammenstellen([{ datei, auswahl }, ...weitere.map(datei => ({ datei, auswahl: '*' }))], drehung);
                    const name = String(page.text || 'Dokument').replace(/[\\/:*?"<>|]+/g, ' ').trim();
                    if (await herunterladen(blob, (name || 'Dokument') + ' – Originalseiten.pdf'))
                        UI.toast('PDF-Kopie gesichert');
                };
                const ausfuehren = (auftrag) => {
                    knopf.disabled = true;
                    void auftrag().catch(error => UI.toast(error instanceof Error ? error.message : 'Die PDF-Kopie ist fehlgeschlagen.'))
                        .finally(() => { knopf.disabled = false; });
                };
                if (action === 'pdf-original-kopie') {
                    ausfuehren(async () => {
                        const auswahl = await Dialog.frage('Originalseiten wählen. * für alle oder z. B. 1–3, 7, 5–4.', '*');
                        if (auswahl === null || !workspace.isConnected)
                            return;
                        const drehung = await Dialog.wahl({
                            titel: 'Originalseiten kopieren',
                            text: 'Die PDF-Kopie behält den Originaltext. Redion-Markierungen sind im separaten PDF-Export enthalten.',
                            knoepfe: [{ id: '0', text: 'Kopie speichern' }, { id: '90', text: '90° nach rechts drehen' },
                                { id: '180', text: '180° drehen' }, { id: '270', text: '90° nach links drehen' }]
                        });
                        if (drehung && workspace.isConnected)
                            await sichern(auswahl, Number(drehung), []);
                    });
                }
                else {
                    const auswahl = document.createElement('input');
                    auswahl.type = 'file';
                    auswahl.accept = '.pdf,application/pdf';
                    auswahl.multiple = true;
                    auswahl.addEventListener('change', () => {
                        const weitere = Array.from(auswahl.files ?? []);
                        if (weitere.length && workspace.isConnected)
                            ausfuehren(async () => {
                                const bestaetigt = await Dialog.bestaetigen({
                                    titel: 'PDF-Dateien zusammenführen',
                                    text: 'Reihenfolge: das Original, danach ' + weitere.map(datei => datei.name).join(', ') + '.',
                                    ja: 'PDF speichern'
                                });
                                if (bestaetigt && workspace.isConnected)
                                    await sichern('*', 0, weitere);
                            });
                    }, { once: true });
                    auswahl.click();
                }
                return;
            }
            if (action === 'export-pdf') {
                const knopf = tatKnopf;
                if (knopf?.disabled)
                    return;
                const seiten = documentsIn(page);
                if (!seiten.length) {
                    UI.toast('Dieses Dokument hat keine Seiten.');
                    return;
                }
                const wort = knopf?.textContent || '';
                if (knopf)
                    knopf.disabled = true;
                void alsPdf(seiten, (fertig, gesamt) => {
                    if (knopf)
                        knopf.textContent = fertig >= gesamt
                            ? '⤓ Wird gesichert …' : '⤓ Seite ' + (fertig + 1) + '/' + gesamt + ' …';
                }).then(async (blob) => {
                    if (!blob) {
                        UI.toast('Das Dokument liess sich nicht als PDF schreiben.');
                        return;
                    }
                    const gespeichert = await herunterladen(blob, String(page.text || 'Dokument').replace(/[\\/:*?"<>|]+/g, ' ').trim() + '.pdf');
                    if (gespeichert)
                        UI.toast(seiten.length +
                            (seiten.length === 1 ? ' Seite' : ' Seiten') + ' als PDF gesichert');
                }).catch(() => {
                    UI.toast('Das Dokument liess sich nicht als PDF schreiben.');
                }).finally(() => {
                    if (knopf) {
                        knopf.disabled = false;
                        knopf.textContent = wort;
                    }
                });
                return;
            }
            if (action === 'find-next') {
                zumTreffer(trefferNr + 1);
                return;
            }
            if (action === 'find-previous') {
                zumTreffer(trefferNr - 1);
                return;
            }
            if (action === 'find-close') {
                findbarSetzen(false);
                findButton.focus();
                return;
            }
            if (action?.startsWith('page-')) {
                if (!darfSeiten()) {
                    UI.toast('Zum Ändern der Seiten brauchst du Bearbeitungsrechte und ein entsperrtes Dokument.');
                    return;
                }
                if (action === 'page-bookmark')
                    lesezeichenWechseln(zielSeite);
                if (action === 'page-add')
                    seiteEinfuegen(zielSeite);
                if (action === 'page-add-image' || action === 'page-add-pdf' || action === 'page-add-camera') {
                    const stelle = stelleVon(zielSeite || jetzt());
                    const anStelle = stelle ? { elternId: stelle.eltern.id, index: stelle.index + 1 } : undefined;
                    if (action === 'page-add-image' || action === 'page-add-camera') {
                        const holen = action === 'page-add-camera' ? PdfEinlesen.kameraWaehlen : PdfEinlesen.bilderWaehlen;
                        void holen(page.id, anStelle).then((ids) => { if (ids.length)
                            neuMit(ids[ids.length - 1] ?? null); });
                    }
                    else {
                        void PdfEinlesen.waehlen(page.id, anStelle ? { anStelle } : undefined).then((result) => { if (result)
                            rerender(); });
                    }
                }
                if (action === 'page-duplicate')
                    seiteDuplizieren(zielSeite);
                if (action === 'page-to-doc')
                    void seiteInsDokument(zielSeite);
                if (action === 'page-split')
                    void seiteZerlegen(zielSeite);
                if (action === 'page-delete')
                    seiteLoeschen(zielSeite);
                if (action === 'page-up')
                    seiteSchieben(-1, zielSeite);
                if (action === 'page-down')
                    seiteSchieben(1, zielSeite);
                if (action === 'page-rotate')
                    seiteDrehen(zielSeite);
                return;
            }
            if (action === 'thumbnails') {
                state.thumbnailsOpen = !state.thumbnailsOpen;
                panelsSetzen();
            }
            if (action === 'thumbnails-close') {
                state.thumbnailsOpen = false;
                panelsSetzen();
                thumbnailButton.focus();
            }
            if (action === 'inspector') {
                state.inspectorOpen = !state.inspectorOpen;
                panelsSetzen();
            }
            if (action === 'inspector-close') {
                state.inspectorOpen = false;
                panelsSetzen();
                inspectorButton.focus();
            }
            if (action === 'read')
                toolsSetzen(false);
            if (action === 'annotate' && !page.gesperrt &&
                (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id))) {
                toolsSetzen(true);
                folienband?.reiterWaehlen?.('zeichnen');
            }
            if (action === 'fit') {
                zoomSetzen(100);
                center.scrollLeft = 0;
            }
            if (action === 'import' && !page.gesperrt &&
                (typeof Konten === 'undefined' || Konten.darf('bearbeiten', page.id))) {
                void PdfEinlesen.waehlen(page.id).then(result => { if (result)
                    rerender(); });
            }
            if (action === 'lauf') {
                state.einzeln = !state.einzeln;
                laufMerken(page.id, state.einzeln);
                UI.toast(state.einzeln
                    ? 'Einzelseite — nur die Seite, auf der du bist'
                    : 'Fortlaufend — alle Seiten untereinander');
                rerender();
                return;
            }
            if (action === 'rand') {
                const an = Number(page.randBreite) > 0;
                Store.updateBlock(page.id, { randBreite: an ? 0 : 0.45 });
                page.randBreite = an ? 0 : 0.45;
                UI.toast(an ? 'Randstreifen aus' : 'Randstreifen an — schreib daneben');
                App.zeichneSeite();
                return;
            }
            if (action === 'regal') {
                const eintrag = typeof Register !== 'undefined' && Register.navigation
                    ? Register.navigation.eines('bibliothekOben') : null;
                if (eintrag && typeof eintrag.tun === 'function')
                    eintrag.tun();
                else
                    UI.toast('Das Regal ist gerade nicht erreichbar.');
                return;
            }
            if (action === 'exit') {
                seiteneditorOeffnen(page, tatKnopf, String(documents[state.index]?.id || ''), state.index);
                return;
            }
            if (action === 'source-actions')
                openSourceActions(page, jetzt());
            if ((action === 'select-region' || action === 'recognize') && state.lupe) {
                UI.toast('Schliess zuerst das Zoom-Fenster — der Ausschnitt gilt der ganzen Seite.');
                return;
            }
            if (action === 'select-region' || action === 'recognize') {
                const stand = staende[state.index];
                const paper = stand?.querySelector('.blatt-papier');
                if (!paper) {
                    UI.toast('Diese Seite ist gerade nicht gezeichnet.');
                    return;
                }
                selectRegion(paper, jetzt(), region => {
                    if (action === 'recognize') {
                        const recognition = window.Recognition;
                        if (recognition?.fromSource)
                            recognition.fromSource(page, jetzt(), region);
                        else
                            UI.toast('Die Erkennung ist noch nicht geladen.');
                    }
                    else
                        openSourceActions(page, jetzt(), region);
                });
            }
        });
        zoom.addEventListener('input', () => {
            state.zoom = Number(zoom.value) || 100;
            zoomMerken(page.id, state.zoom);
            passen();
            zoomLabel.textContent = state.zoom + ' %';
        });
        const zoomSetzen = (wert, anker) => {
            const neu = Math.max(60, Math.min(state.lupe ? 300 : 180, Math.round(wert)));
            if (neu === state.zoom)
                return;
            let papier = null;
            let vorher = null;
            let fx = 0.5, fy = 0.5, ax = 0, ay = 0;
            if (anker && !state.lupe) {
                const box = center.getBoundingClientRect();
                ax = Math.max(box.left, Math.min(box.right, anker.clientX));
                ay = Math.max(box.top, Math.min(box.bottom, anker.clientY));
                const getroffen = document.elementFromPoint(ax, ay)?.closest('.blatt-papier') ?? null;
                papier = getroffen && center.contains(getroffen) ? getroffen
                    : staende[state.index]?.querySelector('.blatt-papier') ?? null;
                vorher = papier?.getBoundingClientRect() ?? null;
                if (getroffen && vorher && vorher.width && vorher.height) {
                    fx = Math.max(0, Math.min(1, (ax - vorher.left) / vorher.width));
                    fy = Math.max(0, Math.min(1, (ay - vorher.top) / vorher.height));
                }
                else if (vorher) {
                    ax = vorher.left + vorher.width / 2;
                    ay = vorher.top + vorher.height / 2;
                }
            }
            state.zoom = neu;
            if (!state.lupe)
                zoomMerken(page.id, neu);
            zoom.value = String(neu);
            zoomLabel.textContent = neu + ' %';
            passen();
            if (papier?.isConnected && vorher) {
                const nachher = papier.getBoundingClientRect();
                center.scrollLeft += (nachher.left + fx * nachher.width) - ax;
                center.scrollTop += (nachher.top + fy * nachher.height) - ay;
            }
        };
        const LUPE_FAKTOR = 2.6;
        let lupe = null;
        let lupeFenster = null;
        let lupeKnoten = null;
        let lupeHeimat = null;
        let lupeAbbild = null;
        let lupeRahmen = null;
        let lupeBeobachter = null;
        let lupeFrischWartet = false;
        let lupeX = 0, lupeY = 0;
        const lupePapierVon = (stand) => stand?.querySelector('.blatt-huelle > :not(.blatt-reihe):not(.blatt-abbild)') || null;
        const lupeAbbildFrisch = () => {
            if (lupeFrischWartet || !lupeAbbild || !lupeKnoten)
                return;
            lupeFrischWartet = true;
            requestAnimationFrame(() => {
                lupeFrischWartet = false;
                if (!lupeAbbild || !lupeKnoten)
                    return;
                const klon = lupeKnoten.cloneNode(true);
                klon.style.removeProperty('transform');
                klon.style.width = '100%';
                klon.classList.add('ist-abbild');
                klon.setAttribute('aria-hidden', 'true');
                lupeAbbild.replaceChildren(klon);
                if (lupeRahmen)
                    lupeAbbild.appendChild(lupeRahmen);
            });
        };
        const lupeLegen = () => {
            if (!lupeFenster || !lupeKnoten)
                return;
            const breit = Math.max(120, lupeFenster.clientWidth * LUPE_FAKTOR);
            lupeKnoten.style.width = breit + 'px';
            const hoch = lupeKnoten.getBoundingClientRect().height || breit * 1.414;
            const maxX = Math.max(0, breit - lupeFenster.clientWidth);
            const maxY = Math.max(0, hoch - lupeFenster.clientHeight);
            const tx = Math.min(maxX, Math.max(0, lupeX * breit));
            const ty = Math.min(maxY, Math.max(0, lupeY * hoch));
            lupeX = breit > 0 ? tx / breit : 0;
            lupeY = hoch > 0 ? ty / hoch : 0;
            lupeKnoten.style.transform = 'translate(' + (-tx) + 'px, ' + (-ty) + 'px)';
            if (lupeRahmen && hoch > 0) {
                lupeRahmen.style.left = (tx / breit * 100) + '%';
                lupeRahmen.style.top = (ty / hoch * 100) + '%';
                lupeRahmen.style.width = Math.min(100, lupeFenster.clientWidth / breit * 100) + '%';
                lupeRahmen.style.height = Math.min(100, lupeFenster.clientHeight / hoch * 100) + '%';
            }
        };
        const lupeZielen = (fx, fy) => {
            if (!lupeFenster || !lupeKnoten)
                return;
            const breit = Math.max(120, lupeFenster.clientWidth * LUPE_FAKTOR);
            const hoch = lupeKnoten.getBoundingClientRect().height || breit * 1.414;
            lupeX = fx - (lupeFenster.clientWidth / breit) / 2;
            lupeY = fy - (lupeFenster.clientHeight / hoch) / 2;
            lupeLegen();
        };
        const lupeRuecken = (dx, dy) => {
            if (!lupeFenster || !lupeKnoten)
                return;
            const breit = Math.max(120, lupeFenster.clientWidth * LUPE_FAKTOR);
            const hoch = lupeKnoten.getBoundingClientRect().height || breit * 1.414;
            lupeX += dx * (lupeFenster.clientWidth / breit) * 0.5;
            lupeY += dy * (lupeFenster.clientHeight / hoch) * 0.85;
            lupeLegen();
        };
        const lupeWeiter = () => {
            if (!lupeFenster || !lupeKnoten)
                return;
            const breit = Math.max(120, lupeFenster.clientWidth * LUPE_FAKTOR);
            const hoch = lupeKnoten.getBoundingClientRect().height || breit * 1.414;
            const sichtbarX = lupeFenster.clientWidth / breit;
            if (lupeX + sichtbarX * 1.5 < 1) {
                lupeX += sichtbarX * 0.9;
                lupeLegen();
                return;
            }
            lupeX = 0;
            lupeY += (lupeFenster.clientHeight / hoch) * 0.85;
            lupeLegen();
        };
        const lupeUmziehen = (hinein) => {
            if (hinein) {
                const stand = staende[state.index];
                const knoten = lupePapierVon(stand);
                const huelle = knoten?.parentElement;
                if (!knoten || !huelle || !lupeFenster)
                    return;
                lupeKnoten = knoten;
                lupeHeimat = huelle;
                lupeAbbild = document.createElement('div');
                lupeAbbild.className = 'blatt-abbild';
                lupeAbbild.setAttribute('aria-hidden', 'true');
                lupeAbbild.inert = true;
                lupeRahmen = document.createElement('div');
                lupeRahmen.className = 'document-lupe-rahmen';
                huelle.insertBefore(lupeAbbild, knoten);
                lupeFenster.appendChild(knoten);
                lupeAbbildFrisch();
                const flaeche = knoten.querySelector('svg.blatt-marken');
                if (flaeche) {
                    lupeBeobachter = new MutationObserver(() => lupeAbbildFrisch());
                    lupeBeobachter.observe(flaeche, { childList: true, subtree: true, attributes: true });
                }
                knoten.addEventListener('pointerup', lupeRandWeiter);
                requestAnimationFrame(lupeLegen);
            }
            else {
                lupeKnoten?.removeEventListener('pointerup', lupeRandWeiter);
                lupeBeobachter?.disconnect();
                lupeBeobachter = null;
                if (lupeKnoten && lupeHeimat) {
                    lupeKnoten.style.removeProperty('width');
                    lupeKnoten.style.removeProperty('transform');
                    if (lupeAbbild && lupeAbbild.parentElement === lupeHeimat)
                        lupeHeimat.insertBefore(lupeKnoten, lupeAbbild);
                    else
                        lupeHeimat.appendChild(lupeKnoten);
                }
                lupeAbbild?.remove();
                lupeKnoten = null;
                lupeHeimat = null;
                lupeAbbild = null;
                lupeRahmen = null;
            }
        };
        const ausschnittRuhen = (an) => {
            for (const was of ['select-region', 'recognize']) {
                const knopf = workspace.querySelector('.document-inspector-actions [data-document-action="' + was + '"]');
                if (!knopf)
                    continue;
                knopf.disabled = an;
                knopf.setAttribute('aria-disabled', an ? 'true' : 'false');
                knopf.title = an
                    ? 'Ruht, solange das Zoom-Fenster offen ist — der Ausschnitt gilt der ganzen Seite.'
                    : (was === 'select-region'
                        ? 'Einen Ausschnitt der Seite aufziehen'
                        : 'Den Text im Ausschnitt erkennen lassen');
            }
        };
        const lupeSetzen = (an) => {
            if (an === !!state.lupe)
                return;
            if (an) {
                if (!canAnnotate) {
                    UI.toast('Zum Schreiben im Zoom-Fenster brauchst du Bearbeitungsrechte.');
                    return;
                }
                state.lupe = true;
                workspace.dataset.lupe = 'an';
                ausschnittRuhen(true);
                state.zoomVorher = state.zoom;
                zoomSetzen(100);
                lupe = document.createElement('div');
                lupe.className = 'document-lupe';
                lupe.setAttribute('role', 'group');
                lupe.setAttribute('aria-label', 'Zoom-Fenster: hier gross schreiben');
                lupeFenster = document.createElement('div');
                lupeFenster.className = 'document-lupe-fenster';
                const griffe = document.createElement('div');
                griffe.className = 'document-lupe-griffe';
                griffe.append(topButton('lupe-links', '◀', 'Ausschnitt nach links'), topButton('lupe-hoch', '▲', 'Ausschnitt nach oben'), topButton('lupe-runter', '▼', 'Ausschnitt nach unten'), topButton('lupe-rechts', '▶', 'Ausschnitt nach rechts'), topButton('lupe-weiter', '⏎', 'Weiter — ein Streifen weiter, wie eine neue Zeile'), topButton('lupe-zu', '✕', 'Zoom-Fenster schließen'));
                lupe.append(lupeFenster, griffe);
                workspace.appendChild(lupe);
                lupeX = 0;
                lupeY = 0;
                lupeUmziehen(true);
                center.addEventListener('pointerdown', lupeTipp, true);
                requestAnimationFrame(() => { lupeLegen(); passen(); });
            }
            else {
                state.lupe = false;
                workspace.dataset.lupe = 'aus';
                ausschnittRuhen(false);
                center.removeEventListener('pointerdown', lupeTipp, true);
                lupeUmziehen(false);
                lupe?.remove();
                lupe = null;
                lupeFenster = null;
                zoomSetzen(state.zoomVorher || 100);
            }
            inspector.querySelectorAll('.document-lupe-knopf').forEach(k => {
                k.classList.toggle('an', an);
                k.setAttribute('aria-pressed', an ? 'true' : 'false');
                k.textContent = an ? '🔍 Zoom-Fenster aus' : '🔍 Zoom-Fenster an';
            });
        };
        function lupeRandWeiter(event) {
            if (!state.lupe || !lupeFenster)
                return;
            const werk = lupeKnoten?.querySelector('svg.blatt-marken')?.dataset.tool || '';
            if (!['stift', 'marker', 'line', 'arrow'].includes(werk))
                return;
            const r = lupeFenster.getBoundingClientRect();
            if (event.clientX < r.right - r.width / 8)
                return;
            lupeWeiter();
        }
        function lupeTipp(event) {
            if (!state.lupe || !lupeAbbild)
                return;
            const ziel = event.target;
            if (!ziel || !lupeAbbild.contains(ziel))
                return;
            const r = lupeAbbild.getBoundingClientRect();
            if (r.width < 1 || r.height < 1)
                return;
            lupeZielen((event.clientX - r.left) / r.width, (event.clientY - r.top) / r.height);
            event.preventDefault();
            event.stopPropagation();
        }
        center.addEventListener('wheel', (event) => {
            if (!event.ctrlKey && !event.metaKey)
                return;
            event.preventDefault();
            zoomSetzen(state.zoom + (event.deltaY < 0 ? 10 : -10), { clientX: event.clientX, clientY: event.clientY });
        }, { passive: false });
        const finger = new Map();
        let kneifen = null;
        let kneifBild = 0;
        let kneifWert = 100;
        let kneifAnker = { clientX: 0, clientY: 0 };
        const kneifZeichnen = () => { kneifBild = 0; zoomSetzen(kneifWert, kneifAnker); };
        center.addEventListener('pointerdown', (event) => {
            if (event.pointerType !== 'touch')
                return;
            finger.set(event.pointerId, [event.clientX, event.clientY]);
            if (finger.size === 2) {
                const [a, b] = [...finger.values()];
                kneifen = { abstand: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, zoom: state.zoom };
            }
        }, true);
        center.addEventListener('pointermove', (event) => {
            if (!kneifen || !finger.has(event.pointerId))
                return;
            finger.set(event.pointerId, [event.clientX, event.clientY]);
            const [a, b] = [...finger.values()];
            const abstand = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1;
            kneifWert = kneifen.zoom * abstand / kneifen.abstand;
            kneifAnker = { clientX: (a[0] + b[0]) / 2, clientY: (a[1] + b[1]) / 2 };
            if (!kneifBild)
                kneifBild = requestAnimationFrame(kneifZeichnen);
        }, true);
        const fingerWeg = (event) => {
            finger.delete(event.pointerId);
            if (finger.size < 2) {
                kneifen = null;
                if (kneifBild) {
                    cancelAnimationFrame(kneifBild);
                    kneifZeichnen();
                }
            }
        };
        center.addEventListener('pointerup', fingerWeg, true);
        center.addEventListener('pointercancel', fingerWeg, true);
        nachtragAnstossen(documents, () => {
            staende.forEach((_stand, i) => { if (gezeichnet.has(i))
                verweiseMalen(i); });
        });
        findHaken = {
            seiteId: String(page.id),
            lebt: () => findbar.isConnected,
            bereichZeigen: (b) => {
                findBereichJetzt = b;
                findBereichWahl.setzen(b);
                fremdZeigen(findFeld.value);
            },
            suchen: async (wort, o) => {
                findFeld.value = wort;
                findbarSetzen(true, !!o.fokus, false);
                await suchen(wort);
                if (o.springen && treffer.length)
                    zumTreffer(0);
                if (o.fokus)
                    findFeld.focus();
                return { anzahl: treffer.length, seiten: [...new Set(treffer.map(x => x.index + 1))] };
            }
        };
        if (sprungWunsch && sprungWunsch.seiteId === page.id) {
            const wort = sprungWunsch.wort;
            sprungWunsch = null;
            findFeld.value = wort;
            findbarSetzen(true);
            void suchen(wort).then(() => { if (treffer.length)
                zumTreffer(0); });
        }
        return true;
    };
    return { available, active, select, toggle, documentsIn, render, sourceLabel, seiteAlsBild, alsPdf,
        stelleIn,
        stellenSuchen: (wort) => fremdeTreffer(wort, ''),
        findBereich, findBereichMerken, findenIn,
        freigeben: () => { griffeSchliessen(); verweisHorchenAus(); dockFreigeben(); } };
})();
window.DocumentMode = DocumentMode;
if (typeof Register !== 'undefined' && Register.kontext) {
    const K = Register.kontext;
    K.meldeLieferant('pdf', () => {
        const raus = [];
        let rang = 20;
        for (const g of (Register.menueband.inReiter('zeichnen') || [])) {
            raus.push({
                bereich: 'pdf', id: 'zeichnen-' + String(g.gruppe).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                name: String(g.gruppe), zeichen: 'pencil', rang: rang,
                liefern: () => (g.eintraege || [])
                    .filter((e) => {
                    try {
                        return typeof e.zeigen !== 'function' || e.zeigen();
                    }
                    catch {
                        return false;
                    }
                })
                    .map((e) => ({
                    id: String(e.id), name: String(e.name || e.id), unter: e.hinweis,
                    zeichen: e.zeichen,
                    an: (() => {
                        try {
                            return typeof e.an === 'function' ? !!e.an() : false;
                        }
                        catch {
                            return false;
                        }
                    })(),
                    tun: () => { try {
                        e.tun();
                    }
                    catch { } }
                }))
            });
            rang += 10;
        }
        return raus;
    });
    K.melde({ bereich: 'pdf', id: 'ocr', name: 'Text erkennen (OCR)',
        zeichen: 'camera', rang: 200,
        zeigen: () => typeof Recognition !== 'undefined' && !!Recognition.capturePage,
        tun: () => { try {
            Recognition.capturePage();
        }
        catch { } } });
    K.melde({ bereich: 'pdf', id: 'formelheft', name: 'Formelheft',
        zeichen: 'book', rang: 210,
        zeigen: () => typeof Formelheft !== 'undefined' && !!Formelheft.umschalten,
        tun: () => { try {
            Formelheft.umschalten();
        }
        catch { } } });
}
