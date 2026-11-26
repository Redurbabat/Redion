/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/ki/dienst.ts (npm run bauen:ts). */
/* ============================================================================
 * ai.js — Die lokale KI
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/ki/dienst.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/ki/dienst.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
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
 *   erlaubt werden — und zwar GENAU DIESE EINE, nicht alle.
 *
 *   Hier stand bis zum 3. September 2026 ein Stern. Das war bequem und
 *   falsch: `OLLAMA_ORIGINS=*` erlaubt JEDER Webseite im selben Browser,
 *   mit dem lokalen Ollama zu sprechen — Modelle aufzulisten, Anfragen zu
 *   stellen, Antworten zu lesen. Redion wirbt damit, dass kein Text den
 *   Rechner verlaesst (§21); eine Anleitung, die nebenbei die Tuer fuer
 *   alle aufmacht, nimmt genau dieses Versprechen zurueck.
 *
 *   Die Oberflaeche zeigt den Befehl deshalb MIT DER ECHTEN HERKUNFT
 *   dieses Fensters, zum Kopieren (`ollamaBefehl()` weiter unten).
 *
 *     Windows : setx OLLAMA_ORIGINS "https://…"   danach Ollama neu starten
 *     macOS   : launchctl setenv OLLAMA_ORIGINS "https://…"
 *     Linux   : OLLAMA_ORIGINS=https://… ollama serve
 *
 *   Beim Start ueber `file://` gibt es keine Herkunft: der Browser sendet
 *   `Origin: null`. Dafuer waere `OLLAMA_ORIGINS=null` noetig, und das
 *   erlaubt JEDE oertlich geoeffnete Datei. Die Oberflaeche sagt das und
 *   raet stattdessen zur ausgelieferten Fassung.
 * ==========================================================================*/

const KI = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const OLLAMA = 'http://localhost:11434';

  /* ══ DIE HERKUNFT, NICHT DER STERN ═══════════════════════════════════════
     Hier stand `OLLAMA_ORIGINS=*` als Anleitung. Ein Stern erlaubt JEDER
     Webseite im selben Browser, das lokale Ollama anzusprechen — die
     Modelle zu lesen, Anfragen zu stellen, Antworten mitzunehmen. Redion
     verspricht, dass kein Text den Rechner verlaesst (§21); diese eine
     Zeile Anleitung nahm das Versprechen zurueck.

     Jetzt steht der Befehl mit DER Herkunft da, aus der Redion gerade
     laeuft — nachgesehen statt geraten, und damit auch richtig, wenn
     jemand die App unter einer eigenen Adresse betreibt.

     DER SONDERFALL `file://`. Wer `index.html` doppelklickt, hat keine
     Herkunft: der Browser sendet `Origin: null`. `OLLAMA_ORIGINS=null`
     waere zwar enger als der Stern, erlaubt aber immer noch JEDE oertlich
     geoeffnete Datei. Das wird gesagt, nicht verschwiegen (§33). */
  const ollamaBefehl = (): string => {
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
  const NVIDIA_MODELL = 'moonshotai/kimi-k3.1-pro';
  const nvidiaTicket = (globalThis as typeof globalThis & {
    RedionDesktop?: { nvidiaTicket?: () => Promise<string> }
  }).RedionDesktop?.nvidiaTicket;
  const ANBIETER = [
    /* DIE MODELLNAMEN HIER SIND EIN RÜCKFALL, KEINE WAHRHEIT (E661).
       Ein Anbieter mustert Modelle aus, ohne dass dieses Programm es
       erfährt: Redur bekam am 20. September 2026 eine 404 für
       `llama-3.3-70b-versatile`, das hier an erster Stelle stand und
       deshalb als Vorgabe gewählt wurde. Es ist gestrichen — was an seine
       Stelle getreten ist, weiss der Anbieter, nicht ich, und geraten wird
       hier nichts (§56). `modelleHolen` fragt ihn; diese Liste hält nur
       das Menü am Leben, solange niemand gefragt hat. */
    { id:'groq',       name:'Groq',        frei:true,
      url:'https://api.groq.com/openai/v1/chat/completions',
      modelle:['llama-3.1-8b-instant'],
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
    ...(nvidiaTicket ? [{
      id: 'nvidia', name: 'NVIDIA', frei: true,
      url: 'redion-local://app/ki/nvidia', modelle: [NVIDIA_MODELL],
      woher: 'build.nvidia.com',
      hinweis: 'Kimi K3.1 Pro als NVIDIA-Prototyp. Bei Auswahl geht der Anfragekontext an NVIDIA.'
    }] : []),
    { id:'eigen',      name:'Eigener Server', frei:true,
      url:'', modelle:[], woher:'',
      hinweis:'Jede Adresse, die wie OpenAI antwortet — auch LM Studio oder llama.cpp' }
  ];

  const anbieter = (id?: any): any => ANBIETER.find(a => a.id === id) || ANBIETER[0];
  const schluessel = (id: string) => Store.getMeta('api:' + id, '');

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

  /**
   * Eine Wartezeit, die ein laufender Agent wirklich abbrechen kann. Ein
   * `AbortSignal` nur am nächsten `fetch` reicht nicht: während eines
   * Retry-Backoffs hinge der Lauf sonst trotz gedrücktem Abbruch weiter.
   */
  const schlafen = (ms: number, signal?: AbortSignal) => new Promise<void>((ok, nein) => {
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

  /** Was steckt hinter einem Fehlercode? Klartext statt nackter Zahl. */
  const FEHLERTEXT: Record<number, string> = {
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
   * Was in der Meldung steht — und WARUM nicht einfach die Tabelle.
   *
   * Redur, 20. September 2026, aus seinem Fenster:
   *
   *   „⚠ Groq antwortet mit 404. Die Adresse gibt es nicht (object_not_found).
   *    {"error":{"message":"The model `llama-3.3-70b-versatile` does not exist
   *    …","code":"model_not_found"}}"
   *
   * Die Adresse gab es sehr wohl — Groq hat sie beantwortet. Es war das
   * MODELL, das ausgemustert wurde, und der Anbieter sagte das wörtlich.
   * Redion hatte den Satz in der Hand und stellte trotzdem seine eigene,
   * falsche Erklärung davor. Wer sie liest, sucht am falschen Ort.
   *
   * EINE STATUSZAHL HAT MEHRERE URSACHEN, der Anbieter kennt die richtige.
   * Also gilt: sagt er etwas, gilt SEIN Satz. Die Tabelle bleibt die
   * Antwort für den, der schweigt — und das ist der häufigere Fall bei
   * einem kaputten Proxy oder einer leeren 502.
   */
  const fehlerSatz = (status: number, koerper: string): string => {
    let meldung = '', code = '';
    try {
      const d = JSON.parse(koerper || '{}');
      const e = d && (d.error || d.detail || d);
      meldung = String((e && (e.message || e.msg)) || '').trim();
      code = String((e && (e.code || e.type)) || '').trim();
    } catch { /* kein JSON — dann eben die Tabelle */ }

    if (!meldung) return (FEHLERTEXT[status] || 'unbekannter Fehler') +
      (koerper ? ' ' + koerper.slice(0, 180) : '');

    /* DER HÄUFIGSTE FALL BEKOMMT EINEN WEG, NICHT NUR EINEN BEFUND. Ein
       Anbieter mustert Modelle aus; die eingebaute Liste merkt es nie.
       „Das Modell gibt es nicht mehr" ohne „und so kommst du weiter" ist
       eine halbe Auskunft. */
    const modellWeg = /model_not_found/i.test(code) ||
      /does not exist|has been deprecated|decommissioned|no longer/i.test(meldung);
    if (modellWeg) return 'Dieses Modell gibt es beim Anbieter nicht mehr. ' + meldung +
      ' — wähle im KI-Fenster ein anderes Modell; „Modelle erneut holen" fragt ' +
      'den Anbieter, was er heute anbietet.';
    return meldung;
  };

  /**
   * fetch mit Wiederholung. Gibt die Antwort zurück, sobald sie brauchbar ist.
   * @param {object} opt  versuche, basis (ms), beiWartezeit (Rückmeldung)
   */
  const holen = async (url: any, init: RequestInit = {},
                       opt: { versuche?: number; basis?: number;
                              beiWartezeit?: (sek: number, nr: number, code: number) => void } = {}) => {
    const versuche = opt.versuche ?? 4;
    const basis    = opt.basis ?? 700;
    let letzter: unknown = null;

    for (let i = 0; i < versuche; i++) {
      let r = null;
      try {
        r = await fetch(url, init);
      } catch (e: unknown) {
        /* Netz ganz weg — das ist ein Fall für einen zweiten Versuch */
        letzter = e;
        if (init.signal && init.signal.aborted) throw e;
        if (i === versuche - 1) break;
        await schlafen(basis * Math.pow(2, i), init.signal ?? undefined);
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
      await schlafen(warte, init.signal ?? undefined);
    }
    throw letzter || new Error('Die Anfrage hat nicht geklappt.');
  };

  /**
   * Fragt einen Wolken-Anbieter. Streamt Stück für Stück, damit die Antwort
   * genauso erscheint wie bei den lokalen Modellen.
   */
  /* ========================================================================
   * DEN ANBIETER FRAGEN, WAS ER HAT (E661)
   * ------------------------------------------------------------------------
   * `ANBIETER` führt seine Modelle als Text im Programm. Groq mustert
   * Modelle aus, und die Liste merkt es nie — bis jemand eine 404 bekommt.
   * Für Ollama fragt Redion längst nach, was da ist (`sucheOllamaJetzt`);
   * für die Wolke stand dieselbe Frage nie.
   *
   * Alle OpenAI-artigen Anbieter haben `/models` unter derselben Wurzel wie
   * `/chat/completions`. Anthropic ebenso, unter `/v1/models`.
   *
   * DIE EINGEBAUTE LISTE BLEIBT — als Rückfall, nicht als Wahrheit. Ohne
   * Netz, ohne Schlüssel oder bei einem Anbieter ohne `/models` steht
   * immer noch etwas im Menü; ein leeres Menü wäre schlimmer als ein
   * veraltetes.
   * ======================================================================*/

  /** Die Adresse der Modell-Liste zu einer Chat-Adresse. */
  const modellAdresse = (url: string): string => {
    if (!url) return '';
    if (/\/chat\/completions\/?$/.test(url)) return url.replace(/\/chat\/completions\/?$/, '/models');
    if (/\/messages\/?$/.test(url)) return url.replace(/\/messages\/?$/, '/models');
    return url.replace(/\/+$/, '') + '/models';
  };

  /**
   * Holt die Modelle beim Anbieter und merkt sie. Gibt `null` zurück, wenn
   * es nicht geht — und wirft dabei NICHT: wer im Menü auf „erneut holen"
   * drückt, soll kein rotes Fenster bekommen, sondern die alte Liste.
   */
  const modelleHolen = async (id: string): Promise<string[] | null> => {
    try {
      const a = anbieter(id);
      if (a.id === 'nvidia') return a.modelle;
      const key = schluessel(a.id);
      const url = modellAdresse(a.id === 'eigen' ? Store.getMeta('api:eigenUrl', '') : a.url);
      if (!url) return null;
      /* DERSELBE KOPF WIE BEIM FRAGEN, nicht ein zweiter daneben (§8).
         Und er geht an DIESE Adresse und an keine andere (§21, §42). */
      const kopf: Record<string, string> = { 'Content-Type': 'application/json' };
      if (a.id === 'anthropic') {
        kopf['x-api-key'] = key;
        kopf['anthropic-version'] = '2023-06-01';
        kopf['anthropic-dangerous-direct-browser-access'] = 'true';
      } else if (key) {
        kopf['Authorization'] = 'Bearer ' + key;
      }
      const r = await fetch(url, { method: 'GET', headers: kopf });
      if (!r.ok) return null;
      const d = await r.json();
      const roh = Array.isArray(d?.data) ? d.data : (Array.isArray(d?.models) ? d.models : []);
      const liste = roh
        .map((m: any) => String(m?.id || m?.name || '')).filter(Boolean)
        /* WAS NICHT REDEN KANN, GEHÖRT NICHT IN EIN CHAT-MENÜ. Groq führt
           Whisper und TTS in derselben Liste; sie beantworten keine Frage. */
        .filter((n: string) => !/whisper|tts|embed|guard|moderat|vision-ocr/i.test(n))
        .sort();
      if (!liste.length) return null;
      Store.setMeta('ki:modelle:' + a.id, liste);
      return liste;
    } catch {
      /* Kein Netz, kein JSON, kein `/models` — die eingebaute Liste gilt. */
      return null;
    }
  };

  /**
   * Ein Modell für diesen Anbieter — frisch erfragt, sonst das Eingebaute.
   *
   * WARUM DAS HIER STEHT UND NICHT IN DEN EINSTELLUNGEN (E665). Dort stand
   * erst `KI.anbieter(id).modelle[0]`, dann wollte ich
   * `await KI.modelleHolen(id)` und `KI.modelleVon(id)[0]` schreiben — zwei
   * Griffe statt einem. `test537` hat es gemeldet: ein Querverweis mehr
   * zwischen zwei Bereichen, und das Verzeichnis darf nur schrumpfen
   * (§5 Regel 1).
   *
   * Der Wächter hatte recht, und zwar doppelt: „erst holen, dann das erste
   * nehmen" ist eine Prozedur der KI und keine Sache, die die
   * Einstellungsseite wissen muss. Ein Griff, ein Satz.
   */
  const modellWaehlen = async (id: string): Promise<string> => {
    if (id === 'eigen') return Store.getMeta('api:eigenModell', 'lokal');
    await modelleHolen(id);
    return modelleVon(id)[0] || '';
  };

  /** Was das Menü zeigt: was der Anbieter zuletzt sagte, sonst das Eingebaute. */
  const modelleVon = (id: string): string[] => {
    const gemerkt = Store.getMeta('ki:modelle:' + id, null);
    if (Array.isArray(gemerkt) && gemerkt.length) return gemerkt;
    const a = anbieter(id);
    return Array.isArray(a.modelle) ? a.modelle : [];
  };

  const wolkeFragen = async function* (nachrichten: any, modell: any,
                                       signal?: AbortSignal,
                                       /* WOHIN DIE GEZÄHLTE TOKENZAHL GEHT (L104, E319).
                                          Ein Generator liefert Textstücke; die Abrechnung
                                          ist kein Textstück und hätte in `yield` nichts zu
                                          suchen. Sie kommt deshalb über ein Fach heraus,
                                          das der Aufrufer hinhält. */
                                       abrechnung?: { ein?: number; aus?: number }) {
    const a = anbieter(zustand.anbieter);
    const key = schluessel(a.id);
    const url = a.id === 'eigen' ? Store.getMeta('api:eigenUrl', '') : a.url;
    if (!url) throw new Error('Für diesen Anbieter fehlt die Adresse.');
    if (!key && a.id !== 'eigen') throw new Error('Es ist noch kein Schlüssel hinterlegt. Einstellungen → Schlüssel.');

    /* Anthropic spricht ein eigenes Format */
    const istAnthropic = a.id === 'anthropic';
    const kopf: Record<string, string> = { 'Content-Type': 'application/json' };
    if (istAnthropic) {
      kopf['x-api-key'] = key;
      kopf['anthropic-version'] = '2023-06-01';
      kopf['anthropic-dangerous-direct-browser-access'] = 'true';
    } else if (key) {
      kopf['Authorization'] = 'Bearer ' + key;
    }
    if (a.id === 'nvidia') {
      if (!nvidiaTicket) throw new Error('NVIDIA braucht die Redion-Windows-App.');
      kopf['X-Redion-NVIDIA-Ticket'] = await nvidiaTicket();
    }

    const sys = nachrichten.find((m: any) => m.role === 'system');
    const rest = nachrichten.filter((m: any) => m.role !== 'system');
    const koerper = istAnthropic
      ? { model: modell, max_tokens: 2000, stream: true,
          system: sys ? sys.content : undefined, messages: rest }
      : { model: modell, messages: nachrichten, stream: true,
          /* NUR WO ES SICHER IST. „Eigener Server" ist eine Adresse, die
             der Mensch einträgt — ein Server, der unbekannte Felder
             ablehnt, scheiterte daran mit 400. Eine kaputte Antwort gegen
             eine genauere Zahl zu tauschen wäre ein schlechtes Geschäft. */
          ...(KiAbrechnung.willAbrechnung(a.id)
                ? { stream_options: { include_usage: true } } : {}) };

    const r = await holen(url,
      { method: 'POST', headers: kopf, body: JSON.stringify(koerper), signal: signal ?? null },
      { beiWartezeit: (sek: number, nr: any, code: any) =>
          UI.toast(`${a.name}: ${code} — neuer Versuch ${nr + 1} in ${sek} s`) });

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(a.name + ' antwortet mit ' + r.status + '. ' + fehlerSatz(r.status, txt));
    }

    if (!r.body) throw new Error('Die Antwort hat keinen Inhalt.');
    const leser = r.body.getReader();
    const dec = new TextDecoder();
    let puffer = '';
    while (true) {
      const { done, value } = await leser.read();
      if (done) break;
      puffer += dec.decode(value, { stream: true });
      const zeilen = puffer.split('\n');
      puffer = zeilen.pop() ?? '';
      for (const z of zeilen) {
        const t = z.trim();
        if (!t.startsWith('data:')) continue;
        const rohdaten = t.slice(5).trim();
        if (rohdaten === '[DONE]') return;
        try {
          const d = JSON.parse(rohdaten);
          /* HIER FIEL DIE ABRECHNUNG BISHER HERUNTER. Jedes Ereignis, das
             kein Textstück war, ging in den Papierkorb — auch das eine,
             das sagt, wie viele Token es wirklich waren (L104). */
          if (abrechnung) {
            const teil = KiAbrechnung.ausEreignis(d, istAnthropic);
            if (teil) {
              const zus = KiAbrechnung.zusammen(
                { ...(abrechnung.ein !== undefined ? { ein: abrechnung.ein } : {}),
                  ...(abrechnung.aus !== undefined ? { aus: abrechnung.aus } : {}) },
                teil);
              if (zus) {
                if (zus.ein !== undefined) abrechnung.ein = zus.ein;
                if (zus.aus !== undefined) abrechnung.aus = zus.aus;
              }
            }
          }
          const stueck = istAnthropic
            ? (d.delta && d.delta.text) || ''
            : (d.choices && d.choices[0] && d.choices[0].delta && d.choices[0].delta.content) || '';
          if (stueck) yield stueck;
        } catch {}
      }
    }
  };

  /* Der laufende Zustand des KI-Teils. Ohne die Anmerkungen liest
     TypeScript aus `[]` ein `never[]` und aus `null` ein „für immer null". */
  type Zustand = {
    quelle: string; anbieter: string; modell: string; bereit: boolean;
    laedt: boolean; ollamaModelle: any[]; engine: any;
    verlauf: { role: string; content: string; [k: string]: any }[];
    chatId: string; modus: string;
    /* Der Steuermann der laufenden Antwort, oder nichts (E652). Er steht
       hier und nicht in einer Abschlussvariablen, damit der Knopf und
       `abbrechen()` denselben erreichen. */
    abbruch: AbortController | null;
  };
  const zustand: Zustand = {
    quelle: 'ollama',      /* 'ollama', 'webllm' oder 'wolke' */
    anbieter: 'groq',
    modell: '',
    bereit: false,
    laedt: false,
    ollamaModelle: [],
    engine: null,          /* die WebLLM-Instanz */
    abbruch: null,         /* läuft gerade eine Antwort? (E652) */
    verlauf: [],
    chatId: '',            /* welcher gespeicherte Chat gerade offen ist */
    modus: 'standard'      /* 'standard' darf ändern, 'fragen' nur antworten */
  };

  /* ========================================================================
   * CHATS — GESPEICHERTE UNTERHALTUNGEN
   * Notion führt sie in der Seitenleiste, nach Tagen gruppiert, jeder
   * anheftbar. Hier liegen sie im Speicher unter „chats".
   * ======================================================================*/
  const chatsLesen  = () => Store.getMeta('chats', []) || [];
  const chatsSchreiben = (liste: any) => Store.setMeta('chats', liste.slice(0, 200));

  const chatSichern = () => {
    if (!zustand.verlauf.length) return;
    const liste = chatsLesen();
    const erste = zustand.verlauf.find(m => m.role === 'user');
    const titel = (erste ? erste.content : 'Chat').slice(0, 60);
    const jetzt = Store.now();
    const i = liste.findIndex((c: any) => c.id === zustand.chatId);
    const eintrag = { id: zustand.chatId || Store.uid(), titel,
                      verlauf: zustand.verlauf.slice(-40), wann: jetzt,
                      angeheftet: i >= 0 ? liste[i].angeheftet : false };
    zustand.chatId = eintrag.id;
    if (i >= 0) liste[i] = eintrag; else liste.unshift(eintrag);
    chatsSchreiben(liste);
  };

  const chatOeffnen = (id?: string) => {
    const c = chatsLesen().find((x: any) => x.id === id);
    if (!c) return;
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
    if (feld) feld.innerHTML = '';
    App.zeichneBaum();
    document.getElementById('ai-input')?.focus();
  };

  const chatLoeschen = (id?: string) => {
    chatsSchreiben(chatsLesen().filter((c: any) => c.id !== id));
    if (zustand.chatId === id) { zustand.chatId = ''; zustand.verlauf = []; }
    App.zeichneBaum();
  };

  const chatAnheften = (id?: string) => {
    const liste = chatsLesen();
    const c = liste.find((x: any) => x.id === id);
    if (!c) return;
    c.angeheftet = !c.angeheftet;
    chatsSchreiben(liste);
    App.zeichneBaum();
  };

  /** Nach Tagen gruppiert: Heute, Gestern, Diese Woche, Älter. */
  const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August',
                  'September','Oktober','November','Dezember'];

  const chatsGruppiert = () => {
    const liste = chatsLesen();
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    const tag = 86400000;
    /* Bis eine Woche zurück nach Tagen, danach nach Monaten — wie bei Notion */
    const reihe: any[] = [];
    const rein = (name: string, c: any) => {
      let g = reihe.find(x => x[0] === name);
      if (!g) { g = [name, []]; reihe.push(g); }
      g[1].push(c);
    };
    if (liste.some((c: any) => c.angeheftet)) reihe.push(['Angeheftet', []]);
    liste.forEach((c: any) => {
      if (c.angeheftet) { rein('Angeheftet', c); return; }
      const d = Date.parse(c.wann);
      if (isNaN(d)) { rein('Älter', c); return; }
      if (d >= heute.getTime())                rein('Heute', c);
      else if (d >= heute.getTime() - tag)     rein('Gestern', c);
      else if (d >= heute.getTime() - 7 * tag) rein('Diese Woche', c);
      else {
        const dt = new Date(d);
        rein(MONATE[dt.getMonth()] + ' ' + dt.getFullYear(), c);
      }
    });
    return reihe.filter(g => g[1].length);
  };

  /** „vor 3 Monaten" — Notion schreibt es unter jeden Chat. */
  const wieLange = (wann: any) => {
    const d = Date.parse(wann);
    if (isNaN(d)) return '';
    const min = Math.floor((Date.now() - d) / 60000);
    if (min < 60)     return 'vor ' + Math.max(1, min) + ' Min.';
    if (min < 1440)   return 'vor ' + Math.floor(min / 60) + ' Std.';
    const tage = Math.floor(min / 1440);
    if (tage === 1)   return 'gestern';
    if (tage < 30)    return 'vor ' + tage + ' Tagen';
    const monate = Math.floor(tage / 30);
    if (monate < 12)  return 'vor ' + monate + (monate === 1 ? ' Monat' : ' Monaten');
    const jahre = Math.floor(tage / 365);
    return 'vor ' + jahre + (jahre === 1 ? ' Jahr' : ' Jahren');
  };

  /* ========================================================================
   * FÄHIGKEITEN
   * Notion nennt sie „Skills": benannte Aufgaben, die die KI kann. Man ruft
   * sie im Chat mit @ auf oder über das Menü bei markiertem Text.
   * ======================================================================*/
  const FAEHIG_START = [
    { id: 'stil',   icon: '✍️', name: 'Schreibstil verbessern',
      auftrag: 'Verbessere den Stil des Textes. Behalte Inhalt und Bedeutung genau bei.' },
    { id: 'korrek', icon: '✅', name: 'Korrekturlesen',
      auftrag: 'Korrigiere Rechtschreibung, Grammatik und Zeichensetzung. Ändere sonst nichts.' },
    { id: 'erklaer',icon: '💡', name: 'Erklären',
      auftrag: 'Erkläre den Text einfach und verständlich, ohne Fachjargon.' },
    { id: 'format', icon: '✨', name: 'Neu formatieren',
      auftrag: 'Gliedere den Text sauber mit Überschriften und Listen. Der Inhalt bleibt.' }
  ];

  const faehigkeiten = () => {
    const eigene = Store.getMeta('kiFaehigkeiten', null);
    return eigene === null ? FAEHIG_START : eigene;
  };

  const faehigkeitSichern = (f: any) => {
    const liste = [...faehigkeiten()];
    const i = liste.findIndex(x => x.id === f.id);
    if (i >= 0) liste[i] = f; else liste.push(f);
    Store.setMeta('kiFaehigkeiten', liste);
  };

  const faehigkeitLoeschen = (id?: string) =>
    Store.setMeta('kiFaehigkeiten', faehigkeiten().filter((f: any) => f.id !== id));

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
      zustand.ollamaModelle = (d.models || []).map((m: any) => ({
        id: m.name,
        name: m.name,
        groesse: m.size ? (m.size / 1e9).toFixed(1) + ' GB' : ''
      }));
      return zustand.ollamaModelle.length > 0;
    } catch {
      return false;
    }
  };

  const ollamaFragen = async function* (nachrichten: any, modell: any,
                                        signal?: AbortSignal) {
    const r = await fetch(OLLAMA + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modell, messages: nachrichten, stream: true }),
      signal: signal ?? null
    });
    if (!r.ok) throw new Error('Ollama antwortet mit ' + r.status);

    if (!r.body) throw new Error('Die Antwort hat keinen Inhalt.');
    const leser = r.body.getReader();
    const dec = new TextDecoder();
    let rest = '';

    while (true) {
      const { done, value } = await leser.read();
      if (done) break;
      rest += dec.decode(value, { stream: true });
      const zeilen = rest.split('\n');
      rest = zeilen.pop() ?? '';
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
  let webllmLib: any = null;

  const webllmLaden = async (modellId: any, fortschritt: any) => {
    if (!webllmLib) {
      try {
        /* Die Bibliothek kommt zur Laufzeit von einem CDN. `tsc` würde den
           Pfad auflösen wollen und fände ihn nicht — deshalb der Umweg über
           `new Function`, der das `import` erst im Browser entstehen lässt.
           Am Verhalten ändert sich nichts. */
        webllmLib = await (new Function('p', 'return import(p)'))(
          'https://esm.run/@mlc-ai/web-llm');
      } catch {
        throw new Error('WebLLM konnte nicht geladen werden. Beim ersten Mal wird eine Internetverbindung gebraucht.');
      }
    }
    if (!(navigator as Navigator & { gpu?: unknown }).gpu) {
      throw new Error('Dieser Browser hat kein WebGPU. Chrome oder Edge ab Version 113 können es — oder du nimmst Ollama.');
    }
    zustand.engine = await webllmLib.CreateMLCEngine(modellId, {
      initProgressCallback: (b: any) => fortschritt && fortschritt(b.text || '', b.progress || 0)
    });
    return zustand.engine;
  };

  const webllmFragen = async function* (nachrichten: any, signal?: AbortSignal) {
    if (signal?.aborted) throw new DOMException('Der Lauf wurde abgebrochen.', 'AbortError');
    /* WebLLM benutzt keinen `fetch`, den wir mit einem Signal versehen
       könnten. Seine eigene Unterbrechung wird deshalb an dasselbe Signal
       gehängt. Ältere Fassungen ohne `interruptGenerate` bleiben kompatibel;
       dort verhindert die Prüfung in der Schleife wenigstens jedes weitere
       Textstück und damit jeden folgenden Agentenschritt. */
    const abbrechen = () => {
      try { zustand.engine?.interruptGenerate?.(); } catch { /* schon beendet */ }
    };
    signal?.addEventListener('abort', abbrechen, { once: true });
    try {
      const strom = await zustand.engine.chat.completions.create({
        messages: nachrichten, stream: true, temperature: 0.7
      });
      for await (const teil of strom) {
        if (signal?.aborted) throw new DOMException('Der Lauf wurde abgebrochen.', 'AbortError');
        const t = teil.choices?.[0]?.delta?.content;
        if (t) yield t;
      }
    } finally {
      signal?.removeEventListener('abort', abbrechen);
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
  const ordne = (nachrichten: any) => {
    const systeme = nachrichten.filter((m: any) => m.role === 'system').map((m: any) => m.content);
    const rest = nachrichten.filter((m: any) => m.role !== 'system');
    return systeme.length
      ? [{ role: 'system', content: systeme.join('\n\n') }, ...rest]
      : rest;
  };

  const frage = async (nachrichten: any, beiText: any,
                       optionen?: { signal?: AbortSignal }) => {
    if (!zustand.modell) throw new Error('Es ist noch kein Modell gewählt.');
    const n = ordne(nachrichten);

    /* Ins Protokoll — ohne den Inhalt der Frage. Was jemand die KI fragt,
       gehört ihm; dass er sie gefragt hat und mit welchem Modell, gehört
       in die Nachvollziehbarkeit. */
    if (typeof Protokoll !== 'undefined')
      Protokoll.notieren('ki', 'KI gefragt (' + (zustand.quelle || 'lokal') + ')',
        { wie: zustand.modell || '' });

    if (zustand.quelle === 'ollama') {
      for await (const t of ollamaFragen(n, zustand.modell, optionen?.signal)) beiText(t);
      return;
    }

    if (zustand.quelle === 'wolke') {
      /* --- DIE KOSTENPRÜFUNG SITZT HIER, UND ZWAR NUR HIER (E287) --------
         `frage` ist das einzige Tor: `frageKurz` geht durch, die
         Agentenschleife geht durch, der Chat geht durch. Eine Prüfung an
         drei Stellen wäre dreimal zu pflegen und zweimal zu vergessen.

         NUR für die Wolke. Ollama und WebLLM kosten nichts; eine Bremse
         davor wäre Reibung ohne Gegenwert.

         Und sie prüft VOR dem Aufruf. Danach zu zählen wäre eine
         Buchhaltung, keine Grenze. */
      /* ZUERST SCHÄTZEN, DANACH BERICHTIGEN (L104, E319).
         Die Grenze muss VOR dem Aufruf prüfen — danach zu zählen wäre eine
         Buchhaltung, keine Grenze. Die wirkliche Tokenzahl kommt aber erst
         am Ende des Stroms. Also wird geschätzt, gebucht, und wenn der
         Anbieter am Ende sagt, wie viele es waren, wird die Buchung
         ersetzt statt verdoppelt. */
      let gebucht: any = null;
      if (typeof KiBuch !== 'undefined') {
        const urteil = KiBuch.pruefen(zustand.modell, n, { lokal: false });
        if (!urteil.erlaubt) throw new Error(urteil.satz);
        const s = urteil.schaetzung;
        if (s && s.bekannt && !s.frei) {
          gebucht = KiBuch.buchen(zustand.modell, zustand.anbieter || '',
                                  s.tokenEin, s.tokenAus, false);
        }
      }
      const abrechnung: { ein?: number; aus?: number } = {};
      try {
        for await (const t of wolkeFragen(n, zustand.modell, optionen?.signal, abrechnung))
          beiText(t);
      } finally {
        /* IM `finally`, UND DAS IST DER PUNKT. Wer mitten in einer langen
           Antwort abbricht, hat die Eingabetoken trotzdem bezahlt — und
           Anthropic schickt die schon im ERSTEN Ereignis. Eine Berichtigung
           nur im Erfolgsfall liesse gerade den Abbruch zu hoch gebucht
           stehen, also genau den Fall, den man später sucht. */
        if (gebucht && KiAbrechnung.vollstaendig(abrechnung)) {
          KiBuch.berichtigen(gebucht.id, abrechnung.ein, abrechnung.aus);
        }
      }
      return;
    }

    if (!zustand.engine) throw new Error('Das Modell ist noch nicht geladen.');
    for await (const t of webllmFragen(n, optionen?.signal)) beiText(t);
  };

  /** Ein Rundruf ohne Streaming — für kurze Aufgaben. */
  const frageKurz = async (prompt: any, system?: any,
                           optionen?: { signal?: AbortSignal }) => {
    let out = '';
    const n = [];
    if (system) n.push({ role: 'system', content: system });
    n.push({ role: 'user', content: prompt });
    await frage(n, (t: any) => out += t, optionen);
    return out.trim();
  };

  /* ========================================================================
   * START
   * ======================================================================*/
  const start = async () => {
    const gemerkt = Store.getMeta('ki', null);

    /* Zuletzt ein Wolken-Modell benutzt und der Schlüssel liegt noch da? */
    if (gemerkt && gemerkt.quelle === 'wolke' && gemerkt.anbieter !== 'nvidia' &&
        ANBIETER.some(a => a.id === gemerkt.anbieter) &&
        (schluessel(gemerkt.anbieter) || gemerkt.anbieter === 'eigen')) {
      zustand.quelle = 'wolke';
      zustand.anbieter = gemerkt.anbieter;
      zustand.modell = gemerkt.modell;
      zustand.bereit = true;
      status('ok', kurzName(zustand.modell));
      zeichneModellKnopf();
      return;
    }

    /* ======================================================================
     * NUR SUCHEN, WER SCHON EINMAL GEFUNDEN HAT (E233)
     * ----------------------------------------------------------------------
     * Hier stand `ollamaPruefen()` ohne Bedingung. Bei JEDEM Start ging
     * damit eine Anfrage an `localhost:11434` — auch bei jemandem, der KI
     * nie geöffnet hat und Ollama nie installiert hat.
     *
     * Es verlässt nichts den Rechner (§21 ist also gewahrt), aber:
     *
     *   · Jeder Start hinterlässt einen Fehler in der Konsole
     *     (`ERR_CONNECTION_REFUSED`). Und eine Konsole, in der immer ein
     *     Fehler steht, ist eine Konsole, in der man den nächsten übersieht.
     *     Die eigenen Prüfläufe fragen „Keine Fehler auf der Seite" — dieser
     *     hier wurde nur deshalb nicht rot, weil er als Netzfehler und nicht
     *     als Skriptfehler zählt.
     *   · Hört ein anderes Programm auf 11434, redet Redion mit ihm.
     *
     * Gesucht wird jetzt, wenn es einen Grund gibt: Ollama war schon einmal
     * die Quelle, ODER der Mensch öffnet die Modellauswahl (`modellMenue`
     * fragt ohnehin), ODER er drückt dort „Suche nach Ollama".
     *
     * Wer Ollama benutzt, merkt nichts. Wer es nicht benutzt, startet leise.
     * ====================================================================*/
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
    } else {
      zustand.quelle = 'webllm';
      zustand.modell = (gemerkt && gemerkt.quelle === 'webllm') ? gemerkt.modell : '';
      zustand.bereit = false;
      status('', zustand.modell ? kurzName(zustand.modell) : 'Modell wählen');
    }
    zeichneModellKnopf();
  };

  const kurzName = (id: string) => {
    if (zustand.quelle === 'wolke')
      return (String(id).split('/').pop() ?? '').replace(':free', '');
    const w = WEB_MODELLE.find(m => m.id === id);
    if (w) return w.name;
    return id.replace(':latest', '');
  };

  const status = (klasse: any, text: string) => {
    const d = document.querySelector('#ai .dot');
    const s = document.querySelector('#ai .model-btn .model-name');
    if (d) d.className = 'dot ' + (klasse || '');
    if (s) s.textContent = text;
    const button = document.querySelector('#ai .model-btn');
    button?.setAttribute('title', 'Modell wechseln: ' + text);
    button?.setAttribute('aria-label', 'KI-Modell wechseln: ' + text);
  };

  const zeichneModellKnopf = () => {
    const b = document.querySelector<HTMLElement>('#ai .model-btn');
    if (!b) return;
    b.onclick = () => modellMenue(b);
  };

  /* ========================================================================
   * MODELLAUSWAHL — der Umschalter wie in Notion
   * ======================================================================*/
  const modellMenue = async (anker?: any) => {
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

    /* Wolken-Anbieter — nur die zeigen, für die ein Schlüssel hinterlegt ist */
    const mitSchluessel = ANBIETER.filter(a =>
      schluessel(a.id) || (a.id === 'eigen' && Store.getMeta('api:eigenUrl', '')));
    if (mitSchluessel.length) {
      html += '<hr><div class="grp">Über deinen eigenen Schlüssel</div>';
      mitSchluessel.forEach(a => {
        const modelle = a.id === 'eigen'
          ? [Store.getMeta('api:eigenModell', 'lokal')]
          /* Was der Anbieter zuletzt gesagt hat, sonst das Eingebaute (E661). */
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
    /* Nur zeigen, wo es etwas zu holen gibt — ein Knopf ohne Schlüssel
       könnte nichts tun und wäre genau das, was §47 verbietet. */
    if (mitSchluessel.some(a => a.id !== 'eigen'))
      html += '<button data-q="modelle"><span class="mi">☁</span>Modelle erneut holen</button>';
    html += '<button data-q="schluessel"><span class="mi">🔑</span>Schlüssel hinterlegen …</button>';

    const m = UI.menu(html, Math.max(10, r.right - 300), r.bottom + 6);

    m.addEventListener('click', async (e) => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-q]');
      if (!b) return;

      if (b.dataset.q === 'check') { m.remove(); start(); UI.toast('Suche nach Ollama …'); return; }
      /* JEDEN ANBIETER MIT SCHLÜSSEL FRAGEN, was er heute anbietet (E661).
         Der Knopf sagt danach, was herauskam — auch wenn es nichts war:
         ein Knopf, der schweigend nichts tut, ist die heimtückischere
         Hälfte von §47. */
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
      if (b.dataset.q === 'schluessel') { m.remove(); App.einstellungen('schluessel'); return; }

      m.remove();
      zustand.quelle = b.dataset.q ?? zustand.quelle;
      zustand.modell = b.dataset.m ?? zustand.modell;
      if (b.dataset.q === 'wolke') zustand.anbieter = b.dataset.a ?? zustand.anbieter;
      // NVIDIA wird im laufenden Fenster gewählt. Der gespeicherte lokale Start bleibt verfügbar.
      if (zustand.quelle !== 'wolke' || zustand.anbieter !== 'nvidia')
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
      /* DER FLÜSSIGE RING (E461). Diese Stelle ist die einzige im ganzen
         Bestand, die von aussen einen echten 0..1-Anteil bekommt
         (`initProgressCallback`) — also bekommt sie das Bild, das einen
         Anteil zeigen darf. Der alte Balken bleibt als Rückfall, falls
         das Bauteil nicht geladen ist. */
      const ring = typeof Lader !== 'undefined'
        ? Lader.bauen({ art: 'fluss', anteil: 0, text: 'Modell wird geladen …' }) : null;
      const balken = document.createElement('div');
      if (ring) zeile.appendChild(ring.element);
      else {
        balken.className = 'prog';
        balken.innerHTML = '<i style="width:0%"></i>';
        zeile.appendChild(balken);
      }

      try {
        await webllmLaden(zustand.modell, (_text: string, p: any) => {
          const anteil = Math.max(0, Math.min(1, Number(p) || 0));
          if (ring) ring.setzen({ anteil });
          const innen = balken.firstChild;
          if (innen instanceof HTMLElement) innen.style.width = Math.round(anteil * 100) + '%';
          status('load', Math.round(anteil * 100) + ' %');
        });
        zustand.bereit = true;
        zustand.laedt = false;
        status('ok', kurzName(zustand.modell));
        zeile.textContent = 'Bereit: ' + kurzName(zustand.modell) + ' läuft jetzt im Browser.';
      } catch (err) {
        zustand.laedt = false;
        status('err', 'Fehler');
        zeile.textContent = err instanceof Error ? err.message : String(err);
      }
    });
  };

  const esc = (s: any): string => String(s).replace(/[<>&"]/g,
    c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' } as Record<string, string>)[c] ?? c);

  /* ========================================================================
   * CHAT
   * ======================================================================*/
  const melde = (text: string) => {
    const chat = document.getElementById('chat');
    const d = document.createElement('div');
    d.className = 'msg sys';
    d.textContent = text;
    if (chat) { chat.appendChild(d); chat.scrollTop = chat.scrollHeight; }
    return d;
  };

  const schreibe = (rolle: any, text: string) => {
    const chat = document.getElementById('chat');
    const d = document.createElement('div');
    d.className = 'msg ' + (rolle === 'user' ? 'u' : 'a');
    d.textContent = text;
    if (chat) { chat.appendChild(d); chat.scrollTop = chat.scrollHeight; }
    return d;
  };

  /** Der Inhalt der offenen Seite als Kontext für die KI. */
  const seitenKontext = () => {
    const id = App.aktuelleSeite();
    const p = Store.getBlock(id);
    if (!p) return '';
    const zeilen: any[] = [];
    const sammle = (bid: any, tiefe: number) => {
      if (tiefe > 3) return;
      Store.childrenOf(bid).forEach((b: any) => {
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
    'Du bist der Assistent in Redion, einer lokalen Notion-App. Du antwortest auf Deutsch, ' +
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
  const quellenKarte = (quellen: any) => {
    if (!quellen || !quellen.length) return null;
    const d = document.createElement('div');
    d.className = 'ki-quellen';
    d.innerHTML = '<div class="kq-kopf">Quellen · ' + quellen.length + '</div>' +
      quellen.map((q: any) =>
        `<button class="kq-zeile" data-q="${q.id}">` +
        `<span class="kq-titel">${esc(q.titel)}</span>` +
        `<span class="kq-art">${esc(q.art || '')}</span>` +
        (q.geaendert ? `<span class="kq-zeit">${esc(String(q.geaendert).slice(0, 10))}</span>` : '') +
        '</button>').join('');
    d.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('[data-q]');
      if (!b) return;
      const z = Store.getBlock(b.dataset.q);
      if (!z) { UI.toast('Diese Seite gibt es nicht mehr'); return; }
      z.parentTable === 'collection'
        ? Datenbank.zeilePeek(z, Store.getCollection(z.parentId))
        : App.oeffne(z.id);
    });
    return d;
  };

  /** Die fünf Quellen, mit dem Wort, das ein Mensch liest. EINE Liste für
      die Schalter, das Schild am Prompt und den Satz zum neuen Chat (E724). */
  const QUELLEN_NAMEN: [string, string, string][] = [
    ['aktuelleSeite',  '📄', 'Diese Seite'],
    ['arbeitsbereich', '🗂', 'Arbeitsbereich'],
    ['datenbanken',    '▦', 'Datenbanken'],
    ['verbindungen',   '🔌', 'Verbundenes'],
    ['web',            '🌐', 'Web']
  ];
  const aktiveQuellen = (): string[] => {
    const q = Kontext.quellen();
    return QUELLEN_NAMEN.filter(([k]) => q[k]).map(([, , n]) => n);
  };

  /** Die Schalter der Quellen. Umgeschaltet wird über EINEN Weg
      (`Kontext.quelleUmschalten`, E724): er fragt beim Web zuerst — in
      einem Redion-Fenster statt `confirm()` — und meldet die Änderung am
      Bus. Jeder Schalter, das Schild am Prompt und die Einstellungen ziehen
      dann mit, Klasse UND `aria-pressed` (vorher vergass der zweite
      Schreiber, die Einstellungen, das `aria-pressed`). */
  const quellenKnoepfe = (): string => {
    const q = Kontext.quellen();
    return QUELLEN_NAMEN.map(([k, z, n]) =>
      `<button data-qs="${k}" aria-pressed="${!!q[k]}" class="${q[k] ? 'an' : ''}">${z} ${n}</button>`).join('');
  };
  const quellenBinden = (d: HTMLElement): HTMLElement => {
    d.addEventListener('click', async e => {
      const b = elVon(e)?.closest<HTMLElement>('[data-qs]');
      if (!b) return;
      const qs = b.dataset.qs;
      if (!qs) return;
      const an = await Kontext.quelleUmschalten(qs);
      if (an === null) return;
      UI.toast((an ? 'An: ' : 'Aus: ') + (b.textContent || '').trim());
    });
    return d;
  };
  const quellenLeiste = (): HTMLElement => {
    const d = document.createElement('div');
    d.className = 'ki-quellschalter';
    d.innerHTML = quellenKnoepfe();
    return quellenBinden(d);
  };

  /** Das Schild am Prompt: Zahl und Namen der aktiven Quellen (E724). Der
      Zustand steht ohne Aufklappen da — vorher lag er hinter einer Falte. */
  const quellenSchild = (): void => {
    const k = document.getElementById('ai-quellen');
    if (!k) return;
    const an = aktiveQuellen();
    k.setAttribute('aria-label', 'Quellen: ' + (an.length ? an.join(', ') : 'keine') + ' — ändern');
    const zahl = k.querySelector('.ai-quellen-zahl');
    if (zahl) zahl.textContent = String(an.length);
    k.classList.toggle('ohne', !an.length);
  };

  /** Jeder Schalter im Dokument sagt, was gilt — nach jeder Änderung. */
  const quellenAbgleichen = (): void => {
    const q = Kontext.quellen();
    document.querySelectorAll<HTMLElement>('[data-qs]').forEach(b => {
      const an = !!q[b.dataset.qs || ''];
      b.classList.toggle('an', an);
      b.setAttribute('aria-pressed', String(an));
    });
    quellenSchild();
  };

  /** Der Satz zum neuen Chat — abgeleitet, nicht behauptet (E724). Vorher
      stand hier immer „Der Inhalt der offenen Seite wird als Kontext
      mitgegeben", auch wenn „Diese Seite" aus war — der Satz auf Redurs
      Foto. */
  const kontextSatz = (): string => {
    if (!Store.getMeta('kiKontext', true))
      return 'Neuer Chat. Die KI sieht nichts aus deinem Arbeitsbereich — ' +
             '„Seiteninhalt mitgeben" ist in den KI-Einstellungen aus.';
    const an = aktiveQuellen();
    return an.length ? 'Neuer Chat. Die KI sieht: ' + an.join(' · ') + '.'
                     : 'Neuer Chat. Die KI sieht nichts — alle Quellen sind aus.';
  };

  /* ══ DER STOPP-KNOPF (E652) ═════════════════════════════════════════════
   * Die ganze Abbruchkette war gebaut: `frage(…, {signal})`, ein
   * abbrechbares `schlafen` für den Backoff, `signal` bis in `fetch`
   * hinein. Nur `senden` rief `frage` OHNE das dritte Argument, und im
   * Markup gab es keinen Knopf dafür. Wer eine lange Antwort losgeschickt
   * hatte, konnte sie nur durch Schliessen des Tabs beenden.
   *
   * Das Teure war gebaut, das Billige fehlte.
   *
   * KEIN ZWEITER KNOPF. Der Senden-Knopf wird für die Dauer des Laufs zum
   * Stopp-Knopf — dasselbe Element, dieselbe Grösse. Ein Knopf, der
   * daneben auftaucht, verschiebt die Trefferfläche mitten in der
   * Bewegung; §37 verlangt das Gegenteil. `test544` misst die Grösse vor
   * und nach dem Lauf.
   *
   * Und der Zustand steht NICHT nur in der Farbe (§38): `aria-label`
   * wechselt mit, sonst weiss ein Vorleseprogramm nichts davon. */
  const sendenKnopf = (imLauf: boolean): void => {
    const k = document.getElementById('ai-senden');
    if (!k) return;
    k.textContent = imLauf ? '■' : '↑';
    k.setAttribute('aria-label', imLauf ? 'Antwort abbrechen' : 'Nachricht senden');
    k.setAttribute('title', imLauf ? 'Abbrechen' : 'Senden');
    if (imLauf) k.setAttribute('data-lauf', '1');
    else k.removeAttribute('data-lauf');
  };

  /** Bricht die laufende Antwort ab. Ohne Lauf tut es nichts. */
  const abbrechen = (): boolean => {
    if (!zustand.abbruch) return false;
    zustand.abbruch.abort();
    return true;
  };

  /** Seiten, die über „@" erwähnt wurden — Kontext der NÄCHSTEN Frage
      (E724, D11). Vorher hängte „Erwähnen" nur „@Titel" an den Text. */
  const erwaehnt = new Map<string, string>();

  const senden = async (text: string, mitKontext = true) => {
    if (!text.trim()) return;

    /* „@Fähigkeit …" (E724): steht am Anfang ein Name aus den Fähigkeiten
       oder dem Katalog, läuft er auf dem Rest — statt dass der Satz samt
       „@" an das Modell geht. */
    const at = mitKontext ? atBefehl(text.trim()) : null;
    if (at) {
      const lauf: KiLauf = at.rest ? { text: at.rest, wo: 'Eingabe' } : {};
      if (at.f) await faehigkeitAusfuehren(at.f, lauf);
      else if (at.b) await ausfuehren(at.b.id, lauf);
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
      const extraSeiten = [...erwaehnt].filter(([, titel]) => text.includes('@' + titel)).map(([id]) => id);
      erwaehnt.clear();
      const k = await Kontext.bauenFuerFrage(text, { anzahl: 6, extraSeiten });
      quellen = k.quellen;

      /* NUR-QUELLEN-MODUS (E305, Redurs Punkt 11). Findet sich nichts, wird
         das Modell GAR NICHT GEFRAGT. Der Satz darunter — „sag das offen,
         statt etwas zu erfinden" — ist eine Bitte, und ein Modell ohne
         Vorlage antwortet trotzdem. Wer vor einer Prüfung sitzt, braucht
         keine Bitte, sondern eine Zusage. */
      const tor = Kontext.darfFragen(k);
      if (!tor.ok) {
        ziel.textContent = tor.grund;
        ziel.classList.add('msg-ohne-quelle');
        zustand.verlauf.push({ role: 'user', content: text });
        zustand.verlauf.push({ role: 'assistant', content: tor.grund });
        chatSichern();
        return;
      }

      if (!k.leer) system += '\n\nDas hier steht in seinem Arbeitsbereich dazu:\n\n' + k.text;
      else system += '\n\nIm Arbeitsbereich wurde nichts Passendes gefunden. Sag das offen, ' +
                     'statt etwas zu erfinden.';
      if (Kontext.nurQuellen()) system += Kontext.nurQuellenAnweisung();

      /* Websuche nur, wenn sie eingeschaltet ist — und nur zusätzlich.
         IM NUR-QUELLEN-MODUS GAR NICHT: „meine Quellen" heisst die eigenen
         Unterlagen. Eine Wikipedia-Zusammenfassung ist keine davon, und sie
         wäre die eine Zeile, die den ganzen Modus wieder aushebelt. */
      if (Kontext.quellen().web && !Kontext.nurQuellen()) {
        try {
          const begriff = (text.split(/[?.!]/)[0] ?? '').slice(0, 60);
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
    /* Im Modus „Fragen" darf die KI nur antworten, nichts anlegen oder ändern */
    if (zustand.modus === 'fragen')
      system += '\n\nWichtig: Du beantwortest nur Fragen. Lege nichts an, ändere nichts ' +
                'und schlage keine Änderungen vor, um die man dich nicht gebeten hat.';
    const pers = persona();
    if (pers.name && pers.name !== 'KI')
      system += '\n\nDu heisst ' + pers.name + '.';
    const laenge = Store.getMeta('kiLaenge', 'normal');
    if (laenge === 'kurz')  system += '\n\nAntworte knapp, höchstens drei Sätze.';
    if (laenge === 'lang')  system += '\n\nAntworte ausführlich und gut gegliedert.';

    const nachrichten: { role: string; content: string }[] = [{ role: 'system', content: system }];
    /* Aus dem Verlauf niemals Systemnachrichten übernehmen */
    zustand.verlauf.slice(-6)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .forEach(m => nachrichten.push(m));
    nachrichten.push({ role: 'user', content: text });

    let antwort = '';
    /* Der Schimmer sagt „hier kommt noch etwas" und muss deshalb im
       `finally` wieder weg: der Fehlerzweig schreibt seine Meldung in
       dasselbe Feld, und durchsichtiger Text würde sie unlesbar machen.
       Eine Fehlermeldung, die man nicht lesen kann, ist der schlechtere
       Fehler. */
    const aktivitaet = zeigeAktivitaet(ziel);
    ziel.classList.add('ki-schreibt');
    /* Ein Steuermann je Lauf (E652). Er steht im Zustand, damit der Knopf
       und `abbrechen()` denselben erreichen. */
    const steuer = new AbortController();
    zustand.abbruch = steuer;
    sendenKnopf(true);
    try {
      await frage(nachrichten, (t: any) => {
        antwort += t;
        ziel.textContent = antwort;
        const kasten = document.getElementById('chat');
        if (kasten) kasten.scrollTop = 1e9;
      }, { signal: steuer.signal });
      zustand.verlauf.push({ role: 'user', content: text });
      zustand.verlauf.push({ role: 'assistant', content: antwort });
    } catch (e: unknown) {
      /* EIN ABBRUCH IST KEIN FEHLER, und `AbortError` ist kein Satz, den
         ein Mensch lesen will. Was schon dasteht, bleibt stehen — es
         gehört dem Nutzer (§51); nur der Verlauf bekommt die halbe
         Antwort nicht, weil sie unvollständig ist. */
      const abbruch = steuer.signal.aborted
        || (e instanceof Error && e.name === 'AbortError');
      if (abbruch) {
        ziel.textContent = antwort
          ? antwort + '\n\n— Abgebrochen.'
          : 'Abgebrochen.';
      } else {
        ziel.textContent = '⚠ ' + (e instanceof Error ? e.message : String(e));
      }
    } finally {
      zustand.abbruch = null;
      sendenKnopf(false);
      ziel.classList.remove('ki-schreibt');
      aktivitaet.remove();
    }

    /* Quellen unter die Antwort */
    const qk = quellenKarte(quellen);
    if (qk && antwort) ziel.appendChild(qk);

    /* Der Chat wandert in die Seitenleiste — wie bei Notion */
    if (antwort) { chatSichern(); App.zeichneBaum(); }

    /* Zeile mit Aktionen unter der Antwort: kopieren, Daumen */
    if (antwort) {
      const tat = document.createElement('div');
      tat.className = 'msg-tat';
      tat.innerHTML = '<button data-t="kopie" title="Kopieren">⧉</button>' +
                      '<button data-t="gut" title="Gute Antwort">👍</button>' +
                      '<button data-t="schlecht" title="Daneben">👎</button>';
      tat.addEventListener('click', (e) => {
        const b = elVon(e)?.closest<HTMLElement>('[data-t]');
        if (!b) return;
        if (b.dataset.t === 'kopie') { Ablage.kopiereJetzt(antwort, 'Antwort kopiert'); }
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
          Store.addBlock(App.aktuelleSeite(), typ, { text: t, herkunft: 'ki' });
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
  /* Sechs eigene Aufträge standen hier, jeder in einer anderen Fassung als
     derselbe Befehl im Schreibmenü oder im Knopf (E724: „Zusammenfassen"
     schickte auf drei Wegen drei Anweisungen). Jetzt sagt der Block nur
     noch, WELCHER Katalogeintrag gemeint ist — `ai-summary` ist
     `zusammenfassen` —, und der eine Läufer tut den Rest. */
  const blockAktion = async (art: string, block: any) => {
    const b = kiKatalog()?.ausAlt('block', art);
    if (!b) return;
    App.kiPanel(true);
    await ausfuehren(b.id, { block,
      ...(b.ziel !== 'seite' && block?.text ? { text: String(block.text), wo: 'Block' as const } : {}) });
  };

  /* ========================================================================
   * DIE KI BAUT MIT
   * ------------------------------------------------------------------------
   * Notion lässt die KI Seiten und Datenbanken anlegen. Hier ebenso — nur
   * lokal. Das Modell antwortet in JSON, die App baut daraus echte Objekte
   * und schreibt jeden Schritt ins Protokoll, damit man ihn zurücknehmen kann.
   * ======================================================================*/
  const protokoll: any[] = [];

  const merkeSchritt = (was: any, ids: any) => {
    protokoll.push({ zeit: Store.now(), was, ids });
    if (protokoll.length > 40) protokoll.shift();
  };

  const JSON_HOLEN = (text: string) => {
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

  /* WAS EIN MODELL SCHREIBT, AUF REDIONS TYPEN. Das ist KEIN zweiter
     Katalog (§8): das Register hält die Kennungen, diese Karte fängt die
     vielen Schreibweisen dafür ab — deutsch wie englisch, denn die App
     fragt deutsch und das Modell antwortet deutsch.
     GEZÄHLT WAR SIE UNVOLLSTÄNDIG (E428): 30 Typen stehen im Register, 13
     erreichte die KI. Die übrigen fielen still auf `text` zurück, und
     „bau mir eine Bewertung und einen Fortschritt" ergab zwei Textspalten.
     Kein Fehler, keine Meldung — nur eine Datenbank, die weniger kann als
     bestellt. */
  const TYP_KARTE: Record<string, string> = {
    text:'text', zahl:'number', number:'number', auswahl:'select', select:'select',
    mehrfach:'multi', multi:'multi', status:'status', datum:'date', date:'date',
    person:'person', kontrollkästchen:'checkbox', checkbox:'checkbox', url:'url',
    email:'email', 'e-mail':'email', telefon:'phone', phone:'phone', formel:'formula',
    formula:'formula', dateien:'files', files:'files',
    /* Die sieben, die nur vergessen waren — sie brauchen nichts ausser
       ihrem Namen. */
    sterne:'sterne', bewertung:'sterne', rating:'sterne',
    prozent:'prozent', fortschritt:'prozent', progress:'prozent',
    place:'place', ort:'place', adresse:'place',
    duration:'duration', dauer:'duration', zeitspanne:'duration',
    created:'created', erstellt:'created', 'erstellt am':'created',
    edited:'edited', 'geändert':'edited', 'zuletzt geändert':'edited',
    uid:'uid', nummer:'uid', 'laufende nummer':'uid'
    /* UND WAS MIT GRUND DRAUSSEN BLEIBT: `relation` und `rollup` brauchen
       eine Zieldatenbank, die im Plan nicht steht; `gdrive`, `figma`,
       `githubpr` und `zendesk` eine eingerichtete Verbindung; `button`,
       `ki` und `verify` eine Einstellung, die niemand geraten hat. Jede
       davon entstünde leer und kaputt — eine Textspalte ist dann die
       ehrlichere Antwort, sie hält wenigstens, was hineingeschrieben wird.
       `test421 §5` hält diese Grenze fest. */
  };

  /** Baut aus einer Beschreibung eine echte Datenbank. */
  /**
   * Baut aus einem fertigen Plan eine echte Datenbank.
   * Wird von der KI-Antwort benutzt und vom Agenten — deshalb steht sie
   * für sich und nicht mitten in der Chat-Funktion.
   */
  const datenbankBauenAus = (plan: any, seiteId: string) => {
    const schema: Record<string, any> = {};
    let titelGesetzt = false;
    (plan.spalten || []).slice(0, 12).forEach((sp: any, i: any) => {
      const roh = String(sp.typ || 'text').toLowerCase();
      const istTitel = roh.startsWith('titel') || roh === 'title';
      const typ = TYP_KARTE[roh] || (istTitel ? 'title' : 'text');
      const key = istTitel && !titelGesetzt ? 'title' : 'k' + i;
      if (istTitel) titelGesetzt = true;
      schema[key] = { name: sp.name || 'Spalte ' + (i + 1), type: istTitel ? 'title' : typ };
      if (['select','multi','status'].includes(schema[key].type)) {
        const farben = ['gray','blue','green','yellow','orange','red','purple','pink','brown'];
        schema[key].options = (sp.optionen || []).slice(0, 12)
          .map((n: any, j: any) => ({ name: String(n), color: farben[j % farben.length] }));
      }
      if (schema[key].type === 'formula' && sp.formel) schema[key].formula = sp.formel;
    });
    if (!titelGesetzt) schema.title = { name: 'Name', type: 'title' };

    const { collectionId, block } = Store.addDatabase(
      seiteId || App.aktuelleSeite(), plan.name || 'Neue Datenbank', schema, plan.layout || 'table');
    if (plan.icon) Store.updateCollection(collectionId, { icon: plan.icon });

    const nachName: Record<string, string> = {};
    Object.entries<any>(schema).forEach(([k, d]) => nachName[d.name.toLowerCase()] = k);
    let zeilen = 0;
    (plan.zeilen || []).slice(0, 30).forEach((z: any) => {
      const props: Record<string, any> = {};
      let titelWert = '';
      Object.entries<any>(z).forEach(([n, v]) => {
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

  const datenbankBauen = async (auftrag: any) => {
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
                   { role: 'user', content: auftrag }], (t: any) => {
        roh += t;
        ziel.textContent = 'Entwerfe die Datenbank … ' + roh.length + ' Zeichen';
      });
    } catch (e: unknown) { ziel.textContent = '⚠ ' + (e instanceof Error ? e.message : String(e)); return; }

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
      if (elVon(e)?.closest<HTMLElement>('[data-a="weg"]')) {
        Store.trashBlock(block.id); Store.purgeBlock(block.id);
        App.zeichneSeite(); UI.toast('Wieder entfernt');
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="log"]')) protokollZeigen();
    });
    ziel.appendChild(leiste);
  };

  /** Baut eine ganze Seite mit Überschriften und Blöcken. */
  const seiteBauen = async (auftrag: any) => {
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
                  (t: any) => { roh += t; ziel.textContent = 'Baue die Seite … ' + roh.length + ' Zeichen'; });
    } catch (e: unknown) { ziel.textContent = '⚠ ' + (e instanceof Error ? e.message : String(e)); return; }

    const plan = JSON_HOLEN(roh);
    if (!plan || !Array.isArray(plan.bloecke)) {
      ziel.textContent = 'Kein brauchbares JSON. Antwort war:\n\n' + roh.slice(0, 600);
      return;
    }

    const erlaubt = ['h1','h2','h3','text','bullet','number','todo','quote','callout','divider','code'];
    const neueIds: any[] = [];
    plan.bloecke.slice(0, 30).forEach((b: any) => {
      const typ = erlaubt.includes(b.typ) ? b.typ : 'text';
      const n = Store.addBlock(seite, typ, { text: b.text || '', herkunft: 'ki' });
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
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const weg = elVon(e)?.closest<HTMLElement>('[data-weg]');
      if (!weg) return;
      const nr = Number(weg.dataset.weg);
      const p = protokoll[nr];
      if (!p) return;
      (p.ids || []).forEach((id: any) => { Store.trashBlock(id); Store.purgeBlock(id); });
      protokoll.splice(nr, 1);
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
  const wikipedia = async (begriff: any) => {
    const url = 'https://de.wikipedia.org/api/rest_v1/page/summary/' +
                encodeURIComponent(begriff.trim().replace(/\s+/g, '_'));
    const r = await holen(url, { headers: { 'Accept': 'application/json' } },
      { versuche: 3, beiWartezeit: (sek: number, nr: any) =>
          UI.toast('Wikipedia antwortet nicht — neuer Versuch ' + (nr + 1) + ' in ' + sek + ' s') });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('Wikipedia antwortet mit ' + r.status + '. ' + (FEHLERTEXT[r.status] || ''));
    const d = await r.json();
    return { titel: d.title, text: d.extract, link: d.content_urls?.desktop?.page || '' };
  };

  /** Schlägt nach und schreibt das Ergebnis in den Chat — mit Knopf zum Einfügen. */
  const nachschlagen = async (begriff: any) => {
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
        if (!elVon(e)?.closest<HTMLElement>('[data-a="ein"]')) return;
        const seite = App.aktuelleSeite();
        if (!seite) return;
        Store.addBlock(seite, 'quote', { text: t.text, herkunft: 'ki' });
        Store.addBlock(seite, 'text', { text: 'Quelle: [' + t.titel + '](' + t.link + ')',
          herkunft: 'ki' });
        App.zeichneSeite();
        UI.toast('Eingefügt');
      });
      ziel.appendChild(leiste);
    } catch (err) {
      ziel.textContent = '⚠ ' + (err instanceof Error ? err.message : String(err)) +
        ' — ohne Netz geht das Nachschlagen nicht.';
    }
  };

  /** Aus der Auswahlleiste heraus: die markierte Stelle an die KI geben. */
  const frageMitAuswahl = (auswahl: any) => {
    const ta = document.getElementById('ai-input') as HTMLTextAreaElement | null;
    if (!ta) return;
    ta.value = 'Zu dieser Stelle: „' + String(auswahl).slice(0, 500) + '"\n\n';
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    melde('Markierte Stelle übernommen — schreib dazu, was ich damit tun soll.');
  };

  const datenbankAuswerten = async (coll: any, view: any) => {
    App.kiPanel(true);
    const rows = Datenbank.zeilen(coll, view).slice(0, 60);
    const keys = Object.keys(coll.schema);
    const tabelle = [
      keys.map(k => coll.schema[k].name).join(' | '),
      ...rows.map((r: any) => keys.map(k => Formula.anzeige(Datenbank.wert(r, k, coll))).join(' | '))
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
   * EIN KATALOG, EIN LÄUFER (E724)
   * ------------------------------------------------------------------------
   * Die Befehle stehen in `Register.ki` (src/register/ki.ts): worauf sie
   * wirken, was sie verlangen, wohin das Ergebnis geht. Jeder Weg — der
   * Knopf im leeren Chat, das Befehlsmenü, „@Name" im Feld, der Schrägstrich,
   * das Blockmenü, „✨ KI" an der Markierung, die Palette — ruft `ausfuehren`
   * mit einer Kennung. Vorher gab es fünf Kataloge und zwei Läufer, und
   * derselbe Name tat je nach Weg etwas anderes (messungen §93).
   * ======================================================================*/
  type KiMarke = { text: string; bereich: Range | null; bid: string };
  type KiLauf = { text?: string; wo?: 'Markierung' | 'Block' | 'Eingabe'; block?: any;
                  name?: string; icon?: string; auftrag?: string; mark?: KiMarke | null };

  const kiKatalog = (): any => (typeof Register !== 'undefined' && Register.ki) ? Register.ki : null;

  /** Die Schreibbefehle — eine SICHT auf den Katalog, kein eigener (§8). */
  const SCHREIB_BEFEHLE: any[] = (kiKatalog()?.alle() || [])
    .filter((b: any) => b.art === 'auftrag' && b.gruppe === 'Schreiben und bearbeiten');

  /** Liegt die Markierung im Dokument (nicht im Eingabefeld der KI)? */
  const markierung = (): KiMarke | null => {
    const sel = getSelection();
    const text = String(sel || '').trim();
    if (!sel || text.length <= 3 || !sel.rangeCount) return null;
    const knoten = sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode?.parentElement;
    if (knoten?.closest('#ai')) return null;
    const blk = knoten?.closest<HTMLElement>('.blk');
    return { text, bereich: sel.getRangeAt(0).cloneRange(), bid: blk?.dataset.bid || '' };
  };

  /** Was ein Befehl bearbeitet — die Eingabe folgt dem Ziel: ausdrücklich
      Gegebenes, sonst die Markierung, sonst der Block, sonst die Seite. */
  const eingabe = (befehl: any, opt: KiLauf): { text: string; wo: string; mark: ReturnType<typeof markierung> } => {
    if (opt.text && opt.text.trim()) return { text: opt.text.trim(), wo: opt.wo || 'Markierung', mark: opt.mark || null };
    /* Die beim Öffnen des Menüs gemerkte Markierung zuerst: das Suchfeld
       des Befehlsmenüs nimmt den Fokus, und mit ihm geht die Auswahl im
       Dokument — gemessen, test599 §7b. */
    const mark = opt.mark || markierung();
    if (mark) return { text: mark.text, wo: 'Markierung', mark };
    if (opt.block && befehl.ziel !== 'seite' && String(opt.block.text || '').trim())
      return { text: String(opt.block.text), wo: 'Block', mark: null };
    return { text: seitenKontext(), wo: 'ganze Seite', mark: null };
  };

  /** Einen Katalogbefehl ausführen — der EINE Einstieg. */
  const ausfuehren = async (id: string, opt: KiLauf = {}): Promise<void> => {
    const b = kiKatalog()?.finde(id);
    if (!b) return;
    if (b.art === 'werkzeug') { await werkzeugAus(b.id); return; }
    let auftrag = opt.auftrag || kiKatalog().auftrag(b.id);
    if (b.frage && !opt.auftrag) {
      const antwort = await UI.frage(b.frage, b.vorgabe || '');
      if (!antwort) return;
      auftrag = kiKatalog().auftrag(b.id, { sprache: antwort });
    }
    await schreibLauf({ ...b, ...(opt.name ? { name: opt.name } : {}), ...(opt.icon ? { icon: opt.icon } : {}) },
                      auftrag, opt);
  };

  /** Die vier Werkzeuge, die die KI selbst ausführt. Die Vorgaben stehen im
      Katalog — die Palette hatte eine andere als der Knopf (E724). */
  const werkzeugAus = async (id: string): Promise<void> => {
    const b = kiKatalog()?.finde(id);
    if (!b) return;
    if (id === 'protokoll') { protokollZeigen(); return; }
    let vorschlag = b.vorgabe || '';
    if (id === 'nachschlagen')
      vorschlag = (markierung()?.text || '') || (Store.getBlock(App.aktuelleSeite())?.text || '');
    const antwort = await UI.frage(b.frage || b.name, vorschlag);
    if (!antwort) return;
    if (id === 'datenbank') datenbankBauen(antwort);
    if (id === 'seite') seiteBauen(antwort);
    if (id === 'nachschlagen') nachschlagen(antwort);
  };

  /** Eine Fähigkeit ausführen. Die eingebauten zeigen auf ihren
      Katalogeintrag (`alt.faehig`) und schicken DESSEN Anweisung; eigene
      bringen ihre mit. Beide laufen durch denselben Läufer: der Text
      (Markierung oder Seite) ist die Eingabe, nicht die Anweisung — vorher
      schickte „Korrekturlesen" mit Markierung NUR die Anweisung. */
  const faehigkeitAusfuehren = async (f: any, opt: KiLauf = {}): Promise<void> => {
    const b = kiKatalog()?.ausAlt('faehig', f.id);
    /* Hat jemand die Anweisung einer eingebauten Fähigkeit umgeschrieben,
       gilt SEINE (sie steht in `meta`, sie gehört ihm) — Ziel und Ausgabe
       kommen trotzdem aus dem Katalog. Sonst die eine Katalogfassung. */
    const start = FAEHIG_START.find(x => x.id === f.id);
    const eigeneZeile = !!f.auftrag && !!start && f.auftrag !== start.auftrag;
    if (b) { await ausfuehren(b.id, { ...opt, name: f.name, icon: f.icon || b.icon,
                                      ...(eigeneZeile ? { auftrag: f.auftrag } : {}) }); return; }
    await schreibLauf({ id: f.id, name: f.name, icon: f.icon || '🧩', ziel: 'markierung', ausgabe: 'ersetzen' },
                      f.auftrag, opt);
  };

  /** Ein Rechteck aus einem Knopf, einem Rechteck oder nichts. */
  const rechteckVon = (anker: any): { left: number; top: number; bottom: number } => {
    if (anker && typeof anker.getBoundingClientRect === 'function') return anker.getBoundingClientRect();
    if (anker && typeof anker.left === 'number') return { left: anker.left, top: anker.top, bottom: anker.bottom ?? anker.top };
    return { left: innerWidth / 2 - 130, top: 160, bottom: 120 };
  };

  /** Ein Menü an seinem Knopf: `aria-expanded` an und aus, und wenn das Menü
      geht und der Fokus mit ihm, bekommt der Knopf ihn zurück (E302). */
  const amKnopf = (anker: any, m: HTMLElement): void => {
    if (!(anker instanceof HTMLElement)) return;
    anker.setAttribute('aria-expanded', 'true');
    const w = new MutationObserver(() => {
      if (m.isConnected) return;
      w.disconnect();
      anker.setAttribute('aria-expanded', 'false');
      const a = document.activeElement;
      if (anker.isConnected && (!a || a === document.body || !a.isConnected))
        anker.focus({ preventScroll: true });
    });
    w.observe(document.body, { childList: true });
  };

  /**
   * DAS EINE BEFEHLSMENÜ (E724) — Schreibbefehle, Fähigkeiten und die
   * Bau-Werkzeuge in einer durchsuchbaren Liste. Geöffnet von „Schreiben"
   * im leeren Chat, „+ → Befehle und Fähigkeiten", „✨ KI" an der Markierung,
   * „Mit KI bearbeiten" am Block und „Mit KI verwenden → Schreiben" an der
   * Seite. `schreibMenue` und `faehigkeitenMenue` sind seine zwei Türen.
   */
  const befehlsMenue = (anker: any, opt: { text?: string; block?: any; zuerst?: 'faehig' | 'schreiben' } = {}) => {
    const r = rechteckVon(anker);
    /* Die Markierung wird beim ÖFFNEN gemerkt — auch wenn die Auswahlleiste
       den Text mitgibt. Gleich nimmt das Suchfeld den Fokus und mit ihm die
       Auswahl im Dokument; ohne Marke fiel „Markierung ersetzen" auf „als
       neuen Block anhängen" zurück (Durchsicht 10. Oktober, test599 §7h). */
    const mark = markierung();
    const liste = faehigkeiten();
    /* Eine eingebaute Fähigkeit IST ihr Katalogeintrag — beide zu zeigen
       wäre derselbe Befehl zweimal unter zwei Namen. Sie steht EINMAL da,
       als Fähigkeit, und trägt die Kennung des Befehls mit (`data-sb`). */
    const katalogVon = (f: any): any => kiKatalog()?.ausAlt('faehig', f.id);
    const verdeckt = new Set(liste.map((f: any) => katalogVon(f)?.id).filter(Boolean));
    const befehle = (kiKatalog()?.alle() || []).filter((b: any) => !verdeckt.has(b.id));
    const zeile = (b: any) => `<button data-sb="${esc(b.id)}"><span class="mi">${b.icon}</span>${esc(b.name)}</button>`;
    const fHtml = '<div class="grp">Fähigkeiten</div>' + liste.map((f: any) =>
      `<button data-f="${esc(f.id)}"${katalogVon(f) ? ` data-sb="${esc(katalogVon(f).id)}"` : ''}>` +
      `<span class="mi">${esc(f.icon || '🧩')}</span>${esc(f.name)}</button>`).join('');
    const sHtml = '<div class="grp">Schreiben und bearbeiten</div>' +
      befehle.filter((b: any) => b.art === 'auftrag').map(zeile).join('');
    const bHtml = (opt.text || opt.block) ? '' : '<div class="grp">Bauen und nachschlagen</div>' +
      befehle.filter((b: any) => b.art === 'werkzeug').map(zeile).join('');
    const vorn = opt.text
      ? '<button data-k="fragen"><span class="mi">💬</span>Zu dieser Stelle fragen</button>' : '';
    const m = UI.menuMitSuche(
      vorn + (opt.zuerst === 'faehig' ? fHtml + sHtml : sHtml + fHtml) + bHtml +
      '<hr><button data-f="__neu"><span class="mi">＋</span>Fähigkeit hinzufügen</button>' +
      '<button data-f="__verw"><span class="mi">⚙</span>Fähigkeiten verwalten</button>',
      r.left - 40, Math.max(12, r.top - 300),
      { platzhalter: 'Befehl oder Fähigkeit suchen …', titel: 'KI-Befehle',
        /* Am Telefon trägt das Blatt den Titel; der Kopf stünde gleich
           darunter noch einmal (gesehen im Bild, test599 §6). */
        kopf: UI.amTelefon() ? '' : '<div class="grp">KI-Befehle</div>',
        /* „@" kennt die Schreibbefehle und die Fähigkeiten (`atBefehl`), die
           Bau-Werkzeuge nicht — sie fragen zuerst, was gebaut werden soll. */
        fuss: 'Schreibbefehle und Fähigkeiten auch im Chat mit <b>@</b> vor dem Namen.',
        ...(anker instanceof HTMLElement ? { anker } : {}) });
    amKnopf(anker, m);
    m.addEventListener('click', async e => {
      const k = elVon(e)?.closest<HTMLElement>('[data-k], [data-sb], [data-f]');
      if (!k) return;
      m.remove();
      if (k.dataset.k === 'fragen') { App.kiPanel(true); frageMitAuswahl(opt.text); return; }
      if (k.dataset.f === '__neu')  { faehigkeitBearbeiten(); return; }
      if (k.dataset.f === '__verw') { faehigkeitenVerwalten(); return; }
      const lauf: KiLauf = { ...(opt.text ? { text: opt.text, wo: 'Markierung' as const } : {}),
                             ...(opt.block ? { block: opt.block } : {}), mark };
      const f = k.dataset.f ? liste.find((x: any) => x.id === k.dataset.f) : null;
      if (f) { await faehigkeitAusfuehren(f, lauf); return; }
      if (k.dataset.sb) await ausfuehren(k.dataset.sb, lauf);
    });
    return m;
  };

  /** Tür zum Befehlsmenü, die Schreibbefehle zuerst (schale.ts, „Schreiben"). */
  const schreibMenue = (anker2: any) => befehlsMenue(anker2, { zuerst: 'schreiben' });

  /** Eigene Statuszeile: Streaming ersetzt den Antworttext, nicht den Status.
      Entfernen in finally gilt auch bei Fehlern und abgebrochenen Anfragen. */
  const zeigeAktivitaet = (ziel: HTMLElement): HTMLElement => {
    const status = document.createElement('div');
    status.className = 'ki-aktivitaet';
    status.setAttribute('role', 'status');
    status.append(Zustand.aktivitaet('ki'), document.createTextNode('KI arbeitet …'));
    ziel.before(status);
    return status;
  };

  /** Karteikarten aus „Frage :: Antwort"-Zeilen — echte Blöcke (E724, D7).
      Vorher landeten sie als Textzeilen auf der Seite, und die Lernwelt
      zählte keine einzige. */
  const alsKarteikarten = (text: string, seite = App.aktuelleSeite()): number => {
    const page = Store.getBlock(seite);
    if (!page || page.alive === false || page.type !== 'page' || !Konten.darf('bearbeiten', seite)) {
      UI.toast('Auf dieser Seite darfst du keine Karten anlegen.'); return 0;
    }
    const titel = String(page.text || 'Lernkarten');
    const karten = String(text || '').split('\n').map(z => z.replace(/^[-*•\d.\s]+/, '').trim())
      .map(z => z.split('::').map(t=>t.trim())).filter(z=>z.length===2&&z.every(t=>t&&t.length<=2000)).slice(0,20);
    karten.forEach(([frage,antwort])=>Store.addBlock(seite,'flashcard',{
      text:frage+' :: '+antwort,herkunft:'ki',
      quiz:{kind:'schreiben',format:'flashcard',kapitel:titel,thema:titel,topic:titel,quelle:titel,pruefung:false,musterloesung:[antwort]}
    }));
    if(karten.length){App.zeichneSeite();UI.toast(karten.length+' Karteikarten eingefügt');}
    else UI.toast('In der Antwort steht keine gültige Zeile „Frage :: Antwort“');
    return karten.length;
  };

  /**
   * DER LÄUFER. Die Signatur `schreibLauf(befehl, auftrag)` bleibt (test429);
   * dazu kommt, worauf er wirkt (`opt`). Die Eingabe folgt dem Ziel des
   * Befehls, die Knöpfe unter der Antwort seiner Ausgabe.
   */
  const schreibLauf = async (befehl: any, auftrag: any, opt: KiLauf = {}) => {
    const quelle = eingabe(befehl, opt);
    const kartenZiel = App.aktuelleSeite();
    if (!quelle.text.trim()) { UI.toast('Es gibt noch keinen Text.'); return; }

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
                   { role: 'user', content: quelle.text.slice(0, 9000) }], (t: any) => {
        antwort += t;
        ziel.textContent = antwort;
        const kasten2 = document.getElementById('chat');
        if (kasten2) kasten2.scrollTop = 1e9;
      });
    } catch (e: unknown) { ziel.textContent = '⚠ ' + (e instanceof Error ? e.message : String(e)); return; }
    finally { ziel.classList.remove('ki-schreibt'); aktivitaet.remove(); }

    /* Die Knöpfe folgen der Ausgabe. „Ersetzen" gibt es nur, wo es etwas
       zu ersetzen gibt (Markierung oder Block) — und im Modus „Fragen" gar
       nicht: dort darf die KI nichts ändern. */
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
    leiste.addEventListener('click', async e => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'kopieren') { Ablage.kopiereJetzt(antwort, 'Kopiert'); }
      if (b.dataset.a === 'nochmal')  { schreibLauf(befehl, auftrag, opt); }
      if (b.dataset.a === 'darunter') { alsBloeckeEinfuegen(antwort); }
      if (b.dataset.a === 'karteikarten') { if (alsKarteikarten(antwort, kartenZiel) > 0) b.setAttribute('disabled',''); }
      if (b.dataset.a === 'ersetzen') await ersetzen(antwort, quelle, opt);
    });
    ziel.appendChild(leiste);
  };

  /** Die Seite, zu der ein Block gehört — für die Fassung vor dem Tausch. */
  const seiteDesBlocks = (id: string): string => {
    let b = id ? Store.getBlock(id) : null;
    for (let n = 0; b && n < 40; n++) {
      if (b.type === 'page') return b.id;
      b = b.parentId ? Store.getBlock(b.parentId) : null;
    }
    return App.aktuelleSeite();
  };

  /** Eine Fassung „vor KI-Änderung" — VOR dem Schreiben, wie bei den
      Werkzeugen des Agenten (E656, §21: KI-Ausgaben versioniert). Misslingt
      sie, wird nichts geändert: der Tausch ohne Rückweg wäre der Schaden. */
  const fassungVorKi = async (blockId: string): Promise<boolean> => {
    try { await Store.versionSpeichern(seiteDesBlocks(blockId), 'vor KI-Änderung'); return true; }
    catch (e: unknown) {
      UI.toast('Die Sicherungsfassung liess sich nicht schreiben, deshalb wurde nichts ersetzt: ' +
               (e instanceof Error ? e.message : String(e)));
      return false;
    }
  };

  /** Ersetzen — im gespeicherten Text, nicht im gezeichneten. Steht die
      Markierung genau einmal im Block, wird sie dort getauscht; das Markdown
      drumherum bleibt (vorher wurde `ct.textContent` zurückgeschrieben, und
      jede Auszeichnung im Block ging verloren — der Fehler aus E668).
      Vor jedem Tausch eine Fassung, und der Block trägt `herkunft: 'ki'`
      (E307/E656): der Streifen sagt „hier war die KI". */
  const ersetzen = async (antwort: string, quelle: ReturnType<typeof eingabe>, opt: KiLauf): Promise<void> => {
    if (quelle.wo === 'Block' && opt.block?.id) {
      if (!await fassungVorKi(opt.block.id)) return;
      Store.updateBlock(opt.block.id, { text: antwort, herkunft: 'ki' });
      App.zeichneSeite(); UI.toast('Ersetzt'); return;
    }
    const mark = quelle.mark;
    const bl = mark?.bid ? Store.getBlock(mark.bid) : null;
    const alt = String(bl?.text || '');
    const i = mark ? alt.indexOf(mark.text) : -1;
    if (bl && mark && i >= 0 && alt.indexOf(mark.text, i + 1) < 0) {
      if (!await fassungVorKi(bl.id)) return;
      Store.updateBlock(bl.id, { text: alt.slice(0, i) + antwort + alt.slice(i + mark.text.length), herkunft: 'ki' });
      App.zeichneSeite(); UI.toast('Ersetzt'); return;
    }
    /* Nicht eindeutig zu finden (die Markierung läuft über Auszeichnung
       hinweg oder steht zweimal da): wie bisher an der Markierung selbst. */
    const sel = getSelection();
    const bereich = sel && sel.rangeCount && String(sel).trim() ? sel.getRangeAt(0)
      : (mark?.bereich && mark.bereich.startContainer.isConnected ? mark.bereich : null);
    if (!bereich) { alsBloeckeEinfuegen(antwort); return; }
    const blk = (bereich.startContainer instanceof Element ? bereich.startContainer : bereich.startContainer.parentElement)?.closest?.('.blk');
    const bid = blk instanceof HTMLElement ? blk.dataset.bid || '' : '';
    if (bid && !await fassungVorKi(bid)) return;
    bereich.deleteContents();
    bereich.insertNode(document.createTextNode(antwort));
    const ct = blk?.querySelector('.ct');
    if (bid && ct) Store.updateBlock(bid, { text: ct.textContent, herkunft: 'ki' });
    UI.toast('Ersetzt');
  };

  /** „@Name …" am Anfang des Feldes: eine Fähigkeit oder ein Befehl, der
      Rest ist sein Text (E724, D10). Das stand seit Langem im Menü („Im Chat
      auch mit @ vor dem Namen aufrufbar") und war nirgends gebaut. Der
      längste passende Name gewinnt — „Ton: locker" vor „Ton". */
  const atBefehl = (text: string): { f?: any; b?: any; rest: string } | null => {
    if (!text.startsWith('@')) return null;
    const roh = text.slice(1);
    const klein = roh.toLowerCase();
    const kandidaten: { name: string; f?: any; b?: any }[] = [
      ...faehigkeiten().map((f: any) => ({ name: String(f.name || ''), f })),
      ...(kiKatalog()?.alle() || []).filter((b: any) => b.art === 'auftrag').map((b: any) => ({ name: b.name, b }))
    ].filter(k => k.name && klein.startsWith(k.name.toLowerCase()) &&
                  (roh.length === k.name.length || /\s/.test(roh.charAt(k.name.length))));
    if (!kandidaten.length) return null;
    kandidaten.sort((a, b) => b.name.length - a.name.length);
    const k = kandidaten[0]!;
    /* Eine ERWÄHNTE Seite geht vor, wenn ihr Titel mindestens so lang passt:
       „@Zusammenfassen Woche …" ist die Seite „Zusammenfassen Woche", kein
       Befehl „Zusammenfassen" auf „Woche …" (Durchsicht 10. Oktober). */
    const seite = [...erwaehnt.values()].some(t => t.length >= k.name.length && klein.startsWith(t.toLowerCase()) &&
      (roh.length === t.length || /\s/.test(roh.charAt(t.length))));
    if (seite) return null;
    return { ...(k.f ? { f: k.f } : {}), ...(k.b ? { b: k.b } : {}), rest: roh.slice(k.name.length).trim() };
  };

  /** Antworttext als richtige Blöcke ablegen — inklusive Markdown-Tabellen. */
  const alsBloeckeEinfuegen = (text: string) => {
    const zeilen = String(text || '').split('\n');
    const seite = App.aktuelleSeite();
    let tabelle: any = null;

    /* Eine angefangene Tabelle abschliessen, bevor etwas anderes kommt. */
    const tabelleAbschliessen = () => {
      if (!tabelle) return;
      Store.addBlock(seite, 'table', { rows: tabelle.rows, kopfZeile: true, herkunft: 'ki' });
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
      Store.addBlock(seite, typ, { text: t, herkunft: 'ki' });
    });
    tabelleAbschliessen();

    App.zeichneSeite();
    UI.toast('In die Seite eingefügt');
  };

  /* ========================================================================
   * PERSONALISIEREN, FÄHIGKEITEN, DIKTAT, SEITENLEISTE
   * ======================================================================*/

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
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const g = elVon(e)?.closest<HTMLElement>('[data-g]');
      const namensFeld = () => o.querySelector<HTMLInputElement>('#pers-name');
      const anwFeld = () => o.querySelector<HTMLTextAreaElement>('#pers-anw');
      if (g) { p.gesicht = g.dataset.g; const n = namensFeld()?.value ?? '';
               const a = anwFeld()?.value ?? ''; zeichne();
               const nf = namensFeld(), af = anwFeld();
               if (nf) nf.value = n; if (af) af.value = a; return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="ok"]')) {
        p.name = (namensFeld()?.value ?? '').trim() || 'KI';
        Store.setMeta('kiPersona', p);
        Store.setMeta('ki:persoenlich', (anwFeld()?.value ?? '').trim());
        o.remove();
        const kopf = document.querySelector('.ai-head b');
        if (kopf) kopf.textContent = p.gesicht + ' ' + p.name;
        App.zeichneBaum();
        UI.toast('Gemerkt: ' + p.gesicht + ' ' + p.name);
      }
    });
  };

  /** Tür zum Befehlsmenü, die Fähigkeiten zuerst (E724: ein Menü, nicht
      zwei — die Fähigkeiten und die Schreibbefehle sind EINE Liste). */
  const faehigkeitenMenue = (anker: any) => befehlsMenue(anker, { zuerst: 'faehig' });

  const faehigkeitBearbeiten = async (vorhanden?: any) => {
    const name = await UI.frage('Wie heisst die Fähigkeit?', vorhanden ? vorhanden.name : '');
    if (!name) return;
    const auftrag = await UI.frage('Was soll die KI dabei tun?',
      vorhanden ? vorhanden.auftrag : 'Fasse den markierten Text in drei Sätzen zusammen.');
    if (!auftrag) return;
    const icon = await UI.frage('Ein Zeichen dafür', vorhanden ? vorhanden.icon : '🧩');
    faehigkeitSichern({ id: vorhanden ? vorhanden.id : Store.uid().slice(0, 6),
                        name, auftrag, icon: icon || '🧩' });
    UI.toast('Fähigkeit gemerkt: ' + name);
  };

  /** Die Fähigkeiten verwalten. Jede Zeile hat ZWEI Knöpfe (E724): den
      Namen zum Bearbeiten und einen eigenen Löschknopf mit dem Paar aus
      E709 (`data-loeschknopf`) — erst „Löschen" in Rot, dann wirkt es;
      Escape bricht ab. Vorher war „löschen" ein Wort IM Zeilenknopf: mit
      der Tastatur unerreichbar (Enter hiess Bearbeiten), und ein Klick
      löschte sofort. */
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
            liste.map((f: any) => '<div class="we-zeile">' +
              `<button class="we-zeile-name" data-b="${esc(f.id)}"><span>${esc(f.icon || '🧩')}</span>${esc(f.name)}</button>` +
              `<button class="we-zeile-weg" data-w="${esc(f.id)}" data-loeschknopf="Löschen" ` +
                /* Der Hinweis nennt, WAS gelöscht wird — ein nacktes „Löschen"
                   hörte der Vorleser als „Löschen: Löschen" (test586, E709). */
                `aria-label="Fähigkeit „${esc(f.name)}“ löschen" title="Fähigkeit „${esc(f.name)}“ löschen">🗑</button></div>`).join('') +
          '</div>' +
          '<div class="we-fuss"><button class="we-knopf" data-a="neu">Fähigkeit hinzufügen</button></div>' +
        '</div>';
    };
    zeichne();
    document.body.appendChild(o);
    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const w = elVon(e)?.closest<HTMLElement>('[data-w]');
      if (w) { faehigkeitLoeschen(w.dataset.w); zeichne(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="neu"]')) { await faehigkeitBearbeiten(); zeichne(); return; }
      const b = elVon(e)?.closest<HTMLElement>('[data-b]');
      if (b) { await faehigkeitBearbeiten(faehigkeiten().find((f: any) => f.id === b.dataset.b)); zeichne(); }
    });
  };

  /** Diktieren über die Spracherkennung des Browsers — kostenlos. */
  let hoert: any = null;
  const diktat = (feld: any) => {
    /* Die Spracherkennung gibt es nur in Chrome, Edge und Safari — und in
       keiner Typendatei. */
    const SR = (window as Window & { SpeechRecognition?: new () => any;
                                     webkitSpeechRecognition?: new () => any })
      .SpeechRecognition ||
      (window as Window & { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (!SR) { UI.toast('Dieser Browser kann nicht zuhören. Safari und Chrome können es.'); return; }
    if (hoert) { hoert.stop(); hoert = null; document.getElementById('ai-diktat')?.classList.remove('an'); return; }
    hoert = new SR();
    hoert.lang = 'de-DE';
    hoert.interimResults = true;
    hoert.continuous = true;
    let fest = feld.value;
    hoert.addEventListener('result', (e: any) => {
      let zwischen = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fest += t; else zwischen += t;
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

  /**
   * Der Chat-Reiter der Seitenleiste: Agenten oben, darunter der Verlauf
   * nach Tagen gruppiert — so wie Notion es zeigt.
   */
  /* ==========================================================================
   * DER CHATVERLAUF — EIN ZEICHNER, ZWEI ORTE (E273, L93)
   * --------------------------------------------------------------------------
   * Die Liste stand fest in `seitenleiste()`. Am Telefon war das richtig; am
   * Rechner ist die Seitenleiste seit E272 Phase F `display:none`, und
   * `seitenleiste` wird von nirgends sonst gerufen — der ganze Verlauf war
   * dort nicht mehr zu erreichen. `chatsGruppiert()` und `chatOeffnen(id)`
   * gab es die ganze Zeit; sie riefen nur nirgends.
   *
   * Statt einer zweiten Liste im Panel (§8) steht der Zeichner jetzt hier
   * und wird von beiden Orten gerufen: von `seitenleiste(baum)` am Telefon
   * und von `verlauf()` im Kopf des KI-Fensters.
   *
   * Warum im KI-Fenster und nicht an der Kontextkante: die KI ist kein Ort,
   * sondern ein Panel neben dem Inhalt. `kiPanel` lässt `sonder` und
   * `seiteId` in Ruhe, `App.schauplatz()` bleibt beim Editor oder wo man
   * gerade war — es gibt keinen Schauplatz `ki`, auf den sich ein
   * Kantenknopf melden könnte. Das Fenster ist sein eigenes Zuhause.
   * ========================================================================*/
  const chatBaum = (ziel: HTMLElement): void => {
    chatsGruppiert().forEach(([name, chats]: any) => {
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
      /* DREI EMOJI WENIGER (E202, E273). Die Liste stand nur in der
         Seitenleiste des Telefons; seit sie auch im KI-Fenster am Rechner
         steht, ist sie Schale, und dort haben Emoji nichts zu suchen —
         💬 war ein blaugrauer Fleck in einer Reihe einfarbiger Striche.
         Der Stern für „angeheftet" folgt E200: EIN Zeichen, der Zustand
         steckt in der Klasse, nicht in einem zweiten Bildchen. */
      const zeichen = (id: string, gr = 15): string => {
        try { return Register.symbole.alsSvg(id, gr) || ''; } catch { return ''; }
      };
      liste.innerHTML = chats.map((c: any) =>
        `<button class="side-item ki-chat${c.id === zustand.chatId ? ' on' : ''}" data-c="${c.id}">` +
        `<span>${zeichen('comment')}</span><span class="kc-txt">${esc(c.titel)}` +
        `<em class="kc-wann">${esc(wieLange(c.wann))}</em></span>` +
        `<span class="ki-pin${c.angeheftet ? ' on' : ''}" data-pin="${c.id}" ` +
        `title="${c.angeheftet ? 'Nicht mehr anheften' : 'Anheften'}">` +
        `${zeichen('star', 13)}</span>` +
        `<span class="ki-weg" data-weg="${c.id}" data-loeschknopf title="Chat löschen">` +
        `${zeichen('close', 13)}</span></button>`).join('');
      liste.addEventListener('click', e => {
        const pin = elVon(e)?.closest<HTMLElement>('[data-pin]');
        if (pin) { e.stopPropagation(); chatAnheften(pin.dataset.pin); return; }
        const weg = elVon(e)?.closest<HTMLElement>('[data-weg]');
        if (weg) { e.stopPropagation(); chatLoeschen(weg.dataset.weg); return; }
        const b = elVon(e)?.closest<HTMLElement>('[data-c]');
        if (b) chatOeffnen(b.dataset.c);
      });
      ziel.appendChild(liste);
    });
  };

  /**
   * Der Verlauf als Überlagerung — der Weg dorthin am Rechner.
   *
   * `fokus.ts` gibt jeder `.overlay` Rolle, Fokusfalle und den Weg zurück;
   * deshalb steht hier weder `role` noch ein eigener Esc-Griff.
   */
  const verlauf = (): void => {
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

    /* Ein Klick auf eine Unterhaltung öffnet sie UND schliesst die Liste.
       `chatBaum` weiss davon nichts — es kennt nur seinen eigenen Ort. */
    koerper.addEventListener('click', e => {
      if (elVon(e)?.closest<HTMLElement>('[data-c]') &&
          !elVon(e)?.closest<HTMLElement>('[data-pin]') &&
          !elVon(e)?.closest<HTMLElement>('[data-weg]')) o.remove();
    });

    o.appendChild(k);
    o.addEventListener('click', e => { if (e.target === o) o.remove(); });
    document.body.appendChild(o);
  };

  const seitenleiste = (baum: any) => {
    const p = persona();
    const kopf = document.createElement('div');
    kopf.className = 'side-section';
    kopf.innerHTML = '<span>KI</span>';
    baum.appendChild(kopf);

    const agenten = document.createElement('div');
    agenten.className = 'ki-agenten';
    agenten.innerHTML =
      `<button data-a="ki"><span class="ka-bild">${p.gesicht}</span><b>${esc(p.name)}</b></button>` +
      Agent.eigene().slice(0, 3).map((a: any) =>
        `<button data-a="${esc(a.id)}"><span class="ka-bild">${a.icon || '🤖'}</span>` +
        `<b>${esc(a.name)}</b></button>`).join('') +
      '<button data-a="neu"><span class="ka-bild ka-neu">＋</span><b>Neuer Agent</b></button>';
    agenten.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'ki')  { App.kiPanel(true); return; }
      if (b.dataset.a === 'neu') { Agent.eigenerDialog(); return; }
      Agent.panel(b.dataset.a);
    });
    baum.appendChild(agenten);

    chatBaum(baum);

    if (!chatsGruppiert().length) {
      /* Vorher stand hier eine graue Zeile in 12,5 Pixeln: „Noch keine
         Unterhaltung." Das sagt, DASS nichts da ist — nicht, was es hier
         gäbe und wie man anfängt. Jetzt dieselbe Form wie im Posteingang. */
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
        if (elVon(e)?.closest<HTMLElement>('[data-a="neuerchat"]')) neuerChat();
      });
      baum.appendChild(leer);
    }
  };

  /**
   * Die Wahl hinter „@" und „+ → Seite erwähnen" (E724). Getippt, zeigt sie
   * Fähigkeiten UND Seiten; aus dem „+" nur Seiten — der Eintrag heisst
   * „Seite erwähnen", und Personen gibt es in Redion nicht. Eine gewählte
   * Seite wird Kontext der nächsten Frage (`erwaehnt`).
   */
  const erwaehnenMenue = (ta: HTMLTextAreaElement, anker: any, mitFaehig: boolean, atStelle = -1) => {
    const r = rechteckVon(anker);
    const neu = (a: any, b: any) => String(b.edited || '').localeCompare(String(a.edited || ''));
    const alle = Object.values<any>(Store.cache.blocks).filter(x => x.type === 'page' && x.alive !== false);
    const seiten = alle.filter(x => x.parentTable !== 'collection').sort(neu).slice(0, 60);
    /* Datenbankzeilen sind Seiten (§17) und waren vor E724 erwähnbar — sie
       stehen nach den Seiten in einer eigenen Gruppe, statt zu fehlen (§43). */
    const zeilen = alle.filter(x => x.parentTable === 'collection').sort(neu).slice(0, 40);
    const fRows = mitFaehig
      ? '<div class="grp">Fähigkeiten</div>' + faehigkeiten().map((f: any) =>
          `<button data-f="${esc(f.id)}"><span class="mi">${esc(f.icon || '🧩')}</span>${esc(f.name)}</button>`).join('')
      : '';
    const m = UI.menuMitSuche(
      fRows + '<div class="grp">Seiten</div>' +
      seiten.map(p => `<button data-s="${esc(p.id)}">${esc(p.icon || '📄')} ${esc(p.text || 'Ohne Titel')}</button>`).join('') +
      (zeilen.length ? '<div class="grp">Datenbankzeilen</div>' +
        zeilen.map(p => `<button data-s="${esc(p.id)}">${esc(p.icon || '▦')} ${esc(p.text || 'Ohne Titel')}</button>`).join('') : ''),
      r.left, Math.max(12, r.top - 300),
      { platzhalter: mitFaehig ? 'Fähigkeit oder Seite suchen …' : 'Seite suchen …',
        titel: mitFaehig ? 'Erwähnen' : 'Seite erwähnen',
        kopf: UI.amTelefon() ? '' : '<div class="grp">' + (mitFaehig ? 'Erwähnen' : 'Seite erwähnen') + '</div>' });
    /* Das getippte „@" fällt weg, wenn gewählt wird — es wird ersetzt. */
    const ohneAt = (): string => atStelle >= 0 && ta.value.charAt(atStelle) === '@'
      ? ta.value.slice(0, atStelle) + ta.value.slice(atStelle + 1) : ta.value;
    m.addEventListener('click', ev2 => {
      const s = elVon(ev2)?.closest<HTMLElement>('[data-s], [data-f]');
      if (!s) return;
      m.remove();
      if (s.dataset.f) {
        const f = faehigkeiten().find((x: any) => x.id === s.dataset.f);
        if (f) ta.value = '@' + f.name + ' ' + ohneAt().trimStart();
      } else {
        const p = Store.getBlock(s.dataset.s);
        const titel = (p?.text || 'Seite');
        if (p) erwaehnt.set(p.id, titel);
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

  /** Das Quellenmenü am Prompt (E724) — die fünf Schalter, „Nur aus meinen
      Quellen" und der Weg zu allen KI-Einstellungen. */
  const quellenMenue = (anker: HTMLElement) => {
    const r = anker.getBoundingClientRect();
    const nur = Kontext.nurQuellen();
    /* DIESELBEN Schalter wie überall (§8) — gleich im Markup, damit das Menü
       mit seiner wahren Höhe gesetzt wird (nachträglich eingehängt wuchs es
       über den Bildrand hinaus, gesehen im Bild). */
    const m = UI.menu(
      '<div class="grp">Quellen für die nächste Frage</div>' +
      `<div class="ki-quellschalter">${quellenKnoepfe()}</div>` +
      `<button data-y="nur" aria-pressed="${nur}" title="Findet sich in deinen Quellen nichts, wird das Modell nicht gefragt">` +
        '<span class="mi">◎</span>Nur aus meinen Quellen' +
        (nur ? '<span class="ms">✓</span>' : '') + '</button>' +
      '<hr><button data-y="einst"><span class="mi">⚙</span>Alle KI-Einstellungen</button>',
      r.left, Math.max(12, r.top - 300), { anker, titel: 'Quellen' });
    const leiste = m.querySelector<HTMLElement>('.ki-quellschalter');
    if (leiste) quellenBinden(leiste);
    amKnopf(anker, m);
    m.addEventListener('click', ev => {
      const b = elVon(ev)?.closest<HTMLElement>('[data-y]');
      if (!b) return;
      if (b.dataset.y === 'nur') {
        const an = !Kontext.nurQuellen();
        Kontext.nurQuellenSetzen(an);
        b.setAttribute('aria-pressed', String(an));
        b.querySelector('.ms')?.remove();
        if (an) b.insertAdjacentHTML('beforeend', '<span class="ms">✓</span>');
        UI.toast(an ? 'Nur aus meinen Quellen: an' : 'Nur aus meinen Quellen: aus');
      }
      if (b.dataset.y === 'einst') { m.remove(); App.einstellungen('ki'); }
    });
    return m;
  };

  /** Das ⋯ im Kopf (E724): Agent, Besprechung und Protokoll öffnen eigene
      Flächen und sind im Chat selten — dazu die Einstellungen der KI. */
  const mehrMenue = (anker: HTMLElement) => {
    const r = anker.getBoundingClientRect();
    const mcp = (Store.getMeta('mcp:server', []) || []).length;
    const m = UI.menu(
      '<button id="ai-agent" data-y="agent"><span class="mi">🤖</span>Agent<span class="sub">Mehrstufige Aufgaben</span></button>' +
      '<button id="ai-meeting" data-y="meeting"><span class="mi">🎙</span>Besprechung<span class="sub">Aufnehmen, mitschreiben, auswerten</span></button>' +
      '<button id="ai-log" data-y="log"><span class="mi">🕘</span>Protokoll<span class="sub">Was die KI gebaut hat</span></button>' +
      '<hr>' +
      '<button data-y="verw"><span class="mi">🧩</span>Fähigkeiten verwalten</button>' +
      '<button data-y="pers"><span class="mi">🎨</span>Personalisieren</button>' +
      `<button data-y="mcp"><span class="mi">⇄</span>MCP-Server<span class="ms">${mcp}</span></button>` +
      '<button data-y="einst"><span class="mi">⚙</span>KI-Einstellungen</button>',
      Math.max(12, r.right - 260), r.bottom + 6,
      { anker, titel: 'Mehr KI-Funktionen', tropfen: [
        { id: 'agent',   name: 'Agent',       zeichen: 'robot',   ziel: '[data-y="agent"]' },
        { id: 'meeting', name: 'Besprechung', zeichen: 'mic',     ziel: '[data-y="meeting"]' },
        { id: 'log',     name: 'Protokoll',   zeichen: 'history', ziel: '[data-y="log"]' }] });
    amKnopf(anker, m);
    m.addEventListener('click', ev => {
      const b = elVon(ev)?.closest<HTMLElement>('button[data-y]');
      if (!b) return;
      m.remove();
      const y = b.dataset.y;
      if (y === 'agent')   Agent.panel();
      if (y === 'meeting') Meeting.panel();
      if (y === 'log')     protokollZeigen();
      if (y === 'verw')    faehigkeitenVerwalten();
      if (y === 'pers')    personalisieren();
      if (y === 'mcp')     App.einstellungen('mcp');
      if (y === 'einst')   App.einstellungen('ki');
    });
    return m;
  };

  /*
   * DAS FENSTER (E724). Bis hier stand eine Schublade „Werkzeuge & Kontext"
   * über der Eingabe — 19 Bedienelemente in einem 324 px hohen Kasten mit
   * eigener Rolle, nach THEMA geordnet (E528). Redur: „du muss entscheiden
   * was wo kommt und warum". Jetzt wohnt jeder Eintrag dort, wo das ist,
   * worauf er wirkt:
   *   · die Quellen am Prompt (`#ai-quellen`) — sie entscheiden, was die
   *     NÄCHSTE Frage sieht;
   *   · die Seitenaktionen im leeren Chat („Für diese Seite", `.ai-start`)
   *     — ihr Ziel ist die offene Seite, und dort fängt man an;
   *   · Nachschlagen und „Befehle und Fähigkeiten" im „+" — sie holen etwas
   *     herein wie ein Anhang;
   *   · Agent, Besprechung, Protokoll und die Einstellungen im ⋯ des Kopfs
   *     — eigene Flächen, im Chat selten.
   * Die Tabelle mit jedem der 19 und seinem Grund steht in E724.
   */
  const bindePanel = () => {
    const ta = document.getElementById('ai-input') as HTMLTextAreaElement | null;
    const chat = document.getElementById('chat');

    /* Die Palette liest die häufigen KI-Befehle aus dem Katalog (E724) —
       vorher hielt `wissen/werkzeuge.ts` vier Abschriften mit eigenen
       Vorgaben. Einmal anmelden; `meldeLieferant` weist Doppelte ab. */
    if (typeof Register !== 'undefined' && Register.befehle && kiKatalog())
      Register.befehle.meldeLieferant(kiPalette);

    /* Ein Schreiber, viele Leser: wer immer eine Quelle umschaltet (das
       Fenster, die Einstellungen), hier ziehen Schalter und Schild mit. */
    if (typeof Ereignisse !== 'undefined' && typeof ARTEN !== 'undefined')
      Ereignisse.horche(ARTEN.kiQuellenGeaendert, () => quellenAbgleichen());
    quellenSchild();

    if (!ta) return;
    ta.addEventListener('keydown', e => {
      /* Steht „Eingabetaste macht eine neue Zeile" an, wird mit Strg+Enter
         gesendet — das ist Notions Eingabeoption. */
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
      /* Ein getipptes „@" am Wortanfang öffnet die Wahl (E724). */
      if (!(e instanceof InputEvent) || e.data !== '@') return;
      const pos = ta.selectionStart ?? ta.value.length;
      if (ta.value.charAt(pos - 1) === '@' && (pos === 1 || /\s/.test(ta.value.charAt(pos - 2))))
        erwaehnenMenue(ta, ta, true, pos - 1);
    });

    /* Die Knöpfe im leeren Chat tragen eine Katalogkennung (`data-ki`). */
    document.querySelectorAll<HTMLElement>('.ai-start [data-ki]').forEach(b => {
      /* Die Markierung beim Drücken merken — bis zum Klick kann sie weg sein. */
      let gemerkt: KiMarke | null = null;
      b.addEventListener('pointerdown', () => { gemerkt = markierung(); });
      b.addEventListener('click', () => {
        const mark = gemerkt || markierung();
        gemerkt = null;
        void ausfuehren(b.dataset.ki || '', { mark });
      });
    });

    /* --- Die Leiste unter dem Eingabefeld ------------------------------- */
    const modusKnopf = document.getElementById('ai-modus');
    const modusZeigen = () => {
      if (modusKnopf) modusKnopf.textContent = zustand.modus === 'fragen' ? 'Fragen' : 'Standard';
    };
    modusZeigen();

    /* Der Modus wohnt an EINEM Ort: an diesem Knopf, dazu Shift+Tab im
       Feld (E724). Das doppelte „Modus ▸" im Quellenmenü ist weg — sein „▸"
       versprach ein Untermenü und schaltete sofort um. */
    const modusWechseln = () => {
      zustand.modus = zustand.modus === 'fragen' ? 'standard' : 'fragen';
      modusZeigen();
      UI.toast(zustand.modus === 'fragen'
        ? 'Fragen: die KI antwortet nur, sie ändert nichts'
        : 'Standard: die KI darf suchen, bauen und ändern');
    };
    modusKnopf?.addEventListener('click', (e) => {
      const knopf = e.currentTarget;
      if (!(knopf instanceof HTMLElement)) return;
      const r = knopf.getBoundingClientRect();
      const m = UI.menu(
        `<button data-m="standard"><span class="mi">✎</span>Standard` +
          '<span class="sub">Kann suchen, bearbeiten und mehr</span>' +
          (zustand.modus === 'standard' ? '<span class="ms">✓</span>' : '') + '</button>' +
        `<button data-m="fragen"><span class="mi">💬</span>Fragen` +
          '<span class="sub">Nur Antworten, keine Änderungen</span>' +
          (zustand.modus === 'fragen' ? '<span class="ms">✓</span>' : '') + '</button>' +
        '<div class="menu-fuss">Tipp: Mit Shift + Tab durch die Modi wechseln</div>',
        r.left - 120, r.top - 130, { titel: 'Modus' });
      amKnopf(knopf, m);
      m.addEventListener('click', ev => {
        const b = elVon(ev)?.closest<HTMLElement>('[data-m]');
        if (!b) return;
        zustand.modus = b.dataset.m ?? zustand.modus; modusZeigen(); m.remove();
      });
    });

    ta.addEventListener('keydown', e => {
      if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); modusWechseln(); }
    });

    document.getElementById('ai-senden')?.addEventListener('click', () => {
      /* Läuft gerade eine Antwort, ist derselbe Knopf der Stopp-Knopf
         (E652). Erst danach wird das Feld geleert — sonst verlöre man
         seine Frage beim Abbrechen. */
      if (abbrechen()) return;
      const t = ta.value; ta.value = ''; ta.style.height = 'auto'; senden(t);
    });

    document.getElementById('ai-plus')?.addEventListener('click', (e) => {
      const knopf = e.currentTarget;
      if (!(knopf instanceof HTMLElement)) return;
      const r = knopf.getBoundingClientRect();
      const m = UI.menu(
        '<button data-x="datei"><span class="mi">📎</span>Fotos und Dateien hinzufügen</button>' +
        '<button data-x="erwaehnen"><span class="mi">@</span>Seite erwähnen</button>' +
        '<button data-x="bild"><span class="mi">🖼</span>Bild erstellen<span class="ms">neu</span></button>' +
        /* Aus der Schublade (E724): Nachschlagen holt fremden Text herein
           wie ein Anhang — und die Befehle sind eine Tür in die KI. */
        '<button id="ai-wiki" data-x="wiki"><span class="mi">📖</span>Bei Wikipedia nachschlagen</button>' +
        '<button id="ai-faehig" data-x="befehle"><span class="mi">🧩</span>Befehle und Fähigkeiten …</button>',
        r.left, r.top - 220, { titel: 'Hinzufügen', anker: knopf });
      amKnopf(knopf, m);
      m.addEventListener('click', async ev => {
        const b = elVon(ev)?.closest<HTMLElement>('[data-x]');
        if (!b) return;
        m.remove();
        if (b.dataset.x === 'datei') {
          const inp = document.createElement('input');
          inp.type = 'file'; inp.accept = 'image/*,.txt,.md,.csv,.json';
          inp.addEventListener('change', async () => {
            const f = inp.files?.[0]; if (!f) return;
            if (/^image\//.test(f.type)) { ta.value += `\n[Bild: ${f.name}]`; UI.toast('Bilder kann nur ein Modell mit Augen lesen'); return; }
            ta.value += '\n\n' + (await f.text()).slice(0, 6000);
            ta.dispatchEvent(new Event('input'));
          });
          inp.click();
        }
        if (b.dataset.x === 'erwaehnen') erwaehnenMenue(ta, knopf, false);
        if (b.dataset.x === 'bild') {
          const was = await UI.frage('Was soll auf dem Bild sein?', '');
          if (was) senden('Beschreibe ein Bild zu: ' + was +
            '. Gib dann eine SVG-Zeichnung dazu aus, die ich einfügen kann.');
        }
        if (b.dataset.x === 'wiki') await werkzeugAus('nachschlagen');
        if (b.dataset.x === 'befehle') befehlsMenue(knopf, { zuerst: 'faehig' });
      });
    });

    /* Die Quellen am Prompt (E724) — das Schild sagt ohne Aufklappen, was
       die KI sieht; ein Druck öffnet die Schalter. */
    document.getElementById('ai-quellen')?.addEventListener('click', (e) => {
      const knopf = e.currentTarget;
      if (knopf instanceof HTMLElement) quellenMenue(knopf);
    });

    /* Das ⋯ im Kopf (E724). */
    document.getElementById('ai-mehr')?.addEventListener('click', (e) => {
      const knopf = e.currentTarget;
      if (knopf instanceof HTMLElement) mehrMenue(knopf);
    });

    document.getElementById('ai-diktat')?.addEventListener('click', () => diktat(ta));

    /* Redur, 9. September: die beiden Bau-Knöpfe unverändert behalten;
       alle übrigen Aktionen erhalten genau denselben bestehenden Effekt.
       Seit E724 stehen die acht im leeren Chat, nicht in einer Schublade. */
    if (typeof Funkel !== 'undefined') Funkel.alle(document, '.ai-start .ai-quick button');
    document.getElementById('ai-db')?.addEventListener('click', () => { void werkzeugAus('datenbank'); });
    document.getElementById('ai-seite')?.addEventListener('click', () => { void werkzeugAus('seite'); });
    document.getElementById('ai-schreiben')?.addEventListener('click', (e) => schreibMenue(e.currentTarget));

    /* DER VERLAUF, DEN ES SEIT PHASE F NICHT MEHR ZU SEHEN GAB (L93).
       Er stand nur in der Seitenleiste, und die ist am Rechner weg. */
    document.getElementById('ai-verlauf')?.addEventListener('click', () => verlauf());

    document.getElementById('ai-clear')?.addEventListener('click', () => {
      zustand.verlauf = [];
      if (chat) chat.innerHTML = '';
      melde(kontextSatz());
    });

    melde('Alles läuft lokal. Kein Text verlässt deinen Rechner.');
  };

  /** Die häufigen KI-Befehle für die Palette (Strg K) — aus dem Katalog. */
  const kiPalette = () => (kiKatalog()?.alle() || []).filter((b: any) => b.haeufig)
    .map((b: any) => ({ gruppe: 'KI', titel: b.palette || b.name, tun: () => { void ausfuehren(b.id); } }));

  /* Der Weg für die Schale (E233): beim ÖFFNEN des KI-Fensters einmal nach
     Ollama sehen — aber nur, wenn noch keine Quelle steht. Zweimal fragen
     wäre so unnötig wie gar nicht fragen. */
  const sucheOllamaJetzt = async (): Promise<void> => {
    if (zustand.bereit || zustand.quelle === 'ollama') return;
    if (!(await ollamaPruefen())) return;
    zustand.quelle = 'ollama';
    zustand.modell = zustand.ollamaModelle[0]?.id ?? '';
    zustand.bereit = !!zustand.modell;
    if (zustand.bereit) status('ok', kurzName(zustand.modell));
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
