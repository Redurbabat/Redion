"use strict";
/* ============================================================================
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/wissen/notebook.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/wissen/notebook.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * ==========================================================================*/
/* ==========================================================================
 * notebook.js — die Ansicht „Notizhefte" (E264)
 *
 * Redur, wörtlich: „Ich brauche eine ganz neue Ansicht, komplett neu, wie
 * GoodNotes. Es sollte schnell zugreifbar sein — wenn man öffnet, muss man
 * direkt wissen, was man machen muss."
 *
 * Die Ansicht ist ein Regal aus Heft-Deckeln, das mit EINEM Tipp in ein
 * schreibbereites A4-Heft führt. GoodNotes ist dabei nur die Inspiration
 * für den ABLAUF (Regal → antippen → sofort schreiben); die Optik besteht
 * vollständig aus Redions gezeichneten Deckeln und Marken — nichts wird
 * nachgebaut.
 *
 * EIN HEFT IST KEINE NEUE DATENART, sondern eine Ansichtsregel: eine
 * lebende Seite, deren direkte Kinder mindestens einen blatt-Block und
 * keinen pdfseite-Block enthalten. Kein gespeichertes Feld, keine
 * Migration (§9) — dieselbe Linie, mit der die Bibliothek ihre Deckel-Art
 * bestimmt (artVon: pdf hat Vorrang vor blatt). Das geöffnete Heft ist
 * der vorhandene Dokumentmodus; diese Datei steuert nur den kurzen Weg
 * dorthin bei.
 *
 * Die Ansicht heisst „Notizhefte" und nicht „Hefte", weil „Heft" seit
 * E207 in der Bibliothek die Quellen-Gruppierung meint — ein Wort darf
 * nicht zwei Dinge bezeichnen.
 * ========================================================================*/
const Notebook = (() => {
    /* Sicher escapen — mit `&quot;`, denn Heftnamen landen in Attributen. */
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    /* Der Zustand des Regals ist bewusst FLÜCHTIG: die Sonderansicht wird
       bei jedem `App.oeffne` weggeräumt (schale.js, zeigeSonder). Was
       überleben muss, liegt in Meta: `heft:zuletzt` und `heft:papier`. */
    let searchText = '';
    let shelfRoot = null;
    /* ------------------------------------------------------------------ *
     * Die Heft-Regel
     * ------------------------------------------------------------------ */
    /** Eine Seite ist ein Heft, wenn unter ihren DIREKTEN Kindern ein
     *  blatt-Block liegt und kein pdfseite-Block. Der pdf-Vorrang ist
     *  deckungsgleich mit der Deckel-Art der Bibliothek — eine Seite darf
     *  nicht dort als PDF und hier als Heft auftauchen. Nur direkte
     *  Kinder; die Grenze steht in LUECKEN.md. */
    const isNotebook = (p) => {
        if (!p || p.type !== 'page' || p.alive === false || p.system)
            return false;
        const kinder = Store.childrenOf(p.id);
        if (kinder.some((k) => k.type === 'pdfseite'))
            return false;
        return kinder.some((k) => k.type === 'blatt');
    };
    const notebookPages = () => Object.values(Store.cache.blocks)
        .filter(isNotebook)
        .sort((a, b) => String(b.edited || '').localeCompare(String(a.edited || '')));
    /** Wie viele A4-Blätter die Seite hat — echt gerechnet aus der
     *  Blatthöhe (E208: keine erfundene Zahl), je blatt-Block mindestens
     *  eines. */
    const sheetCount = (p) => {
        const a4 = (typeof SheetSpace !== 'undefined' && SheetSpace.A4_HOEHE) || 842;
        return Store.childrenOf(p.id)
            .filter((k) => k.type === 'blatt')
            .reduce((n, k) => n + Math.max(1, Math.round((Number(k.blattHoehe) || a4) / a4)), 0);
    };
    const wann = (p) => {
        const bib = globalThis.Bibliothek;
        /* wannText nimmt den ZEITSTEMPEL, nicht die Seite — der erste Wurf
           übergab die Seite und bekam für jedes Heft ein „—" (Bild-Fund). */
        return bib && typeof bib.wannText === 'function' ? bib.wannText(p.edited) : '';
    };
    /** „1 Blatt", „5 Blätter" — eine Einzahl, die „1 Blätter" sagt, sieht
     *  aus wie ein Rechenfehler. */
    const sheetLabel = (p) => {
        const n = sheetCount(p);
        return n === 1 ? '1 Blatt' : n + ' Blätter';
    };
    /* ------------------------------------------------------------------ *
     * Öffnen und Anlegen
     * ------------------------------------------------------------------ */
    /** Den Cursor in die erste Textzeile des ersten Blatts setzen.
     *  `App.zeichneSeite(kindId)` ist der sanktionierte Weg; weil der
     *  Dokumentmodus asynchron nachzeichnet, folgt EIN rAF-Nachversuch
     *  direkt am Feld — mit Wache, dass die Seite noch offen ist. Danach
     *  wird ohne Fehler aufgegeben (der Nutzer klickt dann selbst). */
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
            /* Kein toter Knopf (E118): sagen, was los ist, und das Regal
               auffrischen, damit der Deckel verschwindet. */
            UI.toast('Dieses Heft gibt es nicht mehr.');
            renderShelf();
            return;
        }
        if (!p.dokumentModus)
            Store.updateBlock(id, { dokumentModus: true });
        Store.setMeta('heft:zuletzt', id);
        App.oeffne(id);
        focusFirstLine(id);
    };
    /** Ein Heft anlegen und SOFORT schreibbereit öffnen — ohne Dialog.
     *  Die Papierwahl liegt im geöffneten Heft einen Tipp entfernt
     *  (Blatt-Leiste); als Vorgabe gilt das zuletzt gewählte Papier. Das
     *  E118-Textkind wird hier selbst angelegt, damit der Fokusweg die
     *  Kennung kennt, statt auf den Renderer zu warten. */
    const createNotebook = () => {
        const datum = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
        const p = Store.addPage(null, { text: 'Heft vom ' + datum, icon: '📓' });
        const sheet = Store.addBlock(p.id, 'blatt', { text: '', papier: Store.getMeta('heft:papier', 'liniert') });
        Store.addBlock(sheet.id, 'text', { text: '' });
        Store.updateBlock(p.id, { dokumentModus: true });
        Store.setMeta('heft:zuletzt', p.id);
        App.oeffne(p.id);
        focusFirstLine(p.id);
    };
    /** Für die Startansicht „Zuletzt benutztes Heft": direkt hinein — und
     *  wenn es das Heft nicht mehr gibt, lautlos das Regal (§47). */
    const resume = () => {
        const id = String(Store.getMeta('heft:zuletzt', '') || '');
        const p = id ? Store.getBlock(id) : null;
        if (p && p.alive !== false)
            openNotebook(id);
        else
            oeffnen();
    };
    /* ------------------------------------------------------------------ *
     * Das Regal
     * ------------------------------------------------------------------ */
    /** Ein Deckel im Regal. Die Optik ist die gezeichnete Deckelkarte der
     *  Bibliothek (Klassen `bib-deckel`/`bib-deckel-blatt`, E207) — das
     *  Markup steht hier bewusst NOCH EINMAL, denn ein Bereich importiert
     *  keinen anderen (§5); geteilt wird über die Stilklassen. Das
     *  Deckel-Blatt trägt das Papier des ersten Blatts: ein kariertes
     *  Heft sieht im Regal kariert aus. */
    const coverCard = (p) => {
        const sheet = Store.childrenOf(p.id).find((k) => k.type === 'blatt');
        const papier = String(sheet?.papier || 'blanko');
        return `<div class="nh-karte">` +
            `<button class="bib-deckel" data-id="${esc(p.id)}" data-art="blatt" ` +
            `aria-label="Heft öffnen: ${esc(p.text || 'Ohne Titel')}">` +
            /* `is-leer` lässt das gezeichnete Papier durch — auf diesen Deckeln
               steht nie Vorschautext, das Papier IST die Vorschau. */
            `<span class="bib-deckel-blatt is-leer" data-papier="${esc(papier)}">` +
            `<i class="bib-papier" aria-hidden="true"></i></span>` +
            `<span class="bib-deckel-name"><b>${esc(p.text || 'Ohne Titel')}</b></span>` +
            `<small>${esc(sheetLabel(p))} · ${esc(wann(p))}</small>` +
            `</button>` +
            `<button class="nh-mehr" data-mehr="${esc(p.id)}" title="Mehr zu diesem Heft" ` +
            `aria-label="Mehr zu ${esc(p.text || 'diesem Heft')}">⋯</button></div>`;
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
    const shelfHtml = () => {
        const alle = notebookPages();
        const filter = searchText.trim().toLowerCase();
        const hefte = filter
            ? alle.filter(p => String(p.text || '').toLowerCase().includes(filter))
            : alle;
        const gitter = `<div class="bib-gitter nh-gitter">` +
            `<button class="nh-neu" data-neu>` +
            `<span class="nh-neu-plus" aria-hidden="true">＋</span>` +
            `<span>Neues Heft</span></button>` +
            hefte.map(coverCard).join('') + `</div>`;
        const inhalt = alle.length
            ? (resumeCard() + (filter && !hefte.length
                ? `<p class="nh-nichts">Kein Heft heisst „${esc(searchText)}".</p>`
                : gitter))
            : emptyState(Object.values(Store.cache.blocks)
                .some((b) => b?.type === 'page' && b.alive !== false && !b.system));
        return `<div class="nh-regal">` +
            `<header class="nh-kopf" data-kopfzeile="eigene">` +
            `<h1>Notizhefte</h1>` +
            `<input class="nh-suche" type="search" placeholder="Heft suchen …" ` +
            `aria-label="Notizhefte durchsuchen" value="${esc(searchText)}"` +
            `${searchText ? '' : ' hidden'}>` +
            `<button class="rb zeichen nh-suche-knopf" data-suche title="Heft suchen" ` +
            `aria-label="Notizhefte durchsuchen"><span data-sym="search"></span></button>` +
            `<button class="rb nh-alle" data-alle>Alle Dokumente</button>` +
            `</header>` + inhalt +
            `<button class="nh-neu-fab" data-neu aria-label="Neues Heft">＋</button>` +
            `</div>`;
    };
    const kontextMenue = (anker, id) => {
        const p = Store.getBlock(id);
        if (!p)
            return;
        const r = anker.getBoundingClientRect();
        const m = UI.menu(`<button data-k="auf">Öffnen</button>` +
            `<button data-k="name">Umbenennen</button>` +
            `<button data-k="korb">In den Papierkorb</button>`, r.left - 140, r.bottom + 4);
        m.addEventListener('click', (e) => {
            const b = e.target.closest('[data-k]');
            if (!b)
                return;
            m.remove();
            if (b.dataset['k'] === 'auf')
                return openNotebook(id);
            if (b.dataset['k'] === 'name') {
                void (async () => {
                    const name = await UI.frage('Name des Hefts', String(p.text || ''));
                    if (name) {
                        Store.updateBlock(id, { text: name });
                        renderShelf();
                    }
                })();
                return;
            }
            if (b.dataset['k'] === 'korb') {
                /* Umkehrbar — der Papierkorb der Bibliothek holt es zurück. */
                Store.trashBlock(id);
                UI.toast('Ins Papierkorb gelegt. Zurückholen: Bibliothek → Papierkorb.');
                renderShelf();
            }
        });
    };
    const bindShelf = (wurzel) => {
        wurzel.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (!ziel)
                return;
            const mehr = ziel.closest('[data-mehr]');
            if (mehr && mehr.dataset['mehr'])
                return kontextMenue(mehr, mehr.dataset['mehr']);
            if (ziel.closest('[data-neu]'))
                return createNotebook();
            if (ziel.closest('[data-alle]')) {
                const bib = globalThis.Bibliothek;
                if (bib && typeof bib.oeffne === 'function')
                    bib.oeffne();
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
            const deckel = ziel.closest('.bib-deckel[data-id], .nh-weiter[data-id]');
            if (deckel && deckel.dataset['id'])
                return openNotebook(deckel.dataset['id']);
        });
        wurzel.addEventListener('input', e => {
            const feld = e.target;
            if (!feld.classList.contains('nh-suche'))
                return;
            searchText = feld.value;
            /* Nur das Gitter neu, das Feld behält Fokus und Anschlag. */
            const alt = wurzel.querySelector('.nh-gitter, .nh-nichts');
            if (!alt)
                return;
            const probe = document.createElement('div');
            probe.innerHTML = shelfHtml();
            const neu = probe.querySelector('.nh-gitter, .nh-nichts');
            if (neu)
                alt.replaceWith(neu);
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
    };
    const render = (wrap) => {
        /* Das Inhaltsverzeichnis am Rand gehört zu Dokumentseiten, nicht
           hierher (dasselbe tun die Produktwelten beim Betreten). */
        document.getElementById('rand-toc')?.remove();
        wrap.innerHTML = shelfHtml();
        /* Die Lupe und andere [data-sym]-Zeichen malt das Register. */
        if (typeof Register !== 'undefined')
            Register.symbole?.fuelle?.(wrap);
        shelfRoot = wrap.querySelector('.nh-regal');
        if (shelfRoot)
            bindShelf(shelfRoot);
    };
    const renderShelf = () => {
        /* Nur auffrischen, wenn das Regal wirklich noch steht — sonst malte
           ein später Aufruf über eine offene Seite (die E136-Falle). */
        const wrap = shelfRoot?.parentElement;
        if (wrap && wrap.isConnected && document.querySelector('.nh-regal'))
            render(wrap);
    };
    const oeffnen = () => { App.zeigeSonder('Notizhefte', render); };
    return { oeffnen, open: oeffnen, resume, render };
})();
window.Notebook = Notebook;
