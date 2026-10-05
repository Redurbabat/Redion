"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/menueband.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.menueband = (() => {
    const REITER = [
        { id: 'start', name: 'Start', zeichen: 'pencil' },
        { id: 'einfuegen', name: 'Einfügen', zeichen: 'plus' },
        { id: 'zeichnen', name: 'Zeichnen', zeichen: 'page' },
        { id: 'praesentation', name: 'Präsentation', zeichen: 'play' },
        { id: 'verlauf', name: 'Verlauf', zeichen: 'history' },
        { id: 'ueberpruefen', name: 'Überprüfen', zeichen: 'search' },
        { id: 'ansicht', name: 'Ansicht', zeichen: 'sun' },
        { id: 'hilfe', name: 'Hilfe', zeichen: 'help' }
    ];
    const kann = (griff) => {
        try {
            return typeof griff() === 'function';
        }
        catch {
            return false;
        }
    };
    const seiteJetzt = () => {
        try {
            const id = App.aktuelleSeite();
            return id ? Store.getBlock(id) : null;
        }
        catch {
            return null;
        }
    };
    const seiteDa = (griff) => kann(griff) && !!seiteJetzt();
    const ABSATZARTEN = ['text', 'h1', 'h2', 'h3', 'todo', 'bullet', 'number', 'quote', 'callout'];
    const startEintraege = () => {
        const aus = [];
        if (Register?.bloecke?.eines) {
            for (const id of ABSATZARTEN) {
                const b = Register.bloecke?.eines?.(id);
                if (!b)
                    continue;
                aus.push({
                    reiter: 'start', gruppe: 'Absatz', id: 'abs-' + id,
                    name: b.name, zeichen: b.icon || '¶', ...(b.kurz ? { kurz: b.kurz } : {}),
                    hinweis: b.name + ' einfügen',
                    tun: () => Blocks.einfuegenAmEnde(id),
                    zeigen: () => kann(() => Blocks.einfuegenAmEnde)
                });
            }
        }
        const marken = [
            ['fett', 'Fett', 'B', '**'],
            ['kursiv', 'Kursiv', 'I', '*'],
            ['durch', 'Durchgestrichen', 'S', '~~'],
            ['code', 'Code', '‹›', '`']
        ];
        for (const [id, name, zeichen, marke] of marken) {
            aus.push({
                reiter: 'start', gruppe: 'Schrift', id, name, zeichen,
                hinweis: name + ' — wirkt auf das, was markiert ist',
                tun: () => Auswahl.umschliesse(marke),
                zeigen: () => kann(() => Auswahl.umschliesse)
            });
        }
        aus.push({
            reiter: 'start', gruppe: 'Schrift', id: 'link', name: 'Verweis', zeichen: 'link',
            kurz: 'Strg K', hinweis: 'Markierten Text zu einem Verweis machen',
            tun: () => Auswahl.linkSetzen(),
            zeigen: () => kann(() => Auswahl.linkSetzen)
        });
        return aus;
    };
    const GRUPPEN_FOLGE = ['Grundlegend', 'Medien', 'Datenbank', 'Wissen', 'Erweitert', 'KI'];
    const KURZNAME = {
        mention: 'Erwähnung', emoji: 'Emoji'
    };
    const LANGNAME = {
        mention: 'Seite, Person oder Datum einfügen'
    };
    const imTextEintraege = () => {
        let welche = [];
        try {
            welche = [...(Blocks.AM_ENDE ?? [])];
        }
        catch {
            welche = [];
        }
        if (!welche.length || !Register?.bloecke?.alle)
            return [];
        const nachAktion = new Map();
        for (const b of Register.bloecke.alle())
            if (b && b.aktion)
                nachAktion.set(String(b.aktion), b);
        return welche
            .map(was => {
            const b = nachAktion.get(was);
            if (!b)
                return null;
            return {
                reiter: 'einfuegen', gruppe: 'Im Text', id: 'akt-' + was,
                name: KURZNAME[was] ?? String(b.name || was),
                zeichen: String(b.zeichen || b.icon || '▫'),
                hinweis: (LANGNAME[was] ?? String(b.name || was)) + ' — hängt sich ans Ende der Seite',
                tun: () => { Blocks.aktionAmEnde(was); },
                zeigen: () => kann(() => Blocks.aktionAmEnde) && !!seiteJetzt()
            };
        })
            .filter((x) => x !== null);
    };
    const einfuegenEintraege = () => {
        if (!Register?.bloecke?.alle)
            return [];
        const bloecke = Register.bloecke.alle().filter(b => b && b.id && !b.aktion);
        const rang = (g) => {
            const i = GRUPPEN_FOLGE.indexOf(g);
            return i < 0 ? GRUPPEN_FOLGE.length : i;
        };
        return bloecke
            .slice()
            .sort((a, b) => rang(a.gruppe) - rang(b.gruppe))
            .map((b) => ({
            reiter: 'einfuegen', gruppe: String(b.gruppe || 'Weiteres'),
            id: 'blk-' + b.id, name: String(b.name || b.id),
            zeichen: String(b.zeichen || b.icon || '▫'),
            ...(b.kurz ? { kurz: String(b.kurz) } : {}),
            hinweis: String(b.name || b.id) + ' einfügen',
            tun: () => Blocks.einfuegenAmEnde(b.id),
            zeigen: () => kann(() => Blocks.einfuegenAmEnde)
        }))
            .concat(imTextEintraege());
    };
    const flaecheDa = () => {
        try {
            return Zeichenziel.da() === true;
        }
        catch {
            return false;
        }
    };
    const FARBWORT = {
        '#111111': 'Schwarz', '#d64545': 'Rot', '#2f7ed8': 'Blau',
        '#3aa757': 'Grün', '#e0a419': 'Gelb'
    };
    const STRICHWORT = ['Dünn', 'Mittel', 'Dick'];
    const farbEintraege = () => {
        let werte = [];
        try {
            werte = [...(Marken.FARBEN ?? [])];
        }
        catch {
            werte = [];
        }
        return werte.map((wert, i) => ({
            reiter: 'zeichnen', gruppe: 'Farbe', id: 'zf-' + i,
            name: FARBWORT[wert] ?? wert,
            zeichen: '', probe: { farbe: wert },
            hinweis: `Mit ${FARBWORT[wert] ?? wert} weiterzeichnen`,
            an: () => { try {
                return Zeichenziel.jetztFarbe() === wert;
            }
            catch {
                return false;
            } },
            tun: () => { if (!Zeichenziel.setzeFarbe(wert))
                UI.toast('Erst eine Zeichenfläche öffnen'); },
            zeigen: flaecheDa
        }));
    };
    const strichEintraege = () => {
        let werte = [];
        try {
            werte = [...(Marken.BREITEN ?? [])];
        }
        catch {
            werte = [];
        }
        return werte.map((wert, i) => ({
            reiter: 'zeichnen', gruppe: 'Strich', id: 'zs-' + i,
            name: STRICHWORT[i] ?? String(wert),
            zeichen: '', probe: { dicke: wert },
            hinweis: `Strichstärke ${String(wert).replace('.', ',')}`,
            an: () => { try {
                return Zeichenziel.jetztDicke() === wert;
            }
            catch {
                return false;
            } },
            tun: () => { if (!Zeichenziel.setzeStrich(wert))
                UI.toast('Erst eine Zeichenfläche öffnen'); },
            zeigen: flaecheDa
        }));
    };
    const WERKZEUGE = [
        ['schreiben', 'werkzeug'],
        ['stift', 'werkzeug'],
        ['marker', 'werkzeug'],
        ['line', 'form'],
        ['arrow', 'form'],
        ['rectangle', 'form'],
        ['ellipse', 'form'],
        ['abdeck', 'werkzeug'],
        ['zettel', 'werkzeug'],
        ['text', 'werkzeug'],
        ['zeichen', 'werkzeug'],
        ['select', 'werkzeug'],
        ['radierer', 'werkzeug']
    ];
    const bandWerkzeug = (id, woher) => {
        try {
            const q = woher === 'form'
                ? (Marken.FORMEN ?? []).find((f) => f.id === id)
                : Register.werkzeuge.holen(id);
            if (!q) {
                console.warn(`menueband: Werkzeug „${id}" steht in keinem Katalog.`);
                return null;
            }
            return { name: String(q.name), zeichen: String(q.zeichen),
                hinweis: String(q.titel ?? q.name) };
        }
        catch {
            return null;
        }
    };
    const flaecheGross = () => !flaecheDa();
    const zeichnenEintraege = () => [
        ...WERKZEUGE.map(([id, woher]) => ({ id, w: bandWerkzeug(id, woher) }))
            .filter((x) => x.w !== null)
            .map(({ id, w }) => ({
            reiter: 'zeichnen', gruppe: 'Werkzeug', id: 'wz-' + String(id),
            name: w.name, zeichen: w.zeichen, hinweis: w.hinweis,
            tun: () => { if (!Zeichenziel.setze(id))
                UI.toast('Erst eine Zeichenfläche öffnen'); },
            an: () => { try {
                return Zeichenziel.jetzt() === id;
            }
            catch {
                return false;
            } },
            zeigen: flaecheDa
        })),
        ...farbEintraege(), ...strichEintraege(),
        { reiter: 'zeichnen', gruppe: 'Zurücknehmen', id: 'wz-undo', name: 'Zurück',
            zeichen: '↶', hinweis: 'Den letzten Strich zurücknehmen',
            tun: () => { Zeichenziel.ruf('undo'); }, zeigen: flaecheDa },
        { reiter: 'zeichnen', gruppe: 'Zurücknehmen', id: 'wz-redo', name: 'Vor',
            zeichen: '↷', hinweis: 'Wiederholen',
            tun: () => { Zeichenziel.ruf('redo'); }, zeigen: flaecheDa },
        { reiter: 'zeichnen', gruppe: 'Zurücknehmen', id: 'wz-weg', name: 'Löschen',
            zeichen: 'trash', hinweis: 'Das Ausgewählte löschen',
            tun: () => { Zeichenziel.ruf('deleteSelection'); }, zeigen: flaecheDa },
        { reiter: 'zeichnen', gruppe: 'Fläche', id: 'z-blatt', name: 'Blatt',
            zeichen: 'page', gross: flaecheGross(), hinweis: 'Ein A4-Blatt zum Schreiben mit der Hand',
            tun: () => Blocks.einfuegenAmEnde('blatt'),
            zeigen: () => kann(() => Blocks.einfuegenAmEnde) },
        { reiter: 'zeichnen', gruppe: 'Fläche', id: 'z-white', name: 'Whiteboard',
            zeichen: 'graph', gross: flaecheGross(), hinweis: 'Freie Fläche ohne Ränder',
            tun: () => Blocks.einfuegenAmEnde('whiteboard'),
            zeigen: () => kann(() => Blocks.einfuegenAmEnde) },
        { reiter: 'zeichnen', gruppe: 'Fläche', id: 'z-plan', name: 'Schaltplan',
            zeichen: 'bolt', gross: flaecheGross(), hinweis: 'Fläche mit Fachzeichen und Stromsimulation',
            tun: () => Blocks.einfuegenAmEnde('schaltplan'),
            zeigen: () => kann(() => Blocks.einfuegenAmEnde) },
        { reiter: 'zeichnen', gruppe: 'Aufnehmen', id: 'z-scan', name: 'Seite abfotografieren',
            zeichen: 'camera', hinweis: 'Ein Blatt mit der Kamera aufnehmen und den Text erkennen',
            tun: () => Recognition.capturePage(),
            zeigen: () => kann(() => Recognition.capturePage) },
        { reiter: 'zeichnen', gruppe: 'Aufnehmen', id: 'z-pdf', name: 'PDF einlesen',
            zeichen: 'upload', hinweis: 'Eine PDF aussuchen und ihre Seiten in die Seite legen',
            tun: () => { void PdfEinlesen.waehlen(); },
            zeigen: () => kann(() => PdfEinlesen.waehlen) },
        { reiter: 'zeichnen', gruppe: 'Aufnehmen', id: 'z-erkennen', name: 'Text erkennen',
            zeichen: 'search', hinweis: 'Aus einem Bild den Text herauslesen',
            tun: () => Recognition.scan(),
            zeigen: () => kann(() => Recognition.scan) }
    ];
    const GEHEN_GRUPPE = {
        heute: 'Hauptbereiche', lernzentrum: 'Hauptbereiche',
        bibliothekOben: 'Hauptbereiche', 'app-bib': 'Hauptbereiche',
        aufgaben: 'Hauptbereiche',
        'app-notizhefte': 'Hauptbereiche',
        elektro: 'Planung & Lernen', 'app-kalender': 'Planung & Lernen',
        'app-tagesplan': 'Planung & Lernen', 'app-woche': 'Planung & Lernen',
        'app-spaeter': 'Planung & Lernen', 'app-aufgaben': 'Planung & Lernen',
        wissen: 'Planung & Lernen', 'w-zeit': 'Planung & Lernen',
        neu: 'Erfassen', 'w-journal': 'Erfassen', 'w-memos': 'Erfassen',
        'w-vorlagen': 'Erfassen', 'app-markt': 'Erfassen',
        erkennung: 'Erfassen', dateien: 'Erfassen',
        'w-agenten': 'Verbinden', 'w-bespr': 'Verbinden', ki: 'Verbinden',
        verbinden: 'Verbinden', 'app-eingang': 'Verbinden',
        posteingang: 'Verbinden',
        datenbanken: 'Daten', arbeitswelt: 'Daten', 'app-modell': 'Daten', 'app-kennzahl': 'Daten',
        einstellungen: 'System', 'app-aussehen': 'System', 'app-tempo': 'System',
        'app-krypto': 'System', 'app-erweitern': 'System', 'app-pwa': 'System',
        suche: 'System', befehle: 'System'
    };
    const GEHEN_DOPPELT = {
        lernwelt: 'heute',
        notizhefte: 'app-notizhefte',
        hilfe: 'app-kann',
        vorlagen: 'app-markt',
        bibliothek: 'bibliothekOben',
        papierkorb: 'papierkorbFuss',
        zeitmesser: 'w-zeit'
    };
    const GEHEN_NICHT = new Set(['lebensbereiche', 'dokumentmodus', 'editor',
        'favoriten', 'seiten', 'geteilt']);
    const GEHEN_FOLGE = ['Hauptbereiche', 'Planung & Lernen', 'Erfassen',
        'Verbinden', 'Daten', 'System', 'Weiteres'];
    const gehenEintraege = () => {
        const roh = [];
        try {
            for (const m of (Register?.module?.alle?.() || [])) {
                const id = String(m?.id ?? '');
                if (!id || GEHEN_NICHT.has(id) || GEHEN_DOPPELT[id])
                    continue;
                roh.push({ id, name: String(m.name ?? id),
                    zeichen: String(m.zeichen ?? m.icon ?? 'dots'),
                    hinweis: String(m.was ?? m.name ?? ''),
                    tun: () => { Register.module.oeffne(id); } });
            }
        }
        catch { }
        for (const platz of ['oben', 'apps', 'fuss', 'unten']) {
            let liste = [];
            try {
                liste = Register?.navigation?.anPlatz?.(platz) || [];
            }
            catch {
                liste = [];
            }
            for (const e of liste) {
                const id = String(e?.id ?? '');
                if (!id || GEHEN_NICHT.has(id) || GEHEN_DOPPELT[id])
                    continue;
                if (typeof e.tun !== 'function')
                    continue;
                if (roh.some(x => x.id === id))
                    continue;
                roh.push({ id, name: String(e.name ?? id),
                    zeichen: String(e.zeichen ?? e.icon ?? 'dots'),
                    hinweis: String(e.was ?? e.name ?? ''),
                    tun: () => { e.tun(); } });
            }
        }
        const eigene = [
            { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-journal'] ?? 'Erfassen',
                id: 'w-journal', name: 'Journal', zeichen: 'calendar', kurz: 'Strg ⇧ J',
                gross: true, hinweis: 'Tageseintrag',
                tun: () => Werkzeuge.journal(), zeigen: () => kann(() => Werkzeuge.journal) },
            { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-memos'] ?? 'Erfassen',
                id: 'w-memos', name: 'Schnellnotizen', zeichen: 'bolt', kurz: 'Strg ⇧ M',
                gross: true, hinweis: 'Kurze Gedanken',
                tun: () => Werkzeuge.schnellnotizen(), zeigen: () => kann(() => Werkzeuge.schnellnotizen) },
            { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-vorlagen'] ?? 'Erfassen',
                id: 'w-vorlagen', name: 'Vorlagen', zeichen: 'puzzle',
                hinweis: 'Fertige Aufbauten und eigene Vorlagen',
                tun: () => Werkzeuge.vorlagen(), zeigen: () => kann(() => Werkzeuge.vorlagen) },
            { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-zeit'] ?? 'Planung & Lernen',
                id: 'w-zeit', name: 'Zeitmesser', zeichen: 'clock',
                hinweis: 'Stoppuhr und Timer — misst die Zeit an der offenen Seite',
                tun: () => window.Zeitmesser?.panel?.(),
                zeigen: () => kann(() => window.Zeitmesser?.panel) },
            { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-agenten'] ?? 'Verbinden',
                id: 'w-agenten', name: 'Agenten', zeichen: 'robot',
                hinweis: 'Auftraege, Zeitplaene und der Notaus',
                tun: () => globalThis.Agent.panel(),
                zeigen: () => kann(() => globalThis.Agent?.panel) },
            { reiter: 'gehen', gruppe: GEHEN_GRUPPE['w-bespr'] ?? 'Verbinden',
                id: 'w-bespr', name: 'Besprechungen', zeichen: 'mic',
                hinweis: 'Aufnehmen, mitschreiben, auswerten',
                tun: () => globalThis.Meeting.panel(),
                zeigen: () => kann(() => globalThis.Meeting?.panel) }
        ];
        const ausRegistern = roh.map(e => ({
            reiter: 'gehen',
            gruppe: GEHEN_GRUPPE[e.id] ?? 'Weiteres',
            id: e.id, name: e.name, zeichen: e.zeichen, hinweis: e.hinweis,
            tun: e.tun
        }));
        const rang = (g) => {
            const i = GEHEN_FOLGE.indexOf(g);
            return i < 0 ? GEHEN_FOLGE.length : i;
        };
        return [...eigene, ...ausRegistern]
            .slice()
            .sort((a, b) => rang(a.gruppe) - rang(b.gruppe));
    };
    const verlaufEintraege = () => [
        { reiter: 'verlauf', gruppe: 'Zurücknehmen', id: 'v-undo', name: 'Rückgängig',
            zeichen: 'undo', kurz: 'Strg Z', gross: true,
            hinweis: 'Die letzte Änderung an der Seite zurücknehmen',
            tun: () => window.Verlauf.zurueck(),
            zeigen: () => kann(() => window.Verlauf?.zurueck) },
        { reiter: 'verlauf', gruppe: 'Zurücknehmen', id: 'v-redo', name: 'Wiederherstellen',
            zeichen: 'redo', kurz: 'Strg ⇧ Z',
            hinweis: 'Die zurückgenommene Änderung wieder anwenden',
            tun: () => window.Verlauf.vor(),
            zeigen: () => kann(() => window.Verlauf?.vor) },
        { reiter: 'verlauf', gruppe: 'Diese Seite', id: 'v-fassungen', name: 'Fassungen',
            zeichen: 'history', hinweis: 'Frühere Stände dieser Seite ansehen',
            tun: () => { void Werkzeuge.versionen(seiteJetzt()); },
            zeigen: () => seiteDa(() => Werkzeuge.versionen) },
        { reiter: 'verlauf', gruppe: 'Diese Seite', id: 'v-duplizieren', name: 'Duplizieren',
            zeichen: 'copy', hinweis: 'Eine Kopie dieser Seite anlegen',
            tun: () => { const p2 = seiteJetzt(); if (p2)
                App.dupliziereSeite(p2.id); },
            zeigen: () => seiteDa(() => App.dupliziereSeite) },
        { reiter: 'verlauf', gruppe: 'Diese Seite', id: 'v-verschieben', name: 'Verschieben',
            zeichen: 'arrowR', hinweis: 'Diese Seite an eine andere Stelle hängen',
            tun: () => Werkzeuge.verschiebenNach(seiteJetzt()),
            zeigen: () => seiteDa(() => Werkzeuge.verschiebenNach) },
        { reiter: 'verlauf', gruppe: 'Diese Seite', id: 'v-kommentare', name: 'Kommentare',
            zeichen: 'chat', hinweis: 'Die Anmerkungen an dieser Seite',
            tun: () => { const p2 = seiteJetzt(); if (p2)
                Kommentare.panel(p2.id); },
            zeigen: () => seiteDa(() => Kommentare.panel) },
        { reiter: 'verlauf', gruppe: 'Wiederfinden', id: 'v-posteingang', name: 'Posteingang',
            zeichen: 'inbox', hinweis: 'Erinnerungen, Kommentare, Erwähnungen',
            tun: () => Ansichten.posteingang(), zeigen: () => kann(() => Ansichten.posteingang) },
        { reiter: 'verlauf', gruppe: 'Wiederfinden', id: 'w-zuletzt', name: 'Zuletzt verwendet',
            zeichen: 'clock', hinweis: 'Die Bibliothek, gefiltert auf zuletzt Verwendetes',
            tun: () => Bibliothek.oeffne(), zeigen: () => kann(() => Bibliothek.oeffne) },
        { reiter: 'verlauf', gruppe: 'Wiederfinden', id: 'v-papierkorb', name: 'Papierkorb',
            zeichen: 'trash', hinweis: 'Gelöschtes ansehen und zurückholen',
            tun: () => App.papierkorb(), zeigen: () => kann(() => App.papierkorb) }
    ];
    const ueberpruefenEintraege = () => [
        { reiter: 'ueberpruefen', gruppe: 'Lernen', id: 'w-lernen', name: 'Karteikarten',
            zeichen: 'cards', gross: true, hinweis: 'Wiederholen nach Plan',
            tun: () => Werkzeuge.lernen(), zeigen: () => kann(() => Werkzeuge.lernen) },
        { reiter: 'ueberpruefen', gruppe: 'Lernen', id: 'u-faellig', name: 'Fällige Karten',
            zeichen: 'checkCircle', hinweis: 'Was heute dran wäre',
            tun: () => Werkzeuge.faellig(), zeigen: () => kann(() => Werkzeuge.faellig) },
        { reiter: 'ueberpruefen', gruppe: 'Wiederfinden', id: 'w-graph', name: 'Graph',
            zeichen: 'graph', kurz: 'Strg ⇧ G', hinweis: 'Wie alles zusammenhängt',
            tun: () => Links.graph(), zeigen: () => kann(() => Links.graph) },
        { reiter: 'ueberpruefen', gruppe: 'Wiederfinden', id: 'w-tags', name: 'Schlagwörter',
            zeichen: 'tag', kurz: 'Strg ⇧ T', hinweis: 'Alle #Schlagwörter',
            tun: () => Links.tagRegister(), zeigen: () => kann(() => Links.tagRegister) },
        { reiter: 'ueberpruefen', gruppe: 'Wiederfinden', id: 'w-luecken', name: 'Wissenslücken',
            zeichen: 'compass', hinweis: 'Was fehlt, verrät der Bestand selbst',
            tun: () => Wissensluecken.zeigen(),
            zeigen: () => kann(() => Wissensluecken.zeigen) },
        { reiter: 'ueberpruefen', gruppe: 'Nachsehen', id: 'u-statistik', name: 'Statistik',
            zeichen: 'chart', hinweis: 'Wörter, Zeichen, Lesedauer dieser Seite',
            tun: () => Werkzeuge.statistik(seiteJetzt()),
            zeigen: () => seiteDa(() => Werkzeuge.statistik) },
        { reiter: 'ueberpruefen', gruppe: 'Nachsehen', id: 'u-gesundheit', name: 'Bestand prüfen',
            zeichen: 'shield', hinweis: 'Was in den Daten nicht stimmt',
            tun: () => Pflege.gesundheit(), zeigen: () => kann(() => Pflege.gesundheit) }
    ];
    const hilfeEintraege = () => [
        { reiter: 'hilfe', gruppe: 'Lernen, was geht', id: 'h-rundgang', name: 'Was Redion kann',
            zeichen: 'help', gross: true, hinweis: 'Der Rundgang durch alle Bereiche',
            tun: () => Rundgang.uebersicht(), zeigen: () => kann(() => Rundgang.uebersicht) },
        { reiter: 'hilfe', gruppe: 'Lernen, was geht', id: 'h-kuerzel', name: 'Tastenkürzel',
            zeichen: 'command', kurz: 'Strg /', hinweis: 'Alle Kürzel auf einen Blick',
            tun: () => Werkzeuge.tastenkuerzel(), zeigen: () => kann(() => Werkzeuge.tastenkuerzel) },
        { reiter: 'hilfe', gruppe: 'Wenn etwas klemmt', id: 'h-erstehilfe', name: 'Erste Hilfe',
            zeichen: 'shield', hinweis: 'Wenn etwas nicht stimmt: prüfen und richten',
            tun: () => Pflege.ersteHilfe(), zeigen: () => kann(() => Pflege.ersteHilfe) },
        { reiter: 'hilfe', gruppe: 'Wenn etwas klemmt', id: 'w-stand', name: 'Umsetzungsstand',
            zeichen: 'checkCircle', hinweis: 'Alle 16 Teile der Notion-Doku, Punkt für Punkt',
            tun: () => Status.seiteAnlegen(), zeigen: () => kann(() => Status.seiteAnlegen) },
        { reiter: 'hilfe', gruppe: 'Deine Daten', id: 'h-sichern', name: 'Sicherung speichern',
            zeichen: 'download', hinweis: 'Alles in eine Datei — mit Anhängen als .redion',
            tun: () => { void App.sicherungSpeichern(); },
            zeigen: () => kann(() => App.sicherungSpeichern) },
        { reiter: 'hilfe', gruppe: 'Deine Daten', id: 'h-einlesen', name: 'Sicherung einlesen',
            zeichen: 'upload', hinweis: 'Eine gespeicherte Sicherung zurückholen',
            tun: () => App.sicherungLaden(), zeigen: () => kann(() => App.sicherungLaden) }
    ];
    const elektroEintraege = () => [
        { reiter: 'elektro', gruppe: 'Rechnen', id: 'e-rechner', name: 'Rechner',
            zeichen: 'bolt', gross: true, hinweis: 'Zehn Rechnungen mit gezeigtem Lösungsweg',
            tun: () => Electrical.open(), zeigen: () => kann(() => Electrical.open) },
        { reiter: 'elektro', gruppe: 'Rechnen', id: 'e-formelheft', name: 'Formelheft',
            zeichen: 'book', gross: true, hinweis: 'Alle Formeln zum Nachschlagen',
            tun: () => Formelheft.oeffne(), zeigen: () => kann(() => Formelheft.oeffne) },
        { reiter: 'elektro', gruppe: 'Rechnen', id: 'e-dreieck', name: 'Formeldreieck',
            zeichen: 'compass', hinweis: 'Das Dreieck zu einer Formel zeichnen',
            tun: () => Elektrolernbilder.dreieckFlaeche(),
            zeigen: () => kann(() => Elektrolernbilder.dreieckFlaeche) },
        { reiter: 'elektro', gruppe: 'Rechnen', id: 'e-sinus', name: 'Sinuskurve',
            zeichen: 'chart', hinweis: 'Wechselspannung als Kurve',
            tun: () => Elektrolernbilder.sinusFlaeche(),
            zeigen: () => kann(() => Elektrolernbilder.sinusFlaeche) },
        { reiter: 'elektro', gruppe: 'Üben', id: 'e-ueben', name: 'Üben',
            zeichen: 'learn', gross: true, hinweis: 'Aufgaben mit Lösungsweg',
            tun: () => Elektroarbeitsplatz.uebung(),
            zeigen: () => kann(() => Elektroarbeitsplatz.uebung) },
        { reiter: 'elektro', gruppe: 'Üben', id: 'e-pruefung', name: 'Prüfung',
            zeichen: 'medal', hinweis: 'Prüfung unter Zeit',
            tun: () => Elektroarbeitsplatz.pruefungFlaeche(),
            zeigen: () => kann(() => Elektroarbeitsplatz.pruefungFlaeche) },
        { reiter: 'elektro', gruppe: 'Üben', id: 'e-arbeitsplatz', name: 'Arbeitsplatz',
            zeichen: 'briefcase', hinweis: 'Alles nebeneinander',
            tun: () => Elektroarbeitsplatz.arbeitsplatz(),
            zeigen: () => kann(() => Elektroarbeitsplatz.arbeitsplatz) },
        { reiter: 'elektro', gruppe: 'Zeichnen', id: 'e-plan', name: 'Schaltplan',
            zeichen: 'graph', gross: true, hinweis: 'Plan mit Fachzeichen und Stromsimulation',
            tun: () => Blocks.einfuegenAmEnde('schaltplan'),
            zeigen: () => kann(() => Blocks.einfuegenAmEnde) }
    ];
    const ansichtEintraege = () => [
        { reiter: 'ansicht', gruppe: 'Lesen', id: 'a-fokus', name: 'Fokus',
            zeichen: 'compass', gross: true, hinweis: 'Alles ausblenden bis auf den Text',
            tun: () => Werkzeuge.fokus(), zeigen: () => kann(() => Werkzeuge.fokus) },
        { reiter: 'ansicht', gruppe: 'Lesen', id: 'a-praes', name: 'Präsentation',
            zeichen: 'rocket', gross: true, hinweis: 'Die Seite als Folien zeigen',
            tun: () => Werkzeuge.praesentation(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.praesentation) },
        { reiter: 'ansicht', gruppe: 'Lesen', id: 'a-vollbild', name: 'Vollbild',
            zeichen: 'maximize', hinweis: 'Den ganzen Bildschirm nutzen — Esc beendet es',
            an: () => kann(() => App.vollbildAn) && App.vollbildAn(),
            tun: () => { App.vollbild(); },
            zeigen: () => kann(() => App.vollbild) && kann(() => App.vollbildGeht) &&
                App.vollbildGeht() },
        { reiter: 'ansicht', gruppe: 'Lesen', id: 'a-hell', name: 'Hell / Dunkel',
            zeichen: 'sun', hinweis: 'Zwischen hellem und dunklem Aussehen wechseln',
            tun: () => App.theme(), zeigen: () => kann(() => App.theme) },
        { reiter: 'ansicht', gruppe: 'Lesen', id: 'a-aussehen', name: 'Aussehen …',
            zeichen: 'settings', hinweis: 'Farbschema, Schrift und Dichte wählen',
            tun: () => Aussehen.dialog(), zeigen: () => kann(() => Aussehen.dialog) },
        { reiter: 'ansicht', gruppe: 'Seite', id: 'a-versionen', name: 'Fassungen',
            zeichen: 'history', hinweis: 'Frühere Stände dieser Seite',
            tun: () => Werkzeuge.versionen(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.versionen) },
        { reiter: 'ansicht', gruppe: 'Seite', id: 'a-sperren', name: 'Sperren',
            zeichen: 'lock', hinweis: 'Seite gegen Bearbeiten sperren',
            tun: () => Werkzeuge.sperren(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.sperren) },
        { reiter: 'ansicht', gruppe: 'Seite', id: 'a-quelltext', name: 'Quelltext',
            zeichen: 'command', hinweis: 'Die Seite als Markdown ansehen',
            tun: () => Werkzeuge.quelltext(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.quelltext) },
        { reiter: 'ansicht', gruppe: 'Ausgeben', id: 'a-drucken', name: 'Drucken',
            zeichen: 'clipboard', hinweis: 'Die Seite drucken oder als PDF sichern',
            tun: () => Werkzeuge.drucken(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.drucken) },
        { reiter: 'ansicht', gruppe: 'Ausgeben', id: 'a-html', name: 'Als HTML',
            zeichen: 'share', hinweis: 'Die Seite als HTML-Datei sichern',
            tun: () => Werkzeuge.htmlExport(seiteJetzt()), zeigen: () => seiteDa(() => Werkzeuge.htmlExport) }
    ];
    const fremde = [];
    const lieferanten = [];
    const melde = (eintrag) => {
        if (!eintrag || !eintrag.id || !eintrag.reiter || typeof eintrag.tun !== 'function')
            return false;
        if (fremde.some(x => x.id === eintrag.id))
            return false;
        fremde.push(eintrag);
        return true;
    };
    const meldeLieferant = (fn) => {
        if (typeof fn !== 'function' || lieferanten.includes(fn))
            return false;
        lieferanten.push(fn);
        return true;
    };
    const nimmZurueck = (id) => {
        const i = fremde.findIndex(x => x.id === id);
        if (i < 0)
            return false;
        fremde.splice(i, 1);
        return true;
    };
    const nimmZurueckLieferant = (fn) => {
        const i = lieferanten.indexOf(fn);
        if (i < 0)
            return false;
        lieferanten.splice(i, 1);
        return true;
    };
    const brauchbar = (e) => {
        if (!e || typeof e !== 'object')
            return false;
        const x = e;
        return !!x.id && !!x.reiter && !!x.name && typeof x.tun === 'function';
    };
    const BRAUCHT_SEITE = new Set(['start', 'einfuegen', 'zeichnen']);
    const alle = () => {
        const aus = [];
        const quellen = [
            gehenEintraege, startEintraege, einfuegenEintraege, zeichnenEintraege,
            verlaufEintraege, ueberpruefenEintraege, ansichtEintraege, hilfeEintraege,
            elektroEintraege
        ];
        for (const q of quellen) {
            try {
                aus.push(...(q() || []));
            }
            catch { }
        }
        for (const l of lieferanten) {
            try {
                for (const e of (l() || []))
                    if (brauchbar(e))
                        aus.push(e);
            }
            catch { }
        }
        aus.push(...fremde);
        return aus.filter(e => {
            if (BRAUCHT_SEITE.has(e.reiter) && !seiteJetzt())
                return false;
            if (typeof e.zeigen !== 'function')
                return true;
            try {
                return e.zeigen() !== false;
            }
            catch {
                return false;
            }
        });
    };
    const inReiter = (reiter) => {
        const drin = alle().filter(e => e.reiter === reiter);
        const folge = [];
        const nach = new Map();
        for (const e of drin) {
            if (!nach.has(e.gruppe)) {
                nach.set(e.gruppe, []);
                folge.push(e.gruppe);
            }
            nach.get(e.gruppe).push(e);
        }
        return folge.map(g => ({ gruppe: g, eintraege: nach.get(g) }));
    };
    const orte = () => inReiter('gehen');
    const reiter = () => {
        const belegt = new Set(alle().map(e => e.reiter));
        return REITER.filter(r => belegt.has(r.id));
    };
    const eines = (id) => alle().find(e => e.id === id) || null;
    const anzahl = () => alle().length;
    return { REITER, reiter, alle, inReiter, orte, eines, anzahl,
        melde, meldeLieferant, nimmZurueck, nimmZurueckLieferant };
})();
