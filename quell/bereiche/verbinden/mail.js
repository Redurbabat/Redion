"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/verbinden/mail.ts (npm run bauen:ts). */
const Mail = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
    const SCHEMA = () => ({
        title: { name: 'Betreff', type: 'title' },
        von: { name: 'Von', type: 'text' },
        an: { name: 'An', type: 'text' },
        dt: { name: 'Datum', type: 'date' },
        labels: { name: 'Beschriftungen', type: 'multi', options: [] },
        gelesen: { name: 'Gelesen', type: 'checkbox' },
        wichtig: { name: 'Wichtig', type: 'checkbox' },
        anhang: { name: 'Anhang', type: 'checkbox' },
        kurz: { name: 'Anfang', type: 'text' },
        text: { name: 'Inhalt', type: 'text' },
        mid: { name: 'Kennung', type: 'text' },
        thread: { name: 'Unterhaltung', type: 'text' },
        link: { name: 'Öffnen', type: 'url' }
    });
    const zielDatenbank = (name = 'Mail') => {
        const da = Object.values(Store.cache.collections)
            .find(c => c.name === name && c.schema.mid && c.schema.von);
        if (da)
            return da;
        const { collectionId } = Store.addDatabase(App.aktuelleSeite(), name, SCHEMA(), 'table');
        const c = Store.getCollection(collectionId);
        Store.updateCollection(c.id, { icon: '✉️' });
        const regel = (key, op, wert) => ({ operator: 'and', rules: [{ key, op, wert: wert ?? '' }] });
        const v0 = Store.getView(c.viewIds[0]);
        Store.updateView(v0.id, { name: 'Posteingang',
            filters: regel('gelesen', 'ist nicht aktiviert'),
            sorts: [{ key: 'dt', richtung: 'ab' }],
            hidden: ['text', 'mid', 'thread', 'an'] });
        const ungelesen = Store.addView(c.id, 'table', 'Alle');
        if (ungelesen)
            Store.updateView(ungelesen.id, { sorts: [{ key: 'dt', richtung: 'ab' }],
                hidden: ['text', 'mid', 'thread'] });
        const wichtig = Store.addView(c.id, 'table', 'Wichtig');
        if (wichtig)
            Store.updateView(wichtig.id, { filters: regel('wichtig', 'ist aktiviert'),
                sorts: [{ key: 'dt', richtung: 'ab' }], hidden: ['text', 'mid', 'thread'] });
        const nachLabel = Store.addView(c.id, 'board', 'Nach Beschriftung');
        if (nachLabel)
            Store.updateView(nachLabel.id, { groupBy: 'labels' });
        return c;
    };
    const token = () => Verbindungen.googleZugang(['profil', 'mail']);
    const entpacke = (s) => {
        if (!s)
            return '';
        try {
            const b = atob(String(s).replace(/-/g, '+').replace(/_/g, '/'));
            const bytes = Uint8Array.from(b, c => c.charCodeAt(0));
            return new TextDecoder('utf-8').decode(bytes);
        }
        catch {
            return '';
        }
    };
    const textAus = (teil) => {
        if (!teil)
            return '';
        if (teil.mimeType === 'text/plain' && teil.body?.data)
            return entpacke(teil.body.data);
        if (Array.isArray(teil.parts)) {
            const klar = teil.parts.map(textAus).filter(Boolean).join('\n');
            if (klar)
                return klar;
        }
        if (teil.mimeType === 'text/html' && teil.body?.data) {
            return Sanitize.textOnly(entpacke(teil.body.data))
                .replace(/\n{3,}/g, '\n\n').trim();
        }
        return '';
    };
    const kopf = (nachricht, name) => (nachricht.payload?.headers || []).find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
    const gmailLabels = async () => {
        const t = await token();
        const d = await Verbindungen.jsonRuf(API + '/labels', { token: t });
        return (d.labels || []).map((l) => ({ id: l.id, name: l.name, art: l.type }));
    };
    const gmailHolen = async (suche = 'in:inbox newer_than:30d', wieViele = 40) => {
        const t = await token();
        const liste = await Verbindungen.jsonRuf(API + '/messages?maxResults=' + wieViele + '&q=' + encodeURIComponent(suche), { token: t });
        const ids = (liste.messages || []).map((m) => m.id);
        const mails = [];
        for (const id of ids) {
            const m = await Verbindungen.jsonRuf(API + '/messages/' + id + '?format=full', { token: t });
            const labels = m.labelIds || [];
            const datum = new Date(Number(m.internalDate || 0));
            mails.push({
                mid: m.id, thread: m.threadId,
                titel: kopf(m, 'Subject') || '(ohne Betreff)',
                von: kopf(m, 'From'), an: kopf(m, 'To'),
                antwortAn: kopf(m, 'Reply-To') || kopf(m, 'From'),
                dt: isNaN(datum.getTime()) ? '' : datum.toISOString().slice(0, 16),
                labels: labels.filter((l) => !/^(UNREAD|IMPORTANT|CATEGORY_|SENT|DRAFT)/.test(l)),
                gelesen: !labels.includes('UNREAD'),
                wichtig: labels.includes('IMPORTANT'),
                anhang: JSON.stringify(m.payload || {}).includes('"filename":"') &&
                    !/"filename":""/.test(JSON.stringify(m.payload?.parts || [])),
                kurz: m.snippet || '',
                text: textAus(m.payload).slice(0, 8000),
                link: 'https://mail.google.com/mail/u/0/#inbox/' + m.threadId
            });
        }
        return mails;
    };
    const gmailAendern = async (mid, dazu = [], weg = []) => {
        const t = await token();
        return Verbindungen.jsonRuf(API + '/messages/' + mid + '/modify', {
            token: t, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addLabelIds: dazu, removeLabelIds: weg })
        });
    };
    const alsGelesen = (mid) => gmailAendern(mid, [], ['UNREAD']);
    const archivieren = (mid) => gmailAendern(mid, [], ['INBOX']);
    const emlLesen = (roh) => {
        const text = String(roh || '').replace(/\r\n/g, '\n');
        const trenn = text.indexOf('\n\n');
        const kopfteil = trenn < 0 ? text : text.slice(0, trenn);
        const koerper = trenn < 0 ? '' : text.slice(trenn + 2);
        const zeilen = kopfteil.replace(/\n[ \t]+/g, ' ').split('\n');
        const kopfe = {};
        zeilen.forEach(z => {
            const i = z.indexOf(':');
            if (i > 0)
                kopfe[z.slice(0, i).trim().toLowerCase()] = z.slice(i + 1).trim();
        });
        const lesbar = (s) => String(s || '').replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi, (_, zeichensatz, art, inhalt) => {
            try {
                if (art.toUpperCase() === 'B') {
                    const b = atob(inhalt);
                    return new TextDecoder(zeichensatz.toLowerCase()).decode(Uint8Array.from(b, (c) => c.charCodeAt(0)));
                }
                const roh2 = inhalt.replace(/_/g, ' ')
                    .replace(/=([0-9A-F]{2})/gi, (_2, h) => String.fromCharCode(parseInt(h, 16)));
                return new TextDecoder(zeichensatz.toLowerCase()).decode(Uint8Array.from(roh2, (c) => c.charCodeAt(0)));
            }
            catch {
                return inhalt;
            }
        });
        let inhalt = koerper;
        if (/base64/i.test(kopfe['content-transfer-encoding'] || '')) {
            try {
                const b = atob(koerper.replace(/\s+/g, ''));
                inhalt = new TextDecoder('utf-8').decode(Uint8Array.from(b, (c) => c.charCodeAt(0)));
            }
            catch { }
        }
        else if (/quoted-printable/i.test(kopfe['content-transfer-encoding'] || '')) {
            inhalt = koerper.replace(/=\n/g, '')
                .replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
        }
        if (/text\/html/i.test(kopfe['content-type'] || ''))
            inhalt = Sanitize.textOnly(inhalt);
        const d = kopfe.date ? new Date(kopfe.date) : null;
        return {
            mid: (kopfe['message-id'] || '').replace(/[<>]/g, ''),
            thread: (kopfe['message-id'] || '').replace(/[<>]/g, ''),
            titel: lesbar(kopfe.subject) || '(ohne Betreff)',
            von: lesbar(kopfe.from), an: lesbar(kopfe.to),
            antwortAn: lesbar(kopfe['reply-to'] || kopfe.from),
            dt: d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 16) : '',
            labels: [], gelesen: true, wichtig: false,
            anhang: /multipart\/mixed/i.test(kopfe['content-type'] || ''),
            kurz: inhalt.slice(0, 160).replace(/\s+/g, ' '),
            text: inhalt.slice(0, 8000), link: ''
        };
    };
    const optionSichern = (coll, key, name) => {
        if (!name || !coll.schema[key])
            return;
        const liste = coll.schema[key].options || [];
        if (liste.some((o) => o.name === name))
            return;
        const farben = ['blue', 'green', 'orange', 'purple', 'pink', 'red', 'yellow', 'brown', 'gray'];
        liste.push({ name, color: farben[liste.length % farben.length] });
        coll.schema[key].options = liste;
        Store.updateCollection(coll.id, { schema: coll.schema });
    };
    const regeln = () => Store.getMeta('mail:regeln', []) || [];
    const regelnSpeichern = (l) => Store.setMeta('mail:regeln', l);
    const REGEL_FELDER = [['von', 'Absender'], ['titel', 'Betreff'], ['text', 'Inhalt'], ['an', 'Empfänger']];
    const REGEL_OPS = [['enthaelt', 'enthält'], ['ist', 'ist genau'],
        ['beginnt', 'beginnt mit'], ['endet', 'endet mit']];
    const regelTrifft = (r, mail) => {
        const feld = String(mail[r.feld] || '').toLowerCase();
        const wert = String(r.wert || '').toLowerCase();
        if (!wert)
            return false;
        if (r.op === 'ist')
            return feld === wert;
        if (r.op === 'beginnt')
            return feld.startsWith(wert);
        if (r.op === 'endet')
            return feld.endsWith(wert);
        return feld.includes(wert);
    };
    const regelnAnwenden = (mail) => {
        const treffer = [];
        regeln().forEach((r) => {
            if (r.an === false)
                return;
            if (!regelTrifft(r, mail))
                return;
            treffer.push(r);
            if (r.label && !mail.labels.includes(r.label))
                mail.labels.push(r.label);
            if (r.wichtig)
                mail.wichtig = true;
            if (r.gelesen)
                mail.gelesen = true;
        });
        return treffer;
    };
    const uebernehmen = (coll, mails) => {
        const vorhanden = new Map();
        Store.rowsOf(coll.id).forEach((r) => {
            const m = (r.props || {}).mid;
            if (m)
                vorhanden.set(m, r);
        });
        let neu = 0, frisch = 0, beschriftet = 0;
        mails.forEach((m) => {
            if (regelnAnwenden(m).length)
                beschriftet++;
            (m.labels || []).forEach((l) => optionSichern(coll, 'labels', l));
            const props = {
                von: m.von, an: m.an, dt: m.dt, labels: m.labels || [],
                gelesen: !!m.gelesen, wichtig: !!m.wichtig, anhang: !!m.anhang,
                kurz: m.kurz, text: m.text, mid: m.mid, thread: m.thread, link: m.link
            };
            const alt = vorhanden.get(m.mid);
            if (alt) {
                Object.entries(props).forEach(([k, w]) => Store.setProp(alt.id, k, w));
                Store.updateBlock(alt.id, { text: m.titel });
                frisch++;
            }
            else {
                const r = Store.addRow(coll.id, props);
                Store.updateBlock(r.id, { text: m.titel });
                neu++;
            }
        });
        return { neu, frisch, beschriftet };
    };
    const BAUSTEINE_START = [
        { name: 'Danke', text: 'Vielen Dank für die Nachricht — ich schaue es mir an und melde mich.' },
        { name: 'Termin', text: 'Passt Ihnen {tag} um {zeit}? Sonst schlagen Sie gern etwas anderes vor.' },
        { name: 'Später', text: 'Ich komme diese Woche nicht mehr dazu. Nächste Woche melde ich mich mit einer Antwort.' },
        { name: 'Erhalten', text: 'Angekommen, danke. Ich gebe Bescheid, sobald es etwas Neues gibt.' },
        { name: 'Absage', text: 'Danke für die Anfrage. Das passt bei mir gerade nicht — ich melde mich, wenn sich das ändert.' }
    ];
    const bausteine = () => {
        const b = Store.getMeta('mail:bausteine', null);
        if (b)
            return b;
        Store.setMeta('mail:bausteine', BAUSTEINE_START);
        return BAUSTEINE_START;
    };
    const bausteineSpeichern = (l) => Store.setMeta('mail:bausteine', l);
    const bausteinFuellen = (text, mail) => {
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        return String(text || '')
            .replace(/\{name\}/g, (mail?.von || '').replace(/<.*>/, '').trim() || 'Sie')
            .replace(/\{betreff\}/g, mail?.titel || '')
            .replace(/\{tag\}/g, d.toLocaleDateString('de-DE', { weekday: 'long' }))
            .replace(/\{datum\}/g, d.toLocaleDateString('de-DE'))
            .replace(/\{zeit\}/g, p(d.getHours()) + ':' + p(d.getMinutes()));
    };
    const antwortOeffnen = (row, coll, text) => {
        const an = String(Datenbank.wert(row, 'von', coll) || '');
        const adresse = (an.match(/<([^>]+)>/) || [null, an])[1];
        const betreff = 'Re: ' + (row.text || '');
        const gmail = 'https://mail.google.com/mail/?view=cm&fs=1' +
            '&to=' + encodeURIComponent(adresse) +
            '&su=' + encodeURIComponent(betreff) +
            '&body=' + encodeURIComponent(text || '');
        window.open(gmail, '_blank', 'noopener');
    };
    const KUERZEL = [
        ['j', 'eine Mail nach unten'],
        ['k', 'eine Mail nach oben'],
        ['o oder Enter', 'öffnen'],
        ['u', 'zurück zur Liste'],
        ['e', 'archivieren'],
        ['#', 'in den Papierkorb'],
        ['r', 'antworten'],
        ['a', 'allen antworten'],
        ['l', 'beschriften'],
        ['I', 'als gelesen markieren'],
        ['U', 'als ungelesen markieren'],
        ['s', 'wichtig ein und aus'],
        ['/', 'suchen'],
        ['g dann i', 'zum Posteingang']
    ];
    let tastenAktiv = false;
    let stelle = 0;
    let letzteTaste = '';
    const mailZeilen = () => [...document.querySelectorAll('.grid tbody tr[data-rid]')];
    const kuerzelStart = () => {
        if (tastenAktiv)
            return;
        tastenAktiv = true;
        document.addEventListener('keydown', async (e) => {
            if (!Store.getMeta('mail:kuerzel', true))
                return;
            const z = elVon(e);
            if (z instanceof HTMLElement &&
                (z.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(z.tagName)))
                return;
            if (e.ctrlKey || e.metaKey || e.altKey)
                return;
            const coll = Object.values(Store.cache.collections)
                .find(c => c.schema && c.schema.mid && c.schema.von &&
                document.querySelector(`[data-cid="${c.id}"], .db`));
            if (!coll)
                return;
            const zeilen = mailZeilen();
            if (!zeilen.length)
                return;
            const taste = e.key;
            const markiere = (i) => {
                stelle = Math.max(0, Math.min(i, zeilen.length - 1));
                zeilen.forEach((t, k) => t.classList.toggle('mail-jetzt', k === stelle));
                zeilen[stelle]?.scrollIntoView({ block: 'nearest' });
            };
            const zeileJetzt = () => zeilen[stelle];
            const rowJetzt = () => {
                const t = zeileJetzt();
                return t && t.dataset.rid ? Store.getBlock(t.dataset.rid) : null;
            };
            if (taste === 'j') {
                e.preventDefault();
                markiere(stelle + 1);
                return;
            }
            if (taste === 'k') {
                e.preventDefault();
                markiere(stelle - 1);
                return;
            }
            if (taste === 'g') {
                letzteTaste = 'g';
                return;
            }
            if (letzteTaste === 'g' && taste === 'i') {
                letzteTaste = '';
                const v = Store.getView(coll.viewIds[0]);
                if (v) {
                    App.zeichneSeite();
                    UI.toast('Posteingang');
                }
                return;
            }
            letzteTaste = '';
            const r = rowJetzt();
            if (!r)
                return;
            if (taste === 'o' || taste === 'Enter') {
                e.preventDefault();
                Datenbank.zeilePeek(r, coll);
                return;
            }
            if (taste === 'u') {
                e.preventDefault();
                document.querySelector('.peek')?.remove();
                return;
            }
            if (taste === 'I') {
                e.preventDefault();
                Store.setProp(r.id, 'gelesen', true);
                versuche(() => alsGelesen(r.props.mid));
                App.zeichneSeite();
                UI.toast('Als gelesen markiert');
                return;
            }
            if (taste === 'U') {
                e.preventDefault();
                Store.setProp(r.id, 'gelesen', false);
                versuche(() => gmailAendern(r.props.mid, ['UNREAD'], []));
                App.zeichneSeite();
                UI.toast('Als ungelesen markiert');
                return;
            }
            if (taste === 's') {
                e.preventDefault();
                const w = !Datenbank.wert(r, 'wichtig', coll);
                Store.setProp(r.id, 'wichtig', w);
                versuche(() => gmailAendern(r.props.mid, w ? ['IMPORTANT'] : [], w ? [] : ['IMPORTANT']));
                App.zeichneSeite();
                UI.toast(w ? 'Als wichtig markiert' : 'Nicht mehr wichtig');
                return;
            }
            if (taste === 'e' || taste === '#') {
                e.preventDefault();
                const gmail = !!(r.props || {}).link;
                const wohin = taste === 'e' ? 'Archiviert' : 'In den Papierkorb';
                if (!gmail) {
                    Store.trashBlock(r.id);
                    App.zeichneSeite();
                    UI.toast(wohin + ' (nur hier — hinter dieser Mail steht kein Gmail-Konto)');
                    return;
                }
                try {
                    if (taste === 'e')
                        await archivieren(r.props.mid);
                    else
                        await gmailAendern(r.props.mid, ['TRASH'], ['INBOX']);
                    Store.trashBlock(r.id);
                    App.zeichneSeite();
                    UI.toast(wohin);
                }
                catch (err) {
                    UI.toast('Gmail hat abgelehnt: ' +
                        (err instanceof Error ? err.message : String(err)));
                }
                return;
            }
            if (taste === 'r' || taste === 'a') {
                e.preventDefault();
                antwortMenue(r, coll);
                return;
            }
            if (taste === 'l') {
                e.preventDefault();
                const td = document.querySelector(`.grid tbody tr[data-rid="${r.id}"] td[data-key="labels"]`);
                if (td)
                    Datenbank.zelleBearbeiten(td, r, 'labels', coll);
                else
                    UI.toast('Die Spalte „Beschriftungen" ist in dieser Ansicht ausgeblendet');
                return;
            }
            if (taste === '/') {
                e.preventDefault();
                App.suche();
                return;
            }
        });
    };
    const versuche = (fn) => { try {
        Promise.resolve(fn()).catch(() => { });
    }
    catch { } };
    const antwortMenue = (row, coll) => {
        const t = document.querySelector('.mail-jetzt') || document.body;
        const r = t.getBoundingClientRect();
        const m = UI.menu('<div class="grp">Schnellantwort</div>' +
            bausteine().map((b, i) => `<button data-b="${i}"><span class="mi">💬</span>${esc(b.name)}</button>`).join('') +
            '<hr><button data-a="leer"><span class="mi">✍️</span>Ohne Vorlage antworten</button>' +
            '<button data-a="pflege"><span class="mi">⚙</span>Bausteine bearbeiten</button>', Math.min(r.left + 40, innerWidth - 280), r.bottom + 4);
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-b]');
            if (b) {
                m.remove();
                const baustein = bausteine()[Number(b.dataset.b)];
                if (!baustein)
                    return;
                antwortOeffnen(row, coll, bausteinFuellen(baustein.text, { von: Datenbank.wert(row, 'von', coll), titel: row.text }));
                return;
            }
            const a = elVon(e)?.closest('button[data-a]');
            if (!a)
                return;
            m.remove();
            if (a.dataset.a === 'leer')
                antwortOeffnen(row, coll, '');
            if (a.dataset.a === 'pflege')
                bausteinDialog();
        });
    };
    const bausteinDialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(600px,94vw)">' +
            '<div class="fh">💬 Textbausteine<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" id="bl"></div>' +
            '<div class="fbtns"><button data-a="neu">＋ Baustein</button>' +
            '<button data-a="zu" class="prim">Fertig</button></div></div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const liste = o.querySelector('#bl');
            if (!liste)
                return;
            liste.innerHTML =
                '<div class="grp">Platzhalter: {name} {betreff} {tag} {datum} {zeit}</div>' +
                    bausteine().map((b, i) => `<div class="frei-zeile"><span class="frei-kreis bg-blue">💬</span>` +
                        `<span class="frei-name"><b>${esc(b.name)}</b><span>${esc(b.text).slice(0, 70)}…</span></span>` +
                        `<button data-weg="${i}">🗑</button></div>`).join('');
        };
        zeichne();
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                const l = bausteine();
                l.splice(Number(weg.dataset.weg), 1);
                bausteineSpeichern(l);
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="neu"]')) {
                const name = await UI.frage('Wie heisst der Baustein?', '');
                if (!name)
                    return;
                const text = await UI.frage('Text', '');
                if (text == null)
                    return;
                const l = bausteine();
                l.push({ name, text });
                bausteineSpeichern(l);
                zeichne();
            }
        });
    };
    const regelDialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(660px,94vw)">' +
            '<div class="fh">🏷 Automatische Beschriftungen<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" id="rl"></div>' +
            '<div class="fbtns"><button data-a="neu">＋ Regel</button>' +
            '<button data-a="zu" class="prim">Fertig</button></div></div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const l = regeln();
            const liste = o.querySelector('#rl');
            if (!liste)
                return;
            liste.innerHTML = l.length
                ? l.map((r, i) => {
                    const feld = (REGEL_FELDER.find(f => f[0] === r.feld) || [])[1] || r.feld;
                    const op = (REGEL_OPS.find(x => x[0] === r.op) || [])[1] || r.op;
                    return `<div class="frei-zeile">` +
                        `<button data-an="${i}" class="frei-kreis bg-${r.an === false ? 'gray' : 'green'}">` +
                        `${r.an === false ? '☐' : '☑'}</button>` +
                        `<span class="frei-name"><b>${esc(feld)} ${esc(op)} „${esc(r.wert)}"</b>` +
                        `<span>→ ${esc(r.label || '')}${r.wichtig ? ' · wichtig' : ''}` +
                        `${r.gelesen ? ' · gelesen' : ''}</span></span>` +
                        `<button data-weg="${i}">🗑</button></div>`;
                }).join('')
                : '<div style="padding:18px;color:var(--text-faint);font-size:14px">' +
                    'Noch keine Regel. Zum Beispiel: <i>Absender enthält „rechnung" → Beschriftung Buchhaltung</i>.</div>';
        };
        zeichne();
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const an = elVon(e)?.closest('[data-an]');
            if (an) {
                const l = regeln();
                const r = l[Number(an.dataset.an)];
                if (r) {
                    r.an = r.an === false;
                    regelnSpeichern(l);
                    zeichne();
                }
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                const l = regeln();
                l.splice(Number(weg.dataset.weg), 1);
                regelnSpeichern(l);
                zeichne();
                return;
            }
            if (!elVon(e)?.closest('[data-a="neu"]'))
                return;
            const o2 = document.createElement('div');
            o2.className = 'overlay';
            o2.innerHTML = '<div class="finder" style="width:min(480px,94vw)">' +
                '<div class="fh">Neue Regel</div>' +
                '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px">' +
                '<label>Wenn<br><select id="rf">' +
                REGEL_FELDER.map(([id, n]) => `<option value="${id}">${n}</option>`).join('') +
                '</select></label>' +
                '<label>…<br><select id="ro">' +
                REGEL_OPS.map(([id, n]) => `<option value="${id}">${n}</option>`).join('') +
                '</select></label>' +
                '<label>diesen Text<br><input id="rw" placeholder="z. B. rechnung"></label>' +
                '<label>dann beschriften mit<br><input id="rl2" placeholder="z. B. Buchhaltung"></label>' +
                '<label style="display:flex;gap:8px;align-items:center;font-size:13px">' +
                '<input type="checkbox" id="rwi"> als wichtig markieren</label>' +
                '<label style="display:flex;gap:8px;align-items:center;font-size:13px">' +
                '<input type="checkbox" id="rge"> gleich als gelesen markieren</label>' +
                '</div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Anlegen</button>' +
                '<button data-a="zu">Abbrechen</button></div></div>';
            document.body.appendChild(o2);
            o2.addEventListener('click', ev => {
                const ziel = elVon(ev);
                if (ev.target === o2 || ziel?.closest('[data-a="zu"]')) {
                    o2.remove();
                    return;
                }
                if (!ziel?.closest('[data-a="ok"]'))
                    return;
                const feld = o2.querySelector('#rf');
                const op = o2.querySelector('#ro');
                const wert = o2.querySelector('#rw');
                const label = o2.querySelector('#rl2');
                const wichtig = o2.querySelector('#rwi');
                const gelesen = o2.querySelector('#rge');
                if (!feld || !op || !wert || !label || !wichtig || !gelesen)
                    return;
                const l = regeln();
                l.push({ feld: feld.value, op: op.value, wert: wert.value, label: label.value,
                    wichtig: wichtig.checked, gelesen: gelesen.checked, an: true });
                regelnSpeichern(l);
                o2.remove();
                zeichne();
                UI.toast('Regel angelegt');
            });
        });
    };
    const dialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(700px,95vw)">' +
            '<div class="fh">✉️ Mail<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div id="mb" style="padding:4px 18px 16px; max-height:72vh; overflow:auto"></div>' +
            '<div class="fbtns"><button data-a="zu" class="prim">Fertig</button></div></div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const z = Verbindungen.zustand();
            const kasten = o.querySelector('#mb');
            if (!kasten)
                return;
            kasten.innerHTML =
                '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>🔵</span><b>Gmail</b>' +
                    `<span class="verb-status ${z.google.verbunden ? 'an' : ''}">` +
                    `${z.google.verbunden ? 'verbunden' : 'nicht verbunden'}</span></div>` +
                    '<div class="verb-text">Holt Mails als Datenbankzeilen. Danach gelten alle Filter, ' +
                    'Ansichten und Automationen, die es hier sonst auch gibt.</div>' +
                    '<label>Was holen? (Gmail-Suchsprache)<br><input id="msuche" ' +
                    `value="${esc(Store.getMeta('mail:suche', 'in:inbox newer_than:30d'))}"></label>` +
                    '<div class="verb-knoepfe"><button data-a="holen">Mails holen</button>' +
                    '<button data-a="ungelesen">Nur ungelesene</button>' +
                    '<button data-a="labels">Beschriftungen zeigen</button></div>' +
                    '</div>' +
                    '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>📄</span><b>Ohne Konto</b></div>' +
                    '<div class="verb-text">Einzelne Mails aus jedem Programm als .eml speichern ' +
                    'und hier einlesen. Braucht kein Netz.</div>' +
                    '<div class="verb-knoepfe"><button data-a="eml">EML-Dateien einlesen</button></div>' +
                    '</div>' +
                    '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>🏷</span><b>Automatik</b>' +
                    `<span class="verb-status ${regeln().length ? 'an' : ''}">${regeln().length} Regeln</span></div>` +
                    '<div class="verb-text">Beschriftet und sortiert eingehende Mails nach deinen Regeln.</div>' +
                    '<div class="verb-knoepfe"><button data-a="regeln">Regeln bearbeiten</button>' +
                    '<button data-a="bausteine">Textbausteine</button></div>' +
                    '</div>' +
                    '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>⌨️</span><b>Gmail-Kürzel</b>' +
                    `<span class="verb-status ${Store.getMeta('mail:kuerzel', true) ? 'an' : ''}">` +
                    `${Store.getMeta('mail:kuerzel', true) ? 'an' : 'aus'}</span></div>` +
                    '<div class="mail-kuerzel">' + KUERZEL.map(([k, w]) => `<div><kbd>${esc(k ?? '')}</kbd><span>${esc(w ?? '')}</span></div>`).join('') + '</div>' +
                    '<div class="verb-knoepfe"><button data-a="ktoggle">' +
                    (Store.getMeta('mail:kuerzel', true) ? 'Ausschalten' : 'Einschalten') + '</button></div>' +
                    '</div>';
        };
        zeichne();
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            const a = b.dataset.a;
            try {
                if (a === 'regeln') {
                    regelDialog();
                    return;
                }
                if (a === 'bausteine') {
                    bausteinDialog();
                    return;
                }
                if (a === 'ktoggle') {
                    Store.setMeta('mail:kuerzel', !Store.getMeta('mail:kuerzel', true));
                    zeichne();
                    return;
                }
                if (a === 'labels') {
                    const l = await gmailLabels();
                    UI.toast(l.length + ' Beschriftungen: ' + l.slice(0, 6).map((x) => x.name).join(', '));
                    return;
                }
                if (a === 'eml') {
                    const inp = document.createElement('input');
                    inp.type = 'file';
                    inp.accept = '.eml,message/rfc822';
                    inp.multiple = true;
                    inp.addEventListener('change', async () => {
                        const coll = zielDatenbank();
                        const mails = [];
                        for (const f of Array.from(inp.files ?? []))
                            mails.push(emlLesen(await f.text()));
                        const erg = uebernehmen(coll, mails);
                        App.zeichneSeite();
                        UI.toast(erg.neu + ' Mails eingelesen' +
                            (erg.beschriftet ? ', ' + erg.beschriftet + ' beschriftet' : ''));
                    });
                    inp.click();
                    return;
                }
                if (a === 'holen' || a === 'ungelesen') {
                    const suche = a === 'ungelesen' ? 'is:unread'
                        : (o.querySelector('#msuche')?.value || '').trim();
                    Store.setMeta('mail:suche', suche);
                    UI.toast('Wird geholt …');
                    const mails = await gmailHolen(suche, 40);
                    const coll = zielDatenbank();
                    const erg = uebernehmen(coll, mails);
                    App.zeichneSeite();
                    UI.toast(erg.neu + ' neu, ' + erg.frisch + ' aufgefrischt' +
                        (erg.beschriftet ? ', ' + erg.beschriftet + ' beschriftet' : ''));
                    o.remove();
                    return;
                }
            }
            catch (err) {
                UI.banner('Mail: ' + (err instanceof Error ? err.message : String(err)), 'warn');
            }
        });
    };
    return { SCHEMA, zielDatenbank, gmailHolen, gmailLabels, gmailAendern, alsGelesen,
        archivieren, emlLesen, uebernehmen, regeln, regelnAnwenden, regelTrifft,
        bausteine, bausteinFuellen, antwortOeffnen, antwortMenue,
        KUERZEL, kuerzelStart, dialog, regelDialog, bausteinDialog, textAus, entpacke };
})();
window.Mail = Mail;
