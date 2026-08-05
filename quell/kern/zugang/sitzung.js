"use strict";
/* ============================================================================
 * konten.js — Konten, Rollen und Freigaben
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/zugang/sitzung.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/zugang/sitzung.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Teil 8 der Doku beschreibt eine Berechtigungsmatrix mit fünf Rollen, Teil 13
 * die Anmeldung über einen fremden Anbieter. Beides gibt es jetzt.
 *
 * EHRLICH GESAGT: ohne eigenen Server kann diese App niemanden aussperren.
 * Alle Daten liegen im Browser desjenigen, der die App öffnet. Was hier
 * gebaut ist, wirkt sauber und vollständig — es ist aber eine Absprache,
 * kein Schloss. Sobald die Daten geteilt werden (Datei, Ordner, Server),
 * gilt wieder das, was der andere in seinem Browser tun kann.
 *
 * Was echt ist:
 *   · die Anmeldung über Google liefert einen geprüften Namen und eine
 *     geprüfte E-Mail-Adresse — das ist eine richtige Identität
 *   · die Rollen steuern die Oberfläche zuverlässig
 *   · jede Änderung wird mit dem angemeldeten Namen protokolliert
 * ==========================================================================*/
const Konten = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    /* ------------------------------------------------------------------------
     * DIE FÜNF ROLLEN   (Teil 8, Berechtigungsmatrix)
     * ----------------------------------------------------------------------*/
    const ROLLEN = [
        { id: 'voll', name: 'Vollzugriff', icon: '👑',
            darf: ['lesen', 'kommentieren', 'bearbeiten', 'teilen', 'loeschen', 'rechte'],
            text: 'Darf alles — auch Rechte vergeben und die Seite löschen.' },
        { id: 'edit', name: 'Bearbeiten', icon: '✏️',
            darf: ['lesen', 'kommentieren', 'bearbeiten'],
            text: 'Darf Inhalte ändern, aber keine Rechte vergeben.' },
        { id: 'komm', name: 'Kommentieren', icon: '💬',
            darf: ['lesen', 'kommentieren'],
            text: 'Darf lesen und kommentieren, aber nichts ändern.' },
        { id: 'lesen', name: 'Lesen', icon: '👁',
            darf: ['lesen'],
            text: 'Darf nur lesen.' },
        { id: 'kein', name: 'Kein Zugriff', icon: '🚫',
            darf: [],
            text: 'Sieht die Seite gar nicht.' }
    ];
    /** Eine Rolle zu ihrer Kennung — oder die erste, die es immer gibt. */
    const KEINE = { id: 'kein', name: 'Kein Zugriff', icon: '🚫', darf: [], text: 'Sieht die Seite gar nicht.' };
    const rolle = (id) => ROLLEN.find(r => r.id === id) ?? ROLLEN[0] ?? KEINE;
    /* ------------------------------------------------------------------------
     * KONTEN
     * ----------------------------------------------------------------------*/
    const FARBEN = ['blue', 'green', 'orange', 'purple', 'pink', 'red', 'yellow', 'brown'];
    const alle = () => Store.getMeta('konten', []) || [];
    const speichern = (liste) => Store.setMeta('konten', liste);
    const aktiv = () => {
        const id = Store.getMeta('kontoAktiv', '');
        const gefunden = alle().find((k) => k.id === id);
        if (gefunden)
            return gefunden;
        /* Ohne Anmeldung gilt der Name aus den Einstellungen. */
        return { id: 'lokal', name: Store.getMeta('nutzer', '') || 'Ich',
            mail: '', rolle: 'voll', farbe: 'blue', herkunft: 'lokal' };
    };
    const anlegen = ({ name, mail, herkunft = 'lokal', bild = '', rolleId = null }) => {
        const liste = alle();
        const schon = liste.find((k) => mail && k.mail === mail);
        if (schon) {
            Object.assign(schon, { name: name || schon.name, bild: bild || schon.bild, herkunft });
            speichern(liste);
            return schon;
        }
        const k = {
            id: Store.uid().slice(0, 8), name: name || 'Ohne Namen', mail: mail || '',
            /* Ohne ausdrückliche Angabe bekommt der erste Mensch alle Rechte —
               danach ist Bearbeiten die vernünftige Voreinstellung. */
            herkunft, bild, rolle: rolleId || (liste.length ? 'edit' : 'voll'),
            farbe: FARBEN[liste.length % FARBEN.length], seit: Store.now()
        };
        liste.push(k);
        speichern(liste);
        return k;
    };
    const anmelden = (kontoId) => {
        Store.setMeta('kontoAktiv', kontoId);
        const k = aktiv();
        Store.setMeta('nutzer', k.name);
        App.zeichneBaum();
        App.zeichneSeite();
        UI.toast('Angemeldet als ' + k.name);
    };
    const entfernen = (kontoId) => {
        speichern(alle().filter((k) => k.id !== kontoId));
        if (Store.getMeta('kontoAktiv', '') === kontoId)
            Store.setMeta('kontoAktiv', '');
    };
    /* ------------------------------------------------------------------------
     * FREIGABEN JE SEITE
     * ------------------------------------------------------------------------
     * An der Seite steht, wer welche Rolle hat. Vererbt wird nach unten:
     * eine Unterseite ohne eigene Freigabe erbt die der Elternseite.
     * ----------------------------------------------------------------------*/
    const freigabenVon = (seiteId) => {
        const b = Store.getBlock(seiteId);
        return (b && b.freigaben) || null;
    };
    /* Je kleiner die Zahl, desto mehr ist erlaubt. Trifft eine Freigabe auf
       eine Kontorolle, gilt immer die strengere von beiden — ein Konto mit
       Leserecht kann nicht durch eine Seitenfreigabe zum Bearbeiter werden. */
    const RANG = { voll: 0, edit: 1, komm: 2, lesen: 3, kein: 4 };
    const strenger = (a, b) => (RANG[a] ?? 0) >= (RANG[b] ?? 0) ? a : b;
    /** Welche Rolle hat ein Konto auf dieser Seite? Erbt nach oben. */
    const rolleAuf = (seiteId, kontoId) => {
        const konto = kontoId || aktiv().id;
        const kontoRolle = kontoId
            ? (alle().find((k) => k.id === kontoId) || {}).rolle || 'lesen'
            : aktiv().rolle || 'voll';
        let cur = Store.getBlock(seiteId), n = 0;
        while (cur && n++ < 40) {
            const fr = cur.freigaben;
            if (fr && fr[konto])
                return strenger(fr[konto], kontoRolle);
            if (fr && fr['*'])
                return strenger(fr['*'], kontoRolle);
            cur = cur.parentId ? Store.getBlock(cur.parentId) : null;
        }
        /* Keine Freigabe hinterlegt: wer das Ding angelegt hat, behält es. */
        const b = Store.getBlock(seiteId);
        const ich = aktiv();
        if (!kontoId && b && b.erstelltVon && b.erstelltVon === ich.name)
            return strenger('voll', kontoRolle);
        return strenger(Store.getMeta('rolleStandard', 'voll'), kontoRolle);
    };
    const darf = (was, seiteId) => {
        const id = seiteId || App.aktuelleSeite();
        if (!id)
            return true;
        return rolle(rolleAuf(id, '')).darf.includes(was);
    };
    const setzeFreigabe = (seiteId, kontoId, rolleId) => {
        const b = Store.getBlock(seiteId);
        if (!b)
            return;
        const fr = Object.assign({}, b.freigaben || {});
        const vorher = fr[kontoId] || null;
        if (rolleId)
            fr[kontoId] = rolleId;
        else
            delete fr[kontoId];
        Store.updateBlock(seiteId, { freigaben: fr });
        /* Eine Rechteänderung ist genau die Art Ereignis, die man später
           nachschlagen will — deshalb ins Protokoll, mit Vorher und Nachher. */
        if (typeof Protokoll !== 'undefined' && vorher !== (rolleId || null)) {
            const wer = kontoId === '*' ? 'alle'
                : ((alle().find((k) => k.id === kontoId) || {}).name || kontoId);
            Protokoll.notieren('rechte', 'Rechte an „' + (b.text || 'Ohne Titel') + '" für ' + wer + ': ' +
                (vorher ? rolle(vorher).name : 'nichts') + ' → ' +
                (rolleId ? rolle(rolleId).name : 'nichts'), { seite: seiteId, id: seiteId });
        }
    };
    /* ------------------------------------------------------------------------
     * DIE MATRIX ALS TABELLE
     * ----------------------------------------------------------------------*/
    const matrix = () => {
        const RECHTE = [
            ['lesen', 'Seite ansehen'],
            ['kommentieren', 'Kommentare schreiben'],
            ['bearbeiten', 'Inhalte ändern'],
            ['teilen', 'Weitergeben und veröffentlichen'],
            ['loeschen', 'In den Papierkorb legen'],
            ['rechte', 'Rechte anderer ändern']
        ];
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(820px,95vw)">' +
                '<div class="fh">🔐 Berechtigungen<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div style="padding:0 18px 14px; max-height:70vh; overflow:auto">' +
                '<table class="rechte-matrix"><thead><tr><th>Darf …</th>' +
                ROLLEN.map(r => `<th>${r.icon}<br>${esc(r.name)}</th>`).join('') +
                '</tr></thead><tbody>' +
                RECHTE.map(([id, n]) => '<tr><td>' + esc(n) + '</td>' +
                    ROLLEN.map(r => `<td>${r.darf.some(d => d === id) ? '✅' : '—'}</td>`).join('') +
                    '</tr>').join('') +
                '</tbody></table>' +
                '<div class="rechte-hinweis">Ohne eigenen Server ist das eine Absprache, kein Schloss: ' +
                'wer die Daten in seinem Browser hat, kommt an alles heran. Für echten Schutz gehören ' +
                'die Daten hinter einen Server mit Anmeldung.</div>' +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]'))
                o.remove();
        });
    };
    /* ------------------------------------------------------------------------
     * FREIGABE-DIALOG FÜR EINE SEITE
     * ----------------------------------------------------------------------*/
    const freigeben = (seiteId) => {
        const b = Store.getBlock(seiteId);
        if (!b)
            return;
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(560px,94vw)">' +
                `<div class="fh">Freigabe — ${esc(b.text || 'Ohne Titel')}` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res" id="fl"></div>' +
                '<div class="fbtns"><button data-a="konto">＋ Konto anlegen</button>' +
                '<button data-a="matrix">Was darf welche Rolle?</button>' +
                '<button data-a="zu" class="prim">Fertig</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const fr = freigabenVon(seiteId) || {};
            const zeilen = alle().map((k) => {
                const r = fr[k.id] || rolleAuf(seiteId, k.id);
                const geerbt = !fr[k.id];
                return `<div class="frei-zeile">` +
                    `<span class="frei-kreis bg-${k.farbe}">${esc((k.name || '?')[0].toUpperCase())}</span>` +
                    `<span class="frei-name"><b>${esc(k.name)}</b>` +
                    (k.mail ? `<span>${esc(k.mail)}</span>` : '') + '</span>' +
                    `<select data-k="${k.id}">` +
                    ROLLEN.map(x => `<option value="${x.id}"${x.id === r ? ' selected' : ''}>` +
                        `${x.icon} ${esc(x.name)}</option>`).join('') +
                    '</select>' +
                    (geerbt ? '<span class="frei-erbt" title="von der übergeordneten Seite">geerbt</span>'
                        : `<button data-weg="${k.id}" title="Eigene Freigabe entfernen">↺</button>`) +
                    '</div>';
            }).join('');
            const fl = o.querySelector('#fl');
            if (!fl)
                return;
            fl.innerHTML =
                (zeilen || '<div style="padding:16px;color:var(--text-faint);font-size:14px">' +
                    'Noch keine Konten. Leg eines an oder melde dich mit Google an.</div>') +
                    '<div class="frei-zeile"><span class="frei-kreis bg-gray">🌐</span>' +
                    '<span class="frei-name"><b>Alle anderen</b><span>Standard für Konten ohne eigene Freigabe</span></span>' +
                    '<select data-k="*">' +
                    ROLLEN.map(x => `<option value="${x.id}"` +
                        `${x.id === ((freigabenVon(seiteId) || {})['*'] || 'kein') ? ' selected' : ''}>` +
                        `${x.icon} ${esc(x.name)}</option>`).join('') +
                    '</select></div>';
        };
        zeichne();
        o.addEventListener('change', e => {
            const s = elVon(e)?.closest('select[data-k]');
            if (!s)
                return;
            if (!s.dataset["k"] || !(s instanceof HTMLSelectElement))
                return;
            setzeFreigabe(seiteId, s.dataset["k"], s.value);
            zeichne();
            UI.toast('Freigabe gespeichert');
        });
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                App.zeichneSeite();
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg?.dataset["weg"]) {
                setzeFreigabe(seiteId, weg.dataset["weg"], null);
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="matrix"]')) {
                matrix();
                return;
            }
            if (elVon(e)?.closest('[data-a="konto"]')) {
                const name = await UI.frage('Name des Kontos', '');
                if (!name)
                    return;
                const mail = await UI.frage('E-Mail (darf leer bleiben)', '');
                anlegen({ name, mail: mail || '' });
                zeichne();
            }
        });
    };
    /* ------------------------------------------------------------------------
     * KONTENVERWALTUNG
     * ----------------------------------------------------------------------*/
    const verwalten = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(620px,94vw)">' +
                '<div class="fh">👥 Konten<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res" id="kl"></div>' +
                '<div class="fbtns">' +
                '<button data-a="google" class="prim">Mit Google anmelden</button>' +
                '<button data-a="neu">＋ Konto von Hand</button>' +
                '<button data-a="matrix">Rollen ansehen</button>' +
                '<button data-a="zu">Schliessen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const ich = aktiv();
            const kl = o.querySelector('#kl');
            if (!kl)
                return;
            kl.innerHTML =
                `<div class="grp">Angemeldet: ${esc(ich.name)}${ich.mail ? ' · ' + esc(ich.mail) : ''}</div>` +
                    (alle().length
                        ? alle().map((k) => `<div class="frei-zeile">` +
                            `<span class="frei-kreis bg-${k.farbe}">${esc((k.name || '?')[0].toUpperCase())}</span>` +
                            `<span class="frei-name"><b>${esc(k.name)}${k.id === ich.id ? ' · das bist du' : ''}</b>` +
                            `<span>${esc(k.mail || 'ohne E-Mail')} · ${k.herkunft === 'google' ? 'über Google geprüft' : 'von Hand angelegt'}</span></span>` +
                            `<select data-r="${k.id}">` +
                            ROLLEN.map(x => `<option value="${x.id}"${x.id === k.rolle ? ' selected' : ''}>` +
                                `${x.icon} ${esc(x.name)}</option>`).join('') +
                            '</select>' +
                            (k.id === ich.id ? '' : `<button data-an="${k.id}" title="Als dieses Konto arbeiten">↦</button>`) +
                            `<button data-weg="${k.id}" title="Entfernen">🗑</button>` +
                            '</div>').join('')
                        : '<div style="padding:18px;color:var(--text-faint);font-size:14px">Noch kein Konto angelegt.</div>');
        };
        zeichne();
        o.addEventListener('change', e => {
            const s = elVon(e)?.closest('select[data-r]');
            if (!s)
                return;
            const liste = alle();
            if (!(s instanceof HTMLSelectElement))
                return;
            const k = liste.find((x) => x.id === s.dataset["r"]);
            if (k) {
                k.rolle = s.value;
                speichern(liste);
                UI.toast('Rolle gesetzt');
            }
        });
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const an = elVon(e)?.closest('[data-an]');
            if (an?.dataset["an"]) {
                anmelden(an.dataset["an"]);
                zeichne();
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg?.dataset["weg"]) {
                entfernen(weg.dataset["weg"]);
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="matrix"]')) {
                matrix();
                return;
            }
            if (elVon(e)?.closest('[data-a="neu"]')) {
                const name = await UI.frage('Name des Kontos', '');
                if (!name)
                    return;
                const mail = await UI.frage('E-Mail (darf leer bleiben)', '');
                anlegen({ name, mail: mail || '' });
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="google"]')) {
                o.remove();
                try {
                    const profil = await Verbindungen.googleAnmelden();
                    const k = anlegen({ name: profil.name, mail: profil.email,
                        herkunft: 'google', bild: profil.picture, rolleId: 'voll' });
                    anmelden(k.id);
                }
                catch (err) {
                    UI.banner('Anmeldung nicht möglich: ' + (err instanceof Error ? err.message : String(err)), 'warn');
                }
            }
        });
    };
    return { ROLLEN, RANG, strenger, rolle, alle, aktiv, anlegen, anmelden, entfernen,
        rolleAuf, darf, setzeFreigabe, freigabenVon, freigeben, verwalten, matrix };
})();
window.Konten = Konten;
