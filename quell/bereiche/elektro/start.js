"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/elektro/start.ts (npm run bauen:ts). */
const Elektrostart = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const ELEKTROARTEN = new Set(['schaltplan']);
    const zuletzt = () => {
        if (typeof App === 'undefined' || typeof Store === 'undefined')
            return [];
        let liste = [];
        try {
            liste = App.kuerzlich() || [];
        }
        catch {
            return [];
        }
        return liste.filter((p) => {
            try {
                return Store.childrenOf(p.id)
                    .some((k) => ELEKTROARTEN.has(String(k.type)));
            }
            catch {
                return false;
            }
        }).slice(0, 4);
    };
    const faellig = () => {
        try {
            return (Werkzeuge.faellig() || []).length;
        }
        catch {
            return 0;
        }
    };
    const wege = () => {
        try {
            const roh = Register.menueband.inReiter('elektro');
            return roh
                .map((g) => ({
                gruppe: g.gruppe,
                eintraege: g.eintraege.filter((e) => {
                    try {
                        return typeof e.zeigen !== 'function' || e.zeigen();
                    }
                    catch {
                        return false;
                    }
                })
            }))
                .filter((g) => g.eintraege.length > 0);
        }
        catch {
            return [];
        }
    };
    const zeichenHtml = (zeichen) => {
        try {
            if (Register?.symbole?.hat?.(zeichen))
                return '<span class="els-zeichen" data-sym="' + esc(zeichen) + '" aria-hidden="true"></span>';
        }
        catch { }
        return '<span class="els-zeichen els-glyph" aria-hidden="true">' + esc(zeichen) + '</span>';
    };
    const kachel = (e) => '<button type="button" class="els-kachel' + (e.gross ? ' gross' : '') +
        '" data-weg="' + esc(e.id) + '"' +
        (e.hinweis ? ' title="' + esc(e.hinweis) + '"' : '') + '>' +
        zeichenHtml(String(e.zeichen || '')) +
        '<span class="els-text"><b>' + esc(e.name) + '</b>' +
        (e.hinweis ? '<small>' + esc(e.hinweis) + '</small>' : '') +
        '</span></button>';
    const zeichnen = (wrap) => {
        const offen = zuletzt();
        const dran = faellig();
        const gruppen = wege();
        let html = '<div class="els">' +
            '<div class="els-kopf">' +
            '<h1>⚡ Elektro</h1>' +
            '<p>Rechnen, üben und zeichnen — alles an einem Ort.</p>' +
            '</div>';
        if (dran > 0) {
            html += '<button type="button" class="els-dran" data-weg="e-ueben">' +
                '<span class="els-dran-zahl">' + dran + '</span>' +
                '<span class="els-dran-text"><b>' +
                (dran === 1 ? 'Eine Karte ist fällig' : dran + ' Karten sind fällig') +
                '</b><small>Zuerst Fehler, dann Fälliges, dann Neues.</small></span>' +
                '</button>';
        }
        if (offen.length) {
            html += '<div class="els-abschnitt"><h2>Weiter wo du warst</h2>' +
                '<div class="els-weiter">' +
                offen.map((p) => '<button type="button" class="els-seite" data-seite="' + esc(p.id) + '">' +
                    '<span class="els-seite-zeichen">' + esc(p.icon || '⚡') + '</span>' +
                    '<b>' + esc(p.text || 'Ohne Titel') + '</b>' +
                    '</button>').join('') +
                '</div></div>';
        }
        for (const g of gruppen) {
            html += '<div class="els-abschnitt"><h2>' + esc(g.gruppe) + '</h2>' +
                '<div class="els-gitter">' + g.eintraege.map(kachel).join('') + '</div></div>';
        }
        if (!gruppen.length) {
            html += '<p class="els-leer">Die Elektro-Werkzeuge sind gerade nicht ' +
                'geladen. Lade die Seite neu, dann stehen sie wieder hier.</p>';
        }
        html += '</div>';
        wrap.innerHTML = html;
        try {
            Register?.symbole?.fuelle?.(wrap);
        }
        catch { }
        binde(wrap);
    };
    const binde = (wrap) => {
        wrap.querySelectorAll('[data-weg]').forEach(k => {
            k.addEventListener('click', () => {
                const eintrag = Register.menueband.eines(k.dataset['weg'] || '');
                if (!eintrag || typeof eintrag.tun !== 'function') {
                    try {
                        UI.toast('Dieser Weg ist gerade nicht verfügbar.');
                    }
                    catch { }
                    return;
                }
                try {
                    eintrag.tun();
                }
                catch (fehler) {
                    console.error('[Elektro] ' + (k.dataset['weg'] || ''), fehler);
                    try {
                        UI.toast('Das hat nicht geklappt.');
                    }
                    catch { }
                }
            });
        });
        wrap.querySelectorAll('[data-seite]').forEach(k => {
            k.addEventListener('click', () => App.oeffne(k.dataset['seite'] || null));
        });
    };
    const oeffne = () => {
        try {
            Seitenleiste.reiter('elektro');
        }
        catch { }
        App.zeigeSonder('Elektro', zeichnen);
    };
    const werkzeugmenue = (schliessen, planOeffnen) => {
        const liste = document.createElement('div');
        liste.className = 'gfx-tb-liste gfx-tb-befehlsliste';
        const eintrag = (name, zeichen, tun) => {
            const knopf = document.createElement('button');
            knopf.type = 'button';
            const symbol = document.createElement('span');
            symbol.dataset.sym = zeichen;
            symbol.setAttribute('aria-hidden', 'true');
            knopf.append(symbol, document.createTextNode(name));
            knopf.addEventListener('click', () => {
                schliessen();
                tun();
            });
            liste.append(knopf);
        };
        const gruppen = wege();
        const plan = gruppen.flatMap(g => g.eintraege).find(e => e.id === 'e-plan');
        if (plan)
            eintrag('Schaltplan und Simulation', plan.zeichen, planOeffnen);
        eintrag('Elektrotechnik öffnen', 'bolt', oeffne);
        for (const gruppe of gruppen) {
            const werkzeuge = gruppe.eintraege.filter(e => e.id !== 'e-plan');
            if (!werkzeuge.length)
                continue;
            const titel = document.createElement('h3');
            titel.textContent = gruppe.gruppe;
            liste.append(titel);
            for (const e of werkzeuge)
                eintrag(e.name, e.zeichen, () => e.tun());
        }
        Register.symbole.fuelle(liste);
        return liste;
    };
    return { oeffne, zeichnen, zuletzt, wege, werkzeugmenue };
})();
window.Elektrostart = Elektrostart;
if (typeof Register !== 'undefined' && Register.kontext) {
    Register.kontext.meldeLieferant('elektro', () => {
        const raus = [];
        try {
            let rang = 10;
            for (const g of (Register.menueband.inReiter('elektro') || [])) {
                for (const e of (g.eintraege || [])) {
                    raus.push({
                        bereich: 'elektro', id: String(e.id), name: String(e.name || e.id),
                        zeichen: String(e.zeichen || 'bolt'), rang: rang,
                        tun: () => { try {
                            e.tun();
                        }
                        catch { } }
                    });
                    rang += 10;
                }
            }
        }
        catch { }
        return raus;
    });
}
if (typeof Ereignisse !== 'undefined' && typeof Ereignisse.horche === 'function' && typeof ARTEN !== 'undefined') {
    Ereignisse.horche(ARTEN.frageElektroMenue, (daten) => {
        const d = daten;
        if (typeof d?.schliessen !== 'function' || typeof d?.planOeffnen !== 'function')
            return undefined;
        return Elektrostart.werkzeugmenue(d.schliessen, d.planOeffnen);
    });
}
