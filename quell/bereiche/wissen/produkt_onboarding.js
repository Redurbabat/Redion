"use strict";
/* ============================================================================
 * bereiche/wissen/produkt_onboarding.ts — Einstieg in zwei Redion-Welten
 * ----------------------------------------------------------------------------
 * Dieses Onboarding ordnet keine Seite um und kopiert keinen Inhalt. Es merkt
 * nur die bevorzugte Hauptwelt und ausgewählte Lebensbereiche. Fehlende
 * Bereichsdefinitionen werden erst beim ausdrücklichen Abschluss über den
 * vorhandenen `Lebensbereiche`-Kern angelegt.
 * ==========================================================================*/
const ProduktOnboarding = (() => {
    const META_KEY = 'produktOnboarding:v1';
    const BEREICHE = [
        {
            key: 'elektro', name: 'Elektro-Ausbildung', icon: '⚡', art: 'ausbildung',
            beschreibung: 'Lernstoff, Berichtsheft, Prüfungen und Fachpraxis zusammen ansehen.'
        },
        {
            key: 'uni', name: 'Uni', icon: '🎓', art: 'uni',
            beschreibung: 'Module, Vorlesungen, Abgaben und Literatur als eine Sicht.'
        },
        {
            key: 'arbeit', name: 'Arbeit', icon: '💼', art: 'arbeit',
            beschreibung: 'Projekte, Termine, Dokumente und Aufgaben im beruflichen Kontext.'
        },
        {
            key: 'privat', name: 'Privat', icon: '🏠', art: 'privat',
            beschreibung: 'Persönliche Vorhaben und Alltag getrennt filtern, ohne Daten zu kopieren.'
        }
    ];
    let laufend = null;
    let startLaeuft = null;
    const esc = (wert) => String(wert ?? '').replace(/[&<>"']/g, zeichen => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[zeichen] || zeichen));
    const text = (wert, max = 180) => String(wert ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
    const eindeutig = (werte, max = 64) => {
        const raus = [], gesehen = new Set();
        for (const wert of Array.isArray(werte) ? werte : []) {
            const id = text(wert);
            if (!id || gesehen.has(id))
                continue;
            gesehen.add(id);
            raus.push(id);
            if (raus.length >= max)
                break;
        }
        return raus;
    };
    const weltVon = (wert) => wert === 'lernen' || wert === 'workspace' || wert === 'beide' ? wert : 'beide';
    const aktorKey = () => {
        const konto = typeof Konten !== 'undefined' && typeof Konten.aktiv === 'function'
            ? Konten.aktiv() : null;
        const id = text(konto?.id, 160);
        return id ? 'konto:' + encodeURIComponent(id) : 'geraet:local';
    };
    const normalisiereProfil = (wert) => {
        const status = wert?.status === 'fertig' || wert?.status === 'uebersprungen'
            ? wert.status : 'neu';
        return {
            version: 1,
            status,
            welt: weltVon(wert?.welt),
            auswahl: eindeutig(wert?.auswahl, BEREICHE.length)
                .filter(key => BEREICHE.some(bereich => bereich.key === key)),
            bereichIds: eindeutig(wert?.bereichIds),
            updatedAt: text(wert?.updatedAt, 40)
        };
    };
    const metaLesen = () => {
        const roh = Store.getMeta(META_KEY, {});
        const profile = roh && typeof roh === 'object' && !Array.isArray(roh) &&
            roh.profile && typeof roh.profile === 'object' && !Array.isArray(roh.profile)
            ? roh.profile : {};
        return { version: 1, profile };
    };
    const profilLesen = () => normalisiereProfil(metaLesen().profile[aktorKey()]);
    const profilSchreiben = (profil) => {
        const meta = metaLesen();
        Store.setMeta(META_KEY, {
            version: 1,
            profile: { ...meta.profile, [aktorKey()]: normalisiereProfil(profil) }
        });
    };
    const rechteAktiv = () => typeof Konten !== 'undefined' && typeof Konten.darf === 'function';
    const darfBereicheAendern = () => {
        if (!rechteAktiv())
            return true;
        const pageId = typeof App !== 'undefined' && typeof App.aktuelleSeite === 'function'
            ? text(App.aktuelleSeite()) : '';
        /* Sonderansichten wie „Heute" haben absichtlich keine Seiten-ID. Dort
           gilt dieselbe globale Rechtefrage wie in `Lebensbereiche.anlegen`;
           ein vorhandener Seitenkontext schränkt sie weiterhin auf diese Seite
           ein. Beide Wege bleiben bei einem ablehnenden Kontenmodul fail-closed. */
        return pageId ? Konten.darf('bearbeiten', pageId) : Konten.darf('bearbeiten');
    };
    const bereichApi = () => {
        if (typeof Lebensbereiche !== 'undefined')
            return Lebensbereiche;
        return window.Lebensbereiche || null;
    };
    const vorhandeneBereiche = () => {
        const api = bereichApi();
        if (!api || typeof api.auflisten !== 'function')
            return [];
        try {
            const liste = api.auflisten();
            return Array.isArray(liste) ? liste : [];
        }
        catch {
            return [];
        }
    };
    const gefaltet = (wert) => text(wert, 100).toLocaleLowerCase('de-CH')
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const vorhandenFuer = (vorgabe, liste = vorhandeneBereiche()) => liste.find(bereich => gefaltet(bereich?.name) === gefaltet(vorgabe.name)) ||
        liste.find(bereich => text(bereich?.art, 40) === vorgabe.art) || null;
    const weltName = (welt) => welt === 'lernen' ? '🎓 Lernen & Alltag' : welt === 'workspace' ? '🧱 Workspace' : 'Beide Hauptwelten';
    const oeffnen = () => {
        if (laufend)
            return laufend;
        if (typeof document === 'undefined' || !document.body)
            return Promise.reject(new Error('Das Onboarding braucht ein geöffnetes Redion-Fenster.'));
        laufend = new Promise(resolve => {
            /* Der Stil kommt aus `quell/schale/stil/produktwelten.css` (E418).
               Hier stand ein `<style>`-Block mit 126 Zeilen, der bei Bedarf in die
               Seite gehaengt wurde — §39 sagt dazu einen Satz, und `test410` liest
               Stildateien, keine Zeichenketten im Quelltext. */
            const vorherFokus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const gespeichert = profilLesen();
            let schritt = 1;
            let welt = gespeichert.welt;
            let sichert = false;
            const bestehend = vorhandeneBereiche();
            const bekannteIds = new Set();
            BEREICHE.forEach(vorgabe => {
                const bereich = vorhandenFuer(vorgabe, bestehend);
                if (bereich?.id)
                    bekannteIds.add(text(bereich.id));
            });
            const fremdeBereichIds = gespeichert.bereichIds.filter(id => !bekannteIds.has(id));
            const auswahl = new Set(gespeichert.auswahl);
            if (!auswahl.size)
                BEREICHE.forEach(vorgabe => {
                    const bereich = vorhandenFuer(vorgabe, bestehend);
                    if (bereich?.id && gespeichert.bereichIds.includes(text(bereich.id)))
                        auswahl.add(vorgabe.key);
                });
            const lage = document.createElement('div');
            lage.className = 'produkt-onboarding-lage';
            lage.innerHTML =
                '<section class="produkt-onboarding" role="dialog" aria-modal="true" ' +
                    'aria-labelledby="produkt-onboarding-titel" aria-describedby="produkt-onboarding-beschreibung">' +
                    '<header class="produkt-onboarding-kopf">' +
                    '<span class="produkt-onboarding-marke" aria-hidden="true">R</span>' +
                    '<span class="produkt-onboarding-kopftext"><strong>Redion einrichten</strong>' +
                    '<span>Nur Ansichten und Vorlieben – deine Inhalte bleiben, wo sie sind.</span></span>' +
                    '<button class="produkt-onboarding-schliessen" type="button" data-po="skip" ' +
                    'aria-label="Onboarding überspringen und schließen">✕</button>' +
                    '</header>' +
                    '<ol class="produkt-onboarding-fortschritt" aria-label="Fortschritt">' +
                    '<li data-po-step="1">Hauptwelt</li><li data-po-step="2">Bereiche</li>' +
                    '<li data-po-step="3">Fertig</li>' +
                    '</ol>' +
                    '<main class="produkt-onboarding-inhalt"></main>' +
                    '<p class="produkt-onboarding-fehler" role="alert" aria-live="assertive"></p>' +
                    '<footer class="produkt-onboarding-fuss"></footer>' +
                    '</section>';
            document.body.appendChild(lage);
            const dialog = lage.querySelector('.produkt-onboarding');
            const inhalt = lage.querySelector('.produkt-onboarding-inhalt');
            const fuss = lage.querySelector('.produkt-onboarding-fuss');
            const fehler = lage.querySelector('.produkt-onboarding-fehler');
            const fokusierbar = () => [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
                .filter(element => element.offsetParent !== null);
            const beenden = (ergebnis) => {
                lage.remove();
                laufend = null;
                vorherFokus?.focus();
                resolve(ergebnis);
            };
            const ueberspringen = () => {
                if (sichert)
                    return;
                const profil = {
                    version: 1,
                    status: 'uebersprungen',
                    welt,
                    auswahl: [...auswahl],
                    bereichIds: gespeichert.bereichIds,
                    updatedAt: new Date().toISOString()
                };
                profilSchreiben(profil);
                beenden({ status: 'uebersprungen', welt, bereichIds: profil.bereichIds });
            };
            const fortschritt = () => {
                lage.querySelectorAll('[data-po-step]').forEach(element => {
                    const nummer = Number(element.dataset.poStep);
                    if (nummer === schritt)
                        element.setAttribute('aria-current', 'step');
                    else
                        element.removeAttribute('aria-current');
                    element.dataset.erreicht = nummer <= schritt ? 'ja' : 'nein';
                });
            };
            const fussZeichnen = () => {
                fuss.innerHTML =
                    '<button type="button" class="po-ueberspringen" data-po="skip">Überspringen</button>' +
                        (schritt > 1 ? '<button type="button" class="po-zurueck" data-po="back">Zurück</button>' : '') +
                        (schritt < 3
                            ? '<button type="button" class="po-weiter" data-po="next">Weiter</button>'
                            : '<button type="button" class="po-fertig" data-po="finish">Einrichtung abschließen</button>');
            };
            const schrittEins = () => {
                inhalt.innerHTML =
                    '<h1 id="produkt-onboarding-titel">Wie möchtest du Redion zuerst sehen?</h1>' +
                        '<p id="produkt-onboarding-beschreibung">Beide Welten arbeiten mit denselben Seiten, ' +
                        'Datenbanken und Dateien. Du legst nur deinen bevorzugten Einstieg fest.</p>' +
                        '<fieldset><legend>Bevorzugte Hauptwelt</legend><div class="produkt-onboarding-welten">' +
                        '<label class="produkt-onboarding-welt"><input type="radio" name="po-welt" value="beide"' +
                        (welt === 'beide' ? ' checked' : '') + '><span><b>🎓 + 🧱 Beide</b>' +
                        '<small>Lernen & Alltag und Workspace gleichwertig verwenden.</small></span></label>' +
                        '<label class="produkt-onboarding-welt"><input type="radio" name="po-welt" value="lernen"' +
                        (welt === 'lernen' ? ' checked' : '') + '><span><b>🎓 Lernen & Alltag</b>' +
                        '<small>Heute, Lernen, Aufgaben, Termine und Fortschritt stehen vorn.</small></span></label>' +
                        '<label class="produkt-onboarding-welt"><input type="radio" name="po-welt" value="workspace"' +
                        (welt === 'workspace' ? ' checked' : '') + '><span><b>🧱 Workspace</b>' +
                        '<small>Seiten, Dokumente, Datenbanken, PDFs und Whiteboards stehen vorn.</small></span></label>' +
                        '</div></fieldset>';
            };
            const schrittZwei = () => {
                const apiDa = !!bereichApi();
                const darf = darfBereicheAendern();
                const liste = vorhandeneBereiche();
                inhalt.innerHTML =
                    '<h1 id="produkt-onboarding-titel">Welche Lebensbereiche brauchst du?</h1>' +
                        '<p id="produkt-onboarding-beschreibung">Ein Inhalt darf später in mehreren Bereichen erscheinen. ' +
                        'Hier entstehen nur Filterbereiche – keine Seiten- oder Dateikopien.</p>' +
                        '<fieldset><legend>Bereiche auswählen</legend><div class="produkt-onboarding-bereiche">' +
                        BEREICHE.map(vorgabe => {
                            const vorhanden = vorhandenFuer(vorgabe, liste);
                            const gesperrt = !vorhanden && (!apiDa || !darf);
                            if (gesperrt)
                                auswahl.delete(vorgabe.key);
                            return '<label class="produkt-onboarding-bereich" data-gesperrt="' +
                                (gesperrt ? 'ja' : 'nein') + '">' +
                                '<span class="po-icon" aria-hidden="true">' + esc(vorgabe.icon) + '</span>' +
                                '<span><b>' + esc(vorgabe.name) + '</b><small>' + esc(vorgabe.beschreibung) +
                                (vorhanden ? ' Bereits vorhanden.' : gesperrt ? ' Keine Berechtigung zum Anlegen.' : '') +
                                '</small></span><input type="checkbox" data-po-area="' + esc(vorgabe.key) + '"' +
                                (auswahl.has(vorgabe.key) ? ' checked' : '') + (gesperrt ? ' disabled' : '') +
                                ' aria-label="' + esc(vorgabe.name) + ' auswählen"></label>';
                        }).join('') +
                        '</div></fieldset>' +
                        '<div class="produkt-onboarding-hinweis">Du ordnest noch keine bestehenden Inhalte zu. ' +
                        'Bereichszuordnungen geschehen später einzeln und ausdrücklich.</div>';
            };
            const schrittDrei = () => {
                const gewaehlt = BEREICHE.filter(vorgabe => auswahl.has(vorgabe.key));
                inhalt.innerHTML =
                    '<h1 id="produkt-onboarding-titel">Bereit für Redion</h1>' +
                        '<p id="produkt-onboarding-beschreibung">Prüfe deine Auswahl. Erst der Abschluss speichert ' +
                        'die Vorliebe und legt fehlende Bereichsdefinitionen an.</p>' +
                        '<ul class="produkt-onboarding-zusammenfassung">' +
                        '<li><span aria-hidden="true">◫</span><span><b>' + esc(weltName(welt)) + '</b>' +
                        '<small>Dein bevorzugter Einstieg; alle Daten bleiben gemeinsam.</small></span></li>' +
                        '<li><span aria-hidden="true">🏷</span><span><b>' +
                        (gewaehlt.length ? gewaehlt.map(vorgabe => esc(vorgabe.icon + ' ' + vorgabe.name)).join(', ') : 'Keine neuen Bereiche') +
                        '</b><small>' + (gewaehlt.length
                        ? 'Die Auswahl wird als Ansichtspräferenz gespeichert.'
                        : 'Du kannst Bereiche später jederzeit anlegen.') + '</small></span></li>' +
                        '<li><span aria-hidden="true">✓</span><span><b>Keine Inhaltsänderung</b>' +
                        '<small>Keine Seite, Aufgabe, Datei oder Lernkarte wird verschoben oder kopiert.</small></span></li>' +
                        '</ul>';
            };
            const zeichnen = () => {
                fehler.textContent = '';
                fortschritt();
                if (schritt === 1)
                    schrittEins();
                else if (schritt === 2)
                    schrittZwei();
                else
                    schrittDrei();
                fussZeichnen();
                inhalt.scrollTop = 0;
                const ziel = inhalt.querySelector('input:checked, input:not([disabled]), button') ||
                    fuss.querySelector('button');
                setTimeout(() => ziel?.focus(), 0);
            };
            const abschliessen = async () => {
                if (sichert)
                    return;
                sichert = true;
                dialog.querySelectorAll('button').forEach(button => { button.disabled = true; });
                fehler.textContent = '';
                try {
                    const api = bereichApi();
                    const liste = vorhandeneBereiche();
                    const ids = [...fremdeBereichIds];
                    for (const vorgabe of BEREICHE.filter(eintrag => auswahl.has(eintrag.key))) {
                        let bereich = vorhandenFuer(vorgabe, liste);
                        if (!bereich) {
                            if (!api || typeof api.anlegen !== 'function')
                                throw new Error('Der Bereichskern ist noch nicht geladen.');
                            if (!darfBereicheAendern())
                                throw new Error('Du darfst keine neuen Bereiche anlegen.');
                            bereich = api.anlegen({ name: vorgabe.name, icon: vorgabe.icon, art: vorgabe.art });
                            if (bereich)
                                liste.push(bereich);
                        }
                        const id = text(bereich?.id);
                        if (id && !ids.includes(id))
                            ids.push(id);
                    }
                    const profil = {
                        version: 1,
                        status: 'fertig',
                        welt,
                        auswahl: [...auswahl],
                        bereichIds: eindeutig(ids),
                        updatedAt: new Date().toISOString()
                    };
                    profilSchreiben(profil);
                    /* DIE WELT IST EIN EINSTIEG, KEINE STARTANSICHT (E349). Hier stand
                       `startAnsicht` = 'workspace' bzw. 'start' — ungefragt, und damit
                       sah, wer das Onboarding durchlief, nie mehr seine PDF beim Start,
                       egal was E236 versprach. Der Start zeigt, wo man war; die Welt
                       steht im Profil und in der Seitenleiste. */
                    beenden({ status: 'fertig', welt, bereichIds: profil.bereichIds });
                    /* Die Auswahl ist ein bevorzugter Einstieg, keine neue Datenwelt.
                       Nach dem Schliessen wird deshalb nur die gewünschte Sicht
                       geöffnet; alle Objekte darunter bleiben dieselben. */
                    setTimeout(() => {
                        const produkt = globalThis.Produktwelten;
                        if (welt === 'workspace')
                            produkt?.workspace?.('start');
                        else if (welt === 'lernen')
                            produkt?.lernen?.('heute');
                    }, 0);
                }
                catch (grund) {
                    sichert = false;
                    dialog.querySelectorAll('button').forEach(button => { button.disabled = false; });
                    fehler.textContent = grund instanceof Error ? grund.message : 'Die Einrichtung konnte nicht gespeichert werden.';
                    fuss.querySelector('[data-po="finish"]')?.focus();
                }
            };
            lage.addEventListener('change', ereignis => {
                const element = ereignis.target instanceof HTMLInputElement ? ereignis.target : null;
                if (!element)
                    return;
                if (element.name === 'po-welt')
                    welt = weltVon(element.value);
                const key = text(element.dataset.poArea, 40);
                if (key) {
                    if (element.checked)
                        auswahl.add(key);
                    else
                        auswahl.delete(key);
                }
            });
            lage.addEventListener('click', ereignis => {
                const element = ereignis.target instanceof Element
                    ? ereignis.target.closest('[data-po]') : null;
                const aktion = element?.dataset.po;
                if (aktion === 'skip') {
                    ueberspringen();
                    return;
                }
                if (aktion === 'back' && schritt > 1) {
                    schritt--;
                    zeichnen();
                    return;
                }
                if (aktion === 'next' && schritt < 3) {
                    schritt++;
                    zeichnen();
                    return;
                }
                if (aktion === 'finish')
                    void abschliessen();
            });
            lage.addEventListener('keydown', ereignis => {
                if (ereignis.key === 'Escape') {
                    ereignis.preventDefault();
                    ueberspringen();
                    return;
                }
                if (ereignis.key !== 'Tab')
                    return;
                const elemente = fokusierbar();
                if (!elemente.length) {
                    ereignis.preventDefault();
                    dialog.focus();
                    return;
                }
                const erstes = elemente[0];
                const letztes = elemente[elemente.length - 1];
                if (ereignis.shiftKey && document.activeElement === erstes) {
                    ereignis.preventDefault();
                    letztes.focus();
                }
                else if (!ereignis.shiftKey && document.activeElement === letztes) {
                    ereignis.preventDefault();
                    erstes.focus();
                }
            });
            zeichnen();
        });
        return laufend;
    };
    /** Startet höchstens einmal gleichzeitig und schreibt beim Start nichts. */
    const vielleichtStarten = () => {
        if (startLaeuft)
            return startLaeuft;
        startLaeuft = (async () => {
            if (profilLesen().status !== 'neu')
                return false;
            if (typeof document === 'undefined')
                return false;
            if (!document.body)
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', () => resolve(), { once: true }));
            if (profilLesen().status !== 'neu')
                return false;
            void oeffnen();
            return true;
        })().finally(() => { startLaeuft = null; });
        return startLaeuft;
    };
    /** Löscht nur die persönliche Onboarding-Präferenz, niemals Bereiche/Inhalte. */
    const zuruecksetzen = () => {
        const meta = metaLesen();
        const profile = { ...meta.profile };
        delete profile[aktorKey()];
        Store.setMeta(META_KEY, { version: 1, profile });
    };
    return { vielleichtStarten, oeffnen, zuruecksetzen, profil: profilLesen };
})();
window.ProduktOnboarding = ProduktOnboarding;
