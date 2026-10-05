"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/backstage.ts (npm run bauen:ts). */
const Backstage = (() => {
    const WURZEL = 'backstage';
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const kann = (f) => {
        try {
            return typeof f() === 'function';
        }
        catch {
            return false;
        }
    };
    const holen = (name) => {
        try {
            return globalThis[name];
        }
        catch {
            return undefined;
        }
    };
    const wann = (iso) => {
        const t = Date.parse(String(iso ?? ''));
        if (Number.isNaN(t))
            return '—';
        return new Date(t).toLocaleString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit' });
    };
    const seiteJetzt = () => {
        try {
            const id = App.aktuelleSeite();
            if (!id)
                return null;
            return Store.getBlock(id) || null;
        }
        catch {
            return null;
        }
    };
    const kopf = (titel, unter = '') => `<h2 class="bst-titel">${esc(titel)}</h2>` +
        (unter ? `<p class="bst-unter">${esc(unter)}</p>` : '');
    const kachel = (tun, zeichen, name, sub) => `<button class="bst-kachel" data-bst-tun="${esc(tun)}">` +
        `<span class="bst-k-z" aria-hidden="true">${esc(zeichen)}</span>` +
        `<span class="bst-k-t"><b>${esc(name)}</b><i>${esc(sub)}</i></span></button>`;
    const zeile = (tun, name, sub = '') => `<button class="bst-zeile" data-bst-tun="${esc(tun)}">` +
        `<span class="bst-z-t"><b>${esc(name)}</b>` +
        (sub ? `<i>${esc(sub)}</i>` : '') + '</span>' +
        '<span class="bst-z-pfeil" aria-hidden="true">›</span></button>';
    const auskunft = (name, wert, ton = '') => `<div class="bst-fakt${ton ? ' ist-' + esc(ton) : ''}">` +
        `<b>${esc(name)}</b><span>${esc(wert)}</span></div>`;
    const gruppe = (name, inhalt) => inhalt ? `<div class="bst-grp">${esc(name)}</div>${inhalt}` : '';
    const SEKTIONEN = [
        { id: 'info', name: 'Informationen', zeichne: () => {
                const p = seiteJetzt();
                let aus = kopf('Informationen', 'Was Redion gerade hält, und wie gut es gesichert ist.');
                if (p) {
                    aus += gruppe('Diese Seite', auskunft('Titel', String(p.text || 'Ohne Titel')) +
                        auskunft('Zuletzt geändert', wann(p.edited || p.created)) +
                        (p.locked ? auskunft('Gesperrt', 'Ja — Bearbeiten ist aus', 'warnen') : ''));
                }
                const s = holen('Sicherung');
                if (s && typeof s.stand === 'function') {
                    const st = s.stand();
                    const satz = st.tage === null
                        ? 'Noch keine Sicherung bekannt.'
                        : st.tage === 0 ? 'Heute gesichert.'
                            : 'Vor ' + st.tage + (st.tage === 1 ? ' Tag' : ' Tagen') + ' gesichert.';
                    const ton = st.stufe === 'gut' ? '' : st.stufe;
                    aus += gruppe('Sicherung', auskunft('Letzte Sicherung', satz + (st.art ? ' (' + st.art + ')' : ''), ton) +
                        zeile('kopie', 'Jetzt eine Kopie speichern', 'Geht zu „Kopie speichern"'));
                }
                const os = holen('OrdnerSicherung');
                if (os && typeof os.moeglich === 'function') {
                    if (!os.moeglich()) {
                        aus += gruppe('Automatische Sicherung', auskunft('Ordner', 'Dieser Browser kann keinen Ordner behalten.'));
                    }
                    else if (os.an()) {
                        aus += gruppe('Automatische Sicherung', auskunft('Ordner', String(os.name() || 'gewählt')) +
                            auskunft('Zuletzt geschrieben', os.zuletzt() ? wann(os.zuletzt()) : 'noch nicht') +
                            (os.fehler() ? auskunft('Letzter Fehler', String(os.fehler()), 'warnen') : ''));
                    }
                    else {
                        aus += gruppe('Automatische Sicherung', auskunft('Ordner', 'Aus — Redion schreibt nichts von selbst.'));
                    }
                }
                aus += gruppe('Auf diesem Gerät', '<div class="bst-fakt" id="bst-platz"><b>Belegter Platz</b>' +
                    '<span>wird gemessen …</span></div>');
                const w = holen('Wolke');
                if (w && typeof w.angemeldet === 'function') {
                    try {
                        aus += gruppe('Abgleich', w.angemeldet()
                            ? auskunft('Server', String(w.adresse?.() || 'verbunden'))
                            : auskunft('Server', 'Nicht angemeldet — alles bleibt auf diesem Gerät.'));
                    }
                    catch { }
                }
                return aus;
            } },
        { id: 'neu', name: 'Neu', zeichne: () => {
                let wege = [];
                try {
                    wege = App.erstellenWege() || [];
                }
                catch {
                    wege = [];
                }
                if (!wege.length)
                    return kopf('Neu', 'Es ist gerade kein Weg geladen.');
                return kopf('Neu', 'Womit soll es losgehen?') +
                    '<div class="bst-kacheln">' +
                    wege.map(w => kachel('neu:' + w.id, w.zeichen, w.name, w.sub)).join('') +
                    '</div>';
            } },
        { id: 'oeffnen', name: 'Öffnen', zeichne: () => {
                let aus = kopf('Öffnen', 'Wo etwas liegt, das es schon gibt.');
                aus += gruppe('Orte', (kann(() => holen('Bibliothek')?.oeffne)
                    ? zeile('ort:bibliothek', 'Bibliothek', 'Fächer, Notizbücher, Dokumente') : '') +
                    (kann(() => holen('Notebook')?.oeffnen)
                        ? zeile('ort:notizhefte', 'Notizhefte', 'Das Regal mit den Deckeln') : '') +
                    zeile('ort:suche', 'Suchen', 'Über alle Seiten und Inhalte (Strg + P)'));
                let letzte = [];
                try {
                    letzte = (App.kuerzlich() || []).slice(0, 8);
                }
                catch {
                    letzte = [];
                }
                if (letzte.length)
                    aus += gruppe('Zuletzt geöffnet', letzte.map(b => zeile('seite:' + b.id, String(b.text || 'Ohne Titel'))).join(''));
                return aus;
            } },
        { id: 'kopie', name: 'Kopie speichern', zeichne: () => {
                let aus = kopf('Kopie speichern', 'Eine Sicherung ist eine Datei auf deinem Gerät. Redion lädt sie ' +
                    'herunter; wohin sie geht, entscheidet der Browser.');
                aus += gruppe('Von Hand', zeile('sich:speichern', 'Sicherung speichern', 'Alles in eine Datei — mit Anhängen als .redion') +
                    zeile('sich:laden', 'Sicherung einlesen', 'Eine gespeicherte Datei zurückholen'));
                const os = holen('OrdnerSicherung');
                if (os && typeof os.moeglich === 'function' && os.moeglich()) {
                    aus += gruppe('Automatisch (E270)', (os.an()
                        ? zeile('ord:jetzt', 'Jetzt in den Ordner sichern', 'Ordner: ' + String(os.name() || 'gewählt'))
                        : zeile('ord:waehlen', 'Ordner wählen', 'Danach alle fünf Minuten, aber nur bei Änderungen')));
                }
                return aus;
            } },
        { id: 'drucken', name: 'Drucken', zeichne: () => {
                const p = seiteJetzt();
                if (!p)
                    return kopf('Drucken', 'Gedruckt wird eine Seite. Gerade ist keine offen.') +
                        gruppe('Zuerst', zeile('ort:bibliothek', 'Eine Seite öffnen', 'Geht zur Bibliothek'));
                return kopf('Drucken', 'Der Browser zeigt die Vorschau und kann auch ' +
                    'als PDF speichern.') +
                    gruppe('Diese Seite', zeile('druck:seite', 'Drucken oder als PDF speichern', String(p.text || 'Ohne Titel')));
            } },
        { id: 'weitergeben', name: 'Weitergeben', zeichne: () => {
                const p = seiteJetzt();
                if (!p)
                    return kopf('Weitergeben', 'Weitergegeben wird eine Seite. Gerade ist keine offen.') +
                        gruppe('Zuerst', zeile('ort:bibliothek', 'Eine Seite öffnen', 'Geht zur Bibliothek'));
                return kopf('Weitergeben', 'Alle Wege stehen im Teilen-Menü: Link, Text, Markdown, ' +
                    'HTML, PDF, Word, Excel, Obsidian.') +
                    gruppe('Diese Seite', zeile('teil:menue', 'Teilen …', String(p.text || 'Ohne Titel')) +
                        zeile('teil:link', 'Link auf diese Seite kopieren', 'Öffnet dieses Gerät an dieser Stelle'));
            } },
        { id: 'export', name: 'Exportieren', zeichne: () => {
                const p = seiteJetzt();
                let aus = kopf('Exportieren', 'Ein Export ist kein Ersatz für eine Sicherung: er nimmt den Text ' +
                    'mit, nicht den Zustand der App.');
                if (p)
                    aus += gruppe('Diese Seite', zeile('exp:md', 'Als Markdown speichern', String(p.text || 'Ohne Titel')) +
                        (kann(() => holen('Werkzeuge')?.htmlExport)
                            ? zeile('exp:html', 'Als HTML speichern', '') : '') +
                        (kann(() => holen('Austausch')?.alsPowerPoint)
                            ? zeile('exp:pptx', 'Als PowerPoint speichern', 'Die Folien dieser Seite als .pptx') : ''));
                aus += gruppe('Alles', (kann(() => holen('Werkzeuge')?.einzelDatei)
                    ? zeile('exp:einzel', 'Alles als eine HTML-Datei', 'Zum Lesen ohne Redion') : '') +
                    (kann(() => holen('Werkzeuge')?.ordnerSchreiben)
                        ? zeile('exp:ordner', 'Alles in einen Ordner schreiben', 'Je Seite eine Markdown-Datei') : ''));
                return aus;
            } },
        { id: 'konto', name: 'Konto', zeichne: () => {
                let aus = kopf('Konto', 'Redion läuft ohne Konto. Eines gibt es nur, wenn du es willst — ' +
                    'für den Abgleich zwischen Geräten.');
                aus += gruppe('Redion', (kann(() => holen('WolkeFenster')?.dialog)
                    ? zeile('konto:wolke', 'Redion-Konto und Abgleich', 'Anmelden, Geräte, Serveradresse') : '') +
                    zeile('konto:arbeitsbereich', 'Arbeitsbereich', 'Name und Zeichen dieses Bereichs'));
                if (kann(() => holen('Verbindungen')?.dialog))
                    aus += gruppe('Andere Dienste', zeile('konto:verbindungen', 'Verbindungen', 'Google, GitHub, Jira und die übrigen'));
                return aus;
            } },
        { id: 'optionen', name: 'Optionen', zeichne: () => kopf('Optionen', 'Alles, was Redion für dich merkt.') +
                gruppe('Einstellungen', zeile('opt:einstellungen', 'Einstellungen öffnen', 'Aussehen, Bereiche, Daten, Pflege, Erweiterungen') +
                    (kann(() => holen('Aussehen')?.dialog)
                        ? zeile('opt:aussehen', 'Aussehen', 'Farben, Schrift, Tastenkürzel') : '') +
                    zeile('opt:thema', 'Hell oder dunkel umschalten', 'Strg + Umschalt + L') +
                    (kann(() => holen('Werkzeuge')?.tastenkuerzel)
                        ? zeile('opt:tasten', 'Tastenkürzel anzeigen', 'Strg + /') : '')) }
    ];
    const faecher = () => SEKTIONEN.filter(s => !s.da || s.da());
    const zuUnd = (f) => { schliesse(); setTimeout(f, 60); };
    const tun = (was) => {
        if (was.startsWith('neu:')) {
            zuUnd(() => App.erstellenWeg(was.slice(4)));
            return;
        }
        if (was.startsWith('seite:')) {
            zuUnd(() => App.oeffne(was.slice(6)));
            return;
        }
        const karte = {
            'kopie': () => zeige('kopie'),
            'ort:bibliothek': () => zuUnd(() => holen('Bibliothek')?.oeffne?.()),
            'ort:notizhefte': () => zuUnd(() => holen('Notebook')?.oeffnen?.()),
            'ort:suche': () => zuUnd(() => App.suche()),
            'sich:speichern': () => zuUnd(() => { void App.sicherungSpeichern(); }),
            'sich:laden': () => zuUnd(() => App.sicherungLaden()),
            'ord:waehlen': () => zuUnd(() => { void holen('OrdnerSicherung')?.waehlen?.(); }),
            'ord:jetzt': () => {
                const os = holen('OrdnerSicherung');
                if (!os?.jetztSichern)
                    return;
                try {
                    UI.toast('Sicherung wird geschrieben …');
                }
                catch { }
                Promise.resolve(os.jetztSichern(true)).then(() => neuZeichnen()).catch(() => { });
            },
            'druck:seite': () => {
                const p = seiteJetzt();
                if (p)
                    zuUnd(() => { void holen('Werkzeuge')?.drucken?.(p); });
            },
            'teil:menue': () => {
                const p = seiteJetzt();
                if (p)
                    zuUnd(() => {
                        const anker = document.getElementById('btn-page-menu')
                            || document.getElementById('mb-datei');
                        holen('Werkzeuge')?.teilenMenue?.(anker, p);
                    });
            },
            'teil:link': () => {
                const p = seiteJetzt();
                if (!p)
                    return;
                zuUnd(() => holen('Ablage')?.kopiereJetzt?.(location.origin + location.pathname + '#' + p.id, 'Link zur Seite kopiert'));
            },
            'exp:md': () => {
                const p = seiteJetzt();
                if (p)
                    zuUnd(() => App.markdownExport(p));
            },
            'exp:html': () => {
                const p = seiteJetzt();
                if (p)
                    zuUnd(() => holen('Werkzeuge')?.htmlExport?.(p));
            },
            'exp:pptx': () => {
                const p = seiteJetzt();
                if (p)
                    zuUnd(() => {
                        void holen('Austausch')?.alsPowerPoint?.(p)
                            .then((e) => UI.toast(e.folien + (e.folien === 1 ? ' Folie' : ' Folien') +
                            ' gespeichert'))
                            .catch((f) => UI.toast('Die PowerPoint-Datei kam nicht zustande: ' +
                            (f instanceof Error ? f.message : String(f))));
                    });
            },
            'exp:einzel': () => zuUnd(() => holen('Werkzeuge')?.einzelDatei?.()),
            'exp:ordner': () => zuUnd(() => holen('Werkzeuge')?.ordnerSchreiben?.()),
            'konto:wolke': () => zuUnd(() => holen('WolkeFenster')?.dialog?.()),
            'konto:verbindungen': () => zuUnd(() => holen('Verbindungen')?.dialog?.()),
            'konto:arbeitsbereich': () => zuUnd(() => holen('Einstellungen')?.oeffne?.('arbeitsplatz')),
            'opt:einstellungen': () => zuUnd(() => holen('Einstellungen')?.oeffne?.()),
            'opt:aussehen': () => zuUnd(() => holen('Aussehen')?.dialog?.()),
            'opt:thema': () => { try {
                App.theme();
            }
            catch { } },
            'opt:tasten': () => zuUnd(() => holen('Werkzeuge')?.tastenkuerzel?.())
        };
        const f = karte[was];
        if (f) {
            try {
                f();
            }
            catch { }
        }
    };
    let gewaehlt = 'info';
    const wurzel = () => document.getElementById(WURZEL);
    const offen = () => !!wurzel();
    const platzNach = () => {
        const s = holen('Sicherung');
        if (!s?.platz)
            return;
        Promise.resolve(s.platz()).then((z) => {
            const feld = document.getElementById('bst-platz');
            if (!feld)
                return;
            const wert = feld.querySelector('span');
            if (!wert)
                return;
            if (!z || !z.bekannt) {
                wert.textContent = 'Dieser Browser sagt es nicht.';
                return;
            }
            const g = (b) => s.groesse(b);
            wert.textContent = g(z.belegt) + ' belegt · ' + g(z.frei) + ' frei'
                + (z.anhaenge ? ' · ' + z.anhaenge + ' Anhänge' : '');
        }).catch(() => { });
    };
    const fuellen = () => {
        const w = wurzel();
        if (!w)
            return;
        const flaeche = w.querySelector('.bst-flaeche');
        if (!flaeche)
            return;
        const s = faecher().find(x => x.id === gewaehlt) || faecher()[0];
        if (!s)
            return;
        try {
            flaeche.innerHTML = s.zeichne();
        }
        catch {
            flaeche.innerHTML = kopf('Nicht verfügbar', 'Dieses Fach lässt sich gerade nicht zeichnen.');
        }
        flaeche.scrollTop = 0;
        w.querySelectorAll('.bst-nav-knopf').forEach(k => {
            const an = k.dataset['bst'] === s.id;
            k.classList.toggle('ist-an', an);
            k.setAttribute('aria-current', an ? 'page' : 'false');
        });
        if (s.id === 'info')
            platzNach();
    };
    const zeige = (id) => {
        if (faecher().some(s => s.id === id))
            gewaehlt = id;
        fuellen();
    };
    const neuZeichnen = () => { if (offen())
        fuellen(); };
    const schliesse = () => { wurzel()?.remove(); };
    const oeffne = (sektion) => {
        if (offen()) {
            if (sektion)
                zeige(sektion);
            return;
        }
        if (sektion && faecher().some(s => s.id === sektion))
            gewaehlt = sektion;
        const grund = document.createElement('div');
        grund.className = 'overlay bst-grund';
        grund.id = WURZEL;
        const kasten = document.createElement('div');
        kasten.className = 'backstage';
        const nav = document.createElement('nav');
        nav.className = 'bst-nav';
        nav.setAttribute('aria-label', 'Datei');
        const zurueck = document.createElement('button');
        zurueck.type = 'button';
        zurueck.className = 'bst-zurueck';
        zurueck.innerHTML = '<span aria-hidden="true">←</span><span>Zurück</span>';
        zurueck.setAttribute('aria-label', 'Datei schliessen (Esc)');
        zurueck.addEventListener('click', () => schliesse());
        nav.appendChild(zurueck);
        faecher().forEach(s => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'bst-nav-knopf';
            b.dataset['bst'] = s.id;
            b.textContent = s.name;
            b.addEventListener('click', () => zeige(s.id));
            nav.appendChild(b);
        });
        const flaeche = document.createElement('section');
        flaeche.className = 'bst-flaeche';
        flaeche.tabIndex = -1;
        flaeche.addEventListener('click', (e) => {
            const b = (e.target instanceof Element)
                ? e.target.closest('[data-bst-tun]') : null;
            if (!b)
                return;
            tun(String(b.dataset['bstTun'] || ''));
        });
        kasten.appendChild(nav);
        kasten.appendChild(flaeche);
        grund.appendChild(kasten);
        grund.addEventListener('click', (e) => {
            if (e.target === grund)
                schliesse();
        });
        document.body.appendChild(grund);
        fuellen();
    };
    const schalten = () => { if (offen())
        schliesse();
    else
        oeffne(); };
    return { oeffne, schliesse, schalten, offen, zeige, neuZeichnen,
        faecher: () => faecher().map(s => ({ id: s.id, name: s.name })) };
})();
window.Backstage = Backstage;
