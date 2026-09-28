"use strict";
/* ============================================================================
 * erweiterung.js — Eigene Erweiterungen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/einstellungen/erweiterungen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/einstellungen/erweiterungen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notion hat keine Erweiterungen. Was es nicht kann, kann man dort nicht
 * nachrüsten — man wartet.
 *
 * Hier gibt es eine kleine, überschaubare Schnittstelle:
 *
 *   Redion.formel(name, fn)        eine eigene Formelfunktion
 *   Redion.befehl(name, text, fn)  ein Eintrag im Slash-Menü und in der Palette
 *   Redion.knopf(name, icon, fn)   ein Knopf in der Seitenleiste
 *   Redion.beimStart(fn)           läuft einmal beim Öffnen der App
 *   Redion.beiAenderung(fn)        läuft, wenn sich etwas an den Daten ändert
 *
 * Dazu ein Lesezugriff auf die Daten (`Redion.daten`) und die kleinen Helfer
 * `Redion.melde`, `Redion.frage`, `Redion.oeffne`.
 *
 * Eine Erweiterung ist einfach Text. Sie läuft in einer eigenen Funktion und
 * bekommt nur dieses eine Objekt — nicht `window`, nicht `Store`. Vor dem
 * ersten Lauf sieht man den Code und muss zustimmen. Wer eine Erweiterung
 * abschaltet, ist sie sofort los.
 * ==========================================================================*/
const Erweiterung = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    /* ========================================================================
     * SPEICHER
     * ======================================================================*/
    const liste = () => Store.getMeta('erweiterungen', []) || [];
    const sichern = (l) => Store.setMeta('erweiterungen', l);
    const angemeldet = { formeln: {}, befehle: [], knoepfe: [], aenderung: [] };
    const zuruecksetzen = () => {
        angemeldet.formeln = {};
        angemeldet.befehle.length = 0;
        angemeldet.knoepfe.length = 0;
        angemeldet.aenderung.length = 0;
    };
    /* ========================================================================
     * DIE SCHNITTSTELLE
     * ------------------------------------------------------------------------
     * Alles, was eine Erweiterung sehen darf. Bewusst klein: lesen überall,
     * schreiben nur dort, wo es auch ohne Erweiterung ginge.
     * ======================================================================*/
    const schnittstelle = (name) => ({
        name,
        /* --- Anmelden ------------------------------------------------------ */
        formel: (fname, fn) => {
            if (typeof fname !== 'string' || typeof fn !== 'function')
                return;
            angemeldet.formeln[fname.toLowerCase()] = { fn, von: name };
        },
        befehl: (titel, beschreibung, fn) => {
            if (typeof titel !== 'string' || typeof fn !== 'function')
                return;
            angemeldet.befehle.push({ titel, beschreibung: beschreibung || '', fn, von: name });
        },
        knopf: (titel, icon, fn) => {
            if (typeof titel !== 'string' || typeof fn !== 'function')
                return;
            angemeldet.knoepfe.push({ titel, icon: icon || '🧩', fn, von: name });
        },
        beimStart: (fn) => { if (typeof fn === 'function')
            try {
                fn();
            }
            catch (e) {
                melden(name, e);
            } },
        beiAenderung: (fn) => { if (typeof fn === 'function')
            angemeldet.aenderung.push({ fn, von: name }); },
        /* --- Lesen --------------------------------------------------------- */
        daten: {
            seiten: () => Object.values(Store.cache.blocks)
                .filter(b => b.alive !== false && b.type === 'page')
                .map(b => ({ id: b.id, titel: b.text || '', icon: b.icon || '',
                eltern: b.parentId, erstellt: b.created, geaendert: b.edited })),
            bloecke: (seitenId) => Store.childrenOf(seitenId)
                .map((b) => ({ id: b.id, typ: b.type, text: b.text || '' })),
            datenbanken: () => Object.values(Store.cache.collections)
                .map(c => ({ id: c.id, name: c.name || '',
                felder: Object.keys(c.schema).map(k => ({ schluessel: k, name: c.schema[k].name, typ: c.schema[k].type })) })),
            zeilen: (dbId) => {
                const c = Store.getCollection(dbId);
                if (!c)
                    return [];
                return Store.rowsOf(c.id).map((r) => {
                    const o = { id: r.id, titel: r.text || '' };
                    Object.keys(c.schema).forEach(k => { o[c.schema[k].name] = Datenbank.wert(r, k, c); });
                    return o;
                });
            },
            aktuelleSeite: () => App.aktuelleSeite()
        },
        /* --- Schreiben, so weit es unbedenklich ist ------------------------ */
        schreibe: {
            block: (seitenId, typ, text) => {
                if (!Store.getBlock(seitenId))
                    throw new Error('Diese Seite gibt es nicht');
                const b = Store.addBlock(seitenId, typ || 'text', { text: String(text ?? '') });
                return b.id;
            },
            seite: (titel, elternId) => Store.addBlock(elternId || null, 'page', { text: String(titel ?? 'Neue Seite') }).id,
            zeile: (dbId, werte) => {
                const c = Store.getCollection(dbId);
                if (!c)
                    throw new Error('Diese Datenbank gibt es nicht');
                const props = {};
                Object.entries(werte || {}).forEach(([n, v]) => {
                    const k = Object.keys(c.schema).find(x => c.schema[x].name === n || x === n);
                    if (k)
                        props[k] = v;
                });
                return Store.addRow(c.id, props).id;
            }
        },
        /* --- Kleinigkeiten -------------------------------------------------- */
        melde: (t) => UI.toast(String(t).slice(0, 200)),
        frage: (t, vorgabe) => UI.frage(String(t), vorgabe || ''),
        oeffne: (id) => App.oeffne(id),
        zeichne: () => App.zeichneSeite()
    });
    const melden = (name, e) => {
        UI.toast('Erweiterung „' + name + '": ' + (e instanceof Error ? e.message : String(e)));
        if (typeof Pflege !== 'undefined' && Pflege.fehlerMerken)
            Pflege.fehlerMerken('Erweiterung ' + name, e);
    };
    /* ========================================================================
     * LAUFEN LASSEN
     * ======================================================================*/
    /* Diese Namen werden der Erweiterung als leere Parameter untergeschoben.
       Damit sind sie im Code der Erweiterung „undefined" — sie kommt nicht
       versehentlich an den Speicher, ans Netz oder ans Fenster. Ein Zaun, kein
       Tresor: wer will, findet über Umwege doch einen Weg. Deshalb steht im
       Fenster auch: nur einbauen, was man versteht. */
    const ABGESCHIRMT = ['Store', 'App', 'Datenbank', 'Blocks', 'KI', 'Krypto', 'Erweiterung',
        'window', 'globalThis', 'self', 'document', 'localStorage',
        'sessionStorage', 'indexedDB', 'fetch', 'XMLHttpRequest',
        'Function', 'importScripts', 'WebSocket', 'navigator', 'parent', 'top',
        'open', 'postMessage', 'Worker'];
    /* „eval" fehlt mit Absicht: im strikten Modus darf kein Parameter so heissen.
       Das ist der beste Beleg dafür, dass dies ein Zaun ist und kein Tresor. */
    const einzeln = (e) => {
        if (e.an === false)
            return { ok: true, aus: true };
        try {
            /* Eigene Funktion, eigener Bereich: die Erweiterung sieht nur „Redion". */
            const fn = new Function('Redion', ...ABGESCHIRMT, '"use strict";\n' + e.code);
            fn(schnittstelle(e.name));
            return { ok: true };
        }
        catch (err) {
            melden(e.name, err);
            return { ok: false, fehler: err instanceof Error ? err.message : String(err) };
        }
    };
    const alleLaufen = () => {
        zuruecksetzen();
        const raus = liste().map((e) => ({ e, r: einzeln(e) }));
        /* Angemeldete Formeln in die Formelmaschine hängen */
        if (typeof Formula !== 'undefined' && Formula.F) {
            Object.entries(angemeldet.formeln).forEach(([n, x]) => {
                Formula.F[n] = (args) => x.fn(...args);
            });
        }
        setTimeout(knoepfeZeigen, 0);
        return raus;
    };
    /** Die Knöpfe der Erweiterungen unten in der Seitenleiste. */
    const knoepfeZeigen = () => {
        document.getElementById('erw-knoepfe')?.remove();
        if (!angemeldet.knoepfe.length)
            return;
        if (document.getElementById('tree') === null)
            return;
        const baum = document.getElementById('tree');
        if (!baum)
            return;
        const d = document.createElement('div');
        d.id = 'erw-knoepfe';
        d.className = 'wz-block';
        d.innerHTML = '<div class="side-section"><span>Erweiterungen</span></div>' +
            angemeldet.knoepfe.map((k, i) => `<button class="side-item" data-erw="${i}" title="${esc(k.von)}">` +
                `<span>${esc(k.icon)}</span><span>${esc(k.titel)}</span></button>`).join('');
        d.addEventListener('click', e => {
            const b = elVon(e)?.closest('[data-erw]');
            if (!b)
                return;
            const k = angemeldet.knoepfe[+(b.dataset["erw"] ?? -1)];
            if (!k)
                return;
            try {
                k.fn();
            }
            catch (err) {
                melden(k.von, err);
            }
        });
        baum.appendChild(d);
    };
    /** Wird von der App gerufen, wenn sich Daten geändert haben. */
    const gemeldet = (was) => {
        angemeldet.aenderung.forEach(x => {
            try {
                x.fn(was);
            }
            catch (e) {
                melden(x.von, e);
            }
        });
    };
    /* ========================================================================
     * BEISPIELE — damit man sieht, wie es geht
     * ======================================================================*/
    const BEISPIELE = [
        { name: 'Wörter zählen',
            kurz: 'Ein Knopf, der die Wörter der offenen Seite zählt',
            code: `// Ein Knopf in der Seitenleiste.
Redion.knopf('Wörter zählen', '🔢', () => {
  const seite = Redion.daten.aktuelleSeite();
  if (!seite) { Redion.melde('Erst eine Seite öffnen'); return; }
  const text = Redion.daten.bloecke(seite).map(b => b.text).join(' ');
  const n = text.split(/\\s+/).filter(Boolean).length;
  Redion.melde(n + ' Wörter auf dieser Seite');
});` },
        { name: 'Römische Zahlen',
            kurz: 'Eine Formelfunktion roemisch(2026) → MMXXVI',
            code: `// Eine eigene Formelfunktion. In jeder Formel benutzbar.
Redion.formel('roemisch', (n) => {
  const t = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],
             [50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let z = Math.floor(Number(n) || 0), s = '';
  for (const [w, b] of t) while (z >= w) { s += b; z -= w; }
  return s || '0';
});` },
        { name: 'Tagesnotiz',
            kurz: 'Ein Befehl, der eine Seite mit dem heutigen Datum anlegt',
            code: `// Ein Eintrag in der Befehlspalette.
Redion.befehl('Tagesnotiz anlegen', 'Neue Seite mit dem heutigen Datum', () => {
  const heute = new Date().toLocaleDateString('de-DE',
    { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const id = Redion.schreibe.seite(heute);
  Redion.schreibe.block(id, 'h2', 'Was heute wichtig war');
  Redion.schreibe.block(id, 'bullet', '');
  Redion.oeffne(id);
});` },
        { name: 'Leere Seiten melden',
            kurz: 'Meldet beim Start, wie viele Seiten noch leer sind',
            code: `Redion.beimStart(() => {
  const leer = Redion.daten.seiten()
    .filter(s => Redion.daten.bloecke(s.id).every(b => !b.text.trim()));
  if (leer.length > 2) Redion.melde(leer.length + ' Seiten sind noch leer');
});` }
    ];
    /* ========================================================================
     * DAS FENSTER
     * ======================================================================*/
    const dialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        document.body.appendChild(o);
        const zeichne = () => {
            const l = liste();
            o.innerHTML =
                '<div class="finder" style="width:min(760px,95vw)">' +
                    `<div class="fh">🧩 Erweiterungen <em>${l.length}</em>` +
                    '<button class="icon-btn" data-a="zu">✕</button></div>' +
                    '<div class="ew-koerper">' +
                    '<div class="ew-hinweis">Eine Erweiterung ist ein kleines Stück JavaScript. ' +
                    'Sie läuft in einem eigenen Bereich und sieht nur das Objekt <code>Redion</code>: ' +
                    '<code>Store</code>, <code>window</code>, <code>fetch</code> und ' +
                    'zwei Dutzend weitere Namen sind darin leer. Das ist ein Zaun, kein Tresor — ' +
                    'baue nur ein, was du verstehst.</div>' +
                    (l.length
                        ? '<div class="ew-liste">' + l.map((e, i) => `<div class="ew-z${e.an === false ? ' aus' : ''}">` +
                            `<button class="schalter${e.an === false ? '' : ' an'}" data-an="${i}" ` +
                            `role="switch" aria-checked="${e.an === false ? 'false' : 'true'}" ` +
                            `aria-label="${esc(e.name || 'Erweiterung')}"><i></i></button>` +
                            `<div class="ew-text"><b>${esc(e.name)}</b>` +
                            `<span>${esc(e.kurz || (e.code || '').split('\\n')[0].slice(0, 70))}</span></div>` +
                            `<button data-code="${i}" title="Code ansehen">⌨</button>` +
                            `<button data-weg="${i}" data-loeschknopf="Entfernen" title="${esc(e.name || 'Erweiterung')} entfernen">🗑</button>` +
                            '</div>').join('') + '</div>'
                        : '<div class="pf-gut">Noch keine Erweiterung eingebaut.</div>') +
                    '<div class="ew-titel">Zum Ausprobieren</div>' +
                    '<div class="ew-beispiele">' + BEISPIELE.map((b, i) => `<button data-bsp="${i}"><b>${esc(b.name)}</b><span>${esc(b.kurz)}</span></button>`).join('') +
                    '</div>' +
                    '<div class="ew-titel">Was eine Erweiterung darf</div>' +
                    '<div class="ew-api">' +
                    [['Redion.formel(name, fn)', 'eine eigene Formelfunktion'],
                        ['Redion.befehl(titel, text, fn)', 'ein Eintrag in der Befehlspalette'],
                        ['Redion.knopf(titel, icon, fn)', 'ein Knopf in der Seitenleiste'],
                        ['Redion.beimStart(fn)', 'läuft einmal beim Öffnen'],
                        ['Redion.beiAenderung(fn)', 'läuft bei jeder Datenänderung'],
                        ['Redion.daten.seiten()', 'alle Seiten lesen'],
                        ['Redion.daten.bloecke(seitenId)', 'die Blöcke einer Seite'],
                        ['Redion.daten.datenbanken()', 'alle Datenbanken mit Feldern'],
                        ['Redion.daten.zeilen(dbId)', 'die Zeilen einer Datenbank'],
                        ['Redion.schreibe.seite(titel)', 'eine Seite anlegen'],
                        ['Redion.schreibe.block(seitenId, typ, text)', 'einen Block anlegen'],
                        ['Redion.schreibe.zeile(dbId, werte)', 'eine Datenbankzeile anlegen'],
                        ['Redion.melde(text)', 'eine kurze Meldung zeigen'],
                        ['Redion.frage(text)', 'nach einer Eingabe fragen'],
                        ['Redion.oeffne(id)', 'eine Seite öffnen']].map(([a, b]) => `<div><code>${esc(a)}</code><span>${esc(b)}</span></div>`).join('') +
                    '</div>' +
                    '</div>' +
                    '<div class="fbtns">' +
                    '<button data-a="neu">＋ Eigene schreiben</button>' +
                    '<button data-a="zu" class="prim">Schliessen</button></div>' +
                    '</div>';
        };
        zeichne();
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const l = liste();
            const an = elVon(e)?.closest('[data-an]');
            if (an) {
                const i = +(an.dataset["an"] ?? -1);
                if (!l[i])
                    return;
                l[i].an = l[i].an === false;
                sichern(l);
                alleLaufen();
                zeichne();
                UI.toast(l[i].an === false ? 'Ausgeschaltet' : 'Läuft jetzt');
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                const i = +(weg.dataset["weg"] ?? -1);
                if (!l[i])
                    return;
                /* Gefragt hat schon der Knopf (E709): „Entfernen" / „Abbrechen". */
                l.splice(i, 1);
                sichern(l);
                alleLaufen();
                zeichne();
                return;
            }
            const code = elVon(e)?.closest('[data-code]');
            if (code?.dataset["code"]) {
                const ci = +code.dataset["code"];
                if (l[ci])
                    codeFenster(l[ci], ci, () => { zeichne(); });
                return;
            }
            const bsp = elVon(e)?.closest('[data-bsp]');
            if (bsp) {
                const b = BEISPIELE[+(bsp.dataset["bsp"] ?? -1)];
                if (!b)
                    return;
                codeFenster({ name: b.name, kurz: b.kurz, code: b.code, an: true }, -1, () => zeichne());
                return;
            }
            if (elVon(e)?.closest('[data-a="neu"]')) {
                codeFenster({ name: '', kurz: '', code: "// Redion.knopf, Redion.befehl, Redion.formel, Redion.beimStart\n" +
                        "Redion.melde('Hallo aus meiner Erweiterung');\n", an: true }, -1, () => zeichne());
            }
        });
    };
    /** Code ansehen, ändern, prüfen und einbauen. */
    const codeFenster = (e, index, fertig) => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(760px,95vw)">' +
                `<div class="fh">⌨ ${index < 0 ? 'Neue Erweiterung' : esc(e.name)}` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="ew-koerper">' +
                `<label class="ew-feld">Name<input id="ew-n" value="${esc(e.name)}"></label>` +
                `<label class="ew-feld">Kurz erklärt<input id="ew-k" value="${esc(e.kurz || '')}"></label>` +
                `<label class="ew-feld">Code<textarea id="ew-c" spellcheck="false" rows="14">${esc(e.code || '')}</textarea></label>` +
                '<div class="ew-pruef" id="ew-p"></div>' +
                '</div>' +
                '<div class="fbtns">' +
                '<button data-a="probe">Probelauf</button>' +
                '<button data-a="zu">Abbrechen</button>' +
                '<button data-a="ok" class="prim">Einbauen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const feldwert = (id) => o.querySelector(id)?.value ?? '';
        const lesen = () => ({ name: feldwert('#ew-n').trim() || 'Ohne Namen',
            kurz: feldwert('#ew-k').trim(),
            code: feldwert('#ew-c'), an: true });
        o.addEventListener('click', ev => {
            if (ev.target === o || elVon(ev)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(ev)?.closest('[data-a="probe"]')) {
                const probe = lesen();
                const p = o.querySelector('#ew-p');
                if (!p)
                    return;
                /* Erst lesen, dann laufen — ein Tippfehler soll nichts anrichten. */
                try {
                    new Function('Redion', '"use strict";\n' + probe.code);
                }
                catch (err) {
                    p.className = 'ew-pruef schlecht';
                    p.textContent = '⛔ ' + (err instanceof Error ? err.message : String(err));
                    return;
                }
                const r = einzeln(probe);
                p.className = 'ew-pruef ' + (r.ok ? 'gut' : 'schlecht');
                p.textContent = r.ok
                    ? '✅ Lief durch. Angemeldet: ' +
                        (Object.keys(angemeldet.formeln).length + ' Formeln, ' +
                            angemeldet.befehle.length + ' Befehle, ' + angemeldet.knoepfe.length + ' Knöpfe')
                    : '⛔ ' + r.fehler;
                alleLaufen();
                return;
            }
            if (elVon(ev)?.closest('[data-a="ok"]')) {
                const neu = lesen();
                try {
                    new Function('Redion', '"use strict";\n' + neu.code);
                }
                catch (err) {
                    const p = o.querySelector('#ew-p');
                    if (!p)
                        return;
                    p.className = 'ew-pruef schlecht';
                    p.textContent = '⛔ Der Code lässt sich nicht lesen: ' + (err instanceof Error ? err.message : String(err));
                    return;
                }
                const l = liste();
                if (index < 0)
                    l.push(neu);
                else
                    l[index] = { ...l[index], ...neu };
                sichern(l);
                alleLaufen();
                o.remove();
                UI.toast('„' + neu.name + '" eingebaut');
                if (fertig)
                    fertig();
            }
        });
    };
    /* ========================================================================
     * START
     * ======================================================================*/
    const start = () => {
        if (!liste().length)
            return;
        alleLaufen();
        Store.on((was) => gemeldet(was));
    };
    return { start, liste, sichern, alleLaufen, einzeln, dialog, codeFenster, ABGESCHIRMT,
        knoepfeAnhaengen: knoepfeZeigen,
        angemeldet, BEISPIELE, gemeldet, schnittstelle };
})();
window.Erweiterung = Erweiterung;
