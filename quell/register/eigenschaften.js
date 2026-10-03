"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/eigenschaften.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.eigenschaften = (() => {
    const EINGEBAUT = [
        { id: 'title', name: 'Titel', icon: 'T' },
        { id: 'text', name: 'Text', icon: '≡' },
        { id: 'number', name: 'Zahl', icon: '#' },
        { id: 'select', name: 'Auswahl', icon: '⊙' },
        { id: 'multi', name: 'Mehrfachauswahl', icon: '⊞' },
        { id: 'status', name: 'Status', icon: '◐' },
        { id: 'date', name: 'Datum', icon: '📅' },
        { id: 'person', name: 'Person', icon: '👤' },
        { id: 'checkbox', name: 'Kontrollkästchen', icon: '☑' },
        { id: 'sterne', name: 'Bewertung', icon: '★' },
        { id: 'prozent', name: 'Fortschritt', icon: '▰' },
        { id: 'url', name: 'URL', icon: '🔗' },
        { id: 'email', name: 'E-Mail', icon: '✉' },
        { id: 'phone', name: 'Telefon', icon: '☎' },
        { id: 'formula', name: 'Formel', icon: '∑' },
        { id: 'created', name: 'Erstellt am', icon: '🕐' },
        { id: 'edited', name: 'Zuletzt geändert', icon: '🕑' },
        { id: 'files', name: 'Dateien', icon: '📎' },
        { id: 'relation', name: 'Verknüpfung', icon: '⇄' },
        { id: 'rollup', name: 'Rollup', icon: '⤴' },
        { id: 'uid', name: 'Laufende Nummer', icon: 'ID' },
        { id: 'button', name: 'Knopf', icon: '🔘' },
        { id: 'ki', name: 'KI-Feld', icon: '✨' },
        { id: 'createdBy', name: 'Erstellt von', icon: '👤' },
        { id: 'editedBy', name: 'Zuletzt bearbeitet von', icon: '👥' },
        { id: 'place', name: 'Ort', icon: '📍' },
        { id: 'duration', name: 'Zeitspanne', icon: '⏱' },
        { id: 'verify', name: 'Prüfung', icon: '✔' },
        { id: 'ki-fassung', name: 'KI: Zusammenfassung', icon: '✨' },
        { id: 'ki-sprache', name: 'KI: Übersetzung', icon: '✨' },
        { id: 'ki-worte', name: 'KI: Schlagwörter', icon: '✨' },
        { id: 'gdrive', name: 'Google Drive Datei', icon: '🟢', dienst: 'google' },
        { id: 'figma', name: 'Figma Datei', icon: '🎨', dienst: 'figma' },
        { id: 'githubpr', name: 'GitHub-Pull-Request', icon: '🐙', dienst: 'github' },
        { id: 'zendesk', name: 'Zendesk Ticket', icon: '🎫', dienst: 'zendesk' }
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
    const eines = (id) => alle().find(x => x.id === id) || null;
    const name = (id) => eines(id)?.name || String(id);
    const icon = (id) => eines(id)?.icon || '≡';
    const GRUPPEN = {
        'Grundlegend': ['title', 'text', 'number', 'select', 'multi', 'status', 'date', 'person',
            'files', 'checkbox', 'url', 'email', 'phone'],
        'Berechnet': ['formula', 'rollup', 'relation', 'uid'],
        'Automatisch': ['created', 'edited', 'createdBy', 'editedBy'],
        'Weiteres': []
    };
    const inGruppe = (g) => {
        if (g !== 'Weiteres') {
            const ids = GRUPPEN[g] || [];
            return alle().filter(x => ids.includes(x.id));
        }
        const bekannt = new Set(Object.values(GRUPPEN).flat());
        return alle().filter(x => !bekannt.has(x.id));
    };
    return { alle, eines, name, icon, GRUPPEN, inGruppe, melde, nimmZurueck,
        anzahl: () => LISTE.length };
})();
