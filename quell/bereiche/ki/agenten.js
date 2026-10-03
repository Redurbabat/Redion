"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/ki/agenten.ts (npm run bauen:ts). */
const Agent = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const AKTION_OBJEKTE_MAX = 500;
    const AKTION_BYTES_MAX = 4 * 1024 * 1024;
    const LAUF_OBJEKTE_MAX = 1000;
    const LAUF_BYTES_MAX = 8 * 1024 * 1024;
    const GROSS_OBJEKTE_AB = 25;
    const GROSS_BYTES_AB = 256 * 1024;
    const WORKER_EINGABE_MAX_BYTES = 1024 * 1024;
    const WORKER_AUSGABE_MAX_BYTES = 1024 * 1024;
    const WORKER_ZEITLIMIT_MS = 5000;
    const WORKER_AUFRUFE_MAX = 5;
    const bytesVon = (wert) => {
        try {
            const text = JSON.stringify(wert);
            return text === undefined ? 0 : new TextEncoder().encode(text).byteLength;
        }
        catch {
            return Number.POSITIVE_INFINITY;
        }
    };
    const groesseText = (bytes) => !Number.isFinite(bytes) ? 'nicht messbar'
        : bytes < 1024 ? bytes + ' Byte'
            : bytes < 1024 * 1024 ? Math.ceil(bytes / 1024) + ' KB'
                : (Math.round(bytes / 1024 / 1024 * 10) / 10) + ' MB';
    const laufIdNeu = () => 'lauf-' + Store.uid().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 18);
    const aktiveLaeufe = new Map();
    const sicherheitsFehler = (code, text, name = 'Error') => {
        const e = name === 'AbortError' ? new DOMException(text, name) : new Error(text);
        if (name === 'AbortError')
            Object.defineProperty(e, 'redionCode', { value: code, enumerable: true });
        else
            e.code = code;
        return e;
    };
    const mitAbbruch = (versprechen, signal) => new Promise((ok, nein) => {
        if (signal.aborted) {
            nein(sicherheitsFehler('LAUF_ABGEBROCHEN', 'Der Lauf wurde abgebrochen.', 'AbortError'));
            return;
        }
        const stop = () => nein(sicherheitsFehler('LAUF_ABGEBROCHEN', 'Der Lauf wurde abgebrochen.', 'AbortError'));
        signal.addEventListener('abort', stop, { once: true });
        versprechen.then(v => {
            signal.removeEventListener('abort', stop);
            ok(v);
        }, e => {
            signal.removeEventListener('abort', stop);
            nein(e);
        });
    });
    const aktive = () => [...aktiveLaeufe.values()].map(l => ({
        id: l.id, agentId: l.agentId, agent: l.protokoll.agent,
        auftrag: l.protokoll.auftrag, status: l.protokoll.status,
        begonnen: l.protokoll.begonnen,
        wirkung: { ...l.protokoll.wirkung }, worker: l.worker.size
    }));
    const laufAbbrechen = (id, grund = 'Vom Menschen abgebrochen.') => {
        const lauf = aktiveLaeufe.get(id);
        if (!lauf || lauf.protokoll.status !== 'laeuft')
            return false;
        lauf.protokoll.status = 'abgebrochen';
        lauf.protokoll.abbruchGrund = grund;
        lauf.controller.abort(sicherheitsFehler('LAUF_ABGEBROCHEN', grund, 'AbortError'));
        lauf.worker.forEach(w => { try {
            w.terminate();
        }
        catch { } });
        lauf.worker.clear();
        try {
            UI.toast('⏹ Agentenlauf abgebrochen');
        }
        catch { }
        return true;
    };
    const seiteNachTitel = (titel) => Object.values(Store.cache.blocks).find(b => b.alive && b.type === 'page' && b.parentTable !== 'collection' &&
        (b.text || '').toLowerCase().includes(String(titel ?? '').toLowerCase()));
    const WERKZEUGE = {
        suchen: {
            recht: 'lesen',
            beschreibung: 'Sucht im Arbeitsbereich. Argument: {"frage":"Suchtext"}',
            lauf: async (a) => {
                const treffer = Kontext.finden(a.frage || '', { anzahl: 6 });
                if (!treffer.length)
                    return 'Nichts gefunden zu: ' + (a.frage || '');
                return treffer.map(t => '- ' + t.titel + (t.datenbank ? ' (aus ' + t.datenbank + ')' : '') +
                    ': ' + Kontext.ausschnitt(t, a.frage || '', 260)).join('\n');
            }
        },
        seiteLesen: {
            recht: 'lesen',
            beschreibung: 'Liest eine Seite ganz. Argument: {"titel":"Name der Seite"}',
            lauf: async (a) => {
                const p = Object.values(Store.cache.blocks).find(b => b.alive && b.type === 'page' && b.parentTable !== 'collection' &&
                    (b.text || '').toLowerCase().includes(String(a.titel || '').toLowerCase()));
                if (!p)
                    return 'Keine Seite gefunden, die „' + a.titel + '" heisst.';
                if (!Konten.darf('lesen', p.id))
                    return 'Diese Seite darfst du nicht lesen.';
                return p.text + '\n' + Kontext.textVonSeite(p.id).slice(0, 4000);
            }
        },
        seiteAnlegen: {
            recht: 'bearbeiten',
            beschreibung: 'Legt eine Seite an. Argument: ' +
                '{"titel":"…","icon":"📄","bloecke":[{"typ":"h1|h2|text|bullet|todo|quote|callout","text":"…"}]}',
            lauf: async (a, protokoll) => {
                const unterId = App.aktuelleSeite();
                if (!Konten.darf('bearbeiten', unterId))
                    return 'Hier darfst du nichts anlegen.';
                const p = Store.addPage(unterId, { text: a.titel || 'Neue Seite', icon: a.icon || '📄' });
                (a.bloecke || []).forEach((b) => {
                    const typ = ['h1', 'h2', 'h3', 'text', 'bullet', 'number', 'todo', 'quote', 'callout', 'divider', 'code']
                        .includes(b.typ) ? b.typ : 'text';
                    Store.addBlock(p.id, typ, { text: b.text || '', herkunft: 'ki' });
                });
                protokoll.ids.push(p.id);
                App.zeichneBaum();
                return 'Seite „' + (a.titel || 'Neue Seite') + '" angelegt mit ' +
                    (a.bloecke || []).length + ' Blöcken.';
            }
        },
        textBearbeiten: {
            recht: 'bearbeiten',
            beschreibung: 'Ersetzt eine EINDEUTIGE Textstelle auf einer Seite. Die Stelle muss ' +
                'genau einmal vorkommen, sonst wird nichts geändert. Der alte Stand bleibt als ' +
                'Fassung erhalten. Argument: {"titel":"Seite","alt":"genauer alter Wortlaut",' +
                '"neu":"neuer Wortlaut"}',
            lauf: async (a, protokoll) => {
                const alt = String((a && a.alt) ?? '');
                const neuerText = String((a && a.neu) ?? '');
                if (!alt)
                    return 'Ohne „alt" ist nicht zu erkennen, welche Stelle gemeint ist. Nichts geändert.';
                const seite = seiteNachTitel(a && a.titel);
                if (!seite)
                    return 'Keine Seite gefunden, die „' + (a && a.titel) + '" heisst.';
                if (!Konten.darf('bearbeiten', seite.id))
                    return 'Diese Seite darfst du nicht ändern.';
                const zaehle = (heu, nadel) => {
                    let n = 0, i = heu.indexOf(nadel);
                    while (i >= 0) {
                        n++;
                        i = heu.indexOf(nadel, i + nadel.length);
                    }
                    return n;
                };
                const treffer = Store.childrenOf(seite.id)
                    .filter((b) => b.alive && typeof b.text === 'string' && b.text.includes(alt))
                    .map((b) => ({ b, wie: zaehle(String(b.text), alt) }));
                const gesamt = treffer.reduce((n, t) => n + t.wie, 0);
                if (!gesamt)
                    return 'Die Stelle „' + alt.slice(0, 60) + '" steht nicht auf dieser Seite. ' +
                        'Nichts geändert. Lies die Seite und nimm den Wortlaut genau so, wie er dasteht.';
                if (gesamt > 1)
                    return 'Die Stelle „' + alt.slice(0, 60) + '" steht ' + gesamt + '-mal auf dieser Seite' +
                        (treffer.length > 1 ? ' (in ' + treffer.length + ' Blöcken)' : ' (im selben Block)') +
                        '. Es ist nicht zu erkennen, welche gemeint ist — deshalb wurde NICHTS geändert. ' +
                        'Nimm mehr Text drumherum, bis die Stelle eindeutig ist.';
                const ziel = treffer[0].b;
                const vorher = String(ziel.text);
                try {
                    await Store.versionSpeichern(seite.id, 'vor KI-Änderung');
                }
                catch (e) {
                    return 'Die Sicherungsfassung liess sich nicht schreiben, deshalb wurde nichts ' +
                        'geändert: ' + (e instanceof Error ? e.message : String(e));
                }
                const nachher = vorher.replace(alt, neuerText);
                Store.updateBlock(ziel.id, { text: nachher, herkunft: 'ki' });
                protokoll.ids.push(ziel.id);
                App.zeichneSeite();
                return 'Geändert auf „' + (seite.text || 'Ohne Titel') + '":\n' +
                    'vorher: ' + vorher.slice(0, 200) + '\n' +
                    'nachher: ' + nachher.slice(0, 200) + '\n' +
                    'Der alte Stand liegt als Fassung „vor KI-Änderung" im Verlauf der Seite.';
            }
        },
        karteikartenAnlegen: {
            recht: 'bearbeiten',
            beschreibung: 'Legt echte Lernkarten an, die im Lernzentrum auftauchen. Argument: ' +
                '{"titel":"Name der Kartenseite","karten":[{"frage":"…","antwort":"…"}]}',
            lauf: async (a, protokoll) => {
                const karten = Array.isArray(a && a.karten) ? a.karten : [];
                if (!karten.length)
                    return 'Keine Karten angegeben. Nichts angelegt.';
                const unterId = App.aktuelleSeite();
                if (!Konten.darf('bearbeiten', unterId))
                    return 'Hier darfst du nichts anlegen.';
                const seite = Store.addPage(unterId, { text: String((a && a.titel) || 'Lernkarten'), icon: '🎴' });
                let gezaehlt = 0;
                karten.forEach((k) => {
                    const frage = String((k && k.frage) || '').trim();
                    const antwort = String((k && k.antwort) || '').trim();
                    if (!frage)
                        return;
                    Store.addBlock(seite.id, 'flashcard', { text: frage + ' :: ' + (antwort || '…'), herkunft: 'ki' });
                    gezaehlt++;
                });
                protokoll.ids.push(seite.id);
                App.zeichneBaum();
                return gezaehlt + ' Lernkarten auf der Seite „' + (seite.text || 'Lernkarten') +
                    '" angelegt. Sie stehen ab sofort im Lernzentrum zur Wiederholung bereit.';
            }
        },
        pdfLesen: {
            recht: 'lesen',
            beschreibung: 'Liest den Text eines eingelesenen PDF-Dokuments, wahlweise nur ' +
                'eine Seitenspanne. Argument: {"titel":"Name des Dokuments","von":1,"bis":5}',
            lauf: async (a) => {
                const doku = seiteNachTitel(a && a.titel);
                if (!doku)
                    return 'Kein Dokument gefunden, das „' + (a && a.titel) + '" heisst.';
                if (!Konten.darf('lesen', doku.id))
                    return 'Dieses Dokument darfst du nicht lesen.';
                const seiten = Store.childrenOf(doku.id)
                    .filter((b) => b.alive && b.type === 'pdfseite')
                    .sort((x, y) => (Number(x.nr) || 0) - (Number(y.nr) || 0));
                if (!seiten.length)
                    return 'Die Seite „' + (doku.text || '') + '" enthält keine eingelesenen PDF-Seiten.';
                const von = Number(a && a.von) > 0 ? Number(a.von) : 1;
                const bis = Number(a && a.bis) > 0 ? Number(a.bis) : Number.MAX_SAFE_INTEGER;
                const gewaehlt = seiten.filter((b) => {
                    const n = Number(b.nr) || 0;
                    return n >= von && n <= bis;
                });
                if (!gewaehlt.length)
                    return 'Das Dokument hat ' + seiten.length + ' Seiten — ' + von + ' bis ' +
                        (bis === Number.MAX_SAFE_INTEGER ? 'Ende' : bis) + ' ist nicht darunter.';
                const GRENZE = 6000;
                let raus = '';
                let bisSeite = 0;
                for (const b of gewaehlt) {
                    const stueck = 'Seite ' + (b.nr || '?') + ':\n' +
                        String(b.suchtext || b.ocrText || '(kein Text auf dieser Seite)') + '\n\n';
                    if (raus.length + stueck.length > GRENZE)
                        break;
                    raus += stueck;
                    bisSeite = Number(b.nr) || bisSeite;
                }
                const rest = gewaehlt.length - gewaehlt.filter((b) => (Number(b.nr) || 0) <= bisSeite).length;
                return raus.trim() +
                    (rest > 0 ? '\n\n[' + rest + ' weitere Seiten passen nicht mehr in eine Antwort. ' +
                        'Frag gezielt nach ab Seite ' + (bisSeite + 1) + '.]' : '');
            }
        },
        tabelleAnlegen: {
            recht: 'bearbeiten',
            beschreibung: 'Legt eine einfache Tabelle auf der offenen Seite an. Argument: ' +
                '{"kopfzeile":["Spalte A","Spalte B"],"zeilen":[["a1","b1"],["a2","b2"]]}',
            lauf: async (a, protokoll) => {
                const kopf = Array.isArray(a && a.kopfzeile) ? a.kopfzeile.map((x) => String(x ?? '')) : [];
                const zeilen = Array.isArray(a && a.zeilen) ? a.zeilen : [];
                if (!kopf.length && !zeilen.length)
                    return 'Weder Kopfzeile noch Zeilen. Nichts angelegt.';
                const unterId = App.aktuelleSeite();
                if (!Konten.darf('bearbeiten', unterId))
                    return 'Hier darfst du nichts anlegen.';
                const breite = Math.max(kopf.length, ...zeilen.map((z) => (Array.isArray(z) ? z.length : 0)), 1);
                const fuellen = (z) => {
                    const r = (Array.isArray(z) ? z : []).map((x) => String(x ?? ''));
                    while (r.length < breite)
                        r.push('');
                    return r.slice(0, breite);
                };
                const rows = [];
                if (kopf.length)
                    rows.push(fuellen(kopf));
                zeilen.forEach((z) => rows.push(fuellen(z)));
                const b = Store.addBlock(unterId, 'table', { rows, kopfZeile: kopf.length > 0, herkunft: 'ki' });
                protokoll.ids.push(b.id);
                App.zeichneSeite();
                return 'Tabelle mit ' + rows.length + ' Zeilen und ' + breite +
                    ' Spalten auf der offenen Seite angelegt.';
            }
        },
        seiteLoeschen: {
            recht: 'loeschen',
            beschreibung: 'Legt eine Seite in den Papierkorb. Sie bleibt wiederherstellbar. ' +
                'Der Mensch wird vorher jedes Mal gefragt. Argument: {"titel":"Name der Seite"}',
            vorschau: (a) => {
                const p2 = seiteNachTitel(a && a.titel);
                if (!p2)
                    return { text: 'Keine Seite gefunden, die „' + (a && a.titel) + '" heisst.',
                        objekte: 0 };
                const tief = (id, t) => t > 3 ? 0 :
                    Store.childrenOf(id).filter((k) => k.alive)
                        .reduce((n, k) => n + 1 + tief(k.id, t + 1), 0);
                const kinder = tief(p2.id, 0);
                return { text: 'Seite „' + (p2.text || 'Ohne Titel') + '" mit ' + kinder +
                        ' Blöcken darunter kommt in den Papierkorb.',
                    objekte: kinder + 1, id: p2.id };
            },
            lauf: async (a, protokoll) => {
                const p2 = seiteNachTitel(a && a.titel);
                if (!p2)
                    return 'Keine Seite gefunden, die „' + (a && a.titel) + '" heisst. Nichts gelöscht.';
                if (!Konten.darf('loeschen', p2.id))
                    return 'Diese Seite darfst du nicht löschen.';
                const name = p2.text || 'Ohne Titel';
                Store.trashBlock(p2.id);
                if (protokoll && protokoll.ids)
                    protokoll.ids.push(p2.id);
                App.zeichneBaum();
                return 'Seite „' + name + '" liegt im Papierkorb. ' +
                    'Sie ist dort wiederherstellbar — endgültig gelöscht ist nichts.';
            }
        },
        datenbankAnlegen: {
            recht: 'bearbeiten',
            beschreibung: 'Legt eine Datenbank an. Argument: ' +
                '{"name":"…","spalten":[{"name":"…","typ":"Text|Zahl|Auswahl|Datum|Kontrollkästchen|Formel",' +
                '"optionen":["…"],"formel":"…"}],"zeilen":[{"Titel":"…","Spalte":"Wert"}]}',
            lauf: async (a, protokoll) => {
                const unterId = App.aktuelleSeite();
                if (!Konten.darf('bearbeiten', unterId))
                    return 'Hier darfst du nichts anlegen.';
                const erg = KI.datenbankBauenAus(a, unterId);
                if (erg && erg.blockId)
                    protokoll.ids.push(erg.blockId);
                return erg ? ('Datenbank „' + a.name + '" mit ' + erg.spalten + ' Spalten und ' +
                    erg.zeilen + ' Zeilen angelegt.')
                    : 'Die Datenbank liess sich nicht bauen.';
            }
        },
        zeileAnlegen: {
            recht: 'bearbeiten',
            beschreibung: 'Legt einen Eintrag in einer vorhandenen Datenbank an. Argument: ' +
                '{"datenbank":"Name","werte":{"Spalte":"Wert"}}',
            lauf: async (a, protokoll) => {
                const c = Object.values(Store.cache.collections).find(x => (x.name || '').toLowerCase() === String(a.datenbank || '').toLowerCase());
                if (!c)
                    return 'Keine Datenbank namens „' + a.datenbank + '".';
                const darfHier = Konten.darfAnSammlung('bearbeiten', c.id);
                if (darfHier === false)
                    return 'In „' + c.name + '" darfst du nichts anlegen.';
                if (darfHier === null)
                    return 'Zu „' + c.name + '" liess sich keine Seite finden, also auch ' +
                        'kein Recht daran. Nichts angelegt.';
                const props = {};
                let titel = '';
                Object.entries(a.werte || {}).forEach(([n, v]) => {
                    const k = Object.keys(c.schema).find(x => c.schema[x].name.toLowerCase() === n.toLowerCase());
                    if (!k)
                        return;
                    if (c.schema[k].type === 'title')
                        titel = v;
                    else
                        props[k] = v;
                });
                const r = Store.addRow(c.id, props);
                Store.updateBlock(r.id, { text: titel || 'Ohne Titel' });
                if (protokoll && protokoll.ids)
                    protokoll.ids.push(r.id);
                App.zeichneSeite();
                return 'Eintrag „' + (titel || 'Ohne Titel') + '" in „' + c.name + '" angelegt.';
            }
        },
        datenbankLesen: {
            recht: 'lesen',
            beschreibung: 'Liest eine Datenbank als Tabelle. Argument: {"name":"…","grenze":30}',
            lauf: async (a) => {
                const c = Object.values(Store.cache.collections).find(x => (x.name || '').toLowerCase().includes(String(a.name || '').toLowerCase()));
                if (!c)
                    return 'Keine Datenbank gefunden zu „' + a.name + '".';
                if (!Konten.darfAnSammlung('lesen', c.id))
                    return 'Diese Datenbank darfst du nicht lesen.';
                const keys = Object.keys(c.schema);
                const kopf = keys.map(k => c.schema[k].name).join(' | ');
                const zeilen = Store.rowsOf(c.id).slice(0, a.grenze || 30).map((r) => keys.map(k => Formula.anzeige(Datenbank.wert(r, k, c))).join(' | '));
                return c.name + '\n' + kopf + '\n' + zeilen.join('\n');
            }
        },
        feldFuellen: {
            recht: 'bearbeiten',
            beschreibung: 'Füllt ein Feld aller Einträge einer Datenbank per KI. Argument: ' +
                '{"datenbank":"…","spalte":"…","auftrag":"Was soll dort stehen?"}',
            lauf: async (a, protokoll) => {
                const c = Object.values(Store.cache.collections).find(x => (x.name || '').toLowerCase().includes(String(a.datenbank || '').toLowerCase()));
                if (!c)
                    return 'Keine Datenbank gefunden.';
                const k = Object.keys(c.schema).find(x => c.schema[x].name.toLowerCase() === String(a.spalte || '').toLowerCase());
                if (!k)
                    return 'Keine Spalte namens „' + a.spalte + '".';
                const darfFuellen = Konten.darfAnSammlung('bearbeiten', c.id);
                if (darfFuellen === false)
                    return 'In „' + c.name + '" darfst du nichts ändern.';
                if (darfFuellen === null)
                    return 'Zu „' + c.name + '" liess sich keine Seite finden, also auch ' +
                        'kein Recht daran. Nichts gefüllt.';
                c.schema[k].auftrag = a.auftrag || c.schema[k].auftrag;
                Store.updateCollection(c.id, { schema: c.schema });
                const zeilen = Store.rowsOf(c.id).slice(0, 15);
                let gefuellt = 0, kaputt = 0;
                for (const r of zeilen) {
                    if (protokoll && protokoll.felder)
                        protokoll.felder.push({ id: r.id, key: k,
                            alt: (Store.getBlock(r.id)?.props || {})[k] });
                    try {
                        if (await Datenbank.kiFeldFuellenFuer(r, k, c))
                            gefuellt++;
                    }
                    catch {
                        kaputt++;
                    }
                }
                const rest = zeilen.length - gefuellt - kaputt;
                return gefuellt + ' von ' + zeilen.length + ' Einträgen in „' + a.spalte + '" gefüllt' +
                    (kaputt ? ', ' + kaputt + ' mit Fehler' : '') +
                    (rest ? ', ' + rest + ' ohne Antwort oder ohne Schreibrecht' : '') + '.';
            }
        },
        nachschlagen: {
            recht: 'lesen',
            beschreibung: 'Schlägt einen Begriff in der Wikipedia nach. Argument: {"begriff":"…"}',
            lauf: async (a) => {
                if (!Kontext.quellen().web)
                    return 'Die Websuche ist ausgeschaltet.';
                const d = await KI.wikipedia(a.begriff || '');
                return d ? (d.titel + ': ' + d.text) : 'Kein Wikipedia-Eintrag zu „' + a.begriff + '".';
            }
        },
        kalenderLesen: {
            recht: 'lesen',
            beschreibung: 'Liest die nächsten Termine. Argument: {"tage":14}',
            lauf: async (a) => {
                const c = Object.values(Store.cache.collections).find(x => x.schema && x.schema.start && x.schema.uid);
                if (!c)
                    return 'Es gibt noch keine Termin-Datenbank.';
                const grenze = new Date();
                grenze.setDate(grenze.getDate() + (Number(a.tage) || 14));
                const heute = new Date();
                heute.setHours(0, 0, 0, 0);
                const liste = Store.rowsOf(c.id)
                    .map((r) => ({ r, d: new Date(Datenbank.wert(r, 'start', c) || 0) }))
                    .filter((x) => !isNaN(x.d) && x.d >= heute && x.d <= grenze)
                    .sort((a2, b2) => a2.d - b2.d)
                    .slice(0, 40);
                if (!liste.length)
                    return 'Keine Termine in diesem Zeitraum.';
                return liste.map((x) => x.d.toLocaleDateString('de-DE') + ' ' +
                    (String(Datenbank.wert(x.r, 'start', c)).length > 10
                        ? String(Datenbank.wert(x.r, 'start', c)).slice(11, 16) + ' ' : '') +
                    x.r.text).join('\n');
            }
        },
        mailLesen: {
            recht: 'lesen',
            beschreibung: 'Liest die letzten Mails. Argument: {"nurUngelesen":true,"grenze":20}',
            lauf: async (a) => {
                const c = Object.values(Store.cache.collections).find(x => x.schema && x.schema.mid && x.schema.von);
                if (!c)
                    return 'Es gibt noch keine Mail-Datenbank.';
                let zeilen = Store.rowsOf(c.id);
                if (a.nurUngelesen)
                    zeilen = zeilen.filter((r) => !Datenbank.wert(r, 'gelesen', c));
                return zeilen.slice(0, a.grenze || 20).map((r) => '- ' + Datenbank.wert(r, 'von', c) + ': ' + r.text + ' — ' +
                    String(Datenbank.wert(r, 'kurz', c) || '').slice(0, 120)).join('\n') || 'Keine Mails.';
            }
        },
        worker: {
            recht: 'bearbeiten',
            beschreibung: 'Führt einen gespeicherten Worker aus. Argument: {"name":"…","eingabe":{}}',
            lauf: async (a, protokoll, lauf) => {
                if (!Konten.darfUeberhaupt('bearbeiten'))
                    return 'Deine Rolle erlaubt kein Ausführen von Workern.';
                const w = worker().find((x) => x.name === a.name);
                if (!w)
                    return 'Keinen Worker namens „' + a.name + '“ gefunden. Vorhanden: ' +
                        (worker().map((x) => x.name).join(', ') || 'keiner');
                if (protokoll && protokoll.bleibt && !protokoll.bleibt.includes('worker'))
                    protokoll.bleibt.push('worker');
                if (protokoll && (protokoll.workerAufrufe || 0) >= WORKER_AUFRUFE_MAX)
                    throw sicherheitsFehler('WORKER_BUDGET_AUFgebraucht'.toUpperCase(), 'Dieser Lauf hat sein Worker-Budget von ' + WORKER_AUFRUFE_MAX +
                        ' Aufrufen verbraucht. Kein weiterer Worker wurde gestartet.');
                if (protokoll)
                    protokoll.workerAufrufe = (protokoll.workerAufrufe || 0) + 1;
                const raus = await workerLaufen(w, a.eingabe || {}, {
                    signal: lauf?.controller.signal,
                    lauf,
                    laufId: lauf?.id,
                    agentId: lauf?.agentId
                });
                return 'Worker „' + w.name + '" sagt: ' + JSON.stringify(raus).slice(0, 1200);
            }
        },
        fertig: {
            recht: 'lesen',
            beschreibung: 'Beendet die Arbeit. Argument: {"antwort":"Das Ergebnis für den Menschen"}',
            lauf: async (a) => a.antwort || 'Fertig.'
        }
    };
    const wirkungPlanen = (werkzeug, a) => {
        const bytes = bytesVon(a || {});
        let objekte = 0;
        let text = 'Keine gespeicherten Objekte';
        if (werkzeug === 'seiteAnlegen') {
            objekte = 1 + (Array.isArray(a?.bloecke) ? a.bloecke.length : 0);
            text = 'eine Seite und ' + Math.max(0, objekte - 1) + ' Block/Blöcke';
        }
        else if (werkzeug === 'datenbankAnlegen') {
            const zeilen = Math.min(30, Array.isArray(a?.zeilen) ? a.zeilen.length : 0);
            objekte = 2 + zeilen;
            text = 'eine Datenbank mit höchstens ' + zeilen + ' Zeile(n)';
        }
        else if (werkzeug === 'zeileAnlegen') {
            objekte = 1;
            text = 'ein Eintrag in „' + String(a?.datenbank || '?') + '"';
        }
        else if (werkzeug === 'feldFuellen') {
            const c = Object.values(Store.cache.collections).find(x => (x.name || '').toLowerCase().includes(String(a?.datenbank || '').toLowerCase()));
            objekte = c ? Math.min(15, Store.rowsOf(c.id).length) + 1 : 1;
            text = 'höchstens ' + Math.max(0, objekte - 1) + ' Feldwert(e) und die Spalteneinstellung';
        }
        else if (werkzeug === 'textBearbeiten') {
            objekte = 1;
            text = 'eine Textstelle auf „' + String(a?.titel || '?') + '": ' +
                '„' + String(a?.alt || '').slice(0, 80) + '" → ' +
                '„' + String(a?.neu || '').slice(0, 80) + '"';
        }
        else if (werkzeug === 'worker') {
            text = 'Worker-Eingabe und -Ergebnis, keine direkten Arbeitsbereichsdaten';
        }
        else if (WERKZEUGE[werkzeug]?.recht === 'bearbeiten') {
            objekte = 1;
            text = 'höchstens ein gespeichertes Objekt';
        }
        return { objekte, bytes, text,
            gross: objekte >= GROSS_OBJEKTE_AB || bytes >= GROSS_BYTES_AB };
    };
    const wirkungGrenze = (lauf, w) => {
        if (!Number.isFinite(w.bytes))
            return sicherheitsFehler('AKTION_NICHT_MESSBAR', 'Die Größe dieser Handlung lässt sich nicht sicher bestimmen. Sie wurde nicht ausgeführt.');
        if (w.objekte > AKTION_OBJEKTE_MAX)
            return sicherheitsFehler('AKTION_ZU_VIELE_OBJEKTE', 'Diese eine Handlung würde ' + w.objekte + ' Objekte betreffen. Erlaubt sind höchstens ' +
                AKTION_OBJEKTE_MAX + '. Sie wurde nicht aufgeteilt und nicht ausgeführt.');
        if (w.bytes > AKTION_BYTES_MAX)
            return sicherheitsFehler('AKTION_ZU_GROSS', 'Diese eine Handlung ist ' + groesseText(w.bytes) + ' groß. Erlaubt sind höchstens ' +
                groesseText(AKTION_BYTES_MAX) + '. Sie wurde nicht aufgeteilt und nicht ausgeführt.');
        if (lauf.reserviert.objekte + w.objekte > LAUF_OBJEKTE_MAX)
            return sicherheitsFehler('LAUF_ZU_VIELE_OBJEKTE', 'Dieser Lauf würde insgesamt mehr als ' + LAUF_OBJEKTE_MAX +
                ' Objekte schreiben. Weitere Werkzeuge wurden verhindert.');
        if (lauf.reserviert.bytes + w.bytes > LAUF_BYTES_MAX)
            return sicherheitsFehler('LAUF_ZU_GROSS', 'Dieser Lauf würde insgesamt mehr als ' + groesseText(LAUF_BYTES_MAX) +
                ' schreiben. Weitere Werkzeuge wurden verhindert.');
        return null;
    };
    const wirkungReservieren = (lauf, w) => {
        lauf.reserviert.objekte += w.objekte;
        lauf.reserviert.bytes += w.bytes;
        lauf.protokoll.wirkung = { ...lauf.reserviert };
    };
    const TYPEN = [
        { id: 'assistent', icon: '🧭', name: 'Persönlicher Assistent',
            text: 'Sucht im Arbeitsbereich, fasst zusammen, legt Seiten und Einträge an.',
            werkzeuge: ['suchen', 'seiteLesen', 'seiteAnlegen', 'zeileAnlegen', 'datenbankLesen',
                'kalenderLesen', 'mailLesen', 'pdfLesen', 'tabelleAnlegen',
                'karteikartenAnlegen', 'textBearbeiten', 'seiteLoeschen', 'fertig'],
            anweisung: 'Du bist ein persönlicher Assistent. Arbeite ruhig und knapp. ' +
                'Suche zuerst im Arbeitsbereich, bevor du etwas behauptest. ' +
                'Wenn du etwas anlegst, sag genau, was du angelegt hast. ' +
                'Löschen darfst du nur, wenn der Mensch es verlangt — und er wird ' +
                'vor jeder einzelnen Löschung gefragt. Sagt er nein, arbeite ohne ' +
                'diesen Schritt weiter.' },
        { id: 'recherche', icon: '🔍', name: 'Rechercheur',
            text: 'Sammelt aus mehreren Quellen, vergleicht und schreibt mit Quellenangabe.',
            werkzeuge: ['suchen', 'seiteLesen', 'datenbankLesen', 'nachschlagen', 'seiteAnlegen',
                'pdfLesen', 'tabelleAnlegen', 'fertig'],
            anweisung: 'Du recherchierst. Sammle erst breit, dann ordne. Nenne zu jeder Aussage, ' +
                'woher sie stammt. Was du nicht belegen kannst, kennzeichnest du als Vermutung.' },
        { id: 'redakteur', icon: '✍️', name: 'Redakteur',
            text: 'Überarbeitet Texte, ohne den Sinn zu verändern.',
            werkzeuge: ['seiteLesen', 'suchen', 'pdfLesen', 'textBearbeiten', 'fertig'],
            anweisung: 'Du überarbeitest Texte. Der Sinn bleibt, die Sprache wird klarer. ' +
                'Keine neuen Behauptungen, keine Ausschmückung. Schreib in ganzen Sätzen. ' +
                'Zum Ändern liest du die Seite ZUERST und nimmst den alten Wortlaut ' +
                'buchstabengetreu — eine Stelle, die mehrfach vorkommt, wird nicht geändert.' },
        { id: 'bau', icon: '🗂', name: 'Datenbank-Baumeister',
            text: 'Entwirft Datenbanken, legt Spalten an und füllt sie.',
            werkzeuge: ['suchen', 'datenbankLesen', 'datenbankAnlegen', 'zeileAnlegen', 'feldFuellen', 'fertig'],
            anweisung: 'Du baust Datenbanken. Denk zuerst über die Spalten nach: welcher Typ, ' +
                'welche Optionen, welche Formel. Lege lieber wenige gute Spalten an als viele halbe.' }
    ];
    const eigene = () => Store.getMeta('agent:eigene', []) || [];
    const eigeneSpeichern = (l) => Store.setMeta('agent:eigene', l);
    const alle = () => [
        ...TYPEN.map(t => ({ ...t, fest: true })),
        ...eigene()
    ];
    const holen = (id) => alle().find(a => a.id === id) || TYPEN[0];
    const WORKER_BEISPIEL = '/* Eingabe steht in "eingabe", das Ergebnis kommt aus return. */\n' +
        'const zahlen = (eingabe.werte || []).map(Number).filter(n => !isNaN(n));\n' +
        'const summe = zahlen.reduce((a, b) => a + b, 0);\n' +
        'return { summe, schnitt: zahlen.length ? summe / zahlen.length : 0, anzahl: zahlen.length };';
    const worker = () => Store.getMeta('agent:worker', []) || [];
    const workerSpeichern = (l) => Store.setMeta('agent:worker', l);
    const workerLaufen = (w, eingabe, optionen = {}) => new Promise((ok, fehler) => {
        let workerEingabe;
        try {
            const text = JSON.stringify(eingabe ?? {});
            if (text === undefined)
                throw new Error('nicht als JSON darstellbar');
            workerEingabe = JSON.parse(text);
        }
        catch (e) {
            fehler(sicherheitsFehler('WORKER_EINGABE_UNGUELTIG', 'Die Worker-Eingabe muss vollständig als JSON darstellbar sein: ' +
                (e instanceof Error ? e.message : String(e))));
            return;
        }
        const eingabeBytes = bytesVon({ code: String(w?.code || ''), eingabe: workerEingabe });
        if (!Number.isFinite(eingabeBytes) || eingabeBytes > WORKER_EINGABE_MAX_BYTES) {
            fehler(sicherheitsFehler('WORKER_EINGABE_ZU_GROSS', 'Die Worker-Eingabe samt Code ist ' + groesseText(eingabeBytes) +
                ' groß. Erlaubt sind höchstens ' + groesseText(WORKER_EINGABE_MAX_BYTES) + '.'));
            return;
        }
        if (optionen.signal?.aborted) {
            fehler(sicherheitsFehler('LAUF_ABGEBROCHEN', 'Der Lauf wurde abgebrochen.', 'AbortError'));
            return;
        }
        const quelle = 'self.onmessage = async (e) => {\n' +
            '  const eingabe = e.data;\n' +
            '  try {\n' +
            '    const fn = new Function("eingabe", ' + JSON.stringify('return (async () => {' + w.code + '})();') + ');\n' +
            '    const r = await fn(eingabe);\n' +
            '    const text = JSON.stringify(r);\n' +
            '    if (text === undefined) throw Object.assign(new Error("Das Ergebnis ist nicht als JSON übertragbar."), { code: "WORKER_AUSGABE_UNGUELTIG" });\n' +
            '    const bytes = new TextEncoder().encode(text).byteLength;\n' +
            '    if (bytes > ' + WORKER_AUSGABE_MAX_BYTES + ') throw Object.assign(new Error("Das Worker-Ergebnis ist zu groß (" + bytes + " Byte)."), { code: "WORKER_AUSGABE_ZU_GROSS" });\n' +
            '    self.postMessage({ ok: true, wert: JSON.parse(text), bytes });\n' +
            '  } catch (err) { self.postMessage({ ok: false, code: String(err && err.code || "WORKER_FEHLER"), fehler: String(err && err.message || err) }); }\n' +
            '};';
        let u = '';
        let wk;
        try {
            u = URL.createObjectURL(new Blob([quelle], { type: 'text/javascript' }));
            wk = new Worker(u);
        }
        catch {
            if (u)
                URL.revokeObjectURL(u);
            fehler(sicherheitsFehler('WORKER_NICHT_VERFUEGBAR', 'Worker lassen sich hier nicht starten.'));
            return;
        }
        let erledigt = false;
        let wache = null;
        const aufraeumen = () => {
            if (erledigt)
                return false;
            erledigt = true;
            if (wache !== null)
                clearTimeout(wache);
            optionen.signal?.removeEventListener('abort', abbrechen);
            optionen.lauf?.worker.delete(wk);
            try {
                wk.terminate();
            }
            catch { }
            URL.revokeObjectURL(u);
            return true;
        };
        const abbrechen = () => {
            if (!aufraeumen())
                return;
            fehler(sicherheitsFehler('LAUF_ABGEBROCHEN', 'Der Worker wurde mit dem Agentenlauf abgebrochen.', 'AbortError'));
        };
        optionen.lauf?.worker.add(wk);
        optionen.signal?.addEventListener('abort', abbrechen, { once: true });
        wache = setTimeout(() => {
            if (!aufraeumen())
                return;
            fehler(sicherheitsFehler('WORKER_ZEITLIMIT', 'Der Worker hat zu lange gebraucht (über ' +
                Math.round(WORKER_ZEITLIMIT_MS / 1000) + ' Sekunden).'));
        }, WORKER_ZEITLIMIT_MS);
        wk.onmessage = (e) => {
            if (!aufraeumen())
                return;
            if (!e.data?.ok) {
                fehler(sicherheitsFehler(e.data?.code || 'WORKER_FEHLER', e.data?.fehler || 'Fehler im Worker'));
                return;
            }
            const ausgabeBytes = Number(e.data.bytes) || bytesVon(e.data.wert);
            if (ausgabeBytes > WORKER_AUSGABE_MAX_BYTES) {
                fehler(sicherheitsFehler('WORKER_AUSGABE_ZU_GROSS', 'Das Worker-Ergebnis ist ' + groesseText(ausgabeBytes) + ' groß.'));
                return;
            }
            ok(e.data.wert);
        };
        wk.onerror = (e) => {
            if (!aufraeumen())
                return;
            fehler(sicherheitsFehler('WORKER_FEHLER', e.message || 'Fehler im Worker'));
        };
        try {
            wk.postMessage(workerEingabe);
        }
        catch (e) {
            if (!aufraeumen())
                return;
            fehler(sicherheitsFehler('WORKER_EINGABE_UNGUELTIG', 'Die Worker-Eingabe lässt sich nicht übertragen: ' +
                (e instanceof Error ? e.message : String(e))));
        }
    });
    const laeufe = () => Store.getMeta('agent:laeufe', []) || [];
    const werkzeugText = (namen) => namen
        .filter((n) => WERKZEUGE[n])
        .map((n) => '- ' + n + ': ' + WERKZEUGE[n].beschreibung)
        .join('\n');
    const JSON_HOLEN = (text) => {
        const t = String(text || '');
        const start = t.indexOf('{');
        if (start < 0)
            return null;
        let tiefe = 0, inText = false, flucht = false;
        for (let i = start; i < t.length; i++) {
            const c = t[i];
            if (flucht) {
                flucht = false;
                continue;
            }
            if (c === '\\') {
                flucht = true;
                continue;
            }
            if (c === '"')
                inText = !inText;
            if (inText)
                continue;
            if (c === '{')
                tiefe++;
            if (c === '}') {
                tiefe--;
                if (!tiefe) {
                    try {
                        return JSON.parse(t.slice(start, i + 1));
                    }
                    catch {
                        return null;
                    }
                }
            }
        }
        return null;
    };
    const notaus = () => !!Store.getMeta('agent:notaus', false);
    const notausSetzen = (an) => {
        Store.setMeta('agent:notaus', !!an);
        if (an)
            [...aktiveLaeufe.keys()].forEach(id => laufAbbrechen(id, 'Der globale Notausschalter wurde umgelegt.'));
        try {
            UI.toast(an ? '⛔ Agenten angehalten — auch die Auslöser'
                : '▶️ Agenten dürfen wieder');
        }
        catch { }
    };
    const TAGESGRENZE_VORGABE = 120;
    const tagesgrenze = () => Math.max(0, Number(Store.getMeta('agent:tagesgrenze', TAGESGRENZE_VORGABE)) || 0);
    const heuteAls = () => {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
            '-' + String(d.getDate()).padStart(2, '0');
    };
    const tagesstand = () => {
        const s = Store.getMeta('agent:tagesstand', null);
        if (!s || s.tag !== heuteAls())
            return { tag: heuteAls(), schritte: 0 };
        return { tag: s.tag, schritte: Number(s.schritte) || 0 };
    };
    const tagesRest = () => Math.max(0, tagesgrenze() - tagesstand().schritte);
    const schrittZaehlen = () => {
        const s = tagesstand();
        Store.setMeta('agent:tagesstand', { tag: s.tag, schritte: s.schritte + 1 });
    };
    const fragenModus = () => {
        const m = String(Store.getMeta('agent:fragen', 'einmal'));
        return m === 'immer' || m === 'nie' ? m : 'einmal';
    };
    const laufen = async (agentId, auftrag, beiSchritt, optionen) => {
        const a = holen(agentId);
        const guthaben = Math.max(1, Math.min(30, Number(a.guthaben) || 8));
        const ohneAufsicht = !!optionen?.unbeaufsichtigt;
        const erlaubt = (a.werkzeuge || []).filter((n) => WERKZEUGE[n]);
        const id = optionen?.laufId || laufIdNeu();
        const begonnen = Store.now();
        const protokoll = {
            id, agentId: String(a.id || agentId || ''), agent: a.name, auftrag,
            schritte: [], ids: [], felder: [], bleibt: [], zeit: begonnen, begonnen,
            status: 'laeuft', wirkung: { objekte: 0, bytes: 0 }, workerAufrufe: 0
        };
        const lauf = {
            id, agentId: protokoll.agentId, controller: new AbortController(),
            worker: new Set(), protokoll, reserviert: { objekte: 0, bytes: 0 }
        };
        if (typeof KiBuch !== 'undefined' && KiBuch.laufBeginnen)
            KiBuch.laufBeginnen();
        let gespeichert = false;
        let hatFehler = false;
        const sichern = () => {
            if (gespeichert)
                return;
            gespeichert = true;
            const liste = laeufe();
            liste.unshift(protokoll);
            Store.setMeta('agent:laeufe', liste.slice(0, 30));
        };
        const melden = (s) => {
            protokoll.schritte.push(s);
            if (beiSchritt)
                beiSchritt(s, protokoll);
        };
        const vorStartAblehnen = (grund) => {
            protokoll.status = 'abgelehnt';
            protokoll.beendet = Store.now();
            melden({ nr: 1, gedanke: 'Grenze erreicht', werkzeug: 'fertig', ergebnis: grund });
            sichern();
            return protokoll;
        };
        if (aktiveLaeufe.has(id))
            return vorStartAblehnen('Die Lauf-ID „' + id + '“ wird bereits benutzt. Der zweite Lauf wurde nicht gestartet.');
        if (notaus())
            return vorStartAblehnen('Der Notausschalter steht. Kein Agent läuft, auch kein Auslöser. ' +
                'Wieder freigeben unter 🤖 Agent → Grenzen.');
        if (tagesgrenze() > 0 && tagesRest() <= 0)
            return vorStartAblehnen('Das Tageslimit von ' + tagesgrenze() + ' Schritten ist aufgebraucht. ' +
                'Morgen geht es weiter, oder du hebst die Grenze unter 🤖 Agent → Grenzen an.');
        let nutzbar = erlaubt.filter((n) => Konten.darf(WERKZEUGE[n].recht));
        let gesperrt = erlaubt.filter((n) => !nutzbar.includes(n));
        if (ohneAufsicht && !a.darfAllein) {
            const nurLesen = nutzbar.filter((n) => WERKZEUGE[n].recht === 'lesen');
            gesperrt = gesperrt.concat(nutzbar.filter((n) => !nurLesen.includes(n)));
            nutzbar = nurLesen;
        }
        if (ohneAufsicht) {
            const loeschend = nutzbar.filter((n) => WERKZEUGE[n].recht === 'loeschen');
            if (loeschend.length) {
                gesperrt = gesperrt.concat(loeschend);
                nutzbar = nutzbar.filter((n) => !loeschend.includes(n));
            }
        }
        const wissen = (a.wissen || []).map((wissensId) => {
            const p = Store.getBlock(wissensId);
            return p && Konten.darf('lesen', p.id)
                ? '## ' + (p.text || 'Ohne Titel') + '\n' + Kontext.textVonSeite(p.id).slice(0, 1500) : '';
        }).filter(Boolean).join('\n\n');
        const system = (a.anweisung || '') + '\n\n' +
            (Store.getMeta('ki:persoenlich', '') ? 'Dauerhafte Anweisungen des Menschen:\n' +
                Store.getMeta('ki:persoenlich', '') + '\n\n' : '') +
            'Du arbeitest in Schritten. Antworte in JEDEM Schritt mit genau einem JSON-Objekt, ' +
            'ohne Text davor oder danach:\n' +
            '{"gedanke":"kurz, was du vorhast","werkzeug":"name","argument":{…}}\n\n' +
            'Diese Werkzeuge hast du:\n' + werkzeugText(nutzbar) + '\n\n' +
            (gesperrt.length ? 'Nicht erlaubt (fehlende Rechte): ' + gesperrt.join(', ') + '\n\n' : '') +
            'Regeln: Suche, bevor du behauptest. Lege nichts doppelt an. ' +
            'Wenn du fertig bist, nimm das Werkzeug "fertig" und schreib die Antwort für den Menschen.' +
            (ohneAufsicht && !a.darfAllein
                ? '\n\nDu läufst gerade, ohne dass jemand zusieht. Du darfst deshalb nur lesen ' +
                    'und berichten. Was geändert werden soll, schreibst du als Vorschlag in deine Antwort.'
                : '') +
            (wissen ? '\n\nDas ist dein hinterlegtes Wissen:\n' + wissen : '');
        const verlauf = [{ role: 'user', content: auftrag }];
        let zugesagt = false;
        aktiveLaeufe.set(id, lauf);
        try {
            for (let i = 0; i < guthaben; i++) {
                if (lauf.controller.signal.aborted)
                    throw lauf.controller.signal.reason ||
                        sicherheitsFehler('LAUF_ABGEBROCHEN', 'Der Lauf wurde abgebrochen.', 'AbortError');
                if (tagesgrenze() > 0 && tagesRest() <= 0) {
                    melden({ nr: i + 1, gedanke: 'Tageslimit erreicht', werkzeug: 'fertig',
                        ergebnis: 'Das Tageslimit von ' + tagesgrenze() + ' Schritten ist erreicht. ' +
                            'Was bis hierhin herauskam, steht oben.' });
                    break;
                }
                if (notaus()) {
                    laufAbbrechen(id, 'Der globale Notausschalter wurde umgelegt.');
                    throw lauf.controller.signal.reason || sicherheitsFehler('LAUF_ABGEBROCHEN', 'Der Notausschalter wurde umgelegt.', 'AbortError');
                }
                schrittZaehlen();
                const antwort = await mitAbbruch(KI.frageKurz(verlauf.map(m => (m.role === 'user' ? 'MENSCH: ' : 'DU: ') + m.content).join('\n\n') +
                    '\n\nDein nächster Schritt als JSON:', system, { signal: lauf.controller.signal }), lauf.controller.signal);
                const plan = JSON_HOLEN(antwort);
                if (!plan || !plan.werkzeug) {
                    melden({ nr: i + 1, gedanke: 'Antwort ohne Plan', werkzeug: 'fertig',
                        ergebnis: String(antwort).slice(0, 2000), fehler: true });
                    hatFehler = true;
                    break;
                }
                const schritt = { nr: i + 1, gedanke: plan.gedanke || '',
                    werkzeug: plan.werkzeug, argument: plan.argument || {} };
                if (plan.werkzeug === 'fertig') {
                    const ergebnis = String((plan.argument && plan.argument.antwort) || 'Fertig.');
                    schritt.ergebnis = ergebnis;
                    protokoll.antwort = ergebnis;
                    melden(schritt);
                    break;
                }
                const wz = WERKZEUGE[plan.werkzeug];
                if (!wz || !nutzbar.includes(plan.werkzeug)) {
                    schritt.ergebnis = 'Dieses Werkzeug gibt es nicht oder du darfst es nicht. ' +
                        'Erlaubt sind: ' + nutzbar.join(', ');
                    schritt.fehler = true;
                    hatFehler = true;
                }
                else {
                    let darfAusfuehren = true;
                    if (wz.recht === 'loeschen') {
                        const v = typeof wz.vorschau === 'function'
                            ? wz.vorschau(plan.argument || {})
                            : { text: 'Etwas wird entfernt.', objekte: 1 };
                        schritt.wirkung = { text: v.text, objekte: v.objekte || 1, bytes: 0, gross: false };
                        if (ohneAufsicht) {
                            schritt.ergebnis = 'Nicht gelöscht: ' + v.text + ' Löschen braucht eine ' +
                                'ausdrückliche Bestätigung, und dieser Lauf hat keinen Zuschauer. ' +
                                'Schreib es als Vorschlag in deine Antwort.';
                            schritt.fehler = true;
                            hatFehler = true;
                            darfAusfuehren = false;
                        }
                        else {
                            const antwortLoeschen = await mitAbbruch(Dialog.wahl({
                                titel: '🗑 ' + a.name + ' möchte etwas löschen',
                                text: v.text + '\n\n' +
                                    'Werkzeug: ' + plan.werkzeug + '\n' +
                                    (plan.gedanke ? 'Vorhaben: ' + plan.gedanke + '\n' : '') +
                                    'Betroffene Objekte: ' + (v.objekte || 1) + '\n' +
                                    'Argumente: ' + JSON.stringify(plan.argument || {}).slice(0, 400),
                                knoepfe: [
                                    { id: 'nein', text: 'Nicht löschen',
                                        hinweis: 'Der Agent bekommt eine Absage und arbeitet ohne diesen Schritt weiter.' },
                                    { id: 'ja', text: 'In den Papierkorb legen',
                                        hinweis: 'Nur diese eine Handlung. Wiederherstellbar über den Papierkorb.' }
                                ]
                            }), lauf.controller.signal);
                            if (antwortLoeschen !== 'ja') {
                                schritt.ergebnis = 'Der Mensch hat das Löschen abgelehnt. ' +
                                    'Arbeite ohne diesen Schritt weiter oder werde fertig.';
                                darfAusfuehren = false;
                            }
                        }
                    }
                    else if (wz.recht === 'bearbeiten') {
                        const wirkung = wirkungPlanen(plan.werkzeug, plan.argument || {});
                        schritt.wirkung = wirkung;
                        const grenze = wirkungGrenze(lauf, wirkung);
                        if (grenze) {
                            schritt.ergebnis = 'Sicherheitsgrenze: ' + grenze.message;
                            schritt.fehler = true;
                            hatFehler = true;
                            darfAusfuehren = false;
                        }
                        else if (wirkung.gross && ohneAufsicht) {
                            schritt.ergebnis = 'Große Änderung nicht ausgeführt: ' + wirkung.text + ' (' +
                                wirkung.objekte + ' Objekte, ' + groesseText(wirkung.bytes) +
                                '). Dafür ist eine ausdrückliche Bestätigung nötig.';
                            schritt.fehler = true;
                            hatFehler = true;
                            darfAusfuehren = false;
                        }
                        else {
                            const normalFragen = !ohneAufsicht &&
                                (fragenModus() === 'immer' || (fragenModus() === 'einmal' && !zugesagt));
                            if (wirkung.gross || normalFragen) {
                                const knoepfe = [
                                    { id: 'nein', text: 'Nicht ändern',
                                        hinweis: 'Der Agent bekommt eine Absage und arbeitet ohne diesen Schritt weiter.' },
                                    { id: 'ja', text: wirkung.gross ? 'Diese Größe ausdrücklich erlauben' : 'Einmal erlauben',
                                        hinweis: 'Nur diese eine, oben bezifferte Handlung.' }
                                ];
                                if (!wirkung.gross)
                                    knoepfe.push({ id: 'lauf', text: 'Für diesen Lauf erlauben',
                                        hinweis: 'Bis dieser Auftrag fertig ist. Große Änderungen fragen trotzdem eigens.' });
                                const antwortJa = await mitAbbruch(Dialog.wahl({
                                    titel: wirkung.gross
                                        ? '🛡 Große Agentenänderung bestätigen'
                                        : '🤖 ' + a.name + ' möchte etwas ändern',
                                    text: 'Werkzeug: ' + plan.werkzeug + '\n' +
                                        (plan.gedanke ? 'Vorhaben: ' + plan.gedanke + '\n' : '') +
                                        'Vorschau: ' + wirkung.text + '\n' +
                                        'Betroffene Objekte: ' + wirkung.objekte + '\n' +
                                        'Größe der Handlung: ' + groesseText(wirkung.bytes) + '\n' +
                                        'Argumente: ' + JSON.stringify(plan.argument || {}).slice(0, 400),
                                    knoepfe
                                }), lauf.controller.signal);
                                if (antwortJa === 'lauf' && !wirkung.gross)
                                    zugesagt = true;
                                if (antwortJa !== 'ja' && antwortJa !== 'lauf') {
                                    schritt.ergebnis = 'Der Mensch hat diesen Schritt abgelehnt. ' +
                                        'Arbeite ohne ihn weiter oder werde fertig.';
                                    darfAusfuehren = false;
                                }
                            }
                        }
                        if (darfAusfuehren)
                            wirkungReservieren(lauf, wirkung);
                    }
                    if (darfAusfuehren) {
                        try {
                            schritt.ergebnis = String(await wz.lauf(plan.argument || {}, protokoll, lauf) || '')
                                .slice(0, 4000);
                        }
                        catch (e) {
                            if (lauf.controller.signal.aborted || (e instanceof Error && e.name === 'AbortError'))
                                throw e;
                            const code = e instanceof Error ? e.code : '';
                            schritt.ergebnis = 'Das Werkzeug ist gescheitert' + (code ? ' [' + code + ']' : '') + ': ' +
                                (e instanceof Error ? e.message : String(e));
                            schritt.fehler = true;
                            hatFehler = true;
                        }
                    }
                }
                melden(schritt);
                verlauf.push({ role: 'assistant', content: JSON.stringify(plan) });
                verlauf.push({ role: 'user', content: 'Ergebnis von ' + plan.werkzeug + ':\n' + schritt.ergebnis });
                if (i === guthaben - 1)
                    melden({ nr: i + 2, gedanke: 'Guthaben aufgebraucht', werkzeug: 'fertig',
                        ergebnis: 'Das Guthaben von ' + guthaben + ' Schritten ist aufgebraucht. ' +
                            'Was bis hierhin herauskam, steht oben.' });
            }
            if (protokoll.status === 'laeuft')
                protokoll.status = hatFehler ? 'fehler' : 'fertig';
        }
        catch (e) {
            const abgebrochen = lauf.controller.signal.aborted ||
                (e instanceof Error && e.name === 'AbortError');
            if (abgebrochen) {
                protokoll.status = 'abgebrochen';
                const grund = protokoll.abbruchGrund || (e instanceof Error ? e.message : 'Vom Menschen abgebrochen.');
                if (!protokoll.schritte.some(s => s.gedanke === 'Abgebrochen'))
                    melden({ nr: protokoll.schritte.length + 1, gedanke: 'Abgebrochen', werkzeug: 'fertig',
                        ergebnis: grund });
            }
            else {
                protokoll.status = 'fehler';
                melden({ nr: protokoll.schritte.length + 1, gedanke: 'Lauf gescheitert',
                    werkzeug: 'fertig', fehler: true,
                    ergebnis: e instanceof Error ? e.message : String(e) });
            }
        }
        finally {
            lauf.worker.forEach(w => { try {
                w.terminate();
            }
            catch { } });
            lauf.worker.clear();
            aktiveLaeufe.delete(id);
            protokoll.beendet = Store.now();
            sichern();
        }
        return protokoll;
    };
    const zuruecknehmen = (protokoll) => {
        (protokoll.ids || []).forEach((id) => { Store.trashBlock(id); Store.purgeBlock(id); });
        [...(protokoll.felder || [])].reverse().forEach((f) => {
            if (Store.getBlock(f.id))
                Store.setProp(f.id, f.key, f.alt);
        });
        App.zeichneBaum();
        App.zeichneSeite();
        const teile = [];
        if ((protokoll.ids || []).length)
            teile.push((protokoll.ids || []).length + ' angelegte Seite(n) entfernt');
        if ((protokoll.felder || []).length)
            teile.push((protokoll.felder || []).length + ' Feldwert(e) wiederhergestellt');
        let text = 'Zurückgenommen' + (teile.length ? ': ' + teile.join(', ') : '');
        if ((protokoll.bleibt || []).length)
            text += ' — was „' + protokoll.bleibt.join('", „') + '" verändert hat, bleibt';
        return text;
    };
    const ausloeserPruefen = async () => {
        if (notaus())
            return;
        if (tagesgrenze() > 0 && tagesRest() <= 0)
            return;
        const jetzt = new Date();
        const liste = eigene();
        let geaendert = false;
        for (const a of liste) {
            const t = a.ausloeser;
            if (!t || !t.art)
                continue;
            if (t.art === 'taeglich') {
                if (jetzt.getHours() < (Number(t.stunde) || 8))
                    continue;
                const tag = jetzt.toISOString().slice(0, 10);
                if (t.zuletzt === tag)
                    continue;
                t.zuletzt = tag;
                geaendert = true;
                UI.toast('🤖 ' + a.name + ' läuft …');
                try {
                    await laufen(a.id, t.auftrag || a.anweisung || 'Mach deine tägliche Runde.', undefined, { unbeaufsichtigt: true });
                }
                catch (e) {
                    UI.banner(a.name + ': ' +
                        (e instanceof Error ? e.message : String(e)), 'warn');
                }
            }
        }
        if (geaendert)
            eigeneSpeichern(liste);
    };
    const start = () => {
        setTimeout(ausloeserPruefen, 9000);
        setInterval(ausloeserPruefen, 1800000);
    };
    const panel = (vorgabe = '') => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(760px,95vw)">' +
            '<div class="fh">🤖 Agent<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div id="ag-notaus"></div>' +
            '<div style="padding:12px 18px 4px">' +
            '<div class="agent-typen" id="at"></div>' +
            `<textarea id="aa" rows="3" placeholder="Was soll der Agent tun? Zum Beispiel: ` +
            `Finde alle offenen Punkte aus meinen Notizen und leg daraus eine Aufgabenliste an."` +
            `>${esc(vorgabe)}</textarea>` +
            '</div>' +
            '<div class="res" id="al" style="max-height:44vh"></div>' +
            '<div class="fbtns"><button data-a="los" class="prim">Loslegen</button>' +
            '<button data-a="abbrechen" class="warn" hidden>⏹ Diesen Lauf abbrechen</button>' +
            '<button data-a="eigen">Eigener Agent</button>' +
            '<button data-a="worker">Workers</button>' +
            '<button data-a="verlauf">Frühere Läufe</button>' +
            '<button data-a="grenzen">Grenzen</button>' +
            '<button data-a="zu">Schliessen</button></div></div>';
        document.body.appendChild(o);
        const zeichneNotaus = () => {
            const k = o.querySelector('#ag-notaus');
            if (!k)
                return;
            const aus = notaus();
            const rest = tagesRest(), grenze = tagesgrenze();
            k.innerHTML =
                '<div class="ag-grenzstreifen' + (aus ? ' aus' : '') + '">' +
                    '<span class="ags-text">' +
                    (aus ? '⛔ <b>Angehalten.</b> Kein Agent läuft, auch kein Auslöser.'
                        : (grenze > 0
                            ? 'Heute noch <b>' + rest + '</b> von ' + grenze + ' Schritten'
                            : 'Kein Tageslimit gesetzt')) +
                    '</span>' +
                    '<button data-a="notaus" class="' + (aus ? 'prim' : '') + '">' +
                    (aus ? 'Wieder erlauben' : '⛔ Alle anhalten') + '</button>' +
                    '</div>';
        };
        zeichneNotaus();
        let gewaehlt = Store.getMeta('agent:zuletzt', 'assistent');
        let laufImFenster = '';
        const zeichneTypen = () => {
            const kasten = o.querySelector('#at');
            if (!kasten)
                return;
            kasten.innerHTML = alle().map((a) => `<button class="agent-karte${a.id === gewaehlt ? ' on' : ''}" data-t="${esc(a.id)}">` +
                `<span class="agent-ico">${a.icon || '🤖'}</span>` +
                `<b>${esc(a.name)}</b><span>${esc(a.text || a.anweisung || '').slice(0, 70)}</span>` +
                `<em>${(a.werkzeuge || []).length} Werkzeuge · ${a.guthaben || 8} Schritte</em>` +
                '</button>').join('');
        };
        zeichneTypen();
        const ORB_ZU_WERKZEUG = {
            suchen: 'searching', nachschlagen: 'searching', seiteLesen: 'searching',
            datenbankLesen: 'searching', kalenderLesen: 'searching', mailLesen: 'searching',
            seiteAnlegen: 'composing', feldFuellen: 'composing',
            datenbankAnlegen: 'shaping', zeileAnlegen: 'shaping',
            worker: 'solving', fertig: 'breathing',
        };
        const zeigeSchritt = (s) => {
            const liste = o.querySelector('#al');
            if (!liste)
                return;
            const el = document.createElement('div');
            el.className = 'agent-schritt';
            el.innerHTML =
                `<div class="as-kopf"><span class="as-nr">${s.nr}</span>` +
                    `<b>${esc(s.werkzeug)}</b>` +
                    (s.gedanke ? `<span class="as-gedanke">${esc(s.gedanke)}</span>` : '') + '</div>' +
                    `<div class="as-erg">${esc(String(s.ergebnis || '')).slice(0, 1200).replace(/\n/g, '<br>')}</div>`;
            liste.appendChild(el);
            liste.scrollTop = 99999;
        };
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const t = elVon(e)?.closest('[data-t]');
            if (t) {
                gewaehlt = t.dataset.t;
                Store.setMeta('agent:zuletzt', gewaehlt);
                zeichneTypen();
                return;
            }
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            if (b.dataset.a === 'eigen') {
                o.remove();
                eigenerDialog();
                return;
            }
            if (b.dataset.a === 'worker') {
                o.remove();
                workerDialog();
                return;
            }
            if (b.dataset.a === 'verlauf') {
                o.remove();
                verlaufDialog();
                return;
            }
            if (b.dataset.a === 'grenzen') {
                o.remove();
                grenzenDialog();
                return;
            }
            if (b.dataset.a === 'notaus') {
                notausSetzen(!notaus());
                zeichneNotaus();
                return;
            }
            if (b.dataset.a === 'abbrechen') {
                if (laufImFenster)
                    laufAbbrechen(laufImFenster);
                return;
            }
            if (b.dataset.a === 'los') {
                const auftrag = (o.querySelector('#aa')?.value || '').trim();
                const liste = o.querySelector('#al');
                if (!auftrag) {
                    UI.toast('Was soll er tun?');
                    return;
                }
                if (!liste)
                    return;
                liste.innerHTML = '';
                const laeuftEl = document.createElement('div');
                laeuftEl.className = 'agent-laeuft';
                liste.appendChild(laeuftEl);
                const kugel = window.Orb
                    ? window.Orb.setzen(laeuftEl, 'working', 64)
                    : null;
                const wort = document.createElement('div');
                wort.className = 'agent-laeuft-wort ag-motion-status';
                wort.dataset.zustand = 'laeuft';
                wort.setAttribute('role', 'status');
                wort.textContent = 'Der Agent denkt nach …';
                laeuftEl.appendChild(wort);
                b.disabled = true;
                laufImFenster = laufIdNeu();
                const stopp = o.querySelector('[data-a="abbrechen"]');
                if (stopp)
                    stopp.hidden = false;
                try {
                    const p = await laufen(gewaehlt, auftrag, (s) => {
                        kugel?.zustand(ORB_ZU_WERKZEUG[String(s.werkzeug)] || 'working');
                        wort.textContent = 'Schritt ' + s.nr + ' · ' + String(s.werkzeug || '');
                        zeigeSchritt(s);
                    }, { laufId: laufImFenster });
                    const letzte = p.schritte[p.schritte.length - 1];
                    const fertig = document.createElement('div');
                    fertig.className = 'agent-fertig';
                    fertig.innerHTML = '<b>Ergebnis · ' + esc(p.status || 'fertig') + '</b><div>' +
                        esc(String(letzte?.ergebnis || '')).replace(/\n/g, '<br>') + '</div>' +
                        ((p.ids.length || p.felder.length)
                            ? `<button data-zurueck="1">Änderungen dieses Laufs zurücknehmen</button>` : '');
                    liste.appendChild(fertig);
                    fertig.querySelector('[data-zurueck]')?.addEventListener('click', () => {
                        UI.toast(zuruecknehmen(p));
                        fertig.querySelector('button')?.remove();
                    });
                }
                catch (err) {
                    liste.innerHTML = '<div class="agent-fehler">' +
                        esc(err instanceof Error ? err.message : String(err)) + '</div>';
                }
                kugel?.stopp();
                laeuftEl.remove();
                laufImFenster = '';
                if (stopp)
                    stopp.hidden = true;
                b.disabled = false;
            }
        });
    };
    const grenzenDialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        const stand = tagesstand();
        o.innerHTML = '<div class="finder" style="width:min(600px,94vw)">' +
            '<div class="fh">🛡 Grenzen für Agenten<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div style="padding:6px 18px 14px">' +
            '<div class="ez-zeile"><div class="ez-text"><b>Notausschalter</b>' +
            '<span>Hält alle Agenten an — auch die, die von selbst zu einer ' +
            'Uhrzeit loslegen. Bleibt gesetzt, bis du ihn wieder löst.</span></div>' +
            '<div class="ez-steuer"><button class="ez-knopf' + (notaus() ? ' warn' : '') +
            '" data-a="notaus">' + (notaus() ? 'Steht — wieder erlauben' : 'Alle anhalten') +
            '</button></div></div>' +
            '<div class="ez-zeile"><div class="ez-text"><b>Schritte je Tag</b>' +
            '<span>Für alle Agenten zusammen. Das Guthaben eines Agenten gilt ' +
            'nur je Auftrag — ein täglicher Auslöser wäre damit unbegrenzt. ' +
            'Heute verbraucht: ' + stand.schritte + '. 0 heisst: keine Grenze.</span></div>' +
            '<div class="ez-steuer"><input id="ag-tag" type="number" min="0" max="10000" ' +
            'value="' + tagesgrenze() + '" style="min-width:100px"></div></div>' +
            '<div class="ez-zeile"><div class="ez-text"><b>Vor Änderungen fragen</b>' +
            '<span>Zurücknehmen gibt es nur für Angelegtes. Was ein Agent ' +
            'überschreibt, ist weg — deshalb wird davor gefragt, nicht danach.</span></div>' +
            '<div class="ez-steuer"><select id="ag-fragen">' +
            '<option value="einmal">Einmal je Auftrag</option>' +
            '<option value="immer">Vor jeder Änderung</option>' +
            '<option value="nie">Gar nicht</option>' +
            '</select></div></div>' +
            '<p class="ez-grau" style="margin-top:14px; line-height:1.6">' +
            'Läuft ein Agent <b>ohne Aufsicht</b> — durch einen Auslöser zu einer ' +
            'festen Uhrzeit —, darf er nur lesen und berichten. Eine Rückfrage ' +
            'wäre dort keine Sicherung, sondern eine Sperre, die niemand ' +
            'beantwortet. Wer das anders will, setzt beim Agenten selbst ' +
            '„darf allein ändern".</p>' +
            '</div>' +
            '<div class="fbtns"><button data-a="sichern" class="prim">Übernehmen</button>' +
            '<button data-a="zu">Schliessen</button></div></div>';
        document.body.appendChild(o);
        const wahl = o.querySelector('#ag-fragen');
        if (wahl)
            wahl.value = fragenModus();
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="notaus"]')) {
                notausSetzen(!notaus());
                o.remove();
                grenzenDialog();
                return;
            }
            if (elVon(e)?.closest('[data-a="sichern"]')) {
                const n = Number(o.querySelector('#ag-tag')?.value);
                Store.setMeta('agent:tagesgrenze', Number.isFinite(n) && n >= 0 ? Math.floor(n) : TAGESGRENZE_VORGABE);
                Store.setMeta('agent:fragen', wahl?.value || 'einmal');
                UI.toast('Grenzen gesichert');
                o.remove();
            }
        });
    };
    const eigenerDialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(680px,94vw)">' +
            '<div class="fh">🤖 Eigene Agenten<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" id="el"></div>' +
            '<div class="fbtns"><button data-a="neu" class="prim">＋ Agent anlegen</button>' +
            '<button data-a="zu">Fertig</button></div></div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const l = eigene();
            const kasten = o.querySelector('#el');
            if (!kasten)
                return;
            kasten.innerHTML = l.length
                ? l.map((a, i) => `<div class="frei-zeile"><span class="frei-kreis bg-purple">${a.icon || '🤖'}</span>` +
                    `<span class="frei-name"><b>${esc(a.name)}</b>` +
                    `<span>${(a.werkzeuge || []).length} Werkzeuge · ${a.guthaben || 8} Schritte` +
                    `${a.ausloeser?.art === 'taeglich' ? ' · täglich ab ' + a.ausloeser.stunde + ' Uhr' : ''}` +
                    `${(a.wissen || []).length ? ' · ' + a.wissen.length + ' Wissensseiten' : ''}</span></span>` +
                    `<button data-bearb="${i}">✎</button><button data-weg="${i}">🗑</button></div>`).join('')
                : '<div style="padding:18px;color:var(--text-faint);font-size:14px">' +
                    'Noch kein eigener Agent. Ein eigener Agent hat eigene Anweisungen, eigene ' +
                    'Werkzeugrechte, eigene Wissensseiten und darf zu einer festen Uhrzeit von ' +
                    'selbst loslegen.</div>';
        };
        zeichne();
        const bauen = async (vorhanden, index2) => {
            const o2 = document.createElement('div');
            o2.className = 'overlay';
            const a = vorhanden || { name: '', icon: '🤖', anweisung: '', guthaben: 8,
                werkzeuge: ['suchen', 'seiteLesen', 'fertig'], wissen: [], ausloeser: {} };
            const seiten = Object.values(Store.cache.blocks)
                .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
                .sort((x, y) => (x.text || '').localeCompare(y.text || ''));
            o2.innerHTML = '<div class="finder" style="width:min(620px,94vw)">' +
                `<div class="fh">${vorhanden ? 'Agent ändern' : 'Neuer Agent'}` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:13px; ' +
                'max-height:64vh; overflow:auto">' +
                `<label>Name<br><input id="en" value="${esc(a.name)}" placeholder="z. B. Morgenrunde"></label>` +
                `<label>Symbol<br><input id="ei" value="${esc(a.icon || '🤖')}" style="width:70px"></label>` +
                '<label>Anweisung — wie soll er arbeiten?<br>' +
                `<textarea id="ea" rows="4">${esc(a.anweisung)}</textarea></label>` +
                '<label>Werkzeuge, die er benutzen darf<br><div class="wz-liste">' +
                Object.keys(WERKZEUGE).map(w => `<label class="wz-w"><input type="checkbox" data-w="${w}"` +
                    `${(a.werkzeuge || []).includes(w) ? ' checked' : ''}> ${w}</label>`).join('') +
                '</div></label>' +
                '<label>Wissensseiten — die kennt er immer<br><select id="ew" multiple size="5">' +
                seiten.slice(0, 200).map(p => `<option value="${p.id}"${(a.wissen || []).includes(p.id) ? ' selected' : ''}>` +
                    `${esc(p.text || 'Ohne Titel')}</option>`).join('') +
                '</select></label>' +
                `<label>Guthaben — wie viele Schritte höchstens<br>` +
                `<input id="eg" type="number" min="1" max="30" value="${a.guthaben || 8}"></label>` +
                '<label>Auslöser<br><select id="et">' +
                `<option value=""${!a.ausloeser?.art ? ' selected' : ''}>nur auf Zuruf</option>` +
                `<option value="taeglich"${a.ausloeser?.art === 'taeglich' ? ' selected' : ''}>` +
                'jeden Tag zu einer Uhrzeit</option>' +
                '</select></label>' +
                '<label id="ets">Ab wann<br>' +
                `<input id="es" type="number" min="0" max="23" value="${a.ausloeser?.stunde ?? 8}"></label>` +
                '<label id="eta">Was soll er dann tun?<br>' +
                `<input id="eauf" value="${esc(a.ausloeser?.auftrag || '')}" ` +
                'placeholder="z. B. Fasse zusammen, was gestern dazugekommen ist."></label>' +
                '<label id="etd" class="wz-w"><input id="ed" type="checkbox"' +
                (a.darfAllein ? ' checked' : '') + '> Darf auch ohne Aufsicht ändern' +
                '<span class="fl-hinweis">Ohne das darf ein Agent, der von selbst ' +
                'loslegt, nur lesen und berichten — niemand sitzt davor, um eine ' +
                'Rückfrage zu beantworten. Mit dem Haken legt er an und schreibt, ' +
                'während du schläfst.</span></label>' +
                '</div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Sichern</button>' +
                '<button data-a="zu">Abbrechen</button></div></div>';
            document.body.appendChild(o2);
            const auffrischen = () => {
                const an = o2.querySelector('#et')?.value === 'taeglich';
                const ets = o2.querySelector('#ets');
                const eta = o2.querySelector('#eta');
                if (ets)
                    ets.style.display = an ? '' : 'none';
                if (eta)
                    eta.style.display = an ? '' : 'none';
            };
            auffrischen();
            o2.querySelector('#et')?.addEventListener('change', auffrischen);
            o2.addEventListener('click', ev => {
                const ziel = elVon(ev);
                if (ev.target === o2 || ziel?.closest('[data-a="zu"]')) {
                    o2.remove();
                    return;
                }
                if (!ziel?.closest('[data-a="ok"]'))
                    return;
                const feld = (id) => o2.querySelector(id);
                const en = feld('#en'), ei = feld('#ei'), ea = feld('#ea'), eg = feld('#eg');
                const ew = o2.querySelector('#ew');
                const et = o2.querySelector('#et');
                if (!en || !ei || !ea || !eg || !ew || !et)
                    return;
                const neu = {
                    id: (vorhanden && vorhanden.id) || 'e' + Store.uid().slice(0, 6),
                    name: en.value || 'Agent',
                    icon: ei.value || '🤖',
                    anweisung: ea.value,
                    werkzeuge: [...o2.querySelectorAll('[data-w]:checked')].map(x => x.dataset.w),
                    wissen: [...ew.selectedOptions].map(x => x.value),
                    guthaben: Number(eg.value) || 8,
                    darfAllein: !!o2.querySelector('#ed')?.checked,
                    text: (ea.value || '').slice(0, 90)
                };
                const art = et.value;
                if (art === 'taeglich')
                    neu.ausloeser = {
                        art, stunde: Number(feld('#es')?.value) || 8,
                        auftrag: feld('#eauf')?.value || '',
                        zuletzt: (vorhanden && vorhanden.ausloeser && vorhanden.ausloeser.zuletzt) || null
                    };
                const l = eigene();
                if (index2 == null)
                    l.push(neu);
                else
                    l[index2] = neu;
                eigeneSpeichern(l);
                o2.remove();
                zeichne();
                UI.toast('Agent gesichert');
            });
        };
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const bearb = elVon(e)?.closest('[data-bearb]');
            if (bearb) {
                bauen(eigene()[Number(bearb.dataset.bearb)], Number(bearb.dataset.bearb));
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                const l = eigene();
                l.splice(Number(weg.dataset.weg), 1);
                eigeneSpeichern(l);
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="neu"]'))
                bauen(null, null);
        });
    };
    const workerDialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(700px,94vw)">' +
            '<div class="fh">⚙️ Workers<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div style="padding:10px 18px 0; font-size:13px; color:var(--text-dim); line-height:1.6">' +
            'Ein Worker ist ein kleines Stück eigener Code, das der Agent als Werkzeug aufrufen kann. ' +
            'Er läuft in einem eigenen Faden ohne Zugriff auf die Seite oder deine Daten — nur die ' +
            'Eingabe geht hinein, nur der Rückgabewert kommt heraus. Nach fünf Sekunden wird er ' +
            'abgebrochen.</div>' +
            '<div class="res" id="wl"></div>' +
            '<div class="fbtns"><button data-a="neu" class="prim">＋ Worker</button>' +
            '<button data-a="zu">Fertig</button></div></div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const l = worker();
            const kasten = o.querySelector('#wl');
            if (!kasten)
                return;
            kasten.innerHTML = l.length
                ? l.map((w, i) => `<div class="frei-zeile"><span class="frei-kreis bg-orange">⚙️</span>` +
                    `<span class="frei-name"><b>${esc(w.name)}</b>` +
                    `<span>${esc(w.beschreibung || '').slice(0, 60) || 'ohne Beschreibung'}</span></span>` +
                    `<button data-test="${i}">Testen</button>` +
                    `<button data-bearb="${i}">✎</button><button data-weg="${i}">🗑</button></div>`).join('')
                : '<div style="padding:18px;color:var(--text-faint);font-size:14px">Noch kein Worker.</div>';
        };
        zeichne();
        const bauen = (vorhanden, index2) => {
            const w = vorhanden || { name: '', beschreibung: '', code: WORKER_BEISPIEL };
            const o2 = document.createElement('div');
            o2.className = 'overlay';
            o2.innerHTML = '<div class="finder" style="width:min(680px,94vw)">' +
                '<div class="fh">Worker<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px">' +
                `<label>Name<br><input id="wn" value="${esc(w.name)}" placeholder="z. B. summe"></label>` +
                `<label>Wozu ist er da?<br><input id="wb" value="${esc(w.beschreibung || '')}"></label>` +
                '<label>Code — <code>eingabe</code> hinein, <code>return</code> heraus<br>' +
                `<textarea id="wc" rows="10" spellcheck="false" ` +
                `style="font:12.5px/1.55 var(--mono)">${esc(w.code)}</textarea></label>` +
                '</div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Sichern</button>' +
                '<button data-a="zu">Abbrechen</button></div></div>';
            document.body.appendChild(o2);
            o2.addEventListener('click', ev => {
                const ziel = elVon(ev);
                if (ev.target === o2 || ziel?.closest('[data-a="zu"]')) {
                    o2.remove();
                    return;
                }
                if (!ziel?.closest('[data-a="ok"]'))
                    return;
                const wn = o2.querySelector('#wn');
                const wb = o2.querySelector('#wb');
                const wc = o2.querySelector('#wc');
                if (!wn || !wb || !wc)
                    return;
                const neu = { name: wn.value || 'worker',
                    beschreibung: wb.value,
                    code: wc.value };
                const l = worker();
                if (index2 == null)
                    l.push(neu);
                else
                    l[index2] = neu;
                workerSpeichern(l);
                o2.remove();
                zeichne();
                UI.toast('Worker gesichert');
            });
        };
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const test = elVon(e)?.closest('[data-test]');
            if (test) {
                const w = worker()[Number(test.dataset.test)];
                const roh = await UI.frage('Eingabe als JSON', '{"werte":[1,2,3]}');
                if (roh == null)
                    return;
                try {
                    const erg = await workerLaufen(w, JSON.parse(roh));
                    UI.toast('Ergebnis: ' + JSON.stringify(erg).slice(0, 120));
                }
                catch (err) {
                    UI.banner('Worker: ' +
                        (err instanceof Error ? err.message : String(err)), 'warn');
                }
                return;
            }
            const bearb = elVon(e)?.closest('[data-bearb]');
            if (bearb) {
                bauen(worker()[Number(bearb.dataset.bearb)], Number(bearb.dataset.bearb));
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                const l = worker();
                l.splice(Number(weg.dataset.weg), 1);
                workerSpeichern(l);
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="neu"]'))
                bauen(null, null);
        });
    };
    const verlaufDialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(720px,94vw)">' +
            '<div class="fh">🧾 Frühere Läufe<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" id="vl" style="max-height:62vh"></div>' +
            '<div class="fbtns"><button data-a="leeren">Verlauf leeren</button>' +
            '<button data-a="zu" class="prim">Fertig</button></div></div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const l = laeufe();
            const kasten = o.querySelector('#vl');
            if (!kasten)
                return;
            kasten.innerHTML = l.length
                ? l.map((p, i) => `<details class="lauf"><summary><b>${esc(p.agent)}</b> · ${esc(p.auftrag).slice(0, 60)}` +
                    `<em>${esc(p.status || 'fertig')} · ${p.schritte.length} Schritte · ` +
                    `${esc(String(p.zeit).slice(0, 16).replace('T', ' '))}</em>` +
                    '</summary>' +
                    p.schritte.map((s) => `<div class="agent-schritt"><div class="as-kopf">` +
                        `<span class="as-nr">${s.nr}</span><b>${esc(s.werkzeug)}</b>` +
                        `<span class="as-gedanke">${esc(s.gedanke || '')}</span></div>` +
                        `<div class="as-erg">${esc(String(s.ergebnis || '')).slice(0, 700)}</div></div>`).join('') +
                    ((p.ids && p.ids.length) || (p.felder && p.felder.length)
                        ? `<button data-zurueck="${i}">Änderungen dieses Laufs zurücknehmen</button>` : '') +
                    '</details>').join('')
                : '<div style="padding:18px;color:var(--text-faint);font-size:14px">Noch kein Lauf.</div>';
        };
        zeichne();
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const z = elVon(e)?.closest('[data-zurueck]');
            if (z) {
                UI.toast(zuruecknehmen(laeufe()[Number(z.dataset.zurueck)]));
                return;
            }
            if (elVon(e)?.closest('[data-a="leeren"]')) {
                Store.setMeta('agent:laeufe', []);
                zeichne();
            }
        });
    };
    return { WERKZEUGE, TYPEN, alle, holen, eigene, laufen, zuruecknehmen, laeufe,
        worker, workerLaufen, WORKER_BEISPIEL, panel, eigenerDialog, workerDialog,
        verlaufDialog, grenzenDialog, start, ausloeserPruefen, JSON_HOLEN,
        notaus, notausSetzen, tagesgrenze, tagesstand, tagesRest, fragenModus,
        aktive, laufAbbrechen, wirkungPlanen,
        AKTION_OBJEKTE_MAX, AKTION_BYTES_MAX, LAUF_OBJEKTE_MAX, LAUF_BYTES_MAX,
        GROSS_OBJEKTE_AB, GROSS_BYTES_AB,
        WORKER_EINGABE_MAX_BYTES, WORKER_AUSGABE_MAX_BYTES, WORKER_ZEITLIMIT_MS,
        WORKER_AUFRUFE_MAX,
        TAGESGRENZE_VORGABE };
})();
window.Agent = Agent;
