/* ============================================================================
 * ai.js — Die lokale KI
 * ----------------------------------------------------------------------------
 * Zwei Wege, beide kostenlos, beide lokal. Umschaltbar wie in Notion.
 *
 *   1) OLLAMA        läuft als Programm auf dem Rechner (localhost:11434)
 *                    schneller, deutlich bessere Modelle, braucht einmal
 *                    eine Installation
 *
 *   2) WEBLLM        läuft direkt im Browser über WebGPU
 *                    keine Installation, lädt das Modell einmal herunter
 *                    und behält es im Browser-Cache
 *
 * Kein Text verlässt den Rechner. Es gibt keinen Server, keinen Schlüssel,
 * keine Abrechnung.
 *
 * OLLAMA VORBEREITEN
 *   Damit der Browser Ollama ansprechen darf, muss einmal die Herkunft
 *   erlaubt werden:
 *     Windows : setx OLLAMA_ORIGINS "*"      danach Ollama neu starten
 *     macOS   : launchctl setenv OLLAMA_ORIGINS "*"
 *     Linux   : OLLAMA_ORIGINS=* ollama serve
 * ==========================================================================*/

const KI = (() => {

  const OLLAMA = 'http://localhost:11434';

  /* Die WebLLM-Modelle, die sich für einen Notizen-Assistenten eignen.
   * Klein genug zum Herunterladen, gut genug für Zusammenfassungen. */
  const WEB_MODELLE = [
    { id:'Llama-3.2-1B-Instruct-q4f16_1-MLC',  name:'Llama 3.2 · 1B',   groesse:'~0,8 GB', hinweis:'Am schnellsten' },
    { id:'Llama-3.2-3B-Instruct-q4f16_1-MLC',  name:'Llama 3.2 · 3B',   groesse:'~2,3 GB', hinweis:'Guter Mittelweg' },
    { id:'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',  name:'Qwen 2.5 · 1,5B',  groesse:'~1,1 GB', hinweis:'Stark im Deutschen' },
    { id:'Qwen2.5-3B-Instruct-q4f16_1-MLC',    name:'Qwen 2.5 · 3B',    groesse:'~2,0 GB', hinweis:'Stark im Deutschen' },
    { id:'Phi-3.5-mini-instruct-q4f16_1-MLC',  name:'Phi 3.5 mini',     groesse:'~2,2 GB', hinweis:'Gut beim Strukturieren' },
    { id:'gemma-2-2b-it-q4f16_1-MLC',          name:'Gemma 2 · 2B',     groesse:'~1,6 GB', hinweis:'Kompakt' }
  ];

  /* ------------------------------------------------------------------------
   * WOLKEN-ANBIETER
   * ------------------------------------------------------------------------
   * Alle sprechen dieselbe Sprache wie OpenAI. Der Schlüssel gehört dir und
   * bleibt in diesem Browser — er wird nur an den jeweiligen Anbieter
   * geschickt, an sonst niemanden.
   *
   * „frei" heisst: es gibt ein kostenloses Kontingent ohne Kreditkarte.
   * ----------------------------------------------------------------------*/
  const ANBIETER = [
    { id:'groq',       name:'Groq',        frei:true,
      url:'https://api.groq.com/openai/v1/chat/completions',
      modelle:['llama-3.3-70b-versatile','llama-3.1-8b-instant','gemma2-9b-it'],
      woher:'console.groq.com/keys',
      hinweis:'Kostenloses Kontingent, sehr schnell' },
    { id:'openrouter', name:'OpenRouter',  frei:true,
      url:'https://openrouter.ai/api/v1/chat/completions',
      modelle:['meta-llama/llama-3.3-70b-instruct:free','google/gemma-2-9b-it:free',
               'mistralai/mistral-7b-instruct:free'],
      woher:'openrouter.ai/keys',
      hinweis:'Modelle mit :free kosten nichts' },
    { id:'gemini',     name:'Google Gemini', frei:true,
      url:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      modelle:['gemini-2.0-flash','gemini-2.0-flash-lite'],
      woher:'aistudio.google.com/apikey',
      hinweis:'Kostenloses Kontingent je Tag' },
    { id:'openai',     name:'OpenAI',      frei:false,
      url:'https://api.openai.com/v1/chat/completions',
      modelle:['gpt-4o-mini','gpt-4o'],
      woher:'platform.openai.com/api-keys',
      hinweis:'Kostenpflichtig' },
    { id:'anthropic',  name:'Anthropic',   frei:false,
      url:'https://api.anthropic.com/v1/messages',
      modelle:['claude-3-5-haiku-latest','claude-sonnet-4-5'],
      woher:'console.anthropic.com/settings/keys',
      hinweis:'Kostenpflichtig · eigenes Nachrichtenformat' },
    { id:'eigen',      name:'Eigener Server', frei:true,
      url:'', modelle:[], woher:'',
      hinweis:'Jede Adresse, die wie OpenAI antwortet — auch LM Studio oder llama.cpp' }
  ];

  const anbieter = (id) => ANBIETER.find(a => a.id === id) || ANBIETER[0];
  const schluessel = (id) => Store.getMeta('api:' + id, '');

  /* ========================================================================
   * NETZ MIT WIEDERHOLUNG
   * ------------------------------------------------------------------------
   * Teil 9 der Doku beschreibt, wie ein Client mit Fehlern umgehen soll:
   * 429 und 5xx sind vorübergehend, also nach kurzer Pause noch einmal
   * versuchen und die Pause jedes Mal verdoppeln. Steht im Kopf ein
   * Retry-After, gilt der. 4xx ausser 429 sind endgültig — da hilft kein
   * zweiter Versuch, das muss der Mensch richten.
   * ======================================================================*/
  const WIEDERHOLBAR = [408, 409, 425, 429, 500, 502, 503, 504];

  const schlafen = (ms) => new Promise(r => setTimeout(r, ms));

  /** Was steckt hinter einem Fehlercode? Klartext statt nackter Zahl. */
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

  /**
   * fetch mit Wiederholung. Gibt die Antwort zurück, sobald sie brauchbar ist.
   * @param {object} opt  versuche, basis (ms), beiWartezeit (Rückmeldung)
   */
  const holen = async (url, init = {}, opt = {}) => {
    const versuche = opt.versuche ?? 4;
    const basis    = opt.basis ?? 700;
    let letzter = null;

    for (let i = 0; i < versuche; i++) {
      let r = null;
      try {
        r = await fetch(url, init);
      } catch (e) {
        /* Netz ganz weg — das ist ein Fall für einen zweiten Versuch */
        letzter = e;
        if (init.signal && init.signal.aborted) throw e;
        if (i === versuche - 1) break;
        await schlafen(basis * Math.pow(2, i));
        continue;
      }

      if (r.ok || !WIEDERHOLBAR.includes(r.status)) return r;

      letzter = new Error('HTTP ' + r.status + ' — ' + (FEHLERTEXT[r.status] || 'unbekannter Fehler'));
      if (i === versuche - 1) return r;

      /* Sagt der Anbieter selbst, wie lange gewartet werden soll? */
      const kopfWarte = parseFloat(r.headers.get('retry-after') || '');
      const warte = !isNaN(kopfWarte) && kopfWarte > 0
        ? Math.min(kopfWarte * 1000, 20000)
        : basis * Math.pow(2, i);
      if (opt.beiWartezeit) opt.beiWartezeit(Math.round(warte / 100) / 10, i + 1, r.status);
      await schlafen(warte);
    }
    throw letzter || new Error('Die Anfrage hat nicht geklappt.');
  };

  /**
   * Fragt einen Wolken-Anbieter. Streamt Stück für Stück, damit die Antwort
   * genauso erscheint wie bei den lokalen Modellen.
   */
  const wolkeFragen = async function* (nachrichten, modell) {
    const a = anbieter(zustand.anbieter);
    const key = schluessel(a.id);
    const url = a.id === 'eigen' ? Store.getMeta('api:eigenUrl', '') : a.url;
    if (!url) throw new Error('Für diesen Anbieter fehlt die Adresse.');
    if (!key && a.id !== 'eigen') throw new Error('Es ist noch kein Schlüssel hinterlegt. Einstellungen → Schlüssel.');

    /* Anthropic spricht ein eigenes Format */
    const istAnthropic = a.id === 'anthropic';
    const kopf = { 'Content-Type': 'application/json' };
    if (istAnthropic) {
      kopf['x-api-key'] = key;
      kopf['anthropic-version'] = '2023-06-01';
      kopf['anthropic-dangerous-direct-browser-access'] = 'true';
    } else if (key) {
      kopf['Authorization'] = 'Bearer ' + key;
    }

    const sys = nachrichten.find(m => m.role === 'system');
    const rest = nachrichten.filter(m => m.role !== 'system');
    const koerper = istAnthropic
      ? { model: modell, max_tokens: 2000, stream: true,
          system: sys ? sys.content : undefined, messages: rest }
      : { model: modell, messages: nachrichten, stream: true };

    const r = await holen(url,
      { method: 'POST', headers: kopf, body: JSON.stringify(koerper) },
      { beiWartezeit: (sek, nr, code) =>
          UI.toast(`${a.name}: ${code} — neuer Versuch ${nr + 1} in ${sek} s`) });

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(a.name + ' antwortet mit ' + r.status + '. ' +
        (FEHLERTEXT[r.status] || '') + ' ' + txt.slice(0, 180));
    }

    const leser = r.body.getReader();
    const dec = new TextDecoder();
    let puffer = '';
    while (true) {
      const { done, value } = await leser.read();
      if (done) break;
      puffer += dec.decode(value, { stream: true });
      const zeilen = puffer.split('\n');
      puffer = zeilen.pop();
      for (const z of zeilen) {
        const t = z.trim();
        if (!t.startsWith('data:')) continue;
        const rohdaten = t.slice(5).trim();
        if (rohdaten === '[DONE]') return;
        try {
          const d = JSON.parse(rohdaten);
          const stueck = istAnthropic
            ? (d.delta && d.delta.text) || ''
            : (d.choices && d.choices[0] && d.choices[0].delta && d.choices[0].delta.content) || '';
          if (stueck) yield stueck;
        } catch {}
      }
    }
  };

  const zustand = {
    quelle: 'ollama',      /* 'ollama', 'webllm' oder 'wolke' */
    anbieter: 'groq',
    modell: '',
    bereit: false,
    laedt: false,
    ollamaModelle: [],
    engine: null,          /* die WebLLM-Instanz */
    verlauf: []
  };

  /* ========================================================================
   * OLLAMA
   * ======================================================================*/
  const ollamaPruefen = async () => {
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 1200);
      const r = await fetch(OLLAMA + '/api/tags', { signal: c.signal });
      clearTimeout(t);
      if (!r.ok) return false;
      const d = await r.json();
      zustand.ollamaModelle = (d.models || []).map(m => ({
        id: m.name,
        name: m.name,
        groesse: m.size ? (m.size / 1e9).toFixed(1) + ' GB' : ''
      }));
      return zustand.ollamaModelle.length > 0;
    } catch {
      return false;
    }
  };

  const ollamaFragen = async function* (nachrichten, modell) {
    const r = await fetch(OLLAMA + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modell, messages: nachrichten, stream: true })
    });
    if (!r.ok) throw new Error('Ollama antwortet mit ' + r.status);

    const leser = r.body.getReader();
    const dec = new TextDecoder();
    let rest = '';

    while (true) {
      const { done, value } = await leser.read();
      if (done) break;
      rest += dec.decode(value, { stream: true });
      const zeilen = rest.split('\n');
      rest = zeilen.pop();
      for (const z of zeilen) {
        if (!z.trim()) continue;
        try {
          const j = JSON.parse(z);
          if (j.message && j.message.content) yield j.message.content;
        } catch {}
      }
    }
  };

  /* ========================================================================
   * WEBLLM
   * ======================================================================*/
  let webllmLib = null;

  const webllmLaden = async (modellId, fortschritt) => {
    if (!webllmLib) {
      try {
        webllmLib = await import('https://esm.run/@mlc-ai/web-llm');
      } catch {
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

  const webllmFragen = async function* (nachrichten) {
    const strom = await zustand.engine.chat.completions.create({
      messages: nachrichten, stream: true, temperature: 0.7
    });
    for await (const teil of strom) {
      const t = teil.choices?.[0]?.delta?.content;
      if (t) yield t;
    }
  };

  /* ========================================================================
   * GEMEINSAMER AUFRUF
   * ======================================================================*/

  /**
   * Schickt eine Anfrage an das aktive Modell.
   * @param {Array}  nachrichten  [{role:'user'|'system'|'assistant', content}]
   * @param {Function} beiText    wird für jedes Textstück aufgerufen
   */
  /**
   * Bringt die Nachrichten in die Form, die beide Modelle erwarten:
   * höchstens eine Systemnachricht, und die ganz am Anfang.
   * Ollama ist da nachsichtig, WebLLM nicht — es warnt sonst mit
   * „System prompt should always be the first message in messages".
   */
  const ordne = (nachrichten) => {
    const systeme = nachrichten.filter(m => m.role === 'system').map(m => m.content);
    const rest = nachrichten.filter(m => m.role !== 'system');
    return systeme.length
      ? [{ role: 'system', content: systeme.join('\n\n') }, ...rest]
      : rest;
  };

  const frage = async (nachrichten, beiText) => {
    if (!zustand.modell) throw new Error('Es ist noch kein Modell gewählt.');
    const n = ordne(nachrichten);

    if (zustand.quelle === 'ollama') {
      for await (const t of ollamaFragen(n, zustand.modell)) beiText(t);
      return;
    }

    if (zustand.quelle === 'wolke') {
      for await (const t of wolkeFragen(n, zustand.modell)) beiText(t);
      return;
    }

    if (!zustand.engine) throw new Error('Das Modell ist noch nicht geladen.');
    for await (const t of webllmFragen(n)) beiText(t);
  };

  /** Ein Rundruf ohne Streaming — für kurze Aufgaben. */
  const frageKurz = async (prompt, system) => {
    let out = '';
    const n = [];
    if (system) n.push({ role: 'system', content: system });
    n.push({ role: 'user', content: prompt });
    await frage(n, t => out += t);
    return out.trim();
  };

  /* ========================================================================
   * START
   * ======================================================================*/
  const start = async () => {
    const gemerkt = Store.getMeta('ki', null);

    /* Zuletzt ein Wolken-Modell benutzt und der Schlüssel liegt noch da? */
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

    const da = await ollamaPruefen();
    if (da) {
      zustand.quelle = 'ollama';
      zustand.modell = (gemerkt && gemerkt.quelle === 'ollama' &&
                        zustand.ollamaModelle.some(m => m.id === gemerkt.modell))
        ? gemerkt.modell
        : zustand.ollamaModelle[0].id;
      zustand.bereit = true;
      status('ok', kurzName(zustand.modell));
    } else {
      zustand.quelle = 'webllm';
      zustand.modell = (gemerkt && gemerkt.quelle === 'webllm') ? gemerkt.modell : '';
      zustand.bereit = false;
      status('', zustand.modell ? kurzName(zustand.modell) : 'Modell wählen');
    }
    zeichneModellKnopf();
  };

  const kurzName = (id) => {
    if (zustand.quelle === 'wolke') return String(id).split('/').pop().replace(':free', '');
    const w = WEB_MODELLE.find(m => m.id === id);
    if (w) return w.name;
    return id.replace(':latest', '');
  };

  const status = (klasse, text) => {
    const d = document.querySelector('#ai .dot');
    const s = document.querySelector('#ai .model-btn .model-name');
    if (d) d.className = 'dot ' + (klasse || '');
    if (s) s.textContent = text;
  };

  const zeichneModellKnopf = () => {
    const b = document.querySelector('#ai .model-btn');
    if (!b) return;
    b.onclick = () => modellMenue(b);
  };

  /* ========================================================================
   * MODELLAUSWAHL — der Umschalter wie in Notion
   * ======================================================================*/
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
    } else {
      html += '<div style="padding:6px 12px 10px; font-size:12.5px; color:var(--text-dim); line-height:1.5">' +
              'Ollama läuft gerade nicht.<br>' +
              '<a href="https://ollama.com" target="_blank" style="color:var(--accent)">ollama.com</a> ' +
              'installieren, dann<br><code style="font-size:11.5px">ollama pull llama3.2</code><br><br>' +
              'Damit der Browser zugreifen darf, einmal<br>' +
              '<code style="font-size:11.5px">OLLAMA_ORIGINS=*</code> setzen.' +
              '</div>';
    }

    html += '<hr><div class="grp">Im Browser · ohne Installation</div>';
    WEB_MODELLE.forEach(m => {
      const an = zustand.quelle === 'webllm' && zustand.modell === m.id;
      html += `<button data-q="webllm" data-m="${esc(m.id)}" ${an ? 'class="on"' : ''}>` +
              `<span class="mi">${an ? '✓' : '○'}</span>` +
              `<span>${esc(m.name)}<span class="sub">${m.groesse} · ${m.hinweis}</span></span></button>`;
    });

    /* Wolken-Anbieter — nur die zeigen, für die ein Schlüssel hinterlegt ist */
    const mitSchluessel = ANBIETER.filter(a =>
      schluessel(a.id) || (a.id === 'eigen' && Store.getMeta('api:eigenUrl', '')));
    if (mitSchluessel.length) {
      html += '<hr><div class="grp">Über deinen eigenen Schlüssel</div>';
      mitSchluessel.forEach(a => {
        const modelle = a.id === 'eigen'
          ? [Store.getMeta('api:eigenModell', 'lokal')]
          : a.modelle;
        modelle.forEach(mo => {
          const an = zustand.quelle === 'wolke' && zustand.anbieter === a.id && zustand.modell === mo;
          html += `<button data-q="wolke" data-a="${a.id}" data-m="${esc(mo)}" ${an ? 'class="on"' : ''}>` +
                  `<span class="mi">${an ? '✓' : '☁'}</span>` +
                  `<span>${esc(mo.split('/').pop())}` +
                  `<span class="sub">${esc(a.name)}${a.frei ? ' · kostenloses Kontingent' : ''}</span></span></button>`;
        });
      });
    }

    html += '<hr><button data-q="check"><span class="mi">⟳</span>Erneut nach Ollama suchen</button>' +
            '<button data-q="schluessel"><span class="mi">🔑</span>Schlüssel hinterlegen …</button>';

    const m = UI.menu(html, Math.max(10, r.right - 300), r.bottom + 6);

    m.addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-q]');
      if (!b) return;

      if (b.dataset.q === 'check') { m.remove(); start(); UI.toast('Suche nach Ollama …'); return; }
      if (b.dataset.q === 'schluessel') { m.remove(); Einstellungen.oeffne('schluessel'); return; }

      m.remove();
      zustand.quelle = b.dataset.q;
      zustand.modell = b.dataset.m;
      if (b.dataset.q === 'wolke') zustand.anbieter = b.dataset.a;
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

      /* WebLLM muss erst geladen werden */
      zustand.bereit = false;
      zustand.laedt = true;
      status('load', 'Lädt …');
      const zeile = melde('Modell wird geladen. Beim ersten Mal dauert das ein paar Minuten — danach liegt es im Browser-Cache.');
      const balken = document.createElement('div');
      balken.className = 'prog';
      balken.innerHTML = '<i style="width:0%"></i>';
      zeile.appendChild(balken);

      try {
        await webllmLaden(zustand.modell, (text, p) => {
          balken.firstChild.style.width = Math.round(p * 100) + '%';
          status('load', Math.round(p * 100) + ' %');
        });
        zustand.bereit = true;
        zustand.laedt = false;
        status('ok', kurzName(zustand.modell));
        zeile.textContent = 'Bereit: ' + kurzName(zustand.modell) + ' läuft jetzt im Browser.';
      } catch (err) {
        zustand.laedt = false;
        status('err', 'Fehler');
        zeile.textContent = err.message;
      }
    });
  };

  const esc = (s) => String(s).replace(/[<>&"]/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' }[c]));

  /* ========================================================================
   * CHAT
   * ======================================================================*/
  const melde = (text) => {
    const chat = document.getElementById('chat');
    const d = document.createElement('div');
    d.className = 'msg sys';
    d.textContent = text;
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
    return d;
  };

  const schreibe = (rolle, text) => {
    const chat = document.getElementById('chat');
    const d = document.createElement('div');
    d.className = 'msg ' + (rolle === 'user' ? 'u' : 'a');
    d.textContent = text;
    chat.appendChild(d);
    chat.scrollTop = chat.scrollHeight;
    return d;
  };

  /** Der Inhalt der offenen Seite als Kontext für die KI. */
  const seitenKontext = () => {
    const id = App.aktuelleSeite();
    const p = Store.getBlock(id);
    if (!p) return '';
    const zeilen = [];
    const sammle = (bid, tiefe) => {
      if (tiefe > 3) return;
      Store.childrenOf(bid).forEach(b => {
        if (b.text) zeilen.push('  '.repeat(tiefe) + b.text);
        if (b.type === 'database') {
          const c = Store.getCollection(b.collectionId);
          if (c) {
            const rows = Store.rowsOf(c.id).slice(0, 40);
            zeilen.push(`  `.repeat(tiefe) + `[Datenbank "${c.name}" mit ${Store.rowsOf(c.id).length} Einträgen]`);
            rows.forEach(r => {
              const teile = Object.keys(c.schema).map(k =>
                c.schema[k].name + ': ' + Formula.anzeige(Datenbank.wert(r, k, c)));
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

  const SYSTEM =
    'Du bist ein Assistent in einer lokalen Notizen-App. Du antwortest auf Deutsch, ' +
    'knapp und klar. Wenn dir Ausschnitte aus dem Arbeitsbereich mitgegeben werden, ' +
    'beziehst du dich ausschliesslich darauf und erfindest nichts dazu. ' +
    'Steht die Antwort nicht in den Ausschnitten, sagst du das offen. ' +
    'Keine Floskeln, keine Wiederholung der Frage.';

  /* ------------------------------------------------------------------------
   * QUELLENKARTE
   * ------------------------------------------------------------------------
   * Eine Antwort aus dem Arbeitsbereich ohne Quellen ist wertlos — man kann
   * sie nicht prüfen. Deshalb steht unter jeder Antwort, woher sie stammt,
   * anklickbar und mit dem Datum der letzten Änderung.
   * ----------------------------------------------------------------------*/
  const quellenKarte = (quellen) => {
    if (!quellen || !quellen.length) return null;
    const d = document.createElement('div');
    d.className = 'ki-quellen';
    d.innerHTML = '<div class="kq-kopf">Quellen · ' + quellen.length + '</div>' +
      quellen.map(q =>
        `<button class="kq-zeile" data-q="${q.id}">` +
        `<span class="kq-titel">${esc(q.titel)}</span>` +
        `<span class="kq-art">${esc(q.art || '')}</span>` +
        (q.geaendert ? `<span class="kq-zeit">${esc(String(q.geaendert).slice(0, 10))}</span>` : '') +
        '</button>').join('');
    d.addEventListener('click', e => {
      const b = e.target.closest('[data-q]');
      if (!b) return;
      const z = Store.getBlock(b.dataset.q);
      if (!z) { UI.toast('Diese Seite gibt es nicht mehr'); return; }
      z.parentTable === 'collection'
        ? Datenbank.zeilePeek(z, Store.getCollection(z.parentId))
        : App.oeffne(z.id);
    });
    return d;
  };

  /** Die Quellen-Schalter über dem Eingabefeld. */
  const quellenLeiste = () => {
    const q = Kontext.quellen();
    const NAMEN = [
      ['aktuelleSeite',  '📄 Diese Seite'],
      ['arbeitsbereich', '🗂 Arbeitsbereich'],
      ['datenbanken',    '▦ Datenbanken'],
      ['verbindungen',   '🔌 Verbundenes'],
      ['web',            '🌐 Web']
    ];
    const d = document.createElement('div');
    d.className = 'ki-quellschalter';
    d.innerHTML = NAMEN.map(([k, n]) =>
      `<button data-qs="${k}" class="${q[k] ? 'an' : ''}">${n}</button>`).join('');
    d.addEventListener('click', e => {
      const b = e.target.closest('[data-qs]');
      if (!b) return;
      const jetzt = Kontext.quellen()[b.dataset.qs];
      if (b.dataset.qs === 'web' && !jetzt && Store.getMeta('ki:webFragen', true)) {
        if (!confirm('Für Websuche wird Wikipedia angefragt. Dabei verlässt dein Suchbegriff ' +
                     'den Rechner. Einschalten?')) return;
      }
      Kontext.quelleSetzen(b.dataset.qs, !jetzt);
      b.classList.toggle('an', !jetzt);
      UI.toast((!jetzt ? 'An: ' : 'Aus: ') + b.textContent);
    });
    return d;
  };

  const senden = async (text, mitKontext = true) => {
    if (!text.trim()) return;

    if (!zustand.bereit) {
      melde(zustand.quelle === 'ollama'
        ? 'Ollama ist nicht erreichbar. Oben rechts ein Modell wählen oder auf „Erneut nach Ollama suchen" klicken.'
        : 'Es ist noch kein Modell geladen. Oben rechts eines auswählen.');
      return;
    }

    schreibe('user', text);
    const ziel = schreibe('assistant', '');
    ziel.textContent = '…';

    /* WICHTIG: Genau EINE Systemnachricht, und die muss ganz vorne stehen.
       WebLLM warnt sonst „System prompt should always be the first message"
       und wirft den Zusatz weg. Deshalb wird der Seiteninhalt in dieselbe
       Systemnachricht hineingeschrieben, statt eine zweite anzuhängen. */
    /* Die Kontext-Schicht sucht die passenden Stellen heraus und prüft
       dabei, was der angemeldete Mensch überhaupt lesen darf. */
    let system = SYSTEM;
    let quellen = [];
    if (mitKontext && Store.getMeta('kiKontext', true)) {
      ziel.textContent = 'Sucht im Arbeitsbereich …';
      const k = Kontext.bauenFuerFrage(text, { anzahl: 6 });
      quellen = k.quellen;
      if (!k.leer) system += '\n\nDas hier steht in seinem Arbeitsbereich dazu:\n\n' + k.text;
      else system += '\n\nIm Arbeitsbereich wurde nichts Passendes gefunden. Sag das offen, ' +
                     'statt etwas zu erfinden.';

      /* Websuche nur, wenn sie eingeschaltet ist — und nur zusätzlich. */
      if (Kontext.quellen().web) {
        try {
          const begriff = text.split(/[?.!]/)[0].slice(0, 60);
          const w = await wikipedia(begriff);
          if (w) {
            system += '\n\nAus der Wikipedia zu „' + w.titel + '":\n' + w.text;
            quellen.push({ id: '', titel: w.titel, art: 'Wikipedia', link: w.link });
          }
        } catch {}
      }
    }
    if (Store.getMeta('ki:persoenlich', ''))
      system += '\n\nDauerhafte Anweisungen: ' + Store.getMeta('ki:persoenlich', '');
    const laenge = Store.getMeta('kiLaenge', 'normal');
    if (laenge === 'kurz')  system += '\n\nAntworte knapp, höchstens drei Sätze.';
    if (laenge === 'lang')  system += '\n\nAntworte ausführlich und gut gegliedert.';

    const nachrichten = [{ role: 'system', content: system }];
    /* Aus dem Verlauf niemals Systemnachrichten übernehmen */
    zustand.verlauf.slice(-6)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .forEach(m => nachrichten.push(m));
    nachrichten.push({ role: 'user', content: text });

    let antwort = '';
    try {
      await frage(nachrichten, (t) => {
        antwort += t;
        ziel.textContent = antwort;
        document.getElementById('chat').scrollTop = 1e9;
      });
      zustand.verlauf.push({ role: 'user', content: text });
      zustand.verlauf.push({ role: 'assistant', content: antwort });
    } catch (e) {
      ziel.textContent = '⚠ ' + e.message;
    }

    /* Quellen unter die Antwort */
    const qk = quellenKarte(quellen);
    if (qk && antwort) ziel.appendChild(qk);

    /* Antwort in die Seite übernehmen */
    if (antwort) {
      const btn = document.createElement('button');
      btn.textContent = '↧ In die Seite einfügen';
      btn.style.cssText = 'font-size:12px; color:var(--accent); margin-top:6px; ' +
                          'padding:3px 8px; border-radius:5px; display:block';
      btn.addEventListener('click', () => {
        antwort.split('\n').filter(z => z.trim()).forEach(z => {
          let typ = 'text', t = z.trim();
          if (/^#{1}\s/.test(t))      { typ = 'h1'; t = t.replace(/^#\s/, ''); }
          else if (/^#{2}\s/.test(t)) { typ = 'h2'; t = t.replace(/^##\s/, ''); }
          else if (/^#{3}\s/.test(t)) { typ = 'h3'; t = t.replace(/^###\s/, ''); }
          else if (/^[-*]\s/.test(t)) { typ = 'bullet'; t = t.replace(/^[-*]\s/, ''); }
          else if (/^\d+\.\s/.test(t)){ typ = 'number'; t = t.replace(/^\d+\.\s/, ''); }
          Store.addBlock(App.aktuelleSeite(), typ, { text: t });
        });
        App.zeichneSeite();
        UI.toast('In die Seite eingefügt');
      });
      ziel.appendChild(btn);
    }
  };

  /* ========================================================================
   * KI-AKTIONEN AUF BLÖCKEN
   * ======================================================================*/
  const blockAktion = async (art, block) => {
    App.kiPanel(true);

    const seite = seitenKontext();
    const auftraege = {
      'ai-write':   'Schreibe einen zusammenhängenden Absatz zu diesem Stichwort: ' + (block.text || '(leer)'),
      'ai-summary': 'Fasse den Inhalt dieser Seite in fünf kurzen Stichpunkten zusammen. ' +
                    'Hebe Entscheidungen, offene Fragen und nächste Schritte hervor.',
      'ai-todo':    'Leite aus dem Inhalt dieser Seite konkrete Aufgaben ab. ' +
                    'Jede Aufgabe als eigene Zeile, beginnend mit einem Verb.',
      'ai-edit':    'Formuliere diesen Text klarer, ohne den Sinn zu ändern:\n\n' + (block.text || ''),
      'ai-improve': 'Verbessere diesen Text: klarer, kürzer, ohne Füllwörter. ' +
                    'Gib nur den überarbeiteten Text zurück.\n\n' + (block.text || ''),
      'ai-translate': 'Übersetze diesen Text ins Englische. Gib nur die Übersetzung zurück.\n\n' +
                    (block.text || '')
    };

    const auftrag = auftraege[art];
    if (!auftrag) return;
    await senden(auftrag, !['ai-edit', 'ai-improve', 'ai-translate'].includes(art));
  };

  /* ========================================================================
   * DIE KI BAUT MIT
   * ------------------------------------------------------------------------
   * Notion lässt die KI Seiten und Datenbanken anlegen. Hier ebenso — nur
   * lokal. Das Modell antwortet in JSON, die App baut daraus echte Objekte
   * und schreibt jeden Schritt ins Protokoll, damit man ihn zurücknehmen kann.
   * ======================================================================*/
  const protokoll = [];

  const merkeSchritt = (was, ids) => {
    protokoll.push({ zeit: Store.now(), was, ids });
    if (protokoll.length > 40) protokoll.shift();
  };

  const JSON_HOLEN = (text) => {
    const anfang = text.indexOf('{');
    const ende = text.lastIndexOf('}');
    if (anfang < 0 || ende < anfang) return null;
    try { return JSON.parse(text.slice(anfang, ende + 1)); } catch { }
    /* Manche Modelle setzen Kommentare oder Kommas zu viel */
    try {
      return JSON.parse(text.slice(anfang, ende + 1)
        .replace(/\/\/[^\n]*/g, '').replace(/,\s*([}\]])/g, '$1'));
    } catch { return null; }
  };

  const TYP_KARTE = {
    text:'text', zahl:'number', number:'number', auswahl:'select', select:'select',
    mehrfach:'multi', multi:'multi', status:'status', datum:'date', date:'date',
    person:'person', kontrollkästchen:'checkbox', checkbox:'checkbox', url:'url',
    email:'email', 'e-mail':'email', telefon:'phone', phone:'phone', formel:'formula',
    formula:'formula', dateien:'files', files:'files'
  };

  /** Baut aus einer Beschreibung eine echte Datenbank. */
  /**
   * Baut aus einem fertigen Plan eine echte Datenbank.
   * Wird von der KI-Antwort benutzt und vom Agenten — deshalb steht sie
   * für sich und nicht mitten in der Chat-Funktion.
   */
  const datenbankBauenAus = (plan, seiteId) => {
    const schema = {};
    let titelGesetzt = false;
    (plan.spalten || []).slice(0, 12).forEach((sp, i) => {
      const roh = String(sp.typ || 'text').toLowerCase();
      const istTitel = roh.startsWith('titel') || roh === 'title';
      const typ = TYP_KARTE[roh] || (istTitel ? 'title' : 'text');
      const key = istTitel && !titelGesetzt ? 'title' : 'k' + i;
      if (istTitel) titelGesetzt = true;
      schema[key] = { name: sp.name || 'Spalte ' + (i + 1), type: istTitel ? 'title' : typ };
      if (['select','multi','status'].includes(schema[key].type)) {
        const farben = ['gray','blue','green','yellow','orange','red','purple','pink','brown'];
        schema[key].options = (sp.optionen || []).slice(0, 12)
          .map((n, j) => ({ name: String(n), color: farben[j % farben.length] }));
      }
      if (schema[key].type === 'formula' && sp.formel) schema[key].formula = sp.formel;
    });
    if (!titelGesetzt) schema.title = { name: 'Name', type: 'title' };

    const { collectionId, block } = Store.addDatabase(
      seiteId || App.aktuelleSeite(), plan.name || 'Neue Datenbank', schema, plan.layout || 'table');
    if (plan.icon) Store.updateCollection(collectionId, { icon: plan.icon });

    const nachName = {};
    Object.entries(schema).forEach(([k, d]) => nachName[d.name.toLowerCase()] = k);
    let zeilen = 0;
    (plan.zeilen || []).slice(0, 30).forEach(z => {
      const props = {};
      let titelWert = '';
      Object.entries(z).forEach(([n, v]) => {
        const k = nachName[String(n).toLowerCase()];
        if (!k) return;
        if (k === 'title') titelWert = String(v);
        else props[k] = v;
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
    if (!seite) { melde('Erst eine Seite öffnen.'); return; }

    schreibe('user', 'Datenbank bauen: ' + auftrag);
    const ziel = schreibe('assistant', '');
    ziel.textContent = 'Entwerfe die Datenbank …';

    const anweisung =
      'Du entwirfst eine Datenbank. Antworte AUSSCHLIESSLICH mit JSON, ohne Text davor oder danach, ' +
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
                   { role: 'user', content: auftrag }], t => {
        roh += t;
        ziel.textContent = 'Entwerfe die Datenbank … ' + roh.length + ' Zeichen';
      });
    } catch (e) { ziel.textContent = '⚠ ' + e.message; return; }

    const plan = JSON_HOLEN(roh);
    if (!plan || !Array.isArray(plan.spalten)) {
      ziel.textContent = 'Das Modell hat kein brauchbares JSON geliefert. Antwort war:\n\n' + roh.slice(0, 600);
      return;
    }

    const gebaut = datenbankBauenAus(plan, seite);
    const collectionId = gebaut.collectionId;
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
      if (e.target.closest('[data-a="weg"]')) {
        Store.trashBlock(block.id); Store.purgeBlock(block.id);
        App.zeichneSeite(); UI.toast('Wieder entfernt');
      }
      if (e.target.closest('[data-a="log"]')) protokollZeigen();
    });
    ziel.appendChild(leiste);
  };

  /** Baut eine ganze Seite mit Überschriften und Blöcken. */
  const seiteBauen = async (auftrag) => {
    App.kiPanel(true);
    const seite = App.aktuelleSeite();
    if (!seite) { melde('Erst eine Seite öffnen.'); return; }

    schreibe('user', 'Seite aufbauen: ' + auftrag);
    const ziel = schreibe('assistant', '');
    ziel.textContent = 'Baue die Seite …';

    const anweisung =
      'Du baust den Aufbau einer Notizseite. Antworte AUSSCHLIESSLICH mit JSON:\n' +
      '{"titel":"...","icon":"📄","bloecke":[{"typ":"h1","text":"..."},{"typ":"text","text":"..."},' +
      '{"typ":"bullet","text":"..."},{"typ":"todo","text":"..."},{"typ":"callout","text":"..."},' +
      '{"typ":"quote","text":"..."},{"typ":"divider"}]}\n' +
      'Höchstens 25 Blöcke. Alles auf Deutsch.';

    let roh = '';
    try {
      await frage([{ role: 'system', content: anweisung }, { role: 'user', content: auftrag }],
                  t => { roh += t; ziel.textContent = 'Baue die Seite … ' + roh.length + ' Zeichen'; });
    } catch (e) { ziel.textContent = '⚠ ' + e.message; return; }

    const plan = JSON_HOLEN(roh);
    if (!plan || !Array.isArray(plan.bloecke)) {
      ziel.textContent = 'Kein brauchbares JSON. Antwort war:\n\n' + roh.slice(0, 600);
      return;
    }

    const erlaubt = ['h1','h2','h3','text','bullet','number','todo','quote','callout','divider','code'];
    const neueIds = [];
    plan.bloecke.slice(0, 30).forEach(b => {
      const typ = erlaubt.includes(b.typ) ? b.typ : 'text';
      const n = Store.addBlock(seite, typ, { text: b.text || '' });
      neueIds.push(n.id);
    });
    if (plan.titel && !Store.getBlock(seite).text) Store.updateBlock(seite, { text: plan.titel });
    if (plan.icon) Store.updateBlock(seite, { icon: plan.icon });

    merkeSchritt('Seitenaufbau mit ' + neueIds.length + ' Blöcken', neueIds);
    App.zeichneSeite(); App.zeichneBaum();
    ziel.textContent = '✓ ' + neueIds.length + ' Blöcke eingefügt.';
  };

  /** Das Protokoll: was die KI gebaut hat, mit Rückgängig je Schritt. */
  const protokollZeigen = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(620px,94vw)">' +
        `<div class="fh">✨ Was die KI gebaut hat <em>${protokoll.length}</em>` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res">' +
          (protokoll.length ? protokoll.slice().reverse().map((p, i) =>
            `<div class="komm"><div class="komm-txt">${esc(p.was)}</div>` +
            `<div class="komm-fuss">${esc(Werkzeuge.zeitKurz(p.zeit))}` +
            `<button data-weg="${protokoll.length - 1 - i}">Rückgängig</button></div></div>`).join('')
          : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
            'Noch nichts. Die KI kann Datenbanken und Seitenaufbauten anlegen — ' +
            'frag sie im Panel danach.</div>') +
        '</div></div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const weg = e.target.closest('[data-weg]');
      if (!weg) return;
      const p = protokoll[+weg.dataset.weg];
      (p.ids || []).forEach(id => { Store.trashBlock(id); Store.purgeBlock(id); });
      protokoll.splice(+weg.dataset.weg, 1);
      o.remove(); App.zeichneSeite(); protokollZeigen();
      UI.toast('Zurückgenommen');
    });
  };

  /* ========================================================================
   * WIKIPEDIA NACHSCHLAGEN
   * ------------------------------------------------------------------------
   * Kostenlos, ohne Schlüssel, und die einzige Stelle, an der diese App von
   * sich aus ins Netz greift. Gut, wenn das lokale Modell etwas nicht weiss.
   * ======================================================================*/
  const wikipedia = async (begriff) => {
    const url = 'https://de.wikipedia.org/api/rest_v1/page/summary/' +
                encodeURIComponent(begriff.trim().replace(/\s+/g, '_'));
    const r = await holen(url, { headers: { 'Accept': 'application/json' } },
      { versuche: 3, beiWartezeit: (sek, nr) =>
          UI.toast('Wikipedia antwortet nicht — neuer Versuch ' + (nr + 1) + ' in ' + sek + ' s') });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('Wikipedia antwortet mit ' + r.status + '. ' + (FEHLERTEXT[r.status] || ''));
    const d = await r.json();
    return { titel: d.title, text: d.extract, link: d.content_urls?.desktop?.page || '' };
  };

  /** Schlägt nach und schreibt das Ergebnis in den Chat — mit Knopf zum Einfügen. */
  const nachschlagen = async (begriff) => {
    App.kiPanel(true);
    schreibe('user', 'Nachschlagen: ' + begriff);
    const ziel = schreibe('assistant', '');
    ziel.textContent = 'Schaue bei Wikipedia nach …';
    try {
      const t = await wikipedia(begriff);
      if (!t) { ziel.textContent = 'Zu „' + begriff + '" gibt es keinen Artikel.'; return; }
      ziel.textContent = t.text;
      const leiste = document.createElement('div');
      leiste.style.cssText = 'margin-top:8px; display:flex; gap:8px; flex-wrap:wrap';
      leiste.innerHTML =
        '<button class="ez-knopf" data-a="ein">In die Seite einfügen</button>' +
        (t.link ? `<a class="ez-knopf" href="${t.link}" target="_blank" rel="noopener">Artikel öffnen</a>` : '');
      leiste.addEventListener('click', e => {
        if (!e.target.closest('[data-a="ein"]')) return;
        const seite = App.aktuelleSeite();
        if (!seite) return;
        Store.addBlock(seite, 'quote', { text: t.text });
        Store.addBlock(seite, 'text', { text: 'Quelle: [' + t.titel + '](' + t.link + ')' });
        App.zeichneSeite();
        UI.toast('Eingefügt');
      });
      ziel.appendChild(leiste);
    } catch (err) {
      ziel.textContent = '⚠ ' + err.message + ' — ohne Netz geht das Nachschlagen nicht.';
    }
  };

  /** Aus der Auswahlleiste heraus: die markierte Stelle an die KI geben. */
  const frageMitAuswahl = (auswahl) => {
    const ta = document.getElementById('ai-input');
    if (!ta) return;
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
      ...rows.map(r => keys.map(k => Formula.anzeige(Datenbank.wert(r, k, coll))).join(' | '))
    ].join('\n');

    await senden(
      `Werte diese Tabelle aus der Datenbank "${coll.name}" aus. ` +
      `Nenne drei Muster, die dir auffallen, und einen konkreten Verbesserungsvorschlag.\n\n` +
      tabelle.slice(0, 6000), false);
  };

  /* ========================================================================
   * PANEL AUFBAUEN
   * ======================================================================*/
  /* ========================================================================
   * SCHREIBASSISTENT
   * ------------------------------------------------------------------------
   * Die Befehle, die in Notion direkt im Editor sitzen. Sie arbeiten mit dem
   * markierten Text, sonst mit der ganzen Seite.
   * ======================================================================*/
  const SCHREIB_BEFEHLE = [
    { id:'weiter',    icon:'✒️', name:'Weiterschreiben',
      auftrag:'Schreib den Text sinnvoll weiter. Gleiche Stimme, gleicher Ton, keine Wiederholung.' },
    { id:'besser',    icon:'✨', name:'Text verbessern',
      auftrag:'Mach den Text klarer und flüssiger, ohne den Sinn zu verändern.' },
    { id:'kuerzer',   icon:'✂️', name:'Kürzer machen',
      auftrag:'Kürze den Text auf das Wesentliche. Höchstens die Hälfte.' },
    { id:'laenger',   icon:'📏', name:'Länger machen',
      auftrag:'Führe den Text weiter aus, mit Beispielen. Nichts erfinden, was widerspricht.' },
    { id:'einfach',   icon:'🧒', name:'Einfacher erklären',
      auftrag:'Erklär denselben Inhalt so, dass ihn jemand ohne Vorwissen versteht.' },
    { id:'ton-formell', icon:'🎩', name:'Ton: förmlich',
      auftrag:'Schreib den Text förmlich und sachlich um, in der Sie-Form.' },
    { id:'ton-locker',  icon:'😊', name:'Ton: locker',
      auftrag:'Schreib den Text locker und freundlich um, in der Du-Form.' },
    { id:'ton-direkt',  icon:'🎯', name:'Ton: direkt',
      auftrag:'Schreib den Text kurz und direkt um. Keine Höflichkeitsfloskeln.' },
    { id:'recht',     icon:'📝', name:'Rechtschreibung',
      auftrag:'Korrigiere Rechtschreibung, Zeichensetzung und Grammatik. Sonst nichts ändern.' },
    { id:'fassen',    icon:'📋', name:'Zusammenfassen',
      auftrag:'Fasse den Text in höchstens fünf Stichpunkten zusammen.' },
    { id:'uebersetzen', icon:'🌍', name:'Übersetzen',
      auftrag:'Übersetze den Text ins Englische.', frage:'In welche Sprache?' },
    { id:'ideen',     icon:'💡', name:'Ideen sammeln',
      auftrag:'Sammle zehn Ideen zum Thema. Je Zeile eine, ohne Nummerierung.' },
    { id:'gliedern',  icon:'🗂', name:'Gliederung bauen',
      auftrag:'Mach aus dem Text eine Gliederung mit Überschriften und Stichpunkten.' },
    { id:'tabelle',   icon:'▦', name:'Tabelle daraus machen',
      auftrag:'Mach aus dem Text eine Tabelle. Antworte als Markdown-Tabelle mit Kopfzeile.' },
    { id:'aufgaben',  icon:'☑', name:'Aufgaben ableiten',
      auftrag:'Leite konkrete Aufgaben ab. Je Zeile eine, beginnend mit einem Verb.' },
    { id:'fragen',    icon:'❓', name:'Rückfragen finden',
      auftrag:'Nenne fünf Fragen, die dieser Text offen lässt.' }
  ];

  /** Der markierte Text — oder, wenn nichts markiert ist, die ganze Seite. */
  const arbeitsText = () => {
    const sel = String(getSelection() || '').trim();
    if (sel.length > 3) return { text: sel, teil: true };
    return { text: seitenKontext(), teil: false };
  };

  const schreibMenue = (anker2) => {
    const r = anker2
      ? anker2.getBoundingClientRect()
      : { left: innerWidth / 2 - 130, bottom: 120 };
    const m = UI.menu(
      '<div class="grp">Schreiben und bearbeiten</div>' +
      SCHREIB_BEFEHLE.map(b =>
        `<button data-sb="${b.id}"><span class="mi">${b.icon}</span>${b.name}</button>`).join(''),
      r.left - 40, (r.bottom || 100) + 6);

    m.addEventListener('click', async e => {
      const b = e.target.closest('[data-sb]');
      if (!b) return;
      m.remove();
      const befehl = SCHREIB_BEFEHLE.find(x => x.id === b.dataset.sb);
      if (!befehl) return;
      let auftrag = befehl.auftrag;
      if (befehl.frage) {
        const antwort = await UI.frage(befehl.frage, 'Englisch');
        if (!antwort) return;
        auftrag = 'Übersetze den Text ins ' + antwort + '.';
      }
      await schreibLauf(befehl, auftrag);
    });
  };

  const schreibLauf = async (befehl, auftrag) => {
    const quelle = arbeitsText();
    if (!quelle.text.trim()) { UI.toast('Es gibt noch keinen Text.'); return; }

    App.kiPanel(true);
    schreibe('user', befehl.icon + ' ' + befehl.name + (quelle.teil ? ' (Markierung)' : ' (ganze Seite)'));
    const ziel = schreibe('assistant', '');
    ziel.textContent = '…';

    const system = SYSTEM + '\n\n' + auftrag +
      '\n\nGib NUR den fertigen Text zurück, ohne Einleitung, ohne Anführungszeichen.' +
      (Store.getMeta('ki:persoenlich', '')
        ? '\n\nDauerhafte Anweisungen: ' + Store.getMeta('ki:persoenlich', '') : '');

    let antwort = '';
    try {
      await frage([{ role: 'system', content: system },
                   { role: 'user', content: quelle.text.slice(0, 9000) }], t => {
        antwort += t;
        ziel.textContent = antwort;
        document.getElementById('chat').scrollTop = 1e9;
      });
    } catch (e) { ziel.textContent = '⚠ ' + e.message; return; }

    const leiste = document.createElement('div');
    leiste.className = 'ki-antwortknoepfe';
    leiste.innerHTML =
      '<button data-a="ersetzen">Markierung ersetzen</button>' +
      '<button data-a="darunter">Darunter einfügen</button>' +
      '<button data-a="kopieren">Kopieren</button>' +
      '<button data-a="nochmal">Noch einmal</button>';
    leiste.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'kopieren') { navigator.clipboard?.writeText(antwort); UI.toast('Kopiert'); }
      if (b.dataset.a === 'nochmal')  { schreibLauf(befehl, auftrag); }
      if (b.dataset.a === 'darunter') { alsBloeckeEinfuegen(antwort); }
      if (b.dataset.a === 'ersetzen') {
        const sel = getSelection();
        if (sel && sel.rangeCount && String(sel).trim()) {
          const bereich = sel.getRangeAt(0);
          bereich.deleteContents();
          bereich.insertNode(document.createTextNode(antwort));
          const blk = sel.anchorNode?.parentElement?.closest?.('.blk');
          const ct = blk?.querySelector('.ct');
          if (blk && ct) Store.updateBlock(blk.dataset.bid, { text: ct.textContent });
          UI.toast('Ersetzt');
        } else { alsBloeckeEinfuegen(antwort); }
      }
    });
    ziel.appendChild(leiste);
  };

  /** Antworttext als richtige Blöcke ablegen — inklusive Markdown-Tabellen. */
  const alsBloeckeEinfuegen = (text) => {
    const zeilen = String(text || '').split('\n');
    const seite = App.aktuelleSeite();
    let tabelle = null;

    /* Eine angefangene Tabelle abschliessen, bevor etwas anderes kommt. */
    const tabelleAbschliessen = () => {
      if (!tabelle) return;
      Store.addBlock(seite, 'table', { rows: tabelle.rows, kopfZeile: true });
      tabelle = null;
    };

    zeilen.forEach(roh => {
      const z = roh.trim();
      if (!z) { tabelleAbschliessen(); return; }

      if (/^\|.*\|$/.test(z)) {
        const zellen = z.split('|').slice(1, -1).map(x => x.trim());
        if (zellen.every(c => /^:?-{2,}:?$/.test(c))) return;   /* Trennzeile */
        if (!tabelle) { tabelle = { rows: [] }; }
        tabelle.rows.push(zellen);
        return;
      }
      tabelleAbschliessen();

      let typ = 'text', t = z;
      if (/^#{1}\s/.test(t))      { typ = 'h1'; t = t.replace(/^#\s/, ''); }
      else if (/^#{2}\s/.test(t)) { typ = 'h2'; t = t.replace(/^##\s/, ''); }
      else if (/^#{3}\s/.test(t)) { typ = 'h3'; t = t.replace(/^###\s/, ''); }
      else if (/^[-*•]\s/.test(t)){ typ = 'bullet'; t = t.replace(/^[-*•]\s/, ''); }
      else if (/^\d+\.\s/.test(t)){ typ = 'number'; t = t.replace(/^\d+\.\s/, ''); }
      else if (/^>\s/.test(t))    { typ = 'quote'; t = t.replace(/^>\s/, ''); }
      else if (/^\[[ x]\]\s/i.test(t)) { typ = 'todo'; t = t.replace(/^\[[ x]\]\s/i, ''); }
      Store.addBlock(seite, typ, { text: t });
    });
    tabelleAbschliessen();

    App.zeichneSeite();
    UI.toast('In die Seite eingefügt');
  };

  const bindePanel = () => {
    const ta = document.getElementById('ai-input');
    const chat = document.getElementById('chat');

    /* Die Quellen-Schalter kommen über das Eingabefeld — man soll sehen,
       woraus die KI gerade schöpfen darf, bevor man tippt. */
    const fuss = document.querySelector('.ai-foot');
    if (fuss && !fuss.querySelector('.ki-quellschalter')) {
      fuss.insertBefore(quellenLeiste(), fuss.querySelector('.ai-quick'));
    }

    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const t = ta.value;
        ta.value = '';
        ta.style.height = 'auto';
        senden(t);
      }
    });
    ta.addEventListener('input', () => {
      ta.style.height = 'auto';
      ta.style.height = Math.min(160, ta.scrollHeight) + 'px';
    });

    document.querySelectorAll('.ai-quick button[data-p]').forEach(b => {
      b.addEventListener('click', () => senden(b.dataset.p));
    });

    document.getElementById('ai-db')?.addEventListener('click', async () => {
      const auftrag = await UI.frage('Was soll die Datenbank können?',
        'Aufgaben mit Status, Priorität, Fälligkeit und Aufwand');
      if (auftrag) datenbankBauen(auftrag);
    });
    document.getElementById('ai-seite')?.addEventListener('click', async () => {
      const auftrag = await UI.frage('Worum geht es auf der Seite?', '');
      if (auftrag) seiteBauen(auftrag);
    });
    document.getElementById('ai-log')?.addEventListener('click', () => protokollZeigen());
    document.getElementById('ai-agent')?.addEventListener('click', () => Agent.panel());
    document.getElementById('ai-meeting')?.addEventListener('click', () => Meeting.panel());
    document.getElementById('ai-schreiben')?.addEventListener('click', (e) => schreibMenue(e.currentTarget));

    document.getElementById('ai-wiki')?.addEventListener('click', async () => {
      const vorschlag = getSelection().toString().trim() ||
                        (Store.getBlock(App.aktuelleSeite())?.text || '');
      const begriff = await UI.frage('Was soll ich nachschlagen?', vorschlag);
      if (begriff) nachschlagen(begriff);
    });

    document.getElementById('ai-clear').addEventListener('click', () => {
      zustand.verlauf = [];
      chat.innerHTML = '';
      melde('Neuer Chat. Der Inhalt der offenen Seite wird als Kontext mitgegeben.');
    });

    melde('Alles läuft lokal. Kein Text verlässt deinen Rechner.');
  };

  return { start, bindePanel, senden, blockAktion, frageMitAuswahl, wikipedia, nachschlagen,
           datenbankBauen, datenbankBauenAus, seiteBauen, protokollZeigen, protokoll,
           quellenKarte, quellenLeiste, seitenKontext, SYSTEM,
           SCHREIB_BEFEHLE, schreibMenue, schreibLauf, alsBloeckeEinfuegen,
           ANBIETER, anbieter, wolkeFragen, holen, FEHLERTEXT, WIEDERHOLBAR,
           datenbankAuswerten, frageKurz, zustand, modellMenue };
})();
