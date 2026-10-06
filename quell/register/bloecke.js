"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/bloecke.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.bloecke = (() => {
    const EINGEBAUT = [
        { id: 'text', name: 'Text', icon: '¶', gruppe: 'Grundlegend', cmd: ['text', 'absatz', 'p', 'plain'], kurz: 'Ctrl+Shift+0', ph: 'Tippe etwas, oder drücke / für Befehle' },
        { id: 'h1', name: 'Überschrift 1', icon: 'H₁', gruppe: 'Grundlegend', cmd: ['h1', 'ueberschrift1', 'titel', '#'], kurz: 'Ctrl+Shift+1', md: '#', ph: 'Überschrift 1', stufe: 1 },
        { id: 'h2', name: 'Überschrift 2', icon: 'H₂', gruppe: 'Grundlegend', cmd: ['h2', 'ueberschrift2', '##'], kurz: 'Ctrl+Shift+2', md: '##', ph: 'Überschrift 2', stufe: 2 },
        { id: 'h3', name: 'Überschrift 3', icon: 'H₃', gruppe: 'Grundlegend', cmd: ['h3', 'ueberschrift3', '###'], kurz: 'Ctrl+Shift+3', md: '###', ph: 'Überschrift 3', stufe: 3 },
        { id: 'todo', name: 'Aufgabenliste', icon: '☑', gruppe: 'Grundlegend', cmd: ['todo', 'aufgabe', 'checkbox'], kurz: 'Ctrl+Shift+4', md: ['[]', '[ ]', '[x]', '[X]'], ph: 'Aufgabe' },
        { id: 'bullet', name: 'Aufzählungsliste', icon: '•', gruppe: 'Grundlegend', cmd: ['bullet', 'liste', 'aufzaehlung'], kurz: 'Ctrl+Shift+5', md: ['-', '*', '+'], ph: 'Listenpunkt' },
        { id: 'number', name: 'Nummerierte Liste', icon: '1.', gruppe: 'Grundlegend', cmd: ['number', 'nummeriert', 'num'], kurz: 'Ctrl+Shift+6',
            md: ['1.', '1)', 'a.', 'a)', 'i.', 'i)', 'A.', 'A)', 'I.', 'I)'], ph: 'Listenpunkt' },
        { id: 'toggle', name: 'Toggle-Liste', icon: '▸', gruppe: 'Grundlegend', cmd: ['toggle', 'einklappbar'], kurz: 'Ctrl+Shift+7', md: '>', ph: 'Toggle' },
        { id: 'toggle-h1', name: 'Toggle-Überschrift 1', icon: '▸H₁', gruppe: 'Grundlegend', cmd: ['toggle h1', 'einklappbare ueberschrift 1'], stufe: 1 },
        { id: 'toggle-h2', name: 'Toggle-Überschrift 2', icon: '▸H₂', gruppe: 'Grundlegend', cmd: ['toggle h2', 'einklappbare ueberschrift 2'], stufe: 2 },
        { id: 'toggle-h3', name: 'Toggle-Überschrift 3', icon: '▸H₃', gruppe: 'Grundlegend', cmd: ['toggle h3', 'einklappbare ueberschrift 3'], stufe: 3 },
        { id: 'quote', name: 'Zitat', icon: '❝', gruppe: 'Grundlegend', cmd: ['quote', 'zitat'], md: '"', ph: 'Zitat' },
        { id: 'callout', name: 'Callout', icon: '💡', zeichen: 'lightbulb', gruppe: 'Grundlegend', cmd: ['callout', 'hinweis'], ph: 'Hinweis' },
        { id: 'divider', name: 'Trennlinie', icon: '—', gruppe: 'Grundlegend', cmd: ['divider', 'trennlinie', 'hr', 'div'], md: ['---', '***', '___'] },
        { id: 'db-table', name: 'Tabelle', icon: '▦', gruppe: 'Datenbank', cmd: ['tabelle', 'table', 'datenbank'] },
        { id: 'db-board', name: 'Board', icon: '▤', gruppe: 'Datenbank', cmd: ['board', 'kanban'] },
        { id: 'db-list', name: 'Liste', icon: '☰', gruppe: 'Datenbank', cmd: ['listenansicht', 'list'] },
        { id: 'db-gallery', name: 'Galerie', icon: '▩', gruppe: 'Datenbank', cmd: ['galerie', 'gallery'] },
        { id: 'db-calendar', name: 'Kalender', icon: '📅', zeichen: 'calendar', gruppe: 'Datenbank', cmd: ['kalender', 'calendar'] },
        { id: 'image', name: 'Bild', icon: '🖼', zeichen: 'image', gruppe: 'Medien', cmd: ['bild', 'image', 'foto'] },
        { id: 'video', name: 'Video', icon: '🎬', zeichen: 'video', gruppe: 'Medien', cmd: ['video'] },
        { id: 'audio', name: 'Audio', icon: '🔊', zeichen: 'audio', gruppe: 'Medien', cmd: ['audio', 'ton'] },
        { id: 'file', name: 'Datei', icon: '📎', zeichen: 'paperclip', gruppe: 'Medien', cmd: ['datei', 'file', 'anhang', 'pdf'] },
        { id: 'bookmark', name: 'Lesezeichen', icon: '🔖', zeichen: 'bookmark', gruppe: 'Medien', cmd: ['bookmark', 'lesezeichen', 'link', 'book'] },
        { id: 'embed', name: 'Einbetten', icon: '⧉', gruppe: 'Medien', cmd: ['embed', 'einbetten', 'iframe'] },
        { id: 'code', name: 'Code', icon: '⌨', gruppe: 'Erweitert', cmd: ['code'], kurz: 'Ctrl+Shift+8', md: '```', ph: 'Code' },
        { id: 'equation', name: 'Formel', icon: '∑', gruppe: 'Erweitert', cmd: ['formel', 'equation', 'math', 'latex'], kurz: 'Ctrl+Shift+E', md: '$$', ph: 'E = mc^2' },
        { id: 'table', name: 'Einfache Tabelle', icon: '⊞', gruppe: 'Erweitert', cmd: ['tabelle einfach', 'simple table', 'raster'] },
        { id: 'spreadsheet', name: 'Kalkulationstabelle', icon: '🧮', zeichen: 'grid', gruppe: 'Datenbank',
            cmd: ['kalkulation', 'spreadsheet', 'excel', 'rechnen', 'tabelle rechnen', 'summe'] },
        { id: 'toc', name: 'Inhaltsverzeichnis', icon: '≡', gruppe: 'Erweitert', cmd: ['inhaltsverzeichnis', 'toc'] },
        { id: 'breadcrumb', name: 'Pfad', icon: '⌂', gruppe: 'Erweitert', cmd: ['pfad', 'breadcrumb', 'bread'] },
        { id: 'columns', name: 'Zwei Spalten', icon: '⫿', gruppe: 'Erweitert', cmd: ['spalten', 'columns'] },
        { id: 'columns3', name: 'Drei Spalten', icon: '⫼', gruppe: 'Erweitert', cmd: ['dreispalten', 'columns3'] },
        { id: 'page', name: 'Unterseite', icon: '📄', zeichen: 'page', gruppe: 'Erweitert', cmd: ['seite', 'page', 'unterseite'], kurz: 'Ctrl+Shift+9' },
        { id: 'pageref', name: 'Link zu Seite', icon: '↗', gruppe: 'Erweitert', cmd: ['link zu seite', 'verweis', 'klon', 'pageref'] },
        { id: 'synced', name: 'Synchronisierter Block', icon: '⇄', gruppe: 'Erweitert', cmd: ['synced', 'synchron', 'spiegel'] },
        { id: 'linkeddb', name: 'Verknüpfte Ansicht', icon: '⧉', gruppe: 'Datenbank', cmd: ['verknuepfte ansicht', 'linked', 'ansicht einer datenbank'] },
        { id: 'button', name: 'Knopf', icon: '🔘', zeichen: 'circleDot', gruppe: 'Erweitert', cmd: ['button', 'knopf', 'vorlagenknopf', 'template'] },
        { id: 'html', name: 'HTML', icon: '</>', gruppe: 'Erweitert', cmd: ['html'] },
        { id: 'flashcard', name: 'Karteikarte', icon: '🎴', zeichen: 'cards', gruppe: 'Wissen', cmd: ['karteikarte', 'flashcard', 'lernen'], ph: 'Frage :: Antwort' },
        { id: 'blatt', name: 'A4-Blatt', icon: '📄', zeichen: 'page', gruppe: 'Wissen', cmd: ['blatt', 'a4', 'papier', 'schreiben', 'malen'] },
        { id: 'whiteboard', name: 'Whiteboard', icon: '🖍', zeichen: 'pencil', gruppe: 'Wissen', cmd: ['whiteboard', 'zeichnen', 'canvas', 'skizze'] },
        { id: 'mindmap', name: 'Gedankenkarte', icon: '🧠', zeichen: 'sparkle', gruppe: 'Wissen',
            cmd: ['gedankenkarte', 'mindmap', 'mind map', 'xmind', 'karte', 'brainstorm', 'gedanken', 'verzweigung'],
            ph: 'Zentrales Thema' },
        { id: 'schaltplan', name: 'Schaltplan', icon: '⚡', zeichen: 'bolt', gruppe: 'Wissen', cmd: ['schaltplan', 'elektro', 'stromlauf', 'fachzeichen', 'schema'] },
        { id: 'chart', name: 'Diagramm', icon: '📊', zeichen: 'chart', gruppe: 'Wissen', cmd: ['diagramm', 'chart', 'balken', 'torte'] },
        { id: 'backlinks', name: 'Rückverweise', icon: '🔙', zeichen: 'arrowL', gruppe: 'Wissen', cmd: ['rueckverweise', 'backlinks'] },
        { id: 'ai-write', name: 'KI: Text schreiben', icon: '✨', zeichen: 'sparkle', gruppe: 'KI', cmd: ['ki', 'ai', 'schreiben'] },
        { id: 'ai-summary', name: 'KI: Zusammenfassen', icon: '✨', zeichen: 'sparkle', gruppe: 'KI', cmd: ['zusammenfassen', 'summary'] },
        { id: 'ai-todo', name: 'KI: Aufgaben ableiten', icon: '✨', zeichen: 'sparkle', gruppe: 'KI', cmd: ['aufgaben', 'actionitems'] },
        { id: 'ai-translate', name: 'KI: Übersetzen', icon: '✨', zeichen: 'sparkle', gruppe: 'KI', cmd: ['uebersetzen', 'translate'] },
        { id: 'ai-improve', name: 'KI: Text verbessern', icon: '✨', zeichen: 'sparkle', gruppe: 'KI', cmd: ['verbessern', 'umschreiben', 'improve'] },
        { id: 'a-turn', name: 'Umwandeln in …', icon: '⇄', gruppe: 'Aktionen', aktion: 'turn',
            cmd: ['turn', 'umwandeln', 'wechseln'] },
        { id: 'a-color', name: 'Farbe ändern', icon: '🎨', zeichen: 'palette', gruppe: 'Aktionen', aktion: 'color',
            cmd: ['color', 'farbe', 'highlight', 'hintergrund', 'blue', 'blau', 'rot', 'red', 'gruen', 'green', 'gelb', 'yellow'] },
        { id: 'a-default', name: 'Farbe entfernen', icon: '▢', gruppe: 'Aktionen', aktion: 'default',
            cmd: ['default', 'standard', 'farbe entfernen'] },
        { id: 'a-dup', name: 'Block duplizieren', icon: '⧉', gruppe: 'Aktionen', aktion: 'dup',
            kurz: 'Ctrl+D', cmd: ['duplicate', 'duplizieren', 'kopieren'] },
        { id: 'a-moveto', name: 'Verschieben nach …', icon: '➦', zeichen: 'move', gruppe: 'Aktionen', aktion: 'moveto',
            cmd: ['moveto', 'verschieben', 'move'] },
        { id: 'a-del', name: 'Block in den Papierkorb', icon: '🗑', zeichen: 'trash', gruppe: 'Aktionen', aktion: 'del',
            kurz: 'Entf', cmd: ['delete', 'loeschen', 'löschen', 'entfernen', 'papierkorb'] },
        { id: 'a-mention', name: 'Person oder Seite erwähnen', icon: '@', gruppe: 'Aktionen', aktion: 'mention',
            kurz: '@', cmd: ['mention', 'erwaehnen', 'erwaehnung'] },
        { id: 'a-date', name: 'Datum einfügen', icon: '📆', zeichen: 'calendar', gruppe: 'Aktionen', aktion: 'date',
            kurz: '@Datum', cmd: ['date', 'datum', 'heute', 'today'] },
        { id: 'a-remind', name: 'Erinnerung', icon: '⏰', zeichen: 'clock', gruppe: 'Aktionen', aktion: 'remind',
            kurz: '@remind', cmd: ['reminder', 'remind', 'erinnerung'],
            zeigen: () => {
                try {
                    return typeof Werkzeuge?.erinnerungSetzen === 'function';
                }
                catch {
                    return false;
                }
            },
            tun: (seite) => {
                try {
                    const p2 = seite || (typeof App !== 'undefined'
                        ? Store.getBlock(App.aktuelleSeite()) : null);
                    if (!p2) {
                        UI.toast('Erst eine Seite öffnen');
                        return;
                    }
                    Werkzeuge.erinnerungSetzen(p2);
                }
                catch {
                    UI.toast('Erinnerungen sind in dieser Fassung nicht geladen');
                }
            } },
        { id: 'a-emoji', name: 'Emoji', icon: '🙂', zeichen: 'smile', gruppe: 'Aktionen', aktion: 'emoji',
            kurz: ':', cmd: ['emoji', 'smiley'] },
        { id: 'a-komm', name: 'Kommentar', icon: '💬', zeichen: 'comment', gruppe: 'Aktionen', aktion: 'komm',
            kurz: 'Ctrl+Shift+M', cmd: ['comment', 'kommentar'] }
    ];
    const NUR_NAME = [
        { id: 'pdfseite', name: 'PDF-Seite', icon: '📕', nurName: true },
        { id: 'zeichenflaeche', name: 'Zeichenfläche', icon: '✎', nurName: true },
        { id: 'spalte', name: 'Spalte', icon: '⫿', nurName: true },
        { id: 'database', name: 'Datenbank', icon: '▦', nurName: true },
        { id: 'tabelle', name: 'Einfache Tabelle', icon: '⊞', nurName: true }
    ];
    const LISTE = EINGEBAUT.slice();
    const vonAussen = new Set();
    const melde = (eintrag) => {
        const e = eintrag;
        if (!e || !e.id)
            return false;
        if (LISTE.some(x => x.id === e.id))
            return false;
        LISTE.push(e);
        vonAussen.add(e.id);
        return true;
    };
    const nimmZurueck = (id) => {
        if (!vonAussen.has(id))
            return false;
        const i = LISTE.findIndex(x => x.id === id);
        if (i < 0)
            return false;
        LISTE.splice(i, 1);
        vonAussen.delete(id);
        return true;
    };
    const alle = () => LISTE;
    const benannt = () => [...LISTE, ...NUR_NAME];
    const eines = (id) => LISTE.find(x => x.id === id) || NUR_NAME.find(x => x.id === id) || null;
    const gruppen = () => [...new Set(alle().map(x => x.gruppe).filter((g) => !!g))];
    const inGruppe = (g) => alle().filter(x => x.gruppe === g);
    const ueberschriften = () => {
        const raus = {};
        alle().forEach(x => { if (x.stufe)
            raus[x.id] = x.stufe; });
        return raus;
    };
    const zifferZuTyp = () => {
        const raus = {};
        alle().forEach(x => {
            const m = /^Ctrl\+Shift\+([0-9])$/.exec(String(x.kurz ?? ''));
            if (m && m[1])
                raus[m[1]] = x.id;
        });
        return raus;
    };
    const zuMarkdown = (zeichen) => alle().find(x => {
        const m = x.md;
        return Array.isArray(m) ? m.some(k => k === zeichen) : m === zeichen;
    }) || null;
    const suche = (text) => {
        const t = String(text || '').toLowerCase().trim();
        if (!t)
            return alle();
        return alle().filter(x => (x.name || '').toLowerCase().includes(t) ||
            (x.cmd || []).some(c => c.toLowerCase().startsWith(t)));
    };
    return { alle, benannt, eines, gruppen, inGruppe, zuMarkdown, ueberschriften, zifferZuTyp,
        suche, melde, nimmZurueck,
        vonAussen: () => [...vonAussen], anzahl: () => LISTE.length };
})();
