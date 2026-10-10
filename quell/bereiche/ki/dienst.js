"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/ki/dienst.ts (npm run bauen:ts). */
const KI = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const OLLAMA = 'http://localhost:11434';
    const ollamaBefehl = () => {
        const her = String(location.origin || '');
        if (!her || her === 'null')
            return '<code style="font-size:11.5px">OLLAMA_ORIGINS=null</code> setzen.<br>' +
                '<b>Achtung:</b> Redion läuft gerade als Datei und hat keine eigene ' +
                'Herkunft. Diese Einstellung erlaubt JEDER örtlich geöffneten Seite ' +
                'den Zugriff auf Ollama. Sicherer ist die ausgelieferte Fassung ' +
                'unter einer echten Adresse.';
        return '<code style="font-size:11.5px">OLLAMA_ORIGINS=' + esc(her) + '</code> setzen.<br>' +
            'Nur diese eine Herkunft — ein <code>*</code> erlaubt jeder Webseite im ' +
            'Browser den Zugriff auf dein Ollama.';
    };
    const WEB_MODELLE = [
        { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 · 1B', groesse: '~0,8 GB', hinweis: 'Am schnellsten' },
        { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 · 3B', groesse: '~2,3 GB', hinweis: 'Guter Mittelweg' },
        { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 · 1,5B', groesse: '~1,1 GB', hinweis: 'Stark im Deutschen' },
        { id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 · 3B', groesse: '~2,0 GB', hinweis: 'Stark im Deutschen' },
        { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', name: 'Phi 3.5 mini', groesse: '~2,2 GB', hinweis: 'Gut beim Strukturieren' },
        { id: 'gemma-2-2b-it-q4f16_1-MLC', name: 'Gemma 2 · 2B', groesse: '~1,6 GB', hinweis: 'Kompakt' }
    ];
    const ANBIETER = [
        { id: 'groq', name: 'Groq', frei: true,
            url: 'https://api.groq.com/openai/v1/chat/completions',
            modelle: ['llama-3.1-8b-instant'],
            woher: 'console.groq.com/keys',
            hinweis: 'Kostenloses Kontingent, sehr schnell' },
        { id: 'openrouter', name: 'OpenRouter', frei: true,
            url: 'https://openrouter.ai/api/v1/chat/completions',
            modelle: ['meta-llama/llama-3.3-70b-instruct:free', 'google/gemma-2-9b-it:free',
                'mistralai/mistral-7b-instruct:free'],
            woher: 'openrouter.ai/keys',
            hinweis: 'Modelle mit :free kosten nichts' },
        { id: 'gemini', name: 'Google Gemini', frei: true,
            url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
            modelle: ['gemini-2.0-flash', 'gemini-2.0-flash-lite'],
            woher: 'aistudio.google.com/apikey',
            hinweis: 'Kostenloses Kontingent je Tag' },
        { id: 'openai', name: 'OpenAI', frei: false,
            url: 'https://api.openai.com/v1/chat/completions',
            modelle: ['gpt-4o-mini', 'gpt-4o'],
            woher: 'platform.openai.com/api-keys',
            hinweis: 'Kostenpflichtig' },
        { id: 'anthropic', name: 'Anthropic', frei: false,
            url: 'https://api.anthropic.com/v1/messages',
            modelle: ['claude-3-5-haiku-latest', 'claude-sonnet-4-5'],
            woher: 'console.anthropic.com/settings/keys',
            hinweis: 'Kostenpflichtig · eigenes Nachrichtenformat' },
        { id: 'eigen', name: 'Eigener Server', frei: true,
            url: '', modelle: [], woher: '',
            hinweis: 'Jede Adresse, die wie OpenAI antwortet — auch LM Studio oder llama.cpp' }
    ];
    const anbieter = (id) => ANBIETER.find(a => a.id === id) || ANBIETER[0];
    const schluessel = (id) => Store.getMeta('api:' + id, '');
    const WIEDERHOLBAR = [408, 409, 425, 429, 500, 502, 503, 504];
    const schlafen = (ms, signal) => new Promise((ok, nein) => {
        if (signal?.aborted) {
            nein(new DOMException('Der Lauf wurde abgebrochen.', 'AbortError'));
            return;
        }
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', abbrechen);
            ok();
        }, ms);
        const abbrechen = () => {
            clearTimeout(timer);
            nein(new DOMException('Der Lauf wurde abgebrochen.', 'AbortError'));
        };
        signal?.addEventListener('abort', abbrechen, { once: true });
    });
    const FEHLERTEXT = {
        400: 'Die Anfrage war fehlerhaft (invalid_request).',
        401: 'Der Schlüssel wurde nicht angenommen (unauthorized). Einstellungen → Schlüssel und APIs.',
        403: 'Der Zugriff ist gesperrt (restricted_resource).',
        404: 'Die Adresse gibt es nicht (object_not_found).',
        409: 'Es gab einen Konflikt (conflict_error) — wird gleich noch einmal versucht.',
        413: 'Die Anfrage ist zu gross (request_entity_too_large).',
        429: 'Zu viele Anfragen (rate_limited) — es wird gewartet und neu versucht.',
        500: 'Beim Anbieter ist etwas schiefgegangen (internal_server_error).',
        502: 'Der Anbieter ist gerade nicht erreichbar (bad_gateway).',
        503: 'Der Dienst ist überlastet (service_unavailable).',
        504: 'Der Anbieter hat zu lange gebraucht (gateway_timeout).'
    };
    const fehlerSatz = (status, koerper) => {
        let meldung = '', code = '';
        try {
            const d = JSON.parse(koerper || '{}');
            const e = d && (d.error || d.detail || d);
            meldung = String((e && (e.message || e.msg)) || '').trim();
            code = String((e && (e.code || e.type)) || '').trim();
        }
        catch { }
        if (!meldung)
            return (FEHLERTEXT[status] || 'unbekannter Fehler') +
                (koerper ? ' ' + koerper.slice(0, 180) : '');
        const modellWeg = /model_not_found/i.test(code) ||
            /does not exist|has been deprecated|decommissioned|no longer/i.test(meldung);
        if (modellWeg)
            return 'Dieses Modell gibt es beim Anbieter nicht mehr. ' + meldung +
                ' — wähle im KI-Fenster ein anderes Modell; „Modelle erneut holen" fragt ' +
                'den Anbieter, was er heute anbietet.';
        return meldung;
    };
    const holen = async (url, init = {}, opt = {}) => {
        const versuche = opt.versuche ?? 4;
        const basis = opt.basis ?? 700;
        let letzter = null;
        for (let i = 0; i < versuche; i++) {
            let r = null;
            try {
                r = await fetch(url, init);
            }
            catch (e) {
                letzter = e;
                if (init.signal && init.signal.aborted)
                    throw e;
                if (i === versuche - 1)
                    break;
                await schlafen(basis * Math.pow(2, i), init.signal ?? undefined);
                continue;
            }
            if (r.ok || !WIEDERHOLBAR.includes(r.status))
                return r;
            letzter = new Error('HTTP ' + r.status + ' — ' + (FEHLERTEXT[r.status] || 'unbekannter Fehler'));
            if (i === versuche - 1)
                return r;
            const kopfWarte = parseFloat(r.headers.get('retry-after') || '');
            const warte = !isNaN(kopfWarte) && kopfWarte > 0
                ? Math.min(kopfWarte * 1000, 20000)
                : basis * Math.pow(2, i);
            if (opt.beiWartezeit)
                opt.beiWartezeit(Math.round(warte / 100) / 10, i + 1, r.status);
            await schlafen(warte, init.signal ?? undefined);
        }
        throw letzter || new Error('Die Anfrage hat nicht geklappt.');
    };
    const modellAdresse = (url) => {
        if (!url)
            return '';
        if (/\/chat\/completions\/?$/.test(url))
            return url.replace(/\/chat\/completions\/?$/, '/models');
        if (/\/messages\/?$/.test(url))
            return url.replace(/\/messages\/?$/, '/models');
        return url.replace(/\/+$/, '') + '/models';
    };
    const modelleHolen = async (id) => {
        try {
            const a = anbieter(id);
            const key = schluessel(a.id);
            const url = modellAdresse(a.id === 'eigen' ? Store.getMeta('api:eigenUrl', '') : a.url);
            if (!url)
                return null;
            const kopf = { 'Content-Type': 'application/json' };
            if (a.id === 'anthropic') {
                kopf['x-api-key'] = key;
                kopf['anthropic-version'] = '2023-06-01';
                kopf['anthropic-dangerous-direct-browser-access'] = 'true';
            }
            else if (key) {
                kopf['Authorization'] = 'Bearer ' + key;
            }
            const r = await fetch(url, { method: 'GET', headers: kopf });
            if (!r.ok)
                return null;
            const d = await r.json();
            const roh = Array.isArray(d?.data) ? d.data : (Array.isArray(d?.models) ? d.models : []);
            const liste = roh
                .map((m) => String(m?.id || m?.name || '')).filter(Boolean)
                .filter((n) => !/whisper|tts|embed|guard|moderat|vision-ocr/i.test(n))
                .sort();
            if (!liste.length)
                return null;
            Store.setMeta('ki:modelle:' + a.id, liste);
            return liste;
        }
        catch {
            return null;
        }
    };
    const modellWaehlen = async (id) => {
        if (id === 'eigen')
            return Store.getMeta('api:eigenModell', 'lokal');
        await modelleHolen(id);
        return modelleVon(id)[0] || '';
    };
    const modelleVon = (id) => {
        const gemerkt = Store.getMeta('ki:modelle:' + id, null);
        if (Array.isArray(gemerkt) && gemerkt.length)
            return gemerkt;
        const a = anbieter(id);
        return Array.isArray(a.modelle) ? a.modelle : [];
    };
    const wolkeFragen = async function* (nachrichten, modell, signal, abrechnung) {
        const a = anbieter(zustand.anbieter);
        const key = schluessel(a.id);
        const url = a.id === 'eigen' ? Store.getMeta('api:eigenUrl', '') : a.url;
        if (!url)
            throw new Error('Für diesen Anbieter fehlt die Adresse.');
        if (!key && a.id !== 'eigen')
            throw new Error('Es ist noch kein Schlüssel hinterlegt. Einstellungen → Schlüssel.');
        const istAnthropic = a.id === 'anthropic';
        const kopf = { 'Content-Type': 'application/json' };
        if (istAnthropic) {
            kopf['x-api-key'] = key;
            kopf['anthropic-version'] = '2023-06-01';
            kopf['anthropic-dangerous-direct-browser-access'] = 'true';
        }
        else if (key) {
            kopf['Authorization'] = 'Bearer ' + key;
        }
        const sys = nachrichten.find((m) => m.role === 'system');
        const rest = nachrichten.filter((m) => m.role !== 'system');
        const koerper = istAnthropic
            ? { model: modell, max_tokens: 2000, stream: true,
                system: sys ? sys.content : undefined, messages: rest }
            : { model: modell, messages: nachrichten, stream: true,
                ...(KiAbrechnung.willAbrechnung(a.id)
                    ? { stream_options: { include_usage: true } } : {}) };
        const r = await holen(url, { method: 'POST', headers: kopf, body: JSON.stringify(koerper), signal: signal ?? null }, { beiWartezeit: (sek, nr, code) => UI.toast(`${a.name}: ${code} — neuer Versuch ${nr + 1} in ${sek} s`) });
        if (!r.ok) {
            const txt = await r.text().catch(() => '');
            throw new Error(a.name + ' antwortet mit ' + r.status + '. ' + fehlerSatz(r.status, txt));
        }
        if (!r.body)
            throw new Error('Die Antwort hat keinen Inhalt.');
        const leser = r.body.getReader();
        const dec = new TextDecoder();
        let puffer = '';
        while (true) {
            const { done, value } = await leser.read();
            if (done)
                break;
            puffer += dec.decode(value, { stream: true });
            const zeilen = puffer.split('\n');
            puffer = zeilen.pop() ?? '';
            for (const z of zeilen) {
                const t = z.trim();
                if (!t.startsWith('data:'))
                    continue;
                const rohdaten = t.slice(5).trim();
                if (rohdaten === '[DONE]')
                    return;
                try {
                    const d = JSON.parse(rohdaten);
                    if (abrechnung) {
                        const teil = KiAbrechnung.ausEreignis(d, istAnthropic);
                        if (teil) {
                            const zus = KiAbrechnung.zusammen({ ...(abrechnung.ein !== undefined ? { ein: abrechnung.ein } : {}),
                                ...(abrechnung.aus !== undefined ? { aus: abrechnung.aus } : {}) }, teil);
                            if (zus) {
                                if (zus.ein !== undefined)
                                    abrechnung.ein = zus.ein;
                                if (zus.aus !== undefined)
                                    abrechnung.aus = zus.aus;
                            }
                        }
                    }
                    const stueck = istAnthropic
                        ? (d.delta && d.delta.text) || ''
                        : (d.choices && d.choices[0] && d.choices[0].delta && d.choices[0].delta.content) || '';
                    if (stueck)
                        yield stueck;
                }
                catch { }
            }
        }
    };
    const zustand = {
        quelle: 'ollama',
        anbieter: 'groq',
        modell: '',
        bereit: false,
        laedt: false,
        ollamaModelle: [],
        engine: null,
        abbruch: null,
        verlauf: [],
        chatId: '',
        modus: 'standard'
    };
    const chatsLesen = () => Store.getMeta('chats', []) || [];
    const chatsSchreiben = (liste) => Store.setMeta('chats', liste.slice(0, 200));
    const chatSichern = () => {
        if (!zustand.verlauf.length)
            return;
        const liste = chatsLesen();
        const erste = zustand.verlauf.find(m => m.role === 'user');
        const titel = (erste ? erste.content : 'Chat').slice(0, 60);
        const jetzt = Store.now();
        const i = liste.findIndex((c) => c.id === zustand.chatId);
        const eintrag = { id: zustand.chatId || Store.uid(), titel,
            verlauf: zustand.verlauf.slice(-40), wann: jetzt,
            angeheftet: i >= 0 ? liste[i].angeheftet : false };
        zustand.chatId = eintrag.id;
        if (i >= 0)
            liste[i] = eintrag;
        else
            liste.unshift(eintrag);
        chatsSchreiben(liste);
    };
    const chatOeffnen = (id) => {
        const c = chatsLesen().find((x) => x.id === id);
        if (!c)
            return;
        zustand.chatId = c.id;
        zustand.verlauf = [...(c.verlauf || [])];
        App.kiPanel(true);
        const feld = document.getElementById('chat');
        if (feld) {
            feld.innerHTML = '';
            zustand.verlauf.forEach(m => schreibe(m.role, m.content));
        }
        App.zeichneBaum();
    };
    const neuerChat = () => {
        chatSichern();
        zustand.chatId = '';
        zustand.verlauf = [];
        App.kiPanel(true);
        const feld = document.getElementById('chat');
        if (feld)
            feld.innerHTML = '';
        App.zeichneBaum();
        document.getElementById('ai-input')?.focus();
    };
    const chatLoeschen = (id) => {
        chatsSchreiben(chatsLesen().filter((c) => c.id !== id));
        if (zustand.chatId === id) {
            zustand.chatId = '';
            zustand.verlauf = [];
        }
        App.zeichneBaum();
    };
    const chatAnheften = (id) => {
        const liste = chatsLesen();
        const c = liste.find((x) => x.id === id);
        if (!c)
            return;
        c.angeheftet = !c.angeheftet;
        chatsSchreiben(liste);
        App.zeichneBaum();
    };
    const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August',
        'September', 'Oktober', 'November', 'Dezember'];
    const chatsGruppiert = () => {
        const liste = chatsLesen();
        const heute = new Date();
        heute.setHours(0, 0, 0, 0);
        const tag = 86400000;
        const reihe = [];
        const rein = (name, c) => {
            let g = reihe.find(x => x[0] === name);
            if (!g) {
                g = [name, []];
                reihe.push(g);
            }
            g[1].push(c);
        };
        if (liste.some((c) => c.angeheftet))
            reihe.push(['Angeheftet', []]);
        liste.forEach((c) => {
            if (c.angeheftet) {
                rein('Angeheftet', c);
                return;
            }
            const d = Date.parse(c.wann);
            if (isNaN(d)) {
                rein('Älter', c);
                return;
            }
            if (d >= heute.getTime())
                rein('Heute', c);
            else if (d >= heute.getTime() - tag)
                rein('Gestern', c);
            else if (d >= heute.getTime() - 7 * tag)
                rein('Diese Woche', c);
            else {
                const dt = new Date(d);
                rein(MONATE[dt.getMonth()] + ' ' + dt.getFullYear(), c);
            }
        });
        return reihe.filter(g => g[1].length);
    };
    const wieLange = (wann) => {
        const d = Date.parse(wann);
        if (isNaN(d))
            return '';
        const min = Math.floor((Date.now() - d) / 60000);
        if (min < 60)
            return 'vor ' + Math.max(1, min) + ' Min.';
        if (min < 1440)
            return 'vor ' + Math.floor(min / 60) + ' Std.';
        const tage = Math.floor(min / 1440);
        if (tage === 1)
            return 'gestern';
        if (tage < 30)
            return 'vor ' + tage + ' Tagen';
        const monate = Math.floor(tage / 30);
        if (monate < 12)
            return 'vor ' + monate + (monate === 1 ? ' Monat' : ' Monaten');
        const jahre = Math.floor(tage / 365);
        return 'vor ' + jahre + (jahre === 1 ? ' Jahr' : ' Jahren');
    };
    const FAEHIG_START = [
        { id: 'stil', icon: '✍️', name: 'Schreibstil verbessern',
            auftrag: 'Verbessere den Stil des Textes. Behalte Inhalt und Bedeutung genau bei.' },
        { id: 'korrek', icon: '✅', name: 'Korrekturlesen',
            auftrag: 'Korrigiere Rechtschreibung, Grammatik und Zeichensetzung. Ändere sonst nichts.' },
        { id: 'erklaer', icon: '💡', name: 'Erklären',
            auftrag: 'Erkläre den Text einfach und verständlich, ohne Fachjargon.' },
        { id: 'format', icon: '✨', name: 'Neu formatieren',
            auftrag: 'Gliedere den Text sauber mit Überschriften und Listen. Der Inhalt bleibt.' }
    ];
    const faehigkeiten = () => {
        const eigene = Store.getMeta('kiFaehigkeiten', null);
        return eigene === null ? FAEHIG_START : eigene;
    };
    const faehigkeitSichern = (f) => {
        const liste = [...faehigkeiten()];
        const i = liste.findIndex(x => x.id === f.id);
        if (i >= 0)
            liste[i] = f;
        else
            liste.push(f);
        Store.setMeta('kiFaehigkeiten', liste);
    };
    const faehigkeitLoeschen = (id) => Store.setMeta('kiFaehigkeiten', faehigkeiten().filter((f) => f.id !== id));
    const ollamaPruefen = async () => {
        try {
            const c = new AbortController();
            const t = setTimeout(() => c.abort(), 1200);
            const r = await fetch(OLLAMA + '/api/tags', { signal: c.signal });
            clearTimeout(t);
            if (!r.ok)
                return false;
            const d = await r.json();
            zustand.ollamaModelle = (d.models || []).map((m) => ({
                id: m.name,
                name: m.name,
                groesse: m.size ? (m.size / 1e9).toFixed(1) + ' GB' : ''
            }));
            return zustand.ollamaModelle.length > 0;
        }
        catch {
            return false;
        }
    };
    const ollamaFragen = async function* (nachrichten, modell, signal) {
        const r = await fetch(OLLAMA + '/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: modell, messages: nachrichten, stream: true }),
            signal: signal ?? null
        });
        if (!r.ok)
            throw new Error('Ollama antwortet mit ' + r.status);
        if (!r.body)
            throw new Error('Die Antwort hat keinen Inhalt.');
        const leser = r.body.getReader();
        const dec = new TextDecoder();
        let rest = '';
        while (true) {
            const { done, value } = await leser.read();
            if (done)
                break;
            rest += dec.decode(value, { stream: true });
            const zeilen = rest.split('\n');
            rest = zeilen.pop() ?? '';
            for (const z of zeilen) {
                if (!z.trim())
                    continue;
                try {
                    const j = JSON.parse(z);
                    if (j.message && j.message.content)
                        yield j.message.content;
                }
                catch { }
            }
        }
    };
    let webllmLib = null;
    const webllmLaden = async (modellId, fortschritt) => {
        if (!webllmLib) {
            try {
                webllmLib = await (new Function('p', 'return import(p)'))('https://esm.run/@mlc-ai/web-llm');
            }
            catch {
                throw new Error('WebLLM konnte nicht geladen werden. Beim ersten Mal wird eine Internetverbindung gebraucht.');
            }
        }
        if (!navigator.gpu) {
            throw new Error('Dieser Browser hat kein WebGPU. Chrome oder Edge ab Version 113 können es — oder du nimmst Ollama.');
        }
        zustand.engine = await webllmLib.CreateMLCEngine(modellId, {
            initProgressCallback: (b) => fortschritt && fortschritt(b.text || '', b.progress || 0)
        });
        return zustand.engine;
    };
    const webllmFragen = async function* (nachrichten, signal) {
        if (signal?.aborted)
            throw new DOMException('Der Lauf wurde abgebrochen.', 'AbortError');
        const abbrechen = () => {
            try {
                zustand.engine?.interruptGenerate?.();
            }
            catch { }
        };
        signal?.addEventListener('abort', abbrechen, { once: true });
        try {
            const strom = await zustand.engine.chat.completions.create({
                messages: nachrichten, stream: true, temperature: 0.7
            });
            for await (const teil of strom) {
                if (signal?.aborted)
                    throw new DOMException('Der Lauf wurde abgebrochen.', 'AbortError');
                const t = teil.choices?.[0]?.delta?.content;
                if (t)
                    yield t;
            }
        }
        finally {
            signal?.removeEventListener('abort', abbrechen);
        }
    };
    const ordne = (nachrichten) => {
        const systeme = nachrichten.filter((m) => m.role === 'system').map((m) => m.content);
        const rest = nachrichten.filter((m) => m.role !== 'system');
        return systeme.length
            ? [{ role: 'system', content: systeme.join('\n\n') }, ...rest]
            : rest;
    };
    const frage = async (nachrichten, beiText, optionen) => {
        if (!zustand.modell)
            throw new Error('Es ist noch kein Modell gewählt.');
        const n = ordne(nachrichten);
        if (typeof Protokoll !== 'undefined')
            Protokoll.notieren('ki', 'KI gefragt (' + (zustand.quelle || 'lokal') + ')', { wie: zustand.modell || '' });
        if (zustand.quelle === 'ollama') {
            for await (const t of ollamaFragen(n, zustand.modell, optionen?.signal))
                beiText(t);
            return;
        }
        if (zustand.quelle === 'wolke') {
            let gebucht = null;
            if (typeof KiBuch !== 'undefined') {
                const urteil = KiBuch.pruefen(zustand.modell, n, { lokal: false });
                if (!urteil.erlaubt)
                    throw new Error(urteil.satz);
                const s = urteil.schaetzung;
                if (s && s.bekannt && !s.frei) {
                    gebucht = KiBuch.buchen(zustand.modell, zustand.anbieter || '', s.tokenEin, s.tokenAus, false);
                }
            }
            const abrechnung = {};
            try {
                for await (const t of wolkeFragen(n, zustand.modell, optionen?.signal, abrechnung))
                    beiText(t);
            }
            finally {
                if (gebucht && KiAbrechnung.vollstaendig(abrechnung)) {
                    KiBuch.berichtigen(gebucht.id, abrechnung.ein, abrechnung.aus);
                }
            }
            return;
        }
        if (!zustand.engine)
            throw new Error('Das Modell ist noch nicht geladen.');
        for await (const t of webllmFragen(n, optionen?.signal))
            beiText(t);
    };
    const frageKurz = async (prompt, system, optionen) => {
        let out = '';
        const n = [];
        if (system)
            n.push({ role: 'system', content: system });
        n.push({ role: 'user', content: prompt });
        await frage(n, (t) => out += t, optionen);
        return out.trim();
    };
    const start = async () => {
        const gemerkt = Store.getMeta('ki', null);
        if (gemerkt && gemerkt.quelle === 'wolke' &&
            (schluessel(gemerkt.anbieter) || gemerkt.anbieter === 'eigen')) {
            zustand.quelle = 'wolke';
            zustand.anbieter = gemerkt.anbieter;
            zustand.modell = gemerkt.modell;
            zustand.bereit = true;
            status('ok', kurzName(zustand.modell));
            zeichneModellKnopf();
            return;
        }
        const lohntSuche = !!gemerkt && gemerkt.quelle === 'ollama';
        const da = lohntSuche ? await ollamaPruefen() : false;
        if (da) {
            zustand.quelle = 'ollama';
            zustand.modell = (gemerkt && gemerkt.quelle === 'ollama' &&
                zustand.ollamaModelle.some(m => m.id === gemerkt.modell))
                ? gemerkt.modell
                : zustand.ollamaModelle[0].id;
            zustand.bereit = true;
            status('ok', kurzName(zustand.modell));
        }
        else {
            zustand.quelle = 'webllm';
            zustand.modell = (gemerkt && gemerkt.quelle === 'webllm') ? gemerkt.modell : '';
            zustand.bereit = false;
            status('', zustand.modell ? kurzName(zustand.modell) : 'Modell wählen');
        }
        zeichneModellKnopf();
    };
    const kurzName = (id) => {
        if (zustand.quelle === 'wolke')
            return (String(id).split('/').pop() ?? '').replace(':free', '');
        const w = WEB_MODELLE.find(m => m.id === id);
        if (w)
            return w.name;
        return id.replace(':latest', '');
    };
    const status = (klasse, text) => {
        const d = document.querySelector('#ai .dot');
        const s = document.querySelector('#ai .model-btn .model-name');
        if (d)
            d.className = 'dot ' + (klasse || '');
        if (s)
            s.textContent = text;
        const button = document.querySelector('#ai .model-btn');
        button?.setAttribute('title', 'Modell wechseln: ' + text);
        button?.setAttribute('aria-label', 'KI-Modell wechseln: ' + text);
    };
    const zeichneModellKnopf = () => {
        const b = document.querySelector('#ai .model-btn');
        if (!b)
            return;
        b.onclick = () => modellMenue(b);
    };
    const modellMenue = async (anker) => {
        const r = anker.getBoundingClientRect();
        const da = await ollamaPruefen();
        let html = '<div class="grp">Ollama · auf deinem Rechner</div>';
        if (da) {
            zustand.ollamaModelle.forEach(m => {
                const an = zustand.quelle === 'ollama' && zustand.modell === m.id;
                html += `<button data-q="ollama" data-m="${esc(m.id)}" ${an ? 'class="on"' : ''}>` +
                    `<span class="mi">${an ? '✓' : '●'}</span>` +
                    `<span>${esc(kurzName(m.id))}<span class="sub">${m.groesse} · schnell, lokal</span></span></button>`;
            });
        }
        else {
            html += '<div style="padding:6px 12px 10px; font-size:12.5px; color:var(--text-dim); line-height:1.5">' +
                'Ollama läuft gerade nicht.<br>' +
                '<a href="https://ollama.com" target="_blank" style="color:var(--accent)">ollama.com</a> ' +
                'installieren, dann<br><code style="font-size:11.5px">ollama pull llama3.2</code><br><br>' +
                'Damit der Browser zugreifen darf, einmal<br>' +
                ollamaBefehl() +
                '</div>';
        }
        html += '<hr><div class="grp">Im Browser · ohne Installation</div>';
        WEB_MODELLE.forEach(m => {
            const an = zustand.quelle === 'webllm' && zustand.modell === m.id;
            html += `<button data-q="webllm" data-m="${esc(m.id)}" ${an ? 'class="on"' : ''}>` +
                `<span class="mi">${an ? '✓' : '○'}</span>` +
                `<span>${esc(m.name)}<span class="sub">${m.groesse} · ${m.hinweis}</span></span></button>`;
        });
        const mitSchluessel = ANBIETER.filter(a => schluessel(a.id) || (a.id === 'eigen' && Store.getMeta('api:eigenUrl', '')));
        if (mitSchluessel.length) {
            html += '<hr><div class="grp">Über deinen eigenen Schlüssel</div>';
            mitSchluessel.forEach(a => {
                const modelle = a.id === 'eigen'
                    ? [Store.getMeta('api:eigenModell', 'lokal')]
                    : modelleVon(a.id);
                modelle.forEach(mo => {
                    const an = zustand.quelle === 'wolke' && zustand.anbieter === a.id && zustand.modell === mo;
                    html += `<button data-q="wolke" data-a="${a.id}" data-m="${esc(mo)}" ${an ? 'class="on"' : ''}>` +
                        `<span class="mi">${an ? '✓' : '☁'}</span>` +
                        `<span>${esc(mo.split('/').pop())}` +
                        `<span class="sub">${esc(a.name)}${a.frei ? ' · kostenloses Kontingent' : ''}</span></span></button>`;
                });
            });
        }
        html += '<hr><button data-q="check"><span class="mi">⟳</span>Erneut nach Ollama suchen</button>';
        if (mitSchluessel.some(a => a.id !== 'eigen'))
            html += '<button data-q="modelle"><span class="mi">☁</span>Modelle erneut holen</button>';
        html += '<button data-q="schluessel"><span class="mi">🔑</span>Schlüssel hinterlegen …</button>';
        const m = UI.menu(html, Math.max(10, r.right - 300), r.bottom + 6);
        m.addEventListener('click', async (e) => {
            const b = elVon(e)?.closest('button[data-q]');
            if (!b)
                return;
            if (b.dataset.q === 'check') {
                m.remove();
                start();
                UI.toast('Suche nach Ollama …');
                return;
            }
            if (b.dataset.q === 'modelle') {
                m.remove();
                UI.toast('Frage die Anbieter nach ihren Modellen …');
                const ziele = ANBIETER.filter(a => a.id !== 'eigen' && schluessel(a.id));
                const erg = await Promise.all(ziele.map(a => modelleHolen(a.id)));
                const gut = erg.filter(Boolean).length;
                UI.toast(gut
                    ? gut + ' von ' + ziele.length + ' Anbietern haben geantwortet — die Liste ist aktuell.'
                    : 'Kein Anbieter hat geantwortet. Es bleibt bei der eingebauten Liste.');
                return;
            }
            if (b.dataset.q === 'schluessel') {
                m.remove();
                App.einstellungen('schluessel');
                return;
            }
            m.remove();
            zustand.quelle = b.dataset.q ?? zustand.quelle;
            zustand.modell = b.dataset.m ?? zustand.modell;
            if (b.dataset.q === 'wolke')
                zustand.anbieter = b.dataset.a ?? zustand.anbieter;
            Store.setMeta('ki', { quelle: zustand.quelle, modell: zustand.modell, anbieter: zustand.anbieter });
            if (zustand.quelle === 'wolke') {
                zustand.bereit = true;
                status('ok', kurzName(zustand.modell));
                zeichneModellKnopf();
                melde('Jetzt antwortet ' + anbieter(zustand.anbieter).name + '. ' +
                    'Dein Schlüssel und dein Text gehen dabei an diesen Anbieter.');
                return;
            }
            if (zustand.quelle === 'ollama') {
                zustand.bereit = true;
                status('ok', kurzName(zustand.modell));
                melde('Modell gewechselt zu ' + kurzName(zustand.modell) + ' (Ollama).');
                return;
            }
            zustand.bereit = false;
            zustand.laedt = true;
            status('load', 'Lädt …');
            const zeile = melde('Modell wird geladen. Beim ersten Mal dauert das ein paar Minuten — danach liegt es im Browser-Cache.');
            const ring = typeof Lader !== 'undefined'
                ? Lader.bauen({ art: 'fluss', anteil: 0, text: 'Modell wird geladen …' }) : null;
            const balken = document.createElement('div');
            if (ring)
                zeile.appendChild(ring.element);
            else {
                balken.className = 'prog';
                balken.innerHTML = '<i style="width:0%"></i>';
                zeile.appendChild(balken);
            }
            try {
                await webllmLaden(zustand.modell, (_text, p) => {
                    const anteil = Math.max(0, Math.min(1, Number(p) || 0));
                    if (ring)
                        ring.setzen({ anteil });
                    const innen = balken.firstChild;
                    if (innen instanceof HTMLElement)
                        innen.style.width = Math.round(anteil * 100) + '%';
                    status('load', Math.round(anteil * 100) + ' %');
                });
                zustand.bereit = true;
                zustand.laedt = false;
                status('ok', kurzName(zustand.modell));
                zeile.textContent = 'Bereit: ' + kurzName(zustand.modell) + ' läuft jetzt im Browser.';
            }
            catch (err) {
                zustand.laedt = false;
                status('err', 'Fehler');
                zeile.textContent = err instanceof Error ? err.message : String(err);
            }
        });
    };
    const esc = (s) => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c));
    const melde = (text) => {
        const chat = document.getElementById('chat');
        const d = document.createElement('div');
        d.className = 'msg sys';
        d.textContent = text;
        if (chat) {
            chat.appendChild(d);
            chat.scrollTop = chat.scrollHeight;
        }
        return d;
    };
    const schreibe = (rolle, text) => {
        const chat = document.getElementById('chat');
        const d = document.createElement('div');
        d.className = 'msg ' + (rolle === 'user' ? 'u' : 'a');
        d.textContent = text;
        if (chat) {
            chat.appendChild(d);
            chat.scrollTop = chat.scrollHeight;
        }
        return d;
    };
    const seitenKontext = () => {
        const id = App.aktuelleSeite();
        const p = Store.getBlock(id);
        if (!p)
            return '';
        const zeilen = [];
        const sammle = (bid, tiefe) => {
            if (tiefe > 3)
                return;
            Store.childrenOf(bid).forEach((b) => {
                if (b.text)
                    zeilen.push('  '.repeat(tiefe) + b.text);
                if (b.type === 'database') {
                    const c = Store.getCollection(b.collectionId);
                    if (c) {
                        const rows = Store.rowsOf(c.id).slice(0, 40);
                        zeilen.push(`  `.repeat(tiefe) + `[Datenbank "${c.name}" mit ${Store.rowsOf(c.id).length} Einträgen]`);
                        rows.forEach(r => {
                            const teile = Object.keys(c.schema).map(k => c.schema[k].name + ': ' + Formula.anzeige(Datenbank.wert(r, k, c)));
                            zeilen.push('  '.repeat(tiefe + 1) + teile.join(' | '));
                        });
                    }
                }
                sammle(b.id, tiefe + 1);
            });
        };
        sammle(id, 0);
        const txt = `Titel der Seite: ${p.text || 'Ohne Titel'}\n\n${zeilen.join('\n')}`;
        return txt.slice(0, 8000);
    };
    const SYSTEM = 'Du bist der Assistent in Redion, einer lokalen Notion-App. Du antwortest auf Deutsch, ' +
        'knapp und klar. Wenn dir Ausschnitte aus dem Arbeitsbereich mitgegeben werden, ' +
        'beziehst du dich ausschliesslich darauf und erfindest nichts dazu. ' +
        'Steht die Antwort nicht in den Ausschnitten, sagst du das offen. ' +
        'Keine Floskeln, keine Wiederholung der Frage.';
    const quellenKarte = (quellen) => {
        if (!quellen || !quellen.length)
            return null;
        const d = document.createElement('div');
        d.className = 'ki-quellen';
        d.innerHTML = '<div class="kq-kopf">Quellen · ' + quellen.length + '</div>' +
            quellen.map((q) => `<button class="kq-zeile" data-q="${q.id}">` +
                `<span class="kq-titel">${esc(q.titel)}</span>` +
                `<span class="kq-art">${esc(q.art || '')}</span>` +
                (q.geaendert ? `<span class="kq-zeit">${esc(String(q.geaendert).slice(0, 10))}</span>` : '') +
                '</button>').join('');
        d.addEventListener('click', e => {
            const b = elVon(e)?.closest('[data-q]');
            if (!b)
                return;
            const z = Store.getBlock(b.dataset.q);
            if (!z) {
                UI.toast('Diese Seite gibt es nicht mehr');
                return;
            }
            z.parentTable === 'collection'
                ? Datenbank.zeilePeek(z, Store.getCollection(z.parentId))
                : App.oeffne(z.id);
        });
        return d;
    };
    const QUELLEN_NAMEN = [
        ['aktuelleSeite', '📄', 'Diese Seite'],
        ['arbeitsbereich', '🗂', 'Arbeitsbereich'],
        ['datenbanken', '▦', 'Datenbanken'],
        ['verbindungen', '🔌', 'Verbundenes'],
        ['web', '🌐', 'Web']
    ];
    const aktiveQuellen = () => {
        const q = Kontext.quellen();
        return QUELLEN_NAMEN.filter(([k]) => q[k]).map(([, , n]) => n);
    };
    const quellenKnoepfe = () => {
        const q = Kontext.quellen();
        return QUELLEN_NAMEN.map(([k, z, n]) => `<button data-qs="${k}" aria-pressed="${!!q[k]}" class="${q[k] ? 'an' : ''}">${z} ${n}</button>`).join('');
    };
    const quellenBinden = (d) => {
        d.addEventListener('click', async (e) => {
            const b = elVon(e)?.closest('[data-qs]');
            if (!b)
                return;
            const qs = b.dataset.qs;
            if (!qs)
                return;
            const an = await Kontext.quelleUmschalten(qs);
            if (an === null)
                return;
            UI.toast((an ? 'An: ' : 'Aus: ') + (b.textContent || '').trim());
        });
        return d;
    };
    const quellenLeiste = () => {
        const d = document.createElement('div');
        d.className = 'ki-quellschalter';
        d.innerHTML = quellenKnoepfe();
        return quellenBinden(d);
    };
    const quellenSchild = () => {
        const k = document.getElementById('ai-quellen');
        if (!k)
            return;
        const an = aktiveQuellen();
        k.setAttribute('aria-label', 'Quellen: ' + (an.length ? an.join(', ') : 'keine') + ' — ändern');
        const zahl = k.querySelector('.ai-quellen-zahl');
        if (zahl)
            zahl.textContent = String(an.length);
        k.classList.toggle('ohne', !an.length);
    };
    const quellenAbgleichen = () => {
        const q = Kontext.quellen();
        document.querySelectorAll('[data-qs]').forEach(b => {
            const an = !!q[b.dataset.qs || ''];
            b.classList.toggle('an', an);
            b.setAttribute('aria-pressed', String(an));
        });
        quellenSchild();
    };
    const kontextSatz = () => {
        if (!Store.getMeta('kiKontext', true))
            return 'Neuer Chat. Die KI sieht nichts aus deinem Arbeitsbereich — ' +
                '„Seiteninhalt mitgeben" ist in den KI-Einstellungen aus.';
        const an = aktiveQuellen();
        return an.length ? 'Neuer Chat. Die KI sieht: ' + an.join(' · ') + '.'
            : 'Neuer Chat. Die KI sieht nichts — alle Quellen sind aus.';
    };
    const sendenKnopf = (imLauf) => {
        const k = document.getElementById('ai-senden');
        if (!k)
            return;
        k.textContent = imLauf ? '■' : '↑';
        k.setAttribute('aria-label', imLauf ? 'Antwort abbrechen' : 'Nachricht senden');
        k.setAttribute('title', imLauf ? 'Abbrechen' : 'Senden');
        if (imLauf)
            k.setAttribute('data-lauf', '1');
        else
            k.removeAttribute('data-lauf');
    };
    const abbrechen = () => {
        if (!zustand.abbruch)
            return false;
        zustand.abbruch.abort();
        return true;
    };
    const erwaehnt = new Map();
    const senden = async (text, mitKontext = true) => {
        if (!text.trim())
            return;
        const at = mitKontext ? atBefehl(text.trim()) : null;
        if (at) {
            const lauf = at.rest ? { text: at.rest, wo: 'Eingabe' } : {};
            if (at.f)
                await faehigkeitAusfuehren(at.f, lauf);
            else if (at.b)
                await ausfuehren(at.b.id, lauf);
            return;
        }
        if (!zustand.bereit) {
            melde(zustand.quelle === 'ollama'
                ? 'Ollama ist nicht erreichbar. Unten im Eingabefeld ein Modell wählen oder auf „Erneut nach Ollama suchen" klicken.'
                : 'Es ist noch kein Modell geladen. Wähle unten im Eingabefeld ein Modell.');
            return;
        }
        schreibe('user', text);
        const ziel = schreibe('assistant', '');
        ziel.textContent = '…';
        let system = SYSTEM;
        let quellen = [];
        if (mitKontext && Store.getMeta('kiKontext', true)) {
            ziel.textContent = 'Sucht im Arbeitsbereich …';
            const extraSeiten = [...erwaehnt].filter(([, titel]) => text.includes('@' + titel)).map(([id]) => id);
            erwaehnt.clear();
            const k = await Kontext.bauenFuerFrage(text, { anzahl: 6, extraSeiten });
            quellen = k.quellen;
            const tor = Kontext.darfFragen(k);
            if (!tor.ok) {
                ziel.textContent = tor.grund;
                ziel.classList.add('msg-ohne-quelle');
                zustand.verlauf.push({ role: 'user', content: text });
                zustand.verlauf.push({ role: 'assistant', content: tor.grund });
                chatSichern();
                return;
            }
            if (!k.leer)
                system += '\n\nDas hier steht in seinem Arbeitsbereich dazu:\n\n' + k.text;
            else
                system += '\n\nIm Arbeitsbereich wurde nichts Passendes gefunden. Sag das offen, ' +
                    'statt etwas zu erfinden.';
            if (Kontext.nurQuellen())
                system += Kontext.nurQuellenAnweisung();
            if (Kontext.quellen().web && !Kontext.nurQuellen()) {
                try {
                    const begriff = (text.split(/[?.!]/)[0] ?? '').slice(0, 60);
                    const w = await wikipedia(begriff);
                    if (w) {
                        system += '\n\nAus der Wikipedia zu „' + w.titel + '":\n' + w.text;
                        quellen.push({ id: '', titel: w.titel, art: 'Wikipedia', link: w.link });
                    }
                }
                catch { }
            }
        }
        if (Store.getMeta('ki:persoenlich', ''))
            system += '\n\nDauerhafte Anweisungen: ' + Store.getMeta('ki:persoenlich', '');
        if (zustand.modus === 'fragen')
            system += '\n\nWichtig: Du beantwortest nur Fragen. Lege nichts an, ändere nichts ' +
                'und schlage keine Änderungen vor, um die man dich nicht gebeten hat.';
        const pers = persona();
        if (pers.name && pers.name !== 'KI')
            system += '\n\nDu heisst ' + pers.name + '.';
        const laenge = Store.getMeta('kiLaenge', 'normal');
        if (laenge === 'kurz')
            system += '\n\nAntworte knapp, höchstens drei Sätze.';
        if (laenge === 'lang')
            system += '\n\nAntworte ausführlich und gut gegliedert.';
        const nachrichten = [{ role: 'system', content: system }];
        zustand.verlauf.slice(-6)
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .forEach(m => nachrichten.push(m));
        nachrichten.push({ role: 'user', content: text });
        let antwort = '';
        const aktivitaet = zeigeAktivitaet(ziel);
        ziel.classList.add('ki-schreibt');
        const steuer = new AbortController();
        zustand.abbruch = steuer;
        sendenKnopf(true);
        try {
            await frage(nachrichten, (t) => {
                antwort += t;
                ziel.textContent = antwort;
                const kasten = document.getElementById('chat');
                if (kasten)
                    kasten.scrollTop = 1e9;
            }, { signal: steuer.signal });
            zustand.verlauf.push({ role: 'user', content: text });
            zustand.verlauf.push({ role: 'assistant', content: antwort });
        }
        catch (e) {
            const abbruch = steuer.signal.aborted
                || (e instanceof Error && e.name === 'AbortError');
            if (abbruch) {
                ziel.textContent = antwort
                    ? antwort + '\n\n— Abgebrochen.'
                    : 'Abgebrochen.';
            }
            else {
                ziel.textContent = '⚠ ' + (e instanceof Error ? e.message : String(e));
            }
        }
        finally {
            zustand.abbruch = null;
            sendenKnopf(false);
            ziel.classList.remove('ki-schreibt');
            aktivitaet.remove();
        }
        const qk = quellenKarte(quellen);
        if (qk && antwort)
            ziel.appendChild(qk);
        if (antwort) {
            chatSichern();
            App.zeichneBaum();
        }
        if (antwort) {
            const tat = document.createElement('div');
            tat.className = 'msg-tat';
            tat.innerHTML = '<button data-t="kopie" title="Kopieren">⧉</button>' +
                '<button data-t="gut" title="Gute Antwort">👍</button>' +
                '<button data-t="schlecht" title="Daneben">👎</button>';
            tat.addEventListener('click', (e) => {
                const b = elVon(e)?.closest('[data-t]');
                if (!b)
                    return;
                if (b.dataset.t === 'kopie') {
                    Ablage.kopiereJetzt(antwort, 'Antwort kopiert');
                }
                else {
                    b.classList.add('an');
                    const bew = Store.getMeta('kiBewertung', []) || [];
                    bew.push({ wann: Store.now(), gut: b.dataset.t === 'gut', frage: text.slice(0, 80) });
                    Store.setMeta('kiBewertung', bew.slice(-200));
                    UI.toast(b.dataset.t === 'gut' ? 'Gemerkt — danke' : 'Gemerkt. Steht im Protokoll.');
                }
            });
            ziel.appendChild(tat);
        }
        if (antwort) {
            const btn = document.createElement('button');
            btn.textContent = '↧ In die Seite einfügen';
            btn.style.cssText = 'font-size:12px; color:var(--accent); margin-top:6px; ' +
                'padding:3px 8px; border-radius:5px; display:block';
            btn.addEventListener('click', () => {
                antwort.split('\n').filter(z => z.trim()).forEach(z => {
                    let typ = 'text', t = z.trim();
                    if (/^#{1}\s/.test(t)) {
                        typ = 'h1';
                        t = t.replace(/^#\s/, '');
                    }
                    else if (/^#{2}\s/.test(t)) {
                        typ = 'h2';
                        t = t.replace(/^##\s/, '');
                    }
                    else if (/^#{3}\s/.test(t)) {
                        typ = 'h3';
                        t = t.replace(/^###\s/, '');
                    }
                    else if (/^[-*]\s/.test(t)) {
                        typ = 'bullet';
                        t = t.replace(/^[-*]\s/, '');
                    }
                    else if (/^\d+\.\s/.test(t)) {
                        typ = 'number';
                        t = t.replace(/^\d+\.\s/, '');
                    }
                    Store.addBlock(App.aktuelleSeite(), typ, { text: t, herkunft: 'ki' });
                });
                App.zeichneSeite();
                UI.toast('In die Seite eingefügt');
            });
            ziel.appendChild(btn);
        }
    };
    const blockAktion = async (art, block) => {
        const b = kiKatalog()?.ausAlt('block', art);
        if (!b)
            return;
        App.kiPanel(true);
        await ausfuehren(b.id, { block,
            ...(b.ziel !== 'seite' && block?.text ? { text: String(block.text), wo: 'Block' } : {}) });
    };
    const protokoll = [];
    const merkeSchritt = (was, ids) => {
        protokoll.push({ zeit: Store.now(), was, ids });
        if (protokoll.length > 40)
            protokoll.shift();
    };
    const JSON_HOLEN = (text) => {
        const anfang = text.indexOf('{');
        const ende = text.lastIndexOf('}');
        if (anfang < 0 || ende < anfang)
            return null;
        try {
            return JSON.parse(text.slice(anfang, ende + 1));
        }
        catch { }
        try {
            return JSON.parse(text.slice(anfang, ende + 1)
                .replace(/\/\/[^\n]*/g, '').replace(/,\s*([}\]])/g, '$1'));
        }
        catch {
            return null;
        }
    };
    const TYP_KARTE = {
        text: 'text', zahl: 'number', number: 'number', auswahl: 'select', select: 'select',
        mehrfach: 'multi', multi: 'multi', status: 'status', datum: 'date', date: 'date',
        person: 'person', kontrollkästchen: 'checkbox', checkbox: 'checkbox', url: 'url',
        email: 'email', 'e-mail': 'email', telefon: 'phone', phone: 'phone', formel: 'formula',
        formula: 'formula', dateien: 'files', files: 'files',
        sterne: 'sterne', bewertung: 'sterne', rating: 'sterne',
        prozent: 'prozent', fortschritt: 'prozent', progress: 'prozent',
        place: 'place', ort: 'place', adresse: 'place',
        duration: 'duration', dauer: 'duration', zeitspanne: 'duration',
        created: 'created', erstellt: 'created', 'erstellt am': 'created',
        edited: 'edited', 'geändert': 'edited', 'zuletzt geändert': 'edited',
        uid: 'uid', nummer: 'uid', 'laufende nummer': 'uid'
    };
    const datenbankBauenAus = (plan, seiteId) => {
        const schema = {};
        let titelGesetzt = false;
        (plan.spalten || []).slice(0, 12).forEach((sp, i) => {
            const roh = String(sp.typ || 'text').toLowerCase();
            const istTitel = roh.startsWith('titel') || roh === 'title';
            const typ = TYP_KARTE[roh] || (istTitel ? 'title' : 'text');
            const key = istTitel && !titelGesetzt ? 'title' : 'k' + i;
            if (istTitel)
                titelGesetzt = true;
            schema[key] = { name: sp.name || 'Spalte ' + (i + 1), type: istTitel ? 'title' : typ };
            if (['select', 'multi', 'status'].includes(schema[key].type)) {
                const farben = ['gray', 'blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink', 'brown'];
                schema[key].options = (sp.optionen || []).slice(0, 12)
                    .map((n, j) => ({ name: String(n), color: farben[j % farben.length] }));
            }
            if (schema[key].type === 'formula' && sp.formel)
                schema[key].formula = sp.formel;
        });
        if (!titelGesetzt)
            schema.title = { name: 'Name', type: 'title' };
        const { collectionId, block } = Store.addDatabase(seiteId || App.aktuelleSeite(), plan.name || 'Neue Datenbank', schema, plan.layout || 'table');
        if (plan.icon)
            Store.updateCollection(collectionId, { icon: plan.icon });
        const nachName = {};
        Object.entries(schema).forEach(([k, d]) => nachName[d.name.toLowerCase()] = k);
        let zeilen = 0;
        (plan.zeilen || []).slice(0, 30).forEach((z) => {
            const props = {};
            let titelWert = '';
            Object.entries(z).forEach(([n, v]) => {
                const k = nachName[String(n).toLowerCase()];
                if (!k)
                    return;
                if (k === 'title')
                    titelWert = String(v);
                else
                    props[k] = v;
            });
            const r = Store.addRow(collectionId, props);
            Store.updateBlock(r.id, { text: titelWert || 'Ohne Titel' });
            zeilen++;
        });
        return { collectionId, blockId: block.id, schema,
            spalten: Object.keys(schema).length, zeilen };
    };
    const datenbankBauen = async (auftrag) => {
        App.kiPanel(true);
        const seite = App.aktuelleSeite();
        if (!seite) {
            melde('Erst eine Seite öffnen.');
            return;
        }
        schreibe('user', 'Datenbank bauen: ' + auftrag);
        const ziel = schreibe('assistant', '');
        ziel.textContent = 'Entwerfe die Datenbank …';
        const anweisung = 'Du entwirfst eine Datenbank. Antworte AUSSCHLIESSLICH mit JSON, ohne Text davor oder danach, ' +
            'in genau dieser Form:\n' +
            '{"name":"Titel","icon":"📋","spalten":[{"name":"Aufgabe","typ":"titel"},' +
            '{"name":"Status","typ":"auswahl","optionen":["Offen","Erledigt"]},' +
            '{"name":"Fällig","typ":"datum"},{"name":"Aufwand","typ":"zahl"}],' +
            '"zeilen":[{"Aufgabe":"Beispiel","Status":"Offen","Fällig":"2026-08-10","Aufwand":2}]}\n' +
            'Erlaubte Typen: titel, text, zahl, auswahl, mehrfach, status, datum, person, ' +
            'kontrollkästchen, url, email, telefon, dateien. Genau eine Spalte hat den Typ titel. ' +
            'Höchstens zehn Spalten und fünf Beispielzeilen. Alles auf Deutsch.';
        let roh = '';
        try {
            await frage([{ role: 'system', content: anweisung },
                { role: 'user', content: auftrag }], (t) => {
                roh += t;
                ziel.textContent = 'Entwerfe die Datenbank … ' + roh.length + ' Zeichen';
            });
        }
        catch (e) {
            ziel.textContent = '⚠ ' + (e instanceof Error ? e.message : String(e));
            return;
        }
        const plan = JSON_HOLEN(roh);
        if (!plan || !Array.isArray(plan.spalten)) {
            ziel.textContent = 'Das Modell hat kein brauchbares JSON geliefert. Antwort war:\n\n' + roh.slice(0, 600);
            return;
        }
        const gebaut = datenbankBauenAus(plan, seite);
        const block = { id: gebaut.blockId };
        const schema = gebaut.schema;
        merkeSchritt('Datenbank „' + (plan.name || 'Neu') + '" mit ' +
            Object.keys(schema).length + ' Spalten und ' +
            (plan.zeilen || []).length + ' Zeilen', [block.id]);
        App.zeichneSeite();
        ziel.innerHTML = '';
        ziel.textContent = '✓ „' + (plan.name || 'Datenbank') + '" angelegt: ' +
            Object.keys(schema).length + ' Spalten, ' +
            (plan.zeilen || []).length + ' Beispielzeilen.';
        const leiste = document.createElement('div');
        leiste.style.cssText = 'margin-top:8px; display:flex; gap:8px';
        leiste.innerHTML = '<button class="ez-knopf" data-a="weg">Rückgängig</button>' +
            '<button class="ez-knopf" data-a="log">Protokoll</button>';
        leiste.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="weg"]')) {
                Store.trashBlock(block.id);
                Store.purgeBlock(block.id);
                App.zeichneSeite();
                UI.toast('Wieder entfernt');
            }
            if (elVon(e)?.closest('[data-a="log"]'))
                protokollZeigen();
        });
        ziel.appendChild(leiste);
    };
    const seiteBauen = async (auftrag) => {
        App.kiPanel(true);
        const seite = App.aktuelleSeite();
        if (!seite) {
            melde('Erst eine Seite öffnen.');
            return;
        }
        schreibe('user', 'Seite aufbauen: ' + auftrag);
        const ziel = schreibe('assistant', '');
        ziel.textContent = 'Baue die Seite …';
        const anweisung = 'Du baust den Aufbau einer Notizseite. Antworte AUSSCHLIESSLICH mit JSON:\n' +
            '{"titel":"...","icon":"📄","bloecke":[{"typ":"h1","text":"..."},{"typ":"text","text":"..."},' +
            '{"typ":"bullet","text":"..."},{"typ":"todo","text":"..."},{"typ":"callout","text":"..."},' +
            '{"typ":"quote","text":"..."},{"typ":"divider"}]}\n' +
            'Höchstens 25 Blöcke. Alles auf Deutsch.';
        let roh = '';
        try {
            await frage([{ role: 'system', content: anweisung }, { role: 'user', content: auftrag }], (t) => { roh += t; ziel.textContent = 'Baue die Seite … ' + roh.length + ' Zeichen'; });
        }
        catch (e) {
            ziel.textContent = '⚠ ' + (e instanceof Error ? e.message : String(e));
            return;
        }
        const plan = JSON_HOLEN(roh);
        if (!plan || !Array.isArray(plan.bloecke)) {
            ziel.textContent = 'Kein brauchbares JSON. Antwort war:\n\n' + roh.slice(0, 600);
            return;
        }
        const erlaubt = ['h1', 'h2', 'h3', 'text', 'bullet', 'number', 'todo', 'quote', 'callout', 'divider', 'code'];
        const neueIds = [];
        plan.bloecke.slice(0, 30).forEach((b) => {
            const typ = erlaubt.includes(b.typ) ? b.typ : 'text';
            const n = Store.addBlock(seite, typ, { text: b.text || '', herkunft: 'ki' });
            neueIds.push(n.id);
        });
        if (plan.titel && !Store.getBlock(seite).text)
            Store.updateBlock(seite, { text: plan.titel });
        if (plan.icon)
            Store.updateBlock(seite, { icon: plan.icon });
        merkeSchritt('Seitenaufbau mit ' + neueIds.length + ' Blöcken', neueIds);
        App.zeichneSeite();
        App.zeichneBaum();
        ziel.textContent = '✓ ' + neueIds.length + ' Blöcke eingefügt.';
    };
    const protokollZeigen = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(620px,94vw)">' +
                `<div class="fh">✨ Was die KI gebaut hat <em>${protokoll.length}</em>` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res">' +
                (protokoll.length ? protokoll.slice().reverse().map((p, i) => `<div class="komm"><div class="komm-txt">${esc(p.was)}</div>` +
                    `<div class="komm-fuss">${esc(Werkzeuge.zeitKurz(p.zeit))}` +
                    `<button data-weg="${protokoll.length - 1 - i}">Rückgängig</button></div></div>`).join('')
                    : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
                        'Noch nichts. Die KI kann Datenbanken und Seitenaufbauten anlegen — ' +
                        'frag sie im Panel danach.</div>') +
                '</div></div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (!weg)
                return;
            const nr = Number(weg.dataset.weg);
            const p = protokoll[nr];
            if (!p)
                return;
            (p.ids || []).forEach((id) => { Store.trashBlock(id); Store.purgeBlock(id); });
            protokoll.splice(nr, 1);
            o.remove();
            App.zeichneSeite();
            protokollZeigen();
            UI.toast('Zurückgenommen');
        });
    };
    const wikipedia = async (begriff) => {
        const url = 'https://de.wikipedia.org/api/rest_v1/page/summary/' +
            encodeURIComponent(begriff.trim().replace(/\s+/g, '_'));
        const r = await holen(url, { headers: { 'Accept': 'application/json' } }, { versuche: 3, beiWartezeit: (sek, nr) => UI.toast('Wikipedia antwortet nicht — neuer Versuch ' + (nr + 1) + ' in ' + sek + ' s') });
        if (r.status === 404)
            return null;
        if (!r.ok)
            throw new Error('Wikipedia antwortet mit ' + r.status + '. ' + (FEHLERTEXT[r.status] || ''));
        const d = await r.json();
        return { titel: d.title, text: d.extract, link: d.content_urls?.desktop?.page || '' };
    };
    const nachschlagen = async (begriff) => {
        App.kiPanel(true);
        schreibe('user', 'Nachschlagen: ' + begriff);
        const ziel = schreibe('assistant', '');
        ziel.textContent = 'Schaue bei Wikipedia nach …';
        try {
            const t = await wikipedia(begriff);
            if (!t) {
                ziel.textContent = 'Zu „' + begriff + '" gibt es keinen Artikel.';
                return;
            }
            ziel.textContent = t.text;
            const leiste = document.createElement('div');
            leiste.style.cssText = 'margin-top:8px; display:flex; gap:8px; flex-wrap:wrap';
            leiste.innerHTML =
                '<button class="ez-knopf" data-a="ein">In die Seite einfügen</button>' +
                    (t.link ? `<a class="ez-knopf" href="${t.link}" target="_blank" rel="noopener">Artikel öffnen</a>` : '');
            leiste.addEventListener('click', e => {
                if (!elVon(e)?.closest('[data-a="ein"]'))
                    return;
                const seite = App.aktuelleSeite();
                if (!seite)
                    return;
                Store.addBlock(seite, 'quote', { text: t.text, herkunft: 'ki' });
                Store.addBlock(seite, 'text', { text: 'Quelle: [' + t.titel + '](' + t.link + ')',
                    herkunft: 'ki' });
                App.zeichneSeite();
                UI.toast('Eingefügt');
            });
            ziel.appendChild(leiste);
        }
        catch (err) {
            ziel.textContent = '⚠ ' + (err instanceof Error ? err.message : String(err)) +
                ' — ohne Netz geht das Nachschlagen nicht.';
        }
    };
    const frageMitAuswahl = (auswahl) => {
        const ta = document.getElementById('ai-input');
        if (!ta)
            return;
        ta.value = 'Zu dieser Stelle: „' + String(auswahl).slice(0, 500) + '"\n\n';
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
        melde('Markierte Stelle übernommen — schreib dazu, was ich damit tun soll.');
    };
    const datenbankAuswerten = async (coll, view) => {
        App.kiPanel(true);
        const rows = Datenbank.zeilen(coll, view).slice(0, 60);
        const keys = Object.keys(coll.schema);
        const tabelle = [
            keys.map(k => coll.schema[k].name).join(' | '),
            ...rows.map((r) => keys.map(k => Formula.anzeige(Datenbank.wert(r, k, coll))).join(' | '))
        ].join('\n');
        await senden(`Werte diese Tabelle aus der Datenbank "${coll.name}" aus. ` +
            `Nenne drei Muster, die dir auffallen, und einen konkreten Verbesserungsvorschlag.\n\n` +
            tabelle.slice(0, 6000), false);
    };
    const kiKatalog = () => (typeof Register !== 'undefined' && Register.ki) ? Register.ki : null;
    const SCHREIB_BEFEHLE = (kiKatalog()?.alle() || [])
        .filter((b) => b.art === 'auftrag' && b.gruppe === 'Schreiben und bearbeiten');
    const markierung = () => {
        const sel = getSelection();
        const text = String(sel || '').trim();
        if (!sel || text.length <= 3 || !sel.rangeCount)
            return null;
        const knoten = sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement;
        if (knoten?.closest('#ai'))
            return null;
        const blk = knoten?.closest('.blk');
        return { text, bereich: sel.getRangeAt(0).cloneRange(), bid: blk?.dataset.bid || '' };
    };
    const eingabe = (befehl, opt) => {
        if (opt.text && opt.text.trim())
            return { text: opt.text.trim(), wo: opt.wo || 'Markierung', mark: opt.mark || null };
        const mark = opt.mark || markierung();
        if (mark)
            return { text: mark.text, wo: 'Markierung', mark };
        if (opt.block && befehl.ziel !== 'seite' && String(opt.block.text || '').trim())
            return { text: String(opt.block.text), wo: 'Block', mark: null };
        return { text: seitenKontext(), wo: 'ganze Seite', mark: null };
    };
    const ausfuehren = async (id, opt = {}) => {
        const b = kiKatalog()?.finde(id);
        if (!b)
            return;
        if (b.art === 'werkzeug') {
            await werkzeugAus(b.id);
            return;
        }
        let auftrag = opt.auftrag || kiKatalog().auftrag(b.id);
        if (b.frage && !opt.auftrag) {
            const antwort = await UI.frage(b.frage, b.vorgabe || '');
            if (!antwort)
                return;
            auftrag = kiKatalog().auftrag(b.id, { sprache: antwort });
        }
        await schreibLauf({ ...b, ...(opt.name ? { name: opt.name } : {}), ...(opt.icon ? { icon: opt.icon } : {}) }, auftrag, opt);
    };
    const werkzeugAus = async (id) => {
        const b = kiKatalog()?.finde(id);
        if (!b)
            return;
        if (id === 'protokoll') {
            protokollZeigen();
            return;
        }
        let vorschlag = b.vorgabe || '';
        if (id === 'nachschlagen')
            vorschlag = (markierung()?.text || '') || (Store.getBlock(App.aktuelleSeite())?.text || '');
        const antwort = await UI.frage(b.frage || b.name, vorschlag);
        if (!antwort)
            return;
        if (id === 'datenbank')
            datenbankBauen(antwort);
        if (id === 'seite')
            seiteBauen(antwort);
        if (id === 'nachschlagen')
            nachschlagen(antwort);
    };
    const faehigkeitAusfuehren = async (f, opt = {}) => {
        const b = kiKatalog()?.ausAlt('faehig', f.id);
        const start = FAEHIG_START.find(x => x.id === f.id);
        const eigeneZeile = !!f.auftrag && !!start && f.auftrag !== start.auftrag;
        if (b) {
            await ausfuehren(b.id, { ...opt, name: f.name, icon: f.icon || b.icon,
                ...(eigeneZeile ? { auftrag: f.auftrag } : {}) });
            return;
        }
        await schreibLauf({ id: f.id, name: f.name, icon: f.icon || '🧩', ziel: 'markierung', ausgabe: 'ersetzen' }, f.auftrag, opt);
    };
    const rechteckVon = (anker) => {
        if (anker && typeof anker.getBoundingClientRect === 'function')
            return anker.getBoundingClientRect();
        if (anker && typeof anker.left === 'number')
            return { left: anker.left, top: anker.top, bottom: anker.bottom ?? anker.top };
        return { left: innerWidth / 2 - 130, top: 160, bottom: 120 };
    };
    const amKnopf = (anker, m) => {
        if (!(anker instanceof HTMLElement))
            return;
        anker.setAttribute('aria-expanded', 'true');
        const w = new MutationObserver(() => {
            if (m.isConnected)
                return;
            w.disconnect();
            anker.setAttribute('aria-expanded', 'false');
            const a = document.activeElement;
            if (anker.isConnected && (!a || a === document.body || !a.isConnected))
                anker.focus({ preventScroll: true });
        });
        w.observe(document.body, { childList: true });
    };
    const befehlsMenue = (anker, opt = {}) => {
        const r = rechteckVon(anker);
        const mark = opt.text ? null : markierung();
        const liste = faehigkeiten();
        const katalogVon = (f) => kiKatalog()?.ausAlt('faehig', f.id);
        const verdeckt = new Set(liste.map((f) => katalogVon(f)?.id).filter(Boolean));
        const befehle = (kiKatalog()?.alle() || []).filter((b) => !verdeckt.has(b.id));
        const zeile = (b) => `<button data-sb="${esc(b.id)}"><span class="mi">${b.icon}</span>${esc(b.name)}</button>`;
        const fHtml = '<div class="grp">Fähigkeiten</div>' + liste.map((f) => `<button data-f="${esc(f.id)}"${katalogVon(f) ? ` data-sb="${esc(katalogVon(f).id)}"` : ''}>` +
            `<span class="mi">${esc(f.icon || '🧩')}</span>${esc(f.name)}</button>`).join('');
        const sHtml = '<div class="grp">Schreiben und bearbeiten</div>' +
            befehle.filter((b) => b.art === 'auftrag').map(zeile).join('');
        const bHtml = (opt.text || opt.block) ? '' : '<div class="grp">Bauen und nachschlagen</div>' +
            befehle.filter((b) => b.art === 'werkzeug').map(zeile).join('');
        const vorn = opt.text
            ? '<button data-k="fragen"><span class="mi">💬</span>Zu dieser Stelle fragen</button>' : '';
        const m = UI.menuMitSuche(vorn + (opt.zuerst === 'faehig' ? fHtml + sHtml : sHtml + fHtml) + bHtml +
            '<hr><button data-f="__neu"><span class="mi">＋</span>Fähigkeit hinzufügen</button>' +
            '<button data-f="__verw"><span class="mi">⚙</span>Fähigkeiten verwalten</button>', r.left - 40, Math.max(12, r.top - 300), { platzhalter: 'Befehl oder Fähigkeit suchen …', titel: 'KI-Befehle',
            kopf: '<div class="grp">KI-Befehle</div>',
            fuss: 'Im Chat auch mit <b>@</b> vor dem Namen aufrufbar.',
            ...(anker instanceof HTMLElement ? { anker } : {}) });
        amKnopf(anker, m);
        m.addEventListener('click', async (e) => {
            const k = elVon(e)?.closest('[data-k], [data-sb], [data-f]');
            if (!k)
                return;
            m.remove();
            if (k.dataset.k === 'fragen') {
                App.kiPanel(true);
                frageMitAuswahl(opt.text);
                return;
            }
            if (k.dataset.f === '__neu') {
                faehigkeitBearbeiten();
                return;
            }
            if (k.dataset.f === '__verw') {
                faehigkeitenVerwalten();
                return;
            }
            const lauf = { ...(opt.text ? { text: opt.text, wo: 'Markierung' } : {}),
                ...(opt.block ? { block: opt.block } : {}), mark };
            const f = k.dataset.f ? liste.find((x) => x.id === k.dataset.f) : null;
            if (f) {
                await faehigkeitAusfuehren(f, lauf);
                return;
            }
            if (k.dataset.sb)
                await ausfuehren(k.dataset.sb, lauf);
        });
        return m;
    };
    const schreibMenue = (anker2) => befehlsMenue(anker2, { zuerst: 'schreiben' });
    const zeigeAktivitaet = (ziel) => {
        const status = document.createElement('div');
        status.className = 'ki-aktivitaet';
        status.setAttribute('role', 'status');
        status.append(Zustand.aktivitaet('ki'), document.createTextNode('KI arbeitet …'));
        ziel.before(status);
        return status;
    };
    const alsKarteikarten = (text) => {
        const seite = App.aktuelleSeite();
        const karten = String(text || '').split('\n').map(z => z.replace(/^[-*•\d.\s]+/, '').trim())
            .filter(z => /\S\s*::\s*\S/.test(z));
        karten.forEach(z => Store.addBlock(seite, 'flashcard', { text: z, herkunft: 'ki' }));
        if (karten.length) {
            App.zeichneSeite();
            UI.toast(karten.length + ' Karteikarten eingefügt');
        }
        else
            UI.toast('In der Antwort steht keine Zeile „Frage :: Antwort"');
        return karten.length;
    };
    const schreibLauf = async (befehl, auftrag, opt = {}) => {
        const quelle = eingabe(befehl, opt);
        if (!quelle.text.trim()) {
            UI.toast('Es gibt noch keinen Text.');
            return;
        }
        App.kiPanel(true);
        schreibe('user', (befehl.icon ? befehl.icon + ' ' : '') + befehl.name + ' (' + quelle.wo + ')');
        const ziel = schreibe('assistant', '');
        ziel.textContent = '…';
        const system = SYSTEM + '\n\n' + auftrag +
            '\n\nGib NUR den fertigen Text zurück, ohne Einleitung, ohne Anführungszeichen.' +
            (Store.getMeta('ki:persoenlich', '')
                ? '\n\nDauerhafte Anweisungen: ' + Store.getMeta('ki:persoenlich', '') : '');
        let antwort = '';
        const aktivitaet = zeigeAktivitaet(ziel);
        ziel.classList.add('ki-schreibt');
        try {
            await frage([{ role: 'system', content: system },
                { role: 'user', content: quelle.text.slice(0, 9000) }], (t) => {
                antwort += t;
                ziel.textContent = antwort;
                const kasten2 = document.getElementById('chat');
                if (kasten2)
                    kasten2.scrollTop = 1e9;
            });
        }
        catch (e) {
            ziel.textContent = '⚠ ' + (e instanceof Error ? e.message : String(e));
            return;
        }
        finally {
            ziel.classList.remove('ki-schreibt');
            aktivitaet.remove();
        }
        const ausgabe = befehl.ausgabe || 'ersetzen';
        const ersetzbar = ausgabe === 'ersetzen' && zustand.modus !== 'fragen' &&
            (quelle.wo === 'Markierung' || quelle.wo === 'Block') && (quelle.wo !== 'Block' || !!opt.block);
        const leiste = document.createElement('div');
        leiste.className = 'ki-antwortknoepfe';
        leiste.innerHTML =
            (ersetzbar ? `<button data-a="ersetzen">${quelle.wo === 'Block' ? 'Block ersetzen' : 'Markierung ersetzen'}</button>` : '') +
                (ausgabe === 'karteikarten'
                    ? '<button data-a="karteikarten">Als Karteikarten einfügen</button>'
                    : '<button data-a="darunter">Darunter einfügen</button>') +
                '<button data-a="kopieren">Kopieren</button>' +
                '<button data-a="nochmal">Noch einmal</button>';
        leiste.addEventListener('click', async (e) => {
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            if (b.dataset.a === 'kopieren') {
                Ablage.kopiereJetzt(antwort, 'Kopiert');
            }
            if (b.dataset.a === 'nochmal') {
                schreibLauf(befehl, auftrag, opt);
            }
            if (b.dataset.a === 'darunter') {
                alsBloeckeEinfuegen(antwort);
            }
            if (b.dataset.a === 'karteikarten') {
                alsKarteikarten(antwort);
            }
            if (b.dataset.a === 'ersetzen')
                ersetzen(antwort, quelle, opt);
        });
        ziel.appendChild(leiste);
    };
    const ersetzen = (antwort, quelle, opt) => {
        if (quelle.wo === 'Block' && opt.block?.id) {
            Store.updateBlock(opt.block.id, { text: antwort });
            App.zeichneSeite();
            UI.toast('Ersetzt');
            return;
        }
        const mark = quelle.mark;
        const bl = mark?.bid ? Store.getBlock(mark.bid) : null;
        const alt = String(bl?.text || '');
        const i = mark ? alt.indexOf(mark.text) : -1;
        if (bl && mark && i >= 0 && alt.indexOf(mark.text, i + 1) < 0) {
            Store.updateBlock(bl.id, { text: alt.slice(0, i) + antwort + alt.slice(i + mark.text.length) });
            App.zeichneSeite();
            UI.toast('Ersetzt');
            return;
        }
        const sel = getSelection();
        const bereich = sel && sel.rangeCount && String(sel).trim() ? sel.getRangeAt(0)
            : (mark?.bereich && mark.bereich.startContainer.isConnected ? mark.bereich : null);
        if (!bereich) {
            alsBloeckeEinfuegen(antwort);
            return;
        }
        bereich.deleteContents();
        bereich.insertNode(document.createTextNode(antwort));
        const blk = (bereich.startContainer instanceof Element ? bereich.startContainer : bereich.startContainer.parentElement)?.closest?.('.blk');
        const ct = blk?.querySelector('.ct');
        if (blk instanceof HTMLElement && ct && blk.dataset.bid)
            Store.updateBlock(blk.dataset.bid, { text: ct.textContent });
        UI.toast('Ersetzt');
    };
    const atBefehl = (text) => {
        if (!text.startsWith('@'))
            return null;
        const roh = text.slice(1);
        const klein = roh.toLowerCase();
        const kandidaten = [
            ...faehigkeiten().map((f) => ({ name: String(f.name || ''), f })),
            ...(kiKatalog()?.alle() || []).filter((b) => b.art === 'auftrag').map((b) => ({ name: b.name, b }))
        ].filter(k => k.name && klein.startsWith(k.name.toLowerCase()) &&
            (roh.length === k.name.length || /\s/.test(roh.charAt(k.name.length))));
        if (!kandidaten.length)
            return null;
        kandidaten.sort((a, b) => b.name.length - a.name.length);
        const k = kandidaten[0];
        return { ...(k.f ? { f: k.f } : {}), ...(k.b ? { b: k.b } : {}), rest: roh.slice(k.name.length).trim() };
    };
    const alsBloeckeEinfuegen = (text) => {
        const zeilen = String(text || '').split('\n');
        const seite = App.aktuelleSeite();
        let tabelle = null;
        const tabelleAbschliessen = () => {
            if (!tabelle)
                return;
            Store.addBlock(seite, 'table', { rows: tabelle.rows, kopfZeile: true, herkunft: 'ki' });
            tabelle = null;
        };
        zeilen.forEach(roh => {
            const z = roh.trim();
            if (!z) {
                tabelleAbschliessen();
                return;
            }
            if (/^\|.*\|$/.test(z)) {
                const zellen = z.split('|').slice(1, -1).map(x => x.trim());
                if (zellen.every(c => /^:?-{2,}:?$/.test(c)))
                    return;
                if (!tabelle) {
                    tabelle = { rows: [] };
                }
                tabelle.rows.push(zellen);
                return;
            }
            tabelleAbschliessen();
            let typ = 'text', t = z;
            if (/^#{1}\s/.test(t)) {
                typ = 'h1';
                t = t.replace(/^#\s/, '');
            }
            else if (/^#{2}\s/.test(t)) {
                typ = 'h2';
                t = t.replace(/^##\s/, '');
            }
            else if (/^#{3}\s/.test(t)) {
                typ = 'h3';
                t = t.replace(/^###\s/, '');
            }
            else if (/^[-*•]\s/.test(t)) {
                typ = 'bullet';
                t = t.replace(/^[-*•]\s/, '');
            }
            else if (/^\d+\.\s/.test(t)) {
                typ = 'number';
                t = t.replace(/^\d+\.\s/, '');
            }
            else if (/^>\s/.test(t)) {
                typ = 'quote';
                t = t.replace(/^>\s/, '');
            }
            else if (/^\[[ x]\]\s/i.test(t)) {
                typ = 'todo';
                t = t.replace(/^\[[ x]\]\s/i, '');
            }
            Store.addBlock(seite, typ, { text: t, herkunft: 'ki' });
        });
        tabelleAbschliessen();
        App.zeichneSeite();
        UI.toast('In die Seite eingefügt');
    };
    const GESICHTER = ['✨', '🦉', '🐤', '🦊', '🐙', '🧠', '🤖', '🌱', '🔭', '📎', '🧭', '🪄'];
    const persona = () => Store.getMeta('kiPersona', { name: 'KI', gesicht: '✨' });
    const personalisieren = () => {
        const p = persona();
        const o = document.createElement('div');
        o.className = 'overlay';
        const zeichne = () => {
            o.innerHTML =
                '<div class="finder we-panel">' +
                    '<div class="fh">KI personalisieren<button class="icon-btn" data-a="zu">✕</button></div>' +
                    `<div class="pers-kopf"><div class="pers-gross">${p.gesicht}</div>` +
                    `<input id="pers-name" value="${esc(p.name)}" placeholder="Gib einen Namen ein"></div>` +
                    '<div class="pers-gitter">' +
                    GESICHTER.map(g => `<button data-g="${g}" class="${g === p.gesicht ? 'on' : ''}">${g}</button>`).join('') +
                    '</div>' +
                    '<div class="we-text">Anweisungen: was die KI immer beachten soll.</div>' +
                    `<div class="pers-anw"><textarea id="pers-anw" rows="3" ` +
                    `placeholder="Zum Beispiel: Antworte immer auf Deutsch und knapp.">` +
                    `${esc(Store.getMeta('ki:persoenlich', ''))}</textarea></div>` +
                    '<div class="we-fuss"><button class="we-knopf" data-a="ok">Übernehmen</button></div>' +
                    '</div>';
        };
        zeichne();
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const g = elVon(e)?.closest('[data-g]');
            const namensFeld = () => o.querySelector('#pers-name');
            const anwFeld = () => o.querySelector('#pers-anw');
            if (g) {
                p.gesicht = g.dataset.g;
                const n = namensFeld()?.value ?? '';
                const a = anwFeld()?.value ?? '';
                zeichne();
                const nf = namensFeld(), af = anwFeld();
                if (nf)
                    nf.value = n;
                if (af)
                    af.value = a;
                return;
            }
            if (elVon(e)?.closest('[data-a="ok"]')) {
                p.name = (namensFeld()?.value ?? '').trim() || 'KI';
                Store.setMeta('kiPersona', p);
                Store.setMeta('ki:persoenlich', (anwFeld()?.value ?? '').trim());
                o.remove();
                const kopf = document.querySelector('.ai-head b');
                if (kopf)
                    kopf.textContent = p.gesicht + ' ' + p.name;
                App.zeichneBaum();
                UI.toast('Gemerkt: ' + p.gesicht + ' ' + p.name);
            }
        });
    };
    const faehigkeitenMenue = (anker) => befehlsMenue(anker, { zuerst: 'faehig' });
    const faehigkeitBearbeiten = async (vorhanden) => {
        const name = await UI.frage('Wie heisst die Fähigkeit?', vorhanden ? vorhanden.name : '');
        if (!name)
            return;
        const auftrag = await UI.frage('Was soll die KI dabei tun?', vorhanden ? vorhanden.auftrag : 'Fasse den markierten Text in drei Sätzen zusammen.');
        if (!auftrag)
            return;
        const icon = await UI.frage('Ein Zeichen dafür', vorhanden ? vorhanden.icon : '🧩');
        faehigkeitSichern({ id: vorhanden ? vorhanden.id : Store.uid().slice(0, 6),
            name, auftrag, icon: icon || '🧩' });
        UI.toast('Fähigkeit gemerkt: ' + name);
    };
    const faehigkeitenVerwalten = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        const zeichne = () => {
            const liste = faehigkeiten();
            o.innerHTML =
                '<div class="finder we-panel">' +
                    `<div class="fh">Fähigkeiten <em>${liste.length}</em>` +
                    '<button class="icon-btn" data-a="zu" aria-label="Schliessen">✕</button></div>' +
                    '<div class="we-text">Fähigkeiten sind Aufgaben, die die KI kann. Du rufst ' +
                    'sie im Chat mit <b>@</b> vor dem Namen auf oder über das Befehlsmenü.</div>' +
                    '<div class="we-liste">' +
                    liste.map((f) => '<div class="we-zeile">' +
                        `<button class="we-zeile-name" data-b="${esc(f.id)}"><span>${esc(f.icon || '🧩')}</span>${esc(f.name)}</button>` +
                        `<button class="we-zeile-weg" data-w="${esc(f.id)}" data-loeschknopf="Löschen" ` +
                        `aria-label="Fähigkeit „${esc(f.name)}“ löschen" title="Löschen">🗑</button></div>`).join('') +
                    '</div>' +
                    '<div class="we-fuss"><button class="we-knopf" data-a="neu">Fähigkeit hinzufügen</button></div>' +
                    '</div>';
        };
        zeichne();
        document.body.appendChild(o);
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const w = elVon(e)?.closest('[data-w]');
            if (w) {
                faehigkeitLoeschen(w.dataset.w);
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="neu"]')) {
                await faehigkeitBearbeiten();
                zeichne();
                return;
            }
            const b = elVon(e)?.closest('[data-b]');
            if (b) {
                await faehigkeitBearbeiten(faehigkeiten().find((f) => f.id === b.dataset.b));
                zeichne();
            }
        });
    };
    let hoert = null;
    const diktat = (feld) => {
        const SR = window
            .SpeechRecognition ||
            window.webkitSpeechRecognition;
        if (!SR) {
            UI.toast('Dieser Browser kann nicht zuhören. Safari und Chrome können es.');
            return;
        }
        if (hoert) {
            hoert.stop();
            hoert = null;
            document.getElementById('ai-diktat')?.classList.remove('an');
            return;
        }
        hoert = new SR();
        hoert.lang = 'de-DE';
        hoert.interimResults = true;
        hoert.continuous = true;
        let fest = feld.value;
        hoert.addEventListener('result', (e) => {
            let zwischen = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal)
                    fest += t;
                else
                    zwischen += t;
            }
            feld.value = (fest + zwischen).trim();
            feld.dispatchEvent(new Event('input'));
        });
        hoert.addEventListener('end', () => {
            hoert = null;
            document.getElementById('ai-diktat')?.classList.remove('an');
        });
        hoert.start();
        document.getElementById('ai-diktat')?.classList.add('an');
        UI.toast('Ich höre zu — nochmal tippen beendet es');
    };
    const chatBaum = (ziel) => {
        chatsGruppiert().forEach(([name, chats]) => {
            const k = document.createElement('div');
            k.className = 'side-section';
            k.innerHTML = `<span>${esc(name)}</span>`;
            if (name === 'Heute' || name === 'Angeheftet') {
                const plus = document.createElement('button');
                plus.textContent = '+';
                plus.title = 'Neuer Chat';
                plus.addEventListener('click', neuerChat);
                k.appendChild(plus);
            }
            ziel.appendChild(k);
            const liste = document.createElement('div');
            liste.className = 'wz-block';
            const zeichen = (id, gr = 15) => {
                try {
                    return Register.symbole.alsSvg(id, gr) || '';
                }
                catch {
                    return '';
                }
            };
            liste.innerHTML = chats.map((c) => `<button class="side-item ki-chat${c.id === zustand.chatId ? ' on' : ''}" data-c="${c.id}">` +
                `<span>${zeichen('comment')}</span><span class="kc-txt">${esc(c.titel)}` +
                `<em class="kc-wann">${esc(wieLange(c.wann))}</em></span>` +
                `<span class="ki-pin${c.angeheftet ? ' on' : ''}" data-pin="${c.id}" ` +
                `title="${c.angeheftet ? 'Nicht mehr anheften' : 'Anheften'}">` +
                `${zeichen('star', 13)}</span>` +
                `<span class="ki-weg" data-weg="${c.id}" data-loeschknopf title="Chat löschen">` +
                `${zeichen('close', 13)}</span></button>`).join('');
            liste.addEventListener('click', e => {
                const pin = elVon(e)?.closest('[data-pin]');
                if (pin) {
                    e.stopPropagation();
                    chatAnheften(pin.dataset.pin);
                    return;
                }
                const weg = elVon(e)?.closest('[data-weg]');
                if (weg) {
                    e.stopPropagation();
                    chatLoeschen(weg.dataset.weg);
                    return;
                }
                const b = elVon(e)?.closest('[data-c]');
                if (b)
                    chatOeffnen(b.dataset.c);
            });
            ziel.appendChild(liste);
        });
    };
    const verlauf = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        const k = document.createElement('div');
        k.className = 'finder';
        k.style.width = 'min(460px,94vw)';
        const kopf = document.createElement('div');
        kopf.className = 'fh';
        const titel = document.createElement('span');
        titel.textContent = 'Unterhaltungen';
        const neu = document.createElement('button');
        neu.className = 'icon-btn';
        neu.type = 'button';
        neu.title = 'Neuer Chat';
        neu.setAttribute('aria-label', 'Neuer Chat');
        neu.textContent = '+';
        neu.addEventListener('click', () => { o.remove(); neuerChat(); });
        const zu = document.createElement('button');
        zu.className = 'icon-btn';
        zu.type = 'button';
        zu.title = 'Schliessen';
        zu.setAttribute('aria-label', 'Schliessen');
        zu.textContent = '\u2715';
        zu.addEventListener('click', () => o.remove());
        kopf.append(titel, neu, zu);
        k.appendChild(kopf);
        const koerper = document.createElement('div');
        koerper.className = 'ki-verlauf';
        chatBaum(koerper);
        if (!chatsGruppiert().length) {
            const leer = document.createElement('div');
            leer.className = 'leer';
            leer.textContent = 'Noch keine Unterhaltung. Frag die KI etwas — ' +
                'was du fragst, bleibt auf diesem Gerät.';
            koerper.appendChild(leer);
        }
        k.appendChild(koerper);
        koerper.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-c]') &&
                !elVon(e)?.closest('[data-pin]') &&
                !elVon(e)?.closest('[data-weg]'))
                o.remove();
        });
        o.appendChild(k);
        o.addEventListener('click', e => { if (e.target === o)
            o.remove(); });
        document.body.appendChild(o);
    };
    const seitenleiste = (baum) => {
        const p = persona();
        const kopf = document.createElement('div');
        kopf.className = 'side-section';
        kopf.innerHTML = '<span>KI</span>';
        baum.appendChild(kopf);
        const agenten = document.createElement('div');
        agenten.className = 'ki-agenten';
        agenten.innerHTML =
            `<button data-a="ki"><span class="ka-bild">${p.gesicht}</span><b>${esc(p.name)}</b></button>` +
                Agent.eigene().slice(0, 3).map((a) => `<button data-a="${esc(a.id)}"><span class="ka-bild">${a.icon || '🤖'}</span>` +
                    `<b>${esc(a.name)}</b></button>`).join('') +
                '<button data-a="neu"><span class="ka-bild ka-neu">＋</span><b>Neuer Agent</b></button>';
        agenten.addEventListener('click', e => {
            const b = elVon(e)?.closest('[data-a]');
            if (!b)
                return;
            if (b.dataset.a === 'ki') {
                App.kiPanel(true);
                return;
            }
            if (b.dataset.a === 'neu') {
                Agent.eigenerDialog();
                return;
            }
            Agent.panel(b.dataset.a);
        });
        baum.appendChild(agenten);
        chatBaum(baum);
        if (!chatsGruppiert().length) {
            const leer = document.createElement('div');
            leer.innerHTML = Hinweis.leer({
                zeichen: '💬',
                gross: 'Noch keine Unterhaltung',
                klein: 'Frage die KI nach einer Formel, lass sie eine Seite ' +
                    'zusammenfassen oder ein Ziel verfolgen. Alles bleibt auf ' +
                    'diesem Gerät.',
                handlung: 'Neuen Chat beginnen',
                daten: 'data-a="neuerchat"'
            });
            leer.addEventListener('click', e => {
                if (elVon(e)?.closest('[data-a="neuerchat"]'))
                    neuerChat();
            });
            baum.appendChild(leer);
        }
    };
    const erwaehnenMenue = (ta, anker, mitFaehig, atStelle = -1) => {
        const r = rechteckVon(anker);
        const seiten = Object.values(Store.cache.blocks)
            .filter(x => x.type === 'page' && x.alive !== false && x.parentTable !== 'collection')
            .sort((a, b) => String(b.edited || '').localeCompare(String(a.edited || ''))).slice(0, 60);
        const fRows = mitFaehig
            ? '<div class="grp">Fähigkeiten</div>' + faehigkeiten().map((f) => `<button data-f="${esc(f.id)}"><span class="mi">${esc(f.icon || '🧩')}</span>${esc(f.name)}</button>`).join('')
            : '';
        const m = UI.menuMitSuche(fRows + '<div class="grp">Seiten</div>' +
            seiten.map(p => `<button data-s="${esc(p.id)}">${esc(p.icon || '📄')} ${esc(p.text || 'Ohne Titel')}</button>`).join(''), r.left, Math.max(12, r.top - 300), { platzhalter: mitFaehig ? 'Fähigkeit oder Seite suchen …' : 'Seite suchen …',
            titel: mitFaehig ? 'Erwähnen' : 'Seite erwähnen',
            kopf: '<div class="grp">' + (mitFaehig ? 'Erwähnen' : 'Seite erwähnen') + '</div>' });
        const ohneAt = () => atStelle >= 0 && ta.value.charAt(atStelle) === '@'
            ? ta.value.slice(0, atStelle) + ta.value.slice(atStelle + 1) : ta.value;
        m.addEventListener('click', ev2 => {
            const s = elVon(ev2)?.closest('[data-s], [data-f]');
            if (!s)
                return;
            m.remove();
            if (s.dataset.f) {
                const f = faehigkeiten().find((x) => x.id === s.dataset.f);
                if (f)
                    ta.value = '@' + f.name + ' ' + ohneAt().trimStart();
            }
            else {
                const p = Store.getBlock(s.dataset.s);
                const titel = (p?.text || 'Seite');
                if (p)
                    erwaehnt.set(p.id, titel);
                const rest = ohneAt();
                const vor = atStelle >= 0 ? rest.slice(0, atStelle) : rest;
                const nach = atStelle >= 0 ? rest.slice(atStelle) : '';
                ta.value = vor + (vor && !/\s$/.test(vor) ? ' ' : '') + '@' + titel + (nach.startsWith(' ') ? '' : ' ') + nach;
            }
            ta.dispatchEvent(new Event('input'));
            ta.focus();
            ta.setSelectionRange(ta.value.length, ta.value.length);
        });
        return m;
    };
    const quellenMenue = (anker) => {
        const r = anker.getBoundingClientRect();
        const nur = Kontext.nurQuellen();
        const m = UI.menu('<div class="grp">Quellen für die nächste Frage</div>' +
            `<div class="ki-quellschalter">${quellenKnoepfe()}</div>` +
            `<button data-y="nur" aria-pressed="${nur}" title="Findet sich in deinen Quellen nichts, wird das Modell nicht gefragt">` +
            '<span class="mi">◎</span>Nur aus meinen Quellen' +
            (nur ? '<span class="ms">✓</span>' : '') + '</button>' +
            '<hr><button data-y="einst"><span class="mi">⚙</span>Alle KI-Einstellungen</button>', r.left, Math.max(12, r.top - 300), { anker, titel: 'Quellen' });
        const leiste = m.querySelector('.ki-quellschalter');
        if (leiste)
            quellenBinden(leiste);
        amKnopf(anker, m);
        m.addEventListener('click', ev => {
            const b = elVon(ev)?.closest('[data-y]');
            if (!b)
                return;
            if (b.dataset.y === 'nur') {
                const an = !Kontext.nurQuellen();
                Kontext.nurQuellenSetzen(an);
                b.setAttribute('aria-pressed', String(an));
                b.querySelector('.ms')?.remove();
                if (an)
                    b.insertAdjacentHTML('beforeend', '<span class="ms">✓</span>');
                UI.toast(an ? 'Nur aus meinen Quellen: an' : 'Nur aus meinen Quellen: aus');
            }
            if (b.dataset.y === 'einst') {
                m.remove();
                App.einstellungen('ki');
            }
        });
        return m;
    };
    const mehrMenue = (anker) => {
        const r = anker.getBoundingClientRect();
        const mcp = (Store.getMeta('mcp:server', []) || []).length;
        const m = UI.menu('<button id="ai-agent" data-y="agent"><span class="mi">🤖</span>Agent<span class="sub">Mehrstufige Aufgaben</span></button>' +
            '<button id="ai-meeting" data-y="meeting"><span class="mi">🎙</span>Besprechung<span class="sub">Aufnehmen, mitschreiben, auswerten</span></button>' +
            '<button id="ai-log" data-y="log"><span class="mi">🕘</span>Protokoll<span class="sub">Was die KI gebaut hat</span></button>' +
            '<hr>' +
            '<button data-y="verw"><span class="mi">🧩</span>Fähigkeiten verwalten</button>' +
            '<button data-y="pers"><span class="mi">🎨</span>Personalisieren</button>' +
            `<button data-y="mcp"><span class="mi">⇄</span>MCP-Server<span class="ms">${mcp}</span></button>` +
            '<button data-y="einst"><span class="mi">⚙</span>KI-Einstellungen</button>', Math.max(12, r.right - 260), r.bottom + 6, { anker, titel: 'Mehr KI-Funktionen', tropfen: [
                { id: 'agent', name: 'Agent', zeichen: 'robot', ziel: '[data-y="agent"]' },
                { id: 'meeting', name: 'Besprechung', zeichen: 'mic', ziel: '[data-y="meeting"]' },
                { id: 'log', name: 'Protokoll', zeichen: 'history', ziel: '[data-y="log"]' }
            ] });
        amKnopf(anker, m);
        m.addEventListener('click', ev => {
            const b = elVon(ev)?.closest('button[data-y]');
            if (!b)
                return;
            m.remove();
            const y = b.dataset.y;
            if (y === 'agent')
                Agent.panel();
            if (y === 'meeting')
                Meeting.panel();
            if (y === 'log')
                protokollZeigen();
            if (y === 'verw')
                faehigkeitenVerwalten();
            if (y === 'pers')
                personalisieren();
            if (y === 'mcp')
                App.einstellungen('mcp');
            if (y === 'einst')
                App.einstellungen('ki');
        });
        return m;
    };
    const bindePanel = () => {
        const ta = document.getElementById('ai-input');
        const chat = document.getElementById('chat');
        if (typeof Register !== 'undefined' && Register.befehle && kiKatalog())
            Register.befehle.meldeLieferant(kiPalette);
        if (typeof Ereignisse !== 'undefined' && typeof ARTEN !== 'undefined')
            Ereignisse.horche(ARTEN.kiQuellenGeaendert, () => quellenAbgleichen());
        quellenSchild();
        if (!ta)
            return;
        ta.addEventListener('keydown', e => {
            const neueZeile = !!Store.getMeta('enterZeile', false);
            const senderTaste = neueZeile
                ? (e.key === 'Enter' && (e.ctrlKey || e.metaKey))
                : (e.key === 'Enter' && !e.shiftKey);
            if (senderTaste) {
                e.preventDefault();
                const t = ta.value;
                ta.value = '';
                ta.style.height = 'auto';
                senden(t);
            }
        });
        ta.addEventListener('input', (e) => {
            ta.style.height = 'auto';
            ta.style.height = Math.min(160, ta.scrollHeight) + 'px';
            if (!(e instanceof InputEvent) || e.data !== '@')
                return;
            const pos = ta.selectionStart ?? ta.value.length;
            if (ta.value.charAt(pos - 1) === '@' && (pos === 1 || /\s/.test(ta.value.charAt(pos - 2))))
                erwaehnenMenue(ta, ta, true, pos - 1);
        });
        document.querySelectorAll('.ai-start [data-ki]').forEach(b => {
            let gemerkt = null;
            b.addEventListener('pointerdown', () => { gemerkt = markierung(); });
            b.addEventListener('click', () => {
                const mark = gemerkt || markierung();
                gemerkt = null;
                void ausfuehren(b.dataset.ki || '', { mark });
            });
        });
        const modusKnopf = document.getElementById('ai-modus');
        const modusZeigen = () => {
            if (modusKnopf)
                modusKnopf.textContent = zustand.modus === 'fragen' ? 'Fragen' : 'Standard';
        };
        modusZeigen();
        const modusWechseln = () => {
            zustand.modus = zustand.modus === 'fragen' ? 'standard' : 'fragen';
            modusZeigen();
            UI.toast(zustand.modus === 'fragen'
                ? 'Fragen: die KI antwortet nur, sie ändert nichts'
                : 'Standard: die KI darf suchen, bauen und ändern');
        };
        modusKnopf?.addEventListener('click', (e) => {
            const knopf = e.currentTarget;
            if (!(knopf instanceof HTMLElement))
                return;
            const r = knopf.getBoundingClientRect();
            const m = UI.menu(`<button data-m="standard"><span class="mi">✎</span>Standard` +
                '<span class="sub">Kann suchen, bearbeiten und mehr</span>' +
                (zustand.modus === 'standard' ? '<span class="ms">✓</span>' : '') + '</button>' +
                `<button data-m="fragen"><span class="mi">💬</span>Fragen` +
                '<span class="sub">Nur Antworten, keine Änderungen</span>' +
                (zustand.modus === 'fragen' ? '<span class="ms">✓</span>' : '') + '</button>' +
                '<div class="menu-fuss">Tipp: Mit Shift + Tab durch die Modi wechseln</div>', r.left - 120, r.top - 130, { titel: 'Modus' });
            amKnopf(knopf, m);
            m.addEventListener('click', ev => {
                const b = elVon(ev)?.closest('[data-m]');
                if (!b)
                    return;
                zustand.modus = b.dataset.m ?? zustand.modus;
                modusZeigen();
                m.remove();
            });
        });
        ta.addEventListener('keydown', e => {
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                modusWechseln();
            }
        });
        document.getElementById('ai-senden')?.addEventListener('click', () => {
            if (abbrechen())
                return;
            const t = ta.value;
            ta.value = '';
            ta.style.height = 'auto';
            senden(t);
        });
        document.getElementById('ai-plus')?.addEventListener('click', (e) => {
            const knopf = e.currentTarget;
            if (!(knopf instanceof HTMLElement))
                return;
            const r = knopf.getBoundingClientRect();
            const m = UI.menu('<button data-x="datei"><span class="mi">📎</span>Fotos und Dateien hinzufügen</button>' +
                '<button data-x="erwaehnen"><span class="mi">@</span>Seite erwähnen</button>' +
                '<button data-x="bild"><span class="mi">🖼</span>Bild erstellen<span class="ms">neu</span></button>' +
                '<button id="ai-wiki" data-x="wiki"><span class="mi">📖</span>Bei Wikipedia nachschlagen</button>' +
                '<button id="ai-faehig" data-x="befehle"><span class="mi">🧩</span>Befehle und Fähigkeiten …</button>', r.left, r.top - 220, { titel: 'Hinzufügen', anker: knopf });
            amKnopf(knopf, m);
            m.addEventListener('click', async (ev) => {
                const b = elVon(ev)?.closest('[data-x]');
                if (!b)
                    return;
                m.remove();
                if (b.dataset.x === 'datei') {
                    const inp = document.createElement('input');
                    inp.type = 'file';
                    inp.accept = 'image/*,.txt,.md,.csv,.json';
                    inp.addEventListener('change', async () => {
                        const f = inp.files?.[0];
                        if (!f)
                            return;
                        if (/^image\//.test(f.type)) {
                            ta.value += `\n[Bild: ${f.name}]`;
                            UI.toast('Bilder kann nur ein Modell mit Augen lesen');
                            return;
                        }
                        ta.value += '\n\n' + (await f.text()).slice(0, 6000);
                        ta.dispatchEvent(new Event('input'));
                    });
                    inp.click();
                }
                if (b.dataset.x === 'erwaehnen')
                    erwaehnenMenue(ta, knopf, false);
                if (b.dataset.x === 'bild') {
                    const was = await UI.frage('Was soll auf dem Bild sein?', '');
                    if (was)
                        senden('Beschreibe ein Bild zu: ' + was +
                            '. Gib dann eine SVG-Zeichnung dazu aus, die ich einfügen kann.');
                }
                if (b.dataset.x === 'wiki')
                    await werkzeugAus('nachschlagen');
                if (b.dataset.x === 'befehle')
                    befehlsMenue(knopf, { zuerst: 'faehig' });
            });
        });
        document.getElementById('ai-quellen')?.addEventListener('click', (e) => {
            const knopf = e.currentTarget;
            if (knopf instanceof HTMLElement)
                quellenMenue(knopf);
        });
        document.getElementById('ai-mehr')?.addEventListener('click', (e) => {
            const knopf = e.currentTarget;
            if (knopf instanceof HTMLElement)
                mehrMenue(knopf);
        });
        document.getElementById('ai-diktat')?.addEventListener('click', () => diktat(ta));
        if (typeof Funkel !== 'undefined')
            Funkel.alle(document, '.ai-start .ai-quick button');
        document.getElementById('ai-db')?.addEventListener('click', () => { void werkzeugAus('datenbank'); });
        document.getElementById('ai-seite')?.addEventListener('click', () => { void werkzeugAus('seite'); });
        document.getElementById('ai-schreiben')?.addEventListener('click', (e) => schreibMenue(e.currentTarget));
        document.getElementById('ai-verlauf')?.addEventListener('click', () => verlauf());
        document.getElementById('ai-clear')?.addEventListener('click', () => {
            zustand.verlauf = [];
            if (chat)
                chat.innerHTML = '';
            melde(kontextSatz());
        });
        melde('Alles läuft lokal. Kein Text verlässt deinen Rechner.');
    };
    const kiPalette = () => (kiKatalog()?.alle() || []).filter((b) => b.haeufig)
        .map((b) => ({ gruppe: 'KI', titel: b.palette || b.name, tun: () => { void ausfuehren(b.id); } }));
    const sucheOllamaJetzt = async () => {
        if (zustand.bereit || zustand.quelle === 'ollama')
            return;
        if (!(await ollamaPruefen()))
            return;
        zustand.quelle = 'ollama';
        zustand.modell = zustand.ollamaModelle[0]?.id ?? '';
        zustand.bereit = !!zustand.modell;
        if (zustand.bereit)
            status('ok', kurzName(zustand.modell));
        zeichneModellKnopf();
    };
    return { start, bindePanel, sucheOllamaJetzt, senden, abbrechen, sendenKnopf, blockAktion, frageMitAuswahl, wikipedia, nachschlagen,
        ausfuehren, befehlsMenue, kontextSatz,
        datenbankBauen, datenbankBauenAus, seiteBauen, protokollZeigen, protokoll,
        quellenKarte, quellenLeiste, seitenKontext, SYSTEM,
        SCHREIB_BEFEHLE, schreibMenue, schreibLauf, alsBloeckeEinfuegen,
        ANBIETER, anbieter, wolkeFragen, holen, FEHLERTEXT, WIEDERHOLBAR,
        modelleHolen, modelleVon, modellWaehlen, fehlerSatz,
        datenbankAuswerten, frageKurz, zustand, modellMenue,
        seitenleiste, chatBaum, verlauf, neuerChat, chatOeffnen, chatsLesen,
        chatsGruppiert, chatSichern,
        chatAnheften, chatLoeschen, faehigkeiten, faehigkeitSichern, faehigkeitLoeschen,
        faehigkeitenMenue, faehigkeitenVerwalten, personalisieren, persona, diktat, wieLange };
})();
