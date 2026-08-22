"use strict";
/* ============================================================================
 * ki-kontext.js — Kontext, Berechtigung und Suche für die KI
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/ki/kontext.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/ki/kontext.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Das ist die Schicht, die in Notion zwischen deiner Frage und dem Modell
 * sitzt. Sie beantwortet drei Fragen, bevor das Modell überhaupt etwas sieht:
 *
 *   1. WELCHE QUELLEN sind erlaubt?        → Kontext-Schicht
 *   2. WAS DARF ICH DAVON LESEN?           → Berechtigungsschicht
 *   3. WELCHE STELLEN PASSEN ZUR FRAGE?    → Suche / Retrieval
 *
 * Zusammen ist das RAG: das Modell weiss nichts über deinen Arbeitsbereich,
 * es bekommt die passenden Ausschnitte gereicht und schreibt daraus eine
 * Antwort — mit Quellen, damit man nachsehen kann.
 *
 * DIE SUCHE
 *   Ohne fremden Dienst gibt es keine echten Embeddings. Statt so zu tun,
 *   als gäbe es welche, steht hier ein Verfahren, das man versteht:
 *
 *     · BM25          zählt Wörter, gewichtet seltene Wörter höher
 *     · Wortstämme    „Ziele", „Ziel", „Zielen" gelten als dasselbe
 *     · Verwandte     eine kleine Wortverwandtschaft für den Alltag
 *     · Dreiergruppen fängt Tippfehler und Wortformen ab
 *     · Frische       was zuletzt bearbeitet wurde, zählt etwas mehr
 *
 *   Wer echte Embeddings will und einen Schlüssel hat, schaltet sie in den
 *   KI-Einstellungen ein — dann werden die Vektoren einmal berechnet und
 *   im Browser abgelegt. Beides läuft nebeneinander.
 * ==========================================================================*/
const Kontext = (() => {
    /* ------------------------------------------------------------------------
     * WORTARBEIT
     * ----------------------------------------------------------------------*/
    const STOPP = new Set(('der die das ein eine einer eines einem einen und oder aber ' +
        'ist sind war waren sein hat habe haben hatte wird werden wurde in im am an auf ' +
        'aus bei mit von vor nach zu zur zum für über unter durch gegen ohne um es er sie ' +
        'ich du wir ihr mir mich dir dich uns euch sich als also auch noch nur schon wenn ' +
        'dass weil denn doch mal man nicht kein keine dem den des this that the and or of ' +
        'to in is are was were be has have with for from at on by').split(' '));
    /** Ein grober Stammschnitt fürs Deutsche. Nicht perfekt, aber verlässlich. */
    const stamm = (w) => {
        let s = w;
        if (s.length > 6)
            s = s.replace(/(ungen|heiten|keiten|lich|isch|ische|ischen)$/, '');
        if (s.length > 5)
            s = s.replace(/(ung|heit|keit|nis|tum)$/, '');
        if (s.length > 4)
            s = s.replace(/(en|er|es|em|ern|st)$/, '');
        if (s.length > 3)
            s = s.replace(/(e|n|s|t)$/, '');
        return s;
    };
    /* Ein paar Verwandtschaften, die im Alltag ständig gebraucht werden.
       Das ersetzt keine Embeddings, hilft aber genau dort, wo es zählt. */
    const VERWANDT = {
        ziel: ['vorhaben', 'plan', 'vorsatz', 'okr', 'absicht', 'wunsch'],
        aufgab: ['todo', 'task', 'erledig', 'punkt', 'arbeit', 'job'],
        termin: ['datum', 'kalender', 'treffen', 'meeting', 'besprech'],
        training: ['sport', 'fitness', 'gym', 'ubung', 'workout', 'laufen'],
        ernahrung: ['essen', 'kalorien', 'mahlzeit', 'kcal', 'protein'],
        projekt: ['vorhaben', 'arbeit', 'auftrag', 'sache'],
        notiz: ['aufzeichn', 'memo', 'gedank', 'eintrag'],
        geld: ['finanz', 'kosten', 'budget', 'rechnung', 'preis', 'euro'],
        lernen: ['studi', 'uben', 'kurs', 'wissen', 'karteikart'],
        entscheid: ['beschluss', 'festgeleg', 'abgemacht'],
        problem: ['fehler', 'schwierig', 'block', 'hindernis'],
        kunde: ['klient', 'auftraggeb', 'mandant'],
        mail: ['email', 'nachricht', 'post', 'schreib']
    };
    const zerlegen = (text) => String(text || '')
        .toLowerCase()
        .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
        .split(/[^a-z0-9]+/)
        .filter(w => w.length > 2 && !STOPP.has(w))
        .map(stamm)
        .filter(Boolean);
    /** Die Frage um verwandte Wörter erweitern — das ist der semantische Teil. */
    const erweitern = (woerter) => {
        const raus = new Set(woerter);
        woerter.forEach((w) => {
            Object.keys(VERWANDT).forEach(k => {
                const verwandte = VERWANDT[k] ?? [];
                if (w.startsWith(k) || k.startsWith(w)) {
                    raus.add(k);
                    verwandte.forEach((v) => raus.add(stamm(v)));
                }
                if (verwandte.some((v) => stamm(v) === w))
                    raus.add(k);
            });
        });
        return [...raus];
    };
    const dreier = (w) => {
        const s = ' ' + w + ' ';
        const raus = [];
        for (let i = 0; i < s.length - 2; i++)
            raus.push(s.slice(i, i + 3));
        return raus;
    };
    /* ------------------------------------------------------------------------
     * DER INDEX — PERSISTENT, INKREMENTELL, REPARIERBAR
     * ------------------------------------------------------------------------
     * Jede Seite und jede Datenbankzeile wird ein Eintrag. Die Einträge liegen
     * im IndexedDB-Fach `suchindex`; Blöcke und Sammlungen bleiben jedoch immer
     * die Wahrheit. Ein fehlender, alter oder unlesbarer Eintrag wird aus ihnen
     * neu gebaut. Kein Reparaturweg schreibt jemals Nutzerdaten.
     * ----------------------------------------------------------------------*/
    const INDEX_FASSUNG = 1;
    const KOPF_ID = '@suchindex';
    let index = null;
    let letzterDatenStand = -1;
    let letzterBericht = null;
    let schreibkette = Promise.resolve();
    let letzterSchreibfehler = '';
    /** Zwei kleine, unabhängige 32-Bit-Prüfsummen. Kein Sicherheits-Hash —
        nur eine billige Antwort auf „hat sich diese Quelle verändert?". */
    const signatur = (teile) => {
        let a = 2166136261, b = 0x9e3779b9;
        for (const teil of teile) {
            const s = String(teil ?? '') + '\u0000';
            for (let i = 0; i < s.length; i++) {
                const c = s.charCodeAt(i);
                a = Math.imul(a ^ c, 16777619) >>> 0;
                b = (Math.imul(b ^ (c + i), 2246822519) + 3266489917) >>> 0;
            }
        }
        return a.toString(36) + '-' + b.toString(36);
    };
    const spaeter = (a, b) => String(a || '') > String(b || '') ? a : b;
    /** Inhalt plus Quellenstand. Der Stand enthält auch Text und Reihenfolge;
        dadurch heilt der Index sogar Sicherungen, deren `edited`-Zeitstempel
        fälschlich gleich geblieben ist. */
    const inhaltVonSeite = (seiteId) => {
        const text = [], teile = [];
        let geaendert = '';
        const hinab = (id, tiefe) => {
            if (tiefe > 3)
                return;
            Store.childrenOf(id).forEach((k) => {
                if (!k.alive || k.type === 'page')
                    return; /* Unterseite = eigener Eintrag */
                geaendert = spaeter(geaendert, k.edited || k.created || '');
                /* `suchtext` gehört mit in die Signatur, sonst merkt der Index nicht,
                   dass eine PDF-Seite ihren Text bekommen hat (E124). */
                teile.push(k.id, k.type, k.edited, k.alive, k.text, k.suchtext, Array.isArray(k.rows) ? JSON.stringify(k.rows) : '', Array.isArray(k.content) ? k.content.join(',') : '');
                if (k.type === 'database') {
                    const c = Store.getCollection(k.collectionId);
                    if (c) {
                        text.push(c.name || '');
                        teile.push(c.id, c.name, c.edited, JSON.stringify(c.schema || {}));
                    }
                    return;
                }
                if (k.text)
                    text.push(k.text);
                /* EINE PDF-SEITE HAT KEINEN `text` — sie ist ein Bild. Ihr Wortlaut
                   steht seit E107 in `suchtext`, und `Store.search` liest ihn auch.
                   Der Index hier tat es nicht: die Suche im Fenster fand ein
                   eingelesenes Skript nicht mehr, während `Store.search` es fand.
                   Zwei Suchen mit zwei Antworten sind schlimmer als eine schlechte. */
                if (k.suchtext)
                    text.push(k.suchtext);
                if (Array.isArray(k.rows))
                    text.push(k.rows.flat().join(' '));
                if ((k.content || []).length)
                    hinab(k.id, tiefe + 1);
            });
        };
        hinab(seiteId, 0);
        return { text: text.join(' '), stand: signatur(teile), geaendert };
    };
    const textVonSeite = (seiteId) => inhaltVonSeite(seiteId).text;
    const wortdaten = (text) => {
        const woerter = zerlegen(text);
        const zaehler = {};
        woerter.forEach(w => { zaehler[w] = (zaehler[w] || 0) + 1; });
        return { zaehler, laenge: woerter.length };
    };
    /** Ein Durchgang über `blocks`, keine Vollsuche je Sammlung. */
    const indexQuellen = () => {
        const raus = [];
        Object.values(Store.cache.blocks).forEach(b => {
            if (!b.alive || b.type !== 'page')
                return;
            const innen = inhaltVonSeite(b.id);
            if (b.parentTable === 'collection') {
                const c = Store.getCollection(b.parentId);
                if (!c)
                    return;
                raus.push({ art: 'zeile', b, c, innen,
                    stand: signatur([b.id, b.text, b.edited, JSON.stringify(b.props || {}),
                        c.id, c.name, c.edited, JSON.stringify(c.schema || {}), innen.stand]) });
                return;
            }
            const pfad = Store.pfadText(b.id);
            raus.push({ art: 'seite', b, innen, pfad,
                stand: signatur([b.id, b.text, b.edited, b.alive, pfad, innen.stand]) });
        });
        return raus;
    };
    const eintragVon = (q) => {
        const b = q.b;
        if (q.art === 'seite') {
            const roh = (b.text || '') + ' ' + q.innen.text;
            return {
                id: b.id, seiteId: b.id, art: 'seite', stand: q.stand,
                titel: b.text || 'Ohne Titel', pfad: q.pfad,
                text: roh.slice(0, 6000),
                geaendert: spaeter(b.edited || b.created || '', q.innen.geaendert),
                ...wortdaten((b.text || '') + ' ' + (b.text || '') + ' ' + roh)
            };
        }
        const c = q.c;
        const felder = Object.keys(c.schema || {})
            .filter(k => !['formula', 'rollup', 'uid', 'button'].includes(c.schema[k].type))
            .map(k => c.schema[k].name + ': ' + Formula.anzeige(Datenbank.wert(b, k, c)))
            .join(' · ');
        const roh = (b.text || '') + ' ' + felder + ' ' + q.innen.text;
        return {
            id: b.id, seiteId: b.id, art: 'zeile', datenbank: c.name, stand: q.stand,
            titel: b.text || 'Ohne Titel', pfad: c.name,
            text: roh.slice(0, 4000),
            geaendert: spaeter(b.edited || b.created || '', q.innen.geaendert),
            ...wortdaten((b.text || '') + ' ' + c.name + ' ' + roh)
        };
    };
    const gueltig = (e) => !!e && typeof e.id === 'string' &&
        typeof e.stand === 'string' && (e.art === 'seite' || e.art === 'zeile') &&
        e.zaehler && typeof e.zaehler === 'object' && Number.isFinite(e.laenge);
    const indexAus = (eintraege, bericht) => {
        const df = new Map();
        const posting = new Map();
        let gesamt = 0;
        eintraege.forEach((e, nr) => {
            gesamt += e.laenge || 0;
            Object.keys(e.zaehler || {}).forEach(w => {
                df.set(w, (df.get(w) || 0) + 1);
                if (!posting.has(w))
                    posting.set(w, []);
                posting.get(w).push(nr);
            });
        });
        return { eintraege, df, posting,
            laengeSchnitt: gesamt / Math.max(1, eintraege.length),
            anzahl: eintraege.length, bericht };
    };
    const kopf = (anzahl) => ({
        id: KOPF_ID, art: 'kopf', fassung: INDEX_FASSUNG,
        anzahl, gebaut: new Date().toISOString()
    });
    const schreibe = (tun) => {
        /* Immer in Reihenfolge: ein langsamer Vollaufbau darf nicht nachträglich
           einen jüngeren inkrementellen Stand überschreiben. */
        schreibkette = schreibkette.catch(() => undefined).then(tun).then(() => {
            letzterSchreibfehler = '';
        }, (err) => {
            letzterSchreibfehler = err instanceof Error ? err.message : String(err);
            if (typeof Reporter !== 'undefined')
                Reporter.warn('Suche', 'Der Suchindex bleibt für diese Sitzung im Arbeitsspeicher', err);
        });
    };
    const abgleichen = (allesNeu = false) => {
        const begonnen = performance.now();
        const gespeichert = Store.cache.suchindex || {};
        const alterKopf = gespeichert[KOPF_ID];
        const fassungStimmt = !!alterKopf && alterKopf.fassung === INDEX_FASSUNG;
        const alt = {};
        if (!allesNeu && fassungStimmt)
            Object.values(gespeichert).forEach(e => {
                if (e && e.id !== KOPF_ID)
                    alt[e.id] = e;
            });
        const eintraege = [], setzen = [], gesehen = new Set();
        let neu = 0, geaendert = 0, wiederverwendet = 0, repariert = 0;
        indexQuellen().forEach(q => {
            gesehen.add(q.b.id);
            const vorher = alt[q.b.id];
            if (gueltig(vorher) && vorher.stand === q.stand) {
                eintraege.push(vorher);
                wiederverwendet++;
                return;
            }
            const e = eintragVon(q);
            eintraege.push(e);
            setzen.push(e);
            if (!vorher)
                neu++;
            else if (!gueltig(vorher))
                repariert++;
            else
                geaendert++;
        });
        const loeschen = Object.keys(alt).filter(id => !gesehen.has(id));
        eintraege.sort((a, b) => a.id.localeCompare(b.id));
        const bericht = {
            fassung: INDEX_FASSUNG, anzahl: eintraege.length, neu, geaendert,
            geloescht: loeschen.length, wiederverwendet, repariert,
            quelle: fassungStimmt && !allesNeu ? 'persistiert' : 'neu',
            ms: Math.round((performance.now() - begonnen) * 10) / 10
        };
        letzterBericht = bericht;
        index = indexAus(eintraege, bericht);
        letzterDatenStand = Store.datenFassung ? Store.datenFassung() : 0;
        const k = kopf(eintraege.length);
        if (allesNeu || !fassungStimmt)
            schreibe(() => Store.suchindexErsetzen([k, ...eintraege]));
        else if (setzen.length || loeschen.length || alterKopf.anzahl !== eintraege.length)
            schreibe(() => Store.suchindexAendern([k, ...setzen], loeschen));
        return index;
    };
    /** Der ausdrückliche Neuaufbau aus den Nutzerdaten. */
    const bauen = () => abgleichen(true);
    const holen = (frisch = false) => {
        const stand = Store.datenFassung ? Store.datenFassung() : 0;
        if (frisch)
            return bauen();
        if (!index || stand !== letzterDatenStand)
            return abgleichen(false);
        return index;
    };
    const reparieren = () => {
        index = null;
        return abgleichen(true);
    };
    const warten = async () => { await schreibkette; return status(); };
    const status = () => ({
        fassung: INDEX_FASSUNG,
        persistierteFassung: Store.cache.suchindex?.[KOPF_ID]?.fassung || 0,
        persistiert: Math.max(0, Object.keys(Store.cache.suchindex || {}).length - 1),
        bericht: letzterBericht,
        schreibfehler: letzterSchreibfehler
    });
    /** Kandidaten für Quick Find. `null` bedeutet: nicht sicher eingrenzbar,
        also den echten Bestand vollständig prüfen. Eine leere Liste bedeutet:
        die Wortmengen sind sicher disjunkt. So verliert der Cache nie Treffer. */
    const kandidaten = (frage) => {
        const ix = holen();
        const ws = [...new Set(zerlegen(frage))];
        if (!ws.length)
            return null;
        let menge = null;
        for (const w of ws) {
            const liste = ix.posting.get(w);
            if (!liste)
                return null;
            const seiten = new Set(liste.filter((nr) => ix.eintraege[nr]?.art === 'seite'));
            if (menge === null)
                menge = seiten;
            else {
                const vorher = Array.from(menge);
                menge = new Set(vorher.filter((nr) => seiten.has(nr)));
            }
            if (!menge.size)
                return [];
        }
        return [...(menge || [])].map(nr => ix.eintraege[nr].seiteId);
    };
    /* ------------------------------------------------------------------------
     * SUCHE
     * ----------------------------------------------------------------------*/
    const bm25 = (eintrag, frageWoerter, ix) => {
        const k1 = 1.5, b = 0.75;
        let punkte = 0;
        frageWoerter.forEach((w) => {
            const tf = eintrag.zaehler?.[w] || 0;
            if (!tf)
                return;
            const n = ix.df.get(w) || 0;
            const idf = Math.log(1 + (ix.anzahl - n + 0.5) / (n + 0.5));
            punkte += idf * (tf * (k1 + 1)) /
                (tf + k1 * (1 - b + b * eintrag.laenge / Math.max(1, ix.laengeSchnitt)));
        });
        return punkte;
    };
    /** Dreiergruppen fangen ab, was der Stammschnitt verfehlt. */
    const unschaerfe = (eintrag, frageWoerter) => {
        if (!frageWoerter.length)
            return 0;
        const ziel = new Set();
        Object.keys(eintrag.zaehler || {}).slice(0, 400)
            .forEach((w) => dreier(w).forEach(d => ziel.add(d)));
        let treffer = 0, gesamt = 0;
        frageWoerter.forEach((w) => {
            const d = dreier(w);
            gesamt += d.length;
            d.forEach(x => { if (ziel.has(x))
                treffer++; });
        });
        return gesamt ? treffer / gesamt : 0;
    };
    /**
     * Findet die Stellen, die zur Frage passen.
     * @param frage   die Frage im Klartext
     * @param opt     { anzahl, quellen, nurSeite }
     */
    const finden = (frage, opt = {}) => {
        const ix = holen(opt.frisch);
        const roh = zerlegen(frage);
        const woerter = erweitern(roh);
        if (!woerter.length)
            return [];
        const jetzt = Date.now();
        const q = quellen();
        /* Die invertierte Wortliste macht den Normalfall abhängig von der Zahl
           der Treffer, nicht von der Zahl aller Seiten. Nur wenn kein Wort exakt
           vorkommt, läuft die absichtlich teurere Tippfehler-Gegenprobe. */
        const nummern = new Set();
        woerter.forEach(w => (ix.posting.get(w) || []).forEach((nr) => nummern.add(nr)));
        const pool = nummern.size
            ? [...nummern].map(nr => ix.eintraege[nr]).filter(Boolean)
            : ix.eintraege;
        const bewertet = pool.map((e) => {
            /* --- Berechtigungsschicht: was nicht gelesen werden darf, fliegt raus */
            if (!Konten.darf('lesen', e.seiteId))
                return null;
            if (opt.nurSeite && e.seiteId !== opt.nurSeite && !istUnter(e.seiteId, opt.nurSeite))
                return null;
            if (e.art === 'zeile' && !q.datenbanken)
                return null;
            if (e.art === 'seite' && !q.arbeitsbereich)
                return null;
            const basis = bm25(e, woerter, ix);
            const fuzzy = basis > 0 ? 0 : unschaerfe(e, roh);
            if (basis <= 0 && fuzzy < 0.34)
                return null;
            const titelWoerter = zerlegen(e.titel);
            const imTitel = roh.filter(w => titelWoerter.includes(w)).length;
            const alter = (jetzt - new Date(e.geaendert || 0).getTime()) / 86400000;
            const frische = alter < 400 ? (1 - alter / 400) * 0.9 : 0;
            const punkte = basis
                + imTitel * 2.2 /* Titeltreffer wiegen schwer */
                + fuzzy * 1.6
                + frische
                + (e.seiteId === App.aktuelleSeite() ? 1.4 : 0);
            return { ...e, punkte };
        }).filter(Boolean);
        bewertet.sort((a, b) => b.punkte - a.punkte);
        return bewertet.slice(0, opt.anzahl || 8);
    };
    const istUnter = (id, elternId) => {
        let cur = Store.getBlock(id), n = 0;
        while (cur && n++ < 30) {
            if (cur.id === elternId)
                return true;
            cur = cur.parentId ? Store.getBlock(cur.parentId) : null;
        }
        return false;
    };
    /* ------------------------------------------------------------------------
     * AUSSCHNITTE
     * ------------------------------------------------------------------------
     * Nicht die ganze Seite ans Modell geben, sondern die Stelle, um die es
     * geht. Spart Platz und macht die Antwort genauer.
     * ----------------------------------------------------------------------*/
    const ausschnitt = (eintrag, frage, laenge = 700) => {
        const woerter = zerlegen(frage);
        const saetze = String(eintrag.text || '').split(/(?<=[.!?])\s+|\n+/).filter(s => s.trim());
        if (!saetze.length)
            return String(eintrag.text || '').slice(0, laenge);
        const bewertet = saetze.map((s, i) => {
            const w = zerlegen(s);
            const treffer = woerter.filter(x => w.includes(x)).length;
            return { s, i, treffer };
        });
        bewertet.sort((a, b) => b.treffer - a.treffer || a.i - b.i);
        const genommen = [];
        let laengeJetzt = 0;
        bewertet.forEach(x => {
            if (laengeJetzt > laenge)
                return;
            genommen.push(x);
            laengeJetzt += x.s.length;
        });
        genommen.sort((a, b) => a.i - b.i);
        const text = genommen.map(x => x.s.trim()).join(' … ');
        return text.slice(0, laenge + 200);
    };
    /* ------------------------------------------------------------------------
     * QUELLEN — einzeln ein- und ausschaltbar
     * ----------------------------------------------------------------------*/
    const QUELLEN_STANDARD = {
        aktuelleSeite: true,
        arbeitsbereich: true,
        datenbanken: true,
        verbindungen: true,
        web: false
    };
    const quellen = () => Object.assign({}, QUELLEN_STANDARD, Store.getMeta('ki:quellen', {}) || {});
    const quelleSetzen = (k, an) => {
        const q = quellen();
        q[k] = an;
        Store.setMeta('ki:quellen', q);
    };
    /* ------------------------------------------------------------------------
     * DER FERTIGE KONTEXT FÜR DAS MODELL
     * ----------------------------------------------------------------------*/
    const bauenFuerFrage = (frage, opt = {}) => {
        const q = quellen();
        const teile = [];
        const quellenListe = [];
        /* 1. Die Seite, auf der man gerade steht */
        if (q.aktuelleSeite && App.aktuelleSeite()) {
            const p = Store.getBlock(App.aktuelleSeite());
            if (p && Konten.darf('lesen', p.id)) {
                const t = (p.text || 'Ohne Titel') + '\n' + textVonSeite(p.id).slice(0, 2500);
                teile.push('## Die offene Seite\n' + t);
                quellenListe.push({ id: p.id, titel: p.text || 'Ohne Titel',
                    art: 'Offene Seite', geaendert: p.edited });
            }
        }
        /* 2. Der Rest des Arbeitsbereichs — gesucht, nicht komplett */
        if (q.arbeitsbereich || q.datenbanken) {
            const treffer = finden(frage, { anzahl: opt.anzahl || 6, nurSeite: opt.nurSeite });
            treffer.forEach((t) => {
                if (t.seiteId === App.aktuelleSeite() && q.aktuelleSeite)
                    return;
                teile.push('## ' + t.titel + (t.datenbank ? ' (aus ' + t.datenbank + ')' : '') +
                    '\n' + ausschnitt(t, frage));
                quellenListe.push({ id: t.seiteId, titel: t.titel,
                    art: t.art === 'zeile' ? ('Eintrag · ' + t.datenbank) : t.pfad || 'Seite',
                    geaendert: t.geaendert, punkte: Math.round(t.punkte * 10) / 10 });
            });
        }
        return {
            text: teile.join('\n\n'),
            quellen: quellenListe,
            leer: !teile.length
        };
    };
    /* ------------------------------------------------------------------------
     * ECHTE EMBEDDINGS — nur, wenn jemand sie will und einen Schlüssel hat
     * ----------------------------------------------------------------------*/
    const embeddingsAn = () => !!Store.getMeta('ki:embeddings', false);
    const embeddingHolen = async (texte) => {
        const anbieter = Store.getMeta('ki:embAnbieter', 'gemini');
        if (anbieter === 'gemini') {
            const key = Store.getMeta('api:gemini', '');
            if (!key)
                throw new Error('Für Embeddings fehlt der Gemini-Schlüssel.');
            const raus = [];
            for (const t of texte) {
                const d = await Verbindungen.jsonRuf('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent', { method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
                    body: JSON.stringify({ content: { parts: [{ text: t.slice(0, 8000) }] } }) });
                raus.push(d.embedding?.values || []);
            }
            return raus;
        }
        const key = Store.getMeta('api:openai', '');
        if (!key)
            throw new Error('Für Embeddings fehlt der OpenAI-Schlüssel.');
        const d = await Verbindungen.jsonRuf('https://api.openai.com/v1/embeddings', {
            token: key, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'text-embedding-3-small',
                input: texte.map((t) => t.slice(0, 8000)) })
        });
        return (d.data || []).map((x) => x.embedding);
    };
    const cosinus = (a, b) => {
        let p = 0, na = 0, nb = 0;
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            const x = a[i] ?? 0, y = b[i] ?? 0;
            p += x * y;
            na += x * x;
            nb += y * y;
        }
        return (na && nb) ? p / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
    };
    /** Alle Seiten einmal durchrechnen. Dauert, kostet ein paar Cent, hält lange. */
    const embeddingsBauen = async (beiFortschritt) => {
        const ix = holen(true);
        const gemerkt = Store.getMeta('ki:vektoren', {}) || {};
        const offen = ix.eintraege.filter((e) => !gemerkt[e.id] ||
            gemerkt[e.id].stand !== String(e.geaendert));
        if (!offen.length)
            return { neu: 0, gesamt: Object.keys(gemerkt).length };
        let n = 0;
        for (let i = 0; i < offen.length; i += 8) {
            const gruppe = offen.slice(i, i + 8);
            const v = await embeddingHolen(gruppe.map((e) => e.titel + '\n' + e.text.slice(0, 3000)));
            gruppe.forEach((e, k) => {
                if (v[k] && v[k].length)
                    gemerkt[e.id] = { v: v[k], stand: String(e.geaendert) };
            });
            n += gruppe.length;
            if (beiFortschritt)
                beiFortschritt(n, offen.length);
            Store.setMeta('ki:vektoren', gemerkt);
        }
        return { neu: n, gesamt: Object.keys(gemerkt).length };
    };
    const findenMitVektoren = async (frage, anzahl = 8) => {
        const gemerkt = Store.getMeta('ki:vektoren', {}) || {};
        if (!Object.keys(gemerkt).length)
            return finden(frage, { anzahl });
        const [fv] = await embeddingHolen([frage]);
        const ix = holen();
        const raus = ix.eintraege.map((e) => {
            const g = gemerkt[e.id];
            if (!g)
                return null;
            if (!Konten.darf('lesen', e.seiteId))
                return null;
            return { ...e, punkte: cosinus(fv, g.v) * 10 };
        }).filter(Boolean);
        raus.sort((a, b) => b.punkte - a.punkte);
        return raus.slice(0, anzahl);
    };
    return { bauen, abgleichen, reparieren, holen, warten, status, kandidaten,
        finden, findenMitVektoren, ausschnitt, bauenFuerFrage,
        quellen, quelleSetzen, QUELLEN_STANDARD, zerlegen, stamm, erweitern,
        embeddingsAn, embeddingsBauen, embeddingHolen, cosinus, textVonSeite };
})();
window.Kontext = Kontext;
