"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/hilfe/rundgang.ts (npm run bauen:ts). */
const Rundgang = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const SCHRITTE = [
        { ziel: '#kante .k-orte, #handy-oben', titel: 'Alles liegt hier',
            text: 'Hier stehen deine Orte — Bibliothek, Notizhefte, Lernzentrum. ' +
                'Hinter <b>Mehr Orte</b> liegen Heute, Elektrotechnik, Aufgaben ' +
                'und dreissig weitere. Ohne Konto bleibt alles in diesem Browser ' +
                'auf diesem Gerät; für dieselben Notizen auf Rechner und Telefon ' +
                'gibt es die Wolke, freiwillig.' },
        { ziel: '#studio-search, #mb-suche, #btn-suche-handy', titel: 'Suchen und Befehle',
            text: 'Strg + K sucht in allem. Strg + P öffnet die Befehle: dort steht ' +
                'jede Funktion mit Namen, auch die, die du noch nicht kennst. ' +
                'Sie sucht unscharf — „wchrck" findet den Wochenrückblick.' },
        { ziel: '#studio-create, #kante .k-knopf[data-k="neu"], #btn-new-bottom', titel: 'Eine Seite anfangen',
            text: 'Strg + N legt eine Seite an. Ein <b>/</b> im Text öffnet die Bausteine: ' +
                '43 Stück, von der Überschrift bis zur Datenbank.' },
        { ziel: '#studio-tools, .mb-klapp, #menueband', titel: 'Zwölf Ansichten auf dieselben Daten',
            text: 'Eine Datenbank kann Tabelle, Board, Zeitstrahl, Kalender, Galerie, ' +
                'Liste, Diagramm, Formular, Feed, Karte, Kreuztabelle und Dashboard ' +
                'zugleich sein — jede mit eigenem Filter.' },
        { ziel: '#kante .k-knopf[data-k="ki"], #btn-ai, #mb-ki', titel: 'Die KI, die nichts kaputt macht',
            text: 'Sie schreibt Formeln, Automationen und Filter — aber sie ändert nie ' +
                'einfach etwas. Jeder Vorschlag wird an deinen echten Daten ' +
                'durchgerechnet und Zeile für Zeile verglichen, bevor du zustimmst.' },
        { ziel: '#kante .k-knopf[data-k="einstellungen"], #hl-mehr', titel: 'So, wie du es willst',
            text: 'Acht Farbschemata, eigene Akzentfarbe, Schrift und Seitenbreite — ' +
                'und alle Tastenkürzel lassen sich umbelegen. Notions Kürzel sind fest.' },
        { ziel: '[data-mb-reiter="ueberpruefen"], #studio-tools, .mb-klapp, #menueband', titel: 'Ehrlich beim Tempo',
            text: 'Hier steht, wie lange das Zeichnen gedauert hat und welche Formel ' +
                'die teuerste ist — mit Namen. Kein anderes Programm sagt dir das.' },
        { ziel: '#kante .k-knopf[data-k="mehr-orte"], #hl-mehr', titel: 'Alles zum Nachlesen',
            text: 'Acht Dokumente: sieben über Notion, eines über alles, was Redion ' +
                'mehr kann. Darin steht auch, was Redion bewusst <i>nicht</i> tut.' },
        { ziel: '#mb-datei, #studio-account, #mb-konto', titel: 'Zum Schluss',
            text: 'In den Einstellungen richtest du die KI ein, sicherst alles ' +
                'verschlüsselt und stellst ein, was Redion beim Start tut. ' +
                'Viel Freude damit.' }
    ];
    let nr = 0;
    let kasten = null, loch = null;
    const aufraeumen = () => {
        document.getElementById('rg-loch')?.remove();
        document.getElementById('rg-kasten')?.remove();
        document.getElementById('rg-schleier')?.remove();
        kasten = null;
        loch = null;
        removeEventListener('resize', stellen);
        if (typeof Geste !== 'undefined')
            Geste.weg();
    };
    const zielFinden = (ziel) => {
        if (!ziel)
            return null;
        for (const teil of ziel.split(',')) {
            const sel = teil.trim();
            if (!sel)
                continue;
            let el = null;
            try {
                el = document.querySelector(sel);
            }
            catch {
                el = null;
            }
            if (el && el.getBoundingClientRect().width)
                return el;
        }
        return null;
    };
    const stellen = () => {
        if (!kasten || !loch)
            return;
        const s = SCHRITTE[nr];
        if (!s)
            return;
        const el = zielFinden(s.ziel);
        if (el && el.getBoundingClientRect().width) {
            const r = el.getBoundingClientRect();
            loch.style.display = '';
            loch.style.left = (r.left - 6) + 'px';
            loch.style.top = (r.top - 6) + 'px';
            loch.style.width = (r.width + 12) + 'px';
            loch.style.height = (r.height + 12) + 'px';
            const kb = kasten.getBoundingClientRect();
            let links = r.right + 16;
            let oben = r.top;
            if (links + kb.width > innerWidth - 12)
                links = Math.max(12, r.left - kb.width - 16);
            if (links < 12)
                links = Math.max(12, (innerWidth - kb.width) / 2);
            if (oben + kb.height > innerHeight - 12)
                oben = Math.max(12, innerHeight - kb.height - 12);
            kasten.style.left = links + 'px';
            kasten.style.top = oben + 'px';
            if (typeof Geste !== 'undefined')
                Geste.zeigen(el);
        }
        else {
            if (typeof Geste !== 'undefined')
                Geste.weg();
            loch.style.display = 'none';
            const kb = kasten.getBoundingClientRect();
            kasten.style.left = ((innerWidth - kb.width) / 2) + 'px';
            kasten.style.top = ((innerHeight - kb.height) / 2) + 'px';
        }
    };
    const zeichne = () => {
        const s = SCHRITTE[nr];
        if (!s) {
            fertig();
            return;
        }
        if (!kasten) {
            const schleier = document.createElement('div');
            schleier.id = 'rg-schleier';
            document.body.appendChild(schleier);
            loch = document.createElement('div');
            loch.id = 'rg-loch';
            document.body.appendChild(loch);
            kasten = document.createElement('div');
            kasten.id = 'rg-kasten';
            document.body.appendChild(kasten);
            addEventListener('resize', stellen);
        }
        kasten.innerHTML =
            `<div class="rg-zahl">${nr + 1} von ${SCHRITTE.length}</div>` +
                `<div class="rg-titel">${esc(s.titel)}</div>` +
                `<div class="rg-text">${s.text}</div>` +
                '<div class="rg-punkte">' +
                SCHRITTE.map((_, i) => `<i class="${i === nr ? 'an' : ''}"></i>`).join('') + '</div>' +
                '<div class="rg-knoepfe">' +
                '<button data-a="weg">Überspringen</button>' +
                (nr > 0 ? '<button data-a="zurueck">Zurück</button>' : '') +
                `<button data-a="weiter" class="prim${nr === SCHRITTE.length - 1 ? '' : ' weiter'}">` +
                `${nr === SCHRITTE.length - 1 ? 'Fertig' : 'Weiter'}</button>` +
                '</div>';
        stellen();
        setTimeout(stellen, 30);
    };
    const fertig = () => {
        aufraeumen();
        document.getElementById('rg-einladung')?.remove();
        Store.setMeta('rundgangGesehen', true);
        Store.setMeta('rundgangFertig', true);
        UI.toast('Der Rundgang steht jederzeit unter „Was Redion kann"');
    };
    const start = (vonVorn) => {
        if (vonVorn !== false)
            nr = 0;
        zeichne();
    };
    document.addEventListener('click', (e) => {
        if (!kasten)
            return;
        const b = elVon(e)?.closest('#rg-kasten button[data-a]');
        if (!b)
            return;
        e.preventDefault();
        e.stopPropagation();
        if (b.dataset.a === 'weg') {
            fertig();
            return;
        }
        if (b.dataset.a === 'zurueck') {
            nr = Math.max(0, nr - 1);
            zeichne();
            return;
        }
        nr++;
        if (nr >= SCHRITTE.length)
            fertig();
        else
            zeichne();
    }, true);
    document.addEventListener('keydown', (e) => {
        if (!kasten)
            return;
        if (e.key === 'Escape') {
            e.preventDefault();
            fertig();
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            nr++;
            if (nr >= SCHRITTE.length)
                fertig();
            else
                zeichne();
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            nr = Math.max(0, nr - 1);
            zeichne();
        }
    }, true);
    const THEMEN = [
        ['🗂 Datenbanken', [
                'Zwölf Ansichten auf dieselben Daten, jede mit eigenem Filter',
                'Zeitstrahl mit fünf Zoomstufen, Abhängigkeitspfeilen und ziehbaren Balken',
                'Board mit Bahnen — zwei Gruppierungen gleichzeitig',
                'Gruppierte Tabellen mit eigener Berechnungszeile je Gruppe',
                'Kreuztabelle mit Zwischensummen; ein Klick zeigt die Zeilen dahinter',
                'Kalender mit durchgehenden Balken und echtem Stundenraster'
            ]],
        ['ƒ Formeln', [
                'Alle 99 Funktionen von Notion — nachgemessen',
                'Dazu rund sechzig, die Notion nicht hat',
                'rowNumber, runningSum, rank: die Zeile im Verhältnis zu den anderen',
                'countWhere und sumWhere: eine andere Datenbank fragen, ohne Verknüpfung',
                'Eigene Funktionen — Notion hat kein LAMBDA',
                'Der Editor nennt den Rückgabetyp und zeigt Zwischenergebnisse'
            ]],
        ['⚡ Automationen', [
                'Fünfzehn Auslöser, 24 benannte Bedingungen, 19 Aktionen',
                'Auslöser auf den Grenzübertritt: „kommt in eine Ansicht", „fällt heraus"',
                'Bedingungen über die Veränderung: war vorher leer, hat sich wirklich geändert',
                'Wiederkehrend in acht Takten, mit Uhrzeit, Zeitzone, Anfang und Ende',
                'Variablen in Aktionsketten',
                'Laufverlauf und Testlauf — Notion hat beides nicht'
            ]],
        ['✨ Die KI', [
                'Schreibt Formeln, Automationen und Filter — geprüft, bevor du zustimmst',
                'Rechnet jeden Formelvorschlag an einer echten Zeile durch',
                'Zeigt Zeile für Zeile, was sich ändert',
                'Ollama, WebLLM oder sechs Anbieter mit eigenem Schlüssel'
            ]],
        ['🪟 Fenster und Aussehen', [
                'Reiter mit Strg+T, Strg+W, Strg+Tab — auch im Browser',
                'Geteilte Ansicht neben- oder übereinander',
                'Acht Farbschemata und eine freie Akzentfarbe',
                'Alle Tastenkürzel umbelegbar'
            ]],
        ['📥 Hinein und heraus', [
                'Word und Excel schreiben — ohne fremdes Paket',
                'Trello, Evernote, Obsidian und Notion-Export einlesen',
                'Eingänge von aussen: abholen im Takt oder per Link',
                'Alles als Markdown-Ordner oder eine einzige HTML-Datei'
            ]],
        ['🧰 Ordnung und Tempo', [
                'Prüfregeln je Spalte, samt Statusübergängen',
                'Gesundheitsbericht: verwaiste Seiten, kaputte Verknüpfungen, teure Formeln',
                'Formelspeicher und fensterweises Zeichnen für grosse Datenbanken',
                'Verschlüsselte Sicherung mit AES-GCM 256'
            ]],
        ['🧩 Selbst erweitern', [
                'Eigene Formelfunktionen, Befehle und Knöpfe in wenigen Zeilen',
                'Abgeschirmt: Store, window und fetch sind für eine Erweiterung leer',
                'Probelauf, bevor etwas eingebaut wird'
            ]],
        ['⌨️ Tastatur und Blöcke', [
                'Esc wählt einen Block, Shift+Pfeil vergrössert — dann gilt jede Taste für alle',
                'Umwandeln, einrücken, verschieben, kopieren, löschen in einem Zug',
                '127 Kürzel in zwölf Gruppen, jedes einzeln umbelegbar',
                'Auch in der Tabelle: Leertaste öffnet die Vorschau, Strg+Enter die ganze Seite'
            ]],
        ['🔌 Schnittstelle und Formate', [
                'Ein echtes fetch("/v1/…") funktioniert — beantwortet im Browser, ohne Server',
                'Notions Adressen, Formen und Fehlercodes: 400 missing_version, 401 unauthorized',
                'Auch die internen: loadPageChunk, queryCollection, submitTransaction',
                'Notions verschachtelte Werte [["80"]] und der Formelbaum — in beide Richtungen'
            ]],
        ['📜 Nachvollziehbar', [
                'Ein gemeinsames Protokoll statt drei getrennter Listen',
                'Seiten, Automationen, KI, Rechte, Schnittstelle, Transaktionen',
                'Filterbar nach Art, Person, Tag und Text, als CSV ausgebbar',
                'Was jemand nur ansieht, wird nicht mitgezählt'
            ]],
        ['📎 Grosse Dateien', [
                'Anmelden, Stücke schicken, bestätigen — wie bei Notion, ohne Server',
                'Bis 500 MB statt 12, jedes Stück einzeln in der Ablage',
                'Fortschritt, Abbruch räumt auf, verwaiste Dateien finden'
            ]]
    ];
    const uebersicht = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(820px,95vw)">' +
                '<div class="fh">⭐ Was Redion kann<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="rg-koerper">' +
                '<div class="rg-vorwort">Alles hier ist gebaut und geprüft — keine Absicht, ' +
                'kein Vielleicht. Was Redion bewusst <i>nicht</i> tut, steht im letzten ' +
                'Abschnitt des Wissensdokuments.</div>' +
                THEMEN.map(([t, punkte]) => `<div class="rg-thema"><b>${esc(t)}</b><ul>` +
                    punkte.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul></div>').join('') +
                '</div>' +
                '<div class="fbtns">' +
                '<button data-a="fuehrung">▶ Führung starten</button>' +
                '<button data-a="wissen">📖 Das ganze Dokument</button>' +
                '<button data-a="zu" class="prim">Schliessen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="fuehrung"]')) {
                o.remove();
                setTimeout(() => start(), 120);
                return;
            }
            if (elVon(e)?.closest('[data-a="wissen"]')) {
                o.remove();
                Wissen.oeffnen();
            }
        });
    };
    const NEUERUNGEN = [
        { nr: 3, wann: '2026-08-05', titel: 'Das Telefon neu aufgebaut',
            text: 'Die Bereiche stehen jetzt oben als Pillen, unten sind Suchen, ' +
                'KI fragen und Neue Seite immer erreichbar. Und was man antippen ' +
                'soll, ist gross genug dafür.' },
        { nr: 2, wann: '2026-08-05', titel: 'Alles ist TypeScript',
            text: 'Jede Datei wird jetzt vor dem Ausführen geprüft. Dabei kamen ' +
                'Fehler heraus, die niemand gesehen hatte — Spaltenbreiten etwa ' +
                'wurden nie gespeichert.' },
        { nr: 1, wann: '2026-08-04', titel: 'Tabellen und Diagramme',
            text: 'Ein Tabellenblatt mit Formeln, Diagrammen und Import aus Excel ' +
                'steht als eigener Block bereit.' }
    ];
    const neuestes = () => NEUERUNGEN.reduce((h, n) => Math.max(h, n.nr), 0);
    const willkommen = (erzwingen) => {
        if (document.getElementById('rg-willkommen'))
            return;
        if (!erzwingen && Store.getMeta('rundgangGesehen', false))
            return;
        const d = document.createElement('div');
        d.id = 'rg-willkommen';
        d.setAttribute('role', 'dialog');
        d.setAttribute('aria-modal', 'true');
        d.setAttribute('aria-label', 'Willkommen bei Redion');
        d.innerHTML =
            '<div class="wk-kasten">' +
                '<div class="wk-kopf">' +
                '<h2>Willkommen bei Redion</h2>' +
                '<p>Notizen, Seiten und Datenbanken — <b>auf deinem Gerät</b>. ' +
                'Kein Konto, kein Abo, keine Wolke, solange du keine willst.</p>' +
                '</div>' +
                '<div class="wk-wege">' +
                '<button data-a="los" class="wk-weg prim">' +
                '<span class="wk-ico" aria-hidden="true">✎</span>' +
                '<span class="wk-t"><b>Loslegen</b>' +
                '<i>Ein paar Beispielseiten stehen schon bereit.</i></span></button>' +
                '<button data-a="import" class="wk-weg">' +
                '<span class="wk-ico" aria-hidden="true">⭱</span>' +
                '<span class="wk-t"><b>Sicherung einlesen</b>' +
                '<i>Vom alten Gerät — .redion oder .json.</i></span></button>' +
                '<button data-a="fuehrung" class="wk-weg">' +
                '<span class="wk-ico" aria-hidden="true">🧭</span>' +
                '<span class="wk-t"><b>Kurze Führung</b>' +
                '<i>Neun Schritte durch das Wichtigste — zwei Minuten.</i></span></button>' +
                '</div>' +
                '<p class="wk-fuss">Deine Daten liegen im Speicher dieses Browsers. ' +
                'Sichere sie ab und zu — unter „Mehr" steht, wie.</p>' +
                '</div>';
        const wkKopf = d.querySelector('.wk-kopf');
        if (wkKopf && typeof Textur !== 'undefined')
            Textur.legen(wkKopf);
        d.addEventListener('click', e => {
            const b = elVon(e)?.closest('[data-a]');
            if (!b)
                return;
            const was = b.dataset['a'];
            d.remove();
            setTimeout(() => {
                if (was === 'import') {
                    const knopf = document.getElementById('btn-import');
                    if (knopf)
                        knopf.click();
                    else
                        UI.toast('Der Import steht unter „Mehr → Importieren".');
                    return;
                }
                if (was === 'fuehrung')
                    start();
            }, 40);
        });
        document.body.appendChild(d);
        setTimeout(() => d.querySelector('[data-a="los"]')?.focus(), 30);
        const beiTaste = (e) => {
            if (e.key !== 'Escape')
                return;
            d.remove();
            document.removeEventListener('keydown', beiTaste);
        };
        document.addEventListener('keydown', beiTaste);
        Store.setMeta('rundgangGesehen', true);
        if (!Number(Store.getMeta('neuerungenGesehen', 0)))
            Store.setMeta('neuerungenGesehen', neuestes());
    };
    const einladung = () => {
        if (document.getElementById('rg-einladung'))
            return;
        const d = document.createElement('div');
        d.id = 'rg-einladung';
        d.innerHTML =
            '<div class="rge-text"><b>Neu hier?</b>' +
                '<span>Neun Schritte durch das Wichtigste — zwei Minuten.</span></div>' +
                '<button data-a="los" class="prim">Führung</button>' +
                '<button data-a="nie" title="Nicht mehr zeigen">✕</button>';
        d.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="los"]')) {
                d.remove();
                start();
                return;
            }
            if (elVon(e)?.closest('[data-a="nie"]')) {
                d.remove();
                UI.toast('Die Führung steht unter „Was Redion kann"');
            }
        });
        document.body.appendChild(d);
        Store.setMeta('rundgangGesehen', true);
        if (!Number(Store.getMeta('neuerungenGesehen', 0)))
            Store.setMeta('neuerungenGesehen', neuestes());
    };
    const neuerungen = (erzwingen) => {
        if (document.getElementById('rg-neu'))
            return;
        const gesehen = Number(Store.getMeta('neuerungenGesehen', 0)) || 0;
        const offen = NEUERUNGEN.filter(n => n.nr > gesehen).sort((a, b) => b.nr - a.nr);
        if (!offen.length && !erzwingen)
            return;
        if (!gesehen && !Store.getMeta('rundgangGesehen', false) && !erzwingen) {
            Store.setMeta('neuerungenGesehen', neuestes());
            return;
        }
        const liste = (offen.length ? offen : NEUERUNGEN).slice(0, 5);
        const d = document.createElement('div');
        d.id = 'rg-neu';
        d.innerHTML =
            '<div class="rgn-kopf"><b>Neu in Redion</b>' +
                '<button data-a="zu" title="Schliessen">✕</button></div>' +
                '<div class="rgn-liste">' +
                liste.map(n => '<div class="rgn-eintrag">' +
                    `<div class="rgn-titel">${esc(n.titel)}</div>` +
                    `<div class="rgn-text">${esc(n.text)}</div></div>`).join('') +
                '</div>';
        d.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="zu"]'))
                d.remove();
        });
        document.body.appendChild(d);
        Store.setMeta('neuerungenGesehen', neuestes());
    };
    const vielleichtStarten = () => {
        if (Store.getMeta('rundgangGesehen', false)) {
            setTimeout(() => neuerungen(), 1800);
            return;
        }
        const seiten = Object.values(Store.cache.blocks)
            .filter(b => b.alive !== false && b.type === 'page').length;
        if (seiten > 24) {
            Store.setMeta('rundgangGesehen', true);
            return;
        }
        setTimeout(willkommen, 1400);
    };
    return { start, uebersicht, vielleichtStarten, willkommen, einladung,
        neuerungen, fertig, SCHRITTE, THEMEN, NEUERUNGEN };
})();
window.Rundgang = Rundgang;
