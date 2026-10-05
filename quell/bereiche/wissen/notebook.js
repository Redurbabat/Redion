"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/notebook.ts (npm run bauen:ts). */
const Notebook = (() => {
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const REITER = ['dokumente', 'favoriten', 'papierkorb'];
    const gemerkterReiter = () => {
        const w = String(Store.getMeta('heft:reiter', '') || '');
        return REITER.includes(w) ? w : 'dokumente';
    };
    const gemerktesFach = () => {
        const id = String(Store.getMeta('heft:fach', '') || '');
        if (!id)
            return null;
        const p = Store.getBlock(id);
        if (!p || p.alive === false || !istFach(p)) {
            Store.setMeta('heft:fach', '');
            return null;
        }
        return id;
    };
    let searchText = '';
    let shelfRoot = null;
    let tab = 'dokumente';
    let fachId = null;
    const heftArtig = (p) => {
        if (!p || p.type !== 'page' || p.system)
            return false;
        if (p.locked)
            return p.heftArt === 'heft';
        const kinder = Store.childrenOf(p.id);
        if (kinder.some((k) => k.type === 'pdfseite'))
            return false;
        return kinder.some((k) => k.type === 'blatt');
    };
    const isNotebook = (p) => !!p && p.alive !== false && heftArtig(p);
    const FACH_TIEFE = 12;
    const istFach = (p, tiefe = 0, gesehen) => {
        if (!p || p.type !== 'page' || p.alive === false || p.system || p.locked)
            return false;
        const kinder = Store.childrenOf(p.id);
        if (kinder.some((k) => k.type === 'blatt' || k.type === 'pdfseite'))
            return false;
        if (p.heftArt === 'fach')
            return true;
        if (kinder.some(isNotebook))
            return true;
        if (tiefe >= FACH_TIEFE)
            return false;
        const weg = gesehen || new Set();
        if (weg.has(p.id))
            return false;
        weg.add(p.id);
        return kinder.some((k) => istFach(k, tiefe + 1, weg));
    };
    const faecherMerken = () => {
        Object.values(Store.cache.blocks).forEach(p => {
            if (!p || p.heftArt === 'fach' || !istFach(p))
                return;
            const kinder = Store.childrenOf(p.id);
            if (kinder.some(isNotebook))
                Store.updateBlock(p.id, { heftArt: 'fach' });
        });
    };
    if (typeof Ereignisse !== 'undefined' && typeof ARTEN !== 'undefined' && ARTEN.seiteWirdGesperrt) {
        try {
            Ereignisse.horche(ARTEN.seiteWirdGesperrt, (d) => {
                const p = d && d.id ? Store.getBlock(String(d.id)) : null;
                return p && !p.locked && heftArtig(p) ? { heftArt: 'heft' } : null;
            });
        }
        catch { }
    }
    const notebookPages = () => Object.values(Store.cache.blocks)
        .filter(isNotebook)
        .sort((a, b) => String(b.edited || '').localeCompare(String(a.edited || '')));
    const nachNamen = (a, b) => String(a.text || '').localeCompare(String(b.text || ''), 'de');
    const alleFaecher = () => (faecherMerken(),
        Object.values(Store.cache.blocks).filter((p) => istFach(p)).sort(nachNamen));
    const elternFach = (f) => (f && f.parentId && f.parentTable !== 'collection')
        ? (istFach(Store.getBlock(f.parentId)) ? Store.getBlock(f.parentId) : null)
        : null;
    const faecher = () => alleFaecher().filter(f => !elternFach(f));
    const unterFaecher = (fid) => Store.childrenOf(fid).filter((k) => istFach(k)).sort(nachNamen);
    const fachWeg = (fid) => {
        const weg = [];
        const gesehen = new Set();
        let f = Store.getBlock(fid);
        while (f && !gesehen.has(f.id) && weg.length < FACH_TIEFE + 1) {
            gesehen.add(f.id);
            weg.unshift(f);
            f = elternFach(f);
        }
        return weg;
    };
    const loseHefte = () => notebookPages().filter(p => !istFach(p.parentId ? Store.getBlock(p.parentId) : null));
    const fachHefte = (fid) => Store.childrenOf(fid).filter(isNotebook)
        .sort((a, b) => String(b.edited || '').localeCompare(String(a.edited || '')));
    const fachInhaltSatz = (fid) => {
        const h = fachHefte(fid).length;
        const f = unterFaecher(fid).length;
        const teile = [];
        if (f)
            teile.push(f === 1 ? '1 Fach' : f + ' Fächer');
        if (h)
            teile.push(h === 1 ? '1 Heft' : h + ' Hefte');
        return teile.length ? teile.join(' · ') : 'leer';
    };
    const toteHefte = () => Store.trashed().filter(heftArtig);
    const sheetCount = (p) => {
        const a4 = (typeof SheetSpace !== 'undefined' && SheetSpace.A4_HOEHE) || 842;
        return Store.childrenOf(p.id)
            .filter((k) => k.type === 'blatt')
            .reduce((n, k) => n + Math.max(1, Math.round((Number(k.blattHoehe) || a4) / a4)), 0);
    };
    const wann = (p) => {
        const bib = globalThis.Bibliothek;
        return bib && typeof bib.wannText === 'function' ? bib.wannText(p.edited) : '';
    };
    const sheetLabel = (p) => {
        if (p.locked)
            return 'Verschlüsselt';
        const n = sheetCount(p);
        return n === 1 ? '1 Blatt' : n + ' Blätter';
    };
    const FARBEN = ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red']
        .map(id => ({ id, name: Farben.name(id) }));
    const farbeVon = (p) => Farben.kennung(p?.color);
    const focusFirstLine = (pageId) => {
        const sheet = Store.childrenOf(pageId).find((k) => k.type === 'blatt');
        if (!sheet)
            return;
        const line = Store.childrenOf(sheet.id).find((k) => k.type === 'text')
            || Store.childrenOf(sheet.id)[0];
        if (!line)
            return;
        App.zeichneSeite(line.id);
        requestAnimationFrame(() => {
            if (App.aktuelleSeite && App.aktuelleSeite() !== pageId)
                return;
            const feld = document.querySelector(`[data-bid="${esc(line.id)}"] .ct`);
            if (feld && document.activeElement !== feld)
                feld.focus();
        });
    };
    const openNotebook = (id) => {
        const p = Store.getBlock(id);
        if (!p || p.alive === false) {
            UI.toast('Dieses Heft gibt es nicht mehr.');
            renderShelf();
            return;
        }
        if (p.locked) {
            Store.setMeta('heft:zuletzt', id);
            App.oeffne(id);
            return;
        }
        if (!p.dokumentModus)
            Store.updateBlock(id, { dokumentModus: true });
        Store.setMeta('heft:zuletzt', id);
        App.oeffne(id);
        focusFirstLine(id);
    };
    const createNotebook = (papier) => {
        const gewaehlt = papier || String(Store.getMeta('heft:papier', 'liniert'));
        if (papier)
            Store.setMeta('heft:papier', papier);
        const eltern = tab === 'dokumente' ? fachId : null;
        const datum = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
        const p = Store.addPage(eltern, { text: 'Heft vom ' + datum, icon: '📓' });
        const sheet = Store.addBlock(p.id, 'blatt', { text: '', papier: gewaehlt });
        Store.addBlock(sheet.id, 'text', { text: '' });
        Store.updateBlock(p.id, { dokumentModus: true });
        Store.setMeta('heft:zuletzt', p.id);
        App.oeffne(p.id);
        focusFirstLine(p.id);
    };
    const createFach = async () => {
        const name = await UI.frage('Name des Fachs', '');
        if (!name)
            return;
        Store.addPage(null, { text: name, icon: '🗂', heftArt: 'fach' });
        renderShelf();
    };
    const moveToFach = (heftId, zielId) => {
        const p = Store.getBlock(heftId);
        if (!p)
            return;
        if (zielId) {
            if (zielId === heftId ||
                (typeof WissenDienst !== 'undefined' && WissenDienst.istUnter(zielId, heftId))) {
                UI.toast('Das geht nicht — dieses Fach liegt im Heft selbst.');
                return;
            }
        }
        Werkzeuge.verschiebe(p, zielId);
    };
    const ziehenAblegen = (heftId, zielId) => {
        const p = Store.getBlock(heftId);
        if (!p)
            return false;
        const jetzt = p.parentTable === 'collection' ? null : (p.parentId || null);
        if ((zielId || null) === jetzt)
            return false;
        if (zielId) {
            if (zielId === heftId ||
                (typeof WissenDienst !== 'undefined' && WissenDienst.istUnter(zielId, heftId))) {
                UI.toast('Das geht nicht — dieses Fach liegt im Heft selbst.');
                return false;
            }
        }
        Werkzeuge.verschiebe(p, zielId, true);
        const ziel = zielId ? Store.getBlock(zielId) : null;
        UI.toast('„' + String(p.text || 'Ohne Titel') + '" liegt jetzt ' +
            (ziel ? 'in „' + String(ziel.text || 'Ohne Namen') + '"' : 'im Regal'));
        return true;
    };
    const toggleFavorit = (id) => {
        const p = Store.getBlock(id);
        if (!p)
            return;
        Store.updateBlock(id, { favorite: !p.favorite });
        renderShelf();
    };
    const setzeFarbe = (id, farbe, danach) => {
        Store.updateBlock(id, { color: Farben.kennung(farbe) });
        if (danach)
            danach();
        else
            renderShelf();
    };
    const sperrenHier = async (id) => {
        const p = Store.getBlock(id);
        if (!p)
            return;
        await Werkzeuge.sperren(p);
        const danach = Store.getBlock(id);
        if (danach?.locked && danach.heftArt !== 'heft')
            Store.updateBlock(id, { heftArt: 'heft' });
        renderShelf();
    };
    const entsperrenHier = async (id) => {
        const p = Store.getBlock(id);
        if (!p)
            return;
        await Werkzeuge.entsperren(p);
        renderShelf();
    };
    const resume = () => {
        const id = String(Store.getMeta('heft:zuletzt', '') || '');
        const p = id ? Store.getBlock(id) : null;
        if (p && p.alive !== false)
            openNotebook(id);
        else
            oeffnen();
    };
    const openFach = (id) => {
        fachId = id;
        Store.setMeta('heft:fach', id);
        renderShelf();
    };
    const closeFach = () => {
        fachId = null;
        Store.setMeta('heft:fach', '');
        renderShelf();
    };
    const form = () => Store.getMeta('heft:form', 'gitter') === 'liste' ? 'liste' : 'gitter';
    const coverCard = (p) => {
        const sheet = Store.childrenOf(p.id).find((k) => k.type === 'blatt');
        const papier = String(sheet?.papier || 'blanko');
        const farbe = farbeVon(p);
        const tinte = (!p.locked && typeof Vorschau !== 'undefined' && Vorschau.tinteSvg)
            ? Vorschau.tinteSvg(p.id) : '';
        const deckelBlatt = p.locked
            ? `<span class="bib-deckel-blatt is-leer is-gesperrt">` +
                `<span class="nh-schloss" aria-hidden="true">🔒</span></span>`
            : `<span class="bib-deckel-blatt${tinte ? ' hat-tinte' : ' is-leer'}" data-papier="${esc(papier)}">` +
                `<i class="bib-papier" aria-hidden="true"></i>${tinte}</span>`;
        return `<div class="nh-karte">` +
            `<button class="bib-deckel" data-id="${esc(p.id)}" data-art="blatt"` +
            (farbe ? ` data-farbe="${esc(farbe)}" style="--deckel-farbe:var(--c-${esc(farbe)})"` : '') +
            ` aria-label="Heft öffnen: ${esc(p.text || 'Ohne Titel')}">` +
            deckelBlatt +
            `<span class="bib-deckel-name"><b>${esc(p.text || 'Ohne Titel')}</b></span>` +
            `<small>${esc(sheetLabel(p))}${p.locked ? '' : ' · ' + esc(wann(p))}</small>` +
            `</button>` +
            sternKnopf(p) +
            `<button class="nh-mehr" data-mehr="${esc(p.id)}" title="Mehr zu diesem Heft" ` +
            `aria-label="Mehr zu ${esc(p.text || 'diesem Heft')}">⋯</button></div>`;
    };
    const sternKnopf = (p) => {
        const name = p.text || 'Ohne Titel';
        if (typeof Merkzeichen !== 'undefined')
            return Merkzeichen.html({ an: !!p.favorite, name,
                klasse: 'nh-stern' + (p.favorite ? ' an' : ''),
                zusatz: `data-stern="${esc(p.id)}"` });
        return `<button class="nh-stern${p.favorite ? ' an' : ''}" data-stern="${esc(p.id)}" ` +
            `aria-pressed="${p.favorite ? 'true' : 'false'}" ` +
            `title="${p.favorite ? 'Aus Favoriten' : 'Zu Favoriten'}" ` +
            `aria-label="${p.favorite ? 'Aus Favoriten: ' : 'Zu Favoriten: '}` +
            `${esc(name)}">${p.favorite ? '★' : '☆'}</button>`;
    };
    const fachCard = (f) => {
        const deckel = `<button class="bib-deckel" data-fach="${esc(f.id)}" data-art="ordner"` +
            Farben.marke(f.color) + ' ' +
            `aria-label="Fach öffnen: ${esc(f.text || 'Ohne Namen')}">` +
            `<span class="bib-deckel-blatt is-leer">` +
            `<span class="nh-fach-icon" aria-hidden="true">${esc(f.icon || '🗂')}</span></span>` +
            `<span class="bib-deckel-name"><b>${esc(f.text || 'Ohne Namen')}</b></span>` +
            `<small>${esc(fachInhaltSatz(f.id))}</small>` +
            `</button>`;
        const kachel = typeof Bibliothek !== 'undefined' && Bibliothek.mitBlick
            ? Bibliothek.mitBlick(deckel, f.id, f.text || 'Ohne Namen')
            : deckel;
        return `<div class="nh-karte nh-fach">` + kachel +
            `<button class="nh-mehr" data-mehr-fach="${esc(f.id)}" title="Mehr zu diesem Fach" ` +
            `aria-label="Mehr zu ${esc(f.text || 'diesem Fach')}">⋯</button></div>`;
    };
    const listRow = (p) => {
        const sheet = Store.childrenOf(p.id).find((k) => k.type === 'blatt');
        const papier = String(sheet?.papier || 'blanko');
        const mini = p.locked
            ? `<span class="bib-deckel-blatt is-leer nh-mini is-gesperrt" aria-hidden="true">` +
                `<span class="nh-schloss">🔒</span></span>`
            : `<span class="bib-deckel-blatt is-leer nh-mini" data-papier="${esc(papier)}" ` +
                `aria-hidden="true"><i class="bib-papier"></i></span>`;
        const farbe = farbeVon(p);
        return `<div class="nh-zeile">` +
            `<button class="nh-zeile-auf" data-id="${esc(p.id)}"` +
            (farbe ? ` data-farbe="${esc(farbe)}" style="--deckel-farbe:var(--c-${esc(farbe)})"` : '') +
            `>` + mini +
            `<span class="nh-zeile-text"><b>${esc(p.text || 'Ohne Titel')}</b>` +
            `<small>${esc(sheetLabel(p))}${p.locked ? '' : ' · ' + esc(wann(p))}</small></span>` +
            `</button>` + sternKnopf(p) +
            `<button class="nh-mehr" data-mehr="${esc(p.id)}" title="Mehr zu diesem Heft" ` +
            `aria-label="Mehr zu ${esc(p.text || 'diesem Heft')}">⋯</button></div>`;
    };
    const fachRow = (f) => {
        return `<div class="nh-zeile nh-fach">` +
            `<button class="nh-zeile-auf" data-fach="${esc(f.id)}">` +
            `<span class="nh-mini nh-mini-fach" aria-hidden="true">${esc(f.icon || '🗂')}</span>` +
            `<span class="nh-zeile-text"><b>${esc(f.text || 'Ohne Namen')}</b>` +
            `<small>${esc(fachInhaltSatz(f.id))}</small></span>` +
            `</button>` +
            `<button class="nh-mehr" data-mehr-fach="${esc(f.id)}" title="Mehr zu diesem Fach" ` +
            `aria-label="Mehr zu ${esc(f.text || 'diesem Fach')}">⋯</button></div>`;
    };
    const trashCard = (p) => {
        const sheet = Store.childrenOf(p.id).find((k) => k.type === 'blatt');
        const papier = String(sheet?.papier || 'blanko');
        return `<div class="nh-karte nh-tot">` +
            `<div class="bib-deckel" data-art="blatt" aria-hidden="true">` +
            `<span class="bib-deckel-blatt is-leer" data-papier="${esc(papier)}">` +
            `<i class="bib-papier"></i></span>` +
            `<span class="bib-deckel-name"><b>${esc(p.text || 'Ohne Titel')}</b></span>` +
            `</div>` +
            `<button class="rb leise nh-herstellen" data-herstellen="${esc(p.id)}">` +
            `Wiederherstellen</button></div>`;
    };
    const resumeCard = () => {
        const id = String(Store.getMeta('heft:zuletzt', '') || '');
        const p = id ? Store.getBlock(id) : null;
        if (!p || !isNotebook(p))
            return '';
        return `<button class="nh-weiter" data-id="${esc(p.id)}">` +
            `<span class="bib-deckel-blatt is-leer" aria-hidden="true">` +
            `<i class="bib-papier"></i></span>` +
            `<span class="nh-weiter-text"><strong>${esc(p.text || 'Ohne Titel')}</strong>` +
            `<small>Weiterschreiben · ${esc(wann(p))} · ${esc(sheetLabel(p))}</small>` +
            `</span></button>`;
    };
    const emptyState = (andereSeiten) => `<div class="nh-leer leer-zustand">` +
        `<button class="nh-neu nh-erstes" data-neu>` +
        `<span class="nh-neu-plus" aria-hidden="true">＋</span>` +
        `<span>Dein erstes Heft</span></button>` +
        `<p>Ein Heft ist eine Seite mit A4-Blättern — liniert, kariert, blanko, ` +
        `Punktraster oder Millimeterpapier.</p>` +
        (andereSeiten
            ? `<button class="rb leise" data-alle>Alle Dokumente ansehen</button>` : '') +
        `</div>`;
    const kopfHtml = () => {
        const fach = fachId ? Store.getBlock(fachId) : null;
        const weg = fach ? fachWeg(fach.id) : [];
        const oben = weg.length > 1 ? weg[weg.length - 2] : null;
        const krumeHtml = weg.length > 1
            ? `<nav class="nh-krume" aria-label="Wo Sie sind">` +
                `<button data-zurueck>Notizhefte</button>` +
                weg.slice(0, -1).map((f) => `<span aria-hidden="true"> / </span>` +
                    `<button data-fach="${esc(f.id)}">${esc(f.text || 'Ohne Namen')}</button>`).join('') +
                `<span aria-hidden="true"> / </span>` +
                `<b>${esc(fach.text || 'Ohne Namen')}</b></nav>`
            : '';
        const zeile1 = `<div class="nh-kopf-zeile">` +
            (fach
                ? `<button class="rb leise nh-zurueck"` +
                    (oben ? ` data-fach="${esc(oben.id)}"` : ' data-zurueck') +
                    ` aria-label="Zurück zu ${esc(oben ? (oben.text || 'Ohne Namen') : 'Notizhefte')}">` +
                    `← ${esc(oben ? (oben.text || 'Ohne Namen') : 'Notizhefte')}</button>` +
                    `<h1>${esc(fach.icon || '🗂')} ${esc(fach.text || 'Ohne Namen')}</h1>`
                : `<h1>Notizhefte</h1>`) +
            `<input class="nh-suche" type="search" placeholder="Heft suchen …" ` +
            `aria-label="Notizhefte durchsuchen" value="${esc(searchText)}"` +
            `${searchText ? '' : ' hidden'}>` +
            `<button class="rb zeichen nh-suche-knopf" data-suche title="Heft suchen" ` +
            `aria-label="Notizhefte durchsuchen"><span data-sym="search"></span></button>` +
            `<button class="rb nh-neu-knopf" data-neu-menue>＋ Neu</button>` +
            `<button class="rb nh-alle" data-alle>Alle Dokumente</button>` +
            `</div>`;
        const favN = notebookPages().filter(p => p.favorite).length;
        const korbN = toteHefte().length;
        const reiterHtml = fach ? '' :
            `<div class="nh-reiter" role="group" aria-label="Bestand">` +
                `<button data-reiter="dokumente"${tab === 'dokumente' ? ' class="on"' : ''}>Dokumente</button>` +
                `<button data-reiter="favoriten"${tab === 'favoriten' ? ' class="on"' : ''}>Favoriten` +
                `${favN ? ' (' + favN + ')' : ''}</button>` +
                `<button data-reiter="papierkorb"${tab === 'papierkorb' ? ' class="on"' : ''}>Papierkorb` +
                `${korbN ? ' (' + korbN + ')' : ''}</button>` +
                `</div>`;
        const formHtml = (!fach && tab === 'papierkorb') ? '' :
            `<div class="nh-form" role="group" aria-label="Darstellung">` +
                `<button data-form="gitter" aria-pressed="${form() === 'gitter'}"` +
                `${form() === 'gitter' ? ' class="on"' : ''}>Gitter</button>` +
                `<button data-form="liste" aria-pressed="${form() === 'liste'}"` +
                `${form() === 'liste' ? ' class="on"' : ''}>Liste</button>` +
                `</div>`;
        const zeile2 = (!reiterHtml && !formHtml) ? '' :
            `<div class="nh-kopf-zeile nh-kopf-zeile2">${reiterHtml}${formHtml}</div>`;
        return `<header class="nh-kopf" data-kopfzeile="eigene">` +
            `${krumeHtml}${zeile1}${zeile2}</header>`;
    };
    const gefiltert = (liste) => {
        const filter = searchText.trim().toLowerCase();
        return filter
            ? liste.filter(p => String(p.text || '').toLowerCase().includes(filter))
            : liste;
    };
    const weiterSuchenZeile = () => !searchText.trim() ? '' :
        `<button class="rb leise nh-weitersuchen" data-weitersuchen>` +
            `<span data-sym="search" aria-hidden="true"></span> ` +
            `„${esc(searchText)}" im ganzen Bestand suchen — auch in Texten` +
            `</button>`;
    const nichtsSatz = () => `<p class="nh-nichts">Kein Heft heisst „${esc(searchText)}".</p>`;
    const zuFaechern = (w) => Array.isArray(w) ? w : (w ? faecher() : []);
    const gitterHtml = (hefte, mitNeu, mitFaechern) => `<div class="bib-gitter nh-gitter">` +
        (mitNeu
            ? `<button class="nh-neu" data-neu>` +
                `<span class="nh-neu-plus" aria-hidden="true">＋</span>` +
                `<span>Neues Heft</span></button>`
            : '') +
        zuFaechern(mitFaechern).map(fachCard).join('') +
        hefte.map(coverCard).join('') + `</div>`;
    const listeHtml = (hefte, mitFaechern) => `<div class="nh-liste">` +
        zuFaechern(mitFaechern).map(fachRow).join('') +
        hefte.map(listRow).join('') + `</div>`;
    const korbHtml = () => {
        const tote = gefiltert(toteHefte());
        return `<div class="nh-korb">` +
            `<p class="nh-korb-hinweis">Gelöschte Hefte. Wiederherstellen geht hier — ` +
            `endgültig löschen nur im Papierkorb selbst, mit Rückfrage.</p>` +
            (tote.length
                ? `<div class="bib-gitter nh-gitter">` + tote.map(trashCard).join('') + `</div>`
                : `<p class="nh-nichts">Der Papierkorb hält kein Heft.</p>`) +
            `<button class="rb leise nh-korb-auf" data-korb-auf>Papierkorb ganz öffnen …</button>` +
            `</div>`;
    };
    const shelfHtml = () => {
        let inhalt = '';
        if (tab === 'papierkorb') {
            inhalt = korbHtml();
        }
        else if (tab === 'favoriten') {
            const favs = gefiltert(notebookPages().filter(p => p.favorite));
            inhalt = favs.length
                ? (form() === 'liste' ? listeHtml(favs, false) : gitterHtml(favs, false, false))
                : (searchText.trim() ? nichtsSatz()
                    : `<p class="nh-nichts">Noch kein Heft mit Stern — der Stern sitzt ` +
                        `an jeder Karte.</p>`);
        }
        else if (fachId && Store.getBlock(fachId)) {
            const hefte = gefiltert(fachHefte(fachId));
            const unter = searchText.trim() ? [] : unterFaecher(fachId);
            inhalt = (searchText.trim() && !hefte.length) ? nichtsSatz()
                : (form() === 'liste' ? listeHtml(hefte, unter) : gitterHtml(hefte, true, unter));
        }
        else {
            if (fachId)
                fachId = null;
            const alle = notebookPages();
            const filter = searchText.trim();
            if (!alle.length && !faecher().length) {
                inhalt = emptyState(Object.values(Store.cache.blocks)
                    .some((b) => b?.type === 'page' && b.alive !== false && !b.system));
            }
            else if (filter) {
                const hefte = gefiltert(alle);
                inhalt = resumeCard() + (hefte.length
                    ? (form() === 'liste' ? listeHtml(hefte, false) : gitterHtml(hefte, false, false))
                    : nichtsSatz());
            }
            else {
                const lose = loseHefte();
                inhalt = resumeCard() + (form() === 'liste'
                    ? listeHtml(lose, true) : gitterHtml(lose, true, true));
            }
        }
        return `<div class="nh-regal">` + kopfHtml() + inhalt + weiterSuchenZeile() +
            `<button class="nh-neu-fab" data-neu-menue aria-label="Neu">＋</button>` +
            `</div>`;
    };
    const neuMenue = (anker) => {
        const geladen = new Set((App.erstellenWege ? App.erstellenWege() : []).map((w) => String(w.id)));
        const weg = (id, zeichen, name) => geladen.has(id)
            ? `<button data-w="${id}"><span class="mi">${zeichen}</span>${name}</button>`
            : '';
        const papiere = [
            ['liniert', 'Liniert'], ['kariert', 'Kariert'], ['blanko', 'Blanko'],
            ['punkte', 'Punktraster'], ['mm', 'Millimeterpapier']
        ].map(([id, name]) => `<button class="nh-papierwahl" data-w-papier="${id}" title="Neues Heft: ${name}" ` +
            `aria-label="Neues Heft: ${name}">` +
            `<span class="bib-deckel-blatt is-leer nh-mini" data-papier="${id}" aria-hidden="true">` +
            `<i class="bib-papier"></i></span></button>`).join('');
        const r = anker.getBoundingClientRect();
        const m = UI.menu(`<button data-w="heft"><span class="mi">📓</span>Notizheft</button>` +
            `<div class="nh-papiere">${papiere}</div>` +
            `<button data-w="fach"><span class="mi">🗂</span>Neues Fach</button>` +
            `<div class="sep"></div>` +
            weg('pdf', '📕', 'PDF einlesen') +
            weg('zip', '🗜', 'ZIP entpacken') +
            weg('board', '🖍', 'Whiteboard') +
            weg('seite', '📄', 'Textseite') +
            `<div class="sep"></div>` +
            `<button data-w="alle">Alle Wege …</button>`, Math.min(r.left, innerWidth - 240), Math.min(r.bottom + 4, innerHeight - 300));
        m.addEventListener('click', (e) => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (!ziel)
                return;
            const papier = ziel.closest('[data-w-papier]');
            const b = ziel.closest('[data-w]');
            if (!papier && !b)
                return;
            m.remove();
            if (papier)
                return createNotebook(String(papier.dataset['wPapier']));
            const was = String(b?.dataset['w'] || '');
            if (was === 'heft')
                return createNotebook();
            if (was === 'fach') {
                void createFach();
                return;
            }
            if (was === 'alle')
                return App.erstellenBlatt();
            setTimeout(() => App.erstellenWeg(was), 60);
        });
    };
    const farbMenue = (anker, id, danach) => {
        const p = Store.getBlock(id);
        if (!p)
            return;
        const jetzt = farbeVon(p);
        const r = anker.getBoundingClientRect();
        const m = UI.menu(`<div class="swatches nh-farben">` +
            FARBEN.map(f => `<button data-farbe="${f.id}" title="${f.name}" aria-label="${f.name}" ` +
                `aria-pressed="${jetzt === f.id}" style="background:var(--c-${f.id})">` +
                `${jetzt === f.id ? '✓' : ''}</button>`).join('') +
            `</div>` +
            `<button data-farbe="">Ohne Farbe</button>`, Math.min(r.left, innerWidth - 240), r.bottom + 4);
        m.addEventListener('click', (e) => {
            const b = e.target.closest('[data-farbe]');
            if (!b)
                return;
            m.remove();
            setzeFarbe(id, String(b.dataset['farbe'] || ''), danach);
        });
    };
    const fachwahlMenue = (anker, heftId) => {
        const p = Store.getBlock(heftId);
        if (!p)
            return;
        const ziele = alleFaecher().filter(f => f.id !== heftId &&
            !(typeof WissenDienst !== 'undefined' && WissenDienst.istUnter(f.id, heftId)));
        const imFach = istFach(p.parentId ? Store.getBlock(p.parentId) : null);
        const wegText = (f) => {
            const weg = fachWeg(f.id).slice(0, -1).map((x) => String(x.text || 'Ohne Namen'));
            return weg.length ? weg.join(' / ') + ' / ' : '';
        };
        const r = anker.getBoundingClientRect();
        const m = UI.menu(ziele.map(f => `<button data-z="${esc(f.id)}"><span class="mi">${esc(f.icon || '🗂')}</span>` +
            (wegText(f) ? `<small class="nh-zielweg">${esc(wegText(f))}</small>` : '') +
            `${esc(f.text || 'Ohne Namen')}</button>`).join('') +
            (imFach ? `<button data-z=""><span class="mi">▤</span>Regal (ohne Fach)</button>` : '') +
            `<div class="sep"></div>` +
            `<button data-z-neu><span class="mi">＋</span>Neues Fach …</button>`, Math.min(r.left, innerWidth - 240), r.bottom + 4);
        m.addEventListener('click', (e) => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (!ziel)
                return;
            const neu = ziel.closest('[data-z-neu]');
            const b = ziel.closest('[data-z]');
            if (!neu && !b)
                return;
            m.remove();
            if (neu) {
                void (async () => {
                    const name = await UI.frage('Name des Fachs', '');
                    if (!name)
                        return;
                    const f = Store.addPage(null, { text: name, icon: '🗂', heftArt: 'fach' });
                    moveToFach(heftId, f.id);
                })();
                return;
            }
            moveToFach(heftId, String(b?.dataset['z'] || '') || null);
        });
    };
    const kontextMenue = (anker, id) => {
        const p = Store.getBlock(id);
        if (!p)
            return;
        const r = anker.getBoundingClientRect();
        const html = p.locked
            ? `<button data-k="auf">Öffnen</button>` +
                `<button data-k="stern">${p.favorite ? 'Aus Favoriten' : 'Zu Favoriten'}</button>` +
                `<button data-k="entsperren">Entschlüsseln</button>` +
                `<div class="sep"></div>` +
                `<button data-k="korb">In den Papierkorb</button>`
            : `<button data-k="auf">Öffnen</button>` +
                `<button data-k="stern">${p.favorite ? 'Aus Favoriten' : 'Zu Favoriten'}</button>` +
                `<button data-k="name">Umbenennen</button>` +
                `<button data-k="farbe">Farbe …</button>` +
                `<button data-k="fach">In Fach verschieben …</button>` +
                `<button data-k="sperren">Verschlüsseln</button>` +
                `<div class="sep"></div>` +
                `<button data-k="korb">In den Papierkorb</button>`;
        const m = UI.menu(html, Math.min(r.left - 140, innerWidth - 240), r.bottom + 4);
        m.addEventListener('click', (e) => {
            const b = e.target.closest('[data-k]');
            if (!b)
                return;
            m.remove();
            const k = b.dataset['k'];
            if (k === 'auf')
                return openNotebook(id);
            if (k === 'stern')
                return toggleFavorit(id);
            if (k === 'farbe')
                return farbMenue(anker, id);
            if (k === 'fach')
                return fachwahlMenue(anker, id);
            if (k === 'sperren') {
                void sperrenHier(id);
                return;
            }
            if (k === 'entsperren') {
                void entsperrenHier(id);
                return;
            }
            if (k === 'name') {
                void (async () => {
                    const name = await UI.frage('Name des Hefts', String(p.text || ''));
                    if (name) {
                        Store.updateBlock(id, { text: name });
                        renderShelf();
                    }
                })();
                return;
            }
            if (k === 'korb') {
                Store.trashBlock(id);
                UI.toast('Ins Papierkorb gelegt — Reiter „Papierkorb" holt es zurück.');
                renderShelf();
            }
        });
    };
    const fachKontextMenue = (anker, id) => {
        const f = Store.getBlock(id);
        if (!f)
            return;
        const r = anker.getBoundingClientRect();
        const kannBlick = typeof Bibliothek !== 'undefined' && !!Bibliothek.blickHinein;
        const m = UI.menu(`<button data-k="auf">Öffnen</button>` +
            (kannBlick ? `<button data-k="blick"><span class="mi">⌕</span>Blick hinein</button>` : '') +
            `<button data-k="name">Umbenennen</button>` +
            `<button data-k="farbe">Farbe …</button>` +
            `<div class="sep"></div>` +
            `<button data-k="korb">In den Papierkorb</button>`, Math.min(r.left - 140, innerWidth - 240), r.bottom + 4);
        m.addEventListener('click', (e) => {
            const b = e.target.closest('[data-k]');
            if (!b)
                return;
            m.remove();
            if (b.dataset['k'] === 'auf')
                return openFach(id);
            if (b.dataset['k'] === 'farbe')
                return farbMenue(anker, id);
            if (b.dataset['k'] === 'blick')
                return Bibliothek.blickHinein(f, anker.getBoundingClientRect(), false, (ziel) => openFach(ziel));
            if (b.dataset['k'] === 'name') {
                void (async () => {
                    const name = await UI.frage('Name des Fachs', String(f.text || ''));
                    if (name) {
                        Store.updateBlock(id, { text: name });
                        renderShelf();
                    }
                })();
                return;
            }
            if (b.dataset['k'] === 'korb') {
                Store.trashBlock(id);
                UI.toast('Fach in den Papierkorb gelegt. Seine Hefte bleiben im Regal.');
                renderShelf();
            }
        });
    };
    const HEBEN_MS = 400;
    const HEBEN_PX = 6;
    const ROLL_PX = 10;
    let zug = null;
    const zielUnter = (x, y) => {
        const el = document.elementFromPoint(x, y);
        if (!el)
            return undefined;
        const fach = el.closest('[data-fach]');
        if (fach && fach.dataset['fach'])
            return fach.dataset['fach'];
        if (el.closest('[data-zurueck]'))
            return null;
        if (el.closest('.nh-regal'))
            return fachId || null;
        return undefined;
    };
    const zielMarkieren = (el) => {
        if (zug && zug.ueber && zug.ueber !== el)
            zug.ueber.classList.remove('nh-ziel');
        if (el)
            el.classList.add('nh-ziel');
        if (zug)
            zug.ueber = el;
    };
    const heben = (karte) => {
        if (!zug)
            return;
        zug.gehoben = true;
        karte.classList.add('nh-hebt');
        document.body.classList.add('nh-zieht');
        const s = document.createElement('div');
        s.className = 'nh-schatten';
        s.textContent = karte.querySelector('.bib-deckel-name b, .nh-zeile-text b')?.textContent
            || 'Heft';
        s.style.left = zug.x0 + 'px';
        s.style.top = zug.y0 + 'px';
        document.body.appendChild(s);
        zug.schatten = s;
    };
    const aufraeumen = () => {
        if (!zug)
            return;
        zug.uhr !== null && clearTimeout(zug.uhr);
        zug.schatten?.remove();
        zug.ueber?.classList.remove('nh-ziel');
        document.querySelector('.nh-hebt')?.classList.remove('nh-hebt');
        document.body.classList.remove('nh-zieht');
        zug = null;
    };
    const bindZiehen = (wurzel) => {
        wurzel.addEventListener('pointerdown', e => {
            if (e.button !== 0 && e.pointerType === 'mouse')
                return;
            const ziel = e.target instanceof Element ? e.target : null;
            if (!ziel || ziel.closest('[data-mehr], [data-mehr-fach], [data-stern], .nh-neu'))
                return;
            const karte = ziel.closest('.bib-deckel[data-id], .nh-zeile-auf[data-id]');
            const id = karte?.dataset['id'];
            if (!karte || !id)
                return;
            aufraeumen();
            zug = { id, zeiger: e.pointerId, x0: e.clientX, y0: e.clientY,
                maus: e.pointerType === 'mouse', gehoben: false, uhr: null,
                schatten: null, ueber: null };
            if (!zug.maus)
                zug.uhr = window.setTimeout(() => { if (zug && !zug.gehoben)
                    heben(karte); }, HEBEN_MS);
        });
        wurzel.addEventListener('pointermove', e => {
            if (!zug || e.pointerId !== zug.zeiger)
                return;
            const weg = Math.hypot(e.clientX - zug.x0, e.clientY - zug.y0);
            if (!zug.gehoben) {
                if (!zug.maus) {
                    if (weg > ROLL_PX)
                        aufraeumen();
                    return;
                }
                if (weg < HEBEN_PX)
                    return;
                const karte = wurzel.querySelector(`.bib-deckel[data-id="${CSS.escape(zug.id)}"], .nh-zeile-auf[data-id="${CSS.escape(zug.id)}"]`);
                if (!karte) {
                    aufraeumen();
                    return;
                }
                heben(karte);
            }
            e.preventDefault();
            if (zug.schatten) {
                zug.schatten.style.left = e.clientX + 'px';
                zug.schatten.style.top = e.clientY + 'px';
            }
            if (zug.schatten)
                zug.schatten.style.visibility = 'hidden';
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if (zug.schatten)
                zug.schatten.style.visibility = '';
            const fach = el?.closest('[data-fach]') ?? null;
            const krume = el?.closest('[data-zurueck]') ?? null;
            zielMarkieren(fach || krume);
        });
        const loslassen = (e) => {
            if (!zug || e.pointerId !== zug.zeiger)
                return;
            const gehoben = zug.gehoben;
            const id = zug.id;
            if (zug.schatten)
                zug.schatten.style.visibility = 'hidden';
            const wohin = gehoben ? zielUnter(e.clientX, e.clientY) : undefined;
            aufraeumen();
            if (!gehoben)
                return;
            if (wohin === undefined)
                return;
            if (ziehenAblegen(id, wohin))
                renderShelf();
        };
        wurzel.addEventListener('pointerup', loslassen);
        wurzel.addEventListener('touchmove', e => {
            if (zug && zug.gehoben)
                e.preventDefault();
        }, { passive: false });
        wurzel.addEventListener('pointercancel', () => aufraeumen());
        wurzel.addEventListener('lostpointercapture', () => aufraeumen());
    };
    const bindShelf = (wurzel) => {
        bindZiehen(wurzel);
        wurzel.addEventListener('click', e => {
            if (document.body.classList.contains('nh-zieht')) {
                e.stopPropagation();
                return;
            }
            const ziel = e.target instanceof Element ? e.target : null;
            if (!ziel)
                return;
            const stern = ziel.closest('[data-stern]');
            if (stern && stern.dataset['stern'])
                return toggleFavorit(stern.dataset['stern']);
            const mehrFach = ziel.closest('[data-mehr-fach]');
            if (mehrFach && mehrFach.dataset['mehrFach'])
                return fachKontextMenue(mehrFach, mehrFach.dataset['mehrFach']);
            const mehr = ziel.closest('[data-mehr]');
            if (mehr && mehr.dataset['mehr'])
                return kontextMenue(mehr, mehr.dataset['mehr']);
            const menue = ziel.closest('[data-neu-menue]');
            if (menue)
                return neuMenue(menue);
            if (ziel.closest('[data-neu]'))
                return createNotebook();
            if (ziel.closest('[data-zurueck]'))
                return closeFach();
            if (ziel.closest('[data-korb-auf]')) {
                App.papierkorb();
                return;
            }
            const herstellen = ziel.closest('[data-herstellen]');
            if (herstellen && herstellen.dataset['herstellen']) {
                Store.restoreBlock(herstellen.dataset['herstellen']);
                UI.toast('Wiederhergestellt.');
                renderShelf();
                return;
            }
            const reiter = ziel.closest('[data-reiter]');
            if (reiter) {
                tab = reiter.dataset['reiter'] || 'dokumente';
                fachId = null;
                Store.setMeta('heft:reiter', tab);
                Store.setMeta('heft:fach', '');
                renderShelf();
                return;
            }
            const wahl = ziel.closest('[data-form]');
            if (wahl) {
                Store.setMeta('heft:form', wahl.dataset['form'] === 'liste' ? 'liste' : 'gitter');
                renderShelf();
                return;
            }
            if (ziel.closest('[data-alle]')) {
                const bib = globalThis.Bibliothek;
                if (bib && typeof bib.oeffne === 'function')
                    bib.oeffne();
                return;
            }
            if (ziel.closest('[data-weitersuchen]')) {
                App.suche(searchText);
                return;
            }
            if (ziel.closest('[data-suche]')) {
                const feld = wurzel.querySelector('.nh-suche');
                if (feld) {
                    feld.hidden = false;
                    feld.focus();
                }
                return;
            }
            const fach = ziel.closest('[data-fach]');
            if (fach && fach.dataset['fach'])
                return openFach(fach.dataset['fach']);
            const deckel = ziel.closest('.bib-deckel[data-id], .nh-weiter[data-id], .nh-zeile-auf[data-id]');
            if (deckel && deckel.dataset['id'])
                return openNotebook(deckel.dataset['id']);
        });
        wurzel.addEventListener('input', e => {
            const feld = e.target;
            if (!feld.classList.contains('nh-suche'))
                return;
            searchText = feld.value;
            const alt = wurzel.querySelector('.nh-gitter, .nh-liste, .nh-nichts');
            if (!alt)
                return;
            const probe = document.createElement('div');
            probe.innerHTML = shelfHtml();
            const neu = probe.querySelector('.nh-gitter, .nh-liste, .nh-nichts');
            if (neu)
                alt.replaceWith(neu);
            const brueckeAlt = wurzel.querySelector('.nh-weitersuchen');
            const brueckeNeu = probe.querySelector('.nh-weitersuchen');
            if (brueckeAlt && brueckeNeu)
                brueckeAlt.replaceWith(brueckeNeu);
            else if (brueckeAlt)
                brueckeAlt.remove();
            else if (brueckeNeu) {
                const fab = wurzel.querySelector('.nh-neu-fab');
                if (fab)
                    fab.before(brueckeNeu);
                else
                    wurzel.querySelector('.nh-regal')?.append(brueckeNeu);
            }
            if (typeof Register !== 'undefined') {
                const frisch = wurzel.querySelector('.nh-weitersuchen');
                if (frisch)
                    Register.symbole?.fuelle?.(frisch);
            }
        });
        wurzel.addEventListener('keydown', e => {
            if (e.key !== 'Escape')
                return;
            const feld = e.target;
            if (!feld.classList?.contains('nh-suche'))
                return;
            searchText = '';
            renderShelf();
        });
        if (typeof Bibliothek !== 'undefined' && Bibliothek.blickAnbringen)
            Bibliothek.blickAnbringen(wurzel, (id) => openFach(id));
    };
    const render = (wrap) => {
        document.getElementById('rand-toc')?.remove();
        wrap.innerHTML = shelfHtml();
        if (typeof Register !== 'undefined')
            Register.symbole?.fuelle?.(wrap);
        shelfRoot = wrap.querySelector('.nh-regal');
        if (shelfRoot)
            bindShelf(shelfRoot);
    };
    const renderShelf = () => {
        const wrap = shelfRoot?.parentElement;
        if (wrap && wrap.isConnected && document.querySelector('.nh-regal'))
            render(wrap);
    };
    const oeffnen = () => {
        searchText = '';
        tab = gemerkterReiter();
        fachId = gemerktesFach();
        if (fachId && tab !== 'dokumente') {
            tab = 'dokumente';
            Store.setMeta('heft:reiter', tab);
        }
        App.zeigeSonder('Notizhefte', render);
    };
    return { oeffnen, open: oeffnen, resume, render,
        farbMenue,
        istFach, isNotebook, faecher, alleFaecher, unterFaecher, fachWeg,
        fachHefte, loseHefte, fachInhaltSatz, FACH_TIEFE,
        ziehenAblegen,
        createNotebook };
})();
window.Notebook = Notebook;
if (typeof Register !== 'undefined' && Register.kontext) {
    const K = Register.kontext;
    K.melde({ bereich: 'notizhefte', id: 'regal', name: 'Regal',
        zeichen: 'book', rang: 10, tun: () => Notebook.oeffnen() });
    K.melde({ bereich: 'notizhefte', id: 'weiter', name: 'Weiterschreiben',
        zeichen: 'pencil', rang: 20,
        zeigen: () => {
            try {
                const id = String(Store.getMeta('heft:zuletzt', '') || '');
                const p = id ? Store.getBlock(id) : null;
                return !!p && p.alive !== false;
            }
            catch {
                return false;
            }
        },
        tun: () => Notebook.resume() });
    K.melde({ bereich: 'notizhefte', id: 'dokumente', name: 'Dokumente',
        zeichen: 'library', rang: 30,
        zeigen: () => typeof globalThis.Bibliothek?.oeffne === 'function',
        tun: () => globalThis.Bibliothek.oeffne() });
    K.melde({ bereich: 'notizhefte', id: 'papierkorb', name: 'Papierkorb',
        zeichen: 'trash', rang: 40, tun: () => App.papierkorb() });
}
