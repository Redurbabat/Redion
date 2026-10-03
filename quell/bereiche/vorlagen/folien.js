"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/vorlagen/folien.ts (npm run bauen:ts). */
const Folienvorlagen = (() => {
    const BREITE = 960;
    const HOEHE = 540;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    let zaehler = 0;
    const kennung = () => 'fv' + (++zaehler).toString(36) +
        Math.random().toString(36).slice(2, 8);
    const text = (b, h, opt) => ({
        id: kennung(), art: 'text',
        point: [Math.round(opt.x * b), Math.round(opt.y * h)],
        breiteBox: Math.round(opt.breite * b),
        text: opt.inhalt,
        fontSize: Math.round(opt.grad * h),
        fett: !!opt.fett,
        ...(opt.farbe ? { farbe: opt.farbe } : {}),
    });
    const linie = (b, h, opt) => {
        const dick = Math.max(1, Math.round((opt.dicke ?? 0.012) * h));
        const y = Math.round((opt.y + (opt.dicke ?? 0.012) / 2) * h);
        return {
            id: kennung(), art: 'line', farbe: opt.farbe || '#2f6fed', breite: dick,
            pts: [[Math.round(opt.x * b), y],
                [Math.round((opt.x + opt.breite) * b), y]],
        };
    };
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
    const neuePraesentation = (layoutId = 'titel', titel = '') => {
        const seite = Store.addPage(null, { text: titel || 'Neue Präsentation', icon: '📽️' });
        neueFolie(seite.id, layoutId);
        Store.updateBlock(seite.id, { dokumentModus: true });
        return Store.getBlock(seite.id);
    };
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
        const taste = (e) => {
            if (e.key !== 'Escape')
                return;
            document.removeEventListener('keydown', taste, true);
            schliesse(null);
        };
        document.addEventListener('keydown', taste, true);
        o.querySelector('.fv-karte')?.focus();
    });
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
    const folieMitWahl = async (seiteId) => {
        const ziel = seiteId || (typeof App !== 'undefined' ? App.aktuelleSeite() : '');
        if (!ziel) {
            UI.toast('Erst eine Präsentation öffnen');
            return null;
        }
        const wahl = await waehle('Layout der neuen Folie');
        if (!wahl)
            return null;
        const vorhanden = (Store.childrenOf(ziel) || []).find((b) => b.type === 'blatt');
        const folie = neueFolie(ziel, wahl, Number(vorhanden?.blattBreite) || BREITE, Number(vorhanden?.blattHoehe) || HOEHE);
        if (typeof App !== 'undefined')
            App.zeichneSeite?.();
        return folie;
    };
    const istFoliensatz = (seiteId) => {
        const seite = seiteId ? Store.getBlock(seiteId) : null;
        if (!seite || !seite.dokumentModus)
            return false;
        return (Store.childrenOf(seiteId) || []).some((b) => b && b.type === 'blatt' &&
            Number(b.blattBreite) > Number(b.blattHoehe));
    };
    const offenerSatz = () => {
        const id = typeof App !== 'undefined' ? String(App.aktuelleSeite() || '') : '';
        return id && istFoliensatz(id) ? id : '';
    };
    const bandEintraege = () => {
        const satz = offenerSatz();
        if (!satz)
            return [];
        const da = (griff) => {
            try {
                return typeof griff() === 'function';
            }
            catch {
                return false;
            }
        };
        const eintrag = (o) => ({ reiter: 'praesentation', ...o,
            zeigen: () => !!offenerSatz() && (o.wenn ? o.wenn() : true) });
        return [
            eintrag({ gruppe: 'Folien', id: 'pv-neu', name: 'Neue Folie', zeichen: 'plus',
                gross: true, hinweis: 'Eine Folie anhängen — mit Layout zur Wahl',
                tun: () => { void folieMitWahl(); } }),
            eintrag({ gruppe: 'Folien', id: 'pv-liste', name: 'Folienliste', zeichen: 'page',
                hinweis: 'Die Folien links zeigen oder verbergen',
                wenn: () => typeof DocumentMode !== 'undefined',
                tun: () => {
                    const knopf = [...document.querySelectorAll('button, a')]
                        .find(b => /^▤\s*Seiten$/.test((b.textContent || '').trim()));
                    if (knopf)
                        knopf.click();
                    else
                        UI.toast('Die Folienliste ist hier nicht da');
                } }),
            eintrag({ gruppe: 'Vortrag', id: 'pv-zeigen', name: 'Präsentieren', zeichen: 'play',
                gross: true, hinweis: 'Vollbild — ein Klick deckt die nächste Antwort auf',
                wenn: () => da(() => Werkzeuge.praesentation),
                tun: () => { void Werkzeuge.praesentation(Store.getBlock(offenerSatz())); } }),
            eintrag({ gruppe: 'Ausgeben', id: 'pv-pptx', name: 'Als PowerPoint', zeichen: 'download',
                hinweis: 'Die Folien als .pptx-Datei sichern',
                wenn: () => da(() => Austausch.alsPowerPoint),
                tun: () => { void Austausch.alsPowerPoint(Store.getBlock(offenerSatz())); } }),
            eintrag({ gruppe: 'Ausgeben', id: 'pv-pdf', name: 'Als PDF', zeichen: 'page',
                hinweis: 'Die Folien als PDF sichern',
                wenn: () => typeof DocumentMode !== 'undefined' && da(() => DocumentMode.alsPdf),
                tun: () => { void DocumentMode.alsPdf(Store.getBlock(offenerSatz())); } }),
            eintrag({ gruppe: 'Ausgeben', id: 'pv-drucken', name: 'Drucken', zeichen: 'printer',
                hinweis: 'Die Folien drucken',
                wenn: () => da(() => Werkzeuge.drucken),
                tun: () => { void Werkzeuge.drucken(Store.getBlock(offenerSatz())); } }),
        ];
    };
    if (typeof Register !== 'undefined' && Register.menueband?.meldeLieferant)
        Register.menueband.meldeLieferant(bandEintraege);
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
        istFoliensatz, offenerSatz, bandEintraege, BREITE, HOEHE };
})();
window.Folienvorlagen = Folienvorlagen;
