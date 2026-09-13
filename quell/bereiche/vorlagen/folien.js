"use strict";
/* ============================================================================
 * bereiche/vorlagen/folien.ts — fertige Folienlayouts
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/vorlagen/folien.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/bereiche/vorlagen/folien.js`.
 * ----------------------------------------------------------------------------
 * Redur, 13. September 2026: „füge dort auch fertige Vorlagen."
 *
 * Ein Layout ist hier KEIN Bild und keine zweite Dokumentform, sondern eine
 * Liste von Marken auf einer 16:9-Folie — dieselben Marken, die der
 * `.pptx`-Einleser anlegt (E540) und die die Zeichenschicht seit E100
 * bearbeitet. Wer eine Vorlage nimmt, bekommt also nichts Besonderes,
 * sondern eine gewöhnliche Folie, auf der schon etwas steht: Titel
 * anklicken, Text ersetzen, fertig.
 *
 * WARUM NICHT IN `Register.vorlagen`. Dort stehen Vorlagen, die ganze
 * ARBEITSBEREICHE bauen — „Fitness-OS", „Redaktionsplan", zehn Datenbanken
 * mit Ansichten und Beispielzeilen. Ein Folienlayout ist etwas anderes: es
 * legt keine Seite an, es füllt eine. Beides in eine Liste zu werfen hiesse,
 * in der Galerie „Titelfolie" neben „Fitness-OS" zu zeigen — zwei Dinge
 * unter einem Namen, und §8 verbietet genau das aus dem umgekehrten Grund
 * (keine zwei Kataloge für DASSELBE; dies sind zwei Kataloge für ZWEIERLEI).
 * Der BEFEHL „Neue Folie" steht dagegen im Befehlsregister, wo er hingehört.
 *
 * DIE MASSE SIND FOLIENPUNKTE, KEINE BILDSCHIRMPUNKTE. Dieselbe Regel wie
 * E100: eine Folie folgt der Fensterbreite, und eine Marke bei x = 60 liegt
 * auf jedem Schirm an derselben Stelle des Papiers. Gerechnet wird gegen die
 * ÜBERGEBENE Foliengrösse, nicht gegen 960 × 540 — sonst läge bei einer
 * 4:3-Folie alles im linken Drittel.
 * ==========================================================================*/
const Folienvorlagen = (() => {
    /** PowerPoints Standardmass für 16:9, in Punkten (9144000 × 5143500 EMU). */
    const BREITE = 960;
    const HOEHE = 540;
    /* Eigen, nicht geliehen: jede Datei hat ihr `esc` (CLAUDE.md §19, und so
       steht es auch in `vorlagen/daten.ts`). Es ersetzt wirklich — der Fehler
       aus §19, der beim Lesen richtig aussieht, ist hier keiner. */
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    /* Kennungen müssen je Folie eindeutig sein; zwei Marken mit derselben
       Kennung wären für `redraw` dieselbe (marken.ts). Ein Zähler reicht —
       er läuft nur innerhalb dieses Fensters und landet nie in einer Datei,
       in der eine fremde Kennung stünde. */
    let zaehler = 0;
    const kennung = () => 'fv' + (++zaehler).toString(36) +
        Math.random().toString(36).slice(2, 8);
    /** Ein Textkasten in Anteilen der Folie — so stimmt jedes Seitenmass. */
    const text = (b, h, opt) => ({
        id: kennung(), art: 'text',
        point: [Math.round(opt.x * b), Math.round(opt.y * h)],
        breiteBox: Math.round(opt.breite * b),
        text: opt.inhalt,
        fontSize: Math.round(opt.grad * h),
        fett: !!opt.fett,
        ...(opt.farbe ? { farbe: opt.farbe } : {}),
    });
    /** Eine waagrechte Linie — als flache Abdeckmarke in Akzentfarbe. */
    const linie = (b, h, opt) => ({
        id: kennung(), art: 'abdeck', farbe: opt.farbe || '#2f6fed',
        pts: [[Math.round(opt.x * b), Math.round(opt.y * h)],
            [Math.round((opt.x + opt.breite) * b),
                Math.round((opt.y + (opt.dicke ?? 0.012)) * h)]],
    });
    /* ==========================================================================
     * DIE LAYOUTS
     * --------------------------------------------------------------------------
     * Es sind die, die PowerPoint selbst anbietet, in derselben Reihenfolge und
     * mit denselben deutschen Namen. Wer von dort kommt, sucht nicht.
     * ========================================================================*/
    const LISTE = [
        {
            id: 'titel', name: 'Titelfolie', zeichen: '🎬',
            text: 'Grosser Titel in der Mitte, Untertitel darunter',
            bauen: (b, h) => [
                text(b, h, { x: .10, y: .34, breite: .80, inhalt: 'Titel der Präsentation',
                    grad: .085, fett: true }),
                linie(b, h, { x: .10, y: .50, breite: .26 }),
                text(b, h, { x: .10, y: .55, breite: .80, inhalt: 'Untertitel oder Name', grad: .042 }),
            ],
        },
        {
            id: 'titelInhalt', name: 'Titel und Inhalt', zeichen: '📝',
            text: 'Der Normalfall — Überschrift oben, Text darunter',
            bauen: (b, h) => [
                text(b, h, { x: .07, y: .08, breite: .86, inhalt: 'Überschrift', grad: .066, fett: true }),
                linie(b, h, { x: .07, y: .20, breite: .18 }),
                text(b, h, { x: .07, y: .27, breite: .86, grad: .040,
                    inhalt: '• Erster Punkt\n• Zweiter Punkt\n• Dritter Punkt' }),
            ],
        },
        {
            id: 'zweiInhalte', name: 'Zwei Inhalte', zeichen: '🀫',
            text: 'Überschrift und zwei Spalten nebeneinander',
            bauen: (b, h) => [
                text(b, h, { x: .07, y: .08, breite: .86, inhalt: 'Überschrift', grad: .066, fett: true }),
                linie(b, h, { x: .07, y: .20, breite: .18 }),
                text(b, h, { x: .07, y: .28, breite: .40, grad: .038,
                    inhalt: '• Links\n• Zweiter Punkt' }),
                text(b, h, { x: .53, y: .28, breite: .40, grad: .038,
                    inhalt: '• Rechts\n• Zweiter Punkt' }),
            ],
        },
        {
            id: 'vergleich', name: 'Vergleich', zeichen: '⚖',
            text: 'Zwei Spalten, jede mit eigener Zwischenüberschrift',
            bauen: (b, h) => [
                text(b, h, { x: .07, y: .07, breite: .86, inhalt: 'Vergleich', grad: .062, fett: true }),
                text(b, h, { x: .07, y: .24, breite: .40, inhalt: 'Vorher', grad: .044, fett: true }),
                text(b, h, { x: .53, y: .24, breite: .40, inhalt: 'Nachher', grad: .044, fett: true }),
                linie(b, h, { x: .07, y: .33, breite: .40, dicke: .008 }),
                linie(b, h, { x: .53, y: .33, breite: .40, dicke: .008 }),
                text(b, h, { x: .07, y: .38, breite: .40, grad: .036, inhalt: '• Punkt\n• Punkt' }),
                text(b, h, { x: .53, y: .38, breite: .40, grad: .036, inhalt: '• Punkt\n• Punkt' }),
            ],
        },
        {
            id: 'abschnitt', name: 'Abschnittsüberschrift', zeichen: '🔖',
            text: 'Trennt ein Kapitel ab — grosse Zahl, grosser Name',
            bauen: (b, h) => [
                text(b, h, { x: .09, y: .28, breite: .20, inhalt: '01', grad: .150, fett: true,
                    farbe: '#2f6fed' }),
                text(b, h, { x: .09, y: .52, breite: .80, inhalt: 'Abschnitt', grad: .072, fett: true }),
                linie(b, h, { x: .09, y: .68, breite: .30 }),
            ],
        },
        {
            id: 'nurTitel', name: 'Nur Titel', zeichen: '🏷',
            text: 'Eine Überschrift, der Rest bleibt frei zum Zeichnen',
            bauen: (b, h) => [
                text(b, h, { x: .07, y: .08, breite: .86, inhalt: 'Überschrift', grad: .066, fett: true }),
                linie(b, h, { x: .07, y: .20, breite: .18 }),
            ],
        },
        {
            id: 'bildText', name: 'Bild mit Beschriftung', zeichen: '🖼',
            text: 'Platz fürs Bild links, Erklärung rechts',
            bauen: (b, h) => [
                text(b, h, { x: .07, y: .07, breite: .86, inhalt: 'Überschrift', grad: .058, fett: true }),
                /* Der Platzhalter ist ein RAHMEN, keine Fläche: er soll sagen „hier
                   kommt ein Bild hin" und nicht selbst wie eines aussehen. */
                { id: kennung(), art: 'text', rahmen: true,
                    point: [Math.round(.07 * b), Math.round(.26 * h)],
                    breiteBox: Math.round(.44 * b),
                    text: '\n   Bild hierher ziehen\n', fontSize: Math.round(.038 * h) },
                text(b, h, { x: .55, y: .26, breite: .38, grad: .036,
                    inhalt: 'Was auf dem Bild zu sehen ist\nund warum es hier steht.' }),
            ],
        },
        {
            id: 'leer', name: 'Leer', zeichen: '⬜',
            text: 'Weisse Folie — für alles, was kein Layout braucht',
            bauen: () => [],
        },
    ];
    const alle = () => LISTE.map(v => ({ ...v }));
    const eines = (id) => LISTE.find(v => v.id === id) || null;
    /** Die Marken eines Layouts für eine Folie dieser Grösse. */
    const marken = (id, breite = BREITE, hoehe = HOEHE) => {
        const v = eines(id);
        if (!v)
            return [];
        try {
            return v.bauen(Math.max(1, breite), Math.max(1, hoehe));
        }
        catch {
            return [];
        }
    };
    /* ==========================================================================
     * DIE WEGE
     * ========================================================================*/
    /** Eine Folie an einen Foliensatz anhängen. */
    const neueFolie = (seiteId, layoutId = 'titelInhalt', breite = BREITE, hoehe = HOEHE) => {
        if (!seiteId)
            return null;
        const v = eines(layoutId);
        const block = Store.addBlock(seiteId, 'blatt', {
            text: v ? v.name : 'Folie', blattBreite: breite, blattHoehe: hoehe, papier: 'blanko'
        });
        const liste = marken(layoutId, breite, hoehe);
        if (liste.length)
            Store.updateBlock(block.id, { marken: liste });
        return Store.getBlock(block.id);
    };
    /**
     * Eine neue Präsentation — Seite, erste Folie, Dokumentmodus.
     *
     * `dokumentModus` ist dieselbe Flagge wie beim `.pptx`-Einleser (E546):
     * ohne sie stünde die Folie als Blatt in einem Texteditor, und der Weg
     * hätte das Ding angelegt, aber nicht geöffnet (E397).
     */
    const neuePraesentation = (layoutId = 'titel', titel = '') => {
        const seite = Store.addPage(null, { text: titel || 'Neue Präsentation', icon: '📽️' });
        neueFolie(seite.id, layoutId);
        Store.updateBlock(seite.id, { dokumentModus: true });
        return Store.getBlock(seite.id);
    };
    /* ==========================================================================
     * DER WÄHLER
     * --------------------------------------------------------------------------
     * Eine Karte je Layout, mit einer echten kleinen Vorschau statt eines
     * Zeichens: gezeichnet wird sie von `Marken.zeichneMarke` — derselben
     * Stelle wie Folie, Miniatur, Vortrag und Druck (§8, E547). Ein Layout,
     * das man nicht sieht, wählt niemand zweimal.
     * ========================================================================*/
    const vorschau = (layoutId) => {
        const liste = marken(layoutId, BREITE, HOEHE);
        if (!liste.length || typeof Marken === 'undefined')
            return '';
        let innen = '';
        try {
            const defs = typeof Marken.verlaufDefs === 'function' ? Marken.verlaufDefs(liste) : null;
            if (defs)
                innen += defs.outerHTML;
            for (const m of liste) {
                const knoten = Marken.zeichneMarke(m);
                if (knoten)
                    innen += knoten.outerHTML;
            }
        }
        catch {
            return '';
        }
        return innen
            ? `<svg class="fv-bild" viewBox="0 0 ${BREITE} ${HOEHE}" preserveAspectRatio="none" ` +
                `aria-hidden="true">${innen}</svg>`
            : '';
    };
    /**
     * Den Wähler zeigen und das gewählte Layout zurückgeben.
     *
     * Aufgelöst wird mit `null`, wenn jemand abbricht — dann entsteht auch
     * keine Seite. Ein abgebrochener Wähler, der trotzdem etwas anlegt, ist
     * der Fehler, gegen den §47 „kein Weg, der ins Leere führt" steht.
     */
    const waehle = (kopf = 'Layout wählen') => new Promise(fertig => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(820px,95vw)">' +
                '<div class="fh">📽️ ' + esc(kopf) +
                '<button class="icon-btn" data-a="zu" aria-label="Schliessen">✕</button></div>' +
                '<div class="fv-gitter">' +
                LISTE.map(v => `<button class="fv-karte" data-v="${esc(v.id)}">` +
                    `<span class="fv-rahmen">${vorschau(v.id) ||
                        `<span class="fv-leer">${esc(v.zeichen)}</span>`}</span>` +
                    `<b>${esc(v.name)}</b><span class="fv-text">${esc(v.text)}</span>` +
                    '</button>').join('') +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        let beantwortet = false;
        const schliesse = (wahl) => {
            if (beantwortet)
                return;
            beantwortet = true;
            o.remove();
            fertig(wahl);
        };
        o.addEventListener('click', e => {
            const ziel = e.target;
            if (ziel === o || ziel?.closest('[data-a="zu"]')) {
                schliesse(null);
                return;
            }
            const karte = ziel?.closest('[data-v]');
            if (karte)
                schliesse(karte.dataset['v'] || null);
        });
        /* Escape schliesst — der gemeinsame Griff aus E302 nimmt `.overlay`
           von selbst; hier steht nur, was DANN geschehen soll (§38). */
        const taste = (e) => {
            if (e.key !== 'Escape')
                return;
            document.removeEventListener('keydown', taste, true);
            schliesse(null);
        };
        document.addEventListener('keydown', taste, true);
        o.querySelector('.fv-karte')?.focus();
    });
    /** „Neue Präsentation" mit Wähler — der Weg aus dem Anlegen-Menü. */
    const anlegenMitWahl = async () => {
        const wahl = await waehle('Womit soll die erste Folie anfangen?');
        if (!wahl)
            return null;
        const seite = neuePraesentation(wahl);
        if (typeof App !== 'undefined') {
            App.zeichneBaum?.();
            App.oeffne?.(seite.id);
        }
        return seite;
    };
    /** „Neue Folie" mit Wähler — der Befehl aus der Palette. */
    const folieMitWahl = async (seiteId) => {
        const ziel = seiteId || (typeof App !== 'undefined' ? App.aktuelleSeite() : '');
        if (!ziel) {
            UI.toast('Erst eine Präsentation öffnen');
            return null;
        }
        const wahl = await waehle('Layout der neuen Folie');
        if (!wahl)
            return null;
        /* Die neue Folie bekommt die Masse der VORHANDENEN — eine 4:3-Folie
           mitten in einem 16:9-Satz wäre ein Sprung im Vortrag. */
        const vorhanden = (Store.childrenOf(ziel) || []).find((b) => b.type === 'blatt');
        const folie = neueFolie(ziel, wahl, Number(vorhanden?.blattBreite) || BREITE, Number(vorhanden?.blattHoehe) || HOEHE);
        if (typeof App !== 'undefined')
            App.zeichneSeite?.();
        return folie;
    };
    /** Ist DIESE Seite ein Foliensatz? Für `zeigen()` am Befehl. */
    const istFoliensatz = (seiteId) => {
        const seite = seiteId ? Store.getBlock(seiteId) : null;
        if (!seite || !seite.dokumentModus)
            return false;
        return (Store.childrenOf(seiteId) || []).some((b) => b.type === 'blatt');
    };
    /* Der Befehl gehört ins Befehlsregister, nicht in eine Liste hier (§8
       Regel 3). `zeigen()` hält ihn aus der Palette heraus, wo er nichts
       täte — ein Befehl, der dasteht und dann sagt, dass er hier nicht geht,
       ist die häufigste Enttäuschung überhaupt (register/befehle.ts). */
    if (typeof Register !== 'undefined' && Register.befehle) {
        Register.befehle.melde({
            titel: 'Neue Folie', gruppe: 'Anlegen',
            zeigen: () => typeof App !== 'undefined' && istFoliensatz(App.aktuelleSeite()),
            tun: () => { void folieMitWahl(); },
        });
        Register.befehle.melde({
            titel: 'Neue Präsentation', gruppe: 'Anlegen',
            tun: () => { void anlegenMitWahl(); },
        });
    }
    return { alle, eines, marken, vorschau, waehle,
        neueFolie, neuePraesentation, anlegenMitWahl, folieMitWahl,
        istFoliensatz, BREITE, HOEHE };
})();
window.Folienvorlagen = Folienvorlagen;
