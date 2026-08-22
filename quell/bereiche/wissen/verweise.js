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
        .replace(/\[\[([^\[\]\n]{1,120})\]\]/g, (_, roh) => {
        const name = roh.trim();
        const ziel = seiteMitTitel(name);
        return `<a class="wl${ziel ? '' : ' neu'}" data-wl="${esc(name)}" ` +
            `title="${ziel ? 'Seite öffnen' : 'Seite anlegen'}">${esc(name)}</a>`;
    })
        /* #stichwort — nur am Wortanfang, damit URLs mit # unberührt bleiben */
        .replace(/(^|[\s(>])#([A-Za-z0-9ÄÖÜäöüß][\wÄÖÜäöüß\-\/]{1,40})/g, (_, vor, tag) => `${vor}<a class="tg" data-tag="${esc(tag)}">#${esc(tag)}</a>`);
    /* ========================================================================
     * NACHSCHLAGEN
     * ======================================================================*/
    /** Alle echten Seiten (keine Datenbankzeilen, nichts im Papierkorb). */
    const seiten = () => Object.values(Store.cache.blocks)
        .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection');
    const seiteMitTitel = (name) => {
        const n = name.trim().toLowerCase();
        return seiten().find(p => (p.text || '').trim().toLowerCase() === n) || null;
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
        let z = seiteMitTitel(name);
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
        const titel = (p.text || '').trim().toLowerCase();
        const treffer = new Map(); /* seitenId -> { seite, stellen: [] } */
        Object.values(Store.cache.blocks).forEach(b => {
            if (!b.alive || !b.text)
                return;
            if (b.id === seiteId)
                return;
            const zeigtDarauf = (titel && new RegExp('\\[\\[\\s*' + entschaerfe(titel) + '\\s*\\]\\]', 'i').test(b.text)) ||
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
        const titel = (p?.text || '').trim();
        if (titel.length < 3)
            return [];
        const n = titel.toLowerCase();
        const schonVerlinkt = new Set(verweiseAuf(seiteId).map(v => v.seite.id));
        const out = new Map();
        Object.values(Store.cache.blocks).forEach(b => {
            if (!b.alive || !b.text || b.id === seiteId)
                return;
            const t = b.text.toLowerCase();
            if (!t.includes(n))
                return;
            if (t.includes('[[' + n))
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
            .filter(p => !q || (p.text || '').toLowerCase().includes(q))
            .sort((a, b) => (b.edited || '').localeCompare(a.edited || ''))
            .slice(0, 8);
        const r = ct.getBoundingClientRect();
        let html = '<div class="grp">Auf Seite verlinken</div>';
        liste.forEach(p => {
            html += `<button data-p="${esc(p.text || '')}"><span class="mi">${esc(p.icon || '📄')}</span>` +
                `<span>${esc(p.text || 'Ohne Titel')}</span></button>`;
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
     * Kein fertiges Diagrammpaket, sondern eine kleine Kräftesimulation:
     * verbundene Punkte ziehen sich an, alle Punkte stossen sich ab.
     * ======================================================================*/
    /**
     * Baut Knoten und Kanten ohne Oberfläche. Vorher suchte jeder `[[Link]]`
     * sein Ziel mit `seiten().find(...)`: bei 10 000 Seiten und 10 000 Links
     * waren das bis zu hundert Millionen Vergleiche. Titel, Sammlungen und
     * Blockbesitzer werden jetzt je einmal indiziert. Der Helfer ist zugleich
     * der messbare Produktweg für den Grossbestandslauf.
     */
    const graphVorbereiten = () => {
        const alle = seiten();
        const idx = new Map(alle.map((p, i) => [p.id, i]));
        const titel = new Map();
        alle.forEach(p => {
            const n = (p.text || '').trim().toLowerCase();
            if (n && !titel.has(n))
                titel.set(n, p);
        });
        const dbNachSammlung = new Map();
        Object.values(Store.cache.blocks).forEach(b => {
            if (b.alive && b.type === 'database' && b.collectionId)
                dbNachSammlung.set(b.collectionId, b);
        });
        const besitzer = new Map();
        const seiteFuer = (blockId) => {
            if (besitzer.has(blockId))
                return besitzer.get(blockId);
            let cur = Store.getBlock(blockId), n = 0;
            const weg = [];
            while (cur && n++ < 60) {
                weg.push(cur.id);
                if (cur.type === 'page' && cur.parentTable !== 'collection') {
                    weg.forEach(id => besitzer.set(id, cur));
                    return cur;
                }
                if (cur.parentTable === 'collection') {
                    const dbBlock = dbNachSammlung.get(cur.parentId);
                    cur = dbBlock ? Store.getBlock(dbBlock.parentId) : null;
                }
                else
                    cur = cur.parentId ? Store.getBlock(cur.parentId) : null;
            }
            weg.forEach(id => besitzer.set(id, null));
            return null;
        };
        const knoten = alle.map((p, i) => ({
            id: p.id, name: p.text || 'Ohne Titel', icon: p.icon || '📄',
            x: Math.cos(i / alle.length * 6.283) * 200 + (i % 7) * 9,
            y: Math.sin(i / alle.length * 6.283) * 200 + (i % 5) * 9,
            vx: 0, vy: 0, grad: 0
        }));
        const kanten = [];
        const merke = (a, b, art) => {
            if (a === b)
                return;
            const ia = idx.get(a), ib = idx.get(b);
            if (ia === undefined || ib === undefined)
                return;
            const ka = knoten[ia], kb = knoten[ib];
            if (!ka || !kb)
                return;
            kanten.push({ a: ia, b: ib, art });
            ka.grad++;
            kb.grad++;
        };
        alle.forEach(p => { if (p.parentId && idx.has(p.parentId))
            merke(p.parentId, p.id, 'baum'); });
        Object.values(Store.cache.blocks).forEach(b => {
            if (!b.alive || !b.text)
                return;
            const quelle = seiteFuer(b.id);
            if (!quelle)
                return;
            (b.text.match(/\[\[([^\[\]\n]{1,120})\]\]/g) || []).forEach((m) => {
                const ziel = titel.get(m.slice(2, -2).trim().toLowerCase());
                if (ziel)
                    merke(quelle.id, ziel.id, 'link');
            });
        });
        return { knoten, kanten };
    };
    const graph = () => {
        const vorbereitet = graphVorbereiten();
        let knoten = vorbereitet.knoten;
        let kanten = vorbereitet.kanten;
        if (!knoten.length) {
            UI.toast('Noch keine Seiten für den Graphen');
            return undefined;
        }
        /* Die Kräftesimulation vergleicht jedes Paar. 10 000² Vergleiche pro
           Bild frieren den Tab ein; die Messung lag schon für die reine alte
           Vorbereitung bei 3,5 s. Ab 600 zeigt der Graph daher den verbundensten
           Ausschnitt und sagt das offen. Sämtliche Daten bleiben im Bestand und
           die Vorbereitung zählt weiterhin alle Kanten. */
        const gesamtKnoten = knoten.length;
        const gesamtKanten = kanten.length;
        const MAX_GRAPH_KNOTEN = 600;
        if (knoten.length > MAX_GRAPH_KNOTEN) {
            const aktuell = typeof App !== 'undefined' ? App.aktuelleSeite() : '';
            const ausgewaehlt = knoten.map((n, i) => ({ i, n }))
                .sort((a, b) => (b.n.id === aktuell ? 1 : 0) - (a.n.id === aktuell ? 1 : 0) ||
                b.n.grad - a.n.grad || a.n.name.localeCompare(b.n.name))
                .slice(0, MAX_GRAPH_KNOTEN);
            const altZuNeu = new Map();
            ausgewaehlt.forEach((x, i) => altZuNeu.set(x.i, i));
            knoten = ausgewaehlt.map((x, i) => ({ ...x.n,
                x: Math.cos(i / MAX_GRAPH_KNOTEN * 6.283) * 200 + (i % 7) * 9,
                y: Math.sin(i / MAX_GRAPH_KNOTEN * 6.283) * 200 + (i % 5) * 9,
                vx: 0, vy: 0 }));
            kanten = kanten.filter((k) => altZuNeu.has(k.a) && altZuNeu.has(k.b))
                .map((k) => ({ ...k, a: altZuNeu.get(k.a), b: altZuNeu.get(k.b) }));
        }
        /* Oberfläche */
        const o = document.createElement('div');
        o.className = 'overlay graph-overlay';
        o.innerHTML =
            '<div class="graph-box">' +
                '<div class="graph-head"><b>Graph</b>' +
                `<span class="graph-info">${gesamtKnoten > knoten.length ?
                    (knoten.length + ' von ' + gesamtKnoten) : knoten.length} Seiten · ` +
                `${kanten.length}${gesamtKanten > kanten.length ? ' von ' + gesamtKanten : ''} Verbindungen</span>` +
                '<button class="icon-btn" data-a="zu">✕</button>' +
                '</div>' +
                '<canvas></canvas>' +
                '<div class="hint">' + (gesamtKnoten > knoten.length
                ? 'Ausschnitt der am stärksten verbundenen Seiten · ' : '') +
                'Ziehen verschiebt die Ansicht · Klick öffnet die Seite · ' +
                'Linien: durchgezogen = Unterseite, gestrichelt = [[Link]]</div>' +
                '</div>';
        document.body.appendChild(o);
        /* Die Zeichenfläche und ihr Zeichenwerkzeug. Fehlt eines von beiden —
           in einem Browser ohne Canvas oder wenn das Fenster schon wieder zu
           ist —, gibt es keinen Graphen zu malen, und das Fenster bleibt mit
           seinem Hinweis stehen statt zu werfen. */
        const cv = o.querySelector('canvas');
        const ctx = cv && cv.getContext('2d');
        if (!cv || !ctx)
            return o;
        let kx = 0, ky = 0, zoom = 1;
        const groesse = () => {
            const eltern = cv.parentElement;
            if (!eltern)
                return;
            const r = eltern.getBoundingClientRect();
            cv.width = r.width * devicePixelRatio;
            cv.height = (r.height - 92) * devicePixelRatio;
            cv.style.width = r.width + 'px';
            cv.style.height = (r.height - 92) + 'px';
        };
        groesse();
        addEventListener('resize', groesse);
        const farbe = (name) => getComputedStyle(document.body).getPropertyValue(name).trim();
        let laeuft = true;
        const schritt = () => {
            /* Abstossung */
            for (let i = 0; i < knoten.length; i++) {
                const ki = knoten[i];
                if (!ki)
                    continue;
                for (let j = i + 1; j < knoten.length; j++) {
                    const kj = knoten[j];
                    if (!kj)
                        continue;
                    const dx = kj.x - ki.x, dy = kj.y - ki.y;
                    const d2 = dx * dx + dy * dy + 0.01;
                    const f = 1400 / d2;
                    const d = Math.sqrt(d2);
                    ki.vx -= f * dx / d;
                    ki.vy -= f * dy / d;
                    kj.vx += f * dx / d;
                    kj.vy += f * dy / d;
                }
            }
            /* Anziehung entlang der Kanten */
            kanten.forEach(k => {
                const a = knoten[k.a], b = knoten[k.b];
                if (!a || !b)
                    return;
                const dx = b.x - a.x, dy = b.y - a.y;
                const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
                const f = (d - 110) * 0.012;
                a.vx += f * dx / d;
                a.vy += f * dy / d;
                b.vx -= f * dx / d;
                b.vy -= f * dy / d;
            });
            /* Zur Mitte ziehen und bremsen */
            knoten.forEach(n => {
                n.vx -= n.x * 0.0016;
                n.vy -= n.y * 0.0016;
                n.vx *= 0.86;
                n.vy *= 0.86;
                n.x += n.vx;
                n.y += n.vy;
            });
        };
        const zeichne = () => {
            const w = cv.width, h = cv.height, dpr = devicePixelRatio;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, w, h);
            ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, w / 2 + kx * dpr, h / 2 + ky * dpr);
            ctx.lineWidth = 1;
            kanten.forEach(k => {
                const a = knoten[k.a], b = knoten[k.b];
                if (!a || !b)
                    return;
                ctx.strokeStyle = k.art === 'link' ? farbe('--accent') : farbe('--line');
                ctx.setLineDash(k.art === 'link' ? [4, 4] : []);
                ctx.globalAlpha = k.art === 'link' ? 0.75 : 0.5;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            });
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
            ctx.textAlign = 'center';
            ctx.font = '12px ' + farbe('--font');
            knoten.forEach(n => {
                const r = 5 + Math.min(9, n.grad * 1.6);
                ctx.fillStyle = n.grad ? farbe('--accent') : farbe('--text-faint');
                ctx.beginPath();
                ctx.arc(n.x, n.y, r, 0, 6.284);
                ctx.fill();
                ctx.fillStyle = farbe('--text');
                ctx.fillText(n.name.slice(0, 22), n.x, n.y + r + 13);
            });
        };
        const schleife = () => {
            if (!laeuft || !document.body.contains(o))
                return;
            schritt();
            zeichne();
            requestAnimationFrame(schleife);
        };
        schleife();
        /* Ziehen, Zoomen, Klicken */
        let zieht = false, zx = 0, zy = 0, bewegt = 0;
        cv.addEventListener('mousedown', e => { zieht = true; zx = e.clientX; zy = e.clientY; bewegt = 0; });
        addEventListener('mousemove', e => {
            if (!zieht)
                return;
            kx += e.clientX - zx;
            ky += e.clientY - zy;
            bewegt += Math.abs(e.clientX - zx) + Math.abs(e.clientY - zy);
            zx = e.clientX;
            zy = e.clientY;
        });
        addEventListener('mouseup', () => { zieht = false; });
        cv.addEventListener('wheel', e => {
            e.preventDefault();
            zoom = Math.max(0.25, Math.min(3, zoom * (e.deltaY < 0 ? 1.12 : 0.89)));
        }, { passive: false });
        cv.addEventListener('click', e => {
            if (bewegt > 6)
                return;
            const r = cv.getBoundingClientRect();
            const mx = (e.clientX - r.left - r.width / 2 - kx) / zoom;
            const my = (e.clientY - r.top - r.height / 2 - ky) / zoom;
            let beste = null, bd = 26 * 26;
            knoten.forEach(n => {
                const d = (n.x - mx) ** 2 + (n.y - my) ** 2;
                if (d < bd) {
                    bd = d;
                    beste = n;
                }
            });
            if (beste) {
                laeuft = false;
                o.remove();
                App.oeffne(beste.id);
            }
        });
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                laeuft = false;
                o.remove();
            }
        });
        return o;
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
        start, inline, seiten, seiteMitTitel, seiteVon, oeffneOderAnlegen,
        verweiseAuf, unverlinkt, alleTags, fusszeile, graphVorbereiten, graph, tagRegister
    };
})();
window.Links = Links;
