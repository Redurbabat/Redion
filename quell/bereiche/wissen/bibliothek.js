"use strict";
/* ============================================================================
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/wissen/bibliothek.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/wissen/bibliothek.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * ==========================================================================*/
/* ==========================================================================
 * bibliothek.js — Bibliothek, Meine Aufgaben, Marktplatz
 *
 * Notion hat unten in der Seitenleiste einen eigenen Abschnitt: Bibliothek,
 * Meine Aufgaben, Marktplatz, Hilfe, Papierkorb. Die ersten beiden sind
 * vollwertige Seiten — keine Fenster. Genau so ist es hier gebaut.
 *
 * Bibliothek      alle Seiten in einer Tabelle, mit Reitern und Sortierung
 * Meine Aufgaben  alles, was dem angemeldeten Konto zugewiesen ist,
 *                 quer über alle Datenbanken hinweg
 * ========================================================================*/
const Bibliothek = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const rightsActive = () => typeof Konten !== 'undefined' && typeof Konten.darf === 'function';
    const permitted = (action, pageId) => !rightsActive() || (pageId ? Konten.darf(action, pageId) : Konten.darf(action));
    /** Die kanonische Datenbankseite, nicht eine verknüpfte Zweitansicht. */
    const collectionPageId = (collectionId) => {
        const blocks = Object.values(Store.cache.blocks)
            .filter(block => block?.alive !== false && block.type === 'database' &&
            block.collectionId === collectionId);
        const block = blocks.find(item => !item.verknuepft) || blocks[0];
        if (!block || typeof Links === 'undefined' || !Links.seiteVon)
            return '';
        return String(Links.seiteVon(block.id)?.id || '');
    };
    const collectionPermitted = (action, collectionId) => {
        if (!rightsActive())
            return true;
        const pageId = collectionPageId(collectionId);
        return !!pageId && permitted(action, pageId);
    };
    /* ------------------------------------------------------------------ *
     * Hilfen
     * ------------------------------------------------------------------ */
    /** Alle echten Seiten — ohne Systemseiten, ohne Papierkorb. */
    const alleSeiten = () => Object.values(Store.cache.blocks)
        .filter(b => b.type === 'page' && b.alive !== false && !b.system &&
        (b.parentTable === 'collection'
            ? collectionPermitted('lesen', b.parentId)
            : permitted('lesen', b.id)));
    /** Woher kommt die Seite: aus einer Datenbank, aus einem Bereich, privat? */
    const quelleVon = (p) => {
        if (p.parentTable === 'collection') {
            const c = Store.cache.collections[p.parentId];
            return { icon: '▦', text: c ? c.name : 'Datenbank', id: c ? c.id : '' };
        }
        if (p.bereich) {
            const b = (Store.getMeta('bereiche', []) || []).find((x) => x.id === p.bereich);
            if (b)
                return { icon: b.icon || '👥', text: b.name, id: '' };
        }
        const pfad = Store.pathOf(p.id);
        if (pfad.length > 1) {
            const sichtbar = pfad.slice(0, -1).find((item) => permitted('lesen', item.id));
            if (sichtbar)
                return { icon: sichtbar.icon || '📄', text: sichtbar.text || 'Ohne Titel', id: sichtbar.id };
            return { icon: '👥', text: 'Direkt freigegeben', id: '' };
        }
        return { icon: '🔒', text: 'Privat', id: '' };
    };
    /** Zeitstempel als Zahl — egal ob ISO-Text oder Millisekunden. */
    const zeitZahl = (wann) => {
        if (!wann)
            return 0;
        const ms = typeof wann === 'number' ? wann : Date.parse(String(wann));
        return isNaN(ms) ? 0 : ms;
    };
    const wannText = (wann) => {
        if (!wann)
            return '—';
        /* Zeitstempel liegen als ISO-Text vor, nicht als Zahl. */
        const ms = typeof wann === 'number' ? wann : Date.parse(String(wann));
        if (isNaN(ms))
            return '—';
        const d = Math.floor((Date.now() - ms) / 60000);
        if (d < 1)
            return 'gerade eben';
        if (d < 60)
            return 'vor ' + d + 'm';
        if (d < 1440)
            return 'vor ' + Math.floor(d / 60) + 'h';
        if (d < 10080)
            return 'vor ' + Math.floor(d / 1440) + ' Tagen';
        return new Date(ms).toLocaleDateString('de-CH', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    /* ------------------------------------------------------------------ *
     * BIBLIOTHEK
     * ------------------------------------------------------------------ */
    const REITER = [
        /* DIE ABLAGE IST DER ERSTE REITER UND DIE VORGABE (E380).
           Redur hat vier Fotos aus GoodNotes geschickt: dort ist „Dokumente"
           die ABLAGE — die Wurzel mit ihren Ordnern, und ein Tipp auf einen
           Ordner führt eine Ebene tiefer. Redion zeigte an derselben Stelle
           „Kürzlich verwendet", und das ist eine flache Liste über den GANZEN
           Bestand: ein Ordner stand dort neben seinem eigenen Inhalt.
    
           Die übrigen Reiter bleiben absichtlich flach. „Kürzlich verwendet"
           und „Favoriten" sind Fragen über alles, nicht über eine Ebene —
           genau wie in GoodNotes, wo sie unten als eigene Wege stehen. */
        { id: 'ablage', icon: '🗂', name: 'Ablage' },
        { id: 'kuerzlich', icon: '🕘', name: 'Kürzlich verwendet' },
        { id: 'favoriten', icon: '☆', name: 'Favoriten' },
        { id: 'geteilt', icon: '👥', name: 'Geteilt' },
        { id: 'privat', icon: '🔒', name: 'Privat' },
        { id: 'schule', icon: '🎓', name: 'Ausbildung' },
        { id: 'datenbank', icon: '▦', name: 'In Datenbanken' },
        { id: 'alle', icon: '▤', name: 'Alle' }
    ];
    const SPALTEN = [
        { id: 'name', icon: '📄', name: 'Seitenbezeichnung', breit: '2fr' },
        { id: 'von', icon: '👤', name: 'Erstellt von', breit: '1fr' },
        { id: 'quelle', icon: '📍', name: 'Quelle', breit: '1.2fr' },
        { id: 'wann', icon: '🕘', name: 'Zuletzt bearbeitet', breit: '1fr' }
    ];
    /* REGAL ODER LISTE (E207).
       Die Bibliothek war eine Tabelle: dreizehn Zeilen, in jeder ein Titel und
       dreimal dieselbe Auskunft („Ich", „gerade eben"). Man liest darin nicht,
       man sucht — und man muss den Titel schon kennen, um ihn zu finden.
  
       Der abgenommene Entwurf zeigt stattdessen ein Regal: je Heft eine Karte,
       und auf jeder Karte steht der ANFANG der Seite, an der zuletzt gearbeitet
       wurde. Das ist dieselbe Antwort wie in „Weiter wo du warst" (E205), nur
       für den ganzen Bestand.
  
       Die Tabelle bleibt vollständig erhalten und ist einen Klick entfernt.
       Sie kann etwas, das das Regal nicht kann — nach Spalten sortieren,
       Eigenschaften ein- und ausblenden, viele Zeilen auf einmal überblicken.
       Was gebraucht wird, entscheidet nicht die Form, sondern die Frage. */
    /**
     * Welche Form ist gewählt?
     *
     * DIESER WERT WIRD BEIM ZEICHNEN GELESEN UND NICHT BEIM LADEN. Der erste
     * Entwurf legte ihn als `zustand.form = formLesen()` an — und diese Zeile
     * läuft, während die Datei geladen wird, also lange bevor IndexedDB
     * ausgelesen ist. `getMeta` gab damals brav den Standard zurück, und die
     * gemerkte Wahl war beim nächsten Start weg: wer „Liste" wählte, bekam
     * wieder das Regal.
     *
     * Gefunden hat es das Bild — ich hatte im Bildskript ausdrücklich „liste"
     * gesetzt und bekam ein Regal. Kein Wurf, keine Meldung; dieselbe Sorte
     * stiller Fehler wie `Store` an `window` (E207, `vorschau.ts`).
     */
    const form = () => {
        const wahl = Store.getMeta('bibForm', 'deckel');
        return wahl === 'liste' ? 'liste' : wahl === 'regal' ? 'regal' : 'deckel';
    };
    /** Wo das Regal gerade steht — null ist die Wurzel. Gemerkt über das
     *  Neuladen hinweg, wie das offene Fach des Heftregals (E282). */
    const ORDNER_SCHLUESSEL = 'bibOrdner';
    const ordnerLesen = () => {
        if (typeof Store === 'undefined' || !Store.getMeta)
            return null;
        const id = String(Store.getMeta(ORDNER_SCHLUESSEL, '') || '');
        if (!id)
            return null;
        /* EIN GELÖSCHTER ORDNER FÜHRT AN DIE WURZEL, NICHT INS NICHTS.
           Dieselbe Regel wie beim Heftregal (test276): ein gemerkter Ort, den
           es nicht mehr gibt, ist kein Ort. */
        const p = Store.getBlock(id);
        return (p && p.alive !== false) ? id : null;
    };
    let zustand = { reiter: 'ablage', ordner: null,
        sortier: 'wann', richtung: 'ab',
        suche: '', sucheOffen: false, spalten: SPALTEN.map(s => s.id),
        /* Der Artfilter der Deckelansicht (E236). Er steht NEBEN
           `reiter`, nicht darin: der Reiter fragt „wo liegt es",
           die Art fragt „was ist es". Zwei Fragen, zwei Filter. */
        art: 'alle' };
    /** Eine zusammengefuehrte Sicht auf bestehende Redion-Daten. Sie speichert
        weder Dashboard-Karten noch PDF-Kopien; alle Listen sind begrenzt. */
    const zeichneSchule = (wrap) => {
        const blocks = Object.values(Store.cache.blocks);
        const root = blocks.find(block => block?.alive !== false && block.type === 'page' &&
            (block.schoolRoot === true || block.systemRole === 'school-root') && permitted('lesen', block.id));
        if (!root) {
            wrap.innerHTML = '<div class="school-home school-empty"><div class="school-empty-icon">🎓</div>' +
                '<h1>Ausbildungsbereich</h1><p>Lege die additive Ausbildungsvorlage an. Sie erstellt normale Seiten und Datenbanken.</p>' +
                '<button data-school-action="install" class="prim">Ausbildung einrichten</button></div>';
            wrap.querySelector('[data-school-action="install"]')?.addEventListener('click', () => {
                if (!permitted('bearbeiten')) {
                    UI.toast('Du darfst hier keinen Ausbildungsbereich anlegen.');
                    return;
                }
                const page = Galerie.bauen('ausbildung');
                if (page) {
                    App.zeichneBaum();
                    App.oeffne(page.id);
                }
            });
            return;
        }
        const children = Store.childrenOf(root.id)
            .filter((block) => block.alive !== false && block.type === 'page' &&
            block.parentTable !== 'collection' && permitted('lesen', block.id))
            .slice(0, 18);
        const documentPages = new Map();
        blocks.filter(block => block?.alive !== false && block.type === 'pdfseite')
            .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))
            .forEach(block => {
            if (documentPages.size >= 6)
                return;
            const page = Links.seiteVon(block.id);
            if (page && permitted('lesen', page.id) && !documentPages.has(page.id))
                documentPages.set(page.id, { page, block });
        });
        const due = typeof Learning !== 'undefined' && Learning.dailyQueue
            ? Learning.dailyQueue().all.slice(0, 6)
            : (Werkzeuge.faellig ? Werkzeuge.faellig().slice(0, 6) : []);
        const tasks = meineAufgaben().filter(task => !task.fertig).slice(0, 6);
        const examCollections = Object.values(Store.cache.collections)
            .filter(collection => collection.schoolRootId === root.id && collection.schoolKind === 'exams' &&
            collectionPermitted('lesen', collection.id));
        const exams = [];
        const now = Date.now(), horizon = now + 120 * 86400000;
        examCollections.forEach(collection => {
            const dateKey = Object.keys(collection.schema || {}).find(key => collection.schema[key].type === 'date');
            if (!dateKey)
                return;
            Store.rowsOf(collection.id).forEach((row) => {
                const date = Date.parse(String(row.props?.[dateKey] || ''));
                if (Number.isFinite(date) && date >= now - 86400000 && date <= horizon)
                    exams.push({ row, date, collection });
            });
        });
        exams.sort((a, b) => a.date - b.date);
        const list = (items, make, empty) => items.length ? items.map(make).join('') : '<p class="school-none">' + esc(empty) + '</p>';
        wrap.innerHTML =
            '<div class="school-home">' +
                '<div class="school-hero"><div><span>🎓 Ausbildung</span><h1>' + esc(root.text || 'Ausbildung') +
                '</h1><p>Seiten, Lernstoff und Termine an einem Ort – alles bleibt normale Redion-Struktur.</p></div>' +
                '<div class="school-quick"><button data-school-action="capture">📷 Erfassen</button>' +
                '<button data-school-action="learn">🎴 Lernen</button>' +
                '<button data-school-action="calculate">⚡ Rechnen</button>' +
                '<button data-school-open="' + esc(root.id) + '">↗ Seite öffnen</button></div></div>' +
                '<section class="school-section"><h2>Ordner & Bereiche</h2><div class="school-folders">' +
                list(children, page => '<button class="school-folder" data-school-open="' + esc(page.id) + '">' +
                    '<span>' + esc(page.icon || '📁') + '</span><b>' + esc(page.text || 'Ohne Titel') + '</b>' +
                    '<em>' + Store.childrenOf(page.id).filter((child) => child.type !== 'page' ||
                    permitted('lesen', child.id)).length + ' Einträge</em></button>', 'Noch keine Unterseiten.') + '</div></section>' +
                '<div class="school-grid">' +
                '<section class="school-card"><h2>Zuletzt verwendete PDFs</h2>' +
                list([...documentPages.values()], item => '<button data-school-doc="' + esc(item.page.id) + '">' +
                    '<span>📄</span><b>' + esc(item.page.text || 'PDF-Seite') + '</b><em>Seite ' +
                    esc(item.block.nr || 1) + '</em></button>', 'Noch kein PDF abgelegt.') + '</section>' +
                '<section class="school-card"><h2>Heute lernen</h2>' +
                list(due, item => {
                    const card = item.card || item;
                    return '<button data-school-block="' + esc(card.id) + '"><span>🎴</span><b>' +
                        esc((String(card.text || 'Karte').split('::')[0] || 'Karte').replace(/\{\{|\}\}/g, '')) +
                        '</b><em>' + esc(item.reason || 'fällig') + '</em></button>';
                }, 'Keine Karten fällig.') + '</section>' +
                '<section class="school-card"><h2>Offene Aufgaben</h2>' +
                list(tasks, task => '<button data-school-open="' + esc(task.id) + '"><span>☐</span><b>' +
                    esc(task.titel) + '</b><em>' + esc(task.datum ? String(task.datum).slice(0, 10) : task.coll.name) +
                    '</em></button>', 'Keine offene Aufgabe gefunden.') + '</section>' +
                '<section class="school-card"><h2>Nächste Prüfungen</h2>' +
                list(exams.slice(0, 6), exam => '<button data-school-open="' + esc(exam.row.id) + '"><span>📅</span><b>' +
                    esc(exam.row.text || exam.row.props?.title || 'Prüfung') + '</b><em>' +
                    esc(new Date(exam.date).toLocaleDateString('de-CH')) + '</em></button>', 'Noch kein Prüfungstermin eingetragen.') + '</section>' +
                '</div>' +
                '</div>';
        wrap.querySelectorAll('[data-school-open]').forEach(button => button.addEventListener('click', () => button.dataset.schoolOpen && App.oeffne(button.dataset.schoolOpen)));
        wrap.querySelectorAll('[data-school-block]').forEach(button => button.addEventListener('click', () => button.dataset.schoolBlock && App.zeigeBlock(button.dataset.schoolBlock)));
        wrap.querySelectorAll('[data-school-doc]').forEach(button => button.addEventListener('click', () => {
            const page = button.dataset.schoolDoc ? Store.getBlock(button.dataset.schoolDoc) : null;
            if (!page || !permitted('lesen', page.id))
                return;
            if (permitted('bearbeiten', page.id))
                Store.updateBlock(page.id, { dokumentModus: true });
            App.oeffne(page.id);
        }));
        wrap.querySelector('[data-school-action="capture"]')?.addEventListener('click', () => {
            if (!permitted('bearbeiten', root.id)) {
                UI.toast('Du darfst im Ausbildungsbereich nichts erfassen.');
                return;
            }
            Recognition.scan();
        });
        wrap.querySelector('[data-school-action="learn"]')?.addEventListener('click', () => Werkzeuge.lernen());
        wrap.querySelector('[data-school-action="calculate"]')?.addEventListener('click', () => Electrical.open(root));
    };
    /** WIE VIELE „KÜRZLICH VERWENDET" ZEIGT (E367, L116).
     *
     *  Die Decke bleibt, und sie hat einen Grund: „zuletzt verwendet" heisst
     *  „die letzten", nicht „alles, was ich je angefasst habe, nach Datum".
     *  Nachgemessen ist sie NICHT die Leistungsbremse, für die man sie halten
     *  könnte — der Reiter „Alle" zeichnet daneben 2000 Deckel ohne Decke
     *  (395 ms, linear mit rund 0,19 ms je Deckel). Sie ist eine Bedeutung,
     *  keine Bremse. Und genau deshalb muss sie sich zu erkennen geben. */
    const DECKE_KUERZLICH = 60;
    /**
     * Die Auswahl UND ihr wahrer Umfang, in einem Zug.
     *
     * BEFUND (L116): der Kopf zeigte die Länge der GESCHNITTENEN Liste. Bei
     * 61 Dokumenten stand dort „60", bei 900 auch — eine Zahl, die aussieht
     * wie eine Antwort auf „wie viele habe ich?" und keine ist. Im Regal war
     * es noch deutlicher: „60 Seiten auf diesem Gerät". Gefunden nicht von
     * einem Prüflauf, sondern auf einem Bild nach einem ZIP-Import (§55).
     *
     * Die Decke greift NACH der Suche und VOR der Umsortierung. Beides ist
     * Absicht: vorher durchsuchte man nur die sechzig neuesten und bekam
     * „nichts gefunden" für etwas, das da ist; nachher wären es die
     * alphabetisch ersten sechzig statt der sechzig neuesten.
     */
    const auswahl = () => {
        const alle = alleSeiten();
        const freigaben = (p) => {
            if (typeof Konten === 'undefined' || !Konten.freigabenVon)
                return false;
            const entries = Konten.freigabenVon(p.id) || {};
            return Array.isArray(entries) ? entries.length > 0 : Object.keys(entries).length > 0;
        };
        let liste = alle;
        /* ---- DIE ABLAGE ZEIGT EINE EBENE (E380) -----------------------------
         * Bis hierher zeigte JEDER Reiter den ganzen Bestand flach: ein Ordner
         * stand neben seinem eigenen Inhalt, und ein Unterordner zwei Ebenen
         * tiefer lag gleich daneben. Ein Ordner war damit ein Etikett, kein Ort.
         *
         * In der Ablage sind es jetzt nur die direkten Kinder des offenen
         * Ordners — und an der Wurzel die Wurzelseiten. Die übrigen Reiter
         * bleiben absichtlich flach: „Kürzlich verwendet" und „Favoriten" sind
         * Fragen über ALLES, nicht über eine Ebene.
         * -------------------------------------------------------------------- */
        if (zustand.reiter === 'ablage') {
            const ordner = zustand.ordner;
            liste = ordner
                ? alle.filter(p => p.parentId === ordner && p.parentTable !== 'collection')
                : alle.filter(p => !p.parentId && p.parentTable !== 'collection');
            /* Ordner zuerst, dann nach Namen — wie in einem Dateibrowser. Nach
               Zeit zu sortieren wäre hier falsch: eine Ablage soll an derselben
               Stelle stehen bleiben, sonst sucht man bei jedem Besuch neu. */
            liste = liste.slice().sort((a, b) => {
                const oa = artVon(a).id === 'ordner' ? 0 : 1;
                const ob = artVon(b).id === 'ordner' ? 0 : 1;
                if (oa !== ob)
                    return oa - ob;
                return String(a.text || '').localeCompare(String(b.text || ''), 'de', { sensitivity: 'base', numeric: true });
            });
        }
        if (zustand.reiter === 'kuerzlich')
            liste = alle.filter(p => p.zuletztGeoeffnet || p.edited)
                .sort((a, b) => zeitZahl(b.zuletztGeoeffnet || b.edited) -
                zeitZahl(a.zuletztGeoeffnet || a.edited));
        if (zustand.reiter === 'favoriten')
            liste = alle.filter(p => p.favorite);
        if (zustand.reiter === 'geteilt')
            liste = alle.filter(p => freigaben(p) || p.oeffentlich);
        if (zustand.reiter === 'privat')
            liste = alle.filter(p => p.parentTable !== 'collection' && !p.bereich);
        if (zustand.reiter === 'datenbank')
            liste = alle.filter(p => p.parentTable === 'collection');
        if (zustand.suche) {
            const s = zustand.suche.toLowerCase();
            liste = liste.filter(p => (p.text || '').toLowerCase().includes(s));
        }
        const gesamt = liste.length;
        if (zustand.reiter === 'kuerzlich' && liste.length > DECKE_KUERZLICH)
            liste = liste.slice(0, DECKE_KUERZLICH);
        if (zustand.reiter !== 'kuerzlich' || zustand.sortier !== 'wann') {
            const wert = (p) => zustand.sortier === 'name' ? (p.text || '').toLowerCase()
                : zustand.sortier === 'von' ? (p.erstelltVon || '').toLowerCase()
                    : zustand.sortier === 'quelle' ? quelleVon(p).text.toLowerCase()
                        : zeitZahl(p.edited || p.created);
            liste = [...liste].sort((a, b) => {
                const x = wert(a), y = wert(b);
                const v = x < y ? -1 : x > y ? 1 : 0;
                return zustand.richtung === 'auf' ? v : -v;
            });
        }
        return { liste, gesamt };
    };
    /* `gefiltert()` hiess diese Funktion bis E367 und gab nur die Liste
       zurück. Sie ist umbenannt, nicht entfernt: alle drei Zeichenstellen
       brauchen jetzt BEIDE Zahlen, und ein Kurzname daneben, den niemand
       ruft, wäre genau die tote Bindung, die L86 aufgeräumt hat. */
    /* ====================================================================== *
     * DAS REGAL (E207)
     * ---------------------------------------------------------------------- *
     * Ein „Heft" ist keine neue Datenart und wird auch keine. Es ist die
     * QUELLE, die `quelleVon()` ohnehin schon für jede Seite ausrechnet: die
     * Datenbank, in der sie liegt, die Elternseite, der Lebensbereich, oder
     * „Privat". Der Entwurf nennt das Heft; der Bestand nennt es Quelle. Es
     * ist dasselbe, und deshalb braucht es dafür keine Migration, keinen
     * zweiten Speicher und keinen Umzug (§9).
     * ====================================================================== */
    /* ====================================================================== *
     * DIE DECKEL — DAS REGAL JE DOKUMENT (E236)
     * ---------------------------------------------------------------------- *
     * Redur hat ein Bild geschickt: ein Regal aus Deckeln, jeder sagt schon
     * von weitem, WAS er ist — ein PDF, ein Notizbuch, ein Whiteboard, eine
     * Tabelle. Die Bibliothek hatte bisher zwei Formen, und keine davon:
     *
     *     Tabelle   dreizehn Zeilen, in jeder dreimal dieselbe Auskunft
     *     Regal     je QUELLE eine Karte — also je Heft, nicht je Dokument
     *
     * Die Deckelform ist die dritte, nicht ein Ersatz. Beide alten bleiben,
     * weil beide etwas können, was diese nicht kann: die Tabelle sortiert
     * nach Spalten, das Heftregal zeigt Zusammengehöriges.
     *
     * KEINE NEUE DATENART, KEIN NEUES FELD. Die Art eines Dokuments wird
     * ABGELESEN aus dem, was darin liegt — genau wie das Heft aus
     * `quelleVon()` abgelesen wird. Ein Feld `art` am Block wäre eine
     * Migration, und eine Migration für eine ANSICHT ist der teuerste Weg,
     * den es gibt (§9).
     * ====================================================================== */
    /** Die Arten, die ein Dokument haben kann — Reihenfolge = Vorrang. */
    const ARTEN = [
        { id: 'pdf', name: 'PDF', typen: ['pdfseite'] },
        { id: 'board', name: 'Whiteboard', typen: ['whiteboard'] },
        { id: 'plan', name: 'Schaltplan', typen: ['schaltplan'] },
        { id: 'blatt', name: 'Blatt', typen: ['blatt'] },
        { id: 'tab', name: 'Tabelle', typen: ['spreadsheet'] },
        { id: 'db', name: 'Datenbank', typen: ['database'] },
        { id: 'karten', name: 'Karteikarten', typen: ['flashcard'] },
        { id: 'datei', name: 'Dateien', typen: ['file', 'image', 'video', 'audio'] }
    ];
    /** Was steckt in dieser Seite? Zählt die Kindblöcke, nimmt den Vorrang. */
    const artVon = (p) => {
        const kinder = Store.childrenOf(p.id) || [];
        for (const art of ARTEN)
            if (kinder.some((b) => b && b.alive !== false &&
                art.typen.includes(b.type)))
                return { id: art.id, name: art.name };
        /* Eine Seite, die vor allem andere Seiten hält, ist ein Ordner. Das ist
           keine neue Datenart, sondern eine Beschreibung: `page` in `page`. */
        const unterseiten = kinder.filter((b) => b && b.alive !== false && b.type === 'page');
        /* Ein Fach (E265, `heftArt`) ist ein Ordner, auch mit einem einzigen
           Dokument oder leer — sonst wäre ein Fach mit genau einer PDF aus
           einer ZIP (E350) hier weder Ordner noch sichtbar. */
        if (p.heftArt === 'fach' || (unterseiten.length >= 2 && unterseiten.length >= kinder.length - 1))
            return { id: 'ordner', name: unterseiten.length + (unterseiten.length === 1 ? ' Sache' : ' Sachen') };
        return { id: 'seite', name: 'Seite' };
    };
    /* ---- HINEIN UND ZURÜCK (E380) ------------------------------------- *
     * Der ganze Unterschied zu vorher: ein Tipp auf einen Ordner ÖFFNET ihn
     * nicht als Seite, sondern GEHT HINEIN — dieselbe Ansicht, eine Ebene
     * tiefer. Das ist es, was Redur an GoodNotes gezeigt hat.
     * ------------------------------------------------------------------- */
    /** Der Weg von der Wurzel bis zum offenen Ordner — für die Brotkrume. */
    const ordnerWeg = () => {
        const weg = [];
        let id = zustand.ordner;
        const gesehen = new Set();
        while (id && !gesehen.has(id)) {
            gesehen.add(id);
            const p = Store.getBlock(id);
            if (!p || p.alive === false)
                break;
            weg.unshift(p);
            id = p.parentTable === 'collection' ? null : (p.parentId || null);
        }
        return weg;
    };
    /** In einen Ordner gehen (null = zurück an die Wurzel). */
    const geheIn = (id) => {
        zustand.ordner = id;
        zustand.reiter = 'ablage';
        /* Der Artfilter gilt der Ebene, nicht dem Weg — wer in einen Ordner
           geht, will sehen, was darin liegt, und nicht „von dieser Art gibt es
           hier nichts". */
        zustand.art = 'alle';
        if (typeof Store !== 'undefined' && Store.setMeta)
            Store.setMeta(ORDNER_SCHLUESSEL, id || '');
        App.zeichneSeite();
    };
    /** Eine Ebene hoch. An der Wurzel tut sie nichts. */
    const geheHoch = () => {
        const weg = ordnerWeg();
        const oben = weg.length >= 2 ? weg[weg.length - 2] : null;
        geheIn(oben ? oben.id : null);
    };
    /* ---- BLICK HINEIN (E459) -------------------------------------------- *
     * Hineingehen und wieder heraus sind zwei Wege für eine Auskunft. Die
     * Ordnerkarte (`schale/bedienung/ordnerkarte.ts`) zeigt dieselben Kinder
     * an Ort und Stelle — und ihre Suche geht durch den GANZEN Unterbaum,
     * während die Suche des Regals nur die offene Ebene filtert.
     * --------------------------------------------------------------------- */
    /** Die Kindseiten eines Ordners, Ordner zuerst — wie im Regal (§8). */
    const fachSeiten = (elternId) => (Store.childrenOf(elternId) || [])
        .filter((b) => b && b.alive !== false && b.type === 'page')
        .sort((a, b) => {
        const ao = artVon(a).id === 'ordner' ? 0 : 1;
        const bo = artVon(b).id === 'ordner' ? 0 : 1;
        return ao !== bo ? ao - bo
            : String(a.text || '').localeCompare(String(b.text || ''), 'de');
    });
    const fachStueck = (p, weg) => {
        const art = artVon(p);
        return {
            id: p.id, name: p.text || 'Ohne Titel', art: art.name,
            ordner: art.id === 'ordner',
            /* `exactOptionalPropertyTypes` verbietet `weg: undefined` — also gar
               nicht setzen, wenn der Treffer auf Ebene 1 liegt. */
            ...(weg.length ? { weg: weg.join(' \u203a ') } : {})
        };
    };
    /** Der ganze Unterbaum, flach, jeder Treffer mit seinem Weg. */
    const fachTiefe = (elternId, weg = [], tief = 0) => {
        if (tief > 6)
            return [];
        const raus = [];
        for (const p of fachSeiten(elternId)) {
            raus.push(fachStueck(p, weg));
            if (artVon(p).id === 'ordner')
                raus.push(...fachTiefe(p.id, weg.concat(p.text || 'Ohne Titel'), tief + 1));
        }
        return raus;
    };
    /* ══ DER BLICK KOMMT BEIM HINSCHAUEN (E508) ═══════════════════════════════
     * Redur, 8. September: „Könntest du nicht, wenn ich klicke, das kommen,
     * sondern wenn ich mit Maus drauf gehe?"
     *
     * Ja — aber NICHT statt des Klicks. §37 nennt das Telefon den Normalfall,
     * und dort gibt es kein Überfahren; eine Karte, die nur mit der Maus
     * aufgeht, wäre auf dem Gerät, an dem Redur am meisten arbeitet, gar
     * nicht zu bekommen. Also beides, und die zwei Wege unterscheiden sich
     * in EINEM Punkt: eine erzeigte Karte geht wieder zu, wenn der Zeiger
     * fortgeht; eine ANGETIPPTE bleibt, bis man sie schliesst. Wer tippt,
     * will halten.
     *
     * DIE WARTEZEIT IST DER GANZE UNTERSCHIED zwischen „hilfreich" und
     * „springt mich an". Wer mit der Maus quer über das Regal fährt, berührt
     * fünf Ordner in einer halben Sekunde; ohne Wartezeit klappten fünf
     * Karten hinter ihm auf. 280 ms ist länger als ein Vorbeifahren und
     * kürzer als eine Absicht.
     *
     * DIE ZEIT BEIM FORTGEHEN ist kürzer, aber nicht null: der Weg vom Knopf
     * in die Karte führt für einen Augenblick über nichts von beidem, und
     * eine Karte, die in diesem Augenblick verschwindet, ist nicht zu
     * benutzen.
     * ---------------------------------------------------------------------- */
    const SCHAU_AUF_MS = 280;
    const SCHAU_ZU_MS = 220;
    let schauUhr = 0;
    let schauZuUhr = 0;
    /** Der Ordner, dessen Karte gerade per Zeigen offen ist. Leer = keine. */
    let schauId = '';
    /* IHR EIGENER SCHLIESSWEG, nicht `lage.remove()`. Die Karte hängt zwei
       Horcher an das Dokument (Escape und der Klick daneben) und gibt den
       Fokus zurück; wer nur den Knoten entfernt, lässt beides liegen — und
       nach fünf Ordnern horchen fünf tote Karten auf jede Taste. */
    let schauZu = null;
    const schauAbsagen = () => {
        if (schauUhr) {
            clearTimeout(schauUhr);
            schauUhr = 0;
        }
        if (schauZuUhr) {
            clearTimeout(schauZuUhr);
            schauZuUhr = 0;
        }
    };
    /** Gibt es an diesem Gerät überhaupt ein Überfahren? */
    /** Kann dieses GERÄT überfahren — mit irgendeinem seiner Eingabemittel?
     *
     *  BIS E615 STAND HIER `(hover: hover) and (pointer: fine)`, und das ist
     *  die falsche Frage. Sie beschreibt den HAUPTZEIGER: auf einem Laptop
     *  mit Berührungsbildschirm ist das der Finger, und die Abfrage antwortet
     *  dort „kein Überfahren" — obwohl eine Maus danebenliegt und ein Stift
     *  über dem Glas schwebt.
     *
     *  `any-hover` und `any-pointer` fragen nach ALLEN Eingabemitteln. Das
     *  ist die Frage, die hier gemeint war (L180). */
    const zeigerHatHover = () => {
        try {
            return matchMedia('(any-hover: hover) and (any-pointer: fine)').matches;
        }
        catch {
            return false;
        }
    };
    /** Die Karte über dem Deckel aufschlagen. `r` ist das Rechteck des Deckels.
     *  `perZeigen` heisst: sie geht wieder zu, sobald der Zeiger fortgeht. */
    const blickHinein = (p, r, perZeigen = false, beiOeffnen) => {
        /* WOHIN „ÖFFNEN" FÜHRT, entscheidet der Aufrufer (E611). `geheIn` ist
           ein Schritt IN DER BIBLIOTHEK; die Notizhefte reichen ihr eigenes
           `openFach` herein, sonst spränge ein Fach aus dem Regal heraus. */
        const oeffne = beiOeffnen || ((id) => geheIn(id));
        if (typeof Ordnerkarte === 'undefined') {
            oeffne(p.id);
            return;
        }
        document.querySelectorAll('.ru-fach-lage').forEach(a => a.remove());
        const zurueck = document.activeElement;
        const lage = document.createElement('div');
        lage.className = 'ru-fach-lage';
        let zu = () => { };
        const griff = Ordnerkarte.bauen({
            name: p.text || 'Ohne Titel',
            kinder: fachSeiten(p.id).map(k => fachStueck(k, [])),
            tiefe: fachTiefe(p.id),
            beiWahl: (stueck) => {
                zu();
                if (stueck.ordner)
                    oeffne(stueck.id);
                else
                    App.oeffne(stueck.id);
            },
            beiOrdner: () => { zu(); oeffne(p.id); }
        });
        lage.append(griff.element);
        document.body.append(lage);
        /* ERST MESSEN, DANN STELLEN. Die Karte ist zugeklappt schmaler als
           aufgeklappt; gestellt wird nach dem, was wirklich dasteht. */
        const b = lage.getBoundingClientRect();
        lage.style.left = Math.max(8, Math.min(r.left, innerWidth - b.width - 8)) + 'px';
        lage.style.top = (r.bottom + 6 + b.height > innerHeight
            ? Math.max(8, r.top - b.height - 6) : r.bottom + 6) + 'px';
        const beiTaste = (ereignis) => {
            if (ereignis.key === 'Escape') {
                ereignis.stopPropagation();
                zu();
            }
        };
        const beiKlick = (ereignis) => {
            if (!(ereignis.target instanceof Node) || !lage.contains(ereignis.target))
                zu();
        };
        zu = () => {
            document.removeEventListener('keydown', beiTaste, true);
            document.removeEventListener('mousedown', beiKlick);
            schauAbsagen();
            schauId = '';
            schauZu = null;
            lage.remove();
            /* Den Fokus nur zurückgeben, wenn er auch genommen wurde. Eine Karte,
               die vom blossen Hinschauen kam, hat ihn nie gehabt. */
            if (!perZeigen)
                zurueck?.focus?.();
        };
        /* ── DIE KARTE HÄLT SICH SELBST, SOLANGE MAN AUF IHR LIEGT (E508) ────
           Sie hängt in einer eigenen Lage neben dem Knopf, nicht in ihm. Der
           Weg mit der Maus führt also aus dem Knopf HERAUS und in die Karte
           HINEIN — und dazwischen liegt für einen Augenblick nichts von
           beidem. Deshalb horchen beide, und das Zuklappen wird jedes Mal neu
           abgesagt, wenn der Zeiger irgendwo landet, wo er hingehört. */
        if (perZeigen) {
            schauId = String(p.id);
            schauZu = () => zu();
            lage.addEventListener('pointerenter', () => {
                if (schauZuUhr) {
                    clearTimeout(schauZuUhr);
                    schauZuUhr = 0;
                }
            });
            lage.addEventListener('pointerleave', ereignis => {
                if (ereignis.pointerType === 'touch')
                    return;
                schauZuSpaeter();
            });
        }
        document.addEventListener('keydown', beiTaste, true);
        /* Erst im nächsten Zug horchen: der Klick, der die Karte öffnet, würde
           sie sonst im selben Zug wieder schliessen. */
        setTimeout(() => document.addEventListener('mousedown', beiKlick), 0);
        griff.klappen(true);
        /* NUR BEIM TIPPEN DEN FOKUS NEHMEN. Wer bloss hinschaut, hat den Fokus
           womöglich in der Suche des Regals — ihn wegzuziehen, weil die Maus
           über einen Ordner fuhr, wäre ein Diebstahl (§38). */
        if (!perZeigen)
            griff.element.querySelector('.ru-fach-griff')?.focus();
    };
    /* ═══ DAS AUGE ALS DIENST DES BEREICHS (E611) ══════════════════════════
       Redur, 16. September: „das ist nur bei Bibliothek — ich will überall,
       wenn ein Ordner erstellt wird, das haben."
  
       Es gibt genau ZWEI Stellen, die eine Ordner-Kachel zeichnen: hier und
       `fachCard` in `notebook.ts`. Damit die zweite dasselbe bekommt und
       nicht etwas Ähnliches, stehen Auszeichnung UND Verdrahtung ab jetzt
       an EINER Stelle und werden nach aussen gegeben. Beide Dateien liegen
       im Bereich `wissen` — §5 Regel 1 erlaubt eigene Dateien untereinander.
  
       Zwei Kopien wären der sicherere Weg gewesen, aber der falsche: die
       zweite wäre beim nächsten Bogen am Auge stehengeblieben, und dann
       hätte Redion zwei Augen, die sich verschieden benehmen. */
    /** Das Auge selbst. EINE Quelle für die Auszeichnung. */
    const blickKnopf = (id, name) => `<button class="bib-blick" data-blick="${esc(id)}" ` +
        `aria-label="Blick in „${esc(name || 'Ohne Titel')}“" title="Blick hinein">` +
        '<i class="bib-blick-auge" aria-hidden="true"><b></b></i></button>';
    /** Deckel und Auge in einer Zelle. Das Auge ist ein GESCHWISTER des
     *  Deckels, kein Kind: ein Knopf im Knopf ist kein gültiges HTML, und
     *  der Klick käme zweimal an (E463). */
    const mitBlick = (deckelHtml, id, name) => '<span class="bib-zelle">' + deckelHtml + blickKnopf(id, name) + '</span>';
    /** Die Augen in `wurzel` verdrahten — derselbe Weg wie im ⌄-Menü, ohne
     *  Menü. Seit E508 öffnet auch das blosse HINSCHAUEN.
     *
     *  `beiOeffnen` sagt, was „Ordner öffnen" tun soll. Ohne Angabe ist das
     *  `geheIn`, also ein Schritt IN DER BIBLIOTHEK. Für die Notizhefte wäre
     *  das falsch — dort führt es aus dem Regal heraus; sie reichen deshalb
     *  ihr eigenes `openFach` herein. `test531` §2 hält genau das fest. */
    const blickAnbringen = (wurzel, beiOeffnen) => {
        wurzel.querySelectorAll('.bib-blick[data-blick]').forEach(b => {
            const seiteVon = () => Store.getBlock(b.dataset['blick'] || '');
            b.addEventListener('click', ereignis => {
                ereignis.stopPropagation();
                schauAbsagen();
                const p = seiteVon();
                /* Ein Tipp auf denselben Ordner, dessen Karte gerade vom Zeigen
                   offen steht, klappt sie nicht zu und wieder auf — er HÄLT sie
                   fest. Alles andere wäre ein Flackern für nichts. */
                if (p && schauId === String(p.id) && document.querySelector('.ru-fach-lage')) {
                    schauId = '';
                    return;
                }
                if (p)
                    blickHinein(p, b.getBoundingClientRect(), false, beiOeffnen);
            });
            b.addEventListener('pointerenter', ereignis => {
                const e = ereignis;
                /* MAUS ODER STIFT (E615, L180). Ein Stift, der über dem Glas
                   schwebt, IST ein Überfahren — Surface, iPad mit Tastatur, Wacom.
                   Bis hierher stand `!== 'mouse'`, und damit war er zusammen mit
                   dem Finger ausgesperrt; Redur hat es am 16. September gemeldet.
        
                   DER FINGER BLEIBT DRAUSSEN, und zwar mit Grund: er meldet auf
                   manchen Geräten ein `pointerenter`, das kein Überfahren ist,
                   sondern der Anfang eines Tippens. `test476 §6` hält das fest. */
                if (e.pointerType !== 'mouse' && e.pointerType !== 'pen')
                    return;
                if (!zeigerHatHover())
                    return;
                if (document.querySelector('.ru-fach-lage'))
                    return;
                schauAbsagen();
                schauUhr = window.setTimeout(() => {
                    schauUhr = 0;
                    const p = seiteVon();
                    if (p)
                        blickHinein(p, b.getBoundingClientRect(), true, beiOeffnen);
                }, SCHAU_AUF_MS);
            });
            /* EIN TIPP IST KEIN HINSCHAUEN (E615, L180).
               Beim Antippen kommt erst `pointerenter`, dann `pointerdown` — und
               dazwischen sagte nichts ab. Die Uhr lief weiter, und die Karte ging
               nach dem Tippen von selbst auf. Am Auge fiel das kaum auf, weil ein
               Klick sie ohnehin öffnet; überall dort, wo Tippen und Hinschauen
               Verschiedenes bedeuten, wäre es ein Fehler. */
            b.addEventListener('pointerdown', () => {
                if (schauUhr) {
                    clearTimeout(schauUhr);
                    schauUhr = 0;
                }
            });
            b.addEventListener('pointerleave', ereignis => {
                if (ereignis.pointerType === 'touch')
                    return;
                /* Noch nicht aufgegangen: die Absicht war keine. Schon offen: die
                   Karte selbst entscheidet, ob der Zeiger zu ihr gewandert ist. */
                if (schauUhr) {
                    clearTimeout(schauUhr);
                    schauUhr = 0;
                }
                if (schauId)
                    schauZuSpaeter();
            });
        });
    };
    /** Nach einer kurzen Frist zuklappen — jeder neue Zeigerkontakt sagt ab. */
    const schauZuSpaeter = () => {
        if (schauZuUhr)
            clearTimeout(schauZuUhr);
        schauZuUhr = window.setTimeout(() => {
            schauZuUhr = 0;
            if (!schauId)
                return;
            const zu = schauZu;
            schauId = '';
            schauZu = null;
            if (zu)
                zu();
            else
                document.querySelectorAll('.ru-fach-lage').forEach(a => a.remove());
        }, SCHAU_ZU_MS);
    };
    /** Die Brotkrume der Ablage. An der Wurzel schweigt sie — ein Pfad mit
     *  genau einem Glied ist kein Pfad, sondern eine Zeile Luft. */
    const ordnerKrume = () => {
        const weg = ordnerWeg();
        if (!weg.length)
            return '';
        return '<nav class="bib-krume" aria-label="Wo ich bin">' +
            '<button data-hoch aria-label="Eine Ebene zurück">\u2039</button>' +
            '<button data-ordner="">Dokumente</button>' +
            weg.map((p, i) => '<span aria-hidden="true">\u203a</span>' +
                (i === weg.length - 1
                    ? '<b>' + esc(p.text || 'Ohne Titel') + '</b>'
                    : `<button data-ordner="${esc(p.id)}">` + esc(p.text || 'Ohne Titel') + '</button>')).join('') +
            '</nav>';
    };
    /** Die Filterzeile über dem Regal — sie filtert nach ART, nicht nach Ort. */
    const ART_FILTER = [
        { id: 'alle', name: 'Alle' },
        { id: 'pdf', name: 'PDF' },
        { id: 'board', name: 'Whiteboards' },
        { id: 'plan', name: 'Schaltpläne' },
        { id: 'blatt', name: 'Blätter' },
        { id: 'tab', name: 'Tabellen' },
        { id: 'db', name: 'Datenbanken' },
        { id: 'karten', name: 'Karteikarten' },
        { id: 'ordner', name: 'Ordner' },
        { id: 'datei', name: 'Dateien' },
        { id: 'seite', name: 'Seiten' }
    ];
    /** Schnellwege sind Sichten auf denselben Bestand, keine zweite Ablage. */
    const studioNavigation = () => {
        const pdfAn = zustand.reiter === 'alle' && zustand.art === 'pdf';
        const wege = [
            { id: 'ablage', name: 'Meine Ablage' },
            { id: 'kuerzlich', name: 'Zuletzt geöffnet' },
            { id: 'favoriten', name: 'Favoriten' },
            { id: 'pdf', name: 'Alle PDFs' }
        ];
        return '<div class="bib-studio-navigation">' +
            /* `data-material` (E706): die Wahl fliegt zum neuen Weg. */
            '<nav class="bib-studio-wege" data-material="dokumente-wege" aria-label="Dokumente finden">' +
            wege.map(weg => {
                const an = weg.id === 'pdf' ? pdfAn : !pdfAn && zustand.reiter === weg.id;
                return '<button type="button" data-studio-weg="' + weg.id + '"' +
                    (an ? ' class="on" aria-current="page"' : '') + '>' + weg.name + '</button>';
            }).join('') + '</nav>' +
            '<details class="bib-studio-optionen"><summary>Sammlungen</summary>' +
            '<select class="bib-studio-sammlungen" aria-label="Weitere Bibliothek-Inhalte öffnen">' +
            '<option value="">Dateien & Wissen …</option>' +
            (typeof Arbeitswelt !== 'undefined' ? Arbeitswelt.sammlungen.map(a => '<option value="' + esc(a.id) + '">' + esc(a.name) + '</option>').join('') : '') + '</select></details>' +
            '<label class="bib-studio-suche"><span data-sym="search" aria-hidden="true"></span>' +
            '<span class="bib-studio-sr">Dokumenttitel in dieser Ansicht suchen</span>' +
            '<input id="bib-studio-suche" type="search" autocomplete="off" placeholder="Dokument suchen …"' +
            ' value="' + esc(zustand.suche) + '"></label>' +
            '</div>';
    };
    /** Bis zu drei wirklich geöffnete Dokumente, keine dekorativen Dateiatrappen. */
    const recentCarousel = () => {
        if (zustand.ordner || zustand.suche || zustand.art !== 'alle' ||
            !['ablage', 'kuerzlich'].includes(zustand.reiter))
            return '';
        const recent = alleSeiten().filter(p => p.zuletztGeoeffnet)
            .sort((a, b) => zeitZahl(b.zuletztGeoeffnet) - zeitZahl(a.zuletztGeoeffnet)).slice(0, 3);
        return '<section class="rmo-recent" aria-label="Zuletzt geöffnet"><h2>Zuletzt geöffnet</h2>' +
            '<div class="rmo-recent-track">' + (recent.length ? recent.map((p, index) => '<button type="button" class="rmo-recent-card" data-rmo-open="' + esc(p.id) +
            '" style="--rmo-index:' + index + '"><span>' + esc(artVon(p).name) + '</span><b>' +
            esc(p.text || 'Ohne Titel') + '</b><small>' + esc(wannText(p.zuletztGeoeffnet)) +
            '</small></button>').join('') :
            '<button type="button" class="rmo-recent-card" data-rmo-new><span>Loslegen</span><b>Neue Seite</b></button>' +
                '<button type="button" class="rmo-recent-card" data-rmo-import><span>Weiterarbeiten</span><b>PDF öffnen</b></button>') +
            '</div></section>';
    };
    /** Nur ein wirklich geöffnetes PDF anbieten; Importzeit ist kein Lesefortschritt. */
    const studioWeiter = () => {
        if (zustand.reiter !== 'ablage' || zustand.ordner || zustand.suche || zustand.art !== 'alle')
            return '';
        const letzte = alleSeiten().filter(p => p.zuletztGeoeffnet && artVon(p).id === 'pdf')
            .sort((a, b) => zeitZahl(b.zuletztGeoeffnet) - zeitZahl(a.zuletztGeoeffnet))[0];
        if (!letzte)
            return '';
        const bild = typeof Vorschau !== 'undefined' && Vorschau.bildDatei ? Vorschau.bildDatei(letzte.id) : null;
        return '<section class="bib-studio-weiter" aria-label="PDF weiterlesen">' +
            '<span class="bib-studio-miniatur" aria-hidden="true">' +
            (bild ? '<img data-vorschau="' + esc(bild) + '" alt="" loading="lazy">' : '<span>PDF</span>') + '</span>' +
            '<div><span class="bib-studio-eyebrow">Weiterarbeiten</span><h2>' + esc(letzte.text || 'Ohne Titel') +
            '</h2><p>Zuletzt geöffnet ' + esc(wannText(letzte.zuletztGeoeffnet)) + '</p></div>' +
            /* „WEITERLESEN", NICHT „PDF ÖFFNEN" (E516, L139). Hier stand ein
               Jahr lang dasselbe Wort wie am Importeur, und dieser Knopf macht
               das GEGENTEIL: er holt die zuletzt geöffnete PDF zurück. Redur
               hat es als Fehler gemeldet — „wenn ich oben eine neue PDF einfügen
               will, kopiert es immer die aktuelle PDF" —, und drei gemessene
               Importwege waren sauber, weil der Import nie kaputt war. Kaputt
               war das Wort. */
            '<button type="button" data-studio-weiter="' + esc(letzte.id) + '">Weiterlesen' +
            '<span aria-hidden="true">↗</span></button></section>';
    };
    /* DAS WORT DES IMPORTKNOPFES steht EINMAL da (§8). Es steht auch in
       `index.html` am Kopfknopf; `test482 §4` hält beide zusammen. */
    const IMPORT_WORT = 'PDF öffnen';
    /**
     * Den Importknopf beschriften, ohne ihm sein Zeichen wegzunehmen.
     *
     * VORHER STAND HIER `button.textContent = …`, und das ist genau die
     * Zeile, die seit E515 wehtut: `textContent` wirft die KINDKNOTEN weg,
     * und dort hängt seit E515 das gezeichnete Zeichen. Nach dem ersten
     * Import stand der Knopf ohne Zeichen da — für den Rest der Sitzung, und
     * kein Neuladen der Bibliothek holte es zurück, weil der Kopfknopf in
     * `index.html` steht und nicht neu gezeichnet wird.
     *
     * Der zweite Fehler in derselben Zeile war der Name: der Knopf hiess
     * danach „PDF importieren" statt „PDF öffnen". Ein Knopf, der seinen
     * Namen wechselt, weil man ihn einmal gedrückt hat, ist ein anderer Knopf.
     */
    const importBeschriften = (wort) => {
        document.querySelectorAll('[data-studio-import]').forEach(knopf => {
            const feld = knopf.querySelector('.wort')
                || knopf.querySelector('span:not([data-sym]):not([aria-hidden="true"])');
            if (feld)
                feld.textContent = wort || IMPORT_WORT;
            else
                knopf.textContent = wort || IMPORT_WORT;
        });
    };
    let pdfImportLaeuft = false;
    /** Derselbe PDF-Importer wie beim Archivimport, mit direktem Weg ins Dokument. */
    const pdfImportieren = () => {
        const ziel = zustand.reiter === 'ablage' ? zustand.ordner : null;
        if (pdfImportLaeuft)
            return;
        if (!permitted('bearbeiten', ziel || undefined)) {
            UI.toast('Du darfst hier keine PDF ablegen.');
            return;
        }
        if (typeof ArchivImport === 'undefined' || !ArchivImport.dateiAlsDokument) {
            UI.toast('Der PDF-Import ist gerade nicht verfügbar.');
            return;
        }
        const eingabe = document.createElement('input');
        eingabe.type = 'file';
        eingabe.accept = '.pdf,application/pdf';
        eingabe.hidden = true;
        document.body.appendChild(eingabe);
        eingabe.addEventListener('cancel', () => eingabe.remove(), { once: true });
        eingabe.addEventListener('change', async () => {
            const datei = eingabe.files?.[0];
            eingabe.remove();
            if (!datei || pdfImportLaeuft)
                return;
            if (!/\.pdf$/i.test(datei.name)) {
                UI.toast('Bitte eine PDF-Datei auswählen.');
                return;
            }
            if (!permitted('bearbeiten', ziel || undefined) || (ziel && Store.getBlock(ziel)?.alive === false)) {
                UI.toast('In diesem Ordner kann nichts abgelegt werden.');
                return;
            }
            pdfImportLaeuft = true;
            document.querySelectorAll('[data-studio-import]').forEach(button => {
                button.disabled = true;
                button.setAttribute('aria-busy', 'true');
            });
            importBeschriften('PDF wird gelesen …');
            try {
                const ergebnis = await ArchivImport.dateiAlsDokument(datei, ziel);
                App.zeichneBaum();
                if (ergebnis.seiteId)
                    App.oeffne(ergebnis.seiteId);
                else
                    App.zeichneSeite();
            }
            catch (fehler) {
                UI.toast('PDF konnte nicht importiert werden: ' +
                    (fehler instanceof Error ? fehler.message : String(fehler)));
            }
            finally {
                pdfImportLaeuft = false;
                document.querySelectorAll('[data-studio-import]').forEach(button => {
                    button.disabled = !permitted('bearbeiten', zustand.ordner || undefined);
                    button.removeAttribute('aria-busy');
                });
                importBeschriften();
            }
        }, { once: true });
        eingabe.click();
    };
    /**
     * Ein Deckel. Was darauf steht, ist keine Zeichnung, sondern eine
     * Aussage: welche Art, und wenn es eine gibt, die echte Vorschau der
     * Seite. `Vorschau.miniatur` liefert sie — dieselbe, die „Weiter wo du
     * warst" verwendet (E205), damit nicht zwei Vorschauen gepflegt werden.
     */
    /* WELCHE ARTEN EINE ECHTE TEXTVORSCHAU VERTRAGEN — und welche nicht.
       Gemessen am Bild: der Deckel eines PDF zeigte „Seite 1Seite 2Seite 3",
       der eines Whiteboards eine graue Pille mit dem Wort „Whiteboard". Das
       ist keine Vorschau, das ist der Name der Blockart dreimal.
       `Vorschau.miniatur` liest den TEXT der Kindblöcke — bei einer Seite ist
       das der Anfang des Textes und damit die beste Auskunft, die es gibt.
       Bei einem PDF, einem Whiteboard oder einer Tabelle steht im Text
       nichts, was jemandem hilft. Dort zeichnet die CSS das Papier. */
    const MIT_TEXT = new Set(['seite', 'karten', 'db']);
    const deckelKarte = (p) => {
        const art = artVon(p);
        const children = art.id === 'ordner' ? alleSeiten().filter(child => child.parentId === p.id && child.parentTable !== 'collection') : [];
        const folderPreview = art.id === 'ordner' ? '<span class="rmo-folder-preview">' +
            '<b>' + children.length + (children.length === 1 ? ' Unterseite' : ' Unterseiten') + '</b>' +
            children.slice(0, 3).map(child => '<span>' + esc(child.text || 'Ohne Titel') + '</span>').join('') +
            '</span>' : '';
        /* DAS ECHTE BILD GEHT VOR (L61, E313). Eine eingelesene PDF-Seite und
           ein Bildblock tragen ihre Datei bei sich; die zeigt der Deckel, statt
           eine weisse Fläche mit dem Wort „PDF" darauf. Erst wenn es keine
           gibt, kommt die Textvorschau — und die nur bei den Arten, bei denen
           im Text etwas steht. */
        const datei = Vorschau.bildDatei ? Vorschau.bildDatei(p.id) : null;
        /* UND WENN ES KEINE DATEI GIBT, ABER HANDSCHRIFT (E374, L61 Rest).
           Ein A4-Blatt, auf das nur geschrieben wurde, hat keine Datei — sein
           Deckel stand bis heute weiss da, und in einem Regal handgeschriebener
           Hefte waren das alle. Die Striche liegen im Block; sie zu zeichnen
           kostet keine Datei und kann nicht veralten. */
        const tinte = !datei && Vorschau.tinteSvg ? Vorschau.tinteSvg(p.id) : '';
        const bild = datei
            ? `<img class="bib-deckel-bild" data-vorschau="${esc(datei)}" alt="" loading="lazy">`
            : (tinte || (MIT_TEXT.has(art.id) ? (Vorschau.miniatur(p.id, 5) || '') : ''));
        const wann = wannText(p.zuletztGeoeffnet || p.edited || p.created);
        const deckel = `<button class="bib-deckel" data-id="${esc(p.id)}" data-art="${esc(art.id)}"` +
            /* DIE FARBE DES ORDNERS (E672) — dieselbe Marke wie beim Heft und
               beim Fach; das Stilblatt kennt eine Regel für alle drei. */
            Farben.marke(p.color) + ' ' +
            `title="${esc(p.text || 'Ohne Titel')}">` +
            `<span class="bib-deckel-blatt mini-zeilen${bild ? '' : ' is-leer'}${tinte ? ' hat-tinte' : ''}">` +
            '<i class="bib-papier" aria-hidden="true"></i>' +
            (bild || '') + folderPreview +
            /* Die Marke bleibt: sie sagt, WAS es ist, und das sagt ein Bild
               der ersten Seite nicht. Sie sitzt in der Ecke, nicht davor. */
            (art.id === 'pdf' ? '<i class="bib-deckel-marke">PDF</i>' : '') +
            `<i class="bib-deckel-stern${p.favorite ? ' an' : ''}" aria-hidden="true">` +
            (p.favorite ? '\u2605' : '\u2606') + '</i>' +
            '</span>' +
            '<span class="bib-deckel-name"><b>' + esc(p.text || 'Ohne Titel') + '</b>' +
            '<i class="bib-deckel-mehr" aria-hidden="true">\u2304</i></span>' +
            '<small>' + esc(art.name) + ' \u00b7 ' + esc(wann) + '</small>' +
            '</button>';
        if (art.id !== 'ordner')
            return deckel;
        /* DAS AUGE AM ORDNER (E463). „Blick hinein" stand seit E459 nur im
           ⌄-Menü — ein Weg, den man kennen muss. Jetzt sitzt am Deckel jedes
           Ordners ein Auge, das beim Darüberfahren zwinkert und zur Seite
           schaut. Auszeichnung und Verdrahtung stehen seit E611 in `mitBlick`
           und `blickAnbringen`, damit die Notizhefte DASSELBE Auge bekommen
           und nicht ein ähnliches. */
        return mitBlick(deckel, p.id, p.text);
    };
    const hefte = (liste) => {
        const nach = new Map();
        for (const p of liste) {
            const q = quelleVon(p);
            /* Der Schlüssel ist die Kennung, wenn es eine gibt — zwei Datenbanken
               dürfen gleich heissen. Ohne Kennung (Privat, Direkt freigegeben)
               trägt der Name. */
            const schluessel = q.id || ('name:' + q.text);
            let h = nach.get(schluessel);
            if (!h) {
                h = { id: q.id, icon: q.icon, name: q.text, seiten: [],
                    zuletzt: null, wann: 0 };
                nach.set(schluessel, h);
            }
            h.seiten.push(p);
            const wann = zeitZahl(p.edited || p.created);
            if (wann >= h.wann) {
                h.wann = wann;
                h.zuletzt = p;
            }
        }
        /* DIE NEUESTE SEITE IST NICHT IMMER DIE, DIE MAN ZEIGEN WILL.
           Auf dem Bild vom 26. August stand „Meine Aufgaben" als leerer Kasten
           neben zwei vollen — obwohl das Heft drei Seiten hat. Seine neueste
           Seite („Ollama installieren") ist bloss eine Zeile ohne Inhalt, und
           damit sah das ganze Heft leer aus. Ein Heft mit drei Seiten ist nicht
           leer; nur eine davon ist es.
    
           Gezeigt wird deshalb die neueste Seite, die überhaupt etwas ZU zeigen
           hat. Hat keine etwas, bleibt es bei der neuesten — dann stimmt „leer"
           auch. */
        for (const h of nach.values()) {
            if (Vorschau.umfang(h.zuletzt?.id || ''))
                continue;
            const mitInhalt = h.seiten
                .filter(x => Vorschau.umfang(x.id))
                .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))[0];
            if (mitInhalt)
                h.zuletzt = mitInhalt;
        }
        return [...nach.values()].sort((a, b) => b.wann - a.wann);
    };
    /**
     * WAS EINE DATENBANKZEILE ZU ZEIGEN HAT, STEHT NICHT IN IHREN KINDERN.
     *
     * Auf dem Bild vom 26. August stand „Meine Aufgaben" als leerer Kasten
     * neben zwei vollen — obwohl das Heft drei Seiten hat. Die drei sind
     * Zeilen einer Datenbank; ihr Inhalt steckt in den SPALTEN, nicht in
     * Kindblöcken, und `Vorschau.miniatur` findet dort zu Recht nichts.
     *
     * „Dieses Heft ist noch leer" war damit keine Vorsicht, sondern eine
     * falsche Aussage über einen vollen Bestand — dieselbe Sorte stiller
     * Fehler wie die abgeschnittene Zahl aus §55.2: plausibel und falsch.
     *
     * Was ein solches Heft zu zeigen hat, sind seine Seiten. Das ist keine
     * Notlösung: bei einer Aufgabenliste ist die Liste der Aufgaben genau
     * das, was man sehen will.
     */
    const inhaltsListe = (h) => h.seiten.slice()
        .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))
        .slice(0, 6)
        .map(x => '<span class="mini-li">' + esc(x.text || 'Ohne Titel') + '</span>')
        .join('');
    /** Ein Blatt aus dem Regal: die Miniatur der zuletzt bearbeiteten Seite. */
    const heftKarte = (h) => {
        const seite = h.zuletzt;
        const bild = (seite ? Vorschau.miniatur(seite.id, 6) : '') || inhaltsListe(h);
        return `<button class="bib-heft" data-id="${esc(seite?.id || '')}" ` +
            `title="${esc(h.name)}">` +
            `<span class="bib-heft-marke">${esc(h.icon)} ${esc(h.name)}</span>` +
            `<span class="bib-heft-blatt mini-zeilen${bild ? '' : ' is-leer'}">` +
            (bild || '<span>Dieses Heft ist noch leer.</span>') + '</span>' +
            '<span class="bib-heft-fuss"><strong>' +
            esc(seite?.text || h.name) + '</strong><small>' +
            h.seiten.length + (h.seiten.length === 1 ? ' Seite' : ' Seiten') +
            (h.wann ? ' · ' + esc(wannText(h.wann)) : '') +
            '</small></span></button>';
    };
    /** Eine kleine Karte für „Zuletzt in der Hand" — quer über alle Hefte. */
    const handKarte = (p) => {
        const q = quelleVon(p);
        /* Eine Zeile ohne Kindblöcke hat hier nichts zu zeigen — anders als beim
           Heft gibt es auch keine Geschwister, die einspringen könnten. Dann
           steht „noch leer", und das stimmt dann auch. */
        const bild = Vorschau.miniatur(p.id, 4);
        return `<button class="bib-hand" data-id="${esc(p.id)}">` +
            `<span class="bib-hand-blatt mini-zeilen${bild ? '' : ' is-leer'}">` +
            (bild || '<span>noch leer</span>') + '</span>' +
            '<span class="bib-hand-fuss"><strong>' + esc(p.text || 'Ohne Titel') +
            '</strong><small>' + esc(q.text) + ' · ' +
            esc(wannText(p.edited || p.created)) + '</small></span></button>';
    };
    /* Der Kopf gehört BEIDEN Formen. Zwei Köpfe wären zwei Orte, an denen
       dieselbe Zahl steht — und einer davon wird irgendwann falsch. */
    /* DIE REITER GEHÖREN IN BEIDE FORMEN, und der erste Entwurf hatte sie nur
       in der Tabelle. `test202` fand es: es sucht `[data-r="mehr"]`, um über
       „Ausbildung" ins Schul-Dashboard zu kommen, und im Regal gab es den
       Knopf nicht. Damit war ein ganzer Bereich von dort aus unerreichbar —
       genau das, was Redurs „nichts löschen" ausschliesst.
  
       Der Grund für den Fehler ist einfach zu benennen: die Reiter FILTERN den
       Bestand, sie stellen ihn nicht dar. Was gefiltert wird, hat mit der Form
       nichts zu tun. Sie stehen deshalb im gemeinsamen Kopf und nicht in einer
       der beiden Zeichenfunktionen. */
    /** „n von m" statt „n", solange die Decke greift (E367, L116). Ohne
     *  Decke bleibt der Satz Wort für Wort, wie er war. */
    const umfangSatz = (gezeigt, gesamt, eins, mehr, vonForm) => 
    /* `vonForm` ist der DATIV: „60 von 313 Dokumenten", nicht „Dokumente".
       Der erste Wurf nahm die Mehrzahl für beide Fälle, und der Fehler stand
       auf dem Bild, nicht im Prüflauf (§55). Bei „Seiten" fällt es nicht
       auf — deshalb steht es hier als eigenes Wort und nicht als Regel. */
    gesamt > gezeigt
        ? gezeigt + ' von ' + gesamt + ' ' + vonForm
        : gezeigt + ' ' + (gezeigt === 1 ? eins : mehr);
    const bibKopf = (liste, _anzahlHefte, gesamt = liste.length) => {
        /* Auch die Listenform ist in der Ablage ein Ordner-Browser (E382). Bis
           E382 hatte sie keine Brotkrume: man ging in ein Fach hinein (per
           Zeilenklick) und sah danach weder, WO man war, noch einen Weg zurück —
           der Titel stand fest auf „Bibliothek". Jetzt trägt der Kopf in der
           Ablage denselben Pfad wie die Deckelansicht (E380). */
        // One header in every saved presentation, including older notebook shelves.
        return deckelKopf(liste.length, gesamt) + studioNavigation();
    };
    /* ====================================================================== *
     * SICHERUNG, PAPIERKORB UND PLATZ (E208)
     * ---------------------------------------------------------------------- *
     * Der letzte Teil des abgenommenen Entwurfs. Er ist kein Beiwerk: nach §46
     * ist Priorität 1, keine Daten zu verlieren, und wer auf einen Blick sieht,
     * wann er zuletzt gesichert hat, verliert seltener etwas.
     *
     * ALLE ZAHLEN HIER SIND ECHT. Es gibt keine erfundene Grösse, keinen
     * geschätzten Prozentsatz und keinen Balken ohne Messung — der Entwurf
     * zeigte „41,2 MB von 2 GB", und wenn der Browser diese Zahl nicht
     * herausgibt, steht hier keine. Danach richtet jemand seine Entscheidung
     * aus, ob er noch ein Video einfügt.
     * ====================================================================== */
    const sicherungsKarte = () => {
        const st = Sicherung.stand();
        const pk = Sicherung.papierkorb();
        const wieLang = st.tage === null ? 'noch nie'
            : st.tage === 0 ? 'heute'
                : st.tage === 1 ? 'gestern'
                    : 'vor ' + st.tage + ' Tagen';
        /* Die Stufe steht NICHT nur in der Farbe (§38): sie steht im Satz. */
        const satz = st.tage === null
            ? 'Noch keine vollständige Sicherung auf diesem Gerät'
            : st.stufe === 'gut' ? 'Gesichert ' + wieLang
                : st.stufe === 'erinnern' ? 'Zuletzt gesichert ' + wieLang + ' — Zeit für eine neue'
                    : 'Zuletzt gesichert ' + wieLang + ' — das ist lange her';
        const art = st.art === 'json'
            ? 'JSON · ohne Anhänge'
            : st.art === 'redion' ? '.redion · mit Anhängen' : '';
        const frist = !pk.anzahl ? 'nichts weggelegt'
            : !pk.tage ? pk.anzahl + (pk.anzahl === 1 ? ' Sache liegt weg' : ' Sachen liegen weg') +
                ' · keine Frist'
                : pk.anzahl + (pk.anzahl === 1 ? ' Sache liegt weg' : ' Sachen liegen weg') +
                    (pk.naechste === null ? '' :
                        pk.naechste === 0 ? ' · die nächste läuft heute ab'
                            : pk.naechste === 1 ? ' · die nächste läuft morgen ab'
                                : ' · noch ' + pk.naechste + ' Tage für die nächste');
        return '<details class="bib-pflege-details"><summary><span class="rmo-product-status" data-zustand="' +
            (st.stufe === 'gut' ? 'fertig' : 'wartet') + '">' + esc(satz) + '</span>' +
            '<span>Sicherung & Speicher</span></summary>' +
            '<section class="bib-abschnitt"><header><h2>Sicherung und Papierkorb</h2>' +
            '<p>alles auf diesem Gerät</p></header><div class="bib-pflege">' +
            `<div class="bib-pflege-karte bib-sicher-${esc(st.stufe)}">` +
            `<span class="bib-pflege-zeichen" data-sym="${st.stufe === 'gut' ? 'checkCircle' : 'bell'}" aria-hidden="true"></span>` +
            '<span><strong>' + esc(satz) + '</strong><small>' +
            (art || 'Eine vollständige Sicherung nimmt Seiten UND Anhänge mit') +
            '</small></span>' +
            '<button type="button" data-a="sichern">Jetzt sichern</button></div>' +
            '<div class="bib-pflege-karte">' +
            '<span class="bib-pflege-zeichen" data-sym="trash" aria-hidden="true"></span>' +
            '<span><strong>Papierkorb</strong><small>' + esc(frist) + '</small></span>' +
            '<button type="button" data-a="papierkorb">Öffnen</button></div>' +
            '</div></section>' + platzKarte() + '</details>';
    };
    /* Der Platz kommt als Versprechen und wird deshalb NACHGETRAGEN. Die Stelle
       steht sofort da und sagt, dass gerechnet wird — ein Kasten, der aus dem
       Nichts erscheint, verschiebt alles darunter, während man liest. */
    const platzKarte = () => '<section class="bib-abschnitt" data-bib-platz><header><h2>Platz auf dem Gerät</h2>' +
        '<p>wird gemessen …</p></header></section>';
    const platzNachtragen = (wrap) => {
        const stelle = wrap.querySelector('[data-bib-platz]');
        if (!stelle)
            return;
        void Sicherung.platz().then(p => {
            if (!stelle.isConnected)
                return;
            if (!p.bekannt) {
                /* KEINE ERFUNDENE ZAHL. Manche Browser geben `estimate()` nicht
                   heraus; dann steht hier, was bekannt ist, und sonst nichts. */
                stelle.innerHTML = '<header><h2>Platz auf dem Gerät</h2></header>' +
                    '<p class="bib-platz-unbekannt">Dieser Browser sagt nicht, wieviel Platz ' +
                    'Redion belegt.' + (p.anhaenge
                    ? ' Die Anhänge allein sind ' + esc(Sicherung.groesse(p.anhaenge)) + '.'
                    : '') + '</p>';
                return;
            }
            const anteil = Math.min(100, Math.round(p.belegt / p.gesamt * 1000) / 10);
            const anhangAnteil = p.belegt ? Math.min(100, p.anhaenge / p.belegt * 100) : 0;
            stelle.innerHTML = '<header><h2>Platz auf dem Gerät</h2>' +
                '<p>' + esc(Sicherung.groesse(p.belegt)) + ' von ' +
                esc(Sicherung.groesse(p.gesamt)) + ' · ' +
                anteil.toLocaleString('de-CH') + ' %</p></header>' +
                '<div class="bib-platz-balken" role="img" aria-label="' +
                esc(Sicherung.groesse(p.belegt) + ' von ' + Sicherung.groesse(p.gesamt) + ' belegt') + '">' +
                '<i style="width:' + anteil + '%"><b style="width:' + anhangAnteil + '%"></b></i>' +
                '</div>' +
                '<p class="bib-platz-teile">' +
                '<span class="bib-platz-anhang"></span>Anhänge ' +
                esc(Sicherung.groesse(p.anhaenge)) +
                '<span class="bib-platz-rest"></span>Seiten und Verwaltung ' +
                esc(Sicherung.groesse(Math.max(0, p.belegt - p.anhaenge))) +
                '</p>' +
                /* Der Browser rechnet seinen eigenen Verwaltungsaufwand mit; die
                   beiden Zahlen müssen nicht aufgehen, und das steht hier auch. */
                '<p class="bib-platz-hinweis">Geschätzt — der Browser meldet die ' +
                'Gesamtgrösse, die Aufteilung kommt aus dem Bestand.</p>';
        });
    };
    const BIB_BAUM_WURZEL = '__redion_bibliothek_wurzel__';
    const BIB_BAUM_OFFEN = 'bibBaumOffen';
    const bibliothekBaumKnoten = () => {
        const seiten = alleSeiten()
            .filter(p => p.parentTable !== 'collection');
        const nachId = new Map();
        seiten.forEach(p => nachId.set(String(p.id), p));
        const nachEltern = new Map();
        for (const p of seiten) {
            const parent = p.parentId && nachId.has(String(p.parentId))
                ? String(p.parentId)
                : '';
            const liste = nachEltern.get(parent) || [];
            liste.push(p);
            nachEltern.set(parent, liste);
        }
        const sortiere = (a, b) => {
            const aKinder = (nachEltern.get(String(a.id)) || []).length;
            const bKinder = (nachEltern.get(String(b.id)) || []).length;
            if (!!aKinder !== !!bKinder)
                return aKinder ? -1 : 1;
            return String(a.text || '').localeCompare(String(b.text || ''), 'de', { sensitivity: 'base', numeric: true });
        };
        const bauen = (p, gesehen) => {
            const id = String(p.id);
            if (gesehen.has(id))
                return { id, name: String(p.text || 'Ohne Titel'), zeichen: 'page' };
            const weiter = new Set(gesehen);
            weiter.add(id);
            const kinder = (nachEltern.get(id) || [])
                .slice()
                .sort(sortiere)
                .map(k => bauen(k, weiter));
            const farbe = Farben.kennung(p.color);
            return {
                id,
                name: String(p.text || 'Ohne Titel'),
                zeichen: kinder.length || p.heftArt === 'fach' ? 'pages' : 'page',
                /* Die Ordnerfarbe wandert in den Baum (E672): wer einen Ordner blau
                   macht, will ihn ÜBERALL blau sehen, nicht nur als Deckel. */
                ...(farbe ? { farbe } : {}),
                ...(kinder.length ? { kinder } : {})
            };
        };
        const wurzeln = (nachEltern.get('') || [])
            .slice()
            .sort(sortiere)
            .map(p => bauen(p, new Set()));
        return [{
                id: BIB_BAUM_WURZEL,
                name: 'Dokumente',
                zeichen: 'library',
                kinder: wurzeln
            }];
    };
    const bibliothekBaumNachtragen = (wrap) => {
        if (zustand.reiter !== 'ablage')
            return;
        const stelle = wrap.querySelector('[data-bib-baum]');
        if (!stelle)
            return;
        const Baum = window.Baumansicht;
        if (!Baum?.bauen) {
            stelle.innerHTML = '<p class="bib-baum-fehlt">Baumansicht konnte nicht geladen werden.</p>';
            return;
        }
        const gemerkt = Store.getMeta(BIB_BAUM_OFFEN, []);
        const offeneMeta = Array.isArray(gemerkt) ? gemerkt.map(String) : [];
        const pfad = ordnerWeg().map(p => String(p.id));
        const offen = [...new Set([BIB_BAUM_WURZEL, ...offeneMeta, ...pfad])];
        const griff = Baum.bauen({
            name: 'Dokumente',
            knoten: bibliothekBaumKnoten(),
            gewaehlt: zustand.ordner || BIB_BAUM_WURZEL,
            offen,
            gewaehltGeaendert: (id) => {
                if (id === BIB_BAUM_WURZEL) {
                    geheIn(null);
                    return;
                }
                const p = Store.getBlock(id);
                if (!p || p.alive === false || !permitted('lesen', id))
                    return;
                if (artVon(p).id === 'ordner') {
                    geheIn(id);
                    return;
                }
                App.oeffne(id);
            },
            offenGeaendert: (ids) => {
                if (Store.setMeta)
                    Store.setMeta(BIB_BAUM_OFFEN, ids);
            }
        });
        stelle.replaceChildren(griff.element);
    };
    /**
     * DIE FILTERZEILE NACH ART — und wann sie WEGBLEIBT (6. September).
     *
     * Sie stand immer da, auch als „Alle · Seiten": ein Filter mit einer
     * einzigen Wahl filtert nichts, kostet aber eine Zeile über den Deckeln
     * — am Telefon eine von sieben. Redur: „nicht 20 Werkzeuggruppen
     * gleichzeitig". Jetzt erscheint sie erst, wenn es zwei Arten zu
     * unterscheiden gibt; ein gesetzter Filter bleibt immer sichtbar, sonst
     * käme man aus ihm nicht mehr heraus.
     */
    const artenZeile = (vorhanden) => {
        const arten = ART_FILTER.filter(a => a.id === 'alle' || vorhanden.has(a.id) ||
            a.id === zustand.art);
        if (arten.length <= 2 && zustand.art === 'alle')
            return '';
        return '<div class="bib-arten" role="group" aria-label="Nach Art filtern">' +
            arten.map(a => `<button data-art="${esc(a.id)}"` +
                (zustand.art === a.id ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') +
                `>${esc(a.name)}</button>`).join('') +
            '</div>';
    };
    /* ---------------------------------------------------------------- *
     * DIE DECKELANSICHT (E236)
     * ---------------------------------------------------------------- */
    const zeichneDeckel = (wrap) => {
        const { liste: alle, gesamt } = auswahl();
        const liste = zustand.art === 'alle'
            ? alle : alle.filter(p => artVon(p).id === zustand.art);
        /* Welche Arten es überhaupt GIBT — ein Filter für eine Art, die
           niemand hat, ist ein Knopf, der immer leer antwortet. */
        const vorhanden = new Set(alle.map(p => artVon(p).id));
        wrap.innerHTML =
            '<div class="bib bib-deckel-seite">' +
                deckelKopf(alle.length, gesamt) +
                (zustand.reiter === 'ablage'
                    ? '<div class="bib-ablage-layout">' +
                        '<details class="bib-ablage-baum" aria-label="Ablagebaum"' +
                        (Store.getMeta('bibBaumSichtbar', false) ? ' open' : '') + '>' +
                        '<summary class="bib-ablage-baum-kopf">Ordner & Seiten</summary>' +
                        '<div data-bib-baum></div>' +
                        '</details><div class="bib-ablage-inhalt">'
                    : '') +
                studioNavigation() + studioWeiter() + recentCarousel() +
                artenZeile(vorhanden) +
                (liste.length
                    ? '<div class="bib-gitter">' + liste.map(deckelKarte).join('') + '</div>'
                    : '<p class="bib-leer">' + (zustand.art === 'alle'
                        ? 'Hier ist noch nichts. Tippe auf „Neu", um anzufangen.'
                        : 'Von dieser Art gibt es hier nichts.') + '</p>') +
                /* DIE SICHERUNG UND DER PLATZ GEHÖREN IN JEDE FORM.
                   Der erste Entwurf liess beide weg — sie standen nur im
                   Heftregal, und das ist seit E236 nicht mehr die Vorgabe. Damit
                   war die Warnung „du hast noch nie gesichert" aus der Ansicht
                   verschwunden, die jetzt jeder zuerst sieht.
        
                   Das ist keine Zierde: §11 nennt die Sicherung eine
                   Sicherheitsfunktion, und §46 stellt Datenintegrität vor alles
                   andere. Eine Warnung, die man nur in einer Ansicht sieht, die
                   kaum jemand öffnet, ist keine Warnung. */
                (zustand.reiter === 'ablage' ? '</div></div>' : '') +
                sicherungsKarte() +
                '</div>';
        if (typeof Register !== 'undefined' && Register.symbole)
            Register.symbole.fuelle(wrap);
        binde(wrap);
        bibliothekBaumNachtragen(wrap);
        platzNachtragen(wrap);
        /* Die Adressen der Vorschaubilder kommen aus der Ablage und damit
           später als die Karte (E313). */
        if (Vorschau.bilderNachtragen)
            Vorschau.bilderNachtragen(wrap);
    };
    /**
     * Der Kopf der Deckelansicht: Titel, „+ Neu", Formwahl.
     *
     * ER IST NICHT `bibKopf`. Der alte Kopf trägt die Reiter (wo liegt es)
     * und zwei Formknöpfe; dieser trägt die Handlung. Beide zusammen wären
     * vier Bänke übereinander — genau das, was Redur rot angestrichen hat.
     * Die Reiter sind deshalb hier ein Menü hinter dem Titel.
     */
    /**
     * Der Kopf der Deckelansicht: Titel, „+ Neu", Formwahl.
     *
     * DER TITEL HEISST „DOKUMENTE" UND NICHT WIE DER REITER. Der erste
     * Entwurf setzte den Reiternamen als Überschrift — und „Kürzlich
     * verwendet" ist bei 24 px so breit, dass der Neu-Knopf in die nächste
     * Zeile fiel und aus einer Bank zwei wurden. Ausserdem stimmt es nicht:
     * die Seite IST das Regal, der Reiter ist nur ein Filter darauf. Er
     * steht deshalb klein darunter, zusammen mit der Zahl.
     */
    const deckelKopf = (anzahl, gesamt = anzahl) => {
        const ort = REITER.find(r => r.id === zustand.reiter)?.name || 'Alle';
        /* DER TITEL IST DER ORDNER, IN DEM MAN STEHT (E380) — wie in GoodNotes:
           oben steht nicht die App, sondern wo man ist. An der Wurzel bleibt es
           „Dokumente". */
        const weg = zustand.reiter === 'ablage' ? ordnerWeg() : [];
        const hier = weg.length ? String(weg[weg.length - 1].text || 'Ohne Titel') : 'Dokumente';
        return '<header class="bib-dkopf">' +
            ordnerKrume() +
            '<h1>' + esc(hier) + '</h1>' +
            '<button class="bib-neu" data-neu-auf>' +
            '<b aria-hidden="true">+</b><span>Neu</span></button>' +
            /* EIN WORT FÜR EINE HANDLUNG (E516). Der Knopf im Kopf heisst „PDF
               öffnen", dieser hiess „PDF importieren" — zwei Namen für dasselbe,
               und keiner von beiden war der, den man las: sichtbar war im Regal
               nur die Karte „Weiterarbeiten", die auch „PDF öffnen" hiess.
               Jetzt tragen beide Importknöpfe dasselbe Wort und dasselbe
               gezeichnete Zeichen, und sonst niemand. */
            '<button class="bib-studio-import" data-studio-import' +
            (pdfImportLaeuft || !permitted('bearbeiten', zustand.ordner || undefined)
                ? ' disabled title="Import läuft oder Bearbeitungsrechte fehlen"' : '') +
            '><span data-sym="plus" aria-hidden="true"></span>' +
            '<span class="wort">' + IMPORT_WORT + '</span></button>' +
            '<button class="bib-form-knopf" data-form="' + (form() === 'liste' ? 'deckel' : 'liste') + '" ' +
            'aria-label="' + (form() === 'liste' ? 'Als Dokumente anzeigen' : 'Als Liste anzeigen') + '">' +
            '<span data-sym="' + (form() === 'liste' ? 'library' : 'menu') + '" aria-hidden="true"></span></button>' +
            '<button class="bib-ort" data-orte aria-haspopup="menu">' +
            esc(ort) + ' \u00b7 ' +
            umfangSatz(anzahl, gesamt, 'Dokument', 'Dokumente', 'Dokumenten') +
            '<i aria-hidden="true">\u25be</i></button>' +
            '</header>';
    };
    const zeichneRegal = (wrap) => {
        const { liste: alle, gesamt } = auswahl();
        const liste = zustand.art === 'alle' ? alle : alle.filter(p => artVon(p).id === zustand.art);
        const regal = hefte(liste);
        /* „Zuletzt in der Hand" ist bewusst NICHT dasselbe wie das Regal: dort
           steht je Heft die neueste Seite, hier die neuesten Seiten überhaupt.
           Wer den ganzen Tag in einem Heft war, sieht hier seinen Tag. */
        const hand = liste.slice()
            .sort((a, b) => zeitZahl(b.edited || b.created) - zeitZahl(a.edited || a.created))
            /* VIER, NICHT FÜNF. Dieselbe Waise wie bei den Kennzahlen in E204:
               fünf Karten in einem Vierspalter lassen eine allein in der zweiten
               Reihe stehen, daneben drei Viertel weisse Fläche. */
            .slice(0, 4);
        wrap.innerHTML =
            '<div class="bib bib-regal-seite">' +
                bibKopf(liste, regal.length, gesamt) +
                (regal.length
                    ? '<div class="bib-regal">' + regal.map(heftKarte).join('') + '</div>'
                    : '<p class="bib-leer">Hier ist noch nichts. Seiten erscheinen automatisch.</p>') +
                (hand.length > 1
                    ? '<section class="bib-abschnitt"><header><h2>Zuletzt in der Hand</h2>' +
                        '<p>heftübergreifend</p></header>' +
                        '<div class="bib-hand-reihe">' + hand.map(handKarte).join('') + '</div></section>'
                    : '') +
                sicherungsKarte() +
                '</div>';
        if (typeof Register !== 'undefined' && Register.symbole)
            Register.symbole.fuelle(wrap);
        binde(wrap);
        platzNachtragen(wrap);
    };
    /** Was in beiden Formen gleich funktioniert: öffnen und umschalten. */
    const binde = (wrap) => {
        wrap.querySelectorAll('[data-rmo-open]').forEach(button => button.addEventListener('click', () => {
            const id = button.dataset.rmoOpen;
            if (id && permitted('lesen', id))
                App.oeffne(id);
        }));
        wrap.querySelector('[data-rmo-import]')?.addEventListener('click', pdfImportieren);
        wrap.querySelector('[data-rmo-new]')?.addEventListener('click', () => document.getElementById('btn-neu-handy')?.click());
        wrap.querySelector('.bib-ablage-baum')?.addEventListener('toggle', event => {
            Store.setMeta('bibBaumSichtbar', event.currentTarget.open);
        });
        wrap.querySelector('.bib-studio-sammlungen')?.addEventListener('change', event => {
            const ziel = event.currentTarget.value;
            if (ziel && typeof Arbeitswelt !== 'undefined')
                Arbeitswelt.oeffnen(ziel);
        });
        wrap.querySelectorAll('[data-studio-weg]').forEach(button => button.addEventListener('click', () => {
            const weg = button.dataset.studioWeg || 'ablage';
            zustand.reiter = weg === 'pdf' ? 'alle' : weg;
            zustand.art = weg === 'pdf' ? 'pdf' : 'alle';
            zustand.ordner = null;
            App.zeichneSeite();
        }));
        wrap.querySelector('[data-studio-import]')?.addEventListener('click', pdfImportieren);
        wrap.querySelector('[data-studio-weiter]')?.addEventListener('click', event => {
            const id = event.currentTarget.dataset.studioWeiter;
            if (id && permitted('lesen', id))
                App.oeffne(id);
        });
        wrap.querySelector('#bib-studio-suche')?.addEventListener('input', event => {
            const input = event.currentTarget;
            zustand.suche = input.value;
            const cursor = input.selectionStart;
            App.zeichneSeite();
            const neu = wrap.querySelector('#bib-studio-suche');
            neu?.focus();
            if (neu && cursor !== null) {
                try {
                    neu.setSelectionRange(cursor, cursor);
                }
                catch { /* search inputs */ }
            }
        });
        wrap.querySelectorAll('.bib-reiter [data-r]').forEach(b => b.addEventListener('click', () => {
            if (b.dataset['r'] === 'mehr') {
                const r = b.getBoundingClientRect();
                const m = UI.menu(REITER.slice(4).map(x => `<button data-x="${x.id}"><span class="mi">${x.icon}</span>${esc(x.name)}</button>`).join(''), r.left, r.bottom + 4);
                m.addEventListener('click', ev => {
                    const x = elVon(ev)?.closest('[data-x]');
                    if (!x)
                        return;
                    zustand.reiter = x.dataset['x'] ?? zustand.reiter;
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            zustand.reiter = b.dataset['r'] ?? zustand.reiter;
            App.zeichneSeite();
        }));
        wrap.querySelectorAll('[data-form]').forEach(b => b.addEventListener('click', () => {
            const f = b.dataset['form'] === 'liste' ? 'liste' : b.dataset['form'] === 'deckel' ? 'deckel' : 'regal';
            Store.setMeta('bibForm', f);
            App.zeichneSeite();
        }));
        wrap.querySelectorAll('.bib-pflege [data-a]').forEach(b => b.addEventListener('click', ereignis => {
            ereignis.stopPropagation();
            if (b.dataset['a'] === 'papierkorb') {
                App.papierkorb();
                return;
            }
            /* Gesichert wird über denselben Weg wie im Menü — ein zweiter
               Sicherungspfad wäre ein zweiter, der schiefgehen kann, und nur
               einer von beiden hält den Zeitpunkt fest. */
            void App.sicherungSpeichern();
        }));
        wrap.querySelectorAll('.bib-heft[data-id], .bib-hand[data-id]').forEach(k => k.addEventListener('click', () => {
            const id = k.dataset['id'];
            if (id)
                App.oeffne(id);
        }));
        /* --- Die Deckelansicht (E236) ---------------------------------- */
        wrap.querySelectorAll('.bib-arten [data-art]').forEach(b => b.addEventListener('click', () => {
            zustand.art = b.dataset['art'] ?? 'alle';
            App.zeichneSeite();
        }));
        wrap.querySelectorAll('[data-orte]').forEach(b => b.addEventListener('click', () => {
            const r = b.getBoundingClientRect();
            /* Die Reiter als Menü hinter dem Titel — dieselbe Liste wie in der
               Tabelle, nur nicht als eigene Bank. Sonst stünden hier vier
               Zeilen übereinander, bevor das erste Dokument kommt. */
            const m = UI.menu(REITER.map(x => `<button data-x="${x.id}"${zustand.reiter === x.id ? ' class="on"' : ''}>` +
                `<span class="mi">${x.icon}</span>${esc(x.name)}</button>`).join('') +
                '<div class="sep"></div>' +
                '<button data-x="__deckel"><span class="mi">\u25a6</span>Als Dokumente</button>' +
                '<button data-x="__regal"><span class="mi">\u25a4</span>Nach Heften ordnen</button>' +
                '<button data-x="__liste"><span class="mi">\u2630</span>Als Tabelle</button>', r.left, r.bottom + 6);
            m.addEventListener('click', ev => {
                const x = elVon(ev)?.closest('[data-x]');
                if (!x)
                    return;
                const wahl = x.dataset['x'] ?? '';
                m.remove();
                if (wahl === '__regal') {
                    Store.setMeta('bibForm', 'regal');
                }
                else if (wahl === '__deckel') {
                    Store.setMeta('bibForm', 'deckel');
                }
                else if (wahl === '__liste') {
                    Store.setMeta('bibForm', 'liste');
                }
                else {
                    zustand.reiter = wahl || zustand.reiter;
                    zustand.art = 'alle';
                }
                App.zeichneSeite();
            });
        }));
        wrap.querySelectorAll('[data-neu-auf]').forEach(b => b.addEventListener('click', () => App.erstellenBlatt(b)));
        wrap.querySelectorAll('[data-hoch]').forEach(b => b.addEventListener('click', () => geheHoch()));
        /* Ist der Pfad länger als der Schirm (am Telefon schon ab der dritten
           Ebene), zeigt die Brotkrume von sich aus die WURZEL und schneidet das
           ab, wo man gerade steht. Genau umgekehrt gewollt: der aktuelle Ordner
           ist das Wichtigste. Also ans Ende scrollen. Der Zurück-Pfeil klebt
           links (CSS) und bleibt trotzdem sichtbar. (E381) */
        wrap.querySelectorAll('.bib-krume').forEach(krume => {
            krume.scrollLeft = krume.scrollWidth;
        });
        wrap.querySelectorAll('[data-ordner]').forEach(b => b.addEventListener('click', () => geheIn(b.dataset['ordner'] || null)));
        blickAnbringen(wrap);
        wrap.querySelectorAll('.bib-deckel[data-id]').forEach(k => {
            k.addEventListener('click', ereignis => {
                /* Der Pfeil im Namen öffnet das Menü zum Stück, nicht das Stück. */
                if (ereignis.target instanceof Element &&
                    ereignis.target.closest('.bib-deckel-mehr'))
                    return;
                const id = k.dataset['id'];
                if (!id)
                    return;
                /* EIN ORDNER IST EIN ORT, KEIN DOKUMENT (E380). Bis hierher ging
                   auch er durch `App.oeffne` — und man landete in einer leeren
                   Seite mit Cursor, weil `Inhaltsflaeche` einem Fach ohne Kinder
                   sogar einen Textblock anlegt. Der Inhalt stand nur links im
                   Baum. */
                if (zustand.reiter === 'ablage' && k.dataset['art'] === 'ordner') {
                    geheIn(id);
                    return;
                }
                App.oeffne(id);
            });
            k.querySelector('.bib-deckel-mehr')?.addEventListener('click', ereignis => {
                ereignis.stopPropagation();
                const id = k.dataset['id'];
                const p = id ? Store.getBlock(id) : null;
                if (!p)
                    return;
                const r = k.getBoundingClientRect();
                const m = UI.menu(`<button data-a="oeffnen"><span class="mi">\u2197</span>Öffnen</button>` +
                    /* NUR BEI ORDNERN. Ein Blick in eine PDF wäre die PDF — dafür
                       gibt es „Öffnen". */
                    (k.dataset['art'] === 'ordner'
                        ? `<button data-a="blick"><span class="mi">\u2315</span>Blick hinein</button>` : '') +
                    `<button data-a="stern"><span class="mi">${p.favorite ? '\u2605' : '\u2606'}</span>` +
                    (p.favorite ? 'Aus Favoriten' : 'Zu Favoriten') + '</button>' +
                    '<button data-a="umbenennen"><span class="mi">\u270e</span>Umbenennen</button>' +
                    /* „FARBE …" (E672): derselbe Wähler wie in den Notizheften, nur mit
                       einem anderen `danach` — hier wird die Bibliothek neu gezeichnet. */
                    (typeof Notebook !== 'undefined' && typeof Notebook.farbMenue === 'function'
                        ? '<button data-a="farbe"><span class="mi">\u25cf</span>Farbe \u2026</button>' : '') +
                    '<div class="sep"></div>' +
                    '<button data-a="papierkorb"><span class="mi">\u2327</span>In den Papierkorb</button>', Math.min(r.left, innerWidth - 230), r.bottom + 4);
                m.addEventListener('click', ev => {
                    const b = elVon(ev)?.closest('[data-a]');
                    if (!b)
                        return;
                    const a = b.dataset['a'];
                    m.remove();
                    if (a === 'oeffnen') {
                        App.oeffne(p.id);
                        return;
                    }
                    if (a === 'blick') {
                        blickHinein(p, r);
                        return;
                    }
                    if (a === 'stern') {
                        Store.updateBlock(p.id, { favorite: !p.favorite });
                    }
                    if (a === 'farbe') {
                        Notebook.farbMenue(k, p.id, () => App.zeichneSeite());
                        return;
                    }
                    if (a === 'umbenennen') {
                        /* Umbenannt wird auf der Seite selbst — ein zweites Eingabefeld
                           für denselben Titel wäre eine zweite Wahrheit (§8). */
                        App.oeffne(p.id);
                        setTimeout(() => document.getElementById('title')?.focus(), 80);
                        return;
                    }
                    if (a === 'papierkorb') {
                        /* NICHT LÖSCHEN, SONDERN IN DEN PAPIERKORB. `alive: false` ist
                           umkehrbar; `Store.removeBlock` wäre es nicht (§46). */
                        Store.updateBlock(p.id, { alive: false });
                        UI.toast('„' + (p.text || 'Ohne Titel') + '" liegt im Papierkorb');
                    }
                    App.zeichneSeite();
                });
            });
        });
    };
    const zeichnen = (wrap) => {
        if (zustand.reiter === 'schule') {
            zeichneSchule(wrap);
            return;
        }
        if (form() === 'deckel') {
            zeichneDeckel(wrap);
            return;
        }
        if (form() === 'regal') {
            zeichneRegal(wrap);
            return;
        }
        const { liste: alle, gesamt } = auswahl();
        const liste = zustand.art === 'alle' ? alle : alle.filter(p => artVon(p).id === zustand.art);
        const spalten = SPALTEN.filter(s => zustand.spalten.includes(s.id));
        const raster = spalten.map(s => s.breit).join(' ');
        wrap.innerHTML =
            '<div class="bib">' +
                bibKopf(liste, hefte(liste).length, gesamt) +
                /* Eigene Klasse: `bib-kopf` trägt seit E207 Reiter und Umschalter und
                   steht in BEIDEN Formen. Zwei Elemente mit demselben Namen auf einer
                   Seite sind zwei Dinge, die gleich aussehen sollen und es beim
                   nächsten Stilzusatz nicht mehr tun. */
                '<div class="bib-kopf bib-kopf-liste">' +
                '<div class="bib-werkzeuge">' +
                '<button data-a="filter" title="Filtern">⚟</button>' +
                '<button data-a="suche" title="Suchen">🔍</button>' +
                '<button data-a="spalten" title="Eigenschaften">⚙</button>' +
                '<button data-a="neu" class="prim">Neue Seite</button>' +
                '</div>' +
                '</div>' +
                (zustand.sucheOffen
                    ? `<div class="bib-suchzeile">🔍 <input id="bib-suche" value="${esc(zustand.suche)}" ` +
                        'placeholder="Seiten durchsuchen …"><button data-a="suchzu">✕</button></div>' : '') +
                `<div class="bib-tab" style="--bib-raster:${raster}">` +
                '<div class="bib-zeile bib-kopfzeile">' +
                spalten.map(s => `<div data-s="${s.id}"><span>${s.icon}</span>${esc(s.name)}` +
                    (zustand.sortier === s.id ? `<em>${zustand.richtung === 'auf' ? '↑' : '↓'}</em>` : '') +
                    '</div>').join('') +
                '</div>' +
                (liste.length
                    ? liste.map(p => {
                        const q = quelleVon(p);
                        const kinder = Store.childrenOf(p.id)
                            .filter((k) => k.type === 'page' &&
                            (k.parentTable === 'collection'
                                ? collectionPermitted('lesen', k.parentId)
                                : permitted('lesen', k.id))).length;
                        const zellen = {
                            name: `<div class="bib-name">${kinder ? '<b class="bib-pfeil">▸</b>' : '<b class="bib-pfeil leer"></b>'}` +
                                `<span class="bib-ico">${p.icon || (p.parentTable === 'collection' ? '▦' : '📄')}</span>` +
                                `<span class="bib-txt">${esc(p.text || 'Ohne Titel')}</span></div>`,
                            von: `<div class="bib-person"><span class="bib-kreis">` +
                                `${esc((p.erstelltVon || 'Ich').slice(0, 1).toUpperCase())}</span>` +
                                `${esc(p.erstelltVon || 'Ich')}</div>`,
                            quelle: `<div class="bib-quelle"><span>${q.icon}</span>${esc(q.text)}</div>`,
                            wann: `<div class="bib-wann">${esc(wannText(p.edited || p.created))}</div>`
                        };
                        return `<div class="bib-zeile" data-id="${p.id}" data-art="${artVon(p).id}">` +
                            spalten.map(s => zellen[s.id]).join('') + '</div>';
                    }).join('')
                    : '<div class="bib-leer">Hier ist noch nichts. Seiten erscheinen automatisch.</div>') +
                '</div>' +
                `<div class="bib-fuss">${liste.length} ${liste.length === 1 ? 'Seite' : 'Seiten'}</div>` +
                '</div>';
        if (typeof Register !== 'undefined' && Register.symbole)
            Register.symbole.fuelle(wrap);
        binde(wrap);
        /* Die Reiter bindet `binde()` — sie stehen jetzt im gemeinsamen Kopf
           und gehören beiden Formen. Hier stand dieselbe Schleife ein zweites
           Mal; zwei Bindungen an einem Knopf hätten ihn doppelt ausgelöst. */
        /* Sortieren durch Klick auf den Spaltenkopf */
        wrap.querySelectorAll('.bib-kopfzeile [data-s]').forEach((d) => d.addEventListener('click', () => {
            if (zustand.sortier === d.dataset.s)
                zustand.richtung = zustand.richtung === 'auf' ? 'ab' : 'auf';
            else {
                zustand.sortier = d.dataset.s;
                zustand.richtung = 'auf';
            }
            App.zeichneSeite();
        }));
        /* Zeile öffnen */
        wrap.querySelectorAll('.bib-zeile[data-id]').forEach((z) => z.addEventListener('click', () => {
            /* Auch in der Liste ist ein Ordner ein Ort, kein Dokument
               (E380/E382). Die Deckelansicht ging schon hinein; hier stand noch
               die alte Öffnung — ein Fach wäre als leere Seite aufgegangen statt
               eine Ebene tiefer zu führen. Die Nachbarstelle, §45. */
            if (zustand.reiter === 'ablage' && z.dataset.art === 'ordner') {
                geheIn(z.dataset.id);
                return;
            }
            App.oeffne(z.dataset.id);
        }));
        /* Werkzeuge */
        wrap.querySelectorAll('.bib-werkzeuge button, [data-a="suchzu"]').forEach((b) => b.addEventListener('click', () => {
            const a = b.dataset.a;
            if (a === 'neu') {
                if (!permitted('bearbeiten')) {
                    UI.toast('Du darfst hier keine neue Seite anlegen.');
                    return;
                }
                const p = Store.addPage(null, { text: '' });
                App.oeffne(p.id);
                setTimeout(() => document.getElementById('title')?.focus(), 60);
            }
            if (a === 'suche') {
                zustand.sucheOffen = true;
                App.zeichneSeite();
                document.getElementById('bib-suche')?.focus();
            }
            if (a === 'suchzu') {
                zustand.suche = '';
                zustand.sucheOffen = false;
                App.zeichneSeite();
            }
            if (a === 'filter') {
                const r = b.getBoundingClientRect();
                const m = UI.menu('<div class="grp">Nur zeigen</div>' +
                    REITER.map(x => `<button data-x="${x.id}"><span class="mi">${x.icon}</span>${esc(x.name)}` +
                        (zustand.reiter === x.id ? '<span class="ms">✓</span>' : '') + '</button>').join(''), r.left - 160, r.bottom + 4);
                m.addEventListener('click', ev => {
                    const x = elVon(ev)?.closest('[data-x]');
                    if (!x)
                        return;
                    zustand.reiter = x.dataset.x ?? zustand.reiter;
                    m.remove();
                    App.zeichneSeite();
                });
            }
            if (a === 'spalten') {
                const r = b.getBoundingClientRect();
                const m = UI.menu('<div class="grp">Eigenschaften</div>' +
                    SPALTEN.map(s => `<button data-x="${s.id}"><span class="mi">${s.icon}</span>${esc(s.name)}` +
                        `<span class="ms">${zustand.spalten.includes(s.id) ? 'an' : 'aus'}</span></button>`).join(''), r.left - 160, r.bottom + 4);
                m.addEventListener('click', ev => {
                    const x = elVon(ev)?.closest('[data-x]');
                    if (!x)
                        return;
                    const sid = x.dataset.x;
                    if (!sid || sid === 'name')
                        return; /* Der Name bleibt */
                    zustand.spalten = zustand.spalten.includes(sid)
                        ? zustand.spalten.filter(y => y !== sid)
                        : [...zustand.spalten, sid];
                    m.remove();
                    App.zeichneSeite();
                });
            }
        }));
        const si = document.getElementById('bib-suche');
        if (si) {
            si.addEventListener('input', () => {
                zustand.suche = si.value;
                const stelle = si.selectionStart;
                App.zeichneSeite();
                const neu = document.getElementById('bib-suche');
                if (neu) {
                    neu.focus();
                    neu.setSelectionRange(stelle, stelle);
                }
            });
        }
    };
    /**
     * Das Regal öffnen.
     *
     * ZWEI SACHEN STEHEN HIER UND NICHT BEIM AUFRUFER (E236).
     *
     * `Seitenleiste.reiter('dokumente')` markiert den Weg unten. Er stand
     * zuerst nur im Knopf `hl-dok` — und damit leuchtete unten „Heute",
     * sobald das Regal von woanders aufging: vom Start, aus dem Mehr-Blatt,
     * über einen Verweis. Eine Markierung, die nur bei EINEM von vier Wegen
     * stimmt, ist schlimmer als keine.
     *
     * Und der Name lautet „Dokumente", nicht „Bibliothek": die Seite
     * schreibt es gross darüber, Redur nennt es so, und zwei Namen für
     * dieselbe Sache sind einer zu viel. Das Modul heisst weiter
     * `Bibliothek` — es ist der Ordner, nicht die Aufschrift.
     */
    /**
     * Das Regal öffnen — wahlweise in einem bestimmten Ordner (E380).
     *
     * Das Ziel ist der Draht, den der ZIP-Import gebraucht hat: `importZip`
     * kennt seit E350 die Kennung des entstandenen Wurzelfachs, gab sie
     * zurück — und niemand las sie. Jetzt springt der Bildschirm dorthin,
     * statt den Menschen einen Toast lesen zu lassen.
     */
    const oeffne = (ordnerId) => {
        try {
            Seitenleiste.reiter('dokumente');
        }
        catch { /* ohne Leiste kein Reiter */ }
        if (ordnerId !== undefined) {
            zustand.reiter = 'ablage';
            zustand.art = 'alle';
            zustand.ordner = ordnerId || null;
            if (typeof Store !== 'undefined' && Store.setMeta)
                Store.setMeta(ORDNER_SCHLUESSEL, zustand.ordner || '');
        }
        else if (zustand.reiter === 'ablage' && zustand.ordner === null) {
            /* Beim gewöhnlichen Öffnen den gemerkten Ordner aufnehmen — wer die
               App zumacht, während er in einem Ordner steht, steht danach wieder
               darin (wie das Heftregal seit E282). */
            zustand.ordner = ordnerLesen();
        }
        App.zeigeSonder('Dokumente', zeichnen);
    };
    /**
     * „ALLE SEITEN" — der Reiter „Alle", die flache Liste über den ganzen
     * Bestand, ohne Ordnerstufen (6. September).
     *
     * Bis dahin rief der Navigationseintrag `app-bib` („Alle Seiten") wie
     * `bibliothekOben` einfach `oeffne()` — seit die Bibliothek das Regal
     * direkt öffnet, waren das zwei Wege zu genau demselben Ziel, und die
     * Zeile in der Kontextkante rief `alleSeiten()`, den Datenhelfer: ein
     * Knopf, der eine Liste zurückgab und nichts zeigte. Jetzt ist es ein
     * eigener Ort mit eigener Adresse (`#alle-seiten`, `SONDER_START` in
     * schale.ts), und das Regal bleibt, was es ist.
     */
    const alleZeigen = () => {
        try {
            Seitenleiste.reiter('dokumente');
        }
        catch { /* ohne Leiste kein Reiter */ }
        zustand.reiter = 'alle';
        zustand.art = 'alle';
        App.zeigeSonder('Alle Seiten', zeichnen);
    };
    /* ------------------------------------------------------------------ *
     * MEINE AUFGABEN
     *
     * Notion sammelt hier alle Zeilen, in denen eine Person-Eigenschaft auf
     * dich zeigt und ein Status/Kontrollkästchen offen ist. Welche Datenbanken
     * dazugehören, lässt sich einstellen — genau das macht
     * „Aufgabenquellen konfigurieren".
     * ------------------------------------------------------------------ */
    const quellenLesen = () => Store.getMeta('aufgabenQuellen', null);
    /**
     * Alle Datenbanken, die als Aufgabenquelle taugen. Wurde eine ausdrücklich
     * „In Aufgaben umgewandelt", zählt sie in jedem Fall — das ist Notions
     * eigener Schalter unter Weitere Einstellungen.
     */
    const moegliche = () => Object.values(Store.cache.collections).filter(c => {
        if (!collectionPermitted('lesen', c.id))
            return false;
        if (c.istAufgaben)
            return true;
        const t = Object.values(c.schema || {}).map(d => d.type);
        return t.includes('checkbox') || t.includes('status');
    });
    const meineAufgaben = () => {
        const konto = typeof Konten !== 'undefined' && Konten.aktiv ? Konten.aktiv() : null;
        const meinName = (konto && konto.name) || 'Ich';
        const gewaehlt = quellenLesen();
        const quellen = moegliche().filter(c => !gewaehlt || gewaehlt.includes(c.id));
        const raus = [];
        quellen.forEach(coll => {
            const schema = coll.schema || {};
            const personKey = Object.keys(schema).find(k => schema[k].type === 'person');
            const statusKey = Object.keys(schema).find(k => schema[k].type === 'status');
            const hakenKey = Object.keys(schema).find(k => schema[k].type === 'checkbox');
            const datumKey = Object.keys(schema).find(k => schema[k].type === 'date');
            const titelKey = Object.keys(schema).find(k => schema[k].type === 'title') || 'name';
            Store.rowsOf(coll.id).forEach((row) => {
                const pr = row.props || {};
                /* WEM GEHÖRT EINE ZEILE?
                   Die Personenspalte sagt es, wenn sie gefüllt ist. Sonst gehört die
                   Zeile dem, der sie ansieht — auf einem Bestand, der auf diesem
                   Gerät liegt, ist das die einzige Lesart, und in einem geteilten
                   Arbeitsbereich gibt es die Personenspalte genau dafür.
        
                   VORHER STAND HIER EIN VERGLEICH MIT DEM ANLEGER, und der hat
                   gekostet: `Store.addRow` schrieb `erstelltVon` gar nicht, also lief
                   der Vergleich gegen den Ersatzwert „Ich". Gemessen am 25. August —
                   derselbe Bestand, nur der Name in den Einstellungen geändert:
        
                       Name leer („Ich")   5 Aufgaben
                       Name „Redur"        0 Aufgaben
        
                   Die ganze Aufgabenliste war weg, und nichts sagte warum. Und selbst
                   mit geschriebenem `erstelltVon` wäre es falsch geblieben: wer sich
                   umbenennt, verliert sonst rückwirkend, was er angelegt hat.
        
                   Eine leere Personenzelle zählt aus demselben Grund wie eine
                   fehlende Spalte — beide Male steht nirgends ein anderer Name
                   (E152). */
                const wer = personKey ? String(pr[personKey] || '').trim() : '';
                const meins = !wer || wer.toLowerCase().includes(meinName.toLowerCase());
                if (!meins)
                    return;
                const fertig = hakenKey ? !!pr[hakenKey]
                    : statusKey ? /fertig|erledigt|done|abgeschlossen/i.test(String(pr[statusKey] || '')) : false;
                raus.push({
                    id: row.id, coll,
                    pageId: collectionPageId(coll.id),
                    titel: pr[titelKey] || row.text || 'Ohne Titel',
                    status: statusKey ? (pr[statusKey] || '—') : (fertig ? 'Fertig' : 'Offen'),
                    datum: datumKey ? pr[datumKey] : '',
                    fertig, hakenKey, statusKey,
                    bearbeitbar: collectionPermitted('bearbeiten', coll.id)
                });
            });
        });
        raus.sort((a, b) => (a.fertig ? 1 : 0) - (b.fertig ? 1 : 0) ||
            String(a.datum || '9999').localeCompare(String(b.datum || '9999')));
        return raus;
    };
    /* Filter, Sortierung und Suche der Aufgabenseite */
    let aZustand = { nurOffen: false, sortier: 'datum', suche: '', sucheOffen: false };
    const zeichneAufgaben = (wrap) => {
        let liste = meineAufgaben();
        if (aZustand.nurOffen)
            liste = liste.filter(a => !a.fertig);
        if (aZustand.suche) {
            const s = aZustand.suche.toLowerCase();
            liste = liste.filter(a => a.titel.toLowerCase().includes(s));
        }
        if (aZustand.sortier === 'titel')
            liste = [...liste].sort((a, b) => a.titel.localeCompare(b.titel));
        if (aZustand.sortier === 'datenbank')
            liste = [...liste].sort((a, b) => a.coll.name.localeCompare(b.coll.name));
        const offen = liste.filter(a => !a.fertig);
        const fertig = liste.filter(a => a.fertig);
        wrap.innerHTML =
            '<div class="bib">' +
                '<h1 class="bib-titel">Meine Aufgaben</h1>' +
                '<div class="bib-kopf">' +
                '<div class="bib-reiter">' +
                '<button class="on"><span>☑</span>Meine Aufgaben</button>' +
                '</div>' +
                '<div class="bib-werkzeuge">' +
                `<button data-a="afilter" title="Filtern"${aZustand.nurOffen ? ' class="an"' : ''}>⚟</button>` +
                '<button data-a="asort" title="Sortieren">↕</button>' +
                '<button data-a="asuche" title="Suchen">🔍</button>' +
                '<button data-a="quellen" title="Aufgabenquellen">⚙</button>' +
                '<button data-a="neu" class="prim">Neue Aufgabe</button>' +
                '</div>' +
                '</div>' +
                (aZustand.sucheOffen
                    ? `<div class="bib-suchzeile">🔍 <input id="auf-suche" value="${esc(aZustand.suche)}" ` +
                        'placeholder="Aufgaben durchsuchen …"><button data-a="asuchzu">✕</button></div>' : '') +
                (liste.length
                    ? '<div class="auf-liste">' +
                        (offen.length ? `<div class="auf-grp">Offen <em>${offen.length}</em></div>` : '') +
                        offen.map(a => zeileHtml(a)).join('') +
                        (fertig.length ? `<div class="auf-grp">Erledigt <em>${fertig.length}</em></div>` : '') +
                        fertig.map(a => zeileHtml(a)).join('') +
                        '</div>'
                    : '<div class="auf-leer">' +
                        '<div class="auf-leer-ico">☑</div>' +
                        '<div>Hier findest du alle dir zugewiesenen Aufgaben.</div>' +
                        '<button data-a="quellen" class="auf-link">Aufgabenquellen konfigurieren</button>' +
                        '</div>') +
                '</div>';
        wrap.querySelectorAll('[data-a="quellen"]').forEach((b) => b.addEventListener('click', quellenDialog));
        wrap.querySelector('[data-a="afilter"]')?.addEventListener('click', (e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const m = UI.menu('<div class="grp">Zeigen</div>' +
                `<button data-x="alle">Alle Aufgaben${aZustand.nurOffen ? '' : '<span class="ms">✓</span>'}</button>` +
                `<button data-x="offen">Nur offene${aZustand.nurOffen ? '<span class="ms">✓</span>' : ''}</button>`, r.left - 130, r.bottom + 4);
            m.addEventListener('click', ev => {
                const x = elVon(ev)?.closest('[data-x]');
                if (!x)
                    return;
                aZustand.nurOffen = x.dataset.x === 'offen';
                m.remove();
                App.zeichneSeite();
            });
        });
        wrap.querySelector('[data-a="asort"]')?.addEventListener('click', (e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const m = UI.menu('<div class="grp">Sortieren nach</div>' +
                [['datum', 'Frist'], ['titel', 'Name'], ['datenbank', 'Datenbank']].map(([id, n]) => `<button data-x="${id}">${n}${aZustand.sortier === id ? '<span class="ms">✓</span>' : ''}</button>`).join(''), r.left - 130, r.bottom + 4);
            m.addEventListener('click', ev => {
                const x = elVon(ev)?.closest('[data-x]');
                if (!x)
                    return;
                aZustand.sortier = x.dataset.x ?? aZustand.sortier;
                m.remove();
                App.zeichneSeite();
            });
        });
        wrap.querySelector('[data-a="asuche"]')?.addEventListener('click', () => {
            aZustand.sucheOffen = true;
            App.zeichneSeite();
            document.getElementById('auf-suche')?.focus();
        });
        wrap.querySelector('[data-a="asuchzu"]')?.addEventListener('click', () => {
            aZustand.suche = '';
            aZustand.sucheOffen = false;
            App.zeichneSeite();
        });
        const si2 = wrap.querySelector('#auf-suche');
        if (si2)
            si2.addEventListener('input', () => {
                aZustand.suche = si2.value;
                const stelle = si2.selectionStart;
                App.zeichneSeite();
                const neu = document.getElementById('auf-suche');
                if (neu) {
                    neu.focus();
                    neu.setSelectionRange(stelle, stelle);
                }
            });
        wrap.querySelector('[data-a="neu"]')?.addEventListener('click', () => {
            const dbs = moegliche().filter(coll => collectionPermitted('bearbeiten', coll.id));
            if (!dbs.length) {
                UI.toast('Keine bearbeitbare Aufgabendatenbank verfügbar.');
                return;
            }
            const coll = dbs[0];
            const row = Store.addRow(coll.id, {});
            App.oeffne(row.id);
        });
        wrap.querySelectorAll('.auf-zeile').forEach((z) => {
            z.querySelector('.auf-haken')?.addEventListener('click', (e) => {
                e.stopPropagation();
                const a = liste.find(x => x.id === z.dataset.id);
                if (!a)
                    return;
                if (!a.bearbeitbar || !permitted('bearbeiten', a.pageId)) {
                    UI.toast('Du darfst diese Aufgabe nicht ändern.');
                    return;
                }
                const row = Store.getBlock(a.id);
                const props = { ...(row.props || {}) };
                if (a.hakenKey)
                    props[a.hakenKey] = !a.fertig;
                else if (a.statusKey)
                    props[a.statusKey] = a.fertig ? 'Offen' : 'Fertig';
                Store.updateBlock(a.id, { props });
                App.zeichneSeite();
            });
            z.addEventListener('click', () => App.oeffne(z.dataset.id));
        });
    };
    const zeileHtml = (a) => `<div class="auf-zeile${a.fertig ? ' fertig' : ''}" data-id="${a.id}">` +
        `<button class="auf-haken"${a.bearbeitbar ? '' : ' disabled title="Nur Leserechte"'}>` +
        `${a.fertig ? '☑' : '☐'}</button>` +
        `<span class="auf-titel">${esc(a.titel)}</span>` +
        `<span class="auf-db">▦ ${esc(a.coll.name)}</span>` +
        (a.datum ? `<span class="auf-datum">${esc(String(a.datum).slice(0, 10))}</span>` : '') +
        `<span class="auf-status">${esc(a.status)}</span>` +
        '</div>';
    const quellenDialog = () => {
        const dbs = moegliche();
        const gewaehlt = quellenLesen();
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder">' +
                '<div class="fh">Aufgabenquellen<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res" style="padding:6px">' +
                (dbs.length
                    ? dbs.map(c => {
                        const an = !gewaehlt || gewaehlt.includes(c.id);
                        return `<button data-c="${c.id}"><span>▦</span>` +
                            `<span style="flex:1">${esc(c.name)}</span>` +
                            `<span class="pth">${an ? 'zählt mit' : 'aus'}</span></button>`;
                    }).join('')
                    : '<div style="padding:16px;color:var(--text-faint);font-size:14px">' +
                        'Noch keine Datenbank mit Status oder Kontrollkästchen.</div>') +
                '</div>' +
                '<div class="hint">Eine Zeile gilt als deine Aufgabe, wenn eine Person-Spalte auf ' +
                'dich zeigt — oder, wenn es keine gibt, wenn du sie angelegt hast.</div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const b = elVon(e)?.closest('[data-c]');
            if (!b)
                return;
            if (!permitted('bearbeiten')) {
                UI.toast('Du darfst die Aufgabenquellen nicht ändern.');
                return;
            }
            const alle = dbs.map(c => c.id);
            const jetzt = quellenLesen() || alle;
            const neu = jetzt.includes(b.dataset.c) ? jetzt.filter((x) => x !== b.dataset.c) : [...jetzt, b.dataset.c];
            Store.setMeta('aufgabenQuellen', neu);
            o.remove();
            quellenDialog();
            App.zeichneSeite();
        });
    };
    const aufgaben = () => App.zeigeSonder('Meine Aufgaben', zeichneAufgaben);
    /* `umfangSatz` und `DECKE_KUERZLICH` kommen mit heraus, damit ein
       Prüflauf die Sprache messen kann, ohne dreihundert Seiten anzulegen
       (test359 §6) — und damit die Decke eine Zahl mit Namen bleibt. */
    return { oeffne, alleZeigen, aufgaben, meineAufgaben, quellenDialog, alleSeiten, quelleVon,
        pdfImportieren, wannText, umfangSatz, DECKE_KUERZLICH,
        /* Der Ordnerblick als Dienst des Bereichs `wissen` (E611):
           `blickKnopf`/`mitBlick` für die Auszeichnung, `blickAnbringen`
           für die Verdrahtung, `blickHinein` für den Weg aus einem Menü
           heraus. Die Notizhefte nutzen alle vier. */
        blickKnopf, mitBlick, blickAnbringen, blickHinein };
})();
window.Bibliothek = Bibliothek;
/* Die Bibliothek meldet ihre Kontextkante an (E272 Phase F). */
if (typeof Register !== 'undefined' && Register.kontext) {
    const K = Register.kontext;
    K.melde({ bereich: 'bibliothek', id: 'uebersicht', name: 'Übersicht',
        zeichen: 'library', rang: 10, tun: () => Bibliothek.oeffne() });
    K.melde({ bereich: 'bibliothek', id: 'notizhefte', name: 'Notizhefte',
        zeichen: 'book', rang: 20,
        zeigen: () => typeof Notebook !== 'undefined' && !!Notebook.oeffnen,
        tun: () => Notebook.oeffnen() });
    K.melde({ bereich: 'bibliothek', id: 'aufgaben', name: 'Meine Aufgaben',
        zeichen: 'tasks', rang: 30, tun: () => Bibliothek.aufgaben() });
    /* `alleZeigen`, nicht `alleSeiten`: das eine öffnet die Liste, das andere
       GIBT sie zurück — als Griff war das ein Knopf ins Leere (§47). */
    K.melde({ bereich: 'bibliothek', id: 'alle', name: 'Alle Seiten',
        zeichen: 'pages', rang: 40, tun: () => Bibliothek.alleZeigen() });
    K.melde({ bereich: 'bibliothek', id: 'suche', name: 'Suchen',
        zeichen: 'search', rang: 50, tun: () => App.suche() });
    /* ZULETZT GEÖFFNET ist eine Lade und kein Knopf: eine Liste, die sich
       bei jedem Öffnen ändert, darf nicht beim Zeichnen der Kante entstehen. */
    K.melde({ bereich: 'bibliothek', id: 'zuletzt', name: 'Zuletzt geöffnet',
        zeichen: 'history', rang: 60,
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
            return letzte.map((b) => ({
                id: 'z-' + b.id, name: String(b.text || 'Ohne Titel'), zeichen: 'page',
                tun: () => { try {
                    App.oeffne(b.id);
                }
                catch { /* … */ } }
            }));
        }
    });
}
