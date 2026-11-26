"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/gedankenkarte.ts (npm run bauen:ts). */
const Gedankenkarte = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const NS = 'http://www.w3.org/2000/svg';
    const sv = (name, attrs = {}) => {
        const e = document.createElementNS(NS, name);
        Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
        return e;
    };
    const PALETTE = [
        ['#d9534f', 'Rot'], ['#e08a2e', 'Orange'], ['#c9a227', 'Gelb'],
        ['#4a9d5f', 'Grün'], ['#2f8ab5', 'Blau'], ['#7a5cc5', 'Violett'],
        ['#c2549b', 'Rosa'], ['#3fa3a0', 'Türkis'],
    ];
    const FORMEN = [
        ['rund', 'Abgerundet'],
        ['kasten', 'Rechteck'],
        ['pille', 'Pille'],
        ['ellipse', 'Ellipse'],
        ['raute', 'Raute'],
        ['sechseck', 'Sechseck'],
    ];
    const farbeVon = (i) => PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length]?.[0] ?? '#2f8ab5';
    const astHell = (farbe) => {
        if (typeof Farben === 'undefined' || !Farben.parse(farbe))
            return null;
        const hell = Farben.inkOnLight(farbe);
        return hell && hell !== Farben.toHex(Farben.parse(farbe) ?? [0, 0, 0]) ? hell : null;
    };
    const uid = () => (typeof Ids !== 'undefined' && Ids.short)
        ? 'gk' + Ids.short()
        : 'gk' + Math.floor(performance.now() * 1000).toString(36);
    const zahl = (wert, ersatz) => typeof wert === 'number' && Number.isFinite(wert) ? wert : ersatz;
    const neueKarte = (titel = 'Zentrales Thema') => ({
        knoten: [{ id: 'w', text: titel, eltern: null }],
        verbindungen: [],
        aufbau: 'karte',
        sicht: { x: 0, y: 0, z: 1 },
    });
    const MARKDOWN_GROESSE = 256 * 1024;
    const MARKDOWN_MAX_KNOTEN = 250;
    const MARKDOWN_MAX_TIEFE = 20;
    const ausMarkdown = (markdown, dateiname = 'Zentrales Thema') => {
        if (markdown.length > MARKDOWN_GROESSE)
            throw new Error('Die Markdown-Datei ist zu gross.');
        const karte = neueKarte(dateiname);
        const abschnitte = [];
        const liste = [];
        const text = (s) => s.trim().replace(/\\([\\`*_[\]#<>!&{}~+.\-()|])/g, '$1');
        const fuegeHinzu = (titel, eltern) => {
            if (karte.knoten.length >= MARKDOWN_MAX_KNOTEN)
                throw new Error('Eine Markdown-Datei darf höchstens 250 Themen enthalten.');
            const id = 'md-' + karte.knoten.length;
            karte.knoten.push({ id, text: titel, eltern });
            return id;
        };
        let titelGelesen = false;
        let frontmatter = false;
        let codeZaun = '';
        for (const [nummer, zeile] of markdown.replace(/^\uFEFF/, '').split(/\r\n?|\n/).entries()) {
            if (nummer === 0 && zeile.trim() === '---') {
                frontmatter = true;
                continue;
            }
            if (frontmatter) {
                if (/^(---|\.\.\.)\s*$/.test(zeile))
                    frontmatter = false;
                continue;
            }
            const zaun = /^\s*(`{3,}|~{3,})/.exec(zeile)?.[1];
            if (codeZaun) {
                if (zaun && zaun[0] === codeZaun[0] && zaun.length >= codeZaun.length &&
                    zeile.trim() === zaun)
                    codeZaun = '';
                continue;
            }
            if (zaun) {
                codeZaun = zaun;
                continue;
            }
            const ueberschrift = /^ {0,3}(#{1,6})[ \t]+(.+?)\s*$/.exec(zeile);
            if (ueberschrift && ueberschrift[1] && ueberschrift[2]?.trim()) {
                const ebene = ueberschrift[1].length;
                const titel = text(ueberschrift[2].replace(/[ \t]+#+$/, ''));
                liste.length = 0;
                if (!titelGelesen && karte.knoten.length === 1 && ebene === 1) {
                    const wurzel = karte.knoten[0];
                    if (wurzel)
                        wurzel.text = titel;
                    titelGelesen = true;
                    continue;
                }
                while ((abschnitte.at(-1)?.ebene ?? 0) >= ebene)
                    abschnitte.pop();
                const id = fuegeHinzu(titel, abschnitte.at(-1)?.id ?? 'w');
                abschnitte.push({ ebene, id });
                continue;
            }
            const punkt = /^([ \t]*)(?:[-+*]|\d+[.)])[ \t]+(\S.*)$/.exec(zeile);
            if (!punkt || punkt[1] === undefined || !punkt[2])
                continue;
            const einzug = punkt[1].replace(/\t/g, '    ').length;
            while ((liste.at(-1)?.einzug ?? -1) >= einzug)
                liste.pop();
            if (abschnitte.length + liste.length >= MARKDOWN_MAX_TIEFE)
                throw new Error('Die Markdown-Gliederung ist zu tief.');
            const id = fuegeHinzu(text(punkt[2]), liste.at(-1)?.id ?? abschnitte.at(-1)?.id ?? 'w');
            liste.push({ einzug, id });
        }
        if (!titelGelesen && karte.knoten.length === 1)
            throw new Error('Die Datei enthält keine Markdown-Überschriften oder Listen.');
        return karte;
    };
    const alsMarkdown = (karte) => {
        const { wurzel, kinder } = baum(karte);
        if (!wurzel)
            return '';
        const knoten = new Map(karte.knoten.map(k => [k.id, k]));
        const zeile = (id) => (knoten.get(id)?.text ?? '').replace(/\s+/g, ' ').trim()
            .replace(/[\\`*_[\]#<>!&{}~+.\-()|]/g, '\\$&') || 'Ohne Titel';
        const ausgabe = ['# ' + zeile(wurzel), ''];
        const stapel = (kinder[wurzel] ?? []).slice().reverse().map(id => ({ id, tiefe: 0 }));
        while (stapel.length) {
            const k = stapel.pop();
            if (!k)
                break;
            ausgabe.push('  '.repeat(k.tiefe) + '- ' + zeile(k.id));
            for (const id of (kinder[k.id] ?? []).slice().reverse())
                stapel.push({ id, tiefe: k.tiefe + 1 });
        }
        return ausgabe.join('\n') + '\n';
    };
    const alsMermaid = (karte) => {
        const ids = new Map(karte.knoten.map((k, index) => [k.id, 'n' + index]));
        const zeilen = ['flowchart TD'];
        for (const knoten of karte.knoten) {
            const beschriftung = (knoten.text.replace(/\s+/g, ' ').trim() || 'Ohne Titel')
                .replace(/["#\x60<>&\\%]/g, zeichen => '#' + zeichen.charCodeAt(0) + ';');
            zeilen.push('  ' + ids.get(knoten.id) + '["' + beschriftung + '"]');
            const eltern = knoten.eltern ? ids.get(knoten.eltern) : undefined;
            if (eltern)
                zeilen.push('  ' + eltern + ' --> ' + ids.get(knoten.id));
        }
        for (const { von, zu } of karte.verbindungen) {
            const start = ids.get(von), ziel = ids.get(zu);
            if (start && ziel && start !== ziel)
                zeilen.push('  ' + start + ' -.-> ' + ziel);
        }
        return zeilen.join('\n') + '\n';
    };
    const EXCALIDRAW_GROESSE = 2 * 1024 * 1024;
    const ausExcalidraw = (text, titel) => {
        if (text.length > EXCALIDRAW_GROESSE)
            throw new Error('Die Excalidraw-Datei ist zu gross.');
        const datei = JSON.parse(text.replace(/^\uFEFF/, ''));
        const objekt = (wert) => wert && typeof wert === 'object' && !Array.isArray(wert) ? wert : {};
        const root = objekt(datei);
        if (root.type !== 'excalidraw' || !Array.isArray(root.elements) || root.elements.length > 5000)
            throw new Error('Diese Datei enthält keine unterstützte Excalidraw-Zeichnung.');
        const elemente = root.elements.map(objekt).filter(e => e.isDeleted !== true);
        const karte = neueKarte(titel.trim().slice(0, 120) || 'Excalidraw');
        const beschriftungen = new Map();
        for (const e of elemente) {
            if (e.type !== 'text' || typeof e.id !== 'string')
                continue;
            const label = (typeof e.originalText === 'string' ? e.originalText : typeof e.text === 'string' ? e.text : '').trim();
            if (!label)
                continue;
            const quelle = typeof e.containerId === 'string' ? e.containerId : e.id;
            const schon = beschriftungen.get(quelle);
            if (schon) {
                schon.text = (schon.text + '\n' + label).slice(0, 500);
                beschriftungen.set(e.id, schon);
                continue;
            }
            if (karte.knoten.length >= MARKDOWN_MAX_KNOTEN)
                throw new Error('Die Zeichnung hat zu viele beschriftete Elemente.');
            const k = { id: 'x' + karte.knoten.length, text: label.slice(0, 500), eltern: 'w' };
            karte.knoten.push(k);
            beschriftungen.set(quelle, k);
            beschriftungen.set(e.id, k);
        }
        if (karte.knoten.length < 2)
            throw new Error('Die Zeichnung enthält keine beschrifteten Elemente.');
        const verbindungen = new Set();
        for (const e of elemente) {
            if (e.type !== 'arrow' && e.type !== 'line')
                continue;
            const start = objekt(e.startBinding).elementId, ziel = objekt(e.endBinding).elementId;
            const von = typeof start === 'string' ? beschriftungen.get(start)?.id : undefined;
            const zu = typeof ziel === 'string' ? beschriftungen.get(ziel)?.id : undefined;
            if (!von || !zu || von === zu)
                continue;
            const verbindung = [von, zu].sort().join('/');
            if (!verbindungen.has(verbindung)) {
                verbindungen.add(verbindung);
                karte.verbindungen.push({ id: 'v' + karte.verbindungen.length, von, zu });
            }
        }
        return karte;
    };
    const VORLAGEN = [
        {
            id: 'projekt', name: 'Projekt', hinweis: 'Ziel · Aufgaben · Termine · Beteiligte · Risiken',
            wurzel: 'Projekt',
            aeste: [
                ['Ziel', 'Warum', 'Fertig, wenn …'],
                ['Aufgaben', 'Als Nächstes', 'Später'],
                ['Termine', 'Start', 'Abgabe'],
                ['Beteiligte', 'Wer entscheidet'],
                ['Risiken', 'Was kann schiefgehen'],
            ],
        },
        {
            id: 'woche', name: 'Diese Woche', hinweis: 'Muss · Sollte · Kann · Wartet auf',
            wurzel: 'Diese Woche',
            aeste: [['Muss'], ['Sollte'], ['Kann'], ['Wartet auf'], ['Erledigt']],
        },
        {
            id: 'entscheidung', name: 'Entscheidung', hinweis: 'Dafür · Dagegen · Offene Fragen · Frist',
            wurzel: 'Zu entscheiden',
            aeste: [
                ['Dafür'], ['Dagegen'],
                ['Offene Fragen', 'Wen fragen?'],
                ['Frist', 'Wer entscheidet'],
            ],
        },
        {
            id: 'pruefung', name: 'Prüfung vorbereiten', hinweis: 'Themen · Lücken · Übungen · Termine',
            wurzel: 'Prüfung',
            aeste: [
                ['Themen', 'Sitzt', 'Wackelt'],
                ['Lücken', 'Zuerst'],
                ['Übungen', 'Altfragen'],
                ['Material', 'Skript', 'Notizen'],
                ['Termine', 'Prüfungstag'],
            ],
        },
        {
            id: 'vierfelder', name: 'Vier Felder', hinweis: 'Stärken · Schwächen · Chancen · Risiken',
            wurzel: 'Lage',
            aeste: [['Stärken'], ['Schwächen'], ['Chancen'], ['Risiken']],
        },
        {
            id: 'sammeln', name: 'Thema sammeln', hinweis: 'Was ich weiss · Was fehlt · Ideen · Quellen',
            wurzel: 'Thema',
            aeste: [
                ['Was ich weiss'], ['Was fehlt', 'Nachsehen'],
                ['Ideen'], ['Quellen', 'Gelesen'],
            ],
        },
    ];
    const vorlageKarte = (v) => {
        const knoten = [{ id: 'w', text: v.wurzel, eltern: null }];
        v.aeste.forEach((reihe, i) => {
            const name = reihe[0];
            if (!name)
                return;
            const id = uid();
            knoten.push({
                id, text: name, eltern: 'w',
                seite: i % 2 === 0 ? 'rechts' : 'links',
                farbe: farbeVon(i),
            });
            reihe.slice(1).forEach(text => knoten.push({ id: uid(), text, eltern: id }));
        });
        return { knoten, verbindungen: [], aufbau: 'karte', sicht: { x: 0, y: 0, z: 1 } };
    };
    const leseKarte = (block) => {
        const roh = block && typeof block.karte === 'object' && block.karte ? block.karte : null;
        if (!roh || !Array.isArray(roh.knoten) || !roh.knoten.length)
            return neueKarte(block?.text || undefined);
        const gesehen = new Set();
        const knoten = [];
        roh.knoten.forEach((k) => {
            if (!k || typeof k !== 'object')
                return;
            let id = typeof k.id === 'string' && k.id ? k.id : uid();
            while (gesehen.has(id))
                id = uid();
            gesehen.add(id);
            const eintrag = {
                id,
                text: typeof k.text === 'string' ? k.text : String(k.text ?? ''),
                eltern: typeof k.eltern === 'string' && k.eltern ? k.eltern : null,
            };
            if (k.seite === 'links' || k.seite === 'rechts')
                eintrag.seite = k.seite;
            if (typeof k.farbe === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(k.farbe))
                eintrag.farbe = k.farbe;
            if (k.zu === true)
                eintrag.zu = true;
            if (typeof k.form === 'string' && /^[a-z][a-z0-9-]{0,23}$/.test(k.form))
                eintrag.form = k.form;
            knoten.push(eintrag);
        });
        if (!knoten.length)
            return neueKarte(block?.text || undefined);
        if (!knoten.some(k => !k.eltern)) {
            const erster = knoten[0];
            if (erster)
                erster.eltern = null;
        }
        const da = new Set(knoten.map(k => k.id));
        const verbindungen = [];
        const schonV = new Set();
        if (Array.isArray(roh.verbindungen))
            roh.verbindungen.forEach((v) => {
                if (!v || typeof v !== 'object')
                    return;
                const von = typeof v.von === 'string' ? v.von : '';
                const zu = typeof v.zu === 'string' ? v.zu : '';
                if (!da.has(von) || !da.has(zu) || von === zu)
                    return;
                const paar = von < zu ? von + '|' + zu : zu + '|' + von;
                if (schonV.has(paar))
                    return;
                schonV.add(paar);
                let id = typeof v.id === 'string' && v.id ? v.id : uid();
                while (gesehen.has(id))
                    id = uid();
                gesehen.add(id);
                verbindungen.push({ id, von, zu });
            });
        const s = roh.sicht && typeof roh.sicht === 'object' ? roh.sicht : {};
        return {
            knoten,
            verbindungen,
            aufbau: typeof roh.aufbau === 'string' ? roh.aufbau : 'karte',
            sicht: {
                x: zahl(s.x, 0),
                y: zahl(s.y, 0),
                z: Math.min(4, Math.max(.2, zahl(s.z, 1))),
            },
        };
    };
    const baum = (karte) => {
        const kinder = {};
        karte.knoten.forEach(k => { kinder[k.id] = []; });
        const wurzel = karte.knoten.find(k => !k.eltern) ?? karte.knoten[0];
        if (!wurzel)
            return { kinder, wurzel: null };
        const nach = new Map(karte.knoten.map(k => [k.id, k]));
        const traegt = (k) => {
            const weg = new Set([k.id]);
            let p = k.eltern;
            let schritte = 0;
            while (p && schritte++ < 4096) {
                if (weg.has(p) || !nach.has(p))
                    return false;
                if (p === wurzel.id)
                    return true;
                weg.add(p);
                p = nach.get(p)?.eltern ?? null;
            }
            return false;
        };
        karte.knoten.forEach(k => {
            if (k.id === wurzel.id)
                return;
            const ziel = traegt(k) ? k.eltern : wurzel.id;
            kinder[ziel]?.push(k.id);
        });
        return { kinder, wurzel: wurzel.id };
    };
    const LESBAR = .72;
    const LUECKE_X = 54;
    const LUECKE_Y = 14;
    const RAND = 28;
    const aufbauen = (karte, masse) => {
        const { kinder, wurzel } = baum(karte);
        const orte = {};
        const farben = {};
        if (!wurzel)
            return { orte, kinder, farben, wurzel: null, breite: 0, hoehe: 0 };
        const zuMerk = new Map(karte.knoten.map(k => [k.id, !!k.zu]));
        const eigen = new Map(karte.knoten.map(k => [k.id, k.farbe]));
        const sichtbar = (id) => zuMerk.get(id) ? [] : (kinder[id] ?? []);
        const mass = (id) => masse[id] ?? { w: 140, h: 34 };
        const hMerk = {};
        const astHoehe = (id) => {
            const schon = hMerk[id];
            if (schon !== undefined)
                return schon;
            hMerk[id] = mass(id).h;
            const ks = sichtbar(id);
            let wert = mass(id).h;
            if (ks.length) {
                const summe = ks.reduce((s, k) => s + astHoehe(k), 0) + LUECKE_Y * (ks.length - 1);
                wert = Math.max(wert, summe);
            }
            hMerk[id] = wert;
            return wert;
        };
        const ebene1 = sichtbar(wurzel);
        const rechts = [];
        const links = [];
        ebene1.forEach((id, i) => {
            const k = karte.knoten.find(n => n.id === id);
            const seite = k?.seite ?? (i % 2 === 0 ? 'rechts' : 'links');
            (seite === 'links' ? links : rechts).push(id);
        });
        const faerben = (id, farbe) => {
            farben[id] = eigen.get(id) || farbe;
            (kinder[id] ?? []).forEach(k => faerben(k, farben[id]));
        };
        farben[wurzel] = eigen.get(wurzel) || 'var(--accent)';
        ebene1.forEach((id, i) => faerben(id, farbeVon(i)));
        karte.knoten.forEach(k => { if (!farben[k.id])
            farben[k.id] = eigen.get(k.id) || 'var(--text-dim)'; });
        const legen = (id, kante, mitteY, richtung) => {
            const m = mass(id);
            orte[id] = { x: richtung > 0 ? kante : kante - m.w, y: mitteY - m.h / 2 };
            const ks = sichtbar(id);
            if (!ks.length)
                return;
            const gesamt = ks.reduce((s, k) => s + astHoehe(k), 0) + LUECKE_Y * (ks.length - 1);
            let oben = mitteY - gesamt / 2;
            const naechste = richtung > 0 ? kante + m.w + LUECKE_X : kante - m.w - LUECKE_X;
            ks.forEach(k => {
                const h = astHoehe(k);
                legen(k, naechste, oben + h / 2, richtung);
                oben += h + LUECKE_Y;
            });
        };
        const wm = mass(wurzel);
        orte[wurzel] = { x: -wm.w / 2, y: -wm.h / 2 };
        const seiteLegen = (liste, richtung) => {
            if (!liste.length)
                return;
            const gesamt = liste.reduce((s, k) => s + astHoehe(k), 0) + LUECKE_Y * (liste.length - 1);
            let oben = -gesamt / 2;
            const kante = richtung > 0 ? wm.w / 2 + LUECKE_X : -wm.w / 2 - LUECKE_X;
            liste.forEach(k => {
                const h = astHoehe(k);
                legen(k, kante, oben + h / 2, richtung);
                oben += h + LUECKE_Y;
            });
        };
        seiteLegen(rechts, 1);
        seiteLegen(links, -1);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        Object.entries(orte).forEach(([id, o]) => {
            const m = mass(id);
            minX = Math.min(minX, o.x);
            minY = Math.min(minY, o.y);
            maxX = Math.max(maxX, o.x + m.w);
            maxY = Math.max(maxY, o.y + m.h);
        });
        if (!Number.isFinite(minX))
            return { orte, kinder, farben, wurzel, breite: 0, hoehe: 0 };
        Object.values(orte).forEach(o => { o.x += RAND - minX; o.y += RAND - minY; });
        return {
            orte, kinder, farben, wurzel,
            breite: Math.round(maxX - minX + RAND * 2),
            hoehe: Math.round(maxY - minY + RAND * 2),
        };
    };
    const zeichne = (block, aufFlaeche = false) => {
        let karte = leseKarte(block);
        let gewaehlt = karte.knoten.find(k => !k.eltern)?.id ?? null;
        let schreibt = null;
        let gewaehlteVerb = null;
        let letzterAufbau = null;
        let letzteMasse = {};
        const hoehe = Math.max(220, zahl(block.hoehe, 420));
        let mussEinpassen = !aufFlaeche && !(block && block.karte && typeof block.karte.sicht === 'object'
            && block.karte.sicht);
        const w = document.createElement('div');
        w.className = aufFlaeche ? 'gk gk-auf-flaeche' : 'gk';
        const LEISTE = [
            ['kind', '＋', 'Unterthema anlegen (Tab)'],
            ['neben', '⏎', 'Thema daneben anlegen (Enter)'],
            ['text', 'T', 'Umbenennen (F2)'],
            ['klapp', '⊟', 'Ast auf- oder zuklappen (Leertaste)'],
            ['weg', '🗑', 'Ast löschen (Entf)'],
        ];
        w.innerHTML =
            '<div class="gk-leiste">' +
                LEISTE.map(([id, ico, titel]) => `<button data-a="${id}" title="${esc(titel)}" aria-label="${esc(titel)}">${ico}</button>`).join('') +
                '<span class="gk-trenn"></span>' +
                '<span class="gk-farben">' +
                PALETTE.map(([c, n]) => `<button class="gk-farbe" data-c="${c}" style="background:${c}" ` +
                    `title="Ast einfärben: ${n}" aria-label="Ast einfärben: ${n}"></button>`).join('') +
                `<button class="gk-farbe gk-farbe-weg" data-c="" title="Eigene Farbe entfernen" ` +
                `aria-label="Eigene Farbe entfernen">✕</button>` +
                '</span>' +
                '<span class="gk-trenn"></span>' +
                '<span class="gk-formen">' +
                FORMEN.map(([id, name]) => `<button class="gk-form" data-f="${id}" title="Form: ${esc(name)}" ` +
                    `aria-label="Form: ${esc(name)}"><i></i></button>`).join('') +
                '</span>' +
                '<span class="gk-trenn"></span>' +
                '<button data-a="vorlage" title="Fertige Vorlage einsetzen" ' +
                'aria-label="Fertige Vorlage einsetzen" aria-haspopup="menu">▤</button>' +
                '<button data-a="markdown" title="Markdown-Gliederung importieren oder exportieren" ' +
                'aria-label="Markdown-Gliederung" aria-haspopup="menu">MD</button>' +
                '<span class="gk-trenn"></span>' +
                '<span class="gk-zoom">' +
                '<button data-a="kleiner" title="Verkleinern" aria-label="Verkleinern">−</button>' +
                '<b class="gk-massstab" aria-live="polite">100 %</b>' +
                '<button data-a="groesser" title="Vergrössern" aria-label="Vergrössern">＋</button>' +
                '<button data-a="passend" title="Alles ins Bild holen" aria-label="Alles ins Bild holen">⤢</button>' +
                '</span>' +
                '<span class="gk-trenn"></span>' +
                '<button data-a="zurueck" title="Schritt zurück" aria-label="Schritt zurück" disabled>↶</button>' +
                '<button data-a="vor" title="Schritt vorwärts" aria-label="Schritt vorwärts" disabled>↷</button>' +
                '</div>';
        if (aufFlaeche) {
            const leiste = w.querySelector('.gk-leiste');
            leiste.hidden = true;
            const werkzeuge = document.createElement('button');
            werkzeuge.type = 'button';
            werkzeuge.className = 'gk-fl-werkzeuge';
            werkzeuge.textContent = '⋯';
            werkzeuge.title = 'Werkzeuge der Gedankenkarte öffnen';
            werkzeuge.setAttribute('aria-label', 'Werkzeuge der Gedankenkarte');
            werkzeuge.setAttribute('aria-expanded', 'false');
            const schalten = (offen) => {
                leiste.hidden = !offen;
                werkzeuge.setAttribute('aria-expanded', String(offen));
            };
            werkzeuge.addEventListener('click', () => schalten(leiste.hidden));
            w.addEventListener('keydown', e => {
                if (e.key !== 'Escape' || leiste.hidden || e.defaultPrevented)
                    return;
                schalten(false);
                werkzeuge.focus({ preventScroll: true });
                e.preventDefault();
                e.stopPropagation();
            });
            w.addEventListener('focusout', e => {
                if (!(e.relatedTarget instanceof Node) || !w.contains(e.relatedTarget))
                    schalten(false);
            });
            w.prepend(werkzeuge);
        }
        const buehne = document.createElement('div');
        buehne.className = 'gk-buehne';
        buehne.tabIndex = 0;
        buehne.setAttribute('role', 'tree');
        buehne.setAttribute('aria-label', 'Gedankenkarte');
        if (!aufFlaeche)
            buehne.style.height = hoehe + 'px';
        w.appendChild(buehne);
        const welt = document.createElement('div');
        welt.className = 'gk-welt';
        buehne.appendChild(welt);
        const linien = sv('svg', { class: 'gk-linien' });
        welt.appendChild(linien);
        const griff = document.createElement('div');
        griff.className = 'gk-griff';
        griff.title = 'Höhe ziehen';
        if (!aufFlaeche)
            w.appendChild(griff);
        const SCHRITTE = 40;
        const verlauf = GfxHistory.erstelle(SCHRITTE);
        const abbild = () => JSON.stringify(karte);
        const standZeigen = () => {
            const z = w.querySelector('[data-a="zurueck"]');
            const v = w.querySelector('[data-a="vor"]');
            if (z)
                z.disabled = !verlauf.kannZurueck();
            if (v)
                v.disabled = !verlauf.kannVor();
        };
        const merken = () => { verlauf.merken(abbild()); };
        const sichern = () => {
            Store.updateBlock(block.id, { karte: JSON.parse(JSON.stringify(karte)) });
        };
        const aendere = (tun) => {
            merken();
            tun();
            sichern();
            male();
            standZeigen();
        };
        const einsetzen = (roh) => {
            karte = leseKarte({ karte: JSON.parse(roh) });
            if (gewaehlt && !karte.knoten.some(k => k.id === gewaehlt))
                gewaehlt = null;
            sichern();
            male();
            standZeigen();
        };
        const knotenVon = (id) => id ? (karte.knoten.find(k => k.id === id) ?? null) : null;
        const kinderVon = (id) => letzterAufbau?.kinder[id] ?? [];
        const ast = (id) => {
            const raus = [];
            const stapel = [id];
            const gesehen = new Set();
            while (stapel.length) {
                const k = stapel.pop();
                if (!k || gesehen.has(k))
                    continue;
                gesehen.add(k);
                raus.push(k);
                kinderVon(k).forEach(x => stapel.push(x));
            }
            return raus;
        };
        const knotenEl = (k, ebene, kinderZahl) => {
            const el = document.createElement('div');
            el.className = 'gk-kn' + (k.eltern ? '' : ' gk-wurzel') + (k.id === gewaehlt ? ' on' : '');
            el.dataset.k = k.id;
            el.setAttribute('role', 'treeitem');
            el.setAttribute('aria-level', String(ebene));
            el.tabIndex = -1;
            if (kinderZahl)
                el.setAttribute('aria-expanded', k.zu ? 'false' : 'true');
            const txt = document.createElement('span');
            txt.className = 'gk-txt';
            txt.textContent = k.text || '';
            if (!k.text)
                txt.classList.add('gk-leer');
            el.appendChild(txt);
            if (kinderZahl && k.zu) {
                const zahlEl = document.createElement('span');
                zahlEl.className = 'gk-zahl';
                zahlEl.textContent = String(kinderZahl);
                zahlEl.title = kinderZahl === 1 ? 'Ein verborgenes Unterthema'
                    : kinderZahl + ' verborgene Unterthemen';
                el.appendChild(zahlEl);
            }
            if (k.form && k.form !== 'rund')
                el.dataset.form = k.form;
            if (k.id === gewaehlt)
                griffeBauen(el);
            return el;
        };
        const griffeBauen = (el) => {
            const RICHTUNGEN = [
                ['oben', 'darüber'],
                ['rechts', 'rechts daneben'],
                ['unten', 'darunter'],
                ['links', 'links daneben'],
            ];
            RICHTUNGEN.forEach(([r, wohin]) => {
                const g = document.createElement('button');
                g.type = 'button';
                g.className = 'gk-griffel gk-griffel-' + r;
                g.dataset.r = r;
                g.title = `Neues Thema ${wohin} — oder auf einen anderen Knoten ziehen: das gibt eine Verbindung`;
                g.setAttribute('aria-label', `Neues Thema ${wohin}`);
                el.appendChild(g);
            });
        };
        const bogen = (von, vonM, zu, zuM, farbe, dick) => {
            const rechtsHerum = zu.x + zuM.w / 2 >= von.x + vonM.w / 2;
            const px = rechtsHerum ? von.x + vonM.w : von.x;
            const py = von.y + vonM.h / 2;
            const cx = rechtsHerum ? zu.x : zu.x + zuM.w;
            const cy = zu.y + zuM.h / 2;
            const dx = (cx - px) / 2;
            const ast = sv('path', {
                d: `M ${px.toFixed(1)} ${py.toFixed(1)} C ${(px + dx).toFixed(1)} ${py.toFixed(1)}, ` +
                    `${(cx - dx).toFixed(1)} ${cy.toFixed(1)}, ${cx.toFixed(1)} ${cy.toFixed(1)}`,
                fill: 'none', stroke: farbe, 'stroke-width': dick, 'stroke-linecap': 'round',
            });
            const hell = astHell(farbe);
            if (hell) {
                ast.setAttribute('data-tinte', 'strich');
                ast.style.setProperty('--tinte-hell', hell);
            }
            return ast;
        };
        const verbBogen = (a, aM, b, bM, mitte, id, an) => {
            const amx = a.x + aM.w / 2, amy = a.y + aM.h / 2;
            const bmx = b.x + bM.w / 2, bmy = b.y + bM.h / 2;
            const waagerecht = Math.abs(bmx - amx) >= Math.abs(bmy - amy);
            const p1 = waagerecht
                ? { x: bmx >= amx ? a.x + aM.w : a.x, y: amy }
                : { x: amx, y: bmy >= amy ? a.y + aM.h : a.y };
            const p2 = waagerecht
                ? { x: bmx >= amx ? b.x : b.x + bM.w, y: bmy }
                : { x: bmx, y: bmy >= amy ? b.y : b.y + bM.h };
            const sx = p2.x - p1.x, sy = p2.y - p1.y;
            const laenge = Math.hypot(sx, sy) || 1;
            let nx = -sy / laenge, ny = sx / laenge;
            const mx = (p1.x + p2.x) / 2 - mitte.x, my = (p1.y + p2.y) / 2 - mitte.y;
            const weg = nx * mx + ny * my;
            if (weg < 0 || (weg === 0 && ny > 0)) {
                nx = -nx;
                ny = -ny;
            }
            const hoch = Math.min(110, Math.max(60, laenge * .25));
            const d = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} C `
                + `${(p1.x + sx / 3 + nx * hoch).toFixed(1)} ${(p1.y + sy / 3 + ny * hoch).toFixed(1)}, `
                + `${(p2.x - sx / 3 + nx * hoch).toFixed(1)} ${(p2.y - sy / 3 + ny * hoch).toFixed(1)}, `
                + `${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
            const g = sv('g', { class: 'gk-verb' + (an ? ' on' : ''), 'data-v': id });
            g.appendChild(sv('path', { d, class: 'gk-verb-fang', fill: 'none' }));
            g.appendChild(sv('path', {
                d, class: 'gk-verb-linie', fill: 'none',
                'marker-end': 'url(#gk-spitze)',
            }));
            return g;
        };
        const sichtAnwenden = () => {
            if (aufFlaeche)
                return;
            welt.style.transform = `translate(${(-karte.sicht.x).toFixed(1)}px, ` +
                `${(-karte.sicht.y).toFixed(1)}px) scale(${karte.sicht.z})`;
            const m = w.querySelector('.gk-massstab');
            if (m)
                m.textContent = Math.round(karte.sicht.z * 100) + ' %';
        };
        const male = () => {
            if (schreibt)
                return;
            welt.querySelectorAll('.gk-kn').forEach(el => el.remove());
            const { kinder, wurzel } = baum(karte);
            if (!wurzel)
                return;
            const ebenen = { [wurzel]: 1 };
            const reihe = [wurzel];
            while (reihe.length) {
                const id = reihe.shift();
                (kinder[id] ?? []).forEach(k => { ebenen[k] = (ebenen[id] ?? 1) + 1; reihe.push(k); });
            }
            const zuMerk = new Map(karte.knoten.map(k => [k.id, !!k.zu]));
            const sichtbare = [];
            const stapel = [wurzel];
            while (stapel.length) {
                const id = stapel.shift();
                const k = karte.knoten.find(n => n.id === id);
                if (k)
                    sichtbare.push(k);
                if (!zuMerk.get(id))
                    (kinder[id] ?? []).forEach(x => stapel.push(x));
            }
            const els = {};
            sichtbare.forEach(k => {
                const el = knotenEl(k, ebenen[k.id] ?? 1, (kinder[k.id] ?? []).length);
                els[k.id] = el;
                welt.appendChild(el);
            });
            const masse = {};
            Object.entries(els).forEach(([id, el]) => { masse[id] = { w: el.offsetWidth, h: el.offsetHeight }; });
            const wurzelVorher = letzterAufbau?.orte[wurzel];
            letzteMasse = masse;
            const plan = aufbauen(karte, masse);
            const wurzelNachher = plan.orte[wurzel];
            if (!aufFlaeche && wurzelVorher && wurzelNachher && !mussEinpassen) {
                karte.sicht.x += (wurzelNachher.x - wurzelVorher.x) * karte.sicht.z;
                karte.sicht.y += (wurzelNachher.y - wurzelVorher.y) * karte.sicht.z;
            }
            letzterAufbau = plan;
            Object.entries(els).forEach(([id, el]) => {
                const o = plan.orte[id];
                if (!o) {
                    el.remove();
                    return;
                }
                el.style.left = o.x.toFixed(1) + 'px';
                el.style.top = o.y.toFixed(1) + 'px';
                el.style.setProperty('--ast', plan.farben[id] ?? 'var(--text-dim)');
                const hell = astHell(plan.farben[id] ?? '');
                if (hell)
                    el.style.setProperty('--ast-hell', hell);
                else
                    el.style.removeProperty('--ast-hell');
            });
            if (aufFlaeche) {
                buehne.style.width = plan.breite + 'px';
                buehne.style.height = plan.hoehe + 'px';
            }
            welt.style.width = plan.breite + 'px';
            welt.style.height = plan.hoehe + 'px';
            linien.setAttribute('width', String(plan.breite));
            linien.setAttribute('height', String(plan.hoehe));
            linien.setAttribute('viewBox', `0 0 ${plan.breite} ${plan.hoehe}`);
            while (linien.firstChild)
                linien.removeChild(linien.firstChild);
            sichtbare.forEach(k => {
                const o = plan.orte[k.id];
                const m = masse[k.id];
                if (!o || !m || zuMerk.get(k.id))
                    return;
                (kinder[k.id] ?? []).forEach(kid => {
                    const ko = plan.orte[kid];
                    const km = masse[kid];
                    if (!ko || !km)
                        return;
                    const dick = (ebenen[kid] ?? 2) <= 2 ? 3 : 2;
                    linien.appendChild(bogen(o, m, ko, km, plan.farben[kid] ?? 'var(--text-dim)', dick));
                });
            });
            if (karte.verbindungen.length) {
                const spitze = sv('marker', {
                    id: 'gk-spitze', viewBox: '0 0 10 10', refX: '9', refY: '5',
                    markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse',
                });
                spitze.appendChild(sv('path', { d: 'M 0 1 L 9 5 L 0 9 z', class: 'gk-spitze' }));
                const defs = sv('defs');
                defs.appendChild(spitze);
                linien.appendChild(defs);
                karte.verbindungen.forEach(v => {
                    const a = plan.orte[v.von], b = plan.orte[v.zu];
                    const aM = masse[v.von], bM = masse[v.zu];
                    if (!a || !b || !aM || !bM)
                        return;
                    linien.appendChild(verbBogen(a, aM, b, bM, { x: plan.breite / 2, y: plan.hoehe / 2 }, v.id, v.id === gewaehlteVerb));
                });
            }
            sichtAnwenden();
            if (mussEinpassen && buehne.getBoundingClientRect().width > 4) {
                mussEinpassen = false;
                einpassen(1, false, LESBAR);
            }
        };
        const schreiberSchliessen = (weiter) => {
            const id = schreibt;
            if (!id)
                return;
            schreibt = null;
            const el = welt.querySelector(`.gk-kn[data-k="${CSS.escape(id)}"] .gk-txt`);
            const neu = (el?.innerText ?? '').replace(/ /g, ' ').replace(/\s+$/, '');
            if (el) {
                el.contentEditable = 'false';
                el.classList.remove('gk-schreibt');
            }
            const k = knotenVon(id);
            if (k && k.text !== neu)
                aendere(() => { k.text = neu; });
            else
                male();
            if (weiter === 'kind')
                neuesKind(id);
            else if (weiter === 'neben')
                neuesGeschwister(id);
            else
                buehne.focus();
        };
        const bearbeite = (id) => {
            if (!id)
                return;
            const el = welt.querySelector(`.gk-kn[data-k="${CSS.escape(id)}"] .gk-txt`);
            if (!el)
                return;
            gewaehlt = id;
            schreibt = id;
            el.classList.remove('gk-leer');
            el.classList.add('gk-schreibt');
            el.contentEditable = 'true';
            el.spellcheck = false;
            const kasten = el.closest('.gk-kn');
            if (kasten)
                insBild(kasten);
            el.focus();
            const bereich = document.createRange();
            bereich.selectNodeContents(el);
            const auswahl = window.getSelection();
            auswahl?.removeAllRanges();
            auswahl?.addRange(bereich);
        };
        const neuesKind = (elternId) => {
            const eltern = knotenVon(elternId);
            if (!eltern)
                return;
            const neu = { id: uid(), text: '', eltern: eltern.id };
            aendere(() => {
                if (eltern.zu)
                    delete eltern.zu;
                const kinder = kinderVon(eltern.id);
                const letzterKind = kinder.length ? kinder[kinder.length - 1] : null;
                const nach = letzterKind
                    ? Math.max(...ast(letzterKind).map(x => karte.knoten.findIndex(n => n.id === x)))
                    : karte.knoten.findIndex(n => n.id === eltern.id);
                karte.knoten.splice(nach + 1, 0, neu);
            });
            bearbeite(neu.id);
        };
        const neuesGeschwister = (id) => {
            const k = knotenVon(id);
            if (!k)
                return;
            if (!k.eltern) {
                neuesKind(k.id);
                return;
            }
            const neu = { id: uid(), text: '', eltern: k.eltern };
            aendere(() => {
                const nach = Math.max(...ast(k.id).map(x => karte.knoten.findIndex(n => n.id === x)));
                karte.knoten.splice(nach + 1, 0, neu);
            });
            bearbeite(neu.id);
        };
        const loeschen = (id) => {
            const k = knotenVon(id);
            if (!k)
                return;
            if (!k.eltern) {
                UI.toast('Das zentrale Thema bleibt — eine Karte ohne Mitte gibt es nicht.');
                return;
            }
            const weg = new Set(ast(k.id));
            const eltern = k.eltern;
            aendere(() => { karte.knoten = karte.knoten.filter(n => !weg.has(n.id)); });
            gewaehlt = eltern;
            male();
            UI.toast(weg.size === 1 ? 'Thema gelöscht — mit ↶ zurückholen'
                : weg.size + ' Themen gelöscht — mit ↶ zurückholen');
        };
        const neuerNachbar = (id, richtung) => {
            const k = knotenVon(id);
            if (!k)
                return;
            if (richtung === 'links' || richtung === 'rechts') {
                const neu = { id: uid(), text: '', eltern: k.id };
                if (!k.eltern)
                    neu.seite = richtung;
                aendere(() => {
                    if (k.zu)
                        delete k.zu;
                    const ks = kinderVon(k.id);
                    const letzter = ks.length ? ks[ks.length - 1] : null;
                    const nach = letzter
                        ? Math.max(...ast(letzter).map(x => karte.knoten.findIndex(n => n.id === x)))
                        : karte.knoten.findIndex(n => n.id === k.id);
                    karte.knoten.splice(nach + 1, 0, neu);
                });
                bearbeite(neu.id);
                return;
            }
            if (!k.eltern) {
                neuesKind(k.id);
                return;
            }
            const vor = richtung === 'oben';
            const neu = { id: uid(), text: '', eltern: k.eltern };
            if (k.seite)
                neu.seite = k.seite;
            aendere(() => {
                const eigene = ast(k.id).map(x => karte.knoten.findIndex(n => n.id === x));
                const stelle = vor ? Math.min(...eigene) : Math.max(...eigene) + 1;
                karte.knoten.splice(stelle, 0, neu);
            });
            bearbeite(neu.id);
        };
        const verbinden = (vonId, zuId) => {
            if (vonId === zuId) {
                UI.toast('Ein Thema mit sich selbst zu verbinden sagt nichts.');
                return;
            }
            const paar = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
            const schon = karte.verbindungen.find(v => paar(v.von, v.zu) === paar(vonId, zuId));
            if (schon) {
                gewaehlteVerb = schon.id;
                gewaehlt = null;
                male();
                UI.toast('Diese Verbindung gibt es schon.');
                return;
            }
            const kEltern = knotenVon(vonId)?.eltern, zEltern = knotenVon(zuId)?.eltern;
            if (kEltern === zuId || zEltern === vonId) {
                UI.toast('Die beiden hängen schon aneinander — das ist ihr Ast.');
                return;
            }
            const neu = { id: uid(), von: vonId, zu: zuId };
            aendere(() => { karte.verbindungen.push(neu); });
            gewaehlteVerb = neu.id;
            gewaehlt = null;
            male();
            UI.toast('Verbindung gezogen — Entf löscht sie, ↶ nimmt sie zurück.');
        };
        const verbindungWeg = (id) => {
            if (!id)
                return;
            if (!karte.verbindungen.some(v => v.id === id))
                return;
            aendere(() => { karte.verbindungen = karte.verbindungen.filter(v => v.id !== id); });
            gewaehlteVerb = null;
            male();
            UI.toast('Verbindung gelöscht — mit ↶ zurückholen');
        };
        const formSetzen = (id, form) => {
            const k = knotenVon(id);
            if (!k)
                return;
            aendere(() => { if (form && form !== 'rund')
                k.form = form;
            else
                delete k.form; });
        };
        const klappen = (id) => {
            const k = knotenVon(id);
            if (!k || !kinderVon(k.id).length)
                return;
            aendere(() => { if (k.zu)
                delete k.zu;
            else
                k.zu = true; });
        };
        const faerben = (id, farbe) => {
            const k = knotenVon(id);
            if (!k)
                return;
            aendere(() => { if (farbe)
                k.farbe = farbe;
            else
                delete k.farbe; });
        };
        const nachbar = (id, richtung) => {
            const plan = letzterAufbau;
            if (!plan)
                return null;
            const mein = plan.orte[id];
            if (!mein)
                return null;
            const kandidaten = Object.entries(plan.orte).filter(([x]) => x !== id);
            const passt = ([, o]) => richtung === 'rechts' ? o.x > mein.x
                : richtung === 'links' ? o.x < mein.x
                    : richtung === 'runter' ? o.y > mein.y
                        : o.y < mein.y;
            const naehe = ([, o]) => {
                const dx = o.x - mein.x, dy = o.y - mein.y;
                return richtung === 'links' || richtung === 'rechts'
                    ? Math.abs(dx) + Math.abs(dy) * 3
                    : Math.abs(dy) + Math.abs(dx) * 3;
            };
            const treffer = kandidaten.filter(passt).sort((a, b) => naehe(a) - naehe(b))[0];
            return treffer ? treffer[0] : null;
        };
        const waehle = (id) => {
            if (!id)
                return;
            if (gewaehlteVerb) {
                gewaehlteVerb = null;
                male();
            }
            gewaehlt = id;
            welt.querySelectorAll('.gk-kn.on').forEach(el => el.classList.remove('on'));
            welt.querySelectorAll('.gk-griffel').forEach(g => g.remove());
            const el = welt.querySelector(`.gk-kn[data-k="${CSS.escape(id)}"]`);
            el?.classList.add('on');
            if (el)
                griffeBauen(el);
            if (el)
                insBild(el);
        };
        const insBild = (el) => {
            if (aufFlaeche)
                return;
            const b = buehne.getBoundingClientRect();
            const k = el.getBoundingClientRect();
            let dx = 0, dy = 0;
            if (k.left < b.left + 8)
                dx = k.left - (b.left + 8);
            else if (k.right > b.right - 8)
                dx = k.right - (b.right - 8);
            if (k.top < b.top + 8)
                dy = k.top - (b.top + 8);
            else if (k.bottom > b.bottom - 8)
                dy = k.bottom - (b.bottom - 8);
            if (!dx && !dy)
                return;
            karte.sicht.x += dx;
            karte.sicht.y += dy;
            sichtAnwenden();
        };
        const zoomen = (faktor) => {
            const alt = karte.sicht.z;
            const neu = Math.min(4, Math.max(.2, alt * faktor));
            if (neu === alt)
                return;
            const b = buehne.getBoundingClientRect();
            karte.sicht.x = (karte.sicht.x + b.width / 2) * (neu / alt) - b.width / 2;
            karte.sicht.y = (karte.sicht.y + b.height / 2) * (neu / alt) - b.height / 2;
            karte.sicht.z = neu;
            sichtAnwenden();
            sichern();
        };
        const einpassen = (hoechstens, speichern, mindestens = .2) => {
            if (aufFlaeche)
                return;
            const plan = letzterAufbau;
            if (!plan || !plan.breite || !plan.hoehe)
                return;
            const b = buehne.getBoundingClientRect();
            const breite = b.width > 4 ? b.width : 900;
            const hoch = b.height > 4 ? b.height : hoehe;
            const passt = Math.min(breite / plan.breite, hoch / plan.hoehe);
            const z = Math.min(hoechstens, Math.max(mindestens, passt));
            karte.sicht.z = z;
            const wurzelOrt = plan.wurzel ? plan.orte[plan.wurzel] : null;
            const wurzelMass = plan.wurzel ? letzteMasse[plan.wurzel] : null;
            if (passt >= mindestens || !wurzelOrt || !wurzelMass) {
                karte.sicht.x = (plan.breite * z - breite) / 2;
                karte.sicht.y = (plan.hoehe * z - hoch) / 2;
            }
            else {
                const mx = wurzelOrt.x + wurzelMass.w / 2;
                const my = wurzelOrt.y + wurzelMass.h / 2;
                karte.sicht.x = mx * z - breite / 2;
                karte.sicht.y = my * z - hoch / 2;
            }
            sichtAnwenden();
            if (speichern)
                sichern();
        };
        const karteLeer = () => karte.knoten.length <= 1 &&
            !karte.verbindungen.length &&
            (!karte.knoten[0] || !karte.knoten[0].text.trim() ||
                karte.knoten[0].text === 'Zentrales Thema');
        const vorlageEinsetzen = (v) => {
            void (async () => {
                if (!karteLeer()) {
                    const antwort = await Dialog.wahl({
                        titel: 'Vorlage „' + v.name + '" einsetzen?',
                        text: 'Die jetzige Karte wird dabei ersetzt — alle Themen und '
                            + 'Verbindungen darin verschwinden.',
                        knoepfe: [
                            { id: 'ja', text: 'Ersetzen',
                                hinweis: 'Der Schritt-zurück-Knopf ↶ holt die alte Karte wieder.' },
                            { id: '', text: 'Abbrechen', hinweis: 'Die Karte bleibt, wie sie ist.' },
                        ],
                    });
                    if (antwort !== 'ja')
                        return;
                }
                const frisch = vorlageKarte(v);
                aendere(() => { karte = frisch; });
                gewaehlteVerb = null;
                waehle('w');
                einpassen(1, true);
                UI.toast('Vorlage „' + v.name + '" eingesetzt — ↶ nimmt sie zurück');
            })();
        };
        const vorlagenMenue = (anker) => {
            const r = anker.getBoundingClientRect();
            const m = UI.menu('<div class="grp">Fertige Vorlage</div>' +
                VORLAGEN.map(v => `<button data-v="${esc(v.id)}"><span>${esc(v.name)}` +
                    `<span class="sub">${esc(v.hinweis)}</span></span></button>`).join(''), Math.max(8, r.left - 40), r.bottom + 6, { titel: 'Fertige Vorlage' });
            m.addEventListener('click', e => {
                const b = e.target.closest('[data-v]');
                if (!b)
                    return;
                m.remove();
                const v = VORLAGEN.find(x => x.id === b.dataset.v);
                if (v)
                    vorlageEinsetzen(v);
            });
        };
        const karteEinfuegen = (importiert, format) => {
            if (!w.isConnected)
                return;
            let fokus = 'w';
            aendere(() => {
                if (karteLeer()) {
                    karte = importiert;
                    return;
                }
                const wurzel = baum(karte).wurzel;
                const neueIds = new Map(importiert.knoten.map(k => [k.id, uid()]));
                fokus = neueIds.get('w') ?? 'w';
                for (const k of importiert.knoten) {
                    karte.knoten.push({
                        ...k,
                        id: neueIds.get(k.id) ?? k.id,
                        eltern: k.eltern ? (neueIds.get(k.eltern) ?? wurzel) : wurzel,
                    });
                }
                for (const { von, zu } of importiert.verbindungen) {
                    const start = neueIds.get(von), ziel = neueIds.get(zu);
                    if (start && ziel)
                        karte.verbindungen.push({ id: uid(), von: start, zu: ziel });
                }
            });
            gewaehlteVerb = null;
            waehle(fokus);
            einpassen(1, true);
            UI.toast(importiert.knoten.length + ' Themen aus ' + format + ' importiert');
        };
        const markdownEinfuegen = (text, titel) => {
            try {
                karteEinfuegen(ausMarkdown(text, titel), 'Markdown');
            }
            catch (fehler) {
                UI.toast(fehler instanceof Error ? fehler.message : 'Markdown konnte nicht gelesen werden.');
            }
        };
        const excalidrawEinlesen = () => {
            const eingang = document.createElement('input');
            eingang.type = 'file';
            eingang.accept = '.excalidraw,.json,application/json';
            eingang.addEventListener('change', async () => {
                const datei = eingang.files?.[0];
                if (!datei)
                    return;
                try {
                    if (datei.size > EXCALIDRAW_GROESSE)
                        throw new Error('Die Excalidraw-Datei ist zu gross.');
                    karteEinfuegen(ausExcalidraw(await datei.text(), datei.name.replace(/\.[^.]+$/, '')), 'Excalidraw');
                }
                catch (fehler) {
                    UI.toast(fehler instanceof Error ? fehler.message : 'Excalidraw konnte nicht gelesen werden.');
                }
            }, { once: true });
            eingang.click();
        };
        const markdownEinlesen = () => {
            const eingang = document.createElement('input');
            eingang.type = 'file';
            eingang.accept = '.md,.markdown,.txt,text/markdown,text/plain';
            eingang.addEventListener('change', async () => {
                const datei = eingang.files?.[0];
                if (!datei)
                    return;
                try {
                    if (datei.size > MARKDOWN_GROESSE)
                        throw new Error('Die Markdown-Datei ist zu gross.');
                    markdownEinfuegen(await datei.text(), datei.name.replace(/\.[^.]+$/, '') || undefined);
                }
                catch (fehler) {
                    UI.toast(fehler instanceof Error ? fehler.message : 'Markdown konnte nicht gelesen werden.');
                }
            }, { once: true });
            eingang.click();
        };
        const markdownMenue = (anker) => {
            const r = anker.getBoundingClientRect();
            const m = UI.menu('<button data-md="import">Markdown-Datei öffnen</button>' +
                '<button data-md="paste">Markdown-Text einfügen</button>' +
                '<button data-md="excalidraw">Beschriftungen aus Excalidraw öffnen</button>' +
                '<button data-md="export">Gliederung als Markdown speichern</button>' +
                '<button data-md="mermaid">Als Mermaid-Diagramm speichern</button>', r.left, r.bottom + 6, { titel: 'Markdown-Gliederung' });
            m.addEventListener('click', e => {
                const aktion = e.target.closest('[data-md]')?.dataset.md;
                if (!aktion)
                    return;
                m.remove();
                if (aktion === 'import') {
                    markdownEinlesen();
                    return;
                }
                if (aktion === 'excalidraw') {
                    excalidrawEinlesen();
                    return;
                }
                if (aktion === 'paste') {
                    void Dialog.mehrzeilig('Markdown-Gliederung einfügen').then(text => {
                        if (text)
                            markdownEinfuegen(text, 'Markdown-Gliederung');
                    });
                    return;
                }
                const mermaid = aktion === 'mermaid';
                const blob = new Blob([mermaid ? alsMermaid(karte) : alsMarkdown(karte)], { type: mermaid ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8' });
                void Ereignisse.frageAsync(ARTEN.frageDateiExport, { blob, name: 'Redion-Gedankenkarte.' + (mermaid ? 'mmd' : 'md') });
            });
        };
        const elVon = (e) => e.target instanceof Element ? e.target : null;
        w.querySelector('.gk-leiste')?.addEventListener('click', e => {
            const farbKnopf = elVon(e)?.closest('.gk-farbe');
            if (farbKnopf) {
                faerben(gewaehlt, farbKnopf.dataset.c || '');
                return;
            }
            const formKnopf = elVon(e)?.closest('.gk-form');
            if (formKnopf) {
                formSetzen(gewaehlt, formKnopf.dataset.f || '');
                return;
            }
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            switch (b.dataset.a) {
                case 'kind':
                    neuesKind(gewaehlt);
                    break;
                case 'neben':
                    neuesGeschwister(gewaehlt);
                    break;
                case 'text':
                    bearbeite(gewaehlt);
                    break;
                case 'klapp':
                    klappen(gewaehlt);
                    break;
                case 'weg':
                    loeschen(gewaehlt);
                    break;
                case 'kleiner':
                    zoomen(1 / 1.25);
                    break;
                case 'groesser':
                    zoomen(1.25);
                    break;
                case 'passend':
                    einpassen(4, true);
                    break;
                case 'vorlage':
                    vorlagenMenue(b);
                    break;
                case 'markdown':
                    markdownMenue(b);
                    break;
                case 'zurueck': {
                    const roh = verlauf.zurueck(abbild());
                    if (roh === null)
                        return;
                    einsetzen(roh);
                    break;
                }
                case 'vor': {
                    const roh = verlauf.vor(abbild());
                    if (roh === null)
                        return;
                    einsetzen(roh);
                    break;
                }
                default: break;
            }
        });
        buehne.addEventListener('pointerdown', e => {
            const griffel = elVon(e)?.closest('.gk-griffel');
            if (griffel) {
                e.preventDefault();
                e.stopPropagation();
                const vonId = griffel.closest('.gk-kn')?.dataset.k || '';
                const richtung = griffel.dataset.r || 'rechts';
                const startX = e.clientX, startY = e.clientY;
                let zieht = false;
                const ziel = (ev) => {
                    const unten = document.elementFromPoint(ev.clientX, ev.clientY);
                    const kn = unten && unten.closest
                        ? unten.closest('.gk-kn') : null;
                    return kn && kn.dataset.k && kn.dataset.k !== vonId ? kn : null;
                };
                const bewegen = (ev) => {
                    if (!zieht && Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 6)
                        return;
                    if (!zieht) {
                        zieht = true;
                        buehne.classList.add('gk-zieht-verb');
                    }
                    welt.querySelectorAll('.gk-kn.gk-ziel').forEach(x => x.classList.remove('gk-ziel'));
                    ziel(ev)?.classList.add('gk-ziel');
                };
                const aus = (ev) => {
                    window.removeEventListener('pointermove', bewegen);
                    window.removeEventListener('pointerup', aus);
                    window.removeEventListener('pointercancel', aus);
                    buehne.classList.remove('gk-zieht-verb');
                    welt.querySelectorAll('.gk-kn.gk-ziel').forEach(x => x.classList.remove('gk-ziel'));
                    if (!zieht) {
                        neuerNachbar(vonId, richtung);
                        return;
                    }
                    const treffer = ziel(ev);
                    if (treffer?.dataset.k)
                        verbinden(vonId, treffer.dataset.k);
                };
                window.addEventListener('pointermove', bewegen);
                window.addEventListener('pointerup', aus);
                window.addEventListener('pointercancel', aus);
                return;
            }
            const verb = elVon(e)?.closest('.gk-verb');
            if (verb) {
                e.preventDefault();
                const id = verb.getAttribute('data-v') || '';
                if (schreibt)
                    schreiberSchliessen(null);
                gewaehlteVerb = id;
                gewaehlt = null;
                male();
                buehne.focus();
                return;
            }
            const kn = elVon(e)?.closest('.gk-kn');
            if (kn && kn.dataset.k) {
                gewaehlteVerb = null;
                if (schreibt && schreibt !== kn.dataset.k)
                    schreiberSchliessen(null);
                waehle(kn.dataset.k);
                if (!schreibt)
                    buehne.focus();
                return;
            }
            if (schreibt) {
                schreiberSchliessen(null);
                return;
            }
            if (aufFlaeche)
                return;
            const startX = e.clientX, startY = e.clientY;
            const vonX = karte.sicht.x, vonY = karte.sicht.y;
            buehne.classList.add('gk-schiebt');
            const zug = (ev) => {
                karte.sicht.x = vonX - (ev.clientX - startX);
                karte.sicht.y = vonY - (ev.clientY - startY);
                sichtAnwenden();
            };
            const aus = () => {
                window.removeEventListener('pointermove', zug);
                window.removeEventListener('pointerup', aus);
                buehne.classList.remove('gk-schiebt');
                sichern();
            };
            window.addEventListener('pointermove', zug);
            window.addEventListener('pointerup', aus);
        });
        buehne.addEventListener('dblclick', e => {
            const kn = elVon(e)?.closest('.gk-kn');
            if (kn?.dataset.k)
                bearbeite(kn.dataset.k);
        });
        buehne.addEventListener('wheel', e => {
            if (aufFlaeche || (!e.ctrlKey && !e.metaKey))
                return;
            e.preventDefault();
            zoomen(e.deltaY < 0 ? 1.1 : 1 / 1.1);
        }, { passive: false });
        buehne.addEventListener('keydown', e => {
            if (schreibt) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    schreiberSchliessen('neben');
                    return;
                }
                if (e.key === 'Tab') {
                    e.preventDefault();
                    e.stopPropagation();
                    schreiberSchliessen('kind');
                    return;
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    schreiberSchliessen(null);
                    return;
                }
                return;
            }
            const strg = e.ctrlKey || e.metaKey;
            if (strg && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                e.stopPropagation();
                const roh = e.shiftKey ? verlauf.vor(abbild()) : verlauf.zurueck(abbild());
                if (roh === null)
                    return;
                einsetzen(roh);
                return;
            }
            if (strg)
                return;
            switch (e.key) {
                case 'Tab':
                    e.preventDefault();
                    e.stopPropagation();
                    neuesKind(gewaehlt);
                    return;
                case 'Enter':
                    e.preventDefault();
                    e.stopPropagation();
                    neuesGeschwister(gewaehlt);
                    return;
                case 'F2':
                    e.preventDefault();
                    e.stopPropagation();
                    bearbeite(gewaehlt);
                    return;
                case ' ':
                    e.preventDefault();
                    e.stopPropagation();
                    klappen(gewaehlt);
                    return;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    e.stopPropagation();
                    if (gewaehlteVerb)
                        verbindungWeg(gewaehlteVerb);
                    else
                        loeschen(gewaehlt);
                    return;
                case 'ArrowRight':
                case 'ArrowLeft':
                case 'ArrowUp':
                case 'ArrowDown': {
                    if (!gewaehlt)
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    const richtung = e.key === 'ArrowRight' ? 'rechts' : e.key === 'ArrowLeft' ? 'links'
                        : e.key === 'ArrowUp' ? 'hoch' : 'runter';
                    waehle(nachbar(gewaehlt, richtung));
                    return;
                }
                default: return;
            }
        });
        buehne.addEventListener('keypress', e => {
            if (schreibt || e.ctrlKey || e.metaKey || e.altKey)
                return;
            if (e.key.length !== 1)
                return;
            const k = knotenVon(gewaehlt);
            if (!k)
                return;
            e.preventDefault();
            const zeichen = e.key;
            aendere(() => { k.text = zeichen; });
            bearbeite(k.id);
            const el = welt.querySelector(`.gk-kn[data-k="${CSS.escape(k.id)}"] .gk-txt`);
            if (el) {
                const bereich = document.createRange();
                bereich.selectNodeContents(el);
                bereich.collapse(false);
                const auswahl = window.getSelection();
                auswahl?.removeAllRanges();
                auswahl?.addRange(bereich);
            }
        });
        welt.addEventListener('paste', e => {
            if (!schreibt)
                return;
            e.preventDefault();
            const roh = e.clipboardData?.getData('text/plain') ?? '';
            if (roh)
                document.execCommand('insertText', false, roh);
        });
        welt.addEventListener('drop', e => { if (schreibt)
            e.preventDefault(); });
        welt.addEventListener('focusout', e => {
            if (!schreibt || !elVon(e)?.closest('.gk-txt.gk-schreibt'))
                return;
            const ziel = e.relatedTarget;
            if (ziel && typeof ziel.closest === 'function' && ziel.closest('.gk-leiste'))
                return;
            schreiberSchliessen(null);
        });
        griff.addEventListener('pointerdown', e => {
            e.preventDefault();
            const startY = e.clientY;
            const vonH = buehne.getBoundingClientRect().height;
            const zug = (ev) => {
                const neu = Math.max(220, Math.round(vonH + (ev.clientY - startY)));
                buehne.style.height = neu + 'px';
            };
            const aus = () => {
                window.removeEventListener('pointermove', zug);
                window.removeEventListener('pointerup', aus);
                Store.updateBlock(block.id, { hoehe: Math.round(buehne.getBoundingClientRect().height) });
            };
            window.addEventListener('pointermove', zug);
            window.addEventListener('pointerup', aus);
        });
        if (typeof ResizeObserver !== 'undefined') {
            let hatte = false;
            const beobachter = new ResizeObserver(() => {
                const b = buehne.getBoundingClientRect();
                if (b.width > 4 && !hatte) {
                    hatte = true;
                    male();
                }
            });
            beobachter.observe(buehne);
        }
        male();
        standZeigen();
        return w;
    };
    return { zeichne, leseKarte, neueKarte, aufbauen, baum, ausMarkdown, alsMarkdown, ausExcalidraw, alsMermaid, PALETTE, farbeVon };
})();
window.Gedankenkarte = Gedankenkarte;
