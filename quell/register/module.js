"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/module.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.module = (() => {
    const EINGEBAUT = [
        { id: 'editor', name: 'Schreiben', icon: '✎', zeichen: 'pencil',
            was: 'Seiten und Blöcke — der Teil, in dem man tippt.',
            oeffnen: () => App.oeffne(App.aktuelleSeite()) },
        { id: 'datenbanken', name: 'Datenbanken', icon: '▦', zeichen: 'database',
            was: 'Tabellen, Ansichten, Formeln, Filter, Automationen.',
            oeffnen: () => (typeof Werkzeuge !== 'undefined') && Werkzeuge.palette('datenbank') },
        { id: 'wissen', name: 'Wissen', icon: '🧠', zeichen: 'cards',
            was: 'Verweise, Graph, Schlagwörter, Karteikarten, Journal.',
            oeffnen: () => (typeof Werkzeuge !== 'undefined') && Werkzeuge.lernen && Werkzeuge.lernen() },
        { id: 'ki', name: 'KI', icon: '✨', zeichen: 'sparkle',
            was: 'Modelle, Kontext, Agenten, Werkzeuge über MCP.',
            oeffnen: () => App.kiPanel() },
        { id: 'verbinden', name: 'Verbinden', icon: '🔗', zeichen: 'link',
            was: 'Konten, Kalender, Mail, Besprechungen, Wolke, Schnittstelle.',
            oeffnen: () => (typeof Verbindungen !== 'undefined') && Verbindungen.dialog() },
        { id: 'dateien', name: 'Dateien', icon: '📎', zeichen: 'clipboard',
            was: 'Ablage in Stücken, Einlesen, Ausgeben, fremde Formate.',
            oeffnen: () => (typeof Dateien !== 'undefined') && Dateien.dialog() },
        { id: 'einstellungen', name: 'Einstellungen', icon: '⚙', zeichen: 'settings',
            was: 'Aussehen, Bereiche, Pflege, Erweiterungen.',
            oeffnen: () => (typeof Einstellungen !== 'undefined') && Einstellungen.oeffne() },
        { id: 'hilfe', name: 'Hilfe', icon: '?', zeichen: 'help',
            was: 'Rundgang, Tastenkürzel, Wissensseiten, Umsetzungsstand.',
            oeffnen: () => (typeof Rundgang !== 'undefined') && Rundgang.uebersicht() },
        { id: 'lernwelt', name: 'Lernen & Alltag', icon: '🎓', zeichen: 'today',
            was: 'Heute, Lernzentrale, Lernpfad, Fehler, Prüfungen, Schule, Uni, Arbeit.',
            oeffnen: () => (typeof Produktwelten !== 'undefined') && Produktwelten.lernen('heute') },
        { id: 'notizhefte', name: 'Notizhefte', icon: '📓', zeichen: 'book',
            was: 'Regal deiner Schreibhefte — öffnen und losschreiben (E264).',
            oeffnen: () => (typeof Notebook !== 'undefined') && Notebook.oeffnen() },
        { id: 'arbeitswelt', name: 'Seiten & Wissen', icon: '📄', zeichen: 'pages',
            was: 'Bestand, Favoriten, zuletzt geöffnete Seiten und geteilte Ansicht in der Bibliothek.',
            oeffnen: () => (typeof Produktwelten !== 'undefined') && Produktwelten.workspace('uebersicht') },
        { id: 'lebensbereiche', name: 'Lebensbereiche', icon: '◎', zeichen: 'compass',
            was: 'Schule, Arbeit, Privat — dieselbe Seite darf in mehreren stehen, ohne Kopie.',
            oeffnen: () => {
                const id = (typeof App !== 'undefined' && App.aktuelleSeite) ? App.aktuelleSeite() : null;
                const seite = id ? Store.getBlock(id) : null;
                if (!seite || typeof Produktwelten === 'undefined') {
                    if (typeof UI !== 'undefined')
                        UI.toast('Lebensbereiche gehören zu einer Seite. Öffne zuerst eine Seite.');
                    return;
                }
                Produktwelten.bereicheDialog(seite);
            } },
        { id: 'elektro', name: 'Elektrotechnik', icon: '⚡', zeichen: 'bolt',
            was: 'Rechnungen mit Quellenangabe und ein geprüftes Grundlagen-Lernpaket.',
            oeffnen: () => (typeof Elektrostart !== 'undefined')
                ? Elektrostart.oeffne()
                : (typeof Electrical !== 'undefined') && Electrical.open() },
        { id: 'erkennung', name: 'Erfassen & Erkennen', icon: '📷', zeichen: 'camera',
            was: 'Kamera und Dateien in den Eingang; Text aus Bild, PDF und Handschrift ' +
                'über den mitgelieferten lokalen Dienst.',
            oeffnen: () => (typeof Recognition !== 'undefined') && Recognition.scan() },
        { id: 'zeitmesser', name: 'Zeitmesser', icon: '⏱', zeichen: 'clock',
            was: 'Stoppuhr und Timer mit Dokumentbezug — Lernzeit messen statt schätzen (E268).',
            oeffnen: () => (typeof Zeitmesser !== 'undefined') && Zeitmesser.panel() },
        { id: 'dokumentmodus', name: 'Dokumentmodus', icon: '📖', zeichen: 'library',
            was: 'Eine PDF- oder Blattseite gross, mit den Objekten daneben.',
            oeffnen: () => {
                const seite = (typeof App !== 'undefined' && App.aktuelleSeite)
                    ? Store.getBlock(App.aktuelleSeite()) : null;
                if (typeof DocumentMode === 'undefined' || !seite || !DocumentMode.available(seite)) {
                    if (typeof UI !== 'undefined')
                        UI.toast('Der Dokumentmodus braucht eine Seite mit PDF-Seiten oder A4-Blättern.');
                    return;
                }
                DocumentMode.toggle(seite, true);
            } }
    ];
    const LISTE = EINGEBAUT.slice();
    const melde = (eintrag) => {
        const e = eintrag;
        if (!e || !e.id)
            return false;
        if (LISTE.some(x => x.id === e.id))
            return false;
        LISTE.push(e);
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
    const eines = (id) => LISTE.find(x => x.id === id) || null;
    const oeffne = (id) => {
        const m = eines(id);
        if (!m) {
            if (typeof Reporter !== 'undefined')
                Reporter.warn('Register', 'Bereich unbekannt: ' + id);
            return false;
        }
        try {
            m.oeffnen();
            return true;
        }
        catch (e) {
            const grund = e instanceof Error ? e.message : String(e);
            if (typeof Reporter !== 'undefined')
                Reporter.error('Register', 'Bereich ' + id + ': ' + grund, e);
            return false;
        }
    };
    return { alle, eines, oeffne, melde, nimmZurueck, anzahl: () => LISTE.length };
})();
