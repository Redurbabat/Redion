"use strict";
/* ============================================================================
 * schale/ueberlagerung/menue.js — Menüs und Kontextmenüs
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/menue.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/ueberlagerung/menue.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Zwei Sorten: das schlichte Menü und das mit Suchfeld. Der Unterschied ist
 * keine Geschmacksfrage — ab etwa fünfzehn Einträgen liest niemand mehr,
 * sondern sucht.
 *
 * Beide sorgen selbst dafür, dass sie ins Bild passen: ein Menü, das unten
 * aus dem Fenster ragt, klappt nach oben. Das klingt nach einer Kleinigkeit
 * und ist der Unterschied zwischen „geht" und „geht am Laptop nicht".
 *
 * Stammt aus der Schale; dort lag es zwischen 2800 Zeilen Anwendungslogik.
 * ==========================================================================*/
const Menue = (() => {
    /** Auf dem Telefon werden aus Menüs Blätter, die von unten hochfahren. */
    const amTelefon = () => typeof AppEinstellung !== 'undefined'
        ? AppEinstellung.amTelefon()
        : innerWidth <= 760 ||
            ((window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) &&
                innerHeight <= 500);
    /**
     * Ein Menü öffnen. `opt.titel` ist die Überschrift des Blattes auf dem
     * Telefon — am Rechner gibt es keine, weil das Menü dort beim Zeiger steht
     * und nicht erklärt werden muss.
     */
    const menu = (html, x, y, opt = {}) => {
        document.querySelectorAll('.menu, .menu-grund').forEach(m => m.remove());
        const m = document.createElement('div');
        m.className = 'menu';
        m.innerHTML = html;
        let grund = null;
        const schliessen = () => {
            m.remove();
            grund?.remove();
        };
        const escape = (e) => {
            if (e.key !== 'Escape' || !m.isConnected)
                return;
            e.preventDefault();
            e.stopPropagation();
            schliessen();
        };
        document.addEventListener('keydown', escape, true);
        /* Aufrufer entfernen ein Menü gewöhnlich selbst. Dann dürfen weder der
           Escape-Zuhörer noch der mobile Grund zurückbleiben. */
        const waechter = new MutationObserver(() => {
            if (m.isConnected)
                return;
            grund?.remove();
            document.removeEventListener('keydown', escape, true);
            waechter.disconnect();
        });
        if (amTelefon()) {
            /* Blatt von unten — genau wie in Notions Telefon-App */
            m.classList.add('blatt');
            m.setAttribute('aria-label', (opt.titel || 'Menü').slice(0, 80));
            const griff = document.createElement('div');
            griff.className = 'blatt-griff';
            griff.setAttribute('aria-hidden', 'true');
            m.prepend(griff);
            if (opt.titel) {
                const titel = document.createElement('div');
                titel.className = 'blatt-titel';
                titel.textContent = opt.titel; /* kein Nutzertext als HTML */
                griff.after(titel);
            }
            /* Auch ein schlichtes, langes Menü braucht einen eigenen Rollbereich.
               Vorher rollte nur die Suchvariante; Primäraktionen konnten unter der
               Blattkante verschwinden. */
            let liste = m.querySelector(':scope > .menu-liste');
            if (!liste) {
                liste = document.createElement('div');
                liste.className = 'menu-liste menu-liste-ohne-suche';
                [...m.childNodes].filter(n => n !== griff &&
                    (!(n instanceof HTMLElement) || !n.classList.contains('blatt-titel')))
                    .forEach(n => liste.appendChild(n));
                m.appendChild(liste);
            }
            grund = document.createElement('div');
            grund.className = 'menu-grund';
            grund.setAttribute('aria-hidden', 'true');
            grund.addEventListener('click', schliessen);
            document.body.appendChild(grund);
            document.body.appendChild(m);
            /* Fast alle Aufrufer schliessen ihr Menü nach einer Aktion mit
               `menu.remove()` — vom Grund wissen sie nichts, den gibt es nur am
               Telefon. Er blieb dann als unsichtbare dunkle Wand stehen und
               frass genau einen Tipp. Der Wächter nimmt ihn mit, sobald das
               Menü aus dem Baum verschwindet — egal, wer es entfernt hat. */
            waechter.observe(document.body, { childList: true });
            /* Nach unten wischen schliesst es */
            let start = null;
            /* `touches[0]` ist bei einem `touchstart` immer da — aber der Typ sagt
               es nicht, und eine Wischgeste, die auf `undefined` zugreift, wäre ein
               Fehler mitten in einer Berührung. Fehlt der Finger, passiert nichts. */
            m.addEventListener('touchstart', e => {
                const f = e.touches[0];
                const ziel = e.target instanceof Element ? e.target : null;
                start = f && ziel?.closest('.blatt-griff, .blatt-titel') ? f.clientY : null;
            }, { passive: true });
            m.addEventListener('touchend', e => {
                const f = e.changedTouches[0];
                if (!f || start === null)
                    return;
                const weg = f.clientY - start;
                start = null;
                if (weg > 90 && (liste?.scrollTop || 0) <= 0)
                    schliessen();
            });
            /* Einträge in Karten gruppieren — iOS-Art, wie in Notions App:
               was zwischen zwei Trennlinien steht, kommt in eine Karte. */
            const ziel = liste;
            const kinder = [...ziel.children];
            let karte = null;
            kinder.forEach(el => {
                if (el.tagName === 'HR') {
                    karte = null;
                    el.remove();
                    return;
                }
                if (el.classList.contains('grp') || el.classList.contains('menu-fuss') ||
                    el.classList.contains('menu-suche') || el.classList.contains('av-karte') ||
                    el.classList.contains('av-besch') || el.classList.contains('sp-kopf')) {
                    karte = null;
                    return;
                }
                if (!karte) {
                    karte = document.createElement('div');
                    karte.className = 'blatt-karte';
                    ziel.insertBefore(karte, el);
                }
                karte.appendChild(el);
            });
            /* Löschen ist rot — genau wie bei Notion */
            m.querySelectorAll('[data-a="del"], [data-a="purge"]').forEach(x => x.classList.add('rot'));
            requestAnimationFrame(() => m.classList.add('auf'));
            return m;
        }
        document.body.appendChild(m);
        waechter.observe(document.body, { childList: true });
        /* Nicht über den Rand hinausragen lassen */
        const r = m.getBoundingClientRect();
        m.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + 'px';
        m.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + 'px';
        setTimeout(() => {
            const zu = (e) => {
                const ziel = e.target instanceof Node ? e.target : null;
                if (!ziel || !m.contains(ziel)) {
                    m.remove();
                    document.removeEventListener('mousedown', zu);
                }
            };
            document.addEventListener('mousedown', zu);
        }, 0);
        return m;
    };
    /**
     * Ein Menü mit Suchfeld und Fusszeile — das Muster, das in Notion in
     * fast jedem grösseren Menü steckt („Aktionen filtern…", „Suchaktionen…").
     * Getippt wird sofort gefiltert; Pfeiltasten und Enter wählen aus.
     *
     * `opt`: `platzhalter`, `fuss`, `kopf`, `breite` — und `titel` wird an
     * `menu` durchgereicht, für das Blatt am Telefon.
     */
    const menuMitSuche = (html, x, y, opt = {}) => {
        const m = menu((opt.kopf || '') +
            `<div class="menu-suche"><input placeholder="${opt.platzhalter || 'Filtern …'}" ` +
            'autocomplete="off" spellcheck="false"></div>' +
            '<div class="menu-liste">' + html + '</div>' +
            (opt.fuss ? '<div class="menu-fuss">' + opt.fuss + '</div>' : ''), x, y, opt.titel === undefined ? {} : { titel: opt.titel });
        if (opt.breite && !m.classList.contains('blatt'))
            m.style.width = String(opt.breite);
        const feld = m.querySelector('.menu-suche input');
        const liste = m.querySelector('.menu-liste');
        /* Beides steht in der Zeichenkette oben — aber `querySelector` weiss das
           nicht, und ein Menü ohne Suchfeld wäre ein Menü ohne Suche und nicht
           ein Absturz. */
        if (!feld || !liste)
            return m;
        const sichtbare = () => [...liste.querySelectorAll('button')]
            .filter(b => b.offsetParent !== null || b.style.display !== 'none')
            .filter(b => b.style.display !== 'none' &&
            (!(b.parentElement instanceof HTMLElement) ||
                !b.parentElement.style.display ||
                b.parentElement.style.display !== 'none'));
        const markiere = (b) => {
            liste.querySelectorAll('button.jetzt').forEach(x2 => x2.classList.remove('jetzt'));
            if (!b)
                return;
            b.classList.add('jetzt');
            b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        };
        /* Der Filter kennt die Form des Menüs nicht: Knöpfe können direkt
           darinliegen oder in einem Gitter stecken. Deshalb wird nach Knöpfen
           gesucht, nicht nach einer bestimmten Verschachtelung. */
        const filtern = () => {
            const q = feld.value.trim().toLowerCase();
            let gruppe = null, inGruppe = 0;
            const abschliessen = () => {
                if (gruppe && !inGruppe)
                    gruppe.style.display = 'none';
            };
            [...liste.children].forEach(kind => {
                if (!(kind instanceof HTMLElement))
                    return;
                const el = kind;
                if (el.classList.contains('grp')) {
                    abschliessen();
                    gruppe = el;
                    inGruppe = 0;
                    el.style.display = '';
                    return;
                }
                if (el.tagName === 'HR') {
                    el.style.display = q ? 'none' : '';
                    return;
                }
                const knoepfe = el.tagName === 'BUTTON'
                    ? [el] : [...el.querySelectorAll('button')];
                if (!knoepfe.length)
                    return;
                let sichtbar = 0;
                knoepfe.forEach(b => {
                    const treffer = !q || (b.textContent || '').toLowerCase().includes(q);
                    b.style.display = treffer ? '' : 'none';
                    if (treffer)
                        sichtbar++;
                });
                if (el.tagName !== 'BUTTON')
                    el.style.display = sichtbar ? '' : 'none';
                inGruppe += sichtbar;
            });
            abschliessen();
            markiere(sichtbare()[0]);
        };
        feld.addEventListener('input', filtern);
        feld.addEventListener('keydown', e => {
            const alle = sichtbare();
            const i = alle.findIndex(b => b.classList.contains('jetzt'));
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                markiere(alle[Math.min(i + 1, alle.length - 1)]);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                markiere(alle[Math.max(i - 1, 0)]);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                (alle[i] || alle[0])?.click();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                m.remove();
            }
        });
        liste.addEventListener('mousemove', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            const b = ziel?.closest('button');
            if (b && !b.classList.contains('jetzt'))
                markiere(b);
        });
        markiere(sichtbare()[0]);
        setTimeout(() => feld.focus(), 30);
        return m;
    };
    /* ------------------------------------------------------------------------
     * EIN ÜBERBLEIBSEL, das `noUnusedLocals` gefunden hat.
     *
     * Hier standen `let toastTimer = null;` und darunter der Kommentarblock zu
     * `toast(text, dauer)` — ohne die Funktion. Die ist beim Aufteilen nach
     * `hinweis.js` gewandert; der Zähler und die Beschreibung blieben zurück.
     *
     * Das ist die unangenehmere Sorte toter Code: nicht ein ungenutztes Stück
     * Logik, sondern eine BESCHREIBUNG von etwas, das hier nicht mehr ist. Wer
     * die Datei liest, sucht danach.
     * ----------------------------------------------------------------------*/
    return { menu, menuMitSuche, amTelefon };
})();
window.Menue = Menue;
