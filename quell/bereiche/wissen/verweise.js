"use strict";
/* ============================================================================
 * links.js — Verknüpfungen zwischen Seiten
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/wissen/verweise.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/wissen/verweise.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Das, was Notion „Link to page" nennt und was Logseq, Foam, SiYuan und
 * Obsidian gross gemacht haben:
 *
 *   [[Seitenname]]   verlinkt eine Seite. Gibt es sie nicht, wird sie angelegt.
 *   #stichwort       setzt ein Schlagwort.
 *   ((Blockverweis)) verweist auf einen einzelnen Block.
 *
 * Dazu die Gegenrichtung: Rückverweise unter jeder Seite, unverlinkte
 * Erwähnungen und ein Graph, der zeigt, was womit zusammenhängt.
 * ==========================================================================*/
const Links = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    /* ========================================================================
     * INLINE-DARSTELLUNG
     * ------------------------------------------------------------------------
     * Bekommt bereits maskiertes HTML von Blocks.inline() und ergänzt
     * Seitenlinks, Schlagwörter und Blockverweise.
     * ======================================================================*/
    const inline = (html) => String(html)
        /* ((Blockverweis)) */
        .replace(/\(\(([0-9a-f-]{6,})\)\)/gi, (_, id) => {
        const b = Store.getBlock(id);
        if (!b)
            return '<span class="wl tot">((verwaister Verweis))</span>';
        return `<a class="bl" data-bref="${id}" title="Zum Block springen">${esc(b.text || 'Block')}</a>`;
    })
        /* [[Seitenname]] */
        .replace(/\[\[([^\[\]\n|]{1,240})(?:\|([^\]\n]{1,240}))?\]\]/g, (_, roh, alias) => {
        const name = roh.trim();
        const anzeige = String(alias || name).trim() || name;
        const aufloesung = loeseSeitenverweis(name);
        const klasse = aufloesung.status === 'eindeutig' ? '' :
            aufloesung.status === 'mehrdeutig' ? ' mehrdeutig' : ' neu';
        const titel = aufloesung.status === 'eindeutig' ? 'Seite öffnen' :
            aufloesung.status === 'mehrdeutig'
                ? `${aufloesung.candidates.length} passende Seiten auswählen`
                : 'Seite anlegen';
        return `<a class="wl${klasse}" data-wl="${esc(name)}" ` +
            `title="${esc(titel)}">${esc(anzeige)}</a>`;
    })
        /* #stichwort — nur am Wortanfang, damit URLs mit # unberührt bleiben */
        .replace(/(^|[\s(>])#([A-Za-z0-9ÄÖÜäöüß][\wÄÖÜäöüß\-\/]{1,40})/g, (_, vor, tag) => `${vor}<a class="tg" data-tag="${esc(tag)}">#${esc(tag)}</a>`);
    /* ========================================================================
     * NACHSCHLAGEN
     * ======================================================================*/
    /** Alle echten Seiten (keine Datenbankzeilen, nichts im Papierkorb). */
    const seiten = () => Object.values(Store.cache.blocks)
        .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection');
    /** Leerzeichen und Grossschreibung sind für Seitennamen nicht bedeutend. */
    const normalisiereSeitennamen = (value) => String(value ?? '')
        .normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
    /** Nur echte, nichtleere Aliasnamen gelangen in die Link-Wahrheit. */
    const aliasesVon = (page) => {
        if (!Array.isArray(page?.aliases))
            return [];
        const seen = new Set(), out = [];
        for (const raw of page.aliases) {
            const alias = String(raw ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').slice(0, 120);
            const normalized = normalisiereSeitennamen(alias);
            if (!normalized || seen.has(normalized))
                continue;
            seen.add(normalized);
            out.push(alias);
        }
        return out;
    };
    const normalisiereVaultPfad = (value) => String(value ?? '')
        .normalize('NFKC').replace(/\\/g, '/').replace(/^\.\//, '')
        .replace(/\.(?:md|markdown)$/i, '').replace(/^\/+|\/+$/g, '')
        .split('/').map(segment => segment.trim().replace(/\s+/g, ' ')).filter(Boolean)
        .join('/').toLocaleLowerCase('de');
    /** Hierarchischer Pfad für gleichnamige Seiten ausserhalb eines Vaults. */
    const internerPfad = (page) => {
        if (!page?.id)
            return '';
        const path = typeof Store.pathOf === 'function' ? Store.pathOf(page.id) : [];
        return path.map((part) => part?.text || 'Ohne Titel').join('/');
    };
    const inIndex = (map, key, page) => {
        if (!key)
            return;
        const list = map.get(key) || [];
        if (!list.some(candidate => candidate.id === page.id))
            list.push(page);
        map.set(key, list);
    };
    /** Ein flüchtiger Index; er ist Ableitung und niemals ein zweiter Speicher. */
    const baueSeitenIndex = (pages = seiten()) => {
        const byName = new Map(), byPath = new Map();
        pages.forEach(page => {
            inIndex(byName, normalisiereSeitennamen(page.text), page);
            aliasesVon(page).forEach(alias => inIndex(byName, normalisiereSeitennamen(alias), page));
            inIndex(byPath, normalisiereVaultPfad(page.obsidianPath), page);
            inIndex(byPath, normalisiereVaultPfad(internerPfad(page)), page);
        });
        return { byName, byPath, pages };
    };
    /**
     * Eine Referenz hat genau dann ein Ziel, wenn es genau einen Kandidaten
     * gibt. Pfade und `redion:<id>` dürfen gleiche Titel ausdrücklich
     * disambiguieren; ein Alias mit zwei Besitzern wählt niemals den ersten.
     */
    const loeseSeitenverweisMitIndex = (name, index) => {
        const requested = String(name ?? '').trim();
        /* Obsidian hängt Überschrift oder Blockkennung an das Seitensziel. Die
           Stelle gehört nicht zur Identität der Seite und bleibt im Text stehen. */
        const raw = requested.replace(/(?:#|\^).*$/, '').trim();
        const direct = raw.match(/^redion:([0-9a-f-]{16,64})$/i);
        if (direct) {
            const page = index.pages.find(candidate => candidate.id.toLowerCase() === direct[1]?.toLowerCase());
            return { status: page ? 'eindeutig' : 'fehlt', name: requested,
                normalized: normalisiereSeitennamen(raw), page: page || null,
                candidates: page ? [page] : [], source: page ? 'id' : 'keine' };
        }
        const pathKey = normalisiereVaultPfad(raw);
        const pathCandidates = (raw.includes('/') || /\.(?:md|markdown)$/i.test(raw))
            ? (index.byPath.get(pathKey) || []) : [];
        if (pathCandidates.length)
            return {
                status: pathCandidates.length === 1 ? 'eindeutig' : 'mehrdeutig', name: requested,
                normalized: pathKey, page: pathCandidates.length === 1 ? pathCandidates[0] : null,
                candidates: [...pathCandidates], source: 'pfad'
            };
        const normalized = normalisiereSeitennamen(raw);
        const candidates = index.byName.get(normalized) || [];
        return {
            status: candidates.length === 1 ? 'eindeutig' : candidates.length ? 'mehrdeutig' : 'fehlt',
            name: requested, normalized, page: candidates.length === 1 ? candidates[0] : null,
            candidates: [...candidates], source: candidates.length ? 'name' : 'keine'
        };
    };
    const loeseSeitenverweis = (name) => loeseSeitenverweisMitIndex(name, baueSeitenIndex());
    /** Kompatibler Name, aber jetzt Titel + Alias + Pfad und kollisionssicher. */
    const seiteMitTitel = (name) => loeseSeitenverweis(name).page;
    /** Kandidaten-API für Picker und Importe; sie verschweigt Kollisionen nicht. */
    const seitenMitTitelOderAlias = (name) => loeseSeitenverweis(name).candidates;
    /** Die kürzeste Referenz, die diese eine Seite tatsächlich eindeutig meint. */
    const referenzFuerSeite = (page) => {
        const index = baueSeitenIndex();
        const title = String(page?.text || 'Ohne Titel').trim();
        if (loeseSeitenverweisMitIndex(title, index).page?.id === page?.id)
            return title;
        for (const path of [page?.obsidianPath, internerPfad(page)]) {
            if (path && loeseSeitenverweisMitIndex(String(path), index).page?.id === page?.id)
                return String(path).replace(/\.(?:md|markdown)$/i, '');
        }
        return `redion:${page?.id || ''}`;
    };
    /** Aliasfelder bleiben normale Page-Daten; diese Funktion säubert nur. */
    const aliasesSetzen = (pageId, values) => {
        const page = Store.getBlock(pageId);
        if (!page || page.type !== 'page' || page.parentTable === 'collection')
            return null;
        const aliases = aliasesVon({ aliases: values })
            .filter(alias => normalisiereSeitennamen(alias) !== normalisiereSeitennamen(page.text));
        Store.updateBlock(page.id, { aliases });
        const collisions = aliases.map(alias => ({ alias, candidates: seitenMitTitelOderAlias(alias) }))
            .filter(entry => entry.candidates.length > 1);
        return { page, aliases, collisions };
    };
    /** Zu welcher Seite gehört ein Block? Läuft den Baum nach oben. */
    const seiteVon = (blockId) => {
        let cur = Store.getBlock(blockId);
        let schutz = 0;
        while (cur && schutz++ < 60) {
            if (cur.type === 'page' && cur.parentTable !== 'collection')
                return cur;
            if (cur.parentTable === 'collection') {
                /* Datenbankzeile: über die Sammlung zum Datenbankblock */
                const dbBlock = Object.values(Store.cache.blocks)
                    .find(b => b.collectionId === cur.parentId);
                cur = dbBlock ? Store.getBlock(dbBlock.parentId) : null;
                continue;
            }
            cur = cur.parentId ? Store.getBlock(cur.parentId) : null;
        }
        return null;
    };
    /** Öffnet die Seite mit diesem Titel — und legt sie an, wenn es sie nicht gibt. */
    const oeffneOderAnlegen = (name) => {
        const resolution = loeseSeitenverweis(name);
        if (resolution.status === 'mehrdeutig') {
            const menu = UI.menu('<div class="grp">Mehrere Seiten passen zu „' + esc(name) + '“</div>' +
                resolution.candidates.map(page => `<button data-open="${esc(page.id)}"><span class="mi">${esc(page.icon || '📄')}</span>` +
                    `<span>${esc(page.text || 'Ohne Titel')}<small>${esc(Store.pfadText(page.id) || 'Oberste Ebene')}</small></span></button>`).join(''), Math.max(12, innerWidth / 2 - 180), Math.max(12, innerHeight / 3));
            menu.addEventListener('click', (event) => {
                const button = elVon(event)?.closest('[data-open]');
                if (!button?.dataset.open)
                    return;
                menu.remove();
                App.oeffne(button.dataset.open);
            });
            UI.toast('Der Name ist mehrdeutig — bitte eine Seite wählen');
            return;
        }
        let z = resolution.page;
        if (!z) {
            z = Store.addPage(null, { text: name.trim(), icon: '📄' });
            /* Ein leerer Absatz, damit die neue Seite gleich einen Platz zum
               Schreiben hat. Der Rückgabewert wurde nie gebraucht. */
            Store.addBlock(z.id, 'text');
            UI.toast('Seite „' + name.trim() + '" angelegt');
            App.zeichneBaum();
        }
        App.oeffne(z.id);
    };
    /* ========================================================================
     * RÜCKVERWEISE
     * ------------------------------------------------------------------------
     * Wer zeigt auf diese Seite? Genau das fehlt in Notion und ist der Grund,
     * warum Logseq und Foam überhaupt entstanden sind.
     * ======================================================================*/
    const verweiseAuf = (seiteId) => {
        const p = Store.getBlock(seiteId);
        if (!p)
            return [];
        const treffer = new Map(); /* seitenId -> { seite, stellen: [] } */
        const index = baueSeitenIndex();
        Object.values(Store.cache.blocks).forEach(b => {
            if (!b.alive || !b.text)
                return;
            if (b.id === seiteId)
                return;
            const zeigtDarauf = [...String(b.text).matchAll(/\[\[([^\[\]\n|]{1,240})(?:\|[^\]\n]*)?\]\]/g)]
                .some(match => loeseSeitenverweisMitIndex(match[1] || '', index).page?.id === seiteId) ||
                new RegExp('\\(\\(' + entschaerfe(seiteId) + '\\)\\)').test(b.text);
            if (!zeigtDarauf)
                return;
            const quelle = seiteVon(b.id);
            if (!quelle || quelle.id === seiteId)
                return;
            if (!treffer.has(quelle.id))
                treffer.set(quelle.id, { seite: quelle, stellen: [] });
            treffer.get(quelle.id).stellen.push(b);
        });
        /* Unterseiten zählen auch als Verweis — das ist die Baumkante. */
        return [...treffer.values()];
    };
    /** Seiten, die den Titel erwähnen, ohne ihn zu verlinken. */
    const unverlinkt = (seiteId) => {
        const p = Store.getBlock(seiteId);
        if (!p)
            return [];
        const index = baueSeitenIndex();
        const namen = [p.text, ...aliasesVon(p)].map(value => String(value || '').trim())
            .filter(value => value.length >= 3 &&
            loeseSeitenverweisMitIndex(value, index).page?.id === seiteId)
            .sort((a, b) => b.length - a.length);
        if (!namen.length)
            return [];
        const schonVerlinkt = new Set(verweiseAuf(seiteId).map(v => v.seite.id));
        const out = new Map();
        Object.values(Store.cache.blocks).forEach(b => {
            if (!b.alive || !b.text || b.id === seiteId)
                return;
            const t = b.text.toLowerCase();
            if (!namen.some(name => t.includes(name.toLocaleLowerCase('de'))))
                return;
            const hatLink = [...String(b.text).matchAll(/\[\[([^\[\]\n|]{1,240})(?:\|[^\]\n]*)?\]\]/g)]
                .some(match => loeseSeitenverweisMitIndex(match[1] || '', index).page?.id === seiteId);
            if (hatLink)
                return;
            const quelle = seiteVon(b.id);
            if (!quelle || quelle.id === seiteId || schonVerlinkt.has(quelle.id))
                return;
            if (!out.has(quelle.id))
                out.set(quelle.id, { seite: quelle, stellen: [] });
            out.get(quelle.id).stellen.push(b);
        });
        return [...out.values()];
    };
    const entschaerfe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    /* ========================================================================
     * SCHLAGWÖRTER
     * ======================================================================*/
    const alleTags = () => {
        const map = new Map(); /* tag -> Set von Seiten-IDs */
        Object.values(Store.cache.blocks).forEach(b => {
            if (!b.alive || !b.text)
                return;
            const gefunden = b.text.match(/(^|[\s(])#([A-Za-z0-9ÄÖÜäöüß][\wÄÖÜäöüß\-\/]{1,40})/g);
            if (!gefunden)
                return;
            const quelle = seiteVon(b.id);
            if (!quelle)
                return;
            gefunden.forEach((g) => {
                const tag = g.trim().replace(/^#/, '');
                if (!map.has(tag))
                    map.set(tag, new Set());
                map.get(tag).add(quelle.id);
            });
        });
        return [...map.entries()]
            .map(([tag, set]) => ({ tag, seiten: [...set].map(id => Store.getBlock(id)).filter(Boolean) }))
            .sort((a, b) => b.seiten.length - a.seiten.length || a.tag.localeCompare(b.tag));
    };
    /* ========================================================================
     * DIE FUSSZEILE UNTER JEDER SEITE
     * ======================================================================*/
    const fusszeile = (seite, wrap) => {
        if (!seite)
            return;
        const rueck = verweiseAuf(seite.id);
        const lose = unverlinkt(seite.id);
        if (!rueck.length && !lose.length)
            return;
        const d = document.createElement('div');
        d.className = 'backlinks';
        const abschnitt = (titel, liste, klasse) => {
            if (!liste.length)
                return '';
            return `<div class="bl-head ${klasse}">${titel} <em>${liste.length}</em></div>` +
                liste.map((v) => `<div class="bl-item" data-open="${v.seite.id}">` +
                    `<div class="bl-t">${esc(v.seite.icon || '📄')} ${esc(v.seite.text || 'Ohne Titel')}</div>` +
                    v.stellen.slice(0, 3).map((s) => `<div class="bl-s">${esc((s.text || '').slice(0, 160))}</div>`).join('') +
                    `</div>`).join('');
        };
        d.innerHTML =
            abschnitt('Rückverweise', rueck, 'ein') +
                abschnitt('Unverlinkte Erwähnungen', lose, 'zwei');
        d.addEventListener('click', e => {
            const it = elVon(e)?.closest('[data-open]');
            if (it)
                App.oeffne(it.dataset.open);
        });
        wrap.appendChild(d);
    };
    /* ========================================================================
     * AUTOVERVOLLSTÄNDIGUNG BEIM TIPPEN VON [[
     * ======================================================================*/
    let picker = null;
    const pickerSchliessen = () => {
        if (picker) {
            picker.remove();
            picker = null;
        }
    };
    const textVorCursor = (ct) => {
        const s = getSelection();
        if (!s || !s.rangeCount)
            return '';
        const r = s.getRangeAt(0).cloneRange();
        r.selectNodeContents(ct);
        r.setEnd(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
        return r.toString();
    };
    /** Ersetzt das offene [[… am Ende durch [[Name]]. */
    const einsetzen = (ct, name) => {
        const b = Store.getBlock(ct.closest('.blk')?.dataset.bid);
        if (!b)
            return;
        const neu = ct.textContent.replace(/\[\[[^\[\]]*$/, '[[' + name + ']]');
        ct.textContent = neu;
        Store.updateBlock(b.id, { text: neu });
        pickerSchliessen();
        App.zeichneSeite(b.id, 'ende');
    };
    const zeigePicker = (ct, suchbegriff) => {
        pickerSchliessen();
        const q = suchbegriff.toLowerCase();
        const liste = seiten()
            .filter(p => !q || [p.text, ...aliasesVon(p), p.obsidianPath]
            .some(value => String(value || '').toLocaleLowerCase('de').includes(q)))
            .sort((a, b) => (b.edited || '').localeCompare(a.edited || ''))
            .slice(0, 8);
        const r = ct.getBoundingClientRect();
        let html = '<div class="grp">Auf Seite verlinken</div>';
        liste.forEach(p => {
            const reference = referenzFuerSeite(p);
            html += `<button data-p="${esc(reference)}"><span class="mi">${esc(p.icon || '📄')}</span>` +
                `<span>${esc(p.text || 'Ohne Titel')}` +
                (reference !== p.text ? `<small>${esc(reference)}</small>` : '') + '</span></button>';
        });
        if (suchbegriff.trim()) {
            html += '<hr><button data-p="' + esc(suchbegriff.trim()) + '" data-neu="1">' +
                '<span class="mi">✚</span>Neue Seite „' + esc(suchbegriff.trim()) + '"</button>';
        }
        if (!liste.length && !suchbegriff.trim())
            html += '<div class="grp">Noch keine Seiten</div>';
        picker = UI.menu(html, r.left, r.bottom + 4);
        picker.addEventListener('mousedown', (e) => e.preventDefault());
        picker.addEventListener('click', (e) => {
            const b = elVon(e)?.closest('button[data-p]');
            if (b && b.dataset.p)
                einsetzen(ct, b.dataset.p);
        });
        const erste = picker.querySelector('button[data-p]');
        if (erste)
            erste.classList.add('on');
    };
    /* ========================================================================
     * DER GRAPH
     * ------------------------------------------------------------------------
     * Der Graph ist eine ABLEITUNG aus den bestehenden Blöcken, Relationen und
     * Schlagwörtern. Er wird weder gespeichert noch zur zweiten Link-Wahrheit.
     * Für grosse Bestände wird nur die Nachbarschaft der aktuellen Seite
     * gezeichnet; der vollständige lineare Index dient allein zum Nachschlagen.
     * ======================================================================*/
    const normalizeGraphText = (value) => String(value ?? '')
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    const knowledgeKindForCollection = (collection) => {
        const name = normalizeGraphText(collection?.name);
        const fields = Object.values(collection?.schema || {})
            .map(field => normalizeGraphText(field?.name));
        const decisionSignals = ['entscheidung', 'begrundung', 'datum', 'status',
            'quellen', 'betroffene seiten', 'alternativen'];
        const sourceSignals = ['url', 'autor', 'datum', 'notiz', 'abrufdatum'];
        const decisionScore = decisionSignals.filter(signal => fields.includes(signal)).length;
        const sourceScore = sourceSignals.filter(signal => fields.includes(signal)).length;
        if (name.includes('entscheidung') || decisionScore >= 3)
            return 'decision';
        if (name.includes('quelle') || sourceScore >= 3)
            return 'source';
        return 'row';
    };
    /**
     * Baut einen flüchtigen Index in O(Blöcke + Relationen). `[[Links]]`
     * bleiben Text im bestehenden Blockspeicher; der Index ist nur eine
     * Lesesicht und darf jederzeit verworfen werden.
     */
    const buildGraphIndex = () => {
        const blocks = Object.values(Store.cache.blocks).filter(block => block?.alive);
        const collections = new Map(Object.values(Store.cache.collections)
            .map(collection => [collection.id, collection]));
        const nodes = new Map();
        const edges = [];
        const edgeKeys = new Set();
        const pageReferenceIndex = baueSeitenIndex();
        const pageBlocks = blocks.filter(block => block.type === 'page');
        pageBlocks.forEach(block => {
            const isRow = block.parentTable === 'collection';
            const collection = isRow ? collections.get(block.parentId) : null;
            const kind = isRow ? knowledgeKindForCollection(collection) : 'page';
            nodes.set(block.id, {
                id: block.id, rawId: block.id, name: block.text || 'Ohne Titel',
                icon: block.icon || (kind === 'decision' ? '⚖' : kind === 'source' ? '🔖' : '📄'),
                kind, edited: block.edited || '', degree: 0
            });
        });
        const addEdge = (source, target, kind) => {
            if (source === target || !nodes.has(source) || !nodes.has(target))
                return;
            const undirected = kind !== 'link';
            const first = undirected && source > target ? target : source;
            const second = undirected && source > target ? source : target;
            const key = `${kind}:${first}:${second}`;
            if (edgeKeys.has(key))
                return;
            edgeKeys.add(key);
            edges.push({ source: first, target: second, kind });
        };
        /* Die Seitenhierarchie ist eine vorhandene Beziehung, keine neue. */
        pageBlocks.forEach(page => {
            if (page.parentTable !== 'collection' && page.parentId && nodes.has(page.parentId))
                addEdge(page.parentId, page.id, 'tree');
        });
        /* Eigentümer eines Inhaltsblocks. Datenbankzeilen sind selbst Seiten
           und bleiben deshalb Endpunkt von Relationen und Links. */
        const ownerCache = new Map();
        const ownerFor = (blockId) => {
            if (ownerCache.has(blockId))
                return ownerCache.get(blockId);
            let current = Store.getBlock(blockId);
            const path = [];
            let guard = 0;
            while (current && guard++ < 60) {
                path.push(current.id);
                if (current.type === 'page' && nodes.has(current.id)) {
                    path.forEach(id => ownerCache.set(id, current));
                    return current;
                }
                current = current.parentTable === 'block' && current.parentId
                    ? Store.getBlock(current.parentId) : null;
            }
            path.forEach(id => ownerCache.set(id, null));
            return null;
        };
        const tagsByOwner = new Map();
        blocks.forEach(block => {
            if (!block.text)
                return;
            const owner = ownerFor(block.id);
            if (!owner)
                return;
            for (const match of String(block.text).matchAll(/\[\[([^\[\]\n]{1,240})\]\]/g)) {
                const target = loeseSeitenverweisMitIndex(String(match[1] || '').split('|')[0] || '', pageReferenceIndex).page;
                if (target)
                    addEdge(owner.id, target.id, 'link');
            }
            for (const match of String(block.text).matchAll(/\(\(([0-9a-f-]{6,})\)\)/gi)) {
                const targetOwner = ownerFor(match[1] || '');
                if (targetOwner)
                    addEdge(owner.id, targetOwner.id, 'link');
            }
            for (const match of String(block.text).matchAll(/(^|[\s(])#([A-Za-z0-9ÄÖÜäöüß][\wÄÖÜäöüß\-/]{1,40})/g)) {
                const shown = match[2] || '';
                const normalizedTag = normalizeGraphText(shown);
                if (!normalizedTag)
                    continue;
                if (!tagsByOwner.has(owner.id))
                    tagsByOwner.set(owner.id, new Map());
                tagsByOwner.get(owner.id)?.set(normalizedTag, shown);
            }
        });
        /* Vorhandene Datenbankrelationen. Auch wechselseitige Relationen werden
           dank der Kantenkennung nur einmal gezeichnet. */
        pageBlocks.filter(row => row.parentTable === 'collection').forEach(row => {
            const collection = collections.get(row.parentId);
            if (!collection)
                return;
            Object.entries(collection.schema || {}).forEach(([key, definition]) => {
                if (definition?.type !== 'relation')
                    return;
                const stored = row.props?.[key];
                const ids = Array.isArray(stored) ? stored : (typeof stored === 'string' ? [stored] : []);
                ids.forEach(id => { if (typeof id === 'string')
                    addEdge(row.id, id, 'relation'); });
            });
        });
        /* Tags sind virtuelle Knoten. Sie speichern nichts und verschwinden beim
           Schliessen des Graphen. #entscheidung und #quelle geben normalen
           Seiten zugleich einen klaren Typ, ohne einen neuen Blocktyp zu bauen. */
        tagsByOwner.forEach((tags, ownerId) => {
            const owner = nodes.get(ownerId);
            if (owner && tags.has('entscheidung')) {
                owner.kind = 'decision';
                owner.icon = owner.icon || '⚖';
            }
            if (owner && tags.has('quelle')) {
                owner.kind = 'source';
                owner.icon = owner.icon || '🔖';
            }
            tags.forEach((shown, normalizedTag) => {
                const id = 'tag:' + normalizedTag;
                if (!nodes.has(id))
                    nodes.set(id, {
                        id, rawId: null, name: '#' + shown, icon: '#', kind: 'tag', edited: '', degree: 0
                    });
                addEdge(ownerId, id, 'tag');
            });
        });
        const adjacency = new Map();
        nodes.forEach((_node, id) => adjacency.set(id, []));
        edges.forEach(edge => {
            adjacency.get(edge.source)?.push(edge);
            adjacency.get(edge.target)?.push(edge);
            const source = nodes.get(edge.source), target = nodes.get(edge.target);
            if (source)
                source.degree++;
            if (target)
                target.degree++;
        });
        return {
            nodes, edges, adjacency,
            pageCount: pageBlocks.filter(page => page.parentTable !== 'collection').length,
            rowCount: pageBlocks.filter(page => page.parentTable === 'collection').length
        };
    };
    const graphEdgeAllowedFrom = (edge, nodeId, filters) => {
        if (edge.kind === 'link')
            return edge.source === nodeId ? filters.links : filters.backlinks;
        if (edge.kind === 'relation')
            return filters.relations;
        if (edge.kind === 'tag')
            return filters.tags;
        return filters.tree;
    };
    const graphOtherEnd = (edge, nodeId) => edge.source === nodeId ? edge.target : edge.source;
    const GRAPH_NODE_LIMIT = 320;
    const DEFAULT_GRAPH_FILTERS = {
        links: true, backlinks: true, relations: true, tags: false, tree: true, nodeKind: 'all'
    };
    /** Eine begrenzte Nachbarschaft für Tiefe 1/2 plus ausdrücklich erweiterte Knoten. */
    const buildGraphSlice = (index, centerId, depth = 1, filters = DEFAULT_GRAPH_FILTERS, expandedIds = []) => {
        if (!index.nodes.has(centerId))
            return { centerId, nodes: [], edges: [], truncated: false };
        const included = new Set([centerId]);
        let frontier = [centerId];
        let truncated = false;
        const kindAllowed = (id) => id === centerId || filters.nodeKind === 'all' ||
            index.nodes.get(id)?.kind === filters.nodeKind;
        const includeNeighbors = (ids) => {
            const next = [];
            for (const id of ids) {
                for (const edge of index.adjacency.get(id) || []) {
                    if (!graphEdgeAllowedFrom(edge, id, filters))
                        continue;
                    const other = graphOtherEnd(edge, id);
                    if (!kindAllowed(other) || included.has(other))
                        continue;
                    if (included.size >= GRAPH_NODE_LIMIT) {
                        truncated = true;
                        continue;
                    }
                    included.add(other);
                    next.push(other);
                }
            }
            return next;
        };
        for (let level = 0; level < Math.max(1, Math.min(2, depth)); level++) {
            frontier = includeNeighbors(frontier);
            if (!frontier.length)
                break;
        }
        includeNeighbors([...expandedIds].filter(id => included.has(id)));
        const edgeVisible = (edge) => {
            if (edge.kind === 'link')
                return filters.links || filters.backlinks;
            if (edge.kind === 'relation')
                return filters.relations;
            if (edge.kind === 'tag')
                return filters.tags;
            return filters.tree;
        };
        const nodes = [...included].map(id => index.nodes.get(id)).filter(Boolean);
        nodes.sort((a, b) => (a.id === centerId ? -1 : b.id === centerId ? 1 :
            b.degree - a.degree || a.name.localeCompare(b.name, 'de')));
        const edges = index.edges.filter(edge => included.has(edge.source) && included.has(edge.target) &&
            edgeVisible(edge));
        return { centerId, nodes, edges, truncated };
    };
    const analyzeKnowledgeGraph = (index) => {
        const entities = [...index.nodes.values()].filter(node => node.kind !== 'tag');
        const structuralDegree = new Map(entities.map(node => [node.id, 0]));
        index.edges.filter(edge => edge.kind !== 'tag').forEach(edge => {
            if (structuralDegree.has(edge.source))
                structuralDegree.set(edge.source, (structuralDegree.get(edge.source) || 0) + 1);
            if (structuralDegree.has(edge.target))
                structuralDegree.set(edge.target, (structuralDegree.get(edge.target) || 0) + 1);
        });
        const orphans = entities.filter(node => (structuralDegree.get(node.id) || 0) === 0)
            .sort((a, b) => a.name.localeCompare(b.name, 'de'));
        const hubs = [...entities].sort((a, b) => (structuralDegree.get(b.id) || 0) - (structuralDegree.get(a.id) || 0) ||
            a.name.localeCompare(b.name, 'de')).filter(node => (structuralDegree.get(node.id) || 0) >= 2).slice(0, 12);
        const visited = new Set();
        const areas = [];
        for (const entity of entities) {
            if (visited.has(entity.id))
                continue;
            const queue = [entity.id], component = [];
            visited.add(entity.id);
            while (queue.length) {
                const id = queue.shift();
                if (!id)
                    continue;
                component.push(id);
                for (const edge of index.adjacency.get(id) || []) {
                    if (edge.kind === 'tag')
                        continue;
                    const other = graphOtherEnd(edge, id);
                    if (!structuralDegree.has(other) || visited.has(other))
                        continue;
                    visited.add(other);
                    queue.push(other);
                }
            }
            if (component.length < 3)
                continue;
            const ids = new Set(component);
            const edgeCount = index.edges.filter(edge => edge.kind !== 'tag' &&
                ids.has(edge.source) && ids.has(edge.target)).length;
            /* Ein reiner Baum ist verbunden, aber noch kein stark verbundener
               Bereich. Mindestens ein zusätzlicher Weg (Kreis/Querverweis) muss da sein. */
            if (edgeCount < component.length)
                continue;
            const density = 2 * edgeCount / (component.length * (component.length - 1));
            areas.push({ nodeIds: component, edgeCount, density });
        }
        areas.sort((a, b) => b.density - a.density || b.edgeCount - a.edgeCount);
        return {
            orphans, hubs, areas,
            decisions: entities.filter(node => node.kind === 'decision').length,
            sources: entities.filter(node => node.kind === 'source').length
        };
    };
    const createKnowledgeObject = (kind) => {
        const today = new Date().toISOString().slice(0, 10);
        const base = kind === 'decision' ? `Entscheidung · ${today}` : `Quelle · ${today}`;
        let title = base, suffix = 2;
        while (seitenMitTitelOderAlias(title).length)
            title = base + ' · ' + suffix++;
        const current = Store.getBlock(App.aktuelleSeite?.());
        const parentId = current?.type === 'page' && current.parentTable !== 'collection' ? current.id : null;
        const page = Store.addPage(parentId, {
            text: title, icon: kind === 'decision' ? '⚖' : '🔖'
        });
        const lines = kind === 'decision' ? [
            '#entscheidung', 'Entscheidung: ', 'Begründung: ', `Datum: ${today}`,
            'Status: vorgeschlagen', 'Quellen: [[Quelle]]',
            'Betroffene Seiten: [[Seite]]', 'Alternativen: '
        ] : [
            '#quelle', 'URL: ', 'Autor: ', 'Datum: ', 'Notiz: ', `Abrufdatum: ${today}`
        ];
        lines.forEach(text => Store.addBlock(page.id, 'text', { text }));
        App.zeichneBaum();
        App.oeffne(page.id);
        UI.toast(kind === 'decision' ? 'Entscheidungsseite angelegt' : 'Quellenseite angelegt');
        return page;
    };
    /* Rückwärtsverträglicher Messweg aus P7. Die alte Form wird weiterhin
       geliefert, aber aus demselben linearen Index wie der neue Teilgraph. */
    const graphVorbereiten = () => {
        const index = buildGraphIndex();
        const entityNodes = [...index.nodes.values()].filter(node => node.kind !== 'tag');
        const positions = new Map(entityNodes.map((node, i) => [node.id, i]));
        const knoten = entityNodes.map((node, i) => ({
            id: node.id, name: node.name, icon: node.icon,
            x: Math.cos(i / Math.max(1, entityNodes.length) * Math.PI * 2) * 200,
            y: Math.sin(i / Math.max(1, entityNodes.length) * Math.PI * 2) * 200,
            vx: 0, vy: 0, grad: node.degree, kind: node.kind
        }));
        const kanten = index.edges.filter(edge => edge.kind !== 'tag')
            .map(edge => ({ a: positions.get(edge.source), b: positions.get(edge.target),
            art: edge.kind === 'tree' ? 'baum' : edge.kind }))
            .filter(edge => edge.a !== undefined && edge.b !== undefined);
        return { knoten, kanten, index };
    };
    const graph = () => {
        const index = buildGraphIndex();
        /* OHNE OFFENE SEITE NIMMT DER GRAPH DIE ZULETZT BEARBEITETE (E137).
           Vorher stand hier nur „Öffne zuerst eine Seite für ihren Teilgraphen".
           Das war richtig, solange die App auf einer Seite startete. Seit E132
           ist die Startansicht das Heute-Dashboard, und das ist KEINE Seite —
           `App.aktuelleSeite()` gibt dort nichts zurück. Damit war der Satz
           nicht mehr die Ausnahme, sondern der Normalfall: wer nach dem Start
           Strg+Umschalt+G drückte, bekam eine Absage statt eines Graphen.
    
           Die zuletzt bearbeitete Seite ist die ehrlichste Wahl — sie ist das,
           woran man zuletzt war. Gibt es überhaupt keine Seite, bleibt es bei
           der Absage; dann ist sie wahr. */
        const offen = App.aktuelleSeite?.() || '';
        const zuletzt = () => {
            let beste = '', wann = '';
            index.nodes.forEach((_knoten, id) => {
                const block = Store.getBlock(id);
                if (!block || block.type !== 'page' || block.alive === false)
                    return;
                const zeit = String(block.edited || block.created || '');
                if (zeit > wann) {
                    wann = zeit;
                    beste = id;
                }
            });
            return beste;
        };
        /* `let`, nicht `const` (E253): die Suche macht ihren Treffer zum neuen
           Mittelpunkt — der Graph baut sich dann um ihn statt um die offene
           Seite. `center` bleibt der ERSTE Mittelpunkt; er dient nur noch als
           Rückfall für die Knotenkarte. */
        let centerId = index.nodes.has(offen) ? offen : zuletzt();
        const center = index.nodes.get(centerId);
        if (!center) {
            UI.toast('Noch keine Seiten für den Graphen');
            return undefined;
        }
        const analysis = analyzeKnowledgeGraph(index);
        const directLinks = index.edges.filter(edge => edge.kind === 'link' && edge.source === centerId).length;
        const directBacklinks = index.edges.filter(edge => edge.kind === 'link' && edge.target === centerId).length;
        const directRelations = index.edges.filter(edge => edge.kind === 'relation' &&
            (edge.source === centerId || edge.target === centerId)).length;
        const overlay = document.createElement('div');
        overlay.className = 'overlay graph-overlay';
        overlay.innerHTML =
            '<div class="graph-box" role="dialog" aria-modal="true" aria-labelledby="graph-title">' +
                '<div class="graph-head"><b id="graph-title">Wissensgraph</b>' +
                `<span class="graph-info">Direkt: ${directLinks} Links · ${directBacklinks} Rückverweise · ` +
                `${directRelations} Relationen</span>` +
                '<button type="button" class="icon-btn" data-a="zu" aria-label="Graph schliessen">✕</button>' +
                '</div>' +
                '<div class="graph-controls" aria-label="Graph filtern">' +
                /* DIE SUCHE ZUERST (E253). Der Graph zeigt nur den Ausschnitt um
                   den Mittelpunkt — wer eine BESTIMMTE Seite im Geflecht sucht,
                   musste sie bisher erst im Editor öffnen und den Graphen neu
                   aufmachen. Tippen listet Treffer aus dem GANZEN Index im
                   Seitenfeld; Klick oder Enter springt hin. */
                '<input type="search" class="graph-suche" data-graph-suche ' +
                'placeholder="Knoten suchen …" aria-label="Knoten im Graphen suchen" ' +
                'autocomplete="off" spellcheck="false">' +
                '<fieldset><legend>Tiefe</legend>' +
                '<button type="button" data-graph-depth="1" aria-pressed="true">1</button>' +
                '<button type="button" data-graph-depth="2" aria-pressed="false">2</button></fieldset>' +
                '<fieldset><legend>Verbindungen</legend>' +
                '<label><input type="checkbox" data-graph-edge="links" checked> Links</label>' +
                '<label><input type="checkbox" data-graph-edge="backlinks" checked> Rückverweise</label>' +
                '<label><input type="checkbox" data-graph-edge="relations" checked> Relationen</label>' +
                '<label><input type="checkbox" data-graph-edge="tags"> Tags</label>' +
                '<label><input type="checkbox" data-graph-edge="tree" checked> Unterseiten</label></fieldset>' +
                '<label class="graph-kind">Knotentyp<select data-graph-kind>' +
                '<option value="all">Alle</option><option value="page">Seiten</option>' +
                '<option value="decision">Entscheidungen</option><option value="source">Quellen</option>' +
                '<option value="row">Datenbankzeilen</option><option value="tag">Tags</option>' +
                '</select></label>' +
                `<button type="button" data-graph-analysis="orphans">Verwaiste (${analysis.orphans.length})</button>` +
                `<button type="button" data-graph-analysis="areas">Bereiche (${analysis.areas.length})</button>` +
                '<span class="graph-grow"></span>' +
                '<button type="button" data-graph-new="decision">+ Entscheidung</button>' +
                '<button type="button" data-graph-new="source">+ Quelle</button>' +
                '</div>' +
                '<div class="graph-body"><div class="graph-stage">' +
                '<canvas tabindex="0" aria-label="Teilgraph der aktuellen Seite"></canvas></div>' +
                '<aside class="graph-panel" aria-live="polite"></aside></div>' +
                '<div class="hint">Klick wählt einen Knoten · Doppelklick öffnet ihn · ' +
                '„Nachbarn erweitern“ lädt genau eine weitere Stufe. Der Graph wird nur lokal berechnet.</div>' +
                '</div>';
        document.body.appendChild(overlay);
        const canvas = overlay.querySelector('canvas');
        const context = canvas?.getContext('2d');
        const panel = overlay.querySelector('.graph-panel');
        const info = overlay.querySelector('.graph-info');
        if (!canvas || !context || !panel || !info)
            return overlay;
        const abort = new AbortController();
        const signal = abort.signal;
        let running = true, depth = 1, selectedId = centerId, panelMode = 'node';
        let sucheWort = '';
        let filters = { ...DEFAULT_GRAPH_FILTERS };
        const expanded = new Set();
        const positions = new Map();
        let visibleSlice = buildGraphSlice(index, centerId, depth, filters, expanded);
        let offsetX = 0, offsetY = 0, zoom = 1, settleFrames = 0;
        const color = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();
        const kindName = (kind) => ({
            page: 'Seite', row: 'Datenbankzeile', decision: 'Entscheidung',
            source: 'Quelle', tag: 'Schlagwort'
        })[kind];
        const close = () => {
            if (!running)
                return;
            running = false;
            abort.abort();
            observer.disconnect();
            overlay.remove();
        };
        const openNode = (id) => {
            const node = index.nodes.get(id);
            if (!node?.rawId)
                return;
            close();
            App.oeffne(node.rawId);
        };
        /* Treffer aus dem GANZEN Index, nicht nur dem sichtbaren Ausschnitt —
           das ist der Sinn der Suche: finden, was der Ausschnitt gerade nicht
           zeigt. Gedeckelt wie die Verwaisten-Liste. */
        const sucheTreffer = () => {
            const wort = sucheWort.trim().toLowerCase();
            if (!wort)
                return [];
            return [...index.nodes.values()]
                .filter(node => node.kind !== 'tag' && node.name.toLowerCase().includes(wort))
                .slice(0, 80);
        };
        const springeZu = (id) => {
            if (!index.nodes.has(id))
                return;
            selectedId = id;
            /* Liegt der Treffer ausserhalb des Ausschnitts, wird er der neue
               Mittelpunkt — sonst zeigte die Karte einen Knoten, den das Bild
               nicht enthält. Liegt er drin, reicht das Auswählen. */
            if (!visibleSlice.nodes.some(node => node.id === id))
                centerId = id;
            panelMode = 'node';
            render();
        };
        const showPanel = () => {
            if (panelMode === 'suche') {
                const treffer = sucheTreffer();
                panel.innerHTML = '<h2>Suche</h2>' +
                    (treffer.length
                        ? '<div class="graph-panel-list">' + treffer.map(node => `<button type="button" data-graph-ziel="${esc(node.id)}"><span>${esc(node.icon)}</span>` +
                            `<span>${esc(node.name)}</span><em>${kindName(node.kind)}</em></button>`).join('') + '</div>'
                        : `<div class="graph-empty">Nichts gefunden zu „${esc(sucheWort.trim())}“.</div>`);
                return;
            }
            if (panelMode === 'orphans') {
                panel.innerHTML = '<h2>Verwaiste Seiten</h2>' +
                    '<p>Ohne Link, Rückverweis, Relation oder Unterseite. Tags allein zählen nicht als Verbindung.</p>' +
                    (analysis.orphans.length ? '<div class="graph-panel-list">' + analysis.orphans.slice(0, 120).map(node => `<button type="button" data-graph-open="${esc(node.id)}"><span>${esc(node.icon)}</span>` +
                        `<span>${esc(node.name)}</span></button>`).join('') + '</div>' :
                        '<div class="graph-empty">Keine verwaisten Seiten.</div>');
                return;
            }
            if (panelMode === 'areas') {
                panel.innerHTML = '<h2>Stark verbundene Bereiche</h2>' +
                    '<p>Mindestens drei Knoten und mindestens ein zusätzlicher Querweg; reine Bäume zählen nicht.</p>' +
                    (analysis.areas.length ? analysis.areas.slice(0, 12).map((area, i) => {
                        const areaNodes = area.nodeIds.map(id => index.nodes.get(id)).filter(Boolean);
                        return `<div class="graph-area"><b>Bereich ${i + 1}</b><span>${areaNodes.length} Knoten · ` +
                            `${area.edgeCount} Verbindungen</span><button type="button" data-graph-select="${esc(areaNodes[0]?.id || '')}">` +
                            `${esc(areaNodes.slice(0, 4).map(node => node.name).join(' · '))}</button></div>`;
                    }).join('') : '<div class="graph-empty">Noch kein Bereich mit einem Querweg.</div>') +
                    '<h3>Viele Verbindungen</h3><div class="graph-panel-list">' +
                    analysis.hubs.map(node => `<button type="button" data-graph-select="${esc(node.id)}">` +
                        `<span>${esc(node.icon)}</span><span>${esc(node.name)}</span><em>${node.degree}</em></button>`).join('') +
                    '</div>';
                return;
            }
            const selected = index.nodes.get(selectedId) || center;
            const canExpand = visibleSlice.nodes.some(node => node.id === selected.id);
            panel.innerHTML = `<h2>${esc(selected.icon)} ${esc(selected.name)}</h2>` +
                `<p>${kindName(selected.kind)} · ${selected.degree} Verbindungen` +
                /* „Mittelpunkt des Graphen", nicht „aktuelle Seite": seit die
                   Suche recentert (E253), ist der Mittelpunkt nicht mehr immer
                   die offene Seite — das alte Wort wäre dann eine Behauptung. */
                (selected.id === centerId ? ' · Mittelpunkt des Graphen' : '') + '</p>' +
                '<div class="graph-panel-actions">' +
                (selected.rawId ? `<button type="button" data-graph-open="${esc(selected.id)}">Öffnen</button>` : '') +
                (canExpand ? `<button type="button" data-graph-expand="${esc(selected.id)}"` +
                    (expanded.has(selected.id) ? ' disabled' : '') + '>' +
                    (expanded.has(selected.id) ? 'Nachbarn erweitert' : 'Nachbarn erweitern') + '</button>' : '') +
                '</div><h3>Sichtbare Knoten</h3><div class="graph-panel-list">' +
                visibleSlice.nodes.map(node => `<button type="button" data-graph-select="${esc(node.id)}"` +
                    (node.id === selected.id ? ' class="on" aria-current="true"' : '') + '>' +
                    `<span>${esc(node.icon)}</span><span>${esc(node.name)}</span><em>${kindName(node.kind)}</em></button>`).join('') +
                '</div>';
        };
        const ensurePositions = () => {
            visibleSlice.nodes.forEach((node, i) => {
                if (positions.has(node.id))
                    return;
                if (node.id === centerId) {
                    positions.set(node.id, { x: 0, y: 0, vx: 0, vy: 0 });
                    return;
                }
                const angle = (i * 2.399963229728653) % (Math.PI * 2);
                const radius = 95 + Math.sqrt(i) * 34;
                positions.set(node.id, {
                    x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, vx: 0, vy: 0
                });
            });
        };
        const resize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            if (!rect)
                return;
            const ratio = devicePixelRatio || 1;
            canvas.width = Math.max(1, Math.round(rect.width * ratio));
            canvas.height = Math.max(1, Math.round(rect.height * ratio));
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            settleFrames = Math.max(settleFrames, 1);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(canvas.parentElement || canvas);
        const render = () => {
            visibleSlice = buildGraphSlice(index, centerId, depth, filters, expanded);
            ensurePositions();
            settleFrames = 260;
            if (!visibleSlice.nodes.some(node => node.id === selectedId))
                selectedId = centerId;
            info.textContent = `${visibleSlice.nodes.length} von ${index.nodes.size} Knoten · ` +
                `${visibleSlice.edges.length} Verbindungen` +
                (visibleSlice.truncated ? ` · auf ${GRAPH_NODE_LIMIT} begrenzt` : '') +
                ` · ${analysis.decisions} Entscheidungen · ${analysis.sources} Quellen`;
            overlay.querySelectorAll('[data-graph-depth]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.graphDepth) === depth)));
            showPanel();
        };
        /* Räumliche Zellen vergleichen pro Knoten höchstens 9 × 28 Nachbarn.
           Anders als die alte Paar-Schleife bleibt ein Bild damit O(Knoten +
           Kanten), auch wenn der Teilgraph seine Obergrenze erreicht. */
        const simulate = () => {
            const bucketSize = 96, maxPerBucket = 28;
            const buckets = new Map();
            visibleSlice.nodes.forEach(node => {
                const point = positions.get(node.id);
                if (!point)
                    return;
                const key = `${Math.floor(point.x / bucketSize)}:${Math.floor(point.y / bucketSize)}`;
                const bucket = buckets.get(key) || [];
                if (bucket.length < maxPerBucket)
                    bucket.push(node.id);
                buckets.set(key, bucket);
            });
            visibleSlice.nodes.forEach(node => {
                const point = positions.get(node.id);
                if (!point)
                    return;
                const cx = Math.floor(point.x / bucketSize), cy = Math.floor(point.y / bucketSize);
                for (let dxCell = -1; dxCell <= 1; dxCell++)
                    for (let dyCell = -1; dyCell <= 1; dyCell++) {
                        for (const otherId of buckets.get(`${cx + dxCell}:${cy + dyCell}`) || []) {
                            if (otherId <= node.id)
                                continue;
                            const other = positions.get(otherId);
                            if (!other)
                                continue;
                            const dx = other.x - point.x, dy = other.y - point.y;
                            const distanceSquared = dx * dx + dy * dy + 4;
                            if (distanceSquared > bucketSize * bucketSize * 3)
                                continue;
                            const distance = Math.sqrt(distanceSquared), force = 900 / distanceSquared;
                            point.vx -= force * dx / distance;
                            point.vy -= force * dy / distance;
                            other.vx += force * dx / distance;
                            other.vy += force * dy / distance;
                        }
                    }
            });
            visibleSlice.edges.forEach(edge => {
                const source = positions.get(edge.source), target = positions.get(edge.target);
                if (!source || !target)
                    return;
                const dx = target.x - source.x, dy = target.y - source.y;
                const distance = Math.sqrt(dx * dx + dy * dy) + 0.01;
                const desired = edge.kind === 'tag' ? 78 : 112;
                const force = (distance - desired) * 0.012;
                source.vx += force * dx / distance;
                source.vy += force * dy / distance;
                target.vx -= force * dx / distance;
                target.vy -= force * dy / distance;
            });
            visibleSlice.nodes.forEach(node => {
                const point = positions.get(node.id);
                if (!point)
                    return;
                if (node.id === centerId) {
                    point.x = 0;
                    point.y = 0;
                    point.vx = 0;
                    point.vy = 0;
                    return;
                }
                point.vx = (point.vx - point.x * 0.0015) * 0.84;
                point.vy = (point.vy - point.y * 0.0015) * 0.84;
                point.x += point.vx;
                point.y += point.vy;
            });
        };
        const draw = () => {
            const width = canvas.width, height = canvas.height, ratio = devicePixelRatio || 1;
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.clearRect(0, 0, width, height);
            context.setTransform(ratio * zoom, 0, 0, ratio * zoom, width / 2 + offsetX * ratio, height / 2 + offsetY * ratio);
            visibleSlice.edges.forEach(edge => {
                const source = positions.get(edge.source), target = positions.get(edge.target);
                if (!source || !target)
                    return;
                context.strokeStyle = edge.kind === 'link' ? color('--accent') :
                    edge.kind === 'relation' ? color('--c-green') :
                        edge.kind === 'tag' ? color('--c-yellow') : color('--line');
                context.globalAlpha = edge.kind === 'tree' ? 0.45 : 0.78;
                context.setLineDash(edge.kind === 'link' ? [5, 4] : edge.kind === 'tag' ? [2, 5] : []);
                context.beginPath();
                context.moveTo(source.x, source.y);
                context.lineTo(target.x, target.y);
                context.stroke();
            });
            context.setLineDash([]);
            context.globalAlpha = 1;
            context.textAlign = 'center';
            context.font = '12px ' + color('--font');
            visibleSlice.nodes.forEach(node => {
                const point = positions.get(node.id);
                if (!point)
                    return;
                const radius = node.id === centerId ? 13 : 6 + Math.min(7, node.degree * 1.25);
                context.fillStyle = node.kind === 'decision' ? color('--c-purple') :
                    node.kind === 'source' ? color('--c-yellow') : node.kind === 'row' ? color('--c-green') :
                        node.kind === 'tag' ? color('--text-faint') : color('--accent');
                context.beginPath();
                context.arc(point.x, point.y, radius, 0, Math.PI * 2);
                context.fill();
                if (node.id === selectedId) {
                    context.strokeStyle = color('--text');
                    context.lineWidth = 2;
                    context.beginPath();
                    context.arc(point.x, point.y, radius + 4, 0, Math.PI * 2);
                    context.stroke();
                }
                context.fillStyle = color('--text');
                context.fillText(node.name.slice(0, 24), point.x, point.y + radius + 14);
            });
        };
        const loop = () => {
            if (!running || !overlay.isConnected)
                return;
            if (settleFrames > 0) {
                simulate();
                settleFrames--;
            }
            draw();
            requestAnimationFrame(loop);
        };
        const hitNode = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            const x = (clientX - rect.left - rect.width / 2 - offsetX) / zoom;
            const y = (clientY - rect.top - rect.height / 2 - offsetY) / zoom;
            let hit = null, best = 28 * 28;
            visibleSlice.nodes.forEach(node => {
                const point = positions.get(node.id);
                if (!point)
                    return;
                const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
                if (distance < best) {
                    best = distance;
                    hit = node;
                }
            });
            return hit;
        };
        let dragging = false, lastX = 0, lastY = 0, moved = 0;
        canvas.addEventListener('mousedown', event => {
            dragging = true;
            lastX = event.clientX;
            lastY = event.clientY;
            moved = 0;
        }, { signal });
        addEventListener('mousemove', event => {
            if (!dragging)
                return;
            offsetX += event.clientX - lastX;
            offsetY += event.clientY - lastY;
            moved += Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY);
            lastX = event.clientX;
            lastY = event.clientY;
        }, { signal });
        addEventListener('mouseup', () => { dragging = false; }, { signal });
        canvas.addEventListener('wheel', event => {
            event.preventDefault();
            zoom = Math.max(0.3, Math.min(3, zoom * (event.deltaY < 0 ? 1.12 : 0.89)));
        }, { passive: false, signal });
        canvas.addEventListener('click', event => {
            if (moved > 6)
                return;
            const hit = hitNode(event.clientX, event.clientY);
            if (hit) {
                selectedId = hit.id;
                panelMode = 'node';
                showPanel();
            }
        }, { signal });
        canvas.addEventListener('dblclick', event => {
            const hit = hitNode(event.clientX, event.clientY);
            if (hit)
                openNode(hit.id);
        }, { signal });
        overlay.addEventListener('change', event => {
            const input = elVon(event)?.closest('input[data-graph-edge]');
            if (input) {
                const key = input.dataset.graphEdge;
                if (key === 'links')
                    filters.links = input.checked;
                if (key === 'backlinks')
                    filters.backlinks = input.checked;
                if (key === 'relations')
                    filters.relations = input.checked;
                if (key === 'tags')
                    filters.tags = input.checked;
                if (key === 'tree')
                    filters.tree = input.checked;
                panelMode = 'node';
                render();
                return;
            }
            const select = elVon(event)?.closest('select[data-graph-kind]');
            if (select) {
                filters.nodeKind = select.value;
                panelMode = 'node';
                render();
            }
        }, { signal });
        overlay.addEventListener('click', event => {
            const element = elVon(event);
            if (event.target === overlay || element?.closest('[data-a="zu"]')) {
                close();
                return;
            }
            const depthButton = element?.closest('[data-graph-depth]');
            if (depthButton) {
                depth = Number(depthButton.dataset.graphDepth) === 2 ? 2 : 1;
                panelMode = 'node';
                render();
                return;
            }
            const analysisButton = element?.closest('[data-graph-analysis]');
            if (analysisButton) {
                panelMode = analysisButton.dataset.graphAnalysis === 'orphans' ? 'orphans' : 'areas';
                showPanel();
                return;
            }
            const selectButton = element?.closest('[data-graph-select]');
            if (selectButton?.dataset.graphSelect) {
                selectedId = selectButton.dataset.graphSelect;
                panelMode = 'node';
                showPanel();
                return;
            }
            const zielButton = element?.closest('[data-graph-ziel]');
            if (zielButton?.dataset.graphZiel) {
                springeZu(zielButton.dataset.graphZiel);
                return;
            }
            const expandButton = element?.closest('[data-graph-expand]');
            if (expandButton?.dataset.graphExpand) {
                expanded.add(expandButton.dataset.graphExpand);
                panelMode = 'node';
                render();
                return;
            }
            const openButton = element?.closest('[data-graph-open]');
            if (openButton?.dataset.graphOpen) {
                openNode(openButton.dataset.graphOpen);
                return;
            }
            const newButton = element?.closest('[data-graph-new]');
            if (newButton?.dataset.graphNew === 'decision' || newButton?.dataset.graphNew === 'source') {
                const kind = newButton.dataset.graphNew;
                close();
                createKnowledgeObject(kind);
                return;
            }
        }, { signal });
        overlay.addEventListener('input', event => {
            const feld = elVon(event)?.closest('[data-graph-suche]');
            if (!feld)
                return;
            sucheWort = feld.value;
            panelMode = sucheWort.trim() ? 'suche' : 'node';
            showPanel();
        }, { signal });
        overlay.addEventListener('keydown', event => {
            const feld = elVon(event)?.closest('[data-graph-suche]');
            if (!feld || event.key !== 'Enter')
                return;
            const erster = sucheTreffer()[0];
            if (erster)
                springeZu(erster.id);
        }, { signal });
        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape')
                return;
            /* ESCAPE IM SUCHFELD LEERT ERST DIE SUCHE (E253). Dieser Horcher
               läuft in der capture-Phase — VOR dem Feld selbst; ein
               stopPropagation am Feld käme also zu spät. Die Ausnahme muss
               deshalb hier stehen: Feld mit Inhalt → leeren, Graph bleibt.
               Wer wirklich schliessen will, drückt noch einmal (§38: kein
               Überraschungs-Zuschlag mitten im Tippen). */
            const feld = event.target instanceof HTMLInputElement &&
                event.target.closest('.graph-overlay') &&
                event.target.matches('[data-graph-suche]') ? event.target : null;
            if (feld && feld.value) {
                event.stopPropagation();
                feld.value = '';
                sucheWort = '';
                panelMode = 'node';
                showPanel();
                return;
            }
            close();
        }, { capture: true, signal });
        addEventListener('resize', resize, { signal });
        resize();
        render();
        loop();
        return overlay;
    };
    /* ========================================================================
     * SCHLAGWORT-REGISTER
     * ======================================================================*/
    const tagRegister = (vorgewaehlt = '') => {
        const tags = alleTags();
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(680px,94vw)">' +
                '<div class="fh">Schlagwörter <em>' + tags.length + '</em></div>' +
                '<div class="res" id="tagres"></div>' +
                '<div class="hint">Ein Schlagwort setzt du, indem du irgendwo <code>#wort</code> schreibst.</div>' +
                '</div>';
        document.body.appendChild(o);
        const res = o.querySelector('#tagres');
        const zeichne = (aktiv) => {
            if (!res)
                return;
            if (!tags.length) {
                res.innerHTML = '<div style="padding:16px; color:var(--text-faint); font-size:14px">' +
                    'Noch keine Schlagwörter vergeben.</div>';
                return;
            }
            res.innerHTML =
                '<div class="tagwolke">' + tags.map(t => `<button class="tagpill${t.tag === aktiv ? ' on' : ''}" data-t="${esc(t.tag)}">` +
                    `#${esc(t.tag)} <em>${t.seiten.length}</em></button>`).join('') + '</div>' +
                    (aktiv ? (tags.find(t => t.tag === aktiv)?.seiten || []).map(p => `<button data-open="${p.id}"><span>${esc(p.icon || '📄')}</span>` +
                        `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span></button>`).join('') : '');
        };
        zeichne(vorgewaehlt || (tags[0] && tags[0].tag));
        o.addEventListener('click', e => {
            const t = elVon(e)?.closest('[data-t]');
            if (t) {
                zeichne(t.dataset.t);
                return;
            }
            const p = elVon(e)?.closest('[data-open]');
            if (p) {
                o.remove();
                App.oeffne(p.dataset.open);
                return;
            }
            if (e.target === o)
                o.remove();
        });
    };
    /* ========================================================================
     * START — globale Klicks und das Tippen überwachen
     * ======================================================================*/
    const start = () => {
        /* Klick auf einen Seitenlink, ein Schlagwort oder einen Blockverweis */
        document.addEventListener('click', e => {
            const wl = elVon(e)?.closest('a.wl');
            if (wl) {
                e.preventDefault();
                oeffneOderAnlegen(wl.dataset.wl ?? '');
                return;
            }
            const tg = elVon(e)?.closest('a.tg');
            if (tg) {
                e.preventDefault();
                tagRegister(tg.dataset.tag);
                return;
            }
            const bl = elVon(e)?.closest('a.bl');
            if (bl) {
                e.preventDefault();
                const ziel = Store.getBlock(bl.dataset.bref);
                if (!ziel)
                    return;
                const s = seiteVon(ziel.id);
                if (s && s.id !== App.aktuelleSeite())
                    App.oeffne(s.id);
                setTimeout(() => {
                    const el = document.querySelector(`[data-bid="${ziel.id}"]`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('blitz');
                        setTimeout(() => el.classList.remove('blitz'), 1400);
                    }
                }, 80);
            }
        });
        /* [[ tippen öffnet die Seitenauswahl */
        document.getElementById('page')?.addEventListener('input', e => {
            const ct = elVon(e)?.closest('.ct');
            if (!ct) {
                pickerSchliessen();
                return;
            }
            const vor = textVorCursor(ct);
            const m = vor.match(/\[\[([^\[\]]*)$/);
            if (m)
                zeigePicker(ct, m[1]);
            else
                pickerSchliessen();
        });
        document.addEventListener('keydown', e => {
            if (!picker)
                return;
            const btns = [...picker.querySelectorAll('button[data-p]')];
            const aktiv = picker.querySelector('button.on');
            const i = btns.indexOf(aktiv);
            if (e.key === 'Escape') {
                pickerSchliessen();
                e.stopPropagation();
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (aktiv)
                    aktiv.classList.remove('on');
                const j = e.key === 'ArrowDown' ? (i + 1) % btns.length : (i - 1 + btns.length) % btns.length;
                if (btns[j])
                    btns[j].classList.add('on');
                return;
            }
            if (e.key === 'Enter' && (aktiv || btns[0])) {
                e.preventDefault();
                const ct = document.activeElement?.closest?.('.ct');
                const knopf = aktiv || btns[0];
                if (ct && knopf && knopf.dataset.p)
                    einsetzen(ct, knopf.dataset.p);
            }
        }, true);
    };
    return {
        start, inline, seiten, seiteMitTitel, seitenMitTitelOderAlias, loeseSeitenverweis,
        aliasesVon, aliasesSetzen, referenzFuerSeite, seiteVon, oeffneOderAnlegen,
        verweiseAuf, unverlinkt, alleTags, fusszeile, graphVorbereiten, graph, tagRegister
    };
})();
window.Links = Links;
/* Verweise und Rückverweise in der Kontextkante (E272 Phase F).
   `verweiseAuf(id)` ist dieselbe Quelle wie die Fusszeile der Seite — eine
   zweite Suche über den Index wäre derselbe Lauf zweimal. */
if (typeof Register !== 'undefined' && Register.kontext) {
    Register.kontext.melde({
        bereich: 'editor', id: 'verweise', name: 'Verweise',
        zeichen: 'link', rang: 60,
        liefern: () => {
            let id = '';
            try {
                id = String(App.aktuelleSeite() || '');
            }
            catch {
                id = '';
            }
            if (!id)
                return [];
            let treffer = [];
            try {
                treffer = Links.verweiseAuf(id) || [];
            }
            catch {
                treffer = [];
            }
            if (!treffer.length)
                return [{ id: 'keine',
                        name: 'Noch verweist nichts hierher.', tun: () => { } }];
            return treffer.slice(0, 20).map((b) => ({
                id: 'ref-' + b.id, name: String(b.text || 'Ohne Titel'),
                zeichen: 'page', tun: () => { try {
                    App.oeffne(b.id);
                }
                catch { /* … */ } }
            }));
        }
    });
}
