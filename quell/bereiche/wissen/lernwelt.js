"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/lernwelt.ts (npm run bauen:ts). */
const Lernwelt = (() => {
    const ANSICHTEN = [
        { id: 'heute', icon: 'today', name: 'Heute' },
        { id: 'lernen', icon: 'cards', name: 'Lernen' },
        { id: 'lernweg', icon: 'compass', name: 'Lernpfad' },
        { id: 'fehler', icon: 'puzzle', name: 'Meine Fehler' },
        { id: 'pruefungen', icon: 'clipboard', name: 'Prüfungen' },
        { id: 'noten', icon: 'medal', name: 'Noten' },
        { id: 'stundenplan', icon: 'calendar', name: 'Stundenplan' },
        { id: 'schule', icon: 'learn', name: 'Schule / Ausbildung' },
        { id: 'uni', icon: 'building', name: 'Uni' },
        { id: 'arbeit', icon: 'briefcase', name: 'Arbeit' },
        { id: 'fortschritt', icon: 'chart', name: 'Fortschritt' },
        { id: 'trainer', icon: 'checkCircle', name: 'Trainer' }
    ];
    const REITER = [
        { id: 'heute', icon: 'today', name: 'Heute' },
        { id: 'lernen', icon: 'cards', name: 'Lernen',
            unter: ['lernen', 'trainer', 'lernweg', 'fehler', 'fortschritt'] },
        { id: 'pruefungen', icon: 'clipboard', name: 'Prüfungen',
            unter: ['pruefungen', 'noten'] },
        { id: 'schule', icon: 'learn', name: 'Wo du lernst',
            unter: ['schule', 'stundenplan', 'uni', 'arbeit'] }
    ];
    const KURZ = { lernen: 'Übersicht' };
    const ansichtName = (id) => KURZ[id] || ANSICHTEN.find(x => x.id === id)?.name || id;
    const gruppeVon = (ansicht) => REITER.find(r => r.id === ansicht || (r.unter || []).includes(ansicht)) || null;
    const zustand = {
        root: null,
        ansicht: 'heute',
        bereichId: 'alle',
        fachId: '',
        themaId: '',
        training: null,
        simulation: null,
        extern: null,
        ladeSchluessel: '',
        generation: 0,
        timer: null,
        notenZeitraum: 'aktuell'
    };
    const esc = (wert) => String(wert ?? '')
        .replace(/[&<>\"]/g, zeichen => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[zeichen] ?? zeichen));
    const kartenText = (wert) => {
        try {
            if (typeof Blocks !== 'undefined' && typeof Blocks.inline === 'function') {
                return Blocks.inline(String(wert ?? ''));
            }
        }
        catch { }
        return esc(wert);
    };
    const zahl = (wert, rueckfall = 0) => {
        const ausgabe = Number(wert);
        return Number.isFinite(ausgabe) ? ausgabe : rueckfall;
    };
    const liste = (wert) => Array.isArray(wert) ? wert : [];
    const objektWerte = (wert) => {
        if (Array.isArray(wert))
            return wert.filter(Boolean);
        if (wert && typeof wert === 'object')
            return Object.values(wert).filter(Boolean);
        return [];
    };
    const textListe = (wert) => {
        if (Array.isArray(wert))
            return wert.map(String).map(text => text.trim()).filter(Boolean);
        const text = String(wert ?? '').trim();
        if (!text)
            return [];
        return text.split(/[,;|\n]/).map(teil => teil.trim()).filter(Boolean);
    };
    const datum = (wert) => {
        if (wert instanceof Date)
            return Number.isFinite(wert.getTime()) ? wert : null;
        const roh = wert && typeof wert === 'object'
            ? wert.start ?? wert.date ?? wert.from
            : wert;
        if (!roh)
            return null;
        const ausgabe = new Date(roh);
        return Number.isFinite(ausgabe.getTime()) ? ausgabe : null;
    };
    const tagesStart = (wert = new Date()) => {
        const ausgabe = new Date(wert);
        ausgabe.setHours(0, 0, 0, 0);
        return ausgabe;
    };
    const tag = (wert) => {
        const d = datum(wert);
        if (!d)
            return '';
        return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'),
            String(d.getDate()).padStart(2, '0')].join('-');
    };
    const datumText = (wert, mitZeit = false) => {
        const d = datum(wert);
        if (!d)
            return 'ohne Termin';
        return d.toLocaleDateString('de-CH', mitZeit
            ? { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
            : { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const relativText = (wert) => {
        const d = datum(wert);
        if (!d)
            return '';
        const minuten = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
        if (minuten < 1)
            return 'gerade eben';
        if (minuten < 60)
            return 'vor ' + minuten + ' Min.';
        if (minuten < 1440)
            return 'vor ' + Math.floor(minuten / 60) + ' Std.';
        return 'vor ' + Math.floor(minuten / 1440) + ' Tagen';
    };
    const tageBis = (wert) => {
        const d = datum(wert);
        if (!d)
            return null;
        const heute = tagesStart();
        const ziel = tagesStart(d);
        return Math.round((ziel.getTime() - heute.getTime()) / 86400000);
    };
    const lebensbereiche = () => {
        const api = window.Lebensbereiche;
        return api && typeof api === 'object' ? api : null;
    };
    const aktor = () => {
        try {
            const api = lebensbereiche();
            const person = api?.lernzustand?.aktuellerAktor?.();
            if (typeof person === 'string' && person) {
                const konto = typeof Konten !== 'undefined' && Konten.aktiv ? Konten.aktiv() : null;
                return { id: person, name: String(konto?.name || 'Ich') };
            }
            if (person?.id)
                return { id: String(person.id), name: String(person.name || 'Ich') };
            const konto = typeof Konten !== 'undefined' && Konten.aktiv ? Konten.aktiv() : null;
            return { id: String(konto?.id || 'lokal'), name: String(konto?.name || 'Ich') };
        }
        catch {
            return { id: 'lokal', name: 'Ich' };
        }
    };
    const metaSchluessel = (name) => 'lernwelt:' + aktor().id + ':' + name;
    const bereiche = () => {
        let roh = [];
        try {
            const api = lebensbereiche();
            if (api && typeof api.auflisten === 'function')
                roh = liste(api.auflisten());
        }
        catch {
            roh = [];
        }
        const normalisiert = roh.map((eintrag) => ({
            id: String(eintrag?.id || ''),
            name: String(eintrag?.name || eintrag?.titel || 'Bereich'),
            icon: String(eintrag?.icon || eintrag?.symbol || '◉'),
            art: String(eintrag?.art || eintrag?.typ || '').toLowerCase()
        })).filter((eintrag) => eintrag.id);
        return [{ id: 'alle', name: 'Alle Bereiche', icon: '◎', art: 'alle' }, ...normalisiert];
    };
    const direkteBereichIds = (record) => {
        if (!record)
            return [];
        try {
            const api = lebensbereiche();
            if (api && typeof api.direkteBereichIds === 'function')
                return textListe(api.direkteBereichIds(record));
        }
        catch { }
        const direkt = record.bereichIds ?? record.lebensbereiche ?? record.bereiche ?? record.bereich;
        return textListe(direkt);
    };
    const seiteVon = (record) => {
        if (!record)
            return null;
        if (record.type === 'page')
            return record;
        if (record.parentTable === 'collection') {
            const ansichten = Object.values(Store.cache.blocks).filter(block => block?.alive !== false && block.type === 'database' && block.collectionId === record.parentId);
            const block = ansichten.find(item => !item.verknuepft) || ansichten[0];
            if (block && typeof Links !== 'undefined' && Links.seiteVon)
                return Links.seiteVon(block.id);
        }
        if (typeof Links !== 'undefined' && Links.seiteVon && record.id)
            return Links.seiteVon(record.id);
        let aktuell = record;
        for (let tiefe = 0; tiefe < 40 && aktuell?.parentId; tiefe++) {
            aktuell = Store.getBlock(aktuell.parentId);
            if (aktuell?.type === 'page')
                return aktuell;
        }
        return null;
    };
    const darfLesen = (record) => {
        if (!record || record.alive === false)
            return false;
        if (typeof Konten === 'undefined' || !Konten.darf)
            return true;
        const seite = seiteVon(record);
        return !!seite && !!Store.getBlock(seite.id) && Konten.darf('lesen', seite.id);
    };
    const imBereich = (record, bereichId = zustand.bereichId) => {
        if (!record || bereichId === 'alle')
            return true;
        if (direkteBereichIds(record).includes(bereichId))
            return true;
        const seite = seiteVon(record);
        return !!seite && seite !== record && direkteBereichIds(seite).includes(bereichId);
    };
    const alleBloecke = () => Object.values(Store.cache.blocks)
        .filter(block => block?.alive !== false && darfLesen(block));
    const lernkartenRoh = () => {
        const ausLearning = typeof Learning !== 'undefined' && Learning.cards ? liste(Learning.cards()) : [];
        return ausLearning.filter(card => imBereich(card));
    };
    const hatExternenLernvertrag = (api) => {
        const lernzustand = api?.lernzustand, vertrag = lernzustand?.VERTRAG;
        return typeof lernzustand?.lesen === 'function' &&
            typeof lernzustand?.schreiben === 'function' &&
            Number(vertrag?.version) >= 2 &&
            vertrag?.speicher === 'store-meta' &&
            vertrag?.inhaltUnveraendert === true;
    };
    const persoenlicherStand = (card) => {
        try {
            const api = lebensbereiche();
            if (api?.lernzustand && typeof api.lernzustand.lesen === 'function')
                return api.lernzustand.lesen(card, aktor().id);
        }
        catch { }
        return {
            version: 1,
            cardId: String(card?.id || ''),
            actorId: aktor().id,
            algorithm: 'sm2',
            sr: card?.sr || null,
            reviewVerlauf: card?.reviewVerlauf || {},
            quelle: card?.sr || card?.reviewVerlauf ? 'legacy' : 'leer',
            updatedAt: String(card?.edited || '')
        };
    };
    const hatLernstand = (sr) => !!sr && typeof sr === 'object' && Object.keys(sr).length > 0;
    const karteMitStand = (card) => {
        const stand = persoenlicherStand(card);
        return {
            ...card,
            sr: hatLernstand(stand?.sr) ? stand.sr : null,
            reviewVerlauf: stand?.reviewVerlauf || {},
        };
    };
    const lernkarten = () => lernkartenRoh().map(karteMitStand);
    const verlauf = (card) => {
        if (typeof Learning !== 'undefined' && Learning.reviewLog)
            return Learning.reviewLog(card);
        return objektWerte(card?.reviewVerlauf)
            .sort((links, rechts) => String(links.at || '').localeCompare(String(rechts.at || '')));
    };
    const bewertung = (eintrag) => {
        const note = Number(eintrag?.rating);
        return Number.isInteger(note) && note >= 1 && note <= 4 ? note : null;
    };
    const istFehler = (eintrag) => eintrag?.correct === false || (bewertung(eintrag) !== null && Number(eintrag.rating) < 3);
    const letzterEintrag = (card) => {
        const eintraege = verlauf(card);
        return eintraege.length ? eintraege[eintraege.length - 1] : null;
    };
    const istLetzterFehler = (card) => {
        const eintrag = letzterEintrag(card);
        return !!eintrag && istFehler(eintrag);
    };
    const themaVon = (card) => {
        const direkt = card?.quiz?.topic ?? card?.lernThema ?? card?.topic ?? card?.thema;
        if (String(direkt || '').trim())
            return String(direkt).trim();
        const quelle = typeof Learning !== 'undefined' && Learning.sourceOf ? Learning.sourceOf(card) : null;
        const seite = quelle?.pageId ? Store.getBlock(quelle.pageId) : seiteVon(card);
        return String(seite?.text || quelle?.label || 'Ohne Thema').trim() || 'Ohne Thema';
    };
    const fachVon = (card) => {
        const direkt = card?.quiz?.subject ?? card?.lernFach ?? card?.fach ?? card?.subject;
        if (String(direkt || '').trim())
            return String(direkt).trim();
        return themaVon(card);
    };
    const kartenTeile = (card) => {
        if (typeof Learning !== 'undefined' && Learning.splitCard)
            return Learning.splitCard(card);
        const text = String(card?.text || '');
        const stelle = text.indexOf('::');
        return stelle >= 0
            ? [text.slice(0, stelle).trim(), text.slice(stelle + 2).trim()]
            : [text, '(noch keine Antwort)'];
    };
    const warteschlange = (neuLimit = 20) => {
        const jetzt = Date.now();
        const alle = lernkarten();
        const neu = alle.filter(card => !card.sr).slice(0, Math.max(0, neuLimit));
        const faellig = alle.filter(card => card.sr &&
            (!card.sr.faellig || (datum(card.sr.faellig)?.getTime() || 0) <= jetzt));
        const fehler = faellig.filter(istLetzterFehler);
        const fehlerIds = new Set(fehler.map(card => card.id));
        const regulaer = faellig.filter(card => !fehlerIds.has(card.id));
        const spaeter = alle.filter(card => card.sr?.faellig &&
            (datum(card.sr.faellig)?.getTime() || 0) > jetzt)
            .sort((a, b) => (datum(a.sr.faellig)?.getTime() || 0) - (datum(b.sr.faellig)?.getTime() || 0));
        return {
            errors: fehler,
            due: regulaer,
            newCards: neu,
            all: [...fehler, ...regulaer, ...neu],
            future: spaeter,
            nextAt: String(spaeter[0]?.sr?.faellig || ''),
            exam: typeof Learning !== 'undefined' && Learning.nextExam ? Learning.nextExam() : null
        };
    };
    const statistik = () => {
        const karten = lernkarten();
        const queue = warteschlange();
        const logs = karten.flatMap(verlauf);
        const heute = tag(new Date());
        const heuteLogs = logs.filter(eintrag => tag(eintrag.at) === heute);
        const benotet = logs.filter(eintrag => bewertung(eintrag) !== null);
        const nochmal = benotet.filter(eintrag => bewertung(eintrag) === 1).length;
        const themen = typeof Learning !== 'undefined' && Learning.topicProgress
            ? Learning.topicProgress(karten)
            : [];
        return {
            total: karten.length,
            learned: karten.filter(card => !!card.sr).length,
            due: queue.errors.length + queue.due.length,
            newCards: karten.filter(card => !card.sr).length,
            mistakes: karten.filter(card => verlauf(card).some(istFehler)).length,
            reviewedToday: heuteLogs.length,
            reviews: logs.length,
            againReviews: nochmal,
            againRate: benotet.length ? Math.round(nochmal / benotet.length * 100) : 0,
            successRate: benotet.length
                ? Math.round(benotet.filter(eintrag => Number(eintrag.rating) >= 3).length / benotet.length * 100)
                : 0,
            nextAt: queue.nextAt,
            topics: themen,
            logs
        };
    };
    const schemaSchluessel = (collection, typ, namen = []) => {
        const schema = collection?.schema || {};
        const keys = Object.keys(schema);
        return keys.find(key => schema[key]?.type === typ &&
            (!namen.length || namen.some(name => String(schema[key]?.name || key).toLowerCase().includes(name))))
            || keys.find(key => schema[key]?.type === typ)
            || '';
    };
    const zeilenWert = (row, collection, key) => {
        if (!key)
            return '';
        if (typeof Datenbank !== 'undefined' && Datenbank.wert) {
            try {
                return Datenbank.wert(row, key, collection);
            }
            catch { }
        }
        return row?.props?.[key];
    };
    const pruefungen = () => {
        const ausgabe = [];
        Object.values(Store.cache.collections).forEach(collection => {
            const name = String(collection?.name || '').toLowerCase();
            if (collection?.schoolKind !== 'exams' && !/prüfung|pruefung|exam|klausur/.test(name))
                return;
            const datumKey = schemaSchluessel(collection, 'date');
            const fachKey = schemaSchluessel(collection, 'relation', ['fach', 'subject', 'modul']);
            const stoffKey = Object.keys(collection.schema || {}).find(key => /lernstoff|umfang|quelle|scope|themen/.test(String(collection.schema[key]?.name || key).toLowerCase())) || '';
            const dauerKey = Object.keys(collection.schema || {}).find(key => collection.schema[key]?.type === 'number' &&
                /dauer|min/.test(String(collection.schema[key]?.name || key).toLowerCase())) || '';
            const statusKey = schemaSchluessel(collection, 'status');
            Store.rowsOf(collection.id).forEach((row) => {
                if (!row || row.alive === false || !darfLesen(row) || !imBereich(row))
                    return;
                const d = datum(zeilenWert(row, collection, datumKey));
                const fachWert = zeilenWert(row, collection, fachKey);
                ausgabe.push({
                    id: String(row.id),
                    collectionId: String(collection.id),
                    titel: String(row.text || row.props?.title || 'Prüfung'),
                    datum: d,
                    tage: d ? tageBis(d) : null,
                    fach: textListe(fachWert).join(', ') || String(fachWert || ''),
                    lernstoff: String(zeilenWert(row, collection, stoffKey) || ''),
                    dauer: Math.max(5, Math.min(240, Math.round(zahl(zeilenWert(row, collection, dauerKey), 30)))),
                    status: String(zeilenWert(row, collection, statusKey) || 'Geplant'),
                    bereichIds: direkteBereichIds(row)
                });
            });
        });
        return ausgabe.sort((a, b) => {
            const aZeit = a.datum?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const bZeit = b.datum?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return aZeit - bZeit || a.titel.localeCompare(b.titel, 'de-CH');
        });
    };
    const aufgaben = () => {
        let roh = [];
        try {
            if (typeof Bibliothek !== 'undefined' && Bibliothek.meineAufgaben)
                roh = liste(Bibliothek.meineAufgaben());
            else if (typeof Plan !== 'undefined' && Plan.aufgaben)
                roh = liste(Plan.aufgaben());
        }
        catch {
            roh = [];
        }
        return roh.filter(item => imBereich(Store.getBlock(item.id) || item)).map(item => ({
            id: String(item.id || item.ref?.id || ''),
            titel: String(item.titel || item.text || 'Aufgabe'),
            datum: String(item.datum?.start || item.datum || ''),
            fertig: !!item.fertig,
            quelle: String(item.coll?.name || item.wo || item.quelle || 'Aufgaben'),
            bereichIds: textListe(item.bereichIds).length
                ? textListe(item.bereichIds)
                : direkteBereichIds(Store.getBlock(item.id) || item)
        })).filter(item => item.id);
    };
    const termine = () => {
        let roh = [];
        try {
            if (typeof App !== 'undefined' && App.kommendeTermine)
                roh = liste(App.kommendeTermine(20));
        }
        catch {
            roh = [];
        }
        return roh.map(item => ({
            id: String(item.id || item.ref?.id || ''),
            titel: String(item.text || item.titel || 'Termin'),
            datum: datum(item.d || item.datum || item.zeit) || new Date(),
            ganztags: item.ganztags !== false,
            quelle: String(item.quelle || 'Kalender'),
            bereichIds: direkteBereichIds(Store.getBlock(item.id) || item)
        })).filter(item => item.id && imBereich(Store.getBlock(item.id) || item))
            .sort((a, b) => a.datum.getTime() - b.datum.getTime());
    };
    const zuletzt = () => {
        let seiten = [];
        try {
            if (typeof App !== 'undefined' && App.kuerzlich)
                seiten = liste(App.kuerzlich());
            else if (typeof Bibliothek !== 'undefined' && Bibliothek.alleSeiten)
                seiten = liste(Bibliothek.alleSeiten()).sort((a, b) => String(b.zuletztGeoeffnet || b.edited || '').localeCompare(String(a.zuletztGeoeffnet || a.edited || '')));
        }
        catch {
            seiten = [];
        }
        return seiten.filter(page => darfLesen(page) && imBereich(page)).slice(0, 8).map(page => ({
            id: String(page.id),
            titel: String(page.text || 'Ohne Titel'),
            icon: String(page.icon || 'page'),
            zeit: String(page.zuletztGeoeffnet || page.edited || page.created || ''),
            untertitel: 'Zuletzt geöffnet',
            bereichIds: direkteBereichIds(page)
        }));
    };
    const projekte = () => {
        const seiten = alleBloecke().filter(block => {
            if (block.type !== 'page' || !imBereich(block))
                return false;
            const marker = [block.systemRole, block.vorlage, block.art, block.kind, ...textListe(block.tags)]
                .join(' ').toLowerCase();
            return !!block.projekt || !!block.project || /projekt|project/.test(marker) ||
                /projekt/.test(String(block.text || '').toLowerCase());
        });
        return seiten.sort((a, b) => String(b.edited || '').localeCompare(String(a.edited || '')))
            .slice(0, 8).map(page => ({
            id: String(page.id),
            titel: String(page.text || 'Projekt'),
            icon: String(page.icon || 'rocket'),
            zeit: String(page.edited || page.created || ''),
            untertitel: String(page.status || 'Laufendes Projekt'),
            bereichIds: direkteBereichIds(page)
        }));
    };
    const pdfs = () => {
        const gesehen = new Set();
        const ausgabe = [];
        alleBloecke().filter(block => block.type === 'pdfseite' && imBereich(block))
            .sort((a, b) => String(b.edited || b.created || '').localeCompare(String(a.edited || a.created || '')))
            .forEach(block => {
            const page = seiteVon(block);
            if (!page || gesehen.has(page.id) || !imBereich(page))
                return;
            gesehen.add(page.id);
            ausgabe.push({
                id: String(page.id),
                titel: String(page.text || 'PDF'),
                icon: 'book',
                zeit: String(page.edited || block.edited || block.created || ''),
                untertitel: 'PDF · Seite ' + String(block.nr || 1),
                bereichIds: direkteBereichIds(page)
            });
        });
        return ausgabe.slice(0, 12);
    };
    const dokumente = () => alleBloecke()
        .filter(block => block.type === 'page' && imBereich(block))
        .sort((a, b) => String(b.edited || '').localeCompare(String(a.edited || '')))
        .slice(0, 16).map(page => ({
        id: String(page.id),
        titel: String(page.text || 'Ohne Titel'),
        icon: String(page.icon || 'page'),
        zeit: String(page.edited || page.created || ''),
        untertitel: page.besprechung ? 'Meeting-Notiz' : 'Dokument',
        bereichIds: direkteBereichIds(page)
    }));
    const externeId = (item) => String(item?.id || item?.ref?.id || item?.pageId || '');
    const externeEintraege = (items, icon, untertitel) => items.map(item => {
        const seite = String(item?.pageId || item?.ref?.pageId || '');
        return {
            id: seite || externeId(item),
            ...(seite ? { pageId: seite } : {}),
            titel: String(item?.titel || item?.text || item?.name || untertitel),
            icon: String(item?.icon || icon),
            zeit: String(item?.zeit || item?.edited || item?.datum || ''),
            untertitel: String(item?.untertitel || item?.quelle || untertitel),
            bereichIds: textListe(item?.bereichIds)
        };
    }).filter(item => item.id);
    const bereichOptionen = () => zustand.bereichId === 'alle'
        ? { limit: 24 }
        : { bereichIds: [zustand.bereichId], limit: 24 };
    const ladeBereichsdaten = () => {
        if (zustand.ansicht === 'trainer')
            return;
        const api = lebensbereiche();
        if (!api)
            return;
        const schluessel = zustand.bereichId + ':' + zustand.ansicht;
        if (zustand.ladeSchluessel === schluessel)
            return;
        zustand.ladeSchluessel = schluessel;
        const generation = ++zustand.generation;
        const aufruf = (name) => {
            try {
                return typeof api[name] === 'function'
                    ? Promise.resolve(api[name](bereichOptionen()))
                    : Promise.resolve(name === 'heute' ? null : []);
            }
            catch {
                return Promise.resolve(name === 'heute' ? null : []);
            }
        };
        if (zustand.ansicht === 'heute' && typeof api.heute === 'function') {
            void aufruf('heute').then(heute => {
                if (generation !== zustand.generation || !zustand.root)
                    return;
                const lernkartenHeute = heute?.lernkarten || {};
                zustand.extern = {
                    heute,
                    aufgaben: [...liste(heute?.aufgabenHeute), ...liste(heute?.aufgabenUeberfaellig)],
                    termine: liste(heute?.termine),
                    zuletzt: liste(heute?.zuletzt),
                    projekte: liste(heute?.projekte),
                    pdfs: liste(heute?.pdfs),
                    lernkarten: [...liste(lernkartenHeute.fehler), ...liste(lernkartenHeute.faellig),
                        ...liste(lernkartenHeute.neu)]
                };
                zeichnen();
            });
            return;
        }
        void Promise.all([
            aufruf('aufgaben'), aufruf('termine'), aufruf('zuletzt'),
            aufruf('projekte'), aufruf('pdfs')
        ]).then(([aufgabenWerte, termineWerte, zuletztWerte, projektWerte, pdfWerte]) => {
            if (generation !== zustand.generation || !zustand.root)
                return;
            zustand.extern = {
                heute: null,
                aufgaben: liste(aufgabenWerte),
                termine: liste(termineWerte),
                zuletzt: liste(zuletztWerte),
                projekte: liste(projektWerte),
                pdfs: liste(pdfWerte),
                lernkarten: []
            };
            zeichnen();
        });
    };
    const tagesziel = () => Math.max(1, Math.min(500, Math.round(zahl(Store.getMeta(metaSchluessel('tagesziel'), 20), 20))));
    const aktivitaet = () => {
        const stats = statistik();
        const logs = liste(stats.logs);
        const tage = new Map();
        const zeiten = [];
        logs.forEach(eintrag => {
            const key = tag(eintrag.at);
            if (key)
                tage.set(key, (tage.get(key) || 0) + 1);
            const t = datum(eintrag.at)?.getTime() || 0;
            if (t > 0)
                zeiten.push(t);
        });
        const tempo = Lerntempo.jeKarte(zeiten, 60);
        const minuten = (logs.length * tempo.sekunden) / 60;
        const heute = tagesStart();
        const wochentag = (heute.getDay() + 6) % 7;
        const wochenstart = new Date(heute);
        wochenstart.setDate(heute.getDate() - wochentag);
        const monatsstart = new Date(heute.getFullYear(), heute.getMonth(), 1);
        const woche = logs.filter(eintrag => (datum(eintrag.at)?.getTime() || 0) >= wochenstart.getTime()).length;
        const monat = logs.filter(eintrag => (datum(eintrag.at)?.getTime() || 0) >= monatsstart.getTime()).length;
        let streak = 0;
        let cursor = new Date(heute);
        if (!tage.has(tag(cursor)))
            cursor.setDate(cursor.getDate() - 1);
        while (tage.has(tag(cursor))) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }
        const xp = logs.length * 10;
        const level = Math.floor(xp / 500) + 1;
        return {
            heute: stats.reviewedToday,
            woche,
            monat,
            minuten: Math.round(minuten),
            tempoSekunden: tempo.sekunden,
            tempoSatz: Lerntempo.satz(tempo),
            streak,
            xp,
            level,
            wochenProzent: Math.min(100, Math.round(woche / (tagesziel() * 7) * 100))
        };
    };
    const eindeutige = (werte, idVon) => {
        const gesehen = new Set();
        return werte.filter(wert => {
            const id = idVon(wert);
            if (!id || gesehen.has(id))
                return false;
            gesehen.add(id);
            return true;
        });
    };
    const sichtbareAufgaben = () => {
        const lokal = aufgaben();
        if (!zustand.extern)
            return lokal;
        const extern = zustand.extern.aufgaben.map((item) => ({
            id: externeId(item),
            titel: String(item?.titel || item?.text || 'Aufgabe'),
            datum: String(item?.faellig?.start || item?.faellig || item?.datum?.start || item?.datum || item?.zeit || ''),
            fertig: !!(item?.fertig || item?.erledigt),
            quelle: String(item?.quelle || item?.collectionName || 'Aufgaben'),
            bereichIds: textListe(item?.bereichIds)
        })).filter(item => item.id);
        return eindeutige([...extern, ...lokal], item => item.id);
    };
    const sichtbareTermine = () => {
        const lokal = termine();
        if (!zustand.extern)
            return lokal;
        const extern = zustand.extern.termine.map((item) => ({
            id: externeId(item),
            titel: String(item?.titel || item?.text || 'Termin'),
            datum: datum(item?.datum || item?.zeit || item?.start) || new Date(),
            ganztags: item?.ganztags === true ||
                /^\d{4}-\d{2}-\d{2}$/.test(String(item?.datum || item?.zeit || item?.start || '').trim()),
            quelle: String(item?.quelle || 'Kalender'),
            bereichIds: textListe(item?.bereichIds)
        })).filter(item => item.id);
        return eindeutige([...extern, ...lokal], item => item.id)
            .sort((a, b) => a.datum.getTime() - b.datum.getTime());
    };
    const sichtbareZuletzt = () => zustand.extern?.zuletzt.length
        ? externeEintraege(zustand.extern.zuletzt, 'page', 'Zuletzt geöffnet').slice(0, 8)
        : zuletzt();
    const sichtbareProjekte = () => zustand.extern?.projekte.length
        ? externeEintraege(zustand.extern.projekte, 'rocket', 'Laufendes Projekt').slice(0, 8)
        : projekte();
    const sichtbarePdfs = () => zustand.extern?.pdfs.length
        ? externeEintraege(zustand.extern.pdfs, 'book', 'PDF').slice(0, 12)
        : pdfs();
    const fortschreibung = (card, note) => {
        const stand = persoenlicherStand(card);
        const sr = { ease: 2.5, intervall: 0, wdh: 0, ...(stand?.sr || card?.sr || {}) };
        const vorher = {
            due: String(sr.faellig || ''),
            interval: zahl(sr.intervall),
            ease: zahl(sr.ease, 2.5),
            repetitions: zahl(sr.wdh)
        };
        if (note < 3) {
            sr.wdh = 0;
            sr.intervall = note === 1 ? 0 : 1;
        }
        else {
            sr.wdh = zahl(sr.wdh) + 1;
            sr.intervall = sr.wdh === 1 ? 1 : sr.wdh === 2 ? 6
                : Math.round(zahl(sr.intervall) * zahl(sr.ease, 2.5));
            sr.ease = Math.max(1.3, zahl(sr.ease, 2.5) + (0.1 - (4 - note) * (0.08 + (4 - note) * 0.02)));
        }
        const faellig = new Date();
        if (sr.intervall === 0)
            faellig.setMinutes(faellig.getMinutes() + 10);
        else
            faellig.setDate(faellig.getDate() + sr.intervall);
        sr.faellig = faellig.toISOString();
        sr.zuletzt = Store.now();
        const alt = Object.fromEntries(verlauf({ reviewVerlauf: stand?.reviewVerlauf || card?.reviewVerlauf || {} })
            .map((eintrag, index) => [String(eintrag.id || 'legacy-' + index), eintrag]));
        const id = typeof Store.uid === 'function'
            ? Store.uid()
            : 'review-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
        alt[id] = {
            id,
            version: 1,
            at: sr.zuletzt,
            rating: note,
            algorithm: 'sm2',
            lapse: note < 3,
            before: vorher,
            after: {
                due: sr.faellig,
                interval: sr.intervall,
                ease: sr.ease,
                repetitions: sr.wdh
            }
        };
        const behalten = Object.values(alt)
            .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')) ||
            String(a.id || '').localeCompare(String(b.id || '')))
            .slice(-500);
        return { sr, reviewVerlauf: Object.fromEntries(behalten.map(eintrag => [String(eintrag.id), eintrag])) };
    };
    const karteBewerten = async (card, note) => {
        const original = Store.getBlock(card?.id);
        if (!original)
            throw new Error('Die Lernkarte ist nicht mehr vorhanden.');
        const api = lebensbereiche();
        if (hatExternenLernvertrag(api)) {
            if (!darfLesen(original))
                throw new Error('Du darfst diese Lernkarte nicht lesen.');
            const neu = fortschreibung(original, note);
            await api.lernzustand.schreiben({ art: 'block', id: String(original.id) }, aktor().id, { sr: neu.sr, reviewVerlauf: neu.reviewVerlauf, algorithm: 'sm2' });
            return;
        }
        if (typeof Learning !== 'undefined' && Learning.canEditCard && !Learning.canEditCard(original))
            throw new Error('Diese Lernkarte ist nur lesbar.');
        WissenDienst.planen(original, note);
    };
    const fehlerListe = () => lernkarten().map(card => {
        const falsche = verlauf(card).filter(istFehler);
        if (!falsche.length)
            return null;
        const letzter = falsche[falsche.length - 1];
        const [frage, antwort] = kartenTeile(card);
        const source = typeof Learning !== 'undefined' && Learning.sourceOf ? Learning.sourceOf(card) : null;
        const quelle = typeof Learning !== 'undefined' && Learning.sourceLabel
            ? Learning.sourceLabel(source)
            : String(source?.label || seiteVon(card)?.text || 'Ohne Quelle');
        const letztesGesamt = letzterEintrag(card);
        return {
            card,
            frage,
            antwort,
            letzteNote: (() => {
                const n = bewertung(letzter);
                return n === null ? 'nicht bewertet'
                    : n + ' von 4' + (n === 1 ? ' (nochmal)' : n === 2 ? ' (schwer)'
                        : n === 3 ? ' (gut)' : ' (leicht)');
            })(),
            fach: fachVon(card),
            thema: themaVon(card),
            quelle,
            anzahl: falsche.length,
            zuletzt: String(letzter?.at || ''),
            naechste: String(card?.sr?.faellig || ''),
            stabil: !!letztesGesamt && !istFehler(letztesGesamt) && zahl(card?.sr?.wdh) >= 2
        };
    }).filter((item) => !!item)
        .sort((a, b) => Number(a.stabil) - Number(b.stabil) ||
        String(b.zuletzt).localeCompare(String(a.zuletzt)));
    const nurPassendeKarten = (pruefung) => {
        const woerter = (pruefung.titel + ' ' + pruefung.fach + ' ' + pruefung.lernstoff)
            .toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(wort => wort.length >= 3);
        if (!woerter.length)
            return [];
        return lernkarten().filter(card => {
            const suchtext = (themaVon(card) + ' ' + fachVon(card) + ' ' +
                String(card.text || '')).toLowerCase();
            return woerter.some(wort => suchtext.includes(wort));
        });
    };
    const aktiverBereich = () => bereiche().find(item => item.id === zustand.bereichId)
        || bereiche()[0]
        || { id: 'alle', name: 'Alle Bereiche', icon: '◎', art: 'alle' };
    const prozent = (wert) => Math.max(0, Math.min(100, Math.round(zahl(wert))));
    const zeichenSpan = (icon, klasse = '') => {
        const reg = globalThis.Register;
        const k = klasse ? ' class="' + klasse + '"' : '';
        return reg?.symbole?.hat?.(icon)
            ? '<span' + k + ' data-sym="' + esc(icon) + '" aria-hidden="true"></span>'
            : '<span' + k + ' aria-hidden="true">' + esc(icon) + '</span>';
    };
    const kennzahl = (wert, name, zusatz = '', merkId = '', herzName = name) => '<article class="stat-karte lw-metrik"' + (merkId ? ' data-lw-kennzahl="' + esc(merkId) + '"' : '') +
        '><strong>' + esc(wert) + '</strong><span>' + esc(name) + '</span>' +
        (zusatz ? '<small>' + esc(zusatz) + '</small>' : '') + (merkId ? merkHerz(merkId, herzName) : '') + '</article>';
    const kennzahlKontext = (vorgabe = {}) => {
        const merk = new Map(Object.entries(vorgabe));
        const einmal = (name, rechnen) => {
            if (!merk.has(name))
                merk.set(name, rechnen());
            return merk.get(name);
        };
        return {
            get queue() { return einmal('queue', () => warteschlange()); },
            get stats() { return einmal('stats', () => statistik()); },
            get spiel() { return einmal('spiel', () => aktivitaet()); },
            get fehler() { return einmal('fehler', () => fehlerListe()); },
            get ziel() { return einmal('ziel', () => tagesziel()); },
            get pruefung() {
                return einmal('pruefung', () => pruefungen().find(item => item.tage === null || item.tage >= 0) || null);
            },
            get stabil() { return einmal('stabil', () => lernkarten().filter(card => zahl(card?.sr?.wdh) >= 2).length); }
        };
    };
    const pruefungTage = (p) => !p ? 'keine geplant'
        : p.tage === 0 ? 'heute' : p.tage === 1 ? 'morgen' : p.tage + ' Tage';
    const KENNZAHLEN = {
        'heute-faellig': { name: 'fällig', allein: 'heute fällige Karten',
            wert: k => String(k.queue.errors.length + k.queue.due.length), zusatz: () => 'heute zu wiederholen' },
        'heute-neu': { name: 'neu', allein: 'neue Karten heute', wert: k => String(k.queue.newCards.length),
            zusatz: () => 'höchstens 20 pro Runde' },
        'heute-fehler': { name: 'Fehler', allein: 'offene Fehler', wert: k => String(k.fehler.filter(item => !item.stabil).length),
            zusatz: () => 'gezielt wiederholen' },
        'naechste-pruefung': { name: 'nächste Prüfung', wert: k => k.pruefung ? pruefungTage(k.pruefung) : '–',
            zusatz: k => k.pruefung ? k.pruefung.titel || '' : 'keine geplant' },
        'lernzeit': { name: 'Lernzeit', wert: k => '~' + k.spiel.minuten + ' Min.', zusatz: k => String(k.spiel.tempoSatz || '') },
        'wochenziel': { name: 'Wochenziel', wert: k => k.spiel.woche + ' / ' + k.ziel * 7 },
        'streak': { name: 'Streak', wert: k => k.spiel.streak + (k.spiel.streak === 1 ? ' Tag' : ' Tage') },
        'aktivitaet': { name: 'Aktivität', wert: k => 'Level ' + k.spiel.level, zusatz: k => k.spiel.xp + ' XP' },
        'faellige-fehler': { name: 'fällige Fehler', wert: k => String(k.queue.errors.length) },
        'faellige-karten': { name: 'fällige Karten', wert: k => String(k.queue.due.length) },
        'neue-karten': { name: 'neue Karten', wert: k => String(k.queue.newCards.length) },
        'naechste-wiederholung': { name: 'nächste Wiederholung',
            wert: k => k.stats.nextAt ? datumText(k.stats.nextAt, true) : '—' },
        'noch-instabil': { name: 'noch instabil', allein: 'Fehler noch instabil', wert: k => String(k.fehler.filter(item => !item.stabil).length) },
        'inzwischen-stabil': { name: 'inzwischen stabil', allein: 'Fehler inzwischen stabil', wert: k => String(k.fehler.filter(item => item.stabil).length) },
        'fehlversuche': { name: 'Fehlversuche', wert: k => String(k.fehler.reduce((summe, item) => summe + item.anzahl, 0)) },
        'stabile-karten': { name: 'stabile Karten', wert: k => k.stabil + ' / ' + k.stats.total },
        'aktuell-faellig': { name: 'aktuell fällig', allein: 'Karten aktuell fällig', wert: k => String(k.stats.due) },
        'themen-mit-fehlern': { name: 'Themen mit Fehlern', wert: k => String(k.stats.mistakes) },
        'naechster-termin': { name: 'nächster Termin', wert: k => k.stats.nextAt ? datumText(k.stats.nextAt, true) : '—' },
        'wiederholungen-woche': { name: 'Wiederholungen diese Woche', wert: k => String(k.spiel.woche) },
        'aktivitaets-xp': { name: 'Aktivitäts-XP', wert: k => String(k.spiel.xp) },
        'level': { name: 'Level', wert: k => String(k.spiel.level) }
    };
    const kennzahlenGemerkt = () => {
        const roh = Store.getMeta(metaSchluessel('kennzahlen'), []);
        return Array.isArray(roh) ? roh.filter((id) => typeof id === 'string') : [];
    };
    const merkHerz = (id, name) => typeof Merkzeichen === 'undefined' ? '' :
        Merkzeichen.html({ an: kennzahlenGemerkt().includes(id), name, form: 'herz',
            klasse: 'lw-kennzahl-merk', zusatz: 'data-lw-merk="' + esc(id) + '"' });
    const merkbar = (id, k, allein = false) => {
        const eintrag = KENNZAHLEN[id];
        if (!eintrag)
            return '';
        const voll = eintrag.allein ?? eintrag.name;
        return kennzahl(eintrag.wert(k), allein ? voll : eintrag.name, eintrag.zusatz ? eintrag.zusatz(k) : '', id, voll);
    };
    const gemerktStreifen = (k) => {
        const ids = kennzahlenGemerkt().filter(id => KENNZAHLEN[id]);
        if (!ids.length)
            return '';
        return '<section class="lw-section lw-gemerkt" aria-labelledby="lw-gemerkt-titel"><header><div>' +
            '<h2 id="lw-gemerkt-titel">Gemerkt</h2><p>Deine Lieblingskennzahlen — das Herz nimmt sie wieder heraus.</p>' +
            '</div></header><div class="lw-metrics">' + ids.map(id => merkbar(id, k, true)).join('') + '</div></section>';
    };
    const gemerktAuffrischen = () => {
        const root = zustand.root;
        if (!root || zustand.ansicht !== 'heute')
            return;
        const alt = root.querySelector('.lw-gemerkt');
        const aktiv = document.activeElement;
        const herzVorher = alt && aktiv instanceof HTMLElement && alt.contains(aktiv)
            ? aktiv.closest('[data-lw-merk]') : null;
        const platz = herzVorher ? [...alt.querySelectorAll('[data-lw-merk]')].indexOf(herzVorher) : -1;
        const html = gemerktStreifen(kennzahlKontext());
        if (alt) {
            if (html)
                alt.outerHTML = html;
            else
                alt.remove();
        }
        else if (html) {
            root.querySelector('.lw-today > .lw-hero')?.insertAdjacentHTML('afterend', html);
        }
        if (!herzVorher)
            return;
        const id = herzVorher.dataset.lwMerk;
        const imStreifen = [...root.querySelectorAll('.lw-gemerkt [data-lw-merk]')];
        let ziel = imStreifen.find(k => k.dataset.lwMerk === id) ||
            imStreifen[Math.min(platz, imStreifen.length - 1)] ||
            [...root.querySelectorAll('[data-lw-merk]')].find(k => k.dataset.lwMerk === id) || null;
        if (!ziel) {
            ziel = root.querySelector('.lw-today > .lw-hero h2');
            if (ziel && !ziel.hasAttribute('tabindex'))
                ziel.setAttribute('tabindex', '-1');
        }
        ziel?.focus({ preventScroll: !!ziel.closest('.lw-gemerkt') });
    };
    const kennzahlMerken = (knopf, id) => {
        const eintrag = KENNZAHLEN[id];
        if (!eintrag || typeof Merkzeichen === 'undefined')
            return;
        const schluessel = metaSchluessel('kennzahlen');
        const voll = eintrag.allein ?? eintrag.name;
        const an = knopf.getAttribute('aria-pressed') !== 'true';
        const stellen = () => [...(zustand.root?.querySelectorAll('[data-lw-merk]') || [])]
            .filter(k => k.dataset.lwMerk === id);
        const zeigen = (wert) => {
            stellen().forEach(k => Merkzeichen.markieren(k, { an: wert, name: voll, form: 'herz' }));
            if (!stellen().includes(knopf))
                Merkzeichen.markieren(knopf, { an: wert, name: voll, form: 'herz' });
        };
        zeigen(an);
        let schreiben;
        try {
            schreiben = Store.metaListeAendern(schluessel, (liste) => {
                const ohne = liste.filter(x => x !== id);
                return an ? [...ohne, id] : ohne;
            });
        }
        catch (err) {
            schreiben = Promise.reject(err);
        }
        gemerktAuffrischen();
        schreiben.catch(() => {
            try {
                Store.metaListeAendern(schluessel, (liste) => {
                    const ohne = liste.filter(x => x !== id);
                    return an ? ohne : [...ohne, id];
                }).catch(() => { });
            }
            catch { }
            zeigen(!an);
            gemerktAuffrischen();
            UI.toast('Die Kennzahl „' + voll + '" konnte nicht gemerkt werden.');
        });
    };
    const fortschritt = (wert, label) => '<div class="lw-progress"><div><span>' + esc(label) + '</span><strong>' + prozent(wert) +
        ' %</strong></div><progress max="100" value="' + prozent(wert) + '" aria-label="' +
        esc(label) + '">' + prozent(wert) + ' %</progress></div>';
    const leer = (icon, titel, text, aktion = '', label = '') => '<div class="lw-leer leer-zustand">' + zeichenSpan(icon, 'lw-leer-icon leer-zeichen') +
        '<h3>' + esc(titel) + '</h3><p>' + esc(text) + '</p>' +
        (aktion && label ? '<button type="button" data-lw-action="' + esc(aktion) + '">' + esc(label) + '</button>' : '') +
        '</div>';
    const mehrAls = (gesamt, gezeigt) => gesamt > gezeigt ? gezeigt + ' von ' + gesamt : '';
    const sektion = (titel, inhalt, zusatz = '') => '<section class="lw-section"><header><div><h2>' + esc(titel) + '</h2>' +
        (zusatz ? '<p>' + esc(zusatz) + '</p>' : '') + '</div></header>' + inhalt + '</section>';
    const vorschau = (seiteId, titel = '', laenge = 90) => Vorschau.anriss(seiteId, titel, laenge);
    const miniatur = (seiteId, zeilen = 5) => Vorschau.miniatur(seiteId, zeilen);
    const weiterKarte = (item) => {
        const bild = miniatur(item.pageId || item.id);
        return '<button type="button" class="lw-continue-card hebt" data-lw-open="' + esc(item.id) + '">' +
            '<span class="lw-mini mini-zeilen' + (bild ? '' : ' is-leer') + '">' +
            (bild || '<span>Diese Seite ist noch leer.</span>') + '</span>' +
            '<span class="lw-continue-foot">' + zeichenSpan(item.icon, 'lw-object-icon') +
            '<span><strong>' + esc(item.titel) + '</strong><small>' + esc(item.untertitel) +
            (item.zeit ? ' · ' + esc(relativText(item.zeit)) : '') + '</small></span></span>' +
            '</button>';
    };
    const eintragListe = (werte, leerText) => werte.length
        ? '<ul class="lw-object-list">' + werte.map(item => {
            const seite = item.pageId || item.id;
            const anriss = vorschau(seite, item.titel);
            return '<li><button type="button" data-lw-open="' + esc(item.id) + '">' +
                zeichenSpan(item.icon, 'lw-object-icon') +
                '<span><strong>' + esc(item.titel) + '</strong><small>' +
                esc(anriss || item.untertitel) + '</small></span>' +
                (item.zeit ? '<time datetime="' + esc(item.zeit) + '">' +
                    esc(relativText(item.zeit)) + '</time>' : '') +
                '</button></li>';
        }).join('') + '</ul>'
        : '<p class="lw-none">' + esc(leerText) + '</p>';
    const aufgabenListe = (werte, leerText) => werte.length
        ? '<ul class="lw-task-list">' + werte.map(item => '<li><button type="button" data-lw-open="' + esc(item.id) + '">' +
            zeichenSpan(item.fertig ? 'boxChecked' : 'box', 'lw-task-box') +
            '<span><strong>' + esc(item.titel) + '</strong><small>' +
            esc(item.quelle) + (item.datum ? ' · ' + esc(datumText(item.datum)) : '') +
            '</small></span></button></li>').join('') + '</ul>'
        : '<p class="lw-none">' + esc(leerText) + '</p>';
    const terminListe = (werte, leerText) => werte.length
        ? '<ul class="lw-event-list">' + werte.map(item => '<li><button type="button" data-lw-open="' + esc(item.id) + '"><time datetime="' +
            esc(item.ganztags ? item.datum.toISOString().slice(0, 10) : item.datum.toISOString()) +
            '"' + (item.ganztags ? ' class="lw-ganztags"' : '') + '>' +
            esc(item.ganztags
                ? item.datum.toLocaleDateString('de-CH', { weekday: 'short' })
                : item.datum.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })) +
            '</time><span><strong>' + esc(item.titel) + '</strong><small>' + esc(item.quelle) +
            ' · ' + esc(datumText(item.datum)) + '</small></span></button></li>').join('') + '</ul>'
        : '<p class="lw-none">' + esc(leerText) + '</p>';
    const themenListe = (themen, limit = 8) => themen.length
        ? '<div class="lw-topic-list">' + themen.slice(0, limit).map(thema => '<button type="button" data-lw-topic="' + esc(thema.id) + '"><span><strong>' +
            esc(thema.label) + '</strong><small>' + esc(thema.stable + ' stabil · ' + thema.due +
            ' fällig' + (thema.errors ? ' · ' + thema.errors + ' Fehler' : '')) + '</small></span>' +
            '<span class="lw-topic-score">' + prozent(thema.progress) + ' %</span><progress max="100" value="' +
            prozent(thema.progress) + '" aria-label="Fortschritt ' + esc(thema.label) + '"></progress></button>')
            .join('') + '</div>'
        : leer('cards', 'Noch keine Themen', 'Themen entstehen automatisch aus deinen Lernkarten.', 'capture', 'Lernmaterial erfassen');
    const kopf = () => {
        const optionen = bereiche();
        const aktiv = aktiverBereich();
        return '<header class="lw-head">' +
            '<div class="lw-brand"><span class="lw-brand-icon" data-sym="learn" aria-hidden="true"></span><div>' +
            '<p>Redion</p><h1>Lernen &amp; Alltag</h1></div></div>' +
            '<label class="lw-area" data-alle="' + (aktiv.id === 'alle' ? 'ja' : 'nein') +
            '"><span>Bereich</span><select data-lw-area aria-label="Lebensbereich auswählen">' +
            optionen.map(item => '<option value="' + esc(item.id) + '"' +
                (item.id === aktiv.id ? ' selected' : '') + '>' + esc(item.icon + ' ' + item.name) + '</option>').join('') +
            '</select></label></header>' +
            (() => {
                const bekannt = new Set(REITER.flatMap(r => [r.id, ...(r.unter || [])]));
                const zusatz = ANSICHTEN.filter(a => !bekannt.has(a.id))
                    .map(a => ({ id: a.id, icon: a.icon, name: a.name }));
                const reihe = [...REITER, ...zusatz];
                const hier = gruppeVon(zustand.ansicht);
                const haupt = '<nav class="lw-nav" data-kopfzeile="eigene" data-material="heute" aria-label="Lernen und Alltag">' + reihe.map(item => {
                    const drin = item.id === zustand.ansicht ||
                        (item.unter || []).includes(zustand.ansicht);
                    return '<button type="button" data-lw-nav="' +
                        (item.unter ? item.unter[0] : item.id) + '"' +
                        (drin ? ' aria-current="page" class="is-active"' : '') + '>' +
                        '<span data-sym="' + esc(item.icon) + '"></span><span>' + esc(item.name) + '</span>' +
                        (item.unter
                            ? '<span class="lw-nav-mehr" data-sym="chevronD" aria-hidden="true"></span>' : '') +
                        '</button>';
                }).join('') + '</nav>';
                if (!hier?.unter)
                    return haupt;
                return haupt + '<nav class="lw-subnav" data-material="heute-unter" aria-label="' + esc(hier.name) + '">' +
                    hier.unter.map(id => '<button type="button" data-lw-nav="' + esc(id) + '"' +
                        (zustand.ansicht === id ? ' aria-current="page" class="is-active"' : '') + '>' +
                        esc(ansichtName(id)) + '</button>').join('') + '</nav>';
            })();
    };
    const dokumentEinstieg = () => {
        const pdf = sichtbarePdfs()[0];
        const zuletzt = pdf || sichtbareZuletzt()[0];
        const seitenId = zuletzt?.pageId || zuletzt?.id || '';
        const ausschnitt = seitenId ? miniatur(seitenId, 4) : '';
        const darfImportieren = typeof Konten === 'undefined' || Konten.darf('bearbeiten');
        const importVerfuegbar = typeof Bibliothek !== 'undefined' && !!Bibliothek.pdfImportieren;
        return '<section class="lw-desk" aria-label="Dein Dokumentenstudio">' +
            '<div class="lw-desk-copy"><p class="lw-eyebrow">DEIN PLATZ FÜR IDEEN</p>' +
            '<h2><span class="ru-held-zeile" data-zeile="Aufmachen.">Aufmachen.</span><br>' +
            '<span class="ru-held-zeile" data-zeile="Weiterdenken.">Weiterdenken.</span></h2>' +
            '<p>Deine PDFs, Notizen und Unterlagen. Ein Griff — und du bist mittendrin.</p>' +
            '<div class="lw-actions">' +
            (pdf
                ? '<button type="button" class="lw-desk-auf" data-lw-open="' + esc(seitenId) + '">' +
                    zeichenSpan('book') + 'PDF öffnen</button>'
                : '<button type="button" class="lw-desk-auf" data-lw-action="library">' +
                    zeichenSpan('library') + 'Dokumente öffnen</button>') +
            '<button type="button" data-lw-action="import"' +
            (darfImportieren && importVerfuegbar ? '' : ' disabled title="' +
                (darfImportieren ? 'Der Dateiimport ist hier nicht verfügbar.' : 'Du benötigst Bearbeitungsrechte, um Dateien hinzuzufügen.') + '"') +
            '>' + zeichenSpan('plus') + 'PDF importieren</button></div>' +
            (pdf ? '<button type="button" class="lw-desk-link" data-lw-action="library">Alle Dokumente ansehen →</button>' : '') +
            '</div><button type="button" class="lw-paper-stack" ' +
            (zuletzt ? 'data-lw-open="' + esc(seitenId) + '" aria-label="' + esc(zuletzt.titel) + ' öffnen"'
                : 'data-lw-action="library" aria-label="Deine Dokumente öffnen"') + '>' +
            '<span class="lw-paper-sheet"><span class="lw-paper-cap">' + zeichenSpan(pdf ? 'book' : 'page') +
            '<span>' + (pdf ? 'PDF · WEITERLESEN' : 'DEINE DOKUMENTE') + '</span></span>' +
            '<strong>' + esc(zuletzt?.titel || 'Platz für deine Gedanken') + '</strong>' +
            '<span class="lw-paper-preview mini-zeilen">' +
            (ausschnitt || '<span class="lw-paper-message">' + (zuletzt
                ? 'Öffnen, lesen und direkt weiterarbeiten.'
                : 'Sammle deine Unterlagen. Halte fest, was dir wichtig ist.') + '</span>') + '</span>' +
            '<span class="lw-paper-foot">' + (zuletzt ? 'Weiterarbeiten' : 'Loslegen') + '<span aria-hidden="true">↗</span></span>' +
            '</span></button></section>';
    };
    const heuteAnsicht = () => {
        const queue = warteschlange();
        const stats = statistik();
        const spiel = aktivitaet();
        const ziel = tagesziel();
        const zielProzent = ziel ? Math.min(100, Math.round(stats.reviewedToday / ziel * 100)) : 0;
        const stunde = new Date().getHours();
        const gruss = stunde < 11 ? 'Guten Morgen' : stunde < 17 ? 'Guten Tag' : 'Guten Abend';
        const heute = tagesStart();
        const morgen = new Date(heute);
        morgen.setDate(morgen.getDate() + 1);
        const alleAufgaben = sichtbareAufgaben().filter(item => !item.fertig);
        const heutigeAufgaben = alleAufgaben.filter(item => datum(item.datum) &&
            (datum(item.datum)?.getTime() || 0) >= heute.getTime() &&
            (datum(item.datum)?.getTime() || 0) < morgen.getTime());
        const ueberfaellige = alleAufgaben.filter(item => datum(item.datum) &&
            (datum(item.datum)?.getTime() || 0) < heute.getTime());
        const heutigeTermine = sichtbareTermine().filter(item => item.datum.getTime() >= heute.getTime() && item.datum.getTime() < morgen.getTime()).slice(0, 6);
        const alleZuletzt = sichtbareZuletzt();
        const weiterKarten = alleZuletzt.slice(0, 3);
        const alleProjekte = sichtbareProjekte();
        const projekteGezeigt = alleProjekte.slice(0, 5);
        const naechstePruefung = pruefungen().find(item => item.tage === null || item.tage >= 0) || null;
        const pruefungText = pruefungTage(naechstePruefung);
        const ktx = kennzahlKontext({ queue, stats, spiel });
        return '<div class="lw-today">' +
            '<section class="lw-hero lw-hero-compact"><div><p>' +
            esc(new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })) +
            '</p><h2>' + esc(aktor().name && aktor().name !== 'Ich' ? gruss + ', ' + aktor().name : gruss) +
            '.</h2></div><div class="lw-goal"><button type="button" data-lw-action="goal" aria-label="Tagesziel ändern">' +
            '<span>' + stats.reviewedToday + ' / ' + ziel + '</span><small>Lernziel heute</small></button>' +
            '<progress max="100" value="' + zielProzent + '" aria-label="Tagesfortschritt"></progress></div></section>' +
            gemerktStreifen(ktx) +
            dokumentEinstieg() +
            '<section class="lw-next-step" aria-label="Dein nächster Lernschritt">' +
            zeichenSpan('cards', 'lw-next-icon') + '<div><p>Ein guter nächster Schritt</p><h2>' +
            (queue.all.length ? queue.all.length + (queue.all.length === 1 ? ' Karte für heute' : ' Karten für heute')
                : stats.total ? 'Deine Wiederholungen sind erledigt' : 'Aus Wissen wird Können') +
            '</h2><span>' + (queue.all.length
            ? 'Fehler festigen, Bekanntes wiederholen, Neues entdecken.'
            : stats.total ? 'Du kannst deine Themen vertiefen oder neue Karten anlegen.'
                : 'Erstelle deine erste Lernkarte aus deinen Unterlagen.') + '</span></div>' +
            '<div class="lw-actions">' +
            (queue.all.length ? '<button type="button" class="is-primary" data-lw-train="today">Lernen starten →</button>'
                : '<button type="button" class="is-primary" data-lw-nav="lernen">Lernen öffnen →</button>') +
            '<button type="button" data-lw-nav="lernen">Lernplan ansehen</button></div></section>' +
            (weiterKarten.length
                ? '<section class="lw-continue"><header><div><h2>Zuletzt auf deinem Schreibtisch</h2>' +
                    '<p>Genau dort weiter, wo du aufgehört hast.</p></div>' +
                    '<button type="button" data-lw-action="library">Alle Dokumente</button>' +
                    '</header><div class="lw-continue-grid">' + weiterKarten.map(weiterKarte).join('') + '</div></section>'
                : '') +
            '<div class="lw-dashboard-grid lw-day-plan">' +
            sektion('Deine Aufgaben', aufgabenListe([...ueberfaellige, ...heutigeAufgaben].slice(0, 6), 'Für heute ist alles erledigt.'), mehrAls(ueberfaellige.length + heutigeAufgaben.length, 6)) +
            sektion('Dein Tag', terminListe(heutigeTermine, 'Heute ist Raum für deine eigenen Pläne.')) +
            '</div>' +
            '<div class="lw-quick" aria-label="Schnellzugriff">' +
            '<button type="button" data-lw-action="tasks">' + zeichenSpan('tasks') + 'Alle Aufgaben</button>' +
            '<button type="button" data-lw-action="calendar">' + zeichenSpan('calendar') + 'Kalender</button>' +
            '<button type="button" data-lw-action="library">' + zeichenSpan('library') + 'Dokumente</button>' +
            '<button type="button" data-lw-action="capture">' + zeichenSpan('camera') + 'Scannen</button>' +
            '</div>' +
            '<details class="lw-insights" data-lw-details="today-insights"><summary><span>' +
            zeichenSpan('chart') + '<span>Lernübersicht &amp; Fortschritt<small>Prüfungen, Themen, Projekte und deine Lernroutine</small></span>' +
            '</span><span class="lw-details-chevron" aria-hidden="true">⌄</span></summary><div class="lw-insights-body">' +
            '<section class="lw-metrics" aria-label="Heute auf einen Blick">' +
            merkbar('heute-faellig', ktx) + merkbar('heute-neu', ktx) + merkbar('heute-fehler', ktx) +
            merkbar('naechste-pruefung', ktx) + '</section>' +
            '<section class="lw-exam-card"><header><p>Nächste Prüfung</p>' +
            '<span class="lw-card-icon" data-sym="clipboard" aria-hidden="true"></span></header>' +
            (naechstePruefung
                ? '<h2>' + esc(naechstePruefung.titel) + '</h2><strong>' + esc(pruefungText) + '</strong><p>' +
                    esc(naechstePruefung.fach || naechstePruefung.lernstoff || 'Lernstoff noch nicht zugeordnet') +
                    '</p><button type="button" data-lw-exam="' + esc(naechstePruefung.id) + '">Vorbereitung öffnen</button>'
                : leer('calendar', 'Keine Prüfung geplant', 'Lege einen Termin in deiner Prüfungsdatenbank an.', 'school-setup', 'Prüfungen öffnen')) + '</section>' +
            '<div class="lw-dashboard-grid">' +
            sektion('Themenfortschritt', themenListe(liste(stats.topics), 5), 'Was du schon sicher beherrschst') +
            sektion('Laufende Projekte', eintragListe(projekteGezeigt, 'Noch kein Projekt zugeordnet.'), mehrAls(alleProjekte.length, 5)) +
            '</div>' +
            '<section class="lw-engagement"><header><div><p>Aktivität</p><h2>Deine Lernroutine</h2></div>' +
            '<span>Getrennt vom Wissensstand</span></header><div class="lw-metrics">' +
            merkbar('lernzeit', ktx) + merkbar('wochenziel', ktx) + merkbar('streak', ktx) +
            merkbar('aktivitaet', ktx) +
            '</div>' + fortschritt(spiel.wochenProzent, 'Wochenfortschritt') + '</section>' +
            '</div></details></div>';
    };
    const verlaufsTage = (logs, anzahl) => {
        const heute = tagesStart();
        return Array.from({ length: anzahl }, (_, index) => {
            const d = new Date(heute);
            d.setDate(heute.getDate() - (anzahl - index - 1));
            const key = tag(d);
            return { tag: d, anzahl: logs.filter(eintrag => tag(eintrag.at) === key).length };
        });
    };
    const historie = (logs, tage = 7) => {
        const werte = verlaufsTage(logs, tage);
        const maximum = Math.max(1, ...werte.map(item => item.anzahl));
        const summe = werte.reduce((alle, item) => alle + item.anzahl, 0);
        const wort = (n) => n === 1 ? 'Wiederholung' : 'Wiederholungen';
        const wochentag = (d) => d.toLocaleDateString('de-CH', { weekday: 'short' }).replace(/\.$/, '');
        return '<div class="lw-history lw-verlauf" role="group" aria-label="Lernhistorie der letzten ' + tage + ' Tage"' +
            ' data-lw-tage="' + tage + '">' +
            '<div class="lw-verlauf-kopf"><strong class="lw-verlauf-summe" data-lw-ziel="' + summe + '">' + summe + '</strong>' +
            '<span>' + wort(summe) + ' in ' + tage + ' Tagen</span></div>' +
            '<div class="lw-verlauf-flaeche">' +
            '<span class="lw-verlauf-material" aria-hidden="true"></span>' +
            '<span class="lw-verlauf-tipp" aria-hidden="true" hidden><span></span></span>' +
            werte.map((item, index) => {
                const name = wochentag(item.tag);
                const tipp = (tage > 7 ? name + ' ' + item.tag.getDate() + '.' + (item.tag.getMonth() + 1) + '.' : name) +
                    ' · ' + item.anzahl + ' ' + wort(item.anzahl);
                return '<button type="button" class="lw-verlauf-tag" data-lw-tag="' + index + '" data-lw-anzahl="' + item.anzahl +
                    '" data-lw-max="' + maximum + '" data-lw-tipp="' + esc(tipp) + '" aria-pressed="false"' +
                    ' tabindex="' + (index === werte.length - 1 ? '0' : '-1') + '"' +
                    ' aria-label="' + esc(item.tag.toLocaleDateString('de-CH')) + ': ' + item.anzahl + ' ' + wort(item.anzahl) + '">' +
                    '<span class="lw-verlauf-zahl" aria-hidden="true">' + item.anzahl + '</span>' +
                    '<span class="lw-verlauf-saeule" aria-hidden="true"><i></i></span>' +
                    '<small aria-hidden="true">' + esc(name) + '</small></button>';
            }).join('') + '</div></div>';
    };
    const wenigBewegung = () => typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung
        ? AppEinstellung.wenigBewegung() : document.body?.dataset['bewegung'] === 'ruhig';
    const hochzaehlen = (el, seit = 0) => {
        if (!el)
            return;
        const ziel = Number(el.dataset['lwZiel']) || 0;
        if (!ziel || wenigBewegung()) {
            el.textContent = String(ziel);
            return;
        }
        let beginn = -1;
        const DAUER = 1000;
        const wert = (t) => t >= 1 ? ziel : Math.min(ziel, Math.round(ziel * (1 - Math.exp(-7 * t))));
        el.textContent = String(wert(Math.max(0, Math.min(1, seit / DAUER))));
        if (seit >= DAUER)
            return;
        const schritt = (jetzt) => {
            if (!el.isConnected)
                return;
            if (beginn < 0)
                beginn = jetzt - seit;
            const t = Math.max(0, Math.min(1, (jetzt - beginn) / DAUER));
            el.textContent = String(wert(t));
            if (t < 1)
                requestAnimationFrame(schritt);
        };
        requestAnimationFrame(schritt);
    };
    const belebtAm = new Map();
    const ANKOMMEN_MS = 1500;
    const seitDemAnkommen = (schluessel) => {
        const jetzt = performance.now();
        const vorher = belebtAm.get(schluessel);
        if (vorher !== undefined && jetzt - vorher < ANKOMMEN_MS)
            return jetzt - vorher;
        belebtAm.set(schluessel, jetzt);
        return 0;
    };
    const verlaufBeleben = (wurzel, ansicht = '') => {
        wurzel.querySelectorAll('.lw-verlauf').forEach(karte => {
            if (karte.dataset['lwLebt'])
                return;
            karte.dataset['lwLebt'] = '1';
            const summe = karte.querySelector('.lw-verlauf-summe');
            const seit = seitDemAnkommen(ansicht + ':' + (karte.dataset['lwTage'] || '') + ':' + (summe?.dataset['lwZiel'] || ''));
            if (seit) {
                karte.style.setProperty('--lw-seit', Math.round(seit) + 'ms');
                karte.closest('.lw-section')?.style.setProperty('--lw-seit', Math.round(seit) + 'ms');
            }
            const flaeche = karte.querySelector('.lw-verlauf-flaeche');
            const material = karte.querySelector('.lw-verlauf-material');
            const tipp = karte.querySelector('.lw-verlauf-tipp');
            const tippText = tipp?.querySelector('span');
            const tage = Array.from(karte.querySelectorAll('button[data-lw-tag]'));
            if (!flaeche || !material || !tipp || !tippText || !tage.length)
                return;
            tage.forEach((knopf, index) => {
                const anzahl = Number(knopf.dataset['lwAnzahl']) || 0;
                const hoechst = Number(knopf.dataset['lwMax']) || 1;
                knopf.style.setProperty('--lw-anteil', String(anzahl / hoechst));
                knopf.style.setProperty('--lw-index', String(index));
            });
            hochzaehlen(summe, seit);
            let gewaehlt = -1;
            const setzeX = (el, x, nachbar, sofort) => {
                if (typeof SelectionFlow !== 'undefined')
                    SelectionFlow.folge(el, x, nachbar, sofort);
                else
                    el.style.transform = 'translateX(' + x + 'px)';
            };
            const waehle = (index, fokus) => {
                const vorher = gewaehlt;
                gewaehlt = index;
                tage.forEach((knopf, i) => {
                    knopf.setAttribute('aria-pressed', String(i === index));
                    knopf.tabIndex = (index < 0 ? i === tage.length - 1 : i === index) ? 0 : -1;
                });
                if (index < 0) {
                    tipp.hidden = true;
                    material.classList.remove('an');
                    return;
                }
                const knopf = tage[index];
                if (!knopf)
                    return;
                if (fokus)
                    knopf.focus({ preventScroll: true });
                const erste = tage[0]?.offsetTop ?? 0;
                const zeile = knopf.offsetTop - erste;
                const sofort = vorher < 0 || (tage[vorher]?.offsetTop ?? erste) !== knopf.offsetTop;
                material.style.translate = zeile ? '0 ' + zeile + 'px' : '';
                material.style.bottom = 'auto';
                material.style.height = (erste + knopf.offsetHeight - material.offsetTop) + 'px';
                tipp.style.translate = zeile ? '0 ' + zeile + 'px' : '';
                material.style.width = knopf.offsetWidth + 'px';
                setzeX(material, knopf.offsetLeft, Math.abs(index - vorher) === 1, sofort);
                material.classList.add('an');
                tippText.textContent = knopf.dataset['lwTipp'] || '';
                tipp.hidden = false;
                const breite = tipp.offsetWidth;
                const mitte = knopf.offsetLeft + knopf.offsetWidth / 2;
                setzeX(tipp, Math.max(0, Math.min(flaeche.clientWidth - breite, mitte - breite / 2)), false, sofort);
                if (sofort && !wenigBewegung() && typeof RedionSpring !== 'undefined') {
                    const feder = RedionSpring.token('snappy');
                    if (feder.duration > 1)
                        tippText.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: feder.duration, easing: feder.easing });
                }
            };
            karte.addEventListener('click', event => {
                const knopf = event.target.closest('button[data-lw-tag]');
                if (!knopf || !karte.contains(knopf))
                    return;
                const index = Number(knopf.dataset['lwTag']);
                waehle(index === gewaehlt ? -1 : index, false);
            });
            karte.addEventListener('keydown', event => {
                const knopf = event.target.closest('button[data-lw-tag]');
                if (!knopf)
                    return;
                const jetzt = Number(knopf.dataset['lwTag']);
                const proZeile = tage.filter(k => k.offsetTop === tage[0]?.offsetTop).length || tage.length;
                const ziel = event.key === 'ArrowRight' ? Math.min(tage.length - 1, jetzt + 1)
                    : event.key === 'ArrowLeft' ? Math.max(0, jetzt - 1)
                        : event.key === 'ArrowUp' && jetzt - proZeile >= 0 ? jetzt - proZeile
                            : event.key === 'ArrowDown' && jetzt + proZeile < tage.length ? jetzt + proZeile
                                : event.key === 'Home' ? 0 : event.key === 'End' ? tage.length - 1 : -2;
                if (ziel === -2)
                    return;
                event.preventDefault();
                waehle(ziel, true);
            });
        });
    };
    const kartenArt = (card) => {
        const text = String(card?.text || '');
        if (/\{\{[^{}]+\}\}/.test(text))
            return 'Lückentext';
        const source = typeof Learning !== 'undefined' && Learning.sourceOf ? Learning.sourceOf(card) : null;
        if (source?.kind === 'pdfseite' && source?.region)
            return 'PDF-Auswahl';
        if (source?.kind === 'pdfseite')
            return 'PDF-Karte';
        if (card?.quiz?.kind === 'calculation' || card?.rechenkarte)
            return 'Rechenkarte';
        return 'Frage / Antwort';
    };
    const lernzentrumAnsicht = () => {
        if (zustand.training)
            return trainingAnsicht();
        const queue = warteschlange();
        const stats = statistik();
        const artZaehler = new Map();
        lernkarten().forEach(card => artZaehler.set(kartenArt(card), (artZaehler.get(kartenArt(card)) || 0) + 1));
        const fokus = liste(stats.topics).find(item => item.id === zustand.themaId);
        const ktx = kennzahlKontext({ queue, stats });
        return '<div class="lw-learning">' +
            '<header class="lw-page-head"><div><p>Lernzentrale</p><h2>' +
            (fokus ? esc(fokus.label) : 'Dein erklärbarer Lernplan') + '</h2><span>SM-2 bleibt der fachliche Plan. Es gibt keine stille Migration.</span></div>' +
            '<button type="button" data-lw-action="learning-classic">Klassische Lernansicht</button></header>' +
            '<section class="lw-metrics">' +
            merkbar('faellige-fehler', ktx) + merkbar('faellige-karten', ktx) + merkbar('neue-karten', ktx) +
            merkbar('naechste-wiederholung', ktx) +
            '</section>' +
            '<div class="lw-study-actions">' +
            '<article>' + zeichenSpan('sun') + '<h3>Tagesrunde</h3><p>Fehler → fällig → bis zu 20 neue Karten.</p>' +
            '<button type="button" class="is-primary" data-lw-train="today"' +
            (queue.all.length ? '' : ' disabled') + '>Starten · ' + queue.all.length + '</button></article>' +
            '<article>' + zeichenSpan('puzzle') + '<h3>Fehlertraining</h3><p>Alle instabilen Fehler gezielt festigen.</p>' +
            '<button type="button" data-lw-train="errors"' +
            (fehlerListe().some(item => !item.stabil) ? '' : ' disabled') + '>Trainieren · ' +
            fehlerListe().filter(item => !item.stabil).length + '</button></article>' +
            '<article>' + zeichenSpan('sparkle') + '<h3>Neue Karten</h3><p>Neue Inhalte ohne fällige Karten üben.</p>' +
            '<button type="button" data-lw-train="new"' +
            (queue.newCards.length ? '' : ' disabled') + '>Lernen · ' + queue.newCards.length + '</button></article>' +
            (() => {
                const naechste = pruefungen().find(item => item.tage !== null && item.tage >= 0)
                    || pruefungen().find(item => item.tage === null) || null;
                const passend = naechste ? nurPassendeKarten(naechste) : [];
                return '<article>' + zeichenSpan('clipboard') + '<h3>Prüfungsfokus</h3><p>' +
                    (naechste
                        ? esc('Karten passend zu „' + naechste.titel + '" mischen.')
                        : 'Sobald eine Prüfung eingetragen ist, wird hier gezielt geübt.') +
                    '</p>' +
                    (passend.length
                        ? '<button type="button" data-lw-train="exam">Üben · ' + passend.length + '</button>'
                        : '<button type="button" data-lw-nav="pruefungen">Prüfungen öffnen</button>') +
                    '</article>';
            })() +
            (() => {
                const anzahl = typeof Trainer !== 'undefined' ? Trainer.karten().length : 0;
                return '<article class="lw-trainer-kachel">' + zeichenSpan('checkCircle') + '<h3>Trainer</h3>' +
                    '<p>Boxen, Multiple Choice, Schreiben und Lücken — Kapitel für Kapitel, jede Karte eine Lernkarte.</p>' +
                    '<button type="button" data-lw-nav="trainer">' + (anzahl ? 'Üben · ' + anzahl : 'Kapitel anlegen') + '</button></article>';
            })() +
            '</div>' +
            '<div class="lw-dashboard-grid">' +
            sektion('Warum diese Reihenfolge?', '<ol class="lw-explanation"><li><strong>Fehler zuerst</strong><span>Unsichere Inhalte bekommen unmittelbar Aufmerksamkeit.</span></li>' +
                '<li><strong>Fälligkeit danach</strong><span>Der gespeicherte Termin ' +
                'bestimmt den Zeitpunkt — gerechnet nach ' +
                (String(Store.getMeta('lernVerfahren', 'sm2')) === 'fsrs'
                    ? 'FSRS' : 'SM-2') + '.</span></li>' +
                '<li><strong>Neues zum Schluss</strong><span>So verdrängen neue Karten keine Wiederholung.</span></li></ol>', 'Planung bleibt nachvollziehbar') +
            sektion('Letzte 7 Tage', historie(liste(stats.logs), 7), stats.reviewedToday + ' Wiederholungen heute') +
            sektion('Kartenarten', '<dl class="lw-card-types">' + [...artZaehler.entries()].map(([art, anzahl]) => '<div><dt>' + esc(art) + '</dt><dd>' + anzahl + '</dd></div>').join('') + '</dl>', stats.total + ' Karten mit Quellen') +
            sektion('Themen & Fächer', themenListe(liste(stats.topics), 12), 'Fortschritt aus Wiederholungen, nicht aus XP') +
            '</div></div>';
    };
    const PFAD_REIHENFOLGE = ['grundlagen', 'spannung', 'strom', 'widerstand', 'ohm', 'reihe',
        'parallel', 'leistung', 'energie', 'lampe', 'prüfung'];
    const lernpfadAnsicht = () => {
        const themen = liste(statistik().topics);
        const rang = (thema) => {
            const text = String(thema.label || '').toLowerCase();
            const index = PFAD_REIHENFOLGE.findIndex(wort => text.includes(wort));
            return index < 0 ? PFAD_REIHENFOLGE.length : index;
        };
        const nachVorgabe = themen.filter(thema => rang(thema) < PFAD_REIHENFOLGE.length).length;
        const sortiert = [...themen].sort((a, b) => rang(a) - rang(b) ||
            String(a.label).localeCompare(String(b.label), 'de-CH'));
        return '<div class="lw-path-page"><header class="lw-page-head"><div><p>Lernpfad</p>' +
            '<h2>Jedes Thema ist erreichbar</h2><span>Der Pfad zeigt den Stoff als Stufen. ' +
            'Er sperrt nichts künstlich.</span></div>' +
            '<button type="button" data-lw-nav="fortschritt">Fortschritt erklären</button></header>' +
            (sortiert.length
                ? '<ol class="lw-path" aria-label="Lernpfad">' + sortiert.map((thema, index) => {
                    const status = thema.progress >= 100 ? 'is-stable' : thema.progress > 0 ? 'is-active' : 'is-new';
                    const label = thema.progress >= 100 ? 'stabil' : thema.progress > 0 ? 'im Aufbau' : 'bereit';
                    return '<li class="' + status + '"><span class="lw-path-line" aria-hidden="true"></span>' +
                        '<button type="button" data-lw-path-topic="' + esc(thema.id) + '"><span class="lw-path-step">' +
                        (index + 1) + '</span><span class="lw-path-copy"><small>' + esc(label) + '</small><strong>' +
                        esc(thema.label) + '</strong><span>' + esc(thema.stable + ' von ' + thema.total + ' stabil' +
                        (thema.errors ? ' · ' + thema.errors + ' Fehler' : '')) + '</span><progress max="100" value="' +
                        prozent(thema.progress) + '" aria-label="' + esc(thema.label) + ': ' + prozent(thema.progress) +
                        ' Prozent"></progress></span><span class="lw-path-open">Lernen</span></button></li>';
                }).join('') + '</ol>'
                : leer('compass', 'Dein Lernpfad ist noch leer', 'Sobald Lernkarten Themen tragen, erscheinen sie hier als frei erreichbare Stufen.', 'capture', 'Erste Karte erstellen')) +
            (sortiert.length
                ? '<aside class="lw-note lw-path-why"><strong>' +
                    (nachVorgabe
                        ? 'Diese Reihenfolge kommt aus den Elektro-Grundlagen.'
                        : 'Für diesen Stoff gibt es keine hinterlegte Reihenfolge.') +
                    '</strong><p>' +
                    (nachVorgabe
                        ? 'Grundlagen, Spannung, Strom, Widerstand, Ohm, Reihe, Parallel, Leistung, ' +
                            'Energie, Lampe, Prüfung. Was darin nicht vorkommt, steht danach in ' +
                            'alphabetischer Folge — Redion errät keine Abhängigkeiten zwischen Themen.'
                        : 'Die Stufen stehen alphabetisch. Redion errät keine Abhängigkeiten ' +
                            'zwischen Themen; eine geratene Reihenfolge sähe aus wie Didaktik und ' +
                            'wäre keine.') +
                    '</p></aside>'
                : '') +
            '<aside class="lw-note"><strong>Fortschritt und Motivation bleiben getrennt.</strong>' +
            '<p>Die Prozentzahl kommt aus deinem persönlichen SM-2-Lernstand. XP und Level zeigen nur Aktivität.</p></aside>' +
            '</div>';
    };
    const fehlerAnsicht = () => {
        if (zustand.training)
            return trainingAnsicht();
        const fehler = fehlerListe();
        const offen = fehler.filter(item => !item.stabil);
        const ktx = kennzahlKontext();
        return '<div class="lw-errors"><header class="lw-page-head"><div><p>Fehlerzentrum</p><h2>Meine Fehler</h2>' +
            '<span>Jeder Eintrag bleibt mit seiner ursprünglichen Quelle verbunden.</span></div>' +
            '<button type="button" class="is-primary" data-lw-train="errors"' + (offen.length ? '' : ' disabled') +
            '>Fehler trainieren · ' + offen.length + '</button></header>' +
            '<section class="lw-metrics">' +
            merkbar('noch-instabil', ktx) + merkbar('inzwischen-stabil', ktx) + merkbar('fehlversuche', ktx) +
            '</section>' +
            (fehler.length
                ? '<div class="lw-error-list">' + fehler.map(item => '<article class="' + (item.stabil ? 'is-stable' : 'is-open') + '"><header><div><span>' +
                    esc(item.fach) + '</span><h3>' + kartenText(item.frage) + '</h3></div><strong>' +
                    (item.stabil ? '✓ stabil' : item.anzahl + (item.anzahl === 1 ? ' Fehler' : ' Fehler')) +
                    '</strong></header><dl><div><dt>Letzte Selbstbewertung</dt><dd>' + esc(item.letzteNote) +
                    '</dd></div><div><dt>Richtige Antwort</dt><dd>' + kartenText(item.antwort) +
                    '</dd></div><div><dt>Thema</dt><dd>' + esc(item.thema) +
                    '</dd></div><div><dt>Quelle</dt><dd>' + esc(item.quelle) +
                    '</dd></div><div><dt>Letzter Fehler</dt><dd>' + esc(datumText(item.zuletzt, true)) +
                    '</dd></div><div><dt>Nächste Wiederholung</dt><dd>' + esc(datumText(item.naechste, true)) +
                    '</dd></div></dl><footer><button type="button" data-lw-card-source="' + esc(item.card.id) +
                    '">Quelle öffnen</button><button type="button" data-lw-train-card="' + esc(item.card.id) +
                    '">Diese Karte üben</button></footer></article>').join('') + '</div>'
                : leer('party', 'Noch keine Fehler', 'Bewertete Fehler erscheinen hier mit Antwort, Thema und Quelle.', 'nav-lernen', 'Lernen starten')) + '</div>';
    };
    const pruefungsFortschritt = (pruefung) => {
        const karten = nurPassendeKarten(pruefung);
        if (!karten.length)
            return 0;
        return Math.round(karten.reduce((summe, card) => summe + Math.min(2, Math.max(0, zahl(card?.sr?.wdh))), 0) / (karten.length * 2) * 100);
    };
    const simulationsVerlauf = () => {
        const alle = simulationen();
        if (!alle.length)
            return '';
        const zeile = (item) => {
            const quote = item.gesamt ? Math.round(item.richtig / item.gesamt * 100) : 0;
            const wann = new Date(item.beendet);
            return '<li><span><strong>' + esc(item.titel) + '</strong><small>' +
                esc(Number.isNaN(wann.getTime()) ? '' : datumText(wann)) + ' · ' +
                item.richtig + ' von ' + item.gesamt + ' richtig · ' + item.dauerMin +
                ' Min.</small></span><b>' + quote + ' %</b></li>';
        };
        const oben = alle.slice(0, 5), rest = alle.slice(5);
        return '<section class="lw-sim-history"><h3>Letzte Simulationen</h3><ul>' +
            oben.map(zeile).join('') + '</ul>' +
            (rest.length ? '<details><summary>Ältere (' + rest.length + ')</summary><ul>' +
                rest.map(zeile).join('') + '</ul></details>' : '') + '</section>';
    };
    const notenSammlungen = () => Object.values(Store.cache.collections).filter(collection => {
        const name = String(collection?.name || '').toLowerCase();
        return collection?.schoolKind === 'grades' || /\bnoten\b|zeugnis/.test(name);
    });
    const notenEintraege = () => {
        const raus = [];
        notenSammlungen().forEach(collection => {
            const schema = collection.schema || {};
            const spalte = (muster, typ = 'number') => Object.keys(schema).find(key => schema[key]?.type === typ &&
                muster.test(String(schema[key]?.name || key).toLowerCase())) || '';
            const noteKey = spalte(/note|zensur/) || '';
            const punkteKey = spalte(/punkte|points|erreicht/);
            const maxKey = spalte(/max/);
            const gewichtKey = spalte(/gewicht|weight|zaehlt/);
            const fachKey = schemaSchluessel(collection, 'relation', ['fach', 'subject', 'modul']) ||
                Object.keys(schema).find(key => /fach|subject|modul/.test(String(schema[key]?.name || key).toLowerCase())) || '';
            const datumKey = schemaSchluessel(collection, 'date');
            const feldZahl = (wert) => {
                if (wert === null || wert === undefined || wert === '')
                    return NaN;
                return zahl(wert, NaN);
            };
            Store.rowsOf(collection.id).forEach((row) => {
                if (!row || row.alive === false || !darfLesen(row) || !imBereich(row))
                    return;
                let note = feldZahl(zeilenWert(row, collection, noteKey));
                if (!Number.isFinite(note)) {
                    const p2 = feldZahl(zeilenWert(row, collection, punkteKey));
                    const m2 = feldZahl(zeilenWert(row, collection, maxKey));
                    if (Number.isFinite(p2) && Number.isFinite(m2) && m2 > 0)
                        note = 5 * (p2 / m2) + 1;
                }
                if (!Number.isFinite(note))
                    return;
                if (note < 1 || note > 6)
                    return;
                const fachWert = zeilenWert(row, collection, fachKey);
                raus.push({
                    fach: textListe(fachWert).join(', ') || String(fachWert || '') || 'Ohne Fach',
                    note,
                    gewicht: Math.max(0.1, zahl(zeilenWert(row, collection, gewichtKey), 1) || 1),
                    datum: datum(zeilenWert(row, collection, datumKey)),
                    titel: String(row.text || 'Leistung')
                });
            });
        });
        return raus.sort((a, b) => (a.datum?.getTime() ?? 0) - (b.datum?.getTime() ?? 0));
    };
    const semesterVon = (wann) => {
        const jahr = wann.getFullYear();
        const monat = wann.getMonth();
        if (monat >= 7)
            return { start: new Date(jahr, 7, 1), ende: new Date(jahr + 1, 1, 1),
                name: 'Aug ' + jahr + ' – Jan ' + (jahr + 1) };
        if (monat === 0)
            return { start: new Date(jahr - 1, 7, 1), ende: new Date(jahr, 1, 1),
                name: 'Aug ' + (jahr - 1) + ' – Jan ' + jahr };
        return { start: new Date(jahr, 1, 1), ende: new Date(jahr, 7, 1),
            name: 'Feb – Jul ' + jahr };
    };
    const semesterDavor = (semester) => semesterVon(new Date(semester.start.getTime() - 24 * 3600 * 1000));
    const notenBilanz = (eintraege) => {
        const je = new Map();
        eintraege.forEach(e => {
            const liste2 = je.get(e.fach) || [];
            liste2.push(e);
            je.set(e.fach, liste2);
        });
        return [...je.entries()].map(([fach, liste2]) => {
            const S = liste2.reduce((summe, e) => summe + e.note * e.gewicht, 0);
            const G = liste2.reduce((summe, e) => summe + e.gewicht, 0);
            const schnitt = S / G;
            return { fach, eintraege: liste2, schnitt,
                zeugnis: Math.round(schnitt * 2) / 2,
                noetig: 4 * (G + 1) - S };
        }).sort((a, b) => a.fach.localeCompare(b.fach, 'de-CH'));
    };
    const notenAnsicht = () => {
        const alleEintraege = notenEintraege();
        const heftDa = notenSammlungen().length > 0;
        if (!alleEintraege.length) {
            if (!heftDa)
                return '<div class="lw-grades">' +
                    leer('medal', 'Noch kein Notenheft', 'Die Schulvorlage legt ein Notenheft mit Fächern, Gewichtung und Punkten an — zusätzlich, sie ersetzt nichts.', 'school-install', 'Ausbildung einrichten') + '</div>';
            return '<div class="lw-grades">' +
                leer('medal', 'Noch keine Noten eingetragen', 'Trage die erste Note im Notenheft ein — mit Fach, Gewicht und Datum rechnet Redion Schnitt und Zeugnisnote.', 'grades-open', 'Notenheft öffnen') + '</div>';
        }
        const jetzt = semesterVon(new Date());
        const davor = semesterDavor(jetzt);
        const imSemester = (e, s) => e.datum !== null && e.datum >= s.start && e.datum < s.ende;
        const jeZeitraum = {
            aktuell: alleEintraege.filter(e => e.datum === null || imSemester(e, jetzt)),
            vorher: alleEintraege.filter(e => imSemester(e, davor)),
            alle: alleEintraege
        };
        const wahl = zustand.notenZeitraum;
        const eintraege = jeZeitraum[wahl];
        const ohneDatum = jeZeitraum.aktuell.filter(e => e.datum === null).length;
        const chip = (id, beschriftung, zeitraumName) => '<button type="button" data-lw-zeitraum="' + id + '"' +
            ' aria-pressed="' + (wahl === id ? 'true' : 'false') + '"' +
            (zeitraumName ? ' title="' + esc(zeitraumName) + '"' : '') + '>' +
            esc(beschriftung) + ' <b>' + jeZeitraum[id].length + '</b></button>';
        const chips = '<nav class="lw-grade-zeitraeume" aria-label="Zeitraum der Noten">' +
            chip('aktuell', 'Dieses Semester', jetzt.name) +
            chip('vorher', 'Letztes Semester', davor.name) +
            chip('alle', 'Alle', '') + '</nav>';
        const zeitraumName = wahl === 'aktuell' ? jetzt.name
            : wahl === 'vorher' ? davor.name : 'alle Semester';
        if (!eintraege.length) {
            return '<div class="lw-grades"><header class="lw-page-head"><div><p>Notenübersicht</p>' +
                '<h2>Keine Noten in diesem Zeitraum</h2>' +
                '<span>' + esc(zeitraumName) + ' ist leer — insgesamt ' + alleEintraege.length +
                (alleEintraege.length === 1 ? ' Note' : ' Noten') + ' in anderen Zeiträumen.</span></div>' +
                '<button type="button" data-lw-action="grades-open">Notenheft öffnen</button></header>' +
                chips + '</div>';
        }
        const bilanz = notenBilanz(eintraege);
        const gesamtRoh = eintraege.reduce((summe, e) => summe + e.note * e.gewicht, 0) /
            eintraege.reduce((summe, e) => summe + e.gewicht, 0);
        const gesamtZeugnis = bilanz.reduce((summe, f) => summe + f.zeugnis, 0) / bilanz.length;
        const unter4 = bilanz.filter(f => f.zeugnis < 4);
        const balken = (liste2) => '<span class="lw-grade-balken" aria-hidden="true">' +
            liste2.slice(-8).map(e => '<i class="' + (e.note < 4 ? 'ist-ungenuegend' : '') +
                '" style="height:' + Math.round(Math.max(8, (e.note - 1) / 5 * 100)) + '%"' +
                ' title="' + esc(e.titel + ': ' + e.note.toFixed(1)) + '"></i>').join('') +
            '</span>';
        const zielSatz = (f) => {
            if (f.noetig <= 1)
                return 'Die 4.0 ist sicher — jede gültige Note hält den Schnitt genügend.';
            if (f.noetig > 6)
                return 'Mit einer einzelnen Prüfung ist die 4.0 nicht mehr zu erreichen.';
            return 'Für eine 4.0 im Schnitt braucht die nächste Prüfung mindestens eine ' +
                (Math.ceil(f.noetig * 10) / 10).toFixed(1) + '.';
        };
        return '<div class="lw-grades"><header class="lw-page-head"><div><p>Notenübersicht · ' +
            esc(zeitraumName) + '</p>' +
            '<h2>' + gesamtZeugnis.toFixed(1) + (wahl === 'alle' ? ' über alle Semester' : ' im Zeugnis') + '</h2>' +
            '<span>Gewichteter Schnitt ' + gesamtRoh.toFixed(2) + ' über ' + eintraege.length +
            (eintraege.length === 1 ? ' Note' : ' Noten') + ' in ' + bilanz.length +
            (bilanz.length === 1 ? ' Fach' : ' Fächern') +
            (unter4.length ? ' · ' + unter4.length + (unter4.length === 1 ? ' Fach' : ' Fächer') +
                ' ungenügend' : ' · kein Fach ungenügend') +
            (wahl === 'aktuell' && ohneDatum ? ' · ' + ohneDatum + ' ohne Datum, zählen zu diesem Semester' : '') +
            '.</span></div>' +
            '<button type="button" data-lw-action="grades-open">Notenheft öffnen</button></header>' +
            chips +
            '<div class="lw-grade-grid">' + bilanz.map(f => '<article class="lw-grade-fach' + (f.zeugnis < 4 ? ' ist-ungenuegend' : '') + '">' +
            '<header><h3>' + esc(f.fach) + '</h3><strong>' + f.schnitt.toFixed(2) + '</strong></header>' +
            '<p class="lw-grade-zeugnis">Zeugnisnote <b>' + f.zeugnis.toFixed(1) + '</b> · ' +
            f.eintraege.length + (f.eintraege.length === 1 ? ' Note' : ' Noten') + '</p>' +
            balken(f.eintraege) +
            '<p class="lw-grade-ziel">' + esc(zielSatz(f)) + '</p>' +
            '</article>').join('') + '</div></div>';
    };
    const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const stundenplanSammlungen = () => Object.values(Store.cache.collections).filter(collection => {
        const name = String(collection?.name || '').toLowerCase();
        return collection?.schoolKind === 'timetable' || /stundenplan/.test(name);
    });
    const uhrMin = (wert) => {
        const teil = /(\d{1,2})\s*[:.]\s*(\d{2})/.exec(String(wert ?? ''));
        if (!teil)
            return NaN;
        const h = Number(teil[1]), min = Number(teil[2]);
        if (h > 23 || min > 59)
            return NaN;
        return h * 60 + min;
    };
    const tagIndex = (wert) => {
        const t = String(wert ?? '').trim().toLowerCase().slice(0, 2);
        if (t.length < 2)
            return -1;
        return TAGE.findIndex(name => name.toLowerCase().startsWith(t));
    };
    const lektionen = () => {
        const raus = [];
        stundenplanSammlungen().forEach(collection => {
            const schema = collection.schema || {};
            const spalte = (muster) => Object.keys(schema).find(key => muster.test(String(schema[key]?.name || key).toLowerCase())) || '';
            const tagKey = spalte(/^tag\b|wochentag|day/);
            const vonKey = spalte(/^von\b|start|beginn/);
            const bisKey = spalte(/^bis\b|ende/);
            const fachKey = schemaSchluessel(collection, 'relation', ['fach', 'subject', 'modul']) ||
                spalte(/fach|subject|modul/);
            const raumKey = spalte(/raum|zimmer|^ort\b/);
            const hinweisKey = spalte(/hinweis|notiz|bemerk/);
            Store.rowsOf(collection.id).forEach((row) => {
                if (!row || row.alive === false || !darfLesen(row) || !imBereich(row))
                    return;
                const tag = tagIndex(zeilenWert(row, collection, tagKey));
                if (tag < 0)
                    return;
                const vonRoh = String(zeilenWert(row, collection, vonKey) ?? '');
                const bisRoh = String(zeilenWert(row, collection, bisKey) ?? '');
                const vonMin = uhrMin(vonRoh);
                const fachWert = zeilenWert(row, collection, fachKey);
                raus.push({
                    tag,
                    von: vonRoh.trim(), bis: bisRoh.trim(),
                    vonMin: Number.isFinite(vonMin) ? vonMin : 24 * 60,
                    bisMin: uhrMin(bisRoh),
                    fach: textListe(fachWert).join(', ') || String(fachWert || '') ||
                        String(row.text || 'Lektion'),
                    raum: String(zeilenWert(row, collection, raumKey) ?? '').trim(),
                    hinweis: String(zeilenWert(row, collection, hinweisKey) ?? '').trim()
                });
            });
        });
        return raus.sort((a, b) => a.tag - b.tag || a.vonMin - b.vonMin);
    };
    const stundenplanAnsicht = () => {
        const alle = lektionen();
        const planDa = stundenplanSammlungen().length > 0;
        if (!alle.length) {
            if (!planDa)
                return '<div class="lw-plan">' +
                    leer('calendar', 'Noch kein Stundenplan', 'Die Schulvorlage legt eine Stundenplan-Datenbank mit Tag, Zeit, Fach und Raum an — auch bei eingerichteter Ausbildung ergänzt sie nur, was fehlt.', 'school-install', 'Stundenplan anlegen') + '</div>';
            return '<div class="lw-plan">' +
                leer('calendar', 'Noch keine Lektionen eingetragen', 'Trage Lektionen mit Tag, Von, Bis, Fach und Raum ein — die Wochenansicht ordnet sie von selbst.', 'timetable-open', 'Stundenplan öffnen') + '</div>';
        }
        const jetzt = new Date();
        const heuteTag = (jetzt.getDay() + 6) % 7;
        const jetztMin = jetzt.getHours() * 60 + jetzt.getMinutes();
        const tageZahl = alle.some(l => l.tag === 5) ? 6 : 5;
        const laufend = alle.find(l => l.tag === heuteTag && Number.isFinite(l.bisMin) &&
            l.vonMin <= jetztMin && jetztMin < l.bisMin) || null;
        const naechste = alle.find(l => l.tag === heuteTag &&
            l.vonMin > jetztMin && l.vonMin < 24 * 60) || null;
        const heutige = alle.filter(l => l.tag === heuteTag);
        const jetztSatz = laufend
            ? 'Jetzt: ' + laufend.fach + (laufend.bis ? ' bis ' + laufend.bis : '') +
                (laufend.raum ? ' in ' + laufend.raum : '')
            : naechste
                ? 'Als Nächstes: ' + naechste.fach + ' um ' + naechste.von +
                    (naechste.raum ? ' in ' + naechste.raum : '')
                : heutige.length ? 'Für heute ist alles vorbei.' : 'Heute steht nichts im Plan.';
        const spalten = TAGE.slice(0, tageZahl).map((name, tag) => {
            const drin = alle.filter(l => l.tag === tag);
            return '<section class="lw-plan-tag' + (tag === heuteTag ? ' ist-heute' : '') + '">' +
                '<h3>' + name + (tag === heuteTag ? ' <em>heute</em>' : '') + '</h3>' +
                (drin.length ? drin.map(l => '<article class="lw-plan-lektion' + (l === laufend ? ' ist-jetzt' : '') + '">' +
                    '<time>' + esc(l.von && l.bis ? l.von + '–' + l.bis : l.von || l.bis || 'ohne Zeit') +
                    '</time>' + (l === laufend ? '<em class="lw-plan-jetzt">jetzt</em>' : '') +
                    '<strong>' + esc(l.fach) + '</strong>' +
                    (l.raum ? '<span>' + esc(l.raum) + '</span>' : '') +
                    (l.hinweis ? '<small>' + esc(l.hinweis) + '</small>' : '') +
                    '</article>').join('') : '<p class="lw-plan-frei">frei</p>') +
                '</section>';
        }).join('');
        return '<div class="lw-plan"><header class="lw-page-head"><div><p>Stundenplan</p>' +
            '<h2>' + esc(jetztSatz) + '</h2>' +
            '<span>' + alle.length + (alle.length === 1 ? ' Lektion' : ' Lektionen') +
            ' pro Woche.</span></div>' +
            '<button type="button" data-lw-action="timetable-open">Stundenplan öffnen</button></header>' +
            '<div class="lw-plan-woche">' + spalten + '</div></div>';
    };
    const pruefungenAnsicht = () => {
        if (zustand.simulation)
            return simulationAnsicht();
        const alle = pruefungen();
        const kommende = alle.filter(item => item.tage === null || item.tage >= 0);
        const vergangene = alle.filter(item => item.tage !== null && item.tage < 0);
        return '<div class="lw-exams"><header class="lw-page-head"><div><p>Prüfungszentrale</p><h2>Kommende Prüfungen</h2>' +
            '<span>Lernstoff, Quellen, Aufgaben, Fehler und Karten aus denselben Redion-Daten.</span></div>' +
            '<button type="button" data-lw-simulate="weekly"' + (lernkarten().length ? '' : ' disabled') +
            '>Wochenprüfung simulieren</button></header>' +
            (kommende.length
                ? '<div class="lw-exam-list">' + kommende.map(item => {
                    const karten = nurPassendeKarten(item);
                    const fehler = karten.filter(card => verlauf(card).some(istFehler)).length;
                    const passendeAufgaben = sichtbareAufgaben().filter(aufgabe => (aufgabe.titel + ' ' + aufgabe.quelle).toLowerCase().includes(item.titel.toLowerCase())).length;
                    return '<article><header><div><span>' + esc(item.fach || 'Prüfung') + '</span><h3>' +
                        esc(item.titel) + '</h3><time datetime="' + esc(item.datum?.toISOString() || '') + '">' +
                        esc(item.datum ? datumText(item.datum) : 'Termin offen') + '</time></div><strong>' +
                        (item.tage === null ? 'Termin offen' : item.tage === 0 ? 'heute' : item.tage === 1 ? 'morgen' :
                            item.tage + ' Tage') + '</strong></header><p>' +
                        esc(item.lernstoff || 'Noch kein Lernstoff hinterlegt.') + '</p>' +
                        fortschritt(pruefungsFortschritt(item), 'Fachlicher Lernstand') +
                        '<dl><div><dt>Karten</dt><dd>' + karten.length + '</dd></div><div><dt>Fehler</dt><dd>' +
                        fehler + '</dd></div><div><dt>Aufgaben</dt><dd>' + passendeAufgaben +
                        '</dd></div><div><dt>Zeitlimit</dt><dd>' + item.dauer + ' Min.</dd></div></dl><footer>' +
                        '<button type="button" data-lw-open="' + esc(item.id) + '">Prüfung öffnen</button>' +
                        '<button type="button" class="is-primary" data-lw-simulate="' + esc(item.id) + '"' +
                        (lernkarten().length ? '' : ' disabled') + '>' +
                        (karten.length ? 'Simulation starten' : 'Simulation aus allen Karten') +
                        '</button></footer></article>';
                }).join('') + '</div>'
                : leer('calendar', 'Keine Prüfung geplant', 'Prüfungen bleiben normale Datenbankzeilen. Lege einen Termin in der Ausbildung an.', 'school-setup', 'Ausbildung einrichten')) +
            simulationsVerlauf() +
            (vergangene.length ? '<details class="lw-past-exams"><summary>Vergangene Prüfungen (' +
                vergangene.length + ')</summary><ul>' + vergangene.slice(-12).reverse().map(item => '<li><button type="button" data-lw-open="' + esc(item.id) + '"><span>' + esc(item.titel) +
                '</span><time>' + esc(item.datum ? datumText(item.datum) : '') + '</time></button></li>').join('') +
                '</ul></details>' : '') + '</div>';
    };
    const simulationAnsicht = () => {
        const simulation = zustand.simulation;
        if (!simulation)
            return '';
        if (simulation.fertig || simulation.index >= simulation.karten.length) {
            simulationAbschliessen(simulation);
            const richtig = simulation.antworten.filter(item => item.richtig).length;
            const gesamt = simulation.antworten.length;
            const quote = gesamt ? Math.round(richtig / gesamt * 100) : 0;
            const themen = new Map();
            simulation.antworten.forEach(item => {
                const wert = themen.get(item.thema) || { gesamt: 0, fehler: 0 };
                wert.gesamt++;
                if (!item.richtig)
                    wert.fehler++;
                themen.set(item.thema, wert);
            });
            return '<div class="lw-simulation lw-simulation-result"><header>' + zeichenSpan('flag') +
                '<p>Simulation beendet</p><h2>' + esc(simulation.titel) + '</h2><strong>' + quote + ' %</strong></header>' +
                '<section class="lw-metrics">' + kennzahl(richtig + ' / ' + gesamt, 'richtig') +
                kennzahl(String(gesamt - richtig), 'Fehler') +
                kennzahl(Math.max(1, Math.round((Date.now() - simulation.gestartet) / 60000)) + ' Min.', 'Dauer') +
                '</section>' +
                sektion('Themenanalyse', '<ul class="lw-analysis">' + [...themen.entries()].map(([thema, wert]) => '<li><span><strong>' + esc(thema) + '</strong><small>' + wert.fehler + ' Fehler bei ' +
                    wert.gesamt + ' Aufgaben</small></span>' + fortschritt(wert.gesamt ? Math.round((wert.gesamt - wert.fehler) / wert.gesamt * 100) : 0, thema) +
                    '</li>').join('') + '</ul>', 'Ergebnis der Simulation, kein SM-2-Stand') +
                '<div class="lw-actions"><button type="button" data-lw-action="simulation-close">Zur Prüfungszentrale</button>' +
                '<button type="button" class="is-primary" data-lw-simulation-errors="1"' +
                (gesamt === richtig ? ' disabled' : '') + '>Simulationsfehler üben</button></div></div>';
        }
        const card = simulation.karten[simulation.index];
        const [frage, antwort] = kartenTeile(card);
        const rest = Math.max(0, simulation.endet - Date.now());
        const minuten = Math.floor(rest / 60000);
        const sekunden = Math.floor((rest % 60000) / 1000);
        return '<div class="lw-simulation"><header class="lw-session-head"><div><p>' +
            esc(simulation.titel) + '</p><h2>Aufgabe ' + (simulation.index + 1) + ' von ' + simulation.karten.length +
            '</h2></div><time aria-label="Verbleibende Zeit">' + String(minuten).padStart(2, '0') + ':' +
            String(sekunden).padStart(2, '0') + '</time></header><progress max="' + simulation.karten.length +
            '" value="' + simulation.index + '" aria-label="Prüfungsfortschritt"></progress>' +
            '<article class="lw-study-card"><small>' + esc(themaVon(card)) + '</small><h3>' + kartenText(frage) + '</h3>' +
            (simulation.aufgedeckt ? '<div class="lw-answer"><span>Richtige Antwort</span><p>' + kartenText(antwort) + '</p></div>' : '') +
            '</article><div class="lw-actions">' +
            (simulation.aufgedeckt
                ? '<button type="button" data-lw-sim-answer="wrong">Falsch</button>' +
                    '<button type="button" class="is-primary" data-lw-sim-answer="right">Richtig</button>'
                : '<button type="button" class="is-primary" data-lw-action="simulation-reveal">Antwort prüfen</button>') +
            '<button type="button" data-lw-card-source="' + esc(card.id) + '">Quelle</button></div>' +
            '<p class="lw-session-note">Simulationsergebnisse verändern den gespeicherten Lernstand nicht.</p></div>';
    };
    const trainingAnsicht = () => {
        const training = zustand.training;
        if (!training)
            return '';
        if (training.index >= training.karten.length) {
            return '<div class="lw-training-result">' + zeichenSpan('party') + '<p>Runde abgeschlossen</p><h2>' +
                esc(training.titel) + '</h2><strong>' + training.bewertet + ' Karten bewertet</strong><div class="lw-actions">' +
                '<button type="button" data-lw-action="training-close">Zur Übersicht</button>' +
                '<button type="button" class="is-primary" data-lw-train="today">Nächste Runde</button></div></div>';
        }
        const card = training.karten[training.index];
        const [frage, antwort] = kartenTeile(card);
        const source = typeof Learning !== 'undefined' && Learning.sourceOf ? Learning.sourceOf(card) : null;
        return '<div class="lw-training"><header class="lw-session-head"><div><p>' + esc(training.titel) +
            '</p><h2>Karte ' + (training.index + 1) + ' von ' + training.karten.length + '</h2></div>' +
            '<button type="button" data-lw-action="training-close">Beenden</button></header>' +
            '<progress max="' + training.karten.length + '" value="' + training.index +
            '" aria-label="Lernfortschritt"></progress><article class="lw-study-card"><small>' +
            esc(themaVon(card)) + '</small><h3>' + kartenText(frage) + '</h3>' +
            (training.aufgedeckt ? '<div class="lw-answer"><span>Antwort</span><p>' + kartenText(antwort) + '</p></div>' : '') +
            (source ? '<button type="button" class="lw-source" data-lw-card-source="' + esc(card.id) + '">Quelle: ' +
                esc(typeof Learning !== 'undefined' && Learning.sourceLabel ? Learning.sourceLabel(source) : source.label) +
                '</button>' : '') + '</article><div class="lw-rating">' +
            (training.aufgedeckt
                ? [['1', 'Nochmal'], ['2', 'Schwer'], ['3', 'Gut'], ['4', 'Leicht']].map(([note, label]) => '<button type="button" data-lw-rate="' + note + '"' +
                    (note === '3' ? ' class="is-primary"' : '') + (training.beschaeftigt ? ' disabled' : '') + '>' +
                    label + '</button>').join('')
                : '<button type="button" class="is-primary" data-lw-action="training-reveal">Antwort zeigen</button>') +
            '</div><p class="lw-session-note">Bewertungen werden im persönlichen Lernstand von ' +
            esc(aktor().name) + ' gespeichert.</p></div>';
    };
    const schoolRoot = () => alleBloecke().find(block => block.type === 'page' &&
        (block.schoolRoot === true || block.systemRole === 'school-root')) || null;
    const schulSammlungen = (kind = '') => Object.values(Store.cache.collections)
        .filter(collection => {
        if (kind && collection?.schoolKind !== kind)
            return false;
        if (!collection?.schoolKind && kind)
            return false;
        const block = Object.values(Store.cache.blocks).find(item => item?.alive !== false &&
            item.type === 'database' && item.collectionId === collection.id);
        return !block || darfLesen(block);
    });
    const zeilenTitel = (row, collection) => {
        const titleKey = schemaSchluessel(collection, 'title');
        return String(row?.text || zeilenWert(row, collection, titleKey) || 'Ohne Titel');
    };
    const sammlungsEintraege = (kind, icon, limit = 8) => {
        const ausgabe = [];
        schulSammlungen(kind).forEach(collection => Store.rowsOf(collection.id).forEach((row) => {
            if (!row || row.alive === false || !darfLesen(row) || !imBereich(row))
                return;
            ausgabe.push({
                id: String(row.id),
                titel: zeilenTitel(row, collection),
                icon,
                zeit: String(row.edited || row.created || ''),
                untertitel: String(collection.name || kind),
                bereichIds: direkteBereichIds(row)
            });
        }));
        return ausgabe.slice(0, limit);
    };
    const fachZeilen = () => {
        const ausgabe = [];
        schulSammlungen('subjects').forEach(collection => Store.rowsOf(collection.id).forEach((row) => {
            if (!row || row.alive === false || !darfLesen(row) || !imBereich(row))
                return;
            ausgabe.push({ row, collection, titel: zeilenTitel(row, collection) });
        }));
        return ausgabe;
    };
    const beziehtSichAuf = (record, id, titel) => {
        const suchtext = JSON.stringify(record?.props || record || '').toLowerCase();
        return suchtext.includes(id.toLowerCase()) || (titel.length > 2 && suchtext.includes(titel.toLowerCase()));
    };
    const hausaufgabenSammlungen = () => Object.values(Store.cache.collections).filter(collection => {
        const name = String(collection?.name || '').toLowerCase();
        return collection?.schoolKind === 'homework' || /hausaufgabe/.test(name);
    });
    const lernzielSammlungen = () => Object.values(Store.cache.collections).filter(collection => {
        const name = String(collection?.name || '').toLowerCase();
        return collection?.schoolKind === 'goals' || /lernziel/.test(name);
    });
    const hausaufgaben = () => {
        const raus = [];
        hausaufgabenSammlungen().forEach(collection => {
            const dueKey = schemaSchluessel(collection, 'date', ['fällig', 'faellig', 'due', 'termin']);
            const doneKey = schemaSchluessel(collection, 'checkbox', ['erledigt', 'done']);
            Store.rowsOf(collection.id).forEach((row) => {
                if (!row || row.alive === false || !darfLesen(row) || !imBereich(row))
                    return;
                raus.push({
                    id: String(row.id),
                    titel: zeilenTitel(row, collection),
                    faellig: String(zeilenWert(row, collection, dueKey) ?? '').slice(0, 10),
                    erledigt: !!(doneKey && row?.props?.[doneKey]),
                    doneKey, row, collection
                });
            });
        });
        return raus.sort((a, b) => a.erledigt !== b.erledigt
            ? (a.erledigt ? 1 : -1)
            : String(a.faellig || '9999').localeCompare(String(b.faellig || '9999')));
    };
    const lernziele = () => {
        const raus = [];
        lernzielSammlungen().forEach(collection => {
            const statusKey = schemaSchluessel(collection, 'status', ['stand', 'status']) ||
                schemaSchluessel(collection, 'select', ['stand', 'status']);
            const untilKey = schemaSchluessel(collection, 'date', ['bis', 'until', 'termin']);
            Store.rowsOf(collection.id).forEach((row) => {
                if (!row || row.alive === false || !darfLesen(row) || !imBereich(row))
                    return;
                raus.push({
                    id: String(row.id),
                    titel: zeilenTitel(row, collection),
                    stand: String((statusKey && row?.props?.[statusKey]) || 'Offen'),
                    bis: String(zeilenWert(row, collection, untilKey) ?? '').slice(0, 10),
                    row, collection
                });
            });
        });
        return raus.sort((a, b) => (a.stand === 'Sicher' ? 1 : 0) - (b.stand === 'Sicher' ? 1 : 0));
    };
    const hausaufgabenListe = (items, leerText) => {
        if (!items.length)
            return '<p class="lw-none">' + esc(leerText) + '</p>';
        const heute = String(Store.now()).slice(0, 10);
        return '<ul class="lw-hw-list">' + items.map(h => {
            const dran = !h.erledigt && !!h.faellig && h.faellig < heute;
            return '<li class="' + (h.erledigt ? 'ist-erledigt' : dran ? 'ist-faellig' : '') + '">' +
                '<button type="button" class="lw-hw-check" data-lw-hw-done="' + esc(h.id) + '" ' +
                'aria-pressed="' + (h.erledigt ? 'true' : 'false') + '" ' +
                'aria-label="' + (h.erledigt ? 'Wieder öffnen' : 'Als erledigt abhaken') + ': ' + esc(h.titel) + '">' +
                (h.erledigt ? '✓' : '') + '</button>' +
                '<button type="button" class="lw-hw-open" data-lw-open="' + esc(h.id) + '">' +
                '<strong>' + esc(h.titel) + '</strong>' +
                '<small>' + (h.faellig
                ? 'fällig ' + esc(datumText(h.faellig)) + (dran ? ' · überfällig' : '')
                : 'ohne Termin') + '</small></button></li>';
        }).join('') + '</ul>';
    };
    const lernzielListe = (items, leerText) => {
        if (!items.length)
            return '<p class="lw-none">' + esc(leerText) + '</p>';
        const slug = (stand) => stand === 'Sicher' ? 'sicher' : /arbeit/i.test(stand) ? 'arbeit' : 'offen';
        return '<ul class="lw-goal-list">' + items.map(z => '<li><button type="button" data-lw-open="' + esc(z.id) + '">' +
            '<span class="lw-goal-stand ist-' + slug(z.stand) + '">' + esc(z.stand) + '</span>' +
            '<strong>' + esc(z.titel) + '</strong>' +
            '<small>' + (z.bis ? 'bis ' + esc(datumText(z.bis)) : 'ohne Termin') + '</small>' +
            '</button></li>').join('') + '</ul>';
    };
    const fachAnsicht = (fach) => {
        const karten = lernkarten().filter(card => fachVon(card).toLowerCase().includes(fach.titel.toLowerCase()) ||
            beziehtSichAuf(card, fach.row.id, fach.titel));
        const fachFehler = fehlerListe().filter(item => karten.some(card => card.id === item.card.id));
        const fachAufgaben = sichtbareAufgaben().filter(item => {
            const row = Store.getBlock(item.id);
            return beziehtSichAuf(row || item, fach.row.id, fach.titel) ||
                item.quelle.toLowerCase().includes(fach.titel.toLowerCase());
        });
        const fachPruefungen = pruefungen().filter(item => item.fach.toLowerCase().includes(fach.titel.toLowerCase()) ||
            item.lernstoff.toLowerCase().includes(fach.titel.toLowerCase()));
        const fachPdfs = sichtbarePdfs().filter(item => {
            const page = Store.getBlock(item.id);
            return beziehtSichAuf(page || item, fach.row.id, fach.titel) ||
                item.titel.toLowerCase().includes(fach.titel.toLowerCase());
        });
        const fachNotizen = dokumente().filter(item => item.titel.toLowerCase().includes(fach.titel.toLowerCase()));
        const fachHw = hausaufgaben().filter(item => beziehtSichAuf(item.row, fach.row.id, fach.titel));
        const fachZiele = lernziele().filter(item => beziehtSichAuf(item.row, fach.row.id, fach.titel));
        const fort = karten.length
            ? Math.round(karten.reduce((summe, card) => summe + Math.min(2, zahl(card?.sr?.wdh)), 0) /
                (karten.length * 2) * 100)
            : 0;
        return '<div class="lw-subject"><header class="lw-page-head"><div><button type="button" class="lw-back" ' +
            'data-lw-action="subject-back">← Schule / Ausbildung</button><p>Fach</p><h2>' + esc(fach.titel) +
            '</h2><span>Eine Fachseite, dieselben Notizen, PDFs, Aufgaben und Karten.</span></div>' +
            '<button type="button" data-lw-open="' + esc(fach.row.id) + '">Datensatz öffnen</button></header>' +
            '<section class="lw-metrics">' + kennzahl(String(karten.length), 'Lernkarten') +
            kennzahl(String(fachHw.filter(item => !item.erledigt).length), 'offene Hausaufgaben') +
            kennzahl(String(fachAufgaben.filter(item => !item.fertig).length), 'offene Aufgaben') +
            kennzahl(String(fachPruefungen.length), 'Prüfungen') +
            kennzahl(String(fachFehler.filter(item => !item.stabil).length), 'aktive Fehler') + '</section>' +
            fortschritt(fort, 'Fachlicher Fortschritt') +
            '<div class="lw-dashboard-grid">' +
            sektion('Hausaufgaben', hausaufgabenListe(fachHw.slice(0, 8), 'Keine Hausaufgabe für dieses Fach eingetragen.')) +
            sektion('Lernziele', lernzielListe(fachZiele.slice(0, 8), 'Noch kein Lernziel für dieses Fach.')) +
            sektion('Unterricht & Notizen', eintragListe(fachNotizen.slice(0, 8), 'Noch keine Notiz diesem Fach zugeordnet.')) +
            sektion('PDFs & Material', eintragListe(fachPdfs.slice(0, 8), 'Noch kein PDF diesem Fach zugeordnet.')) +
            sektion('Aufgaben', aufgabenListe(fachAufgaben.slice(0, 8), 'Keine Fachaufgabe gefunden.')) +
            sektion('Prüfungen', fachPruefungen.length ? '<ul class="lw-object-list">' + fachPruefungen.map(item => '<li><button type="button" data-lw-exam="' + esc(item.id) + '">' + zeichenSpan('clipboard', 'lw-object-icon') +
                '<span><strong>' + esc(item.titel) + '</strong><small>' + esc(item.datum ? datumText(item.datum) :
                'Termin offen') + '</small></span><span>›</span></button></li>').join('') + '</ul>' :
                '<p class="lw-none">Keine Prüfung für dieses Fach gefunden.</p>') +
            sektion('Fehler', fachFehler.length ? '<ul class="lw-compact-errors">' + fachFehler.slice(0, 8).map(item => '<li><button type="button" data-lw-train-card="' + esc(item.card.id) + '"><span>' +
                (item.stabil ? '✓' : '!') + '</span><strong>' + kartenText(item.frage) + '</strong><small>' + item.anzahl +
                ' Fehler</small></button></li>').join('') + '</ul>' : '<p class="lw-none">Keine Fehler in diesem Fach.</p>') +
            '</div></div>';
    };
    const schuleAnsicht = () => {
        const root = schoolRoot();
        const schonDa = !root && (schulSammlungen().some(sammlung => sammlung?.schoolKind) ||
            pruefungen().length > 0 || lernkarten().length > 0 || fachZeilen().length > 0);
        if (!root && !schonDa)
            return '<div class="lw-school">' + leer('learn', 'Ausbildung noch nicht eingerichtet', 'Die additive Vorlage erstellt normale Seiten und Datenbanken für Fächer, Prüfungen, Noten und Material.', 'school-install', 'Ausbildung einrichten') + '</div>';
        const faecher = fachZeilen();
        const fokus = faecher.find(item => item.row.id === zustand.fachId);
        if (fokus)
            return fachAnsicht(fokus);
        const tasks = sichtbareAufgaben().filter(item => !item.fertig).slice(0, 8);
        const exams = pruefungen().filter(item => item.tage === null || item.tage >= 0).slice(0, 6);
        const themen = liste(statistik().topics).slice(0, 8);
        const hw = hausaufgaben();
        const offeneHw = hw.filter(item => !item.erledigt);
        const ziele = lernziele();
        const gradeEntries = sammlungsEintraege('grades', 'medal', 6);
        const reportEntries = sammlungsEintraege('reports', 'clipboard', 6);
        const materialEntries = sammlungsEintraege('materials', 'library', 8);
        return '<div class="lw-school"><header class="lw-page-head"><div><p>Schule / Ausbildung</p><h2>' +
            esc(root?.text || 'Ausbildung') + '</h2><span>Fächer, Unterricht, Material und Lernen in einer gemeinsamen Sicht.</span></div>' +
            '<div class="lw-actions"><button type="button" data-lw-action="capture">Material erfassen</button>' +
            (root
                ? '<button type="button" data-lw-open="' + esc(root.id) + '">Ausbildungsseite öffnen</button>'
                : '<button type="button" class="is-primary" data-lw-action="school-install">Ausbildung einrichten</button>') +
            '</div></header>' +
            (root ? '' : '<aside class="lw-note"><strong>Das hier kommt aus deinem vorhandenen Bestand.</strong>' +
                '<p>Eine Ausbildungsseite gibt es noch nicht. Die Vorlage legt sie zusätzlich an — ' +
                'sie ersetzt nichts und löscht nichts.</p></aside>') +
            (faecher.length || root ? '<section class="lw-subject-grid" aria-label="Fächer">' +
                (faecher.length ? faecher.map(item => {
                    const cards = lernkarten().filter(card => fachVon(card).toLowerCase().includes(item.titel.toLowerCase()));
                    const progress = cards.length
                        ? Math.round(cards.reduce((summe, card) => summe + Math.min(2, zahl(card?.sr?.wdh)), 0) /
                            (cards.length * 2) * 100)
                        : 0;
                    return '<button type="button" data-lw-subject="' + esc(item.row.id) + '">' + zeichenSpan('book') +
                        '<strong>' + esc(item.titel) + '</strong><small>' + cards.length + ' Karten · ' + progress +
                        ' %</small><progress max="100" value="' + progress + '" aria-label="Fortschritt ' +
                        esc(item.titel) + '"></progress></button>';
                }).join('') : '<div class="lw-subject-empty"><p>Noch keine Fächer angelegt.</p>' +
                    '<button type="button" data-lw-open="' + esc(root?.id || '') + '">Fächer hinzufügen</button>' +
                    '</div>') + '</section>' : '') +
            '<div class="lw-dashboard-grid">' +
            sektion('Hausaufgaben', hausaufgabenListe(hw.slice(0, 8), 'Keine Hausaufgabe eingetragen.') +
                (hausaufgabenSammlungen().length
                    ? '<button type="button" class="lw-alle" data-lw-action="homework-open">Alle Hausaufgaben</button>' : ''), offeneHw.length ? offeneHw.length + ' offen' : '') +
            sektion('Lernziele', lernzielListe(ziele.slice(0, 8), 'Noch kein Lernziel festgehalten.') +
                (lernzielSammlungen().length
                    ? '<button type="button" class="lw-alle" data-lw-action="goals-open">Alle Lernziele</button>' : '')) +
            sektion('Aktuelle Themen', themenListe(themen, 8), 'aus deinen Lernkarten') +
            sektion('Aufgaben', aufgabenListe(tasks, 'Keine offene Ausbildungsaufgabe.')) +
            sektion('Prüfungen', exams.length ? '<ul class="lw-object-list">' + exams.map(item => '<li><button type="button" data-lw-exam="' + esc(item.id) + '">' + zeichenSpan('clipboard', 'lw-object-icon') +
                '<span><strong>' + esc(item.titel) + '</strong><small>' + esc(item.datum ? datumText(item.datum) :
                'Termin offen') + '</small></span><span>›</span></button></li>').join('') + '</ul>' :
                '<p class="lw-none">Keine Prüfung geplant.</p>') +
            sektion('Material & PDFs', eintragListe(eindeutige([...materialEntries, ...sichtbarePdfs()], item => item.id)
                .slice(0, 8), 'Noch kein Lernmaterial abgelegt.')) +
            sektion('Noten', eintragListe(gradeEntries, 'Noch keine Note eingetragen.')) +
            sektion('Berichtsheft', eintragListe(reportEntries, 'Noch kein Berichtsheft-Eintrag.')) +
            '</div><div class="lw-quick">' +
            '<button type="button" data-lw-nav="stundenplan">' + zeichenSpan('calendar') + 'Stundenplan</button>' +
            '<button type="button" data-lw-nav="lernen">' + zeichenSpan('cards') + 'Lernkarten</button>' +
            '<button type="button" data-lw-nav="fortschritt">' + zeichenSpan('chart') + 'Lernfortschritt</button></div></div>';
    };
    const passendeBereiche = (art) => bereiche().filter(item => {
        const text = (item.art + ' ' + item.name).toLowerCase();
        return art === 'uni' ? /uni|stud|hochschule|semester/.test(text) : /arbeit|work|beruf|firma/.test(text);
    });
    const domainingEintraege = (muster, icon, limit = 12) => {
        const ausgabe = [];
        alleBloecke().filter(block => block.type === 'page' && imBereich(block)).forEach(page => {
            const text = [page.text, page.systemRole, page.art, page.kind, ...textListe(page.tags)].join(' ');
            if (!muster.test(text))
                return;
            ausgabe.push({
                id: String(page.id),
                titel: String(page.text || 'Ohne Titel'),
                icon: String(page.icon || icon),
                zeit: String(page.edited || page.created || ''),
                untertitel: 'Gemeinsame Redion-Seite',
                bereichIds: direkteBereichIds(page)
            });
        });
        Object.values(Store.cache.collections).forEach(collection => {
            if (!muster.test(String(collection?.name || '')))
                return;
            Store.rowsOf(collection.id).forEach((row) => {
                if (!row || row.alive === false || !darfLesen(row) || !imBereich(row))
                    return;
                ausgabe.push({
                    id: String(row.id),
                    titel: zeilenTitel(row, collection),
                    icon,
                    zeit: String(row.edited || row.created || ''),
                    untertitel: String(collection.name || ''),
                    bereichIds: direkteBereichIds(row)
                });
            });
        });
        return eindeutige(ausgabe, item => item.id).slice(0, limit);
    };
    const uniAnsicht = () => {
        const uniBereiche = passendeBereiche('uni');
        const module = domainingEintraege(/semester|modul|vorlesung|übung|uebung|literatur|studium/i, 'building');
        const tasks = sichtbareAufgaben().filter(item => !item.fertig).slice(0, 8);
        const exams = pruefungen().filter(item => item.tage === null || item.tage >= 0).slice(0, 6);
        return '<div class="lw-domain"><header class="lw-page-head"><div><p>Uni</p><h2>Studium im selben Workspace</h2>' +
            '<span>Semester, Module, Vorlesungen und Literatur sind Ansichten auf normale Redion-Objekte.</span></div>' +
            '<button type="button" data-lw-action="new-page">Neue Studiennotiz</button></header>' +
            (!uniBereiche.length && zustand.bereichId === 'alle'
                ? '<aside class="lw-note"><strong>Noch kein Uni-Bereich zugeordnet.</strong><p>Du kannst vorhandene Seiten später einem Uni-Bereich zuordnen – ohne sie zu kopieren.</p></aside>'
                : '') +
            '<div class="lw-dashboard-grid">' +
            sektion('Semester & Module', eintragListe(module, 'Noch kein Semester oder Modul gefunden.'), 'Seiten und Datenbankzeilen') +
            sektion('Vorlesungen & Notizen', eintragListe(dokumente().slice(0, 10), 'Noch keine Studiennotiz.'), 'zuletzt bearbeitet') +
            sektion('Übungen & Aufgaben', aufgabenListe(tasks, 'Keine offene Übung oder Aufgabe.')) +
            sektion('Prüfungen', exams.length ? '<ul class="lw-object-list">' + exams.map(item => '<li><button type="button" data-lw-exam="' + esc(item.id) + '">' + zeichenSpan('clipboard', 'lw-object-icon') +
                '<span><strong>' + esc(item.titel) + '</strong><small>' + esc(item.fach || datumText(item.datum)) +
                '</small></span><span>›</span></button></li>').join('') + '</ul>' : '<p class="lw-none">Keine Prüfung geplant.</p>') +
            sektion('Literatur & PDFs', eintragListe(sichtbarePdfs(), 'Noch keine Literatur oder PDF zugeordnet.')) +
            sektion('Lernkarten', themenListe(liste(statistik().topics), 8), 'persönlicher Lernstand') +
            '</div></div>';
    };
    const arbeitAnsicht = () => {
        const arbeitBereiche = passendeBereiche('arbeit');
        const meetings = alleBloecke().filter(block => block.type === 'page' && block.besprechung && imBereich(block))
            .sort((a, b) => String(b.created || '').localeCompare(String(a.created || ''))).slice(0, 8)
            .map(page => ({
            id: String(page.id), titel: String(page.text || 'Meeting'), icon: String(page.icon || 'mic'),
            zeit: String(page.created || ''), untertitel: 'Meeting-Notiz', bereichIds: direkteBereichIds(page)
        }));
        const wissen = domainingEintraege(/entscheidung|wissensbasis|knowledge|offene punkte|projekt/i, 'briefcase');
        return '<div class="lw-domain"><header class="lw-page-head"><div><p>Arbeit</p><h2>Projekte, Meetings und Wissen</h2>' +
            '<span>Professionelle Arbeitssicht auf dieselben Seiten, Aufgaben, Termine und Dateien.</span></div>' +
            '<div class="lw-actions"><button type="button" data-lw-action="meeting">Meeting-Notiz</button>' +
            '<button type="button" data-lw-action="new-page">Neue Arbeitsnotiz</button></div></header>' +
            (!arbeitBereiche.length && zustand.bereichId === 'alle'
                ? '<aside class="lw-note"><strong>Noch kein Arbeitsbereich zugeordnet.</strong><p>Ordne bestehende Projekte und Dokumente einem Arbeitsbereich zu, statt Kopien anzulegen.</p></aside>'
                : '') +
            '<div class="lw-dashboard-grid">' +
            sektion('Projekte', eintragListe(sichtbareProjekte(), 'Noch kein laufendes Projekt zugeordnet.')) +
            sektion('Offene Aufgaben', aufgabenListe(sichtbareAufgaben().filter(item => !item.fertig).slice(0, 10), 'Keine offene Arbeitsaufgabe.')) +
            sektion('Meetings', eintragListe(meetings, 'Noch keine Meeting-Notiz.'), 'bestehendes Besprechungssystem') +
            sektion('Termine', terminListe(sichtbareTermine().slice(0, 8), 'Kein Arbeitstermin gefunden.')) +
            sektion('Dokumente & PDFs', eintragListe(eindeutige([...sichtbarePdfs(), ...dokumente()], item => item.id)
                .slice(0, 10), 'Noch kein Dokument zugeordnet.')) +
            sektion('Wissensbasis & Entscheidungen', eintragListe(wissen, 'Noch keine Entscheidung oder Wissensseite gefunden.')) +
            '</div></div>';
    };
    const fortschrittAnsicht = () => {
        const stats = statistik();
        const spiel = aktivitaet();
        const ktx = kennzahlKontext({ stats, spiel });
        const wissen = stats.total ? Math.round(lernkarten().reduce((summe, card) => summe + Math.min(2, zahl(card?.sr?.wdh)), 0) / (stats.total * 2) * 100) : 0;
        return '<div class="lw-progress-page"><header class="lw-page-head"><div><p>Fortschritt</p><h2>Wissen nachvollziehbar messen</h2>' +
            '<span>SM-2-Wissensstand und Motivation werden bewusst getrennt dargestellt.</span></div></header>' +
            '<section class="lw-knowledge"><header><div><p>Fachlicher Stand</p><h3>Persönlicher Lernfortschritt</h3></div>' +
            '<strong>' + wissen + ' %</strong></header>' + fortschritt(wissen, 'Gesamter Wissensstand') +
            '<div class="lw-metrics">' + merkbar('stabile-karten', ktx) + merkbar('aktuell-faellig', ktx) +
            merkbar('themen-mit-fehlern', ktx) + merkbar('naechster-termin', ktx) + '</div></section>' +
            '<section class="lw-engagement"><header><div><p>Aktivität</p><h3>Routine &amp; Motivation</h3></div>' +
            '<span>kein fachlicher Nachweis</span></header><div class="lw-metrics">' +
            merkbar('lernzeit', ktx) + merkbar('wiederholungen-woche', ktx) + merkbar('streak', ktx) +
            merkbar('aktivitaets-xp', ktx) + merkbar('level', ktx) + '</div>' + fortschritt(spiel.wochenProzent, 'Wochenziel') + '</section>' +
            '<div class="lw-dashboard-grid">' +
            sektion('Themenfortschritt', themenListe(liste(stats.topics), 40), 'SM-2, nicht XP') +
            sektion('Wochenverlauf', historie(liste(stats.logs), 7), stats.reviewedToday + ' heute') +
            sektion('Monatsverlauf', historie(liste(stats.logs), 30), spiel.monat + ' Wiederholungen im Monat') +
            '</div><aside class="lw-note"><strong>So wird gerechnet</strong><p>Eine begonnene Karte zählt halb, ab zwei erfolgreichen Wiederholungen stabil. Ein Fehler setzt die Wiederholungsstufe wie im bestehenden SM-2-Verfahren zurück. Aktivitäts-XP verändert diese Zahl nie.</p></aside></div>';
    };
    const trainerAnsicht = () => typeof Trainer !== 'undefined'
        ? '<div class="lw-trainer" id="lw-trainer"></div>'
        : '<section class="lw-empty"><h2>Der Trainer ist nicht geladen</h2><p>quell/bereiche/wissen/trainer.js fehlt.</p></section>';
    const ansichtsInhalt = () => {
        if (zustand.training)
            return trainingAnsicht();
        if (zustand.simulation)
            return simulationAnsicht();
        switch (zustand.ansicht) {
            case 'heute': return heuteAnsicht();
            case 'lernen': return lernzentrumAnsicht();
            case 'lernweg': return lernpfadAnsicht();
            case 'fehler': return fehlerAnsicht();
            case 'pruefungen': return pruefungenAnsicht();
            case 'noten': return notenAnsicht();
            case 'stundenplan': return stundenplanAnsicht();
            case 'schule': return schuleAnsicht();
            case 'uni': return uniAnsicht();
            case 'arbeit': return arbeitAnsicht();
            case 'fortschritt': return fortschrittAnsicht();
            case 'trainer': return trainerAnsicht();
        }
        return heuteAnsicht();
    };
    const timerStoppen = () => {
        if (zustand.timer !== null)
            window.clearInterval(zustand.timer);
        zustand.timer = null;
    };
    const simulationZeitAktualisieren = () => {
        const simulation = zustand.simulation;
        if (!simulation || simulation.fertig) {
            timerStoppen();
            return;
        }
        if (!zustand.root?.querySelector('.lernwelt, .lw-main')) {
            timerStoppen();
            return;
        }
        const rest = Math.max(0, simulation.endet - Date.now());
        if (rest <= 0) {
            simulationAbschliessen(simulation);
            zeichnen();
            return;
        }
        const uhr = zustand.root.querySelector('.lw-session-head time');
        if (uhr)
            uhr.textContent = String(Math.floor(rest / 60000)).padStart(2, '0') + ':' +
                String(Math.floor((rest % 60000) / 1000)).padStart(2, '0');
    };
    const timerStarten = () => {
        timerStoppen();
        if (!zustand.simulation || zustand.simulation.fertig)
            return;
        zustand.timer = window.setInterval(simulationZeitAktualisieren, 1000);
    };
    const zeichnen = () => {
        const root = zustand.root;
        if (!root)
            return;
        root.className = 'produkt-welt lernwelt';
        root.dataset.lwView = zustand.ansicht;
        root.innerHTML = kopf() + '<main class="lw-main ansicht-herein" id="lernwelt-inhalt" tabindex="-1">' +
            ansichtsInhalt() + '</main>';
        if (typeof Register !== 'undefined' && Register.symbole) {
            Register.symbole.fuelle(root);
        }
        if (typeof Funkel !== 'undefined')
            Funkel.alle(root, '.is-primary[data-lw-train], .is-primary[data-lw-nav="lernen"], .lw-study-actions button');
        verlaufBeleben(root, zustand.ansicht);
        if (zustand.simulation && !zustand.simulation.fertig)
            timerStarten();
        else
            timerStoppen();
        reiterRollstand();
        const satz = root.querySelector('.lw-desk h2');
        const gleiten = neuAngekommen;
        neuAngekommen = false;
        if (satz && typeof Linse !== 'undefined' && Linse.ueberSatz) {
            requestAnimationFrame(() => { if (satz.isConnected)
                Linse.ueberSatz(satz, gleiten); });
        }
        if (typeof Trainer !== 'undefined') {
            const platz = zustand.ansicht === 'trainer' ? root.querySelector('#lw-trainer') : null;
            if (platz)
                Trainer.render(platz, { aktor: aktor().id });
            else
                Trainer.abmelden();
        }
        ladeBereichsdaten();
    };
    const reiterRollstand = () => {
        const leiste = zustand.root?.querySelector('.lw-nav') || null;
        Rollrand.binde(leiste, { art: 'mehr' });
        Rollrand.zeige(leiste, leiste?.querySelector('[aria-current="page"]') || null);
    };
    const ansichtGueltig = (wert) => ANSICHTEN.some(item => item.id === wert);
    const wechseln = (ansicht) => {
        zustand.ansicht = ansicht;
        zustand.training = null;
        zustand.simulation = null;
        zustand.fachId = ansicht === 'schule' ? zustand.fachId : '';
        zustand.extern = null;
        zustand.ladeSchluessel = '';
        Store.setMeta(metaSchluessel('ansicht'), ansicht);
        zeichnen();
        zustand.root?.querySelector('#lernwelt-inhalt')?.focus();
    };
    const mischen = (karten, limit) => {
        if (!karten.length)
            return [];
        const schluessel = Number(tag(new Date()).replace(/-/g, '')) || 1;
        return [...karten].sort((a, b) => {
            const aWert = [...String(a.id || '')].reduce((summe, zeichen) => summe + (zeichen.codePointAt(0) || 0), schluessel);
            const bWert = [...String(b.id || '')].reduce((summe, zeichen) => summe + (zeichen.codePointAt(0) || 0), schluessel);
            return aWert - bWert || String(a.id).localeCompare(String(b.id));
        }).slice(0, Math.max(1, limit));
    };
    const trainingStarten = (art, einzelneId = '') => {
        const queue = warteschlange();
        let karten = [];
        let titel = 'Lernrunde';
        if (art === 'today') {
            karten = queue.all;
            titel = 'Tagesrunde';
        }
        if (art === 'errors') {
            karten = fehlerListe().filter(item => !item.stabil).map(item => item.card);
            titel = 'Fehlertraining';
        }
        if (art === 'new') {
            karten = queue.newCards;
            titel = 'Neue Karten';
        }
        if (art === 'topic') {
            karten = lernkarten().filter(card => themaVon(card).toLowerCase() === String(zustand.themaId).toLowerCase() ||
                themaVon(card).toLocaleLowerCase('de-CH').replace(/[^a-z0-9]+/g, '-') === zustand.themaId);
            const thema = liste(statistik().topics).find(item => item.id === zustand.themaId);
            titel = thema ? 'Thema: ' + thema.label : 'Themenrunde';
        }
        if (art === 'exam') {
            const naechste = pruefungen().find(item => item.tage !== null && item.tage >= 0)
                || pruefungen().find(item => item.tage === null) || null;
            karten = naechste ? nurPassendeKarten(naechste) : [];
            titel = naechste ? 'Prüfungsfokus: ' + naechste.titel : 'Prüfungsfokus';
        }
        if (art === 'single') {
            const card = lernkarten().find(item => String(item.id) === einzelneId);
            karten = card ? [card] : [];
            titel = 'Einzelfehler';
        }
        if (!karten.length) {
            UI.toast('Für diese Runde gibt es gerade keine Karten.');
            return;
        }
        zustand.simulation = null;
        zustand.training = {
            titel,
            karten: karten.map(karteMitStand),
            index: 0,
            aufgedeckt: false,
            bewertet: 0,
            beschaeftigt: false
        };
        zeichnen();
    };
    const SIM_MAX = 20;
    const simulationen = () => {
        const roh = Store.getMeta(metaSchluessel('simulationen'), []);
        return Array.isArray(roh)
            ? roh.filter((x) => x && typeof x === 'object' && Number(x.gesamt) > 0)
            : [];
    };
    const simulationAbschliessen = (simulation) => {
        simulation.fertig = true;
        if (!simulation.antworten.length)
            return;
        const themen = new Map();
        simulation.antworten.forEach(item => {
            const wert = themen.get(item.thema) || { gesamt: 0, fehler: 0 };
            wert.gesamt++;
            if (!item.richtig)
                wert.fehler++;
            themen.set(item.thema, wert);
        });
        const eintrag = {
            id: 'sim-' + simulation.gestartet,
            pruefungId: simulation.pruefungId,
            titel: simulation.titel,
            beendet: new Date().toISOString(),
            richtig: simulation.antworten.filter(item => item.richtig).length,
            gesamt: simulation.antworten.length,
            dauerMin: Math.max(1, Math.round((Date.now() - simulation.gestartet) / 60000)),
            themen: [...themen.entries()].map(([thema, wert]) => ({ thema, gesamt: wert.gesamt, fehler: wert.fehler }))
        };
        const vorher = simulationen().filter(item => item.id !== eintrag.id);
        Store.setMeta(metaSchluessel('simulationen'), [eintrag, ...vorher].slice(0, SIM_MAX));
    };
    const simulationStarten = (id) => {
        const pruefung = pruefungen().find(item => item.id === id) || null;
        const eigene = pruefung ? nurPassendeKarten(pruefung) : [];
        const karten = eigene.length ? eigene : lernkarten();
        const anzahl = Math.min(pruefung ? 30 : 15, karten.length);
        if (!anzahl) {
            UI.toast('Für eine Simulation fehlen noch Lernkarten.');
            return;
        }
        if (pruefung && !eigene.length)
            UI.toast('Zu „' + pruefung.titel + '" passt keine Karte. Die Simulation nimmt ' +
                'deshalb aus allen ' + karten.length + ' Karten.', 4200);
        const dauer = pruefung?.dauer || Math.max(10, anzahl * 2);
        const gestartet = Date.now();
        zustand.training = null;
        zustand.simulation = {
            titel: pruefung?.titel || 'Wochenprüfung',
            pruefungId: pruefung?.id || '',
            karten: mischen(karten, anzahl),
            index: 0,
            aufgedeckt: false,
            gestartet,
            endet: gestartet + dauer * 60000,
            antworten: [],
            fertig: false
        };
        zustand.ansicht = 'pruefungen';
        zeichnen();
    };
    const neuZuordnen = async (record) => {
        if (!record || zustand.bereichId === 'alle')
            return;
        const api = lebensbereiche();
        if (!api || typeof api.zuordnen !== 'function')
            return;
        try {
            await api.zuordnen({ art: 'page', id: String(record.id) }, zustand.bereichId);
        }
        catch {
            UI.toast('Die Bereichszuordnung konnte nicht gespeichert werden.');
        }
    };
    const externOeffnen = (id) => {
        if (!id)
            return;
        abmelden();
        App.oeffne(id);
    };
    const quelleOeffnen = (cardId) => {
        const card = Store.getBlock(cardId);
        if (!card)
            return;
        abmelden();
        if (typeof Learning !== 'undefined' && Learning.jumpToSource)
            Learning.jumpToSource(card);
        else
            App.zeigeBlock(card.id);
    };
    const aktionAusfuehren = async (aktion) => {
        if (aktion === 'goal') {
            const antwort = await UI.frage('Wie viele Karten möchtest du täglich wiederholen?', String(tagesziel()));
            const neu = Math.max(1, Math.min(500, Math.round(zahl(antwort, tagesziel()))));
            Store.setMeta(metaSchluessel('tagesziel'), neu);
            zeichnen();
            return;
        }
        if (aktion === 'training-reveal' && zustand.training) {
            zustand.training.aufgedeckt = true;
            zeichnen();
            return;
        }
        if (aktion === 'training-close') {
            zustand.training = null;
            zeichnen();
            return;
        }
        if (aktion === 'simulation-reveal' && zustand.simulation) {
            zustand.simulation.aufgedeckt = true;
            zeichnen();
            return;
        }
        if (aktion === 'simulation-close') {
            zustand.simulation = null;
            zeichnen();
            return;
        }
        if (aktion === 'subject-back') {
            zustand.fachId = '';
            zeichnen();
            return;
        }
        if (aktion === 'nav-lernen') {
            wechseln('lernen');
            return;
        }
        if (aktion === 'tasks') {
            abmelden();
            Bibliothek.aufgaben();
            return;
        }
        if (aktion === 'library') {
            abmelden();
            Bibliothek.oeffne();
            return;
        }
        if (aktion === 'import') {
            Bibliothek.pdfImportieren();
            return;
        }
        if (aktion === 'calendar') {
            if (typeof Kalender !== 'undefined' && Kalender.dialog)
                Kalender.dialog();
            else
                UI.toast('Der Kalender ist noch nicht verfügbar.');
            return;
        }
        if (aktion === 'capture') {
            if (typeof Recognition !== 'undefined' && Recognition.scan)
                Recognition.scan();
            else
                UI.toast('Die Erfassung ist noch nicht verfügbar.');
            return;
        }
        if (aktion === 'meeting') {
            if (typeof Meeting !== 'undefined' && Meeting.panel)
                Meeting.panel();
            else
                UI.toast('Besprechungen sind noch nicht verfügbar.');
            return;
        }
        if (aktion === 'learning-classic') {
            if (typeof Learning !== 'undefined' && Learning.open)
                Learning.open();
            return;
        }
        if (aktion === 'school-setup') {
            wechseln('schule');
            return;
        }
        if (aktion === 'school-install') {
            if (typeof Galerie === 'undefined' || !Galerie.bauen)
                return;
            const page = Galerie.bauen('ausbildung');
            if (page) {
                App.zeichneBaum();
                zustand.fachId = '';
                zeichnen();
            }
            return;
        }
        const sammlungSeiteOeffnen = (sammlung) => {
            if (!sammlung)
                return;
            const block = Object.values(Store.cache.blocks).find(b => b?.type === 'database' && b.collectionId === sammlung.id && b.alive !== false);
            const ziel = block ? (block.parentTable === 'block' ? block.parentId : block.id) : null;
            if (ziel)
                App.oeffne(String(ziel));
        };
        if (aktion === 'grades-open') {
            sammlungSeiteOeffnen(notenSammlungen()[0]);
            return;
        }
        if (aktion === 'timetable-open') {
            sammlungSeiteOeffnen(stundenplanSammlungen()[0]);
            return;
        }
        if (aktion === 'homework-open') {
            sammlungSeiteOeffnen(hausaufgabenSammlungen()[0]);
            return;
        }
        if (aktion === 'goals-open') {
            sammlungSeiteOeffnen(lernzielSammlungen()[0]);
            return;
        }
        if (aktion === 'new-page') {
            const titel = zustand.ansicht === 'uni' ? 'Studiennotiz' : 'Arbeitsnotiz';
            const icon = zustand.ansicht === 'uni' ? 'building' : 'briefcase';
            const page = Store.addPage(null, { text: titel, icon });
            await neuZuordnen(page);
            externOeffnen(page.id);
        }
    };
    const klick = (event) => {
        const element = event.target instanceof Element ? event.target : null;
        if (!element)
            return;
        const merk = element.closest('[data-lw-merk]');
        if (merk?.dataset.lwMerk) {
            kennzahlMerken(merk, merk.dataset.lwMerk);
            return;
        }
        const nav = element.closest('[data-lw-nav]');
        const navId = nav?.dataset.lwNav;
        if (ansichtGueltig(navId)) {
            wechseln(navId);
            return;
        }
        const hwKnopf = element.closest('[data-lw-hw-done]');
        if (hwKnopf?.dataset.lwHwDone) {
            const rowId = hwKnopf.dataset.lwHwDone;
            const eintrag = hausaufgaben().find(item => item.id === rowId);
            if (eintrag && eintrag.doneKey) {
                Store.setProp(rowId, eintrag.doneKey, !eintrag.erledigt);
                zeichnen();
            }
            return;
        }
        const open = element.closest('[data-lw-open]');
        if (open?.dataset.lwOpen) {
            externOeffnen(open.dataset.lwOpen);
            return;
        }
        const action = element.closest('[data-lw-action]');
        if (action?.dataset.lwAction) {
            void aktionAusfuehren(action.dataset.lwAction);
            return;
        }
        const zeitraum = element.closest('[data-lw-zeitraum]');
        const zeitraumWert = zeitraum?.dataset.lwZeitraum;
        if (zeitraumWert === 'aktuell' || zeitraumWert === 'vorher' || zeitraumWert === 'alle') {
            zustand.notenZeitraum = zeitraumWert;
            zeichnen();
            return;
        }
        const train = element.closest('[data-lw-train]');
        if (train?.dataset.lwTrain) {
            trainingStarten(train.dataset.lwTrain);
            return;
        }
        const trainCard = element.closest('[data-lw-train-card]');
        if (trainCard?.dataset.lwTrainCard) {
            trainingStarten('single', trainCard.dataset.lwTrainCard);
            return;
        }
        const source = element.closest('[data-lw-card-source]');
        if (source?.dataset.lwCardSource) {
            quelleOeffnen(source.dataset.lwCardSource);
            return;
        }
        const topic = element.closest('[data-lw-topic]');
        if (topic?.dataset.lwTopic) {
            zustand.themaId = topic.dataset.lwTopic;
            wechseln('lernen');
            return;
        }
        const pathTopic = element.closest('[data-lw-path-topic]');
        if (pathTopic?.dataset.lwPathTopic) {
            zustand.themaId = pathTopic.dataset.lwPathTopic;
            zustand.ansicht = 'lernen';
            trainingStarten('topic');
            return;
        }
        const subject = element.closest('[data-lw-subject]');
        if (subject?.dataset.lwSubject) {
            zustand.fachId = subject.dataset.lwSubject;
            zeichnen();
            return;
        }
        const exam = element.closest('[data-lw-exam]');
        if (exam?.dataset.lwExam) {
            zustand.ansicht = 'pruefungen';
            zustand.simulation = null;
            zeichnen();
            const ziel = [...(zustand.root?.querySelectorAll('[data-lw-simulate]') || [])]
                .find(button => button.dataset.lwSimulate === exam.dataset.lwExam);
            ziel?.focus();
            return;
        }
        const simulate = element.closest('[data-lw-simulate]');
        if (simulate?.dataset.lwSimulate) {
            simulationStarten(simulate.dataset.lwSimulate);
            return;
        }
        const simAnswer = element.closest('[data-lw-sim-answer]');
        if (simAnswer?.dataset.lwSimAnswer && zustand.simulation) {
            const card = zustand.simulation.karten[zustand.simulation.index];
            zustand.simulation.antworten.push({
                cardId: String(card.id),
                richtig: simAnswer.dataset.lwSimAnswer === 'right',
                thema: themaVon(card)
            });
            zustand.simulation.index++;
            zustand.simulation.aufgedeckt = false;
            if (zustand.simulation.index >= zustand.simulation.karten.length)
                simulationAbschliessen(zustand.simulation);
            zeichnen();
            return;
        }
        const simErrors = element.closest('[data-lw-simulation-errors]');
        if (simErrors && zustand.simulation) {
            const ids = new Set(zustand.simulation.antworten.filter(item => !item.richtig).map(item => item.cardId));
            const karten = zustand.simulation.karten.filter(card => ids.has(String(card.id)));
            zustand.simulation = null;
            zustand.training = {
                titel: 'Fehler aus der Simulation', karten, index: 0, aufgedeckt: false, bewertet: 0, beschaeftigt: false
            };
            zeichnen();
            return;
        }
        const rate = element.closest('[data-lw-rate]');
        if (rate?.dataset.lwRate && zustand.training && !zustand.training.beschaeftigt) {
            const note = zahl(rate.dataset.lwRate);
            const training = zustand.training;
            const card = training.karten[training.index];
            training.beschaeftigt = true;
            zeichnen();
            void karteBewerten(card, note).then(() => {
                if (zustand.training !== training)
                    return;
                training.bewertet++;
                training.index++;
                training.aufgedeckt = false;
                training.beschaeftigt = false;
                zeichnen();
            }).catch((fehler) => {
                training.beschaeftigt = false;
                UI.banner(fehler instanceof Error ? fehler.message : String(fehler), 'warn');
                zeichnen();
            });
        }
    };
    const aenderung = (event) => {
        const select = event.target instanceof HTMLSelectElement && event.target.matches('[data-lw-area]')
            ? event.target
            : null;
        if (!select)
            return;
        const gueltig = bereiche().some(item => item.id === select.value);
        zustand.bereichId = gueltig ? select.value : 'alle';
        zustand.extern = null;
        zustand.ladeSchluessel = '';
        zustand.fachId = '';
        zustand.themaId = '';
        Store.setMeta(metaSchluessel('bereich'), zustand.bereichId);
        zeichnen();
    };
    const taste = (event) => {
        if (!zustand.root?.isConnected)
            return;
        if (!zustand.root.classList.contains('lernwelt') &&
            !zustand.root.querySelector('.lernwelt'))
            return;
        const ziel = event.target instanceof HTMLElement ? event.target : null;
        if (ziel?.matches('input, textarea, select, [contenteditable="true"]'))
            return;
        if (!zustand.training)
            return;
        const aufKnopf = !!ziel?.closest('button, a');
        if (!zustand.training.aufgedeckt && !aufKnopf &&
            (event.key === ' ' || event.key === 'Enter')) {
            event.preventDefault();
            zustand.training.aufgedeckt = true;
            zeichnen();
            return;
        }
        if (zustand.training.aufgedeckt && /^[1-4]$/.test(event.key)) {
            event.preventDefault();
            zustand.root.querySelector('[data-lw-rate="' + event.key + '"]')?.click();
        }
    };
    const abmelden = () => {
        timerStoppen();
        zustand.generation++;
        if (typeof Trainer !== 'undefined')
            Trainer.abmelden();
        if (zustand.root) {
            zustand.root.removeEventListener('click', klick);
            zustand.root.removeEventListener('change', aenderung);
        }
        document.removeEventListener('keydown', taste);
        zustand.root = null;
    };
    let neuAngekommen = false;
    const render = (ziel, ansicht) => {
        abmelden();
        neuAngekommen = true;
        zustand.root = ziel;
        const gespeichert = Store.getMeta(metaSchluessel('ansicht'), 'heute');
        zustand.ansicht = ansichtGueltig(ansicht) ? ansicht
            : ansichtGueltig(gespeichert) ? gespeichert : 'heute';
        const bereichGespeichert = String(Store.getMeta(metaSchluessel('bereich'), 'alle'));
        zustand.bereichId = bereiche().some(item => item.id === bereichGespeichert) ? bereichGespeichert : 'alle';
        zustand.training = null;
        zustand.simulation = null;
        zustand.extern = null;
        zustand.ladeSchluessel = '';
        ziel.addEventListener('click', klick);
        ziel.addEventListener('change', aenderung);
        document.addEventListener('keydown', taste);
        zeichnen();
    };
    const oeffnen = (ansicht = 'heute') => {
        const start = ansichtGueltig(ansicht) ? ansicht : 'heute';
        const titel = start === 'heute' ? 'Heute' : 'Lernzentrum';
        App.zeigeSonder(titel, (ziel) => render(ziel, start));
    };
    const aktualisieren = () => {
        zustand.extern = null;
        zustand.ladeSchluessel = '';
        zeichnen();
    };
    return {
        ansichten: ANSICHTEN.map(item => ({ ...item })),
        oeffnen,
        render,
        wechseln,
        aktualisieren,
        zerstoeren: abmelden,
        trainingStarten,
        simulationStarten,
        modelle: {
            bereiche,
            warteschlange,
            statistik,
            simulationen,
            kennzahlenGemerkt,
            kennzahlen: () => Object.entries(KENNZAHLEN).map(([id, eintrag]) => ({ id, name: eintrag.name, allein: eintrag.allein ?? eintrag.name })),
            fehler: fehlerListe,
            pruefungen,
            aufgaben: sichtbareAufgaben,
            termine: sichtbareTermine,
            zuletzt: sichtbareZuletzt,
            projekte: sichtbareProjekte,
            pdfs: sichtbarePdfs,
            aktivitaet
        }
    };
})();
window.Lernwelt = Lernwelt;
