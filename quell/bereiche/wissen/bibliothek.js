"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/bibliothek.ts (npm run bauen:ts). */
const Bibliothek = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const rightsActive = () => typeof Konten !== 'undefined' && typeof Konten.darf === 'function';
    const permitted = (action, pageId) => !rightsActive() || (pageId ? Konten.darf(action, pageId) : Konten.darf(action));
    const collectionPageId = (collectionId) => {
        const blocks = Object.values(Store.cache.blocks)
            .filter(block => block?.alive !== false && block.type === 'database' &&
            block.collectionId === collectionId);
        const block = blocks.find(item => !item.verknuepft) || blocks[0];
        if (!block || typeof Links === 'undefined' || !Links.seiteVon)
            return '';
        return String(Links.seiteVon(block.id)?.id || '');
    };
    const collectionPermitted = (action, collectionId) => {
        if (!rightsActive())
            return true;
        const pageId = collectionPageId(collectionId);
        return !!pageId && permitted(action, pageId);
    };
    const vorfahrWeg = (b) => {
        let cur = b && b.parentTable !== 'collection' && b.parentId ? Store.cache.blocks[b.parentId] : null;
        for (let n = 0; cur && n < 50; n++) {
            if (cur.alive === false)
                return true;
            cur = cur.parentTable !== 'collection' && cur.parentId ? Store.cache.blocks[cur.parentId] : null;
        }
        return false;
    };
    const alleSeiten = () => Object.values(Store.cache.blocks)
        .filter(b => b.type === 'page' && b.alive !== false && !b.system &&
        (b.parentTable === 'collection'
            ? collectionPermitted('lesen', b.parentId)
            : permitted('lesen', b.id)) && !vorfahrWeg(b));
    const VORGABE_SYMBOLE = new Set(['', '📄', '📁', '🗂', '🗂️']);
    const eigenesSymbol = (p) => {
        const s = String(p?.icon ?? '').trim();
        return VORGABE_SYMBOLE.has(s) ? '' : [...s].slice(0, 4).join('');
    };
    const quelleVon = (p) => {
        if (p.parentTable === 'collection') {
            const c = Store.cache.collections[p.parentId];
            return { icon: '▦', text: c ? c.name : 'Datenbank', id: c ? c.id : '' };
        }
        if (p.bereich) {
            const b = (Store.getMeta('bereiche', []) || []).find((x) => x.id === p.bereich);
            if (b)
                return { icon: b.icon || '👥', text: b.name, id: '' };
        }
        const pfad = Store.pathOf(p.id);
        if (pfad.length > 1) {
            const sichtbar = pfad.slice(0, -1).find((item) => permitted('lesen', item.id));
            if (sichtbar)
                return { icon: sichtbar.icon || '📄', text: sichtbar.text || 'Ohne Titel', id: sichtbar.id };
            return { icon: '👥', text: 'Direkt freigegeben', id: '' };
        }
        return { icon: '🔒', text: 'Privat', id: '' };
    };
    const zeitZahl = (wann) => {
        if (!wann)
            return 0;
        const ms = typeof wann === 'number' ? wann : Date.parse(String(wann));
        return isNaN(ms) ? 0 : ms;
    };
    const wannText = (wann) => {
        if (!wann)
            return '—';
        const ms = typeof wann === 'number' ? wann : Date.parse(String(wann));
        if (isNaN(ms))
            return '—';
        const d = Math.floor((Date.now() - ms) / 60000);
        if (d < 1)
            return 'gerade eben';
        if (d < 60)
            return 'vor ' + d + 'm';
        if (d < 1440)
            return 'vor ' + Math.floor(d / 60) + 'h';
        if (d < 10080)
            return 'vor ' + Math.floor(d / 1440) + ' Tagen';
        return new Date(ms).toLocaleDateString('de-CH', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const ORTE = [
        { id: 'ablage', name: 'Meine Ablage', zeichen: 'archive', zielRang: 1 },
        { id: 'kuerzlich', name: 'Zuletzt geöffnet', zeichen: 'clock', zielRang: 2, kurz: 'Zuletzt' },
        { id: 'favoriten', name: 'Favoriten', zeichen: 'star', zielRang: 3 },
        { id: 'pdf', name: 'Alle PDFs', zeichen: 'page', zielRang: 4, kurz: 'PDFs' },
        { id: 'geteilt', name: 'Geteilt', zeichen: 'users' },
        { id: 'privat', name: 'Privat', zeichen: 'lock' },
        { id: 'schule', name: 'Ausbildung', zeichen: 'book' },
        { id: 'datenbank', name: 'In Datenbanken', zeichen: 'database' },
        { id: 'alle', name: 'Alle', zeichen: 'grid' }
    ];
    const ortAktiv = () => zustand.reiter === 'alle' && zustand.art === 'pdf' ? 'pdf' : zustand.reiter;
    const SPALTEN = [
        { id: 'name', icon: '📄', name: 'Seitenbezeichnung', breit: '2fr' },
        { id: 'von', icon: '👤', name: 'Erstellt von', breit: '1fr' },
        { id: 'quelle', icon: '📍', name: 'Quelle', breit: '1.2fr' },
        { id: 'wann', icon: '🕘', name: 'Zuletzt bearbeitet', breit: '1fr' }
    ];
    const FORMEN = [
        { id: 'deckel', name: 'Als Dokumente', zeichen: 'pages' },
        { id: 'regal', name: 'Nach Heften ordnen', zeichen: 'library' },
        { id: 'liste', name: 'Als Tabelle', zeichen: 'menu' }
    ];
    const form = () => {
        const wahl = Store.getMeta('bibForm', 'deckel');
        return wahl === 'liste' ? 'liste' : wahl === 'regal' ? 'regal' : 'deckel';
    };
    const ORDNER_SCHLUESSEL = 'bibOrdner';
    const ordnerLesen = () => {
        if (typeof Store === 'undefined' || !Store.getMeta)
            return null;
        const id = String(Store.getMeta(ORDNER_SCHLUESSEL, '') || '');
        if (!id)
            return null;
        const p = Store.getBlock(id);
        return (p && p.alive !== false) ? id : null;
    };
    let zustand = { reiter: 'ablage', ordner: null,
        sortier: 'wann', richtung: 'ab',
        spalten: SPALTEN.map(s => s.id),
        art: 'alle' };
    const zeichneSchule = (wrap) => {
        const blocks = Object.values(Store.cache.blocks);
        const root = blocks.find(block => block?.alive !== false && block.type === 'page' &&
            (block.schoolRoot === true || block.systemRole === 'school-root') && permitted('lesen', block.id));
        if (!root) {
            wrap.innerHTML = '<div class="school-home school-empty">' + schulOrt() + '<div class="school-empty-icon">🎓</div>' +
                '<h1>Ausbildungsbereich</h1><p>Lege die additive Ausbildungsvorlage an. Sie erstellt normale Seiten und Datenbanken.</p>' +
                '<button data-school-action="install" class="prim">Ausbildung einrichten</button></div>';
            wrap.querySelector('[data-school-action="install"]')?.addEventListener('click', () => {
                if (!permitted('bearbeiten')) {
                    UI.toast('Du darfst hier keinen Ausbildungsbereich anlegen.');
                    return;
                }
                const page = Galerie.bauen('ausbildung');
                if (page) {
                    App.zeichneBaum();
                    App.oeffne(page.id);
                }
            });
            schulOrtBinden(wrap);
            return;
        }
        const children = Store.childrenOf(root.id)
            .filter((block) => block.alive !== false && block.type === 'page' &&
            block.parentTable !== 'collection' && permitted('lesen', block.id))
            .slice(0, 18);
        const documentPages = new Map();
        blocks.filter(block => block?.alive !== false && block.type === 'pdfseite')
            .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))
            .forEach(block => {
            if (documentPages.size >= 6)
                return;
            const page = Links.seiteVon(block.id);
            if (page && permitted('lesen', page.id) && !documentPages.has(page.id))
                documentPages.set(page.id, { page, block });
        });
        const due = typeof Learning !== 'undefined' && Learning.dailyQueue
            ? Learning.dailyQueue().all.slice(0, 6)
            : (Werkzeuge.faellig ? Werkzeuge.faellig().slice(0, 6) : []);
        const tasks = meineAufgaben().filter(task => !task.fertig).slice(0, 6);
        const examCollections = Object.values(Store.cache.collections)
            .filter(collection => collection.schoolRootId === root.id && collection.schoolKind === 'exams' &&
            collectionPermitted('lesen', collection.id));
        const exams = [];
        const now = Date.now(), horizon = now + 120 * 86400000;
        examCollections.forEach(collection => {
            const dateKey = Object.keys(collection.schema || {}).find(key => collection.schema[key].type === 'date');
            if (!dateKey)
                return;
            Store.rowsOf(collection.id).forEach((row) => {
                const date = Date.parse(String(row.props?.[dateKey] || ''));
                if (Number.isFinite(date) && date >= now - 86400000 && date <= horizon)
                    exams.push({ row, date, collection });
            });
        });
        exams.sort((a, b) => a.date - b.date);
        const list = (items, make, empty) => items.length ? items.map(make).join('') : '<p class="school-none">' + esc(empty) + '</p>';
        wrap.innerHTML =
            '<div class="school-home">' + schulOrt() +
                '<div class="school-hero"><div><span>🎓 Ausbildung</span><h1>' + esc(root.text || 'Ausbildung') +
                '</h1><p>Seiten, Lernstoff und Termine an einem Ort – alles bleibt normale Redion-Struktur.</p></div>' +
                '<div class="school-quick"><button data-school-action="capture">📷 Erfassen</button>' +
                '<button data-school-action="learn">🎴 Lernen</button>' +
                '<button data-school-action="calculate">⚡ Rechnen</button>' +
                '<button data-school-open="' + esc(root.id) + '">↗ Seite öffnen</button></div></div>' +
                '<section class="school-section"><h2>Ordner & Bereiche</h2><div class="school-folders">' +
                list(children, page => '<button class="school-folder" data-school-open="' + esc(page.id) + '">' +
                    '<span>' + esc(page.icon || '📁') + '</span><b>' + esc(page.text || 'Ohne Titel') + '</b>' +
                    '<em>' + Store.childrenOf(page.id).filter((child) => child.type !== 'page' ||
                    permitted('lesen', child.id)).length + ' Einträge</em></button>', 'Noch keine Unterseiten.') + '</div></section>' +
                '<div class="school-grid">' +
                '<section class="school-card"><h2>Zuletzt verwendete PDFs</h2>' +
                list([...documentPages.values()], item => '<button data-school-doc="' + esc(item.page.id) + '">' +
                    '<span>📄</span><b>' + esc(item.page.text || 'PDF-Seite') + '</b><em>Seite ' +
                    esc(item.block.nr || 1) + '</em></button>', 'Noch kein PDF abgelegt.') + '</section>' +
                '<section class="school-card"><h2>Heute lernen</h2>' +
                list(due, item => {
                    const card = item.card || item;
                    return '<button data-school-block="' + esc(card.id) + '"><span>🎴</span><b>' +
                        esc((String(card.text || 'Karte').split('::')[0] || 'Karte').replace(/\{\{|\}\}/g, '')) +
                        '</b><em>' + esc(item.reason || 'fällig') + '</em></button>';
                }, 'Keine Karten fällig.') + '</section>' +
                '<section class="school-card"><h2>Offene Aufgaben</h2>' +
                list(tasks, task => '<button data-school-open="' + esc(task.id) + '"><span>☐</span><b>' +
                    esc(task.titel) + '</b><em>' + esc(task.datum ? String(task.datum).slice(0, 10) : task.coll.name) +
                    '</em></button>', 'Keine offene Aufgabe gefunden.') + '</section>' +
                '<section class="school-card"><h2>Nächste Prüfungen</h2>' +
                list(exams.slice(0, 6), exam => '<button data-school-open="' + esc(exam.row.id) + '"><span>📅</span><b>' +
                    esc(exam.row.text || exam.row.props?.title || 'Prüfung') + '</b><em>' +
                    esc(new Date(exam.date).toLocaleDateString('de-CH')) + '</em></button>', 'Noch kein Prüfungstermin eingetragen.') + '</section>' +
                '</div>' +
                '</div>';
        wrap.querySelectorAll('[data-school-open]').forEach(button => button.addEventListener('click', () => button.dataset.schoolOpen && App.oeffne(button.dataset.schoolOpen)));
        wrap.querySelectorAll('[data-school-block]').forEach(button => button.addEventListener('click', () => button.dataset.schoolBlock && App.zeigeBlock(button.dataset.schoolBlock)));
        wrap.querySelectorAll('[data-school-doc]').forEach(button => button.addEventListener('click', () => {
            const page = button.dataset.schoolDoc ? Store.getBlock(button.dataset.schoolDoc) : null;
            if (!page || !permitted('lesen', page.id))
                return;
            if (permitted('bearbeiten', page.id))
                Store.updateBlock(page.id, { dokumentModus: true });
            App.oeffne(page.id);
        }));
        wrap.querySelector('[data-school-action="capture"]')?.addEventListener('click', () => {
            if (!permitted('bearbeiten', root.id)) {
                UI.toast('Du darfst im Ausbildungsbereich nichts erfassen.');
                return;
            }
            Recognition.scan();
        });
        wrap.querySelector('[data-school-action="learn"]')?.addEventListener('click', () => Werkzeuge.lernen());
        wrap.querySelector('[data-school-action="calculate"]')?.addEventListener('click', () => Electrical.open(root));
        schulOrtBinden(wrap);
    };
    const DECKE_KUERZLICH = 60;
    const hatFreigaben = (p) => {
        if (typeof Konten === 'undefined' || !Konten.freigabenVon)
            return false;
        const entries = Konten.freigabenVon(p.id) || {};
        return Array.isArray(entries) ? entries.length > 0 : Object.keys(entries).length > 0;
    };
    const reiterFilter = (reiter, alle) => {
        if (reiter === 'kuerzlich')
            return alle.filter(p => p.zuletztGeoeffnet || p.edited);
        if (reiter === 'favoriten')
            return alle.filter(p => p.favorite);
        if (reiter === 'geteilt')
            return alle.filter(p => hatFreigaben(p) || p.oeffentlich);
        if (reiter === 'privat')
            return alle.filter(p => p.parentTable !== 'collection' && !p.bereich);
        if (reiter === 'datenbank')
            return alle.filter(p => p.parentTable === 'collection');
        return null;
    };
    const auswahl = () => {
        const alle = alleSeiten();
        let liste = alle;
        if (zustand.reiter === 'ablage') {
            const ordner = zustand.ordner;
            liste = ordner
                ? alle.filter(p => p.parentId === ordner && p.parentTable !== 'collection')
                : alle.filter(p => !p.parentId && p.parentTable !== 'collection');
            liste = liste.slice().sort((a, b) => {
                const oa = artVon(a).id === 'ordner' ? 0 : 1;
                const ob = artVon(b).id === 'ordner' ? 0 : 1;
                if (oa !== ob)
                    return oa - ob;
                return String(a.text || '').localeCompare(String(b.text || ''), 'de', { sensitivity: 'base', numeric: true });
            });
        }
        if (zustand.reiter === 'kuerzlich')
            liste = (reiterFilter('kuerzlich', alle) || [])
                .sort((a, b) => zeitZahl(b.zuletztGeoeffnet || b.edited) -
                zeitZahl(a.zuletztGeoeffnet || a.edited));
        else if (zustand.reiter !== 'ablage')
            liste = reiterFilter(zustand.reiter, alle) || liste;
        const gesamt = liste.length;
        if (zustand.reiter === 'kuerzlich' && liste.length > DECKE_KUERZLICH)
            liste = liste.slice(0, DECKE_KUERZLICH);
        /* In der Ablage sind Ordner und Namen die verlässliche Ordnung (E380).
       Die frei sortierbare Tabelle behält die gewählte Spaltensortierung;
       für Dokumentkarten/Regal darf das Standardfeld „wann“ die
       Ordner-zuerst-Reihenfolge nicht nachträglich überschreiben. */
    const tabellenSortierung = zustand.reiter !== 'ablage' || form() === 'liste';
    if (tabellenSortierung && (zustand.reiter !== 'kuerzlich' || zustand.sortier !== 'wann')) {
            const wert = (p) => zustand.sortier === 'name' ? (p.text || '').toLowerCase()
                : zustand.sortier === 'von' ? (p.erstelltVon || '').toLowerCase()
                    : zustand.sortier === 'quelle' ? quelleVon(p).text.toLowerCase()
                        : zeitZahl(p.edited || p.created);
            liste = [...liste].sort((a, b) => {
                const x = wert(a), y = wert(b);
                const v = x < y ? -1 : x > y ? 1 : 0;
                return zustand.richtung === 'auf' ? v : -v;
            });
        }
        return { liste, gesamt };
    };
    const ARTEN = [
        { id: 'pdf', name: 'PDF', typen: ['pdfseite'] },
        { id: 'board', name: 'Whiteboard', typen: ['whiteboard'] },
        { id: 'plan', name: 'Schaltplan', typen: ['schaltplan'] },
        { id: 'blatt', name: 'Blatt', typen: ['blatt'] },
        { id: 'tab', name: 'Tabelle', typen: ['spreadsheet'] },
        { id: 'db', name: 'Datenbank', typen: ['database'] },
        { id: 'karten', name: 'Karteikarten', typen: ['flashcard'] },
        { id: 'datei', name: 'Dateien', typen: ['file', 'image', 'video', 'audio'] }
    ];
    const artVon = (p) => {
        const kinder = Store.childrenOf(p.id) || [];
        for (const art of ARTEN)
            if (kinder.some((b) => b && b.alive !== false &&
                art.typen.includes(b.type)))
                return { id: art.id, name: art.name };
        const unterseiten = kinder.filter((b) => b && b.alive !== false && b.type === 'page');
        if (p.heftArt === 'fach' || (unterseiten.length >= 2 && unterseiten.length >= kinder.length - 1))
            return { id: 'ordner', name: unterseiten.length + (unterseiten.length === 1 ? ' Sache' : ' Sachen') };
        return { id: 'seite', name: 'Seite' };
    };
    const ordnerWeg = () => {
        const weg = [];
        let id = zustand.ordner;
        const gesehen = new Set();
        while (id && !gesehen.has(id)) {
            gesehen.add(id);
            const p = Store.getBlock(id);
            if (!p || p.alive === false)
                break;
            weg.unshift(p);
            id = p.parentTable === 'collection' ? null : (p.parentId || null);
        }
        return weg;
    };
    const geheIn = (id) => {
        zustand.ordner = id;
        zustand.reiter = 'ablage';
        zustand.art = 'alle';
        if (typeof Store !== 'undefined' && Store.setMeta)
            Store.setMeta(ORDNER_SCHLUESSEL, id || '');
        App.zeichneSeite();
    };
    const geheHoch = () => {
        const weg = ordnerWeg();
        const oben = weg.length >= 2 ? weg[weg.length - 2] : null;
        geheIn(oben ? oben.id : null);
    };
    const liegtIn = (p, ordnerId) => {
        let cur = p && p.parentTable !== 'collection' && p.parentId ? Store.cache.blocks[p.parentId] : null;
        for (let n = 0; cur && n < 50; n++) {
            if (cur.id === ordnerId)
                return true;
            cur = cur.parentTable !== 'collection' && cur.parentId ? Store.cache.blocks[cur.parentId] : null;
        }
        return false;
    };
    const suchBereich = () => {
        const wurzel = document.querySelector('[data-bib-bereich]');
        if (!wurzel || !wurzel.isConnected)
            return null;
        const alle = alleSeiten();
        const ordnerId = zustand.reiter === 'ablage' ? zustand.ordner : null;
        const ordner = ordnerId ? Store.getBlock(ordnerId) : null;
        let liste = ordner ? alle.filter(p => liegtIn(p, ordner.id)) : (reiterFilter(zustand.reiter, alle) || alle);
        const ort = ortAktiv();
        const artFilter = ort === 'pdf' ? 'pdf' : zustand.art;
        if (artFilter !== 'alle')
            liste = liste.filter(p => artVon(p).id === artFilter);
        const ids = new Set(liste.map(p => String(p.id)));
        const teile = [];
        if (ordner)
            teile.push(String(ordner.text || 'Ohne Titel'));
        else if (ort !== 'ablage' && ort !== 'alle')
            teile.push(ORTE.find(o => o.id === ort)?.name || ort);
        if (ort !== 'pdf' && zustand.art !== 'alle')
            teile.push(ART_FILTER.find(a => a.id === zustand.art)?.name || zustand.art);
        return {
            name: teile.length ? 'In ‚' + teile.join(' · ') + '‘' : 'Bibliothek',
            ordnerId: ordner ? String(ordner.id) : null,
            art: artFilter,
            passt: (seite) => !!seite && ids.has(String(seite.id))
        };
    };
    const fachSeiten = (elternId) => (Store.childrenOf(elternId) || [])
        .filter((b) => b && b.alive !== false && b.type === 'page')
        .sort((a, b) => {
        const ao = artVon(a).id === 'ordner' ? 0 : 1;
        const bo = artVon(b).id === 'ordner' ? 0 : 1;
        return ao !== bo ? ao - bo
            : String(a.text || '').localeCompare(String(b.text || ''), 'de');
    });
    const fachStueck = (p, weg) => {
        const art = artVon(p);
        return {
            id: p.id, name: p.text || 'Ohne Titel', art: art.name,
            ordner: art.id === 'ordner',
            ...(weg.length ? { weg: weg.join(' \u203a ') } : {})
        };
    };
    const fachTiefe = (elternId, weg = [], tief = 0) => {
        if (tief > 6)
            return [];
        const raus = [];
        for (const p of fachSeiten(elternId)) {
            raus.push(fachStueck(p, weg));
            if (artVon(p).id === 'ordner')
                raus.push(...fachTiefe(p.id, weg.concat(p.text || 'Ohne Titel'), tief + 1));
        }
        return raus;
    };
    const SCHAU_AUF_MS = 280;
    const SCHAU_ZU_MS = 220;
    let schauUhr = 0;
    let schauZuUhr = 0;
    let schauId = '';
    let schauZu = null;
    const schauAbsagen = () => {
        if (schauUhr) {
            clearTimeout(schauUhr);
            schauUhr = 0;
        }
        if (schauZuUhr) {
            clearTimeout(schauZuUhr);
            schauZuUhr = 0;
        }
    };
    const zeigerHatHover = () => {
        try {
            return matchMedia('(any-hover: hover) and (any-pointer: fine)').matches;
        }
        catch {
            return false;
        }
    };
    const blickHinein = (p, r, perZeigen = false, beiOeffnen) => {
        const oeffne = beiOeffnen || ((id) => geheIn(id));
        if (typeof Ordnerkarte === 'undefined') {
            oeffne(p.id);
            return;
        }
        document.querySelectorAll('.ru-fach-lage').forEach(a => a.remove());
        const zurueck = document.activeElement;
        const lage = document.createElement('div');
        lage.className = 'ru-fach-lage';
        let zu = () => { };
        const griff = Ordnerkarte.bauen({
            name: p.text || 'Ohne Titel',
            kinder: fachSeiten(p.id).map(k => fachStueck(k, [])),
            tiefe: fachTiefe(p.id),
            beiWahl: (stueck) => {
                zu();
                if (stueck.ordner)
                    oeffne(stueck.id);
                else
                    App.oeffne(stueck.id);
            },
            beiOrdner: () => { zu(); oeffne(p.id); }
        });
        lage.append(griff.element);
        document.body.append(lage);
        const b = lage.getBoundingClientRect();
        lage.style.left = Math.max(8, Math.min(r.left, innerWidth - b.width - 8)) + 'px';
        lage.style.top = (r.bottom + 6 + b.height > innerHeight
            ? Math.max(8, r.top - b.height - 6) : r.bottom + 6) + 'px';
        const beiTaste = (ereignis) => {
            if (ereignis.key === 'Escape') {
                ereignis.stopPropagation();
                zu();
            }
        };
        const beiKlick = (ereignis) => {
            if (!(ereignis.target instanceof Node) || !lage.contains(ereignis.target))
                zu();
        };
        zu = () => {
            document.removeEventListener('keydown', beiTaste, true);
            document.removeEventListener('mousedown', beiKlick);
            schauAbsagen();
            schauId = '';
            schauZu = null;
            lage.remove();
            if (!perZeigen)
                zurueck?.focus?.();
        };
        if (perZeigen) {
            schauId = String(p.id);
            schauZu = () => zu();
            lage.addEventListener('pointerenter', () => {
                if (schauZuUhr) {
                    clearTimeout(schauZuUhr);
                    schauZuUhr = 0;
                }
            });
            lage.addEventListener('pointerleave', ereignis => {
                if (ereignis.pointerType === 'touch')
                    return;
                schauZuSpaeter();
            });
        }
        document.addEventListener('keydown', beiTaste, true);
        setTimeout(() => document.addEventListener('mousedown', beiKlick), 0);
        griff.klappen(true);
        if (!perZeigen)
            griff.element.querySelector('.ru-fach-griff')?.focus();
    };
    const blickKnopf = (id, name) => `<button class="bib-blick" data-blick="${esc(id)}" ` +
        `aria-label="Blick in „${esc(name || 'Ohne Titel')}“" title="Blick hinein">` +
        '<i class="bib-blick-auge" aria-hidden="true"><b></b></i></button>';
    const mehrKnopf = (id, name) => `<button type="button" class="bib-deckel-mehr" data-mehr-id="${esc(id)}" aria-haspopup="menu" ` +
        `aria-label="Aktionen für „${esc(name || 'Ohne Titel')}“" title="Aktionen">` +
        '<i aria-hidden="true">\u22ef</i></button>';
    const mitBlick = (deckelHtml, id, name) => '<span class="bib-zelle">' + deckelHtml + blickKnopf(id, name) + '</span>';
    const blickAnbringen = (wurzel, beiOeffnen) => {
        wurzel.querySelectorAll('.bib-blick[data-blick]').forEach(b => {
            const seiteVon = () => Store.getBlock(b.dataset['blick'] || '');
            b.addEventListener('click', ereignis => {
                ereignis.stopPropagation();
                schauAbsagen();
                const p = seiteVon();
                if (p && schauId === String(p.id) && document.querySelector('.ru-fach-lage')) {
                    schauId = '';
                    return;
                }
                if (p)
                    blickHinein(p, b.getBoundingClientRect(), false, beiOeffnen);
            });
            b.addEventListener('pointerenter', ereignis => {
                const e = ereignis;
                if (e.pointerType !== 'mouse' && e.pointerType !== 'pen')
                    return;
                if (!zeigerHatHover())
                    return;
                if (document.querySelector('.ru-fach-lage'))
                    return;
                schauAbsagen();
                schauUhr = window.setTimeout(() => {
                    schauUhr = 0;
                    const p = seiteVon();
                    if (p)
                        blickHinein(p, b.getBoundingClientRect(), true, beiOeffnen);
                }, SCHAU_AUF_MS);
            });
            b.addEventListener('pointerdown', () => {
                if (schauUhr) {
                    clearTimeout(schauUhr);
                    schauUhr = 0;
                }
            });
            b.addEventListener('pointerleave', ereignis => {
                if (ereignis.pointerType === 'touch')
                    return;
                if (schauUhr) {
                    clearTimeout(schauUhr);
                    schauUhr = 0;
                }
                if (schauId)
                    schauZuSpaeter();
            });
        });
    };
    const schauZuSpaeter = () => {
        if (schauZuUhr)
            clearTimeout(schauZuUhr);
        schauZuUhr = window.setTimeout(() => {
            schauZuUhr = 0;
            if (!schauId)
                return;
            const zu = schauZu;
            schauId = '';
            schauZu = null;
            if (zu)
                zu();
            else
                document.querySelectorAll('.ru-fach-lage').forEach(a => a.remove());
        }, SCHAU_ZU_MS);
    };
    const ordnerKrume = () => {
        if (zustand.reiter !== 'ablage')
            return '';
        const weg = ordnerWeg();
        if (!weg.length)
            return '';
        return '<nav class="bib-krume" aria-label="Wo ich bin">' +
            '<button data-hoch aria-label="Eine Ebene zurück">\u2039</button>' +
            '<button data-ordner="">Dokumente</button>' +
            weg.map((p, i) => '<span aria-hidden="true">\u203a</span>' +
                (i === weg.length - 1
                    ? '<b>' + esc(p.text || 'Ohne Titel') + '</b>'
                    : `<button data-ordner="${esc(p.id)}">` + esc(p.text || 'Ohne Titel') + '</button>')).join('') +
            '</nav>';
    };
    const ART_FILTER = [
        { id: 'alle', name: 'Alle' },
        { id: 'pdf', name: 'PDF' },
        { id: 'board', name: 'Whiteboards' },
        { id: 'plan', name: 'Schaltpläne' },
        { id: 'blatt', name: 'Blätter' },
        { id: 'tab', name: 'Tabellen' },
        { id: 'db', name: 'Datenbanken' },
        { id: 'karten', name: 'Karteikarten' },
        { id: 'ordner', name: 'Ordner' },
        { id: 'datei', name: 'Dateien' },
        { id: 'seite', name: 'Seiten' }
    ];
    const recentCarousel = () => {
        if (zustand.ordner || zustand.art !== 'alle' ||
            !['ablage', 'kuerzlich'].includes(zustand.reiter))
            return '';
        const recent = alleSeiten().filter(p => p.zuletztGeoeffnet)
            .sort((a, b) => zeitZahl(b.zuletztGeoeffnet) - zeitZahl(a.zuletztGeoeffnet)).slice(0, 3);
        if (!recent.length)
            return '';
        return '<section class="rmo-recent" aria-label="Zuletzt geöffnet"><h2>Zuletzt geöffnet</h2>' +
            '<div class="rmo-recent-track">' + recent.map((p, index) => '<button type="button" class="rmo-recent-card" data-rmo-open="' + esc(p.id) +
            '" style="--rmo-index:' + index + '"><span>' + esc(artVon(p).name) + '</span><b>' +
            esc(p.text || 'Ohne Titel') + '</b><small>' + esc(wannText(p.zuletztGeoeffnet)) +
            '</small></button>').join('') +
            '</div></section>';
    };
    const studioWeiter = () => {
        if (zustand.reiter !== 'ablage' || zustand.ordner || zustand.art !== 'alle')
            return '';
        const letzte = alleSeiten().filter(p => p.zuletztGeoeffnet && artVon(p).id === 'pdf')
            .sort((a, b) => zeitZahl(b.zuletztGeoeffnet) - zeitZahl(a.zuletztGeoeffnet))[0];
        if (!letzte)
            return '';
        const bild = typeof Vorschau !== 'undefined' && Vorschau.bildDatei ? Vorschau.bildDatei(letzte.id) : null;
        return '<section class="bib-studio-weiter" aria-label="PDF weiterlesen">' +
            '<span class="bib-studio-miniatur" aria-hidden="true">' +
            (bild ? '<img data-vorschau="' + esc(bild) + '" alt="" loading="lazy">' : '<span>PDF</span>') + '</span>' +
            '<div><span class="bib-studio-eyebrow">Weiterarbeiten</span><h2>' + esc(letzte.text || 'Ohne Titel') +
            '</h2><p>Zuletzt geöffnet ' + esc(wannText(letzte.zuletztGeoeffnet)) + '</p></div>' +
            '<button type="button" data-studio-weiter="' + esc(letzte.id) + '">Weiterlesen' +
            '<span aria-hidden="true">↗</span></button></section>';
    };
    const IMPORT_WORT = 'PDF öffnen';
    const importBeschriften = (wort) => {
        document.querySelectorAll('[data-studio-import]').forEach(knopf => {
            const feld = knopf.querySelector('.wort')
                || knopf.querySelector('span:not([data-sym]):not([aria-hidden="true"])');
            if (feld)
                feld.textContent = wort || IMPORT_WORT;
            else
                knopf.textContent = wort || IMPORT_WORT;
        });
    };
    let pdfImportLaeuft = false;
    const pdfImportieren = () => {
        const ziel = zustand.reiter === 'ablage' ? zustand.ordner : null;
        if (pdfImportLaeuft)
            return;
        if (!permitted('bearbeiten', ziel || undefined)) {
            UI.toast('Du darfst hier keine PDF ablegen.');
            return;
        }
        if (typeof ArchivImport === 'undefined' || !ArchivImport.dateiAlsDokument) {
            UI.toast('Der PDF-Import ist gerade nicht verfügbar.');
            return;
        }
        const eingabe = document.createElement('input');
        eingabe.type = 'file';
        eingabe.accept = '.pdf,application/pdf';
        eingabe.hidden = true;
        document.body.appendChild(eingabe);
        eingabe.addEventListener('cancel', () => eingabe.remove(), { once: true });
        eingabe.addEventListener('change', async () => {
            const datei = eingabe.files?.[0];
            eingabe.remove();
            if (!datei || pdfImportLaeuft)
                return;
            if (!/\.pdf$/i.test(datei.name)) {
                UI.toast('Bitte eine PDF-Datei auswählen.');
                return;
            }
            if (!permitted('bearbeiten', ziel || undefined) || (ziel && Store.getBlock(ziel)?.alive === false)) {
                UI.toast('In diesem Ordner kann nichts abgelegt werden.');
                return;
            }
            pdfImportLaeuft = true;
            document.querySelectorAll('[data-studio-import]').forEach(button => {
                button.disabled = true;
                button.setAttribute('aria-busy', 'true');
            });
            importBeschriften('PDF wird gelesen …');
            try {
                const ergebnis = await ArchivImport.dateiAlsDokument(datei, ziel);
                App.zeichneBaum();
                if (ergebnis.seiteId)
                    App.oeffne(ergebnis.seiteId);
                else
                    App.zeichneSeite();
            }
            catch (fehler) {
                UI.toast('PDF konnte nicht importiert werden: ' +
                    (fehler instanceof Error ? fehler.message : String(fehler)));
            }
            finally {
                pdfImportLaeuft = false;
                document.querySelectorAll('[data-studio-import]').forEach(button => {
                    button.disabled = !permitted('bearbeiten', zustand.ordner || undefined);
                    button.removeAttribute('aria-busy');
                });
                importBeschriften();
            }
        }, { once: true });
        eingabe.click();
    };
    const MIT_TEXT = new Set(['seite', 'karten', 'db']);
    const deckelKarte = (p) => {
        const art = artVon(p);
        const children = art.id === 'ordner' ? alleSeiten().filter(child => child.parentId === p.id && child.parentTable !== 'collection') : [];
        const folderPreview = art.id === 'ordner' ? '<span class="rmo-folder-preview">' +
            '<b>' + children.length + (children.length === 1 ? ' Unterseite' : ' Unterseiten') + '</b>' +
            children.slice(0, 3).map(child => '<span>' + esc(child.text || 'Ohne Titel') + '</span>').join('') +
            '</span>' : '';
        const datei = Vorschau.bildDatei ? Vorschau.bildDatei(p.id) : null;
        const tinte = !datei && Vorschau.tinteSvg ? Vorschau.tinteSvg(p.id) : '';
        const bild = datei
            ? `<img class="bib-deckel-bild" data-vorschau="${esc(datei)}" alt="" loading="lazy">`
            : (tinte || (MIT_TEXT.has(art.id) ? (Vorschau.miniatur(p.id, 5) || '') : ''));
        const wann = wannText(p.edited || p.created);
        const deckel = `<button class="bib-deckel" data-id="${esc(p.id)}" data-art="${esc(art.id)}"` +
            Farben.marke(p.color) + ' ' +
            `title="${esc(p.text || 'Ohne Titel')}">` +
            '<span class="bib-card-kind">' + esc(art.id === 'ordner' ? 'Ordner' : art.name) + '</span>' +
            `<span class="bib-deckel-blatt mini-zeilen${bild ? '' : ' is-leer'}${tinte ? ' hat-tinte' : ''}">` +
            '<i class="bib-papier" aria-hidden="true"></i>' +
            (bild || '') + folderPreview +
            (art.id === 'pdf' ? '<i class="bib-deckel-marke">PDF</i>' : '') +
            '</span>' +
            '<span class="bib-deckel-name">' +
            (eigenesSymbol(p) ? '<i class="bib-deckel-symbol" aria-hidden="true">' + esc(eigenesSymbol(p)) + '</i>' : '') +
            '<b>' + esc(p.text || 'Ohne Titel') + '</b></span>' +
            '<small class="bib-card-meta">' + (art.id === 'ordner' ? esc(art.name) : 'Bearbeitet ' + esc(wann)) + '</small>' +
            '</button>';
        return '<span class="bib-zelle">' + deckel +
            (art.id === 'ordner' ? blickKnopf(p.id, p.text) : '') +
            `<button type="button" class="bib-favorite" data-bib-favorite="${esc(p.id)}" ` +
            `aria-pressed="${!!p.favorite}" aria-label="Favorit: ${esc(p.text || 'Ohne Titel')}" ` +
            `title="${p.favorite ? 'Aus Favoriten' : 'Zu Favoriten'}">` +
            '<span data-sym="star" aria-hidden="true"></span></button>' +
            mehrKnopf(p.id, p.text) + '</span>';
    };
    const hefte = (liste) => {
        const nach = new Map();
        for (const p of liste) {
            const q = quelleVon(p);
            const schluessel = q.id || ('name:' + q.text);
            let h = nach.get(schluessel);
            if (!h) {
                h = { id: q.id, icon: q.icon, name: q.text, seiten: [],
                    zuletzt: null, wann: 0 };
                nach.set(schluessel, h);
            }
            h.seiten.push(p);
            const wann = zeitZahl(p.edited || p.created);
            if (wann >= h.wann) {
                h.wann = wann;
                h.zuletzt = p;
            }
        }
        for (const h of nach.values()) {
            if (Vorschau.umfang(h.zuletzt?.id || ''))
                continue;
            const mitInhalt = h.seiten
                .filter(x => Vorschau.umfang(x.id))
                .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))[0];
            if (mitInhalt)
                h.zuletzt = mitInhalt;
        }
        return [...nach.values()].sort((a, b) => b.wann - a.wann);
    };
    const inhaltsListe = (h) => h.seiten.slice()
        .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))
        .slice(0, 6)
        .map(x => '<span class="mini-li">' + esc(x.text || 'Ohne Titel') + '</span>')
        .join('');
    const heftKarte = (h) => {
        const seite = h.zuletzt;
        const bild = (seite ? Vorschau.miniatur(seite.id, 6) : '') || inhaltsListe(h);
        return `<button class="bib-heft" data-id="${esc(seite?.id || '')}" ` +
            `title="${esc(h.name)}">` +
            `<span class="bib-heft-marke">${esc(h.icon)} ${esc(h.name)}</span>` +
            `<span class="bib-heft-blatt mini-zeilen${bild ? '' : ' is-leer'}">` +
            (bild || '<span>Dieses Heft ist noch leer.</span>') + '</span>' +
            '<span class="bib-heft-fuss"><strong>' +
            esc(seite?.text || h.name) + '</strong><small>' +
            h.seiten.length + (h.seiten.length === 1 ? ' Seite' : ' Seiten') +
            (h.wann ? ' · ' + esc(wannText(h.wann)) : '') +
            '</small></span></button>';
    };
    const handKarte = (p) => {
        const q = quelleVon(p);
        const bild = Vorschau.miniatur(p.id, 4);
        return `<button class="bib-hand" data-id="${esc(p.id)}">` +
            `<span class="bib-hand-blatt mini-zeilen${bild ? '' : ' is-leer'}">` +
            (bild || '<span>noch leer</span>') + '</span>' +
            '<span class="bib-hand-fuss"><strong>' + esc(p.text || 'Ohne Titel') +
            '</strong><small>' + esc(q.text) + ' · ' +
            esc(wannText(p.edited || p.created)) + '</small></span></button>';
    };
    const umfangSatz = (gezeigt, gesamt, eins, mehr, vonForm) => gesamt > gezeigt
        ? gezeigt + ' von ' + gesamt + ' ' + vonForm
        : gezeigt + ' ' + (gezeigt === 1 ? eins : mehr);
    const bibKopf = (liste, alle, gesamt = liste.length) => {
        return deckelKopf(alle, liste.length, zustand.art === 'alle' ? gesamt : liste.length);
    };
    const sicherungsKarte = () => {
        const st = Sicherung.stand();
        const pk = Sicherung.papierkorb();
        const wieLang = st.tage === null ? 'noch nie'
            : st.tage === 0 ? 'heute'
                : st.tage === 1 ? 'gestern'
                    : 'vor ' + st.tage + ' Tagen';
        const satz = st.tage === null
            ? 'Noch keine vollständige Sicherung auf diesem Gerät'
            : st.stufe === 'gut' ? 'Gesichert ' + wieLang
                : st.stufe === 'erinnern' ? 'Zuletzt gesichert ' + wieLang + ' — Zeit für eine neue'
                    : 'Zuletzt gesichert ' + wieLang + ' — das ist lange her';
        const art = st.art === 'json'
            ? 'JSON · ohne Anhänge'
            : st.art === 'redion' ? '.redion · mit Anhängen' : '';
        const frist = !pk.anzahl ? 'nichts weggelegt'
            : !pk.tage ? pk.anzahl + (pk.anzahl === 1 ? ' Sache liegt weg' : ' Sachen liegen weg') +
                ' · keine Frist'
                : pk.anzahl + (pk.anzahl === 1 ? ' Sache liegt weg' : ' Sachen liegen weg') +
                    (pk.naechste === null ? '' :
                        pk.naechste === 0 ? ' · die nächste läuft heute ab'
                            : pk.naechste === 1 ? ' · die nächste läuft morgen ab'
                                : ' · noch ' + pk.naechste + ' Tage für die nächste');
        return '<details class="bib-pflege-details"><summary><span class="rmo-product-status" data-zustand="' +
            (st.stufe === 'gut' ? 'fertig' : 'wartet') + '">' + esc(satz) + '</span>' +
            '<span>Sicherung & Speicher</span></summary>' +
            '<section class="bib-abschnitt"><header><h2>Sicherung und Papierkorb</h2>' +
            '<p>alles auf diesem Gerät</p></header><div class="bib-pflege">' +
            `<div class="bib-pflege-karte bib-sicher-${esc(st.stufe)}">` +
            `<span class="bib-pflege-zeichen" data-sym="${st.stufe === 'gut' ? 'checkCircle' : 'bell'}" aria-hidden="true"></span>` +
            '<span><strong>' + esc(satz) + '</strong><small>' +
            (art || 'Eine vollständige Sicherung nimmt Seiten UND Anhänge mit') +
            '</small></span>' +
            '<button type="button" data-a="sichern">Jetzt sichern</button></div>' +
            '<div class="bib-pflege-karte">' +
            '<span class="bib-pflege-zeichen" data-sym="trash" aria-hidden="true"></span>' +
            '<span><strong>Papierkorb</strong><small>' + esc(frist) + '</small></span>' +
            '<button type="button" data-a="papierkorb">Öffnen</button></div>' +
            '</div></section>' + platzKarte() + '</details>';
    };
    const platzKarte = () => '<section class="bib-abschnitt" data-bib-platz><header><h2>Platz auf dem Gerät</h2>' +
        '<p>wird gemessen …</p></header></section>';
    const platzNachtragen = (wrap) => {
        const stelle = wrap.querySelector('[data-bib-platz]');
        if (!stelle)
            return;
        void Sicherung.platz().then(p => {
            if (!stelle.isConnected)
                return;
            if (!p.bekannt) {
                stelle.innerHTML = '<header><h2>Platz auf dem Gerät</h2></header>' +
                    '<p class="bib-platz-unbekannt">Dieser Browser sagt nicht, wieviel Platz ' +
                    'Redion belegt.' + (p.anhaenge
                    ? ' Die Anhänge allein sind ' + esc(Sicherung.groesse(p.anhaenge)) + '.'
                    : '') + '</p>';
                return;
            }
            const anteil = Math.min(100, Math.round(p.belegt / p.gesamt * 1000) / 10);
            const anhangAnteil = p.belegt ? Math.min(100, p.anhaenge / p.belegt * 100) : 0;
            stelle.innerHTML = '<header><h2>Platz auf dem Gerät</h2>' +
                '<p>' + esc(Sicherung.groesse(p.belegt)) + ' von ' +
                esc(Sicherung.groesse(p.gesamt)) + ' · ' +
                anteil.toLocaleString('de-CH') + ' %</p></header>' +
                '<div class="bib-platz-balken" role="img" aria-label="' +
                esc(Sicherung.groesse(p.belegt) + ' von ' + Sicherung.groesse(p.gesamt) + ' belegt') + '">' +
                '<i style="width:' + anteil + '%"><b style="width:' + anhangAnteil + '%"></b></i>' +
                '</div>' +
                '<p class="bib-platz-teile">' +
                '<span class="bib-platz-anhang"></span>Anhänge ' +
                esc(Sicherung.groesse(p.anhaenge)) +
                '<span class="bib-platz-rest"></span>Seiten und Verwaltung ' +
                esc(Sicherung.groesse(Math.max(0, p.belegt - p.anhaenge))) +
                '</p>' +
                '<p class="bib-platz-hinweis">Geschätzt — der Browser meldet die ' +
                'Gesamtgrösse, die Aufteilung kommt aus dem Bestand.</p>';
        });
    };
    const BIB_BAUM_WURZEL = '__redion_bibliothek_wurzel__';
    const BIB_BAUM_OFFEN = 'bibBaumOffen';
    const bibliothekBaumKnoten = () => {
        const seiten = alleSeiten()
            .filter(p => p.parentTable !== 'collection');
        const nachId = new Map();
        seiten.forEach(p => nachId.set(String(p.id), p));
        const nachEltern = new Map();
        for (const p of seiten) {
            const parent = p.parentId && nachId.has(String(p.parentId))
                ? String(p.parentId)
                : '';
            const liste = nachEltern.get(parent) || [];
            liste.push(p);
            nachEltern.set(parent, liste);
        }
        const sortiere = (a, b) => {
            const aKinder = (nachEltern.get(String(a.id)) || []).length;
            const bKinder = (nachEltern.get(String(b.id)) || []).length;
            if (!!aKinder !== !!bKinder)
                return aKinder ? -1 : 1;
            return String(a.text || '').localeCompare(String(b.text || ''), 'de', { sensitivity: 'base', numeric: true });
        };
        const bauen = (p, gesehen) => {
            const id = String(p.id);
            if (gesehen.has(id))
                return { id, name: String(p.text || 'Ohne Titel'), zeichen: 'page' };
            const weiter = new Set(gesehen);
            weiter.add(id);
            const kinder = (nachEltern.get(id) || [])
                .slice()
                .sort(sortiere)
                .map(k => bauen(k, weiter));
            const farbe = Farben.kennung(p.color);
            return {
                id,
                name: String(p.text || 'Ohne Titel'),
                zeichen: eigenesSymbol(p) || (kinder.length || p.heftArt === 'fach' ? 'pages' : 'page'),
                ...(farbe ? { farbe } : {}),
                ...(kinder.length ? { kinder } : {})
            };
        };
        const wurzeln = (nachEltern.get('') || [])
            .slice()
            .sort(sortiere)
            .map(p => bauen(p, new Set()));
        return [{
                id: BIB_BAUM_WURZEL,
                name: 'Dokumente',
                zeichen: 'library',
                kinder: wurzeln
            }];
    };
    const bibliothekBaumNachtragen = (wrap) => {
        if (zustand.reiter !== 'ablage')
            return;
        const stelle = wrap.querySelector('[data-bib-baum]');
        if (!stelle)
            return;
        const Baum = window.Baumansicht;
        if (!Baum?.bauen) {
            stelle.innerHTML = '<p class="bib-baum-fehlt">Baumansicht konnte nicht geladen werden.</p>';
            return;
        }
        const gemerkt = Store.getMeta(BIB_BAUM_OFFEN, []);
        const offeneMeta = Array.isArray(gemerkt) ? gemerkt.map(String) : [];
        const pfad = ordnerWeg().map(p => String(p.id));
        const offen = [...new Set([BIB_BAUM_WURZEL, ...offeneMeta, ...pfad])];
        const griff = Baum.bauen({
            name: 'Dokumente',
            knoten: bibliothekBaumKnoten(),
            gewaehlt: zustand.ordner || BIB_BAUM_WURZEL,
            offen,
            gewaehltGeaendert: (id) => {
                if (id === BIB_BAUM_WURZEL) {
                    geheIn(null);
                    return;
                }
                const p = Store.getBlock(id);
                if (!p || p.alive === false || !permitted('lesen', id))
                    return;
                if (artVon(p).id === 'ordner') {
                    geheIn(id);
                    return;
                }
                App.oeffne(id);
            },
            offenGeaendert: (ids) => {
                if (Store.setMeta)
                    Store.setMeta(BIB_BAUM_OFFEN, ids);
            },
            aktionen: (id, wo) => {
                const p = id === BIB_BAUM_WURZEL ? null : Store.getBlock(id);
                if (!p || p.alive === false)
                    return false;
                return !!Menue.aktionen(p, ortFuer(p, wo.anker), wo.tastatur ? { rueckfokus: wo.anker } : { x: wo.x ?? 0, y: wo.y ?? 0, rueckfokus: wo.anker });
            },
            entf: (id, anker) => {
                const p = id === BIB_BAUM_WURZEL ? null : Store.getBlock(id);
                return p ? Register.aktionen.taste('Entf', p, ortFuer(p, anker)) : false;
            }
        });
        stelle.replaceChildren(griff.element);
    };
    const artenVon = (alle) => {
        const zahl = new Map();
        alle.forEach(p => { const a = artVon(p).id; zahl.set(a, (zahl.get(a) || 0) + 1); });
        return ART_FILTER
            .filter(a => a.id === 'alle' || zahl.has(a.id) || a.id === zustand.art)
            .map(a => ({ id: a.id, name: a.id === 'alle' ? 'Alle Arten' : a.name,
            zahl: a.id === 'alle' ? alle.length : (zahl.get(a.id) || 0) }));
    };
    const artPille = (alle) => {
        const arten = artenVon(alle);
        if (arten.length <= 2 && zustand.art === 'alle')
            return '';
        const jetzt = arten.find(a => a.id === zustand.art) || arten[0];
        return '<button type="button" class="bib-pille bib-art" data-art-wahl aria-haspopup="menu" ' +
            'aria-expanded="false"' + (zustand.art !== 'alle' ? ' data-gefiltert' : '') + '>' +
            '<span class="bib-pille-wort">' + esc(jetzt ? jetzt.name : 'Alle Arten') + '</span>' +
            '<span class="bib-pille-pfeil" data-sym="chevronD" aria-hidden="true"></span></button>';
    };
    const emptyLibrary = () => {
        const filtered = zustand.art !== 'alle';
        const favorites = zustand.reiter === 'favoriten';
        const recent = zustand.reiter === 'kuerzlich';
        const otherPlace = ['geteilt', 'privat', 'datenbank'].includes(zustand.reiter);
        const title = filtered ? 'Hier passt noch kein Dokument'
            : favorites ? 'Platz für deine Favoriten'
                : recent ? 'Noch nichts geöffnet'
                    : otherPlace ? 'Hier gibt es noch keine Dokumente' : 'Hier beginnt etwas Neues';
        const detail = filtered ? 'Wähle eine andere Art oder zeige wieder alle Dokumente an.'
            : favorites ? 'Mit dem Stern an einer Dokumentkarte findest du Wichtiges hier wieder.'
                : recent ? 'Öffne ein Dokument aus deiner Ablage. Hier findest du es anschliessend schnell wieder.'
                    : otherPlace ? 'Dieser Ort ist leer. Deine übrigen Dokumente findest du weiterhin in deiner Ablage.'
                        : 'Lege deine erste Seite an. Notizen, PDFs und Ideen bleiben an einem Ort.';
        return '<section class="bib-leer" aria-label="Leere Bibliotheksansicht">' +
            '<span class="bib-empty-symbol" data-sym="' + (favorites ? 'star' : 'pages') + '" aria-hidden="true"></span>' +
            '<h2 class="bib-empty-title">' + title + '</h2><p>' + detail + '</p>' +
            (filtered ? '<button type="button" data-bib-reset>Alle Arten zeigen</button>'
                : (favorites || recent || otherPlace) ? '<button type="button" data-bib-home>Zur Ablage</button>'
                    : '<button type="button" data-neu-auf' + (!permitted('bearbeiten', zustand.ordner || undefined) ? ' disabled' : '') + '>Erste Seite erstellen</button>') +
            '</section>';
    };
    const zeichneDeckel = (wrap) => {
        const { liste: alle, gesamt } = auswahl();
        const liste = zustand.art === 'alle'
            ? alle : alle.filter(p => artVon(p).id === zustand.art);
        wrap.innerHTML =
            '<div class="bib bib-deckel-seite" data-bib-bereich>' +
                deckelKopf(alle, liste.length, zustand.art === 'alle' ? gesamt : liste.length) +
                (zustand.reiter === 'ablage'
                    ? '<div class="bib-ablage-layout">' +
                        '<details class="bib-ablage-baum" aria-label="Ablagebaum"' +
                        (Store.getMeta('bibBaumSichtbar', false) ? ' open' : '') + '>' +
                        '<summary class="bib-ablage-baum-kopf">Ordner & Seiten</summary>' +
                        '<div data-bib-baum></div>' +
                        '</details><div class="bib-ablage-inhalt">'
                    : '') +
                studioWeiter() + recentCarousel() +
                (liste.length
                    ? '<div class="bib-gitter">' + liste.map(deckelKarte).join('') + '</div>'
                    : emptyLibrary()) +
                (zustand.reiter === 'ablage' ? '</div></div>' : '') +
                sicherungsKarte() +
                '</div>';
        if (typeof Register !== 'undefined' && Register.symbole)
            Register.symbole.fuelle(wrap);
        binde(wrap);
        bibliothekBaumNachtragen(wrap);
        platzNachtragen(wrap);
        if (Vorschau.bilderNachtragen)
            Vorschau.bilderNachtragen(wrap);
    };
    const ortPille = (name, zahl = '', einheit = '') => '<button type="button" class="bib-pille bib-ort" data-orte aria-haspopup="menu" aria-expanded="false">' +
        '<span class="bib-pille-wort">' + esc(name) + '</span>' +
        (zahl ? '<span class="bib-pille-zahl">' + esc(zahl) +
            '<span class="bib-pille-einheit">' + esc(einheit) + '</span></span>' : '') +
        '<span class="bib-pille-pfeil" data-sym="chevronD" aria-hidden="true"></span></button>';
    const schulOrt = () => '<div class="bib-wahl school-ort" role="group" aria-label="Was die Bibliothek zeigt">' +
        ortPille(ORTE.find(o => o.id === 'schule')?.name || 'Ausbildung') + '</div>';
    const schulOrtBinden = (wrap) => {
        if (typeof Register !== 'undefined' && Register.symbole)
            Register.symbole.fuelle(wrap);
        wrap.querySelector('[data-orte]')?.addEventListener('click', ereignis => ortMenue(ereignis.currentTarget));
    };
    const deckelKopf = (alle, anzahl, gesamt = anzahl) => {
        const ort = ORTE.find(r => r.id === ortAktiv())?.name || 'Alle';
        const satz = umfangSatz(anzahl, gesamt, 'Dokument', 'Dokumente', 'Dokumenten');
        const schnitt = satz.lastIndexOf(' ');
        const satzZahl = schnitt > 0 ? satz.slice(0, schnitt) : satz;
        const satzEinheit = schnitt > 0 ? satz.slice(schnitt) : '';
        const weg = zustand.reiter === 'ablage' ? ordnerWeg() : [];
        const hier = weg.length ? String(weg[weg.length - 1].text || 'Ohne Titel') : 'Dokumente';
        return '<header class="bib-dkopf">' +
            ordnerKrume() +
            '<div class="bib-workspace-intro"><span class="bib-workspace-eyebrow">Dein Arbeitsbereich</span>' +
            '<h1>' + esc(hier) + '</h1></div>' +
            '<div class="bib-workspace-actions">' +
            '<button type="button" class="bib-search" data-bib-search aria-label="Dokumente durchsuchen">' +
            '<span data-sym="search" aria-hidden="true"></span><span>Suchen</span></button>' +
            '<button class="bib-neu" data-neu-auf>' +
            '<b aria-hidden="true">+</b><span>Neu</span></button>' +
            '<button class="bib-studio-import" data-studio-import' +
            (pdfImportLaeuft || !permitted('bearbeiten', zustand.ordner || undefined)
                ? ' disabled title="Import läuft oder Bearbeitungsrechte fehlen"' : '') +
            '><span data-sym="plus" aria-hidden="true"></span>' +
            '<span class="wort">' + IMPORT_WORT + '</span></button></div>' +
            '<div class="bib-wahl" role="group" aria-label="Was die Bibliothek zeigt">' +
            ortPille(ort, ' \u00b7 ' + satzZahl, satzEinheit) +
            artPille(alle) +
            '<button type="button" class="bib-form-knopf" data-form-wahl aria-haspopup="menu" aria-expanded="false" ' +
            'aria-label="Darstellung: ' + esc(FORMEN.find(f => f.id === form())?.name || '') + '" ' +
            'title="Darstellung: ' + esc(FORMEN.find(f => f.id === form())?.name || '') + '">' +
            '<span data-sym="' + (FORMEN.find(f => f.id === form())?.zeichen || 'pages') + '" aria-hidden="true"></span></button>' +
            '</div>' +
            '</header>';
    };
    const zeichneRegal = (wrap) => {
        const { liste: alle, gesamt } = auswahl();
        const liste = zustand.art === 'alle' ? alle : alle.filter(p => artVon(p).id === zustand.art);
        const regal = hefte(liste);
        const hand = liste.slice()
            .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))
            .slice(0, 4);
        wrap.innerHTML =
            '<div class="bib bib-regal-seite" data-bib-bereich>' +
                bibKopf(liste, alle, gesamt) +
                (regal.length
                    ? '<div class="bib-regal">' + regal.map(heftKarte).join('') + '</div>'
                    : emptyLibrary()) +
                (hand.length > 1
                    ? '<section class="bib-abschnitt"><header><h2>Zuletzt in der Hand</h2>' +
                        '<p>heftübergreifend</p></header>' +
                        '<div class="bib-hand-reihe">' + hand.map(handKarte).join('') + '</div></section>'
                    : '') +
                sicherungsKarte() +
                '</div>';
        if (typeof Register !== 'undefined' && Register.symbole)
            Register.symbole.fuelle(wrap);
        binde(wrap);
        platzNachtragen(wrap);
    };
    const pilleFokus = (wahl) => {
        requestAnimationFrame(() => document.querySelector('.bib ' + wahl)?.focus({ preventScroll: true }));
    };
    const markeImMenue = (m) => {
        if (typeof SelectionFlow === 'undefined')
            return;
        const gruppe = m.querySelector('[role="group"]');
        if (!gruppe)
            return;
        const auf = (b) => {
            const ziel = b ? b.closest('[data-wahl]') : null;
            if (ziel && gruppe.contains(ziel))
                SelectionFlow.highlight(gruppe, ziel, { still: true });
        };
        auf(gruppe.querySelector('[aria-current="true"]'));
        gruppe.addEventListener('focusin', e => auf(e.target instanceof Element ? e.target : null));
        gruppe.addEventListener('pointerover', e => auf(e.target instanceof Element ? e.target : null));
    };
    const ortZustand = (id) => {
        if (id === 'pdf') {
            zustand.reiter = 'alle';
            zustand.art = 'pdf';
        }
        else {
            zustand.reiter = ORTE.some(o => o.id === id) ? id : zustand.reiter;
            zustand.art = 'alle';
        }
        if (id === 'ablage') {
            zustand.ordner = null;
            if (typeof Store !== 'undefined' && Store.setMeta)
                Store.setMeta(ORDNER_SCHLUESSEL, '');
        }
    };
    const ortSetzen = (id) => {
        ortZustand(id);
        App.zeichneSeite();
    };
    const ortOeffnen = (id) => {
        ortZustand(id);
        oeffne();
    };
    const SAMMLUNG_ZEICHEN = {
        uebersicht: 'pages', bibliothek: 'library', datenbanken: 'database',
        whiteboards: 'pencil', wiki: 'graph', vorlagen: 'puzzle'
    };
    const ortMenue = (anker) => {
        const aktiv = ortAktiv();
        const sammlungen = typeof Arbeitswelt !== 'undefined' ? Arbeitswelt.sammlungen : [];
        const m = Menue.wahl({
            anker, titel: 'Ort',
            gruppen: [
                { name: 'Orte', optionen: ORTE.map(o => ({ id: o.id, name: o.name, zeichen: o.zeichen, aktiv: o.id === aktiv })) },
                ...(sammlungen.length ? [{ name: 'Sammlungen', optionen: sammlungen.map(a => ({ id: 'sammlung:' + a.id, name: a.name, zeichen: SAMMLUNG_ZEICHEN[a.id] || 'grid' })) }] : [])
            ],
            beiWahl: (id) => {
                if (id.startsWith('sammlung:')) {
                    if (typeof Arbeitswelt !== 'undefined')
                        Arbeitswelt.oeffnen(id.slice('sammlung:'.length));
                    return;
                }
                ortSetzen(id);
                pilleFokus('[data-orte]');
            }
        });
        markeImMenue(m);
    };
    const artMenue = (anker) => {
        const { liste: alle } = auswahl();
        Menue.wahl({
            anker, titel: 'Art',
            gruppen: [{ name: 'Arten', optionen: artenVon(alle).map(a => ({ id: a.id, name: a.name + ' \u00b7 ' + a.zahl, aktiv: a.id === zustand.art })) }],
            beiWahl: (id) => {
                zustand.art = ART_FILTER.some(a => a.id === id) ? id : 'alle';
                App.zeichneSeite();
                pilleFokus('[data-art-wahl]');
            }
        });
    };
    const formMenue = (anker) => {
        const jetzt = form();
        Menue.wahl({
            anker, titel: 'Darstellung',
            gruppen: [{ name: 'Darstellung', optionen: FORMEN.map(f => ({ id: f.id, name: f.name, zeichen: f.zeichen, aktiv: f.id === jetzt })) }],
            beiWahl: (id) => {
                const f = FORMEN.find(x => x.id === id);
                if (!f)
                    return;
                Store.setMeta('bibForm', f.id);
                App.zeichneSeite();
                pilleFokus('[data-form-wahl]');
            }
        });
    };
    const ortFuer = (p, anker) => ({ kontext: 'bibliothek', art: artVon(p).id, anker });
    const aktionenAnbringen = (wrap) => {
        const wurzel = wrap.querySelector('.bib');
        if (!wurzel || typeof Menue === 'undefined')
            return;
        const dingVon = (el) => Store.getBlock(el.dataset['id'] || el.dataset['rmoOpen'] || '');
        Menue.aktionenBinden(wurzel, {
            auswahl: '.bib-deckel[data-id], .bib-heft[data-id], .bib-hand[data-id], .bib-zeile[data-id], ' +
                '.rmo-recent-card[data-rmo-open]',
            oeffnen: (el, wo) => {
                const p = dingVon(el);
                if (!p)
                    return false;
                return !!Menue.aktionen(p, ortFuer(p, el), wo.tastatur ? { rueckfokus: el } : { x: wo.x ?? 0, y: wo.y ?? 0, rueckfokus: el });
            },
            entf: el => {
                const p = dingVon(el);
                return p ? Register.aktionen.taste('Entf', p, ortFuer(p, el)) : false;
            }
        });
    };
    const binde = (wrap) => {
        wrap.querySelector('[data-bib-search]')?.addEventListener('click', () => App.suche());
        wrap.querySelector('[data-bib-reset]')?.addEventListener('click', () => {
            zustand.art = 'alle';
            App.zeichneSeite();
            pilleFokus('[data-art-wahl], [data-orte]');
        });
        wrap.querySelector('[data-bib-home]')?.addEventListener('click', () => {
            ortSetzen('ablage');
            pilleFokus('[data-orte]');
        });
        wrap.querySelectorAll('[data-bib-favorite]').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.dataset['bibFavorite'] || '';
                const page = Store.getBlock(id);
                if (!page || !permitted('lesen', id))
                    return;
                const scroller = document.getElementById('scroll');
                const scrollTop = scroller?.scrollTop || 0;
                Register.aktionen.tun('favorit', page, ortFuer(page, button));
                requestAnimationFrame(() => {
                    if (scroller)
                        scroller.scrollTop = scrollTop;
                    const replacement = Array.from(document.querySelectorAll('.bib [data-bib-favorite]'))
                        .find(el => el.dataset['bibFavorite'] === id);
                    (replacement || document.querySelector('.bib [data-orte]'))?.focus({ preventScroll: true });
                });
            });
        });
        wrap.querySelectorAll('[data-rmo-open]').forEach(button => button.addEventListener('click', () => {
            const id = button.dataset.rmoOpen;
            if (id && permitted('lesen', id))
                App.oeffne(id);
        }));
        wrap.querySelector('.bib-ablage-baum')?.addEventListener('toggle', event => {
            Store.setMeta('bibBaumSichtbar', event.currentTarget.open);
        });
        wrap.querySelector('[data-studio-import]')?.addEventListener('click', pdfImportieren);
        wrap.querySelector('[data-studio-weiter]')?.addEventListener('click', event => {
            const id = event.currentTarget.dataset.studioWeiter;
            if (id && permitted('lesen', id))
                App.oeffne(id);
        });
        wrap.querySelector('[data-form-wahl]')?.addEventListener('click', ereignis => formMenue(ereignis.currentTarget));
        wrap.querySelectorAll('.bib-pflege [data-a]').forEach(b => b.addEventListener('click', ereignis => {
            ereignis.stopPropagation();
            if (b.dataset['a'] === 'papierkorb') {
                App.papierkorb();
                return;
            }
            void App.sicherungSpeichern();
        }));
        wrap.querySelectorAll('.bib-heft[data-id], .bib-hand[data-id]').forEach(k => k.addEventListener('click', () => {
            const id = k.dataset['id'];
            if (id)
                App.oeffne(id);
        }));
        wrap.querySelector('[data-art-wahl]')?.addEventListener('click', ereignis => artMenue(ereignis.currentTarget));
        wrap.querySelector('[data-orte]')?.addEventListener('click', ereignis => ortMenue(ereignis.currentTarget));
        wrap.querySelectorAll('[data-neu-auf]').forEach(b => b.addEventListener('click', () => App.erstellenBlatt(b)));
        wrap.querySelectorAll('[data-hoch]').forEach(b => b.addEventListener('click', () => geheHoch()));
        wrap.querySelectorAll('.bib-krume').forEach(krume => {
            krume.scrollLeft = krume.scrollWidth;
        });
        wrap.querySelectorAll('[data-ordner]').forEach(b => b.addEventListener('click', () => geheIn(b.dataset['ordner'] || null)));
        blickAnbringen(wrap);
        wrap.querySelectorAll('.bib-deckel[data-id]').forEach(k => {
            k.addEventListener('click', () => {
                const id = k.dataset['id'];
                if (!id)
                    return;
                if (zustand.reiter === 'ablage' && k.dataset['art'] === 'ordner') {
                    geheIn(id);
                    return;
                }
                App.oeffne(id);
            });
        });
        wrap.querySelectorAll('.bib-deckel-mehr[data-mehr-id]').forEach(knopf => knopf.addEventListener('click', ereignis => {
            ereignis.stopPropagation();
            const p = Store.getBlock(knopf.dataset['mehrId'] || '');
            if (!p)
                return;
            Menue.aktionen(p, ortFuer(p, knopf), { rueckfokus: knopf });
        }));
        aktionenAnbringen(wrap);
    };
    const zeichnen = (wrap) => {
        if (zustand.reiter === 'schule') {
            zeichneSchule(wrap);
            return;
        }
        if (form() === 'deckel') {
            zeichneDeckel(wrap);
            return;
        }
        if (form() === 'regal') {
            zeichneRegal(wrap);
            return;
        }
        const { liste: alle, gesamt } = auswahl();
        const liste = zustand.art === 'alle' ? alle : alle.filter(p => artVon(p).id === zustand.art);
        const spalten = SPALTEN.filter(s => zustand.spalten.includes(s.id));
        const raster = spalten.map(s => s.breit).join(' ');
        wrap.innerHTML =
            '<div class="bib" data-bib-bereich>' +
                bibKopf(liste, alle, gesamt) +
                '<div class="bib-kopf bib-kopf-liste">' +
                '<div class="bib-werkzeuge">' +
                '<button data-a="suche" title="Suchen" aria-label="Suchen">🔍</button>' +
                '<button data-a="spalten" title="Eigenschaften">⚙</button>' +
                '<button data-a="neu" class="prim">Neue Seite</button>' +
                '</div>' +
                '</div>' +
                `<div class="bib-tab" style="--bib-raster:${raster}">` +
                '<div class="bib-zeile bib-kopfzeile">' +
                spalten.map(s => `<div data-s="${s.id}"><span>${s.icon}</span>${esc(s.name)}` +
                    (zustand.sortier === s.id ? `<em>${zustand.richtung === 'auf' ? '↑' : '↓'}</em>` : '') +
                    '</div>').join('') +
                '</div>' +
                (liste.length
                    ? liste.map(p => {
                        const q = quelleVon(p);
                        const kinder = Store.childrenOf(p.id)
                            .filter((k) => k.type === 'page' &&
                            (k.parentTable === 'collection'
                                ? collectionPermitted('lesen', k.parentId)
                                : permitted('lesen', k.id))).length;
                        const zellen = {
                            name: `<div class="bib-name">${kinder ? '<b class="bib-pfeil">▸</b>' : '<b class="bib-pfeil leer"></b>'}` +
                                `<span class="bib-ico">${p.icon || (p.parentTable === 'collection' ? '▦' : '📄')}</span>` +
                                `<span class="bib-txt">${esc(p.text || 'Ohne Titel')}</span></div>`,
                            von: `<div class="bib-person"><span class="bib-kreis">` +
                                `${esc((p.erstelltVon || 'Ich').slice(0, 1).toUpperCase())}</span>` +
                                `${esc(p.erstelltVon || 'Ich')}</div>`,
                            quelle: `<div class="bib-quelle"><span>${q.icon}</span>${esc(q.text)}</div>`,
                            wann: `<div class="bib-wann">${esc(wannText(p.edited || p.created))}</div>`
                        };
                        return `<div class="bib-zeile" data-id="${p.id}" data-art="${artVon(p).id}">` +
                            spalten.map(s => zellen[s.id]).join('') + '</div>';
                    }).join('')
                    : emptyLibrary()) +
                '</div>' +
                `<div class="bib-fuss">${liste.length} ${liste.length === 1 ? 'Seite' : 'Seiten'}</div>` +
                '</div>';
        if (typeof Register !== 'undefined' && Register.symbole)
            Register.symbole.fuelle(wrap);
        binde(wrap);
        wrap.querySelectorAll('.bib-kopfzeile [data-s]').forEach((d) => d.addEventListener('click', () => {
            if (zustand.sortier === d.dataset.s)
                zustand.richtung = zustand.richtung === 'auf' ? 'ab' : 'auf';
            else {
                zustand.sortier = d.dataset.s;
                zustand.richtung = 'auf';
            }
            App.zeichneSeite();
        }));
        wrap.querySelectorAll('.bib-zeile[data-id]').forEach((z) => z.addEventListener('click', () => {
            if (zustand.reiter === 'ablage' && z.dataset.art === 'ordner') {
                geheIn(z.dataset.id);
                return;
            }
            App.oeffne(z.dataset.id);
        }));
        wrap.querySelectorAll('.bib-werkzeuge button').forEach((b) => b.addEventListener('click', () => {
            const a = b.dataset.a;
            if (a === 'neu') {
                if (!permitted('bearbeiten')) {
                    UI.toast('Du darfst hier keine neue Seite anlegen.');
                    return;
                }
                const p = Store.addPage(null, { text: '' });
                App.oeffne(p.id);
                setTimeout(() => document.getElementById('title')?.focus(), 60);
            }
            if (a === 'suche')
                App.suche();
            if (a === 'spalten') {
                const r = b.getBoundingClientRect();
                const m = UI.menu('<div class="grp">Eigenschaften</div>' +
                    SPALTEN.map(s => `<button data-x="${s.id}"><span class="mi">${s.icon}</span>${esc(s.name)}` +
                        `<span class="ms">${zustand.spalten.includes(s.id) ? 'an' : 'aus'}</span></button>`).join(''), r.left - 160, r.bottom + 4);
                m.addEventListener('click', ev => {
                    const x = elVon(ev)?.closest('[data-x]');
                    if (!x)
                        return;
                    const sid = x.dataset.x;
                    if (!sid || sid === 'name')
                        return;
                    zustand.spalten = zustand.spalten.includes(sid)
                        ? zustand.spalten.filter(y => y !== sid)
                        : [...zustand.spalten, sid];
                    m.remove();
                    App.zeichneSeite();
                });
            }
        }));
    };
    const oeffne = (ordnerId) => {
        try {
            Seitenleiste.reiter('dokumente');
        }
        catch { }
        if (ordnerId !== undefined) {
            zustand.reiter = 'ablage';
            zustand.art = 'alle';
            zustand.ordner = ordnerId || null;
            if (typeof Store !== 'undefined' && Store.setMeta)
                Store.setMeta(ORDNER_SCHLUESSEL, zustand.ordner || '');
        }
        else if (zustand.reiter === 'ablage' && zustand.ordner === null) {
            zustand.ordner = ordnerLesen();
        }
        App.zeigeSonder('Dokumente', zeichnen);
    };
    const alleZeigen = () => {
        try {
            Seitenleiste.reiter('dokumente');
        }
        catch { }
        zustand.reiter = 'alle';
        zustand.art = 'alle';
        App.zeigeSonder('Alle Seiten', zeichnen);
    };
    const quellenLesen = () => Store.getMeta('aufgabenQuellen', null);
    const moegliche = () => Object.values(Store.cache.collections).filter(c => {
        if (!collectionPermitted('lesen', c.id))
            return false;
        if (c.istAufgaben)
            return true;
        const t = Object.values(c.schema || {}).map(d => d.type);
        return t.includes('checkbox') || t.includes('status');
    });
    const meineAufgaben = () => {
        const konto = typeof Konten !== 'undefined' && Konten.aktiv ? Konten.aktiv() : null;
        const meinName = (konto && konto.name) || 'Ich';
        const gewaehlt = quellenLesen();
        const quellen = moegliche().filter(c => !gewaehlt || gewaehlt.includes(c.id));
        const raus = [];
        quellen.forEach(coll => {
            const schema = coll.schema || {};
            const personKey = Object.keys(schema).find(k => schema[k].type === 'person');
            const statusKey = Object.keys(schema).find(k => schema[k].type === 'status');
            const hakenKey = Object.keys(schema).find(k => schema[k].type === 'checkbox');
            const datumKey = Object.keys(schema).find(k => schema[k].type === 'date');
            const titelKey = Object.keys(schema).find(k => schema[k].type === 'title') || 'name';
            Store.rowsOf(coll.id).forEach((row) => {
                const pr = row.props || {};
                const wer = personKey ? String(pr[personKey] || '').trim() : '';
                const meins = !wer || wer.toLowerCase().includes(meinName.toLowerCase());
                if (!meins)
                    return;
                const fertig = hakenKey ? !!pr[hakenKey]
                    : statusKey ? /fertig|erledigt|done|abgeschlossen/i.test(String(pr[statusKey] || '')) : false;
                raus.push({
                    id: row.id, coll,
                    pageId: collectionPageId(coll.id),
                    titel: pr[titelKey] || row.text || 'Ohne Titel',
                    status: statusKey ? (pr[statusKey] || '—') : (fertig ? 'Fertig' : 'Offen'),
                    datum: datumKey ? pr[datumKey] : '',
                    fertig, hakenKey, statusKey,
                    bearbeitbar: collectionPermitted('bearbeiten', coll.id)
                });
            });
        });
        raus.sort((a, b) => (a.fertig ? 1 : 0) - (b.fertig ? 1 : 0) ||
            String(a.datum || '9999').localeCompare(String(b.datum || '9999')));
        return raus;
    };
    let aZustand = { nurOffen: false, sortier: 'datum', suche: '', sucheOffen: false };
    const zeichneAufgaben = (wrap) => {
        let liste = meineAufgaben();
        if (aZustand.nurOffen)
            liste = liste.filter(a => !a.fertig);
        if (aZustand.suche) {
            const s = aZustand.suche.toLowerCase();
            liste = liste.filter(a => a.titel.toLowerCase().includes(s));
        }
        if (aZustand.sortier === 'titel')
            liste = [...liste].sort((a, b) => a.titel.localeCompare(b.titel));
        if (aZustand.sortier === 'datenbank')
            liste = [...liste].sort((a, b) => a.coll.name.localeCompare(b.coll.name));
        const offen = liste.filter(a => !a.fertig);
        const fertig = liste.filter(a => a.fertig);
        wrap.innerHTML =
            '<div class="bib">' +
                '<h1 class="bib-titel">Meine Aufgaben</h1>' +
                '<div class="bib-kopf">' +
                '<div class="bib-reiter">' +
                '<button class="on"><span>☑</span>Meine Aufgaben</button>' +
                '</div>' +
                '<div class="bib-werkzeuge">' +
                `<button data-a="afilter" title="Filtern"${aZustand.nurOffen ? ' class="an"' : ''}>⚟</button>` +
                '<button data-a="asort" title="Sortieren">↕</button>' +
                '<button data-a="asuche" title="Suchen">🔍</button>' +
                '<button data-a="quellen" title="Aufgabenquellen">⚙</button>' +
                '<button data-a="neu" class="prim">Neue Aufgabe</button>' +
                '</div>' +
                '</div>' +
                (aZustand.sucheOffen
                    ? `<div class="bib-suchzeile">🔍 <input id="auf-suche" value="${esc(aZustand.suche)}" ` +
                        'placeholder="Aufgaben durchsuchen …"><button data-a="asuchzu">✕</button></div>' : '') +
                (liste.length
                    ? '<div class="auf-liste">' +
                        (offen.length ? `<div class="auf-grp">Offen <em>${offen.length}</em></div>` : '') +
                        offen.map(a => zeileHtml(a)).join('') +
                        (fertig.length ? `<div class="auf-grp">Erledigt <em>${fertig.length}</em></div>` : '') +
                        fertig.map(a => zeileHtml(a)).join('') +
                        '</div>'
                    : '<div class="auf-leer">' +
                        '<div class="auf-leer-ico">☑</div>' +
                        '<div>Hier findest du alle dir zugewiesenen Aufgaben.</div>' +
                        '<button data-a="quellen" class="auf-link">Aufgabenquellen konfigurieren</button>' +
                        '</div>') +
                '</div>';
        wrap.querySelectorAll('[data-a="quellen"]').forEach((b) => b.addEventListener('click', quellenDialog));
        wrap.querySelector('[data-a="afilter"]')?.addEventListener('click', (e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const m = UI.menu('<div class="grp">Zeigen</div>' +
                `<button data-x="alle">Alle Aufgaben${aZustand.nurOffen ? '' : '<span class="ms">✓</span>'}</button>` +
                `<button data-x="offen">Nur offene${aZustand.nurOffen ? '<span class="ms">✓</span>' : ''}</button>`, r.left - 130, r.bottom + 4);
            m.addEventListener('click', ev => {
                const x = elVon(ev)?.closest('[data-x]');
                if (!x)
                    return;
                aZustand.nurOffen = x.dataset.x === 'offen';
                m.remove();
                App.zeichneSeite();
            });
        });
        wrap.querySelector('[data-a="asort"]')?.addEventListener('click', (e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const m = UI.menu('<div class="grp">Sortieren nach</div>' +
                [['datum', 'Frist'], ['titel', 'Name'], ['datenbank', 'Datenbank']].map(([id, n]) => `<button data-x="${id}">${n}${aZustand.sortier === id ? '<span class="ms">✓</span>' : ''}</button>`).join(''), r.left - 130, r.bottom + 4);
            m.addEventListener('click', ev => {
                const x = elVon(ev)?.closest('[data-x]');
                if (!x)
                    return;
                aZustand.sortier = x.dataset.x ?? aZustand.sortier;
                m.remove();
                App.zeichneSeite();
            });
        });
        wrap.querySelector('[data-a="asuche"]')?.addEventListener('click', () => {
            aZustand.sucheOffen = true;
            App.zeichneSeite();
            document.getElementById('auf-suche')?.focus();
        });
        wrap.querySelector('[data-a="asuchzu"]')?.addEventListener('click', () => {
            aZustand.suche = '';
            aZustand.sucheOffen = false;
            App.zeichneSeite();
        });
        const si2 = wrap.querySelector('#auf-suche');
        if (si2)
            si2.addEventListener('input', () => {
                aZustand.suche = si2.value;
                const stelle = si2.selectionStart;
                App.zeichneSeite();
                const neu = document.getElementById('auf-suche');
                if (neu) {
                    neu.focus();
                    neu.setSelectionRange(stelle, stelle);
                }
            });
        wrap.querySelector('[data-a="neu"]')?.addEventListener('click', () => {
            const dbs = moegliche().filter(coll => collectionPermitted('bearbeiten', coll.id));
            if (!dbs.length) {
                UI.toast('Keine bearbeitbare Aufgabendatenbank verfügbar.');
                return;
            }
            const coll = dbs[0];
            const row = Store.addRow(coll.id, {});
            App.oeffne(row.id);
        });
        wrap.querySelectorAll('.auf-zeile').forEach((z) => {
            z.querySelector('.auf-haken')?.addEventListener('click', (e) => {
                e.stopPropagation();
                const a = liste.find(x => x.id === z.dataset.id);
                if (!a)
                    return;
                if (!a.bearbeitbar || !permitted('bearbeiten', a.pageId)) {
                    UI.toast('Du darfst diese Aufgabe nicht ändern.');
                    return;
                }
                const row = Store.getBlock(a.id);
                const props = { ...(row.props || {}) };
                if (a.hakenKey)
                    props[a.hakenKey] = !a.fertig;
                else if (a.statusKey)
                    props[a.statusKey] = a.fertig ? 'Offen' : 'Fertig';
                Store.updateBlock(a.id, { props });
                App.zeichneSeite();
            });
            z.addEventListener('click', () => App.oeffne(z.dataset.id));
        });
    };
    const zeileHtml = (a) => `<div class="auf-zeile${a.fertig ? ' fertig' : ''}" data-id="${a.id}">` +
        `<button class="auf-haken"${a.bearbeitbar ? '' : ' disabled title="Nur Leserechte"'}>` +
        `${a.fertig ? '☑' : '☐'}</button>` +
        `<span class="auf-titel">${esc(a.titel)}</span>` +
        `<span class="auf-db">▦ ${esc(a.coll.name)}</span>` +
        (a.datum ? `<span class="auf-datum">${esc(String(a.datum).slice(0, 10))}</span>` : '') +
        `<span class="auf-status">${esc(a.status)}</span>` +
        '</div>';
    const quellenDialog = () => {
        const dbs = moegliche();
        const gewaehlt = quellenLesen();
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder">' +
                '<div class="fh">Aufgabenquellen<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res" style="padding:6px">' +
                (dbs.length
                    ? dbs.map(c => {
                        const an = !gewaehlt || gewaehlt.includes(c.id);
                        return `<button data-c="${c.id}"><span>▦</span>` +
                            `<span style="flex:1">${esc(c.name)}</span>` +
                            `<span class="pth">${an ? 'zählt mit' : 'aus'}</span></button>`;
                    }).join('')
                    : '<div style="padding:16px;color:var(--text-faint);font-size:14px">' +
                        'Noch keine Datenbank mit Status oder Kontrollkästchen.</div>') +
                '</div>' +
                '<div class="hint">Eine Zeile gilt als deine Aufgabe, wenn eine Person-Spalte auf ' +
                'dich zeigt — oder, wenn es keine gibt, wenn du sie angelegt hast.</div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const b = elVon(e)?.closest('[data-c]');
            if (!b)
                return;
            if (!permitted('bearbeiten')) {
                UI.toast('Du darfst die Aufgabenquellen nicht ändern.');
                return;
            }
            const alle = dbs.map(c => c.id);
            const jetzt = quellenLesen() || alle;
            const neu = jetzt.includes(b.dataset.c) ? jetzt.filter((x) => x !== b.dataset.c) : [...jetzt, b.dataset.c];
            Store.setMeta('aufgabenQuellen', neu);
            o.remove();
            quellenDialog();
            App.zeichneSeite();
        });
    };
    const aufgaben = () => App.zeigeSonder('Meine Aufgaben', zeichneAufgaben);
    if (typeof Register !== 'undefined' && Register.aktionen) {
        const R = Register.aktionen;
        const ordnerHier = (o) => o.kontext === 'bibliothek' && o.art === 'ordner';
        R.melde({ id: 'hinein', name: 'Öffnen', zeichen: 'arrowR', gruppe: 'oeffnen', rang: 10,
            gilt: (_p, o) => ordnerHier(o),
            tun: (p) => { geheIn(p.id); } });
        R.melde({ id: 'als-seite', name: 'Als Seite bearbeiten', zeichen: 'page', gruppe: 'oeffnen', rang: 20,
            gilt: (_p, o) => ordnerHier(o),
            tun: (p) => App.oeffne(p.id) });
        R.melde({ id: 'blick', name: 'Blick hinein', zeichen: 'eye', gruppe: 'oeffnen', rang: 30,
            gilt: (p, o) => ordnerHier(o) ||
                (o.kontext === 'notizhefte' && typeof Notebook !== 'undefined' && Notebook.istFach(p)),
            tun: (p, o) => {
                const r = o.anker && o.anker.isConnected ? o.anker.getBoundingClientRect()
                    : new DOMRect(innerWidth / 2, innerHeight / 3, 0, 0);
                if (o.hinein)
                    blickHinein(p, r, false, o.hinein);
                else
                    blickHinein(p, r);
            } });
    }
    if (typeof Register !== 'undefined' && Register.navigation?.meldeZiele) {
        const imRegal = () => {
            try {
                return App.schauplatz() === 'bibliothek' && !!document.querySelector('#scroll .bib-ort');
            }
            catch {
                return false;
            }
        };
        Register.navigation.meldeZiele('dokumente', () => {
            const liste = ORTE.filter(o => typeof o.zielRang === 'number').map(o => ({
                id: o.id, name: o.name, ...(o.kurz ? { kurz: o.kurz } : {}), zeichen: o.zeichen,
                rang: o.zielRang, ort: true,
                an: () => imRegal() && ortAktiv() === o.id,
                tun: () => ortOeffnen(o.id)
            }));
            const heft = Register.navigation.eines?.('app-notizhefte');
            if (heft && typeof heft.tun === 'function')
                liste.push({
                    id: 'notizhefte', name: heft.name, zeichen: heft.zeichen, rang: 5, ort: true,
                    zeigen: () => typeof Notebook !== 'undefined' && typeof Notebook.oeffnen === 'function',
                    an: () => { try {
                        return App.schauplatz() === 'notizhefte';
                    }
                    catch {
                        return false;
                    } },
                    tun: () => heft.tun()
                });
            return liste;
        });
    }
    return { oeffne, alleZeigen, aufgaben, meineAufgaben, quellenDialog, alleSeiten, quelleVon, suchBereich,
        pdfImportieren, wannText, umfangSatz, DECKE_KUERZLICH,
        blickKnopf, mitBlick, blickAnbringen, blickHinein };
})();
window.Bibliothek = Bibliothek;
if (typeof Register !== 'undefined' && Register.kontext) {
    const K = Register.kontext;
    K.melde({ bereich: 'bibliothek', id: 'uebersicht', name: 'Übersicht',
        zeichen: 'library', rang: 10, tun: () => Bibliothek.oeffne() });
    K.melde({ bereich: 'bibliothek', id: 'notizhefte', name: 'Notizhefte',
        zeichen: 'book', rang: 20,
        zeigen: () => typeof Notebook !== 'undefined' && !!Notebook.oeffnen,
        tun: () => Notebook.oeffnen() });
    K.melde({ bereich: 'bibliothek', id: 'aufgaben', name: 'Meine Aufgaben',
        zeichen: 'tasks', rang: 30, tun: () => Bibliothek.aufgaben() });
    K.melde({ bereich: 'bibliothek', id: 'alle', name: 'Alle Seiten',
        zeichen: 'pages', rang: 40, tun: () => Bibliothek.alleZeigen() });
    K.melde({ bereich: 'bibliothek', id: 'suche', name: 'Suchen',
        zeichen: 'search', rang: 50, tun: () => App.suche() });
    K.melde({ bereich: 'bibliothek', id: 'zuletzt', name: 'Zuletzt geöffnet',
        zeichen: 'history', rang: 60,
        liefern: () => {
            let letzte = [];
            try {
                letzte = App.kuerzlich() || [];
            }
            catch {
                letzte = [];
            }
            if (!letzte.length)
                return [{ id: 'keine', name: 'Noch nichts geöffnet.',
                        tun: () => { } }];
            return letzte.map((b) => ({
                id: 'z-' + b.id, name: String(b.text || 'Ohne Titel'), zeichen: 'page',
                tun: () => { try {
                    App.oeffne(b.id);
                }
                catch { } }
            }));
        }
    });
}
