"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/navigation.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.navigation = (() => {
    const da = (name) => typeof window[name] !== 'undefined' ||
        (() => {
            try {
                return eval('typeof ' + name) !== 'undefined';
            }
            catch {
                return false;
            }
        })();
    const EINGEBAUT = [
        { id: 'suche', name: 'Suchen', icon: '🔍', zeichen: 'search', platz: 'oben', rang: 10,
            knopfId: 'btn-search', kuerzel: 'Strg P',
            tun: () => App.suche() },
        { id: 'befehle', name: 'Befehle', icon: '⌘', zeichen: 'command', platz: 'oben', rang: 20,
            knopfId: 'btn-cmd', kuerzel: 'Strg ⇧ K',
            tun: () => Werkzeuge.palette() },
        { id: 'heute', name: 'Heute', icon: '☀️', zeichen: 'today', platz: 'oben', rang: 30,
            knopfId: 'btn-home', haupt: true, ruhig: false, adresse: '#welt-lernen-heute',
            tun: () => Produktwelten.lernen('heute') },
        { id: 'lernzentrum', name: 'Lernzentrum', icon: '🎓', zeichen: 'learn', platz: 'oben', rang: 40,
            knopfId: 'btn-learning', haupt: true, hauptRang: 30, schauplatz: 'lernen',
            adresse: '#welt-lernen-lernen',
            tun: () => Produktwelten.lernen('lernen') },
        { id: 'elektro', name: 'Elektrotechnik', icon: '⚡', zeichen: 'bolt', platz: 'oben', rang: 45,
            knopfId: 'btn-elektro', haupt: true, ruhig: false,
            tun: () => {
                if (typeof Elektrostart !== 'undefined')
                    Elektrostart.oeffne();
                else if (typeof Electrical !== 'undefined')
                    Electrical.open();
            } },
        { id: 'bibliothekOben', name: 'Bibliothek', icon: '📚', zeichen: 'library', platz: 'oben', rang: 60,
            knopfId: 'btn-library', haupt: true, hauptRang: 10, schauplatz: 'bibliothek',
            tun: () => Produktwelten.bibliothek() },
        { id: 'aufgaben', name: 'Aufgaben', icon: '☑', zeichen: 'tasks', platz: 'oben', rang: 70,
            knopfId: 'btn-tasks', haupt: true, ruhig: false, schauplatz: 'aufgaben', adresse: '#aufgaben',
            tun: () => Produktwelten.aufgaben() },
        { id: 'posteingang', name: 'Posteingang', icon: '📥', zeichen: 'inbox', platz: 'oben', rang: 80,
            knopfId: 'btn-inbox', tun: () => Ansichten.posteingang() },
        { id: 'neu', name: 'Neue Seite', icon: '✚', zeichen: 'plus', platz: 'oben', rang: 90,
            knopfId: 'btn-new', kuerzel: 'Strg N',
            tun: () => App.neueSeite() },
        { id: 'app-kalender', marke: 'kalender', name: 'Kalender', icon: '📅', zeichen: 'calendar', platz: 'apps', gruppe: 'planen', rang: 10,
            adresse: '#kalender', schauplatz: 'kalender',
            hinweis: 'Termine aus allen Quellen', tun: () => Produktwelten.kalender() },
        { id: 'app-tagesplan', marke: 'tagesplan', name: 'Tagesplan', icon: '☀', zeichen: 'clipboard', platz: 'apps', gruppe: 'planen', rang: 20,
            hinweis: 'Was heute ansteht', tun: () => Plan.tagesplan() },
        { id: 'app-woche', marke: 'woche', name: 'Wochenrückblick', icon: '📅', zeichen: 'chart', platz: 'apps', gruppe: 'planen', rang: 30,
            hinweis: 'Was lief, was blieb liegen', tun: () => Plan.wochenrueckblick() },
        { id: 'app-spaeter', marke: 'spaeter', name: 'Zurückgestellt', icon: '⏰', zeichen: 'flag', platz: 'apps', gruppe: 'planen', rang: 40,
            hinweis: 'Was später wieder hochkommt', tun: () => Plan.uebersicht() },
        { id: 'app-aufgaben', marke: 'aufgaben', name: 'Meine Aufgaben', icon: '☑', zeichen: 'boxChecked', platz: 'apps', gruppe: 'planen', rang: 50,
            hinweis: 'Was dir zugewiesen ist', tun: () => Bibliothek.aufgaben() },
        { id: 'app-notizhefte', marke: 'notizhefte', name: 'Notizhefte', icon: '📓', zeichen: 'book', platz: 'apps', gruppe: 'daten', rang: 52,
            haupt: true, hauptRang: 20, schauplatz: 'notizhefte',
            hinweis: 'Deine Schreibhefte, sofort schreibbereit',
            tun: () => (typeof Notebook !== 'undefined') && Notebook.oeffnen() },
        { id: 'app-bib', marke: 'bib', name: 'Alle Seiten', icon: '📚', zeichen: 'page', platz: 'apps', gruppe: 'daten', rang: 55,
            hinweis: 'Jede Seite, mit Reitern und Spalten',
            tun: () => (Bibliothek.alleZeigen ? Bibliothek.alleZeigen() : Bibliothek.oeffne()) },
        { id: 'app-modell', marke: 'modell', name: 'Datenmodell', icon: '🗺', zeichen: 'database', platz: 'apps', gruppe: 'daten', rang: 60,
            hinweis: 'Alle Datenbanken und ihre Verknüpfungen', tun: () => Schema.ansicht() },
        { id: 'app-kennzahl', marke: 'kennzahl', name: 'Kennzahlen', icon: '📊', zeichen: 'chart', platz: 'apps', gruppe: 'daten', rang: 70,
            hinweis: 'Zahlen aus mehreren Datenbanken', tun: () => Schema.tafel() },
        { id: 'app-eingang', marke: 'eingang', name: 'Was hereinkommt', icon: '📨', zeichen: 'inbox', platz: 'apps', gruppe: 'daten', rang: 80,
            hinweis: 'Daten von aussen abholen und einwerfen', tun: () => Eingang.dialog() },
        { id: 'app-markt', marke: 'markt', name: 'Marktplatz', icon: '🛍', zeichen: 'puzzle', platz: 'apps', gruppe: 'daten', rang: 90,
            hinweis: 'Fertige Vorlagen', tun: () => Werkzeuge.vorlagen() },
        { id: 'app-aussehen', marke: 'aussehen', name: 'Aussehen', icon: '🎨', zeichen: 'sun', platz: 'apps', gruppe: 'einrichten', rang: 100,
            hinweis: 'Farben, Schrift und Tastenkürzel', tun: () => Aussehen.dialog() },
        { id: 'app-tempo', marke: 'tempo', name: 'Tempo', icon: '⏱', zeichen: 'rocket', platz: 'apps', gruppe: 'einrichten', rang: 110,
            hinweis: 'Wie schnell gezeichnet und gerechnet wird', tun: () => Tempo.dialog() },
        { id: 'app-krypto', marke: 'krypto', name: 'Passwort', icon: '🔐', zeichen: 'lock', platz: 'apps', gruppe: 'einrichten', rang: 120,
            hinweis: 'Verschlüsselte Sicherung und Sperre', tun: () => Krypto.dialog() },
        { id: 'app-erweitern', marke: 'erweitern', name: 'Erweiterungen', icon: '🧩', zeichen: 'puzzle', platz: 'apps', gruppe: 'einrichten', rang: 130,
            hinweis: 'Eigene Befehle, Knöpfe und Formeln', tun: () => Erweiterung.dialog() },
        { id: 'app-pwa', marke: 'pwa', name: 'App installieren', icon: '📱', zeichen: 'download', platz: 'apps', gruppe: 'einrichten', rang: 140,
            hinweis: 'Auf dem Telefon oder Rechner ablegen', tun: () => PWA.installieren() },
        { id: 'app-wissen', marke: 'wissen', name: 'Notion-Wissen', icon: '📖', zeichen: 'book', platz: 'apps', gruppe: 'hilfe', rang: 150,
            hinweis: 'Alles über Notion und Redion, in acht Teilen', tun: () => Wissen.oeffnen() },
        { id: 'app-kann', marke: 'kann', name: 'Was Redion kann', icon: '⭐', zeichen: 'compass', platz: 'apps', gruppe: 'hilfe', rang: 160,
            hinweis: 'Alles auf einen Blick, mit Führung', tun: () => Rundgang.uebersicht() },
        { id: 'app-pflege', marke: 'pflege', name: 'Erste Hilfe', icon: '🧰', zeichen: 'shield', platz: 'apps', gruppe: 'hilfe', rang: 170,
            hinweis: 'Prüfen, reparieren, sichern', tun: () => Pflege.ersteHilfe() },
        { id: 'favoriten', name: 'Favoriten', icon: '★', zeichen: 'star', platz: 'baum', rang: 10 },
        { id: 'seiten', name: 'Seiten', icon: '📄', zeichen: 'page', platz: 'baum', rang: 20 },
        { id: 'geteilt', name: 'Geteilt', icon: '👥', zeichen: 'share', platz: 'baum', rang: 30,
            zeigen: () => da('Wolke') && Wolke.angemeldet() },
        { id: 'papierkorbFuss', name: 'Papierkorb', icon: '🗑', zeichen: 'trash', platz: 'fuss', rang: 20,
            knopfId: 'btn-trash', tun: () => App.papierkorb() },
        { id: 'tastenkuerzel', name: 'Tastenkürzel', icon: '?', zeichen: 'command', platz: 'fuss', rang: 30,
            knopfId: 'btn-hilfe', kuerzel: 'Strg /',
            tun: () => Werkzeuge.tastenkuerzel() },
        { id: 'vorlagen', name: 'Vorlagen', icon: '🧩', zeichen: 'puzzle', platz: 'unten', rang: 10,
            tun: () => Galerie.oeffne() },
        { id: 'bibliothek', name: 'Bibliothek', icon: '📚', zeichen: 'library', platz: 'unten', rang: 20,
            tun: () => Bibliothek.oeffne() },
        { id: 'papierkorb', name: 'Papierkorb', icon: '🗑', zeichen: 'trash', platz: 'unten', rang: 30,
            tun: () => App.papierkorb() },
        { id: 'einstellungen', name: 'Einstellungen', icon: '⚙', zeichen: 'settings', platz: 'unten', rang: 40,
            tun: () => Einstellungen.oeffne() },
        { id: 'hilfe', name: 'Was Redion kann', icon: '?', zeichen: 'help', platz: 'unten', rang: 50,
            tun: () => Rundgang.uebersicht() }
    ];
    const LISTE = EINGEBAUT.slice();
    const melde = (eintrag) => {
        const e = eintrag;
        if (!e || !e.id)
            return false;
        if (LISTE.some(x => x.id === e.id))
            return false;
        LISTE.push(Object.assign({ vonAussen: true }, e));
        return true;
    };
    const nimmZurueck = (id) => {
        const i = LISTE.findIndex(x => x.id === id);
        if (i < 0)
            return false;
        LISTE.splice(i, 1);
        return true;
    };
    const alle = () => LISTE;
    const anPlatz = (platz) => LISTE
        .filter(x => x.platz === platz)
        .filter(x => !x.zeigen || (() => { try {
        return !!x.zeigen();
    }
    catch {
        return false;
    } })())
        .sort((a, b) => (a.rang || 100) - (b.rang || 100));
    const eines = (id) => LISTE.find(x => x.id === id) || null;
    return { alle, anPlatz, eines, melde, nimmZurueck, anzahl: () => LISTE.length };
})();
