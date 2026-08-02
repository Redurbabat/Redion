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

  const zustand = {
    quelle: 'ollama',      /* 'ollama' oder 'webllm' */
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

    html += '<hr><button data-q="check"><span class="mi">⟳</span>Erneut nach Ollama suchen</button>';

    const m = UI.menu(html, Math.max(10, r.right - 300), r.bottom + 6);

    m.addEventListener('click', async (e) => {
      const b = e.target.closest('button[data-q]');
      if (!b) return;

      if (b.dataset.q === 'check') { m.remove(); start(); UI.toast('Suche nach Ollama …'); return; }

      m.remove();
      zustand.quelle = b.dataset.q;
      zustand.modell = b.dataset.m;
      Store.setMeta('ki', { quelle: zustand.quelle, modell: zustand.modell });

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
    'knapp und klar. Wenn dir der Inhalt einer Seite mitgegeben wird, beziehst du dich darauf. ' +
    'Keine Floskeln, keine Wiederholung der Frage. Wenn du etwas nicht weisst, sagst du es.';

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
    let system = SYSTEM;
    if (mitKontext && Store.getMeta('kiKontext', true)) {
      const k = seitenKontext();
      if (k) system += '\n\nInhalt der geöffneten Seite:\n' + k;
    }
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
  const bindePanel = () => {
    const ta = document.getElementById('ai-input');
    const chat = document.getElementById('chat');

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

    document.querySelectorAll('.ai-quick button').forEach(b => {
      b.addEventListener('click', () => senden(b.dataset.p));
    });

    document.getElementById('ai-clear').addEventListener('click', () => {
      zustand.verlauf = [];
      chat.innerHTML = '';
      melde('Neuer Chat. Der Inhalt der offenen Seite wird als Kontext mitgegeben.');
    });

    melde('Alles läuft lokal. Kein Text verlässt deinen Rechner.');
  };

  return { start, bindePanel, senden, blockAktion, frageMitAuswahl,
           datenbankAuswerten, frageKurz, zustand, modellMenue };
})();
