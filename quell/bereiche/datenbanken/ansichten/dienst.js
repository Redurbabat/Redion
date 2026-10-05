"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/datenbanken/ansichten/dienst.ts (npm run bauen:ts). */
const Ansichten = (() => {
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const zeichen = (name, groesse = 18) => {
        try {
            return Register.symbole.alsSvg(name, groesse);
        }
        catch {
            return '';
        }
    };
    const flaeche = () => {
        const wrap = document.getElementById('page');
        const crumb = document.getElementById('crumb');
        return wrap && crumb ? { wrap, crumb } : null;
    };
    const bildschirm = (titel, malen) => {
        if (!flaeche())
            return;
        App.zeigeSonder(titel, malen);
    };
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const gruss = () => {
        const h = new Date().getHours();
        const name = Store.getMeta('nutzer', '');
        const teil = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend';
        return teil + (name && name !== 'Ich' ? ', ' + name : '');
    };
    const sicherungsstand = () => Sicherung.stand();
    const sicherungBand = () => {
        const s = sicherungsstand();
        const wieLang = s.tage === null ? ''
            : s.tage === 0 ? 'heute'
                : s.tage === 1 ? 'gestern'
                    : 'vor ' + s.tage + ' Tagen';
        if (s.stufe === 'gut') {
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
    const start = () => bildschirm('Start', (wrap) => {
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
        wrap.onclick = (e) => {
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
            if (a.dataset['a'] === 'sichern') {
                const knopf = a;
                const wieVorher = knopf.innerHTML;
                knopf.disabled = true;
                knopf.classList.add('laeuft');
                knopf.innerHTML = '<i class="hs-kreisel" aria-hidden="true"></i>Sichern …';
                knopf.setAttribute('aria-live', 'polite');
                const fertig = (gut) => {
                    if (!knopf.isConnected)
                        return;
                    knopf.classList.remove('laeuft');
                    knopf.classList.toggle('fertig', gut);
                    knopf.innerHTML = gut ? '✓ Gesichert' : 'Nicht gesichert';
                    setTimeout(() => {
                        if (document.getElementById('page')?.querySelector('.home-sich'))
                            start();
                        else if (knopf.isConnected) {
                            knopf.disabled = false;
                            knopf.classList.remove('fertig');
                            knopf.innerHTML = wieVorher;
                        }
                    }, 1200);
                };
                void Promise.resolve(App.sicherungSpeichern())
                    .then((gut) => fertig(gut !== false))
                    .catch(() => fertig(false));
            }
        };
    });
    const zahl = (n, name) => `<div class="hz"><b>${n}</b><span>${name}</span></div>`;
    const posteingang = () => bildschirm('Posteingang', (wrap) => {
        const erinner = Werkzeuge.erinnerungen();
        const meld = Werkzeuge.meldungen();
        const kommentare = [];
        Links.seiten().forEach((p) => Kommentare.alle(p.id).forEach((k) => kommentare.push({ seite: p, ...k })));
        const anMich = Kommentare.anMich();
        const geaendert = Object.values(Store.cache.blocks)
            .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
            .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 8);
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
                (anMich.length
                    ? '<h2>An dich gerichtet</h2><div class="home-liste">' +
                        anMich.map((m) => `<button data-block="${m.block.id}">` +
                            '<span>@</span>' +
                            `<span style="flex:1">${esc(m.k.text)}` +
                            `<em style="opacity:.6"> — ${esc(m.k.autor || 'jemand')}</em></span>` +
                            `<span style="opacity:.5">${Werkzeuge.zeitKurz(m.k.zeit)}</span></button>`).join('') +
                        '</div>'
                    : '') +
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
        wrap.onclick = (e) => {
            const ziel = elVon(e);
            const m = ziel?.closest('[data-meld]');
            if (m && m.dataset['meld'])
                Werkzeuge.meldungGelesen(m.dataset['meld']);
            const bl = ziel?.closest('[data-block]');
            if (bl?.dataset['block']) {
                App.zeigeBlock(bl.dataset['block']);
                return;
            }
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
        };
    });
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
    const seiten = () => bildschirm('Seiten', (wrap) => {
        const alle = Object.values(Store.cache.blocks)
            .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection' && !b.system);
        const kuerzlich = [...alle]
            .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 6);
        const festeIds = new Set((Store.favorites?.() || [])
            .map((b) => String(b.id)));
        const sterne = alle.filter(b => festeIds.has(String(b.id)));
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
                (alle.length ? '' :
                    '<div class="leer-zustand"><div class="lz-zeichen">📄</div>' +
                        '<b>Noch keine Seiten</b>' +
                        '<span>Erstelle deine erste Seite — oder hole eine Sicherung zurück, ' +
                        'wenn du von einem anderen Gerät kommst.</span>' +
                        '<div class="lz-knoepfe"><button data-a="neu" class="prim">Neue Seite</button>' +
                        '<button data-a="import">Importieren</button></div></div>') +
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
                '<button data-a="papierkorb"><span>' + zeichen('trash') + '</span><span class="pt">Papierkorb</span></button>' +
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
            else if (a.dataset.a === 'import')
                Werkzeuge.dateienLesen();
            else if (a.dataset.a === 'papierkorb')
                App.papierkorb();
        };
    });
    const termine = () => bildschirm('Termine', (wrap) => {
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
                '<button class="hk" data-a="kal-auf"><b>' + zeichen('calendar') + 'Kalender</b>' +
                '<span>Alle Termine in einer Chronologie</span></button>' +
                '<button class="hk" data-a="kal"><b>' + zeichen('link') + 'Kalender verbinden</b>' +
                '<span>Google, CalDAV — Termine hereinholen</span></button>' +
                '<button class="hk" data-a="mtg"><b>' + zeichen('mic') + 'Besprechung</b>' +
                '<span>Mitreden statt mitschreiben</span></button>' +
                '</div>' +
                block('Bevorstehend', kommend.map((t) => `<button data-open="${esc(t.id)}"><span>${zeichen('calendarDays')}</span>` +
                    `<span class="pt">${esc(t.text)}</span>` +
                    `<span class="pth">${esc(t.wann)}</span></button>`).join('')) +
                (kommend.length ? '' :
                    '<h2>Bevorstehend</h2><div class="home-liste">' +
                        '<button data-a="kal"><span>' + zeichen('link') + '</span><span class="pt">Kalender verbinden</span>' +
                        '</button>' +
                        '<div class="leer">Dann stehen hier alle Termine der nächsten ' +
                        'dreissig Tage, und zu jedem kannst du eine Notiz anlegen.</div></div>') +
                block('Aus Besprechungen', notizen.map(p => `<button data-open="${esc(p.id)}"><span>${p.icon ? esc(p.icon) : zeichen('mic')}</span>` +
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
            if (a.dataset.a === 'kal-auf')
                window.Produktwelten?.kalender?.();
            else if (a.dataset.a === 'kal')
                window.Kalender?.dialog?.();
            else if (a.dataset.a === 'mtg')
                window.Meeting?.panel?.();
        };
    });
    const mehrGruppen = () => [
        { name: 'Wo du arbeitest', eintraege: [
                { z: 'pages', t: 'Seiten & Wissen', s: 'Dein Bestand und offene Seiten. Weitere Sammlungen findest du in der Bibliothek.', a: 'workspace' },
                { z: 'workspace', t: 'Arbeitsbereich', s: 'Name, Zeichen und der Baum aller Seiten.', a: 'schublade' }
            ] },
        { name: 'Wichtige Werkzeuge', eintraege: [
                { z: 'compass', t: 'Kompass', s: 'Wie Redion aufgebaut ist und was du machen kannst.', a: 'kompass' },
                { z: 'command', t: 'Befehle', s: 'Slash-Befehle und Aktionen.', a: 'befehle' },
                { z: 'keyboard', t: 'Tastenkürzel', s: 'Alle wichtigen Kürzel.', a: 'tasten' },
                { z: 'puzzle', t: 'Vorlagen', s: 'Startpakete und fertige Seiten.', a: 'vorlagen' }
            ] },
        { name: 'Daten und Sicherheit', eintraege: [
                { z: 'download', t: 'Sicherung', s: 'JSON und .redion — mit Anhängen oder ohne.', a: 'sichern' },
                { z: 'upload', t: 'Importieren', s: 'Dateien und Sicherungen laden.', a: 'import' },
                { z: 'inbox', t: 'Posteingang', s: 'Erinnerungen, Kommentare, Erwähnungen.', a: 'inbox' },
                { z: 'cloud', t: 'Wolke', s: 'Konto, Anmelden und Abgleich zwischen Geräten.', a: 'wolke' },
                { z: 'trash', t: 'Papierkorb', s: 'Gelöschte Seiten wiederherstellen.', a: 'papierkorb' }
            ] },
        { name: 'System', eintraege: [
                { z: 'settings', t: 'Einstellungen', s: 'Darstellung, Speicher, KI, Konto und Wolke.', a: 'einstellungen' },
                { z: 'info', t: 'Über Redion', s: 'Fassung, Hilfe und Angaben zum Projekt.', a: 'ueber' }
            ] }
    ];
    const mehr = () => bildschirm('Mehr', (wrap) => {
        wrap.className = '';
        wrap.innerHTML =
            '<div class="home">' +
                '<h1>Mehr</h1>' +
                mehrGruppen().map(g => `<h2>${esc(g.name)}</h2><div class="home-liste">` +
                    g.eintraege.map(e => `<button data-a="${esc(e.a)}"><span class="mz">${zeichen(e.z)}</span>` +
                        `<span class="pt">${esc(e.t)}` +
                        `<span class="snip">${esc(e.s)}</span></span>` +
                        '<span class="pth">›</span></button>').join('') +
                    '</div>').join('') +
                '</div>';
        wrap.onclick = (e) => {
            const el = (e.target instanceof Element) ? e.target : null;
            const a = el?.closest('[data-a]')?.dataset.a;
            if (!a)
                return;
            if (a === 'workspace')
                Produktwelten.workspace('start');
            else if (a === 'schublade')
                App.arbeitsbereich();
            else if (a === 'kompass')
                kompass();
            else if (a === 'befehle')
                Werkzeuge.palette();
            else if (a === 'tasten')
                Werkzeuge.tastenkuerzel();
            else if (a === 'vorlagen')
                Werkzeuge.vorlagen && Werkzeuge.vorlagen();
            else if (a === 'sichern')
                App.sicherungSpeichern();
            else if (a === 'import')
                Werkzeuge.dateienLesen();
            else if (a === 'inbox')
                posteingang();
            else if (a === 'wolke') {
                if (typeof WolkeFenster !== 'undefined')
                    WolkeFenster.dialog();
                else
                    UI.toast('Die Wolke ist in dieser Fassung nicht geladen.');
            }
            else if (a === 'papierkorb')
                App.papierkorb();
            else if (a === 'einstellungen')
                App.einstellungen();
            else if (a === 'ueber')
                App.einstellungen('ueber');
        };
    });
    const kompass = () => bildschirm('Kompass', (wrap) => {
        const aufbau = [
            ['Start', 'Armaturenbrett mit Schnellkarten, Sicherungsstand und zuletzt Bearbeitetem.'],
            ['Seiten', 'Alles Geschriebene: kürzlich, Favoriten, privat, Datenbanken, Vorlagen.'],
            ['Termine', 'Was ansteht — Aufgaben mit Datum, Erinnerungen, Besprechungen.'],
            ['Mehr', 'Werkzeuge, Sicherung, Import, Papierkorb, Einstellungen.'],
            ['R-Blatt', 'Der Arbeitsbereich: Suche, Befehle, jeder Weg auf einen Griff.']
        ];
        const befehle = [
            ['/', 'Blockmenü öffnen', 'fertig'],
            ['@', 'Seite, Datum oder Person erwähnen', 'fertig'],
            ['#', 'Schlagwort erstellen', 'teilweise'],
            [':', 'Emoji einfügen', 'fertig'],
            ['[[', 'Seite verlinken', 'geplant']
        ];
        const tasten = [
            ['Strg + P', 'Suchen'], ['Strg + ⇧ + P', 'Befehle'], ['Strg + N', 'Neue Seite'],
            ['Strg + /', 'Tastenkürzel'], ['Esc', 'Menü schliessen']
        ];
        const kann = (() => {
            try {
                const b = Object.keys(Register.bloecke?.alle?.() || Register.bloecke || {}).length;
                const a = (Register.ansichten?.alle?.() || []).length;
                return [
                    'Notizen schreiben', 'Seiten verlinken', 'Datenbanken bauen',
                    b ? b + ' Blockarten' : '', a ? a + ' Ansichten' : '',
                    'Formeln rechnen', 'Dateien behalten', 'Sicherungen schreiben',
                    'Importieren', 'Karteikarten lernen', 'KI fragen'
                ].filter(Boolean);
            }
            catch {
                return ['Notizen schreiben', 'Datenbanken bauen', 'Formeln rechnen',
                    'Sicherungen schreiben', 'Karteikarten lernen', 'KI fragen'];
            }
        })();
        const marke = (stand) => `<span class="kp-marke kp-${stand}">${esc(stand)}</span>`;
        wrap.className = '';
        wrap.innerHTML =
            '<div class="home">' +
                '<h1>Kompass</h1>' +
                '<p class="kp-vor">Was du in Redion machen kannst — und wo es steht.</p>' +
                '<h2>App-Aufbau</h2><div class="kp-liste">' +
                aufbau.map(([n, t]) => `<div class="kp-zeile"><b>${esc(n)}</b><span>${esc(t)}</span></div>`).join('') +
                '</div>' +
                '<h2>Befehle</h2><div class="kp-liste">' +
                befehle.map(([k, t, stand]) => `<div class="kp-befehl"><code>${esc(k)}</code><span>${esc(t)}</span>` +
                    marke(String(stand)) + '</div>').join('') +
                '</div>' +
                '<h2>Tastenkürzel</h2><div class="kp-liste">' +
                tasten.map(([k, t]) => `<div class="kp-taste"><kbd>${esc(k)}</kbd><span>${esc(t)}</span></div>`).join('') +
                '<div class="kp-fuss">Auf dem Mac: Cmd statt Strg.</div>' +
                '</div>' +
                '<h2>Redion kann</h2><div class="kp-wolke">' +
                kann.map(n => `<span>${esc(n)}</span>`).join('') +
                '</div>' +
                '<div class="kp-karte">' +
                '<b>Sicherung</b>' +
                '<div>JSON — schnell, ohne Anhänge.<br>' +
                '.redion — vollständig, mit Anhängen.<br>' +
                'Wolke — freiwillig, nie Pflicht.</div>' +
                '<button data-a="sichern">Sicherung öffnen</button>' +
                '</div>' +
                '</div>';
        wrap.onclick = (e) => {
            const el = (e.target instanceof Element) ? e.target : null;
            if (el?.closest('[data-a="sichern"]'))
                App.sicherungSpeichern();
        };
    });
    const skelett = (wieViele = 6, mitKarten = false) => (mitKarten
        ? '<div class="sk-karten"><div class="sk-karte"></div><div class="sk-karte"></div></div>'
        : '') +
        '<div class="sk-titel">Wird geladen …</div><div class="sk-liste">' +
        ['62%', '48%', '71%', '54%', '40%', '66%', '58%', '45%']
            .slice(0, wieViele)
            .map(b => '<div class="sk-zeile"><div class="sk-punkt"></div>' +
            `<div class="sk-strich" style="width:${b}"></div>` +
            '<div class="sk-rechts"></div></div>').join('') +
        '</div>';
    const beimLaden = async (arbeit, wieViele = 6, mitKarten = false) => {
        const f = flaeche();
        let gezeigt = false;
        const uhr = setTimeout(() => {
            if (f) {
                f.wrap.innerHTML = '<div class="home">' + skelett(wieViele, mitKarten) + '</div>';
            }
            gezeigt = true;
        }, 180);
        try {
            return await arbeit();
        }
        finally {
            clearTimeout(uhr);
            void gezeigt;
        }
    };
    return { start, seiten, termine, mehr, kompass, posteingang, posteingangFilter,
        gruss, skelett, beimLaden };
})();
window.Ansichten = Ansichten;
if (typeof Register !== 'undefined' && Register.kontext) {
    const K = Register.kontext;
    const bereiche = ['heute', 'leer'];
    for (const b of bereiche) {
        K.melde({ bereich: b, id: 'ueberblick', name: 'Überblick',
            zeichen: 'today', rang: 10, tun: () => Ansichten.start() });
        K.melde({ bereich: b, id: 'seiten', name: 'Seiten und Notizen',
            zeichen: 'pages', rang: 20, tun: () => Ansichten.seiten() });
        K.melde({ bereich: b, id: 'termine', name: 'Termine',
            zeichen: 'calendar', rang: 30, tun: () => Ansichten.termine() });
        K.melde({ bereich: b, id: 'posteingang', name: 'Posteingang',
            zeichen: 'inbox', rang: 40, tun: () => Ansichten.posteingang() });
        K.melde({ bereich: b, id: 'zuletzt', name: 'Zuletzt geöffnet',
            zeichen: 'history', rang: 50,
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
                return letzte.map((x) => ({
                    id: 'z-' + x.id, name: String(x.text || 'Ohne Titel'), zeichen: 'page',
                    tun: () => { try {
                        App.oeffne(x.id);
                    }
                    catch { } }
                }));
            }
        });
    }
}
if (typeof Register !== 'undefined' && Register.kontext) {
    const K = Register.kontext;
    const da = (pfad) => {
        try {
            return typeof pfad() === 'function';
        }
        catch {
            return false;
        }
    };
    K.melde({ bereich: 'posteingang', id: 'uebersicht', name: 'Übersicht',
        zeichen: 'inbox', rang: 10, tun: () => Ansichten.posteingang() });
    K.melde({ bereich: 'posteingang', id: 'meldungen', name: 'Benachrichtigungen',
        zeichen: 'bell', rang: 20,
        zeigen: () => da(() => Werkzeuge.meldungen),
        liefern: () => {
            let liste = [];
            try {
                liste = Werkzeuge.meldungen() || [];
            }
            catch {
                liste = [];
            }
            if (!liste.length)
                return [{ id: 'keine', name: 'Nichts Neues.', tun: () => { } }];
            return liste.slice(0, 30).map((m, i) => ({
                id: 'm-' + (m.id ?? i), name: String(m.text || 'Meldung'),
                ...(m.gelesen ? {} : { unter: 'ungelesen' }),
                zeichen: m.gelesen ? 'checkCircle' : 'bell',
                tun: () => {
                    try {
                        if (m.id)
                            Werkzeuge.meldungGelesen(m.id);
                    }
                    catch { }
                    try {
                        if (m.seite)
                            App.oeffne(m.seite);
                        else
                            Ansichten.posteingang();
                    }
                    catch { }
                }
            }));
        }
    });
    K.melde({ bereich: 'posteingang', id: 'erinnerungen', name: 'Erinnerungen',
        zeichen: 'clock', rang: 30,
        zeigen: () => da(() => Werkzeuge.erinnerungen),
        liefern: () => {
            let liste = [];
            try {
                liste = Werkzeuge.erinnerungen() || [];
            }
            catch {
                liste = [];
            }
            if (!liste.length)
                return [{ id: 'keine', name: 'Keine Erinnerungen.', tun: () => { } }];
            return [...liste]
                .sort((a, b) => String(b.zeit || '').localeCompare(String(a.zeit || '')))
                .slice(0, 30)
                .map((e, i) => {
                let wann = '';
                try {
                    wann = Werkzeuge.zeitKurz(e.zeit) || '';
                }
                catch {
                    wann = '';
                }
                return {
                    id: 'e-' + (e.id ?? i), name: String(e.text || 'Erinnerung'),
                    ...(wann ? { unter: wann } : {}),
                    zeichen: e.erledigt ? 'checkCircle' : 'clock',
                    tun: () => { try {
                        if (e.pageId)
                            App.oeffne(e.pageId);
                    }
                    catch { } }
                };
            });
        }
    });
    K.melde({ bereich: 'posteingang', id: 'anmich', name: 'An dich gerichtet',
        zeichen: 'comment', rang: 40,
        zeigen: () => da(() => globalThis.Kommentare?.anMich),
        liefern: () => {
            let liste = [];
            try {
                liste = globalThis.Kommentare.anMich() || [];
            }
            catch {
                liste = [];
            }
            if (!liste.length)
                return [{ id: 'keine', name: 'Nichts an dich.', tun: () => { } }];
            return liste.slice(0, 30).map((m, i) => ({
                id: 'am-' + (m?.k?.id ?? i),
                name: String(m?.k?.text || 'Kommentar'),
                unter: String(m?.k?.autor || 'jemand'),
                zeichen: 'comment',
                tun: () => {
                    try {
                        App.zeigeBlock(String(m?.block?.id || ''));
                    }
                    catch { }
                }
            }));
        }
    });
    K.melde({ bereich: 'posteingang', id: 'gelesen', name: 'Alle gelesen',
        zeichen: 'checkCircle', rang: 50,
        zeigen: () => {
            if (!da(() => Werkzeuge.meldungenAlleGelesen))
                return false;
            try {
                return (Werkzeuge.meldungen() || []).some((m) => !m.gelesen);
            }
            catch {
                return false;
            }
        },
        tun: () => {
            let wie = 0;
            try {
                wie = Werkzeuge.meldungenAlleGelesen() || 0;
            }
            catch { }
            try {
                UI.toast(wie === 1 ? '1 Meldung als gelesen markiert'
                    : wie + ' Meldungen als gelesen markiert');
            }
            catch { }
            try {
                Ansichten.posteingang();
            }
            catch { }
        } });
    K.melde({ bereich: 'kalender', id: 'uebersicht', name: 'Übersicht',
        zeichen: 'calendar', rang: 10, tun: () => Ansichten.termine() });
    K.melde({ bereich: 'kalender', id: 'kommend', name: 'Kommende Termine',
        zeichen: 'clock', rang: 20,
        liefern: () => {
            let liste = [];
            try {
                liste = App.kommendeTermine(12) || [];
            }
            catch {
                liste = [];
            }
            if (!liste.length)
                return [{ id: 'keine', name: 'Nichts steht an.', tun: () => { } }];
            return liste.map((t, i) => ({
                id: 't-' + (t.id ?? i), name: String(t.text || 'Termin'),
                ...(t.wann ? { unter: String(t.wann) } : {}),
                zeichen: 'calendar',
                tun: () => { try {
                    if (t.id)
                        App.oeffne(t.id);
                }
                catch { } }
            }));
        }
    });
    K.melde({ bereich: 'kalender', id: 'tagesplan', name: 'Tagesplan',
        zeichen: 'today', rang: 30,
        zeigen: () => da(() => globalThis.Plan?.tagesplan),
        tun: () => globalThis.Plan.tagesplan() });
    K.melde({ bereich: 'kalender', id: 'woche', name: 'Wochenrückblick',
        zeichen: 'chart', rang: 40,
        zeigen: () => da(() => globalThis.Plan?.wochenrueckblick),
        tun: () => globalThis.Plan.wochenrueckblick() });
    K.melde({ bereich: 'kalender', id: 'verbinden', name: 'Kalender verbinden',
        zeichen: 'link', rang: 50,
        zeigen: () => da(() => globalThis.Kalender?.dialog),
        tun: () => globalThis.Kalender.dialog() });
    K.melde({ bereich: 'kalender', id: 'abgleichen', name: 'Jetzt abgleichen',
        zeichen: 'redo', rang: 60,
        zeigen: () => {
            if (!da(() => globalThis.Kalender?.alleAbosHolen))
                return false;
            try {
                return (globalThis.Kalender.abos() || []).length > 0;
            }
            catch {
                return false;
            }
        },
        tun: () => { void globalThis.Kalender.alleAbosHolen(); } });
    for (const b of ['kompass', 'mehr']) {
        K.melde({ bereich: b, id: 'start', name: 'Start',
            zeichen: 'today', rang: 10, tun: () => Ansichten.start() });
        K.melde({ bereich: b, id: 'kompass', name: 'Kompass',
            zeichen: 'compass', rang: 20, tun: () => Ansichten.kompass() });
        K.melde({ bereich: b, id: 'mehr', name: 'Mehr',
            zeichen: 'menu', rang: 30, tun: () => Ansichten.mehr() });
    }
}
