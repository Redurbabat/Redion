"use strict";
/* ============================================================================
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/wissen/bibliothek.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/wissen/bibliothek.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * ==========================================================================*/
/* ==========================================================================
 * bibliothek.js — Bibliothek, Meine Aufgaben, Marktplatz
 *
 * Notion hat unten in der Seitenleiste einen eigenen Abschnitt: Bibliothek,
 * Meine Aufgaben, Marktplatz, Hilfe, Papierkorb. Die ersten beiden sind
 * vollwertige Seiten — keine Fenster. Genau so ist es hier gebaut.
 *
 * Bibliothek      alle Seiten in einer Tabelle, mit Reitern und Sortierung
 * Meine Aufgaben  alles, was dem angemeldeten Konto zugewiesen ist,
 *                 quer über alle Datenbanken hinweg
 * ========================================================================*/
const Bibliothek = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const rightsActive = () => typeof Konten !== 'undefined' && typeof Konten.darf === 'function';
    const permitted = (action, pageId) => !rightsActive() || (pageId ? Konten.darf(action, pageId) : Konten.darf(action));
    /** Die kanonische Datenbankseite, nicht eine verknüpfte Zweitansicht. */
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
    /* ------------------------------------------------------------------ *
     * Hilfen
     * ------------------------------------------------------------------ */
    /** Alle echten Seiten — ohne Systemseiten, ohne Papierkorb. */
    const alleSeiten = () => Object.values(Store.cache.blocks)
        .filter(b => b.type === 'page' && b.alive !== false && !b.system &&
        (b.parentTable === 'collection'
            ? collectionPermitted('lesen', b.parentId)
            : permitted('lesen', b.id)));
    /** Woher kommt die Seite: aus einer Datenbank, aus einem Bereich, privat? */
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
    /** Zeitstempel als Zahl — egal ob ISO-Text oder Millisekunden. */
    const zeitZahl = (wann) => {
        if (!wann)
            return 0;
        const ms = typeof wann === 'number' ? wann : Date.parse(String(wann));
        return isNaN(ms) ? 0 : ms;
    };
    const wannText = (wann) => {
        if (!wann)
            return '—';
        /* Zeitstempel liegen als ISO-Text vor, nicht als Zahl. */
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
    /* ------------------------------------------------------------------ *
     * BIBLIOTHEK
     * ------------------------------------------------------------------ */
    const REITER = [
        { id: 'kuerzlich', icon: '🕘', name: 'Kürzlich verwendet' },
        { id: 'favoriten', icon: '☆', name: 'Favoriten' },
        { id: 'geteilt', icon: '👥', name: 'Geteilt' },
        { id: 'privat', icon: '🔒', name: 'Privat' },
        { id: 'schule', icon: '🎓', name: 'Ausbildung' },
        { id: 'datenbank', icon: '▦', name: 'In Datenbanken' },
        { id: 'alle', icon: '▤', name: 'Alle' }
    ];
    const SPALTEN = [
        { id: 'name', icon: '📄', name: 'Seitenbezeichnung', breit: '2fr' },
        { id: 'von', icon: '👤', name: 'Erstellt von', breit: '1fr' },
        { id: 'quelle', icon: '📍', name: 'Quelle', breit: '1.2fr' },
        { id: 'wann', icon: '🕘', name: 'Zuletzt bearbeitet', breit: '1fr' }
    ];
    let zustand = { reiter: 'kuerzlich', sortier: 'wann', richtung: 'ab',
        suche: '', sucheOffen: false, spalten: SPALTEN.map(s => s.id) };
    /** Eine zusammengefuehrte Sicht auf bestehende Redion-Daten. Sie speichert
        weder Dashboard-Karten noch PDF-Kopien; alle Listen sind begrenzt. */
    const zeichneSchule = (wrap) => {
        const blocks = Object.values(Store.cache.blocks);
        const root = blocks.find(block => block?.alive !== false && block.type === 'page' &&
            (block.schoolRoot === true || block.systemRole === 'school-root') && permitted('lesen', block.id));
        if (!root) {
            wrap.innerHTML = '<div class="school-home school-empty"><div class="school-empty-icon">🎓</div>' +
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
            '<div class="school-home">' +
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
    };
    const gefiltert = () => {
        const alle = alleSeiten();
        const freigaben = (p) => {
            if (typeof Konten === 'undefined' || !Konten.freigabenVon)
                return false;
            const entries = Konten.freigabenVon(p.id) || {};
            return Array.isArray(entries) ? entries.length > 0 : Object.keys(entries).length > 0;
        };
        let liste = alle;
        if (zustand.reiter === 'kuerzlich')
            liste = alle.filter(p => p.zuletztGeoeffnet || p.edited)
                .sort((a, b) => zeitZahl(b.zuletztGeoeffnet || b.edited) -
                zeitZahl(a.zuletztGeoeffnet || a.edited))
                .slice(0, 60);
        if (zustand.reiter === 'favoriten')
            liste = alle.filter(p => p.favorite);
        if (zustand.reiter === 'geteilt')
            liste = alle.filter(p => freigaben(p) || p.oeffentlich);
        if (zustand.reiter === 'privat')
            liste = alle.filter(p => p.parentTable !== 'collection' && !p.bereich);
        if (zustand.reiter === 'datenbank')
            liste = alle.filter(p => p.parentTable === 'collection');
        if (zustand.suche) {
            const s = zustand.suche.toLowerCase();
            liste = liste.filter(p => (p.text || '').toLowerCase().includes(s));
        }
        if (zustand.reiter !== 'kuerzlich' || zustand.sortier !== 'wann') {
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
        return liste;
    };
    const zeichnen = (wrap) => {
        if (zustand.reiter === 'schule') {
            zeichneSchule(wrap);
            return;
        }
        const liste = gefiltert();
        const spalten = SPALTEN.filter(s => zustand.spalten.includes(s.id));
        const raster = spalten.map(s => s.breit).join(' ');
        wrap.innerHTML =
            '<div class="bib">' +
                '<h1 class="bib-titel">Bibliothek</h1>' +
                '<div class="bib-kopf">' +
                '<div class="bib-reiter">' +
                REITER.slice(0, 4).map(r => `<button data-r="${r.id}" class="${zustand.reiter === r.id ? 'on' : ''}">` +
                    `<span>${r.icon}</span>${esc(r.name)}</button>`).join('') +
                `<button data-r="mehr" class="bib-mehr">${REITER.length - 4} mehr …</button>` +
                '</div>' +
                '<div class="bib-werkzeuge">' +
                '<button data-a="filter" title="Filtern">⚟</button>' +
                '<button data-a="suche" title="Suchen">🔍</button>' +
                '<button data-a="spalten" title="Eigenschaften">⚙</button>' +
                '<button data-a="neu" class="prim">Neue Seite</button>' +
                '</div>' +
                '</div>' +
                (zustand.sucheOffen
                    ? `<div class="bib-suchzeile">🔍 <input id="bib-suche" value="${esc(zustand.suche)}" ` +
                        'placeholder="Seiten durchsuchen …"><button data-a="suchzu">✕</button></div>' : '') +
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
                        return `<div class="bib-zeile" data-id="${p.id}">` +
                            spalten.map(s => zellen[s.id]).join('') + '</div>';
                    }).join('')
                    : '<div class="bib-leer">Hier ist noch nichts. Seiten erscheinen automatisch.</div>') +
                '</div>' +
                `<div class="bib-fuss">${liste.length} ${liste.length === 1 ? 'Seite' : 'Seiten'}</div>` +
                '</div>';
        /* Reiter */
        wrap.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
            if (b.dataset.r === 'mehr') {
                const r = b.getBoundingClientRect();
                const m = UI.menu(REITER.slice(4).map(x => `<button data-x="${x.id}"><span class="mi">${x.icon}</span>${esc(x.name)}</button>`).join(''), r.left, r.bottom + 4);
                m.addEventListener('click', ev => {
                    const x = elVon(ev)?.closest('[data-x]');
                    if (!x)
                        return;
                    zustand.reiter = x.dataset.x ?? zustand.reiter;
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            zustand.reiter = b.dataset.r;
            App.zeichneSeite();
        }));
        /* Sortieren durch Klick auf den Spaltenkopf */
        wrap.querySelectorAll('.bib-kopfzeile [data-s]').forEach((d) => d.addEventListener('click', () => {
            if (zustand.sortier === d.dataset.s)
                zustand.richtung = zustand.richtung === 'auf' ? 'ab' : 'auf';
            else {
                zustand.sortier = d.dataset.s;
                zustand.richtung = 'auf';
            }
            App.zeichneSeite();
        }));
        /* Zeile öffnen */
        wrap.querySelectorAll('.bib-zeile[data-id]').forEach((z) => z.addEventListener('click', () => App.oeffne(z.dataset.id)));
        /* Werkzeuge */
        wrap.querySelectorAll('.bib-werkzeuge button, [data-a="suchzu"]').forEach((b) => b.addEventListener('click', () => {
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
            if (a === 'suche') {
                zustand.sucheOffen = true;
                App.zeichneSeite();
                document.getElementById('bib-suche')?.focus();
            }
            if (a === 'suchzu') {
                zustand.suche = '';
                zustand.sucheOffen = false;
                App.zeichneSeite();
            }
            if (a === 'filter') {
                const r = b.getBoundingClientRect();
                const m = UI.menu('<div class="grp">Nur zeigen</div>' +
                    REITER.map(x => `<button data-x="${x.id}"><span class="mi">${x.icon}</span>${esc(x.name)}` +
                        (zustand.reiter === x.id ? '<span class="ms">✓</span>' : '') + '</button>').join(''), r.left - 160, r.bottom + 4);
                m.addEventListener('click', ev => {
                    const x = elVon(ev)?.closest('[data-x]');
                    if (!x)
                        return;
                    zustand.reiter = x.dataset.x ?? zustand.reiter;
                    m.remove();
                    App.zeichneSeite();
                });
            }
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
                        return; /* Der Name bleibt */
                    zustand.spalten = zustand.spalten.includes(sid)
                        ? zustand.spalten.filter(y => y !== sid)
                        : [...zustand.spalten, sid];
                    m.remove();
                    App.zeichneSeite();
                });
            }
        }));
        const si = document.getElementById('bib-suche');
        if (si) {
            si.addEventListener('input', () => {
                zustand.suche = si.value;
                const stelle = si.selectionStart;
                App.zeichneSeite();
                const neu = document.getElementById('bib-suche');
                if (neu) {
                    neu.focus();
                    neu.setSelectionRange(stelle, stelle);
                }
            });
        }
    };
    const oeffne = () => App.zeigeSonder('Bibliothek', zeichnen);
    /* ------------------------------------------------------------------ *
     * MEINE AUFGABEN
     *
     * Notion sammelt hier alle Zeilen, in denen eine Person-Eigenschaft auf
     * dich zeigt und ein Status/Kontrollkästchen offen ist. Welche Datenbanken
     * dazugehören, lässt sich einstellen — genau das macht
     * „Aufgabenquellen konfigurieren".
     * ------------------------------------------------------------------ */
    const quellenLesen = () => Store.getMeta('aufgabenQuellen', null);
    /**
     * Alle Datenbanken, die als Aufgabenquelle taugen. Wurde eine ausdrücklich
     * „In Aufgaben umgewandelt", zählt sie in jedem Fall — das ist Notions
     * eigener Schalter unter Weitere Einstellungen.
     */
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
                /* Ohne Person-Spalte gilt: was ich angelegt habe, ist meins. */
                const meins = personKey
                    ? String(pr[personKey] || '').toLowerCase().includes(meinName.toLowerCase())
                    : (row.erstelltVon || 'Ich') === meinName;
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
    /* Filter, Sortierung und Suche der Aufgabenseite */
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
    return { oeffne, aufgaben, meineAufgaben, quellenDialog, alleSeiten, quelleVon, wannText };
})();
window.Bibliothek = Bibliothek;
