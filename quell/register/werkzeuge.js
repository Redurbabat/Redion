"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/werkzeuge.ts (npm run bauen:ts). */
window.Register = window.Register || {};
Register.werkzeuge = (() => {
    const FLAECHE = [
        { id: 'zeiger', name: 'Auswählen', titel: 'Auswählen und verschieben',
            sym: 'inkPointer', zeichen: '⭠', gruppe: 'quick' },
        { id: 'hand', name: 'Hand', titel: 'Die Fläche schieben',
            sym: 'inkHand', zeichen: '✋', gruppe: 'quick' },
        { id: 'verbindung', name: 'Verbinden', titel: 'Zwei Formen verbinden — erst die eine antippen, dann die andere',
            sym: 'inkConnector', zeichen: '⇢', gruppe: 'quick' },
        { id: 'linie', name: 'Linie', titel: 'Eine gerade Linie ziehen',
            sym: 'formLine', zeichen: '╱', gruppe: 'senior' },
        { id: 'pfeil', name: 'Pfeil', titel: 'Einen Pfeil ziehen',
            sym: 'formArrow', zeichen: '→', gruppe: 'senior' },
        { id: 'rechteck', name: 'Rechteck', titel: 'Ein Rechteck aufziehen',
            sym: 'formRect', zeichen: '▭', gruppe: 'senior' },
        { id: 'ellipse', name: 'Ellipse', titel: 'Eine Ellipse aufziehen',
            sym: 'formEllipse', zeichen: '◯', gruppe: 'senior' },
        { id: 'notiz', name: 'Haftnotiz', titel: 'Eine Haftnotiz setzen und beschriften',
            sym: 'inkNote', zeichen: '🗒', gruppe: 'senior' }
    ];
    const STUDIO = [
        { id: 'schreiben', name: 'Schreiben', titel: 'Schreiben — die Zeichenschicht ist durchlässig',
            sym: 'inkHand', zeichen: '✎', gruppe: 'quick' },
        { id: 'select', name: 'Auswahl', titel: 'Marken auswählen, gemeinsam bewegen oder löschen',
            sym: 'inkLasso', zeichen: '⌖', gruppe: 'quick', kuerzel: 'V' },
        { id: 'stift', name: 'Stift', titel: 'Freihand mit geglätteter Linie',
            sym: 'inkPen', zeichen: '🖍', gruppe: 'senior', kuerzel: 'P' },
        { id: 'marker', name: 'Marker', titel: 'Transparenter Marker',
            sym: 'inkMarker', zeichen: '▰', gruppe: 'senior', kuerzel: 'H' },
        { id: 'formen', name: 'Form', titel: 'Formen — welche, steht darunter',
            sym: 'inkShapes', zeichen: '□', gruppe: 'senior', kuerzel: 'S' },
        { id: 'abdeck', name: 'Abdecken',
            titel: 'Abdeckband über Lösungen ziehen — Antippen im Schreiben-Modus deckt auf',
            sym: 'inkCover', zeichen: '▬', gruppe: 'senior', kuerzel: 'A' },
        { id: 'zettel', name: 'Haftnotiz',
            titel: 'Einen Zettel aufziehen und beschriften; Antippen mit dem Werkzeug bearbeitet ihn',
            sym: 'inkNote', zeichen: '🗒', gruppe: 'senior', kuerzel: 'N' },
        { id: 'text', name: 'Text', titel: 'Textanmerkung',
            sym: 'inkText', zeichen: 'T', gruppe: 'senior', kuerzel: 'T' },
        { id: 'textfix', name: 'Text ändern',
            titel: 'Ein Wort der PDF antippen und überschreiben — die alte Stelle wird zugedeckt, das Original bleibt unberührt',
            sym: 'inkTextFix', zeichen: '✏', gruppe: 'senior' },
        { id: 'zeichen', name: 'Fachzeichen', titel: 'Ein elektrotechnisches Symbol auf die Seite setzen',
            sym: 'inkSymbol', zeichen: '⚡', gruppe: 'senior', kuerzel: 'M' },
        { id: 'elemente', name: 'Elemente',
            titel: 'Ein gesichertes Element setzen — sichern über die Auswahl («Als Element»)',
            sym: 'inkStamp', zeichen: '⭐', gruppe: 'senior' },
        { id: 'bild', name: 'Bild',
            titel: 'Ein Foto, ein GIF oder eine Seite aus einer PDF auf das Blatt legen — danach verschieben, ziehen und drehen wie jede Marke',
            sym: 'inkImage', zeichen: '🖼', gruppe: 'senior', kuerzel: 'I', haelt: false },
        { id: 'radierer', name: 'Radieren',
            titel: 'Radieren — über Marken streichen; der Knopf daneben wählt Ganz, Teil oder Marker',
            sym: 'inkEraser', zeichen: '⌫', gruppe: 'quick', kuerzel: 'E' },
        { id: 'laser', name: 'Laserpointer',
            titel: 'Zeigen, nicht schreiben — der Strahl verblasst von selbst und wird nie gespeichert',
            sym: 'inkLaser', zeichen: '⦿', gruppe: 'quick' }
    ];
    const EINGEBAUT = [...FLAECHE, ...STUDIO];
    const LISTE = EINGEBAUT.slice();
    const melde = (werkzeug) => {
        if (!werkzeug || !werkzeug.id || LISTE.some(w => w.id === werkzeug.id))
            return false;
        LISTE.push(werkzeug);
        return true;
    };
    const holen = (id) => LISTE.find(w => w.id === id);
    const alle = () => LISTE.slice();
    const ids = () => LISTE.map(w => w.id);
    const auswahl = (bestellung) => {
        const raus = [];
        for (const id of bestellung) {
            const w = holen(id);
            if (w)
                raus.push(w);
            else
                console.warn(`Register.werkzeuge: „${id}" gibt es nicht — ausgelassen.`);
        }
        return raus;
    };
    return { melde, holen, alle, ids, auswahl };
})();
