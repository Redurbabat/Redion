/* ============================================================================
 * aussehen.js — Aussehen und Tastenkürzel selbst bestimmen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/einstellungen/ansicht/aussehen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/einstellungen/ansicht/aussehen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notion lässt genau zwei Dinge zu: hell oder dunkel, und drei Schriften auf
 * der Seite. Sonst nichts. Hier gibt es:
 *
 *   · zehn Farbschemata, hell wie dunkel, dazu eine frei wählbare Akzentfarbe
 *     — zwei davon sind der Look des Touch Kits (E699)
 *   · Schriftart und Schriftgrösse für die ganze App, nicht nur je Seite
 *   · Zeilenabstand und Seitenbreite
 *   · umbelegbare Tastenkürzel — Notions Kürzel sind fest verdrahtet
 *
 * Alles liegt im Speicher der App und wird beim Start wieder gesetzt.
 * ==========================================================================*/

const Aussehen = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ========================================================================
   * FARBSCHEMATA
   * ------------------------------------------------------------------------
   * Jedes Schema setzt nur die wenigen Grundwerte; alles andere leitet sich
   * daraus ab. „grund" sagt, ob darüber das helle oder das dunkle Grundgerüst
   * gilt.
   * ======================================================================*/
  /* STANDARD UND HELL TRAGEN KEINEN EIGENEN AKZENT, und das ist der Punkt:
     ein Inline-Stil auf `documentElement` schlägt jedes Stilblatt. Solange
     hier `#2eaadc` stand, konnte `dunkel.css` seinen Akzent gar nicht
     durchsetzen — die Nocturne-Farbe war gesetzt und blieb unsichtbar.

     Schlimmer noch: EIN Wert kann für hell und dunkel nicht beide richtig
     sein. Das Orange, das auf Schwarz mit 6.6:1 leuchtet, kommt auf Weiss
     auf 2.8:1 — unter jeder Lesbarkeitsgrenze. Genau deshalb steht der
     Akzent jetzt in `dunkel.css` und `hell.css`, jeder mit seinem eigenen,
     nachgerechneten Wert. Die anderen Schemata setzen ihn weiter selbst;
     sie bringen ja auch ihre eigenen Flächen mit. */
  const SCHEMATA = [
    { id: 'standard', name: 'Standard', grund: 'dark',  akzent: '', werte: {} },
    { id: 'hell',     name: 'Hell',     grund: 'light', akzent: '', werte: {} },
    { id: 'nacht',    name: 'Mitternacht', grund: 'dark', akzent: '#6c8cff', werte: {
        '--bg': '#0f1117', '--bg-side': '#141824', '--bg-card': '#1a1f2e',
        '--bg-hover': '#232838', '--bg-input': '#1d2231',
        '--line': '#2a3040', '--line-soft': '#20263a', '--text': '#e6e9f2' } },
    { id: 'wald',     name: 'Wald',     grund: 'dark',  akzent: '#5cbf8a', werte: {
        '--bg': '#131a15', '--bg-side': '#18211a', '--bg-card': '#1e2921',
        '--bg-hover': '#26332a', '--bg-input': '#1c2620',
        '--line': '#2c3a30', '--line-soft': '#233028', '--text': '#e4ece6' } },
    { id: 'sand',     name: 'Sand',     grund: 'light', akzent: '#b1743a', werte: {
        '--bg': '#faf6ef', '--bg-side': '#f3ece0', '--bg-card': '#efe6d6',
        '--bg-hover': '#e8dcc8', '--bg-input': '#f6f1e8',
        '--line': '#ddd0ba', '--line-soft': '#e8ddcc', '--text': '#3a3227' } },
    { id: 'papier',   name: 'Papier',   grund: 'light', akzent: '#555', werte: {
        '--bg': '#ffffff', '--bg-side': '#fbfbfa', '--bg-card': '#f6f6f5',
        '--bg-hover': '#efefee', '--bg-input': '#f8f8f7',
        '--line': '#e3e3e1', '--line-soft': '#eeeeec', '--text': '#242424' } },
    { id: 'kontrast', name: 'Starker Kontrast', grund: 'dark', akzent: '#ffd400', werte: {
        '--bg': '#000000', '--bg-side': '#0a0a0a', '--bg-card': '#141414',
        '--bg-hover': '#1f1f1f', '--bg-input': '#111111',
        '--line': '#7a7a7a', '--line-soft': '#4a4a4a',
        '--text': '#ffffff', '--text-dim': '#e0e0e0', '--text-faint': '#b5b5b5' } },
    { id: 'rose',     name: 'Rosé',     grund: 'dark',  akzent: '#e06a94', werte: {
        '--bg': '#1a1418', '--bg-side': '#221a20', '--bg-card': '#2a2027',
        '--bg-hover': '#33262e', '--bg-input': '#261d23',
        '--line': '#3d2f37', '--line-soft': '#2f242b', '--text': '#f0e6ec' } },
    /* DER LOOK DES TOUCH KITS (E699). Redur, 27. September 2026: „Also
       beiden bei der ausehen dort aollte ich die fraben ändern kann" — die
       Bauteile des Kits tragen Redions Farben (die Brücke in
       `src/islands/bridge.css`), UND der Kit-Look steht hier als Schema.

       ZWEI KARTEN, WIE „Standard" UND „Hell": ein Schema gehört in Redion zu
       EINEM Grundton, und die Staffelei merkt sich je Grundton das zuletzt
       gewählte (`studio:schema-light`/`-dark`). Wer einmal beide gewählt
       hat, wechselt mit der Staffelei zwischen ihnen hin und her.

       Die Werte sind die Palette aus `fremd/touch/tokens.css` (UI-Kit
       @c192821), Rolle für Rolle auf Redions Marken gelegt:

           Kit                     Redion
           bg                      --bg
           surface-sunken          --bg-side, --bg-input (dunkel)
           surface                 --bg-card
           fill über surface       --bg-hover (hell), --bg-press, --bg-input (hell)
           surface-raised          --bg-hover (dunkel)
           separator · fill        --line · --line-soft
           label · secondary · tertiary   --text · --text-dim · --text-faint
           accent · pressed · soft · on-accent
                                   --accent · --accent-hover · --accent-schwach · --auf-accent
           danger · success · warning · info
                                   --gefahr · --erfolg · --warnung · --info

       Wo das Kit keine eigene Farbe hat (gedrückt, Eingabefeld), steht die
       Füllung des Kits über seiner Fläche ausgerechnet, nicht geschätzt.
       Mehr Rollen als die anderen Schemata, und zwar mit Absicht: der dunkle
       Akzent des Kits ist ein HELLES Violett (#a39dff), und Weiss darauf
       hätte 2,38 : 1 — also bringt das Schema seine Schrift auf dem Akzent
       mit (#0b0a1a, 8,23 : 1). `test47` hält diese Schrift fest; `test510`
       misst die Leisten des PDF-Studios in allen zehn. */
    { id: 'touchkit-hell', name: 'Touch Kit hell', grund: 'light', akzent: '#5345e0', werte: {
        '--bg': '#f3f2f8', '--bg-side': '#e9e9ef', '--bg-card': '#ffffff',
        '--bg-hover': '#eeeef1', '--bg-press': '#e3e2e8', '--bg-input': '#eeeef1',
        '--line': 'rgba(56,52,78,.26)', '--line-soft': 'rgba(116,112,138,.12)',
        '--text': '#0b0b10', '--text-dim': '#5e5e6b', '--text-faint': '#7a7a86',
        '--auf-accent': '#ffffff', '--accent-text': '#5345e0', '--accent-hover': '#4336c8',
        '--accent-schwach': 'rgba(83,69,224,.12)',
        '--gefahr': '#b81c3c', '--erfolg': '#0f766e', '--warnung': '#b45309', '--info': '#0e7490' } },
    { id: 'touchkit-dunkel', name: 'Touch Kit dunkel', grund: 'dark', akzent: '#a39dff', werte: {
        '--bg': '#000000', '--bg-side': '#0e0e11', '--bg-card': '#1c1c21',
        '--bg-hover': '#2a2a31', '--bg-press': '#3e3c49', '--bg-input': '#0e0e11',
        '--line': 'rgba(86,84,98,.6)', '--line-soft': 'rgba(122,118,144,.24)',
        '--text': '#f5f5f8', '--text-dim': '#a2a2ae', '--text-faint': '#84848f',
        '--auf-accent': '#0b0a1a', '--accent-text': '#a39dff', '--accent-hover': '#b6b1ff',
        '--accent-schwach': 'rgba(143,136,255,.18)',
        '--gefahr': '#ff7088', '--erfolg': '#2dd4bf', '--warnung': '#fbbf24', '--info': '#22d3ee' } }
  ];

  const SCHRIFTEN = [
    ['system', 'System', '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'],
    ['inter',  'Serifenlos', '"Inter", "Segoe UI", Helvetica, Arial, sans-serif'],
    ['serif',  'Serif',   'Lyon-Text, Georgia, "Times New Roman", ui-serif, serif'],
    ['mono',   'Monospace', '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace'],
    ['lesbar', 'Gut lesbar', '"Atkinson Hyperlegible", "Verdana", "Segoe UI", sans-serif']
  ];

  /* Die ruhige Fassung liegt NICHT in `aussehen`, sondern unter dem eigenen
     Schlüssel `ruhig` — dort, wo `schale/aufbau/ruhig.ts` sie liest. Zwei
     Speicherplätze für dieselbe Sache wären genau die Doppelung, gegen die
     E219 antritt. Hier steht nur die Bedienung. */
  const ruhigAn = (): boolean =>
    typeof Ruhig !== 'undefined' ? Ruhig.an() : Store.getMeta('ruhig', true) !== false;

  const einstellung = (): Record<string, any> => Object.assign({
    schema: 'standard', akzent: '', schrift: 'system', groesse: 100,
    abstand: 'normal', breite: 'normal'
  }, Store.getMeta('aussehen', {}) || {});

  const anwenden = (e?: Record<string, any>): void => {
    const s = e || einstellung();
    /* Die Listen sind nie leer — aber `find` und `[0]` geben beide
       `undefined`, und ohne Schema gäbe es hier nichts anzuwenden. Ein
       stiller Abbruch ist besser als eine halb gesetzte Oberfläche. */
    const sch = SCHEMATA.find(x => x.id === s.schema) ?? SCHEMATA[0];
    if (!sch) return;
    const w = document.documentElement;

    /* Erst alles zurücksetzen, was ein früheres Schema gesetzt hat */
    (w.dataset['gesetzt'] || '').split(' ').filter(Boolean)
      .forEach(v => w.style.removeProperty(v));

    w.dataset['theme'] = sch.grund;
    const gesetzt: string[] = [];
    Object.entries<string>(sch.werte).forEach(([k, v]) => { w.style.setProperty(k, v); gesetzt.push(k); });
    const akz = s.akzent || sch.akzent;
    if (akz) { w.style.setProperty('--accent', akz); gesetzt.push('--accent'); }
    const font = (SCHRIFTEN.find(f => f[0] === s.schrift) ?? SCHRIFTEN[0])?.[2];
    if (font) { w.style.setProperty('--font', font); gesetzt.push('--font'); }
    w.dataset['gesetzt'] = gesetzt.join(' ');

    document.body.style.fontSize = (s.groesse || 100) + '%';
    document.body.dataset['abstand'] = s.abstand || 'normal';
    document.body.dataset['breite']  = s.breite  || 'normal';
    /* Damit der alte Hell/Dunkel-Schalter weiter das Richtige tut */
    Store.setMeta('theme', sch.grund);
  };

  const setzen = (patch: Record<string, any>): Record<string, any> => {
    const neu = Object.assign(einstellung(), patch);
    Store.setMeta('aussehen', neu);
    anwenden(neu);
    return neu;
  };

  /* ========================================================================
   * TASTENKÜRZEL UMBELEGEN
   * ------------------------------------------------------------------------
   * Die Liste sagt, was es gibt und was von Haus aus gilt. Wer etwas ändert,
   * legt nur die Abweichung ab. Beim Drücken fragt der Rest der App hier
   * nach: „ist das gerade der Befehl X?"
   * ======================================================================*/
  const KUERZEL = [
    ['suche',      'Suchen',                    'Ctrl+K'],
    ['palette',    'Befehle',                   'Ctrl+P'],
    ['neu',        'Neue Seite',                'Ctrl+N'],
    ['ki',         'KI-Bereich',                'Ctrl+J'],
    ['chat',       'Neuer Chat',                'Ctrl+O'],
    ['seitenleiste','Seitenleiste ein und aus', 'Ctrl+\\'],
    /* Nicht Ctrl+T und Ctrl+W: die gibt der Browser nicht her, und dann
       geschieht beides. Siehe `schale/aufbau/reiter.ts`. */
    ['reiterNeu',  'Neuer Reiter',              'Ctrl+Alt+N'],
    ['reiterZu',   'Reiter schliessen',         'Ctrl+Alt+W'],
    ['teilen',     'Geteilte Ansicht',          'Ctrl+Alt+S'],
    ['zurueck',    'Zurück',                    'Ctrl+['],
    ['vor',        'Vorwärts',                  'Ctrl+]'],
    ['hell',       'Hell und dunkel',           'Ctrl+Shift+L'],
    ['hilfe',      'Tastenkürzel zeigen',       'Ctrl+/'],
    ['favorit',    'Zu Favoriten',              'Ctrl+Shift+D'],
    ['einstellung','Einstellungen',             'Ctrl+,'],
    ['fett',       'Fett',                      'Ctrl+B'],
    ['kursiv',     'Kursiv',                    'Ctrl+I'],
    ['unter',      'Unterstrichen',             'Ctrl+U'],
    ['durch',      'Durchgestrichen',           'Ctrl+Shift+S'],
    ['codeText',   'Code im Text',              'Ctrl+E'],
    /* Im Editor mit Auswahl; ohne Auswahl bleibt Ctrl+K die globale Suche. */
    ['link',       'Link setzen',               'Ctrl+K'],
    ['duplizieren','Block duplizieren',         'Ctrl+D']
  ];

  /* Nur globale Befehle, für die `schale.ts` tatsächlich einen Aufruf
     besitzt, dürfen hier umbelegt werden. Formatierung und Blockaktionen
     hängen am Editor-Kontext; sie im Dialog anzubieten, ohne den neuen
     Griff dort auszuwerten, war ein falsches Versprechen. */
  const UMBELEGBAR = new Set([
    'suche', 'palette', 'neu', 'ki', 'chat', 'seitenleiste',
    'reiterNeu', 'reiterZu', 'teilen', 'zurueck', 'vor', 'hell',
    'hilfe', 'einstellung'
  ]);

  /* Browser- und Bearbeitungskürzel, die eine Web-App nicht neu vergeben
     darf. Der Default-Konflikttest schützte nur den Auslieferungszustand;
     über den Dialog konnte man danach trotzdem Strg+C oder Strg+W stehlen. */
  const RESERVIERT = new Set([
    'ctrl+c', 'ctrl+v', 'ctrl+x', 'ctrl+a', 'ctrl+z', 'ctrl+y',
    'ctrl+b', 'ctrl+i', 'ctrl+u', 'ctrl+e', 'ctrl+d', 'ctrl+k',
    'ctrl+l', 'ctrl+f', 'ctrl+r', 'ctrl+shift+r', 'ctrl+s',
    'ctrl+t', 'ctrl+shift+t', 'ctrl+w', 'ctrl+shift+w',
    'ctrl+tab', 'ctrl+shift+tab', 'ctrl+shift+s', 'ctrl+shift+m',
    'ctrl+1', 'ctrl+2', 'ctrl+3', 'ctrl+4', 'ctrl+5',
    'ctrl+6', 'ctrl+7', 'ctrl+8', 'ctrl+9'
  ]);

  const normalisiereTaste = (text: unknown): string =>
    String(text ?? '').trim().toLowerCase().replace(/\s+/g, '');
  const reserviert = (text: unknown): boolean => RESERVIERT.has(normalisiereTaste(text));
  const umbelegbar = (): string[] => [...UMBELEGBAR];

  const eigene = (): Record<string, string> => {
    const roh = (Store.getMeta('kuerzel', {}) || {}) as Record<string, string>;
    return Object.fromEntries(Object.entries(roh)
      .filter(([id, taste]) => UMBELEGBAR.has(id) && typeof taste === 'string'));
  };

  const kuerzelVon = (id: string): string => {
    const e = eigene();
    if (e[id]) return e[id];
    return KUERZEL.find(k => k[0] === id)?.[2] ?? '';
  };

  /** Aus einem Tastenereignis die Schreibweise „Ctrl+Shift+K" machen. */
  const alsText = (ev: KeyboardEvent): string => {
    const t = [];
    if (ev.ctrlKey || ev.metaKey) t.push('Ctrl');
    if (ev.altKey)   t.push('Alt');
    if (ev.shiftKey) t.push('Shift');
    let k = ev.key;
    if (k === ' ') k = 'Space';
    if (k.length === 1) k = k.toUpperCase();
    if (['Control','Meta','Alt','Shift'].includes(k)) return t.join('+');
    t.push(k);
    return t.join('+');
  };

  /** Passt dieses Ereignis zum Befehl? */
  const ist = (id: string, ev: KeyboardEvent): boolean => {
    const soll = kuerzelVon(id);
    if (!soll) return false;
    return alsText(ev).toLowerCase() === soll.toLowerCase();
  };

  /* ========================================================================
   * DIALOG
   * ======================================================================*/
  const dialog = (): void => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(780px,95vw)">' +
        '<div class="fh">🎨 Aussehen und Tasten<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="au-reiter">' +
          '<button data-r="farbe" class="an">Farben</button>' +
          '<button data-r="schrift">Schrift und Layout</button>' +
          '<button data-r="tasten">Tastenkürzel</button>' +
        '</div>' +
        '<div class="au-koerper" id="au-inhalt"></div>' +
        '<div class="fbtns">' +
          '<button data-a="zurueck">Auf Standard zurück</button>' +
          '<button data-a="zu" class="prim">Fertig</button></div>' +
      '</div>';
    document.body.appendChild(o);

    const inhalt = o.querySelector('#au-inhalt');
    /* Der Kasten steht in der Zeichenkette oben — ohne ihn gäbe es keinen
       Ort für die Einstellungen, und die Überlagerung bliebe leer stehen. */
    if (!inhalt) { o.remove(); return; }
    let reiter = 'farbe';

    const zeichne = (): void => {
      const s = einstellung();
      if (reiter === 'farbe') {
        inhalt.innerHTML =
          /* DIE STAFFELEI (E462) steht über den Karten: sie wechselt den
             GRUNDTON, die Karten wählen das Schema darunter. Der Platz
             wird unten mit dem Bauteil gefüllt — ein Umschalter ist ein
             Element mit Zustand, keine Zeichenkette. */
          '<div class="au-staffelei" id="au-staffelei"></div>' +
          '<div class="au-titel">Farbschema</div>' +
          '<div class="au-schemata">' + SCHEMATA.map(x => {
            const bg = x.werte['--bg'] || (x.grund === 'light' ? '#ffffff' : '#191919');
            const side = x.werte['--bg-side'] || (x.grund === 'light' ? '#fbfbfa' : '#202020');
            const tx = x.werte['--text'] || (x.grund === 'light' ? '#37352f' : '#e9e9e7');
            return `<button data-s="${x.id}" class="au-karte${s.schema === x.id ? ' an' : ''}">` +
              `<span class="au-probe" style="background:${bg}">` +
                `<i style="background:${side}"></i>` +
                `<b style="background:${x.akzent}"></b>` +
                `<u style="background:${tx}"></u></span>` +
              `<span class="au-name">${esc(x.name)}</span></button>`;
          }).join('') + '</div>' +
          '<div class="au-titel">Akzentfarbe</div>' +
          '<div class="au-akzente">' +
            /* ACHT FARBFELDER OHNE EIN EINZIGES WORT. Weder Titel noch
               Marke, und welches gewählt war, stand allein in der Umrandung
               — bei einem FARBwähler ist das die Regel aus §38 in Reinform.
               `nh-farben` machte es längst richtig; hier stand es nicht. */
            ['#2eaadc','#6c8cff','#5cbf8a','#e0a33a','#e06a94','#9a6dd7','#ff7369','#8a8a8a']
              .map(c => `<button data-akz="${c}" style="background:${c}" ` +
                        `title="${Farben.nachHex(c)}" aria-label="${Farben.nachHex(c)}" ` +
                        `aria-pressed="${(s.akzent || '') === c ? 'true' : 'false'}" ` +
                        `class="${(s.akzent || '') === c ? 'an' : ''}">` +
                        `${(s.akzent || '') === c ? '✓' : ''}</button>`).join('') +
            '<input type="color" id="au-frei" value="' + (s.akzent || '#2eaadc') + '" ' +
              'title="Eigene Farbe wählen">' +
            '<button data-akz="" class="au-zurueck">wie im Schema</button>' +
          '</div>';
        const platz = inhalt.querySelector<HTMLElement>('#au-staffelei');
        if (platz && typeof Staffelei !== 'undefined') {
          const grund = SCHEMATA.find(x => x.id === s.schema)?.grund || 'dark';
          platz.append(Staffelei.bauen({
            hell: grund === 'light',
            beiWechsel: () => {
              /* DIESELBE REGEL WIE IM STUDIO-KOPF (studio.ts): das zuletzt
                 benutzte Schema des Ziel-Grundtons, sonst Hell bzw.
                 Standard. Zwei Umschalter, eine Regel (§8).

                 VON WO, sagt das GESPEICHERTE Schema — nicht der Knopf.
                 Der kann hinterherhinken, wenn anderswo gewechselt wurde;
                 dann stünde das dunkle Schema unter dem hellen Schlüssel,
                 und der nächste Wechsel liefe ins Leere. */
              const jetzt = einstellung();
              const jetztGrund = SCHEMATA.find(x => x.id === jetzt.schema)?.grund || 'dark';
              const hell = jetztGrund === 'dark';
              const von = jetztGrund, zu = hell ? 'light' : 'dark';
              Store.setMeta('studio:schema-' + von, jetzt.schema);
              const gemerkt = Store.getMeta('studio:schema-' + zu, hell ? 'hell' : 'standard');
              const ziel = SCHEMATA.find(x => x.id === gemerkt && x.grund === zu);
              setzen({ schema: ziel?.id || (hell ? 'hell' : 'standard'), akzent: '' });
              zeichne();
            }
          }).element);
        }
      }
      if (reiter === 'schrift') {
        inhalt.innerHTML =
          '<div class="au-titel">Schriftart der ganzen App</div>' +
          '<div class="au-liste">' + SCHRIFTEN.map(f =>
            `<button data-f="${f[0]}" class="${s.schrift === f[0] ? 'an' : ''}" ` +
            `style="font-family:${f[2]}">${esc(f[1])}</button>`).join('') + '</div>' +
          '<div class="au-titel">Schriftgrösse <span>' + s.groesse + ' %</span></div>' +
          '<input type="range" id="au-gr" min="80" max="140" step="5" value="' + s.groesse + '">' +
          '<div class="au-titel">Zeilenabstand</div>' +
          '<div class="au-liste">' + [['eng','Eng'],['normal','Normal'],['weit','Weit']].map(([i, n]) =>
            `<button data-ab="${i}" class="${s.abstand === i ? 'an' : ''}">${n}</button>`).join('') + '</div>' +
          '<div class="au-titel">Seitenbreite</div>' +
          '<div class="au-liste">' + [['schmal','Schmal'],['normal','Normal'],['breit','Breit'],['voll','Volle Breite']]
            .map(([i, n]) => `<button data-br="${i}" class="${s.breite === i ? 'an' : ''}">${n}</button>`).join('') +
          '</div>' +
          '<div class="au-hinweis">Die Schriftwahl je Seite (Standard, Serif, Mono) bleibt daneben ' +
          'bestehen — sie sticht diese Einstellung für die eine Seite.</div>' +
          /* RUHIGE OBERFLÄCHE (E219). Der Schalter steht hier, weil er
             dasselbe entscheidet wie Zeilenabstand und Seitenbreite: wie
             viel Platz die Oberfläche für sich selbst nimmt. Der Hinweis
             nennt den Weg zurück ausdrücklich — ein Schalter, nach dem man
             die halbe Seitenleiste sucht, ist ein schlechter Schalter. */
          '<div class="au-titel">Ruhige Oberfläche</div>' +
          '<div class="au-liste">' +
            ['<button data-ruhig-schalter="an" class="' + (ruhigAn() ? 'an' : '') +
               '">Fünf Wege</button>',
             '<button data-ruhig-schalter="aus" class="' + (ruhigAn() ? '' : 'an') +
               '">Alles zeigen</button>'].join('') +
          '</div>' +
          '<div class="au-hinweis">Mit „Fünf Wege" zeigt die Seitenleiste Heute, ' +
          'Lernzentrum, Elektro, Bibliothek und Aufgaben; alles Übrige steht hinter ' +
          '„Mehr" ganz unten (Strg + M). Die Kopfzeile gibt fünf Zeichen an das ' +
          '⋯-Menü ab, und das Menüband erscheint, sobald eine Seite offen ist. ' +
          'Entfernt wird nichts.</div>';
      }
      if (reiter === 'tasten') {
        const e = eigene();
        inhalt.innerHTML =
          '<div class="au-hinweis">Auf ein Kürzel klicken, dann die gewünschten Tasten drücken. ' +
          'Esc bricht ab, Entf setzt zurück. Browser- und Bearbeitungstasten wie ' +
          'Strg+C, Strg+V, Strg+R und Strg+W bleiben geschützt.</div>' +
          '<div class="au-tasten">' + KUERZEL.filter(([id]) => UMBELEGBAR.has(id ?? '')).map(([id, name]) =>
            `<div class="au-t"><span>${esc(name)}</span>` +
            `<button data-k="${id}" class="${id && e[id] ? 'geaendert' : ''}">` +
            `${esc(kuerzelVon(id ?? ''))}</button></div>`).join('') + '</div>';
      }
    };
    zeichne();

    /* Ein Kürzel neu belegen */
    let faengt: string | null = null;
    const fangen = (ev: KeyboardEvent): void => {
      const id = faengt;
      if (!id) return;
      ev.preventDefault(); ev.stopPropagation();
      if (ev.key === 'Escape') { faengt = null; zeichne(); return; }
      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        const e = eigene(); delete e[id];
        Store.setMeta('kuerzel', e);
        faengt = null; zeichne(); return;
      }
      if (['Control','Meta','Alt','Shift'].includes(ev.key)) return;
      const neu = alsText(ev);
      /* Der globale Ausführer arbeitet absichtlich nur mit Ctrl/Cmd-
         Kombinationen. Eine einzelne Taste hier zu speichern sah nach
         Erfolg aus und konnte anschliessend nie auslösen. */
      if (!(ev.ctrlKey || ev.metaKey)) {
        UI.toast('Bitte Strg oder Cmd zusammen mit der Taste verwenden');
        return;
      }
      if (reserviert(neu)) {
        UI.toast('„' + neu + '“ gehört dem Browser oder der Textbearbeitung');
        return;
      }
      const doppelt = KUERZEL.filter(([k]) => UMBELEGBAR.has(k ?? '')).find(([k]) => k !== id &&
        kuerzelVon(k ?? '').toLowerCase() === neu.toLowerCase());
      if (doppelt) { UI.toast('„' + neu + '" ist schon für „' + doppelt[1] + '" belegt'); return; }
      const e = eigene(); e[id] = neu;
      Store.setMeta('kuerzel', e);
      UI.toast('Neu belegt: ' + neu);
      faengt = null; zeichne();
    };
    document.addEventListener('keydown', fangen, true);

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) {
        document.removeEventListener('keydown', fangen, true);
        o.remove(); return;
      }
      const r = elVon(e)?.closest<HTMLElement>('[data-r]');
      if (r?.dataset['r']) {
        reiter = r.dataset['r'];
        o.querySelectorAll<HTMLElement>('.au-reiter button').forEach(b =>
          b.classList.toggle('an', b.dataset['r'] === reiter));
        zeichne(); return;
      }
      const s2 = elVon(e)?.closest<HTMLElement>('[data-s]');
      if (s2) { setzen({ schema: s2.dataset['s'], akzent: '' }); zeichne(); return; }
      const akz = elVon(e)?.closest<HTMLElement>('[data-akz]');
      if (akz) { setzen({ akzent: akz.dataset['akz'] }); zeichne(); return; }
      const f = elVon(e)?.closest<HTMLElement>('[data-f]');
      if (f) { setzen({ schrift: f.dataset['f'] }); zeichne(); return; }
      const ab = elVon(e)?.closest<HTMLElement>('[data-ab]');
      if (ab) { setzen({ abstand: ab.dataset['ab'] }); zeichne(); return; }
      const br = elVon(e)?.closest<HTMLElement>('[data-br]');
      if (br) { setzen({ breite: br.dataset['br'] }); zeichne(); return; }
      const ru = elVon(e)?.closest<HTMLElement>('[data-ruhig-schalter]');
      if (ru) {
        if (typeof Ruhig !== 'undefined') Ruhig.setzen(ru.dataset['ruhigSchalter'] === 'an');
        /* Das Menüband entscheidet beim Zeichnen, ob es dasteht — es muss
           also neu zeichnen, sonst bleibt es weg (oder da), bis irgendetwas
           anderes es anfasst. */
        if (typeof Menueband !== 'undefined') Menueband.zeichne();
        zeichne();
        return;
      }
      const k = elVon(e)?.closest<HTMLElement>('[data-k]');
      if (k?.dataset['k']) {
        faengt = k.dataset['k'];
        k.textContent = 'Tasten drücken …';
        k.classList.add('faengt');
        return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="zurueck"]')) {
        Store.setMeta('aussehen', {});
        Store.setMeta('kuerzel', {});
        anwenden();
        zeichne();
        UI.toast('Aussehen und Tasten zurückgesetzt');
      }
    });

    o.addEventListener('input', e => {
      const feld = e.target instanceof HTMLInputElement ? e.target : null;
      if (!feld) return;
      if (feld.id === 'au-gr') setzen({ groesse: +feld.value });
      if (feld.id === 'au-frei') setzen({ akzent: feld.value });
    });
    o.addEventListener('change', e => {
      if (e.target instanceof HTMLInputElement && e.target.id === 'au-gr') zeichne();
    });
  };

  const start = (): void => { anwenden(); };

  return { start, anwenden, setzen, einstellung, dialog,
           SCHEMATA, SCHRIFTEN, KUERZEL, kuerzelVon, alsText, ist, eigene,
           reserviert, umbelegbar };
})();

(window as any).Aussehen = Aussehen;
