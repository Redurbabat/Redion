"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/ki/werkzeuge.ts (npm run bauen:ts). */
const MCP = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const VERSION = '2024-11-05';
    const server = () => Store.getMeta('mcp:server', []) || [];
    const serverSpeichern = (l) => Store.setMeta('mcp:server', l);
    const freigegeben = () => Store.getMeta('mcp:freigabe', []) || [];
    const istFrei = (url) => {
        const liste = freigegeben();
        if (!liste.length)
            return true;
        try {
            const h = new URL(url).hostname;
            return liste.some((e) => e === h || (e.startsWith('.') && h.endsWith(e)));
        }
        catch {
            return false;
        }
    };
    let zaehler = 1;
    const ruf = async (s, methode, parameter) => {
        if (!istFrei(s.url))
            throw new Error('Dieser Server steht nicht auf der Freigabeliste der Verwaltung.');
        const kopf = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };
        if (s.token)
            kopf['Authorization'] = 'Bearer ' + s.token;
        if (s.sitzung)
            kopf['Mcp-Session-Id'] = s.sitzung;
        const r = await Verbindungen.ruf(s.url, {
            method: 'POST', headers: kopf,
            body: JSON.stringify({ jsonrpc: '2.0', id: zaehler++, method: methode, params: parameter || {} }),
            ueberBruecke: !!s.ueberBruecke, versuche: 2
        });
        const sitzung = r.headers.get('mcp-session-id');
        if (sitzung)
            s.sitzung = sitzung;
        const roh = await r.text();
        const text = roh.includes('data:')
            ? roh.split('\n').filter(z => z.startsWith('data:')).map(z => z.slice(5).trim()).join('')
            : roh;
        let d;
        try {
            d = JSON.parse(text);
        }
        catch {
            throw new Error('Der Server hat kein JSON geschickt: ' + text.slice(0, 160));
        }
        if (d.error)
            throw new Error('MCP ' + (d.error.code || '') + ': ' + (d.error.message || ''));
        return d.result;
    };
    const verbinden = async (s) => {
        const r = await ruf(s, 'initialize', {
            protocolVersion: VERSION,
            capabilities: { tools: {}, resources: {} },
            clientInfo: { name: 'Redion', version: '1.0' }
        });
        s.name = s.name || r?.serverInfo?.name || 'MCP-Server';
        s.serverVersion = r?.serverInfo?.version || '';
        try {
            await ruf(s, 'notifications/initialized', {});
        }
        catch { }
        return r;
    };
    const werkzeugeHolen = async (s) => {
        const r = await ruf(s, 'tools/list', {});
        return (r?.tools || []).map((t) => ({
            name: t.name, beschreibung: t.description || '',
            schema: t.inputSchema || {}, an: true
        }));
    };
    const werkzeugRufen = async (s, name, argument) => {
        const r = await ruf(s, 'tools/call', { name, arguments: argument || {} });
        const inhalt = (r?.content || []).map((c) => c.type === 'text' ? c.text : ('[' + c.type + ']')).join('\n');
        return inhalt || JSON.stringify(r).slice(0, 2000);
    };
    const ressourcenHolen = async (s) => {
        const r = await ruf(s, 'resources/list', {});
        return r?.resources || [];
    };
    const alleWerkzeuge = () => {
        const raus = [];
        server().forEach((s, si) => {
            if (s.an === false)
                return;
            (s.werkzeuge || []).forEach((w) => {
                if (w.an === false)
                    return;
                raus.push({ serverIndex: si, serverName: s.name, ...w });
            });
        });
        return raus;
    };
    const inAgentEinhaengen = () => {
        Object.keys(Agent.WERKZEUGE)
            .filter(k => k.startsWith('mcp_'))
            .forEach(k => delete Agent.WERKZEUGE[k]);
        alleWerkzeuge().forEach(w => {
            const schluessel = 'mcp_' + w.serverIndex + '_' + w.name.replace(/[^\w]/g, '_');
            Agent.WERKZEUGE[schluessel] = {
                recht: 'bearbeiten',
                beschreibung: '[' + w.serverName + '] ' + w.beschreibung +
                    ' Argument: ' + JSON.stringify(w.schema.properties || {}).slice(0, 300),
                lauf: async (a) => werkzeugRufen(server()[w.serverIndex], w.name, a)
            };
        });
        return Object.keys(Agent.WERKZEUGE).filter(k => k.startsWith('mcp_')).length;
    };
    const eigenerKatalog = () => Object.entries(Agent.WERKZEUGE)
        .filter(([k]) => !k.startsWith('mcp_'))
        .filter(([k]) => (Store.getMeta('mcp:eigenAus', []) || []).indexOf(k) < 0)
        .map(([k, w]) => ({
        name: 'notizen_' + k,
        description: w.beschreibung,
        inputSchema: { type: 'object', properties: {}, additionalProperties: true }
    }));
    const beantworten = async (anfrage) => {
        const antwort = (ergebnis) => ({ jsonrpc: '2.0', id: anfrage.id, result: ergebnis });
        const fehler = (code, text) => ({ jsonrpc: '2.0', id: anfrage.id,
            error: { code, message: text } });
        if (anfrage.method === 'initialize')
            return antwort({
                protocolVersion: VERSION,
                capabilities: { tools: { listChanged: false } },
                serverInfo: { name: 'Redion', version: '1.0' }
            });
        if (anfrage.method === 'tools/list')
            return antwort({ tools: eigenerKatalog() });
        if (anfrage.method === 'tools/call') {
            const name = String(anfrage.params?.name || '').replace(/^notizen_/, '');
            const w = Agent.WERKZEUGE[name];
            if (!w)
                return fehler(-32602, 'Werkzeug „' + name + '" gibt es nicht.');
            if ((Store.getMeta('mcp:eigenAus', []) || []).includes(name))
                return fehler(-32602, 'Dieses Werkzeug ist abgeschaltet.');
            if (!Konten.darf(w.recht))
                return fehler(-32603, 'Dafür fehlen die Rechte des angemeldeten Kontos.');
            try {
                const r = await w.lauf(anfrage.params?.arguments || {}, { ids: [] });
                return antwort({ content: [{ type: 'text', text: String(r) }] });
            }
            catch (e) {
                return fehler(-32603, e instanceof Error ? e.message : String(e));
            }
        }
        if (anfrage.method === 'resources/list') {
            const seiten = Object.values(Store.cache.blocks)
                .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
                .filter(b => Konten.darf('lesen', b.id))
                .slice(0, 200)
                .map(b => ({ uri: 'notizen://seite/' + b.id, name: b.text || 'Ohne Titel',
                mimeType: 'text/markdown' }));
            return antwort({ resources: seiten });
        }
        if (anfrage.method === 'resources/read') {
            const id = String(anfrage.params?.uri || '').replace('notizen://seite/', '');
            const b = Store.getBlock(id);
            if (!b)
                return fehler(-32602, 'Diese Seite gibt es nicht.');
            if (!Konten.darf('lesen', b.id))
                return fehler(-32603, 'Keine Leseberechtigung.');
            return antwort({ contents: [{ uri: anfrage.params.uri, mimeType: 'text/markdown',
                        text: (b.text || '') + '\n\n' + Kontext.textVonSeite(b.id) }] });
        }
        return fehler(-32601, 'Unbekannte Methode: ' + anfrage.method);
    };
    const dialog = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(760px,95vw)">' +
            '<div class="fh">🔗 MCP<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div id="mb" style="padding:4px 18px 16px; max-height:72vh; overflow:auto"></div>' +
            '<div class="fbtns"><button data-a="zu" class="prim">Fertig</button></div></div>';
        document.body.appendChild(o);
        const zeichne = () => {
            const liste = server();
            const aus = Store.getMeta('mcp:eigenAus', []) || [];
            const mb = o.querySelector('#mb');
            if (!mb)
                return;
            mb.innerHTML =
                '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>📥</span><b>Fremde Werkzeuge benutzen</b>' +
                    `<span class="verb-status ${liste.length ? 'an' : ''}">${liste.length} Server</span></div>` +
                    '<div class="verb-text">Server mit HTTP-Anbindung lassen sich eintragen. ' +
                    'Server, die nur über stdio sprechen, erreicht ein Browser nicht — dafür ' +
                    'gibt es die Brücke.</div>' +
                    (liste.length
                        ? '<div class="abo-liste">' + liste.map((s, i) => `<div class="abo-zeile"><span class="frei-kreis bg-${s.an === false ? 'gray' : 'green'}">🔗</span>` +
                            `<span class="frei-name"><b>${esc(s.name || 'Server')}</b>` +
                            `<span>${esc(s.url).slice(0, 52)} · ${(s.werkzeuge || []).length} Werkzeuge` +
                            `${istFrei(s.url) ? '' : ' · nicht freigegeben'}</span></span>` +
                            `<button data-an="${i}">${s.an === false ? '☐' : '☑'}</button>` +
                            `<button data-wz="${i}">Werkzeuge</button>` +
                            `<button data-neu="${i}">↻</button>` +
                            `<button data-weg="${i}" data-loeschknopf="Entfernen" aria-label="Server entfernen">🗑</button></div>`).join('') + '</div>'
                        : '') +
                    '<div class="verb-knoepfe"><button data-a="neu">＋ Server eintragen</button>' +
                    '<button data-a="einhaengen">In den Agenten übernehmen</button></div>' +
                    '</div>' +
                    '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>📤</span><b>Eigene Werkzeuge anbieten</b>' +
                    `<span class="verb-status an">${eigenerKatalog().length} von ` +
                    `${Object.keys(Agent.WERKZEUGE).filter(k => !k.startsWith('mcp_')).length}</span></div>` +
                    '<div class="verb-text">Der Katalog dieser App im MCP-Format. Jedes Werkzeug lässt ' +
                    'sich einzeln abschalten. Ein Browser kann selbst nichts entgegennehmen — wer ' +
                    '<b>bruecke.js</b> laufen lässt, hat damit aber einen echten MCP-Server für ' +
                    'diese App.</div>' +
                    '<div class="mcp-wz">' + Object.keys(Agent.WERKZEUGE)
                    .filter(k => !k.startsWith('mcp_'))
                    .map(k => `<label class="wz-w"><input type="checkbox" data-eigen="${k}"` +
                    `${aus.includes(k) ? '' : ' checked'}> ${k}</label>`).join('') +
                    '</div>' +
                    '<div class="verb-knoepfe"><button data-a="katalog">Katalog anzeigen</button>' +
                    '<button data-a="probe">Anfrage ausprobieren</button></div>' +
                    '</div>' +
                    '<div class="verb-karte">' +
                    '<div class="verb-kopf"><span>🛡</span><b>Freigabeliste der Verwaltung</b>' +
                    `<span class="verb-status ${freigegeben().length ? 'an' : ''}">` +
                    `${freigegeben().length ? freigegeben().length + ' erlaubt' : 'alle erlaubt'}</span></div>` +
                    '<div class="verb-text">Stehen hier Adressen, wird nur mit diesen gesprochen. ' +
                    'Leer heisst: keine Sperre. Ein Punkt am Anfang erlaubt auch Unteradressen ' +
                    '(<code>.firma.de</code>).</div>' +
                    `<label>Erlaubte Adressen, mit Komma getrennt<br><input id="mfrei" ` +
                    `value="${esc(freigegeben().join(', '))}" placeholder="localhost, .firma.de"></label>` +
                    '<div class="verb-knoepfe"><button data-a="frei">Übernehmen</button></div>' +
                    '</div>';
        };
        zeichne();
        o.addEventListener('change', e => {
            const c = elVon(e)?.closest('[data-eigen]');
            if (!c)
                return;
            const aus = Store.getMeta('mcp:eigenAus', []) || [];
            const k = c.dataset["eigen"];
            Store.setMeta('mcp:eigenAus', c.checked ? aus.filter((x) => x !== k) : [...aus, k]);
            zeichne();
        });
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const an = elVon(e)?.closest('[data-an]');
            if (an?.dataset["an"]) {
                const l = server();
                const ai = +an.dataset["an"];
                if (!l[ai])
                    return;
                l[ai].an = l[ai].an === false;
                serverSpeichern(l);
                zeichne();
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg?.dataset["weg"]) {
                const l = server();
                l.splice(+weg.dataset["weg"], 1);
                serverSpeichern(l);
                zeichne();
                return;
            }
            const neu = elVon(e)?.closest('[data-neu]');
            if (neu) {
                const l = server();
                const s = l[+(neu.dataset["neu"] ?? -1)];
                if (!s)
                    return;
                try {
                    await verbinden(s);
                    s.werkzeuge = await werkzeugeHolen(s);
                    serverSpeichern(l);
                    UI.toast(s.name + ': ' + s.werkzeuge.length + ' Werkzeuge');
                    zeichne();
                }
                catch (err) {
                    UI.banner('MCP: ' + (err instanceof Error ? err.message : String(err)), 'warn');
                }
                return;
            }
            const wz = elVon(e)?.closest('[data-wz]');
            if (wz) {
                const l = server();
                const s = l[+(wz.dataset["wz"] ?? -1)];
                if (!s)
                    return;
                const r = (elVon(e) ?? document.body).getBoundingClientRect();
                const m = UI.menu('<div class="grp">Werkzeuge von ' + esc(s.name) + '</div>' +
                    ((s.werkzeuge || []).length
                        ? s.werkzeuge.map((w, i) => `<button data-w="${i}"><span class="mi">${w.an === false ? '☐' : '☑'}</span>` +
                            `${esc(w.name)}</button>`).join('')
                        : '<div class="grp" style="font-weight:400">Noch nichts geholt — auf ↻ klicken</div>'), r.left - 180, r.bottom + 4);
                m.addEventListener('click', ev => {
                    const b = elVon(ev)?.closest('[data-w]');
                    if (!b)
                        return;
                    const wi = +(b.dataset["w"] ?? -1);
                    if (!s.werkzeuge[wi])
                        return;
                    s.werkzeuge[wi].an = s.werkzeuge[wi].an === false;
                    serverSpeichern(l);
                    m.remove();
                    zeichne();
                });
                return;
            }
            const b2 = elVon(e)?.closest('button[data-a]');
            if (!b2)
                return;
            if (b2.dataset.a === 'neu') {
                const url = await UI.frage('Adresse des MCP-Servers', 'http://localhost:3000/mcp');
                if (!url)
                    return;
                const name = await UI.frage('Wie soll er heissen?', 'MCP-Server');
                const token = await UI.frage('Token, falls nötig (darf leer bleiben)', '');
                const s = { url: url.trim(), name: name || 'MCP-Server', token: (token || '').trim(),
                    an: true, werkzeuge: [] };
                const l = server();
                l.push(s);
                serverSpeichern(l);
                try {
                    await verbinden(s);
                    s.werkzeuge = await werkzeugeHolen(s);
                    serverSpeichern(l);
                    UI.toast('Verbunden: ' + s.werkzeuge.length + ' Werkzeuge');
                }
                catch (err) {
                    UI.banner('Eingetragen, aber nicht erreichbar: ' + (err instanceof Error ? err.message : String(err)), 'warn');
                }
                zeichne();
                return;
            }
            if (b2.dataset.a === 'einhaengen') {
                const n = inAgentEinhaengen();
                UI.toast(n + ' fremde Werkzeuge stehen dem Agenten zur Verfügung');
                return;
            }
            if (b2.dataset.a === 'frei') {
                const roh = o.querySelector('#mfrei')?.value ?? '';
                Store.setMeta('mcp:freigabe', roh.split(',').map((x) => x.trim()).filter(Boolean));
                UI.toast('Freigabeliste gesichert');
                zeichne();
                return;
            }
            if (b2.dataset.a === 'katalog') {
                const text = JSON.stringify({ tools: eigenerKatalog() }, null, 2);
                const o2 = document.createElement('div');
                o2.className = 'overlay';
                o2.innerHTML = '<div class="finder" style="width:min(720px,94vw)">' +
                    '<div class="fh">Werkzeugkatalog<button class="icon-btn" data-a="zu">✕</button></div>' +
                    `<pre class="mcp-katalog">${esc(text)}</pre>` +
                    '<div class="fbtns"><button data-a="kop" class="prim">Kopieren</button>' +
                    '<button data-a="zu">Schliessen</button></div></div>';
                document.body.appendChild(o2);
                o2.addEventListener('click', ev => {
                    if (ev.target === o2 || elVon(ev)?.closest('[data-a="zu"]')) {
                        o2.remove();
                        return;
                    }
                    if (elVon(ev)?.closest('[data-a="kop"]')) {
                        Ablage.kopiereJetzt(text, 'Kopiert');
                    }
                });
                return;
            }
            if (b2.dataset.a === 'probe') {
                const roh = await UI.frage('JSON-RPC-Anfrage', '{"jsonrpc":"2.0","id":1,"method":"tools/list"}');
                if (!roh)
                    return;
                try {
                    const antwort = await beantworten(JSON.parse(roh));
                    UI.toast('Antwort: ' + JSON.stringify(antwort).slice(0, 150));
                    console.log('MCP-Antwort:', antwort);
                }
                catch (err) {
                    UI.banner('MCP: ' + (err instanceof Error ? err.message : String(err)), 'warn');
                }
            }
        });
    };
    const start = () => { setTimeout(() => { try {
        inAgentEinhaengen();
    }
    catch { } }, 2500); };
    return { VERSION, server, verbinden, werkzeugeHolen, werkzeugRufen, ressourcenHolen,
        alleWerkzeuge, inAgentEinhaengen, eigenerKatalog, beantworten,
        freigegeben, istFrei, dialog, start };
})();
window.MCP = MCP;
