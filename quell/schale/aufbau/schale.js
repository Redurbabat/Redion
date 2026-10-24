"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/schale.ts (npm run bauen:ts). */
const App = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    let seiteId = null;
    const esc = (s) => String(s ?? '')
        .replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c));
    const aktuelleSeite = () => seiteId;
    const setzeSeite = (id) => { seiteId = id; };
    const rueck = [], vor = [];
    let navSperre = false;
    const navOrt = () => seiteId ? { seite: String(seiteId) }
        : sonder ? { titel: sonder.titel, zeichner: sonder.zeichner, hash: location.hash } : null;
    const navMerken = () => {
        if (navSperre)
            return;
        const ort = navOrt();
        if (ort) {
            rueck.push(ort);
            if (rueck.length > 100)
                rueck.shift();
        }
        vor.length = 0;
    };
    const navOeffnen = (ort) => {
        navSperre = true;
        try {
            if ('seite' in ort)
                oeffne(ort.seite);
            else {
                zeigeSonder(ort.titel, ort.zeichner);
                location.hash = ort.hash;
            }
        }
        finally {
            navSperre = false;
            navKnoepfeStellen();
        }
    };
    const navKnoepfeStellen = () => {
        const setz = (id, kann) => {
            const k = document.getElementById(id);
            if (!k)
                return;
            k.disabled = !kann;
            k.title = kann
                ? (id === 'btn-back' ? 'Zurück (Strg + [)' : 'Vorwärts (Strg + ])')
                : (id === 'btn-back' ? 'Zurück — kein Schritt vorhanden'
                    : 'Vorwärts — kein Schritt vorhanden');
        };
        setz('btn-back', rueck.length > 0 || !!seiteId);
        if (!rueck.length && seiteId) {
            const back = document.getElementById('btn-back');
            if (back)
                back.title = 'Zur Dokumentübersicht (Strg + [)';
        }
        setz('btn-fwd', vor.length > 0);
    };
    const zurueck = () => {
        const ziel = rueck.pop();
        const jetzt = navOrt();
        if (!ziel && !seiteId) {
            UI.toast('Kein Schritt zurück');
            return;
        }
        if (jetzt)
            vor.push(jetzt);
        if (ziel)
            navOeffnen(ziel);
        else {
            navSperre = true;
            try {
                Register.navigation.eines('bibliothekOben')?.tun?.();
            }
            finally {
                navSperre = false;
                navKnoepfeStellen();
            }
        }
    };
    const vorwaerts = () => {
        if (!vor.length) {
            UI.toast('Kein Schritt vorwärts');
            return;
        }
        const ziel = vor.pop();
        const jetzt = navOrt();
        if (jetzt)
            rueck.push(jetzt);
        navOeffnen(ziel);
    };
    const kuerzlichMerken = (id) => {
        const b = Store.getBlock(id);
        if (!b || b.type !== 'page' || b.parentTable === 'collection')
            return;
        const l = [id, ...(Store.getMeta('kuerzlich', []) || []).filter((x) => x !== id)];
        Store.setMeta('kuerzlich', l.slice(0, 12));
    };
    const kuerzlich = () => (Store.getMeta('kuerzlich', []) || [])
        .map((id) => Store.getBlock(id))
        .filter((b) => b && b.alive && b.type === 'page' && b.parentTable !== 'collection')
        .slice(0, 6);
    const nurTag = (wert) => /^\d{4}-\d{2}-\d{2}$/.test(String(wert).trim());
    const alsDatum = (wert) => {
        const t = String(wert).trim();
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
        return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(t);
    };
    const kommendeTermine = (wieViele = 3) => {
        const raus = [];
        const heute = new Date();
        heute.setHours(0, 0, 0, 0);
        const grenze = new Date(heute);
        grenze.setDate(grenze.getDate() + 30);
        Object.values(Store.cache.collections).forEach(c => {
            const dk = Object.keys(c.schema || {}).find(k => c.schema[k].type === 'date');
            if (!dk)
                return;
            Store.rowsOf(c.id).forEach(r => {
                const v = Datenbank.wert(r, dk, c);
                if (!v)
                    return;
                const d = alsDatum(v);
                if (isNaN(d.getTime()) || d < heute || d > grenze)
                    return;
                raus.push({ id: r.id, text: r.text || 'Ohne Titel', d, ganztags: nurTag(v),
                    wann: d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) });
            });
        });
        return raus.sort((a, b) => a.d - b.d).slice(0, wieViele);
    };
    const zeichneBaum = () => Seitenleiste.zeichne();
    const handyLeiste = (vorauf) => Seitenleiste.handyLeiste(vorauf);
    const reiterWechseln = (id) => Seitenleiste.reiterWechseln(id);
    const abschnitteAnpassen = () => Seitenleiste.abschnitteAnpassen();
    const abschnittAn = (id) => Seitenleiste.abschnittAn(id);
    const abschnittSchalten = (id) => Seitenleiste.abschnittSchalten(id);
    const ABSCHNITTE = Seitenleiste.ABSCHNITTE;
    const woerterZaehlen = (seiteId) => {
        let n = 0;
        const zaehle = (id, tiefe) => {
            if (tiefe > 4)
                return;
            Store.childrenOf(id).forEach((b) => {
                if (b.type === 'page')
                    return;
                if (b.text)
                    n += b.text.trim().split(/\s+/).filter(Boolean).length;
                if (Array.isArray(b.rows))
                    n += b.rows.flat().join(' ').split(/\s+/).filter(Boolean).length;
                zaehle(b.id, tiefe + 1);
            });
        };
        zaehle(seiteId, 0);
        return n;
    };
    const SPRACHEN = [
        ['Deutsch', 'Deutsch'], ['Englisch', 'English'], ['Französisch', 'Français'],
        ['Italienisch', 'Italiano'], ['Spanisch', 'Español'], ['Portugiesisch', 'Português'],
        ['Niederländisch', 'Nederlands'], ['Polnisch', 'Polski'], ['Türkisch', 'Türkçe'],
        ['Russisch', 'Русский'], ['Japanisch', '日本語'], ['Koreanisch', '한국어'],
        ['Chinesisch (vereinfacht)', '简体中文']
    ];
    const BENACHRICHTIGUNG = { alle: 'Kommentare', erwaehnungen: 'Erwähnungen' };
    const menueZeichen = (name) => {
        try {
            return Register.symbole.alsSvg(name, 16);
        }
        catch {
            return '';
        }
    };
    const mi = (name) => `<span class="mi">${menueZeichen(name)}</span>`;
    const schalterZeile = (a, zeichen, text, an) => `<button data-a="${a}" class="mit-schalter" role="switch" aria-checked="${an ? 'true' : 'false'}">` +
        `${mi(zeichen)}${text}` +
        `<span class="mschalter${an ? ' an' : ''}"><i></i></span></button>`;
    const schalterKippen = (knopf, an) => {
        if (!knopf)
            return;
        knopf.querySelector('.mschalter')?.classList.toggle('an', an);
        knopf.setAttribute('aria-checked', an ? 'true' : 'false');
    };
    const mitKiMenue = (anker, p) => {
        const r = anker.getBoundingClientRect();
        const m = UI.menu('<button data-k="faehig"><span class="mi">🧩</span>Als KI-Fähigkeit verwenden' +
            '<span class="sub">Der Seiteninhalt wird zur Anweisung, aufrufbar mit @</span></button>' +
            '<button data-k="anweisung"><span class="mi">📌</span>Als KI-Anweisung verwenden' +
            '<span class="sub">Gilt dann für jede Antwort</span></button>' +
            '<button data-k="meeting"><span class="mi">🎙</span>Als KI-Meeting-Anweisung verwenden' +
            '<span class="sub">Nur beim Auswerten von Besprechungen</span></button>' +
            '<hr>' +
            '<button data-k="schreiben"><span class="mi">✒️</span>Schreiben und bearbeiten …</button>', r.right + 4, r.top);
        m.addEventListener('click', async (e) => {
            const b = elVon(e)?.closest('button[data-k]');
            if (!b)
                return;
            m.remove();
            const inhalt = markdownVonSeite(p).trim();
            if (b.dataset.k !== 'schreiben' && !inhalt) {
                UI.toast('Diese Seite ist leer — sie kann noch keine Anweisung sein');
                return;
            }
            if (b.dataset.k === 'faehig') {
                const name = await UI.frage('Wie soll die Fähigkeit heissen?', p.text || 'Neue Fähigkeit');
                if (!name)
                    return;
                KI.faehigkeitSichern({ id: 'seite-' + p.id.slice(0, 6), name,
                    icon: p.icon || '🧩', auftrag: inhalt, seiteId: p.id });
                UI.toast('Als Fähigkeit gemerkt: ' + name);
            }
            if (b.dataset.k === 'anweisung') {
                Store.setMeta('ki:persoenlich', inhalt);
                Store.setMeta('ki:anweisungSeite', p.id);
                UI.toast('Diese Seite ist jetzt die dauerhafte Anweisung der KI');
            }
            if (b.dataset.k === 'meeting') {
                Store.setMeta('meeting:anweisung', inhalt);
                Store.setMeta('meeting:anweisungSeite', p.id);
                UI.toast('Gilt ab jetzt beim Auswerten von Besprechungen');
            }
            if (b.dataset.k === 'schreiben')
                KI.schreibMenue(anker);
        });
    };
    const uebersetzenMenue = (anker, p) => {
        const r = anker.getBoundingClientRect();
        const m = UI.menuMitSuche(SPRACHEN.map(([de, eigen]) => `<button data-s="${esc(de)}">${esc(de)}<span class="ms">${esc(eigen)}</span></button>`).join(''), r.right + 4, r.top, { platzhalter: 'Sprache suchen …',
            kopf: '<div class="grp">Übersetzen</div>',
            fuss: 'Übersetzt wird mit dem Modell, das unter <b>Einstellungen → KI</b> eingestellt ist.' });
        m.addEventListener('click', async (e) => {
            const b = elVon(e)?.closest('button[data-s]');
            if (!b)
                return;
            const ziel = b.dataset.s;
            m.remove();
            const text = markdownVonSeite(p);
            if (!text.trim()) {
                UI.toast('Diese Seite ist leer');
                return;
            }
            UI.toast('Übersetze nach ' + ziel + ' …');
            try {
                const auftrag = (typeof Register !== 'undefined' && Register.ki)
                    ? Register.ki.auftrag('uebersetzen', { sprache: ziel })
                    : `Übersetze den Text in diese Sprache: ${ziel}. Gib nur die Übersetzung zurück.`;
                const antwort = await KI.frageKurz(auftrag + ' Behalte die Markdown-Struktur ' +
                    '(Überschriften, Listen, Zitate) genau bei, ohne Vorrede.\n\n' + text);
                if (!antwort) {
                    UI.toast('Keine Antwort erhalten');
                    return;
                }
                const neu = Store.addPage(p.parentId || null, {
                    text: (p.text || 'Ohne Titel') + ' — ' + ziel, icon: '🅰'
                });
                Werkzeuge.ausMarkdown(neu, antwort);
                zeichneBaum();
                oeffne(neu.id);
                UI.toast('Übersetzung als neue Seite angelegt');
            }
            catch (err) {
                UI.toast('Übersetzen ging nicht: ' + (err instanceof Error ? err.message : String(err)));
            }
        });
    };
    const vorschlagModus = (p) => {
        const an = !p.vorschlagModus;
        Store.updateBlock(p.id, { vorschlagModus: an });
        document.getElementById('banner')?.remove();
        if (an) {
            const wer = (Konten.aktiv() || {}).name || 'Ich';
            const b = UI.banner('✍ Vorschlagsmodus an — Änderungen von <b>' + esc(wer) +
                '</b> werden als Vorschläge festgehalten. ' +
                '<u data-a="zeigen">Vorschläge ansehen</u> · <u data-a="ende">Beenden</u>', 'info');
            b.addEventListener('click', e => {
                const ziel = elVon(e);
                const wahl = ziel instanceof HTMLElement ? ziel.dataset.a : '';
                if (wahl === 'zeigen')
                    vorschlaegeZeigen(Store.getBlock(p.id));
                if (wahl === 'ende') {
                    Store.updateBlock(p.id, { vorschlagModus: false });
                    b.remove();
                    zeichneSeite();
                }
            });
        }
        zeichneSeite();
    };
    const vorschlaegeZeigen = (p) => {
        const liste = p.vorschlaege || [];
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder">' +
                `<div class="fh">Vorschläge <em>${liste.length}</em><button class="icon-btn" data-a="zu">✕</button></div>` +
                '<div class="res">' +
                (liste.length
                    ? liste.map((v, i) => '<div class="vor-eintrag">' +
                        `<div class="vor-wer">${esc(v.von)} · ${esc(Werkzeuge.zeitKurz(v.wann))}</div>` +
                        `<div class="vor-alt">${esc(v.alt || '(leer)')}</div>` +
                        `<div class="vor-neu">${esc(v.neu || '(gelöscht)')}</div>` +
                        `<div class="vor-tat"><button data-ok="${i}">Annehmen</button>` +
                        `<button data-weg="${i}">Verwerfen</button></div>` +
                        '</div>').join('')
                    : '<div style="padding:16px;color:var(--text-faint);font-size:14px">' +
                        'Noch keine Vorschläge. Ändere Text, solange der Modus an ist.</div>') +
                '</div>' +
                '<div class="hint">Angenommene Vorschläge werden Teil der Seite, verworfene ' +
                'setzen den alten Text zurück.</div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const ok = elVon(e)?.closest('[data-ok]'), weg = elVon(e)?.closest('[data-weg]');
            if (!ok && !weg)
                return;
            const i = Number((ok || weg)?.dataset[ok ? 'ok' : 'weg']);
            const v = (p.vorschlaege || [])[i];
            if (!v)
                return;
            if (weg && Store.getBlock(v.bid))
                Store.updateBlock(v.bid, { text: v.alt });
            const rest = (p.vorschlaege || []).filter((_, j) => j !== i);
            Store.updateBlock(p.id, { vorschlaege: rest });
            o.remove();
            zeichneSeite();
            vorschlaegeZeigen(Store.getBlock(p.id));
        });
    };
    const updatesUndAnalysen = async (p) => {
        const versionen = (await Store.versionen(p.id)) || [];
        const kinder = Store.childrenOf(p.id);
        const woerter = woerterZaehlen(p.id);
        const komm = Kommentare.offeneAnzahl(p.id);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder">' +
                '<div class="fh">Updates und Analysen<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res" style="padding:14px 16px; font-size:14px; line-height:1.9">' +
                `<div>Aufrufe: <b>${p.aufrufe || 0}</b></div>` +
                `<div>Blöcke: <b>${kinder.length}</b> · Wörter: <b>${woerter}</b></div>` +
                `<div>Offene Kommentare: <b>${komm}</b></div>` +
                `<div>Gespeicherte Fassungen: <b>${versionen.length}</b></div>` +
                `<div>Angelegt: <b>${esc(Einstellungen.datum(new Date(p.created), true))}</b></div>` +
                `<div>Zuletzt bearbeitet: <b>${esc(Einstellungen.datum(new Date(p.edited || p.created), true))}</b>` +
                ` von <b>${esc(p.geaendertVon || p.erstelltVon || 'dir')}</b></div>` +
                '<div style="margin-top:12px"><button data-a="verl" class="btn prim">Versionsverlauf öffnen</button></div>' +
                '</div>' +
                '<div class="hint">Alle Zahlen stammen aus diesem Gerät — es wird nichts gemeldet.</div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="verl"]')) {
                o.remove();
                Werkzeuge.versionen(p);
            }
        });
    };
    const benachrichtigungMenue = (anker, p) => {
        const r = anker.getBoundingClientRect();
        const jetzt = p.benachrichtigung || 'alle';
        const m = UI.menu(`<button data-b="alle">Alle Kommentare${jetzt === 'alle' ? '<span class="ms">✓</span>' : ''}</button>` +
            '<button data-b="erwaehnungen">Antworten und @-Erwähnungen' +
            (jetzt === 'erwaehnungen' ? '<span class="ms">✓</span>' : '') + '</button>' +
            '<div class="menu-fuss">Gilt für diese Seite und alle Unterseiten.</div>', r.right + 4, r.top);
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-b]');
            if (!b)
                return;
            const wahl = b.dataset.b ?? 'alle';
            Store.updateBlock(p.id, { benachrichtigung: wahl });
            m.remove();
            UI.toast('Benachrichtigungen: ' + BENACHRICHTIGUNG[wahl]);
        });
    };
    const verbindungenMenue = (anker, p) => {
        const r = anker.getBoundingClientRect();
        const dienste = Verbindungen.DIENSTE || [];
        const zst = Verbindungen.zustand();
        const drin = p.verbindungen || [];
        const m = UI.menu('<div class="grp">Verbindungen</div>' +
            (dienste.length
                ? dienste.map(d => `<button data-v="${d.id}"><span class="mi">${d.icon || '⊞'}</span>${esc(d.name || d.id)}` +
                    `<span class="ms">${drin.includes(d.id) ? 'verknüpft'
                        : ((zst[d.id] || {}).verbunden ? 'bereit' : 'aus')}</span></button>`).join('')
                : '<div class="menu-fuss">Keine</div>') +
            '<hr><button data-v="__einst"><span class="mi">⚙</span>Verbindungen einrichten …</button>', r.right + 4, r.top);
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-v]');
            if (!b)
                return;
            m.remove();
            if (b.dataset.v === '__einst') {
                einstellungen('verbindungen');
                return;
            }
            const id = b.dataset.v;
            const neu = drin.includes(id) ? drin.filter((x) => x !== id) : [...drin, id];
            Store.updateBlock(p.id, { verbindungen: neu });
            const name = (dienste.find(d => d.id === id) || {}).name || id;
            UI.toast(neu.includes(id) ? 'Seite mit ' + name + ' verknüpft' : 'Verknüpfung zu ' + name + ' gelöst');
        });
    };
    const favoritKippen = (p) => {
        const jetzt = Store.getBlock(p.id) || p;
        const neu = !jetzt.favorite;
        Store.updateBlock(p.id, { favorite: neu });
        p.favorite = neu;
        zeichneBaum();
        zeichneCrumbs();
        return neu;
    };
    const nachAenderung = (p) => {
        zeichneBaum();
        const aufDerSeite = !!p && !!seiteId &&
            Store.pathOf(String(p.id)).some((x) => x && x.id === seiteId);
        if (sonder || !p || aufDerSeite)
            zeichneSeite();
        else
            zeichneCrumbs();
    };
    const nameSaeubern = (roh) => {
        const s = String(roh ?? '').normalize('NFC')
            .replace(/[\r\n\t\u2028\u2029\u0085]/g, ' ')
            .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        const zeichen = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
            ? [...new Intl.Segmenter('de', { granularity: 'grapheme' }).segment(s)].map(g => g.segment)
            : [...s];
        return zeichen.slice(0, 200).join('').trim();
    };
    const darfBearbeiten = (id) => typeof Konten === 'undefined' || typeof Konten.darf !== 'function' || !!Konten.darf('bearbeiten', id);
    const gleichnamig = (p, name) => {
        const klein = name.toLocaleLowerCase('de');
        return Object.values(Store.cache.blocks).find(b => b && b.id !== p.id && b.type === 'page' && b.alive !== false &&
            (b.parentId ?? null) === (p.parentId ?? null) &&
            (b.parentTable === 'collection') === (p.parentTable === 'collection') &&
            String(b.text || '').trim().toLocaleLowerCase('de') === klein) || null;
    };
    const umbenennen = async (p, anker, titel = 'Neuer Name') => {
        const id = String(p?.id || '');
        const jetzt = id ? Store.getBlock(id) : null;
        if (!jetzt)
            return false;
        if (!darfBearbeiten(id)) {
            UI.toast('Umbenennen geht hier nicht — dir fehlt das Recht, diese Seite zu bearbeiten.');
            if (anker instanceof HTMLElement && anker.isConnected)
                anker.focus({ preventScroll: true });
            return false;
        }
        const zurueck = () => {
            let ziel = anker instanceof Element ? anker : null;
            if (ziel && !ziel.isConnected && ziel.classList[0]) {
                const k = '.' + CSS.escape(ziel.classList[0]);
                const i = CSS.escape(id);
                ziel = document.querySelector(`${k}[data-id="${i}"], ${k}[data-baum-id="${i}"], ` +
                    `${k}[data-mehr="${i}"], ${k}[data-mehr-fach="${i}"], ${k}[data-mehr-id="${i}"]`);
            }
            if (ziel instanceof HTMLElement && ziel.isConnected)
                ziel.focus({ preventScroll: true });
        };
        const alt = String(jetzt.text || '');
        let vorgabe = alt;
        let leerGefragt = false;
        for (let runde = 0; runde < 6; runde++) {
            const antwort = await UI.frage(titel, vorgabe);
            if (antwort === null || antwort === undefined) {
                zurueck();
                return false;
            }
            const name = nameSaeubern(antwort);
            if (!name) {
                UI.toast('Ein Name braucht mindestens ein Zeichen — „' + (alt || 'Ohne Titel') + '" bleibt.');
                if (leerGefragt) {
                    zurueck();
                    return false;
                }
                leerGefragt = true;
                vorgabe = alt;
                continue;
            }
            if (name === alt) {
                zurueck();
                return false;
            }
            const doppelt = gleichnamig(jetzt, name);
            if (doppelt) {
                const wahl = await Dialog.wahl({
                    titel: 'Den Namen gibt es hier schon',
                    text: 'Im selben Ordner gibt es schon „' + String(doppelt.text || '').trim() + '".',
                    knoepfe: [
                        { id: 'anders', text: 'Anderen Namen wählen' },
                        { id: 'trotzdem', text: 'Trotzdem so nennen', hinweis: 'Zwei Einträge heissen dann gleich' }
                    ]
                });
                if (wahl === 'anders') {
                    vorgabe = name;
                    continue;
                }
                if (wahl !== 'trotzdem') {
                    zurueck();
                    return false;
                }
            }
            Store.updateBlock(id, { text: name });
            nachAenderung(Store.getBlock(id));
            zurueck();
            return true;
        }
        zurueck();
        return false;
    };
    const unterseitenZahl = (id) => {
        let n = 0;
        const gesehen = new Set();
        const gehe = (x) => {
            if (gesehen.has(x))
                return;
            gesehen.add(x);
            for (const k of Store.childrenOf(x)) {
                if (!k || k.alive === false)
                    continue;
                if (k.type === 'page')
                    n++;
                gehe(String(k.id));
            }
        };
        gehe(id);
        return n;
    };
    const inPapierkorb = (p, opt = {}) => {
        const id = String(p?.id || '');
        const b = id ? Store.getBlock(id) : null;
        if (!b || b.alive === false)
            return false;
        if (!darfBearbeiten(id)) {
            if (!opt.ruhig)
                UI.toast('In den Papierkorb geht hier nicht — dir fehlt das Recht, diese Seite zu bearbeiten.');
            return false;
        }
        const eltern = b.parentId ? Store.getBlock(b.parentId) : null;
        const stelle = eltern && Array.isArray(eltern.content) ? eltern.content.indexOf(id) : -1;
        const istSeite = b.type === 'page' || b.type === 'database';
        const sammlung = b.type === 'database' && b.collectionId ? Store.getCollection(b.collectionId) : null;
        const name = String(b.text || '').trim() || String(sammlung?.name || '').trim() ||
            (b.type === 'page' ? 'Ohne Titel' : '');
        const unter = b.type === 'page' ? unterseitenZahl(id) : 0;
        Store.trashBlock(id);
        if (id === seiteId && !sonder) {
            const e2 = Store.rootPages()[0];
            oeffne(e2 ? e2.id : null);
        }
        else
            nachAenderung(b);
        if (opt.ruhig)
            return true;
        const satz = opt.satz ? opt.satz
            : !istSeite || !name ? 'Block liegt im Papierkorb'
                : unter ? '„' + name + '" und ' + unter + (unter === 1 ? ' Unterseite liegen' : ' Unterseiten liegen') + ' im Papierkorb'
                    : '„' + name + '" liegt im Papierkorb';
        UI.toast(satz, 6000, { aktion: { text: 'Rückgängig', tun: () => {
                    const jetzt = Store.getBlock(id);
                    if (!jetzt || jetzt.alive !== false)
                        return;
                    Store.restoreBlock(id);
                    const e = jetzt.parentId ? Store.getBlock(jetzt.parentId) : null;
                    if (e && Array.isArray(e.content) && stelle >= 0) {
                        const ohne = e.content.filter((x) => x !== id);
                        ohne.splice(Math.min(stelle, ohne.length), 0, id);
                        Store.updateBlock(e.id, { content: ohne });
                    }
                    nachAenderung(Store.getBlock(id));
                    UI.toast(istSeite && name ? '„' + name + '" ist zurück' : 'Block ist zurück');
                } } });
        return true;
    };
    const ZUR_QUELLE = {
        fav: 'favorit', rename: 'umbenennen', icon: 'symbol', dup: 'duplizieren',
        link: 'link', del: 'papierkorb', 'wz-verschieben': 'verschieben'
    };
    const seitenMenue = (anker, p) => {
        const r = anker.getBoundingClientRect();
        const bereichAnzahl = typeof Lebensbereiche !== 'undefined'
            ? Lebensbereiche.direkteBereichIds(p).length : 0;
        const m = UI.menuMitSuche('<div class="schrift-kacheln">' +
            [['default', 'Ag', 'Standard'], ['serif', 'Ag', 'Serife'], ['mono', 'Ag', 'Mono']]
                .map(([id, ag, n]) => `<button data-schrift="${id}" class="${(p.font || 'default') === id ? 'on' : ''}">` +
                `<b class="sk-${id}">${ag}</b><span>${n}</span></button>`).join('') +
            '</div>' +
            '<button data-a="link">' + mi('link') + 'Link kopieren<span class="ms">Strg Alt L</span></button>' +
            '<button data-a="inhalt">' + mi('clipboard') + 'Seiteninhalte kopieren</button>' +
            '<button data-a="dup">' + mi('copy') + 'Duplizieren<span class="ms">Strg D</span></button>' +
            '<button data-a="wz-verschieben">' + mi('moveTo') + 'Verschieben nach<span class="ms">Strg ⇧ P</span></button>' +
            `<button data-a="archiv">${mi('archive')}${p.archiviert ? 'Aus dem Archiv holen' : 'Archivieren'}</button>` +
            '<button data-a="del" data-gefahr>' + mi('trash') + 'In den Papierkorb verschieben<span class="ms">Entf</span></button>' +
            '<hr>' +
            '<button data-a="wz-praesi">' + mi('play') + 'Präsentieren' +
            '<span class="kenn">Beta</span><span class="ms">Strg Alt P</span></button>' +
            schalterZeile('klein', 'textSize', 'Kleiner Text', p.small) +
            schalterZeile('breit', 'widthWide', 'Volle Breite', p.wide) +
            schalterZeile('pfad', 'crumbs', 'Pfadnavigation anzeigen', p.pfad !== false) +
            '<button data-a="anpassen">' + mi('settings') + 'Seite anpassen<span class="ms">▸</span></button>' +
            '<hr>' +
            '<button data-a="offline">' + mi('download') + 'Offline verfügbar' +
            '<span class="ms">immer</span></button>' +
            '<hr>' +
            schalterZeile('wz-gesperrt', 'lock', 'Seite sperren', p.gesperrt) +
            '<button data-a="mitki">' + mi('sparkle') + 'Mit KI verwenden<span class="ms">▸</span></button>' +
            '<hr>' +
            ((UI.amTelefon() || (typeof Ruhig !== 'undefined' && Ruhig.an()))
                ? '<button data-a="teilen">' + mi('share') + 'Teilen und ausgeben</button>' +
                    '<button data-a="verlauf">' + mi('history') + 'Versionsverlauf</button>' +
                    '<button data-a="kopf-komm">' + mi('comment') + 'Kommentare</button>' +
                    '<button data-a="auto">' + mi('bolt') + 'Automationen</button><hr>'
                : '') +
            `<button data-a="fav">${mi('star')}` +
            `${p.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}</button>` +
            `<button data-a="produkt-bereiche">${mi('circleDot')}Lebensbereiche` +
            `<span class="ms">${bereichAnzahl || 'Keine'} ▸</span></button>` +
            '<button data-a="rename">' + mi('pencil') + 'Umbenennen</button>' +
            '<button data-a="icon">' + mi('smile') + 'Symbol ändern</button>' +
            '<button data-a="cover">' + mi('image') + 'Cover ändern</button>' +
            '<button data-a="pid">' + mi('hash') + 'Seiten-ID kopieren</button>' +
            '<button data-a="komm">' + mi('comment') + 'Kommentare</button>' +
            `<button data-a="vorschlag">${mi('suggest')}Änderungen vorschlagen` +
            `<span class="ms">${p.vorschlagModus ? 'an' : 'aus'}</span></button>` +
            ((p.vorschlaege || []).length
                ? `<button data-a="vorschlaege">${mi('tasks')}Vorschläge ansehen` +
                    `<span class="ms">${p.vorschlaege.length}</span></button>` : '') +
            '<button data-a="uebersetzen">' + mi('translate') + 'Übersetzen<span class="ms">▸</span></button>' +
            '<button data-a="undo">' + mi('undo') + 'Rückgängig machen<span class="ms">Strg Z</span></button>' +
            '<hr>' +
            '<button data-a="export">' + mi('download') + 'Als Markdown</button>' +
            '<button data-a="import">' + mi('upload') + 'Markdown einlesen</button>' +
            Werkzeuge.seitenMenueZusatz(p) +
            '<hr>' +
            `<button data-a="stat2">${mi('eye')}Seitenaufrufe<span class="ms">${p.aufrufe || 0}</span></button>` +
            '<button data-a="updates">' + mi('clock') + 'Updates und Analysen</button>' +
            `<button data-a="benach">${mi('bell')}Benachrichtigungen` +
            `<span class="ms">${BENACHRICHTIGUNG[p.benachrichtigung || 'alle']} ▸</span></button>` +
            `<button data-a="verbind">${mi('plug')}Verbindungen` +
            `<span class="ms">${(p.verbindungen || []).length || 'Keine'} ▸</span></button>` +
            '<button data-a="papier">' + mi('trash') + 'Gelöschte Seiten</button>', r.right + 4, r.top, { platzhalter: 'Suchaktionen …', titel: 'Aktionen',
            anker,
            tropfen: [
                { id: 'wz-praesi', name: 'Präsentieren', zeichen: 'play', ziel: '[data-a="wz-praesi"]' },
                { id: 'merkzeichen', name: 'Merkzeichen', zeichen: 'bookmark', an: !!p.favorite,
                    kippen: () => {
                        const an = favoritKippen(p);
                        const eintrag = document.querySelector('.menu .menu-liste [data-a="fav"]');
                        if (eintrag)
                            eintrag.innerHTML = mi('star') + (an ? 'Aus Favoriten entfernen' : 'Zu Favoriten');
                        return an;
                    } },
                { id: 'teilen', name: 'Teilen und ausgeben', zeichen: 'share', ziel: '[data-a="teilen"]',
                    tun: () => Werkzeuge.teilenMenue(anker, p) }
            ],
            fuss: `Wortzahl: <b>${woerterZaehlen(p.id)}</b> Wörter<br>` +
                `Zuletzt bearbeitet von <b>${esc(p.geaendertVon || p.erstelltVon || 'dir')}</b><br>` +
                esc(Einstellungen.datum(new Date(p.edited || p.created), true)) });
        Menue.aufgeklappt(anker instanceof HTMLElement ? anker : null, m);
        m.addEventListener('click', async (e) => {
            const sk = elVon(e)?.closest('button[data-schrift]');
            if (sk) {
                Store.updateBlock(p.id, { font: sk.dataset.schrift });
                m.querySelectorAll('[data-schrift]').forEach(x => x.classList.remove('on'));
                sk.classList.add('on');
                zeichneSeite();
                return;
            }
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            const a = b.dataset.a;
            const quelle = ZUR_QUELLE[a || ''];
            if (quelle) {
                m.remove();
                Register.aktionen.tun(quelle, Store.getBlock(p.id) || p, { kontext: 'seite', anker });
                return;
            }
            if (a === 'inhalt') {
                const text = markdownVonSeite(p);
                Ablage.kopiereJetzt(text, 'Seiteninhalte kopiert — ' + text.split('\n').length + ' Zeilen');
                m.remove();
                return;
            }
            if (a === 'offline') {
                UI.toast('Alles liegt ohnehin auf diesem Gerät — auch ohne Netz.');
                return;
            }
            if (a === 'breit') {
                schalterKippen(b, volleBreite(p));
                return;
            }
            if (a === 'klein' || a === 'wz-gesperrt' || a === 'pfad') {
                const feld = a === 'klein' ? 'small'
                    : a === 'pfad' ? 'pfad' : 'gesperrt';
                const neu = a === 'pfad' ? !(p.pfad !== false) : !p[feld];
                Store.updateBlock(p.id, { [feld]: neu });
                p[feld] = neu;
                schalterKippen(b, neu);
                zeichneSeite();
                return;
            }
            if (a === 'archiv') {
                m.remove();
                const neu = !p.archiviert;
                Store.updateBlock(p.id, { archiviert: neu, archiviertAm: neu ? Store.now() : '' });
                zeichneBaum();
                if (neu && p.id === seiteId) {
                    const e2 = Store.rootPages().find(x => !x.archiviert && x.id !== p.id);
                    oeffne(e2 ? e2.id : null);
                }
                else
                    zeichneSeite();
                UI.toast(neu
                    ? 'Archiviert — liegt weiter im Papierkorb-Menü unter „Archiv"'
                    : 'Aus dem Archiv geholt');
                return;
            }
            if (a === 'mitki') {
                m.remove();
                mitKiMenue(anker, p);
                return;
            }
            if (a === 'stil') {
                m.innerHTML = '<div class="grp">Schrift</div>' +
                    '<button data-f="default">Standard</button><button data-f="serif">Serif</button>' +
                    '<button data-f="mono">Monospace</button>';
                m.addEventListener('click', ev => {
                    const f = elVon(ev)?.closest('button[data-f]');
                    if (!f)
                        return;
                    Store.updateBlock(p.id, { font: f.dataset.f });
                    m.remove();
                    zeichneSeite();
                });
                return;
            }
            if (a === 'anpassen') {
                m.innerHTML = '<div class="grp">Was auf der Seite erscheint</div>' +
                    `<button data-o="rueck">Rückverweise<span class="ms">${p.ohneRueck ? 'aus' : 'an'}</span></button>` +
                    `<button data-o="werkzeuge">Werkzeugzeile<span class="ms">${p.ohneTools ? 'aus' : 'an'}</span></button>` +
                    `<button data-o="gesperrt">Bearbeiten<span class="ms">${p.gesperrt ? 'gesperrt' : 'erlaubt'}</span></button>`;
                m.addEventListener('click', ev => {
                    const o = elVon(ev)?.closest('button[data-o]');
                    if (!o)
                        return;
                    if (o.dataset.o === 'rueck')
                        Store.updateBlock(p.id, { ohneRueck: !p.ohneRueck });
                    if (o.dataset.o === 'werkzeuge')
                        Store.updateBlock(p.id, { ohneTools: !p.ohneTools });
                    if (o.dataset.o === 'gesperrt')
                        Store.updateBlock(p.id, { gesperrt: !p.gesperrt });
                    m.remove();
                    zeichneSeite();
                });
                return;
            }
            if (a === 'cover') {
                m.remove();
                coverWaehlen(p);
                return;
            }
            m.remove();
            if (a === 'produkt-bereiche') {
                await Produktwelten.bereicheDialog(p);
                return;
            }
            if (Werkzeuge.seitenMenueAktion(a, p))
                return;
            if (a === 'teilen') {
                Werkzeuge.teilenMenue(anker, p);
                return;
            }
            if (a === 'verlauf') {
                Werkzeuge.versionen(p);
                return;
            }
            if (a === 'kopf-komm') {
                document.getElementById('btn-komm')?.click();
                return;
            }
            if (a === 'auto') {
                document.getElementById('btn-auto')?.click();
                return;
            }
            if (a === 'klein') {
                Store.updateBlock(p.id, { small: !p.small });
                zeichneSeite();
            }
            if (a === 'breit') {
                volleBreite(p);
            }
            if (a === 'pid') {
                Ablage.kopiereJetzt(p.id, 'Seiten-ID kopiert: ' + p.id);
            }
            if (a === 'komm')
                Kommentare.panel(p.id);
            if (a === 'vorschlag')
                vorschlagModus(p);
            if (a === 'vorschlaege')
                vorschlaegeZeigen(p);
            if (a === 'uebersetzen')
                uebersetzenMenue(anker, p);
            if (a === 'undo')
                Verlauf.zurueck();
            if (a === 'updates')
                updatesUndAnalysen(p);
            if (a === 'benach')
                benachrichtigungMenue(anker, p);
            if (a === 'verbind')
                verbindungenMenue(anker, p);
            if (a === 'export')
                markdownExport(p);
            if (a === 'import') {
                const inp = document.createElement('input');
                inp.type = 'file';
                inp.accept = '.md,.markdown,.txt';
                inp.addEventListener('change', async () => {
                    const f = inp.files?.[0];
                    if (!f)
                        return;
                    Werkzeuge.ausMarkdown(p, await f.text());
                    zeichneSeite();
                    UI.toast('Markdown eingelesen');
                });
                inp.click();
            }
            if (a === 'stat2') {
                UI.toast(`Diese Seite wurde ${p.aufrufe || 0}-mal geöffnet · zuletzt geändert ` +
                    Werkzeuge.zeitKurz(p.edited));
            }
            if (a === 'papier')
                papierkorb();
        });
    };
    const dupliziereSeite = (id, zielEltern) => {
        const daten = Store.baum(id);
        const neu = Store.baumEinfuegen(daten, zielEltern);
        if (neu)
            Store.updateBlock(neu.id, { text: (Store.getBlock(id).text || 'Ohne Titel') + ' (Kopie)' });
        return neu;
    };
    let sonder = null;
    const SCHAUPLATZ_NAMEN = {
        'Lernen & Alltag': 'heute', 'Heute': 'heute', 'Start': 'heute',
        'Lernzentrum': 'lernen',
        'Bibliothek': 'bibliothek', 'Alle Seiten': 'bibliothek',
        'Dokumente': 'bibliothek', 'Seiten': 'bibliothek',
        'Seiten & Wissen': 'bibliothek', 'Dateien & PDFs': 'bibliothek',
        'Datenbanken': 'bibliothek', 'Whiteboards': 'bibliothek',
        'Wissen & Verweise': 'bibliothek', 'Vorlagen': 'bibliothek',
        'Notizhefte': 'notizhefte',
        'Arbeitsbereich': 'bibliothek', 'Workspace': 'bibliothek',
        'Meine Aufgaben': 'aufgaben',
        'Aufgaben': 'aufgaben', 'Posteingang': 'posteingang',
        'Elektrotechnik': 'elektro', 'Elektro': 'elektro',
        'Papierkorb': 'papierkorb', 'Kalender': 'kalender', 'Termine': 'kalender'
    };
    const schauplatz = () => {
        if (seiteId)
            return 'seite';
        if (!sonder)
            return 'leer';
        const titel = String(sonder.titel || '');
        if (SCHAUPLATZ_NAMEN[titel])
            return SCHAUPLATZ_NAMEN[titel];
        return titel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
            || 'leer';
    };
    let letzterSchauplatz = '';
    const schauplatzMelden = () => {
        const jetzt = schauplatz();
        let adr = '';
        try {
            adr = String(location.hash || '');
        }
        catch {
            adr = '';
        }
        const merkmal = jetzt + '|' + String(seiteId || '') + '|' + adr;
        if (merkmal === letzterSchauplatz)
            return;
        letzterSchauplatz = merkmal;
        try {
            window.dispatchEvent(new CustomEvent('redion:schauplatz', { detail: jetzt }));
        }
        catch { }
    };
    const zeigeSonder = (titel, zeichner, adresse) => {
        let jetzt = '';
        try {
            jetzt = String(location.hash || '');
        }
        catch {
            jetzt = '';
        }
        const woanders = typeof adresse === 'string' && adresse !== '' && adresse !== jetzt;
        if (seiteId || !sonder || sonder.titel !== titel || woanders)
            navMerken();
        sonder = { titel, zeichner };
        seiteId = null;
        navKnoepfeStellen();
        const ort = titel.toLowerCase().replace(/[^a-z]+/g, '-');
        location.hash = '#' + ort;
        Store.setMeta('zuletztOrt', ort);
        zeichneBaum();
        zeichneSeite();
        schauplatzMelden();
        const scr = document.getElementById('scroll');
        if (scr)
            scr.scrollTop = 0;
    };
    const sonderTitel = (titel, vorher, zeichner) => {
        if (seiteId || !sonder || !titel || sonder.titel !== vorher)
            return false;
        if (typeof zeichner === 'function')
            sonder = { ...sonder, zeichner };
        if (titel === vorher)
            return true;
        sonder = { ...sonder, titel };
        zeichneCrumbs();
        schauplatzMelden();
        return true;
    };
    const oeffne = (id) => {
        if (sonder || seiteId !== id)
            navMerken();
        sonder = null;
        if (seiteId && seiteId !== id)
            Werkzeuge.versionAutomatisch(seiteId);
        seiteId = id;
        navKnoepfeStellen();
        if (id) {
            const p = Store.getBlock(id);
            if (p)
                Store.updateBlock(id, { aufrufe: (p.aufrufe || 0) + 1, zuletztGeoeffnet: Store.now() });
        }
        Store.setMeta('letzte', id);
        Store.setMeta('zuletztOrt', id ? 'seite' : 'leer');
        if (id)
            kuerzlichMerken(id);
        location.hash = id || '';
        zeichneBaum();
        zeichneSeite();
        schauplatzMelden();
        if (typeof Fenster !== 'undefined' && id)
            Fenster.gemerkt(id);
        const scr = document.getElementById('scroll');
        if (scr)
            scr.scrollTop = 0;
    };
    let kiVorDokument = false;
    let warImDokument = false;
    const kiAmDokumentAnpassen = (imDokument) => {
        if (imDokument === warImDokument)
            return;
        warImDokument = imDokument;
        const feld = document.getElementById('ai');
        if (!feld)
            return;
        if (imDokument) {
            kiVorDokument = feld.classList.contains('open');
            if (kiVorDokument)
                kiPanel(false);
        }
        else if (kiVorDokument) {
            kiVorDokument = false;
            kiPanel(true);
        }
    };
    let gezeichnetAls = '';
    const zeichneSeite = (fokus = null, wo = 'anfang') => {
        const wrap = document.getElementById('page');
        if (!wrap)
            return;
        delete document.body.dataset['dokument'];
        delete document.body.dataset['foliensatz'];
        kiAmDokumentAnpassen(false);
        if (sonder) {
            gezeichnetAls = '';
            wrap.className = 'wide';
            wrap.innerHTML = '';
            document.body.dataset.font = 'default';
            document.body.dataset.small = '';
            sonder.zeichner(wrap);
            zeichneCrumbs();
            return;
        }
        const p = seiteId ? Store.getBlock(seiteId) : null;
        if (!p) {
            gezeichnetAls = '';
            Inhaltsflaeche.leer(wrap);
            zeichneCrumbs();
            return;
        }
        const ansicht = typeof Seitenansicht !== 'undefined' ? Seitenansicht.art(p) : 'redion';
        const rolle = document.getElementById('scroll');
        const als = p.id + '|' + ansicht + '|' + (DocumentMode.active(p) ? 'dokument' : 'seite');
        const lesestelle = als === gezeichnetAls && rolle ? rolle.scrollTop : 0;
        gezeichnetAls = als;
        wrap.className = (p.wide || ansicht === 'flaeche' ? 'wide' : '') +
            (ansicht === 'flaeche' ? ' flaeche-page' : '');
        document.body.dataset.font = p.font || 'default';
        document.body.dataset.small = p.small ? '1' : '';
        wrap.innerHTML = '';
        if (typeof Seitenansicht !== 'undefined')
            Seitenansicht.schalter(wrap, p);
        if (!Kopfleiste.zeichne(wrap, p)) {
            zeichneCrumbs();
            return;
        }
        if (DocumentMode.active(p)) {
            wrap.className = 'wide document-page';
            wrap.innerHTML = '';
            document.body.dataset['dokument'] = 'an';
            const folien = typeof Folienvorlagen !== 'undefined' &&
                Folienvorlagen.istFoliensatz(p.id);
            if (folien)
                document.body.dataset['foliensatz'] = 'an';
            else
                delete document.body.dataset['foliensatz'];
            kiAmDokumentAnpassen(true);
            DocumentMode.render(wrap, p);
        }
        else {
            DocumentMode.freigeben?.();
            if (ansicht === 'flaeche' && typeof Seitenflaeche !== 'undefined') {
                Seitenflaeche.zeichne(wrap, p);
            }
            else {
                Inhaltsflaeche.zeichne(wrap, p);
            }
        }
        zeichneCrumbs();
        streifenZeichnen();
        if (lesestelle > 0 && rolle && !DocumentMode.active(p))
            rolle.scrollTop = lesestelle;
        if (fokus) {
            Blocks.zeichneFuer(fokus);
            const ct = document.querySelector(`[data-bid="${fokus}"] .ct`);
            if (ct instanceof HTMLElement) {
                if (wo === 'ende')
                    Blocks.cursorAnsEnde(ct);
                else
                    ct.focus();
            }
        }
    };
    const zeichneCrumbs = () => Kopfleiste.pfad();
    const coverWaehlen = (p) => Kopfleiste.coverWaehlen(p);
    const streifenZeichnen = () => Inhaltsflaeche.streifen();
    const suche = (vorgabe, opt = {}) => {
        const dokMod = typeof DocumentMode !== 'undefined' ? DocumentMode : null;
        const offenSeite = seiteId ? Store.getBlock(seiteId) : null;
        const imDokument = !!(offenSeite && dokMod && document.body.dataset['dokument'] === 'an' &&
            dokMod.active(offenSeite));
        const regal = !imDokument && typeof Bibliothek !== 'undefined' && Bibliothek.suchBereich
            ? Bibliothek.suchBereich() : null;
        const bereiche = imDokument
            ? [{ id: 'dokument', name: 'Dieses Dokument', zeichen: 'page' },
                { id: 'dokumente', name: 'Alle Dokumente', zeichen: 'pages' },
                { id: 'ueberall', name: 'Überall', zeichen: 'globe' }]
            : regal
                ? [{ id: 'bibliothek', name: regal.name, zeichen: 'library' },
                    { id: 'ueberall', name: 'Überall', zeichen: 'globe' }]
                : [];
        const gewuenscht = bereiche.find(b => b.id === opt.bereich);
        let bereich = gewuenscht ? gewuenscht.id
            : imDokument && dokMod ? dokMod.findBereich() : regal ? 'bibliothek' : 'ueberall';
        const vorher = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
            ? document.activeElement : null;
        const eng = matchMedia('(max-width:760px)').matches;
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder such" style="width:min(820px,95vw)">' +
                '<input id="q" placeholder="' + (eng ? 'Seiten, Zeilen und Inhalte suchen'
                : 'Suchen — z. B. titel:&quot;Projekt&quot;, tag:arbeit, geändert:heute, status:offen') +
                '" autocomplete="off">' +
                (bereiche.length ? '<div class="such-bereich"></div>' : '') +
                '<div class="such-filter">' +
                '<select id="f-wo"><option value="alles">Titel und Inhalt</option>' +
                '<option value="titel">nur Titel</option><option value="inhalt">nur Inhalt</option></select>' +
                '<select id="f-typ"><option value="alles">Alle Seiten</option>' +
                '<option value="seite">ohne Datenbank</option><option value="datenbank">mit Datenbank</option></select>' +
                '<select id="f-seit"><option value="alles">Jederzeit</option>' +
                '<option value="tag">heute geändert</option><option value="woche">diese Woche</option>' +
                '<option value="monat">dieser Monat</option></select>' +
                '<select id="f-ort"><option value="">Alle Orte</option>' +
                Store.rootPages().map(p2 => `<option value="${p2.id}">in ${esc(p2.text || 'Ohne Titel')}</option>`).join('') +
                '</select>' +
                '</div>' +
                '<div class="such-koerper">' +
                '<div class="res" id="res"></div>' +
                '<div class="such-vorschau" id="vorschau"></div>' +
                '</div>' +
                '<div class="hint">' +
                '<span class="hint-tasten">↑ ↓ auswählen · Enter öffnen · Esc schliessen · </span>' +
                '<span class="hint-befehle">Beispiele: <code>titel:&quot;Projekt&quot;</code> ' +
                '<code>tag:arbeit</code> <code>typ:seite</code> <code>geändert:heute</code> ' +
                '<code>status:offen</code></span></div>' +
                '</div>';
        document.body.appendChild(o);
        const kapsel = ['studio-search', 'btn-suche-handy', 'mb-suche']
            .map(id => document.getElementById(id))
            .find(k => !!k && k.offsetParent !== null && k.getBoundingClientRect().width > 0);
        const scheibe = o.querySelector('.finder.such');
        if (scheibe && kapsel)
            SelectionFlow.growFrom(scheibe, kapsel.getBoundingClientRect());
        const inp = o.querySelector('#q');
        const res = o.querySelector('#res');
        if (!inp || !res)
            return;
        let treffer = [];
        let i = 0;
        let queryError = '';
        const imBereich = (id) => bereich !== 'bibliothek' || !regal || regal.passt(Store.getBlock(String(id || '')));
        const platzhalterUeberall = inp.placeholder;
        const bereichAnwenden = () => {
            const titel = offenSeite ? String(offenSeite.text || 'Ohne Titel') : '';
            inp.placeholder = bereich === 'dokument' ? 'In „' + titel + '" suchen'
                : bereich === 'dokumente' ? 'In allen Dokumenten suchen'
                    : bereich === 'bibliothek' && regal
                        ? (regal.name === 'Bibliothek' ? 'In der Bibliothek suchen' : regal.name + ' suchen')
                        : platzhalterUeberall;
            const filter = o.querySelector('.such-filter');
            if (filter)
                filter.hidden = bereich === 'dokument' || bereich === 'dokumente';
        };
        const bereichPlatz = o.querySelector('.such-bereich');
        if (bereichPlatz && bereiche.length) {
            const griff = Segment.bauen({
                name: 'Wo suchen',
                wahlen: bereiche.map(b => ({ id: b.id, name: b.name, zeichen: b.zeichen })),
                gewaehlt: bereich,
                gewechselt: (id) => {
                    const neu = bereiche.find(b => b.id === id);
                    if (!neu)
                        return;
                    bereich = neu.id;
                    if (imDokument && dokMod && bereich !== 'bibliothek')
                        dokMod.findBereichMerken(bereich);
                    bereichAnwenden();
                    suchen();
                    inp.focus();
                }
            });
            bereichPlatz.append(griff.element);
        }
        bereichAnwenden();
        let leisteBenutzt = false;
        const schliessen = () => {
            o.remove();
            if (leisteBenutzt && offenSeite && dokMod) {
                void dokMod.findenIn(String(offenSeite.id), inp.value.trim(), { fokus: true });
                return;
            }
            if (vorher && vorher.isConnected)
                vorher.focus({ preventScroll: true });
        };
        const trefferOeffnen = (t2) => {
            if (t2 && t2.dokumentZahl !== undefined && dokMod) {
                o.remove();
                void dokMod.findenIn(String(t2.page.id), inp.value.trim(), { springen: true, fokus: true });
                return;
            }
            zumTreffer(t2);
            o.remove();
        };
        const letzteSuchen = () => {
            try {
                return (Store.getMeta('suchverlauf', []) || []).slice(0, 6);
            }
            catch {
                return [];
            }
        };
        const merkeSuche = (wort) => {
            const w = String(wort || '').trim();
            if (w.length < 2)
                return;
            const alt2 = letzteSuchen().filter(x => x.toLowerCase() !== w.toLowerCase());
            try {
                Store.setMeta('suchverlauf', [w, ...alt2].slice(0, 12));
            }
            catch { }
        };
        const verlaufBlock = () => {
            if (inp.value)
                return '';
            const w = letzteSuchen();
            if (!w.length)
                return '';
            return '<div class="such-verlauf"><div class="sv-kopf">Zuletzt gesucht</div>' +
                '<div class="sv-marken">' +
                w.map(x => `<button data-wort="${esc(x)}">${esc(x)}</button>`).join('') +
                '</div></div>';
        };
        const verlaufBinden = () => {
            res.querySelectorAll('[data-wort]').forEach(b => {
                b.addEventListener('click', () => {
                    inp.value = b.dataset['wort'] || '';
                    inp.dispatchEvent(new Event('input'));
                    inp.focus();
                });
            });
        };
        const zeichne = () => {
            if (!treffer.length) {
                res.innerHTML = queryError
                    ? '<div class="such-leer" role="alert" data-query-error><b>Abfrage nicht verstanden</b>' +
                        `<span>${esc(queryError)}</span></div>`
                    : inp.value
                        ? '<div class="such-leer"><b>Nichts gefunden</b>' +
                            '<span>Versuche einen anderen Begriff — oder suche in den Befehlen ' +
                            'mit <code>Strg ⇧ K</code>.</span></div>'
                        : verlaufBlock();
                verlaufBinden();
                return;
            }
            res.innerHTML = verlaufBlock() + treffer.map((t, k) => `<button data-i="${k}" ${k === i ? 'class="on"' : ''}` +
                (t.dokumentZahl !== undefined ? ` data-dokument-zahl="${Number(t.dokumentZahl)}"` : '') + '>' +
                `<span>${t.page.icon || '📄'}</span>` +
                `<span style="flex:1"><span>${esc(t.page.text || 'Ohne Titel')}</span>` +
                (t.pfad ? `<span class="snip pfad">${esc(t.pfad)}</span>` : '') +
                (t.snippet && (t.treffer === 'Inhalt' || t.blockId || t.dokumentZahl !== undefined)
                    ? `<span class="snip">${esc(t.snippet)}</span>` : '') +
                `</span><span class="pth">${t.treffer}</span></button>`).join('');
            verlaufBinden();
            const zeilen = [...res.querySelectorAll('button[data-i]')];
            zeilen.forEach(b => {
                b.addEventListener('click', () => {
                    merkeSuche(inp.value);
                    trefferOeffnen(treffer[Number(b.dataset.i)]);
                });
                b.addEventListener('mouseenter', () => zeigeVorschau(Number(b.dataset.i)));
            });
            SelectionFlow.stagger(res, zeilen, zeilen.map(b => {
                const t = treffer[Number(b.dataset.i)];
                return String(t?.page?.id ?? '') + '#' + String(t?.blockId ?? '');
            }));
            res.querySelector('button.on')?.scrollIntoView({ block: 'nearest' });
            SelectionFlow.highlight(res, res.querySelector('button.on'), { taste: '↵ Enter' });
            zeigeVorschau(i);
        };
        const waehle = (k) => {
            if (!treffer.length)
                return;
            i = Math.max(0, Math.min(k, treffer.length - 1));
            res.querySelectorAll('button[data-i].on').forEach(b => b.classList.remove('on'));
            const neu = res.querySelector(`button[data-i="${i}"]`);
            if (!neu) {
                zeichne();
                return;
            }
            neu.classList.add('on');
            neu.scrollIntoView({ block: 'nearest' });
            SelectionFlow.highlight(res, neu, { taste: '↵ Enter' });
            zeigeVorschau(i);
        };
        const zeigeVorschau = (k) => {
            const v = o.querySelector('#vorschau');
            if (!v)
                return;
            const t = treffer[k];
            if (!t) {
                v.innerHTML = '';
                return;
            }
            const p2 = t.page;
            const HUELLE = new Set(['columns', 'columns3', 'spalte', 'blatt', 'toggle']);
            const zeilen = [];
            const GRENZE = 14;
            const sammle = (id, tiefe) => {
                if (tiefe > 4)
                    return;
                for (const b of Store.childrenOf(id)) {
                    if (zeilen.length >= GRENZE)
                        return;
                    if (b.type === 'database') {
                        const c = Store.getCollection(b.collectionId);
                        zeilen.push(`<div class="vs-db">🗂 ${esc(c ? c.name : 'Datenbank')} · ` +
                            `${c ? Store.rowsOf(c.id).length : 0} Einträge</div>`);
                        continue;
                    }
                    if (b.type === 'pdfseite') {
                        const erste = String(b.suchtext || b.ocrText || '').split('\n')[0] || '';
                        zeilen.push(`<div class="vs-t">📄 Seite ${esc(b.nr || '?')}` +
                            (erste ? ' · ' + esc(erste.slice(0, 80)) : '') + '</div>');
                        continue;
                    }
                    if (HUELLE.has(b.type)) {
                        sammle(b.id, tiefe + 1);
                        continue;
                    }
                    if (!b.text)
                        continue;
                    const marke = { h1: 'vs-h1', h2: 'vs-h2', h3: 'vs-h3' }[b.type] || 'vs-t';
                    zeilen.push(`<div class="${marke}">${esc(b.text.slice(0, 120))}</div>`);
                }
            };
            sammle(p2.id, 0);
            const inhalt = zeilen.join('');
            v.innerHTML =
                `<div class="vs-kopf">${esc(p2.icon || '📄')} <b>${esc(p2.text || 'Ohne Titel')}</b></div>` +
                    `<div class="vs-meta">${esc(Store.pfadText(p2.id) || 'oberste Ebene')} · ` +
                    `zuletzt ${esc(Werkzeuge.zeitKurz(p2.edited))}</div>` +
                    (inhalt || '<div class="vs-t" style="opacity:.5">Diese Seite ist noch leer.</div>');
        };
        const zuletzt = () => {
            queryError = '';
            if (bereich === 'dokument') {
                treffer = [];
                i = 0;
                zeichne();
                return;
            }
            treffer = Object.values(Store.cache.blocks)
                .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection' &&
                (bereich !== 'dokumente' || !!b.dokumentModus) && imBereich(b.id))
                .sort((a, b) => (b.edited || '').localeCompare(a.edited || ''))
                .slice(0, 8)
                .map(p => ({ page: p, treffer: 'Zuletzt', snippet: '' }));
            i = 0;
            zeichne();
        };
        zuletzt();
        const readUiFilters = () => {
            const scopeValue = o.querySelector('#f-wo')?.value ?? 'alles';
            const typeValue = o.querySelector('#f-typ')?.value ?? 'alles';
            const changedValue = o.querySelector('#f-seit')?.value ?? 'alles';
            return {
                scope: scopeValue === 'titel' ? 'title' : scopeValue === 'inhalt' ? 'content' : 'all',
                documentType: typeValue === 'seite' ? 'page' : typeValue === 'datenbank' ? 'database' : 'all',
                changed: changedValue === 'tag' ? 'today' : changedValue === 'woche' ? 'week'
                    : changedValue === 'monat' ? 'month' : 'all',
                location: o.querySelector('#f-ort')?.value ?? ''
            };
        };
        const valueList = (value, depth = 0) => {
            if (value === null || value === undefined || depth > 2)
                return [];
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
                return [String(value)];
            if (Array.isArray(value))
                return value.flatMap(item => valueList(item, depth + 1));
            if (typeof value !== 'object')
                return [];
            const record = value;
            const named = record['name'] ?? record['value'] ?? record['text'];
            return named === undefined ? [] : valueList(named, depth + 1);
        };
        let documentCache = null;
        const queryDocuments = () => {
            if (documentCache)
                return documentCache;
            let indexEntries = [];
            try {
                indexEntries = typeof Kontext !== 'undefined' && Kontext.holen
                    ? (Kontext.holen().eintraege || []) : [];
            }
            catch {
                indexEntries = [];
            }
            if (!indexEntries.length) {
                indexEntries = Object.values(Store.cache.blocks)
                    .filter(block => block.alive && block.type === 'page')
                    .map(block => ({ id: block.id, seiteId: block.id,
                    art: block.parentTable === 'collection' ? 'zeile' : 'seite',
                    titel: block.text || '', text: Store.childrenOf(block.id)
                        .map((child) => (child.text || child.suchtext || child.ocrText || '')).join(' '),
                    geaendert: block.edited || block.created || '' }));
            }
            documentCache = indexEntries.map((entry) => {
                const block = Store.getBlock(entry.seiteId || entry.id);
                if (!block || !block.alive || block.type !== 'page')
                    return null;
                if (typeof Konten !== 'undefined' && Konten.darf && !Konten.darf('lesen', block.id))
                    return null;
                const isRow = block.parentTable === 'collection';
                const collection = isRow ? Store.getCollection(block.parentId) : null;
                const hasDatabase = !isRow && (block.content || [])
                    .some((id) => Store.getBlock(id)?.type === 'database');
                const schema = collection?.schema || {};
                const props = block.props || {};
                const statuses = [];
                const optionTags = [];
                Object.keys(schema).forEach(key => {
                    const definition = schema[key] || {};
                    const values = valueList(props[key]);
                    const name = String(definition.name || '').toLocaleLowerCase('de-DE');
                    if (definition.type === 'status' || name === 'status' || name === 'zustand')
                        statuses.push(...values);
                    if (definition.type === 'multi' || name === 'tags' || name === 'schlagwörter')
                        optionTags.push(...values);
                });
                const title = String(entry.titel || block.text || 'Ohne Titel');
                const content = String(entry.text || '');
                const hashTags = [...(title + ' ' + content).matchAll(/#([\p{L}\p{N}_-]+)/gu)]
                    .map(match => match[1] || '').filter(Boolean);
                const pathParts = isRow
                    ? [collection?.name || 'Datenbank']
                    : Store.pathOf(block.id).slice(0, -1).map((part) => part.text || 'Ohne Titel');
                const locations = isRow
                    ? [String(collection?.id || ''), String(collection?.name || '')]
                    : Store.pathOf(block.id).flatMap((part) => [String(part.id), String(part.text || '')]);
                return {
                    id: block.id,
                    title,
                    content,
                    path: pathParts.join(' / '),
                    documentType: isRow ? 'row' : hasDatabase ? 'database' : 'page',
                    changed: String(entry.geaendert || block.edited || block.created || ''),
                    tags: [...new Set([...hashTags, ...optionTags])],
                    statuses: [...new Set(statuses)],
                    locations: locations.filter(Boolean)
                };
            }).filter((document) => document !== null);
            return documentCache;
        };
        let dokLauf = 0;
        let dokUhr = null;
        const imDokumentSuchen = (roh) => {
            const wort = roh.trim();
            queryError = '';
            const lauf = ++dokLauf;
            if (dokUhr)
                clearTimeout(dokUhr);
            if (wort.length < 2 || !offenSeite || !dokMod) {
                treffer = [];
                i = 0;
                zeichne();
                return;
            }
            dokUhr = setTimeout(() => {
                void dokMod.findenIn(String(offenSeite.id), wort, { fokus: false }).then(e => {
                    if (lauf !== dokLauf || !o.isConnected)
                        return;
                    leisteBenutzt = true;
                    const seiten = e ? e.seiten.slice(0, 12) : [];
                    treffer = e && e.anzahl ? [{ page: offenSeite, dokumentZahl: e.anzahl,
                            treffer: e.anzahl + ' Treffer',
                            snippet: (seiten.length === 1 ? 'Seite ' : 'Seiten ') + seiten.join(', ') +
                                (e.seiten.length > seiten.length ? ' …' : '') }] : [];
                    i = 0;
                    zeichne();
                });
            }, 220);
        };
        const inDokumentenSuchen = (roh) => {
            queryError = '';
            const wort = roh.split(/\s+/).filter(w => w && !/^[\p{L}]+:/u.test(w)).join(' ')
                .replace(/["']/g, '').trim();
            if (wort.length < 2 || !dokMod) {
                zuletzt();
                return;
            }
            const gefunden = dokMod.stellenSuchen(wort);
            treffer = [];
            for (const stelle of (gefunden?.liste || [])) {
                const seite = Store.getBlock(stelle.seiteId);
                if (!seite || seite.alive === false)
                    continue;
                treffer.push({ page: seite, treffer: 'Seite ' + stelle.nr, snippet: stelle.auszug,
                    pfad: Store.pfadText(seite.id) || '', blockId: stelle.blockId });
            }
            i = 0;
            zeichne();
        };
        const suchen = () => {
            const roh = inp.value;
            if (typeof Chronik !== 'undefined' && Chronik.trifft(roh)) {
                queryError = '';
                treffer = [];
                res.innerHTML =
                    '<button class="chr-treffer on" data-chr-tuer>' +
                        '<span>🧠</span><span style="flex:1"><span>Red-ur — die Chronik</span>' +
                        '<span class="snip">Tage, Probleme, Arbeitsweise · braucht einen Zugangscode</span>' +
                        '</span><span class="pth">Chronik</span></button>';
                res.querySelector('[data-chr-tuer]')?.addEventListener('click', () => {
                    o.remove();
                    void Chronik.oeffnen();
                });
                SelectionFlow.highlight(res, res.querySelector('[data-chr-tuer]'), { taste: '↵ Enter' });
                return;
            }
            if (bereich === 'dokument') {
                imDokumentSuchen(roh);
                return;
            }
            if (bereich === 'dokumente') {
                inDokumentenSuchen(roh);
                return;
            }
            const uiFilters = readUiFilters();
            const hasUiFilter = uiFilters.scope !== 'all' || uiFilters.documentType !== 'all' ||
                uiFilters.changed !== 'all' || !!uiFilters.location;
            if (!roh.trim() && !hasUiFilter) {
                zuletzt();
                return;
            }
            const alsKennung = roh.trim().replace(/^.*#block=/, '');
            if (/^[0-9a-f]{8}-?[0-9a-f]{4}/i.test(alsKennung)) {
                const gefunden = Store.search(alsKennung);
                if (gefunden.length && gefunden[0].treffer === 'Seiten-ID' && imBereich(gefunden[0].page?.id)) {
                    queryError = '';
                    treffer = gefunden;
                    i = 0;
                    zeichne();
                    return;
                }
            }
            const parsed = QueryLanguage.parse(roh);
            if (!parsed.ok) {
                queryError = parsed.issues.map(issue => issue.message).join(' ');
                treffer = [];
                i = 0;
                zeichne();
                return;
            }
            queryError = '';
            const query = QueryLanguage.applyUiFilters(parsed.query, uiFilters);
            treffer = QueryLanguage.run(queryDocuments().filter(d => imBereich(d.id)), query).map(match => ({
                page: Store.getBlock(match.document.id),
                treffer: match.reason,
                snippet: match.snippet,
                pfad: match.document.path
            })).filter(hit => !!hit.page);
            const freieWorte = roh.split(/\s+/)
                .filter(w => w && !/^[\p{L}]+:/u.test(w)).join(' ').replace(/["']/g, '').trim();
            const dok = typeof DocumentMode !== 'undefined' ? DocumentMode : null;
            if (freieWorte.length >= 2 && dok && typeof dok.stelleIn === 'function') {
                for (const hit of treffer) {
                    if (!hit.page?.dokumentModus)
                        continue;
                    const stelle = dok.stelleIn(hit.page, freieWorte);
                    if (!stelle)
                        continue;
                    hit.blockId = stelle.blockId;
                    hit.treffer = 'Seite ' + stelle.nr;
                    hit.snippet = stelle.auszug;
                }
                if (!hasUiFilter && roh.trim() === freieWorte && typeof dok.stellenSuchen === 'function') {
                    const schon = new Set(treffer.map(h => String(h.page?.id || '')));
                    const gefunden = dok.stellenSuchen(freieWorte);
                    for (const stelle of (gefunden?.liste || [])) {
                        if (schon.has(stelle.seiteId) || !imBereich(stelle.seiteId))
                            continue;
                        const seite = Store.getBlock(stelle.seiteId);
                        if (!seite || seite.alive === false)
                            continue;
                        schon.add(stelle.seiteId);
                        treffer.push({ page: seite, treffer: 'Seite ' + stelle.nr,
                            snippet: stelle.auszug, pfad: Store.pfadText(seite.id) || '',
                            blockId: stelle.blockId });
                    }
                }
            }
            i = 0;
            zeichne();
        };
        inp.addEventListener('input', suchen);
        o.querySelectorAll('.such-filter select').forEach(s2 => s2.addEventListener('change', suchen));
        inp.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                schliessen();
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                waehle(i + 1);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                waehle(i - 1);
            }
            if (e.key !== 'Enter')
                return;
            if (treffer[i]) {
                trefferOeffnen(treffer[i]);
                return;
            }
            const wort = inp.value.trim();
            if (bereich === 'dokument' && offenSeite && dokMod && wort.length >= 2) {
                dokLauf++;
                if (dokUhr)
                    clearTimeout(dokUhr);
                o.remove();
                void dokMod.findenIn(String(offenSeite.id), wort, { springen: true, fokus: true });
            }
        });
        const filterMarken = () => {
            o.querySelectorAll('.such-filter select').forEach(s2 => {
                const vorgabe = s2.options[0]?.value ?? '';
                s2.classList.toggle('leer', s2.value === vorgabe);
            });
        };
        o.querySelectorAll('.such-filter select')
            .forEach(s2 => s2.addEventListener('change', filterMarken));
        filterMarken();
        o.addEventListener('mousedown', e => { if (e.target === o) {
            e.preventDefault();
            schliessen();
        } });
        if (vorgabe) {
            inp.value = String(vorgabe);
            suchen();
        }
        else
            zeichne();
        inp.focus();
        if (vorgabe)
            inp.setSelectionRange(inp.value.length, inp.value.length);
    };
    const zumTreffer = (t) => {
        if (!t)
            return;
        if (t.blockId && zeigeBlock(t.blockId))
            return;
        oeffne(t.page.id);
    };
    const seitenSuche = () => {
        const alt = document.getElementById('findbar');
        if (alt) {
            alt.remove();
            zeichneSeite();
            return;
        }
        const bar = document.createElement('div');
        bar.id = 'findbar';
        bar.setAttribute('role', 'search');
        bar.innerHTML =
            '<input placeholder="Auf dieser Seite suchen …" aria-label="Auf dieser Seite suchen">' +
                '<span class="n" aria-live="polite"></span>' +
                '<button data-a="zurueck" aria-label="Vorige Stelle (Umschalt+Enter)" title="Vorige Stelle">‹</button>' +
                '<button data-a="vor" aria-label="Nächste Stelle (Enter)" title="Nächste Stelle">›</button>' +
                '<button data-a="zu" aria-label="Suche schliessen (Escape)" title="Suche schliessen">✕</button>';
        document.body.appendChild(bar);
        const inp = bar.querySelector('input');
        if (!inp)
            return;
        const n = bar.querySelector('.n');
        if (!n)
            return;
        let stellen = [];
        let bei = 0;
        const zeige = (rollen) => {
            stellen.forEach(m => m.classList.remove('aktiv'));
            if (!stellen.length) {
                n.textContent = inp.value.trim() ? 'nichts' : '';
                return;
            }
            if (bei < 0)
                bei = stellen.length - 1;
            if (bei >= stellen.length)
                bei = 0;
            const jetzt = stellen[bei];
            if (!jetzt)
                return;
            jetzt.classList.add('aktiv');
            n.textContent = (bei + 1) + ' von ' + stellen.length;
            if (rollen)
                jetzt.scrollIntoView({ block: 'center', behavior: 'smooth' });
        };
        const gehe = (richtung) => {
            if (!stellen.length)
                return;
            bei = (bei + richtung + stellen.length) % stellen.length;
            zeige(true);
        };
        const suchen = () => {
            document.querySelectorAll('#page mark').forEach(m => m.replaceWith(...m.childNodes));
            stellen = [];
            bei = 0;
            const q = inp.value.trim();
            if (!q) {
                n.textContent = '';
                return;
            }
            const seitenKasten = document.getElementById('page');
            if (!seitenKasten)
                return;
            Blocks.zeichneFuerSuche(q);
            const lauf = document.createTreeWalker(seitenKasten, NodeFilter.SHOW_TEXT, {
                acceptNode: (k) => k.parentElement?.closest('.blatt-platz')
                    ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
            });
            const knoten = [];
            while (lauf.nextNode())
                knoten.push(lauf.currentNode);
            knoten.forEach(k => {
                const i = (k.nodeValue ?? '').toLowerCase().indexOf(q.toLowerCase());
                if (i < 0)
                    return;
                const nach = k.splitText(i);
                nach.splitText(q.length);
                const mark = document.createElement('mark');
                mark.textContent = nach.nodeValue;
                nach.replaceWith(mark);
                stellen.push(mark);
            });
            zeige(true);
        };
        inp.addEventListener('input', suchen);
        inp.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                bar.remove();
                zeichneSeite();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                gehe(e.shiftKey ? -1 : 1);
            }
        });
        bar.addEventListener('click', e => {
            const knopf = elVon(e)?.closest('[data-a]');
            if (!knopf)
                return;
            const was = knopf.dataset.a;
            if (was === 'zu') {
                bar.remove();
                zeichneSeite();
                return;
            }
            if (was === 'vor' || was === 'zurueck') {
                gehe(was === 'vor' ? 1 : -1);
                inp.focus();
            }
        });
        inp.focus();
    };
    const wohin = (id, fertig) => {
        const b = Store.getBlock(id);
        if (!b)
            return;
        const kandidaten = Object.values(Store.cache.blocks)
            .filter(x => x.alive !== false && x.type === 'page' && x.id !== id)
            .sort((a, c) => (a.text || '').localeCompare(c.text || '', 'de'))
            .slice(0, 200);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(560px,94vw)">' +
                `<div class="fh">↳ „${esc(b.text || 'Ohne Titel')}" wohin?` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<input id="wo-q" placeholder="Seite suchen …" autocomplete="off">' +
                '<div class="res" id="wo-r">' +
                '<button data-ziel=""><span>🏠</span><span style="flex:1">Ganz oben, als eigene Seite</span></button>' +
                kandidaten.map(x => `<button data-ziel="${x.id}"><span>${x.icon || '📄'}</span>` +
                    `<span style="flex:1">${esc(x.text || 'Ohne Titel')}` +
                    `<span class="snip">${esc(Store.pfadText ? Store.pfadText(x.id) : '')}</span></span></button>`).join('') +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        const inp = o.querySelector('#wo-q');
        if (!inp)
            return;
        setTimeout(() => inp.focus(), 40);
        inp.addEventListener('input', () => {
            const q = inp.value.toLowerCase();
            o.querySelectorAll('#wo-r button[data-ziel]').forEach(btn => {
                btn.style.display = !q || (btn.textContent ?? '').toLowerCase().includes(q) ? '' : 'none';
            });
        });
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const z = elVon(e)?.closest('[data-ziel]');
            if (!z)
                return;
            const ziel = z.dataset.ziel;
            Store.restoreBlock(id);
            const alt = Store.getBlock(Store.getBlock(id).parentId);
            if (alt)
                Store.updateBlock(alt.id, { content: (alt.content || []).filter((x) => x !== id) });
            Store.updateBlock(id, { parentId: ziel || null });
            if (ziel) {
                const neuEltern = Store.getBlock(ziel);
                if (neuEltern && !(neuEltern.content || []).includes(id))
                    Store.updateBlock(ziel, { content: [...(neuEltern.content || []), id] });
            }
            o.remove();
            UI.toast(ziel ? 'Wiederhergestellt unter „' + (Store.getBlock(ziel).text || 'Seite') + '"'
                : 'Ganz oben wiederhergestellt');
            if (fertig)
                fertig();
        });
    };
    const papierkorb = () => {
        let suche = '', filterVon = '', filterOrt = '', filterBereich = '';
        const o = document.createElement('div');
        o.className = 'overlay';
        document.body.appendChild(o);
        const blockName = (b) => {
            const roh = String(b.text || '').replace(/\s+/g, ' ').trim();
            const art = (typeof Register !== 'undefined' && Register.bloecke &&
                (Register.bloecke.eines(b.type) || {}).name) || b.type;
            return roh ? (roh.length > 60 ? roh.slice(0, 60) + '…' : roh) : art;
        };
        const blockHer = (b) => {
            const e = b.parentId ? Store.getBlock(b.parentId) : null;
            return e ? (e.text || 'Ohne Titel') : 'unbekannte Seite';
        };
        const zeichne = () => {
            const alle = Store.trashed();
            let liste = alle;
            if (suche)
                liste = liste.filter(p => (p.text || '').toLowerCase().includes(suche.toLowerCase()));
            if (filterVon)
                liste = liste.filter(p => (p.geaendertVon || p.erstelltVon || 'Ich') === filterVon);
            if (filterOrt)
                liste = liste.filter(p => (p.parentId || '') === filterOrt);
            if (filterBereich)
                liste = liste.filter(p => (p.bereich || '') === filterBereich);
            let bloecke = Store.papierkorbBloecke ? Store.papierkorbBloecke() : [];
            if (suche)
                bloecke = bloecke.filter(b => (blockName(b) + ' ' + blockHer(b)).toLowerCase().includes(suche.toLowerCase()));
            if (filterVon)
                bloecke = bloecke.filter(b => (b.geaendertVon || b.erstelltVon || 'Ich') === filterVon);
            if (filterOrt)
                bloecke = bloecke.filter(b => (b.parentId || '') === filterOrt);
            const chip = (id, text, an) => `<button class="pk-chip${an ? ' on' : ''}" data-f="${id}">${text}<span>⌄</span></button>`;
            const archiv = Object.values(Store.cache.blocks)
                .filter(x => x.type === 'page' && x.alive !== false && x.archiviert)
                .filter(x => !suche || (x.text || '').toLowerCase().includes(suche.toLowerCase()));
            o.innerHTML =
                '<div class="finder pk">' +
                    `<div class="pk-suche"><input id="pk-suche" placeholder="Seiten im Papierkorb suchen" value="${esc(suche)}"></div>` +
                    '<div class="pk-chips">' +
                    chip('von', filterVon ? '👤 ' + esc(filterVon) : '👤 Zuletzt bearbeitet von', !!filterVon) +
                    chip('ort', filterOrt ? '📄 ' + esc((Store.getBlock(filterOrt) || {}).text || 'Seite') : '📄 In', !!filterOrt) +
                    chip('bereich', '👥 Bereiche', !!filterBereich) +
                    '</div>' +
                    '<div class="res pk-res">' +
                    (archiv.length
                        ? '<div class="grp">Archiv</div>' +
                            archiv.map(x => `<button data-arch="${x.id}">` +
                                `<span>${x.icon || '🗄'}</span>` +
                                `<span style="flex:1">${esc(x.text || 'Ohne Titel')}` +
                                `<span class="snip">archiviert ${esc(Werkzeuge.zeitKurz(x.archiviertAm))}</span></span>` +
                                '<span class="pk-tat" data-a="entarchiv" title="Zurückholen">↩</span></button>').join('') +
                            '<div class="grp">Papierkorb</div>'
                        : '') +
                    (liste.length
                        ? (bloecke.length ? '<div class="grp">Seiten</div>' : '') +
                            liste.map(p => `<button data-id="${p.id}">` +
                                `<span>${p.icon || '📄'}</span>` +
                                `<span style="flex:1">${esc(p.text || 'Ohne Titel')}` +
                                `<span class="snip">gelöscht ${esc(Werkzeuge.zeitKurz(p.trashedAt))}</span></span>` +
                                '<span class="pk-tat" data-a="restore" title="Wiederherstellen">↩</span>' +
                                '<span class="pk-tat" data-a="restore-wo" title="An anderer Stelle wiederherstellen">↳</span>' +
                                '<span class="pk-tat weg" data-a="purge" data-loeschknopf="Endgültig löschen" ' +
                                `title="„${esc(p.text || 'Ohne Titel')}“ endgültig löschen">🗑</span>` +
                                '</button>').join('')
                        : (bloecke.length ? ''
                            : `<div class="pk-leer">${alle.length ? 'Nichts gefunden.' : 'Der Papierkorb ist leer'}</div>`)) +
                    (bloecke.length
                        ? '<div class="grp">Blöcke</div>' +
                            bloecke.map(b => `<button data-id="${b.id}">` +
                                '<span>🧩</span>' +
                                `<span style="flex:1">${esc(blockName(b))}` +
                                `<span class="snip">aus „${esc(blockHer(b))}" · gelöscht ` +
                                `${esc(Werkzeuge.zeitKurz(b.trashedAt))}</span></span>` +
                                '<span class="pk-tat" data-a="restore" title="Wiederherstellen">↩</span>' +
                                '<span class="pk-tat weg" data-a="purge" data-loeschknopf="Endgültig löschen" ' +
                                `title="„${esc(blockName(b))}“ endgültig löschen">🗑</span>` +
                                '</button>').join('')
                        : '') +
                    '</div>' +
                    '<div class="hint pk-hint">' + (() => {
                    const t = Number(Store.getMeta('papierkorbTage', 30));
                    return t ? `Nach ${t} Tagen im Papierkorb wird endgültig gelöscht. `
                        : 'Automatisch gelöscht wird nichts — so ist es eingestellt. ';
                })() + 'Endgültig Gelöschtes lässt sich nicht zurückholen.' +
                    (alle.length + bloecke.length
                        ? '<button class="pk-alle" data-a="alle">Papierkorb leeren</button>' : '') +
                    '</div>' +
                    '</div>';
            const inp = o.querySelector('#pk-suche');
            if (!inp)
                return;
            inp.addEventListener('input', () => {
                suche = inp.value;
                const stelle = inp.selectionStart;
                zeichne();
                const neu = o.querySelector('#pk-suche');
                if (neu) {
                    neu.focus();
                    neu.setSelectionRange(stelle, stelle);
                }
            });
            inp.focus();
        };
        o.addEventListener('click', async (e) => {
            if (e.target === o) {
                o.remove();
                return;
            }
            const f = elVon(e)?.closest('[data-f]');
            if (f) {
                const r = f.getBoundingClientRect();
                const alle = Store.trashed();
                let eintraege = [];
                let setzen = () => { };
                if (f.dataset.f === 'von') {
                    eintraege = [...new Set(alle.map(p => p.geaendertVon || p.erstelltVon || 'Ich'))]
                        .map(n => [n, '👤 ' + n]);
                    setzen = (v) => { filterVon = v; };
                }
                else if (f.dataset.f === 'ort') {
                    eintraege = [...new Set(alle.map(p => p.parentId).filter(Boolean))]
                        .map(id => [id, '📄 ' + ((Store.getBlock(id) || {}).text || 'Seite')]);
                    setzen = (v) => { filterOrt = v; };
                }
                else {
                    eintraege = (Store.getMeta('bereiche', []) || []).map((b) => [b.id, (b.icon || '👥') + ' ' + b.name]);
                    setzen = (v) => { filterBereich = v; };
                }
                const m = UI.menu('<button data-v="">Alle</button>' +
                    (eintraege.length
                        ? eintraege.map(([v, t]) => `<button data-v="${esc(v)}">${esc(t)}</button>`).join('')
                        : '<div class="grp">Nichts zur Auswahl</div>'), r.left, r.bottom + 4);
                m.addEventListener('click', ev => {
                    const b2 = elVon(ev)?.closest('[data-v]');
                    if (!b2)
                        return;
                    setzen(b2.dataset.v);
                    m.remove();
                    zeichne();
                });
                return;
            }
            if (elVon(e)?.closest('[data-a="alle"]')) {
                const bl = Store.papierkorbBloecke ? Store.papierkorbBloecke() : [];
                const n = Store.trashed().length + bl.length;
                if (!confirm(`${n} ${n === 1 ? 'Ding' : 'Dinge'} endgültig löschen? ` +
                    'Mit ihnen gehen ihre Fassungen und Anhänge. ' +
                    'Das lässt sich nicht rückgängig machen.'))
                    return;
                Store.trashed().forEach(p => Store.purgeBlock(p.id));
                bl.forEach(b => Store.purgeBlock(b.id));
                zeichne();
                zeichneBaum();
                App.zeichneSeite();
                UI.toast('Papierkorb geleert');
                return;
            }
            const arch = elVon(e)?.closest('button[data-arch]');
            if (arch) {
                if (arch.dataset.arch)
                    Store.updateBlock(arch.dataset.arch, { archiviert: false, archiviertAm: '' });
                zeichne();
                zeichneBaum();
                UI.toast('Aus dem Archiv geholt');
                return;
            }
            const s = elVon(e)?.closest('[data-a]');
            const b = elVon(e)?.closest('button[data-id]');
            if (!b)
                return;
            const id = b.dataset.id;
            if (!id)
                return;
            if (s && s.dataset.a === 'restore') {
                const b2 = Store.getBlock(id);
                const eltern = b2 && b2.parentId ? Store.getBlock(b2.parentId) : null;
                if (eltern && eltern.alive === false) {
                    UI.toast('Der alte Ort liegt selbst im Papierkorb — wähle einen neuen');
                    wohin(id, () => { zeichne(); zeichneBaum(); });
                    return;
                }
                Store.restoreBlock(id);
                zeichne();
                zeichneBaum();
                App.zeichneSeite();
                UI.toast('Wiederhergestellt');
                return;
            }
            if (s && s.dataset.a === 'restore-wo') {
                wohin(id, () => { zeichne(); zeichneBaum(); });
                return;
            }
            if (s && s.dataset.a === 'purge') {
                Store.purgeBlock(id);
                zeichne();
                App.zeichneSeite();
                UI.toast('Endgültig gelöscht');
                return;
            }
            const w2 = Store.getBlock(id);
            Store.restoreBlock(id);
            o.remove();
            oeffne(w2 && w2.type !== 'page' ? (w2.parentId || id) : id);
        });
        zeichne();
    };
    const einstellungen = (bereich) => Einstellungen.oeffne(bereich);
    const rMenue = () => {
        const zeile = (was, zeichen, name, hinweis = '') => `<button data-r="${was}"><span class="rm-z">${menueZeichen(zeichen)}</span>` +
            `<span class="rm-n">${name}</span>` +
            (hinweis ? `<span class="rm-h">${hinweis}</span>` : '') + '</button>';
        const o = document.createElement('div');
        o.id = 'r-blatt';
        o.innerHTML =
            '<div class="rm-kopf">' +
                '<div><b>Redion</b><span>Alles bleibt auf diesem Gerät</span></div>' +
                '<button class="rm-zu" data-r="zu" aria-label="Schliessen">' + menueZeichen('close') + '</button>' +
                '</div>' +
                '<div class="rm-rollen">' +
                '<div class="rm-gruppe">' +
                zeile('suche', 'search', 'Suchen') +
                zeile('befehle', 'command', 'Befehle') +
                zeile('start', 'home', 'Start') +
                zeile('seiten', 'pages', 'Seiten') +
                zeile('mehr', 'dots', 'Mehr') +
                zeile('neu', 'plus', 'Neue Seite') +
                zeile('ki', 'sparkle', 'KI und Verlauf') +
                '</div>' +
                '<div class="rm-gruppe">' +
                zeile('import', 'upload', 'Importieren') +
                zeile('sichern', 'download', 'Sichern', 'als Datei auf dieses Gerät') +
                zeile('papierkorb', 'trash', 'Papierkorb') +
                zeile('tasten', 'keyboard', 'Tastenkürzel') +
                zeile('einstellungen', 'settings', 'Einstellungen') +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        requestAnimationFrame(() => o.classList.add('auf'));
        void (async () => {
            let stand = null;
            try {
                stand = await Store.usage();
            }
            catch { }
            if (!stand || !stand.benutzt || !o.isConnected)
                return;
            const rollen = o.querySelector('.rm-rollen');
            if (!rollen)
                return;
            const mb = (n) => n >= 1073741824
                ? (n / 1073741824).toFixed(2).replace('.', ',') + ' GB'
                : Math.round(n / 1048576) + ' MB';
            const anteil = stand.verfuegbar
                ? Math.min(100, Math.round((stand.benutzt / stand.verfuegbar) * 100)) : 0;
            const k = document.createElement('div');
            k.className = 'rm-speicher';
            k.innerHTML =
                '<div class="rs-kopf"><span>Auf diesem Gerät</span>' +
                    `<b>${mb(stand.benutzt)}</b></div>` +
                    `<div class="rs-balken"><i style="width:${Math.max(2, anteil)}%"></i></div>` +
                    `<div class="rs-fuss">${stand.verfuegbar
                        ? anteil + ' % von ' + mb(stand.verfuegbar) + ' — der Browser gibt den Rest frei, wenn er ihn braucht'
                        : 'Wie viel der Browser noch freigibt, sagt er nicht.'}</div>`;
            rollen.appendChild(k);
        })();
        const zu = () => { o.classList.remove('auf'); setTimeout(() => o.remove(), 200); };
        o.addEventListener('click', (e) => {
            const b = (e.target instanceof Element) ? e.target.closest('[data-r]') : null;
            if (!b)
                return;
            const was = b.dataset.r;
            zu();
            setTimeout(() => {
                if (was === 'ki')
                    kiPanel(true);
                else if (was === 'suche')
                    suche();
                else if (was === 'befehle')
                    Werkzeuge.palette();
                else if (was === 'seiten') {
                    Seitenleiste.reiter('seiten');
                    Ansichten.seiten();
                    handyLeiste();
                }
                else if (was === 'start') {
                    Seitenleiste.reiter('start');
                    Ansichten.start();
                    handyLeiste();
                }
                else if (was === 'mehr') {
                    Seitenleiste.reiter('mehr');
                    Ansichten.mehr();
                    handyLeiste();
                }
                else if (was === 'neu')
                    neueSeite();
                else if (was === 'import')
                    Werkzeuge.dateienLesen();
                else if (was === 'sichern')
                    sicherungSpeichern();
                else if (was === 'papierkorb')
                    papierkorb();
                else if (was === 'tasten')
                    Werkzeuge.tastenkuerzel();
                else if (was === 'einstellungen')
                    einstellungen();
            }, 60);
        });
        const zurueckTaste = () => { zu(); removeEventListener('popstate', zurueckTaste); };
        addEventListener('popstate', zurueckTaste);
    };
    const sicherungGemerkt = (art) => Sicherung.merken(art);
    const sicherungPaketBauen = async (melden) => {
        const sagen = melden || ((t) => UI.toast(t));
        const stand = await Store.exportVorbereiten();
        if (!stand.dateien) {
            return { blob: new Blob([Store.exportAll()], { type: 'application/json' }),
                art: 'json', endung: '.json',
                anhaenge: 0, versionen: stand.versionen, ausgelassen: 0 };
        }
        sagen(stand.dateien + ' Anhänge kommen mit — das dauert einen Moment');
        {
            const gefundeneSaetze = (await Store.dateiAlle())
                .filter((s) => !(s && s.abgeleitet));
            const saetze = [];
            const ausgelassen = [];
            const eintraege = [{ name: 'daten.json', inhalt: '' }];
            const belegt = new Set(['daten.json']);
            for (const satz of gefundeneSaetze) {
                const inhalt = await Dateien.alsBlob(satz.id);
                if (!inhalt || (satz.zustand && satz.zustand !== 'fertig') ||
                    (typeof satz.groesse === 'number' &&
                    Number.isFinite(satz.groesse) && satz.groesse >= 0 &&
                    inhalt.size !== satz.groesse)) {
                    ausgelassen.push(String(satz.name || satz.id || 'Unbenannte Datei'));
                    continue;
                }
                saetze.push(satz);
                const roh = String(satz.name || 'Datei').replace(/[\\/:*?"<>|]/g, '-');
                let name = 'dateien/' + roh;
                if (belegt.has(name)) {
                    const punkt = roh.lastIndexOf('.');
                    const stamm = punkt > 0 ? roh.slice(0, punkt) : roh;
                    const endung = punkt > 0 ? roh.slice(punkt) : '';
                    let n = 2;
                    while (belegt.has('dateien/' + stamm + '-' + n + endung))
                        n++;
                    name = 'dateien/' + stamm + '-' + n + endung;
                }
                belegt.add(name);
                eintraege.push({ name, inhalt, kennung: satz.id });
            }
            const datenRoh = Store.exportAll(true);
            if (ausgelassen.length) {
                const daten = JSON.parse(datenRoh);
                daten.unvollstaendigeDateienAusgelassen = ausgelassen.length;
                const beispiele = ausgelassen.slice(0, 5).join(', ');
                const weitere = ausgelassen.length > 5
                    ? ' und ' + (ausgelassen.length - 5) + ' weitere' : '';
                const versprochen = 'Vollständig: die ' + gefundeneSaetze.length +
                    ' Datei(en) liegen im Ordner „dateien" desselben Archivs.';
                const teilweise = 'Teilweise: ' + saetze.length + ' von ' +
                    gefundeneSaetze.length + ' Datei(en) sind im Archiv vorhanden.';
                const vorherHinweis = String(daten.hinweis || '');
                daten.hinweis = (vorherHinweis.includes(versprochen)
                    ? vorherHinweis.replace(versprochen, teilweise)
                    : teilweise + ' ' + vorherHinweis) +
                    ' ACHTUNG: ' + ausgelassen.length +
                    ' unvollständige Datei(en) sind NICHT in dieser Sicherung: ' +
                    beispiele + weitere + '. Sie bleiben auf diesem Gerät; erst ' +
                    'nach dem vollständigen Einlesen erneut sichern.';
                eintraege[0].inhalt = JSON.stringify(daten);
                sagen('ACHTUNG: ' + ausgelassen.length +
                    ' unvollständige Datei(en) nicht mitgesichert — siehe Sicherungshinweis.');
            }
            else {
                eintraege[0].inhalt = datenRoh;
            }
            const karte = {};
            eintraege.forEach(e => { if (e.kennung)
                karte[e.name] = e.kennung; });
            eintraege.push({ name: 'dateien.json', inhalt: JSON.stringify({
                    version: 1, saetze, zuordnung: karte
                }, null, 2) });
            const blob = await Austausch.zipSchreiben(eintraege, (name, anteil) => { if (anteil >= 1)
                sagen('Geprüft: ' + name.replace('dateien/', '') + ' — wird verpackt'); });
            return { blob, art: 'redion', endung: '.redion',
                anhaenge: eintraege.length - 2, versionen: stand.versionen,
                ausgelassen: ausgelassen.length };
        }
    };
    const sicherungSpeichern = async () => {
        try {
            const paket = await sicherungPaketBauen();
            const heute = new Date().toISOString().slice(0, 10);
            const name = 'redion-sicherung-' + heute + paket.endung;
            const nativeSicherung = globalThis.RedionNativeSicherung;
            if (nativeSicherung && typeof nativeSicherung.speichern === 'function') {
                await nativeSicherung.speichern(paket.blob, name);
                if (!paket.ausgelassen)
                    sicherungGemerkt(paket.art);
                UI.toast(paket.ausgelassen
                    ? 'Sicherung mit Lücken gespeichert: ' + paket.ausgelassen +
                        ' Datei(en) fehlen. Hinweis in der Sicherung lesen und erneut sichern.'
                    : 'Sicherung in Dateien → Auf meinem iPhone → Redion → Backups gespeichert. Für Schutz bei App-Löschung zusätzlich in iCloud Drive sichern.');
                return paket.ausgelassen === 0;
            }
            const l = document.createElement('a');
            l.href = URL.createObjectURL(paket.blob);
            l.download = name;
            l.click();
            if (!paket.ausgelassen)
                sicherungGemerkt(paket.art);
            UI.toast(paket.ausgelassen
                ? 'Sicherung mit Lücken gespeichert: ' + paket.ausgelassen +
                    ' Datei(en) fehlen. Hinweis in der Sicherung lesen und erneut sichern.'
                : paket.art === 'json'
                    ? 'Sicherung gespeichert (' + paket.versionen + ' Fassungen im Verlauf)'
                    : 'Sicherung gespeichert — mit ' + paket.anhaenge + ' Anhang/Anhängen');
            return paket.ausgelassen === 0;
        }
        catch (err) {
            alert('Die Sicherung kam nicht zustande: ' +
                (err instanceof Error ? err.message : String(err)) +
                '\n\nEs wurde nichts geschrieben.');
            return false;
        }
    };
    const anhaengeEinspielen = async (zip, art) => {
        const leer = { da: 0, erwartet: 0, fehlend: [],
            unvollstaendig: [] };
        const roh = await zip.text('dateien.json');
        if (!roh)
            return leer;
        let karte;
        try {
            karte = ImportSicherheit.lesen(roh).wert;
        }
        catch {
            return leer;
        }
        if (!karte || typeof karte !== 'object')
            return leer;
        const STUECK = (typeof KONSTANTEN !== 'undefined') ? KONSTANTEN.STUECK : 1024 * 1024;
        const nachName = Object.create(null);
        Object.entries(karte.zuordnung || {}).forEach(([name, id]) => { nachName[id] = name; });
        let wieViele = 0;
        const fehlend = [];
        const unvollstaendig = [];
        const nichtGeschafft = (satz, warum) => {
            fehlend.push(String(satz?.name || satz?.id || 'ohne Namen') + ' (' + warum + ')');
        };
        const zuKurz = (satz, hat) => {
            const soll = satz?.groesse;
            if (typeof soll !== 'number' || !Number.isFinite(soll) || soll <= 0)
                return 0;
            if (satz.zustand && satz.zustand !== 'fertig')
                return 0;
            if (typeof satz.angekommen === 'number' && typeof satz.teile === 'number' &&
                satz.angekommen < satz.teile)
                return 0;
            return hat < soll ? soll - hat : 0;
        };
        for (const satz of (karte.saetze || [])) {
            try {
                const name = nachName[satz.id];
                if (!name) {
                    nichtGeschafft(satz, 'steht nicht im Archiv');
                    continue;
                }
                const roh2 = await zip.alsBlob(name);
                if (!roh2) {
                    nichtGeschafft(satz, 'liess sich nicht lesen');
                    continue;
                }
                const blob = roh2.type === (satz.typ || '') ? roh2
                    : new Blob([roh2], { type: satz.typ || 'application/octet-stream' });
                for (const alt of await Store.stueckeVon(satz.id))
                    await Store.stueckWeg(alt.id);
                const teile = Math.max(1, Math.ceil(blob.size / STUECK));
                for (let nr = 0; nr < teile; nr++) {
                    const von = nr * STUECK;
                    await Store.stueckPut({ id: satz.id + ':' + nr, dateiId: satz.id, nr,
                        blob: blob.slice(von, Math.min(von + STUECK, blob.size)) });
                }
                const fehlt = zuKurz(satz, blob.size);
                if (fehlt > 0) {
                    unvollstaendig.push(String(satz.name || satz.id) +
                        ' (' + Dateien.groesseText(fehlt) + ' fehlen)');
                }
                await Store.dateiPut(Object.assign({}, satz, {
                    teile, angekommen: teile, zustand: 'fertig', groesse: blob.size
                }));
                wieViele++;
            }
            catch (e) {
                nichtGeschafft(satz, e instanceof Error ? e.message.slice(0, 60) : 'Fehler');
            }
        }
        if (art === 'ersetzen') {
            const gehoertDazu = new Set((karte.saetze || []).map((s) => s.id));
            for (const alt of await Store.dateiAlle()) {
                if (gehoertDazu.has(alt.id))
                    continue;
                for (const st of await Store.stueckeVon(alt.id))
                    await Store.stueckWeg(st.id);
                await Store.dateiWeg(alt.id);
                Dateien.adresseWeg(alt.id);
            }
        }
        return { da: wieViele, erwartet: (karte.saetze || []).length,
            fehlend, unvollstaendig };
    };
    const sicherungLaden = (danach) => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.json,.redion,.zip';
        inp.addEventListener('change', async () => {
            const f = inp.files?.[0];
            if (!f)
                return;
            let zip = null, text = '';
            const kopf = new Uint8Array(await f.slice(0, 4).arrayBuffer());
            const istZip = kopf[0] === 0x50 && kopf[1] === 0x4B;
            if (istZip) {
                try {
                    zip = await Einlesen.zipLesenAusBlob(f);
                    text = await zip.text('daten.json') || '';
                }
                catch (e) {
                    alert('Dieses Archiv liess sich nicht öffnen: ' +
                        (e instanceof Error ? e.message : String(e)));
                    return;
                }
                if (!text) {
                    alert('In diesem Archiv steckt keine „daten.json" — es ist keine ' +
                        'Redion-Sicherung.');
                    return;
                }
            }
            else {
                text = await f.text();
            }
            let vorschau = {};
            try {
                vorschau = JSON.parse(text);
            }
            catch {
                alert('Diese Datei ist keine Sicherung — sie lässt sich nicht lesen.');
                return;
            }
            const faecherJetzt = {
                blocks: Store.cache.blocks || {},
                collections: Store.cache.collections || {},
                views: Store.cache.views || {}
            };
            const faecherDatei = {
                blocks: vorschau.blocks || {},
                collections: vorschau.collections || {},
                views: vorschau.views || {}
            };
            const beimErsetzen = ImportVergleich.rechnen(faecherJetzt, faecherDatei, 'ersetzen');
            const beimDazu = ImportVergleich.rechnen(faecherJetzt, faecherDatei, 'zusammenfuehren');
            const wahl = await Dialog.wahl({
                titel: 'Sicherung einspielen',
                text: 'Die Datei enthält ' +
                    Object.keys(vorschau.blocks || {}).length + ' Blöcke' +
                    (Array.isArray(vorschau.versions) ? ' und ' + vorschau.versions.length +
                        ' Fassungen aus dem Verlauf' : '') + '.' +
                    (vorschau.hinweis ? '\n\n' + vorschau.hinweis : ''),
                knoepfe: [
                    { id: 'ersetzen', text: 'Ersetzen',
                        hinweis: ImportVergleich.satz(beimErsetzen) +
                            ' Vorher lädt Redion eine Sicherheitskopie des jetzigen ' +
                            'Standes herunter.' },
                    { id: 'zusammenfuehren', text: 'Dazulegen',
                        hinweis: ImportVergleich.satz(beimDazu) +
                            ' Es wird nichts gelöscht.' },
                    { id: '', text: 'Abbrechen' }
                ]
            });
            if (!wahl)
                return;
            let kopie = false;
            if (wahl === 'ersetzen') {
                kopie = await sicherungSpeichern();
                if (!kopie) {
                    alert('Es wurde NICHTS eingespielt — dein Bestand steht unverändert.\n\n' +
                        'Ohne Sicherheitskopie wäre das Ersetzen ein Sprung ohne Netz.');
                    return;
                }
            }
            try {
                const erg = await Store.importAll(text, wahl);
                let anhaenge = { da: 0, erwartet: 0, fehlend: [], unvollstaendig: [] };
                if (zip)
                    anhaenge = await anhaengeEinspielen(zip, wahl);
                danach && danach();
                zeichneBaum();
                zeichneSeite();
                UI.toast('Sicherung geladen — ' + erg.bloecke + ' Blöcke' +
                    (kopie ? ' (der alte Stand liegt als Sicherheitskopie im ' +
                        'Download-Ordner)' : '') +
                    (erg.versionen ? ', ' + erg.versionen + ' Fassungen' : '') +
                    (anhaenge.da ? ', ' + anhaenge.da + ' Anhang/Anhänge' : '') +
                    (anhaenge.fehlend.length
                        ? '. ' + anhaenge.fehlend.length + ' von ' + anhaenge.erwartet +
                            ' Anhängen fehlen: ' + anhaenge.fehlend.slice(0, 3).join(', ') +
                            (anhaenge.fehlend.length > 3 ? ' …' : '') +
                            '. Die Sicherung liegt noch — du kannst sie erneut einspielen.'
                        : '') +
                    (anhaenge.unvollstaendig.length
                        ? '. ' + anhaenge.unvollstaendig.length + ' Anhang/Anhänge ' +
                            'kamen verkürzt an: ' +
                            anhaenge.unvollstaendig.slice(0, 3).join(', ') +
                            (anhaenge.unvollstaendig.length > 3 ? ' …' : '') +
                            '. Sie wurden trotzdem übernommen — was da ist, ist da.'
                        : '') +
                    (erg.frage
                        ? '. Der Abgleich mit der Wolke steht still: dort liegt noch ' +
                            'der Stand von vorher. Entscheide unter „Mehr → Wolke", ob ' +
                            'dieses Gerät nur lokal weiterarbeitet oder vollständig neu ' +
                            'abgleicht.'
                        : ''), erg.frage ? 14000 : undefined);
            }
            catch (err) {
                alert('Konnte nicht geladen werden: ' +
                    (err instanceof Error ? err.message : String(err)));
            }
        });
        inp.click();
    };
    const setzeBreite = (px) => {
        const s = document.getElementById('sidebar');
        if (!s)
            return;
        s.style.width = px + 'px';
        s.style.flexBasis = px + 'px';
    };
    const theme = (was) => {
        const ziel = was === 'light' || was === 'dark' ? was : undefined;
        if (typeof Aussehen !== 'undefined') {
            Aussehen.grundWechseln(ziel);
            return;
        }
        const neu = ziel || (document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
        document.documentElement.dataset.theme = neu;
        Store.setMeta('theme', neu);
    };
    const vollbildGeht = () => !!(document.fullscreenEnabled &&
        typeof document.documentElement.requestFullscreen === 'function');
    const vollbildAn = () => !!document.fullscreenElement;
    const vollbild = async (an) => {
        if (!vollbildGeht()) {
            UI.toast('Dieser Browser kann kein Vollbild.');
            return false;
        }
        const ziel = an === undefined ? !vollbildAn() : !!an;
        try {
            if (ziel)
                await document.documentElement.requestFullscreen();
            else if (vollbildAn())
                await document.exitFullscreen();
        }
        catch {
            UI.toast(ziel
                ? 'Vollbild wurde abgelehnt — der Browser lässt es nur direkt nach einem Klick zu.'
                : 'Das Vollbild liess sich nicht beenden — Escape hilft immer.');
        }
        return vollbildAn();
    };
    const volleBreite = (p, an) => {
        if (!p || !p.id)
            return false;
        const neu = an === undefined ? !p.wide : !!an;
        Store.updateBlock(p.id, { wide: neu });
        p.wide = neu;
        zeichneSeite();
        return neu;
    };
    const markdownVonSeite = (p) => `# ${p.text || 'Ohne Titel'}\n\n${Werkzeuge.alsMarkdown(p)}\n`;
    const markdownExport = (p) => {
        const md = markdownVonSeite(p);
        const blob = new Blob([md], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (p.text || 'seite').replace(/[^\wäöüÄÖÜß -]/g, '') + '.md';
        a.click();
        UI.toast('Als Markdown gespeichert');
    };
    const kiPanel = (auf) => {
        const p = document.getElementById('ai');
        if (!p)
            return;
        const an = auf === undefined ? !p.classList.contains('open') : auf;
        p.classList.toggle('open', an);
        document.getElementById('btn-ai')?.classList.toggle('on', an);
        if (an && typeof KI !== 'undefined' && KI.sucheOllamaJetzt)
            KI.sucheOllamaJetzt();
        if (an)
            setTimeout(() => document.getElementById('ai-input')?.focus(), 60);
    };
    const BLATT_ZUG = 90;
    const blattAmTelefon = () => typeof matchMedia === 'function' && matchMedia('(max-width:760px)').matches;
    const kiGriff = () => {
        const blatt = document.getElementById('ai');
        if (!blatt)
            return;
        let start = 0, zug = 0, zieht = false;
        const bewegen = (e) => {
            if (!zieht)
                return;
            zug = Math.max(0, e.clientY - start);
            blatt.style.transform = 'translateY(' + zug + 'px)';
        };
        const ende = () => {
            if (!zieht)
                return;
            zieht = false;
            document.removeEventListener('pointermove', bewegen);
            document.removeEventListener('pointerup', ende);
            document.removeEventListener('pointercancel', ende);
            blatt.style.transition = '';
            void blatt.offsetHeight;
            blatt.style.transform = '';
            if (zug > BLATT_ZUG)
                kiPanel(false);
        };
        blatt.addEventListener('pointerdown', (e) => {
            if (!blattAmTelefon())
                return;
            const ziel = e.target;
            if (!ziel || typeof ziel.closest !== 'function')
                return;
            if (!ziel.closest('.ai-head'))
                return;
            if (ziel.closest('button, a, input, textarea, select'))
                return;
            start = e.clientY;
            zug = 0;
            zieht = true;
            blatt.style.transition = 'none';
            document.addEventListener('pointermove', bewegen);
            document.addEventListener('pointerup', ende);
            document.addEventListener('pointercancel', ende);
        });
    };
    const neueSeite = (elternId = null) => {
        const p = Store.addPage(elternId, { text: '' });
        zeichneBaum();
        oeffne(p.id);
        setTimeout(() => document.getElementById('title')?.focus(), 60);
        return p;
    };
    const ERSTELLEN = [
        { gruppe: 'Hereinholen', id: 'pdf', zeichen: '📕', name: 'PDF einlesen',
            sub: 'Blättern, beschreiben, Text durchsuchen',
            da: () => typeof PdfEinlesen !== 'undefined' && !!PdfEinlesen.waehlen },
        { gruppe: 'Hereinholen', id: 'scan', zeichen: '📷', name: 'Dokument scannen',
            sub: 'Kamera, Foto oder PDF in den Eingang',
            da: () => typeof Recognition !== 'undefined' && !!Recognition.scan },
        { gruppe: 'Hereinholen', id: 'datei', zeichen: '📎', name: 'Datei hochladen',
            sub: 'Bleibt auf diesem Gerät' },
        { gruppe: 'Hereinholen', id: 'zip', zeichen: '🗜', name: 'ZIP entpacken',
            sub: 'Ordner bleiben Ordner, PDFs werden Dokumente',
            da: () => typeof ArchivImport !== 'undefined' && !!ArchivImport.waehlen },
        { gruppe: 'Hereinholen', id: 'umzug', zeichen: '⇤', name: 'Aus anderem Werkzeug',
            sub: 'Notion, Obsidian, Trello, Evernote, Anki …',
            da: () => typeof Austausch !== 'undefined' && !!Austausch.dialog },
        { gruppe: 'Schreiben', id: 'heft', zeichen: '📓', name: 'Notizbuch',
            sub: 'Ein Heft mit Papier — liniert, kariert, blanko',
            da: () => typeof Notebook !== 'undefined' && !!Notebook.createNotebook },
        { gruppe: 'Schreiben', id: 'seite', zeichen: '📄', name: 'Neue Seite',
            sub: 'Leere Seite anlegen' },
        { gruppe: 'Schreiben', id: 'memo', zeichen: '⚡', name: 'Schnellnotiz',
            sub: 'Gedanken sofort festhalten' },
        { gruppe: 'Schreiben', id: 'journal', zeichen: '📔', name: 'Journal-Eintrag',
            sub: 'Der heutige Tag',
            da: () => typeof Werkzeuge !== 'undefined' && !!Werkzeuge.journal },
        { gruppe: 'Schreiben', id: 'vorlage', zeichen: '🧩', name: 'Vorlage verwenden',
            sub: 'Mit fertiger Struktur starten' },
        { gruppe: 'Schreiben', id: 'ordner', zeichen: '🗂', name: 'Ordner',
            sub: 'Eine Seite, die andere hält' },
        { gruppe: 'Zeichnen', id: 'board', zeichen: '🖍', name: 'Whiteboard',
            sub: 'Freie Fläche zum Skizzieren' },
        { gruppe: 'Zeichnen', id: 'blatt', zeichen: '📐', name: 'Blatt',
            sub: 'Mit der Hand schreiben — A4, liniert, kariert, Punktraster' },
        { gruppe: 'Zeichnen', id: 'praesentation', zeichen: '📽️', name: 'Präsentation',
            sub: 'Folien in 16:9 — mit fertigen Vorlagen',
            da: () => typeof Folienvorlagen !== 'undefined' && !!Folienvorlagen.anlegenMitWahl },
        { gruppe: 'Zeichnen', id: 'plan', zeichen: '⚡', name: 'Schaltplan',
            sub: 'Mit Fachzeichen und Stromsimulation' },
        { gruppe: 'Ordnen und rechnen', id: 'db', zeichen: '▦', name: 'Neue Datenbank',
            sub: 'Zeilen sind eigene Seiten' },
        { gruppe: 'Ordnen und rechnen', id: 'tabelle', zeichen: '📊', name: 'Neue Tabelle',
            sub: 'Rechnen wie in Excel' },
        { gruppe: 'Ordnen und rechnen', id: 'aufgabe', zeichen: '☑', name: 'Aufgabe',
            sub: 'Mit Datum planen' },
        { gruppe: 'Ordnen und rechnen', id: 'diagramm', zeichen: '📈', name: 'Diagramm',
            sub: 'Zahlen aus einer Datenbank zeichnen' },
        { gruppe: 'Lernen', id: 'karte', zeichen: '📚', name: 'Karteikarte',
            sub: 'Später wiederholen (SM-2)' },
        { gruppe: 'Lernen', id: 'lernen', zeichen: '🎓', name: 'Lernzentrale öffnen',
            sub: 'Fällige Karten, Fehler, Prüfungen',
            da: () => typeof Produktwelten !== 'undefined' && !!Produktwelten.lernen },
        { gruppe: 'Aufnehmen', id: 'aufnahme', zeichen: '🎙', name: 'Besprechung aufnehmen',
            sub: 'Mitschnitt mit Marken und Notizen',
            da: () => typeof Meeting !== 'undefined' && !!Meeting.panel }
    ];
    const arbeitsbereich = () => {
        if (!window.matchMedia('(max-width: 760px)').matches) {
            const bs = window.Backstage;
            if (bs?.oeffne) {
                bs.oeffne('konto');
                return;
            }
            if (PWA.schubladeAuf)
                PWA.schubladeAuf();
            return;
        }
        PWA.schubladeZu && PWA.schubladeZu();
        rMenue();
    };
    const erstellenWege = () => ERSTELLEN.filter(w => !w.da || w.da())
        .map(w => ({ id: w.id, zeichen: w.zeichen, name: w.name, sub: w.sub }));
    const erstellenBlatt = (anker) => {
        const wege = ERSTELLEN.filter(w => !w.da || w.da());
        const gruppen = [];
        for (const w of wege)
            if (!gruppen.includes(w.gruppe))
                gruppen.push(w.gruppe);
        const html = '<div class="menu-liste">' + gruppen.map(g => `<div class="grp">${esc(g)}</div>` +
            wege.filter(w => w.gruppe === g).map(w => `<button data-neu="${esc(w.id)}"><span class="mi">${esc(w.zeichen)}</span>` +
                `<span class="ne-txt"><b>${esc(w.name)}</b><i>${esc(w.sub)}</i></span>` +
                '<span class="ne-pfeil">›</span></button>').join('')).join('') +
            '</div>';
        const plus = document.getElementById('studio-create');
        const ort = anker || (plus && plus.getBoundingClientRect().width > 0 ? plus : null);
        const vorn = [
            { id: 'pdf', name: 'PDF einlesen', zeichen: 'upload' },
            { id: 'seite', name: 'Neue Seite', zeichen: 'page' },
            { id: 'heft', name: 'Notizbuch', zeichen: 'book' }
        ].filter(k => wege.some(w => w.id === k.id))
            .map(k => ({ ...k, ziel: `[data-neu="${k.id}"]` }));
        const m = UI.menu(html, 0, 0, { titel: 'Neu erstellen', anker: ort, tropfen: vorn });
        m.addEventListener('click', (e) => {
            const b = (e.target instanceof Element)
                ? e.target.closest('[data-neu]') : null;
            if (!b)
                return;
            const was = b.dataset['neu'];
            document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
            setTimeout(() => { erstellenWeg(was || ''); }, 60);
        });
    };
    const erstellenWeg = (was) => {
        if (was === 'heft') {
            Notebook.createNotebook();
            return;
        }
        if (was === 'seite') {
            neueSeite();
            return;
        }
        if (was === 'memo') {
            Werkzeuge.schnellnotizen();
            return;
        }
        if (was === 'datei') {
            Werkzeuge.dateienLesen();
            return;
        }
        if (was === 'zip') {
            const fach = String(Store.getMeta('heft:fach') || '');
            const ziel = schauplatz() === 'notizhefte' && fach && Store.getBlock(fach) ? fach : null;
            void ArchivImport.waehlen(ziel);
            return;
        }
        if (was === 'scan') {
            Recognition.scan();
            return;
        }
        if (was === 'vorlage') {
            Werkzeuge.vorlagen();
            return;
        }
        if (was === 'karte') {
            Werkzeuge.lernen();
            return;
        }
        if (was === 'journal') {
            Werkzeuge.journal();
            return;
        }
        if (was === 'umzug') {
            Austausch.dialog();
            return;
        }
        if (was === 'pdf') {
            const ziel = neueSeite();
            void PdfEinlesen.waehlen(ziel.id).then((erg) => {
                if (erg) {
                    zeichneBaum();
                    zeichneSeite();
                    return;
                }
                const jetzt = Store.getBlock(ziel.id);
                const leer = jetzt && !(jetzt.text || '').trim() &&
                    (Store.childrenOf(ziel.id) || [])
                        .filter((k) => k && k.alive !== false).length === 0;
                if (leer) {
                    Store.updateBlock(ziel.id, { alive: false });
                    zeichneBaum();
                }
            });
            return;
        }
        if (was === 'praesentation') {
            void Folienvorlagen.anlegenMitWahl();
            return;
        }
        if (was === 'lernen') {
            Produktwelten.lernen('lernen');
            return;
        }
        if (was === 'aufnahme') {
            if (typeof Meeting !== 'undefined' && Meeting.panel)
                Meeting.panel();
            else
                UI.toast('Die Aufnahme ist in dieser Fassung nicht geladen.');
            return;
        }
        if (was === 'ordner') {
            const ord = Store.addPage(null, { text: '', icon: '\ud83d\uddc2' });
            zeichneBaum();
            oeffne(ord.id);
            setTimeout(() => document.getElementById('title')?.focus(), 60);
            return;
        }
        const p = neueSeite();
        setTimeout(() => {
            if (was === 'db')
                Store.addDatabase(p.id, 'Ohne Namen');
            else if (was === 'tabelle')
                Store.addBlock(p.id, 'spreadsheet', {});
            else if (was === 'board')
                Store.addBlock(p.id, 'whiteboard', { text: 'Whiteboard' });
            else if (was === 'blatt') {
                Store.addBlock(p.id, 'blatt', { text: '' });
                Store.updateBlock(p.id, { dokumentModus: true });
            }
            else if (was === 'plan')
                Store.addBlock(p.id, 'schaltplan', { text: '' });
            else if (was === 'diagramm')
                Store.addBlock(p.id, 'chart', { text: '' });
            else if (was === 'aufgabe')
                Store.addBlock(p.id, 'todo', { text: '' });
            zeichneSeite();
        }, 80);
    };
    const seitenleisteBreite = () => {
        const side = document.getElementById('sidebar');
        if (!side || side.querySelector('.side-griff'))
            return;
        const gespeichert = Number(Store.getMeta('seiteBreite', 0));
        const setze = (px) => {
            const b = Math.max(180, Math.min(460, px));
            side.style.width = b + 'px';
            side.style.flexBasis = b + 'px';
            document.documentElement.style.setProperty('--side-w', b + 'px');
            return b;
        };
        if (gespeichert)
            setze(gespeichert);
        const griff = document.createElement('div');
        griff.className = 'side-griff';
        griff.title = 'Breite ziehen — Doppelklick setzt zurück';
        side.appendChild(griff);
        griff.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            const start = e.clientX;
            const b0 = side.getBoundingClientRect().width;
            document.body.classList.add('zieht-seite');
            const zug = (ev) => setze(b0 + ev.clientX - start);
            const stop = () => {
                removeEventListener('pointermove', zug);
                removeEventListener('pointerup', stop);
                document.body.classList.remove('zieht-seite');
                Store.setMeta('seiteBreite', Math.round(side.getBoundingClientRect().width));
            };
            addEventListener('pointermove', zug);
            addEventListener('pointerup', stop);
        });
        griff.addEventListener('dblclick', () => {
            setze(240);
            Store.setMeta('seiteBreite', 240);
            UI.toast('Breite zurückgesetzt');
        });
    };
    const tasten = () => {
        document.addEventListener('keydown', e => {
            const strg = e.ctrlKey || e.metaKey;
            if (!strg)
                return;
            const k = e.key.toLowerCase();
            if (typeof Aussehen !== 'undefined' && Object.keys(Aussehen.eigene()).length) {
                const tu = { suche, palette: () => Werkzeuge.palette(), neu: () => { neueSeite(); },
                    ki: () => kiPanel(), chat: () => KI.neuerChat && KI.neuerChat(),
                    seitenleiste: () => { document.getElementById('sidebar')?.classList.toggle('collapsed'); },
                    zurueck, vor: vorwaerts, hell: () => theme(),
                    hilfe: () => Werkzeuge.tastenkuerzel(),
                    einstellung: () => einstellungen(),
                    teilen: () => { Fenster.geteilt() ? Fenster.teilenAus() : Fenster.teilen(); },
                    reiterNeu: () => Fenster.neuerReiter(),
                    reiterZu: () => Fenster.schliessen(Fenster.aktiv()) };
                for (const id of Object.keys(Aussehen.eigene())) {
                    const fn = tu[id];
                    if (fn && !Aussehen.reserviert(Aussehen.alsText(e)) && Aussehen.ist(id, e)) {
                        e.preventDefault();
                        fn();
                        return;
                    }
                }
                const belegt = Object.keys(Aussehen.eigene());
                const jetzt = Aussehen.alsText(e).toLowerCase();
                const kollision = Aussehen.KUERZEL.find(([id, , std]) => belegt.includes(id) && String(std ?? '').toLowerCase() === jetzt);
                if (kollision)
                    return;
            }
            if (k === 'n' && !e.shiftKey) {
                e.preventDefault();
                neueSeite();
                return;
            }
            if (k === 'p' && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                suche();
                return;
            }
            if (k === 'k' && !e.shiftKey) {
                e.preventDefault();
                suche();
                return;
            }
            if (k === '\\') {
                e.preventDefault();
                if (typeof Kontextkante !== 'undefined'
                    && !window.matchMedia('(max-width: 760px)').matches) {
                    Kontextkante.schalten();
                }
                else {
                    document.getElementById('sidebar')?.classList.toggle('collapsed');
                }
                return;
            }
            if (k === 'm' && !e.shiftKey) {
                if (typeof Kontextkante !== 'undefined'
                    && !window.matchMedia('(max-width: 760px)').matches) {
                    e.preventDefault();
                    Kontextkante.ladeSchalten();
                    return;
                }
                if (typeof Ruhig !== 'undefined' && Ruhig.an()) {
                    e.preventDefault();
                    Ruhig.schalten();
                    return;
                }
            }
            if (k === 'j' && !e.shiftKey) {
                e.preventDefault();
                kiPanel();
                return;
            }
            if (e.shiftKey && k === 'l') {
                e.preventDefault();
                theme();
                return;
            }
            if (k === ',') {
                e.preventDefault();
                einstellungen();
                return;
            }
            if (k === '[') {
                e.preventDefault();
                zurueck();
                return;
            }
            if (k === ']') {
                e.preventDefault();
                vorwaerts();
                return;
            }
            if (k === 'f' && !e.shiftKey) {
                e.preventDefault();
                seitenSuche();
                return;
            }
            if (e.defaultPrevented && (k === 'z' || k === 'y'))
                return;
            if (k === 'z' && !e.shiftKey) {
                e.preventDefault();
                Verlauf.zurueck();
                return;
            }
            if ((k === 'y' && !e.shiftKey) || (e.shiftKey && k === 'z')) {
                e.preventDefault();
                Verlauf.vor();
                return;
            }
            if (e.shiftKey && k === 'h') {
                e.preventDefault();
                Auswahl.letzteFarbeAnwenden();
                return;
            }
            if (k === 'l' && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                Ablage.kopiereJetzt(location.origin + location.pathname + '#' + aktuelleSeite(), 'Link zur Seite kopiert');
                return;
            }
            if (e.shiftKey && k === 'u') {
                e.preventDefault();
                const b = Store.getBlock(aktuelleSeite());
                const eltern = b && b.parentId && Store.getBlock(b.parentId);
                if (eltern)
                    oeffne(eltern.id);
                else
                    UI.toast('Diese Seite liegt schon ganz oben');
                return;
            }
            if (e.altKey && k === 't') {
                e.preventDefault();
                Blocks.alleToggles();
                return;
            }
            if (e.shiftKey && k === 'd') {
                e.preventDefault();
                const b = Store.getBlock(aktuelleSeite());
                if (b)
                    dupliziereSeite(b.id);
                return;
            }
            if (e.shiftKey && k === 'y') {
                e.preventDefault();
                const b = Store.getBlock(aktuelleSeite());
                if (!b)
                    return;
                Store.updateBlock(b.id, { favorite: !b.favorite });
                zeichneBaum();
                UI.toast(b.favorite ? 'Zu den Favoriten' : 'Von den Favoriten genommen');
                return;
            }
            if (e.shiftKey && k === 'n') {
                e.preventDefault();
                const b = Store.getBlock(aktuelleSeite());
                const p = Store.addPage(b ? b.id : null, { text: '' });
                zeichneBaum();
                oeffne(p.id);
                return;
            }
            if (e.shiftKey && k === 'b') {
                e.preventDefault();
                papierkorb();
                return;
            }
            if (e.shiftKey && k === 'o') {
                e.preventDefault();
                if (typeof Rundgang !== 'undefined')
                    Rundgang.uebersicht();
                return;
            }
            if (!e.shiftKey && (k === '+' || k === '-' || k === '0') && !e.altKey) {
                const stufen = ['klein', 'normal', 'gross'];
                const jetzt = Store.getMeta('schriftgroesse', 'normal');
                let neu = jetzt;
                if (k === '+')
                    neu = stufen[Math.min(2, stufen.indexOf(jetzt) + 1)];
                if (k === '-')
                    neu = stufen[Math.max(0, stufen.indexOf(jetzt) - 1)];
                if (k === '0')
                    neu = 'normal';
                if (neu !== jetzt) {
                    e.preventDefault();
                    Store.setMeta('schriftgroesse', neu);
                    Einstellungen.anwenden();
                    UI.toast('Schrift: ' + neu);
                }
                return;
            }
        });
        let warOffen = false;
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape')
                warOffen = !!document.querySelector('.menu, .overlay, dialog[open], .iblatt, #r-blatt.auf');
        }, true);
        document.addEventListener('keydown', e => {
            if (e.key !== 'Escape')
                return;
            const letztes = (wahl) => {
                const alle = document.querySelectorAll(wahl);
                return alle.length ? alle[alle.length - 1] : null;
            };
            const m = letztes('.menu');
            const o = letztes('.overlay');
            if (m)
                m.remove();
            else if (o) {
                if (!o.hasAttribute('data-insel-traeger') ||
                    !o.querySelector('.ui-touch-dialog, .ui-touch-action-sheet'))
                    o.remove();
            }
            else {
                const knopf = letztes('[data-esc-knopf]');
                const feld = knopf?.closest('[role="dialog"]');
                const fokus = document.activeElement;
                const imText = fokus instanceof HTMLElement && !feld?.contains(fokus) &&
                    (fokus.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(fokus.tagName));
                if (knopf && feld) {
                    if (!warOffen && !imText)
                        knopf.click();
                }
                else if (!warOffen && !e.defaultPrevented && typeof Hinweis !== 'undefined')
                    Hinweis.escape();
            }
        });
    };
    const rolleZu = (blockId) => {
        const hin = () => {
            Blocks.zeichneFuer(blockId);
            const ziel = document.querySelector(`[data-bid="${blockId}"]`);
            if (!ziel)
                return false;
            ziel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            ziel.classList.add('hebe-hervor');
            setTimeout(() => ziel.classList.remove('hebe-hervor'), 1400);
            const bild = ziel.querySelector('img');
            if (bild && !bild.complete)
                bild.addEventListener('load', () => ziel.scrollIntoView({ behavior: 'smooth', block: 'center' }), { once: true });
            return true;
        };
        requestAnimationFrame(() => { if (!hin())
            requestAnimationFrame(hin); });
    };
    const klappeAuf = (blockId) => {
        let geaendert = false;
        let b = Store.getBlock(blockId);
        let tiefe = 0;
        while (b && b.parentTable === 'block' && b.parentId && tiefe++ < 64) {
            const eltern = Store.getBlock(String(b.parentId));
            if (!eltern)
                break;
            if ((eltern.type === 'toggle' || eltern.toggleKopf) && !eltern.open) {
                Store.updateBlock(eltern.id, { open: true });
                geaendert = true;
            }
            b = eltern;
        }
        return geaendert;
    };
    const zeigeBlock = (blockId) => {
        const b = blockId ? Store.getBlock(blockId) : null;
        if (!b || b.alive === false) {
            UI.toast('Dieser Block ist nicht mehr da.');
            return false;
        }
        const seite = (typeof Links !== 'undefined' && Links.seiteVon)
            ? Links.seiteVon(blockId) : null;
        if (!seite) {
            UI.toast('Zu diesem Block führt kein Weg — seine Seite fehlt.');
            return false;
        }
        const dokumentZiel = b.type === 'pdfseite' || b.type === 'blatt';
        let ansichtGeaendert = false;
        if (dokumentZiel && typeof DocumentMode !== 'undefined' && DocumentMode.select(seite, b.id)) {
            ansichtGeaendert = true;
            if (!seite.dokumentModus)
                Store.updateBlock(seite.id, { dokumentModus: true });
        }
        else if (!dokumentZiel && seite.dokumentModus) {
            Store.updateBlock(seite.id, { dokumentModus: false });
            ansichtGeaendert = true;
        }
        const aufgeklappt = klappeAuf(blockId);
        if (aktuelleSeite() !== seite.id)
            oeffne(seite.id);
        else if (ansichtGeaendert || aufgeklappt)
            zeichneSeite();
        rolleZu(blockId);
        return true;
    };
    const blockAusHash = (roh) => {
        const m = String(roh || '').replace(/^#/, '').match(/^block=(.+)$/);
        return m && m[1] ? decodeURIComponent(m[1]) : '';
    };
    const SONDER_START = {
        dokumente: () => Bibliothek.oeffne(),
        'alle-seiten': () => (Bibliothek.alleZeigen ? Bibliothek.alleZeigen() : Bibliothek.oeffne()),
        'seiten-wissen': () => Arbeitswelt.oeffnen('uebersicht'),
        'dateien-pdfs': () => Arbeitswelt.oeffnen('bibliothek'),
        aufgaben: () => Arbeitswelt.oeffnen('aufgaben'),
        datenbanken: () => Arbeitswelt.oeffnen('datenbanken'),
        whiteboards: () => Arbeitswelt.oeffnen('whiteboards'),
        'wissen-verweise': () => Arbeitswelt.oeffnen('wiki'),
        vorlagen: () => Arbeitswelt.oeffnen('vorlagen'),
        workspace: () => Arbeitswelt.oeffnen('uebersicht'),
        arbeitsbereich: () => Arbeitswelt.oeffnen('uebersicht'),
        notizhefte: () => {
            const N = globalThis.Notebook;
            if (N && typeof N.oeffnen === 'function')
                N.oeffnen();
            else
                Bibliothek.oeffne();
        },
        kalender: () => {
            const P = globalThis.Produktwelten;
            if (P && typeof P.kalender === 'function')
                P.kalender();
            else
                Bibliothek.oeffne();
        },
    };
    const vorhangWeg = () => {
        const v = document.getElementById('ru-vorhang');
        if (!v || v.hidden)
            return;
        v.classList.add('ru-vorhang-weg');
        setTimeout(() => { if (v.classList.contains('ru-vorhang-weg'))
            v.hidden = true; }, 600);
    };
    const start = async () => {
        if (typeof Register !== 'undefined' && Register.symbole) {
            Register.symbole.fuelle(document);
        }
        if (typeof Store !== 'undefined' && Store.istDemo && Store.istDemo()) {
            const balken = document.createElement('div');
            balken.id = 'demo-balken';
            balken.setAttribute('role', 'status');
            balken.innerHTML = '<b>Vorführung</b> — hier liegen Beispieldaten in ' +
                'einer eigenen Ablage. Deine eigenen Notizen sind davon nicht ' +
                'berührt. <a href="./index.html">Zu deinen Notizen</a>';
            document.body.prepend(balken);
            document.body.classList.add('hat-demo');
            const hoeheSetzen = () => document.documentElement.style
                .setProperty('--demo-hoehe', balken.offsetHeight + 'px');
            hoeheSetzen();
            addEventListener('resize', hoeheSetzen);
        }
        const ROLLER_RESERVE = 16;
        let luftZuletzt = -1;
        const luftMessen = () => {
            const roller = document.getElementById('scroll');
            const seite = document.getElementById('page');
            if (!roller || !seite)
                return;
            const wert = Math.max(0, Math.round((roller.offsetWidth - ROLLER_RESERVE - seite.clientWidth) / 2));
            if (Math.abs(wert - luftZuletzt) < 8)
                return;
            luftZuletzt = wert;
            seite.style.setProperty('--seite-luft', wert + 'px');
        };
        let luftGeplant = false;
        const luftBald = () => {
            if (luftGeplant)
                return;
            luftGeplant = true;
            requestAnimationFrame(() => { luftGeplant = false; luftMessen(); });
        };
        luftMessen();
        addEventListener('resize', luftBald, { passive: true });
        if (typeof ResizeObserver !== 'undefined') {
            const beobachter = new ResizeObserver(luftBald);
            const roller = document.getElementById('scroll');
            const seite2 = document.getElementById('page');
            if (roller)
                beobachter.observe(roller);
            if (seite2)
                beobachter.observe(seite2);
        }
        Seitenleiste.binde({
            oeffne, aktuelleSeite, kuerzlich, kommendeTermine, seitenMenue, suche, papierkorb
        });
        if (typeof Ruhig !== 'undefined')
            Ruhig.binde();
        Kopfleiste.binde({
            zeichneSeite, zeichneBaum, kiPanel, oeffne, aktuelleSeite,
            volleBreite,
            sonder: () => sonder
        });
        Inhaltsflaeche.binde({ aktuelleSeite });
        if (typeof Kontextkante !== 'undefined')
            Kontextkante.binde();
        if (typeof Auftraege !== 'undefined') {
            void Auftraege.start();
        }
        const schonGemeldet = new Set();
        const fehlerMelden = (text, ort, fremd) => {
            const schluessel = text + '|' + ort;
            if (schonGemeldet.has(schluessel))
                return;
            schonGemeldet.add(schluessel);
            try {
                const bisher = Store.getMeta('fehlerprotokoll', []) || [];
                bisher.push({ wann: new Date().toISOString(), text, ort, fremd });
                Store.setMeta('fehlerprotokoll', bisher.slice(-20));
            }
            catch { }
            fehlerKarte(fremd, text, ort);
        };
        const fehlerKarte = (fremd, text, ort) => {
            document.getElementById('fehler-karte')?.remove();
            const k = document.createElement('div');
            k.id = 'fehler-karte';
            k.setAttribute('role', 'alert');
            k.innerHTML =
                '<div class="fk-kopf"><span class="fk-zeichen">!</span>' +
                    '<b>Etwas ist schiefgelaufen</b>' +
                    '<button class="fk-zu" data-a="zu" aria-label="Meldung schliessen">✕</button></div>' +
                    '<div class="fk-satz">' + (fremd
                    ? 'Der Fehler kommt von ausserhalb — meist von einer Browser-Erweiterung ' +
                        'oder eingebettetem Inhalt. Redion läuft weiter.'
                    : 'Redion konnte diesen Schritt nicht ausführen. Deine Notizen sind davon ' +
                        'nicht betroffen.') + '</div>' +
                    '<div class="fk-knoepfe"><button data-a="kopieren">Details kopieren</button>' +
                    '<button data-a="zu">Schliessen</button></div>';
            document.body.appendChild(k);
            requestAnimationFrame(() => k.classList.add('auf'));
            const einzelheiten = [text, ort, location.href, navigator.userAgent]
                .filter(Boolean).join('\n');
            k.addEventListener('click', async (ev) => {
                const b = (ev.target instanceof Element) ? ev.target.closest('button') : null;
                if (!b)
                    return;
                if (b.dataset.a === 'zu') {
                    k.remove();
                    return;
                }
                if (b.dataset.a !== 'kopieren')
                    return;
                try {
                    await Ablage.kopiere(einzelheiten);
                    b.textContent = 'Kopiert';
                }
                catch {
                    b.textContent = 'Kopieren geht hier nicht';
                    const pre = document.createElement('pre');
                    pre.className = 'fk-roh';
                    pre.textContent = einzelheiten;
                    k.appendChild(pre);
                }
            });
        };
        addEventListener('error', (e) => {
            if (!(e instanceof ErrorEvent))
                return;
            const text = String(e.message || (e.error && e.error.message) || '').trim();
            const ort = e.filename ? e.filename.split('/').pop() + ':' + e.lineno : '';
            const fremd = (!text || /^script error/i.test(text)) && !e.filename && !e.error;
            fehlerMelden(text || 'Unbekannter Fehler', ort, fremd);
        });
        addEventListener('unhandledrejection', (e) => {
            const grund = e.reason;
            const text = String(grund?.message ?? grund ?? '').trim();
            fehlerMelden(text || 'Ein Versprechen wurde gebrochen, ohne Grund zu nennen', '', /^script error/i.test(text));
        });
        Store.beiWarnung((text) => UI.banner(text, 'warn'));
        try {
            await starteWirklich();
            vorhangWeg();
        }
        catch (err) {
            vorhangWeg();
            UI.banner('Die App konnte nicht starten: ' +
                (err instanceof Error ? err.message : String(err)), 'fehler');
            throw err;
        }
    };
    const starteWirklich = async () => {
        await Store.load();
        if (typeof Ruhig !== 'undefined')
            Ruhig.anwenden();
        await Krypto.startPruefen();
        if (Store.getMeta('arbeitsName', '') === 'Notizen')
            Store.setMeta('arbeitsName', 'Redion');
        document.documentElement.dataset.theme = Store.getMeta('theme', 'dark');
        Aussehen.start();
        Einstellungen.anwenden();
        if (!Store.rootPages().length)
            beispielAnlegen();
        Wissen.sicherstellen();
        Werkzeuge.formelBibliothekAnwenden();
        Pflege.start();
        const produktRoute = Produktwelten.routeAusHash(location.hash);
        const zielBlock = produktRoute ? '' : blockAusHash(location.hash);
        const rohHash = location.hash.slice(1).split(':')[0] || '';
        const ausHash = produktRoute ? '' : zielBlock
            ? ((typeof Links !== 'undefined' && Links.seiteVon)
                ? (Links.seiteVon(zielBlock) || {}).id || '' : '')
            : rohHash;
        const hashSeite = (ausHash && Store.getBlock(ausHash)) ? ausHash : '';
        const sonderHash = (!produktRoute && !zielBlock && rohHash in SONDER_START) ? rohHash : '';
        const zuletztOffen = Store.getMeta('letzte');
        const zuletztBlock = zuletztOffen ? Store.getBlock(zuletztOffen) : null;
        const hatteDokument = !!(zuletztBlock && zuletztBlock.alive !== false);
        const ortZuletzt = String(sonderHash || Store.getMeta('zuletztOrt', 'seite') || 'seite');
        const wiederDokument = hatteDokument && ortZuletzt === 'seite';
        if (!Store.getMeta('startAnsichtE349')) {
            const alt = Store.getMeta('startAnsicht');
            if (alt === 'start' || alt === 'workspace')
                Store.setMeta('startAnsicht', 'dokument');
            Store.setMeta('startAnsichtE349', true);
        }
        const wunsch = Store.getMeta('startAnsicht', 'dokument');
        const dokumentStart = wunsch === 'dokument' || wunsch === 'letzte';
        const startSeite = hashSeite ? hashSeite
            : dokumentStart ? (wiederDokument ? zuletztOffen : '')
                : hatteDokument ? zuletztOffen
                    : (Store.rootPages()[0] || {}).id;
        zeichneBaum();
        if (startSeite)
            oeffne(startSeite);
        else {
            zeichneSeite();
            schauplatzMelden();
        }
        if (zielBlock)
            zeigeBlock(zielBlock);
        addEventListener('hashchange', () => {
            const b = blockAusHash(location.hash);
            if (b) {
                zeigeBlock(b);
                return;
            }
            const alt = Produktwelten.routeAusHash();
            if (alt?.welt === 'workspace') {
                Produktwelten.routeOeffnen(alt);
                return;
            }
            const ort = location.hash.slice(1);
            const jetzt = String(sonder?.titel || '').toLowerCase().replace(/[^a-z]+/g, '-');
            if (ort !== jetzt && SONDER_START[ort])
                SONDER_START[ort]();
        });
        void 0;
        const schreibtGerade = () => {
            const a = document.activeElement;
            if (!(a instanceof HTMLElement))
                return false;
            return a.isContentEditable || a.tagName === 'INPUT' || a.tagName === 'TEXTAREA';
        };
        Store.on((was) => {
            if (was !== 'fremd' && was !== 'fremd-alles')
                return;
            if (was === 'fremd-alles') {
                UI.toast('Ein anderes Fenster hat den ganzen Bestand ausgetauscht — bitte neu laden');
                return;
            }
            if (schreibtGerade())
                return;
            zeichneBaum();
            zeichneSeite();
        });
        let startAnsichtZeigen = null;
        if (!hashSeite && !produktRoute) {
            if (dokumentStart && !wiederDokument)
                startAnsichtZeigen = SONDER_START[ortZuletzt] || (() => Bibliothek.oeffne());
            if (wunsch === 'dokumente')
                startAnsichtZeigen = () => Bibliothek.oeffne();
            if (wunsch === 'start')
                startAnsichtZeigen = () => Produktwelten.lernen('heute');
            if (wunsch === 'workspace')
                startAnsichtZeigen = () => Produktwelten.workspace('start');
            if (wunsch === 'posteingang')
                startAnsichtZeigen = () => Ansichten.posteingang();
            if (wunsch === 'journal')
                startAnsichtZeigen = () => Werkzeuge.journal();
            if (wunsch === 'notizhefte')
                startAnsichtZeigen = () => globalThis.Notebook?.oeffnen?.();
            if (wunsch === 'notizheft')
                startAnsichtZeigen = () => globalThis.Notebook?.resume?.();
            if (wunsch === 'seite' && Store.getMeta('startSeite')) {
                const z = Store.getBlock(Store.getMeta('startSeite'));
                if (z)
                    oeffne(z.id);
            }
        }
        if (produktRoute)
            startAnsichtZeigen = () => Produktwelten.routeOeffnen(produktRoute);
        else if (sonderHash)
            startAnsichtZeigen = SONDER_START[sonderHash] || null;
        const wsBtn = document.getElementById('btn-settings');
        const wsName = wsBtn?.querySelector('.ws-name');
        document.querySelectorAll('.ws-icon').forEach(ico => {
            ico.textContent = Store.getMeta('arbeitsIcon', 'N');
        });
        if (wsName)
            wsName.textContent = Store.getMeta('arbeitsName', 'Redion');
        Blocks.bindeEditor(document.getElementById('page'));
        tasten();
        KI.bindePanel();
        KI.start();
        Links.start();
        Werkzeuge.start();
        Verlauf.start();
        Auswahl.start();
        Erwaehnung.start();
        Mehrfach.start();
        Einstellungen.start();
        Mail.kuerzelStart();
        Clipper.start();
        Agent.start();
        MCP.start();
        PWA.start();
        Fenster.start();
        Tempo.start();
        Plan.start();
        Erweiterung.start();
        Eingang.start();
        Api.start();
        Protokoll.start();
        Zusammen.start();
        Fassung.start();
        Vorrat.start();
        Wolke.start();
        if (typeof OrdnerSicherung !== 'undefined')
            OrdnerSicherung.start();
        Produktwelten.start();
        Menueband.start();
        if (typeof StudioSchale !== 'undefined')
            StudioSchale.start();
        Blocks.auswahlEinklinken();
        Rundgang.vielleichtStarten();
        const an = (id, fn) => document.getElementById(id)?.addEventListener('click', fn);
        if (typeof Register !== 'undefined' && Register.navigation) {
            [...Register.navigation.anPlatz('oben'),
                ...Register.navigation.anPlatz('fuss')].forEach((e) => {
                if (e.knopfId && e.tun)
                    an(e.knopfId, () => {
                        try {
                            e.tun();
                            if (e.platz === 'oben') {
                                document.querySelectorAll('#sidebar .side-item[aria-current]')
                                    .forEach(k => k.removeAttribute('aria-current'));
                                document.getElementById(e.knopfId)?.setAttribute('aria-current', 'page');
                            }
                        }
                        catch (fehler) {
                            if (typeof Reporter !== 'undefined')
                                Reporter.error('Seitenleiste', e.knopfId + ': ' + (fehler instanceof Error ? fehler.message : String(fehler)), fehler);
                        }
                    });
            });
        }
        an('btn-ai', () => kiPanel());
        an('ai-zu', () => kiPanel(false));
        kiGriff();
        an('btn-settings', einstellungen);
        an('btn-theme', () => theme());
        an('btn-side', () => document.getElementById('sidebar')?.classList.toggle('collapsed'));
        seitenleisteBreite();
        an('btn-new-bottom', () => neueSeite());
        an('btn-neuer-chat', () => { Seitenleiste.reiter('chat'); zeichneBaum(); KI.neuerChat(); });
        const dockWechsel = (reiterId, knopfId, oeffnen) => {
            const vorher = typeof Wischen !== 'undefined' ? Wischen.jetzt() : -1;
            const nachher = typeof Wischen !== 'undefined'
                ? Wischen.reiter().findIndex(b => b.id === knopfId) : -1;
            Seitenleiste.reiter(reiterId);
            handyLeiste(knopfId);
            requestAnimationFrame(() => requestAnimationFrame(() => {
                oeffnen();
                if (typeof Wischen !== 'undefined')
                    Wischen.ankunft(vorher, nachher);
            }));
        };
        const REITER_UNTEN = [
            { knopf: 'hl-dok', reiter: 'dokumente', oeffnen: () => Bibliothek.oeffne() },
            { knopf: 'hl-start', reiter: 'start', oeffnen: () => Produktwelten.lernen('heute') },
            { knopf: 'hl-lernen', reiter: 'lernen', oeffnen: () => Produktwelten.lernen('lernen') },
            { knopf: 'hl-bespr', reiter: 'bespr', oeffnen: () => Produktwelten.planung() },
            { knopf: 'hl-mehr', reiter: 'mehr', oeffnen: () => Ansichten.mehr() }
        ];
        const wechsle = (knopfId, tun) => {
            const r = REITER_UNTEN.find(x => x.knopf === knopfId);
            if (!r)
                return;
            PWA.schubladeZu && PWA.schubladeZu();
            dockWechsel(r.reiter, r.knopf, () => { (tun ?? r.oeffnen)(); handyLeiste(); });
        };
        REITER_UNTEN.forEach(r => an(r.knopf, () => wechsle(r.knopf)));
        an('btn-suche-handy', () => suche());
        an('btn-neu-handy', () => neueSeite());
        try {
            window.Wischen?.starten?.();
        }
        catch { }
        if (typeof TabShelf !== 'undefined') {
            try {
                TabShelf.attach({ bar: document.getElementById('handy-oben'), go: (knopf, tun) => wechsle(knopf.id, tun) });
            }
            catch (e) {
                console.error('[Zielleiste]', e);
            }
        }
        handyLeiste();
        document.getElementById('side-reiter')?.addEventListener('click', (e) => {
            const b = elVon(e)?.closest('[data-reiter]');
            if (!b)
                return;
            const r = b.dataset.reiter;
            if (!r)
                return;
            if (r === Seitenleiste.reiter() && Seitenleiste.reiter() === 'start') {
                abschnitteAnpassen();
                return;
            }
            if (r === 'start') {
                Produktwelten.lernen('heute');
                return;
            }
            reiterWechseln(r);
        });
        an('btn-import', (e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const telefon = window.matchMedia('(max-width: 760px)').matches;
            const m = UI.menu('<div class="grp">Was soll hereinkommen?</div>' +
                '<button data-i="dateien"><span class="mi">📄</span>Dateien wählen' +
                '<span class="sub">Markdown, CSV, HTML, Word, PowerPoint, Excel, EPUB, PDF</span></button>' +
                (telefon ? '' :
                    '<button data-i="ordner"><span class="mi">📁</span>Ganzen Ordner einlesen</button>') +
                '<hr><button data-i="werkzeug"><span class="mi">⭱</span>Aus einem anderen Werkzeug' +
                '<span class="sub">Trello, Evernote, Obsidian, Notion-Export, Asana</span></button>' +
                '<hr><div class="grp" style="font-weight:400">' +
                (telefon ? 'Die Auswahl öffnet die Dateien-App des Telefons.'
                    : 'Oder einfach eine Datei auf die Seite ziehen.') + '</div>', r.right + 6, r.top);
            m.addEventListener('click', ev => {
                const b = elVon(ev)?.closest('button[data-i]');
                if (!b)
                    return;
                m.remove();
                if (b.dataset.i === 'dateien')
                    Werkzeuge.dateienLesen();
                else if (b.dataset.i === 'werkzeug')
                    Austausch.dialog();
                else
                    Werkzeuge.ordnerLesen();
            });
        });
        an('btn-back', zurueck);
        an('btn-fwd', vorwaerts);
        navKnoepfeStellen();
        an('btn-komm', () => seiteId && Kommentare.panel(seiteId));
        an('btn-teilen', (e) => {
            const p = Store.getBlock(seiteId);
            if (p)
                Werkzeuge.teilenMenue(e.currentTarget, p);
        });
        an('btn-verlauf', () => seiteId && Werkzeuge.versionen(Store.getBlock(seiteId)));
        an('btn-link', () => {
            if (!seiteId)
                return;
            Ablage.kopiereJetzt(location.origin + location.pathname + '#' + seiteId, 'Link zur Seite kopiert');
        });
        an('btn-lock', () => {
            if (!seiteId)
                return;
            const p = Store.getBlock(seiteId);
            Store.updateBlock(p.id, { gesperrt: !p.gesperrt });
            zeichneSeite();
            zeichneCrumbs();
            UI.toast(p.gesperrt ? 'Seite ist gesperrt' : 'Bearbeiten wieder erlaubt');
        });
        an('btn-auto', (e) => {
            if (!seiteId)
                return;
            const dbs = Store.childrenOf(seiteId).filter((b) => b.type === 'database');
            if (!dbs.length) {
                UI.toast('Auf dieser Seite gibt es keine Datenbank');
                return;
            }
            const oeffneAuto = (b) => {
                const c = Store.getCollection(b.collectionId);
                const v = Store.getView(b.aktiveView || (c && c.viewIds[0]));
                if (c)
                    Datenbank.automationenMenue(e.currentTarget, c, v, b);
            };
            if (dbs.length === 1) {
                oeffneAuto(dbs[0]);
                return;
            }
            const r = e.currentTarget.getBoundingClientRect();
            const m = UI.menu('<div class="grp">Welche Datenbank?</div>' +
                dbs.map((b, i) => {
                    const c = Store.getCollection(b.collectionId);
                    return `<button data-i="${i}"><span class="mi">⚡</span>${esc(c ? c.name : 'Datenbank')}</button>`;
                }).join(''), r.left - 140, r.bottom + 6);
            m.addEventListener('click', ev => {
                const b2 = elVon(ev)?.closest('button[data-i]');
                if (!b2)
                    return;
                m.remove();
                oeffneAuto(dbs[Number(b2.dataset.i)]);
            });
        });
        an('btn-fav', () => {
            if (!seiteId)
                return;
            favoritKippen(Store.getBlock(seiteId));
        });
        an('btn-page-menu', (e) => {
            const p = Store.getBlock(seiteId);
            if (p)
                seitenMenue(e.currentTarget, p);
        });
        const griff = document.createElement('div');
        griff.id = 'side-griff';
        document.getElementById('sidebar')?.appendChild(griff);
        const gespeicherteBreite = Store.getMeta('seitenleiste', 0);
        if (gespeicherteBreite)
            setzeBreite(gespeicherteBreite);
        griff.addEventListener('pointerdown', e => {
            e.preventDefault();
            const zug = (ev) => setzeBreite(Math.max(180, Math.min(460, ev.clientX)));
            const stop = () => {
                removeEventListener('pointermove', zug);
                removeEventListener('pointerup', stop);
                const leiste = document.getElementById('sidebar');
                if (leiste)
                    Store.setMeta('seitenleiste', leiste.getBoundingClientRect().width);
            };
            addEventListener('pointermove', zug);
            addEventListener('pointerup', stop);
        });
        addEventListener('beforeunload', () => { Store.flush().catch(() => { }); });
        if (startAnsichtZeigen) {
            try {
                startAnsichtZeigen();
            }
            catch (fehler) {
                console.error('Die Startansicht konnte nicht geöffnet werden:', fehler);
            }
        }
    };
    const beispielAnlegen = () => {
        const p = Store.addPage(null, { text: 'Willkommen', icon: '👋' });
        const b = (typ, text, extra) => Store.addBlock(p.id, typ, Object.assign({ text }, extra || {}));
        b('h1', 'Willkommen in Redion');
        b('text', 'Alles hier liegt **lokal** in deinem Browser — ohne Konto, ohne Server. ' +
            'Ein eigener Server für den Abgleich zwischen deinen Geräten ist ' +
            'möglich und freiwillig (Mehr → Wolke).');
        b('callout', 'Tippe irgendwo `/` — dann öffnet sich das Blockmenü mit allen Bausteinen.', { icon: '💡' });
        b('h2', 'Was du sofort ausprobieren kannst');
        b('bullet', 'Strg + P sucht, Strg + Shift + K öffnet alle Befehle');
        b('bullet', 'Schreibe [[Willkommen]] — so verlinkst du Seiten');
        b('bullet', 'Schreibe #ideen — so setzt du ein Schlagwort');
        b('bullet', 'Tippe @ für Seite, Datum oder Person, : für Emoji');
        b('bullet', 'Markiere diesen Text — dann erscheint die Werkzeugleiste');
        b('todo', 'Diese Aufgabe abhaken');
        b('flashcard', 'Wo liegen meine Daten? :: Lokal im Browser, in IndexedDB.');
        b('h2', 'Eine Datenbank');
        b('text', 'Darunter liegt eine echte Datenbank mit Ansichten, Filtern, Sortierung und Formeln.');
        const schema = {
            title: { name: 'Aufgabe', type: 'title' },
            st: { name: 'Status', type: 'status', options: [
                    { name: 'Offen', color: 'gray' },
                    { name: 'In Arbeit', color: 'blue' },
                    { name: 'Erledigt', color: 'green' }
                ] },
            pr: { name: 'Priorität', type: 'select', options: [
                    { name: 'Niedrig', color: 'gray' },
                    { name: 'Mittel', color: 'yellow' },
                    { name: 'Hoch', color: 'red' }
                ] },
            dt: { name: 'Fällig', type: 'date' },
            fx: { name: 'Tage übrig', type: 'formula',
                formula: 'if(empty(prop("Fällig")), "—", format(dateBetween(prop("Fällig"), now(), "days")) + " Tage")' }
        };
        const { collectionId } = Store.addDatabase(p.id, 'Meine Aufgaben', schema, 'table');
        const inTagen = (n) => {
            const d = new Date();
            d.setDate(d.getDate() + n);
            return d.toISOString().slice(0, 10);
        };
        Store.addRow(collectionId, { title: 'App ausprobieren', st: 'In Arbeit', pr: 'Hoch', dt: inTagen(0) });
        Store.addRow(collectionId, { title: 'Eigene Seite anlegen', st: 'Offen', pr: 'Mittel', dt: inTagen(2) });
        Store.addRow(collectionId, { title: 'Ollama installieren', st: 'Offen', pr: 'Niedrig', dt: inTagen(7) });
        Store.rowsOf(collectionId).forEach(r => {
            if (r.props && r.props.title) {
                r.text = r.props.title;
                Store.updateBlock(r.id, { text: r.text });
            }
        });
        b('h2', 'Deine Daten gehören dir');
        b('text', 'Unter Einstellungen kannst du jederzeit eine Sicherung speichern und wieder einlesen.');
    };
    const aktionenMelden = () => {
        const R = typeof Register !== 'undefined' ? Register.aktionen : null;
        if (!R)
            return;
        const nichtImRegal = (o) => o.kontext !== 'notizhefte';
        R.melde({ id: 'oeffnen', name: 'Öffnen', zeichen: 'arrowR', gruppe: 'oeffnen', rang: 10,
            gilt: (_p, o) => nichtImRegal(o) && o.art !== 'ordner',
            tun: (p) => oeffne(p.id) });
        const zeigtKarten = (o) => o.kontext !== 'seite';
        R.melde({ id: 'favorit', zeichen: 'star', gruppe: 'merken', rang: 10,
            name: (p) => (p.favorite ? 'Aus Favoriten' : 'Zu Favoriten'),
            tun: (p, o) => {
                favoritKippen(p);
                if (zeigtKarten(o))
                    nachAenderung(Store.getBlock(p.id) || p);
            } });
        R.melde({ id: 'umbenennen', name: 'Umbenennen', zeichen: 'pencil', gruppe: 'bearbeiten', rang: 10,
            gilt: (p, o) => !(o.kontext === 'notizhefte' && p.locked),
            tun: (p, o) => umbenennen(p, o.anker || null, o.kontext === 'seite' ? 'Neuer Titel'
                : o.kontext === 'notizhefte' ? (p.heftArt === 'fach' ? 'Name des Fachs' : 'Name des Hefts')
                    : 'Neuer Name') });
        R.melde({ id: 'symbol', name: 'Symbol ändern', zeichen: 'smile', gruppe: 'bearbeiten', rang: 20,
            gilt: (_p, o) => nichtImRegal(o),
            tun: (p, o) => {
                UI.emojiWaehlen(o.anker && o.anker.isConnected ? o.anker : document.body, (em) => {
                    Store.updateBlock(p.id, { icon: em });
                    nachAenderung(Store.getBlock(p.id));
                });
            } });
        R.melde({ id: 'duplizieren', name: 'Duplizieren', zeichen: 'copy', gruppe: 'ablegen', rang: 20,
            gilt: (_p, o) => nichtImRegal(o),
            tun: (p, o) => {
                dupliziereSeite(p.id, p.parentId);
                if (zeigtKarten(o))
                    nachAenderung(Store.getBlock(p.id));
                else
                    zeichneBaum();
                UI.toast('Seite dupliziert');
            } });
        R.melde({ id: 'link', name: 'Link kopieren', zeichen: 'link', gruppe: 'teilen', rang: 10,
            gilt: (_p, o) => nichtImRegal(o),
            tun: (p) => Ablage.kopiereJetzt(location.origin + location.pathname + '#' + p.id, 'Link kopiert') });
        R.melde({ id: 'papierkorb', name: 'In den Papierkorb', zeichen: 'trash', gruppe: 'gefahr',
            gefahr: true, taste: 'Entf',
            tun: (p, o) => {
                const name = String(p.text || '').trim() || 'Ohne Namen';
                return inPapierkorb(p, o.kontext === 'notizhefte' && p.heftArt === 'fach'
                    ? { satz: 'Fach „' + name + '" liegt im Papierkorb. Seine Hefte bleiben im Regal.' } : {});
            } });
    };
    aktionenMelden();
    return {
        start, oeffne, zeigeSonder, sonderTitel, zeichneSeite, zeichneBaum, zeichneCrumbs, aktuelleSeite, setzeSeite,
        zeigeBlock, blockAusHash,
        kiPanel, suche, seitenSuche, theme, einstellungen, papierkorb, neueSeite,
        vollbild, vollbildAn, vollbildGeht, volleBreite,
        markdownExport, markdownVonSeite, woerterZaehlen, dupliziereSeite, seitenMenue, coverWaehlen,
        umbenennen, nameSaeubern, inPapierkorb, nachAenderung, favoritKippen,
        kuerzlich, kommendeTermine,
        schauplatz,
        ABSCHNITTE, abschnittAn, abschnittSchalten, abschnitteAnpassen, reiterWechseln,
        sicherungSpeichern, sicherungPaketBauen, sicherungLaden, zurueck, vorwaerts, arbeitsbereich,
        anhaengeEinspielen,
        erstellenBlatt,
        erstellenWege, erstellenWeg
    };
})();
