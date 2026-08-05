"use strict";
/* ============================================================================
 * apps/kontakte/erwaehnungen/ansicht.js — aus notion.js herausgelöst
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/erwaehnungen/ansicht/menue.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/erwaehnungen/ansicht/menue.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js. Der Inhalt ist unverändert;
 * nur der Ort ist jetzt der, an dem man ihn sucht.
 * ==========================================================================*/
const Erwaehnung = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const EMOJIS = [
        ['😀', 'lachen freude'], ['😃', 'lachen'], ['😄', 'lachen'], ['😁', 'grinsen'], ['😅', 'schwitzen lachen'],
        ['😂', 'tränen lachen'], ['🙂', 'lächeln'], ['😉', 'zwinkern'], ['😊', 'freundlich'], ['😍', 'verliebt'],
        ['🤔', 'denken überlegen'], ['🤨', 'skeptisch'], ['😐', 'neutral'], ['😴', 'schlafen müde'], ['😎', 'cool sonnenbrille'],
        ['😢', 'traurig weinen'], ['😡', 'wütend ärger'], ['🥳', 'feiern party'], ['🤯', 'kopf explodiert'], ['🙏', 'danke bitte'],
        ['👍', 'daumen gut ok'], ['👎', 'daumen schlecht'], ['👏', 'applaus klatschen'], ['🙌', 'jubel'], ['💪', 'stark kraft'],
        ['✍️', 'schreiben'], ['👀', 'augen schauen'], ['🧠', 'gehirn denken'], ['❤️', 'herz liebe'], ['🔥', 'feuer heiss'],
        ['⭐', 'stern favorit'], ['🌟', 'stern glanz'], ['✨', 'funkeln ki'], ['⚡', 'blitz schnell'], ['💡', 'idee lampe'],
        ['🎯', 'ziel treffer'], ['🏆', 'pokal gewinn'], ['🥇', 'gold erster'], ['🚀', 'rakete start'], ['🛠', 'werkzeug'],
        ['⚙️', 'einstellungen zahnrad'], ['🔧', 'schraubenschlüssel'], ['🔩', 'schraube'], ['🧩', 'puzzle vorlage'], ['🎨', 'kunst farbe'],
        ['📌', 'pin merken'], ['📍', 'ort'], ['📎', 'büroklammer anhang'], ['🔗', 'link kette'], ['🔒', 'schloss sperre'],
        ['🔓', 'offen'], ['🔑', 'schlüssel'], ['🗝', 'schlüssel alt'], ['🛡', 'schutz sicherheit'], ['⏰', 'wecker erinnerung'],
        ['⏳', 'sanduhr warten'], ['📅', 'kalender datum'], ['📆', 'kalender'], ['🗓', 'kalender monat'], ['🕐', 'uhr zeit'],
        ['📄', 'seite dokument'], ['📃', 'seite'], ['📑', 'lesezeichen seiten'], ['📋', 'zwischenablage liste'], ['📊', 'diagramm balken'],
        ['📈', 'wachstum steigend'], ['📉', 'fallend'], ['🗂', 'ordner register'], ['📁', 'ordner'], ['📂', 'ordner offen'],
        ['🗃', 'karteikasten'], ['🗄', 'aktenschrank'], ['📦', 'paket box'], ['📥', 'posteingang'], ['📤', 'postausgang'],
        ['✉️', 'brief mail'], ['📧', 'email'], ['📮', 'briefkasten'], ['📝', 'notiz schreiben'], ['✏️', 'stift'],
        ['🖊', 'kugelschreiber'], ['🖍', 'wachsmalstift'], ['🖌', 'pinsel'], ['📐', 'geodreieck'], ['📏', 'lineal'],
        ['✅', 'erledigt haken'], ['☑️', 'angehakt'], ['✔️', 'haken'], ['❌', 'fehler falsch'], ['⛔', 'verboten'],
        ['⚠️', 'warnung achtung'], ['❓', 'frage'], ['❗', 'ausrufezeichen wichtig'], ['💬', 'kommentar sprechblase'], ['🗨', 'sprechblase'],
        ['🔍', 'suchen lupe'], ['🔎', 'suchen'], ['🔔', 'glocke benachrichtigung'], ['🔕', 'stumm'], ['📢', 'ankündigung'],
        ['🏠', 'haus start'], ['🏡', 'zuhause'], ['🏢', 'büro firma'], ['🏫', 'schule'], ['🏥', 'krankenhaus'],
        ['🌍', 'welt erde'], ['🌎', 'welt'], ['🌏', 'welt asien'], ['🗺', 'karte'], ['🧭', 'kompass'],
        ['☀️', 'sonne tag'], ['🌤', 'sonnig'], ['☁️', 'wolke'], ['🌧', 'regen'], ['❄️', 'schnee kalt'],
        ['🌙', 'mond nacht'], ['🌱', 'pflanze wachsen'], ['🌳', 'baum'], ['🌸', 'blume'], ['🍀', 'glück klee'],
        ['🍎', 'apfel obst'], ['🥗', 'salat gesund'], ['🍽', 'essen'], ['☕', 'kaffee'], ['💧', 'wasser trinken'],
        ['🏃', 'laufen sport'], ['🏋️', 'gewicht training'], ['🧘', 'meditation ruhe'], ['🚴', 'fahrrad'], ['⚽', 'fussball'],
        ['🎵', 'musik note'], ['🎧', 'kopfhörer'], ['🎬', 'film'], ['📷', 'kamera foto'], ['🎮', 'spiel'],
        ['💰', 'geld'], ['💵', 'geldschein'], ['💳', 'karte zahlung'], ['🧾', 'rechnung beleg'], ['🏦', 'bank'],
        ['🚗', 'auto'], ['✈️', 'flugzeug reise'], ['🚆', 'zug'], ['🧳', 'koffer'], ['🛒', 'einkauf'],
        ['👤', 'person'], ['👥', 'personen team'], ['👨‍💻', 'entwickler'], ['🧑‍🏫', 'lehrer'], ['👪', 'familie'],
        ['🐾', 'tier'], ['🐶', 'hund'], ['🐱', 'katze'], ['🎓', 'abschluss lernen'], ['📚', 'bücher lesen'],
        ['📖', 'buch offen'], ['🔖', 'lesezeichen'], ['🗑', 'papierkorb löschen'], ['♻️', 'recycling'], ['🧹', 'aufräumen']
    ];
    let menue = null;
    const zu = () => { if (menue) {
        menue.remove();
        menue = null;
    } };
    const textVor = (ct) => {
        /* `getSelection()` gibt `Selection | null` — in einem abgetrennten
           Dokument gibt es keine. Ohne Auswahl gibt es auch keinen Text davor,
           und die leere Zeichenkette ist die richtige Antwort darauf. */
        const s = getSelection();
        if (!s || !s.rangeCount)
            return '';
        const r = s.getRangeAt(0).cloneRange();
        r.selectNodeContents(ct);
        r.setEnd(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
        return r.toString();
    };
    const ersetze = (ct, muster, einfuegung) => {
        const b = Store.getBlock(ct.closest('.blk')?.dataset['bid']);
        if (!b)
            return;
        const neu = (ct.textContent || '').replace(muster, einfuegung);
        Store.updateBlock(b.id, { text: neu });
        zu();
        App.zeichneSeite(b.id, 'ende');
    };
    /* --- @ : Seite, Datum, Person ---------------------------------------- */
    const erwaehnungsMenue = (ct, suche) => {
        zu();
        const q = suche.toLowerCase();
        const heute = new Date();
        const tage = (n) => { const d = new Date(heute); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
        const daten = [
            ['Heute', tage(0)], ['Morgen', tage(1)], ['Übermorgen', tage(2)],
            ['Nächste Woche', tage(7)], ['In einem Monat', tage(30)]
        ].filter(([n]) => !q || n.toLowerCase().includes(q));
        const seiten = Links.seiten()
            .filter((p) => !q || (p.text || '').toLowerCase().includes(q))
            .sort((a, b) => (b.edited || '').localeCompare(a.edited || '')).slice(0, 6);
        const ich = Store.getMeta('nutzer', 'Ich');
        let html = '';
        if (seiten.length) {
            html += '<div class="grp">Seiten</div>' + seiten.map((p) => `<button data-ein="[[${esc(p.text || '')}]]"><span class="mi">${esc(p.icon || '📄')}</span>` +
                `${esc(p.text || 'Ohne Titel')}</button>`).join('');
        }
        if (daten.length) {
            html += '<div class="grp">Datum</div>' + daten.map(([n, d]) => `<button data-ein="@${d}"><span class="mi">📅</span>${n}<span class="ms">${d}</span></button>`).join('');
            html += `<button data-a="datum"><span class="mi">🗓</span>Datum wählen …</button>`;
        }
        if (!q || ich.toLowerCase().includes(q)) {
            html += '<div class="grp">Person</div>' +
                `<button data-ein="@${esc(ich)}"><span class="mi">👤</span>${esc(ich)}</button>`;
        }
        if (suche.trim()) {
            html += '<hr><button data-ein="[[' + esc(suche.trim()) + ']]"><span class="mi">✚</span>' +
                'Neue Seite „' + esc(suche.trim()) + '"</button>';
        }
        if (!html)
            html = '<div class="grp">Kein Treffer</div>';
        const r = ct.getBoundingClientRect();
        menue = UI.menu(html, r.left, r.bottom + 4);
        menue.addEventListener('mousedown', e => e.preventDefault());
        menue.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-ein], button[data-a]');
            if (!b)
                return;
            if (b.dataset.a === 'datum') {
                const d = prompt('Datum im Format JJJJ-MM-TT', tage(0));
                if (d)
                    ersetze(ct, /@[^@\s]*$/, '@' + d + ' ');
                return;
            }
            ersetze(ct, /@[^@\s]*$/, b.dataset.ein + ' ');
        });
        const erste = menue.querySelector('button[data-ein]');
        if (erste)
            erste.classList.add('on');
    };
    /* --- : Emoji ---------------------------------------------------------- */
    const emojiMenue = (ct, suche) => {
        zu();
        const q = suche.toLowerCase();
        const treffer = EMOJIS.filter(([, w]) => !q || (w ?? '').includes(q)).slice(0, 60);
        if (!treffer.length)
            return;
        const r = ct.getBoundingClientRect();
        const m = UI.menu('<div class="grp">Emoji</div><div class="swatches emojis">' +
            treffer.map(([e, w]) => `<button data-e="${e}" title="${esc(w)}">${e}</button>`).join('') + '</div>', r.left, r.bottom + 4);
        menue = m;
        m.addEventListener('mousedown', e => e.preventDefault());
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-e]');
            const zeichen = b?.dataset['e'];
            if (zeichen)
                ersetze(ct, /:[^:\s]*$/, zeichen);
        });
    };
    /** Die grosse Emoji-Auswahl mit Suchfeld — für Seitensymbole. */
    const emojiWaehler = (anker, beiWahl) => {
        const r = anker.getBoundingClientRect();
        const m = UI.menu('<input class="emoji-suche" placeholder="Emoji suchen …" autocomplete="off">' +
            '<div class="swatches emojis" id="eg"></div>' +
            '<hr><button data-e="">Symbol entfernen</button>', r.left, r.bottom + 6);
        const gitter = m.querySelector('#eg');
        const inp = m.querySelector('.emoji-suche');
        /* Beides steht in der Zeichenkette oben — aber `querySelector` weiss das
           nicht, und eine Auswahl ohne Gitter wäre keine. */
        if (!gitter || !inp)
            return;
        const zeichne = (q = '') => {
            gitter.innerHTML = EMOJIS
                .filter(([, w]) => !q || (w ?? '').includes(q.toLowerCase()))
                .map(([e, w]) => `<button data-e="${e}" title="${esc(w)}">${e}</button>`).join('');
        };
        zeichne();
        inp.addEventListener('input', () => zeichne(inp.value));
        inp.addEventListener('keydown', e => { if (e.key === 'Escape')
            m.remove(); });
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-e]');
            if (!b)
                return;
            /* Der Knopf „Symbol entfernen" hat `data-e=""` — leer ist hier eine
               Antwort und keine fehlende. Deshalb `?? ''` und nicht `if (!x)`. */
            beiWahl(b.dataset['e'] ?? '');
            m.remove();
        });
        setTimeout(() => inp.focus(), 30);
    };
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const start = () => {
        /* Ohne `#page` gibt es nichts zu tippen und also nichts zu ergänzen —
           derselbe Fund wie in `hinweis.ts`, an einer Stelle, die beim Start
           läuft und alles danach mitrisse. */
        document.getElementById('page')?.addEventListener('input', e => {
            const ct = elVon(e)?.closest('.ct');
            if (!ct) {
                zu();
                return;
            }
            const vor = textVor(ct);
            const at = vor.match(/(?:^|\s)@([^@\s]*)$/);
            const em = vor.match(/(?:^|\s):([a-zäöü]{2,})$/i);
            if (at?.[1] !== undefined)
                erwaehnungsMenue(ct, at[1]);
            else if (em?.[1] !== undefined)
                emojiMenue(ct, em[1]);
            else
                zu();
        });
        document.addEventListener('keydown', e => {
            const m = menue;
            if (!m)
                return;
            const btns = [...m.querySelectorAll('button[data-ein], button[data-e]')];
            const aktiv = m.querySelector('button.on');
            const i = aktiv ? btns.indexOf(aktiv) : -1;
            if (e.key === 'Escape') {
                zu();
                e.stopPropagation();
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!btns.length)
                    return;
                if (aktiv)
                    aktiv.classList.remove('on');
                const j = e.key === 'ArrowDown' ? (i + 1) % btns.length : (i - 1 + btns.length) % btns.length;
                const ziel = btns[j];
                if (ziel) {
                    ziel.classList.add('on');
                    ziel.scrollIntoView({ block: 'nearest' });
                }
                return;
            }
            if (e.key === 'Enter') {
                const ziel = aktiv ?? btns[0];
                if (!ziel)
                    return;
                e.preventDefault();
                ziel.click();
            }
        }, true);
    };
    return { start, emojiWaehler, EMOJIS };
})();
window.Erwaehnung = Erwaehnung;
/* ==========================================================================
 * 4. KOMMENTARE
 * ========================================================================*/
