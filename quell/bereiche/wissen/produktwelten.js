"use strict";
/* ============================================================================
 * bereiche/wissen/produktwelten.ts — zwei Oberflächen, ein Datenbestand
 * ----------------------------------------------------------------------------
 * Dieser kleine Lotse besitzt bewusst keine Seiten, Karten oder Aufgaben.
 * Er merkt nur, in welcher Produktwelt man arbeitet, markiert die gemeinsame
 * Navigation und reicht den Aufruf an Lernwelt, Arbeitswelt oder die bereits
 * vorhandenen Ansichten weiter. So kann dasselbe Objekt in mehreren Sichten
 * auftauchen, ohne kopiert zu werden.
 * ==========================================================================*/
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
        /* DEN GLIEDERUNGSSTREIFEN WEGNEHMEN. Er gehört zur zuletzt geöffneten
           Seite und hängt an `#main`; eine Produktwelt legt sich darüber, ohne
           ihn anzufassen. Gemessen am 25. August in der Bibliothek: vier Striche
           am rechten Rand, die zu „Willkommen in Redion" gehörten. Ein Klick
           darauf sprang zu einem Block, der gar nicht gezeichnet war — also
           nichts. `streifenZeichnen` baut ihn beim nächsten Seitenaufruf neu
           (`inhaltsflaeche.ts`), hier reicht das Wegnehmen. */
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
        catch { /* Die Ansicht funktioniert auch ohne die Navigationsschale. */ }
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
            ? new Set(['heute', 'lernen', 'lernweg', 'fehler', 'pruefungen', 'schule', 'uni', 'arbeit', 'fortschritt'])
            : new Set(['uebersicht', 'bibliothek', 'aufgaben', 'kalender', 'datenbanken',
                'whiteboards', 'wiki', 'vorlagen']);
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
        /* Rückfall für alte Einzeldateien, in denen das neue Modul noch fehlt. */
        if (ansicht === 'heute' && typeof Ansichten !== 'undefined')
            Ansichten.start();
        else if (typeof Learning !== 'undefined')
            Learning.open();
        routeSchreiben('lernen', ziel);
    };
    const workspace = (ansicht = 'start') => {
        const ziel = ansicht === 'start' || ansicht === 'seiten' ? 'uebersicht' : ansicht;
        weltSetzen('workspace');
        Store.setMeta(ARBEIT_META, ziel);
        reiterSetzen('workspace');
        const modul = arbeitsmodul();
        if (modul?.oeffnen) {
            modul.oeffnen(ziel);
            routeSchreiben('workspace', ziel);
            return;
        }
        if (modul?.open) {
            modul.open(ziel);
            routeSchreiben('workspace', ziel);
            return;
        }
        if (ziel === 'bibliothek' && typeof Bibliothek !== 'undefined')
            Bibliothek.oeffne();
        else if (ziel === 'aufgaben' && typeof Bibliothek !== 'undefined')
            Bibliothek.aufgaben();
        else if (typeof Ansichten !== 'undefined')
            Ansichten.seiten();
        routeSchreiben('workspace', ziel);
    };
    const bibliothek = () => workspace('bibliothek');
    const aufgaben = () => workspace('aufgaben');
    /* DER KALENDER IST EIN ORT, KEIN DIALOG (E430). Die Ansicht gab es die
       ganze Zeit — `Arbeitsansicht` kennt `'kalender'`, `routeAusHash` lässt
       `#welt-workspace-kalender` zu, und die Arbeitswelt zeichnet die
       Chronologie aller Datumsfelder. Es fehlte nur die Tür: der
       Navigationseintrag „Kalender" rief `Kalender.dialog()`, und das ist der
       Verbindungsdialog für Google und CalDAV. */
    const kalender = () => workspace('kalender');
    const whiteboards = () => workspace('whiteboards');
    const planung = () => {
        weltSetzen('lernen');
        reiterSetzen('bespr');
        if (typeof Ansichten !== 'undefined')
            Ansichten.termine();
    };
    /** Mehrfachzuordnung für bestehende Objekte. Der Dialog schreibt nur die
        kleinen Bereichskennungen; Inhalt und Objektkennung bleiben dieselben. */
    const bereicheDialog = async (objekt) => {
        const api = globalThis.Lebensbereiche;
        if (!api || !objekt?.id) {
            UI.toast('Die Lebensbereiche sind in dieser Fassung noch nicht geladen.');
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
        const onboarding = document.createElement('button');
        onboarding.type = 'button';
        onboarding.dataset.aktion = 'onboarding';
        onboarding.textContent = 'Einrichtung öffnen';
        fuss.append(neu, onboarding);
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
                if (ziel.dataset.aktion === 'onboarding') {
                    overlay.remove();
                    const modul = globalThis.ProduktOnboarding;
                    if (modul?.oeffnen)
                        modul.oeffnen();
                    else
                        UI.toast('Die Einrichtung ist in dieser Fassung noch nicht geladen.');
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
        /* DER DRITTE WERT IST DIE KURZFORM AM TELEFON, und „Workspace" ist keine
           (E137). Gemessen bei 390 px: vier von fünf Pillen liefen über den Rand
           — „Workspace" um 78 px, „Heute" um 41. §30 des Auftrags verlangt
           ausdrücklich, dass am iPhone nichts überläuft, und test114 misst es
           Breite für Breite.
           Der lange Name bleibt als Titel stehen; auf der Pille steht das kurze
           Wort, das Redion schon vorher benutzt hat. */
        mobileBeschriftung('hl-start', 'Heute', 'Heute');
        mobileBeschriftung('hl-lernen', 'Lernen & Alltag', 'Lernen');
        /* SEIT E236 GIBT ES `hl-seiten` NICHT MEHR — der Workspace steht im
           Mehr-Blatt unter „Wo du arbeitest". Die Zeile hier wäre eine Anweisung
           an einen Knopf, den niemand mehr baut.
           Und aus „Plan" wurde wieder „Termine": die Kurzform stammt aus der
           Zeit der waagerechten Pillen, wo Zeichen und Wort NEBENEINANDER
           standen und vier von fünf Namen überliefen (E137). Unten stehen sie
           übereinander, jeder Weg hat 78 px — „Termine" braucht bei 10.5 px
           rund 48. Der kurze Name kostete Deutlichkeit, die es nicht mehr zu
           sparen gibt. */
        mobileBeschriftung('hl-bespr', 'Planung und Termine', 'Termine');
        if (gestartet)
            return;
        gestartet = true;
        /* HIER STAND DER ZUHÖRER AM `weltwechsel` — bis E280 (L86).
           Den Umschalter gibt es seit E206 nicht mehr: `index.html` erklärt in
           einem eigenen Absatz, warum er wegfiel („ein dritter Weg zu zwei
           Orten, ganz oben, in der auffälligsten Zeile"). Der Zuhörer blieb
           und hing an nichts — `element('weltwechsel')` gab seither `null`,
           und `?.` schluckte es still.
           `Produktwelten.markieren()` läuft weiter über `[data-welt]`; findet
           es keins, geht `forEach` über eine leere Liste. Das war schon in
           E206 die ganze Rechnung. */
    };
    return {
        start, aktiv, markieren, wechseln: weltSetzen, zurAktivenWelt,
        lernen, workspace, bibliothek, aufgaben, kalender, whiteboards, planung, bereicheDialog,
        routeAusHash, routeOeffnen
    };
})();
window.Produktwelten = Produktwelten;
