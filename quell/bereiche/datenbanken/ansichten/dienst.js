"use strict";
/* ============================================================================
 * apps/tabellen/ansichten/dienst.js — aus notion.js herausgelöst
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/datenbanken/ansichten/dienst.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/datenbanken/ansichten/dienst.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js. Der Inhalt ist unverändert;
 * nur der Ort ist jetzt der, an dem man ihn sucht.
 * ==========================================================================*/
const Ansichten = (() => {
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    /**
     * Zwei Handgriffe, die in dieser Datei elfmal gebraucht werden.
     *
     * `flaeche()` holt die Bühne (`#page`) und die Brotkrume (`#crumb`) — oder
     * nichts, wenn die Schale noch nicht steht. Vorher stand hier
     * `document.getElementById('crumb').innerHTML = …` ohne Nachsehen; das ist
     * derselbe Fund wie in `hinweis.ts`, nur an einer Stelle, die beim Start
     * läuft.
     */
    const flaeche = () => {
        const wrap = document.getElementById('page');
        const crumb = document.getElementById('crumb');
        return wrap && crumb ? { wrap, crumb } : null;
    };
    /** Das angeklickte Element — oder nichts, wenn es kein Element war. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const gruss = () => {
        const h = new Date().getHours();
        const name = Store.getMeta('nutzer', '');
        const teil = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
        return teil + (name && name !== 'Ich' ? ', ' + name : '');
    };
    /* --------------------------------------------------------------------------
     * SICHERUNGSSTAND auf dem Start-Bildschirm
     * ---------------------------------------------------------------------------
     * Der Zeitstempel lag bisher im Verschlüsselungs-Dialog, drei Klicks tief in
     * den Einstellungen. Dort sieht ihn, wer ohnehin ans Sichern denkt. Wer
     * nicht daran denkt — und das ist der Fall, für den die Anzeige da ist —
     * kommt nie dorthin. Also steht er jetzt da, wo man jeden Morgen hinschaut.
     *
     * Abgestuft, und das ist der eigentliche Punkt. Eine Warnung, die immer
     * gleich laut ist, wird zur Tapete. Frisch gesichert heisst deshalb: eine
     * ruhige Zeile. Länger her heisst: ein Hinweis mit Knopf. Nie gesichert
     * heisst: ein Hinweis, den man nicht überliest. Die Stelle auf der Seite
     * bleibt in allen drei Fällen dieselbe, damit nichts springt.
     * ------------------------------------------------------------------------ */
    const TAG = 86400000;
    /** Ab hier erinnern (eine Woche) bzw. warnen (ein Monat). */
    const SICHERUNG_ERINNERN = 7;
    const SICHERUNG_WARNEN = 30;
    const sicherungsstand = () => {
        const wann = String(Store.getMeta('sicherung:zuletzt', '') || '');
        const art = String(Store.getMeta('sicherung:art', '') || '');
        const zeit = wann ? Date.parse(wann) : NaN;
        /* Ein unlesbarer Zeitstempel ist wie keiner — nicht wie ein frischer. */
        if (!wann || Number.isNaN(zeit))
            return { stufe: 'warnen', tage: null, art, wann: '' };
        const tage = Math.max(0, Math.floor((Date.now() - zeit) / TAG));
        const stufe = tage >= SICHERUNG_WARNEN ? 'warnen'
            : tage >= SICHERUNG_ERINNERN ? 'erinnern' : 'gut';
        return { stufe, tage, art, wann };
    };
    const sicherungBand = () => {
        const s = sicherungsstand();
        const wieLang = s.tage === null ? ''
            : s.tage === 0 ? 'heute'
                : s.tage === 1 ? 'gestern'
                    : 'vor ' + s.tage + ' Tagen';
        if (s.stufe === 'gut') {
            /* Alles in Ordnung: eine Zeile, kein Kasten, kein Ausrufezeichen. */
            const ohneAnhaenge = s.art === 'json'
                ? ' · JSON-Sicherung, ohne Anhänge' : '';
            return '<div class="home-sich home-sich-gut">' +
                `<span class="hs-zeichen">✓</span>` +
                `<span class="hs-text">Gesichert ${esc(wieLang)}` +
                `<em>${esc(Werkzeuge.zeitKurz(s.wann))}${esc(ohneAnhaenge)}</em></span>` +
                '<button class="hs-still" data-a="sichern">Sichern</button>' +
                '</div>';
        }
        const nie = s.tage === null;
        return `<div class="home-sich home-sich-${s.stufe}">` +
            `<span class="hs-zeichen">${nie ? '!' : '⏳'}</span>` +
            '<span class="hs-text">' +
            `<b>${nie ? 'Noch nie gesichert' : 'Zuletzt gesichert ' + esc(wieLang)}</b>` +
            `<em>${nie
                ? 'Deine Seiten liegen nur in diesem Browser. Eine Sicherung ist eine Datei auf deinem Gerät.'
                : 'Was seitdem entstanden ist, liegt nur in diesem Browser.'}</em>` +
            '</span>' +
            '<button class="hs-tun prim" data-a="sichern">Jetzt sichern</button>' +
            '</div>';
    };
    /* --------------------------------------------------------------------------
     * PRIVAT — die eigenen Seiten auf oberster Ebene
     * ---------------------------------------------------------------------------
     * „Zuletzt bearbeitet" beantwortet: woran war ich dran? Diese Liste
     * beantwortet: was habe ich überhaupt? Das ist auf dem Handy die
     * wichtigere Frage, weil es dort keine Seitenleiste mit dem Baum gibt.
     * ------------------------------------------------------------------------ */
    const PRIVAT_MAX = 8;
    const privatListe = () => {
        const alle = Store.rootPages().filter((p) => !p.system);
        const wurzeln = alle.slice(0, PRIVAT_MAX);
        if (!wurzeln.length)
            return '';
        const mehr = alle.length - wurzeln.length;
        return '<h2>Privat</h2><div class="home-liste">' +
            wurzeln.map((p) => {
                const kinder = Store.childrenOf(p.id)
                    .filter((k) => k.type === 'page' && k.alive).length;
                return `<button data-open="${esc(p.id)}"><span>${esc(p.icon || '📄')}</span>` +
                    `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span>` +
                    `<span class="pth">${kinder ? kinder + (kinder === 1 ? ' Unterseite' : ' Unterseiten') : ''}</span>` +
                    '</button>';
            }).join('') +
            (mehr > 0 ? `<div class="leer">und ${mehr} weitere in der Seitenleiste</div>` : '') +
            '</div>';
    };
    /* --------------------------------------------------------------------------
     * SCHNELLZUGRIFF — was der Nutzer selbst nach oben gestellt hat
     * ---------------------------------------------------------------------------
     * Der Wunsch war: „Ausbildung" und „Mediathek" als eigene Kacheln auf dem
     * Start-Bildschirm. Zwei feste Kacheln einzubauen wäre die kurze Antwort —
     * und die falsche: der Nächste braucht „Rezepte" und „Trainingsplan", und
     * dann stehen vier Kacheln da, die niemand bestellt hat.
     *
     * Redion kennt bereits einen Begriff dafür, dass etwas wichtig ist: den
     * Stern. Wer eine Seite mit ★ markiert, stellt sie damit nach oben — in der
     * Seitenleiste und ab jetzt auch hier. Kein zweites Anheften, kein
     * Einstellungsdialog, keine Liste, die man doppelt pflegt.
     *
     * Vier Stück, mehr nicht. Der Schnellzugriff soll der erste Blick sein,
     * nicht das Inhaltsverzeichnis; alles Weitere steht in der Seitenleiste.
     * ------------------------------------------------------------------------ */
    const SCHNELL_MAX = 4;
    const schnellKarten = () => {
        const sterne = Links.seiten()
            .filter((p) => p.favorite && !p.system)
            .sort((a, b) => (b.edited || '').localeCompare(a.edited || ''))
            .slice(0, SCHNELL_MAX);
        if (!sterne.length)
            return '';
        return '<h2>Schnellzugriff</h2><div class="home-karten">' +
            sterne.map((p) => {
                const kinder = Store.childrenOf(p.id)
                    .filter((k) => k.type === 'page' && k.alive).length;
                const unten = kinder
                    ? kinder + (kinder === 1 ? ' Unterseite' : ' Unterseiten')
                    : Werkzeuge.zeitKurz(p.edited);
                return `<button class="hk" data-open="${esc(p.id)}">` +
                    `<b>${esc(p.icon || '📄')} ${esc(p.text || 'Ohne Titel')}</b>` +
                    `<span>${esc(unten)}</span></button>`;
            }).join('') +
            '</div>';
    };
    const start = () => {
        const f = flaeche();
        if (!f)
            return;
        const { wrap, crumb } = f;
        App.setzeSeite(null);
        crumb.innerHTML = '<a>🏠 Start</a>';
        const zuletzt = Object.values(Store.cache.blocks)
            .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection' && !b.system)
            .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 6);
        const offen = Werkzeuge.erinnerungen().filter((e) => !e.erledigt);
        const karten = Werkzeuge.faellig().length;
        const journalHeute = Store.getMeta('sys:journal') &&
            Store.childrenOf(Store.getMeta('sys:journal')).some((k) => (k.text || '').startsWith(new Date().toISOString().slice(0, 10)));
        wrap.className = '';
        wrap.innerHTML =
            `<div class="home">` +
                `<h1>${esc(gruss())}</h1>` +
                '<div class="home-karten">' +
                `<button class="hk" data-a="journal"><b>📅 Tagesjournal</b>` +
                `<span>${journalHeute ? 'Heutiger Eintrag ist angelegt' : 'Heutigen Eintrag anlegen'}</span></button>` +
                `<button class="hk" data-a="memo"><b>⚡ Schnellnotiz</b><span>Gedanken sofort festhalten</span></button>` +
                `<button class="hk" data-a="lernen"><b>🎴 Karteikarten</b>` +
                /* „1 Karten fällig" stand hier, seit es die Karte gibt. */
                `<span>${karten ? karten + (karten === 1 ? ' Karte fällig' : ' Karten fällig')
                    : 'Keine Karten fällig'}</span></button>` +
                `<button class="hk" data-a="graph"><b>🕸 Graph</b><span>Wie alles zusammenhängt</span></button>` +
                '</div>' +
                sicherungBand() +
                schnellKarten() +
                '<h2>Zuletzt bearbeitet</h2>' +
                '<div class="home-liste">' +
                (zuletzt.length ? zuletzt.map((p) => `<button data-open="${p.id}"><span>${esc(p.icon || '📄')}</span>` +
                    `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span>` +
                    `<span class="pth">${esc(Werkzeuge.zeitKurz(p.edited))}</span></button>`).join('')
                    : '<div class="leer">Noch keine Seiten</div>') +
                '</div>' +
                (offen.length
                    ? '<h2>Anstehende Erinnerungen</h2><div class="home-liste">' +
                        offen.sort((a, b) => a.zeit.localeCompare(b.zeit)).slice(0, 5).map((e) => `<button data-open="${e.pageId}"><span>⏰</span><span style="flex:1">${esc(e.text)}</span>` +
                            `<span class="pth">${esc(new Date(e.zeit).toLocaleString('de-DE'))}</span></button>`).join('') +
                        '</div>'
                    : '') +
                privatListe() +
                `<h2>Dein Arbeitsbereich</h2>` +
                `<div class="home-zahlen">` +
                zahl(Links.seiten().length, 'Seiten') +
                zahl(Object.keys(Store.cache.collections).length, 'Datenbanken') +
                zahl(Links.alleTags().length, 'Schlagwörter') +
                zahl(Werkzeuge.karten().length, 'Karteikarten') +
                `</div>` +
                '</div>';
        wrap.addEventListener('click', e => {
            const ziel = elVon(e);
            const o = ziel?.closest('[data-open]');
            if (o) {
                App.oeffne(o.dataset['open']);
                return;
            }
            const a = ziel?.closest('[data-a]');
            if (!a)
                return;
            if (a.dataset['a'] === 'journal')
                Werkzeuge.journal();
            if (a.dataset['a'] === 'memo')
                Werkzeuge.schnellnotizen();
            if (a.dataset['a'] === 'lernen')
                Werkzeuge.lernen();
            if (a.dataset['a'] === 'graph')
                Links.graph();
            /* Der Knopf im Sicherungsband — derselbe Weg wie in den Einstellungen.
               Danach den Start-Bildschirm neu zeichnen, damit die Anzeige stimmt;
               wer sichert, will sehen, dass es gezählt hat. */
            if (a.dataset['a'] === 'sichern') {
                void Promise.resolve(App.sicherungSpeichern()).then(() => {
                    if (document.getElementById('page')?.querySelector('.home-sich'))
                        start();
                });
            }
        });
    };
    const zahl = (n, name) => `<div class="hz"><b>${n}</b><span>${name}</span></div>`;
    const posteingang = () => {
        const erinner = Werkzeuge.erinnerungen();
        const meld = Werkzeuge.meldungen();
        const kommentare = [];
        Links.seiten().forEach((p) => Kommentare.alle(p.id).forEach((k) => kommentare.push({ seite: p, ...k })));
        /* Was direkt an mich gerichtet ist — @Name in einem offenen Kommentar */
        const anMich = Kommentare.anMich();
        const geaendert = Object.values(Store.cache.blocks)
            .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
            .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 8);
        const f = flaeche();
        if (!f)
            return;
        const { wrap, crumb } = f;
        App.setzeSeite(null);
        crumb.innerHTML = '<a>📥 Posteingang</a>';
        wrap.className = '';
        const nichts = !erinner.length && !kommentare.length && !meld.length && !anMich.length;
        wrap.innerHTML =
            '<div class="home">' +
                '<h1>📥 Posteingang</h1>' +
                (nichts
                    ? Hinweis.leer({
                        zeichen: '☑',
                        gross: 'Du bist auf dem neuesten Stand!',
                        klein: 'Bei @-Erwähnungen, Kommentaren und Erinnerungen ' +
                            'wirst du hier benachrichtigt',
                        handlung: 'Filter ändern',
                        daten: 'data-filter="1"'
                    })
                    : '') +
                /* Direkt an mich gerichtet — steht ganz oben, wie in Notion */
                (anMich.length
                    ? '<h2>An dich gerichtet</h2><div class="home-liste">' +
                        anMich.map((m) => `<button data-open="${m.block.parentId}" data-komm="${m.k.id}">` +
                            '<span>@</span>' +
                            `<span style="flex:1">${esc(m.k.text)}` +
                            `<em style="opacity:.6"> — ${esc(m.k.autor || 'jemand')}</em></span>` +
                            `<span style="opacity:.5">${Werkzeuge.zeitKurz(m.k.zeit)}</span></button>`).join('') +
                        '</div>'
                    : '') +
                /* Was Automationen gemeldet haben — Notions „Send notification to" */
                (meld.length
                    ? '<h2>Benachrichtigungen</h2><div class="home-liste">' +
                        meld.slice(0, 30).map((m) => `<button data-meld="${m.id}"${m.seite ? ` data-open="${m.seite}"` : ''}>` +
                            `<span>${m.gelesen ? '🔕' : '🔔'}</span>` +
                            `<span style="flex:1">${esc(m.text)}` +
                            (m.quelle ? `<em style="opacity:.6"> — ${esc(m.quelle)}</em>` : '') + '</span>' +
                            `<span style="opacity:.5">${Werkzeuge.zeitKurz(m.wann)}</span></button>`).join('') +
                        '</div>'
                    : '') +
                '<h2>Erinnerungen</h2><div class="home-liste">' +
                (erinner.length ? erinner.slice().sort((a, b) => b.zeit.localeCompare(a.zeit)).map((e) => `<button data-open="${e.pageId}"><span>${e.erledigt ? '✅' : '⏰'}</span>` +
                    `<span style="flex:1">${esc(e.text)}</span>` +
                    `<span class="pth">${esc(new Date(e.zeit).toLocaleString('de-DE'))}</span></button>`).join('')
                    : '<div class="leer">Keine Erinnerungen</div>') +
                '</div>' +
                '<h2>Kommentare</h2><div class="home-liste">' +
                (kommentare.length ? kommentare.slice(0, 12).map((k) => `<button data-open="${k.seite.id}"><span>${k.k.erledigt ? '✅' : '💬'}</span>` +
                    `<span style="flex:1">${esc(k.k.text)}<span class="snip">${esc(k.seite.text || 'Ohne Titel')}</span></span>` +
                    `<span class="pth">${esc(Werkzeuge.zeitKurz(k.k.zeit))}</span></button>`).join('')
                    : '<div class="leer">Keine Kommentare</div>') +
                '</div>' +
                '<h2>Zuletzt geändert</h2><div class="home-liste">' +
                geaendert.map((p) => `<button data-open="${p.id}"><span>${esc(p.icon || '📄')}</span>` +
                    `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span>` +
                    `<span class="pth">${esc(Werkzeuge.zeitKurz(p.edited))}</span></button>`).join('') +
                '</div>' +
                '</div>';
        wrap.addEventListener('click', e => {
            const ziel = elVon(e);
            /* Eine Benachrichtigung gilt als gelesen, sobald man sie antippt */
            const m = ziel?.closest('[data-meld]');
            if (m && m.dataset['meld'])
                Werkzeuge.meldungGelesen(m.dataset['meld']);
            const o = ziel?.closest('[data-open]');
            if (o) {
                App.oeffne(o.dataset['open']);
                return;
            }
            if (m) {
                posteingang();
                return;
            }
            if (ziel?.closest('[data-filter]'))
                posteingangFilter(ziel);
        });
    };
    /** Was soll im Posteingang auftauchen? */
    const posteingangFilter = (anker) => {
        const jetzt = Store.getMeta('posteingangFilter', { erinnerungen: true, kommentare: true, geaendert: true });
        const r = anker.getBoundingClientRect();
        const m = UI.menu('<div class="grp">Im Posteingang zeigen</div>' +
            [['erinnerungen', '⏰ Erinnerungen'], ['kommentare', '💬 Kommentare'],
                ['geaendert', '📄 Zuletzt geändert']]
                .map(([id, n]) => `<button data-x="${id}">${n}` +
                `<span class="ms">${jetzt[id] === false ? 'aus' : 'an'}</span></button>`).join(''), r.left, r.bottom + 6, { titel: 'Filter' });
        m.addEventListener('click', (e) => {
            const b = elVon(e)?.closest('[data-x]');
            const x = b?.dataset['x'];
            if (!x)
                return;
            jetzt[x] = jetzt[x] === false;
            Store.setMeta('posteingangFilter', jetzt);
            m.remove();
            posteingang();
        });
    };
    /* ==========================================================================
     * DER SEITEN-BEREICH  (E38)
     * --------------------------------------------------------------------------
     * Hier stand am Telefon einmal „Chats". Redion ist aber keine Chat-App:
     * die KI ist ein Werkzeug, kein Hauptbereich. Sie bleibt unten in der
     * Leiste („KI fragen") und im R-Blatt erreichbar — der Platz oben gehört
     * dem, was man täglich sucht.
     *
     * Fünf Abschnitte, und jeder erscheint nur, wenn er etwas enthält. Ein
     * leerer Abschnitt mit Überschrift ist eine Behauptung ohne Inhalt; er
     * kostet Platz und sagt nichts.
     * ========================================================================*/
    const seiten = () => {
        const f = flaeche();
        if (!f)
            return;
        const { wrap, crumb } = f;
        App.setzeSeite(null);
        crumb.innerHTML = '<a>📄 Seiten</a>';
        const alle = Object.values(Store.cache.blocks)
            .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection' && !b.system);
        const kuerzlich = [...alle]
            .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 6);
        const sterne = alle.filter(b => b.fav);
        const privat = alle.filter(b => !b.parentId);
        const datenbanken = Object.values(Store.cache.collections || {});
        const vorlagen = (() => {
            try {
                return (Register.vorlagen?.alle?.() || []).slice(0, 6);
            }
            catch {
                return [];
            }
        })();
        const zeit = (p) => {
            const d = p.edited ? new Date(p.edited) : null;
            if (!d || isNaN(d.getTime()))
                return '';
            const heute = new Date();
            heute.setHours(0, 0, 0, 0);
            return d.getTime() >= heute.getTime()
                ? 'Heute ' + d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
                : d.toLocaleDateString('de-CH', { day: '2-digit', month: 'short' });
        };
        const zeile = (p, rechts = '') => `<button data-open="${esc(p.id)}"><span>${esc(p.icon || '📄')}</span>` +
            `<span class="pt">${esc(p.text || 'Ohne Titel')}</span>` +
            (rechts ? `<span class="pth">${esc(rechts)}</span>` : '') + '</button>';
        const block = (titel, inhalt) => inhalt ? `<h2>${esc(titel)}</h2><div class="home-liste">${inhalt}</div>` : '';
        wrap.className = '';
        wrap.innerHTML =
            '<div class="home">' +
                '<h1>Seiten</h1>' +
                '<div class="home-karten">' +
                '<button class="hk" data-a="neu"><b>✚ Neue Seite</b>' +
                '<span>Leere Seite anlegen</span></button>' +
                '<button class="hk" data-a="memo"><b>⚡ Schnellnotiz</b>' +
                '<span>Gedanken sofort festhalten</span></button>' +
                '</div>' +
                block('Kürzlich verwendet', kuerzlich.map(p => zeile(p, zeit(p))).join('')) +
                block('Favoriten', sterne.map(p => zeile(p)).join('')) +
                block('Privat', privat.map(p => zeile(p, (() => {
                    const n = (p.content || []).filter((k) => {
                        const kind = Store.getBlock(k);
                        return kind && kind.type === 'page' && kind.alive;
                    }).length;
                    return n ? n + (n === 1 ? ' Unterseite' : ' Unterseiten') : '';
                })())).join('')) +
                block('Datenbanken', datenbanken.map((c) => `<button data-db="${esc(c.id)}"><span>${esc(c.icon || '📊')}</span>` +
                    `<span class="pt">${esc(c.name || 'Ohne Namen')}</span>` +
                    `<span class="pth">${(Store.rowsOf(c.id) || []).length} Zeilen</span></button>`).join('')) +
                block('Vorlagen', vorlagen.map((v) => `<button data-vorlage="${esc(v.id || v.name)}"><span>${esc(v.icon || '🧩')}</span>` +
                    `<span class="pt">${esc(v.name || v.titel || 'Vorlage')}</span></button>`).join('')) +
                '<div class="home-liste" style="margin-top:22px">' +
                '<button data-a="papierkorb"><span>🗑</span><span class="pt">Papierkorb</span></button>' +
                '</div>' +
                '</div>';
        wrap.onclick = (e) => {
            const el = (e.target instanceof Element) ? e.target : null;
            const auf = el?.closest('[data-open]');
            if (auf?.dataset.open) {
                App.oeffne(auf.dataset.open);
                return;
            }
            const db = el?.closest('[data-db]');
            if (db?.dataset.db) {
                /* Eine Sammlung selbst ist keine Seite — geöffnet wird der Block,
                   der sie zeigt. Findet sich keiner, bleibt die Ansicht stehen,
                   statt in eine leere Seite zu springen. */
                const traeger = Object.values(Store.cache.blocks)
                    .find(b => b && b.collectionId === db.dataset.db && b.alive);
                if (traeger)
                    App.oeffne(traeger.parentId || traeger.id);
                return;
            }
            const a = el?.closest('[data-a]');
            if (!a)
                return;
            if (a.dataset.a === 'neu')
                App.neueSeite();
            else if (a.dataset.a === 'memo')
                Werkzeuge.schnellnotizen();
            else if (a.dataset.a === 'papierkorb')
                App.papierkorb();
        };
    };
    /* ========================================================================
     * TERMINE — der dritte Bereich am Telefon
     * ------------------------------------------------------------------------
     * VORHER ÖFFNETE DIESER REITER DIE SCHUBLADE, also die Seitenleiste des
     * Rechners auf 390 px geschoben — genau das, was das R-Blatt für den
     * Kreis links oben abgeschafft hat (E38). Gemessen am 6. August: die
     * Zeilen kamen zwar aus `Meeting.seitenleiste`, standen aber in einem
     * Behälter, der für 260 px Breite und einen Mauszeiger gebaut ist.
     *
     * Jetzt dieselben Angaben auf der Bühne, in Fingerzeilen: was ansteht,
     * und was aus Besprechungen entstanden ist.
     *
     * Die Daten kommen über `App` und `Store` — kein Bereich greift in einen
     * anderen hinein (Architekturregel 1). `Kalender` und `Meeting` werden
     * nur angetippt, wenn es sie gibt; fehlt eines, fehlt die Zeile und nicht
     * die Ansicht.
     * ========================================================================*/
    const termine = () => {
        const f = flaeche();
        if (!f)
            return;
        const { wrap, crumb } = f;
        App.setzeSeite(null);
        crumb.innerHTML = '<a>📅 Termine</a>';
        const kommend = (() => {
            try {
                return App.kommendeTermine(12) || [];
            }
            catch {
                return [];
            }
        })();
        const notizen = Object.values(Store.cache.blocks)
            .filter(b => b.type === 'page' && b.alive !== false && b.besprechung)
            .sort((a, b) => String(b.created).localeCompare(String(a.created)))
            .slice(0, 8);
        const block = (titel, inhalt) => inhalt ? `<h2>${esc(titel)}</h2><div class="home-liste">${inhalt}</div>` : '';
        wrap.className = '';
        wrap.innerHTML =
            '<div class="home">' +
                '<h1>Termine</h1>' +
                '<div class="home-karten">' +
                '<button class="hk" data-a="kal"><b>📅 Kalender</b>' +
                '<span>Termine hereinholen</span></button>' +
                '<button class="hk" data-a="mtg"><b>🎙 Besprechung</b>' +
                '<span>Mitreden statt mitschreiben</span></button>' +
                '</div>' +
                block('Bevorstehend', kommend.map((t) => `<button data-open="${esc(t.id)}"><span>📌</span>` +
                    `<span class="pt">${esc(t.text)}</span>` +
                    `<span class="pth">${esc(t.wann)}</span></button>`).join('')) +
                /* Steht nichts an, sagt die Ansicht das — und daneben den einen
                   Weg, der etwas ändert. Eine leere Liste ohne Ausweg ist eine
                   Sackgasse. */
                (kommend.length ? '' :
                    '<h2>Bevorstehend</h2><div class="home-liste">' +
                        '<button data-a="kal"><span>📅</span><span class="pt">Kalender verbinden</span>' +
                        '</button>' +
                        '<div class="leer">Dann stehen hier alle Termine der nächsten ' +
                        'dreissig Tage, und zu jedem kannst du eine Notiz anlegen.</div></div>') +
                block('Aus Besprechungen', notizen.map(p => `<button data-open="${esc(p.id)}"><span>${esc(p.icon || '🎙')}</span>` +
                    `<span class="pt">${esc(p.text || 'Ohne Titel')}</span></button>`).join('')) +
                '</div>';
        wrap.onclick = (e) => {
            const el = (e.target instanceof Element) ? e.target : null;
            const auf = el?.closest('[data-open]');
            if (auf?.dataset.open) {
                App.oeffne(auf.dataset.open);
                return;
            }
            const a = el?.closest('[data-a]');
            if (!a)
                return;
            if (a.dataset.a === 'kal')
                window.Kalender?.dialog?.();
            else if (a.dataset.a === 'mtg')
                window.Meeting?.panel?.();
        };
    };
    return { start, seiten, termine, posteingang, posteingangFilter, gruss };
})();
window.Ansichten = Ansichten;
