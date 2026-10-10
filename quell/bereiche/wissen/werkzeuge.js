"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/werkzeuge.ts (npm run bauen:ts). */
const Werkzeuge = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const { esc, heute, WOCHENTAG, datumLang, unscharf, zeitKurz, planen, alsMarkdown, ausMarkdown, statistikZahlen, sauber, istUnter } = WissenDienst;
    const systemSeite = (schluessel, titel, icon) => {
        const id = Store.getMeta('sys:' + schluessel);
        const da = id && Store.getBlock(id);
        if (da && da.alive)
            return da;
        const p = Store.addPage(null, { text: titel, icon, system: schluessel });
        Store.setMeta('sys:' + schluessel, p.id);
        return p;
    };
    const aliasDialog = (page) => {
        if (!page?.id)
            return;
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        const panel = document.createElement('div');
        panel.className = 'finder';
        const header = document.createElement('div');
        header.className = 'fh';
        header.textContent = 'Aliasse · ' + (page.text || 'Ohne Titel');
        const close = document.createElement('button');
        close.className = 'icon-btn';
        close.textContent = '✕';
        header.appendChild(close);
        const content = document.createElement('div');
        content.style.padding = '16px';
        const hint = document.createElement('p');
        hint.textContent = 'Ein Alias pro Zeile, zum Beispiel FI, RCD oder Residual Current Device. Mehrdeutige Aliasse werden nie automatisch verlinkt.';
        hint.style.color = 'var(--text-dim)';
        const area = document.createElement('textarea');
        area.rows = 8;
        area.style.cssText = 'width:100%;min-height:160px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text)';
        area.value = Links.aliasesVon(page).join('\n');
        const actions = document.createElement('div');
        actions.className = 'fbtns';
        const cancel = document.createElement('button');
        cancel.textContent = 'Abbrechen';
        const save = document.createElement('button');
        save.className = 'prim';
        save.textContent = 'Speichern';
        actions.append(cancel, save);
        content.append(hint, area, actions);
        panel.append(header, content);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        const remove = () => overlay.remove();
        close.addEventListener('click', remove);
        cancel.addEventListener('click', remove);
        overlay.addEventListener('mousedown', event => { if (event.target === overlay)
            remove(); });
        save.addEventListener('click', () => {
            const result = Links.aliasesSetzen(page.id, area.value.split(/[\n,;]+/));
            if (!result)
                return;
            remove();
            App.zeichneBaum();
            App.zeichneSeite();
            if (result.collisions.length) {
                UI.banner('Gespeichert. Mehrdeutig und deshalb nicht automatisch verlinkt: ' +
                    result.collisions.map((entry) => entry.alias).join(', '), 'warn');
            }
            else
                UI.toast(result.aliases.length + (result.aliases.length === 1 ? ' Alias gespeichert' : ' Aliasse gespeichert'));
        });
        area.focus();
    };
    const obsidianVaultExport = async () => {
        try {
            await Austausch.alsObsidianVault('Redion-Obsidian-' + heute());
            UI.toast('Obsidian-Vault mit stabilen IDs und Alias-Frontmatter gespeichert.');
        }
        catch (error) {
            UI.banner('Obsidian-Vault konnte nicht erzeugt werden: ' +
                (error instanceof Error ? error.message : String(error)), 'fehler');
        }
    };
    const befehle = () => {
        const s = App.aktuelleSeite();
        const p = s ? Store.getBlock(s) : null;
        const b = [];
        const c = (gruppe, name, kurz, fn) => b.push({ gruppe, name, kurz, fn });
        c('Navigation', 'Suchen', 'Strg P', () => App.suche());
        c('Navigation', 'Neue Seite', 'Strg N', () => App.neueSeite());
        c('Navigation', 'Heute – Lernen & Alltag', '', () => Produktwelten.lernen('heute'));
        c('Navigation', 'Lernzentrum', '', () => Produktwelten.lernen('lernen'));
        c('Navigation', 'Lernpfad', '', () => Produktwelten.lernen('pfad'));
        c('Navigation', 'Fehlertraining', '', () => Produktwelten.lernen('fehler'));
        c('Navigation', 'Prüfungszentrum', '', () => Produktwelten.lernen('pruefungen'));
        c('Navigation', 'Arbeitsbereich', '', () => Produktwelten.workspace('start'));
        c('Navigation', 'Bibliothek', '', () => Produktwelten.bibliothek());
        c('Navigation', 'Aufgaben', '', () => Produktwelten.aufgaben());
        c('Navigation', 'Whiteboards', '', () => Produktwelten.whiteboards());
        c('Navigation', 'Schule und Ausbildung öffnen', '', () => Produktwelten.lernen('schule'));
        c('Navigation', 'Uni öffnen', '', () => Produktwelten.lernen('uni'));
        c('Navigation', 'Arbeit öffnen', '', () => Produktwelten.lernen('arbeit'));
        c('Navigation', 'Lernfortschritt', '', () => Produktwelten.lernen('fortschritt'));
        c('Navigation', 'Planung und Termine', '', () => Produktwelten.planung());
        c('Navigation', 'Lebensbereiche dieser Seite', '', () => {
            const id = App.aktuelleSeite?.();
            const seite = id ? Store.getBlock(id) : null;
            if (!seite) {
                UI.toast('Dafür muss eine Seite offen sein.');
                return;
            }
            Produktwelten.bereicheDialog(seite);
        });
        c('Navigation', 'Posteingang', '', () => Ansichten.posteingang());
        c('Navigation', 'Tagesjournal öffnen', 'Strg Shift J', () => journal());
        c('Navigation', 'Schnellnotizen', 'Strg Shift M', () => schnellnotizen());
        c('Navigation', 'Graph aller Seiten', 'Strg Shift G', () => Links.graph());
        c('Navigation', 'Schlagwörter', 'Strg Shift T', () => Links.tagRegister());
        c('Navigation', 'Vorlagen', '', () => vorlagen());
        c('Navigation', 'Vorlagengalerie', '', () => Galerie.oeffne());
        c('Navigation', 'Karteikarten lernen', '', () => lernen());
        c('Navigation', 'Papierkorb', '', () => App.papierkorb());
        c('Anlegen', 'Neue Seite anlegen', 'Strg N', () => App.neueSeite());
        c('Anlegen', 'Neue Aufgabe', '', () => {
            const seite = App.neueSeite();
            setTimeout(() => {
                if (seite?.id)
                    Store.addBlock(seite.id, 'todo', { text: '' });
                App.zeichneSeite();
            }, 80);
        });
        c('Anlegen', 'Neue Lernkarte', '', () => {
            const seite = App.neueSeite();
            setTimeout(() => {
                if (seite?.id)
                    Store.addBlock(seite.id, 'flashcard', { text: '' });
                App.zeichneSeite();
            }, 80);
        });
        c('Anlegen', 'Neues Whiteboard', '', () => {
            const seite = App.neueSeite();
            setTimeout(() => {
                if (seite?.id)
                    Store.addBlock(seite.id, 'whiteboard', { text: 'Whiteboard' });
                App.zeichneSeite();
            }, 80);
        });
        c('Anlegen', 'PDF oder Datei importieren', '', () => dateienLesen());
        c('Anlegen', 'Aufnahme starten', '', () => {
            if (typeof Meeting !== 'undefined' && Meeting.panel)
                Meeting.panel();
            else
                UI.toast('Die Aufnahme ist in dieser Fassung nicht geladen.');
        });
        c('Planen', 'Tagesplan', '', () => Plan.tagesplan());
        c('Planen', 'Wochenrückblick', '', () => Plan.wochenrueckblick());
        c('Planen', 'Zurückgestelltes ansehen', '', () => Plan.uebersicht());
        c('Navigation', 'Umsetzungsstand aller 16 Teile', '', () => Status.seiteAnlegen());
        c('Navigation', 'Zurück', 'Strg [', () => App.zurueck());
        c('Navigation', 'Vorwärts', 'Strg ]', () => App.vorwaerts());
        if (p) {
            c('Seite', 'Lebensbereiche zuordnen', '', () => Produktwelten.bereicheDialog(p));
            c('Seite', 'Seite umbenennen', '', () => {
                const n = prompt('Neuer Titel', p.text);
                if (n !== null) {
                    Store.updateBlock(p.id, { text: n });
                    App.zeichneBaum();
                    App.zeichneSeite();
                }
            });
            c('Seite', 'Aliasse bearbeiten', '', () => aliasDialog(p));
            c('Seite', 'Symbol ändern', '', () => document.querySelector('.pg-icon')?.click());
            c('Seite', p.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen', '', () => { Store.updateBlock(p.id, { favorite: !p.favorite }); App.zeichneBaum(); });
            c('Seite', 'Duplizieren', '', () => { App.dupliziereSeite(p.id, p.parentId); App.zeichneBaum(); UI.toast('Dupliziert'); });
            c('Seite', 'Verschieben nach …', '', () => verschiebenNach(p));
            c('Seite', 'Als Vorlage speichern', '', () => alsVorlage(p));
            c('Seite', 'Aus Vorlage einfügen', '', () => vorlageEinfuegen(p));
            c('Seite', 'Versionsverlauf', '', () => versionen(p));
            c('Seite', p.locked ? 'Seite entsperren' : 'Seite verschlüsseln', '', () => p.locked ? entsperren(p) : sperren(p));
            c('Seite', p.gesperrt ? 'Bearbeiten wieder erlauben' : 'Bearbeiten sperren', '', () => { Store.updateBlock(p.id, { gesperrt: !p.gesperrt }); App.zeichneSeite(); UI.toast(p.gesperrt ? 'Entsperrt' : 'Gesperrt'); });
            c('Seite', 'Fokus-Modus', 'Strg Shift F', () => fokus());
            c('Seite', 'Präsentation starten', '', () => praesentation(p));
            c('Seite', 'Markdown-Quelltext', '', () => quelltext(p));
            c('Seite', 'Schreibstatistik', '', () => statistik(p));
            c('Seite', 'Erinnerung setzen', '', () => erinnerungSetzen(p));
            c('Seite', 'Auf später zurückstellen', '', () => Plan.menue(document.getElementById('btn-page-menu') || document.body, p.id));
            c('Seite', 'Als Markdown speichern', '', () => App.markdownExport(p));
            c('Seite', 'Als HTML speichern', '', () => htmlExport(p));
            c('Seite', 'Drucken / als PDF', '', () => drucken(p));
            c('Seite', 'Link kopieren', '', () => { Ablage.kopiereJetzt(location.origin + location.pathname + '#' + p.id, 'Link kopiert'); });
            c('Seite', 'In den Papierkorb', '', () => { Store.trashBlock(p.id); App.zeichneBaum(); App.oeffne((Store.rootPages()[0] || {}).id); UI.toast('In den Papierkorb'); });
        }
        Blocks.TYPEN.forEach((t) => c('Einfügen', t.name, t.kurz || '', () => Blocks.einfuegenAmEnde(t.id)));
        c('Ansicht', 'Hell / Dunkel', 'Strg Shift L', () => App.theme());
        c('Ansicht', 'Seitenleiste ein- oder ausblenden', 'Strg \\', () => document.getElementById('sidebar')?.classList.toggle('collapsed'));
        c('Ansicht', 'KI-Panel', 'Strg J', () => App.kiPanel());
        c('KI', 'Datenbank von der KI bauen lassen', '', async () => {
            const a = await UI.frage('Was soll die Datenbank können?', '');
            if (a)
                KI.datenbankBauen(a);
        });
        c('KI', 'Seitenaufbau von der KI', '', async () => {
            const a = await UI.frage('Worum geht es auf der Seite?', '');
            if (a)
                KI.seiteBauen(a);
        });
        c('KI', 'Nachschlagen bei Wikipedia', '', async () => {
            const a = await UI.frage('Was soll ich nachschlagen?', '');
            if (a)
                KI.nachschlagen(a);
        });
        c('KI', 'Protokoll: was die KI gebaut hat', '', () => KI.protokollZeigen());
        c('Ansicht', 'Alle Toggles öffnen oder schliessen', 'Strg Alt T', () => alleToggles());
        c('Ansicht', 'Tastenkürzel anzeigen', 'Strg /', () => tastenkuerzel());
        c('Daten', 'Einstellungen', 'Strg ,', () => App.einstellungen());
        c('Daten', 'Sicherung speichern', '', () => App.sicherungSpeichern());
        c('Daten', 'Sicherung laden', '', () => App.sicherungLaden());
        c('Daten', 'Alles in einen Ordner schreiben', '', () => ordnerSchreiben());
        c('Daten', 'Als Obsidian-Vault (.zip)', '', () => void obsidianVaultExport());
        c('Daten', 'Ordner mit Markdown einlesen', '', () => ordnerLesen());
        c('Daten', 'Alles als eine HTML-Datei', '', () => einzelDatei());
        c('Daten', 'Aus Trello, Evernote, Obsidian oder Notion einlesen', '', () => Austausch.dialog());
        if (p)
            c('Daten', 'Diese Seite als Word-Datei (.docx)', '', () => {
                Austausch.alsWord(p).then(() => UI.toast('Word-Datei erzeugt'))
                    .catch((e) => UI.toast('Die Word-Datei kam nicht zustande: ' +
                    (e instanceof Error ? e.message : String(e))));
            });
        c('Daten', 'Alle Datenbanken als Excel-Mappe (.xlsx)', '', () => Austausch.allesAlsExcel()?.catch((e) => UI.toast('Die Excel-Mappe kam nicht zustande: ' +
            (e instanceof Error ? e.message : String(e)))));
        if (p)
            c('Seite', 'Fassungen vergleichen', '', () => Vergleich.dialog(p));
        c('Ansicht', 'Aussehen: Farben, Schrift, Tastenkürzel', '', () => Aussehen.dialog());
        c('Ansicht', 'Tempo messen', '', () => Tempo.dialog());
        c('Ansicht', 'Neuer Reiter', 'Strg Alt N', () => Fenster.neuerReiter());
        c('Ansicht', 'Reiter schliessen', 'Strg Alt W', () => Fenster.schliessen(Fenster.aktiv()));
        c('Ansicht', 'Geteilte Ansicht ein oder aus', 'Strg Alt S', () => Fenster.geteilt() ? Fenster.teilenAus() : Fenster.teilen());
        c('Ansicht', 'Datenmodell ansehen', '', () => Schema.ansicht());
        c('Ansicht', 'Kennzahlen-Tafel', '', () => Schema.tafel());
        c('Daten', 'Gesundheitsbericht und Erste Hilfe', '', () => Pflege.ersteHilfe());
        c('Daten', 'Verschlüsselte Sicherung', '', () => Krypto.dialog());
        c('Daten', 'Notion-Wissen öffnen', '', () => Wissen.oeffnen());
        c('Daten', 'Notion-Formate übersetzen', '', () => NotionFormat.dialog());
        c('Daten', 'Schnittstelle /v1/ und Token', '', () => Api.dialog());
        c('Daten', 'Interne Befehle und Transaktionen', '', () => Transaktion.dialog());
        c('Daten', 'Protokoll: was wann geschehen ist', '', () => Protokoll.dialog());
        c('Daten', 'Dateien in Stücken verwalten', '', () => Dateien.dialog());
        c('Daten', 'Wolke: anmelden und abgleichen', '', () => WolkeFenster.dialog());
        c('Daten', 'Zwei Fassungen — offene Konflikte', '', () => Zusammen.dialog());
        if (p)
            c('Seite', 'Probelauf: was hängt an dieser Seite?', '', () => Probelauf.fenster({ art: 'seiteWeg', id: p.id }));
        c('Daten', 'Vorlagen: gibt es neuere Fassungen?', '', () => Fassung.uebersicht());
        if (p && p.vorlage)
            c('Seite', 'Diese Vorlage aktualisieren', '', () => Fassung.fenster(p.id));
        if (p && Datenbank.sammlungAufSeite && Datenbank.sammlungAufSeite(p.id)) {
            const slg = Datenbank.sammlungAufSeite(p.id);
            c('Daten', 'Rechte je Spalte', '', () => Feldrechte.fenster(slg));
            c('Daten', 'Prüfsätze — stimmen die Formeln noch?', '', () => Pruefsatz.fenster(slg));
            c('Daten', 'Werte vorberechnen', '', () => Vorrat.fenster(slg));
        }
        if (p)
            c('Seite', 'Teilen und veröffentlichen (Wolke)', '', () => WolkeFenster.teilenFenster(p.id));
        c('Navigation', 'Was Redion kann', '', () => Rundgang.uebersicht());
        c('Navigation', 'Führung starten', '', () => Rundgang.start());
        c('Daten', 'Erweiterungen', '', () => Erweiterung.dialog());
        c('Daten', 'Was hereinkommt — Eingänge von aussen', '', () => Eingang.dialog());
        (Erweiterung.angemeldet.befehle || []).forEach(x => c('Erweiterungen', x.titel, '', () => {
            try {
                x.fn();
            }
            catch (e) {
                UI.toast(e instanceof Error ? e.message : String(e));
            }
        }));
        return b;
    };
    const ZULETZT_ZAHL = 8;
    const FEST_ZAHL = 8;
    const OFT_ZAHL = 50;
    const oftBenutzt = () => Store.getMeta('paletteOft', {}) || {};
    const zuletztBenutzt = () => {
        const l = Store.getMeta('paletteZuletzt', []);
        return Array.isArray(l) ? l.filter((x) => typeof x === 'string') : [];
    };
    const angeheftet = () => {
        const l = Store.getMeta('paletteFest', []);
        return Array.isArray(l) ? l.filter((x) => typeof x === 'string') : [];
    };
    const festUmschalten = (name) => {
        const l = angeheftet();
        const i = l.indexOf(name);
        if (i >= 0)
            l.splice(i, 1);
        else
            l.unshift(name);
        Store.setMeta('paletteFest', l.slice(0, FEST_ZAHL));
    };
    const merkeBefehl = (name, gruppe = '') => {
        if (gruppe === 'Seiten')
            return;
        const m = oftBenutzt();
        m[name] = (m[name] || 0) + 1;
        const namen = Object.keys(m);
        if (namen.length > OFT_ZAHL) {
            const behalten = namen.filter(n => n !== name)
                .sort((a, b) => (m[b] || 0) - (m[a] || 0)).slice(0, OFT_ZAHL - 1);
            behalten.push(name);
            const klein = {};
            behalten.forEach(n => { klein[n] = m[n]; });
            Store.setMeta('paletteOft', klein);
        }
        else {
            Store.setMeta('paletteOft', m);
        }
        const jung = zuletztBenutzt().filter(n => n !== name);
        jung.unshift(name);
        Store.setMeta('paletteZuletzt', jung.slice(0, ZULETZT_ZAHL));
    };
    const palette = (vorgabe = '') => {
        const liste = (typeof Register !== 'undefined' && Register.befehle)
            ? [...befehle(), ...Register.befehle.alle().map((x) => ({
                    gruppe: x.gruppe || 'Weiteres', name: x.titel, kurz: x.kurz || '', fn: x.tun
                }))]
            : befehle();
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder">' +
                '<input id="cq" placeholder="Befehl suchen …" autocomplete="off">' +
                '<div class="res" id="cr"></div>' +
                '<div class="hint">↑ ↓ auswählen · Enter ausführen · ' +
                'Strg+Enter anheften · Esc schliessen</div>' +
                '</div>';
        document.body.appendChild(o);
        const inp = o.querySelector('#cq');
        const res = o.querySelector('#cr');
        if (!inp || !res)
            return;
        const oft = oftBenutzt();
        const fest = angeheftet();
        const jung = zuletztBenutzt();
        const nachName = new Map(liste.map((t) => [t.name, t]));
        const kopf = [];
        fest.forEach(n => {
            const t = nachName.get(n);
            if (t)
                kopf.push({ ...t, gruppe: 'Angeheftet' });
        });
        jung.forEach(n => {
            if (fest.indexOf(n) >= 0)
                return;
            const t = nachName.get(n);
            if (t)
                kopf.push({ ...t, gruppe: 'Zuletzt' });
        });
        const schonOben = new Set(kopf.map(t => t.name));
        const anfang = [...kopf, ...[...liste].filter((t) => !schonOben.has(t.name))
                .sort((a, b) => (oft[b.name] || 0) - (oft[a.name] || 0))];
        let treffer = anfang, i = 0;
        const GEZEIGT = 60;
        const zeichne = () => {
            let g = '';
            const feste = new Set(angeheftet());
            const sicht = treffer.slice(0, GEZEIGT);
            res.innerHTML = sicht.map((t, k) => {
                const kopf = t.gruppe !== g ? `<div class="grp">${esc(t.gruppe)}</div>` : '';
                g = t.gruppe;
                const istFest = feste.has(t.name);
                return kopf + `<button data-i="${k}"${k === i ? ' class="on"' : ''}` +
                    (istFest ? ' data-ist-fest' : '') +
                    ` aria-label="${esc(t.name)}${istFest ? ' · angeheftet' : ''}">` +
                    `<span class="fest" data-fest="${esc(t.name)}" aria-hidden="true"` +
                    ` title="${istFest ? 'Angeheftet' : 'Anheften'} — Strg+Enter"></span>` +
                    `<span style="flex:1">${esc(t.name)}</span>` +
                    (t.kurz ? `<span class="pth">${esc(t.kurz)}</span>` : '') + '</button>';
            }).join('') +
                (treffer.length > GEZEIGT
                    ? `<div class="grp mehr">${treffer.length - GEZEIGT} weitere — ` +
                        'tipp einen Namen, um sie zu finden</div>'
                    : '');
            const zeilen = [...res.querySelectorAll('button[data-i]')];
            SelectionFlow.stagger(res, zeilen, zeilen.map(b => String(sicht[Number(b.dataset['i'])]?.name ?? '')));
            res.querySelector('button.on')?.scrollIntoView({ block: 'nearest' });
            SelectionFlow.highlight(res, res.querySelector('button.on'), { taste: '↵ Enter' });
        };
        zeichne();
        const waehle = (k) => {
            const n = Math.min(treffer.length, GEZEIGT);
            if (!n)
                return;
            i = Math.max(0, Math.min(k, n - 1));
            res.querySelectorAll('button[data-i].on').forEach(b => b.classList.remove('on'));
            const neu = res.querySelector(`button[data-i="${i}"]`);
            if (!neu) {
                zeichne();
                return;
            }
            neu.classList.add('on');
            neu.scrollIntoView({ block: 'nearest' });
            SelectionFlow.highlight(res, neu, { taste: '↵ Enter' });
        };
        const fuehreAus = (t) => {
            o.remove();
            merkeBefehl(t.name, t.gruppe);
            setTimeout(() => t.fn(), 10);
        };
        const festSchalten = (name) => { festUmschalten(name); zeichne(); };
        inp.addEventListener('input', () => {
            const q = inp.value.trim();
            if (!q) {
                treffer = anfang;
                i = 0;
                zeichne();
                return;
            }
            const bewertet = liste.map(t => {
                const p1 = unscharf(t.name, q);
                const p2 = unscharf(t.gruppe + ' ' + t.name, q);
                const punkte = Math.max(p1, p2 - 40);
                const bonus = Math.min(60, (oft[t.name] || 0) * 12) + (fest.indexOf(t.name) >= 0 ? 100 : 0);
                return punkte < 0 ? null : { t, punkte: punkte + bonus };
            }).filter(Boolean).sort((a, b) => b.punkte - a.punkte).map((x) => x.t);
            const seiten = q.length < 2 ? [] : Object.values(Store.cache.blocks)
                .filter(x => x.alive !== false && x.type === 'page' && unscharf(x.text || '', q) > 0)
                .sort((a, b) => unscharf(b.text || '', q) - unscharf(a.text || '', q))
                .slice(0, 6)
                .map(x => ({ gruppe: 'Seiten', name: (x.icon || '📄') + ' ' + (x.text || 'Ohne Titel'),
                kurz: '', fn: () => App.oeffne(x.id) }));
            treffer = [...bewertet.slice(0, 40), ...seiten];
            i = 0;
            zeichne();
        });
        inp.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                o.remove();
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                waehle(i + 1);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                waehle(i - 1);
            }
            if (e.key === 'Enter' && treffer[i]) {
                e.preventDefault();
                if (e.ctrlKey || e.metaKey)
                    festSchalten(treffer[i].name);
                else
                    fuehreAus(treffer[i]);
            }
        });
        res.addEventListener('click', e => {
            const stern = elVon(e)?.closest('[data-fest]');
            if (stern?.dataset.fest) {
                festSchalten(stern.dataset.fest);
                return;
            }
            const b = elVon(e)?.closest('button[data-i]');
            if (b)
                fuehreAus(treffer[Number(b.dataset.i)]);
        });
        o.addEventListener('mousedown', e => { if (e.target === o)
            o.remove(); });
        inp.focus();
        if (vorgabe) {
            inp.value = vorgabe;
            inp.dispatchEvent(new Event('input'));
        }
    };
    const journalSeite = (iso = heute()) => {
        const eltern = systemSeite('journal', 'Journal', '📅');
        const titel = iso + ' · ' + WOCHENTAG[new Date(iso + 'T12:00:00').getDay()];
        const da = Store.childrenOf(eltern.id).find((k) => (k.text || '').startsWith(iso));
        if (da)
            return da;
        const p = Store.addPage(eltern.id, { text: titel, icon: '📆', journal: iso });
        Store.addBlock(p.id, 'h3', { text: datumLang(iso) });
        Store.addBlock(p.id, 'text', { text: '' });
        Store.updateBlock(eltern.id, { aufgeklappt: true });
        return p;
    };
    const journal = (iso = heute()) => {
        const p = journalSeite(iso);
        App.zeichneBaum();
        App.oeffne(p.id);
    };
    const schnellnotizen = () => {
        const eltern = systemSeite('memos', 'Schnellnotizen', '⚡');
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder memos" style="width:min(720px,95vw)">' +
                '<div class="fh">⚡ Schnellnotizen <em id="mz"></em>' +
                '<button class="icon-btn" data-a="seite" title="Als normale Seite öffnen">↗</button>' +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="memo-neu">' +
                '<textarea id="mt" rows="2" placeholder="Was ist gerade? Mit #schlagwort ordnen … (Strg + Enter speichert)"></textarea>' +
                '<button id="mb" class="prim">Speichern</button>' +
                '</div>' +
                '<div id="mhm" class="heatmap"></div>' +
                '<div class="res" id="ml"></div>' +
                '</div>';
        document.body.appendChild(o);
        const liste = () => Store.childrenOf(eltern.id).slice().reverse();
        const zeichne = () => {
            const alle = liste();
            const zahl = o.querySelector('#mz');
            const listeEl = o.querySelector('#ml');
            const heat = o.querySelector('#mhm');
            if (!zahl || !listeEl || !heat)
                return;
            zahl.textContent = alle.length + '';
            listeEl.innerHTML = alle.length
                ? alle.map((m) => `<div class="memo" data-id="${m.id}">` +
                    `<div class="memo-kopf">${esc(zeitKurz(m.created))}` +
                    `<button data-a="edit" title="Bearbeiten">✎</button>` +
                    `<button data-a="seite2" title="Zu einer Seite machen">↗</button>` +
                    `<button data-a="del" data-loeschknopf title="Notiz löschen">🗑</button></div>` +
                    `<div class="memo-txt">${Blocks.inline(m.text || '')}</div>` +
                    '</div>').join('')
                : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
                    'Noch nichts festgehalten. Oben eintippen und speichern.</div>';
            const zaehler = {};
            alle.forEach((m) => { const t = (m.created || '').slice(0, 10); zaehler[t] = (zaehler[t] || 0) + 1; });
            const zellen = [];
            const start = new Date();
            start.setDate(start.getDate() - 83);
            for (let i = 0; i < 84; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                const iso = d.toISOString().slice(0, 10);
                const n = zaehler[iso] || 0;
                zellen.push(`<i class="hm${Math.min(4, n)}" title="${iso}: ${n}"></i>`);
            }
            heat.innerHTML = zellen.join('');
        };
        zeichne();
        const speichern = () => {
            const ta = o.querySelector('#mt');
            if (!ta)
                return;
            const txt = ta.value.trim();
            if (!txt)
                return;
            Store.addBlock(eltern.id, 'text', { text: txt });
            ta.value = '';
            zeichne();
            App.zeichneBaum();
        };
        o.querySelector('#mb')?.addEventListener('click', speichern);
        o.querySelector('#mt')?.addEventListener('keydown', (e) => {
            const t = e;
            if (t.key === 'Enter' && (t.ctrlKey || t.metaKey)) {
                t.preventDefault();
                speichern();
            }
        });
        o.querySelector('#mt')?.focus();
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="seite"]')) {
                o.remove();
                App.oeffne(eltern.id);
                return;
            }
            const memo = elVon(e)?.closest('.memo');
            if (!memo)
                return;
            const b = Store.getBlock(memo.dataset.id);
            if (!b)
                return;
            if (elVon(e)?.closest('[data-a="del"]')) {
                Store.trashBlock(b.id);
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="edit"]')) {
                const n = prompt('Notiz bearbeiten', b.text);
                if (n !== null) {
                    Store.updateBlock(b.id, { text: n });
                    zeichne();
                }
                return;
            }
            if (elVon(e)?.closest('[data-a="seite2"]')) {
                const p = Store.addPage(null, { text: (b.text || '').slice(0, 60), icon: '📄' });
                Store.addBlock(p.id, 'text', { text: b.text || '' });
                Store.trashBlock(b.id);
                o.remove();
                App.zeichneBaum();
                App.oeffne(p.id);
            }
        });
    };
    const alsVorlage = (p) => {
        const ordner = systemSeite('vorlagen', 'Vorlagen', '🧩');
        const daten = Store.baum(p.id);
        const neu = Store.baumEinfuegen(daten, ordner.id);
        if (!neu) {
            UI.toast('Die Vorlage liess sich nicht anlegen');
            return;
        }
        Store.updateBlock(neu.id, { text: (p.text || 'Ohne Titel'), vorlage: true });
        Store.updateBlock(ordner.id, { aufgeklappt: true });
        App.zeichneBaum();
        UI.toast('Als Vorlage gespeichert');
    };
    const vorlagenListe = () => {
        const id = Store.getMeta('sys:vorlagen');
        return id && Store.getBlock(id) ? Store.childrenOf(id).filter((k) => k.type === 'page') : [];
    };
    const vorlageEinfuegen = (ziel) => {
        const liste = vorlagenListe();
        if (!liste.length) {
            UI.toast('Noch keine Vorlagen — erst eine Seite als Vorlage speichern');
            return;
        }
        const html = '<div class="grp">Vorlage einfügen</div>' + liste.map((v) => `<button data-v="${v.id}"><span class="mi">${esc(v.icon || '🧩')}</span>${esc(v.text || 'Ohne Titel')}</button>`).join('');
        const m = UI.menu(html, innerWidth / 2 - 130, 120);
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-v]');
            if (!b)
                return;
            m.remove();
            if (!b.dataset.v)
                return;
            const daten = Store.baum(b.dataset.v);
            (daten.kinder || []).forEach((k) => Store.baumEinfuegen(k, ziel.id));
            App.zeichneSeite();
            UI.toast('Vorlage eingefügt');
        });
    };
    const vorlagen = () => {
        Galerie.oeffne();
    };
    const vorlagenOrdner = () => {
        const ordner = systemSeite('vorlagen', 'Vorlagen', '🧩');
        App.zeichneBaum();
        App.oeffne(ordner.id);
    };
    const lernModul = () => typeof window !== 'undefined'
        ? window.Learning : null;
    const karten = () => lernModul()?.cards?.() || Object.values(Store.cache.blocks)
        .filter(b => b.alive && b.type === 'flashcard');
    const faellig = () => {
        const neu = lernModul();
        if (neu?.due)
            return neu.due();
        const jetzt = Date.now();
        return karten().filter((k) => !k.sr || !k.sr.faellig || new Date(k.sr.faellig).getTime() <= jetzt);
    };
    const lernen = () => {
        const neu = lernModul();
        if (neu?.open) {
            neu.open();
            return;
        }
        const stapel = faellig();
        const alle = karten();
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder lern" style="width:min(620px,94vw)"></div>';
        document.body.appendChild(o);
        const box = o.querySelector('.lern');
        if (!box)
            return;
        let i = 0, offen = false, gelernt = 0;
        const zeichne = () => {
            if (!alle.length) {
                box.innerHTML =
                    '<div class="fh">🎴 Karteikarten</div>' +
                        '<div style="padding:26px; text-align:center; color:var(--text-dim); font-size:14px; line-height:1.7">' +
                        'Noch keine Karteikarten.<br>Tippe auf einer Seite <code>/karteikarte</code> —<br>' +
                        'vorne die Frage, hinten die Antwort.</div>' +
                        '<div class="fbtns"><button data-a="zu">Schliessen</button></div>';
                return;
            }
            if (i >= stapel.length) {
                box.innerHTML =
                    '<div class="fh">🎴 Fertig für heute</div>' +
                        `<div style="padding:26px; text-align:center; font-size:15px; line-height:1.8">` +
                        `${gelernt} Karten wiederholt.<br>` +
                        `<span style="color:var(--text-dim); font-size:13.5px">Insgesamt ${alle.length} Karten · ` +
                        `nächste Wiederholung nach Plan</span></div>` +
                        '<div class="fbtns"><button data-a="zu" class="prim">Schliessen</button></div>';
                return;
            }
            const k = stapel[i];
            const [vorn, hinten] = teileKarte(k);
            const quelle = Links.seiteVon(k.id);
            box.innerHTML =
                `<div class="fh">🎴 Karteikarte <em>${i + 1} / ${stapel.length}</em>` +
                    `<button class="icon-btn" data-a="zu">✕</button></div>` +
                    `<div class="karte">` +
                    `<div class="k-vorn">${Blocks.inline(vorn)}</div>` +
                    (offen ? `<hr><div class="k-hinten">${Blocks.inline(hinten)}</div>` : '') +
                    (quelle ? `<div class="k-quelle" data-a="quelle">aus: ${esc(quelle.text || 'Ohne Titel')}</div>` : '') +
                    `</div>` +
                    (offen
                        ? '<div class="fbtns lern-btns">' +
                            '<button data-n="1">Nochmal</button><button data-n="2">Schwer</button>' +
                            '<button data-n="3" class="prim">Gut</button><button data-n="4">Leicht</button>' +
                            '</div>'
                        : '<div class="fbtns"><button data-a="auf" class="prim">Antwort zeigen</button></div>');
        };
        zeichne();
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="auf"]')) {
                offen = true;
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="quelle"]')) {
                const k = stapel[i];
                const q = Links.seiteVon(k.id);
                if (q) {
                    o.remove();
                    App.oeffne(q.id);
                }
                return;
            }
            const n = elVon(e)?.closest('[data-n]');
            if (n) {
                planen(stapel[i], Number(n.dataset.n));
                gelernt++;
                i++;
                offen = false;
                zeichne();
            }
        });
        document.addEventListener('keydown', function tast(e) {
            if (!document.body.contains(o)) {
                document.removeEventListener('keydown', tast);
                return;
            }
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (!offen) {
                    offen = true;
                    zeichne();
                }
            }
            if (offen && /^[1-4]$/.test(e.key)) {
                planen(stapel[i], +e.key);
                gelernt++;
                i++;
                offen = false;
                zeichne();
            }
        });
    };
    const teileKarte = (k) => {
        const neu = lernModul();
        if (neu?.splitCard)
            return neu.splitCard(k);
        const t = k.text || '';
        const i = t.indexOf('::');
        return i >= 0 ? [t.slice(0, i).trim(), t.slice(i + 2).trim()] : [t, '(noch keine Antwort — mit :: trennen)'];
    };
    const versionen = async (p) => {
        let liste;
        try {
            liste = await Store.versionen(p.id);
        }
        catch (err) {
            UI.toast('Der Versionsverlauf ist gerade nicht lesbar — bitte nichts überschreiben');
            if (typeof Reporter !== 'undefined')
                Reporter.error('wissen', 'Versionsverlauf nicht lesbar', err);
            return;
        }
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(620px,94vw)">' +
                `<div class="fh">Versionsverlauf <em>${liste.length}</em>` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res">' +
                (liste.length ? liste.map(v => `<button data-v="${v.id}">` +
                    `<span>${esc(v.icon)}</span>` +
                    `<span style="flex:1">${esc(v.titel)}` +
                    `<span class="snip">${esc(new Date(v.zeit).toLocaleString('de-DE'))} · ${esc(v.anlass)}</span></span>` +
                    `<span class="pth" data-vgl="${v.id}" style="color:var(--text-dim);cursor:pointer" ` +
                    `title="Diese Fassung mit dem jetzigen Stand vergleichen">Vergleichen</span>` +
                    `<span class="pth" data-a="zurueck" style="color:var(--accent);cursor:pointer">Wiederherstellen</span>` +
                    '</button>').join('')
                    : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
                        'Noch keine gespeicherten Fassungen. Die App legt beim Bearbeiten automatisch welche an.</div>') +
                '</div>' +
                '<div class="fbtns">' +
                '<button data-a="vergleich">⇄ Vergleichen</button>' +
                '<button data-a="jetzt" class="prim">Jetzige Fassung sichern</button></div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="vergleich"]')) {
                o.remove();
                Vergleich.dialog(p);
                return;
            }
            if (elVon(e)?.closest('[data-a="jetzt"]')) {
                await Store.versionSpeichern(p.id, 'von Hand');
                o.remove();
                UI.toast('Fassung gesichert');
                versionen(p);
                return;
            }
            const vgl = elVon(e)?.closest('[data-vgl]');
            if (vgl) {
                o.remove();
                Vergleich.dialog(p, vgl.dataset.vgl);
                return;
            }
            const b = elVon(e)?.closest('button[data-v]');
            if (!b)
                return;
            const v = liste.find(x => x.id === b.dataset.v);
            if (!v)
                return;
            if (!confirm('Diese Fassung wiederherstellen? Der jetzige Inhalt wird vorher als Version gesichert.'))
                return;
            await Store.versionSpeichern(p.id, 'vor Wiederherstellung');
            Store.baumAbgleichen(p.id, v.daten);
            Store.updateBlock(p.id, { text: v.daten.text, icon: v.daten.icon });
            o.remove();
            App.zeichneBaum();
            App.zeichneSeite();
            UI.toast('Fassung wiederhergestellt');
        });
    };
    let letzteSicherung = {};
    const versionAutomatisch = async (pageId) => {
        if (!pageId)
            return;
        if (Store.getMeta('autoVersionen', true) === false)
            return;
        const p = Store.getBlock(pageId);
        if (!p || p.locked)
            return;
        const jetzt = Date.now();
        if (letzteSicherung[pageId] && jetzt - letzteSicherung[pageId] < 4 * 60 * 1000)
            return;
        letzteSicherung[pageId] = jetzt;
        await Store.versionSpeichern(pageId, 'automatisch');
    };
    const schluesselCache = new Map();
    const schluessel = async (pass, salzB64) => {
        const salz = Uint8Array.from(atob(salzB64), c => c.charCodeAt(0));
        const roh = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salz, iterations: 250000, hash: 'SHA-256' }, roh, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    };
    const b64 = (buf) => Bytes.toBase64(buf);
    const vonB64 = (s) => Bytes.fromBase64(s);
    const sperren = async (p) => {
        if (!crypto.subtle) {
            alert('Verschlüsselung braucht einen sicheren Kontext (https oder lokale Datei).');
            return;
        }
        const pass = prompt('Passwort für diese Seite festlegen.\n\nAchtung: Ohne dieses Passwort ist der Inhalt endgültig weg.');
        if (!pass)
            return;
        const pass2 = prompt('Passwort zur Sicherheit noch einmal:');
        if (pass !== pass2) {
            alert('Die Passwörter stimmen nicht überein.');
            return;
        }
        const salz = b64(crypto.getRandomValues(new Uint8Array(16)));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const k = await schluessel(pass, salz);
        const klartext = JSON.stringify(Store.baum(p.id).kinder || []);
        const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(klartext));
        try {
            const probe = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, chiffre);
            if (new TextDecoder().decode(probe) !== klartext)
                throw new Error('Probe fehlgeschlagen');
        }
        catch (err) {
            alert('Verschlüsselung fehlgeschlagen — es wurde nichts verändert.');
            return;
        }
        const mitgabe = {};
        if (typeof Ereignisse !== 'undefined' && typeof ARTEN !== 'undefined' && ARTEN.seiteWirdGesperrt) {
            try {
                for (const a of Ereignisse.frage(ARTEN.seiteWirdGesperrt, { id: p.id }))
                    if (a && typeof a === 'object')
                        Object.assign(mitgabe, a);
            }
            catch { }
        }
        delete mitgabe['locked'];
        delete mitgabe['id'];
        Store.kinderLeeren(p.id);
        Store.updateBlock(p.id, { ...mitgabe, locked: { salz, iv: b64(iv), daten: b64(chiffre), zeit: Store.now() } });
        schluesselCache.delete(p.id);
        App.zeichneSeite();
        App.zeichneBaum();
        UI.toast('Seite verschlüsselt');
    };
    const entsperren = async (p, passVorgabe) => {
        const l = p.locked;
        if (!l)
            return true;
        const pass = passVorgabe || prompt('Passwort dieser Seite:');
        if (!pass)
            return false;
        try {
            const k = await schluessel(pass, l.salz);
            const klar = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: vonB64(l.iv) }, k, vonB64(l.daten));
            const kinder = JSON.parse(new TextDecoder().decode(klar));
            Store.kinderLeeren(p.id);
            kinder.forEach((kd) => Store.baumEinfuegen(kd, p.id));
            Store.updateBlock(p.id, { locked: null });
            App.zeichneSeite();
            App.zeichneBaum();
            UI.toast('Seite entsperrt');
            return true;
        }
        catch (err) {
            UI.toast('Falsches Passwort');
            return false;
        }
    };
    const sperrAnsicht = (p, wrap) => {
        const d = document.createElement('div');
        d.className = 'gesperrt';
        d.innerHTML =
            '<div style="font-size:44px">🔒</div>' +
                '<div style="font-size:17px; margin:12px 0 4px">Diese Seite ist verschlüsselt</div>' +
                '<div style="font-size:13.5px; color:var(--text-dim); margin-bottom:16px">' +
                'Verschlüsselt am ' + esc(new Date(p.locked.zeit).toLocaleString('de-DE')) + '</div>' +
                '<input type="password" id="pw" placeholder="Passwort" autocomplete="off">' +
                '<button class="prim" id="auf">Entsperren</button>';
        wrap.appendChild(d);
        const inp = d.querySelector('#pw');
        if (!inp)
            return;
        const los = () => entsperren(p, inp.value);
        d.querySelector('#auf')?.addEventListener('click', los);
        inp.addEventListener('keydown', e => { if (e.key === 'Enter')
            los(); });
        setTimeout(() => inp.focus(), 50);
    };
    const fokus = (an) => {
        const jetzt = an === undefined ? !document.body.classList.contains('fokus') : an;
        document.body.classList.toggle('fokus', jetzt);
        UI.toast(jetzt ? 'Fokus-Modus — Esc beendet ihn' : 'Fokus-Modus beendet');
        if (jetzt) {
            const raus = (e) => {
                if (e.key === 'Escape') {
                    fokus(false);
                    document.removeEventListener('keydown', raus);
                }
            };
            document.addEventListener('keydown', raus);
        }
    };
    const praesentation = async (p) => {
        const bilder = (await bilderSammeln(p, false)).adressen;
        const folien = Folien.teilen(p, (id) => Store.childrenOf(id))
            .map((f) => ({ titel: f.titel,
            bloecke: f.eintraege.map((e) => ({ b: e.block, tiefe: e.tiefe })) }));
        const o = document.createElement('div');
        o.className = 'praesi';
        document.body.appendChild(o);
        let i = 0;
        let schritt = 0;
        const deckelDerFolie = (f) => {
            const raus = [];
            const nimm = (b, tiefe) => {
                if (!b || tiefe > 6)
                    return;
                if (Array.isArray(b.marken))
                    for (const m of b.marken)
                        if (m && m.art === 'abdeck')
                            raus.push(m);
                if (b.type === 'columns' || b.type === 'columns3' || b.type === 'spalte')
                    for (const k of Store.childrenOf(b.id) || [])
                        nimm(k, tiefe + 1);
            };
            for (const e of f?.bloecke || [])
                nimm(e.b, 0);
            return raus;
        };
        const uebergangDerFolie = (f) => {
            for (const e of f?.bloecke || []) {
                const u = e?.b?.uebergang;
                if (u && typeof u === 'object' && u.art)
                    return u;
            }
            return null;
        };
        const schritteDerFolie = (f) => deckelDerFolie(f)
            .reduce((m, d) => Math.max(m, Number(d.schritt) || 0), 0);
        const deckelAnwenden = () => {
            o.querySelectorAll('[data-ink-art="abdeck"][data-schritt]')
                .forEach(knoten => {
                const s = Number(knoten.getAttribute('data-schritt')) || 0;
                if (s <= schritt)
                    knoten.setAttribute('data-auf', '1');
                else
                    knoten.removeAttribute('data-auf');
            });
        };
        const zaehlerText = () => {
            const max = schritteDerFolie(folien[i]);
            return `${i + 1} / ${folien.length}` + (max ? ` · Schritt ${schritt}/${max}` : '');
        };
        const zaehlerAuffrischen = () => {
            const feld = o.querySelector('.praesi-leiste span');
            if (feld)
                feld.textContent = zaehlerText();
        };
        const zeichne = () => {
            const f = folien[i];
            if (!f) {
                o.innerHTML = '<div class="folie"><h1>Nichts zu zeigen</h1>' +
                    '<p>Auf dieser Seite steht noch kein Inhalt.</p></div>' +
                    '<div class="praesi-leiste"><button data-a="zu">Beenden (Esc)</button></div>';
                return;
            }
            o.innerHTML =
                '<div class="folie">' +
                    (f.titel ? `<h1>${Blocks.inline(f.titel)}</h1>` : '') +
                    f.bloecke.map(({ b, tiefe }) => folieBlock(b, tiefe)).join('') +
                    '</div>' +
                    `<div class="praesi-leiste">` +
                    `<button data-a="vor">‹</button>` +
                    `<span>${zaehlerText()}</span>` +
                    `<button data-a="zurueck">›</button>` +
                    `<button data-a="zu">Beenden (Esc)</button>` +
                    `</div>`;
            const bild = o.querySelector('.folie');
            const ueb = uebergangDerFolie(f);
            if (bild && ueb && ueb.art !== 'keine'
                && !AppEinstellung.wenigBewegung()) {
                bild.style.setProperty('--ueb-dauer', Math.round(Math.max(150, Math.min(3000, Number(ueb.dauer) || 700))) + 'ms');
                bild.dataset.uebergang = String(ueb.art);
                if (ueb.richtung)
                    bild.dataset.uebergangRichtung = String(ueb.richtung);
            }
            deckelAnwenden();
        };
        const folieBlock = (b, tiefe) => {
            const ein = ` style="margin-left:${tiefe * 26}px"`;
            if (b.type === 'h1' || b.type === 'h2')
                return `<h2${ein}>${Blocks.inline(b.text || '')}</h2>`;
            if (b.type === 'h3')
                return `<h3${ein}>${Blocks.inline(b.text || '')}</h3>`;
            if (b.type === 'bullet')
                return `<li${ein}>${Blocks.inline(b.text || '')}</li>`;
            if (b.type === 'number')
                return `<li${ein} class="nr">${Blocks.inline(b.text || '')}</li>`;
            if (b.type === 'todo')
                return `<li${ein} class="td">${b.checked ? '☑' : '☐'} ${Blocks.inline(b.text || '')}</li>`;
            if (b.type === 'quote')
                return `<blockquote${ein}>${Blocks.inline(b.text || '')}</blockquote>`;
            if (b.type === 'code')
                return `<pre${ein}>${esc(b.text || '')}</pre>`;
            if (b.type === 'callout')
                return `<div class="cal"${ein}>${esc(b.icon || '💡')} ${Blocks.inline(b.text || '')}</div>`;
            if (b.type === 'image' && b.src)
                return `<img src="${esc(b.src)}" alt="">`;
            if (b.type === 'equation')
                return `<div class="eqp">${Zusatz.mathe(b.text || '')}</div>`;
            if (b.type === 'divider')
                return '<hr>';
            if (b.type === 'table')
                return tabelleHtml(b);
            if (b.type === 'database')
                return datenbankHtml(b);
            if (b.type === 'columns' || b.type === 'columns3') {
                const spalten = Store.childrenOf(b.id)
                    .map((sp) => '<div class="folie-spalte">' +
                    (sp.type === 'spalte'
                        ? Store.childrenOf(sp.id).map((k) => folieBlock(k, 0)).join('')
                        : folieBlock(sp, 0)) +
                    '</div>').join('');
                return `<div class="folie-spalten">${spalten}</div>`;
            }
            if (b.type === 'pdfseite') {
                const bw = Number(b.bw) || 595.28, bh = Number(b.bh) || 841.89;
                const adr = bilder[b.id] || '';
                return '<figure class="folie-blatt" ' +
                    `style="aspect-ratio:${bw} / ${bh}; --seitenmass:${bw} / ${bh}">` +
                    (adr ? `<img src="${esc(adr)}" alt="Seite ${esc(b.nr || '')}">`
                        : `<div class="fehlt">Seite ${esc(b.nr || '')} — kein Bild</div>`) +
                    markenAlsSvg(b, bw, bh) + '</figure>';
            }
            if (b.type === 'blatt') {
                const bw = Number(b.blattBreite) || 595.28;
                const bh = Number(b.blattHoehe) || 841.89;
                return '<figure class="folie-blatt papier" ' +
                    `style="aspect-ratio:${bw} / ${bh}; --seitenmass:${bw} / ${bh}">` +
                    '<div class="blatt-text">' +
                    Store.childrenOf(b.id).map((k) => folieBlock(k, 0)).join('') +
                    '</div>' + markenAlsSvg(b, bw, bh) + '</figure>';
            }
            return b.text ? `<p${ein}>${Blocks.inline(b.text)}</p>` : '';
        };
        const springe = (n, aufVoll = false) => {
            i = Math.max(0, Math.min(folien.length - 1, n));
            schritt = aufVoll ? schritteDerFolie(folien[i]) : 0;
            zeichne();
        };
        const weiter = (n) => {
            if (n > 0 && schritt < schritteDerFolie(folien[i])) {
                schritt++;
                deckelAnwenden();
                zaehlerAuffrischen();
                return;
            }
            if (n < 0 && schritt > 0) {
                schritt--;
                deckelAnwenden();
                zaehlerAuffrischen();
                return;
            }
            springe(i + n, n < 0);
        };
        const tasten = (e) => {
            if (e.key === 'Escape') {
                schliessen();
                return;
            }
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
                e.preventDefault();
                weiter(1);
            }
            if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                weiter(-1);
            }
            if (e.key === 'Home')
                springe(0);
            if (e.key === 'End')
                springe(folien.length - 1, true);
        };
        const schliessen = () => {
            o.remove();
            document.removeEventListener('keydown', tasten);
            if (document.fullscreenElement)
                document.exitFullscreen().catch(() => { });
        };
        o.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="zu"]'))
                return schliessen();
            if (elVon(e)?.closest('[data-a="vor"]'))
                return weiter(-1);
            if (elVon(e)?.closest('[data-a="zurueck"]'))
                return weiter(1);
            if (elVon(e)?.closest('.praesi-leiste'))
                return;
            const deckel = elVon(e)?.closest?.('[data-ink-art="abdeck"]');
            if (deckel) {
                deckel.setAttribute('data-auf', '1');
                return;
            }
            weiter(1);
        });
        document.addEventListener('keydown', tasten);
        zeichne();
        o.requestFullscreen?.().catch(() => { });
    };
    const quelltext = (p) => {
        const md = alsMarkdown(p);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(820px,95vw)">' +
                '<div class="fh">Markdown-Quelltext <em>' + esc(p.text || 'Ohne Titel') + '</em>' +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<textarea id="mdq" spellcheck="false"></textarea>' +
                '<div class="hint" style="padding:0 14px 10px; line-height:1.5">' +
                'Die Zeilen wie <code>&lt;!--blk:…--&gt;</code> sind PDF-Seiten, ' +
                'Blätter, Tabellen und Spalten. Sie bleiben unverändert, solange ' +
                'die Zeile stehen bleibt.<br>' +
                'Farben, Schriftgrössen und die Verschachtelung von Listen kann ' +
                'Markdown nicht tragen — sie gehen beim Übernehmen verloren. ' +
                'Eine Fassung wird vorher gesichert.' +
                '</div>' +
                '<div class="fbtns">' +
                '<button data-a="kopieren">Kopieren</button>' +
                '<button data-a="datei">Als .md speichern</button>' +
                '<button data-a="ok" class="prim">Übernehmen</button>' +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        const ta = o.querySelector('#mdq');
        if (!ta)
            return;
        ta.value = md;
        ta.focus();
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="kopieren"]')) {
                Ablage.kopiereJetzt(ta.value, 'Kopiert');
            }
            if (elVon(e)?.closest('[data-a="datei"]'))
                App.markdownExport(p);
            if (elVon(e)?.closest('[data-a="ok"]')) {
                if (ta.value !== md) {
                    Store.versionSpeichern(p.id, 'vor Quelltext-Änderung');
                    ausMarkdown(p, ta.value);
                    App.zeichneSeite();
                    UI.toast('Übernommen');
                }
                o.remove();
            }
        });
    };
    const statistik = (p) => {
        const { woerter, zeichen, saetze, blockAnzahl, lesezeit, sprechzeit, top, alleW } = statistikZahlen(p);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(600px,94vw)">' +
                '<div class="fh">Statistik <em>' + esc(p.text || 'Ohne Titel') + '</em>' +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="stat-gitter">' +
                kachel(woerter, 'Wörter') + kachel(zeichen, 'Zeichen') +
                kachel(saetze, 'Sätze') + kachel(blockAnzahl, 'Blöcke') +
                kachel(lesezeit + ' min', 'Lesezeit') + kachel(sprechzeit + ' min', 'Vorlesezeit') +
                '</div>' +
                (top.length
                    ? '<div class="stat-woerter"><div class="grp">Häufigste Wörter</div>' +
                        top.map(([w, n]) => `<span class="tagpill">${esc(w)} <em>${n}</em></span>`).join('') + '</div>'
                    : '') +
                `<div class="hint">Im ganzen Arbeitsbereich: ${alleW.toLocaleString('de-DE')} Wörter · ` +
                `${Links.seiten().length} Seiten</div>` +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]'))
                o.remove();
        });
    };
    const kachel = (wert, name) => `<div class="stat-k"><b>${typeof wert === 'number' ? wert.toLocaleString('de-DE') : wert}</b><span>${name}</span></div>`;
    const erinnerungen = () => Store.getMeta('erinnerungen', []) || [];
    const meldungen = () => Store.getMeta('meldungen', []) || [];
    const geraeteMeldung = async (titel, text, kennung, seite = '') => {
        if (!('Notification' in window) || Notification.permission !== 'granted')
            return 'nein';
        try {
            const reg = navigator.serviceWorker && await Promise.race([
                navigator.serviceWorker.ready,
                new Promise(fertig => setTimeout(() => fertig(null), 1500))
            ]);
            if (reg && typeof reg.showNotification === 'function') {
                await reg.showNotification(titel, {
                    body: text, tag: kennung, data: { seite }
                });
                return 'dienst';
            }
        }
        catch { }
        try {
            const n = new Notification(titel, { body: text, tag: kennung });
            n.onclick = () => { window.focus(); if (seite)
                App.oeffne(seite); };
            return 'fenster';
        }
        catch {
            return 'nein';
        }
    };
    const posteingangMelden = (m) => {
        const liste = meldungen();
        liste.unshift({
            id: Store.uid(), text: m.text || '', quelle: m.quelle || '',
            seite: m.seite || '', art: m.art || 'hinweis',
            wann: new Date().toISOString(), gelesen: false
        });
        Store.setMeta('meldungen', liste.slice(0, 200));
        meldungenGeaendert();
        if (Store.getMeta('erinnernInApp', true) !== false)
            try {
                UI.toast('🔔 ' + (m.text || 'Neue Benachrichtigung'));
            }
            catch { }
        void geraeteMeldung(m.text || 'Redion', m.quelle || '', 'redion', m.seite || '');
        return liste[0];
    };
    const meldungGelesen = (id) => {
        const liste = meldungen().map((x) => x.id === id ? { ...x, gelesen: true } : x);
        Store.setMeta('meldungen', liste);
        meldungenGeaendert();
    };
    const meldungenLeeren = () => { Store.setMeta('meldungen', []); meldungenGeaendert(); };
    const meldungenAlleGelesen = () => {
        const liste = meldungen();
        const offen = liste.filter((x) => !x.gelesen).length;
        if (!offen)
            return 0;
        Store.setMeta('meldungen', liste.map((x) => x.gelesen ? x : { ...x, gelesen: true }));
        meldungenGeaendert();
        return offen;
    };
    const meldungenGeaendert = () => {
        try {
            document.dispatchEvent(new CustomEvent('redion:meldungen'));
        }
        catch { }
    };
    const alsOrtszeit = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const datumDerSeite = (p) => {
        try {
            if (!p || p.parentTable !== 'collection')
                return null;
            const coll = Store.getCollection(p.parentId);
            if (!coll || !coll.schema)
                return null;
            for (const [feld, spalte] of Object.entries(coll.schema)) {
                if (!spalte || spalte.type !== 'date')
                    continue;
                const wert = (p.props || {})[feld];
                if (!wert)
                    continue;
                const d = new Date(wert);
                if (isNaN(d.getTime()))
                    continue;
                if (d.getHours() === 0 && d.getMinutes() === 0)
                    d.setHours(8, 0, 0, 0);
                return alsOrtszeit(d);
            }
        }
        catch { }
        return null;
    };
    const erinnerungSetzen = (p) => {
        const jetzt = new Date(Date.now() + 60 * 60 * 1000);
        const vorgabe = datumDerSeite(p) || alsOrtszeit(jetzt);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(460px,94vw)">' +
                '<div class="fh">Erinnerung</div>' +
                '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px">' +
                `<label style="font-size:13px; color:var(--text-dim)">Wann?<br>` +
                `<input type="datetime-local" id="ez" value="${vorgabe}" ` +
                `style="margin-top:6px; width:100%; padding:9px 10px; background:var(--bg-input); ` +
                `border:1px solid var(--line); border-radius:7px; outline:none"></label>` +
                `<label style="font-size:13px; color:var(--text-dim)">Text<br>` +
                `<input id="et" value="${esc(p.text || 'Erinnerung')}" ` +
                `style="margin-top:6px; width:100%; padding:9px 10px; background:var(--bg-input); ` +
                `border:1px solid var(--line); border-radius:7px; outline:none"></label>` +
                '<div style="font-size:12.5px; color:var(--text-faint); line-height:1.6">' +
                'Die Erinnerung meldet sich, <b>solange Redion offen ist</b> — auch in ' +
                'einem Hintergrund-Tab. Ist Redion zu dieser Zeit geschlossen, wartet sie ' +
                'und meldet sich beim nächsten Öffnen als verpasst.' +
                (/iPad|iPhone|iPod/.test(navigator.userAgent)
                    ? '<br><br>Auf dem iPhone zeigt nur die <b>installierte App</b> ' +
                        'Systemmeldungen (Teilen → „Zum Home-Bildschirm"). In Safari selbst ' +
                        'erscheint die Erinnerung nur in Redion.'
                    : ' Erlaubst du Benachrichtigungen, meldet sie sich auch im System.') +
                '</div>' +
                '</div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Erinnerung setzen</button>' +
                '<button data-a="zu">Abbrechen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (!elVon(e)?.closest('[data-a="ok"]'))
                return;
            const zeit = o.querySelector('#ez')?.value ?? '';
            const text = o.querySelector('#et')?.value ?? '';
            if (!zeit)
                return;
            const liste = erinnerungen();
            liste.push({ id: Store.uid(), pageId: p.id, zeit, text, erledigt: false });
            Store.setMeta('erinnerungen', liste);
            if ('Notification' in window && Notification.permission === 'default') {
                try {
                    await Notification.requestPermission();
                }
                catch { }
            }
            void weckrufLegen();
            o.remove();
            UI.toast('Erinnerung gesetzt für ' + new Date(zeit).toLocaleString('de-DE'));
            App.zeichneSeite();
        });
    };
    const naechsteErinnerung = () => {
        const jetzt = Date.now();
        const offen = erinnerungen()
            .filter((e) => e && !e.erledigt && e.zeit && new Date(e.zeit).getTime() > jetzt)
            .map((e) => new Date(e.zeit).getTime())
            .sort((a, b) => a - b);
        return offen.length ? new Date(offen[0]).toISOString() : '';
    };
    const b64uZuBytes = (text) => {
        const s = String(text || '').replace(/-/g, '+').replace(/_/g, '/');
        const roh = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
        const b = new Uint8Array(roh.length);
        for (let i = 0; i < roh.length; i++)
            b[i] = roh.charCodeAt(i);
        return b;
    };
    const bytesZuB64u = (b) => {
        if (!b)
            return '';
        const x = new Uint8Array(b);
        let s = '';
        for (const c of x)
            s += String.fromCharCode(c);
        return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };
    const weckrufLegen = async () => {
        try {
            if (typeof Wolke === 'undefined' || !Wolke.angemeldet())
                return 'kein-server';
            if (!('serviceWorker' in navigator) || !('PushManager' in window))
                return 'nein';
            if (!('Notification' in window) || Notification.permission !== 'granted')
                return 'nein';
            const schluessel = await Wolke.ruf('/push/schluessel');
            const oeffentlich = schluessel && schluessel.oeffentlich;
            if (!oeffentlich)
                return 'kein-server';
            const reg = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise(f => setTimeout(() => f(null), 2000))
            ]);
            if (!reg || !reg.pushManager)
                return 'nein';
            let ab = await reg.pushManager.getSubscription();
            if (!ab)
                ab = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: b64uZuBytes(oeffentlich)
                });
            if (!ab)
                return 'nein';
            const geraet = Wolke.geraeteName();
            await Wolke.ruf('/push/anmelden', { m: 'POST', k: {
                    geraet, endpunkt: ab.endpoint,
                    p256dh: bytesZuB64u(ab.getKey ? ab.getKey('p256dh') : null),
                    auth: bytesZuB64u(ab.getKey ? ab.getKey('auth') : null)
                } });
            await Wolke.ruf('/push/wecken', { m: 'POST',
                k: { geraet, wann: naechsteErinnerung() } });
            return 'gelegt';
        }
        catch {
            return 'nein';
        }
    };
    const erinnerungenPruefen = () => {
        const liste = erinnerungen();
        let geaendert = false;
        const jetzt = Date.now();
        liste.forEach((e) => {
            if (e.erledigt)
                return;
            if (new Date(e.zeit).getTime() > jetzt)
                return;
            e.erledigt = true;
            geaendert = true;
            const gemeint = new Date(e.zeit);
            const spaet = jetzt - gemeint.getTime() > 120000;
            const wann = gemeint.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            UI.toast(spaet ? 'Verpasst um ' + wann + ': ' + e.text : '⏰ ' + e.text);
            void geraeteMeldung(spaet ? 'Verpasst um ' + wann : 'Erinnerung: ' + e.text, spaet ? e.text : 'In Redion', e.id, e.pageId || '');
        });
        if (geaendert) {
            Store.setMeta('erinnerungen', liste);
            void weckrufLegen();
        }
    };
    const ordnerSchreiben = async () => {
        if (!window.showDirectoryPicker) {
            const alles = Links.seiten().map(p => '# ' + (p.text || 'Ohne Titel') + '\n\n' + alsMarkdown(p)).join('\n\n---\n\n');
            lade(new Blob([alles], { type: 'text/markdown' }), 'notizen-alle-seiten.md');
            UI.toast('Dieser Browser kann keine Ordner öffnen — alles in eine Datei gespeichert');
            return;
        }
        try {
            const ordner = await window.showDirectoryPicker({ mode: 'readwrite' });
            let n = 0;
            const schreibe = async (verzeichnis, seite) => {
                const name = sauber(seite.text || 'Ohne Titel');
                const kinder = Store.childrenOf(seite.id).filter((k) => k.type === 'page');
                const datei = await verzeichnis.getFileHandle(name + '.md', { create: true });
                const w = await datei.createWritable();
                await w.write('# ' + (seite.text || 'Ohne Titel') + '\n\n' + alsMarkdown(seite) + '\n');
                await w.close();
                n++;
                if (kinder.length) {
                    const unter = await verzeichnis.getDirectoryHandle(name, { create: true });
                    for (const k of kinder)
                        await schreibe(unter, k);
                }
            };
            for (const p of Store.rootPages())
                await schreibe(ordner, p);
            UI.toast(n + ' Seiten in den Ordner geschrieben');
        }
        catch (err) {
            if (!(err instanceof Error) || err.name !== 'AbortError')
                UI.toast('Ordner konnte nicht beschrieben werden');
        }
    };
    const dateienLesen = () => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.md,.markdown,.txt,.csv,.tsv,.html,.htm,.xlsx,.xlsm,.ods,' +
            '.docx,.pptx,.ppsx,.pptm,.ppsm,.epub,.pdf,.zip,image/*';
        inp.multiple = true;
        inp.addEventListener('change', async () => {
            let n = 0;
            for (const f of Array.from(inp.files ?? [])) {
                const name = f.name.toLowerCase();
                try {
                    if (/\.zip$/i.test(name) && typeof ArchivImport !== 'undefined') {
                        const erg = await ArchivImport.importZip(f, null, { still: true });
                        UI.toast(erg.hinweis, 9000);
                        n++;
                        continue;
                    }
                    const textig = /\.(html?|htm|csv|tsv|md|markdown|txt)$/i.test(name) || f.type.startsWith('text/');
                    if (!textig && !/\.(xlsx|xlsm|docx|pptx|ppsx|pptm|ppsm|epub)$/i.test(name) && typeof ArchivImport !== 'undefined') {
                        await ArchivImport.dateiAlsDokument(f, null);
                        n++;
                        continue;
                    }
                    if (/\.(xlsx|xlsm|docx|pptx|ppsx|pptm|ppsm|epub)$/i.test(name)) {
                        const erg = await Einlesen.datei(f);
                        if (erg) {
                            UI.toast(f.name + ': ' + erg.hinweis);
                            n++;
                            continue;
                        }
                    }
                    const text = await f.text();
                    if (/\.(html|htm)$/i.test(name)) {
                        const p2 = Store.addPage(null, { text: f.name.replace(/\.[^.]+$/, ''), icon: '🌐' });
                        ausHtml(p2.id, text);
                    }
                    else if (/\.(csv|tsv)$/i.test(name)) {
                        const p2 = Store.addPage(null, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📊' });
                        Einlesen.alsDatenbank(p2.id, p2.text, Datenbank.csvZerlegen(text.replace(/^﻿/, '')));
                    }
                    else {
                        await mdDateiAnlegen(f.name, text);
                    }
                    n++;
                }
                catch (err) {
                    UI.banner(f.name + ': ' +
                        (err instanceof Error ? err.message : String(err)), 'fehler');
                }
            }
            App.zeichneBaum();
            if (typeof ArchivImport !== 'undefined')
                ArchivImport.ansichtAuffrischen();
            UI.toast(n + (n === 1 ? ' Datei eingelesen' : ' Dateien eingelesen'));
        });
        inp.click();
    };
    const ordnerLesen = async () => {
        if (!window.showDirectoryPicker) {
            dateienLesen();
            return;
        }
        try {
            const ordner = await window.showDirectoryPicker();
            let n = 0;
            const lies = async (verzeichnis, elternId) => {
                for await (const [name, eintrag] of verzeichnis.entries()) {
                    if (eintrag.kind === 'file' && /\.(md|markdown|txt)$/i.test(name)) {
                        const f = await eintrag.getFile();
                        await mdDateiAnlegen(name, await f.text(), elternId);
                        n++;
                    }
                    else if (eintrag.kind === 'directory') {
                        const p = Store.addPage(elternId, { text: name, icon: '📁' });
                        await lies(eintrag, p.id);
                    }
                }
            };
            await lies(ordner, null);
            App.zeichneBaum();
            UI.toast(n + ' Dateien eingelesen');
        }
        catch (err) {
            if (!(err instanceof Error) || err.name !== 'AbortError')
                UI.toast('Ordner konnte nicht gelesen werden');
        }
    };
    const mdDateiAnlegen = async (dateiname, text, elternId) => {
        const zeilen = text.split('\n');
        let titel = dateiname.replace(/\.(md|markdown|txt)$/i, '');
        const erste = zeilen[0] ?? '';
        if (/^#\s+/.test(erste)) {
            titel = erste.replace(/^#\s+/, '').trim();
            zeilen.shift();
        }
        const p = Store.addPage(elternId, { text: titel, icon: '📄' });
        ausMarkdown(p, zeilen.join('\n'));
        return p;
    };
    const lade = (blob, name) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };
    const einzelDatei = () => {
        const seiten = Links.seiten();
        const daten = seiten.map(p => ({
            id: p.id, titel: p.text || 'Ohne Titel', icon: p.icon || '📄',
            eltern: p.parentId || null,
            html: seiteAlsHtml(p)
        }));
        const doc = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Redion — Archiv</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
     background:#191919;color:#e9e9e7;display:flex;height:100vh;overflow:hidden}
#s{width:280px;background:#202020;border-right:1px solid #373737;overflow-y:auto;padding:14px}
#s h1{font-size:15px;margin-bottom:12px}
#s input{width:100%;padding:8px 10px;background:#2b2b2b;border:1px solid #373737;border-radius:6px;
         color:inherit;outline:none;font:inherit;font-size:13.5px;margin-bottom:10px}
#s a{display:block;padding:5px 8px;border-radius:5px;color:#9b9a97;text-decoration:none;font-size:14px;cursor:pointer}
#s a:hover,#s a.on{background:#2f2f2f;color:#e9e9e7}
#m{flex:1;overflow-y:auto;padding:44px 8vw 30vh}
h2{font-size:34px;margin-bottom:18px;letter-spacing:-.4px}
h3{font-size:24px;margin:22px 0 8px}h4{font-size:19px;margin:18px 0 6px}
p{margin:5px 0}li{margin-left:22px}blockquote{border-left:3px solid #666;padding-left:14px;margin:8px 0}
pre{background:#252525;padding:14px;border-radius:6px;overflow-x:auto;font-size:13.5px;margin:8px 0}
code{background:#252525;padding:1px 5px;border-radius:3px;font-size:13.5px}
hr{border:none;border-top:1px solid #373737;margin:14px 0}
table{border-collapse:collapse;margin:10px 0;font-size:14px}
td,th{border:1px solid #373737;padding:6px 9px;text-align:left}
.cal{background:#252525;border-radius:6px;padding:14px;margin:8px 0}
img{max-width:100%;border-radius:4px}
.tag{background:#454b4e;padding:1px 7px;border-radius:3px;font-size:12.5px}
@media(max-width:760px){body{flex-direction:column}#s{width:100%;height:180px}}
</style></head><body>
<div id="s"><h1>📓 Redion</h1><input id="q" placeholder="Suchen …"><div id="nav"></div></div>
<div id="m"></div>
<script>
const D = ${JSON.stringify(daten)};
const nav = document.getElementById('nav'), m = document.getElementById('m');
const zeichneNav = (f='') => {
  nav.innerHTML = '';
  D.filter(p => !f || (p.titel+p.html).toLowerCase().includes(f.toLowerCase())).forEach(p => {
    const a = document.createElement('a');
    a.textContent = p.icon + ' ' + p.titel;
    a.onclick = () => oeffne(p.id);
    a.dataset.id = p.id;
    nav.appendChild(a);
  });
};
const oeffne = (id) => {
  const p = D.find(x => x.id === id); if (!p) return;
  m.innerHTML = '<h2>' + p.icon + ' ' + p.titel + '</h2>' + p.html;
  m.scrollTop = 0;
  [...nav.children].forEach(a => a.classList.toggle('on', a.dataset.id === id));
  location.hash = id;
};
document.getElementById('q').oninput = e => zeichneNav(e.target.value);
zeichneNav();
oeffne(location.hash.slice(1) || (D[0] && D[0].id));
<\/script></body></html>`;
        const blob = new Blob([doc], { type: 'text/html' });
        lade(blob, 'notizen-archiv-' + heute() + '.html');
        UI.toast(seiten.length + ' Seiten in eine HTML-Datei gepackt');
        return blob;
    };
    const seiteAlsHtml = (p, sonderfall) => {
        const raus = (id, tiefe) => {
            let h = '';
            let offen = '';
            const listeHalten = (art) => {
                if (art === offen)
                    return;
                if (offen)
                    h += '</' + offen + '>';
                if (art)
                    h += '<' + art + '>';
                offen = art;
            };
            const LISTENART = { bullet: 'ul', todo: 'ul', number: 'ol' };
            Store.childrenOf(id).forEach((b) => {
                listeHalten(LISTENART[b.type] || '');
                if (sonderfall) {
                    const eigen = sonderfall(b, tiefe, raus);
                    if (eigen !== null && eigen !== undefined) {
                        h += eigen;
                        return;
                    }
                }
                const t = b.text || '';
                if (b.type === 'h1')
                    h += `<h3>${Blocks.inline(t)}</h3>`;
                else if (b.type === 'h2')
                    h += `<h4>${Blocks.inline(t)}</h4>`;
                else if (b.type === 'h3')
                    h += `<h4>${Blocks.inline(t)}</h4>`;
                else if (b.type === 'bullet')
                    h += `<li>${Blocks.inline(t)}</li>`;
                else if (b.type === 'number')
                    h += `<li>${Blocks.inline(t)}</li>`;
                else if (b.type === 'todo')
                    h += `<li>${b.checked ? '☑' : '☐'} ${Blocks.inline(t)}</li>`;
                else if (b.type === 'toggle')
                    h += `<details open><summary>${Blocks.inline(t)}</summary>${raus(b.id, tiefe + 1)}</details>`;
                else if (b.type === 'quote')
                    h += `<blockquote>${Blocks.inline(t)}</blockquote>`;
                else if (b.type === 'callout')
                    h += `<div class="cal">${esc(b.icon || '💡')} ${Blocks.inline(t)}</div>`;
                else if (b.type === 'code')
                    h += `<pre>${esc(t)}</pre>`;
                else if (b.type === 'equation')
                    h += `<div>${Zusatz.mathe(t)}</div>`;
                else if (b.type === 'divider')
                    h += '<hr>';
                else if (b.type === 'image' && b.src)
                    h += `<img src="${esc(b.src)}" alt="${esc(b.caption || '')}">`;
                else if (b.type === 'table')
                    h += tabelleHtml(b);
                else if (b.type === 'database')
                    h += datenbankHtml(b);
                else if (b.type === 'page')
                    h += `<p>📄 <b>${esc(t || 'Ohne Titel')}</b></p>`;
                else if (b.type === 'pdfseite')
                    h += `<p>📄 Seite ${esc(b.nr || '?')}` +
                        (b.vonSeiten ? ' von ' + esc(b.vonSeiten) : '') + '</p>';
                else if (t)
                    h += `<p>${Blocks.inline(t)}</p>`;
                if (b.type !== 'toggle' && b.type !== 'page')
                    h += raus(b.id, tiefe + 1);
            });
            listeHalten('');
            return h;
        };
        return raus(p.id, 0);
    };
    const tabelleHtml = (b) => {
        const rows = b.rows || [];
        return '<table>' + rows.map((z, i) => '<tr>' + z.map((c) => (b.kopfZeile !== false && i === 0) ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</table>';
    };
    const datenbankHtml = (b) => {
        const c = Store.getCollection(b.collectionId);
        if (!c)
            return '';
        const keys = Object.keys(c.schema);
        return `<p><b>${esc(c.name || 'Datenbank')}</b></p><table><tr>` +
            keys.map(k => `<th>${esc(c.schema[k].name)}</th>`).join('') + '</tr>' +
            Store.rowsOf(c.id).map(r => '<tr>' + keys.map(k => `<td>${esc(Formula.anzeige(Datenbank.wert(r, k, c)))}</td>`).join('') + '</tr>').join('') +
            '</table>';
    };
    const htmlExport = (p) => {
        const doc = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(p.text || 'Seite')}</title>` +
            '<style>body{font:16px/1.65 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px}' +
            'pre{background:#f5f5f4;padding:14px;border-radius:6px;overflow-x:auto}code{background:#f5f5f4;padding:1px 5px;border-radius:3px}' +
            'blockquote{border-left:3px solid #ddd;padding-left:14px;color:#555}table{border-collapse:collapse}' +
            'td,th{border:1px solid #ddd;padding:6px 9px}.cal{background:#f5f5f4;padding:14px;border-radius:6px}' +
            'img{max-width:100%}</style></head><body>' +
            `<h1>${esc(p.icon || '')} ${esc(p.text || 'Ohne Titel')}</h1>` + seiteAlsHtml(p) + '</body></html>';
        lade(new Blob([doc], { type: 'text/html' }), sauber(p.text) + '.html');
        UI.toast('Als HTML gespeichert');
    };
    const alsDatenAdresse = async (dateiId) => {
        try {
            const blob = await Dateien.alsBlob(dateiId);
            if (!blob)
                return '';
            return await new Promise(fertig => {
                const leser = new FileReader();
                leser.onload = () => fertig(String(leser.result || ''));
                leser.onerror = () => fertig('');
                leser.readAsDataURL(blob);
            });
        }
        catch {
            return '';
        }
    };
    const DRUCK_BILDER_MAX = 40 * 1024 * 1024;
    const bilderSammeln = async (p, alsDaten = true) => {
        const adressen = {};
        const ausgelassen = [];
        let summe = 0;
        const gehe = async (id, tiefe) => {
            if (tiefe > 6)
                return;
            for (const b of Store.childrenOf(id)) {
                if (b.type === 'page')
                    continue;
                if (b.type === 'pdfseite' && b.bildDateiId) {
                    if (!alsDaten) {
                        adressen[b.id] = (await Dateien.adresse(b.bildDateiId)) || '';
                    }
                    else {
                        const satz = await Store.dateiHolen(b.bildDateiId);
                        const gross = Number(satz?.groesse) || 0;
                        if (summe + gross > DRUCK_BILDER_MAX && summe > 0) {
                            ausgelassen.push(b.id);
                        }
                        else {
                            adressen[b.id] = await alsDatenAdresse(b.bildDateiId);
                            summe += gross;
                        }
                    }
                }
                await gehe(b.id, tiefe + 1);
            }
        };
        await gehe(p.id, 0);
        return { adressen, ausgelassen };
    };
    const markenAlsSvg = (block, breite, hoehe, rand = 0) => {
        const marken = Array.isArray(block.marken) ? block.marken : [];
        if (!marken.length || typeof Marken === 'undefined')
            return '';
        const teile = marken
            .map((m) => Marken.zeichneMarke(m))
            .filter(Boolean)
            .map((k) => k.outerHTML)
            .join('');
        if (!teile)
            return '';
        const defs = typeof Marken.verlaufDefs === 'function'
            ? (Marken.verlaufDefs(marken)?.outerHTML || '') : '';
        return `<svg class="marken" viewBox="0 0 ${breite + Math.max(0, rand)} ${hoehe}" ` +
            `preserveAspectRatio="none">${defs}${teile}</svg>`;
    };
    const DRUCK_STIL = '.blatt-druck{position:relative; width:100%; margin:0 0 8mm; ' +
        'break-inside:avoid; page-break-inside:avoid}' +
        '.blatt-druck img{display:block; width:100%}' +
        '.blatt-druck.papier{background:#fff; border:1px solid #ccc}' +
        '.blatt-druck .blatt-text{padding:9.5%; font-size:11pt}' +
        '.blatt-druck .marken{position:absolute; inset:0; width:100%; height:100%; ' +
        'color:#111}' +
        '.blatt-druck.mit-rand img{width:var(--seiten-anteil,100%)}' +
        '.blatt-druck.mit-rand{background:#fff}' +
        '.blatt-druck .fehlt{padding:30mm 10mm; text-align:center; color:#666; ' +
        'border:1px dashed #bbb}';
    const druckLauf = async (p, karte) => {
        karte?.setzen('vorbereiten');
        const { adressen: bilder, ausgelassen } = await bilderSammeln(p);
        const zuGross = new Set(ausgelassen);
        if (ausgelassen.length)
            UI.toast(ausgelassen.length + ' Seitenbild' +
                (ausgelassen.length === 1 ? '' : 'er') + ' ist für einen Ausdruck zu ' +
                'gross und bleibt leer — drucke das Dokument in Abschnitten.', 8000);
        karte?.setzen('rendern');
        const inhalt = seiteAlsHtml(p, (b, tiefe, hinab) => {
            if (b.type === 'pdfseite') {
                const bw = Number(b.bw) || 595.28, bh = Number(b.bh) || 841.89;
                const adr = bilder[b.id] || '';
                const fehlt = zuGross.has(b.id)
                    ? `Seite ${esc(b.nr || '')} — dieses Dokument ist für einen ` +
                        'Ausdruck am Stück zu gross. Die Striche stehen unten trotzdem; ' +
                        'für das Seitenbild drucke das Dokument in Abschnitten.'
                    : `Seite ${esc(b.nr || '')} — das Bild fehlt in diesem Bestand. ` +
                        'Hol es in Redion aus dem Original zurück.';
                const randDruck = Math.round(bw * Math.max(0, Math.min(1.5, Number(p.randBreite) || 0)));
                const anteil = (100 * bw / (bw + randDruck)).toFixed(4) + '%';
                return '<figure class="blatt-druck' + (randDruck ? ' mit-rand' : '') +
                    '" style="--seiten-anteil:' + anteil + '">' +
                    (adr ? `<img src="${esc(adr)}" alt="Seite ${esc(b.nr || '')}">`
                        : `<div class="fehlt">${fehlt}</div>`) +
                    markenAlsSvg(b, bw, bh, randDruck) + '</figure>';
            }
            if (b.type === 'blatt') {
                const bw = Number(b.blattBreite) || 595.28;
                const bh = Number(b.blattHoehe) || 841.89;
                return '<figure class="blatt-druck papier" ' +
                    `style="aspect-ratio:${bw} / ${bh}">` +
                    '<div class="blatt-text">' + hinab(b.id, tiefe + 1) + '</div>' +
                    markenAlsSvg(b, bw, bh) + '</figure>';
            }
            if (b.type === 'columns' || b.type === 'columns3' || b.type === 'spalte')
                return hinab(b.id, tiefe + 1);
            return null;
        });
        const f = document.createElement('iframe');
        f.style.cssText = 'position:fixed; right:0; bottom:0; width:0; height:0; border:0';
        document.body.appendChild(f);
        const d = f.contentDocument;
        if (!d) {
            f.remove();
            karte?.setzen('fehler', 'Der Druckrahmen liess sich nicht öffnen.');
            karte?.entfernen(8000);
            return;
        }
        const inhaltText = (wert) => wert.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').slice(0, 60);
        const heute = new Date();
        const druckDatum = heute.getDate() + '. ' +
            ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August',
                'September', 'Oktober', 'November', 'Dezember'][heute.getMonth()] + ' ' +
            heute.getFullYear();
        const randStil = 'font:9pt Georgia,serif;color:#555';
        d.open();
        d.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(p.text || 'Seite') + '</title>' +
            '<style>' +
            '@page{size:A4;margin:20mm 18mm 22mm;' +
            '@top-left{content:"' + inhaltText(p.text || 'Ohne Titel') + '";' + randStil + '}' +
            '@top-right{content:"' + inhaltText(druckDatum) + '";' + randStil + '}' +
            '@bottom-center{content:"Seite " counter(page) " von " counter(pages);' + randStil + '}}' +
            '@page:first{@top-left{content:none}@top-right{content:none}}' +
            'body{font:12pt/1.6 Georgia,serif;margin:0}h1{font-size:22pt}h3{font-size:16pt}h4{font-size:13pt}' +
            'pre{background:#f2f2f2;padding:10px;white-space:pre-wrap}table{border-collapse:collapse;width:100%}' +
            'td,th{border:1px solid #999;padding:5px 8px;font-size:10.5pt}img{max-width:100%}' +
            '.cal{background:#f2f2f2;padding:10px;border-radius:4px}' + DRUCK_STIL +
            '</style></head><body>' +
            '<h1>' + esc(p.text || 'Ohne Titel') + '</h1>' + inhalt + '</body></html>');
        d.close();
        setTimeout(() => {
            karte?.setzen('speichern');
            f.contentWindow?.focus();
            f.contentWindow?.print();
            karte?.setzen('fertig');
            karte?.entfernen(2500);
            setTimeout(() => f.remove(), 1000);
        }, 300);
    };
    const drucken = async (p) => {
        const karte = typeof Drucker !== 'undefined' ? Drucker.zeigen() : null;
        try {
            await druckLauf(p, karte);
        }
        catch (e) {
            const satz = e instanceof Error ? e.message : String(e);
            if (karte) {
                karte.setzen('fehler', satz);
                karte.entfernen(8000);
            }
            else
                UI.toast('Drucken hat nicht geklappt: ' + satz);
        }
    };
    const verschiebenNach = (p) => {
        const ziele = Links.seiten().filter(z => z.id !== p.id && !istUnter(z.id, p.id));
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder">' +
                '<input id="vq" placeholder="Wohin verschieben? Seite suchen …" autocomplete="off">' +
                '<div class="res" id="vr"></div>' +
                '<div class="hint">Enter wählt · Esc bricht ab</div>' +
                '</div>';
        document.body.appendChild(o);
        const inp = o.querySelector('#vq');
        const res = o.querySelector('#vr');
        if (!inp || !res)
            return;
        const zeichne = (q = '') => {
            const liste = ziele.filter(z => !q || (z.text || '').toLowerCase().includes(q.toLowerCase())).slice(0, 30);
            res.innerHTML =
                '<button data-id="__root"><span>🏠</span><span style="flex:1">Oberste Ebene</span></button>' +
                    liste.map(z => `<button data-id="${z.id}"><span>${esc(z.icon || '📄')}</span>` +
                        `<span style="flex:1">${esc(z.text || 'Ohne Titel')}</span>` +
                        `<span class="pth">${esc(Store.pathOf(z.id).slice(0, -1).map(x => x.text).join(' / '))}</span></button>`).join('');
        };
        zeichne();
        inp.addEventListener('input', () => zeichne(inp.value));
        inp.addEventListener('keydown', e => { if (e.key === 'Escape')
            o.remove(); });
        res.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-id]');
            if (!b)
                return;
            const ziel = b.dataset.id === '__root' ? null : b.dataset.id;
            verschiebe(p, ziel);
            o.remove();
        });
        inp.focus();
    };
    const verschiebe = (p, zielId, stillerHinweis = false) => {
        if (zielId && (String(zielId) === String(p.id) || istUnter(String(zielId), String(p.id)))) {
            UI.toast('Ein Ordner kann nicht in sich selbst liegen');
            return false;
        }
        const alt = Store.getBlock(p.parentId);
        if (alt) {
            alt.content = alt.content.filter((x) => x !== p.id);
            Store.updateBlock(alt.id, { content: alt.content });
        }
        Store.updateBlock(p.id, { parentId: zielId });
        if (zielId) {
            const z = Store.getBlock(zielId);
            z.content = z.content || [];
            z.content.push(p.id);
            Store.updateBlock(z.id, { content: z.content, aufgeklappt: true });
        }
        App.zeichneBaum();
        App.zeichneSeite();
        if (!stillerHinweis)
            UI.toast('Verschoben');
        return true;
    };
    const wikiUmwandeln = (p) => {
        Store.updateBlock(p.id, { wiki: !p.wiki, icon: p.wiki ? (p.icon || '📄') : '📚' });
        App.zeichneSeite();
        App.zeichneBaum();
        UI.toast(p.wiki ? 'Wieder eine normale Seite' : 'In ein Wiki umgewandelt');
    };
    const wikiIndex = (p, wrap) => {
        const kinder = Store.childrenOf(p.id).filter((k) => k.type === 'page');
        const d = document.createElement('div');
        d.className = 'wiki';
        d.innerHTML =
            '<div class="wiki-kopf"><b>📚 Wiki</b>' +
                `<span>${kinder.length} Seiten · ${kinder.filter((k) => k.geprueft).length} geprüft</span>` +
                '<button data-a="neu">＋ Seite</button></div>' +
                (kinder.length
                    ? '<table class="wiki-tab"><tr><th>Seite</th><th>Besitzer</th><th>Zuletzt geändert</th><th>Geprüft</th></tr>' +
                        kinder.map((k) => `<tr data-id="${k.id}">` +
                            `<td class="w-t">${esc(k.icon || '📄')} ${esc(k.text || 'Ohne Titel')}</td>` +
                            `<td>${esc(k.besitzer || Store.getMeta('nutzer', 'Ich'))}</td>` +
                            `<td>${esc(zeitKurz(k.edited))}</td>` +
                            `<td><button class="w-pruef${k.geprueft ? ' ja' : ''}" data-pruef="${k.id}">` +
                            `${k.geprueft ? '✓ geprüft' : 'prüfen'}</button></td>` +
                            '</tr>').join('') + '</table>'
                    : '<div class="wiki-leer">Noch keine Unterseiten. Lege die erste an.</div>');
        d.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="neu"]')) {
                const k = Store.addPage(p.id, { text: '' });
                Store.updateBlock(p.id, { aufgeklappt: true });
                App.zeichneBaum();
                App.oeffne(k.id);
                return;
            }
            const pr = elVon(e)?.closest('[data-pruef]');
            if (pr) {
                const k = Store.getBlock(pr.dataset.pruef);
                Store.updateBlock(k.id, { geprueft: !k.geprueft, besitzer: Store.getMeta('nutzer', 'Ich') });
                App.zeichneSeite();
                return;
            }
            const tr = elVon(e)?.closest('tr[data-id]');
            if (tr)
                App.oeffne(tr.dataset.id);
        });
        wrap.appendChild(d);
    };
    const wolkeDa = () => {
        const w = globalThis.Wolke;
        return !!(w?.angemeldet?.() && globalThis.WolkeFenster?.teilenFenster);
    };
    const teilenMenue = (anker, p) => {
        const r = anker.getBoundingClientRect();
        const m = UI.menu('<div class="grp">Diese Seite weitergeben</div>' +
            '<button data-a="link"><span class="mi">🔗</span>Link kopieren</button>' +
            '<button data-a="text"><span class="mi">⎘</span>Als Text kopieren</button>' +
            '<button data-a="md"><span class="mi">⭳</span>Als Markdown speichern</button>' +
            '<button data-a="html"><span class="mi">🌐</span>Als HTML-Seite speichern</button>' +
            '<button data-a="pdf"><span class="mi">🖨</span>Drucken oder als PDF</button>' +
            '<button data-a="word"><span class="mi">📘</span>Als Word-Datei (.docx)</button>' +
            '<button data-a="excel"><span class="mi">📗</span>Datenbanken als Excel (.xlsx)</button>' +
            '<hr>' +
            '<button data-a="alles"><span class="mi">📦</span>Alles als eine HTML-Datei</button>' +
            '<button data-a="ordner"><span class="mi">📁</span>Alles als Markdown-Ordner</button>' +
            '<button data-a="obsidian"><span class="mi">🔮</span>Als Obsidian-Vault (.zip)</button>' +
            '<hr>' +
            (wolkeDa()
                ? '<button data-a="wolke"><span class="mi">↗</span>Teilen und veröffentlichen …</button>' +
                    '<div class="teilen-hinweis">Eine Freigabe ist ein Link ins Netz — ' +
                    'nur die Seite, die du freigibst, und widerrufbar.</div>'
                : '<div class="teilen-hinweis">Ohne Konto heisst Weitergeben: eine Datei ' +
                    'erzeugen. Mit einem Konto (Wolke) geht auch eine Freigabe ins Netz.</div>'), r.right - 240, r.bottom + 6);
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            m.remove();
            const a = b.dataset.a;
            if (a === 'wolke') {
                globalThis.WolkeFenster.teilenFenster(p.id);
                return;
            }
            if (a === 'link') {
                Ablage.kopiereJetzt(location.origin + location.pathname + '#' + p.id, 'Link kopiert');
            }
            if (a === 'text') {
                Ablage.kopiereJetzt(alsMarkdown(p), 'Text kopiert');
            }
            if (a === 'md')
                App.markdownExport(p);
            if (a === 'html')
                htmlExport(p);
            if (a === 'pdf')
                drucken(p);
            if (a === 'word') {
                Austausch.alsWord(p).then(() => UI.toast('Word-Datei erzeugt'))
                    .catch((e) => UI.toast('Die Word-Datei kam nicht zustande: ' +
                    (e instanceof Error ? e.message : String(e))));
            }
            if (a === 'excel') {
                Austausch.allesAlsExcel()?.catch((e) => UI.toast('Die Excel-Mappe kam nicht zustande: ' +
                    (e instanceof Error ? e.message : String(e))));
            }
            if (a === 'alles')
                einzelDatei();
            if (a === 'ordner')
                ordnerSchreiben();
            if (a === 'obsidian')
                void obsidianVaultExport();
        });
    };
    const alleToggles = () => {
        const bloecke = document.querySelectorAll('.b-toggle');
        const alleAuf = [...bloecke].every(b => b.classList.contains('open'));
        bloecke.forEach(b => {
            const id = b.dataset.bid;
            if (id)
                Store.updateBlock(id, { open: !alleAuf });
        });
        App.zeichneSeite();
    };
    const BEISPIELE = [
        { name: 'istWerktag', params: ['d'],
            koerper: 'not isWeekend(d)', beschreibung: 'Fällt das Datum auf Montag bis Freitag?' },
        { name: 'alter', params: ['geburtstag'],
            koerper: 'dateBetween(today(), geburtstag, "years")', beschreibung: 'Alter in Jahren' },
        { name: 'restTage', params: ['faellig'],
            koerper: 'dateBetween(faellig, today(), "days")', beschreibung: 'Tage bis zur Frist' },
        { name: 'ampel', params: ['tage'],
            koerper: 'ifs(tage < 0, "🔴", tage <= 3, "🟡", "🟢")', beschreibung: 'Farbe nach Resttagen' },
        { name: 'mitMwst', params: ['netto'],
            koerper: 'roundTo(netto * 1.081, 2)', beschreibung: 'Schweizer Mehrwertsteuer aufschlagen' },
        { name: 'balken', params: ['anteil'],
            koerper: 'let(n, round(anteil * 10), repeat("█", n) + repeat("░", 10 - n))',
            beschreibung: 'Fortschrittsbalken aus einem Anteil zwischen 0 und 1' }
    ];
    const formelBibliothekLesen = () => Store.getMeta('formelBibliothek', []) || [];
    const formelBibliothekAnwenden = () => {
        const kaputt = Formula.setzeBibliothek(formelBibliothekLesen());
        if (kaputt.length)
            UI.banner('Eigene Formelfunktion nicht lesbar: ' + kaputt.join(' · '), 'warn');
        return kaputt;
    };
    const formelBibliothek = () => {
        let liste = formelBibliothekLesen().slice();
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(720px,95vw)">' +
                '<div class="fh">∑ Eigene Formelfunktionen<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="dl-hinweis" style="padding:10px 18px">' +
                'Einmal hier definiert, überall nutzbar — auch ineinander. ' +
                'Notion hat das nicht: dort muss dieselbe Logik in jeder Formel stehen.' +
                '</div>' +
                '<div class="res" id="fb-liste" style="max-height:52vh"></div>' +
                '<div class="fbtns">' +
                '<button data-a="neu">＋ Funktion</button>' +
                '<button data-a="beispiele">Beispiele einfügen</button>' +
                '<button data-a="ok" class="prim">Speichern</button>' +
                '<button data-a="zu">Schliessen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const kasten = o.querySelector('#fb-liste');
            if (!kasten)
                return;
            kasten.innerHTML = liste.length
                ? liste.map((f, i) => '<div class="fb-zeile" data-i="' + i + '">' +
                    '<div class="fb-kopf">' +
                    `<input class="fb-name" value="${esc(f.name || '')}" placeholder="name">` +
                    `<span class="fb-klammer">(</span>` +
                    `<input class="fb-params" value="${esc((f.params || []).join(', '))}" placeholder="a, b">` +
                    `<span class="fb-klammer">) =</span>` +
                    `<button data-weg="${i}" data-loeschknopf title="Formel löschen">🗑</button>` +
                    '</div>' +
                    `<textarea class="fb-koerper" rows="2" spellcheck="false" ` +
                    `placeholder="Formel — die Parameter stehen als Namen zur Verfügung">${esc(f.koerper || '')}</textarea>` +
                    `<input class="fb-besch" value="${esc(f.beschreibung || '')}" placeholder="Wozu ist sie gut?">` +
                    '<div class="fb-probe"></div>' +
                    '</div>').join('')
                : '<div style="padding:22px; color:var(--text-faint); font-size:14px; text-align:center">' +
                    'Noch keine eigene Funktion. „Beispiele einfügen" zeigt sechs nützliche.</div>';
            pruefen();
        };
        const einsammeln = () => {
            const wert = (z, kl) => (z.querySelector(kl)?.value ?? '').trim();
            liste = [...o.querySelectorAll('.fb-zeile')].map(z => ({
                name: wert(z, '.fb-name'),
                params: wert(z, '.fb-params').split(',').map((x) => x.trim()).filter(Boolean),
                koerper: wert(z, '.fb-koerper'),
                beschreibung: wert(z, '.fb-besch')
            })).filter(f => f.name);
            return liste;
        };
        const pruefen = () => {
            o.querySelectorAll('.fb-zeile').forEach(z => {
                const koerper = (z.querySelector('.fb-koerper')?.value ?? '').trim();
                const feld = z.querySelector('.fb-probe');
                if (!feld)
                    return;
                if (!koerper) {
                    feld.textContent = '';
                    return;
                }
                const c = Formula.check(koerper);
                if (!c.ok) {
                    feld.className = 'fb-probe schlecht';
                    feld.textContent = '⚠ ' + c.fehler;
                    return;
                }
                feld.className = 'fb-probe gut';
                feld.textContent = '✓ lesbar';
            });
        };
        o.addEventListener('input', pruefen);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                if (!elVon(e)?.closest('[data-a="ok"]')) {
                    o.remove();
                    return;
                }
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                einsammeln();
                liste.splice(Number(weg.dataset.weg), 1);
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="neu"]')) {
                einsammeln();
                liste.push({ name: '', params: [], koerper: '', beschreibung: '' });
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="beispiele"]')) {
                einsammeln();
                BEISPIELE.forEach(b => { if (!liste.some((f) => f.name === b.name))
                    liste.push({ ...b }); });
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="ok"]')) {
                einsammeln();
                Store.setMeta('formelBibliothek', liste);
                const kaputt = formelBibliothekAnwenden();
                o.remove();
                UI.toast(kaputt.length
                    ? liste.length + ' gespeichert, ' + kaputt.length + ' mit Fehler'
                    : liste.length + ' eigene Funktionen stehen jetzt in jeder Formel bereit');
                App.zeichneSeite();
            }
        });
        zeichne();
    };
    const tastenkuerzel = () => {
        const G = Register.tasten.alle();
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(760px,95vw)">' +
                '<div class="fh">Tastenkürzel' +
                `<em>${G.reduce((n, [, l]) => n + l.length, 0)}</em>` +
                '<button class="icon-btn" data-a="umlegen" title="Kürzel umbelegen">✎</button>' +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="kuerzel">' + G.map(([g, liste]) => `<div class="kb"><div class="grp">${g}</div>` + liste.map(([k, w]) => `<div class="kz"><code>${esc(k)}</code><span>${esc(w)}</span></div>`).join('') + '</div>').join('') +
                '</div></div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="umlegen"]')) {
                o.remove();
                Aussehen.dialog();
                return;
            }
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]'))
                o.remove();
        });
    };
    const mi = (name) => {
        let svg = '';
        try {
            svg = Register.symbole.alsSvg(name, 16);
        }
        catch {
            svg = '';
        }
        return `<span class="mi">${svg}</span>`;
    };
    const seitenMenueZusatz = (p) => ('<hr>' +
        '<button data-a="wz-vorlage">' + mi('puzzle') + 'Als Vorlage speichern</button>' +
        '<button data-a="wz-vorlage-ein">' + mi('plus') + 'Aus Vorlage einfügen</button>' +
        '<button data-a="wz-versionen">' + mi('history') + 'Versionsverlauf</button>' +
        `<button data-a="wz-wiki">${mi('book')}${p.wiki ? 'Wiki auflösen' : 'In Wiki umwandeln'}</button>` +
        '<button data-a="wz-teilen">' + mi('share') + 'Teilen und ausgeben</button>' +
        '<button data-a="wz-erinnerung">' + mi('alarm') + 'Erinnerung</button>' +
        '<hr>' +
        `<button data-a="wz-sperren">${mi('key')}${p.locked ? 'Entschlüsseln' : 'Verschlüsseln'}</button>` +
        '<hr>' +
        '<button data-a="wz-fokus">' + mi('maximize') + 'Fokus-Modus<span class="ms">Strg Shift F</span></button>' +
        '<button data-a="wz-quelltext">' + mi('code') + 'Markdown-Quelltext</button>' +
        '<button data-a="wz-statistik">' + mi('chart') + 'Statistik</button>' +
        '<hr>' +
        '<button data-a="wz-html">' + mi('download') + 'Als HTML</button>' +
        '<button data-a="wz-drucken">' + mi('printer') + 'Drucken / PDF</button>');
    const seitenMenueAktion = (a, p) => {
        const karte = {
            'wz-vorlage': () => alsVorlage(p),
            'wz-vorlage-ein': () => vorlageEinfuegen(p),
            'wz-verschieben': () => verschiebenNach(p),
            'wz-versionen': () => versionen(p),
            'wz-wiki': () => wikiUmwandeln(p),
            'wz-teilen': () => teilenMenue(document.getElementById('btn-page-menu'), p),
            'wz-erinnerung': () => erinnerungSetzen(p),
            'wz-sperren': () => p.locked ? entsperren(p) : sperren(p),
            'wz-gesperrt': () => {
                Store.updateBlock(p.id, { gesperrt: !p.gesperrt });
                App.zeichneSeite();
                UI.toast(p.gesperrt ? 'Bearbeiten wieder erlaubt' : 'Seite gegen Bearbeiten gesperrt');
            },
            'wz-fokus': () => fokus(),
            'wz-praesi': () => praesentation(p),
            'wz-quelltext': () => quelltext(p),
            'wz-statistik': () => statistik(p),
            'wz-html': () => htmlExport(p),
            'wz-drucken': () => drucken(p)
        };
        const tuIt = karte[a];
        if (!tuIt)
            return false;
        tuIt();
        return true;
    };
    const papierkorbAufraeumen = async () => {
        const weg = await Store.papierkorbAufraeumen();
        if (weg)
            UI.toast(weg + (weg === 1 ? ' Ding war' : ' Dinge waren') +
                ' zu lange im Papierkorb und wurde' + (weg === 1 ? '' : 'n') +
                ' endgültig gelöscht');
        return weg;
    };
    const ziehenUndAblegen = () => {
        const bereich = document.getElementById('scroll');
        if (!bereich)
            return;
        bereich.addEventListener('dragover', e => {
            if (!e.dataTransfer?.types?.includes('Files'))
                return;
            e.preventDefault();
            bereich.classList.add('ablegen');
        });
        bereich.addEventListener('dragleave', e => {
            if (e.target === bereich)
                bereich.classList.remove('ablegen');
        });
        const anhaengen = async (seite, f, art) => {
            const grund = art === 'image'
                ? { caption: f.name } : { text: f.name };
            if (typeof Dateien !== 'undefined' && Dateien.lohntSich(f.size)) {
                if (f.size > Dateien.GRENZE) {
                    UI.toast('„' + f.name + '" ist grösser als ' +
                        Dateien.groesseText(Dateien.GRENZE) + '. So viel hält der Browser nicht.');
                    return;
                }
                const b = Store.addBlock(seite, art, grund);
                const melder = UI.toast('„' + f.name + '" wird abgelegt … 0 %', 60000);
                try {
                    const satz = await Dateien.ablegen(f, { blockId: b.id,
                        beiFortschritt: (anteil) => {
                            if (melder && melder.textContent !== undefined)
                                melder.textContent = '„' + f.name + '" wird abgelegt … ' +
                                    Math.round(anteil * 100) + ' %';
                        } });
                    await Dateien.adresse(satz.id);
                    Store.updateBlock(b.id, { dateiId: satz.id, typ: f.type });
                    if (melder && melder.remove)
                        melder.remove();
                    UI.toast('„' + f.name + '" abgelegt (' + Dateien.groesseText(f.size) +
                        ' in ' + satz.teile + ' Stücken)');
                }
                catch (err) {
                    if (melder && melder.remove)
                        melder.remove();
                    UI.toast('„' + f.name + '" ging nicht: ' +
                        (err instanceof Error ? err.message : String(err)));
                }
                return;
            }
            const daten = await new Promise(ok => {
                const r = new FileReader();
                r.onload = () => ok(r.result);
                r.readAsDataURL(f);
            });
            Store.addBlock(seite, art, { ...grund, src: daten });
        };
        bereich.addEventListener('drop', async (e) => {
            if (!e.dataTransfer?.files?.length)
                return;
            e.preventDefault();
            bereich.classList.remove('ablegen');
            const seite = App.aktuelleSeite();
            const ort = typeof App.schauplatz === 'function' ? App.schauplatz() : '';
            const imRegal = !seite && (ort === 'bibliothek' || ort === 'notizhefte');
            if (!seite && !imRegal) {
                UI.toast('Erst eine Seite öffnen');
                return;
            }
            if (imRegal) {
                if (typeof ArchivImport === 'undefined') {
                    UI.toast('Erst eine Seite öffnen');
                    return;
                }
                const fach = String(Store.getMeta('heft:fach') || '');
                const ziel = ort === 'notizhefte' && fach && Store.getBlock(fach) ? fach : null;
                let n = 0;
                for (const f of e.dataTransfer.files) {
                    try {
                        if (/\.zip$/i.test(f.name)) {
                            const erg = await ArchivImport.importZip(f, ziel, { still: true });
                            UI.toast(erg.hinweis, 9000);
                        }
                        else {
                            await ArchivImport.dateiAlsDokument(f, ziel);
                            n++;
                        }
                    }
                    catch (err) {
                        UI.toast('„' + f.name + '" ging nicht: ' + (err instanceof Error ? err.message : String(err)));
                    }
                }
                if (n)
                    UI.toast(n + (n === 1 ? ' Dokument angelegt' : ' Dokumente angelegt'));
                ArchivImport.ansichtAuffrischen();
                return;
            }
            for (const f of e.dataTransfer.files) {
                const name = f.name.toLowerCase();
                if (f.type.startsWith('image/')) {
                    await anhaengen(seite, f, 'image');
                    continue;
                }
                if (/\.(xlsx|xlsm|docx|pptx|ppsx|pptm|ppsm|epub)$/i.test(name)) {
                    try {
                        const erg = await Einlesen.datei(f, seite);
                        if (erg) {
                            UI.toast(f.name + ': ' + erg.hinweis);
                            continue;
                        }
                    }
                    catch (err) {
                        UI.banner(f.name + ' liess sich nicht lesen: ' +
                            (err instanceof Error ? err.message : String(err)), 'fehler');
                        continue;
                    }
                }
                if (/\.zip$/i.test(name) && typeof ArchivImport !== 'undefined') {
                    try {
                        const erg = await ArchivImport.importZip(f, seite, { still: true });
                        UI.toast(erg.hinweis, 9000);
                    }
                    catch (err) {
                        UI.toast('„' + f.name + '" ging nicht: ' + (err instanceof Error ? err.message : String(err)));
                    }
                    continue;
                }
                const istText = /\.(csv|tsv|html?|htm|md|markdown|txt)$/i.test(name);
                const text = istText ? await f.text() : '';
                if (name.endsWith('.csv') || name.endsWith('.tsv')) {
                    const zeilen = Datenbank.csvZerlegen(text.replace(/^﻿/, ''));
                    if (zeilen.length < 2) {
                        UI.toast(f.name + ' enthält keine Tabelle');
                        continue;
                    }
                    const kopf2 = (zeilen[0] ?? []).map((x) => String(x).trim());
                    const schema = { title: { name: kopf2[0] || 'Name', type: 'title' } };
                    const karte = ['title'];
                    kopf2.slice(1).forEach((n, i) => {
                        const k = 's' + i;
                        schema[k] = { name: n || 'Spalte ' + (i + 2), type: 'text' };
                        karte.push(k);
                    });
                    const { collectionId } = Store.addDatabase(seite, f.name.replace(/\.(csv|tsv)$/i, ''), schema, 'table');
                    zeilen.slice(1).forEach((z) => {
                        const props = {};
                        karte.forEach((k, i) => { if (k !== 'title')
                            props[k] = z[i] ?? ''; });
                        const r = Store.addRow(collectionId, props);
                        Store.updateBlock(r.id, { text: z[0] || 'Ohne Titel' });
                    });
                    UI.toast(f.name + ': ' + (zeilen.length - 1) + ' Einträge als Datenbank angelegt');
                    continue;
                }
                if (name.endsWith('.html') || name.endsWith('.htm')) {
                    ausHtml(seite, text);
                    UI.toast(f.name + ' eingelesen');
                    continue;
                }
                if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt')) {
                    const p2 = Store.addPage(seite, { text: f.name.replace(/\.(md|markdown|txt)$/i, ''), icon: '📄' });
                    ausMarkdown(p2, text);
                    UI.toast(f.name + ' als Unterseite angelegt');
                    continue;
                }
                if (/\.pdf$/i.test(name) && typeof PdfEinlesen !== 'undefined') {
                    try {
                        await PdfEinlesen.alsSeiten(f, seite);
                        continue;
                    }
                    catch {
                    }
                }
                await anhaengen(seite, f, 'file');
            }
            App.zeichneSeite();
            App.zeichneBaum();
        });
    };
    const ausHtml = (seiteId, html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const raus = (knoten) => {
            knoten.childNodes.forEach((n) => {
                if (n.nodeType !== 1)
                    return;
                const tag = n.tagName.toLowerCase();
                const txt = (n.textContent || '').trim();
                if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) && txt) {
                    Store.addBlock(seiteId, tag === 'h1' ? 'h1' : tag === 'h2' ? 'h2' : 'h3', { text: txt });
                }
                else if (tag === 'p' && txt) {
                    Store.addBlock(seiteId, 'text', { text: txt });
                }
                else if (tag === 'li' && txt) {
                    Store.addBlock(seiteId, n.parentElement?.tagName === 'OL' ? 'number' : 'bullet', { text: txt });
                }
                else if (tag === 'blockquote' && txt) {
                    Store.addBlock(seiteId, 'quote', { text: txt });
                }
                else if (tag === 'pre') {
                    Store.addBlock(seiteId, 'code', { text: n.textContent || '' });
                }
                else if (tag === 'hr') {
                    Store.addBlock(seiteId, 'divider');
                }
                else if (tag === 'img' && n.getAttribute('src')) {
                    const bildSrc = Sanitize.url(n.getAttribute('src'));
                    if (bildSrc)
                        Store.addBlock(seiteId, 'image', { src: bildSrc, caption: n.getAttribute('alt') || '' });
                    else
                        Store.addBlock(seiteId, 'text', { text: '⚠ Bild ausgelassen — die Adresse war kein Verweis: ' +
                                String(n.getAttribute('src')).slice(0, 120) });
                }
                else if (tag === 'table') {
                    const rows = [...n.querySelectorAll('tr')].map(tr => [...tr.querySelectorAll('th,td')].map(td => (td.textContent || '').trim()));
                    if (rows.length)
                        Store.addBlock(seiteId, 'table', { rows, kopfZeile: true });
                }
                else {
                    raus(n);
                }
            });
        };
        raus(doc.body);
    };
    const start = () => {
        ziehenUndAblegen();
        erinnerungenPruefen();
        setInterval(erinnerungenPruefen, 30000);
        document.addEventListener('keydown', e => {
            const strg = e.ctrlKey || e.metaKey;
            if (!strg)
                return;
            if (e.defaultPrevented)
                return;
            const k = e.key.toLowerCase();
            if (e.shiftKey && k === 'p') {
                e.preventDefault();
                const p2 = Store.getBlock(App.aktuelleSeite());
                if (p2)
                    verschiebenNach(p2);
                else
                    palette();
                return;
            }
            if (e.shiftKey && k === 'j') {
                e.preventDefault();
                journal();
                return;
            }
            if (e.shiftKey && k === 'm') {
                e.preventDefault();
                schnellnotizen();
                return;
            }
            if (e.shiftKey && k === 'g') {
                e.preventDefault();
                Links.graph();
                return;
            }
            if (e.shiftKey && k === 't') {
                e.preventDefault();
                Links.tagRegister();
                return;
            }
            if (e.shiftKey && k === 'f') {
                e.preventDefault();
                fokus();
                return;
            }
            if (e.altKey && k === 't') {
                e.preventDefault();
                alleToggles();
                return;
            }
            if (e.altKey && k === 'p') {
                e.preventDefault();
                const p2 = Store.getBlock(App.aktuelleSeite());
                if (p2)
                    praesentation(p2);
                return;
            }
            if (e.shiftKey && k === 'k') {
                e.preventDefault();
                palette();
                return;
            }
            if (k === '/') {
                e.preventDefault();
                tastenkuerzel();
                return;
            }
        });
    };
    return {
        start, palette, befehle,
        journal, journalSeite, schnellnotizen, vorlagen, vorlagenOrdner, alsVorlage, vorlageEinfuegen, vorlagenListe,
        lernen, karten, faellig, teileKarte,
        versionen, versionAutomatisch, sperren, entsperren, sperrAnsicht,
        fokus, praesentation, quelltext, alsMarkdown, ausMarkdown, ausHtml, statistik,
        formelBibliothek, formelBibliothekLesen, formelBibliothekAnwenden,
        erinnerungSetzen, erinnerungen, erinnerungenPruefen, geraeteMeldung, posteingangMelden, meldungen, meldungGelesen, meldungenAlleGelesen, meldungenLeeren,
        weckrufLegen, naechsteErinnerung,
        ordnerSchreiben, ordnerLesen, dateienLesen, einzelDatei,
        htmlExport, drucken, seiteAlsHtml, verschiebenNach, verschiebe,
        alleToggles, tastenkuerzel, systemSeite, datumLang, zeitKurz, papierkorbAufraeumen,
        wikiUmwandeln, wikiIndex, teilenMenue,
        seitenMenueZusatz, seitenMenueAktion
    };
})();
window.Werkzeuge = Werkzeuge;
if (typeof Register !== 'undefined' && Register.kontext) {
    const K = Register.kontext;
    const seite = () => {
        try {
            const id = App.aktuelleSeite();
            return id ? Store.getBlock(id) : null;
        }
        catch {
            return null;
        }
    };
    K.melde({
        bereich: 'editor', id: 'seitenwerkzeuge', name: 'Seitenwerkzeuge',
        zeichen: 'settings', rang: 10,
        liefern: () => {
            const p = seite();
            if (!p)
                return [];
            return [
                { id: 'statistik', name: 'Statistik', unter: 'Wörter, Zeichen, Lesezeit',
                    zeichen: 'chart', tun: () => Werkzeuge.statistik(p) },
                { id: 'drucken', name: 'Drucken oder als PDF', zeichen: 'printer',
                    tun: () => { void Werkzeuge.drucken(p); } },
                { id: 'sperren', name: p.locked ? 'Entsperren' : 'Gegen Bearbeiten sperren',
                    zeichen: p.locked ? 'lockOpen' : 'lock',
                    tun: () => (p.locked ? Werkzeuge.entsperren(p) : Werkzeuge.sperren(p)) },
                { id: 'fokus', name: 'Fokusmodus', unter: 'Strg + Umschalt + F',
                    zeichen: 'eye', tun: () => Werkzeuge.fokus() },
                { id: 'praesentation', name: 'Präsentation', zeichen: 'play',
                    tun: () => { void Werkzeuge.praesentation(p); } }
            ];
        }
    });
    K.melde({
        bereich: 'editor', id: 'fassungen', name: 'Fassungen',
        zeichen: 'history', rang: 20,
        zeigen: () => !!seite(),
        tun: () => { const p = seite(); if (p)
            Werkzeuge.versionen(p); }
    });
    K.melde({
        bereich: 'editor', id: 'karteikarten', name: 'Karteikarten',
        zeichen: 'cards', rang: 40,
        liefern: () => {
            let liste = [];
            try {
                liste = Werkzeuge.karten() || [];
            }
            catch {
                liste = [];
            }
            const raus = [{ id: 'lernen', name: 'Lernzentrum öffnen',
                    unter: liste.length + ' Karten im Bestand', zeichen: 'learn',
                    tun: () => Werkzeuge.lernen() }];
            for (const k of liste.slice(0, 10))
                raus.push({
                    id: 'karte-' + k.id,
                    name: (String(k.text || 'Karte').split('::')[0] || 'Karte').trim(),
                    zeichen: 'cards',
                    tun: () => { try {
                        App.zeigeBlock(k.id);
                    }
                    catch { } }
                });
            return raus;
        }
    });
    K.melde({
        bereich: 'editor', id: 'bloecke', name: 'Blöcke',
        zeichen: 'plus', rang: 30,
        zeigen: () => !!(typeof Register !== 'undefined' && Register.bloecke?.alle),
        liefern: () => {
            const p = seite();
            if (!p)
                return [];
            return (Register.bloecke.alle() || []).slice(0, 24).map((b) => ({
                id: 'blk-' + b.id, name: String(b.name || b.id), zeichen: b.zeichen,
                tun: () => {
                    try {
                        Store.addBlock(p.id, b.id, {});
                        App.zeichneSeite();
                    }
                    catch { }
                }
            }));
        }
    });
}
if (typeof Register !== 'undefined' && Register.aktionen) {
    Register.aktionen.melde({
        id: 'verschieben', name: 'Verschieben nach …', zeichen: 'moveTo', gruppe: 'ablegen', rang: 10,
        gilt: (_p, o) => o.kontext !== 'notizhefte',
        tun: (p) => Werkzeuge.verschiebenNach(p)
    });
}
