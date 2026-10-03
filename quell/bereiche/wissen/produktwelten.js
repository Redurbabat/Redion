"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/produktwelten.ts (npm run bauen:ts). */
const Produktwelten = (() => {
    const WELT_META = 'produkt:welt';
    const LERN_META = 'produkt:lernansicht';
    const ARBEIT_META = 'produkt:arbeitsansicht';
    const sichereWelt = (wert) => wert === 'workspace' ? 'workspace' : 'lernen';
    const aktiv = () => sichereWelt(Store.getMeta(WELT_META, 'lernen'));
    const element = (id) => document.getElementById(id);
    const mobileBeschriftung = (id, titel, kurz) => {
        const knopf = element(id);
        if (!knopf)
            return;
        knopf.title = titel;
        const text = knopf.querySelector('b');
        if (text)
            text.textContent = kurz;
    };
    const markieren = (welt = aktiv()) => {
        document.body.dataset.produktwelt = welt;
        document.querySelectorAll('[data-welt]').forEach(knopf => {
            const an = knopf.dataset.welt === welt;
            knopf.classList.toggle('an', an);
            knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
        });
    };
    const weltSetzen = (welt) => {
        document.getElementById('rand-toc')?.remove();
        Store.setMeta(WELT_META, welt);
        markieren(welt);
        document.dispatchEvent(new CustomEvent('redion:produktwelt', { detail: { welt } }));
    };
    const reiterSetzen = (id) => {
        try {
            if (typeof Seitenleiste !== 'undefined' && Seitenleiste.reiter) {
                Seitenleiste.reiter(id);
                Seitenleiste.zeichne?.();
                Seitenleiste.handyLeiste?.();
            }
        }
        catch { }
    };
    const lernmodul = () => globalThis.Lernwelt;
    const arbeitsmodul = () => globalThis.Arbeitswelt;
    const routeSchreiben = (welt, ansicht) => {
        const route = '#welt-' + welt + '-' + ansicht.replace(/[^a-z0-9-]/g, '');
        try {
            history.replaceState(history.state, '', location.pathname + location.search + route);
        }
        catch {
            location.hash = route;
        }
    };
    const routeAusHash = (hash = location.hash) => {
        const treffer = /^#welt-(lernen|workspace)-([a-z0-9-]+)$/.exec(String(hash || '').toLowerCase());
        if (!treffer)
            return null;
        const welt = sichereWelt(treffer[1]);
        const erlaubte = welt === 'lernen'
            ? new Set(['heute', 'lernen', 'lernweg', 'fehler', 'pruefungen', 'schule', 'uni', 'arbeit', 'fortschritt', 'trainer'])
            : new Set(['start', 'seiten', 'dateien', 'projekte', 'uebersicht', 'bibliothek',
                'aufgaben', 'kalender', 'datenbanken', 'whiteboards', 'wiki', 'vorlagen']);
        return erlaubte.has(treffer[2]) ? { welt, ansicht: treffer[2] } : null;
    };
    const lernen = (ansicht = 'heute') => {
        const ziel = ansicht === 'pfad' ? 'lernweg'
            : ansicht === 'ausbildung' ? 'schule' : ansicht;
        weltSetzen('lernen');
        Store.setMeta(LERN_META, ziel);
        reiterSetzen(ziel === 'heute' ? 'start' : 'lernen');
        const modul = lernmodul();
        if (modul?.oeffnen) {
            modul.oeffnen(ziel);
            routeSchreiben('lernen', ziel);
            return;
        }
        if (modul?.open) {
            modul.open(ziel);
            routeSchreiben('lernen', ziel);
            return;
        }
        if (ansicht === 'heute' && typeof Ansichten !== 'undefined')
            Ansichten.start();
        else if (typeof Learning !== 'undefined')
            Learning.open();
        routeSchreiben('lernen', ziel);
    };
    const workspace = (ansicht = 'start') => {
        const ziel = ansicht === 'start' || ansicht === 'seiten' || ansicht === 'projekte'
            ? 'uebersicht' : ansicht === 'dateien' ? 'bibliothek' : ansicht;
        weltSetzen('workspace');
        Store.setMeta(ARBEIT_META, ziel);
        reiterSetzen(ziel === 'aufgaben' ? 'aufgaben' : ziel === 'kalender' ? 'kalender' : 'bibliothek');
        const modul = arbeitsmodul();
        if (modul?.oeffnen) {
            modul.oeffnen(ziel);
            return;
        }
        if (modul?.open) {
            modul.open(ziel);
            return;
        }
        if (ziel === 'bibliothek' && typeof Bibliothek !== 'undefined')
            Bibliothek.oeffne();
        else if (ziel === 'aufgaben' && typeof Bibliothek !== 'undefined')
            Bibliothek.aufgaben();
        else if (typeof Ansichten !== 'undefined')
            Ansichten.seiten();
    };
    const bibliothek = () => {
        weltSetzen('workspace');
        reiterSetzen('bibliothek');
        if (typeof Bibliothek !== 'undefined')
            Bibliothek.oeffne();
    };
    const aufgaben = () => workspace('aufgaben');
    const kalender = () => {
        const modul = arbeitsmodul();
        if (modul?.kalenderOeffnen && modul.kalenderOeffnen())
            return;
        workspace('kalender');
    };
    const whiteboards = () => workspace('whiteboards');
    const planung = () => {
        weltSetzen('lernen');
        reiterSetzen('bespr');
        if (typeof Ansichten !== 'undefined')
            Ansichten.termine();
    };
    const bereicheDialog = async (objekt) => {
        const api = globalThis.Lebensbereiche;
        if (!api) {
            UI.toast('Die Lebensbereiche sind in dieser Fassung noch nicht geladen.');
            return;
        }
        if (!objekt?.id) {
            UI.toast('Dafür braucht es eine Seite oder einen Block.');
            return;
        }
        const ref = { art: objekt.type === 'page' ? 'page' : 'block', id: String(objekt.id) };
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        const dialog = document.createElement('section');
        dialog.className = 'finder produkt-bereiche-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'produkt-bereiche-titel');
        const kopf = document.createElement('div');
        kopf.className = 'fh';
        const titel = document.createElement('b');
        titel.id = 'produkt-bereiche-titel';
        titel.textContent = 'Lebensbereiche';
        const schliessen = document.createElement('button');
        schliessen.className = 'icon-btn';
        schliessen.type = 'button';
        schliessen.title = 'Schliessen';
        schliessen.textContent = '✕';
        kopf.append(titel, schliessen);
        const erklaerung = document.createElement('p');
        erklaerung.className = 'produkt-bereiche-hinweis';
        erklaerung.textContent = 'Dasselbe Objekt darf in mehreren Bereichen erscheinen. Es wird dabei nicht kopiert.';
        const liste = document.createElement('div');
        liste.className = 'produkt-bereiche-liste';
        const fuss = document.createElement('div');
        fuss.className = 'produkt-bereiche-fuss';
        const neu = document.createElement('button');
        neu.type = 'button';
        neu.dataset.aktion = 'neu';
        neu.textContent = '＋ Bereich anlegen';
        fuss.append(neu);
        dialog.append(kopf, erklaerung, liste, fuss);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        const zeichnen = async () => {
            const alle = api.auflisten();
            const direkt = new Set(api.direkteBereichIds(objekt));
            const wirksam = new Set((await api.bereicheVon(ref)).map((b) => String(b.id)));
            liste.replaceChildren();
            if (!alle.length) {
                const leer = document.createElement('div');
                leer.className = 'produkt-bereiche-leer';
                leer.textContent = 'Noch keine Bereiche. Starte die Einrichtung oder lege einen eigenen Bereich an.';
                liste.appendChild(leer);
                return;
            }
            alle.forEach((bereich) => {
                const knopf = document.createElement('button');
                knopf.type = 'button';
                knopf.dataset.bereich = String(bereich.id);
                knopf.setAttribute('role', 'checkbox');
                knopf.setAttribute('aria-checked', direkt.has(String(bereich.id)) ? 'true' : 'false');
                const zeichen = document.createElement('span');
                zeichen.textContent = String(bereich.icon || '◉');
                const name = document.createElement('b');
                name.textContent = String(bereich.name || 'Bereich');
                const stand = document.createElement('span');
                stand.className = 'produkt-bereiche-stand';
                stand.textContent = direkt.has(String(bereich.id)) ? '✓ direkt'
                    : wirksam.has(String(bereich.id)) ? 'übergeordnet' : '';
                knopf.append(zeichen, name, stand);
                liste.appendChild(knopf);
            });
        };
        schliessen.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('mousedown', ereignis => {
            if (ereignis.target === overlay)
                overlay.remove();
        });
        dialog.addEventListener('click', async (ereignis) => {
            const ziel = ereignis.target instanceof Element
                ? ereignis.target.closest('[data-bereich],[data-aktion]') : null;
            if (!ziel)
                return;
            try {
                if (ziel.dataset.bereich) {
                    const direkt = new Set(api.direkteBereichIds(objekt));
                    if (direkt.has(ziel.dataset.bereich))
                        await api.entfernen(ref, ziel.dataset.bereich);
                    else
                        await api.zuordnen(ref, ziel.dataset.bereich);
                    await zeichnen();
                    App.zeichneBaum?.();
                    return;
                }
                if (ziel.dataset.aktion === 'neu') {
                    const name = await UI.frage('Name des neuen Bereichs', '');
                    if (!String(name || '').trim())
                        return;
                    await api.anlegen({ name: String(name).trim(), icon: '◉', art: 'frei' });
                    await zeichnen();
                }
            }
            catch (fehler) {
                UI.banner(fehler instanceof Error ? fehler.message : String(fehler), 'fehler');
            }
        });
        await zeichnen();
        schliessen.focus();
    };
    const zurAktivenWelt = () => {
        if (aktiv() === 'workspace')
            workspace(String(Store.getMeta(ARBEIT_META, 'start')));
        else
            lernen(String(Store.getMeta(LERN_META, 'heute')));
    };
    const routeOeffnen = (route = routeAusHash()) => {
        if (!route)
            return false;
        if (route.welt === 'workspace')
            workspace(route.ansicht);
        else
            lernen(route.ansicht);
        return true;
    };
    let gestartet = false;
    const start = () => {
        markieren();
        const startReiter = document.querySelector('#side-reiter [data-reiter="start"]');
        if (startReiter) {
            startReiter.title = 'Heute';
            const name = startReiter.querySelector('b');
            if (name)
                name.textContent = 'Heute';
        }
        mobileBeschriftung('hl-start', 'Heute', 'Heute');
        mobileBeschriftung('hl-lernen', 'Lernen & Alltag', 'Lernen');
        mobileBeschriftung('hl-bespr', 'Planung und Termine', 'Termine');
        if (gestartet)
            return;
        gestartet = true;
    };
    return {
        start, aktiv, markieren, wechseln: weltSetzen, zurAktivenWelt,
        lernen, workspace, bibliothek, aufgaben, kalender, whiteboards, planung, bereicheDialog,
        routeAusHash, routeOeffnen
    };
})();
window.Produktwelten = Produktwelten;
