"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/ki.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.ki = (() => {
    const S = 'Schreiben und bearbeiten';
    const B = 'Bauen und nachschlagen';
    const BEFEHLE = [
        { id: 'zusammenfassen', name: 'Zusammenfassen', icon: '📋', art: 'auftrag', gruppe: S,
            ziel: 'seite', ausgabe: 'darunter', haeufig: true,
            auftrag: 'Fasse den Text in höchstens fünf kurzen Stichpunkten zusammen. ' +
                'Hebe Entscheidungen, offene Fragen und nächste Schritte hervor.',
            alt: { sb: 'fassen', block: ['ai-summary'] } },
        { id: 'aufgaben', name: 'Aufgaben ableiten', icon: '☑', art: 'auftrag', gruppe: S,
            ziel: 'seite', ausgabe: 'darunter', haeufig: true,
            auftrag: 'Leite aus dem Text konkrete Aufgaben ab. Jede Aufgabe als eigene Zeile, ' +
                'beginnend mit einem Verb.',
            alt: { block: ['ai-todo'] } },
        { id: 'besser', name: 'Text verbessern', icon: '✨', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'ersetzen',
            auftrag: 'Formuliere den Text klarer und flüssiger, ohne den Sinn zu ändern.',
            alt: { faehig: 'stil', block: ['ai-edit', 'ai-improve'] } },
        { id: 'uebersetzen', name: 'Übersetzen', icon: '🌍', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'ersetzen', haeufig: true,
            auftrag: 'Übersetze den Text in diese Sprache: {sprache}. Gib nur die Übersetzung zurück.',
            frage: 'In welche Sprache?', vorgabe: 'Englisch',
            alt: { block: ['ai-translate'] } },
        { id: 'karteikarten', name: 'Karteikarten', icon: '🗂', art: 'auftrag', gruppe: S,
            ziel: 'seite', ausgabe: 'karteikarten',
            auftrag: 'Mache aus dem Text Karteikarten. Je Zeile genau eine Karte: Frage :: Antwort. ' +
                'Keine Nummerierung, keine Einleitung.' },
        { id: 'schreiben', name: 'Text schreiben', icon: '✒️', art: 'auftrag', gruppe: S,
            ziel: 'block', ausgabe: 'darunter',
            auftrag: 'Schreibe einen zusammenhängenden Absatz zu diesem Stichwort.',
            alt: { block: ['ai-write'] } },
        { id: 'weiter', name: 'Weiterschreiben', icon: '✒️', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'darunter',
            auftrag: 'Schreib den Text sinnvoll weiter. Gleiche Stimme, gleicher Ton, keine Wiederholung.' },
        { id: 'kuerzer', name: 'Kürzer machen', icon: '✂️', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'ersetzen',
            auftrag: 'Kürze den Text auf das Wesentliche. Höchstens die Hälfte.' },
        { id: 'laenger', name: 'Länger machen', icon: '📏', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'ersetzen',
            auftrag: 'Führe den Text weiter aus, mit Beispielen. Nichts erfinden, was widerspricht.' },
        { id: 'einfach', name: 'Einfacher erklären', icon: '💡', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'darunter',
            auftrag: 'Erkläre denselben Inhalt einfach und verständlich, ohne Fachjargon — so, ' +
                'dass ihn jemand ohne Vorwissen versteht.',
            alt: { faehig: 'erklaer' } },
        { id: 'ton-formell', name: 'Ton: förmlich', icon: '🎩', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'ersetzen',
            auftrag: 'Schreib den Text förmlich und sachlich um, in der Sie-Form.' },
        { id: 'ton-locker', name: 'Ton: locker', icon: '😊', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'ersetzen',
            auftrag: 'Schreib den Text locker und freundlich um, in der Du-Form.' },
        { id: 'ton-direkt', name: 'Ton: direkt', icon: '🎯', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'ersetzen',
            auftrag: 'Schreib den Text kurz und direkt um. Keine Höflichkeitsfloskeln.' },
        { id: 'recht', name: 'Rechtschreibung', icon: '📝', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'ersetzen',
            auftrag: 'Korrigiere Rechtschreibung, Grammatik und Zeichensetzung. Ändere sonst nichts.',
            alt: { faehig: 'korrek' } },
        { id: 'ideen', name: 'Ideen sammeln', icon: '💡', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'darunter',
            auftrag: 'Sammle zehn Ideen zum Thema. Je Zeile eine, ohne Nummerierung.' },
        { id: 'gliedern', name: 'Gliederung bauen', icon: '🗂', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'ersetzen',
            auftrag: 'Gliedere den Text sauber mit Überschriften und Stichpunkten. Der Inhalt bleibt.',
            alt: { faehig: 'format' } },
        { id: 'tabelle', name: 'Tabelle daraus machen', icon: '▦', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'darunter',
            auftrag: 'Mach aus dem Text eine Tabelle. Antworte als Markdown-Tabelle mit Kopfzeile.' },
        { id: 'fragen', name: 'Rückfragen finden', icon: '❓', art: 'auftrag', gruppe: S,
            ziel: 'markierung', ausgabe: 'darunter',
            auftrag: 'Nenne fünf Fragen, die dieser Text offen lässt.' },
        { id: 'datenbank', name: 'Datenbank bauen', icon: '▦', art: 'werkzeug', gruppe: B,
            ziel: 'datenbank', ausgabe: 'chat', haeufig: true, palette: 'Datenbank von der KI bauen lassen',
            auftrag: '', frage: 'Was soll die Datenbank können?',
            vorgabe: 'Aufgaben mit Status, Priorität, Fälligkeit und Aufwand' },
        { id: 'seite', name: 'Seite aufbauen', icon: '📄', art: 'werkzeug', gruppe: B,
            ziel: 'seite', ausgabe: 'chat', haeufig: true, palette: 'Seitenaufbau von der KI',
            auftrag: '', frage: 'Worum geht es auf der Seite?', vorgabe: '' },
        { id: 'nachschlagen', name: 'Bei Wikipedia nachschlagen', icon: '📖', art: 'werkzeug', gruppe: B,
            ziel: 'chat', ausgabe: 'chat', haeufig: true, palette: 'Nachschlagen bei Wikipedia',
            auftrag: '', frage: 'Was soll ich nachschlagen?' },
        { id: 'protokoll', name: 'Protokoll: was die KI gebaut hat', icon: '🕘', art: 'werkzeug', gruppe: B,
            ziel: 'chat', ausgabe: 'chat', haeufig: true, palette: 'Protokoll: was die KI gebaut hat',
            auftrag: '' }
    ];
    const finde = (id) => BEFEHLE.find(b => b.id === id);
    const alle = () => BEFEHLE.slice();
    const ausAlt = (art, wert) => BEFEHLE.find(b => {
        const a = b.alt?.[art];
        return Array.isArray(a) ? a.includes(String(wert)) : a === wert;
    });
    const auftrag = (id, werte = {}) => {
        const b = finde(id);
        if (!b)
            return '';
        return b.auftrag.replace('{sprache}', werte.sprache || b.vorgabe || 'Englisch');
    };
    return { alle, finde, ausAlt, auftrag };
})();
